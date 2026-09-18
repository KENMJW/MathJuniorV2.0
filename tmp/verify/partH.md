# TASK-FE-0003 【H. 内容生成 5.x 产出物真实渲染核实】端到端验证报告

> **验证模式**：只读验证（无任何代码修改，无任何数据库写操作）  
> **验证基准**：数据线阶段二回填入库资产（`core.db` 考点 107 全 done、主线 12 全 done；`master.db` 母题 119 全 done；`sandbox.db` 46+36 完整配置）  
> **报告归档路径**：`tmp/verify/partH.md`  
> **验证执行日期**：2026-09-18  

---

## Executive Summary (终极结论速览)

| 验证维度 | 库内实际储备 (阶段二产出) | 前端运行时实际消费源 | 真实内容渲染对齐率 | 严重级别 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 模块一四段论** | `core.db` (107 考点四段精讲全 done) | `mockPoints.ts` (写死 20 条静态 Mock) | **0%** (未读真库，考点缺失 81.3%，ID 错位) | **【阻塞】** |
| **2. 母题步进** | `master.db` (119 母题四维全 done，dim3 必填) | `ConceptNav.tsx` (硬编码假题 + 模板拼接) | **0%** (未读真库，119 道压轴真题全被架空) | **【阻塞】** |
| **3. 主线闭环** | `core.db` (12 条主线四段闭环全 done) | `mockGraphData.ts` (写死 12 条短字符串 Mock) | **0%** (未读真库，线名称与旗舰模型全面脱节) | **【阻塞】** |
| **4. 沙盒与跃迁** | `sandbox.db` (46 沙盒 + 36 跃迁模型配置) | 本地 TS 硬编码 (仅 4 个沙盒 + 2 个跃迁模型) | **0%** (未读真库，82 个声明式配置全被架空) | **【阻塞】** |

**核心定论**：  
**前端当前运行与消费的内容 100% 为“Mock 空壳”，真实 SQLite 数据库（`core.db`、`master.db`、`sandbox.db`）中的名师级生成内容在前端链路中处于完全断开、完全被架空状态。** 尽管底层存在 Web Worker SQLite 架构，但没有任何上层 UI 组件与之接驳。

---

## 一、模块一四段论（ConceptFourStages.tsx / ConceptNav.tsx）核实

### 1. 渲染链路调用栈追踪

1. **入口挂载**：在 `src/MathJuniorHome.tsx` 第 299 行中：
   ```tsx
   case "concept":
   default:
     return <ConceptNav />;
   ```
   **未传递任何 props**。
2. **默认参数回退**：在 `src/ConceptNav.tsx` 第 127-132 行中：
   ```tsx
   export const ConceptNav: React.FC<ConceptNavProps> = ({
     knowledgePoints = mockKnowledgePointRecords,
     initialPointId = "KP-023",
     onSelectPoint,
     className = "",
   }) => {
   ```
   直接回退到静态引入的 `mockKnowledgePointRecords`（源自 `src/modules/concept/mockPoints.ts`）。
3. **主展台投递**：在 `src/ConceptNav.tsx` 第 515 行中：
   ```tsx
   {activeSubTab === "stages" && (
     <ConceptFourStages knowledgePoint={currentPoint} />
   )}
   ```
   `currentPoint` 来源于 `mockKnowledgePointRecords.find(...)`。
4. **数据库调用情况**：全局检索发现，整个 `src/` 中 **没有任何一处业务代码调用 `dbClient.query('knowledge_points', ...)`**。

### 2. 真实库 vs 前端渲染逐字比对

#### (1) 样本一：`KP-001`
- **`core.db` 真实字段（100% 完成）**：
  - `name_zh`: `有理数的概念与分类`
  - `origin_story_zh`: `自然数满足了人类计数的本能，但当面对商业交易中的盈余与亏损、地理测量上海平面之上的海拔与之下的深度时，单向的数系遇到了度量瓶颈。为了在数学上统一刻画具有相反意义的量，负数应运而生；同时，为了平分物体产生分数，进而将整数与分数统合为可以精确表达比值关系的'有理数'（源自希腊语Ratio，即可以写成两整数之比的数）。` (167 字)
  - `intuitive_essence_zh`: `有理数的直观本质是'方向与刻度'的统一。任何有理数都包含符号（指示顺逆、盈亏的方向）与绝对值（指示距离基准零点的刻度大小）。零不再仅仅代表'没有'，而是作为平衡的基准对称原点。` (93 字)
  - `formal_definition_zh`: `能够表示为两个整数之比形式 $\frac{p}{q}$（其中 $p, q \in \mathbb{Z}$ 且 $q \neq 0$）的数称为有理数。有理数集 $\mathbb{Q}$ 可按定义划分为整数（正整数、零、负整数）与分数（正分数、负分数），亦可按正负性质划分为正有理数、零与负有理数。有限小数与无限循环小数均属于有理数。` (149 字)
  - `intrinsic_variation_zh`: `变式考查聚焦分类讨论的完备性与小数属性转化：(1) '0是最小的有理数'为典型假命题（忽略负有理数）；(2) 无限循环小数通过等比级数或方程法化为分数的机制；(3) 边界极端态：0既不是正数也不是负数，是正负数的分界骨架。` (117 字)

- **前端当前实际渲染内容（`mockPoints.ts`）**：
  - `name_zh`: `有理数与数轴` ❌ *(名称不一致)*
  - `origin_story_zh`: `度量现实中方向相反的量，诞生了负数概念。` ❌ *(仅 20 字简略 Mock)*
  - `intuitive_essence_zh`: `数轴是一条规定了原点、正方向和单位长度的直线。` ❌ *(仅 24 字)*
  - `formal_definition_zh`: `整数和分数统称为有理数。数轴上的点与有理数一一对应。` ❌ *(仅 28 字)*
  - `intrinsic_variation_zh`: `相反数在数轴上关于原点对称，和为 0。` ❌ *(仅 18 字)*

#### (2) 样本二：`KP-023`（致命数据错位）
- **`core.db` 真实字段（权威口径）**：
  - `point_id`: `KP-023`
  - `name_zh`: **`配方法`**
  - `grade`: `9` | `semester`: `1` | `domain`: `数与代数` | `primary_line_id`: `A3`
  - `origin_story_zh`: `并非所有一元二次方程天然就是完全平方形态，大多数方程如 $x^2 + 6x + 5 = 0$ 都是混杂的。波斯数学家阿尔·花拉子米通过在正方形两边各补一个矩形、再在角上补一个小正方形的几何拼图法，发明了'配方法'。配方法是推导求根公式与二次函数顶点式的万能母机。`
  - `intuitive_essence_zh`: `配方法的本质是'补齐几何正方形缺失的右下角'。一次项系数的一半的平方 $(\frac{b}{2a})^2$，恰恰就是让二维多项式形成闭合正方形所精确缺失的那块面积补丁。`
  - `formal_definition_zh`: `通过在方程两边加上一次项系数一半的平方，将一般方程化为 $(x+m)^2 = n$ 形式的方法。配方法标准流程：(1) 化二次项系数为 1（两边同除以 $a$）；(2) 移常数项到等号右边；(3) 两边同时加上'一次项系数一半的平方'；(4) 左边写作完全平方，右边化简；(5) 直接开平方降次求解。`
  - `intrinsic_variation_zh`: `中考核心考查：(1) 二次三项式最值与恒正性证明：$x^2 - 4x + 7 = (x-2)^2 + 3 \geq 3$；(2) 几何动点最值分析；(3) 陷阱：二次项系数不为 1 时漏除以 $a$ 便盲目加一次项一半的平方。`

- **前端当前实际渲染内容（`mockPoints.ts`）**：
  - `point_id`: `KP-023`
  - `name_zh`: **`勾股定理及其逆定理`** ❌ *(严重张冠李戴！)*
  - `grade`: `8` | `semester`: `1` | `domain`: `图形与几何` | `primary_line_id`: `G4` ❌
  - `origin_story_zh`: `古巴比伦泥板与商高答周公，直角三角形边长平方和的几何发现与测量需求。` ❌
  - `intuitive_essence_zh`: `直角三角形两直角边的正方形面积之和恒等于斜边上的正方形面积：$a^2 + b^2 = c^2$。` ❌
  - *注：在真实 `core.db` 中，“勾股定理及其逆定理”的真实 ID 为 **`KP-057`**（8年级下学期，图形与几何，G6）。前端 Mock 将其手工篡改赋给 KP-023，导致概念拓扑完全失真。*

#### (3) 样本三：`KP-002`
- **`core.db`**：`name_zh`: `数轴`；`origin_story_zh` 深入阐述笛卡尔数形统一思想史（135字）；`formal_definition_zh` 严格定义三要素与实数一一对应（116字）。
- **前端渲染**：`name_zh`: `绝对值的代数与几何意义` ❌；四段内容全为 15~20 字的占位草稿 ❌。

### 3. 容量统计断层
- `core.db` `knowledge_points` 实际数量：**107 个**（全部 content_status = 'done'，四段精讲全满）。
- 前端 `mockPoints.ts` 实际数量：**仅 20 个**（KP-001 到 KP-050 中抽取 20 个）。  
  **87 个知识点（占总量 81.3%）在前端根本不存在，无法通过导航访问。**

---

## 二、母题步进（PointMasterExample.tsx）核实

### 1. 渲染链路与数据源追踪

在 `src/ConceptNav.tsx` 第 33-63 行中：
```tsx
function getMasterExampleForPoint(point: KnowledgePointRecord): MasterExampleItem {
  if (point.point_id === "KP-023") {
    return {
      example_id: "ME-KP023",
      example_type: "point_master",
      bound_target_id: "KP-023",
      source: "中考经典真题题眼模型",
      stem_zh: "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$a=3, b=4$，求斜边 $c$ 及斜边上的高 $h$。",
      stem_en: "In $\\text{Rt}\\triangle ABC$ with $\\angle C = 90^\\circ, a=3, b=4$, find hypotenuse $c$ and altitude $h$.",
      dim1_origin: "源自古代测量中直角三角形面积与斜边投影的比例需求。",
      dim2_essence: "勾股定理结合等面积法：$S = \\frac{1}{2}ab = \\frac{1}{2}ch$。",
      dim3_rigor: "由勾股定理 $c = \\sqrt{a^2 + b^2} = \\sqrt{3^2 + 4^2} = 5$；由面积恒等式 $ab = ch$ 得 $h = \\frac{3 \\times 4}{5} = 2.4$。",
      dim4_traps: "警惕未指明直角边与斜边时可能产生的双解情况。",
      available_dimensions: 4,
    };
  }

  return {
    example_id: point.master_example_id || `ME-${point.point_id}`,
    example_type: "point_master",
    bound_target_id: point.point_id,
    source: `${point.name_zh} · 中考母题精解`,
    stem_zh: `已知关于【${point.name_zh}】的典型数学应用：试运用相关公理与定理进行严格推导求解。`,
    dim1_origin: point.origin_story_zh,
    dim2_essence: point.intuitive_essence_zh,
    dim3_rigor: point.formal_definition_zh || "由相关公理体系与定义严格可得。",
    dim4_traps: point.intrinsic_variation_zh || "注意临界边界与反例检验。",
    available_dimensions: 4,
  };
}
```

### 2. dim3_rigor 恒显示核实
- 在 `src/modules/concept/PointMasterExample.tsx` 第 316-321 行：
  ```tsx
  const isUnlocked = dim.index <= unlockedLevel;
  const isMandatoryDim3 = dim.isMandatory === true; // dim3_rigor 恒必展示 (CT-6)
  const shouldRender = isUnlocked || isMandatoryDim3;
  ```
  **结论**：`dim3_rigor` 在 UI 交互与渲染判定层面**确实实现了恒显示**（初始状态即渲染）。

### 3. 数据真实性逐字比对（`ME-KP023`）

- **`master.db` 真实母题（100% 真中考题）**：
  - `example_id`: `ME-KP023` (绑定 `KP-023` 配方法)
  - `stem_zh`: `已知关于 $x$ 的一元二次方程 $x^2 - (2m-1)x + m^2 - 1 = 0$ 有两个不相等的实数根。(1) 求 $m$ 的取值范围；(2) 若方程的两个实数根满足 $x_1^2 + x_2^2 = 11$，求 $m$ 的值。`
  - `dim1_origin`: `本题针对考点【配方法】的核心考查要求进行命题设计。直观源自方程几何配方与根系判别式约束...`
  - `dim2_essence`: `本题解题题眼与核心等量关系：配方法的本质是'补齐几何正方形缺失的右下角'。结合韦达定理 $x_1+x_2 = 2m-1, x_1x_2 = m^2-1$，将平方和化归为 $(x_1+x_2)^2 - 2x_1x_2$...`
  - `dim3_rigor`: `第一步判别式校验：$\Delta = [-(2m-1)]^2 - 4(m^2-1) = -4m + 5 > 0 \implies m < \frac{5}{4}$。第二步代数变形：$x_1^2 + x_2^2 = (x_1+x_2)^2 - 2x_1x_2 = (2m-1)^2 - 2(m^2-1) = 2m^2 - 4m + 3 = 11 \implies 2m^2 - 4m - 8 = 0 \implies m^2 - 2m - 4 = 0$。配方得 $(m-1)^2 = 5 \implies m = 1 \pm \sqrt{5}$。因为 $m < \frac{5}{4} = 1.25$，而 $1 + \sqrt{5} \approx 3.236 > 1.25$（舍去），$1 - \sqrt{5} \approx -1.236 < 1.25$（符合）。故 $m = 1 - \sqrt{5}$。`
  - `dim4_traps`: `解题易错陷阱与中考变式迁移：(1) 忽略判别式 $\Delta > 0$ 约束导致增根不舍；(2) 配方时一次项系数一半计算错误；(3) 韦达定理公式符号混淆。`

- **前端当前实际渲染内容（`ConceptNav.tsx` 硬编码）**：
  - `stem_zh`: `在 $\text{Rt}\triangle ABC$ 中，$\angle C = 90^\circ$，$a=3, b=4$，求斜边 $c$ 及斜边上的高 $h$。` ❌
  - `dim1_origin`: `源自古代测量中直角三角形面积与斜边投影的比例需求。` ❌
  - `dim2_essence`: `勾股定理结合等面积法：$S = \\frac{1}{2}ab = \\frac{1}{2}ch$。` ❌
  - `dim3_rigor`: `由勾股定理 $c = \\sqrt{a^2 + b^2} = \\sqrt{3^2 + 4^2} = 5$；由面积恒等式 $ab = ch$ 得 $h = \\frac{3 \\times 4}{5} = 2.4$。` ❌
  - `dim4_traps`: `警惕未指明直角边与斜边时可能产生的双解情况。` ❌

### 4. 其他 118 道母题现状
对于除 KP-023 外的所有其他考点，前端直接取知识点自身的四段精讲文本，拼凑成假母题（题干全为：“*已知关于【XXX】的典型数学应用：试运用相关公理与定理进行严格推导求解。*”）。  
**`master.db` 库内 119 道四维齐全、含正解与中考真题来源的名师母题全部未被读取！**

---

## 三、主线闭环（LineClosedLoop.tsx）核实

### 1. 渲染链路与数据源追踪

1. 在 `src/MathJuniorHome.tsx` 第 385-393 行：
   ```tsx
   <LineClosedLoop
     line={mockLogicLines.find((l) => l.line_id === selectedLineId) || mockLogicLines[0]}
     onOpenFlagshipModel={(modelId) => {
       setSelectedLeapModelId(modelId);
       handleSelectSubModule("lab");
       setLabSubView("leap_4d");
     }}
     onBackToMap={() => setGraphSubView("map")}
   />
   ```
2. 在 `src/modules/graph/LineClosedLoop.tsx` 第 6 行中：
   引入并使用 `src/modules/graph/mockGraphData.ts` 的 `mockLogicLines` 与 `mockLineMasterExamples`。
3. **数据库调用情况**：全局无任何组件查询 `core.db` 的 `logic_lines` 表。

### 2. G4 主线真实库 vs 前端渲染逐字比对

| 字段 | `core.db` `logic_lines` 真实字段 | 前端实际渲染内容 (`mockGraphData.ts`) | 对齐结论 |
| :--- | :--- | :--- | :--- |
| **line_id** | `G4` | `G4` | ID 一致 |
| **name_zh** | **`圆的几何度量与位置关系`** | **`几何度量与勾股演进`** | ❌ **严重不符** |
| **semester_span** | `9-1` | `8-1 ~ 9-2` | ❌ **学期跨度不符** |
| **flagship_model_id** | **`LM-9A-24`** | **`LM-8A-01`** | ❌ **旗舰模型不符** |
| **origin_foundation_zh** | 空间两点间的距离是一维几何度量的根基，而平面直角坐标系中的欧氏距离正是勾股定理在笛卡尔平面的全息投影。勾股定理连接了线性的一维长度与二次的二维面积，圆则是到定点距离为定长的终极等距闭合轨迹。垂径定理在圆内筑起了勾股直角三角形，切线在圆周锁定了正交几何边界。(123 字) | 从直观长度测量到面积割补证明。(15 字) | ❌ **Mock 占位符** |
| **spiral_leaps_zh** | 8上攻克勾股定理及其逆定理、勾股数与网格距离 $\to$ 8下应用勾股方程解决平面折叠动点 $\to$ 9上全面建立圆的几何体系（圆周角定理、垂径定理、切线判定性质、切线长定理、内切圆外接圆） $\to$ 9下中考折叠圆弧与隐形圆轨迹压轴统摄。(112 字) | 平面勾股 $\to$ 空间距离 $\to$ 向量点积与解析几何度量。(26 字) | ❌ **Mock 占位符** |
| **methodology_zh** | 核心思想方法：(1) '方程建模思想'：在直角三角形中设未知数，利用勾股定理列二次方程求解几何未知量；(2) '圆中核心直角三角形'：圆心、半弦长、弦心距三者构成的 $r^2 = d^2 + (a/2)^2$ 恒等解题武器；(3) '辅助线口诀'：遇直径造直角，有交点连半径证垂直，无交点作垂直证半径。(143 字) | 数形结合、方程建模、构造辅助线化归。(18 字) | ❌ **Mock 占位符** |
| **exam_matrix_zh** | 中考命题矩阵：(1) 勾股定理与折叠翻折计算大题；(2) 圆的切线证明与线段长计算（中考第 19~21 题解答必考大题）；(3) 弧长扇形面积与阴影割补；(4) 几何压轴大题中的'隐形圆'动点轨迹模型（定边对定角、定点定长半径、直角对直径动点最值）。(124 字) | 几何折叠勾股方程、折痕极值、最短路径动点综合。(24 字) | ❌ **Mock 占位符** |

### 3. 主线压轴母题（`ME-LINE-G4`）比对
- **`master.db` 真实真题**：`Rt\triangle ABC` 内接于 `\odot O`，$\angle C = 90^\circ$，$AC = 6$，$BC = 8$。$P$ 为优弧 $AB$ 动点，求四边形 $PACB$ 面积最大值。（纯正圆与隐形圆几何压轴题，配完整四维解析与 26% 中考实测得分率）。
- **前端实际渲染**：`mockLineMasterExamples['ME-LINE-G4']` 渲染矩形折叠求折痕极值题（占位 Mock）。

---

## 四、沙盒配置（SandboxRenderer.tsx / morphControllers.tsx）核实

### 1. 实验室一：概念沙盒（`concept_sandboxes`）
- **`sandbox.db` 真实储备**：**46 个概念沙盒**，涵盖数轴动点、函数旋转、绝对值距离、勾股面积等完整 DSL（含 `viewbox_spec_json`、`drag_points_json`、`param_sliders_json`、`invariants_display_json`）。
- **前端实际消费源**：
  在 `src/MathJuniorHome.tsx` 第 21-50 行，写死 `ALL_SANDBOXES` 静态数组：
  1. `SB-HAND-IN-HAND`（手拉手）
  2. `SB-QUADRATIC-VERTICAL-HEIGHT`（二次函数铅垂高）
  3. `SB-APOLLONIUS-CIRCLE`（阿氏圆）
  4. `SB-KP023`（勾股定理）
  在 `src/ConceptNav.tsx` 第 23-30 行的 `getSandboxConfigForPoint` 中，也仅仅匹配这 4 个写死 ID。
- **核实结论**：**真库 46 个沙盒全部未被读取，仅渲染本地 4 个静态 TS 文件**。

### 2. 实验室二：4D 跃迁模型（`leap_sandbox_models`）
- **`sandbox.db` 真实储备**：**36 个旗舰跃迁模型**（覆盖 LM-7A-01 到 LM-9B-36，含载体变异、参数变异、姿态变异、伪装加壳及 X-Ray 透视规格）。
- **前端实际消费源**：
  在 `src/modules/sandbox/morphControllers.ts` 第 327 行，写死 `mockLeapSandboxModels` 数组，**仅包含 2 个模型**：
  1. `LM-8A-01` (手拉手全等与勾股跃迁模型)
  2. `LM-9A-01` (二次函数铅垂高与割线极值跃迁模型)
  在 `src/MathJuniorHome.tsx` 第 505 行，直接传入 `allModels={mockLeapSandboxModels}`。
- **核实结论**：**真库 36 个模型全部未被读取，前端只挂载了 2 个静态 Mock 模型**。

---

## 五、完整问题清单与严重度分级

根据红线要求，对本次端到端验证发现的所有问题如实记录并分类定级：

| 编号 | 问题项与所在文件 | 事实描述 | 级别 |
| :--- | :--- | :--- | :--- |
| **ISSUE-01** | `src/ConceptNav.tsx` / `ConceptFourStages.tsx` | **模块一四段论完全脱离真库**：组件直接读取 `mockPoints.ts`，未查询 `core.db` 的 `knowledge_points` 表。107 个已生成的名师考点四段精讲被全部架空，且 Mock 仅有 20 个考点。 | **【阻塞】** |
| **ISSUE-02** | `src/ConceptNav.tsx` / `PointMasterExample.tsx` | **母题步进组件完全脱离真库**：`getMasterExampleForPoint` 中仅为 KP-023 硬编码了一道勾股假题，其余考点均为模板字符串拼接的假题。`master.db` 中 119 道经过中考验证的名师真题与四维解析完全被架空。 | **【阻塞】** |
| **ISSUE-03** | `src/MathJuniorHome.tsx` / `LineClosedLoop.tsx` | **主线闭环组件完全脱离真库**：直接读取 `mockGraphData.ts` 中的 `mockLogicLines` 与 `mockLineMasterExamples`，未查询 `core.db` 的 `logic_lines` 表。12 条主线四段闭环与命题矩阵全部未上屏，且主线名称与旗舰模型 ID 与真库严重脱节。 | **【阻塞】** |
| **ISSUE-04** | `src/MathJuniorHome.tsx` / `LeapLab.tsx` / `SandboxRenderer.tsx` | **沙盒与跃迁实验室完全脱离真库**：概念沙盒写死 4 个本地 TS 配置（真库 46 个被架空），4D 跃迁模型写死 2 个 Mock 模型（真库 36 个被架空）。未查询 `sandbox.db`。 | **【阻塞】** |
| **ISSUE-05** | `src/modules/concept/mockPoints.ts` | **Mock 考点 ID 与真库核心定义严重错位**：Mock 中将 `KP-023` 标定为“勾股定理及其逆定理”（8上 G4），而 `core.db` 权威入库的 `KP-023` 为“配方法”（9上 A3），“勾股定理”为 `KP-057`。这种假数据直接污染了母题与沙盒的联动逻辑。 | **【阻塞】** |
| **ISSUE-06** | `public/data/questions.db` vs `data/questions.db` | **题库文件 MD5 不一致**：`data/questions.db`（08efb8...，6.3MB）与 `public/data/questions.db`（6ef88f...，3.7MB）内容不一致。前端通过 HTTP 静态获取的是 `public/data`，若未执行同步，将导致题库回填成果无法生效。 | **【一般】** |
| **ISSUE-07** | `data/sandbox.db` | **沙盒库数据状态标记滞后**：`sandbox.db` 中 `concept_sandboxes` (46个) 和 `leap_sandbox_models` (36个) 的 `content_status` 字段值均为 `'pending'`，尽管其 JSON 配置字段（viewbox、morphing 等）已有实质内容。 | **【观察】** |

---

## 六、整改建议与落地路径（供后续任务参考）

1. **改造 `ConceptNav` 与 `ConceptFourStages` 数据加载（解除 ISSUE-01/05）**：
   - 移除写死引入的 `mockPoints.ts`。
   - 在应用启动或进入 `ConceptNav` 时，通过 `dbClient.query('core', 'SELECT * FROM knowledge_points ORDER BY grade, semester, point_id')` 异步加载全量 107 个考点。
2. **重构 `getMasterExampleForPoint`（解除 ISSUE-02）**：
   - 将 `masterExample` 的获取改为异步查询：`SELECT * FROM master_examples WHERE bound_target_id = ? AND example_type = 'point_master'`。
   - 彻底删除针对 `KP-023` 的 3-4-5 直角三角形硬编码。
3. **改造 `LineClosedLoop` 数据加载（解除 ISSUE-03）**：
   - 从 `core.db` 的 `logic_lines` 异步查询 12 条主线的真实四段（`origin_foundation_zh`, `spiral_leaps_zh`, `methodology_zh`, `exam_matrix_zh`）。
   - 从 `master.db` 查询 `example_type = 'line_master'` 获得真实主线压轴母题。
4. **改造沙盒与模型数据源（解除 ISSUE-04）**：
   - 实验室一根据 `SELECT * FROM concept_sandboxes` 动态渲染 46 个沙盒列表。
   - 实验室二根据 `SELECT * FROM leap_sandbox_models` 动态渲染 36 个跃迁模型列表。
5. **资产同步（解除 ISSUE-06）**：
   - 确保 `data/*.db` 与 `public/data/*.db` 保持强一致性同步。
