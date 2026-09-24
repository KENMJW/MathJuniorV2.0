import sqlite3
import json

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

lm_rows = c.execute("""
    SELECT model_id, model_name_zh, carrier_morphing_json, parameter_morphing_json, 
           posture_morphing_json, camouflage_xray_json, story_stages_json 
    FROM leap_sandbox_models
    ORDER BY model_id
""").fetchall()

with open('src/modules/sandbox/SandboxRenderer.tsx') as f:
    renderer_code = f.read()

with open('src/modules/sandbox/morphControllers.ts') as f:
    morph_code = f.read()

print("="*80)
print("【37 个 4D 跃迁沙盒推演与变异真实生效情况深度审计】")
print("="*80)

leap_results = []

for row in lm_rows:
    m_id, name_zh, carrier_j, param_j, posture_j, camo_j, stages_j = row
    carrier_spec = json.loads(carrier_j) if carrier_j else {}
    param_spec = json.loads(param_j) if param_j else {}
    stages = json.loads(stages_j) if stages_j else []

    carrier_opts = carrier_spec.get('options', [])
    carrier_ids = [opt.get('id') for opt in carrier_opts]
    slider_keys = [s.get('id') or s.get('param_key') for s in param_spec.get('sliders', [])]

    # 检查1：该模型是否在 morphControllers.ts 中有专属的分发逻辑
    has_custom_dispatch = m_id.lower() in morph_code.lower() or m_id in morph_code

    # 检查2：载体变异中，有多少个载体具有真实的几何图元 elements，还是纯文本空壳
    empty_carriers = []
    real_carriers = []
    for opt in carrier_opts:
        cid = opt.get('id')
        elems = opt.get('elements') or opt.get('carrier_elements') or opt.get('points')
        if not elems:
            empty_carriers.append(cid)
        else:
            real_carriers.append(cid)

    # 检查3：4个推演阶段中，切换阶段时 sliders 和 carrier 是否真实导致几何变化
    stage_discrepancies = []
    for s_idx, st in enumerate(stages):
        st_num = st.get('stage', s_idx + 1)
        st_title = st.get('titleZh') or st.get('title') or ''
        st_guide = st.get('guideTextZh') or st.get('guide_text') or ''
        cfg = st.get('state_config', {})
        cfg_sliders = cfg.get('sliders', {})
        cfg_carrier = cfg.get('carrierId')

        # 检查推演阶段要求的滑块参数是否在 Renderer 中有对应实现
        unhandled_sliders = []
        for sk in cfg_sliders:
            if f"'{sk}'" not in renderer_code and f'"{sk}"' not in renderer_code and sk not in ['rot_theta', 'rotationAngle', 'rot_angle', 'theta', 'pos_p', 'x_p', 'a', 'b', 'c', 'k', 'r']:
                unhandled_sliders.append(sk)

        if unhandled_sliders:
            stage_discrepancies.append(f"阶{st_num} 配置的参数 {unhandled_sliders} 在渲染引擎中无响应分支")

    leap_results.append({
        'model_id': m_id,
        'name_zh': name_zh,
        'has_custom_dispatch': has_custom_dispatch,
        'total_carriers': len(carrier_opts),
        'real_carriers': len(real_carriers),
        'empty_carriers': len(empty_carriers),
        'slider_keys': slider_keys,
        'stage_discrepancies': stage_discrepancies
    })

print(f"在 morphControllers.ts 中拥有专属分发逻辑的模型: {sum(1 for r in leap_results if r['has_custom_dispatch'])} / {len(leap_results)}")
print(f"载体完全缺乏 elements 图元定义（属于纯文字空壳）的模型: {sum(1 for r in leap_results if r['empty_carriers'] > 0)} / {len(leap_results)}")

empty_carrier_models = [r for r in leap_results if r['empty_carriers'] > 0]
print(f"\n载体存在空壳的模型详情 (前 10 个):")
for r in empty_carrier_models[:10]:
    print(f"  [{r['model_id']}] {r['name_zh']}: 载体总数 {r['total_carriers']}, 空壳数 {r['empty_carriers']}")

unhandled_stage_models = [r for r in leap_results if r['stage_discrepancies']]
print(f"\n阶段参数在渲染引擎中无响应分支的模型: {len(unhandled_stage_models)}")
for r in unhandled_stage_models[:10]:
    print(f"  [{r['model_id']}] {r['name_zh']}")
    for d in r['stage_discrepancies']:
        print(f"    - {d}")

