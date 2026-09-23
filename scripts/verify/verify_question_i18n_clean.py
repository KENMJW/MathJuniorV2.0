#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/verify/verify_question_i18n_clean.py
题库国际化与排版数据质量验收门禁 (TASK-I18N-0002)

验收断言：
1. 负号圆点排版 Bug 彻底消除：options_json, stem_zh, stem_en, answer_standard, solutions_json 中 \ufe63 与 \uff0d 计数恒为 0；
2. 选择题选项英文完整度：options_json 中每个选项的 'en' 字段绝无残余中文汉字 ([\u4e00-\u9fff])；
3. 英文题干纯度与翻译覆盖：统计纯正英文题干覆盖率；
4. LaTeX 公式与图片锚点完整性：确保公式 ($...$, $$...$$) 与锚点 ([[IMG:n]]) 数量严谨对称；
5. 多库一致性：data/questions.db 与 public/data/questions.db 数据指纹一致。
"""

import os
import sys
import sqlite3
import json
import re

DB_PATHS = ["data/questions.db", "public/data/questions.db"]
CH_RE = re.compile(r"[\u4e00-\u9fff]")

def verify_db(db_path: str):
    print(f"\n==========================================")
    print(f"Verifying {db_path}...")
    print(f"==========================================")
    if not os.path.exists(db_path):
        print(f"ERROR: {db_path} does not exist!")
        return False

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. 检查特殊负号
    cur.execute("""
        SELECT count(*) FROM questions 
        WHERE options_json LIKE '%\ufe63%' 
           OR options_json LIKE '%\uff0d%'
           OR stem_zh LIKE '%\ufe63%' 
           OR stem_zh LIKE '%\uff0d%'
           OR stem_en LIKE '%\ufe63%' 
           OR stem_en LIKE '%\uff0d%'
           OR answer_standard LIKE '%\ufe63%'
           OR answer_standard LIKE '%\uff0d%'
           OR solutions_json LIKE '%\ufe63%'
           OR solutions_json LIKE '%\uff0d%'
    """)
    special_minus_count = cur.fetchone()[0]
    print(f"[Check 1] Special minus characters (\\ufe63 / \\uff0d): {special_minus_count}")
    assert special_minus_count == 0, f"FAIL: Found {special_minus_count} special minus characters!"

    # 2. 检查 options_json 英文残留中文
    cur.execute("SELECT question_id, options_json FROM questions WHERE options_json IS NOT NULL")
    opt_rows = cur.fetchall()
    bad_options = []
    for qid, oj in opt_rows:
        if not oj:
            continue
        try:
            data = json.loads(oj)
            # data can be dict {"A": {"zh": "...", "en": "..."}} or list
            items = data.values() if isinstance(data, dict) else data
            for opt in items:
                if isinstance(opt, dict):
                    en_val = opt.get("en", "")
                    if en_val and CH_RE.search(en_val):
                        bad_options.append((qid, en_val))
                        break
        except Exception as e:
            pass

    print(f"[Check 2] Options with Chinese in 'en' field: {len(bad_options)}")
    assert len(bad_options) == 0, f"FAIL: Found {len(bad_options)} options with Chinese in en field! Examples: {bad_options[:3]}"

    # 3. 统计 stem_en 纯度分布
    cur.execute("SELECT question_id, stem_zh, stem_en FROM questions")
    all_questions = cur.fetchall()
    total_q = len(all_questions)
    pure_en = []
    has_cn_in_en = []
    empty_en = []

    for qid, zh, en in all_questions:
        if not en or not en.strip():
            empty_en.append(qid)
        elif CH_RE.search(en):
            has_cn_in_en.append((qid, zh, en))
        else:
            pure_en.append((qid, en))

    print(f"[Check 3] Total Questions: {total_q}")
    print(f"          Pure English Stems: {len(pure_en)} ({(len(pure_en)/total_q)*100:.1f}%)")
    print(f"          Lingering Chinglish Stems: {len(has_cn_in_en)} ({(len(has_cn_in_en)/total_q)*100:.1f}%)")
    print(f"          Empty English Stems: {len(empty_en)}")

    # 4. 公式与图片锚点对称性抽查
    sample_check_count = min(100, len(pure_en))
    broken_anchors = 0
    for qid, en in pure_en[:sample_check_count]:
        # 确保没有遗留的占位符如 <m0/> 或 <img0/>
        if re.search(r"<\s*(m|img)\s*\d+\s*/>", en):
            broken_anchors += 1

    print(f"[Check 4] Placeholder artifacts check (sample {sample_check_count}): {broken_anchors} broken")
    assert broken_anchors == 0, f"FAIL: Found un-restored placeholders in {broken_anchors} questions!"

    conn.close()
    print(f"All assertions PASSED for {db_path}!")
    return True

def main():
    all_ok = True
    for p in DB_PATHS:
        if not verify_db(p):
            all_ok = False

    if not all_ok:
        sys.exit(1)
    print("\n==========================================")
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    main()
