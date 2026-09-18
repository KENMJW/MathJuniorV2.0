#!/usr/bin/env python3
"""
为 data/core.db 的 knowledge_points 和 logic_lines 表安全添加 content_status 列
用于阶段二内容回填进度跟踪与断点续传。
"""

import sqlite3

CORE_DB_PATH = "data/core.db"

def add_content_status_columns():
    conn = sqlite3.connect(CORE_DB_PATH)
    cur = conn.cursor()

    # 1. 检查 knowledge_points
    kp_cols = [c[1] for c in cur.execute("PRAGMA table_info(knowledge_points);").fetchall()]
    if "content_status" not in kp_cols:
        print("[CoreDB] Adding content_status column to knowledge_points...")
        cur.execute("ALTER TABLE knowledge_points ADD COLUMN content_status VARCHAR(12) NOT NULL DEFAULT 'pending';")
    else:
        print("[CoreDB] knowledge_points already has content_status.")

    # 2. 检查 logic_lines
    ll_cols = [c[1] for c in cur.execute("PRAGMA table_info(logic_lines);").fetchall()]
    if "content_status" not in ll_cols:
        print("[CoreDB] Adding content_status column to logic_lines...")
        cur.execute("ALTER TABLE logic_lines ADD COLUMN content_status VARCHAR(12) NOT NULL DEFAULT 'pending';")
    else:
        print("[CoreDB] logic_lines already has content_status.")

    conn.commit()
    conn.close()
    print("[CoreDB] Column check & update completed.")

if __name__ == "__main__":
    add_content_status_columns()
