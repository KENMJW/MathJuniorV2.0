---
id: TASK-DATA-0011
line: datalayer
status: done
attempt: 1
created_by: Kiro
exec_machine: 本机（主控机）
title: 考点体系精整四合一 — 主考点重分配+生成补缺(每考点≥3题)+全库完整考点集合all_point_ids+combination_id全库回填
model: default
concurrency: 10
---

> **执行方式（硬性，照 collaboration-protocol §7）**：
> - **本机执行**（主控机本地跑，无需跨机器 git 拉取/回流那套；完成后正常提交即可）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 10`（已经用户批准）：**单次 `invoke_subagent` 一次性并发派发 10 个子 Agent**，各处理一个分片，各写独立 `tmp/data0011/partN.jsonl`。
> - 子 Agent 只读 + 推理 + 写各自 `partN.jsonl`，**严禁并发写 SQLite**。写库由**主 Agent 汇总后串行单事务执行** + 守恒/SHA256/断言。
> - **一次性完成四个子目标全部**（可多批 commit，但目标是本任务清单全部达标）。

# 任务：考点体系精整四合一（数据线，本机执行）

## 🎯 任务本质
当前 `data/questions.db` 共 **2565 题**（全 done）。本任务对**全库 2565 题**做考点体系精整，一次性完成四个子目标，使题库满足前端"单点快练每考点可抽≥3题""按考点组合出综合题""完整考点集合⊆勾选集合的超纲过滤"三大功能。

## 🔒 硬前置（用户强调，必须做到）
**必须把 107 个考点的完整定义作为上下文喂给每个子 Agent**：`data/core.db` 表 `knowledge_points` 的 `point_id + name_zh + grade + semester + domain + subcategory + formal_definition_zh`（四段定义）。否则考点映射/重分配不准。

## 📋 四个子目标（按顺序执行）

### 子目标 1：主考点重分配（修 primary_point_id）
- **现状**：107 考点中 **19 个 <3 题**（其中 7 个 0 题），根因是细分考点的题被笼统标到邻近大考点（如一元二次方程解法细分 KP-022/024 空，题堆在大考点）。
- **19 个待补考点**（0题/1题/2题）：
  KP-013整式的除法(0) / KP-024求根公式法(0) / KP-083图形综合变换(0) / KP-085正弦sin定义(0) / KP-089互余角三角函数(0) / KP-096茎叶图(0) / KP-107用频率估计概率(0) / KP-054等腰三角形判定(1) / KP-070点与圆位置关系(1) / KP-071直线与圆位置关系(1) / KP-086余弦cos定义(1) / KP-095折线统计图(1) / KP-022直接开平方法(2) / KP-037反比例函数k几何意义(2) / KP-049三角形基本性质(2) / KP-075圆与圆位置关系(2) / KP-078正多边形与圆(2) / KP-100极差(2) / KP-102统计量综合判断(2)
- **做法**：遍历全库题，对被笼统标到大考点、实际更贴切某细分考点的题，把 `primary_point_id` **重标到最贴切的细分考点**（依 107 考点 formal_definition 判定）。**只在确有更贴切细分考点时才改**，无把握不动（保守）。
- **红线**：重分配只改 `primary_point_id`（及随之的 grade_level/semester 对齐新考点）；**不改 stem_zh 题面**。

### 子目标 2：生成补缺（INSERT 生成题，每考点≥3题）
- 子目标1 重分配后仍 <3 题的**基础概念考点**（如茎叶图/频率估概率/sin·cos 定义等），用 Flash **生成**基础练习题补足到**每考点 ≥3 题**。
- **生成题规范**：
  - 过数学门神（公式合法、答案正确、无脏 LaTeX）。
  - `question_id` 用 `Q-GEN-{KP}-{seq}` 格式（如 `Q-GEN-KP096-001`），与真题 qid 不冲突。
  - `source = 'AI生成基础题'`；`content_status = 'generated'`（**用此值区分生成题 vs 真题 'done'**，前端/后续可筛）。
  - 字段完整：primary_point_id / grade_level / semester(随KP) / difficulty_level(基础题 1~3) / question_type / stem_zh / stem_en / answer_standard / solutions_json / all_point_ids / combination_id。
  - 目的仅为保单点快练可抽3题，是基础练习非精品真题。

### 子目标 3：全库完整考点集合 all_point_ids + max_grade（加列 + 回填）
- **先 ALTER TABLE 加两列**（本机主控机授权可加）：
  `ALTER TABLE questions ADD COLUMN all_point_ids TEXT;`（JSON 数组，该题涉及的完整考点集合，含主考点）
  `ALTER TABLE questions ADD COLUMN max_grade TINYINT;`（该题完整考点集合中的最高年级，前端超纲过滤用）
- **全库 2565 题 + 生成题**逐题识别完整考点集合（不只主考点，含所有实际用到的考点），回填 `all_point_ids`（JSON 数组，含 primary_point_id）与 `max_grade`。
- **老 2064 题也要做**（用户明确要求 A 全库，不许只做新题）。

### 子目标 4：combination_id 全库回填
- 由每题的**完整考点集合 all_point_ids 排序后**查 `knowledge_combinations.kp_ids` 匹配（白名单 kp_count 1~8 共 2204 条），命中则回填 `combination_id`，查不到留 NULL（不强求）。
- **全库覆盖**：老 2028 题当前无组合，本任务补齐（能匹配的都填上）。

## 🧩 十分片划分（各写 tmp/data0011/partN.jsonl）
主 Agent 先 `SELECT question_id FROM questions ORDER BY question_id`（2565题）均分 10 片（各 ~257 题）。每片子 Agent 对分到的题：
1. 判定是否需重分配 primary_point_id（子1）；
2. 识别完整考点集合 all_point_ids + max_grade（子3）；
3. 由完整集合匹配 combination_id（子4）。
生成补缺题（子2）由**主 Agent 在收齐10片、统计各考点实际题数后统一生成**（因为要先知道重分配后哪些考点仍<3题），生成结果单独写 `tmp/data0011/generated.jsonl`。
jsonl 每行含 `op`(update|insert)、`question_id` 及字段。

## 🔒 写库铁律
- 子 Agent 只读 core.db/questions.db + 推理 + 写 partN.jsonl；**严禁并发写库**。
- 主 Agent 单事务串行写库：
  - 写前 `cp data/questions.db data/questions.db.bak_before_task0011`，**立即校验备份非空 + 行数=现库(2565)**，RESULT 附实测数字（吸取 DATA-0009 空备份教训）。
  - ALTER TABLE 加 all_point_ids/max_grade 两列。
  - 子1/3/4 用 UPDATE；子2 生成题用 INSERT。
  - **stem_zh 题面 SHA256 零篡改**：全库 2565 题（不含新生成题）stem_zh 写前=写后逐字一致。
  - **行数守恒**：写后总行数 = 2565 + 生成题数（RESULT 给确切数）；**零 DELETE**。
  - `all_point_ids` 必含 `primary_point_id`；`combination_id` 若非 NULL 必在白名单内。
- 写库后同步 `public/data/questions.db`。
- ❌ 不碰 SVG / src 源码 / .gitignore / 目录结构。
- ⚠️ 本任务**允许** ALTER TABLE 加列（主控机授权，仅加 all_point_ids/max_grade 两列，不改其它列/约束）。

## ✅ 可量化验收清单（Kiro 据此独立查库验收）
- [ ] **每考点 ≥3 题**：`SELECT primary_point_id,COUNT(*) ... HAVING COUNT(*)<3` = **0 个考点**（重分配+生成后）。
- [ ] 107 考点全部有题（0 题考点 = 0）。
- [ ] 生成题：qid 前缀 `Q-GEN-`、`content_status='generated'`、`source='AI生成基础题'`，字段完整无 KP-000/无 __PENDING__，过数学门神。
- [ ] **all_point_ids 全库覆盖**：`all_point_ids IS NULL` = **0**（含老题、生成题）；每条含 primary_point_id。
- [ ] **max_grade 全库覆盖**：`max_grade IS NULL` = 0，值域 7~9。
- [ ] **combination_id 覆盖率显著提升**：老 2028 题从 2% → 尽可能高（RESULT 给全库覆盖率 + 命中率）；非 NULL 的 combination_id 全部在白名单内（0 个非法）。
- [ ] **stem_zh 零篡改**：全库 2565 原题题面写前=写后 SHA256 一致（生成题除外）。
- [ ] **零 DELETE**；总行数 = 2565 + 生成题数。
- [ ] 重分配后 grade_level/semester 与新 primary_point_id 对应 KP 一致。
- [ ] `.bak_before_task0011` 存在、非空、行数=2565。
- [ ] 双库 SHA256 一致。
- [ ] `pnpm test` 全绿。
- [ ] RESULT 附：重分配题数 + 生成题数(按考点) + all_point_ids/max_grade 覆盖 + combination 全库覆盖率&命中率 + <3题考点归零证明 + SHA256/守恒 + 抽样(≥5 题含1老题1生成题的完整考点集合+组合对照)。

## 🚫 红线
- ❌ 禁止改 stem_zh 数学题面（重分配/加列/回填都不动题面）。
- ❌ 禁止 DELETE 任何题；INSERT 仅限子2生成题（Q-GEN- 前缀）。
- ❌ ALTER TABLE 仅限加 all_point_ids/max_grade 两列，不改其它列/CHECK/索引。
- ❌ 不碰 core.db（只读）/ SVG / src / .gitignore / 目录结构。
- ❌ 子 Agent 不写库；写库主 Agent 串行单事务 + 断言。
- ❌ 分片写 `tmp/data0011/`，不得写被 gitignore 忽略的目录。
- ⚠️ 重分配保守：仅在确有更贴切细分考点时改，无把握不动，避免误改老题分类。

## 📤 回写要求
1. 10 片各写 `tmp/data0011/part1~10.jsonl` + 主 Agent 的 `tmp/data0011/generated.jsonl`。
2. 写 `.kiro/relay/datalayer/outbox/RESULT-DATA-0011.md`（四子目标各统计 + 覆盖率 + <3题归零证明 + 备份行数实测 + SHA256/守恒 + 抽样对照 + test 结果）。
3. 本任务书 `status` 改 `done`。
4. 本机提交：`git add`（data/questions.db、public/data/questions.db、tmp/data0011/*、本任务书、RESULT）→ commit → push origin dev。
5. 播报 `"TASK-DATA-0011 完成"`，原地 STANDBY 待命等验收。

## 7. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令（不自动死循环轮询）
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
