---
id: TASK-FE-0016
line: frontend
status: assigned
attempt: 1
created_by: Kiro
exec_machine: 本机（主控机）
title: 沙盒渲染三修 — 参数框↔图形双向联动 + X-Ray/遥测文字按locale多语言 + 黑底隐形内容(black点)兜底可见
model: default
concurrency: 3
---

> **执行方式（照 collaboration-protocol §7 + §8）**：
> - **本机执行**（主控机本地，完成后正常提交）。
> - `model: default`（Flash）。`concurrency: 3`（已经用户批准）：三个问题相对独立，单次 `invoke_subagent` 并发派 3 个子 Agent 各修一个问题；主 Agent 最后串行整合 + 联调。
> - **前端交互/渲染任务，验收走真实浏览器 E2E（§8）**：执行方 `/browser` 启动真机验收，Console 零 Error / 零 wasm 失败 / 零 fallback。

# 任务：沙盒渲染三修（前端线，本机执行）

## 🎯 任务本质
修复沙盒（SandboxRenderer/LeapLab）渲染的三个具体问题，**纯前端渲染修复，不改数据库 schema、不改数据 JSON**。核心文件 `src/modules/sandbox/SandboxRenderer.tsx`、`LeapLab.tsx`、`invariants.ts`、`DiscreteOrthographicRenderer.tsx`。

## 🔩 铁律
- 零 eval/innerHTML/foreignObject/emoji；公式走 MathRenderer；沙盒背景**保持黑底 `#0f172a`**（全系统统一标准，不改）。
- 向后兼容：不破坏现有 246+ 单测；概念沙盒(LinkedSandboxSlot)与实验室二(LeapLab)共用 SandboxRenderer，改动要两处都受益且不回归。

## 📐 三个修复块

### 块 A（可并发）：参数框 ↔ 图形 双向联动
- **现状**：仅"滑块→图形"单向（改滑块→compileMorphingSandboxConfig 重编译→board 重画）。"图形→滑块"缺失：SandboxRenderer 里点全部 `fixed:true` 不可拖；`SandboxRendererProps` 无参数回写回调；`board.on('update')` 只重算遥测不反解参数。
- **做法**：
  1. `SandboxRenderer.tsx` 动点创建块：把**主控点**（数据 `isFixed` 非 true 的点，或可驱动参数的关键点如圆的动点/直角三角形的 B/番位点/数轴 P 点）改为 `fixed:false` 可拖，并挂 `pt.on('drag', ...)`。
  2. 拖动回调里用 `pt.X()/pt.Y()` 读新坐标，**反解对应参数**（复用现有"参数→坐标"映射逻辑反向写：如圆模型把点到圆心距离反解 `radius_r`/`r`；直角三角形把 B.x/B.y 反解 `leg_a/leg_b`；数轴把 P.x 反解 `pos_p`；二次函数系数类不可反解的点保持 fixed）。
  3. `SandboxRendererProps` 新增 `onParamChange?: (patch: Record<string, number>) => void`，拖动反解出的参数通过它抛给上层。
  4. `LeapLab.tsx` 渲染 `<SandboxRenderer>` 处接 `onParamChange={(patch)=>setMorphState(prev=>({...prev, parameterValues:{...prev.parameterValues, ...patch}}))}`。滑块 value 已绑 `morphState.parameterValues[s.id]`，会自动跟着动——实现"拖图形→滑块动"。
  5. 反向"滑块→图形"已工作，保持不变。
- **保守**：只对能明确反解参数的模板点开放拖动；无法反解的（如声明式二次函数顶点由 a/b/c 决定）保持 fixed，避免拖了没意义或算错。
- **验收**：至少 3 类模板（圆/直角三角形或数轴/几何动点）实现拖点→滑块数值同步变化；拖到的参数值与滑块联动一致；反向拖滑块图形也动（回归）。

### 块 B（可并发）：X-Ray / 遥测文字按 locale 多语言
- **现状**：`formatInvariantText`(invariants.ts) 本身按 locale 选 labelZh/labelEn 是对的，但 **LeapLab 渲染 `<SandboxRenderer>` 时漏传 `locale`**，Renderer 永远用默认 'zh-CN'，X-Ray/遥测永远出中文。另 `formatInvariantText` 判定 `locale==='en'` 过严（'en-US' 不匹配）。DiscreteOrthographicRenderer/手拉手/4D面板标题硬编码中文。
- **做法**：
  1. **主修复点**：`LeapLab.tsx` 渲染 `<SandboxRenderer .../>` 处补 `locale={locale}` 透传。
  2. `invariants.ts` 的 locale 判定放宽：`locale === 'en'` → `String(locale).toLowerCase().startsWith('en')`。
  3. `DiscreteOrthographicRenderer.tsx` 新增 `locale` prop，把硬编码遥测文字（"正方体积木总数…"等）与四视口标题（"① 主视图…"）改成按 locale 二选一（补 en 文案）；SandboxRenderer 分发三视图时把 locale 传下去。
  4. 手拉手 telemetry 文字（LeapLab 约 640-660 行）与 4D 面板维度标题（"① 载体变异(Carrier)"等）、载体按钮（用 opt.nameZh）改成按 locale 取 nameEn/英文文案。
- **验收**：切到 en locale，X-Ray 骨架名、不变量标签、遥测读数、三视图标题、4D 面板标题全部显示英文；切回 zh 显示中文。数据缺 labelEn 的回退中文可接受（不报错）。

### 块 C（可并发）：黑底隐形内容兜底可见
- **现状**：数据（mockLeapModels carrier_morphing_json / concept_sandboxes drag_points_json）里大量动点 `"color":"black"`；SandboxRenderer 的 `ptColor` 兜底只强制 O 点为绿，其余原样用 black → 黑底 `#0f172a` 上隐形（只剩白描边空心圈）。
- **做法**（改渲染兜底，**不改数据 JSON**，一次覆盖所有模型）：
  1. `SandboxRenderer.tsx` 动点 `ptColor` 逻辑：加"暗色兜底"——当 `ptDef.color` 落在暗色集合（`black`/`#000`/`#000000`/`#111`/纯深灰等，亮度低于阈值）时，替换成亮色（非圆心用 `#38bdf8`，圆心保持 `#34c759`）。
  2. 声明式 carrier 的 `const color = elemDef.color || '#38bdf8'` 同样加暗色兜底，防 carrier.elements/distractor 带 black。
  3. 写一个小工具 `ensureVisibleOnDark(color)`：解析颜色亮度，暗色→亮色映射，供两处复用。
  4. 兜底也覆盖线段/圆等图元 strokeColor（若数据给了暗色）。
- **验收**：全库模型（尤其含 black 点的 LM-8A-01/LM-9A-19/LM-9A-20/LM-9A-21/LM-9A-22 等）在黑底上所有点/线清晰可见，无隐形；概念沙盒同样受益。

## 🧩 并发（concurrency=3）
- 单次 invoke_subagent 并发 3 子 Agent：子1→块A、子2→块B、子3→块C（三块改的函数/区域基本不重叠：A 改动点创建+props+LeapLab渲染处；B 改 locale 透传+invariants判定+三视图文案；C 改 ptColor兜底工具）。
- 有交叠的文件（SandboxRenderer.tsx 三块都碰）：各子 Agent 产出改动说明到 `tmp/fe0016/partN.md`，**主 Agent 串行合并落地**避免冲突，再统一联调 + 跑测试 + E2E。

## ✅ 可量化验收清单（Kiro 验收 + E2E）
- [ ] 块A：≥3 类模板拖动图形上的主控点，对应滑块数值实时同步变化；反向拖滑块图形也动（双向）。
- [ ] 块A：不可反解的点保持不可拖（不产生错误参数）。
- [ ] 块B：locale=en 时 X-Ray 骨架/不变量标签/遥测读数/三视图标题/4D面板标题全英文；locale=zh 全中文；切换即时生效。
- [ ] 块C：含 black 点的模型在黑底上所有图元可见（RESULT 附黑底截图，肉眼可见无隐形点）。
- [ ] 数据未改：mockLeapModels.ts / concept_sandboxes 数据 JSON 无改动（grep 确认 color:"black" 仍在数据里，仅渲染兜底）。
- [ ] `pnpm test` 全绿（新增块A拖动反解/块C颜色兜底/块B locale 的单测）。
- [ ] **真实浏览器 E2E**：拖点联动、切 locale、黑底可见 三项实测，Console 零 Error/wasm/fallback。RESULT 附实测摘要+截图。

## 🚫 红线
- ❌ 不改数据库/数据 JSON（color:black 保留在数据里，只在渲染层兜底）。
- ❌ 不改沙盒黑底 `#0f172a`。
- ❌ 零 eval/innerHTML/foreignObject/emoji。
- ❌ 不破坏概念沙盒(LinkedSandboxSlot)与实验室二共用 SandboxRenderer 的现有行为。
- ❌ 不碰 core.db/questions.db/sandbox.db / .gitignore / 目录结构。

## 📤 回写要求
1. 阶段产物写 `tmp/fe0016/`。
2. 写 `.kiro/relay/frontend/outbox/RESULT-FE-0016.md`（三块完成情况 + 改动文件 + 单测结果 + E2E实测摘要+截图）。
3. 本任务书 `status` 改 `done`。
4. 本机提交：`git add`（改动 src + 本任务书 + RESULT + 截图）→ commit → push origin dev。
5. 播报 `"TASK-FE-0016 完成"`，STANDBY 待命等验收。

## 7. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
