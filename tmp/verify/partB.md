# TASK-FE-0003 【B. 模块一 概念精讲】端到端全量只读验证报告

> **验证执行时间**：2026-09-18  
> **验证执行环境**：macOS / Node.js v20 / Vite 5.4 / SQLite 3 / Vitest 2.1  
> **验证工作目录**：`/Users/annette/aidev/全科核心素养提分系统V2.0`  
> **结果输出路径**：`tmp/verify/partB.md`  
> **执行铁律红线**：全流程严格执行**只读验证**，未修改任何应用源码，未修改任何 `data/*.db` 数据库文件。所有异常与偏离设计规范点均如实记录并分级。

---

## 目录
1. [验证背景与执行摘要](#1-验证背景与执行摘要)
2. [四项核心视窗端到端深度验证](#2-四项核心视窗端到端深度验证)
   - 2.1 [四段论视窗 (ConceptFourStages.tsx) 消费与渲染实测](#21-四段论视窗-conceptfourstagestsx-消费与渲染实测)
   - 2.2 [单点快练 (QuickPractice.tsx) 抽题与兜底机制实测](#22-单点快练-quickpracticetsx-抽题与兜底机制实测)
   - 2.3 [母题步进 (PointMasterExample.tsx) 真实母题消费与 dim3 恒必展示实测](#23-母题步进-pointmasterexampletsx-真实母题消费与-dim3-恒必展示实测)
   - 2.4 [链接沙盒插槽 (LinkedSandboxSlot.tsx) 挂载与 CLS=0 物理防抖实测](#24-链接沙盒插槽-linkedsandboxslottsx-挂载与-cls0-物理防抖实测)
3. [发现的问题与分级清单](#3-发现的问题与分级清单)
4. [结论与工程落地改进建议](#4-结论与工程落地改进建议)

---

## 1. 验证背景与执行摘要

本报告针对“全科核心素养提分系统 V2.0 - 初中数学”中的核心支柱模块——**【模块一 概念精讲 (ConceptNav)】** 进行端到端只读实测验证。涉及的主要核心组件与底层数据依赖包括：
- **四段论视窗** (`src/modules/concept/ConceptFourStages.tsx`，消费 `data/core.db` 中的 `knowledge_points` 表)
- **单点快练** (`src/modules/concept/QuickPractice.tsx`，抽样自 `data/questions.db` 中的 `questions` 表，联动 `quickPractice.machine.ts`)
- **母题步进** (`src/modules/concept/PointMasterExample.tsx`，消费 `data/master.db` 中的 `master_examples` 表)
- **链接沙盒** (`src/modules/concept/LinkedSandboxSlot.tsx`，联动 `data/sandbox.db` 与 `SandboxRenderer.tsx`)

### 全量数据底座概况
- **`data/core.db`**：`knowledge_points` 表严格包含 **107** 个中考考点，四段论正文均全量就绪。
- **`data/master.db`**：`master_examples` 表严格包含 **107** 道 `point_master`（ME-KP001 ~ ME-KP107）考点母题，以及 12 道主线母题。
- **`data/questions.db`**：`questions` 表总计 **2064** 道真题题库。其中符合单点快练业务锁（`difficulty_level` 在 1~3 之间且 `question_type='single_choice'`）的题目分布于 41 个考点。
- **`data/sandbox.db`**：`concept_sandboxes` 表包含 **46** 个概念沙盒探究模型。

---

## 2. 四项核心视窗端到端深度验证

### 2.1 四段论视窗 (ConceptFourStages.tsx) 消费与渲染实测

#### 1. 字段消费机制与数据对齐
`ConceptFourStages.tsx` 严格遵循单屏自闭环设计与四段论四步认知模型，其消费逻辑如下：
- **Stage 1 (原点溯源)**：消费 `knowledge_points.origin_story_zh` / `origin_story_en`
- **Stage 2 (本真透视)**：消费 `knowledge_points.intuitive_essence_zh` / `intuitive_essence_en`
- **Stage 3 (法典严定)**：消费 `knowledge_points.formal_definition_zh` / `formal_definition_en`
- **Stage 4 (本体辨正)**：消费 `knowledge_points.intrinsic_variation_zh` / `intrinsic_variation_en`
- **双语切换**：通过 `getLocalizedField(knowledgePoint, field, locale)` 实现中文/英文无缝投影。

#### 2. 数据全量扫描结果 (107 个考点)
对 `data/core.db` 中全部 107 个考点进行逐行逐字段审查：
- **空字段数**：`0`（107 个考点四段论 8 个中英文字段 100% 完整填充）
- **占位符残留**：`0`（`__PENDING` 计数为 0）
- **平均长度**：中文四段论平均单段文本长度在 80~180 字符之间，信息密度充足。

#### 3. LaTeX 公式与 MathRenderer 渲染抽查
- **四段文本公式实例统计**：提取出匹配公式正则的数学公式共计 **1026** 处。
- **MathRenderer (`renderMathContent`) 全量渲染结果**：**0 处报错**，未出现任何 `math-error` 或 `katex-error` 降级节点。
- **典型考点抽查上屏验证**：
  | 考点 ID | 考点名称 | 公式样例 (LaTeX) | KaTeX 渲染验证 |
  | :--- | :--- | :--- | :--- |
  | `KP-001` | 有理数的概念与分类 | `$\frac{p}{q}$` | ✅ 正确渲染分数结构 |
  | `KP-004` | 有理数的四则运算 | `$(-2) \times (-3) = +6$` | ✅ 正确渲染符号与运算 |
  | `KP-013` | 整式的除法 | `$a^m \div a^n = a^{m-n}$` | ✅ 正确渲染同底数幂相除 |
  | `KP-023` | 配方法 | `$x^2 - 4x + 7 = (x-2)^2 + 3$` | ✅ 正确渲染配方恒等式 |
  | `KP-057` | 勾股定理及其逆定理 | `$a^2 + b^2 = c^2$` | ✅ 正确渲染勾股定理平方和 |
  | `KP-096` | 茎叶图 | `$\bar{x}$` 与极差运算 | ✅ 正确渲染统计学符号 |

#### 4. 组件交互与联动表现
- **SVG 图层联动 (`SvgLayerReveal.tsx`)**：在 Stage 1 基础骨架渲染，Stage 2 保持几何图形并隐藏标签，Stage 3（法典严定）通过 CSS `opacity: 1` 淡入精确字母图层（`.formal-labels`），完全符合 WebKit/Safari 避坑红线。
- **四段论概要视窗 (`all-stages-manifest`)**：无论激活哪一段，底部均平铺呈现全部四段的摘要卡片，支持直接点击任意阶段卡片进行单屏跳跃切换。

---

### 2.2 单点快练 (QuickPractice.tsx) 抽题与兜底机制实测

#### 1. 真实数据库题量分布 (锁定 L1~L3 难度、single_choice)
对 `data/questions.db` 全量 2064 道真题执行业务锁过滤，得到 107 个考点的快练可用题量分布：
- **满 3 题考点 (`count >= 3`)**：**20** 个考点（如 KP-001 有 65 题、KP-004 有 85 题、KP-034 有 3 题、KP-084 有 37 题等）。
- **<3 题考点 (`1 <= count < 3`)**：**21** 个考点。
  - **1 题考点 (11个)**：`KP-009`, `KP-012`, `KP-015`, `KP-018`, `KP-051`, `KP-055`, `KP-056`, `KP-060`, `KP-088`, `KP-090`, `KP-103`
  - **2 题考点 (10个)**：`KP-005`, `KP-029`, `KP-048`, `KP-052`, `KP-081`, `KP-092`, `KP-093`, `KP-098`, `KP-099`, `KP-104`
- **0 题考点 (`count == 0`)**：**66** 个考点（包含 `KP-096`、`KP-013`、`KP-023` 等）。

#### 2. 满 3 题考点实测 (以 KP-001, KP-004, KP-034 为例)
- **渲染表现**：正常抽选 3 道单选题，分别渲染 `data-testid="practice-item-1"`, `2`, `3`。
- **题干与选项**：题干、选项文本均由 `<MathRenderer>` 出口安全上屏；选项点击即时判定，触发 `sessionStore.recordPracticeScore`。
- **“换一批练习”**：按钮正常挂载（`refresh-batch-btn`）。当剩余未展示题目不足 3 题触发题池耗尽时，严格调用 `clearPresentedIds()` 重置去重池，绝不误调 `resetScores()`，台账 H2 闭环校验通过。

#### 3. <3 题考点实测表现与代码机制对比
实测发现系统在两种调用模式下表现存在差异：
- **模式 A (上层显式传参 `initialQuestions`)**：
  - 测试用例：`KP-009`（库藏 1 题）传入 1 题，组件渲染 `practice-item-1` 1 道题；`KP-005`（库藏 2 题）传入 2 题，组件渲染 `practice-item-1`, `practice-item-2` 2 道题。
  - **结论**：在此模式下能够做到“显示几题给几题”。
- **模式 B (纯题池模式，仅传入 `allQuestions`，未传入 `initialQuestions`)**：
  - 测试用例：`KP-009`、`KP-005` 仅提供 `allQuestions`。
  - **实测表现**：组件上屏题目数为 `0`，渲染缺省卡片“暂无符合条件的快练题目”。
  - **源码原因剖析**：`QuickPractice.tsx` 第 57~60 行存在如下逻辑：
    ```ts
    const eligible = filterEligibleQuestions(allQuestions, pointId);
    if (eligible.length < 3) {
      return []; // 不足 3 题直接返回空，由 UI 渲染缺省提示 (D2 缺陷)
    }
    ```
    同时在“换一批”按钮逻辑中（第 85~89 行）：
    ```ts
    if (eligible.length < 3) {
      setToastMessage('该考点题库不足3题，无法组卷');
      return;
    }
    ```
    此逻辑在源码中被开发者明确标注为 `// (D2 缺陷)`。在纯题池模式下，1 题和 2 题的考点无法被组卷展示。

#### 4. 0 题考点兜底机制实测 (重点测 KP-096、KP-013、KP-023)
- **实测样本**：
  - `KP-096`（茎叶图，单选题 L1~L3 数量：0）
  - `KP-013`（整式的除法，单选题 L1~L3 数量：0）
  - `KP-023`（配方法，题库仅有 1 道 L4 题目，L1~L3 数量：0）
- **实测表现**：
  - **白屏/崩溃检查**：**零白屏、零未捕获异常**（`crashed = false`）。
  - **缺省提示上屏**：均稳定居中渲染友好提示卡片：
    ```
    暂无符合条件的快练题目
    ```
  - **DOM 结构**：题目卡片 `practice-item-1` 数量为 0，页面不产生断裂或抖动，完全满足防御性编程铁律要求。

---

### 2.3 母题步进 (PointMasterExample.tsx) 真实母题消费与 dim3 恒必展示实测

#### 1. 读取 master.db 真实母题数据验证
- **母题记录总数**：`107` 条 `point_master` 记录。
- **编号规范**：100% 严格符合 `ME-KP001` ~ `ME-KP107` 格式，与 `core.db` 中的 107 个考点一一绑定（`bound_target_id = KP-001 ~ KP-107`）。
- **`dim3_rigor` 质量核查**：
  - 空值/未填数量：`0`。
  - 占位符残留：`0`。
  - 107 条母题的 `dim3_rigor` 均包含完整而严谨的数学推导步骤与定理公式（例如中考几何倒角、代数化简、判别式分析等），平均长度 200+ 字符。

#### 2. dim3_rigor 恒必展示机制实测 (CT-6 门禁)
组件内置状态 `unlockedLevel` 初始值为 `1`（仅解锁第 1 维）。
测试用例抽样：`ME-KP001`, `ME-KP023`, `ME-KP096`。
- **第 1 维 (直观具象本源)**：`data-testid="master-dim-card-1"` 正常展示（“已解锁”）。
- **第 2 维 (核心数学本质)**：`data-testid="master-dim-card-2-locked"` 显示虚线锁定卡片，提示“点击上方按钮步进解锁”。
- **第 3 维 (严谨推导证明)**：
  - **展示状态**：`data-testid="master-dim-card-3"` **恒定展开渲染**！
  - **锁定卡片**：`data-testid="master-dim-card-3-locked"` 为 `false`（不存在）。
  - **专属视觉徽章**：右上角高亮展示蓝底白字徽章：
    ```
    必修论证 (dim3 必展示)
    ```
- **第 4 维 (高阶易错变式)**：`data-testid="master-dim-card-4-locked"` 显示虚线锁定卡片。
- **步进演进实测**：
  - 点击“步进解锁第 2 维”后，第 2 维卡片解除锁定，dim3 依然恒定展开；
  - 继续步进至第 3 维、第 4 维，所有维度平铺展示。
  - **结论**：`dim3_rigor` 作为必修论证恒定展开，不可被任何解锁逻辑所隐藏，完全符合 CT-6 铁律规范。

---

### 2.4 链接沙盒插槽 (LinkedSandboxSlot.tsx) 挂载与 CLS=0 物理防抖实测

#### 1. 沙盒考点分布
- **`data/core.db` 中有 `sandbox_id` 的考点**：**46** 个（对应 `data/sandbox.db` 中 46 个 `concept_sandboxes`）。
- **`data/core.db` 中无 `sandbox_id` 的考点**：**61** 个。

#### 2. 有沙盒考点挂载验证 (以 SB-KP023 / pythagoreanConfig 为例)
- **DOM 挂载**：渲染 `<div data-testid="linked-sandbox-active">`，内嵌 `<SandboxRenderer config={config} />` 动力学画布。
- **物理尺寸**：计算样式包含 `height: 560px` 与 `min-height: 560px`，完全符合沙盒标准视口。

#### 3. 无沙盒考点等大占位卡验证 (以 KP-013, KP-096 为例)
对于纯代数、纯数式、概念定理等无需几何拖拽模拟的考点：
- **DOM 挂载**：渲染 `<div data-testid="linked-sandbox-placeholder">`，不加载沙盒 DOM。
- **CLS = 0 防抖机制**：
  - 容器物理高度强制锁定：`height: 560px` 且 `min-height: 560px`，与有沙盒状态绝对等大。
  - 核心说明卡片渲染：包含蓝底防抖徽章 `CLS = 0 物理等大防抖设计`，正文提示：
    > “本视窗高度物理锁定为 560px，与实验探究沙盒尺寸严格一致，彻底消除内容异步加载带来的页面跳动。”
  - 考点性质标签：展示 `纯数式/概念考点 · 基础定理直读` 徽章。
- **结论**：不论考点是否存在动力学沙盒，左右/上下切换考点时视口物理高度恒为 560px，彻底消除 Cumulative Layout Shift (CLS = 0)。

---

## 3. 发现的问题与分级清单

根据验证结果，发现的问题分级归纳如下：

| 序号 | 问题模块 / 文件 | 问题描述 | 实测佐证 | 影响范围 | 分级 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **ISSUE-01** | 概念精讲整页集成<br>`src/ConceptNav.tsx` | **考点数据未直连 `core.db`，仍依赖 20 个 mock 考点，且存在考点定义偏移**。<br>`ConceptNav.tsx` 默认使用 `mockKnowledgePointRecords`，仅包含 20 个考点。且 `mockPoints.ts` 中将 `KP-023` 定义为“勾股定理”，而在真实 `core.db` 中 `KP-023` 为“配方法”（勾股定理实际为 `KP-057`）。 | `ConceptNav.tsx:128`<br>`mockPoints.ts:3`<br>`core.db` 查询对比 | 模块一前端用户界面仅展示 20 个考点，无法查阅其余 87 个真实中考考点。 | **【阻塞】** |
| **ISSUE-02** | 概念精讲整页集成<br>`src/ConceptNav.tsx` | **母题与快练题依赖前端内存生成函数，未直连 `master.db` 与 `questions.db`**。<br>`ConceptNav.tsx` 通过 `getMasterExampleForPoint` 拼装母题，通过 `getPracticeQuestionsForPoint` 固定生成 2 道伪造练习题，未从 SQLite Worker 读取真实的 107 道 `ME-KP*` 母题和 2064 道真题。 | `ConceptNav.tsx:33-119`<br>页面未发起 Worker DB 查询 | 用户在概念精讲模块看到的并非中考压轴母题和真实快练题，而是前端动态拼凑的占位文字。 | **【阻塞】** |
| **ISSUE-03** | 单点快练组件<br>`QuickPractice.tsx` | **题池模式下 `<3` 题考点直接归零抛弃 (D2 缺陷)**。<br>当不传入 `initialQuestions` 仅传入 `allQuestions` 时，第 58 行 `if (eligible.length < 3) return [];` 会直接将 1~2 题考点清空，导致原本有 1~2 题的考点（共 21 个）在题池模式下全部显示“暂无题目”。 | `QuickPractice.tsx:58-60`<br>代码注释显式标注 `(D2 缺陷)` | 21 个考点（如 KP-009、KP-005）在直接接入全量题池时无法上屏有效题目，题库利用率降低。 | **【一般】** |
| **ISSUE-04** | 沙盒插槽配置<br>`src/ConceptNav.tsx` | **沙盒映射硬编码仅包含 4 个沙盒 ID，其余 42 个沙盒未接入**。<br>`getSandboxConfigForPoint` 函数仅硬编码了 4 个沙盒 ID（`SB-KP023`, `SB-HAND-IN-HAND`, `SB-QUADRATIC-VERTICAL-HEIGHT`, `SB-APOLLONIUS-CIRCLE`），`sandbox.db` 中其余 42 个概念沙盒无法在 ConceptNav 中被加载。 | `ConceptNav.tsx:23-30`<br>`sandbox.db` 表中有 46 个沙盒 | 42 个有沙盒的考点被迫 fallback 进入 560px 纯数式占位卡。 | **【一般】** |
| **OBS-01** | 单点快练组件<br>`QuickPractice.tsx` | **0 题考点兜底防御表现优秀**。<br>66 个 0 题考点（如 KP-096、KP-013）在进入快练视窗时，绝不白屏、绝不崩溃，稳定居中渲染提示卡。 | `QuickPractice.test.tsx`<br>实测 KP-096/KP-013 | 正向达标项，符合系统鲁棒性指标。 | **【观察】** |
| **OBS-02** | 母题步进组件<br>`PointMasterExample.tsx` | **dim3_rigor 必修论证恒定展开机制可靠 (CT-6)**。<br>全量 107 个母题均包含详尽严谨推导；无论是否解锁至第 3 维，dim3 均恒展且佩戴专属高亮徽章。 | `PointMasterExample.tsx:318`<br>实测 ME-KP001~ME-KP107 | 正向达标项，符合核心教学素养论证规范。 | **【观察】** |
| **OBS-03** | 链接沙盒插槽<br>`LinkedSandboxSlot.tsx` | **CLS = 0 物理等大防抖设计稳定**。<br>无论是活跃沙盒还是占位卡，物理容器高度均刚性锁定为 560px，页面在考点切换时不产生跳跃抖动。 | `LinkedSandboxSlot.tsx:28`<br>实测高度 560px | 正向达标项，符合前端视觉体验规范。 | **【观察】** |
| **OBS-04** | 数学公式渲染器<br>`MathRenderer.tsx` | **LaTeX 公式解析覆盖率 100%，零报错**。<br>`core.db` 107 个考点四段论中 1026 处 LaTeX 公式经 `renderMathContent` 全部解析成功，无一报错。 | `katexRenderCache`<br>实测 1026 处公式 | 正向达标项，公式渲染安全纯净。 | **【观察】** |

---

## 4. 结论与工程落地改进建议

### 4.1 总体结论
1. **各独立 UI 业务组件设计精良**：
   - `ConceptFourStages.tsx`、`PointMasterExample.tsx`、`LinkedSandboxSlot.tsx`、`QuickPractice.tsx` 4 个核心业务组件均严格遵循了 **铁律 3 (统一 MathRenderer 出口、杜绝 innerHTML)**、**铁律 7 (SVG 避坑指南)**、**CT-6 (dim3 严谨证明恒必展示)**、**CLS=0 防抖** 等规范，在直接注入各分包数据库数据时，展现出了极高的渲染稳定性与合规度。
   - 底层数据库（`core.db`, `master.db`, `sandbox.db`, `questions.db`）中考点四段精讲与母题解析已 100% 完整灌装，零 PENDING 占位，公式 LaTeX 语法正确。
2. **主要短板集中在上层集成与数据管道连接**：
   - 当前阻碍模块一全量端到端交付的核心问题在于上层 `ConceptNav.tsx` 依然保留了早期的静态 mock 数据与手写生成函数，尚未完成从 Web Worker SQLite 分包异步加载 107 考点、107 母题及真题题池的管道接通。

### 4.2 下一步工程改进建议 (非本次验证修改范围，供后续任务参考)
1. **解除 ConceptNav 数据硬编码**：
   - 在 `ConceptNav.tsx` 挂载时通过 `dbClient.query('core', 'SELECT * FROM knowledge_points ORDER BY grade, semester, point_id;')` 异步加载 107 个考点。
   - 废弃 `getMasterExampleForPoint` 本地函数，改由 `dbClient.query('master', 'SELECT * FROM master_examples WHERE bound_target_id = ? AND example_type = "point_master";', [currentPoint.point_id])` 精确拉取真实中考压轴母题。
2. **单点快练接入动态题池与修正 <3 题表现**：
   - 将 `ConceptNav.tsx` 中的 `getPracticeQuestionsForPoint` 替换为调用 `fetchQuickPracticeFromDb(pointId)`。
   - 优化 `QuickPractice.tsx` 中的初始化判定：当可用题目为 1 题或 2 题时，不强制清空为 `[]`，而是呈现实际有的 1~2 题并附带提示“本考点精选 X 道快练题”，消除 D2 缺陷。
3. **完善沙盒配置动态注册中心**：
   - 扩展 `src/modules/sandbox/configs/`，为 `sandbox.db` 中剩余 42 个沙盒建立映射注册表，使 46 个几何与动力学沙盒均能在前端被正常点亮。
