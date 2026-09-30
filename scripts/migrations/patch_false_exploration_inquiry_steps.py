#!/usr/bin/env python3
"""
patch_false_exploration_inquiry_steps.py
校准 14 个存在秒达成（假探究）的沙盒：
1. 调整 param_sliders_json 中的默认值，使其进入初始状态时不会预达成 Step 1 或其他步骤；
2. 为各步骤配置合理的 preset_params 初态，确保切换步骤时自动装载探究初态。
同步更新 data/sandbox.db 与 public/data/sandbox.db。
"""
import sqlite3
import json
import os

PATCHES = {
    "SB-KP001": {
        "slider_defaults": {"p_num": 2.0},
        "step_presets": [
            {"p_num": -2.0, "q_den": 2},
            {"p_num": 3.0, "q_den": 2},
            {"p_num": 2.0, "q_den": 2}
        ]
    },
    "SB-KP032": {
        "slider_defaults": {"k_prop": 1.5, "x_pos": 2.0},
        "step_presets": [
            {"k_prop": -1.5, "x_pos": -2.0},
            {"k_prop": 2.0, "x_pos": 2.0},
            {"k_prop": 1.0, "x_pos": 1.0}
        ]
    },
    "SB-KP033": {
        "slider_defaults": {"pt_x1": -1.0, "pt_y1": -1.0, "pt_x2": 1.0, "pt_y2": 1.0},
        "step_presets": [
            {"pt_x1": -2.0, "pt_y1": -1.0},
            {"pt_x2": 3.0, "pt_y2": 4.0},
            {"pt_x1": 0.0, "pt_x2": 1.0}
        ]
    },
    "SB-KP035": {
        "slider_defaults": {"k1": 1.0, "b1": -1.0, "k2": 2.0, "intercept_b2": 3.0},
        "step_presets": [
            {"k1": 1.0, "k2": 1.0},
            {"k1": 1.0, "k2": 2.0},
            {"k1": 1.0, "k2": 1.0}
        ]
    },
    "SB-KP040": {
        "slider_defaults": {"param_a": 1.0, "param_b": -2.0, "param_c": 0.0},
        "step_presets": [
            {"param_a": 1.0, "param_b": 0.0, "param_c": 2.0},
            {"param_a": 1.0, "param_b": -2.0, "param_c": 0.0},
            {"param_a": 1.0, "param_b": -2.0, "param_c": 0.0}
        ]
    },
    "SB-KP041": {
        "slider_defaults": {"param_h": 0.0, "param_m": -2.0, "param_n": 3.0},
        "step_presets": [
            {"param_h": -4.0, "param_m": -2.0, "param_n": 3.0},
            {"param_h": 0.0, "param_m": -2.0, "param_n": 3.0},
            {"param_h": 0.0, "param_m": -2.0, "param_n": 3.0}
        ]
    },
    "SB-KP042": {
        "slider_defaults": {"param_k_level": 0.0, "param_c": -4.0},
        "step_presets": [
            {"param_k_level": -5.0, "param_c": -4.0},
            {"param_k_level": -3.0, "param_c": -4.0},
            {"param_k_level": 0.0, "param_c": -4.0}
        ]
    },
    "SB-KP043": {
        "slider_defaults": {"param_t": -1.0, "param_a": -0.5},
        "step_presets": [
            {"param_t": 1.0},
            {"param_t": -1.5},
            {"param_a": -0.5}
        ]
    },
    "SB-KP064": {
        "slider_defaults": {"shear_alpha": 60.0, "rect_w": 6.0, "rect_h": 4.0},
        "step_presets": [
            {"shear_alpha": 90.0},
            {"shear_alpha": 60.0},
            {"shear_alpha": 60.0, "rect_w": 6.0, "rect_h": 4.0}
        ]
    },
    "SB-KP071": {
        "slider_defaults": {"circle_r": 4.0, "line_dist_d": 2.0},
        "step_presets": [
            {"circle_r": 4.0, "line_dist_d": 6.0},
            {"circle_r": 4.0, "line_dist_d": 2.0},
            {"circle_r": 4.0, "line_dist_d": 2.0}
        ]
    },
    "SB-KP073": {
        "slider_defaults": {"theta_C": 45.0, "arc_span": 80.0, "radius_r": 4.0},
        "step_presets": [
            {"theta_C": 90.0},
            {"theta_C": 45.0},
            {"arc_span": 60.0}
        ]
    },
    "SB-KP074": {
        "slider_defaults": {"circle_r": 5.0, "chord_dist_d": 2.0},
        "step_presets": [
            {"chord_dist_d": 1.0},
            {"chord_dist_d": 2.0},
            {"circle_r": 5.0, "chord_dist_d": 3.0}
        ]
    },
    "SB-KP080": {
        "slider_defaults": {"dx": 1.0, "dy": 1.0},
        "step_presets": [
            {"dx": 0.0, "dy": 0.0},
            {"dx": 3.0, "dy": 2.0},
            {"dx": 2.0, "dy": 2.0}
        ]
    },
    "SB-KP082": {
        "slider_defaults": {"rot_process": 45.0},
        "step_presets": [
            {"rot_process": 0.0},
            {"rot_process": 150.0},
            {"rot_process": 60.0}
        ]
    }
}

def patch_db(db_path: str):
    if not os.path.exists(db_path):
        print(f"Warning: {db_path} does not exist.")
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    updated_count = 0

    for sid, patch in PATCHES.items():
        cursor.execute("SELECT param_sliders_json, inquiry_steps_json FROM concept_sandboxes WHERE sandbox_id = ?", (sid,))
        row = cursor.fetchone()
        if not row:
            continue
        
        # 1. 更新 sliders
        sliders = json.loads(row[0]) if row[0] else []
        for s in sliders:
            sid_key = s.get('id')
            if sid_key in patch['slider_defaults']:
                s['default'] = patch['slider_defaults'][sid_key]
        
        # 2. 更新 inquiry_steps
        steps = json.loads(row[1]) if row[1] else []
        for i, st in enumerate(steps):
            if i < len(patch['step_presets']):
                st['preset_params'] = patch['step_presets'][i]
        
        cursor.execute(
            "UPDATE concept_sandboxes SET param_sliders_json = ?, inquiry_steps_json = ? WHERE sandbox_id = ?",
            (json.dumps(sliders, ensure_ascii=False), json.dumps(steps, ensure_ascii=False), sid)
        )
        updated_count += 1

    conn.commit()
    conn.close()
    print(f"Successfully patched {updated_count} sandboxes in {db_path}")

if __name__ == '__main__':
    patch_db('data/sandbox.db')
    patch_db('public/data/sandbox.db')
