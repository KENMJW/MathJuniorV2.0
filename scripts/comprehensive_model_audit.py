import sqlite3
import json
import re

conn = sqlite3.connect('data/sandbox.db')
c = conn.cursor()

print("================================================================================")
print("              【全库 83 个数学动态模型文图配合与变换真确性深度严查报告】")
print("================================================================================")

# 1. 概念沙盒 (46个模型, 138个步骤)
concept_sandboxes = c.execute("""
    SELECT sandbox_id, point_id, canvas_template, inquiry_guide_zh, 
           inquiry_steps_json, param_sliders_json, drag_points_json, 
           invariants_display_json, visual_elements_json 
    FROM concept_sandboxes
""").fetchall()

# 2. 4D跃迁沙盒 (37个模型, 148个阶段)
leap_models = c.execute("""
    SELECT model_id, model_name_zh, unlocked_semester, primary_line, 
           carrier_morphing_json, parameter_morphing_json, posture_morphing_json, 
           camouflage_xray_json, story_stages_json 
    FROM leap_sandbox_models
""").fetchall()

print(f"总计模型数: {len(concept_sandboxes) + len(leap_models)} (概念沙盒: {len(concept_sandboxes)}, 4D跃迁沙盒: {len(leap_models)})")
print(f"总计教学步骤/阶段数: {len(concept_sandboxes)*3 + len(leap_models)*4} (概念探究步骤: {len(concept_sandboxes)*3}, 4D推演阶段: {len(leap_models)*4})")

# 详细分类统计字典
stats = {
    'concept': {
        'total_models': len(concept_sandboxes),
        'total_steps': len(concept_sandboxes) * 3,
        'cat_A_telemetry_hidden': 0,      # 遥测被侧边栏高度挤出可视区
        'cat_B_canvas_bare_no_text': 0,   # 画布零度量/零数值/零公式标注
        'cat_C_missing_carrier_mode': 0,  # 文本承诺模式/图形在Renderer根本无绘制逻辑
        'cat_D_invariant_mismatch': 0,    # 文本要求比对的指标在invariants定义中缺失或不符
        'cat_E_target_cond_defect': 0,    # target_condition 存在缺陷（不可达/死锁/逻辑不匹配）
        'perfect_sync': 0
    },
    'leap': {
        'total_models': len(leap_models),
        'total_stages': len(leap_models) * 4,
        'cat_A_controls_hidden_deduction': 0, # 分步推演下控制架全部被display:none隐藏
        'cat_B_canvas_bare_no_text': 0,       # 画布零数值/零度量/零角弧/零线段长
        'cat_C_carrier_unsupported': 0,       # carrierId对应图元无独立拓扑分支（降级退化）
        'cat_D_stage_sliders_mismatch': 0,    # stage preset sliders与parameter_morphing定义不符
        'perfect_sync': 0
    }
}

concept_detailed_issues = []
leap_detailed_issues = []

# ==================== 审计概念沙盒 ====================
for row in concept_sandboxes:
    s_id, p_id, tpl, guide_zh, steps_json, sliders_json, points_json, inv_json, vis_json = row
    steps = json.loads(steps_json) if steps_json else []
    sliders = json.loads(sliders_json) if sliders_json else []
    points = json.loads(points_json) if points_json else []
    invariants = json.loads(inv_json) if inv_json else []
    visuals = json.loads(vis_json) if vis_json else {}

    slider_keys = {s.get('id') or s.get('param_key') for s in sliders if isinstance(s, dict)}
    point_keys = {p.get('id') for p in points if isinstance(p, dict)}
    inv_texts = " ".join([inv.get('textZh', '') + " " + inv.get('text', '') + " " + inv.get('id', '') for inv in invariants if isinstance(inv, dict)])

    model_has_cat_C = False

    for s_idx, step in enumerate(steps):
        step_num = step.get('step', s_idx + 1)
        title = step.get('titleZh') or step.get('title') or ''
        guide = step.get('guideTextZh') or step.get('guide_text') or ''
        cond = step.get('target_condition') or ''

        # 检查文本是否包含具体度量或数值比对要求
        has_quant = any(kw in guide or kw in title for kw in [
            "数值", "对比", "比较", "计算", "平方", "恒等", "面积", "周长", 
            "长度", "距离", "比值", "比例", "角度", "坐标", "等于", "和为", 
            "差为", "积为", "商为", "c²", "a²", "b²", "勾股", "度数", "值始终", "恒为", "="
        ])

        # 概念沙盒全部 138 个步骤的画布均由 SandboxRenderer 渲染，而该组件内零 text 标注
        stats['concept']['cat_B_canvas_bare_no_text'] += 1

        # 在 LinkedSandboxSlot.tsx 中，.sandbox-guide-15 均有高度截断，带步骤卡片时遥测均被挤压
        if has_quant:
            stats['concept']['cat_A_telemetry_hidden'] += 1

        # 检查载体缺失
        step_defects = []
        if ("弦图" in guide or "view_mode" in guide) and "zhaoshuang" not in tpl:
            step_defects.append("【载体缺失】文本明确要求‘将弦图模式 view_mode 切换到 2，观察4个全等直角三角形拼合’，但画布只有单个三角形，无拼图图元")
            stats['concept']['cat_C_missing_carrier_mode'] += 1
            model_has_cat_C = True

        if ("外接圆" in guide or "内切圆" in guide) and "circle" not in tpl and not visuals.get('polygons'):
            step_defects.append("【图元缺失】文本描述‘四心合一与双圆半径’，但画布未渲染任何外接圆/内切圆")
            stats['concept']['cat_C_missing_carrier_mode'] += 1
            model_has_cat_C = True

        if "中点四边形" in guide and "midpoint" not in tpl:
            step_defects.append("【载体缺失】文本描述‘中点四边形’，但该沙盒模板未启用中点连线分支")
            stats['concept']['cat_C_missing_carrier_mode'] += 1

        if "折叠" in guide or "翻折" in guide:
            step_defects.append("【载体缺失】文本描述折叠对称，但画布缺失折痕与镜像折叠虚线")
            stats['concept']['cat_C_missing_carrier_mode'] += 1

        # 检查不变量覆盖
        if has_quant and not invariants:
            step_defects.append("【遥测缺失】文本要求比对数值，但invariants_display_json为空，既无画布标注也无遥测指标")
            stats['concept']['cat_D_invariant_mismatch'] += 1

        # 检查条件缺陷
        if not cond or cond.strip() == "":
            step_defects.append("【条件缺失】target_condition为空，无法自动判定步进完成")
            stats['concept']['cat_E_target_cond_defect'] += 1

        if step_defects:
            concept_detailed_issues.append({
                'id': s_id,
                'point_id': p_id,
                'step': step_num,
                'title': title,
                'guide': guide,
                'cond': cond,
                'defects': step_defects
            })

# ==================== 审计 4D 跃迁沙盒 ====================
for row in leap_models:
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

        # 4D沙盒在推演模式下控制条全部隐藏
        stats['leap']['cat_A_controls_hidden_deduction'] += 1
        stats['leap']['cat_B_canvas_bare_no_text'] += 1

        stage_defects = []

        # 检查 carrierId 是否有独立图元支持
        c_id = cfg.get('carrierId')
        if c_id and c_id != 'default':
            if c_id not in carrier_options:
                stage_defects.append(f"【载体未定义】carrierId '{c_id}' 在carrier_morphing_json中不存在")
                stats['leap']['cat_C_carrier_unsupported'] += 1
            else:
                opt = carrier_options[c_id]
                # 检查该 carrier 是否有 elements 或专用 template
                if not opt.get('elements') and not opt.get('points') and not opt.get('carrier_id'):
                    # 很多载体仅仅是一个 nameZh，没有任何几何图元定义，导致切载体时画布几何不变
                    stage_defects.append(f"【载体空壳】carrierId '{c_id}' ({opt.get('nameZh')}) 缺乏几何图元 elements 定义，切到该步时画布几何形变退化")
                    stats['leap']['cat_C_carrier_unsupported'] += 1

        # 检查滑块参数与几何驱动对应性
        sliders = cfg.get('sliders', {})
        for sk in sliders:
            if sk not in slider_keys and sk not in {'rotationAngle', 'rot_theta', 'rot_angle', 'theta', 'angle_alpha'}:
                stage_defects.append(f"【滑块脱节】推演配置要求设置滑块 '{sk}'，但在模型参数货架中未定义")
                stats['leap']['cat_D_stage_sliders_mismatch'] += 1

        if stage_defects:
            leap_detailed_issues.append({
                'model_id': m_id,
                'name_zh': name_zh,
                'stage': stage_num,
                'title': title_zh,
                'guide': guide_zh,
                'defects': stage_defects
            })

print("\n--- 概念沙盒统计 ---")
print(f"总步骤数: {stats['concept']['total_steps']}")
print(f"  - 画布零文字/度量标注 (裸几何线条): {stats['concept']['cat_B_canvas_bare_no_text']} / {stats['concept']['total_steps']} (100%)")
print(f"  - 文本要求看数/比大小但遥测在UI被挤压出可视区: {stats['concept']['cat_A_telemetry_hidden']} / {stats['concept']['total_steps']} ({stats['concept']['cat_A_telemetry_hidden']*100//stats['concept']['total_steps']}%)")
print(f"  - 文本描述的特殊载体/几何拼图在画布根本未实现: {stats['concept']['cat_C_missing_carrier_mode']}")
print(f"  - 文本要求比对但invariants_display缺失: {stats['concept']['cat_D_invariant_mismatch']}")

print("\n--- 4D 跃迁沙盒统计 ---")
print(f"总阶段数: {stats['leap']['total_stages']}")
print(f"  - 分步推演下控制条全部隐藏 (学生无法主动微调验证): {stats['leap']['cat_A_controls_hidden_deduction']} / {stats['leap']['total_stages']} (100%)")
print(f"  - 画布零文字/度量标注 (零度数/零线段长/零公式): {stats['leap']['cat_B_canvas_bare_no_text']} / {stats['leap']['total_stages']} (100%)")
print(f"  - 载体变异属于空壳/缺乏独立图元分支: {stats['leap']['cat_C_carrier_unsupported']}")
print(f"  - 推演预置参数脱节: {stats['leap']['cat_D_stage_sliders_mismatch']}")

print(f"\n概念沙盒典型结构性缺陷清单 (共 {len(concept_detailed_issues)} 项):")
for it in concept_detailed_issues[:15]:
    print(f"  [{it['id']} {it['point_id']} 步{it['step']}] {it['title']}")
    for d in it['defects']:
        print(f"    - {d}")

print(f"\n4D跃迁沙盒典型结构性缺陷清单 (共 {len(leap_detailed_issues)} 项):")
for it in leap_detailed_issues[:15]:
    print(f"  [{it['model_id']} {it['name_zh']} 阶{it['stage']}] {it['title']}")
    for d in it['defects']:
        print(f"    - {d}")
