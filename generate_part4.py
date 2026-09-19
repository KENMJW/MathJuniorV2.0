import json

part4_inputs = json.load(open('tmp/sbcfg/part4_input.json'))

results = []

def make_slider(id_, name, min_, max_, def_, step_):
    return {"id": id_, "name": name, "min": min_, "max": max_, "default": def_, "step": step_}

def make_pt(id_, name, x, y, color):
    return {"id": id_, "name": name, "x": x, "y": y, "size": 6, "color": color, "strokeColor": "#ffffff", "constraints": {"type": "free"}}

def make_inv(id_, type_, deps, formula, label):
    return {"id": id_, "type": type_, "deps": deps, "formula": formula, "labelZh": label}

for item in part4_inputs:
    sid = item['sandbox_id']
    base = {
        "sandbox_id": sid,
        "point_id": item['point_id'],
        "canvas_template": item['canvas_template'],
        "viewbox_spec_json": {"xMin": -10, "xMax": 10, "yMin": -8, "yMax": 8, "marginPercent": 10, "preserveAspectRatio": True},
        "content_status": "done"
    }

    if sid == "SB-KP060": # 位似变换
        base['drag_points_json'] = [
            make_pt("p_O", "O", 0, 0, "#ff3b30"),
            make_pt("p_A", "A", 2, 3, "#0071e3"),
            make_pt("p_B", "B", 4, 1, "#0071e3")
        ]
        base['param_sliders_json'] = [make_slider("homothety_ratio", "位似比 k", -3, 3, 2, 0.5)]
        base['invariants_display_json'] = [
            make_inv("inv_dist_OA", "distance", ["p_O", "p_A"], "OA = {val}", "定点距离"),
            make_inv("inv_dist_OB", "distance", ["p_O", "p_B"], "OB = {val}", "定点距离")
        ]
    elif sid == "SB-KP062": # 平行四边形
        base['drag_points_json'] = [
            make_pt("p_A", "A", -3, 3, "#0071e3"),
            make_pt("p_B", "B", -5, -2, "#0071e3"),
            make_pt("p_C", "C", 2, -2, "#0071e3"),
            make_pt("p_D", "D", 4, 3, "#ff9500")
        ]
        base['param_sliders_json'] = [make_slider("shear_angle", "倾斜角", 30, 150, 60, 5)]
        base['invariants_display_json'] = [
            make_inv("inv_AB", "distance", ["p_A", "p_B"], "AB = {val}", "对边AB"),
            make_inv("inv_CD", "distance", ["p_C", "p_D"], "CD = {val}", "对边CD")
        ]
    elif sid == "SB-KP064": # 矩形
        base['drag_points_json'] = [
            make_pt("p_A", "A", -4, 3, "#0071e3"),
            make_pt("p_B", "B", -4, -3, "#0071e3"),
            make_pt("p_C", "C", 4, -3, "#0071e3"),
            make_pt("p_D", "D", 4, 3, "#ff9500")
        ]
        base['param_sliders_json'] = [
            make_slider("rect_width", "矩形宽", 2, 10, 8, 1),
            make_slider("rect_height", "矩形高", 2, 10, 6, 1)
        ]
        base['invariants_display_json'] = [
            make_inv("inv_AC", "distance", ["p_A", "p_C"], "AC = {val}", "对角线AC"),
            make_inv("inv_BD", "distance", ["p_B", "p_D"], "BD = {val}", "对角线BD")
        ]
    elif sid == "SB-KP065": # 菱形
        base['drag_points_json'] = [
            make_pt("p_A", "A", 0, 4, "#0071e3"),
            make_pt("p_B", "B", -3, 0, "#0071e3"),
            make_pt("p_C", "C", 0, -4, "#0071e3"),
            make_pt("p_D", "D", 3, 0, "#ff9500")
        ]
        base['param_sliders_json'] = [
            make_slider("diag_h", "水平对角线", 2, 10, 6, 1),
            make_slider("diag_v", "垂直对角线", 2, 10, 8, 1)
        ]
        base['invariants_display_json'] = [
            make_inv("inv_AB", "distance", ["p_A", "p_B"], "AB = {val}", "边长AB"),
            make_inv("inv_BC", "distance", ["p_B", "p_C"], "BC = {val}", "边长BC")
        ]
    elif sid == "SB-KP066": # 正方形
        base['drag_points_json'] = [
            make_pt("p_A", "A", -3, 3, "#0071e3"),
            make_pt("p_B", "B", -3, -3, "#0071e3"),
            make_pt("p_C", "C", 3, -3, "#0071e3"),
            make_pt("p_D", "D", 3, 3, "#ff9500")
        ]
        base['param_sliders_json'] = [
            make_slider("side_len", "正方形边长", 2, 10, 6, 1)
        ]
        base['invariants_display_json'] = [
            make_inv("inv_AC", "distance", ["p_A", "p_C"], "AC = {val}", "对角线AC"),
            make_inv("inv_BD", "distance", ["p_B", "p_D"], "BD = {val}", "对角线BD")
        ]
    elif sid == "SB-KP068": # 中点四边形
        base['drag_points_json'] = [
            make_pt("p_A", "A", -4, 4, "#0071e3"),
            make_pt("p_B", "B", -6, -2, "#0071e3"),
            make_pt("p_C", "C", 5, -4, "#0071e3"),
            make_pt("p_D", "D", 6, 5, "#0071e3")
        ]
        base['param_sliders_json'] = [
            make_slider("anim_progress", "四边形形变", 0, 100, 50, 1)
        ]
        base['invariants_display_json'] = [
            make_inv("inv_AC", "distance", ["p_A", "p_C"], "AC = {val}", "原对角线AC"),
            make_inv("inv_BD", "distance", ["p_B", "p_D"], "BD = {val}", "原对角线BD")
        ]
    elif sid == "SB-KP069": # 圆的基本概念
        base['drag_points_json'] = [
            make_pt("p_O", "O", 0, 0, "#ff3b30"),
            make_pt("p_A", "A", 4, 0, "#34c759"),
            make_pt("p_B", "B", 0, 4, "#0071e3")
        ]
        base['param_sliders_json'] = [
            make_slider("radius_r", "圆半径 r", 1, 8, 4, 0.5)
        ]
        base['invariants_display_json'] = [
            make_inv("inv_OA", "distance", ["p_O", "p_A"], "OA = {val}", "半径1"),
            make_inv("inv_OB", "distance", ["p_O", "p_B"], "OB = {val}", "半径2")
        ]
    elif sid == "SB-KP071": # 直线与圆位置关系
        base['drag_points_json'] = [
            make_pt("p_O", "O", 0, 0, "#ff3b30"),
            make_pt("p_P", "P", 0, 5, "#34c759") # point on line
        ]
        base['param_sliders_json'] = [
            make_slider("line_dist_d", "圆心距 d", 0, 8, 5, 0.1),
            make_slider("circle_r", "半径 r", 1, 8, 4, 0.1)
        ]
        base['invariants_display_json'] = [
            make_inv("inv_d", "distance", ["p_O", "p_P"], "d = {val}", "圆心到直线距离")
        ]
    elif sid == "SB-KP072": # 切线判定性质
        base['drag_points_json'] = [
            make_pt("p_O", "O", 0, 0, "#ff3b30"),
            make_pt("p_A", "A", 4, 0, "#34c759"), # point of tangency
            make_pt("p_P", "P", 4, 5, "#0071e3")  # point on tangent
        ]
        base['param_sliders_json'] = [
            make_slider("tangent_angle", "切线旋转角", 0, 360, 0, 5)
        ]
        base['invariants_display_json'] = [
            make_inv("inv_angle_OAP", "angle", ["p_O", "p_A", "p_P"], "\\angle OAP = {val}^{\\circ}", "切线夹角")
        ]

    results.append(base)

with open('tmp/sbcfg/part4.jsonl', 'w', encoding='utf-8') as f:
    for res in results:
        f.write(json.dumps(res, ensure_ascii=False) + '\n')
print("Done!")
