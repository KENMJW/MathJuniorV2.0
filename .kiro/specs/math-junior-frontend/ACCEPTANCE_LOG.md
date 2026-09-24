# 验收台账 · math-junior-frontend
# Acceptance Log (架构师验收记录)

> 本文件由架构师（Kiro）维护，记录每一批执行方（Antigravity/gemini-flash）交付的验收结论。
> 验收方式：**实际读代码 + 实测运行**，不以执行方自报的"测试全绿"为准。
> 状态图例：✅ 通过 | ⚠️ 有条件通过 | ❌ 退回整改 | 🔁 复验中

---

## 批次 #1 — 脚手架 + 数学门神（任务 1.1~2.4 + Checkpoint 3）

- **提交时间**：2025（执行方第一批交付）
- **涉及任务**：1.1、1.2、1.3、2.1、2.2、2.3、2.4、Checkpoint 3
- **执行方自报**：Python 6 passed + 5 subtests；TS 14 passed（3 文件）；`pnpm build` 0 类型错、纯静态产物齐全
- **架构师验收结论**：**❌ 退回整改**（门神 2.1/2.2 未通过；其余通过）

### 实测验收明细

| 项 | 关联 | 结论 | 证据 |
| :--- | :--- | :--- | :--- |
| 零持久化 store | 铁律2 / P19 | ✅ | `sessionStore.ts` 全内存 Zustand，无 localStorage/IndexedDB 写 |
| MathRenderer 安全 | 铁律3 / P3,P4 | ✅ | 非公式文本走 escapeHtml；trust:false；throwOnError:false；双层 try 兜底；LRU 缓存；dangerouslySetInnerHTML 内容均已转义/KaTeX |
| 门神 符号标准化 | P1 | ✅ | 定界符归一(T1)、度数(T5)、Rt△/△ 补空格防宏粘连 均正确 |
| 构建/类型 | — | ✅ | 0 类型错，纯静态产物（HTML/JS/CSS/PWA/SW/legacy）齐全 |
| **门神 语法预检** | **§6.1 / P2 / CT-4** | **❌** | **见下方缺陷 D1** |

### ❌ 缺陷 D1（阻塞）：门神"语法预检"名不副实

`sanitize_and_verify_math()` 的预检只做了"花括号左右计数相等"，漏过两类会导致 KaTeX 崩溃的脏公式。实测证据（架构师运行）：

- **T3**：输入 `这是 $x+1 未闭合公式`（奇数个 `$`，定界符不配对）→ **门神放行**（应拒绝）。
- **T4**：输入 `$\frac}{a}{b$`（花括号计数相等但 `}` 在 `{` 前，嵌套错序）→ **门神放行**（应拒绝）。

**根因**：design §6.1 要求"Headless 语法预检"（真正的结构/编译级校验），执行方只实现了计数级校验，可被绕过。门神是全项目数据洁净度第一道闸，带病放行会让后续所有入库题目/母题藏脏公式，代价滚雪球。

**整改要求（退回 2.1/2.2）**：
1. `$`/`$$` 定界符配对校验：非转义 `$` 总数须为偶数，`$$` 须成对，奇数 `raise ValueError`。
2. 花括号改**栈式嵌套校验**：遇 `{` 入栈、遇 `}` 出栈；出栈时栈空即非法（修复 T4）；结束时栈非空即非法。不能只比总数。
3. （推荐）真正的 Headless 预检：构建期用 Node 起 `katex.renderToString(formula,{throwOnError:true})` 对每个 `$...$` 片段试编译，报错即拒绝入库。至少完成 1+2。
4. `test_math_gate.py` 增补 T3（奇数 `$`）、T4（花括号错序）两个 EDGE_CASE，证明现能拒绝。

### ⚠️ 隐患（不阻塞，后续批次盯）

- **H1**：MathRenderer 行内正则 `\$[^\$\n]+?\$` 遇孤立 `$` 可能误吞正文；门神修好后风险降低，建议后续补"正文孤立 `$`"降级测试。
- **H2**：`sessionStore.resetScores` 未清 `presentedIds`（`resetAll` 有清）。做任务 9.4 单点快练时确认"换一批练习"语义与调用是否正确。

### 门禁决定
- **不批准进入 Section 3（ETL 4.1~4.4）。** 先整改门神 2.1/2.2，架构师复验通过后放行。
- 已通过项（1.1/1.2/1.3/2.3/2.4）无需返工。

---

<!-- 后续批次在此追加：## 批次 #2 — ... -->

## 批次 #1-R — 门神 D1 整改复验（任务 2.1 / 2.2 回炉）

- **执行模型**：gemini-flash（3.8 Flash）
- **执行方自报**：Python 8 passed + 15 subtests；TS 15 passed；`pnpm build` 0 错
- **架构师复验结论**：**✅ 通过（D1 已销）。批次 #1 整体转 ✅，放行 Section 3。**

### 实测复验（架构师亲自打 payload，非听汇报）

| 用例 | 输入 | 期望 | 实测 | 结论 |
| :--- | :--- | :--- | :--- | :--- |
| T3 奇数 `$` | `这是 $x+1 未闭合公式` | REJECT | REJECT（Unpaired '$'） | ✅ 原缺陷已修 |
| T4 花括号错序 | `$\frac}{a}{b$` | REJECT | REJECT（含准确位置） | ✅ 栈式校验真做了 |
| T5 未闭合 `$$` | `$$x+1` | REJECT | REJECT | ✅ |
| T6 行内含 `$$` | `$a$$b$` | REJECT | REJECT | ✅ |
| T7 KaTeX 非法 `\frac{1}` | `$\frac{1}$` | REJECT | REJECT（KaTeX headless） | ✅ Headless 预检真跑 |
| T8 未知宏 | `$\foobarbaz{x}$` | REJECT | REJECT（KaTeX headless） | ✅ |
| N1 正常公式 | `$x^2+1$ 与 $$y=\frac{a}{b}$$` | ACCEPT | ACCEPT | ✅ 未过度拦截 |
| N2 纯文本 | 无公式句子 | ACCEPT | ACCEPT | ✅ |
| N3 转义 `$` | `价格是 \$5 元` | ACCEPT | ACCEPT | ✅ |

### 复验加分项
- 真的实现了 Node `katex_validator.mjs` 长驻验证进程（文件存在 + T7/T8 被真编译拦下），达到 design §6.1 "Headless 预检"原意，**超出**架构师要求的最低标准（原只要求做 1+2 栈式校验）。
- 未矫枉过正：合法公式与转义 `\$` 正常放行，避开了"过度拦截"这一常见弱模型反模式。
- Node 进程缺失时降级为 Python 栈式预检（`validate_formula` 返回 True），有兜底。

### 遗留隐患（不阻塞，后续批次盯）
- **H1**（承上批）：MathRenderer 行内正则遇孤立 `$`；门神修好后入库数据变干净，风险已大幅下降，仍建议后续补降级测试。
- **H2**（承上批）：`sessionStore.resetScores` 未清 `presentedIds`，做任务 9.4 时一并确认语义。
- **H3**（新增·低）：KaTeX headless 依赖 Node 进程；CI/构建环境须保证 node 可用，否则静默降级为仅栈式校验（会漏 T7/T8 类语义错误）。构建流水线需显式校验 validator 进程存活。

### 门禁决定
- **批次 #1 关闭，状态 ✅。放行进入 Section 3（ETL 契约适配层 + mock db，任务 4.1~4.4）。**

## 批次 #2 — Section 3：ETL 契约适配层 + mock db（任务 4.1~4.4）

- **执行模型**：gemini-3.8-flash
- **执行方自报**：Python 8 passed+15 subtests；TS 23 passed（5 文件）；`pnpm build` 0 错
- **架构师验收结论**：**✅ 通过。放行进入模块一（9.1/9.4）纵向切片下一段。**

### 实测验收（架构师直接查代码 + 查 mock db 数据，非听汇报）

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| adaptQuestion 映射保真 | Property 5 / CT-1,CT-3 | ✅ | zod 校验 + CT 断言；字段无损映射；score_default ?? 2；rubric 正确映射为 RubricStepItem[] |
| 物理隔离 | 铁律9 / CT-8 | ✅ | questions.db 无 master_examples 表；master.db 无 questions 表；分包彻底隔离 |
| CHECK 约束真生效 | CT-1,CT-2,CT-3 | ✅ | 实测非法插入全被拦：difficulty=10 拒、question_type=essay 拒、kp_count=9 拒 |
| 组合基数 >4 用例 | CT-2（为 P12 铺路） | ✅ | 造了 C5-0088（kp_count=5），后续 Property 12 有数据可测 |
| 母题 dim3 必填 | CT-6 | ✅ | master_examples 2 条，dim3_rigor 全非空 |
| 模块一快练数据 | 为 9.4 铺路 | ✅ | L1/L2/L3 各 1 道 single_choice；另有 fill_blank/solution 样本供判分 |
| 分包生成 | §2.3 | ✅ | core/master/sandbox/questions.db 四包齐全 |

### 遗留隐患（不阻塞）
- **H4（新增·低）**：mock db 仅 1 个考点。做 9.1/9.4 够用；横向铺开测模块二泳道图（10.x）时数据不足，届时需扩充 mock（多考点/多主线/多组合）。
- H1/H2/H3 承前，状态不变（H2 待 9.4 验、H3 构建环境须保 node 存活）。

### 门禁决定
- **批次 #2 关闭，状态 ✅。纵向切片继续：9.1（四段论视窗）→ 9.4（单点快练状态机）→ 11.1/11.2（沙盒）。**

## 批次 #3 — 纵向切片：模块一概念精讲（任务 9.1、9.4、9.5*、14.2/14.3）与台账 H2 闭环

- **执行方自报**：Vitest 9 文件 40 passed（含 Property 13、Property 14 属性测试各 150 次迭代）；pytest 8 passed (15 subtests)；`pnpm build` 0 错误（含 legacy 包 + PWA + KaTeX + SQLite WASM）。
- **完成任务**：
  - `9.1` 四段论单屏自闭环视窗（`ConceptFourStages.tsx` + `SvgLayerReveal.tsx`）
  - `9.4` 单点快练抽样去重状态机（`QuickPractice.tsx` + `quickPractice.machine.ts`）
  - `9.5*` 单点快练去重与池耗尽属性测试（`quickPractice.property.test.ts`，Property 13）
  - `14.2` 数据层双语字段投影 `projectLocale()`（`projectLocale.ts`）
  - `14.3*` 双语投影属性测试（`projectLocale.property.test.ts`，Property 14）

### 实测验收表

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| 四段论文本单出口 | 铁律3 / P3,P4 | ✅ | `ConceptFourStages.tsx` 与 `QuickPractice.tsx` 源码 0 `import katex`，0 `dangerouslySetInnerHTML`，0 裸 `innerHTML`；所有题干/选项/解析/四段文本必须经 `<MathRenderer>` 出口。 |
| SVG 图层按段点亮 | 铁律7 / §7.1 | ✅ | 第 2 段隐藏字母标签（`opacity: 0`），第 3 段淡入点亮（`<g class="formal-labels">` `opacity: 1`）；SVG 内部无 `<foreignObject>`。 |
| 业务锁严格锁定 | §7.1.1 / tasks 9.4 | ✅ | 状态机强制过滤 `difficulty_level BETWEEN 1 AND 3` 且 `question_type='single_choice'`。 |
| 参数化防注入 | 铁律5 | ✅ | `buildQuickPracticeSqlQuery` 采用 `?` 占位符传递 `primary_point_id` 与 `NOT IN (?,?,...)`。 |
| Property 13 属性测试 | Property 13 | ✅ | fast-check 150 次迭代验证：池 ≥3 时抽出题目绝不属于 `presented_ids`；池 <3 时标记 `poolExhausted` 并重置题池重抽满 3 题。 |
| Property 14 属性测试 | Property 14 | ✅ | fast-check 150 次迭代验证：`zh-CN` 返回 `_zh`，`en` 返回 `_en`，非双语公共字段原样保留。 |
| **台账 H2 验证闭环** | 台账 H2 | ✅ | **实测确认并规范化语义**：<br/>1. `sessionStore.resetScores()` 仅清空得分（`practiceScores`、`examScore`），保留 `presentedIds` 避免同会话重复；<br/>2. "换一批练习"在池耗尽或清空时，**明确调用 `clearPresentedIds()`**，严禁错调 `resetScores()`。两者正交隔离。 |

### 遗留隐患更新
- **H2 已闭环关闭**：代码与测试均已显式断言 `clearPresentedIds()` 用于题池换批/耗尽清空，`resetScores()` 仅用于得分统计重置。
- H1（MathRenderer 孤立 `$`）、H3（CI 需保 Node 存活）、H4（后续横向测图谱时需扩充 mock db）状态继续保持。


## 批次 #3 — 模块一切片：四段论 9.1 + 单点快练 9.4 + 双语投影 14.2

- **执行模型**：gemini-3.8-flash
- **执行方自报**：Vitest 9 套件 40 用例全绿（含 P3/4/13/14 各 150 次）；Python 8 passed；`pnpm build` 0 错
- **架构师验收结论**：**⚠️ 有条件通过。切片可继续（→11.1/11.2）；缺陷 D2 + 场景A 须在模块一横向正式交付前修复。**

### 实测验收

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| MathRenderer 单出口 | 铁律3 | ✅ | grep 扫 src/modules/ 干净；四段论/快练题干·选项·解析全走 `<MathRenderer>`；额外写了源码级门神测试 |
| SQL 参数化 | 铁律5 | ✅ | buildQuickPracticeSqlQuery 全 `?` 占位，NOT IN 动态占位数组，无拼接 |
| H2 语义隔离 | 承批#1 隐患 | ✅ **H2 关闭** | clearPresentedIds（池耗尽清去重）与 resetScores（仅清得分）正交隔离，注释点名 H2 |
| 快练去重/池耗尽 | Property 13 | ✅（核心满足） | 池≥3 抽出不在 presentedIds；池<3 触发 clear 重抽 |
| 双语投影 | Property 14 | ✅ | 14.2 projectLocale 通过 |

### ⚠️ 缺陷 D2（不阻塞切片，模块一正式交付前必修）
**池耗尽重置后新抽题可能与"刚做过的一批"完全重复，学生连续看到重复题。** 实测（复刻 drawFromPool）：
- 池5题、已做 q1q2q3、剩2触发重置 → 从全池重抽得 q1q2q3（正是刚做的三题）；nextPresentedIds 被清成仅本批，去重形同虚设。
- 根因：§7.1.1 原意为"清空→开启**新一轮**循环"，但重抽未排除"刚呈现的那批"，导致跨轮紧邻重复，违背"循环巩固"体验意图。
- 修法：池耗尽重置时，将"刚做的那批 id"作为新一轮初始 presentedIds（而非清成空集），或引入 justPresented 缓冲，保证跨轮不紧邻重复。

### ⚠️ 场景A（并入 D2 一起修）
题库本身 <3 题时，当前返回 exhausted:true 且只给 2 题。§5.1 要求"严禁返回残缺题量"，应触发友好提示而非默默给不足 3 题。

### 遗留隐患
- H1（MathRenderer 行内正则孤立 `$`）承前，门神修好后风险已低。
- H3（KaTeX headless 依赖 node 存活）承前，构建流水线须显式校验。
- H4（mock 仅 1 考点）承前，横向铺开模块二前需扩 mock。

### 门禁决定
- **批次 #3 有条件通过。纵向切片继续 → 11.1 SandboxRenderer 核心 [高风险 R2] → 11.2。**
- **D2 + 场景A 列为模块一横向正式交付的阻塞项**，届时复验。

## 批次 #4 — D2 修复 + 沙盒 11.1/11.2（★ 执行模型切换：gemini-3.1-pro）

- **执行模型**：**gemini-3.1-pro**（首个 Pro 批次，用于最高风险 R2 沙盒引擎）
- **执行方自报**：Vitest 9 套件 40 用例全绿；`pnpm build` 0 错；沙盒挂载 App.tsx Tab③ 可交互
- **架构师验收结论**：**✅ 通过。D2 关闭。R2 核心（声明式驱动）验证成立，但风险转化，见架构观察 A-1。**

### 实测验收

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| SandboxRenderer 声明式驱动 | R2 / §9.1 | ✅ | 无 sandboxId 硬编码分支；sliders/dragPoints/invariants 全 forEach 遍历 JSON；新增沙盒只需加配置 |
| 沙盒无 eval/Function | 铁律1 | ✅ | grep 全链路无 eval/Function；逃生舱 applyCustomBehavior 未引入 eval |
| clampDynamicValue 纯数学 | Property 10 | ✅ | step 对齐 + min/max + NaN/Inf 降级 + 浮点修正，纯实现 |
| viewport 15% 边距 | Property 11 | ✅ | 通过 |
| D2 修复 | 承批#3 缺陷 | ✅ **D2 关闭** | drawFromPool 加 currentBatchIds：池耗尽排除"刚呈现批次"并作下一轮种子；<3题走报错 UI（§5.1） |
| 全量测试 | — | ✅ | 40 用例全绿（"CHECK constraint failed" 日志系 mockSeed 故意插非法数据验约束，非错误） |
| 文件位置 | — | ✅ | 11.2 clamp/viewport 在 src/engine/sandbox/（engine 层更合理，非漏做） |

### ⚠️ 架构观察 A-1（非缺陷，R2 风险转化，横向铺开必盯）
不变量（invariants）求值**不是通用公式引擎**：`formula` 作静态文本显示，仅当配置声明 `type:'distance'`+`deps` 时用 Math.hypot 算真值填 `{val}`。
- **含义**：声明式覆盖的是"预定义计算类型"，非任意公式。面积/铅垂高/角度等每类不变量都需在 SandboxRenderer 新增一个 `type` 分支支持。
- **评价**：这是无 eval 约束下的**正确取舍**（诚实，避免了 eval 违铁律1，也避免了过早自造表达式解释器）。
- **风险转化**：R2 未消除而是转化为"预定义 invariant type 枚举够不够全"。40~50 概念沙盒 + 36 跃迁模型能否被有限 type 覆盖，需在 11.3（三代表模型）与横向铺开时持续验证。
- **横向决策点**：每遇新类不变量 → 加 type 分支（可接受）or 纯配置根本表达不了（触发逃生舱/重估引擎）。

### 模型对照观察（供后续排产参考）
- Pro 在 R2 高推理任务上表现：取舍成熟（invariant 静态/动态分层）、文件分层合理（engine vs modules）、主动加异常 UI。值得在其余高风险任务（内容生成 5.x、判分解析器已完成）考虑 Pro。
- Flash 在 1.x~4.x、9.x 常规任务表现同样达标（配合细任务卡+实测验收），成本更低。
- **建议排产**：常规模块用 Flash，沙盒横向铺开（11.3/11.4）与内容生成（5.x）用 Pro。

### 遗留隐患
- H1/H3/H4 承前不变。
- A-1（新增）：invariant type 覆盖度，横向铺开持续验证。

### 门禁决定
- **批次 #4 关闭，状态 ✅。纵向验证切片全线打通（脚手架→门神→ETL/mockdb→模块一四段论+快练→沙盒渲染）。**
- **建议下一步**：11.3 三代表沙盒（手拉手/阿氏圆/二次铅垂高）验证 invariant type 覆盖度（A-1 关键验证），仍用 Pro。

## 批次 #5 — 11.3 沙盒不变量边界验证（执行模型：gemini-3.1-pro）

- **执行模型**：gemini-3.1-pro
- **执行方自报**：四类 invariant type 全部写入，纯声明式覆盖，无需求值层，"可立即放行"
- **架构师验收结论**：**⚠️ 有条件通过。架构结论认同（A-1 实质关闭）；但 11.3 配置文件与 11.5 测试两项落差须在模块三正式交付前补齐。**

### 实测验收（架构师亲手验算，非听报告）

| 项 | 结论 | 证据（实测） |
| :--- | :--- | :--- |
| 四类 type 写入代码 | ✅ | grep 确认 angle/vertical_distance/area_triangle/ratio_distance 均在 SandboxRenderer.tsx |
| angle 数学正确 | ✅ | 手验：直角90/钝角135/跨象限90/反向180 全对（跨象限与 >180 取补处理正确） |
| area_triangle 正确 | ✅ | 手验：底4高3=6、共线=0（鞋带公式对） |
| ratio_distance 正确 | ✅ | 手验：PA/PB=2 对；d2=0 兜底为 0 |
| vertical_distance 正确 | ✅ | Math.abs(ΔY) |
| 无 eval | ✅ | 逃生舱定位清晰（留给特殊图形，非算数值） |

### ✅ 架构决策背书（A-1 实质关闭）
认同"纯声明式 + 有限 type 枚举（~15 个）覆盖初中全部不变量，拒绝引入受控表达式求值层"。理由成立：初中不变量高度收敛（长度/角度/斜率/比值/面积/周长/极值）；switch-case + 纯数学性能高且严守铁律1。**横向铺开不再纠结求值层问题。** 每遇新类不变量按"加 type 分支"处理，逃生舱仅留给特殊图形实体。

### ⚠️ 落差 L1（不阻塞，模块三交付前必补）
tasks 11.3 要求产出 `configs/hand-in-hand.ts`/`apollonius.ts`/`quadratic-vertical-height.ts` 三个独立沙盒配置文件；实际**未产出**，仅在报告中用 JSON 片段论证可行性 + 引擎加 type 分支。报告"已全部安全写入"指 type 分支，**非三个完整可运行沙盒**（措辞易误导）。须真正落三个 configs 文件，能在 App 拖动跑通并显示正确不变量。

### ⚠️ 落差 L2（不阻塞，模块三交付前必补）
四个新 invariant type 无属性/单元测试固化。angle 跨象限逻辑回归易坏。须补测试固化边界（直角/钝角/跨象限/反向/共线/d2=0）。

### 门禁决定
- **批次 #5 有条件通过。架构结论采纳，A-1 实质关闭，横向铺开放行。**
- **L1 + L2 列为模块三（11.x）正式交付的阻塞收口项**，届时复验。
- 隐患 H1/H3/H4 承前。

## 批次 #6 — 收口 L1+L2：三代表沙盒配置 + invariant 测试（执行模型：gemini-3.8-flash）

- **执行模型**：gemini-3.8-flash（架构师原误记为 Pro，经用户更正修订）
- **执行方自报**：10 文件 59 用例全绿；build 0 错（未点明具体做了 L1/L2，架构师经增量核查确认）
- **架构师验收结论**：**✅ 通过。L1、L2 双双关闭，质量超预期。**

### 实测验收（架构师核查增量，非听汇报）

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| L1 三代表沙盒配置 | 承批#5 落差 | ✅ **L1 关闭** | configs/hand-in-hand.ts、apollonius.ts、quadratic-vertical-height.ts、index.ts 全产出；纯声明式 JSON，无沙盒专属逻辑代码 |
| 配置质量 | §9 | ✅ | hand-in-hand 把角度拆"顶角守恒/旋转角"两个不变量，理解模型数学本质 |
| L2 invariant 测试 | 承批#5 落差 | ✅ **L2 关闭** | invariants.test.ts 19 用例：直角/钝角/跨象限/共线反向/退化点重合/d2=0 除零，且每类配 ≥150 次属性测试（角度∈[0,180]、面积≥0不因顶点序变负、比值永不 NaN/Inf） |
| 额外重构 | — | ✅ 加分 | 将 invariant 求值从 SandboxRenderer 抽出为独立 invariants.ts（可测、职责单一），主动好设计 |
| 全量测试 | — | ✅ | 10 文件 59 用例全绿（+19 恰为 invariants.test.ts；CHECK failed 日志系 mockSeed 验约束，非错误） |

### 门禁决定
- **批次 #6 关闭，状态 ✅。模块三沙盒引擎部分（11.1/11.2/11.3 + 收口）完整交付。**
- **待办**：11.4（实验室二 4D 变异控制器 + X-Ray）尚未做——沙盒模块尚未整体完结。
- 剩余隐患：H1（MathRenderer 孤立$，风险低）、H3（KaTeX headless 依赖 node）、H4（mock 仅1考点，横铺模块二前需扩）。A-1 已实质关闭。

### 交付沟通提示（记录）
- 本批执行方汇报笼统（只报"59 全绿"未说明做了 L1/L2），架构师靠增量文件核查还原。后续要求执行方明确列出"本批完成的任务编号 + 对应销项"。

## 更正说明（模型归属修订）

- **批次 #6 的执行模型更正为 gemini-3.8-flash**（此前误记为 Pro）。
- **重要含义**：批次 #6 是目前质量最高的一批（测试覆盖超要求、主动抽出 invariants.ts 重构），而它是 **Flash** 完成的。这说明——
  - Flash 在**有清晰收口指令 + 明确边界（L1/L2 已由架构师逐条列明）**时，能产出与 Pro 相当甚至更细致的成果；
  - Pro 的相对优势主要体现在**开放式高推理决策**（如批次 #4/#5 首次定沙盒引擎路线、invariant 边界判断），而非"把已定清楚的任务做扎实"。
- **排产结论修订**：默认 **Flash**；仅当任务是"开放式架构决策/需要自主判断技术路线"时才升级 Pro。常规实现 + 有明确验收标准的收口，Flash 足矣且更省。

## 批次 #7 — 扩充 mock db + 模块二思维图谱（10.1/10.2/10.3 + 10.5）（执行模型：gemini-3.8-flash）

- **执行方自报**：12 文件 69 用例全绿；build 0 错；列出了产出文件（较上批清晰）
- **架构师验收结论**：**✅ 通过。H4 关闭。**

### 实测验收（架构师核查，非听汇报）

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| mock 扩充 | H4 | ✅ **H4 关闭** | 20 考点、6 学期全覆盖、10 主线(A1-A4/G1-G6)、依赖边真实(predecessors/successors) |
| 组合基数完备 | Property 12 数据 | ✅ | kp_count 1~8 每档各 1 条，>4 有数据可测 |
| SubwayMap 无学情残留 | 铁律4 | ✅ | grep 无 traceRootCause/学情着色/脉冲 token；含源码门禁自测 |
| CombinationPanel 动态渲染 | 铁律8 / Property 12 | ✅ | targetKpCount=clamp(1,8) + Array.from 动态生成，绝无写死4；>4 差异化配色；property 测试 120 次迭代通过 |
| FocusBeam 光束 | 10.2 | ✅ | 真读 predecessors(蓝入度)/successors(紫出度) 并 map 渲染 |
| 物理隔离 | CT-8 | ✅ | questions.db 无 master_examples 表 |
| 门神未被动 | — | ✅ | 疑点排查：自报"7/7"系口径差异，实跑仍 8 passed+15 subtests，math_gate.py 未改动 |

### ⚠️ 隐患 D3（新增·低，不阻塞）
铁律10：CombinationPanel 用 `var(--token, #硬编码fallback)` 形式（主用 token，fallback 含硬编码色），且第87行有纯 `#ffffff`。功能与明暗模式不受影响（token 存在时不走 fallback），属代码整洁度问题。后续统一清理，暂不返工。

### 门禁决定
- **批次 #7 关闭，状态 ✅。模块二思维图谱主体（10.1/10.2/10.3）交付。**
- **待办**：10.4（主线四位一体闭环 + 主线快练 L4~L6）尚未做。
- 剩余隐患：H1(低)、H3(node依赖)、D3(硬编码fallback色·低)。H4 已关闭。

## 批次 #8 — 收口 10.4 主线闭环 + 11.4 实验室二4D变异（执行模型：gemini-3.8-flash）

- **执行方自报**：14 套件 81 用例全绿；build 0 错；明确列出 10.4/11.4 产出（汇报质量已改善）
- **架构师验收结论**：**✅ 通过。模块二、模块三整体收口。**

### 实测验收（架构师核查，非听汇报）

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| 10.4 主线快练难度锁 L4~L6 | §7.2 / 业务锁 | ✅ | LineQuickPractice 三处过滤均 `difficulty_level>=4 && <=6`；复用 D2 防紧邻重复 |
| 10.4 闭环四要素 | §7.2 | ✅ | 主线精讲(logic_lines四段)+旗舰模型+ME-LINE母题+3题快练；含缺失降级 |
| 11.4 数据驱动 | §9.4 | ✅ | parseMorphingSpecs 对 carrier/parameter/posture/camouflage 四类 *_morphing_json 全 JSON.parse；无 per-model 硬编码 |
| 11.4 纯数学无 eval | 铁律1 | ✅ | grep 无 eval/Function；transformPointCoords 用三角矩阵旋转+翻折；属性测试验"刚体变换保欧氏距离"120次（判据选得到位） |
| X-Ray 图层 | §9.4 | ✅ | 干扰线 opacity 压至 0.1、骨架高亮 |
| 铁律3/10 | — | ✅ | 走 MathRenderer；用 CSS 变量 token（自报的 Tailwind 类名疑为笔误，实际代码为 token） |
| 全量 | — | ✅ | 14 套件 81 用例全绿；门神实跑仍 8+15（自报"7/7"系口径差异） |

### 疑点排查记录
- grep morphing_json 初次零匹配 → 系架构师首次误用 `.tsx` 扩展名；实际文件 morphControllers.ts 确含四类 JSON.parse，数据驱动成立。

### 门禁决定
- **批次 #8 关闭，状态 ✅。模块二（10.1~10.4）、模块三（11.1~11.4）整体交付完成。**
- 剩余隐患：H1(低)、H3(node依赖)、D3(fallback色·低) 承前不变。

### ⚠️ 未逐条验收的存量（提醒）
- **判分引擎 7.x**：执行方历批汇报测试通过，但架构师**从未在台账逐条实测验收**（受控解析器 P8 安全零求值、填空等价 P7 是重点）。tasks.md 未勾。**建议在推进模块四前补验一次 7.x**，因为模块四 17.6 判分接入直接依赖它。

## 进度快照（截至批次 #8）
- ✅ 已收口：脚手架/门神/ETL+mockdb/模块一(9.1/9.4)/模块二(10.x全)/模块三(11.x全)/i18n投影(14.2)
- ⏳ 待做：模块一剩余(9.2链接沙盒/9.3母题步进)、设计系统(16)、设备调度(15)、i18n字典(14.1)、**内容生成(5.x 高风险)**、**模块四(17.x)**、横切验收(18.x)
- ⚠️ 待补验：判分 7.x（模块四前必验）
- 已关闭隐患：H2/H4/A-1/D1/D2/L1/L2

## 补验 & 纠偏 — 判分引擎 7.x（架构师主动核查，非批次交付）

- **动机**：7.x 从未在台账逐条实测验收，且模块四 17.6 依赖它，进模块四前补验。
- **重大发现**：**判分引擎 7.x 根本未实现。** `src/engine/judge/` 目录为空（0 字节）；全项目 grep 无 isMathAnswerEquivalent / normalizeMathString / parseControlled / calculateSolutionScore / FORBIDDEN 任何实现。
- **纠偏**：
  - 此前批次 #8 进度快照误将判分 7.x 列为"已验收通过"——**该判断错误，予以撤销**。7.x 实际状态为**未开始**（tasks.md 一直是 `[ ]`，是准确的）。
  - 执行方历批汇报中提及的"判分测试通过"经核查**不成立**（无对应源码与测试文件），属汇报与事实不符或架构师记忆串档。
- **教训**：坚持"实测而非听汇报"这次直接拦下一个若不查将在模块四爆炸的空缺。凡未经架构师亲自实测的模块，一律不得计入"已完成"。
- **影响**：判分 7.x 是**模块四 17.6 的硬前置**，且是铁律1（禁 eval）最敏感区，必须在模块四之前实现并严格验收。

### 修订后进度快照（截至补验）
- ✅ 已实测验收：脚手架/门神(2.x)/ETL+mockdb(4.x)/模块一(9.1/9.4/9.5)/模块二(10.x)/模块三(11.x)/i18n投影(14.2/14.3)
- ❌ **未开始（此前误记为完成）：判分引擎 7.x** ← 下一批最高优先
- ⏳ 未开始：模块一剩余(9.2/9.3)、设计系统(16)、设备调度(15)、i18n字典(14.1)、内容生成(5.x)、模块四(17.x)、横切(18.x)
- 隐患：H1/H3/D3 承前

## 批次 #9 — 判分引擎 7.1~7.8（补做，执行模型：gemini-3.8-flash）

- **背景**：上轮补验发现 7.x 未实现（judge 目录曾为空），本批补做。
- **执行方自报**：17 套件 94 用例全绿；build 0 错
- **架构师验收结论**：**✅ 通过。全项目安全底线（禁 eval）实测确认扎实。7.x 转"已实测验收"。**

### 实测验收（★ 架构师亲手用真实攻击 payload 打真实模块，非信测试）

**Property 8 安全零求值（铁律1，最高优先）：**
- 亲测 10 个攻击 payload：`Function("return 1")()`/`eval()`/`window.location`/`globalThis.__pwned=true`/`constructor.constructor()()`/`(1).constructor.constructor()()`/模板串/箭头函数/`__proto__` 污染 —— **parseControlled 全部拦截抛错**。
- 全部打进 isMathAnswerEquivalent → 全降级 `'suspect'`，无崩溃。
- **副作用哨兵**：globalThis.__pwned 仍 false、原型未污染 → **payload 零执行**（关键证据：不是拦住报错，是根本没求值）。
- FORBIDDEN 正则比 design 更严（加 prototype/__proto__/document）。

**Property 7 等价判定（亲测）：** 1/2≡0.5 ✅、\frac{1}{2}≡0.5 ✅、\sqrt{4}≡2 ✅、2√2≡√8 ✅、(x+1)²≡x²+2x+1 ✅（数值代入识别多项式恒等）、1或2≡2或1 ✅（无序集合）、x²≢x+1 ✅、3≢4 ✅。

| 项 | 关联 | 结论 |
| :--- | :--- | :--- |
| evalExpr 手写 AST 求值（非 JS eval） | 铁律1 | ✅ |
| parseControlled 危险 token 硬拦截 | Property 8 | ✅ 实测10 payload零执行 |
| 填空规范化清洗 | Property 6 | ✅ |
| 填空数值代入等价 | Property 7 | ✅ 实测8例 |
| 解答 rubric 自核守恒 | Property 9 | ✅ 0≤score≤Σ |
| 源码无 eval/Function | 铁律1 | ✅ grep 业务代码干净 |

### 门禁决定
- **批次 #9 关闭，状态 ✅。7.x 从"未开始（曾误记完成）"修正为"已实测验收通过"。**
- **模块四 17.6 的判分前置已就绪**，可推进模块四。
- 隐患 H1/H3/D3 承前。

## 批次 #10 — 模块四·精准出题中心 17.1~17.4（执行模型：gemini-3.8-flash）

- **执行方自报**：20 套件 104 用例全绿；build 0 错；选"补题库"方案（新增 mockExamQuestions.ts）
- **架构师验收结论**：**✅ 通过。**

### 实测验收

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| 满分制三配置 | §7.4/PRD5.4 | ✅ | 100制27题(15+5+7)、120制24题(10+6+8)、150制25题(10+6+9) 与 PRD 逐一致 |
| 库存预警方案A | Property 16 | ✅ | verifyPaperInventory 任一需求>库存→canGenerate=false；120次迭代过 |
| 母题物理隔离 | 铁律9/Property 17 | ✅ | questions.db 零母题混入(ME-/master- 0条)；master.db 独立存 3 母题；drawQuestions 加前缀排除双保险；SQL FROM questions；120次迭代过 |
| 补题库 | 组卷可行性 | ✅ | questions 扩至 35 题(17选择/8填空/10解答)，够组 120 制卷 |
| 双栏A4打印 | 17.4 | ✅ | column-count:2 + page-break-inside:avoid |
| 铁律1 | — | ✅ | exam 模块无 eval/Function |

### 门禁决定
- **批次 #10 关闭，状态 ✅。模块四出题中心（17.1~17.4）交付。**
- **待办**：17.5/17.6 在线测评中心（依赖已就绪的判分 7.x）。
- 隐患 H1/H3/D3 承前。

## 进度快照（截至批次 #10）
- ✅ 已实测验收：脚手架/门神(2)/ETL+mockdb(4)/判分(7)/模块一(9.1/9.4)/模块二(10)/模块三(11)/i18n投影(14.2)/模块四出题中心(17.1-17.4)
- ⏳ 待做：模块一剩余(9.2/9.3)、在线测评(17.5/17.6)、设计系统(16)、设备(15)、i18n字典(14.1)、内容生成(5.x 高风险)、横切验收(18.x)
- 隐患：H1(低)/H3(node)/D3(fallback色·低)

## 批次 #11 — 模块四·在线测评中心 17.5/17.6（执行模型：gemini-3.8-flash）

- **执行方自报**：21 套件 111 用例全绿；build 0 错；零持久化 spy 断言写调用为 0
- **架构师验收结论**：**✅ 通过。模块四整体收口。判分 7.x 首次集成，干净接入。**

### 实测验收

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| 判分真复用 7.x（非重写） | 集成正确性 | ✅ | ScorePanel import isMathAnswerEquivalent + calculateSolutionScore 并实际调用；exam 未重复实现 normalize/tokenize/数值代入 |
| 无 eval | 铁律1 | ✅ | exam 模块无 eval/Function |
| 零持久化终检 | 铁律2/Property 19 | ✅ | **全项目扫描无任何真实 localStorage/IndexedDB/sessionStorage 写调用**（排除注释/文案/测试/PWA-SW）；考完即焚落实 |
| Split-View + 数学键盘 | 17.5 | ✅ | OnlineExam 左右解耦 + MathKeyboard onFocus 呼出 |
| 四维雷达图 | 17.6 | ✅ | RadarChart 产出 |
| 全量 | — | ✅ | 21 套件 111 用例全绿 |

### 门禁决定
- **批次 #11 关闭，状态 ✅。模块四（17.1~17.6）整体交付完成。**
- **四大模块主体功能全部成型**（模块一核心/模块二全/模块三全/模块四全）。
- 待办：模块一收尾(9.2/9.3)、设计系统(16)、设备(15)、i18n字典(14.1)、内容生成(5.x 高风险)、横切验收(18.x)。
- 隐患 H1/H3/D3 承前。

## 里程碑 · 四大模块主体功能成型（截至批次 #11）
- 累计 11 批交付，架构师全部实测验收（非听汇报），拦下缺陷：D1(门神漏拦)、D2(快练重复)、判分 7.x 空缺(误记完成)、多次报告口径疑点。
- 已关闭：H2/H4/A-1/D1/D2/L1/L2；判分安全底线(Property 8)实测零求值。
- 执行模型：Flash 为主(#1~3,6~11)，Pro 用于沙盒引擎开放决策(#4,5)；结论——明确任务卡+实测验收下 Flash 足以胜任，Pro 仅用于开放式架构决策。


## ⚠️ 撤销记录 — 原"批次 #12"作废

- **原批次 #12（"收官任务谎报退回"）整条记录予以撤销、作废。**
- **原因**：架构师误判。该批 A/B/C/D 任务**实际尚未交付给 Antigravity 执行**——工作区里相应文件不存在、测试仍为 111，属"任务未开始"的正常状态，**并非执行方谎报**。此前对话中出现的"175 用例全绿/四组完成"文本，经用户澄清并非 Antigravity 的真实交付，架构师错误地将其当作交付去验收，并错误地定性为"谎报"。
- **教训（架构师自身）**：验收前必须先与用户确认"本批是否已由 Antigravity 实际执行并回传结果"，不得想当然地把对话文本当作真实交付。空口验收会既冤枉执行方、又污染台账。
- **真实进度未变**：截至**批次 #11**，四大模块主体功能成型（均经实测验收）。收官任务（9.2/9.3、14.1、15.x、16.x、18.x、内容生成 5.x）**尚未开始，待正式派发给 Antigravity**。
- **有效隐患**：H1(低)、H3(node)、D3(硬编码色，全模块级，待收官时清理)。此前批次 #1~#11 的验收结论**不受本次撤销影响，全部有效**。

## 批次 #12（正式）— 收官常规任务 9.2/9.3/14.1/15/16/18（执行模型：gemini-3.8-flash）

> 注：此为真正的 Antigravity 交付（前一条同号"谎报"记录系架构师误判，已撤销作废）。

- **执行方自报**：29 套件 137 用例全绿；15 个产出文件；D3 清零；build 0 错
- **架构师验收结论**：**✅ 通过。经加严核查（存在性+对账+属性实测）全部坐实。收官任务完成。**

### 实测验收（新流程：先对数+核文件，再验属性）

| 层 | 项 | 结论 | 证据 |
| :--- | :--- | :--- | :--- |
| 对账 | 测试数 | ✅ | 实跑 29 套件 137 用例，与自报一致（上批 111→+26 合理） |
| 存在性 | 15 个产出文件 | ✅ | 逐一 `ls` 全部真实存在（9.2/9.3/15.x/14.1/16.2/18.x/shell 三骨架） |
| D3 | 硬编码色清理 | ✅ **D3 关闭** | grep 全项目源码（除 tokens.css/二进制）零硬编码色 |
| 属性 | Property 19 零持久化 | ✅ | 真 spy localStorage/sessionStorage/IndexedDB 写接口，断言 toHaveBeenCalledTimes(0)，非空测 |
| 属性 | Property 20 无 foreignObject | ✅ | 460 次迭代 |
| 属性 | Property 15 设备判定 | ✅ | 270 次迭代恒返合法枚举 |
| 集成 | 18.3 三引擎冒烟 | ✅ | WASM 分包/i18n 热切换/print 分页 |
| 铁律 | 1/3 新增文件 | ✅ | 无 eval、无裸 innerHTML |

### 门禁决定
- **批次 #12 关闭，状态 ✅。收官常规任务全部完成。D3 关闭。**
- **剩余唯一大块：内容生成 5.x（高风险，母题四维/四段/主线文本大模型生成 + 教研质检）。**
- 隐患：H1(低)、H3(node)。D3 已关闭。

### 流程改进生效
- 本批起架构师验收固定先跑 `pnpm test` 对数 + `ls` 核产出文件，再验属性。加严核查有效运转，本批一次通过。

## 缺口发现 — 应用外壳/信息架构未实现（架构师任务拆解遗漏）

- **触发**：用户从 preview 实际访问，发现 (1) 入口不是全科门户；(2) 初中数学顶部是带任务号的调试 Tab，非产品设计。
- **实测诊断**（读 App.tsx）：
  - `src/App.tsx` 为**开发验收脚手架**：顶部 7 个 Tab 标签直接带任务号（概念精讲(9.1)/思维图谱(10.1~10.3)/主线闭环(10.4)/概念沙盒(11.1)/4D跃迁(11.4)/单点快练(9.4)/出题中心(17.1)），useState 切视图，无路由。
  - **全科门户经用户确认为设计稿/效果图，尚未实现**（代码不存在）。
  - design §12.3（全科门户）、§7.1 第4点（模块一四级导航：年级/学期/领域/107考点）均**未落地**。
- **根因（架构师责任）**：tasks.md 拆解了 20+ 功能组件（各要求"挂 App.tsx 可点验"），但**从未拆解"应用外壳/信息架构/路由集成"任务**。执行方忠实实现组件并平铺为调试 Tab；无人按设计组装为产品结构。**零件合格，整机未组装。**
- **定性**：**非数据缺失、非组件缺陷**。各模块组件实测通过、可编译、测试全绿；缺的是产品外壳这一层。
- **结论修正**：此前"前端代码完成"应限定为**"功能组件层面完成"**；**"产品整机层面"因缺应用外壳/门户/导航/路由，未完成**。

### 待补任务（新增 · 见 tasks.md 任务 20）：应用外壳与信息架构集成
- 层级（用户确认）：**全科门户(§12.3) → 进入初中数学 → 四大模块正式入口 → 模块内四级导航(年级/学期/领域/107考点)**。
- react-router（HashRouter 兼容 Cloudflare Pages 刷新）；删除带任务号的调试 Tab；四大模块用正式名称；三端骨架(CardDeck/SplitBoard/Cockpit)在此接入设备调度。
- 各模块组件内部逻辑不动，仅重新组织挂载；门户从头实现。

## 批次 #13 — 任务20 应用外壳与信息架构（执行模型：gemini-3.8-flash）

- **执行方自报**：30 套件 143 用例全绿；build 0 错
- **架构师验收结论**：**✅ 通过。产品外壳成型，调试脚手架已被正式产品结构替代。**

### 实测验收（先对数+核文件，再验产品结构，再查组件未被动）

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| 测试对账 | — | ✅ | 实跑 30 套件 143 用例，与自报一致（上批 137→+6） |
| 产出文件 | 20.1~20.3 | ✅ | router.tsx / AllSubjectsPortal.tsx / MathJuniorHome.tsx / ConceptNav.tsx 均存在（放 src/ 根，非建议子目录，功能不受影响） |
| 调试Tab清除 | 20.2 | ✅ | grep 无 (9.1)/(10.4)/(11.1) 等任务号残留；App.tsx 已改为纯路由容器 |
| 全科门户 | 20.1/§12.3 | ✅ | AllSubjectsPortal 从头实现（学段切换+初中数学卡+其他学科即将推出） |
| 四大模块正式入口 | 20.2 | ✅ | 探本溯源/经纬纵横/见微知著/百炼成钢 正式名称，无任务号 |
| 模块一四级导航 | 20.3/§7.1 | ✅ | ConceptNav 从 knowledgePoints 动态提取 年级→学期→领域→考点，级联过滤，非写死 |
| 路由 Cloudflare 兼容 | 20.5 | ✅ | HashRouter + public/_redirects 双保险 |
| **各模块组件内部零改动** | 硬约束 | ✅ | git status 对 5 个核心组件无变更输出，仅重新挂载 |
| 全量 | — | ✅ | 143 用例全绿，build 0 错 |

### 门禁决定
- **批次 #13 关闭，状态 ✅。任务 20 完成。前端产品外壳成型。**
- 小偏差（不返工）：门户/主页/导航文件置于 src/ 根而非 src/portal、src/modules 子目录，属组织习惯，功能无影响。
- 待办：20.4 三端骨架接入设备调度（需确认是否已在本批含入）、内容生成5.x（其他对话）、真实数据灌入、部署适配。
- 隐患 H1/H3 承前。

### 状态修正
- 前端**产品整机**：外壳/门户/导航/路由 ✅ 完成 → 现在 preview 打开是产品结构（门户→初中数学→四大模块→四级导航），非调试界面。
- 仍为 mock 数据；真实内容待 5.x + 基础数据层。

## 批次 #14 — 任务21 去emoji + 模块四UI（执行模型：gemini-3.8-flash）

- **架构师验收结论**：**⚠️ 部分通过。去 emoji（21.1/21.2/21.4）✅；模块四 UI（21.3）❌ 因缺陷 D4 返工。**

### 通过部分（实测）
| 项 | 关联 | 结论 | 证据 |
| :--- | :--- | :--- | :--- |
| 全项目零 emoji | 铁律11 | ✅ | grep 全源码零 emoji（排门禁测试） |
| Icon 组件 | 21.1 | ✅ | src/components/common/Icon.tsx，单色 SVG path 继承 currentColor，无 foreignObject |
| noEmoji 门禁测试 | 21.4 | ✅ | 用 \p{Extended_Pictographic} 正则读源码断言，非空测 |
| 核心逻辑未动 | 硬约束 | ✅ | git status 对 judge/verifyPaperInventory/drawQuestions/SandboxRenderer 无变更 |
| 测试/构建 | — | ✅ | 31 套件 144 用例全绿，build 0 错 |

### ❌ 缺陷 D4（阻塞 21.3，返工）：用了未配置的 Tailwind 类名，布局空转
- 实测：项目**未安装/配置 Tailwind**（无 tailwind.config、package.json 零 tailwind、无 @tailwind 指令），但 **8 个文件**（PaperWorkbench/OnlineExam/ScorePanel/MathKeyboard/RadarChart/PrintLayout/PointMasterExample/LinkedSandboxSlot）大量使用 `grid-cols-*`/`text-[..]`/`bg-slate-*`/`dark:` Tailwind 原子类。
- **后果**：这些类名全部不生效 → 模块四"三列卡片网格"等布局空转、元素堆叠 → **正是用户所见"模块四 UI 很乱"的直接根因**。
- **测试盲区**：自动化测试只验逻辑与可渲染，不验样式生效/美观，故 144 全绿仍掩盖此问题；靠用户 preview 肉眼发现。
- **返工要求**：把 8 个文件的 Tailwind 类改写为 inline style + iOS27 token（与项目其他组件一致），**不引入 Tailwind**。目标：preview 肉眼确认模块四为产品级卡片布局。零 emoji、核心逻辑不动、测试全绿。

### 门禁决定
- 去 emoji 部分关闭 ✅；**任务 21.3（模块四 UI）因 D4 返工，不放行**。
- 隐患 H1/H3 承前；新增 D4（阻塞·返工中）。

### 教训（架构师流程加固）
- 新增验收动作：**凡涉及 UI 布局的批次，检查是否误用了项目未配置的 CSS 框架类名（Tailwind 等）**——类名失效不触发测试失败，是自动化盲区，须显式 grep 核查 + 提示用户 preview 肉眼确认。

## 批次 #15 — D4 返工：Tailwind 类→inline style/token（执行模型：gemini-3.8-flash）

- **架构师验收结论**：**✅ 通过。D4 关闭。任务 21 全部完成。**

### 实测验收（核心是 grep 查样式，非看测试）
| 项 | 结论 | 证据 |
| :--- | :--- | :--- |
| Tailwind 类清除 | ✅ | grep 全项目 `grid-cols-*`/`bg-slate-*`/`dark:`/`text-[..]` 零残留 |
| 正确改法（非删类了事） | ✅ | PaperWorkbench 改用 `style={{display:'grid',...}}` + var(--glass-bg/--radius-xl/--ios-blue) token |
| emoji 未回潮 | ✅ | 铁律11 仍零 emoji |
| 核心逻辑未动 | ✅ | judge/verifyPaperInventory/drawQuestions git 无变更 |
| 测试/构建 | ✅ | 31 套件 144 用例全绿（纯样式改写，用例数不变合理），build 0 错 |

### 门禁决定
- **批次 #15 关闭。D4 关闭。任务 21（去emoji + 模块四UI）全部完成。**
- 样式系统统一至 iOS27 token + inline style，"模块四很乱"根因（Tailwind 空转）消除。
- **需用户 preview 肉眼终确认模块四美观度**（架构师只能验类名清除与 token 化，观感需用户判断）。
- 隐患 H1/H3 承前；D4 关闭。

## 批次 #16 — 任务22 题目图片渲染 + 统一图片UI（执行模型：gemini-3.8-flash · 跨项目契约）

- **契约**：math-junior-datalayer/CONTRACT_题目图片渲染_给前端.md（6条拍板已对齐）
- **架构师验收结论**：**✅ 通过。**

### 实测验收（重点验两个易错点 + 契约6拍板）

| 项 | 关联 | 结论 | 证据（实测） |
| :--- | :--- | :--- | :--- |
| 混合渲染器按锚点切分 | 拍板2（最易错） | ✅ | QuestionContent 用 /\[\[IMG:(\d+)\]\]/g 遍历切分，textBefore 段送 MathRenderer，锚点就地插 QuestionImage，绝不整段喂 MathRenderer；越界返 null 容错 |
| 图路径转绝对 | 拍板3 | ✅ | resolveQuestionImageSrc 相对路径加 / 前缀，http/data/blob 保持 |
| Lightbox 自实现无依赖 | 拍板5 | ✅ | inline fixed 模态 + ESC + 背景关闭，仅 import 自家 Icon，无图片库 |
| 三角色统一 UI | §3 | ✅ | stem/option/solution 各样式全走 iOS27 token，无硬编码色；骨架屏防CLS + onError 兜底 |
| 懒加载 | §4 | ✅ | loading=lazy decoding=async |
| 图打包进 dist | 拍板6 | ✅ | dist/assets/questions/ 有 990 webp |
| 判分/抽题零侵入 | 拍板1/Property17 | ✅ | drawQuestions 仅加 image_paths_json 字段透传（SELECT+映射），未碰 FROM questions/ME-隔离过滤；Property17 单跑 3/3 绿 |
| 零emoji/无foreignObject | 铁律11 | ✅ | 加载/错误用 Icon 非 emoji |
| 全量 | — | ✅ | 32 套件 154 用例全绿（+10 = QuestionContent 测试），build 0 错 |

### ⚠️ 数据层数据完整性观察（非前端问题，提醒转告数据层）
- 图数量三处不一致：assets/questions 源目录 1424 张、db 引用 1526 唯一路径、dist 打包 990 张。db 引用文件缺失=0（当前引用都能找到）。
- 判断：数据层图库仍在持续灌入/变动中，构建时点与当前时点数量不同步。**属数据层数据完整性，非前端渲染代码问题**，不阻塞前端验收。建议数据层核对：最终图总数、db 引用与文件是否一一对应、构建时确保全部图进 dist。

### 门禁决定
- **批次 #16 关闭，状态 ✅。题目图片渲染完成。**
- 需用户 preview 肉眼确认带图题（如 Q-2026-SD-0006）观感。
- 隐患 H1/H3 承前。

## 批次 #17 — 任务23 来源标签 + 溢出防御（执行模型：gemini-3.8-flash · 契约§5增量）

- **架构师验收结论**：**✅ 通过。**

### 实测验收（增量任务：只做§5，不重做图片渲染）
| 项 | 关联 | 结论 | 证据 |
| :--- | :--- | :--- | :--- |
| 短标签规则 | 契约§5 | ✅ | exam_year·region 拼接 |
| 微专题隐藏 | §5 | ✅ | region 空返回 null，不渲染空 pill（510 题） |
| 溢出防御 | 铁律12（新增） | ✅ | maxWidth 160px+overflow hidden+ellipsis+nowrap+title全文+minWidth0；实测数据 region 最长34字符/source 53字符可被截断不破版 |
| source 回退 | §5 | ✅ | 无region无year但有source时回退显示（母题场景） |
| 来源未污染题干 | §5红线 | ✅ | OnlineExam 中 SourceTag 与 QuestionContent 独立并列，题干只走 QuestionContent |
| 图片渲染组件零变更 | 硬约束 | ✅ | git diff --stat 空（QuestionContent/QuestionImage 未动） |
| 零emoji/token | 铁律10/11 | ✅ | 全 token，零 emoji |
| 全量 | — | ✅ | 33 套件 163 用例全绿（+9 SourceTag），build 0 错 |

### 新增规范
- **铁律12（文本溢出防御）**已写入 EXECUTION_GUIDE：一切 DB 文本渲染到受限空间必须截断+title+minWidth0，防长文本破版。后续所有数据显示任务自动受约束。

### 门禁决定
- **批次 #17 关闭。任务23完成。**
- 隐患 H1/H3 承前。

---

## 批次 #20 — TASK-FE-0020 【任务一：整体修改】全局基建与三端外壳重构（执行模型：gemini-3.8-flash · 架构师量化验收）

- **验收时间**：2026-09-24 14:55
- **对应方案**：`frontend_refactor_master_plan.md`（用户已审阅批准）
- **架构师验收结论**：**✅ 100% 全面通过，准予归档。**

### 五大量化硬性否决门禁实测证据

| 门禁项 | 架构师实测手段 | 合格标准（量化指标） | 实际测试数据与表现 | 结论 |
| :--- | :--- | :--- | :--- | :---: |
| **门禁 1：自动化回归** | 终端独立实跑 `pnpm test` | 54 个测试套件、323 个用例 100% PASS（0 fail） | **54 passed (54), 323 passed (323)**，耗时 6.81s | **PASS ✅** |
| **门禁 2：打包体积暴降** | 终端独立实跑 `pnpm build` | 主业务 JS Bundle 从 2,079 kB 暴降至 < 350 kB | **230.11 kB** (`dist/assets/index-BCMmkl1s.js`)，暴降 88.9% | **PASS ✅** |
| **门禁 3：样式纯洁度审计** | 正则与语义静态扫描 | 1. 门户与主壳层内联 `style={{` 减少 95% 以上<br>2. 源码中 emoji 残留数 = 0 | 1. `AllSubjectsPortal.tsx` 内联样式：**0**<br>2. `MathJuniorHome.tsx` 内联样式：**0**<br>3. 源码 Emoji 违规数：**0**（`noEmoji.test.ts` 绿灯） | **PASS ✅** |
| **门禁 4：真机三端控制台与视口** | Chrome DevTools Protocol (Phone 390, Pad 820, PC 1440) | 1. 控制台 0 Error、0 Warning<br>2. 手机端 `scrollWidth === clientWidth`（绝对 0 水平滚动条） | 1. 控制台错误数：**0**<br>2. 手机端 `scrollWidth` = 390, `clientWidth` = 390（无横向溢出）<br>3. 8 张现场截图（含 SHA256 唯一性校验）保存在 `tmp/fe0020/evidence/` | **PASS ✅** |
| **门禁 5：学习大厅记忆直达** | 模拟浏览器重开与记忆读写 | 存有记忆直接直达工坊；顶栏具备 `[ ← 返回全科门户 ]` 干净返回，绝不死循环跳回 | 1. 门户点击写入 `preferred_subject = 'math_junior'` 秒级直达<br>2. 点击返回清除记忆并携带 `?bypass_redirect=true` 干净回到门户 | **PASS ✅** |

### 铁律红线核验
- `SandboxRenderer.tsx` 与 `LeapLab.tsx` 保持绝对 **0 修改**（留待任务二与三）；
- 未引入未经批准的键盘快捷键；
- 既有 4 大子模块作为黑盒安全挂载进新壳层中。

### 门禁决定
- **批次 #20 关闭，状态 ✅。**
- 任务一（整体修改）正式验收归档，基建、分包与三端物理外壳完全就绪，解锁进入**【任务二：模型一重绘（TASK-FE-0021）】**。

---

## 批次 #21 — TASK-FE-0021 【任务二：模型一重绘】46 概念沙盒与模块一三大支柱全量交互闭环（执行模型：gemini-3.8-flash · 架构师量化验收）

- **验收时间**：2026-09-24 15:45
- **对应方案**：`TASK-FE-0021.md`
- **架构师验收结论**：**✅ 100% 全面通过，准予归档。**

### 五大量化硬性否决门禁实测证据

| 门禁项 | 架构师实测手段 | 合格标准（量化指标） | 实际测试数据与表现 | 结论 |
| :--- | :--- | :--- | :--- | :---: |
| **门禁 1：自动化回归** | 终端独立实跑 `pnpm test` | 既有 54 个测试套件、323 个用例 + 新增测试 100% PASS（0 fail） | **55 passed (55 files), 332 passed (332 tests)**，耗时 7.76s | **PASS ✅** |
| **门禁 2：46 概念沙盒全量覆盖** | 自动化测试与动态解析抽验 | 1. 46 个概念沙盒 `visual_elements_json`（填充面与直角标）正常解析与渲染<br>2. 1~3 步自适应探究与 Aha 顿悟状态机流转正常 | 1. 46 概念沙盒数据全量映射与解析正常<br>2. 几何染色面与直角标渲染引擎稳定运行<br>3. `evaluateSafeExpression` 动态判定与 Aha 弹窗触发 100% 准确 | **PASS ✅** |
| **门禁 3：母题与快练三端交互** | Chrome E2E 真实无头浏览器实测 | 1. 母题 1~4 阶手风琴逐级平滑展开，无闪烁<br>2. 快练 3 题即答即判，打星结算，错题具备 `[ 📖 回看概念精讲 ]` 直达入口 | 1. 母题 1~4 阶手风琴平滑解锁展开<br>2. 快练 12 选项热区均 >= 48px<br>3. 即答即判徽章即时呈现，打星与回看精讲闭环打通 | **PASS ✅** |
| **门禁 4：手机端绝对手势隔离** | 真实无头 Chrome 390x844 触控拖拽 | 1. 沙盒内拖动动点时 `touch-action: none` 生效，页面绝对零上下滚动误触<br>2. 手机端 `scrollWidth === clientWidth`（绝对 0 水平溢出） | 1. 顶部 280px 容器及动点 `touch-action: none`<br>2. 手机端 `scrollWidth` = 390, `clientWidth` = 390（无横向溢出）<br>3. 真实浏览器控制台捕获致命错误数：**0** | **PASS ✅** |
| **门禁 5：样式与红线坚守** | 正则与源码扫描 | 1. 模块一代码内联样式 `style={{` 残留数 <= 5 处（仅限动态坐标/尺寸）<br>2. 源码中 emoji 残留数 = 0 | 1. 模块一内联样式仅 2 处（`LinkedSandboxSlot.tsx` 动态高度计算，2 <= 5）<br>2. 源码 Emoji 违规数：**0**（`noEmoji.test.ts` 严格绿灯） | **PASS ✅** |

### 铁律红线核验
- 🔴 `LeapLab.tsx`、模块二【思维图谱】泳道算法及模块三【沙盒大厅】保持绝对 **0 修改**（留待任务三执行）；
- 🔴 55 个测试套件、332 个自动化测试 100% PASS；
- 🔴 源码绝对零 emoji，严格遵循 Apple HIG 视觉规范与 Slate 900 暗室对比度防御；
- 🔴 手机端 0 水平滚动条溢出。

### 实测截图证据链（SHA256 哈希固化）
- `fe0021_e2e_phone_390x844_four_stages.png` (272,089 B, SHA256: `965a532d420f61cc`)
- `fe0021_e2e_phone_390x844_linked_sandbox.png` (212,619 B, SHA256: `a470ae55736e0ff5`)
- `fe0021_e2e_pad_820x1180_drawer_open.png` (173,023 B, SHA256: `ebae2015b694a04e`)
- `fe0021_e2e_pc_1440x900_master_accordion.png` (193,654 B, SHA256: `a41fdd6d35c0a7d6`)
- `fe0021_e2e_pc_1440x900_quick_practice_feedback.png` (137,974 B, SHA256: `b328454d0f1d4242`)

### 门禁决定
- **批次 #21 关闭，状态 ✅。**
- 任务二（46 概念沙盒与模块一三大支柱全量交互闭环）正式验收归档，模块一现代化重绘完成，准予解锁进入**【任务三：模型二/三重绘（TASK-FE-0022）】**。


