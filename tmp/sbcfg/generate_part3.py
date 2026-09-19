import json

configs = [
    {
        "sandbox_id": "SB-KP047",
        "point_id": "KP-047",
        "canvas_template": "geometry_perpendicular_template",
        "viewbox_spec_json": {"xMin": -8, "xMax": 8, "yMin": -6, "yMax": 6, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "P", "name": "P", "x": 0, "y": 4, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "H", "name": "H", "x": 0, "y": 0, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "y=0"},
            {"id": "C", "name": "C", "x": 3, "y": 0, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "y=0"}
        ],
        "param_sliders_json": [
            {"id": "line_y", "name": "直线高度", "min": -5, "max": 2, "default": 0, "step": 0.5}
        ],
        "invariants_display_json": [
            {"id": "dist_PC", "type": "distance", "deps": ["P", "C"], "formula": "{val}", "labelZh": "斜线段距离"},
            {"id": "dist_PH", "type": "distance", "deps": ["P", "H"], "formula": "{val}", "labelZh": "垂线段距离"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP048",
        "point_id": "KP-048",
        "canvas_template": "geometry_parallel_template",
        "viewbox_spec_json": {"xMin": -8, "xMax": 8, "yMin": -6, "yMax": 6, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "A", "name": "A", "x": -4, "y": 3, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "y=3"},
            {"id": "B", "name": "B", "x": 4, "y": 3, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "y=3"},
            {"id": "C", "name": "C", "x": -4, "y": -3, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "y=-3"},
            {"id": "D", "name": "D", "x": 4, "y": -3, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "y=-3"},
            {"id": "E", "name": "E", "x": -2, "y": 5, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"}
        ],
        "param_sliders_json": [
            {"id": "angle_transversal", "name": "截线角度", "min": 30, "max": 150, "default": 60, "step": 1}
        ],
        "invariants_display_json": [
            {"id": "dist_lines", "type": "vertical_distance", "deps": ["A", "C"], "formula": "{val}", "labelZh": "平行线间距"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP049",
        "point_id": "KP-049",
        "canvas_template": "geometry_triangle_sum_template",
        "viewbox_spec_json": {"xMin": -8, "xMax": 8, "yMin": -6, "yMax": 6, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "A", "name": "A", "x": 0, "y": 4, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "B", "name": "B", "x": -4, "y": -3, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "C", "name": "C", "x": 4, "y": -3, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "none"}
        ],
        "param_sliders_json": [
            {"id": "translate_x", "name": "水平平移", "min": -5, "max": 5, "default": 0, "step": 1}
        ],
        "invariants_display_json": [
            {"id": "angle_A", "type": "angle", "deps": ["B", "A", "C"], "formula": "\\angle A = {val}^{\\circ}", "labelZh": "内角 A"},
            {"id": "angle_B", "type": "angle", "deps": ["A", "B", "C"], "formula": "\\angle B = {val}^{\\circ}", "labelZh": "内角 B"},
            {"id": "angle_C", "type": "angle", "deps": ["A", "C", "B"], "formula": "\\angle C = {val}^{\\circ}", "labelZh": "内角 C"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP051",
        "point_id": "KP-051",
        "canvas_template": "geometry_congruence_template",
        "viewbox_spec_json": {"xMin": -10, "xMax": 10, "yMin": -8, "yMax": 8, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "A1", "name": "A", "x": -7, "y": 2, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "B1", "name": "B", "x": -9, "y": -3, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "C1", "name": "C", "x": -4, "y": -3, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "A2", "name": "A'", "x": 3, "y": 2, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "B2", "name": "B'", "x": 1, "y": -3, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "none"}
        ],
        "param_sliders_json": [
            {"id": "rotate_angle", "name": "旋转角度", "min": 0, "max": 360, "default": 0, "step": 15}
        ],
        "invariants_display_json": [
            {"id": "side_AB", "type": "distance", "deps": ["A1", "B1"], "formula": "AB = {val}", "labelZh": "边长 AB"},
            {"id": "side_A2B2", "type": "distance", "deps": ["A2", "B2"], "formula": "A'B' = {val}", "labelZh": "边长 A'B'"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP053",
        "point_id": "KP-053",
        "canvas_template": "geometry_isosceles_template",
        "viewbox_spec_json": {"xMin": -8, "xMax": 8, "yMin": -6, "yMax": 6, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "A", "name": "A", "x": 0, "y": 4, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "x=0"},
            {"id": "B", "name": "B", "x": -4, "y": -3, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "y=-3"},
            {"id": "C", "name": "C", "x": 4, "y": -3, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "y=-3"}
        ],
        "param_sliders_json": [
            {"id": "base_width", "name": "底边宽度", "min": 2, "max": 10, "default": 8, "step": 0.5}
        ],
        "invariants_display_json": [
            {"id": "side_AB", "type": "distance", "deps": ["A", "B"], "formula": "AB = {val}", "labelZh": "腰长 AB"},
            {"id": "side_AC", "type": "distance", "deps": ["A", "C"], "formula": "AC = {val}", "labelZh": "腰长 AC"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP055",
        "point_id": "KP-055",
        "canvas_template": "geometry_equilateral_template",
        "viewbox_spec_json": {"xMin": -8, "xMax": 8, "yMin": -6, "yMax": 6, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "A", "name": "A", "x": 0, "y": 5.196, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "B", "name": "B", "x": -3, "y": 0, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "C", "name": "C", "x": 3, "y": 0, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "none"}
        ],
        "param_sliders_json": [
            {"id": "side_length", "name": "边长", "min": 2, "max": 10, "default": 6, "step": 0.5}
        ],
        "invariants_display_json": [
            {"id": "angle_A", "type": "angle", "deps": ["B", "A", "C"], "formula": "\\angle A = {val}^{\\circ}", "labelZh": "顶角"},
            {"id": "side_AB", "type": "distance", "deps": ["A", "B"], "formula": "AB = {val}", "labelZh": "边长 AB"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP056",
        "point_id": "KP-056",
        "canvas_template": "geometry_right_triangle_template",
        "viewbox_spec_json": {"xMin": -8, "xMax": 8, "yMin": -6, "yMax": 6, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "C", "name": "C", "x": -3, "y": -3, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "A", "name": "A", "x": -3, "y": 3, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "x=-3"},
            {"id": "B", "name": "B", "x": 5, "y": -3, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "y=-3"},
            {"id": "M", "name": "M", "x": 1, "y": 0, "size": 8, "color": "#af52de", "strokeColor": "#ffffff", "constraints": "none"}
        ],
        "param_sliders_json": [
            {"id": "leg_a", "name": "直角边 a", "min": 2, "max": 10, "default": 8, "step": 0.5},
            {"id": "leg_b", "name": "直角边 b", "min": 2, "max": 10, "default": 6, "step": 0.5}
        ],
        "invariants_display_json": [
            {"id": "dist_CM", "type": "distance", "deps": ["C", "M"], "formula": "CM = {val}", "labelZh": "斜边中线"},
            {"id": "dist_AB", "type": "distance", "deps": ["A", "B"], "formula": "AB = {val}", "labelZh": "斜边长"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP057",
        "point_id": "KP-057",
        "canvas_template": "geometry_pythagorean_template",
        "viewbox_spec_json": {"xMin": -12, "xMax": 12, "yMin": -10, "yMax": 10, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "C", "name": "C", "x": 0, "y": 0, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "A", "name": "A", "x": 0, "y": 4, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "x=0"},
            {"id": "B", "name": "B", "x": 3, "y": 0, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "y=0"}
        ],
        "param_sliders_json": [
            {"id": "leg_a", "name": "直角边 a", "min": 2, "max": 8, "default": 3, "step": 1},
            {"id": "leg_b", "name": "直角边 b", "min": 2, "max": 8, "default": 4, "step": 1}
        ],
        "invariants_display_json": [
            {"id": "dist_AB", "type": "distance", "deps": ["A", "B"], "formula": "c = {val}", "labelZh": "斜边长 c"}
        ],
        "content_status": "done"
    },
    {
        "sandbox_id": "SB-KP058",
        "point_id": "KP-058",
        "canvas_template": "geometry_similarity_template",
        "viewbox_spec_json": {"xMin": -10, "xMax": 10, "yMin": -8, "yMax": 8, "marginPercent": 15, "preserveAspectRatio": True},
        "drag_points_json": [
            {"id": "A", "name": "A", "x": 0, "y": 4, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "B", "name": "B", "x": -3, "y": -2, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "C", "name": "C", "x": 4, "y": -2, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "A1", "name": "A'", "x": 5, "y": 4, "size": 8, "color": "#ff3b30", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "B1", "name": "B'", "x": 3.5, "y": 1, "size": 8, "color": "#0071e3", "strokeColor": "#ffffff", "constraints": "none"},
            {"id": "C1", "name": "C'", "x": 7, "y": 1, "size": 8, "color": "#34c759", "strokeColor": "#ffffff", "constraints": "none"}
        ],
        "param_sliders_json": [
            {"id": "sim_ratio", "name": "相似比 k", "min": 0.5, "max": 3, "default": 1.5, "step": 0.1}
        ],
        "invariants_display_json": [
            {"id": "ratio_AB", "type": "ratio_distance", "deps": ["A1", "B1", "A", "B"], "formula": "A'B'/AB = {val}", "labelZh": "边长比"},
            {"id": "angle_A", "type": "angle", "deps": ["B", "A", "C"], "formula": "\\angle A = {val}^{\\circ}", "labelZh": "顶角 A"},
            {"id": "angle_A1", "type": "angle", "deps": ["B1", "A1", "C1"], "formula": "\\angle A' = {val}^{\\circ}", "labelZh": "顶角 A'"}
        ],
        "content_status": "done"
    }
]

with open("/Users/annette/aidev/全科核心素养提分系统V2.0/tmp/sbcfg/part3.jsonl", "w", encoding="utf-8") as f:
    for c in configs:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")
print("Done writing to part3.jsonl")
