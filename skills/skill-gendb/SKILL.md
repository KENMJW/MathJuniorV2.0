---
name: skill-gendb
description: >-
  当用户提供"题目来源网页链接"或"本地 Word/PDF 文件路径"时，自动执行以下完整流程：
  1) 下载并解析原文件，Pandoc 防错位提取图文；
  2) 按题号切分为独立题目数组；
  3) 调用多模态大模型验证真伪、拆解多解法、提取知识点、双语输出；
  4) 本地脚本查表匹配 Combination_ID，双引擎计算 L1-L9 难度；
  5) 写入 SQLite 题库，输出运行报告。
  适用学段：小学、初中、高中。适用科目：所有理科。
---

# skill-gendb：智能题库采集打标引擎

## 输入格式

```
来源：[无忧考网等题库网站的 .docx 下载链接 | 本地文件路径]
年级：[小学 | 初中 | 高中]
学科：[数学 | 物理 | 化学 | 生物]
知识点库：[对应学科的基础数据文件路径，由 skill-genbasicinfo 生成]
数据库路径：[SQLite 文件路径，如 ~/question_bank.db]
```

示例：
```
来源：https://www.51test.net/show/10846792.html
年级：初中
学科：数学
知识点库：~/初中数学_知识点组合.json
数据库路径：~/question_bank.db
```

---

## 前置依赖

在运行本 skill 前，确保以下工具已安装：

```bash
# 安装 Pandoc（用于 Word 转 Markdown）
brew install pandoc

# 安装 Python 依赖
pip3 install requests mammoth sqlite-utils
```

同时确保对应学科的知识点库 JSON（由 `skill-genbasicinfo` 生成）已存在，并在输入参数中指定路径。

---

## 执行流程（严格按节点顺序执行）

### 节点 1：数据获取与图文分离 (Pandoc Crawler)

**步骤 1.1：下载原文件**
- 若输入为网页链接：使用 Python `requests` 库，携带浏览器 User-Agent，从页面中解析 `.docx` 下载链接并下载到本地临时目录。
- 若输入为本地路径：直接读取文件。

**步骤 1.2：防图片错位转换**
```bash
pandoc input.docx \
  --extract-media=assets/images \
  -t markdown \
  -o output.md
```
执行后：
- 题目文字变为标准 Markdown 文本
- 所有图片被解压到 `assets/images/`，并以 `![图](assets/images/xxx.png)` 形式**原位锚定**在对应题目文字中
- 图片与题目的对应关系由此被物理绑定，后续切分绝不错位

**步骤 1.3：试卷切分**
按以下二级规则切分 Markdown 文本：
- **一级切分**：识别大题块（"一、选择题"、"二、填空题"、"三、解答题"）
- **二级切分**：识别小题号（`1.`、`2.`、`（1）`）
- 多子题（如"第22题(1)(2)(3)"）整体作为一条记录，不拆分
- 每题附加元数据 `source`（格式：`文件名 第X题`）

**异常处理**：
- 若图片数量与"如图"关键词出现次数严重不匹配（差值 > 2），**直接抛弃该题**，`discard_count += 1`，不降级处理。

---

### 节点 2：大模型多模态打标器 (LLM Validator & Tagger)

将每道题的文本块（若含图片路径则同时上传图片文件）发送给顶级多模态大模型，使用以下系统提示：

```
【系统指令】
你是顶级理科教研专家，请解析输入的试题并严格输出 JSON。

规则：

1. 有效性验证
   尝试完整解题。若发现以下任一情况，输出 {"is_valid": false} 并停止：
   - 题目条件缺失（如图形尺寸未给出）
   - 题目逻辑自相矛盾
   - 题目无解或条件多余无法确定唯一答案

2. 题型识别
   question_type 只能是以下三种之一（严格枚举）：
   选择题 | 填空题 | 解答题

3. 三段拆分
   - content：题干核心描述（若为选择题，选项必须从题干中彻底剥离）
   - options：仅选择题填写 A/B/C/D 的内容，其余题型为空对象 {}
   - answer：最终答案（选择题填选项字母，其余填具体结果）
   - 所有数学公式必须使用 $$ 包裹

4. 子题处理
   若题目含 (1)(2)(3) 等子题，每个子题在 solutions 数组中作为独立对象，
   填写各自的 part 字段（如 "(1)"、"(2)"）。

5. 多解法提取
   对每个子题，列出所有常规解法。从提供的《知识点字典》中，
   只提取该解法"必不可少"的核心考点到 used_kps。

6. 认知打分 cognitive_metrics（针对每个子题的主解法，1-5分）
   - insight_required：洞察力（1=直接套公式，5=奥数级非标构造技巧）
   - hidden_conditions：隐蔽度（1=条件全部明给，5=条件极度隐蔽需挖掘）
   - calc_complexity：计算量（1=口算，5=超高强度代数化简）

7. 双语输出
   content、options、answer、method_name、steps
   全部同时输出 zh（简体中文）和 en（英文）两个版本。
   数学公式保持原样，不翻译。

8. 输出格式
   仅输出纯 JSON，不含任何 Markdown 代码块标记或额外解释文字。
```

**大模型输出的初版 JSON 结构**：
```json
{
  "is_valid": true,
  "question_type": "解答题",
  "content": {
    "zh": "题干（含图片路径和LaTeX公式）",
    "en": "Question stem..."
  },
  "options": { "zh": {}, "en": {} },
  "answer": { "zh": "$$\\frac{12}{13}$$", "en": "$$\\frac{12}{13}$$" },
  "solutions": [
    {
      "part": "(1)",
      "method_name": { "zh": "法一：垂径定理与勾股定理", "en": "Method 1: ..." },
      "used_kps": [
        { "id": "KP071", "name": "垂径定理" },
        { "id": "KP057", "name": "勾股定理" }
      ],
      "cognitive_metrics": {
        "insight_required": 3,
        "hidden_conditions": 2,
        "calc_complexity": 2
      },
      "steps": {
        "zh": ["1. 步骤一...", "2. 步骤二..."],
        "en": ["1. Step one...", "2. Step two..."]
      }
    }
  ]
}
```

---

### 节点 3：本地查表与双引擎定级 (Local Scoring Engine)

Python 脚本接管大模型 JSON，执行以下 100% 确定性计算：

**步骤 3.1：有效性拦截**
```python
if not data["is_valid"]:
    invalid_discard_count += 1
    continue  # 直接丢弃，进入下一题
```

**步骤 3.2：查表匹配 Combination ID**
```python
# 取主解法（第一个 solution）的知识点
primary_kps = sorted([kp["id"] for kp in data["solutions"][0]["used_kps"]])

# 在本地知识点组合全集中查找
combo = find_in_local_json(primary_kps, kp_combination_db)

if combo is None:
    bounds_discard_count += 1
    continue  # 知识点越界，直接丢弃

data["combination_id"] = combo["id"]
```

**步骤 3.3：双引擎 L 级算法（逐子题计算，取 MAX）**

*结构广度分（满分 10 分）：*

| 知识点数量 | 得分 |
|-----------|------|
| 1 个 | 1 分 |
| 2 个 | 3 分 |
| 3 个 | 5 分 |
| ≥4 个 | 7 分 |

| 组合跨度（来自知识点库的 scope 字段）| 加分 |
|------|------|
| 同一子类 | +0 |
| 跨子类（同领域）| +1 |
| 跨领域 | +2 |

*认知深度分（满分 15 分）：*
```python
cognitive_score = (
    insight_required * 1.5 +
    hidden_conditions * 1.0 +
    calc_complexity * 0.5
)
```

*总分映射 L 级：*

| 总分 | L 级 |
|------|------|
| < 4 | L1 |
| 4 – 6 | L2 |
| 7 – 9 | L3 |
| 10 – 12 | L4 |
| 13 – 15 | L5 |
| 16 – 17 | L6 |
| 18 – 19 | L7 |
| 20 – 21 | L8 |
| ≥ 22 | L9 |

```python
# 整题难度 = 所有子题 part_difficulty 的最大值
data["difficulty_level"] = max(part_difficulties)
```

---

### 节点 4：SQLite 入库与运行报告 (DB Writer & Reporter)

**步骤 4.1：生成 question_id**
```python
question_id = f"Q-{year}-{source_abbr}-{seq:04d}"
# 示例：Q-2022-YN-0009
```

**步骤 4.2：补全根字段并落库**
```python
data["question_id"] = question_id
data["source"] = source_label           # 如 "2022年云南省中考数学真题 第9题"
data["primary_locale"] = "zh"
data["available_locales"] = ["zh", "en"]

db.execute("INSERT INTO questions VALUES (?)", [json.dumps(data)])
success_count += 1
```

**步骤 4.3：输出运行报告**

每批次全部处理完毕后，打印以下报告：

```
===== skill-gendb 运行报告 =====
来源文件：  2022年云南省中考数学真题.docx
处理总题数：25
成功入库：  21
抛弃（无效题）：   2   [invalid_discard_count]
抛弃（知识点越界）: 2   [bounds_discard_count]
入库成功率：84%
================================
```

---

## 数据库表结构参考 (SQLite)

首次运行前，执行以下 SQL 创建表：

```sql
CREATE TABLE IF NOT EXISTS questions (
    question_id     TEXT PRIMARY KEY,
    source          TEXT,
    question_type   TEXT CHECK(question_type IN ('选择题','填空题','解答题')),
    combination_id  TEXT,
    difficulty_level TEXT,
    primary_locale  TEXT DEFAULT 'zh',
    available_locales TEXT,   -- JSON 数组，如 '["zh","en"]'
    content         TEXT,     -- JSON 对象
    options         TEXT,     -- JSON 对象
    answer          TEXT,     -- JSON 对象
    solutions       TEXT,     -- JSON 数组（含子题、多解法、steps）
    created_at      TEXT DEFAULT (datetime('now'))
);

-- 建立常用索引
CREATE INDEX IF NOT EXISTS idx_question_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_difficulty    ON questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_combination   ON questions(combination_id);
```

---

## 并发与限流

- 默认并发：**5 个并发请求**
- 触发 `429 Rate Limit`：自动等待 60 秒后重试，最多重试 3 次
- 超出重试次数：跳过该题，记入 `error_log.txt`，不计入抛弃统计

---

## 未来语言扩展

当前入库语言：`["zh", "en"]`

如需新增繁体中文（`zh-TW`）或日语（`ja`），运行批量翻译脚本：
1. 每批取 20 条缺少目标语言的记录
2. 用"占位符法"保护公式（提取 `$$...$$` → `[MATH_0]` → 翻译 → 还原）
3. 写回新语言键，并将语言代码追加至 `available_locales`
4. **无需修改任何 Schema 或前端代码**

---

## 参考文档

- 完整工作流设计书：[question_harvester_workflow.md](~/brain/65905f26-53f4-4886-bf37-910f7a41c08f/question_harvester_workflow.md)
- 知识点组合基础数据：由 `skill-genbasicinfo` 生成
