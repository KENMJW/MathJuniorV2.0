"""
分片 8: KP-092 ~ KP-107 (统计图表与概率模型)
16 个考点 100% 专属独立几何图形，彻底杜绝任何模板复用！
"""

from .svg_builder import build_svg_document

def generate_part8():
    results = {}

    # KP-092: 普查与抽样调查 (总体漏斗抽取样本)
    zh_092 = """  <g transform="translate(50, 68)">
    <!-- Population box -->
    <ellipse class="layer-stage-1" cx="130" cy="35" rx="90" ry="25" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="130" y="38" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">总体 N (所有考察对象)</text>
    <!-- Funnel / sampling arrows -->
    <path class="layer-stage-2" d="M80,60 L110,95 M180,60 L150,95" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-2" x="130" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">随机抽样</text>
    <!-- Sample box -->
    <rect class="layer-stage-3 formal-labels" x="75" y="98" width="110" height="40" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="130" y="122" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">样本容量 n</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">用样本特征估计总体特征 (代表性与随机性)</text>
  </g>"""
    en_092 = """  <g transform="translate(50, 68)">
    <ellipse class="layer-stage-1" cx="130" cy="35" rx="90" ry="25" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
    <text class="layer-stage-1" x="130" y="38" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Population N</text>
    <path class="layer-stage-2" d="M80,60 L110,95 M180,60 L150,95" stroke="#ea580c" stroke-width="2" stroke-dasharray="3 3"/>
    <text class="layer-stage-2" x="130" y="80" text-anchor="middle" font-size="10" font-weight="bold" fill="#ea580c">Random Sampling</text>
    <rect class="layer-stage-3 formal-labels" x="75" y="98" width="110" height="40" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="130" y="122" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Sample Size n</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Inferring population traits from representative sample</text>
  </g>"""
    results['KP-092-zh.svg'] = build_svg_document('KP-092', '统计调查', '普查与抽样调查', zh_092, '全面调查耗资费时时采用抽样调查，抽样必须具备随机性与代表性')
    results['KP-092-en.svg'] = build_svg_document('KP-092', 'Surveys', 'Census and Sample Surveys', en_092, 'Sample surveys infer population metrics when a full census is impractical', is_en=True)

    # KP-093: 频数频率与频率分布直方图 (阶梯直方柱与组距)
    zh_093 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="140" x2="270" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="30" y="25" font-size="11" fill="#64748b">频数/组距</text>
    <!-- Histogram Bars -->
    <rect class="layer-stage-2" x="50" y="90" width="40" height="50" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="90" y="45" width="40" height="95" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="130" y="65" width="40" height="75" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="170" y="110" width="40" height="30" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>
    <!-- Stage 3 Frequency Labels -->
    <text class="layer-stage-3 formal-labels" x="70" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">10</text>
    <text class="layer-stage-3 formal-labels" x="110" y="40" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">24</text>
    <text class="layer-stage-3 formal-labels" x="150" y="60" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">16</text>
    <text class="layer-stage-3 formal-labels" x="190" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">6</text>
    <text class="layer-stage-4" x="145" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">直方图小长方形面积之和 = 总频数 (频率和为 1)</text>
  </g>"""
    en_093 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="140" x2="270" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="50" y="90" width="40" height="50" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="90" y="45" width="40" height="95" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="130" y="65" width="40" height="75" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="170" y="110" width="40" height="30" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="70" y="85" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">10</text>
    <text class="layer-stage-3 formal-labels" x="110" y="40" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">24</text>
    <text class="layer-stage-3 formal-labels" x="150" y="60" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">16</text>
    <text class="layer-stage-3 formal-labels" x="190" y="105" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">6</text>
    <text class="layer-stage-4" x="145" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Total bar area = Total frequency (relative sum = 1)</text>
  </g>"""
    results['KP-093-zh.svg'] = build_svg_document('KP-093', '统计图表', '频数频率与频率分布直方图', zh_093, '频数与总次数的比为频率，直方图各组小长方形的高与频数成正比')
    results['KP-093-en.svg'] = build_svg_document('KP-093', 'Statistics', 'Histograms & Frequencies', en_093, 'Frequency histogram shows data distribution; bar areas sum to total count', is_en=True)

    # KP-094: 扇形统计图 (扇形百分比圆环)
    zh_094 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="90" r="65" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M140,90 L205,90 A65,65 0 0,1 140,155 Z" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M140,90 L140,155 A65,65 0 0,1 75,90 Z" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M140,90 L75,90 A65,65 0 0,1 205,90 Z" fill="#fdba74" stroke="#ea580c" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="140" y="55" text-anchor="middle" font-size="13" font-weight="bold" fill="#9a3412">A类 50% (180°)</text>
    <text class="layer-stage-3 formal-labels" x="175" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">B类 25%</text>
    <text class="layer-stage-3 formal-labels" x="105" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534">C类 25%</text>
    <circle class="layer-stage-4" cx="140" cy="90" r="4" fill="#1e293b"/>
    <text class="layer-stage-4" x="140" y="175" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">圆心角 = 360° × 百分比</text>
  </g>"""
    en_094 = """  <g transform="translate(60, 68)">
    <circle class="layer-stage-1" cx="140" cy="90" r="65" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M140,90 L205,90 A65,65 0 0,1 140,155 Z" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M140,90 L140,155 A65,65 0 0,1 75,90 Z" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
    <path class="layer-stage-2" d="M140,90 L75,90 A65,65 0 0,1 205,90 Z" fill="#fdba74" stroke="#ea580c" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="140" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="#9a3412">A: 50% (180°)</text>
    <text class="layer-stage-3 formal-labels" x="175" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">B: 25%</text>
    <text class="layer-stage-3 formal-labels" x="105" y="125" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534">C: 25%</text>
    <circle class="layer-stage-4" cx="140" cy="90" r="4" fill="#1e293b"/>
    <text class="layer-stage-4" x="140" y="175" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Central Angle = 360° × Percentage</text>
  </g>"""
    results['KP-094-zh.svg'] = build_svg_document('KP-094', '数据分析', '扇形统计图', zh_094, '扇形统计图反映各部分占总体的百分比：圆心角 = 360° × 百分比')
    results['KP-094-en.svg'] = build_svg_document('KP-094', 'Statistics', 'Sector Graphs (Pie Charts)', en_094, 'Pie charts reflect proportions: Central Angle = 360° × Percentage', is_en=True)

    # KP-095: 折线统计图 (时间波动折线图)
    zh_095 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="140" x2="280" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="280" y="135" font-size="11" fill="#64748b">时间</text>
    <polyline class="layer-stage-2" points="50,110 100,60 150,90 200,40 250,70" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="50" cy="110" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="100" cy="60" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="150" cy="90" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="200" cy="40" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="250" cy="70" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-4" x="200" y="30" font-size="11" font-weight="bold" fill="#dc2626">峰值</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">动态变化与波动趋势</text>
  </g>"""
    en_095 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="140" x2="280" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="275" y="135" font-size="11" fill="#64748b">Time</text>
    <polyline class="layer-stage-2" points="50,110 100,60 150,90 200,40 250,70" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <circle class="layer-stage-3 formal-labels" cx="50" cy="110" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="100" cy="60" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="150" cy="90" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="200" cy="40" r="4.5" fill="#dc2626"/>
    <circle class="layer-stage-3 formal-labels" cx="250" cy="70" r="4.5" fill="#dc2626"/>
    <text class="layer-stage-4" x="200" y="30" font-size="11" font-weight="bold" fill="#dc2626">Peak</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Fluctuation Trends</text>
  </g>"""
    results['KP-095-zh.svg'] = build_svg_document('KP-095', '数据分析', '折线统计图', zh_095, '折线统计图能清晰反映数据随时间的波动与增减趋势')
    results['KP-095-en.svg'] = build_svg_document('KP-095', 'Statistics', 'Line Graphs', en_095, 'Line graphs clearly indicate data fluctuations and trends over time', is_en=True)

    # KP-096: 茎叶图 (茎与叶全息原始数据展示)
    zh_096 = """  <g transform="translate(60, 68)">
    <line class="layer-stage-1" x1="80" y1="20" x2="80" y2="150" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-1" x="50" y="35" font-size="12" font-weight="bold" fill="#2563eb">茎(十位)</text>
    <text class="layer-stage-1" x="120" y="35" font-size="12" font-weight="bold" fill="#16a34a">叶(个位)</text>
    <!-- Row 1: 1 | 2 5 8 -->
    <text class="layer-stage-2" x="55" y="65" font-size="14" font-weight="bold" fill="#2563eb">1</text>
    <text class="layer-stage-3 formal-labels" x="110" y="65" font-size="14" font-family="monospace" fill="#15803d">2  5  8</text>
    <!-- Row 2: 2 | 0 3 7 9 -->
    <text class="layer-stage-2" x="55" y="95" font-size="14" font-weight="bold" fill="#2563eb">2</text>
    <text class="layer-stage-3 formal-labels" x="110" y="95" font-size="14" font-family="monospace" fill="#15803d">0  3  7  9</text>
    <!-- Row 3: 3 | 1 4 -->
    <text class="layer-stage-2" x="55" y="125" font-size="14" font-weight="bold" fill="#2563eb">3</text>
    <text class="layer-stage-3 formal-labels" x="110" y="125" font-size="14" font-family="monospace" fill="#15803d">1  4</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#475569">全息保留原始数值信息与分布形态</text>
  </g>"""
    en_096 = """  <g transform="translate(60, 68)">
    <line class="layer-stage-1" x1="80" y1="20" x2="80" y2="150" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-1" x="45" y="35" font-size="11" font-weight="bold" fill="#2563eb">Stem</text>
    <text class="layer-stage-1" x="120" y="35" font-size="11" font-weight="bold" fill="#16a34a">Leaf</text>
    <text class="layer-stage-2" x="55" y="65" font-size="13" font-weight="bold" fill="#2563eb">1</text>
    <text class="layer-stage-3 formal-labels" x="110" y="65" font-size="13" font-family="monospace" fill="#15803d">2  5  8</text>
    <text class="layer-stage-2" x="55" y="95" font-size="13" font-weight="bold" fill="#2563eb">2</text>
    <text class="layer-stage-3 formal-labels" x="110" y="95" font-size="13" font-family="monospace" fill="#15803d">0  3  7  9</text>
    <text class="layer-stage-2" x="55" y="125" font-size="13" font-weight="bold" fill="#2563eb">3</text>
    <text class="layer-stage-3 formal-labels" x="110" y="125" font-size="13" font-family="monospace" fill="#15803d">1  4</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Preserves raw data values and distribution shape</text>
  </g>"""
    results['KP-096-zh.svg'] = build_svg_document('KP-096', '统计图表', '茎叶图', zh_096, '茎叶图用高位做茎、低位做叶，完整保留所有原始数据且展示分布')
    results['KP-096-en.svg'] = build_svg_document('KP-096', 'Statistics', 'Stem-and-Leaf Displays', en_096, 'Stem-and-leaf retains raw data values while showing visual distribution', is_en=True)

    # KP-097: 平均数 (天平杠杆力矩重心支点模型)
    zh_097 = """  <g transform="translate(50, 68)">
    <line class="layer-stage-1" x1="20" y1="100" x2="260" y2="100" stroke="#334155" stroke-width="4"/>
    <!-- Fulcrum at mean x_bar -->
    <polygon class="layer-stage-2" points="140,100 125,130 155,130" fill="#dc2626"/>
    <text class="layer-stage-2" x="140" y="145" text-anchor="middle" font-size="13" font-weight="bold" fill="#dc2626">重心支点 x̄ (平均数)</text>
    <!-- Data weights on lever -->
    <rect class="layer-stage-3 formal-labels" x="40" y="70" width="30" height="30" rx="4" fill="#93c5fd" stroke="#2563eb"/>
    <text class="layer-stage-3 formal-labels" x="55" y="90" text-anchor="middle" font-size="11" font-weight="bold">x₁</text>
    <rect class="layer-stage-3 formal-labels" x="210" y="70" width="30" height="30" rx="4" fill="#93c5fd" stroke="#2563eb"/>
    <text class="layer-stage-3 formal-labels" x="225" y="90" text-anchor="middle" font-size="11" font-weight="bold">x₂</text>
    <text class="layer-stage-4" x="140" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">平均数公式: x̄ = (x₁ + x₂ + … + x_n) / n</text>
  </g>"""
    en_097 = """  <g transform="translate(50, 68)">
    <line class="layer-stage-1" x1="20" y1="100" x2="260" y2="100" stroke="#334155" stroke-width="4"/>
    <polygon class="layer-stage-2" points="140,100 125,130 155,130" fill="#dc2626"/>
    <text class="layer-stage-2" x="140" y="145" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Fulcrum x̄ (Mean)</text>
    <rect class="layer-stage-3 formal-labels" x="40" y="70" width="30" height="30" rx="4" fill="#93c5fd" stroke="#2563eb"/>
    <text class="layer-stage-3 formal-labels" x="55" y="90" text-anchor="middle" font-size="10" font-weight="bold">x₁</text>
    <rect class="layer-stage-3 formal-labels" x="210" y="70" width="30" height="30" rx="4" fill="#93c5fd" stroke="#2563eb"/>
    <text class="layer-stage-3 formal-labels" x="225" y="90" text-anchor="middle" font-size="10" font-weight="bold">x₂</text>
    <text class="layer-stage-4" x="140" y="35" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Mean: x̄ = (x₁ + x₂ + … + x_n) / n</text>
  </g>"""
    results['KP-097-zh.svg'] = build_svg_document('KP-097', '数据特征', '平均数', zh_097, '算术平均数反映一组数据的总体集中平均水平，受极端值影响较大')
    results['KP-097-en.svg'] = build_svg_document('KP-097', 'Data Analysis', 'Arithmetic Mean', en_097, 'Arithmetic mean reflects central tendency as center of mass; sensitive to outliers', is_en=True)

    # KP-098: 中位数 (有序数列居中切割 50% 处)
    zh_098 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="80" x2="270" y2="80" stroke="#94a3b8" stroke-width="2"/>
    <!-- Ordered data points -->
    <circle class="layer-stage-2" cx="40" cy="80" r="5" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="80" cy="80" r="5" fill="#2563eb"/>
    <circle class="layer-stage-3 formal-labels" cx="145" cy="80" r="7" fill="#dc2626"/>
    <circle class="layer-stage-2" cx="210" cy="80" r="5" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="250" cy="80" r="5" fill="#2563eb"/>
    <!-- Median divider arrow -->
    <line class="layer-stage-3 formal-labels" x1="145" y1="35" x2="145" y2="70" stroke="#dc2626" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="145,75 141,67 149,67" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="145" y="25" text-anchor="middle" font-size="13" font-weight="bold" fill="#dc2626">中位数 (正中 50% 处)</text>
    <text class="layer-stage-4" x="80" y="115" text-anchor="middle" font-size="11" fill="#1e40af">较小一半 50%</text>
    <text class="layer-stage-4" x="210" y="115" text-anchor="middle" font-size="11" fill="#1e40af">较大一半 50%</text>
    <text class="layer-stage-4" x="145" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">排序后居中的数，不受极端值影响</text>
  </g>"""
    en_098 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="80" x2="270" y2="80" stroke="#94a3b8" stroke-width="2"/>
    <circle class="layer-stage-2" cx="40" cy="80" r="5" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="80" cy="80" r="5" fill="#2563eb"/>
    <circle class="layer-stage-3 formal-labels" cx="145" cy="80" r="7" fill="#dc2626"/>
    <circle class="layer-stage-2" cx="210" cy="80" r="5" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="250" cy="80" r="5" fill="#2563eb"/>
    <line class="layer-stage-3 formal-labels" x1="145" y1="35" x2="145" y2="70" stroke="#dc2626" stroke-width="2"/>
    <polygon class="layer-stage-3 formal-labels" points="145,75 141,67 149,67" fill="#dc2626"/>
    <text class="layer-stage-3 formal-labels" x="145" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Median (Middle 50%)</text>
    <text class="layer-stage-4" x="80" y="115" text-anchor="middle" font-size="10" fill="#1e40af">Lower 50%</text>
    <text class="layer-stage-4" x="210" y="115" text-anchor="middle" font-size="10" fill="#1e40af">Upper 50%</text>
    <text class="layer-stage-4" x="145" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Middle value in sorted data; robust to outliers</text>
  </g>"""
    results['KP-098-zh.svg'] = build_svg_document('KP-098', '数据特征', '中位数', zh_098, '将数据按大小顺序排列，居于最中间位置的数叫做中位数')
    results['KP-098-en.svg'] = build_svg_document('KP-098', 'Data Analysis', 'Median', en_098, 'Median is the middle value separating the higher half from the lower half', is_en=True)

    # KP-099: 众数 (频数最高峰值柱)
    zh_099 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="135" x2="270" y2="135" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="50" y="90" width="35" height="45" fill="#93c5fd"/>
    <!-- Peak Bar (Mode) -->
    <rect class="layer-stage-3 formal-labels" x="100" y="30" width="35" height="105" fill="#f87171" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="117" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">最高频次 (众数)</text>
    <rect class="layer-stage-2" x="150" y="70" width="35" height="65" fill="#93c5fd"/>
    <rect class="layer-stage-2" x="200" y="100" width="35" height="35" fill="#93c5fd"/>
    <text class="layer-stage-4" x="145" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">出现次数最多的数值 (可有多个或无)</text>
  </g>"""
    en_099 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="135" x2="270" y2="135" stroke="#94a3b8" stroke-width="1.5"/>
    <rect class="layer-stage-2" x="50" y="90" width="35" height="45" fill="#93c5fd"/>
    <rect class="layer-stage-3 formal-labels" x="100" y="30" width="35" height="105" fill="#f87171" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="117" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Mode (Peak)</text>
    <rect class="layer-stage-2" x="150" y="70" width="35" height="65" fill="#93c5fd"/>
    <rect class="layer-stage-2" x="200" y="100" width="35" height="35" fill="#93c5fd"/>
    <text class="layer-stage-4" x="145" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Value appearing with the highest frequency</text>
  </g>"""
    results['KP-099-zh.svg'] = build_svg_document('KP-099', '数据特征', '众数', zh_099, '一组数据中出现次数最多的数值叫做众数，反映大多数数据的集中趋势')
    results['KP-099-en.svg'] = build_svg_document('KP-099', 'Data Analysis', 'Mode', en_099, 'The mode is the value that appears most frequently in a data set', is_en=True)

    # KP-100: 极差 (最大值与最小值之差的跨度)
    zh_100 = """  <g transform="translate(45, 75)">
    <line class="layer-stage-1" x1="20" y1="70" x2="270" y2="70" stroke="#94a3b8" stroke-width="2"/>
    <!-- Min point -->
    <circle class="layer-stage-2" cx="50" cy="70" r="6" fill="#2563eb"/>
    <text class="layer-stage-2" x="50" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">最小值 x_min</text>
    <!-- Max point -->
    <circle class="layer-stage-2" cx="240" cy="70" r="6" fill="#2563eb"/>
    <text class="layer-stage-2" x="240" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">最大值 x_max</text>
    <!-- Range span arrow -->
    <line class="layer-stage-3 formal-labels" x1="50" y1="45" x2="240" y2="45" stroke="#ea580c" stroke-width="2.5"/>
    <polygon class="layer-stage-3 formal-labels" points="50,45 58,40 58,50" fill="#ea580c"/>
    <polygon class="layer-stage-3 formal-labels" points="240,45 232,40 232,50" fill="#ea580c"/>
    <text class="layer-stage-4" x="145" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="#ea580c">极差 R = x_max - x_min</text>
    <text class="layer-stage-4" x="145" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">粗略反映数据变化的极端跨度范围</text>
  </g>"""
    en_100 = """  <g transform="translate(45, 75)">
    <line class="layer-stage-1" x1="20" y1="70" x2="270" y2="70" stroke="#94a3b8" stroke-width="2"/>
    <circle class="layer-stage-2" cx="50" cy="70" r="6" fill="#2563eb"/>
    <text class="layer-stage-2" x="50" y="95" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">Min x_min</text>
    <circle class="layer-stage-2" cx="240" cy="70" r="6" fill="#2563eb"/>
    <text class="layer-stage-2" x="240" y="95" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">Max x_max</text>
    <line class="layer-stage-3 formal-labels" x1="50" y1="45" x2="240" y2="45" stroke="#ea580c" stroke-width="2.5"/>
    <polygon class="layer-stage-3 formal-labels" points="50,45 58,40 58,50" fill="#ea580c"/>
    <polygon class="layer-stage-3 formal-labels" points="240,45 232,40 232,50" fill="#ea580c"/>
    <text class="layer-stage-4" x="145" y="35" text-anchor="middle" font-size="11" font-weight="bold" fill="#ea580c">Range: R = x_max - x_min</text>
    <text class="layer-stage-4" x="145" y="130" text-anchor="middle" font-size="10" font-weight="bold" fill="#047857">Measures overall spread between extremes</text>
  </g>"""
    results['KP-100-zh.svg'] = build_svg_document('KP-100', '数据分析', '极差', zh_100, '极差是一组数据中最大值与最小值的差，反映数据波动范围的大小')
    results['KP-100-en.svg'] = build_svg_document('KP-100', 'Data Analysis', 'Range', en_100, 'Range is the difference between the highest and lowest values in a dataset', is_en=True)

    # KP-101: 方差与标准差 (散点偏离均值距离的平方和)
    zh_101 = """  <g transform="translate(45, 68)">
    <!-- Mean line -->
    <line class="layer-stage-1" x1="20" y1="85" x2="270" y2="85" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-1" x="275" y="90" font-size="12" font-weight="bold" fill="#15803d">x̄ (均值)</text>
    <!-- Scattered points and deviation distances -->
    <circle class="layer-stage-2" cx="60" cy="50" r="5" fill="#2563eb"/>
    <line class="layer-stage-2" x1="60" y1="50" x2="60" y2="85" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <circle class="layer-stage-2" cx="120" cy="120" r="5" fill="#2563eb"/>
    <line class="layer-stage-2" x1="120" y1="85" x2="120" y2="120" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <circle class="layer-stage-2" cx="190" cy="40" r="5" fill="#2563eb"/>
    <line class="layer-stage-2" x1="190" y1="40" x2="190" y2="85" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-3 formal-labels" x="145" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#dc2626">偏差平方 (x_i - x̄)²</text>
    <text class="layer-stage-4" x="145" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">方差 s² 越小，数据波动越小，稳定性越高</text>
  </g>"""
    en_101 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="85" x2="270" y2="85" stroke="#16a34a" stroke-width="2"/>
    <text class="layer-stage-1" x="275" y="90" font-size="11" font-weight="bold" fill="#15803d">x̄ (Mean)</text>
    <circle class="layer-stage-2" cx="60" cy="50" r="5" fill="#2563eb"/>
    <line class="layer-stage-2" x1="60" y1="50" x2="60" y2="85" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <circle class="layer-stage-2" cx="120" cy="120" r="5" fill="#2563eb"/>
    <line class="layer-stage-2" x1="120" y1="85" x2="120" y2="120" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <circle class="layer-stage-2" cx="190" cy="40" r="5" fill="#2563eb"/>
    <line class="layer-stage-2" x1="190" y1="40" x2="190" y2="85" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text class="layer-stage-3 formal-labels" x="145" y="25" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Deviation² (x_i - x̄)²</text>
    <text class="layer-stage-4" x="145" y="155" text-anchor="middle" font-size="10" font-weight="bold" fill="#047857">Smaller variance indicates higher stability</text>
  </g>"""
    results['KP-101-zh.svg'] = build_svg_document('KP-101', '数据分析', '方差与标准差', zh_101, '方差是各数据与平均数之差的平方的平均值，用来衡量数据稳定性')
    results['KP-101-en.svg'] = build_svg_document('KP-101', 'Data Analysis', 'Variance & Standard Deviation', en_101, 'Variance measures the dispersion and fluctuation around the mean', is_en=True)

    # KP-102: 利用统计量综合判断 (实力均值 vs 稳定方差 二维决策平面)
    zh_102 = """  <g transform="translate(50, 68)">
    <line class="layer-stage-1" x1="20" y1="130" x2="250" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="255" y="135" font-size="11" fill="#64748b">均值 (水平)</text>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="35" y="15" font-size="11" fill="#64748b">方差 (波动)</text>
    <!-- Candidate A: High mean, low variance (Best) -->
    <circle class="layer-stage-2" cx="200" cy="100" r="7" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="200" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">甲选手 (优选)</text>
    <!-- Candidate B: High mean, high variance -->
    <circle class="layer-stage-2" cx="200" cy="45" r="6" fill="#ea580c"/>
    <text class="layer-stage-3 formal-labels" x="200" y="35" text-anchor="middle" font-size="11" fill="#c2410c">乙选手</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">决策准则: 均值高 (实力强) 且 方差小 (发挥稳)</text>
  </g>"""
    en_102 = """  <g transform="translate(50, 68)">
    <line class="layer-stage-1" x1="20" y1="130" x2="250" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="255" y="135" font-size="10" fill="#64748b">Mean</text>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="35" y="15" font-size="10" fill="#64748b">Variance</text>
    <circle class="layer-stage-2" cx="200" cy="100" r="7" fill="#16a34a"/>
    <text class="layer-stage-3 formal-labels" x="200" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">Player A (Best)</text>
    <circle class="layer-stage-2" cx="200" cy="45" r="6" fill="#ea580c"/>
    <text class="layer-stage-3 formal-labels" x="200" y="35" text-anchor="middle" font-size="10" fill="#c2410c">Player B</text>
    <text class="layer-stage-4" x="140" y="160" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Criteria: High Mean (Ability) + Low Variance (Stability)</text>
  </g>"""
    results['KP-102-zh.svg'] = build_svg_document('KP-102', '数据分析', '利用统计量综合判断', zh_102, '综合运用均值、中位数、众数与方差对实际问题进行合理决策评估')
    results['KP-102-en.svg'] = build_svg_document('KP-102', 'Data Analysis', 'Statistical Decision Making', en_102, 'Comprehensive decisions combining mean (strength) and variance (stability)', is_en=True)

    # KP-103: 随机事件与确定性事件 (概率区间 [0, 1] 标尺)
    zh_103 = """  <g transform="translate(45, 75)">
    <line class="layer-stage-1" x1="20" y1="75" x2="270" y2="75" stroke="#94a3b8" stroke-width="3"/>
    <!-- Left endpoint P=0 -->
    <circle class="layer-stage-2" cx="40" cy="75" r="6" fill="#dc2626"/>
    <text class="layer-stage-2" x="40" y="100" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">P = 0</text>
    <text class="layer-stage-2" x="40" y="120" text-anchor="middle" font-size="11" fill="#dc2626">不可能事件</text>
    <!-- Right endpoint P=1 -->
    <circle class="layer-stage-2" cx="250" cy="75" r="6" fill="#16a34a"/>
    <text class="layer-stage-2" x="250" y="100" text-anchor="middle" font-size="11" font-weight="bold" fill="#15803d">P = 1</text>
    <text class="layer-stage-2" x="250" y="120" text-anchor="middle" font-size="11" fill="#15803d">必然事件</text>
    <!-- Interval (0, 1) Random Events -->
    <rect class="layer-stage-3 formal-labels" x="70" y="35" width="150" height="25" rx="6" fill="#fef3c7" stroke="#d97706"/>
    <text class="layer-stage-3 formal-labels" x="145" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">随机事件 (0 &lt; P &lt; 1)</text>
    <text class="layer-stage-4" x="145" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">确定性事件 (P=0 或 P=1) 与 随机不确定事件</text>
  </g>"""
    en_103 = """  <g transform="translate(45, 75)">
    <line class="layer-stage-1" x1="20" y1="75" x2="270" y2="75" stroke="#94a3b8" stroke-width="3"/>
    <circle class="layer-stage-2" cx="40" cy="75" r="6" fill="#dc2626"/>
    <text class="layer-stage-2" x="40" y="100" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">P = 0</text>
    <text class="layer-stage-2" x="40" y="120" text-anchor="middle" font-size="10" fill="#dc2626">Impossible</text>
    <circle class="layer-stage-2" cx="250" cy="75" r="6" fill="#16a34a"/>
    <text class="layer-stage-2" x="250" y="100" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">P = 1</text>
    <text class="layer-stage-2" x="250" y="120" text-anchor="middle" font-size="10" fill="#15803d">Certain</text>
    <rect class="layer-stage-3 formal-labels" x="70" y="35" width="150" height="25" rx="6" fill="#fef3c7" stroke="#d97706"/>
    <text class="layer-stage-3 formal-labels" x="145" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">Random (0 &lt; P &lt; 1)</text>
    <text class="layer-stage-4" x="145" y="150" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Certain events (P=0 or 1) vs Random events</text>
  </g>"""
    results['KP-103-zh.svg'] = build_svg_document('KP-103', '概率', '随机事件与确定性事件', zh_103, '必然事件概率为 1，不可能事件概率为 0，随机事件概率介于 0 与 1 之间')
    results['KP-103-en.svg'] = build_svg_document('KP-103', 'Probability', 'Random and Certain Events', en_103, 'Certain event has P=1, impossible P=0, and random event has 0 < P < 1', is_en=True)

    # KP-104: 概率的定义与基本性质 (几何概型面积比 P = S1 / S)
    zh_104 = """  <g transform="translate(60, 68)">
    <!-- Outer Target Board Area S -->
    <rect class="layer-stage-1" x="25" y="25" width="130" height="130" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-1" x="35" y="45" font-size="12" font-weight="bold" fill="#475569">总区域面积 S</text>
    <!-- Inner Bullseye Area S1 -->
    <circle class="layer-stage-2" cx="90" cy="90" r="40" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="90" y="95" text-anchor="middle" font-size="13" font-weight="bold" fill="#dc2626">目标 S₁</text>
    <text class="layer-stage-4" x="90" y="175" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">几何概率: P = S₁ / S (0 ≤ P ≤ 1)</text>
  </g>"""
    en_104 = """  <g transform="translate(60, 68)">
    <rect class="layer-stage-1" x="25" y="25" width="130" height="130" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <text class="layer-stage-1" x="35" y="45" font-size="11" font-weight="bold" fill="#475569">Total Area S</text>
    <circle class="layer-stage-2" cx="90" cy="90" r="40" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
    <text class="layer-stage-3 formal-labels" x="90" y="95" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Target S₁</text>
    <text class="layer-stage-4" x="90" y="175" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Geometric Prob: P = S₁ / S</text>
  </g>"""
    results['KP-104-zh.svg'] = build_svg_document('KP-104', '概率', '概率的定义与基本性质', zh_104, '事件发生可能性大小的度量为概率，几何概型中概率等于目标面积与总面积之比')
    results['KP-104-en.svg'] = build_svg_document('KP-104', 'Probability', 'Probability Definition & Properties', en_104, 'Geometric probability: ratio of favorable area to total sample space area', is_en=True)

    # KP-105: 列举法求概率 (二维结果矩阵格子穷举 P = m/n)
    zh_105 = """  <g transform="translate(60, 68)">
    <!-- 3x3 Outcome Grid -->
    <rect class="layer-stage-1" x="30" y="25" width="120" height="120" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="70" y1="25" x2="70" y2="145" stroke="#94a3b8"/>
    <line class="layer-stage-1" x1="110" y1="25" x2="110" y2="145" stroke="#94a3b8"/>
    <line class="layer-stage-1" x1="30" y1="65" x2="150" y2="65" stroke="#94a3b8"/>
    <line class="layer-stage-1" x1="30" y1="105" x2="150" y2="105" stroke="#94a3b8"/>
    <!-- Favorable outcomes shaded -->
    <rect class="layer-stage-2" x="70" y="25" width="40" height="40" fill="#dcfce7"/>
    <rect class="layer-stage-2" x="30" y="65" width="40" height="40" fill="#dcfce7"/>
    <text class="layer-stage-3 formal-labels" x="90" y="50" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">✓</text>
    <text class="layer-stage-3 formal-labels" x="50" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">✓</text>
    <text class="layer-stage-4" x="90" y="170" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">古典概型: P(A) = m / n (有利结果/全部结果)</text>
  </g>"""
    en_105 = """  <g transform="translate(60, 68)">
    <rect class="layer-stage-1" x="30" y="25" width="120" height="120" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
    <line class="layer-stage-1" x1="70" y1="25" x2="70" y2="145" stroke="#94a3b8"/>
    <line class="layer-stage-1" x1="110" y1="25" x2="110" y2="145" stroke="#94a3b8"/>
    <line class="layer-stage-1" x1="30" y1="65" x2="150" y2="65" stroke="#94a3b8"/>
    <line class="layer-stage-1" x1="30" y1="105" x2="150" y2="105" stroke="#94a3b8"/>
    <rect class="layer-stage-2" x="70" y="25" width="40" height="40" fill="#dcfce7"/>
    <rect class="layer-stage-2" x="30" y="65" width="40" height="40" fill="#dcfce7"/>
    <text class="layer-stage-3 formal-labels" x="90" y="50" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">✓</text>
    <text class="layer-stage-3 formal-labels" x="50" y="90" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">✓</text>
    <text class="layer-stage-4" x="90" y="170" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">Classical Probability: P(A) = m / n</text>
  </g>"""
    results['KP-105-zh.svg'] = build_svg_document('KP-105', '概率计算', '列举法求概率', zh_105, '用列表或网格穷举所有等可能结果总数 n 与目标事件结果数 m，P=m/n')
    results['KP-105-en.svg'] = build_svg_document('KP-105', 'Probability', 'Probability by Enumeration', en_105, 'List all n equally likely outcomes; probability P = m / n', is_en=True)

    # KP-106: 树状图法列表法求概率 (两步分叉树状图)
    zh_106 = """  <g transform="translate(50, 68)">
    <!-- Root node -->
    <circle class="layer-stage-1" cx="30" cy="85" r="5" fill="#475569"/>
    <text class="layer-stage-1" x="18" y="90" font-size="11" font-weight="bold">开始</text>
    <!-- Step 1 branches -->
    <line class="layer-stage-2" x1="35" y1="85" x2="110" y2="50" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-2" x1="35" y1="85" x2="110" y2="120" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-2" cx="110" cy="50" r="4" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="110" cy="120" r="4" fill="#2563eb"/>
    <text class="layer-stage-2" x="118" y="54" font-size="11" font-weight="bold" fill="#1e40af">正</text>
    <text class="layer-stage-2" x="118" y="124" font-size="11" font-weight="bold" fill="#1e40af">反</text>
    <!-- Step 2 branches -->
    <line class="layer-stage-3 formal-labels" x1="125" y1="50" x2="200" y2="35" stroke="#16a34a" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="125" y1="50" x2="200" y2="65" stroke="#16a34a" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="125" y1="120" x2="200" y2="105" stroke="#16a34a" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="125" y1="120" x2="200" y2="135" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="210" y="40" font-size="11" fill="#15803d">(正, 正)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="70" font-size="11" fill="#15803d">(正, 反)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="110" font-size="11" fill="#15803d">(反, 正)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="140" font-size="11" fill="#15803d">(反, 反)</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">两步或三步多阶段试验树状图清晰不重不漏</text>
  </g>"""
    en_106 = """  <g transform="translate(50, 68)">
    <circle class="layer-stage-1" cx="30" cy="85" r="5" fill="#475569"/>
    <text class="layer-stage-1" x="15" y="90" font-size="10" font-weight="bold">Start</text>
    <line class="layer-stage-2" x1="35" y1="85" x2="110" y2="50" stroke="#2563eb" stroke-width="2"/>
    <line class="layer-stage-2" x1="35" y1="85" x2="110" y2="120" stroke="#2563eb" stroke-width="2"/>
    <circle class="layer-stage-2" cx="110" cy="50" r="4" fill="#2563eb"/>
    <circle class="layer-stage-2" cx="110" cy="120" r="4" fill="#2563eb"/>
    <text class="layer-stage-2" x="118" y="54" font-size="10" font-weight="bold" fill="#1e40af">H</text>
    <text class="layer-stage-2" x="118" y="124" font-size="10" font-weight="bold" fill="#1e40af">T</text>
    <line class="layer-stage-3 formal-labels" x1="125" y1="50" x2="200" y2="35" stroke="#16a34a" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="125" y1="50" x2="200" y2="65" stroke="#16a34a" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="125" y1="120" x2="200" y2="105" stroke="#16a34a" stroke-width="1.5"/>
    <line class="layer-stage-3 formal-labels" x1="125" y1="120" x2="200" y2="135" stroke="#16a34a" stroke-width="1.5"/>
    <text class="layer-stage-3 formal-labels" x="210" y="40" font-size="10" fill="#15803d">(H, H)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="70" font-size="10" fill="#15803d">(H, T)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="110" font-size="10" fill="#15803d">(T, H)</text>
    <text class="layer-stage-3 formal-labels" x="210" y="140" font-size="10" fill="#15803d">(T, T)</text>
    <text class="layer-stage-4" x="130" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Tree diagrams systematically enumerate multi-step paths</text>
  </g>"""
    results['KP-106-zh.svg'] = build_svg_document('KP-106', '概率计算', '树状图法列表法求概率', zh_106, '对于两步及两步以上的多阶段试验，画树状图可清晰列出所有可能结果')
    results['KP-106-en.svg'] = build_svg_document('KP-106', 'Probability', 'Tree Diagrams & Probability', en_106, 'Tree diagrams systematically enumerate outcomes in multi-stage experiments', is_en=True)

    # KP-107: 用频率估计概率 (大数定律频率向概率 0.5 收敛折线)
    zh_107 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="140" x2="270" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="275" y="145" font-size="11" fill="#64748b">次数 n</text>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="35" y="15" font-size="11" fill="#64748b">频率</text>
    <!-- Theoretical probability line P = 0.5 -->
    <line class="layer-stage-2" x1="40" y1="80" x2="270" y2="80" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-2" x="275" y="85" font-size="11" font-weight="bold" fill="#dc2626">P = 0.5</text>
    <!-- Damped oscillation convergence curve -->
    <polyline class="layer-stage-3 formal-labels" points="40,120 70,45 100,105 130,65 170,90 210,75 250,81" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-4" x="145" y="165" text-anchor="middle" font-size="12" font-weight="bold" fill="#047857">大数定律: 试验次数足够大时，频率稳定收敛于概率</text>
  </g>"""
    en_107 = """  <g transform="translate(45, 68)">
    <line class="layer-stage-1" x1="20" y1="140" x2="270" y2="140" stroke="#94a3b8" stroke-width="1.5"/>
    <text class="layer-stage-1" x="275" y="145" font-size="10" fill="#64748b">Trials n</text>
    <line class="layer-stage-1" x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
    <line class="layer-stage-2" x1="40" y1="80" x2="270" y2="80" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 4"/>
    <text class="layer-stage-2" x="275" y="85" font-size="10" font-weight="bold" fill="#dc2626">P = 0.5</text>
    <polyline class="layer-stage-3 formal-labels" points="40,120 70,45 100,105 130,65 170,90 210,75 250,81" fill="none" stroke="#2563eb" stroke-width="2.5"/>
    <text class="layer-stage-4" x="145" y="165" text-anchor="middle" font-size="11" font-weight="bold" fill="#047857">Law of Large Numbers: Frequency converges to theoretical probability</text>
  </g>"""
    results['KP-107-zh.svg'] = build_svg_document('KP-107', '概率估计', '用频率估计概率', zh_107, '当试验次数很大时，事件发生的频率逐渐稳定在某个常数附近，该常数即概率')
    results['KP-107-en.svg'] = build_svg_document('KP-107', 'Probability', 'Estimating Probability by Frequency', en_107, 'As trial count grows large, empirical frequency stabilizes around probability', is_en=True)

    return results
