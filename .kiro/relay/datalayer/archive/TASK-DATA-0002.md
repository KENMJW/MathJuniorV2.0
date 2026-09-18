---
id: TASK-DATA-0002
line: datalayer
status: accepted
attempt: 1

created_by: Kiro
title: questions.db 2178道题第二阶段补全（答案+解析+翻译+rubric+选项英文，并发5片算·串行写）
model: default
concurrency: 5
---

# 任务：真题第二阶段内容补全（答案 / 解析 / 翻译 / rubric）

## 1. 目标
对 `data/questions.db` 全部 **2178 道 done 题**，补全第一阶段未做的字段：
1. `answer_standard`：缺失的标准答案（1194 道，选择361/填空584/解答249）
2. `solutions_json`：缺失的解题解析（1191 道）
3. `stem_en`：英文翻译（2111 道，数学公式不译只译文字）
4. `options_json` 的 `en`：选择题选项英文（90 道缺）
5. `rubric_checklist_json`：解答题评分点（仅 solution 题需要，约 369 道）

> 已有真实值的字段（第一阶段填的 primary_point_id/difficulty_level、原本就有的 answer/solution）**不覆盖、不重算**，只补空的。

## 2. 上下文
- 库：`data/questions.db`，2178 道全 done，字段已有真实考点+难度
- 判空口径：字段值为 NULL / '' / '__PENDING__' 视为缺失需补；否则保留原值
- 数学门神：`sanitize_and_verify_math()`（复用已验证实现），所有含 LaTeX 的写入内容必过门神
- options_json 结构：`{"A":{"zh":"...","en":"..."},...}`，补 en 时保留 zh 不动

## 3. 🚨 并发安全架构（硬约束，与 TASK-DATA-0001 同）
**严禁 5 实例并发写 SQLite。** 并发只用于只读+生成，写库单进程串行：
```
阶段1（并发5片，只读）：按 question_id 升序五等分 → 各片只 SELECT 读题 → 生成内容 → 各写 tmp/backfill2/partN.jsonl
阶段2（单进程串行）：合并 part1..5 → 逐条 UPDATE → commit
```
- 每片 jsonl 每行：
  `{"qid":"...","answer_standard":"...(缺才填,否则null)","solutions_json":[{"method":"解法一","text":"..."}],"stem_en":"...","options_en":{"A":"...",...}(选择题缺才填),"rubric_checklist_json":[...](解答题),"answer_confidence":"high|low","low_reason":"..."}`
  （solutions_json 支持多解，见 §4.2；有多种解法就多个对象，单解一个对象）
- 写库映射：只 UPDATE 该题原本为空的字段；non-null 原值一律不动
- 写库前必须 `cp data/questions.db data/questions.db.bak_before_task0002`

## 4. 生成规则
### 4.1 答案 answer_standard（数学正确性是硬要求）
- 选择题：给正确选项字母（A/B/C/D）
- 填空题：给最简标准答案（LaTeX 规范）
- 解答题：给最终结论/关键答案
- **多法验证**：每题答案要经"至少一种验证"（代入原题检验 / 换解法互验 / 特殊值验证）确认后再填
- **不确定必标记**：凡自己无法确信答案正确的题，`answer_confidence="low"` + `low_reason`，答案仍填但明确标出，交 Kiro/用户复核。**严禁瞎猜一个答案却标 high。**

### 4.2 解析 solutions_json（支持一题多解，不强求）
- 结构：`[{"method":"解法一","text":"解题过程..."},{"method":"解法二","text":"..."}]`
  - **单一解法的题**：只给一条，`method` 写"解法"或留简单标签即可，**不硬凑多解**（如"-2的相反数"这类只有一种解法的基础题）
  - **确实有多种自然解法的题**（如几何题可代数法/几何法、方程可配方/公式法/因式分解）：**能多解就都列出**，每种一个对象，标清 method 名
  - 判断原则：解法多样是题目本身性质决定的，有就列、没有不造。宁缺毋滥，不为凑数写牵强的"另解"
- 每条 text 讲清思路和关键步骤，不是只给答案
- 公式过门神

### 4.3 翻译 stem_en / 选项 en
- 只译中文文字，**数学公式/LaTeX 原样保留不译**（`$...$` 内不动）
- `[[IMG:n]]` 图锚点原样保留
- 术语用标准数学英语（如 等腰三角形=isosceles triangle）

### 4.4 rubric_checklist_json（仅解答题）
- 结构 `[{"stepIndex":1,"descriptionZh":"...","descriptionEn":"...","points":N}]`
- 按解答步骤拆分值，各步分值之和 = 该题 score_default

## 5. 红线 / 禁止事项
- **禁止修改 stem_zh 题面**（一个字不改）
- **禁止覆盖已有真实值**：只填空字段，原本有值的 answer/solution/options.zh 不动
- **禁止 DELETE 任何题**
- **禁止编造答案标 high**：算不准就标 low_confidence，不许蒙一个答案冒充确定
- **禁止翻译数学公式**（$...$ 内容原样保留）
- 禁止 5 实例并发写库（写库单进程串行）
- 公式含 LaTeX 的写入过数学门神
- 写库前备份 `data/questions.db.bak_before_task0002`

## 6. 验收清单（可量化，Kiro 据此验收）
- [ ] 备份 `data/questions.db.bak_before_task0002` 存在
- [ ] stem_zh 零改动（Kiro 比对备份，逐题）
- [ ] 无 DELETE（题总数处理前后一致 = 2178）
- [ ] stem_en 无 '__PENDING__' 残留（全部译完或如实标注）
- [ ] answer_standard 无 '__PENDING__'/空 残留（全部填完）
- [ ] 原有真实值未被覆盖（抽验：第一阶段 answer 已有值的题，值不变）
- [ ] answer_confidence=low 的题有清单 + low_reason（供复核）
- [ ] 翻译未动公式：抽验 stem_en 里 $...$ 与 stem_zh 的 $...$ 一致
- [ ] rubric 各步分值之和 = score_default（解答题抽验）
- [ ] solutions_json 结构合法（每条含 method+text；有多解的题列了多条，抽验多解正确性）
- [ ] 中间产物 part*.jsonl 保留
- [ ] 报告：各字段补全数 / 含多解的题数 / low_confidence 数及清单 / 抽样佐证

## 7. 回写要求
1. 结果写 `outbox/RESULT-DATA-0002.md`：逐条验收清单量化自检 + 补全统计 + low_confidence 清单 + 抽样佐证
2. 保留 `tmp/backfill2/part*.jsonl`
3. 任务书 `status` 改 `done`
4. 回 `inbox/NEXT.md` 遵守轮询协议
5. 明确播报"TASK-DATA-0002 完成"

## 8. 轮询协议（固定，勿改）
- 完成 → 读 `.kiro/relay/datalayer/inbox/NEXT.md`
- 任务号 → 开工；`IDLE` → 3分钟/次上限20次；`WAIT-USER` → 停
