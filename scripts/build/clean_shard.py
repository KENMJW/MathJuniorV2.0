#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Clean a single shard of questions (TASK-DATA-0005).
Reads tmp/mdclean/partN_input.json, executes deterministic cleaning,
verifies $...$ formula invariance, and writes tmp/mdclean/partN.jsonl.
"""

import os
import sys
import json
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md_cleaner import MarkdownCleaner
from math_gate import sanitize_and_verify_math

FORMULA_SPLIT = re.compile(r"(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))")

def extract_formulas(text: str):
    """Extract all math formulas from text."""
    if not text:
        return []
    parts = FORMULA_SPLIT.split(text)
    return [parts[i] for i in range(1, len(parts), 2)]

def process_shard(input_path: str, output_path: str):
    print(f"=== Processing Shard: {input_path} -> {output_path} ===")
    cleaner = MarkdownCleaner()

    with open(input_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Loaded {len(records)} records from {input_path}")

    cleaned_records = []
    invariance_failures = 0

    for idx, rec in enumerate(records, 1):
        # Extract original formulas for invariance checking
        orig_formulas = {
            "stem_zh": extract_formulas(rec.get("stem_zh", "")),
            "ans": extract_formulas(rec.get("answer_standard", "")),
        }

        # Run deterministic cleaner
        out = cleaner.clean_question_record(rec)

        # Invariance check: verify all original formulas still exist in order
        new_stem_formulas = extract_formulas(out.get("stem_zh", ""))
        # Verify that all original formulas are present in the new formulas
        orig_f_set = orig_formulas["stem_zh"]
        orig_idx = 0
        for f in new_stem_formulas:
            if orig_idx < len(orig_f_set) and f == orig_f_set[orig_idx]:
                orig_idx += 1
        if orig_idx != len(orig_f_set):
            print(f"[WARNING] Invariance mismatch in {rec['question_id']}: matched {orig_idx}/{len(orig_f_set)} original formulas")
            invariance_failures += 1

        cleaned_records.append(out)

    if invariance_failures > 0:
        raise RuntimeError(f"Formula invariance check failed for {invariance_failures} records in {input_path}!")

    # Write output jsonl
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        for r in cleaned_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"Successfully wrote {len(cleaned_records)} records to {output_path}")
    print("\nShard Cleaning Statistics:")
    for k, v in cleaner.stats.items():
        print(f"  {k:22}: {v}")

    # Print 3 before/after samples of modified questions
    samples_shown = 0
    print("\n=== Spot-check Samples (Before vs After) ===")
    for orig, cleaned in zip(records, cleaned_records):
        if orig["stem_zh"] != cleaned["stem_zh"]:
            samples_shown += 1
            print(f"--- Sample {samples_shown}: {orig['question_id']} ---")
            print("BEFORE:", repr(orig["stem_zh"][:120]))
            print("AFTER: ", repr(cleaned["stem_zh"][:120]))
            print()
            if samples_shown >= 3:
                break

    print(f"=== Shard {input_path} Completed Successfully ===")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 clean_shard.py <input_json> <output_jsonl>")
        sys.exit(1)
    process_shard(sys.argv[1], sys.argv[2])
