---
id: TASK-DATA-0004
line: datalayer
status: accepted
attempt: 1
created_by: Kiro
title: 重做46个概念沙盒(concept_sandboxes)真实可交互配置，替换统一占位模板
model: gemini 3.1 pro
concurrency: 5
---

# 任务：重做 46 个概念沙盒的真实几何配置

## 🚨🚨 执行方式铁律（最重要，先读）
- **本任务 model = gemini 3.1 pro。执行者主对话是固定 Flash 模型，换不了 Pro。**
- **必须通过 `invoke_subagent` 显式声明 `Model: "pro"`、`TypeName: "self"` 派发执行，严禁在主对话自己用 Flash 跑。**（协作标准 §7 铁律）
- `concurrency: 5`：单次 `invoke_subagent` 一次性并发派发 5 个 Pro 子 Agent，各处理一个分片；子 Agent 只读+生成写各自 `tmp/sbcfg/partN.jsonl`，主 Agent 单进程串行写库。
- 沙盒配置是高难数学内容设计（要懂每个 template 的几何场景），Flash 做不了，必须 Pro。

## 1. 目标与根因
Kiro 诊断确认：46 个 concept_sandboxes 的 `drag_points_json / param_sliders_json / invariants_display_json` **全部是同一套占位模板**——不管数轴沙盒还是勾股沙盒，配置都是 `[{"id":"P","x":2,"y":3,"constrainTo":"curve"}]` + 一个 param_k 滑块 + `f(x)=const` 占位不变量。导致前端渲染出来永远是一个孤立点+一个滑块，毫无几何意义（用户 preview 实证：数轴沙盒里没有数轴、没有可拖有理数点）。

**本任务：为 46 个概念沙盒各自按其 `canvas_template` 的数学本质，重做真实可交互配置。**

## 2. 上下文
- 库：`data/sandbox.db` 表 `concept_sandboxes`（46行）
- 每行有 `canvas_template`（46种不同：number_axis_template / geometry_pythagorean_template / function_quadratic_vertex_template / ...）+ `point_id`（关联 core.db 考点）
- 考点数学本质来源：JOIN `core.db knowledge_points`（name_zh + formal_definition_zh 四段精讲），**必须读这个作为设计依据**
- 前端渲染器契约：`src/modules/sandbox/SandboxRenderer.tsx` 消费 viewbox_spec_json / drag_points_json / param_sliders_json / invariants_display_json —— 配置结构必须匹配它能消费的格式（见 §4）

## 3. 硬前置（喂给 Pro 子 Agent）
- core.db 每个沙盒对应考点的 name_zh + 四段精讲（理解该考点要探究什么）
- SandboxRenderer.tsx 的配置消费格式（drag_points 每点 {id,x,y,name,color,constraints}；sliders {id,name,min,max,default,step}；invariants {labelZh,formula,deps}）
- 46 个 canvas_template 列表及其几何含义

## 4. 每个沙盒要产出的真实配置（按 template 定制，非套壳）
- **viewbox_spec_json**：适配该场景的坐标范围
- **drag_points_json**：该场景真正需要的可拖点。例：
  - number_axis_template（数轴）：数轴上的有理数动点、原点，能拖动观察正负/距离
  - geometry_pythagorean_template（勾股）：直角三角形三顶点，可拖调节
  - function_quadratic_vertex_template（二次函数顶点）：顶点/开口控制点
- **param_sliders_json**：该场景有意义的参数滑块（如二次函数的 a/h/k，不是通用 param_k）
- **invariants_display_json**：该场景真正的不变量（如勾股 a²+b²=c²、数轴距离|AB|），deps 指向真实点 id
- **配置必须让前端渲染出有几何意义的可交互场景**，不是孤立点

## 5. 红线
- 只 UPDATE concept_sandboxes 的 4 个 json 配置字段 + content_status；不改结构/ID/外键
- 不动 leap_sandbox_models（那是上一轮 TASK-DATA-0003 已做的）
- 配置里的点坐标/颜色：颜色用**真实色值或色名**（如 "#0071e3" / "blue"），**禁用 CSS 变量 var(--...)**（JSXGraph 不认，前端会另修但数据侧也不该写 var）
- 含公式过数学门神
- 写库前备份 data/sandbox.db.bak_before_task0004
- 禁 DELETE

## 6. 验收清单（Kiro 据此验收）
- [ ] 备份存在
- [ ] 46 个沙盒的 drag_points_json **不再是统一占位**（抽验：数轴/勾股/二次函数三类的配置各不相同且贴合场景）
- [ ] 每个 invariants deps 指向该沙盒真实存在的点 id
- [ ] 配置颜色无 var(--...)（用真实色值）
- [ ] 公式过门神
- [ ] content_status 全 done
- [ ] 未动 leap_sandbox_models、未动结构
- [ ] part*.jsonl 保留 + 报告（抽样3~5个沙盒的配置设计说明，证明贴合数学本质）

## 7. 回写
1. 结果写 outbox/RESULT-DATA-0004.md
2. 保留 tmp/sbcfg/part*.jsonl
3. status改done，播报"TASK-DATA-0004 完成"进STANDBY
