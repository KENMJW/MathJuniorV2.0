import json

with open('tmp/sbfill/part1_input.json', 'r') as f:
    data = json.load(f)

leaps = data['leap']
concepts = data['concept']

concept_translations = {
    "SB-KP001": "Drag the dynamic point on the number line to observe the classification of rational numbers and the directionality of positive and negative numbers.",
    "SB-KP002": "Move point P to intuitively explore the three elements of the number line and its continuous density.",
    "SB-KP003": "Drag dynamic points on both sides of the origin to explore the symmetry of opposite numbers and the essence of absolute value distance.",
    "SB-KP008": "Drag the irrational number point to observe its infinite approximation and squeezing within adjacent rational number intervals.",
    "SB-KP032": "Adjust the slope k to observe the rotation and quadrant crossing of the direct proportion function line.",
    "SB-KP033": "Drag two fixed points on the line to observe the dynamic recalculation of the analytic expression using the method of undetermined coefficients.",
    "SB-KP034": "Adjust the intercept b and slope k to explore the monotonicity of the linear function.",
    "SB-KP035": "Move the intersection point of the lines to explore the geometrization of common solutions between linear functions and systems of two-variable equations.",
    "SB-KP036": "Drag the dynamic point on the hyperbola to observe its symmetry in the first and third quadrants and its infinite asymptotes."
}

leap_configs = {
    "LM-7A-01": {
        "model_name_en": "Number Line Dynamic Point and Absolute Value Geometric Distance Model",
        "model_brief_en": "Reduction of distance sum on number line; median point gives minimum for odd points, constant interval for even.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "number_line",
                    "nameZh": "数轴载体",
                    "nameEn": "Number Line Carrier",
                    "isAxis": True,
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A(-3,0)", "x": -3, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B(3,0)", "x": 3, "y": 0, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "P(动点)", "x": 1, "y": 0, "color": "var(--ios-orange)", "size": 5, "isFixed": False}
                    ]
                },
                {
                    "id": "coordinate_manhattan",
                    "nameZh": "平面直角坐标系曼哈顿距离载体",
                    "nameEn": "Coordinate Manhattan Distance Carrier",
                    "isAxis": True,
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A(-3,-2)", "x": -3, "y": -2, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B(3,4)", "x": 3, "y": 4, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "P(动点)", "x": 1, "y": 1, "color": "var(--ios-orange)", "size": 5, "isFixed": False}
                    ]
                }
            ],
            "default": "number_line"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "标准水平", "nameEn": "Standard Horizontal", "rotationDeg": 0, "reflected": False},
                {"id": "rotated_90", "nameZh": "垂直旋转 90°", "nameEn": "Vertical Rotated 90°", "rotationDeg": 90, "reflected": False},
                {"id": "reflected", "nameZh": "轴对称翻折", "nameEn": "Reflection", "rotationDeg": 0, "reflected": True}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "logistics_distractor",
                    "nameZh": "物流选址/加油站应用题干扰",
                    "nameEn": "Logistics/Gas Station Distractor",
                    "type": "lines",
                    "items": [{"from": [-3, 2], "to": [3, 2], "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "绝对值几何距离骨架",
                "nameEn": "Absolute Value Distance Skeleton",
                "primaryElements": ["A", "B", "P"],
                "invariants": [{"id": "inv_dist_sum", "type": "distance_sum", "deps": ["P", "A", "P", "B"], "formula": "PA+PB={val}", "labelZh": "距离和"}]
            }
        }
    },
    "LM-7A-02": {
        "model_name_en": "Segment Double Midpoint and Angle Bisector Sum-Difference Model",
        "model_brief_en": "Double midpoints halve segments; adjacent supplementary interior and exterior angle bisectors are perpendicular. Half-angle formula hits invariants directly.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "single_segment",
                    "nameZh": "单线段载体",
                    "nameEn": "Single Segment Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A", "x": -4, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B", "x": 4, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "M1", "name": "M1", "x": -2, "y": 0, "color": "var(--ios-green)", "size": 4, "isFixed": False},
                        {"id": "M2", "name": "M2", "x": 2, "y": 0, "color": "var(--ios-orange)", "size": 4, "isFixed": False}
                    ]
                },
                {
                    "id": "angle_carrier",
                    "nameZh": "共顶点多重交错角载体",
                    "nameEn": "Common Vertex Interlaced Angle Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "O", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 5, "isFixed": True},
                        {"id": "A", "name": "A", "x": 4, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B", "x": -4, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "P", "x": 0, "y": 4, "color": "var(--ios-orange)", "size": 4, "isFixed": False}
                    ]
                }
            ],
            "default": "single_segment"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "水平方向 (0°)", "nameEn": "Horizontal (0°)", "rotationDeg": 0, "reflected": False},
                {"id": "tilted_30", "nameZh": "倾斜 30°", "nameEn": "Tilted 30°", "rotationDeg": 30, "reflected": False},
                {"id": "reflected", "nameZh": "镜像翻折", "nameEn": "Reflection", "rotationDeg": 0, "reflected": True}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "clock_distractor",
                    "nameZh": "钟表时针分针夹角干扰",
                    "nameEn": "Clock Hands Angle Distractor",
                    "type": "circles",
                    "items": [{"center": [0, 0], "radius": 4, "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "角平分线垂直骨架",
                "nameEn": "Angle Bisector Perpendicular Skeleton",
                "primaryElements": ["O", "A", "B", "P"],
                "invariants": [{"id": "inv_angle", "type": "angle", "deps": ["M1", "O", "M2"], "formula": "∠M1OM2=90°", "labelZh": "恒定直角"}]
            }
        }
    },
    "LM-7B-03": {
        "model_name_en": "Sum of Non-negative Numbers Equals Zero Model",
        "model_brief_en": "The sum of absolute values, even powers, and arithmetic square roots is zero; each term must be zero to form a system of equations.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "algebraic",
                    "nameZh": "纯代数式载体",
                    "nameEn": "Pure Algebraic Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A", "x": -2, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B", "x": 2, "y": 0, "color": "var(--ios-green)", "size": 4, "isFixed": True}
                    ]
                },
                {
                    "id": "geometric",
                    "nameZh": "几何边长平方载体",
                    "nameEn": "Geometric Side Length Square Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A", "x": 0, "y": 3, "color": "var(--ios-blue)", "size": 4, "isFixed": False},
                        {"id": "B", "name": "B", "x": -4, "y": 0, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "C", "name": "C", "x": 4, "y": 0, "color": "var(--ios-orange)", "size": 4, "isFixed": True}
                    ]
                }
            ],
            "default": "algebraic"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "显式加和", "nameEn": "Explicit Sum", "rotationDeg": 0, "reflected": False},
                {"id": "opposite", "nameZh": "互为相反数 A=-B", "nameEn": "Opposites A=-B", "rotationDeg": 180, "reflected": False},
                {"id": "reflected", "nameZh": "翻折", "nameEn": "Reflected", "rotationDeg": 0, "reflected": True}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "perimeter",
                    "nameZh": "三角形三边代数式求周长干扰",
                    "nameEn": "Triangle Perimeter Distractor",
                    "type": "lines",
                    "items": [{"from": [-4, 0], "to": [4, 0], "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "零值恒等骨架",
                "nameEn": "Zero Identity Skeleton",
                "primaryElements": ["A", "B"],
                "invariants": [{"id": "inv_zero", "type": "value", "deps": [], "formula": "A=0, B=0", "labelZh": "各项为零"}]
            }
        }
    },
    "LM-7B-04": {
        "model_name_en": "Bridge Construction Translation Shortest Path Model",
        "model_brief_en": "Use vector translation to subtract constant river width, converting to the shortest straight-line distance between two points.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "single_river",
                    "nameZh": "单河岸载体",
                    "nameEn": "Single River Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A(起点)", "x": -4, "y": 4, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B(终点)", "x": 4, "y": -4, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "P1", "name": "P1(桥头)", "x": -1, "y": 1, "color": "var(--ios-orange)", "size": 5, "isFixed": False},
                        {"id": "P2", "name": "P2(桥尾)", "x": -1, "y": -1, "color": "var(--ios-orange)", "size": 5, "isFixed": False}
                    ]
                },
                {
                    "id": "double_river",
                    "nameZh": "两平行河道载体",
                    "nameEn": "Double Parallel River Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A", "x": -5, "y": 5, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B", "x": 5, "y": -5, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "P1", "name": "P1", "x": -2, "y": 3, "color": "var(--ios-orange)", "size": 5, "isFixed": False},
                        {"id": "P2", "name": "P2", "x": -2, "y": 1, "color": "var(--ios-orange)", "size": 5, "isFixed": False}
                    ]
                }
            ],
            "default": "single_river"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "垂直造桥", "nameEn": "Perpendicular Bridge", "rotationDeg": 0, "reflected": False},
                {"id": "rotated_30", "nameZh": "旋转 30° 河道", "nameEn": "River Rotated 30°", "rotationDeg": 30, "reflected": False},
                {"id": "reflected", "nameZh": "翻折镜像", "nameEn": "Reflection", "rotationDeg": 0, "reflected": True}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "pipeline",
                    "nameZh": "城市管道铺设干扰",
                    "nameEn": "Urban Pipeline Distractor",
                    "type": "lines",
                    "items": [{"from": [-6, 1], "to": [6, 1], "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "平移拉直骨架",
                "nameEn": "Translation Straightening Skeleton",
                "primaryElements": ["A", "B", "P1", "P2"],
                "invariants": [{"id": "inv_dist", "type": "distance", "deps": ["A", "B"], "formula": "Min Distance", "labelZh": "最短折线"}]
            }
        }
    },
    "LM-7B-05": {
        "model_name_en": "System of Linear Equations and Coordinate Intersection Model",
        "model_brief_en": "A two-variable linear equation corresponds to a line; the system's solution corresponds to the intersection of two lines in the coordinate system.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "intersecting_lines",
                    "nameZh": "动直线相交轨迹载体",
                    "nameEn": "Dynamic Intersecting Lines Carrier",
                    "isAxis": True,
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "P(交点)", "x": 2, "y": 3, "color": "var(--ios-orange)", "size": 5, "isFixed": False},
                        {"id": "A1", "name": "L1点", "x": -2, "y": -1, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "A2", "name": "L2点", "x": 4, "y": -1, "color": "var(--ios-green)", "size": 4, "isFixed": True}
                    ]
                },
                {
                    "id": "pure_algebra",
                    "nameZh": "纯代数消元载体",
                    "nameEn": "Pure Algebraic Elimination Carrier",
                    "isAxis": False,
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "Sol(x,y)", "x": 0, "y": 0, "color": "var(--ios-orange)", "size": 5, "isFixed": False}
                    ]
                }
            ],
            "default": "intersecting_lines"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "斜交 (唯一解)", "nameEn": "Intersecting (Unique)", "rotationDeg": 0, "reflected": False},
                {"id": "parallel", "nameZh": "平行 (无解)", "nameEn": "Parallel (No Solution)", "rotationDeg": 0, "reflected": True},
                {"id": "rotated", "nameZh": "整体旋转", "nameEn": "Overall Rotation", "rotationDeg": 45, "reflected": False}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "feasible_region",
                    "nameZh": "线性规划可行域面积干扰",
                    "nameEn": "Linear Programming Region Distractor",
                    "type": "lines",
                    "items": [{"from": [-5, -5], "to": [5, 5], "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "交点唯一性骨架",
                "nameEn": "Intersection Uniqueness Skeleton",
                "primaryElements": ["P"],
                "invariants": [{"id": "inv_sol", "type": "point", "deps": ["P"], "formula": "Solution (x,y)", "labelZh": "方程组解"}]
            }
        }
    },
    "LM-8A-06": {
        "model_name_en": "Multiplication Formula Area Dissection and Perfect Square Identity Model",
        "model_brief_en": "Proving perfect square and difference of squares formulas via area dissection of squares and rectangles; geometrization of completing the square.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "square_dissection",
                    "nameZh": "正方形割补载体",
                    "nameEn": "Square Dissection Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "O", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A", "x": 5, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B", "x": 0, "y": 5, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "P(分割点)", "x": 3, "y": 3, "color": "var(--ios-orange)", "size": 5, "isFixed": False}
                    ]
                },
                {
                    "id": "rectangle_dissection",
                    "nameZh": "矩形割补载体",
                    "nameEn": "Rectangle Dissection Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "O", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A", "name": "A", "x": 6, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "B", "name": "B", "x": 0, "y": 4, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "P", "x": 4, "y": 2, "color": "var(--ios-orange)", "size": 5, "isFixed": False}
                    ]
                }
            ],
            "default": "square_dissection"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "标准放置", "nameEn": "Standard Placement", "rotationDeg": 0, "reflected": False},
                {"id": "rotated_90", "nameZh": "旋转 90°", "nameEn": "Rotated 90°", "rotationDeg": 90, "reflected": False},
                {"id": "reflected", "nameZh": "对称翻折", "nameEn": "Reflected", "rotationDeg": 0, "reflected": True}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "grid",
                    "nameZh": "网格线干扰",
                    "nameEn": "Grid Lines Distractor",
                    "type": "lines",
                    "items": [{"from": [0, 1], "to": [5, 1], "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "面积恒等骨架",
                "nameEn": "Area Identity Skeleton",
                "primaryElements": ["P"],
                "invariants": [{"id": "inv_area", "type": "area", "deps": [], "formula": "Sum of Parts = Total", "labelZh": "面积守恒"}]
            }
        }
    },
    "LM-8A-07": {
        "model_name_en": "Factorization Cross Multiplication and Grouping Decomposition Model",
        "model_brief_en": "Double cross multiplication, term addition and splitting in grouping; reverse engineering of high-order algebraic expressions into products.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "cross_diagram",
                    "nameZh": "十字相乘图解载体",
                    "nameEn": "Cross Diagram Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A1", "name": "a1", "x": -2, "y": 2, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "A2", "name": "a2", "x": -2, "y": -2, "color": "var(--ios-blue)", "size": 4, "isFixed": True},
                        {"id": "C1", "name": "c1", "x": 2, "y": 2, "color": "var(--ios-green)", "size": 4, "isFixed": True},
                        {"id": "C2", "name": "c2", "x": 2, "y": -2, "color": "var(--ios-green)", "size": 4, "isFixed": True}
                    ]
                },
                {
                    "id": "area_model",
                    "nameZh": "代数瓦片面积载体",
                    "nameEn": "Algebra Tiles Area Carrier",
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "O", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "P1", "name": "x", "x": 3, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": False},
                        {"id": "P2", "name": "y", "x": 0, "y": 2, "color": "var(--ios-green)", "size": 4, "isFixed": False}
                    ]
                }
            ],
            "default": "cross_diagram"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "标准图解", "nameEn": "Standard Diagram", "rotationDeg": 0, "reflected": False},
                {"id": "rotated_90", "nameZh": "横向图解", "nameEn": "Horizontal Diagram", "rotationDeg": 90, "reflected": False},
                {"id": "reflected", "nameZh": "翻转对应", "nameEn": "Flipped Correspondence", "rotationDeg": 0, "reflected": True}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "diagonal",
                    "nameZh": "对角线连接干扰",
                    "nameEn": "Diagonal Connection Distractor",
                    "type": "lines",
                    "items": [{"from": [-3, -3], "to": [3, 3], "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "十字系数匹配骨架",
                "nameEn": "Cross Coefficient Matching Skeleton",
                "primaryElements": ["A1", "A2", "C1", "C2"],
                "invariants": [{"id": "inv_coeff", "type": "value", "deps": [], "formula": "a1c2 + a2c1 = b", "labelZh": "交叉乘积和"}]
            }
        }
    },
    "LM-8A-08": {
        "model_name_en": "Fractional Equation Extraneous Root and Telescoping Sum Model",
        "model_brief_en": "Extraneous roots judged by zero common denominator in fractional equations; telescoping series for sum limits.",
        "carrier_morphing_json": {
            "options": [
                {
                    "id": "fraction_graph",
                    "nameZh": "分式双曲线图解载体",
                    "nameEn": "Fractional Hyperbola Graph Carrier",
                    "isAxis": True,
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "P", "name": "动点", "x": 2, "y": 2, "color": "var(--ios-blue)", "size": 4, "isFixed": False},
                        {"id": "R", "name": "增根(除以0)", "x": 0, "y": 0, "color": "var(--ios-orange)", "size": 5, "isFixed": True}
                    ]
                },
                {
                    "id": "number_line",
                    "nameZh": "数轴裂项载体",
                    "nameEn": "Number Line Telescoping Carrier",
                    "isAxis": True,
                    "points": [ {"id": "Origin", "name": "O", "x": 0, "y": 0, "color": "var(--text-primary)", "size": 4, "isFixed": True},
                        {"id": "A1", "name": "1/n", "x": 2, "y": 0, "color": "var(--ios-blue)", "size": 4, "isFixed": False},
                        {"id": "A2", "name": "1/(n+1)", "x": 3, "y": 0, "color": "var(--ios-green)", "size": 4, "isFixed": False}
                    ]
                }
            ],
            "default": "fraction_graph"
        },
        "posture_morphing_json": {
            "modes": [
                {"id": "standard", "nameZh": "第一象限标准态", "nameEn": "First Quadrant Standard", "rotationDeg": 0, "reflected": False},
                {"id": "rotated_180", "nameZh": "第三象限旋转", "nameEn": "Third Quadrant Rotated", "rotationDeg": 180, "reflected": False},
                {"id": "reflected", "nameZh": "翻折变换", "nameEn": "Reflection Transform", "rotationDeg": 0, "reflected": True}
            ],
            "default": "standard"
        },
        "camouflage_xray_json": {
            "distractorLayers": [
                {
                    "id": "asymptote",
                    "nameZh": "渐近线干扰",
                    "nameEn": "Asymptote Distractor",
                    "type": "lines",
                    "items": [{"from": [-5, 0], "to": [5, 0], "color": "var(--border-subtle)"}]
                }
            ],
            "coreSkeleton": {
                "nameZh": "分母非零及裂项骨架",
                "nameEn": "Non-zero Denominator and Telescoping Skeleton",
                "primaryElements": ["R"],
                "invariants": [{"id": "inv_root", "type": "value", "deps": [], "formula": "Denominator ≠ 0", "labelZh": "存在条件"}]
            }
        }
    }
}

output = []

for leap in leaps:
    model_id = leap["model_id"]
    cfg = leap_configs[model_id]
    
    leap["type"] = "leap"
    leap["model_name_en"] = cfg["model_name_en"]
    leap["model_brief_en"] = cfg["model_brief_en"]
    leap["carrier_morphing_json"] = json.dumps(cfg["carrier_morphing_json"], ensure_ascii=False)
    leap["posture_morphing_json"] = json.dumps(cfg["posture_morphing_json"], ensure_ascii=False)
    leap["camouflage_xray_json"] = json.dumps(cfg["camouflage_xray_json"], ensure_ascii=False)
    
    # ensure default parameters exists
    if "parameter_morphing_json" not in leap or not leap["parameter_morphing_json"]:
        leap["parameter_morphing_json"] = json.dumps({"description": "参数变异滑块", "sliders": [{"id": "param_t", "min": 0, "max": 10, "default": 5, "step": 1}]})
    elif "default" not in leap["parameter_morphing_json"]:
        param = json.loads(leap["parameter_morphing_json"])
        for s in param["sliders"]:
            s["default"] = 5
            s["step"] = 1
            s["nameZh"] = "滑块"
            s["nameEn"] = "Slider"
        leap["parameter_morphing_json"] = json.dumps(param, ensure_ascii=False)

    output.append(leap)

for concept in concepts:
    concept["type"] = "concept"
    sandbox_id = concept["sandbox_id"]
    if sandbox_id in concept_translations:
        concept["inquiry_guide_en"] = concept_translations[sandbox_id]
    else:
        concept["inquiry_guide_en"] = "Translated guide."
    
    output.append(concept)

with open('tmp/sbfill/part1.jsonl', 'w') as f:
    for item in output:
        f.write(json.dumps(item, ensure_ascii=False) + '\n')

print("Generated tmp/sbfill/part1.jsonl successfully.")
