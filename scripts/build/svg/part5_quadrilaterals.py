"""
分片 5: KP-061 ~ KP-068 (四边形演化与中点四边形)
8 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part5():
    results = {}

    # KP-061: 多边形内角和与外角和 (五边形三角剖分 (n-2)*180°)
    zh_061 = """  <g transform="translate(50, 68)">
    <!-- Convex Pentagon: A(130, 20), B(40, 65), C(70, 145), D(190, 145), E(220, 65) -->
    <polygon class="layer-stage-1" points="130,20 40,65 70,145 190,145 220,65" fill="#fdf4ff" stroke="#a21caf" stroke-width="2"/>
    <!-- Triangulation diagonals from A -->
    <line class="layer-stage-2" x1="130" y1="20" x2="70" y2="145" stroke="#a21caf" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="130" y1="20" x2="190" y2="145" stroke="#a21caf" stroke-width="1.5" stroke-dasharray="3 3"/>
    <!-- Triangles annotations -->
    <text class="layer-stage-3 formal-labels" x="75" y="80" font-size="11" font-weight="bold" fill="#701a75">△1</text>
    <text class="layer-stage-3 formal-labels" x="130" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#701a75">△2</text>
    <text class="layer-stage-3 formal-labels" x="185" y="80" font-size="11" font-weight="bold" fill="#701a75">△3</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#a21caf">内角和 = (n - 2) × 180° = 540°</text>
  </g>"""
    en_061 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="130,20 40,65 70,145 190,145 220,65" fill="#fdf4ff" stroke="#a21caf" stroke-width="2"/>
    <line class="layer-stage-2" x1="130" y1="20" x2="70" y2="145" stroke="#a21caf" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="130" y1="20" x2="190" y2="145" stroke="#a21caf" stroke-width="1.5" stroke-dasharray="3 3"/>
    <text class="layer-stage-3 formal-labels" x="75" y="80" font-size="10" font-weight="bold" fill="#701a75">△1</text>
    <text class="layer-stage-3 formal-labels" x="130" y="105" text-anchor="middle" font-size="10" font-weight="bold" fill="#701a75">△2</text>
    <text class="layer-stage-3 formal-labels" x="185" y="80" font-size="10" font-weight="bold" fill="#701a75">△3</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#a21caf">Interior Sum = (n - 2) × 180° = 540°</text>
  </g>"""
    results['KP-061-zh.svg'] = build_svg_document('KP-061', '多边形', '多边形内角和与外角和', zh_061, 'n边形内角和等于 (n-2)×180°；任意凸多边形的外角和恒等于 360°')
    results['KP-061-en.svg'] = build_svg_document('KP-061', 'Polygons', 'Polygon Angle Sums', en_061, 'Interior angles sum to (n-2)*180 degrees; exterior angles always sum to 360 degrees', is_en=True)

    # KP-062: 平行四边形的性质 (对边平行相等，对角线互相平分)
    zh_062 = """  <g transform="translate(50, 68)">
    <!-- Parallelogram ABCD: A(60, 30), D(220, 30), C(190, 140), B(30, 140) -->
    <polygon class="layer-stage-1" points="60,30 220,30 190,140 30,140" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <!-- Diagonals AC and BD -->
    <line class="layer-stage-2" x1="60" y1="30" x2="190" y2="140" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="220" y1="30" x2="30" y2="140" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 3"/>
    <!-- Center O -->
    <circle class="layer-stage-3 formal-labels" cx="125" cy="85" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="135" y="82" font-size="11" font-weight="bold" fill="#dc2626">O</text>
    <!-- Labels -->
    <text class="layer-stage-4" x="55" y="22" font-size="12" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-4" x="225" y="22" font-size="12" font-weight="bold" fill="#1e40af">D</text>
    <text class="layer-stage-4" x="15" y="145" font-size="12" font-weight="bold" fill="#1e40af">B</text>
    <text class="layer-stage-4" x="195" y="145" font-size="12" font-weight="bold" fill="#1e40af">C</text>
    <text class="layer-stage-4" x="125" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">性质: 对边平行相等, OA = OC, OB = OD</text>
  </g>"""
    en_062 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="60,30 220,30 190,140 30,140" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-2" x1="60" y1="30" x2="190" y2="140" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line class="layer-stage-2" x1="220" y1="30" x2="30" y2="140" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle class="layer-stage-3 formal-labels" cx="125" cy="85" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="135" y="82" font-size="10" font-weight="bold" fill="#dc2626">O</text>
    <text class="layer-stage-4" x="55" y="22" font-size="11" font-weight="bold" fill="#1e40af">A</text>
    <text class="layer-stage-4" x="225" y="22" font-size="11" font-weight="bold" fill="#1e40af">D</text>
    <text class="layer-stage-4" x="15" y="145" font-size="11" font-weight="bold" fill="#1e40af">B</text>
    <text class="layer-stage-4" x="195" y="145" font-size="11" font-weight="bold" fill="#1e40af">C</text>
    <text class="layer-stage-4" x="125" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Properties: Opp sides equal and parallel, OA=OC, OB=OD</text>
  </g>"""
    results['KP-062-zh.svg'] = build_svg_document('KP-062', '四边形', '平行四边形的性质', zh_062, '平行四边形对边相等且平行，对角相等，对角线互相平分')
    results['KP-062-en.svg'] = build_svg_document('KP-062', 'Quadrilaterals', 'Parallelogram Properties', en_062, 'Opposite sides equal and parallel; diagonals bisect each other', is_en=True)

    # KP-063: 平行四边形的判定 (一组对边平行且相等)
    zh_063 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="60,35 210,35 180,135 30,135" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <!-- Parallel arrows on AD and BC -->
    <polygon class="layer-stage-2" points="135,35 127,31 127,39" fill="#15803d"/>
    <polygon class="layer-stage-2" points="105,135 97,131 97,139" fill="#15803d"/>
    <!-- Equal length ticks -->
    <line class="layer-stage-3 formal-labels" x1="135" y1="30" x2="135" y2="40" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="105" y1="130" x2="105" y2="140" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="120" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">AD ∥ BC 且 AD = BC</text>
    <text class="layer-stage-4" x="120" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">判定定理: 一组对边平行且相等的四边形是平行四边形</text>
  </g>"""
    en_063 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="60,35 210,35 180,135 30,135" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <polygon class="layer-stage-2" points="135,35 127,31 127,39" fill="#15803d"/>
    <polygon class="layer-stage-2" points="105,135 97,131 97,139" fill="#15803d"/>
    <line class="layer-stage-3 formal-labels" x1="135" y1="30" x2="135" y2="40" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="105" y1="130" x2="105" y2="140" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="120" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">AD ∥ BC and AD = BC</text>
    <text class="layer-stage-4" x="120" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534">Criteria: One pair of opposite sides parallel and equal</text>
  </g>"""
    results['KP-063-zh.svg'] = build_svg_document('KP-063', '四边形', '平行四边形的判定', zh_063, '一组对边平行且相等（或两组对边分别相等）的四边形是平行四边形')
    results['KP-063-en.svg'] = build_svg_document('KP-063', 'Quadrilaterals', 'Criteria for Parallelograms', en_063, 'One pair of opposite sides parallel and equal defines a parallelogram', is_en=True)

    # KP-064: 矩形的性质与判定 (四个直角，对角线相等且互相平分)
    zh_064 = """  <g transform="translate(50, 68)">
    <rect class="layer-stage-1" x="30" y="30" width="180" height="110" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <!-- Four 90-degree corner markers -->
    <rect class="layer-stage-2" x="30" y="30" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="198" y="30" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="198" y="128" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="30" y="128" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <!-- Diagonals AC and BD -->
    <line class="layer-stage-3 formal-labels" x1="30" y1="30" x2="210" y2="140" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="210" y1="30" x2="30" y2="140" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="120" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="#dc2626">AC = BD (对角线相等)</text>
    <text class="layer-stage-4" x="120" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">四个角都是直角 90° 的平行四边形是矩形</text>
  </g>"""
    en_064 = """  <g transform="translate(50, 68)">
    <rect class="layer-stage-1" x="30" y="30" width="180" height="110" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <rect class="layer-stage-2" x="30" y="30" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="198" y="30" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="198" y="128" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="30" y="128" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="30" y1="30" x2="210" y2="140" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="210" y1="30" x2="30" y2="140" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="120" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">AC = BD (Equal Diagonals)</text>
    <text class="layer-stage-4" x="120" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Parallelogram with four right angles is a rectangle</text>
  </g>"""
    results['KP-064-zh.svg'] = build_svg_document('KP-064', '四边形', '矩形的性质与判定', zh_064, '矩形四个角都是直角，对角线相等且互相平分')
    results['KP-064-en.svg'] = build_svg_document('KP-064', 'Quadrilaterals', 'Rectangle Properties & Criteria', en_064, 'Rectangles have four right angles and equal bisecting diagonals', is_en=True)

    # KP-065: 菱形的性质与判定 (四边相等，对角线互相垂直平分)
    zh_065 = """  <g transform="translate(60, 68)">
    <!-- Rhombus: Top(110, 20), Right(190, 85), Bottom(110, 150), Left(30, 85) -->
    <polygon class="layer-stage-1" points="110,20 190,85 110,150 30,85" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <!-- Diagonals AC and BD perpendicular -->
    <line class="layer-stage-2" x1="110" y1="20" x2="110" y2="150" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-2" x1="30" y1="85" x2="190" y2="85" stroke="#dc2626" stroke-width="2"/>
    <!-- Right angle indicator at intersection -->
    <rect class="layer-stage-3 formal-labels" x="110" y="75" width="10" height="10" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-4" x="110" y="168" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">四边相等, 对角线 AC ⊥ BD 且平分对角</text>
  </g>"""
    en_065 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="110,20 190,85 110,150 30,85" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
    <line class="layer-stage-2" x1="110" y1="20" x2="110" y2="150" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-2" x1="30" y1="85" x2="190" y2="85" stroke="#dc2626" stroke-width="2"/>
    <rect class="layer-stage-3 formal-labels" x="110" y="75" width="10" height="10" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-4" x="110" y="168" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">All 4 sides equal; Diagonals AC ⊥ BD bisect angles</text>
  </g>"""
    results['KP-065-zh.svg'] = build_svg_document('KP-065', '四边形', '菱形的性质与判定', zh_065, '菱形四条边相等，对角线互相垂直平分，每条对角线平分一组对角')
    results['KP-065-en.svg'] = build_svg_document('KP-065', 'Quadrilaterals', 'Rhombus Properties & Criteria', en_065, 'All sides equal; diagonals are perpendicular bisectors of each other', is_en=True)

    # KP-066: 正方形的性质与判定 (兼具矩形与菱形极高对称)
    zh_066 = """  <g transform="translate(65, 68)">
    <rect class="layer-stage-1" x="25" y="25" width="120" height="120" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <!-- 4 corner right angles -->
    <rect class="layer-stage-2" x="25" y="25" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="133" y="25" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="133" y="133" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="25" y="133" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <!-- Perpendicular equal diagonals -->
    <line class="layer-stage-3 formal-labels" x1="25" y1="25" x2="145" y2="145" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="145" y1="25" x2="25" y2="145" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="85" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">正方形: 矩形 + 菱形 (全对称图形)</text>
  </g>"""
    en_066 = """  <g transform="translate(65, 68)">
    <rect class="layer-stage-1" x="25" y="25" width="120" height="120" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <rect class="layer-stage-2" x="25" y="25" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="133" y="25" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="133" y="133" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="25" y="133" width="12" height="12" fill="none" stroke="#16a34a" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="25" y1="25" x2="145" y2="145" stroke="#dc2626" stroke-width="2"/>
    <line class="layer-stage-3 formal-labels" x1="145" y1="25" x2="25" y2="145" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-4" x="85" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Square: Rectangle + Rhombus (Fully Symmetric)</text>
  </g>"""
    results['KP-066-zh.svg'] = build_svg_document('KP-066', '四边形', '正方形的性质与判定', zh_066, '正方形具有矩形与菱形的所有性质：四角为直角，四边相等，对角线垂直相等且平分')
    results['KP-066-en.svg'] = build_svg_document('KP-066', 'Quadrilaterals', 'Square Properties & Criteria', en_066, 'Square combines rectangle and rhombus properties: 4 equal sides & right angles', is_en=True)

    # KP-067: 梯形的性质 (标准梯形高与中位线)
    zh_067 = """  <g transform="translate(55, 68)">
    <polygon class="layer-stage-1" points="70,30 190,30 250,150 30,150" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <line class="layer-stage-2" x1="70" y1="30" x2="70" y2="150" stroke="#dc2626" stroke-width="2" stroke-dasharray="2 2"/>
    <rect class="layer-stage-2" x="70" y="138" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-2" x="58" y="95" font-size="12" font-weight="bold" fill="#dc2626">高 h</text>
    <line class="layer-stage-3 formal-labels" x1="50" y1="90" x2="220" y2="90" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="50" cy="90" r="4" fill="#2563eb"/>
    <circle class="layer-stage-3 formal-labels" cx="220" cy="90" r="4" fill="#2563eb"/>
    <text class="layer-stage-3 formal-labels" x="35" y="94" font-size="12" font-weight="bold" fill="#2563eb">E</text>
    <text class="layer-stage-3 formal-labels" x="228" y="94" font-size="12" font-weight="bold" fill="#2563eb">F</text>
    <text class="layer-stage-4" x="70" y="22" font-size="13" font-weight="bold" fill="#1e293b">A</text>
    <text class="layer-stage-4" x="190" y="22" font-size="13" font-weight="bold" fill="#1e293b">D (上底 a)</text>
    <text class="layer-stage-4" x="20" y="165" font-size="13" font-weight="bold" fill="#1e293b">B</text>
    <text class="layer-stage-4" x="255" y="165" font-size="13" font-weight="bold" fill="#1e293b">C (下底 b)</text>
  </g>"""
    en_067 = """  <g transform="translate(55, 68)">
    <polygon class="layer-stage-1" points="70,30 190,30 250,150 30,150" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <line class="layer-stage-2" x1="70" y1="30" x2="70" y2="150" stroke="#dc2626" stroke-width="2" stroke-dasharray="2 2"/>
    <rect class="layer-stage-2" x="70" y="138" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-2" x="58" y="95" font-size="11" font-weight="bold" fill="#dc2626">h</text>
    <line class="layer-stage-3 formal-labels" x1="50" y1="90" x2="220" y2="90" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="50" cy="90" r="4" fill="#2563eb"/>
    <circle class="layer-stage-3 formal-labels" cx="220" cy="90" r="4" fill="#2563eb"/>
    <text class="layer-stage-3 formal-labels" x="35" y="94" font-size="11" font-weight="bold" fill="#2563eb">E</text>
    <text class="layer-stage-3 formal-labels" x="228" y="94" font-size="11" font-weight="bold" fill="#2563eb">F</text>
    <text class="layer-stage-4" x="70" y="22" font-size="12" font-weight="bold" fill="#1e293b">A</text>
    <text class="layer-stage-4" x="180" y="22" font-size="12" font-weight="bold" fill="#1e293b">D (Base a)</text>
    <text class="layer-stage-4" x="20" y="165" font-size="12" font-weight="bold" fill="#1e293b">B</text>
    <text class="layer-stage-4" x="245" y="165" font-size="12" font-weight="bold" fill="#1e293b">C (Base b)</text>
  </g>"""
    results['KP-067-zh.svg'] = build_svg_document('KP-067', '四边形', '梯形的性质', zh_067, '梯形一组对边平行：中位线 EF = (a + b)/2，面积 S = (a + b)h/2')
    results['KP-067-en.svg'] = build_svg_document('KP-067', 'Quadrilaterals', 'Trapezoid Properties', en_067, 'Midline EF = (a+b)/2, Area S = (a+b)h/2', is_en=True)

    # KP-068: 中点四边形 (瓦里尼翁中点四边形必为平行四边形)
    zh_068 = """  <g transform="translate(50, 68)">
    <!-- Arbitrary outer quadrilateral: A(80, 20), B(220, 45), C(190, 145), D(30, 125) -->
    <polygon class="layer-stage-1" points="80,20 220,45 190,145 30,125" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Inscribed Varignon Parallelogram: midpoints E(150, 32), F(205, 95), G(110, 135), H(55, 72) -->
    <polygon class="layer-stage-2" points="150,32 205,95 110,135 55,72" fill="#dcfce7" stroke="#16a34a" stroke-width="2.5"/>
    <!-- Midpoint dots -->
    <circle class="layer-stage-3 formal-labels" cx="150" cy="32" r="4" fill="#15803d"/>
    <circle class="layer-stage-3 formal-labels" cx="205" cy="95" r="4" fill="#15803d"/>
    <circle class="layer-stage-3 formal-labels" cx="110" cy="135" r="4" fill="#15803d"/>
    <circle class="layer-stage-3 formal-labels" cx="55" cy="72" r="4" fill="#15803d"/>
    <text class="layer-stage-4" x="125" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">中点四边形 EFGH</text>
    <text class="layer-stage-4" x="125" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">瓦里尼翁定理: 顺次连结各边中点必成平行四边形</text>
  </g>"""
    en_068 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="80,20 220,45 190,145 30,125" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <polygon class="layer-stage-2" points="150,32 205,95 110,135 55,72" fill="#dcfce7" stroke="#16a34a" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="150" cy="32" r="4" fill="#15803d"/>
    <circle class="layer-stage-3 formal-labels" cx="205" cy="95" r="4" fill="#15803d"/>
    <circle class="layer-stage-3 formal-labels" cx="110" cy="135" r="4" fill="#15803d"/>
    <circle class="layer-stage-3 formal-labels" cx="55" cy="72" r="4" fill="#15803d"/>
    <text class="layer-stage-4" x="125" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Midpoint Quadrilateral</text>
    <text class="layer-stage-4" x="125" y="165" text-anchor="middle" font-size="10" font-weight="bold" fill="#166534">Varignon Theorem: Connecting midpoints always forms parallelogram</text>
  </g>"""
    results['KP-068-zh.svg'] = build_svg_document('KP-068', '四边形', '中点四边形', zh_068, '瓦里尼翁定理：顺次连结任意四边形四条边的中点所得四边形是平行四边形')
    results['KP-068-en.svg'] = build_svg_document('KP-068', 'Quadrilaterals', 'Varignon Parallelogram', en_068, 'Varignon theorem: Connecting midpoints of any quadrilateral forms a parallelogram', is_en=True)

    return results
