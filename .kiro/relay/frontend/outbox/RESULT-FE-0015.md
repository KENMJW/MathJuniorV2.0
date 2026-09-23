# RESULT-FE-0015: 模块二知识谱系重构交付报告

- **任务编号**: TASK-FE-0015
- **执行时间**: 2026-09-23
- **执行环境**: 本机（主控机权威环境）
- **执行模式**: 两阶段（阶段一 3 并发子 Agent + 阶段二 主 Agent 串行）
- **最终状态**: 全部完成，单元测试 100% 绿灯，真机 Chromium E2E 全流程验证通过，Console 零 Error / 零 wasm 失败 / 零 fallback

---

## 一、交付物核心清单与五大块实现说明

### 1. 块 A：沙盒 Viewport 内容自适应（黑底不变，模型放大填满）
- **修改文件**:
  - `src/engine/sandbox/viewport.ts`: 新增 `computeBoundingBoxFromPoints`、`isValidBoundingBox` 及 `calculateAdaptiveViewport` 工具函数，支持依据图元坐标集合动态生成紧凑 BaseBox，默认采用 15% 留白比例 (`marginPercent: 0.15`) 且严格保持 1:1 纵横比 (`preserveAspectRatio: true`)。
  - `src/modules/sandbox/SandboxRenderer.tsx`: 在 `JXG.JSXGraph.initBoard` 初始化前，提取解析 `drag_points_json` 与载体图元关键点坐标；当内容包围盒跨度均有效（跨度 $\ge 0.5$）时，以该紧凑包围盒调用 `calculateAdaptiveViewport` 计算视口，模型放大填满画布；内容为空或异常时平滑回退 DB 固定框。
  - **红线遵守**: 严格保持深色黑底 `#0f172a`，未改动图元描边配色与独立手拉手 SVG 分支，零 foreignObject、零 innerHTML。

### 2. 块 B：LeapLab 新增 `hideModelDrawer` 属性
- **修改文件**:
  - `src/modules/sandbox/LeapLab.tsx`: `LeapLabProps` 接口新增 `hideModelDrawer?: boolean`。
  - 当 `hideModelDrawer === true` 时：
    - 顶栏隐藏展开抽屉的按钮 `.model-drawer-trigger-btn` 及其 chevron 图标；
    - 改为渲染静态模型标识胶囊 `.model-drawer-static-title`，只展示当前锁定的模型 ID 与名称；
    - 彻底不渲染 2 级抽屉盒模型切换面板与搜索框 (`model-drawer-panel`)；
    - 完整保留 4D 变异控制条（① 载体切换、② 参数滑块、③ 刚体姿态、④ X-Ray 切换）。
  - **向后兼容**: 缺省或为 false 时，原有全库 36 模型抽屉行为 100% 保持不变。

### 3. 块 C：新建竖向泳道图组件 `LineSwimlane`
- **新建文件**: `src/modules/graph/LineSwimlane.tsx`
- **导出文件**: `src/modules/graph/index.ts`
- **功能特性**:
  - 纯展示、不可交互卡片式文档流；
  - 严格按初中 6 学期（7上、7下、8上、8下、9上、9下）从上到下划分为 6 个泳道段；
  - 接收知识点列表（`primary_line_id` 匹配当前谱系），同学期考点纵向排列并展示考点 ID 与中文名；
  - 无考点的学期段展示优雅的占位文案；
  - 完全对标 iOS 27 液态玻璃 Token 规范。

### 4. 块 D：新建 `GraphNav` 容器与概念精讲 Tab
- **新建文件**: `src/modules/graph/GraphNav.tsx`
- **架构设计**:
  - 对标 `ConceptNav` 顶栏吸顶架构，左侧为「12 谱系选择胶囊」，右侧为 4 分段胶囊 Tab（`stage-segmented-control`：概念精讲、链接沙盒、谱系母题、专项测评）；
  - 点击左侧胶囊展开按三大领域分组（数与代数 A1~A4、图形与几何 G1~G6、统计与概率 S1, P1）的 12 谱系选择抽屉；
  - 切换谱系时自动将 Tab 重置为「概念精讲」并平滑置顶；
  - **概念精讲 Tab**: 左侧自适应网格展示四段论精讲卡片（① 源头基石、② 螺旋跃迁路径、③ 核心思想方法、④ 中考压轴矩阵，公式全部经由 `<MathRenderer>` 渲染）；右侧 Sticky 吸顶嵌入 `<LineSwimlane>` 竖向单谱系泳道图。

### 5. 块 E：接入其余 3 Tab + 挂载 `MathJuniorHome` + 彻底移除 6×12 地铁图
- **Tab 2 链接沙盒**: 嵌入 `<LeapLab modelId={flagshipModelId} hideModelDrawer={true} allModels={effectiveLeapModels} locale={locale} />`，锁定该谱系旗舰模型，隐藏抽屉，保留 4D 变异联动；
- **Tab 3 谱系母题**: 嵌入 `<PointMasterExample example={dbMasterExample} />`，支持源头定义、本质推演、严密证明、陷阱警示四维逐级步进解锁；
- **Tab 4 专项测评**: 嵌入 `<LineQuickPractice>`，严格锁定 L4~L6 难度 single_choice 题型，即答即判，恰 3 题；
- **主入口改造 (`src/MathJuniorHome.tsx`)**:
  - `case "graph"` 分支挂载 `<GraphNav lines={effectiveLines} knowledgePoints={dbPoints || undefined} leapModels={effectiveLeapModels} />`；
  - 彻底移除 `SubwayMap` 地铁图挂载；
  - 彻底移除 `graphSubView`（`"map" | "line_loop"`）双视图状态与顶栏切换按钮；
  - 保留 `SubwayMap.tsx` 独立源文件备用，无任何破坏性删除。
- **JSXGraph 本地化**:
  - 将 `jsxgraph.css` 引入项目工程样式并本地打包，彻底解耦外网 CDN，提升离线稳健性。

---

## 二、测试套件验证结果

运行命令：`pnpm test`
- **测试套件总数**: 45/45 passed (100%)
- **测试用例总数**: 246/246 passed (100%)
- **相关新增/关键单测文件**:
  - `src/modules/graph/__tests__/GraphNav.test.tsx` (PASS, 3/3)
  - `src/modules/graph/__tests__/LineSwimlane.test.tsx` (PASS, 7/7)
  - `src/engine/sandbox/__tests__/viewport.test.ts` (PASS, 16/16)
  - `src/modules/sandbox/__tests__/viewportAdaptive.test.ts` (PASS, 7/7)
  - `src/modules/sandbox/__tests__/morphControllers.test.tsx` (PASS, 8/8)
  - `src/modules/graph/__tests__/LineClosedLoop.test.tsx` (PASS, 5/5)
  - `src/modules/graph/__tests__/SubwayMap.test.tsx` (PASS, 5/5)
  - `src/__tests__/noEmoji.test.ts` (PASS, 1/1)
  - `src/__tests__/svgNoForeignObject.property.test.ts` (PASS, 4/4)

---

## 三、真实浏览器 E2E 验证结果 (§8)

- **执行脚本**: `node --experimental-websocket scripts/capture_fe0015_evidence.cjs`
- **执行引擎**: Google Chrome 真实无头浏览器 (CDP 协议, 窗口尺寸 1440x960, Retina 2x)
- **Console 状态**:
  - `Console Errors Count`: **0**
  - `Wasm Errors Count`: **0**
  - `Fallback Count`: **0**
- **DOM 契约核验**:
  - `hasGraphNav`: `true`
  - `hasSubwayMap`: `false`
  - `hasMapToggle`: `false`
  - `hasLineLoopToggle`: `false`
  - `hasHeader`: `true`
  - `hasSwimlane`: `true`
  - `hasSandboxView`: `true`
  - `hasDrawerTrigger`: `false`
  - `hasDrawerPanel`: `false`
  - `hasStaticTitle`: `true` (`LM-9A-24 · 切线长定理与内切圆/外接圆模型`)
  - `hasXRay`: `true`
  - `hasMasterView`: `true`
  - `hasPracticeView`: `true`

### 截图存盘摘要 (存盘于 `public/screenshots/` 及 `dist/screenshots/`)

| 截图编号 | 文件名 | 分辨率/字节大小 | SHA256/MD5 Hash | 验证状态 | 对应交互阶段 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `fe0015_01_graphnav_initial.png` | 556,904 bytes | `3df78c69c3aec4472b1e39a0426a65f0` | PASS | 模块二初始加载，GraphNav 默认 G1 概念精讲与泳道图呈现，无地铁图 |
| **02** | `fe0015_02_line_selector_drawer.png` | 532,026 bytes | `1710b62ca7a62f994d9957ba720b35a4` | PASS | 点击顶部谱系选择胶囊，展开 12 谱系按领域分类抽屉 |
| **03** | `fe0015_03_line_g4_concept.png` | 557,473 bytes | `b568623866bc8cdfd294ef9ca1b6e946` | PASS | 选中 G4 谱系，四段论精讲与右侧 G4 竖向 6 学期泳道图联动更新 |
| **04** | `fe0015_04_linked_sandbox_g4.png` | 381,330 bytes | `5eedba78c9320eb40b178f004cc5821f` | PASS | 切换至「链接沙盒」Tab，锁定 LM-9A-24，无抽屉按钮，4D 变异控制条可用 |
| **05** | `fe0015_05_line_master_stepped.png` | 421,234 bytes | `af38634eb736a2394853ce310e970f0d` | PASS | 切换至「谱系母题」Tab，点击第一维解锁按钮，步进解锁展开 |
| **06** | `fe0015_06_quick_practice_eval.png` | 289,547 bytes | `09c6f4e672c80da8486dfbbd8bc58d68` | PASS | 切换至「专项测评」Tab，限 3 题即答即判，选项交互及解析上屏渲染 |

---

## 四、结论与交付状态

所有五个交付块均已严格按照设计规范与项目铁律实现，单元测试通过率 100%，真机端到端渲染及交互通过且控制台全程零报错。
任务已标记为 `done`。
