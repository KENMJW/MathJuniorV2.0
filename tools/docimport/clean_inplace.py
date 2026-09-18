#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一次性原地清洗 questions.db 中已入库 pending 行的遗留污染（旧工具导入产生）：
  1. region: 剥 '2025•' 年份前缀 → 纯地名（复用 import_docx.normalize_region）
  2. stem_zh: 剥 MZ 半角出处前缀 (2021广东21题8分) + 全角出处前缀（复用 strip_prefix）
  3. stem_zh / solutions_json: 清 pandoc 属性块 {width=..} 与 第N题解图 图注（复用 clean_pandoc_noise）
只改 content_status='pending' 且非哨兵的行；done 题不动。dry-run 默认，--apply 才写库。
"""
import sys, os, re, json, sqlite3, argparse, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
DB = os.path.join(ROOT, "data/questions.db")

# 复用 import_docx 的清洗函数，保证口径一致
spec = importlib.util.spec_from_file_location("imp", os.path.join(HERE, "import_docx.py"))
imp = importlib.util.module_from_spec(spec)
_argv = sys.argv; sys.argv = ["x"]
spec.loader.exec_module(imp)
sys.argv = _argv


def clean_stem(stem):
    if not stem:
        return stem
    s = imp.clean_pandoc_noise(stem)
    # 剥出处前缀（strip_prefix 返回纯题干；这里只要 cleaned）
    s2, _, _ = imp.strip_prefix(s)
    return s2.strip() if s2 else s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=DB)
    ap.add_argument("--apply", action="store_true", help="真正写库（默认 dry-run）")
    args = ap.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT question_id, region, stem_zh, solutions_json FROM questions "
        "WHERE content_status='pending'"
    ).fetchall()

    n_region, n_stem, n_sol = 0, 0, 0
    updates = []
    for r in rows:
        qid = r["question_id"]
        new_region = imp.normalize_region(r["region"]) if r["region"] else r["region"]
        # region 为空时，尝试从题面 MZ 前缀 (2021广东21题8分) 回补地区
        if not new_region and r["stem_zh"]:
            _, _, hint = imp.strip_prefix(r["stem_zh"])
            if hint:
                new_region = imp.normalize_region(hint)
        new_stem = clean_stem(r["stem_zh"])
        new_sol = r["solutions_json"]
        if new_sol:
            try:
                arr = json.loads(new_sol)
                changed = False
                for item in arr:
                    if isinstance(item, dict) and item.get("text"):
                        c = imp.clean_pandoc_noise(item["text"])
                        if c != item["text"]:
                            item["text"] = c; changed = True
                if changed:
                    new_sol = json.dumps(arr, ensure_ascii=False)
            except Exception:
                pass

        d_region = new_region != r["region"]
        d_stem = new_stem != r["stem_zh"]
        d_sol = new_sol != r["solutions_json"]
        if d_region: n_region += 1
        if d_stem: n_stem += 1
        if d_sol: n_sol += 1
        if d_region or d_stem or d_sol:
            updates.append((new_region, new_stem, new_sol, qid))

    print(f"pending 行: {len(rows)}")
    print(f"待清洗: region {n_region}, stem {n_stem}, solutions {n_sol}")
    print(f"总影响行: {len(updates)}")

    if updates and updates[:3]:
        print("--- 抽样(前3条 stem 变化) ---")
        shown = 0
        for r in rows:
            new_stem = clean_stem(r["stem_zh"])
            if new_stem != r["stem_zh"] and shown < 3:
                print(f"[{r['question_id']}]")
                print(f"  旧: {r['stem_zh'][:70]!r}")
                print(f"  新: {new_stem[:70]!r}")
                shown += 1

    if args.apply:
        cur.executemany(
            "UPDATE questions SET region=?, stem_zh=?, solutions_json=? WHERE question_id=?",
            updates)
        conn.commit()
        print(f"✅ 已写库 {len(updates)} 行")
    else:
        print("（dry-run，未写库；加 --apply 执行）")
    conn.close()


if __name__ == "__main__":
    main()
