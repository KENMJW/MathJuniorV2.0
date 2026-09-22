---
id: TASK-DATA-0009
line: datalayer
status: done
attempt: 1
created_by: Kiro
exec_machine: 另一台执行机（非主控机）
title: 真题题库全量回填 — 为 419 道 pending 题回填考点/难度/学段/英文/解法/评分/组合，去占位入库 content_status=done
model: default
concurrency: 6
---

> **执行方式（硬性，照 collaboration-protocol §7）**：
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 6`（已经用户批准）：**单次 `invoke_subagent` 一次性并发派发 6 个子 Agent**，各负责一个分片，各写独立 `tmp/data0009/partN.jsonl`。
> - 子 Agent 只读 + 推理 + 写各自 `partN.jsonl`，**严禁并发写 SQLite**（避免 database is locked）。写库由**主 Agent 汇总后串行单事务执行** + 守恒/SHA256/非目标行零变动断言。
> - 本任务**一次性完成全部 419 道 pending 题的回填**（可在主 Agent 侧分多批 commit，但任务目标是"全部回填完，pending 清零"）。

# 任务：真题题库全量回填（数据线，另一台执行机执行）

## 🚨 执行方式 + 跨机器 git 流程（务必遵守）
- **本任务在【另一台执行机】上执行。主控机（本机）是唯一权威源。**
- **开工前必做**：
  1. `git checkout dev && git pull origin dev`（先拉 dev，确保拿到主控机最新的 questions.db 清洗结果 + 切题器修复）。
  2. 先读 `.kiro/steering/collaboration-protocol.md`，重点看"主控机唯一权威源"跨机器铁律：❌ 不改 `.gitignore`/目录结构，❌ 不碰任务范围外文件；分片写 `tmp/data0009/` 而非 scratch 等被 gitignore 忽略的目录。
- **完成后必做**：`git add`（只加本任务改动文件：`data/questions.db`、`public/data/questions.db`、`tmp/data0009/*`、本任务书、RESULT）→ commit → `git pull --rebase origin dev` → `git push origin dev`。

## 🎯 任务本质
`data/questions.db` 现有 **419 道 `content_status='pending'` 题**（真题导入 + 主控机清洗后的干净题面）。这些题的题面 `stem_zh`/选项/图片锚点/教师版答案已就位，但**语义字段全是占位值**：
- `primary_point_id = 'KP-000'`（哨兵）
- `stem_en = '__PENDING__'`
- `answer_standard = '__PENDING__'`（部分题有真答案，部分是占位）
- `grade_level = 9` / `semester = 1` / `difficulty_level = 1`（合法占位，非真值）
- `combination_id = NULL` / `rubric_checklist_json = NULL`

本任务用 **Flash 模型逐题读题**，把上述占位字段回填成真值，并将 `content_status` 改为 `done`，使这批真题正式进入题库可被前端组卷抽取。

## 📋 依据（必须都读，喂给子 Agent 作上下文）
1. **107 个考点完整定义（硬前置）**：`data/core.db` 表 `knowledge_points`，字段 `point_id / name_zh / name_en / grade / semester / domain / subcategory / primary_line_id / formal_definition_zh`。
   - **必须把 107 考点的 `point_id + name_zh + formal_definition_zh` 全量作为上下文喂给每个子 Agent**，否则考点映射不准（这是 BACKLOG 任务C 明确的硬前置）。
2. **组合白名单**：`data/core.db` 表 `knowledge_combinations`（2204 条），字段 `combination_id / kp_ids(JSON数组) / kp_count / question_hint_zh`。回填 `combination_id` 用。
3. **目标 schema 与质量标杆**：`data/questions.db` 表 `questions`（见下"字段回填规范"）。可查若干 `content_status='done'` 行作为质量参照（如 `Q-2026-SD-0017`：完整的 primary_point_id / combination_id / stem_en / rubric_checklist_json / solutions_json）。

## 📐 字段回填规范（逐题）

| 字段 | 回填规则 | 备注 |
| :--- | :--- | :--- |
| `primary_point_id` | 读 stem_zh（+答案/解析）判定该题**主考点**，从 107 个 KP 中选最贴切的一个，填 `point_id`（如 `KP-021`）。**严禁再留 `KP-000`**。 | 必填，最关键 |
| `all_point_ids`（若表无此列则跳过） | 见下"⚠️ 表结构确认" | 见下 |
| `grade_level` / `semester` | **由 primary_point_id 对应 KP 的 `grade`/`semester` 决定**（查 knowledge_points），不得沿用占位 9/1。 | 与考点一致 |
| `difficulty_level` | 按题目实际难度评 **1–9**（L1-L9）。参考题型/步骤数/是否压轴/分值 score_default。选择填空基础题 1–4，中档解答 4–6，压轴 7–9。 | CHECK 1–9 |
| `stem_en` | 把 `stem_zh` **翻译成英文**（保留 LaTeX 公式 `$...$` 原样、保留 `[[IMG:n]]` 锚点原样）。**严禁留 `__PENDING__`**。 | 必填 |
| `answer_standard` | 若现值 `__PENDING__`：读题给出标准答案；若已有真答案：保留/规范化。 | 必填非占位 |
| `options_json` | 选择题：确保 A/B/C/D 的 `zh` 有值，补 `en` 英文翻译（图选项保留 `img` 字段）。 | 仅选择题 |
| `solutions_json` | 至少一条解法：`[{"method":"解法一…","text":"分步解答"}]`。已有则规范化。 | 必填（对齐 done 题 100% 有解法） |
| `rubric_checklist_json` | **仅 `question_type='solution'` 题**回填：`[{"step":1,"score":2,"desc":"…"}]`，分值之和 = score_default。选择/填空题留 NULL。 | 解答题填 |
| `combination_id` | 由该题**完整考点集合**排序后查 `knowledge_combinations.kp_ids` 匹配；命中则填 `combination_id`，查不到留 NULL（不强求）。 | best-effort |
| `content_status` | 全部改为 `'done'`。 | 收尾 |

> **⚠️ 表结构确认（子任务开工前主 Agent 先查一次）**：执行 `PRAGMA table_info(questions);`。
> - 若**存在** `all_point_ids` / `max_grade` 列 → 一并回填（完整考点集合 JSON 数组 + 最高年级），用于前端超纲过滤。
> - 若**不存在** → 本任务不新增列（不改表结构，避免越界）；`combination_id` 仍按"完整考点集合查白名单"逻辑回填即可。**是否加列由主控机决定，执行机不得擅自 ALTER TABLE**。

## 🧩 六分片划分（各写 tmp/data0009/partN.jsonl，均衡 ~70 题/片）
按 `question_id` 排序后顺序均分为 6 片（主 Agent 先 `SELECT question_id FROM questions WHERE content_status='pending' ORDER BY question_id` 取 419 个 id，均分）：
- **片1**：第 1–70 题
- **片2**：第 71–140 题
- **片3**：第 141–210 题
- **片4**：第 211–280 题
- **片5**：第 281–350 题
- **片6**：第 351–419 题

每片子 Agent 输出 `tmp/data0009/partN.jsonl`，每行一个 JSON 对象：
```json
{"question_id":"Q-2026-SD-0001","primary_point_id":"KP-057","grade_level":8,"semester":1,"difficulty_level":5,"stem_en":"...","answer_standard":"...","options_json":"{...}","solutions_json":"[{...}]","rubric_checklist_json":"[{...}]","combination_id":"C1-0001"}
```
（无值字段可省略键；`combination_id`/`rubric_checklist_json` 可为 null。）

## 🔒 写库铁律（严格遵守）
- **子 Agent 只读 core.db/questions.db + 推理 + 写 partN.jsonl**，严禁任何 DB 写操作。
- **主 Agent 汇总 6 片后单事务串行写库**：
  - 写前 `cp data/questions.db data/questions.db.bak_before_task0009`。
  - 逐题 `UPDATE questions SET ... WHERE question_id=?`（**只 UPDATE，绝不 INSERT/DELETE**）。
  - **stem_zh 题面 SHA256 零篡改**：写库前后对全部 pending 题的 `stem_zh` 计算 SHA256，断言完全一致（回填绝不改题面）。
  - **行数守恒**：questions 总行数写前=写后（本任务只改字段不增删行）。
  - **非目标行零变动**：2064 道原 done 题一字节不动（可对 done 全集算 SHA256 校验）。
- 写库后同步 `public/data/questions.db`（与 data/ 一致）。
- ❌ 不碰 `data/core.db`；❌ 不改任何 `src/**` 源码；❌ 不碰任何 SVG；❌ 不 ALTER TABLE。

## ✅ 可量化验收清单（Kiro 据此验收）
- [ ] `SELECT COUNT(*) FROM questions WHERE content_status='pending'` = **0**（419 全部回填完，pending 清零）。
- [ ] `SELECT COUNT(*) FROM questions WHERE primary_point_id='KP-000'` = **0**（哨兵清零）。
- [ ] `SELECT COUNT(*) FROM questions WHERE content_status='done' AND stem_en='__PENDING__'` = **0**（英文全部回填）。
- [ ] `SELECT COUNT(*) FROM questions WHERE content_status='done' AND answer_standard='__PENDING__'` = **0**（答案无占位）。
- [ ] 本批 419 题 `grade_level/semester` 与其 primary_point_id 对应 KP 的 grade/semester **一致**（抽查≥10 题 join 核对）。
- [ ] 本批 419 题 `difficulty_level` 全部 ∈ [1,9] 且非全 1（有真实难度分布）。
- [ ] 所有 `question_type='solution'` 的题 `rubric_checklist_json` 非空且各 step.score 之和 = score_default。
- [ ] **stem_zh SHA256 写前=写后**（本批 419 题题面零篡改），RESULT 附校验结论。
- [ ] **questions 总行数写前=写后**；**2064 道原 done 题零变动**（附校验）。
- [ ] `data/questions.db` 与 `public/data/questions.db` 一致。
- [ ] `.bak_before_task0009` 备份存在。
- [ ] `pnpm test` 全绿（不得因数据回填破坏现有测试）。
- [ ] RESULT 附：每片回填题数统计 + 考点分布 top10 + 难度分布 + combination_id 命中率 + 抽查样本（≥3 题回填前后全字段对照）。

## 🚫 红线 / 禁止事项
- ❌ **禁止修改 `stem_zh` 题面**（回填只动语义字段，题面 SHA256 必须零变动）。
- ❌ **禁止 INSERT / DELETE / 重建表 / ALTER TABLE**（只 UPDATE 现有 419 行）。
- ❌ 禁止碰 2064 道原 done 题。
- ❌ 不碰 core.db / SVG / src 源码 / .gitignore / 目录结构 / 主控机同步约定。
- ❌ 子 Agent 不写库（仅 jsonl）；写库由主 Agent 串行单事务 + 守恒断言。
- ❌ 分片中间产物必须写 `tmp/data0009/`，不得写 scratch/ 等被 gitignore 忽略的目录。

## 📤 回写要求
1. 6 片各写 `tmp/data0009/part1~6.jsonl`。
2. 写 `.kiro/relay/datalayer/outbox/RESULT-DATA-0009.md`（每片回填统计 + 考点/难度分布 + combination 命中率 + SHA256/守恒校验结果 + .bak 路径 + test 结果 + 抽查样本）。
3. 本任务书文件头 `status` 改为 `done`。
4. `git add`（只加本任务文件）→ commit → `git pull --rebase origin dev` → `git push origin dev`。
5. 在对话中明确播报一句 `"TASK-DATA-0009 完成"`，**原地进入 STANDBY 待命**，等待用户通知唤醒 Kiro 验收。

## 7. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令（不自动死循环轮询）
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
