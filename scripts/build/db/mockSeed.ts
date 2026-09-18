import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { buildDatabasePackages } from './buildDb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../../../tmp/test-data');

/**
 * 满足契约条款 CT-1 ~ CT-8 与铁律 9 (母题与真题物理隔离) 的 Mock 数据库填充脚本
 */
export function seedMockDatabase(targetDir: string = DB_DIR): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  // 1. 确保 DDL 结构就绪
  buildDatabasePackages(targetDir);

  const coreDbPath = path.join(targetDir, 'core.db');
  const masterDbPath = path.join(targetDir, 'master.db');
  const sandboxDbPath = path.join(targetDir, 'sandbox.db');
  const questionsDbPath = path.join(targetDir, 'questions.db');

  // 2. 插入 core.db 数据
  const coreSql = `
DELETE FROM knowledge_points;
DELETE FROM logic_lines;
DELETE FROM knowledge_combinations;
DELETE FROM knowledge_graph_semesters;

-- 12 条底层数学逻辑主线 (覆盖数与代数 A1~A4、图形与几何 G1~G6、统计概率 S1/P1)
INSERT INTO logic_lines (
    line_id, name_zh, name_en, domain, semester_span,
    origin_foundation_zh, origin_foundation_en,
    spiral_leaps_zh, spiral_leaps_en,
    methodology_zh, methodology_en,
    exam_matrix_zh, exam_matrix_en,
    master_example_id, flagship_model_id
) VALUES 
('A1', '数系扩充与运算律', 'Number Systems and Operational Laws', '数与代数', '7-1 ~ 8-1',
 '从自然数、整数到有理数、实数的数系螺旋扩充。', 'From natural and integers to rational and real numbers.',
 '正负数概念 -> 绝对值与数轴几何化 -> 实数运算律。', 'Positive/negative numbers to real number operations.',
 '数形结合、分类讨论。', 'Algebraic geometric unification and case analysis.',
 '实数混合运算、科学记数法与数轴最值。', 'Real arithmetic and number axis optimization.',
 'ME-LINE-A1', 'LM-7A-01'),

('A2', '代数式结构与恒等变形', 'Algebraic Expressions and Equivalent Transformations', '数与代数', '7-1 ~ 8-2',
 '用字母表示数，建立形式化代数结构。', 'Letter representation of numbers and formal algebra.',
 '整式加减 -> 乘法公式与因式分解 -> 分式化简。', 'Polynomial operations to factoring and fractions.',
 '整体代入、配方法、换元法。', 'Holistic substitution and completing the square.',
 '因式分解技巧、分式方程与代数恒等变形。', 'Factoring techniques and fractional equations.',
 'ME-LINE-A2', 'LM-7B-01'),

('A3', '约束关系的同解变形', 'Equivalent Transformations of Constraint Relations', '数与代数', '7-1 ~ 8-2',
 '等量与不等量关系的数学化表达与消元。', 'Mathematical representation of equality and inequality constraints.',
 '一元一次方程 -> 二元方程组 -> 不等式组 -> 一元二次方程。', 'Linear equations to linear systems, inequalities, and quadratics.',
 '消元法、降次法、方程建模。', 'Elimination, reduction of degree, and modeling.',
 '方程实际应用题、不等式与参数讨论、根与系数关系。', 'Applied equation modeling and Vieta formulas.',
 'ME-LINE-A3', 'LM-8A-02'),

('A4', '函数映射与数形转化', 'Function Mapping and Coordinate Geometry', '数与代数', '8-1 ~ 9-2',
 '变量依赖关系的图象化与解析化刻画。', 'Graphical and analytic characterization of variable dependencies.',
 '平面坐标系 -> 一次函数 -> 反比例函数 -> 二次函数。', 'Coordinates to linear, inverse, and quadratic functions.',
 '数形结合、待定系数法、几何动点函数化。', 'Graph-algebra unification and moving point functions.',
 '中考二次函数压轴题、铅垂高与线段比最值、抛物线综合。', 'Quadratic function extrema, plumb heights, and geometry synthesis.',
 'ME-LINE-A4', 'LM-9A-01'),

('G1', '欧氏公理体系奠基', 'Foundations of Euclidean Axioms', '图形与几何', '7-1 ~ 7-2',
 '从现实几何体抽象出点、线、面、角几何要素。', 'Abstraction of points, lines, planes, and angles from reality.',
 '线段与角 -> 相交线与垂直 -> 平行公理与判定。', 'Line segments to perpendicular and parallel axioms.',
 '演绎推理、转化化归。', 'Deductive reasoning and transformation.',
 '平行线辅助线构造、平行角折叠与动态角度计算。', 'Auxiliary construction and parallel angle calculations.',
 'ME-LINE-G1', 'LM-7A-02'),

('G2', '三角形判定与度量闭环', 'Triangle Determination and Metric System', '图形与几何', '7-2 ~ 8-2',
 '多边形的基本单元：全等保距与相似等比。', 'Basic unit of polygons: congruence isometry and similarity ratio.',
 '三角形内角和 -> 全等三角形判定 -> 轴对称与等腰 -> 相似三角形。', 'Triangle angle sum to congruence, symmetry, and similarity.',
 '构造全等、截长补短、倍长中线。', 'Congruence construction and median doubling.',
 '全等压轴证明、截长补短模型、相似比例方程。', 'Congruence synthesis and similarity ratio equations.',
 'ME-LINE-G2', 'LM-8A-03'),

('G3', '四边形演化与判定闭环', 'Quadrilateral Evolution and Characterization', '图形与几何', '8-2 ~ 9-1',
 '平行四边形沿边角约束的对称度升级链。', 'Symmetry enhancement chain from parallelograms to squares.',
 '平行四边形 -> 矩形/菱形 -> 正方形。', 'Parallelograms to rectangles, rhombi, and squares.',
 '类比归纳、逆向分析。', 'Analogy induction and backward analysis.',
 '特殊四边形动点轨迹、折叠中点多边形综合。', 'Special quadrilateral trajectories and folding synthesis.',
 'ME-LINE-G3', 'LM-8B-01'),

('G4', '几何度量与勾股演进', 'Geometric Measurement and Pythagorean Evolution', '图形与几何', '7-2 ~ 9-1',
 '从直观线段度量到面积割补证明，奠定初中公理化演绎基石。', 'From intuitive length measurement to area dissection proof.',
 '平面勾股 -> 空间距离 -> 向量点积与解析几何度量。', 'Planar Pythagoras to spatial metric and coordinate distance.',
 '数形结合、方程建模、构造辅助线化归。', 'Algebraic geometry unification and auxiliary construction.',
 '中考压轴折叠动点、面积最值与解直角三角形综合应用。', 'Folding transformations, extrema, and comprehensive triangles.',
 'ME-LINE-G4', 'LM-8A-01'),

('G5', '几何变换与空间投影', 'Geometric Transformations and Projections', '图形与几何', '8-1 ~ 9-2',
 '刚体变换（平移、轴对称、旋转）保持度量不变性。', 'Rigid transformations preserving metric invariance.',
 '平移与轴对称 -> 旋转变换 -> 手拉手旋转模型 -> 投影视图。', 'Translations to rotations, hand-in-hand models, and projections.',
 '动中求静、化静为动。', 'Finding invariance in dynamic transformations.',
 '手拉手旋转全等、费马点阿氏圆与极值几何变换。', 'Hand-in-hand rotations, Fermat points, and Apollonius circles.',
 'ME-LINE-G5', 'LM-9A-02'),

('G6', '解直角三角形体系', 'Solving Right Triangles System', '图形与几何', '9-1 ~ 9-2',
 '锐角三角函数将角度度量转化为线段比例度量。', 'Acute trigonometric functions converting angles to segment ratios.',
 '正弦余弦正切定义 -> 特殊角三角函数 -> 解直角三角形模型。', 'Trigonometric definitions to right triangle solving models.',
 '构造双直角三角形、母子三角形模型。', 'Dual right triangle and altitude models.',
 '仰角俯角方位角实际测量、边角复合方程。', 'Elevation angles, bearings, and composite trigonometric equations.',
 'ME-LINE-G6', 'LM-9A-03'),

('S1', '统计推断与数据特征', 'Statistical Inference and Data Characteristics', '统计与概率', '7-2 ~ 9-2',
 '用样本特征估计总体特征的数据科学思维。', 'Data science thinking: estimating population from sample features.',
 '抽样调查 -> 平均数中位数众数 -> 方差与离散度量。', 'Sampling surveys to mean, median, mode, and variance.',
 '统计推断、数据图表解读。', 'Statistical inference and chart reading.',
 '统计综合分析、复式图表决策。', 'Comprehensive statistical analysis and chart decision-making.',
 'ME-LINE-S1', 'LM-8B-02'),

('P1', '概率逻辑与频率逼近', 'Probability Logic and Frequency Approximation', '统计与概率', '8-2 ~ 9-2',
 '偶然性背后的确定性规律。', 'Deterministic regularity behind random phenomena.',
 '随机事件 -> 列表树状图古典概型 -> 频率逼近概率。', 'Random events to tree diagrams, classical probability, and frequency.',
 '枚举归纳、几何概型直观。', 'Enumeration, induction, and geometric intuition.',
 '中考双轮抽取、放回不放回概率模型。', 'Two-stage sampling and replacement probability models.',
 'ME-LINE-P1', 'LM-9A-04');

-- 20 个大纲考点 (跨 6 学期 7-1, 7-2, 8-1, 8-2, 9-1, 9-2 且分布在不同主线)
INSERT INTO knowledge_points (
    point_id, name_zh, name_en, grade, semester, domain, subcategory,
    primary_line_id, is_mandatory, svg_asset_zh, svg_asset_en,
    origin_story_zh, origin_story_en,
    intuitive_essence_zh, intuitive_essence_en,
    formal_definition_zh, formal_definition_en,
    intrinsic_variation_zh, intrinsic_variation_en,
    master_example_id, sandbox_id
) VALUES
('KP-001', '有理数与数轴', 'Rational Numbers and Number Axis', 7, 1, '数与代数', '有理数', 'A1', 1,
 'assets/concepts/KP-001-zh.svg', 'assets/concepts/KP-001-en.svg',
 '度量现实中方向相反的量，诞生了负数概念。', 'Measuring opposing quantities gave birth to negative numbers.',
 '数轴是一条规定了原点、正方向和单位长度的直线。', 'A number axis is a straight line with origin, direction, and unit length.',
 '整数和分数统称为有理数。数轴上的点与有理数一一对应。', 'Integers and fractions form rational numbers.',
 '相反数在数轴上关于原点对称，和为 0。', 'Opposite numbers are symmetric about origin; sum is 0.',
 'ME-KP001', NULL),

('KP-002', '绝对值的代数与几何意义', 'Algebraic and Geometric Absolute Value', 7, 1, '数与代数', '有理数', 'A1', 1,
 'assets/concepts/KP-002-zh.svg', 'assets/concepts/KP-002-en.svg',
 '非负距离概念抽象为绝对值运算。', 'Non-negative distance abstracted into absolute value.',
 '绝对值是数轴上表示该数的点到原点的距离。', 'Absolute value is distance from point to origin on number axis.',
 '当 a ≥ 0 时 |a| = a；当 a < 0 时 |a| = -a。', 'For a ≥ 0, |a| = a; for a < 0, |a| = -a.',
 '|x - a| 表示数轴上动点 x 到定点 a 的线段长度。', '|x - a| denotes distance from x to a.',
 'ME-KP002', NULL),

('KP-005', '一元一次方程及解法', 'Linear Equations in One Variable', 7, 1, '数与代数', '方程与不等式', 'A3', 1,
 'assets/concepts/KP-005-zh.svg', 'assets/concepts/KP-005-en.svg',
 '天平平衡原理启蒙了方程的等量同解变换。', 'Balance scales inspired equal transformations in equations.',
 '去分母、去括号、移项、合并同类项、系数化为 1。', 'Standard sequence of solving linear equations.',
 '只含有一个未知数且未知数的次数是 1 的整式方程。', 'Polynomial equation with one variable of degree 1.',
 '移项要变号，去分母漏乘常数项是高频失分陷阱。', 'Change signs when transposing; do not miss constant factors.',
 'ME-KP005', NULL),

('KP-006', '线段与角的基本性质', 'Properties of Line Segments and Angles', 7, 1, '图形与几何', '线与角', 'G1', 1,
 'assets/concepts/KP-006-zh.svg', 'assets/concepts/KP-006-en.svg',
 '两点之间线段最短是公理体系最直观的经验总结。', 'Shortest distance between two points as intuitive axiom.',
 '两点确定一条直线；两点之间线段最短。', 'Two points define a line; segment is shortest path.',
 '角是由两条具有公共端点的射线组成的图形。', 'An angle is formed by two rays sharing an endpoint.',
 '线段中点与角平分线是两等分度量核心概念。', 'Midpoints and bisectors bisect lengths and angles.',
 'ME-KP006', NULL),

('KP-009', '相交线与对顶角', 'Intersecting Lines and Vertical Angles', 7, 2, '图形与几何', '相交与平行', 'G1', 1,
 'assets/concepts/KP-009-zh.svg', 'assets/concepts/KP-009-en.svg',
 '剪刀开合展示对顶角相等与邻补角互补。', 'Scissors motion shows equality of vertical angles.',
 '对顶角相等；邻补角互补（和为 180°）。', 'Vertical angles are equal; supplementary angles sum to 180°.',
 '两条直线相交形成四对邻补角和两对对顶角。', 'Two intersecting lines yield vertical and adjacent angles.',
 '垂线段最短是点到直线距离的几何公理。', 'Perpendicular segment is shortest from point to line.',
 'ME-KP009', NULL),

('KP-010', '平行线的判定与性质', 'Determination and Properties of Parallel Lines', 7, 2, '图形与几何', '相交与平行', 'G1', 1,
 'assets/concepts/KP-010-zh.svg', 'assets/concepts/KP-010-en.svg',
 '铁轨永不相交的几何模型，欧氏第五公设奠基。', 'Parallel railway tracks representing Euclidean parallel lines.',
 '同位角相等、内错角相等、同旁内角互补。', 'Corresponding, alternate interior, and co-interior angles.',
 '在同一平面内不相交的两条直线叫做平行线。', 'Two non-intersecting lines in a plane are parallel.',
 '判定是角推线平行，性质是线平行推角关系，严防互逆混淆。', 'Distinguish between condition determination and properties.',
 'ME-KP010', NULL),

('KP-012', '整式乘法与因式分解', 'Polynomial Multiplication and Factoring', 7, 2, '数与代数', '整式', 'A2', 1,
 'assets/concepts/KP-012-zh.svg', 'assets/concepts/KP-012-en.svg',
 '几何大正方形分割为矩形面积，推导乘法公式。', 'Square area dissection deriving algebraic formulas.',
 '平方差公式 (a+b)(a-b) = a^2 - b^2 与完全平方公式。', 'Difference of squares and perfect square formulas.',
 '把多项式化为几个整式的积的形式叫做因式分解。', 'Factoring polynomial into product of simpler polynomials.',
 '提公因式法、公式法、十字相乘法需因式分解彻底。', 'Factor completely by grouping, formulas, and cross-multiplication.',
 'ME-KP012', NULL),

('KP-015', '全等三角形判定(SAS/ASA/AAS/SSS)', 'Triangle Congruence Criteria', 7, 2, '图形与几何', '三角形', 'G2', 1,
 'assets/concepts/KP-015-zh.svg', 'assets/concepts/KP-015-en.svg',
 '刚体叠合完全重合，全等保距保角。', 'Rigid overlapping establishes preservation of lengths and angles.',
 '三边分别相等(SSS)、两边及其夹角分别相等(SAS)。', 'SSS, SAS, ASA, AAS criteria for congruence.',
 '能够完全重合的两个三角形叫做全等三角形。', 'Two triangles that coincide exactly are congruent.',
 'SSA 不能判定全等，是中考经典陷阱题。', 'SSA is not a valid congruence condition.',
 'ME-KP015', NULL),

('KP-018', '轴对称与等腰三角形', 'Axial Symmetry and Isosceles Triangles', 8, 1, '图形与几何', '三角形', 'G2', 1,
 'assets/concepts/KP-018-zh.svg', 'assets/concepts/KP-018-en.svg',
 '折叠重合对应点连线被对称轴垂直平分。', 'Folding reveals perpendicular bisector of corresponding points.',
 '等边对等角；三线合一（顶角平分线、底边中线、高线）。', 'Equal sides imply equal angles; altitude, median, bisector coincide.',
 '有两条边相等的三角形是等腰三角形。', 'A triangle with two equal sides is isosceles.',
 '角平分线加平行线必出等腰三角形模型。', 'Angle bisector plus parallel line always yields isosceles triangle.',
 'ME-KP018', NULL),

('KP-020', '一次函数的图象与性质', 'Linear Function Graphs and Properties', 8, 1, '数与代数', '函数', 'A4', 1,
 'assets/concepts/KP-020-zh.svg', 'assets/concepts/KP-020-en.svg',
 '匀速直线运动速度时间位移模型催生函数解析式。', 'Uniform motion models inspiring linear function formulas.',
 '图象为一条直线；斜率 k 决定增减性，截距 b 决定与 y 轴交点。', 'Graph is a straight line; k controls slope, b is y-intercept.',
 '函数 y = kx + b (k ≠ 0) 叫做一次函数。', 'Function y = kx + b (k ≠ 0) is a linear function.',
 'k > 0 时 y 随 x 增大而增大；两直线平行当且仅当 k1 = k2。', 'k > 0 increases; parallelism implies identical slopes.',
 'ME-KP020', NULL),

('KP-023', '勾股定理及其逆定理', 'Pythagorean Theorem and Its Converse', 8, 1, '图形与几何', '三角形', 'G4', 1,
 'assets/concepts/KP-023-zh.svg', 'assets/concepts/KP-023-en.svg',
 '古巴比伦泥板与商高答周公，直角三角形边长平方和的几何发现与测量需求。',
 'Ancient surveying and the geometric discovery of square sums in right triangles.',
 '直角三角形两直角边的正方形面积之和恒等于斜边上的正方形面积：$a^2 + b^2 = c^2$。',
 'The sum of areas of the two squares on the legs equals the area of the square on the hypotenuse: $a^2 + b^2 = c^2$.',
 '在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$\\angle A$、$\\angle B$、$\\angle C$ 的对边分别为 $a$、$b$、$c$，则 $a^2 + b^2 = c^2$。',
 'In $\\text{Rt}\\triangle ABC$ with $\\angle C = 90^\\circ$ and sides $a, b, c$, $a^2 + b^2 = c^2$.',
 '若 $a^2 + b^2 = c^2$，则三角形为直角三角形；斜边最长；三边为整数时构成勾股数。',
 'Converse: if $a^2 + b^2 = c^2$, it is a right triangle; hypotenuse is longest.',
 'ME-KP023', 'SB-KP023'),

('KP-024', '勾股数与距离公式', 'Pythagorean Triples and Distance Formula', 8, 1, '图形与几何', '三角形', 'G4', 1,
 'assets/concepts/KP-024-zh.svg', 'assets/concepts/KP-024-en.svg',
 '坐标系网格中两点间线段长度转化为直角三角形斜边。', 'Coordinate distances mapped to hypotenuse of right triangle.',
 '平面两点 A(x1, y1), B(x2, y2) 间距离公式 d = sqrt((x1-x2)^2 + (y1-y2)^2)。', 'Distance formula in Cartesian plane.',
 '能够成为直角三角形三条边长的一组正整数称为勾股数。', 'Three positive integers satisfying a^2+b^2=c^2.',
 '常见勾股数: 3,4,5; 5,12,13; 8,15,17; 7,24,25。', 'Common triples: 3,4,5; 5,12,13; 8,15,17; 7,24,25.',
 'ME-KP024', NULL),

('KP-028', '一元二次方程根与系数关系', 'Quadratic Equations and Vieta Formulas', 8, 2, '数与代数', '方程与不等式', 'A3', 1,
 'assets/concepts/KP-028-zh.svg', 'assets/concepts/KP-028-en.svg',
 '韦达定理建立了方程根的对称代数式与系数的联系。', 'Vieta formulas connecting root symmetry to coefficients.',
 'x1 + x2 = -b/a, x1 * x2 = c/a。', 'Sum of roots is -b/a; product is c/a.',
 '关于 x 的方程 ax^2 + bx + c = 0 (a ≠ 0) 的两根关系。', 'Relations between roots of ax^2 + bx + c = 0.',
 '应用前提是判别式 Δ = b^2 - 4ac ≥ 0，切防无实根时盲目套用。', 'Prerequisite: discriminant Δ ≥ 0.',
 'ME-KP028', NULL),

('KP-030', '平行四边形与矩形菱形性质', 'Parallelograms Rectangles and Rhombi', 8, 2, '图形与几何', '四边形', 'G3', 1,
 'assets/concepts/KP-030-zh.svg', 'assets/concepts/KP-030-en.svg',
 '平行四边形中心对称与对边对角相等。', 'Central symmetry and opposite equality in parallelograms.',
 '矩形对角线相等且互相平分；菱形四边相等且对角线垂直平分。', 'Rectangles have equal diagonals; rhombi have perpendicular diagonals.',
 '两组对边分别平行的四边形叫做平行四边形。', 'Quadrilateral with two pairs of parallel opposite sides.',
 '矩形是有一个角是直角的平行四边形；菱形是有一组邻边相等的平行四边形。', 'Rectangle has right angle; rhombus has equal adjacent sides.',
 'ME-KP030', NULL),

('KP-032', '相似三角形判定与性质', 'Similar Triangles Determination and Properties', 8, 2, '图形与几何', '三角形', 'G2', 1,
 'assets/concepts/KP-032-zh.svg', 'assets/concepts/KP-032-en.svg',
 '物体缩放与日光投影模型，建立相似比概念。', 'Scaling and solar shadows establishing similarity ratio.',
 '对应角相等、对应边成比例；相似比为 k，面积比为 k^2。', 'Equal angles, proportional sides; area ratio is k^2.',
 '三角对应相等、三边对应成比例的两个三角形叫做相似三角形。', 'Triangles with equal angles and proportional sides.',
 '平行 A 字型与 8 字型是辅助线构造的核心母题模型。', 'A-type and 8-type auxiliary models.',
 'ME-KP032', NULL),

('KP-035', '反比例函数的图象与性质', 'Inverse Proportional Functions and Properties', 8, 2, '数与代数', '函数', 'A4', 1,
 'assets/concepts/KP-035-zh.svg', 'assets/concepts/KP-035-en.svg',
 '杠杆平衡原理与气体压力体积关系，xy = k 恒定。', 'Lever balance and Boyle law: xy = k invariant.',
 '双曲线图象关于原点中心对称；k > 0 位于一、三象限。', 'Hyperbola symmetric about origin; k > 0 in quadrants 1 and 3.',
 '形如 y = k/x (k ≠ 0) 的函数叫做反比例函数。', 'Function of form y = k/x (k ≠ 0).',
 '图象上任意点向两坐标轴作垂线，所得矩形面积恒为 |k|。', 'Rectangle area formed by coordinate projections is |k|.',
 'ME-KP035', NULL),

('KP-040', '二次函数图象与顶点式', 'Quadratic Functions and Vertex Form', 9, 1, '数与代数', '函数', 'A4', 1,
 'assets/concepts/KP-040-zh.svg', 'assets/concepts/KP-040-en.svg',
 '自由落体与抛体轨迹模型，抛物线图象。', 'Projectile motion leading to parabolic graphs.',
 '顶点坐标 (-b/2a, (4ac-b^2)/4a)，对称轴直线 x = -b/2a。', 'Vertex coordinates and axis of symmetry.',
 '形如 y = ax^2 + bx + c (a ≠ 0) 的函数叫做二次函数。', 'Function of form y = ax^2 + bx + c (a ≠ 0).',
 '顶点式 y = a(x-h)^2 + k 直观展现平移变换与最值。', 'Vertex form displays translation and extrema.',
 'ME-KP040', NULL),

('KP-042', '解直角三角形与锐角三角函数', 'Solving Right Triangles and Trigonometric Functions', 9, 1, '图形与几何', '三角形', 'G6', 1,
 'assets/concepts/KP-042-zh.svg', 'assets/concepts/KP-042-en.svg',
 '古天文测量天体仰角，正弦、余弦、正切三角比。', 'Astronomical measurement inspiring trigonometric ratios.',
 'sin A = 对边/斜边，cos A = 邻边/斜边，tan A = 对边/邻边。', 'Definitions of sin, cos, and tan ratios.',
 '利用已知边和角求出直角三角形中未知的边和角。', 'Finding unknown elements in right triangles.',
 '特殊角 30°、45°、60° 三角函数值必须熟练速记。', 'Standard values for 30°, 45°, 60° angles.',
 'ME-KP042', NULL),

('KP-045', '旋转变换与手拉手模型', 'Rotation Transformation and Hand-in-Hand Model', 9, 1, '图形与几何', '几何变换', 'G5', 1,
 'assets/concepts/KP-045-zh.svg', 'assets/concepts/KP-045-en.svg',
 '共顶点等线段旋转，连接对应端点构成手拉手全等。', 'Shared vertex rotation yielding congruent triangles.',
 '旋转保长、保角；全等线段夹角恒等于旋转角。', 'Rotation preserves lengths and angles; line angle equals rotation angle.',
 '平面内图形绕一个定点沿某个方向转过一个角度的图形变换。', 'Planar rotation about a fixed center by an angle.',
 '等边三角形手拉手、等腰直角三角形手拉手是中考压轴常客。', 'Equilateral and right-isosceles hand-in-hand models.',
 'ME-KP045', NULL),

('KP-050', '圆的切线判定与性质', 'Circle Tangent Determination and Properties', 9, 2, '图形与几何', '圆', 'G4', 1,
 'assets/concepts/KP-050-zh.svg', 'assets/concepts/KP-050-en.svg',
 '车轮与地面的瞬时接触，切线垂直于过切点的半径。', 'Wheel contacting ground: tangent is perpendicular to radius.',
 '过半径外端且垂直于该半径的直线是圆的切线。', 'Line through radius endpoint and perpendicular is tangent.',
 '圆心到直线的距离等于半径 (d = r) 时直线与圆相切。', 'Line is tangent to circle if distance from center equals radius.',
 '有切点连半径证垂直；无切点作垂直证半径。', 'Connect radius if point exists; drop perpendicular if not.',
 'ME-KP050', NULL);

-- 8 组连通组合 (基数 1 到 8 全覆盖，含 kp_count > 4，验证 Property 12 与 CT-2)
INSERT INTO knowledge_combinations (
    combination_id, kp_ids, kp_count, directed_order,
    question_hint_zh, question_hint_en, question_types
) VALUES 
('C1-0001', '["KP-001"]', 1,
 '["KP-001"]',
 '单一考点基础题：数轴与有理数识别。',
 'Single point foundation: rational numbers and number axis.',
 '["single_choice"]'),

('C2-0012', '["KP-001","KP-002"]', 2,
 '["KP-001","KP-002"]',
 '数轴上的绝对值几何距离计算。',
 'Geometric absolute distance on the number axis.',
 '["single_choice","fill_blank"]'),

('C3-0023', '["KP-015","KP-018","KP-023"]', 3,
 '["KP-015","KP-018","KP-023"]',
 '先用全等三角形导出线段相等，再由等腰轴对称应用勾股定理。',
 'Derive equal segments by congruence, then apply Pythagoras on isosceles symmetry.',
 '["single_choice","fill_blank","solution"]'),

('C4-0040', '["KP-015","KP-020","KP-023","KP-040"]', 4,
 '["KP-015","KP-020","KP-023","KP-040"]',
 '一次函数与二次函数交点，全等构造与直角勾股边长计算。',
 'Function intersections, congruence construction, and Pythagorean segment length.',
 '["single_choice","solution"]'),

('C5-0088', '["KP-015","KP-018","KP-023","KP-024","KP-042"]', 5,
 '["KP-015","KP-018","KP-023","KP-024","KP-042"]',
 '综合勾股、轴对称、坐标距离、全等旋转与解直角三角形的多层拓扑求解。',
 'Multi-tier topological synthesis combining Pythagoras, symmetry, distance, congruence, and trigonometry.',
 '["solution"]'),

('C6-0099', '["KP-010","KP-015","KP-018","KP-023","KP-032","KP-042"]', 6,
 '["KP-010","KP-015","KP-018","KP-023","KP-032","KP-042"]',
 '平行截割、全等转化、相似比列方程，再由勾股三角函数求解未知边角。',
 'Parallel transversals, congruence, similarity, and trigonometric equation solving.',
 '["solution"]'),

('C7-0107', '["KP-006","KP-010","KP-015","KP-018","KP-023","KP-032","KP-045"]', 7,
 '["KP-006","KP-010","KP-015","KP-018","KP-023","KP-032","KP-045"]',
 '手拉手旋转全等、平行线角平分线等腰、相似放大与勾股度量综合压轴。',
 'Comprehensive synthesis: Hand-in-hand rotation, parallel bisector, similarity, and Pythagoras.',
 '["solution"]'),

('C8-0112', '["KP-001","KP-002","KP-005","KP-012","KP-020","KP-028","KP-035","KP-040"]', 8,
 '["KP-001","KP-002","KP-005","KP-012","KP-020","KP-028","KP-035","KP-040"]',
 '数与代数大一统：从数轴绝对值到多项式因式分解、韦达定理与三次复合函数数形结合。',
 'Number and algebra unification: from absolute value to factoring, Vieta, and multi-function geometry.',
 '["solution"]');

-- 学期拓扑节点 (真实的前置与后继依赖边，支持焦点穿透蓝/紫光束)
INSERT INTO knowledge_graph_semesters (
    node_id, point_id, grade_semester, module_name,
    predecessors, successors, is_milestone
) VALUES
('NODE-7-1-KP001', 'KP-001', '7-1', '有理数与数轴',
 '[]', '["KP-002","KP-005"]', 0),

('NODE-7-1-KP002', 'KP-002', '7-1', '绝对值与相反数',
 '["KP-001"]', '["KP-020"]', 0),

('NODE-7-1-KP005', 'KP-005', '7-1', '一元一次方程',
 '["KP-001"]', '["KP-012","KP-028"]', 1),

('NODE-7-1-KP006', 'KP-006', '7-1', '线段与角',
 '[]', '["KP-009","KP-010"]', 0),

('NODE-7-2-KP009', 'KP-009', '7-2', '相交线与对顶角',
 '["KP-006"]', '["KP-010","KP-015"]', 0),

('NODE-7-2-KP010', 'KP-010', '7-2', '平行线判定与性质',
 '["KP-006","KP-009"]', '["KP-015","KP-032"]', 1),

('NODE-7-2-KP012', 'KP-012', '7-2', '整式与因式分解',
 '["KP-005"]', '["KP-028"]', 0),

('NODE-7-2-KP015', 'KP-015', '7-2', '全等三角形判定',
 '["KP-009","KP-010"]', '["KP-018","KP-023","KP-032","KP-045"]', 1),

('NODE-8-1-KP018', 'KP-018', '8-1', '轴对称与等腰三角形',
 '["KP-015"]', '["KP-023","KP-045"]', 0),

('NODE-8-1-KP020', 'KP-020', '8-1', '一次函数图象与性质',
 '["KP-002","KP-005"]', '["KP-035","KP-040"]', 1),

('NODE-8-1-KP023', 'KP-023', '8-1', '勾股定理及其逆定理',
 '["KP-015","KP-018"]', '["KP-024","KP-042"]', 1),

('NODE-8-1-KP024', 'KP-024', '8-1', '勾股数与距离公式',
 '["KP-023"]', '["KP-040","KP-042"]', 0),

('NODE-8-2-KP028', 'KP-028', '8-2', '一元二次方程根与系数',
 '["KP-005","KP-012"]', '["KP-040"]', 1),

('NODE-8-2-KP030', 'KP-030', '8-2', '平行四边形与特殊四边形',
 '["KP-010","KP-015"]', '["KP-045"]', 0),

('NODE-8-2-KP032', 'KP-032', '8-2', '相似三角形判定与性质',
 '["KP-010","KP-015"]', '["KP-042","KP-045"]', 1),

('NODE-8-2-KP035', 'KP-035', '8-2', '反比例函数图象与性质',
 '["KP-020"]', '["KP-040"]', 0),

('NODE-9-1-KP040', 'KP-040', '9-1', '二次函数图象与最值',
 '["KP-020","KP-024","KP-028","KP-035"]', '[]', 1),

('NODE-9-1-KP042', 'KP-042', '9-1', '解直角三角形与三角函数',
 '["KP-023","KP-024","KP-032"]', '[]', 0),

('NODE-9-1-KP045', 'KP-045', '9-1', '旋转变换与手拉手模型',
 '["KP-015","KP-018","KP-032"]', '["KP-050"]', 1),

('NODE-9-2-KP050', 'KP-050', '9-2', '圆的切线判定与性质',
 '["KP-023","KP-045"]', '[]', 1);

`;

  execSync(`sqlite3 "${coreDbPath}"`, { input: coreSql, encoding: 'utf-8' });
  console.log('[Seed] core.db seeded successfully.');

  // 3. 插入 sandbox.db 数据
  const sandboxSql = `
DELETE FROM concept_sandboxes;
DELETE FROM leap_sandbox_models;

-- 概念沙盒 (勾股面积守恒)
INSERT INTO concept_sandboxes (
    sandbox_id, point_id, category_id, engine_type, canvas_template,
    inquiry_guide_zh, inquiry_guide_en,
    viewbox_spec_json, drag_points_json, param_sliders_json, invariants_display_json
) VALUES (
    'SB-KP023', 'KP-023', 'geometry_right_triangle', 'geometry', 'pythagorean_proof_template',
    '拖动顶点 $C$，观察两直角边正方形面积之和与斜边正方形面积的不变等量关系。',
    'Drag vertex $C$ to observe that the sum of areas of squares on legs equals the hypotenuse square.',
    '{"xMin":-6,"xMax":6,"yMin":-6,"yMax":6,"marginPercent":15}',
    '[{"id":"C","x":0,"y":3,"constrainTo":"circle_diameter"}]',
    '[{"id":"angle","min":10,"max":80,"default":36.87,"step":0.1}]',
    '{"labelZh":"面积守恒","formula":"a^2 + b^2 = c^2"}'
);

-- 思维跃迁模型 (LM-8A-01 手拉手 与 LM-9A-01 抛物线铅垂高)
INSERT INTO leap_sandbox_models (
    model_id, model_name_zh, model_name_en, unlocked_semester, primary_line,
    category_id, tier_level, canonical_state_count, kp_dependencies, clique_id,
    model_brief_zh, model_brief_en, viewbox_spec_json,
    carrier_morphing_json, parameter_morphing_json, posture_morphing_json, camouflage_xray_json
) VALUES (
    'LM-8A-01', '手拉手全等与勾股跃迁模型', 'Hand-in-Hand Congruence and Pythagorean Leap Model',
    '8A', 'G4', 'geometry_transform', 1, 3,
    '["KP-023","KP-024"]', 'C3-0023',
    '共顶等线成旋转，全等导引勾股现。',
    'Shared vertex induces rotation; congruence reveals Pythagorean relations.',
    '{"xMin":-10,"xMax":10,"yMin":-8,"yMax":8,"marginPercent":15,"preserveAspectRatio":true}',
    '{"options":[{"id":"free_triangle","nameZh":"自由三角形载体","nameEn":"Free Triangle Carrier","points":[{"id":"O","name":"O","x":0,"y":0,"color":"#1d1d1f","size":5,"isFixed":true},{"id":"A","name":"A","x":0,"y":4,"color":"#0071e3","size":4},{"id":"B","name":"B","x":4,"y":0,"color":"#34c759","size":5},{"id":"C","name":"C","x":2.83,"y":2.83,"color":"#ff9500","size":5}]},{"id":"quadrilateral","nameZh":"正方形载体","nameEn":"Square Carrier","points":[{"id":"O","name":"O","x":0,"y":0,"color":"#1d1d1f","size":5,"isFixed":true},{"id":"A","name":"A","x":0,"y":4,"color":"#0071e3","size":4},{"id":"B","name":"B","x":4,"y":0,"color":"#34c759","size":5},{"id":"C","name":"C","x":4,"y":4,"color":"#ff9500","size":5}]},{"id":"coordinate_grid","nameZh":"直角坐标系载体","nameEn":"Coordinate Carrier","isAxis":true,"points":[{"id":"O","name":"O(0,0)","x":0,"y":0,"color":"#1d1d1f","size":5,"isFixed":true},{"id":"A","name":"A(0,4)","x":0,"y":4,"color":"#0071e3","size":4},{"id":"B","name":"B(4,0)","x":4,"y":0,"color":"#34c759","size":5},{"id":"C","name":"C(3,3)","x":3,"y":3,"color":"#ff9500","size":5}]}],"default":"free_triangle"}',
    '{"sliders":[{"id":"param_rotation","nameZh":"旋转角 α","nameEn":"Rotation Angle α","min":0,"max":180,"default":45,"step":1,"unit":"°"},{"id":"param_scale","nameZh":"相似比 k","nameEn":"Scale Ratio k","min":0.5,"max":2.0,"default":1.0,"step":0.1,"unit":""}]}',
    '{"modes":[{"id":"standard","nameZh":"标准姿态 (正向)","nameEn":"Standard Orientation","rotationDeg":0,"reflected":false},{"id":"rotated_90","nameZh":"正交旋转 90°","nameEn":"Rotated 90°","rotationDeg":90,"reflected":false},{"id":"reflected_x","nameZh":"轴对称翻折","nameEn":"Axial Reflection","rotationDeg":0,"reflected":true},{"id":"collinear_degraded","nameZh":"共线极端退化态","nameEn":"Collinear Degraded","rotationDeg":180,"reflected":false}],"default":"standard"}',
    '{"distractorLayers":[{"id":"grid_mesh","nameZh":"背景干扰线","nameEn":"Distractor Grid Lines","type":"lines","items":[{"from":[-6,-6],"to":[6,6],"color":"#d1d1d6"},{"from":[-6,6],"to":[6,-6],"color":"#d1d1d6"}]},{"id":"aux_circles","nameZh":"干扰辅助圆","nameEn":"Distractor Circles","type":"circles","items":[{"center":[0,0],"radius":4,"color":"#e5e5ea"}]}],"coreSkeleton":{"nameZh":"核心骨架：手拉手共顶全等","nameEn":"Core Skeleton: Shared Vertex Congruence","primaryElements":["O","A","B","C"],"highlightColor":"#0071e3","invariants":[{"id":"inv_ang","type":"angle","deps":["A","O","B"],"formula":"∠AOB = {val}°","labelZh":"顶角守恒"}]}}'
),
(
    'LM-9A-01', '二次函数铅垂高与割线极值跃迁模型', 'Quadratic Plumb Height and Secant Extrema Leap Model',
    '9A', 'A4', 'function_geometry', 2, 4,
    '["KP-020","KP-040"]', 'C5-0088',
    '抛物线割线作铅垂，水平宽乘积半求积。',
    'Vertical plumb height on secant line maximizes triangle area.',
    '{"xMin":-8,"xMax":8,"yMin":-6,"yMax":10,"marginPercent":15,"preserveAspectRatio":true}',
    '{"options":[{"id":"standard_parabola","nameZh":"标准抛物线载体","nameEn":"Standard Parabola Carrier","points":[{"id":"A","name":"A(-1,0)","x":-1,"y":0,"color":"#1d1d1f","size":4,"isFixed":true},{"id":"B","name":"B(3,0)","x":3,"y":0,"color":"#1d1d1f","size":4,"isFixed":true},{"id":"P","name":"P(动点)","x":1,"y":4,"color":"#0071e3","size":5}]},{"id":"axis_carrier","nameZh":"坐标网格载体","nameEn":"Coordinate Carrier","isAxis":true,"points":[{"id":"A","name":"A","x":-1,"y":0,"color":"#1d1d1f","size":4},{"id":"B","name":"B","x":3,"y":0,"color":"#1d1d1f","size":4},{"id":"P","name":"P","x":1,"y":4,"color":"#0071e3","size":5}]}],"default":"standard_parabola"}',
    '{"sliders":[{"id":"param_t","nameZh":"动点横坐标 t","nameEn":"Abscissa t","min":-0.5,"max":2.5,"default":1.0,"step":0.1,"unit":""}]}',
    '{"modes":[{"id":"standard","nameZh":"开口向下 (a < 0)","nameEn":"Standard a<0","rotationDeg":0,"reflected":false},{"id":"reflected","nameZh":"开口向上翻折 (a > 0)","nameEn":"Reflected a>0","rotationDeg":0,"reflected":true}],"default":"standard"}',
    '{"distractorLayers":[{"id":"tangent_lines","nameZh":"切线干扰图层","nameEn":"Tangent Distractor Lines","type":"lines","items":[{"from":[-3,8],"to":[5,0],"color":"#d1d1d6"}]}],"coreSkeleton":{"nameZh":"核心骨架：铅垂高线段与割线","nameEn":"Core Skeleton: Plumb Height and Secant","primaryElements":["A","B","P"],"highlightColor":"#0071e3","invariants":[{"id":"inv_area","type":"area_triangle","deps":["A","B","P"],"formula":"S_△PAB = {val}","labelZh":"割线三角形面积"}]}}'
);
`;

  execSync(`sqlite3 "${sandboxDbPath}"`, { input: sandboxSql, encoding: 'utf-8' });
  console.log('[Seed] sandbox.db seeded successfully.');

  // 4. 插入 master.db 数据 (铁律 9: 物理隔离，仅存母题)
  const masterSql = `
DELETE FROM master_examples;

-- 考点母题 (dim3_rigor 恒必填, CT-6)
INSERT INTO master_examples (
    example_id, example_type, bound_target_id, source,
    stem_zh, stem_en, options_json, correct_option,
    dim1_origin, dim2_essence, dim3_rigor, dim4_traps,
    bound_line_id, empirical_scoring_rate, image_paths_json
) VALUES (
    'ME-KP023', 'point_master', 'KP-023', '2023年北京中考真题精选',
    '在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$AC = 6$，$BC = 8$。求斜边 $AB$ 的长。',
    'In $\\text{Rt}\\triangle ABC$, $\\angle C = 90^\\circ$, $AC = 6$, $BC = 8$. Find the length of hypotenuse $AB$.',
    '{"A":{"zh":"8","en":"8"},"B":{"zh":"10","en":"10"},"C":{"zh":"12","en":"12"},"D":{"zh":"14","en":"14"}}',
    'B',
    '直角三角形边长关系源于赵爽弦图面积割补。',
    '面积守恒为几何直观核心。',
    '在 $\\text{Rt}\\triangle ABC$ 中，根据勾股定理：$AB = \\sqrt{AC^2 + BC^2} = \\sqrt{6^2 + 8^2} = 10$。',
    '若未指明直角边与斜边时，需进行分类讨论以防漏解。',
    NULL, NULL, NULL
);

-- 主线母题 (G4 几何压轴)
INSERT INTO master_examples (
    example_id, example_type, bound_target_id, source,
    stem_zh, stem_en, options_json, correct_option,
    dim1_origin, dim2_essence, dim3_rigor, dim4_traps,
    bound_line_id, empirical_scoring_rate, image_paths_json
) VALUES (
    'ME-LINE-G4', 'line_master', 'G4', '2024年上海中考几何压轴母题',
    '如图，在矩形折叠模型中，已知长宽比，求动点折痕与勾股二次方程极值。',
    'In rectangular folding model, find fold trajectory and Pythagorean quadratic extrema.',
    NULL, NULL,
    '折叠本质为轴对称反射。',
    '设元列勾股方程化归为一元二次方程求极值。',
    '设折痕长为 $x$，根据轴对称全等对应线段相等，列出直角三角形勾股方程并代数求解。',
    '注意几何折叠动点存在取值范围限制。',
    'G4', 0.26, NULL
);

-- 主线母题 (A4 函数压轴)
INSERT INTO master_examples (
    example_id, example_type, bound_target_id, source,
    stem_zh, stem_en, options_json, correct_option,
    dim1_origin, dim2_essence, dim3_rigor, dim4_traps,
    bound_line_id, empirical_scoring_rate, image_paths_json
) VALUES (
    'ME-LINE-A4', 'line_master', 'A4', '2024年北京中考二次函数压轴母题',
    '如图，抛物线 $y = -x^2 + 2x + 3$ 经过点 $A(-1, 0)$、$B(3, 0)$，点 $P$ 为抛物线第一象限动点。连接 $PA$、$PB$，求 $\\triangle PAB$ 面积的最大值。',
    'Parabola $y = -x^2 + 2x + 3$ passes through $A(-1, 0)$ and $B(3, 0)$. Point $P$ moves in the first quadrant. Find maximum area of $\\triangle PAB$.',
    NULL, NULL,
    '割补法求动点多边形面积，引出铅垂高与水平宽核心算法。',
    '抛物线几何变换与割线不变量的数形结合统一。',
    '设点 $P(t, -t^2 + 2t + 3)$，铅垂高 $h = -t^2 + 2t + 3$。底边水平宽 $d = 3 - (-1) = 4$。面积 $S = \\frac{1}{2} \\cdot 4 \\cdot (-t^2 + 2t + 3) = -2(t - 1)^2 + 8$。当 $t = 1$ 时，面积取得最大值 $8$。',
    '自变量 $t$ 必须严格限制在第一象限抛物线内，即 $0 < t < 3$。',
    'A4', 0.22, NULL
);
`;

  execSync(`sqlite3 "${masterDbPath}"`, { input: masterSql, encoding: 'utf-8' });
  console.log('[Seed] master.db seeded successfully.');

  // 5. 插入 questions.db 数据 (铁律 9: 物理隔离；覆盖 L1~L3 快练、L4~L6 主线快练、L4 填空、L6 解答)
  const questionsSql = `
DELETE FROM questions;

-- 题 1: L1 single_choice (单点快练题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-BJ-001', '2023年北京中考', 2023, '北京', '中考真题', 8, 1,
    'KP-023', NULL, 1, 'single_choice', 2,
    '在 $\\text{Rt}\\triangle ABC$ 中，两直角边长分别为 $3$ 和 $4$，则斜边长为（ ）',
    'In $\\text{Rt}\\triangle ABC$, two legs are $3$ and $4$. The hypotenuse length is ( )',
    '{"A":{"zh":"5","en":"5"},"B":{"zh":"6","en":"6"},"C":{"zh":"7","en":"7"},"D":{"zh":"8","en":"8"}}',
    'A', NULL,
    '[{"method_zh":"直接利用勾股定理计算：$c = \\sqrt{3^2 + 4^2} = 5$","method_en":"Pythagorean formula","steps":["c = 5"]}]'
);

-- 题 2: L2 single_choice (单点快练题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-SH-002', '2023年上海中考', 2023, '上海', '中考真题', 8, 1,
    'KP-023', NULL, 2, 'single_choice', 2,
    '若直角三角形斜边长为 $13$，一直角边为 $5$，则另一直角边长为（ ）',
    'In a right triangle with hypotenuse $13$ and one leg $5$, the other leg is ( )',
    '{"A":{"zh":"10","en":"10"},"B":{"zh":"11","en":"11"},"C":{"zh":"12","en":"12"},"D":{"zh":"13","en":"13"}}',
    'C', NULL,
    '[{"method_zh":"$b = \\sqrt{13^2 - 5^2} = 12$","method_en":"Compute leg length","steps":["b = 12"]}]'
);

-- 题 3: L3 single_choice (单点快练题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-JS-003', '2023年江苏中考', 2023, '江苏', '中考真题', 8, 1,
    'KP-023', 'C3-0023', 3, 'single_choice', 2,
    '已知等腰三角形底边为 $10$，腰长为 $13$，则底边上的高为（ ）',
    'In an isosceles triangle with base $10$ and leg $13$, the altitude to the base is ( )',
    '{"A":{"zh":"12","en":"12"},"B":{"zh":"10","en":"10"},"C":{"zh":"8","en":"8"},"D":{"zh":"6","en":"6"}}',
    'A', NULL,
    '[{"method_zh":"三线合一平分底边得直角边 5，由勾股定理得高为 12","method_en":"Altitude calculation","steps":["h = 12"]}]'
);

-- 题 4: L4 single_choice (主线快练题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-LINE-001', '2023年中考主线强化题', 2023, '全国', '模拟题', 8, 1,
    'KP-023', 'C3-0023', 4, 'single_choice', 3,
    '在矩形 $ABCD$ 中，$AB = 3$，$BC = 4$。将矩形沿对角线 $AC$ 折叠，点 $B$ 落在点 $B''$ 处，$B''C$ 交 $AD$ 于点 $E$。则 $AE$ 的长为（ ）',
    'In rectangle $ABCD$, $AB = 3$, $BC = 4$. Fold along diagonal $AC$. Find length of $AE$.',
    '{"A":{"zh":"7/8","en":"7/8"},"B":{"zh":"7/6","en":"7/6"},"C":{"zh":"7/2","en":"7/2"},"D":{"zh":"5/2","en":"5/2"}}',
    'A', NULL,
    '[{"method_zh":"设 AE = x，在 Rt△AB''E 中应用勾股定理列方程求解得 x = 7/8","method_en":"Fold symmetry and Pythagoras","steps":["x = 7/8"]}]'
);

-- 题 5: L5 single_choice (主线快练题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-LINE-002', '2023年中考主线跃迁题', 2023, '全国', '中考真题', 8, 1,
    'KP-024', 'C3-0023', 5, 'single_choice', 3,
    '在平面直角坐标系中，点 $P(x, y)$ 在直线 $y = -2x + 4$ 上运动，则 $\\sqrt{x^2 + y^2}$ 的最小值为（ ）',
    'Point $P(x, y)$ moves on $y = -2x + 4$. The minimum value of $\\sqrt{x^2 + y^2}$ is ( )',
    '{"A":{"zh":"4√5/5","en":"4√5/5"},"B":{"zh":"2","en":"2"},"C":{"zh":"√5","en":"√5"},"D":{"zh":"4","en":"4"}}',
    'A', NULL,
    '[{"method_zh":"点到直线的垂线段最短，利用勾股定理或点到直线距离公式可得最小距离为 4√5/5","method_en":"Perpendicular distance extrema","steps":["d = 4√5/5"]}]'
);

-- 题 6: L6 single_choice (主线快练题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-LINE-003', '2024年中考主线综合题', 2024, '全国', '中考压轴', 8, 1,
    'KP-045', 'C3-0023', 6, 'single_choice', 3,
    '如图，已知等腰直角三角形 $\\triangle ABC$ 与 $\\triangle ADE$ 共顶点 $A$，$\\angle BAC = \\angle DAE = 90^\\circ$。连接 $BD$、$CE$，若 $BD = 6$，则 $CE$ 的长为（ ）',
    'Isosceles right triangles $\\triangle ABC$ and $\\triangle ADE$ share vertex $A$. If $BD = 6$, find $CE$.',
    '{"A":{"zh":"6","en":"6"},"B":{"zh":"6√2","en":"6√2"},"C":{"zh":"3√2","en":"3√2"},"D":{"zh":"12","en":"12"}}',
    'A', NULL,
    '[{"method_zh":"手拉手全等模型：由 SAS 易证 △ABD ≌ △ACE，因此对应边 CE = BD = 6","method_en":"Hand-in-hand congruence proof","steps":["CE = 6"]}]'
);

-- 题 7: L4 single_choice (主线快练题 2)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-LINE-004', '2023年中考主线强化题', 2023, '全国', '模拟题', 8, 1,
    'KP-023', 'C5-0088', 4, 'single_choice', 3,
    '已知直角三角形周长为 $24$，斜边长为 $10$，则该直角三角形的面积为（ ）',
    'Right triangle perimeter is $24$, hypotenuse is $10$. Area is ( )',
    '{"A":{"zh":"24","en":"24"},"B":{"zh":"20","en":"20"},"C":{"zh":"30","en":"30"},"D":{"zh":"48","en":"48"}}',
    'A', NULL,
    '[{"method_zh":"由 a + b = 14 且 a^2 + b^2 = 100，利用完全平方公式得 2ab = 96，面积 S = 24","method_en":"Algebraic identity with Pythagoras","steps":["S = 24"]}]'
);

-- 题 8: L5 single_choice (主线快练题 2)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-LINE-005', '2024年中考主线跃迁题', 2024, '全国', '中考真题', 9, 1,
    'KP-040', 'C5-0088', 5, 'single_choice', 3,
    '抛物线 $y = -x^2 + 2x + 3$ 的顶点坐标与对称轴分别为（ ）',
    'Vertex and axis of symmetry of $y = -x^2 + 2x + 3$ are ( )',
    '{"A":{"zh":"(1, 4), x = 1","en":"(1, 4), x = 1"},"B":{"zh":"(-1, 4), x = -1","en":"(-1, 4), x = -1"},"C":{"zh":"(1, 3), x = 1","en":"(1, 3), x = 1"},"D":{"zh":"(2, 3), x = 2","en":"(2, 3), x = 2"}}',
    'A', NULL,
    '[{"method_zh":"配方得 y = -(x-1)^2 + 4，顶点为 (1, 4)，对称轴 x = 1","method_en":"Completing square","steps":["Vertex (1,4)"]}]'
);

-- 题 9: L6 single_choice (主线快练题 2)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-LINE-006', '2024年中考主线综合题', 2024, '全国', '中考压轴', 9, 1,
    'KP-042', 'C5-0088', 6, 'single_choice', 3,
    '在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$AC = 4$，$\\sin A = \\frac{3}{5}$，则 $\\tan B$ 的值为（ ）',
    'In $\\text{Rt}\\triangle ABC$, $\\angle C = 90^\\circ$, $AC = 4$, $\\sin A = 3/5$. Find $\\tan B$.',
    '{"A":{"zh":"4/3","en":"4/3"},"B":{"zh":"3/4","en":"3/4"},"C":{"zh":"3/5","en":"3/5"},"D":{"zh":"5/4","en":"5/4"}}',
    'A', NULL,
    '[{"method_zh":"由 sin A = 3/5 得三边比 3:4:5，AC = 4 对应邻边，对边 BC = 3，斜边 AB = 5，tan B = AC/BC = 4/3","method_en":"Trigonometric ratio","steps":["tan B = 4/3"]}]'
);

-- 题 10: L4 fill_blank
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-ZJ-004', '2023年浙江中考', 2023, '浙江', '中考真题', 8, 1,
    'KP-023', 'C3-0023', 4, 'fill_blank', 3,
    '在平面直角坐标系中，点 $A(3, 4)$ 到原点 $O$ 的距离为 _______。',
    'In the Cartesian coordinate plane, the distance from $A(3, 4)$ to the origin $O$ is _______.',
    NULL, '5', NULL, NULL
);

-- 题 11: L6 solution (带完整踩分点，关联 kp_count > 4 的组合 C5-0088)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES (
    'Q-2023-GD-005', '2023年广东中考', 2023, '广东', '中考真题', 8, 1,
    'KP-023', 'C5-0088', 6, 'solution', 10,
    '如图，在四边形 $ABCD$ 中，$\\angle B = 90^\\circ$，$AB = 3$，$BC = 4$，$CD = 12$，$AD = 13$。求四边形 $ABCD$ 的面积。',
    'In quadrilateral $ABCD$, $\\angle B = 90^\\circ$, $AB = 3$, $BC = 4$, $CD = 12$, $AD = 13$. Find the area of $ABCD$.',
    NULL, '36',
    '[{"stepIndex":1,"descriptionZh":"连接 AC，在 Rt△ABC 中由勾股定理求得 AC = 5","descriptionEn":"Connect AC, compute AC = 5","points":3},{"stepIndex":2,"descriptionZh":"在 △ACD 中验证 5^2 + 12^2 = 13^2，由逆定理得 ∠ACD = 90°","descriptionEn":"Prove ∠ACD = 90° by converse theorem","points":3},{"stepIndex":3,"descriptionZh":"分别计算两直角三角形面积并求和得总面积 36","descriptionEn":"Sum areas to obtain 36","points":4}]',
    '[{"method_zh":"割补法分为两个直角三角形分别计算面积","method_en":"Dissection method","steps":["S = S1 + S2 = 6 + 30 = 36"]}]'
);

-- =========================================================================
-- 模块四出题中心扩充题库 (单选 8 题 + 填空 7 题 + 解答 9 题 = 24 题，全卷总题量达 35 题)
-- =========================================================================

-- 扩充单选题 (8 题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES
('Q-2023-EXAM-C01', '2023年中考真题', 2023, '北京', '中考真题', 7, 2, 'KP-010', NULL, 1, 'single_choice', 3,
 '如图，直线 $a \\parallel b$，若 $\\angle 1 = 50^\\circ$，则 $\\angle 2$ 的度数是（ ）',
 'Lines $a \\parallel b$. If $\\angle 1 = 50^\\circ$, find $\\angle 2$.',
 '{"A":{"zh":"50°","en":"50°"},"B":{"zh":"130°","en":"130°"},"C":{"zh":"40°","en":"40°"},"D":{"zh":"140°","en":"140°"}}',
 'A', NULL, '[{"method_zh":"两直线平行，同位角相等","steps":["∠2 = 50°"]}]'),

('Q-2023-EXAM-C02', '2023年中考真题', 2023, '江苏', '中考真题', 7, 2, 'KP-012', NULL, 2, 'single_choice', 3,
 '下列因式分解正确的是（ ）',
 'Which factoring is correct ( )',
 '{"A":{"zh":"x^2 - 4 = (x+2)(x-2)","en":"x^2 - 4 = (x+2)(x-2)"},"B":{"zh":"x^2 + 4 = (x+2)^2","en":"x^2 + 4 = (x+2)^2"},"C":{"zh":"x^2 - 2x + 1 = x(x-2)+1","en":"x^2 - 2x + 1 = x(x-2)+1"},"D":{"zh":"x^2 - x = x(x+1)","en":"x^2 - x = x(x+1)"}}',
 'A', NULL, '[{"method_zh":"平方差公式直接展开与验证","steps":["x^2-4=(x+2)(x-2)"]}]'),

('Q-2023-EXAM-C03', '2023年中考真题', 2023, '浙江', '中考真题', 7, 2, 'KP-015', NULL, 2, 'single_choice', 3,
 '已知 $\\triangle ABC \\cong \\triangle DEF$，$\\angle A = 50^\\circ$，$\\angle B = 70^\\circ$，则 $\\angle F$ 的度数是（ ）',
 '$\\triangle ABC \\cong \\triangle DEF$, $\\angle A = 50^\\circ$, $\\angle B = 70^\\circ$. Find $\\angle F$.',
 '{"A":{"zh":"60°","en":"60°"},"B":{"zh":"50°","en":"50°"},"C":{"zh":"70°","en":"70°"},"D":{"zh":"80°","en":"80°"}}',
 'A', NULL, '[{"method_zh":"三角形内角和得 ∠C = 60°，全等对应角 ∠F = ∠C = 60°","steps":["∠F = 60°"]}]'),

('Q-2023-EXAM-C04', '2023年中考真题', 2023, '山东', '中考真题', 8, 1, 'KP-018', NULL, 3, 'single_choice', 3,
 '等腰三角形的一个内角为 $100^\\circ$，则它的底角为（ ）',
 'An angle of an isosceles triangle is $100^\\circ$. The base angle is ( )',
 '{"A":{"zh":"40°","en":"40°"},"B":{"zh":"50°","en":"50°"},"C":{"zh":"80°","en":"80°"},"D":{"zh":"40° 或 100°","en":"40° or 100°"}}',
 'A', NULL, '[{"method_zh":"钝角只能为顶角，底角为 (180-100)/2 = 40°","steps":["底角 = 40°"]}]'),

('Q-2023-EXAM-C05', '2023年中考真题', 2023, '湖北', '中考真题', 8, 1, 'KP-020', NULL, 3, 'single_choice', 3,
 '若一次函数 $y = kx + b$ 的图象经过第一、二、四象限，则 $k$，$b$ 的取值范围是（ ）',
 'If $y = kx + b$ passes through quadrants 1, 2, 4, find ranges of $k$ and $b$.',
 '{"A":{"zh":"k < 0, b > 0","en":"k < 0, b > 0"},"B":{"zh":"k > 0, b > 0","en":"k > 0, b > 0"},"C":{"zh":"k < 0, b < 0","en":"k < 0, b < 0"},"D":{"zh":"k > 0, b < 0","en":"k > 0, b < 0"}}',
 'A', NULL, '[{"method_zh":"经过一二四象限表明直线向下倾斜 k < 0，且与 y 轴正半轴相交 b > 0","steps":["k<0, b>0"]}]'),

('Q-2023-EXAM-C06', '2023年中考真题', 2023, '四川', '中考真题', 8, 2, 'KP-030', NULL, 3, 'single_choice', 3,
 '菱形具有而矩形不一定具有的性质是（ ）',
 'A property that a rhombus has but a rectangle may not have is ( )',
 '{"A":{"zh":"对角线互相垂直","en":"Diagonals are perpendicular"},"B":{"zh":"对角线相等","en":"Diagonals are equal"},"C":{"zh":"对边平行且相等","en":"Opposite sides parallel and equal"},"D":{"zh":"四个角都是直角","en":"All four angles are right angles"}}',
 'A', NULL, '[{"method_zh":"菱形对角线互相垂直平分，矩形对角线相等","steps":["对角线互相垂直"]}]'),

('Q-2023-EXAM-C07', '2023年中考真题', 2023, '陕西', '中考真题', 8, 2, 'KP-035', NULL, 4, 'single_choice', 3,
 '若反比例函数 $y = \\frac{k}{x}$ 的图象经过点 $A(-2, 3)$，则该图象必经过点（ ）',
 'Inverse function $y = k/x$ passes through $(-2, 3)$. It also passes through ( )',
 '{"A":{"zh":"(3, -2)","en":"(3, -2)"},"B":{"zh":"(2, 3)","en":"(2, 3)"},"C":{"zh":"(-3, -2)","en":"(-3, -2)"},"D":{"zh":"(-1, -6)","en":"(-1, -6)"}}',
 'A', NULL, '[{"method_zh":"xy = k = -6，验证选项坐标乘积为 -6 者为 (3, -2)","steps":["k = -6"]}]'),

('Q-2023-EXAM-C08', '2023年中考真题', 2023, '河北', '中考真题', 9, 2, 'KP-050', NULL, 4, 'single_choice', 3,
 '已知 $\\odot O$ 的半径为 $5$，点 $P$ 到圆心 $O$ 的距离为 $d$。若直线 $l$ 与 $\\odot O$ 相切，则（ ）',
 'Circle $\\odot O$ radius is $5$. Tangent line property is ( )',
 '{"A":{"zh":"圆心到切线距离等于 5","en":"Distance from center to tangent is 5"},"B":{"zh":"切线垂直于任意一条直径","en":"Tangent perpendicular to any diameter"},"C":{"zh":"切线与圆有多个交点","en":"Tangent has multiple intersections"},"D":{"zh":"圆心在切线上","en":"Center is on tangent"}}',
 'A', NULL, '[{"method_zh":"切线性质：圆心到切线的距离等于半径","steps":["d = r = 5"]}]');

-- 扩充填空题 (7 题)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES
('Q-2023-EXAM-F01', '2023年中考真题', 2023, '北京', '中考真题', 7, 2, 'KP-010', NULL, 1, 'fill_blank', 3,
 '如图，直线 $l_1 \\parallel l_2$。若 $\\angle 1 = 65^\\circ$，则其同旁内角 $\\angle 2$ 的度数是 _______ 度。',
 'Lines $l_1 \\parallel l_2$. If $\\angle 1 = 65^\\circ$, its co-interior angle is _______ degrees.',
 NULL, '115', NULL, NULL),

('Q-2023-EXAM-F02', '2023年中考真题', 2023, '上海', '中考真题', 7, 2, 'KP-012', NULL, 2, 'fill_blank', 3,
 '因式分解：$2x^2 - 8 =$ _______。',
 'Factor completely: $2x^2 - 8 =$ _______.',
 NULL, '2(x+2)(x-2)', NULL, NULL),

('Q-2023-EXAM-F03', '2023年中考真题', 2023, '天津', '中考真题', 8, 1, 'KP-018', NULL, 2, 'fill_blank', 3,
 '在 $\\triangle ABC$ 中，$AB = AC$，$\\angle A = 40^\\circ$，则 $\\angle B =$ _______ 度。',
 'In $\\triangle ABC$, $AB = AC$, $\\angle A = 40^\\circ$. $\\angle B =$ _______ degrees.',
 NULL, '70', NULL, NULL),

('Q-2023-EXAM-F04', '2023年中考真题', 2023, '重庆', '中考真题', 8, 1, 'KP-020', NULL, 3, 'fill_blank', 3,
 '若直线 $y = 2x + b$ 经过点 $(1, 5)$，则常数 $b =$ _______。',
 'Line $y = 2x + b$ passes through $(1, 5)$. $b =$ _______.',
 NULL, '3', NULL, NULL),

('Q-2023-EXAM-F05', '2023年中考真题', 2023, '安徽', '中考真题', 8, 1, 'KP-024', NULL, 3, 'fill_blank', 3,
 '在平面直角坐标系中，点 $A(1, 2)$ 与点 $B(4, 6)$ 之间的距离为 _______。',
 'Distance between $A(1, 2)$ and $B(4, 6)$ is _______.',
 NULL, '5', NULL, NULL),

('Q-2023-EXAM-F06', '2023年中考真题', 2023, '福建', '中考真题', 8, 2, 'KP-032', NULL, 4, 'fill_blank', 3,
 '已知 $\\triangle ABC \\sim \\triangle DEF$，相似比为 $2:3$。若 $\\triangle ABC$ 的面积为 $16$，则 $\\triangle DEF$ 的面积为 _______。',
 '$\\triangle ABC \\sim \\triangle DEF$ with ratio $2:3$. If area of $\\triangle ABC$ is $16$, area of $\\triangle DEF$ is _______.',
 NULL, '36', NULL, NULL),

('Q-2023-EXAM-F07', '2023年中考真题', 2023, '湖南', '中考真题', 8, 2, 'KP-035', NULL, 4, 'fill_blank', 3,
 '如图，点 $P$ 是反比例函数 $y = \\frac{6}{x}$ 图象上的一点，过点 $P$ 向坐标轴引垂线，所得矩形面积为 _______。',
 'Point $P$ on $y = 6/x$. Area of rectangle formed with axes is _______.',
 NULL, '6', NULL, NULL);

-- 扩充解答题 (9 题，带完整分步踩分点)
INSERT INTO questions (
    question_id, source, exam_year, region, exam_type, grade_level, semester,
    primary_point_id, combination_id, difficulty_level, question_type, score_default,
    stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json
) VALUES
('Q-2023-EXAM-S01', '2023年中考真题', 2023, '北京', '中考真题', 7, 2, 'KP-015', NULL, 2, 'solution', 6,
 '如图，已知 $AC = DF$，$BC = EF$，点 $A$、$D$、$B$、$E$ 在同一直线上，且 $AD = BE$。求证：$\\triangle ABC \\cong \\triangle DEF$。',
 'Prove $\\triangle ABC \\cong \\triangle DEF$ given $AC = DF$, $BC = EF$, $AD = BE$.',
 NULL, '见解析',
 '[{"stepIndex":1,"descriptionZh":"由 AD = BE 推导 AB = DE","descriptionEn":"Prove AB = DE from AD = BE","points":3},{"stepIndex":2,"descriptionZh":"利用 SSS 判定定理证明 △ABC ≌ △DEF","descriptionEn":"Apply SSS congruence criterion","points":3}]',
 '[{"method_zh":"等式性质证明边相等后利用 SSS 证明全等","steps":["AB = DE","△ABC ≌ △DEF (SSS)"]}]'),

('Q-2023-EXAM-S02', '2023年中考真题', 2023, '上海', '中考真题', 8, 1, 'KP-020', NULL, 3, 'solution', 8,
 '已知一次函数 $y = kx + b$ 的图象经过点 $A(2, 4)$ 和点 $B(-1, -2)$。（1）求该一次函数的解析式；（2）求该函数图象与两坐标轴围成的三角形面积。',
 'Linear function passes $(2, 4)$ and $(-1, -2)$. (1) Find formula; (2) Find triangle area with axes.',
 NULL, 'y = 2x, 面积为 0 (或过原点)',
 '[{"stepIndex":1,"descriptionZh":"列出二元一次方程组并求得 k = 2, b = 0，解析式为 y = 2x","descriptionEn":"Solve system for k=2, b=0","points":4},{"stepIndex":2,"descriptionZh":"判断直线经过原点，与坐标轴交于 (0, 0)，说明面积特征","descriptionEn":"Analyze axes intersection","points":4}]',
 '[{"method_zh":"待定系数法求解析式","steps":["2k + b = 4, -k + b = -2","k = 2, b = 0","y = 2x"]}]'),

('Q-2023-EXAM-S03', '2023年中考真题', 2023, '江苏', '中考真题', 8, 2, 'KP-028', NULL, 3, 'solution', 8,
 '已知关于 $x$ 的一元二次方程 $x^2 - 4x + m = 0$ 有两个实数根 $x_1$、$x_2$。（1）求 $m$ 的取值范围；（2）若 $x_1 + x_2 + x_1 x_2 = 7$，求 $m$ 的值。',
 'Equation $x^2 - 4x + m = 0$ has roots $x_1, x_2$. (1) Range of $m$; (2) Find $m$ if $x_1 + x_2 + x_1 x_2 = 7$.',
 NULL, 'm = 3',
 '[{"stepIndex":1,"descriptionZh":"根据判别式 Δ = 16 - 4m ≥ 0 求得 m ≤ 4","descriptionEn":"Discriminant condition m ≤ 4","points":3},{"stepIndex":2,"descriptionZh":"由韦达定理写出 x1 + x2 = 4, x1 * x2 = m","descriptionEn":"Vieta formulas x1+x2=4, x1*x2=m","points":2},{"stepIndex":3,"descriptionZh":"代入等式 4 + m = 7 解得 m = 3，符合 m ≤ 4","descriptionEn":"Solve m = 3 and verify","points":3}]',
 '[{"method_zh":"韦达定理与判别式联立求解","steps":["Δ ≥ 0 -> m ≤ 4","4 + m = 7 -> m = 3"]}]'),

('Q-2023-EXAM-S04', '2023年中考真题', 2023, '浙江', '中考真题', 8, 2, 'KP-030', NULL, 4, 'solution', 8,
 '如图，在 $\\square ABCD$ 中，对角线 $AC$、$BD$ 相交于点 $O$。过点 $O$ 作 $EF \\perp AC$ 交 $AD$ 于点 $E$，交 $BC$ 于点 $F$。求证：四边形 $AFCE$ 是菱形。',
 'In $\\square ABCD$, $EF \\perp AC$ through center $O$. Prove $AFCE$ is a rhombus.',
 NULL, '见解析',
 '[{"stepIndex":1,"descriptionZh":"证明 △AOE ≌ △COF，得出 OE = OF","descriptionEn":"Prove △AOE ≌ △COF and OE = OF","points":3},{"stepIndex":2,"descriptionZh":"由对角线互相平分判定四边形 AFCE 为平行四边形","descriptionEn":"Prove AFCE is parallelogram","points":2},{"stepIndex":3,"descriptionZh":"根据对角线互相垂直判定四边形 AFCE 为菱形","descriptionEn":"Perpendicular diagonals imply rhombus","points":3}]',
 '[{"method_zh":"对角线垂直平分的平行四边形是菱形","steps":["OE = OF","AFCE 为平行四边形","EF ⊥ AC 得证菱形"]}]'),

('Q-2023-EXAM-S05', '2023年中考真题', 2023, '山东', '中考真题', 8, 2, 'KP-032', NULL, 4, 'solution', 9,
 '如图，在 $\\triangle ABC$ 中，$D$ 是 $AB$ 边上一点，$\\angle ACD = \\angle B$。（1）求证：$\\triangle ACD \\sim \\triangle ABC$；（2）若 $AD = 2$，$AB = 8$，求 $AC$ 的长。',
 'In $\\triangle ABC$, $\\angle ACD = \\angle B$. (1) Prove $\\triangle ACD \\sim \\triangle ABC$; (2) If $AD = 2, AB = 8$, find $AC$.',
 NULL, 'AC = 4',
 '[{"stepIndex":1,"descriptionZh":"指出公共角 ∠A = ∠A，结合已知 ∠ACD = ∠B 证明相似","descriptionEn":"Two equal angles prove similarity","points":4},{"stepIndex":2,"descriptionZh":"列出相似对应边成比例 AC / AB = AD / AC","descriptionEn":"Similarity ratio AC/AB = AD/AC","points":3},{"stepIndex":3,"descriptionZh":"代入计算 AC^2 = 2 * 8 = 16，解得 AC = 4","descriptionEn":"Compute AC = 4","points":2}]',
 '[{"method_zh":"两角对应相等的两个三角形相似","steps":["△ACD ∼ △ABC","AC^2 = AD * AB = 16","AC = 4"]}]'),

('Q-2023-EXAM-S06', '2023年中考真题', 2023, '湖北', '中考真题', 9, 1, 'KP-042', NULL, 4, 'solution', 8,
 '某校数学兴趣小组测量教学楼的高度。如图，在点 $A$ 处测得楼顶 $C$ 的仰角为 $30^\\circ$，沿水平方向向前走 $20$ 米到达点 $B$，测得仰角为 $45^\\circ$。求教学楼 $CD$ 的高度（结果保留根号）。',
 'Survey height of building: elevation 30° at A, 45° at B (20m closer). Find height CD.',
 NULL, '10(√3 + 1)',
 '[{"stepIndex":1,"descriptionZh":"在 Rt△BCD 中由 ∠CBD = 45° 得到 BD = CD = h","descriptionEn":"Rt△BCD gives BD = CD = h","points":2},{"stepIndex":2,"descriptionZh":"在 Rt△ACD 中利用 tan 30° = h / (20 + h) 列方程","descriptionEn":"Set up tan 30° equation","points":3},{"stepIndex":3,"descriptionZh":"解方程分母有理化得出 h = 10(√3 + 1) 米","descriptionEn":"Solve h = 10(√3 + 1)","points":3}]',
 '[{"method_zh":"解直角三角形双仰角模型","steps":["tan 30° = h / (h + 20)","h = 10(√3 + 1)"]}]'),

('Q-2023-EXAM-S07', '2023年中考真题', 2023, '湖南', '中考真题', 9, 2, 'KP-050', NULL, 5, 'solution', 9,
 '如图，$AB$ 为 $\\odot O$ 的直径，$C$ 为 $\\odot O$ 上一点，$AD$ 平分 $\\angle BAC$ 交 $\\odot O$ 于点 $D$，过点 $D$ 作 $DE \\perp AC$ 交 $AC$ 的延长线于点 $E$。求证：$DE$ 是 $\\odot O$ 的切线。',
 'Diameter $AB$, angle bisector $AD$ intersects circle at $D$, $DE \\perp AC$. Prove $DE$ is tangent.',
 NULL, '见解析',
 '[{"stepIndex":1,"descriptionZh":"连接 OD，由 OA = OD 得到 ∠OAD = ∠ODA","descriptionEn":"Connect OD, ∠OAD = ∠ODA","points":3},{"stepIndex":2,"descriptionZh":"结合角平分线推导出 ∠ODA = ∠EAD，从而 OD ∥ AE","descriptionEn":"Prove OD ∥ AE","points":3},{"stepIndex":3,"descriptionZh":"由 DE ⊥ AE 推出 DE ⊥ OD，从而证得 DE 是切线","descriptionEn":"Prove DE ⊥ OD hence tangent","points":3}]',
 '[{"method_zh":"连半径证垂直","steps":["OD ∥ AE","DE ⊥ OD","DE 是切线"]}]'),

('Q-2023-EXAM-S08', '2023年中考真题', 2023, '广东', '中考真题', 9, 1, 'KP-040', NULL, 5, 'solution', 10,
 '如图，抛物线 $y = -x^2 + 2x + 3$ 与 $x$ 轴交于 $A$、$B$ 两点（点 $A$ 在点 $B$ 左侧），与 $y$ 轴交于点 $C$。（1）求 $A$、$B$、$C$ 三点的坐标；（2）求 $\\triangle ABC$ 的面积。',
 'Parabola $y = -x^2 + 2x + 3$. (1) Coordinates of A, B, C; (2) Area of $\\triangle ABC$.',
 NULL, 'A(-1, 0), B(3, 0), C(0, 3), 面积为 6',
 '[{"stepIndex":1,"descriptionZh":"令 y = 0 解得 x1 = -1, x2 = 3，得出 A(-1, 0), B(3, 0)","descriptionEn":"Find x-intercepts A(-1, 0), B(3, 0)","points":3},{"stepIndex":2,"descriptionZh":"令 x = 0 得出 C(0, 3)","descriptionEn":"Find y-intercept C(0, 3)","points":2},{"stepIndex":3,"descriptionZh":"求得底边 AB = 3 - (-1) = 4","descriptionEn":"Compute base AB = 4","points":2},{"stepIndex":4,"descriptionZh":"根据面积公式 S = 1/2 * AB * OC = 1/2 * 4 * 3 = 6","descriptionEn":"Compute area S = 6","points":3}]',
 '[{"method_zh":"二次函数坐标轴交点与三角形面积计算","steps":["A(-1, 0), B(3, 0), C(0, 3)","AB = 4, OC = 3","S = 6"]}]'),

('Q-2023-EXAM-S09', '2023年中考真题', 2023, '浙江', '中考真题', 9, 1, 'KP-045', 'C3-0023', 6, 'solution', 12,
 '如图，已知 $\\triangle ABC$ 与 $\\triangle ADE$ 均为等腰直角三角形，$\\angle BAC = \\angle DAE = 90^\\circ$，$AB = AC$，$AD = AE$。连接 $BD$、$CE$ 交于点 $P$。（1）求证：$BD = CE$ 且 $BD \\perp CE$；（2）当点 $D$ 运动使得 $P$、$D$、$E$ 三点共线时，求 $\\angle BPD$ 的度数。',
 'Isosceles right triangles $\\triangle ABC, \\triangle ADE$. (1) Prove $BD = CE$ and $BD \\perp CE$; (2) Angle $\\angle BPD$.',
 NULL, '见解析',
 '[{"stepIndex":1,"descriptionZh":"由 ∠BAD = ∠CAE 及 SAS 证明 △ABD ≌ △ACE","descriptionEn":"Prove △ABD ≌ △ACE by SAS","points":3},{"stepIndex":2,"descriptionZh":"得出对应边 BD = CE，对应角 ∠ABD = ∠ACE","descriptionEn":"Conclude BD = CE and equal angles","points":3},{"stepIndex":3,"descriptionZh":"通过三角形内角和推导交角 ∠BPC = 90° 即 BD ⊥ CE","descriptionEn":"Prove BD ⊥ CE","points":3},{"stepIndex":4,"descriptionZh":"分析三点共线临界状态，求得 ∠BPD = 90° 或 45°","descriptionEn":"Analyze collinear state and angle","points":3}]',
 '[{"method_zh":"手拉手全等与旋转正交性证明","steps":["△ABD ≌ △ACE","BD = CE","BD ⊥ CE"]}]');
`;

  execSync(`sqlite3 "${questionsDbPath}"`, { input: questionsSql, encoding: 'utf-8' });
  console.log('[Seed] questions.db seeded successfully.');
}

if (process.argv[1] === __filename) {
  seedMockDatabase();
}
