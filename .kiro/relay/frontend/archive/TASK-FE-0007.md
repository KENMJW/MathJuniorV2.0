---
id: TASK-FE-0007
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 沙盒渲染器重构 + ID→中文名防溢出 + SVG四步图层渐进点亮 + 联动/快练修复
model: gemini 3.1 pro
concurrency: 1
---

# 任务：前端交互层系统性修复（沙盒/命名/SVG图层/联动）

## 🚨 执行方式（先读）
- **执行口令**：人类开发者在对话框输入 `/browser 查收 NEXT.md 并执行验收`（本任务验收必须走真实浏览器 E2E，见 §6）
- **model = gemini 3.1 pro**：涉及 SandboxRenderer 重构 + JSXGraph 几何渲染 + 交互调试，技术深度高。执行者主对话是固定 Flash 换不了 Pro，**代码编写与调试须通过 `invoke_subagent(Model="pro", TypeName="self")` 派发**（协作标准 §7）。串行（改动相互关联，不并发）。

## 1. 背景（Kiro 已诊断，根因确凿）
用户真人 preview 发现前端交互层多处失效。根因诊断：

### 问题1【沙盒渲染贫乏 + 颜色失效】—— 最严重
- `SandboxRenderer.tsx` 用 `fillColor: 'var(--ios-blue)'`、text `color:'var(--text-primary)'` —— **JSXGraph 画在 SVG/Canvas 上不认 CSS 变量**，颜色解析失败，元素不可见/错乱。
- 渲染器**只画滑块+孤立点+文字**，不画数轴刻度/几何图形/连线，场景贫乏（preview 实证：数轴沙盒只有一个孤立点+一个滑块）。
- 注：46 沙盒的真实配置由数据线 TASK-DATA-0004 重做，本任务负责**渲染器要能把真实配置画成有意义的几何场景**。

### 问题2【ID 大量当中文名显示】
- `MathJuniorHome.tsx:182` `nameZh = ${r.sandbox_id} (${canvas_template})` —— 直接显示 SB-KP001，没 JOIN 考点中文名。
- 沙盒/考点/母题多处显示 ID（SB-KP001/KP-057/LM-xx）而非中文名。中文名来源：concept_sandboxes.point_id → core.db knowledge_points.name_zh；leap 用 model_name_zh。

### 问题3【SVG 四步图层未渐进点亮】
- SVG 已能加载（FE-0006修好），但"四段精讲逐步点亮图层"功能未完成：应第1段只显原点、第2段隐藏字母标签、第3段点亮 formal-labels、第4段全显。当前只有 hide-formal-labels 一个 class 的粗略控制。

### 问题4【四级导航联动/快练】
- `ConceptNav.tsx` 初始筛选硬编码 grade=8/sem=1/图形与几何，真库数据到达后无校正 useEffect → filteredPoints 可能空 → "点不动"；selectedPointId(KP-023) 真库不存在时 currentPoint 回退但 selected* 不同步 → 联动错乱。
- 快练 SQL `question_type = "single_choice"` 用了**双引号**（SQLite 里双引号是标识符非字符串）→ 可能查空（`ConceptNav.tsx` 约293行）。

## 2. 修复要求

### 修复1 沙盒渲染器（SandboxRenderer.tsx）
- 颜色全部改真实色值（如 '#0071e3'）或 JSXGraph 认的色名，**移除所有 var(--...)** 传给 JSXGraph 的属性
- 按 canvas_template 分类增强渲染：数轴类要画数轴+刻度+可拖有理数点+距离标注；几何类要画对应图形(三角形/圆/四边形)+连线+顶点；函数类要画坐标系+函数曲线+控制点。可用 template 前缀(number_axis_/geometry_/function_)分派渲染策略
- 消费数据线 TASK-DATA-0004 重做后的真实配置(drag_points/sliders/invariants)
- 保持无 eval、clampDynamicValue 约束、无 foreignObject

### 修复2 ID→中文名 + 防溢出（全局）
- 沙盒按钮/标题、考点列表、母题标题等显示 ID 处，统一改显中文名（沙盒 JOIN core name_zh；leap 用 model_name_zh；考点用 name_zh）
- 保留 ID 作为 data-testid/key（可访问性/测试用），但**可见文案是中文名**
- 防溢出：长中文名截断 + title 悬浮全文 + minWidth:0（铁律12文本溢出防御）

### 修复3 SVG 四步图层渐进点亮
- SvgLayerReveal 按 activeStage(1-4) 控制 SVG 内图层显隐：真实 SVG 若含分层结构(如 formal-labels/layer-stageN 的 g 元素)则按段点亮；若真实 SVG 无分层则降级为整图显示并如实说明（不崩不阻塞）
- 与四段 Tab 切换联动

### 修复4 联动/快练
- ConceptNav 加"真库数据就绪后校正初始筛选"useEffect：数据到达后若 filteredPoints 空或 selectedPointId 不在库中，用 knowledgePoints[0] 反推 grade/semester/domain/pointId
- 快练 SQL 双引号 "single_choice" → 单引号 'single_choice'
- 确保四级下钻(年级→学期→领域→考点)每级都能选出下游、能点到考点、右侧四段/母题/沙盒/快练随选中考点正确联动

## 3. 红线
- 禁改判分/隔离/门神核心算法、DB字段名、data/*.db
- 禁引入新CSS框架；无katex import/裸innerHTML(SVG的dangerouslySetInnerHTML已存在可保留但要防注入HTML)/emoji/持久化
- 沙盒无 foreignObject
- 依赖：沙盒真实配置由 TASK-DATA-0004 提供，本任务渲染器要适配；若该数据未就绪，渲染器先用现有配置结构做好，数据到位即生效

## 4. 常规验收（Kiro 静态核实）
- [ ] SandboxRenderer 无 var(--) 传 JSXGraph；按 template 分派渲染
- [ ] 显示中文名(grep 确认沙盒/考点标签不再裸 ID)+ 防溢出(截断+title)
- [ ] SvgLayerReveal 按 activeStage 控制图层
- [ ] ConceptNav 有初始筛选校正 useEffect；快练 SQL 单引号
- [ ] pnpm build 0错、pnpm test 全绿
- [ ] 无katex/innerHTML注入HTML/emoji/新CSS框架

## 5. 🌐 浏览器交互验收清单（Browser E2E Check · 硬要求）
**执行口令**：人类输入 `/browser 查收 NEXT.md 并执行验收`
**环境准备**：后台 `pnpm preview`，等 4173 端口可用；入口 `http://127.0.0.1:4173`

**动作链A · 沙盒（重点）**：
1. 访问首页 → 点【见微知著·实验探究】(模块三)
2. 点顶部沙盒列表第一个（应显**中文名**如"数轴与有理数"，非 SB-KP001）
3. 断言：
   - [ ] 沙盒按钮显示**中文名**不是 SB-KPxxx
   - [ ] 画布渲染出**有几何意义的场景**（数轴沙盒有数轴+刻度+点，非孤立一个点）
   - [ ] 拖动动点，不变量/距离显示随之更新
   - [ ] Console 零 Error、零 wasm 失败、零 fallback 警告

**动作链B · 概念精讲四段图层**：
1. 点【探本溯源·概念精讲】→ 侧边栏点一个考点（显中文名）
2. 依次点四段 Tab（①原点②本真③法典④辨正）
3. 断言：
   - [ ] 侧边栏/考点显中文名不裸 ID，长名不溢出破版
   - [ ] 左侧 SVG **随段切换渐进点亮**（第1段少、第4段全显），非静止不变、非空白
   - [ ] Console 干净

**动作链C · 四级联动 + 快练**：
1. 概念精讲左侧切年级(七/八/九)→学期→领域→考点列表
2. 点某考点 → 切到【快练】Tab
3. 断言：
   - [ ] 每级下钻都能选出下游、考点列表非空、能点选
   - [ ] 选中考点后右侧四段/母题/沙盒/快练正确联动到该考点
   - [ ] 快练能抽出题(有题考点)或显"暂无"(空考点KP-096)不白屏
   - [ ] Console 干净

## 6. 回写
1. 结果写 outbox/RESULT-FE-0007.md：常规验收自检 + **三条动作链的浏览器实测结果(截图/DOM/console摘要)** + 改动文件清单
2. status改done，播报"TASK-FE-0007 完成"进STANDBY
