#!/usr/bin/env python3
"""
patch_ultimate_exploration_defaults.py
终极修复 10 个沙盒初态秒达成问题：
确保 Step 1 在默认滑块初态下绝不秒达成，学生必须动手拖拽后方可达成。
同步更新 data/sandbox.db 与 public/data/sandbox.db。
"""
import sqlite3
import json
import os

CALIBRATIONS = {
    "SB-KP001": {
        "slider_defaults": {"p_num": -2.0, "q_den": 2, "unit_scale": 1},
        "step_presets": [
            {"p_num": -2.0, "q_den": 2},
            {"p_num": 3.0, "q_den": 2},
            {"p_num": 2.0, "q_den": 2}
        ]
    },
    "SB-KP032": {
        "slider_defaults": {"k_prop": -1.5, "x_pos": 2.0},
        "step_presets": [
            {"k_prop": -1.5, "x_pos": 2.0},
            {"k_prop": 2.0, "x_pos": 2.0},
            {"k_prop": 1.0, "x_pos": 1.0}
        ]
    },
    "SB-KP035": {
        "slider_defaults": {"k1": 1.0, "b1": -1.0, "k2": 1.0, "intercept_b2": 3.0},
        "step_presets": [
            {"k1": 1.0, "b1": -1.0, "k2": 1.0, "intercept_b2": 3.0},
            {"k1": 1.0, "k2": 2.0},
            {"k1": 1.0, "k2": 1.0}
        ]
    },
    "SB-KP033": {
        "slider_defaults": {"pt_x1": -2.0, "pt_y1": -1.0, "pt_x2": 3.0, "pt_y2": 4.0},
        "step_presets": [
            {"pt_x1": -2.0, "pt_y1": -1.0},
            {"pt_x2": 3.0, "pt_y2": 4.0},
            {"pt_x1": 0.0, "pt_x2": 0.5}
        ]
    },
    "SB-KP040": {
        "slider_defaults": {"param_a": 1.0, "param_b": -2.0, "param_c": 2.0},
        "step_presets": [
            {"param_a": 1.0, "param_b": -2.0, "param_c": 2.0},
            {"param_a": 1.0, "param_b": -2.0, "param_c": -2.0},
            {"param_a": 1.0, "param_b": -2.0, "param_c": 0.0}
        ]
    },
    "SB-KP041": {
        "slider_defaults": {"param_h": -4.0, "param_m": -2.0, "param_n": 3.0},
        "step_presets": [
            {"param_h": -4.0, "param_m": -2.0, "param_n": 3.0},
            {"param_h": 0.0, "param_m": -2.0, "param_n": 3.0},
            {"param_h": 0.0, "param_m": -2.0, "param_n": 3.0}
        ]
    },
    "SB-KP042": {
        "slider_defaults": {"param_k_level": -5.0, "param_c": -4.0},
        "step_presets": [
            {"param_k_level": -5.0, "param_c": -4.0},
            {"param_k_level": -3.0, "param_c": -4.0},
            {"param_k_level": 0.0, "param_c": -4.0}
        ]
    },
    "SB-KP043": {
        "slider_defaults": {"param_t": 1.0, "param_a": -0.5},
        "step_presets": [
            {"param_t": 1.0},
            {"param_t": -1.5},
            {"param_a": -0.5}
        ]
    },
    "SB-KP064": {
        "slider_defaults": {"shear_alpha": 90.0, "rect_w": 6.0, "rect_h": 4.0},
        "step_presets": [
            {"shear_alpha": 90.0},
            {"shear_alpha": 60.0},
            {"shear_alpha": 90.0, "rect_w": 6.0, "rect_h": 4.0}
        ]
    },
    "SB-KP071": {
        "slider_defaults": {"circle_r": 4.0, "line_dist_d": 5.0},
        "step_presets": [
            {"circle_r": 4.0, "line_dist_d": 5.0},
            {"circle_r": 4.0, "line_dist_d": 2.0},
            {"circle_r": 4.0, "line_dist_d": 2.0}
        ]
    },
    "SB-KP073": {
        "slider_defaults": {"theta_C": 90.0, "arc_span": 80.0, "radius_r": 4.0},
        "step_presets": [
            {"theta_C": 90.0},
            {"theta_C": 45.0},
            {"arc_span": 60.0}
        ]
    }
}

def apply_patch(db_path: str):
    if not os.path.exists(db_path):
        print(f"Warning: {db_path} does not exist.")
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    updated_count = 0

    for sid, patch in CALIBRATIONS.items():
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
    print(f"Successfully calibrated {updated_count} sandboxes in {db_path}")

if __name__ == '__main__':
    apply_patch('data/sandbox.db')
    apply_patch('public/data/sandbox.db')
