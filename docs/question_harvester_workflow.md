# 智能题库采集打标引擎工作流 (Final v2.0)

## 1. 架构核心思想 (Dual-Engine Architecture)

本系统采用 **"脑机分离"** 架构，严格划分职责边界：

| 角色 | 负责内容 |
|------|---------|
| **大模型 (LLM Brain)** | 解题辨伪、视觉读图、多解法拆解、认知特征打分、双语输出 |
| **本地脚本 (Local Muscle)** | Word 解析、图文分离、字典查表、客观算分、SQLite 入库 |

---

## 2. 数据流转图 (Data Flow)

```
你输入: 无忧考网链接
     ↓
[节点1] 本地脚本
  下载 .docx → Pandoc 转 Markdown（图片锚定）→ 按题号切分为题目数组
     ↓
[节点2] 大模型（多模态）
  接收题目文本 + 图片文件 + 107个考点字典
  → 解题验证 → 输出初版双语 JSON
     ↓
[节点3] 本地脚本
  查表匹配 Combination_ID → 双引擎计算 L 级难度
     ↓
[节点4] 本地脚本
  写入 SQLite → 输出运行报告
```

---

## 3. 数据存储规范 (Schema)

### 3.1 存储介质
- **数据库**：SQLite（原生支持 JSON1 扩展）
- **静态图片**：独立文件夹 `assets/images/`，按题号命名（如 `Q-2026-001-fig1.png`）

### 3.2 规范约定
- **图文分离**：图片只存相对路径，嵌入题干文本中（如 `![图1](assets/images/Q-001-fig1.png)`）
- **数学公式**：全部使用 `$$` 包裹的标准 LaTeX（如 `$$\frac{1}{2}$$`）
- **多语言**：入库时同步输出 `zh`（简体中文）和 `en`（英文），`available_locales` 记录已完成的语言列表，未来可随时用批量脚本扩展 `zh-TW`、`ja` 等

### 3.3 标准 JSON 落表结构

```json
{
  "question_id": "Q-2026-YN2022-009",      // 脚本生成：系统唯一主键
  "source": "2022年云南省中考数学真题 第9题", // 继承自节点1的文件名+题号

  "primary_locale": "zh",                   // 主语言（数据来源永远是简中）
  "available_locales": ["zh", "en"],        // 已翻译完成的语言列表（可随时扩展）

  "question_type": "解答题",                // 枚举：选择题 | 填空题 | 解答题
  "combination_id": "C3-0112",             // 脚本查表得出
  "difficulty_level": "L5",               // 脚本双引擎计算：MAX(所有子题 part_difficulty)

  "content": {
    "zh": "如图，已知 $$AB$$ 是 $$\\odot O$$ 的直径，...\n![几何图](assets/images/Q-001-fig1.png)",
    "en": "As shown, $$AB$$ is the diameter of $$\\odot O$$, ..."
  },

  "options": {                              // 仅选择题有值，其余为空对象
    "zh": { "A": "$$3$$", "B": "$$4$$", "C": "$$5$$", "D": "$$6$$" },
    "en": { "A": "$$3$$", "B": "$$4$$", "C": "$$5$$", "D": "$$6$$" }
  },

  "answer": {
    "zh": "$$\\frac{12}{13}$$",
    "en": "$$\\frac{12}{13}$$"
  },

  "solutions": [
    {
      "part": "(1)",                        // 子题标识；单题留空字符串 ""
      "part_difficulty": "L3",             // 子题独立难度；整题 difficulty_level = MAX 值
      "method_name": {
        "zh": "法一：垂径定理与勾股定理综合",
        "en": "Method 1: Perpendicular Chord Theorem + Pythagorean Theorem"
      },
      "used_kps": [
        { "id": "KP071", "name": "垂径定理" },
        { "id": "KP057", "name": "勾股定理" },
        { "id": "KP081", "name": "锐角三角函数" }
      ],
      "cognitive_metrics": {               // 大模型对主解法的认知深度打分（1-5）
        "insight_required": 3,             // 洞察力：1=直接套公式，5=奥数级巧妙构造
        "hidden_conditions": 2,            // 隐蔽度：1=条件全给，5=极度隐蔽
        "calc_complexity": 2              // 计算量：1=口算，5=地狱级化简
      },
      "steps": {
        "zh": [
          "1. 由垂径定理得 $$CE = \\frac{1}{2}CD = 12$$",
          "2. 半径 $$OC = \\frac{1}{2}AB = 13$$",
          "3. 在 $$\\text{Rt}\\triangle OCE$$ 中，$$OE = \\sqrt{13^2 - 12^2} = 5$$",
          "4. 因此 $$\\cos\\angle OCE = \\frac{CE}{OC} = \\frac{12}{13}$$"
        ],
        "en": [
          "1. By the Perpendicular Chord Theorem, $$CE = \\frac{1}{2}CD = 12$$",
          "2. Radius $$OC = \\frac{1}{2}AB = 13$$",
          "3. In $$\\text{Rt}\\triangle OCE$$, $$OE = \\sqrt{13^2 - 12^2} = 5$$",
          "4. Therefore $$\\cos\\angle OCE = \\frac{CE}{OC} = \\frac{12}{13}$$"
        ]
      }
    }
  ]
}
```

---

## 4. 节点详情 (Node Specifications)

### 节点 1：数据获取与图文分离 (Pandoc Crawler)
针对"无忧考网"等网站的 Word 原文件：

1. 本地下载 `.docx` 原文件。
2. **防图片错位**：调用 `Pandoc` 将 Word 转为 Markdown，图片自动解压到 `assets/images/` 并以 `![图](路径)` 形式锚定在对应题目文字旁。
3. **试卷切分**：按大题号（"一、选择题"）和小题号（"1."）进行二级切分，识别子题 `(1)(2)(3)` 并归属至同一题。给每题附加 `source`（文件名 + 题号）标签。
4. **异常处理**：若遇到极端混乱排版导致图片数量与"如图"出现次数不匹配，**直接抛弃该题**，`discard_count += 1`，不降级处理。
5. 将切分好的题目数组推入节点 2。

### 节点 2：大模型多模态打标器 (LLM Validator & Tagger)

将题目文本（必要时连同图片文件一并发送）输入大模型，注入以下系统提示：

> **【系统指令】**
> 你是顶级理科教研专家，请解析题目并输出严格的 JSON，要求如下：
>
> 1. **有效性验证**：尝试完整解题。若条件缺失、逻辑矛盾或无解，输出 `{"is_valid": false}`，停止后续步骤。
>
> 2. **题型识别**：`question_type` 只能是以下三种之一：`选择题` | `填空题` | `解答题`。
>
> 3. **三段拆分**：
>    - 将题干放入 `content`，选择题选项从题干中彻底剥离放入 `options`。
>    - 最终答案单独放入 `answer`。
>    - 所有数学公式必须用 `$$` 包裹。
>
> 4. **子题处理**：若题目含 (1)(2)(3) 等子题，每个子题作为 `solutions` 数组中的独立对象，填写各自的 `part` 字段。
>
> 5. **多解法提取**：若同一子题存在多种解法，均列出，每种解法从《107个考点字典》中提取 `used_kps`（只取必不可少的核心考点）。
>
> 6. **认知打分 (cognitive_metrics)**：针对每个子题的主解法，评估（1-5分）：
>    - `insight_required`：洞察力要求（1=直接套公式，5=奥数级非标构造）
>    - `hidden_conditions`：条件隐蔽度（1=全部明给，5=极度隐蔽需挖掘）
>    - `calc_complexity`：计算复杂度（1=口算，5=超高强度化简）
>
> 7. **双语输出**：所有文本字段（`content`、`options`、`answer`、`method_name`、`steps`）同时输出 `zh`（简体中文）和 `en`（英文）两个版本。
>
> 8. **输出格式**：仅输出纯 JSON，不含任何 Markdown 代码块标记或解释文字。

### 节点 3：本地查表与双引擎定级 (Local Scoring Engine)

Python 脚本接收大模型 JSON，执行以下确定性计算：

**步骤 3.1：有效性拦截**
- 若 `is_valid: false`，立即抛弃，`invalid_discard_count += 1`，停止处理。

**步骤 3.2：查表匹配 Combination ID**
- 提取所有子题的 `used_kps` 合集，排序后去本地 `基础考点组合全集.json` 精确匹配。
- 若知识点超出 107 个预设范围或组合不存在，**直接抛弃**，`bounds_discard_count += 1`。

**步骤 3.3：双引擎 L 级算法（逐子题计算，取 MAX）**

*结构广度分（满分 10 分）：*

| 知识点数量 | 得分 |
|-----------|------|
| 1 个 | 1 分 |
| 2 个 | 3 分 |
| 3 个 | 5 分 |
| ≥4 个 | 7 分 |

| 跨度 | 加分 |
|------|------|
| 同一子类（如都在"三角形"内）| +0 |
| 跨子类（如"三角形"到"四边形"）| +1 |
| 跨领域（如"代数"到"几何"）| +2 |

*认知深度分（满分 15 分）：*
```
cognitive_score = (insight_required × 1.5) + (hidden_conditions × 1.0) + (calc_complexity × 0.5)
```

*总分定级：*
```
total = structure_score + cognitive_score
L级 = 按总分映射（最低 L1，最高 L9）
```

| 总分 | L 级 |
|------|------|
| <4 | L1 |
| 4-6 | L2 |
| 7-9 | L3 |
| 10-12 | L4 |
| 13-15 | L5 |
| 16-17 | L6 |
| 18-19 | L7 |
| 20-21 | L8 |
| ≥22 | L9 |

*整题难度 = `MAX(所有子题 part_difficulty)`，写入根字段 `difficulty_level`。*

### 节点 4：入库与运行报告 (SQLite Writer & Reporter)

1. 生成唯一 `question_id`（格式：`Q-年份-来源缩写-序号`）。
2. 将完整 JSON 写入 SQLite `questions` 表。
3. 每批次处理完毕后输出**运行报告**，包含：

```
===== 运行报告 =====
本批处理题目总数：100
成功入库：        87
抛弃（无效题）：   8   invalid_discard_count
抛弃（知识点越界）: 5   bounds_discard_count
入库成功率：       87%
====================
```

---

## 5. 并发与限流说明 (Rate Limiting)

- 默认并发数：**5 个并发请求**（可根据 API 配额调整）。
- 触发 `429 Rate Limit` 时：自动等待 60 秒后重试，最多重试 3 次。
- 超过重试次数仍失败：跳过该题，记入 `error_log`，不计入抛弃统计。

---

## 6. 未来语言扩展说明

当前初期版本：`available_locales: ["zh", "en"]`。

未来如需添加繁体中文（`zh-TW`）或日语（`ja`），只需：
1. 运行批量翻译脚本，每批 20 条，扫描数据库中缺少目标语言的记录。
2. 调用小模型翻译（采用"占位符法"保护公式不被破坏）。
3. 写回新语言键，并将语言代码追加至 `available_locales`。
4. **无需修改任何 Schema 或前端代码。**
