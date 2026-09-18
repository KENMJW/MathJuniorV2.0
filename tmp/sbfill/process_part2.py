import json
import os

input_file = '/Users/annette/aidev/全科核心素养提分系统V2.0/tmp/sbfill/part2_input.json'
output_file = '/Users/annette/aidev/全科核心素养提分系统V2.0/tmp/sbfill/part2.jsonl'

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

out_lines = []

def make_carrier(options_list, default_id):
    opts = []
    for opt in options_list:
        opts.append({
            "id": opt["id"],
            "nameZh": opt["nameZh"],
            "nameEn": opt["nameEn"],
            "points": opt["points"]
        })
    return json.dumps({"options": opts, "default": default_id})

def make_posture(modes_list, default_id="standard"):
    return json.dumps({"modes": modes_list, "default": default_id})

def make_camo(distractors, skeleton):
    return json.dumps({
        "distractorLayers": distractors,
        "coreSkeleton": skeleton
    })

leap_data = {
    "LM-8A-09": {
        "en": "Doubling the Median and Midpoint Construction Congruence Model",
        "brief_en": "Double the median to construct vertically opposite SAS congruence, enabling major transfer of edge and angle positions.",
        "carrier": make_carrier([
            {
                "id": "c1", "nameZh": "普通三角形", "nameEn": "Scalene Triangle",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 6, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": -4, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 6, "y": 0, "color": "blue", "size": 4, "isFixed": True}
                ]
            },
            {
                "id": "c2", "nameZh": "直角三角形", "nameEn": "Right Triangle",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 6, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": 0, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 6, "y": 0, "color": "blue", "size": 4, "isFixed": True}
                ]
            }
        ], "c1"),
        "posture": make_posture([
            {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
            {"id": "rotated", "nameZh": "旋转态", "nameEn": "Rotated", "rotationDeg": 45, "reflected": False},
            {"id": "inverted", "nameZh": "倒置态", "nameEn": "Inverted", "rotationDeg": 180, "reflected": True}
        ]),
        "camo": make_camo([
            {"id": "d1", "nameZh": "中线干扰", "items": [{"type": "line", "points": ["B", "D"]}]}
        ], {
            "nameZh": "倍长中线骨架", "nameEn": "Median Doubling Skeleton", "primaryElements": ["A", "B", "C"], "invariants": ["AD=DE", "BD=CD"]
        })
    },
    "LM-8A-10": {
        "en": "Cut-and-Fill Segment Sum and Difference Proof Model",
        "brief_en": "Cut a segment from a long line or extend a short line to construct congruent triangles to prove segment sum and difference.",
        "carrier": make_carrier([
            {
                "id": "c1", "nameZh": "等边三角形载体", "nameEn": "Equilateral Triangle Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 5.196, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": -3, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 3, "y": 0, "color": "blue", "size": 4, "isFixed": True}
                ]
            },
            {
                "id": "c2", "nameZh": "正方形载体", "nameEn": "Square Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": -3, "y": 6, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": -3, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 3, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "D", "name": "D", "x": 3, "y": 6, "color": "blue", "size": 4, "isFixed": True}
                ]
            }
        ], "c1"),
        "posture": make_posture([
            {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
            {"id": "rotated", "nameZh": "旋转态", "nameEn": "Rotated", "rotationDeg": 60, "reflected": False},
            {"id": "inverted", "nameZh": "倒置态", "nameEn": "Inverted", "rotationDeg": 180, "reflected": False}
        ]),
        "camo": make_camo([
            {"id": "d1", "nameZh": "圆干扰", "items": [{"type": "circle", "center": "A", "radius": 2}]}
        ], {
            "nameZh": "截长补短骨架", "nameEn": "Cut-and-Fill Skeleton", "primaryElements": ["A", "B", "C"], "invariants": ["AB+BC=AC"]
        })
    },
    "LM-8A-11": {
        "en": "Four Derivative Models of Angle Bisector",
        "brief_en": "Construct double perpendiculars, add a perpendicular to form an isosceles, or add parallel lines to form an isosceles triangle from an angle bisector.",
        "carrier": make_carrier([
            {
                "id": "c1", "nameZh": "角平分线基本载体", "nameEn": "Angle Bisector Basic Carrier",
                "points": [
                    {"id": "O", "name": "O", "x": 0, "y": 0, "color": "red", "size": 4, "isFixed": True},
                    {"id": "A", "name": "A", "x": 5, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": 5, "y": 5, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "P", "name": "P", "x": 4, "y": 2, "color": "green", "size": 4, "isFixed": False}
                ]
            },
            {
                "id": "c2", "nameZh": "三角形角平分线", "nameEn": "Triangle Angle Bisector",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 5, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": -4, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 6, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "D", "name": "D", "x": 1.2, "y": 0, "color": "green", "size": 4, "isFixed": False}
                ]
            }
        ], "c1"),
        "posture": make_posture([
            {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
            {"id": "rotated", "nameZh": "旋转态", "nameEn": "Rotated", "rotationDeg": 30, "reflected": False},
            {"id": "inverted", "nameZh": "倒置态", "nameEn": "Inverted", "rotationDeg": 90, "reflected": True}
        ]),
        "camo": make_camo([
            {"id": "d1", "nameZh": "干扰线", "items": [{"type": "line", "points": ["A", "B"]}]}
        ], {
            "nameZh": "角平分线骨架", "nameEn": "Angle Bisector Skeleton", "primaryElements": ["O", "A", "B"], "invariants": ["Angle1=Angle2"]
        })
    },
    "LM-8A-12": {
        "en": "General Drinking Horse Axisymmetry Shortest Path Model",
        "brief_en": "Reflect a fixed point across the moving point's line; the shortest path is the straight line between two points.",
        "carrier": make_carrier([
            {
                "id": "c1", "nameZh": "直线载体", "nameEn": "Line Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": 2, "y": 4, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": 6, "y": 2, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "P", "name": "P", "x": 0, "y": 0, "color": "red", "size": 4, "isFixed": False},
                    {"id": "L1", "name": "L1", "x": -5, "y": 0, "color": "gray", "size": 2, "isFixed": True},
                    {"id": "L2", "name": "L2", "x": 5, "y": 0, "color": "gray", "size": 2, "isFixed": True}
                ]
            },
            {
                "id": "c2", "nameZh": "坐标系载体", "nameEn": "Coordinate Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": 1, "y": 5, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": 7, "y": 3, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "P", "name": "P", "x": 0, "y": 0, "color": "red", "size": 4, "isFixed": False},
                    {"id": "Ox", "name": "Ox", "x": -10, "y": 0, "color": "gray", "size": 2, "isFixed": True},
                    {"id": "Oy", "name": "Oy", "x": 10, "y": 0, "color": "gray", "size": 2, "isFixed": True}
                ]
            }
        ], "c1"),
        "posture": make_posture([
            {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
            {"id": "rotated", "nameZh": "斜线态", "nameEn": "Diagonal", "rotationDeg": 45, "reflected": False},
            {"id": "inverted", "nameZh": "倒置态", "nameEn": "Inverted", "rotationDeg": 180, "reflected": True}
        ]),
        "camo": make_camo([
            {"id": "d1", "nameZh": "干扰线", "items": [{"type": "line", "points": ["A", "B"]}]}
        ], {
            "nameZh": "最短路径骨架", "nameEn": "Shortest Path Skeleton", "primaryElements": ["A", "B", "P"], "invariants": ["PA+PB min"]
        })
    },
    "LM-8B-13": {
        "en": "Pythagorean Theorem Folding and Moving Point Equation Model",
        "brief_en": "Geometric folding preserves distance; set variables to establish Pythagorean quadratic equations in right triangles for exact solving.",
        "carrier": make_carrier([
            {
                "id": "c1", "nameZh": "矩形载体", "nameEn": "Rectangle Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 4, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": 0, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 8, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "D", "name": "D", "x": 8, "y": 4, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "P", "name": "P", "x": 4, "y": 4, "color": "red", "size": 4, "isFixed": False}
                ]
            },
            {
                "id": "c2", "nameZh": "直角三角形载体", "nameEn": "Right Triangle Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 6, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": 0, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 8, "y": 0, "color": "blue", "size": 4, "isFixed": True}
                ]
            }
        ], "c1"),
        "posture": make_posture([
            {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
            {"id": "rotated", "nameZh": "倾斜态", "nameEn": "Tilted", "rotationDeg": 30, "reflected": False},
            {"id": "inverted", "nameZh": "倒置态", "nameEn": "Inverted", "rotationDeg": -90, "reflected": True}
        ]),
        "camo": make_camo([
            {"id": "d1", "nameZh": "干扰线", "items": [{"type": "line", "points": ["A", "C"]}]}
        ], {
            "nameZh": "勾股折叠骨架", "nameEn": "Pythagorean Folding Skeleton", "primaryElements": ["A", "B", "C", "D"], "invariants": ["a^2+b^2=c^2"]
        })
    },
    "LM-8B-14": {
        "en": "Cross Orthogonal Diagonals and Midpoint Quadrilateral Model",
        "brief_en": "The sum of squares of opposite sides in a quadrilateral with orthogonal diagonals is equal; connecting midpoints forms a rectangle.",
        "carrier": make_carrier([
            {
                "id": "c1", "nameZh": "一般垂直对角线四边形", "nameEn": "General Orthogonal Diagonal Quadrilateral",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 4, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": -3, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 0, "y": -2, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "D", "name": "D", "x": 5, "y": 0, "color": "blue", "size": 4, "isFixed": True}
                ]
            },
            {
                "id": "c2", "nameZh": "菱形载体", "nameEn": "Rhombus Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": 0, "y": 4, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": -3, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "C", "name": "C", "x": 0, "y": -4, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "D", "name": "D", "x": 3, "y": 0, "color": "blue", "size": 4, "isFixed": True}
                ]
            }
        ], "c1"),
        "posture": make_posture([
            {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
            {"id": "rotated", "nameZh": "旋转态", "nameEn": "Rotated", "rotationDeg": 45, "reflected": False},
            {"id": "inverted", "nameZh": "翻转态", "nameEn": "Flipped", "rotationDeg": 0, "reflected": True}
        ]),
        "camo": make_camo([
            {"id": "d1", "nameZh": "干扰圆", "items": [{"type": "circle", "center": "0,0", "radius": 4}]}
        ], {
            "nameZh": "十字架骨架", "nameEn": "Cross Skeleton", "primaryElements": ["A", "B", "C", "D"], "invariants": ["AC perp BD"]
        })
    },
    "LM-8B-15": {
        "en": "Comprehensive Model of Linear Function Graphs, Equations and Inequalities",
        "brief_en": "Determine the solution set of linear inequalities from the height of the linear function graph; intersections correspond to equation solutions.",
        "carrier": make_carrier([
            {
                "id": "c1", "nameZh": "坐标系载体", "nameEn": "Coordinate Carrier",
                "points": [
                    {"id": "O", "name": "O", "x": 0, "y": 0, "color": "black", "size": 4, "isFixed": True},
                    {"id": "A", "name": "A", "x": -2, "y": 0, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "B", "name": "B", "x": 0, "y": 4, "color": "blue", "size": 4, "isFixed": True}
                ]
            },
            {
                "id": "c2", "nameZh": "双直线载体", "nameEn": "Two Lines Carrier",
                "points": [
                    {"id": "P", "name": "P", "x": 2, "y": 3, "color": "red", "size": 5, "isFixed": True},
                    {"id": "L1a", "name": "L1a", "x": 0, "y": 1, "color": "blue", "size": 4, "isFixed": True},
                    {"id": "L2a", "name": "L2a", "x": 0, "y": 5, "color": "green", "size": 4, "isFixed": True}
                ]
            }
        ], "c1"),
        "posture": make_posture([
            {"id": "standard", "nameZh": "标准态", "nameEn": "Standard", "rotationDeg": 0, "reflected": False},
            {"id": "rotated", "nameZh": "平移态", "nameEn": "Translated", "rotationDeg": 0, "reflected": False},
            {"id": "inverted", "nameZh": "倒置态", "nameEn": "Inverted", "rotationDeg": 180, "reflected": True}
        ]),
        "camo": make_camo([
            {"id": "d1", "nameZh": "干扰线", "items": [{"type": "line", "points": ["A", "O"]}]}
        ], {
            "nameZh": "函数方程不等式骨架", "nameEn": "Function Equation Inequality Skeleton", "primaryElements": ["A", "B", "O"], "invariants": ["y=kx+b"]
        })
    }
}

concept_en = {
    "SB-KP037": "Drag the diagonal vertex of the rectangle to explore the invariance of the area of the rectangle formed by the inverse proportional function k.",
    "SB-KP038": "Switch between general form, vertex form, and intercept form to observe the shape of the parabola.",
    "SB-KP039": "Move the vertex (h, k) to observe the translational trajectory and axis of symmetry of the parabola.",
    "SB-KP040": "Adjust the height of the parabola to explore the critical state of the discriminant Δ regarding its intersections with the x-axis.",
    "SB-KP041": "Slide the independent variable within a given closed interval to explore the extreme values of a quadratic function with a moving axis in a fixed interval.",
    "SB-KP042": "Observe the interval where the parabola is above the x-axis to explore the solution set of quadratic inequalities.",
    "SB-KP043": "Drag the moving point representing vertical height to explore the dynamic extreme value of the secant polygon area.",
    "SB-KP044": "Drag the endpoints to observe the extensibility and intersection angles of line segments, rays, and lines.",
    "SB-KP045": "Move the endpoints of the line segment to explore bisection with two midpoints and the shortest path between two points."
}


for item in data.get("leap", []):
    item_id = item["model_id"]
    item["type"] = "leap"
    
    # english
    item["model_name_en"] = leap_data[item_id]["en"]
    item["model_brief_en"] = leap_data[item_id]["brief_en"]
    
    item["carrier_morphing_json"] = leap_data[item_id]["carrier"]
    item["posture_morphing_json"] = leap_data[item_id]["posture"]
    item["camouflage_xray_json"] = leap_data[item_id]["camo"]
    
    out_lines.append(item)

for item in data.get("concept", []):
    item_id = item["sandbox_id"]
    item["type"] = "concept"
    item["inquiry_guide_en"] = concept_en[item_id]
    
    out_lines.append(item)

os.makedirs(os.path.dirname(output_file), exist_ok=True)
with open(output_file, 'w', encoding='utf-8') as f:
    for line in out_lines:
        f.write(json.dumps(line, ensure_ascii=False) + '\n')
