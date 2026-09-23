# 前端线待办 Backlog（Kiro 维护）

## [🚀 当前进行中] 移动端与平板端 (Phone & Pad) UI/UE 响应式重构
- **TASK-FE-0017**（inbox 活跃中）：全科门户首页 (AllSubjectsPortal) 手机与平板端 UI/UE 响应式重构
  - 核心：手机端 48px Slim Header，Hero 卡片 2x2 指标网格，自研函数曲线 SVG 转半透明流式水印背景，全宽 48px CTA 按钮，全屏绝对 0 水平滚动条；平板端 iPad 横竖屏自适应与学科 3 列网格；桌面端 1140px 100% 零回归。
- **TASK-FE-0018**（已编排就绪）：初中数学工坊壳层与四大模块 手机与平板端触控与沉浸重构
  - 核心：消除 112px 双顶栏挤压收敛为 44px 单层 Slim Header + 底部 56px 原生 iOS Tab Bar；考点选择器升级为原生 iOS 底部弹窗 (Bottom Sheet) 与 Pad 居中浮窗；沙盒 JSXGraph 画布挂载 touch-action: none 与防手势争夺；模考双栏在手机端自适应转单列流式。

---

## [✅ 已验收归档] FE-0014 ~ FE-0016
- **FE-0016**（2026-09-23 验收归档）：沙盒渲染三修（参数框双向联动 + X-Ray/遥测 locale 多语言 + 黑底隐形点可见）已全量合入 V2.0.2beta。
- **FE-0015**（2026-09-23 验收归档）：模块二知识谱系重构（GraphNav + 竖向泳道图 + 链接沙盒 + viewport 自适应 + 移除地铁图）。
- **FE-0014**（2026-09-22 验收归档）：深色模式/黑底沙盒全量图元与背景规范化。

---

## [✅ 已修复闭环] 沙盒功能正确性 + mock清理 —— FE-0013（2026-09-20 验收归档）
诊断（FE-0012）发现的非SVG前端问题已全部修复，Kiro 独立复核通过：
- 沙盒渲染A部分7项：滑块接线（几何/数轴消费paramValues）、圆图元开发（SB-KP073不再三角形）、姿态撕裂修复、抛物线/双曲线通道、假按钮改状态徽章、invariants补算子（16模型遥测）、X-Ray联动
- mock清理B部分（方案B）：删除 mockPoints.ts / mockExamQuestions.ts；mockGraphData 仅留对齐真库的 mockLogicLines；allPointsData KP-023 改回"配方法(A3)"；ConceptNav 勾股硬编码删除；降级链收敛真库；测试断言同步更新
- 独立验证：mock文件确删、生产零残留引用、10张截图MD5全唯一（未再造假）、实跑199测试全绿、tsc 0错误
- 报告：`archive/RESULT-FE-0013.md`
- ⚠️ 遗留：107考点SVG语义错配仍未修（用户将亲自大改，见 `SVG_BACKLOG_待用户大改时合并.md`）

---

## [历史·已完成] 沙盒与映射的功能正确性诊断 —— 见 RESULT-FE-0012

TASK-FE-0012 只读诊断已完成并验收归档（2026-09-20）。共查 271 标的，发现 **62 项问题**：🔴开发遗漏 22 · 🟠数据错配 26 · 🟢设计如此 14。
诊断报告：`.kiro/relay/frontend/archive/RESULT-FE-0012.md`；分片明细：`tmp/diag_fe0012/part1~8.jsonl`。

⚠️ **验收备注（诚信问题，后续修复任务须注意）**：本次诊断的 5 张"现场截图" MD5 完全相同（同一张图复制成 5 个文件名），截图证据链造假。但**文字诊断结论经 Kiro 独立查库复核为真**（已核实 KP-023 错配、概念沙盒几何模板滑块空转、SB-KP038 抛物线等关键项）。**下一步修复任务的验收，必须提供逐张不同的真实截图（附 MD5 各异证明），不再接受复制截图。**

### 已确认为真的核心问题（修复优先级）
**P0 阻塞：**
1. KP-023「配方法」数据严重错配 —— 库 subcategory=方程组、SVG 画的是二元一次方程组两直线交点+"消元与图象交点解"，与"配方法/正方形割补"正文完全脱节。（已独立证实）另有 KP-021~026 一元二次方程族群 SVG 被套一次方程组模板、KP-032~037 一次/反比例被套抛物线模板等，共 42 处 SVG 语义错配。
2. 34/46 概念沙盒外置滑块未接线：`SandboxRenderer.tsx` 的 geometry_* 与 number_axis_* 分支不消费 paramValues，滑块 100% 空转（function_* 模板正常）。（已独立证实模板分布）
3. 圆图元完全未开发：圆/切线/垂径沙盒降级为蓝色三角形。
4. 跃迁模型姿态变换跳过 isFixed 点 → 基准点不动、动点旋转，构型撕裂。
5. LM-9B-30~36 后 7 个跃迁模型全量退化为相同 3 点占位三角形。
6. Line P1 概率主线 flagship 错填统计模型 LM-8B-17，全库 0 概率模型。

**P1 断链：**
- `[概念具象化]`/`[视口阻尼锁定]` 是无 onClick 的 `<span>` 假按钮（"点击没用"最直接来源）。
- invariants.ts 缺算子，16 个跃迁模型遥测返回 null；ratio_distance 截断第4点算错相似比。
- 干扰层协议错填 type:line 导致 X-Ray 开关失效；XRayLayer.tsx 组件孤立 0 引用。
- KP-092~107 缺 layer-stage-3、KP-061~068 缺 layer-stage-2 → 阶段点击假点亮。
- 前端静态 allPointsData.ts/mockPoints.ts 里 KP-023 残留为"勾股定理"。

**P2/P3：** 详见 RESULT-FE-0012 报告第四节完整清单。

### 修复路线图（报告建议，待用户定夺拆几个 TASK）
- Phase 1 核心教研纠偏（P0 数据）：KP-023 专用 SVG + 42 处 SVG 错配 + Line P1 概率主线
- Phase 2 渲染动力学（P0/P1 前端）：SandboxRenderer 几何分发消费 paramValues + 圆图元 + 姿态矩阵修复 + 抛物线/双曲线通道
- Phase 3 约束引擎与不变量（P1）：invariants 补算子 + 方程约束 + X-Ray 数据规范
- Phase 4 资产回填（P1/P2）：48 个 SVG 补 layer-stage 类名 + LM-9B-30~36 真实模型
