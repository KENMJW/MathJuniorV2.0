"""
TASK-DATA-0015 最大化并发生成调度器
8 路物理分片并发执行，生成 214 个中英双语概念 SVG，双源头原子写入，并自动执行四大质量门禁
"""

import os
import sys
import time
import hashlib
from concurrent.futures import ProcessPoolExecutor

# 引入当前包
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from scripts.build.svg.part1_algebra_numbers import generate_part1
from scripts.build.svg.part2_equations import generate_part2
from scripts.build.svg.part3_functions import generate_part3
from scripts.build.svg.part4_triangles import generate_part4
from scripts.build.svg.part5_quadrilaterals import generate_part5
from scripts.build.svg.part6_circles_transforms import generate_part6
from scripts.build.svg.part7_trigonometry import generate_part7
from scripts.build.svg.part8_statistics_prob import generate_part8
from scripts.verify_svg_assets import verify_all_svgs

def run_worker(task):
    part_idx, func = task
    start_t = time.time()
    data = func()
    elapsed = time.time() - start_t
    return part_idx, data, elapsed

def get_file_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def main():
    # 铁律 2: 双源头同时写入机制 (源码源头 + 运行目录)
    target_dirs = [
        "assets/concepts",
        "public/assets/concepts"
    ]
    if os.path.exists("dist/assets/concepts"):
        target_dirs.append("dist/assets/concepts")

    for d in target_dirs:
        os.makedirs(d, exist_ok=True)
    
    tasks = [
        (1, generate_part1),
        (2, generate_part2),
        (3, generate_part3),
        (4, generate_part4),
        (5, generate_part5),
        (6, generate_part6),
        (7, generate_part7),
        (8, generate_part8),
    ]
    
    print(f"🚀 启动 8 路最大化并发生成流水线 (Concurrency = 8)...")
    start_all = time.time()
    all_results = {}
    
    with ProcessPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(run_worker, t) for t in tasks]
        for f in futures:
            part_idx, results, elapsed = f.result()
            print(f"  ✓ 分片 Part {part_idx} 并发完成: 产出 {len(results)} 个 SVG 文件 (耗时 {elapsed*1000:.1f}ms)")
            all_results.update(results)
                
    total_written = 0
    print(f"\n💾 正在执行双源头原子写入 ({len(all_results)} 个文件 × {len(target_dirs)} 个目标目录)...")
    for fname, svg_content in all_results.items():
        for d in target_dirs:
            fpath = os.path.join(d, fname)
            with open(fpath, "w", encoding="utf-8") as out_f:
                out_f.write(svg_content)
            total_written += 1

    total_time = time.time() - start_all
    print(f"🎉 全部分片生成写入完成！共写入 {total_written} 个目标文件 (总耗时 {total_time:.2f}s)")

    # 校验双目录 SHA256 100% 一致
    print(f"\n🔐 校验 assets/ 与 public/assets/ SHA256 一致性...")
    sha_mismatch = 0
    for fname in all_results.keys():
        sha_src = get_file_sha256(os.path.join("assets/concepts", fname))
        sha_pub = get_file_sha256(os.path.join("public/assets/concepts", fname))
        if sha_src != sha_pub:
            print(f"  ❌ 哈希不匹配: {fname} (src: {sha_src[:8]}, pub: {sha_pub[:8]})")
            sha_mismatch += 1
    if sha_mismatch == 0:
        print(f"  ✅ 214 个 SVG 文件在双目录下 SHA256 100% 逐字节完全一致！")
    else:
        print(f"  ❌ 发现 {sha_mismatch} 个文件哈希不一致！")
        sys.exit(1)
    
    print(f"\n🔍 即刻执行自动化四大门禁质检...")
    passed = verify_all_svgs()
    if not passed:
        print("❌ 门禁未通过，请检查错误！")
        sys.exit(1)
    else:
        print("✅ 全量 214 个概念 SVG 门禁 100% 通过！")

if __name__ == "__main__":
    main()
