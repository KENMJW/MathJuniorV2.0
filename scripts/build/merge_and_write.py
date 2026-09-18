#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TASK-DATA-0001 阶段2：单进程串行写库与合并校验
读取 tmp/backfill/part1.jsonl .. part5.jsonl
唯一写库进程，确保零并发写冲突
"""

import sys
import os
import sqlite3
import json
import hashlib
from collections import Counter

BACKUP_PATH = "data/questions.db.bak_before_task0001"
DB_PATH = "data/questions.db"
CORE_PATH = "data/core.db"

def verify_backup():
    if not os.path.exists(BACKUP_PATH):
        raise FileNotFoundError(f"Backup file {BACKUP_PATH} missing!")
    print(f"[✓] Backup file {BACKUP_PATH} exists ({os.path.getsize(BACKUP_PATH)} bytes).")

def load_valid_kps():
    conn = sqlite3.connect(CORE_PATH)
    cur = conn.cursor()
    kps = set(r[0] for r in cur.execute("SELECT point_id FROM knowledge_points;").fetchall())
    conn.close()
    return kps

def main():
    print("=== 开始执行 TASK-DATA-0001 阶段2：单进程串行写库 ===")
    verify_backup()
    valid_kps = load_valid_kps()
    
    # 1. 读取 5 片 jsonl
    all_records = []
    seen_qids = set()
    
    for p in range(1, 6):
        part_file = f"tmp/backfill/part{p}.jsonl"
        if not os.path.exists(part_file):
            raise FileNotFoundError(f"Partition file {part_file} not found!")
            
        with open(part_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            print(f"  -> Read {len(lines)} records from {part_file}")
            for line in lines:
                if not line.strip():
                    continue
                rec = json.loads(line)
                qid = rec["qid"]
                if qid in seen_qids:
                    raise ValueError(f"Duplicate question_id across parts: {qid}")
                seen_qids.add(qid)
                all_records.append(rec)
                
    total_records = len(all_records)
    print(f"[*] Total merged records: {total_records}")
    assert total_records == 2158, f"Expected 2158 records, got {total_records}"
    
    # 2. 校验字段合法性
    ok_count = 0
    suspect_count = 0
    for r in all_records:
        v = r["verdict"]
        if v == "ok":
            ok_count += 1
            kp = r["primary_point_id"]
            diff = r["difficulty_level"]
            if kp not in valid_kps:
                raise ValueError(f"Invalid primary_point_id {kp} for qid {r['qid']}")
            if not (1 <= diff <= 9):
                raise ValueError(f"Invalid difficulty_level {diff} for qid {r['qid']}")
        elif v == "suspect":
            suspect_count += 1
            if not r["suspect_reason"]:
                raise ValueError(f"Missing suspect_reason for suspect qid {r['qid']}")
        else:
            raise ValueError(f"Unknown verdict {v} for qid {r['qid']}")
            
    print(f"[✓] Pre-check passed: ok={ok_count}, suspect={suspect_count}")
    
    # 3. 串行单进程写库
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 记录写前总数
    before_count = cur.execute("SELECT count(*) FROM questions;").fetchone()[0]
    before_pending = cur.execute("SELECT count(*) FROM questions WHERE content_status = 'pending';").fetchone()[0]
    print(f"[*] Before write: total={before_count}, pending={before_pending}")
    assert before_pending == 2158, f"Expected 2158 pending before write, got {before_pending}"
    
    # 执行逐条更新（绝不修改 stem_zh，绝不执行 DELETE）
    updated = 0
    for r in all_records:
        qid = r["qid"]
        v = r["verdict"]
        
        if v == "ok":
            kp = r["primary_point_id"]
            diff = r["difficulty_level"]
            ans_fill = r.get("answer_fill")
            
            if ans_fill:
                cur.execute("""
                    UPDATE questions
                    SET primary_point_id = ?,
                        difficulty_level = ?,
                        answer_standard = ?,
                        content_status = 'done'
                    WHERE question_id = ? AND content_status = 'pending';
                """, (kp, diff, ans_fill, qid))
            else:
                cur.execute("""
                    UPDATE questions
                    SET primary_point_id = ?,
                        difficulty_level = ?,
                        content_status = 'done'
                    WHERE question_id = ? AND content_status = 'pending';
                """, (kp, diff, qid))
        else: # suspect
            cur.execute("""
                UPDATE questions
                SET content_status = 'suspect'
                WHERE question_id = ? AND content_status = 'pending';
            """, (qid,))
            
        updated += 1
        
    conn.commit()
    conn.close()
    
    print(f"[✓] Successfully committed {updated} updates to {DB_PATH}.")
    
    # 4. 后置校验（验收清单核对）
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    after_count = cur.execute("SELECT count(*) FROM questions;").fetchone()[0]
    after_pending = cur.execute("SELECT count(*) FROM questions WHERE content_status = 'pending';").fetchone()[0]
    after_done = cur.execute("SELECT count(*) FROM questions WHERE content_status = 'done';").fetchone()[0]
    after_suspect = cur.execute("SELECT count(*) FROM questions WHERE content_status = 'suspect';").fetchone()[0]
    
    print(f"[*] After write stats:")
    print(f"    - Total rows: {after_count} (before: {before_count})")
    print(f"    - Pending rows: {after_pending} (must be 0)")
    print(f"    - Done rows: {after_done}")
    print(f"    - Suspect rows: {after_suspect}")
    
    assert after_count == before_count, f"Total count changed! {before_count} -> {after_count}"
    assert after_pending == 0, f"Pending rows remain: {after_pending}"
    
    # 5. 校验 stem_zh 零改动（比对备份）
    conn_bak = sqlite3.connect(BACKUP_PATH)
    cur_bak = conn_bak.cursor()
    bak_stems = cur_bak.execute("SELECT question_id, stem_zh FROM questions ORDER BY question_id;").fetchall()
    curr_stems = cur.execute("SELECT question_id, stem_zh FROM questions ORDER BY question_id;").fetchall()
    conn_bak.close()
    conn.close()
    
    assert len(bak_stems) == len(curr_stems), "Stem count mismatch with backup!"
    for (qid_b, s_b), (qid_c, s_c) in zip(bak_stems, curr_stems):
        assert qid_b == qid_c, f"QID mismatch: {qid_b} vs {qid_c}"
        assert s_b == s_c, f"stem_zh modified for {qid_b}!"
        
    print("✅ [Verification PASSED] stem_zh 零改动比对备份通过！题总数一致！无 pending 残留！")

if __name__ == "__main__":
    main()
