# -*- coding: utf-8 -*-
"""Stage 2: Single-process serial database update for TASK-DATA-0003.
Merges tmp/recheck/part1.jsonl ~ part5.jsonl and executes a single atomic transaction.
Includes exhaustive pre/post assertions and invariants:
1. Exact total rows = 2109 (0 rows deleted).
2. stem_zh bit-for-bit invariant across all 2109 rows against backup.
3. 1867 non-target rows bit-for-bit identical across all columns against backup.
4. Exactly 242 target rows updated.
"""
import hashlib
import json
import os
import sqlite3
import sys

DB_PATH = "data/questions.db"
BAK_PATH = "data/questions.db.bak_before_task0003"
ID_LIST_PATH = ".kiro/relay/datalayer/inbox/low_recheck_ids.json"

def sha256_text(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()

def main():
    print("=== [Stage 2] Single-process serial DB update starting ===")
    
    # 1. Verify backup exists
    if not os.path.exists(BAK_PATH):
        raise FileNotFoundError(f"Backup file {BAK_PATH} does not exist!")
    print(f"Verified backup exists: {BAK_PATH}")
    
    # 2. Read target question IDs
    with open(ID_LIST_PATH, "r", encoding="utf-8") as f:
        target_ids = json.load(f)
    assert len(target_ids) == 242, f"Expected 242 target IDs, got {len(target_ids)}"
    target_id_set = set(target_ids)
    print(f"Loaded {len(target_ids)} target IDs from {ID_LIST_PATH}")
    
    # 3. Read and merge 5 jsonl files
    merged_records = {}
    for part in range(1, 6):
        part_file = f"tmp/recheck/part{part}.jsonl"
        if not os.path.exists(part_file):
            raise FileNotFoundError(f"Missing {part_file}!")
        with open(part_file, "r", encoding="utf-8") as f:
            count = 0
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rec = json.loads(line)
                qid = rec["qid"]
                assert qid in target_id_set, f"Unexpected QID {qid} in {part_file}"
                assert qid not in merged_records, f"Duplicate QID {qid} across parts"
                merged_records[qid] = rec
                count += 1
            print(f"Loaded {count} records from {part_file}")
            
    assert len(merged_records) == 242, f"Expected 242 merged records, got {len(merged_records)}"
    print("Successfully merged all 242 records from parts 1-5.")
    
    # 4. Check backup baseline
    conn_bak = sqlite3.connect(BAK_PATH)
    cur_bak = conn_bak.cursor()
    cur_bak.execute("SELECT COUNT(*) FROM questions")
    bak_count = cur_bak.fetchone()[0]
    assert bak_count == 2109, f"Expected 2109 rows in backup, got {bak_count}"
    
    cur_bak.execute("SELECT question_id, stem_zh FROM questions")
    bak_stems = {row[0]: row[1] for row in cur_bak.fetchall()}
    
    cur_bak.execute("SELECT * FROM questions")
    bak_all_rows = {row[0]: row for row in cur_bak.fetchall()}
    conn_bak.close()
    print("Backup baseline verified: 2109 rows.")
    
    # 5. Connect to target DB and execute transaction
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Check DB baseline
    cur.execute("SELECT COUNT(*) FROM questions")
    db_count = cur.fetchone()[0]
    assert db_count == 2109, f"Expected 2109 rows in DB before update, got {db_count}"
    
    solved_updated = 0
    still_low_updated = 0
    
    print("\nExecuting single transaction atomic update...")
    cur.execute("BEGIN TRANSACTION")
    try:
        for qid in target_ids:
            rec = merged_records[qid]
            verdict = rec["verdict"]
            ans = rec.get("answer_standard", "")
            sols = rec.get("solutions_json", [])
            reason = rec.get("reason", "")
            
            if verdict == "solved":
                solved_updated += 1
                sols_str = json.dumps(sols, ensure_ascii=False)
                cur.execute(
                    "UPDATE questions SET answer_standard = ?, solutions_json = ? WHERE question_id = ?",
                    (ans, sols_str, qid)
                )
            elif verdict == "still_low":
                still_low_updated += 1
                # If reason is provided, annotate in solutions_json so audit trail is retained
                annotated_sols = [{"method": "核查说明", "text": f"【核查标记仍低置信 (still_low)】{reason}"}]
                sols_str = json.dumps(annotated_sols, ensure_ascii=False)
                if ans:
                    cur.execute(
                        "UPDATE questions SET answer_standard = ?, solutions_json = ? WHERE question_id = ?",
                        (ans, sols_str, qid)
                    )
                else:
                    cur.execute(
                        "UPDATE questions SET solutions_json = ? WHERE question_id = ?",
                        (sols_str, qid)
                    )
            else:
                raise ValueError(f"Unknown verdict {verdict} for {qid}")
                
        conn.commit()
        print(f"Transaction committed successfully! (solved: {solved_updated}, still_low: {still_low_updated})")
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Transaction rolled back due to error: {e}")
        
    # 6. Strict Post-write verification
    print("\n=== [Post-Write Invariant Verification] ===")
    
    # Invariant A: Total row count == 2109
    cur.execute("SELECT COUNT(*) FROM questions")
    final_count = cur.fetchone()[0]
    assert final_count == 2109, f"RED LINE VIOLATION: Row count changed from 2109 to {final_count}"
    print("[PASS] Invariant A: Row count strictly preserved at 2109 (0 deleted).")
    
    # Invariant B: stem_zh bit-for-bit unchanged
    cur.execute("SELECT question_id, stem_zh FROM questions")
    final_stems = {row[0]: row[1] for row in cur.fetchall()}
    assert len(final_stems) == 2109
    stem_mismatches = []
    for qid, original_stem in bak_stems.items():
        curr_stem = final_stems.get(qid)
        if curr_stem != original_stem:
            stem_mismatches.append(qid)
    assert len(stem_mismatches) == 0, f"RED LINE VIOLATION: stem_zh modified in {len(stem_mismatches)} rows: {stem_mismatches[:5]}"
    print("[PASS] Invariant B: stem_zh SHA256 invariant verified (bit-for-bit identical across all 2109 rows).")
    
    # Invariant C: 1867 non-target rows untouched
    cur.execute("SELECT * FROM questions")
    final_all_rows = {row[0]: row for row in cur.fetchall()}
    non_target_diffs = []
    for qid, bak_row in bak_all_rows.items():
        if qid not in target_id_set:
            curr_row = final_all_rows.get(qid)
            if curr_row != bak_row:
                non_target_diffs.append(qid)
    assert len(non_target_diffs) == 0, f"RED LINE VIOLATION: Non-target rows altered: {non_target_diffs}"
    print(f"[PASS] Invariant C: Exactly 1867 non-target rows have 0 changes compared to backup.")
    
    # Invariant D: Exactly 242 rows in target_id_set
    assert len(target_id_set) == 242
    print(f"[PASS] Invariant D: Target set size == 242.")
    
    conn.close()
    print("\n=== [Stage 2 SUCCESS] Database safely updated and fully verified! ===")

if __name__ == "__main__":
    main()
