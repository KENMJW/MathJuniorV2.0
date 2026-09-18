---
id: TASK-DATA-0003
line: datalayer
status: accepted
attempt: 1
created_by: Kiro
title: 补齐sandbox.db跃迁模型4D配置(carrier/posture/camouflage) + 英文占位 + 元数据
model: gemini 3.1 pro
concurrency: 5
---

# 任务：补齐 sandbox.db 沙盒配置（4D变异 + 英文 + 元数据）

## 1. 目标
前端沙盒模块切真库（TASK-FE-0004）需要 sandbox.db 配置完整。当前 leap_sandbox_models 的 4D 变异配置是早期占位（carrier 载体变异缺 options 数组，接前端会崩 `carrier.options?.find`）。本任务补齐：
1. **leap_sandbox_models 36个的 4D 变异配置**（核心，高难）：carrier_morphing / posture_morphing / camouflage_xray 补成前端可驱动的完整结构
2. **英文占位翻译**：concept_sandboxes.inquiry_guide_en(46)、leap.model_name_en(36)、model_brief_en(36)
3. **元数据补齐**：content_status→done、leap.clique_id

## 2. 现状诊断（Kiro 实测）
- **concept_sandboxes(46)**：viewbox/drag_points/param_sliders/invariants 已有实体配置 ✅（可驱动），只缺 inquiry_guide_en(46全占位) + content_status
- **leap_sandbox_models(36)**：
  - parameter_morphing_json 36/36 有实体 sliders ✅
  - **carrier_morphing_json 0/36 有实体 options** ❌（只有 `{description,default}`，前端 compileMorphingSandboxConfig 读 options 会崩）
  - posture_morphing / camouflage_xray 为描述性占位
  - model_name_en/model_brief_en/clique_id/content_status 空

## 3. 硬前置（必须喂给模型，否则4D设计脱离模型本质）
- `docs/实验室二_模型手册.md`（36模型权威手册，8775字节）
- 库内每模型的 `model_name_zh` + `model_brief_zh`（模型数学本质）
- 前端契约：`src/modules/sandbox/morphControllers.ts` 的 `CarrierMorphingSpec` 等类型定义（4D结构的目标形态，照它设计）

## 4. 4D 配置结构要求（照前端 morphControllers 契约）
每个 leap 模型补：
- **carrier_morphing_json**：`{"description":..,"default":..,"options":[{"id":..,"label":..,"transform":..},...]}` —— 载体变异选项数组（如"数轴动点"模型的载体可换成不同起点/方向），**options 非空数组是防崩关键**
- **posture_morphing_json**：`{"modes":[{"id":"standard"..},{"id":"rotated"..},...]}` 姿态变异（旋转/翻折/平移的具体参数）
- **camouflage_xray_json**：`{"coreSkeleton":..,"distractorLayers":[..]}` 干扰加壳层 + 骨架透视
- 配置须**贴合该模型数学本质**（据手册+brief），不是通用模板套壳
- 含公式过数学门神

## 5. 并发（5片，写库单进程串行）
- 36 leap + 46 concept 按 model_id/sandbox_id 排序五等分，各片只读+生成 4D配置/翻译，写 tmp/sbfill/partN.jsonl
- 主 Agent 串行写库；写前备份 data/sandbox.db.bak_before_task0003
- per_shard 可选：4D配置片用 pro，纯翻译片可 flash（本任务统一 pro 亦可）

## 6. 红线
- 禁改已有实体配置（concept 的 viewbox/drag/slider/invariant、leap 的 parameter sliders 不动）
- 禁改结构/ID/外键；只补空字段 + 扩展 4D json
- 禁 DELETE
- carrier options 必须非空数组（前端防崩硬要求）
- 写库前备份 data/sandbox.db.bak_before_task0003

## 7. 验收清单（Kiro 据此验收）
- [ ] 备份存在
- [ ] leap 36个 carrier_morphing_json 全部含非空 options 数组（前端不会崩）
- [ ] leap 36个 posture/camouflage 补成结构化配置（非纯description）
- [ ] 4D配置贴合模型本质（抽验3~5个对照手册，非套壳）
- [ ] 英文占位清零：concept.inquiry_guide_en(46)、leap.model_name_en/model_brief_en(36) 无 __PENDING__
- [ ] content_status 全 done、clique_id 补齐
- [ ] 已有实体配置零改动（Kiro比对备份）
- [ ] 公式过门神
- [ ] part*.jsonl 保留 + 报告(补齐数/抽样佐证)

## 8. 回写
1. 结果写 outbox/RESULT-DATA-0003.md
2. 保留 tmp/sbfill/part*.jsonl
3. status改done，播报"TASK-DATA-0003 完成"进STANDBY

## 9. 执行方式
- model: gemini 3.1 pro（4D配置是高难内容设计，须懂36模型数学本质）
- concurrency: 5，subagent并发派发，写库串行
