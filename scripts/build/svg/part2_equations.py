"""
分片 2: KP-016 ~ KP-029 (分式、方程与不等式)
14 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part2():
    results = {}

    # KP-016: 分式的基本性质 (面积等比切分 A/B = AM/BM)
    zh_016 = """  <g transform="translate(45, 75)">
    <!-- Base fraction 1/2 -->
    <rect class="layer-stage-1" x="20" y="25" width="100" height="90" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <line class="layer-stage-1" x1="70" y1="25" x2="70" y2="115" stroke="#3b82f6" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="25" width="50" height="90" fill="#93c5fd" opacity="0.6"/>
    <text class="layer-stage-2" x="45" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e40af">A/B</text>
    <text class="layer-stage-3 formal-labels" x="145" y="75" text-anchor="middle" font-size="20" font-weight="bold" fill="#64748b">=</text>
    <!-- Scaled fraction (A·M)/(B·M) -->
    <rect class="layer-stage-3 formal-labels" x="170" y="25" width="100" height="90" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="220" y1="25" x2="220" y2="115" stroke="#2563eb" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="170" y1="70" x2="270" y2="70" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3 3"/>
    <rect class="layer-stage-4" x="170" y="25" width="50" height="45" fill="#60a5fa" opacity="0.8"/>
    <rect class="layer-stage-4" x="170" y="70" width="50" height="45" fill="#60a5fa" opacity="0.8"/>
    <text class="layer-stage-4" x="220" y="135" text-anchor="middle" font-size="12" font-weight="bold" fill="#1d4ed8">(A·M) / (B·M)</text>
  </g>"""
    en_016 = """  <g transform="translate(45, 75)">
    <rect class="layer-stage-1" x="20" y="25" width="100" height="90" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <line class="layer-stage-1" x1="70" y1="25" x2="70" y2="115" stroke="#3b82f6" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="25" width="50" height="90" fill="#93c5fd" opacity="0.6"/>
    <text class="layer-stage-2" x="45" y="75" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">A/B</text>
    <text class="layer-stage-3 formal-labels" x="145" y="75" text-anchor="middle" font-size="20" font-weight="bold" fill="#64748b">=</text>
    <rect class="layer-stage-3 formal-labels" x="170" y="25" width="100" height="90" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="220" y1="25" x2="220" y2="115" stroke="#2563eb" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="170" y1="70" x2="270" y2="70" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3 3"/>
    <rect class="layer-stage-4" x="170" y="25" width="50" height="45" fill="#60a5fa" opacity="0.8"/>
    <rect class="layer-stage-4" x="170" y="70" width="50" height="45" fill="#60a5fa" opacity="0.8"/>
    <text class="layer-stage-4" x="220" y="135" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8">(A·M) / (B·M)</text>
  </g>"""
    results['KP-016-zh.svg'] = build_svg_document('KP-016', '分式', '分式的基本性质', zh_016, '分式分子分母同乘非零整式M，分式的值不变: A/B = AM/BM')
    results['KP-016-en.svg'] = build_svg_document('KP-016', 'Fractions', 'Fundamental Property of Fractions', en_016, 'Multiplying numerator & denominator by non-zero M preserves value', is_en=True)

    # KP-017: 分式的四则运算 (通分网格 1/a + 1/b)
    zh_017 = """  <g transform="translate(40, 75)">
    <rect class="layer-stage-1" x="20" y="25" width="80" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-1" x="60" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">1/a = b/(ab)</text>
    <text class="layer-stage-2" x="115" y="72" text-anchor="middle" font-size="18" font-weight="bold" fill="#475569">+</text>
    <rect class="layer-stage-2" x="130" y="25" width="80" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="170" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">1/b = a/(ab)</text>
    <path class="layer-stage-3 formal-labels" d="M225,65 L245,65" stroke="#059669" stroke-width="2"/>
    <!-- Common denominator grid -->
    <rect class="layer-stage-4" x="255" y="25" width="70" height="80" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="290" y="65" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">a + b</text>
    <line class="layer-stage-4" x1="265" y1="72" x2="315" y2="72" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-4" x="290" y="88" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">ab</text>
  </g>"""
    en_017 = """  <g transform="translate(40, 75)">
    <rect class="layer-stage-1" x="20" y="25" width="80" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-1" x="60" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">1/a = b/(ab)</text>
    <text class="layer-stage-2" x="115" y="72" text-anchor="middle" font-size="18" font-weight="bold" fill="#475569">+</text>
    <rect class="layer-stage-2" x="130" y="25" width="80" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="170" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">1/b = a/(ab)</text>
    <path class="layer-stage-3 formal-labels" d="M225,65 L245,65" stroke="#059669" stroke-width="2"/>
    <rect class="layer-stage-4" x="255" y="25" width="70" height="80" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="290" y="65" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">a + b</text>
    <line class="layer-stage-4" x1="265" y1="72" x2="315" y2="72" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-4" x="290" y="88" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">ab</text>
  </g>"""
    results['KP-017-zh.svg'] = build_svg_document('KP-017', '分式', '分式的四则运算', zh_017, '异分母加减必须先通分化为同分母: 1/a + 1/b = (a+b)/(ab)')
    results['KP-017-en.svg'] = build_svg_document('KP-017', 'Fractions', 'Fraction Operations', en_017, 'Find common denominator before adding: 1/a + 1/b = (a+b)/(ab)', is_en=True)

    # KP-018: 分式方程的解法与增根检验 (数轴排除增根)
    zh_018 = """  <g transform="translate(35, 80)">
    <line class="layer-stage-1" x1="20" y1="70" x2="310" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Candidate root x=2 (Valid) -->
    <circle class="layer-stage-1" cx="90" cy="70" r="5" fill="#16a34a"/>
    <text class="layer-stage-1" x="90" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">x = 2 (原方程的根)</text>
    <!-- Extraneous root x=3 (Denied) -->
    <circle class="layer-stage-2" cx="220" cy="70" r="5" fill="#dc2626"/>
    <!-- Red cross over x=3 -->
    <path class="layer-stage-3 formal-labels" d="M212,62 L228,78 M228,62 L212,78" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="220" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">x = 3 (增根舍去)</text>
    <text class="layer-stage-4" x="220" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#b91c1c">使最简公分母 x-3 = 0</text>
  </g>"""
    en_018 = """  <g transform="translate(35, 80)">
    <line class="layer-stage-1" x1="20" y1="70" x2="310" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="90" cy="70" r="5" fill="#16a34a"/>
    <text class="layer-stage-1" x="90" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a">x = 2 (Valid Root)</text>
    <circle class="layer-stage-2" cx="220" cy="70" r="5" fill="#dc2626"/>
    <path class="layer-stage-3 formal-labels" d="M212,62 L228,78 M228,62 L212,78" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="220" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">x = 3 (Extraneous Root)</text>
    <text class="layer-stage-4" x="220" y="45" text-anchor="middle" font-size="10" font-weight="bold" fill="#b91c1c">Denominator x-3 = 0</text>
  </g>"""
    results['KP-018-zh.svg'] = build_svg_document('KP-018', '分式方程', '分式方程的解法与增根检验', zh_018, '解分式方程必须验根：代入最简公分母，若为零则是增根必须舍去')
    results['KP-018-en.svg'] = build_svg_document('KP-018', 'Fractional Equations', 'Extraneous Root Verification', en_018, 'Roots making common denominator zero are extraneous and rejected', is_en=True)

    # KP-019: 一元一次方程的解法与应用 (天平平衡模型 ax+b=c)
    zh_019 = """  <g transform="translate(50, 75)">
    <!-- Fulcrum triangle -->
    <polygon class="layer-stage-1" points="150,115 135,145 165,145" fill="#64748b"/>
    <!-- Beam -->
    <line class="layer-stage-1" x1="40" y1="115" x2="260" y2="115" stroke="#334155" stroke-width="4"/>
    <!-- Left pan with ax + b -->
    <line class="layer-stage-2" x1="60" y1="115" x2="60" y2="135" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="135" width="80" height="20" rx="4" fill="#e2e8f0" stroke="#64748b"/>
    <rect class="layer-stage-2" x="30" y="100" width="30" height="30" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-2" x="45" y="120" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">ax</text>
    <rect class="layer-stage-2" x="65" y="105" width="25" height="25" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="77" y="122" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">b</text>
    <!-- Right pan with c -->
    <line class="layer-stage-3 formal-labels" x1="240" y1="115" x2="240" y2="135" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-3 formal-labels" x="200" y="135" width="80" height="20" rx="4" fill="#e2e8f0" stroke="#64748b"/>
    <rect class="layer-stage-3 formal-labels" x="220" y="95" width="40" height="35" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="240" y="118" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">c</text>
    <!-- Stage 4 Solution step -->
    <text class="layer-stage-4" x="150" y="45" text-anchor="middle" font-size="13" font-weight="bold" fill="#0071e3">等式性质: ax = c - b ⇒ x = (c - b)/a</text>
  </g>"""
    en_019 = """  <g transform="translate(50, 75)">
    <polygon class="layer-stage-1" points="150,115 135,145 165,145" fill="#64748b"/>
    <line class="layer-stage-1" x1="40" y1="115" x2="260" y2="115" stroke="#334155" stroke-width="4"/>
    <line class="layer-stage-2" x1="60" y1="115" x2="60" y2="135" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="20" y="135" width="80" height="20" rx="4" fill="#e2e8f0" stroke="#64748b"/>
    <rect class="layer-stage-2" x="30" y="100" width="30" height="30" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-2" x="45" y="120" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">ax</text>
    <rect class="layer-stage-2" x="65" y="105" width="25" height="25" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="77" y="122" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">b</text>
    <line class="layer-stage-3 formal-labels" x1="240" y1="115" x2="240" y2="135" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-3 formal-labels" x="200" y="135" width="80" height="20" rx="4" fill="#e2e8f0" stroke="#64748b"/>
    <rect class="layer-stage-3 formal-labels" x="220" y="95" width="40" height="35" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="240" y="118" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">c</text>
    <text class="layer-stage-4" x="150" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#0071e3">Balance: ax = c - b ⇒ x = (c - b)/a</text>
  </g>"""
    results['KP-019-zh.svg'] = build_svg_document('KP-019', '一次方程', '一元一次方程的解法与应用', zh_019, '天平平衡模型：去分母、去括号、移项、合并同类项、系数化为1')
    results['KP-019-en.svg'] = build_svg_document('KP-019', 'Linear Equations', 'Solving Linear Equations', en_019, 'Balance scale model: isolate x using equivalent algebraic operations', is_en=True)

    # KP-020: 二元一次方程组 (两直线交点 P(x0, y0))
    zh_020 = """  <g transform="translate(50, 75)">
    <!-- Axes -->
    <line class="layer-stage-1" x1="20" y1="130" x2="260" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="50" y1="20" x2="50" y2="145" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Line 1: y = 2x - 10 -->
    <line class="layer-stage-2" x1="40" y1="120" x2="220" y2="30" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="225" y="35" font-size="11" font-weight="bold" fill="#2563eb">l₁: a₁x+b₁y=c₁</text>
    <!-- Line 2: y = -x + 30 -->
    <line class="layer-stage-3 formal-labels" x1="50" y1="35" x2="230" y2="125" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="235" y="125" font-size="11" font-weight="bold" fill="#ea580c">l₂: a₂x+b₂y=c₂</text>
    <!-- Intersection point P(x0, y0) -->
    <circle class="layer-stage-4" cx="135" cy="78" r="5" fill="#dc2626"/>
    <line class="layer-stage-4" x1="135" y1="78" x2="135" y2="130" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-4" x1="50" y1="78" x2="135" y2="78" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="145" y="70" font-size="12" font-weight="bold" fill="#dc2626">P(x₀, y₀) 唯一解</text>
  </g>"""
    en_020 = """  <g transform="translate(50, 75)">
    <line class="layer-stage-1" x1="20" y1="130" x2="260" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="50" y1="20" x2="50" y2="145" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="40" y1="120" x2="220" y2="30" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="225" y="35" font-size="10" font-weight="bold" fill="#2563eb">l₁: a₁x+b₁y=c₁</text>
    <line class="layer-stage-3 formal-labels" x1="50" y1="35" x2="230" y2="125" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="235" y="125" font-size="10" font-weight="bold" fill="#ea580c">l₂: a₂x+b₂y=c₂</text>
    <circle class="layer-stage-4" cx="135" cy="78" r="5" fill="#dc2626"/>
    <line class="layer-stage-4" x1="135" y1="78" x2="135" y2="130" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-4" x1="50" y1="78" x2="135" y2="78" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="145" y="70" font-size="11" font-weight="bold" fill="#dc2626">P(x₀, y₀) Unique Solution</text>
  </g>"""
    results['KP-020-zh.svg'] = build_svg_document('KP-020', '方程组', '二元一次方程组', zh_020, '二元一次方程组的解对应直角坐标系中两条直线的交点坐标')
    results['KP-020-en.svg'] = build_svg_document('KP-020', 'Linear Systems', 'Systems of Linear Equations', en_020, 'Solution represents intersection point of two linear graphs', is_en=True)

    # KP-021: 一元二次方程的概念 (二次面积 ax^2 + bx + c = 0)
    zh_021 = """  <g transform="translate(55, 75)">
    <!-- Square ax^2 -->
    <rect class="layer-stage-1" x="20" y="25" width="80" height="80" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="60" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#1d4ed8">ax² (二次项)</text>
    <text class="layer-stage-2" x="115" y="70" text-anchor="middle" font-size="18" font-weight="bold" fill="#475569">+</text>
    <!-- Rectangle bx -->
    <rect class="layer-stage-2" x="130" y="25" width="50" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="155" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">bx</text>
    <text class="layer-stage-3 formal-labels" x="195" y="70" text-anchor="middle" font-size="18" font-weight="bold" fill="#475569">+</text>
    <!-- Constant block c -->
    <rect class="layer-stage-3 formal-labels" x="210" y="50" width="30" height="55" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="225" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#b91c1c">c</text>
    <!-- Equation = 0 -->
    <text class="layer-stage-4" x="265" y="70" font-size="18" font-weight="bold" fill="#047857">= 0</text>
    <text class="layer-stage-4" x="140" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">必要条件: a ≠ 0, 最高次数为 2</text>
  </g>"""
    en_021 = """  <g transform="translate(55, 75)">
    <rect class="layer-stage-1" x="20" y="25" width="80" height="80" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="60" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="#1d4ed8">ax² (Quadratic)</text>
    <text class="layer-stage-2" x="115" y="70" text-anchor="middle" font-size="18" font-weight="bold" fill="#475569">+</text>
    <rect class="layer-stage-2" x="130" y="25" width="50" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="155" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">bx</text>
    <text class="layer-stage-3 formal-labels" x="195" y="70" text-anchor="middle" font-size="18" font-weight="bold" fill="#475569">+</text>
    <rect class="layer-stage-3 formal-labels" x="210" y="50" width="30" height="55" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="225" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#b91c1c">c</text>
    <text class="layer-stage-4" x="265" y="70" font-size="18" font-weight="bold" fill="#047857">= 0</text>
    <text class="layer-stage-4" x="140" y="130" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Constraint: a ≠ 0, Degree = 2</text>
  </g>"""
    results['KP-021-zh.svg'] = build_svg_document('KP-021', '二次方程', '一元二次方程的概念', zh_021, '一元二次方程标准形式: ax² + bx + c = 0 (a≠0)')
    results['KP-021-en.svg'] = build_svg_document('KP-021', 'Quadratic Equations', 'Concept of Quadratic Equations', en_021, 'Standard form: ax² + bx + c = 0 where a ≠ 0', is_en=True)

    # KP-022: 直接开平方法 (对称开方 x^2 = p)
    zh_022 = """  <g transform="translate(50, 75)">
    <!-- Square area p -->
    <rect class="layer-stage-1" x="20" y="25" width="90" height="90" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-1" x="65" y="75" text-anchor="middle" font-size="14" font-weight="bold" fill="#15803d">面积 = p (p≥0)</text>
    <!-- Arrow to roots -->
    <path class="layer-stage-2" d="M125,70 L160,70" stroke="#475569" stroke-width="2"/>
    <!-- Number line with symmetric roots -->
    <line class="layer-stage-3 formal-labels" x1="170" y1="70" x2="290" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-3 formal-labels" cx="230" cy="70" r="3" fill="#64748b"/>
    <text class="layer-stage-3 formal-labels" x="230" y="88" text-anchor="middle" font-size="10" fill="#64748b">0</text>
    <circle class="layer-stage-4" cx="190" cy="70" r="5" fill="#dc2626"/>
    <circle class="layer-stage-4" cx="270" cy="70" r="5" fill="#2563eb"/>
    <text class="layer-stage-4" x="190" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">-√p</text>
    <text class="layer-stage-4" x="270" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">+√p</text>
    <text class="layer-stage-4" x="230" y="125" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">x² = p ⇒ x = ±√p</text>
  </g>"""
    en_022 = """  <g transform="translate(50, 75)">
    <rect class="layer-stage-1" x="20" y="25" width="90" height="90" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-1" x="65" y="75" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">Area = p (p≥0)</text>
    <path class="layer-stage-2" d="M125,70 L160,70" stroke="#475569" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="170" y1="70" x2="290" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-3 formal-labels" cx="230" cy="70" r="3" fill="#64748b"/>
    <text class="layer-stage-3 formal-labels" x="230" y="88" text-anchor="middle" font-size="10" fill="#64748b">0</text>
    <circle class="layer-stage-4" cx="190" cy="70" r="5" fill="#dc2626"/>
    <circle class="layer-stage-4" cx="270" cy="70" r="5" fill="#2563eb"/>
    <text class="layer-stage-4" x="190" y="55" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">-√p</text>
    <text class="layer-stage-4" x="270" y="55" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">+√p</text>
    <text class="layer-stage-4" x="230" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">x² = p ⇒ x = ±√p</text>
  </g>"""
    results['KP-022-zh.svg'] = build_svg_document('KP-022', '二次方程', '直接开平方法', zh_022, '形如 x²=p (p≥0) 直接开方解得两相反数根 x=±√p')
    results['KP-022-en.svg'] = build_svg_document('KP-022', 'Quadratic Equations', 'Direct Square Root Method', en_022, 'Direct extraction: x² = p yields two symmetric roots x = ±√p', is_en=True)

    # KP-023: 配方法 (阿尔·花拉子米正方形割补几何图)
    zh_023 = """  <g transform="translate(65, 68)">
    <rect class="layer-stage-1" x="20" y="20" width="100" height="100" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>
    <text class="layer-stage-1" x="70" y="75" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e40af">x²</text>
    <rect class="layer-stage-2" x="120" y="20" width="40" height="100" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="140" y="75" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">(b/2)x</text>
    <rect class="layer-stage-2" x="20" y="120" width="100" height="40" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="70" y="145" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">(b/2)x</text>
    <rect class="layer-stage-3 formal-labels" x="120" y="120" width="40" height="40" fill="#fee2e2" stroke="#dc2626" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="140" y="145" text-anchor="middle" font-size="11" font-weight="bold" fill="#b91c1c">(b/2)²</text>
    <path class="layer-stage-4" d="M15,20 L15,160" stroke="#047857" stroke-width="1.5"/>
    <text class="layer-stage-4" x="8" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">x + b/2</text>
    <path class="layer-stage-4" d="M20,15 L160,15" stroke="#047857" stroke-width="1.5"/>
    <text class="layer-stage-4" x="90" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">x + b/2</text>
  </g>"""
    en_023 = """  <g transform="translate(65, 68)">
    <rect class="layer-stage-1" x="20" y="20" width="100" height="100" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>
    <text class="layer-stage-1" x="70" y="75" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e40af">x²</text>
    <rect class="layer-stage-2" x="120" y="20" width="40" height="100" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="140" y="75" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">(b/2)x</text>
    <rect class="layer-stage-2" x="20" y="120" width="100" height="40" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="70" y="145" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">(b/2)x</text>
    <rect class="layer-stage-3 formal-labels" x="120" y="120" width="40" height="40" fill="#fee2e2" stroke="#dc2626" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="140" y="145" text-anchor="middle" font-size="10" font-weight="bold" fill="#b91c1c">(b/2)²</text>
    <path class="layer-stage-4" d="M15,20 L15,160" stroke="#047857" stroke-width="1.5"/>
    <text class="layer-stage-4" x="8" y="95" text-anchor="middle" font-size="10" font-weight="bold" fill="#047857">x + b/2</text>
    <path class="layer-stage-4" d="M20,15 L160,15" stroke="#047857" stroke-width="1.5"/>
    <text class="layer-stage-4" x="90" y="10" text-anchor="middle" font-size="10" font-weight="bold" fill="#047857">x + b/2</text>
  </g>"""
    results['KP-023-zh.svg'] = build_svg_document('KP-023', '一元二次方程', '配方法', zh_023, '阿尔·花拉子米割补面积法: x² + bx + (b/2)² = (x + b/2)²')
    results['KP-023-en.svg'] = build_svg_document('KP-023', 'Quadratic Equations', 'Completing the Square', en_023, 'Al-Khwarizmi Area Dissection: x² + bx + (b/2)² = (x + b/2)²', is_en=True)

    # KP-024: 求根公式法 (对称轴 -b/(2a) 左右对称偏移)
    zh_024 = """  <g transform="translate(45, 70)">
    <line class="layer-stage-1" x1="20" y1="120" x2="280" y2="120" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Parabola -->
    <path class="layer-stage-2" d="M50,20 Q150,170 250,20" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <!-- Axis of symmetry -->
    <line class="layer-stage-3 formal-labels" x1="150" y1="15" x2="150" y2="140" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="150" y="152" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">x = -b/(2a)</text>
    <!-- Roots -->
    <circle class="layer-stage-4" cx="85" cy="120" r="5" fill="#dc2626"/>
    <circle class="layer-stage-4" cx="215" cy="120" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="85" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">x₁</text>
    <text class="layer-stage-4" x="215" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">x₂</text>
    <path class="layer-stage-4" d="M85,105 L150,105" stroke="#16a34a" stroke-width="1.5"/>
    <path class="layer-stage-4" d="M150,105 L215,105" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-4" x="150" y="98" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a">对称偏移: √Δ / (2a)</text>
  </g>"""
    en_024 = """  <g transform="translate(45, 70)">
    <line class="layer-stage-1" x1="20" y1="120" x2="280" y2="120" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M50,20 Q150,170 250,20" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <line class="layer-stage-3 formal-labels" x1="150" y1="15" x2="150" y2="140" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="150" y="152" text-anchor="middle" font-size="10" font-weight="bold" fill="#ea580c">x = -b/(2a)</text>
    <circle class="layer-stage-4" cx="85" cy="120" r="5" fill="#dc2626"/>
    <circle class="layer-stage-4" cx="215" cy="120" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="85" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">x₁</text>
    <text class="layer-stage-4" x="215" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">x₂</text>
    <path class="layer-stage-4" d="M85,105 L150,105" stroke="#16a34a" stroke-width="1.5"/>
    <path class="layer-stage-4" d="M150,105 L215,105" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-4" x="150" y="98" text-anchor="middle" font-size="10" font-weight="bold" fill="#16a34a">Offset: √Δ / (2a)</text>
  </g>"""
    results['KP-024-zh.svg'] = build_svg_document('KP-024', '一元二次方程', '求根公式法', zh_024, '求根公式: x = (-b ± √(b² - 4ac)) / (2a) (Δ≥0)')
    results['KP-024-en.svg'] = build_svg_document('KP-024', 'Quadratic Equations', 'The Quadratic Formula', en_024, 'Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a) (Δ≥0)', is_en=True)

    # KP-025: 因式分解法解一元二次方程 ((x-x1)(x-x2)=0)
    zh_025 = """  <g transform="translate(45, 75)">
    <!-- Factor product box -->
    <rect class="layer-stage-1" x="20" y="25" width="110" height="70" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-1" x="75" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="#1d4ed8">(x - x₁)</text>
    <text class="layer-stage-2" x="145" y="65" text-anchor="middle" font-size="20" font-weight="bold" fill="#64748b">·</text>
    <rect class="layer-stage-2" x="160" y="25" width="110" height="70" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-2" x="215" y="65" text-anchor="middle" font-size="14" font-weight="bold" fill="#b45309">(x - x₂)</text>
    <text class="layer-stage-3 formal-labels" x="285" y="65" font-size="20" font-weight="bold" fill="#15803d">= 0</text>
    <!-- Branching to roots -->
    <path class="layer-stage-4" d="M75,95 L75,120 M215,95 L215,120" stroke="#059669" stroke-width="2"/>
    <text class="layer-stage-4" x="75" y="140" text-anchor="middle" font-size="13" font-weight="bold" fill="#059669">x₁ = a</text>
    <text class="layer-stage-4" x="145" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#475569">或</text>
    <text class="layer-stage-4" x="215" y="140" text-anchor="middle" font-size="13" font-weight="bold" fill="#059669">x₂ = b</text>
  </g>"""
    en_025 = """  <g transform="translate(45, 75)">
    <rect class="layer-stage-1" x="20" y="25" width="110" height="70" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-1" x="75" y="65" text-anchor="middle" font-size="13" font-weight="bold" fill="#1d4ed8">(x - x₁)</text>
    <text class="layer-stage-2" x="145" y="65" text-anchor="middle" font-size="20" font-weight="bold" fill="#64748b">·</text>
    <rect class="layer-stage-2" x="160" y="25" width="110" height="70" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-2" x="215" y="65" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">(x - x₂)</text>
    <text class="layer-stage-3 formal-labels" x="285" y="65" font-size="20" font-weight="bold" fill="#15803d">= 0</text>
    <path class="layer-stage-4" d="M75,95 L75,120 M215,95 L215,120" stroke="#059669" stroke-width="2"/>
    <text class="layer-stage-4" x="75" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#059669">x₁ = a</text>
    <text class="layer-stage-4" x="145" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">OR</text>
    <text class="layer-stage-4" x="215" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#059669">x₂ = b</text>
  </g>"""
    results['KP-025-zh.svg'] = build_svg_document('KP-025', '一元二次方程', '因式分解法解一元二次方程', zh_025, '零乘积原理: 若 A·B = 0 则 A = 0 或 B = 0，实现降次求解')
    results['KP-025-en.svg'] = build_svg_document('KP-025', 'Quadratic Equations', 'Factoring Method', en_025, 'Zero-product property: AB = 0 implies A = 0 or B = 0', is_en=True)

    # KP-026: 根的判别式与韦达定理
    zh_026 = """  <g transform="translate(45, 70)">
    <line class="layer-stage-1" x1="20" y1="120" x2="280" y2="120" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="150" y1="20" x2="150" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M60,30 Q150,180 240,30" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="95" cy="120" r="5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="205" cy="120" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="95" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">x₁</text>
    <text class="layer-stage-3 formal-labels" x="205" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">x₂</text>
    <text class="layer-stage-4" x="150" y="45" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">Δ = b² - 4ac &gt; 0 (两实根)</text>
    <line class="layer-stage-4" x1="95" y1="110" x2="205" y2="110" stroke="#047857" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="150" y="105" text-anchor="middle" font-size="11" fill="#047857">|x₁ - x₂| = √Δ / |a|</text>
  </g>"""
    en_026 = """  <g transform="translate(45, 70)">
    <line class="layer-stage-1" x1="20" y1="120" x2="280" y2="120" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="150" y1="20" x2="150" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M60,30 Q150,180 240,30" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="95" cy="120" r="5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="205" cy="120" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="95" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">x₁</text>
    <text class="layer-stage-3 formal-labels" x="205" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">x₂</text>
    <text class="layer-stage-4" x="150" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Δ = b² - 4ac &gt; 0 (Two Roots)</text>
    <line class="layer-stage-4" x1="95" y1="110" x2="205" y2="110" stroke="#047857" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="150" y="105" text-anchor="middle" font-size="11" fill="#047857">|x₁ - x₂| = √Δ / |a|</text>
  </g>"""
    results['KP-026-zh.svg'] = build_svg_document('KP-026', '一元二次方程', '判别式与韦达定理', zh_026, '两根之和 x₁+x₂ = -b/a, 两根之积 x₁x₂ = c/a')
    results['KP-026-en.svg'] = build_svg_document('KP-026', 'Quadratic Equations', "Discriminant & Vieta's", en_026, "Vieta's: x₁+x₂ = -b/a, x₁x₂ = c/a; Δ = b² - 4ac", is_en=True)

    # KP-027: 不等式的基本性质 (乘以负数变向 a < b ⇒ -a > -b)
    zh_027 = """  <g transform="translate(40, 75)">
    <!-- Positive axis: a < b -->
    <line class="layer-stage-1" x1="20" y1="45" x2="290" y2="45" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="80" cy="45" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="80" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">a</text>
    <circle class="layer-stage-2" cx="210" cy="45" r="5" fill="#2563eb"/>
    <text class="layer-stage-2" x="210" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">b</text>
    <text class="layer-stage-2" x="145" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">a &lt; b</text>
    <!-- Multiply by -1 Arrow -->
    <path class="layer-stage-3 formal-labels" d="M145,55 L145,85" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="185" y="75" font-size="11" font-weight="bold" fill="#dc2626">× (-1) 符号变向</text>
    <!-- Inverted axis: -b < -a -->
    <line class="layer-stage-4" x1="20" y1="105" x2="290" y2="105" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-4" cx="80" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="80" y="125" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">-b</text>
    <circle class="layer-stage-4" cx="210" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="210" y="125" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">-a</text>
    <text class="layer-stage-4" x="145" y="125" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">-a &gt; -b</text>
  </g>"""
    en_027 = """  <g transform="translate(40, 75)">
    <line class="layer-stage-1" x1="20" y1="45" x2="290" y2="45" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="80" cy="45" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="80" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">a</text>
    <circle class="layer-stage-2" cx="210" cy="45" r="5" fill="#2563eb"/>
    <text class="layer-stage-2" x="210" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">b</text>
    <text class="layer-stage-2" x="145" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">a &lt; b</text>
    <path class="layer-stage-3 formal-labels" d="M145,55 L145,85" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="185" y="75" font-size="10" font-weight="bold" fill="#dc2626">× (-1) Flips Direction</text>
    <line class="layer-stage-4" x1="20" y1="105" x2="290" y2="105" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-4" cx="80" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="80" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">-b</text>
    <circle class="layer-stage-4" cx="210" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="210" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">-a</text>
    <text class="layer-stage-4" x="145" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">-a &gt; -b</text>
  </g>"""
    results['KP-027-zh.svg'] = build_svg_document('KP-027', '不等式', '不等式的基本性质', zh_027, '不等式两边同乘或同除以负数，不等号方向改变')
    results['KP-027-en.svg'] = build_svg_document('KP-027', 'Inequalities', 'Properties of Inequalities', en_027, 'Multiplying or dividing by negative number reverses inequality direction', is_en=True)

    # KP-028: 一元一次不等式的解法 (数轴单向射线解集 x ≥ a)
    zh_028 = """  <g transform="translate(35, 80)">
    <line class="layer-stage-1" x1="20" y1="70" x2="310" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <polygon class="layer-stage-1" points="315,70 305,65 305,75" fill="#94a3b8"/>
    <!-- Solid boundary point a -->
    <circle class="layer-stage-2" cx="110" cy="70" r="6" fill="#2563eb"/>
    <text class="layer-stage-2" x="110" y="95" text-anchor="middle" font-size="13" font-weight="bold" fill="#2563eb">a (实心包含点)</text>
    <!-- Directed ray x >= a -->
    <line class="layer-stage-3 formal-labels" x1="110" y1="70" x2="280" y2="70" stroke="#2563eb" stroke-width="4"/>
    <polygon class="layer-stage-3 formal-labels" points="285,70 275,64 275,76" fill="#2563eb"/>
    <text class="layer-stage-4" x="200" y="50" text-anchor="middle" font-size="14" font-weight="bold" fill="#1d4ed8">解集射线: x ≥ a</text>
  </g>"""
    en_028 = """  <g transform="translate(35, 80)">
    <line class="layer-stage-1" x1="20" y1="70" x2="310" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
    <polygon class="layer-stage-1" points="315,70 305,65 305,75" fill="#94a3b8"/>
    <circle class="layer-stage-2" cx="110" cy="70" r="6" fill="#2563eb"/>
    <text class="layer-stage-2" x="110" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">a (Solid Included)</text>
    <line class="layer-stage-3 formal-labels" x1="110" y1="70" x2="280" y2="70" stroke="#2563eb" stroke-width="4"/>
    <polygon class="layer-stage-3 formal-labels" points="285,70 275,64 275,76" fill="#2563eb"/>
    <text class="layer-stage-4" x="200" y="50" text-anchor="middle" font-size="13" font-weight="bold" fill="#1d4ed8">Solution Ray: x ≥ a</text>
  </g>"""
    results['KP-028-zh.svg'] = build_svg_document('KP-028', '一元一次不等式', '一元一次不等式的解法', zh_028, '在数轴上表示解集：大于向右画，小于向左画，有等号画实心点')
    results['KP-028-en.svg'] = build_svg_document('KP-028', 'Linear Inequalities', 'Solving Linear Inequalities', en_028, 'Graphing on number line: right for greater, solid dot includes equality', is_en=True)

    # KP-029: 一元一次不等式组的解法 (双向重叠公共区间 a ≤ x < b)
    zh_029 = """  <g transform="translate(35, 75)">
    <line class="layer-stage-1" x1="20" y1="90" x2="310" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Lower point a (solid) -->
    <circle class="layer-stage-1" cx="80" cy="90" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="80" y="115" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">a (实心)</text>
    <!-- Upper point b (hollow) -->
    <circle class="layer-stage-2" cx="230" cy="90" r="5" fill="#ffffff" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-2" x="230" y="115" text-anchor="middle" font-size="12" font-weight="bold" fill="#ea580c">b (空心)</text>
    <!-- Ray 1: x >= a (raised) -->
    <line class="layer-stage-3 formal-labels" x1="80" y1="90" x2="80" y2="55" stroke="#2563eb" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="80" y1="55" x2="270" y2="55" stroke="#2563eb" stroke-width="2"/>
    <!-- Ray 2: x < b (raised) -->
    <line class="layer-stage-3 formal-labels" x1="230" y1="90" x2="230" y2="40" stroke="#ea580c" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="230" y1="40" x2="40" y2="40" stroke="#ea580c" stroke-width="2"/>
    <!-- Overlap shaded rectangle -->
    <rect class="layer-stage-4" x="80" y="55" width="150" height="35" fill="#dcfce7" opacity="0.6"/>
    <text class="layer-stage-4" x="155" y="78" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">公共解集: a ≤ x &lt; b</text>
  </g>"""
    en_029 = """  <g transform="translate(35, 75)">
    <line class="layer-stage-1" x1="20" y1="90" x2="310" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="80" cy="90" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="80" y="115" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">a (Solid)</text>
    <circle class="layer-stage-2" cx="230" cy="90" r="5" fill="#ffffff" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-2" x="230" y="115" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">b (Hollow)</text>
    <line class="layer-stage-3 formal-labels" x1="80" y1="90" x2="80" y2="55" stroke="#2563eb" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="80" y1="55" x2="270" y2="55" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="230" y1="90" x2="230" y2="40" stroke="#ea580c" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="230" y1="40" x2="40" y2="40" stroke="#ea580c" stroke-width="2"/>
    <rect class="layer-stage-4" x="80" y="55" width="150" height="35" fill="#dcfce7" opacity="0.6"/>
    <text class="layer-stage-4" x="155" y="78" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">Overlap: a ≤ x &lt; b</text>
  </g>"""
    results['KP-029-zh.svg'] = build_svg_document('KP-029', '一元一次不等式组', '一元一次不等式组的解法', zh_029, '不等式组的解集是各不等式解集的公共部分（交叉重叠区）')
    results['KP-029-en.svg'] = build_svg_document('KP-029', 'Systems of Inequalities', 'Solving Systems of Inequalities', en_029, 'Solution of inequality system is the intersection of individual sets', is_en=True)

    return results
