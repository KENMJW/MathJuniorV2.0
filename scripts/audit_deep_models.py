import sqlite3
import json
import re

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

print("================================================================")
print("1. 全量概念沙盒 (Concept Sandboxes: 46个模型, 138个探究步骤) 深度审计")
print("================================================================")

sb_rows = c.execute("""
    SELECT sandbox_id, point_id, canvas_template, inquiry_guide_zh, 
           inquiry_steps_json, param_sliders_json, drag_points_json, 
           invariants_display_json, visual_elements_json 
    FROM concept_sandboxes
""").fetchall()

# 关键字分类
NUMERICAL_KEYWORDS = [
    "数值", "对比", "比较", "计算", "平方", "恒等", "面积", "周长", 
    "长度", "距离", "比值", "比例", "角度", "坐标", "等于", "和为", 
    "差为", "积为", "商为", "c²", "a²", "b²", "勾股", "度数", "值始终", "恒为"
]

TRANSFORMATION_KEYWORDS = [
    "旋转", "翻折", "折叠", "平移", "投影", "对称", "放大", "缩小", 
    "位似", "动点", "轨迹", "弦图", "割补", "展开", "切线", "外接圆", "内切圆"
]

concept_audit = []

for row in sb_rows:
    s_id, p_id, tpl, guide_zh, steps_json, sliders_json, points_json, inv_json, vis_json = row
    steps = json.loads(steps_json) if steps_json else []
    sliders = json.loads(sliders_json) if sliders_json else []
    points = json.loads(points_json) if points_json else []
    invariants = json.loads(inv_json) if inv_json else []
    visuals = json.loads(vis_json) if vis_json else {}

    slider_dict = {s.get('id') or s.get('param_key'): s for s in sliders if isinstance(s, dict)}
    point_dict = {p.get('id'): p for p in points if isinstance(p, dict)}

    for s_idx, step in enumerate(steps):
        st_num = step.get('step', s_idx + 1)
        st_title = step.get('titleZh') or step.get('title') or ''
        st_guide = step.get('guideTextZh') or step.get('guide_text') or ''
        st_cond = step.get('target_condition') or ''
        
        # 1. 文本是否要求学生对比/观测具体数值或数学式
        num_reqs = [kw for kw in NUMERICAL_KEYWORDS if kw in st_guide or kw in st_title]
        
        # 2. 文本是否要求特定几何形变/载体模式
        trans_reqs = [kw for kw in TRANSFORMATION_KEYWORDS if kw in st_guide or kw in st_title]
        
        # 3. 遥测定义项是否涵盖文本要求的数值
        inv_texts = " ".join([inv.get('textZh', '') + " " + inv.get('text', '') + " " + inv.get('id', '') for inv in invariants if isinstance(inv, dict)])
        
        # 4. 判定是否存在文图脱节/缺陷
        defects = []
        
        # 缺陷A：文本明确要求对比/观察数值，但画布完全无数字，全靠遥测，而遥测在UI默认折叠/滚出可视区
        if num_reqs:
            # 检查遥测是否涵盖
            if not invariants:
                defects.append("DEFECT_NO_TELEMETRY: 文本要求观察数值但invariants_display为空")
            else:
                defects.append("ISSUE_VIEWPORT_SCROLL_HIDE: 文本要求观察数值，但画布零文字标注，且侧栏遥测默认在滚动屏下")
                
        # 缺陷B：具体特殊载体/模式在画布渲染层根本没有对应逻辑
        if "弦图" in st_guide or "view_mode" in st_guide:
            defects.append("DEFECT_MISSING_CARRIER_ZHAOSHUANG: 文本要求切换弦图模式(4个全等三角形拼合)，但画布模板仅有单个直角三角形")
        if "中点四边形" in st_guide and "midpoint" not in tpl:
            defects.append("DEFECT_MISSING_MIDPOINT_QUAD: 文本要求中点四边形，但模板无中点连线")
        if "折叠" in st_guide or "翻折" in st_guide:
            defects.append("DEFECT_MISSING_FOLD_LINE: 文本要求观察折叠对称，但无折痕与虚线镜像")
        if "外接圆" in st_guide and "circle" not in tpl and "visuals" not in str(visuals):
            defects.append("DEFECT_MISSING_CIRCUMCIRCLE: 文本要求外接圆但画布无圆图元")
        if "内切圆" in st_guide and "circle" not in tpl and "visuals" not in str(visuals):
            defects.append("DEFECT_MISSING_INCIRCLE: 文本要求内切圆但画布无圆图元")
            
        # 缺陷C：目标达成条件中的变量合法性校验
        # 检查 target_condition 中引用的变量是否在 sliders 或 points 或预置变量中
        tokens = re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', st_cond)
        js_builtins = {'Math', 'abs', 'min', 'max', 'sqrt', 'hypot', 'round', 'floor', 'ceil', 'PI', 'sin', 'cos', 'tan', 'true', 'false', 'c_len', 'hypotenuse', 'c'}
        point_ids = set(point_dict.keys()) | {p.lower() for p in point_dict.keys()}
        # 线段组合如 CM, AB, OA, OB
        segment_pairs = {p1 + p2 for p1 in point_dict.keys() for p2 in point_dict.keys()} | {p1.lower() + p2.lower() for p1 in point_dict.keys() for p2 in point_dict.keys()}
        slider_keys = set(slider_dict.keys())
        
        unknown_vars = []
        for tok in tokens:
            if tok in js_builtins or tok in point_ids or tok in segment_pairs or tok in slider_keys:
                continue
            # 可能是点坐标如 p_a.x, 或者是 point_t, pos_p
            if tok in {'leg_a', 'leg_b', 'a', 'b', 'k', 'm', 'n', 't', 'x', 'y', 'r', 'p_num', 'q_den', 'param_v', 'param_t', 'param_x0', 'val_a', 'val_b', 'pos_p', 'x_p', 'angle_deg', 'point_t'}:
                continue
            unknown_vars.append(tok)
            
        if unknown_vars:
            defects.append(f"DEFECT_UNKNOWN_VARS_IN_COND: 条件引用了未识别变量 {unknown_vars}")
            
        concept_audit.append({
            'sandbox_id': s_id,
            'point_id': p_id,
            'step': st_num,
            'title': st_title,
            'guide': st_guide,
            'cond': st_cond,
            'num_reqs': num_reqs,
            'trans_reqs': trans_reqs,
            'defects': defects,
            'invariants': invariants,
            'tpl': tpl
        })

print(f"Total concept steps audited: {len(concept_audit)}")
steps_with_num = [s for s in concept_audit if s['num_reqs']]
print(f"Steps requiring numerical observation: {len(steps_with_num)} / {len(concept_audit)} ({len(steps_with_num)*100//len(concept_audit)}%)")

all_defects_concept = [s for s in concept_audit if s['defects']]
print(f"Steps with identified defects/issues: {len(all_defects_concept)} / {len(concept_audit)}")

# 打印出特定载体缺失与变量缺失
carrier_bugs = [s for s in concept_audit if any('DEFECT_' in d for d in s['defects'])]
print(f"\nSevere functional/carrier defects: {len(carrier_bugs)}")
for b in carrier_bugs[:15]:
    print(f"  [{b['sandbox_id']} {b['point_id']} S{b['step']}] {b['title']}")
    for d in b['defects']:
        if 'DEFECT_' in d:
            print(f"    -> {d}")
