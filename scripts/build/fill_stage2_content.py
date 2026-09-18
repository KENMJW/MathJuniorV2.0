#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阶段二 内容回填调度主脚本
执行 6.2 考点四段 -> 6.4 母题四维 -> 6.3 主线四段
100% 经过 sanitize_and_verify_math 数学门神校验
支持断点续传（仅处理 content_status = 'pending'）
"""

import os
import sys
import sqlite3
from typing import Dict, Any

# 确保脚本根路径可导入
sys.path.insert(0, os.path.abspath("."))

from scripts.build.math_gate import sanitize_and_verify_math
from scripts.build.content.kp_algebra import KP_ALGEBRA
from scripts.build.content.kp_geometry import KP_GEOMETRY
from scripts.build.content.kp_statistics import KP_STATISTICS
from scripts.build.content.logic_lines_content import LOGIC_LINES_CONTENT
from scripts.build.content.master_content import get_master_content

CORE_DB = "data/core.db"
MASTER_DB = "data/master.db"
BACKUP_DIR = "data/backup_stage2"

ALL_KPS = {**KP_ALGEBRA, **KP_GEOMETRY, **KP_STATISTICS}

def verify_and_clean(field_name: str, text: str) -> str:
    """对包含公式的文本调用数学门神进行清洗与 KaTeX 校验"""
    if not text:
        return text
    try:
        cleaned = sanitize_and_verify_math(text)
        return cleaned
    except Exception as e:
        print(f"❌ Math gate failed on {field_name}: {e}")
        raise

def fill_knowledge_points(conn: sqlite3.Connection):
    """6.2 回填 core.db 107 考点四段精讲 (双语)"""
    cur = conn.cursor()
    pending_rows = cur.execute("""
        SELECT point_id FROM knowledge_points WHERE content_status = 'pending';
    """).fetchall()
    
    print(f"\n[Step 6.2] Found {len(pending_rows)} pending knowledge points to backfill.")
    updated_count = 0

    for (pid,) in pending_rows:
        if pid not in ALL_KPS:
            raise KeyError(f"Point ID {pid} not found in content libraries!")
        
        kp_data = ALL_KPS[pid]
        
        # 数学门神清洗与校验
        origin_zh = verify_and_clean(f"{pid}.origin_story_zh", kp_data["origin_story_zh"])
        origin_en = verify_and_clean(f"{pid}.origin_story_en", kp_data["origin_story_en"])
        intuit_zh = verify_and_clean(f"{pid}.intuitive_essence_zh", kp_data["intuitive_essence_zh"])
        intuit_en = verify_and_clean(f"{pid}.intuitive_essence_en", kp_data["intuitive_essence_en"])
        formal_zh = verify_and_clean(f"{pid}.formal_definition_zh", kp_data["formal_definition_zh"])
        formal_en = verify_and_clean(f"{pid}.formal_definition_en", kp_data["formal_definition_en"])
        variat_zh = verify_and_clean(f"{pid}.intrinsic_variation_zh", kp_data["intrinsic_variation_zh"])
        variat_en = verify_and_clean(f"{pid}.intrinsic_variation_en", kp_data["intrinsic_variation_en"])

        cur.execute("""
            UPDATE knowledge_points
            SET origin_story_zh = ?,
                origin_story_en = ?,
                intuitive_essence_zh = ?,
                intuitive_essence_en = ?,
                formal_definition_zh = ?,
                formal_definition_en = ?,
                intrinsic_variation_zh = ?,
                intrinsic_variation_en = ?,
                content_status = 'done'
            WHERE point_id = ?;
        """, (
            origin_zh, origin_en,
            intuit_zh, intuit_en,
            formal_zh, formal_en,
            variat_zh, variat_en,
            pid
        ))
        updated_count += 1
        if updated_count % 20 == 0 or updated_count == len(pending_rows):
            conn.commit()
            print(f"  -> Processed {updated_count}/{len(pending_rows)} knowledge points.")

    conn.commit()
    print(f"✅ [Step 6.2] Completed {updated_count} knowledge points backfill.")

def fill_master_examples(conn: sqlite3.Connection):
    """6.4 回填 master.db 119 母题四维 dim1/2/4 (绝不修改 dim3!)"""
    cur = conn.cursor()
    pending_rows = cur.execute("""
        SELECT example_id, bound_target_id FROM master_examples WHERE content_status = 'pending';
    """).fetchall()

    print(f"\n[Step 6.4] Found {len(pending_rows)} pending master examples to backfill.")
    updated_count = 0

    for eid, target_id in pending_rows:
        data = get_master_content(eid, target_id)
        
        dim1 = verify_and_clean(f"{eid}.dim1_origin", data["dim1_origin"])
        dim2 = verify_and_clean(f"{eid}.dim2_essence", data["dim2_essence"])
        dim4 = verify_and_clean(f"{eid}.dim4_traps", data["dim4_traps"])

        # 严格只更新 dim1, dim2, dim4 与 content_status，绝不触碰 dim3_rigor
        cur.execute("""
            UPDATE master_examples
            SET dim1_origin = ?,
                dim2_essence = ?,
                dim4_traps = ?,
                content_status = 'done'
            WHERE example_id = ?;
        """, (dim1, dim2, dim4, eid))
        updated_count += 1
        if updated_count % 20 == 0 or updated_count == len(pending_rows):
            conn.commit()
            print(f"  -> Processed {updated_count}/{len(pending_rows)} master examples.")

    conn.commit()
    print(f"✅ [Step 6.4] Completed {updated_count} master examples backfill.")

def fill_logic_lines(conn: sqlite3.Connection):
    """6.3 回填 core.db 12 主线四段精讲 (双语，向上归纳)"""
    cur = conn.cursor()
    pending_rows = cur.execute("""
        SELECT line_id FROM logic_lines WHERE content_status = 'pending';
    """).fetchall()

    print(f"\n[Step 6.3] Found {len(pending_rows)} pending logic lines to backfill.")
    updated_count = 0

    for (lid,) in pending_rows:
        if lid not in LOGIC_LINES_CONTENT:
            raise KeyError(f"Line ID {lid} not found in logic lines content library!")

        line_data = LOGIC_LINES_CONTENT[lid]
        
        found_zh = verify_and_clean(f"{lid}.origin_foundation_zh", line_data["origin_foundation_zh"])
        found_en = verify_and_clean(f"{lid}.origin_foundation_en", line_data["origin_foundation_en"])
        leaps_zh = verify_and_clean(f"{lid}.spiral_leaps_zh", line_data["spiral_leaps_zh"])
        leaps_en = verify_and_clean(f"{lid}.spiral_leaps_en", line_data["spiral_leaps_en"])
        metho_zh = verify_and_clean(f"{lid}.methodology_zh", line_data["methodology_zh"])
        metho_en = verify_and_clean(f"{lid}.methodology_en", line_data["methodology_en"])
        matrix_zh = verify_and_clean(f"{lid}.exam_matrix_zh", line_data["exam_matrix_zh"])
        matrix_en = verify_and_clean(f"{lid}.exam_matrix_en", line_data["exam_matrix_en"])

        cur.execute("""
            UPDATE logic_lines
            SET origin_foundation_zh = ?,
                origin_foundation_en = ?,
                spiral_leaps_zh = ?,
                spiral_leaps_en = ?,
                methodology_zh = ?,
                methodology_en = ?,
                exam_matrix_zh = ?,
                exam_matrix_en = ?,
                content_status = 'done'
            WHERE line_id = ?;
        """, (
            found_zh, found_en,
            leaps_zh, leaps_en,
            metho_zh, metho_en,
            matrix_zh, matrix_en,
            lid
        ))
        updated_count += 1
        print(f"  -> Processed logic line {lid} ({line_data['origin_foundation_zh'][:20]}...)")

    conn.commit()
    print(f"✅ [Step 6.3] Completed {updated_count} logic lines backfill.")

def main():
    print("=================================================================")
    print("   阶段二 内容回填流水线启动 (考点四段 + 母题四维 + 主线四段)   ")
    print("=================================================================")

    if not os.path.exists(BACKUP_DIR):
        raise RuntimeError(f"Safety violation: Backup directory {BACKUP_DIR} does not exist! Please backup data/*.db first.")

    # 1. 回填 core.db 考点
    core_conn = sqlite3.connect(CORE_DB)
    fill_knowledge_points(core_conn)

    # 2. 回填 master.db 母题
    master_conn = sqlite3.connect(MASTER_DB)
    fill_master_examples(master_conn)

    # 3. 回填 core.db 主线
    fill_logic_lines(core_conn)

    core_conn.close()
    master_conn.close()

    print("\n🎉 阶段二所有内容字段回填执行完毕！")

if __name__ == "__main__":
    main()
