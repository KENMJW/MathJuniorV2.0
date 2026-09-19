#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge and write concept sandboxes to data/sandbox.db (TASK-DATA-0004).
Single-process atomic transaction, strictly verifies backup and invariants.
"""

import os
import sys
import json
import sqlite3
import shutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate_concept_sbcfg import validate_part

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DB_PATH = os.path.join(ROOT_DIR, "data/sandbox.db")
BAK_PATH = os.path.join(ROOT_DIR, "data/sandbox.db.bak_before_task0004")
PART_FILES = [os.path.join(ROOT_DIR, f"tmp/sbcfg/part{i}.jsonl") for i in range(1, 6)]

def main():
    print("=== Merge & Write Concept Sandboxes (TASK-DATA-0004) ===")
    
    # 1. Verify backup exists
    if not os.path.exists(BAK_PATH):
        raise RuntimeError(f"Backup file not found: {BAK_PATH}! Aborting write.")
    print(f"Verified backup exists: {BAK_PATH} ({os.path.getsize(BAK_PATH)} bytes)")

    # 2. Validate all 5 part files
    all_records = []
    seen_ids = set()

    for pf in PART_FILES:
        if not os.path.exists(pf):
            raise RuntimeError(f"Part file missing: {pf}")
        validate_part(pf)
        with open(pf, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rec = json.loads(line)
                sbid = rec["sandbox_id"]
                if sbid in seen_ids:
                    raise RuntimeError(f"Duplicate sandbox_id across parts: {sbid}")
                seen_ids.add(sbid)
                all_records.append(rec)

    print(f"Total validated records from 5 parts: {len(all_records)}")
    if len(all_records) != 46:
        raise RuntimeError(f"Expected 46 records, got {len(all_records)}!")

    # 3. Open DB and perform atomic update
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Get leap_sandbox_models hash/rows before write
    cur.execute("SELECT model_id, model_name_zh, carrier_morphing_json, posture_morphing_json, camouflage_xray_json FROM leap_sandbox_models ORDER BY model_id")
    leap_before = cur.fetchall()

    try:
        conn.execute("BEGIN TRANSACTION")
        for rec in all_records:
            sbid = rec["sandbox_id"]
            vb = rec["viewbox_spec_json"] if isinstance(rec["viewbox_spec_json"], str) else json.dumps(rec["viewbox_spec_json"], ensure_ascii=False)
            pts = rec["drag_points_json"] if isinstance(rec["drag_points_json"], str) else json.dumps(rec["drag_points_json"], ensure_ascii=False)
            slds = rec["param_sliders_json"] if isinstance(rec["param_sliders_json"], str) else json.dumps(rec["param_sliders_json"], ensure_ascii=False)
            invs = rec["invariants_display_json"] if isinstance(rec["invariants_display_json"], str) else json.dumps(rec["invariants_display_json"], ensure_ascii=False)

            cur.execute("""
                UPDATE concept_sandboxes
                SET viewbox_spec_json = ?,
                    drag_points_json = ?,
                    param_sliders_json = ?,
                    invariants_display_json = ?,
                    content_status = 'done'
                WHERE sandbox_id = ?
            """, (vb, pts, slds, invs, sbid))
            if cur.rowcount != 1:
                raise RuntimeError(f"Failed to update sandbox {sbid}, rowcount = {cur.rowcount}")

        conn.commit()
        print("Database commit successful.")
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Transaction failed and rolled back: {e}")

    # 4. Invariant checks
    cur.execute("SELECT COUNT(*) FROM concept_sandboxes")
    count_all = cur.fetchone()[0]
    assert count_all == 46, f"Row count changed: {count_all} != 46"

    cur.execute("SELECT COUNT(*) FROM concept_sandboxes WHERE content_status = 'done'")
    count_done = cur.fetchone()[0]
    assert count_done == 46, f"Not all sandboxes done: {count_done} != 46"

    cur.execute("SELECT model_id, model_name_zh, carrier_morphing_json, posture_morphing_json, camouflage_xray_json FROM leap_sandbox_models ORDER BY model_id")
    leap_after = cur.fetchall()
    assert leap_before == leap_after, "leap_sandbox_models was modified! Invariant violated!"
    print("Verified leap_sandbox_models 100% untouched.")

    conn.close()

    # 5. Sync to public/data, dist/data, tmp/test-data
    targets = [
        os.path.join(ROOT_DIR, "public/data/sandbox.db"),
        os.path.join(ROOT_DIR, "dist/data/sandbox.db"),
        os.path.join(ROOT_DIR, "tmp/test-data/sandbox.db"),
    ]
    for tgt in targets:
        if os.path.exists(os.path.dirname(tgt)):
            shutil.copy2(DB_PATH, tgt)
            print(f"Synced {DB_PATH} -> {tgt} ({os.path.getsize(tgt)} bytes)")

    print("=== All Concept Sandboxes Successfully Written & Verified! ===")

if __name__ == "__main__":
    main()
