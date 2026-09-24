import sqlite3
import json

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

rows = c.execute("""
    SELECT cs.sandbox_id, cs.point_id, kp.name_zh, cs.canvas_template, 
           cs.inquiry_steps_json, cs.param_sliders_json, cs.invariants_display_json, cs.visual_elements_json
    FROM concept_sandboxes cs
    LEFT JOIN core.db.knowledge_points kp ON cs.point_id = kp.point_id
""").fetchall()

# Attach core.db
c.execute("ATTACH DATABASE 'data/core.db' AS core_db")
rows = c.execute("""
    SELECT cs.sandbox_id, cs.point_id, kp.name_zh, cs.canvas_template, 
           cs.inquiry_steps_json, cs.param_sliders_json, cs.invariants_display_json, cs.visual_elements_json
    FROM concept_sandboxes cs
    LEFT JOIN core_db.knowledge_points kp ON cs.point_id = kp.point_id
    ORDER BY cs.sandbox_id
""").fetchall()

print(f"Total concept sandboxes loaded: {len(rows)}")

matrix = []

for r in rows:
    s_id, p_id, name_zh, tpl, steps_j, sliders_j, invs_j, vis_j = r
    steps = json.loads(steps_j) if steps_j else []
    sliders = json.loads(sliders_j) if sliders_j else []
    invs = json.loads(invs_j) if invs_j else []
    vis = json.loads(vis_j) if vis_j else {}

    slider_keys = [s.get('id') or s.get('param_key') for s in sliders]
    inv_labels = [i.get('labelZh') or i.get('label') or i.get('formula') for i in invs]

    for s_idx, st in enumerate(steps):
        s_num = st.get('step', s_idx + 1)
        title = st.get('titleZh') or st.get('title') or ''
        guide = st.get('guideTextZh') or st.get('guide_text') or ''
        cond = st.get('target_condition') or ''

        # 分析文案在视觉上的可感知度
        # 1. 文本提到的量在画布上是否可见？
        # 目前 SandboxRenderer 没有任何 board.create('text')，所以任何数值在画布上都不可见
        # 2. 文本提到的特殊形态在画布上是否存在？
        special_issues = []
        if "弦图" in guide:
            special_issues.append("无弦图4三角形拼图")
        if "外接圆" in guide or "内切圆" in guide:
            special_issues.append("无外接圆/内切圆")
        if "折叠" in guide:
            special_issues.append("无折痕虚线")
        if "角平分线" in guide and "bisector" not in tpl and "angle" not in tpl:
            special_issues.append("无角平分线射线")

        matrix.append({
            'sandbox_id': s_id,
            'point_id': p_id,
            'name_zh': name_zh,
            'tpl': tpl,
            'step': s_num,
            'title': title,
            'guide': guide,
            'cond': cond,
            'slider_keys': slider_keys,
            'inv_labels': inv_labels,
            'special_issues': special_issues
        })

print(f"Total steps evaluated: {len(matrix)}")
# 抽样打印几何部分和函数部分
print("\n--- 几何模型关键步骤文图对应性抽查 ---")
for m in matrix:
    if any(k in m['title'] for k in ['勾股', '全等', '相似', '中点', '圆', '对称', '垂径', '三角函数']):
        print(f"[{m['sandbox_id']} {m['name_zh']} S{m['step']}] {m['title']}")
        print(f"   文本: {m['guide'][:60]}...")
        print(f"   滑块: {m['slider_keys']}")
        print(f"   遥测: {m['inv_labels'][:2]}")
        if m['special_issues']:
            print(f"   ⚠️  形态缺失: {m['special_issues']}")
