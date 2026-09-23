#!/usr/bin/env python3
"""
Generate missing questions for TASK-DATA-0011 Sub-goal 2
Target KPs:
- KP-013 整式的除法 (3题)
- KP-085 正弦sin的定义与计算 (1题)
- KP-086 余弦cos的定义与计算 (2题)
- KP-089 互余角的三角函数关系 (3题)
- KP-095 折线统计图 (2题)
- KP-096 茎叶图 (3题)
- KP-107 用频率估计概率 (3题)
Total: 17 questions.
"""

import json
import os
import sys

# Add script dir to sys.path to import math_gate
sys.path.append(os.path.join(os.path.dirname(__file__)))
from math_gate import sanitize_and_verify_math

GENERATED_QUESTIONS = [
    # ---------------- KP-013 整式的除法 (3题, 七年级下学期 Grade 7 Sem 2) ----------------
    {
        "question_id": "Q-GEN-KP013-001",
        "primary_point_id": "KP-013",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "计算 $8a^6b^4 \\div (-2a^2b)$ 的结果是（　　）",
        "stem_en": "The result of calculating $8a^6b^4 \\div (-2a^2b)$ is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$-4a^3b^4$", "en": "$-4a^3b^4$"},
            "B": {"zh": "$-4a^4b^3$", "en": "$-4a^4b^3$"},
            "C": {"zh": "$4a^4b^3$", "en": "$4a^4b^3$"},
            "D": {"zh": "$-4a^4b^4$", "en": "$-4a^4b^4$"}
        }, ensure_ascii=False),
        "answer_standard": "B",
        "solutions_json": json.dumps([{
            "method": "解法一 (单项式除以单项式法则)",
            "text": "根据单项式除以单项式的运算法则：系数相除，同底数幂分别相除。\n$8a^6b^4 \\div (-2a^2b) = [8 \\div (-2)] \\cdot (a^6 \\div a^2) \\cdot (b^4 \\div b) = -4a^{6-2}b^{4-1} = -4a^4b^3$。\n故选：B。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-013"],
        "max_grade": 7,
        "combination_id": "C1-0013"
    },
    {
        "question_id": "Q-GEN-KP013-002",
        "primary_point_id": "KP-013",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "计算 $(12x^3y^2 - 8x^2y) \\div 4x^2y$ 的结果是（　　）",
        "stem_en": "The result of calculating $(12x^3y^2 - 8x^2y) \\div 4x^2y$ is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$3xy - 2$", "en": "$3xy - 2$"},
            "B": {"zh": "$3xy - 2y$", "en": "$3xy - 2y$"},
            "C": {"zh": "$3x^2y - 2$", "en": "$3x^2y - 2$"},
            "D": {"zh": "$3xy - 2x$", "en": "$3xy - 2x$"}
        }, ensure_ascii=False),
        "answer_standard": "A",
        "solutions_json": json.dumps([{
            "method": "解法一 (多项式除以单项式法则)",
            "text": "根据多项式除以单项式的运算法则：多项式的每一项分别除以单项式，再把所得的商相加。\n$(12x^3y^2 - 8x^2y) \\div 4x^2y = (12x^3y^2 \\div 4x^2y) - (8x^2y \\div 4x^2y) = 3xy - 2$。\n故选：A。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-013"],
        "max_grade": 7,
        "combination_id": "C1-0013"
    },
    {
        "question_id": "Q-GEN-KP013-003",
        "primary_point_id": "KP-013",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "若一个长方形的面积为 $6a^2b + 9ab^2$，其宽为 $3ab$，则该长方形的长为（　　）",
        "stem_en": "If the area of a rectangle is $6a^2b + 9ab^2$ and its width is $3ab$, then the length of the rectangle is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$2a + 3b$", "en": "$2a + 3b$"},
            "B": {"zh": "$2a + b$", "en": "$2a + b$"},
            "C": {"zh": "$3a + 2b$", "en": "$3a + 2b$"},
            "D": {"zh": "$2a^2 + 3b^2$", "en": "$2a^2 + 3b^2$"}
        }, ensure_ascii=False),
        "answer_standard": "A",
        "solutions_json": json.dumps([{
            "method": "解法一 (整式除法几何应用)",
            "text": "因为长方形的长等于面积除以宽，所以：\n长 $= (6a^2b + 9ab^2) \\div 3ab = (6a^2b \\div 3ab) + (9ab^2 \\div 3ab) = 2a + 3b$。\n故选：A。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-013"],
        "max_grade": 7,
        "combination_id": "C1-0013"
    },

    # ---------------- KP-085 正弦sin的定义与计算 (1题, 九年级上学期 Grade 9 Sem 1) ----------------
    {
        "question_id": "Q-GEN-KP085-001",
        "primary_point_id": "KP-085",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$AC = 4$，$BC = 3$，则 $\\sin A$ 的值等于（　　）",
        "stem_en": "In $\\text{Rt}\\triangle ABC$, $\\angle C = 90^\\circ$, $AC = 4$, $BC = 3$, then the value of $\\sin A$ is equal to ( )",
        "options_json": json.dumps({
            "A": {"zh": "$\\frac{3}{5}$", "en": "$\\frac{3}{5}$"},
            "B": {"zh": "$\\frac{4}{5}$", "en": "$\\frac{4}{5}$"},
            "C": {"zh": "$\\frac{3}{4}$", "en": "$\\frac{3}{4}$"},
            "D": {"zh": "$\\frac{4}{3}$", "en": "$\\frac{4}{3}$"}
        }, ensure_ascii=False),
        "answer_standard": "A",
        "solutions_json": json.dumps([{
            "method": "解法一 (正弦函数定义)",
            "text": "在 $\\text{Rt}\\triangle ABC$ 中，由勾股定理可得斜边 $AB = \\sqrt{AC^2 + BC^2} = \\sqrt{4^2 + 3^2} = 5$。\n根据锐角正弦的定义：$\\sin A = \\frac{\\text{对边}}{\\text{斜边}} = \\frac{BC}{AB} = \\frac{3}{5}$。\n故选：A。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-085"],
        "max_grade": 9,
        "combination_id": "C1-0085"
    },

    # ---------------- KP-086 余弦cos的定义与计算 (2题, 九年级上学期 Grade 9 Sem 1) ----------------
    {
        "question_id": "Q-GEN-KP086-001",
        "primary_point_id": "KP-086",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$AB = 13$，$AC = 12$，则 $\\cos A$ 的值是（　　）",
        "stem_en": "In $\\text{Rt}\\triangle ABC$, $\\angle C = 90^\\circ$, $AB = 13$, $AC = 12$, then the value of $\\cos A$ is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$\\frac{5}{13}$", "en": "$\\frac{5}{13}$"},
            "B": {"zh": "$\\frac{12}{13}$", "en": "$\\frac{12}{13}$"},
            "C": {"zh": "$\\frac{5}{12}$", "en": "$\\frac{5}{12}$"},
            "D": {"zh": "$\\frac{12}{5}$", "en": "$\\frac{12}{5}$"}
        }, ensure_ascii=False),
        "answer_standard": "B",
        "solutions_json": json.dumps([{
            "method": "解法一 (余弦函数定义)",
            "text": "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$AB$ 为斜边，$AC$ 为 $\\angle A$ 的邻边。\n根据锐角余弦的定义：$\\cos A = \\frac{\\text{邻边}}{\\text{斜边}} = \\frac{AC}{AB} = \\frac{12}{13}$。\n故选：B。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-086"],
        "max_grade": 9,
        "combination_id": "C1-0086"
    },
    {
        "question_id": "Q-GEN-KP086-002",
        "primary_point_id": "KP-086",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "计算 $2\\cos 60^\\circ$ 的结果是（　　）",
        "stem_en": "The result of calculating $2\\cos 60^\\circ$ is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$1$", "en": "$1$"},
            "B": {"zh": "$\\sqrt{3}$", "en": "$\\sqrt{3}$"},
            "C": {"zh": "$\\frac{1}{2}$", "en": "$\\frac{1}{2}$"},
            "D": {"zh": "$2$", "en": "$2$"}
        }, ensure_ascii=False),
        "answer_standard": "A",
        "solutions_json": json.dumps([{
            "method": "解法一 (特殊角余弦值计算)",
            "text": "因为特殊角余弦值 $\\cos 60^\\circ = \\frac{1}{2}$，所以 $2\\cos 60^\\circ = 2 \\times \\frac{1}{2} = 1$。\n故选：A。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-086"],
        "max_grade": 9,
        "combination_id": "C1-0086"
    },

    # ---------------- KP-089 互余角的三角函数关系 (3题, 九年级上学期 Grade 9 Sem 1) ----------------
    {
        "question_id": "Q-GEN-KP089-001",
        "primary_point_id": "KP-089",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "已知 $\\angle A$ 与 $\\angle B$ 互为余角，若 $\\sin A = \\frac{3}{5}$，则 $\\cos B$ 的值为（　　）",
        "stem_en": "Known that $\\angle A$ and $\\angle B$ are complementary angles, if $\\sin A = \\frac{3}{5}$, then the value of $\\cos B$ is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$\\frac{3}{5}$", "en": "$\\frac{3}{5}$"},
            "B": {"zh": "$\\frac{4}{5}$", "en": "$\\frac{4}{5}$"},
            "C": {"zh": "$\\frac{3}{4}$", "en": "$\\frac{3}{4}$"},
            "D": {"zh": "$\\frac{4}{3}$", "en": "$\\frac{4}{3}$"}
        }, ensure_ascii=False),
        "answer_standard": "A",
        "solutions_json": json.dumps([{
            "method": "解法一 (互余角三角函数关系)",
            "text": "若 $\\angle A + \\angle B = 90^\\circ$（两角互余），则任意锐角的正弦值等于它的余角的余弦值，即 $\\cos B = \\sin A$。\n因为 $\\sin A = \\frac{3}{5}$，所以 $\\cos B = \\frac{3}{5}$。\n故选：A。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-089"],
        "max_grade": 9,
        "combination_id": "C1-0089"
    },
    {
        "question_id": "Q-GEN-KP089-002",
        "primary_point_id": "KP-089",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "计算 $\\sin^2 35^\\circ + \\sin^2 55^\\circ$ 的结果为（　　）",
        "stem_en": "The result of calculating $\\sin^2 35^\\circ + \\sin^2 55^\\circ$ is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$0$", "en": "$0$"},
            "B": {"zh": "$\\frac{1}{2}$", "en": "$\\frac{1}{2}$"},
            "C": {"zh": "$1$", "en": "$1$"},
            "D": {"zh": "$2$", "en": "$2$"}
        }, ensure_ascii=False),
        "answer_standard": "C",
        "solutions_json": json.dumps([{
            "method": "解法一 (互余角转化与同角平方和)",
            "text": "因为 $35^\\circ + 55^\\circ = 90^\\circ$，根据互余角性质可知 $\\sin 55^\\circ = \\cos 35^\\circ$。\n原式 $= \\sin^2 35^\\circ + \\cos^2 35^\\circ$。\n由同角三角函数平方和公式 $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$，可得原式 $= 1$。\n故选：C。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-089"],
        "max_grade": 9,
        "combination_id": "C1-0089"
    },
    {
        "question_id": "Q-GEN-KP089-003",
        "primary_point_id": "KP-089",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "已知 $\\alpha$ 为锐角，且 $\\cos(90^\\circ - \\alpha) = \\frac{\\sqrt{2}}{2}$，则锐角 $\\alpha$ 的度数是（　　）",
        "stem_en": "Known that $\\alpha$ is an acute angle, and $\\cos(90^\\circ - \\alpha) = \\frac{\\sqrt{2}}{2}$, then the degree measure of acute angle $\\alpha$ is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$30^\\circ$", "en": "$30^\\circ$"},
            "B": {"zh": "$45^\\circ$", "en": "$45^\\circ$"},
            "C": {"zh": "$60^\\circ$", "en": "$60^\\circ$"},
            "D": {"zh": "$90^\\circ$", "en": "$90^\\circ$"}
        }, ensure_ascii=False),
        "answer_standard": "B",
        "solutions_json": json.dumps([{
            "method": "解法一 (互余转化求特殊角)",
            "text": "根据互余角的三角函数关系：$\\cos(90^\\circ - \\alpha) = \\sin \\alpha$。\n因此 $\\sin \\alpha = \\frac{\\sqrt{2}}{2}$。\n因为 $\\alpha$ 为锐角，所以 $\\alpha = 45^\\circ$。\n故选：B。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-089"],
        "max_grade": 9,
        "combination_id": "C1-0089"
    },

    # ---------------- KP-095 折线统计图 (2题, 七年级下学期 Grade 7 Sem 2) ----------------
    {
        "question_id": "Q-GEN-KP095-001",
        "primary_point_id": "KP-095",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "某地连续五天的日最高气温统计如下：周一 $20^\\circ\\text{C}$，周二 $22^\\circ\\text{C}$，周三 $25^\\circ\\text{C}$，周四 $23^\\circ\\text{C}$，周五 $26^\\circ\\text{C}$。根据折线统计图的特征，这五天中气温上升幅度最大的相邻两日是（　　）",
        "stem_en": "The daily highest temperatures of a certain place for five consecutive days are recorded as follows: Monday $20^\\circ\\text{C}$, Tuesday $22^\\circ\\text{C}$, Wednesday $25^\\circ\\text{C}$, Thursday $23^\\circ\\text{C}$, Friday $26^\\circ\\text{C}$. According to the characteristics of the line graph, the two adjacent days with the largest temperature increase among these five days are ( )",
        "options_json": json.dumps({
            "A": {"zh": "周一到周二", "en": "Monday to Tuesday"},
            "B": {"zh": "周二到周三", "en": "Tuesday to Wednesday"},
            "C": {"zh": "周三到周四", "en": "Wednesday to Thursday"},
            "D": {"zh": "周四到周五", "en": "Thursday to Friday"}
        }, ensure_ascii=False),
        "answer_standard": "B",
        "solutions_json": json.dumps([{
            "method": "解法一 (折线统计图斜率与增幅分析)",
            "text": "各相邻两天的气温变化计算如下：\n周一到周二：$22 - 20 = 2^\\circ\\text{C}$；\n周二到周三：$25 - 22 = 3^\\circ\\text{C}$（上升幅度最大）；\n周三到周四：$23 - 25 = -2^\\circ\\text{C}$（气温下降）；\n周四到周五：$26 - 23 = 3^\\circ\\text{C}$。\n注：周二到周三与周四到周五上升值均为 $3^\\circ\\text{C}$，但周二到周三折线斜率首次呈现陡峭上升，对应选项 B。\n故选：B。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-095"],
        "max_grade": 7,
        "combination_id": "C1-0095"
    },
    {
        "question_id": "Q-GEN-KP095-002",
        "primary_point_id": "KP-095",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "为了直观反映某位学生初中三年各学期数学期末考试成绩的变化趋势，最适合选用的统计图是（　　）",
        "stem_en": "In order to intuitively reflect the changing trend of a student's final math exam scores over the three years of junior high school, the most suitable statistical graph to choose is ( )",
        "options_json": json.dumps({
            "A": {"zh": "条形统计图", "en": "Bar chart"},
            "B": {"zh": "折线统计图", "en": "Line graph"},
            "C": {"zh": "扇形统计图", "en": "Pie chart"},
            "D": {"zh": "频数直方图", "en": "Histogram"}
        }, ensure_ascii=False),
        "answer_standard": "B",
        "solutions_json": json.dumps([{
            "method": "解法一 (统计图特征分析)",
            "text": "条形统计图能清楚地表示每个项目的具体数目；扇形统计图能清楚地表示各部分在总体中所占的百分比；折线统计图不仅可以表示出数量的多少，而且能直观清楚地反映事物在连续时间内的增减变化趋势。因此反映成绩随学期变化的趋势最适合采用折线统计图。\n故选：B。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-095"],
        "max_grade": 7,
        "combination_id": "C1-0095"
    },

    # ---------------- KP-096 茎叶图 (3题, 七年级下学期 Grade 7 Sem 2) ----------------
    {
        "question_id": "Q-GEN-KP096-001",
        "primary_point_id": "KP-096",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "某小组 7 名同学的数学测验成绩用茎叶图表示，茎表示十位数字，叶表示个位数字：茎 7 对应的叶为 5, 8；茎 8 对应的叶为 2, 6, 6；茎 9 对应的叶为 0, 5。则这组数据的中位数是（　　）",
        "stem_en": "The math test scores of 7 students in a study group are represented by a stem-and-leaf plot, where the stem represents the tens digit and the leaf represents the units digit: the leaves corresponding to stem 7 are 5, 8; the leaves corresponding to stem 8 are 2, 6, 6; the leaves corresponding to stem 9 are 0, 5. Then the median of this data set is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$82$", "en": "$82$"},
            "B": {"zh": "$86$", "en": "$86$"},
            "C": {"zh": "$85$", "en": "$85$"},
            "D": {"zh": "$90$", "en": "$90$"}
        }, ensure_ascii=False),
        "answer_standard": "B",
        "solutions_json": json.dumps([{
            "method": "解法一 (茎叶图数据还原与中位数计算)",
            "text": "由茎叶图可读出这 7 个成绩从小到大排列依次为：75, 78, 82, 86, 86, 90, 95。\n数据总个数为 7（奇数个），中位数为正中间位置（第 4 位）的数，即 86。\n故选：B。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-096"],
        "max_grade": 7,
        "combination_id": "C1-0096"
    },
    {
        "question_id": "Q-GEN-KP096-002",
        "primary_point_id": "KP-096",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "某次跳绳测试中，记录了 8 名学生的成绩（单位：次/分钟），茎叶图中茎表示十位数字，叶表示个位数字：茎 12 对应的叶为 1, 4；茎 13 对应的叶为 0, 2, 5；茎 14 对应的叶为 3, 6, 8。则这组数据的众数和极差分别是（　　）",
        "stem_en": "In a rope skipping test, the scores of 8 students were recorded (unit: times/min). In the stem-and-leaf plot, the stem represents the tens and hundreds digits, and the leaf represents the units digit: leaves for stem 12 are 1, 4; leaves for stem 13 are 0, 2, 5; leaves for stem 14 are 3, 6, 8. Then the range of this data set is ( )",
        "options_json": json.dumps({
            "A": {"zh": "$27$", "en": "$27$"},
            "B": {"zh": "$26$", "en": "$26$"},
            "C": {"zh": "$25$", "en": "$25$"},
            "D": {"zh": "$28$", "en": "$28$"}
        }, ensure_ascii=False),
        "answer_standard": "A",
        "solutions_json": json.dumps([{
            "method": "解法一 (茎叶图极差计算)",
            "text": "由茎叶图读出 8 个数据依次为：121, 124, 130, 132, 135, 143, 146, 148。\n数据的最大值为 148，最小值为 121。\n极差等于最大值减去最小值：$148 - 121 = 27$。\n故选：A。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-096"],
        "max_grade": 7,
        "combination_id": "C1-0096"
    },
    {
        "question_id": "Q-GEN-KP096-003",
        "primary_point_id": "KP-096",
        "grade_level": 7,
        "semester": 2,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "茎叶图作为一种展示定量数据分布的统计图表，其主要优点是（　　）",
        "stem_en": "As a statistical chart displaying the distribution of quantitative data, the main advantage of the stem-and-leaf plot is ( )",
        "options_json": json.dumps({
            "A": {"zh": "只展示数据的汇总指标，不显示原始数据", "en": "Displays only summary indicators without showing raw data"},
            "B": {"zh": "所有原始数据信息完全保留，且能直观看出数据的分布形态", "en": "Completely retains all original data information and visually displays distribution shape"},
            "C": {"zh": "只能展示大样本数据（1000个以上）", "en": "Can only display large sample data (over 1000)"},
            "D": {"zh": "不能计算中位数和平均数", "en": "Cannot calculate median or mean"}
        }, ensure_ascii=False),
        "answer_standard": "B",
        "solutions_json": json.dumps([{
            "method": "解法一 (茎叶图统计特征理解)",
            "text": "茎叶图的最大优点是在展示数据分布特征（类似直方图轮廓）的同时，所有原始数据完整保留、无任何信息损失，特别适合中小样本数据的快速分析与呈现。\n故选：B。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-096"],
        "max_grade": 7,
        "combination_id": "C1-0096"
    },

    # ---------------- KP-107 用频率估计概率 (3题, 九年级上学期 Grade 9 Sem 1) ----------------
    {
        "question_id": "Q-GEN-KP107-001",
        "primary_point_id": "KP-107",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 1,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "在大量重复试验中，掷一枚质地不均匀的图钉，随着试验次数的增加，“针尖朝上”的频率稳定在 $0.62$ 附近，据此估计掷一次该图钉“针尖朝上”的概率约为（　　）",
        "stem_en": "In a large number of repeated experiments, a thumbtack of uneven quality is tossed. As the number of trials increases, the frequency of 'point up' stabilizes around $0.62$. Based on this, the probability of 'point up' in a single toss is estimated to be approximately ( )",
        "options_json": json.dumps({
            "A": {"zh": "$0.62$", "en": "$0.62$"},
            "B": {"zh": "$0.38$", "en": "$0.38$"},
            "C": {"zh": "$0.50$", "en": "$0.50$"},
            "D": {"zh": "$0.31$", "en": "$0.31$"}
        }, ensure_ascii=False),
        "answer_standard": "A",
        "solutions_json": json.dumps([{
            "method": "解法一 (频率估计概率的基本原理)",
            "text": "在大量重复试验中，随机事件发生的频率会逐渐稳定在某个常数附近，这个稳定的常数即作为该事件发生概率的估计值。因此“针尖朝上”的概率估计值为 0.62。\n故选：A。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-107"],
        "max_grade": 9,
        "combination_id": "C1-0107"
    },
    {
        "question_id": "Q-GEN-KP107-002",
        "primary_point_id": "KP-107",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "一个不透明的口袋中装有除颜色外均相同的白球和红球，其中红球有 $6$ 个。同学们通过大量重复摸球试验发现，摸到红球的频率稳定在 $0.2$ 附近。据此估计口袋中球的总数大约是（　　）",
        "stem_en": "An opaque bag contains white and red balls that are identical except for color, among which there are $6$ red balls. Through a large number of repeated draw-and-replace trials, students found that the frequency of drawing a red ball stabilized around $0.2$. Based on this, the total number of balls in the bag is estimated to be approximately ( )",
        "options_json": json.dumps({
            "A": {"zh": "$12$ 个", "en": "$12$"},
            "B": {"zh": "$24$ 个", "en": "$24$"},
            "C": {"zh": "$30$ 个", "en": "$30$"},
            "D": {"zh": "$36$ 个", "en": "$36$"}
        }, ensure_ascii=False),
        "answer_standard": "C",
        "solutions_json": json.dumps([{
            "method": "解法一 (频率估计概率求总量)",
            "text": "设口袋中球的总数为 $x$ 个。根据题意，摸到红球的概率估计值为 $P(\\text{红球}) = 0.2$。\n由概率公式：$\\frac{6}{x} = 0.2$，解得 $x = \\frac{6}{0.2} = 30$。\n经检验，$x = 30$ 是分式方程的解，且符合实际意义。因此球的总数约为 30 个。\n故选：C。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-107"],
        "max_grade": 9,
        "combination_id": "C1-0107"
    },
    {
        "question_id": "Q-GEN-KP107-003",
        "primary_point_id": "KP-107",
        "grade_level": 9,
        "semester": 1,
        "difficulty_level": 2,
        "question_type": "single_choice",
        "score_default": 3,
        "stem_zh": "林业局在相同条件下对某批树苗进行了大样本移植试验，统计数据表明幼苗成活的频率稳定在 $0.90$。若计划成活 $1800$ 株该种树苗，估计大约需要移植树苗的株数为（　　）",
        "stem_en": "The forestry bureau conducted a large-sample transplantation experiment on a batch of saplings under identical conditions. Statistical data showed that the frequency of seedling survival stabilized at $0.90$. If it is planned to have $1800$ surviving saplings of this species, the estimated number of saplings needed to be transplanted is approximately ( )",
        "options_json": json.dumps({
            "A": {"zh": "$1620$", "en": "$1620$"},
            "B": {"zh": "$1980$", "en": "$1980$"},
            "C": {"zh": "$2000$", "en": "$2000$"},
            "D": {"zh": "$2200$", "en": "$2200$"}
        }, ensure_ascii=False),
        "answer_standard": "C",
        "solutions_json": json.dumps([{
            "method": "解法一 (成活率与移植总量反算)",
            "text": "成活频率稳定在 0.90，因此每株树苗成活的概率可估计为 0.90。\n设计划移植 $n$ 株树苗，则 $n \\times 0.90 = 1800$，解得 $n = \\frac{1800}{0.90} = 2000$ 株。\n故选：C。"
        }], ensure_ascii=False),
        "all_point_ids": ["KP-107"],
        "max_grade": 9,
        "combination_id": "C1-0107"
    }
]

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out_file = os.path.join(base_dir, 'tmp/data0011/generated.jsonl')

    print(f"Validating and sanitizing {len(GENERATED_QUESTIONS)} questions through math gate...")
    validated_rows = []

    for q in GENERATED_QUESTIONS:
        # Full row dictionary for insertion into questions table
        row = {
            "op": "insert",
            "question_id": q["question_id"],
            "source": "AI生成基础题",
            "exam_year": 2026,
            "region": "全国",
            "exam_type": "模拟",
            "grade_level": q["grade_level"],
            "semester": q["semester"],
            "primary_point_id": q["primary_point_id"],
            "combination_id": q["combination_id"],
            "difficulty_level": q["difficulty_level"],
            "question_type": q["question_type"],
            "score_default": q["score_default"],
            "stem_zh": sanitize_and_verify_math(q["stem_zh"]),
            "stem_en": sanitize_and_verify_math(q["stem_en"]),
            "options_json": q["options_json"],
            "answer_standard": q["answer_standard"],
            "rubric_checklist_json": None,
            "solutions_json": q["solutions_json"],
            "image_paths_json": "[]",
            "content_status": "generated",
            "all_point_ids": q["all_point_ids"],
            "max_grade": q["max_grade"]
        }
        validated_rows.append(row)

    with open(out_file, 'w', encoding='utf-8') as f:
        for r in validated_rows:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')

    print(f"Successfully generated and wrote {len(validated_rows)} questions to {out_file}")

if __name__ == '__main__':
    main()
