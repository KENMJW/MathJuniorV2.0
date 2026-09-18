# -*- coding: utf-8 -*-
"""Worker script for TASK-DATA-0003 Stage 1.
Reads slice data for a given part (1..5) and writes tmp/recheck/partN.jsonl.
Strictly read-only with respect to the database.
"""
import argparse
import importlib
import json
import os
import sys

sys.path.insert(0, os.path.abspath("."))

def run_worker(part_idx: int):
    os.makedirs("tmp/recheck", exist_ok=True)
    out_file = f"tmp/recheck/part{part_idx}.jsonl"
    
    module_name = f"scripts.build.task0003.part{part_idx}_data"
    mod = importlib.import_module(module_name)
    part_dict = getattr(mod, f"PART{part_idx}_DATA")
    
    with open(out_file, "w", encoding="utf-8") as f:
        for qid, info in part_dict.items():
            record = {
                "qid": qid,
                "answer_standard": info.get("answer_standard", ""),
                "solutions_json": info.get("solutions_json", []),
                "verdict": info.get("verdict", "solved"),
                "reason": info.get("reason", "")
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            
    print(f"[Worker Part {part_idx}] Done. Wrote {len(part_dict)} records to {out_file}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--part", type=int, required=True, choices=[1, 2, 3, 4, 5])
    args = parser.parse_args()
    run_worker(args.part)
