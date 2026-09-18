#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StepD 主线归纳逻辑 f (requirements §6)
输入: 107 考点数据 (含 domain, subcategory, grade, semester)
范式族: 族A (数理范式) -> [公理/定律, 结构/形式, 变换/不变量, 度量/定量, 数据/推断]
归类映射:
  - 数与代数:
      A1: 实数与数轴模型 (公理/公设层) -> 实数 (KP001~KP008)
      A2: 代数式与运算结构 (结构/形式层) -> 代数式、分式运算 (KP009~KP017)
      A3: 方程与不等式模型 (结构/等式模型层) -> 方程组、不等式、分式方程 (KP018~KP029)
      A4: 函数与坐标系演化 (模型与映射层) -> 函数全域 (KP030~KP043)
  - 图形与几何:
      G1: 欧几里得几何原点 (公理层) -> 点线面角相交平行 (KP044~KP048)
      G2: 三角形全等与公理推演 (结构层) -> 三角形基本性质、全等、等腰、等边 (KP049~KP055)
      G3: 四边形演化与分类性质 (变换/结构层) -> 平行四边形演化体系 (KP061~KP068)
      G4: 圆的几何度量与位置关系 (度量层) -> 圆的性质、定理与计算 (KP069~KP078)
      G5: 图形运动与刚体变换 (变换/不变量层) -> 对称、平移、旋转、三视图 (KP079~KP084)
      G6: 勾股定理与相似三角度量 (度量/定量层) -> 勾股、相似、解直角三角形 (KP056~KP060, KP085~KP091)
  - 统计与概率:
      S1: 统计推断与数据分布 (数据/推断层) -> 数据收集整理、数据分析 (KP092~KP102)
      P1: 随机现象与概率模型 (概率模型层) -> 随机事件与概率推断 (KP103~KP107)
"""

import json

LOGIC_LINES_DEF = [
    {
        "line_id": "A1",
        "name_zh": "实数与数轴模型",
        "name_en": "Real Numbers & Number Line Model",
        "domain": "数与代数",
        "dimension": "公理/定律",
        "kp_prefixes": ["KP001", "KP002", "KP003", "KP004", "KP005", "KP006", "KP007", "KP008"]
    },
    {
        "line_id": "A2",
        "name_zh": "代数式与运算结构",
        "name_en": "Algebraic Expressions & Operational Structure",
        "domain": "数与代数",
        "dimension": "结构/形式",
        "kp_prefixes": ["KP009", "KP010", "KP011", "KP012", "KP013", "KP014", "KP015", "KP016", "KP017"]
    },
    {
        "line_id": "A3",
        "name_zh": "方程与不等式模型",
        "name_en": "Equations & Inequalities Modeling",
        "domain": "数与代数",
        "dimension": "结构/形式",
        "kp_prefixes": ["KP018", "KP019", "KP020", "KP021", "KP022", "KP023", "KP024", "KP025", "KP026", "KP027", "KP028", "KP029"]
    },
    {
        "line_id": "A4",
        "name_zh": "函数与坐标系演化",
        "name_en": "Functions & Coordinate Evolution",
        "domain": "数与代数",
        "dimension": "变换/不变量",
        "kp_prefixes": [f"KP{i:03d}" for i in range(30, 44)]
    },
    {
        "line_id": "G1",
        "name_zh": "欧几里得几何原点",
        "name_en": "Euclidean Geometric Foundations",
        "domain": "图形与几何",
        "dimension": "公理/定律",
        "kp_prefixes": [f"KP{i:03d}" for i in range(44, 49)]
    },
    {
        "line_id": "G2",
        "name_zh": "三角形全等与公理推演",
        "name_en": "Triangle Congruence & Axiomatic Deduction",
        "domain": "图形与几何",
        "dimension": "结构/形式",
        "kp_prefixes": [f"KP{i:03d}" for i in range(49, 56)]
    },
    {
        "line_id": "G3",
        "name_zh": "四边形演化与分类性质",
        "name_en": "Quadrilateral Evolution & Classification",
        "domain": "图形与几何",
        "dimension": "变换/不变量",
        "kp_prefixes": [f"KP{i:03d}" for i in range(61, 69)]
    },
    {
        "line_id": "G4",
        "name_zh": "圆的几何度量与位置关系",
        "name_en": "Circles: Geometric Metrics & Positional Relations",
        "domain": "图形与几何",
        "dimension": "度量/定量",
        "kp_prefixes": [f"KP{i:03d}" for i in range(69, 79)]
    },
    {
        "line_id": "G5",
        "name_zh": "图形运动与刚体变换",
        "name_en": "Geometric Transformations & Rigid Motion",
        "domain": "图形与几何",
        "dimension": "变换/不变量",
        "kp_prefixes": [f"KP{i:03d}" for i in range(79, 85)]
    },
    {
        "line_id": "G6",
        "name_zh": "勾股定理与相似三角度量",
        "name_en": "Pythagorean Theorem & Trigonometric Metrics",
        "domain": "图形与几何",
        "dimension": "度量/定量",
        "kp_prefixes": [f"KP{i:03d}" for i in range(56, 61)] + [f"KP{i:03d}" for i in range(85, 92)]
    },
    {
        "line_id": "S1",
        "name_zh": "统计推断与数据分布",
        "name_en": "Statistical Inference & Data Distribution",
        "domain": "统计与概率",
        "dimension": "数据/推断",
        "kp_prefixes": [f"KP{i:03d}" for i in range(92, 103)]
    },
    {
        "line_id": "P1",
        "name_zh": "随机现象与概率模型",
        "name_en": "Random Phenomena & Probability Models",
        "domain": "统计与概率",
        "dimension": "数据/推断",
        "kp_prefixes": [f"KP{i:03d}" for i in range(103, 108)]
    }
]

def derive_logic_lines(kps_list):
    # 建立映射
    kp_to_line = {}
    line_members = {line["line_id"]: [] for line in LOGIC_LINES_DEF}
    
    for line in LOGIC_LINES_DEF:
        lid = line["line_id"]
        for p in line["kp_prefixes"]:
            norm_id = f"KP-{int(p.replace('KP','')):03d}"
            kp_to_line[norm_id] = lid
            line_members[lid].append(norm_id)

    # 验证覆盖性
    all_norm_kps = [f"KP-{int(kp['id'].replace('KP','')):03d}" for kp in kps_list]
    for kid in all_norm_kps:
        if kid not in kp_to_line:
            raise ValueError(f"考点未分配主线: {kid}")

    # 计算各主线跨度 semester_span
    kp_dict = {f"KP-{int(kp['id'].replace('KP','')):03d}": kp for kp in kps_list}
    result_lines = []
    
    for line in LOGIC_LINES_DEF:
        lid = line["line_id"]
        members = line_members[lid]
        semesters = set()
        for m in members:
            kp = kp_dict[m]
            g_str = kp["grade"]
            # 七年级上 -> 7-1
            g_map = {"七年级上":"7-1", "七年级下":"7-2", "八年级上":"8-1", "八年级下":"8-2", "九年级上":"9-1", "九年级下":"9-2"}
            semesters.add(g_map[g_str])
        
        sorted_sem = sorted(list(semesters))
        span_str = f"{sorted_sem[0]} ~ {sorted_sem[-1]}" if len(sorted_sem) > 1 else sorted_sem[0]
        
        result_lines.append({
            "line_id": lid,
            "name_zh": line["name_zh"],
            "name_en": line["name_en"],
            "domain": line["domain"],
            "semester_span": span_str,
            "member_kp_ids": members
        })

    return result_lines, kp_to_line

if __name__ == "__main__":
    with open("data/初中数学_知识点组合.json", "r", encoding="utf-8") as f:
        d = json.load(f)
    lines, kp_map = derive_logic_lines(d["knowledge_points"])
    print(f"主线归纳完成: 得到 {len(lines)} 条主线")
    for l in lines:
        print(f"[{l['line_id']}] {l['name_zh']} ({l['semester_span']}): {len(l['member_kp_ids'])} 考点")
    print(f"考点单归属总数: {len(kp_map)}")
