#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本批导入(pending)垃圾行精准清洗。
只处理 content_status='pending' 行；done 题零变动。

分类（保守优先，宁可漏删不可错删真题）：
  DELETE_PURE_JUNK   : 试卷说明/答题卡须知等纯行政说明，且无任何真题信号 → 删
  DELETE_ANSWER      : 答案/解析碎片（∴∵ / 解:/解析:/因为…/(N分)评分 + 推理）且无题干信号 → 删
  DELETE_TABLE_FRAG  : 频率分布表残行（纯 "区间 频数 频率" 数字，无题干信号）→ 删
  KEEP_MIXED         : 有真题信号但夹带噪声（答题卡尾注/## 标题）→ 保留(仅报告，人工/切题器后处理)
  KEEP_CLEAN         : 正常真题 → 保留

真题信号（命中任一即视为含题，绝不删）：
  如图 / 计算 / 化简 / 求 / 证明 / 下列 / 解方程 / 若 / 已知 / 数学公式 $...$ /
  选项 A．B．/ 填空下划线 / 方程/函数/三角形/面积/概率 等数学名词
"""
import os, re, sqlite3, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
DB = os.path.join(ROOT, "data/questions.db")

# ---------- 真题信号：命中即保留（宁可漏删不可错删真题，故词表尽量宽） ----------
QUESTION_SIGNAL = re.compile(
    r"如图|计算|化简|证明|下列|解方程|方程|函数|三角形|四边形|"
    r"面积|周长|概率|统计|不等式|化为|已知|若\s|填空|判断|下面|"
    r"正确的是|错误的是|等于|多少|几种|取值范围|最小值|最大值|"
    # "求"需接数学宾语，避免命中"要求/请求"等说明词
    r"求[值和差积商证解出这那的其面周长角边点线]|求出|求证|试求|求得|"
    r"科学记数法|记数法|表示为|保留|精确到|化简求值|"
    # 数学名词/常见考点词
    r"相反数|绝对值|倒数|平方根|算术平方根|立方根|有理数|无理数|实数|"
    r"象限|坐标|数轴|因式|分式|整式|多项式|单项式|指数|对数|根号|"
    r"角度|度数|夹角|平行|垂直|相似|全等|对称|平移|旋转|位似|圆|扇形|弧|"
    r"抛物线|双曲线|直线|线段|射线|中点|顶点|斜率|截距|周期|"
    r"命题|真命题|假命题|充分|必要|"
    r"平均数|中位数|众数|方差|频率|频数|中奖率|调查|样本|"
    r"影长|旗杆|竹竿|速度|路程|利润|单价|折扣|浓度|"    # 应用题常见对象
    r"大于|小于|至少|至多|范围|规律|第\s*\d+\s*次|"
    r"\$[^$]+\$|"                       # LaTeX 公式
    r"[ABCD][．.、]\s*\S|"              # 选项
    r"_{3,}|＿{2,}|underline|\\_|（\s*）|\(\s*\)|▲"  # 填空空位/占位
)

# ---------- 纯行政说明特征 ----------
INSTRUCTION = re.compile(
    r"答题卡|准考证|条形码|2B铅笔|涂改液|涂改胶|贴纸|签字笔|座位号|考室|考场号|"
    r"请将题目写成|保持卡面|卡面清洁|不要折叠|不要弄破|一律无效|作答无效|"
    r"考试时间\s*\d+\s*分钟|考试时量|监考|交回|试题卷和答题|草稿纸"
)
# 卷头元信息（满分/页数/题数结构说明）
PAPER_META = re.compile(
    r"(满分\s*\d+\s*分).*(考试时间|考试时量|分钟)|"
    r"本试卷共.*小题|本学科试卷共|共\s*\d+\s*页|分选择题和非选择题"
)

# ---------- 答案碎片特征 ----------
ANSWER_FRAG = re.compile(r"∴|∵")
ANSWER_OPENER = re.compile(r"^\s*(?:解析|解法|证明|解)\s*[：:]|^\s*[（(]\s*\d+\s*[）)]\s*(?:证明|解得|解)\s*[：:]?|^\s*因为")
# 答案列表起手：（1）解得… / （1）48人 …N分  —— 以子题号+答案词开头
ANSWER_LIST_OPENER = re.compile(r"^\s*[（(]\s*1\s*[）)]\s*(?:解得|证明|.{0,10}?\d+\s*分)")
SCORE_MARK = re.compile(r"[（(]\s*\d+\s*分\s*[）)]")
ANSWER_INFER = re.compile(r"解得|化简得|故答案为|证明：|由题意")

# ---------- 频率分布表残行 ----------
# 形如 "5-22.5   2      0.050" / "合计  40  1.00"，纯数字列
TABLE_FRAG = re.compile(r"^\s*(?:合计\s+)?[\d.\-\s]+$")

# ---------- 题型段标题（## 一、选择题…）——是段标题不是题干 ----------
SECTION_HEADER = re.compile(r"(?:选择题|填空题|解答题|计算题|证明题)")


def real_question_signal(stem):
    """去掉 ## 段标题行 后，是否仍有真题信号。段标题(## 一、选择题…)不算真题。"""
    # 移除 markdown 标题行 与 图片锚点，剩下的才算正文
    body = re.sub(r"^\s*#+\s.*$", "", stem, flags=re.M)      # ## 标题行
    body = re.sub(r"\[\[IMG:\d+\]\]", "", body)              # 图锚点
    body = re.sub(r"第\s*\d+\s*题图|图\s*\d", "", body)      # 图注
    return bool(QUESTION_SIGNAL.search(body))


def classify(stem):
    s = stem.strip()
    stripped = re.sub(r"\s", "", s)
    head = s[:60]

    # 先判是否答案列表起手（（1）解得…N分）——铁定答案，即便含"证明"等词
    if ANSWER_LIST_OPENER.search(head):
        return "DELETE_ANSWER"
    if ANSWER_OPENER.search(head) or ANSWER_FRAG.search(s):
        # 起手是答案 或 含推理符 → 答案
        return "DELETE_ANSWER"
    # 标准答案列表（数字./字母 密集答案序列）→ 答案
    if is_answer_key(s):
        return "DELETE_ANSWER"
    # 起手是频率分布表残行（区间 频数 频率）→ 表残渣，即便后面拖了 [[IMG]] / 残片
    if re.match(r"^\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s+\d+\s+[\d.]+", s) or re.match(r"^\s*合计\s+\d+", s):
        return "DELETE_TABLE_FRAG"

    # 真题信号：需在剔除 ## 段标题/图锚点后仍有信号，才算真题
    if real_question_signal(s):
        if INSTRUCTION.search(head) or PAPER_META.search(head):
            return "KEEP_MIXED"      # 真题夹带噪声，保留供切题器/人工后处理
        return "KEEP_CLEAN"

    # 到这里：正文无真题信号（可能只有 ## 段标题 / 行政说明 / 残渣）----
    if TABLE_FRAG.match(s) and len(stripped) < 30:
        return "DELETE_TABLE_FRAG"
    if INSTRUCTION.search(s) or PAPER_META.search(s):
        return "DELETE_PURE_JUNK"
    # 只有 ## 选择题 段标题、无真正题干 → 段标题残渣
    if SECTION_HEADER.search(s) and len(re.sub(r"[#\s]", "", s)) < 60:
        return "DELETE_PURE_JUNK"
    score_marks = len(SCORE_MARK.findall(s))
    if score_marks >= 1 and ANSWER_INFER.search(s):
        return "DELETE_ANSWER"
    # 纯"## 题号(N分)"标题 + 图锚点，无任何题干正文 → 残渣
    body_txt = re.sub(r"^\s*#+\s.*$", "", s, flags=re.M)
    body_txt = re.sub(r"\[\[IMG:\d+\]\]|第\s*\d+\s*题图|图\s*\d|[（(]\s*\d+\s*分\s*[）)]", "", body_txt)
    if len(re.sub(r"\s", "", body_txt)) < 6 and (SECTION_HEADER.search(s) or re.search(r"^\s*#+\s*\d+", s, re.M) or "[[IMG:" in s):
        return "DELETE_PURE_JUNK"
    # 答题提示/答题区域/同义词说明 等（无题干信号）→ 说明残渣
    if re.search(r"答题提示|答题区域|作答无效|同义|注意事项|矩形边框", s):
        return "DELETE_PURE_JUNK"

    # 兜底：无题干信号也无明确删除特征 → 保守保留，报告为可疑供人工核对（不删）
    return "KEEP_SUSPECT"


# ---------- 答案标准答案列表（教师版卷末答案区被切成"题"）----------
# 特征：多个 "序号. 答案" 密集排列（如 "-3 12. 21 13. -3/2 14. 1"），
#       或字母答案列表（"A 16. C 17. D 18. B"），或含"二、选择题"等段标题夹字母答案。
_ANSWER_KEY_NUMSEQ = re.compile(r"(?:\d{1,2}\s*[.．、]\s*){3,}")     # ≥3 个 "数字."
_ANSWER_KEY_LETTERSEQ = re.compile(r"(?:[ABCD]\s+\d{1,2}\s*[.．]\s*){2,}")  # A 16. C 17. …


def is_answer_key(stem):
    """仅识别高置信的答案列表，避免误伤含表格的应用题：
    - 字母答案序列 'A 16. C 17. D 18. B'（选择题答案区，极高置信）
    - 起手就是密集 '数字. 答案 数字. 答案' 且全文无任何题干动词/情境词（纯答案区）
    """
    s = stem.strip()
    # 情境/题干信号：只要出现，就认为该行含真题（可能尾部拼了答案），不按纯答案区删除
    guard = re.search(r"如图|计算|化简|求出|求\s*[\$∠]|求.{0,4}(值|度数|面积|周长|概率)|"
                      r"证明|已知|下列|阅读|工厂|学校|商店|设\s|甲种|乙种|两种产品|"
                      r"随机抽|绘制|统计图|调查了", s)
    if guard:
        return False
    if _ANSWER_KEY_LETTERSEQ.search(s):
        return True
    # 起手(前30字内)即密集"数字."序列 → 纯答案区
    if _ANSWER_KEY_NUMSEQ.match(s[:30].lstrip()) or _ANSWER_KEY_NUMSEQ.search(s[:20]):
        return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=DB)
    ap.add_argument("--apply", action="store_true", help="真正删库（默认 dry-run）")
    args = ap.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT question_id, stem_zh, image_paths_json FROM questions WHERE content_status='pending'"
    ).fetchall()

    import json
    buckets = {}
    del_ids = []
    del_imgs = []          # 待删行携带的图片文件（相对路径）
    for r in rows:
        c = classify(r["stem_zh"] or "")
        buckets.setdefault(c, []).append(r)
        if c.startswith("DELETE_"):
            del_ids.append(r["question_id"])
            ipj = r["image_paths_json"] if "image_paths_json" in r.keys() else None
            if ipj:
                try:
                    del_imgs += json.loads(ipj)
                except Exception:
                    pass

    print(f"pending 总行: {len(rows)}")
    print("=" * 60)
    for cat in ["DELETE_PURE_JUNK", "DELETE_ANSWER", "DELETE_TABLE_FRAG",
                "KEEP_MIXED", "KEEP_SUSPECT", "KEEP_CLEAN"]:
        lst = buckets.get(cat, [])
        print(f"[{cat}] {len(lst)} 行")
        if cat.startswith("DELETE_") or cat in ("KEEP_MIXED", "KEEP_SUSPECT"):
            for r in lst[:12]:
                st = re.sub(r"\s+", " ", (r["stem_zh"] or ""))[:66]
                print(f"    {r['question_id']}  {st}")
            if len(lst) > 12:
                print(f"    ... 还有 {len(lst)-12} 行")
    print("=" * 60)
    print(f"拟删除总计: {len(del_ids)} 行，携带图片文件 {len(del_imgs)} 个")

    if args.apply:
        cur.executemany("DELETE FROM questions WHERE question_id=?",
                        [(i,) for i in del_ids])
        conn.commit()
        # 删除孤儿图片文件
        removed_img = 0
        for rel in del_imgs:
            fp = os.path.join(ROOT, rel)
            if os.path.exists(fp):
                os.remove(fp); removed_img += 1
        remain = cur.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
        pend = cur.execute("SELECT COUNT(*) FROM questions WHERE content_status='pending'").fetchone()[0]
        print(f"✅ 已删 {len(del_ids)} 行 + {removed_img} 图片。questions.db 现共 {remain} 题，pending {pend} 题。")
    else:
        print("（dry-run，未删库；加 --apply 执行）")
    conn.close()


if __name__ == "__main__":
    main()
