# 执行指令书 · 全科核心素养提分系统 V2.0 — 初中数学模块前端
# Execution Guide for Antigravity (gemini-flash)

> 本文件是给执行方（Antigravity / gemini-flash）的**唯一操作说明**。请从头到尾读完，再开始动手。
> 权威依据是同目录下的 `design.md`（设计）与 `tasks.md`（任务清单）。本文件是它们的执行导航，不替代它们。
> 遇到本文件与 `design.md` 冲突时，**以 `design.md` 为准**。

---

## 0. 角色与协作方式

- **你（执行方）**：按 `tasks.md` 的任务卡写代码。一次只做一个任务，做完自检，再做下一个。
- **架构师（验收方）**：审查你的产出是否符合 `design.md` 的正确性属性（Property N）与契约条款（CT-N）。不达标会退回重做。
- **人类项目主管**：在关键节点（Checkpoint）审阅。

**你必须遵守的工作节奏：**
1. 打开 `tasks.md`，从当前波次（见文末依赖图）里挑一个**未完成、且依赖已满足**的任务。
2. 只做这一个任务。严格按任务卡的 `[产出文件]` 创建/修改文件，不擅自扩大范围。
3. 做完后，对照该任务的 `[验收:Property N / CT-N]` 自检（见第 4 节自检清单）。
4. 自检通过 → 在 `tasks.md` 把该任务的 `[ ]` 勾成 `[x]` → 进入下一个任务。
5. 遇到 Checkpoint 任务（“Ensure all tests pass, ask the user”）→ 停下，等待人类确认。

---

## 1. 🚨 十条铁律（违反任何一条即为不合格，必被退回）

这些是全项目的红线，写任何代码都要遵守：

1. **禁止 eval / Function 求值学生输入。** 填空判分只能用受控白名单解析器（tokenizer + 递归下降 + 白名单 AST）。凡代码里出现 `eval(`、`new Function(`、`Function(` 对用户输入求值 —— 直接判不合格。
2. **零持久化。** 全项目禁止写 `localStorage`、`IndexedDB`、`sessionStorage`、cookie 存储答题/学情数据。所有会话状态放内存 store，刷新即清空。
3. **数学公式只走单入口单出口。** 入库前必过 `sanitize_and_verify_math()`（Python 门神）；上屏只能用 `<MathRenderer>` 组件。业务组件里**禁止** `import katex`、禁止 `dangerouslySetInnerHTML` 直接塞未经门神的内容。
4. **不实现已删除功能。** 模块二（思维图谱）**不做**任何：学情热力图、节点掌握度着色、`traceRootCause` 认知断层溯源、红色脉冲溯源线、靶向就医卡片。看到旧文档里有也不要做。
5. **SQL 全部参数化。** 所有查询用 `?` 占位符，禁止字符串拼接 SQL。数据库连接为**只读**。
6. **数据库只读 + 分包按需加载。** 用 `@sqlite.org/sqlite-wasm`，放 Web Worker，启动只加载 `core.db`，其余分包（master/sandbox/questions）进入对应模块才 fetch。
7. **SVG 禁用 `<foreignObject>`。**（WebKit/Safari 避坑）数学符号一律矢量路径或 KaTeX 渲染。
8. **组合基数按 1~8 动态渲染。** 凡处理知识点组合（Clique）的地方，节点数按数据里的 `kp_count`（1~8）来，**禁止写死“最多 4 个”**。
9. **母题与真题物理隔离。** 组卷/测评抽题**只查 `questions` 表**，绝不碰 `master_examples` 表。
10. **CSS 禁止硬编码颜色。** 用 `design.md` §10.2 的 iOS 27 液态玻璃 token（CSS 变量），禁止散落 `#000`/`#fff`/随机十六进制。只用这一套 token，不引入已作废的 `--status-*`/`--pulse-track`。
11. **禁止 emoji 图标,统一用单色 SVG 线性图标。** 全局 UI **严禁**任何 emoji（🎯⚡🔥🌟📖🧪⚔️💡🔬🚀✅❌📱💻🌐 等一律禁用），包括按钮、标题、卡片、提示文案里的。统一使用项目内的 `<Icon name="..."/>` 组件（内联单色 SVG，继承 `currentColor`）。理由：design §12 要求"彻底消灭 Emoji、单色线稿"，且 emoji 跨平台渲染不一致、破坏 iOS27 液态玻璃质感。**违反即退回。** 源码级门禁：源码中不得出现 emoji 字符。
12. **一切来自数据的文本显示,必须做溢出防御。** 凡渲染 DB 字段(来源 source/region、考点名、题干片段、选项、标签、母题标题等)到固定/受限空间(pill、卡片角、导航项、按钮)时,**严禁假设长度受控**。实测数据里 region 长达 34 字符、source 长达 53 字符。必须用:单行截断(`max-width` + `overflow:hidden` + `text-overflow:ellipsis` + `white-space:nowrap`)或多行钳制(`-webkit-line-clamp`),配 `title`/hover 显示全文;容器 `min-width:0` 防 flex 撑破;超长绝不允许撑破布局、顶开兄弟元素或溢出卡片。**违反(即长文本破版)即退回。**

---

## 2. 技术栈与环境（不得擅自替换）

| 项 | 选型 | 说明 |
| :--- | :--- | :--- |
| 框架 | React 18 + TypeScript | 组件化、强类型 |
| 构建 | Vite + `@vitejs/plugin-legacy` | 静态导出，无后端 |
| PWA | `vite-plugin-pwa` | 离线可用 |
| 数据库 | `@sqlite.org/sqlite-wasm` | Web Worker + 只读 + 分包 |
| 数学渲染 | KaTeX（本地离线 + 内嵌 WOFF2） | 只经 `<MathRenderer>` |
| 状态 | Zustand（或 React Context） | 纯内存，零持久化 |
| 动态几何 | JSXGraph | 声明式配置驱动沙盒 |
| 属性测试 | fast-check（TS）/ Hypothesis（Python） | 见第 3 节 |

- 包管理器用 `pnpm`（若环境无则用 `npm`，但锁定版本）。
- 依赖版本**锁定**（pin exact version），不要用 `^`/`~` 浮动范围。
- 目录结构（初始化时建好）：
  ```
  src/
    modules/    concept/ graph/ sandbox/ exam/
    engine/     db/ judge/ i18n/ device/
    components/ math/ shell/
    store/
    styles/
    locales/
    assets/fonts/
    __tests__/
  scripts/build/  math_gate.py etl/ db/ gen/
  data/           core.db master.db sandbox.db questions.db (构建产物)
  ```


---

## 3. 测试规则

- `tasks.md` 中带 `*` 的子任务是**测试任务**。你在做完对应的实现任务后，**应该**编写这些测试（除非人类明确说跳过做 MVP）。
- 属性测试统一：**≥100 次随机迭代**，测试名/标签用 `Feature: math-junior-frontend, Property N` 格式。
- EDGE_CASE 属性（P2、P8、P19、P21）用构造性用例 + 副作用断言（spy/mock 检查“某写接口调用次数为 0”）。
- 每个实现任务完成后至少能通过 `pnpm build`（或 `tsc --noEmit`）不报类型错。
- 提交前跑一遍已写的测试，全绿再勾任务。

---

## 4. 逐任务执行指令（配合 tasks.md 使用）

> 下面按 `tasks.md` 的编号给出**执行要点提炼 + 自检清单**。完整实现细节以 `tasks.md` 和 `design.md` 对应章节为准。
> **强烈建议先跑“纵向验证切片”**：`1.1 → 1.2 → 1.3 → 2.1 → 2.3 → 4.1 → 4.3 → 4.4 → 9.1 → 9.4 → 11.1 → 11.2`。跑通一个考点的端到端闭环后，再铺开其余任务。这是给项目主管试成本、试风险用的，务必优先。

### 波次 0（先做，无依赖）
- **1.1 脚手架**：Vite+React18+TS+PWA+legacy。产出 `package.json`/`vite.config.ts`/`.browserslistrc`/`tsconfig.json`/`src/main.tsx`/`src/App.tsx`。自检：`pnpm build` 出纯静态产物、SW 注册成功。
- **2.1 入库门神（Python）**：`scripts/build/math_gate.py`，实现 `sanitize_and_verify_math()`（定界符归一、符号标准化、花括号/环境闭合校验、不通过 `raise ValueError`）。自检【Property 1】：输出不再含 `\(`/`\[`/`＄`，符号已标准化。
- **4.1 ETL 类型与映射**：`scripts/build/etl/types.ts` + `adaptQuestion.ts`。用 zod 校验 + CT-1~CT-8 断言。自检【Property 5, CT-1, CT-3】：业务字段等价、`difficulty_level∈[1,9]`、`question_type` 枚举合法。
- **4.3 建库 DDL**：`scripts/build/db/schema.sql` + `buildDb.ts`，8 张表 + 索引 + CHECK（`kp_count 1~8`、`difficulty_level 1~9`）。自检【CT-1/2/3】：DDL 与 design §4.2 一致、CHECK 生效、分包正确。

### 波次 1
- **1.2 DB Worker 加载器**：`src/engine/db/worker.ts`/`dbClient.ts`/`packages.ts`。只读、分包、参数化。自检：启动只加载 core.db，查询走 `?` 占位。
- **1.3 会话内存 store**：`src/store/sessionStore.ts`。自检【铁律2】：零持久化写调用、刷新即清空。
- **2.3 出库 `<MathRenderer>`**：`src/components/math/MathRenderer.tsx` + `katexCache.ts`。`throwOnError:false`+LRU(1000)+escapeHtml+`trust:false`。自检【Property 3,4】：任意输入不崩溃、缓存幂等。
- **7.1 normalizeMathString**：`src/engine/judge/normalize.ts`。纯字符串变换、无求值。自检【Property 6】：输出无 `\frac`/`\sqrt`/空白/全角。
- **7.2 受控解析器 [高风险]**：`src/engine/judge/parser.ts`。tokenizer+递归下降+白名单 AST；`FORBIDDEN` 拦截 `Function/eval/window/globalThis/constructor/import/require/process`、`=>`、反引号。自检【铁律1, Property 8】：绝无 eval/Function、危险 token 抛错。
- **7.5 calculateSolutionScore**：`src/engine/judge/calculateSolutionScore.ts`。得分=打钩步骤分值和，`0≤score≤Σ`。自检【Property 9】。
- **16.1 设计 token**：`src/styles/tokens.css` + `theme.ts`。仅一套 iOS 27 液态玻璃 token、明暗模式。自检【铁律10】：无硬编码色、无作废 token。

### 波次 2
- **4.4 mock db [关键]**：`scripts/build/db/mockSeed.ts` + `data/*.db`。造 ≥1 完整考点（四段齐全）、其母题（dim3 必填）、1 概念沙盒配置、若干 L1~L3 single_choice 真题、含 `kp_count>4` 的组合。母题只入 master_examples、真题只入 questions。自检【CT-1~CT-8, 铁律9】。
- **5.1 Prompt 契约**：`scripts/build/gen/promptContracts.ts` + `generate.ts`。四类内容各自契约。
- **7.3 evalExpr + sampleDomain**：`src/engine/judge/evalExpr.ts` + `sampleDomain.ts`。仅遍历 AST 数值计算、5~10 组采样。
- **14.1 i18n**：`src/locales/zh-CN.json`/`en.json` + `i18n.ts`。`data-i18n` 热切换。
- **15.1 设备检测**：`src/engine/device/detectDeviceProfile.ts` + `deviceOverride.ts`。自检【Property 15】：返回值恒 ∈{MOBILE,TABLET,DESKTOP}。
- **16.2 三端骨架**：`CardDeck.tsx`/`SplitBoard.tsx`/`Cockpit.tsx`。按设备 profile 切换。

### 波次 3
- **5.2 维度判定 [高风险]**：`dimensionPolicy.ts`。几何/函数大考点强制≥3维、dim3 必填。自检【Property 18, CT-6】。
- **5.3 清洗门禁 [高风险]**：`gateGuard.ts`。生成内容必过门神才落库。自检【Property 21】：未过者 DB 写调用为 0。
- **7.4 isMathAnswerEquivalent**：`src/engine/judge/isMathAnswerEquivalent.ts`。规范化→字面→受控解析→多点代入→分类答案无序集合→`suspect` 兜底。自检【Property 7, 铁律1】。
- **9.1 四段论视窗**：`ConceptFourStages.tsx` + `SvgLayerReveal.tsx`。经 `<MathRenderer>`；SVG 图层按段点亮。自检【铁律3】。
- **9.3 考点母题步进解锁**：`PointMasterExample.tsx`。按 available_dimensions 解锁、dim3 必展示。
- **10.1 泳道地铁图**：`SubwayMap.tsx`。**不做任何学情着色/溯源**。自检【铁律4】。
- **11.1 SandboxRenderer 核心 [高风险]**：`SandboxRenderer.tsx` + `sandboxConfig.ts`。JSXGraph 声明式驱动、无手写专用组件。
- **14.2 双语投影**：`projectLocale.ts`。自检【Property 14】。
- **15.2** 设备判定属性测试。

### 波次 4
- **5.4 教研抽检清单**：`reviewManifest.ts`。落审阅清单含门神判定+维度校验。
- **7.6 判分属性测试**【Property 6,7】。
- **9.4 单点快练状态机**：`QuickPractice.tsx` + `quickPractice.machine.ts`。锁 L1~L3 single_choice、presented_ids 去重、池耗尽 clear 重抽。自检【Property 13, 铁律5】。
- **10.2 焦点穿透**：`FocusBeam.tsx`。入度蓝/出度紫光束。
- **10.3 组合视图**：`CombinationPanel.tsx`。**kp_count 1~8 动态渲染**。自检【Property 12, 铁律8】。
- **11.2 clamp + viewport**：`clampDynamicValue.ts`（纯 clamp 禁 Function）+ `viewport.ts`（保形+含 bbox+≥15% 边距）。自检【Property 10,11】。

### 波次 5
- **9.2 链接沙盒/占位卡**：`LinkedSandboxSlot.tsx`。有沙盒挂 SandboxRenderer、无沙盒渲染 CLS=0 等大占位卡。
- **10.4 主线四位一体 + 主线快练(L4~L6)**：`LineClosedLoop.tsx` + `LineQuickPractice.tsx`。复用 9.4 状态机改难度锁。
- **11.3 代表性沙盒 DSL 验证 [高风险]**：`configs/hand-in-hand.ts`/`apollonius.ts`/`quadratic-vertical-height.ts` + `SandboxLayout.tsx`（85%:15%）。验证配置 DSL 覆盖度，不足处走 `customBehaviorId` 逃生舱（**仍禁 eval**）。
- **11.4 4D 变异 + X-Ray**：`LeapLab.tsx` + `morphControllers.ts` + `XRayLayer.tsx`。
- **17.1 组卷工作台**：`PaperWorkbench.tsx` + `presetPapers.ts`。

### 波次 6~8（收尾）
- **11.5** 沙盒属性测试【Property 10,11】。
- **17.2 库存预警**：`verifyPaperInventory.ts`。自检【Property 16】。
- **17.3 母题隔离抽题**：`drawQuestions.ts`。**只查 questions**。自检【Property 17, 铁律9】。
- **17.4 双栏 A4 打印**：`PrintLayout.tsx` + `print.css`。`page-break-inside:avoid`。
- **17.5 在线测评 Split-View + 数学键盘**：`OnlineExam.tsx` + `MathKeyboard.tsx`。
- **17.6 判分接入 + 雷达图 + 考完即焚**：`ScorePanel.tsx` + `RadarChart.tsx`。自检【铁律2】。
- **18.1 零持久化测试**【Property 19，EDGE_CASE】：spy localStorage/IndexedDB 写接口，断言调用 0 次。
- **18.2 SVG 无 foreignObject**【Property 20】。
- **18.3 三引擎冒烟**：WASM 分包 / i18n 热切换 / 打印分页。

---

## 5. 每个任务完成前的通用自检清单（Definition of Done）

做完任意任务后，逐条打勾，全绿才算完成：

- [ ] 只改动了任务卡 `[产出文件]` 列出的文件，没有擅自改其他模块。
- [ ] `tsc --noEmit`（或 `pnpm build`）无类型/编译错误。
- [ ] 没有违反第 1 节任何一条铁律（尤其：无 eval/Function、无 localStorage/IndexedDB 写、公式走门神、SQL 参数化）。
- [ ] 若任务有 `[验收:Property N]`：已写对应属性测试且 ≥100 次迭代通过；标签格式正确。
- [ ] 若任务有 `[验收:CT-N]`：产出满足对应契约条款。
- [ ] 新增依赖已 pin 精确版本。
- [ ] 已在 `tasks.md` 把该任务勾成 `[x]`。

---

## 6. 交付格式（给项目主管 → 架构师验收）

每完成一个波次（或一个 Checkpoint），产出一份简短交付说明，包含：

1. 本次完成的任务编号列表。
2. 每个任务对应的产出文件路径。
3. 已写的测试 + 运行结果（通过数 / 失败数）。
4. 遇到的问题、做出的取舍、或无法满足的约束（**如实说明，不要隐瞒或伪造**）。
5. 高风险任务（5.x / 7.2 / 11.x）额外说明：实现方式、DSL 覆盖度、逃生舱是否用到。

架构师会按 `design.md` §12 的 Property 与 §3.2 的 CT 逐条验收，不达标的任务会退回并说明原因。

---

## 7. 遇到不确定时怎么办

- **不要臆测扩大范围。** 任务卡没要求的功能不要顺手加。
- **不要为了让测试过而弱化断言。** 测试是验收标尺，不能改标尺迁就实现。
- **不要绕过铁律找“变通”。** 例如：判分嫌解析器麻烦就偷偷用 eval —— 绝对禁止。
- 拿不准的设计问题 → 在交付说明里列为“待架构师确认”，先停在那个点，不要硬猜着往下写。
- 与 `design.md` 有冲突 → 以 `design.md` 为准；`design.md` 也没写清 → 标记待确认。

---

## 8. 关键文件索引

| 文件 | 作用 |
| :--- | :--- |
| `design.md` | 权威设计（架构、DDL、算法契约、§12 正确性属性 P1~P21、§3.2 契约 CT-1~CT-8、附录A 差异清单）|
| `tasks.md` | 任务清单（含 `[产出文件]`/`[依赖]`/`[验收]` 标注 + 文末依赖波次图）|
| 本文件 | 执行导航 + 铁律 + 逐任务要点 + 自检清单 |

**开始前请务必读一遍 `design.md` 的 §1（范围边界）、§8（判分引擎，含禁用 eval）、§12（正确性属性）、附录A（哪些旧写法已作废）。**

---

*文档结束。请先跑纵向验证切片。*
