#!/usr/bin/env python3
"""
scripts/build/apply_data0006.py
Serial transaction applier for TASK-DATA-0006.
Reads tmp/data0006/part1.jsonl ~ part4.jsonl and applies updates to data/sandbox.db and data/core.db.
Enforces strict conservation assertions and logs all changes.
"""

import sqlite3
import json
import os
import shutil
import sys

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    os.chdir(repo_root)

    sandbox_db_path = 'data/sandbox.db'
    core_db_path = 'data/core.db'

    # 1. Verify backups exist
    assert os.path.exists('data/sandbox.db.bak_before_task0006'), "Backup sandbox.db.bak_before_task0006 missing!"
    assert os.path.exists('data/core.db.bak_before_task0006'), "Backup core.db.bak_before_task0006 missing!"
    print("✓ Backups verified.")

    # 2. Connect to databases
    s_conn = sqlite3.connect(sandbox_db_path)
    c_conn = sqlite3.connect(core_db_path)

    s_cur = s_conn.cursor()
    c_cur = c_conn.cursor()

    # Pre-checks
    s_cur.execute("SELECT COUNT(*) FROM concept_sandboxes")
    initial_concept_count = s_cur.fetchone()[0]
    s_cur.execute("SELECT COUNT(*) FROM leap_sandbox_models")
    initial_leap_count = s_cur.fetchone()[0]
    c_cur.execute("SELECT COUNT(*) FROM logic_lines")
    initial_lines_count = c_cur.fetchone()[0]

    print(f"Initial counts: concept_sandboxes={initial_concept_count}, leap_sandbox_models={initial_leap_count}, logic_lines={initial_lines_count}")
    assert initial_concept_count == 46, f"Expected 46 concept sandboxes, got {initial_concept_count}"
    assert initial_leap_count == 36, f"Expected 36 leap models, got {initial_leap_count}"
    assert initial_lines_count == 12, f"Expected 12 logic lines, got {initial_lines_count}"

    changes_log = []

    try:
        # Start transactions
        s_cur.execute("BEGIN TRANSACTION")
        c_cur.execute("BEGIN TRANSACTION")

        # --- PART 1 & 2: concept_sandboxes updates ---
        for part_file in ['tmp/data0006/part1.jsonl', 'tmp/data0006/part2.jsonl']:
            with open(part_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if not line.strip(): continue
                    entry = json.loads(line)
                    table = entry.get('target_table')
                    item_id = entry.get('id')
                    field = entry.get('field')
                    new_val = entry.get('new_val')
                    reason = entry.get('reason', '')

                    if isinstance(new_val, (dict, list)):
                        new_val_str = json.dumps(new_val, ensure_ascii=False)
                    else:
                        new_val_str = str(new_val)

                    s_cur.execute(f"SELECT {field} FROM {table} WHERE sandbox_id=?", (item_id,))
                    row = s_cur.fetchone()
                    assert row is not None, f"Row {item_id} not found in {table}"
                    old_val_str = row[0]

                    s_cur.execute(f"UPDATE {table} SET {field}=? WHERE sandbox_id=?", (new_val_str, item_id))
                    changes_log.append({
                        "part": part_file,
                        "table": table,
                        "id": item_id,
                        "field": field,
                        "old_val": old_val_str,
                        "new_val": new_val_str,
                        "reason": reason
                    })
                    print(f"[{part_file}] Updated {table}.{field} for {item_id}")

        # --- PART 3: leap_sandbox_models 4D updates for LM-9B-30 ~ 36 ---
        with open('tmp/data0006/part3.jsonl', 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                entry = json.loads(line)
                table = entry.get('target_table', 'leap_sandbox_models')
                item_id = entry.get('id')
                reason = entry.get('reason', '')

                carrier = entry['carrier_morphing_json']
                posture = entry['posture_morphing_json']
                camo = entry['camouflage_xray_json']

                carrier_str = json.dumps(carrier, ensure_ascii=False) if isinstance(carrier, (dict, list)) else carrier
                posture_str = json.dumps(posture, ensure_ascii=False) if isinstance(posture, (dict, list)) else posture
                camo_str = json.dumps(camo, ensure_ascii=False) if isinstance(camo, (dict, list)) else camo

                s_cur.execute("SELECT carrier_morphing_json FROM leap_sandbox_models WHERE model_id=?", (item_id,))
                row = s_cur.fetchone()
                assert row is not None, f"Model {item_id} not found"
                old_carrier_str = row[0]

                s_cur.execute("""
                    UPDATE leap_sandbox_models
                    SET carrier_morphing_json=?, posture_morphing_json=?, camouflage_xray_json=?
                    WHERE model_id=?
                """, (carrier_str, posture_str, camo_str, item_id))

                changes_log.append({
                    "part": "part3.jsonl",
                    "table": table,
                    "id": item_id,
                    "field": "carrier_morphing_json/posture/camo",
                    "old_val": "(3-point placeholder)",
                    "new_val": f"(Real geometric points, carrier len={len(carrier_str)})",
                    "reason": reason
                })
                print(f"[part3.jsonl] Updated 4D configs for {item_id}")

        # --- PART 4: Line P1 + LM-8B-13 + LM-8B-16 ---
        with open('tmp/data0006/part4.jsonl', 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                entry = json.loads(line)
                action = entry.get('action')
                table = entry.get('target_table')

                if action == 'insert':
                    rec = entry['record']
                    # Convert list/dict fields to json strings if needed
                    for col in ['kp_dependencies', 'carrier_morphing_json', 'parameter_morphing_json', 'posture_morphing_json', 'camouflage_xray_json']:
                        if isinstance(rec.get(col), (dict, list)):
                            rec[col] = json.dumps(rec[col], ensure_ascii=False)

                    cols = list(rec.keys())
                    placeholders = ', '.join(['?'] * len(cols))
                    col_names = ', '.join(cols)
                    values = [rec[c] for c in cols]

                    s_cur.execute(f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})", values)
                    changes_log.append({
                        "part": "part4.jsonl",
                        "table": table,
                        "id": rec['model_id'],
                        "field": "INSERT ROW",
                        "old_val": "None",
                        "new_val": rec['model_name_zh'],
                        "reason": "New flagship leap model for Line P1"
                    })
                    print(f"[part4.jsonl] Inserted new model {rec['model_id']} into {table}")

                elif action == 'update':
                    item_id = entry.get('id')
                    field = entry.get('field')
                    new_val = entry.get('new_val')
                    reason = entry.get('reason', '')

                    if isinstance(new_val, (dict, list)):
                        new_val_str = json.dumps(new_val, ensure_ascii=False)
                    else:
                        new_val_str = str(new_val)

                    if table == 'logic_lines':
                        c_cur.execute(f"SELECT {field} FROM {table} WHERE line_id=?", (item_id,))
                        row = c_cur.fetchone()
                        assert row is not None, f"Line {item_id} not found"
                        old_val_str = row[0]
                        c_cur.execute(f"UPDATE {table} SET {field}=? WHERE line_id=?", (new_val_str, item_id))
                        db_name = 'core.db'
                    else:
                        s_cur.execute(f"SELECT {field} FROM {table} WHERE model_id=?", (item_id,))
                        row = s_cur.fetchone()
                        assert row is not None, f"Model {item_id} not found"
                        old_val_str = row[0]
                        s_cur.execute(f"UPDATE {table} SET {field}=? WHERE model_id=?", (new_val_str, item_id))
                        db_name = 'sandbox.db'

                    changes_log.append({
                        "part": "part4.jsonl",
                        "table": f"{db_name}.{table}",
                        "id": item_id,
                        "field": field,
                        "old_val": old_val_str,
                        "new_val": new_val_str,
                        "reason": reason
                    })
                    print(f"[part4.jsonl] Updated {table}.{field} for {item_id}")

        # Conservation assertions
        s_cur.execute("SELECT COUNT(*) FROM concept_sandboxes")
        final_concept_count = s_cur.fetchone()[0]
        s_cur.execute("SELECT COUNT(*) FROM leap_sandbox_models")
        final_leap_count = s_cur.fetchone()[0]
        c_cur.execute("SELECT COUNT(*) FROM logic_lines")
        final_lines_count = c_cur.fetchone()[0]

        print(f"Final counts: concept_sandboxes={final_concept_count}, leap_sandbox_models={final_leap_count}, logic_lines={final_lines_count}")
        assert final_concept_count == 46, f"Conservation violation: concept_sandboxes={final_concept_count} != 46"
        assert final_leap_count == 37, f"Conservation violation: leap_sandbox_models={final_leap_count} != 37 (36 + 1 LM-9B-37)"
        assert final_lines_count == 12, f"Conservation violation: logic_lines={final_lines_count} != 12"

        # Commit transactions
        s_conn.commit()
        c_conn.commit()
        print("✓ Database transactions committed successfully.")

    except Exception as e:
        s_conn.rollback()
        c_conn.rollback()
        print(f"✗ ERROR during database write: {e}")
        sys.exit(1)
    finally:
        s_conn.close()
        c_conn.close()

    # 3. Synchronize to public/data and dist/data
    sync_targets = ['public/data', 'dist/data']
    for tgt in sync_targets:
        if os.path.exists(tgt):
            for db_file in ['sandbox.db', 'core.db']:
                src = os.path.join('data', db_file)
                dst = os.path.join(tgt, db_file)
                shutil.copy2(src, dst)
                print(f"✓ Synchronized {src} -> {dst}")

    # Save changes log for report generation
    with open('tmp/data0006/changes_log.json', 'w', encoding='utf-8') as f:
        json.dump(changes_log, f, ensure_ascii=False, indent=2)
    print(f"✓ Logged {len(changes_log)} changes to tmp/data0006/changes_log.json")

if __name__ == '__main__':
    main()
