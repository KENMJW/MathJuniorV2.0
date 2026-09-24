"""
分片 6: KP-069 ~ KP-084 (圆与图形变换)
16 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part6():
    results = {}

    # KP-069: 圆的基本概念 (定点定长轨迹)
    zh_069 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#1e40af"/>
    <text class="layer-stage-1" x="140" y="103" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">圆心 O</text>
    <!-- Radius rotating compass -->
    <line class="layer-stage-2" x1="140" y1="85" x2="185" y2="50" stroke="#ea580c" stroke-width="2.5"/>
    <circle class="layer-stage-2" cx="185" cy="50" r="4" fill="#ea580c"/>
    <text class="layer-stage-2" x="165" y="60" font-size="11" font-weight="bold" fill="#ea580c">半径 r</text>
    <!-- Dynamic trajectory arc arrow -->
    <path class="layer-stage-3 formal-labels" d="M195,85 A55,55 0 0,0 185,50" fill="none" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="185,50 190,56 195,50" fill="#16a34a"/>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">平面内到定点 O 的距离等于定长 r 的点的集合</text>
  </g>"""
    en_069 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#1e40af"/>
    <text class="layer-stage-1" x="140" y="103" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Center O</text>
    <line class="layer-stage-2" x1="140" y1="85" x2="185" y2="50" stroke="#ea580c" stroke-width="2.5"/>
    <circle class="layer-stage-2" cx="185" cy="50" r="4" fill="#ea580c"/>
    <text class="layer-stage-2" x="165" y="60" font-size="10" font-weight="bold" fill="#ea580c">Radius r</text>
    <path class="layer-stage-3 formal-labels" d="M195,85 A55,55 0 0,0 185,50" fill="none" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="185,50 190,56 195,50" fill="#16a34a"/>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Locus of points at distance r from fixed center O</text>
  </g>"""
    results['KP-069-zh.svg'] = build_svg_document('KP-069', '圆', '圆的基本概念', zh_069, '平面内到定点的距离等于定长的点的轨迹叫做圆')
    results['KP-069-en.svg'] = build_svg_document('KP-069', 'Circles', 'Fundamental Concepts of Circles', en_069, 'Circle is locus of all points at distance r from center O', is_en=True)

    # KP-070: 点与圆的位置关系 (圆内/圆上/圆外 三态判定)
    zh_070 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#475569"/>
    <text class="layer-stage-1" x="140" y="102" text-anchor="middle" font-size="11">O</text>
    <!-- Point A inside (d < r) -->
    <circle class="layer-stage-2" cx="120" cy="65" r="5" fill="#2563eb"/>
    <text class="layer-stage-2" x="110" y="60" font-size="11" font-weight="bold" fill="#2563eb">A(点在圆内 d&lt;r)</text>
    <!-- Point B on circle (d = r) -->
    <circle class="layer-stage-3 formal-labels" cx="195" cy="85" r="5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="205" y="85" font-size="11" font-weight="bold" fill="#15803d">B(圆上 d=r)</text>
    <!-- Point C outside (d > r) -->
    <circle class="layer-stage-4" cx="225" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="235" y="40" font-size="11" font-weight="bold" fill="#dc2626">C(圆外 d&gt;r)</text>
  </g>"""
    en_070 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#475569"/>
    <text class="layer-stage-1" x="140" y="102" text-anchor="middle" font-size="10">O</text>
    <circle class="layer-stage-2" cx="120" cy="65" r="5" fill="#2563eb"/>
    <text class="layer-stage-2" x="110" y="60" font-size="10" font-weight="bold" fill="#2563eb">A (Inside d&lt;r)</text>
    <circle class="layer-stage-3 formal-labels" cx="195" cy="85" r="5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="205" y="85" font-size="10" font-weight="bold" fill="#15803d">B (On Circle d=r)</text>
    <circle class="layer-stage-4" cx="225" cy="40" r="5" fill="#dc2626"/>
    <text class="layer-stage-4" x="235" y="40" font-size="10" font-weight="bold" fill="#dc2626">C (Outside d&gt;r)</text>
  </g>"""
    results['KP-070-zh.svg'] = build_svg_document('KP-070', '圆', '点与圆的位置关系', zh_070, '根据点到圆心距离 d 与半径 r 的大小关系判定：d<r 圆内，d=r 圆上，d>r 圆外')
    results['KP-070-en.svg'] = build_svg_document('KP-070', 'Circles', 'Points and Circles', en_070, 'Position determined by distance d vs radius r: inside, on, or outside', is_en=True)

    # KP-071: 直线与圆的位置关系 (相交/相切/相离)
    zh_071 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="90" r="50" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="90" r="4" fill="#475569"/>
    <!-- Line 1: Secant (相交 2 points) -->
    <line class="layer-stage-2" x1="40" y1="65" x2="240" y2="65" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="245" y="68" font-size="11" font-weight="bold" fill="#2563eb">相交 (d &lt; r)</text>
    <!-- Line 2: Tangent (相切 1 point) -->
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="240" y2="140" stroke="#16a34a" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="245" y="143" font-size="11" font-weight="bold" fill="#15803d">相切 (d = r)</text>
    <!-- Line 3: Separated (相离 0 points) -->
    <line class="layer-stage-4" x1="40" y1="165" x2="240" y2="165" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-4" x="245" y="168" font-size="11" font-weight="bold" fill="#ea580c">相离 (d &gt; r)</text>
  </g>"""
    en_071 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="90" r="50" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="90" r="4" fill="#475569"/>
    <line class="layer-stage-2" x1="40" y1="65" x2="240" y2="65" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="245" y="68" font-size="10" font-weight="bold" fill="#2563eb">Secant (d &lt; r)</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="240" y2="140" stroke="#16a34a" stroke-width="2.5"/>
    <text class="layer-stage-3 formal-labels" x="245" y="143" font-size="10" font-weight="bold" fill="#15803d">Tangent (d = r)</text>
    <line class="layer-stage-4" x1="40" y1="165" x2="240" y2="165" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-4" x="245" y="168" font-size="10" font-weight="bold" fill="#ea580c">Separated (d &gt; r)</text>
  </g>"""
    results['KP-071-zh.svg'] = build_svg_document('KP-071', '圆', '直线与圆的位置关系', zh_071, '圆心距 d 与半径 r 的关系决定三态：d<r 相交(2点)，d=r 相切(1点)，d>r 相离(0点)')
    results['KP-071-en.svg'] = build_svg_document('KP-071', 'Circles', 'Lines and Circles', en_071, 'Position determined by distance d from center to line: secant, tangent, separated', is_en=True)

    # KP-072: 切线的判定与性质 (切线垂直于过切点的半径 OT ⊥ l)
    zh_072 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="80" r="55" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="80" r="4" fill="#1e40af"/>
    <text class="layer-stage-1" x="140" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">O</text>
    <!-- Radius OT -->
    <line class="layer-stage-2" x1="140" y1="80" x2="140" y2="135" stroke="#dc2626" stroke-width="2"/>
    <circle class="layer-stage-2" cx="140" cy="135" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-2" x="155" y="130" font-size="12" font-weight="bold" fill="#dc2626">切点 T</text>
    <!-- Tangent line l -->
    <line class="layer-stage-3 formal-labels" x1="40" y1="135" x2="240" y2="135" stroke="#16a34a" stroke-width="3"/>
    <rect class="layer-stage-3 formal-labels" x="140" y="123" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="245" y="140" font-size="12" font-weight="bold" fill="#15803d">切线 l</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">性质定理: 圆的切线垂直于经过切点的半径 (OT ⊥ l)</text>
  </g>"""
    en_072 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="80" r="55" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="80" r="4" fill="#1e40af"/>
    <text class="layer-stage-1" x="140" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">O</text>
    <line class="layer-stage-2" x1="140" y1="80" x2="140" y2="135" stroke="#dc2626" stroke-width="2"/>
    <circle class="layer-stage-2" cx="140" cy="135" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-2" x="155" y="130" font-size="11" font-weight="bold" fill="#dc2626">Point T</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="135" x2="240" y2="135" stroke="#16a34a" stroke-width="3"/>
    <rect class="layer-stage-3 formal-labels" x="140" y="123" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="245" y="140" font-size="11" font-weight="bold" fill="#15803d">Tangent l</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Theorem: Tangent line is perpendicular to radius at contact (OT ⊥ l)</text>
  </g>"""
    results['KP-072-zh.svg'] = build_svg_document('KP-072', '圆', '切线的判定与性质', zh_072, '切线性质定理：经过半径外端并且垂直于这条半径的直线是圆的切线')
    results['KP-072-en.svg'] = build_svg_document('KP-072', 'Circles', 'Tangent Lines Criteria & Properties', en_072, 'Tangent is perpendicular to the radius at the point of tangency', is_en=True)

    # KP-073: 圆周角定理与圆心角 (同弧所对圆心角等于圆周角的两倍 ∠AOB = 2∠APB)
    zh_073 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#475569"/>
    <text class="layer-stage-1" x="135" y="80" font-size="11" font-weight="bold">O</text>
    <!-- Arc AB at bottom -->
    <circle class="layer-stage-2" cx="95" cy="120" r="4" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="185" cy="120" r="4" fill="#2563eb"/>
    <text class="layer-stage-2" x="85" y="135" font-size="11" font-weight="bold" fill="#2563eb">A</text>
    <text class="layer-stage-2" x="190" y="135" font-size="11" font-weight="bold" fill="#2563eb">B</text>
    <!-- Central Angle AOB -->
    <line class="layer-stage-2" x1="140" y1="85" x2="95" y2="120" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-2" x1="140" y1="85" x2="185" y2="120" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="140" y="110" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">2α</text>
    <!-- Inscribed Angle APB: P at top (140, 30) -->
    <circle class="layer-stage-3 formal-labels" cx="140" cy="30" r="4" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="140" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">P</text>
    <line class="layer-stage-3 formal-labels" x1="140" y1="30" x2="95" y2="120" stroke="#dc2626" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="140" y1="30" x2="185" y2="120" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="140" y="48" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">α</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">同弧所对: 圆心角 ∠AOB = 2 × 圆周角 ∠APB</text>
  </g>"""
    en_073 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#475569"/>
    <text class="layer-stage-1" x="135" y="80" font-size="10" font-weight="bold">O</text>
    <circle class="layer-stage-2" cx="95" cy="120" r="4" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="185" cy="120" r="4" fill="#2563eb"/>
    <text class="layer-stage-2" x="85" y="135" font-size="10" font-weight="bold" fill="#2563eb">A</text>
    <text class="layer-stage-2" x="190" y="135" font-size="10" font-weight="bold" fill="#2563eb">B</text>
    <line class="layer-stage-2" x1="140" y1="85" x2="95" y2="120" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-2" x1="140" y1="85" x2="185" y2="120" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-2" x="140" y="110" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">2α</text>
    <circle class="layer-stage-3 formal-labels" cx="140" cy="30" r="4" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="140" y="22" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">P</text>
    <line class="layer-stage-3 formal-labels" x1="140" y1="30" x2="95" y2="120" stroke="#dc2626" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="140" y1="30" x2="185" y2="120" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="140" y="48" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">α</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Inscribed Angle Theorem: ∠AOB = 2 × ∠APB</text>
  </g>"""
    results['KP-073-zh.svg'] = build_svg_document('KP-073', '圆', '圆周角定理与圆心角', zh_073, '一条弧所对的圆周角等于它所对的圆心角的一半；直径所对圆周角为 90°')
    results['KP-073-en.svg'] = build_svg_document('KP-073', 'Circles', 'Inscribed Angles & Central Angles', en_073, 'Measure of inscribed angle is half of central angle subtended by same arc', is_en=True)

    # KP-074: 圆中的弦与垂径定理 (垂直于弦的直径平分弦 r^2 = d^2 + (AB/2)^2)
    zh_074 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#475569"/>
    <text class="layer-stage-1" x="150" y="85" font-size="11" font-weight="bold">O</text>
    <!-- Chord AB horizontal -->
    <line class="layer-stage-2" x1="90" y1="115" x2="190" y2="115" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="80" y="118" font-size="11" font-weight="bold" fill="#2563eb">A</text>
    <text class="layer-stage-2" x="195" y="118" font-size="11" font-weight="bold" fill="#2563eb">B</text>
    <!-- Perpendicular diameter CD -->
    <line class="layer-stage-3 formal-labels" x1="140" y1="30" x2="140" y2="140" stroke="#dc2626" stroke-width="2"/>
    <rect class="layer-stage-3 formal-labels" x="140" y="103" width="10" height="10" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <!-- Radius OA forming right triangle -->
    <line class="layer-stage-4" x1="140" y1="85" x2="90" y2="115" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="110" y="95" font-size="11" font-weight="bold" fill="#15803d">r</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">垂径直角三角形: r² = d² + (AB/2)²</text>
  </g>"""
    en_074 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="85" r="4" fill="#475569"/>
    <text class="layer-stage-1" x="150" y="85" font-size="10" font-weight="bold">O</text>
    <line class="layer-stage-2" x1="90" y1="115" x2="190" y2="115" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-2" x="80" y="118" font-size="10" font-weight="bold" fill="#2563eb">A</text>
    <text class="layer-stage-2" x="195" y="118" font-size="10" font-weight="bold" fill="#2563eb">B</text>
    <line class="layer-stage-3 formal-labels" x1="140" y1="30" x2="140" y2="140" stroke="#dc2626" stroke-width="2"/>
    <rect class="layer-stage-3 formal-labels" x="140" y="103" width="10" height="10" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <line class="layer-stage-4" x1="140" y1="85" x2="90" y2="115" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="110" y="95" font-size="10" font-weight="bold" fill="#15803d">r</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Right Triangle in Chord: r² = d² + (AB/2)²</text>
  </g>"""
    results['KP-074-zh.svg'] = build_svg_document('KP-074', '圆', '圆中的弦与垂径定理', zh_074, '垂直于弦的直径平分弦，并且平分弦所对的两条弧')
    results['KP-074-en.svg'] = build_svg_document('KP-074', 'Circles', 'Chords & Perpendicular Bisectors', en_074, 'Diameter perpendicular to chord bisects the chord and its subtended arcs', is_en=True)

    # KP-075: 圆与圆的位置关系 (双圆连心线 d 与 R+r)
    zh_075 = """  <g transform="translate(45, 68)">
    <!-- Circle 1 (R=50) -->
    <circle class="layer-stage-1" cx="95" cy="85" r="45" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-1" cx="95" cy="85" r="4" fill="#1e40af"/>
    <text class="layer-stage-1" x="95" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">O₁</text>
    <!-- Circle 2 (r=30) Externally Tangent at T(140, 85) -->
    <circle class="layer-stage-2" cx="170" cy="85" r="30" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <circle class="layer-stage-2" cx="170" cy="85" r="4" fill="#15803d"/>
    <text class="layer-stage-2" x="170" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">O₂</text>
    <!-- Center connecting line d -->
    <line class="layer-stage-3 formal-labels" x1="95" y1="85" x2="170" y2="85" stroke="#dc2626" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="140" cy="85" r="4" fill="#dc2626"/>
    <text class="layer-stage-4" x="135" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">外切条件: 连心线长 d = R + r</text>
  </g>"""
    en_075 = """  <g transform="translate(45, 68)">
    <circle class="layer-stage-1" cx="95" cy="85" r="45" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-1" cx="95" cy="85" r="4" fill="#1e40af"/>
    <text class="layer-stage-1" x="95" y="80" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">O₁</text>
    <circle class="layer-stage-2" cx="170" cy="85" r="30" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <circle class="layer-stage-2" cx="170" cy="85" r="4" fill="#15803d"/>
    <text class="layer-stage-2" x="170" y="80" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">O₂</text>
    <line class="layer-stage-3 formal-labels" x1="95" y1="85" x2="170" y2="85" stroke="#dc2626" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="140" cy="85" r="4" fill="#dc2626"/>
    <text class="layer-stage-4" x="135" y="150" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">External Tangency: d = R + r</text>
  </g>"""
    results['KP-075-zh.svg'] = build_svg_document('KP-075', '圆', '圆与圆的位置关系', zh_075, '两圆位置五态：外离 d>R+r、外切 d=R+r、相交 R-r<d<R+r、内切 d=R-r、内含 d<R-r')
    results['KP-075-en.svg'] = build_svg_document('KP-075', 'Circles', 'Positions of Two Circles', en_075, 'Five positions governed by distance between centers d vs radii R ± r', is_en=True)

    # KP-076: 三角形的内切圆与外接圆 (内心角平分线与外心垂直平分线)
    zh_076 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="130,20 40,140 220,140" fill="none" stroke="#2563eb" stroke-width="2"/>
    <!-- Inscribed circle touching sides -->
    <circle class="layer-stage-2" cx="130" cy="95" r="35" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <circle class="layer-stage-2" cx="130" cy="95" r="4" fill="#15803d"/>
    <text class="layer-stage-3 formal-labels" x="130" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">内心 I</text>
    <text class="layer-stage-4" x="130" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">内心: 三内角平分线交点 (到三边距离相等)</text>
  </g>"""
    en_076 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="130,20 40,140 220,140" fill="none" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-2" cx="130" cy="95" r="35" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <circle class="layer-stage-2" cx="130" cy="95" r="4" fill="#15803d"/>
    <text class="layer-stage-3 formal-labels" x="130" y="90" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Incenter I</text>
    <text class="layer-stage-4" x="130" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Incenter: Angle bisectors intersection (equidistant from 3 sides)</text>
  </g>"""
    results['KP-076-zh.svg'] = build_svg_document('KP-076', '圆', '三角形的内切圆与外接圆', zh_076, '内心是三角形三内角平分线的交点；外心是三边垂直平分线的交点')
    results['KP-076-en.svg'] = build_svg_document('KP-076', 'Circles', 'Incircle & Circumcircle', en_076, 'Incenter: intersection of angle bisectors; Circumcenter: perpendicular bisectors', is_en=True)

    # KP-077: 弧长公式与扇形面积公式 (扇形圆心角 n° 与弧长 l)
    zh_077 = """  <g transform="translate(60, 68)">
    <!-- Sector pie slice -->
    <path class="layer-stage-1" d="M140,120 L80,50 A85,85 0 0,1 200,50 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="120" r="4" fill="#b45309"/>
    <!-- Radius lines -->
    <text class="layer-stage-2" x="100" y="95" font-size="12" font-weight="bold" fill="#b45309">r</text>
    <text class="layer-stage-2" x="175" y="95" font-size="12" font-weight="bold" fill="#b45309">r</text>
    <!-- Central angle n -->
    <path class="layer-stage-3 formal-labels" d="M125,102 A20,20 0 0,1 155,102" fill="none" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="140" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">n°</text>
    <!-- Arc length l -->
    <text class="layer-stage-4" x="140" y="38" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">弧长 l = nπr / 180</text>
    <text class="layer-stage-4" x="140" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">面积 S = (nπr²)/360 = lr/2</text>
  </g>"""
    en_077 = """  <g transform="translate(60, 68)">
    <path class="layer-stage-1" d="M140,120 L80,50 A85,85 0 0,1 200,50 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <circle class="layer-stage-1" cx="140" cy="120" r="4" fill="#b45309"/>
    <text class="layer-stage-2" x="100" y="95" font-size="11" font-weight="bold" fill="#b45309">r</text>
    <text class="layer-stage-2" x="175" y="95" font-size="11" font-weight="bold" fill="#b45309">r</text>
    <path class="layer-stage-3 formal-labels" d="M125,102 A20,20 0 0,1 155,102" fill="none" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="140" y="95" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">n°</text>
    <text class="layer-stage-4" x="140" y="38" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">Arc Length l = nπr / 180</text>
    <text class="layer-stage-4" x="140" y="155" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Area S = (nπr²)/360 = lr/2</text>
  </g>"""
    results['KP-077-zh.svg'] = build_svg_document('KP-077', '圆', '弧长公式与扇形面积公式', zh_077, '弧长公式 l = nπr/180，扇形面积公式 S = nπr²/360 = 1/2 lr')
    results['KP-077-en.svg'] = build_svg_document('KP-077', 'Circles', 'Arc Length & Sector Area', en_077, 'Arc length l = nπr/180, sector area S = nπr²/360 = 1/2 lr', is_en=True)

    # KP-078: 正多边形与圆 (圆内接正六边形与中心角 60°)
    zh_078 = """  <g transform="translate(60, 68)">
    <!-- Circumcircle -->
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <!-- Inscribed Regular Hexagon -->
    <polygon class="layer-stage-2" points="195,85 167,132 112,132 85,85 112,37 167,37" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="140" cy="85" r="4" fill="#dc2626"/>
    <!-- Central triangle -->
    <line class="layer-stage-3 formal-labels" x1="140" y1="85" x2="167" y2="37" stroke="#dc2626" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="140" y1="85" x2="112" y2="37" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-4" x="140" y="65" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">中心角 60°</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">正六边形: 边长等于外接圆半径 R</text>
  </g>"""
    en_078 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="55" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
    <polygon class="layer-stage-2" points="195,85 167,132 112,132 85,85 112,37 167,37" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="140" cy="85" r="4" fill="#dc2626"/>
    <line class="layer-stage-3 formal-labels" x1="140" y1="85" x2="167" y2="37" stroke="#dc2626" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="140" y1="85" x2="112" y2="37" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-4" x="140" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">Central Angle 60°</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Hexagon: Side length equals circumradius R</text>
  </g>"""
    results['KP-078-zh.svg'] = build_svg_document('KP-078', '圆', '正多边形与圆', zh_078, '正n边形中心角为 360°/n；中心角、半径和边心距构成直角三角形')
    results['KP-078-en.svg'] = build_svg_document('KP-078', 'Circles', 'Regular Polygons and Circles', en_078, 'Central angle is 360/n degrees; radius and apothem form right triangle', is_en=True)

    # KP-079: 轴对称与轴对称图形 (镜像对称翻折)
    zh_079 = """  <g transform="translate(60, 68)">
    <line class="layer-stage-1" x1="140" y1="10" x2="140" y2="170" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-1" x="145" y="25" font-size="11" font-weight="bold" fill="#dc2626">对称轴 l</text>
    <polygon class="layer-stage-2" points="50,40 110,80 70,140" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <polygon class="layer-stage-2" points="230,40 170,80 210,140" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="50" y1="40" x2="230" y2="40" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-3 formal-labels" x1="110" y1="80" x2="170" y2="80" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="38" y="42" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-4" x="235" y="42" font-weight="bold" fill="#1e40af">A'</text>
    <text class="layer-stage-4" x="98" y="82" font-weight="bold" fill="#1e40af">B</text>
    <text class="layer-stage-4" x="175" y="82" font-weight="bold" fill="#1e40af">B'</text>
  </g>"""
    en_079 = """  <g transform="translate(60, 68)">
    <line class="layer-stage-1" x1="140" y1="10" x2="140" y2="170" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-1" x="145" y="25" font-size="11" font-weight="bold" fill="#dc2626">Axis l</text>
    <polygon class="layer-stage-2" points="50,40 110,80 70,140" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <polygon class="layer-stage-2" points="230,40 170,80 210,140" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="50" y1="40" x2="230" y2="40" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line class="layer-stage-3 formal-labels" x1="110" y1="80" x2="170" y2="80" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="38" y="42" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-4" x="235" y="42" font-weight="bold" fill="#1e40af">A'</text>
    <text class="layer-stage-4" x="98" y="82" font-weight="bold" fill="#1e40af">B</text>
    <text class="layer-stage-4" x="175" y="82" font-weight="bold" fill="#1e40af">B'</text>
  </g>"""
    results['KP-079-zh.svg'] = build_svg_document('KP-079', '图形变换', '轴对称与轴对称图形', zh_079, '轴对称对应点连线被对称轴垂直平分，保距保角保面积')
    results['KP-079-en.svg'] = build_svg_document('KP-079', 'Transformations', 'Axial Symmetry', en_079, 'Axis of symmetry is perpendicular bisector of corresponding segments', is_en=True)

    # KP-080: 平移变换 (向量滑动)
    zh_080 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="30,120 110,120 80,40" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-2" points="150,120 230,120 200,40" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <path class="layer-stage-3 formal-labels" d="M80,40 L195,40" stroke="#3b82f6" stroke-width="2"/>
    <path class="layer-stage-3 formal-labels" d="M110,120 L225,120" stroke="#3b82f6" stroke-width="2"/>
    <path class="layer-stage-3 formal-labels" d="M30,120 L145,120" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-4" x="80" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">A</text>
    <text class="layer-stage-4" x="200" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">A'</text>
    <text class="layer-stage-4" x="140" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">平移向量 v</text>
  </g>"""
    en_080 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="30,120 110,120 80,40" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-2" points="150,120 230,120 200,40" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <path class="layer-stage-3 formal-labels" d="M80,40 L195,40" stroke="#3b82f6" stroke-width="2"/>
    <path class="layer-stage-3 formal-labels" d="M110,120 L225,120" stroke="#3b82f6" stroke-width="2"/>
    <path class="layer-stage-3 formal-labels" d="M30,120 L145,120" stroke="#3b82f6" stroke-width="2"/>
    <text class="layer-stage-4" x="80" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">A</text>
    <text class="layer-stage-4" x="200" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">A'</text>
    <text class="layer-stage-4" x="140" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">Vector v</text>
  </g>"""
    results['KP-080-zh.svg'] = build_svg_document('KP-080', '图形变换', '平移变换', zh_080, '平移保持图形形状大小不变，对应点的连线平行且相等')
    results['KP-080-en.svg'] = build_svg_document('KP-080', 'Transformations', 'Translation Transformation', en_080, 'Translation preserves isometry: corresponding segments are parallel and equal', is_en=True)

    # KP-081: 旋转变换 (绕定点 O 旋转角度 α)
    zh_081 = """  <g transform="translate(60, 68)">
    <!-- Rotation Center O -->
    <circle class="layer-stage-1" cx="60" cy="130" r="5" fill="#dc2626"/>
    <text class="layer-stage-1" x="50" y="145" font-size="12" font-weight="bold" fill="#dc2626">旋转中心 O</text>
    <!-- Original Segment OA -->
    <line class="layer-stage-2" x1="60" y1="130" x2="160" y2="130" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-2" cx="160" cy="130" r="4.5" fill="#2563eb"/>
    <text class="layer-stage-2" x="170" y="135" font-size="12" font-weight="bold" fill="#2563eb">A</text>
    <!-- Rotated Segment OA' (rotated by 45 degrees) -->
    <line class="layer-stage-3 formal-labels" x1="60" y1="130" x2="131" y2="59" stroke="#16a34a" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="131" cy="59" r="4.5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="140" y="55" font-size="12" font-weight="bold" fill="#15803d">A'</text>
    <!-- Rotation Arc -->
    <path class="layer-stage-4" d="M120,130 A60,60 0 0,0 102,88" fill="none" stroke="#ea580c" stroke-width="2"/>
    <polygon class="layer-stage-4" points="102,88 102,96 109,92" fill="#ea580c"/>
    <text class="layer-stage-4" x="125" y="105" font-size="12" font-weight="bold" fill="#ea580c">旋转角 α</text>
  </g>"""
    en_081 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="60" cy="130" r="5" fill="#dc2626"/>
    <text class="layer-stage-1" x="50" y="145" font-size="11" font-weight="bold" fill="#dc2626">Center O</text>
    <line class="layer-stage-2" x1="60" y1="130" x2="160" y2="130" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-2" cx="160" cy="130" r="4.5" fill="#2563eb"/>
    <text class="layer-stage-2" x="170" y="135" font-size="11" font-weight="bold" fill="#2563eb">A</text>
    <line class="layer-stage-3 formal-labels" x1="60" y1="130" x2="131" y2="59" stroke="#16a34a" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="131" cy="59" r="4.5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="140" y="55" font-size="11" font-weight="bold" fill="#15803d">A'</text>
    <path class="layer-stage-4" d="M120,130 A60,60 0 0,0 102,88" fill="none" stroke="#ea580c" stroke-width="2"/>
    <polygon class="layer-stage-4" points="102,88 102,96 109,92" fill="#ea580c"/>
    <text class="layer-stage-4" x="125" y="105" font-size="11" font-weight="bold" fill="#ea580c">Angle α</text>
  </g>"""
    results['KP-081-zh.svg'] = build_svg_document('KP-081', '图形变换', '旋转变换', zh_081, '旋转性质：对应点到旋转中心的距离相等，对应点与旋转中心连线夹角等于旋转角')
    results['KP-081-en.svg'] = build_svg_document('KP-081', 'Transformations', 'Rotation Transformation', en_081, 'Rotation preserves distances to center O; ray angles equal rotation angle', is_en=True)

    # KP-082: 中心对称与中心对称图形 (绕中心旋转 180° 重合)
    zh_082 = """  <g transform="translate(60, 68)">
    <!-- Symmetry Center O -->
    <circle class="layer-stage-1" cx="140" cy="85" r="5" fill="#dc2626"/>
    <text class="layer-stage-1" x="140" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">对称中心 O</text>
    <!-- Point A and A' colinear with O -->
    <line class="layer-stage-2" x1="50" y1="40" x2="230" y2="130" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-2" cx="50" cy="40" r="4.5" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="230" cy="130" r="4.5" fill="#2563eb"/>
    <text class="layer-stage-2" x="40" y="35" font-size="12" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-2" x="240" y="135" font-size="12" font-weight="bold" fill="#1e40af">A'</text>
    <!-- Point B and B' colinear with O -->
    <line class="layer-stage-3 formal-labels" x1="70" y1="130" x2="210" y2="40" stroke="#16a34a" stroke-width="2"/>
    <circle class="layer-stage-3 formal-labels" cx="70" cy="130" r="4.5" fill="#16a34a"/>
    <circle class="layer-stage-3 formal-labels" cx="210" cy="40" r="4.5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="60" y="145" font-size="12" font-weight="bold" fill="#15803d">B</text>
    <text class="layer-stage-3 formal-labels" x="220" y="45" font-size="12" font-weight="bold" fill="#15803d">B'</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">性质: OA = OA', OB = OB', 旋转 180° 重合</text>
  </g>"""
    en_082 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="85" r="5" fill="#dc2626"/>
    <text class="layer-stage-1" x="140" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Center O</text>
    <line class="layer-stage-2" x1="50" y1="40" x2="230" y2="130" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-2" cx="50" cy="40" r="4.5" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="230" cy="130" r="4.5" fill="#2563eb"/>
    <text class="layer-stage-2" x="40" y="35" font-size="11" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-2" x="240" y="135" font-size="11" font-weight="bold" fill="#1e40af">A'</text>
    <line class="layer-stage-3 formal-labels" x1="70" y1="130" x2="210" y2="40" stroke="#16a34a" stroke-width="2"/>
    <circle class="layer-stage-3 formal-labels" cx="70" cy="130" r="4.5" fill="#16a34a"/>
    <circle class="layer-stage-3 formal-labels" cx="210" cy="40" r="4.5" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="60" y="145" font-size="11" font-weight="bold" fill="#15803d">B</text>
    <text class="layer-stage-3 formal-labels" x="220" y="45" font-size="11" font-weight="bold" fill="#15803d">B'</text>
    <text class="layer-stage-4" x="140" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">OA = OA', OB = OB'; 180° Rotation Invariance</text>
  </g>"""
    results['KP-082-zh.svg'] = build_svg_document('KP-082', '图形变换', '中心对称与中心对称图形', zh_082, '中心对称：经过对称中心的所有线段被中心点平分，旋转 180° 与原图重合')
    results['KP-082-en.svg'] = build_svg_document('KP-082', 'Transformations', 'Central Symmetry', en_082, 'Central symmetry: segments through center O bisected, 180° rotation invariance', is_en=True)

    # KP-083: 图形的综合变换 (矩形纸带折叠与折痕对称轴)
    zh_083 = """  <g transform="translate(50, 68)">
    <!-- Unfolded base strip -->
    <rect class="layer-stage-1" x="20" y="35" width="220" height="90" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Fold crease line EF -->
    <line class="layer-stage-2" x1="120" y1="35" x2="160" y2="125" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-2" x="110" y="28" font-size="11" font-weight="bold" fill="#dc2626">折痕 E</text>
    <text class="layer-stage-2" x="165" y="138" font-size="11" font-weight="bold" fill="#dc2626">F</text>
    <!-- Folded flap polygon -->
    <polygon class="layer-stage-3 formal-labels" points="120,35 160,125 90,145 50,55" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">折叠实质: 折痕为对称轴的轴对称变换，翻折前后全等</text>
  </g>"""
    en_083 = """  <g transform="translate(50, 68)">
    <rect class="layer-stage-1" x="20" y="35" width="220" height="90" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="120" y1="35" x2="160" y2="125" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-2" x="110" y="28" font-size="10" font-weight="bold" fill="#dc2626">Crease E</text>
    <text class="layer-stage-2" x="165" y="138" font-size="10" font-weight="bold" fill="#dc2626">F</text>
    <polygon class="layer-stage-3 formal-labels" points="120,35 160,125 90,145 50,55" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Origami: Fold crease acts as symmetry axis, preserving congruence</text>
  </g>"""
    results['KP-083-zh.svg'] = build_svg_document('KP-083', '图形变换', '图形的综合变换', zh_083, '图形折叠问题实质为轴对称变换，重叠部分对应边角守恒')
    results['KP-083-en.svg'] = build_svg_document('KP-083', 'Transformations', 'Composite Transformations', en_083, 'Paper folding corresponds to axial symmetry; length and angle are conserved', is_en=True)

    # KP-084: 三视图与几何体 (主视图/左视图/俯视图 长对正高平齐宽相等)
    zh_084 = """  <g transform="translate(50, 65)">
    <!-- Front View (主视图) -->
    <rect class="layer-stage-1" x="20" y="20" width="70" height="50" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="55" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">主视图</text>
    <!-- Left View (左视图) - High aligned -->
    <rect class="layer-stage-2" x="130" y="20" width="50" height="50" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-2" x="155" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">左视图</text>
    <line class="layer-stage-2" x1="90" y1="20" x2="130" y2="20" stroke="#94a3b8" stroke-dasharray="2 2"/>
    <!-- Top View (俯视图) - Length aligned -->
    <rect class="layer-stage-3 formal-labels" x="20" y="100" width="70" height="40" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="55" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">俯视图</text>
    <line class="layer-stage-3 formal-labels" x1="20" y1="70" x2="20" y2="100" stroke="#94a3b8" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="140" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">三视图口诀: 长对正，高平齐，宽相等</text>
  </g>"""
    en_084 = """  <g transform="translate(50, 65)">
    <rect class="layer-stage-1" x="20" y="20" width="70" height="50" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="55" y="50" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Front View</text>
    <rect class="layer-stage-2" x="130" y="20" width="50" height="50" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <text class="layer-stage-2" x="155" y="50" text-anchor="middle" font-size="10" font-weight="bold" fill="#b45309">Left View</text>
    <line class="layer-stage-2" x1="90" y1="20" x2="130" y2="20" stroke="#94a3b8" stroke-dasharray="2 2"/>
    <rect class="layer-stage-3 formal-labels" x="20" y="100" width="70" height="40" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="55" y="125" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Top View</text>
    <line class="layer-stage-3 formal-labels" x1="20" y1="70" x2="20" y2="100" stroke="#94a3b8" stroke-dasharray="2 2"/>
    <text class="layer-stage-4" x="140" y="155" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Three-View: Length aligned, height level, width equal</text>
  </g>"""
    results['KP-084-zh.svg'] = build_svg_document('KP-084', '三视图', '三视图与几何体', zh_084, '正交投影三视图规则：主俯长对正，主左高平齐，俯左宽相等')
    results['KP-084-en.svg'] = build_svg_document('KP-084', 'Three-View', 'Orthographic Projections', en_084, 'Three views: front-top length aligned, front-left height level', is_en=True)

    return results
