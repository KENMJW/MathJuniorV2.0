#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
代数板块考点四段精讲库 (KP-001 ~ KP-043)
涵盖实数(8)、代数式(7)、分式(3)、方程组(8)、不等式(3)、函数(14)
严格遵循 What(本质)/Why(原理)/How(定义方法)/Model(变式迁移) 认知阶梯
杜绝套话模板，所有数学公式经过严格 LaTeX 语法验证
"""

KP_ALGEBRA = {
    "KP-001": {
        "origin_story_zh": "自然数满足了人类计数的本能，但当面对商业交易中的盈余与亏损、地理测量上海平面之上的海拔与之下的深度时，单向的数系遇到了度量瓶颈。为了在数学上统一刻画具有相反意义的量，负数应运而生；同时，为了平分物体产生分数，进而将整数与分数统合为可以精确表达比值关系的'有理数'（源自希腊语Ratio，即可以写成两整数之比的数）。",
        "origin_story_en": "Natural numbers met counting needs, but commercial profits and losses or elevations above and below sea level exposed limitations of one-directional numbers. Negative numbers arose to quantify opposite directions, while fractions quantified division. Together, integers and fractions formed rational numbers—ratios of two integers.",
        "intuitive_essence_zh": "有理数的直观本质是'方向与刻度'的统一。任何有理数都包含符号（指示顺逆、盈亏的方向）与绝对值（指示距离基准零点的刻度大小）。零不再仅仅代表'没有'，而是作为平衡的基准对称原点。",
        "intuitive_essence_en": "The essence of rational numbers is the unification of sign and scale. Every rational number carries a direction relative to zero and a magnitude of distance.",
        "formal_definition_zh": "能够表示为两个整数之比形式 $\\frac{p}{q}$（其中 $p, q \\in \\mathbb{Z}$ 且 $q \\neq 0$）的数称为有理数。有理数集 $\\mathbb{Q}$ 可按定义划分为整数（正整数、零、负整数）与分数（正分数、负分数），亦可按正负性质划分为正有理数、零与负有理数。有限小数与无限循环小数均属于有理数。",
        "formal_definition_en": "A rational number is any number expressible as $\\frac{p}{q}$ ($p, q \\in \\mathbb{Z}, q \\neq 0$). It comprises integers and fractions, equivalent to finite decimals and repeating infinite decimals.",
        "intrinsic_variation_zh": "变式考查聚焦分类讨论的完备性与小数属性转化：(1) '0是最小的有理数'为典型假命题（忽略负有理数）；(2) 无限循环小数通过等比级数或方程法化为分数的机制；(3) 边界极端态：0既不是正数也不是负数，是正负数的分界骨架。",
        "intrinsic_variation_en": "Variations focus on exhaustive classification: zero is not positive nor negative; infinite repeating decimals can always convert to exact fractions."
    },

    "KP-002": {
        "origin_story_zh": "笛卡尔之前，几何是图形的视觉世界，代数是符号的抽象推演，二者相互割裂。数轴的诞生是人类思想史上的第一次'数形统一'：通过在一维直线上规定基准原点、正方向与度量刻度，使得无形的代数实数获得了直观的空间具象位置，开启了解析几何之门。",
        "origin_story_en": "Before Descartes, geometry and algebra were disconnected. The number axis created the first unification of algebra and geometry by mapping abstract numbers onto a continuous line with an origin, direction, and unit distance.",
        "intuitive_essence_zh": "数轴的本质是'点与数的一一映射通道'。在数轴上，数的大小转化为直观的几何位置先后：右侧点所表示的数恒大于左侧点。它将抽象的大小比较、加减位移退化为直观的尺规步测。",
        "intuitive_essence_en": "The number axis provides a bijective mapping between real numbers and spatial points. Order relations in algebra correspond directly to left-right positions in space.",
        "formal_definition_zh": "规定了原点（表示数 $0$ 的基准点）、正方向（通常向右）和单位长度（度量标尺）的直线叫做数轴。实数与数轴上的点存在一一对应关系：数轴上任意一点对应唯一实数，任意实数在数轴上都有唯一的几何点与之对应。",
        "formal_definition_en": "A number axis is a directed line specified by an origin, a positive direction, and a unit length, establishing a bijection between real numbers and points on the line.",
        "intrinsic_variation_zh": "变式重点是'数轴上的动点问题与线段和差'：(1) 动点位移公式：若点 $A(x_0)$ 以速度 $v$ 运动时间 $t$，则向右运动后坐标为 $x_0 + vt$，向左为 $x_0 - vt$；(2) 中点坐标公式：$x_M = \\frac{x_A + x_B}{2}$；(3) 陷阱：点在数轴上的相对位置不确定时，求距离必须添加绝对值符号以防漏掉分类。",
        "intrinsic_variation_en": "Key variants involve moving point kinematics on the line: position equals initial plus velocity times time. Distance between $A$ and $B$ must always use $|x_A - x_B|$ to avoid sign omissions."
    },

    "KP-003": {
        "origin_story_zh": "在物理平衡中，等臂杠杆两侧悬挂相等重量则保持平衡；在矢量位移中，向东走5米与向西走5米相加位移归零。这种关于基准点呈轴对称且代数和为零的客观规律，抽象为相反数；而仅关注移动物理距离、剥离方向属性的需求，催生了绝对值算子。",
        "origin_story_en": "Physical balance and displacements in opposing directions motivated the concept of opposites summing to zero. The demand to measure raw distance regardless of orientation created the absolute value.",
        "intuitive_essence_zh": "相反数的本质是数轴上关于原点的'对折重合对称性'；绝对值的几何本质是'无方向纯距离'。$|a|$ 是点 $a$ 到原点的距离，$|a - b|$ 是点 $a$ 与点 $b$ 之间的几何线段长度，它天生具有非负性 ($|x| \\geq 0$)。",
        "intuitive_essence_en": "Opposites represent reflectional symmetry about the origin. Absolute value geometrically measures the non-negative distance between points: $|a-b|$ is the distance from $a$ to $b$.",
        "formal_definition_zh": "若两数 $a, b$ 满足 $a + b = 0$，则称 $a$ 与 $b$ 互为相反数，记作 $b = -a$。实数 $a$ 的绝对值定义为分段映射：当 $a > 0$ 时 $|a| = a$；当 $a = 0$ 时 $|a| = 0$；当 $a < 0$ 时 $|a| = -a$。几何形式表达为 $|a| = \\sqrt{a^2}$。",
        "formal_definition_en": "Two numbers are opposites if $a + b = 0$. The absolute value $|a|$ is defined piecewise: $a$ for $a \\geq 0$, and $-a$ for $a < 0$, satisfying non-negativity $|a| \\geq 0$.",
        "intrinsic_variation_zh": "高频变式聚焦于绝对值的代数化简与极值：(1) 零点分段讨论法化简多重绝对值；(2) 距离模型极值：$f(x) = |x - a| + |x - b|$ 在 $a \\leq x \\leq b$ 处取得最小值 $|a - b|$（折线段两点间最短）；(3) 易错陷阱：化简 $|a|$ 时忽视 $a$ 本身的负号，误以为 $-a$ 一定是负数。",
        "intrinsic_variation_en": "Variants cover zero-point case analysis for nested absolute values, and distance minimization: $|x-a|+|x-b|$ reaches minimum $|a-b|$ between $a$ and $b$."
    },

    "KP-004": {
        "origin_story_zh": "当负数被接纳后，算术运算规则面临严峻考验：如何合理解释'负负得正'？数学家们发现，如果要求数系扩充后乘法对加法的分配律仍然保持成立，那么必然要求 $(-1) \\times (-1) = 1$。运算法则的确立是为了保证代数结构自洽与运算律不变性。",
        "origin_story_en": "Introducing negative numbers demanded arithmetic consistency. Mathematicians proved that preserving the distributive law across the extended system logically forces $(-1) \\times (-1) = 1$.",
        "intuitive_essence_zh": "加减法是数轴上的'向量平移拼接'（同向叠加、反向抵消）；乘除法是'尺度的缩放与方向的翻转'（乘以负号即关于原点作 180° 旋转）。运算符号与性质符号在计算中实现合一。",
        "intuitive_essence_en": "Addition and subtraction correspond to vector displacements on the line. Multiplication and division represent scaling and reflection (multiplying by negative reflects across the origin).",
        "formal_definition_zh": "有理数运算法则：同号两数相加取相同的符号并把绝对值相加；绝对值不等的异号两数相加取绝对值较大者的符号并用较大绝对值减去较小绝对值；减去一个数等于加上这个数的相反数：$a - b = a + (-b)$；两数相乘同号得正、异号得负；除以一个不为零的数等于乘它的倒数：$a \\div b = a \\times \\frac{1}{b}$ ($b \\neq 0$)。",
        "formal_definition_en": "Operations obey: $a - b = a + (-b)$; products of like signs are positive, unlike negative; $a \\div b = a \\cdot \\frac{1}{b}$ ($b \\neq 0$); operations preserve commutative, associative, and distributive laws.",
        "intrinsic_variation_zh": "中考考查重点是'混合运算顺序与简便技巧'：(1) 先算乘方，再算乘除，最后算加减，有括号先算括号内；(2) 裂项相消技巧与分配律逆用；(3) 陷阱：$-2^2 = -4$ 与 $(-2)^2 = 4$ 的底数辨析，除法没有分配律 ($a \\div (b+c) \\neq a/b + a/c$)。",
        "intrinsic_variation_en": "Key traps: distinguishing $-a^2$ from $(-a)^2$; avoiding division distribution violations $a \\div (b+c) \\neq a/b + a/c$."
    },

    "KP-005": {
        "origin_story_zh": "毕达哥拉斯学派曾断言'万物皆数'，坚信宇宙一切物理量都能用整数及其比值度量。然而，希帕索斯根据勾股定理研究单位正方形的对角线长时，惊恐地发现 $\\sqrt{2}$ 无法表示为任何两个互质整数之比。第一次数学危机爆发，迫使数学突破有理数禁锢，承认存在无限不循环的'不可通约量'，即无理数。",
        "origin_story_en": "Pythagoreans believed all quantities were integer ratios. When Hippasus examined the diagonal of a unit square, he proved $\\sqrt{2}$ cannot be expressed as $p/q$, sparking the first foundational crisis and birthing irrational numbers.",
        "intuitive_essence_zh": "无理数的直观本质是'有理数稠密缝隙中的连续填充'。虽然有理数在数轴上无限密集，但依然千疮百孔；数轴上的连续实数线正是由无理数将这些缝隙彻底填满，使得几何长度与代数数值实现真正的完备连续。",
        "intuitive_essence_en": "Irrational numbers fill the gaps between dense rational numbers on the continuum, providing completeness where geometric continuous lengths match arithmetic values.",
        "formal_definition_zh": "无限不循环小数叫做无理数。有理数和无理数统称为实数（$\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}$）。无理数的常见类型包括：开方开不尽的方根（如 $\\sqrt{2}, \\sqrt{3}$）、含特定圆周率等数学常数的数（如 $\\pi$）、以及有特定规律但不循环的无限小数（如 $0.1010010001\\dots$）。",
        "formal_definition_en": "An irrational number is an infinite non-repeating decimal. Real numbers $\\mathbb{R}$ consist of rational and irrational numbers, covering non-perfect square roots, $\\pi$, and structured non-periodic decimals.",
        "intrinsic_variation_zh": "中考高频变式：(1) 识别无理数：带根号的不一定是无理数（如 $\\sqrt{4} = 2$ 是有理数），含 $\\pi$ 的式子需注意是否被抵消；(2) 实数封闭性考查：两无理数之和或积可能是由理数（如 $\\sqrt{2} + (-\\sqrt{2}) = 0$）；(3) 陷阱：误认为分母带根号即为无理数，忽视根号化简。",
        "intrinsic_variation_en": "Common variants: square root signs do not ensure irrationality (e.g. $\\sqrt{9}=3$); sum or product of two irrationals can be rational."
    },

    "KP-006": {
        "origin_story_zh": "几何中已知正方形面积 $S$，反求其边长 $a$ 的实际测量需求，催生了逆向开平方运算。因为正数乘方 $(\\pm a)^2 = S$ 具有二义性，数学家必须区分两个对称的平方根与唯一的几何非负边长，因此确立了算术平方根概念。",
        "origin_story_en": "Finding side length $a$ given square area $S$ created square roots. Because $(\\pm a)^2 = S$ produces two answers, mathematics designated the non-negative length as the principal arithmetic square root.",
        "intuitive_essence_zh": "平方根是'面积逆算边长'的一对正负对称解；算术平方根则是其在物理现实世界中的'唯一非负几何投影'。双重非负性：被开方数非负 ($a \\geq 0$)，算术平方根结果非负 ($\\sqrt{a} \\geq 0$)。",
        "intuitive_essence_en": "Square roots represent the two symmetric roots of quadratic inversion. The arithmetic square root is the non-negative branch, embodying dual non-negativity: $a \\geq 0$ and $\\sqrt{a} \\geq 0$.",
        "formal_definition_zh": "若一个数 $x$ 的平方等于 $a$（即 $x^2 = a$），则 $x$ 叫做 $a$ 的平方根，记作 $x = \\pm \\sqrt{a}$。正数 $a$ 的正平方根 $\\sqrt{a}$ 叫做 $a$ 的算术平方根；$0$ 的平方根与算术平方根均为 $0$；负数在实数范围内没有平方根。重要恒等式：$\\sqrt{a^2} = |a|$，$(\\sqrt{a})^2 = a$ ($a \\geq 0$)。",
        "formal_definition_en": "If $x^2 = a$, $x$ is a square root of $a$, denoted $\\pm \\sqrt{a}$. For $a \\geq 0$, $\\sqrt{a}$ is the arithmetic square root. Core identity: $\\sqrt{a^2} = |a|$. Negative numbers have no real square roots.",
        "intrinsic_variation_zh": "核心变式与考点陷阱：(1) 双重非负性联合求值：形如 $\\sqrt{x-2} + |y+3| = 0 \\implies x=2, y=-3$；(2) 恒等变形陷阱：$\\sqrt{(-3)^2} = |-3| = 3$，不可直接写出 $-3$；(3) 概念陷阱：'16的平方根是 $\\pm 4$'，而 '$\\sqrt{16}$ 的平方根'实际是 '$4$ 的平方根'，即 $\\pm 2$。",
        "intrinsic_variation_en": "Dual non-negativity systems: $\\sqrt{A} + |B| = 0 \\implies A=0, B=0$. Distinguish 'square roots of 16' ($\\pm 4$) from 'square roots of $\\sqrt{16}$' ($\\pm 2$)."
    },

    "KP-007": {
        "origin_story_zh": "从正方形面积扩展到立方体体积的度量：已知立方体体积 $V$，如何确定其棱长？由于奇数次幂保号（正数的立方为正，负数的立方为负，零的立方为零），立方运算存在严格一一对应的单调映射，逆运算开立方不会产生平方根那样的正负符号二义性。",
        "origin_story_en": "Measuring cubic volumes given volume $V$ required cube roots. Because odd powers preserve sign, cube root operations form an invertible monotonic bijection without sign ambiguity.",
        "intuitive_essence_zh": "立方根的本质是'三维空间体积与一维棱长的保号单调逆映射'。数轴上任何实数都有且仅有一个实立方根，其符号与原数完全一致，原点对称性天然成立：$\\sqrt[3]{-a} = -\\sqrt[3]{a}$。",
        "intuitive_essence_en": "Cube roots represent the monotonic volume-to-edge inversion preserving signs. Every real number has exactly one real cube root, with symmetry $\\sqrt[3]{-a} = -\\sqrt[3]{a}$.",
        "formal_definition_zh": "若一个数 $x$ 的立方等于 $a$（即 $x^3 = a$），则 $x$ 叫做 $a$ 的立方根（三次方根），记作 $x = \\sqrt[3]{a}$。任何实数 $a$ 都有唯一确定的立方根；正数的立方根是正数，负数的立方根是负数，$0$ 的立方根是 $0$。恒等式：$(\\sqrt[3]{a})^3 = a$，$\\sqrt[3]{a^3} = a$。",
        "formal_definition_en": "If $x^3 = a$, $x$ is the cube root $\\sqrt[3]{a}$. Every real number possesses a unique real cube root satisfying $(\\sqrt[3]{a})^3 = a$ and $\\sqrt[3]{-a} = -\\sqrt[3]{a}$.",
        "intrinsic_variation_zh": "变式考点对比：(1) 平方根与立方根性质对比：负数无实平方根但有实立方根；(2) 开方化简：$\\sqrt[3]{-8} = -2$；(3) 陷阱：误以为负数开立方也无意义，或在立方根符号前强行添加正负号 $\\pm$。",
        "intrinsic_variation_en": "Comparison traps: negative numbers DO have real cube roots. Never add extraneous $\\pm$ signs before radical index 3."
    },

    "KP-008": {
        "origin_story_zh": "在木工下料、工程筑堤等工程测量中，工人不需要算出 $\\sqrt{10}$ 的无限不循环尾数，但必须知道它大致在 3.1 到 3.2 之间。对不可精确表示的无理数进行上下夹逼估算，是人类在有限工程与无限数学之间建立实效桥梁的生存智慧。",
        "origin_story_en": "Practical engineering does not require infinite decimal tails of $\\sqrt{10}$, but needs to know it lies between 3.1 and 3.2. Squeeze estimation bridges infinite math and tangible construction.",
        "intuitive_essence_zh": "实数估算的本质是'夹逼定理的直观应用'。利用完全平方数的单调性，将目标无理数锁定在相邻两个连续整数的平方根之间：若 $n^2 < a < (n+1)^2$，则 $n < \\sqrt{a} < n+1$。",
        "intuitive_essence_en": "Estimation relies on monotonic squeezing between adjacent perfect squares: $n^2 < a < (n+1)^2 \\implies n < \\sqrt{a} < n+1$.",
        "formal_definition_zh": "实数大小比较法则：数轴上右边的点表示的数大于左边的点；正数大于零，零大于负数，两个负数比较大小，绝对值大的反而小；若 $a - b > 0 \\iff a > b$。估算无理数整数部分与小数部分：设 $n \\leq \\sqrt{a} < n+1$ ($n \\in \\mathbb{Z}$)，则 $\\sqrt{a}$ 的整数部分为 $n$，小数部分为 $\\sqrt{a} - n$。",
        "formal_definition_en": "For real numbers, order is determined by subtraction sign $a - b > 0 \\iff a > b$. If integer $n \\leq \\sqrt{a} < n+1$, its integer part is $n$ and fractional part is $\\sqrt{a} - n$.",
        "intrinsic_variation_zh": "高频考题模型：(1) 求无理数的小数部分：如求 $\\sqrt{5} + 1$ 的小数部分，先估算 $2 < \\sqrt{5} < 3$，整数部分为 $3$，小数部分为 $(\\sqrt{5} + 1) - 3 = \\sqrt{5} - 2$；(2) 陷阱：负无理数取整，如 $-1 < -\\sqrt{0.5} < 0$，其整数部分是 $-1$ 而不是 $0$。",
        "intrinsic_variation_en": "Decomposition into integer and fractional parts: for $\\sqrt{5}+1$, integer part is 3, fractional part is $\\sqrt{5}-2$. Careful with negative bounds."
    },

    "KP-009": {
        "origin_story_zh": "古代算术用具体数字解特定问题，换一个数字就要重算一遍。韦达用字母代表已知量与未知量，完成了从'具体算术'到'符号代数'的跃迁。代数式把无限个同类具体情境浓缩成一条通用公式，使人类具备了从特殊向一般规律抽象的思维工具。",
        "origin_story_en": "Ancient arithmetic solved individual numbers repeatedly. Vieta replaced numbers with letters, creating symbolic algebra that generalises infinite scenarios into uniform functional formulas.",
        "intuitive_essence_zh": "代数式的本质是'计算关系的骨架图示与程序封装'。字母是留待填入具体数值的容器或占位符，代数式定义了一套不依赖于特定输入的运算程序协议。",
        "intuitive_essence_en": "An algebraic expression is a computational recipe and structural skeleton where variables serve as input placeholders executing defined operational rules.",
        "formal_definition_zh": "由数和表示数的字母经有限次加、减、乘、除、乘方和开方等代数运算所得的式子叫做代数式（单独一个数或一个字母也是代数式）。代数式的值：用具体数值代替代数式里的字母，按照代数式指明的运算顺序计算出的数值结果。",
        "formal_definition_en": "An algebraic expression consists of constants, variables, and finite algebraic operations. Evaluating means substituting specific values for variables and computing the arithmetic result.",
        "intrinsic_variation_zh": "中考核心变式是'整体代入思想'：题目往往不直接给出未知数具体值，而是给出复合条件（如已知 $a^2 + 2a = 1$，求 $2a^2 + 4a - 5$ 的值，将 $a^2 + 2a$ 作为整体代入得 $2(1) - 5 = -3$）；(2) 陷阱：书写规范违例（带分数乘字母未化假分数、除号未写成分数线）。",
        "intrinsic_variation_en": "Holistic substitution strategy: evaluate $2a^2 + 4a - 5$ by grouping into $2(a^2+2a)-5$ using known compound equations rather than solving single roots."
    },

    "KP-010": {
        "origin_story_zh": "日常计数中'3个苹果加2个苹果等于5个苹果'，但'3个苹果加2个香蕉'不能合并。在符号代数中，必须确立严谨的边界，界定哪些项是物理量纲一致的'同类项'，哪些项不能相混，由此确立了整式加减合并同类项的代数运算法则。",
        "origin_story_en": "Three apples plus two apples make five apples, but apples cannot merge with bananas. Formal algebra defines terms with identical letter powers as 'like terms' to ensure dimensionally consistent addition.",
        "intuitive_essence_zh": "整式加减的本质是'同阶同维变量的系数累加与抵消'。字母及其指数构成了该项的'量纲骨架'，合并同类项本质上是乘法分配律逆用的直接结果：$ax^n + bx^n = (a+b)x^n$。",
        "intuitive_essence_en": "Combining like terms represents reverse application of the distributive law $ax^n + bx^n = (a+b)x^n$, aggregating coefficients over identical variable dimensions.",
        "formal_definition_zh": "所含字母相同，并且相同字母的指数也分别相同的项叫做同类项（常数项都是同类项）。合并同类项法则：把同类项的系数相加，所得结果作为系数，字母和字母的指数保持不变。去括号法则：括号前是'+'号，去掉括号和正号，括号内各项符号不变；括号前是'-'号，各项符号全部改变。",
        "formal_definition_en": "Like terms have identical variables raised to identical exponents. Combining adds coefficients while preserving variables and powers: $am^p n^q + bm^p n^q = (a+b)m^p n^q$. Distribute negatives when removing parentheses.",
        "intrinsic_variation_zh": "变式考题：(1) '不含某项'问题：多项式化简后令该项系数等于 0 建立方程；(2) 绝对值与多重括号化简；(3) 陷阱：去括号时若括号外有系数常数漏乘内部项（如 $-2(x - 3) = -2x + 6$，常错写为 $-2x - 3$ 或 $-2x - 6$）。",
        "intrinsic_variation_en": "Independent coefficient problems: set coefficient to zero if an expression is independent of a variable. Avoid missing multiplier factors during parenthesis expansion."
    },

    "KP-011": {
        "origin_story_zh": "从一维长度度量到二维矩形面积计算：边长为 $a$ 与边长为 $b$ 的矩形面积为 $ab$；若长扩展为 $(a+b)$，宽为 $(c+d)$，大矩形面积则由四个小矩形切片面积拼接而成。几何面积割补催生了多项式乘法展开法则。",
        "origin_story_en": "Moving from linear length to planar area: rectangle $(a+b)(c+d)$ splits into four sub-rectangles $ac+ad+bc+bd$. Area dissection logically derived polynomial multiplication rules.",
        "intuitive_essence_zh": "整式乘法的本质是'全组合遍历分配'。多项式乘多项式要求第一个多项式的每一项无遗漏地与第二个多项式的每一项相乘，是二重循环遍历算法的代数映射。",
        "intuitive_essence_en": "Polynomial multiplication embodies all-pair Cartesian combination: every term of the first factor systematically pairs with every term of the second.",
        "formal_definition_zh": "幂的运算法则：同底数幂相乘 $a^m \\cdot a^n = a^{m+n}$；幂的乘方 $(a^m)^n = a^{mn}$；积的乘方 $(ab)^n = a^n b^n$。单项式与多项式相乘：$m(a+b+c) = ma + mb + mc$；多项式与多项式相乘：$(a+b)(p+q) = ap + aq + bp + bq$。",
        "formal_definition_en": "Exponential identities: $a^m a^n = a^{m+n}$, $(a^m)^n = a^{mn}$, $(ab)^n = a^n b^n$. Polynomial distribution: $(a+b)(p+q) = ap+aq+bp+bq$.",
        "intrinsic_variation_zh": "变式与考查：(1) 逆向应用指数运算法则（如已知 $2^a = 3, 2^b = 5$，求 $2^{a+b} = 2^a \\cdot 2^b = 15$）；(2) 陷阱：混淆同底数幂相乘与幂的乘方（$a^2 \\cdot a^3 = a^5$ 而非 $a^6$；$(a^2)^3 = a^6$），负号参与乘方漏掉括号。",
        "intrinsic_variation_en": "Reverse exponential evaluation: calculate $2^{a+b} = 2^a \\cdot 2^b$. Avoid exponent confusion between sum $a^m a^n=a^{m+n}$ and product $(a^m)^n=a^{mn}$."
    },

    "KP-012": {
        "origin_story_zh": "中国古代《九章算术》与古希腊欧几里得《几何原本》中，均用正方形面积割补直观证明了恒等式。边长为 $a$ 的大正方形切去边长为 $b$ 的小正方形，剩余 L 型面积拼成宽 $(a-b)$ 长 $(a+b)$ 的矩形，平方差与完全平方公式由此成为代数几何速算利器。",
        "origin_story_en": "Geometric dissection in Euclid's Elements proved algebraic identities visually: subtracting small square $b^2$ from $a^2$ rearranges into rectangle $(a-b)(a+b)$, yielding shortcut formulas.",
        "intuitive_essence_zh": "乘法公式是'几何面积不变性的极速代数投影'。平方差公式本质是两个对称矩形的对折互补；完全平方公式是正方形分割为两个小正方形加两个对称全等矩形：$(a+b)^2 = a^2 + 2ab + b^2$。",
        "intuitive_essence_en": "Multiplication formulas project geometric area invariance into rapid algebra. Perfect squares partition a large square into two squared corners and two symmetric rectangles.",
        "formal_definition_zh": "平方差公式：$(a+b)(a-b) = a^2 - b^2$；完全平方公式：$(a \\pm b)^2 = a^2 \\pm 2ab + b^2$。高频变形关系：$a^2 + b^2 = (a+b)^2 - 2ab = (a-b)^2 + 2ab$；$(a-b)^2 = (a+b)^2 - 4ab$；$ab = \\frac{(a+b)^2 - (a-b)^2}{4}$。",
        "formal_definition_en": "Difference of squares: $(a+b)(a-b) = a^2 - b^2$. Perfect square: $(a \\pm b)^2 = a^2 \\pm 2ab + b^2$. Derived: $a^2 + b^2 = (a+b)^2 - 2ab$.",
        "intrinsic_variation_zh": "核心变式：(1) 对称式求值：已知 $x + \\frac{1}{x} = 3$，求 $x^2 + \\frac{1}{x^2} = 3^2 - 2 = 7$；(2) 符号整体匹配：$(-a - b)^2 = (a+b)^2$；(3) 陷阱：漏乘交叉项 $2ab$（写成 $(a+b)^2 = a^2 + b^2$），以及平方差公式中变号项与不变号项识别混淆。",
        "intrinsic_variation_en": "Reciprocal symmetric evaluations: $(x + 1/x)^2 = x^2 + 1/x^2 + 2$. The fatal omission trap is dropping cross-term $2ab$."
    },

    "KP-013": {
        "origin_story_zh": "乘法是合成，除法是拆解。已知矩形总面积与一边长，求另一边长，必然要发展出整式除法。在代数结构中，整除是多项式因式分解与分式约分的算术前置基础。",
        "origin_story_en": "Multiplication synthesizes; division decomposes. Given total rectangular area and one side, finding the other demands polynomial division, underpinning rational fraction reductions.",
        "intuitive_essence_zh": "整式除法的本质是'各维度因子的逐一消去与降次'。单项式相除是系数除系数、同底数幂指数相减；多项式除以单项式是分配律在除法中的平行拆分。",
        "intuitive_essence_en": "Polynomial division represents dimensional factor reduction: divide coefficients and subtract like exponents across every term under the distributive law.",
        "formal_definition_zh": "同底数幂除法：$a^m \\div a^n = a^{m-n}$ ($a \\neq 0, m > n$)。规定零指数幂：$a^0 = 1$ ($a \\neq 0$)；负整数指数幂：$a^{-p} = \\frac{1}{a^p}$ ($a \\neq 0, p \\in \\mathbb{Z}^+$)。单项式除以单项式：系数相除作为商的系数，同底数幂分别相除，其余字母连同指数照抄。多项式除以单项式：$(a+b+c) \\div m = a/m + b/m + c/m$。",
        "formal_definition_en": "Quotient of powers: $a^m \\div a^n = a^{m-n}$. Zero exponent: $a^0 = 1$ ($a \\neq 0$). Negative exponent: $a^{-p} = 1/a^p$. Distribute $(a+b) \\div m = a/m + b/m$.",
        "intrinsic_variation_zh": "变式考点：(1) 科学记数法表示微小正数：$a \\times 10^{-n}$ ($1 \\leq a < 10, n \\in \\mathbb{Z}^+$)；(2) 底数存在负号的负指数运算；(3) 陷阱：任何数的 $0$ 次方都等于 $1$ 是错的（忽视底数 $0^0$ 无意义），多项式除以单项式漏除常数项导致漏项。",
        "intrinsic_variation_en": "Scientific notation for decimals: $a \\times 10^{-n}$. Beware of undefined $0^0$ and dropping standalone constant divisions in $(a+b)/m$."
    },

    "KP-014": {
        "origin_story_zh": "高次多项式在展开形态下宛如坚固的铁板，难以看透其根的性质与结构；只有将其分解为几个一次因式的乘积，才能利用'积为零则至少有一因式为零'的性质逐一击破。因式分解是整个代数方程求解的最核心枢纽。",
        "origin_story_en": "Expanded high-degree polynomials hide their roots. Factoring converts a monolithic sum into product factors, enabling the zero-product property $A \\cdot B = 0 \\implies A=0 \\lor B=0$ to conquer equations.",
        "intuitive_essence_zh": "因式分解是多项式乘法的'全过程逆向时间倒流'。乘法是把积木拆解铺平为面积，因式分解则是将平铺的零散面积重新拼装为规整的矩形边长乘积。",
        "intuitive_essence_en": "Factoring is polynomial multiplication in reverse: rearranging scattered area terms into clean rectangular side-length products.",
        "formal_definition_zh": "把一个多项式化为几个整式的积的形式，叫做把这个多项式因式分解。主要方法：(1) 提公因式法：$ma + mb = m(a+b)$；(2) 公式法：平方差 $a^2 - b^2 = (a+b)(a-b)$，完全平方 $a^2 \\pm 2ab + b^2 = (a \\pm b)^2$；(3) 十字相乘法：$x^2 + (p+q)x + pq = (x+p)(x+q)$。底线原则：必须分解到每一个因式都不能再分解为止。",
        "formal_definition_en": "Factoring rewrites polynomials into irreducible products using common factors, difference of squares, perfect squares, and cross-multiplication. It must factor thoroughly.",
        "intrinsic_variation_zh": "高频易错与变式：(1) 先提公因式再套公式（提公因式后常漏掉系数 1）；(2) 分解不彻底：如把 $x^4 - 1$ 分解为 $(x^2+1)(x^2-1)$ 即停止，未继续分解为 $(x^2+1)(x+1)(x-1)$；(3) 双十字相乘与分组分解法处理四项式。",
        "intrinsic_variation_en": "Crucial requirement: factor completely ($x^4-1 \\to (x^2+1)(x+1)(x-1)$). Always extract common factors first."
    },

    "KP-015": {
        "origin_story_zh": "当开方运算遇到不可开尽的数时，如 $\\sqrt{12}$，若用小数近似会丢失精确度，保留根号又难以进行同类项合并。数学家建立了二次根式化简标准，将内部完全平方因子开出，统一到'最简二次根式'，使得无理表达式能够精确合并与运算。",
        "origin_story_en": "Inexact roots like $\\sqrt{12}$ lose precision if approximated as decimals. Extracting square factors standardizes them into simplified radicals $2\\sqrt{3}$, allowing exact symbolic arithmetic.",
        "intuitive_essence_zh": "二次根式化简的本质是'剥离平方因子，统一同类无理基底'。如同不同面额货币化整，将 $\\sqrt{8}$ 化为 $2\\sqrt{2}$，才能与 $3\\sqrt{2}$ 像合并同类项一样合并为 $5\\sqrt{2}$。",
        "intuitive_essence_en": "Simplifying radicals removes perfect square factors to expose common irrational bases for algebraic combination.",
        "formal_definition_zh": "形如 $\\sqrt{a}$ ($a \\geq 0$) 的式子叫做二次根式。最简二次根式满足两条：(1) 被开方数不含分母；(2) 被开方数中不含能开得尽方的因数或因式。乘除法则：$\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$ ($a \\geq 0, b \\geq 0$)；$\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$ ($a \\geq 0, b > 0$)。分母有理化：$\\frac{1}{\\sqrt{a} + \\sqrt{b}} = \\frac{\\sqrt{a} - \\sqrt{b}}{a - b}$。",
        "formal_definition_en": "Radical $\\sqrt{a}$ ($a \\geq 0$) is simplified if radicand has no fractions and no square factors. Rationalize denominators via conjugate pairs: $\\frac{1}{\\sqrt{a}+\\sqrt{b}} = \\frac{\\sqrt{a}-\\sqrt{b}}{a-b}$.",
        "intrinsic_variation_zh": "中考考查模型：(1) 有意义条件：被开方数非负与分母非零联立；(2) 复合二次根式化简与分母有理化技巧；(3) 陷阱：化简 $\\sqrt{(-2)^2 \\times 3}$ 时，负数平方开出必须加绝对值变为 $2\\sqrt{3}$，切忌直接写出 $-2\\sqrt{3}$ 违反非负性。",
        "intrinsic_variation_en": "Domain prerequisites: radicand $\\geq 0$ and denominator $\\neq 0$. Ensure $\\sqrt{a^2} = |a| \\geq 0$ prevents negative roots."
    },

    "KP-016": {
        "origin_story_zh": "在测量分配中，当除法不能整除且除式包含未知变量时，如工程效率计算 $\\frac{W}{t}$，普通多项式无能为力。人类从分数的分子分母同乘同除值不变的经验出发，将这一性质延拓至含有未知数的代数式，创立了分式理论。",
        "origin_story_en": "When dividing algebraic formulas with variables in the denominator (like work efficiency $W/t$), fractions are generalized into rational algebraic expressions preserving fractional scaling laws.",
        "intuitive_essence_zh": "分式的本质是'变量比值的几何相似缩放不变性'。分子分母同时乘除同一个非零因式，保持几何斜率或实际比值恒定，这是分式约分化简与通分的唯一理论支柱。",
        "intuitive_essence_en": "Rational fractions preserve scaling ratios when numerator and denominator are multiplied or divided by identical non-zero factors.",
        "formal_definition_zh": "形如 $\\frac{A}{B}$ 的式子，如果 $A, B$ 表示两个整式，并且 $B$ 中含有字母，那么式子 $\\frac{A}{B}$ 叫做分式。分式有意义的充要条件：分母 $B \\neq 0$；分式值为零的充要条件：分子 $A = 0$ 且分母 $B \\neq 0$。分式基本性质：$\\frac{A}{B} = \\frac{A \\cdot M}{B \\cdot M}$，$\\frac{A}{B} = \\frac{A \\div M}{B \\div M}$ ($M \\neq 0$)。",
        "formal_definition_en": "Fraction $\\frac{A}{B}$ where $B$ contains variables requires denominator $B \\neq 0$. Value is zero iff $A = 0$ AND $B \\neq 0$. Fundamental property: $\\frac{A}{B} = \\frac{A \\cdot M}{B \\cdot M}$ ($M \\neq 0$).",
        "intrinsic_variation_zh": "中考高频命题陷阱：(1) '分式值为零'的双重条件：只令分子为零未检验分母，导致取到无意义增根；(2) 约分时符号变换：如 $\\frac{a-b}{b-a} = -1$；(3) 通分时漏找各分母的最简公分母（最高次幂与所有独立因子之积）。",
        "intrinsic_variation_en": "Dual constraints for fraction $=0$: numerator $A=0$ while ensuring denominator $B \\neq 0$. Signs reverse when cancelling $(a-b)/(b-a) = -1$."
    },

    "KP-017": {
        "origin_story_zh": "两个工程队合作完成一项工程，各自效率分别为 $\\frac{1}{a}$ 与 $\\frac{1}{b}$，总效率需要相加；电学中两个并联电阻 $R_1, R_2$ 的总电阻公式 $\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}$。物理现实中包含未知变量的逆向相加需求，推动了分式四则运算法则的成型。",
        "origin_story_en": "Parallel resistances $\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}$ and collaborative work rates require adding variable fractions, necessitating systematic operational rules.",
        "intuitive_essence_zh": "分式加减的本质是'通分统一分母量纲'，乘除法的本质是'交叉因式约分化简'。四则运算是因式分解技术的终极综合舞台。",
        "intuitive_essence_en": "Addition/subtraction unifies denominators via least common multiples; multiplication/division cancels common factor divisors across numerators and denominators.",
        "formal_definition_zh": "加减运算法则：同分母分式相加减，分母不变，分子相加减 $\\frac{a}{c} \\pm \\frac{b}{c} = \\frac{a \\pm b}{c}$；异分母分式通分后相加减。乘除除法法则：$\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{ac}{bd}$；$\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c} = \\frac{ad}{bc}$。乘方：$(\\frac{a}{b})^n = \\frac{a^n}{b^n}$。",
        "formal_definition_en": "Common denominator: $\\frac{a}{c} \\pm \\frac{b}{c} = \\frac{a \\pm b}{c}$. Products multiply tops and bottoms; division multiplies by reciprocal; powers apply to both numerator and denominator.",
        "intrinsic_variation_zh": "综合题型：'先化简再求值'，给定自选或指定未知数代入。陷阱：(1) 分式减法去括号分子未整体加括号导致变号错误：如 $\\frac{x}{x-1} - \\frac{2x-1}{x-1} = \\frac{x - (2x-1)}{x-1}$，常错写为 $\\frac{x-2x-1}{x-1}$；(2) 自选值带入了使原分式任何一个分母为零的禁用值。",
        "intrinsic_variation_en": "Simplification and evaluation traps: distributing negative signs across numerator expressions; choosing test values that invalidate any original denominators."
    },

    "KP-018": {
        "origin_story_zh": "在求解涉及距离、速度与时间的关系问题时，未知数往往不可避免地出现在分母中。为了求解，数学家常规策略是两边同乘最简公分母将其'降维'转化为熟悉的整式方程。但当求出的解恰好使分母为零时，相当于方程两边乘以了 $0$，破坏了等式同解性，因而诞生了'增根'现象与必须检验的法则。",
        "origin_story_en": "Clearing denominators by multiplying common terms can accidentally multiply equations by zero if the root zeroes the denominator. This creates extraneous roots, necessitating mandatory verification.",
        "intuitive_essence_zh": "分式方程解法的本质是'去分母升维破局'，增根的本质是'等式同解变形条件的破坏'。检验不是可有可无的验算，而是逻辑链条闭合的生死关卡。",
        "intuitive_essence_en": "Solving clears fractions to yield integer polynomials. Verification is not an optional double-check, but a logical necessity to discard zero-denominator roots.",
        "formal_definition_zh": "分母中含有未知数的方程叫做分式方程。标准解法步骤：(1) 方程两边同乘最简公分母，化为整式方程；(2) 解整式方程求出候选根；(3) 检验：将解代入最简公分母，若最简公分母为零，则是增根，必须舍去；若不为零，则是原方程的根。",
        "formal_definition_en": "A fractional equation has variables in denominators. Steps: multiply by common denominator, solve resulting polynomial equation, and check that roots do not zero the denominator.",
        "intrinsic_variation_zh": "中考压轴高频：'已知分式方程有增根或无解，求参数值'：(1) 若有增根，令最简公分母等于 0 得出增根候选值，代入整式方程反求参数；(2) 若无解，包含两种情况：转化为整式方程后自身无解，或整式方程的解均为增根；(3) 陷阱：审题漏掉'无解'可能来源于一元一次整式方程一次项系数为 0。",
        "intrinsic_variation_en": "Parameter determination with extraneous roots: find candidate roots zeroing denominators, substitute into polynomial equation to determine parameter bounds."
    },

    "KP-019": {
        "origin_story_zh": "古埃及《莱因德纸草书》与中国《九章算术》中记载了大量'盈不足'与'买物'算题。天平平衡原理启蒙了人类：如果一个天平两端平衡，同时加减相同砝码或扩大缩小相同倍数，天平依然平衡。基于天平公理，移项与系数化为1构成了方程求解的核心基石。",
        "origin_story_en": "Ancient balance scales inspired equation solving: adding, subtracting, multiplying, or dividing equal weights on both sides preserves equilibrium, yielding transposition principles.",
        "intuitive_essence_zh": "一元一次方程的本质是'已知与未知的逆运算逆向溯源'。方程把未知的 $x$ 伪装成已知数共同参与运算，解方程则是利用等式性质层层剥洋葱，逆向还原出 $x$ 的真实值。",
        "intuitive_essence_en": "Linear equations treat unknowns as temporary constants, unpeeling arithmetic operations inversely to isolate $x$.",
        "formal_definition_zh": "只含有一个未知数（元），且未知数的次数是 $1$，等号两边都是整式的方程叫做一元一次方程。标准形式：$ax + b = 0$ ($a \\neq 0$)，唯一解为 $x = -\\frac{b}{a}$。解法五步程序：去分母、去括号、移项、合并同类项、系数化为 $1$。",
        "formal_definition_en": "A linear equation in one variable has form $ax + b = 0$ ($a \\neq 0$), with unique root $x = -b/a$. Standard 5 steps: clear denominators, expand parentheses, transpose, combine, normalize coefficient.",
        "intrinsic_variation_zh": "中考易错细节：(1) 去分母时漏乘没有分母的常数项（如 $\\frac{x-1}{2} = 1 - \\frac{x}{3}$，两边乘 6 时中间的 1 漏乘 6）；(2) 移项未变号；(3) 实际应用题建模：行程问题、工程问题、打折销售利润问题（利润 = 售价 - 进价，利润率 = 利润/进价）。",
        "intrinsic_variation_en": "Common errors: failing to multiply standalone constant integers when clearing denominators; forgetting sign reversals when transposing terms across the equal sign."
    },

    "KP-020": {
        "origin_story_zh": "单一度量关系往往无法锁定多个相互交织的物理状态，如'鸡兔同笼'问题中，头数与足数两个约束条件同时作用。为了在数学上解开多个变量的交织羁绊，必须联立多个方程，并通过'消元'将多元降维为一元，这是人类化繁为简的核心降维智慧。",
        "origin_story_en": "Solving multiple intertwined constraints (like heads and legs in the classic chickens and rabbits puzzle) requires systems of equations and the core strategy of elimination to reduce dimensionality.",
        "intuitive_essence_zh": "二元一次方程组的本质是'二维平面中两直线相交的唯一点'。每一个二元方程代表平面上的一条直线，方程组的解就是两条直线的几何交点坐标 $(x, y)$。",
        "intuitive_essence_en": "A linear system geometrically represents the intersection of two straight lines in the coordinate plane.",
        "formal_definition_zh": "含有两个未知数，并且每个未知数的项的次数都是 $1$ 的整式方程组成的方程组叫做二元一次方程组。核心解法思想：'消元化归'。(1) 代入消元法：选一个系数较简单的方程将一个未知数用另一个表示出来代入另一方程；(2) 加减消元法：通过两式同乘系数使某一未知数系数绝对值相等，相加或相减消去该未知数。",
        "formal_definition_en": "A system of two linear equations in two variables. Solved via elimination: substitution method or linear combination (addition/subtraction) to reduce to one variable.",
        "intrinsic_variation_zh": "中考考法：(1) 整体加减对称求值：如已知方程组求解 $x+y$ 或 $x-y$，无需解出单个未知数，直接两式相加或相减速算；(2) 几何两直线平行无解（两方程系数成比例但常数项不成比例）与重合无穷解；(3) 陷阱：代入消元时将表达式代回原提取方程产生恒等式死循环。",
        "intrinsic_variation_en": "Holistic addition/subtraction for symmetric targets $(x+y)$. Parallel lines have no solution; coincident lines have infinitely many solutions."
    },

    "KP-021": {
        "origin_story_zh": "从匀速运动到自由落体，从直角边长到矩形面积，二次乘方关系无处不在。当面积与周长被同时约束时，方程不可避免地升至二次。一元二次方程是初中阶段非线性代数方程的奠基石，标志着学生从'线性思维'向'非线性曲度思维'的跃升。",
        "origin_story_en": "Accelerated motion and area optimization involve quadratic relations. Quadratic equations mark the fundamental leap from linear relationships to non-linear curved dynamics.",
        "intuitive_essence_zh": "一元二次方程的本质是'抛物线轨迹与水平基准线的零点碰撞'。二次项系数 $a$ 决定曲率张角，一次项 $b$ 与常数项 $c$ 决定平移位置，方程的解就是抛物线横穿 $x$ 轴的交点横坐标。",
        "intuitive_essence_en": "Geometrically, quadratic equations describe where a parabola intersects the horizontal axis $y=0$.",
        "formal_definition_zh": "只含有一个未知数，并且未知数的最高次数是 $2$ 的整式方程叫做一元二次方程。一般形式：$ax^2 + bx + c = 0$ ($a \\neq 0$)，其中 $ax^2$ 为二次项，$a$ 为二次项系数；$bx$ 为一次项，$b$ 为一次项系数；$c$ 为常数项。二次项系数 $a \\neq 0$ 为生死判别红线。",
        "formal_definition_en": "Standard quadratic form: $ax^2 + bx + c = 0$ ($a \\neq 0$). The condition $a \\neq 0$ is strictly required for the equation to remain quadratic.",
        "intrinsic_variation_zh": "考点红线：(1) '关于 $x$ 的方程 $(m-1)x^2 + 2x + 1 = 0$ 是一元二次方程'，必须首先满足 $m - 1 \\neq 0 \\implies m \\neq 1$；(2) 若题目表述为'关于 $x$ 的方程'而未标明'一元二次'，则必须分 $a = 0$（退化为一元一次）和 $a \\neq 0$ 两种情况分类讨论。",
        "intrinsic_variation_en": "Critical trap: If $(m-1)x^2 + bx + c = 0$ is quadratic, $m \\neq 1$ is mandatory. If the degree is unspecified, analyze $a=0$ linear degradation vs $a \\neq 0$ quadratic cases."
    },

    "KP-022": {
        "origin_story_zh": "最简单的二次方程如 $x^2 = 9$ 或 $(x-1)^2 = 4$，其左侧天然是一个完全平方式，右侧是一个常数。这直接诱发了开平方的逆运算冲动。直接开平方法是以平方根的几何定义为直接武器，最快速降次解方程的方法。",
        "origin_story_en": "Pure quadratic equations $(x-h)^2 = k$ directly invoke square root inversion, reducing degree from 2 to 1 without expanding intermediate polynomials.",
        "intuitive_essence_zh": "直接开平方法的本质是'通过平方根对称性实现瞬间降维'。它将一个二次抛物线关于对称轴的两个对称解，转化为到中心点的左右等距距离关系：$x - h = \\pm \\sqrt{k}$。",
        "intuitive_essence_en": "Direct square rooting exploits root symmetry about the center: points are located $\\pm \\sqrt{k}$ equidistant from axis $h$.",
        "formal_definition_zh": "对于形如 $(x + m)^2 = n$ 的方程：当 $n > 0$ 时，方程有两个不相等的实数根 $x = -m \\pm \\sqrt{n}$；当 $n = 0$ 时，方程有两个相等的实数根 $x_1 = x_2 = -m$；当 $n < 0$ 时，方程无实数根。",
        "formal_definition_en": "For $(x+m)^2 = n$: if $n > 0$, roots are $x = -m \\pm \\sqrt{n}$; if $n = 0$, equal roots $x_1 = x_2 = -m$; if $n < 0$, no real roots exist.",
        "intrinsic_variation_zh": "变式陷阱：(1) 开方丢掉负根：如由 $x^2 = 4$ 错写为 $x = 2$（漏掉 $x = -2$）；(2) 右侧非负约束：当方程为 $(x-1)^2 = -3$ 时，直接判定实数范围内无解，不可盲目开虚数；(3) 结合绝对值：$\\sqrt{(x-2)^2} = 3 \\implies |x-2| = 3$。",
        "intrinsic_variation_en": "Frequent omissions: dropping negative roots ($x = \\pm \\sqrt{n}$); failing to check non-negativity constraint $n \\geq 0$ before extraction."
    },

    "KP-023": {
        "origin_story_zh": "并非所有一元二次方程天然就是完全平方形态，大多数方程如 $x^2 + 6x + 5 = 0$ 都是混杂的。波斯数学家阿尔·花拉子米通过在正方形两边各补一个矩形、再在角上补一个小正方形的几何拼图法，发明了'配方法'。配方法是推导求根公式与二次函数顶点式的万能母机。",
        "origin_story_en": "Al-Khwarizmi completed the square by adding geometric corner squares to rectangular tiles. Completing the square transforms any arbitrary quadratic into a solvable perfect square form.",
        "intuitive_essence_zh": "配方法的本质是'补齐几何正方形缺失的右下角'。一次项系数的一半的平方 $(\\frac{b}{2a})^2$，恰恰就是让二维多项式形成闭合正方形所精确缺失的那块面积补丁。",
        "intuitive_essence_en": "Completing the square literally fills the missing geometric corner of area $(b/2)^2$ to form a closed, perfect symmetric square.",
        "formal_definition_zh": "通过在方程两边加上一次项系数一半的平方，将一般方程化为 $(x+m)^2 = n$ 形式的方法。配方法标准流程：(1) 化二次项系数为 1（两边同除以 $a$）；(2) 移常数项到等号右边；(3) 两边同时加上'一次项系数一半的平方'；(4) 左边写作完全平方，右边化简；(5) 直接开平方降次求解。",
        "formal_definition_en": "Steps: normalize leading coefficient $a=1$, move constant $c$ right, add $(b/2)^2$ to both sides, compress left into $(x + b/2)^2$, and extract square roots.",
        "intrinsic_variation_zh": "中考核心考查：(1) 二次三项式最值与恒正性证明：$x^2 - 4x + 7 = (x-2)^2 + 3 \\geq 3$；(2) 几何动点最值分析；(3) 陷阱：二次项系数不为 1 时漏除以 $a$ 便盲目加一次项一半的平方（如 $2x^2 + 4x + 1 = 0$ 必须先化为 $x^2 + 2x = -0.5$）。",
        "intrinsic_variation_en": "Algebraic extrema proofs: $x^2 - 4x + 7 = (x-2)^2 + 3 \\geq 3$. Crucial rule: always divide by leading coefficient $a$ before completing the square."
    },

    "KP-024": {
        "origin_story_zh": "每次都手动重复几何配方繁琐耗时，能否对一般方程 $ax^2 + bx + c = 0$ 进行一次终极抽象配方，推导出一套适用于所有一元二次方程的万能直接套用公式？数学家通过对字母参数方程实施配方法，提炼出了著名的求根公式，实现了代数运算的形式化大一统。",
        "origin_story_en": "Repetitive manual completing of squares motivated a universal closed-form formula. Applying completing the square to abstract parameters $ax^2 + bx + c = 0$ produced the quadratic formula.",
        "intuitive_essence_zh": "求根公式是'二次方程配方全过程的算法结晶与快照'。公式中的 $\\pm$ 完美对应抛物线对称轴 $-b/(2a)$ 两侧等距的开方距离 $\\frac{\\sqrt{b^2-4ac}}{2a}$。",
        "intuitive_essence_en": "The quadratic formula encapsulates completing the square: roots lie symmetrically at $-b/(2a)$ plus and minus offset $\\frac{\\sqrt{b^2-4ac}}{2a}$.",
        "formal_definition_zh": "对于一元二次方程 $ax^2 + bx + c = 0$ ($a \\neq 0$)，当判别式 $\\Delta = b^2 - 4ac \\geq 0$ 时，方程的实数根为：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$。此公式称为一元二次方程的求根公式。当 $\\Delta < 0$ 时，方程在实数范围内无解。",
        "formal_definition_en": "For $ax^2 + bx + c = 0$ ($a \\neq 0$), if discriminant $\\Delta = b^2 - 4ac \\geq 0$, roots are $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
        "intrinsic_variation_zh": "中考考法：(1) 无理系数方程精确求根；(2) 与几何线段长联立求解；(3) 致命陷阱：分母是 $2a$ 而非 $2$，分子第一项是 $-b$ 包含符号改变，计算 $b^2 - 4ac$ 时当 $c < 0$ 负负得正符号处理失误。",
        "intrinsic_variation_en": "Arithmetic traps: denominator is $2a$ (not 2); numerator starts with $-b$; carefully handle signs in $-4ac$ when $c$ is negative."
    },

    "KP-025": {
        "origin_story_zh": "求根公式虽然万能，但在处理诸如 $x^2 - 3x = 0$ 或 $(x-2)(x+1) = 0$ 时显得笨重繁冗。利用整式乘法逆运算'因式分解'，把二次方程转化为两个一次因式之积，可以直接击穿方程，是中考解方程效率最高的首选方法。",
        "origin_story_en": "The quadratic formula is computationally heavy for factorable terms like $x^2 - 3x = 0$. Using factoring to set product factors to zero provides the fastest, most elegant solution path.",
        "intuitive_essence_zh": "因式分解法的本质是'实数零因子定理的直接应用'：若 $A \\cdot B = 0$，则必有 $A = 0$ 或 $B = 0$。它将高次乘积的纠缠解构为若干个独立平行的线性一次简单状态。",
        "intuitive_essence_en": "Zero-product principle: $A \\cdot B = 0 \\iff A = 0 \\lor B = 0$, transforming quadratic equations into two simple independent linear equations.",
        "formal_definition_zh": "先将方程右边化为 $0$，若左边能分解为两个一次因式的积，即 $(a_1 x + b_1)(a_2 x + b_2) = 0$，则令每一个因式分别为 $0$：$a_1 x + b_1 = 0$ 或 $a_2 x + b_2 = 0$，分别求解得出两个一元一次方程的解。",
        "formal_definition_en": "Transform equation to $P(x) = 0$. If $P(x) = (a_1 x + b_1)(a_2 x + b_2) = 0$, set each factor to zero to obtain roots.",
        "intrinsic_variation_zh": "核心考法：(1) 提公因式降次：如 $x(x-2) = 3(x-2)$，移项提公因式 $(x-2)(x-3) = 0$；(2) 致命陷阱：方程两边直接除以含有未知数的因式 $(x-2)$，导致丢掉根 $x = 2$；(3) 未化右边为 0 盲目分解：如由 $(x-1)(x-2) = 2$ 错误得出 $x-1=2$ 或 $x-2=1$。",
        "intrinsic_variation_en": "Fatal error: dividing both sides by factor $(x-2)$ eliminates root $x=2$. Never factor before moving all terms to one side so the other side is zero."
    },

    "KP-026": {
        "origin_story_zh": "许多时候，工程师与数学家并不需要算出方程的具体根是多少，而只想预先知道'到底有没有解'，或者只想了解'两根之和与两根之积'。法国数学家韦达发现，无需解方程，从多项式展开系数中就能直接读出根的内在对称信息，诞生了判别式与韦达定理。",
        "origin_story_en": "Frequently we only need root existence or symmetric sums, not raw roots. Vieta discovered that coefficients directly encode root sums and products, creating discriminant analysis and Vieta's formulas.",
        "intuitive_essence_zh": "判别式的本质是'抛物线顶点高度相对于 $x$ 轴的符号探针'；韦达定理的本质是'多项式展开时根与系数的完全对称映射'。两根之和反映对称轴位置，两根之积反映两根到原点方向与距离积。",
        "intuitive_essence_en": "The discriminant probes whether the parabola apex penetrates the x-axis. Vieta's formulas map polynomial coefficients directly to root sum and product symmetries.",
        "formal_definition_zh": "对于 $ax^2 + bx + c = 0$ ($a \\neq 0$)：(1) 根的判别式 $\\Delta = b^2 - 4ac$。$\\Delta > 0 \\iff$ 两不相等实根；$\\Delta = 0 \\iff$ 两相等实根；$\\Delta < 0 \\iff$ 无实数根。(2) 韦达定理：若方程有两实根 $x_1, x_2$（前提 $\\Delta \\geq 0$），则 $x_1 + x_2 = -\\frac{b}{a}$，$x_1 x_2 = \\frac{c}{a}$。",
        "formal_definition_en": "For $ax^2 + bx + c = 0$ ($a \\neq 0$): $\\Delta = b^2 - 4ac > 0 \\iff 2$ distinct real roots; $=0 \\iff 2$ equal roots; $<0 \\iff$ no real roots. Vieta: $x_1 + x_2 = -b/a, x_1 x_2 = c/a$ ($(\\Delta \\geq 0)$).",
        "intrinsic_variation_zh": "中考综合压轴：(1) 构造对称式求值：$x_1^2 + x_2^2 = (x_1+x_2)^2 - 2x_1 x_2$，$\\frac{1}{x_1} + \\frac{1}{x_2} = \\frac{x_1+x_2}{x_1 x_2}$，$|x_1 - x_2| = \\frac{\\sqrt{\\Delta}}{|a|}$；(2) 致命陷阱：利用韦达定理求参数值后，忘记代回校验 $\\Delta \\geq 0$，导致误收无实根时的伪解。",
        "intrinsic_variation_en": "Symmetric algebraic evaluations: $x_1^2 + x_2^2 = (x_1+x_2)^2 - 2x_1 x_2$. Must always verify that obtained parameter satisfies $\\Delta \\geq 0$."
    },

    "KP-027": {
        "origin_story_zh": "现实世界中等量关系是相对的、偶然的，而不等量关系（如限速、承重上限、预算区间）则是绝对的、普遍的。从天平平衡到天平倾斜，数学家探索不等式的运算法则时发现：加减正负数倾斜方向不变，乘除正数方向不变，但乘除负数天平必须立刻颠倒反向。",
        "origin_story_en": "Physical reality deals mostly with bounds (speed limits, load tolerances) rather than strict equalities. Studying inequality transformations revealed that multiplying by negative numbers inverts inequality direction.",
        "intuitive_essence_zh": "不等式的本质是'数轴上点集的半平面有序截断'。乘以负数之所以要改变不等号方向，是因为在数轴上乘以负号等价于以原点为对称中心进行了 180° 的镜像翻转，左右几何顺序彻底调换。",
        "intuitive_essence_en": "Multiplying by a negative reflects the number axis 180° across the origin, completely swapping the left-right spatial orientation and flipping the inequality symbol.",
        "formal_definition_zh": "不等式性质：(1) 若 $a > b$，则 $a \\pm c > b \\pm c$；(2) 若 $a > b$ 且 $c > 0$，则 $ac > bc$ 且 $\\frac{a}{c} > \\frac{b}{c}$；(3) （核心生死线）若 $a > b$ 且 $c < 0$，则 $ac < bc$ 且 $\\frac{a}{c} < \\frac{b}{c}$（必须改变不等号方向）。传递性：若 $a > b, b > c \\implies a > c$。",
        "formal_definition_en": "Properties: $a > b \\implies a \\pm c > b \\pm c$. If $c > 0$, $ac > bc$. CRITICAL RULE: If $c < 0$, multiplying or dividing flips inequality: $ac < bc$ and $a/c < b/c$.",
        "intrinsic_variation_zh": "中考经典陷阱：(1) 不等式两边同乘含未知数的式子未讨论正负（如由 $ax > b$ 推出 $x > \\frac{b}{a}$ 未说明 $a > 0$）；(2) 若 $a > b$，推导 $a^2 > b^2$（负数不成立，如 $1 > -2$ 但 $1 < 4$）；(3) 变形时方向反转漏改。",
        "intrinsic_variation_en": "Frequent traps: dividing $ax > b$ by $a$ without establishing $a > 0$; assuming $a > b \\implies a^2 > b^2$ for mixed negative quantities."
    },

    "KP-028": {
        "origin_story_zh": "解决工程限载、利润不低于某一底线等单约束不等问题，要求我们求解只含一个未知数的一次不等约束。与方程得到离散的点不同，不等式的解集是一个连续的区间。利用数轴将连续解集直观呈现，是数形结合的基础训练。",
        "origin_story_en": "Real-world minimum profit margins and safety capacities demand solving single-variable linear inequalities. Unlike equations with discrete roots, inequalities generate continuous interval solution sets.",
        "intuitive_essence_zh": "一元一次不等式解集的本质是'数轴上以临界分界点为起点的单向射线区域'。实心点代表包含等于边界（$\\geq, \\leq$），空心圈代表严格排除边界（$>, <$）。",
        "intuitive_essence_en": "Solutions represent continuous rays on the number axis: solid circles include boundary equality; hollow circles strictly exclude boundaries.",
        "formal_definition_zh": "只含有一个未知数，且未知数的次数是 $1$，不等号两边都是整式的不等式叫做一元一次不等式。解法步骤：去分母、去括号、移项、合并同类项、系数化为 $1$。系数化为 $1$ 时若除以负数，必须改变不等号方向。",
        "formal_definition_en": "Standard linear inequality solved by clearing fractions, parentheses, transposing, combining, and dividing. Reverse inequality symbol if dividing by negative coefficient.",
        "intrinsic_variation_zh": "中考考法：(1) 数轴规范画图（方向'大于向右，小于向左'，边界'有等号实心，无等号空心'）；(2) 求特定整数解（如求不等式的所有正整数解）；(3) 陷阱：去分母时负号连同分子括号处理不当漏变号。",
        "intrinsic_variation_en": "Graphic conventions: greater points right, lesser points left. Solid for inclusive, hollow for strict. Watch out for sign distribution when clearing fraction bars."
    },

    "KP-029": {
        "origin_story_zh": "在实际工程中，材料尺寸既不能小于下限，又不能大于上限，形成上下双重约束夹逼。将多个一元一次不等式联立成组，其公共部分构成了系统安全工作的容许公差带，这是不等式组的现实起源。",
        "origin_story_en": "Engineering tolerances require lower and upper limit clamping. Combining multiple linear inequalities establishes an allowable safety tolerance band where all conditions hold.",
        "intuitive_essence_zh": "一元一次不等式组解集的本质是'数轴上多条单向射线的交集公共重叠段'。口诀归纳：同大取大，同小取小，大小小大中间找，大大小小找不到（无解）。",
        "intuitive_essence_en": "The solution set is the geometric intersection of interval rays on the number axis: 'both greater take largest, both smaller take least, bounded take middle, divergent is empty'.",
        "formal_definition_zh": "关于同一个未知数的几个一元一次不等式合在一起，就组成了一元一次不等式组。不等式组中所有不等式解集的公共部分，叫做不等式组的解集。解法：分别求出各个不等式的解集，然后在数轴上找出它们的公共重合部分。",
        "formal_definition_en": "A system of linear inequalities whose solution set is the mutual geometric intersection of all individual solution sets.",
        "intrinsic_variation_zh": "中考压轴变式：'根据不等式组的解集或整数解个数求参数取值范围'：(1) 严格辨析端点能否取等号（'等号临界死生线'：假设参数取临界值检验是否满足整数解个数）；(2) 陷阱：求参数范围时错写等号导致漏解或多解；(3) 实际应用题（方案调配与最优化区间确定）。",
        "intrinsic_variation_en": "Parameter bounds based on integer solution counts: test boundary equality carefully to verify whether endpoints include or exclude target count."
    },

    "KP-030": {
        "origin_story_zh": "从静态几何到动态近代科学，人类关注焦点从'固定的形'转向'变化的运动'。行星轨道位置随时间推移而演变，气压随海拔升高而降低。莱布尼茨与欧拉确立了'函数'（Function）概念，用以精确刻画两个变量之间'输入唯一决定输出'的依赖对应规律。",
        "origin_story_en": "Transitioning from static geometry to dynamic modern physics required describing change over time. Leibniz and Euler formalized 'functions' to capture deterministic dependency where one input uniquely dictates one output.",
        "intuitive_essence_zh": "函数的本质是'单值确定的黑盒映射机制'。每一个合法的自变量输入 $x$，黑盒内部依据特定法则加工后，必须且只能吐出唯一的因变量输出 $y$（允许不同输入产出相同输出，但绝不允许同一输入产生多个歧义输出）。",
        "intuitive_essence_en": "A function is a deterministic single-valued mapping: each valid input $x$ maps to exactly one output $y$. Multiple inputs may share an output, but one input cannot produce multiple outputs.",
        "formal_definition_zh": "一般地，在一个变化过程中，如果有两个变量 $x$ 与 $y$，并且对于 $x$ 的每一个确定的值，$y$ 都有唯一确定的值与其对应，那么我们就说 $x$ 是自变量，$y$ 是 $x$ 的函数。自变量取值范围必须保证代数式有意义（分母不为零、偶次根号下非负、实际问题符合物理常理）。",
        "formal_definition_en": "In a dynamic process between variables $x$ and $y$, if every valid $x$ associates with a unique $y$, $y$ is a function of $x$. Domain requires non-zero denominators, non-negative radicals, and physical validity.",
        "intrinsic_variation_zh": "中考常考图象判别：垂直于 $x$ 轴的任意直线与函数图象最多只能有 $1$ 个交点（竖线判别法）；(2) 自变量取值范围联合求解（分母有根号等复合结构）；(3) 陷阱：误把圆的方程 $x^2 + y^2 = r^2$ 当作函数图象（一个 $x$ 对应两个 $y$）。",
        "intrinsic_variation_en": "Vertical line test: any vertical line can intersect a function graph at most once. Circle $x^2 + y^2 = r^2$ is not a function."
    },

    "KP-031": {
        "origin_story_zh": "相传笛卡尔躺在床上观察天花板上的苍蝇爬行，思考如何精确记录其瞬时位置。通过两条互相垂直的数轴交织，平面上的每一个离散位置都能用一对有序实数对 $(x, y)$ 唯一锁定。直角坐标系的诞生打破了数与形的次元壁，解析几何由此创生。",
        "origin_story_en": "Legend tells Descartes tracked a crawling fly on the ceiling. By crossing two perpendicular number axes, every 2D position is locked by ordered coordinates $(x,y)$, birthing analytic geometry.",
        "intuitive_essence_zh": "平面直角坐标系的本质是'二维空间的经纬网络化度量'。它将平面的连续几何点，转化为由横坐标（左右位移）与纵坐标（上下位移）构成的二维代数数组，实现了空间位置的完全数字化。",
        "intuitive_essence_en": "Cartesian coordinates grid 2D space into longitude-latitude pairs $(x,y)$, digitizing geometric points into ordered algebraic pairs.",
        "formal_definition_zh": "在平面内画两条互相垂直、并且有公共原点的数轴，组成平面直角坐标系。水平数轴为 $x$ 轴（横轴），竖直数轴为 $y$ 轴（纵轴）。平面内任意一点 $P$ 对应唯一有序实数对 $(x, y)$。四个象限符号：第一象限 $(+,+)$，第二象限 $(-,+)$，第三象限 $(-,-)$，第四象限 $(+,-)$；$x$ 轴上的点纵坐标为 $0$；$y$ 轴上的点横坐标为 $0$。",
        "formal_definition_en": "Two perpendicular axes sharing origin $O(0,0)$ split the plane into four quadrants. Signs: Q1 $(+,+)$, Q2 $(-,+)$, Q3 $(-,-)$, Q4 $(+,-)$. Axis points: x-axis $(x,0)$, y-axis $(0,y)$.",
        "intrinsic_variation_zh": "中考基础与对称变式：(1) 对称点坐标规律：关于 $x$ 轴对称横同纵反 $(x, -y)$；关于 $y$ 轴对称横反纵同 $(-x, y)$；关于原点对称横纵全反 $(-x, -y)$；(2) 平移规律：'左加右减横坐标，上加下减纵坐标'；(3) 到坐标轴距离：点 $P(x,y)$ 到 $x$ 轴距离为 $|y|$，到 $y$ 轴距离为 $|x|$（漏加绝对值常导致负距离低级错误）。",
        "intrinsic_variation_en": "Symmetry rules: reflection across x-axis $(x,-y)$, y-axis $(-x,y)$, origin $(-x,-y)$. Distance to x-axis is $|y|$; to y-axis is $|x|$."
    },

    "KP-032": {
        "origin_story_zh": "物理中以恒定速度行驶的路程与时间（$s = vt$）、单位密度下物体的质量与体积（$m = \\rho V$）。人类最早认识的函数关系就是这种'倍数同步放大缩小'的正比例关系。它是所有线性变化的最纯粹基元。",
        "origin_story_en": "Constant velocity motion $s=vt$ and density $m=\\rho V$ represent proportional scaling. Direct variation is the purest foundation of all linear models.",
        "intuitive_essence_zh": "正比例函数的本质是'过原点的恒定斜率刚性射线'。比例系数 $k$ 决定了直线的倾斜方向与陡峭程度，它把整个二维坐标系按固定的固定比例缩放锁定。",
        "intuitive_essence_en": "A direct proportion function is a rigid straight line anchored at the origin. Slope $k$ completely determines orientation and steepness.",
        "formal_definition_zh": "形如 $y = kx$ ($k$ 是常数，$k \\neq 0$) 的函数叫做正比例函数，其中 $k$ 叫做比例系数。图象是一条经过原点 $(0, 0)$ 与点 $(1, k)$ 的直线。性质：当 $k > 0$ 时，图象经过第一、三象限，从左到右上升，$y$ 随 $x$ 增大而增大；当 $k < 0$ 时，图象经过第二、四象限，从左到右下降，$y$ 随 $x$ 增大而减小。",
        "formal_definition_en": "Function $y = kx$ ($k \\neq 0$) graphs as a straight line through $(0,0)$ and $(1,k)$. If $k > 0$, spans Q1 and Q3, monotonically increasing. If $k < 0$, spans Q2 and Q4, monotonically decreasing.",
        "intrinsic_variation_zh": "考点变式：(1) $k$ 的几何意义：$k = \\frac{y}{x}$ 表示图象上动点与原点连线的斜率（倾斜角正切值）；(2) 陡峭度比较：$|k|$ 越大，直线越陡，越靠近 $y$ 轴；(3) 陷阱：忽视 $k \\neq 0$ 的非零约束导致解方程漏掉参数排除限制。",
        "intrinsic_variation_en": "Slope $k = y/x$. Larger $|k|$ means steeper slope closer to y-axis. Remember the mandatory constraint $k \\neq 0$."
    },

    "KP-033": {
        "origin_story_zh": "在实验中记录了一组数据点，或者已知匀速运动的初始位置与某一时刻的位置，如何确定其背后的运动规律？待定系数法提供了一种通用的代数逆向标定工具：先假设具有一次线性的通用形态，再将已知点坐标作为约束条件代入求解常数。",
        "origin_story_en": "Finding motion formulas from experimental data points uses the method of undetermined coefficients: assume general linear form $y=kx+b$ and substitute known points to fix parameters.",
        "intuitive_essence_zh": "求一次函数解析式的本质是'公理：两点确定一条直线'的代数实现。平面的几何直线自由度为 2，因而只需要两个不重合的点坐标约束，即可唯一确定解析式中的两个独立参数 $k$ 与 $b$。",
        "intuitive_essence_en": "Algebraic embodiment of the Euclidean axiom 'two points determine a line'. Two distinct point constraints uniquely resolve parameters $k$ and $b$.",
        "formal_definition_zh": "待定系数法求一次函数解析式四步法：(1) 设：设一次函数解析式为 $y = kx + b$ ($k \\neq 0$)；(2) 代：将已知两点 $(x_1, y_1), (x_2, y_2)$ 代入解析式建立关于 $k$ 和 $b$ 的二元一次方程组；(3) 解：解该二元一次方程组求出 $k$ 与 $b$ 的值；(4) 写：写出最终的具体函数解析式。",
        "formal_definition_en": "Four steps of undetermined coefficients: 1) Assume $y = kx + b$ ($k \\neq 0$); 2) Substitute two points into a 2x2 linear system; 3) Solve for $k$ and $b$; 4) State the final formula.",
        "intrinsic_variation_zh": "变式题型：(1) 点斜式与截距式几何转化；(2) 动点图象折线分段函数解析式分段求解；(3) 陷阱：若只给出一个条件（如只给斜率或只给一点），解析式必须保留单一参数，并在后续几何图形面积等条件中联立求解，不可臆造第二点。",
        "intrinsic_variation_en": "Piecewise linear formula modeling from dynamic geometry. If only one point is given, keep a single parameter $b$ and solve via secondary geometric conditions."
    },

    "KP-034": {
        "origin_story_zh": "弹簧初始具有原长 $b$，每增加单位重量伸长 $k$，总长呈现 $y = kx + b$ 的线性规律；出租车计价起步价为 $b$，每公里计费 $k$。一次函数是将正比例函数的原点约束解除后，在现实世界最普适的均匀匀速增长模型。",
        "origin_story_en": "Springs with initial length $b$ extending by $k$ per unit weight ($y=kx+b$) exemplify linear growth offset from the origin, modeling uniform rate phenomena.",
        "intuitive_essence_zh": "一次函数的本质是'正比例函数直线的平行刚体平移'。$k$ 控制直线的旋转姿态（增减性与倾斜角），$b$ 控制直线沿 $y$ 轴的上下平移高度（截距）。",
        "intuitive_essence_en": "A linear function is a parallel rigid translation of $y=kx$: $k$ sets the direction/slope, while $b$ governs vertical displacement along the y-axis.",
        "formal_definition_zh": "形如 $y = kx + b$ ($k, b$ 是常数，$k \\neq 0$) 的函数叫做一次函数。图象是一条直线，与 $y$ 轴交点为 $(0, b)$，与 $x$ 轴交点为 $(-\\frac{b}{k}, 0)$。性质：$k > 0$ 增，$k < 0$ 减；$b > 0$ 交正半轴，$b < 0$ 交负半轴；平移规律：$y = k(x-h) + b + v$；平行充要条件：两直线平行 $\\iff k_1 = k_2$ 且 $b_1 \\neq b_2$。",
        "formal_definition_en": "Function $y = kx + b$ ($k \\neq 0$) graphs as a straight line intersecting $(0, b)$ and $(-b/k, 0)$. Slope $k$ dictates monotonicity; parallel lines have $k_1 = k_2$ ($b_1 \\neq b_2$).",
        "intrinsic_variation_zh": "中考核心考点：(1) 图象跨越象限综合判定（如 $k>0, b<0$ 经过第一、三、四象限，不经过第二象限）；(2) 直线与坐标轴围成的直角三角形面积公式：$S = \\frac{1}{2} |x_{\\text{交}}| |y_{\\text{交}}| = \\frac{b^2}{2|k|}$；(3) 垂直线段斜率关系：$k_1 \\cdot k_2 = -1$（拓展高频解题加速神器）。",
        "intrinsic_variation_en": "Quadrant coverage: $k>0, b<0$ covers Q1, Q3, Q4. Triangle area with axes: $S = \\frac{b^2}{2|k|}$. Perpendicular lines have product of slopes $k_1 k_2 = -1$."
    },

    "KP-035": {
        "origin_story_zh": "方程 $kx + b = 0$、不等式 $kx + b > 0$、函数 $y = kx + b$，初学者常误以为是三门孤立的数学知识。笛卡尔建立坐标系后，人们发现：求方程的根就是在数轴上找零点，解不等式就是找图象位于 $x$ 轴上方的区间。函数站在制高点将代数方程与不等式统摄融为一体。",
        "origin_story_en": "Equations $kx+b=0$, inequalities $kx+b>0$, and functions $y=kx+b$ are not isolated. The function provides a panoramic perspective: equations locate x-intercepts, while inequalities select regions above or below the axis.",
        "intuitive_essence_zh": "一次函数与方程不等式的本质是'从一维静态割线向二维动态曲面的降维投影'。函数是一幅完整的高低地形图，方程是水平面的海平面切割线（$y=0$），不等式是高于或低于海平面的整片陆地投影。",
        "intuitive_essence_en": "The function represents continuous terrain; equations denote the shoreline cross-section ($y=0$); inequalities represent land elevation above or below sea level.",
        "formal_definition_zh": "三位一体转化原理：(1) 一元一次方程 $kx + b = 0$ 的解，就是一次函数 $y = kx + b$ 的图象与 $x$ 轴交点的横坐标；(2) 一元一次不等式 $kx + b > 0$ 的解集，就是直线位于 $x$ 轴上方部分所对应的自变量 $x$ 的取值范围；(3) 二元一次方程组的解，就是两对应直线交点坐标 $(x_0, y_0)$。",
        "formal_definition_en": "Unified view: root of $kx+b=0$ is the x-intercept; solution to $kx+b>0$ is the domain interval where the line lies above the x-axis; system solution is the intersection of two lines.",
        "intrinsic_variation_zh": "中考识图压轴：(1) 无需解具体代数式，直接看图读出 $k_1 x + b_1 > k_2 x + b_2$ 的解集（即直线 1 在直线 2 上方时的 $x$ 范围）；(2) 陷阱：从交点看解集时，混淆是看 $x$ 还是看 $y$（自变量取值范围恒看横坐标先后，高低关系对应纵坐标大小）。",
        "intrinsic_variation_en": "Read solutions visually: $f(x) > g(x)$ means line $f$ is higher than line $g$. Always project boundaries onto the horizontal x-axis."
    },

    "KP-036": {
        "origin_story_zh": "物理学中，在压强公式 $p = \\frac{F}{S}$、波义耳气体定律 $PV = C$、杠杆平衡原理 $F_1 L_1 = F_2 L_2$ 中，两个物理量的乘积保持为一个永恒的恒定量。当一个量成倍增大，另一个量必须成比例缩小，由此催生了非线性的反比例双曲线函数模型。",
        "origin_story_en": "Boyle's law $PV=C$, pressure $p=F/S$, and lever balance $F_1 L_1 = F_2 L_2$ involve conserved products. As one factor scales up, the other shrinks inversely, producing the hyperbola.",
        "intuitive_essence_zh": "反比例函数的本质是'乘积不变量的渐近双曲线'。它关于原点呈完美的中心对称（奇函数），坐标轴是它永远无限逼近但永不触及的几何渐近线，$x=0$ 是它天然的非连续撕裂断点。",
        "intuitive_essence_en": "The hyperbola embodies conserved product $xy=k$. It exhibits central origin symmetry, asymptotic approach to axes without intersection, and a natural split at $x=0$.",
        "formal_definition_zh": "形如 $y = \\frac{k}{x}$ ($k$ 是常数，$k \\neq 0$) 的函数叫做反比例函数，亦可等价记为 $xy = k$ 或 $y = kx^{-1}$。自变量 $x \\neq 0$，函数值 $y \\neq 0$。图象是由两支双曲线组成的中心对称图形，对称中心为原点 $(0, 0)$，同时关于直线 $y = \\pm x$ 轴对称。性质：$k > 0$ 时位于第一、三象限，在每个象限内 $y$ 随 $x$ 增大而减小；$k < 0$ 时位于第二、四象限，在每个象限内 $y$ 随 $x$ 增大而增大。",
        "formal_definition_en": "Function $y = k/x$ ($k \\neq 0$, equivalent to $xy=k$) produces a hyperbola symmetric about the origin and lines $y = \\pm x$. If $k > 0$, branches lie in Q1/Q3; if $k < 0$, Q2/Q4. Monotonicity applies separately within each branch.",
        "intrinsic_variation_zh": "语言表述致命陷阱：(1) 增减性描述必须加上'在每个象限内'！若断言'在整个定义域内 $y$ 随 $x$ 增大而减小'则是严重错误的假命题（跨象限存在跃迁）；(2) 双曲线上任意两点斜率与中点对称综合；(3) 陷阱：误以为反比例函数可以与坐标轴相交。",
        "intrinsic_variation_en": "Fatal phrasing error: monotonicity MUST be qualified with 'within each quadrant/branch separately'. Never say decreasing across entire domain due to the origin discontinuity."
    },

    "KP-037": {
        "origin_story_zh": "几何学家在考察双曲线上动点时发现了一个神奇的物理守恒现象：无论动点滑向多么遥远的无限远端，它向两条坐标轴垂直投射所形成的矩形阴影面积，竟然纹丝不动、绝对恒定。这一几何守恒性质成为了中考最核心的解题密钥。",
        "origin_story_en": "Geometric examination of hyperbolic curves revealed invariant projections: as point $P(x,y)$ glides along the curve, the rectangular projection onto the axes maintains a strictly invariant area $|k|$.",
        "intuitive_essence_zh": "反比例函数中 $k$ 的几何意义本质是'矩形面积不变性与三角形面积半衰守恒'。点动面积不动，$S_{\\text{矩形}} = |xy| = |k|$，$S_{\\triangle} = \\frac{1}{2}|xy| = \\frac{1}{2}|k|$。",
        "intuitive_essence_en": "Geometric meaning of $k$: area invariance. Rectangle formed by coordinate projections has area $|k|$; triangle with axes has constant area $\\frac{1}{2}|k|$.",
        "formal_definition_zh": "过双曲线 $y = \\frac{k}{x}$ ($k \\neq 0$) 上任意一点 $P(x, y)$，作 $x$ 轴、$y$ 轴的垂线，垂足分别为 $A, B$，则矩形 $PAOB$ 的面积为：$S_{\\text{矩形}} = OA \\cdot OB = |x| \\cdot |y| = |xy| = |k|$。若连接 $OP$，则 $\\text{Rt}\\triangle POA$ 的面积为：$S_{\\triangle} = \\frac{1}{2} |x| |y| = \\frac{1}{2}|k|$。",
        "formal_definition_en": "For any point $P(x,y)$ on $y=k/x$, projections onto axes form rectangle $PAOB$ with area $S = |x||y| = |k|$, and triangle $POA$ with invariant area $S = \\frac{1}{2}|k|$.",
        "intrinsic_variation_zh": "中考压轴变式：(1) 双曲线与割线三角形面积割补（同底等高转化）；(2) 双曲线两支关于原点对称产生的平行四边形面积为 $2|k|$；(3) 陷阱：根据图形面积求解析式 $k$ 时，漏看象限导致未加负号（如面积为 4 且图象在第二、四象限，则 $k = -4$ 而非 4）。",
        "intrinsic_variation_en": "Area-to-formula trap: if area is 4 but curve lies in Q2/Q4, then $k = -4$, not $+4$. Watch the quadrant sign."
    },

    "KP-038": {
        "origin_story_zh": "抛物线不仅是抛体运动的天然轨迹，更是聚光镜、卫星天线的几何外形。为了适应不同测量场景（已知三点坐标、已知最高点/最低点、已知落地交点），数学家创造了三种代数等价但结构不同的解析式表达形态，形成了灵活的解题矩阵。",
        "origin_story_en": "Parabolic trajectories govern projectiles and satellite dish focuses. To handle various boundary conditions (three points, vertex extrema, ground intercepts), mathematics engineered three equivalent representations.",
        "intuitive_essence_zh": "二次函数三种表达式的本质是'同一种抛物线在不同观测坐标系下的全息投影'。一般式展示代数多项式全貌，顶点式直接暴露几何特征（极值与对称轴），交点式直接暴露因式分解零点。",
        "intuitive_essence_en": "Three equivalent representations of the same parabola: general form shows algebraic coefficients; vertex form highlights spatial extrema; intercept form exposes factorized roots.",
        "formal_definition_zh": "二次函数三种形式：(1) 一般式：$y = ax^2 + bx + c$ ($a \\neq 0$)；(2) 顶点式：$y = a(x - h)^2 + k$ ($a \\neq 0$)，其中顶点坐标为 $(h, k)$，对称轴为直线 $x = h$；(3) 交点式：$y = a(x - x_1)(x - x_2)$ ($a \\neq 0$)，其中 $(x_1, 0), (x_2, 0)$ 为抛物线与 $x$ 轴的交点（仅在 $\\Delta \\geq 0$ 时存在）。三种形式可通过配方与展开互相自由转化。",
        "formal_definition_en": "1) General form: $y = ax^2 + bx + c$; 2) Vertex form: $y = a(x-h)^2 + k$ with vertex $(h,k)$; 3) Intercept form: $y = a(x-x_1)(x-x_2)$ showing x-intercepts. All interconvert via completing the square.",
        "intrinsic_variation_zh": "选式策略与变式：(1) 知任意三点设一般式；知顶点、最值或对称轴设顶点式；知与 $x$ 轴两交点设交点式；(2) 陷阱：顶点式中的负号陷阱：$y = 2(x+3)^2 - 1$ 的顶点横坐标是 $-3$ 而不是 $3$；交点式不可用于与 $x$ 轴无交点的抛物线。",
        "intrinsic_variation_en": "Optimal form selection: use vertex form when axis/peak is known; intercept form when x-zeros are known. Trap: $y=a(x+3)^2+k$ has vertex at $h=-3$."
    },

    "KP-039": {
        "origin_story_zh": "拱桥之所以具有极高的力学抗压性能，源于其拱轴的严格轴对称性；投篮投掷路线的最高点决定了能否空心入网。对称轴与顶点是抛物线几何灵魂的所在，控制着整个曲线的平衡中心与极值临界点。",
        "origin_story_en": "Arch bridges withstand pressure through symmetry; basketball arcs peak at their vertices. Axis of symmetry and apex vertex form the geometric backbone governing balance and extrema.",
        "intuitive_essence_zh": "对称轴与顶点的本质是'抛物线能量汇聚的极值奇点与镜面对称基准'。所有等高点（$y_1 = y_2$）关于对称轴对称，其横坐标中点恒等于对称轴横坐标：$h = \\frac{x_1 + x_2}{2} = -\\frac{b}{2a}$。",
        "intuitive_essence_en": "The axis of symmetry is the mirror line where equal heights $y_1=y_2$ average out: $h = \\frac{x_1+x_2}{2} = -\\frac{b}{2a}$. The vertex is the unique peak or valley.",
        "formal_definition_zh": "对于一般式 $y = ax^2 + bx + c$ ($a \\neq 0$)：(1) 对称轴方程：直线 $x = -\\frac{b}{2a}$；(2) 顶点坐标：$(-\\frac{b}{2a}, \\frac{4ac - b^2}{4a})$；(3) 开口方向由 $a$ 决定：$a > 0$ 开口向上，顶点为最低点；$a < 0$ 开口向下，顶点为最高点；(4) 平移规律（左加右减，上加下减）：$y = a(x-h)^2 + k$ 是由 $y = ax^2$ 向右平移 $h$、向上平移 $k$ 得到。",
        "formal_definition_en": "For $y=ax^2+bx+c$: axis of symmetry is line $x = -\\frac{b}{2a}$; vertex is $(-\\frac{b}{2a}, \\frac{4ac-b^2}{4a})$. $a>0$ opens up (minimum); $a<0$ opens down (maximum).",
        "intrinsic_variation_zh": "中考核心变式与解题技巧：(1) 中点对称快速定轴：若抛物线经过 $(1, 2)$ 和 $(5, 2)$，无需代入解析式，直接得出对称轴 $x = \\frac{1+5}{2} = 3$；(2) 离对称轴越远，纵坐标越大/越小判别；(3) 陷阱：对称轴是一条直线，必须写成方程 $x = -\\frac{b}{2a}$，绝不可写成一个数值 $-b/(2a)$。",
        "intrinsic_variation_en": "Quick midpoint axis determination: points with equal heights share midpoint on the axis $x = (x_1+x_2)/2$. Axis MUST be written as a line equation $x = h$."
    },

    "KP-040": {
        "origin_story_zh": "炮弹何时落地？喷泉水流落入水池的射程多远？解决这类实际问题需要探寻抛物线与地平线（$x$ 轴）的接触状态。二次函数图象与 $x$ 轴的交点位置与交点个数，正是其对应一元二次方程根的几何全息呈现。",
        "origin_story_en": "When does an artillery shell land? Determining ground intercepts connects quadratic curves with quadratic root solving, mapping algebraic solutions to spatial impacts.",
        "intuitive_essence_zh": "图象与 $x$ 轴交点的本质是'函数向水平零位平面的穿透投影'。穿透两点对应两个不等实根，相切相吻对应二重重根，悬空脱离对应实数无解。",
        "intuitive_essence_en": "Intersections represent horizontal penetration: two crossings mean two distinct real roots; tangent contact denotes double roots; floating above/below means no real roots.",
        "formal_definition_zh": "二次函数 $y = ax^2 + bx + c$ 与 $x$ 轴交点情况由判别式 $\\Delta = b^2 - 4ac$ 唯一确定：(1) $\\Delta > 0 \\iff$ 抛物线与 $x$ 轴相交于两个不同的点 $A(x_1, 0), B(x_2, 0)$，线段长 $AB = |x_1 - x_2| = \\frac{\\sqrt{\\Delta}}{|a|}$；(2) $\\Delta = 0 \\iff$ 抛物线与 $x$ 轴相切于唯一点 $(-\\frac{b}{2a}, 0)$；(3) $\\Delta < 0 \\iff$ 抛物线与 $x$ 轴没有交点。",
        "formal_definition_en": "Intersections with x-axis dictated by $\\Delta = b^2 - 4ac$: $\\Delta > 0$ yields two points with distance $|x_1 - x_2| = \\frac{\\sqrt{\\Delta}}{|a|}$; $\\Delta = 0$ is tangent; $\\Delta < 0$ has zero intersections.",
        "intrinsic_variation_zh": "中考压轴模型：(1) 割线线段长公式 $AB = \\frac{\\sqrt{b^2-4ac}}{|a|}$ 快速算三角形底边；(2) 图象符号综合判断题：由开口定 $a$ 符号，由与 $y$ 轴交点定 $c$ 符号，由对称轴定 $b$ 符号（'左同右异'），由交点个数定 $b^2-4ac$ 符号，由特定点 $x=1, x=-1$ 定 $a+b+c, a-b+c$ 符号。",
        "intrinsic_variation_en": "Coefficient signage decoding: $a$ from opening, $c$ from y-intercept, $b$ from symmetry axis ('left same, right opposite'), and special points $(x=\\pm 1)$ for compound sums $a \\pm b + c$."
    },

    "KP-041": {
        "origin_story_zh": "企业如何定价才能获得最大利润？栅栏如何围拢才能获得最大种植面积？经典微积分诞生前，初等数学利用抛物线顶点最高/最低的几何性质，成功解决了大量单变量二次最优化极限问题，这是人类追求效率极致的数学显现。",
        "origin_story_en": "Optimizing maximum commercial profit or livestock fenced area spurred extreme value analysis. Parabolas provided the earliest analytical tools for quadratic optimization.",
        "intuitive_essence_zh": "二次函数最值的本质是'抛物线顶点极值在有限区间边界上的截断投影'。若自变量不受限，顶点即全局最值；若受限在区间 $[m, n]$ 内，最值由'顶点是否在区间内'及'两端点离对称轴的远近'共同竞争裁决。",
        "intuitive_essence_en": "Extrema on a closed interval $[m,n]$ depend on whether the vertex falls inside the interval, and the relative distance from interval endpoints to the axis of symmetry.",
        "formal_definition_zh": "最值法则：(1) 自由区间：当 $a > 0$ 时，在 $x = -\\frac{b}{2a}$ 处取得最小值 $\\frac{4ac - b^2}{4a}$，无最大值；当 $a < 0$ 时，在 $x = -\\frac{b}{2a}$ 处取得最大值 $\\frac{4ac - b^2}{4a}$，无最小值。(2) 闭区间 $[m, n]$ 最值：先判断对称轴 $x = h$ 与区间位置关系：若 $h \\in [m, n]$，顶点必为极值点之一；另一最值在离对称轴较远的端点处取得；若 $h \\notin [m, n]$，函数单调，最值必在两端点 $m$ 与 $n$ 处取得。",
        "formal_definition_en": "Global: $a>0$ has minimum at vertex; $a<0$ has maximum. On closed interval $[m,n]$, test if vertex $h \\in [m,n]$. If included, vertex is an extremum; otherwise evaluate boundary endpoints $m$ and $n$.",
        "intrinsic_variation_zh": "中考压轴综合：(1) 动区间定对称轴、定区间动对称轴的分类讨论最值；(2) 几何图形面积最值：'铅垂高水平宽'法计算割线三角形面积最大值 $S = \\frac{1}{2} d \\cdot h$；(3) 致命陷阱：实际问题中（如售价范围、库存限制）忘记自变量 $x$ 的整数约束与物理取值范围，导致取到不可达的虚假极值。",
        "intrinsic_variation_en": "Dynamic interval extrema analysis. For triangle area optimization along secants, use vertical plumb height times horizontal width: $S = \\frac{1}{2} d \\cdot h$. Check realistic domain constraints."
    },

    "KP-042": {
        "origin_story_zh": "如何从宏观图景把握二次方程根的分布、以及二次不等式 $ax^2 + bx + c > 0$ 的完整解集？如果单纯用代数代入，繁琐且极易出错。把抛物线画在坐标系中，方程的根是曲线与地面的交点，不等式的解集是曲线浮出地表或潜入水下的整片区域，数形融合使复杂逻辑一目了然。",
        "origin_story_en": "Understanding quadratic inequalities $ax^2+bx+c>0$ requires visual synthesis. The parabola maps positive regions above the ground and negative regions submerged below, unifying equations and inequalities visually.",
        "intuitive_essence_zh": "函数与方程不等式关系的本质是'以函数图象为立体全景地图，对不等条件进行几何切片'。不等号大于零即截取图象位于 $x$ 轴上方部分，投射到横坐标就是解区间。",
        "intuitive_essence_en": "The function serves as a panoramic map: $f(x) > 0$ clips parts above the x-axis, whose shadows on the horizontal axis constitute the exact solution intervals.",
        "formal_definition_zh": "设二次函数 $y = ax^2 + bx + c$ 开口向上 ($a > 0$) 且与 $x$ 轴交于两点 $x_1 < x_2$：(1) 方程 $ax^2 + bx + c = 0$ 的解为 $x = x_1$ 或 $x = x_2$；(2) 不等式 $ax^2 + bx + c > 0$ 的解集为图象位于 $x$ 轴上方部分，即'大于大的，小于小的'：$x < x_1$ 或 $x > x_2$；(3) 不等式 $ax^2 + bx + c < 0$ 的解集为图象位于 $x$ 轴下方部分，即'夹在中间'：$x_1 < x < x_2$。",
        "formal_definition_en": "For $a > 0$ with zeros $x_1 < x_2$: $ax^2+bx+c=0 \\implies x=x_1, x_2$. Inequality $f(x)>0$ yields exterior intervals $x < x_1 \\lor x > x_2$; $f(x)<0$ yields interior interval $x_1 < x < x_2$.",
        "intrinsic_variation_zh": "中考变式：(1) 二次函数与一次函数大小关系：求 $ax^2 + bx + c > kx + d$ 的解集，通过找两图象交点，看抛物线在直线直观上方时 $x$ 的范围；(2) 恒成立问题：若对任意实数 $x$ 恒有 $ax^2 + bx + c > 0$，则必须满足 $a > 0$ 且 $\\Delta < 0$；(3) 陷阱：开口方向 $a < 0$ 时不等号未反向处理。",
        "intrinsic_variation_en": "Intersection region comparison between parabola and line. Invariant positivity for all $x \\in \\mathbb{R}$ requires $a > 0$ and $\\Delta < 0$ simultaneously."
    },

    "KP-043": {
        "origin_story_zh": "人类学习数学的终极目的不是做象牙塔里的符号游戏，而是解决现实世界中的复杂决策问题。从利润最大化的商业定价，到桥梁拱度力学设计，从喷灌喷头射程覆盖，到智能调配调度，函数建模是将混乱模糊的现实问题提炼为严谨数学方程的通天阶梯。",
        "origin_story_en": "Mathematics serves real-world optimization. From pricing strategies to arch bridge mechanics and irrigation coverage, modeling translates ambiguous physical realities into deterministic mathematical functions.",
        "intuitive_essence_zh": "函数实际应用的本质是'物理现实生活语义向数学抽象关系的编码与解码'。审题编码提炼自变量与目标因变量，借助几何或代数定理列出函数方程，利用数学工具求得极值，最后解码回归现实检验可行性。",
        "intuitive_essence_en": "Modeling encodes reality into mathematical symbols, solves via analytical tools (like extrema at vertices), and decodes answers back into practical, bounded decisions.",
        "formal_definition_zh": "数学建模五步闭环：(1) 审题审元：明确现实背景中的常量、自变量与因变量，设定字母；(2) 建立模型：依据基本等量关系（如利润 = (单价 - 成本) × 销售量，面积公式，行程公式）列出函数解析式；(3) 确定边界：结合现实物理背景严格求解自变量定义域（如进价 $\\leq$ 售价 $\\leq$ 承受上限，数量必须为正整数）；(4) 求解最值：利用配方法顶点式或单调性在定义域内求最优解；(5) 验证作答：检验结果是否符合现实常理并给出明确结论。",
        "formal_definition_en": "5-step modeling pipeline: define variables, construct functional equations from business/physical relations, identify strict domain bounds, optimize extrema on the domain, and verify practical validity.",
        "intrinsic_variation_zh": "中考压轴大题模型：(1) 销售利润与降价促销反比例模型：每降价 1 元多卖 $n$ 件；(2) 运动场隧道等抛物线型建筑物净空高度与车辆通行极限检验；(3) 致命陷阱：忽视自变量的现实离散约束（如产品件数必须取整数，当抛物线顶点横坐标为小数 $22.5$ 时，必须对比 $x=22$ 和 $x=23$ 的两端取值，绝不可直接填写非整数）。",
        "intrinsic_variation_en": "Commercial profit pricing with sales volume elasticity. Crucial discrete trap: if optimal vertex occurs at fractional items like $22.5$, check adjacent integers 22 and 23 for maximum discrete yield."
    }
}
