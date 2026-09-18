#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
docx 源体检：判定一个 doc/docx 是否"原生 OMML 公式"（可被本工具无损抽取），
还是"WMF碎片公式 / 纯文本 / 无公式"等不适合的情况。

用法：
  python3 inspect.py <文件或文件夹>
输出：每个文件的判定结论（PASS / REJECT / WARN）与依据。

判据（实测依据见 README）：
  - OMML 原生公式块 <m:oMath> 数量多、WMF 极少   → PASS（原生公式，Pandoc 可无损抽）
  - WMF 图片多、OMML=0                           → REJECT（公式碎成矢量碎片，不可用）
  - 无 media 且 OMML=0 且有文字                   → WARN（可能是纯文本/无公式题，需人工看）
"""
import sys, os, re, zipfile

def inspect_pdf(path):
    """PDF 体检：判定 文字型(公式结构是否完整) / 扫描型(整页图)。"""
    result = {"file": os.path.basename(path), "kind": "pdf", "pages": 0,
              "text_len": 0, "img_pages": 0, "verdict": "", "reason": ""}
    try:
        import pymupdf
    except ImportError:
        try:
            import fitz as pymupdf
        except ImportError:
            result["verdict"] = "ERROR"
            result["reason"] = "未装 PyMuPDF。请先: pip install pymupdf"
            return result
    try:
        d = pymupdf.open(path)
    except Exception as e:
        result["verdict"] = "ERROR"; result["reason"] = f"无法打开PDF: {e}"
        return result
    result["pages"] = d.page_count
    total_text = 0
    full_pages_as_image = 0
    all_text = ""
    for pg in d:
        t = pg.get_text().strip()
        total_text += len(t)
        all_text += t
        imgs = pg.get_images()
        # 整页近似一张大图 + 该页几乎无文字 → 扫描页
        if len(t) < 20 and len(imgs) >= 1:
            full_pages_as_image += 1
    result["text_len"] = total_text
    result["img_pages"] = full_pages_as_image

    # 数学结构符号(根号/上标等)是否存在——公式压平的PDF这些会缺失
    math_syms = sum(all_text.count(s) for s in "√²³±≥≤÷×π∵∴∫∑")
    root_cnt = all_text.count("√")

    if result["pages"] > 0 and full_pages_as_image >= result["pages"] * 0.6:
        result["verdict"] = "REJECT"
        result["reason"] = f"{result['pages']}页中{full_pages_as_image}页无文字层(整页图)=扫描型PDF。需多模态识别，本工具不可用。"
    elif total_text < 100:
        result["verdict"] = "REJECT"
        result["reason"] = f"文字层几乎为空({total_text}字)，疑似扫描型。本工具不可用。"
    elif root_cnt == 0 and math_syms < result["pages"]:
        # 有文字但数学结构符号极少 → 公式很可能被压平成乱码
        result["verdict"] = "REJECT"
        result["reason"] = (f"文字型PDF但数学结构符号极少(根号√={root_cnt}, 其它数学符号={math_syms})。"
                            f"公式二维排版被压平成乱码，无法还原原题。本工具不可用（需多模态或换docx源）。")
    else:
        result["verdict"] = "WARN"
        result["reason"] = (f"文字型PDF，含部分数学符号(根号√={root_cnt})。"
                            f"PDF 公式结构通常不可靠，建议抽样人工核对；能换原生OMML docx 更佳。")
    return result

def inspect_docx(path):
    result = {"file": os.path.basename(path), "omml": 0, "wmf": 0, "png": 0,
              "jpeg": 0, "emf": 0, "text_len": 0, "verdict": "", "reason": ""}
    try:
        z = zipfile.ZipFile(path)
    except Exception as e:
        result["verdict"] = "ERROR"; result["reason"] = f"无法打开(可能是老.doc二进制格式,需先转docx): {e}"
        return result

    names = z.namelist()
    # 图片类型统计
    for n in names:
        low = n.lower()
        if low.startswith("word/media/"):
            ext = low.rsplit(".", 1)[-1] if "." in low else ""
            if ext == "wmf": result["wmf"] += 1
            elif ext == "emf": result["emf"] += 1
            elif ext == "png": result["png"] += 1
            elif ext in ("jpg", "jpeg"): result["jpeg"] += 1

    # document.xml
    try:
        xml = z.read("word/document.xml").decode("utf-8", "ignore")
    except KeyError:
        result["verdict"] = "ERROR"; result["reason"] = "无 word/document.xml"
        return result

    result["omml"] = len(re.findall(r"<m:oMath[ >]", xml))
    texts = re.findall(r"<w:t[^>]*>(.*?)</w:t>", xml)
    result["text_len"] = sum(len(t) for t in texts)

    # 判定
    omml, wmf, emf, tlen = result["omml"], result["wmf"], result["emf"], result["text_len"]
    vector = wmf + emf
    if omml >= 20 and vector <= omml * 0.2:
        result["verdict"] = "PASS"
        result["reason"] = f"原生OMML公式 {omml} 个，矢量碎片 {vector} 个（占比低）。Pandoc 可无损抽取 LaTeX。"
    elif vector >= 50 and omml == 0:
        result["verdict"] = "REJECT"
        result["reason"] = f"公式被碎成 {vector} 个矢量图(WMF/EMF)、OMML=0。公式非结构化，本工具不可用（需多模态识别）。"
    elif omml == 0 and vector == 0 and tlen > 200:
        result["verdict"] = "WARN"
        result["reason"] = f"无公式块也无矢量图，纯文字 {tlen} 字。可能无数学公式或公式以纯文本写，需人工确认。"
    elif omml > 0:
        result["verdict"] = "WARN"
        result["reason"] = f"OMML {omml} 个但矢量碎片 {vector} 个偏多，混合格式，需抽样验证抽取质量。"
    else:
        result["verdict"] = "REJECT"
        result["reason"] = f"OMML={omml}, 矢量={vector}, 文字={tlen}。不符合原生公式源特征。"
    return result

def collect(target):
    files = []
    if os.path.isdir(target):
        for root, _, fs in os.walk(target):
            for f in fs:
                if f.lower().endswith((".docx", ".pdf")) and not f.startswith("~$"):
                    files.append(os.path.join(root, f))
    elif os.path.isfile(target):
        files.append(target)
    return files

def inspect_one(path):
    low = path.lower()
    if low.endswith(".pdf"):
        return inspect_pdf(path)
    elif low.endswith(".docx"):
        return inspect_docx(path)
    else:
        return {"file": os.path.basename(path), "verdict": "ERROR",
                "reason": "仅支持 .docx / .pdf（老 .doc 需先转 docx）",
                "omml": 0, "wmf": 0, "emf": 0, "png": 0, "jpeg": 0, "text_len": 0}

def main():
    if len(sys.argv) < 2:
        print("用法: python3 inspect.py <文件或文件夹>"); sys.exit(1)
    files = collect(sys.argv[1])
    if not files:
        print("未找到 .docx / .pdf 文件（老 .doc 需先转 docx）"); sys.exit(1)
    stat = {"PASS": 0, "REJECT": 0, "WARN": 0, "ERROR": 0}
    print(f"体检 {len(files)} 个文件：\n")
    for f in files:
        r = inspect_one(f)
        stat[r["verdict"]] = stat.get(r["verdict"], 0) + 1
        icon = {"PASS": "✅", "REJECT": "❌", "WARN": "⚠️", "ERROR": "🚫"}.get(r["verdict"], "?")
        print(f"{icon} [{r['verdict']}] {r['file']}")
        if r.get("kind") == "pdf":
            print(f"    [PDF] 页数={r.get('pages')} 无文字层页={r.get('img_pages')} 文字={r.get('text_len')}")
        else:
            print(f"    [DOCX] OMML={r.get('omml')} WMF={r.get('wmf')} EMF={r.get('emf')} PNG={r.get('png')} JPEG={r.get('jpeg')} 文字={r.get('text_len')}")
        print(f"    {r['reason']}\n")
    print("=" * 50)
    print(f"汇总: PASS={stat['PASS']} REJECT={stat['REJECT']} WARN={stat['WARN']} ERROR={stat['ERROR']}")
    print("✅ PASS = 可直接导入(原生OMML docx)。❌ REJECT = 公式非结构化，不可用。⚠️ WARN = 需人工核对。")

if __name__ == "__main__":
    main()
