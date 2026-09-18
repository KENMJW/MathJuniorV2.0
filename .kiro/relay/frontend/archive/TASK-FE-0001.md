---
id: TASK-FE-0001
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 真实 questions.db 接入前端 + 带图/母题/沙盒端到端运行时核查
model: default
concurrency: 1
---

# 任务：真实题库接入前端 + 端到端运行时核查

## 1. 目标
前端一直跑 mock 数据。数据线已产出 **2161 道真题**的 `data/questions.db`（67 done + 2094 pending，含 1125 道带 `[[IMG:n]]` 图锚点题、2126 张 webp）。
本任务：**让前端产品跑真实 questions.db**，并端到端核查"带图题 / 来源标签 / 母题步进 / 链接沙盒"四处在真实数据下运行时表现正常，不崩、不错位、图能出。

> 说明：静态层面 Kiro 已确认 —— 9.2(LinkedSandboxSlot)、9.3(PointMasterExample) 均已被 ConceptNav 引用接入；20.4 三端骨架已在 MathJuniorHome 按 detectDeviceProfile 接入；db 引用 2021 张图 0 缺失。**本任务不重复静态核查，只做真实数据接入 + 运行时验证。**

## 2. 上下文
- 真库：`data/questions.db`（前端分包映射见 `src/engine/db/packages.ts`，questions 包路径 `/data/questions.db`）
- 图目录：`assets/questions/*.webp`（2126 张）；`dist/assets/questions/` 已同步 2126 张
- 关键渲染组件（已实现，勿改内部逻辑）：
  - 题目混合渲染：`src/modules/exam/`（QuestionContent 按 `[[IMG:n]]` 锚点切分，见批次#16）
  - 来源标签：`src/components/common/SourceTag.tsx`（`exam_year·region` 拼接，region 空则不渲染，见批次#17）
  - 母题步进：`src/modules/concept/PointMasterExample.tsx`
  - 链接沙盒：`src/modules/concept/LinkedSandboxSlot.tsx`
- 真实数据字段形态（供核查预期）：
  - `content_status`：67 done / 2094 pending（pending 题 stem_en='__PENDING__'、primary_point_id='KP-000'、answer_standard 多为 '__PENDING__'）
  - `region` 已清洗为纯地名（成都/北京/…），510 题为空（微专题，标签应不显示）
  - 带图题 stem_zh 含 `[[IMG:0]]` 等锚点，`image_paths_json` 为路径数组

## 3. 具体步骤
1. 确认/切换前端 questions 分包数据源指向真实 `data/questions.db`（`packages.ts` 路径核对；若构建需把 db 拷进 `public/` 或 `dist/data/`，按现有分包加载方式办，不改加载器逻辑）
2. `pnpm build` 确保真库 + 2126 webp 一并进 dist
3. 启动 preview，端到端核查四处（截图或逐条文字记录运行时表现）：
   - **带图题**：至少 3 道不同带图题（如含 `[[IMG:0]]` 的选择/填空/解答各一），确认题干图就地渲染、不整段进 MathRenderer、图能加载出
   - **来源标签**：有 region 的题显示"2025·成都"类标签；region 空的微专题**不显示**空标签
   - **母题步进**：PointMasterExample 在真实 master.db 母题上按维度步进解锁正常
   - **链接沙盒**：LinkedSandboxSlot 有 sandbox_id 渲染沙盒 / 无则等大占位卡（CLS=0）
4. 记录：pending 题（stem_en/answer 为 '__PENDING__'）在前端是否有异常显示（如把 '__PENDING__' 直接渲染给用户）——若有，如实报告，**本任务不修**，交 Kiro 决策

## 4. 验收清单（可量化，Kiro 据此验收）
- [ ] 前端 questions 数据源指向真实 `data/questions.db`（非 mockSeed 产物），`packages.ts` 路径核实无误
- [ ] `pnpm build` 0 错；dist 内含真实 questions.db + 2126 张 webp
- [ ] `pnpm test` 全绿（用例数记录，与上批 163 对比，纯接入不应减少）
- [ ] 带图题运行时正常：提供 ≥3 道带图题的 question_id + 渲染表现描述（图出/锚点位置正确/不崩）
- [ ] 来源标签：有 region 显示、空 region 不显示空 pill —— 各举 1 例 question_id 佐证
- [ ] 母题步进、链接沙盒运行时无崩溃、无布局错位
- [ ] pending 题占位值('__PENDING__')前端呈现情况如实记录（是否漏给用户看到占位符）

## 5. 红线 / 禁止事项
- 禁止：修改任何已验收组件的**内部业务逻辑**（QuestionContent 锚点切分 / SourceTag / 判分 / drawQuestions 隔离 / SandboxRenderer）。本任务只做数据源接入 + 观察，不改渲染逻辑。
- 禁止：修改 `data/questions.db`（数据线专属，前端只读消费）。
- 禁止：为"让页面好看"临时改题面数据或塞假数据。
- 备份：本任务不写库、不删文件；若需把 db 拷入 public/dist 属构建产物，可放心操作。

## 6. 回写要求
完成后：
1. 结果写入 `outbox/RESULT-FE-0001.md`，含：做了什么、逐条验收清单的量化自检结果（附 question_id 佐证）、pending 占位符呈现观察、遇到的问题
2. 把本任务书 `status` 改为 `done`
3. 回 `inbox/NEXT.md` 读下一个信号，遵守轮询协议（IDLE：3 分钟/次，上限 20 次）

## 7. 轮询协议（固定，勿改）
- 完成本任务 → 读 `.kiro/relay/frontend/inbox/NEXT.md`
- 具体任务号 → 立即开工
- `IDLE` → 每 3 分钟轮询，最多 20 次，之后待命
- `WAIT-USER` → 停止轮询
