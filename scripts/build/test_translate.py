import sqlite3
import re

def translate_stem(stem_zh):
    if not stem_zh:
        return ""
    
    # 1. Protect math formulas and image tokens
    math_tokens = []
    def save_math(m):
        math_tokens.append(m.group(0))
        return f"__MATH_{len(math_tokens)-1}__"
    
    img_tokens = []
    def save_img(m):
        img_tokens.append(m.group(0))
        return f"__IMG_{len(img_tokens)-1}__"
    
    text = re.sub(r'\[\[IMG:\d+\]\]', save_img, stem_zh)
    text = re.sub(r'\$\$[^\$]+\$\$|\$[^\$]+\$', save_math, text)
    
    # Common full-sentence templates
    templates = [
        (r"^下列各式中，计算正确的是（\s*）", "Which of the following calculations is correct? ( )"),
        (r"^下列运算正确的是（\s*）", "Which of the following operations is correct? ( )"),
        (r"^下列计算正确的是（\s*）", "Which of the following calculations is correct? ( )"),
        (r"^下列说法正确的是（\s*）", "Which of the following statements is correct? ( )"),
        (r"^下列说法错误的是（\s*）", "Which of the following statements is incorrect? ( )"),
        (r"^下列结论正确的是（\s*）", "Which of the following conclusions is correct? ( )"),
        (r"^下列判断正确的是（\s*）", "Which of the following judgments is correct? ( )"),
        (r"^下列图形中，既是轴对称图形又是中心对称图形的是（\s*）", "Which of the following figures is both axisymmetric and centrally symmetric? ( )"),
        (r"^下列图形中，是轴对称图形的是（\s*）", "Which of the following figures is an axisymmetric figure? ( )"),
        (r"^下列图形中，是中心对称图形的是（\s*）", "Which of the following figures is a centrally symmetric figure? ( )"),
        (r"^下列各数中，是无理数的是（\s*）", "Which of the following numbers is an irrational number? ( )"),
        (r"^下列各数中，是负数的是（\s*）", "Which of the following numbers is a negative number? ( )"),
        (r"^下列各数中，比(.*)大的数是（\s*）", r"Among the following real numbers, the number greater than \1 is ( )"),
        (r"^下列各数中，最小的数是（\s*）", "Among the following numbers, the smallest number is ( )"),
        (r"^下列各数中，最大的数是（\s*）", "Among the following numbers, the largest number is ( )"),
    ]
    
    for pat, repl in templates:
        if re.search(pat, text):
            text = re.sub(pat, repl, text)
            break
            
    # Dictionary replacements
    glossary = [
        ("如图1，", "As shown in Figure 1, "),
        ("如图2，", "As shown in Figure 2, "),
        ("如图，", "As shown in the figure, "),
        ("在平面直角坐标系中，", "In a plane rectangular coordinate system, "),
        ("在平面直角坐标系xOy中，", "In a plane rectangular coordinate system xOy, "),
        ("在直角坐标系中，", "In a rectangular coordinate system, "),
        ("在Rt△ABC中，", "In Rt△ABC, "),
        ("在△ABC中，", "In △ABC, "),
        ("在正方形ABCD中，", "In square ABCD, "),
        ("在矩形ABCD中，", "In rectangle ABCD, "),
        ("在菱形ABCD中，", "In rhombus ABCD, "),
        ("在▱ABCD中，", "In parallelogram ABCD, "),
        ("在平行四边形ABCD中，", "In parallelogram ABCD, "),
        ("解方程组：", "Solve the system of equations: "),
        ("解方程：", "Solve the equation: "),
        ("解不等式组：", "Solve the system of inequalities: "),
        ("解不等式：", "Solve the inequality: "),
        ("先化简，再求值：", "Simplify first, then evaluate: "),
        ("化简求值：", "Simplify and evaluate: "),
        ("分解因式：", "Factor: "),
        ("因式分解：", "Factor: "),
        ("化简：", "Simplify: "),
        ("计算：", "Calculate: "),
        ("求证：", "Prove: "),
        ("求：", "Find: "),
        ("科学记数法表示为", "expressed in scientific notation is "),
        ("科学记数法表示", "expressed in scientific notation "),
        ("科学计数法", "scientific notation"),
        ("的相反数是", "The opposite number of "),
        ("相反数是", "opposite number is "),
        ("相反数", "opposite number"),
        ("的绝对值是", "The absolute value of "),
        ("绝对值是", "absolute value is "),
        ("绝对值", "absolute value"),
        ("的倒数是", "The reciprocal of "),
        ("倒数是", "reciprocal is "),
        ("倒数", "reciprocal"),
        ("自变量x的取值范围是", "the range of values of the independent variable x is "),
        ("自变量的取值范围是", "the range of values of the independent variable is "),
        ("取值范围是", "the range of values is "),
        ("取值范围", "range of values"),
        ("有两个不相等的实数根", "has two distinct real roots"),
        ("有两个相等的实数根", "has two equal real roots"),
        ("没有实数根", "has no real roots"),
        ("一元二次方程", "quadratic equation"),
        ("一元一次方程", "linear equation"),
        ("二元一次方程组", "system of linear equations"),
        ("反比例函数", "inverse proportional function"),
        ("正比例函数", "direct proportional function"),
        ("一次函数", "linear function"),
        ("二次函数", "quadratic function"),
        ("抛物线", "parabola"),
        ("对称轴", "axis of symmetry"),
        ("顶点坐标", "coordinates of the vertex"),
        ("顶点", "vertex"),
        ("交点坐标", "coordinates of intersection"),
        ("交点", "intersection point"),
        ("垂径定理", "perpendicular chord theorem"),
        ("切线的判定", "determination of tangent line"),
        ("切线", "tangent line"),
        ("圆周角", "inscribed angle"),
        ("圆心角", "central angle"),
        ("扇形面积", "area of a sector"),
        ("扇形", "sector"),
        ("弧长", "arc length"),
        ("半径", "radius"),
        ("直径", "diameter"),
        ("全等三角形", "congruent triangles"),
        ("相似三角形", "similar triangles"),
        ("等腰三角形", "isosceles triangle"),
        ("等边三角形", "equilateral triangle"),
        ("直角三角形", "right triangle"),
        ("平行四边形", "parallelogram"),
        ("矩形", "rectangle"),
        ("菱形", "rhombus"),
        ("正方形", "square"),
        ("梯形", "trapezoid"),
        ("中位线", "midline"),
        ("垂直平分线", "perpendicular bisector"),
        ("角平分线", "angle bisector"),
        ("对角线", "diagonal"),
        ("勾股定理", "Pythagorean theorem"),
        ("轴对称图形", "axisymmetric figure"),
        ("中心对称图形", "centrally symmetric figure"),
        ("中心对称", "centrally symmetric"),
        ("轴对称", "axisymmetric"),
        ("位似中心", "center of homothety"),
        ("位似比", "homothetic ratio"),
        ("位似图形", "homothetic figure"),
        ("位似", "homothetic"),
        ("旋转角", "angle of rotation"),
        ("顺时针旋转", "rotate clockwise"),
        ("逆时针旋转", "rotate counterclockwise"),
        ("旋转", "rotation"),
        ("平移", "translation"),
        ("翻折", "folding"),
        ("折叠", "folding"),
        ("三视图", "three-view drawing"),
        ("主视图", "front view"),
        ("左视图", "left view"),
        ("俯视图", "top view"),
        ("几何体", "geometric solid"),
        ("概率", "probability"),
        ("中位数", "median"),
        ("众数", "mode"),
        ("平均数", "mean"),
        ("加权平均数", "weighted average"),
        ("方差", "variance"),
        ("频数分布直方图", "frequency histogram"),
        ("扇形统计图", "pie chart"),
        ("折线统计图", "line chart"),
        ("条形统计图", "bar chart"),
        ("抽样调查", "sample survey"),
        ("样本容量", "sample size"),
        ("样本", "sample"),
        ("总体", "population"),
        ("必然事件", "certain event"),
        ("不可能事件", "impossible event"),
        ("随机事件", "random event"),
        ("的最大值为", "the maximum value is "),
        ("的最小值为", "the minimum value is "),
        ("最大值", "maximum value"),
        ("最小值", "minimum value"),
        ("的长为", "the length of is "),
        ("的面积为", "the area of is "),
        ("的度数为", "the degree of is "),
        ("的值为", "the value of is "),
        ("的值是", "the value of is "),
        ("的值等于", "the value of equals "),
        ("等于", " equals "),
        ("若是", "If it is "),
        ("如果", "If "),
        ("若", "If "),
        ("已知", "Given "),
        ("则", ", then "),
        ("满足", "satisfies "),
        ("连接", "connect "),
        ("延长", "extend "),
        ("相交于点", "intersects at point "),
        ("交于点", "intersects at point "),
        ("垂直于", "is perpendicular to "),
        ("平行于", "is parallel to "),
        ("经过点", "passes through point "),
        ("过点", "through point "),
        ("分别", "respectively "),
        ("中点", "midpoint"),
        ("动点", "moving point"),
        ("结论", "conclusion"),
        ("正确的是", "is correct"),
        ("错误的是", "is incorrect"),
        ("的值", "the value"),
        ("求", "find "),
        ("证明", "prove "),
        ("（　　）", "( )"),
        ("（   ）", "( )"),
        ("（ ）", "( )"),
        ("（\u3000\u3000）", "( )"),
        ("(\u3000\u3000)", "( )"),
    ]
    
    for zh, en in glossary:
        text = text.replace(zh, en)
        
    # Clean redundant spaces
    text = re.sub(r' +', ' ', text).strip()
    
    # Restore image tokens
    for i, tok in enumerate(img_tokens):
        text = text.replace(f"__IMG_{i}__", tok)
        
    # Restore math tokens
    for i, tok in enumerate(math_tokens):
        text = text.replace(f"__MATH_{i}__", tok)
        
    return text

conn = sqlite3.connect('data/questions.db')
cur = conn.cursor()
rows = cur.execute('SELECT question_id, stem_zh FROM questions WHERE content_status = \"done\" LIMIT 10;').fetchall()
for qid, zh in rows:
    print(qid)
    print("ZH:", zh[:60])
    print("EN:", translate_stem(zh)[:80])
    print("---")
