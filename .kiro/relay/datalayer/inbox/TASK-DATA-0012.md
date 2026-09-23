---
id: TASK-DATA-0012
line: datalayer
status: done
attempt: 1
created_by: Kiro
exec_machine: 本机（主控机）
title: 题库文档垃圾字符清洗 — 清 pandoc span/HTML注释/反引号/markdown表格残渣/破折号还原，保护合法LaTeX
model: default
concurrency: 1
---

> **执行方式**：
> - **本机执行**（主控机本地，完成后正常提交）。
> - `model: default`（Flash）。**`concurrency: 1`**：本任务是**确定性正则清洗**（非需模型逐题推理的活），清洗逻辑已由主控机 Kiro 写好并验证的脚本 `tools/docimport/clean_pandoc_residue.py` 承载，执行机**跑脚本 + 独立校验**即可，无需并发派子 Agent。
> - 写库单进程单事务最安全，故并发严格为 1。

# 任务：题库文档垃圾字符清洗（数据线，本机执行）

## 🎯 任务本质
用户 preview 时在题面发现大量文档垃圾字符（DATA-0010 清洗未覆盖的新类型）。全库 2582 题中约 **1012 题**受污染。本任务用主控机已写好并 dry-run 验证过的清洗脚本一次性清干净，**保护合法 LaTeX 不误删**。

## 📋 污染类型（脚本已覆盖，均已 dry-run 验证）
1. **pandoc HTML 内联**：`` `<!-- -->`{=html} `` / `{=html}` / `<!-- -->` / 裸反引号 `` ` `` → 删除
2. **pandoc span 下划线填空**：`[答案内容]{.underline}` → 替换为标准填空位 `____`（答案本就在 answer_standard，题面不该泄题）
3. **孤立 pandoc 属性块**：`]{.class}` / `]{key=val}` → 删除
4. **HTML 标签残留**：`<sub>`/`<sup>`/`<span>` 等 → 删除
5. **markdown 表格残渣**：`+----+----+` 表格框 / 表头分隔行 `| --- |` / `:---:` 对齐行 / 独立长横线 → 删除
6. **破折号还原**：被文字包围的 `------`（pandoc 把中文破折号转坏）→ **还原为中文破折号 `——`**（不删，避免丢语义，如"镇馆之宝——云纹青铜大铙"）

## 🔒 保护红线（脚本已实现，验收要复核）
- **合法 LaTeX 绝不动**：`\sqrt[3]{}`、`\sqrt[\ ]{}`、`\frac{}{}`、`^{}`、`_{}`、`\times`、`\text{}` 等——LaTeX 花括号前有命令/上下标，与 pandoc 垃圾 `{=html}`/`]{.class}` 形态可精确区分。
- **不删行**、**不改数学内容/数值/图锚点 `[[IMG:n]]`**。
- **答案不丢**：抠出的 312 个填空答案片段，其题的 answer_standard 已全部有值（经主控机核实），故题面清成 `____` 不丢答案。

## 📐 执行步骤
1. `git pull origin dev`（拉主控机最新，含清洗脚本 `tools/docimport/clean_pandoc_residue.py`）。
2. **写库前备份**：`cp data/questions.db data/questions.db.bak_before_task0012`，**校验备份非空 + 行数=2582**，RESULT 附实测数字。
3. 先跑 **dry-run** 复现受影响题数：`python3 tools/docimport/clean_pandoc_residue.py`（应报受影响 ~1012 题）。
4. 跑 **apply**：`python3 tools/docimport/clean_pandoc_residue.py --apply`。
5. 同步 `public/data/questions.db`。
6. 跑校验（见验收清单）。

## ✅ 可量化验收清单（Kiro 据此独立查库验收）
- [ ] 清洗后全库 stem_zh/answer/solutions/options 中：`{=html}` / `<!--` / `-->` / `{.underline}` / 裸反引号 / `+----` / 独立 `----` 命中题数 = **0**（破折号 `——` 除外，那是还原目标）。
- [ ] **合法 LaTeX 零误删**：随机抽查含 `\sqrt`/`\frac`/`\sqrt[3]` 的题（≥10 题），LaTeX 完整无损（RESULT 附抽样对照）。
- [ ] **零 DELETE、行数守恒**：总行数写前=写后=2582。
- [ ] **数学内容零篡改**：清洗只删垃圾标记/还原破折号，未动公式数值图锚点（抽样≥5 题清洗前后对照，证明数学正文一致）。
- [ ] 破折号还原正确：原 `------`(文字包围) → `——`，语义完整（抽查 Q-2025-FJ-0004 等）。
- [ ] `.bak_before_task0012` 存在、非空、行数=2582。
- [ ] 双库 SHA256 一致。
- [ ] `pnpm test` 全绿。
- [ ] RESULT 附：受影响题数（stem/answer/sol/opt 各计）、清洗后残留=0 证明、LaTeX 保护抽样、备份行数实测、双库一致、抽样对照。

## 🚫 红线
- ❌ 不删任何行；不改数学公式/数值/图锚点。
- ❌ 不误删合法 LaTeX。
- ❌ 不碰 core.db / SVG / src 源码 / .gitignore / 目录结构 / ALTER TABLE。
- ❌ 备份必须真落地（校验非空+行数）。

## 📤 回写要求
1. 写 `.kiro/relay/datalayer/outbox/RESULT-DATA-0012.md`（受影响统计 + 残留0证明 + LaTeX保护抽样 + 备份行数 + 双库一致 + 抽样对照 + test）。
2. 本任务书 `status` 改 `done`。
3. 本机提交：`git add`（data/questions.db、public/data/questions.db、本任务书、RESULT）→ commit → push origin dev。
4. 播报 `"TASK-DATA-0012 完成"`，STANDBY 待命等验收。

## 7. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
