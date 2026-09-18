---
id: TASK-FE-0004
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 前端数据源切真库 — 概念精讲/思维图谱/组卷/沙盒从mock切dbClient + 判分容错归一化
model: default
concurrency: 1
---

# 任务：前端全面切换真实 SQLite 数据源（消除 mock 架空）

## 1. 目标
TASK-FE-0003 体检发现：模块一/二/三前端消费的是**本地 mock 静态数据**（约20考点），数据线回填的真库（107考点四段/119母题/46+36沙盒）在 UI 被完全架空（BLK-03/04/05/06）。本任务把前端数据通道**全面切到真库 dbClient 异步读取**，并加判分容错。

> **⚠️ 前置依赖**：数据侧修复由 Kiro 先行完成（选择题答案剥星号、9题题型修正、sandbox 4D字段补齐、public/data/questions.db 同步）。**本任务启动时数据已是干净的**，你只需切数据源。

## 2. 背景与现状缺陷（体检实测）
- `src/ConceptNav.tsx:128`：硬编码 `knowledgePoints = mockKnowledgePointRecords`（mockPoints.ts，仅约20考点）→ 概念精讲/母题只见 mock
- `src/MathJuniorHome.tsx`：挂 `<SubwayMap>` 用 `mockLogicLines`/`mockGraphData`，未传真库 props → 图谱只见20考点
- 组卷 `PaperWorkbench.tsx`：UI 层静态绑 `mockExamQuestions`（底层 drawQuestionsFromDb 已就绪但未勾连）
- 沙盒：硬编码 4 个本地 TS 对象，未读 sandbox.db
- 判分 `ScorePanel.tsx`：选择题 `studentAns === answer_standard` 严格全等，无容错

## 3. 现有可复用基础（不要重造）
- `src/engine/db/dbClient.ts` + `worker.ts`：已实现 WASM SQLite 只读分包异步查询（core/master/sandbox/questions），参数化 `?` 占位
- `src/engine/db/packages.ts`：分包路由已配好
- 参考现成真库消费：模块四 `drawQuestionsFromDb`（已连 questions 真库，照此模式）

## 4. 具体步骤（逐组件切，串行稳妥）
1. **模块一 ConceptNav**：`mockKnowledgePointRecords` → `dbClient.query('core','SELECT * FROM knowledge_points ...')` 异步加载 107 考点四段；四级导航(年级/学期/领域/考点)从真实数据派生
2. **母题 PointMasterExample**：接 `dbClient.query('master','SELECT * FROM master_examples WHERE ...')` 读真实 119 母题四维（dim1/2/3/4）
3. **主线 LineClosedLoop**：接 core.db `logic_lines` 真实主线四段
4. **模块二 SubwayMap**：`MathJuniorHome` 异步读 core.db（knowledge_points + logic_lines + knowledge_graph_semesters + knowledge_combinations）注入 props，替代 mockGraphData → 渲染 107 考点 + 依赖边
5. **模块三 沙盒**：读 sandbox.db（concept_sandboxes 46 + leap_sandbox_models 36）驱动，替代硬编码 4 对象；`compileMorphingSandboxConfig` 加空值防护（`carrier.options?.find(...) ?? default`）防字段缺失崩溃
6. **组卷 PaperWorkbench**：UI 默认走 `drawQuestionsFromDb` 异步读真库（2064题），替代 mockExamQuestions
7. **判分容错 ScorePanel**：选择题比对前归一化 `normalizeOptionAnswer`（去 `*`/句号/空格再比），双保险（即使数据已清洗，防未来脏数据）

## 5. 红线 / 禁止事项
- 禁改判分核心算法（calculateSolutionScore / isMathAnswerEquivalent 内部逻辑）、drawQuestions 隔离逻辑、QuestionContent 锚点切分、门神 —— 只切数据源 + 加归一化容错
- 禁改 data/*.db（数据侧 Kiro 负责）
- 保持异步加载不阻塞首屏（core 启动加载、其余惰性，见 design §2.3）
- 加载中/失败要有兜底 UI（不白屏）
- 铁律：无 katex import、无裸 innerHTML、无 emoji、无新 CSS 框架、零持久化

## 6. 验收清单（Kiro 据此验收）
- [ ] ConceptNav 读 core.db 真实 107 考点（非 mock 20 个）—— 举考点ID证渲染内容=core.db
- [ ] PointMasterExample 读 master.db 真实母题 dim1/2/3/4
- [ ] SubwayMap 渲染 107 考点 + 真实依赖边（非 mockGraphData）
- [ ] 沙盒读 sandbox.db 46+36，compileMorphingSandboxConfig 有空值防护不崩
- [ ] 组卷走 drawQuestionsFromDb 真库 2064 题
- [ ] ScorePanel 选择题归一化容错：`'A'` vs `'*A*'`/`'A'`/`'A．'` 都能正确判对
- [ ] 各模块 mock 数据源已移除或不再是默认（grep 确认 UI 不再默认 mockPoints/mockGraphData/mockExamQuestions）
- [ ] 判分/隔离/门神核心逻辑零改动（git 比对）
- [ ] pnpm test 全绿、pnpm build 0 错
- [ ] 无 katex/innerHTML/emoji/新CSS框架；异步加载有兜底不白屏

## 7. 回写要求
1. 结果写 `outbox/RESULT-FE-0004.md`：逐条验收自检 + 改动文件清单 + 各模块切真库的ID佐证 + 判分容错测试
2. 任务书 status 改 done，播报"TASK-FE-0004 完成"进 STANDBY

## 8. 执行方式
- `model: default`（Flash），固定执行对话直接跑（切数据源照现成 dbClient 模式，不涉高推理）
- 串行（改多个组件数据源，并发易冲突）
- 完成 STANDBY 待命
