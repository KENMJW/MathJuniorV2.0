"""
分片 1: KP-001 ~ KP-015 (实数与整式运算)
15 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part1():
    results = {}

    # KP-001: 有理数分类集合
    zh_001 = """  <g transform="translate(40, 75)">
    <rect class="layer-stage-1" x="20" y="20" width="280" height="135" rx="16" fill="#f0f7ff" stroke="#0071e3" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text class="layer-stage-1" x="35" y="42" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#0071e3">有理数 Q</text>
    <rect class="layer-stage-2" x="35" y="55" width="120" height="90" rx="10" fill="#e8f5e9" stroke="#34c759" stroke-width="1.5"/>
    <text class="layer-stage-2" x="50" y="78" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#1b5e20">整数 Z</text>
    <text class="layer-stage-3 formal-labels" x="50" y="100" font-size="11" fill="#2e7d32">正整数 / 0 / 负整数</text>
    <text class="layer-stage-3 formal-labels" x="50" y="122" font-family="monospace" font-size="11" fill="#2e7d32">+3, 0, -5</text>
    <rect class="layer-stage-2" x="165" y="55" width="125" height="90" rx="10" fill="#fff3e0" stroke="#ff9500" stroke-width="1.5"/>
    <text class="layer-stage-2" x="180" y="78" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#e65100">分数 (有限/无限循环)</text>
    <text class="layer-stage-3 formal-labels" x="180" y="100" font-size="11" fill="#bf360c">正分数 / 负分数</text>
    <text class="layer-stage-4" x="180" y="122" font-family="monospace" font-size="11" fill="#bf360c">1/2, -0.75, 0.333…</text>
  </g>"""
    en_001 = """  <g transform="translate(40, 75)">
    <rect class="layer-stage-1" x="20" y="20" width="280" height="135" rx="16" fill="#f0f7ff" stroke="#0071e3" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text class="layer-stage-1" x="35" y="42" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#0071e3">Rational Numbers Q</text>
    <rect class="layer-stage-2" x="35" y="55" width="120" height="90" rx="10" fill="#e8f5e9" stroke="#34c759" stroke-width="1.5"/>
    <text class="layer-stage-2" x="50" y="78" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#1b5e20">Integers Z</text>
    <text class="layer-stage-3 formal-labels" x="50" y="100" font-size="10" fill="#2e7d32">Positive / 0 / Negative</text>
    <text class="layer-stage-3 formal-labels" x="50" y="122" font-family="monospace" font-size="11" fill="#2e7d32">+3, 0, -5</text>
    <rect class="layer-stage-2" x="165" y="55" width="125" height="90" rx="10" fill="#fff3e0" stroke="#ff9500" stroke-width="1.5"/>
    <text class="layer-stage-2" x="180" y="78" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#e65100">Fractions (Repeating)</text>
    <text class="layer-stage-3 formal-labels" x="180" y="100" font-size="10" fill="#bf360c">Positive / Negative</text>
    <text class="layer-stage-4" x="180" y="122" font-family="monospace" font-size="11" fill="#bf360c">1/2, -0.75, 0.333…</text>
  </g>"""
    results['KP-001-zh.svg'] = build_svg_document('KP-001', '实数', '有理数的概念与分类', zh_001, '任何有理数皆可表示为两整数之比 p/q (q≠0)')
    results['KP-001-en.svg'] = build_svg_document('KP-001', 'Real Numbers', 'Rational Numbers & Classification', en_001, 'Every rational number is expressible as p/q (q≠0)', is_en=True)

    # KP-002: 数轴三要素
    zh_002 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="70" x2="320" y2="70" stroke="#1d1d1f" stroke-width="2"/>
    <polygon class="layer-stage-1" points="325,70 315,65 315,75" fill="#1d1d1f"/>
    <text class="layer-stage-1" x="325" y="60" font-size="12" font-weight="bold" fill="#1d1d1f">+</text>
    <line class="layer-stage-2" x1="60" y1="65" x2="60" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="110" y1="65" x2="110" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="160" y1="60" x2="160" y2="80" stroke="#ff3b30" stroke-width="2.5"/>
    <line class="layer-stage-2" x1="210" y1="65" x2="210" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="260" y1="65" x2="260" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="60" y="92" text-anchor="middle" font-size="11" fill="#86868b">-2</text>
    <text class="layer-stage-3 formal-labels" x="110" y="92" text-anchor="middle" font-size="11" fill="#86868b">-1</text>
    <text class="layer-stage-3 formal-labels" x="160" y="95" text-anchor="middle" font-size="13" font-weight="bold" fill="#ff3b30">0 (原点)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="92" text-anchor="middle" font-size="11" fill="#86868b">+1</text>
    <text class="layer-stage-3 formal-labels" x="260" y="92" text-anchor="middle" font-size="11" fill="#86868b">+2</text>
    <path class="layer-stage-4" d="M160,50 L210,50" stroke="#0071e3" stroke-width="2" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="185" y="44" text-anchor="middle" font-size="11" font-weight="600" fill="#0071e3">单位长度 1</text>
  </g>"""
    en_002 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="70" x2="320" y2="70" stroke="#1d1d1f" stroke-width="2"/>
    <polygon class="layer-stage-1" points="325,70 315,65 315,75" fill="#1d1d1f"/>
    <text class="layer-stage-1" x="325" y="60" font-size="12" font-weight="bold" fill="#1d1d1f">+</text>
    <line class="layer-stage-2" x1="60" y1="65" x2="60" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="110" y1="65" x2="110" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="160" y1="60" x2="160" y2="80" stroke="#ff3b30" stroke-width="2.5"/>
    <line class="layer-stage-2" x1="210" y1="65" x2="210" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="260" y1="65" x2="260" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="60" y="92" text-anchor="middle" font-size="11" fill="#86868b">-2</text>
    <text class="layer-stage-3 formal-labels" x="110" y="92" text-anchor="middle" font-size="11" fill="#86868b">-1</text>
    <text class="layer-stage-3 formal-labels" x="160" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#ff3b30">0 (Origin)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="92" text-anchor="middle" font-size="11" fill="#86868b">+1</text>
    <text class="layer-stage-3 formal-labels" x="260" y="92" text-anchor="middle" font-size="11" fill="#86868b">+2</text>
    <path class="layer-stage-4" d="M160,50 L210,50" stroke="#0071e3" stroke-width="2" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="185" y="44" text-anchor="middle" font-size="11" font-weight="600" fill="#0071e3">Unit Length 1</text>
  </g>"""
    results['KP-002-zh.svg'] = build_svg_document('KP-002', '实数', '数轴三要素', zh_002, '数轴三要素：原点、正方向、单位长度')
    results['KP-002-en.svg'] = build_svg_document('KP-002', 'Real Numbers', 'The Number Line', en_002, 'Three Elements: Origin, Positive Direction, Unit Length', is_en=True)

    # KP-003: 相反数与绝对值
    zh_003 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="75" x2="320" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="170" cy="75" r="4" fill="#1d1d1f"/>
    <text class="layer-stage-1" x="170" y="95" text-anchor="middle" font-size="11" fill="#86868b">原点 O</text>
    <circle class="layer-stage-2" cx="90" cy="75" r="6" fill="#0071e3"/>
    <circle class="layer-stage-2" cx="250" cy="75" r="6" fill="#0071e3"/>
    <text class="layer-stage-3 formal-labels" x="90" y="98" text-anchor="middle" font-weight="bold" fill="#0071e3">-a</text>
    <text class="layer-stage-3 formal-labels" x="250" y="98" text-anchor="middle" font-weight="bold" fill="#0071e3">+a</text>
    <path class="layer-stage-4" d="M90,65 Q130,35 170,65" fill="none" stroke="#ff9500" stroke-width="2"/>
    <path class="layer-stage-4" d="M170,65 Q210,35 250,65" fill="none" stroke="#ff9500" stroke-width="2"/>
    <text class="layer-stage-4" x="130" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="#ff9500">|-a| = a</text>
    <text class="layer-stage-4" x="210" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="#ff9500">|+a| = a</text>
  </g>"""
    en_003 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="75" x2="320" y2="75" stroke="#1d1d1f" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="170" cy="75" r="4" fill="#1d1d1f"/>
    <text class="layer-stage-1" x="170" y="95" text-anchor="middle" font-size="11" fill="#86868b">Origin O</text>
    <circle class="layer-stage-2" cx="90" cy="75" r="6" fill="#0071e3"/>
    <circle class="layer-stage-2" cx="250" cy="75" r="6" fill="#0071e3"/>
    <text class="layer-stage-3 formal-labels" x="90" y="98" text-anchor="middle" font-weight="bold" fill="#0071e3">-a</text>
    <text class="layer-stage-3 formal-labels" x="250" y="98" text-anchor="middle" font-weight="bold" fill="#0071e3">+a</text>
    <path class="layer-stage-4" d="M90,65 Q130,35 170,65" fill="none" stroke="#ff9500" stroke-width="2"/>
    <path class="layer-stage-4" d="M170,65 Q210,35 250,65" fill="none" stroke="#ff9500" stroke-width="2"/>
    <text class="layer-stage-4" x="130" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="#ff9500">|-a| = a</text>
    <text class="layer-stage-4" x="210" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="#ff9500">|+a| = a</text>
  </g>"""
    results['KP-003-zh.svg'] = build_svg_document('KP-003', '实数', '相反数与绝对值', zh_003, '互为相反数两点到原点距离相等: |a| = |-a|')
    results['KP-003-en.svg'] = build_svg_document('KP-003', 'Real Numbers', 'Opposites & Absolute Value', en_003, 'Opposite numbers are equidistant from origin: |a| = |-a|', is_en=True)

    # KP-004: 有理数的四则运算 (向量位移合成)
    zh_004 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="80" x2="320" y2="80" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="80" cy="80" r="4" fill="#64748b"/>
    <text class="layer-stage-1" x="80" y="100" text-anchor="middle" font-size="11" fill="#64748b">0</text>
    <!-- Vector +5 -->
    <path class="layer-stage-2" d="M80,60 L240,60" stroke="#2563eb" stroke-width="2.5"/>
    <polygon class="layer-stage-2" points="245,60 235,55 235,65" fill="#2563eb"/>
    <text class="layer-stage-2" x="160" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">+5 (正向位移)</text>
    <!-- Vector -3 -->
    <path class="layer-stage-3 formal-labels" d="M245,35 L150,35" stroke="#dc2626" stroke-width="2.5"/>
    <polygon class="layer-stage-3 formal-labels" points="145,35 155,30 155,40" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="195" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">-3 (反向位移)</text>
    <!-- Result Point +2 -->
    <circle class="layer-stage-4" cx="145" cy="80" r="5" fill="#16a34a"/>
    <text class="layer-stage-4" x="145" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">+2 (合成终点)</text>
  </g>"""
    en_004 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="80" x2="320" y2="80" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="80" cy="80" r="4" fill="#64748b"/>
    <text class="layer-stage-1" x="80" y="100" text-anchor="middle" font-size="11" fill="#64748b">0</text>
    <path class="layer-stage-2" d="M80,60 L240,60" stroke="#2563eb" stroke-width="2.5"/>
    <polygon class="layer-stage-2" points="245,60 235,55 235,65" fill="#2563eb"/>
    <text class="layer-stage-2" x="160" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">+5 (Forward)</text>
    <path class="layer-stage-3 formal-labels" d="M245,35 L150,35" stroke="#dc2626" stroke-width="2.5"/>
    <polygon class="layer-stage-3 formal-labels" points="145,35 155,30 155,40" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="195" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">-3 (Backward)</text>
    <circle class="layer-stage-4" cx="145" cy="80" r="5" fill="#16a34a"/>
    <text class="layer-stage-4" x="145" y="102" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a">+2 (Result)</text>
  </g>"""
    results['KP-004-zh.svg'] = build_svg_document('KP-004', '实数', '有理数的四则运算', zh_004, '数轴向量位移合成法则：(+5) + (-3) = +2')
    results['KP-004-en.svg'] = build_svg_document('KP-004', 'Real Numbers', 'Rational Number Operations', en_004, 'Vector displacement synthesis on number line: (+5) + (-3) = +2', is_en=True)

    # KP-005: 无理数与实数的概念 (单位正方形对角线根号2画弧)
    zh_005 = """  <g transform="translate(40, 75)">
    <line class="layer-stage-1" x1="20" y1="120" x2="300" y2="120" stroke="#1e293b" stroke-width="2"/>
    <circle class="layer-stage-1" cx="60" cy="120" r="4" fill="#1e293b"/>
    <text class="layer-stage-1" x="60" y="140" text-anchor="middle" font-size="11">0</text>
    <!-- Unit square on [0, 1] -->
    <rect class="layer-stage-2" x="60" y="60" width="60" height="60" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-2" x="120" y="140" text-anchor="middle" font-size="11">1</text>
    <!-- Diagonal sqrt(2) -->
    <line class="layer-stage-3 formal-labels" x1="60" y1="120" x2="120" y2="60" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="85" y="80" font-size="11" font-weight="bold" fill="#dc2626">√2</text>
    <!-- Arc from (120,60) to number line x = 60 + 60*1.414 = 145 -->
    <path class="layer-stage-4" d="M120,60 A85,85 0 0,1 145,120" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <circle class="layer-stage-4" cx="145" cy="120" r="5" fill="#ea580c"/>
    <text class="layer-stage-4" x="145" y="142" text-anchor="middle" font-size="12" font-weight="bold" fill="#ea580c">√2 ≈ 1.414</text>
  </g>"""
    en_005 = """  <g transform="translate(40, 75)">
    <line class="layer-stage-1" x1="20" y1="120" x2="300" y2="120" stroke="#1e293b" stroke-width="2"/>
    <circle class="layer-stage-1" cx="60" cy="120" r="4" fill="#1e293b"/>
    <text class="layer-stage-1" x="60" y="140" text-anchor="middle" font-size="11">0</text>
    <rect class="layer-stage-2" x="60" y="60" width="60" height="60" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-2" x="120" y="140" text-anchor="middle" font-size="11">1</text>
    <line class="layer-stage-3 formal-labels" x1="60" y1="120" x2="120" y2="60" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="85" y="80" font-size="11" font-weight="bold" fill="#dc2626">√2</text>
    <path class="layer-stage-4" d="M120,60 A85,85 0 0,1 145,120" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <circle class="layer-stage-4" cx="145" cy="120" r="5" fill="#ea580c"/>
    <text class="layer-stage-4" x="145" y="142" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">√2 ≈ 1.414</text>
  </g>"""
    results['KP-005-zh.svg'] = build_svg_document('KP-005', '实数', '无理数与实数的概念', zh_005, '无理数是实数轴上的连续点：单位正方形对角线投影为 √2')
    results['KP-005-en.svg'] = build_svg_document('KP-005', 'Real Numbers', 'Irrational & Real Numbers', en_005, 'Irrationals complete number line: unit square diagonal gives √2', is_en=True)

    # KP-006: 平方根与算术平方根 (面积与边长)
    zh_006 = """  <g transform="translate(60, 75)">
    <!-- Square with area a -->
    <rect class="layer-stage-1" x="30" y="20" width="110" height="110" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-2" x="85" y="80" text-anchor="middle" font-size="16" font-weight="bold" fill="#15803d">面积 = a (a≥0)</text>
    <line class="layer-stage-3 formal-labels" x1="30" y1="140" x2="140" y2="140" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="85" y="158" text-anchor="middle" font-size="13" font-weight="bold" fill="#2563eb">边长 x = √a</text>
    <text class="layer-stage-4" x="190" y="70" font-size="12" font-weight="bold" fill="#dc2626">若 x² = a</text>
    <text class="layer-stage-4" x="190" y="95" font-size="12" font-weight="bold" fill="#dc2626">则 x = ±√a</text>
  </g>"""
    en_006 = """  <g transform="translate(60, 75)">
    <rect class="layer-stage-1" x="30" y="20" width="110" height="110" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-2" x="85" y="80" text-anchor="middle" font-size="14" font-weight="bold" fill="#15803d">Area = a (a≥0)</text>
    <line class="layer-stage-3 formal-labels" x1="30" y1="140" x2="140" y2="140" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="85" y="158" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">Side x = √a</text>
    <text class="layer-stage-4" x="190" y="70" font-size="11" font-weight="bold" fill="#dc2626">If x² = a</text>
    <text class="layer-stage-4" x="190" y="95" font-size="11" font-weight="bold" fill="#dc2626">Then x = ±√a</text>
  </g>"""
    results['KP-006-zh.svg'] = build_svg_document('KP-006', '实数', '平方根与算术平方根', zh_006, '正数有两个互为相反数的平方根，其中正根 √a 为算术平方根')
    results['KP-006-en.svg'] = build_svg_document('KP-006', 'Real Numbers', 'Square Roots & Principal Roots', en_006, 'Positive numbers have two square roots ±√a, √a is principal root', is_en=True)

    # KP-007: 立方根 (等轴测立方体体积)
    zh_007 = """  <g transform="translate(80, 70)">
    <!-- Isometric Cube: front face -->
    <rect class="layer-stage-1" x="30" y="50" width="70" height="70" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <!-- Top face -->
    <polygon class="layer-stage-2" points="30,50 65,20 135,20 100,50" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>
    <!-- Right face -->
    <polygon class="layer-stage-2" points="100,50 135,20 135,90 100,120" fill="#fcd34d" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="65" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">体积 V</text>
    <text class="layer-stage-4" x="155" y="65" font-size="12" font-weight="bold" fill="#1d4ed8">棱长 x = ∛V</text>
    <text class="layer-stage-4" x="155" y="90" font-size="11" fill="#475569">x³ = a (唯一实根)</text>
  </g>"""
    en_007 = """  <g transform="translate(80, 70)">
    <rect class="layer-stage-1" x="30" y="50" width="70" height="70" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="30,50 65,20 135,20 100,50" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="100,50 135,20 135,90 100,120" fill="#fcd34d" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="65" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">Volume V</text>
    <text class="layer-stage-4" x="155" y="65" font-size="11" font-weight="bold" fill="#1d4ed8">Edge x = ∛V</text>
    <text class="layer-stage-4" x="155" y="90" font-size="10" fill="#475569">x³ = a (Unique Real)</text>
  </g>"""
    results['KP-007-zh.svg'] = build_svg_document('KP-007', '实数', '立方根', zh_007, '任何实数都有且只有一个立方根，正数的立方根为正，负数的为负')
    results['KP-007-en.svg'] = build_svg_document('KP-007', 'Real Numbers', 'Cube Roots', en_007, 'Every real number has a unique cube root ∛a', is_en=True)

    # KP-008: 实数的大小比较与估算 (夹逼区间)
    zh_008 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="70" x2="320" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="90" y="55" width="140" height="30" fill="#fef9c3" stroke="#eab308" stroke-width="1.5" rx="6"/>
    <!-- Integers 2 and 3 -->
    <circle class="layer-stage-2" cx="90" cy="70" r="4" fill="#1e293b"/>
    <circle class="layer-stage-2" cx="230" cy="70" r="4" fill="#1e293b"/>
    <text class="layer-stage-2" x="90" y="100" text-anchor="middle" font-size="13" font-weight="bold">2 (√4)</text>
    <text class="layer-stage-2" x="230" y="100" text-anchor="middle" font-size="13" font-weight="bold">3 (√9)</text>
    <!-- Squeezed sqrt(5) -->
    <circle class="layer-stage-3 formal-labels" cx="125" cy="70" r="6" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="125" y="45" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">√5 ≈ 2.236</text>
    <text class="layer-stage-4" x="160" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">夹逼法: 4 &lt; 5 &lt; 9 ⇒ 2 &lt; √5 &lt; 3</text>
  </g>"""
    en_008 = """  <g transform="translate(30, 85)">
    <line class="layer-stage-1" x1="20" y1="70" x2="320" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="90" y="55" width="140" height="30" fill="#fef9c3" stroke="#eab308" stroke-width="1.5" rx="6"/>
    <circle class="layer-stage-2" cx="90" cy="70" r="4" fill="#1e293b"/>
    <circle class="layer-stage-2" cx="230" cy="70" r="4" fill="#1e293b"/>
    <text class="layer-stage-2" x="90" y="100" text-anchor="middle" font-size="12" font-weight="bold">2 (√4)</text>
    <text class="layer-stage-2" x="230" y="100" text-anchor="middle" font-size="12" font-weight="bold">3 (√9)</text>
    <circle class="layer-stage-3 formal-labels" cx="125" cy="70" r="6" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="125" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">√5 ≈ 2.236</text>
    <text class="layer-stage-4" x="160" y="25" text-anchor="middle" font-size="10" font-weight="bold" fill="#b45309">Squeezing: 4 &lt; 5 &lt; 9 ⇒ 2 &lt; √5 &lt; 3</text>
  </g>"""
    results['KP-008-zh.svg'] = build_svg_document('KP-008', '实数', '实数的大小比较与估算', zh_008, '利用完全平方数夹逼估算无理数取值区间')
    results['KP-008-en.svg'] = build_svg_document('KP-008', 'Real Numbers', 'Comparison & Estimation', en_008, 'Bounding irrationals between consecutive perfect squares', is_en=True)

    # KP-009: 代数式的概念与求值 (输入输出黑箱)
    zh_009 = """  <g transform="translate(45, 75)">
    <rect class="layer-stage-1" x="90" y="30" width="120" height="80" rx="12" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-1" x="150" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e40af">2x² - 3x + 1</text>
    <text class="layer-stage-1" x="150" y="85" text-anchor="middle" font-size="11" fill="#64748b">代数式求值母机</text>
    <!-- Input arrow -->
    <path class="layer-stage-2" d="M20,70 L85,70" stroke="#16a34a" stroke-width="2.5"/>
    <text class="layer-stage-2" x="50" y="60" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">代入 x = 2</text>
    <!-- Output arrow -->
    <path class="layer-stage-3 formal-labels" d="M215,70 L280,70" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="250" y="60" text-anchor="middle" font-size="12" font-weight="bold" fill="#ea580c">输出值</text>
    <text class="layer-stage-4" x="250" y="95" text-anchor="middle" font-size="14" font-weight="bold" fill="#ea580c">= 3</text>
  </g>"""
    en_009 = """  <g transform="translate(45, 75)">
    <rect class="layer-stage-1" x="90" y="30" width="120" height="80" rx="12" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-1" x="150" y="65" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">2x² - 3x + 1</text>
    <text class="layer-stage-1" x="150" y="85" text-anchor="middle" font-size="10" fill="#64748b">Algebraic Machine</text>
    <path class="layer-stage-2" d="M20,70 L85,70" stroke="#16a34a" stroke-width="2.5"/>
    <text class="layer-stage-2" x="50" y="60" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a">Input x = 2</text>
    <path class="layer-stage-3 formal-labels" d="M215,70 L280,70" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="250" y="60" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">Output</text>
    <text class="layer-stage-4" x="250" y="95" text-anchor="middle" font-size="13" font-weight="bold" fill="#ea580c">= 3</text>
  </g>"""
    results['KP-009-zh.svg'] = build_svg_document('KP-009', '代数式', '代数式的概念与求值', zh_009, '用具体数值替代字母代数式中的变量计算求值')
    results['KP-009-en.svg'] = build_svg_document('KP-009', 'Algebra', 'Algebraic Expressions & Evaluation', en_009, 'Evaluating algebraic expressions by substituting numerical values', is_en=True)

    # KP-010: 整式的加减 (同类项合并条形拼接)
    zh_010 = """  <g transform="translate(45, 75)">
    <!-- 3a bar -->
    <rect class="layer-stage-1" x="30" y="30" width="120" height="35" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-1" x="90" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">3a (同类项)</text>
    <!-- 2a bar -->
    <rect class="layer-stage-2" x="155" y="30" width="80" height="35" rx="6" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>
    <text class="layer-stage-2" x="195" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="#c2410c">2a</text>
    <!-- Combined bar 5a -->
    <path class="layer-stage-3 formal-labels" d="M140,75 L140,95" stroke="#475569" stroke-width="2"/>
    <rect class="layer-stage-4" x="30" y="105" width="205" height="40" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="132" y="130" text-anchor="middle" font-size="14" font-weight="bold" fill="#15803d">合并结果 = (3 + 2)a = 5a</text>
  </g>"""
    en_010 = """  <g transform="translate(45, 75)">
    <rect class="layer-stage-1" x="30" y="30" width="120" height="35" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-1" x="90" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">3a (Like Terms)</text>
    <rect class="layer-stage-2" x="155" y="30" width="80" height="35" rx="6" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>
    <text class="layer-stage-2" x="195" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#c2410c">2a</text>
    <path class="layer-stage-3 formal-labels" d="M140,75 L140,95" stroke="#475569" stroke-width="2"/>
    <rect class="layer-stage-4" x="30" y="105" width="205" height="40" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="132" y="130" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">Combined = (3 + 2)a = 5a</text>
  </g>"""
    results['KP-010-zh.svg'] = build_svg_document('KP-010', '代数式', '整式的加减', zh_010, '合并同类项法则：字母与指数不变，系数相加减')
    results['KP-010-en.svg'] = build_svg_document('KP-010', 'Algebra', 'Polynomial Addition & Subtraction', en_010, 'Combining like terms: add coefficients while keeping variables constant', is_en=True)

    # KP-011: 整式的乘法 (单项式乘多项式面积切分 a(b+c))
    zh_011 = """  <g transform="translate(55, 75)">
    <!-- Width a, length b + c -->
    <rect class="layer-stage-1" x="20" y="20" width="180" height="100" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <!-- Box 1: a * b -->
    <rect class="layer-stage-2" x="20" y="20" width="100" height="100" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-2" x="70" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#1d4ed8">ab</text>
    <!-- Box 2: a * c -->
    <rect class="layer-stage-3 formal-labels" x="120" y="20" width="80" height="100" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="160" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#b45309">ac</text>
    <!-- Dimensions -->
    <text class="layer-stage-4" x="10" y="75" text-anchor="middle" font-size="12" font-weight="bold" fill="#64748b">a</text>
    <text class="layer-stage-4" x="70" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">b</text>
    <text class="layer-stage-4" x="160" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#d97706">c</text>
  </g>"""
    en_011 = """  <g transform="translate(55, 75)">
    <rect class="layer-stage-1" x="20" y="20" width="180" height="100" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="20" width="100" height="100" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-2" x="70" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#1d4ed8">ab</text>
    <rect class="layer-stage-3 formal-labels" x="120" y="20" width="80" height="100" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="160" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#b45309">ac</text>
    <text class="layer-stage-4" x="10" y="75" text-anchor="middle" font-size="12" font-weight="bold" fill="#64748b">a</text>
    <text class="layer-stage-4" x="70" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#3b82f6">b</text>
    <text class="layer-stage-4" x="160" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#d97706">c</text>
  </g>"""
    results['KP-011-zh.svg'] = build_svg_document('KP-011', '代数式', '整式的乘法', zh_011, '分配律面积几何图解：a(b + c) = ab + ac')
    results['KP-011-en.svg'] = build_svg_document('KP-011', 'Algebra', 'Polynomial Multiplication', en_011, 'Distributive law geometric area proof: a(b + c) = ab + ac', is_en=True)

    # KP-012: 乘法公式完全平方拼图
    zh_012 = """  <g transform="translate(60, 68)">
    <rect class="layer-stage-1" x="20" y="20" width="160" height="160" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="20" width="110" height="110" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="75" y="80" text-anchor="middle" font-size="16" font-weight="bold" fill="#1d4ed8">a²</text>
    <rect class="layer-stage-3 formal-labels" x="130" y="20" width="50" height="110" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="155" y="80" text-anchor="middle" font-size="13" font-weight="600" fill="#b45309">ab</text>
    <rect class="layer-stage-3 formal-labels" x="20" y="130" width="110" height="50" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="75" y="160" text-anchor="middle" font-size="13" font-weight="600" fill="#b45309">ab</text>
    <rect class="layer-stage-4" x="130" y="130" width="50" height="50" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="155" y="160" text-anchor="middle" font-size="13" font-weight="bold" fill="#b91c1c">b²</text>
  </g>"""
    en_012 = """  <g transform="translate(60, 68)">
    <rect class="layer-stage-1" x="20" y="20" width="160" height="160" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="20" width="110" height="110" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="75" y="80" text-anchor="middle" font-size="16" font-weight="bold" fill="#1d4ed8">a²</text>
    <rect class="layer-stage-3 formal-labels" x="130" y="20" width="50" height="110" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="155" y="80" text-anchor="middle" font-size="13" font-weight="600" fill="#b45309">ab</text>
    <rect class="layer-stage-3 formal-labels" x="20" y="130" width="110" height="50" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="75" y="160" text-anchor="middle" font-size="13" font-weight="600" fill="#b45309">ab</text>
    <rect class="layer-stage-4" x="130" y="130" width="50" height="50" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="155" y="160" text-anchor="middle" font-size="13" font-weight="bold" fill="#b91c1c">b²</text>
  </g>"""
    results['KP-012-zh.svg'] = build_svg_document('KP-012', '代数式', '乘法公式', zh_012, '完全平方公式几何面积割补: (a+b)² = a² + 2ab + b²')
    results['KP-012-en.svg'] = build_svg_document('KP-012', 'Algebra', 'Multiplication Formulas', en_012, 'Geometric Area Proof: (a+b)² = a² + 2ab + b²', is_en=True)

    # KP-013: 整式的除法 (面积除以宽逆求长)
    zh_013 = """  <g transform="translate(50, 75)">
    <rect class="layer-stage-1" x="30" y="25" width="200" height="85" fill="#f1f5f9" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-2" x="130" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="#334155">已知总面积 = 6x²y + 4xy²</text>
    <line class="layer-stage-3 formal-labels" x1="15" y1="25" x2="15" y2="110" stroke="#0284c7" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="8" y="72" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">除以宽 2xy</text>
    <path class="layer-stage-4" d="M30,125 L230,125" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="130" y="145" text-anchor="middle" font-size="13" font-weight="bold" fill="#16a34a">求得长 = 3x + 2y</text>
  </g>"""
    en_013 = """  <g transform="translate(50, 75)">
    <rect class="layer-stage-1" x="30" y="25" width="200" height="85" fill="#f1f5f9" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-2" x="130" y="72" text-anchor="middle" font-size="13" font-weight="bold" fill="#334155">Total Area = 6x²y + 4xy²</text>
    <line class="layer-stage-3 formal-labels" x1="15" y1="25" x2="15" y2="110" stroke="#0284c7" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="8" y="72" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">Width 2xy</text>
    <path class="layer-stage-4" d="M30,125 L230,125" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="130" y="145" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">Length = 3x + 2y</text>
  </g>"""
    results['KP-013-zh.svg'] = build_svg_document('KP-013', '代数式', '整式的除法', zh_013, '多项式除以单项式：各项分别除以单项式再相加')
    results['KP-013-en.svg'] = build_svg_document('KP-013', 'Algebra', 'Polynomial Division', en_013, 'Dividing polynomial by monomial: divide each term and combine', is_en=True)

    # KP-014: 因式分解 (积木面积拼装为矩形乘积 (x+1)(x+2))
    zh_014 = """  <g transform="translate(60, 68)">
    <!-- Rectangle (x+2) * (x+1) -->
    <rect class="layer-stage-1" x="20" y="20" width="160" height="120" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- x^2 -->
    <rect class="layer-stage-2" x="20" y="20" width="100" height="90" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="70" y="70" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e40af">x²</text>
    <!-- 2x -->
    <rect class="layer-stage-3 formal-labels" x="120" y="20" width="60" height="90" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="150" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">2x</text>
    <!-- 1x -->
    <rect class="layer-stage-3 formal-labels" x="20" y="110" width="100" height="30" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="70" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">1x</text>
    <!-- 2 -->
    <rect class="layer-stage-4" x="120" y="110" width="60" height="30" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="150" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">2</text>
    <text class="layer-stage-4" x="100" y="12" text-anchor="middle" font-size="12" font-weight="bold" fill="#0071e3">(x + 2)</text>
    <text class="layer-stage-4" x="8" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#0071e3">(x + 1)</text>
  </g>"""
    en_014 = """  <g transform="translate(60, 68)">
    <rect class="layer-stage-1" x="20" y="20" width="160" height="120" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="20" width="100" height="90" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="70" y="70" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e40af">x²</text>
    <rect class="layer-stage-3 formal-labels" x="120" y="20" width="60" height="90" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="150" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">2x</text>
    <rect class="layer-stage-3 formal-labels" x="20" y="110" width="100" height="30" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="70" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">1x</text>
    <rect class="layer-stage-4" x="120" y="110" width="60" height="30" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="150" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">2</text>
    <text class="layer-stage-4" x="100" y="12" text-anchor="middle" font-size="12" font-weight="bold" fill="#0071e3">(x + 2)</text>
    <text class="layer-stage-4" x="8" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#0071e3">(x + 1)</text>
  </g>"""
    results['KP-014-zh.svg'] = build_svg_document('KP-014', '代数式', '因式分解', zh_014, '因式分解将多项式和化归为因式乘积: x² + 3x + 2 = (x+1)(x+2)')
    results['KP-014-en.svg'] = build_svg_document('KP-014', 'Algebra', 'Polynomial Factorization', en_014, 'Factoring transforms sums into products: x² + 3x + 2 = (x+1)(x+2)', is_en=True)

    # KP-015: 二次根式的化简与运算 (直角三角形与开方)
    zh_015 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="30,130 170,130 170,40" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>
    <rect class="layer-stage-2" x="158" y="118" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/>
    <text class="layer-stage-2" x="100" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">直角边 a</text>
    <text class="layer-stage-3 formal-labels" x="195" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="#0284c7">直角边 b</text>
    <line class="layer-stage-3 formal-labels" x1="30" y1="130" x2="170" y2="40" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-4" x="85" y="75" font-size="13" font-weight="bold" fill="#dc2626">c = √(a² + b²)</text>
    <text class="layer-stage-4" x="100" y="15" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">双重非负性: 被开方数≥0, 根式值≥0</text>
  </g>"""
    en_015 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="30,130 170,130 170,40" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>
    <rect class="layer-stage-2" x="158" y="118" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/>
    <text class="layer-stage-2" x="100" y="150" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">Leg a</text>
    <text class="layer-stage-3 formal-labels" x="195" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="#0284c7">Leg b</text>
    <line class="layer-stage-3 formal-labels" x1="30" y1="130" x2="170" y2="40" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-4" x="85" y="75" font-size="12" font-weight="bold" fill="#dc2626">c = √(a² + b²)</text>
    <text class="layer-stage-4" x="100" y="15" text-anchor="middle" font-size="10" font-weight="bold" fill="#047857">Dual Non-negativity: radicand ≥ 0, value ≥ 0</text>
  </g>"""
    results['KP-015-zh.svg'] = build_svg_document('KP-015', '代数式', '二次根式的化简与运算', zh_015, '二次根式双重非负性与最简二次根式化简')
    results['KP-015-en.svg'] = build_svg_document('KP-015', 'Algebra', 'Quadratic Radicals Operations', en_015, 'Simplification and dual non-negativity of quadratic radicals', is_en=True)

    return results
