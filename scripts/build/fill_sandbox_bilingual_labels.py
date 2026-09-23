import sqlite3
import json
import os
import re

SLIDER_NAMES_MAP = {
    "一次项系数 b": "Linear Coefficient b",
    "二次项系数 a": "Quadratic Coefficient a",
    "位似中心 Ox": "Homothetic Center Ox",
    "位似中心 Oy": "Homothetic Center Oy",
    "位似比 k": "Homothetic Ratio k",
    "倾斜角 α": "Inclination Angle α",
    "内切圆半径 r": "Inradius r",
    "分子 p": "Numerator p",
    "分母 q": "Denominator q",
    "分点C位置": "Dividing Point C Position",
    "切线端点距 d": "Tangent Segment Distance d",
    "初始位置 x₀": "Initial Position x₀",
    "判定准则": "Criterion",
    "判定模式 (1:SSS 2:SAS 3:ASA)": "Congruence Mode (1:SSS 2:SAS 3:ASA)",
    "判定路径": "Proof Path",
    "割线水位 y=k": "Secant Line Level y=k",
    "动斜足横坐标 C": "Moving Foot Abscissa C",
    "动点参数 t": "Moving Point Parameter t",
    "动点极角 θP": "Polar Angle θP",
    "动点横坐标 x": "Moving Point Abscissa x",
    "动轴 x=h": "Moving Axis x=h",
    "勾 a": "Leg a",
    "半径 r": "Radius r",
    "单位长度": "Unit Length",
    "原四边形构型": "Original Quadrilateral Config",
    "反比例系数 k": "Inverse Proportionality Coefficient k",
    "取样点 x": "Sample Point x",
    "圆半径 r": "Circle Radius r",
    "圆周角动点极角 θC": "Inscribed Angle Moving Polar Angle θC",
    "圆心角 n°": "Central Angle n°",
    "圆心距 d": "Center Distance d",
    "垂直对角线 d2": "Vertical Diagonal d2",
    "垂直平移": "Vertical Translation",
    "垂直平移 dy": "Vertical Translation dy",
    "垂线段高 PH": "Perpendicular Height PH",
    "基准半径 r": "Base Radius r",
    "外接圆与内切圆": "Circumcircle & Incircle",
    "夹角 α": "Included Angle α",
    "对称对折 t": "Symmetry Folding t",
    "对称轴位置 x0": "Axis of Symmetry Position x0",
    "对称轴倾角 φ": "Axis Inclination Angle φ",
    "射线夹角 θ": "Ray Angle θ",
    "常数项 c": "Constant Term c",
    "平移 h": "Translation h",
    "平移 k": "Translation k",
    "平行线间距 d": "Parallel Lines Distance d",
    "底边宽度 BC": "Base Width BC",
    "底边宽度 w": "Base Width w",
    "底边长 a": "Base Length a",
    "开口系数 a": "Opening Coefficient a",
    "弦图模式": "Hypotenuse Diagram Mode",
    "弦心距 d": "Chord Distance d",
    "截线角度 α": "Transversal Angle α",
    "截距 b": "Intercept b",
    "所对弧跨度 ∠AOB": "Subtended Arc Span ∠AOB",
    "放大倍率": "Magnification",
    "斜率 k": "Slope k",
    "斜边动点 t": "Hypotenuse Moving Point t",
    "斜边长度 c": "Hypotenuse Length c",
    "旋转角 α": "Rotation Angle α",
    "旋转角 θ": "Rotation Angle θ",
    "旋转角度 θ": "Rotation Angle θ",
    "旋转过程 θ": "Rotation Progress θ",
    "显示对角线": "Show Diagonals",
    "正方形边长 a": "Square Side Length a",
    "比例系数 k": "Proportionality Coefficient k",
    "水平对角线 d1": "Horizontal Diagonal d1",
    "水平平移": "Horizontal Translation",
    "水平平移 dx": "Horizontal Translation dx",
    "点A横坐标 x₁": "Point A Abscissa x₁",
    "点A纵坐标 y₁": "Point A Ordinate y₁",
    "点B横坐标 x₂": "Point B Abscissa x₂",
    "直线L1截距 b₁": "Line L1 Intercept b₁",
    "直线L1斜率 k₁": "Line L1 Slope k₁",
    "直线L2截距 b₂": "Line L2 Intercept b₂",
    "直线L2斜率 k₂": "Line L2 Slope k₂",
    "直角边 a": "Right Leg a",
    "直角边 b": "Right Leg b",
    "相似比 k": "Similarity Ratio k",
    "相反数值 a": "Opposite Number a",
    "矩形宽 w": "Rectangle Width w",
    "矩形高 h": "Rectangle Height h",
    "端点偏转角 φ": "Endpoint Deflection Angle φ",
    "等腰臂长 b": "Isosceles Leg Length b",
    "线段全长 AB": "Segment Total Length AB",
    "线段基准长": "Segment Base Length",
    "股 b": "Leg b",
    "菱形相变模式": "Rhombus Transformation Mode",
    "被开方数 a": "Radicand a",
    "角 α 度数": "Angle α Degree",
    "边长 a": "Side Length a",
    "运动时间 t": "Motion Time t",
    "运动速度 v": "Motion Speed v",
    "邻边长 b": "Adjacent Side Length b",
    "锐角 A 度数": "Acute Angle A Degree",
    "闭区间右端 n": "Closed Interval Right Bound n",
    "闭区间左端 m": "Closed Interval Left Bound m",
    "顶点 A 横坐标": "Vertex A Abscissa",
    "顶点 A 纵坐标": "Vertex A Ordinate",
    "顶点 A 高度": "Vertex A Height",
    "顶点 C 横坐标": "Vertex C Abscissa",
    "顶点横坐标 h": "Vertex Abscissa h",
    "顶点纵坐标 k": "Vertex Ordinate k",
    "顶角 ∠A": "Vertex Angle ∠A",
}

INVARIANT_LABELS_MAP = {
    "OA距离": "Distance OA",
    "OB距离": "Distance OB",
    "一元二次方程判别式 Δ = b² - 4ac": "Quadratic Discriminant Δ = b² - 4ac",
    "三内角度数皆 60° (∠A=∠B=∠C=60°)": "Three Angles All 60° (∠A=∠B=∠C=60°)",
    "三点共线 ∠AOA' = 180° (中心平分)": "Collinear Points ∠AOA' = 180° (Center Bisected)",
    "三种表达式全息矩阵对称轴 x = h": "Three Form Matrix Axis of Symmetry x = h",
    "三角形内角和定理守恒": "Triangle Angle Sum Invariant",
    "三角形面积半衰守恒 S_△ = 1/2|k|": "Triangle Area Invariant S_△ = 1/2|k|",
    "三边对应比值 A'B':AB = k": "Corresponding Ratio A'B':AB = k",
    "三边对应比值 B'C':BC = k": "Corresponding Ratio B'C':BC = k",
    "两交点距离": "Distance Between Two Intersections",
    "两定点间距离": "Distance Between Two Fixed Points",
    "两直线几何交点纵坐标 y": "Two Lines Intersection Ordinate y",
    "两腰等长 AB = AC": "Equal Legs AB = AC",
    "中心对称等距守恒 OP = OP'": "Point Symmetry Equidistance OP = OP'",
    "中点四边形对边 1 与对角线半长": "Varignon Opposite Side 1 & Half Diagonal",
    "中点四边形对边 2 与对角线半长": "Varignon Opposite Side 2 & Half Diagonal",
    "中点四边形面积折半守恒 S_mid:S_orig ≡ 1:2": "Varignon Parallelogram Half Area Invariant S_mid:S_orig ≡ 1:2",
    "中线平分底边 BD = CD": "Median Bisects Base BD = CD",
    "乘积守恒不变量 xy = k": "Product Invariant xy = k",
    "二元一次方程组同解 x = (b₂ - b₁)/(k₁ - k₂)": "Linear System Solution x = (b₂ - b₁)/(k₁ - k₂)",
    "二次不等式解集区间 x² + c < k": "Quadratic Inequality Solution Interval x² + c < k",
    "交点弦长 |x₁ - x₂| = √Δ / |a|": "Intersection Chord Length |x₁ - x₂| = √Δ / |a|",
    "位置关系判定结论": "Positional Relationship Conclusion",
    "余弦值 (邻边/斜边)": "Cosine (Adjacent / Hypotenuse)",
    "全等三角形面积比率": "Congruent Triangle Area Ratio",
    "全长 AB": "Total Length AB",
    "内心到边 BC 距离 (r₁)": "Distance from Incenter to BC (r₁)",
    "内心性质: 到三边距离相等": "Incenter Property: Equal Distance to Three Sides",
    "内角 A": "Interior Angle A",
    "内角 B": "Interior Angle B",
    "内角 C": "Interior Angle C",
    "内角直角 ∠A = 90°": "Right Interior Angle ∠A = 90°",
    "内错角相等": "Alternate Interior Angles are Equal",
    "几何极值与顶点 (h, k)": "Extremum Vertex Coordinates (h, k)",
    "函数值 y = kx": "Function Value y = kx",
    "切线性质直角 ∠OAP = 90°": "Tangent Perpendicularity ∠OAP = 90°",
    "切线长 PA": "Tangent Segment PA",
    "切线长 PB": "Tangent Segment PB",
    "切线长定理 PA = PB": "Tangent Segments Theorem PA = PB",
    "割线三角形面积 S = 1/2 · 宽 · 高": "Secant Triangle Area S = 1/2 · Width · Height",
    "动点到圆心距离 OP": "Moving Point to Center Distance OP",
    "动点到对称中心距离": "Distance to Center of Symmetry",
    "动点平移位移方程 x = x₀ + vt": "Translation Displacement Equation x = x₀ + vt",
    "动轴所处形态 (h<m / m≤h≤n / h>n)": "Axis Position State (h<m / m≤h≤n / h>n)",
    "勾股平方和 a² + b²": "Pythagorean Sum of Squares a² + b²",
    "勾股面积守恒 a² + b² = c²": "Pythagorean Theorem Invariant a² + b² = c²",
    "区间最小值 y_min": "Interval Minimum y_min",
    "半弦长 AM": "Half Chord Length AM",
    "半弦长 MB": "Half Chord Length MB",
    "半径 r": "Radius r",
    "原点距离": "Distance to Origin",
    "原线段长 AB": "Original Segment Length AB",
    "双中点距离 MN = 1/2 AB": "Midsegment Length MN = 1/2 AB",
    "同位角相等": "Corresponding Angles are Equal",
    "同弧圆周角等于圆心角一半 ∠ACB:∠AOB ≡ 1:2": "Inscribed Angle Equals Half Central Angle ∠ACB:∠AOB ≡ 1:2",
    "同旁内角互补和": "Consecutive Interior Angles Sum",
    "同角三角函数平方和公式 sin²A + cos²A ≡ 1.00": "Pythagorean Trigonometric Identity sin²A + cos²A ≡ 1.00",
    "四边恒等长 a": "Four Sides Invariant Length a",
    "四边相等且四角皆直角": "Four Equal Sides & Four Right Angles",
    "圆公理闭环: 到定点距离恒等于定长": "Circle Axiom: Distance to Fixed Point Equals Constant",
    "圆半径 r": "Circle Radius r",
    "圆周角 ∠ACB": "Inscribed Angle ∠ACB",
    "圆心角 ∠AOB": "Central Angle ∠AOB",
    "圆心角度数 n": "Central Angle Measure n",
    "圆心距 d": "Center Distance d",
    "垂径定理平分弦 AM = MB": "Perpendicular Bisects Chord Theorem AM = MB",
    "垂线段长度 (理论最小值)": "Perpendicular Segment Length (Theoretical Minimum)",
    "基准半径 OA": "Base Radius OA",
    "外心与内心半径比 R:r ≡ 2.00": "Circumradius to Inradius Ratio R:r ≡ 2.00",
    "完全平方数夹逼不等式": "Perfect Square Squeeze Inequality",
    "实测三角形面积": "Measured Triangle Area",
    "实测垂线段长": "Measured Perpendicular Segment",
    "实测张角": "Measured Angle",
    "实测截距三角形面积": "Measured Intercept Triangle Area",
    "实测斜线段长": "Measured Oblique Segment",
    "实测角 AOB": "Measured Angle AOB",
    "实测角 BOC": "Measured Angle BOC",
    "对应点到中心距离相等 OA = OA'": "Equal Distance to Center OA = OA'",
    "对应线段比 A'B':AB = |k|": "Corresponding Segments Ratio A'B':AB = |k|",
    "对应角相等 ∠A = ∠A'": "Corresponding Angles are Equal ∠A = ∠A'",
    "对应边恒平行 AB ∥ A'B'": "Corresponding Sides Parallel AB ∥ A'B'",
    "对应边长差 |AB - A'B'|": "Difference of Corresponding Sides |AB - A'B'|",
    "对称中心平分对应点连线": "Center of Symmetry Bisects Segment",
    "对称点横向等距跨度": "Symmetric Points Horizontal Span",
    "对称轴方程 x = h": "Axis of Symmetry Equation x = h",
    "对角分别相等 ∠A = ∠C": "Opposite Angles are Equal ∠A = ∠C",
    "对角线 AC": "Diagonal AC",
    "对角线 BD": "Diagonal BD",
    "对角线互相垂直 ∠AOB = 90°": "Perpendicular Diagonals ∠AOB = 90°",
    "对角线互相平分验证": "Diagonals Bisect Each Other Verification",
    "对角线垂直且相等判定": "Perpendicular & Equal Diagonals Criterion",
    "对角线相等度量 (矩形判定)": "Equal Diagonals Measure (Rectangle Criterion)",
    "对边分别相等 AB = CD": "Opposite Sides are Equal AB = CD",
    "对边分别相等 BC = AD": "Opposite Sides are Equal BC = AD",
    "射线夹角张角 ∠AOB": "Ray Angle ∠AOB",
    "平移向量长度 AA' = |v|": "Translation Vector Length AA' = |v|",
    "平移对应线段平行且相等": "Translated Segments are Parallel and Equal",
    "平移线段长 A'B'": "Translated Segment Length A'B'",
    "平角互补守恒 ∠AOB + ∠BOC": "Supplementary Angles Sum ∠AOB + ∠BOC",
    "弦平方 c²": "Chord Square c²",
    "弦心距 OM = d": "Apothem OM = d",
    "弦心距勾股关系 d² + AM² = r²": "Apothem Pythagorean Relation d² + AM² = r²",
    "弧长公式 l = nπr/180": "Arc Length Formula l = nπr/180",
    "待定系数法动态解析式截距 b": "Dynamic Formula Intercept b",
    "截距三角形面积守恒 S = b²/(2|k|)": "Intercept Triangle Area Invariant S = b²/(2|k|)",
    "扇形面积公式 S = nπr²/360": "Sector Area Formula S = nπr²/360",
    "手拉手对应线段全等 AB' = A'B": "Hand-in-Hand Corresponding Segments Congruent AB' = A'B",
    "斜率待定求解 k = (y₂ - y₁)/(x₂ - x₁)": "Slope Formula k = (y₂ - y₁)/(x₂ - x₁)",
    "斜线段长度 PC = √(PH² + HC²)": "Oblique Segment Length PC = √(PH² + HC²)",
    "斜边中线与斜边比率 CM:AB ≡ 0.50": "Median to Hypotenuse Ratio CM:AB ≡ 0.50",
    "斜边长 AB": "Hypotenuse Length AB",
    "方程组解数与位置关系": "System Solutions & Geometric Position",
    "旋转角恒等 ∠AOA' = θ": "Rotation Angle Invariant ∠AOA' = θ",
    "无理数取值 √a 锁定": "Irrational Value √a Locked",
    "无理数小数部分": "Irrational Fractional Part",
    "有向位移量 Δx = vt": "Directed Displacement Δx = vt",
    "有理数坐标值 p/q": "Rational Coordinate p/q",
    "横轴截距点坐标 x = -b/k": "x-Intercept Coordinate x = -b/k",
    "正切值 (对边/邻边)": "Tangent (Opposite / Adjacent)",
    "正弦值 (对边/斜边)": "Sine (Opposite / Hypotenuse)",
    "正比例常商不变量 y/x": "Direct Proportion Constant Ratio y/x",
    "正负性质分类": "Sign Classification",
    "水平宽 (恒定)": "Horizontal Width (Constant)",
    "直线倾斜角": "Line Inclination Angle",
    "直角度数 ∠C = 90°": "Right Angle Measure ∠C = 90°",
    "相反数代数和 a + (-a)": "Opposite Numbers Sum a + (-a)",
    "矩形面积不变恒等式 S_矩形 = |k|": "Rectangle Area Invariant Identity S = |k|",
    "线段 AM": "Segment AM",
    "线段 NB": "Segment NB",
    "绝对值距离": "Absolute Value Distance",
    "绝对值距离对称恒等 |a|": "Absolute Distance Symmetry Identity |a|",
    "菱形面积公式 S = (d₁·d₂)/2": "Rhombus Area Formula S = (d₁·d₂)/2",
    "角 AOB": "Angle AOB",
    "解集区间宽度 Δx": "Solution Interval Width Δx",
    "距离 OA": "Distance OA",
    "距离 OA'": "Distance OA'",
    "轴对称全等保距守恒": "Axial Symmetry Isometry Invariant",
    "边长 A'B'": "Side Length A'B'",
    "边长 AB": "Side Length AB",
    "边长 a": "Side Length a",
    "邻补角 BOC = 180° - ∠AOB": "Supplementary Angle BOC = 180° - ∠AOB",
    "铅垂高 PQ = y_P - y_Q": "Vertical Height PQ = y_P - y_Q",
    "锐角 A 真实度数": "Acute Angle A Exact Measure",
    "镜像线段长 A'B'": "Reflected Segment Length A'B'",
    "顶点坐标 (h, k)": "Vertex Coordinates (h, k)",
    "顶点辐射距离比 OA':OA = |k|": "Vertex Radial Distance Ratio OA':OA = |k|",
    "高线直角 ∠ADC = 90° (三线合一)": "Altitude Right Angle ∠ADC = 90° (Three-in-One)",
}

def clean_and_update_db(db_path: str):
    if not os.path.exists(db_path):
        print(f"Skipping non-existent db: {db_path}")
        return

    print(f"\nProcessing {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT sandbox_id, param_sliders_json, invariants_display_json FROM concept_sandboxes")
    rows = cur.fetchall()

    updated_rows = 0
    total_sliders_updated = 0
    total_inv_updated = 0

    for s_id, s_json, inv_json in rows:
        new_s_json = s_json
        new_inv_json = inv_json

        if s_json:
            try:
                sliders = json.loads(s_json)
                for s in sliders:
                    name_zh = s.get("name") or s.get("nameZh") or s.get("id")
                    if name_zh in SLIDER_NAMES_MAP:
                        s["nameEn"] = SLIDER_NAMES_MAP[name_zh]
                        s["labelEn"] = SLIDER_NAMES_MAP[name_zh]
                        total_sliders_updated += 1
                    else:
                        print(f"  [Slider Warning] Unmapped slider in {s_id}: {name_zh}")
                new_s_json = json.dumps(sliders, ensure_ascii=False)
            except Exception as e:
                print(f"  Error parsing sliders in {s_id}: {e}")

        if inv_json:
            try:
                invariants = json.loads(inv_json)
                for inv in invariants:
                    label_zh = inv.get("labelZh") or inv.get("label")
                    if label_zh in INVARIANT_LABELS_MAP:
                        inv["labelEn"] = INVARIANT_LABELS_MAP[label_zh]
                        total_inv_updated += 1
                    else:
                        print(f"  [Invariant Warning] Unmapped invariant in {s_id}: {label_zh}")
                new_inv_json = json.dumps(invariants, ensure_ascii=False)
            except Exception as e:
                print(f"  Error parsing invariants in {s_id}: {e}")

        cur.execute(
            "UPDATE concept_sandboxes SET param_sliders_json = ?, invariants_display_json = ? WHERE sandbox_id = ?",
            (new_s_json, new_inv_json, s_id)
        )
        updated_rows += 1

    conn.commit()
    conn.close()
    print(f"  {db_path}: Updated {updated_rows} sandboxes. Sliders enriched: {total_sliders_updated}, Invariants enriched: {total_inv_updated}")

def verify_coverage(db_path: str):
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT sandbox_id, param_sliders_json, invariants_display_json FROM concept_sandboxes")
    rows = cur.fetchall()
    conn.close()

    missing_slider_en = 0
    total_sliders = 0
    missing_inv_en = 0
    total_inv = 0

    for s_id, s_json, inv_json in rows:
        if s_json:
            for s in json.loads(s_json):
                total_sliders += 1
                if not s.get("nameEn"):
                    missing_slider_en += 1
        if inv_json:
            for inv in json.loads(inv_json):
                total_inv += 1
                if not inv.get("labelEn"):
                    missing_inv_en += 1

    print(f"Verification for {db_path}:")
    print(f"  Sliders: {total_sliders - missing_slider_en}/{total_sliders} with nameEn (Missing: {missing_slider_en})")
    print(f"  Invariants: {total_inv - missing_inv_en}/{total_inv} with labelEn (Missing: {missing_inv_en})")

def main():
    dbs = ["data/sandbox.db", "public/data/sandbox.db", "dist/data/sandbox.db"]
    for db in dbs:
        clean_and_update_db(db)
        verify_coverage(db)

if __name__ == "__main__":
    main()
