---
id: TASK-FE-0005
line: frontend
status: assigned
attempt: 1
created_by: Kiro
title: 切真库后运行时冒烟复检 — 确认FE-0004改动未引入新崩溃（部署前最后一道闸）
model: default
concurrency: 5
---

# 任务：切真库后运行时冒烟复检（部署前闸门）

## 1. 目标
FE-0004 把 15 个文件的数据源从 mock 切到真库 dbClient 异步加载，改动面大。**单测绿 ≠ 运行时不崩**（异步加载时序、真库数据边界、空值、大数据量渲染都是单测覆盖不到的）。本任务用真库跑 preview，**逐模块运行时冒烟**，确认切真库后没引入新崩溃/白屏/错乱，作为进入部署人工测试的最后一道闸。
- **只冒烟验证，不修 bug、不改代码/数据**。发现问题分级记录，交 Kiro 派修。

## 2. 上下文
- FE-0004 已切真库：ConceptNav/PointMasterExample/LineClosedLoop/MathJuniorHome/SubwayMap/PaperWorkbench/沙盒/ScorePanel 全走 dbClient 异步读 core/master/sandbox/questions
- 真库：107考点/119母题/46+36沙盒/2064真题，public 四包最新
- 已知不阻塞项（勿当新bug报）：28考点<3题有兜底、combination_id空、部分沙盒硬编码色

## 3. 冒烟范围（5 片并发，每片一模块，只读跑通）
片1 **模块一**：进概念精讲 → 四段论渲染真实考点(非20个mock) → 单点快练抽题(测正常考点+空考点KP-096不崩) → 母题步进(dim3显示) → 链接沙盒
片2 **模块二**：思维图谱渲染107考点+依赖边 → 点击考点焦点穿透 → 组合面板动态渲染 → 主线闭环读真母题
片3 **模块三**：实验室一概念沙盒(46)拖动交互 → 实验室二4D跃迁(36)载体/参数/姿态变异不崩(重点:carrier options驱动) → X-Ray
片4 **模块四**：组卷工作台真库2064题组卷(120/100/150制凑齐) → 库存预警 → 在线测评作答 → **判分(重点:选择题脏答案*A*能判对) → 雷达图 → 考完即焚**
片5 **横切+启动**：pnpm build+preview启动 → 四包DB真实加载(启动core/惰性其余) → i18n中英热切(确认无__PENDING__裸露) → 三端切换 → 路由/门户 → 异步加载loading/错误兜底不白屏

## 4. 每片记录
- 该模块**能否跑通、有无崩溃/白屏/console报错/数据错乱**
- 崩溃必附:操作路径 + 报错信息 + 涉及组件
- 真库数据是否真渲染(举ID) vs 是否意外回退到mock兜底

## 5. 红线
- 只读冒烟，不修bug、不改代码、不改data/*.db
- 发现崩溃如实记录，不擅自"顺手修"

## 6. 验收清单（Kiro 据此验收）
- [ ] 5模块逐一冒烟结论(跑通/崩溃)
- [ ] 崩溃项分级(阻塞/一般/观察)+复现路径+报错
- [ ] 判分脏答案容错运行时实测(*A*判对)
- [ ] 空考点快练运行时不崩实测
- [ ] 真库数据真渲染确认(非意外回退mock)——各模块举ID
- [ ] i18n英文模式无__PENDING__裸露
- [ ] 明确结论：切真库后**是否可进入部署人工测试**（无阻塞崩溃即可放行）
- [ ] pnpm build 0错 + preview启动正常

## 7. 回写
1. 结果写 outbox/RESULT-FE-0005.md：5片冒烟结论 + 分级问题 + 可否部署判断
2. 保留 tmp/smoke/part*.md
3. status改done，播报"TASK-FE-0005 完成"进STANDBY

## 8. 执行方式（并发5片，见§3）
- model: default(Flash) + concurrency: 5：主Agent跑共享前置(build/preview)，单次invoke_subagent并发5子Agent各冒烟一模块，主Agent汇总
- 只读零冲突；完成STANDBY
