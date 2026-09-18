---
id: TASK-FE-0003
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 全项目真实数据端到端验证 — 对齐需求/设计，产出问题清单（部署人工测试前的最后体检）
model: default
concurrency: 8
---

# 任务：全项目真实数据端到端完整性验证

## 1. 目标
在进入**部署 + 人工测试**环节前，用**真实数据库**（core/master/sandbox/questions 四包，questions 已是 2064 道精品）对整个前端应用做一次**端到端完整性体检**：
- 验证四大模块 + 外壳/路由/门户在真实数据下能否跑通、不崩、不白屏
- 对照 `design.md`（12节 + CT契约 + Property + 铁律）逐条核查功能是否齐全、是否对齐需求
- **产出问题清单**（分级：阻塞 / 一般 / 观察），交 Kiro + 用户决策修复
- **本任务不修 bug、不改数据**，只验证 + 记录。发现的问题如实报，由 Kiro 后续派修复任务

## 2. 上下文
- spec：`.kiro/specs/math-junior-frontend/design.md`（需求/设计权威）、`tasks.md`（任务清单）、`ACCEPTANCE_LOG.md`（历史验收）
- 真实数据：`data/{core,master,sandbox,questions}.db`；questions 2064 道（考点/难度/答案/解析/翻译/多解齐全）
- 前端已完成：脚手架/门神/ETL/判分/四大模块/外壳路由/图片渲染/来源标签/多解渲染/i18n/设备调度
- 已知边界（非本次要修，仅核实兜底不崩）：
  - 28 个考点题数<3、15 个考点 0 题 → 单点快练兜底应"有几题显示几题、0题显示暂无提示"（QuickPractice.tsx 已有 length===0 兜底）
  - combination_id 大量为空（组卷现按 primary_point_id 筛，不依赖它）

## 2.5 并发执行架构（8 片按章节并行 + 主 Agent 汇总）
本任务为**只读验证**（红线：不改代码/不改数据/不写库），无并发冲突风险，按 §3 的 8 个章节切片并行：
```
主 Agent：先跑一次 pnpm build + pnpm test + 启动 preview（共享前置）
并发 8 片（各验一个章节，只读只记录，各写 tmp/verify/partX.md）：
  片A → A.构建与启动     片B → B.模块一
  片C → C.模块二         片D → D.模块三
  片E → E.模块四         片F → F.横切
  片G → G.数据对齐       片H → H.内容5.x真实渲染核实
主 Agent：汇总 8 片结果 → 整合成一份 outbox/RESULT-FE-0003.md（含统一的分级问题清单 + 能否进部署判断）
```
- 8 片=8 章节，一一对应，最大化并行且不空转；再细分无独立单元。
- 各片只读验证、各写独立片段文件，零冲突；主 Agent 串行汇总。

## 3. 验证清单（逐项跑真数据核实，记录 通过/问题）

### A. 构建与启动
- [ ] `pnpm build` 0 错；`pnpm test` 全绿（记录用例数）
- [ ] preview 启动，四包 DB 真实加载（core 启动加载、其余惰性加载，见 design §2.3）

### B. 模块一 概念精讲
- [ ] 四段论视窗渲染真实考点四段内容（core.db），公式经 MathRenderer 正确
- [ ] 单点快练：正常考点抽满 3 题(L1~L3)；**<3题考点显示几题给几题；0题考点显示"暂无"提示不崩**（重点测 KP-096/KP-013 等空考点）
- [ ] 母题步进（PointMasterExample）读 master.db 真实母题，dim3 恒显示
- [ ] 链接沙盒（LinkedSandboxSlot）有沙盒渲染/无沙盒等大占位卡 CLS=0

### C. 模块二 思维图谱
- [ ] 6学期×12主线泳道图渲染 107 考点、依赖边连通
- [ ] 焦点穿透（入度蓝/出度紫）；组合面板 kp_count 1~8 动态渲染
- [ ] 主线快练锁 L4~L6

### D. 模块三 沙盒
- [ ] SandboxRenderer 读真实 sandbox.db 配置驱动，动点/滑块/不变量可交互
- [ ] 实验室二 4D 变异 + X-Ray

### E. 模块四 测评
- [ ] 组卷工作台：满分制/预设卷/考点复选/难度滑块；**用真实 2064 题库组卷能否凑齐题量**（各题型库存是否够）
- [ ] 库存预警 verifyPaperInventory 真实触发
- [ ] 母题物理隔离：抽题只出 questions 无 ME- 混入
- [ ] 在线测评：填空判分(isMathAnswerEquivalent)、解答判分(rubric)、雷达图、考完即焚
- [ ] 带图题/来源标签/多解解析在测评卷中正确渲染
- [ ] A4 打印双栏

### F. 横切
- [ ] 零持久化（无 localStorage/IndexedDB 写）
- [ ] i18n 中英热切换（数据双语投影 + 界面 data-i18n）；**pending 占位符是否漏出**（历史发现：英文模式 stem_en 若有 __PENDING__ 会裸露 — 现真库已无 __PENDING__，核实确认）
- [ ] 三端设备调度（MOBILE/TABLET/DESKTOP）切换
- [ ] 数学门神：抽查真实公式渲染无崩

### G. 数据对齐核查
- [ ] questions 2064 道 CT 契约符合：difficulty 1~9、question_type 枚举、选择题 answer 单字母
- [ ] 图引用完整（image_paths 指向的 webp 都在 dist）
- [ ] solutions_json 多解结构前端正确分条

### H. 内容生成 5.x 产出物真实渲染核实（重点·钉死口径疑点）
> 背景：前端 tasks.md 任务5「构建期大模型生成」标 `[ ]` 未由前端线执行，但其产出内容**已由数据线阶段二回填全部生成入库**（core.db 考点四段107全done、logic_lines 主线四段12全done、master.db 母题四维119全done dim3全填、sandbox 46+36）。本项要**证实前端渲染链路读到的是真库这些完整内容，而非 mock 空壳**。
- [ ] 模块一四段论（ConceptFourStages）实际渲染的是 **core.db 真实四段精讲**（origin_story/intuitive_essence/formal_definition/intrinsic_variation），非 mock/占位 —— 举 2~3 个考点 ID 佐证渲染内容与 core.db 一致
- [ ] 母题步进（PointMasterExample）渲染的是 **master.db 真实母题四维**（dim1/2/3/4），dim3_rigor 恒显示 —— 举母题 ID 佐证
- [ ] 主线闭环（LineClosedLoop）渲染 **core.db 主线四段** —— 举主线 ID 佐证
- [ ] 沙盒渲染读 **sandbox.db 真实配置**（concept_sandboxes/leap_sandbox_models），非硬编码
- [ ] 明确结论：前端消费的知识内容是"真实名师级内容"还是"mock 空壳"——若发现某处仍连 mock 数据源（非真库），列为**阻塞问题**（人工测试前必须切真库）

## 4. 红线 / 禁止事项
- **本任务只验证，不修 bug、不改代码逻辑、不改 data/*.db**（发现问题记录到报告，交 Kiro 派修复任务）
- 若为跑通验证需临时改配置（如指向真库），用完复原，不留副作用

## 5. 验收清单（Kiro 据此验收）
- [ ] §3 全部验证项都有明确"通过/问题"结论（不许跳过）
- [ ] 问题清单分级（阻塞/一般/观察），每条含：现象 + 复现 + 涉及文件/模块 + 建议
- [ ] 空考点快练兜底实测结论（0题考点不崩）
- [ ] 真库组卷实测结论（能否凑齐 120 制题量，各题型库存报告）
- [ ] pnpm test/build 结果、用例数

## 6. 回写要求
1. 主 Agent 汇总 8 片 `tmp/verify/part*.md` → 整合成一份 `outbox/RESULT-FE-0003.md`：§3 全 8 章节逐项结论 + 统一分级问题清单 + 数据对齐核查 + H项内容真实性结论 + 整体是否"可进入部署人工测试"的判断
2. 保留 `tmp/verify/part*.md` 供抽验
3. 任务书 status 改 done，播报"TASK-FE-0003 完成"进 STANDBY

## 7. 执行方式（并发 8 片，见 §2.5）
- `model: default`（Flash）+ `concurrency: 8`：主 Agent 单次 `invoke_subagent` 并发拉起 8 个子 Agent，各验一个章节（只读只记录），主 Agent 跑共享前置(build/test/preview) + 串行汇总
- 只读验证，无写库/改码，零并发冲突
- 完成 STANDBY 待命
