---
id: TASK-FE-0013
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 沙盒渲染交互修复 + 彻底删除旧编号mock收敛真库（串行，不含107考点SVG）
model: default
concurrency: 1
---

# 任务：沙盒渲染交互修复 + mock 数据彻底清理（前端线，串行）

## 🚨 执行方式
- **执行口令**：`/browser 查收 NEXT.md 并执行`（修复后须真机逐张不同截图验证）
- **model=default（Flash）**。**concurrency=1（串行）**：改动集中在 sandbox/concept/graph 少数文件，多 Agent 并发会撞车，单 Agent 串行完成。
- **依据**：TASK-FE-0012 诊断报告（`archive/RESULT-FE-0012.md`）+ Kiro 对 mock 编号体系的深度调查。
- **前置数据已就绪**：TASK-DATA-0006 已修好抛物线系数、LM-9B 点位、Line P1 概率模型等，本任务可直接读正确真库数据渲染。
- **起点约定**：以当前 git HEAD 为干净起点开工。**RESULT 必须列出本任务实际改动的完整文件清单**（供 Kiro 区分本任务成果与工作区既有的未提交遗留改动）。

## 🚫 本轮不做（用户明确排除）
- ❌ **不碰任何 107 考点 SVG（`assets/**/*.svg`）**：SVG 语义错配用户将亲自大改，已记录于 `SVG_BACKLOG_待用户大改时合并.md`。本任务只改 `.ts/.tsx` 代码，不改 svg 文件内容。

---

## A 部分：沙盒渲染与交互修复（原 7 项）

### 🔴 P0 渲染核心
1. **SandboxRenderer 几何/数轴模板消费 paramValues**（修 34/46 滑块空转）
   - `SandboxRenderer.tsx` 仅 `function_*` 模板消费 paramValues；`geometry_*`/`number_axis_*` 分支不读，滑块空转。
   - 要求：几何模板滑块真实驱动几何量（边长/角度/位置/比例），数轴模板消费位置/step 参数。拖动→图形实时变化。
2. **圆图元开发**：新增 `board.create('circle')` 等真实绘制，圆/切线/垂径按 canvas_template 正确渲染，不再降级三角形；SB-KP073 圆周角不再误画手拉手三角形。
3. **跃迁模型姿态变换修复**：`morphControllers.ts` 姿态变换让 isFixed 点也参与刚体变换，消除固定点/动点撕裂。
4. **抛物线/双曲线渲染通道**：打通被强制编译为 axis/euclidean 的函数模型路径。（数据 DATA-0006 已修 SB-KP038/040 系数，保证"数据对就画对"。）

### 🔴 P1 交互与遥测
5. **假按钮处理**：LabWorkspace.tsx 概念沙盒标题栏 `[概念具象化]`/`[视口阻尼锁定]` 是无 onClick 的 `<span>`。二选一并在 RESULT 说明：(a) 接线成真实功能；或 (b) 改为非按钮外观（去手型光标/hover）。
6. **invariants.ts 补算子**：补代数关系/动点距离/点到直线距离等算子，修 16 模型遥测返回 null；修正 ratio_distance 四点截断致相似比算错。
7. **X-Ray 修复**：兼容/纠正干扰层协议使 X-Ray 联动生效（前端兼容 from/to 与 line 两种写法）；评估接入孤立的 XRayLayer.tsx，至少让画布内 X-Ray 骨架高亮生效。

---

## B 部分：彻底删除旧编号 mock，收敛到真库（原第8项，方案B，用户拍板）

**背景**：前端存在两套考点编号打架。真库 core.db 是唯一权威（KP-023=配方法/A3，勾股定理实为 KP-057/G6）。前端 mock 用的是一套**废弃旧编号体系**，真库加载失败降级时会显示错误考点。用户决定：**彻底删除旧编号 mock，前端只保留真库 + 一份已对齐真库的离线镜像兜底。**

### B1. 删除三个旧编号 mock 源（20 点全错，整套作废）
- **删除** `src/modules/concept/mockPoints.ts`（`mockKnowledgePointRecords`，20点旧编号全错）
- **删除** `src/modules/graph/mockGraphData.ts` 中的旧编号数据（`mockKnowledgePoints`/`mockGraphNodes`/`mockCombinations`/`mockLineMasterExamples`/`mockLineQuickPracticeQuestions`）—— ⚠️ `mockLogicLines`（12条主线元数据）若无编号错配可保留作兜底，需核对其 flagship_model_id 等与真库一致；如整文件仅此可留则拆分保留该常量，其余删除。
- **删除** `src/modules/exam/mockExamQuestions.ts`（旧编号题目 + C3-0023/C5-0088 旧组合）
- **同步删除** seed 脚本里的旧编号（`scripts/build/db/mockSeed.ts` 若把 KP-023 写成勾股，一并对齐或删除该 seed 的错误部分）。

### B2. 修正 allPointsData.ts 的唯一脏点
- `src/modules/concept/allPointsData.ts`：107 点中 106 已对齐真库，**仅 KP-023 残留为"勾股定理及其逆定理(G4)"**。改为真库权威值：name_zh=**配方法**、name_en=Completing the Square Method、domain=数与代数、subcategory=方程组、primary_line_id=**A3**、grade=9、semester=1，并同步四段论文本/pinyin/svg_asset 字段与真库一致。（可从 core.db 的 KP-023 行取权威值。）

### B3. 清除 ConceptNav.tsx 的 KP-023 勾股硬编码
- `src/ConceptNav.tsx` 约第36行 `getMasterExampleForPoint` 里 `if (point.point_id === "KP-023" || point.name_zh.includes("勾股"))` 硬塞勾股母题的分支 → **删除**。否则"配方法"考点会被错塞勾股题。母题一律走真库 master_example（ME-KP023）或通用生成。

### B4. 消除对已删 mock 的引用与降级链
- 排查所有 `import ... from '.../mockPoints'`/`mockGraphData`/`mockExamQuestions` 的生产代码（MathJuniorHome.tsx 的 `effectiveLines`、SubwayMap 默认参数、PaperWorkbench 首屏兜底、ConceptNav 优先级链尾等）：
  - 兜底统一收敛到**已对齐真库的 ALL_107_KNOWLEDGE_POINTS**（concept）；图谱/题目类删除 mock 默认参数，DB 未就绪时显示 loading/空态，而非displaying 错误旧数据。
  - 确保删除后**无编译错误、无运行时 undefined**。

### B5. 同步修改依赖旧 mock 的测试断言
以下测试断言了"KP-023=勾股定理"，删/改后会失败，须同步改为真库权威值或调整用例：
- `src/__tests__/productShell.test.tsx`（断言 KP-023 含"勾股定理及其逆定理""图形与几何"→ 改为"配方法""数与代数"）
- `src/modules/concept/__tests__/ConceptDrawerSelector.test.tsx`
- `src/modules/concept/__tests__/ConceptFourStages.test.tsx`（本地 mockKP023）
- `src/modules/concept/__tests__/PointMasterExample.test.tsx`、`QuickPractice.test.tsx`
- `src/modules/graph/__tests__/LineClosedLoop.test.tsx`（G4 + KP-023 过滤）
- 其余仅用 'KP-023' 作字符串键、不校验名称的测试（quickPractice.property 等）通常不受影响，逐个确认。
- 引用 `mockExamQuestions` 的 exam 测试（smoke/zeroPersistence/drawQuestions/PaperWorkbench/OnlineExam）：改为用真库或新的对齐兜底，保证测试仍可运行。

---

## 可量化验收清单
### A 部分
- [ ] 几何/数轴模板拖滑块图形**真实变化**（真机截图：调参前 vs 后，两张不同图）。
- [ ] 圆/切线/垂径渲染为真实圆图元（截图）；SB-KP073 非三角形。
- [ ] 姿态切换构型不撕裂（截图 A/B 两姿态）。
- [ ] 抛物线/双曲线成图（截图）。
- [ ] 假按钮不再误导（说明处理方式 + 截图）。
- [ ] 16 个原 null 模型遥测有值；相似比算对。
- [ ] X-Ray 开关真实生效（截图 关/开）。
### B 部分
- [ ] `mockPoints.ts`/`mockExamQuestions.ts` 已删除；`mockGraphData.ts` 旧编号数据已删（保留项已核对与真库一致）。
- [ ] `allPointsData.ts` 中 KP-023 = 配方法(A3/数与代数)，全套字段对齐真库。
- [ ] `ConceptNav.tsx` KP-023 勾股硬编码分支已删。
- [ ] 全项目 grep 无残留 import 已删 mock；无编译错误、无运行时 undefined。
- [ ] 降级兜底收敛到真库对齐镜像；DB 未就绪显示 loading/空态而非错误旧数据。
- [ ] 受影响测试断言已同步改为真库权威值。
### 全局
- [ ] `pnpm build` 0 错误；`pnpm test` 全绿（用例数因改测试可能变化，需全绿）；Console 0 Error。
- [ ] 核心判分/SQLite/门神字段零篡改。
- [ ] **RESULT 列出本任务实际改动的完整文件清单**（区分本任务成果 vs 工作区既有遗留改动）。

## 🚫 红线
- ❌ 不碰任何 SVG 文件内容。
- ❌ 不改数据库数据（归 DATA 线）。
- ❌ **验收截图必须逐张不同的真实现场截图**，禁止复制同一张图充数（FE-0012 曾 5 张同 MD5，严禁重犯，RESULT 附各图 MD5 或明显不同画面）。

## 回写要求
1. 修复完成写 `.kiro/relay/frontend/outbox/RESULT-FE-0013.md`（A/B 两部分逐项对账 + 真实截图路径 + 实际改动文件清单 + build/test 结果）。
2. `status` 改 `done`，告知用户"TASK-FE-0013 完成"。
