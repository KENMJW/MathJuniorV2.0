# 实现计划：全科核心素养提分系统 V2.0 — 初中数学模块（前端应用与数据消费层）

> **Feature**：`math-junior-frontend`
> **唯一依据**：本任务清单严格从 [`design.md`](./design.md) 拆解而来，凡属性编号（Property N）、契约条款（CT-N）、章节号（§X）均可回溯到设计文档。
> **执行方**：能力较弱的代码生成模型（gemini-flash）。因此每个任务【单一职责、边界清晰、可独立验收】，并在 [验收] 中给出 Kiro 架构师可勾选的 checklist。
> **验收方**：架构师（Kiro）。凡涉及正确性属性的任务，验收标准均要求属性测试（fast-check TS / Hypothesis Python）**≥100 次迭代**，标签格式 `Feature: math-junior-frontend, Property N`。EDGE_CASE 属性（P2、P8、P19、P21）用构造性用例 + 副作用断言。

---

## 📌 建议先跑：纵向验证切片（1 个考点端到端，小成本试跑）

在铺开四大模块全量实现前，**强烈建议先完成一条最小端到端切片**，用最低成本验证脚手架、门神、mock db、模块一单考点、单个沙盒五者能否贯通。对应下列任务子集，按此顺序做完即可看到一个可运行的单考点闭环：

- **脚手架**：`1.1` → `1.2` → `1.3`（Vite/React/TS/PWA + Worker WASM 只读连接 + 会话 store）
- **门神**：`2.1`（入库清洗）+ `2.3`（出库 `<MathRenderer>`）
- **mock db**：`3.2`（生成满足契约的 mock `math_junior.db`）
- **模块一单考点**：`9.1`（四段论视窗）+ `9.4`（单点快练状态机）
- **单个沙盒**：`11.1`（`<SandboxRenderer>` 核心）+ `11.2`（1 个代表性沙盒配置：二次铅垂高）

跑通该切片后再按依赖图逐波并行推进其余任务。此切片是 R1/R2/R3/R4 风险的早期探针。

---

## 任务清单

### 1. 脚手架与运行期基座（§2）

- [x] 1. 搭建前端脚手架与运行期基座
  - [x] 1.1 初始化 Vite + React18 + TS + PWA + 引擎降级
    - 创建 Vite 工程；集成 React 18、TypeScript、`vite-plugin-pwa`（Service Worker 预缓存 app shell）。
    - 配置 `browserslist` 目标引擎 + `@vitejs/plugin-legacy` 生成降级包与 polyfill。
    - 建立目录结构：`src/`（modules/engine/components/store/locales）、`data/`（core/master/sandbox/questions.db 占位）。
    - [产出文件] `package.json`、`vite.config.ts`、`.browserslistrc`、`tsconfig.json`、`src/main.tsx`、`src/App.tsx`
    - [依赖] 无
    - [验收] `pnpm build` 产出纯静态 JS/HTML/CSS；PWA manifest 与 SW 注册成功；legacy 包生成。（§2.1、§2.2）
  - [x] 1.2 封装 Web Worker + WASM SQLite 只读分包加载器
    - 在 Web Worker 中集成 `@sqlite.org/sqlite-wasm`；对 `core/master/sandbox/questions.db` 各建**独立只读连接**。
    - 实现按需加载：`fetch(分包) → ArrayBuffer → 挂载`；启动仅加载 `core.db`，其余进入对应模块时惰性加载。
    - 暴露参数化查询接口（`?` 占位，防注入），主线程用 Promise/postMessage 通信。
    - [产出文件] `src/engine/db/worker.ts`、`src/engine/db/dbClient.ts`、`src/engine/db/packages.ts`
    - [依赖] 1.1
    - [验收] 各分包独立只读连接建立；未进入模块前对应分包不加载；查询走参数化占位。（§2.3、§2.5）
  - [x] 1.3 建立零持久化会话内存 store
    - 用 Zustand（或 Context）实现纯会话内存 store：`presented_ids` 去重集合、即时得分、沙盒滑块值、当前 locale、设备 override。
    - **禁止**任何 `localStorage` / `IndexedDB` 写入。
    - [产出文件] `src/store/sessionStore.ts`
    - [依赖] 1.1
    - [验收] store 字段齐全；刷新页面即清空；代码中零持久化写调用（横切校验见任务 13）。（§1.4、§2.4）

### 2. 数学门神（入库 + 出库，§6）

- [x] 2. 实现数学排版单入口·单出口门神
  - [x] 2.1 实现入库门神 `sanitize_and_verify_math()`（构建期 Python）
    - 定界符归一：`\( \)`→`$...$`、`\[ \]`→`$$...$$`、全角 `＄`→`$`。
    - 符号标准化：`*`→`\times`、`÷`→`\div`、`度`→`^\circ`、`Rt△`→`\text{Rt}\triangle`、`△`→`\triangle`。
    - 反斜杠转义加固。
    - Headless 语法预检：花括号计数、`\begin`/`\end` 环境闭合校验；不通过 `raise ValueError`，拒绝写入。
    - [产出文件] `scripts/build/math_gate.py`
    - [依赖] 无
    - [验收:Property 1, CT-4] 归一化闭包：输出不再含 `\(`/`\[`/`＄`，符号已标准化。
  - [x]* 2.2 门神清洗与拒绝的属性测试（Python / Hypothesis）
    - **Property 1：入库门神归一化闭包**（≥100 次迭代）—— 断言输出不残留旧定界符/未标准化符号。
    - **Property 2：不闭合公式必被拒绝入库**（EDGE_CASE）—— 构造花括号/环境不匹配片段，断言必抛异常且**未写入 DB**（mock/spy DB 写接口，调用次数为 0）。
    - [产出文件] `scripts/build/test_math_gate.py`
    - [依赖] 2.1
    - [验收:Property 1, Property 2] 标签 `Feature: math-junior-frontend, Property 1/2`；P2 用副作用断言。
  - [x] 2.3 实现出库门神 `<MathRenderer>`（运行期 React）
    - 唯一出口组件，props：`content`、`block?`、`className?`。
    - `katex.renderToString(..., { throwOnError:false, errorColor:'#ef4444', strict:false, trust:false })`。
    - 全局 LRU 缓存（容量 1000）；`escapeHtml` 防 XSS；公式色彩 `currentColor`；内嵌本地 WOFF2。
    - 业务层禁止私自 `import katex` / 写 `innerHTML`。
    - [产出文件] `src/components/math/MathRenderer.tsx`、`src/components/math/katexCache.ts`、`src/assets/fonts/`（WOFF2）
    - [依赖] 1.1
    - [验收:Property 3, Property 4] 见任务 2.4。
  - [x]* 2.4 出库渲染属性测试（TS / fast-check）
    - **Property 3：出库渲染永不崩溃**（≥100 次迭代）—— 任意字符串（含畸形 LaTeX）不抛异常、返回非空 HTML、非法片段标红 `math-error`。
    - **Property 4：出库渲染缓存幂等**（≥100 次迭代）—— 同文本连续两次渲染 HTML 完全相同；缓存条目数 ≤ `MAX_CACHE_SIZE`。
    - [产出文件] `src/components/math/MathRenderer.property.test.ts`
    - [依赖] 2.3
    - [验收:Property 3, Property 4] 标签 `Feature: math-junior-frontend, Property 3/4`。

- [x] 3. Checkpoint —— 门神与脚手架冒烟
  - Ensure all tests pass, ask the user if questions arise.

### 3. ETL 契约适配层 + mock db（§3、§4）

- [x] 4. 实现 ETL 契约适配层与 mock 数据库
  - [x] 4.1 定义契约类型与 `adaptQuestion()` 映射
    - 定义 `UpstreamPackedQuestion`（§3.1）与 `FlatQuestionRow`（§4.4）类型。
    - 实现 `adaptQuestion()`：上游打包 JSON → 前端扁平行，无损映射业务字段；`score_default ?? 2`；rubric 步骤映射为 `{stepIndex,descriptionZh,descriptionEn,points}`。
    - 入口用 zod 做 schema 校验 + CT-1~CT-8 断言（应对上游契约漂移 R6）。
    - [产出文件] `scripts/build/etl/types.ts`、`scripts/build/etl/adaptQuestion.ts`
    - [依赖] 无
    - [验收:Property 5, CT-1, CT-3] 业务字段等价保真；`difficulty_level∈[1,9]`、`question_type` 属枚举。
  - [x]* 4.2 ETL 映射属性测试（TS / fast-check）
    - **Property 5：ETL 映射业务字段保真**（≥100 次迭代）—— 任意合法上游记录，扁平行关键字段与上游等价且约束成立。
    - [产出文件] `scripts/build/etl/adaptQuestion.property.test.ts`
    - [依赖] 4.1
    - [验收:Property 5] 标签 `Feature: math-junior-frontend, Property 5`。
  - [x] 4.3 编写扁平 Schema DDL 建库脚本
    - 按 §4.2 DDL 建 8 张表（knowledge_points / logic_lines / knowledge_combinations / knowledge_graph_semesters / concept_sandboxes / leap_sandbox_models / master_examples / questions）+ 覆盖索引 + CHECK 约束（`kp_count 1~8`、`difficulty_level 1~9`、枚举）。
    - 分包写入 `core/master/sandbox/questions.db`。
    - [产出文件] `scripts/build/db/schema.sql`、`scripts/build/db/buildDb.ts`
    - [依赖] 无
    - [验收:CT-1, CT-2, CT-3] DDL 与 §4.2 一致；CHECK 约束生效；分包正确切分。
  - [x] 4.4 生成满足契约条款 CT-1~CT-8 的 mock `math_junior.db`
    - 造种子数据：≥1 完整考点（四段字段齐全）、其考点母题（`dim3_rigor` 必填）、1 个概念沙盒配置、若干 `single_choice` 真题（覆盖 L1~L3）、组合数据（含 `kp_count>4` 用例）。
    - 母题只入 `master_examples`，真题只入 `questions`（物理隔离）。
    - [产出文件] `scripts/build/db/mockSeed.ts`、`data/*.db`（生成产物）
    - [依赖] 4.3
    - [验收:CT-1~CT-8] mock db 满足全部契约；前端可脱离上游独立开发。（§4.4 开发解耦）

### 4. 内容生成管线 [高风险]（§5）

- [ ] 5. 构建期大模型内容生成管线 **[高风险]**
  > **口径说明（Kiro 记，2026-09）**：本任务的**产出内容已由数据线（math-junior-datalayer）"阶段二回填"流程全部生成入库**，非由前端线执行本任务的构建期管线。实测状态：core.db 考点四段(107)全 done、主线四段(12)全 done、master.db 母题四维(119)全 done 且 dim3 全填、sandbox 概念沙盒46+跃迁模型36。故此处 `[ ]` 仅表示"前端未自建构建期生成管线"，**不代表内容缺失**——内容真实完整可供人工测试。前端只做消费渲染（见 TASK-FE-0003 H 项核实）。
  - [ ] 5.1 实现大模型 Prompt 契约（母题四维 / 四段 / 主线 / 沙盒文本）
    - 按 §5.3 定义 `MasterExamplePromptContract` 及四段精讲、主线精讲、`inquiry_guide`/`model_brief`（30~45 字口诀）的 prompt 模板与输出 schema。
    - [产出文件] `scripts/build/gen/promptContracts.ts`、`scripts/build/gen/generate.ts`
    - [依赖] 4.3
    - [验收] 输出结构匹配 `output_schema`；四类内容各有独立契约。（§5.1、§5.3）
  - [ ] 5.2 实现自适应 1~4 维判定 **[高风险]**
    - 按 §5.4 梯队规则判定可用维度：四维完全穿透 / 三维进阶 / 双维核心 / 一维直击。
    - 铁律：几何/函数/综合方程大考点强制 ≥3 维；`dim3_rigor` 恒必填。
    - [产出文件] `scripts/build/gen/dimensionPolicy.ts`
    - [依赖] 5.1
    - [验收:Property 18, CT-6] 见任务 5.5。
  - [ ] 5.3 集成强制清洗门禁 **[高风险]**
    - 所有生成内容在 `INSERT/UPDATE` 前必过 `sanitize_and_verify_math()`；未通过者拒绝落库 + 回炉重生成，脏公式绝不进 DB。
    - [产出文件] `scripts/build/gen/gateGuard.ts`
    - [依赖] 5.1, 2.1
    - [验收:Property 21] 见任务 5.6。
  - [ ] 5.4 建立教研人工抽检兜底闭环钩子
    - 生成产物落一份可审阅清单（未清洗前的候选内容 + 门神判定结果），供教研抽检与回炉；对几何/函数大考点标注强制 ≥3 维校验结果。
    - [产出文件] `scripts/build/gen/reviewManifest.ts`、`scripts/build/gen/out/review.json`（产物）
    - [依赖] 5.2, 5.3
    - [验收] 生成审阅清单含门神判定 + 维度校验；不达标项可回炉。（§5.5、R3）
  - [ ]* 5.5 维度自适应约束属性测试（TS / fast-check）
    - **Property 18：母题维度自适应约束**（≥100 次迭代）—— 任意母题 `dim3_rigor` 非空、可用维度 ∈[1,4]；几何/函数大考点维度 ≥3。
    - [产出文件] `scripts/build/gen/dimensionPolicy.property.test.ts`
    - [依赖] 5.2
    - [验收:Property 18, CT-6] 标签 `Feature: math-junior-frontend, Property 18`。
  - [ ]* 5.6 清洗门禁属性测试（Python / Hypothesis，EDGE_CASE）
    - **Property 21：生成内容清洗门禁**（EDGE_CASE）—— 仅当内容过门神时才写库；未通过者被拦截且 DB 写接口调用次数为 0（spy 断言）。
    - [产出文件] `scripts/build/gen/test_gate_guard.py`
    - [依赖] 5.3
    - [验收:Property 21] 标签 `Feature: math-junior-frontend, Property 21`；副作用断言。

- [ ] 6. Checkpoint —— ETL 与内容生成管线
  - Ensure all tests pass, ask the user if questions arise.

### 5. 判分引擎 [高风险]（§8）

- [x] 7. 实现判分引擎 **[高风险]**
  - [x] 7.1 实现 `normalizeMathString()` 规范化清洗
    - 全角转半角、去空格、`\frac{}{}`→`()/()`、`\sqrt{}`→`sqrt()`、`\pm`/`\times`/`\div`/`\pi` 符号替换。纯字符串变换，无求值。
    - [产出文件] `src/engine/judge/normalize.ts`
    - [依赖] 1.1
    - [验收:Property 6] 见任务 7.6。
  - [x] 7.2 实现受控白名单解析器（tokenizer + 递归下降）**[高风险]**
    - `tokenize` + `recursiveDescentParse` 产出白名单 AST（`num/var/bin/call(sqrt|sin|cos|tan|abs)/neg`）。
    - **危险 token 硬拦截** `FORBIDDEN`：命中 `Function/eval/window/globalThis/constructor/import/require/process`、`=>`、反引号即 `throw ParseError`，绝不进入任何 JS 求值路径。
    - **严禁** `eval`/`Function`。
    - [产出文件] `src/engine/judge/parser.ts`（tokenizer + parser + FORBIDDEN）
    - [依赖] 1.1
    - [验收:Property 8] 见任务 7.7（安全不变量）。
  - [x] 7.3 实现纯数值求值器 `evalExpr()` + 定义域抽样 `sampleDomain()`
    - 仅遍历白名单 AST 做递归数值计算，无 eval。
    - `collectVars` + `sampleDomain` 在定义域内生成 5~10 组随机代入环境。
    - [产出文件] `src/engine/judge/evalExpr.ts`、`src/engine/judge/sampleDomain.ts`
    - [依赖] 7.2
    - [验收] 求值仅走 AST；采样点数 5~10；定义域外点跳过。（§8.1）
  - [x] 7.4 实现填空等价判定 `isMathAnswerEquivalent()`
    - 规范化 → 字面命中 → 受控解析 → 定义域多点代入（各点 `|Δ|<1e-6` 判等价）。
    - 分类答案按 `或`/`,`/`;` 拆为**无序集合**比对。
    - 解析失败/含危险 token → 返回 `'suspect'`（疑似正确，建议自核），不误扣分、不求值。
    - [产出文件] `src/engine/judge/isMathAnswerEquivalent.ts`
    - [依赖] 7.1, 7.2, 7.3
    - [验收:Property 7] 见任务 7.6。
  - [x] 7.5 实现解答题 rubric 自核 `calculateSolutionScore()`
    - 定义 `RubricStep`；得分 = 打钩步骤分值之和，恒 `0 ≤ score ≤ Σ步骤分`。
    - [产出文件] `src/engine/judge/calculateSolutionScore.ts`
    - [依赖] 1.1
    - [验收:Property 9] 见任务 7.8。
  - [x]* 7.6 填空规范化与等价判定属性测试（TS / fast-check）
    - **Property 6：填空规范化清洗彻底性**（≥100 次迭代）—— 输出无 `\frac`/`\sqrt`/空白/全角。
    - **Property 7：填空数值代入等价判定正确性**（≥100 次迭代）—— 等价对判 `true`、不等价对判 `false`；分类答案无序集合比对。
    - [产出文件] `src/engine/judge/judge.property.test.ts`
    - [依赖] 7.1, 7.4
    - [验收:Property 6, Property 7] 标签 `Feature: math-junior-frontend, Property 6/7`。
  - [x]* 7.7 判分器安全零求值属性测试（TS / fast-check，EDGE_CASE）
    - **Property 8：判分器对危险输入零求值**（EDGE_CASE）—— 含 `Function/eval/window/constructor` 等输入使 `parseControlled()` 抛错并返回 suspect，全程无 JS 求值、无全局副作用（spy 断言全局状态未被写）。
    - [产出文件] `src/engine/judge/parser.security.test.ts`
    - [依赖] 7.2
    - [验收:Property 8] 标签 `Feature: math-junior-frontend, Property 8`；副作用断言。
  - [x]* 7.8 解答题自核得分属性测试（TS / fast-check）
    - **Property 9：解答题自核得分守恒**（≥100 次迭代）—— 返回值 = 打钩步骤分值之和且 `0 ≤ score ≤ Σ步骤分`。
    - [产出文件] `src/engine/judge/calculateSolutionScore.property.test.ts`
    - [依赖] 7.5
    - [验收:Property 9] 标签 `Feature: math-junior-frontend, Property 9`。

- [x] 8. Checkpoint —— 判分引擎
  - Ensure all tests pass, ask the user if questions arise.

### 6. i18n 引擎（§10.5）

- [x] 14. 实现 i18n 引擎
  - [x] 14.1 建立 zh-CN/en 字典 + `data-i18n` 热切换
    - `locales/zh-CN.json`、`locales/en.json`；`[data-i18n]` 键绑定；广播事件全局热切换（无需重载）。
    - [产出文件] `src/locales/zh-CN.json`、`src/locales/en.json`、`src/engine/i18n/i18n.ts`
    - [依赖] 1.1, 1.3
    - [验收] 切换 locale 后带 `data-i18n` 的 DOM 文案即时更新。（§10.5）
  - [x] 14.2 实现数据层双语字段投影 `projectLocale()`
    - 对含 `_zh`/`_en` 字段的记录按当前 locale 投影展示字段；数学 LaTeX 源码共用，仅翻译文字。
    - [产出文件] `src/engine/i18n/projectLocale.ts`
    - [依赖] 14.1
    - [验收:Property 14] 见任务 14.3。
  - [x]* 14.3 双语投影属性测试（TS / fast-check）
    - **Property 14：i18n 双语字段投影一致**（≥100 次迭代）—— `zh-CN` 返回 `_zh`、`en` 返回 `_en`。
    - [产出文件] `src/engine/i18n/projectLocale.property.test.ts`
    - [依赖] 14.2
    - [验收:Property 14] 标签 `Feature: math-junior-frontend, Property 14`。

### 7. 设备调度引擎（§10.4）

- [x] 15. 实现设备检测调度引擎
  - [x] 15.1 实现 `detectDeviceProfile()` + 手动 override
    - 运行时特征判定（`matchMedia(hover/pointer)`、尺寸、纵横比、触控点数）→ 返回 `MOBILE`/`TABLET`/`DESKTOP`；支持全局 override（无需重载切控制器）。
    - [产出文件] `src/engine/device/detectDeviceProfile.ts`、`src/engine/device/deviceOverride.ts`
    - [依赖] 1.3
    - [验收:Property 15] 见任务 15.2。
  - [x]* 15.2 设备判定完备性属性测试（TS / fast-check）
    - **Property 15：设备判定全域完备**（≥100 次迭代）—— 任意特征输入返回值恒 ∈ `{MOBILE,TABLET,DESKTOP}`（无 `undefined`）；有 override 时返回 override。
    - [产出文件] `src/engine/device/detectDeviceProfile.property.test.ts`
    - [依赖] 15.1
    - [验收:Property 15] 标签 `Feature: math-junior-frontend, Property 15`。

### 8. iOS 27 液态玻璃设计系统（§10.1~§10.3）

- [x] 16. 建立 iOS 27 液态玻璃设计系统
  - [x] 16.1 定义统一 token（CSS 变量）+ 明暗模式
    - 按 §10.2 落一套且仅一套 token：动态系统色、液态玻璃面、Squircle 圆角、弹簧曲线；明暗模式走同一套语义变量，禁止硬编码 `#000/#fff`；不引入已作废的 `--status-*`/`--pulse-track`。
    - [产出文件] `src/styles/tokens.css`、`src/styles/theme.ts`
    - [依赖] 1.1
    - [验收] token 与 §10.2 一致；暗色模式切换零延迟；无作废 token。
  - [x] 16.2 实现三端交互范式基础组件骨架
    - 手机横向卡片穿透流（Card Deck / Bottom Sheet，100dvh 锁定、拇指热区 ≥52px）；平板分栏画板（Split Master-Detail，左导航 280px，热区 ≥44px）；电脑宽屏剧场（Cockpit / Scroll-Snap / 快捷键、可折叠导航树）。
    - 组件由设备调度引擎选择渲染。
    - [产出文件] `src/components/shell/CardDeck.tsx`、`src/components/shell/SplitBoard.tsx`、`src/components/shell/Cockpit.tsx`
    - [依赖] 16.1, 15.1
    - [验收] 三端骨架按设备 profile 切换；触控范式与热区符合 §10.3。

### 9. 模块一：探本溯源·概念精讲（§7.1）

- [ ] 9. 实现模块一 概念精讲
  - [x] 9.1 四段论单屏自闭环视窗 + SVG 图层点亮（路线 B）
    - 读 `knowledge_points` 四段字段经 `<MathRenderer>` 渲染；单屏自闭环（非瀑布流）。
    - SVG 第 2 段隐藏字母图层、第 3 段淡入点亮（`<g class="formal-labels">` opacity 0→1）。
    - [产出文件] `src/modules/concept/ConceptFourStages.tsx`、`src/modules/concept/SvgLayerReveal.tsx`
    - [依赖] 2.3, 4.4, 14.2
    - [验收:Property 13（同模块闭环上下文）] 四段全渲染；SVG 图层按段点亮；公式经门神出口。（§7.1）
  - [x] 9.2 链接沙盒（含 CLS=0 等大占位卡）
    - `sandbox_id` 非空 → 渲染实验室一沙盒（挂载任务 11 的 `<SandboxRenderer>`）；为空 → 渲染物理等大占位卡（CLS=0）。
    - [产出文件] `src/modules/concept/LinkedSandboxSlot.tsx`
    - [依赖] 9.1, 11.1
    - [验收] 有/无沙盒两分支正确；占位卡与沙盒尺寸一致（CLS=0）。（§7.1、§9.3）
  - [x] 9.3 考点母题步进解锁
    - 读 `master_examples`（`example_type='point_master'`），按 `available_dimensions` 步进点击解锁；`dim3_rigor` 必展示。
    - [产出文件] `src/modules/concept/PointMasterExample.tsx`
    - [依赖] 9.1, 4.4
    - [验收] 按可用维度逐步解锁；dim3 恒展示。（§7.1、Property 18 数据前置）
  - [x] 9.4 单点快练抽样去重状态机（L1~L3 单选）
    - 实现 §7.1.1 状态机：`presented_ids` 去重、`NOT IN` 参数化抽 3 题、池耗尽 `clear()` 后重抽满 3；锁 L1~L3、`single_choice`；即答即判接判分引擎；得分入会话内存。
    - [产出文件] `src/modules/concept/QuickPractice.tsx`、`src/modules/concept/quickPractice.machine.ts`
    - [依赖] 1.2, 1.3, 7.4
    - [验收:Property 13] 见任务 9.5。
  - [x]* 9.5 单点快练去重与池耗尽属性测试（TS / fast-check）
    - **Property 13：单点快练去重与池耗尽重置**（≥100 次迭代）—— 池 ≥3 时抽出题不在 `presented_ids`；池 <3 时清空并重抽满 3。
    - [产出文件] `src/modules/concept/quickPractice.property.test.ts`
    - [依赖] 9.4
    - [验收:Property 13] 标签 `Feature: math-junior-frontend, Property 13`。

### 10. 模块二：经纬纵横·思维图谱（纯静态 + 焦点穿透，§7.2）

- [ ] 10. 实现模块二 思维图谱（纯静态，已删诊断）
  - [x] 10.1 6 学期 × 12 主线泳道地铁图
    - 107 考点锚定 6×12 网格槽位；`knowledge_graph_semesters` 依赖边连通。**不做任何学情着色/掌握度渲染/溯源**。
    - [产出文件] `src/modules/graph/SubwayMap.tsx`
    - [依赖] 1.2, 16.1
    - [验收] 泳道地铁图静态渲染；无 `--status-*` 着色、无 `traceRootCause`、无脉冲红线。（§1.3、§7.2）
  - [x] 10.2 焦点穿透（入度蓝 / 出度紫光束）
    - 点击考点：无关节点 opacity→0.15；读 `predecessors` 渲染蓝色入度光束、`successors` 渲染紫色出度光束。
    - [产出文件] `src/modules/graph/FocusBeam.tsx`
    - [依赖] 10.1
    - [验收] 入/出度光束颜色与来源正确；焦点外节点淡出。（§7.2）
  - [x] 10.3 组合视图（kp_count 1~8 动态渲染）
    - 右侧滑出考点档案，列出含该考点的 Top 组合（Clique）；组合节点数按 `kp_count` **1~8 动态渲染**，禁止硬编码上限 4。提供跳转概念精讲/沙盒/专项测评入口。
    - [产出文件] `src/modules/graph/CombinationPanel.tsx`
    - [依赖] 10.1
    - [验收:Property 12, CT-2] 见任务 10.5。
  - [ ] 10.4 主线四位一体闭环 + 主线快练（L4~L6）
    - 主线精讲（`logic_lines` 四段）+ 旗舰模型（`flagship_model_id`）+ 主线母题（`ME-LINE-xx`）+ 3 题主线快练（锁 L4~L6）。快练复用任务 9.4 状态机（难度锁 L4~L6）。
    - [产出文件] `src/modules/graph/LineClosedLoop.tsx`、`src/modules/graph/LineQuickPractice.tsx`
    - [依赖] 10.1, 9.4
    - [验收] 四要素齐全；快练锁 L4~L6（与组合基数无关）。（§7.2、§11.3）
  - [x]* 10.5 组合基数动态渲染属性测试（TS / fast-check）
    - **Property 12：组合基数 1~8 动态渲染**（≥100 次迭代）—— 任意 `kp_count∈[1,8]`，渲染节点数严格等于 `kp_count`，不因 `>4` 截断。
    - [产出文件] `src/modules/graph/combination.property.test.ts`
    - [依赖] 10.3
    - [验收:Property 12, CT-2] 标签 `Feature: math-junior-frontend, Property 12`。

### 11. 模块三：见微知著·实验探究（双轨沙盒）[高风险]（§9）

- [ ] 11. 实现模块三 双轨沙盒 **[高风险]**
  - [x] 11.1 实现通用 `<SandboxRenderer>` 核心（JSXGraph 声明式驱动）**[高风险]**
    - 定义 `SandboxConfig` 契约（§9.2）；通用渲染器读 `viewbox/dragPoints/paramSliders/invariantsDisplay` 配置构建 JSXGraph Board。`canvas_template` 语义为配置模板 ID。
    - [产出文件] `src/modules/sandbox/SandboxRenderer.tsx`、`src/modules/sandbox/sandboxConfig.ts`
    - [依赖] 1.1, 4.4
    - [验收] 声明式配置驱动生成动点/滑块/不变量；无手写专用组件。（§9.1、§9.2）
  - [x] 11.2 实现 `clampDynamicValue()` + `calculateMasterAnchoredViewport()`
    - `clampDynamicValue()`：纯数值 clamp（禁用 Function/eval），越界弹性阻尼停止。
    - `calculateMasterAnchoredViewport()`：保形 + 含原 bbox + ≥15% 边距 + 中心对齐；同主线 L1/L2/L3 锚定 Tier3 同一 `viewBox`。
    - [产出文件] `src/modules/sandbox/clampDynamicValue.ts`、`src/modules/sandbox/viewport.ts`
    - [依赖] 11.1
    - [验收:Property 10, Property 11] 见任务 11.5。
  - [x] 11.3 代表性沙盒配置验证 DSL 覆盖度（早期风险探针）**[高风险]**
    - 用 2~3 个代表模型（手拉手、阿氏圆、二次铅垂高）编写声明式配置，验证 `SandboxRenderer` 配置 DSL 覆盖度（R2）；不足处预留 `customBehaviorId` 逃生舱（仍禁 eval）。
    - 布局：85%:15% 纵向（上画布 + 下 52~56px 极简指南），`preserveAspectRatio="xMidYMid meet"`。
    - [产出文件] `src/modules/sandbox/configs/hand-in-hand.ts`、`.../apollonius.ts`、`.../quadratic-vertical-height.ts`、`src/modules/sandbox/SandboxLayout.tsx`
    - [依赖] 11.1, 11.2
    - [验收:R2] 3 个代表沙盒纯配置驱动可跑；覆盖度不足项走逃生舱且不引入 eval。（§9.3、§13 R2）
  - [ ] 11.4 实验室二：4D 变异控制器 + X-Ray
    - 读 `leap_sandbox_models`；实现载体/参数/姿态/干扰加壳四类变异控制器 + X-Ray 骨架透视图层。
    - [产出文件] `src/modules/sandbox/LeapLab.tsx`、`src/modules/sandbox/morphControllers.ts`、`src/modules/sandbox/XRayLayer.tsx`
    - [依赖] 11.1, 11.2
    - [验收] 四类变异与 X-Ray 图层由配置驱动；视口统一锚定。（§9.4）
  - [x]* 11.5 沙盒截断与视口属性测试（TS / fast-check）
    - **Property 10：动点参数硬截断有界性**（≥100 次迭代）—— `clampDynamicValue()` 输出恒 ∈[min,max]；域内时严格等于 raw。
    - **Property 11：沙盒统一视口保形与包容**（≥100 次迭代）—— 视口宽高比 = 目标比、完全含原 bbox、四周留白 ≥15%、中心一致；同主线 L1/L2/L3 锚定同一 viewBox。
    - [产出文件] `src/modules/sandbox/sandbox.property.test.ts`
    - [依赖] 11.2
    - [验收:Property 10, Property 11] 标签 `Feature: math-junior-frontend, Property 10/11`。

- [ ] 12. Checkpoint —— 模块一/二/三与设计系统
  - Ensure all tests pass, ask the user if questions arise.

### 12. 模块四：百炼成钢·实战测评（§7.4）

- [ ] 17. 实现模块四 实战测评
  - [x] 17.1 精准出题中心：组卷工作台 + 预设卷 + 满分制
    - 满分制一键套用（100/120/150）、预设卷库、自定义工作台（107 考点复选 + L1~L5 难度滑块）。
    - [产出文件] `src/modules/exam/PaperWorkbench.tsx`、`src/modules/exam/presetPapers.ts`
    - [依赖] 1.2, 4.4, 16.2
    - [验收] 满分制切换、预设卷加载、自定义筛选可用。（§7.4 子系统 A）
  - [x] 17.2 库存预警拦截 `verifyPaperInventory()`
    - 任一题型需求 > 库存 → `canGenerate=false` 且禁用生成按钮。
    - [产出文件] `src/modules/exam/verifyPaperInventory.ts`
    - [依赖] 17.1
    - [验收:Property 16] 见任务 17.7。
  - [x] 17.3 母题物理隔离抽题
    - 组卷/测评抽题**只查 `questions`**，绝不触及 `master_examples`。
    - [产出文件] `src/modules/exam/drawQuestions.ts`
    - [依赖] 1.2, 17.1
    - [验收:Property 17, CT-8] 见任务 17.8。
  - [x] 17.4 双栏 A4 打印导出
    - `@media print` 双栏 A4；`page-break-inside: avoid` 防截断。
    - [产出文件] `src/modules/exam/PrintLayout.tsx`、`src/modules/exam/print.css`
    - [依赖] 17.1
    - [验收] 打印预览双栏 A4、题目不跨页截断。（§7.4）
  - [x] 17.5 在线测评中心：左右解耦 Split-View + 全局数学键盘
    - 左卷滚动 / 右指挥舱 sticky；全局唯一数学键盘（onFocus 呼出）。
    - [产出文件] `src/modules/exam/OnlineExam.tsx`、`src/modules/exam/MathKeyboard.tsx`
    - [依赖] 17.1, 16.2
    - [验收] 左右解耦滚动/静止；键盘聚焦呼出。（§7.4 子系统 B）
  - [x] 17.6 判分接入 + 四维雷达图 + 考完即焚
    - 填空接 `isMathAnswerEquivalent`、解答接 `calculateSolutionScore` 自核打钩；总分累加入会话内存；四维认知素养雷达图；交卷后考完即焚（零持久化）。
    - [产出文件] `src/modules/exam/ScorePanel.tsx`、`src/modules/exam/RadarChart.tsx`
    - [依赖] 17.5, 7.4, 7.5, 1.3
    - [验收] 填空/解答判分正确接入；雷达图渲染；刷新即清空。（§7.4、Property 19 前置）
  - [x]* 17.7 库存预警属性测试（TS / fast-check）
    - **Property 16：组卷库存预警拦截正确性**（≥100 次迭代）—— 当且仅当任一题型需求 > 库存时 `canGenerate===false`。
    - [产出文件] `src/modules/exam/verifyPaperInventory.property.test.ts`
    - [依赖] 17.2
    - [验收:Property 16] 标签 `Feature: math-junior-frontend, Property 16`。
  - [x]* 17.8 母题物理隔离属性测试（TS / fast-check）
    - **Property 17：母题与真题物理隔离**（≥100 次迭代）—— 抽出的 `question_id` 集合与 `example_id` 集合交集为空。
    - [产出文件] `src/modules/exam/drawQuestions.property.test.ts`
    - [依赖] 17.3
    - [验收:Property 17, CT-8] 标签 `Feature: math-junior-frontend, Property 17`。

### 13. 横切验收（§12 测试策略、§2.2）

- [x] 18. 横切不变量验收与三引擎冒烟
  - [x]* 18.1 零持久化不变量测试（TS，EDGE_CASE）
    - **Property 19：零持久化不变量**（EDGE_CASE）—— 对答题/沙盒/组卷会话操作序列，spy `localStorage`/`IndexedDB` 写接口，断言调用次数恒为 0。
    - [产出文件] `src/__tests__/zeroPersistence.test.ts`
    - [依赖] 9.4, 11.1, 17.6
    - [验收:Property 19] 标签 `Feature: math-junior-frontend, Property 19`；副作用断言。
  - [x]* 18.2 SVG 无 foreignObject 校验（TS）
    - **Property 20：SVG 资产无 foreignObject**（≥100 次迭代）—— 任意生成/后处理 SVG 字符串不含 `<foreignObject>`。
    - [产出文件] `src/__tests__/svgNoForeignObject.property.test.ts`
    - [依赖] 4.4
    - [验收:Property 20] 标签 `Feature: math-junior-frontend, Property 20`。
  - [x]* 18.3 三引擎冒烟集成测试
    - 用 1~3 个代表用例冒烟：WASM 分包加载、i18n 热切换 DOM 联动、`@media print` 分页。
    - [产出文件] `src/__tests__/smoke.integration.test.ts`
    - [依赖] 1.2, 14.1, 17.4
    - [验收] 三引擎（Blink/WebKit/Gecko 目标）冒烟通过；分包/热切换/打印分页正常。（§12 集成/冒烟）

### 20. 应用外壳与信息架构集成（架构师补拆 · 产品化外壳）

> 背景：此前各模块组件为便于逐批点验，被平铺为带任务号的开发调试 Tab（App.tsx）。本任务按 design §12.3（全科门户）+ §7.1（模块导航）将合格组件组装为正式产品结构。**只做外壳/导航/路由，不改各模块组件内部逻辑。**

- [x] 20.1 引入路由与全科门户（design §12.3）
  - react-router-dom；**HashRouter**（兼容 Cloudflare Pages 刷新，或配 _redirects）。
  - `/` → 全科门户：学段切换(小学/初中/高中) + 初中数学旗舰卡(进入按钮) + 其他学科"即将推出"卡片。**从头实现**。
  - [产出文件] `src/App.tsx`(改)、`src/AllSubjectsPortal.tsx`、`src/router.tsx`
  - [验收] `/` 渲染门户；点击初中数学卡跳 `/math-junior`；无任务号标签。
- [x] 20.2 初中数学主界面：四大模块正式入口
  - `/math-junior` → 四大模块正式导航（探本溯源·概念精讲 / 经纬纵横·思维图谱 / 见微知著·实验探究 / 百炼成钢·实战测评），**删除所有带任务号的调试 Tab**。
  - 各模块组件挂到对应子路由，内部逻辑不动。
  - [产出文件] `src/MathJuniorHome.tsx`、各模块路由挂载
  - [验收] 四大模块正式名称入口；无 `(9.1)(10.4)(11.1)` 等任务号残留。
- [x] 20.3 模块一四级导航谱系（design §7.1 第4点）
  - 年级(七/八/九) → 学期(上/下) → 领域(数与代数/图形与几何/统计与概率) → 107 考点；左侧导航树/面包屑；PC 侧边树、Pad/手机抽屉。
  - [产出文件] `src/ConceptNav.tsx`
  - [验收] 四级下钻可达考点；三端形态按设备调度切换。
- [x] 20.4 三端骨架真正接入设备调度
  - CardDeck/SplitBoard/Cockpit 由 detectDeviceProfile 选择，包裹主界面布局（此前仅有骨架未接入）。
  - [产出文件] 外壳集成（改 20.1/20.2 产出）
  - [验收] 手机/平板/PC 三态由设备 profile 驱动切换。
- [x] 20.5 路由 Cloudflare 兼容与冒烟
  - HashRouter 或 `public/_redirects`；`pnpm build` 后 preview 各路由刷新不 404。
  - [验收] 门户/初中数学/各模块路由刷新均正常；`pnpm test` + `pnpm build` 全绿。

- [x] 19. 最终 Checkpoint —— 全量验收
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- 标记 `*` 的子任务为可选测试任务（属性/单元/集成测试），可为快速 MVP 跳过；执行模型 **不得实现** `*` 任务，**必须实现**无 `*` 前缀的任务。
- 顶层任务不带 `*`。
- 每个任务的 [验收] 关联 design §12 的 Property N 或 §3.2 的 CT-N，供架构师（Kiro）作验收 checklist。
- **[高风险]** 标注：内容生成管线（任务 5）、判分引擎（任务 7，尤其受控解析器 7.2）、模块三沙盒（任务 11，尤其 SandboxRenderer 11.1 与 DSL 覆盖度探针 11.3）。请优先投入评审精力。
- 所有属性测试 ≥100 次迭代；EDGE_CASE（P2/P8/P19/P21）用构造性用例 + 副作用（spy/mock）断言。
- 建议先完成文首「纵向验证切片」再铺开全量。

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "4.1", "4.3"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "4.2", "7.1", "7.2", "7.5", "16.1"] },
    { "id": 2, "tasks": ["2.4", "4.4", "5.1", "7.3", "7.7", "7.8", "14.1", "15.1", "16.2"] },
    { "id": 3, "tasks": ["5.2", "5.3", "7.4", "9.1", "9.3", "10.1", "11.1", "14.2", "15.2"] },
    { "id": 4, "tasks": ["5.4", "5.5", "5.6", "7.6", "9.4", "10.2", "10.3", "11.2", "14.3"] },
    { "id": 5, "tasks": ["9.2", "9.5", "10.4", "10.5", "11.3", "11.4", "17.1"] },
    { "id": 6, "tasks": ["11.5", "17.2", "17.3", "17.4", "17.5"] },
    { "id": 7, "tasks": ["17.6", "17.7", "17.8", "18.2"] },
    { "id": 8, "tasks": ["18.1", "18.3"] }
  ]
}
```
