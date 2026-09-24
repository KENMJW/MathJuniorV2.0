import sqlite3
import json

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

print("================================================================")
print("2. 全量 4D 跃迁沙盒 (Leap Models: 37个模型, 148个推演阶段) 深度审计")
print("================================================================")

lm_rows = c.execute("""
    SELECT model_id, model_name_zh, unlocked_semester, primary_line, 
           carrier_morphing_json, parameter_morphing_json, posture_morphing_json, 
           camouflage_xray_json, story_stages_json 
    FROM leap_sandbox_models
""").fetchall()

NUMERICAL_KEYWORDS = [
    "数值", "对比", "比较", "计算", "平方", "恒等", "面积", "周长", 
    "长度", "距离", "比值", "比例", "角度", "坐标", "等于", "和为", 
    "差为", "积为", "商为", "c²", "a²", "b²", "度数", "恒等于", "定值",
    "=", "∶", "x=", "k=", "r=", "PA", "PB", "OA", "OB", "AC", "BD"
]

leap_audit = []

for row in lm_rows:
    m_id, name_zh, sem, line, carrier_json, param_json, posture_json, camo_json, stages_json = row
    stages = json.loads(stages_json) if stages_json else []
    carrier_spec = json.loads(carrier_json) if carrier_json else {}
    param_spec = json.loads(param_json) if param_json else {}
    camo_spec = json.loads(camo_json) if camo_json else {}

    carrier_options = {opt.get('id'): opt for opt in carrier_spec.get('options', [])}
    slider_keys = {s.get('id') or s.get('param_key') for s in param_spec.get('sliders', [])}
    distractor_layers = {l.get('id') for l in camo_spec.get('distractorLayers', [])}

    for st_idx, stage in enumerate(stages):
        stage_num = stage.get('stage', st_idx + 1)
        title_zh = stage.get('titleZh') or stage.get('title') or ''
        guide_zh = stage.get('guideTextZh') or stage.get('guide_text') or ''
        secret_zh = stage.get('teacherSecretZh') or stage.get('teacher_secret') or ''
        cfg = stage.get('state_config') or {}

        # 检查数值比对需求
        has_num_req = any(k in guide_zh or k in title_zh or k in secret_zh for k in NUMERICAL_KEYWORDS)

        defects = []
        
        # 1. 检查 state_config.carrierId 是否在 carrier_options 中
        c_id = cfg.get('carrierId')
        if c_id and c_id != 'default' and c_id not in carrier_options:
            defects.append(f"DEFECT_CARRIER_NOT_FOUND: carrierId '{c_id}' 未在 carrier_morphing_json 中定义")

        # 2. 检查 sliders 键名是否在 parameter_morphing_json 中
        sliders = cfg.get('sliders', {})
        for sk in sliders:
            if sk not in slider_keys and sk not in {'rotationAngle', 'rot_theta', 'rot_angle', 'theta', 'angle_alpha'}:
                defects.append(f"DEFECT_SLIDER_KEY_MISMATCH: slider '{sk}' 未在 parameter_morphing_json 定义")

        # 3. 检查 activeDistractors 是否在 camouflage_xray_json 中
        distractors = cfg.get('activeDistractors', [])
        for d in distractors:
            if d not in distractor_layers and d != 'default':
                defects.append(f"DEFECT_DISTRACTOR_NOT_FOUND: distractor '{d}' 未在 camouflage_xray_json 定义")

        # 4. 检查文图脱节：分步推演状态下，控制台完全隐藏，画布零文字/零公式/零度数，文案却描述了大量数值与几何量
        if has_num_req:
            defects.append("ISSUE_DEDUCTION_ZERO_METRICS: 分步推演面板隐藏了滑块控制，且画布零数字/零度数/零几何量标注，图文完全脱节")

        leap_audit.append({
            'model_id': m_id,
            'name_zh': name_zh,
            'stage': stage_num,
            'title': title_zh,
            'guide': guide_zh,
            'secret': secret_zh,
            'cfg': cfg,
            'has_num_req': has_num_req,
            'defects': defects
        })

print(f"Total leap stages audited: {len(leap_audit)}")
num_req_stages = [s for s in leap_audit if s['has_num_req']]
print(f"Stages with numerical/metric descriptions: {len(num_req_stages)} / {len(leap_audit)} ({len(num_req_stages)*100//len(leap_audit)}%)")

defective_stages = [s for s in leap_audit if any('DEFECT_' in d for d in s['defects'])]
print(f"Stages with config/carrier/slider key defects: {len(defective_stages)}")
for ds in defective_stages[:10]:
    print(f"  [{ds['model_id']} {ds['name_zh']} Stage {ds['stage']}] {ds['title']}")
    for d in ds['defects']:
        if 'DEFECT_' in d:
            print(f"    -> {d}")
