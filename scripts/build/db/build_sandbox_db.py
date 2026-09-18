#!/usr/bin/env python3
"""
构建 data/sandbox.db (阶段一 步骤 4: 概念沙盒选点 + 36 跃迁模型手册直录)
严格遵照 EXECUTION_GUIDE_Stage34.md:
1. 概念沙盒选点：46 个核心考点 (数轴4 + 函数12 + 几何30), engine_type ∈ {'number_axis', 'function', 'geometry'}
2. 36 跃迁模型严格按 docs/实验室二_模型手册.md 直录, 绝不自编
3. 考点依赖严格转为 KP-0xx 并 100% 通过 core.db 白名单校验
4. 各表增加 content_status VARCHAR(12) NOT NULL DEFAULT 'pending'
"""

import os
import json
import sqlite3

SANDBOX_DB_PATH = "data/sandbox.db"
CORE_DB_PATH = "data/core.db"

SCHEMA_SQL = """
DROP TABLE IF EXISTS concept_sandboxes;
DROP TABLE IF EXISTS leap_sandbox_models;

CREATE TABLE concept_sandboxes (
    sandbox_id VARCHAR(32) PRIMARY KEY,
    point_id VARCHAR(32) NOT NULL,
    category_id VARCHAR(32),
    engine_type VARCHAR(16) NOT NULL,
    canvas_template VARCHAR(64),
    inquiry_guide_zh TEXT,
    inquiry_guide_en TEXT,
    viewbox_spec_json TEXT,
    drag_points_json TEXT,
    param_sliders_json TEXT,
    invariants_display_json TEXT,
    content_status VARCHAR(12) NOT NULL DEFAULT 'pending'
);

CREATE TABLE leap_sandbox_models (
    model_id VARCHAR(32) PRIMARY KEY,
    model_name_zh VARCHAR(64) NOT NULL,
    model_name_en VARCHAR(128),
    unlocked_semester VARCHAR(8) NOT NULL,
    primary_line VARCHAR(16) NOT NULL,
    category_id VARCHAR(32),
    tier_level INTEGER NOT NULL,
    canonical_state_count INTEGER NOT NULL,
    kp_dependencies TEXT NOT NULL,
    clique_id VARCHAR(32),
    model_brief_zh TEXT,
    model_brief_en TEXT,
    viewbox_spec_json TEXT,
    carrier_morphing_json TEXT,
    parameter_morphing_json TEXT,
    posture_morphing_json TEXT,
    camouflage_xray_json TEXT,
    content_status VARCHAR(12) NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_cs_point ON concept_sandboxes(point_id);
CREATE INDEX IF NOT EXISTS idx_lm_line ON leap_sandbox_models(primary_line);
CREATE INDEX IF NOT EXISTS idx_lm_semester ON leap_sandbox_models(unlocked_semester);
"""

# 46 个精选概念沙盒考点定义
SELECTED_SANDBOX_KPS = [
    # 1. 数轴与实数 (4个)
    ("KP-001", "number_axis", "number_axis", "number_axis_template", "拖动数轴动点，观察有理数分类与正负数方向性。"),
    ("KP-002", "number_axis", "number_axis", "number_axis_template", "移动点P，直观探究数轴三要素与连续稠密性。"),
    ("KP-003", "number_axis", "number_axis", "number_axis_distance_template", "拖动原点两侧动点，探究相反数对称性与绝对值距离本质。"),
    ("KP-008", "number_axis", "number_axis", "number_axis_interval_template", "拖动无理数点，观察与相邻有理数区间的无限逼近夹逼。"),

    # 2. 函数与坐标系 (12个)
    ("KP-032", "function", "function", "function_direct_template", "调节斜率 k，观察正比例函数直线旋转与象限穿越。"),
    ("KP-033", "function", "function", "function_linear_solve_template", "拖动直线上两定点，观察待定系数法解析式动态重算。"),
    ("KP-034", "function", "function", "function_linear_prop_template", "调节截距 b 与斜率 k，探究一次函数单调增减性。"),
    ("KP-035", "function", "function", "function_linear_equation_template", "移动直线交点，探究一次函数与二元方程组同解几何化。"),
    ("KP-036", "function", "function", "function_inverse_template", "拖动双曲线动点，观察一三象限对称与无限渐近线。"),
    ("KP-037", "function", "function", "function_inverse_k_template", "拖动矩形对角顶点，探究反比例函数 k 矩形面积不变恒等。"),
    ("KP-038", "function", "function", "function_quadratic_forms_template", "切换一般式、顶点式与交点式，观察抛物线形态。"),
    ("KP-039", "function", "function", "function_quadratic_vertex_template", "移动顶点 (h, k)，观察抛物线平移轨迹与对称轴。"),
    ("KP-040", "function", "function", "function_quadratic_roots_template", "调整抛物线高度，探究与 x 轴交点判别式 Δ 临界态。"),
    ("KP-041", "function", "function", "function_quadratic_extrema_template", "在给定闭区间内滑动自变量，探究二次函数动轴定区间最值。"),
    ("KP-042", "function", "function", "function_quadratic_ineq_template", "观察抛物线位于 x 轴上方的区间，探究二次不等式解集。"),
    ("KP-043", "function", "function", "function_quadratic_modeling_template", "拖动铅垂高动点，探究割线多边形面积动态极值。"),

    # 3. 几何基础、三角形、四边形、圆、变换 (30个)
    ("KP-044", "geometry", "geometry", "geometry_point_line_template", "拖动端点，观察线段射线直线的延展性与相交角。"),
    ("KP-045", "geometry", "geometry", "geometry_segment_mid_template", "移动线段端点，探究双中点折半与两点之间线段最短。"),
    ("KP-046", "geometry", "geometry", "geometry_angle_calc_template", "拖动射线旋转角，观察余角、补角与对顶角相等。"),
    ("KP-047", "geometry", "geometry", "geometry_perpendicular_template", "拖动垂足与点，验证点到直线所有线段中垂线段最短。"),
    ("KP-048", "geometry", "geometry", "geometry_parallel_template", "旋转截线，动态观测同位角、内错角与同旁内角互补。"),
    ("KP-049", "geometry", "geometry", "geometry_triangle_sum_template", "拖动三角形顶点，直观验证内角和恒为 180°。"),
    ("KP-051", "geometry", "geometry", "geometry_congruence_template", "拖动 SAS/ASA/SSS 条件杆，验证全等三角形唯一重合。"),
    ("KP-053", "geometry", "geometry", "geometry_isosceles_template", "调节等腰顶角，观察三线合一（高、中线、角平分线）共线。"),
    ("KP-055", "geometry", "geometry", "geometry_equilateral_template", "拖动等边三角形，观察 60° 旋转自对称与四心合一。"),
    ("KP-056", "geometry", "geometry", "geometry_right_triangle_template", "拖动斜边动点，验证直角三角形斜边中线等于斜边一半。"),
    ("KP-057", "geometry", "geometry", "geometry_pythagorean_template", "拖动直角顶点，观察三边正方形赵爽弦图面积割补守恒。"),
    ("KP-058", "geometry", "geometry", "geometry_similarity_template", "调节相似比 k，观察相似三角形对应角相等、边成比例。"),
    ("KP-060", "geometry", "geometry", "geometry_homothety_template", "拖动位似中心，观察图形位似缩放与坐标倍率变化。"),
    ("KP-062", "geometry", "geometry", "geometry_parallelogram_template", "拖动顶点，探究平行四边形对边对角相等与对角线互相平分。"),
    ("KP-064", "geometry", "geometry", "geometry_rectangle_template", "旋转相邻边至直角，观察对角线相等与矩形四直角。"),
    ("KP-065", "geometry", "geometry", "geometry_rhombus_template", "调整相邻边至等长，观察菱形对角线互相垂直平分与轴对称。"),
    ("KP-066", "geometry", "geometry", "geometry_square_template", "综合矩形与菱形约束，验证正方形完全对称性。"),
    ("KP-068", "geometry", "geometry", "geometry_midpoint_quad_template", "任意拖动四边形四个顶点，探究其中点四边形恒为平行四边形。"),
    ("KP-069", "geometry", "geometry", "geometry_circle_def_template", "拖动半径端点，观察圆上所有点到定点距离等于定长。"),
    ("KP-071", "geometry", "geometry", "geometry_line_circle_template", "滑动直线与圆心距离 d，探究相交、相切、相离三种临界位置。"),
    ("KP-072", "geometry", "geometry", "geometry_tangent_template", "旋转切线，验证切线垂直于过切点的半径及切线长定理。"),
    ("KP-073", "geometry", "geometry", "geometry_inscribed_angle_template", "在圆周上滑动圆周角顶点，验证同弧所对圆周角等于圆心角一半。"),
    ("KP-074", "geometry", "geometry", "geometry_chord_bisector_template", "滑动弦 AB，观察垂径定理垂直平分弦与平分两段弧。"),
    ("KP-076", "geometry", "geometry", "geometry_incircle_template", "拖动三角形三边，观察内切圆内心（角平分线交点）切三边。"),
    ("KP-077", "geometry", "geometry", "geometry_sector_template", "调节圆心角 α 与半径 r，观察弧长与扇形面积正比关系。"),
    ("KP-079", "geometry", "geometry", "geometry_reflection_template", "拖动对称轴，观察轴对称翻折前后对应点垂直平分与全等保距。"),
    ("KP-080", "geometry", "geometry", "geometry_translation_template", "滑动平移向量，观察平移前后对应线段平行且相等。"),
    ("KP-081", "geometry", "geometry", "geometry_rotation_template", "调节旋转角 α，观察绕旋转中心旋转手拉手模型全等保距。"),
    ("KP-082", "geometry", "geometry", "geometry_central_sym_template", "旋转 180°，验证中心对称图形对称中心平分对应点线段。"),
    ("KP-085", "geometry", "geometry", "geometry_trig_def_template", "改变锐角 α 大小，观察直角三角形对边/斜边正弦比值唯一确定。"),
]

# 36 跃迁模型直录字典（严格来自 docs/实验室二_模型手册.md）
LEAP_MODELS_SPEC = [
    # 7A (2)
    {
        "id": "LM-7A-01", "name": "数轴动点与绝对值几何距离模型", "sem": "7A", "line": "A1",
        "deps": ["KP-001", "KP-002", "KP-003", "KP-019"], "tier": 1, "states": 4, "cat": "algebra_number",
        "brief": "数轴动点折线距离和化归，奇数中位数取点极值，偶数区间恒值。"
    },
    {
        "id": "LM-7A-02", "name": "线段双中点与角平分线和差模型", "sem": "7A", "line": "G1",
        "deps": ["KP-044", "KP-045", "KP-046", "KP-019"], "tier": 1, "states": 4, "cat": "geometry_foundations",
        "brief": "双中点折半与邻补角内外角平分线垂直，对半公式直击不变量。"
    },
    # 7B (3)
    {
        "id": "LM-7B-03", "name": "非负数之和为零模型", "sem": "7B", "line": "A1",
        "deps": ["KP-003", "KP-006", "KP-020"], "tier": 1, "states": 3, "cat": "algebra_number",
        "brief": "绝对值、偶次幂、算术平方根非负和为零，各自为零构建方程组。"
    },
    {
        "id": "LM-7B-04", "name": "造桥选址平移最短路径模型", "sem": "7B", "line": "G5",
        "deps": ["KP-045", "KP-048", "KP-080"], "tier": 1, "states": 4, "cat": "geometry_transform",
        "brief": "利用向量平移扣除河宽常量，转化为两点之间线段最短化折为直。"
    },
    {
        "id": "LM-7B-05", "name": "二元一次方程组与坐标系交点模型", "sem": "7B", "line": "A3",
        "deps": ["KP-020", "KP-029", "KP-031"], "tier": 1, "states": 4, "cat": "algebra_function",
        "brief": "二元一次方程对应直线，方程组解对应坐标系两直线交点。"
    },
    # 8A (7)
    {
        "id": "LM-8A-06", "name": "乘法公式面积割补与配方恒等模型", "sem": "8A", "line": "A2",
        "deps": ["KP-010", "KP-012", "KP-014"], "tier": 1, "states": 5, "cat": "algebra_expression",
        "brief": "正方形与矩形面积割补证明完全平方与平方差公式，配方几何化。"
    },
    {
        "id": "LM-8A-07", "name": "因式分解十字相乘与分组分解模型", "sem": "8A", "line": "A2",
        "deps": ["KP-011", "KP-014"], "tier": 1, "states": 4, "cat": "algebra_expression",
        "brief": "双十字相乘与分组添项拆项，高阶代数式积化和差逆向工程。"
    },
    {
        "id": "LM-8A-08", "name": "分式方程增根与裂项相消模型", "sem": "8A", "line": "A3",
        "deps": ["KP-016", "KP-017", "KP-018"], "tier": 1, "states": 4, "cat": "algebra_expression",
        "brief": "分式去分母公分母为零判增根，裂项相消解决求和极限。"
    },
    {
        "id": "LM-8A-09", "name": "倍长中线与中点构造全等模型", "sem": "8A", "line": "G2",
        "deps": ["KP-049", "KP-051", "KP-052"], "tier": 1, "states": 6, "cat": "geometry_triangle",
        "brief": "遇到中线倍长一倍，构造 SAS 对顶角全等，实现边角位置大转移。"
    },
    {
        "id": "LM-8A-10", "name": "截长补短线段和差证明模型", "sem": "8A", "line": "G2",
        "deps": ["KP-049", "KP-051", "KP-053"], "tier": 1, "states": 5, "cat": "geometry_triangle",
        "brief": "在长线段截取一段或在短线段延长补齐，构造全等三角形证明线段和差。"
    },
    {
        "id": "LM-8A-11", "name": "角平分线四大衍生模型", "sem": "8A", "line": "G2",
        "deps": ["KP-048", "KP-051", "KP-053"], "tier": 1, "states": 5, "cat": "geometry_triangle",
        "brief": "见角平分线作双垂线、角平分线加垂线出等腰、角平分线加平行出等腰。"
    },
    {
        "id": "LM-8A-12", "name": "将军饮马轴对称最短路径模型", "sem": "8A", "line": "G5",
        "deps": ["KP-045", "KP-053", "KP-079"], "tier": 1, "states": 5, "cat": "geometry_transform",
        "brief": "定点关于动点所在直线对称，两点之间线段最短解决周长与距离极值。"
    },
    # 8B (5)
    {
        "id": "LM-8B-13", "name": "勾股定理折叠翻折与动点方程模型", "sem": "8B", "line": "G4",
        "deps": ["KP-056", "KP-057", "KP-079"], "tier": 1, "states": 5, "cat": "geometry_measurement",
        "brief": "几何折叠轴对称保距，设元建立直角三角形勾股二次方程精确求解。"
    },
    {
        "id": "LM-8B-14", "name": "十字架对角线垂直与中点四边形模型", "sem": "8B", "line": "G3",
        "deps": ["KP-056", "KP-062", "KP-066", "KP-068"], "tier": 1, "states": 5, "cat": "geometry_quadrilateral",
        "brief": "对角线互相垂直四边形对边平方和相等，顺次连接中点得矩形。"
    },
    {
        "id": "LM-8B-15", "name": "一次函数图象性质与方程不等式综合模型", "sem": "8B", "line": "A4",
        "deps": ["KP-032", "KP-033", "KP-034", "KP-035"], "tier": 1, "states": 4, "cat": "algebra_function",
        "brief": "一次函数图象高低判断一元一次不等式解集，图象交点对应方程解。"
    },
    {
        "id": "LM-8B-16", "name": "一次函数分段函数与方案最优化模型", "sem": "8B", "line": "A4",
        "deps": ["KP-030", "KP-033", "KP-043"], "tier": 1, "states": 4, "cat": "algebra_function",
        "brief": "阶梯水费与出租车计费分段函数，自变量分段讨论端点极值最优化。"
    },
    {
        "id": "LM-8B-17", "name": "统计指标加权平均与方差风险决策模型", "sem": "8B", "line": "S1",
        "deps": ["KP-097", "KP-098", "KP-101", "KP-102"], "tier": 1, "states": 4, "cat": "statistics_probability",
        "brief": "均值衡量整体水平，方差衡量稳定性与离散程度，双指标科学风险决策。"
    },
    # 9A (11)
    {
        "id": "LM-9A-18", "name": "一元二次方程判别式与韦达对称代数模型", "sem": "9A", "line": "A3",
        "deps": ["KP-021", "KP-023", "KP-026"], "tier": 2, "states": 5, "cat": "algebra_expression",
        "brief": "判别式确定根的存在性，韦达定理对偶对称式整体代入求代数极值。"
    },
    {
        "id": "LM-9A-19", "name": "手拉手旋转全等模型", "sem": "9A", "line": "G5",
        "deps": ["KP-051", "KP-053", "KP-081"], "tier": 2, "states": 5, "cat": "geometry_transform",
        "brief": "共顶等线成旋转，两个共顶点的等腰/等边三角形诱导旋转全等全息链。"
    },
    {
        "id": "LM-9A-20", "name": "半角旋转翻折拼合模型", "sem": "9A", "line": "G3",
        "deps": ["KP-051", "KP-066", "KP-079", "KP-081"], "tier": 2, "states": 5, "cat": "geometry_quadrilateral",
        "brief": "正方形含 45° 旋转 90° 拼合全等，长线段等于两短线段之和。"
    },
    {
        "id": "LM-9A-21", "name": "费马点120°旋转距离和极值模型", "sem": "9A", "line": "G5",
        "deps": ["KP-049", "KP-055", "KP-057", "KP-081"], "tier": 2, "states": 4, "cat": "geometry_transform",
        "brief": "绕顶点旋转 60° 构造等边三角形，将三折线化为一直线求费马点距离和极小值。"
    },
    {
        "id": "LM-9A-22", "name": "定弦定角隐形圆模型", "sem": "9A", "line": "G4",
        "deps": ["KP-069", "KP-073", "KP-074"], "tier": 2, "states": 6, "cat": "geometry_circle",
        "brief": "定长弦对定角，动点轨迹落在外接隐形圆上，三点共线时线段达极值。"
    },
    {
        "id": "LM-9A-23", "name": "四点共圆对角互补与直角隐圆模型", "sem": "9A", "line": "G4",
        "deps": ["KP-056", "KP-069", "KP-073"], "tier": 2, "states": 5, "cat": "geometry_circle",
        "brief": "对角互补或共底边两直角，四点共圆构建圆周角转换与托勒密定理。"
    },
    {
        "id": "LM-9A-24", "name": "切线长定理与内切圆/外接圆模型", "sem": "9A", "line": "G4",
        "deps": ["KP-072", "KP-074", "KP-076"], "tier": 2, "states": 6, "cat": "geometry_circle",
        "brief": "圆外一点引两条切线切线长相等，三角形面积切线内切圆半径等积转化。"
    },
    {
        "id": "LM-9A-25", "name": "二次函数铅垂高水平宽动点面积割补模型", "sem": "9A", "line": "A4",
        "deps": ["KP-031", "KP-038", "KP-041", "KP-043"], "tier": 2, "states": 5, "cat": "algebra_function",
        "brief": "割线三角形面积等于铅垂高乘水平宽之半，转化为关于横坐标 t 的二次函数求最值。"
    },
    {
        "id": "LM-9A-26", "name": "二次函数特殊四边形存在性模型", "sem": "9A", "line": "A4",
        "deps": ["KP-031", "KP-038", "KP-042", "KP-062", "KP-063", "KP-064", "KP-065", "KP-066"], "tier": 2, "states": 6, "cat": "algebra_function",
        "brief": "平行四边形对角线中点重合横纵坐标方程，菱形矩形对角线垂直与相等判别。"
    },
    {
        "id": "LM-9A-27", "name": "二次函数特殊三角形存在性模型", "sem": "9A", "line": "A4",
        "deps": ["KP-031", "KP-038", "KP-040", "KP-056", "KP-057"], "tier": 2, "states": 5, "cat": "algebra_function",
        "brief": "直角三角形两线垂直斜率积为负一或两点距离勾股，等腰两圆一线分类讨论。"
    },
    {
        "id": "LM-9A-28", "name": "二次函数与直角坐标系综合最值模型", "sem": "9A", "line": "A4",
        "deps": ["KP-030", "KP-031", "KP-038", "KP-039", "KP-040", "KP-041", "KP-042", "KP-043"], "tier": 2, "states": 6, "cat": "algebra_function",
        "brief": "中考代数压轴母题，动轴定区间、直线相切判别式、翻折绝对值与和差极值。"
    },
    # 9B (8)
    {
        "id": "LM-9B-29", "name": "一线三等角(K字型相似)模型", "sem": "9B", "line": "G6",
        "deps": ["KP-031", "KP-058", "KP-059"], "tier": 2, "states": 5, "cat": "geometry_similarity",
        "brief": "同一直线上三个等角诱导互余角互补，构建两组相似三角形线段比例式。"
    },
    {
        "id": "LM-9B-30", "name": "母子相似与直角三角形射影定理模型", "sem": "9B", "line": "G6",
        "deps": ["KP-056", "KP-057", "KP-058", "KP-059"], "tier": 2, "states": 5, "cat": "geometry_similarity",
        "brief": "直角三角形斜边高构建母子双相似，直角边平方等于射影乘斜边射影定理。"
    },
    {
        "id": "LM-9B-31", "name": "胡不归加权线段最值模型", "sem": "9B", "line": "G6",
        "deps": ["KP-047", "KP-085", "KP-091"], "tier": 2, "states": 5, "cat": "geometry_measurement",
        "brief": "加权线段 PA + k·PB (k < 1)，构造锐角 sin θ = k 化折线为垂线段最短。"
    },
    {
        "id": "LM-9B-32", "name": "阿波罗尼斯圆(阿氏圆)加权最值模型", "sem": "9B", "line": "G4",
        "deps": ["KP-058", "KP-059", "KP-069", "KP-070"], "tier": 2, "states": 6, "cat": "geometry_circle",
        "brief": "到两定点距离之比为定值 k 的动点轨迹为阿氏圆，母子相似母角代换求最值。"
    },
    {
        "id": "LM-9B-33", "name": "瓜豆原理主从动点轨迹位似旋转模型", "sem": "9B", "line": "G5",
        "deps": ["KP-060", "KP-081", "KP-083"], "tier": 2, "states": 5, "cat": "geometry_transform",
        "brief": "种瓜得瓜种豆得豆，主动点在直线/圆上运动，从动点轨迹同胚位似旋转。"
    },
    {
        "id": "LM-9B-34", "name": "反比例函数面积不变性与中心对称反演模型", "sem": "9B", "line": "A4",
        "deps": ["KP-036", "KP-037", "KP-043"], "tier": 1, "states": 4, "cat": "algebra_function",
        "brief": "双曲线任意点引坐标轴垂线矩形面积恒为 |k|，原点中心对称等线段反演。"
    },
    {
        "id": "LM-9B-35", "name": "三视图正交投影与空间积木还原模型", "sem": "9B", "line": "G1",
        "deps": ["KP-084"], "tier": 1, "states": 4, "cat": "geometry_foundations",
        "brief": "长对正、高平齐、宽相等，正投影正交视图还原空间立体几何积木块数范围。"
    },
    {
        "id": "LM-9B-36", "name": "直角三角形与锐角三角函数综合度量模型", "sem": "9B", "line": "G6",
        "deps": ["KP-056", "KP-085", "KP-086", "KP-087", "KP-088", "KP-089", "KP-090", "KP-091"], "tier": 2, "states": 6, "cat": "geometry_measurement",
        "brief": "中考几何终极压轴，双直角三角形设高或公共边列三角方程，仰角俯角测量建模。"
    }
]

def build_sandbox_db():
    if not os.path.exists(CORE_DB_PATH):
        raise FileNotFoundError(f"Missing core db at {CORE_DB_PATH}")

    # 读取 core.db 考点列表供校验
    core_conn = sqlite3.connect(CORE_DB_PATH)
    core_c = core_conn.cursor()
    valid_kps = set(r[0] for r in core_c.execute("SELECT point_id FROM knowledge_points;").fetchall())
    core_conn.close()

    print(f"Loaded {len(valid_kps)} valid KPs from core.db for whitelist verification.")

    sandbox_conn = sqlite3.connect(SANDBOX_DB_PATH)
    sandbox_c = sandbox_conn.cursor()
    sandbox_c.executescript(SCHEMA_SQL)

    # 1. 写入 46 个概念沙盒
    cs_count = 0
    for pid, cat, eng, tmpl, guide in SELECTED_SANDBOX_KPS:
        if pid not in valid_kps:
            raise ValueError(f"Selected sandbox KP {pid} not in core.db!")
        
        num = int(pid.split('-')[1])
        sbid = f"SB-KP{num:03d}"
        viewbox = json.dumps({"xMin": -10, "xMax": 10, "yMin": -8, "yMax": 8, "marginPercent": 15})
        drag_pts = json.dumps([{"id": "P", "x": 2, "y": 3, "constrainTo": "curve"}])
        sliders = json.dumps([{"id": "param_k", "min": -5, "max": 5, "default": 1, "step": 0.1}])
        invariants = json.dumps({"labelZh": "恒等几何量", "formula": "f(x) = const"})

        sandbox_c.execute("""
            INSERT INTO concept_sandboxes (
                sandbox_id, point_id, category_id, engine_type, canvas_template,
                inquiry_guide_zh, inquiry_guide_en, viewbox_spec_json,
                drag_points_json, param_sliders_json, invariants_display_json,
                content_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            sbid, pid, cat, eng, tmpl,
            guide, "__PENDING_CONTENT__", viewbox,
            drag_pts, sliders, invariants,
            "pending"
        ))
        cs_count += 1

    # 2. 写入 36 个跃迁模型
    lm_count = 0
    for m in LEAP_MODELS_SPEC:
        # 白名单校验
        for dep in m["deps"]:
            if dep not in valid_kps:
                raise ValueError(f"Model {m['id']} dependency {dep} not in core.db!")

        viewbox = json.dumps({"xMin": -10, "xMax": 10, "yMin": -8, "yMax": 8, "marginPercent": 15, "preserveAspectRatio": True})
        carrier = json.dumps({"description": "模型载体变异选项", "default": "standard"})
        param = json.dumps({"description": "参数变异滑块", "sliders": [{"id": "param_t", "min": 0, "max": 10}]})
        posture = json.dumps({"description": "姿态变异形态", "modes": ["standard", "rotated", "reflected"]})
        xray = json.dumps({"description": "干扰加壳与骨架透视", "coreSkeleton": m["name"]})

        sandbox_c.execute("""
            INSERT INTO leap_sandbox_models (
                model_id, model_name_zh, model_name_en, unlocked_semester,
                primary_line, category_id, tier_level, canonical_state_count,
                kp_dependencies, clique_id, model_brief_zh, model_brief_en,
                viewbox_spec_json, carrier_morphing_json, parameter_morphing_json,
                posture_morphing_json, camouflage_xray_json, content_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            m["id"], m["name"], "__PENDING_CONTENT__", m["sem"],
            m["line"], m["cat"], m["tier"], m["states"],
            json.dumps(m["deps"]), None, m["brief"], "__PENDING_CONTENT__",
            viewbox, carrier, param, posture, xray, "pending"
        ))
        lm_count += 1

    sandbox_conn.commit()
    sandbox_conn.close()

    print(f"Sandbox DB successfully built: {cs_count} concept_sandboxes + {lm_count} leap_sandbox_models.")

if __name__ == "__main__":
    build_sandbox_db()
