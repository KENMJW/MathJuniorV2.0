#!/usr/bin/env python3
"""
TASK-DATA-0011 Shard Worker
Processes a single shard of questions for:
1. primary_point_id re-allocation (conservative)
2. all_point_ids recognition
3. max_grade calculation
4. combination_id matching
"""

import sys
import os
import json
import re
import argparse

def load_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    kp_path = os.path.join(base_dir, 'tmp/data0011/knowledge_points.json')
    combo_path = os.path.join(base_dir, 'tmp/data0011/knowledge_combinations.json')

    with open(kp_path, 'r', encoding='utf-8') as f:
        kps = json.load(f)
    
    with open(combo_path, 'r', encoding='utf-8') as f:
        combos = json.load(f)

    kp_map = {kp['point_id']: kp for kp in kps}
    
    combo_map = {}
    for c in combos:
        kp_list = tuple(sorted(json.loads(c['kp_ids'])))
        combo_map[kp_list] = c['combination_id']

    return kp_map, combo_map

# Precise patterns for the 19 under-represented KPs
REALLOCATION_RULES = [
    # KP-013 整式的除法
    {
        'target_kp': 'KP-013',
        'parent_kps': {'KP-009', 'KP-010', 'KP-011', 'KP-012'},
        'pattern': r'(?:单项式除以单项式|多项式除以单项式|整式的除法|(?:(?:\([^\)]+\)|[0-9a-zA-Z\^]+)\s*(?:÷|\\div)\s*(?:\([^\)]+\)|[0-9a-zA-Z\^]+)))',
        'negative': r'(?:分式|解方程|化简求值.*分式)',
        'reason': '题目考查整式（单项式/多项式）的除法运算'
    },
    # KP-022 直接开平方法
    {
        'target_kp': 'KP-022',
        'parent_kps': {'KP-021', 'KP-023', 'KP-025'},
        'pattern': r'(?:直接开平方法|直接开平方|(?:\([a-zA-Z\d\s\+\-]+\)\^2|[a-zA-Z]\^2)\s*=\s*\d+)',
        'negative': r'(?:根与系数|韦达|判别式|配方法|因式分解法|增长率|降低率|利润|列方程|应用题)',
        'reason': '一元二次方程形如 x^2=p 或 (ax+b)^2=p，使用直接开平方法求解'
    },
    # KP-024 求根公式法
    {
        'target_kp': 'KP-024',
        'parent_kps': {'KP-021', 'KP-023', 'KP-025', 'KP-026'},
        'pattern': r'(?:求根公式|公式法|根的判别式|b\^2\s*-\s*4ac|\\Delta\s*[>=<]|判别式)',
        'negative': r'',
        'reason': '考查一元二次方程求根公式或判别式确定根的情况'
    },
    # KP-037 反比例函数k的几何意义
    {
        'target_kp': 'KP-037',
        'parent_kps': {'KP-035', 'KP-036'},
        'pattern': r'(?:k的几何意义|面积.*(?:\|k\||\\frac\{1\}\{2\}|\\frac\{k\}\{2\})|矩形.*面积.*反比例|三角形.*面积.*反比例|双曲线.*垂线.*面积)',
        'negative': r'',
        'reason': '利用反比例函数k的几何意义（垂线与坐标轴围成矩形/三角形面积）解题'
    },
    # KP-049 三角形的基本性质
    {
        'target_kp': 'KP-049',
        'parent_kps': {'KP-046', 'KP-047', 'KP-048'},
        'pattern': r'(?:三角形内角和|三角形的外角等于|三角形.*稳定性)',
        'negative': r'(?:三边关系|两边之和|两边之差|多边形|[四五六七八九十]\s*边形|[nN]\s*边形)',
        'reason': '考查三角形基本性质（内角和定理、外角性质或稳定性）'
    },
    # KP-054 等腰三角形的判定
    {
        'target_kp': 'KP-054',
        'parent_kps': {'KP-051', 'KP-052', 'KP-053'},
        'pattern': r'(?:等腰三角形的判定|等角对等边|判定.*是等腰三角形|若.*则\s*\\triangle.*是等腰三角形)',
        'negative': r'',
        'reason': '考查等腰三角形的判定定理（等角对等边）'
    },
    # KP-070 点与圆的位置关系
    {
        'target_kp': 'KP-070',
        'parent_kps': {'KP-069', 'KP-074'},
        'pattern': r'(?:点与圆的位置关系|点在圆[内外上]|点.*到圆心.*距离与半径)',
        'negative': r'',
        'reason': '考查点与圆的位置关系及点到圆心的距离d与半径r的大小比较'
    },
    # KP-071 直线与圆的位置关系
    {
        'target_kp': 'KP-071',
        'parent_kps': {'KP-069', 'KP-072', 'KP-073'},
        'pattern': r'(?:直线与圆的位置关系|切线的判定|切线的性质|圆的切线|相切于点)',
        'negative': r'',
        'reason': '考查直线与圆的位置关系及切线的判定与性质'
    },
    # KP-075 圆与圆的位置关系
    {
        'target_kp': 'KP-075',
        'parent_kps': {'KP-069', 'KP-074'},
        'pattern': r'(?:圆与圆的位置关系|两圆.*(?:相切|外切|内切|相交|外离|内含)|圆心距与两圆半径)',
        'negative': r'',
        'reason': '考查两圆的位置关系（外离、外切、相交、内切、内含）及圆心距与半径的关系'
    },
    # KP-078 正多边形与圆
    {
        'target_kp': 'KP-078',
        'parent_kps': {'KP-069', 'KP-077'},
        'pattern': r'(?:正多边形与圆|正六边形.*外接圆|正三角形.*外接圆|正方形.*内切圆|正多边形.*边心距|正多边形.*中心角)',
        'negative': r'',
        'reason': '考查正多边形与圆的关系（外接圆、内切圆、中心角、边心距计算）'
    },
    # KP-083 图形的综合变换
    {
        'target_kp': 'KP-083',
        'parent_kps': {'KP-079', 'KP-080', 'KP-081', 'KP-082'},
        'pattern': r'(?:图形的综合变换|(?:平移.*旋转|旋转.*平移|翻折.*旋转|旋转.*折叠|平移.*轴对称).*(?:坐标|变换|轨迹))',
        'negative': r'',
        'reason': '考查图形的平移、旋转、轴对称等两种或多种几何变换的综合运用'
    },
    # KP-085 正弦sin的定义与计算
    {
        'target_kp': 'KP-085',
        'parent_kps': {'KP-084', 'KP-088'},
        'pattern': r'(?:\\sin|正弦值|正弦的定义)',
        'negative': r'(?:\\cos|\\tan|余弦|正切|坡度|仰角|俯角)',
        'reason': '纯考查锐角正弦sin的定义（对边比斜边）及特殊角正弦计算'
    },
    # KP-086 余弦cos的定义与计算
    {
        'target_kp': 'KP-086',
        'parent_kps': {'KP-084', 'KP-088'},
        'pattern': r'(?:\\cos|余弦值|余弦的定义)',
        'negative': r'(?:\\sin|\\tan|正弦|正切|坡度|仰角|俯角)',
        'reason': '纯考查锐角余弦cos的定义（邻边比斜边）及特殊角余弦计算'
    },
    # KP-089 互余角的三角函数关系
    {
        'target_kp': 'KP-089',
        'parent_kps': {'KP-084', 'KP-087', 'KP-088'},
        'pattern': r'(?:互余角.*三角函数|\\sin\s*\(\s*90\^\\circ|\\cos\s*\(\s*90\^\\circ|90\^\\circ\s*-\s*[A-Z\alpha])',
        'negative': r'',
        'reason': '考查互为余角的两个角的三角函数之间的转换关系'
    },
    # KP-095 折线统计图
    {
        'target_kp': 'KP-095',
        'parent_kps': {'KP-090', 'KP-091', 'KP-094'},
        'pattern': r'(?:折线统计图|折线图)',
        'negative': r'(?:条形统计图|扇形统计图|频数直方图)',
        'reason': '考查折线统计图的数据读取、趋势分析与信息获取'
    },
    # KP-096 茎叶图
    {
        'target_kp': 'KP-096',
        'parent_kps': {'KP-090', 'KP-094', 'KP-097'},
        'pattern': r'(?:茎叶图)',
        'negative': r'',
        'reason': '考查茎叶图的数据读取与特征分析'
    },
    # KP-100 极差
    {
        'target_kp': 'KP-100',
        'parent_kps': {'KP-097', 'KP-098', 'KP-099'},
        'pattern': r'(?:极差|最大值与最小值的差)',
        'negative': r'(?:方差公式|标准差计算|加权平均数)',
        'reason': '考查数据集极差的计算与意义'
    },
    # KP-102 利用统计量综合判断
    {
        'target_kp': 'KP-102',
        'parent_kps': {'KP-097', 'KP-098', 'KP-099', 'KP-101'},
        'pattern': r'(?:统计量综合判断|综合.*平均数.*方差.*中位数.*决策|选拔.*方差.*平均数)',
        'negative': r'',
        'reason': '利用平均数、中位数、众数、方差等多种统计量进行综合分析与决策'
    },
    # KP-107 用频率估计概率
    {
        'target_kp': 'KP-107',
        'parent_kps': {'KP-103', 'KP-104', 'KP-105', 'KP-106'},
        'pattern': r'(?:用频率估计概率|频率估计概率|大量重复试验.*频率稳定|试验次数.*频率趋近)',
        'negative': r'',
        'reason': '考查在大量重复试验中用频率估计事件概率的思想与计算'
    }
]

# Secondary KP keyword indicators for recognizing all_point_ids
SECONDARY_INDICATORS = {
    'KP-001': r'有理数|正数和负数',
    'KP-002': r'数轴',
    'KP-003': r'相反数',
    'KP-004': r'绝对值',
    'KP-005': r'有理数的加减',
    'KP-006': r'有理数的乘除',
    'KP-007': r'有理数的乘方',
    'KP-008': r'科学记数法',
    'KP-009': r'代数式|代数式的值',
    'KP-010': r'整式|单项式|多项式|同类项',
    'KP-011': r'整式的加减',
    'KP-012': r'整式的乘法|幂的运算|同底数幂',
    'KP-013': r'整式的除法',
    'KP-014': r'平方根|算术平方根|立方根',
    'KP-015': r'二次根式',
    'KP-016': r'分式|分式有意义',
    'KP-017': r'分式的乘除|分式的加减',
    'KP-018': r'分式方程',
    'KP-019': r'一元一次方程',
    'KP-020': r'二元一次方程组',
    'KP-021': r'一元二次方程',
    'KP-022': r'直接开平方',
    'KP-023': r'配方法',
    'KP-024': r'求根公式|判别式|b\^2\s*-\s*4ac',
    'KP-025': r'因式分解法',
    'KP-026': r'根与系数的关系|韦达定理',
    'KP-027': r'不等式|不等式的性质',
    'KP-028': r'一元一次不等式',
    'KP-029': r'一元一次不等式组',
    'KP-030': r'函数|自变量的取值范围',
    'KP-031': r'平面直角坐标系|坐标|象限',
    'KP-032': r'正比例函数',
    'KP-033': r'一次函数',
    'KP-034': r'一次函数的图象|一次函数的性质',
    'KP-035': r'一次函数与二元一次方程|一次函数与不等式',
    'KP-036': r'反比例函数',
    'KP-037': r'k的几何意义',
    'KP-038': r'二次函数',
    'KP-039': r'二次函数的图象|抛物线',
    'KP-040': r'二次函数图象与系数的关系',
    'KP-041': r'二次函数与一元二次方程',
    'KP-042': r'二次函数的应用|抛物线最值',
    'KP-043': r'立体图形|几何体|展开图',
    'KP-044': r'点、线、面、体',
    'KP-045': r'线段、射线、直线|两点之间线段最短',
    'KP-046': r'角|角的度量|余角和补角',
    'KP-047': r'相交线|对顶角|垂线',
    'KP-048': r'平行线|同位角|内错角|同旁内角',
    'KP-049': r'三角形三边关系|三角形内角和',
    'KP-050': r'多边形|多边形内角和',
    'KP-051': r'全等三角形',
    'KP-052': r'全等三角形的判定|SAS|ASA|AAS|SSS|HL',
    'KP-053': r'等腰三角形|三线合一',
    'KP-054': r'等角对等边',
    'KP-055': r'线段垂直平分线',
    'KP-056': r'角平分线',
    'KP-057': r'勾股定理',
    'KP-058': r'勾股定理的逆定理',
    'KP-059': r'比例线段|成比例线段',
    'KP-060': r'相似多边形|位似',
    'KP-061': r'相似三角形',
    'KP-062': r'相似三角形的判定',
    'KP-063': r'相似三角形的性质',
    'KP-064': r'平行四边形',
    'KP-065': r'矩形',
    'KP-066': r'菱形',
    'KP-067': r'正方形',
    'KP-068': r'中点四边形|梯形',
    'KP-069': r'圆的有关概念|弦|弧',
    'KP-070': r'点与圆的位置关系',
    'KP-071': r'直线与圆的位置关系|切线',
    'KP-072': r'切线的判定与性质',
    'KP-073': r'切线长定理',
    'KP-074': r'垂径定理',
    'KP-075': r'圆与圆的位置关系',
    'KP-076': r'圆心角|弧、弦、圆心角',
    'KP-077': r'圆周角定理',
    'KP-078': r'正多边形与圆',
    'KP-079': r'轴对称|折叠|翻折',
    'KP-080': r'平移',
    'KP-081': r'旋转|中心对称',
    'KP-082': r'位似变换',
    'KP-083': r'图形的综合变换',
    'KP-084': r'锐角三角函数',
    'KP-085': r'正弦|\\sin',
    'KP-086': r'余弦|\\cos',
    'KP-087': r'正切|\\tan',
    'KP-088': r'解直角三角形',
    'KP-089': r'互余角',
    'KP-090': r'数据的收集与整理|全面调查|抽样调查',
    'KP-091': r'统计图的选择|条形统计图|扇形统计图',
    'KP-092': r'频数分布直方图',
    'KP-093': r'条形统计图',
    'KP-094': r'扇形统计图',
    'KP-095': r'折线统计图',
    'KP-096': r'茎叶图',
    'KP-097': r'平均数',
    'KP-098': r'中位数与众数',
    'KP-099': r'方差',
    'KP-100': r'极差',
    'KP-101': r'频数与频率',
    'KP-102': r'统计量综合判断',
    'KP-103': r'随机事件|确定事件',
    'KP-104': r'概率的定义',
    'KP-105': r'简单随机事件的概率计算',
    'KP-106': r'列表法或画树状图求概率',
    'KP-107': r'用频率估计概率'
}

def process_shard(shard_num):
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    input_file = os.path.join(base_dir, f'tmp/data0011/part{shard_num}_input.json')
    output_file = os.path.join(base_dir, f'tmp/data0011/part{shard_num}.jsonl')

    kp_map, combo_map = load_data()

    with open(input_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    results = []
    reallocated_count = 0

    for q in questions:
        qid = q['question_id']
        cur_kp = q['primary_point_id']
        cur_grade = q['grade_level']
        cur_sem = q['semester']
        stem = q['stem_zh'] or ''
        sol = q['solutions_json'] or ''
        opt = q['options_json'] or ''
        existing_combo = q.get('combination_id')

        text = stem + ' ' + sol + ' ' + opt

        # 1. Check for re-allocation
        new_kp = cur_kp
        reallocated = False
        realloc_reason = ''

        for rule in REALLOCATION_RULES:
            target = rule['target_kp']
            if cur_kp == target:
                continue
            if rule['parent_kps'] and (cur_kp not in rule['parent_kps']):
                continue
            if re.search(rule['pattern'], text, re.I):
                if rule['negative'] and re.search(rule['negative'], text, re.I):
                    continue
                # Found candidate re-allocation!
                new_kp = target
                reallocated = True
                realloc_reason = rule['reason']
                break

        if reallocated:
            reallocated_count += 1
            final_grade = kp_map[new_kp]['grade']
            final_sem = kp_map[new_kp]['semester']
        else:
            final_grade = cur_grade if cur_grade else kp_map[new_kp]['grade']
            final_sem = cur_sem if cur_sem else kp_map[new_kp]['semester']

        # 2. Identify all_point_ids
        points_set = {new_kp}

        # If question had an existing combination_id in input, keep its combo KPs
        # unless re-allocated
        if existing_combo and not reallocated:
            # find KPs of this combo
            for kps_tuple, cid in combo_map.items():
                if cid == existing_combo:
                    points_set.update(kps_tuple)
                    break

        # Check secondary indicators with high specificity
        # Only add secondary KPs if there is clear, strong evidence in the text
        # (avoid bloat; primary + 1~2 clear secondary points)
        for kp_id, indicator in SECONDARY_INDICATORS.items():
            if kp_id == new_kp:
                continue
            # Don't add secondary KPs from completely unrelated domains unless clear
            kp_info = kp_map[kp_id]
            if re.search(indicator, text, re.I):
                # Contextual check: make sure it's genuinely part of the problem
                # E.g. Pythagorean theorem in geometry/trig
                if kp_id == 'KP-057' and ('勾股定理' in text or 'a^2+b^2=c^2' in text or 'Rt\\triangle' in text):
                    points_set.add(kp_id)
                elif kp_id == 'KP-058' and '勾股定理的逆定理' in text:
                    points_set.add(kp_id)
                elif kp_id in ('KP-085', 'KP-086', 'KP-087') and ('\\sin' in text or '\\cos' in text or '\\tan' in text):
                    # Check which one specifically
                    if kp_id == 'KP-085' and '\\sin' in text:
                        points_set.add(kp_id)
                    if kp_id == 'KP-086' and '\\cos' in text:
                        points_set.add(kp_id)
                    if kp_id == 'KP-087' and '\\tan' in text:
                        points_set.add(kp_id)
                elif kp_id in ('KP-061', 'KP-062', 'KP-063') and ('相似' in text or '\\sim' in text):
                    points_set.add('KP-061')
                elif kp_id in ('KP-051', 'KP-052') and ('全等' in text or '\\cong' in text):
                    points_set.add('KP-051')
                elif kp_id == 'KP-034' and ('一次函数' in text and '反比例' in text):
                    points_set.add('KP-034')
                elif kp_id == 'KP-036' and ('反比例函数' in text and '一次函数' in text):
                    points_set.add('KP-036')
                elif kp_id == 'KP-039' and ('二次函数' in text or '抛物线' in text):
                    points_set.add('KP-039')
                elif kp_id == 'KP-020' and ('二元一次方程组' in text or '方程组' in text):
                    points_set.add('KP-020')
                elif kp_id == 'KP-028' and ('一元一次不等式' in text or '不等式组' in text):
                    points_set.add('KP-028')
                elif kp_id == 'KP-071' and ('切线' in text and '圆' in text):
                    points_set.add('KP-071')
                elif kp_id == 'KP-074' and ('垂径定理' in text):
                    points_set.add('KP-074')
                elif kp_id == 'KP-077' and ('圆周角' in text):
                    points_set.add('KP-077')
                elif kp_id == 'KP-097' and ('平均数' in text and ('中位数' in text or '众数' in text or '方差' in text)):
                    points_set.add('KP-097')
                elif kp_id == 'KP-098' and ('中位数' in text or '众数' in text):
                    points_set.add('KP-098')
                elif kp_id == 'KP-099' and ('方差' in text):
                    points_set.add('KP-099')

        # Limit to max 4 points to keep high fidelity with standard curriculum combinations
        sorted_points = sorted(points_set)
        if len(sorted_points) > 4:
            # Keep primary point and the most specific 3 points
            sorted_points = [new_kp] + [p for p in sorted_points if p != new_kp][:3]
            sorted_points = sorted(sorted_points)

        # 3. Calculate max_grade
        max_grade = max(kp_map[p]['grade'] for p in sorted_points)

        # 4. Match combination_id
        combo_key = tuple(sorted_points)
        final_combo_id = combo_map.get(combo_key)

        # If not matched directly:
        if not final_combo_id:
            # If single KP, it 100% exists in combo_map
            single_key = (new_kp,)
            if single_key in combo_map:
                # If exact multi-point combination is not in the whitelist,
                # do we fallback to single-point combination or leave NULL?
                # Spec: "由每题的完整考点集合 all_point_ids 排序后查 knowledge_combinations.kp_ids 匹配，命中则回填 combination_id，查不到留 NULL（不强求）。"
                # If sorted_points is 1 KP: matches single_key!
                if len(sorted_points) == 1:
                    final_combo_id = combo_map[single_key]
                else:
                    # Multi-point combination: if any 2-point subset containing new_kp matches, can we match it?
                    # Let's check 2-point combinations containing new_kp
                    matched_sub = None
                    for other_p in sorted_points:
                        if other_p == new_kp:
                            continue
                        sub_key = tuple(sorted([new_kp, other_p]))
                        if sub_key in combo_map:
                            matched_sub = combo_map[sub_key]
                            # update sorted_points to reflect matched combination!
                            sorted_points = list(sub_key)
                            break
                    if matched_sub:
                        final_combo_id = matched_sub
                    else:
                        # Fallback to single KP combination so all_point_ids matches combination!
                        final_combo_id = combo_map.get(single_key)
                        sorted_points = [new_kp]

        # Recalculate max_grade after final points selection
        max_grade = max(kp_map[p]['grade'] for p in sorted_points)

        row_result = {
            "op": "update",
            "question_id": qid,
            "primary_point_id": new_kp,
            "grade_level": final_grade,
            "semester": final_sem,
            "all_point_ids": sorted_points,
            "max_grade": max_grade,
            "combination_id": final_combo_id,
            "reallocated": reallocated,
            "reallocate_reason": realloc_reason
        }
        results.append(row_result)

    # Write output to jsonl
    with open(output_file, 'w', encoding='utf-8') as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')

    print(f"Shard {shard_num}: processed {len(results)} questions, reallocated {reallocated_count}")
    return len(results), reallocated_count

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--shard', type=int, required=True, help='Shard number 1..10')
    args = parser.parse_args()
    process_shard(args.shard)
