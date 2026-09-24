#!/usr/bin/env python3
"""
TASK-FE-0024 Database Migration Script
Patches:
1. concept_sandboxes in data/sandbox.db:
   - Fix SB-KP057 step 3 condition (replace with hypot * hypot)
   - Eliminate 35 trivial-pass steps by tuning initial slider defaults
2. leap_sandbox_models in data/sandbox.db:
   - Activate postureId in story_stages_json for flagship rotation/reflection models
   - Inject rotationAngle alias into sliders dictionary
"""
import sqlite3
import json
import os
import shutil
import time

DB_PATH = 'data/sandbox.db'
BACKUP_DIR = 'data/db_backups'

def backup_db():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = int(time.time())
    backup_file = os.path.join(BACKUP_DIR, f'sandbox.db.patch_fe0024_{ts}.bak')
    shutil.copy2(DB_PATH, backup_file)
    print(f'[Track C] Database backup created: {backup_file}')
    return backup_file

def patch_concept_sandboxes(conn):
    c = conn.cursor()
    c.execute('SELECT sandbox_id, inquiry_steps_json, param_sliders_json FROM concept_sandboxes')
    rows = c.fetchall()
    
    updated_count = 0

    # Specific slider default overrides to prevent initial trivial pass
    # sandbox_id -> { slider_id: new_default }
    slider_overrides = {
        'SB-KP001': {'p_num': 0.0},
        'SB-KP003': {'val_a': 1.0},
        'SB-KP008': {'val_base': 5.0},
        'SB-KP032': {'k_prop': -1.0},
        'SB-KP033': {'pt_x2': 0.0},
        'SB-KP034': {'intercept_b': 0.0},
        'SB-KP035': {'k2': 1.0},
        'SB-KP038': {'param_h': 0.0, 'param_k': 0.0},
        'SB-KP040': {'param_c': 2.0},
        'SB-KP041': {'param_h': -4.0},
        'SB-KP042': {'param_k_level': -5.0},
        'SB-KP043': {'param_t': 0.0},
        'SB-KP044': {'param_angle_deg': 0.0},
        'SB-KP047': {'param_x_c': 1.0},
        'SB-KP055': {'side_a': 3.0, 'show_dual_circles': 0.0},
        'SB-KP056': {'point_t': 0.2},
        'SB-KP057': {'leg_a': 3.0, 'leg_b': 2.0},
        'SB-KP064': {'shear_alpha': 60.0},
        'SB-KP065': {'diag_h': 4.0, 'diag_v': 3.0},
        'SB-KP068': {'show_diags': 0.0},
        'SB-KP071': {'line_dist_d': 6.0},
        'SB-KP072': {'dist_OP': 4.0},
        'SB-KP073': {'theta_C': 45.0},
        'SB-KP074': {'chord_dist_d': 1.0},
        'SB-KP076': {'vertex_A_y': 3.0},
        'SB-KP079': {'axis_phi': 15.0},
        'SB-KP080': {'dx': 0.0, 'dy': 0.0},
        'SB-KP081': {'theta': 0.0},
        'SB-KP082': {'rot_process': 0.0},
    }

    # Step condition overrides: sandbox_id -> { step_number: new_condition }
    condition_overrides = {
        'SB-KP057': {
            3: 'Math.abs(hypot * hypot - (leg_a * leg_a + leg_b * leg_b)) < 0.01'
        },
        'SB-KP068': {
            2: 'quad_morph_preset >= 2.0'
        },
        'SB-KP051': {
            3: 'cond_mode === 2 || (trans_x !== 0 && trans_y !== 0)'
        }
    }

    for sbid, steps_json, sliders_json in rows:
        steps = json.loads(steps_json)
        sliders = json.loads(sliders_json)
        changed = False

        # Apply slider overrides
        if sbid in slider_overrides:
            for sl in sliders:
                sl_id = sl['id']
                if sl_id in slider_overrides[sbid]:
                    new_val = slider_overrides[sbid][sl_id]
                    if sl['default'] != new_val:
                        sl['default'] = new_val
                        changed = True

        # Apply condition overrides
        if sbid in condition_overrides:
            for s in steps:
                step_num = s.get('step')
                if step_num in condition_overrides[sbid]:
                    new_cond = condition_overrides[sbid][step_num]
                    if s.get('target_condition') != new_cond:
                        s['target_condition'] = new_cond
                        if 'targetCondition' in s:
                            s['targetCondition'] = new_cond
                        changed = True

        if changed:
            c.execute(
                'UPDATE concept_sandboxes SET inquiry_steps_json = ?, param_sliders_json = ? WHERE sandbox_id = ?',
                (json.dumps(steps, ensure_ascii=False), json.dumps(sliders, ensure_ascii=False), sbid)
            )
            updated_count += 1
            print(f'  [concept_sandboxes] Updated {sbid}')

    print(f'[Track C] concept_sandboxes updated: {updated_count} rows')

def patch_leap_sandbox_models(conn):
    c = conn.cursor()
    c.execute('SELECT model_id, story_stages_json FROM leap_sandbox_models')
    rows = c.fetchall()

    updated_count = 0

    # Flagship models posture activation
    posture_patches = {
        'LM-9A-19': {
            1: {'postureId': 'standard', 'sliders': {'rotationAngle': 60, 'rot_theta': 60}},
            2: {'postureId': 'rotated_90', 'sliders': {'rotationAngle': 90, 'rot_theta': 90}},
            3: {'postureId': 'rotated_90', 'sliders': {'rotationAngle': 45, 'rot_theta': 45}},
            4: {'postureId': 'standard', 'sliders': {'rotationAngle': 60, 'rot_theta': 60}},
        },
        'LM-9A-20': {
            1: {'postureId': 'standard'},
            2: {'postureId': 'folded'},
            3: {'postureId': 'folded'},
            4: {'postureId': 'standard'},
        },
        'LM-8A-12': {
            1: {'postureId': 'standard'},
            2: {'postureId': 'inclined_river'},
            3: {'postureId': 'reflected'},
            4: {'postureId': 'standard'},
        },
        'LM-8B-13': {
            1: {'postureId': 'standard'},
            2: {'postureId': 'reflected'},
            3: {'postureId': 'rot_90'},
            4: {'postureId': 'standard'},
        }
    }

    for mid, stages_json in rows:
        if not stages_json:
            continue
        stages = json.loads(stages_json)
        changed = False

        # In all models, if sliders has rot_theta, ensure rotationAngle is also present
        for st in stages:
            cfg = st.get('state_config', {})
            sliders = cfg.get('sliders', {})
            if 'rot_theta' in sliders and 'rotationAngle' not in sliders:
                sliders['rotationAngle'] = sliders['rot_theta']
                changed = True
            elif 'rotationAngle' in sliders and 'rot_theta' not in sliders:
                sliders['rot_theta'] = sliders['rotationAngle']
                changed = True

        # Apply specific posture patches
        if mid in posture_patches:
            for st in stages:
                stage_num = st.get('stage')
                if stage_num in posture_patches[mid]:
                    patch = posture_patches[mid][stage_num]
                    if 'state_config' not in st:
                        st['state_config'] = {}
                    cfg = st['state_config']
                    if 'postureId' in patch:
                        cfg['postureId'] = patch['postureId']
                        changed = True
                    if 'sliders' in patch:
                        if 'sliders' not in cfg:
                            cfg['sliders'] = {}
                        cfg['sliders'].update(patch['sliders'])
                        changed = True

        if changed:
            c.execute(
                'UPDATE leap_sandbox_models SET story_stages_json = ? WHERE model_id = ?',
                (json.dumps(stages, ensure_ascii=False), mid)
            )
            updated_count += 1
            print(f'  [leap_sandbox_models] Updated {mid}')

    print(f'[Track C] leap_sandbox_models updated: {updated_count} rows')

def main():
    backup_db()
    conn = sqlite3.connect(DB_PATH)
    try:
        with conn:
            patch_concept_sandboxes(conn)
            patch_leap_sandbox_models(conn)
        print('[Track C] Database migration successfully completed and committed!')
    finally:
        conn.close()

if __name__ == '__main__':
    main()
