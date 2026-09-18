#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一次性修复奥数批（Q-2025-0C417A-*）：
  1. 删垃圾题 Q-2025-0C417A-0040（纯表格残渣）
  2. 清所有 stem_zh / solutions_json 的 markdown 表格残渣（复用 import_docx.clean_pandoc_noise）
  3. qid 前缀 0C417A → AX：重命名 questions.question_id + 同步重命名图文件 + 更新 image_paths_json
默认 dry-run，--apply 才写库/动文件。
"""
import sys, os, re, json, sqlite3, argparse, importlib.util, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
DB = os.path.join(ROOT, "data/questions.db")

spec = importlib.util.spec_from_file_location("imp", os.path.join(HERE, "import_docx.py"))
imp = importlib.util.module_from_spec(spec); _a = sys.argv; sys.argv = ["x"]
spec.loader.exec_module(imp); sys.argv = _a

OLD_PFX = "Q-2025-0C417A-"
NEW_PFX = "Q-2025-AX-"
GARBAGE = "Q-2025-0C417A-0040"


def clean_sol(sj):
    if not sj:
        return sj
    try:
        arr = json.loads(sj)
        for it in arr:
            if isinstance(it, dict) and it.get("text"):
                it["text"] = imp.clean_pandoc_noise(it["text"])
        return json.dumps(arr, ensure_ascii=False)
    except Exception:
        return sj


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT question_id, stem_zh, solutions_json, image_paths_json "
        "FROM questions WHERE question_id LIKE ?", (OLD_PFX + "%",)
    ).fetchall()
    print(f"奥数批总数: {len(rows)}")

    plan = []          # (old_qid, new_qid, new_stem, new_sol, new_img_json, [(old_file,new_file)])
    del_count = 0
    for r in rows:
        oq = r["question_id"]
        if oq == GARBAGE:
            del_count += 1
            continue
        nq = oq.replace(OLD_PFX, NEW_PFX)
        new_stem = imp.clean_pandoc_noise(r["stem_zh"])
        new_sol = clean_sol(r["solutions_json"])
        file_moves = []
        new_img = r["image_paths_json"]
        if r["image_paths_json"]:
            arr = json.loads(r["image_paths_json"])
            new_arr = []
            for p in arr:
                # 图文件名含旧 qid → 换成新 qid
                newp = p.replace(oq, nq)
                if newp != p:
                    file_moves.append((os.path.join(ROOT, p), os.path.join(ROOT, newp)))
                new_arr.append(newp)
            new_img = json.dumps(new_arr, ensure_ascii=False)
        plan.append((oq, nq, new_stem, new_sol, new_img, file_moves))

    print(f"待删垃圾题: {del_count}")
    print(f"待改 qid: {len(plan)}")
    stem_changed = sum(1 for p in plan if p[2] != next(r["stem_zh"] for r in rows if r["question_id"] == p[0]))
    print(f"stem 被清洗: {stem_changed}")
    total_moves = sum(len(p[5]) for p in plan)
    print(f"图文件重命名: {total_moves}")
    print("\n--- 样本 ---")
    for p in plan[:3]:
        print(f"{p[0]} → {p[1]}")
        if p[5]:
            print(f"   图: {os.path.basename(p[5][0][0])} → {os.path.basename(p[5][0][1])}")

    if not args.apply:
        print("\n（dry-run，未写库/未动文件；加 --apply 执行）")
        conn.close(); return

    # 删垃圾
    cur.execute("DELETE FROM questions WHERE question_id=?", (GARBAGE,))
    # 改 qid + 清洗 + 图路径（先移文件再改库）
    moved = 0
    for oq, nq, new_stem, new_sol, new_img, file_moves in plan:
        for src, dst in file_moves:
            if os.path.exists(src):
                shutil.move(src, dst); moved += 1
        cur.execute(
            "UPDATE questions SET question_id=?, stem_zh=?, solutions_json=?, image_paths_json=? WHERE question_id=?",
            (nq, new_stem, new_sol, new_img, oq))
    conn.commit(); conn.close()
    print(f"\n✅ 删 {del_count} 垃圾题，改 {len(plan)} 条 qid，移动 {moved} 图文件")


if __name__ == "__main__":
    main()
