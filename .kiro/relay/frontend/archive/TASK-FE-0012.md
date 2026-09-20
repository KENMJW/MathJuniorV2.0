---
id: TASK-FE-0012
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 沙盒功能正确性【只读诊断】— 46概念沙盒+36跃迁模型 交互失效/映射错配/开发遗漏 全面体检出清单
model: default
concurrency: 8
---

# 任务：沙盒功能正确性【只读诊断】(只出清单，不改代码不写库)

## 🚨 执行方式
- **执行口令**：`/browser 查收 NEXT.md 并执行`（需真机浏览器逐个点验沙盒交互）
- **model=default（Flash）**。**concurrency=8**：一次 `invoke_subagent` 并发拉起 8 个子 Agent，各自负责一个分片，各写独立 `tmp/diag_fe0012/partN.jsonl`；最后由你（主 Agent）汇总成一份《沙盒诊断清单》markdown 写入 RESULT。
- **本任务是纯只读诊断**：❌ 绝不修改任何 `src/**` 源码，❌ 绝不写任何 `.db`，❌ 绝不改数据。只**读代码 + 真机点验 + 查库比对 + 记录事实**。发现问题只**记录**，不修。

## 1. 背景（用户 preview 反馈 + Kiro 前置调查已定性）

用户反馈沙盒"**点击没有什么用处**"，怀疑是**开发遗漏**。Kiro 已做前置代码调查，先给你已知结论作为**核查起点（你要去真机验证这些结论对不对，而不是照抄）**：

- 沙盒分两条独立路径（`src/modules/sandbox/LabWorkspace.tsx` 的 `labSubView` 切换）：
  - **实验室一 · 概念具象沙盒（46个）**：`LabWorkspace` 直接挂 `<SandboxRenderer>`，数据来自 `sandbox.db` 的 `concept_sandboxes` 表。
  - **实验室二 · 4D跃迁模型（36个）**：挂 `<LeapLab>`，数据来自 `leap_sandbox_models` 表；手拉手模型走纯 SVG，其余走 `morphControllers.ts` 的 `compileMorphingSandboxConfig` 编译。
- 前置调查怀疑的**开发遗漏点**（需你真机确认）：
  1. 概念沙盒标题栏"**概念具象化**""**视口阻尼锁定**"两个 pill 是无 `onClick` 的 `<span>` 装饰标签，点了没反应 —— 疑似"点击没用"的最直接来源。
  2. 概念沙盒在 `canvas_template='euclidean'`（纯欧氏几何）模板下，**拖滑块只改遥测文字、不改几何图形**（SandboxRenderer 对纯欧氏几何几乎不消费 paramValues）—— 疑似滑块半失效。
  3. "视口阻尼锁定"只有硬 clamp（越界硬停），**无弹性回弹**实现。
- 前置调查认为**数据侧健康**（DB 相关字段 0 空值），但**这不代表映射正确** —— 用户明确要查 KP-023 这类"名称/语境/图形对不上"的错配，需你逐个核对。

## 2. 诊断目标（三类结论，每条沙盒都要归类）

对每一个被查对象，最终归入三类之一并给证据：
- 🔴 **开发遗漏**：代码根本没接线 / 空 `<span>` 假按钮 / 功能宣称有但没实现（如弹性阻尼）/ 应响应却无响应。
- 🟠 **数据错配**：代码 OK 但数据错 —— 知识点名称与语境/SVG图不符、模型绑定的知识点错、参数配置缺失导致静默降级。
- 🟢 **设计如此（不用改）**：如某点被 constraints 钉死本就不可拖、某沙盒本就只支持拖点不支持点击 —— 属正常设计，非 bug。

## 3. 八分片划分（并发8，各写 tmp/diag_fe0012/partN.jsonl）

- **片1｜概念沙盒 SB-01~SB-15 交互点验**：真机打开实验室一，逐个沙盒验：动点能否拖、拖动后遥测/不变量是否更新、滑块拖动图形是否真变、"概念具象化/视口阻尼锁定"pill 点击是否有反应。每个沙盒记 {id, 拖点结果, 滑块结果, pill结果, 结论分类, 证据}。
- **片2｜概念沙盒 SB-16~SB-30 交互点验**：同片1方法。
- **片3｜概念沙盒 SB-31~SB-46 交互点验**：同片1方法。
- **片4｜跃迁模型 LM 前18个 四维控制台点验**：真机打开实验室二，逐个模型验：载体切换/参数滑块/姿态调整/X-Ray剥壳 四维是否真触发图形变化、原型/变式/综合(tier)切换是否生效。记 {model_id, 载体, 参数, 姿态, X-Ray, tier切换, 结论分类, 证据}。
- **片5｜跃迁模型 LM 后18个 四维控制台点验**：同片4方法。
- **片6｜知识点↔SVG↔语境 映射正确性（107考点）**：查 `core.db` knowledge_points（point_id, name_zh, svg_asset 等）+ 对应 svg 文件，逐个判断"名称 / 语境 / SVG图形"三者是否自洽。**重点复现用户举的 KP-023**（显示"方程组"但语境配方法、图是直线？）。记 {point_id, name_zh, svg_asset, 三者是否自洽, 错配描述}。
- **片7｜模型↔知识点绑定映射（36跃迁+46概念）**：查 leap_sandbox_models.kp_dependencies、concept_sandboxes.point_id，逐个核对绑定的知识点是否与该沙盒/模型实际内容匹配。记 {id, 绑定的kp, 是否正确, 错配描述}。
- **片8｜参数→图形变化 + 视口阻尼/X-Ray/载体/姿态 功能生效核验**：系统性验证"调参数图形到底变不变"这一核心诉求：对每种 canvas_template（euclidean / function_* / number_axis_* 等）各取样本，验证滑块是否真驱动图形；核实"视口阻尼锁定"到底是硬clamp还是弹性、UI能否开关；核实X-Ray/载体/姿态在跃迁模型里的实际生效证据。记 {模板类型, 样本id, 滑块是否驱动图形, 阻尼实现情况, 结论}。

## 4. 关键被查文件（只读）
- `src/modules/sandbox/LabWorkspace.tsx`（概念沙盒入口 + 疑似假按钮 span）
- `src/modules/sandbox/SandboxRenderer.tsx`（JSXGraph 渲染/拖点/clamp/paramValues 消费）
- `src/modules/sandbox/LeapLab.tsx`（4D 四维控制台 handler）
- `src/modules/sandbox/morphControllers.ts`（parseMorphingSpecs / compileMorphingSandboxConfig）
- `src/MathJuniorHome.tsx`（sandbox.db 读取映射）
- `data/sandbox.db`（concept_sandboxes 46 / leap_sandbox_models 36）、`data/core.db`（knowledge_points 107）
- SVG 资源目录（svg_asset 指向的图）

## 5. 可量化验收清单（Kiro 验收依据）
- [ ] 46 个概念沙盒**逐个**有交互点验记录（拖点/滑块/pill 三项结果齐全），无遗漏。
- [ ] 36 个跃迁模型**逐个**有四维控制台点验记录，无遗漏。
- [ ] 107 个知识点**逐个**有 name↔SVG↔语境自洽性判断；KP-023 单独复现并给结论。
- [ ] 82 个沙盒/模型的 知识点绑定 逐个核对。
- [ ] 参数→图形变化 按模板类型分类给出"哪些模板滑块生效、哪些失效"的明确结论。
- [ ] 每条问题归入 🔴开发遗漏 / 🟠数据错配 / 🟢设计如此 三类之一，带 文件路径+行号 或 沙盒ID+证据。
- [ ] 最终 RESULT 汇总为一份《沙盒诊断清单》，按三类分组，附一个"建议修复优先级"排序（P0阻断/P1重要/P2优化），供用户定夺。
- [ ] 附真机截图证据（至少覆盖：假按钮无响应、滑块调前后图形对比、KP-023 错配、四维控制台生效各若干张）。

## 6. 禁止事项（红线）
- ❌ 不改任何 `src/**` 源码；❌ 不写任何 `.db`；❌ 不改数据、不"顺手修一下"。
- ❌ 不照抄背景里 Kiro 的怀疑结论 —— 必须真机/查库**独立验证**，结论对就确认、不对就纠正。
- ❌ 不并发写文件到同一个 jsonl（每片写各自 partN.jsonl）。
- ❌ 8 片并发只读，无写库无写源码，无冲突；但仍禁止任何子 Agent 触碰数据库写操作。

## 7. 回写要求
1. 8 片各写 `tmp/diag_fe0012/part1.jsonl` ~ `part8.jsonl`。
2. 主 Agent 汇总为 `.kiro/relay/frontend/outbox/RESULT-FE-0012.md`（含三类分组清单 + 优先级排序 + 截图路径清单 + 统计：查了多少、发现多少🔴/🟠/🟢）。
3. 回写完成后把本任务 `status` 改为 `done`，并告知用户"TASK-FE-0012 完成"等待验收。
