---
id: TASK-DATA-0010
line: datalayer
status: done
attempt: 1
created_by: Kiro
exec_machine: 另一台执行机（非主控机）
title: 真题库导入遗留污染一次性清洗 — 清脏尾/修类型错标/拆合并题/复评受影响难度，清完pending质量达标
model: default
concurrency: 4
---

> **执行方式（硬性，照 collaboration-protocol §7）**：
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 4`（已经用户批准）：**单次 `invoke_subagent` 一次性并发派发 4 个子 Agent**，各处理一个分片，各写独立 `tmp/data0010/partN.jsonl`。
> - 子 Agent 只读 + 推理 + 写各自 `partN.jsonl`，**严禁并发写 SQLite**。写库由**主 Agent 汇总后串行单事务执行** + 守恒/SHA256/非目标行零变动断言。
> - **一次性完成全部清洗**（可多批 commit，但目标是本任务清单全部达标）。

# 任务：真题库导入遗留污染一次性清洗（数据线，另一台执行机执行）

## 🚨 执行方式 + 跨机器 git 流程
- **本任务在【另一台执行机】上执行。主控机（本机）是唯一权威源。**
- **开工前必做**：
  1. `git checkout dev && git pull origin dev`（拉到 DATA-0009 已回填的 questions.db）。
  2. 读 `.kiro/steering/collaboration-protocol.md`，遵守"主控机唯一权威源"跨机器铁律。
- **完成后必做**：`git add`（只加本任务改动文件：`data/questions.db`、`public/data/questions.db`、`tmp/data0010/*`、本任务书、RESULT，若有新图则含 `assets/questions/` 与 `public/assets/questions/`）→ commit → `git pull --rebase origin dev` → `git push origin dev`。

## 🎯 任务本质与背景
DATA-0009 已把 419 道真题的语义字段（考点/学段/难度/英译/答案/解法/组合）全部回填并验收通过。但主控机抽样复核发现：这 419 题是**旧版切题器**（在切题器加固前）导入的，题面残留三类污染，DATA-0009 只填字段未清题面，故遗留至今。本任务一次性清干净，使这批题达到可对外的质量标准。

> 参考：主控机已加固 `tools/docimport/import_docx.py`（`strip_md_headers()` + `is_paper_noise()`）与清洗脚本 `tools/docimport/clean_import_batch.py`，其正则口径可直接复用。

## 📋 三类污染 + 一项复评（可量化，主 Agent 开工先各自 SELECT 复现数量）

### A. stem 尾部污染（约 80 题）—— 清理，UPDATE
题干/英译尾部混入非题目内容：
- markdown 段标题：`# 四、解答题（共5题…）`、`# 二、选择题`、`## 18.(本题满分5分)`
- 水印：`公众号 好学熊资料库`、`更多资料搜索…`
- 评分说明尾注：`每小题N分，共N分．解答应写出…`
**做法**：剥离 `stem_zh` 与 `stem_en` 尾部/中部的上述杂质，**只删杂质，绝不改题目本身的数学内容/公式/图锚点 `[[IMG:n]]`**。复用 `strip_md_headers()` 口径。

### B. question_type 错标（8 题）—— 修正，UPDATE
标成 `single_choice` 但实际无 A/B/C/D 选项（真身是填空或解答）：
`Q-2025-64486A-0004 / Q-2025-7AE16F-0002 / Q-2025-7AE16F-0003 / Q-2025-7AE16F-0004 / Q-2025-A9D498-0023 / Q-2026-MINERU-0018 / Q-2026-MINERU-0019 / Q-2026-SUZ-0021`
**做法**：逐题读 stem 判定真类型，`question_type` 改为 `fill_blank` 或 `solution`；`options_json` 置 NULL（本就无选项）；若改成 `solution` 需补 `rubric_checklist_json`（step.score 之和 = score_default）。

### C. 两题合并（约 30 题）—— 拆分，允许 INSERT
一条记录里挤了两道及以上独立真题（各有自己的题干/答案/考点），如 `Q-2025-0AECBD-0002`=位似判断填空+位似五边形面积周长；`Q-2025-26F4DA-0002`=水渠造价最值+牧童最短路程。
**做法**：
1. 判定切分点（题号 / 段标题 / 独立情境边界），拆成 N 道独立题。
2. **保留原 qid 给第一子题**（UPDATE：stem_zh/stem_en/answer/考点/难度/组合/type 重定为第一子题的值）。
3. **其余子题 INSERT 新行**，qid 用**原 qid + 小写字母后缀**：`Q-2025-0AECBD-0002b`、`...-0002c`（现库无字母后缀 qid，不冲突）。新行 `source/exam_year/region/exam_type` 沿用原题，其余字段（考点/学段/难度/英译/答案/解法/组合/图锚点）按该子题独立回填，`content_status='done'`。
4. 图片：把原 `image_paths_json` 里的图**按 `[[IMG:n]]` 锚点归属**分配给对应子题；子题的锚点重新编号从 0 起，`image_paths_json` 只留该子题用到的图。**不新增/不删除图片文件**，只重新分配引用。

### D. 受影响难度复评（拆分后）—— UPDATE
拆分（C）后，被拆出的压轴子题难度可能被原合并题低估。**对 A/B/C 处理过的题重新评 `difficulty_level`（1–9）**，确保与该题真实难度相符（尤其拆出的解答压轴题不应停留在 L1–L2）。未受影响的题难度不动。

> **⚠️ 其余字段确认**：主 Agent 开工先跑一遍完整体检（可复用主控机口径）：`answer_standard 空 / 图锚点>实际图 / solution解法过薄 / 选项zh空` —— 主控机复核这四项当前均为 **0**。执行中若发现新的空缺一并补齐，并在 RESULT 说明。

## 🔒 写库铁律
- 子 Agent 只读 + 推理 + 写 `tmp/data0010/partN.jsonl`；**严禁并发写库**。
- 主 Agent 汇总后**单事务串行写库**：
  - 写前 `cp data/questions.db data/questions.db.bak_before_task0010`，**并立即校验备份非空、行数与现库一致**（教训：DATA-0009 的备份曾是 0 字节空文件，回滚点作废）。RESULT 必须附"备份行数=现库行数"的实测数字。
  - A/B/D 用 `UPDATE`；C 的第一子题 `UPDATE`、其余子题 `INSERT`。
  - **数学内容零篡改断言**：对未拆分的题，`stem_zh` 去掉"被识别为杂质的尾部"后，剩余数学正文（公式/数字/图锚点）必须与原文逐字一致——RESULT 附"清理仅删杂质、未动数学正文"的抽样证明（≥5 题清理前后对照）。
  - **原 2064 done 题 + 未被本任务touch的 pending 题零变动**（整行 SHA256 校验）。
- 写库后同步 `public/data/questions.db`。
- ❌ 不碰 `data/core.db`；❌ 不改 `src/**`；❌ 不碰 SVG；❌ 不改 `.gitignore`/目录结构；❌ 不 ALTER TABLE。

## 🧩 四分片划分（各写 tmp/data0010/partN.jsonl）
主 Agent 先复现三类污染的 qid 全集（A∪B∪C，约 102 题），按 qid 排序**均分 4 片**（各 ~25 题）。每片子 Agent 对分到的题：判定属于 A/B/C 哪类 → 按对应做法产出该题的目标数据（含拆分子题）→ 写 partN.jsonl。
jsonl 每行一个操作对象，含 `op`(update|insert)、`question_id`、及需写入/新增的字段。

## ✅ 可量化验收清单（Kiro 据此独立查库验收）
- [ ] A 清理后：`stem_zh` / `stem_en` 含 `# N、` 段标题 / `公众号` / `好学熊` / `资料库` / `每小题…共…分．解答应` 的题数 = **0**。
- [ ] B 修正后：`question_type='single_choice' AND options_json IS NULL` = **0**（本批内）。
- [ ] C 拆分后：原 30 道合并题中每条已拆为 ≥2 道独立题；新子题 qid 带字母后缀、`content_status='done'`、各字段完整（考点≠KP-000、stem_en非中文、answer非空）。
- [ ] 新增 INSERT 行数 = 拆分产生的子题数；总行数 = 2483 + 新增子题数（RESULT 给出确切数）。
- [ ] D：被处理题 difficulty ∈ [1,9]；拆出的解答压轴题难度合理（RESULT 附难度重评前后对照）。
- [ ] `stem_en` 残留 ≥10 个连续汉字的题数 = **0**（清 A 后英译无中文段落）。
- [ ] **数学正文零篡改**：未拆题的数学公式/数字/图锚点逐字未变（抽样≥5 对照）。
- [ ] **原 2064 done + 未touch pending 题零变动**（整行 SHA256）。
- [ ] `.bak_before_task0010` 存在且**非空、行数=现库**（附实测）。
- [ ] `data/questions.db` 与 `public/data/questions.db` 一致（SHA256）。
- [ ] `pnpm test` 全绿。
- [ ] RESULT 附：A/B/C/D 各处理题数 + 拆分明细（原qid→子qid列表）+ 新增行数 + 难度重评对照 + 备份行数实测 + SHA256 校验 + 抽样清理前后对照。

## 🚫 红线
- ❌ 禁止改动题目的**数学内容**（公式/数字/图/选项文本）——A 只删杂质，C 只按边界拆分不改内容。
- ❌ 禁止碰原 2064 done 题与未被本任务命中的 pending 题。
- ❌ INSERT 仅限 C 拆分子题（带字母后缀 qid）；不得随意新增其它行；不得 DELETE。
- ❌ 不碰 core.db / SVG / src / .gitignore / 目录结构；不 ALTER TABLE。
- ❌ 子 Agent 不写库；写库主 Agent 串行单事务。
- ❌ 分片写 `tmp/data0010/`，不得写被 gitignore 忽略的目录。
- ⚠️ 备份必须真落地（校验非空+行数），杜绝 DATA-0009 空备份重演。

## 📤 回写要求
1. 4 片各写 `tmp/data0010/part1~4.jsonl`。
2. 写 `.kiro/relay/datalayer/outbox/RESULT-DATA-0010.md`（A/B/C/D 处理统计 + 拆分明细 + 新增行数 + 难度重评 + 备份行数实测 + SHA256/守恒校验 + 抽样对照 + test 结果）。
3. 本任务书 `status` 改 `done`。
4. `git add`（只加本任务文件）→ commit → `git pull --rebase origin dev` → `git push origin dev`。
5. 播报 `"TASK-DATA-0010 完成"`，原地 STANDBY 待命等验收。

## 🔜 完成后衔接（用户指示）
DATA-0010 验收通过后，数据线进入 **BACKLOG 挂起的"任务 C：考点体系精整 + 完整考点集合识别"**（详见 `.kiro/relay/datalayer/BACKLOG.md`）：
- 子目标1 主考点重分配（<3题考点从邻近大考点重标细分考点）
- 子目标2 生成补缺（基础概念点大模型生成题补到每考点≥3题）
- 子目标3 完整考点集合 `all_point_ids` + `max_grade` 识别（前端超纲过滤）
- 子目标4 combination_id 完整回填
> 该任务由 Kiro 在 DATA-0010 归档后单独下发新任务书（TASK-DATA-0011），本任务不含其内容。

## 7. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令（不自动死循环轮询）
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
