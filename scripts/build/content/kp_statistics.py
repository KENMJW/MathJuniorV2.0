#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统计与概率板块考点四段精讲库 (KP-092 ~ KP-107)
涵盖数据收集与整理(5)、数据分析(6)、概率(5)
严格遵循 What(本质)/Why(原理)/How(定义方法)/Model(变式迁移) 认知阶梯
杜绝套话模板，所有数学公式经过严格 LaTeX 语法验证
"""

KP_STATISTICS = {
    "KP-092": {
        "origin_story_zh": "人口普查需要摸清全国人口底数，但如果测试一批炮弹的杀伤半径或灯泡的使用寿命，若把每一颗炮弹都打掉、每一个灯泡都烧毁，普查将造成灾难性破坏。在破坏性试验、成本高昂或总量极其庞大的场景下，人类发明了抽样调查，用有限的局部样本科学窥探庞大的总体全貌。",
        "origin_story_en": "Testing lightbulb longevity or missile ranges destroys the items; testing every single unit is impossible. Sampling survey emerged to deduce massive, unobservable population characteristics from small, representative subsets without catastrophic destruction.",
        "intuitive_essence_zh": "普查与抽样的本质是'信息获取确定性精度与经济破坏成本之间的权衡博弈'。普查追求绝对确定性，抽样追求统计推断的无偏代表性；抽样的灵魂在于随机性，杜绝任何主观偏向。",
        "intuitive_essence_en": "Trade-off between absolute census precision and sampling cost efficiency. Random sampling guarantees unskewed representative inference for vast populations.",
        "formal_definition_zh": "调查方式体系：(1) 全面调查（普查）：对所要考察的全部对象进行的调查；(2) 抽样调查：从总体中抽取部分个体进行的调查；(3) 统计术语：总体是所要考察对象的全体；个体是组成总体的每一个考察对象；样本是从总体中抽取的那部分个体；样本容量是样本中包含个体的数目（无单位纯数字）。适用准则：破坏性大、范围广、受客观条件限制时采用抽样；要求精确、事关重大采用普查。",
        "formal_definition_en": "Census surveys every unit; sampling surveys a representative subset. Key metrics: population, individual, sample, and sample size (dimensionless integer). Destructive tests mandate sampling.",
        "intrinsic_variation_zh": "中考考查辨析陷阱：(1) 样本容量不能带单位（如'某校调查 500 名学生的视力，样本容量是 500'，若写成 '500名' 判定错误！）；(2) 总体与个体的考察属性必须一致（总体不是学生，而是'500名学生的视力情况'）；(3) 抽样代表性偏差陷阱（在重点班调查全校成绩、在操场调查全校网瘾程度均为有偏抽样）。",
        "intrinsic_variation_en": "Critical terminology traps: Sample size is a pure number WITHOUT units (e.g. 500, not 500 students). The population refers to the measured property (e.g. eye vision status), not human entities."
    },

    "KP-093": {
        "origin_story_zh": "面对密密麻麻成百上千个原始考试成绩数字，人脑很难一眼看出分数分布规律。如果把成绩划分成若干分数段，清点每个分数段有多少人落入，就能绘制出高低起伏的直方图。直方图把混乱的数字洪流规整为有序的面积分布，展现出人类最初的数据可视化直觉。",
        "origin_story_en": "Raw lists of hundreds of exam scores overwhelm perception. Grouping scores into discrete bins and counting frequencies produces histograms, turning raw chaotic tables into structured visual distributions.",
        "intuitive_essence_zh": "频数、频率与直方图的本质是'离散数据向区间面积密度的归一化聚合'。频数是局部绝对计数，频率是相对百分占比（各频率之和恒为 1）；直方图的小矩形面积恰好对应各组的频率（或频数）。",
        "intuitive_essence_en": "Histograms aggregate continuous data into bin intervals. Frequency ratio is normalized proportion summing to 1; rectangular area represents bin frequency density.",
        "formal_definition_zh": "概念公式：(1) 频数：落入各个小组内的数据的个数；(2) 频率：频数与数据总数的比值：$\\text{频率} = \\frac{\\text{频数}}{\\text{数据总数}}$；性质：各小组频数之和等于总数，各小组频率之和等于 $1$；(3) 频率分布直方图：横轴表示各组分段边界，纵轴表示 $\\frac{\\text{频数}}{\\text{组距}}$（或 $\\frac{\\text{频率}}{\\text{组距}}$），小矩形的高与频数成正比，所有小长方形面积之和等于总数（或 1）。",
        "formal_definition_en": "Frequency counts occurrences; frequency ratio is count divided by total sample ($f = n/N$), summing to 1. In histograms, bin width is horizontal; height is $\\text{frequency}/\\text{width}$.",
        "intrinsic_variation_zh": "中考读图算数模型：(1) 已知部分组的频数与对应频率，反求样本容量 $N = \\frac{\\text{频数}}{\\text{频率}}$；(2) 补全直方图与频数折线图（画小矩形并在顶端中点顺次相连）；(3) 陷阱：直方图组距不均匀时的失误，以及中考常考由样本各组频率估算总体中某区间的人数（$N_{\\text{总}} \\times \\text{样本频率}$）。",
        "intrinsic_variation_en": "Reverse total sample extraction: $N = \\text{frequency}/\\text{ratio}$. Project sample bin proportions onto total populations to estimate macro totals."
    },

    "KP-094": {
        "origin_story_zh": "家庭每月各项开支在总收入中占多大比例？国民经济各行业对 GDP 的贡献率谁大谁小？为了让大众一目了然地看到'各部分在整体中所占的百分比重'，统计学家以 $360^\\circ$ 的圆面为总体，按百分比切分扇形，诞生了扇形统计图。",
        "origin_story_en": "Household expenditure shares and industry GDP contributions require communicating parts of a whole instantly. Slicing a circular disk into proportional wedges created pie charts.",
        "intuitive_essence_zh": "扇形统计图的本质是'圆周 $360^\\circ$ 全景总能量向各部分百分比的线性分配'。整圆代表总体 $100\\%$，各个扇形的圆心角与该部分的百分比成绝对正比：圆心角 $\\alpha = 360^\\circ \\times \\text{百分比}$。",
        "intuitive_essence_en": "Pie charts allocate the $360^\\circ$ circle proportionally to component percentages: central angle $\\alpha = 360^\\circ \\times \\text{percentage}$. Whole equals $100\\%$.",
        "formal_definition_zh": "扇形统计图规范：(1) 用整圆的面积表示总体（$1$ 或 $100\\%$），用圆内各个扇形的大小表示各部分占总体的百分比；(2) 核心换算公式：对应扇形圆心角度数 $\\alpha = 360^\\circ \\times \\frac{\\text{该部分数量}}{\\text{总体总量}} = 360^\\circ \\times P\\%$；(3) 各部分百分比之和恒等于 $100\\%$，各扇形圆心角之和恒等于 $360^\\circ$。",
        "formal_definition_en": "Sector central angle: $\\alpha = 360^\\circ \\times P\\%$. Percentages must sum strictly to $100\\%$; central angles must sum to $360^\\circ$.",
        "intrinsic_variation_zh": "中考双图联动必考题型：'条形统计图 + 扇形统计图'联合求解：(1) 第一步找突破口：在条形图找到某类具体频数，在扇形图找到对应百分比，相除求出总体样本容量 $N = \\text{频数} / \\text{百分比}$；(2) 第二步补全两图残缺数据与各扇形圆心角；(3) 陷阱：扇形图只能直观看出百分比占比，无法直接看出具体数量的绝对大小（必须结合样本容量）。",
        "intrinsic_variation_en": "Dual-chart linkage archetype: match a specific count from a bar chart with its percentage in the pie chart to recover total population $N = \\text{count}/P\\%$. Pie charts show proportions, not raw counts."
    },

    "KP-095": {
        "origin_story_zh": "病人体温随时间每小时的起伏变化、股票市场大盘指数每分钟的涨跌波动。人们不仅想看孤立的离散数值，更迫切希望看清数据随时间推进的'动态演变趋势与波动幅度'。用线段将各时间点的数据坐标顺次相接，折线统计图应运而生。",
        "origin_story_en": "Patient fever curves and stock index fluctuations reflect continuous temporal changes. Connecting consecutive data points with line segments generates line charts capturing trend momentum.",
        "intuitive_essence_zh": "折线统计图的本质是'时间序列数据在二维离散网格中的变化趋势走势投影'。折线段的上升或下降陡峭程度直接反映了变化速率的快慢，起伏波折反映了系统的稳定性。",
        "intuitive_essence_en": "Visualizing temporal momentum: slope steepness indicates rate of change; jagged oscillations display volatility and instability.",
        "formal_definition_zh": "折线统计图定义：用折线的升降来表示数据在不同时间或状态下变化趋势的统计图。绘制法则：横轴通常表示时间序列（月、日、年等自变量），纵轴表示考察的指标数值；描点、连线。三大统计图功能对比：条形图直观显示具体数量大小；折线图直观反映事物增减变化趋势；扇形图直观反映各部分占总体的百分比比例。",
        "formal_definition_en": "Line charts display trends across time. Comparison: Bar charts show absolute values; Line charts show temporal trends; Pie charts show relative proportions.",
        "intrinsic_variation_zh": "中考考题模型：(1) 复式折线统计图（两条折线对比两组对象的优劣演进）；(2) 结合物理路程时间图象提取速度与相遇追及信息；(3) 陷阱：纵轴坐标如果不是从 0 开始起步（缩圈截断），容易产生变化被严重夸大的视觉误导。",
        "intrinsic_variation_en": "Comparative dual-line graphs for competitor trends. Visual trap: truncated y-axes starting above 0 exaggerate apparent growth or volatility."
    },

    "KP-096": {
        "origin_story_zh": "在小样本比赛打分、运动员体能测试中，如果画直方图数据又太少，如果单列数据表又缺乏宏观分布直觉。统计学家图基发明了'茎叶图'：把数字的高位作为树茎，个位作为绿叶挂在旁边。它既保留了每一个原始数据的毫发不差，又瞬间呈现出整个数据集的分布形态。",
        "origin_story_en": "John Tukey invented stem-and-leaf plots for small-to-medium data sets. Using higher digits as stems and unit digits as leaves preserves exact raw numbers while simultaneously revealing distribution shape.",
        "intuitive_essence_zh": "茎叶图的本质是'零信息损失的文本化微型半直方图'。将茎叶图逆时针旋转 90°，就是一幅原汁原味的频数直方图，其最大优越性是不会丢失任何原始数据的具体数值信息。",
        "intuitive_essence_en": "Zero-loss tabular histogram. Rotating a stem-and-leaf plot 90° counterclockwise produces an exact frequency histogram while keeping all individual data points retrievable.",
        "formal_definition_zh": "茎叶图的制作准则：将数据按位数拆分为'茎'（高位数字，如十位或百位）和'叶'（低位数字，通常为个位）。茎按由小到大自上而下竖向排列，叶按大小顺序自左向右横向排列在对应茎的旁边。双向茎叶图可用于对比两组样本的对称分布与集中趋势。阅读时通过'茎 + 叶'精确还原每一个原始数据值。",
        "formal_definition_en": "Data partitioned into stems (tens digits) and leaves (units digits). Stems align vertically; leaves spread horizontally in ascending order. Reading combines stem plus leaf to restore exact values.",
        "intrinsic_variation_zh": "中考识图计算变式：(1) 从茎叶图中提取中位数、众数与极差；(2) 比较两组选手得分的平均水平与稳定性；(3) 陷阱：读数时遗漏未提供单位进制说明的默认十进制，两组对比时一侧是从左向右排，另一侧必须是从右向左逆向读取。",
        "intrinsic_variation_en": "Extracting medians and modes directly from stem-and-leaf plots. Caution on bilateral comparison plots: left-hand leaves read outwards right-to-left."
    },

    "KP-097": {
        "origin_story_zh": "不同科目学分权重不同：期末考试占 60%，期中考试占 30%，平时作业占 10%。如果把三次成绩简单相加除以 3，显然违背了期末更重要的教学导向。古希腊算术平均数解决了绝对均等分配问题，而现代决策为了突出不同维度的重要性，发展出了'加权平均数'。",
        "origin_story_en": "Grading frameworks weigh final exams 60%, midterms 30%, and homework 10%. Simple unweighted averages fail to reflect differential importance, giving birth to weighted averages.",
        "intuitive_essence_zh": "平均数的本质是'数据质量体系的总量水平衡基准与重力重心'。算术平均数是人人平等的绝对平摊（削峰填谷）；加权平均数中的'权'（Weight）本质是决定话语权大小的杠杆力臂长度。",
        "intuitive_essence_en": "The average represents the physical balance center (center of mass) of data. Weighted average introduces leverage weights, biasing the balance toward prioritized components.",
        "formal_definition_zh": "平均数计算体系：(1) 算术平均数：设有 $n$ 个数 $x_1, x_2, \\dots, x_n$，其平均数为 $\\bar{x} = \\frac{x_1 + x_2 + \\dots + x_n}{n}$；(2) 加权平均数：若 $n$ 个数 $x_1, x_2, \\dots, x_k$ 的权分别为 $w_1, w_2, \\dots, w_k$，则加权平均数为 $\\bar{x} = \\frac{x_1 w_1 + x_2 w_2 + \\dots + x_k w_k}{w_1 + w_2 + \\dots + w_k}$；若权以百分比给出（$\\sum P_i = 100\\%$），则 $\\bar{x} = \\sum x_i P_i$。",
        "formal_definition_en": "Arithmetic mean: $\\bar{x} = \\frac{1}{n} \\sum x_i$. Weighted mean with weights $w_i$: $\\bar{x} = \\frac{\\sum x_i w_i}{\\sum w_i}$. If weights are percentages, $\\bar{x} = \\sum x_i P_i$.",
        "intrinsic_variation_zh": "中考招聘与面试综合决策：(1) 综合成绩计算：笔试与面试按 $4:6$ 加权；(2) 简化运算巧算平均数：设基准数 $A$，则 $\\bar{x} = A + \\frac{\\sum (x_i - A)}{n}$；(3) 致命陷阱：平均数极易受到'极端异常值'（极大或极小值）的严重拉扯扭曲（如一人年薪一千万拉高全厂人均工资）。",
        "intrinsic_variation_en": "Hiring decision weighting (e.g. written exam vs interview 4:6). Fatal limitation: mean is acutely vulnerable to extreme outliers distorting the representative center."
    },

    "KP-098": {
        "origin_story_zh": "当调查一个公司的普通员工薪资水平时，董事长一人拿走两千万年薪，若算平均工资人均五万，但九成普通工人月薪仅三千。平均数在这个极端值面前彻底失效、误导公众。为了找到一个真正'不偏不倚、不受极端贫富悬殊拉扯'的中间指标，中位数登上了历史舞台。",
        "origin_story_en": "When an executive earns millions, the arithmetic mean salary misrepresents a workforce where 90% earn minimum wage. The median was introduced to anchor representative centers immune to extreme outliers.",
        "intuitive_essence_zh": "中位数的本质是'将所有数据按大小排长队后正中央位置的分水岭'。它具有天然的鲁棒抗噪性：无论队尾的亿万富翁收入再翻多少倍，中位数的排位和数值岿然不动。恰好有 50% 的数据低于它，50% 高于它。",
        "intuitive_essence_en": "The median is the exact 50th percentile dividing ordered data into two equal halves. Robust against outliers: shifting the highest or lowest values does not alter the median.",
        "formal_definition_zh": "中位数的标准求解程序：(1) 排序：将一组数据按从小到大（或从大到小）的顺序排列；(2) 奇偶判定定位：若数据总个数 $n$ 为奇数，则正中间位置的数（第 $\\frac{n+1}{2}$ 个数）就是中位数；若数据个数 $n$ 为偶数，则正中间两个数据的平均数（第 $\\frac{n}{2}$ 个与第 $\\frac{n}{2} + 1$ 个数的平均值）是中位数。",
        "formal_definition_en": "Sort data in order. If $n$ is odd, median is the central entry at position $(n+1)/2$. If $n$ is even, median is the average of the two middle entries at $n/2$ and $n/2+1$.",
        "intrinsic_variation_zh": "中考考查模型：(1) 从频数分布表或条形图中读取中位数（先算累计频数找第 $\\frac{n}{2}$ 个数据所在位置）；(2) 中位数的代表性评判：评价总体中等水平的最佳指标；(3) 致命陷阱：求中位数前'忘记对原始乱序数据进行排序'，直接抓取输入列表的中间项（必错低级陷阱）。",
        "intrinsic_variation_en": "Cumulative frequency location for median. Fatal trap: forgetting to sort raw unordered data before picking middle values."
    },

    "KP-099": {
        "origin_story_zh": "鞋店老板进货，如果进平均尺码 39.4 号的鞋子，一双也卖不出去；他必须进卖得最多的 41 号或 42 号鞋。商场订货、服装设计最关心的不是平均水平，而是市场上哪种尺寸需求量最大、出现频率最高。这就是众数（Mode）的商业实用价值。",
        "origin_story_en": "A shoe store ordering average size 39.4 sells zero pairs. It needs sizes 41 and 42—the most demanded shoe sizes. The mode identifies the single most frequent, popular market occurrence.",
        "intuitive_essence_zh": "众数的本质是'在数据分布直方图上峰值最高的多数派投票获胜者'。它代表了群体最集中、最流行、最普遍认可的状态，可以处理数值型数据，亦可处理分类型的非数值数据。",
        "intuitive_essence_en": "The mode represents the peak frequency of occurrence—the most popular majority vote. Applicable to numerical and qualitative categories alike.",
        "formal_definition_zh": "在一组数据中，出现次数最多的那个数据叫做这组数据的众数。特点：(1) 众数必须是一组数据中真实存在的值（与平均数、中位数可为虚拟计算值不同）；(2) 一组数据的众数可以不止一个（若两个或多个数据出现的频数并列最高，则它们都是众数）；(3) 若所有数据出现的频数都完全相同，则称这组数据没有众数。",
        "formal_definition_en": "The mode is the most frequently occurring value. A data set can have one mode (unimodal), multiple modes (multimodal), or no mode if all frequencies are identical.",
        "intrinsic_variation_zh": "中考辨析：(1) 区别众数与频数（如 40 出现了 15 次，众数是 40，而不是 15！切防把出现次数错填为众数）；(2) 结合平均数、中位数、众数评选最佳方案；(3) 陷阱：众数可能存在多个，漏写其中一个并列众数。",
        "intrinsic_variation_en": "Critical error: Confusing the mode with its frequency. If score 90 appears 12 times, the mode is 90, NOT 12! Multi-mode data sets require listing all ties."
    },

    "KP-100": {
        "origin_story_zh": "气象预报员记录某沙漠地区最高温 48℃，最低温 -2℃；记录沿海城市最高温 30℃，最低温 20℃。两地虽然平均气温可能接近，但沙漠的日夜温差高达 50℃，气候极其恶劣。为了用最简单的指标描摹数据波动的跨度范围，极差应运而生。",
        "origin_story_en": "Deserts shift from 48°C to -2°C while coastal towns stay between 30°C and 20°C. Despite similar average temperatures, temperature span measures environmental severity, creating range metrics.",
        "intuitive_essence_zh": "极差的本质是'数据离散全景的最外围边界跨度'。它只由最高峰和最低谷两个端点决定，是数据波动范围最粗糙、最易计算的边界探测器。",
        "intuitive_essence_en": "Range measures boundary span between extremes: $\\text{Range} = x_{\\max} - x_{\\min}$. Quick to compute, but reflects only extreme boundaries.",
        "formal_definition_zh": "一组数据中的最大数据与最小数据的差，叫做这组数据的极差：$\\text{极差} = x_{\\max} - x_{\\min}$。性质：极差能够直观反映一组数据变化范围的大小；极差越小，数据变动范围越窄；极差越大，变动范围越广。局限性：极差完全取决于两极极值，忽视了内部所有中间数据的分布特征。",
        "formal_definition_en": "Range equals maximum minus minimum: $\\text{Range} = x_{\\max} - x_{\\min}$. Fast indicator of variability, but sensitive to boundary outliers while blind to internal distribution.",
        "intrinsic_variation_zh": "中考考题变式：(1) 结合茎叶图或条形图求极差；(2) 射击环数或生产公差跨度评价；(3) 陷阱：计算时混淆负号导致极差变小（如最大值 5，最小值 -3，极差为 $5 - (-3) = 8$，常错算为 $5 - 3 = 2$）。",
        "intrinsic_variation_en": "Watch negative subtraction: if max is 5 and min is -3, $\\text{Range} = 5 - (-3) = 8$, not 2."
    },

    "KP-101": {
        "origin_story_zh": "两名射击运动员去参加奥运会选拔，十发子弹打完，两人的平均成绩完全一样都是 9.5 环。但甲运动员每枪都在 9 环与 10 环之间微小抖动，乙运动员却要么打 10 环要么打 7 环脱靶。极差只能看两极，如何精确量化整组数据每一个点偏离平均值的平均波动剧烈程度？高斯与统计学家发明了方差。",
        "origin_story_en": "Two archers both average 9.5 rings, but one clusters tightly in 9-10 while the other swings between 7 and 10. To quantify overall deviation of every data point from the mean, statisticians created variance.",
        "intuitive_essence_zh": "方差与标准差的本质是'各数据到平均基准重心的平方能量偏离均值'。之所以对离差 $(x_i - \\bar{x})$ 求平方，是为了消除正负号相互抵消的算术死锁，同时惩罚远离中心的离群点；方差越小，系统性能越稳定精密。",
        "intuitive_essence_en": "Variance calculates mean squared deviations from the center: $s^2 = \\frac{1}{n} \\sum (x_i - \\bar{x})^2$. Squaring prevents signs cancelling and penalizes larger errors. Lower variance indicates higher stability.",
        "formal_definition_zh": "设一组数据 $x_1, x_2, \\dots, x_n$ 的平均数为 $\\bar{x}$，各数据与平均数的差的平方的平均数叫做这组数据的方差，记作 $s^2$：$s^2 = \\frac{1}{n} [(x_1 - \\bar{x})^2 + (x_2 - \\bar{x})^2 + \\dots + (x_n - \\bar{x})^2]$。方差的算术平方根 $s = \\sqrt{s^2}$ 叫做标准差。重要线性变换定理：若新数据 $y_i = a x_i + b$，则 $\\bar{y} = a \\bar{x} + b$，$s_y^2 = a^2 s_x^2$，$s_y = |a| s_x$。",
        "formal_definition_en": "Sample variance: $s^2 = \\frac{1}{n} \\sum (x_i - \\bar{x})^2$. Standard deviation is $s = \\sqrt{s^2}$. Linear shift theorem: for $y = ax+b$, mean shifts $\\bar{y} = a\\bar{x}+b$, while variance scales quadratically: $s_y^2 = a^2 s_x^2$.",
        "intrinsic_variation_zh": "中考压轴速算技巧：(1) 线性平移性质速算：全组数据同时加上一个常数 $b$，方差绝对不变（整体平移不改变离散度）；全组数据乘以 $a$，方差乘以 $a^2$；(2) 选手选拔决策标准：'平均数看实力强弱，方差看发挥稳定与否'；(3) 陷阱：计算公式中分母是 $n$ 而不是 $n-1$（初中阶段采用总体方差定义公式）。",
        "intrinsic_variation_en": "Transformation invariance: adding a constant $b$ to all points leaves variance strictly unchanged ($s_{x+b}^2 = s_x^2$). Multiplying by $a$ scales variance by $a^2$.",
    },

    "KP-102": {
        "origin_story_zh": "在选拔宇航员、采购精密机床或评估企业运营时，仅看单一指标必定做出荒谬决策：只看平均数会选出大起大落极不稳定的冒险者；只看方差会选出成绩极其稳定但整体垫底的平庸者。现代数据科学必须将集中趋势（平均数/中位数）与离散趋势（方差/极差）多维联立，进行立体决策。",
        "origin_story_en": "Selecting astronauts using a single metric leads to disaster: relying only on mean risks picking unstable performers; relying only on variance picks consistently mediocre candidates. Modern data science synthesizes central and dispersion metrics.",
        "intuitive_essence_zh": "综合统计决策的本质是'实力水平（均值位置）与风险波动（方差离散）的二维帕累托最优权衡'。优秀选手既要有高的期望均值，又要有极低的不确定性风险。",
        "intuitive_essence_en": "Two-dimensional Pareto optimization balancing expected performance (mean) against operational volatility risk (variance).",
        "formal_definition_zh": "数据特征综合分析决策模型：(1) 集中趋势评价指标：平均数（全面敏感但怕极值）、中位数（代表中游抗极值强）、众数（反映流行多数派）；(2) 离散程度评价指标：极差（快速探测跨度）、方差/标准差（精密刻画整体波动稳定性）；(3) 科学决策法则：若两组平均数不同，优先选均值高者（实力更强）；若平均数相同，优先选方差较小者（发挥更稳定、抗风险能力更强）。",
        "formal_definition_en": "Synthesis: Measure central tendency (mean, median, mode) together with dispersion (range, variance, std dev). If means tie, smaller variance secures the win.",
        "intrinsic_variation_zh": "中考主观答题规范模板：(1) '从平均数看...，说明...实力更强；从方差看...，说明...发挥更稳定，因此推荐...'；(2) 中位数对比（如甲中位数高于乙，说明甲半数以上成绩优于乙）；(3) 陷阱：主观评述无理无据，脱离具体数据数字空喊口号导致失分。",
        "intrinsic_variation_en": "Scoring rubric standard: substantiate verbal recommendations with explicit comparative numbers (both mean performance and variance stability)."
    },

    "KP-103": {
        "origin_story_zh": "太阳每天东升西落（必然事件），水在常温常压下一百摄氏度沸腾（必然事件）；而抛下一枚硬币，究竟是正面朝上还是反面朝上，在落地前谁也无法断言（随机事件）。人类从混沌不确定的自然现象中，逐步将事件划分为必然、不可能与随机三大逻辑疆域，奠定了概率论的哲学基石。",
        "origin_story_en": "Sun rising in the east is certain; coin tosses are indeterminate. Distinguishing between deterministic certainty (necessary/impossible) and aleatory uncertainty (random events) founded probability theory.",
        "intuitive_essence_zh": "事件分类的本质是'在固定初始实验条件下系统演化结果的可预测性状态划分'。确定性事件是决定论因果闭环，随机事件是微观扰动放大带来的宏观偶然性。",
        "intuitive_essence_en": "Categorization of predictability under specified initial conditions: deterministic certainty versus aleatory stochasticity.",
        "formal_definition_zh": "事件分类体系：(1) 必然事件：在一定条件下，一定会发生的事件，概率 $P = 1$；(2) 不可能事件：在一定条件下，一定不会发生的事件，概率 $P = 0$；必然事件和不可能事件统称为确定性事件；(3) 随机事件：在一定条件下，可能发生也可能不发生的事件，概率满足 $0 < P < 1$。",
        "formal_definition_en": "Event taxonomy: Certain event ($P = 1$); Impossible event ($P = 0$); Random/stochastic event ($0 < P < 1$). Certain and impossible events form deterministic events.",
        "intrinsic_variation_zh": "中考成语与生活常识判别考点：(1) 熟语判定：'水中捞月'（不可能事件）、'拔苗助长'（必然死亡/不可能）、'守株待兔'（随机事件）、'种瓜得瓜'（必然事件）；(2) 条件敏感性：'打开电视机正在播放天气预报'（随机事件）；(3) 陷阱：'概率极小的事件是不可能事件'是错误概念（小概率依然可能发生）。",
        "intrinsic_variation_en": "Idiom and physical scenario classification: small probability events are NOT impossible events; they remain strictly random ($P > 0$)."
    },

    "KP-104": {
        "origin_story_zh": "17世纪法国赌徒德·梅雷向大数学家帕斯卡请教赌资分配问题：赌博由于不可抗力中断，如何根据当前胜率公平分钱？帕斯卡与费马通过通信，首次给出了可能发生程度的定量数值度量，创立了概率论。概率将无法捉摸的'运气'驯服为精确严谨的数学度量。",
        "origin_story_en": "Chevalier de Méré questioned Pascal on fair stakes division in unfinished dice games. Pascal and Fermat's correspondence quantified uncertainty into rigorous probability fractions, taming 'luck' into science.",
        "intuitive_essence_zh": "概率的本质是'随机事件发生可能性大小在闭区间 [0, 1] 内的定量实数测度'。必然事件测度为 1，不可能事件测度为 0，随机事件均匀分布在其间。它度量的是长期重复试验下频率趋近的那个神秘极限常数。",
        "intuitive_essence_en": "A real metric in $[0, 1]$ measuring the likelihood of an outcome. It is the invariant limit toward which relative frequencies converge over infinite trials.",
        "formal_definition_zh": "概率定义与公理：(1) 一般地，表示一个随机事件 $A$ 发生的可能性大小的数，叫做这个事件的概率，记作 $P(A)$；(2) 概率的严格取值范围：$0 \\leq P(A) \\leq 1$；(3) 极端临界：当 $A$ 为必然事件时，$P(A) = 1$；当 $A$ 为不可能事件时，$P(A) = 0$；(4) 对立事件概率和定理：事件 $A$ 与事件'非 $A$'对立，则 $P(A) + P(\\bar{A}) = 1$。",
        "formal_definition_en": "Probability $P(A) \\in [0, 1]$. Certain event $P=1$; impossible event $P=0$. Complement rule: $P(A) + P(\\bar{A}) = 1$.",
        "intrinsic_variation_zh": "哲学辨析陷阱：(1) '某彩票中奖概率为 1%，买 100 张必有 1 张中奖'是经典错题（独立随机试验下买 100 张全不中的概率为 $(0.99)^{100} \\approx 36.6\\%$，绝非必然中奖！）；(2) 逆向思维求至少出现一次概率：$P(\\text{至少一次}) = 1 - P(\\text{全不发生})$；(3) 陷阱：概率值计算出现负数或大于 1 的荒谬结果未察觉。",
        "intrinsic_variation_en": "Gambler's fallacy trap: 1% lottery probability does NOT guarantee 1 win in 100 tickets. Complementary strategy: $P(\\text{at least one}) = 1 - P(\\text{none})$. Probability must never exceed 1."
    },

    "KP-105": {
        "origin_story_zh": "掷一枚质地均匀的六面体骰子，摇出 1 点到 6 点六种结果谁也不比谁更有优势，机会完全均等。拉普拉斯据此建立了古典概型理论：只要试验的可能结果是有限个，且每一个基本事件发生的可能性完全均等，事件概率就是有利结果数与全部可能数之比。",
        "origin_story_en": "Fair six-sided dice exhibit six equally likely outcomes. Pierre-Simon Laplace formalized classical probability based on finite sample spaces where all elementary outcomes share identical equal chances.",
        "intuitive_essence_zh": "列举法与古典概型的本质是'在等可能样本空间中对有利离散微元的基本计数比'。$P(A) = \\frac{m}{n}$，计算概率彻底转化为排列组合的数数计数问题。",
        "intuitive_essence_en": "Ratio of favorable elementary micro-events $m$ to total equiprobable sample outcomes $n$: $P(A) = m/n$. Probability is reduced to systematic combinatorial counting.",
        "formal_definition_zh": "古典概型两大充要特征：(1) 有限性：试验中所有可能出现的基本事件只有有限个；(2) 等可能性：每个基本事件出现的可能性完全相等。概率计算公式：一次试验共有 $n$ 种等可能的结果，如果事件 $A$ 包含其中 $m$ 种结果，那么事件 $A$ 的概率为：$P(A) = \\frac{m}{n}$。",
        "formal_definition_en": "Classical Laplace model criteria: finite sample space $n$, with all elementary events strictly equiprobable. If event $A$ covers $m$ outcomes, $P(A) = m/n$.",
        "intrinsic_variation_zh": "中考易错点：(1) 确保'等可能性'前提：若两个事件发生概率不等，绝不可直接用个数相除（如'明天下雨或不下雨，所以下雨概率是 50%'为严重逻辑谬误）；(2) 直接列举法时防止遗漏与重复（按从小到大或固定顺序有序枚举）。",
        "intrinsic_variation_en": "Equal likelihood prerequisite: never compute $P = m/n$ if basic outcomes are unequally weighted (e.g. 'rain or not rain' does not mean $P = 0.5$)."
    },

    "KP-106": {
        "origin_story_zh": "连续抛掷两枚硬币，或者先从袋子摸出一球后再摸一球（放回与不放回）。随着试验步数的增加，可能产生的组合呈几何级数爆炸，大脑直接凭空硬想极易数漏或数重。为了清晰展示多步试验的决策路径，列表法与树状图法成为了组合概率分析的参天大树。",
        "origin_story_en": "Two-stage sampling (tossing two coins, drawing two marbles with or without replacement) causes outcome combinations to multiply. Tree diagrams and contingency grids map out multi-step probability paths without omissions.",
        "intuitive_essence_zh": "树状图与列表法的本质是'多步骤组合状态空间的二阶网格化与多叉树形穷举'。两步试验画二维网格方阵矩阵，三步及以上试验画多叉发散分支树，将动态决策时序全景展开。",
        "intuitive_essence_en": "2-step experiments map onto a 2D Cartesian grid table; 3+ steps expand into branching trees. Both visually enumerate all compound paths.",
        "formal_definition_zh": "多步概率分析程序：(1) 列表法：适用于只涉及两个因素（两步试验）的随机事件。横行和纵列分别列出第一步和第二步的所有可能结果，网格交叉点即为全部等可能基本事件（共 $n_1 \\times n_2$ 种）；(2) 树状图法：适用于涉及两步或两步以上（通常为三步）的随机事件。从根节点出发，第一步分叉，各分支端点继续分叉出第二步，树枝末端叶子节点总数即为样本空间总数；(3) 概率求解：$P(A) = \\frac{\\text{符合条件的分支或网格数}}{\\text{总分支数或网格总数}}$。",
        "formal_definition_en": "Grids for two-stage experiments ($n_1 \\times n_2$ cells). Tree diagrams for three or more stages where terminal leaves count sample space. $P(A) = \\text{favorable leaves} / \\text{total leaves}$.",
        "intrinsic_variation_zh": "中考压轴高频区分：(1) '放回'与'不放回'（放回抽取两次试验独立，分母为 $n \\times n$；不放回抽取第二次不能包含自身，主对角线被挖空，分母为 $n \\times (n-1)$，极高频陷阱！）；(2) 树状图规范作图（必须标明步骤、分支名称与最终结果元组）。",
        "intrinsic_variation_en": "Crucial distinction: With replacement allows self-pairing ($n \\times n$); without replacement excludes diagonal self-pairing, giving $n(n-1)$ outcomes. Always check replacement rules."
    },

    "KP-107": {
        "origin_story_zh": "一枚质地不均匀的硬币，或者一枚形状不规则的图钉掷地（针尖朝上还是针尖朝下），显然无法用古典概型均等划分。大数学家伯努利证明了著名的弱大数定律：当试验在相同条件下无限次重复进行时，随机事件发生的相对频率必然以极大概率收敛于其内在的真实概率。这架起了经验世界通往理论概率的桥梁。",
        "origin_story_en": "Non-symmetric thumbtacks landing point-up cannot be deduced via classical equiprobable models. Jakob Bernoulli proved the Law of Large Numbers: relative empirical frequencies asymptotically converge to underlying true theoretical probabilities over massive repetitions.",
        "intuitive_essence_zh": "频率估计概率的本质是'大样本极限下偶然波动向确定性规律的统计收敛回归'。少量试验时频率剧烈颠簸震荡，试验次数上千上万后，频率曲线如被无形之手抚平，稳定在一条水平渐近线附近。",
        "intuitive_essence_en": "Stochastic oscillation dampening into deterministic convergence. Small trials oscillate wildly; massive trial counts flatten frequency curves against their true theoretical asymptote.",
        "formal_definition_zh": "大数定律与频率估计概率原理：在相同条件下进行大量重复试验：(1) 设在 $n$ 次重复试验中，事件 $A$ 发生了 $m$ 次，比值 $\\frac{m}{n}$ 称为事件 $A$ 发生的频率；(2) 随着试验次数 $n$ 越来越大，频率 $\\frac{m}{n}$ 会稳定在某个常数 $P$ 附近，并且摆动幅度越来越小；(3) 我们就把这个频率稳定在附近的常数 $P$ 称为事件 $A$ 的概率，即 $P(A) \\approx \\frac{m}{n}$（用试验频率估计理论概率）。",
        "formal_definition_en": "Law of Large Numbers: across $n$ independent repetitions, observed frequency $m/n$ stabilizes around a fixed constant $P$. We estimate $P(A) \\approx m/n$ when $n$ is sufficiently large.",
        "intrinsic_variation_zh": "中考考查模型：(1) 柑橘损坏率、鱼塘鱼总尾数估算（标志重捕法，标号鱼占比 = 抽样标号鱼占比，解比例方程）；(2) 频率折线波动图中读出收敛常数（找震荡中轴线）；(3) 陷阱：误以为'频率就是概率'（频率是动态波动的经验值，概率是恒定不变的理论常数）。",
        "intrinsic_variation_en": "Mark-recapture fish population estimation: $N_{\\text{total}} = (\\text{tagged} \\times \\text{recaptured}) / \\text{tagged-in-sample}$. Frequency fluctuates empirically; probability is constant theoretically."
    }
}
