#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge and write cleaned questions to data/questions.db (TASK-DATA-0005).
Single-process atomic transaction, strictly verifies backup and invariants.
"""

import os
import sys
import json
import sqlite3
import shutil

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DB_PATH = os.path.join(ROOT_DIR, "data/questions.db")
BAK_PATH = os.path.join(ROOT_DIR, "data/questions.db.bak_before_task0005")
PART_FILES = [os.path.join(ROOT_DIR, f"tmp/mdclean/part{i}.jsonl") for i in range(1, 6)]

def main():
    print("=== Merge & Write Cleaned Questions (TASK-DATA-0005) ===")

    # 1. Verify backup exists
    if not os.path.exists(BAK_PATH):
        raise RuntimeError(f"Backup file not found: {BAK_PATH}! Aborting write.")
    print(f"Verified backup exists: {BAK_PATH} ({os.path.getsize(BAK_PATH)} bytes)")

    # 2. Read and validate all 5 part files
    all_records = []
    seen_ids = set()

    for pf in PART_FILES:
        if not os.path.exists(pf):
            raise RuntimeError(f"Part file missing: {pf}")
        with open(pf, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rec = json.loads(line)
                qid = rec["question_id"]
                if qid in seen_ids:
                    raise RuntimeError(f"Duplicate question_id: {qid}")
                seen_ids.add(qid)
                all_records.append(rec)

    print(f"Total validated records from 5 parts: {len(all_records)}")
    if len(all_records) != 2064:
        raise RuntimeError(f"Expected 2064 records, got {len(all_records)}!")

    # 3. Open DB and perform atomic update
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM questions")
    count_before = cur.fetchone()[0]
    assert count_before == 2064, f"DB question count {count_before} != 2064"

    try:
        conn.execute("BEGIN TRANSACTION")
        for rec in all_records:
            qid = rec["question_id"]
            szh = rec.get("stem_zh")
            sen = rec.get("stem_en")
            opt = rec.get("options_json")
            ans = rec.get("answer_standard")
            sol = rec.get("solutions_json")

            cur.execute("""
                UPDATE questions
                SET stem_zh = ?,
                    stem_en = ?,
                    options_json = ?,
                    answer_standard = ?,
                    solutions_json = ?
                WHERE question_id = ?
            """, (szh, sen, opt, ans, sol, qid))
            if cur.rowcount != 1:
                raise RuntimeError(f"Failed to update {qid}, rowcount = {cur.rowcount}")

        conn.commit()
        print("Database transaction committed successfully.")
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Transaction failed and rolled back: {e}")

    # 4. Invariant checks
    cur.execute("SELECT COUNT(*) FROM questions")
    count_after = cur.fetchone()[0]
    assert count_after == 2064, f"Question count changed: {count_after} != 2064"

    conn.close()

    # 5. Sync to public/data, dist/data, tmp/test-data
    targets = [
        os.path.join(ROOT_DIR, "public/data/questions.db"),
        os.path.join(ROOT_DIR, "dist/data/questions.db"),
        os.path.join(ROOT_DIR, "tmp/test-data/questions.db"),
    ]
    for tgt in targets:
        if os.path.exists(os.path.dirname(tgt)):
            shutil.copy2(DB_PATH, tgt)
            print(f"Synced {DB_PATH} -> {tgt} ({os.path.getsize(tgt)} bytes)")

    print("=== All 2064 Questions Successfully Cleaned, Written & Verified! ===")

if __name__ == "__main__":
    main()
