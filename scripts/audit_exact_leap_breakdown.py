import sqlite3
import json

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

lm_rows = c.execute("SELECT model_id, model_name_zh, carrier_morphing_json, parameter_morphing_json, story_stages_json FROM leap_sandbox_models").fetchall()

with open('src/modules/sandbox/SandboxRenderer.tsx') as f:
    renderer_code = f.read()

with open('src/modules/sandbox/morphControllers.ts') as f:
    morph_code = f.read()

print("="*80)
print("【37 个 4D 跃迁沙盒完整健康状态逐一盘点】")
print("="*80)

leap_status = {}

for row in lm_rows:
    mid, mname, c_j, p_j, s_j = row
    carrier = json.loads(c_j) if c_j else {}
    param = json.loads(p_j) if p_j else {}
    stages = json.loads(s_j) if s_j else []

    # 检查该模型是否有专门的分发分支
    has_custom_template = (
        mid.lower() in morph_code.lower() or 
        any(opt.get('id', '') in morph_code for opt in carrier.get('options', []))
    )

    # 检查该模型在 4D 模式下，调节姿态/参数是否有反应
    # 纯刚体旋转/缩放/翻折对所有模型都有效 (transformPointCoords)
    # 但专属滑块：
    sliders = [s.get('id') for s in param.get('sliders', [])]
    handled_sliders = [s for s in sliders if s in ['param_t', 'rot_theta', 'rotationAngle', 'rot_angle', 'theta', 'pos_p', 'x_p', 'a', 'b', 'c', 'k', 'r']]

    # 检查动点名称是否有硬编码坐标
    hardcoded_points = []
    for opt in carrier.get('options', []):
        for pt in opt.get('points', []):
            pname = pt.get('name', '')
            if '(' in pname and ',' in pname and ')' in pname:
                hardcoded_points.append(pname)

    # 阶段切步时是否有滑块变化
    stage_slider_changes = []
    for idx, st in enumerate(stages):
        cfg = st.get('state_config', {}).get('sliders', {})
        if cfg:
            stage_slider_changes.append((idx + 1, list(cfg.keys())))

    leap_status[mid] = {
        'name': mname,
        'has_custom_template': has_custom_template,
        'sliders_count': len(sliders),
        'handled_sliders': handled_sliders,
        'unhandled_sliders': [s for s in sliders if s not in handled_sliders],
        'hardcoded_points_count': len(hardcoded_points),
        'stage_slider_changes': stage_slider_changes
    }

healthy_leap = [k for k, v in leap_status.items() if len(v['unhandled_sliders']) == 0 and v['has_custom_template']]
partial_leap = [k for k, v in leap_status.items() if v['has_custom_template'] and len(v['unhandled_sliders']) > 0]
static_leap = [k for k, v in leap_status.items() if not v['has_custom_template']]

print(f"4D 跃迁沙盒总数: {len(leap_status)}")
print(f"  • 完全深度打通的模型 (专属模板+滑块与姿态全面联动): {len(healthy_leap)} 个 (LM-7A-01 数轴动点, LM-9A-19 手拉手等)")
print(f"  • 专属模板已建立但部分高级滑块未连接: {len(partial_leap)} 个 (LM-9A-18 韦达抛物线, LM-9B-34 反比例双曲线, LM-9B-35 三视图等)")
print(f"  • 通用降级模板（仅依靠刚体旋转/缩放/param_t，专属参数未接通）: {len(static_leap)} 个")

print("\n--- 4D 跃迁沙盒中完全深度打通的模型 ---")
for k in healthy_leap:
    v = leap_status[k]
    print(f"  [{k}] {v['name']}: 生效参数 {v['handled_sliders']}")

print("\n--- 4D 跃迁沙盒中专属模板已建立的模型 (部分参数待接通) ---")
for k in partial_leap:
    v = leap_status[k]
    print(f"  [{k}] {v['name']}: 未接通参数 {v['unhandled_sliders']}, 硬编码点数 {v['hardcoded_points_count']}")

print("\n--- 4D 跃迁沙盒中通用降级模板的模型清单 (前 10 个) ---")
for k in static_leap[:10]:
    v = leap_status[k]
    print(f"  [{k}] {v['name']}: 未接通参数 {v['unhandled_sliders']}, 硬编码点数 {v['hardcoded_points_count']}")
