import sqlite3
import json
import re
import os

CH_RE = re.compile(r'[\u4e00-\u9fff]')

TRANSLATIONS_24 = [
    # 1. Q-2025-JX-0020, Q-2025-JX-0043
    {
        "qids": ["Q-2025-JX-0020", "Q-2025-JX-0043"],
        "en": """An institute of cultural relics and archaeology conducted liquor distillation experiments using a 1:1 replica of an ancient bronze still. The raw materials and liquor yield rates ($\\text{liquor yield rate} = \\frac{\\text{liquor yield volume}}{\\text{mash volume}} \\times 100\\%$) for distilling grain liquor and taro liquor with the replicated bronze still are shown in the table below:

Category | Raw Material | Liquor Yield Rate
--- | --- | ---
Grain liquor | Fermented grain mash (containing rice, glutinous rice, chaff, Daqu, and distilled water) | 30%
Taro liquor | Fermented taro mash (containing taro, Xiaoqu, and distilled water) | 20%

In the first experiment, a total of 16 kg of grain liquor and taro liquor was distilled; in the second experiment, a total of 36 kg of grain liquor and taro liquor was distilled, where the amount of grain mash used was 2 times that of the first experiment, and the amount of taro mash used was 3 times that of the first experiment.
(1) Find how many kilograms of grain mash and taro mash were used in the first experiment, respectively.
(2) Limited by production conditions at that time, the liquor yield of ancient bronze stills was about 80% of modern replicas. If rice accounts for about $\\frac{1}{4}$ of the grain mash, how many kilograms of rice needed to be prepared in ancient times to distill the total amount of grain liquor obtained in these two experiments?
[[IMG:0]]"""
    },
    # 2. Q-2025-HUN-0023, Q-2025-HUN-0048
    {
        "qids": ["Q-2025-HUN-0023", "Q-2025-HUN-0048"],
        "en": """As shown in the figure, two mutually perpendicular roads $a$ and $b$ in a scenic area intersect at point $M$. Scenic spots $A$ and $B$ are on road $a$, and scenic spot $C$ is on road $b$. To further upgrade the scenic area, the management committee developed another scenic spot $D$ on road $b$. It was measured that scenic spot $C$ is in the direction of north $60^\\circ$ east from scenic spot $B$, and north $30^\\circ$ east from scenic spot $A$. Scenic spot $B$ is in the direction of south $45^\\circ$ west from scenic spot $D$. Given $AB = 800\\text{ m}$.
(1) Find the degree measure of $\\angle ACB$;
(2) Find the distance between scenic spot $C$ and scenic spot $D$. (Keep the radical in the result)
[[IMG:0]]"""
    },
    # 3. Q-2025-XJ-0015
    {
        "qids": ["Q-2025-XJ-0015"],
        "en": """For polynomials $A$ and $B$, define a new operation "$\\oplus$": $A \\oplus B = 2A + B$; for a positive integer $k$ and a polynomial $A$, define a new operation "$\\otimes$": $k \\otimes A = \\underset{k \\text{ terms of } A}{\\underbrace{A \\oplus A \\oplus A \\oplus \\cdots \\oplus A}}$ (evaluated from left to right). Given that positive integers $m$ and $n$ are constants, let $M = m \\otimes (x^2 + 31xy)$ and $N = n \\otimes (y^2 - 14xy)$. If $M \\oplus N$ contains no $xy$ term, then $mn = $ ____ ."""
    },
    # 4. Q-2025-XJ-0018, Q-2025-XJ-0041
    {
        "qids": ["Q-2025-XJ-0018", "Q-2025-XJ-0041"],
        "en": """According to the requirements of the "Weight Management Year" campaign, in 2025 the campaign will continue to be promoted. Currently, Body Mass Index ($BMI$) is internationally used to measure weight status, with the formula $BMI = \\frac{\\text{weight (kg)}}{\\text{height}^2\\text{ (m}^2\\text{)}}$. The criteria are: $BMI < 18.5$ is underweight; $18.5 \\le BMI < 24$ is normal; $24 \\le BMI < 28$ is overweight; $BMI \\ge 28$ is obese. An organization randomly selected 50 employees, measured their height and weight data, and organized and described the data as follows:

[Organizing Data]
The sample data was divided into four groups $A$, $B$, $C$, and $D$:

Group | A | B | C | D
--- | --- | --- | --- | ---
$BMI$ | $16 \\le BMI < 20$ | $20 \\le BMI < 24$ | $24 \\le BMI < 28$ | $28 \\le BMI < 32$
Number of people | 8 | $m$ | $n$ | 12

[Describing Data]
Two incomplete statistical charts were drawn based on the data:
[[IMG:0]]

[Analyzing Data]
(1) Fill in the blanks: $m = $ ____ , $n = $ ____ ;
(2) Complete the bar chart;
(3) In the pie chart, the central angle corresponding to group $C$ is ____ $^\\circ$;
(4) If the total number of employees in this organization is 300, estimate how many of them are overweight ($24 \\le BMI < 28$)."""
    },
    # 5. Q-2025-XJ-0038
    {
        "qids": ["Q-2025-XJ-0038"],
        "en": """For polynomials $A$ and $B$, define a new operation "$\\oplus$": $A \\oplus B = 2A + B$; for a positive integer $k$ and a polynomial $A$, define a new operation "$\\otimes$": $k \\otimes A = \\underset{k \\text{ terms of } A}{\\underbrace{A \\oplus A \\oplus A \\oplus \\cdots \\oplus A}}$ (evaluated from left to right). Given that positive integers $m$ and $n$ are constants, let $M = m \\otimes (x^2 + 31xy)$ and $N = n \\otimes (y^2 - 14xy)$. If $M \\oplus N$ contains no $xy$ term, then $mn = $ ____ ."""
    },
    # 6. Q-2025-FJ-0020, Q-2025-FJ-0045
    {
        "qids": ["Q-2025-FJ-0020", "Q-2025-FJ-0045"],
        "en": """Students A and B are members of the math interest group at Xinhua Senior High School. The following are their test scores during the training camp for preparatory members of the High School Mathematics League and related information on the competition in their region over the past five years.

Information 1: Test scores of Students A and B during the training camp (unit: points)

Date / Member | Feb 10 | Feb 21 | Mar 5 | Mar 14 | Mar 25 | Apr 7 | Apr 17 | Apr 27 | May 8 | May 20
--- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---
A | 75 | 80 | 73 | 81 | 90 | 83 | 85 | 92 | 95 | 96
B | 82 | 83 | 86 | 82 | 92 | 83 | 87 | 86 | 84 | 85

The mean scores of A and B are ${\\overline{x}}_A = 85$ and ${\\overline{x}}_B = 85$, respectively; the variances are $s_A^2 = 58.4$ and $s_B^2 = a$, respectively.

Information 2: Qualifying cutoff scores for awards in the local High School Mathematics League over the past five years (unit: points)

Year | 2020 | 2021 | 2022 | 2023 | 2024
--- | --- | --- | --- | --- | ---
Award cutoff | 90 | 89 | 90 | 89 | 90

Based on the above information and statistical knowledge, answer the following questions:
(1) Calculate the value of $a$, and evaluate the performances of Students A and B based on their mean and variance;
(2) Calculate the average award qualifying score over the past five years, and explain: if one person is to be selected to participate in the High School Mathematics League, who is more suitable?
(3) If one person is to be selected for further intensive training, from the perspective of development potential, who do you think is more suitable, and why?"""
    },
    # 7. Q-2025-514-0010
    {
        "qids": ["Q-2025-514-0010"],
        "en": """As shown in the figure, in $\\bigtriangleup ABC$, $\\angle ABC = 45^\\circ$, $CD \\bot AB$ at $D$, $BE$ bisects $\\angle ABC$, $BE \\bot AC$ at $E$ and intersects $CD$ at point $F$. $H$ is the midpoint of $BC$. Connecting $DH$ intersects $BE$ at point $G$. Consider the following conclusions: (1) $\\angle A = 67.5^\\circ$; (2) $AE = \\frac{1}{2}BF$; (3) $\\bigtriangleup DGF$ is an isosceles triangle; (4) $S_{\\text{quadrilateral } ADGE} = S_{\\text{quadrilateral } GHCE}$. The correct ones are ( )

[[IMG:0]]"""
    },
    # 8. Q-2025-MZ41-0004
    {
        "qids": ["Q-2025-MZ41-0004"],
        "en": """In an integrated practical mathematics class, a math interest group explored water-saving strategies for doing laundry by washing a set of summer school uniforms.

[Topic] Exploring Water-Saving Strategies for Doing Laundry

[Washing Process]
Step 1: Put the uniform into clean water, add laundry detergent, soak and rub thoroughly, then wring dry.
Step 2: Put the wrung uniform into clean water, rinse thoroughly, and wring dry. Repeat Step 2 until the residual detergent concentration on the uniform meets the washing goal.

Assume that before the first rinse, the residual detergent concentration on the uniform is 0.2%, and after each wringing, 0.5 kg of water remains in the uniform.
Concentration relationship formula: $d_{\\text{after}} = \\frac{0.5 d_{\\text{before}}}{0.5 + w}$, where $d_{\\text{before}}$ and $d_{\\text{after}}$ are the residual detergent concentrations on the uniform before and after a single rinse, respectively; $w$ is the amount of clean water added in a single rinse (unit: kg).

[Washing Goal] Through rinsing, reduce the residual detergent concentration on the uniform to no higher than 0.01%.

[Practical Tasks] Please complete the following tasks:
(1) If only one rinse is performed to reduce the residual detergent concentration to 0.01%, how much clean water is needed?
(2) If 4 kg of clean water is divided equally to perform two rinses, can the washing goal be achieved?
(3) Compare the rinsing results of (1) and (2), and share your thoughts regarding laundry water-saving strategies."""
    },
    # 9. Q-2025-MZ41-0005
    {
        "qids": ["Q-2025-MZ41-0005"],
        "en": """[Comprehensive and Practical Activity]

[Theme] Investigating Spring Elongation

[Material] After learning about forces, a math experiment group planned to experimentally investigate the elastic force exerted by a spring under different elongations. The specific process is as follows (all experiments were carried out within the elastic limit of the springs):

[Practical Operation]
Step 1: Record the experimental data in the table below:

Spring length $L$ / cm | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29
--- | --- | --- | --- | --- | --- | --- | --- | ---
Elastic force $F$ / N | 0 | 0.5 | 1.0 | 1.5 | 2.0 | 2.5 | 3.0 | 3.5

Step 2: Plot the points and draw lines in the Cartesian coordinate system in Figure 2 based on the values in the table to graph the relationship between the spring length $L$ and the elastic force $F$.
[[IMG:0]]

[Practical Exploration]
(1) Observe the graph, hypothesize the functional relationship between $F$ and $L$, and find its algebraic expression;
(2) If the spring stiffness coefficient is $k = \\frac{F}{\\Delta L}$ (where $F$ is the pulling force on the spring, $F_{\\text{pull}} = F_{\\text{elastic}}$, and $\\Delta L$ is the elongation of the spring), find the value of $k$;
(3) Under the condition of (2), as shown in Figure 3, two springs A and B have different stiffness coefficients (both springs have the same initial length). Objects $M$ and $N$ are suspended on them, respectively, and the mass of object $M$ is greater than that of object $N$ (a greater mass exerts a greater pulling force, resulting in a greater elastic force). Observing the graph, then $k_A$ ____ $k_B$ (fill in ">", "<", or "=").
[[IMG:1]]"""
    },
    # 10. Q-2025-CQ-0023, Q-2025-CQ-0051
    {
        "qids": ["Q-2025-CQ-0023", "Q-2025-CQ-0051"],
        "en": """To enhance forest fire prevention, a forest farm employs both manual lookout and drone patrols to monitor forest conditions. As shown in the figure, $A$, $B$, $C$, and $D$ are in the same plane. $A$ is a lookout tower. At a certain moment, drone A is observed at point $B$, 10 km due east of $A$, and drone B is observed at point $D$, 20 km south $30^\\circ$ west of $A$. Both drones simultaneously fly to point $C$ for patrol. $D$ is due west of $C$, and $B$ is north $30^\\circ$ west of $C$.
(Reference data: $\\sqrt{2} \\approx 1.41$, $\\sqrt{3} \\approx 1.73$, $\\sqrt{5} \\approx 2.24$, $\\sqrt{7} \\approx 2.65$)
(1) Find the length of $BD$ (round the result to one decimal place);
(2) Drones A and B depart simultaneously from $B$ and $D$ along $BC$ and $DC$ toward point $C$ for patrol. The speed of drone B is twice the speed of drone A. When the distance between the two drones is 20 km, they can begin receiving signals from each other. How many kilometers has drone A flown from point $B$ when they first begin receiving each other's signals (round the result to one decimal place)?
[[IMG:0]]"""
    },
    # 11. Q-2025-SX-0012, Q-2025-SX-0035
    {
        "qids": ["Q-2025-SX-0012", "Q-2025-SX-0035"],
        "en": """In recent years, relying on the construction of rural e-towns to develop new rural e-commerce industries, our province has increased farmers' income. A farmer sells traditional handcrafted cloth tigers online, with profit increasing from 20 yuan each to 80 yuan each. If the farmer sells $a$ cloth tigers online, the profit increases by ____ yuan (expressed as an algebraic expression in terms of $a$).
[[IMG:0]]"""
    },
    # 12. Q-2025-JL-0024, Q-2025-JL-0048
    {
        "qids": ["Q-2025-JL-0024", "Q-2025-JL-0048"],
        "en": """In a Cartesian coordinate system, point $O$ is the origin. The parabola $y = x^2 + bx$ passes through the point $(3, 3)$. Points $A$ and $B$ are two points on the parabola with abscissas $m$ and $m+1$, respectively. Given point $M(1, 1)$, let point $C$ be the symmetric point of $A$ with respect to point $M$, and let point $D$ be the symmetric point of $B$ with respect to point $M$, constructing quadrilateral $ABCD$.
(1) Find the function expression of the parabola;
(2) When points $A$ and $B$ are symmetric about the axis of symmetry of the parabola, find the coordinates of point $C$;
(3) Let the portion of the parabola between points $A$ and $B$ (including points $A$ and $B$) be graph $G$. When $0 < m < 1$, if the difference between the maximum and minimum $y$-coordinates of graph $G$ is $\\frac{1}{2}$, find the value of $m$;
(4) Connect $OA$ and $OB$. When $\\angle AOB = \\angle OAD + \\angle OBC$, directly write the range of $m$. (Here $\\angle AOB$, $\\angle OAD$, and $\\angle OBC$ are all angles greater than $0^\\circ$ and less than $180^\\circ$)
[[IMG:0]]"""
    },
    # 13. Q-2024-571020-0024
    {
        "qids": ["Q-2024-571020-0024"],
        "en": """As shown in Figure 1, in a Cartesian coordinate system, $A(a, 0)$ is a point on the positive $x$-axis, $C$ is a point in the fourth quadrant, and $CB \\bot y$-axis intersects the negative $y$-axis at $B(0, b)$, with $|a - 3| + (b + 4)^2 = 0$ and $S_{\\text{quadrilateral } AOBC} = 16$.

[[IMG:0]]

(1) Find the coordinates of point $C$.

(2) As shown in Figure 2, let $D$ be a moving point on segment $OB$. When $AD \\bot AC$, the angle bisector of $\\angle ODA$ and the backward extension of the angle bisector of $\\angle CAE$ intersect at point $P$. Find the degree measure of $\\angle APD$ (point $E$ lies on the positive $x$-axis).

(3) As shown in Figure 3, when point $D$ moves on segment $OB$, construct $DM \\bot AD$ intersecting $BC$ at point $M$. The bisectors of $\\angle BMD$ and $\\angle DAO$ intersect at point $N$. As point $D$ moves, does the measure of $\\angle N$ change? If it does not change, find its value; if it changes, explain the reason."""
    },
    # 14. Q-2025-25-0010, Q-2025-25-0034
    {
        "qids": ["Q-2025-25-0010", "Q-2025-25-0034"],
        "en": """As shown in the figure, $BD$ is the angle bisector of $\\bigtriangleup ABC$, $DE \\text{∥} AB$, and $EF$ is the angle bisector of $\\bigtriangleup DEC$. Consider the following four conclusions: (1) $\\angle BDE = \\angle DBE$; (2) $EF \\text{∥} BD$; (3) $\\angle CDE = \\angle ABC$; (4) $S_{\\text{quadrilateral } ABED} = S_{\\bigtriangleup ABF}$. The correct ones are ( )

[[IMG:0]]"""
    },
    # 15. Q-2025-25-0022, Q-2025-25-0046
    {
        "qids": ["Q-2025-25-0022", "Q-2025-25-0046"],
        "en": """To understand the weekly physical exercise conditions of ninth-grade students during the winter vacation, a school randomly surveyed 20 ninth-grade female students and a number of male students about their weekly exercise time. After rounding, incomplete statistical tables and charts were created (some data was covered). It is known that female students exercising for 2 hours a week account for $16\\%$ of the total sampled students, and the number of male students and female students exercising for 4 hours a week are equal. Based on this information, answer the following questions:

Frequency Distribution Table of Weekly Exercise Time for Female Students

Grouping (after rounding) | Frequency (number of students) | Relative Frequency
--- | --- | ---
1 hour | 2 | 0.1
2 hours | $a$ | 0.4
3 hours | 4 | 0.2
4 hours | $b$ | [[IMG:0]]

[[IMG:1]]

(1) Find the values of $a$ and $b$ in the table and the total number of randomly sampled students;
(2) Find the average weekly exercise time of the randomly sampled male students in hours;
(3) To encourage students to strengthen their physical fitness, the school decided to commend students across the entire grade whose weekly exercise time (after rounding) reaches 3 hours or more with one award per student. If there are 1,000 students in the entire grade, approximately how many awards should the school prepare?"""
    },
    # 16. Q-2025-HEN-0008, Q-2025-HEN-0031
    {
        "qids": ["Q-2025-HEN-0008", "Q-2025-HEN-0031"],
        "en": """Oracle bone script is the earliest known mature writing system in China, representing the glorious achievements of early Chinese civilization. Four cards, each printed on the front with an oracle bone character "Mei", "Li", "Shan", and "He", respectively, are shown in the figure. Except for the front sides, they are completely identical. The four cards are shuffled face down. If two cards are randomly drawn, the probability that the two cards drawn are "Li" and "Shan" is ( )
[[IMG:0]]"""
    },
    # 17. Q-2025-HEN-0012
    {
        "qids": ["Q-2025-HEN-0012"],
        "en": """To investigate the growth of two varieties of wheat, A and B, in the school labor practice base, a math interest group randomly sampled 20 plants from each variety for measurement. The average seedling heights of the two varieties were found to be the same, with variances $s_A^2 = 3.6$ and $s_B^2 = 5.8$, respectively. Then the variety with more uniform growth is ____ (fill in "A" or "B")."""
    },
    # 18. Q-2025-HEN-0035
    {
        "qids": ["Q-2025-HEN-0035"],
        "en": """To investigate the growth of two varieties of wheat, A and B, in the school labor practice base, a math interest group randomly sampled 20 plants from each variety for measurement. The average seedling heights of the two varieties were found to be the same, with variances $s_A^2 = 3.6$ and $s_B^2 = 5.8$, respectively. Then the variety with more uniform growth is ____ (fill in "A" or "B")."""
    },
    # 19. Q-2025-JS-0014
    {
        "qids": ["Q-2025-JS-0014"],
        "en": """The "Eye of Suzhou" Ferris wheel is the largest water Ferris wheel in Asia, equipped with 28 revolving panoramic capsule cabins, as shown in the schematic diagram. The height of the Ferris wheel is $128\\text{ m}$ (the distance from the highest point to the water platform $MN$), and the distance from the center $O$ to $MN$ is $68\\text{ m}$. The Ferris wheel rotates uniformly, taking $30\\text{ min}$ for one full revolution. A cabin starts from point $A$ and reaches point $B$ after $10\\text{ min}$. During this process, the length of the path traversed by the cabin (i.e., $\\widehat{AB}$) is ____ $\\text{m}$. (Keep $\\pi$ in the result)
[[IMG:0]]"""
    },
    # 20. Q-2025-JS-0023, Q-2025-JS-0050
    {
        "qids": ["Q-2025-JS-0023", "Q-2025-JS-0050"],
        "en": """As shown in the figure, the graph of the linear function $y = 2x + 4$ intersects the $x$-axis and $y$-axis at points $A$ and $B$, respectively, and intersects the graph of the inverse proportional function $y = \\frac{k}{x}$ ($k \\neq 0$, $x > 0$) at point $C$. A line parallel to the $x$-axis is drawn through point $B$, intersecting the graph of the inverse proportional function $y = \\frac{k}{x}$ ($k \\neq 0$, $x > 0$) at point $D$. Connect $CD$.
(1) Find the coordinates of points $A$ and $B$;
(2) If $\\triangle BCD$ is an isosceles triangle with base $BD$, find the value of $k$.
[[IMG:0]]"""
    },
    # 21. Q-2025-MZ42-0019
    {
        "qids": ["Q-2025-MZ42-0019"],
        "en": """As shown in the figure, in parallelogram $ABCD$, $\\angle C = 120^\\circ$, $AB = 8$, $BC = 10$. $E$ is the midpoint of side $CD$, and $F$ is a moving point on side $AD$. Fold $\\triangle DEF$ along $EF$ to obtain $\\triangle D'EF$, and connect $AD'$ and $BD'$. Then the minimum area of $\\triangle ABD'$ is ____.

[[IMG:0]]"""
    },
    # 22. Q-2025-AX-0017
    {
        "qids": ["Q-2025-AX-0017"],
        "en": """As shown in the figure, in parallelogram $ABCD$, $E$ and $F$ are located on $AD$ and $BC$, respectively, with $DE = 2AE$ and $BF = 2FC$. Connect $BE$ and $AF$ intersecting at point $H$, and connect $DF$ and $CE$ intersecting at point $G$. Then $\\frac{S_{\\text{quadrilateral } EHFG}}{S_{\\text{parallelogram } ABCD}} = $ ____.

[[IMG:0]]"""
    },
    # 23. Q-2025-AX-0048
    {
        "qids": ["Q-2025-AX-0048"],
        "en": """As shown in the figure, in a Cartesian coordinate system, given $OA = 12\\text{ cm}$ and $OB = 6\\text{ cm}$. Point $P$ starts from point $O$ and moves along side $OA$ toward point $A$ at a speed of $1\\text{ cm/s}$; point $Q$ starts from point $B$ and moves along side $BO$ toward point $O$ at a speed of $1\\text{ cm/s}$. If $P$ and $Q$ start simultaneously, let $t$ (seconds) represent the moving time ($0 \\le t \\le 6$):
(1) Let the area of $\\bigtriangleup POQ$ be $y$, find the function expression of $y$ with respect to $t$;
(2) When the area of $\\bigtriangleup POQ$ reaches its maximum, fold $\\bigtriangleup POQ$ along line $PQ$ to obtain $\\bigtriangleup PCQ$. Determine whether point $C$ falls on line $AB$, and explain the reason;
(3) For what value of $t$ is $\\bigtriangleup POQ$ similar to $\\bigtriangleup AOB$?

[[IMG:0]]"""
    },
    # 24. Q-2025-A9D498-0003
    {
        "qids": ["Q-2025-A9D498-0003"],
        "en": """As shown in the figure, after refolding the net of the cube into a cube, the character opposite to the face with "Zhong" is ( )

[[IMG:0]]"""
    }
]

def main():
    # 1. Check assertions on each translation
    for i, item in enumerate(TRANSLATIONS_24, 1):
        en_text = item["en"]
        chinese_chars = CH_RE.findall(en_text)
        if chinese_chars:
            raise ValueError(f"Item {i} ({item['qids']}) has Chinese characters: {''.join(chinese_chars)}")
    print("All 24 translations passed Chinese-free assertion!")

    # 2. Update cache
    cache_path = "tmp/stem_translations_cache.json"
    cache = {}
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            cache = json.load(f)

    # We map stem_zh to en
    conn = sqlite3.connect("data/questions.db")
    cur = conn.cursor()
    qid_to_zh = {}
    cur.execute("SELECT question_id, stem_zh FROM questions")
    for qid, zh in cur.fetchall():
        qid_to_zh[qid] = zh
    conn.close()

    for item in TRANSLATIONS_24:
        for qid in item["qids"]:
            zh = qid_to_zh.get(qid)
            if zh:
                cache[zh] = item["en"]

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    print(f"Updated {cache_path} (total entries: {len(cache)})")

    # 3. Apply to all 3 databases
    db_paths = ["data/questions.db", "public/data/questions.db", "dist/data/questions.db"]
    for db_path in db_paths:
        if not os.path.exists(db_path):
            print(f"Skipping non-existent {db_path}")
            continue
        c = sqlite3.connect(db_path)
        cursor = c.cursor()
        for item in TRANSLATIONS_24:
            for qid in item["qids"]:
                cursor.execute("UPDATE questions SET stem_en = ? WHERE question_id = ?", (item["en"], qid))
        c.commit()

        # Audit
        cursor.execute("SELECT question_id, stem_en FROM questions")
        rows = cursor.fetchall()
        chinglish_rem = [r for r in rows if r[1] and CH_RE.search(r[1])]
        null_count = [r for r in rows if not r[1]]
        c.close()
        print(f"[{db_path}] Total rows: {len(rows)} | Chinglish remaining: {len(chinglish_rem)} | NULL/empty: {len(null_count)}")

if __name__ == "__main__":
    main()
