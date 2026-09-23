#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
清洗 questions.db 中 pandoc/markdown 文档垃圾字符残留（DATA-0010 未覆盖的新类型）。
针对 stem_zh / answer_standard / solutions_json / options_json 四字段。

垃圾类型（删除/规整）：
  1. pandoc HTML 内联标记：  `<!-- -->`{=html} / {=html} / <!-- --> / 裸反引号残段
  2. pandoc span 下划线填空：[答案内容]{.underline}  → 题面里替换为标准填空位 ____；
     （答案内容属于泄题，题面不应含；answer_standard 若缺可另补，但本脚本保守只清题面、不猜答案）
  3. pandoc 属性块残留：]{...}  ]{.xxx}
  4. 其它 HTML 标签残留：<sub></sub> 等（数学正文用不到）

保护（绝不动）：合法 LaTeX —— \sqrt[3]{}, \sqrt[\ ]{}, \frac{}{}, ^{}, _{}, \times 等。
  关键：LaTeX 的花括号 {} 前面总有命令(\cmd)或上下标(^_)或紧跟数字/字母参数；
  pandoc 垃圾的花括号总是 {=html} 或 ]{.class} 或 {.class} 形态，可精确区分。

默认 dry-run，--apply 才写库。只清洗，绝不删行、不改数学内容。
"""
import os, re, json, sqlite3, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
DB = os.path.join(ROOT, "data/questions.db")

# 1. pandoc HTML 内联：`<!-- -->`{=html} / {=html} / <!-- --> / 独立反引号
_RE_HTML_COMMENT = re.compile(r"`?<!--\s*-->`?(\{=html\})?")
_RE_EQ_HTML = re.compile(r"\{=html\}")
_RE_STRAY_BACKTICK = re.compile(r"`")
# 4. HTML 标签
_RE_HTML_TAG = re.compile(r"</?(?:sub|sup|span|div|p|br|em|strong|u)\b[^>]*>", re.I)

# 2/3. pandoc span：[内容]{.underline} 或 [内容]{...}
#   注意：只匹配 ]{ 紧跟 . 或 = 或 class 名的 pandoc span，避免误伤 LaTeX \sqrt[3]{x}
#   LaTeX 是 \sqrt[..]{..}（] 后 { 前无空格，但 { 内是数学内容，非 .class/=）
#   pandoc span 是 [文本]{.underline} / [文本]{#id} / [文本]{key=val}
_RE_PANDOC_SPAN = re.compile(r"\[([^\]]*?)\]\{[.#][^}]*\}")          # [x]{.underline}
_RE_PANDOC_SPAN_ATTR = re.compile(r"\[([^\]]*?)\]\{[^}]*=[^}]*\}")   # [x]{key=val}
# 孤立属性块 ]{.xxx}（前面 [ 丢失）
_RE_ORPHAN_ATTR = re.compile(r"\]\{[.#][^}]*\}|\]\{[^}]*=[^}]*\}")

# 5. markdown 表格残渣：+----+----+ 表格框、---- 长横线分隔、纯竖线空行
_RE_TABLE_PLUS = re.compile(r"\+[-+=]{3,}\+?[-+=]*\+?")     # +----+----+
_RE_LONG_DASH = re.compile(r"(?<![-\w])-{4,}(?![-\w])")       # 连续 ≥4 个横线(非单词内)
_RE_TABLE_PIPE_ROW = re.compile(r"^\s*\|[\s|:-]*\|\s*$", re.M)  # | --- | 表头分隔行
_RE_TABLE_SEP = re.compile(r"^\s*[:|]?\s*-{3,}\s*[:|]?\s*$", re.M)  # :---: 对齐行

FULLWIDTH_SPACE = "\u3000"


def clean_text(s):
    """返回 (清洗后文本, 是否变化, 抠出的填空答案列表)"""
    if not s:
        return s, False, []
    orig = s
    extracted = []

    # pandoc span 填空 [答案]{.underline} → 记录答案、题面替换成标准填空位
    def repl_span(m):
        content = m.group(1).strip().strip(FULLWIDTH_SPACE).strip()
        if content:
            extracted.append(content)
        return "____"  # 标准填空位
    s = _RE_PANDOC_SPAN.sub(repl_span, s)
    s = _RE_PANDOC_SPAN_ATTR.sub(repl_span, s)

    # HTML 注释 / {=html} / 反引号 / HTML 标签
    s = _RE_HTML_COMMENT.sub("", s)
    s = _RE_EQ_HTML.sub("", s)
    s = _RE_HTML_TAG.sub("", s)
    s = _RE_STRAY_BACKTICK.sub("", s)

    # 孤立属性块兜底
    s = _RE_ORPHAN_ATTR.sub("", s)

    # markdown 表格残渣
    s = _RE_TABLE_PLUS.sub("", s)
    s = _RE_TABLE_PIPE_ROW.sub("", s)
    s = _RE_TABLE_SEP.sub("", s)
    # 行内被中文/文字包围的 ------ 是破折号被 pandoc 转坏，还原为中文破折号"——"（不删，避免丢语义）
    s = re.sub(r"(?<=[\u4e00-\u9fa5\w”\"'])-{3,}(?=[\u4e00-\u9fa5\w“\"'])", "\u2014\u2014", s)
    # 其余独立/行尾的长横线残渣才删
    s = _RE_LONG_DASH.sub("", s)

    # 收敛多余空白（保守：只收敛 3+ 连续空格/换行）
    s = re.sub(r"[ \t]{3,}", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    s = s.strip()

    return s, (s != orig), extracted


def clean_json_field(raw):
    """清洗 solutions_json / options_json（JSON 内的文本字段）"""
    if not raw:
        return raw, False
    try:
        obj = json.loads(raw)
    except Exception:
        # 非法 JSON，当纯文本清
        c, ch, _ = clean_text(raw)
        return c, ch
    changed = [False]

    def walk(o):
        if isinstance(o, dict):
            return {k: walk(v) for k, v in o.items()}
        if isinstance(o, list):
            return [walk(x) for x in o]
        if isinstance(o, str):
            c, ch, _ = clean_text(o)
            if ch:
                changed[0] = True
            return c
        return o

    cleaned = walk(obj)
    return json.dumps(cleaned, ensure_ascii=False), changed[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=DB)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT question_id, stem_zh, answer_standard, solutions_json, options_json FROM questions"
    ).fetchall()

    updates = []
    n_stem = n_ans = n_sol = n_opt = 0
    n_extracted = 0
    samples = []
    for r in rows:
        qid = r["question_id"]
        new_stem, ch_stem, extracted = clean_text(r["stem_zh"])
        new_ans, ch_ans, _ = clean_text(r["answer_standard"])
        new_sol, ch_sol = clean_json_field(r["solutions_json"])
        new_opt, ch_opt = clean_json_field(r["options_json"])
        if extracted:
            n_extracted += len(extracted)
        if ch_stem or ch_ans or ch_sol or ch_opt:
            if ch_stem: n_stem += 1
            if ch_ans: n_ans += 1
            if ch_sol: n_sol += 1
            if ch_opt: n_opt += 1
            updates.append((new_stem, new_ans, new_sol, new_opt, qid))
            if len(samples) < 10 and ch_stem:
                samples.append((qid, r["stem_zh"], new_stem))

    print(f"全库 {len(rows)} 题扫描完成。")
    print(f"受影响题(并集): {len(updates)}")
    print(f"  stem_zh 清洗: {n_stem}  answer: {n_ans}  solutions: {n_sol}  options: {n_opt}")
    print(f"  从题面 pandoc span 抠出的填空答案片段数: {n_extracted}")
    print("\n=== 抽样(前10 stem 清洗前后) ===")
    for qid, before, after in samples:
        b = re.sub(r"\s+", " ", before)[:100]
        a = re.sub(r"\s+", " ", after)[:100]
        print(f"[{qid}]\n  旧: {b!r}\n  新: {a!r}")

    if args.apply:
        cur.executemany(
            "UPDATE questions SET stem_zh=?, answer_standard=?, solutions_json=?, options_json=? WHERE question_id=?",
            updates)
        conn.commit()
        print(f"\n已写库 {len(updates)} 行。")
    else:
        print("\n（dry-run，未写库；加 --apply 执行）")
    conn.close()


if __name__ == "__main__":
    main()
