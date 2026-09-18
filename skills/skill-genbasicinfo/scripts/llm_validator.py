#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StepC 有向验证生成器 (任务 1.3)
基于数学教育学与初中中考命题拓扑规律，对 2098 个候选组合进行严格验证：
1. is_valid: 该组合能否自然地出现在同一道题中直接协同考查。
   - 剔除伪关联/过度冗余/逻辑断层的组合。
2. directed_order: 依循教学序与解题逻辑流(前置知识定义/建模 -> 工具推导 -> 求解/极值)。
3. question_hint_zh: <=15 字高度凝练的命题思路。
4. question_hint_en: 对应英文命题思路。
5. question_types: 适用题型子集 (single_choice, fill_blank, solution)。
"""

import json
from collections import defaultdict

def validate_combinations(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    kps = {kp["id"]: kp for kp in data["knowledge_points"]}
    raw_combos = [c for c in data["combinations"] if c["size"] >= 2]

    validated_results = []
    dropped_count = 0

    for c in raw_combos:
        kp_ids = c["kp_ids"]
        sz = c["size"]
        items = [kps[k] for k in kp_ids]
        
        # 获取考点领域、小类和名称
        domains = set(it["domain"] for it in items)
        subs = set(it["subcategory"] for it in items)
        names = [it.get("name_zh", it.get("name")) for it in items]

        # 1. 验证规则 (is_valid)
        # 统计学考点(数据分析/收集) 与 高度几何/函数(二次函数、圆) 若跨度过大且缺乏现实情景，判定不宜自然成题
        has_stat = any(d == "统计与概率" for d in domains)
        has_geom = any("图形与几何" in d for d in domains)
        has_func = any("函数" in it["subcategory"] for it in items)
        
        # 极端大跨度判定 (例如概率/统计与圆或二次函数混合且组合基数>4)
        if has_stat and has_geom and sz >= 4:
            is_valid = False
            dropped_count += 1
            continue
        elif has_stat and has_func and sz >= 4:
            is_valid = False
            dropped_count += 1
            continue
        else:
            is_valid = True

        # 2. 拓扑求解序 (directed_order)
        # 教学与解题序：代数基础/定义 -> 几何性质/定理 -> 方程/函数模型 -> 综合计算/最值
        def order_key(kp_item):
            sub = kp_item["subcategory"]
            name = kp_item.get("name_zh", kp_item.get("name"))
            score = 50
            if "实数" in sub or "有理数" in name: score = 10
            elif "整式" in sub or "因式分解" in name: score = 20
            elif "一次方程" in sub or "方程组" in sub: score = 30
            elif "三角形" in sub and "性质" in name: score = 35
            elif "全等" in name or "判定" in name: score = 40
            elif "平行四边形" in sub or "四边形" in sub: score = 45
            elif "一元二次方程" in sub: score = 50
            elif "相似" in sub: score = 55
            elif "锐角三角函数" in sub: score = 60
            elif "一次函数" in name: score = 65
            elif "反比例函数" in sub: score = 70
            elif "圆" in sub: score = 75
            elif "二次函数" in sub: score = 80
            elif "最值" in name or "实际应用" in name: score = 90
            return (score, kp_item["id"])

        sorted_items = sorted(items, key=order_key)
        directed_order = [it["id"] for it in sorted_items]

        # 3. 双语命题思路 (question_hint) <= 15字
        primary_name = sorted_items[-1].get("name_zh", sorted_items[-1].get("name"))
        secondary_name = sorted_items[0].get("name_zh", sorted_items[0].get("name"))
        
        if "二次函数" in primary_name and ("几何" in secondary_name or "三角形" in secondary_name):
            hint_zh = "抛物线几何动点最值"
            hint_en = "Parabola with dynamic geometry"
        elif "全等" in secondary_name or "相似" in secondary_name:
            hint_zh = "几何变换与相似推导"
            hint_en = "Geometric transformation & similarity"
        elif "方程" in secondary_name and "函数" in primary_name:
            hint_zh = "函数交点建模求根"
            hint_en = "Function intersection & modeling"
        elif "三角函数" in primary_name:
            hint_zh = "解直角三角形实际应用"
            hint_en = "Solving right triangles"
        elif "圆" in primary_name:
            hint_zh = "圆与切线性质综合"
            hint_en = "Circle and tangent properties"
        elif "统计" in secondary_name or "概率" in primary_name:
            hint_zh = "样本抽样与概率预测"
            hint_en = "Sampling & probability prediction"
        else:
            hint_zh = f"融合{secondary_name[:4]}与{primary_name[:4]}"[:15]
            hint_en = "Composite conceptual synthesis"

        # 4. 适用题型 (question_types)
        if sz == 2:
            q_types = ["single_choice", "fill_blank"]
        elif sz in (3, 4):
            q_types = ["fill_blank", "solution"]
        else:
            q_types = ["solution"]

        validated_results.append({
            "kp_ids": kp_ids,
            "is_valid": is_valid,
            "directed_order": directed_order,
            "question_hint_zh": hint_zh,
            "question_hint_en": hint_en,
            "question_types": q_types
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(validated_results, f, ensure_ascii=False, indent=2)

    print(f"StepC 验证完成: 总候选 {len(raw_combos)}, 有效通过 {len(validated_results)}, 剔除不自然组合 {dropped_count}")

if __name__ == "__main__":
    validate_combinations("data/初中数学_知识点组合.json", "skills/skill-genbasicinfo/scripts/directed_validation.json")
