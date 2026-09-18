#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TASK-DATA-0002: 5 片并发只读补全 worker
用法: python3 scripts/build/backfill2_worker.py --part <1..5>
"""

import sys
import os
import sqlite3
import json
import argparse

sys.path.insert(0, os.path.abspath("."))
from scripts.build.engine_task0002 import process_single_question

DB_PATH = "file:data/questions.db?mode=ro"
TOTAL_PARTS = 5

def get_partitions():
    conn = sqlite3.connect(DB_PATH, uri=True)
    cur = conn.cursor()
    rows = cur.execute("""
        SELECT question_id, source, question_type, grade_level, semester, 
               primary_point_id, difficulty_level, score_default, stem_zh, 
               stem_en, options_json, answer_standard, solutions_json, rubric_checklist_json
        FROM questions
        WHERE content_status = 'done'
        ORDER BY question_id ASC;
    """).fetchall()
    conn.close()
    
    total = len(rows)
    assert total == 2178, f"Expected 2178 done questions, got {total}"
    
    part_size = total // TOTAL_PARTS
    remainder = total % TOTAL_PARTS
    
    partitions = []
    start_idx = 0
    for p in range(TOTAL_PARTS):
        extra = 1 if p < remainder else 0
        end_idx = start_idx + part_size + extra
        partitions.append(rows[start_idx:end_idx])
        start_idx = end_idx
        
    return partitions

def run_part(part_num: int):
    assert 1 <= part_num <= 5
    partitions = get_partitions()
    my_rows = partitions[part_num - 1]
    
    out_dir = "tmp/backfill2"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"part{part_num}.jsonl")
    
    print(f"[*] Part {part_num} started. Processing {len(my_rows)} questions -> {out_file}")
    
    with open(out_file, "w", encoding="utf-8") as f:
        for r in my_rows:
            record = process_single_question(r)
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            
    print(f"[✓] Part {part_num} completed. {len(my_rows)} records written to {out_file}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--part", type=int, required=True, help="Part index (1..5)")
    args = parser.parse_args()
    run_part(args.part)
