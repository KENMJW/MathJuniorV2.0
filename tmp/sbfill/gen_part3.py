import json
import os

input_file = "tmp/sbfill/part3_input.json"
output_file = "tmp/sbfill/part3.jsonl"

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

with open(output_file, "w", encoding="utf-8") as out:
    for leap in data.get("leap", []):
        leap["type"] = "leap"
        m_id = leap["model_id"]
        
        # Default structures
        carrier = {"options": [], "default": "opt1"}
        posture = {"modes": [], "default": "standard"}
        camo = {"distractorLayers": [], "coreSkeleton": {"nameZh": "", "nameEn": "", "primaryElements": [], "invariants": []}}
        
        if m_id == "LM-8B-16":
            leap["model_name_en"] = "Linear Function Piecewise and Scheme Optimization Model"
            leap["model_brief_en"] = "Piecewise functions for tiered water rates and taxi fares, discussing endpoint extrema optimization by intervals."
            carrier["options"] = [
                {"id": "opt1", "nameZh": "水费阶梯", "nameEn": "Water Rates", "points": [
                    {"id": "p1", "name": "A", "x": 0, "y": 0, "color": "blue", "size": 3, "isFixed": True},
                    {"id": "p2", "name": "B", "x": 5, "y": 2, "color": "blue", "size": 3, "isFixed": False}
                ]},
                {"id": "opt2", "nameZh": "出租车费", "nameEn": "Taxi Fares", "points": [
                    {"id": "p1", "name": "C", "x": 0, "y": 3, "color": "red", "size": 3, "isFixed": True},
                    {"id": "p2", "name": "D", "x": 3, "y": 3, "color": "red", "size": 3, "isFixed": False}
                ]}
            ]
            posture["modes"] = [
                {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
                {"id": "steep", "nameZh": "陡峭态", "nameEn": "Steep", "rotationDeg": 15, "reflected": False},
                {"id": "flat", "nameZh": "平缓态", "nameEn": "Flat", "rotationDeg": -15, "reflected": False}
            ]
            camo["coreSkeleton"] = {"nameZh": "分段折线", "nameEn": "Piecewise Line", "primaryElements": ["Line1", "Line2"], "invariants": ["Break Point"]}

        elif m_id == "LM-8B-17":
            leap["model_name_en"] = "Statistical Weighted Average and Variance Risk Decision Model"
            leap["model_brief_en"] = "Mean measures overall level, variance measures stability and dispersion. Scientific dual-index risk decision making."
            carrier["options"] = [
                {"id": "opt1", "nameZh": "方案A", "nameEn": "Plan A", "points": [
                    {"id": "p1", "name": "A", "x": 1, "y": 5, "color": "green", "size": 3, "isFixed": False},
                    {"id": "p2", "name": "B", "x": 2, "y": 5, "color": "green", "size": 3, "isFixed": False}
                ]},
                {"id": "opt2", "nameZh": "方案B", "nameEn": "Plan B", "points": [
                    {"id": "p1", "name": "C", "x": 1, "y": 2, "color": "yellow", "size": 3, "isFixed": False},
                    {"id": "p2", "name": "D", "x": 2, "y": 8, "color": "yellow", "size": 3, "isFixed": False}
                ]}
            ]
            posture["modes"] = [
                {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
                {"id": "high_risk", "nameZh": "高风险", "nameEn": "High Risk", "rotationDeg": 0, "reflected": False},
                {"id": "low_risk", "nameZh": "低风险", "nameEn": "Low Risk", "rotationDeg": 0, "reflected": False}
            ]
            camo["coreSkeleton"] = {"nameZh": "均值方差线", "nameEn": "Mean Variance Line", "primaryElements": ["MeanLine", "VarianceBar"], "invariants": ["Mean"]}

        elif m_id == "LM-9A-18":
            leap["model_name_en"] = "Quadratic Equation Discriminant and Vieta Symmetric Algebra Model"
            leap["model_brief_en"] = "Discriminant determines root existence, Vieta's formulas substitute symmetric dual expressions to find algebraic extrema."
            carrier["options"] = [
                {"id": "opt1", "nameZh": "两交点", "nameEn": "Two Roots", "points": [
                    {"id": "p1", "name": "x1", "x": -2, "y": 0, "color": "red", "size": 4, "isFixed": False},
                    {"id": "p2", "name": "x2", "x": 3, "y": 0, "color": "red", "size": 4, "isFixed": False}
                ]},
                {"id": "opt2", "nameZh": "切点", "nameEn": "One Root", "points": [
                    {"id": "p1", "name": "x", "x": 1, "y": 0, "color": "blue", "size": 4, "isFixed": False},
                    {"id": "p2", "name": "v", "x": 1, "y": 0, "color": "blue", "size": 4, "isFixed": False}
                ]}
            ]
            posture["modes"] = [
                {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
                {"id": "upward", "nameZh": "开口向上", "nameEn": "Upward", "rotationDeg": 0, "reflected": False},
                {"id": "downward", "nameZh": "开口向下", "nameEn": "Downward", "rotationDeg": 180, "reflected": False}
            ]
            camo["coreSkeleton"] = {"nameZh": "抛物线及x轴交点", "nameEn": "Parabola and x-intercepts", "primaryElements": ["Parabola", "XAxis"], "invariants": ["Symmetric Axis"]}

        elif m_id == "LM-9A-19":
            leap["model_name_en"] = "Hand-in-Hand Rotation Congruence Model"
            leap["model_brief_en"] = "Equal segments sharing a vertex form rotation, two isosceles/equilateral triangles sharing a vertex induce rotational congruence chains."
            carrier["options"] = [
                {"id": "opt1", "nameZh": "等边三角形", "nameEn": "Equilateral Triangles", "points": [
                    {"id": "O", "name": "O", "x": 0, "y": 0, "color": "black", "size": 4, "isFixed": True},
                    {"id": "A", "name": "A", "x": 3, "y": 0, "color": "red", "size": 3, "isFixed": False}
                ]},
                {"id": "opt2", "nameZh": "等腰直角三角形", "nameEn": "Isosceles Right Triangles", "points": [
                    {"id": "O", "name": "O", "x": 0, "y": 0, "color": "black", "size": 4, "isFixed": True},
                    {"id": "A", "name": "A", "x": 4, "y": 0, "color": "blue", "size": 3, "isFixed": False}
                ]}
            ]
            posture["modes"] = [
                {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
                {"id": "rot30", "nameZh": "旋转30度", "nameEn": "Rotate 30", "rotationDeg": 30, "reflected": False},
                {"id": "rot60", "nameZh": "旋转60度", "nameEn": "Rotate 60", "rotationDeg": 60, "reflected": False}
            ]
            camo["coreSkeleton"] = {"nameZh": "旋转中心与关联边", "nameEn": "Rotation Center and Edges", "primaryElements": ["Triangle1", "Triangle2"], "invariants": ["Angle", "Segment Length"]}

        elif m_id == "LM-9A-20":
            leap["model_name_en"] = "Half-Angle Rotation Folding and Patching Model"
            leap["model_brief_en"] = "A square with a 45° angle rotated 90° patches congruently, making the long segment equal to the sum of two short segments."
            carrier["options"] = [
                {"id": "opt1", "nameZh": "正方形45度", "nameEn": "Square 45", "points": [
                    {"id": "A", "name": "A", "x": -2, "y": 2, "color": "black", "size": 3, "isFixed": True},
                    {"id": "B", "name": "B", "x": -2, "y": -2, "color": "black", "size": 3, "isFixed": True}
                ]},
                {"id": "opt2", "nameZh": "矩形半角", "nameEn": "Rectangle Half Angle", "points": [
                    {"id": "A", "name": "A", "x": -3, "y": 2, "color": "black", "size": 3, "isFixed": True},
                    {"id": "B", "name": "B", "x": -3, "y": -2, "color": "black", "size": 3, "isFixed": True}
                ]}
            ]
            posture["modes"] = [
                {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
                {"id": "folded", "nameZh": "翻折态", "nameEn": "Folded", "rotationDeg": 0, "reflected": True},
                {"id": "rotated90", "nameZh": "旋转90度", "nameEn": "Rotated 90", "rotationDeg": 90, "reflected": False}
            ]
            camo["coreSkeleton"] = {"nameZh": "正方形与45度角", "nameEn": "Square and 45 Angle", "primaryElements": ["Square", "Rays"], "invariants": ["45 Degrees"]}

        elif m_id == "LM-9A-21":
            leap["model_name_en"] = "Fermat Point 120° Rotation Distance Sum Extrema Model"
            leap["model_brief_en"] = "Rotate 60° around a vertex to construct an equilateral triangle, transforming three broken segments into a line to find the minimum distance sum."
            carrier["options"] = [
                {"id": "opt1", "nameZh": "锐角三角形", "nameEn": "Acute Triangle", "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 4, "color": "black", "size": 3, "isFixed": True},
                    {"id": "B", "name": "B", "x": -2, "y": 0, "color": "black", "size": 3, "isFixed": True}
                ]},
                {"id": "opt2", "nameZh": "钝角三角形", "nameEn": "Obtuse Triangle", "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 2, "color": "black", "size": 3, "isFixed": True},
                    {"id": "B", "name": "B", "x": -4, "y": 0, "color": "black", "size": 3, "isFixed": True}
                ]}
            ]
            posture["modes"] = [
                {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
                {"id": "rot60L", "nameZh": "左旋60度", "nameEn": "Rotate 60 Left", "rotationDeg": -60, "reflected": False},
                {"id": "rot60R", "nameZh": "右旋60度", "nameEn": "Rotate 60 Right", "rotationDeg": 60, "reflected": False}
            ]
            camo["coreSkeleton"] = {"nameZh": "三点直线", "nameEn": "Collinear Three Points", "primaryElements": ["Segment Line"], "invariants": ["Minimum Distance"]}

        elif m_id == "LM-9A-22":
            leap["model_name_en"] = "Fixed Chord Fixed Angle Hidden Circle Model"
            leap["model_brief_en"] = "A fixed length chord subtending a fixed angle places the moving point's locus on a circumscribed hidden circle. Maximum length occurs when three points are collinear."
            carrier["options"] = [
                {"id": "opt1", "nameZh": "锐角定角", "nameEn": "Acute Fixed Angle", "points": [
                    {"id": "A", "name": "A", "x": -2, "y": 0, "color": "black", "size": 3, "isFixed": True},
                    {"id": "B", "name": "B", "x": 2, "y": 0, "color": "black", "size": 3, "isFixed": True}
                ]},
                {"id": "opt2", "nameZh": "钝角定角", "nameEn": "Obtuse Fixed Angle", "points": [
                    {"id": "A", "name": "A", "x": -3, "y": 0, "color": "black", "size": 3, "isFixed": True},
                    {"id": "B", "name": "B", "x": 3, "y": 0, "color": "black", "size": 3, "isFixed": True}
                ]}
            ]
            posture["modes"] = [
                {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
                {"id": "extreme", "nameZh": "极值共线态", "nameEn": "Extreme Collinear", "rotationDeg": 45, "reflected": False},
                {"id": "arbitrary", "nameZh": "任意位置", "nameEn": "Arbitrary", "rotationDeg": -30, "reflected": False}
            ]
            camo["coreSkeleton"] = {"nameZh": "隐形圆与定弦", "nameEn": "Hidden Circle and Fixed Chord", "primaryElements": ["Hidden Circle", "Fixed Chord"], "invariants": ["Inscribed Angle"]}
            
        leap["carrier_morphing_json"] = json.dumps(carrier, ensure_ascii=False)
        leap["posture_morphing_json"] = json.dumps(posture, ensure_ascii=False)
        leap["camouflage_xray_json"] = json.dumps(camo, ensure_ascii=False)
        
        out.write(json.dumps(leap, ensure_ascii=False) + "\n")

    inquiry_map = {
        "SB-KP046": "Drag the ray to change the angle, and observe that complementary, supplementary, and vertical angles are equal.",
        "SB-KP047": "Drag the foot of the perpendicular and the point to verify that the perpendicular segment is the shortest among all segments from a point to a line.",
        "SB-KP048": "Rotate the transversal line to dynamically observe that corresponding, alternate interior, and consecutive interior angles are supplementary.",
        "SB-KP049": "Drag the triangle's vertices to visually verify that the sum of interior angles is always 180°.",
        "SB-KP051": "Drag the SAS/ASA/SSS condition bars to verify that congruent triangles coincide uniquely.",
        "SB-KP053": "Adjust the apex angle of the isosceles triangle to observe the collinearity of the altitude, median, and angle bisector (three lines in one).",
        "SB-KP055": "Drag the equilateral triangle to observe its 60° rotational self-symmetry and the coincidence of its four centers.",
        "SB-KP056": "Drag the moving point on the hypotenuse to verify that the median to the hypotenuse of a right triangle is half the hypotenuse.",
        "SB-KP057": "Drag the right-angle vertex to observe the area conservation by cutting and patching in Zhao Shuang's String Figure formed by the squares on the three sides."
    }

    for concept in data.get("concept", []):
        concept["type"] = "concept"
        concept["inquiry_guide_en"] = inquiry_map.get(concept["sandbox_id"], "Explore the mathematical concept visually.")
        out.write(json.dumps(concept, ensure_ascii=False) + "\n")

print("Done")
