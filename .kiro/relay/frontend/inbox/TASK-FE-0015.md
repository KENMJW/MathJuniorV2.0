---
id: TASK-FE-0015
line: frontend
status: assigned
attempt: 1
created_by: Kiro
exec_machine: 本机（主控机）
title: 模块二知识谱系重构 — 新建GraphNav(12谱系选择+4-tab) + 竖向泳道图 + 链接沙盒复用LeapLab + 母题步进+专项测评 + 沙盒viewport内容自适应 + 移除地铁图
model: default
concurrency: 3
---

> **执行方式（硬性，照 collaboration-protocol §7 + §8）**：
> - **本机执行**（主控机本地跑，完成后正常提交）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 3`（已经用户批准）：分**两阶段**——**阶段一** 3 个无依赖子块用单次 `invoke_subagent` 并发派 3 个子 Agent；**阶段二** 有依赖的整合由主 Agent 串行完成。
> - **本任务为前端交互/渲染任务，验收必须走真实浏览器 E2E（§8）**：执行方需在对话输入 `/browser 查收 NEXT.md 并执行验收` 启动真实浏览器验收，Console 全程零 Error / 零 wasm 失败 / 零 fallback。

# 任务：模块二「知识谱系」重构（前端线，本机执行）

## 🎯 任务本质
把模块二（当前 graph：6×12 SubwayMap 地铁图 + LineClosedLoop 闭环双视图）重构为**对齐模块一 ConceptNav 的 4-tab 单容器**：以 **12 条知识谱系（logic_lines）** 为选择单位，选定谱系后下方四大块联动：概念精讲 / 链接沙盒 / 谱系母题 / 专项测评。**完全移除 6×12 地铁图**。

> **完整设计依据（必须先读）**：`.kiro/specs/math-junior-frontend/module2-graph-refactor-design.md`（本任务的权威设计文档，所有交互/数据/复用/新建/修改细节以它为准）。

## 🔩 项目铁律（照现有前端规范）
- 铁律1/3：零 eval / 零 innerHTML；铁律2：零 foreignObject；铁律11：源码零 emoji，图标一律 `<Icon name=.../>`；铁律10：iOS 27 液态玻璃 Token。
- 公式上屏必须走 `<MathRenderer>`。
- 沙盒背景**统一黑底 `#0f172a`**（全系统一种标准，不许改白底）。

## 📐 五个交付块

### 块 A（阶段一·可并发）：沙盒 viewport 内容自适应（黑底不变，模型放大填满）
- **问题**：现在沙盒模型显示很小、四周大片黑色留白。根因：`src/engine/sandbox/viewport.ts` 的 `calculateViewport` 只用 DB `viewbox_spec_json` 的固定框（几乎全是 ±10），实际图元常只占 [-4,4]，被缩小留白；从不按实际内容包围盒自适应。
- **改法**：
  - `SandboxRenderer.tsx` 解析出实际 `drag_points_json` / carrier elements 后，遍历所有点/图元算真实 `minX/maxX/minY/maxY`，作为动态 baseBox 传入 `calculateViewport`（而非直接用 DB 固定框），再加 margin（12~15%），使模型放大填满画布。
  - 保留 `preserveAspectRatio`（圆/正方形不变形）。
  - 兜底：内容为空/异常/无有效点时回退 DB 固定框。
- **不改**：背景色（保留黑底 `#0f172a`）、图元描边配色、手拉手 SVG 分支（其独立 viewBox 已合适）。
- **受益**：模块一概念沙盒(LinkedSandboxSlot)、模块二链接沙盒(LeapLab)、实验室二 LeapLab 三处共用同一舞台，一次修复统一「黑底 + 内容最大化」。

### 块 B（阶段一·可并发）：LeapLab 加 `hideModelDrawer` prop
- `src/modules/sandbox/LeapLab.tsx` 新增 prop `hideModelDrawer?: boolean`。
- 为 true 时：**不渲染** 2 级抽屉盒全库模型切换器 + 搜索框 + 打开抽屉的入口按钮；只保留模型舞台 + 4D 变异控制台（① 载体 ② 参数 ③ 姿态 ④ X-Ray）。
- 保持向后兼容：prop 缺省/false 时行为完全不变（实验室二仍带全库抽屉）。

### 块 C（阶段一·可并发）：新建竖向泳道图组件 `LineSwimlane`
- 新建 `src/modules/graph/LineSwimlane.tsx`。
- **竖向布局**：按学期从上到下分 6 段（7上→7下→8上→8下→9上→9下）。
- 每段列出**该谱系包含的知识点中文名称**（同学期多个竖排排列）。
- 数据 props：接收该谱系的知识点列表（`knowledge_points WHERE primary_line_id=<谱系>`，每点 `name_zh + grade + semester`），组件内按 (grade, semester) 分组落段。
- **纯展示不可交互**（用户明确「只显示」）。
- 视觉：与四段卡一致的主题浅色文档卡（这是文档型泳道，非沙盒画布，不涉及黑底）；空学期段显示占位。

### 块 D（阶段二·串行·依赖 C）：新建 `GraphNav` 容器 + 概念精讲 tab
- 新建 `src/modules/graph/GraphNav.tsx`（对标 `src/ConceptNav.tsx` 结构）。
- 顶部 header：左侧「谱系选择胶囊」（显示当前谱系名+领域，点击唤起 12 谱系选择器，按领域分组复用 `LINE_CATEGORY_GROUPS`：数与代数 A1~A4 / 图形与几何 G1~G6 / 统计概率 S1,P1）；右侧 4 分段胶囊 tab（概念精讲/链接沙盒/谱系母题/专项测评），复刻 ConceptNav 的 `stage-segmented-control` 样式。
- 主体白卡大舞台，按 activeTab 切换（固定 minHeight 防 CLS）；切谱系时重置到「概念精讲」并置顶。
- 状态：`currentLineId` + `activeTab`，用 `useSessionStore` + `useState`；数据加载走 `dbClient`（core.db logic_lines / knowledge_points，master.db line_master，sandbox.db leap_sandbox_models，questions.db）。
- **概念精讲 tab**：左侧四段（源头基石/螺旋跃迁/思想方法/中考矩阵，复用 LineClosedLoop 现有四段卡片渲染，走 MathRenderer，数据 logic_lines 四段字段）+ 右侧嵌入块 C 的 `<LineSwimlane>`。

### 块 E（阶段二·串行·依赖 B/D）：接入其余 3 tab + 切换 MathJuniorHome + 移除地铁图
- **链接沙盒 tab**：嵌入 `<LeapLab modelId={该谱系 flagship_model_id} hideModelDrawer allModels={effectiveLeapModels} .../>`，锁定该谱系旗舰模型（来源 `logic_lines.flagship_model_id` 或 `FLAGSHIP_MODELS_BY_LINE`）。
- **谱系母题 tab**：用模块一 `PointMasterExample` 的步进解锁交互渲染 `line_master` 母题（master.db `example_type='line_master' AND bound_line_id=<谱系>`；dim1~dim4 逐维点击解锁）。
- **专项测评 tab**：`<LineQuickPractice>` 即答即判，**限 3 题**（该谱系覆盖考点的 questions，沿用抽题去重 presentedIds）。
- **MathJuniorHome.tsx**：`case "graph"` 改为渲染 `<GraphNav .../>`，传入 effectiveLines/dbPoints/effectiveLeapModels 等；**移除 SubwayMap 挂载 + graphSubView(map/line_loop) 双视图状态 + 顶部 map/line_loop 切换控制条**。SubwayMap.tsx 文件保留备用不删，仅解除模块二引用。

## 🧩 并发分片（concurrency=3）
- **阶段一**（单次 invoke_subagent 并发 3 个子 Agent，各自独立文件无冲突）：
  - 子Agent-1 → 块 A（viewport.ts + SandboxRenderer.tsx viewport 消费处）
  - 子Agent-2 → 块 B（LeapLab.tsx 加 hideModelDrawer prop）
  - 子Agent-3 → 块 C（新建 LineSwimlane.tsx）
- **阶段二**（主 Agent 串行，依赖阶段一产物）：块 D（GraphNav + 概念精讲）→ 块 E（其余 tab 接入 + MathJuniorHome 切换 + 移除地铁图）。
- 各子 Agent 若产出中间说明写 `tmp/fe0015/` 目录。

## ✅ 可量化验收清单（Kiro 据此验收 + E2E）
- [ ] 模块二入口渲染 `GraphNav`，**不再出现 6×12 地铁图**；无 map/line_loop 双视图切换条。
- [ ] 顶部谱系选择器含 12 条谱系（A1~A4/G1~G6/S1/P1），可切换；选定后 4-tab 联动该谱系。
- [ ] 概念精讲：四段（源头基石/螺旋跃迁/思想方法/中考矩阵）内容随谱系正确显示（走 MathRenderer）；右侧竖向泳道图按学期(7上~9下)竖排该谱系知识点中文名，纯展示。
- [ ] 链接沙盒：嵌入 LeapLab，**无全库模型抽屉/搜索框**，锁定该谱系旗舰模型；载体切换/参数滑块/姿态/X-Ray 四维控制可用，叠加作用同一舞台。
- [ ] 谱系母题：PointMasterExample 步进解锁（dim1→dim4 逐维解锁）正常。
- [ ] 专项测评：LineQuickPractice 即答即判，恰 3 题。
- [ ] **沙盒 viewport 内容自适应生效**：模型放大填满画布、无大片黑色留白；背景仍为黑底 `#0f172a`（未改白底）；圆/正方形不变形。
- [ ] `pnpm test` 全绿（不破坏现有单测；如涉及组件加必要测试）。
- [ ] **真实浏览器 E2E（§8）**：拉起 preview，实测切换谱系→四 tab 全部可交互、沙盒真库加载渲染、Console 全程零 Error/零 wasm 失败/零 fallback。RESULT 附 E2E 实测(截图/DOM/console 摘要)。

## 🚫 红线
- ❌ 不改沙盒背景色（黑底 `#0f172a` 全系统统一标准）。
- ❌ 不删 SubwayMap.tsx 文件（仅解除模块二引用，保留备用）。
- ❌ 零 eval/innerHTML/foreignObject/emoji；公式走 MathRenderer。
- ❌ 块 B 保持向后兼容：hideModelDrawer 缺省时实验室二 LeapLab 行为不变。
- ❌ 不碰数据层 db 文件 / core.db / 不改 .gitignore/目录结构。

## 📤 回写要求
1. 阶段一中间产物写 `tmp/fe0015/`（如有）。
2. 写 `.kiro/relay/frontend/outbox/RESULT-FE-0015.md`（五块各自完成情况 + 组件清单 + 单测结果 + **E2E 实测摘要**）。
3. 本任务书 `status` 改 `done`。
4. 本机提交：`git add`（改动的 src 文件、新增组件、本任务书、RESULT）→ commit → push origin dev。
5. 播报 `"TASK-FE-0015 完成"`，STANDBY 待命等验收。

## 7. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令（不自动死循环轮询）
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
