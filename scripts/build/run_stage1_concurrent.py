#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TASK-DATA-0001 阶段1：启动 5 片并发 worker
并发 5 片只读 questions.db，各写各的 tmp/backfill/partN.jsonl
"""

import multiprocessing
import os
import sys
import time

sys.path.insert(0, os.path.abspath("."))
from scripts.build.backfill_worker import run_part

def worker_proc(part_num):
    run_part(part_num)

def main():
    print("=== 开始执行 TASK-DATA-0001 阶段1：并发 5 片只读判定 ===")
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
    print(f"✅ 阶段1 全部 5 片并发判定完成！耗时: {elapsed:.2f} 秒。")
    
    # 检查生成的文件
    for p in range(1, 6):
        fpath = f"tmp/backfill/part{p}.jsonl"
        assert os.path.exists(fpath), f"Missing {fpath}"
        with open(fpath) as f:
            lines = [l for l in f if l.strip()]
        print(f"  - {fpath}: {len(lines)} records")

if __name__ == "__main__":
    main()
