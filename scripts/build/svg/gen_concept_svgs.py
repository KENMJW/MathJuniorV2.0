#!/usr/bin/env python3
"""
生成 107 个中考数学核心考点的双语矢量示意图 (assets/concepts/KP-0xx-zh.svg & KP-0xx-en.svg, 共 214 个)。
严格遵守设计规范与门禁规则：
1. 合法 viewBox="0 0 400 300" 与 preserveAspectRatio="xMidYMid meet"
2. 绝对禁止 <foreignObject> (Property 20)
3. 绝对禁止 <script> 及内联事件监听器
4. 矢量图形严格对应考点数学概念与模型结构
"""

import os
import sqlite3
import xml.etree.ElementTree as ET

OUTPUT_DIR = "assets/concepts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_db_kps():
    conn = sqlite3.connect("data/core.db")
    c = conn.cursor()
    rows = c.execute(
        "SELECT point_id, name_zh, name_en, domain, subcategory, primary_line_id FROM knowledge_points ORDER BY point_id;"
    ).fetchall()
    conn.close()
    return rows

def escape_xml(s):
    return (s.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;")
             .replace("'", "&apos;"))

def generate_svg_body(kp_id, name, subcategory, lang):
    """根据考点类别生成专属数学矢量构图"""
    is_zh = (lang == 'zh')
    
    # 基础配色定义 (iOS 27 设计系统规范)
    c_blue = "#0071e3"
    c_green = "#34c759"
    c_amber = "#ff9500"
    c_purple = "#af52de"
    c_red = "#ff3b30"
    c_dark = "#1d1d1f"
    c_muted = "#86868b"
    c_light_bg = "#ffffff"
    c_grid = "#e5e5ea"

    num = int(kp_id.split('-')[1])

    # 顶部标题栏
    title_text = escape_xml(name)
    badge_text = escape_xml(f"{kp_id} · {subcategory}")
    
    header = f'''
  <!-- Card Header -->
  <rect x="20" y="16" width="360" height="42" rx="10" fill="#f2f2f7" />
  <text x="35" y="42" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="{c_blue}">{badge_text}</text>
  <text x="365" y="42" text-anchor="end" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="{c_dark}">{title_text}</text>
'''

    # 画布区域 (x: 20~380, y: 70~280) 中心 (200, 175)
    content = ""

    # 1. 实数与数轴 (KP-001 ~ KP-008)
    if subcategory == "实数" or num <= 8:
        x_start, x_end, y_axis = 45, 355, 175
        content = f'''
  <!-- Number Axis -->
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="{c_dark}"/>
    </marker>
  </defs>
  <line x1="{x_start}" y1="{y_axis}" x2="{x_end}" y2="{y_axis}" stroke="{c_dark}" stroke-width="2.5" marker-end="url(#arrow)" />
  <!-- Ticks -->
  <line x1="80" y1="167" x2="80" y2="183" stroke="{c_dark}" stroke-width="2"/>
  <line x1="140" y1="167" x2="140" y2="183" stroke="{c_dark}" stroke-width="2"/>
  <line x1="200" y1="163" x2="200" y2="187" stroke="{c_dark}" stroke-width="3"/>
  <line x1="260" y1="167" x2="260" y2="183" stroke="{c_dark}" stroke-width="2"/>
  <line x1="320" y1="167" x2="320" y2="183" stroke="{c_dark}" stroke-width="2"/>
  <!-- Numbers -->
  <text x="80" y="205" text-anchor="middle" font-family="monospace" font-size="14" fill="{c_muted}">-2</text>
  <text x="140" y="205" text-anchor="middle" font-family="monospace" font-size="14" fill="{c_muted}">-1</text>
  <text x="200" y="207" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="{c_dark}">0</text>
  <text x="260" y="205" text-anchor="middle" font-family="monospace" font-size="14" fill="{c_muted}">1</text>
  <text x="320" y="205" text-anchor="middle" font-family="monospace" font-size="14" fill="{c_muted}">2</text>
  <!-- Highlight Interval / Point -->
  <circle cx="200" cy="{y_axis}" r="5" fill="{c_dark}"/>
  <circle cx="260" cy="{y_axis}" r="6" fill="{c_blue}"/>
  <circle cx="140" cy="{y_axis}" r="6" fill="{c_amber}"/>
  <!-- Distance Arch -->
  <path d="M 140 160 Q 170 120 200 160" fill="none" stroke="{c_amber}" stroke-width="2" stroke-dasharray="4,3"/>
  <path d="M 200 160 Q 230 120 260 160" fill="none" stroke="{c_blue}" stroke-width="2" stroke-dasharray="4,3"/>
  <text x="170" y="125" text-anchor="middle" font-size="12" font-weight="600" fill="{c_amber}">|x| = 1</text>
  <text x="230" y="125" text-anchor="middle" font-size="12" font-weight="600" fill="{c_blue}">+1</text>
'''

    # 2. 代数式与因式分解 (KP-009 ~ KP-015)
    elif subcategory == "代数式" or (9 <= num <= 15):
        content = f'''
  <!-- Geometric Algebra Dissection: (a+b)^2 = a^2 + 2ab + b^2 -->
  <g transform="translate(110, 85)">
    <!-- a^2 -->
    <rect x="0" y="0" width="110" height="110" fill="{c_blue}" fill-opacity="0.2" stroke="{c_blue}" stroke-width="2" />
    <text x="55" y="60" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="{c_blue}">a²</text>
    <!-- ab top-right -->
    <rect x="110" y="0" width="60" height="110" fill="{c_green}" fill-opacity="0.2" stroke="{c_green}" stroke-width="2" />
    <text x="140" y="60" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="{c_green}">ab</text>
    <!-- ab bottom-left -->
    <rect x="0" y="110" width="110" height="60" fill="{c_green}" fill-opacity="0.2" stroke="{c_green}" stroke-width="2" />
    <text x="55" y="145" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="{c_green}">ab</text>
    <!-- b^2 bottom-right -->
    <rect x="110" y="110" width="60" height="60" fill="{c_amber}" fill-opacity="0.2" stroke="{c_amber}" stroke-width="2" />
    <text x="140" y="145" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="{c_amber}">b²</text>
  </g>
  <text x="200" y="275" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="{c_dark}">(a + b)² = a² + 2ab + b²</text>
'''

    # 3. 分式 (KP-016 ~ KP-018)
    elif subcategory == "分式" or (16 <= num <= 18):
        content = f'''
  <!-- Rational Expressions Structure -->
  <g transform="translate(80, 100)">
    <rect x="0" y="0" width="240" height="120" rx="14" fill="#f8fafc" stroke="{c_grid}" stroke-width="2"/>
    <text x="120" y="45" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="{c_blue}">A(x)</text>
    <line x1="50" y1="60" x2="190" y2="60" stroke="{c_dark}" stroke-width="3"/>
    <text x="120" y="95" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="{c_amber}">B(x)</text>
  </g>
  <text x="200" y="255" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="{c_red}">B(x) ≠ 0 {"(分母非零根基)" if is_zh else "(Non-zero Denominator)"}</text>
'''

    # 4. 方程组与不等式 (KP-019 ~ KP-029)
    elif subcategory in ("方程组", "不等式") or (19 <= num <= 29):
        content = f'''
  <!-- Coordinate Lines Intersection / Parabola Vieta -->
  <g transform="translate(60, 80)">
    <!-- Axes -->
    <line x1="20" y1="150" x2="260" y2="150" stroke="{c_muted}" stroke-width="1.5" />
    <line x1="140" y1="20" x2="140" y2="170" stroke="{c_muted}" stroke-width="1.5" />
    <text x="260" y="165" font-size="12" fill="{c_muted}">x</text>
    <text x="130" y="25" font-size="12" fill="{c_muted}">y</text>
    <!-- Line 1: y = x + 1 -->
    <line x1="40" y1="160" x2="220" y2="40" stroke="{c_blue}" stroke-width="2.5"/>
    <!-- Line 2: y = -x + 3 -->
    <line x1="40" y1="40" x2="220" y2="160" stroke="{c_amber}" stroke-width="2.5"/>
    <!-- Intersection point (140, 100) -->
    <circle cx="130" cy="100" r="5" fill="{c_red}"/>
    <text x="145" y="95" font-family="monospace" font-size="12" font-weight="bold" fill="{c_red}">P(x₀, y₀)</text>
  </g>
  <text x="200" y="268" text-anchor="middle" font-size="13" font-weight="600" fill="{c_dark}">{"消元与图象交点解" if is_zh else "Elimination and Graph Intersection"}</text>
'''

    # 5. 函数 (KP-030 ~ KP-043)
    elif subcategory == "函数" or (30 <= num <= 43):
        # 二次函数/一次函数抛物线图
        content = f'''
  <!-- Function Coordinate System and Parabola -->
  <g transform="translate(50, 75)">
    <!-- Axis -->
    <line x1="20" y1="140" x2="280" y2="140" stroke="{c_dark}" stroke-width="1.5"/>
    <line x1="150" y1="15" x2="150" y2="175" stroke="{c_dark}" stroke-width="1.5"/>
    <!-- Grid dotted -->
    <line x1="90" y1="15" x2="90" y2="175" stroke="{c_grid}" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="210" y1="15" x2="210" y2="175" stroke="{c_grid}" stroke-width="1" stroke-dasharray="3,3"/>
    <!-- Parabola: y = -a(x-h)^2 + k -->
    <path d="M 60 170 Q 150 10 240 170" fill="none" stroke="{c_blue}" stroke-width="3"/>
    <!-- Vertex -->
    <circle cx="150" cy="50" r="5" fill="{c_red}"/>
    <text x="150" y="38" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="{c_red}">Vertex(h, k)</text>
    <!-- Axis of symmetry -->
    <line x1="150" y1="15" x2="150" y2="175" stroke="{c_purple}" stroke-width="1.5" stroke-dasharray="4,4"/>
    <!-- Intercepts -->
    <circle cx="85" cy="140" r="4" fill="{c_amber}"/>
    <circle cx="215" cy="140" r="4" fill="{c_amber}"/>
    <text x="85" y="158" text-anchor="middle" font-size="11" fill="{c_muted}">x₁</text>
    <text x="215" y="158" text-anchor="middle" font-size="11" fill="{c_muted}">x₂</text>
  </g>
  <text x="200" y="272" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="{c_dark}">y = ax² + bx + c (a ≠ 0)</text>
'''

    # 6. 几何基础 (KP-044 ~ KP-048)
    elif subcategory == "几何基础" or (44 <= num <= 48):
        content = f'''
  <!-- Parallel Lines with Transversal -->
  <g transform="translate(60, 80)">
    <!-- Line l1 -->
    <line x1="20" y1="50" x2="260" y2="50" stroke="{c_blue}" stroke-width="2.5"/>
    <text x="268" y="54" font-size="12" font-weight="bold" fill="{c_blue}">l₁</text>
    <!-- Line l2 -->
    <line x1="20" y1="120" x2="260" y2="120" stroke="{c_blue}" stroke-width="2.5"/>
    <text x="268" y="124" font-size="12" font-weight="bold" fill="{c_blue}">l₂</text>
    <!-- Transversal line t -->
    <line x1="60" y1="15" x2="210" y2="155" stroke="{c_amber}" stroke-width="2"/>
    <!-- Angles -->
    <circle cx="97" cy="50" r="14" fill="none" stroke="{c_purple}" stroke-width="2"/>
    <text x="115" y="42" font-size="12" font-weight="bold" fill="{c_purple}">∠1</text>
    <circle cx="172" cy="120" r="14" fill="none" stroke="{c_purple}" stroke-width="2"/>
    <text x="190" y="112" font-size="12" font-weight="bold" fill="{c_purple}">∠2</text>
  </g>
  <text x="200" y="265" text-anchor="middle" font-size="13" font-weight="600" fill="{c_dark}">{"l₁ // l₂ ⇒ 同位角/内错角相等" if is_zh else "l₁ // l₂ ⇒ Corresponding / Alternate Angles Equal"}</text>
'''

    # 7. 三角形 (KP-049 ~ KP-060)
    elif subcategory == "三角形" or (49 <= num <= 60):
        content = f'''
  <!-- Right Triangle / Congruence Model -->
  <g transform="translate(90, 85)">
    <!-- Triangle ABC: C is right angle at (40, 140) -->
    <polygon points="40,140 200,140 40,30" fill="{c_blue}" fill-opacity="0.12" stroke="{c_blue}" stroke-width="2.5"/>
    <!-- Right angle mark -->
    <rect x="40" y="122" width="18" height="18" fill="none" stroke="{c_dark}" stroke-width="1.5"/>
    <!-- Vertex Labels -->
    <text x="30" y="25" font-weight="bold" font-size="14" fill="{c_dark}">A</text>
    <text x="20" y="155" font-weight="bold" font-size="14" fill="{c_dark}">C</text>
    <text x="210" y="150" font-weight="bold" font-size="14" fill="{c_dark}">B</text>
    <!-- Side Labels -->
    <text x="22" y="90" font-family="monospace" font-size="14" font-weight="bold" fill="{c_amber}">b</text>
    <text x="115" y="160" font-family="monospace" font-size="14" font-weight="bold" fill="{c_green}">a</text>
    <text x="125" y="75" font-family="monospace" font-size="14" font-weight="bold" fill="{c_blue}">c</text>
  </g>
  <text x="200" y="268" text-anchor="middle" font-family="monospace" font-size="14" font-weight="700" fill="{c_dark}">a² + b² = c² (∠C = 90°)</text>
'''

    # 8. 四边形 (KP-061 ~ KP-068)
    elif subcategory == "四边形" or (61 <= num <= 68):
        content = f'''
  <!-- Parallelogram with Diagonals -->
  <g transform="translate(70, 85)">
    <!-- Parallelogram vertices -->
    <polygon points="60,30 230,30 180,140 10,140" fill="{c_purple}" fill-opacity="0.1" stroke="{c_purple}" stroke-width="2.5"/>
    <!-- Diagonals -->
    <line x1="60" y1="30" x2="180" y2="140" stroke="{c_amber}" stroke-width="1.5" stroke-dasharray="4,3"/>
    <line x1="230" y1="30" x2="10" y2="140" stroke="{c_blue}" stroke-width="1.5" stroke-dasharray="4,3"/>
    <circle cx="120" cy="85" r="4" fill="{c_red}"/>
    <text x="120" y="75" text-anchor="middle" font-size="12" font-weight="bold" fill="{c_red}">O</text>
    <!-- Vertices -->
    <text x="50" y="24" font-weight="bold" font-size="13" fill="{c_dark}">A</text>
    <text x="238" y="28" font-weight="bold" font-size="13" fill="{c_dark}">B</text>
    <text x="188" y="152" font-weight="bold" font-size="13" fill="{c_dark}">C</text>
    <text x="0" y="152" font-weight="bold" font-size="13" fill="{c_dark}">D</text>
  </g>
  <text x="200" y="265" text-anchor="middle" font-size="13" font-weight="600" fill="{c_dark}">{"对角线互相平分 (OA=OC, OB=OD)" if is_zh else "Diagonals Bisect Each Other"}</text>
'''

    # 9. 圆 (KP-069 ~ KP-078)
    elif subcategory == "圆" or (69 <= num <= 78):
        content = f'''
  <!-- Circle with Chord, Radius and Tangent -->
  <g transform="translate(200, 160)">
    <!-- Main Circle -->
    <circle cx="0" cy="0" r="70" fill="{c_blue}" fill-opacity="0.08" stroke="{c_blue}" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="4" fill="{c_dark}"/>
    <text x="-12" y="-5" font-weight="bold" font-size="13" fill="{c_dark}">O</text>
    <!-- Chord AB -->
    <line x1="-55" y1="43" x2="55" y2="43" stroke="{c_amber}" stroke-width="2"/>
    <!-- Perpendicular radius to chord -->
    <line x1="0" y1="0" x2="0" y2="70" stroke="{c_green}" stroke-width="2"/>
    <rect x="0" y="33" width="10" height="10" fill="none" stroke="{c_dark}" stroke-width="1.2"/>
    <!-- Tangent line at bottom (0, 70) -->
    <line x1="-80" y1="70" x2="80" y2="70" stroke="{c_red}" stroke-width="2.5"/>
    <!-- Points -->
    <circle cx="-55" cy="43" r="3.5" fill="{c_amber}"/>
    <circle cx="55" cy="43" r="3.5" fill="{c_amber}"/>
    <circle cx="0" cy="70" r="4" fill="{c_red}"/>
    <text x="-65" y="45" font-size="12" font-weight="bold" fill="{c_dark}">A</text>
    <text x="62" y="45" font-size="12" font-weight="bold" fill="{c_dark}">B</text>
    <text x="5" y="85" font-size="12" font-weight="bold" fill="{c_red}">T</text>
  </g>
  <text x="200" y="270" text-anchor="middle" font-size="13" font-weight="600" fill="{c_dark}">{"垂径定理与切线垂直性质" if is_zh else "Perpendicular Chord &amp; Tangent Line"}</text>
'''

    # 10. 图形变换 (KP-079 ~ KP-084)
    elif subcategory == "图形变换" or (79 <= num <= 84):
        content = f'''
  <!-- Rotation / Reflection Transformation -->
  <g transform="translate(70, 80)">
    <!-- Pre-image triangle -->
    <polygon points="30,120 90,120 60,60" fill="{c_blue}" fill-opacity="0.2" stroke="{c_blue}" stroke-width="2"/>
    <text x="55" y="105" font-size="12" font-weight="bold" fill="{c_blue}">△ABC</text>
    <!-- Center of rotation O -->
    <circle cx="130" cy="90" r="4" fill="{c_dark}"/>
    <text x="127" y="110" font-size="12" font-weight="bold" fill="{c_dark}">O</text>
    <!-- Post-image rotated -->
    <polygon points="170,60 230,60 200,120" fill="{c_green}" fill-opacity="0.2" stroke="{c_green}" stroke-width="2"/>
    <text x="185" y="85" font-size="12" font-weight="bold" fill="{c_green}">△A&apos;B&apos;C&apos;</text>
    <!-- Rotation arcs -->
    <path d="M 60 60 Q 130 30 200 120" fill="none" stroke="{c_amber}" stroke-width="1.5" stroke-dasharray="3,3"/>
  </g>
  <text x="200" y="265" text-anchor="middle" font-size="13" font-weight="600" fill="{c_dark}">{"刚体变换：保距保角与全等" if is_zh else "Rigid Motion: Isometric &amp; Angle-preserving"}</text>
'''

    # 11. 锐角三角函数 (KP-085 ~ KP-091)
    elif subcategory == "锐角三角函数" or (85 <= num <= 91):
        content = f'''
  <!-- Trigonometric Ratio Right Triangle -->
  <g transform="translate(100, 90)">
    <polygon points="30,120 180,120 180,30" fill="{c_amber}" fill-opacity="0.12" stroke="{c_amber}" stroke-width="2.5"/>
    <rect x="162" y="102" width="18" height="18" fill="none" stroke="{c_dark}" stroke-width="1.5"/>
    <!-- Angle alpha arc -->
    <path d="M 60 120 A 30 30 0 0 0 54 105" fill="none" stroke="{c_blue}" stroke-width="2.5"/>
    <text x="65" y="112" font-size="13" font-weight="bold" fill="{c_blue}">α</text>
    <text x="105" y="140" text-anchor="middle" font-size="12" fill="{c_muted}">{"邻边 (Adjacent)" if not is_zh else "邻边"}</text>
    <text x="195" y="78" text-anchor="start" font-size="12" fill="{c_muted}">{"对边 (Opposite)" if not is_zh else "对边"}</text>
    <text x="95" y="65" text-anchor="end" font-size="12" fill="{c_muted}">{"斜边 (Hypotenuse)" if not is_zh else "斜边"}</text>
  </g>
  <text x="200" y="268" text-anchor="middle" font-family="monospace" font-size="14" font-weight="700" fill="{c_dark}">sin α = 对/斜,  cos α = 邻/斜,  tan α = 对/邻</text>
'''

    # 12. 统计与数据分析 (KP-092 ~ KP-102)
    elif "数据" in subcategory or (92 <= num <= 102):
        content = f'''
  <!-- Statistical Histogram / Distribution -->
  <g transform="translate(70, 90)">
    <!-- Axis -->
    <line x1="20" y1="130" x2="250" y2="130" stroke="{c_dark}" stroke-width="2"/>
    <line x1="20" y1="20" x2="20" y2="130" stroke="{c_dark}" stroke-width="2"/>
    <!-- Bars -->
    <rect x="35" y="80" width="35" height="50" fill="{c_blue}" fill-opacity="0.3" stroke="{c_blue}" stroke-width="1.5"/>
    <rect x="75" y="45" width="35" height="85" fill="{c_blue}" fill-opacity="0.5" stroke="{c_blue}" stroke-width="1.5"/>
    <rect x="115" y="25" width="35" height="105" fill="{c_blue}" fill-opacity="0.8" stroke="{c_blue}" stroke-width="1.5"/>
    <rect x="155" y="55" width="35" height="75" fill="{c_blue}" fill-opacity="0.5" stroke="{c_blue}" stroke-width="1.5"/>
    <rect x="195" y="90" width="35" height="40" fill="{c_blue}" fill-opacity="0.3" stroke="{c_blue}" stroke-width="1.5"/>
    <!-- Mean line -->
    <line x1="132" y1="15" x2="132" y2="130" stroke="{c_red}" stroke-width="2" stroke-dasharray="4,3"/>
    <text x="135" y="18" font-size="12" font-weight="bold" fill="{c_red}">x̄</text>
  </g>
  <text x="200" y="265" text-anchor="middle" font-size="13" font-weight="600" fill="{c_dark}">{"集中趋势(均值/中位数)与离散程度(方差)" if is_zh else "Central Tendency &amp; Dispersion (Variance)"}</text>
'''

    # 13. 概率 (KP-103 ~ KP-107)
    else:
        content = f'''
  <!-- Probability Tree / Spinner Diagram -->
  <g transform="translate(200, 160)">
    <!-- Probability Spinner Wheel -->
    <circle cx="-60" cy="0" r="55" fill="#f8fafc" stroke="{c_dark}" stroke-width="2"/>
    <path d="M -60 0 L -60 -55 A 55 55 0 0 1 -5 0 Z" fill="{c_blue}" fill-opacity="0.4"/>
    <path d="M -60 0 L -5 0 A 55 55 0 0 1 -60 55 Z" fill="{c_green}" fill-opacity="0.4"/>
    <path d="M -60 0 L -60 55 A 55 55 0 0 1 -115 0 Z" fill="{c_amber}" fill-opacity="0.4"/>
    <path d="M -60 0 L -115 0 A 55 55 0 0 1 -60 -55 Z" fill="{c_purple}" fill-opacity="0.4"/>
    <!-- Center pointer -->
    <circle cx="-60" cy="0" r="5" fill="{c_dark}"/>
    <line x1="-60" y1="0" x2="-35" y2="-25" stroke="{c_red}" stroke-width="2.5"/>
    <!-- Probability Formulas -->
    <text x="40" y="-15" font-family="monospace" font-size="14" font-weight="bold" fill="{c_blue}">P(A) = m / n</text>
    <text x="40" y="15" font-size="12" fill="{c_muted}">{"0 ≤ P(A) ≤ 1" if is_zh else "0 ≤ P(A) ≤ 1"}</text>
  </g>
  <text x="200" y="268" text-anchor="middle" font-size="13" font-weight="600" fill="{c_dark}">{"等可能古典概型与频率大数逼近" if is_zh else "Classical Probability &amp; Frequency Convergence"}</text>
'''

    # 组装完整 SVG 结构
    svg_code = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
  <!-- Background Card -->
  <rect width="400" height="300" rx="16" fill="{c_light_bg}" stroke="#e2e8f0" stroke-width="1.5" />
{header}
{content}
</svg>'''
    return svg_code

def main():
    kps = get_db_kps()
    print(f"Loaded {len(kps)} knowledge points from core.db")
    count = 0
    for kp in kps:
        point_id, name_zh, name_en, domain, subcategory, primary_line_id = kp
        
        # zh
        zh_code = generate_svg_body(point_id, name_zh, subcategory, 'zh')
        zh_path = os.path.join(OUTPUT_DIR, f"{point_id}-zh.svg")
        with open(zh_path, "w", encoding="utf-8") as f:
            f.write(zh_code)
        
        # en
        en_code = generate_svg_body(point_id, name_en, subcategory, 'en')
        en_path = os.path.join(OUTPUT_DIR, f"{point_id}-en.svg")
        with open(en_path, "w", encoding="utf-8") as f:
            f.write(en_code)
        
        count += 2
    
    print(f"Successfully generated {count} SVG files in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
