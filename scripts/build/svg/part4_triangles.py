"""
分片 4: KP-044 ~ KP-060 (线角与三角形)
17 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part4():
    results = {}

    # KP-044: 点线面角的基本概念 (四大基本图元四宫格)
    zh_044 = """  <g transform="translate(45, 68)">
    <!-- Point -->
    <rect class="layer-stage-1" x="15" y="15" width="125" height="65" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="45" cy="45" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="70" y="50" font-size="12" font-weight="bold" fill="#1e40af">点 A</text>
    <!-- Line / Ray -->
    <rect class="layer-stage-2" x="150" y="15" width="125" height="65" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="165" y1="45" x2="255" y2="45" stroke="#d97706" stroke-width="2"/>
    <circle class="layer-stage-2" cx="175" cy="45" r="3" fill="#d97706"/>
    <polygon class="layer-stage-2" points="260,45 252,41 252,49" fill="#d97706"/>
    <text class="layer-stage-2" x="210" y="38" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">射线 OP</text>
    <!-- Plane Intersection -->
    <rect class="layer-stage-3 formal-labels" x="15" y="90" width="125" height="65" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
    <polygon class="layer-stage-3 formal-labels" points="30,135 70,105 125,105 85,135" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="75" y="148" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">空间平面</text>
    <!-- Angle -->
    <rect class="layer-stage-4" x="150" y="90" width="125" height="65" rx="8" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
    <path class="layer-stage-4" d="M170,140 L210,140 L250,110" fill="none" stroke="#db2777" stroke-width="2"/>
    <path class="layer-stage-4" d="M225,140 A15,15 0 0,0 220,132" fill="none" stroke="#db2777" stroke-width="1.5"/>
    <text class="layer-stage-4" x="210" y="125" font-size="11" font-weight="bold" fill="#be185d">角 ∠AOB</text>
  </g>"""
    en_044 = """  <g transform="translate(45, 68)">
    <rect class="layer-stage-1" x="15" y="15" width="125" height="65" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <circle class="layer-stage-1" cx="45" cy="45" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="70" y="50" font-size="11" font-weight="bold" fill="#1e40af">Point A</text>
    <rect class="layer-stage-2" x="150" y="15" width="125" height="65" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="165" y1="45" x2="255" y2="45" stroke="#d97706" stroke-width="2"/>
    <circle class="layer-stage-2" cx="175" cy="45" r="3" fill="#d97706"/>
    <polygon class="layer-stage-2" points="260,45 252,41 252,49" fill="#d97706"/>
    <text class="layer-stage-2" x="210" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="#b45309">Ray OP</text>
    <rect class="layer-stage-3 formal-labels" x="15" y="90" width="125" height="65" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
    <polygon class="layer-stage-3 formal-labels" points="30,135 70,105 125,105 85,135" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="75" y="148" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Plane</text>
    <rect class="layer-stage-4" x="150" y="90" width="125" height="65" rx="8" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5"/>
    <path class="layer-stage-4" d="M170,140 L210,140 L250,110" fill="none" stroke="#db2777" stroke-width="2"/>
    <path class="layer-stage-4" d="M225,140 A15,15 0 0,0 220,132" fill="none" stroke="#db2777" stroke-width="1.5"/>
    <text class="layer-stage-4" x="210" y="125" font-size="10" font-weight="bold" fill="#be185d">Angle ∠AOB</text>
  </g>"""
    results['KP-044-zh.svg'] = build_svg_document('KP-044', '几何基础', '点线面角的基本概念', zh_044, '几何基本图元：点动成线，线动成面，射线旋转形成角')
    results['KP-044-en.svg'] = build_svg_document('KP-044', 'Foundations', 'Points, Lines, Planes, Angles', en_044, 'Geometric primitives: points trace lines, lines generate planes', is_en=True)

    # KP-045: 线段射线直线的关系 (两点之间线段最短)
    zh_045 = """  <g transform="translate(45, 75)">
    <!-- Point A and B -->
    <circle class="layer-stage-1" cx="40" cy="75" r="5" fill="#2563eb"/>
    <circle class="layer-stage-1" cx="240" cy="75" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="35" y="98" font-size="13" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-1" x="245" y="98" font-size="13" font-weight="bold" fill="#1e40af">B</text>
    <!-- Curved detour path -->
    <path class="layer-stage-2" d="M40,75 Q140,10 240,75" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-2" x="140" y="35" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">折线弯曲路径</text>
    <!-- Straight segment -->
    <line class="layer-stage-3 formal-labels" x1="40" y1="75" x2="240" y2="75" stroke="#16a34a" stroke-width="3"/>
    <text class="layer-stage-4" x="140" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">线段 AB (两点间直线距离)</text>
    <text class="layer-stage-4" x="140" y="125" text-anchor="middle" font-size="12" font-weight="bold" fill="#1d4ed8">公理: 两点之间，线段最短</text>
  </g>"""
    en_045 = """  <g transform="translate(45, 75)">
    <circle class="layer-stage-1" cx="40" cy="75" r="5" fill="#2563eb"/>
    <circle class="layer-stage-1" cx="240" cy="75" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="35" y="98" font-size="12" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-1" x="245" y="98" font-size="12" font-weight="bold" fill="#1e40af">B</text>
    <path class="layer-stage-2" d="M40,75 Q140,10 240,75" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-2" x="140" y="35" text-anchor="middle" font-size="10" font-weight="bold" fill="#ea580c">Curved Path</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="75" x2="240" y2="75" stroke="#16a34a" stroke-width="3"/>
    <text class="layer-stage-4" x="140" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Segment AB (Shortest)</text>
    <text class="layer-stage-4" x="140" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8">Axiom: Shortest path between two points is straight segment</text>
  </g>"""
    results['KP-045-zh.svg'] = build_svg_document('KP-045', '几何基础', '线段射线直线的关系', zh_045, '公理：两点之间线段最短；连结两点的线段的长度叫做两点间的距离')
    results['KP-045-en.svg'] = build_svg_document('KP-045', 'Foundations', 'Segments, Rays and Lines', en_045, 'Shortest distance between two points is the straight line segment', is_en=True)

    # KP-046: 角的分类与计算 (对顶角相等与余角补角)
    zh_046 = """  <g transform="translate(50, 70)">
    <!-- Intersecting lines AB and CD forming vertical angles -->
    <line class="layer-stage-1" x1="30" y1="30" x2="230" y2="130" stroke="#475569" stroke-width="2"/>
    <line class="layer-stage-1" x1="30" y1="130" x2="230" y2="30" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="130" cy="80" r="4" fill="#1e293b"/>
    <!-- Vertical angles arcs -->
    <path class="layer-stage-2" d="M110,70 A25,25 0 0,1 110,90" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="90" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">∠1</text>
    <path class="layer-stage-2" d="M150,70 A25,25 0 0,0 150,90" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="170" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">∠2</text>
    <!-- Supplementary angle arc -->
    <path class="layer-stage-3 formal-labels" d="M120,65 A20,20 0 0,1 140,65" fill="none" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="130" y="55" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">∠3</text>
    <text class="layer-stage-4" x="130" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">对顶角相等: ∠1 = ∠2; 互补: ∠1 + ∠3 = 180°</text>
  </g>"""
    en_046 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="30" y1="30" x2="230" y2="130" stroke="#475569" stroke-width="2"/>
    <line class="layer-stage-1" x1="30" y1="130" x2="230" y2="30" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="130" cy="80" r="4" fill="#1e293b"/>
    <path class="layer-stage-2" d="M110,70 A25,25 0 0,1 110,90" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="90" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">∠1</text>
    <path class="layer-stage-2" d="M150,70 A25,25 0 0,0 150,90" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="170" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">∠2</text>
    <path class="layer-stage-3 formal-labels" d="M120,65 A20,20 0 0,1 140,65" fill="none" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="130" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">∠3</text>
    <text class="layer-stage-4" x="130" y="150" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Vertical: ∠1 = ∠2; Supplementary: ∠1 + ∠3 = 180°</text>
  </g>"""
    results['KP-046-zh.svg'] = build_svg_document('KP-046', '几何基础', '角的分类与计算', zh_046, '对顶角相等；同角或等角的余角相等，补角相等')
    results['KP-046-en.svg'] = build_svg_document('KP-046', 'Foundations', 'Angle Classification & Calculation', en_046, 'Vertical angles are equal; supplementary angles sum to 180 degrees', is_en=True)

    # KP-047: 相交线与垂线 (垂线段最短原理 PH < PA)
    zh_047 = """  <g transform="translate(50, 70)">
    <!-- Line l -->
    <line class="layer-stage-1" x1="20" y1="120" x2="260" y2="120" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-1" x="265" y="125" font-size="12" fill="#475569">l</text>
    <!-- Point P -->
    <circle class="layer-stage-1" cx="120" cy="30" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="120" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">P</text>
    <!-- Perpendicular segment PH -->
    <line class="layer-stage-2" x1="120" y1="30" x2="120" y2="120" stroke="#16a34a" stroke-width="2.5"/>
    <rect class="layer-stage-2" x="120" y="108" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-2" x="120" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">垂足 H</text>
    <!-- Oblique segment PA -->
    <line class="layer-stage-3 formal-labels" x1="120" y1="30" x2="200" y2="120" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle class="layer-stage-3 formal-labels" cx="200" cy="120" r="4" fill="#ea580c"/>
    <text class="layer-stage-3 formal-labels" x="200" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">斜足 A</text>
    <text class="layer-stage-4" x="140" y="75" font-size="12" font-weight="bold" fill="#15803d">垂线段最短: PH &lt; PA</text>
  </g>"""
    en_047 = """  <g transform="translate(50, 70)">
    <line class="layer-stage-1" x1="20" y1="120" x2="260" y2="120" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-1" x="265" y="125" font-size="11" fill="#475569">l</text>
    <circle class="layer-stage-1" cx="120" cy="30" r="5" fill="#2563eb"/>
    <text class="layer-stage-1" x="120" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">P</text>
    <line class="layer-stage-2" x1="120" y1="30" x2="120" y2="120" stroke="#16a34a" stroke-width="2.5"/>
    <rect class="layer-stage-2" x="120" y="108" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-2" x="120" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Foot H</text>
    <line class="layer-stage-3 formal-labels" x1="120" y1="30" x2="200" y2="120" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle class="layer-stage-3 formal-labels" cx="200" cy="120" r="4" fill="#ea580c"/>
    <text class="layer-stage-3 formal-labels" x="200" y="140" text-anchor="middle" font-size="10" font-weight="bold" fill="#ea580c">Point A</text>
    <text class="layer-stage-4" x="140" y="75" font-size="11" font-weight="bold" fill="#15803d">Perpendicular Shortest: PH &lt; PA</text>
  </g>"""
    results['KP-047-zh.svg'] = build_svg_document('KP-047', '几何基础', '相交线与垂线', zh_047, '垂线性质：连结直线外一点与直线上各点的所有线段中，垂线段最短')
    results['KP-047-en.svg'] = build_svg_document('KP-047', 'Foundations', 'Intersecting & Perpendicular Lines', en_047, 'Perpendicular segment from a point to a line is the shortest', is_en=True)

    # KP-048: 平行线的判定与性质 (三线八角 同位角/内错角)
    zh_048 = """  <g transform="translate(45, 68)">
    <!-- Parallel lines l1 and l2 -->
    <line class="layer-stage-1" x1="20" y1="50" x2="260" y2="50" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="265" y="55" font-size="11" font-weight="bold" fill="#2563eb">l₁</text>
    <line class="layer-stage-1" x1="20" y1="120" x2="260" y2="120" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="265" y="125" font-size="11" font-weight="bold" fill="#2563eb">l₂</text>
    <!-- Transversal line l3 -->
    <line class="layer-stage-2" x1="70" y1="20" x2="190" y2="150" stroke="#475569" stroke-width="2"/>
    <!-- Corresponding angle 1 -->
    <path class="layer-stage-3 formal-labels" d="M110,50 A15,15 0 0,0 102,38" fill="none" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="115" y="42" font-size="11" font-weight="bold" fill="#ea580c">∠1</text>
    <!-- Alternate interior angle 2 -->
    <path class="layer-stage-3 formal-labels" d="M152,120 A15,15 0 0,1 160,132" fill="none" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="145" y="138" font-size="11" font-weight="bold" fill="#ea580c">∠2</text>
    <text class="layer-stage-4" x="140" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">l₁ ∥ l₂ ⇔ 同位角相等 / 内错角相等</text>
  </g>"""
    en_048 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="50" x2="260" y2="50" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="265" y="55" font-size="10" font-weight="bold" fill="#2563eb">l₁</text>
    <line class="layer-stage-1" x1="20" y1="120" x2="260" y2="120" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="265" y="125" font-size="10" font-weight="bold" fill="#2563eb">l₂</text>
    <line class="layer-stage-2" x1="70" y1="20" x2="190" y2="150" stroke="#475569" stroke-width="2"/>
    <path class="layer-stage-3 formal-labels" d="M110,50 A15,15 0 0,0 102,38" fill="none" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="115" y="42" font-size="10" font-weight="bold" fill="#ea580c">∠1</text>
    <path class="layer-stage-3 formal-labels" d="M152,120 A15,15 0 0,1 160,132" fill="none" stroke="#ea580c" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="145" y="138" font-size="10" font-weight="bold" fill="#ea580c">∠2</text>
    <text class="layer-stage-4" x="140" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">l₁ ∥ l₂ ⇔ Corresponding / Alternate Angles Equal</text>
  </g>"""
    results['KP-048-zh.svg'] = build_svg_document('KP-048', '几何基础', '平行线的判定与性质', zh_048, '两条平行线被第三条直线所截，同位角相等，内错角相等')
    results['KP-048-en.svg'] = build_svg_document('KP-048', 'Foundations', 'Parallel Lines Criteria & Properties', en_048, 'Parallel lines cut by transversal: alternate & corresponding angles equal', is_en=True)

    # KP-049: 三角形的基本性质 (内角和 180° 平行辅助线证明)
    zh_049 = """  <g transform="translate(50, 68)">
    <!-- Triangle ABC: A(130, 45), B(40, 140), C(220, 140) -->
    <polygon class="layer-stage-1" points="130,45 40,140 220,140" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <!-- Auxiliary line through A parallel to BC -->
    <line class="layer-stage-2" x1="20" y1="45" x2="240" y2="45" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-2" x="245" y="48" font-size="10" fill="#ea580c">l ∥ BC</text>
    <!-- Angles at vertex A -->
    <text class="layer-stage-3 formal-labels" x="90" y="40" font-size="11" font-weight="bold" fill="#dc2626">∠B</text>
    <text class="layer-stage-3 formal-labels" x="130" y="65" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">∠A</text>
    <text class="layer-stage-3 formal-labels" x="170" y="40" font-size="11" font-weight="bold" fill="#16a34a">∠C</text>
    <text class="layer-stage-4" x="130" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">内角和定理: ∠A + ∠B + ∠C = 180°</text>
  </g>"""
    en_049 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="130,45 40,140 220,140" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <line class="layer-stage-2" x1="20" y1="45" x2="240" y2="45" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-2" x="245" y="48" font-size="10" fill="#ea580c">l ∥ BC</text>
    <text class="layer-stage-3 formal-labels" x="90" y="40" font-size="10" font-weight="bold" fill="#dc2626">∠B</text>
    <text class="layer-stage-3 formal-labels" x="130" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">∠A</text>
    <text class="layer-stage-3 formal-labels" x="170" y="40" font-size="10" font-weight="bold" fill="#16a34a">∠C</text>
    <text class="layer-stage-4" x="130" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Angle Sum Theorem: ∠A + ∠B + ∠C = 180°</text>
  </g>"""
    results['KP-049-zh.svg'] = build_svg_document('KP-049', '三角形', '三角形的基本性质', zh_049, '三角形三个内角和等于 180°；三角形的外角等于与它不相邻两内角和')
    results['KP-049-en.svg'] = build_svg_document('KP-049', 'Triangles', 'Triangle Properties', en_049, 'Interior angles sum to 180 degrees; exterior angle equals two non-adjacent interiors', is_en=True)

    # KP-050: 三角形的三边关系 (两边之和大于第三边)
    zh_050 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="120,30 30,130 230,130" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-2" x="65" y="75" font-size="13" font-weight="bold" fill="#15803d">边 a</text>
    <text class="layer-stage-2" x="180" y="75" font-size="13" font-weight="bold" fill="#15803d">边 b</text>
    <text class="layer-stage-3 formal-labels" x="130" y="148" text-anchor="middle" font-size="13" font-weight="bold" fill="#2563eb">边 c (底边)</text>
    <text class="layer-stage-4" x="130" y="100" text-anchor="middle" font-size="13" font-weight="bold" fill="#dc2626">a + b &gt; c 且 |a - b| &lt; c</text>
  </g>"""
    en_050 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="120,30 30,130 230,130" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-2" x="65" y="75" font-size="12" font-weight="bold" fill="#15803d">Side a</text>
    <text class="layer-stage-2" x="180" y="75" font-size="12" font-weight="bold" fill="#15803d">Side b</text>
    <text class="layer-stage-3 formal-labels" x="130" y="148" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">Side c</text>
    <text class="layer-stage-4" x="130" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">a + b &gt; c and |a - b| &lt; c</text>
  </g>"""
    results['KP-050-zh.svg'] = build_svg_document('KP-050', '三角形', '三角形的三边关系', zh_050, '三角形任意两边之和大于第三边，任意两边之差小于第三边')
    results['KP-050-en.svg'] = build_svg_document('KP-050', 'Triangles', 'Triangle Inequality Theorem', en_050, 'Sum of any two sides is greater than the third; difference is less', is_en=True)

    # KP-051: 全等三角形的判定 (SSS / SAS 对应标记)
    zh_051 = """  <g transform="translate(35, 68)">
    <!-- Triangle 1 -->
    <polygon class="layer-stage-1" points="80,25 20,130 130,130" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="80" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">△ABC</text>
    <!-- Congruence symbol -->
    <text class="layer-stage-2" x="160" y="85" text-anchor="middle" font-size="20" font-weight="bold" fill="#047857">≌</text>
    <!-- Triangle 2 -->
    <polygon class="layer-stage-3 formal-labels" points="240,25 180,130 290,130" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="240" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">△A'B'C'</text>
    <!-- Congruence Criteria -->
    <text class="layer-stage-4" x="160" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">判定条件: SSS, SAS, ASA, AAS, HL</text>
  </g>"""
    en_051 = """  <g transform="translate(35, 68)">
    <polygon class="layer-stage-1" points="80,25 20,130 130,130" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="80" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">△ABC</text>
    <text class="layer-stage-2" x="160" y="85" text-anchor="middle" font-size="20" font-weight="bold" fill="#047857">≌</text>
    <polygon class="layer-stage-3 formal-labels" points="240,25 180,130 290,130" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="240" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">△A'B'C'</text>
    <text class="layer-stage-4" x="160" y="155" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Criteria: SSS, SAS, ASA, AAS, HL</text>
  </g>"""
    results['KP-051-zh.svg'] = build_svg_document('KP-051', '全等三角形', '全等三角形的判定', zh_051, '五大判定法：SSS、SAS、ASA、AAS、HL（直角三角形专有）')
    results['KP-051-en.svg'] = build_svg_document('KP-051', 'Congruence', 'Criteria for Congruent Triangles', en_051, 'Five Congruence Criteria: SSS, SAS, ASA, AAS, HL (Right Triangles)', is_en=True)

    # KP-052: 全等三角形的性质与应用 (对应线段高/中线相等)
    zh_052 = """  <g transform="translate(45, 68)">
    <polygon class="layer-stage-1" points="70,30 20,135 120,135" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <!-- Altitude h1 -->
    <line class="layer-stage-2" x1="70" y1="30" x2="70" y2="135" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-2" x="78" y="85" font-size="11" font-weight="bold" fill="#dc2626">h₁</text>
    <polygon class="layer-stage-3 formal-labels" points="210,30 160,135 260,135" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <!-- Altitude h2 -->
    <line class="layer-stage-3 formal-labels" x1="210" y1="30" x2="210" y2="135" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-3 formal-labels" x="218" y="85" font-size="11" font-weight="bold" fill="#dc2626">h₂</text>
    <text class="layer-stage-4" x="140" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">全等性质: 对应角、对应边、对应高 h₁ = h₂ 相等</text>
  </g>"""
    en_052 = """  <g transform="translate(45, 68)">
    <polygon class="layer-stage-1" points="70,30 20,135 120,135" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <line class="layer-stage-2" x1="70" y1="30" x2="70" y2="135" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-2" x="78" y="85" font-size="10" font-weight="bold" fill="#dc2626">h₁</text>
    <polygon class="layer-stage-3 formal-labels" points="210,30 160,135 260,135" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="210" y1="30" x2="210" y2="135" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-3 formal-labels" x="218" y="85" font-size="10" font-weight="bold" fill="#dc2626">h₂</text>
    <text class="layer-stage-4" x="140" y="155" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Congruence: Corresponding sides, angles and altitudes equal</text>
  </g>"""
    results['KP-052-zh.svg'] = build_svg_document('KP-052', '全等三角形', '全等三角形的性质与应用', zh_052, '全等三角形对应边相等、对应角相等、对应中线/高线/角平分线全息相等')
    results['KP-052-en.svg'] = build_svg_document('KP-052', 'Congruence', 'Properties of Congruent Triangles', en_052, 'Congruent triangles have equal corresponding angles, sides and altitudes', is_en=True)

    # KP-053: 等腰三角形的性质 (三线合一)
    zh_053 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="140,20 40,150 240,150" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <line class="layer-stage-2" x1="85" y1="80" x2="95" y2="90" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-2" x1="185" y1="90" x2="195" y2="80" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="140" y1="20" x2="140" y2="150" stroke="#dc2626" stroke-width="2" stroke-dasharray="3 3"/>
    <rect class="layer-stage-3 formal-labels" x="140" y="138" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="85" y1="146" x2="95" y2="154" stroke="#047857" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="185" y1="146" x2="195" y2="154" stroke="#047857" stroke-width="2"/>
    <text class="layer-stage-4" x="140" y="14" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-4" x="30" y="160" font-size="13" font-weight="bold" fill="#1e40af">B</text>
    <text class="layer-stage-4" x="250" y="160" font-size="13" font-weight="bold" fill="#1e40af">C</text>
    <text class="layer-stage-4" x="140" y="168" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">D</text>
    <text class="layer-stage-4" x="200" y="70" font-size="11" font-weight="bold" fill="#dc2626">三线合一 AD</text>
  </g>"""
    en_053 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="140,20 40,150 240,150" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <line class="layer-stage-2" x1="85" y1="80" x2="95" y2="90" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-2" x1="185" y1="90" x2="195" y2="80" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="140" y1="20" x2="140" y2="150" stroke="#dc2626" stroke-width="2" stroke-dasharray="3 3"/>
    <rect class="layer-stage-3 formal-labels" x="140" y="138" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="85" y1="146" x2="95" y2="154" stroke="#047857" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="185" y1="146" x2="195" y2="154" stroke="#047857" stroke-width="2"/>
    <text class="layer-stage-4" x="140" y="14" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-4" x="30" y="160" font-size="13" font-weight="bold" fill="#1e40af">B</text>
    <text class="layer-stage-4" x="250" y="160" font-size="13" font-weight="bold" fill="#1e40af">C</text>
    <text class="layer-stage-4" x="140" y="168" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">D</text>
    <text class="layer-stage-4" x="195" y="70" font-size="10" font-weight="bold" fill="#dc2626">Three-in-One AD</text>
  </g>"""
    results['KP-053-zh.svg'] = build_svg_document('KP-053', '三角形', '等腰三角形的性质', zh_053, '等腰三角形顶角平分线、中线、高线三线合一')
    results['KP-053-en.svg'] = build_svg_document('KP-053', 'Triangles', 'Isosceles Triangle Properties', en_053, 'Three-in-One: Angle Bisector, Median and Altitude to Base Coincide', is_en=True)

    # KP-054: 等腰三角形的判定 (等角对等边 ∠B=∠C ⇒ AB=AC)
    zh_054 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="130,25 35,145 225,145" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
    <!-- Equal angles arcs -->
    <path class="layer-stage-2" d="M60,145 A25,25 0 0,0 52,125" fill="none" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-2" x="70" y="135" font-size="12" font-weight="bold" fill="#dc2626">∠B</text>
    <path class="layer-stage-2" d="M200,145 A25,25 0 0,1 208,125" fill="none" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-2" x="190" y="135" font-size="12" font-weight="bold" fill="#dc2626">∠C</text>
    <!-- Equal sides arrows -->
    <text class="layer-stage-3 formal-labels" x="70" y="75" font-size="12" font-weight="bold" fill="#2563eb">AB</text>
    <text class="layer-stage-3 formal-labels" x="185" y="75" font-size="12" font-weight="bold" fill="#2563eb">AC</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">判定定理: 若 ∠B = ∠C，则 AB = AC</text>
  </g>"""
    en_054 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="130,25 35,145 225,145" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
    <path class="layer-stage-2" d="M60,145 A25,25 0 0,0 52,125" fill="none" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-2" x="70" y="135" font-size="11" font-weight="bold" fill="#dc2626">∠B</text>
    <path class="layer-stage-2" d="M200,145 A25,25 0 0,1 208,125" fill="none" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-2" x="190" y="135" font-size="11" font-weight="bold" fill="#dc2626">∠C</text>
    <text class="layer-stage-3 formal-labels" x="70" y="75" font-size="11" font-weight="bold" fill="#2563eb">AB</text>
    <text class="layer-stage-3 formal-labels" x="185" y="75" font-size="11" font-weight="bold" fill="#2563eb">AC</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Theorem: If ∠B = ∠C, then AB = AC</text>
  </g>"""
    results['KP-054-zh.svg'] = build_svg_document('KP-054', '三角形', '等腰三角形的判定', zh_054, '等角对等边：如果一个三角形有两个角相等，那么这两个角所对的边也相等')
    results['KP-054-en.svg'] = build_svg_document('KP-054', 'Triangles', 'Criteria for Isosceles Triangles', en_054, 'Equal angles subtend equal sides: ∠B = ∠C implies AB = AC', is_en=True)

    # KP-055: 等边三角形的性质与判定 (正三角形 60°)
    zh_055 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="140,20 53,170 227,170" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
    <circle class="layer-stage-2" cx="96" cy="95" r="3" fill="#ca8a04"/>
    <circle class="layer-stage-2" cx="184" cy="95" r="3" fill="#ca8a04"/>
    <circle class="layer-stage-2" cx="140" cy="170" r="3" fill="#ca8a04"/>
    <path class="layer-stage-3 formal-labels" d="M130,37 A20,20 0 0,0 150,37" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="140" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">60°</text>
    <path class="layer-stage-3 formal-labels" d="M73,170 A20,20 0 0,1 63,153" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="80" y="160" font-size="11" font-weight="bold" fill="#ea580c">60°</text>
    <path class="layer-stage-3 formal-labels" d="M207,170 A20,20 0 0,0 217,153" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="195" y="160" font-size="11" font-weight="bold" fill="#ea580c">60°</text>
    <line class="layer-stage-4" x1="140" y1="15" x2="140" y2="175" stroke="#9333ea" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-4" x="140" y="10" text-anchor="middle" font-size="13" font-weight="bold" fill="#713f12">A</text>
    <text class="layer-stage-4" x="42" y="180" font-size="13" font-weight="bold" fill="#713f12">B</text>
    <text class="layer-stage-4" x="235" y="180" font-size="13" font-weight="bold" fill="#713f12">C</text>
  </g>"""
    en_055 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="140,20 53,170 227,170" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
    <circle class="layer-stage-2" cx="96" cy="95" r="3" fill="#ca8a04"/>
    <circle class="layer-stage-2" cx="184" cy="95" r="3" fill="#ca8a04"/>
    <circle class="layer-stage-2" cx="140" cy="170" r="3" fill="#ca8a04"/>
    <path class="layer-stage-3 formal-labels" d="M130,37 A20,20 0 0,0 150,37" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="140" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">60°</text>
    <path class="layer-stage-3 formal-labels" d="M73,170 A20,20 0 0,1 63,153" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="80" y="160" font-size="11" font-weight="bold" fill="#ea580c">60°</text>
    <path class="layer-stage-3 formal-labels" d="M207,170 A20,20 0 0,0 217,153" fill="none" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="195" y="160" font-size="11" font-weight="bold" fill="#ea580c">60°</text>
    <line class="layer-stage-4" x1="140" y1="15" x2="140" y2="175" stroke="#9333ea" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-4" x="140" y="10" text-anchor="middle" font-size="13" font-weight="bold" fill="#713f12">A</text>
    <text class="layer-stage-4" x="42" y="180" font-size="13" font-weight="bold" fill="#713f12">B</text>
    <text class="layer-stage-4" x="235" y="180" font-size="13" font-weight="bold" fill="#713f12">C</text>
  </g>"""
    results['KP-055-zh.svg'] = build_svg_document('KP-055', '三角形', '等边三角形的性质与判定', zh_055, '等边三角形三边相等，三内角皆为 60°，具备 3 条对称轴')
    results['KP-055-en.svg'] = build_svg_document('KP-055', 'Triangles', 'Equilateral Triangle Properties', en_055, 'Equilateral Triangle: All sides equal, all angles 60°, 3 axes of symmetry', is_en=True)

    # KP-056: 直角三角形的性质 (斜边中线等于斜边一半 CD = AB/2)
    zh_056 = """  <g transform="translate(50, 68)">
    <!-- Right triangle: C(30, 140), A(30, 20), B(210, 140) -->
    <polygon class="layer-stage-1" points="30,20 30,140 210,140" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>
    <rect class="layer-stage-1" x="30" y="128" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/>
    <text class="layer-stage-1" x="20" y="152" font-size="12" font-weight="bold" fill="#0369a1">C</text>
    <text class="layer-stage-1" x="20" y="20" font-size="12" font-weight="bold" fill="#0369a1">A</text>
    <text class="layer-stage-1" x="215" y="152" font-size="12" font-weight="bold" fill="#0369a1">B</text>
    <!-- Midpoint D on AB (120, 80) -->
    <circle class="layer-stage-2" cx="120" cy="80" r="5" fill="#dc2626"/>
    <text class="layer-stage-2" x="130" y="75" font-size="12" font-weight="bold" fill="#dc2626">中点 D</text>
    <!-- Median CD -->
    <line class="layer-stage-3 formal-labels" x1="30" y1="140" x2="120" y2="80" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-4" x="120" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">斜边中线定理: CD = AD = BD = AB/2</text>
  </g>"""
    en_056 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="30,20 30,140 210,140" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>
    <rect class="layer-stage-1" x="30" y="128" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/>
    <text class="layer-stage-1" x="20" y="152" font-size="11" font-weight="bold" fill="#0369a1">C</text>
    <text class="layer-stage-1" x="20" y="20" font-size="11" font-weight="bold" fill="#0369a1">A</text>
    <text class="layer-stage-1" x="215" y="152" font-size="11" font-weight="bold" fill="#0369a1">B</text>
    <circle class="layer-stage-2" cx="120" cy="80" r="5" fill="#dc2626"/>
    <text class="layer-stage-2" x="130" y="75" font-size="11" font-weight="bold" fill="#dc2626">Midpoint D</text>
    <line class="layer-stage-3 formal-labels" x1="30" y1="140" x2="120" y2="80" stroke="#dc2626" stroke-width="2.5"/>
    <text class="layer-stage-4" x="120" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Median to Hypotenuse: CD = AD = BD = AB/2</text>
  </g>"""
    results['KP-056-zh.svg'] = build_svg_document('KP-056', '直角三角形', '直角三角形的性质', zh_056, '直角三角形斜边上的中线等于斜边的一半: CD = AB/2')
    results['KP-056-en.svg'] = build_svg_document('KP-056', 'Right Triangles', 'Right Triangle Properties', en_056, 'Median to the hypotenuse is half the length of hypotenuse', is_en=True)

    # KP-057: 勾股定理及其逆定理 (赵爽弦图 4个直角三角形拼成 c^2)
    zh_057 = """  <g transform="translate(65, 68)">
    <!-- Outer Square c^2 rotated / inscribed -->
    <rect class="layer-stage-1" x="20" y="20" width="140" height="140" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <!-- 4 Right Triangles -->
    <polygon class="layer-stage-2" points="20,60 120,20 120,60" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="120,20 160,120 120,120" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="160,120 60,160 60,120" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="60,160 20,60 60,60" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <!-- Center small square (b - a)^2 -->
    <rect class="layer-stage-3 formal-labels" x="60" y="60" width="60" height="60" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="90" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">(b-a)²</text>
    <text class="layer-stage-4" x="90" y="175" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">赵爽弦图: a² + b² = c²</text>
  </g>"""
    en_057 = """  <g transform="translate(65, 68)">
    <rect class="layer-stage-1" x="20" y="20" width="140" height="140" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <polygon class="layer-stage-2" points="20,60 120,20 120,60" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="120,20 160,120 120,120" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="160,120 60,160 60,120" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="60,160 20,60 60,60" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-3 formal-labels" x="60" y="60" width="60" height="60" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="90" y="95" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">(b-a)²</text>
    <text class="layer-stage-4" x="90" y="175" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Zhao Shuang Chord: a² + b² = c²</text>
  </g>"""
    results['KP-057-zh.svg'] = build_svg_document('KP-057', '直角三角形', '勾股定理及其逆定理', zh_057, '赵爽弦图面积割补证法：直角三角形两直角边平方和等于斜边平方 a²+b²=c²')
    results['KP-057-en.svg'] = build_svg_document('KP-057', 'Right Triangles', 'Pythagorean Theorem & Converse', en_057, 'Geometric proof by area dissection: a² + b² = c²', is_en=True)

    # KP-058: 相似三角形的判定 (AA 相似与成比例放缩)
    zh_058 = """  <g transform="translate(45, 68)">
    <!-- Small triangle -->
    <polygon class="layer-stage-1" points="50,60 20,135 90,135" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="50" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">△ABC</text>
    <!-- Similarity symbol -->
    <text class="layer-stage-2" x="125" y="105" text-anchor="middle" font-size="20" font-weight="bold" fill="#047857">∽</text>
    <!-- Large scaled triangle -->
    <polygon class="layer-stage-3 formal-labels" points="205,25 150,145 270,145" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="205" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">△A'B'C'</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">判定: 两角分别相等 (AA 相似) 对应边成比例</text>
  </g>"""
    en_058 = """  <g transform="translate(45, 68)">
    <polygon class="layer-stage-1" points="50,60 20,135 90,135" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="50" y="52" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">△ABC</text>
    <text class="layer-stage-2" x="125" y="105" text-anchor="middle" font-size="20" font-weight="bold" fill="#047857">∽</text>
    <polygon class="layer-stage-3 formal-labels" points="205,25 150,145 270,145" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="205" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">△A'B'C'</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Criteria: AA (Two Angles Equal), Proportional Sides</text>
  </g>"""
    results['KP-058-zh.svg'] = build_svg_document('KP-058', '相似三角形', '相似三角形的判定', zh_058, '相似判定定理：两角分别相等的两三角形相似 (AA)')
    results['KP-058-en.svg'] = build_svg_document('KP-058', 'Similarity', 'Criteria for Similar Triangles', en_058, 'Similarity criteria: two angles equal implies similarity (AA)', is_en=True)

    # KP-059: 相似三角形的性质 (周长比为k，面积比为k^2 四块拼图)
    zh_059 = """  <g transform="translate(45, 68)">
    <!-- Small triangle (area 1) -->
    <polygon class="layer-stage-1" points="50,75 20,135 80,135" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-1" x="50" y="115" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">S₁ = 1</text>
    <text class="layer-stage-1" x="50" y="150" text-anchor="middle" font-size="11" fill="#475569">周长 C₁</text>
    <!-- Scaled triangle (k=2, area 4) -->
    <polygon class="layer-stage-2" points="200,20 140,140 260,140" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <!-- 4 partitioned small triangles -->
    <line class="layer-stage-3 formal-labels" x1="170" y1="80" x2="230" y2="80" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-3 formal-labels" x1="170" y1="80" x2="200" y2="140" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-3 formal-labels" x1="230" y1="80" x2="200" y2="140" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="200" y="105" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">S₂ = 4 (k²=4)</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">性质: 周长比等于 k, 面积比等于 k²</text>
  </g>"""
    en_059 = """  <g transform="translate(45, 68)">
    <polygon class="layer-stage-1" points="50,75 20,135 80,135" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-1" x="50" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">S₁ = 1</text>
    <text class="layer-stage-1" x="50" y="150" text-anchor="middle" font-size="10" fill="#475569">Perimeter C₁</text>
    <polygon class="layer-stage-2" points="200,20 140,140 260,140" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="170" y1="80" x2="230" y2="80" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-3 formal-labels" x1="170" y1="80" x2="200" y2="140" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-3 formal-labels" x1="230" y1="80" x2="200" y2="140" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="200" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">S₂ = 4 (k²=4)</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Properties: Perimeter ratio = k, Area ratio = k²</text>
  </g>"""
    results['KP-059-zh.svg'] = build_svg_document('KP-059', '相似三角形', '相似三角形的性质', zh_059, '相似三角形周长比等于相似比 k，面积比等于相似比的平方 k²')
    results['KP-059-en.svg'] = build_svg_document('KP-059', 'Similarity', 'Properties of Similar Triangles', en_059, 'Perimeter ratio equals similarity ratio k; area ratio equals k²', is_en=True)

    # KP-060: 位似图形与位似变换 (位似中心 O 射线透视)
    zh_060 = """  <g transform="translate(45, 68)">
    <!-- Homothetic center O -->
    <circle class="layer-stage-1" cx="30" cy="130" r="5" fill="#dc2626"/>
    <text class="layer-stage-1" x="25" y="148" font-size="12" font-weight="bold" fill="#dc2626">O (位似中心)</text>
    <!-- Perspective rays -->
    <line class="layer-stage-2" x1="30" y1="130" x2="260" y2="30" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="30" y1="130" x2="260" y2="90" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="30" y1="130" x2="260" y2="150" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <!-- Small triangle -->
    <polygon class="layer-stage-3 formal-labels" points="110,95 110,115 130,123" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <!-- Large homothetic triangle -->
    <polygon class="layer-stage-4" points="200,55 200,105 245,125" fill="#dcfce7" stroke="#16a34a" stroke-width="2.5"/>
    <text class="layer-stage-4" x="150" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">位似变换: 对应点连线交于位似中心 O</text>
  </g>"""
    en_060 = """  <g transform="translate(45, 68)">
    <circle class="layer-stage-1" cx="30" cy="130" r="5" fill="#dc2626"/>
    <text class="layer-stage-1" x="25" y="148" font-size="10" font-weight="bold" fill="#dc2626">O (Center)</text>
    <line class="layer-stage-2" x1="30" y1="130" x2="260" y2="30" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="30" y1="130" x2="260" y2="90" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="30" y1="130" x2="260" y2="150" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <polygon class="layer-stage-3 formal-labels" points="110,95 110,115 130,123" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <polygon class="layer-stage-4" points="200,55 200,105 245,125" fill="#dcfce7" stroke="#16a34a" stroke-width="2.5"/>
    <text class="layer-stage-4" x="150" y="165" text-anchor="middle" font-size="10" font-weight="bold" fill="#047857">Homothetic: Rays through corresponding vertices meet at O</text>
  </g>"""
    results['KP-060-zh.svg'] = build_svg_document('KP-060', '相似图形', '位似图形与位似变换', zh_060, '对应顶点的连线相交于一点且对应边平行的两个相似多边形叫做位似图形')
    results['KP-060-en.svg'] = build_svg_document('KP-060', 'Similarity', 'Homothetic Figures & Transformations', en_060, 'Lines connecting corresponding vertices pass through dilation center O', is_en=True)

    return results
