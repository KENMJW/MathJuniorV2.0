# TASK-FE-0003 【D. 模块三 沙盒】章节端到端验证报告

> **验证执行日期**：2026-09-18  
> **工作目录**：`/Users/annette/aidev/全科核心素养提分系统V2.0`  
> **验证执行原则**：只读验证，不修 bug、不改代码、不改任何 `data/*.db` 数据库文件。如实记录所有现状与指标，问题严格按【阻塞】/【一般】/【观察】分级。

---

## 目录
1. [验证综述与总体结论](#1-验证综述与总体结论)
2. [第一部分：SandboxRenderer 真实数据驱动验证](#2-第一部分sandboxrenderer-真实数据驱动验证)
   - 2.1 `data/sandbox.db` 结构与内容全量审计
   - 2.2 前端渲染调用链与真实数据库驱动现状
   - 2.3 动点拖拽、参数滑块调节、不变量几何判定逻辑与渲染链路
3. [第二部分：实验室二旗舰模型与 4D 变异/X-Ray 验证](#3-第二部分实验室二旗舰模型与-4d-变异x-ray-验证)
   - 3.1 4D 变异控制器设计与数学引擎
   - 3.2 X-Ray 骨架透视透析机制与 HUD 图层
   - 3.3 纯 SVG 渲染与禁止 `<foreignObject>` 等铁律约束检验
4. [第三部分：真实数据下的健壮性与完整性审计](#4-第三部分真实数据下的健壮性与完整性审计)
   - 4.1 `leap_sandbox_models` 36 个模型在真实数据下的运行时 Crash 验证
   - 4.2 考点映射错位（`KP-023` 配方法 vs `KP-057` 勾股定理）
   - 4.3 离线可用性与外部 CDN 依赖检验
5. [第四部分：发现问题分级清单（【阻塞】/【一般】/【观察】）](#5-第四部分发现问题分级清单阻塞一般观察)
6. [第五部分：测试佐证与运行数据](#6-第五部分测试佐证与运行数据)

---

## 1. 验证综述与总体结论

本次针对系统【模块三：见微知著·实验探究（双轨数学沙盒体系）】及【模块一：内嵌概念沙盒】进行了端到端的静态代码走查、数据库全量扫描、TypeScript/Python 运行时仿真与单元/属性测试验证。

### 核心结论速览：
1. **数学算法与核心逻辑层【优秀】**：
   - 不变量计算引擎（`src/modules/sandbox/invariants.ts`）完全采用纯数学向量代数与 Shoelace 算法，严格做到零 `eval`/`Function`、零 AST 解析；已针对除零边界（$d_2=0$）、三点共线、退化点实现完备防呆；单元与属性测试（fast-check 150 次迭代）100% 通过。
   - 4D 变异控制器纯数学变换（`src/modules/sandbox/morphControllers.ts`）严格保证欧氏保距性（刚体旋转与轴对称翻折），属性测试（fast-check 120 次迭代）100% 通过。
   - X-Ray 骨架透视（`src/modules/sandbox/XRayLayer.tsx`）设计完备，支持一键滤除干扰加壳图层并聚焦核心几何骨架。
2. **纯 SVG 与铁律约束【合规】**：
   - 沙盒模块源码内部 100% 无 `<foreignObject>`、无 `dangerouslySetInnerHTML`、无 `.innerHTML`，完全符合 Property 20 跨引擎安全与 iOS/WebKit/打印排版规范。
3. **真实数据驱动与系统接入【存在严重断层，定级阻塞】**：
   - **断层 1（数据孤岛）**：前端主入口 `src/MathJuniorHome.tsx` 和 `src/ConceptNav.tsx` **未接入** `data/sandbox.db`，而是硬编码使用 4 个静态配置文件及 2 个 mock 跃迁模型。数据库中 46 个概念沙盒与 36 个跃迁模型处于未接通状态。
   - **断层 2（运行时崩溃）**：`data/sandbox.db` 中 `leap_sandbox_models` 的 36 个模型数据系由占位脚本写入，其 4D JSON 结构与 TypeScript 模型接口（`CarrierMorphingSpec`, `PostureMorphingSpec`, `CamouflageXRaySpec`）严重不符。若前端直接读取真实数据，将在 `compileMorphingSandboxConfig` 处触发 `TypeError: Cannot read properties of undefined (reading 'find')` 致命崩溃。
   - **断层 3（考点错位）**：`ConceptNav.tsx` 将勾股定理配置错误绑定至 `KP-023`（在 `core.db` 中实际为“配方法”）；而真实勾股定理考点 `KP-057` 访问时返回 `null` 并回退至占位卡。
   - **断层 4（外部依赖）**：`index.html` 采用外网 jsdelivr CDN 加载 JSXGraph，违反系统“离线可用、断网运行”架构标准。

---

## 2. 第一部分：SandboxRenderer 真实数据驱动验证

### 2.1 `data/sandbox.db` 结构与内容全量审计

对 SQLite 数据库 `/Users/annette/aidev/全科核心素养提分系统V2.0/data/sandbox.db` 中的 `concept_sandboxes` 表进行全量指标统计：

| 维度指标 | 统计结果 | 说明与佐证 |
| :--- | :--- | :--- |
| **表行数** | **46 行** | 对应 46 个课标核心考点（数轴4 + 函数12 + 几何30） |
| **主键规则** | `SB-KPxxx` | 与 `core.db` 中 `knowledge_points.sandbox_id` 100% 对应 |
| **内容状态 (`content_status`)** | `pending`: 46 (100%) | 全部为待填充内容状态 |
| **引擎类型 (`engine_type`)** | `geometry`: 30<br>`function`: 12<br>`number_axis`: 4 | 完全覆盖初中三大图形动力学分支 |
| **画布模板 (`canvas_template`)** | 45 种模板命名 | 如 `number_axis_template`, `function_direct_template`, `geometry_congruence_template` 等 |
| **视口规格 (`viewbox_spec_json`)** | 46/46 合法 JSON | 统一为 `{"xMin": -10, "xMax": 10, "yMin": -8, "yMax": 8, "marginPercent": 15}` |
| **动点配置 (`drag_points_json`)** | 46/46 合法 JSON | 46 行数据完全同质化为 `[{"id": "P", "x": 2, "y": 3, "constrainTo": "curve"}]`；**全部缺少 `constraints` 定义域约束** |
| **滑块配置 (`param_sliders_json`)** | 46/46 合法 JSON | 46 行数据完全同质化为 `[{"id": "param_k", "min": -5, "max": 5, "default": 1, "step": 0.1}]` |
| **不变量展示 (`invariants_display_json`)** | 46/46 合法 JSON | 46 行数据完全同质化为 `{"labelZh": "恒等几何量", "formula": "f(x) = const"}`；**全部缺少 `type` 与 `deps` 计算依赖** |

### 2.2 前端渲染调用链与真实数据库驱动现状

检查 `SandboxRenderer`（`src/modules/sandbox/SandboxRenderer.tsx`）在业务层面的接入链路：

1. **`src/MathJuniorHome.tsx`（实验室主视图）**：
   ```tsx
   // 行 21-50：静态写死 4 个沙盒配置
   const ALL_SANDBOXES = [
     { id: "SB-HAND-IN-HAND", config: handInHandConfig, ... },
     { id: "SB-QUADRATIC-VERTICAL-HEIGHT", config: quadraticVerticalHeightConfig, ... },
     { id: "SB-APOLLONIUS-CIRCLE", config: apolloniusConfig, ... },
     { id: "SB-KP023", config: pythagoreanConfig, ... },
   ];
   ```
   - 切换沙盒时仅从 `ALL_SANDBOXES` 4 个静态模型中选取，**完全没有调用 `dbClient` 查询 `data/sandbox.db`**。
2. **`src/ConceptNav.tsx`（概念精讲模块内嵌沙盒）**：
   ```tsx
   // 行 23-30：写死 4 个沙盒的分支判断
   function getSandboxConfigForPoint(sandboxId?: string | null): SandboxConfig | null {
     if (!sandboxId) return null;
     if (sandboxId === "SB-KP023") return pythagoreanConfig;
     if (sandboxId === "SB-HAND-IN-HAND") return handInHandConfig;
     if (sandboxId === "SB-QUADRATIC-VERTICAL-HEIGHT") return quadraticVerticalHeightConfig;
     if (sandboxId === "SB-APOLLONIUS-CIRCLE") return apolloniusConfig;
     return null;
   }
   ```
   - 对于 `data/sandbox.db` 中的 46 个真实概念沙盒（如 `SB-KP001`、`SB-KP002`、`SB-KP032`、`SB-KP057` 等），该函数统一返回 `null`。
   - 当返回 `null` 时，`LinkedSandboxSlot.tsx` 统一渲染【CLS=0 物理等大占位卡】，导致**这 46 个考点的真实沙盒在概念精讲模块均无法显示**。
3. **数据库查询层 (`src/engine/db/`)**：
   - `packages.ts` 中定义了 `concept_sandboxes: 'sandbox'` 和 `leap_sandbox_models: 'sandbox'`；
   - 但在整个 `src/` 源码目录中，**没有任何业务组件或 hooks 执行 `dbClient.query('sandbox', ...)` 或 `dbClient.queryTable('concept_sandboxes', ...)`**。

### 2.3 动点拖拽、参数滑块调节、不变量几何判定逻辑与渲染链路

审查 `SandboxRenderer.tsx`（行 33-191）及底层引擎的实现机制：

1. **响应式视口自适应链路**：
   - 依赖 `parseViewboxSpec(config.viewbox_spec_json)` 与 `calculateViewport(viewboxSpec)`；
   - 严格在模型包围盒四周预留 $\ge 15\%$ 安全留白（Property 11）；
   - 正确透传至 JSXGraph `boundingbox: [xMin, yMax, xMax, yMin]`。
2. **动点拖拽与防呆物理硬锁死**：
   - 遍历 `drag_points_json` 生成 `board.create('point', [ptDef.x, ptDef.y], ...)`；
   - 动点绑定 `pt.on('drag', ...)` 监听器，调用 `clampDynamicValue(pt.X(), constraints)`；
   - 严格数学区间截断，不使用任何 `eval`。
   - *注意*：若传入 `data/sandbox.db` 的默认数据（无 `constraints` 属性），拖拽监听器不会挂载，动点可在视口内任意自由漂移。
3. **参数滑块调节链路**：
   - 遍历 `param_sliders_json` 生成 `board.create('slider', [[x, y], [x+len, y], [min, default, max]], { snapWidth: step })`；
   - 滑块垂直位置根据 `boundingbox[1] - 1 - (index * 1.5)` 递减排列，避免重叠。
4. **不变量几何判定与动态刷新链路**：
   - 遍历 `invariants_display_json`，创建动态文本 `board.create('text', [x, y, () => formatInvariantText(...)])`；
   - 在 JSXGraph 每一帧重绘时，闭包回调自动提取依赖动点的当前坐标 `el.X()`, `el.Y()` 填入 `pointMap`；
   - 经由 `evaluateInvariantValue` 计算无向夹角、垂直距离、三角形面积（Shoelace）、两点距离比值；
   - 数值与公式模板实时替换（如 `∠AOB = 90.0°`、`S_{△PAB} = 6.00`），渲染闭环顺畅。
   - *注意*：`data/sandbox.db` 中数据缺少 `type` 与 `deps`，`evaluateInvariantValue` 返回 `null`，退化为静态文本输出。
5. **坐标轴判断逻辑漏洞**：
   - `SandboxRenderer.tsx` 第 45 行：
     ```ts
     const isAxis = config.canvas_template === 'axis' || config.canvas_template === 'number_axis';
     ```
   - 而 `data/sandbox.db` 中函数类沙盒的模板名为 `function_direct_template`、`function_quadratic_vertex_template` 等，导致 `isAxis` 误判为 `false`，函数图象无法自动开启直角坐标系轴网。

---

## 3. 第二部分：实验室二旗舰模型与 4D 变异/X-Ray 验证

### 3.1 4D 变异控制器设计与数学引擎

审查 `src/modules/sandbox/morphControllers.ts` 与 `LeapLab.tsx`：

1. **四维变异架构实现**：
   - **1D 载体变异 (`carrier`)**：在自由三角形、正方形、直角坐标系网格等几何载体间无缝切换（通过切换 `canvas_template` 与动点集合）。
   - **2D 参数变异 (`parameter`)**：通过连续滑块调节相似比 $k$、旋转角 $\alpha$、动点横坐标 $t$，并通过 `clampDynamicValue` 严格约束在 $[0.1, 5.0]$ 安全域内。
   - **3D 姿态变异 (`posture`)**：欧氏保距变换纯函数 `transformPointCoords(x, y, rotationDeg, reflected, scale)`：
     $$\begin{cases} x_{\text{ref}} = \text{reflected} \; ? \; -x : x \\ y_{\text{ref}} = y \end{cases}$$
     $$\begin{cases} x' = (x_{\text{ref}} \cdot \text{scale}) \cos\theta - (y_{\text{ref}} \cdot \text{scale}) \sin\theta \\ y' = (x_{\text{ref}} \cdot \text{scale}) \sin\theta + (y_{\text{ref}} \cdot \text{scale}) \cos\theta \end{cases}$$
     纯数学几何变换，零 `eval`，并在 `morphControllers.test.tsx` 中通过 fast-check 120 次随机坐标与角度保距性断言。
   - **4D 干扰加壳 (`camouflage`)**：在画布中叠加真实试题中常伴随的干扰辅助线、干扰切线与背景网格。
2. **变异调度器 (`compileMorphingSandboxConfig`)**：
   - 将 `LeapSandboxModel` 与当前 `MorphingState` 实时编译为标准的 `SandboxConfig`，供核心 `SandboxRenderer` 单核复用渲染。

### 3.2 X-Ray 骨架透视透析机制与 HUD 图层

审查 `src/modules/sandbox/XRayLayer.tsx` 与其在 `LeapLab.tsx` 中的联动：

1. **HUD 控制层**：
   - 清晰展示“已透视 / 加壳中”状态标记与滤除图层数量；
   - 开启透视后，HUD 呈现液态玻璃发光边框，动态突出核心骨架不变量标签（如 `$∠AOB = C$`）；
   - “一键骨架透视”按钮可瞬间反转 `xrayActive` 状态。
2. **透视透析链路**：
   - 当 `xrayActive: false`（加壳中）时，`compileMorphingSandboxConfig` 将 `camouflageSpec.distractorLayers` 中的线段与辅助圆以弱色注入 `drag_points_json`；
   - 当 `xrayActive: true`（已透视）时，变异编译器直接剥除全部干扰图层（`isDistractor: true`），画布内仅保留核心骨架定点与动点；
   - 干扰加壳按钮组在 X-Ray 激活期间自动呈禁用（`disabled`）与半透明状态，避免状态竞争。

### 3.3 纯 SVG 渲染与禁止 `<foreignObject>` 等铁律约束检验

针对设计规范与跨平台安全铁律进行专项源码扫描与测试验证：

1. **源码门禁检查**：
   - 检索 `src/modules/sandbox/` 目录下全部 `.ts`、`.tsx` 文件：
     - `<foreignObject` 出现次数：**0 次**
     - `foreignObject` 出现次数：**0 次**
     - `eval(` / `new Function(` 出现次数：**0 次**
     - `dangerouslySetInnerHTML` / `.innerHTML` 出现次数：**0 次**
     - 直接 `import ... from 'katex'` 出现次数：**0 次**（所有公式严格走 `<MathRenderer>` 封装组件）
2. **跨浏览器与打印引擎合规性**：
   - 完全符合 Property 20（跨引擎安全不变量）；
   - 彻底杜绝 WebKit / Safari 移动端以及打印转 PDF 时由于 `<foreignObject>` 引起的解析崩溃、空白裁切或尺寸失真问题。

---

## 4. 第三部分：真实数据下的健壮性与完整性审计

### 4.1 `leap_sandbox_models` 36 个模型在真实数据下的运行时 Crash 验证

在数据库全量扫描中，发现 `data/sandbox.db` 中 `leap_sandbox_models` 的 36 条记录存在严重的 Schema 字段结构不符。

#### 数据层与代码层对比表：

| 字段 | 代码模型接口期望 (`morphControllers.ts`) | 数据库真实数据 (`data/sandbox.db`) | 兼容性判定 |
| :--- | :--- | :--- | :--- |
| `carrier_morphing_json` | `{"options": [{"id": "...", "points": [...]}], "default": "..."}` | `{"description": "模型载体变异选项", "default": "standard"}` | ❌ **严重不符（缺少 `options`）** |
| `parameter_morphing_json` | `{"sliders": [{"id": "...", "nameZh": "...", "min": 0, "max": 10, "default": 1, "step": 0.1}]}` | `{"description": "参数变异滑块", "sliders": [{"id": "param_t", "min": 0, "max": 10}]}` | ⚠️ **一般（缺少 `nameZh`, `default`, `step`）** |
| `posture_morphing_json` | `{"modes": [{"id": "standard", "nameZh": "...", "rotationDeg": 0, "reflected": false}], "default": "standard"}` | `{"description": "姿态变异形态", "modes": ["standard", "rotated", "reflected"]}` | ❌ **严重不符（`modes` 为纯字符串数组，非对象）** |
| `camouflage_xray_json` | `{"distractorLayers": [...], "coreSkeleton": {"nameZh": "...", "primaryElements": [...], "invariants": [...]}}` | `{"description": "干扰加壳与骨架透视", "coreSkeleton": "模型名称文本"}` | ❌ **严重不符（缺少 `distractorLayers`，`coreSkeleton` 为字符串）** |

#### 运行时仿真崩溃佐证：
编写独立仿真脚本读取 `data/sandbox.db` 的任一真实模型记录（例如 `LM-7A-01`），调用 `morphControllers.ts` 的解析链路：
```text
测试模型：LM-7A-01 (数轴动点与绝对值几何距离模型)
carrierSpec.options: undefined
postureSpec.modes: [ 'standard', 'rotated', 'reflected' ]
camouflageSpec.distractorLayers: undefined
carrierId: standard
[CRASH] TypeError: Cannot read properties of undefined (reading 'find')
  at compileMorphingSandboxConfig (morphControllers.ts:232)
```
- **崩溃原因**：`compileMorphingSandboxConfig` 执行 `carrierSpec.options.find(...)` 时，因 `carrierSpec.options` 为 `undefined`，直接抛出未捕获的 TypeError 异常；后续执行 `camouflageSpec.distractorLayers.forEach(...)` 也会二次抛出异常。
- **当前未在前端暴露的原因**：前端 `src/MathJuniorHome.tsx` 第 505 行硬编码传入了 `allModels={mockLeapSandboxModels}`（仅包含 `LM-8A-01` 与 `LM-9A-01` 2 个全字段 mock 模型），完全绕过了 `data/sandbox.db`，因而遮掩了真实数据库下的崩溃。

### 4.2 考点映射错位（`KP-023` 配方法 vs `KP-057` 勾股定理）

在比对 `core.db` 与沙盒配置时发现严重的业务语义错位：

1. **`core.db` 真实考点定义**：
   - `KP-023`：考点名称为 **“配方法”**，`sandbox_id` 字段为 `NULL`（纯代数考点，无沙盒）；
   - `KP-057`：考点名称为 **“勾股定理及其逆定理”**，`sandbox_id` 字段为 `SB-KP057`。
2. **`concept_sandboxes` 表定义**：
   - 勾股定理沙盒的 ID 实际上是 `SB-KP057`，对应 `KP-057`；数据库中不存在 `SB-KP023`。
3. **前端代码错位**：
   - `src/modules/sandbox/configs/pythagorean.ts` 中硬编码 `sandbox_id: "SB-KP023"`；
   - `src/ConceptNav.tsx` 第 25 行写死 `if (sandboxId === "SB-KP023") return pythagoreanConfig;`；
   - `src/ConceptNav.tsx` 第 34 行在生成母题时甚至将 `point_id === "KP-023"` 误当做勾股定理母题（“在 Rt△ABC 中 a=3, b=4 求斜边 c”）；
   - **后果**：学生访问“配方法”（`KP-023`）时，因 `sandbox_id` 为 NULL 而不显示沙盒；学生访问“勾股定理”（`KP-057`）时，`sandbox_id` 为 `SB-KP057`，但因 `getSandboxConfigForPoint` 只认 `SB-KP023`，依然返回 `null` 并回退至占位卡。导致勾股定理沙盒在概念精讲模块完全处于死链接状态。

### 4.3 离线可用性与外部 CDN 依赖检验

审查 `index.html`（行 10-13）：
```html
<!-- JSXGraph CDN -->
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css" />
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js"></script>
```
- **架构违规**：根据《技术架构设计书》第 6.1 节与第 12 条“离线、断网可用、极致隐私”原则，系统核心依赖必须完全本地化打包。
- **故障隐患**：JSXGraph 通过公网 jsdelivr 引入，若无网络或 CDN 在特定网络环境下遭遇连接超时，`window.JXG` 将为 `undefined`。
- **级联崩溃**：`SandboxRenderer.tsx` 第 3 行执行 `(window as any).JXG || {}`，在 `initBoard` 时将直接抛出 `TypeError: Cannot read properties of undefined (reading 'initBoard')`，导致整个沙盒视窗空白崩溃。

---

## 5. 第四部分：发现问题分级清单（【阻塞】/【一般】/【观察】）

| 缺陷编号 | 缺陷定级 | 缺陷简述 | 影响模块 | 根因与佐证 | 建议解决方向 (只读不改) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-D-01** | **【阻塞】** | `data/sandbox.db` 中 `leap_sandbox_models` 的 4D JSON 结构与 TypeScript 模型接口严重不兼容，运行时必然触发 TypeError 致命崩溃 | 实验室二 (`LeapLab`)、`morphControllers` | `build_sandbox_db.py` 生成的 `carrier_morphing_json` 缺少 `options` 数组，`posture_morphing_json` 中的 modes 为字符串数组而非对象，`camouflage_xray_json` 缺少 `distractorLayers`。一旦接入真实 DB 即刻崩溃 | 重构 `scripts/build/db/build_sandbox_db.py` 中的跃迁模型 JSON 结构，使其与 `morphControllers.ts` 的 4D 变异类型定义严格对齐；同时在 `parseMorphingSpecs` 中增加安全防御回退。 |
| **BUG-D-02** | **【阻塞】** | 实验探究主视图与概念精讲内嵌沙盒未接入 SQLite 数据库，全量 46 个概念沙盒与 36 个跃迁模型处于孤岛隔离状态 | `MathJuniorHome`、`ConceptNav`、`LinkedSandboxSlot` | `MathJuniorHome.tsx` 写死 `ALL_SANDBOXES`（4个）与 `mockLeapSandboxModels`（2个）；`ConceptNav.tsx` 的 `getSandboxConfigForPoint` 写死 4 个 ID 判断，其余 46 个真实沙盒均返回 `null` 渲染占位卡 | 在组件内接入 `dbClient` 异步查询 `concept_sandboxes` 与 `leap_sandbox_models` 表，动态构建多维筛选抽屉与模型列表。 |
| **BUG-D-03** | **【阻塞】** | 勾股定理沙盒考点 ID 严重错配（`KP-023` 配方法 vs `KP-057` 勾股定理），导致勾股沙盒在概念导航中无法被任何真实考点激活 | `pythagoreanConfig`、`ConceptNav.tsx` | `core.db` 中 `KP-023` 为“配方法”（无沙盒），`KP-057` 才是“勾股定理及其逆定理”。代码中多处将 `SB-KP023` 与 `KP-023` 硬编码为勾股定理 | 将 `pythagorean.ts` 的 `sandbox_id` 修正为 `SB-KP057`，并修正 `ConceptNav.tsx` 中对 `KP-023` 的错误认知。 |
| **BUG-D-04** | **【一般】** | `data/sandbox.db` 中 `concept_sandboxes` 46 个考点的数据均为同质化占位符，缺少定义域约束与动态不变量依赖计算 | `concept_sandboxes` 数据表、`SandboxRenderer` | 46 行数据的 `drag_points_json` 缺少 `constraints`，`invariants_display_json` 缺少 `type` 与 `deps`，导致无法进行动态不变量计算，退化为静态文本 | 编写批量脚本针对 46 个概念沙盒按学科特征生成真实的动点坐标、滑动约束与几何不变量计算规格。 |
| **BUG-D-05** | **【一般】** | `SandboxRenderer.tsx` 对直角坐标系画布模板判断过窄，导致 12 个函数类沙盒全部无法显示坐标轴 | `SandboxRenderer.tsx` | 源码第 45 行仅判断 `canvas_template === 'axis' \|\| 'number_axis'`，而数据库中函数类模板名为 `function_direct_template` 等 | 扩展坐标系模板判断逻辑，支持以 `function_` 前缀或正则判定开启直角坐标系。 |
| **BUG-D-06** | **【一般】** | 外部公网 CDN（jsdelivr）引入 JSXGraph 核心库，违反“离线可用、断网运行”架构铁律，断网时整个沙盒白屏崩溃 | `index.html`、`SandboxRenderer.tsx` | `index.html` 引入外部 CDN；`SandboxRenderer.tsx` 未对 `window.JXG` 与 `initBoard` 做容错降级提示 | 将 JSXGraph npm 包本地打包集成或内联静态资源，并在 `SandboxRenderer` 中增加环境探针与优雅降级 UI。 |
| **OBS-D-01** | **【观察】** | 逃生舱机制 (`custom_behavior_id`) 仅预留 `'triangle-incenter'` 空分支，尚未建立可扩展的逃生舱注册表 | `SandboxRenderer.tsx` | 源码第 200-204 行 switch 分支为空，若后续遇到极其复杂的动力学拓扑，缺乏插件化挂载能力 | 后续可建立 `customBehaviors` 注册字典，便于复杂沙盒单独挂接逻辑。 |
| **OBS-D-02** | **【观察】** | 源码层面 100% 严守纯 SVG、零 `foreignObject`、零 `eval`/`Function`、零 `dangerouslySetInnerHTML` 铁律，算法纯正度极高 | `src/modules/sandbox/` 全体文件 | 静态扫描与 vitest 自动化门禁测试全部 PASS | 保持当前优秀的无 eval 向量算法与纯 SVG 渲染架构。 |

---

## 6. 第五部分：测试佐证与运行数据

### 6.1 Vitest 单元测试运行实录
执行 `npm test src/modules/sandbox`：
```text
 ✓ src/modules/sandbox/__tests__/invariants.test.ts (19 tests) 38ms
   ✓ 1. 角度不变量 calculateAngle (无向夹角 [0, 180])
     ✓ 直角边界测试 (90°)
     ✓ 钝角边界测试 (>90°)
     ✓ 跨象限测试 (从第二象限到第四象限)
     ✓ 共线与反向边界测试 (0° 与 180°)
     ✓ 退化点边界测试 (点与顶点重合)
     ✓ 属性测试：任意浮点坐标输入下，夹角恒 ∈ [0, 180] 且不崩溃 (≥150 次迭代)
   ✓ 2. 垂直距离 calculateVerticalDistance (|y1 - y2|)
     ✓ 跨 x 轴距离计算
     ✓ 全负坐标与重合坐标
     ✓ 属性测试：垂直距离恒 ≥ 0 且对称 (≥150 次迭代)
   ✓ 3. 三角形面积 calculateTriangleArea (Shoelace 算法)
     ✓ 标准直角三角形面积
     ✓ 顺时针与逆时针三点保正性
     ✓ 共线三点面积严格为 0
     ✓ 属性测试：三角形面积恒 ≥ 0 且不因顶点顺序变负 (≥150 次迭代)
   ✓ 4. 距离比值 calculateDistanceRatio (PA / PB 与 d2=0 防呆)
     ✓ 标准距离比值计算
     ✓ 核心边界：d2 = 0 时分母除零防呆 (安全返回 0，严禁抛出或返回 NaN/Infinity)
     ✓ 属性测试：比值恒 ≥ 0 且永不返回 NaN 或 Infinity (≥150 次迭代)
   ✓ 5. 调度与格式化测试 formatInvariantText
     ✓ 格式化角度文本
     ✓ 格式化铅垂高文本
     ✓ 格式化阿氏圆比值文本

 ✓ src/modules/sandbox/__tests__/morphControllers.test.tsx (6 tests) 20ms
   ✓ 1. 纯数学几何变换：90°旋转、轴对称翻折与 180°退化
   ✓ 2. [Property-Based] 姿态变换欧氏保距性：刚体旋转与翻折严格保持两点间距离 (fast-check 120次)
   ✓ 3. compileMorphingSandboxConfig 纯数据驱动生成合法 SandboxConfig
   ✓ 4. X-Ray 骨架透视机制：一键滤除干扰加壳图层
   ✓ 5. XRayLayer 与 LeapLab SSR 渲染验证
   ✓ 6. 铁律 1 & 铁律 3 源码门禁检查：零 eval/Function、零 innerHTML、零直接 katex 引用

 Test Files  2 passed (2)
      Tests  25 passed (25)
   Duration  616ms
```

### 6.2 数据库全量扫描统计佐证输出
```text
=== CONCEPT SANDBOXES (Total: 46) ===
Engine types: {'number_axis': 4, 'function': 12, 'geometry': 30}
Canvas templates count: 45
Status map: {'pending': 46}
Valid viewbox: 46/46
Valid drag points: 46/46, with constraints: 0/46
Valid param sliders: 46/46
Valid invariants: 46/46

=== LEAP SANDBOX MODELS (Total: 36) ===
Semester distribution: [('7A', 2), ('7B', 3), ('8A', 7), ('8B', 5), ('9A', 11), ('9B', 8)]
Primary lines distribution: [('A1', 2), ('A2', 2), ('A3', 3), ('A4', 7), ('G1', 2), ('G2', 3), ('G3', 2), ('G4', 5), ('G5', 5), ('G6', 4), ('S1', 1)]
Status map: {'pending': 36}
Models with clique_id: 0/36
Carrier with options: 0/36 (期望 >0, 实际为 0)
Parameter with sliders: 36/36
Posture with modes: 36/36, modes are objects: 0/36 (期望对象数组, 实际为字符串数组)
XRay with distractorLayers: 0/36 (期望 >0, 实际为 0)
```

---
*报告生成完毕。本验证严格遵循只读原则，未修改任何源文件与数据库文件。*
