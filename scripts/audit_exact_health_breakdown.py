import sqlite3
import json
import re

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

sb_rows = c.execute("SELECT sandbox_id, point_id, canvas_template, inquiry_steps_json, param_sliders_json, drag_points_json, invariants_display_json FROM concept_sandboxes").fetchall()
lm_rows = c.execute("SELECT model_id, model_name_zh, carrier_morphing_json, parameter_morphing_json, story_stages_json FROM leap_sandbox_models").fetchall()

with open('src/modules/sandbox/SandboxRenderer.tsx') as f:
    renderer_code = f.read()

with open('src/modules/sandbox/morphControllers.ts') as f:
    morph_code = f.read()

print("="*80)
print("【46 个概念沙盒完整健康状态逐一盘点】")
print("="*80)

concept_status = {}

for row in sb_rows:
    sid, pid, tpl, steps_j, sliders_j, pts_j, inv_j = row
    steps = json.loads(steps_j) if steps_j else []
    sliders = json.loads(sliders_j) if sliders_j else []
    pts = json.loads(pts_j) if pts_j else []
    invs = json.loads(inv_j) if inv_j else []

    all_constraints = " ".join([p.get('constraints', '') for p in pts])
    
    # 滑块是否有效
    phantom_sliders = []
    working_sliders = []
    for sl in sliders:
        sname = sl.get('id') or sl.get('param_key')
        if not sname: continue
        in_r = f"'{sname}'" in renderer_code or f'"{sname}"' in renderer_code
        in_c = sname in all_constraints
        is_gen = sname in ['a', 'b', 'c', 'k', 'r', 't', 'x', 'y', 'm', 'n', 'theta']
        if in_r or in_c or is_gen:
            working_sliders.append(sname)
        else:
            phantom_sliders.append(sname)

    # 步骤文本是否有看数需求
    quant_steps = []
    for idx, st in enumerate(steps):
        guide = st.get('guideTextZh') or st.get('guide_text') or ''
        title = st.get('titleZh') or st.get('title') or ''
        if any(kw in guide or kw in title for kw in ["数值", "对比", "比较", "计算", "平方", "恒等", "面积", "周长", "长度", "距离", "比值", "比例", "角度", "坐标", "等于", "和为", "差为", "积为", "商为", "c²", "a²", "b²", "度数", "恒为", "="]):
            quant_steps.append(idx + 1)

    # 载体缺失
    missing_carrier = []
    all_guides = " ".join([(st.get('guideTextZh') or '') for st in steps])
    if "弦图" in all_guides and "zhaoshuang" not in tpl:
        missing_carrier.append("赵爽弦图4三角形拼图缺失")
    if "双圆" in all_guides and "circle" not in tpl:
        missing_carrier.append("四心合一双圆缺失")
    if "折叠" in all_guides and "fold" not in tpl:
        missing_carrier.append("对折重合动画缺失")
    if "中点四边形" in all_guides and "midpoint" not in tpl:
        missing_carrier.append("中点四边形连线缺失")

    # 判定该沙盒的健康等级
    # A: 完美（滑块全有效、无载体缺失）
    # B: 部分滑块失效
    # C: 载体严重缺失
    status = "HEALTHY"
    if missing_carrier:
        status = "CARRIER_DEFECT"
    elif phantom_sliders:
        status = "PHANTOM_SLIDERS"
    
    concept_status[sid] = {
        'point_id': pid,
        'tpl': tpl,
        'status': status,
        'working_sliders': working_sliders,
        'phantom_sliders': phantom_sliders,
        'missing_carrier': missing_carrier,
        'quant_steps': quant_steps
    }

healthy_concept = [k for k, v in concept_status.items() if v['status'] == 'HEALTHY']
phantom_concept = [k for k, v in concept_status.items() if v['status'] == 'PHANTOM_SLIDERS']
carrier_concept = [k for k, v in concept_status.items() if v['status'] == 'CARRIER_DEFECT']

print(f"概念沙盒总数: {len(concept_status)}")
print(f"  • 完全健康（滑块与几何变换全部生效）: {len(healthy_concept)} 个 (例如函数类、部分数轴类)")
print(f"  • 存在空壳滑块（部分滑块拖动无反应）: {len(phantom_concept)} 个")
print(f"  • 存在载体严重缺失（文本承诺模式画布没有）: {len(carrier_concept)} 个")

print("\n--- 概念沙盒中完全健康的模型示例 (前 5 个) ---")
for k in healthy_concept[:5]:
    v = concept_status[k]
    print(f"  [{k} {v['point_id']}] 模板: {v['tpl']}, 有效滑块: {v['working_sliders']}")

print("\n--- 概念沙盒中存在空壳滑块的模型清单 ---")
for k in phantom_concept:
    v = concept_status[k]
    print(f"  [{k} {v['point_id']}] 空壳滑块: {v['phantom_sliders']}, 有效滑块: {v['working_sliders']}")

print("\n--- 概念沙盒中存在载体缺失的模型清单 ---")
for k in carrier_concept:
    v = concept_status[k]
    print(f"  [{k} {v['point_id']}] 缺失载体: {v['missing_carrier']}, 空壳滑块: {v['phantom_sliders']}")
