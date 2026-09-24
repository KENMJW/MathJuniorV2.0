import sqlite3
import json

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

# 检查 46 个概念沙盒中每个沙盒的变换逻辑和文案吻合度
sb_list = c.execute("""
    SELECT sandbox_id, point_id, canvas_template, inquiry_guide_zh, 
           inquiry_steps_json, param_sliders_json, drag_points_json, 
           invariants_display_json, visual_elements_json 
    FROM concept_sandboxes
    ORDER BY sandbox_id
""").fetchall()

print("="*80)
print("【46 个概念沙盒逐个深度变换与文案匹配核验】")
print("="*80)

discrepancies = []

for sb in sb_list:
    s_id, p_id, tpl, guide_zh, steps_json, sliders_json, points_json, inv_json, vis_json = sb
    steps = json.loads(steps_json) if steps_json else []
    sliders = json.loads(sliders_json) if sliders_json else []
    points = json.loads(points_json) if points_json else []
    invs = json.loads(inv_json) if inv_json else []
    vis = json.loads(vis_json) if vis_json else {}

    slider_names = [s.get('id') or s.get('param_key') for s in sliders]
    point_names = [p.get('id') for p in points]

    for s_idx, st in enumerate(steps):
        s_num = st.get('step', s_idx + 1)
        title = st.get('titleZh') or st.get('title') or ''
        guide = st.get('guideTextZh') or st.get('guide_text') or ''
        cond = st.get('target_condition') or ''

        # 检查1：文案提到的图元在沙盒中是否有对应滑块或动点控制
        issues = []
        if "view_mode" in guide and "view_mode" not in slider_names:
            issues.append(f"文案要求切换 view_mode，但滑块列表中没有 view_mode (仅有 {slider_names})")
        
        if "旋转" in guide and not any(k in str(slider_names) for k in ['rot', 'theta', 'angle']):
            issues.append("文案描述‘旋转’，但没有旋转角滑块驱动几何形变")

        if "翻折" in guide or "折叠" in guide:
            issues.append("文案描述‘折叠/翻折’，但几何定义中无翻折对称点或折痕")

        if "中点四边形" in guide and "midpoint" not in tpl:
            issues.append(f"文案描述‘中点四边形’，但当前模板为 {tpl}，未开启中点连线与中点四边形面")

        if "外接圆" in guide and "circle" not in tpl:
            issues.append("文案描述‘外接圆/外心’，但模板及图元中无圆图元")

        if "内切圆" in guide and "circle" not in tpl:
            issues.append("文案描述‘内切圆/内心’，但模板及图元中无圆图元")

        # 检查2：文案描述的数值关系与invariants_display是否匹配
        # 比如文案说“验证 c² 与 a²+b² 恒等”，检查 invariants 是否有对应项
        if ("平方" in guide or "c²" in guide or "a²+b²" in guide) and not any("c" in inv.get('text', '') or "平方" in inv.get('textZh', '') or "2" in inv.get('text', '') for inv in invs):
            issues.append("文案要求验证平方关系，但遥测 invariants 中没有平方等式")

        if issues:
            discrepancies.append({
                'sandbox_id': s_id,
                'point_id': p_id,
                'step': s_num,
                'title': title,
                'guide': guide,
                'issues': issues
            })

print(f"发现存在明显文图/变换逻辑缺陷的步骤数: {len(discrepancies)}")
for d in discrepancies:
    print(f"\n[{d['sandbox_id']} {d['point_id']} 步骤 {d['step']}] {d['title']}")
    print(f"  文案指引: {d['guide']}")
    for iss in d['issues']:
        print(f"  ⚠️  {iss}")
