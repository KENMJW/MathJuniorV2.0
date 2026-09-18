#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
任务 1.6: 组装通用输出 JSON
产出路径: data/初中数学_基础数据_v2.json
包含契约规定的五段：
1. meta (含 grade, subject, generated_at, sources, total_kp, total_edges, total_combinations, distribution)
2. knowledge_points (ID为KP-xxx, 含 grade, semester, primary_line_id, name_en)
3. logic_lines (12 主线骨架)
4. edges (493 条去重边, ID格式 KP-xxx)
5. graph_topology (喂 knowledge_graph_semesters, 含 node_id, point_id, grade_semester, module_name, predecessors, successors, is_milestone)
6. combinations (剔除 is_valid=false, 基数内 0001 连续重编号, ID为 C{size}-{seq:04d}, 无 is_question_valid 字段)
"""

import json
from datetime import datetime
from collections import defaultdict
from postprocess import process_structure, normalize_kp_id
from logic_lines_f import derive_logic_lines
from kp_names_en import KP_NAMES_EN

def assemble_v2():
    # 1. 读取基础考点与边
    with open("data/初中数学_知识点组合.json", "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # 2. 结构处理 (grade拆分, ID规范化, 边去重493, 拓扑定向)
    struct_res = process_structure(raw_data)
    kps_processed = struct_res["knowledge_points"]
    edges_processed = struct_res["edges"]
    topology_processed = struct_res["graph_topology"]

    # 3. 逻辑主线归纳与单归属
    logic_lines, kp_to_line = derive_logic_lines(raw_data["knowledge_points"])

    # 4. 补全 knowledge_points 的 primary_line_id 和 name_en
    for kp in kps_processed:
        kid = kp["id"]
        kp["primary_line_id"] = kp_to_line[kid]
        kp["name_en"] = KP_NAMES_EN[kid]

    # 5. 读取 StepC 有向验证结果并组装 combinations
    with open("skills/skill-genbasicinfo/scripts/directed_validation.json", "r", encoding="utf-8") as f:
        val_list = json.load(f)

    dv_map = {}
    for v in val_list:
        # key使用规范化后的 KP-xxx 排序 tuple
        norm_key = tuple(sorted([normalize_kp_id(x) for x in v["kp_ids"]]))
        dv_map[norm_key] = v

    # 组装组合
    combos_by_size = defaultdict(list)

    # 5.1 单考点 (size=1)
    for kp in kps_processed:
        kid = kp["id"]
        combos_by_size[1].append({
            "size": 1,
            "kp_ids": [kid],
            "scope": "单考点",
            "quality_score": None,
            "directed_order": [kid],
            "question_hint_zh": f"{kp['name_zh']}基础理解",
            "question_hint_en": f"Basic understanding of {kp['name_en']}",
            "question_types": ["single_choice", "fill_blank", "solution"]
        })

    # 5.2 size >= 2 组合 (来自原组合结构，经有向验证后保留 is_valid=True)
    for raw_c in raw_data["combinations"]:
        if raw_c["size"] < 2:
            continue
        norm_ids = [normalize_kp_id(x) for x in raw_c["kp_ids"]]
        key = tuple(sorted(norm_ids))
        val_info = dv_map.get(key)
        
        # 若未验证或验证为 False 则剔除
        if not val_info or val_info.get("is_valid") is False:
            continue

        directed_order = [normalize_kp_id(x) for x in val_info.get("directed_order", norm_ids)]
        hint_zh = val_info.get("question_hint_zh", "")
        hint_en = val_info.get("question_hint_en", "")
        q_types = val_info.get("question_types", ["single_choice", "fill_blank", "solution"])

        combos_by_size[raw_c["size"]].append({
            "size": raw_c["size"],
            "kp_ids": norm_ids,
            "scope": raw_c["scope"],
            "quality_score": raw_c["quality_score"],
            "directed_order": directed_order,
            "question_hint_zh": hint_zh,
            "question_hint_en": hint_en,
            "question_types": q_types
        })

    # 5.3 基数内重新连续编号 C{size}-{seq:04d}
    final_combos = []
    final_dist = {}
    for sz in sorted(combos_by_size.keys()):
        items = combos_by_size[sz]
        final_dist[str(sz)] = len(items)
        for seq, item in enumerate(items, start=1):
            item["id"] = f"C{sz}-{seq:04d}"
            final_combos.append(item)

    total_combinations = len(final_combos)

    # 6. 组装最终 JSON
    result = {
        "meta": {
            "grade": "初中",
            "subject": "数学",
            "generated_at": datetime.now().isoformat(),
            "sources": raw_data["meta"].get("sources", ["人教版", "北师大版", "苏科版", "华师大版", "浙教版"]),
            "total_kp": len(kps_processed),
            "total_edges": len(edges_processed),
            "total_combinations": total_combinations,
            "distribution": final_dist
        },
        "knowledge_points": kps_processed,
        "logic_lines": logic_lines,
        "edges": edges_processed,
        "graph_topology": topology_processed,
        "combinations": final_combos
    }

    out_file = "data/初中数学_基础数据_v2.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ 组装完成: {out_file}")
    print(f"   考点数: {len(kps_processed)} (期望 107)")
    print(f"   主线数: {len(logic_lines)} (期望 12)")
    print(f"   去重边数: {len(edges_processed)} (期望 493)")
    print(f"   拓扑节点: {len(topology_processed)} (期望 107)")
    print(f"   有效组合: {total_combinations} (基数分布: {final_dist})")

if __name__ == "__main__":
    assemble_v2()
