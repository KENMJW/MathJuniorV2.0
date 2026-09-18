import json

input_path = '/Users/annette/aidev/全科核心素养提分系统V2.0/tmp/sbfill/part5_input.json'
output_path = '/Users/annette/aidev/全科核心素养提分系统V2.0/tmp/sbfill/part5.jsonl'

with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

out_lines = []

translations = {
    "LM-9B-30": {
        "name_en": "Mother-Child Similarity and Right Triangle Projection Theorem Model",
        "brief_en": "Building mother-child double similarity by drawing the altitude to the hypotenuse of a right triangle; the projection theorem states that the square of a leg equals the product of its projection and the hypotenuse."
    },
    "LM-9B-31": {
        "name_en": "\"Hu Bu Gui\" Weighted Segment Extremum Model",
        "brief_en": "For the weighted segment PA + k·PB (k < 1), constructing an acute angle sin θ = k transforms the broken line into the shortest perpendicular segment."
    },
    "LM-9B-32": {
        "name_en": "Apollonian Circle (Apollonius Circle) Weighted Extremum Model",
        "brief_en": "The locus of a moving point whose distance ratio to two fixed points is a constant k is an Apollonian circle; extrema are found using mother-child similarity angle substitution."
    },
    "LM-9B-33": {
        "name_en": "\"Melon and Bean\" Principle Master-Slave Point Locus Homothetic Rotation Model",
        "brief_en": "As you sow, so shall you reap; when the master point moves on a line/circle, the locus of the slave point is a homeomorphic homothetic rotation."
    },
    "LM-9B-34": {
        "name_en": "Inverse Proportional Function Area Invariance and Central Symmetry Inversion Model",
        "brief_en": "The area of the rectangle formed by dropping perpendiculars from any point on a hyperbola to the coordinate axes is constant |k|; inversion of equal segments with central symmetry about the origin."
    },
    "LM-9B-35": {
        "name_en": "Three-View Orthogonal Projection and Spatial Block Restoration Model",
        "brief_en": "Length aligned, height flush, width equal; using orthographic projections to restore the range of the number of spatial geometric building blocks."
    },
    "LM-9B-36": {
        "name_en": "Right Triangle and Acute Trigonometric Function Comprehensive Measurement Model",
        "brief_en": "The ultimate finale in high school entrance exam geometry; setting up trigonometric equations by introducing altitudes or common sides in double right triangles, and modeling measurements with angles of elevation and depression."
    }
}

concept_translations = {
    "SB-KP072": "Rotate the tangent line to verify that the tangent is perpendicular to the radius through the point of tangency and the tangent segment theorem.",
    "SB-KP073": "Slide the vertex of the inscribed angle on the circumference to verify that the inscribed angle subtending the same arc is half the central angle.",
    "SB-KP074": "Slide the chord AB and observe the perpendicular bisector theorem: the perpendicular from the center bisects the chord and the two arcs.",
    "SB-KP076": "Drag the three sides of the triangle and observe the inscribed circle's center (intersection of angle bisectors) tangent to the three sides.",
    "SB-KP077": "Adjust the central angle α and radius r to observe the proportional relationship between arc length and sector area.",
    "SB-KP079": "Drag the axis of symmetry and observe the perpendicular bisection of corresponding points before and after reflection, preserving congruence and distance.",
    "SB-KP080": "Slide the translation vector and observe that the corresponding segments before and after translation are parallel and equal.",
    "SB-KP081": "Adjust the rotation angle α and observe that the 'holding hands' model rotated around the center of rotation preserves congruence and distance.",
    "SB-KP082": "Rotate by 180° to verify that the center of symmetry of a centrally symmetric figure bisects the segments joining corresponding points.",
    "SB-KP085": "Change the size of the acute angle α and observe that the sine ratio of the opposite side to the hypotenuse in a right triangle is uniquely determined."
}

def generate_morphings(model_id):
    carrier_morphing = {
        "default": "carrier_1",
        "options": [
            {
                "id": "carrier_1",
                "nameZh": "标准几何图形载体",
                "nameEn": "Standard Geometric Figure Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": -2, "y": 0, "color": "#ff0000", "size": 5, "isFixed": True},
                    {"id": "B", "name": "B", "x": 2, "y": 0, "color": "#00ff00", "size": 5, "isFixed": True},
                    {"id": "C", "name": "C", "x": 0, "y": 3, "color": "#0000ff", "size": 5, "isFixed": False}
                ]
            },
            {
                "id": "carrier_2",
                "nameZh": "直角坐标系特殊图形载体",
                "nameEn": "Cartesian Coordinate Special Figure Carrier",
                "points": [
                    {"id": "A", "name": "A", "x": -4, "y": 2, "color": "#ff0000", "size": 5, "isFixed": True},
                    {"id": "B", "name": "B", "x": 4, "y": 2, "color": "#00ff00", "size": 5, "isFixed": True},
                    {"id": "C", "name": "C", "x": 2, "y": 5, "color": "#0000ff", "size": 5, "isFixed": False}
                ]
            }
        ]
    }
    
    posture_morphing = {
        "default": "standard",
        "modes": [
            {"id": "standard", "nameZh": "标准位置", "nameEn": "Standard Posture", "rotationDeg": 0, "reflected": False},
            {"id": "rotated_90", "nameZh": "顺时针旋转90度", "nameEn": "Rotated 90 Degrees Clockwise", "rotationDeg": 90, "reflected": False},
            {"id": "reflected_y", "nameZh": "Y轴翻折倒挂", "nameEn": "Reflected along Y-Axis", "rotationDeg": 0, "reflected": True}
        ]
    }
    
    camouflage_xray = {
        "distractorLayers": [
            {
                "id": "distractor_1", 
                "nameZh": "辅助线干扰", 
                "nameEn": "Auxiliary Line Distractor", 
                "items": [
                    {"type": "line", "points": ["A", "D"]}
                ]
            },
            {
                "id": "distractor_2", 
                "nameZh": "背景圆干扰", 
                "nameEn": "Background Circle Distractor", 
                "items": [
                    {"type": "circle", "center": "B", "radius": 2}
                ]
            }
        ],
        "coreSkeleton": {
            "nameZh": "核心模型骨架",
            "nameEn": "Core Model Skeleton",
            "primaryElements": ["A", "B", "C"],
            "invariants": ["Length(A,B) = const", "Angle(A,C,B)"]
        }
    }
    
    if "31" in model_id: # 胡不归
        carrier_morphing["options"][0]["nameZh"] = "胡不归动折线载体"
        carrier_morphing["options"][0]["nameEn"] = "Hu Bu Gui Moving Broken Line Carrier"
    elif "32" in model_id: # 阿氏圆
        carrier_morphing["options"][0]["nameZh"] = "阿氏圆载体"
        carrier_morphing["options"][0]["nameEn"] = "Apollonian Circle Carrier"
    elif "33" in model_id: # 瓜豆
        carrier_morphing["options"][0]["nameZh"] = "瓜豆位似载体"
        carrier_morphing["options"][0]["nameEn"] = "Melon Bean Homothetic Carrier"
    elif "34" in model_id: # 反比例
        carrier_morphing["options"][0]["nameZh"] = "双曲线载体"
        carrier_morphing["options"][0]["nameEn"] = "Hyperbola Carrier"
        
    return json.dumps(carrier_morphing), json.dumps(posture_morphing), json.dumps(camouflage_xray)

for item in data.get('leap', []):
    model_id = item["model_id"]
    t = translations.get(model_id, {"name_en": "", "brief_en": ""})
    
    carrier_morphing, posture_morphing, camouflage_xray = generate_morphings(model_id)
    
    obj = {
        "type": "leap",
        "model_id": model_id,
        "model_name_zh": item["model_name_zh"],
        "model_brief_zh": item["model_brief_zh"],
        "unlocked_semester": item["unlocked_semester"],
        "primary_line": item["primary_line"],
        "category_id": item["category_id"],
        "kp_dependencies": item["kp_dependencies"],
        "clique_id": item["clique_id"],
        "viewbox_spec_json": item["viewbox_spec_json"],
        "parameter_morphing_json": item["parameter_morphing_json"],
        "model_name_en": t["name_en"],
        "model_brief_en": t["brief_en"],
        "carrier_morphing_json": carrier_morphing,
        "posture_morphing_json": posture_morphing,
        "camouflage_xray_json": camouflage_xray
    }
    out_lines.append(json.dumps(obj, ensure_ascii=False))

for item in data.get('concept', []):
    sandbox_id = item["sandbox_id"]
    en = concept_translations.get(sandbox_id, "Inquiry guide pending.")
    obj = {
        "type": "concept",
        "sandbox_id": sandbox_id,
        "point_id": item["point_id"],
        "category_id": item["category_id"],
        "inquiry_guide_zh": item["inquiry_guide_zh"],
        "inquiry_guide_en": en
    }
    out_lines.append(json.dumps(obj, ensure_ascii=False))

with open(output_path, 'w', encoding='utf-8') as f:
    for line in out_lines:
        f.write(line + '\n')

print("Done!")
