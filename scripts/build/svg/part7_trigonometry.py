"""
分片 7: KP-085 ~ KP-091 (锐角三角函数与解直角三角形)
7 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part7():
    results = {}

    # KP-085: 正弦 sin 的定义与计算 (高亮对边 a 与斜边 c)
    zh_085 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-1" d="M70,140 A30,30 0 0,0 65,123" fill="none" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="78" y="132" font-size="12" font-weight="bold" fill="#2563eb">∠A</text>
    <!-- Highlighted Opposite Leg a -->
    <line class="layer-stage-2" x1="220" y1="40" x2="220" y2="140" stroke="#dc2626" stroke-width="3.5"/>
    <text class="layer-stage-2" x="235" y="95" font-size="12" font-weight="bold" fill="#dc2626">对边 a</text>
    <!-- Highlighted Hypotenuse c -->
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="220" y2="40" stroke="#2563eb" stroke-width="3.5"/>
    <text class="layer-stage-3 formal-labels" x="120" y="80" font-size="12" font-weight="bold" fill="#2563eb">斜边 c</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="13" font-weight="bold" fill="#dc2626">正弦定义: sin A = 对边 / 斜边 = a / c</text>
  </g>"""
    en_085 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-1" d="M70,140 A30,30 0 0,0 65,123" fill="none" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="78" y="132" font-size="11" font-weight="bold" fill="#2563eb">∠A</text>
    <line class="layer-stage-2" x1="220" y1="40" x2="220" y2="140" stroke="#dc2626" stroke-width="3.5"/>
    <text class="layer-stage-2" x="235" y="95" font-size="11" font-weight="bold" fill="#dc2626">Opposite a</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="220" y2="40" stroke="#2563eb" stroke-width="3.5"/>
    <text class="layer-stage-3 formal-labels" x="120" y="80" font-size="11" font-weight="bold" fill="#2563eb">Hypotenuse c</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">Sine: sin A = Opposite / Hypotenuse = a / c</text>
  </g>"""
    results['KP-085-zh.svg'] = build_svg_document('KP-085', '锐角三角函数', '正弦sin的定义与计算', zh_085, '在直角三角形中，锐角 A 的对边与斜边的比叫做角 A 的正弦 sin A = a/c')
    results['KP-085-en.svg'] = build_svg_document('KP-085', 'Trigonometry', 'Sine Definition & Calculation', en_085, 'Sine ratio: sin A = opposite / hypotenuse = a / c', is_en=True)

    # KP-086: 余弦 cos 的定义与计算 (高亮邻边 b 与斜边 c)
    zh_086 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-1" d="M70,140 A30,30 0 0,0 65,123" fill="none" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="78" y="132" font-size="12" font-weight="bold" fill="#2563eb">∠A</text>
    <!-- Highlighted Adjacent Leg b -->
    <line class="layer-stage-2" x1="40" y1="140" x2="220" y2="140" stroke="#16a34a" stroke-width="3.5"/>
    <text class="layer-stage-2" x="130" y="158" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">邻边 b</text>
    <!-- Highlighted Hypotenuse c -->
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="220" y2="40" stroke="#2563eb" stroke-width="3.5"/>
    <text class="layer-stage-3 formal-labels" x="120" y="80" font-size="12" font-weight="bold" fill="#2563eb">斜边 c</text>
    <text class="layer-stage-4" x="130" y="25" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">余弦定义: cos A = 邻边 / 斜边 = b / c</text>
  </g>"""
    en_086 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    <path class="layer-stage-1" d="M70,140 A30,30 0 0,0 65,123" fill="none" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="78" y="132" font-size="11" font-weight="bold" fill="#2563eb">∠A</text>
    <line class="layer-stage-2" x1="40" y1="140" x2="220" y2="140" stroke="#16a34a" stroke-width="3.5"/>
    <text class="layer-stage-2" x="130" y="158" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Adjacent b</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="220" y2="40" stroke="#2563eb" stroke-width="3.5"/>
    <text class="layer-stage-3 formal-labels" x="120" y="80" font-size="11" font-weight="bold" fill="#2563eb">Hypotenuse c</text>
    <text class="layer-stage-4" x="130" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">Cosine: cos A = Adjacent / Hypotenuse = b / c</text>
  </g>"""
    results['KP-086-zh.svg'] = build_svg_document('KP-086', '锐角三角函数', '余弦cos的定义与计算', zh_086, '在直角三角形中，锐角 A 的邻边与斜边的比叫做角 A 的余弦 cos A = b/c')
    results['KP-086-en.svg'] = build_svg_document('KP-086', 'Trigonometry', 'Cosine Definition & Calculation', en_086, 'Cosine ratio: cos A = adjacent / hypotenuse = b / c', is_en=True)

    # KP-087: 正切 tan 的定义与计算 (高亮对边 a 与邻边 b 坡度)
    zh_087 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#ca8a04" stroke-width="1.5"/>
    <!-- Highlighted legs a and b -->
    <line class="layer-stage-2" x1="220" y1="40" x2="220" y2="140" stroke="#dc2626" stroke-width="3.5"/>
    <text class="layer-stage-2" x="235" y="95" font-size="12" font-weight="bold" fill="#dc2626">对边 a (垂直高度)</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="220" y2="140" stroke="#2563eb" stroke-width="3.5"/>
    <text class="layer-stage-3 formal-labels" x="130" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">邻边 b (水平宽度)</text>
    <!-- Slope interpretation -->
    <text class="layer-stage-4" x="130" y="25" text-anchor="middle" font-size="13" font-weight="bold" fill="#b45309">正切 (坡度 i): tan A = 对边 / 邻边 = a / b</text>
  </g>"""
    en_087 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#ca8a04" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="220" y1="40" x2="220" y2="140" stroke="#dc2626" stroke-width="3.5"/>
    <text class="layer-stage-2" x="235" y="95" font-size="11" font-weight="bold" fill="#dc2626">Opposite a (Rise)</text>
    <line class="layer-stage-3 formal-labels" x1="40" y1="140" x2="220" y2="140" stroke="#2563eb" stroke-width="3.5"/>
    <text class="layer-stage-3 formal-labels" x="130" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">Adjacent b (Run)</text>
    <text class="layer-stage-4" x="130" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">Tangent (Slope): tan A = Rise / Run = a / b</text>
  </g>"""
    results['KP-087-zh.svg'] = build_svg_document('KP-087', '锐角三角函数', '正切tan的定义与计算', zh_087, '在直角三角形中，锐角 A 的对边与邻边的比叫做角 A 的正切 tan A = a/b')
    results['KP-087-en.svg'] = build_svg_document('KP-087', 'Trigonometry', 'Tangent Definition & Calculation', en_087, 'Tangent ratio: tan A = opposite / adjacent = a / b', is_en=True)

    # KP-088: 特殊角三角函数值 (30°-60°-90° 与 45°-45°-90° 双直角三角形)
    zh_088 = """  <g transform="translate(45, 68)">
    <!-- 30-60-90 Triangle -->
    <polygon class="layer-stage-1" points="20,135 110,135 110,83" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="40" y="130" font-size="10" font-weight="bold" fill="#2563eb">30°</text>
    <text class="layer-stage-2" x="65" y="150" text-anchor="middle" font-size="11" fill="#1e40af">√3</text>
    <text class="layer-stage-2" x="120" y="112" font-size="11" fill="#1e40af">1</text>
    <text class="layer-stage-2" x="60" y="100" font-size="11" fill="#1e40af">2</text>
    <!-- 45-45-90 Triangle -->
    <polygon class="layer-stage-3 formal-labels" points="160,135 240,135 240,55" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="180" y="130" font-size="10" font-weight="bold" fill="#16a34a">45°</text>
    <text class="layer-stage-3 formal-labels" x="200" y="150" text-anchor="middle" font-size="11" fill="#15803d">1</text>
    <text class="layer-stage-3 formal-labels" x="250" y="100" font-size="11" fill="#15803d">1</text>
    <text class="layer-stage-3 formal-labels" x="190" y="90" font-size="11" fill="#15803d">√2</text>
    <text class="layer-stage-4" x="130" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">特角标准比例: 1:√3:2 (30°-60°) 与 1:1:√2 (45°)</text>
  </g>"""
    en_088 = """  <g transform="translate(45, 68)">
    <polygon class="layer-stage-1" points="20,135 110,135 110,83" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="40" y="130" font-size="10" font-weight="bold" fill="#2563eb">30°</text>
    <text class="layer-stage-2" x="65" y="150" text-anchor="middle" font-size="10" fill="#1e40af">√3</text>
    <text class="layer-stage-2" x="120" y="112" font-size="10" fill="#1e40af">1</text>
    <text class="layer-stage-2" x="60" y="100" font-size="10" fill="#1e40af">2</text>
    <polygon class="layer-stage-3 formal-labels" points="160,135 240,135 240,55" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="180" y="130" font-size="10" font-weight="bold" fill="#16a34a">45°</text>
    <text class="layer-stage-3 formal-labels" x="200" y="150" text-anchor="middle" font-size="10" fill="#15803d">1</text>
    <text class="layer-stage-3 formal-labels" x="250" y="100" font-size="10" fill="#15803d">1</text>
    <text class="layer-stage-3 formal-labels" x="190" y="90" font-size="10" fill="#15803d">√2</text>
    <text class="layer-stage-4" x="130" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Standard ratios: 1:√3:2 (30°-60°) and 1:1:√2 (45°)</text>
  </g>"""
    results['KP-088-zh.svg'] = build_svg_document('KP-088', '锐角三角函数', '特殊角三角函数值', zh_088, '牢记 30°、45°、60° 角的正弦、余弦与正切三角函数值')
    results['KP-088-en.svg'] = build_svg_document('KP-088', 'Trigonometry', 'Special Angles Trig Values', en_088, 'Trig values of 30, 45, 60 degrees based on standard triangle ratios', is_en=True)

    # KP-089: 互余角的三角函数关系 (A+B=90° ⇒ sin A = cos B)
    zh_089 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-2" x="65" y="132" font-size="12" font-weight="bold" fill="#2563eb">∠A</text>
    <text class="layer-stage-2" x="205" y="60" font-size="12" font-weight="bold" fill="#dc2626">∠B</text>
    <text class="layer-stage-3 formal-labels" x="130" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="#047857">∠A + ∠B = 90°</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">互余关系: sin A = cos B, cos A = sin B, tan A · tan B = 1</text>
  </g>"""
    en_089 = """  <g transform="translate(60, 68)">
    <polygon class="layer-stage-1" points="40,140 220,140 220,40" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <rect class="layer-stage-1" x="208" y="128" width="12" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-2" x="65" y="132" font-size="11" font-weight="bold" fill="#2563eb">∠A</text>
    <text class="layer-stage-2" x="205" y="60" font-size="11" font-weight="bold" fill="#dc2626">∠B</text>
    <text class="layer-stage-3 formal-labels" x="130" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">∠A + ∠B = 90°</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Complementary: sin A = cos B, tan A · tan B = 1</text>
  </g>"""
    results['KP-089-zh.svg'] = build_svg_document('KP-089', '锐角三角函数', '互余角的三角函数关系', zh_089, '若 ∠A + ∠B = 90°，则 sin A = cos B，cos A = sin B，tan A · tan B = 1')
    results['KP-089-en.svg'] = build_svg_document('KP-089', 'Trigonometry', 'Complementary Angle Relations', en_089, 'Complementary angles: sin A = cos B, cos A = sin B, tan A · tan B = 1', is_en=True)

    # KP-090: 三角函数的实际应用 (测高仰角俯角模型 h = d · tan α)
    zh_090 = """  <g transform="translate(45, 68)">
    <!-- Ground line -->
    <line class="layer-stage-1" x1="20" y1="140" x2="260" y2="140" stroke="#475569" stroke-width="2"/>
    <!-- Tower -->
    <rect class="layer-stage-2" x="210" y="30" width="25" height="110" fill="#94a3b8"/>
    <text class="layer-stage-2" x="245" y="85" font-size="12" font-weight="bold" fill="#dc2626">高 h</text>
    <!-- Observer Point P -->
    <circle class="layer-stage-3 formal-labels" cx="50" cy="140" r="4" fill="#2563eb"/>
    <line class="layer-stage-3 formal-labels" x1="50" y1="140" x2="210" y2="30" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="80" y="132" font-size="11" font-weight="bold" fill="#ea580c">仰角 α</text>
    <text class="layer-stage-4" x="130" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">水平距离 d</text>
    <text class="layer-stage-4" x="130" y="15" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">实际测高模型: h = d · tan α</text>
  </g>"""
    en_090 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="140" x2="260" y2="140" stroke="#475569" stroke-width="2"/>
    <rect class="layer-stage-2" x="210" y="30" width="25" height="110" fill="#94a3b8"/>
    <text class="layer-stage-2" x="245" y="85" font-size="11" font-weight="bold" fill="#dc2626">Height h</text>
    <circle class="layer-stage-3 formal-labels" cx="50" cy="140" r="4" fill="#2563eb"/>
    <line class="layer-stage-3 formal-labels" x1="50" y1="140" x2="210" y2="30" stroke="#ea580c" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="80" y="132" font-size="10" font-weight="bold" fill="#ea580c">Angle α</text>
    <text class="layer-stage-4" x="130" y="155" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Distance d</text>
    <text class="layer-stage-4" x="130" y="15" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Elevation Model: h = d · tan α</text>
  </g>"""
    results['KP-090-zh.svg'] = build_svg_document('KP-090', '解直角三角形', '三角函数的实际应用', zh_090, '将仰角、俯角、坡度等实际问题转化为直角三角形三角比求解')
    results['KP-090-en.svg'] = build_svg_document('KP-090', 'Trigonometry', 'Practical Applications', en_090, 'Solving elevation, depression angles and slopes via right triangle models', is_en=True)

    # KP-091: 解直角三角形 (作高线拆分为两个联立直角三角形)
    zh_091 = """  <g transform="translate(50, 68)">
    <!-- Oblique triangle: A(30, 140), B(220, 140), C(140, 30) -->
    <polygon class="layer-stage-1" points="30,140 220,140 140,30" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <!-- Constructed Altitude CD perpendicular to AB -->
    <line class="layer-stage-2" x1="140" y1="30" x2="140" y2="140" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3 3"/>
    <rect class="layer-stage-2" x="140" y="128" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-2" x="148" y="90" font-size="12" font-weight="bold" fill="#dc2626">高 h</text>
    <text class="layer-stage-3 formal-labels" x="80" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">Rt△ACD</text>
    <text class="layer-stage-3 formal-labels" x="180" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a">Rt△BCD</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">化斜为直: 作高转化为两个直角三角形联立求解</text>
  </g>"""
    en_091 = """  <g transform="translate(50, 68)">
    <polygon class="layer-stage-1" points="30,140 220,140 140,30" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <line class="layer-stage-2" x1="140" y1="30" x2="140" y2="140" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="3 3"/>
    <rect class="layer-stage-2" x="140" y="128" width="12" height="12" fill="none" stroke="#dc2626" stroke-width="1.5"/>
    <text class="layer-stage-2" x="148" y="90" font-size="11" font-weight="bold" fill="#dc2626">Height h</text>
    <text class="layer-stage-3 formal-labels" x="80" y="105" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">Rt△ACD</text>
    <text class="layer-stage-3 formal-labels" x="180" y="105" text-anchor="middle" font-size="10" font-weight="bold" fill="#16a34a">Rt△BCD</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Decomposition: Split oblique triangle into two right triangles</text>
  </g>"""
    results['KP-091-zh.svg'] = build_svg_document('KP-091', '解直角三角形', '解直角三角形', zh_091, '根据已知元素（至少有一条边），利用勾股定理和锐角三角比求出其余未知元素')
    results['KP-091-en.svg'] = build_svg_document('KP-091', 'Trigonometry', 'Solving Right Triangles', en_091, 'Solving unknowns using Pythagorean theorem and trig ratios with known side', is_en=True)

    return results
