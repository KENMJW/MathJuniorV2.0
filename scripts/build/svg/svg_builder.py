"""
SVG 构建辅助工具类
提供统一的卡片视口、多语言标题头、四段论图层包装、XML实体安全转义和排版溢出保护。
"""

import html

def escape_xml(text: str) -> str:
    """对文本进行 XML 实体安全转义"""
    if not text:
        return ""
    return (
        text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;")
    )

def split_text_safely(raw_text: str, max_len: int = 30) -> list:
    """按空格或标点安全折行，严禁在实体中间切断"""
    if len(raw_text) <= max_len:
        return [raw_text]
    
    # 尝试在空格处切断
    if " " in raw_text:
        words = raw_text.split(" ")
        line1 = []
        cur_len = 0
        split_idx = 0
        for idx, w in enumerate(words):
            if cur_len + len(w) + 1 <= max_len:
                line1.append(w)
                cur_len += len(w) + 1
            else:
                split_idx = idx
                break
        if line1 and split_idx > 0:
            return [" ".join(line1), " ".join(words[split_idx:])]

    # 若无空格或纯中文，直接按中点切断
    mid = len(raw_text) // 2
    return [raw_text[:mid], raw_text[mid:]]

def build_svg_document(
    point_id: str,
    subcategory: str,
    title: str,
    content_svg: str,
    footer_text: str,
    is_en: bool = False
) -> str:
    """
    生成标准 400x300 卡片规范的 SVG 字符串
    """
    esc_point_id = escape_xml(point_id)
    esc_sub = escape_xml(subcategory)
    
    # 标题长度安全保护
    clean_title = title
    if len(clean_title) > 22 and not is_en:
        clean_title = clean_title[:21] + "…"
    elif len(clean_title) > 34 and is_en:
        clean_title = clean_title[:33] + "…"
    esc_title = escape_xml(clean_title)

    # 底部公式安全折行：在未转义字符串上切分，切分后再各自转义！
    footer_lines = split_text_safely(footer_text, max_len=30)
    if len(footer_lines) > 1:
        line1 = escape_xml(footer_lines[0])
        line2 = escape_xml(footer_lines[1])
        footer_element = f"""
  <text class="layer-stage-4" x="200" y="262" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#1d1d1f">
    <tspan x="200" dy="0">{line1}</tspan>
    <tspan x="200" dy="14">{line2}</tspan>
  </text>
        """.strip()
    else:
        line = escape_xml(footer_lines[0])
        footer_element = f"""
  <text class="layer-stage-4" x="200" y="270" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#1d1d1f">{line}</text>
        """.strip()

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
  <!-- Background Card -->
  <rect width="400" height="300" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />

  <!-- Card Header -->
  <rect x="20" y="16" width="360" height="42" rx="10" fill="#f2f2f7" />
  <text x="35" y="42" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="#0071e3">{esc_point_id} · {esc_sub}</text>
  <text x="365" y="42" text-anchor="end" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#1d1d1f">{esc_title}</text>

  <!-- Core Content Graphic -->
{content_svg}

  <!-- Footer Conclusion / Extrema / Vieta -->
  {footer_element}
</svg>
"""
    return svg
