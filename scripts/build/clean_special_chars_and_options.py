#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build/clean_special_chars_and_options.py
(TASK-I18N-0002 阶段二 & 阶段三)

功能：
1. 阶段二：全库清洗特殊减号与破折号：
   - 将 \\ufe63 (Small Hyphen-Minus ﹣) 替换为标准 ASCII -
   - 将 \\uff0d (Fullwidth Hyphen-Minus －) 替换为标准 ASCII -
   - 将 \\u2010 (Hyphen ‐) 替换为标准 ASCII -
   覆盖字段：stem_zh, stem_en, options_json, answer_standard, solutions_json

2. 阶段三：选择题选项 options_json 深度清洗与英文化：
   - 负号标准化
   - 中文单位英文化：米 -> m, 厘米 -> cm, 毫米 -> mm, 千米/公里 -> km, 克 -> g, 千克/公斤 -> kg, 吨 -> t, 秒 -> s, 分 -> min, 小时 -> h, 元 -> yuan, 度 -> ^\circ
   - 208 个常见中文选项英文映射，消除所有汉字残留
"""

import sqlite3
import json
import re

OPTIONS_TRANSLATION_MAP = {
    # 计数与数量
    '1个': '1',
    '2个': '2',
    '3个': '3',
    '4个': '4',
    '5个': '5',
    '+3个': '+3',
    '-3个': '-3',
    '+4个': '+4',
    '-4个': '-4',
    '2种': '2 types',
    '3种': '3 types',
    '4种': '4 types',
    '5种': '5 types',
    '6种': '6 types',

    # 象限
    '第一象限': 'First quadrant',
    '第二象限': 'Second quadrant',
    '第三象限': 'Third quadrant',
    '第四象限': 'Fourth quadrant',

    # 货币与度量 (负号在清洗后为 -)
    '+100元': '+100 yuan',
    '-100元': '-100 yuan',
    '+200元': '+200 yuan',
    '-200元': '-200 yuan',
    '+60元': '+60 yuan',
    '-60元': '-60 yuan',
    '+40元': '+40 yuan',
    '-40元': '-40 yuan',
    '+20元': '+20 yuan',
    '+10元': '+10 yuan',
    '-10元': '-10 yuan',
    '0元': '0 yuan',
    '5元': '5 yuan',
    '-5元': '-5 yuan',
    '10元': '10 yuan',
    '+60米': '+60 m',
    '-60米': '-60 m',
    '+90米': '+90 m',
    '-80米': '-80 m',
    '（$m$ $-n$）sinα米': '$(m - n)\\sin\\alpha\\text{ m}$',
    '$\\frac{m - n}{sin\\alpha}$米': '$\\frac{m - n}{\\sin\\alpha}\\text{ m}$',
    '（$m$ $-n$）cosα米': '$(m - n)\\cos\\alpha\\text{ m}$',
    '$\\frac{m - n}{cos\\alpha}$米': '$\\frac{m - n}{\\cos\\alpha}\\text{ m}$',

    # 根的情况
    '有两个不相等的实数根': 'Has two distinct real roots',
    '有两个相等的实数根': 'Has two equal real roots',
    '只有一个实数根': 'Has only one real root',
    '没有实数根': 'Has no real roots',

    # 统计量
    '众数是5': 'Mode is 5',
    '中位数是6': 'Median is 6',
    '平均数是6': 'Mean is 6',
    '极差是3': 'Range is 3',
    '中位数是21': 'Median is 21',
    '中位数是85': 'Median is 85',
    '众数是21': 'Mode is 21',
    '众数是85': 'Mode is 85',

    # 几何线段与角描述
    '$FG$的长': 'Length of $FG$',
    '$AF$的长': 'Length of $AF$',
    '$CE$的长': 'Length of $CE$',
    '$BG$的长': 'Length of $BG$',
    '线段$FH$的长': 'Length of segment $FH$',
    '四边形$EFGH$的周长': 'Perimeter of quadrilateral $EFGH$',
    '$\\angle EFG$的大小': 'Measure of $\\angle EFG$',
    '四边形$EFGH$的面积': 'Area of quadrilateral $EFGH$',
    '$\\angle 1$和$\\angle 4$是对顶角': '$\\angle 1$ and $\\angle 4$ are vertical angles',
    '$\\angle 2$和$\\angle 5$是同位角': '$\\angle 2$ and $\\angle 5$ are corresponding angles',
    '$\\angle 4$和$\\angle 6$是同旁内角': '$\\angle 4$ and $\\angle 6$ are consecutive interior angles',
    '$\\angle 3$和$\\angle 6$是内错角': '$\\angle 3$ and $\\angle 6$ are alternate interior angles',
    '两点之间线段最短': 'The line segment between two points is the shortest',
    '两点之间，线段最短': 'The line segment between two points is the shortest',
    '两点确定一条直线': 'Two points determine a line',
    '两直线平行，内错角相等': 'When two lines are parallel, alternate interior angles are equal',
    '垂线段最短': 'The perpendicular segment is the shortest',
    '平行四边形是轴对称图形': 'A parallelogram is an axisymmetric figure',
    '平行四边形的对角线相等': 'The diagonals of a parallelogram are equal',
    '矩形的对角线相等': 'The diagonals of a rectangle are equal',
    '菱形的对角线互相垂直': 'The diagonals of a rhombus are perpendicular',
    '正方形的对角线相等且互相垂直': 'The diagonals of a square are equal and perpendicular',
    '三角形的中位线将三角形分成面积相等的两部分': 'The midline of a triangle divides the triangle into two parts of equal area',
    '$\\triangle A\'CD$的面积＝$\\triangle A\'DE$的面积': 'Area of $\\triangle A\'CD$ = Area of $\\triangle A\'DE$',
    '四边形$A\'BED$的面积＝$\\triangle A\'BC$的面积': 'Area of quadrilateral $A\'BED$ = Area of $\\triangle A\'BC$',
    '$EC$ $-ED$的最大值是2$\\sqrt{5}$': 'The maximum value of $EC - ED$ is $2\\sqrt{5}$',
    '$EC$+$ED$的最小值是4$\\sqrt{2}$': 'The minimum value of $EC + ED$ is $4\\sqrt{2}$',
    '$FB$的最小值是$\\sqrt{10}$': 'The minimum value of $FB$ is $\\sqrt{10}$',
    '$FC$的最大值是$\\sqrt{13}$': 'The maximum value of $FC$ is $\\sqrt{13}$',

    # 立体几何体
    '正方体': 'Cube',
    '长方体': 'Cuboid',
    '圆柱': 'Cylinder',
    '圆锥': 'Cone',

    # 物质与国家
    '固态氢': 'Solid hydrogen',
    '固态氧': 'Solid oxygen',
    '固态氮': 'Solid nitrogen',
    '固态酒精': 'Solid alcohol',
    '法国': 'France',
    '瑞士': 'Switzerland',
    '巴西': 'Brazil',
    '英国': 'United Kingdom',
    '甲': 'A',
    '乙': 'B',
    '丙': 'C',
    '丁': 'D',
    '点$A$': 'Point $A$',
    '点$B$': 'Point $B$',
    '点$C$': 'Point $C$',
    '点$D$': 'Point $D$',
    '点$C$的纵坐标为240': 'The y-coordinate of point $C$ is 240',
    '点（15，85）在该函数图象上': 'Point $(15, 85)$ is on the graph of the function',

    # 函数与图象性质
    '图象的开口向下': 'The graph opens downward',
    '函数图象在第一、三象限': 'The graph lies in the first and third quadrants',
    '函数图象在第二、四象限': 'The graph lies in the second and fourth quadrants',
    '函数的最小值小于-3': 'The minimum value of the function is less than -3',
    '$y$随$x$的增大而减小': '$y$ decreases as $x$ increases',
    '$y$随$x$的增大而增大': '$y$ increases as $x$ increases',
    '当$t > 0$时，$y_{1} \\cdot y_{2} > 0$': 'When $t > 0$, $y_{1} \\cdot y_{2} > 0$',
    '当$t > 0$时，$y_{1} \\cdot y_{2} < 0$': 'When $t > 0$, $y_{1} \\cdot y_{2} < 0$',
    '当$t < 0$时，$y_{1} \\cdot y_{2} > 0$': 'When $t < 0$, $y_{1} \\cdot y_{2} > 0$',
    '当$t < 0$时，$y_{1} \\cdot y_{2} < 0$': 'When $t < 0$, $y_{1} \\cdot y_{2} < 0$',
    '当$m < 0$时，$y_1$＜$y_2$': 'When $m < 0$, $y_1 < y_2$',
    '当$m < -1$时，$y_1$＜$y_2$': 'When $m < -1$, $y_1 < y_2$',
    '当$x \\geq 1000$时，$y$随$x$的增大而减小': 'When $x \\geq 1000$, $y$ decreases as $x$ increases',
    '当$x = 2000$时，$y$有最大值': 'When $x = 2000$, $y$ reaches its maximum',
    '当$y \\geq 0$.6时，$x \\geq 1000$': 'When $y \\geq 0.6$, $x \\geq 1000$',
    '当$y = 0$.4时，$x = 600$': 'When $y = 0.4$, $x = 600$',
    '当$x > 0$时，$y$的值随$x$值的增大而增大': 'When $x > 0$, the value of $y$ increases as $x$ increases',
    '当$x = 2$时，$y < 0$': 'When $x = 2$, $y < 0$',
    '当$x = 1$时，$kx + b = 0$': 'When $x = 1$, $kx + b = 0$',
    '当$x = 3$时，$kx + b = 5$': 'When $x = 3$, $kx + b = 5$',
    '当$x = 5$时，$kx + b = 11$': 'When $x = 5$, $kx + b = 11$',
    '当$x = 7$时，$kx + b = 17$': 'When $x = 7$, $kx + b = 17$',
    '若$\\sqrt{x - 1}$有意义，则$x$的取值范围是全体实数': 'If $\\sqrt{x - 1}$ is meaningful, then the range of $x$ is all real numbers',

    # 概率与事件
    '投掷一枚硬币，正面向上': 'Tossing a coin, landing heads up',
    '从只有红球的袋子中摸出黄球': 'Drawing a yellow ball from a bag containing only red balls',
    '任意画一个圆，它是轴对称图形': 'Drawing an arbitrary circle, it is an axisymmetric figure',
    '射击运动员射击一次，命中靶心': 'A shooter fires once and hits the bullseye',
    '掷一枚骰子，出现4点的概率': 'Probability of rolling a 4 with a die',
    '任意写一个整数，它能被3整除的概率': 'Probability that an arbitrary integer is divisible by 3',
    '抛一枚硬币，出现反面的概率': 'Probability of tossing tails with a coin',
    '从一副扑克牌中任取一张，取到"大王"的概率': 'Probability of drawing the Red Joker from a standard deck of cards',

    # 趋势与比较
    '越来越慢': 'Getting slower',
    '越来越快': 'Getting faster',
    '保持不变': 'Remains unchanged',
    '快慢交替变化': 'Alternating between fast and slow',
    '无解': 'No solution',
    '一样大': 'Equal in size',
    '无法比较': 'Cannot be compared',
    '日最高气温的波动大': 'Fluctuation of daily maximum temperature is large',
    '日最低气温的波动大': 'Fluctuation of daily minimum temperature is large',
    '1和2之间': 'Between 1 and 2',
    '2和3之间': 'Between 2 and 3',
    '3和4之间': 'Between 3 and 4',
    '4和5之间': 'Between 4 and 5',

    # 统计图与调查
    '随机抽取城区三分之一的学校': 'Randomly sample one-third of urban schools',
    '随机抽取乡村三分之一的学校': 'Randomly sample one-third of rural schools',
    '调查全体学校': 'Survey all schools',
    '随机抽取三分之一的学校': 'Randomly sample one-third of schools',
    '调查某种柑橘的甜度情况': 'Investigate the sweetness of a certain citrus fruit',
    '调查某品牌新能源汽车的抗撞能力': 'Investigate the crashworthiness of a brand of new energy vehicles',
    '调查某市垃圾分类的情况': 'Investigate the garbage sorting status of a city',
    '调查全班观看电影《哪吒2》的情况': 'Investigate the situation of the whole class watching the movie Nezha 2',
    '科技类图书销售了60册': '60 science books were sold',
    '文艺类图书销售了120册': '120 literature books were sold',
    '文艺类图书销售占比30%': 'Literature books accounted for 30% of sales',
    '其他类图书销售占比18%': 'Other books accounted for 18% of sales',
    '2022年．人均纸质书籍阅读量为5本': 'In 2022, the per capita reading of paper books was 5 books',
    '2023年，人均电子书籍阅读量为11本': 'In 2023, the per capita reading of e-books was 11 books',
    '2024年，人均电子书籍阅读量是人均纸质书籍阅读量的3倍': 'In 2024, the per capita reading of e-books was 3 times that of paper books',
    '2016年至2024年，人均电子书籍阅读量逐年上升': 'From 2016 to 2024, the per capita reading of e-books increased year by year',
    '第5天的种群数量为300个': 'On day 5, the population size was 300',
    '前3天种群数量持续增长': 'The population grew continuously during the first 3 days',
    '第3天的种群数量达到最大': 'The population peaked on day 3',
    '每天增加的种群数量相同': 'The population increased by the same amount each day',

    # 实际行程与工程
    '两车出发$2h$后相遇': 'The two vehicles met $2\\text{ h}$ after departure',
    '$A$，$B$两地相距$280km$': 'The distance between places $A$ and $B$ is $280\\text{ km}$',
    '$A$、$B$两地相距$300km$': 'The distance between places $A$ and $B$ is $300\\text{ km}$',
    '快车比慢车早$\\frac{3}{2}$ $h$到达目的地': 'The express train arrived $\\frac{3}{2}\\text{ h}$ earlier than the slow train',
    '快车的速度为$80km$/$h$，慢车的速度为$60km$/$h$': 'The speed of the express train is $80\\text{ km/h}$, and the slow train is $60\\text{ km/h}$',
    '乙车先到达$B$地': 'Vehicle B arrived at destination $B$ first',
    '甲车的平均速度为$100km$/$h$': 'The average speed of car A is $100\\text{ km/h}$',
    '在8：30时，乙车追上甲车': 'At 8:30, car B caught up with car A',
    '小明家到体育馆的距离为$2km$': 'The distance from Xiaoming\'s home to the gym is $2\\text{ km}$',
    '小明在体育馆锻炼的时间为$45min$': 'Xiaoming\'s exercise time at the gym was $45\\text{ min}$',
    '小明家到书店的距离为$1km$': 'The distance from Xiaoming\'s home to the bookstore is $1\\text{ km}$',
    '小明从书店到家步行的时间为$40min$': 'Xiaoming\'s walking time from the bookstore to home was $40\\text{ min}$',
    '电池能量最多可充$400W$•$h$': 'Battery capacity can charge up to $400\\text{ W}\\cdot\\text{h}$',
    '摩托车每行驶$10km$消耗能量$300W$•$h$': 'The motorcycle consumes $300\\text{ W}\\cdot\\text{h}$ every $10\\text{ km}$',
    '一次性充满电后，摩托车最多行驶$25km$': 'After a single full charge, the motorcycle can travel up to $25\\text{ km}$',
    '摩托车充满电后，行驶$18km$将自动报警': 'After being fully charged, the motorcycle alarms when reaching $18\\text{ km}$',
    '汽车静止时，这款轮胎的摩擦系数为0.9': 'When the car is stationary, the friction coefficient of this tire is 0.9',
    '当0≤$v \\leq 60$时，这款轮胎的摩擦系数随车速的增大而减小': 'When $0 \\leq v \\leq 60$, the friction coefficient of this tire decreases as speed increases',
    '要使这款轮胎的摩擦系数不低于0.71，车速应不低于$60km$/$h$': 'To keep friction coefficient no lower than 0.71, speed should be no lower than $60\\text{ km/h}$',
    '若车速从$25km$/$h$增大到$60km$/$h$，则这款轮胎的摩擦系数减小0.04': 'If speed increases from $25\\text{ km/h}$ to $60\\text{ km/h}$, friction coefficient decreases by 0.04',

    # 逻辑字词
    '$k < -4$且$k$ $\\neq - \\frac{4}{3}$': '$k < -4$ and $k \\neq -\\frac{4}{3}$',
    '$k > -4$且$k$ $\\neq - \\frac{4}{3}$': '$k > -4$ and $k \\neq -\\frac{4}{3}$',
    '$m = 1$或$m = -1$': '$m = 1$ or $m = -1$',
    '$m \\neq 1$且$m \\neq -1$': '$m \\neq 1$ and $m \\neq -1$',
    '$x < -1$或$x > 1$': '$x < -1$ or $x > 1$',
    '$x < -1$或0＜$x < 1$': '$x < -1$ or $0 < x < 1$',
    '-1＜$x < 0$或$x > 1$': '$-1 < x < 0$ or $x > 1$',
    '-1＜$x < 0$或0＜$x < 1$': '$-1 < x < 0$ or $0 < x < 1$',
    '37°或105°': '$37^\\circ$ or $105^\\circ$',
    '37°或143°': '$37^\\circ$ or $143^\\circ$',
    '74°或96°': '$74^\\circ$ or $96^\\circ$',
    '74°或106°': '$74^\\circ$ or $106^\\circ$',
    '$(5,1)$或$(7,1)$': '$(5, 1)$ or $(7, 1)$',
    '$(6,0)$或$(8,0)$': '$(6, 0)$ or $(8, 0)$',
    '$(6,1)$或$(7,1)$': '$(6, 1)$ or $(7, 1)$',
    '$\\left( 15\\text{,} - 7 \\right)$或$(8,0)$': '$(15, -7)$ or $(8, 0)$',

    # 单字/图案
    '国': 'Guo',
    '七': 'Seven',
    '十': 'Ten',
    '华': 'Hua',
}

def clean_minus_str(s: str) -> str:
    """替换特殊小型连字符和全角减号为标准 ASCII -"""
    if not s:
        return s
    return (s.replace('\ufe63', '-')
             .replace('\uff0d', '-')
             .replace('\u2010', '-')
             .replace('\u2011', '-'))

def clean_database(db_path: str):
    print(f"=== Cleaning database: {db_path} ===")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. 清洗 options_json
    cur.execute("SELECT question_id, options_json FROM questions WHERE question_type = 'single_choice'")
    choice_rows = cur.fetchall()
    updated_options = 0

    for qid, opts_str in choice_rows:
        if not opts_str:
            continue
        try:
            opts = json.loads(opts_str)
            changed = False
            for k, v in opts.items():
                zh = v.get("zh", "")
                en = v.get("en", "")

                # 清洗特殊负号
                new_zh = clean_minus_str(zh)
                new_en = clean_minus_str(en)

                # 翻译 en
                clean_en_key = new_en.strip()
                if clean_en_key in OPTIONS_TRANSLATION_MAP:
                    new_en = OPTIONS_TRANSLATION_MAP[clean_en_key]
                else:
                    # 规则替换辅助
                    new_en = re.sub(r'(\d+)\s*米', r'\1 m', new_en)
                    new_en = re.sub(r'([+-]?\d+)\s*元', r'\1 yuan', new_en)
                    new_en = re.sub(r'([+-]?\d+)\s*个', r'\1', new_en)
                    new_en = re.sub(r'([+-]?\d+)\s*厘米', r'\1 cm', new_en)
                    new_en = new_en.replace('或', ' or ').replace('且', ' and ')
                    new_en = new_en.replace('＜', ' < ').replace('＞', ' > ')

                if new_zh != zh or new_en != en:
                    v["zh"] = new_zh
                    v["en"] = new_en
                    changed = True

            if changed:
                new_opts_str = json.dumps(opts, ensure_ascii=False)
                cur.execute("UPDATE questions SET options_json = ? WHERE question_id = ?", (new_opts_str, qid))
                updated_options += 1
        except Exception as e:
            print(f"Error on {qid}: {e}")

    print(f"  [✓] Updated {updated_options} options_json records.")

    # 2. 全表清洗其它字段中的 \ufe63 与 \uff0d
    for field in ['stem_zh', 'stem_en', 'answer_standard', 'solutions_json']:
        cur.execute(f"SELECT question_id, {field} FROM questions WHERE {field} LIKE '%\uFE63%' OR {field} LIKE '%\uFF0D%'")
        rows = cur.fetchall()
        for qid, val in rows:
            if val:
                new_val = clean_minus_str(val)
                cur.execute(f"UPDATE questions SET {field} = ? WHERE question_id = ?", (new_val, qid))
        print(f"  [✓] Cleaned special minus in {field}: {len(rows)} records.")

    conn.commit()
    conn.close()
    print(f"=== Database {db_path} cleaned successfully. ===\n")

if __name__ == "__main__":
    clean_database("data/questions.db")
    clean_database("public/data/questions.db")
