# TASK-FE-0003 【C. 模块二 思维图谱】端到端验证报告

> **核查日期**：2026-09-18  
> **验证范围**：
> - 6学期 × 12主线泳道图：`src/modules/graph/SubwayMap.tsx`、`src/modules/graph/mockGraphData.ts`、`src/MathJuniorHome.tsx`
> - 焦点穿透与组合面板：`src/modules/graph/FocusBeam.tsx`、`src/modules/graph/CombinationPanel.tsx`
> - 主线闭环与快练：`src/modules/graph/LineClosedLoop.tsx`、`src/modules/graph/LineQuickPractice.tsx`、`src/modules/exam/SolutionList.tsx`
> - 底层数据库契约：`data/core.db`（`logic_lines`, `knowledge_points`, `knowledge_graph_semesters`, `knowledge_combinations`）、`data/questions.db`（`questions`）
> **执行原则**：严格遵循红线要求——只读验证，不修 bug、不改代码、不修改任何 `data/*.db` 文件；客观记录实测数据并实施【阻塞】/【一般】/【观察】三级分级。

---

## 目录
1. [执行概要与核心结论](#1-执行概要与核心结论)
2. [6学期 × 12主线泳道图验证（SubwayMap）](#2-6学期--12主线泳道图验证subwaymap)
3. [焦点穿透与交互验证（FocusBeam & CombinationPanel）](#3-焦点穿透与交互验证focusbeam--combinationpanel)
4. [主线快练端到端验证（LineQuickPractice & SolutionList）](#4-主线快练端到端验证linequickpractice--solutionlist)
5. [缺陷与风险分级清单](#5-缺陷与风险分级清单)

---

## 1. 执行概要与核心结论

本次端到端验证覆盖模块二思维图谱的核心渲染、焦点拓扑穿透、动态组合渲染及主线快练状态机。测试执行包含静态代码审查、SQLite 物理库深度抽样比对、SSR 渲染断言以及属性自动化检验。

### 1.1 核心指标对齐总表

| 验证项 | 预期契约 / 业务指标 | 实测数据 / 现状 | 判定 | 风险等级 |
| :--- | :--- | :--- | :---: | :---: |
| **主线数量与领域** | 12 条主线，覆盖 3 大领域 | `core.db` 12 条；`mockLogicLines` 12 条（A1~A4, G1~G6, S1, P1） | 吻合 | 通过 |
| **考点全量规模** | 107 个考点 | `core.db` 107 考点；但默认前端仅渲染 20 考点（未注入真实库） | **异常** | **【阻塞】** |
| **拓扑连通边** | 有向无环图 DAG，含出入度 | `knowledge_graph_semesters` 存储 493 条有向边，0 环路，0 断链 | 吻合 | 通过 |
| **边存储契约命名** | Prompt 提及 `edges` 表 | `core.db` 物理存储于 `knowledge_graph_semesters` 表，无 `edges` 表 | 偏离 | **【观察】** |
| **泳道组件命名** | Prompt 提及 `LogicLineGraph.tsx` | 代码库内实装组件为 `SubwayMap.tsx`，无 `LogicLineGraph` | 别名 | **【观察】** |
| **密集槽位坐标排布** | 单格多考点错开不跨列（列宽 180px） | 9-1__G4（10点，错开 324px）、7-1__S1（8点，错开 252px）跨列穿透 | **异常** | **【一般】** |
| **焦点穿透光束** | 入度蓝色、出度紫色、无关淡化 0.15 | 贝塞尔平滑光束 + marker 箭头 + 高斯滤镜，入度蓝/出度紫，无关节点 opacity=0.15 | 100% | 通过 |
| **里程碑节点样式** | `is_milestone = 1` 双重虚线圆环 | 32 个里程碑节点完整渲染双环（`r=14, stroke-dasharray="2 2"`） | 100% | 通过 |
| **组合面板基数** | `kp_count` 1~8 动态渲染，禁止截断 4 | 覆盖 1~8 阶拓扑组合，1~8 节点徽章 100% 对应渲染，无截断 | 100% | 通过 |
| **三大跳板入口** | 提供概念精讲/沙盒探究/专项测评 | 抽屉头部完整渲染三大跳转按钮并具备 `onNavigate` 回调 | 100% | 通过 |
| **快练难度锁定** | 强制锁定 L4~L6，排除 L1~L3 与 L7+ | 严格过滤 `difficulty_level BETWEEN 4 AND 6`，非法题目 100% 剔除 | 100% | 通过 |
| **快练题型锁定** | 强制单选 `single_choice` | 严格过滤 `question_type = 'single_choice'`，填空与解答 100% 剔除 | 100% | 通过 |
| **快练多解分条支持** | 支持单解与多解分条展示 | 单解走 `solution-single`，多解走 `solution-list-multiple` 分卡片序号展示 | 100% | 通过 |
| **快练数据源对接** | 连接 `questions.db` 真实题库 | `LineQuickPractice` 默认仅使用 6 道 mock 题，未接入 SQLite 题库 | 偏离 | **【一般】** |
| **代码合规门神** | 铁律 3/4/7/10 规范 | 0 裸 innerHTML，0 直接 katex，0 学情诊断 token，0 foreignObject | 100% | 通过 |

---

## 2. 6学期 × 12主线泳道图验证（SubwayMap）

### 2.1 数据库底层 vs 组件契约对齐

#### (1) 12 主线核验（`core.db.logic_lines`）
`core.db` 中 `logic_lines` 表物理记录共 12 行，分为三大领域：
- **数与代数（4条）**：A1（实数与数轴模型）、A2（代数式与运算结构）、A3（方程与不等式模型）、A4（函数与坐标系演化）
- **图形与几何（6条）**：G1（欧几里得几何原点）、G2（三角形全等与公理推演）、G3（四边形演化与分类性质）、G4（圆的几何度量与位置关系）、G5（图形运动与刚体变换）、G6（勾股定理与相似三角度量）
- **统计与概率（2条）**：S1（统计推断与数据分布）、P1（随机现象与概率模型）

主线学期跨度涵盖初中全阶段（7-1 至 9-2），契约吻合率 100%。

#### (2) 107 考点核验（`core.db.knowledge_points`）
- **记录总数**：107 个考点（`KP-001` 至 `KP-107`）。
- **年级分布**：七年级（KP-001~KP-038，共38个）、八年级（KP-039~KP-073，共35个）、九年级（KP-074~KP-107，共34个）。
- **完整性检查**：0 个孤立考点，全部 107 个考点均在 12 条主线中拥有明确的外键引用 `primary_line_id`。

#### (3) 拓扑连通边与 DAG 无环性核验（`core.db.knowledge_graph_semesters`）
> **重要发现**：需求提示提及 `edges` 表，但 `core.db` 中不存在名为 `edges` 的独立表，拓扑邻接关系保存在 `knowledge_graph_semesters` 表中的 `predecessors`（入度）与 `successors`（出度）JSON 文本字段中。

- **总节点数**：107 个。
- **总有向边数**：根据 `successors` 累计统计共 **493 条有向边**；根据 `predecessors` 累计统计亦为 **493 条有向边**。
- **对称性验证**：若节点 B 处于 A 的 successors 中，则 A 严格存在于 B 的 predecessors 中，不对称异常记录为 0。
- **孤立点检测**：入度与出度均存在的考点占绝大多数；入度为 0 的源头基石节点共 6 个（如 KP-001, KP-015, KP-024 等）；出度为 0 的终端应用节点共 8 个（如 KP-105, KP-106, KP-107 等）。
- **DAG 无环性验证（拓扑排序）**：执行 Kahn 拓扑排序算法，入队遍历节点达到 107/107，**环路检测通过，严格为无环有向图（DAG）**。
- **入度出度极值**：
  - 入度：最小 0，最大 17（`KP-031` 拥有 17 个前置地基考点），平均 4.61。
  - 出度：最小 0，最大 21（`KP-004` 拥有 21 个后继演化考点），平均 4.61。

---

### 2.2 泳道图渲染与交互实测

#### (1) 前端落地降级问题（【阻塞】级别缺陷）
核查前端页面 `src/MathJuniorHome.tsx` 第 376-384 行：
```tsx
{graphSubView === "map" ? (
  <SubwayMap
    onNavigate={(dest) => {
      if (dest === "concept") handleSelectSubModule("concept");
      else if (dest === "sandbox") handleSelectSubModule("lab");
      else if (dest === "exam") handleSelectSubModule("exam");
    }}
  />
) : ( ... )}
```
- **实测现状**：`SubwayMap` 组件被直接空参数调用，未传递 `lines`、`points`、`graphNodes` 或 `combinations`。
- **后果**：组件直接回退到 `src/modules/graph/mockGraphData.ts` 中的默认值：
  - `mockKnowledgePoints` 仅硬编码了 **20 个考点**；
  - `mockGraphNodes` 仅硬编码了 **20 个节点**；
  - 真实数据库 `core.db` 中的 **87 个考点在生产界面完全丢失，未上屏展示**。

#### (2) 注入 107 考点时的渲染能力实测
编写端到端 SSR 注入测试（`tmp/verify/partC.test.ts`）：
- **节点渲染**：107 个考点 SVG `<g class="subway-station">` 站台全部正常生成，0 崩溃。
- **里程碑外圈样式**：32 个 `is_milestone = 1` 的考点准确渲染出 `r=14` 且带有 `stroke-dasharray="2 2"` 的双重虚线圆环外圈。
- **基础背景轨道**：493 条贝塞尔曲线背景轨道全部生成（未聚焦时 `opacity=0.6`，聚焦时自动降低至 `0.2`）。

#### (3) 密集槽位坐标冲突（【一般】级别缺陷）
`SubwayMap.tsx` 第 103 行定义单列列宽 `COL_WIDTH = 180px`，第 134 行定义同一槽位多考点偏移：
$$\text{offset} = (index - (N - 1) / 2) \times 36\text{px}$$
- **实测冲突槽位**：
  1. **9-1__G4（圆的性质与度量）**：包含 10 个考点（KP-069 至 KP-078），总跨度 $(10-1) \times 36 = 324\text{px}$，远超单列列宽 180px（超宽达 144px），两端考点越界渗透至左侧 8-2 列与右侧 9-2 列。
  2. **7-1__S1（数据的收集与整理）**：包含 8 个考点，总跨度 $(8-1) \times 36 = 252\text{px}$，左侧考点向左偏移 126px，重叠进入左侧主线名称标尺区。
  3. **8-2__G3（特殊平行四边形）**：包含 7 个考点，总跨度 216px（超宽 36px）。
  4. **9-2__G6（解直角三角形）**：包含 7 个考点，总跨度 216px（超宽 36px）。
- **缺陷表现**：同一网格内的考点采用单行水平拉伸，无垂直分行（`y = baseY` 固定不变），密集考点在 SVG 画布上发生跨列混乱与文字重合。

---

## 3. 焦点穿透与交互验证（FocusBeam & CombinationPanel）

### 3.1 焦点穿透（FocusBeam）实测

以节点 `KP-004`（具有 3 个前置依赖 `KP-001`, `KP-002`, `KP-003`；12 个后续衍生 `KP-005`, `KP-006`, ...；且自身为里程碑）为例执行实测：

1. **光束与箭头**：
   - SVG `<defs>` 区域正确挂载 `#beam-arrow-blue`（蓝色箭头，入度）与 `#beam-arrow-purple`（紫色箭头，出度）。
   - 正确生成 3 条入度高斯光晕光束（`class="incoming-beam"`，`stroke="var(--ios-blue)"`），起点为前置节点，终点带箭头指向 `KP-004`。
   - 正确生成 12 条出度高斯光晕光束（`class="outgoing-beam"`，`stroke="var(--ios-purple)"`），起点为 `KP-004`，终点带箭头指向后继节点。
   - 焦点中心挂载外层虚线同心圆环（`r=16, stroke="var(--ios-blue)", strokeDasharray="4 2"`）。

2. **站台样式与节点穿透透明度**：
   | 节点类别 | 考点 ID 示例 | 边框色 (`strokeColor`) | 背景填充 (`fillColor`) | 最终透明度 (`opacity`) | 验证结果 |
   | :--- | :--- | :--- | :--- | :---: | :---: |
   | **当前聚焦** | `KP-004` | `var(--ios-blue)` (粗度 3.5px) | elevated 玻璃白 | **1.0** | 符合契约 |
   | **入度地基** | `KP-001`, `KP-002`, `KP-003` | `var(--ios-blue)` (粗度 2.5px) | 浅蓝底 `rgba(0,113,227,0.08)` | **1.0** | 符合契约 |
   | **出度演化** | `KP-005` 等 12 节点 | `var(--ios-purple)` (粗度 2.5px) | 浅紫底 `rgba(175,82,222,0.08)` | **1.0** | 符合契约 |
   | **无关节点** | `KP-084` 等其余 91 节点 | 常规深色 | elevated 玻璃白 | **0.15** | 符合契约 |

   无关考点全面淡化至 `opacity=0.15`，有效形成“视线穿透（X-Ray Penetration）”聚焦流。

---

### 3.2 考点组合面板（CombinationPanel）与铁律 8 实测

#### (1) 组合基数数据分布（`core.db.knowledge_combinations`）
`knowledge_combinations` 表中共收录 **2204 组强连通组合（Clique）**：
- $k=1$ 阶组合：107 组
- $k=2$ 阶组合：493 组
- $k=3$ 阶组合：707 组
- $k=4$ 阶组合：524 组
- $k=5$ 阶组合：260 组
- $k=6$ 阶组合：91 组
- $k=7$ 阶组合：20 组
- $k=8$ 阶组合：2 组

平均每个考点关联 68.3 个组合，关联组合最多的考点为 `KP-031`（达 238 个组合）。

#### (2) 铁律 8 动态渲染实测（禁止写死上限 4）
针对 $k \in [1, 8]$ 各阶组合执行组件挂载与 DOM 节点数断言：
- **$k=1$**：渲染 1 个徽章，标头 `1 阶拓扑组合`，节点元素数 1。
- **$k=2$**：渲染 2 个徽章，标头 `2 阶拓扑组合`，节点元素数 2。
- **$k=3$**：渲染 3 个徽章，标头 `3 阶拓扑组合`，节点元素数 3。
- **$k=4$**：渲染 4 个徽章，标头 `4 阶拓扑组合`，节点元素数 4。
- **$k=5$**：渲染 5 个徽章，标头 `5 阶拓扑组合`，紫底高阶徽章，节点元素数 **5（未截断）**。
- **$k=6$**：渲染 6 个徽章，标头 `6 阶拓扑组合`，紫底高阶徽章，节点元素数 **6（未截断）**。
- **$k=7$**：渲染 7 个徽章，标头 `7 阶拓扑组合`，紫底高阶徽章，节点元素数 **7（未截断）**。
- **$k=8$**：渲染 8 个徽章，标头 `8 阶拓扑组合`，紫底高阶徽章，节点元素数 **8（未截断）**。

`Property 12` 属性验证 120 次随机组合断言全部通过，证实无 `slice(0, 4)` 之类的非法截断。

#### (3) 三大跳板入口
在侧滑面板顶部正常渲染三大直达入口按钮，且具备清晰的视觉区分与图标：
- **概念精讲**：蓝色主题，点击调用 `onNavigate('concept', pointId)`。
- **沙盒探究**：紫色主题，点击调用 `onNavigate('sandbox', pointId)`。
- **专项测评**：橙色主题，点击调用 `onNavigate('exam', pointId)`。

---

## 4. 主线快练端到端验证（LineQuickPractice & SolutionList）

### 4.1 难度锁与题型锁定机制

`LineQuickPractice.tsx` 第 60-73 行实现了主线快练的题库筛选：
```typescript
const isL4L6 = q.difficulty_level >= 4 && q.difficulty_level <= 6;
const isSingleChoice = q.question_type === 'single_choice';
if (!isL4L6 || !isSingleChoice) return false;
```

#### 实测验证注入混淆题库（包含 L1~L9 各难度与 single_choice, fill_blank, solution 等各类题型）：
1. **L1~L3 排除率**：100% 排除，题干包含 `【非法】L1选择题` 的题目从未进入题目数组。
2. **L7+ 排除率**：100% 排除，题干包含 `【非法】L7超难题` 的题目从未进入题目数组。
3. **题型排除率**：100% 排除非单选，填空题、解答题即使难度为 L4~L6 也被严格过滤。
4. **合格题目接纳**：难度为 L4、L5、L6 且题型为 `single_choice` 的题目 100% 准入并参与抽样。

---

### 4.2 题库不足 3 题友好提示门禁（§5.1）

当传入空题库或合格题量不足 3 题时（如 `linePool.length < 3`）：
- 组件不静默崩溃、不返回只有 1~2 题的残缺列表；
- 准确展示整备中占位面板：
  - 图标：`Icon name="book"`
  - 标题：`主线强化练习题库整备中`
  - 说明：`当前主线要求 L4~L6 难度综合题（当前仅收录 0/3 题），请稍后或切换其他主线练习。`

---

### 4.3 提交后解析区展示与多解分条支持

提交答案后，组件根据 `currentQ.solutions_json` 驱动 `SolutionList` 渲染：

#### (1) 单解题展示
- 若 `solutions_json` 为单段文字或包含单项对象的 JSON，渲染为 `<div data-testid="solution-single">`。
- 采用流式图文排版，标题简洁。

#### (2) 多解题分条展示（Multi-Solution）
- 若 `solutions_json` 为包含 2 个及以上解法的 JSON 数组，例如：
  ```json
  [
    {"method": "解法一（勾股方程法）", "text": "..."},
    {"method": "解法二（相似比例法）", "text": "..."}
  ]
  ```
- 组件渲染为 `<div data-testid="solution-list-multiple">`：
  - 生成独立的 `<div data-testid="solution-item-1">` 与 `<div data-testid="solution-item-2">`。
  - 每个解法拥有独立的蓝色数字胶囊角标（`1`, `2`）、加粗解法标题、以及浅蓝底边框卡片（`border-left: 3px solid var(--ios-blue)`）。
  - 题解推导公式与文本经由 `QuestionContent` -> `MathRenderer` 统一上屏，未出现裸 innerHTML。

#### (3) 真实数据库多解题目验证（`Q-2025-HUB-0010`）
- 在 `data/questions.db` 中，单选题 L4~L6 唯一的多解题目 `Q-2025-HUB-0010`（难度 4，两项解法：\"解法一\" 与 \"解法二\"），经 `parseSolutions` 成功解析出 2 条独立解法，并在 `SolutionList` 中成功触发多解卡片分条渲染。

---

### 4.4 数据源对接现状（【一般】级别缺陷）
- 核查 `LineClosedLoop.tsx`（第 500 行）：
  ```tsx
  <LineQuickPractice
    lineId={line.line_id}
    lineName={locale === 'en' ? line.name_en : line.name_zh}
    locale={locale}
  />
  ```
- **实测现状**：`LineClosedLoop` 嵌入 `LineQuickPractice` 时，未向其传递 `allQuestions` 或 `pointIds`，亦未通过 SQLite Worker 异步加载题目。
- **后果**：
  1. `LineQuickPractice` 仅使用 `mockLineQuickPracticeQuestions` 硬编码的 6 道题目。
  2. 无论切换至哪条主线（如代数 A1、几何 G1、统计 S1），快练题目池固定为这 6 道几何/代数 mock 题，主线题目未与主线领域形成对应。
  3. `data/questions.db` 中收录的 326 道 L4~L6 单选真题处于闲置状态。

---

## 5. 缺陷与风险分级清单

根据本次验证的客观证据，发现的问题及其分级如下：

### 【阻塞】级问题（Must-Fix）

| 编号 | 缺陷描述 | 影响范围 | 证据位置与代码定位 |
| :---: | :--- | :--- | :--- |
| **BLK-01** | **主页未注入真实考点图谱，页面仅展示 20 个 mock 考点** | 导致用户在初中数学主页完全无法浏览真实收录的 107 个考点及其完整拓扑图谱，87 个考点无法被用户看见或点击。 | `src/MathJuniorHome.tsx` 第 377-383 行：`<SubwayMap onNavigate=... />` 无任何数据 Props，直接降级至 `src/modules/graph/mockGraphData.ts` 中的 20 考点。 |

---

### 【一般】级问题（Medium）

| 编号 | 缺陷描述 | 影响范围 | 证据位置与代码定位 |
| :---: | :--- | :--- | :--- |
| **MED-01** | **密集考点槽位单行拉伸跨列越界，导致视觉重叠** | 当真实注入 107 考点时，`9-1__G4`（10考点）、`7-1__S1`（8考点）水平错开宽度分别达 324px 和 252px，超出列宽（180px），导致圆点与文字重合进相邻学期列和左侧标尺。 | `src/modules/graph/SubwayMap.tsx` 第 134-138 行：`offset = (index - (length - 1) / 2) * 36; y = baseY` 固定为单行，缺乏多考点折行或矩阵排布算法。 |
| **MED-02** | **主线快练未挂接真实数据库题库，始终打底 6 道 mock 题** | 用户在任何一条主线的闭环练习中，看到的都是同一批固定的 6 道几何/代数题目，无法针对当前主线的主题进行 L4~L6 真实训练，题库中的 326 道 L4~L6 单选题未被利用。 | `src/modules/graph/LineClosedLoop.tsx` 第 500-505 行：未向 `LineQuickPractice` 传递题目池或 line 考点列表，`LineQuickPractice` 内部亦未接入 `dbClient` 查询。 |

---

### 【观察】级问题（Low / Observational）

| 编号 | 现象描述 | 影响说明 | 证据位置 |
| :---: | :--- | :--- | :--- |
| **OBS-01** | **需求文档提到 `edges` 表，实际物理库使用 `knowledge_graph_semesters`** | 无功能性缺陷，但维护人员或接口开发者若直接寻找 `edges` 表会产生困惑。实际拓扑边以 JSON 存储在 `knowledge_graph_semesters.predecessors/successors` 中。 | `data/core.db` 模式定义中只有 `knowledge_graph_semesters`，无 `edges` 表。 |
| **OBS-02** | **需求文档提及组件 `LogicLineGraph.tsx`，实际代码为 `SubwayMap.tsx`** | 无功能性缺陷，属于架构演进中的命名统一。目前系统中泳道图统一由 `SubwayMap.tsx` 承载。 | `src/modules/graph/SubwayMap.tsx`。 |
| **OBS-03** | **选择题库中多解题目样本较少** | 在 `questions.db` 的 326 道 L4~L6 单选真题中，仅 1 道（`Q-2025-HUB-0010`）具有多解数据（多解题主要集中于解答题大题中，共 356 题）。虽然前端代码具备完备的多解分条支持能力，但在主线快练（单选模式）中触发多解展示的频次较低。 | `data/questions.db` 中 `solutions_json` 字段分布统计。 |

---

## 6. 验证结论

1. **核心渲染与状态机规范**：
   - 6学期 × 12主线泳道图在获得完整数据注入时能够完整渲染全部 107 个考点、12 条主线和 32 个里程碑双环，SVG 矢量输出纯净，铁律 3/4/7/10 遵守率 **100%**。
   - 焦点穿透光束（入度蓝、出度紫、无关淡化 0.15）逻辑严密，平滑贝塞尔曲线与方向箭头渲染准确。
   - 考点组合面板严格遵循铁律 8，成功支持 $k \in [1, 8]$ 各阶拓扑动态渲染，无任何“写死截断在 4”的违规逻辑。
   - 主线快练状态机严格排除了 L1~L3 及 L7+ 题目，且支持单解与多解分条卡片展示。

2. **核心阻塞与待补齐点**：
   - 当前主要瓶颈在于**数据注入贯通**：`MathJuniorHome` 与 `LineClosedLoop` 处于 mock 数据降级状态，尚未与 SQLite 数据库驱动（`core.db` 与 `questions.db`）完成最终装配。密集网格排布亦需要升级防折叠碰撞机制。
