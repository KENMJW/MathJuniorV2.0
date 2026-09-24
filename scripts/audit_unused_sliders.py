import sqlite3
import json

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

sb_rows = c.execute("SELECT sandbox_id, point_id, canvas_template, param_sliders_json, drag_points_json FROM concept_sandboxes").fetchall()

with open('src/modules/sandbox/SandboxRenderer.tsx') as f:
    renderer_code = f.read()

print("="*80)
print("【46 个概念沙盒滑块在 SandboxRenderer.tsx 中是否生效审计】")
print("="*80)

phantom_sliders = []

for row in sb_rows:
    s_id, p_id, tpl, sliders_j, pts_j = row
    sliders = json.loads(sliders_j) if sliders_j else []
    pts = json.loads(pts_j) if pts_j else []

    all_constraints = " ".join([p.get('constraints', '') for p in pts])

    for sl in sliders:
        s_name = sl.get('id') or sl.get('param_key')
        if not s_name:
            continue

        # 检查该滑块是否在 Renderer 代码或点约束中被引用
        in_renderer = f"'{s_name}'" in renderer_code or f'"{s_name}"' in renderer_code
        in_constraints = s_name in all_constraints

        # 还有可能作为通用参数如 t, a, b, c, k, r, m, n
        is_generic = s_name in ['a', 'b', 'c', 'k', 'r', 't', 'x', 'y', 'm', 'n', 'theta']

        if not in_renderer and not in_constraints and not is_generic:
            phantom_sliders.append({
                'sandbox_id': s_id,
                'point_id': p_id,
                'slider_id': s_name,
                'slider_title': sl.get('nameZh') or sl.get('name') or '',
                'meaning': sl.get('math_meaning', '')
            })

print(f"完全没有在 SandboxRenderer 或点约束中生效的‘虚假/空壳滑块’ (Phantom Sliders): {len(phantom_sliders)}")
for ps in phantom_sliders:
    print(f"  [{ps['sandbox_id']} {ps['point_id']}] 滑块 '{ps['slider_id']}' ({ps['slider_title']})")
    print(f"     含义: {ps['meaning']}")

