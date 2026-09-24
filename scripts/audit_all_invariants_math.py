import sqlite3
import json

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

sb_rows = c.execute("SELECT sandbox_id, point_id, invariants_display_json, param_sliders_json, drag_points_json FROM concept_sandboxes").fetchall()

print("="*80)
print("【46 个概念沙盒遥测公式数学真确性与代数闭环核查】")
print("="*80)

math_bugs = []

for row in sb_rows:
    s_id, p_id, inv_json, slider_json, pt_json = row
    invs = json.loads(inv_json) if inv_json else []
    sliders = json.loads(slider_json) if slider_json else []
    pts = json.loads(pt_json) if pt_json else []

    for inv in invs:
        inv_id = inv.get('id', '')
        inv_type = inv.get('type', '')
        formula = inv.get('formula', '')
        label = inv.get('labelZh', '') or inv.get('label', '')
        deps = inv.get('deps', [])

        # 检查1：type 与 formula 逻辑矛盾
        # 比如 type 是 distance，但 formula 试图表达 c^2 = {val} 或 area = {val}
        if inv_type == 'distance' and ('^2' in formula or '²' in formula or 'S' in formula or '面积' in label or '平方' in label):
            math_bugs.append({
                'sandbox_id': s_id,
                'point_id': p_id,
                'inv_id': inv_id,
                'label': label,
                'type': inv_type,
                'formula': formula,
                'bug': f"type 为 distance（计算线段长度一阶值），但 formula/label 为平方或面积，导致输出错误的一阶数值！例如 c=5 时输出 c²=5"
            })

        # 检查2：角度 type 计算是否在 formula 中误乘或误用
        if inv_type == 'angle' and ('^2' in formula or 'area' in formula):
            math_bugs.append({
                'sandbox_id': s_id,
                'point_id': p_id,
                'inv_id': inv_id,
                'label': label,
                'type': inv_type,
                'formula': formula,
                'bug': "type 为 angle 但标签/公式涉及平方或面积"
            })

        # 检查3：formula 为代数表达式时，deps 是否完整，或者 formula 中是否含有未定义变量
        # 比如 abs(...) < 0.01

print(f"发现的类型与物理量矛盾严重缺陷: {len(math_bugs)} 项")
for b in math_bugs:
    print(f"\n[{b['sandbox_id']} {b['point_id']}] {b['inv_id']} ({b['label']})")
    print(f"  type: {b['type']}, formula: {b['formula']}")
    print(f"  ❌ 错误原因: {b['bug']}")

