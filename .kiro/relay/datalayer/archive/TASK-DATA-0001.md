---
id: TASK-DATA-0001
line: datalayer
status: done
attempt: 1
created_by: Kiro
title: questions.db 2158道pending题回填考点+难度+可疑软标记（并发5片算·串行合并写）
model: default
concurrency: 5
---

# 任务：pending 真题回填「考点 + 难度 + 可疑软标记」（第一阶段）

## 1. 目标
对 `data/questions.db` 中 **2158 道 content_status='pending'** 的真题，逐题判定并回填**三件事**：
1. `primary_point_id`：真实考点归属（从 107 考点体系里选，替换占位 KP-000）
2. `difficulty_level`：真实难度 1~9（替换占位 1）
3. **可疑软标记**：题面本身错误/残缺、或**你无法给出正确答案**的题，标记为 `content_status='suspect'`（**不删除**，留待用户最终定夺）

> 本阶段**只做上述三件事**。stem_en 翻译、rubric、完整解析等留第二阶段（TASK-DATA-0002），且 suspect 题不进入第二阶段。

## 2. 上下文
- 库：`data/questions.db`，表 `questions`
- 考点体系权威来源：`data/core.db` 的 `knowledge_points` 表（107 个考点，字段 `point_id`(如 KP-001) + `name_zh`）。**primary_point_id 必须取自该表真实存在的 point_id**，严禁编造。
- 待判题特征：`stem_zh` 是真实中文题面（已清洗）；`options_json`/`answer_standard`/`solutions_json` 部分题已有真实值、部分为空或 `__PENDING__`
- 难度参考锚（已回填的 67 道 done 题）：L2 最多、L3~L6 少量，中考真题多在 L2~L6，压轴题/奥数题(qid 含 AX)偏 L6~L9
- 占位现状：所有 pending 题 primary_point_id='KP-000'、difficulty_level=1、grade_level=9、semester=1

## 3. 🚨 并发安全架构（硬约束，必须照做）
**严禁 5 个实例同时写 SQLite。** 并发只用于「只读 + LLM 判定」，写库单进程串行：

```
阶段1（并发 5 片，只读 questions.db）：
  按 question_id 升序排序后五等分：
    片1 → tmp/backfill/part1.jsonl
    片2 → tmp/backfill/part2.jsonl
    ... 片5 → part5.jsonl
  每片：只 SELECT 读题面/选项/答案 → 调模型判定 → 追加写自己那个 jsonl
  五片互不写库、各写各文件，零冲突。

阶段2（单进程串行，唯一写库）：
  读 part1..part5.jsonl 合并 → 逐条 UPDATE questions → commit
```

- 每片 jsonl 每行一个 JSON：
  `{"qid":"...","primary_point_id":"KP-0xx","difficulty_level":N,"verdict":"ok|suspect","suspect_reason":"...","answer_fill":"（原answer为空/__PENDING__时你给出的答案，否则留null）"}`
- **阶段2 写库映射**：
  - verdict=ok → `primary_point_id`、`difficulty_level` 更新为判定值；若原 answer_standard 为空/`__PENDING__` 且你能解答，则填 `answer_fill`；`content_status='done'`
  - verdict=suspect → `content_status='suspect'`，其余字段可不动（保留占位）
- 写库前必须 `cp data/questions.db data/questions.db.bak_before_task0001`

## 4. 判定规则
### 4.1 考点归属 primary_point_id
- 读 core.db 107 考点的 point_id + name_zh，理解每个考点覆盖范围
- 按题面数学内容选**最贴切的 1 个**考点填入；确实跨多考点时选最核心的那个
- 必须是 core.db 真实存在的 point_id，**不得填 KP-000、不得编造 ID**

### 4.2 难度 difficulty_level（1~9）
- 1~3：基础（直接套用单一知识点、计算简单）
- 4~6：中等（多步、需组合 2~3 个知识点）
- 7~9：高难（压轴、多知识点综合、需构造/分类讨论；奥数 AX 题多在此段）
- 依据题面综合判断，不是靠 qid 猜

### 4.3 可疑软标记 verdict=suspect（保守！只标铁定的坏题）
**仅在以下情况标 suspect：**
- 题面残缺到无法理解题意（如缺关键条件、句子截断、公式乱码到读不懂）
- 题面存在明显数学/逻辑错误（条件自相矛盾）
- 你**反复尝试仍无法给出正确答案**（不是"懒得算"，是真的解不出）
- 依赖图但图缺失导致无法解题（stem 有"如图"但 image_paths 为空且题意离不开图）

**绝不因下列理由标 suspect（这些是 ok）：**
- 题目难、你算得慢 → 只要能解出就是 ok
- 题面有 `[[IMG:n]]` 锚点 → 正常带图题，不是残缺
- answer/solution 原本为空 → 你补 answer_fill 即可，不算坏题

## 5. 红线 / 禁止事项
- **禁止修改 `stem_zh`（题面）** —— 一个字都不能改。回填是打标签，不是改题。
- **禁止 DELETE 任何题** —— 坏题只软标记 content_status='suspect'，由用户最终定夺。
- 禁止编造 primary_point_id（必须是 core.db 真实 point_id）。
- 禁止改结构/表/外键/其他已有真实字段（source/region/options_json/stem_zh）。
- **禁止 5 实例并发写库**（见 §3，写库单进程串行）。
- 公式若需写入（answer_fill 含 LaTeX），过数学门神 `sanitize_and_verify_math()`。
- 写库前必须备份 `data/questions.db.bak_before_task0001`。

## 6. 验收清单（可量化，Kiro 据此验收）
- [ ] 备份文件 `data/questions.db.bak_before_task0001` 存在
- [ ] 2158 道 pending 全部处理完：处理后 content_status 只剩 done / suspect，无 pending 残留
- [ ] done 题 primary_point_id 全部 ∈ core.db 的真实 point_id（无 KP-000 残留、无编造 ID）
- [ ] done 题 difficulty_level 全部 ∈ [1,9]，且分布不是全 1（说明真判过）
- [ ] suspect 题每条都有 suspect_reason（在 jsonl / 报告里可查）
- [ ] stem_zh 零改动：处理前后 stem_zh 的哈希/内容一致（Kiro 会比对备份）
- [ ] 无 DELETE：题总数处理前后一致（2225 总 / 2158 pending 起算）
- [ ] 中间产物 part1..5.jsonl 保留（供 Kiro 抽验判定合理性）
- [ ] 报告：done 数 / suspect 数 / 各难度分布 / 考点覆盖了多少个 / suspect 原因归类

## 7. 回写要求
完成后：
1. 结果写入 `outbox/RESULT-DATA-0001.md`，含：逐条验收清单量化自检 + done/suspect 统计 + 难度分布 + 考点覆盖数 + suspect 原因分类 + 抽样若干 qid 佐证判定
2. 保留 `tmp/backfill/part*.jsonl` 供抽验
3. 把本任务书 `status` 改为 `done`
4. 明确播报一句 `"TASK-DATA-0001 完成"`，原地进入 STANDBY 待命，等待用户通知唤醒下一任务。

## 8. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令（不自动死循环轮询）
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
