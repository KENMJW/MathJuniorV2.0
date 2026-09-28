#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cleanup_task_data_0015.py

题库五大异常专项清洗与数据修复脚本 (TASK-DATA-0015)
实施批次 A + 批次 B 合并方案：
  - Phase 1: 文本脱壳 (145题反斜杠下划线)、题干泄题式下划线清洗、微专题/讲义尾巴裁切、大题缺少第(1)问补全
  - Phase 2: 题干配图归位与选项 D 恢复 (25题不对称选项D图片归位与文字恢复)
  - Phase 3: 串联合并题拆解与剥离 (Q-2026-YN-0007, Q-2026-YN-0005, Q-2025-77C3DE-0002, Q-2026-YN-0016)
  - Phase 4: 题型正名与漏答补全 (4题多空漏答 + 112题综合大题正名为 solution)

用法:
  python3 tools/docimport/cleanup_task_data_0015.py            # dry-run
  python3 tools/docimport/cleanup_task_data_0015.py --apply    # 单事务落库
"""

import os
import re
import json
import sqlite3
import argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
DB = os.path.join(ROOT, "data/questions.db")

# ----------------------------------------------------------------------
# 1. 选项 D 修复数据字典 (Phase 2)
# ----------------------------------------------------------------------
RESTORE_OPT_D_TEXT = {
    "Q-2026-YN-0008": {"zh": "$\\frac{4}{25}$", "en": "$\\frac{4}{25}$"},
    "Q-2026-SUZ-0009": {"zh": "$65^{\\circ}$", "en": "$65^{\\circ}$"},
    "Q-2026-CS-0014": {"zh": "$60^{\\circ}$", "en": "$60^{\\circ}$"},
    "Q-2026-ZJ-0013": {"zh": "$\\frac{2}{3}\\pi - \\frac{\\sqrt{3}}{2}$", "en": "$\\frac{2}{3}\\pi - \\frac{\\sqrt{3}}{2}$"},
    "Q-2026-ZJ-0014": {"zh": "(1, -5)", "en": "(1, -5)"},
    "Q-2026-ZJ-0015": {"zh": "$2.0{\\ g/cm}^{3}$", "en": "$2.0{\\ g/cm}^{3}$"},
    "Q-2025-65E8EC-0001": {"zh": "4个", "en": "4"},
    "Q-2025-28CD88-0001": {"zh": "$\\frac{\\sqrt{2}}{2}$", "en": "$\\frac{\\sqrt{2}}{2}$"},
    "Q-2025-77C3DE-0005": {"zh": "$k < n$", "en": "$k < n$"},
    "Q-2025-D4F656-0001": {"zh": "小于$\\frac{4}{5}$立方米", "en": "Less than $\\frac{4}{5}$ cubic meters"},
    "Q-2025-73B022-0001": {"zh": "$760^{\\circ}$", "en": "$760^{\\circ}$"},
    "Q-2025-0DD63A-0001": {"zh": "$7,5$", "en": "$7,5$"},
    "Q-2025-741C27-0001": {"zh": "大于2厘米", "en": "Greater than 2 cm"},
    "Q-2025-741C27-0002": {"zh": "不是同位角，且不相等", "en": "Not corresponding angles, and not equal"},
}

# 讲义微专题尾巴匹配正则
RE_TAIL_GARBAGE = re.compile(
    r'(\n\s*(?:微专题|类型[一二三四五六七八九十\d]|考向\s*\d|方法[一二三四五六七八九十\d]|方法解读|针对训练|变式训练|过关检测|真题感悟|课堂小结|【(?:本段|此段)建议校对|\d{1,2}\s*[．\.]\s*(?:如图|已知|在|若|计算|求|下列|二次函数)|#\s*二、填空题).*)$',
    re.DOTALL
)


def clean_underscores(text: str) -> str:
    """清除转义下划线 \\_\\_\\_\\_，规整为标准填空位 ____"""
    if not text:
        return text
    # 连续的 \_ 替换为 ____
    text = re.sub(r'(?:\\_)+', '____', text)
    # 单独的 \_ 替换为 ____
    text = text.replace(r'\_', '____')
    # 规整过长的连续下划线为标准 ____
    text = re.sub(r'_{5,}', '____', text)
    return text


def clean_leaked_blanks(stem: str, ans: str, sol: str) -> str:
    """清洗题干中内嵌的泄题答案 ____<答案>____ -> ____"""
    if not stem or "____" not in stem:
        return stem

    def repl(m):
        inner = m.group(1).strip()
        # 排除包含中文标点、句子开头连接词的正常文本
        if re.search(r'[，。！？；\(\)（）]|^(?:并|若|则|且|求|设|第|和|或|如图|在|已知|为|由)', inner):
            return m.group(0)
        clean_inner = re.sub(r'[\$ ]', '', inner)
        clean_ans = re.sub(r'[\$ ]', '', ans or '')
        clean_sol = re.sub(r'[\$ ]', '', sol or '')

        is_leaked = False
        if len(clean_inner) > 0 and clean_inner not in ['+', '-', '=', '，', ',']:
            if clean_inner in clean_ans or clean_inner in clean_sol:
                is_leaked = True
            elif re.match(r'^\$?[0-9a-zA-Z\\/+\-^_{}(),. \u03c0\u221a\u00b1]+\$?$', inner):
                is_leaked = True

        if is_leaked:
            return "____"
        return m.group(0)

    prev = ""
    curr = stem
    while prev != curr:
        prev = curr
        curr = re.sub(r'_{2,}([^_\n\r]{1,60}?)_{2,}', repl, curr)

    curr = re.sub(r'(?:____\s*){2,}', '____', curr)
    return curr


def clean_stem_tail(stem: str) -> tuple[str, bool]:
    """裁剪题末微专题/讲义/串联杂质"""
    if not stem:
        return stem, False
    m = RE_TAIL_GARBAGE.search(stem)
    if m:
        cut = stem[:m.start()].strip()
        if len(cut) > 10:
            return cut, True
    return stem, False


def run_cleanup(db_path: str, apply_changes: bool = False):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    rows = cur.execute("SELECT * FROM questions").fetchall()
    total_q = len(rows)
    print(f"============================================================")
    print(f"=== 题库专项清洗流水线 TASK-DATA-0015 (总计 {total_q} 题) ===")
    print(f"============================================================")

    count_p1_underscore = 0
    count_p1_leaked = 0
    count_p1_tail = 0
    count_p1_subq1 = 0
    count_p2_optd = 0
    count_p3_split = 0
    count_p4_multians = 0
    count_p4_mislabeled = 0

    updates = []

    # 预先扫描需要正名为 solution 的 112 道大题
    mislabeled_solution_ids = set()
    for q in rows:
        if q["question_type"] == "fill_blank":
            stem = q["stem_zh"]
            ans = q["answer_standard"].strip()
            s = stem.replace(r'\_', '_')
            s_cleaned = re.sub(r'_{2,}[^_]+?_{2,}', '___CLEANED___', s)
            blanks = list(re.finditer(r'_{2,}|(?<=[为是等于＝=])_(?=[。，；！？\s\n\)\）]|$)|（\s*）|\(\s*\)|【\s*】|___CLEANED___', s_cleaned))
            if len(blanks) > 1:
                has_subq = bool(re.search(r'（[12]）|\([12]\)|【任务|【问题|求证：', stem))
                if has_subq or q["score_default"] > 4:
                    if not re.search(r'（2）|\(2\)|②', ans):
                        mislabeled_solution_ids.add(q["question_id"])

    print(f"[Phase 4 预检] 锁定综合解答题误标为 fill_blank 题数: {len(mislabeled_solution_ids)}")

    for r in rows:
        qid = r["question_id"]
        stem = r["stem_zh"]
        stem_en = r["stem_en"]
        opts_raw = r["options_json"]
        ans = r["answer_standard"]
        sol_raw = r["solutions_json"]
        imgs_raw = r["image_paths_json"]
        qtype = r["question_type"]
        score = r["score_default"]

        changed = False
        new_stem = stem
        new_stem_en = stem_en
        new_opts_raw = opts_raw
        new_ans = ans
        new_sol_raw = sol_raw
        new_imgs_raw = imgs_raw
        new_qtype = qtype
        new_score = score

        # -------------------------------------------------------------
        # Phase 3: 4 道特殊串联合并题硬拆与重构
        # -------------------------------------------------------------
        if qid == "Q-2026-YN-0007":
            new_stem = "如图, $AB$ 是 $\\odot O$ 的弦,点 $C$ 在 $\\odot O$ 上. 若 $\\angle ACB = 26^{\\circ}$ ,则 $\\angle AOB =$\n\n[[IMG:0]]"
            new_opts_raw = json.dumps({
                "A": {"zh": "$10^{\\circ}$", "en": "$10^{\\circ}$"},
                "B": {"zh": "$26^{\\circ}$", "en": "$26^{\\circ}$"},
                "C": {"zh": "$40^{\\circ}$", "en": "$40^{\\circ}$"},
                "D": {"zh": "$52^{\\circ}$", "en": "$52^{\\circ}$"}
            }, ensure_ascii=False)
            new_ans = "D"
            new_sol_raw = json.dumps([{
                "method": "解法一 (圆周角定理)",
                "text": "根据圆周角定理，同弧所对的圆心角等于它所对圆周角的两倍，因此 $\\angle AOB = 2\\angle ACB = 2 \\times 26^\\circ = 52^\\circ$。故选 D。",
                "method_en": "Method 1 (Circumferential angle theorem)",
                "text_en": "According to the circumferential angle theorem, the central angle subtended by the same arc is equal to twice the circumferential angle it subtends, so $\\angle AOB = 2\\angle ACB = 2 \\times 26^\\circ = 52^\\circ$. So choose D."
            }], ensure_ascii=False)
            count_p3_split += 1
            changed = True

        elif qid == "Q-2026-YN-0005":
            new_stem = "某校开展了爱国主义演讲比赛, 五位评委为某参赛选手打出的分数 (单位: 分) 如下: $9,7,9,8,9$ , 这组数据的中位数为"
            new_opts_raw = json.dumps({
                "A": {"zh": "6", "en": "6"},
                "B": {"zh": "7", "en": "7"},
                "C": {"zh": "8", "en": "8"},
                "D": {"zh": "9", "en": "9"}
            }, ensure_ascii=False)
            new_ans = "D"
            new_imgs_raw = "[]"
            new_sol_raw = json.dumps([{
                "method": "解法一 (中位数求解)",
                "text": "把5位评委打出的分数按从小到大排序为：7, 8, 9, 9, 9。中位数是第3个数据，即9。故选 D。",
                "method_en": "Method 1 (Median calculation)",
                "text_en": "Sort the scores given by the 5 judges from smallest to largest: 7, 8, 9, 9, 9. The median is the 3rd data, which is 9. So choose D."
            }], ensure_ascii=False)
            count_p3_split += 1
            changed = True

        elif qid == "Q-2025-77C3DE-0002":
            new_stem = "若抛物线 $y = x^{2} - 2x - 2$ 的顶点为 $A$，与 $y$ 轴的交点为 $B$，则过 $A$，$B$ 两点的直线的解析式为____。"
            new_ans = "$y = -x - 2$"
            count_p3_split += 1
            changed = True

        elif qid == "Q-2026-YN-0016":
            new_stem = "计算：$(-1)^2 + |\\sqrt{3} - 2| - \\sqrt{12} + (2026 - \\pi)^0$。"
            new_stem_en = "Calculate: $(-1)^2 + |\\sqrt{3} - 2| - \\sqrt{12} + (2026 - \\pi)^0$."
            new_ans = "$4 - 3\\sqrt{3}$"
            new_sol_raw = json.dumps([{
                "method": "解法一 (实数混合运算)",
                "text": "原式 $= 1 + (2 - \\sqrt{3}) - 2\\sqrt{3} + 1 = 4 - 3\\sqrt{3}$。",
                "method_en": "Method 1 (Real number mixed operations)",
                "text_en": "Original expression $= 1 + (2 - \\sqrt{3}) - 2\\sqrt{3} + 1 = 4 - 3\\sqrt{3}$."
            }], ensure_ascii=False)
            count_p3_split += 1
            changed = True

        else:
            # ---------------------------------------------------------
            # Phase 1.1: 反斜杠下划线脱壳 (\_ -> ____)
            # ---------------------------------------------------------
            if r'\_' in new_stem:
                new_stem = clean_underscores(new_stem)
                count_p1_underscore += 1
                changed = True

            if new_opts_raw and r'\_' in new_opts_raw:
                new_opts_raw = clean_underscores(new_opts_raw)
                changed = True

            # ---------------------------------------------------------
            # Phase 1.2: 题干泄题式下划线清洗 (____答案____ -> ____)
            # ---------------------------------------------------------
            stem_after_leaked = clean_leaked_blanks(new_stem, ans, sol_raw)
            if stem_after_leaked != new_stem:
                new_stem = stem_after_leaked
                count_p1_leaked += 1
                changed = True

            # ---------------------------------------------------------
            # Phase 1.3: 微专题/讲义尾巴与行内校对杂质裁切
            # ---------------------------------------------------------
            stem_trimmed, was_trimmed = clean_stem_tail(new_stem)
            if was_trimmed:
                new_stem = stem_trimmed
                count_p1_tail += 1
                changed = True
                if new_imgs_raw:
                    try:
                        img_list = json.loads(new_imgs_raw)
                        refs = [int(m) for m in re.findall(r'\[\[IMG:(\d+)\]\]', new_stem)]
                        if refs:
                            max_ref = max(refs)
                            new_imgs_raw = json.dumps(img_list[:max_ref + 1], ensure_ascii=False)
                    except Exception:
                        pass

            # 清除行内校对标记
            if "建议校对" in new_stem:
                new_stem = re.sub(r'【(?:本段|此段)建议(?:校对|为校对之用)[^】]*】', '', new_stem).strip()
                changed = True

            # 特殊案例：Q-2025-7AE16F-0017
            if qid == "Q-2025-7AE16F-0017":
                new_stem = "解方程组或不等式：\n\n（1）$\\left\\{\\begin{array}{ll}3x+y=4 & \\textcircled{1} \\\\ 2x-y=1 & \\textcircled{2}\\end{array}\\right.$\n\n（2）$\\frac{x + 4}{3} - \\frac{3x - 1}{2} > 1$"
                new_qtype = "solution"
                new_score = 8
                changed = True

            # 特殊案例：Q-2025-7AE16F-0019
            if qid == "Q-2025-7AE16F-0019":
                new_stem = "解不等式组：$\\left\\{\\begin{matrix} 2x + 3 \\ge 1 \\\\ 3x - 2 < 7 \\end{matrix}\\right.$，并把解集在数轴上表示出来。\n\n[[IMG:0]]"
                new_qtype = "solution"
                new_score = 8
                changed = True

            # 特殊案例：Q-2025-470EAC-0006 选项 D 裁切
            if qid == "Q-2025-470EAC-0006" and new_opts_raw:
                try:
                    opts = json.loads(new_opts_raw)
                    if "D" in opts and "# 二、填空题" in opts["D"].get("zh", ""):
                        opts["D"]["zh"] = "$\\sqrt{3} - 2$"
                        opts["D"]["en"] = "$\\sqrt{3} - 2$"
                        new_opts_raw = json.dumps(opts, ensure_ascii=False)
                        changed = True
                except Exception:
                    pass

            # 特殊案例：Q-2025-MZ45-0018 题干首尾双裁切
            if qid == "Q-2025-MZ45-0018":
                idx = new_stem.find("（4）连接$BC$")
                if idx != -1:
                    new_stem = new_stem[idx:]
                    m = re.search(r'\n\s*方法解读.*', new_stem, re.DOTALL)
                    if m:
                        new_stem = new_stem[:m.start()].strip()
                    changed = True

            # ---------------------------------------------------------
            # Phase 1.4: 大题缺失第(1)问标号补全
            # ---------------------------------------------------------
            if qid == "Q-2025-A9D498-0020":
                if "在图1中，若" in new_stem and "（1）" not in new_stem:
                    new_stem = new_stem.replace("在图1中，若", "（1）在图1中，若")
                    count_p1_subq1 += 1
                    changed = True

            # ---------------------------------------------------------
            # Phase 2: 题干配图归位与选项 D 恢复 (25题不对称选项D图片归位)
            # ---------------------------------------------------------
            if new_opts_raw:
                try:
                    opts = json.loads(new_opts_raw)
                    if isinstance(opts, dict) and "D" in opts and isinstance(opts["D"], dict):
                        d_img = opts["D"].get("img")
                        d_zh = (opts["D"].get("zh") or "").strip()
                        has_abc_img = any(opts.get(k, {}).get("img") for k in ["A", "B", "C"])
                        if d_img and not has_abc_img:
                            cur_imgs = []
                            if new_imgs_raw:
                                try:
                                    cur_imgs = json.loads(new_imgs_raw)
                                except Exception:
                                    pass
                            if d_img not in cur_imgs:
                                cur_imgs.append(d_img)
                            new_imgs_raw = json.dumps(cur_imgs, ensure_ascii=False)

                            if "[[IMG:0]]" not in new_stem:
                                new_stem = new_stem.strip() + "\n\n[[IMG:0]]"

                            del opts["D"]["img"]

                            if qid in RESTORE_OPT_D_TEXT:
                                opts["D"]["zh"] = RESTORE_OPT_D_TEXT[qid]["zh"]
                                opts["D"]["en"] = RESTORE_OPT_D_TEXT[qid]["en"]
                            elif not d_zh:
                                opts["D"]["zh"] = "以上都不对"
                                opts["D"]["en"] = "None of the above"

                            new_opts_raw = json.dumps(opts, ensure_ascii=False)
                            count_p2_optd += 1
                            changed = True
                except Exception:
                    pass

        # -------------------------------------------------------------
        # Phase 4.1: 4 道真实多空题漏填答案补齐
        # -------------------------------------------------------------
        if qid == "Q-2025-MZ36-0003":
            new_ans = "平均数 7；中位数 7；众数 7；方差 1.2"
            count_p4_multians += 1
            changed = True
        elif qid == "Q-2025-MZ28-0002":
            new_qtype = "solution"
            new_score = 8
            new_ans = "（1）$\\frac{4}{5}$；（2）$\\frac{10}{3}$；（3）5"
            count_p4_multians += 1
            changed = True
        elif qid == "Q-2025-HEN-0037":
            new_ans = "$\\frac{4\\pi}{3} - 2\\sqrt{3}$"
            count_p4_multians += 1
            changed = True
        elif qid == "Q-2025-HEN-0038":
            new_ans = "$\\frac{25}{4}$或$\\frac{11}{2}$"
            count_p4_multians += 1
            changed = True

        # -------------------------------------------------------------
        # Phase 4.2: 112 道综合大题错标正名为 solution
        # -------------------------------------------------------------
        if qid in mislabeled_solution_ids and new_qtype == "fill_blank":
            new_qtype = "solution"
            if new_score < 6:
                new_score = 8
            count_p4_mislabeled += 1
            changed = True

        if changed:
            updates.append((
                new_stem, new_stem_en, new_opts_raw, new_ans, new_sol_raw,
                new_imgs_raw, new_qtype, new_score, qid
            ))

    print(f"\n============================================================")
    print(f"=== 清洗变更审计统计汇总 ===")
    print(f"============================================================")
    print(f"1. Phase 1.1 反斜杠下划线脱壳题目数: {count_p1_underscore}")
    print(f"2. Phase 1.2 题干泄题式下划线清洗题目数: {count_p1_leaked}")
    print(f"3. Phase 1.3 微专题/讲义尾巴裁切题目数: {count_p1_tail}")
    print(f"4. Phase 1.4 大题缺失第(1)问补全题目数: {count_p1_subq1}")
    print(f"5. Phase 2   选项 D 图片归位与文字恢复题目数: {count_p2_optd}")
    print(f"6. Phase 3   串联合并题拆解与修正题目数: {count_p3_split}")
    print(f"7. Phase 4.1 真实多空题漏填答案补全题目数: {count_p4_multians}")
    print(f"8. Phase 4.2 综合大题正名为 solution 题目数: {count_p4_mislabeled}")
    print(f"总计受影响题目更新条数: {len(updates)} / {total_q}")

    if apply_changes:
        print(f"\n[落库] 开始在单一事务中执行 UPDATE...")
        try:
            cur.execute("BEGIN TRANSACTION")
            cur.executemany(
                """
                UPDATE questions SET
                    stem_zh = ?,
                    stem_en = ?,
                    options_json = ?,
                    answer_standard = ?,
                    solutions_json = ?,
                    image_paths_json = ?,
                    question_type = ?,
                    score_default = ?
                WHERE question_id = ?
                """,
                updates
            )
            conn.commit()
            print(f"[落库成功] 已提交事务，成功更新 {len(updates)} 道题目！")
        except Exception as e:
            conn.rollback()
            print(f"[落库失败] 发生异常，已回滚 (ROLLBACK): {e}")
            raise e
    else:
        print(f"\n[DRY-RUN] 当前为试跑模式，未向数据库写入任何变更。加 --apply 参数执行落库。")

    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TASK-DATA-0015 Question Bank Cleanup")
    parser.add_argument("--db", default=DB, help="Path to questions.db")
    parser.add_argument("--apply", action="store_true", help="Apply changes to the database")
    args = parser.parse_args()
    run_cleanup(args.db, args.apply)
