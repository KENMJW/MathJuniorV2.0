#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build/fill_master_examples_en.py
为 master_examples 表回填 119 道母题的四维精讲英文内容 (TASK-I18N-0003)

涵盖：
1. 107 道考点母题 (ME-KP001 ~ ME-KP107) 的 dim1_origin_en, dim2_essence_en, dim4_traps_en
2. 12 道主线母题 (ME-LINE-A1 ~ ME-LINE-P1) 的 dim1_origin_en, dim2_essence_en, dim4_traps_en
3. 全部 25 种不同严谨推导题解的 dim3_rigor_en (100% 字节级公式保真)
4. 多库同步: data/master.db, public/data/master.db, dist/data/master.db
"""

import os
import sys
import sqlite3
import re

sys.path.insert(0, os.path.abspath("."))

# 导入考点数据源
from scripts.build.content.kp_algebra import KP_ALGEBRA
from scripts.build.content.kp_geometry import KP_GEOMETRY
from scripts.build.content.kp_statistics import KP_STATISTICS

ALL_KPS = {**KP_ALGEBRA, **KP_GEOMETRY, **KP_STATISTICS}

# 25 组严谨推导 (dim3_rigor) 权威英文对应字典
RIGOR_TRANSLATIONS = {
    "因为 $-2 < a < -1$，所以 $a < 0$ 且 $a + 1 < 0$。由绝对值与二次根式性质得：$|a| = -a$":
        "Because $-2 < a < -1$, we have $a < 0$ and $a + 1 < 0$. By properties of absolute values and radicals: $|a| = -a$ and $\\sqrt{(a+1)^2} = -(a+1)$. Substituting into the original equation yields: $-a - (a+1) = 2 \\implies -2a - 1 = 2 \\implies -2a = 3 \\implies a = -\\frac{3}{2} = -1.5$. Verification confirms this satisfies $-2 < a < -1$.",

    "完全平方式标准形式为 $(x \\pm 3y)^2 = x^2 \\pm 6xy + 9y^2$":
        "The standard form of a perfect square trinomial is $(x \\pm 3y)^2 = x^2 \\pm 6xy + 9y^2$. Comparing coefficients of corresponding terms yields: $kxy = \\pm 6xy$, so $k = \\pm 6$. Note that the middle term can be positive or negative, so neither solution should be omitted.",

    "去分母得整式方程：$2x + a = 3(x - 1) \\implies 2x + a = 3x - 3 \\implies x = a + 3$":
        "Clearing the denominator yields the polynomial equation: $2x + a = 3(x - 1) \\implies 2x + a = 3x - 3 \\implies x = a + 3$. If the original rational equation has an extraneous root, the least common denominator must be zero: $x - 1 = 0 \\implies x = 1$. Substituting the extraneous root $x = 1$ into the polynomial equation gives: $1 = a + 3 \\implies a = -2$.",

    "第一步判别式校验：$\\Delta = [-(2m-1)]^2 - 4(m^2-1) = 4m^2 - 4m + 1 - 4m^2 + 4":
        "Step 1 (Discriminant check): $\\Delta = [-(2m-1)]^2 - 4(m^2-1) = 4m^2 - 4m + 1 - 4m^2 + 4 = -4m + 5 > 0 \\implies m < \\frac{5}{4}$. Step 2 (Vieta's formulas): $x_1 + x_2 = 2m - 1$, $x_1 x_2 = m^2 - 1$. From the given condition: $2m - 1 = m^2 - 1 \\implies m^2 - 2m = 0 \\implies m(m-2) = 0$, giving $m_1 = 0, m_2 = 2$. Combining with $m < \\frac{5}{4}$, we discard $m = 2$, leaving $m = 0$.",

    "二次函数图象关于对称轴对称。设另一个交点为 $B(x_2, 0)$":
        "The graph of a quadratic function is symmetric with respect to its axis of symmetry. Let the other intersection point be $B(x_2, 0)$. By symmetry, the abscissas satisfy the midpoint formula: $\\frac{-1 + x_2}{2} = 1 \\implies -1 + x_2 = 2 \\implies x_2 = 3$. Therefore, the coordinates of the other intersection point are $(3, 0)$.",

    "过直角顶点作辅助线平行于 $l_1$，由平行线性质得内错角相等":
        "Draw an auxiliary line through the right-angle vertex parallel to $l_1$. By the properties of parallel lines, alternate interior angles are equal and complementary: $\\angle 2 = 90^\\circ - \\angle 1 = 90^\\circ - 35^\\circ = 55^\\circ$.",

    "根据勾股定理求斜边长：$AB = \\sqrt{AC^2 + BC^2} = \\sqrt{6^2 + 8^2} = \\sqrt{100} = 10$。依据直角三角形斜边中线定理":
        "By the Pythagorean theorem, the hypotenuse is: $AB = \\sqrt{AC^2 + BC^2} = \\sqrt{6^2 + 8^2} = \\sqrt{100} = 10$. According to the median to hypotenuse theorem: the median on the hypotenuse of a right triangle equals half the hypotenuse, giving $CD = \\frac{1}{2} AB = \\frac{1}{2} \\times 10 = 5$.",

    "菱形对角线互相垂直平分。设对角线交于点 $O$":
        "The diagonals of a rhombus are perpendicular bisectors of each other. Let the diagonals intersect at point $O$, then $OA = \\frac{1}{2} AC = 3$, $OB = \\frac{1}{2} BD = 4$, and $\\angle AOB = 90^\\circ$. In $\\text{Rt}\\triangle AOB$, by the Pythagorean theorem, the side length is $AB = \\sqrt{3^2 + 4^2} = 5$. Since all four sides of a rhombus are equal, the perimeter is $C = 4 \\times 5 = 20$.",

    "根据垂径定理，$OC \\perp AB \\implies AC = BC = \\frac{1}{2} AB = 4$":
        "According to the perpendicular chord theorem, $OC \\perp AB \\implies AC = BC = \\frac{1}{2} AB = 4$. Connect $OA$. In $\\text{Rt}\\triangle OAC$, $OA = 5$ and $AC = 4$. By the Pythagorean theorem: $OC = \\sqrt{OA^2 - AC^2} = \\sqrt{5^2 - 4^2} = 3$.",

    "平面直角坐标系中，点 $(x, y)$ 关于原点对称的点的坐标为 $(-x, -y)$":
        "In a rectangular coordinate system, the point symmetric to $(x, y)$ with respect to the origin is $(-x, -y)$. For point $P(-2, 3)$, the x-coordinate becomes $-(-2) = 2$ and the y-coordinate becomes $-3$, so the coordinates of the symmetric point are $(2, -3)$.",

    "首先由勾股定理求得斜边 $AB = \\sqrt{AC^2 + BC^2} = \\sqrt{4^2 + 3^2} = 5$。根据余弦函数定义":
        "First, by the Pythagorean theorem, the hypotenuse is $AB = \\sqrt{AC^2 + BC^2} = \\sqrt{4^2 + 3^2} = 5$. By definition of cosine, $\\cos A = \\frac{\\text{adjacent}}{\\text{hypotenuse}} = \\frac{AC}{AB} = \\frac{4}{5}$.",

    "数据已按升序排列：$3, 4, 4, 5, 6, 8$，数据个数 $n = 6$":
        "The data are ordered in ascending order: $3, 4, 4, 5, 6, 8$, with sample size $n = 6$. The median is the average of the two middle numbers: $\\frac{4 + 5}{2} = 4.5$. The number $4$ has the highest frequency (appears twice), so the mode is $4$.",

    "球的总个数为 $2 + 3 = 5$。每个球被摸到的概率均等":
        "The total number of balls is $2 + 3 = 5$. Each ball has an equal probability of being drawn (classical probability model). There are $2$ red balls, so by the probability formula: $P(\\text{red ball}) = \\frac{\\text{number of red balls}}{\\text{total balls}} = \\frac{2}{5}$.",

    "由非负数性质，两个非负数之和为零则各自为零：$|x - 2| = 0 \\implies x = 2$":
        "By the properties of non-negative numbers, the sum of two non-negative terms equals zero if and only if each term is zero: $|x - 2| = 0 \\implies x = 2$, and $\\sqrt{y + 3} = 0 \\implies y = -3$. The objective expression $|t - 2| + |t - (-3)| = |t - 2| + |t + 3|$ represents the sum of geometric distances from moving point $t$ to points $2$ and $-3$ on the number line. By the triangle inequality: $|t - 2| + |t + 3| \\geq |(2) - (-3)| = 5$. Equality holds if and only if $t$ lies between the two points, i.e., $-3 \\leq t \\leq 2$, giving a minimum value of $5$.",

    "由 $(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca) = 0$":
        "From $(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca) = 0$, substituting $a^2 + b^2 + c^2 = 6$ yields: $6 + 2(ab + bc + ca) = 0 \\implies ab + bc + ca = -3$. Next, squaring the quadratic sum gives: $(a^2 + b^2 + c^2)^2 = a^4 + b^4 + c^4 + 2(a^2b^2 + b^2c^2 + c^2a^2) = 6^2 = 36$. Also, $(ab + bc + ca)^2 = a^2b^2 + b^2c^2 + c^2a^2 + 2abc(a + b + c) = (-3)^2 = 9$. Since $a + b + c = 0$, the last term vanishes, so $a^2b^2 + b^2c^2 + c^2a^2 = 9$. Substituting back yields: $a^4 + b^4 + c^4 = 36 - 2(9) = 18$.",

    "第一步：二次项系数 $k - 1 \\neq 0 \\implies k \\neq 1$。判别式 $\\Delta = (-2k)^2":
        "Step 1: The leading coefficient $k - 1 \\neq 0 \\implies k \\neq 1$. The discriminant is $\\Delta = (-2k)^2 - 4(k-1)(k+2) = 4k^2 - 4(k^2 + k - 2) = -4k + 8 > 0 \\implies k < 2$. Step 2: By Vieta's formulas, $x_1 + x_2 = \\frac{2k}{k-1}$ and $x_1 x_2 = \\frac{k+2}{k-1} \\neq 0 \\implies k \\neq -2$. Step 3: Substituting into the condition gives $\\frac{x_1 + x_2}{x_1 x_2} = \\frac{2k}{k+2} = 3 \\implies 2k = 3(k+2) \\implies 2k = 3k + 6 \\implies k = -6$. Verification: $k = -6 < 2$ and $k \\neq 1, -2$, satisfying all necessary and sufficient constraints.",

    "由抛物线表达式知 $C(0, 3)$。设直线 $BC$ 解析式为 $y = kx + b$":
        "From the parabolic equation, $C(0, 3)$. Let the equation of line $BC$ be $y = kx + b$. Substituting $B(3, 0), C(0, 3)$ yields $b = 3$, $3k + 3 = 0 \\implies k = -1$, so line $BC: y = -x + 3$. Let point $P(t, -t^2 + 2t + 3)$, where $0 < t < 3$. Since $PD // y$-axis, point $D$ also has abscissa $t$ and ordinate $y_D = -t + 3$. The vertical distance of segment $PD$ is $h(t) = y_P - y_D = (-t^2 + 2t + 3) - (-t + 3) = -t^2 + 3t = -(t - \\frac{3}{2})^2 + \\frac{9}{4}$. Since $a = -1 < 0$, the parabola opens downward, reaching a maximum vertical height of $\\frac{9}{4}$ at $t = \\frac{3}{2}$. The coordinates of point $P$ are then $(\\frac{3}{2}, \\frac{15}{4})$.",

    "过点 $E$ 作辅助线 $EF // AB$。因为 $AB // CD$":
        "Draw an auxiliary line $EF // AB$ through point $E$. Since $AB // CD$, it follows that $EF // CD$. By the properties of parallel lines, alternate interior angles are equal. In $EF // AB$, $\\angle PEF = \\angle APE = \\alpha$; in $EF // CD$, $\\angle QEF = \\angle CQE = \\beta$. Because $\\angle PEQ = \\angle PEF + \\angle QEF$, we obtain $\\theta = \\alpha + \\beta$. This is the core invariant relation for parallel lines with folded angles.",

    "因为 $AB = AC$ 且 $D$ 是 $BC$ 中点，根据等腰三角形三线合一定理":
        "Since $AB = AC$ and $D$ is the midpoint of $BC$, by the isosceles triangle three-in-one theorem, $AD \\perp BC$ and $AD$ bisects $\\angle BAC$. Using $A$ as an origin, double the median or construct angle bisector symmetric congruent triangles. Let $\\angle C = \\alpha$. Through rotation and piece-wise construction $\\triangle ABE \\cong \\triangle ACE$, applying the exterior angle theorem step by step establishes that $\\angle AFB = 3\\alpha = 3\\angle C$.",

    "旋转构造法（半角模型核心）：将 $\\triangle ABE$ 绕点 $A$ 顺时针旋转 $90^\\circ$ 得到 $\\triangle ADG$":
        "Rotation construction method (half-angle model core): Rotate $\\triangle ABE$ clockwise by $90^\\circ$ around point $A$ to obtain $\\triangle ADG$. By rotation properties: $AG = AE$, $DG = BE$, $\\angle DAG = \\angle BAE$, and $\\angle ADG = \\angle B = 90^\\circ$. Since quadrilateral $ABCD$ is a square and $\\angle ADC = 90^\\circ$, points $G, D, F$ are collinear with $GF = DG + DF = BE + DF$. Given $\\angle EAF = 45^\\circ$, we have $\\angle BAE + \\angle DAF = 45^\\circ$, so $\\angle GAF = \\angle DAG + \\angle DAF = 45^\\circ = \\angle EAF$. In $\\triangle GAF$ and $\\triangle EAF$: $AG = AE$, $\\angle GAF = \\angle EAF$, and $AF = AF$ (common side), so $\\triangle GAF \\cong \\triangle EAF$ (SAS). Thus $EF = GF = BE + DF$.",

    "由勾股定理知直径 $AB = \\sqrt{6^2 + 8^2} = 10$，半径 $R = 5$":
        "By the Pythagorean theorem, diameter $AB = \\sqrt{6^2 + 8^2} = 10$, and radius $R = 5$. The area of quadrilateral $PACB$ decomposes into $S = S_{\\triangle ABC} + S_{\\triangle PAB}$, where $S_{\\triangle ABC} = \\frac{1}{2} \\times 6 \\times 8 = 24$ is constant. To maximize the quadrilateral area, we only need to maximize the area of $\\triangle PAB$. With diameter $AB$ as base, the area is maximized when the vertical height from moving point $P$ to chord $AB$ reaches its maximum, which equals the radius $R = 5$ (when $P$ is the midpoint of arc $AB$). Hence $S_{\\triangle PAB \\max} = \\frac{1}{2} \\times AB \\times R = \\frac{1}{2} \\times 10 \\times 5 = 25$. The maximum area of the quadrilateral is $24 + 25 = 49$.",

    "定角对定弦隐圆轨迹法：因为线段 $AB$ 为定长，且 $\\angle APB = 120^\\circ$ 为定值":
        "Hidden circle locus method for constant angle subtending a constant chord: Because segment $AB$ has fixed length and $\\angle APB = 120^\\circ$ is constant, the locus of moving point $P$ is an arc of a hidden circle with $AB$ as chord. By circle geometry, when points $C, P$, and the center of the hidden circle are collinear, segment $CP$ achieves its geometric extremum. Using an equilateral triangle rotational transformation (Fermat point construction), the minimum value is obtained.",

    "过点 $A$ 作东西方向与南北方向的直角坐标系，过 $A$ 作 $AD \\perp BC$ 于点 $D$":
        "Construct a rectangular coordinate system oriented East-West and North-South through point $A$. Draw $AD \\perp BC$ at point $D$. In $\\text{Rt}\\triangle ABD$, $\\angle DAB = 30^\\circ$, $AB = 10\\sqrt{3}$. The shortest distance is the perpendicular segment $AD = AB \\cdot \\cos 30^\\circ = 10\\sqrt{3} \\times \\frac{\\sqrt{3}}{2} = 15$ nautical miles. Also, $BD = AB \\cdot \\sin 30^\\circ = 10\\sqrt{3} \\times \\frac{1}{2} = 5\\sqrt{3}$. In $\\text{Rt}\\triangle ACD$, $\\angle CAD = 90^\\circ - 60^\\circ = 30^\\circ$, so $CD = AD \\cdot \\tan 30^\\circ = 15 \\times \\frac{\\sqrt{3}}{3} = 5\\sqrt{3}$. Therefore, the sailing distance is $BC = BD + CD = 5\\sqrt{3} + 5\\sqrt{3} = 10\\sqrt{3}$ nautical miles.",

    "第一步集中趋势分析：甲、乙两班的平均成绩均为 112 分":
        "Step 1 (Central tendency analysis): The average score of both Class A and Class B is 112 points, indicating equivalent overall performance. Step 2 (Dispersion analysis): Variance reflects the degree of dispersion and fluctuation. Because $S_A^2 = 12.5 > S_B^2 = 4.8$, the dispersion in Class B is much smaller than in Class A; Class B's performance is more stable with less polarization, whereas Class A exhibits greater volatility between high achievers and struggling students. Step 3 (Rational decision-making): Class B should focus on advanced extension, while Class A should strengthen tiered instruction to support foundational students and stabilize the core.",

    "第一步画出所有等可能样本空间（列表法）：共有 $6 \\times 6 = 36$ 种等可能结果":
        "Step 1 (Sample space enumeration via grid table): There are $6 \\times 6 = 36$ equally likely outcomes. Step 2 (Parity case analysis): If the first roll is odd (3 outcomes), the second roll must be odd (3 outcomes) for an even sum ($3 \\times 3 = 9$ outcomes); if the first roll is even (3 outcomes), the second must be even ($3 \\times 3 = 9$ outcomes). Thus, there are $9 + 9 = 18$ even sum outcomes. Step 3 (Probability calculation): $P(\\text{Player A wins}) = \\frac{18}{36} = \\frac{1}{2}$; likewise, odd sums have $36 - 18 = 18$ outcomes, so $P(\\text{Player B wins}) = \\frac{18}{36} = \\frac{1}{2}$. Since $P(\\text{Player A wins}) = P(\\text{Player B wins}) = 0.5$, the game rules are perfectly fair."
}

# 12 组主线母题专属英文四维解析
LINE_MASTERS_EN = {
    "ME-LINE-A1": {
        "dim1_origin_en": "This problem originates from the fundamental construction of the real number continuum and geometric absolute distance on the number axis. The intent is to test whether students can transcend mere arithmetic calculation, utilizing number line reflection symmetry and the non-negative geometric properties of absolute values to reduce algebraic piecewise extrema to the shortest polygonal path between points.",
        "dim2_essence_en": "Core equivalence and intuitive essence: The geometric meaning of $|x - a|$ is the Euclidean distance from moving point $x$ to fixed point $a$ on the number axis. The physical essence of the multi-absolute-value sum $|x - a| + |x - b|$ is the shortest path along a broken line, which attains an absolute geometric minimum within the interior of the fixed-point interval.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Failing to partition the real line into zero-point intervals when removing absolute values, resulting in omitted sign changes in negative regions; (2) Mistakenly assuming extrema must occur only at boundary endpoints, ignoring that an even number of absolute values yields an entire plateau of minimum values across the median interval; (3) Transfer model: moving point kinematics on the line and continuous solution intervals of equations like $|x-1| + |x-5| = 4$."
    },
    "ME-LINE-A2": {
        "dim1_origin_en": "This problem is rooted in the structural isomorphism of algebraic polynomials and the inverse deconstruction of factoring. By constructing high-degree or symmetric polynomials, the question assesses students' ability to recognize hidden geometric square completion or difference-of-squares structures, preventing algebraic chaos caused by blind expansion.",
        "dim2_essence_en": "Core equivalence and intuitive essence: Holistic substitution and quadratic completion. Expanding polynomials corresponds to partitioning geometric area, while factoring represents reassembling area into clean rectangles. By introducing cross terms $2ab$, unstructured higher-degree terms are locked into non-negative sums of squares.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Dropping the constant $1$ after factoring out common factors; (2) Incomplete factoring, stopping at $(x^2+4)(x^2-4)$ for $x^4-16$; (3) Transfer model: evaluating higher-degree expressions $x^4 + 1/x^4$ given $x + 1/x = c$ through iterative algebraic recurrence."
    },
    "ME-LINE-A3": {
        "dim1_origin_en": "This problem stems from the well-posedness analysis of solutions under equality and inequality constraints. It intertwines quadratic discriminants, Vieta's formulas, and parameter inequalities, testing students' rigorous thinking in maintaining logical equivalence under multiple constraints.",
        "dim2_essence_en": "Core equivalence and intuitive essence: The symmetric mapping between quadratic roots and coefficients. Vieta's formulas $x_1+x_2 = -b/a, x_1 x_2 = c/a$ represent roots in the polynomial expansion, while discriminant $\\Delta \\geq 0$ serves as the probe for whether the parabola intersects the zero datum line.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Applying Vieta's formulas blindly without checking $\\Delta = b^2 - 4ac \\geq 0$, leading to false complex roots; (2) Forgetting to analyze $a = 0$ versus $a \\neq 0$ when not explicitly declared as a quadratic equation; (3) Transfer model: right triangle legs as roots of a quadratic equation coupled with the Pythagorean theorem."
    },
    "ME-LINE-A4": {
        "dim1_origin_en": "A hallmark problem of secondary school examinations. It originates from maximizing secant triangle areas formed by parabolic cuts. It synthesizes quadratic functions, axis of symmetry properties, and geometric area decomposition, assessing students' higher-order ability in linking algebra and geometry.",
        "dim2_essence_en": "Core equivalence and intuitive essence: The vertical height and horizontal width decomposition method. The area $S = \\frac{1}{2} d \\cdot h$ features a constant horizontal base width $d = x_B - x_A$, while the vertical height $h = y_{\\text{parabola}} - y_{\\text{line}}$ forms a standard quadratic function of $t$, attaining its global maximum at the parabolic vertex.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Inverting the vertical height expression (subtracting parabola from secant, yielding negative heights); (2) Neglecting boundary constraints for moving point $t$ ($x_A < t < x_B$); (3) Transfer model: existence of right triangles formed by dynamic points on curves."
    },
    "ME-LINE-G1": {
        "dim1_origin_en": "Derived from Euclid's parallel postulate and angular momentum transfer across folded lines. By embedding dynamic folded lines between parallel lines, it examines students' deductive ability to introduce auxiliary lines to resolve geometric corners into fundamental parallel angle relations.",
        "dim2_essence_en": "Core equivalence and intuitive essence: The rigid translational invariance of geometric directions. Drawing auxiliary lines parallel to base references through each corner uses alternate interior and consecutive interior angles to relay dispersed angles into a single local equilibrium.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Over-constraining auxiliary lines (e.g. attempting to draw a line both parallel to $l_1$ and perpendicular to $l_2$); (2) Omitting case analyses during continuous rotation across quadrants; (3) Transfer model: multi-bounce angular ray propagation between parallel reflective surfaces."
    },
    "ME-LINE-G2": {
        "dim1_origin_en": "Based on the metric closure of rigid congruence and scaled similarity. By constructing rotations, midpoints, or angle bisectors, it tests students' ability to recognize and build congruent and similar models within complex figures, transferring unknown ratios and angle equalities.",
        "dim2_essence_en": "Core equivalence and intuitive essence: Topological isomorphism between distance-preserving congruence and angle-preserving similarity. Doubling medians builds central symmetry; segment truncation builds reflection symmetry; equal-angle lines build proportional similarity—all concentrating scattered conditions into a single solvable triangle.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Scrambling corresponding vertex sequences, causing inverted proportions; (2) Missing exterior collinear cases when extending segments; (3) Transfer model: transitioning from congruent triangles ($k=1$) to arbitrary similarity ratios $k$ in rotational hand-in-hand models."
    },
    "ME-LINE-G3": {
        "dim1_origin_en": "Focuses on geometric determinations and loci of special quadrilaterals under progressive symmetries. By folding rectangles or squares along diagonals, it evaluates the combined application of reflection congruence, Pythagorean equations, and diagonal bisection properties under dynamic deformation.",
        "dim2_essence_en": "Core equivalence and intuitive essence: The orthogonal rigidity locking of central and axial symmetries in special quadrilaterals. Rectangle diagonals are equal and bisect (concyclic); rhombus diagonals are perpendicular and bisect; squares combine both. Folding converts quadrilateral boundaries into unknown sides of right triangles.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Jumping logical tiers in quadrilateral proofs (e.g. asserting that perpendicular diagonals alone imply a rhombus without proving a parallelogram first); (2) Failing to enforce boundary limits when folded vertices lie outside the figure; (3) Transfer model: diagonal midpoint coordinate equality for parallelograms on coordinate planes ($x_A+x_C = x_B+x_D$)."
    },
    "ME-LINE-G4": {
        "dim1_origin_en": "Represents advanced metric geometry, integrating algebraic Pythagorean modeling with circle tangency criteria. The goal is to determine whether students can convert circular loci of moving points into algebraic right-triangle equations, turning geometric proofs into precise algebra.",
        "dim2_essence_en": "Core equivalence and intuitive essence: The constant radius invariant and orthogonal tangent-chord right triangles. The perpendicular chord right triangle $r^2 = d^2 + (a/2)^2$ and the perpendicular radius tangent theorem form a dual engine for circle metrics.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Circular reasoning: assuming perpendicularity before proving tangency; (2) Slow recognition of hidden circle loci ('constant angle subtending constant chord' or 'right angle subtending diameter'); (3) Transfer model: distinguishing external tangency ($d=R+r$) from internal tangency ($d=|R-r|$)."
    },
    "ME-LINE-G5": {
        "dim1_origin_en": "A signature capstone problem in geometric exploration, originating from invariants under rigid planar rotations. Using two co-vertex isosceles right triangles or equilateral triangles as carriers, it examines invariance abstraction across continuous dynamic rotations.",
        "dim2_essence_en": "Core equivalence and intuitive essence: Length, angle, and intersection angle invariants under rotation. Equal segments sharing a vertex provide a natural center of rotation; connecting corresponding endpoints creates triangles that remain congruent (or similar) throughout rotation, with their intersecting angle always equaling the angle of rotation.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Inverting orientations by confusing clockwise and counterclockwise rotations; (2) Missing collinear boundary states; (3) Transfer model: Fermat point minimum distance problems (transforming broken paths into straight segments via $60^\\circ$ rotations)."
    },
    "ME-LINE-G6": {
        "dim1_origin_en": "Arising from practical non-contact remote measurements in surveying. By constructing dual-elevation or compounded slope scenarios, it tests orthogonal projection modeling, using acute trigonometric functions to convert angles into solvable linear equations.",
        "dim2_essence_en": "Core equivalence and intuitive essence: Dimensionless trigonometric ratios anchor line-of-sight angles to algebraic ratios of vertical heights and horizontal bases. Setting a common height $h$, differences in cotangents or tangents match the known baseline span, forming linear equations.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Confusing angle of elevation and depression baselines (depression is measured downward from the horizontal, not vertical); (2) Forgetting instrument height; (3) Transfer model: navigational hazard avoidance (evaluating whether a course trajectory enters the safe radius of a submerged reef)."
    },
    "ME-LINE-S1": {
        "dim1_origin_en": "Grounded in rational decision-making for modern data science. Using compounded charts comparing competitive samples, it evaluates whether students can synthesize central measures (mean, median) and dispersion metrics (variance, range) to provide evidence-backed recommendations.",
        "dim2_essence_en": "Core equivalence and intuitive essence: Holistic characterization of multi-dimensional statistical features. The mean represents the centroid, the median provides a robust midpoint resistant to outliers, and the variance measures fluctuation energy around the centroid.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Skewed judgment caused by outliers: relying solely on averages while ignoring extreme values; (2) Adding units to sample size; (3) Transfer model: using sample frequencies to infer population counts."
    },
    "ME-LINE-P1": {
        "dim1_origin_en": "Originating from multi-stage stochastic trial assessment. The intent is to evaluate whether students can systematically apply 2D grid tables or branching tree diagrams to perform exhaustive, non-overlapping enumerations of compound sample spaces, while distinguishing replacement from non-replacement trials.",
        "dim2_essence_en": "Core equivalence and intuitive essence: The discrete ratio $P = m/n$ in classical probability spaces. A two-step trial maps a 1D sequence into a 2D Cartesian matrix, while a tree diagram splits chronological decisions into leaf nodes with equal measure.",
        "dim4_traps_en": "Critical traps and variation transfer: (1) Confusing sampling with replacement ($n^2$ sample space) with sampling without replacement ($n(n-1)$, with the diagonal removed); (2) Fair game determination: verifying whether expected payoffs for both players are identical; (3) Transfer model: estimating hidden ratios via long-run stabilization frequencies."
    }
}

def resolve_rigor_en(rigor_zh: str) -> str:
    """匹配并返回对应的英文严谨推导"""
    if not rigor_zh:
        return ""
    for prefix, en_text in RIGOR_TRANSLATIONS.items():
        if prefix in rigor_zh:
            return en_text
    return ""

def update_db(db_path: str):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (does not exist)")
        return

    print(f"\nProcessing {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. 检查并补充英文列
    cur.execute("PRAGMA table_info(master_examples)")
    existing_cols = set(c[1] for c in cur.fetchall())

    new_cols = [
        ("dim1_origin_en", "TEXT"),
        ("dim2_essence_en", "TEXT"),
        ("dim3_rigor_en", "TEXT"),
        ("dim4_traps_en", "TEXT"),
    ]

    for col_name, col_type in new_cols:
        if col_name not in existing_cols:
            print(f"Adding column {col_name} to master_examples...")
            cur.execute(f"ALTER TABLE master_examples ADD COLUMN {col_name} {col_type}")

    conn.commit()

    # 2. 查询全部 119 条母题并填充英文内容
    cur.execute("""
        SELECT example_id, example_type, bound_target_id, bound_line_id, dim3_rigor 
        FROM master_examples
    """)
    rows = cur.fetchall()
    print(f"Found {len(rows)} master examples to populate.")

    updated_count = 0
    missing_rigor = 0

    for eid, etype, b_target, b_line, dim3 in rows:
        dim1_en = ""
        dim2_en = ""
        dim3_en = resolve_rigor_en(dim3)
        dim4_en = ""

        if not dim3_en:
            missing_rigor += 1
            print(f"Warning: No English rigor matched for {eid}! Chinese text: {dim3[:40] if dim3 else 'EMPTY'}")

        # 主线母题
        if etype == "line_master" or eid in LINE_MASTERS_EN:
            lookup_key = eid if eid in LINE_MASTERS_EN else f"ME-LINE-{b_line}"
            line_data = LINE_MASTERS_EN.get(lookup_key, LINE_MASTERS_EN.get(eid, {}))
            dim1_en = line_data.get("dim1_origin_en", "")
            dim2_en = line_data.get("dim2_essence_en", "")
            dim4_en = line_data.get("dim4_traps_en", "")

        # 考点母题 (ME-KP001 ~ ME-KP107)
        elif etype == "point_master" or b_target in ALL_KPS:
            kp_data = ALL_KPS.get(b_target)
            if kp_data:
                dim1_en = f"This problem is designed for the core assessment requirements of knowledge point [{b_target}]. The intent is to test students' understanding of the original origins and mathematical essence of the concept in specific mathematical contexts: {kp_data['origin_story_en']}"
                dim2_en = f"Key problem-solving insight and core equivalence relation: {kp_data['intuitive_essence_en']}"
                dim4_en = f"Common pitfalls and secondary examination variations: {kp_data['intrinsic_variation_en']}"

        cur.execute("""
            UPDATE master_examples
            SET dim1_origin_en = ?,
                dim2_essence_en = ?,
                dim3_rigor_en = ?,
                dim4_traps_en = ?
            WHERE example_id = ?
        """, (dim1_en, dim2_en, dim3_en, dim4_en, eid))
        updated_count += 1

    conn.commit()

    # 3. 校验断言
    cur.execute("SELECT count(*) FROM master_examples WHERE dim1_origin_en IS NULL OR dim1_origin_en = ''")
    empty_dim1 = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM master_examples WHERE dim2_essence_en IS NULL OR dim2_essence_en = ''")
    empty_dim2 = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM master_examples WHERE dim3_rigor_en IS NULL OR dim3_rigor_en = ''")
    empty_dim3 = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM master_examples WHERE dim4_traps_en IS NULL OR dim4_traps_en = ''")
    empty_dim4 = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM master_examples WHERE dim1_origin_en GLOB '*[\u4e00-\u9fff]*'")
    cn_dim1 = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM master_examples WHERE dim2_essence_en GLOB '*[\u4e00-\u9fff]*'")
    cn_dim2 = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM master_examples WHERE dim3_rigor_en GLOB '*[\u4e00-\u9fff]*'")
    cn_dim3 = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM master_examples WHERE dim4_traps_en GLOB '*[\u4e00-\u9fff]*'")
    cn_dim4 = cur.fetchone()[0]

    conn.close()

    print(f"Summary for {db_path}:")
    print(f"  Updated: {updated_count}/119")
    print(f"  Empty fields: dim1={empty_dim1}, dim2={empty_dim2}, dim3={empty_dim3}, dim4={empty_dim4}")
    print(f"  Remaining Chinese: dim1={cn_dim1}, dim2={cn_dim2}, dim3={cn_dim3}, dim4={cn_dim4}")
    
    assert empty_dim1 == 0, f"Error: {empty_dim1} master examples have empty dim1_origin_en"
    assert empty_dim2 == 0, f"Error: {empty_dim2} master examples have empty dim2_essence_en"
    assert empty_dim3 == 0, f"Error: {empty_dim3} master examples have empty dim3_rigor_en"
    assert empty_dim4 == 0, f"Error: {empty_dim4} master examples have empty dim4_traps_en"
    assert cn_dim1 == 0 and cn_dim2 == 0 and cn_dim3 == 0 and cn_dim4 == 0, "Error: Chinese characters found in English dimension fields!"
    print(f"SUCCESS: All 119 master examples in {db_path} have 100% verified English 4D content!")

def main():
    for p in ["data/master.db", "public/data/master.db", "dist/data/master.db"]:
        update_db(p)

if __name__ == "__main__":
    main()
