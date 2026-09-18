# -*- coding: utf-8 -*-
"""Stage 2: Single-process serial database update for TASK-DATA-0003 (Sandbox.db).
Merges tmp/sbfill/part1.jsonl ~ part5.jsonl and executes a single atomic transaction.
Verifies all invariants before and after commit.
"""
import json
import os
import shutil
import sqlite3
import sys

DB_PATH = "data/sandbox.db"
BAK_PATH = "data/sandbox.db.bak_before_task0003"
PUBLIC_DB = "public/data/sandbox.db"
DIST_DB = "dist/data/sandbox.db"
TMP_TEST_DB = "tmp/test-data/sandbox.db"

def main():
    print("=== [Stage 2] Single-process serial sandbox.db update starting ===")
    
    # 1. Verify backup
    if not os.path.exists(BAK_PATH):
        raise FileNotFoundError(f"Backup file {BAK_PATH} does not exist!")
    print(f"Verified backup exists: {BAK_PATH}")
    
    # 2. Read all 5 part files
    all_leap = {}
    all_concept = {}
    for p in range(1, 6):
        part_file = f"tmp/sbfill/part{p}.jsonl"
        if not os.path.exists(part_file):
            raise FileNotFoundError(f"Missing {part_file}!")
        with open(part_file, "r", encoding="utf-8") as f:
            count = 0
            for line in f:
                if not line.strip(): continue
                rec = json.loads(line.strip())
                rtype = rec.get("type")
                if rtype == "leap":
                    mid = rec["model_id"]
                    assert mid not in all_leap, f"Duplicate leap {mid}"
                    all_leap[mid] = rec
                elif rtype == "concept":
                    sbid = rec["sandbox_id"]
                    assert sbid not in all_concept, f"Duplicate concept {sbid}"
                    all_concept[sbid] = rec
                count += 1
            print(f"Loaded {count} records from {part_file}")
            
    assert len(all_leap) == 36, f"Expected 36 leap models, got {len(all_leap)}"
    assert len(all_concept) == 46, f"Expected 46 concept sandboxes, got {len(all_concept)}"
    print(f"Successfully collected 36 leap models and 46 concept sandboxes.")
    
    # 3. Read baseline from backup
    conn_bak = sqlite3.connect(BAK_PATH)
    cur_bak = conn_bak.cursor()
    
    cur_bak.execute("SELECT sandbox_id, point_id, category_id, engine_type, canvas_template, inquiry_guide_zh, viewbox_spec_json, drag_points_json, param_sliders_json, invariants_display_json FROM concept_sandboxes")
    bak_concept = {r[0]: r for r in cur_bak.fetchall()}
    assert len(bak_concept) == 46
    
    cur_bak.execute("SELECT model_id, model_name_zh, unlocked_semester, primary_line, category_id, tier_level, canonical_state_count, kp_dependencies, model_brief_zh, viewbox_spec_json, parameter_morphing_json FROM leap_sandbox_models")
    bak_leap = {r[0]: r for r in cur_bak.fetchall()}
    assert len(bak_leap) == 36
    conn_bak.close()
    print("Backup baseline verified: 46 concept sandboxes and 36 leap models.")
    
    # 4. Atomic transaction update on data/sandbox.db
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("BEGIN TRANSACTION")
    try:
        # Update concept_sandboxes
        for sbid, rec in all_concept.items():
            guide_en = rec["inquiry_guide_en"]
            cur.execute("""
                UPDATE concept_sandboxes
                SET inquiry_guide_en = ?, content_status = 'done'
                WHERE sandbox_id = ?
            """, (guide_en, sbid))
            
        # Update leap_sandbox_models
        for mid, rec in all_leap.items():
            name_en = rec["model_name_en"]
            brief_en = rec["model_brief_en"]
            clique_id = rec["clique_id"]
            carrier_json = json.dumps(rec["carrier_morphing_json"], ensure_ascii=False) if isinstance(rec["carrier_morphing_json"], dict) else rec["carrier_morphing_json"]
            posture_json = json.dumps(rec["posture_morphing_json"], ensure_ascii=False) if isinstance(rec["posture_morphing_json"], dict) else rec["posture_morphing_json"]
            camo_json = json.dumps(rec["camouflage_xray_json"], ensure_ascii=False) if isinstance(rec["camouflage_xray_json"], dict) else rec["camouflage_xray_json"]
            
            cur.execute("""
                UPDATE leap_sandbox_models
                SET model_name_en = ?,
                    model_brief_en = ?,
                    clique_id = ?,
                    carrier_morphing_json = ?,
                    posture_morphing_json = ?,
                    camouflage_xray_json = ?,
                    content_status = 'done'
                WHERE model_id = ?
            """, (name_en, brief_en, clique_id, carrier_json, posture_json, camo_json, mid))
            
        conn.commit()
        print("Database transaction committed successfully!")
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Transaction rolled back: {e}")
        
    # 5. Post-write invariant verification
    print("\n=== [Post-Write Invariant Verification] ===")
    
    # Invariant 1: Row count
    cur.execute("SELECT COUNT(*) FROM concept_sandboxes")
    assert cur.fetchone()[0] == 46, "Concept count changed!"
    cur.execute("SELECT COUNT(*) FROM leap_sandbox_models")
    assert cur.fetchone()[0] == 36, "Leap count changed!"
    print("[PASS] Invariant 1: Row counts strictly preserved (46 concepts, 36 leaps, 0 deleted).")
    
    # Invariant 2: Concept existing entity configs untouched
    cur.execute("SELECT sandbox_id, point_id, category_id, engine_type, canvas_template, inquiry_guide_zh, viewbox_spec_json, drag_points_json, param_sliders_json, invariants_display_json FROM concept_sandboxes")
    for r in cur.fetchall():
        sbid = r[0]
        assert r == bak_concept[sbid], f"Concept {sbid} entity config altered!"
    print("[PASS] Invariant 2: Concept sandboxes existing configs 100% bit-for-bit unchanged.")
    
    # Invariant 3: Leap existing entity configs untouched
    cur.execute("SELECT model_id, model_name_zh, unlocked_semester, primary_line, category_id, tier_level, canonical_state_count, kp_dependencies, model_brief_zh, viewbox_spec_json, parameter_morphing_json FROM leap_sandbox_models")
    for r in cur.fetchall():
        mid = r[0]
        assert r == bak_leap[mid], f"Leap {mid} entity config altered!"
    print("[PASS] Invariant 3: Leap models existing configs 100% bit-for-bit unchanged.")
    
    # Invariant 4: No __PENDING__ remaining
    cur.execute("SELECT COUNT(*) FROM concept_sandboxes WHERE inquiry_guide_en LIKE '%__PENDING%' OR content_status != 'done'")
    assert cur.fetchone()[0] == 0, "Concept still has pending!"
    cur.execute("SELECT COUNT(*) FROM leap_sandbox_models WHERE model_name_en LIKE '%__PENDING%' OR model_brief_en LIKE '%__PENDING%' OR content_status != 'done' OR clique_id IS NULL")
    assert cur.fetchone()[0] == 0, "Leap still has pending or null clique_id!"
    print("[PASS] Invariant 4: Zero __PENDING__ remaining; content_status all 'done'; clique_id 100% filled.")
    
    # Invariant 5: Carrier options non-empty arrays
    cur.execute("SELECT model_id, carrier_morphing_json FROM leap_sandbox_models")
    for mid, cjson in cur.fetchall():
        cdata = json.loads(cjson)
        opts = cdata.get("options")
        assert isinstance(opts, list) and len(opts) >= 2, f"{mid}: carrier options empty or <2"
        for opt in opts:
            assert opt.get("id") and opt.get("nameZh") and opt.get("points"), f"{mid}: option invalid: {opt}"
    print("[PASS] Invariant 5: All 36 leap models have non-empty carrier options (len >= 2) with valid points.")
    
    conn.close()
    
    # 6. Synchronize to public/data and dist/data
    for dest in [PUBLIC_DB, DIST_DB, TMP_TEST_DB]:
        if os.path.exists(os.path.dirname(dest)):
            shutil.copy2(DB_PATH, dest)
            print(f"Synchronized updated database to {dest}")
            
    print("\n=== [Stage 2 SUCCESS] Sandbox database safely updated, verified and synced! ===")

if __name__ == "__main__":
    main()
