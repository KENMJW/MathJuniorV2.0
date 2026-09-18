#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StepE: 结构字段补全脚本（任务 1.2）
- grade -> (grade, semester) 拆分
- ID 统一格式：KP001 -> KP-001
- edges 定向与 graph_topology 构建 (predecessors / successors)
- module_name = subcategory
- is_milestone 判定 (结合拓扑度数与关键核心大考点)
"""

import json
from collections import defaultdict

GRADE_MAP = {
    "七年级上": (7, 1),
    "七年级下": (7, 2),
    "八年级上": (8, 1),
    "八年级下": (8, 2),
    "九年级上": (9, 1),
    "九年级下": (9, 2)
}

def normalize_kp_id(raw_id: str) -> str:
    num = int(raw_id.replace("KP", "").replace("-", ""))
    return f"KP-{num:03d}"

def process_structure(input_data: dict) -> dict:
    kps = input_data["knowledge_points"]
    edges = input_data["edges"]
    
    # 1. 考点规范化映射
    kp_map = {}
    grade_order = {}
    kp_index_order = {}
    
    for i, kp in enumerate(kps):
        old_id = kp["id"]
        new_id = normalize_kp_id(old_id)
        g_str = kp["grade"]
        if g_str not in GRADE_MAP:
            raise ValueError(f"Unknown grade format: {g_str} in {kp}")
        g, s = GRADE_MAP[g_str]
        
        grade_order[new_id] = (g, s)
        kp_index_order[new_id] = i
        
        kp_map[new_id] = {
            "id": new_id,
            "name_zh": kp.get("name_zh", kp.get("name")),
            "name_en": kp.get("name_en", ""),
            "grade": g,
            "semester": s,
            "domain": kp["domain"],
            "subcategory": kp["subcategory"],
            "primary_line_id": kp.get("primary_line_id", ""),
            "is_mandatory": kp.get("is_mandatory", True),
            "sources": kp.get("sources", [])
        }

    # 2. 边处理与去重
    seen_edges = set()
    dedup_edges = []
    adj_graph = defaultdict(set)
    
    for e in edges:
        from_id = normalize_kp_id(e["from"])
        to_id = normalize_kp_id(e["to"])
        norm_pair = tuple(sorted([from_id, to_id]))
        if norm_pair not in seen_edges:
            seen_edges.add(norm_pair)
            dedup_edges.append({
                "from": norm_pair[0],
                "to": norm_pair[1],
                "direction": "bidirectional"
            })
            adj_graph[from_id].add(to_id)
            adj_graph[to_id].add(from_id)

    # 3. 计算度数与标定里程碑考点 (is_milestone)
    # 里程碑考点：主线枢纽、被引用频次高且在核心知识结构中的关键点
    degrees = {kp_id: len(neighbors) for kp_id, neighbors in adj_graph.items()}
    milestone_keywords = [
        "平面直角坐标系", "函数的概念", "函数的实际应用", "一次函数", 
        "二次函数", "直角三角形", "勾股定理", "解直角三角形", "全等三角形", "相似三角形",
        "圆的基本性质", "一元二次方程", "平行四边形", "三角函数"
    ]
    
    milestone_set = set()
    for new_id, item in kp_map.items():
        name = item["name_zh"]
        deg = degrees.get(new_id, 0)
        is_hub = any(kw in name for kw in milestone_keywords)
        if deg >= 12 or (deg >= 8 and is_hub):
            milestone_set.add(new_id)

    # 4. 有向拓扑定向 (predecessors / successors)
    # 定向规则：学期靠前者为前置(predecessor)，学期靠后者为后继(successor)
    # 若同属一个学期：按考点编号先后定向
    graph_topology = []
    
    for new_id, item in kp_map.items():
        g, s = item["grade"], item["semester"]
        gs_str = f"{g}-{s}"
        
        predecessors = []
        successors = []
        
        for neighbor in sorted(list(adj_graph.get(new_id, set()))):
            ng_g, ng_s = grade_order[neighbor]
            if (ng_g, ng_s) < (g, s):
                predecessors.append(neighbor)
            elif (ng_g, ng_s) > (g, s):
                successors.append(neighbor)
            else:
                if kp_index_order[neighbor] < kp_index_order[new_id]:
                    predecessors.append(neighbor)
                else:
                    successors.append(neighbor)
                    
        is_ms = new_id in milestone_set
        node_id = f"NODE-{g}-{s}-{new_id.replace('KP-', '')}"
        
        graph_topology.append({
            "node_id": node_id,
            "point_id": new_id,
            "grade_semester": gs_str,
            "module_name": item["subcategory"],
            "predecessors": predecessors,
            "successors": successors,
            "is_milestone": is_ms
        })

    return {
        "knowledge_points": list(kp_map.values()),
        "edges": dedup_edges,
        "graph_topology": graph_topology,
        "milestone_ids": sorted(list(milestone_set))
    }

if __name__ == "__main__":
    with open("data/初中数学_知识点组合.json", "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    res = process_structure(raw_data)
    print(f"处理完成: {len(res['knowledge_points'])} 考点, {len(res['edges'])} 边, {len(res['graph_topology'])} 拓扑节点")
    print(f"标定里程碑考点数: {len(res['milestone_ids'])}")
    print("里程碑考点列表:", res['milestone_ids'])
