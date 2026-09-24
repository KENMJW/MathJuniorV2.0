"""
分片 3: KP-030 ~ KP-043 (函数与直角坐标系)
14 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part3():
    results = {}

    # KP-030: 函数的概念 (映射关系集合 X -> Y 单值唯一映射)
    zh_030 = """  <g transform="translate(45, 75)">
    <!-- Set X (Domain) -->
    <ellipse class="layer-stage-1" cx="60" cy="70" rx="45" ry="60" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-1" x="60" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#1d4ed8">自变量集 X</text>
    <circle class="layer-stage-1" cx="60" cy="55" r="4" fill="#2563eb"/>
    <text class="layer-stage-1" x="48" y="58" font-size="11" fill="#1e40af">x₁</text>
    <circle class="layer-stage-1" cx="60" cy="85" r="4" fill="#2563eb"/>
    <text class="layer-stage-1" x="48" y="88" font-size="11" fill="#1e40af">x₂</text>
    <!-- Set Y (Range) -->
    <ellipse class="layer-stage-2" cx="220" cy="70" rx="45" ry="60" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-2" x="220" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">因变量集 Y</text>
    <circle class="layer-stage-2" cx="220" cy="55" r="4" fill="#16a34a"/>
    <text class="layer-stage-2" x="232" y="58" font-size="11" fill="#15803d">y₁</text>
    <circle class="layer-stage-2" cx="220" cy="85" r="4" fill="#16a34a"/>
    <text class="layer-stage-2" x="232" y="88" font-size="11" fill="#15803d">y₂</text>
    <!-- Mapping arrows f: X -> Y -->
    <path class="layer-stage-3 formal-labels" d="M68,55 Q140,40 212,55" fill="none" stroke="#ea580c" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="216,55 206,50 208,60" fill="#ea580c"/>
    <path class="layer-stage-3 formal-labels" d="M68,85 Q140,100 212,85" fill="none" stroke="#ea580c" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="216,85 208,80 206,90" fill="#ea580c"/>
    <text class="layer-stage-4" x="140" y="72" text-anchor="middle" font-size="13" font-weight="bold" fill="#ea580c">唯一确定对应 f(x)</text>
  </g>"""
    en_030 = """  <g transform="translate(45, 75)">
    <ellipse class="layer-stage-1" cx="60" cy="70" rx="45" ry="60" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-1" x="60" y="30" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8">Domain X</text>
    <circle class="layer-stage-1" cx="60" cy="55" r="4" fill="#2563eb"/>
    <text class="layer-stage-1" x="48" y="58" font-size="11" fill="#1e40af">x₁</text>
    <circle class="layer-stage-1" cx="60" cy="85" r="4" fill="#2563eb"/>
    <text class="layer-stage-1" x="48" y="88" font-size="11" fill="#1e40af">x₂</text>
    <ellipse class="layer-stage-2" cx="220" cy="70" rx="45" ry="60" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-2" x="220" y="30" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Codomain Y</text>
    <circle class="layer-stage-2" cx="220" cy="55" r="4" fill="#16a34a"/>
    <text class="layer-stage-2" x="232" y="58" font-size="11" fill="#15803d">y₁</text>
    <circle class="layer-stage-2" cx="220" cy="85" r="4" fill="#16a34a"/>
    <text class="layer-stage-2" x="232" y="88" font-size="11" fill="#15803d">y₂</text>
    <path class="layer-stage-3 formal-labels" d="M68,55 Q140,40 212,55" fill="none" stroke="#ea580c" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="216,55 206,50 208,60" fill="#ea580c"/>
    <path class="layer-stage-3 formal-labels" d="M68,85 Q140,100 212,85" fill="none" stroke="#ea580c" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="216,85 208,80 206,90" fill="#ea580c"/>
    <text class="layer-stage-4" x="140" y="72" text-anchor="middle" font-size="12" font-weight="bold" fill="#ea580c">Unique Mapping y=f(x)</text>
  </g>"""
    results['KP-030-zh.svg'] = build_svg_document('KP-030', '函数', '函数的概念', zh_030, '对于集合X中每一个确定的x，在集合Y中都有唯一确定的y与之对应')
    results['KP-030-en.svg'] = build_svg_document('KP-030', 'Functions', 'Concept of Function', en_030, 'Every input x in domain maps to a unique output y in range', is_en=True)

    # KP-031: 平面直角坐标系与点的坐标 (四象限符号与点P坐标)
    zh_031 = """  <g transform="translate(50, 70)">
    <!-- Axes -->
    <line class="layer-stage-1" x1="15" y1="80" x2="265" y2="80" stroke="#94a3b8" stroke-width="1.5"/>
    <polygon class="layer-stage-1" points="270,80 260,76 260,84" fill="#94a3b8"/>
    <text class="layer-stage-1" x="270" y="75" font-size="11" fill="#64748b">x</text>
    <line class="layer-stage-1" x1="140" y1="15" x2="140" y2="155" stroke="#94a3b8" stroke-width="1.5"/>
    <polygon class="layer-stage-1" points="140,10 136,20 144,20" fill="#94a3b8"/>
    <text class="layer-stage-1" x="148" y="20" font-size="11" fill="#64748b">y</text>
    <text class="layer-stage-1" x="128" y="94" font-size="11" fill="#64748b">O</text>
    <!-- Four Quadrants -->
    <text class="layer-stage-2" x="200" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">一 (+,+)</text>
    <text class="layer-stage-2" x="80" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">二 (-,+)</text>
    <text class="layer-stage-2" x="80" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">三 (-,-)</text>
    <text class="layer-stage-2" x="200" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">四 (+,-)</text>
    <!-- Point P(a, b) in Quadrant I -->
    <circle class="layer-stage-3 formal-labels" cx="195" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="200" y="32" font-size="11" font-weight="bold" fill="#dc2626">P(a, b)</text>
    <line class="layer-stage-4" x1="195" y1="40" x2="195" y2="80" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-4" x1="140" y1="40" x2="195" y2="40" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
  </g>"""
    en_031 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="15" y1="80" x2="265" y2="80" stroke="#94a3b8" stroke-width="1.5"/>
    <polygon class="layer-stage-1" points="270,80 260,76 260,84" fill="#94a3b8"/>
    <text class="layer-stage-1" x="270" y="75" font-size="11" fill="#64748b">x</text>
    <line class="layer-stage-1" x1="140" y1="15" x2="140" y2="155" stroke="#94a3b8" stroke-width="1.5"/>
    <polygon class="layer-stage-1" points="140,10 136,20 144,20" fill="#94a3b8"/>
    <text class="layer-stage-1" x="148" y="20" font-size="11" fill="#64748b">y</text>
    <text class="layer-stage-1" x="128" y="94" font-size="11" fill="#64748b">O</text>
    <text class="layer-stage-2" x="200" y="45" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">I (+,+)</text>
    <text class="layer-stage-2" x="80" y="45" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">II (-,+)</text>
    <text class="layer-stage-2" x="80" y="125" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">III (-,-)</text>
    <text class="layer-stage-2" x="200" y="125" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">IV (+,-)</text>
    <circle class="layer-stage-3 formal-labels" cx="195" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="200" y="32" font-size="10" font-weight="bold" fill="#dc2626">P(a, b)</text>
    <line class="layer-stage-4" x1="195" y1="40" x2="195" y2="80" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-4" x1="140" y1="40" x2="195" y2="40" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
  </g>"""
    results['KP-031-zh.svg'] = build_svg_document('KP-031', '坐标系', '平面直角坐标系与点的坐标', zh_031, '平面内点与有序实数对 (x, y) 一一对应，四个象限符号明确')
    results['KP-031-en.svg'] = build_svg_document('KP-031', 'Coordinate System', 'Cartesian Coordinates & Points', en_031, 'Bijection between points and ordered pairs (x, y) across 4 quadrants', is_en=True)

    # KP-032: 正比例函数的图象与性质 (严格过原点直线 y=kx)
    zh_032 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="90" x2="260" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="140" y1="20" x2="140" y2="160" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="140" cy="90" r="5" fill="#1d1d1f"/>
    <text class="layer-stage-1" x="128" y="105" font-size="11" font-weight="bold">O (原点)</text>
    <!-- Strict line through Origin -->
    <line class="layer-stage-2" x1="50" y1="150" x2="230" y2="30" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="225" y="25" font-size="12" font-weight="bold" fill="#2563eb">y = kx (k &gt; 0)</text>
    <!-- Inclination angle arc -->
    <path class="layer-stage-3 formal-labels" d="M165,90 A25,25 0 0,0 158,78" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="175" y="82" font-size="11" font-weight="bold" fill="#ea580c">斜率 k = tan α</text>
    <text class="layer-stage-4" x="140" y="145" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">恒过原点 (0, 0)，k&gt;0 时 y 随 x 增大而增大</text>
  </g>"""
    en_032 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="90" x2="260" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="140" y1="20" x2="140" y2="160" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="140" cy="90" r="5" fill="#1d1d1f"/>
    <text class="layer-stage-1" x="128" y="105" font-size="10" font-weight="bold">O (Origin)</text>
    <line class="layer-stage-2" x1="50" y1="150" x2="230" y2="30" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="225" y="25" font-size="11" font-weight="bold" fill="#2563eb">y = kx (k &gt; 0)</text>
    <path class="layer-stage-3 formal-labels" d="M165,90 A25,25 0 0,0 158,78" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="175" y="82" font-size="10" font-weight="bold" fill="#ea580c">Slope k = tan α</text>
    <text class="layer-stage-4" x="140" y="145" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Passes through (0, 0); strictly increasing when k &gt; 0</text>
  </g>"""
    results['KP-032-zh.svg'] = build_svg_document('KP-032', '函数', '正比例函数的图象与性质', zh_032, '正比例函数图象是过原点的直线，k>0经过一三象限，k<0经过二四象限')
    results['KP-032-en.svg'] = build_svg_document('KP-032', 'Functions', 'Direct Proportional Functions', en_032, 'Direct proportional graph passes through origin; slope k determines trend', is_en=True)

    # KP-033: 一次函数的解析式求法 (待定系数法两点定线)
    zh_033 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="130" x2="260" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="50" y1="20" x2="50" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Point A(x1, y1) -->
    <circle class="layer-stage-2" cx="100" cy="100" r="5" fill="#dc2626"/>
    <text class="layer-stage-2" x="90" y="90" font-size="11" font-weight="bold" fill="#dc2626">A(x₁, y₁)</text>
    <!-- Point B(x2, y2) -->
    <circle class="layer-stage-2" cx="200" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-2" x="190" y="30" font-size="11" font-weight="bold" fill="#dc2626">B(x₂, y₂)</text>
    <!-- Line through A and B -->
    <line class="layer-stage-3 formal-labels" x1="60" y1="124" x2="230" y2="22" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="200" y="65" font-size="12" font-weight="bold" fill="#2563eb">y = kx + b</text>
    <!-- Undetermined coefficients formula -->
    <text class="layer-stage-4" x="140" y="145" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">待定系数法: k = (y₂ - y₁) / (x₂ - x₁)</text>
  </g>"""
    en_033 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="130" x2="260" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="50" y1="20" x2="50" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <circle class="layer-stage-2" cx="100" cy="100" r="5" fill="#dc2626"/>
    <text class="layer-stage-2" x="90" y="90" font-size="10" font-weight="bold" fill="#dc2626">A(x₁, y₁)</text>
    <circle class="layer-stage-2" cx="200" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-2" x="190" y="30" font-size="10" font-weight="bold" fill="#dc2626">B(x₂, y₂)</text>
    <line class="layer-stage-3 formal-labels" x1="60" y1="124" x2="230" y2="22" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="200" y="65" font-size="11" font-weight="bold" fill="#2563eb">y = kx + b</text>
    <text class="layer-stage-4" x="140" y="145" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Two Points Form: k = (y₂ - y₁) / (x₂ - x₁)</text>
  </g>"""
    results['KP-033-zh.svg'] = build_svg_document('KP-033', '函数', '一次函数的解析式求法', zh_033, '待定系数法：设 y=kx+b，代入两点坐标列二元一次方程组求 k 和 b')
    results['KP-033-en.svg'] = build_svg_document('KP-033', 'Functions', 'Linear Analytic Expressions', en_033, 'Method of undetermined coefficients: substitute 2 points to find k & b', is_en=True)

    # KP-034: 一次函数图象的性质 (截距与平移 y=kx 与 y=kx+b)
    zh_034 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="120" x2="260" y2="120" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="90" y1="20" x2="90" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Base y = kx -->
    <line class="layer-stage-2" x1="40" y1="145" x2="210" y2="60" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-2" x="215" y="70" font-size="11" fill="#64748b">y = kx</text>
    <!-- Shifted y = kx + b -->
    <line class="layer-stage-3 formal-labels" x1="40" y1="105" x2="210" y2="20" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="215" y="30" font-size="12" font-weight="bold" fill="#2563eb">y = kx + b</text>
    <!-- Intercept (0, b) -->
    <circle class="layer-stage-3 formal-labels" cx="90" cy="80" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="98" y="85" font-size="11" font-weight="bold" fill="#dc2626">(0, b) 截距</text>
    <!-- Shift arrow -->
    <path class="layer-stage-4" d="M90,120 L90,85" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-4" points="90,80 86,88 94,88" fill="#16a34a"/>
    <text class="layer-stage-4" x="65" y="105" font-size="11" font-weight="bold" fill="#15803d">向上平移 b</text>
  </g>"""
    en_034 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="120" x2="260" y2="120" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="90" y1="20" x2="90" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="40" y1="145" x2="210" y2="60" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-2" x="215" y="70" font-size="10" fill="#64748b">y = kx</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="105" x2="210" y2="20" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="215" y="30" font-size="11" font-weight="bold" fill="#2563eb">y = kx + b</text>
    <circle class="layer-stage-3 formal-labels" cx="90" cy="80" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="98" y="85" font-size="10" font-weight="bold" fill="#dc2626">(0, b) Intercept</text>
    <path class="layer-stage-4" d="M90,120 L90,85" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-4" points="90,80 86,88 94,88" fill="#16a34a"/>
    <text class="layer-stage-4" x="65" y="105" font-size="10" font-weight="bold" fill="#15803d">Shift Up by b</text>
  </g>"""
    results['KP-034-zh.svg'] = build_svg_document('KP-034', '函数', '一次函数图象的性质', zh_034, '直线 y=kx+b 与 y 轴交于 (0, b)，可由 y=kx 平移 |b| 单位得到')
    results['KP-034-en.svg'] = build_svg_document('KP-034', 'Functions', 'Properties of Linear Graphs', en_034, 'Graph of y=kx+b crosses y-axis at (0, b), shifted vertically by |b|', is_en=True)

    # KP-035: 一次函数与方程不等式关系 (高位图象与解集区间 kx+b > 0)
    zh_035 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="95" x2="260" y2="95" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="70" y1="20" x2="70" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Line y = kx + b -->
    <line class="layer-stage-2" x1="40" y1="140" x2="230" y2="45" stroke="#2563eb" stroke-width="2.5"/>
    <!-- Intersection with x-axis (x0, 0) -->
    <circle class="layer-stage-3 formal-labels" cx="130" cy="95" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="130" y="115" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">x₀ (方程 kx+b=0 的根)</text>
    <!-- Region y > 0 highlighted -->
    <polygon class="layer-stage-4" points="130,95 230,45 230,95" fill="#dcfce7" opacity="0.6"/>
    <text class="layer-stage-4" x="190" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">kx+b &gt; 0 (x &gt; x₀)</text>
  </g>"""
    en_035 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="95" x2="260" y2="95" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="70" y1="20" x2="70" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="40" y1="140" x2="230" y2="45" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="130" cy="95" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="130" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">x₀ (Root kx+b=0)</text>
    <polygon class="layer-stage-4" points="130,95 230,45 230,95" fill="#dcfce7" opacity="0.6"/>
    <text class="layer-stage-4" x="190" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">kx+b &gt; 0 (x &gt; x₀)</text>
  </g>"""
    results['KP-035-zh.svg'] = build_svg_document('KP-035', '函数', '一次函数与方程不等式关系', zh_035, '一次函数与 x 轴交点横坐标是方程的解，轴上方图象对应不等式解集')
    results['KP-035-en.svg'] = build_svg_document('KP-035', 'Functions', 'Linear Functions & Inequalities', en_035, 'X-intercept gives equation root; portion above axis gives inequality solution', is_en=True)

    # KP-036: 反比例函数的图象与性质 (双曲线)
    zh_036 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="90" x2="285" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="150" y1="15" x2="150" y2="165" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="280" y="85" font-size="11" fill="#64748b">x</text>
    <text class="layer-stage-1" x="155" y="25" font-size="11" fill="#64748b">y</text>
    <text class="layer-stage-1" x="140" y="105" font-size="11" fill="#64748b">O</text>
    <path class="layer-stage-2" d="M165,30 Q175,70 270,78" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <path class="layer-stage-2" d="M30,102 Q125,110 135,150" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="195" cy="55" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="205" y="50" font-size="11" font-weight="bold" fill="#dc2626">P(x, y)</text>
    <line class="layer-stage-4" x1="195" y1="55" x2="105" y2="125" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle class="layer-stage-4" cx="105" cy="125" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-4" x="90" y="140" font-size="10" font-weight="bold" fill="#047857">关于原点中心对称</text>
  </g>"""
    en_036 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="90" x2="285" y2="90" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="150" y1="15" x2="150" y2="165" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="280" y="85" font-size="11" fill="#64748b">x</text>
    <text class="layer-stage-1" x="155" y="25" font-size="11" fill="#64748b">y</text>
    <text class="layer-stage-1" x="140" y="105" font-size="11" fill="#64748b">O</text>
    <path class="layer-stage-2" d="M165,30 Q175,70 270,78" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <path class="layer-stage-2" d="M30,102 Q125,110 135,150" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="195" cy="55" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="205" y="50" font-size="11" font-weight="bold" fill="#dc2626">P(x, y)</text>
    <line class="layer-stage-4" x1="195" y1="55" x2="105" y2="125" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle class="layer-stage-4" cx="105" cy="125" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-4" x="90" y="140" font-size="10" font-weight="bold" fill="#047857">Centrally Symmetric</text>
  </g>"""
    results['KP-036-zh.svg'] = build_svg_document('KP-036', '函数', '反比例函数的图象与性质', zh_036, '反比例函数 y = k/x (k≠0) 双曲线图象关于原点中心对称')
    results['KP-036-en.svg'] = build_svg_document('KP-036', 'Functions', 'Inverse Proportional Functions', en_036, 'Hyperbola y = k/x is centrally symmetric about origin', is_en=True)

    # KP-037: 反比例函数 k 的几何意义 (矩形面积 S = |k|)
    zh_037 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="140" x2="285" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="40" y1="15" x2="40" y2="165" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="280" y="135" font-size="11" fill="#64748b">x</text>
    <text class="layer-stage-1" x="45" y="25" font-size="11" fill="#64748b">y</text>
    <text class="layer-stage-1" x="28" y="152" font-size="11" fill="#64748b">O</text>
    <path class="layer-stage-2" d="M60,35 Q75,105 250,118" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <rect class="layer-stage-3 formal-labels" x="40" y="70" width="130" height="70" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="105" y="110" text-anchor="middle" font-size="14" font-weight="bold" fill="#b45309">S = |k|</text>
    <circle class="layer-stage-4" cx="170" cy="70" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="180" y="65" font-size="12" font-weight="bold" fill="#dc2626">P(x, y)</text>
    <line class="layer-stage-4" x1="170" y1="70" x2="170" y2="140" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-4" x1="170" y1="70" x2="40" y2="70" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
  </g>"""
    en_037 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="140" x2="285" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="40" y1="15" x2="40" y2="165" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="280" y="135" font-size="11" fill="#64748b">x</text>
    <text class="layer-stage-1" x="45" y="25" font-size="11" fill="#64748b">y</text>
    <text class="layer-stage-1" x="28" y="152" font-size="11" fill="#64748b">O</text>
    <path class="layer-stage-2" d="M60,35 Q75,105 250,118" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <rect class="layer-stage-3 formal-labels" x="40" y="70" width="130" height="70" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="105" y="110" text-anchor="middle" font-size="14" font-weight="bold" fill="#b45309">S = |k|</text>
    <circle class="layer-stage-4" cx="170" cy="70" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="180" y="65" font-size="12" font-weight="bold" fill="#dc2626">P(x, y)</text>
    <line class="layer-stage-4" x1="170" y1="70" x2="170" y2="140" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-4" x1="170" y1="70" x2="40" y2="70" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
  </g>"""
    results['KP-037-zh.svg'] = build_svg_document('KP-037', '函数', '反比例函数k的几何意义', zh_037, '曲线上任意点引两坐标轴垂线形成的矩形面积 S = |xy| = |k|')
    results['KP-037-en.svg'] = build_svg_document('KP-037', 'Functions', 'Geometric Meaning of k', en_037, 'Invariant rectangle area from curve point to axes: S = |k|', is_en=True)

    # KP-038: 二次函数的三种表达式 (一般式/顶点式/交点式三式卡片)
    zh_038 = """  <g transform="translate(40, 70)">
    <rect class="layer-stage-1" x="15" y="15" width="280" height="35" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text class="layer-stage-1" x="25" y="38" font-size="12" font-weight="bold" fill="#1d4ed8">一般式:</text>
    <text class="layer-stage-1" x="90" y="38" font-size="12" fill="#1e40af">y = ax² + bx + c (a≠0)</text>
    <rect class="layer-stage-2" x="15" y="58" width="280" height="35" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="25" y="81" font-size="12" font-weight="bold" fill="#b45309">顶点式:</text>
    <text class="layer-stage-2" x="90" y="81" font-size="12" fill="#92400e">y = a(x - h)² + k (顶点 (h, k))</text>
    <rect class="layer-stage-3 formal-labels" x="15" y="101" width="280" height="35" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="25" y="124" font-size="12" font-weight="bold" fill="#15803d">交点式:</text>
    <text class="layer-stage-3 formal-labels" x="90" y="124" font-size="12" fill="#166534">y = a(x - x₁)(x - x₂) (交点 x₁, x₂)</text>
    <text class="layer-stage-4" x="155" y="155" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">根据已知题设特征灵活选取最简表达式</text>
  </g>"""
    en_038 = """  <g transform="translate(40, 70)">
    <rect class="layer-stage-1" x="15" y="15" width="280" height="35" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <text class="layer-stage-1" x="25" y="38" font-size="11" font-weight="bold" fill="#1d4ed8">Standard:</text>
    <text class="layer-stage-1" x="95" y="38" font-size="11" fill="#1e40af">y = ax² + bx + c (a≠0)</text>
    <rect class="layer-stage-2" x="15" y="58" width="280" height="35" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <text class="layer-stage-2" x="25" y="81" font-size="11" font-weight="bold" fill="#b45309">Vertex:</text>
    <text class="layer-stage-2" x="95" y="81" font-size="11" fill="#92400e">y = a(x - h)² + k, Vertex (h, k)</text>
    <rect class="layer-stage-3 formal-labels" x="15" y="101" width="280" height="35" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="25" y="124" font-size="11" font-weight="bold" fill="#15803d">Factored:</text>
    <text class="layer-stage-3 formal-labels" x="95" y="124" font-size="11" fill="#166534">y = a(x - x₁)(x - x₂), Roots x₁, x₂</text>
    <text class="layer-stage-4" x="155" y="155" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Choose appropriate form based on given conditions</text>
  </g>"""
    results['KP-038-zh.svg'] = build_svg_document('KP-038', '二次函数', '二次函数的三种表达式', zh_038, '二次函数三种形式：一般式、顶点式与交点式相互转化')
    results['KP-038-en.svg'] = build_svg_document('KP-038', 'Quadratic Functions', 'Three Forms of Quadratic Functions', en_038, 'Standard form, vertex form and factored form transformations', is_en=True)

    # KP-039: 二次函数的对称轴与顶点 (抛物线垂直对称轴与顶点 V(h, k))
    zh_039 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="130" x2="285" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="60" y1="15" x2="60" y2="160" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Parabola opening up -->
    <path class="layer-stage-2" d="M70,30 Q150,180 230,30" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <!-- Axis of symmetry line -->
    <line class="layer-stage-3 formal-labels" x1="150" y1="15" x2="150" y2="155" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="150" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">对称轴 x = -b/(2a)</text>
    <!-- Vertex V(h, k) -->
    <circle class="layer-stage-4" cx="150" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="150" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">顶点 (h, k)</text>
  </g>"""
    en_039 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="130" x2="285" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="60" y1="15" x2="60" y2="160" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M70,30 Q150,180 230,30" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <line class="layer-stage-3 formal-labels" x1="150" y1="15" x2="150" y2="155" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="150" y="165" text-anchor="middle" font-size="10" font-weight="bold" fill="#ea580c">Symmetry Axis x = -b/(2a)</text>
    <circle class="layer-stage-4" cx="150" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="150" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Vertex (h, k)</text>
  </g>"""
    results['KP-039-zh.svg'] = build_svg_document('KP-039', '二次函数', '二次函数的对称轴与顶点', zh_039, '抛物线对称轴为 x = -b/(2a)，顶点坐标为 (-b/(2a), (4ac-b²)/(4a))')
    results['KP-039-en.svg'] = build_svg_document('KP-039', 'Quadratic Functions', 'Axis of Symmetry and Vertex', en_039, 'Symmetry axis x = -b/(2a), vertex coordinates (h, k)', is_en=True)

    # KP-040: 二次函数与x轴的交点 (截弦长 |x1 - x2| = √Δ / |a|)
    zh_040 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="105" x2="285" y2="105" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Parabola cutting x-axis -->
    <path class="layer-stage-2" d="M50,25 Q150,175 250,25" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <!-- Intersections A and B -->
    <circle class="layer-stage-3 formal-labels" cx="85" cy="105" r="5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="215" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="85" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">A(x₁, 0)</text>
    <text class="layer-stage-3 formal-labels" x="215" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">B(x₂, 0)</text>
    <!-- Chord length dimension -->
    <line class="layer-stage-4" x1="85" y1="90" x2="215" y2="90" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-4" points="85,90 92,86 92,94" fill="#16a34a"/>
    <polygon class="layer-stage-4" points="215,90 208,86 208,94" fill="#16a34a"/>
    <text class="layer-stage-4" x="150" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">弦长 AB = √Δ / |a|</text>
  </g>"""
    en_040 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="105" x2="285" y2="105" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M50,25 Q150,175 250,25" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="85" cy="105" r="5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="215" cy="105" r="5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="85" y="125" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">A(x₁, 0)</text>
    <text class="layer-stage-3 formal-labels" x="215" y="125" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">B(x₂, 0)</text>
    <line class="layer-stage-4" x1="85" y1="90" x2="215" y2="90" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-4" points="85,90 92,86 92,94" fill="#16a34a"/>
    <polygon class="layer-stage-4" points="215,90 208,86 208,94" fill="#16a34a"/>
    <text class="layer-stage-4" x="150" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Chord Length AB = √Δ / |a|</text>
  </g>"""
    results['KP-040-zh.svg'] = build_svg_document('KP-040', '二次函数', '二次函数与x轴的交点', zh_040, '二次函数与 x 轴两交点距离为弦长公式: |x₁ - x₂| = √Δ / |a|')
    results['KP-040-en.svg'] = build_svg_document('KP-040', 'Quadratic Functions', 'Intersections with x-axis', en_040, 'Distance between x-intercepts given by chord formula: √Δ / |a|', is_en=True)

    # KP-041: 二次函数的最值问题 (闭区间 [m, n] 动轴定区间极值对比)
    zh_041 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="130" x2="285" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Closed interval [m, n] boundary lines -->
    <line class="layer-stage-1" x1="80" y1="20" x2="80" y2="130" stroke="#64748b" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-1" x1="210" y1="20" x2="210" y2="130" stroke="#64748b" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-1" x="80" y="145" text-anchor="middle" font-size="11" fill="#64748b">m</text>
    <text class="layer-stage-1" x="210" y="145" text-anchor="middle" font-size="11" fill="#64748b">n</text>
    <!-- Truncated Parabola on [m, n] -->
    <path class="layer-stage-2" d="M80,50 Q130,135 210,40" fill="none" stroke="#2563eb" stroke-width="3"/>
    <!-- Vertex Minimum -->
    <circle class="layer-stage-3 formal-labels" cx="135" cy="98" r="5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="135" y="115" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a">最小值 y_min (顶点)</text>
    <!-- Boundary Maximum -->
    <circle class="layer-stage-4" cx="210" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="210" y="30" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">最大值 y_max (端点)</text>
  </g>"""
    en_041 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="130" x2="285" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="80" y1="20" x2="80" y2="130" stroke="#64748b" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-1" x1="210" y1="20" x2="210" y2="130" stroke="#64748b" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-1" x="80" y="145" text-anchor="middle" font-size="10" fill="#64748b">m</text>
    <text class="layer-stage-1" x="210" y="145" text-anchor="middle" font-size="10" fill="#64748b">n</text>
    <path class="layer-stage-2" d="M80,50 Q130,135 210,40" fill="none" stroke="#2563eb" stroke-width="3"/>
    <circle class="layer-stage-3 formal-labels" cx="135" cy="98" r="5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="135" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#16a34a">Min (Vertex)</text>
    <circle class="layer-stage-4" cx="210" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="210" y="30" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">Max (Endpoint)</text>
  </g>"""
    results['KP-041-zh.svg'] = build_svg_document('KP-041', '二次函数', '二次函数的最值问题', zh_041, '闭区间最值结合对称轴位置分类讨论：顶点极值与端点值对比')
    results['KP-041-en.svg'] = build_svg_document('KP-041', 'Quadratic Functions', 'Extremum Values of Quadratics', en_041, 'Extremum in closed interval depends on whether axis falls within bounds', is_en=True)

    # KP-042: 二次函数与方程不等式关系 (抛物线在x轴上方区域 ax^2+bx+c > 0)
    zh_042 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="100" x2="285" y2="100" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M45,20 Q150,170 255,20" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <!-- Intersection roots -->
    <circle class="layer-stage-2" cx="80" cy="100" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-2" cx="220" cy="100" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-2" x="80" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">x₁</text>
    <text class="layer-stage-2" x="220" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">x₂</text>
    <!-- Shaded wings y > 0 -->
    <path class="layer-stage-3 formal-labels" d="M45,20 Q65,65 80,100 L45,100 Z" fill="#dcfce7" opacity="0.6"/>
    <path class="layer-stage-3 formal-labels" d="M220,100 Q235,65 255,20 L255,100 Z" fill="#dcfce7" opacity="0.6"/>
    <text class="layer-stage-4" x="150" y="45" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">ax² + bx + c &gt; 0 解集: x &lt; x₁ 或 x &gt; x₂</text>
  </g>"""
    en_042 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="15" y1="100" x2="285" y2="100" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M45,20 Q150,170 255,20" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-2" cx="80" cy="100" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-2" cx="220" cy="100" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-2" x="80" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">x₁</text>
    <text class="layer-stage-2" x="220" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">x₂</text>
    <path class="layer-stage-3 formal-labels" d="M45,20 Q65,65 80,100 L45,100 Z" fill="#dcfce7" opacity="0.6"/>
    <path class="layer-stage-3 formal-labels" d="M220,100 Q235,65 255,20 L255,100 Z" fill="#dcfce7" opacity="0.6"/>
    <text class="layer-stage-4" x="150" y="45" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">ax² + bx + c &gt; 0: x &lt; x₁ or x &gt; x₂</text>
  </g>"""
    results['KP-042-zh.svg'] = build_svg_document('KP-042', '二次函数', '二次函数与方程不等式关系', zh_042, '抛物线在 x 轴上方的部分对应二次不等式大于零的解集')
    results['KP-042-en.svg'] = build_svg_document('KP-042', 'Quadratic Functions', 'Quadratics & Inequalities', en_042, 'Portion of parabola above x-axis corresponds to solution of ax²+bx+c>0', is_en=True)

    # KP-043: 函数的实际应用与建模 (抛物线拱桥模型)
    zh_043 = """  <g transform="translate(45, 68)">
    <!-- Water surface / x-axis -->
    <line class="layer-stage-1" x1="20" y1="130" x2="280" y2="130" stroke="#0284c7" stroke-width="2"/>
    <text class="layer-stage-1" x="280" y="145" font-size="11" fill="#0284c7">水面 (x轴)</text>
    <!-- Bridge Arch -->
    <path class="layer-stage-2" d="M50,130 Q150,20 250,130" fill="none" stroke="#475569" stroke-width="3"/>
    <!-- Arch height h -->
    <line class="layer-stage-3 formal-labels" x1="150" y1="130" x2="150" y2="48" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="158" y="90" font-size="11" font-weight="bold" fill="#dc2626">拱高 h</text>
    <!-- Span L -->
    <line class="layer-stage-4" x1="50" y1="140" x2="250" y2="140" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="150" y="155" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">跨径跨度 L</text>
  </g>"""
    en_043 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="130" x2="280" y2="130" stroke="#0284c7" stroke-width="2"/>
    <text class="layer-stage-1" x="280" y="145" font-size="10" fill="#0284c7">Water (x-axis)</text>
    <path class="layer-stage-2" d="M50,130 Q150,20 250,130" fill="none" stroke="#475569" stroke-width="3"/>
    <line class="layer-stage-3 formal-labels" x1="150" y1="130" x2="150" y2="48" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="158" y="90" font-size="10" font-weight="bold" fill="#dc2626">Height h</text>
    <line class="layer-stage-4" x1="50" y1="140" x2="250" y2="140" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-4" x="150" y="155" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Span L</text>
  </g>"""
    results['KP-043-zh.svg'] = build_svg_document('KP-043', '函数建模', '函数的实际应用与建模', zh_043, '建立直角坐标系将拱桥跨度与拱高转化为抛物线解析式求解')
    results['KP-043-en.svg'] = build_svg_document('KP-043', 'Modeling', 'Function Modeling & Applications', en_043, 'Formulating coordinate system to translate real arch into quadratic model', is_en=True)

    return results
