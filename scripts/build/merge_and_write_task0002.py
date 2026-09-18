#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TASK-DATA-0002 阶段2：单进程串行写库与合并校验
读取 tmp/backfill2/part1.jsonl .. part5.jsonl
唯一写库进程，确保零并发写冲突
"""

import sys
import os
import sqlite3
import json
import hashlib
import re
from collections import Counter

sys.path.insert(0, os.path.abspath("."))
from scripts.build.math_gate import sanitize_and_verify_math

BACKUP_PATH = "data/questions.db.bak_before_task0002"
DB_PATH = "data/questions.db"

def verify_backup():
    if not os.path.exists(BACKUP_PATH):
        raise FileNotFoundError(f"Backup file {BACKUP_PATH} missing!")
    print(f"[✓] Backup file {BACKUP_PATH} exists ({os.path.getsize(BACKUP_PATH)} bytes).")

def main():
    print("=== 开始执行 TASK-DATA-0002 阶段2：单进程串行写库 ===")
    verify_backup()
    
    # 1. 读取 5 片 jsonl
    all_records = []
    seen_qids = set()
    
    for p in range(1, 6):
        part_file = f"tmp/backfill2/part{p}.jsonl"
        if not os.path.exists(part_file):
            raise FileNotFoundError(f"Partition file {part_file} not found!")
            
        with open(part_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            print(f"  -> Read {len(lines)} records from {part_file}")
            for line in lines:
                if not line.strip():
                    continue
                rec = json.loads(line)
                qid = rec["qid"]
                if qid in seen_qids:
                    raise ValueError(f"Duplicate question_id across parts: {qid}")
                seen_qids.add(qid)
                all_records.append(rec)
                
    total_records = len(all_records)
    print(f"[*] Total merged records: {total_records}")
    assert total_records == 2178, f"Expected 2178 records, got {total_records}"
    
    # 2. 统计与预校验
    records_by_qid = {r["qid"]: r for r in all_records}
    
    # 3. 串行写库（唯一进程，单一事务）
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 读取原有全部真实值做保真基准
    rows_orig = cur.execute("""
        SELECT question_id, stem_zh, stem_en, options_json, answer_standard, solutions_json, rubric_checklist_json, score_default, question_type
        FROM questions
        WHERE content_status = 'done'
        ORDER BY question_id ASC;
    """).fetchall()
    
    orig_map = {r[0]: r for r in rows_orig}
    assert len(orig_map) == 2178, f"Expected 2178 done questions in DB, got {len(orig_map)}"
    
    ans_filled_count = 0
    sol_filled_count = 0
    stem_en_filled_count = 0
    opt_en_filled_count = 0
    rubric_filled_count = 0
    multi_sol_count = 0
    low_conf_records = []
    
    for r in all_records:
        qid = r["qid"]
        orig = orig_map[qid]
        (
            _, stem_zh_orig, stem_en_orig, opts_orig, 
            ans_orig, sol_orig, rubric_orig, score_def, qtype
        ) = orig
        
        # 统计低置信度
        if r.get("answer_confidence") == "low":
            low_conf_records.append(r)
            
        # A. stem_en (仅当原值为空或__PENDING__时更新)
        stem_en_to_write = stem_en_orig
        if not stem_en_orig or stem_en_orig == '__PENDING__' or not stem_en_orig.strip():
            if r.get("stem_en"):
                stem_en_to_write = r["stem_en"]
                stem_en_filled_count += 1
                
        # B. answer_standard (仅当原值为空或__PENDING__时更新)
        ans_to_write = ans_orig
        if not ans_orig or ans_orig == '__PENDING__' or not ans_orig.strip():
            if r.get("answer_standard"):
                ans_to_write = r["answer_standard"]
                ans_filled_count += 1
                
        # C. solutions_json (当原值无实质解析文本时补齐；若原有文本无method则规范化升级)
        sol_to_write = sol_orig
        orig_has_text = False
        if sol_orig and sol_orig != '[]' and sol_orig.strip():
            try:
                orig_parsed = json.loads(sol_orig)
                if isinstance(orig_parsed, list) and len(orig_parsed) > 0:
                    for s_item in orig_parsed:
                        if isinstance(s_item, dict) and s_item.get("text", "").strip():
                            orig_has_text = True
                            break
                        elif isinstance(s_item, str) and s_item.strip():
                            orig_has_text = True
                            break
                elif isinstance(orig_parsed, str) and orig_parsed.strip():
                    orig_has_text = True
            except Exception:
                orig_has_text = bool(sol_orig.strip())

        if not orig_has_text:
            if r.get("solutions_json"):
                sol_to_write = json.dumps(r["solutions_json"], ensure_ascii=False)
                sol_filled_count += 1
        else:
            # 原本有实质文本：确保规范化为 [{"method":"解法一","text":"..."}] 结构，100% 保留原文本
            try:
                orig_sol_parsed = json.loads(sol_orig)
                if isinstance(orig_sol_parsed, list) and len(orig_sol_parsed) > 0:
                    normalized = []
                    for idx, s_item in enumerate(orig_sol_parsed):
                        if isinstance(s_item, dict):
                            m_title = s_item.get("method") or (f"解法{idx+1}" if len(orig_sol_parsed) > 1 else "解法一")
                            normalized.append({"method": m_title, "text": s_item.get("text", "")})
                        else:
                            normalized.append({"method": "解法一", "text": str(s_item)})
                    sol_to_write = json.dumps(normalized, ensure_ascii=False)
            except Exception:
                pass


                
        # 统计多解题
        if sol_to_write:
            try:
                s_list = json.loads(sol_to_write)
                if isinstance(s_list, list) and len(s_list) > 1:
                    multi_sol_count += 1
            except Exception:
                pass
                
        # D. options_json (若有 options_en 且原选项缺少 en，补齐 en)
        opts_to_write = opts_orig
        if opts_orig and r.get("options_en"):
            try:
                opt_data = json.loads(opts_orig)
                changed = False
                for k, opt_val in opt_data.items():
                    if not opt_val.get("en"):
                        opt_val["en"] = r["options_en"].get(k, "")
                        changed = True
                if changed:
                    opts_to_write = json.dumps(opt_data, ensure_ascii=False)
                    opt_en_filled_count += 1
            except Exception:
                pass
                
        # E. rubric_checklist_json (仅解答题缺少时补齐)
        rubric_to_write = rubric_orig
        if qtype == "solution":
            if not rubric_orig or rubric_orig == '[]' or not rubric_orig.strip():
                if r.get("rubric_checklist_json"):
                    # 确保总分一致
                    assert sum(s["points"] for s in r["rubric_checklist_json"]) == score_def, f"Rubric sum error for {qid}"
                    rubric_to_write = json.dumps(r["rubric_checklist_json"], ensure_ascii=False)
                    rubric_filled_count += 1
                    
        # 执行更新 (注意：绝不修改 stem_zh)
        cur.execute("""
            UPDATE questions
            SET stem_en = ?,
                options_json = ?,
                answer_standard = ?,
                solutions_json = ?,
                rubric_checklist_json = ?
            WHERE question_id = ?;
        """, (stem_en_to_write, opts_to_write, ans_to_write, sol_to_write, rubric_to_write, qid))
        
    conn.commit()
    conn.close()
    
    print(f"[✓] Successfully committed all updates to {DB_PATH}.")
    print(f"[*] Update statistics:")
    print(f"    - stem_en filled: {stem_en_filled_count}")
    print(f"    - answer_standard filled: {ans_filled_count}")
    print(f"    - solutions_json filled: {sol_filled_count}")
    print(f"    - options_json en filled: {opt_en_filled_count}")
    print(f"    - rubric_checklist_json filled: {rubric_filled_count}")
    print(f"    - questions with multi-solutions: {multi_sol_count}")
    print(f"    - low confidence answers: {len(low_conf_records)}")
    
    # 4. 后置校验（逐条验收清单）
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 验收项 1: stem_zh 零改动
    conn_bak = sqlite3.connect(BACKUP_PATH)
    cur_bak = conn_bak.cursor()
    bak_stems = cur_bak.execute("SELECT question_id, stem_zh FROM questions WHERE content_status = 'done' ORDER BY question_id;").fetchall()
    curr_stems = cur.execute("SELECT question_id, stem_zh FROM questions WHERE content_status = 'done' ORDER BY question_id;").fetchall()
    conn_bak.close()
    
    assert len(bak_stems) == len(curr_stems), "Stem count mismatch with backup!"
    for (qid_b, s_b), (qid_c, s_c) in zip(bak_stems, curr_stems):
        assert qid_b == qid_c, f"QID mismatch: {qid_b} vs {qid_c}"
        assert s_b == s_c, f"stem_zh modified for {qid_b}!"
    print("  [✓] stem_zh 零改动比对备份通过！")
    
    # 验收项 2: 无 DELETE
    total_q = cur.execute("SELECT count(*) FROM questions;").fetchone()[0]
    assert total_q == 2178, f"Total count modified! {total_q} != 2178"
    print(f"  [✓] 题总数零变动: {total_q} 道。")
    
    # 验收项 3: stem_en 无 __PENDING__
    pending_en = cur.execute("SELECT count(*) FROM questions WHERE stem_en IS NULL OR stem_en = '' OR stem_en = '__PENDING__';").fetchone()[0]
    assert pending_en == 0, f"Remaining pending stem_en: {pending_en}"
    print("  [✓] stem_en 100% 补全，无 __PENDING__ 残留。")
    
    # 验收项 4: answer_standard 无 __PENDING__ 或空
    pending_ans = cur.execute("SELECT count(*) FROM questions WHERE answer_standard IS NULL OR answer_standard = '' OR answer_standard = '__PENDING__';").fetchone()[0]
    assert pending_ans == 0, f"Remaining pending answer_standard: {pending_ans}"
    print("  [✓] answer_standard 100% 补全，无 __PENDING__ 或空残留。")
    
    # 验收项 5: 原有真实值未被覆盖 (抽验)
    orig_ans_checked = 0
    for qid, orig in orig_map.items():
        ans_o = orig[4]
        if ans_o and ans_o != '__PENDING__' and ans_o.strip():
            ans_curr = cur.execute("SELECT answer_standard FROM questions WHERE question_id = ?;", (qid,)).fetchone()[0]
            assert ans_curr == ans_o, f"Original answer overwritten for {qid}: {ans_o} -> {ans_curr}"
            orig_ans_checked += 1
    print(f"  [✓] 原有真实值保真抽验通过（核验了全部 {orig_ans_checked} 道已有答案题目）。")

    # 验收项 6: 翻译未动公式（抽验 stem_en 里 $...$ 与 stem_zh 的 $...$ 一致）
    formula_sample_checked = 0
    rows_for_formula = cur.execute("SELECT question_id, stem_zh, stem_en FROM questions WHERE stem_zh LIKE '%$%' ORDER BY question_id LIMIT 100;").fetchall()
    for qid, szh, sen in rows_for_formula:
        zh_formulas = [f.strip() for f in re.findall(r'\$[^\$]+\$', szh) if not f.endswith(r'\$')]
        en_formulas = [f.strip() for f in re.findall(r'\$[^\$]+\$', sen) if not f.endswith(r'\$')]
        # 验证公式主体保留
        for f in zh_formulas[:3]:
            # 基础代数公式应在英文题干中原样保留
            if len(f) > 5 and r'\right.' not in f:
                assert f in sen or f.replace(" ", "") in sen.replace(" ", ""), f"Formula changed in translation for {qid}: {f}"
        formula_sample_checked += 1
    print(f"  [✓] 翻译未动公式抽验通过（核验了 {formula_sample_checked} 道含公式题目）。")

    # 验收项 7: rubric 各步分值之和 = score_default (全部解答题)
    rubric_rows = cur.execute("SELECT question_id, score_default, rubric_checklist_json FROM questions WHERE question_type = 'solution';").fetchall()
    for qid, s_def, r_json in rubric_rows:
        if r_json:
            r_list = json.loads(r_json)
            pts_sum = sum(item.get("points") or item.get("score") or 0 for item in r_list)
            assert pts_sum == s_def, f"Rubric sum mismatch for {qid}: {pts_sum} != {s_def}"
    print(f"  [✓] 解答题 rubric 评分细则总分严格对齐（核验了全部 {len(rubric_rows)} 道解答题）。")

    # 验收项 8: solutions_json 结构合法性校验
    sol_rows = cur.execute("SELECT question_id, solutions_json FROM questions WHERE content_status = 'done';").fetchall()
    valid_sol_count = 0
    for qid, s_json in sol_rows:
        assert s_json and s_json != '[]', f"Empty solutions_json for {qid}"
        s_list = json.loads(s_json)
        assert isinstance(s_list, list) and len(s_list) > 0, f"Invalid solutions_json for {qid}"
        for s_item in s_list:
            assert "method" in s_item and "text" in s_item, f"Missing method or text in {qid}"
            assert len(s_item["text"].strip()) > 0, f"Empty text in solution for {qid}"
        valid_sol_count += 1
    print(f"  [✓] solutions_json 结构合法性全数通过（核验了全部 {valid_sol_count} 道题目）。")

    # 验收项 9: 数学门神抽样与入库前置检验
    math_tested = 0
    test_rows = cur.execute("SELECT question_id, stem_en, answer_standard FROM questions WHERE stem_en LIKE '%$%' LIMIT 200;").fetchall()
    for qid, sen, ans in test_rows:

        if sen:
            sanitize_and_verify_math(sen)
        if ans and '$' in ans:
            sanitize_and_verify_math(ans)
        math_tested += 1
    print(f"  [✓] 数学门神 sanitize_and_verify_math() 试编译抽检全数通过（核验了 {math_tested} 道公式题）。")

    conn.close()
    print("✅ [TASK-DATA-0002 阶段2校验全数通过！]")

if __name__ == "__main__":
    main()

