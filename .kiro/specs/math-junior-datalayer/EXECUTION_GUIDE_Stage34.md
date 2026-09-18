# 执行指令书 · 阶段一 步骤3+4+SVG（母题 master.db + 沙盒 sandbox.db + 107考点SVG）
# Execution Guide for Antigravity — Stage 3 & 4 & SVG

> 给执行方（默认 gemini-flash-3.8）。读完再动手。
> 权威依据：`requirements.md`(§8两阶段/§5.5数量) `design.md`(§5) `tasks.md`(步骤3-4) `docs/实验室二_模型手册.md`。冲突以 design.md 为准。
> **前置**：core.db 已就绪（107考点 KP-0xx + 12主线 A1~S1）。母题绑定考点/主线，沙盒绑定考点+手册模型。

---

## 0. 本次目标（骨架入库，能占位就占位）

- **步骤3** → `data/master.db`：119 母题骨架（考点母题107 + 主线母题12），题面生成、四维解剖占位。
- **步骤4** → `data/sandbox.db`：概念沙盒(选点) + 36 跃迁模型（按手册直录），声明式配置可占位。
- **步骤③(SVG)** → `assets/concepts/`：107 考点 × 双语 = 214 个考点示意 SVG，路径已在 core.db 占位(`assets/concepts/KP-0xx-{zh|en}.svg`)，本次产出真实 SVG 文件。
- 两库均加 `content_status` 列，骨架阶段='pending'（四维/配置文本待阶段二回填；手册已有的结构信息直接填）。

---

## 1. 🚨 铁律

1. **母题数量 = |X|+|Y| = 107+12 = 119**。考点母题每考点1道(point_master)，主线母题每主线1道(line_master)。
2. **母题独立于真题**：大模型基于经典题型生成，**不用真题库、不投喂网址**；`source` 记"仿照题型出处/风格"。
3. **物理隔离**：母题入 master.db，`example_id` 用 `ME-KP0xx`/`ME-LINE-xx`；**绝不出现在 questions**。
4. **dim3_rigor 恒必填**（题面阶段就要有严谨证明骨架）；dim1/2/4 可占位 `__PENDING_CONTENT__`（阶段二回填）。
5. **沙盒36模型严格按 `docs/实验室二_模型手册.md` 直录**，不自行编造模型；kp_dependencies 用手册所列考点，转 `KP-0xx` 格式并校验在 core.db 白名单。
6. **ID 映射**：手册用旧 `KP001`，入库一律转 `KP-001`。
7. **外键回填**：`core.db.knowledge_points.master_example_id`/`sandbox_id` 指向对应母题/沙盒；`logic_lines.master_example_id`(ME-LINE-xx)/`flagship_model_id`(旗舰LM-*) 回填。
8. **content_status 列**：两库各表加 `content_status VARCHAR(12) NOT NULL DEFAULT 'pending'`。

---

## 2. 步骤3 · 母题 master.db（对齐 schema）

表 `master_examples` 字段：example_id / example_type / bound_target_id / source / stem_zh / stem_en / options_json / correct_option / dim1_origin / dim2_essence / dim3_rigor / dim4_traps / bound_line_id / empirical_scoring_rate / image_paths_json (+ content_status)

- **考点母题(107)**：每个 KP-0xx 一道标杆题。example_type='point_master'，bound_target_id=KP-0xx，example_id='ME-'+KP编号(如 ME-KP023)。stem 生成标准范例题(难度适中)，dim3_rigor 填严谨解题骨架，dim1/2/4 占位。

### 母题四维 = What / Why / How / Model 认知阶梯（重要·本次只做 dim3）
四维不是四段无关内容，是对该母题从四个认知高度的剖析（学科通用认知阶梯）：
| 字段 | 认知层 | 含义 | 本次要求 |
| :--- | :--- | :--- | :--- |
| dim1_origin | Why 为何 | 该题模型/方法的原点由来、题眼从何而生 | **占位** `__PENDING_CONTENT__`（阶段二回填） |
| dim2_essence | What 是什么 | 几何不变/本质直观、这道题在考什么本质 | **占位**（阶段二回填） |
| dim3_rigor | How 怎么用 | 严谨推导证明 + 生死红线（易错关键步） | **本次必填**：写这道母题的严谨解题/证明骨架 |
| dim4_traps | Model 变式建模 | 极端反例、致命变式、可迁移的题型 | **占位**（阶段二回填） |

- **本次(骨架阶段)**：只把 dim3_rigor 做实（严谨解法骨架），dim1/2/4 一律占位，不编造。
- **阶段二回填时**：dim1/2/4 将由统一的名师级 Prompt 生成（自适应深度：大考点四维做满，基础考点允许薄；dim3 恒必填）。**本次不要提前做 dim1/2/4，避免低质内容污染。**
- **主线母题(12)**：每主线一道压轴综合题。example_type='line_master'，bound_target_id=line_id(如A4)，example_id='ME-LINE-A4'，bound_line_id=line_id，empirical_scoring_rate 填 [0.15,0.35] 的**模型估算值(标注估算)**。
- stem_en 可先中文占位或简译（阶段二统一处理）。

## 3. 步骤4 · 沙盒 sandbox.db（手册直录）

### 3.1 concept_sandboxes（概念沙盒·选点）
- 选点：约 40~50 个适合可视化交互的考点（几何/函数/数轴优先），非全107。
- 字段：sandbox_id='SB-'+KP编号 / point_id=KP-0xx / category_id / engine_type(geometry|function|number_axis) / canvas_template(配置模板ID) / inquiry_guide_zh/en / viewbox_spec_json / drag_points_json / param_sliders_json / invariants_display_json (+content_status)
- 骨架阶段：engine_type/category_id 按考点性质定；声明式 json 与 inquiry_guide 可占位(阶段二/手册回填)。未选点的考点 knowledge_points.sandbox_id 留 NULL。

### 3.2 leap_sandbox_models（36跃迁模型·手册直录）
- **严格按 `docs/实验室二_模型手册.md` 第二节 36 模型**逐个入库：
  - model_id='LM-'+学期+序号(如 LM-9A-19) / model_name_zh/en / unlocked_semester(7A~9B) / primary_line(主线id) / category_id / tier_level / canonical_state_count(变形数) / kp_dependencies(手册所列考点→KP-0xx，白名单校验) / clique_id(可查core白名单) / model_brief_zh/en / viewbox_spec_json / carrier_morphing_json / parameter_morphing_json / posture_morphing_json / camouflage_xray_json (+content_status)
  - 四维变式 json(carrier/parameter/posture/camouflage) 按手册对应模型的四维描述填(手册有的直录，细节配置可占位)。
- **旗舰模型**：每主线选其代表模型作旗舰，回填 logic_lines.flagship_model_id。

---

## 3b. 步骤③ · 107 考点双语 SVG（assets/concepts/）

- **产出**：每个考点 KP-0xx 生成 `zh` / `en` 两版示意图，路径严格匹配 core.db 已占位的 `assets/concepts/KP-0xx-zh.svg` 与 `-en.svg`（共 107×2=214 文件）。
- **内容**：该考点的核心几何/函数/数轴示意图（如 KP-057 勾股定理→直角三角形+三个正方形；KP-002 数轴→数轴示意）。中英两版仅图内**文字标注**语言不同，图形一致。
- **🚨 合规硬规则（机器校验，任一不过即回炉重生成，脏 SVG 不写入）**：
  1. **不含 `<foreignObject>`**（属性 P20，WebKit 避坑）
  2. 含合法 `viewBox` 与 `preserveAspectRatio`
  3. 数学符号/文字**矢量路径化或纯 SVG 文本**，不依赖外部字体/外链
  4. 无 `<script>`、无事件属性(onload等)、无外部 url 引用
  5. zh/en 两版齐全，文件名与 core.db 路径完全一致
- **正确性**：机器只保证"合规"，**"图是否正确表达该考点"由人工教研抽检**（Kiro/用户按批抽检），不合格定点回炉。
- **占位说明**：SVG 是可交付的真实资产（非占位），本次要真产出 214 个合规文件；但**图形质量**允许后续按抽检迭代（先保证合规+能显示，正确性抽检后优化）。

## 4. 自检（交付前，对应验收闸A）

```bash
# 母题数量
sqlite3 -noheader data/master.db "SELECT example_type, COUNT(*) FROM master_examples GROUP BY example_type;"  # point_master=107, line_master=12
# dim3 恒非空
sqlite3 -noheader data/master.db "SELECT COUNT(*) FROM master_examples WHERE dim3_rigor IS NULL OR dim3_rigor='';"  # =0
# 母题不混入questions(跨库)
sqlite3 -noheader data/questions.db "SELECT COUNT(*) FROM questions WHERE question_id LIKE 'ME-%';"  # =0
# 沙盒模型=36
sqlite3 -noheader data/sandbox.db "SELECT COUNT(*) FROM leap_sandbox_models;"  # =36
# 跃迁模型kp_dependencies在白名单(逐一校验KP-0xx存在于core.knowledge_points)
# 外键:主线flagship_model_id/ me都指得上
```
- [ ] 母题 point_master=107 / line_master=12；dim3 全非空；ME-不混入questions
- [ ] 概念沙盒选点数记录；engine_type 合法枚举
- [ ] 跃迁模型=36，逐个对应手册；kp_dependencies 全在 core 白名单
- [ ] core.db 外键回填：knowledge_points.master_example_id/sandbox_id、logic_lines.master_example_id/flagship_model_id 无悬空
- [ ] 两库 content_status 列存在
- [ ] **SVG：assets/concepts/ 下 214 个文件齐全**（107考点×zh/en），文件名与 core.db 路径一致
- [ ] **SVG 合规**：无 foreignObject/script、含 viewBox、矢量化（构造违规SVG验证被拒）

```bash
# SVG 数量
ls assets/concepts/*.svg | wc -l   # =214
# 合规抽查：不得含 foreignObject
grep -l "foreignObject" assets/concepts/*.svg | wc -l   # =0
# 路径一致性：core.db 每个 svg_asset 路径对应文件存在
```

---

## 5. 交付（放入工作区供 Kiro 独立实测）
- `data/master.db`（119母题骨架）
- `data/sandbox.db`（概念沙盒 + 36跃迁模型）
- 回填后的 `data/core.db`（母题/沙盒外键）
- **`assets/concepts/`（214 个考点双语 SVG）**
- 放好通知：步骤3+4+③(SVG) 就绪待验收闸A。

> 注：dim1/2/4 四维精讲内容、沙盒声明式配置细节、主线精讲等**属阶段二回填**，本次占位即可，不要为凑内容编造低质文本。
