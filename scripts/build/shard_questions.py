#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Partition questions into 5 shards for concurrent processing (TASK-DATA-0005).
"""

import os
import json
import sqlite3

import sys
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
DB_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT_DIR, "data/questions.db.bak_before_task0005")
OUTPUT_DIR = os.path.join(ROOT_DIR, "tmp/mdclean")

os.makedirs(OUTPUT_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("""
    SELECT question_id, stem_zh, stem_en, options_json, answer_standard, solutions_json
    FROM questions
    ORDER BY question_id
""")
rows = c.fetchall()
conn.close()

total = len(rows)
print(f"Total questions to shard: {total}")

# 5 shards
shard_size = (total + 4) // 5 # 413
shards = []
for i in range(5):
    start = i * shard_size
    end = min(start + shard_size, total)
    shard_rows = rows[start:end]
    items = []
    for r in shard_rows:
        items.append({
            "question_id": r[0],
            "stem_zh": r[1],
            "stem_en": r[2],
            "options_json": r[3],
            "answer_standard": r[4],
            "solutions_json": r[5]
        })
    shards.append(items)

for idx, shard in enumerate(shards, 1):
    out_path = os.path.join(OUTPUT_DIR, f"part{idx}_input.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(shard, f, ensure_ascii=False, indent=2)
    print(f"Part {idx}: {len(shard)} questions written to {out_path} ({shard[0]['question_id']} ~ {shard[-1]['question_id']})")

print("All 5 shards written successfully.")
