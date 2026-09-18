---
name: skill-genbasicinfo
description: >-
  当用户输入"年级"和"学科"时，自动执行以下完整流程：
  1) 联网查询中国全国主流教材，提取大纲考点级知识点（去重）；
  2) 用LLM严格二值判断每对知识点的直接数学/科学关联；
  3) 枚举所有完全连通组合（Clique）；
  4) 验证有向关系能否生成合法题目；
  5) 输出 JSON 基础数据。
  适用学段：小学、初中、高中。适用学科：所有理科（数/物/化/生/科学）。
---

# skill-genbasicinfo：理科知识点组合基础数据生成

## 输入格式

```
年级：[小学一年级 ~ 高中三年级 | 小学 | 初中 | 高中]
学科：[数学 | 物理 | 化学 | 生物 | 科学]
```

---

## 执行流程（每次收到输入后严格按此顺序执行）

### Step 1：联网提取知识点

**搜索策略**（依次执行以下查询）：

```
查询1: "{学段} {学科} 知识点 人教版 大纲考点 完整列表"
查询2: "{学段} {学科} 知识点 北师大版 考点清单"
查询3: "{学段} {学科} 中考/高考/期末 考点 全国通用"
查询4: "{年级} {学科} 课程标准 2022 内容要求"
```

**去重规则**：
- 不同版本同一考点 → 保留一条，来源字段记录所有版本
- 颗粒度统一到**大纲考点级**：以"一个独立可考查的数学/科学概念、定理或方法"为单位
- 不拆分到公式级，不合并到章节级

**输出结构**（knowledge_points 列表）：
```json
{
  "id": "KP001",
  "name": "知识点名称",
  "domain": "一级领域",
  "subcategory": "二级小类",
  "grade": "适用年级",
  "is_mandatory": true,
  "sources": ["人教版", "北师大版"]
}
```

---

### Step 2：LLM 关联分析（严格二值）

**核心原则**：只建立"自然关联"的边。勉强的、需要刻意构造情境的，不建边。

**高效批量判断策略**（避免 N² 调用）：

对每个知识点 KP_X，执行一次 LLM 查询：

```
Prompt 模板（对每个 KP_X）：

给定知识点："{KP_X.name}"（{KP_X.domain} · {KP_X.subcategory}）

从以下知识点列表中，选出所有能与"{KP_X.name}"
**自然地出现在同一道考题中**的知识点。

判断标准：
✅ 选择：两个知识点在同一道题里同时用到，不需要刻意构造情境
❌ 不选：技术上有关联，但需要人为强行拼接才能出题

知识点列表：
{列出其他所有KP的编号和名称}

只返回JSON数组，格式：["KP002", "KP015", ...]
```

**去重**：(KP_A → KP_B) 和 (KP_B → KP_A) 是同一条边，只计一次。

**输出结构**（edges 列表）：
```json
{"from": "KP001", "to": "KP002", "direction": "bidirectional"}
```

---

### Step 3：运行枚举脚本

将 Step 1 和 Step 2 的结果整合为 config.json，格式：

```json
{
  "grade": "初中",
  "subject": "数学",
  "sources": ["人教版", "北师大版", "苏科版"],
  "knowledge_points": [...],
  "edges": [...],
  "directed_validation": []
}
```

执行脚本：
```bash
python3 ~/.gemini/config/skills/skill-genbasicinfo/scripts/enumerate.py \
  config.json result.json
```

---

### Step 4：有向验证（批量）

对每个 size >= 2 的组合，判断是否存在合法题目：

```
Prompt 模板（批量，每次处理20个组合）：

对以下每个知识点组合，判断：
是否存在一道考题，使学生需要**同时、直接**运用组合内所有知识点？

如果是，给出：
- is_valid: true
- directed_order: 知识点的合理运用顺序（数组）
- question_hint: 出题思路（15字以内）

如果否（组合凑不出自然题目）：
- is_valid: false

组合列表：
1. [KP001, KP014, KP021] → 有理数的四则运算 + 因式分解 + 一元二次方程
2. ...

返回JSON数组。
```

将验证结果填入 config.json 的 `directed_validation` 字段后，重新运行脚本。

---

### Step 5：输出最终 JSON

最终 result.json 结构：

```json
{
  "meta": {
    "grade": "初中",
    "subject": "数学",
    "generated_at": "ISO时间戳",
    "sources": ["人教版", "北师大版", "苏科版"],
    "total_kp": 107,
    "total_edges": 493,
    "total_combinations": 2205,
    "distribution": {"1": 107, "2": 493, "3": 707, "4": 525, "5": 260}
  },
  "knowledge_points": [
    {
      "id": "KP001",
      "name": "有理数的概念与分类",
      "domain": "数与代数",
      "subcategory": "实数",
      "grade": "七年级上",
      "is_mandatory": true,
      "sources": ["人教版", "北师大版"]
    }
  ],
  "edges": [
    {"from": "KP001", "to": "KP002", "direction": "bidirectional"}
  ],
  "combinations": [
    {
      "id": "C3-0042",
      "size": 3,
      "kp_ids": ["KP001", "KP014", "KP021"],
      "scope": "跨类",
      "quality_score": 2,
      "is_question_valid": true,
      "directed_order": ["KP001", "KP014", "KP021"],
      "question_hint": "整式化简后解方程"
    }
  ]
}
```

**quality_score 说明**：
- `3` = 同小类（基础题骨架）
- `2` = 同领域跨类（综合题骨架）
- `1` = 跨领域（压轴题骨架）
- `null` = 单考点

---

## 质量检查

执行完毕后，验证以下指标是否合理：

| 指标 | 预期范围 | 异常说明 |
|-----|---------|---------|
| 考点总数 | 小学50-80 / 初中80-130 / 高中120-200 | 过少可能漏查版本 |
| 有效边数 / 考点数 | 3~8 倍 | 过低说明关联太严格 |
| k=3 组合数 > k=2 组合数 | 正常（聚类效应） | - |
| is_question_valid=true 比例 | > 60% | 过低说明组合质量有问题 |

---

## 支持的学段 × 学科矩阵

| 学段 | 数学 | 物理 | 化学 | 生物 | 科学 |
|-----|:---:|:---:|:---:|:---:|:---:|
| 小学 | ✅ | - | - | - | ✅ |
| 初中 | ✅ | ✅ | ✅ | ✅ | - |
| 高中 | ✅ | ✅ | ✅ | ✅ | - |

---

## 参考脚本

- 枚举引擎：[enumerate.py](./scripts/enumerate.py)
