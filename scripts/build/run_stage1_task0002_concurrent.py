#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TASK-DATA-0002 阶段1：启动 5 片并发 worker
并发 5 片只读 questions.db，各写各的 tmp/backfill2/partN.jsonl
"""

import multiprocessing
import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))
from scripts.build.backfill2_worker import run_part

def worker_proc(part_num):
    run_part(part_num)

def main():
    print("=== 开始执行 TASK-DATA-0002 阶段1：并发 5 片只读补全 ===")
    start_time = time.time()
    
    processes = []
    for p in range(1, 6):
        proc = multiprocessing.Process(target=worker_proc, args=(p,), name=f"Worker-Part{p}")
        processes.append(proc)
        proc.start()
        print(f"[*] Spawned Worker-Part{p} (PID: {proc.pid})")
        
    for proc in processes:
        proc.join()
        if proc.exitcode != 0:
            raise RuntimeError(f"Process {proc.name} failed with exit code {proc.exitcode}")
            
    elapsed = time.time() - start_time
    print(f"✅ 阶段1 全部 5 片并发判定与内容生成完成！耗时: {elapsed:.2f} 秒。")
    
    # 检查生成的文件
    total = 0
    for p in range(1, 6):
        fpath = f"tmp/backfill2/part{p}.jsonl"
        assert os.path.exists(fpath), f"Missing {fpath}"
        with open(fpath) as f:
            lines = [l for l in f if l.strip()]
        total += len(lines)
        print(f"  - {fpath}: {len(lines)} records")
        
    print(f"[*] Total records across 5 parts: {total}")
    assert total == 2178, f"Expected 2178 records, got {total}"

if __name__ == "__main__":
    main()
