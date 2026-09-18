#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
几何板块考点四段精讲库 (KP-044 ~ KP-091)
涵盖几何基础(5)、三角形(12)、四边形(8)、圆(10)、图形变换(6)、锐角三角函数(7)
严格遵循 What(本质)/Why(原理)/How(定义方法)/Model(变式迁移) 认知阶梯
杜绝套话模板，所有数学公式经过严格 LaTeX 语法验证
"""

KP_GEOMETRY = {
    "KP-044": {
        "origin_story_zh": "古埃及尼罗河每逢泛滥便抹去土地边界，法老测量员必须用拉绳在地面重新圈定田垄。欧几里得将现实世界中粗糙的泥土边界层层剥离：剥离厚度得到面，剥离宽度得到线，剥离长度得到点。点、线、面、角是人类为理解三维物理空间建立的最基本的公理化抽象骨架。",
        "origin_story_en": "Nile floods routinely erased land boundaries, forcing surveyors to re-measure plots. Euclid abstracted reality by stripping thickness to form surfaces, width to form lines, and length to form dimensionless points—the foundational axioms of geometry.",
        "intuitive_essence_zh": "点线面角的基本本质是'空间维度的递进跃迁与相对张角的无量纲刻画'。点动成线（一维长度），线动成面（二维面积），面动成体（三维体积）；角则是两条射线从同一奇点发散而形成的旋转张度度量。",
        "intuitive_essence_en": "Points, lines, surfaces, and angles represent dimensional ascension (0D point, 1D line, 2D plane, 3D volume). An angle measures the rotational divergence of two co-initial rays.",
        "formal_definition_zh": "几何要素体系：点无大小；线无粗细；面无厚度。角的定义：(1) 静态定义：具有公共端点的两条射线组成的图形；(2) 动态定义：一条射线绕着它的端点从一个位置旋转到另一个位置所形成的图形。度的进位制：$1^\\circ = 60', 1' = 60''$。",
        "formal_definition_en": "Point has no dimension, line no width, surface no thickness. An angle consists of two rays sharing a common vertex, or dynamically, the rotational sweep of a ray. $1^\\circ = 60', 1' = 60''$.",
        "intrinsic_variation_zh": "中考易错点：(1) 钟表时针与分针夹角计算（分针每分钟走 $6^\\circ$，时针每分钟走 $0.5^\\circ$，追及模型）；(2) 方位角识别（南偏西、北偏东标准书写顺序）；(3) 陷阱：射线与线段延伸性辨析（角的大小与两边的长短毫无关系，仅取决于张角开合度）。",
        "intrinsic_variation_en": "Clock hand angles: minute hand sweeps $6^\\circ/\\text{min}$, hour hand $0.5^\\circ/\\text{min}$. Angle magnitude is independent of the drawn lengths of its ray sides."
    },

    "KP-045": {
        "origin_story_zh": "在茫茫原野上连接两个村庄，工人们自然会拉紧皮尺修筑笔直的大道，因为谁都知道直走最近。从无数次生活测量经验中，人类提炼出欧氏几何的第一批硬核经验公理：两点确定一条直线，以及两点之间线段最短。",
        "origin_story_en": "Connecting villages naturally follows straight paths because straight lines are shortest. From physical surveying arose Euclid's foundational axioms: two points determine a line, and the line segment is the shortest distance between two points.",
        "intuitive_essence_zh": "线段、射线、直线的本质是'一维测度的有限约束与无限自由度伸展'。线段是两点锁定的有限几何刚体，具确定长度；射线是单向破空的半无限延伸；直线是双向无界的永恒贯穿。",
        "intuitive_essence_en": "A segment is a bounded 1D metric with finite length; a ray is semi-infinite with a directional anchor; a line extends infinitely in both directions.",
        "formal_definition_zh": "公理一：经过两点有一条直线，并且只有一条直线（两点确定一条直线）。公理二：所有连接两点的线中，线段最短（两点之间，线段最短）。连接两点间线段的长度，叫做这两点的距离。线段中点：把一条线段分成两条相等线段的点，若 $M$ 为 $AB$ 中点，则 $AM = MB = \\frac{1}{2}AB$。",
        "formal_definition_en": "Axioms: Exactly one straight line passes through two points. The line segment connecting two points is the shortest path; its metric length is their distance. Midpoint divides a segment into two halves.",
        "intrinsic_variation_zh": "最值几何模型原点：(1) '两点之间线段最短'是将军饮马、折线距离和最小等中考压轴几何极值题的最底层逻辑母机；(2) 陷阱：距离是一个非负数量，不能把'线段 $AB$'本身说成是'两点间的距离'（线段是图形，距离是度量数值）。",
        "intrinsic_variation_en": "Root of geometric extrema: 'shortest path is a straight segment' underpins reflectional minimization (Heron's problem). Distance is a numerical scalar, not the geometric segment object itself."
    },

    "KP-046": {
        "origin_story_zh": "从两根相交木棍形成的剪刀开合，到水平直角墙角的拼合：当两角拼成直角（互余）时，工程上便能实现正交支撑；当两角拼成平角（互补）时，地基便能在同一水平线上平整铺展。互余互补与对顶角相等构成了角度度量体系的守恒法则。",
        "origin_story_en": "Scissors opening and perpendicular wall joints illustrate complementary and supplementary angles. Summing to $90^\\circ$ secures orthogonality; summing to $180^\\circ$ ensures flat horizontal alignment.",
        "intuitive_essence_zh": "对顶角的本质是'刚体直线相交产生的刚性旋转平衡'；互余互补的本质是'以 $90^\\circ$ 正交或 $180^\\circ$ 平直为总量的面积/角度守恒分配'。同角或等角的余角相等、补角相等是演绎逻辑的首次展现。",
        "intuitive_essence_en": "Vertical angles reflect rotational invariance across crossed lines. Complementary ($90^\\circ$) and supplementary ($180^\\circ$) relations divide fixed reference benchmarks.",
        "formal_definition_zh": "角的关系定义：(1) 互为余角：若 $\\angle 1 + \\angle 2 = 90^\\circ$，则称两角互余；性质：同角（或等角）的余角相等；(2) 互为补角：若 $\\angle 1 + \\angle 2 = 180^\\circ$，则称两角互补；性质：同角（或等角）的补角相等；(3) 对顶角：两条直线相交形成的具有公共顶点且两边互为反向延长线的两个角，性质：对顶角相等。",
        "formal_definition_en": "Complementary: $\\angle 1 + \\angle 2 = 90^\\circ$ (complements of equal angles are equal). Supplementary: $\\angle 1 + \\angle 2 = 180^\\circ$ (supplements of equal angles are equal). Vertical angles formed by intersecting lines are equal.",
        "intrinsic_variation_zh": "中考考题变式：(1) 角平分线模型：将一个角两等分的射线，分成的两角相等且等于全角的一半；(2) 双角平分线交角：互为邻补角的两角的平分线互相垂直（夹角恒为 $90^\\circ$）；(3) 陷阱：审题时漏掉'互余或互补的两角不一定有公共顶点或公共边'。",
        "intrinsic_variation_en": "Angle bisectors of adjacent supplementary angles are strictly perpendicular ($90^\\circ$). Angles can be complementary or supplementary without sharing a vertex or side."
    },

    "KP-047": {
        "origin_story_zh": "铅垂线下坠的方向与水平地面相交，形成了最稳固的支撑结构；跳水运动员起跳要求起跳板绝对水平、身体绝对垂直。垂线段是连接点与直线的空间路径中能量消耗最小、距离最短的最优路径，奠定了点到直线距离的几何度量定义。",
        "origin_story_en": "Plumb bobs define true verticals against horizontal ground. The perpendicular path from a point to a line minimizes distance and energy, defining Euclidean point-to-line distance.",
        "intuitive_essence_zh": "垂线的本质是'正交对称的最短路径极值'。垂线段以 $90^\\circ$ 的正交姿态截击直线，不偏不倚，具有左右完全对称的几何刚度，任何斜线段都因勾股定理必然长于垂线段。",
        "intuitive_essence_en": "Perpendicularity embodies orthogonal symmetry and minimum metric distance. Due to the Pythagorean theorem, any oblique line is strictly longer than the perpendicular segment.",
        "formal_definition_zh": "在同一平面内，过一点有且只有一条直线与已知直线垂直。连接直线外一点与直线上各点的所有线段中，垂线段最短（垂线段最短）。点到直线的距离：直线外一点到这条直线的垂线段的长度。线段垂直平分线：经过线段中点并且垂直于这条线段的直线，其上任意一点到线段两端点距离相等。",
        "formal_definition_en": "In a plane, exactly one line passes through a point perpendicular to a given line. The perpendicular segment is the shortest distance from point to line. Perpendicular bisector is the locus of points equidistant from segment endpoints.",
        "intrinsic_variation_zh": "中考模型变式：(1) 动点到直线距离的最小值问题（转化为向定直线作垂线段）；(2) 线段垂直平分线的性质逆定理应用：到两端点距离相等的点必在线段垂直平分线上；(3) 陷阱：把'垂线'（无限长直线）与'垂线段'（有限长线段）混为一谈导致距离概念错误。",
        "intrinsic_variation_en": "Extrema transformation: minimum point-to-line path is the perpendicular segment. Distinguish infinite perpendicular lines from finite perpendicular segments."
    },

    "KP-048": {
        "origin_story_zh": "铁轨两轨无论向前延伸多少千米都永不相交，这是列车平稳飞驰的前提；建筑物的立柱必须平行直立才能承托穹顶。古希腊欧几里得《几何原本》第五公设（平行公设）引发了数学史上两千多年的探索，它确立了平直欧氏空间的基石结构。",
        "origin_story_en": "Railway tracks never intersect, preserving train stability. Euclid's parallel postulate defined the flat geometry of our everyday physical universe.",
        "intuitive_essence_zh": "平行线的本质是'同一平面内几何方向与距离宽度的绝对不变性'。平行线之间的距离处处相等，任何截线穿过平行线族时，所截出的倾斜姿态角（同位角、内错角）在空间平移下保持刚性恒等。",
        "intuitive_essence_en": "Parallel lines preserve invariant direction and constant perpendicular spacing across the plane. A transversal transversal preserves rigid angular orientations (alternate/corresponding angles).",
        "formal_definition_zh": "在同一平面内，不相交的两条直线叫做平行线。公理：经过直线外一点，有且只有一条直线与这条直线平行。判定定理：同位角相等 $\\implies$ 两直线平行；内错角相等 $\\implies$ 两直线平行；同旁内角互补 $\\implies$ 两直线平行。性质定理：两直线平行 $\\implies$ 同位角相等；两直线平行 $\\implies$ 内错角相等；两直线平行 $\\implies$ 同旁内角互补。",
        "formal_definition_en": "Parallel lines lie in the same plane without intersecting. Criteria: corresponding angles equal $\\implies$ parallel; alternate interior equal $\\implies$ parallel; co-interior supplementary $\\implies$ parallel. Properties apply inversely.",
        "intrinsic_variation_zh": "中考几何折叠与拐角模型：(1) 拐角折线辅助线构造：遇'铅笔头'、'M型拐角'或'飞镖拐角'，必过拐点作平行线化归；(2) 纸带折叠中的角平分线与等腰三角形连环转化；(3) 陷阱：严重混淆'判定'（角推线平行）与'性质'（线平行推角关系），因果逻辑颠倒扣分。",
        "intrinsic_variation_en": "Auxiliary lines for parallel bends (M-shapes and zigzags): draw parallel lines through vertices. Distinguish conditions (proving parallelism) from consequences (concluding angle equality)."
    },

    "KP-049": {
        "origin_story_zh": "人类用三根木棍首尾相连绑在一起，用力推拉发现其形状坚不可摧，而四根木棍围成的四边形一推就变形。三角形的稳定性成为了房屋人字梁、起重机桁架结构的核心原理；而无论三角形胖瘦高矮，撕下三个内角拼在一起恰好拼成一条直线（平角 $180^\\circ$），揭示了欧氏平直空间的内蕴曲率为零。",
        "origin_story_en": "Triangles provide structural rigidity where quadrilaterals collapse under shear forces. Tearing and aligning the three angles of any triangle forms a straight line ($180^\\circ$), proving flat Euclidean zero curvature.",
        "intuitive_essence_zh": "三角形内角和与外角定理的本质是'欧氏平面闭合折线回转的角动量守恒'。沿三角形三边走完一圈身体刚好自转 360°（外角和 $360^\\circ$），每个外角恰好等于与其不相邻的两个内角之和。",
        "intuitive_essence_en": "Interior angles sum to $180^\\circ$ while exterior angles sum to $360^\\circ$. An exterior angle equals the exact sum of the two non-adjacent interior angles.",
        "formal_definition_zh": "由不在同一条直线上的三条线段首尾顺次相接所组成的图形叫做三角形。核心定理：(1) 三角形三个内角的和等于 $180^\\circ$；(2) 三角形的外角性质：三角形的一个外角等于与它不相邻的两个内角的和：$\\angle \\text{外} = \\angle A + \\angle B$；(3) 三角形的一个外角大于任何一个与它不相邻的内角；(4) 三角形的外角和等于 $360^\\circ$。",
        "formal_definition_en": "A triangle consists of three non-collinear segments joined end-to-end. Interior angles sum to $180^\\circ$. Exterior angle theorem: $\\angle \\text{ext} = \\angle A + \\angle B$, strictly greater than either individual non-adjacent interior angle.",
        "intrinsic_variation_zh": "中考凹四边形与星形角模型：(1) '飞镖模型'（凹四边形角公式）：$\\angle BDC = \\angle A + \\angle B + \\angle C$；(2) 五角星五个顶角和等于 $180^\\circ$；(3) 陷阱：角平分线交角公式应用混淆：两个内角平分线夹角为 $90^\\circ + \\frac{1}{2}\\angle A$，一个内角与一个外角平分线夹角为 $\\frac{1}{2}\\angle A$。",
        "intrinsic_variation_en": "Boomerang angle formula: $\\angle BDC = \\angle A + \\angle B + \\angle C$. Angle between two interior bisectors is $90^\\circ + \\frac{1}{2}\\angle A$; interior-exterior bisector angle is $\\frac{1}{2}\\angle A$."
    },

    "KP-050": {
        "origin_story_zh": "如果要用三根木条拼接一个三角形，若两根短木条长度之和小于第三根长木条，无论如何旋转两端都碰不到一起；若两短木条之和等于第三根，三根木条只能重合压成一条扁平线段。只有两边之和严格大于第三边，顶点才能隆起形成闭合空间。",
        "origin_story_en": "Attempting to build a triangle with sticks fails if the two shorter lengths cannot bridge the longest side. They collapse into a flat line if equal, and can only lift into a triangle when their sum strictly exceeds the third side.",
        "intuitive_essence_zh": "三边关系的本质是'两点之间线段最短这一公理在闭合折线上的直接投影'。从顶点 $A$ 走到顶点 $B$，直走线段 $c$ 必短于绕道走 $a+b$。",
        "intuitive_essence_en": "The triangle inequality directly reflects 'the shortest distance between two points is a line segment'. Stepping straight along edge $c$ is shorter than detouring through $a+b$.",
        "formal_definition_zh": "三角形三边关系定理：三角形任意两边之和大于第三边；三角形任意两边之差小于第三边。设三角形三边长为 $a, b, c$，则第三边 $c$ 的严格取值范围为：$|a - b| < c < a + b$。判断三条已知线段能否构成三角形的高效充要准则：只需检验'较小两条线段之和是否大于最长线段'即可。",
        "formal_definition_en": "Triangle inequality: sum of any two sides is strictly greater than the third side; difference of any two sides is less than the third side: $|a - b| < c < a + b$.",
        "intrinsic_variation_zh": "中考考题变式：(1) 已知两边长求第三边取值范围或整数边可能值；(2) 等腰三角形周长分类讨论陷阱：已知两边长为 3 和 7，腰长只能为 7（若腰长为 3，则 $3+3 < 7$ 无法构成三角形，必扣分陷阱）；(3) 结合代数绝对值化简：$|a+b-c| + |a-b-c|$。",
        "intrinsic_variation_en": "Isosceles triangle perimeter trap: sides 3 and 7 force leg to be 7, because $3+3 < 7$ violates triangle existence. Simplify $|a+b-c|$ using geometric bounds."
    },

    "KP-051": {
        "origin_story_zh": "工业大批量机械制造的灵魂是'零部件互换性'：同一型号的齿轮和活塞必须大小形状分毫不差，能够直接重合替换。几何学家需要寻找一组'判定两个三角形完全一致的最少几何测量条件'，从而诞生了 SSS、SAS、ASA、AAS 四大约束充要准则。",
        "origin_story_en": "Industrial manufacturing requires interchangeable parts. Triangle congruence criteria identify the minimal measurements needed to uniquely determine a triangle up to rigid isometry.",
        "intuitive_essence_zh": "全等三角形判定的本质是'三维刚体自由度的完全锁定约束'。三角形在平面上有 3 个独立自由度，SSS 锁定了三边边长，SAS 锁定了两边及其夹角张度，均消除了所有可能形变变形的空间。",
        "intuitive_essence_en": "Congruence criteria eliminate all deformation degrees of freedom, locking the triangle rigidly through SSS, SAS, ASA, or AAS configurations.",
        "formal_definition_zh": "能够完全重合的两个三角形叫做全等三角形。判定定理：(1) SSS（边边边）：三边分别相等的两三角形全等；(2) SAS（边角边）：两边及其夹角分别相等的两三角形全等（角必须是夹角）；(3) ASA（角边角）：两角及其夹边分别相等的两三角形全等；(4) AAS（角角边）：两角及其一角的对边分别相等的两三角形全等；(5) HL 定理：斜边和一条直角边分别相等的两个直角三角形全等。",
        "formal_definition_en": "Triangles that coincide completely under rigid motions are congruent. Standard criteria: SSS, SAS (angle must be included), ASA, AAS, and HL (hypotenuse-leg, exclusive to right triangles).",
        "intrinsic_variation_zh": "中考判定禁区与陷阱：(1) 🚨 绝无'SSA'（边边角）与'AAA'（角角角）判定定理！SSA 会产生两解钝角与锐角歧义，AAA 只能判定相似不能判定全等；(2) 构造全等辅助线三板斧：倍长中线法、截长补短法、旋转手拉手模型。",
        "intrinsic_variation_en": "CRITICAL TRAPS: SSA (side-side-angle) and AAA are NOT congruence criteria! SSA yields ambiguous obtuse/acute dual solutions; AAA proves only similarity, not congruence."
    },

    "KP-052": {
        "origin_story_zh": "判定全等只是手段，利用全等证明未知线段相等、未知角度相等才是最终目的。当复杂的几何图形中两条线段分散在不同角落无法直接比较时，通过全等变换将分散的线段角打包搬运至同一局部，是几何证明转化化归的通用桥梁。",
        "origin_story_en": "Proving congruence is a bridge to transport disconnected line segments and angles into unified local frames to prove geometric equivalence and perpendicularity.",
        "intuitive_essence_zh": "全等三角形性质的本质是'保距保角的刚体等距变换不变性'。在平移、旋转或翻折下，三角形内所有的线段长度、内角大小、周长、面积、内高、中线等所有几何度量全息完整保持。",
        "intuitive_essence_en": "Properties of congruence reflect isometric rigidity: distances, angles, perimeters, areas, altitudes, and medians remain invariant under rigid motions.",
        "formal_definition_zh": "全等三角形性质：(1) 全等三角形的对应边相等，对应角相等；(2) 全等三角形的对应高、对应中线、对应角平分线分别相等；(3) 全等三角形的周长相等，面积相等。书写对应顶点必须严格对齐：若 $\\triangle ABC \\cong \\triangle DEF$，则 $AB=DE, BC=EF, AC=DF$，$\\angle A = \\angle D, \\angle B = \\angle E, \\angle C = \\angle F$。",
        "formal_definition_en": "Congruent triangles have identical corresponding sides, angles, altitudes, medians, angle bisectors, perimeters, and areas. Vertex ordering must strictly match: $\\triangle ABC \\cong \\triangle DEF$.",
        "intrinsic_variation_zh": "中考核心应用：(1) 间接证明平行或垂直：由全等导出对应角相等，再由内错角相等推平行，或由互补角推垂直；(2) 陷阱：找错对应边角（必须先找公共边、公共角、对顶角，长边对长边，短边对短边，最大角对最大角）。",
        "intrinsic_variation_en": "Chained reasoning: deduce equal angles from congruence to prove parallel lines or $90^\\circ$ orthogonality. Match longest sides to longest, and largest angles to largest."
    },

    "KP-053": {
        "origin_story_zh": "在古代屋顶木架构架中，为了使房梁左右平衡对称承重，两根斜坡梁必须制作成严格等长，由此自然形成了等腰三角形。折叠对称性赋予了等腰三角形完美的几何优美特质，其中顶角平分线、底边中线与高线奇迹般地合而为一。",
        "origin_story_en": "Roof trusses require balanced load-bearing rafters of equal length, naturally forming isosceles triangles. Bilateral symmetry yields the renowned coincidence of bisector, median, and altitude.",
        "intuitive_essence_zh": "等腰三角形性质的本质是'关于底边垂直平分线的轴对称镜像不变性'。沿对称轴折叠，左半边与右半边完全重合，使得两底角等量对应，三条功能性分界线合为一体。",
        "intuitive_essence_en": "The essence is bilateral reflectional symmetry about the base's perpendicular bisector. Folding along the axis superimposes left onto right, equating base angles and fusing centerlines.",
        "formal_definition_zh": "有两条边相等的三角形叫做等腰三角形。性质定理：(1) 等边对等角：等腰三角形的两底角相等（$\\angle B = \\angle C$）；(2) '三线合一'：等腰三角形顶角平分线、底边上的中线、底边上的高互相重合，为同一条线段；(3) 等腰三角形是轴对称图形，对称轴是底边的垂直平分线（或顶角平分线所在的直线）。",
        "formal_definition_en": "An isosceles triangle has two equal legs. Theorems: 1) Equal legs subtend equal base angles; 2) 'Three-lines-in-one': apex angle bisector, base median, and base altitude coincide; 3) Axis of symmetry is base bisector.",
        "intrinsic_variation_zh": "中考几何黄金模型：'角平分线 + 平行线 = 必出等腰三角形'（极高频辅助线模型）；(2) 分类讨论陷阱：已知等腰三角形一个角为 $40^\\circ$，求其余角（必须分顶角为 $40^\\circ$ 与底角为 $40^\\circ$ 两种情况，得 $70^\\circ, 70^\\circ$ 或 $40^\\circ, 100^\\circ$；若已知角为钝角如 $100^\\circ$ 则只能为顶角）。",
        "intrinsic_variation_en": "Golden auxiliary model: angle bisector combined with parallel lines always generates an isosceles triangle. Angle ambiguity trap: $40^\\circ$ can be vertex or base angle."
    },

    "KP-054": {
        "origin_story_zh": "工人在现场检测一块三角形金属板两腰是否相等时，有时两边太长不易用尺直接测量，但用量角器测出两个底角完全相等。能否仅凭'两个角相等'就判定这两条边必然相等？'等角对等边'定理完成了从角度等量逆推边长等量的逆向闭环。",
        "origin_story_en": "Measuring long rafters can be harder than measuring base angles. The converse theorem 'equal angles imply equal opposite sides' completes the bidirectional bridge between angles and lengths.",
        "intuitive_essence_zh": "等角对等边的本质是'刚体全等构造的逆向对称回归'。作顶角平分线将三角形切为两半，通过 AAS 判定两半完全全等，从而强力迫使两腰长度完全锁死相等。",
        "intuitive_essence_en": "Proving legs equal via AAS by dropping the apex angle bisector forces bilateral congruence, driving the converse deduction.",
        "formal_definition_zh": "等腰三角形判定定理：如果一个三角形有两个角相等，那么这两个角所对的边也相等（简写成'等角对等边'）。推论：三个角都相等的三角形是等边三角形；有一个角是 $60^\\circ$ 的等腰三角形是等边三角形。",
        "formal_definition_en": "Converse theorem: If two angles of a triangle are equal, the sides opposite them are equal ('equal angles subtend equal sides'). Equilateral corollary: three equal angles, or an isosceles triangle with a $60^\\circ$ angle.",
        "intrinsic_variation_zh": "中考证明应用：(1) 动点几何中构造角相等导出线段相等，再由线段相等列方程求动点坐标；(2) 陷阱：在同一个三角形中才能使用'等角对等边'，若两个角分布在两个不同的独立三角形中，绝不能直接得出对应边相等（必须先证明全等）。",
        "intrinsic_variation_en": "Crucial premise constraint: 'equal angles subtend equal sides' holds ONLY within the SAME triangle. Never equate sides across different triangles without establishing congruence."
    },

    "KP-055": {
        "origin_story_zh": "六角形蜂巢由等边三角形拼合衍生，地砖正六边形镶嵌以等边三角形为基元。等边三角形是边与角对称性最圆满的正则多边形，三边相等、三角均为 60°，兼具 120° 旋转对称与三条轴对称轴，是几何旋转变换最天然的摇篮。",
        "origin_story_en": "Hexagonal honeycombs and tile tessellations rely on equilateral triangles. Possessing three-fold rotational ($120^\\circ$) and three bilateral symmetries, it serves as the ultimate cradle for geometric rotations.",
        "intuitive_essence_zh": "等边三角形的本质是'二维平面中最完美的正多边形三位一体对称性'。任何一个顶点既是顶角顶点也是底角顶点，三条高、三条中线、三条角平分线、外心、内心、重心、垂心九心全部合一。",
        "intuitive_essence_en": "Complete threefold rotational and reflectional symmetry: circumcenter, incenter, centroid, and orthocenter coalesce into a single unified point.",
        "formal_definition_zh": "三条边都相等的三角形叫做等边三角形（也称正三角形）。性质：(1) 三边相等，三个内角都相等且每一个内角都等于 $60^\\circ$；(2) 具有三线合一性，三条高（中线、角平分线）交于一点；(3) 边长为 $a$ 时，高为 $h = \\frac{\\sqrt{3}}{2}a$，面积为 $S = \\frac{\\sqrt{3}}{4}a^2$。判定：(1) 三边相等的三角形；(2) 三角相等的三角形；(3) 有一个角是 $60^\\circ$ 的等腰三角形。",
        "formal_definition_en": "An equilateral triangle has 3 equal sides and 3 angles of $60^\\circ$. For side $a$, altitude $h = \\frac{\\sqrt{3}}{2}a$, area $S = \\frac{\\sqrt{3}}{4}a^2$. Criteria: 3 equal sides, 3 equal angles, or isosceles with one $60^\\circ$ angle.",
        "intrinsic_variation_zh": "中考旋转压轴大题：(1) 绕等边三角形顶点的 $60^\\circ$ 手拉手旋转全等模型；(2) 费马点问题（到三顶点距离之和最小的点）；(3) 陷阱：证明等边三角形时，已知两边相等且有一个角是 $60^\\circ$，必须明确该 $60^\\circ$ 角无论是顶角还是底角都能推得等边，但必须给出完整角推导步骤。",
        "intrinsic_variation_en": "Hand-in-hand $60^\\circ$ rotational congruence model around equilateral vertices. Fermat point optimization minimizing sum of distances to three vertices."
    },

    "KP-056": {
        "origin_story_zh": "直角是建筑施工与大地测绘中唯一的正交基准。古代工匠用一段打了12个等距结的绳子围成 3:4:5 的三角形，便能在地面精确放样出 $90^\\circ$ 直角。直角三角形连接了平面的角度度量与线段度量，其斜边中线性质更是圆周角定理在三角形中的几何雏形。",
        "origin_story_en": "Egyptian surveyors tied 12-knot ropes into 3:4:5 triangles to lay out true right angles. The right triangle bridges metric lengths and angles, with its hypotenuse median foreshadowing Thales' circle theorem.",
        "intuitive_essence_zh": "直角三角形的本质是'欧氏距离平方和正交守恒与外接圆直径对角性'。斜边中点恰好是直角三角形外接圆的圆心，斜边就是直径，斜边中线自然等于外接圆半径。",
        "intuitive_essence_en": "Orthogonal coordinate metric. The hypotenuse acts as the diameter of its circumscribed circle; hence the hypotenuse median equals the circumradius $R = c/2$.",
        "formal_definition_zh": "有一个角是直角（$90^\\circ$）的三角形叫做直角三角形（记作 $\\text{Rt}\\triangle$）。核心性质：(1) 两锐角互余：$\\angle A + \\angle B = 90^\\circ$；(2) 勾股定理：$a^2 + b^2 = c^2$；(3) 斜边中线定理：直角三角形斜边上的中线等于斜边的一半（$CD = \\frac{1}{2}AB$）；(4) $30^\\circ$ 角特殊性质：在直角三角形中，如果有一个锐角等于 $30^\\circ$，那么它所对的直角边等于斜边的一半（$a = \\frac{1}{2}c$）。",
        "formal_definition_en": "Right triangle properties: 1) Acute angles are complementary; 2) $a^2 + b^2 = c^2$; 3) Median to the hypotenuse equals half the hypotenuse ($m_c = c/2$); 4) The side opposite a $30^\\circ$ angle is half the hypotenuse.",
        "intrinsic_variation_zh": "中考高频模型：(1) 双直角母子三角形射影定理：$h^2 = p \\cdot q, a^2 = p \\cdot c, b^2 = q \\cdot c$；(2) 遇到中点条件，常联想'斜边中线翻倍'或'斜边中线等于一半'辅助线；(3) 陷阱：应用 $30^\\circ$ 角性质时前提必须是直角三角形，锐角或钝角三角形不可套用。",
        "intrinsic_variation_en": "Projection altitude theorem: $h^2 = p \\cdot q$. Always check whether hypotenuse median construction can unlock midpoint problems. $30^\\circ$ half-side property strictly requires a right angle."
    },

    "KP-057": {
        "origin_story_zh": "古巴比伦泥板普林顿322号记录了大量勾股数，商高答周公曰'勾广三，股修四，径隅五'。中国三国时期数学家赵爽创制'弦图'，用四个全等直角三角形拼成大正方形包围中央小正方形，以精妙绝伦的面积割补直接证明了千古第一定理——勾股定理。",
        "origin_story_en": "Zhoubi Suanjing recorded 3:4:5 triples. Zhao Shuang invented the 'Hypotenuse Diagram', dissecting four congruent right triangles inside a square to yield the timeless visual proof of the Pythagorean theorem.",
        "intuitive_essence_zh": "勾股定理的本质是'正交空间中欧氏距离的保方度量不变性'。直角三角形两直角边上的两个正方形面积之和，在几何割补与守恒下，毫发不差地等于斜边正方形的面积：$S_a + S_b = S_c$。",
        "intuitive_essence_en": "The Pythagorean theorem represents the area conservation of orthogonal projections: the sum of the square areas on the legs strictly equals the square area on the hypotenuse: $a^2 + b^2 = c^2$.",
        "formal_definition_zh": "勾股定理：直角三角形两直角边 $a, b$ 的平方和等于斜边 $c$ 的平方，即 $a^2 + b^2 = c^2$。勾股定理逆定理：如果三角形的三边长 $a, b, c$ 满足 $a^2 + b^2 = c^2$，那么这个三角形是直角三角形，其中 $c$ 为斜边。常见勾股数（正整数三元组）：$(3,4,5), (5,12,13), (8,15,17), (7,24,25), (9,40,41)$ 及其正整数倍数。",
        "formal_definition_en": "Pythagorean Theorem: In $\\text{Rt}\\triangle ABC$ with $\\angle C = 90^\\circ$, $a^2 + b^2 = c^2$. Converse: If $a^2 + b^2 = c^2$, the triangle is a right triangle with hypotenuse $c$. Triples: $(3,4,5), (5,12,13), (8,15,17)$.",
        "intrinsic_variation_zh": "中考几何压轴母机：(1) 折叠问题设元列勾股方程：折叠产生轴对称全等，设未知数 $x$，在直角三角形中列 $x^2 + b^2 = (c-x)^2$ 代数求解；(2) 空间最短路径（圆柱/圆锥侧面展开图化为平面勾股）；(3) 致命分类讨论陷阱：'已知直角三角形两边为 3 和 4，求第三边'，必须分 4 是直角边（第三边为 5）与 4 是斜边（第三边为 $\\sqrt{7}$）两种情况！",
        "intrinsic_variation_en": "Folding problems: set $x$ along fold line and solve quadratic Pythagorean equation. Classification trap: sides 3 and 4 yield third side 5 (if 4 is leg) or $\\sqrt{7}$ (if 4 is hypotenuse)."
    },

    "KP-058": {
        "origin_story_zh": "泰勒斯来到埃及吉萨大金字塔前，法老问他如何测量金字塔的参天高度。泰勒斯静立阳光下，等到自己的影子长度恰好等于自己的身高时，宣布金字塔的阴影长度就是金字塔的高度。利用太阳光平行投影的角相等三角形相似原理，人类第一次实现了宏观巨构的非接触远程度量。",
        "origin_story_en": "Thales measured the Great Pyramid by standing in sunlight until his shadow matched his height, measuring the pyramid's shadow simultaneously. Parallel solar rays formed similar triangles, birthing non-contact measurement.",
        "intuitive_essence_zh": "相似三角形的本质是'保持图形形状刚度不变的均匀空间缩放变换'。对应角相等锁定了三角形的形态长相，对应边成比例锁定了缩放比例尺 $k$，全等三角形是相似比 $k=1$ 时的特例退化态。",
        "intuitive_essence_en": "Similarity preserves geometric shape under uniform scaling. Angles dictate shape; side ratios dictate scale factor $k$. Congruence is similarity at $k=1$.",
        "formal_definition_zh": "三角对应相等、三边成比例的两个三角形叫做相似三角形（记作 $\\triangle ABC \\sim \\triangle A'B'C'$）。判定定理：(1) 平行截割定理：平行于三角形一边的直线截其他两边，所得三角形与原三角形相似；(2) AA 判定（两角对应相等）：$\\angle A = \\angle A', \\angle B = \\angle B' \\implies \\triangle ABC \\sim \\triangle A'B'C'$；(3) SAS 相似（两边成比例且夹角相等）：$\\frac{AB}{A'B'} = \\frac{AC}{A'C'}$ 且 $\\angle A = \\angle A'$；(4) SSS 相似（三边成比例）。",
        "formal_definition_en": "Criteria: 1) Line parallel to a side forms a similar triangle; 2) AA criterion (two equal angles); 3) SAS similarity (two proportional sides with equal included angle); 4) SSS similarity (three proportional sides).",
        "intrinsic_variation_zh": "中考四大核心相似基本几何构型：(1) 'A字型'与'反A字型'相似；(2) '8字型'（沙漏型）与'反8字型'（蝶形）相似；(3) '母子型'（共享公共角直角高相似）；(4) '一线三等角'（三等角同侧模型，压轴动点必考母题）；(5) 陷阱：SAS 相似中角必须是两比例边的夹角，非夹角不可判定相似。",
        "intrinsic_variation_en": "Canonical similarity archetypes: A-type, 8-type (hourglass/butterfly), mother-child right triangles, and three-equal-angles along a line. SAS requires the angle to be strictly included."
    },

    "KP-059": {
        "origin_story_zh": "地图比例尺为 1:1000 时，图上面积难道也是实际面积的一千分之一吗？不是，面积是长与宽两个维度的同时缩放，面积比是比例尺的平方倍（1:1000000）。伽利略在研究动物骨骼力学时指出：体型放大2倍，体重放大8倍（立方），而骨骼截面只放大4倍（平方），相似的尺度缩放性质决定了生物与工程的物理极限。",
        "origin_story_en": "A 1:1000 scale map scales area by $(1/1000)^2 = 1:10^6$. Galileo showed that scaling up linear size by 2 magnifies weight by 8 (volume) but bone strength by only 4 (cross-section area). Scale powers govern geometry.",
        "intuitive_essence_zh": "相似性质的本质是'几何量纲与相似比 $k$ 的幂次方正比律'。一维长度度量（周长、高、中线、角平分线）与相似比 $k$ 成一次正比；二维面积度量与相似比平方 $k^2$ 成正比；三维体积度量与 $k^3$ 成正比。",
        "intuitive_essence_en": "Dimensional power scaling: 1D lengths (perimeters, altitudes, medians) scale with ratio $k$; 2D areas scale with $k^2$; 3D volumes scale with $k^3$.",
        "formal_definition_zh": "相似三角形基本性质：若 $\\triangle ABC \\sim \\triangle A'B'C'$，相似比为 $k = \\frac{AB}{A'B'}$，则：(1) 对应角相等，对应边成比例；(2) 对应高之比、对应中线之比、对应角平分线之比都等于相似比 $k$；(3) 周长之比等于相似比 $k$；(4) 面积之比等于相似比的平方：$\\frac{S_{\\triangle ABC}}{S_{\\triangle A'B'C'}} = k^2$。",
        "formal_definition_en": "Properties: Corresponding linear measures (altitudes, medians, bisectors, perimeters) scale directly by similarity ratio $k$. Areas scale by the square of similarity ratio $k^2$.",
        "intrinsic_variation_zh": "中考压轴变式：(1) 动点二次函数面积比转化：由相似比为 $t$，列出面积比为 $t^2$ 的二次函数极值方程；(2) 梯形对角线分割的四个小三角形面积比模型（$S_1:S_2:S_3:S_4 = 1:k:k:k^2$）；(3) 致命陷阱：由面积比直接算线段比时，忘记开平方（如面积比为 1:4，线段比为 1:2 而非 1:4）。",
        "intrinsic_variation_en": "Trapezoid diagonal intersection areas: $1:k:k:k^2$. Common trap: when given area ratio $1:4$, the side length ratio is $\\sqrt{1:4} = 1:2$, not $1:4$."
    },

    "KP-060": {
        "origin_story_zh": "放映机把胶片上的微小图像投射到巨大白幕上，光线从镜头聚焦点沿直线穿透胶片打在屏幕上，画面整体等比例放大且方向对齐。这就是位似变换。它把平面图形的缩放中心化，提供了一种通过单一基准点（位似中心）快速生成任意比例相似图形的几何工具。",
        "origin_story_en": "Projectors shine light from a focal point through film onto a screen, enlarging images proportionally along light rays. Homothety anchors dilation to a single dilation center point.",
        "intuitive_essence_zh": "位似图形的本质是'以定点为发射源的相似光线投影中心放大缩小'。它比普通相似更严苛：不仅形状相似，而且所有对应顶点的连线必须相交于同一点（位似中心），所有对应边必须互相平行（或在同一直线上）。",
        "intuitive_essence_en": "Homothety is similarity with parallel corresponding edges and rays through a common center. It represents central perspective projection with dilation ratio $k$.",
        "formal_definition_zh": "如果两个多边形不仅相似，而且对应顶点的连线相交于一点，对应边互相平行（或在同一直线上），那么这两个图形叫做位似图形，这个点叫做位似中心。在坐标系中，以原点为位似中心的位似变换公式：若位似比为 $k$，则点 $P(x, y)$ 的对应点坐标为 $(kx, ky)$ 或 $(-kx, -ky)$（正向位似同侧，反向位似异侧）。",
        "formal_definition_en": "Homothetic figures are similar figures whose corresponding vertices connect through a concurrent dilation center, with corresponding edges parallel. In coordinates with center at origin, $P(x,y) \\to (kx, ky)$ or $(-kx, -ky)$.",
        "intrinsic_variation_zh": "中考坐标作图陷阱：以原点为位似中心画位似图形，若题目未指明在原点同侧还是异侧，必有两解！对应点坐标不仅有 $(kx, ky)$，还有关于原点倒立对称的 $(-kx, -ky)$，遗漏反向位似解是扣分重灾区。",
        "intrinsic_variation_en": "Coordinate dilation ambiguity: Dilation by factor $k$ relative to origin yields dual solutions $(kx,ky)$ and $(-kx,-ky)$ unless orientation/side is explicitly specified."
    },

    "KP-061": {
        "origin_story_zh": "从三条边的三角形到任意多边形，图形变得越来越复杂。古希腊几何学家发现：任意一个多边形，只要从一个顶点出发连接不相邻的顶点，都可以把这个多边形完全剖分为若干个三角形。复杂的任意多边形内角和，瞬间化归为三角形内角和的简单整数倍累加。",
        "origin_story_en": "Connecting diagonals from a single vertex partitions any $n$-sided polygon into $n-2$ non-overlapping triangles. This reduces complex polygon angle sums to multiples of $180^\\circ$.",
        "intuitive_essence_zh": "多边形内角和与外角和的本质是'剖分三角形降维与闭合路径回转角动量守恒'。无论多边形有多少条边（哪怕有一万条边），绕其周界走完一圈的转角总和（外角和）恒为 360°，这是一个纯粹拓扑不变量！",
        "intuitive_essence_en": "The interior sum grows linearly: $(n-2) \\times 180^\\circ$. The exterior sum remains an absolute topological invariant: exactly $360^\\circ$ regardless of edge count $n$.",
        "formal_definition_zh": "多边形内角和与外角和公式：(1) $n$ 边形内角和定理：$S_n = (n - 2) \\times 180^\\circ$ ($n \\geq 3, n \\in \\mathbb{Z}$)；(2) 多边形外角和定理：任意多边形的外角和恒等于 $360^\\circ$；(3) 正 $n$ 边形性质：每个内角为 $\\frac{(n-2) \\times 180^\\circ}{n}$，每个外角为 $\\frac{360^\\circ}{n}$；(4) 从 $n$ 边形一个顶点出发可引 $(n-3)$ 条对角线，把多边形分成 $(n-2)$ 个三角形，对角线总条数为 $\\frac{n(n-3)}{2}$。",
        "formal_definition_en": "Interior angle sum: $(n-2) \\times 180^\\circ$. Exterior angle sum: invariant $360^\\circ$. Regular $n$-gon interior angle: $\\frac{(n-2)180^\\circ}{n}$; exterior angle: $\\frac{360^\\circ}{n}$. Total diagonals: $\\frac{n(n-3)}{2}$.",
        "intrinsic_variation_zh": "中考逆向求解模型：(1) 已知正多边形一个内角（如 $144^\\circ$），求边数：切忌用内角公式硬解方程，先算外角 $180^\\circ - 144^\\circ = 36^\\circ$，再用外角和秒杀 $n = 360^\\circ / 36^\\circ = 10$（速算利器）；(2) 多边形剪去一个角后边数的变化（可增 1、减 1 或不变）；(3) 平面密铺镶嵌条件（顶点处各内角和整除 $360^\\circ$）。",
        "intrinsic_variation_en": "Fast side determination: compute exterior angle first ($180^\\circ - \\text{interior}$), then divide into $360^\\circ$. Cutting one corner changes vertex count by $+1, 0,$ or $-1$."
    },

    "KP-062": {
        "origin_story_zh": "在伸缩晾衣架、折叠铁闸门中，四根金属杆首尾铰接，随手一拉便能自由平移伸缩。这种利用两组对边分别平行的机械联动机构，在保持平行方向的同时可以产生连续的平移形变。平行四边形是对边平行与对角线中心对称的完美几何结合体。",
        "origin_story_en": "Scissor gates and pantographs use hinged parallelograms to translate motion while preserving parallel alignments. Central symmetry unites its opposite edges and diagonals.",
        "intuitive_essence_zh": "平行四边形的本质是'以对角线交点为对称中心的 180° 中心对称闭合图形'。中心对称性直接支配了它的一切性质：对边必然相等、对角必然相等、对角线必然互相平分。",
        "intuitive_essence_en": "A parallelogram is a centrally symmetric quadrilateral about its diagonal intersection. 180° rotational symmetry directly dictates equal opposite sides, equal opposite angles, and bisecting diagonals.",
        "formal_definition_zh": "两组对边分别平行的四边形叫做平行四边形（记作 $\\square ABCD$）。性质定理：(1) 对边平行且相等：$AB \\parallel CD, AB = CD$；$AD \\parallel BC, AD = BC$；(2) 对角相等，邻角互补：$\\angle A = \\angle C, \\angle B = \\angle D$；$\\angle A + \\angle B = 180^\\circ$；(3) 对角线互相平分：$OA = OC, OB = OD$；(4) 平行四边形是中心对称图形，对称中心是对角线的交点 $O$；(5) 过对称中心的任意一条直线平分其周长与面积。",
        "formal_definition_en": "A quadrilateral with two pairs of parallel opposite sides. Properties: opposite sides are parallel and equal; opposite angles are equal, adjacent angles are supplementary; diagonals bisect each other; symmetric about diagonal intersection.",
        "intrinsic_variation_zh": "中考高频模型：(1) 面积平分线：过对角线交点的任意直线必将平行四边形面积对半平分；(2) 面积计算：$S = ah$ 或 $S = ab \\sin \\alpha$；(3) 陷阱：平行四边形只是中心对称图形，不是轴对称图形（一般平行四边形无对称轴），不可乱用折叠重合。",
        "intrinsic_variation_en": "Any line passing through the diagonal intersection halves both perimeter and area. Note: general parallelograms possess central symmetry but NO axial reflection symmetry."
    },

    "KP-063": {
        "origin_story_zh": "木工组装窗框，没有量角器测平行线，如何仅靠一把卷尺测出边长就能确认框架做成了合格的平行四边形？几何学家推导出了五种互为等价的判定条件：只要两组对边分别相等、或一组对边平行且相等、或对角线互相平分，框架便能瞬间锁死为平行四边形。",
        "origin_story_en": "Carpenters checking rectangular frames without protractors measure tape diagonals and sides. Five equivalent criteria determine parallelism using tape measurements alone.",
        "intuitive_essence_zh": "平行四边形判定的本质是'用最少的局部度量约束激活全局中心对称性'。一组对边平行且相等（'平行且相等'锁定一个封闭环），或对角线平分（锁定中心点），即构成充分必要条件。",
        "intuitive_essence_en": "Criteria lock central symmetry with minimal constraints: one pair parallel and equal, both pairs equal, or bisecting diagonals.",
        "formal_definition_zh": "平行四边形五大判定定理：(1) 定义法：两组对边分别平行的四边形是平行四边形；(2) 边判定 1：两组对边分别相等的四边形是平行四边形；(3) 边判定 2（最常用）：一组对边平行且相等的四边形是平行四边形；(4) 角判定：两组对角分别相等的四边形是平行四边形；(5) 对角线判定：对角线互相平分的四边形是平行四边形。",
        "formal_definition_en": "Five criteria: 1) Definition: two pairs of parallel sides; 2) Two pairs of equal sides; 3) One pair parallel AND equal; 4) Two pairs of equal opposite angles; 5) Diagonals bisecting each other.",
        "intrinsic_variation_zh": "中考几何动点压轴：'以已知四点为顶点构成平行四边形，求动点坐标'：(1) 对角线中点坐标公式秒杀法：若 $ABCD$ 为平行四边形，则 $x_A + x_C = x_B + x_D$ 且 $y_A + y_C = y_B + y_D$；(2) 致命陷阱：'一组对边平行，另一组对边相等'绝不能判定平行四边形（可能是等腰梯形，典型反例陷阱）。",
        "intrinsic_variation_en": "Coordinate shortcut: $x_A + x_C = x_B + x_D$ from bisecting midpoints. Fatal trap: one pair parallel and the OTHER pair equal does NOT prove a parallelogram (e.g. isosceles trapezoid)."
    },

    "KP-064": {
        "origin_story_zh": "古往今来人类建造的房屋门窗、纸张书页、电视屏幕，绝大多数都是矩形。因为只有直角才能确保物体水平放置不滑落、垂直堆叠不倾倒。矩形在平行四边形倾斜框架的基础上加入了一个 $90^\\circ$ 直角约束，赋予了图形高度的几何正交对称性。",
        "origin_story_en": "Doors, windows, and screens are rectangular because right angles allow vertical stacking without shear. Adding a single $90^\\circ$ constraint to a parallelogram yields orthogonality and equal diagonals.",
        "intuitive_essence_zh": "矩形的本质是'兼具中心对称与双垂直轴对称的正交平行四边形'。直角消除了倾斜偏度，迫使两条对角线刚性拉伸至完全相等，其交点与四个顶点的距离绝对均等（四点共圆）。",
        "intuitive_essence_en": "Orthogonal parallelogram with dual reflectional axes and equal diagonals. The diagonal intersection is the circumcenter equidistant to all four vertices ($OA=OB=OC=OD$).",
        "formal_definition_zh": "有一个角是直角的平行四边形叫做矩形（俗称长方形）。性质定理：(1) 具有平行四边形的所有性质；(2) 四个角都是直角：$\\angle A = \\angle B = \\angle C = \\angle D = 90^\\circ$；(3) 对角线相等且互相平分：$AC = BD$，$OA = OB = OC = OD$；(4) 是轴对称图形，有 2 条对称轴（对边中点连线）。判定定理：(1) 有一个角是直角的平行四边形；(2) 对角线相等的平行四边形；(3) 有三个角是直角的四边形。",
        "formal_definition_en": "A parallelogram with one right angle. Properties: all four angles are $90^\\circ$; diagonals are equal and bisect each other; two axes of symmetry. Criteria: parallelogram with one right angle; parallelogram with equal diagonals; quadrilateral with three right angles.",
        "intrinsic_variation_zh": "中考几何折叠与动点：(1) 矩形沿对角线或任意折痕折叠问题（必出等腰三角形与勾股方程）；(2) 对角线中点到四顶点等距性质（四点共圆动点最值）；(3) 陷阱：对角线相等的四边形是矩形是错误的（必须先证明它是平行四边形，否则等腰梯形对角线也相等）。",
        "intrinsic_variation_en": "Paper folding over diagonals yields congruent right triangles and isosceles overlaps. Trap: 'quadrilateral with equal diagonals' is NOT necessarily a rectangle (could be isosceles trapezoid)."
    },

    "KP-065": {
        "origin_story_zh": "风筝在空中平稳翱翔，其龙骨骨架由两条互相垂直相交的竹条扎成；菱形路标以其尖锐向外的四角产生强烈的视觉警示。菱形在平行四边形的基础上加入了'邻边相等'约束，使得四条边完全均衡对称，对角线产生垂直正交性质。",
        "origin_story_en": "Kite skeletons cross two perpendicular spars. A rhombus imposes equal adjacent sides on a parallelogram, resulting in four equal sides and mutually perpendicular diagonals.",
        "intuitive_essence_zh": "菱形的本质是'由四条等长线段铰接而成的纯剪切对角正交四边形'。两条对角线不仅互相垂直平分，而且分别平分其相对的两组对角，面积等于对角线乘积的一半。",
        "intuitive_essence_en": "Shear-symmetric parallelogram with mutually perpendicular diagonals that bisect corner angles. Area equals half the product of the diagonals: $S = \\frac{1}{2} d_1 d_2$.",
        "formal_definition_zh": "有一组邻边相等的平行四边形叫做菱形。性质定理：(1) 具有平行四边形的所有性质；(2) 四条边都相等：$AB = BC = CD = DA$；(3) 对角线互相垂直平分，并且每一条对角线平分一组对角：$AC \\perp BD$；(4) 面积公式：$S = ah = \\frac{1}{2} AC \\cdot BD$；(5) 是轴对称图形，有 2 条对称轴（对角线所在的直线）。判定定理：(1) 一组邻边相等的平行四边形；(2) 对角线互相垂直的平行四边形；(3) 四条边都相等的四边形。",
        "formal_definition_en": "A parallelogram with equal adjacent sides. Properties: four equal sides; diagonals are perpendicular bisectors and angle bisectors; area $S = \\frac{1}{2} d_1 d_2$; symmetric about diagonals. Criteria: parallelogram with equal adjacent sides; parallelogram with perpendicular diagonals; quadrilateral with 4 equal sides.",
        "intrinsic_variation_zh": "中考高频压轴模型：(1) $60^\\circ$ 菱形化归为两个等边三角形手拉手模型；(2) 菱形内动点最值（利用对角线垂直与垂线段最短）；(3) 陷阱：对角线互相垂直的四边形是菱形是错误的（缺少平行四边形前提，如普通筝形对角线也垂直）。",
        "intrinsic_variation_en": "$60^\\circ$ rhombi partition into dual equilateral triangles. Trap: perpendicular diagonals alone do NOT make a rhombus without the parallelogram premise (kites are a counterexample)."
    },

    "KP-066": {
        "origin_story_zh": "正方形是欧氏平面几何中最完美的终极四边形。它既是直角拉满的矩形，又是四边等长的菱形。中国古代铜钱'外圆内方'、现代芯片精密引脚网格排布，无不以正方形为极致对称的理想空间模具。",
        "origin_story_en": "The square is the ultimate planar quadrilateral, simultaneously a rectangle with equal sides and a rhombus with right angles. It harmonizes bilateral, rotational, and diagonal symmetries.",
        "intuitive_essence_zh": "正方形的本质是'矩形的正交性与菱形的保长性在四阶旋转下的终极合一'。它拥有四条相等边、四个直角，具有 4 条对称轴与 90° 旋转不变性，是对称度最高的四边形皇冠。",
        "intuitive_essence_en": "Synthesis of orthogonal rectangles and equilateral rhombi. Possesses 4 axes of symmetry and 90° rotational symmetry.",
        "formal_definition_zh": "有一组邻边相等且有一个角是直角的平行四边形叫做正方形。性质定理：正方形兼具矩形与菱形的一切性质！(1) 四边相等，四角都是 $90^\\circ$；(2) 对角线相等、互相垂直平分，且每条对角线平分一组对角，与边夹角为 $45^\\circ$；(3) 具有 4 条对称轴；(4) 边长为 $a$ 时，对角线为 $\\sqrt{2}a$，面积 $S = a^2 = \\frac{1}{2} d^2$。判定路径：平行四边形 + 矩形特征 + 菱形特征 $\\implies$ 正方形。",
        "formal_definition_en": "A parallelogram with equal adjacent sides and a right angle. Unites ALL properties of rectangles and rhombi: 4 equal sides, 4 right angles, diagonals equal and perpendicular, 4 axes of symmetry. Diagonal length $d = \\sqrt{2}a$.",
        "intrinsic_variation_zh": "中考压轴王牌模型：(1) '半角模型'：绕正方形顶点含 $45^\\circ$ 旋转半角模型（截长补短与旋转全等）；(2) '十字架模型'：正方形内两垂直线段长度相等；(3) 坐标系中求正方形顶点坐标的'K字型全等直角三角形'辅助线；(4) 陷阱：判定时混淆逻辑链（矩形只需加菱形特征，菱形只需加矩形特征，平行四边形则需二者兼具）。",
        "intrinsic_variation_en": "Square master models: $45^\\circ$ half-angle rotation model; perpendicular cross model ($L_1 \\perp L_2 \\implies L_1 = L_2$); K-shape auxiliary right triangles in coordinates."
    },

    "KP-067": {
        "origin_story_zh": "大坝水闸的迎水断面之所以修筑成上窄下宽的梯形，是为了顺应水深越深压强越大的物理规律，增强坝底抗剪切力。一组对边平行保证了平整水平承压，另一组对边不平行适应了坡度排水，催生了梯形几何体系。",
        "origin_story_en": "Dam cross-sections taper from narrow crests to wide bases, resisting hydrostatic pressure increasing with depth. One pair of parallel bases provides level support, defining the trapezoid.",
        "intuitive_essence_zh": "梯形的本质是'平行四边形破损一组平行线后的单向平行过渡形态'。等腰梯形是对称性的局部保留（轴对称），直角梯形是正交性的局部保留。",
        "intuitive_essence_en": "A quadrilateral with only one pair of parallel sides. Isosceles trapezoids retain axial reflection; right trapezoids retain orthogonality.",
        "formal_definition_zh": "一组对边平行而另一组对边不平行的四边形叫做梯形。平行的两边叫做底（通常较短的为上底，较长的为下底），不平行的两边叫做腰。等腰梯形性质：(1) 两腰相等；(2) 同一底上的两个角相等；(3) 对角线相等；(4) 是轴对称图形。梯形面积公式：$S = \\frac{1}{2}(a + b)h$。",
        "formal_definition_en": "A quadrilateral with exactly one pair of parallel sides (bases). In an isosceles trapezoid, non-parallel legs are equal, base angles are equal, diagonals are equal, and it has one axis of symmetry. Area $S = \\frac{1}{2}(a+b)h$.",
        "intrinsic_variation_zh": "中考梯形常用辅助线'五种平移转化武器'：(1) 平移一腰化归为平行四边形和三角形；(2) 作双高形成矩形和两个直角三角形；(3) 延长两腰相交于一点化归为大三角形；(4) 平移一条对角线；(5) 连接一腰中点与另一端点延长；(6) 陷阱：误以为梯形都是轴对称图形（只有等腰梯形才是）。",
        "intrinsic_variation_en": "Five classic auxiliary lines for trapezoids: shift leg, drop dual altitudes, extend legs to apex, shift diagonal, or extend waist midpoint. General trapezoids lack symmetry."
    },

    "KP-068": {
        "origin_story_zh": "古希腊几何学家瓦里尼翁在草稿纸上随手画了一个完全不规则、歪歪扭扭的四边形，然后用直尺连接了它四条边的中点。神奇的事情发生了：无论原来的四边形多么扭曲丑陋，四条中点连成的内嵌四边形，居然永远是一个端端正正的平行四边形！这就是著名的瓦里尼翁定理（中点四边形）。",
        "origin_story_en": "Pierre Varignon discovered that connecting the four midpoints of ANY arbitrary quadrilateral always forms an immaculate parallelogram, proving universal order hidden inside irregular chaos.",
        "intuitive_essence_zh": "中点四边形的本质是'三角形中位线定理在空间四边形上的二次平行传递闭环'。中位线平行且等于底边一半，原四边形的两条对角线直接决定了中点四边形的全部性状！",
        "intuitive_essence_en": "Driven by the triangle midsegment theorem: midsegments parallel and half their opposite diagonals. The diagonals of the original quadrilateral dictate the shape of the midpoint polygon.",
        "formal_definition_zh": "顺次连接任意四边形各边中点所得的四边形叫做中点四边形。核心规律总结（由原四边形对角线关系唯一定型）：(1) 任意四边形的中点四边形都是平行四边形（由三角形中位线定理得证）；(2) 对角线垂直的四边形 $\\implies$ 中点四边形是矩形；(3) 对角线相等的四边形 $\\implies$ 中点四边形是菱形；(4) 对角线既垂直又相等的四边形 $\\implies$ 中点四边形是正方形；(5) 中点四边形面积恒等于原四边形面积的一半。",
        "formal_definition_en": "Varignon's Theorem: Connecting midpoints of any quadrilateral forms a parallelogram. If diagonals are perpendicular $\\implies$ rectangle; if diagonals are equal $\\implies$ rhombus; if both $\\implies$ square. Area is always half the original.",
        "intrinsic_variation_zh": "中考真题秒杀变式：(1) 给出风筝或等腰梯形，求其中点四边形形状（对角线垂直出矩形，对角线相等出菱形）；(2) 面积比例关系计算；(3) 陷阱：中点四边形的形状只由原四边形的'对角线关系'决定，与原四边形的'边长关系'毫无必然联系！",
        "intrinsic_variation_en": "Shape dependency rule: Midpoint polygon depends EXCLUSIVELY on diagonal relations (perpendicular $\\implies$ rectangle, equal $\\implies$ rhombus), completely independent of boundary edge lengths."
    },

    "KP-069": {
        "origin_story_zh": "《墨子》曰：'圆，一中同长也。'古人从圆月、落日、水波涟漪中观察到完美的圆，发明了车轮。车轮之所以能平稳滚动而不颠簸，正是因为轮轴位于圆心，车轮边缘任意一点到轴心的距离严格保持恒定。圆是自然界最普适的几何图腾。",
        "origin_story_en": "Ancient philosopher Mozi defined: 'A circle has one center and equal lengths.' Wheel hubs roll smoothly without bumping because every rim point remains equidistant from the center.",
        "intuitive_essence_zh": "圆的本质是'动点到定点的欧氏距离恒定不变量的连续轨迹'。圆心确定圆的空间位置，半径确定圆的空间大小，它是平面内封闭周长一定时包围面积最大的等周极值图形。",
        "intuitive_essence_en": "The circle is the geometric locus of points equidistant from a fixed center. The center fixes location; the radius fixes magnitude. It solves the isoperimetric problem, maximizing enclosed area.",
        "formal_definition_zh": "圆的定义：平面内到定点的距离等于定长的所有点的集合叫做圆。定点叫做圆心，定长叫做半径（记作 $\\odot O$）。相关概念：(1) 弦：连接圆上任意两点的线段，经过圆心的弦叫做直径（直径是最长的弦）；(2) 弧：圆上任意两点间的部分（半圆、优弧、劣弧）；(3) 等圆：能够重合的圆（半径相等）；(4) 等弧：在同圆或等圆中，能够完全重合的弧（长度相等且度数相等）。",
        "formal_definition_en": "A circle is the locus of all planar points at fixed distance $r$ from center $O$. Chord connects two boundary points; diameter is the longest chord. Equal arcs must coincide completely in the same or equal circles.",
        "intrinsic_variation_zh": "中考概念辨析陷阱：(1) '长度相等的弧是等弧'是假命题！（必须强调'在同圆或等圆中'，不同半径的圆上长度相等的弧度数不同，无法重合）；(2) 隐形圆轨迹模型：定线段对定角（直角对直径，定角对圆弧，压轴动点轨迹必考核心）。",
        "intrinsic_variation_en": "Conceptual trap: 'Equal arc length implies equal arcs' is FALSE unless evaluated within the same or congruent circles. Hidden circle locus: right angle subtends fixed diameter."
    },

    "KP-070": {
        "origin_story_zh": "雷达探测飞机的安全警戒空域、圆形灌溉喷头的湿润有效半径：一个目标点究竟是位于圆环安全区域内，还是恰好在警戒边界线上，抑或已经突入内部？这推动了通过纯代数距离比较来判定点与圆相对位置的数学判定法则。",
        "origin_story_en": "Radar detection zones and sprinkler radius boundaries classify targets into interior, boundary, and exterior regions, formalized by comparing Euclidean point distance against radius $r$.",
        "intuitive_essence_zh": "点与圆位置关系的本质是'点到圆心距离 $d$ 与半径 $r$ 的一维代数大小比较'。圆周是一道坚固的几何分界墙，内部对应 $d < r$，边界对应 $d = r$，外部对应 $d > r$。",
        "intuitive_essence_en": "Trisecting the plane via distance $d$ to center vs radius $r$: interior ($d < r$), boundary circle ($d = r$), and exterior ($d > r$).",
        "formal_definition_zh": "设 $\\odot O$ 的半径为 $r$，平面上任意一点 $P$ 到圆心 $O$ 的距离为 $d$：(1) 点 $P$ 在圆内 $\\iff d < r$；(2) 点 $P$ 在圆上 $\\iff d = r$；(3) 点 $P$ 在圆外 $\\iff d > r$。双向充要性：几何位置关系与代数不等关系严格等价转化。",
        "formal_definition_en": "For radius $r$ and point-to-center distance $d$: $P$ is inside $\\iff d < r$; on the circle $\\iff d = r$; outside $\\iff d > r$. Equivalence holds bidirectionally.",
        "intrinsic_variation_zh": "中考解析几何结合点：(1) 在直角坐标系中，点 $P(x, y)$ 在以原点为圆心、半径为 $r$ 的圆内部 $\\iff x^2 + y^2 < r^2$；(2) 三角形三边与外接圆点位置关系；(3) 陷阱：点在圆外时，过该点向圆作线段的最短距离为 $d - r$，最大距离为 $d + r$。",
        "intrinsic_variation_en": "Distance extrema to circle from external point: minimum distance is $d - r$; maximum distance is $d + r$. Circle equation in coordinates: $x^2 + y^2 = r^2$."
    },

    "KP-071": {
        "origin_story_zh": "一轮红日从海平面冉冉升起：初时太阳完全位于地平线之上（相离）；片刻后红日下边缘恰好与地平线贴合接吻（相切）；继而红日下沉半浸在波涛之中（相交）。直线与圆的动态交织在自然界中日夜上演，构成了初中圆几何的最重要骨干。",
        "origin_story_en": "Sunrise over ocean waves visually models line-circle interaction: fully separate above the horizon (disjoint), grazing at dawn (tangent), and submerging halfway (secant).",
        "intuitive_essence_zh": "直线与圆位置关系的本质是'圆心到直线的垂线段距离 $d$ 与半径 $r$ 的三态临界博弈'。割线穿透产生两条交点，切线擦肩产生唯一驻点，离线悬空产生零接触。",
        "intuitive_essence_en": "Three-state interaction governed by perpendicular center-to-line distance $d$ vs radius $r$: secant ($d < r$, two points), tangent ($d = r$, one point), disjoint ($d > r$, zero points).",
        "formal_definition_zh": "设 $\\odot O$ 的半径为 $r$，圆心 $O$ 到直线 $l$ 的距离为 $d$：(1) 直线与圆相离 $\\iff$ 没有公共点 $\\iff d > r$；(2) 直线与圆相切 $\\iff$ 只有一个公共点 $\\iff d = r$（此时直线叫做圆的切线，公共点叫做切点）；(3) 直线与圆相交 $\\iff$ 有两个公共点 $\\iff d < r$（此时直线叫做圆的割线）。",
        "formal_definition_en": "Line and circle relations: Disjoint ($d > r$, 0 intersections); Tangent ($d = r$, 1 point of tangency); Secant ($d < r$, 2 points forming a chord).",
        "intrinsic_variation_zh": "中考判别代数化模型：(1) 联立直线方程与圆方程，消元后通过一元二次方程判别式判定：$\\Delta > 0$ 相交，$\\Delta = 0$ 相切，$\\Delta < 0$ 相离；(2) 运动问题中动直线与定圆相切的临界时间点计算；(3) 陷阱：利用 $d$ 与 $r$ 比较大小时，算错圆心到直线的点线距离。",
        "intrinsic_variation_en": "Algebraic translation: combine linear and circular equations into quadratic form: $\\Delta > 0$ secant, $\\Delta = 0$ tangent, $\\Delta < 0$ disjoint."
    },

    "KP-072": {
        "origin_story_zh": "飞速旋转的砂轮脱落的火星沿着切线方向高速飞溅；车轮在平地上向前飞驰，地面接触点处车轮半径与地面绝对垂直。切线垂直于半径是刚体旋转角动量向线速度释放的天然物理体现，在中考几何证明中占据举足轻重的半壁江山。",
        "origin_story_en": "Sparks from grinding wheels fly along tangents; contact points on rolling wheels are strictly orthogonal to ground tracks. Perpendicularity of tangents and radii underpins wheel mechanics and circle geometry.",
        "intuitive_essence_zh": "切线性质与判定的本质是'切点处半径与切线的唯一正交性锁定'。切线垂直于过切点的半径；反之，过半径外端且垂直于该半径的直线必为切线。切线长定理反映了过圆外一点向圆引两条切线的完美轴对称性。",
        "intuitive_essence_en": "Orthogonal locking at the contact boundary: tangent $\\perp$ radius at point of tangency. Tangent segments from an external point are equal due to reflectional symmetry.",
        "formal_definition_zh": "切线判定定理：经过半径的外端并且垂直于这条半径的直线是圆的切线。切线性质定理：圆的切线垂直于经过切点的半径。切线长定理：从圆外一点引圆的两条切线，它们的切线长相等，圆心和这一点的连线平分两条切线的夹角：若 $PA, PB$ 切 $\\odot O$ 于 $A, B$，则 $PA = PB$ 且 $\\angle APO = \\angle BPO$。",
        "formal_definition_en": "Criterion: A line through the radius endpoint perpendicular to the radius is tangent. Property: Tangent is perpendicular to radius at contact point. Tangent segments from external point are equal: $PA=PB$.",
        "intrinsic_variation_zh": "中考证明切线两大标准辅助线口诀：(1) '有交点，连半径，证垂直'（已知直线经过圆上某点，连接圆心与该点，证明两线垂直即得切线）；(2) '无交点，作垂直，证半径'（未指明直线是否过圆上点，过圆心向直线作垂线段，证明垂线段长度 $d=r$）；(3) 陷阱：未证垂直先用垂直结论（循环论证死罪）。",
        "intrinsic_variation_en": "Two mandatory auxiliary tactics: 1) Point on circle known: connect radius, prove $90^\\circ$ perpendicularity; 2) Point unknown: drop perpendicular to line, prove distance $d = r$."
    },

    "KP-073": {
        "origin_story_zh": "在圆形剧场中，无论观众坐在前排还是后排、左侧还是右侧，只要他们面对的是舞台中央相同的弧形背景，他们眼球聚焦该弧度的视觉夹角居然奇迹般地完全相等！这就是圆周角定理。它是初中几何中应用最频繁、变化最多端的定角神定理。",
        "origin_story_en": "Spectators seated anywhere in an amphitheatre facing the same stage arc observe the identical angular view. The inscribed angle theorem ensures that subtended angles from the circular boundary are constant.",
        "intuitive_essence_zh": "圆周角定理的本质是'圆周边界视角相对于圆心角能量的刚性半衰守恒'。在同圆或等圆中，同弧所对的圆周角恒等于圆心角的一半，半圆或直径所对的圆周角恒为 90°。",
        "intuitive_essence_en": "Rigid half-angle conservation: an inscribed angle is strictly half the measure of the central angle subtending the same arc. Any angle subtending a diameter is $90^\\circ$.",
        "formal_definition_zh": "顶点在圆上，并且两边都与圆相交的角叫做圆周角。圆周角定理：在同圆或等圆中，同弧或等弧所对的圆周角相等，都等于这条弧所对的圆心角的一半：$\\angle ACB = \\frac{1}{2}\\angle AOB$。推论 1：半圆（或直径）所对的圆周角是直角（$90^\\circ$）；$90^\\circ$ 的圆周角所对的弦是直径。推论 2：圆内接四边形的对角互补（$\\angle A + \\angle C = 180^\\circ$），且任何一个外角等于它的内对角。",
        "formal_definition_en": "Inscribed Angle Theorem: $\\angle ACB = \\frac{1}{2}\\angle AOB$ for identical arcs. Corollaries: Angles subtending diameters are $90^\\circ$. Opposite angles of cyclic quadrilaterals sum to $180^\\circ$.",
        "intrinsic_variation_zh": "中考两大必考模型：(1) '遇直径，造直角'（看到直径立即连接圆上点构造 $90^\\circ$ 直角三角形）；(2) '同弧导角大循环'（在圆内利用同弧圆周角相等在不同三角形间自由穿梭传导角度）；(3) 致命陷阱：一条弦所对的圆周角有两个，它们互为补角（在同一直径两侧分别产生一个锐角与一个钝角，漏掉钝角常扣一半分）。",
        "intrinsic_variation_en": "Master reflex: 'See diameter, construct $90^\\circ$ right angle'. Chord classification trap: a chord subtends TWO inscribed angles in the circle, which are supplementary (one acute, one obtuse)."
    },

    "KP-074": {
        "origin_story_zh": "古建筑建造赵州桥石拱跨度时，已知拱高与跨度，如何反推拱圈所依托的大圆半径？石匠沿垂直方向将拱弦两等分，利用对称性与直角三角形，一举解算出了圆的半径。这就是垂径定理，几何轴对称与勾股定理在圆中的完美融合。",
        "origin_story_en": "Zhaozhou Bridge builders determined circular arch radii from chord span and arch height. Bisecting the chord perpendicularly exploits circular reflectional symmetry via the Pythagorean theorem.",
        "intuitive_essence_zh": "垂径定理的本质是'圆关于直径所在直线的完全镜像轴对称不变性'。垂径定理在圆内构造了一个万能核心直角三角形：由半弦长、弦心距、圆心半径构成 $\\text{Rt}\\triangle$，满足 $r^2 = d^2 + (\\frac{L}{2})^2$。",
        "intuitive_essence_en": "Reflectional symmetry about diameters. It generates a universal reference triangle linking radius $r$, chord distance $d$, and half-chord $L/2$: $r^2 = d^2 + (L/2)^2$.",
        "formal_definition_zh": "垂径定理：垂直于弦的直径平分这条弦，并且平分弦所对的两条弧。推论：平分弦（不是直径）的直径垂直于弦，并且平分弦所对的两条弧。核心计算公式：设半径为 $r$，弦长为 $a$，弦心距为 $d$（圆心到弦的垂线段长），弓形高为 $h = r - d$，则必有：$r^2 = d^2 + (\\frac{a}{2})^2$。",
        "formal_definition_en": "Perpendicular Chord Theorem: A diameter perpendicular to a chord bisects the chord and its subtended arcs. Core algebraic relation: $r^2 = d^2 + (a/2)^2$, where arch height $h = r - d$.",
        "intrinsic_variation_zh": "中考典型应用与变式：(1) 桥梁拱高、油桶液面宽度、管道流水截面水深计算；(2) 平行弦距离分类讨论陷阱：同圆内两条平行弦长度为 6 和 8，求距离（必须分类：两条平行弦在圆心同侧时距离为 $4-3=1$，在圆心异侧时距离为 $4+3=7$）；(3) 陷阱：推论中忽视'不是直径'的前提（平分直径的两条直径不一定垂直）。",
        "intrinsic_variation_en": "Parallel chords classification trap: chords of length 6 and 8 in circle $r=5$ are separated by distance $|4-3|=1$ (same side) OR $4+3=7$ (opposite sides of center)."
    },

    "KP-075": {
        "origin_story_zh": "日食与月食的天文奇观是两圆相对运动在天幕上的投射：初亏时相切，食甚时相交或内含。机械传动中大齿轮带动小齿轮外切啮合，链条传动两齿轮外离相连。圆心距与两圆半径之和、之差的关系，精确分类了平面上两个圆的全部拓扑状态。",
        "origin_story_en": "Solar and lunar eclipses showcase interacting circular disks across celestial skies. Planetary gear transmissions and chain pulleys govern machine movement through the metric distance between circle centers.",
        "intuitive_essence_zh": "圆与圆位置关系的本质是'双圆连心线距离 $d$ 与两半径和差绝对值的区间单调映射'。连心线是双圆体系天然的唯一轴对称轴，两圆相切时切点必然落在连心线上。",
        "intuitive_essence_en": "Classified by center distance $d$ relative to $R+r$ and $|R-r|$. The line connecting centers is the mutual axis of symmetry; contact points of tangency strictly lie on this line.",
        "formal_definition_zh": "设两圆半径分别为 $R, r$ ($R \\geq r$)，圆心距为 $d$：(1) 外离 $\\iff d > R + r$（公切线 4 条，无交点）；(2) 外切 $\\iff d = R + r$（公切线 3 条，1 个交点）；(3) 相交 $\\iff R - r < d < R + r$（公切线 2 条，2 个交点）；(4) 内切 $\\iff d = R - r$ ($R > r$)（公切线 1 条，1 个交点）；(5) 内含 $\\iff 0 \\leq d < R - r$（无公切线，同心圆时 $d=0$）。",
        "formal_definition_en": "Five positions based on center distance $d$: Exterior ($d > R+r$); Externally tangent ($d = R+r$); Intersecting ($R-r < d < R+r$); Internally tangent ($d = R-r$); Interior ($d < R-r$).",
        "intrinsic_variation_zh": "中考考题变式：(1) 两圆相交时公共弦垂直平分连心线（或连心线垂直平分公共弦）；(2) 动圆与定圆相切参数方程计算（分外切 $d=R+r$ 与内切 $d=|R-r|$ 两种情况求解）；(3) 陷阱：题目只说'两圆相切'，漏解内切或外切之一导致扣分。",
        "intrinsic_variation_en": "Tangency classification trap: 'two circles are tangent' encompasses BOTH external ($d=R+r$) and internal ($d=|R-r|$) tangency. Never omit internal contact."
    },

    "KP-076": {
        "origin_story_zh": "一块三角形的木板，木匠想要切出一个面积最大的圆形桌面，或者想找一块圆形铁皮把这个三角形完全包容进去。内切圆与外接圆分别代表了多边形内部最大容纳度与外部最小包络边界的极致几何极值解。",
        "origin_story_en": "Carpenters carving the largest circular tabletop from a triangular plank find the incircle; iron rings encircling the tips form the circumcircle, balancing interior and exterior packing limits.",
        "intuitive_essence_zh": "外接圆与内切圆的本质是'三边中垂线（外心）与三内角平分线（内心）的奇点交汇'。外心到三个顶点距离相等（外接圆半径 $R$），内心到三条边垂直距离相等（内切圆半径 $r$）。",
        "intuitive_essence_en": "Circumcenter (intersection of perpendicular bisectors) is equidistant to vertices ($R$). Incenter (intersection of angle bisectors) is equidistant to all edges ($r$).",
        "formal_definition_zh": "外心与内心体系：(1) 外接圆与外心：经过三角形三个顶点的圆叫做外接圆，圆心叫做外心（三边垂直平分线交点）。直角三角形外心是斜边中点，$R = \\frac{1}{2}c$；锐角三角形外心在内部；钝角三角形外心在外部。(2) 内切圆与内心：与三角形三边都相切的圆叫做内切圆，圆心叫做内心（三条角平分线交点，恒在内部）。(3) 面积半径公式：$S = \\frac{1}{2}(a + b + c)r = pr$（$p$ 为半周长）；直角三角形特殊内切圆半径：$r = \\frac{a + b - c}{2}$。",
        "formal_definition_en": "Circumcenter: perpendicular bisectors meeting at circumcenter ($R = c/2$ for right triangles). Incenter: angle bisectors meeting at incenter. Area formula: $S = \\frac{1}{2}(a+b+c)r$. Right triangle inradius: $r = \\frac{a+b-c}{2}$.",
        "intrinsic_variation_zh": "中考重点与陷阱：(1) 直角三角形内切圆半径速算 $r = \\frac{a+b-c}{2}$；(2) 三角形内心角定理：$\\angle BOC = 90^\\circ + \\frac{1}{2}\\angle A$；(3) 致命陷阱：混淆外心与内心定义，把内心错记为中线交点（重心）或高线交点（垂心）。",
        "intrinsic_variation_en": "Right triangle inradius shortcut: $r = (a+b-c)/2$. Incenter angle relation: $\\angle BOC = 90^\\circ + \\frac{1}{2}\\angle A$. Do not confuse incenter with centroid (medians) or orthocenter (altitudes)."
    },

    "KP-077": {
        "origin_story_zh": "田径场环形跑道的弧形弯道长多少米？折扇展开后的扇面纸张面积需要裁剪多大？圆周率 $\\pi$ 建立了圆周与直径的比值纽带。将整圆 $360^\\circ$ 等分为 360 份，每一度圆心角所分配到的微积分切片，构成了弧长与扇形面积公式的源头。",
        "origin_story_en": "Curved athletics tracks and paper folding fans demand converting rotational angle degrees into linear boundary lengths and surface patches. Dividing $360^\\circ$ into degree increments yields arc and sector formulas.",
        "intuitive_essence_zh": "弧长与扇形面积的本质是'整圆线度与面度按圆心角比例 $\\frac{n}{360}$ 的全息分份'。扇形面积与弧长存在类似三角形的关联：$S = \\frac{1}{2}lr$，弧长充当底边，半径充当高。",
        "intuitive_essence_en": "Proportional fractioning: fraction $n/360$ of full circumference and area. Analogy with triangle area: sector area $S = \\frac{1}{2} l r$, with arc $l$ as base and radius $r$ as altitude.",
        "formal_definition_zh": "公式体系：设圆半径为 $R$，圆心角为 $n^\\circ$：(1) 弧长公式：$l = \\frac{n\\pi R}{180}$；(2) 扇形面积公式：$S = \\frac{n\\pi R^2}{360} = \\frac{1}{2} l R$；(3) 圆锥侧面展开图（重要纽带）：圆锥母线长等于扇形半径 $R$，圆锥底面圆周长等于扇形弧长 $l = 2\\pi r_{\\text{底}}$，圆锥侧面积 $S_{\\text{侧}} = \\pi r l_{\\text{母}}$，圆锥全面积 $S_{\\text{全}} = \\pi r l + \\pi r^2$。",
        "formal_definition_en": "Arc length: $l = \\frac{n\\pi R}{180}$. Sector area: $S = \\frac{n\\pi R^2}{360} = \\frac{1}{2} l R$. Cone lateral unfolding: sector radius equals slant height $L$; sector arc equals base circumference $2\\pi r$; $S_{\\text{lateral}} = \\pi r L$.",
        "intrinsic_variation_zh": "中考几何计算压轴：(1) 弓形面积割补法（扇形面积减去三角形面积，或加上三角形面积）；(2) 不规则阴影面积求解的'容斥原理与割补平移'；(3) 陷阱：公式中分母是 180 还是 360（弧长分母是 180，面积分母是 360，切忌写混）。",
        "intrinsic_variation_en": "Irregular shaded area dissection: sector area minus triangle area for segment caps. Denominator check: arc length has denominator 180; sector area has 360."
    },

    "KP-078": {
        "origin_story_zh": "祖冲之运用刘徽发明的'割圆术'计算圆周率 $\\pi$：'割之弥细，所失弥少，割之又割，以至于不可割，则与圆周合体而无所失矣。'通过在圆内不断倍增内接正多边形的边数（从正六边形到正十二边形直至万边形），正多边形外缘无限逼近圆周，展现了人类朴素极限微积分思想的破晓。",
        "origin_story_en": "Liu Hui and Zu Chongzhi computed $\\pi$ using the exhaustion method of inscribed regular polygons. Doubling edge count from 6 to 12 to 24 converges regular polygons onto the circular perimeter, pioneering calculus limits.",
        "intuitive_essence_zh": "正多边形与圆的本质是'有限离散等边等角正多边形与无限连续圆周的极限拟合'。正多边形各顶点天然均匀分布在同心外接圆上，各边正切于同心内切圆。",
        "intuitive_essence_en": "Regular polygons represent discrete symmetric approximations of continuous circles, sharing concentric circumscribed and inscribed centers.",
        "formal_definition_zh": "正多边形与圆的中心参数：(1) 中心：正多边形的外接圆和内切圆的公共圆心；(2) 半径 $R$：外接圆半径，中心到顶点的距离；(3) 边心距 $r$：内切圆半径，中心到各边的垂线段长；(4) 中心角 $\\alpha$：每一条边所对的外接圆圆心角，$\\alpha = \\frac{360^\\circ}{n}$；(5) 核心计算基本直角三角形：由半径 $R$、边心距 $r$、半边长 $\\frac{a}{2}$ 构成 $\\text{Rt}\\triangle$，满足 $R^2 = r^2 + (\\frac{a}{2})^2$，$\\angle = \\frac{180^\\circ}{n}$。",
        "formal_definition_en": "A regular $n$-gon inscribed in a circle has central angle $\\alpha = 360^\\circ/n$. Fundamental reference triangle links radius $R$, apothem $r$, and half-side $a/2$: $R^2 = r^2 + (a/2)^2$ with central half-angle $180^\\circ/n$.",
        "intrinsic_variation_zh": "中考考查模型：(1) 正六边形计算（正六边形边长等于外接圆半径 $a = R$，由六个全等正三角形拼成）；(2) 正方形内接于圆与外切于圆面积比；(3) 陷阱：混淆'中心角'与'内角'（中心角是 $\\frac{360^\\circ}{n}$，内角是 $\\frac{(n-2)180^\\circ}{n}$）。",
        "intrinsic_variation_en": "Regular hexagon property: side length identically equals circumradius ($a = R$). Distinguish central angle ($360^\\circ/n$) from interior angle ($(n-2)180^\\circ/n$)."
    },

    "KP-079": {
        "origin_story_zh": "湖畔倒影、蝴蝶双翼、人体脸庞，大自然充满了完美的轴对称现象。人类最早的审美经验就是对称。通过将平面图形沿着一条直线对折，图形两半能够完全重叠吻合，形成了最直观的保距镜像几何变换。",
        "origin_story_en": "Mirror reflections in lakes, butterfly wings, and human anatomy exemplify axial symmetry. Folding a shape along a straight line matches left and right halves completely.",
        "intuitive_essence_zh": "轴对称的本质是'关于对称轴直线的空间对折镜像反射不变性'。对称轴是对称点连线段的垂直平分线，折叠保长、保角、保面积，但颠倒了图形的左右定向手性（手掌翻转）。",
        "intuitive_essence_en": "Reflectional mirror isometry. The symmetry axis is the perpendicular bisector of every segment connecting corresponding points, preserving lengths and angles while reversing chirality.",
        "formal_definition_zh": "轴对称定义：把一个图形沿着某一条直线折叠，如果它能够与另一个图形重合，那么就说这两个图形关于这条直线对称（轴对称图形是对折后自身重合）。性质定理：(1) 关于某条直线对称的两个图形是全等形；(2) 如果两个图形关于某条直线对称，那么对称轴是任何一对对应点所连线段的垂直平分线；(3) 对应线段相等，对应角相等，对应线段或其延长线的交点必在对称轴上。",
        "formal_definition_en": "Axial symmetry: Reflection across a line superimposes shapes. The symmetry line is the perpendicular bisector of segments connecting paired points. Reflection preserves distance, angles, and congruence.",
        "intrinsic_variation_zh": "中考王牌几何最值：'将军饮马模型'（在直线上找一点使得到两定点距离之和最小：作定点关于直线的对称点，连线化折为直）；(2) 纸片折叠几何综合（折痕为对称轴，重合点对连线被折痕垂直平分）；(3) 陷阱：轴对称（两个图形的位置关系）与轴对称图形（单个图形的自身属性）混淆。",
        "intrinsic_variation_en": "Heron's shortest path ('General Drinking Horse'): reflect point across the line to turn bent path into a straight line. Folding fold-line acts as the perpendicular bisector of corresponding points."
    },

    "KP-080": {
        "origin_story_zh": "电梯垂直升降、传送带平稳运送行李、汽车在直道上平直疾驶。物体在移动过程中，每一个质点都沿着平行方向移动了完全相同的距离，物体自身没有发生任何旋转与形变。平移是刚体空间位移最纯粹的形态。",
        "origin_story_en": "Elevators ascending vertically, conveyor belts transporting luggage, and cars driving straight advance all mass points along parallel paths of equal distance without rotation. Translation is pure directional displacement.",
        "intuitive_essence_zh": "平移变换的本质是'保持向量方向与位移模长绝对一致的保向保距刚体滑移'。平移前后图形全等，对应点连线互相平行（或共线）且相等，对应线段平行（或共线）且相等。",
        "intuitive_essence_en": "Rigid translation along a vector without rotation. Corresponding points connect via segments that are equal in length and parallel (or collinear).",
        "formal_definition_zh": "在平面内，将一个图形沿某个方向移动一定的距离，这样的图形运动叫做平移。平移要素：平移的方向、平移的距离。性质：(1) 平移不改变图形的形状和大小（全等变换）；(2) 连接各组对应点的线段平行（或在同一直线上）且相等；(3) 对应线段平行（或在同一直线上）且相等，对应角相等。坐标平移口诀：'左加右减横坐标，上加下减纵坐标'。",
        "formal_definition_en": "A translation shifts every point by a fixed distance along a fixed vector direction. Preserves shapes, sizes, and orientations. In coordinates: $(x,y) \\to (x+a, y+b)$.",
        "intrinsic_variation_zh": "中考考题模型：(1) 割补法求不规则台阶花坛周长与面积（利用平移将曲折折线推平为矩形边长）；(2) 几何造桥选址问题（化平移距离为定长线段，造桥模型）；(3) 陷阱：平移是直线方向移动，沿曲线或圆弧滑行不是平移。",
        "intrinsic_variation_en": "Irregular perimeter calculation via translation: project stepped perimeters onto boundary rectangles. Bridge location optimization models."
    },

    "KP-081": {
        "origin_story_zh": "风车迎风回旋、摩天轮载客运转、钟表指针不知疲倦地划过表盘。绕着一个固定的旋转轴，物体在平面内扫过特定的角位移。几何学家克莱因在埃尔朗根纲领中指出：几何学就是研究变换群下不变量的学问，旋转变换正是保距群中最具活力的分支。",
        "origin_story_en": "Windmill blades spinning in gusts, Ferris wheels turning, and clock hands sweeping circular faces illustrate planar rotation around fixed centers, foundational to Felix Klein's Erlangen program of transformational invariants.",
        "intuitive_essence_zh": "旋转变换的本质是'以定点为锚心、保持径向距离不变的等角角动量转动'。旋转保长、保角、保全等，对应点到旋转中心的距离相等，任何一对对应点与旋转中心连线的夹角恒等于旋转角。",
        "intuitive_essence_en": "Planar rotation preserves distances to the center point while turning by a constant angle $\\alpha$. Corresponding segments are equal, and their included line angle equals $\\alpha$.",
        "formal_definition_zh": "在平面内，将一个图形绕一个定点按某个方向转动一个角度，这样的图形运动叫做图形的旋转。定点叫做旋转中心，转动的角叫做旋转角。性质定理：(1) 对应点到旋转中心的距离相等（$OA = OA'$）；(2) 对应点与旋转中心所连线段的夹角等于旋转角（$\\angle AOA' = \\alpha$）；(3) 旋转前后的图形全等；(4) 对应线段的夹角等于旋转角（或其补角）。",
        "formal_definition_en": "Rotation pivots a shape around center $O$ by angle $\\alpha$. Properties: distances to center are invariant ($OA=OA'$); angles subtended at center equal rotation angle ($AOA' = \\alpha$); shapes are congruent; lines intersect at angle $\\alpha$.",
        "intrinsic_variation_zh": "中考压轴皇冠模型：'手拉手全等旋转模型'（两个共顶点的等腰直角三角形或等边三角形，连接对应端点，必产生旋转全等与垂直/夹角关系）；(2) 坐标系中求绕任意定点旋转 $90^\\circ$ 的点坐标（构造 K 字型全等直角三角形）；(3) 陷阱：找错旋转中心或混淆顺时针与逆时针方向。",
        "intrinsic_variation_en": "Hand-in-hand rotational congruence model sharing a common apex. Coordinate $90^\\circ$ rotations using K-shape auxiliary right triangles. Check clockwise vs counterclockwise directions."
    },

    "KP-082": {
        "origin_story_zh": "扑克牌中的四条花色 K、Q、J 无论上下正看还是倒过来看，画面完全一模一样，防作弊设计巧妙利用了中心对称；两叶螺旋桨旋转 180° 能够完美重合。中心对称是平面几何中旋转角为 180° 的极其特殊的半周期全景倒置变换。",
        "origin_story_en": "Playing card face designs look identical upside down using 180° central point symmetry. Two-blade propellers superimpose onto themselves under half-turn rotations, embodying inversion symmetry.",
        "intuitive_essence_zh": "中心对称的本质是'旋转角严格为 180° 的奇点点反演'。对称中心是任意一对对应点连线段的绝对中点，连线必过对称中心，左右颠倒且上下颠倒。",
        "intuitive_essence_en": "Point reflection corresponding strictly to a $180^\\circ$ half-turn. The center of symmetry is the exact midpoint of every line segment connecting corresponding points.",
        "formal_definition_zh": "中心对称定义：把一个图形绕着某一个点旋转 $180^\\circ$，如果它能够与另一个图形重合，那么就说这两个图形关于这个点对称或中心对称（绕中心旋转 $180^\\circ$ 与自身重合的图形是中心对称图形）。性质定理：(1) 关于中心对称的两个图形是全等形；(2) 关于中心对称的两个图形，对称点所连线段都经过对称中心，并且被对称中心平分。在直角坐标系中，关于原点中心对称的点横纵坐标均变为相反数：$P(x, y) \\iff P'(-x, -y)$。",
        "formal_definition_en": "Central symmetry rotates a figure $180^\\circ$ about center $O$. The center bisects all segments connecting paired points. In coordinates, reflection through origin maps $(x,y) \\to (-x,-y)$.",
        "intrinsic_variation_zh": "中考常见图形辨析：(1) 轴对称但非中心对称（等腰三角形、等腰梯形、正五边形）；(2) 中心对称但非轴对称（平行四边形）；(3) 既是轴对称又是中心对称（矩形、菱形、正方形、圆、正六边形）；(4) 陷阱：误以为奇数边正多边形有中心对称（正三角形、正五边形无中心对称）。",
        "intrinsic_variation_en": "Symmetry classification: Parallelogram (center only); Isosceles triangle (axis only); Rectangle/Square/Circle (both). Regular odd-sided polygons lack central symmetry."
    },

    "KP-083": {
        "origin_story_zh": "纸张折叠艺术（Origami）不仅催生了精美的千纸鹤，更在航天工业中指导了太阳能电池帆板的折叠收拢与在轨展开。当平面图形被折叠时，折痕充当了局部轴对称轴，折叠过去的部分与原图形全等。综合变换是折叠、旋转、平移的连环交织舞台。",
        "origin_story_en": "Origami folding art guides expandable satellite solar arrays in aerospace engineering. Crease lines act as reflection axes where folded portions preserve rigid congruence across dynamic motions.",
        "intuitive_essence_zh": "图形综合变换的本质是'刚体变换不变量在动态多阶段边界下的组合传递'。折叠本质即轴对称反射；旋转本质即转角保持；利用折叠重合对应线段相等与勾股方程，化几何动点为代数未知数求解。",
        "intuitive_essence_en": "Multi-stage composition of rigid isometries (reflections, rotations, translations). Folding is local axial reflection; combine equal lengths with Pythagorean equations to solve moving points.",
        "formal_definition_zh": "折叠变换四大守恒公理：(1) 折痕是对称轴，折叠前后的两部分图形全等；(2) 对应角相等，对应线段相等；(3) 对应点的连线段被折痕垂直平分；(4) 综合解题程序：标已知边角 $\\to$ 设未知数 $x$ $\\to$ 利用折叠等量转移线段 $\\to$ 在直角三角形中利用勾股定理建立关于 $x$ 的一元二次方程求解。",
        "formal_definition_en": "Four axioms of folding: 1) Crease is axis of symmetry; 2) Shapes before and after fold are congruent; 3) Paired points segment is perpendicularly bisected by crease; 4) Model via Pythagorean equation.",
        "intrinsic_variation_zh": "中考压轴折叠题型：(1) 矩形折叠使得点落在边上或对角线上；(2) 动点折痕使得三角形面积最小；(3) 陷阱：折叠翻折后点落在图形外部未注意临界几何约束（自变量范围超出矩形长宽）。",
        "intrinsic_variation_en": "Rectangle folding placing vertices onto edges or diagonals. Beware of geometric boundary domain limits when folded points extend outside the physical frame."
    },

    "KP-084": {
        "origin_story_zh": "机械制造车间的车工必须依据工程蓝图加工零件，而平面的纸张只能呈现二维图样。工程图学奠基人蒙日发明了正投影正交投射三视图：从正面、左面、上面三个互相垂直的方向观察立体模型，用三个平面视图完全锁定三维物体的空间结构。",
        "origin_story_en": "Machinists manufacture 3D parts from 2D blueprints. Gaspard Monge invented orthographic projection, capturing three mutually perpendicular viewpoints (front, top, left) to unambiguously specify 3D objects.",
        "intuitive_essence_zh": "三视图的本质是'三维空间几何体向三个互相垂直正交基平面的零厚度正投影'。九字黄金口诀是其灵魂：'长对正，高平齐，宽相等'。",
        "intuitive_essence_en": "Orthographic projection onto three perpendicular reference planes. The core constraint rule: 'Length aligns between front and top, height matches between front and left, width matches between left and top'.",
        "formal_definition_zh": "三视图体系：(1) 主视图（正视图）：从正面看到的图形，反映物体的长和高；(2) 俯视图：从上面看到的图形，反映物体的长和宽；(3) 左视图：从左面看到的图形，反映物体的高和宽。几何对应法则：主俯长对正，主左高平齐，俯左宽相等。实线表示看得见的外轮廓线，虚线表示被遮挡看不见的轮廓线。",
        "formal_definition_en": "Orthographic system: Front view (length and height); Top view (length and width); Left view (height and width). Invariant rule: length aligns vertically, height horizontally, width symmetrically. Solid lines for visible edges, dashed for hidden.",
        "intrinsic_variation_zh": "中考经典考查：(1) 小正方体组合体三视图与计算最多/最少正方体块数（'俯视图打地基，主视图定层高，左视图查漏缺'）；(2) 圆柱、圆锥、球的三视图辨识；(3) 陷阱：从三视图还原表面积时，漏算看不见的底面或接缝重合面。",
        "intrinsic_variation_en": "Cube stacking reconstruction: ground blueprint from top view, peak heights from front and left views. When calculating total surface area from views, do not omit base surfaces."
    },

    "KP-085": {
        "origin_story_zh": "古希腊天文学家喜帕恰斯为了观测天体运行轨迹，需要在圆周角与对应的弦长之间建立数学转换表。古代印度数学家将这种半弦长与半径的比值抽象为正弦概念，拉丁语译为 Sinus（意为弯曲、海湾）。正弦函数是连接角度旋转与垂直高度的直角三角学先驱。",
        "origin_story_en": "Hipparchus mapped celestial positions by relating circular arc angles to chord lengths. Indian astronomers formalized half-chords into 'jya', translated into Latin as 'sinus', creating the sine ratio connecting angles and vertical heights.",
        "intuitive_essence_zh": "正弦函数的本质是'直角三角形锐角对边的垂直投影放大率'。直角三角形形状相似时，对边与斜边的比值只由锐角 $\\angle A$ 的大小唯一确定，与三角形自身放缩尺寸毫无关系。$0 < \\sin A < 1$。",
        "intuitive_essence_en": "Ratio of the opposite side to the hypotenuse in a right triangle. Depends strictly on angle $\\angle A$ regardless of triangle scaling size. For acute angles, $0 < \\sin A < 1$.",
        "formal_definition_zh": "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$\\angle A$ 的对边为 $a$，$\\angle B$ 的对边为 $b$，斜边为 $c$。锐角 $\\angle A$ 的对边与斜边的比叫做 $\\angle A$ 的正弦，记作 $\\sin A$：$\\sin A = \\frac{\\text{对边}}{\\text{斜边}} = \\frac{a}{c}$。性质：当锐角 $A$ 从 $0^\\circ$ 逐渐增大到 $90^\\circ$ 时，$\\sin A$ 随角度增大而单调递增，值域为 $(0, 1)$。",
        "formal_definition_en": "In $\\text{Rt}\\triangle ABC$ ($\\angle C = 90^\\circ$), the sine of acute $\\angle A$ is $\\sin A = \\frac{\\text{opposite}}{\\text{hypotenuse}} = \\frac{a}{c}$. Monotonically increases from 0 to 1 as angle sweeps $0^\\circ \\to 90^\\circ$.",
        "intrinsic_variation_zh": "中考考题变式：(1) 在网格网格纸中通过构造直角三角形求非特殊角的正弦值；(2) 面积公式拓展：$S_{\\triangle ABC} = \\frac{1}{2}ab \\sin C$；(3) 陷阱：正弦比值是一个无量纲的纯代数标量，绝不可在结果中带单位（如写成 $\\sin A = 0.5\\text{ cm}$ 是严重错误）。",
        "intrinsic_variation_en": "Sine is a dimensionless ratio; never attach physical length units. Grid-based angle evaluation by constructing embedded right triangles."
    },

    "KP-086": {
        "origin_story_zh": "当炮火仰角发射或日晷针影在地面投射时，人们不仅需要知道垂直飞升高度（正弦），更需要知道水平前进覆盖的距离。余弦（Cosine，意为余角的正弦）度量了直角三角形中相邻底边与斜边的比值，构成了平面力学分解的水平分量基石。",
        "origin_story_en": "Sundial shadow projections and projectile flight required computing horizontal baseline span alongside vertical altitude. Cosine (complementary sine) measures adjacent-to-hypotenuse ratios.",
        "intuitive_essence_zh": "余弦函数的本质是'直角三角形锐角邻边的水平投影留存率'。当角度越来越陡（趋近 90°）时，水平投影迅速归零；当角度趋近平直（0°）时，投影与斜边几乎等长。$\\cos A$ 随角度增大而单调递减。",
        "intuitive_essence_en": "Adjacent side horizontal projection retention ratio: drops monotonically from 1 toward 0 as angle $\\angle A$ steepens from $0^\\circ$ to $90^\\circ$.",
        "formal_definition_zh": "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，锐角 $\\angle A$ 的邻边与斜边的比叫做 $\\angle A$ 的余弦，记作 $\\cos A$：$\\cos A = \\frac{\\text{邻边}}{\\text{斜边}} = \\frac{b}{c}$。性质：当锐角 $A$ 从 $0^\\circ$ 逐渐增大到 $90^\\circ$ 时，$\\cos A$ 随角度增大而单调递减，值域为 $(0, 1)$。恒等式：同角平方和 $\\sin^2 A + \\cos^2 A = 1$。",
        "formal_definition_en": "In $\\text{Rt}\\triangle ABC$, $\\cos A = \\frac{\\text{adjacent}}{\\text{hypotenuse}} = \\frac{b}{c}$. Monotonically decreases on $(0^\\circ, 90^\\circ)$. Pythagorean trigonometric identity: $\\sin^2 A + \\cos^2 A = 1$.",
        "intrinsic_variation_zh": "中考高频模型：(1) 利用同角三角函数关系已知 $\\sin A = \\frac{3}{5}$，求 $\\cos A = \\sqrt{1 - (3/5)^2} = \\frac{4}{5}$；(2) 物理力学正交分解（$F_x = F \\cos \\theta, F_y = F \\sin \\theta$）；(3) 陷阱：混淆对边与邻边位置导致正弦与余弦公式颠倒。",
        "intrinsic_variation_en": "Trigonometric conversion: $\\cos A = \\sqrt{1 - \\sin^2 A}$. Do not invert opposite and adjacent legs when calculating ratios."
    },

    "KP-087": {
        "origin_story_zh": "登山者面对陡峭的山坡，最关心的是坡度的险峻程度：水平前进 100 米，垂直拔高了多少米？中国古代《九章算术》称之为'勾股相除'，在西方称为切线正切（Tangent，原意触碰）。正切函数摆脱了斜边的羁绊，直接刻画了垂直高度与水平跨度的比值，与直线的斜率概念融为一体。",
        "origin_story_en": "Hikers assess slope: how much vertical elevation gain per 100 meters horizontal run? Tangent measures rise over run without referencing the hypotenuse, unifying trigonometric ratios with coordinate slopes.",
        "intuitive_essence_zh": "正切函数的本质是'直角三角形垂直增量与水平跨度的相对增长速率（坡度/斜率）'。坡角越大，正切值越大，坡度越险。正切值可以取到从 0 到正无穷大的任何正实数！",
        "intuitive_essence_en": "Rate of vertical rise over horizontal run: slope $k = \\tan \\alpha$. Range spans $(0, +\\infty)$ as acute angle sweeps toward $90^\\circ$.",
        "formal_definition_zh": "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，锐角 $\\angle A$ 的对边与邻边的比叫做 $\\angle A$ 的正切，记作 $\\tan A$：$\\tan A = \\frac{\\text{对边}}{\\text{邻边}} = \\frac{a}{b}$。性质：当锐角 $A$ 增大时，$\\tan A$ 单调递增，值域为 $(0, +\\infty)$。商数关系：$\\tan A = \\frac{\\sin A}{\\cos A}$。坐标系中直线 $y = kx + b$ 的斜率 $k$ 等于其倾斜角 $\\alpha$ 的正切值：$k = \\tan \\alpha$。",
        "formal_definition_en": "In $\\text{Rt}\\triangle ABC$, $\\tan A = \\frac{\\text{opposite}}{\\text{adjacent}} = \\frac{a}{b}$. Monotonically increases without upper bound. Quotient identity: $\\tan A = \\frac{\\sin A}{\\cos A}$. Matches coordinate slope $k = \\tan \\alpha$.",
        "intrinsic_variation_zh": "中考压轴变式：(1) 坡度与坡比问题：坡度 $i = h : l = \\tan \\alpha$（坡比等于坡角的正切）；(2) 网格中求正切（找网格整点构建直角三角形读对边邻边）；(3) 陷阱：正切值可以大于 1（当对边长于邻边时，如 $\\tan 60^\\circ = \\sqrt{3} > 1$），不可误以为正切也受小于 1 的约束。",
        "intrinsic_variation_en": "Slope gradient ratio $i = h/l = \\tan \\alpha$. Unlike sine and cosine which are capped at 1, tangent can exceed 1 freely ($\tan 60^\\circ = \\sqrt{3} > 1$)."
    },

    "KP-088": {
        "origin_story_zh": "一般角度的三角函数值需要查阅复杂用级数展开的近似数学用表，但有两种特殊的三角形无需查表就能求出绝对精确的代数解析值：等腰直角三角形（$45^\\circ$）与等边三角形剖分出的半角直角三角形（$30^\\circ, 60^\\circ$）。它们是整个三角函数大厦的基准锚点。",
        "origin_story_en": "General trigonometric values require series expansion tables, but $30^\\circ, 45^\\circ, 60^\\circ$ yield exact algebraic radicals from halved equilateral and right-isosceles triangles.",
        "intuitive_essence_zh": "特殊角三角函数值的本质是'单位正方形对角线与单位等边三角形垂直高的代数投影'。三边比分别为 $1 : 1 : \\sqrt{2}$ 和 $1 : \\sqrt{3} : 2$，为快速代数计算提供了免查表的纯根式表达。",
        "intuitive_essence_en": "Exact radical ratios derived from fundamental shapes: $1:1:\\sqrt{2}$ in $45^\\circ$-$45^\\circ$-$90^\\circ$ triangles and $1:\\sqrt{3}:2$ in $30^\\circ$-$60^\\circ$-$90^\\circ$ triangles.",
        "formal_definition_zh": "九大基准特殊角三角函数值表：(1) $30^\\circ$：$\\sin 30^\\circ = \\frac{1}{2}$，$\\cos 30^\\circ = \\frac{\\sqrt{3}}{2}$，$\\tan 30^\\circ = \\frac{\\sqrt{3}}{3}$；(2) $45^\\circ$：$\\sin 45^\\circ = \\frac{\\sqrt{2}}{2}$，$\\cos 45^\\circ = \\frac{\\sqrt{2}}{2}$，$\\tan 45^\\circ = 1$；(3) $60^\\circ$：$\\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$，$\\cos 60^\\circ = \\frac{1}{2}$，$\\tan 60^\\circ = \\sqrt{3}$。速记规律：正弦根号下 $1, 2, 3$ 递增，余弦根号下 $3, 2, 1$ 递减。",
        "formal_definition_en": "Exact values: $\\sin 30^\\circ = 1/2, \\cos 30^\\circ = \\sqrt{3}/2, \\tan 30^\\circ = \\sqrt{3}/3$; $\\sin 45^\\circ = \\sqrt{2}/2, \\cos 45^\\circ = \\sqrt{2}/2, \\tan 45^\\circ = 1$; $\\sin 60^\\circ = \\sqrt{3}/2, \\cos 60^\\circ = 1/2, \\tan 60^\\circ = \\sqrt{3}$.",
        "intrinsic_variation_zh": "中考计算必考：(1) 特殊角三角函数混合运算（含负指数、绝对值、零指数幂混合化简）；(2) 逆用三角函数值确定角的大小；(3) 致命陷阱：分母有理化记忆混淆，如将 $\\tan 30^\\circ$ 误记为 $\\sqrt{3}$，将 $\\cos 30^\\circ$ 误记为 $\\frac{1}{2}$。",
        "intrinsic_variation_en": "Mixed arithmetic combining special trig values with negative powers and radicals. Avoid inverting values (e.g. $\\tan 30^\\circ = \\frac{\\sqrt{3}}{3}$ vs $\\tan 60^\\circ = \\sqrt{3}$)."
    },

    "KP-089": {
        "origin_story_zh": "在同一个直角三角形中，两个锐角是天然互补的命运共同体：$\\angle A + \\angle B = 90^\\circ$。$\\angle A$ 的对边就是 $\\angle B$ 的邻边，$\\angle A$ 的邻边就是 $\\angle B$ 的对边。立足视角的对调，自然推导出正弦与余弦的对等互余转化关系。",
        "origin_story_en": "In a right triangle, the two acute angles are complementary: $\\angle A + \\angle B = 90^\\circ$. The side opposite to $\\angle A$ is adjacent to $\\angle B$, forging the complementary equivalence $\\sin A = \\cos B$.",
        "intuitive_essence_zh": "互余三角函数关系的本质是'直角正交参考系中水平分量与垂直分量的视角置换'。站在 $\\angle A$ 角度看的垂直高度，换到 $\\angle B$ 视角正是其贴身邻边，比值恒等互换。",
        "intuitive_essence_en": "Perspective exchange: swapping viewpoints between complementary angles transforms opposite legs into adjacent legs, setting $\\sin A = \\cos(90^\\circ - A)$.",
        "formal_definition_zh": "互为余角的三角函数关系定理：若 $\\angle A + \\angle B = 90^\\circ$，则：(1) 一个锐角的正弦等于它余角的余弦：$\\sin A = \\cos B = \\cos (90^\\circ - A)$；(2) 一个锐角的余弦等于它余角的正弦：$\\cos A = \\sin B = \\sin (90^\\circ - A)$；(3) 一个锐角的正切与它余角的正切互为倒数：$\\tan A \\cdot \\tan B = 1 \\iff \\tan A = \\frac{1}{\\tan(90^\\circ - A)}$。",
        "formal_definition_en": "Complementary angle identities: If $\\angle A + \\angle B = 90^\\circ$, then $\\sin A = \\cos(90^\\circ - A)$, $\\cos A = \\sin(90^\\circ - A)$, and $\\tan A \\cdot \\tan(90^\\circ - A) = 1$.",
        "intrinsic_variation_zh": "中考速算巧算变式：(1) 对消化简：$\\sin^2 20^\\circ + \\sin^2 70^\\circ = \\sin^2 20^\\circ + \\cos^2 20^\\circ = 1$；(2) 正切倒数积：$\\tan 10^\\circ \\cdot \\tan 80^\\circ = 1$；(3) 陷阱：仅当两角和严格等于 $90^\\circ$ 时成立，若两角不互余绝不能套用等号。",
        "intrinsic_variation_en": "Trig symmetry cancellations: $\\sin^2 20^\\circ + \\sin^2 70^\\circ = \\sin^2 20^\\circ + \\cos^2 20^\\circ = 1$. Always confirm that the angles sum strictly to $90^\\circ$."
    },

    "KP-090": {
        "origin_story_zh": "航海员在灯塔上发现触礁险情、无人机测控遥测地形高差、工程师测量隔河相对的发射塔高度。现实中无法用皮尺横跨悬崖去量直角三角形斜边，但通过经纬仪测出视线仰角与俯角，结合水平底边距离，便能远程隔空解算出崇山峻岭的高度。",
        "origin_story_en": "Lighthouse lookouts spotting shoals and drones mapping terrain cannot physically stretch tape measures across gorges. Surveying elevation and depression angles resolves impassable chasms remotely.",
        "intuitive_essence_zh": "三角函数实际应用的本质是'将现实视线测量角度与水平垂直空间投影构造成直角三角形'。仰角是视线抬头高于水平线的张角，俯角是视线低头低于水平线的张角，二者基准线恒为绝对水平线。",
        "intuitive_essence_en": "Elevation angle looks upward from the horizontal benchmark; depression angle looks downward from the horizontal. Both use horizontal lines as reference zero baselines.",
        "formal_definition_zh": "测量术语规范定义：(1) 仰角：在视线与水平线所成的角中，视线在水平线上方的角；(2) 俯角：视线在水平线下方的角；(3) 坡角与坡度（坡比）：坡面的铅垂高度 $h$ 和水平宽 $l$ 的比叫做坡度（坡比），记作 $i = h : l = \\tan \\alpha$（$\\alpha$ 为坡角）；(4) 方位角：以正北或正南方向为基准，向东或向西偏转的角度（如北偏东 $30^\\circ$）。",
        "formal_definition_en": "Definitions: Elevation is upward angle from horizontal; Depression is downward from horizontal; Slope ratio $i = h/l = \\tan \\alpha$; Bearing angle offsets east/west from true North/South.",
        "intrinsic_variation_zh": "中考两大必考解直角三角形几何母题模型：(1) '双仰角母子直角三角形模型'（背对背或前后两次观测，设公共高 $h$，列 $h/\\tan \\alpha - h/\\tan \\beta = d$ 方程）；(2) 斜坡折线综合测量题（作垂线分解为水平宽与铅垂高）；(3) 致命陷阱：误将铅垂线作为仰角基准，或漏加测倾器自身观测高度 $1.5$ 米。",
        "intrinsic_variation_en": "Dual-elevation observation model setting up altitude $h$ across two horizontal projections. Classic trap: forgetting to add the surveyor's instrument height (e.g. 1.5m) to final elevation."
    },

    "KP-091": {
        "origin_story_zh": "已知直角三角形的一边一角，如何求其余所有的边和角？已知两条直角边，如何求出锐角的准确值？解直角三角形是整个初中几何与三角学的总收官工程。它实现了直角三角形内部所有 6 个元素（三边三角）在代数方程与三角函数网络下的完全连通闭环求解。",
        "origin_story_en": "Solving right triangles determines all 6 elements (3 sides, 3 angles) from minimal inputs. It represents the capstone synthesis uniting the Pythagorean theorem and trigonometry into a closed network.",
        "intuitive_essence_zh": "解直角三角形的本质是'利用自由度为 2 的刚体约束解锁全部空间边角要素'。直角已锁死 1 个自由度，只需再输入两个独立元素（至少包含一条边长），整个三角形的形态与尺寸便瞬间唯一确定。",
        "intuitive_essence_en": "With the $90^\\circ$ angle locking one degree of freedom, two independent measurements (at least one side) uniquely solve all remaining sides and angles.",
        "formal_definition_zh": "解直角三角形核心关系网（在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$）：(1) 三边关系：$a^2 + b^2 = c^2$（勾股定理）；(2) 锐角关系：$\\angle A + \\angle B = 90^\\circ$；(3) 边角三角关系：$\\sin A = \\frac{a}{c}, \\cos A = \\frac{b}{c}, \\tan A = \\frac{a}{b}$；(4) 解题原则：'知二求三'（除直角外的 5 个元素中，已知两个元素，其中至少有一个是边，即可求出其余三个元素）。",
        "formal_definition_en": "Complete system: $a^2 + b^2 = c^2$, $\\angle A + \\angle B = 90^\\circ$, and $\\sin A = a/c, \\cos A = b/c, \\tan A = a/b$. Rule of thumb: Given two elements (at least one being a side), all others are uniquely solvable.",
        "intrinsic_variation_zh": "中考非直角三角形化归解题秘籍：(1) '作高法'：遇到任意斜三角形（如已知两角夹一边或两边夹一角），必过钝角或未知角顶点作一条高线，将其精准分割为两个相邻的直角三角形分步求解；(2) 陷阱：若只已知两个锐角度数而没有给出任何线段长度，三角形大小不确定（只能确定相似，不能求出解）。",
        "intrinsic_variation_en": "Drop an altitude to split general scalene triangles into two solvable right triangles. Side requirement: two known angles determine shape only; at least one side length is mandatory."
    }
}
