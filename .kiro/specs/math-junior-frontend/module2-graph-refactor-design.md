# 模块二「知识谱系」重构设计文档

> 目标：把模块二（当前 graph 思维图谱：SubwayMap 地铁图 + LineClosedLoop 闭环双视图）重构为**对齐模块一 ConceptNav 的 4-tab 单容器范式**，以「12 条知识谱系」为选择单位，选定谱系后下方四大块联动：概念精讲 / 链接沙盒 / 谱系母题 / 专项测评。
> 状态：方案已与用户逐点确认（2026-09-22）。待审阅后拆前端 relay 任务执行。

---

## 一、整体交互（对标模块一 ConceptNav）

### 1.1 容器与选择单位
- **新建独立容器组件 `GraphNav`**（对标 `src/ConceptNav.tsx`），替换 `MathJuniorHome.tsx` 中 `case "graph"` 当前内联的 SubwayMap/LineClosedLoop 双视图。
- **选择单位 = 12 条知识谱系（logic_lines）**，非考点、非单模型。顶部选择器像模块一选考点那样，选定 1 条谱系（A1~A4 / G1~G6 / S1 / P1）。
- 选定谱系后，下方 4-tab 全部联动该谱系：
  1. 概念精讲（谱系四段 + 右侧竖向泳道图）
  2. 链接沙盒（该谱系旗舰模型 4D 变异，同一舞台叠加演化）
  3. 谱系母题（步进解锁）
  4. 专项测评（即答即判 3 题）

### 1.2 顶部结构（复刻 ConceptNav header）
- 左侧：谱系选择胶囊按钮（显示当前谱系名 + 领域，如「G4 圆的度量 · 图形与几何」），点击唤起谱系选择器（12 条按领域分组：数与代数 A1~A4 / 图形与几何 G1~G6 / 统计与概率 S1,P1，复用现有 `LINE_CATEGORY_GROUPS`）。
- 右侧：4 个分段胶囊 tab（概念精讲 / 链接沙盒 / 谱系母题 / 专项测评），复刻 ConceptNav 的 `stage-segmented-control` 样式。
- 主体：白卡大舞台，按 activeTab 切换四大块（固定 minHeight 防 CLS）。

### 1.3 状态
- `currentLineId`（当前谱系）+ `activeTab`（4 选 1），沿用 Zustand `useSessionStore` + 局部 `useState`。
- 切换谱系时重置 tab 到「概念精讲」并置顶（对齐 ConceptNav 行为）。

---

## 二、四大块设计

### 2.1 概念精讲（Lecture + 右侧竖向泳道图）
- **左侧四段**：源头基石 / 螺旋跃迁路径 / 核心思想方法 / 中考压轴矩阵。
  - 数据：core.db `logic_lines` 的 `origin_foundation_zh/en`、`spiral_leaps_zh/en`、`methodology_zh/en`、`exam_matrix_zh/en`（12 条已全部 `content_status='done'`，中英齐备）。
  - 复用 `LineClosedLoop` 现有 lecture 四段卡片渲染（走 MathRenderer）。
- **右侧竖向单谱系泳道图（新建组件 `LineSwimlane`）**：
  - 替代模块一 ConceptFourStages 右侧 `SvgLayerReveal` 的位置。
  - **竖向布局**：按学期从上到下分段（7上 → 7下 → 8上 → 8下 → 9上 → 9下）。
  - 每段列出**该谱系包含的知识点中文名称**（竖排可容纳同学期多个知识点）。
  - 数据：core.db `knowledge_points WHERE primary_line_id = <谱系>` ，每点带 `name_zh + grade + semester`，按 (grade, semester) 分组落到对应学期段。
  - **纯展示、不可交互**（用户明确「只显示」）。
  - 视觉：黑底/深色统一沙盒标准之外这是文档型泳道，用主题浅色卡即可（与四段卡一致），非沙盒画布。

### 2.2 链接沙盒（复用 LeapLab，同一舞台叠加演化）
- **嵌入现有 `<LeapLab>`**（`src/modules/sandbox/LeapLab.tsx`），它已实现「同一模型舞台 + 载体形态切换 + 参数滑块 + 姿态 + X-Ray 叠加」——正是用户要的交互（有的调参数、有的切变形形态，都作用在同一模型上）。
- **旗舰模型来源**：该谱系的 `logic_lines.flagship_model_id`（或 FLAGSHIP_MODELS_BY_LINE 映射）→ 传 `<LeapLab modelId={flagshipId} .../>`。
- **必须精简（用户明确 B）**：隐藏 LeapLab 自带的「2 级抽屉盒全库模型切换器 + 搜索框」，链接沙盒里**锁定该谱系旗舰模型**，只保留 4D 变异控制台（① 载体变异 ② 参数变异 ③ 姿态变异 ④ X-Ray）。
  - 实现：给 LeapLab 加一个 prop（如 `lockModel?: boolean` / `hideModelDrawer?: boolean`），为 true 时不渲染抽屉与切换入口。

### 2.3 谱系母题（步进解锁，对齐模块一）
- 复用模块一 `PointMasterExample` 的**步进解锁交互**（`unlockedDimensions: Set<number>`，dim1 直观源头 → dim2 数学本质 → dim3 严谨推导 → dim4 变式陷阱，逐维点击解锁）。
- 数据：master.db `master_examples WHERE example_type='line_master' AND bound_line_id=<谱系>`（字段 dim1_origin/dim2_essence/dim3_rigor/dim4_traps 齐备）。
- 现状 LineClosedLoop 的 master tab 是「1~4 维自适应展示」，非步进解锁 → 改造为 PointMasterExample 式解锁。

### 2.4 专项测评（轻量即答即判 3 题）
- 复用 `<LineQuickPractice>`（`src/modules/graph/LineQuickPractice.tsx`），即答即判，**限 3 题**。
- 数据：questions.db 该谱系覆盖考点的题（`primary_point_id ∈ 该谱系考点集合`），沿用现有抽题去重（`presentedIds`）。
- 用户明确「类考点测评、轻量版、3 题」——不做完整组卷/雷达图。

---

## 三、全局渲染修复（黑底统一 + 内容最大化）

> 用户明确：**背景色保持黑色（`#0f172a`），与实验探究 LeapLab 统一一种标准，不改白底**。问题只在「模型显示太小、四周大片黑色留白」。

### 3.1 只修 viewport 内容自适应（不动背景色）
- **保留** `SandboxRenderer.tsx` 黑底 `#0f172a` 与现有 axis/grid/图元高对比配色（全系统沙盒统一标准）。
- **改 `src/engine/sandbox/viewport.ts` 的 `calculateViewport`**：新增「按实际内容包围盒自适应」能力。
  - 现状：只用 DB `viewbox_spec_json` 的固定框（几乎全是 ±10），实际图元常只占 [-4,4]，被缩小 + 留白。
  - 改法：在 `SandboxRenderer` 解析出实际 `drag_points_json` / carrier elements 后，遍历所有点/图元算真实 `minX/maxX/minY/maxY` 作为动态 baseBox 传入 `calculateViewport`（而非直接用 DB 固定框），再加 margin（如 12~15%），使模型放大填满画布。
  - 保留 `preserveAspectRatio`（圆/正方形不变形）。
  - 兜底：内容为空或异常时回退 DB 固定框。
- **受益范围**：模块一概念沙盒（LinkedSandboxSlot）、模块二链接沙盒（LeapLab）、实验室二 LeapLab 共用同一 SandboxRenderer + viewport，一次修复三处统一「黑底 + 内容最大化」。

### 3.2 不改的
- 背景色（黑）、图元描边色、手拉手 SVG 分支（独立 viewBox 已合适）。

---

## 四、组件复用与新建清单

### 可直接复用（零改或极小改）
| 组件 | 用途 | 改动 |
|---|---|---|
| `LineClosedLoop` lecture 四段 | 概念精讲左侧四段 | 抽取/复用四段卡片渲染 |
| `LeapLab` | 链接沙盒 4D 变异舞台 | 加 `hideModelDrawer` prop 隐藏全库抽屉 |
| `PointMasterExample` | 谱系母题步进解锁 | 喂 line_master 数据 |
| `LineQuickPractice` | 专项测评 3 题 | 限 3 题 |
| `LINE_CATEGORY_GROUPS` | 谱系选择器分组 | 复用 |
| `SandboxRenderer` / `compileMorphingSandboxConfig` | 底层舞台 + 4D 编译 | 不改（除 viewport） |
| `useSessionStore` / `MathRenderer` / `Icon` | 状态/公式/图标 | 复用 |

### 需新建
| 组件 | 用途 |
|---|---|
| `GraphNav`（容器） | 对标 ConceptNav，谱系选择 + 4-tab 切换 + 数据加载 |
| `LineSwimlane`（竖向泳道图） | 概念精讲右侧，按学期竖排该谱系知识点中文名，只显示 |

### 需修改
| 文件 | 修改 |
|---|---|
| `src/engine/sandbox/viewport.ts` | `calculateViewport` 加内容包围盒自适应 |
| `src/modules/sandbox/LeapLab.tsx` | 加 `hideModelDrawer` prop |
| `src/MathJuniorHome.tsx` | `case "graph"` 改为 `<GraphNav .../>`，传入 effectiveLines/dbPoints/effectiveLeapModels 等 |

### 现有 SubwayMap 地铁图去留（已定：A 完全移除）
- **用户确认 A：完全移除 6×12 SubwayMap 地铁图**，模块二主视图即 GraphNav 4-tab。
- MathJuniorHome `case "graph"` 不再挂 SubwayMap；相关 graphSubView(map/line_loop) 双视图状态与切换控制条一并移除。
- SubwayMap.tsx 组件文件可保留在库中备用（不删文件），但不再从模块二入口引用。其原有的跳转回调（onSelectLineClosedLoop/onOpenFlagshipModel/onNavigate）逻辑若 GraphNav 需要（如链接沙盒进 4D、跳 concept/exam），在 GraphNav 内以新形式实现，不依赖地铁图。

---

## 五、数据来源速查
- core.db `logic_lines`：12 谱系，四段精讲字段 + `flagship_model_id` + `master_example_id`
- core.db `knowledge_points WHERE primary_line_id=?`：该谱系知识点（泳道图，带 grade/semester）
- sandbox.db `leap_sandbox_models`：旗舰模型 4D 变异 json
- master.db `master_examples WHERE example_type='line_master'`：谱系母题
- questions.db `questions`：专项测评抽题

---

## 六、方案状态：全部确认（2026-09-22）
所有设计点已与用户逐一确认，方案闭环，可拆前端 relay 任务执行：
- 整体交互（GraphNav 12 谱系选择 + 4-tab）✓
- 概念精讲（四段 + 竖向泳道图 LineSwimlane 只显示）✓
- 链接沙盒（复用 LeapLab，隐藏全库抽屉，锁定谱系旗舰模型，同一舞台叠加演化）✓
- 谱系母题（PointMasterExample 步进解锁）✓
- 专项测评（LineQuickPractice 即答即判 3 题）✓
- 渲染修复（保留黑底 #0f172a 统一标准，只修 viewport 内容自适应放大填满）✓
- SubwayMap 地铁图完全移除（A）✓

> **E2E 验收要求**：本模块涉及沙盒真库加载 + 交互渲染，按 collaboration-protocol §8，验收必须走真实浏览器 E2E（`/browser`），Console 零 Error / 零 wasm 失败 / 零 fallback，非只单测。
