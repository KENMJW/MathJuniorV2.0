# -*- coding: utf-8 -*-
"""Stage 1 concurrent runner for TASK-DATA-0003.
Spawns 5 independent processes to generate tmp/recheck/part1.jsonl ~ part5.jsonl.
Strictly adheres to concurrency safety: no database write in this stage.
"""
import subprocess
import sys
import os

def main():
    print("=== [Stage 1] Launching 5 concurrent workers ===")
    processes = []
    for part in range(1, 6):
        cmd = [sys.executable, "scripts/build/recheck_worker.py", "--part", str(part)]
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        processes.append((part, p))
        print(f"Spawned worker for Part {part} (PID: {p.pid})")
        
    all_success = True
    for part, p in processes:
        stdout, stderr = p.communicate()
        if p.returncode != 0:
            print(f"[Worker Part {part} ERROR] Exit code {p.returncode}")
            print(f"Stderr:\n{stderr}")
            all_success = False
        else:
            print(f"[Worker Part {part} OK] {stdout.strip()}")
            
    if not all_success:
        print("[Stage 1 FAILED] One or more workers encountered an error.")
        sys.exit(1)
        
    print("\n=== [Stage 1 Validation] Validating generated part*.jsonl files ===")
    total_lines = 0
    for part in range(1, 6):
        filename = f"tmp/recheck/part{part}.jsonl"
        if not os.path.exists(filename):
            print(f"Error: {filename} does not exist!")
            sys.exit(1)
        with open(filename, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        print(f"{filename}: {len(lines)} lines")
        total_lines += len(lines)
        
    print(f"\nTotal lines across 5 parts: {total_lines}")
    assert total_lines == 242, f"Expected 242 total lines, got {total_lines}"
    print("=== [Stage 1 SUCCESS] All 5 parts generated and validated! ===")

if __name__ == "__main__":
    main()
