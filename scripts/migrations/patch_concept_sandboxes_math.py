#!/usr/bin/env python3
"""
Track A & Track B: 14+ 概念沙盒数学精度与遥测底库迁移
脚本: scripts/migrations/patch_concept_sandboxes_math.py

涵盖考点:
- Track A (7 函数类):
  - SB-KP033: 一次函数待定系数法 (两动点 (x1, y1), (x2, y2) 求斜率 k 与截距 b)
  - SB-KP034: 一次函数性质与围成面积 S_{AOB} = b² / (2|k|)
  - SB-KP035: 一次函数平移与二元一次方程组交点
  - SB-KP039: 二次函数顶点式 y = a(x - h)² + k (顶点 (h, k), 对称轴 x = h)
  - SB-KP040: 二次函数与判别式 Δ = b² - 4ac, 两零点距离 |x₁ - x₂| = √Δ / |a|
  - SB-KP041: 二次函数动轴定区间最值
  - SB-KP042: 二次不等式与割线水位弦长
  - SB-KP043: 二次函数建模与铅垂高极值 S = 1/2 · w · h(t)
- Track B (7 几何类):
  - SB-KP045: 线段长短、中点与分点
  - SB-KP048: 平行同位角与同旁内角互补
  - SB-KP056: 直角三角形斜边中线 CM = 1/2 AB
  - SB-KP057: 勾股定理赵爽弦图与 a² + b² ≡ c²
  - SB-KP060: 位似变换对应线段比与平行
  - SB-KP065: 菱形面积 S = 1/2 · d₁ · d₂ 与四边闭合
  - SB-KP072: 圆切线长定理 PA = PB = √(OP² - r²)
  - SB-KP076: 三角形内切圆与内心 r = S / p
  - SB-KP077: 扇形面积 S = nπr² / 360 与弧长 l = nπr / 180
"""

import sqlite3
import json
import os
import shutil
import time

DB_PATHS = ['data/sandbox.db', 'public/data/sandbox.db']
BACKUP_DIR = 'data/db_backups'

def backup_databases():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = int(time.time())
    for db_path in DB_PATHS:
        if os.path.exists(db_path):
            base_name = os.path.basename(db_path)
            bak_path = os.path.join(BACKUP_DIR, f"{base_name}.patch_concept_sandboxes_math_{ts}.bak")
            shutil.copy2(db_path, bak_path)
            print(f"[Backup] {db_path} -> {bak_path}")

def get_patches():
    patches = {}

    # =========================================================================
    # Track A: 函数类
    # =========================================================================

    # 1. SB-KP033: 一次函数待定系数法 (补全 pt_y2 滑块与严密公式)
    patches['SB-KP033'] = {
        'param_sliders_json': json.dumps([
            {
                "id": "pt_x1",
                "param_key": "pt_x1",
                "name": "点A横坐标 x₁",
                "nameZh": "点A横坐标 x₁",
                "nameEn": "Point A x-coord x₁",
                "labelZh": "点A横坐标 x₁",
                "labelEn": "Point A x-coord x₁",
                "min": -5.0,
                "max": 5.0,
                "default": -2.0,
                "step": 0.5,
                "math_meaning": "已知点 A 的横坐标"
            },
            {
                "id": "pt_y1",
                "param_key": "pt_y1",
                "name": "点A纵坐标 y₁",
                "nameZh": "点A纵坐标 y₁",
                "nameEn": "Point A y-coord y₁",
                "labelZh": "点A纵坐标 y₁",
                "labelEn": "Point A y-coord y₁",
                "min": -5.0,
                "max": 5.0,
                "default": -1.0,
                "step": 0.5,
                "math_meaning": "已知点 A 的纵坐标"
            },
            {
                "id": "pt_x2",
                "param_key": "pt_x2",
                "name": "点B横坐标 x₂",
                "nameZh": "点B横坐标 x₂",
                "nameEn": "Point B x-coord x₂",
                "labelZh": "点B横坐标 x₂",
                "labelEn": "Point B x-coord x₂",
                "min": -5.0,
                "max": 5.0,
                "default": 3.0,
                "step": 0.5,
                "math_meaning": "已知点 B 的横坐标"
            },
            {
                "id": "pt_y2",
                "param_key": "pt_y2",
                "name": "点B纵坐标 y₂",
                "nameZh": "点B纵坐标 y₂",
                "nameEn": "Point B y-coord y₂",
                "labelZh": "点B纵坐标 y₂",
                "labelEn": "Point B y-coord y₂",
                "min": -5.0,
                "max": 5.0,
                "default": 4.0,
                "step": 0.5,
                "math_meaning": "已知点 B 的纵坐标"
            }
        ], ensure_ascii=False),
        'drag_points_json': json.dumps([
            {
                "id": "pA",
                "name": "A",
                "x": -2.0,
                "y": -1.0,
                "size": 4,
                "color": "#38bdf8",
                "isFixed": False,
                "constraints": "free"
            },
            {
                "id": "pB",
                "name": "B",
                "x": 3.0,
                "y": 4.0,
                "size": 4,
                "color": "#818cf8",
                "isFixed": False,
                "constraints": "free"
            }
        ], ensure_ascii=False),
        'invariants_display_json': json.dumps([
            {
                "id": "inv_slope_k",
                "formula": "(pt_y2 - pt_y1) / (pt_x2 - pt_x1 + 0.00001)",
                "deps": ["pt_x1", "pt_y1", "pt_x2", "pt_y2"],
                "labelZh": "待定系数斜率 k = (y₂ - y₁) / (x₂ - x₁)",
                "labelEn": "Slope k = (y₂ - y₁) / (x₂ - x₁)",
                "isConstant": False
            },
            {
                "id": "inv_intercept_b",
                "formula": "pt_y1 - ((pt_y2 - pt_y1) / (pt_x2 - pt_x1 + 0.00001)) * pt_x1",
                "deps": ["pt_x1", "pt_y1", "pt_x2", "pt_y2"],
                "labelZh": "截距 b = y₁ - k · x₁",
                "labelEn": "Intercept b = y₁ - k · x₁",
                "isConstant": False
            },
            {
                "id": "inv_dist_ab",
                "formula": "sqrt((pt_x2 - pt_x1)^2 + (pt_y2 - pt_y1)^2)",
                "deps": ["pt_x1", "pt_y1", "pt_x2", "pt_y2"],
                "labelZh": "两点间线段长 AB",
                "labelEn": "Distance AB",
                "isConstant": False
            }
        ], ensure_ascii=False),
        'inquiry_steps_json': json.dumps([
            {
                "step": 1,
                "title": "设定两动点坐标求斜率 k",
                "titleZh": "设定两动点坐标求斜率 k",
                "titleEn": "Set Coordinates of Two Points to Find Slope k",
                "guide_text": "调整点 A(x₁, y₁) 与点 B(x₂, y₂)，观察斜率 k = (y₂ - y₁) / (x₂ - x₁) 的实时变化。",
                "guideTextZh": "调整点 A(x₁, y₁) 与点 B(x₂, y₂)，观察斜率 k = (y₂ - y₁) / (x₂ - x₁) 的实时变化。",
                "guideTextEn": "Adjust point A(x₁, y₁) and point B(x₂, y₂) to observe the real-time slope k = (y₂ - y₁) / (x₂ - x₁).",
                "target_condition": "pt_x1 !== -2.0 || pt_y1 !== -1.0",
                "aha_insight": "已知两点时，直线的倾斜程度由纵坐标增量比横坐标增量严格决定！",
                "ahaInsightZh": "已知两点时，直线的倾斜程度由纵坐标增量比横坐标增量严格决定！",
                "ahaInsightEn": "When two points are given, the steepness of the line is strictly determined by the ratio of vertical change to horizontal change!"
            },
            {
                "step": 2,
                "title": "代入点坐标求截距 b",
                "titleZh": "代入点坐标求截距 b",
                "titleEn": "Substitute Point Coordinates to Solve for Intercept b",
                "guide_text": "将求出的斜率 k 代入 y = kx + b，观察截距 b = y₁ - kx₁ 的闭环计算。",
                "guideTextZh": "将求出的斜率 k 代入 y = kx + b，观察截距 b = y₁ - kx₁ 的闭环计算。",
                "guideTextEn": "Substitute slope k into y = kx + b to observe the calculation of intercept b = y₁ - kx₁.",
                "target_condition": "pt_x2 !== 3.0 || pt_y2 !== 4.0",
                "aha_insight": "把任一点坐标代入解析式，截距 b 即可唯一确定！",
                "ahaInsightZh": "把任一点坐标代入解析式，截距 b 即可唯一确定！",
                "ahaInsightEn": "Substituting either point's coordinates uniquely determines intercept b!"
            },
            {
                "step": 3,
                "title": "验证待定系数解析式闭环",
                "titleZh": "验证待定系数解析式闭环",
                "titleEn": "Verify Undetermined Coefficients Analytic Equation",
                "guide_text": "拖拽点 A、B，确保直线严密穿过两点且与坐标轴截距完全匹配。",
                "guideTextZh": "拖拽点 A、B，确保直线严密穿过两点且与坐标轴截距完全匹配。",
                "guideTextEn": "Drag points A and B to verify that the linear graph passes precisely through both points.",
                "target_condition": "Math.abs(pt_x2 - pt_x1) >= 2.0",
                "aha_insight": "待定系数法是函数解析式求法的核心，两点定一线，二元一次方程组唯一解！",
                "ahaInsightZh": "待定系数法是函数解析式求法的核心，两点定一线，二元一次方程组唯一解！",
                "ahaInsightEn": "The method of undetermined coefficients uniquely fixes the line through two distinct points via a linear system!"
            }
        ], ensure_ascii=False)
    }

    # 2. SB-KP034: 一次函数图象性质
    patches['SB-KP034'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_triangle_area",
                "formula": "(intercept_b * intercept_b) / (2 * abs(slope_k) + 0.00001)",
                "deps": ["slope_k", "intercept_b"],
                "labelZh": "直线与坐标轴围成面积 S_{AOB} = b² / (2|k|)",
                "labelEn": "Triangle Area S_{AOB} = b² / (2|k|)",
                "isConstant": False
            },
            {
                "id": "inv_x_intercept",
                "formula": "-intercept_b / (slope_k + 0.00001)",
                "deps": ["slope_k", "intercept_b"],
                "labelZh": "x 轴截距点 x₀ = -b / k",
                "labelEn": "x-Intercept x₀ = -b / k",
                "isConstant": False
            },
            {
                "id": "inv_sample_y",
                "formula": "slope_k * x_sample + intercept_b",
                "deps": ["slope_k", "intercept_b", "x_sample"],
                "labelZh": "取样点纵坐标 y = kx + b",
                "labelEn": "Sample Point y = kx + b",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # 3. SB-KP035: 一次函数平移与二元一次方程组
    patches['SB-KP035'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_inter_x",
                "formula": "(intercept_b2 - b1) / (k1 - k2 + 0.00001)",
                "deps": ["k1", "b1", "k2", "intercept_b2"],
                "labelZh": "两直线交点横坐标 x",
                "labelEn": "Intersection x-coordinate",
                "isConstant": False
            },
            {
                "id": "inv_inter_y",
                "formula": "k1 * ((intercept_b2 - b1) / (k1 - k2 + 0.00001)) + b1",
                "deps": ["k1", "b1", "k2", "intercept_b2"],
                "labelZh": "两直线交点纵坐标 y",
                "labelEn": "Intersection y-coordinate",
                "isConstant": False
            },
            {
                "id": "inv_det_k",
                "formula": "k1 - k2",
                "deps": ["k1", "k2"],
                "labelZh": "斜率差 k₁ - k₂",
                "labelEn": "Slope Difference k₁ - k₂",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # 4. SB-KP039: 二次函数顶点式 y = a(x - h)² + k
    patches['SB-KP039'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_vertex_h",
                "formula": "param_h",
                "deps": ["param_h"],
                "labelZh": "顶点横坐标 / 对称轴 x = h",
                "labelEn": "Vertex x / Axis of Symmetry x = h",
                "isConstant": False
            },
            {
                "id": "inv_vertex_k",
                "formula": "param_k",
                "deps": ["param_k"],
                "labelZh": "顶点纵坐标 / 极值 y = k",
                "labelEn": "Vertex y / Extremum y = k",
                "isConstant": False
            },
            {
                "id": "inv_sample_val",
                "formula": "param_a + param_k",
                "deps": ["param_a", "param_k"],
                "labelZh": "偏离单位点函数值 y(h+1) = a + k",
                "labelEn": "Value at h+1: y(h+1) = a + k",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # 5. SB-KP040: 二次函数判别式与零点
    patches['SB-KP040'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_delta",
                "formula": "param_b^2 - 4 * param_a * param_c",
                "deps": ["param_a", "param_b", "param_c"],
                "labelZh": "根的判别式 Δ = b² - 4ac",
                "labelEn": "Discriminant Δ = b² - 4ac",
                "isConstant": False
            },
            {
                "id": "inv_root_dist",
                "formula": "sqrt(max(0, param_b^2 - 4 * param_a * param_c)) / abs(param_a + 0.00001)",
                "deps": ["param_a", "param_b", "param_c"],
                "labelZh": "两零点距离 |x₁ - x₂| = √Δ / |a|",
                "labelEn": "Root Distance |x₁ - x₂| = √Δ / |a|",
                "isConstant": False
            },
            {
                "id": "inv_sym_axis",
                "formula": "-param_b / (2 * param_a + 0.00001)",
                "deps": ["param_a", "param_b"],
                "labelZh": "对称轴 x = -b / (2a)",
                "labelEn": "Axis of Symmetry x = -b / (2a)",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # 6. SB-KP041: 二次函数动轴定区间最值
    patches['SB-KP041'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_sym_axis",
                "formula": "param_h",
                "deps": ["param_h"],
                "labelZh": "对称轴位置 x = h",
                "labelEn": "Axis Position x = h",
                "isConstant": False
            },
            {
                "id": "inv_interval_min",
                "formula": "param_h >= param_m && param_h <= param_n ? -3 : min((param_m - param_h)^2 - 3, (param_n - param_h)^2 - 3)",
                "deps": ["param_h", "param_m", "param_n"],
                "labelZh": "闭区间 [m, n] 内最小值 y_min",
                "labelEn": "Minimum on [m, n]",
                "isConstant": False
            },
            {
                "id": "inv_interval_len",
                "formula": "param_n - param_m",
                "deps": ["param_m", "param_n"],
                "labelZh": "区间跨度 n - m",
                "labelEn": "Interval Length n - m",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # 7. SB-KP042: 二次不等式与割线水位
    patches['SB-KP042'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_chord_len",
                "formula": "2 * sqrt(max(0, param_k_level - param_c))",
                "deps": ["param_k_level", "param_c"],
                "labelZh": "割线截得弦长 2√(k - c)",
                "labelEn": "Secant Chord Length 2√(k - c)",
                "isConstant": False
            },
            {
                "id": "inv_half_len",
                "formula": "sqrt(max(0, param_k_level - param_c))",
                "deps": ["param_k_level", "param_c"],
                "labelZh": "半弦长 √(k - c)",
                "labelEn": "Half Chord Length √(k - c)",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # 8. SB-KP043: 二次函数应用建模与铅垂高
    patches['SB-KP043'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_vertical_h",
                "formula": "abs(param_a * (param_t + 2) * (param_t - 4))",
                "deps": ["param_t", "param_a"],
                "labelZh": "割线动点铅垂高 h(t) = |y_P - y_AB|",
                "labelEn": "Vertical Height h(t)",
                "isConstant": False
            },
            {
                "id": "inv_base_w",
                "formula": "6.0",
                "deps": [],
                "labelZh": "底边固定跨度 w = 6",
                "labelEn": "Base Length w = 6",
                "isConstant": True
            },
            {
                "id": "inv_tri_area",
                "formula": "0.5 * 6.0 * abs(param_a * (param_t + 2) * (param_t - 4))",
                "deps": ["param_t", "param_a"],
                "labelZh": "动三角形面积 S = 1/2 · w · h",
                "labelEn": "Dynamic Triangle Area S = 1/2 · w · h",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # =========================================================================
    # Track B: 几何类
    # =========================================================================

    # 9. SB-KP045: 线段长短与中点
    patches['SB-KP045'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_ab_len",
                "formula": "param_len_ab",
                "deps": ["param_len_ab"],
                "labelZh": "线段全长 AB",
                "labelEn": "Segment Length AB",
                "isConstant": False
            },
            {
                "id": "inv_am_len",
                "formula": "0.5 * param_len_ab",
                "deps": ["param_len_ab"],
                "labelZh": "中点分段 AM = MB = 0.5 AB",
                "labelEn": "Midpoint Distance AM = MB = 0.5 AB",
                "isConstant": False
            },
            {
                "id": "inv_ac_len",
                "formula": "param_c_pos",
                "deps": ["param_c_pos"],
                "labelZh": "分点距离 AC",
                "labelEn": "Subsegment AC",
                "isConstant": False
            },
            {
                "id": "inv_cb_len",
                "formula": "param_len_ab - param_c_pos",
                "deps": ["param_len_ab", "param_c_pos"],
                "labelZh": "分点距离 CB",
                "labelEn": "Subsegment CB",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    # 10. SB-KP048: 平行同位角与同旁内角
    patches['SB-KP048'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_corr_angle_1",
                "formula": "param_trans_angle",
                "deps": ["param_trans_angle"],
                "labelZh": "同位角 ∠1 度数",
                "labelEn": "Corresponding Angle ∠1",
                "isConstant": False
            },
            {
                "id": "inv_corr_angle_2",
                "formula": "param_trans_angle",
                "deps": ["param_trans_angle"],
                "labelZh": "同位角 ∠2 度数",
                "labelEn": "Corresponding Angle ∠2",
                "isConstant": False
            },
            {
                "id": "inv_corr_identity",
                "formula": "abs(param_trans_angle - param_trans_angle) < 0.001 ? '同位角恒等成立 (∠1 ≡ ∠2)' : '平行验证中'",
                "deps": ["param_trans_angle"],
                "labelZh": "同位角平行判定恒等",
                "labelEn": "Corresponding Angles Equality",
                "isConstant": True
            },
            {
                "id": "inv_suppl_angle",
                "formula": "param_trans_angle + (180 - param_trans_angle)",
                "deps": ["param_trans_angle"],
                "labelZh": "同旁内角互补和",
                "labelEn": "Consecutive Interior Angles Sum",
                "isConstant": True
            }
        ], ensure_ascii=False)
    }

    # 11. SB-KP056: 直角三角形斜边中线 CM = 1/2 AB
    patches['SB-KP056'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_hypot_ab",
                "formula": "sqrt(leg_a^2 + leg_b^2)",
                "deps": ["leg_a", "leg_b"],
                "labelZh": "斜边长 AB",
                "labelEn": "Hypotenuse AB",
                "isConstant": False
            },
            {
                "id": "inv_median_cm",
                "formula": "0.5 * sqrt(leg_a^2 + leg_b^2)",
                "deps": ["leg_a", "leg_b"],
                "labelZh": "斜边中线长 CM (M为中点)",
                "labelEn": "Median to Hypotenuse CM",
                "isConstant": False
            },
            {
                "id": "inv_median_ratio",
                "formula": "0.5",
                "deps": [],
                "labelZh": "中线斜边比 CM / AB = 1/2",
                "labelEn": "Ratio CM / AB = 1/2",
                "isConstant": True
            }
        ], ensure_ascii=False)
    }

    # 12. SB-KP057: 勾股定理与赵爽弦图
    patches['SB-KP057'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_pythagorean_sum",
                "formula": "leg_a^2 + leg_b^2",
                "deps": ["leg_a", "leg_b"],
                "labelZh": "两直角边平方和 a² + b²",
                "labelEn": "Sum of Legs Squared a² + b²",
                "isConstant": False
            },
            {
                "id": "inv_hypot_c_sq",
                "formula": "leg_a^2 + leg_b^2",
                "deps": ["leg_a", "leg_b"],
                "labelZh": "斜边平方 c²",
                "labelEn": "Hypotenuse Squared c²",
                "isConstant": False
            },
            {
                "id": "inv_pythagoras_closure",
                "formula": "abs((leg_a^2 + leg_b^2) - (leg_a^2 + leg_b^2)) < 0.01 ? '勾股恒等守恒成立 (a²+b²≡c²)' : '计算中'",
                "deps": ["leg_a", "leg_b"],
                "labelZh": "勾股恒等关系 (a² + b² ≡ c²)",
                "labelEn": "Pythagorean Identity a² + b² ≡ c²",
                "isConstant": True
            }
        ], ensure_ascii=False)
    }

    # 13. SB-KP060: 位似变换
    patches['SB-KP060'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_ratio_k",
                "formula": "homo_k",
                "deps": ["homo_k"],
                "labelZh": "位似比 k = OA' / OA",
                "labelEn": "Homothety Ratio k = OA' / OA",
                "isConstant": False
            },
            {
                "id": "inv_seg_ratio",
                "formula": "abs(homo_k)",
                "deps": ["homo_k"],
                "labelZh": "对应线段比 A'B' / AB",
                "labelEn": "Segment Ratio A'B' / AB",
                "isConstant": False
            },
            {
                "id": "inv_parallel_check",
                "formula": "'对应边恒平行 (AB ∥ A\\'B\\')'",
                "deps": ["homo_k"],
                "labelZh": "对应边平行性质",
                "labelEn": "Parallel Sides AB ∥ A'B'",
                "isConstant": True
            }
        ], ensure_ascii=False)
    }

    # 14. SB-KP065: 菱形面积与四边闭合 (移除假滑块 morph_rhombus，纯化为对角线驱动)
    patches['SB-KP065'] = {
        'param_sliders_json': json.dumps([
            {
                "id": "diag_h",
                "param_key": "diag_h",
                "name": "水平对角线 d₁",
                "nameZh": "水平对角线 d₁",
                "nameEn": "Horizontal Diagonal d₁",
                "labelZh": "水平对角线 d₁",
                "labelEn": "Horizontal Diagonal d₁",
                "min": 2.0,
                "max": 10.0,
                "default": 6.0,
                "step": 0.5,
                "math_meaning": "菱形水平对角线 AC 长度"
            },
            {
                "id": "diag_v",
                "param_key": "diag_v",
                "name": "垂直对角线 d₂",
                "nameZh": "垂直对角线 d₂",
                "nameEn": "Vertical Diagonal d₂",
                "labelZh": "垂直对角线 d₂",
                "labelEn": "Vertical Diagonal d₂",
                "min": 2.0,
                "max": 10.0,
                "default": 4.0,
                "step": 0.5,
                "math_meaning": "菱形垂直对角线 BD 长度"
            }
        ], ensure_ascii=False),
        'invariants_display_json': json.dumps([
            {
                "id": "inv_side_len",
                "formula": "sqrt((diag_h / 2)^2 + (diag_v / 2)^2)",
                "deps": ["diag_h", "diag_v"],
                "labelZh": "菱形边长 a = √((d₁/2)² + (d₂/2)²)",
                "labelEn": "Rhombus Side a = √((d₁/2)² + (d₂/2)²)",
                "isConstant": False
            },
            {
                "id": "inv_diag_perp",
                "formula": "90.0",
                "deps": [],
                "labelZh": "对角线交角 ∠AOB = 90°",
                "labelEn": "Diagonal Angle ∠AOB = 90°",
                "isConstant": True
            },
            {
                "id": "inv_area",
                "formula": "0.5 * diag_h * diag_v",
                "deps": ["diag_h", "diag_v"],
                "labelZh": "菱形面积 S = 1/2 · d₁ · d₂",
                "labelEn": "Rhombus Area S = 1/2 · d₁ · d₂",
                "isConstant": False
            },
            {
                "id": "inv_four_sides_equal",
                "formula": "'AB ≡ BC ≡ CD ≡ DA (四边恒等长)'",
                "deps": ["diag_h", "diag_v"],
                "labelZh": "四边等长判定",
                "labelEn": "Four Sides Equilateral",
                "isConstant": True
            }
        ], ensure_ascii=False),
        'inquiry_steps_json': json.dumps([
            {
                "step": 1,
                "title": "观察四边等长与对角线垂直",
                "titleZh": "观察四边等长与对角线垂直",
                "titleEn": "Observe Equilateral Sides and Perpendicular Diagonals",
                "guide_text": "调整水平对角线 d₁ 与垂直对角线 d₂，观察四条边长度及交角 ∠AOB。",
                "guideTextZh": "调整水平对角线 d₁ 与垂直对角线 d₂，观察四条边长度及交角 ∠AOB。",
                "guideTextEn": "Adjust horizontal diagonal d₁ and vertical diagonal d₂ to observe all 4 sides and angle ∠AOB.",
                "target_condition": "diag_h !== 6.0 || diag_v !== 4.0",
                "aha_insight": "无论对角线长短如何改变，四条边始终保持等长，对角线交角始终恒定为 90°（AC ⊥ BD）！",
                "ahaInsightZh": "无论对角线长短如何改变，四条边始终保持等长，对角线交角始终恒定为 90°（AC ⊥ BD）！",
                "ahaInsightEn": "Regardless of diagonal lengths, all four sides remain strictly equal, and diagonals are perpendicular (AC ⊥ BD)!"
            },
            {
                "step": 2,
                "title": "探究面积公式与四分割全等",
                "titleZh": "探究面积公式与四分割全等",
                "titleEn": "Explore Area Formula and Fourfold Congruence",
                "guide_text": "观察菱形被两条对角线分割成的 4 个直角三角形，对比总面积与对角线乘积的关系。",
                "guideTextZh": "观察菱形被两条对角线分割成的 4 个直角三角形，对比总面积与对角线乘积的关系。",
                "guideTextEn": "Observe the 4 right triangles formed by the diagonals and examine the area relationship.",
                "target_condition": "diag_h * diag_v >= 30.0",
                "aha_insight": "4 个小直角三角形完全全等，菱形面积恰好等于两对角线乘积的一半：S = 1/2 · d₁ · d₂！",
                "ahaInsightZh": "4 个小直角三角形完全全等，菱形面积恰好等于两对角线乘积的一半：S = 1/2 · d₁ · d₂！",
                "ahaInsightEn": "The 4 small right triangles are mutually congruent, and rhombus area equals half diagonal product: S = 1/2 · d₁ · d₂!"
            },
            {
                "step": 3,
                "title": "探索对角线相等时跃迁为正方形",
                "titleZh": "探索对角线相等时跃迁为正方形",
                "titleEn": "Explore Phase Transition into Square when Diagonals Equal",
                "guide_text": "调节两对角线使其长度相等 (d₁ = d₂)，观察菱形特化为正方形的几何相变。",
                "guideTextZh": "调节两对角线使其长度相等 (d₁ = d₂)，观察菱形特化为正方形的几何相变。",
                "guideTextEn": "Adjust both diagonals to equal lengths (d₁ = d₂), and observe the geometric phase transition into a square.",
                "target_condition": "Math.abs(diag_h - diag_v) < 0.1",
                "aha_insight": "当对角线相等时，菱形四个角均为直角，跃迁为正方形！",
                "ahaInsightZh": "当对角线相等时，菱形四个角均为直角，跃迁为正方形！",
                "ahaInsightEn": "When the diagonals are equal, all four interior angles become right angles, transitioning the rhombus into a square!"
            }
        ], ensure_ascii=False)
    }

    # 15. SB-KP072: 圆切线长定理 PA = PB
    patches['SB-KP072'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_tangent_pa",
                "formula": "sqrt(max(0, dist_OP^2 - circle_r^2))",
                "deps": ["dist_OP", "circle_r"],
                "labelZh": "切线长 PA = √(OP² - r²)",
                "labelEn": "Tangent Length PA = √(OP² - r²)",
                "isConstant": False
            },
            {
                "id": "inv_tangent_pb",
                "formula": "sqrt(max(0, dist_OP^2 - circle_r^2))",
                "deps": ["dist_OP", "circle_r"],
                "labelZh": "切线长 PB = √(OP² - r²)",
                "labelEn": "Tangent Length PB = √(OP² - r²)",
                "isConstant": False
            },
            {
                "id": "inv_tangent_equality",
                "formula": "'PA ≡ PB (切线长恒等守恒)'",
                "deps": ["dist_OP", "circle_r"],
                "labelZh": "切线长定理守恒关系",
                "labelEn": "Tangent Segments Equality PA ≡ PB",
                "isConstant": True
            },
            {
                "id": "inv_tangent_angle",
                "formula": "90.0",
                "deps": [],
                "labelZh": "切线性质 ∠OAP = ∠OBP = 90°",
                "labelEn": "Tangent Right Angle ∠OAP = 90°",
                "isConstant": True
            }
        ], ensure_ascii=False)
    }

    # 16. SB-KP076: 三角形内切圆与内心 r = S / p (彻底移除假滑块 circle_r，内切圆半径严格推导自 S/p)
    patches['SB-KP076'] = {
        'param_sliders_json': json.dumps([
            {
                "id": "vertex_A_y",
                "param_key": "vertex_A_y",
                "name": "顶点 A 高度",
                "nameZh": "顶点 A 高度",
                "nameEn": "Vertex A Height",
                "labelZh": "顶点 A 高度",
                "labelEn": "Vertex A Height",
                "min": 2.0,
                "max": 8.0,
                "default": 5.0,
                "step": 0.5,
                "math_meaning": "顶点 A 的纵坐标高度"
            },
            {
                "id": "vertex_C_x",
                "param_key": "vertex_C_x",
                "name": "顶点 C 横坐标",
                "nameZh": "顶点 C 横坐标",
                "nameEn": "Vertex C x-coordinate",
                "labelZh": "顶点 C 横坐标",
                "labelEn": "Vertex C x-coordinate",
                "min": 1.0,
                "max": 8.0,
                "default": 4.0,
                "step": 0.5,
                "math_meaning": "顶点 C 的底边横坐标跨度"
            }
        ], ensure_ascii=False),
        'invariants_display_json': json.dumps([
            {
                "id": "inv_tri_area",
                "formula": "0.5 * (vertex_C_x + 4) * vertex_A_y",
                "deps": ["vertex_C_x", "vertex_A_y"],
                "labelZh": "三角形面积 S = 1/2 · BC · y_A",
                "labelEn": "Triangle Area S = 1/2 · BC · y_A",
                "isConstant": False
            },
            {
                "id": "inv_semi_p",
                "formula": "0.5 * ((vertex_C_x + 4) + sqrt(vertex_C_x^2 + vertex_A_y^2) + sqrt(16 + vertex_A_y^2))",
                "deps": ["vertex_C_x", "vertex_A_y"],
                "labelZh": "三角形半周长 p = (a + b + c) / 2",
                "labelEn": "Semiperimeter p = (a + b + c) / 2",
                "isConstant": False
            },
            {
                "id": "inv_inradius_r",
                "formula": "((vertex_C_x + 4) * vertex_A_y / 2) / (0.5 * ((vertex_C_x + 4) + sqrt(vertex_C_x^2 + vertex_A_y^2) + sqrt(16 + vertex_A_y^2)))",
                "deps": ["vertex_C_x", "vertex_A_y"],
                "labelZh": "内切圆半径 r = S / p",
                "labelEn": "Inradius r = S / p",
                "isConstant": False
            },
            {
                "id": "inv_incenter_equal_dist",
                "formula": "'d(I, BC) ≡ d(I, AB) ≡ d(I, AC) = r'",
                "deps": ["vertex_C_x", "vertex_A_y"],
                "labelZh": "内心到三边距离相等",
                "labelEn": "Equidistance from Incenter to Sides",
                "isConstant": True
            }
        ], ensure_ascii=False),
        'inquiry_steps_json': json.dumps([
            {
                "step": 1,
                "title": "移动顶点观察内心动态跟随",
                "titleZh": "移动顶点观察内心动态跟随",
                "titleEn": "Move Vertices to Observe Dynamic Incenter Tracking",
                "guide_text": "调节顶点 A 高度 vertex_A_y 或改变顶点 C 横坐标 vertex_C_x，观察内心 I 的自适应移动。",
                "guideTextZh": "调节顶点 A 高度 vertex_A_y 或改变顶点 C 横坐标 vertex_C_x，观察内心 I 的自适应移动。",
                "guideTextEn": "Adjust height of vertex A or x-coord of vertex C, and observe incenter I adaptively tracking.",
                "target_condition": "vertex_A_y !== 5.0 || vertex_C_x !== 4.0",
                "aha_insight": "内心是三角形三条角平分线的交点，内心到三角形三边的垂直距离处处相等，即内切圆半径 r。",
                "ahaInsightZh": "内心是三角形三条角平分线的交点，内心到三角形三边的垂直距离处处相等，即内切圆半径 r。",
                "ahaInsightEn": "The incenter is the intersection of all three angle bisectors; distances to all 3 sides are equal to inradius r."
            },
            {
                "step": 2,
                "title": "观察三边切点与垂足距离",
                "titleZh": "观察三边切点与垂足距离",
                "titleEn": "Observe Tangency Points and Perpendicular Distances",
                "guide_text": "拉高顶点 A 至 6.0 以上，观察内切圆随三角形拉伸膨胀，内心保持在三角形内部。",
                "guideTextZh": "拉高顶点 A 至 6.0 以上，观察内切圆随三角形拉伸膨胀，内心保持在三角形内部。",
                "guideTextEn": "Increase vertex A height above 6.0 to observe the incircle expanding while staying inside.",
                "target_condition": "vertex_A_y >= 6.0",
                "aha_insight": "无论三角形形状如何拉伸或倾斜，内心始终位于三角形内部，内切圆是多边形内部容纳的最大圆！",
                "ahaInsightZh": "无论三角形形状如何拉伸或倾斜，内心始终位于三角形内部，内切圆是多边形内部容纳的最大圆！",
                "ahaInsightEn": "Regardless of triangle shape, the incenter always resides inside, and the incircle is the largest inscribed circle!"
            },
            {
                "step": 3,
                "title": "领会面积与半周长的内切圆公式 S = pr",
                "titleZh": "领会面积与半周长的内切圆公式 S = pr",
                "titleEn": "Understand Incircle Area and Semiperimeter Formula S = pr",
                "guide_text": "将顶点 C 移动至 5.0 以上，体会 △ABC 分割为 △IAB、△IBC、△ICA 三个以 r 为高的小三角形，验证 r = S / p。",
                "guideTextZh": "将顶点 C 移动至 5.0 以上，体会 △ABC 分割为 △IAB、△IBC、△ICA 三个以 r 为高的小三角形，验证 r = S / p。",
                "guideTextEn": "Move vertex C beyond 5.0, visualizing △ABC partitioned into △IAB, △IBC, △ICA each with altitude r, verifying r = S / p.",
                "target_condition": "vertex_C_x >= 5.0",
                "aha_insight": "由 S = 1/2(a+b+c)r = pr 知，内切圆半径 r 严格等于三角形面积除以半周长！",
                "ahaInsightZh": "由 S = 1/2(a+b+c)r = pr 知，内切圆半径 r 严格等于三角形面积除以半周长！",
                "ahaInsightEn": "From S = 1/2(a+b+c)r = pr, inradius r strictly equals triangle area divided by semiperimeter!"
            }
        ], ensure_ascii=False)
    }

    # 17. SB-KP077: 扇形面积与弧长
    patches['SB-KP077'] = {
        'invariants_display_json': json.dumps([
            {
                "id": "inv_angle_n",
                "formula": "angle_n",
                "deps": ["angle_n"],
                "labelZh": "圆心角度数 n",
                "labelEn": "Central Angle Measure n",
                "isConstant": False
            },
            {
                "id": "inv_radius_r",
                "formula": "radius_r",
                "deps": ["radius_r"],
                "labelZh": "扇形半径 r",
                "labelEn": "Sector Radius r",
                "isConstant": False
            },
            {
                "id": "inv_arc_len",
                "formula": "(angle_n * 3.14159265 * radius_r) / 180",
                "deps": ["angle_n", "radius_r"],
                "labelZh": "弧长公式 l = nπr / 180",
                "labelEn": "Arc Length Formula l = nπr / 180",
                "isConstant": False
            },
            {
                "id": "inv_sector_area",
                "formula": "(angle_n * 3.14159265 * radius_r^2) / 360",
                "deps": ["angle_n", "radius_r"],
                "labelZh": "扇形面积公式 S = nπr² / 360",
                "labelEn": "Sector Area Formula S = nπr² / 360",
                "isConstant": False
            },
            {
                "id": "inv_bridge_area",
                "formula": "0.5 * ((angle_n * 3.14159265 * radius_r) / 180) * radius_r",
                "deps": ["angle_n", "radius_r"],
                "labelZh": "纽带公式 S = 1/2 · l · r",
                "labelEn": "Bridge Formula S = 1/2 · l · r",
                "isConstant": False
            }
        ], ensure_ascii=False)
    }

    return patches

def apply_patches():
    backup_databases()
    patches = get_patches()

    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            print(f"[Warning] Database {db_path} does not exist, skipping.")
            continue

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        updated_count = 0

        for sid, patch in patches.items():
            set_clauses = []
            params = []
            for col, val in patch.items():
                set_clauses.append(f"{col} = ?")
                params.append(val)
            params.append(sid)

            sql = f"UPDATE concept_sandboxes SET {', '.join(set_clauses)} WHERE sandbox_id = ?"
            cursor.execute(sql, params)
            if cursor.rowcount > 0:
                updated_count += cursor.rowcount

        conn.commit()
        conn.close()
        print(f"[Success] Applied patches to {db_path}: {updated_count} rows updated.")

if __name__ == '__main__':
    apply_patches()
