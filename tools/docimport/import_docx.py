#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
真题文档导入工具（占位版）
把原生 OMML 公式的 doc/docx（教师版真题卷）→ Pandoc 抽取 → 切题 → 占位入库 data/questions.db。

用法：
  python3 tools/docimport/import_docx.py <文件或文件夹> [--db data/questions.db] [--dry-run]

流程：
  1. 体检(inspect)：只处理 PASS 的原生 OMML docx，REJECT 的跳过并报告
  2. extract：Pandoc 抽取 markdown + 图片(原位锚定)
  3. segment：切题（大题号 / 题型段 / 教师版答案解析归位）
  4. load：对齐 questions 扁平 schema，占位入库（content_status='pending'）

占位策略（本地拿不到的字段，留 Antigravity 阶段二回填）：
  primary_point_id='KP-000'(哨兵) / difficulty_level=0 / stem_en='__PENDING__'
  grade_level=0 / semester=0 / combination_id=NULL / content_status='pending'
能本地拿到的直接填：stem_zh / options_json / answer_standard / solutions / image_paths / question_type / source

安全：只 INSERT 追加，question_id 去重（已存在则跳过），绝不 DELETE/重建。
"""
import sys, os, re, json, subprocess, sqlite3, hashlib, argparse, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../.."))
DEFAULT_DB = os.path.join(ROOT, "data/questions.db")
IMG_DIR = os.path.join(ROOT, "assets/questions")
PANDOC = shutil.which("pandoc") or "/opt/homebrew/bin/pandoc"

# ---------- 1. 体检 ----------
def inspect_ok(path):
    """复用 inspect_source 逻辑：只放行原生 OMML docx。返回 (ok, reason)。"""
    if not path.lower().endswith(".docx"):
        return False, "非 docx（老 .doc 需先转 docx；PDF 不支持）"
    import zipfile
    try:
        z = zipfile.ZipFile(path)
        xml = z.read("word/document.xml").decode("utf-8", "ignore")
    except Exception as e:
        return False, f"无法读取: {e}"
    omml = len(re.findall(r"<m:oMath[ >]", xml))
    wmf = sum(1 for n in z.namelist() if n.lower().endswith((".wmf", ".emf")))
    # 可抽文本量：<w:t> 节点内的中文/字符总长（扫描件几乎为 0，纯文字题很大）
    text_chars = sum(len(t) for t in re.findall(r"<w:t[ >][^<]*", xml))
    if omml >= 20 and wmf <= omml * 0.2:
        return True, f"原生OMML公式 {omml}，矢量碎片 {wmf}"
    if wmf >= 50 and omml == 0:
        return False, f"WMF碎片 {wmf}、OMML=0（公式非结构化，需多模态）"
    if omml == 0:
        # 零公式再分两类：纯文字题（文本充足，可抽）vs 扫描件/空壳（文本稀少，抽不了）
        if text_chars >= 200:
            return True, f"纯文字题（OMML=0，可抽文本 {text_chars} 字符，WMF={wmf}）"
        return False, f"无OMML且文本稀少（文本 {text_chars} 字符，疑似扫描件/空壳，需多模态）"
    return True, f"OMML {omml}（混合，建议抽检）"

# ---------- 2. 抽取 ----------
def extract(path, workdir):
    os.makedirs(workdir, exist_ok=True)
    media = os.path.join(workdir, "media")
    md_path = os.path.join(workdir, "out.md")
    subprocess.run([PANDOC, path, "--extract-media=" + media, "-t", "markdown", "-o", md_path],
                   check=True, capture_output=True)
    with open(md_path, encoding="utf-8") as f:
        return f.read(), media

# ---------- 3. 切题 ----------
QTYPE_HEADERS = [
    (r"(选择题|单选题)", "single_choice"),
    (r"(填空题)", "fill_blank"),
    (r"(解答题|计算题|证明题)", "solution"),
]

# 地区 → 拼音简码（qid 用 ASCII，可追溯）
REGION_CODE = {
    "北京":"BJ","上海":"SH","天津":"TJ","重庆":"CQ","成都":"CD","四川":"SC",
    "广东":"GD","深圳":"SZ","广州":"GZ","广西":"GX","江苏":"JS","苏州":"SUZ",
    "扬州":"YZ","连云港":"LYG","浙江":"ZJ","山东":"SD","威海":"WH","烟台":"YT",
    "临沂":"LY","山西":"SX","河北":"HEB","河南":"HEN","湖北":"HUB","湖南":"HUN",
    "长沙":"CS","江西":"JX","安徽":"AH","福建":"FJ","贵州":"GZH","云南":"YN",
    "辽宁":"LN","吉林":"JL","长春":"CC","黑龙江":"HLJ","绥化":"SUH","齐齐哈尔":"QQHE",
    "龙东":"LD","甘肃":"GS","兰州":"LZ","青海":"QH","陕西":"SAX","新疆":"XJ",
    "内蒙古":"NMG","宁夏":"NX","内江":"NEJ","凉山":"LS","南充":"NC","宜宾":"YB",
    "广安":"GA","德阳":"DY","泸州":"LUZ","眉山":"MS","自贡":"ZG","达州":"DZH",
    "遂宁":"SUN","兵团":"BT",
}

def guess_source_abbr(filename):
    """从文件名提取 (qid简码, 年份, 完整source标签)。qid 简码用 ASCII。"""
    base = os.path.splitext(os.path.basename(filename))[0]
    ym = re.search(r"(20\d{2})", base)
    year = ym.group(1) if ym else "2025"

    # 微专题：总复习NN 微专题 XX  → 简码 MZ + 编号
    m_mz = re.search(r"总复习\s*0*(\d+)", base)
    if m_mz:
        return f"MZ{int(m_mz.group(1)):02d}", year, base

    # 省卷/期末：匹配地区（优先长地名，如"齐齐哈尔"先于"齐"）
    for region in sorted(REGION_CODE, key=len, reverse=True):
        if region in base:
            return REGION_CODE[region], year, base

    # 兜底：文件名 ASCII 化
    ascii_part = re.sub(r"[^A-Za-z0-9]", "", base)[:6].upper() or "DOC"
    return ascii_part, year, base

# 题干冗余前缀：分值 + 出处。全角(（）)和半角(())都覆盖。
# 三类：（3分）（24-25八年级·山西大同·阶段练习） / （2025•成都）/（2024东莞三模）
#      / (2021广东21题8分)（MZ微专题真题标注，半角，含"题…分"）
PREFIX_RE = re.compile(
    r"^\s*(?:[（(][^）)]*分[^）)]*[）)]\s*)?"
    r"(?:[（(][^）)]*(?:练习|期末|期中|模拟|中考|月考|联考|预测|真题|阶段|一模|二模|三模|调研|题\d+|•|·|\d{4})[^）)]*[）)]\s*)*"
)

# MZ 真题出处：(2021广东21题8分) → 地区"广东"
_MZ_SRC_RE = re.compile(r"^\s*[（(]\s*(20\d{2})\s*([\u4e00-\u9fa5]{2,6}?)\s*\d*\s*题?\s*\d*\s*分?\s*[）)]")

def strip_prefix(stem):
    """剥离题干开头的 分值/出处/年份地区 前缀，返回 (纯题干, 分值, 出处地区)。"""
    score = None; source_hint = None
    # MZ 半角真题标注优先：(2021广东21题8分)
    m_mz = _MZ_SRC_RE.match(stem)
    if m_mz:
        source_hint = m_mz.group(2)          # 只留地区名，年份归 exam_year 逻辑另处理
    m_score = re.match(r"^\s*[（(]\s*(\d+)\s*分\s*[）)]", stem)
    if m_score: score = int(m_score.group(1))
    m_src = re.search(r"[（(]([^）)]*(?:练习|期末|期中|模拟|中考|月考|联考|预测|真题|阶段|一模|二模|三模|调研|•|·)[^）)]*)[）)]", stem[:120])
    if m_src and not source_hint: source_hint = m_src.group(1)
    cleaned = PREFIX_RE.sub("", stem, count=1).strip()
    return cleaned, score, source_hint

# 微专题练习区块标记（只抽这些区块下的题）
PRACTICE_SECTION_RE = re.compile(r"练考点|课后练习|针对训练|巩固练习|随堂练习|当堂|课堂练习|专项训练|强化训练")
# 讲解/例题区块标记（跳过）
LECTURE_SECTION_RE = re.compile(r"考点精讲|考点梳理|构建知识|高频考点|考点\d|典例|例题精讲|方法归纳|知识体系")
# 答案/详解区块标记（学案答案区，跳过其下所有内容）
ANSWER_SECTION_RE = re.compile(r"参考答案|答案与解析|答案解析|详解详析|详细解答")

# ---------- 答案碎片识别（切出的"题"其实是答案时丢弃）----------
# 答案独有特征：解答起手式 / 评分标注 / 解法提示 / 解图引用
_ANSWER_OPENER_RE = re.compile(
    r"^\s*(?:>?\s*)?"
    r"(?:解\s*[：:]|证明\s*[：:]|[（(]\s*\d+\s*[）)]\s*(?:证明|解)\s*[：:])"
)
_ANSWER_SIGNAL_RE = re.compile(
    r"解法提示|如解图|第\s*\d+\s*题解图|【解法提示】|"        # 解图/解法提示
    r"[（(]\s*\d+\s*分\s*[）)]|"                              # (2分) 评分标注（答案独有）
    r"∴|∵"                                                    # 因此/因为（解答推理符，题干几乎不用）
)

# pandoc 残留：![](x){width="1.29in" height="0.77in"} 的属性块 / 图注
# 属性块可能跨行、被表格管道符 | 打断，故 DOTALL 且允许非贪婪吞到闭合 }
_PANDOC_ATTR_RE = re.compile(r"\{[^{}]*?(?:width|height)\s*=[^{}]*?\}", re.S)
# 兜底：紧跟 [[IMG:n]] 之后、未闭合(缺 })的 {width=... 残段（表格断裂造成）
_PANDOC_ATTR_OPEN_RE = re.compile(r"\{\s*(?:width|height)\s*=[^}\n]*(?:\n[^}\n]*)?(?=\||\n\n|$)")
# 兜底2：表格拆散后缺前 { 的孤儿残尾，如 '| height="0.7in"}' 或 'width="1in" height="0.7in"}'
_PANDOC_ATTR_ORPHAN_RE = re.compile(r"\|?\s*(?:width|height)\s*=\s*\"[^\"]*\"\s*(?:\n?\s*(?:width|height)\s*=\s*\"[^\"]*\")?\s*\}?")
_FIG_CAPTION_RE = re.compile(r"^\s*第\s*\d+\s*题(?:解)?图[①-⑩\d]*\s*$", re.M)
# pandoc markdown 表格残渣：HTML 注释 <!-- --> / 表格分隔线 -- -- -- / 纯 | 空行
_MD_TABLE_COMMENT_RE = re.compile(r"<!--\s*-*\s*-->|<!--|-->")
_MD_TABLE_RULE_RE = re.compile(r"^\s*[-\s|:]*(?:--\s+)+[-\s|:]*$", re.M)   # 形如 "-- -- -- --"
_MD_EMPTY_PIPE_RE = re.compile(r"^\s*\|[\s|]*\|\s*$", re.M)

def clean_pandoc_noise(text):
    """去掉 pandoc 抽取残留的图片尺寸属性块、解图图注行、markdown 表格残渣。"""
    if not text:
        return text
    text = _PANDOC_ATTR_RE.sub("", text)
    text = _PANDOC_ATTR_OPEN_RE.sub("", text)     # 兜底清未闭合残段
    text = _PANDOC_ATTR_ORPHAN_RE.sub("", text)   # 兜底清表格拆散的孤儿残尾
    text = _FIG_CAPTION_RE.sub("", text)
    text = _MD_TABLE_COMMENT_RE.sub("", text)     # HTML 注释 <!-- -->
    text = _MD_TABLE_RULE_RE.sub("", text)        # 表格分隔线 -- -- --
    text = _MD_EMPTY_PIPE_RE.sub("", text)        # 空表格行 | |
    # 多余空行收敛
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def looks_like_answer(raw_stem):
    """判断切出的段落是否其实是答案/解析碎片（应丢弃）。"""
    head = raw_stem.strip()[:80]
    # 起手就是"解："/"证明："/"（1）证明：" → 铁定是答案
    if _ANSWER_OPENER_RE.search(head):
        return True
    # 含评分标注(N分) 或 解法提示/解图 → 答案
    if re.search(r"解法提示|如解图|第\s*\d+\s*题解图", raw_stem):
        return True
    # 多个评分标注 (N分) 出现 ≥1 次且含推理符 ∴/∵ → 答案
    score_marks = len(re.findall(r"[（(]\s*\d+\s*分\s*[）)]", raw_stem))
    if score_marks >= 1 and re.search(r"∴|∵|解得|化简得", raw_stem):
        return True
    return False

# ---------- 试卷头/答题卡须知 等行政说明（非题目，应丢弃）----------
_INSTRUCTION_RE = re.compile(
    r"答题卡|准考证|条形码|2B\s*铅笔|涂改液|涂改胶|贴纸|签字笔|座位号|考室|考场号|"
    r"请将题目写成|保持卡面|卡面清洁|不要折叠|不要弄破|一律无效|作答无效|填涂方框|"
    r"考试时间\s*\d+\s*分钟|考试时量|监考|一并交回|试题卷和答题|草稿纸|答题提示|答题区域|矩形边框"
)
_PAPER_META_RE = re.compile(
    r"(满分\s*\d+\s*分).{0,12}(考试时间|考试时量|分钟)|"
    r"本试卷共.{0,6}小题|本学科试卷共|共\s*\d+\s*页|分选择题和非选择题"
)
# 题型段标题（一、选择题…）——是段标题不是题干
_SECTION_HEADER_RE = re.compile(r"(?:选择题|填空题|解答题|计算题|证明题)")
# 标准答案列表：字母答案序列 'A 16. C 17. D'（选择题答案区，极高置信）
_ANSWER_KEY_LETTERSEQ_RE = re.compile(r"(?:[ABCD]\s+\d{1,2}\s*[.．]\s*){2,}")
_ANSWER_KEY_NUMSEQ_RE = re.compile(r"(?:\d{1,2}\s*[.．、]\s*){3,}")
# 情境/题干信号：出现即认为含真题（可能尾部拼答案），不按纯答案/说明丢弃
_QUESTION_GUARD_RE = re.compile(
    r"如图|计算|化简|求出|求\s*[\$∠]|求.{0,4}(值|度数|面积|周长|概率)|"
    r"证明|已知|下列|阅读|工厂|学校|商店|设\s|甲种|乙种|两种产品|"
    r"随机抽|绘制|统计图|调查了|科学记数法|表示为"
)
# 频率分布表残行：起手 "区间 频数 频率" 或 "合计 N ..."
_TABLE_FRAG_HEAD_RE = re.compile(r"^\s*\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s+\d+\s+[\d.]+|^\s*合计\s+\d+")


def strip_md_headers(text):
    """剥离 MinerU/pandoc 残留的 markdown 标题行(## 一、选择题 / ## 18.(5分))与水印尾注。"""
    if not text:
        return text
    text = re.sub(r"^\s*#+\s.*$", "", text, flags=re.M)          # 整行 ## 标题
    text = re.sub(r"公众号\s*[\"“][^\"”]*[\"”]", "", text)        # 公众号水印
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def is_paper_noise(raw_stem):
    """判断切出的段落是否为 试卷说明/答题卡须知/段标题残渣/频率表残行/标准答案列表（应丢弃）。
    保守：含题干情境信号(_QUESTION_GUARD_RE)一律判为真题不丢。返回 True 表示应丢弃。"""
    s = raw_stem.strip()
    if not s:
        return True
    if _QUESTION_GUARD_RE.search(s):        # 含真题信号 → 保留
        return False
    if _TABLE_FRAG_HEAD_RE.match(s):        # 频率分布表残行起手
        return True
    if _INSTRUCTION_RE.search(s) or _PAPER_META_RE.search(s):   # 行政说明/卷头
        return True
    if _ANSWER_KEY_LETTERSEQ_RE.search(s):  # 字母答案列表
        return True
    if _ANSWER_KEY_NUMSEQ_RE.match(s[:30].lstrip()) or _ANSWER_KEY_NUMSEQ_RE.search(s[:20]):
        return True
    # 剔除 ## 段标题/图锚点后正文近乎为空，且原文含段标题/图 → 段标题残渣
    body = strip_md_headers(s)
    body = re.sub(r"\[\[IMG:\d+\]\]|第\s*\d+\s*题图|图\s*\d|[（(]\s*\d+\s*分\s*[）)]", "", body)
    if len(re.sub(r"\s", "", body)) < 6 and (_SECTION_HEADER_RE.search(s) or "[[IMG:" in s
                                             or re.search(r"^\s*#+\s*\d+", s, re.M)):
        return True
    return False

def extract_options(text):
    """抽 A/B/C/D 选项，支持文本选项与图选项。返回 {letter:{'zh':..} or {'img_md':..}}。
    文本形如: A．xxx B．yyy ... ; 图选项形如: A．![](img)
    """
    opts = {}
    # 用 A．/A. 作为分隔，切成4段
    # 找所有 选项字母 的位置
    marks = list(re.finditer(r"(?:^|\s|＞|>)\s*([ABCD])[．.、]", text))
    if len(marks) < 2:
        return None
    for i, mk in enumerate(marks):
        letter = mk.group(1)
        start = mk.end()
        end = marks[i+1].start() if i+1 < len(marks) else len(text)
        seg = text[start:end].strip()
        # 该选项内是否有图
        img_md = re.search(r"!\[[^\]]*\]\(([^)]+)\)", seg)
        if img_md:
            opts[letter] = {"img_src": img_md.group(1)}
        else:
            # 去掉可能的 markdown 引用符号
            seg = re.sub(r"^[>＞\s]+", "", seg).strip()
            if seg:
                opts[letter] = {"zh": seg}
    return opts if len(opts) >= 2 else None

def segment(md, source_label, year):
    """按大题号切题；识别题型段；抽答案；剥前缀；标记题干图与选项图。
    微专题学案模式：若检测到练习区块标记(练考点等)，则**只抽练习区块下的题**，跳过讲解/例题区。
    """
    lines = md.split("\n")
    cur_type = "single_choice"
    questions = []
    buf = None

    # 判断是否微专题学案（含练习区块 + 讲解区块标记）
    is_worksheet = bool(PRACTICE_SECTION_RE.search(md) and LECTURE_SECTION_RE.search(md))
    in_practice = not is_worksheet   # 非学案：全程可抽；学案：仅练习区可抽

    def flush():
        nonlocal buf
        if buf and buf["stem_lines"]:
            questions.append(buf)
        buf = None

    # 题号：支持 1. / 1． / 1、 / Pandoc转义 1\.  / 前导 > 
    num_re = re.compile(r"^\s*(?:>?\s*)?(\d{1,3})\\?[．.、]\s*")
    in_answer = False   # 进入"参考答案"区块后，全程跳过
    for ln in lines:
        # 答案区块（任何模式）：一旦进入，后面全是答案，停止抽题
        if ANSWER_SECTION_RE.search(ln) and len(ln) < 30:
            flush(); in_answer = True; continue
        if in_answer:
            continue
        # 区块切换（学案模式）
        if is_worksheet:
            if PRACTICE_SECTION_RE.search(ln) and len(ln) < 30:
                flush(); in_practice = True; continue
            if LECTURE_SECTION_RE.search(ln) and len(ln) < 30:
                flush(); in_practice = False; continue
        # 题型段
        for pat, t in QTYPE_HEADERS:
            if re.search(pat, ln) and len(ln) < 40:
                cur_type = t; break
        if not in_practice:
            continue   # 学案讲解区，跳过
        m = num_re.match(ln)
        if m:
            flush()
            buf = {"num": int(m.group(1)), "type": cur_type,
                   "stem_lines": [num_re.sub("", ln)]}
        elif buf is not None:
            buf["stem_lines"].append(ln)
    flush()

    results = []
    for q in questions:
        text = "\n".join(q["stem_lines"]).strip()
        if len(text) < 5:
            continue
        # 答案/解析（教师版）
        ans = ""
        m_ans = re.search(r"【答案】\s*([^\n【]+)", text)
        if m_ans: ans = m_ans.group(1).strip()
        sol = ""
        m_sol = re.search(r"【(详解|解析|分析)】\s*(.+)", text, re.S)
        if m_sol: sol = m_sol.group(2).strip()[:2000]
        # 题干（去答案解析段）
        raw_stem = re.split(r"【答案】|【详解】|【解析】|【分析】", text)[0].strip()
        raw_stem = clean_pandoc_noise(raw_stem)
        raw_stem = strip_md_headers(raw_stem)     # 剥离 MinerU 的 ## 标题行/水印
        sol = clean_pandoc_noise(sol)

        # 剔除混入的答案（练习区末尾的答案列表），两类特征：
        stripped = re.sub(r"\s", "", raw_stem)
        # (a) 极短且无题干特征
        short_answer = (len(stripped) < 12 and
                        not re.search(r"[（(]\s*[　\s]*[）)]|underline|如图|计算|求|下列|化简|解|证明|＝$", raw_stem) and
                        not re.search(r"[ABCD][．.、]", raw_stem))
        # (b) 纯答案列表：以 (1)...；(2)... 开头，且无题干动词/疑问/选项/填空
        answer_list = (re.match(r"^\s*[（(]\s*1\s*[）)]", raw_stem) and
                       not re.search(r"计算|求|下列|化简|解方程|证明|如图|underline|_{3,}|[ABCD][．.、]|(　　)", raw_stem) and
                       raw_stem.count("；") + raw_stem.count(";") >= 1)
        if short_answer or answer_list or looks_like_answer(raw_stem) or is_paper_noise(raw_stem):
            continue

        # 题型智能判断：有 A/B/C/D 选项→单选；有下划线填空标记→填空；否则解答
        has_options = bool(re.search(r"(?:^|\s|＞|>)\s*A[．.、]", raw_stem))
        has_blank = bool(re.search(r"underline|_{3,}|＿{2,}|［.*］|\[　+\]", raw_stem))
        if has_options:
            qtype = "single_choice"
        elif has_blank and not has_options:
            qtype = "fill_blank"
        else:
            # 沿用段标题判定；解答题特征(求/证明/计算并含多步)
            qtype = q["type"] if q["type"] != "single_choice" else (
                "solution" if re.search(r"求|证明|解方程|说明理由|画出", raw_stem) and len(stripped) > 40 else "fill_blank")

        # 选项区
        options = None
        stem_body = raw_stem
        if qtype == "single_choice":
            first_opt = re.search(r"(?:^|\s|＞|>)\s*A[．.、]", raw_stem)
            if first_opt:
                stem_body = raw_stem[:first_opt.start()].strip()
                options = extract_options(raw_stem[first_opt.start():])

        stem_clean, score, src_hint = strip_prefix(stem_body)
        if len(re.sub(r"\s", "", stem_clean)) < 4:
            continue
        results.append({
            "num": q["num"], "type": qtype, "stem": stem_clean,
            "options": options, "answer": ans, "solution": sol,
            "score": score, "src_hint": src_hint,
        })
    return results

# ---------- 4. 入库(占位) ----------
def make_qid(source_abbr, year, seq):
    ab = re.sub(r"[^A-Za-z0-9]", "", source_abbr)[:6].upper() or "DOC"
    return f"Q-{year}-{ab}-{seq:04d}"

def normalize_region(src_hint):
    """把 '2025•成都' / '2024东莞三模' / '24-25八年级·山西大同·阶段练习' 规范成纯地名。
    年份归 exam_year，region 只留地理名。取不出干净地名时返回 None。"""
    if not src_hint:
        return None
    s = src_hint.strip()
    # 去年份（2025 / 24-25 / 2025•）
    s = re.sub(r"20\d{2}|\d{2}-\d{2}", "", s)
    # 按 •·、|/ 空格 分段，找已知地区名
    parts = re.split(r"[•·、,，/\s]+", s)
    for p in parts:
        p = p.strip()
        if p in REGION_CODE:
            return p
    # 退一步：段里含已知地区名作为子串
    for p in parts:
        for region in sorted(REGION_CODE, key=len, reverse=True):
            if region and region in p:
                return region
    # 都匹配不上：留第一个非空、去掉考试类型词的段
    for p in parts:
        p = re.sub(r"练习|期末|期中|模拟|中考|月考|联考|预测|真题|阶段|一模|二模|三模|调研|卷|校级|年级", "", p).strip()
        if len(p) >= 2:
            return p
    return None

def save_webp(src, dst_noext, dry_run, max_w=800):
    """把源图转 WebP 压缩，返回 assets 相对路径；失败回退原格式拷贝。"""
    rel = f"assets/questions/{os.path.basename(dst_noext)}.webp"
    if dry_run:
        return rel
    try:
        from PIL import Image
        im = Image.open(src)
        if im.mode in ("P", "RGBA"):
            im = im.convert("RGBA")
        else:
            im = im.convert("RGB")
        if im.width > max_w:
            h = int(im.height * max_w / im.width)
            im = im.resize((max_w, h), Image.LANCZOS)
        im.save(dst_noext + ".webp", "WEBP", quality=82, method=6)
        return rel
    except Exception:
        ext = os.path.splitext(src)[1] or ".png"
        shutil.copy(src, dst_noext + ext)
        return f"assets/questions/{os.path.basename(dst_noext)}{ext}"

def resolve_img(img_ref, media_dir):
    """markdown 图路径 → 实际文件路径。"""
    if os.path.isabs(img_ref) and os.path.exists(img_ref):
        return img_ref
    for base in (media_dir, os.path.join(media_dir, ".."), os.path.dirname(media_dir)):
        p = os.path.normpath(os.path.join(base, img_ref))
        if os.path.exists(p):
            return p
    return None

def load(questions, source_label, source_abbr, year, media_dir, db_path, dry_run=False):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    existing = set(r[0] for r in cur.execute("SELECT question_id FROM questions"))
    os.makedirs(IMG_DIR, exist_ok=True)
    inserted, skipped, with_opt_img = 0, 0, 0
    for seq, q in enumerate(questions, 1):
        qid = make_qid(source_abbr, year, seq)
        if qid in existing:
            skipped += 1; continue

        image_paths = []   # 全图总索引

        # 1) 题干图：把 stem 里的 markdown ![](x) 替换成 [[IMG:n]] 锚点，图入索引
        stem = q["stem"]
        def repl_stem_img(m):
            src = resolve_img(m.group(1), media_dir)
            if not src: return ""
            n = len(image_paths)
            rel = save_webp(src, os.path.join(IMG_DIR, f"{qid}_stem{n}"), dry_run)
            image_paths.append(rel)
            return f"[[IMG:{n}]]"
        stem = re.sub(r"!\[[^\]]*\]\(([^)]+)\)", repl_stem_img, stem).strip()

        # 2) 选项图：options 里 img_src → 转webp，标 img 字段入索引
        options = None
        if q["options"]:
            options = {}
            has_opt_img = False
            for letter, val in q["options"].items():
                if "img_src" in val:
                    src = resolve_img(val["img_src"], media_dir)
                    if src:
                        n = len(image_paths)
                        rel = save_webp(src, os.path.join(IMG_DIR, f"{qid}_opt{letter}"), dry_run)
                        image_paths.append(rel)
                        options[letter] = {"zh": "", "en": "", "img": rel}
                        has_opt_img = True
                    else:
                        options[letter] = {"zh": ""}
                else:
                    options[letter] = {"zh": val.get("zh", ""), "en": val.get("zh", "")}
            if has_opt_img: with_opt_img += 1

        # 3) 解析图（solutions 里的 markdown 图 → [[IMG:n]]）
        sol = q.get("solution", "")
        if sol:
            def repl_sol_img(m):
                src = resolve_img(m.group(1), media_dir)
                if not src: return ""
                n = len(image_paths)
                rel = save_webp(src, os.path.join(IMG_DIR, f"{qid}_sol{n}"), dry_run)
                image_paths.append(rel)
                return f"[[IMG:{n}]]"
            sol = re.sub(r"!\[[^\]]*\]\(([^)]+)\)", repl_sol_img, sol)

        row = {
            "question_id": qid, "source": source_label,
            "exam_year": int(year) if year.isdigit() else None,
            "region": normalize_region(q.get("src_hint")), "exam_type": "中考真题",
            # 占位值：填合法值以满足 CHECK 约束，靠 content_status='pending' 标记待回填
            "grade_level": 9, "semester": 1,     # 占位(合法)，回填时按考点重定
            "primary_point_id": "KP-000",         # 占位哨兵
            "combination_id": None,
            "difficulty_level": 1,                # 占位(合法1-9)，回填时按算分重定
            "question_type": q["type"],
            "score_default": q.get("score") or 2,
            "stem_zh": stem, "stem_en": "__PENDING__",
            "options_json": json.dumps(options, ensure_ascii=False) if options else None,
            "answer_standard": q["answer"] or "__PENDING__",
            "rubric_checklist_json": None,
            "solutions_json": json.dumps([{"text": sol}], ensure_ascii=False) if sol else None,
            "image_paths_json": json.dumps(image_paths, ensure_ascii=False) if image_paths else None,
            "content_status": "pending",
        }
        if not dry_run:
            cols = ",".join(row.keys()); ph = ",".join("?" * len(row))
            cur.execute(f"INSERT INTO questions ({cols}) VALUES ({ph})", list(row.values()))
        inserted += 1
    if not dry_run: conn.commit()
    conn.close()
    return inserted, skipped, with_opt_img

# ---------- 主流程 ----------
def collect_docx(target):
    if os.path.isdir(target):
        return [os.path.join(r, f) for r, _, fs in os.walk(target)
                for f in fs if f.lower().endswith(".docx") and not f.startswith("~$")]
    return [target] if target.lower().endswith(".docx") else []

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target", help="docx 文件或文件夹")
    ap.add_argument("--db", default=DEFAULT_DB)
    ap.add_argument("--dry-run", action="store_true", help="只解析不入库,看切题效果")
    args = ap.parse_args()

    files = collect_docx(args.target)
    if not files:
        print("未找到 .docx"); sys.exit(1)
    print(f"发现 {len(files)} 个 docx\n{'='*60}")
    tot_in, tot_skip, rejected = 0, 0, 0
    for f in files:
        name = os.path.basename(f)
        ok, reason = inspect_ok(f)
        if not ok:
            print(f"❌ REJECT {name}\n   {reason}"); rejected += 1; continue
        print(f"✅ 体检通过 {name}\n   {reason}")
        try:
            workdir = os.path.join("/tmp/docimport", hashlib.md5(f.encode()).hexdigest()[:8])
            md, media = extract(f, workdir)
            abbr, year, source_label = guess_source_abbr(f)
            qs = segment(md, source_label, year)
            print(f"   切出 {len(qs)} 道题" + (" [dry-run]" if args.dry_run else ""))
            # source 存完整文件名标签，qid 用 abbr 简码
            ins, sk, optimg = load(qs, source_label, abbr, year, media, args.db, args.dry_run)
            print(f"   [{abbr}] 入库 {ins}，跳过(重复) {sk}，含选项图题 {optimg}")
            tot_in += ins; tot_skip += sk
        except Exception as e:
            print(f"   ⚠️ 处理失败: {e}")
    print(f"{'='*60}\n汇总: 入库 {tot_in}，跳过 {tot_skip}，拒收 {rejected}")
    if not args.dry_run:
        total = sqlite3.connect(args.db).execute("SELECT COUNT(*) FROM questions").fetchone()[0]
        pending = sqlite3.connect(args.db).execute("SELECT COUNT(*) FROM questions WHERE content_status='pending'").fetchone()[0]
        print(f"questions.db 现共 {total} 题，其中待回填(pending) {pending} 题")

if __name__ == "__main__":
    main()
