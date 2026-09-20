---
id: TASK-DATA-0006
line: datalayer
status: accepted
attempt: 1
created_by: Kiro
title: 沙盒数据纠错 — 抛物线系数/滑块越界/从动约束/LM-9B几何点位/Line P1概率模型/主线错标（并发4，不含SVG）
model: default
concurrency: 4
---

# 任务：沙盒数据层纠错与回填（数据线，并发4）

## 🚨 执行方式
- **model=default（Flash）**。**concurrency=4**：一次 `invoke_subagent` 并发拉起 4 个子 Agent，各负责一个分片，**各写独立 `tmp/data0006/partN.jsonl`（只读算+写jsonl，绝不并发写库）**；全部子 Agent 完成后，由主 Agent **单进程串行**将 jsonl 内容写入数据库（先备份 .bak，写后校验）。
- **依据**：TASK-FE-0012 诊断报告（`../frontend/archive/RESULT-FE-0012.md`）中**非SVG的数据错配类**问题。
- **与前端线 TASK-FE-0013 并行**：本任务修数据库数据行；前端修渲染逻辑。互不改对方文件。数据修对后，前端渲染才能正确成图（尤其抛物线系数、LM-9B 点位）。

## 🚫 本轮不做（用户明确排除）
- ❌ **不碰任何 107 考点 SVG**（`*.svg`）。所有 SVG 语义错配用户将亲自大改，已记录于 `../frontend/SVG_BACKLOG_待用户大改时合并.md`。

## 🔒 写库铁律（严格遵守）
- 子 Agent 仅【只读查库 + 计算正确值 + 写各自 partN.jsonl】，**严禁任何 DB 写操作**。
- 主 Agent 汇总后**单事务串行写入** `data/sandbox.db` / `data/core.db`；写前 `cp` 备份为 `.bak`。
- **守恒断言**：concept_sandboxes 行数恒 46、leap_sandbox_models 行数恒 36、logic_lines 行数不变；**只改被点名的字段/行，非目标行零变动**。
- 写库后同步到 `public/data/` 与（若需要）`dist/data/`（对齐现有部署数据流）。

## 四分片划分

### 片1｜概念沙盒方程/参数纠错（`tmp/data0006/part1.jsonl`）
- **SB-KP038 抛物线**：`function_quadratic_forms_template`，当前仅 a_coeff 滑块，方程缺常数项（应画 $y=x^2-4$ 与顶点 $(0,-4)$，现缺 c=-4）→ 补齐方程系数配置。
- **SB-KP040 抛物线**：一次项缺失导致曲线与交点错位 → 补齐。
- **SB-KP080**：滑块 default=6 溢出上限 [-5,5] → 修正 default 到合法范围。
- **SB-KP035**：线性方程组交点悬空在直线外 → 修正点位使交点落在直线上。
- 排查同类"滑块默认值越界 / 抛物线缺项 / 交点悬空"，逐个记录 {sandbox_id, 字段, 旧值, 新值, 依据}。

### 片2｜概念沙盒几何点位与从动约束（`tmp/data0006/part2.jsonl`）
- **四边形沙盒（SB-KP062/064/065/066）**：顶点全为自由点、缺从动约束，拖动破形 → 为对应顶点补 constraints（从动/共线/等长等），使拖动保持四边形性质。
- **SB-KP051**：缺失顶点 $C_2$ → 补齐。
- **垂径定理沙盒**：算子/点位错配为 vertical_distance → 修正为垂径几何关系（弦中点、半径垂直）。
- 逐个记录 {sandbox_id, 问题, 修正后 drag_points/约束, 依据}。
- ⚠️ 仅改 sandbox.db 内几何点位/约束 JSON，不碰 SVG。

### 片3｜LM-9B-30~36 几何点位回填（`tmp/data0006/part3.jsonl`）
- **现状核实**：这 7 个模型**已有正确的中文名和 carrier 配置骨架**（射影定理/胡不归/阿氏圆/瓜豆原理/反比例反演/三视图/锐角三角函数），但 carrier 的**几何点位（points）疑似退化为通用简化 3 点**，无法体现各自模型特征。
- **任务**：为这 7 个模型**按其模型名对应的真实几何构型**回填 carrier_morphing_json 里的 points（及必要的 parameter/posture/camouflage），使其成为能体现该模型几何本质的可交互配置。以库中前 29 个正常模型（LM-7A-01~LM-9B-29）的 JSON 结构为范本。
- 逐个记录 {model_id, model_name, 旧points, 新points及4D配置, 建模依据}。

### 片4｜Line P1 概率主线 + 模型主线错标（`tmp/data0006/part4.jsonl`）
- **Line P1「随机现象与概率模型」**：`logic_lines.flagship_model_id` 当前=LM-8B-17（疑为统计模型，跨主线错配），且全库概率类跃迁模型为 0。
  - 任务：(a) 核实 LM-8B-17 实际内容；(b) 为 P1 建立/指定正确的概率旗舰模型（如需新建概率跃迁模型，按 leap_sandbox_models 结构新增，并更新 flagship_model_id 指向它）。**若新增模型会使 leap 行数 >36**，先在 jsonl 标注并在 RESULT 提请 Kiro 确认（守恒断言需相应更新）。
- **LM-8B-13「勾股定理折叠翻折」**：primary_line 当前=G4（圆几何），应归入勾股/三角形相关主线 → 核实正确主线并修正。
- **LM-8B-16**：出现超前学期依赖（依赖 KP-043）→ 核实并修正依赖或学期。
- 逐个记录 {对象, 字段, 旧值, 新值, 依据}。

## 关键库/字段（本任务可改）
- `data/sandbox.db` → `concept_sandboxes`（drag_points_json/param_sliders_json/约束）、`leap_sandbox_models`（carrier/parameter/posture/camouflage_json、primary_line、kp_dependencies、unlocked_semester）
- `data/core.db` → `logic_lines`（flagship_model_id）
- 同步 `public/data/`

## 可量化验收清单
- [ ] 片1：SB-KP038/040 抛物线方程系数补齐；SB-KP080 default 回落合法范围；SB-KP035 交点落在直线上；同类问题全排查。
- [ ] 片2：四边形沙盒有从动约束（拖动保持形状）；SB-KP051 补 C₂；垂径算子修正。
- [ ] 片3：LM-9B-30~36 七个模型各有体现自身几何本质的 points 配置（非通用3点），附建模依据。
- [ ] 片4：Line P1 有正确概率旗舰模型（新建则说明）；LM-8B-13 主线修正；LM-8B-16 学期依赖修正。
- [ ] 守恒：concept_sandboxes=46；leap_sandbox_models 若新增概率模型则明确新数量并经 Kiro 确认；logic_lines 行数不变；非目标行零变动。
- [ ] 写库前备份 .bak；写后校验通过；同步 public/data。
- [ ] `pnpm test` 相关数据测试全绿（如有）。

## 🚫 红线
- ❌ 不碰任何 SVG。
- ❌ 子 Agent 不写库（仅 jsonl）；写库由主 Agent 串行单事务。
- ❌ 不改前端 `src/**`（渲染归 FE-0013）。
- ❌ 非目标行/字段零改动。

## 回写要求
1. 4 片各写 `tmp/data0006/part1~4.jsonl`；主 Agent 串行写库。
2. 写 `.kiro/relay/datalayer/outbox/RESULT-DATA-0006.md`（逐项对账 + 旧值/新值 + 守恒校验结果 + .bak 路径）。
3. `status` 改 `done`，告知用户"TASK-DATA-0006 完成"。
