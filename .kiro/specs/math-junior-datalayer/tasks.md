# 任务清单：通用理科基础数据层（math-junior-datalayer）

> **流程（D21，两阶段）**：阶段一"骨架入库(能占位就占位)" → 阶段二"大模型回填加工(打已加工标签)"。
> **执行方** 默认 gemini-flash-3.8；**验收方** 默认 claude opus 4.6（模型可切换，见 §D11）。
> **执行-验收循环**：执行 → 独立实测验收 → 通过放行 / 不通过打回；回炉上限 3，超限熔断抛用户。
> **已加工标签（D22）**：各内容表 `content_status`(pending/processing/done)；阶段二只处理 pending，可断点续跑。
> **停靠点**：真题采集(步骤5)前有输入停靠点(用户投喂 docx/文件夹)。

---

# 阶段一 · 骨架入库（能占位就占位）

## 步骤 1-2 · core.db 考点/主线骨架 ✅ 已完成（段1 闸1 通过·批次#1）

- [x] 1.1 修正 enumerate.py 三 bug（边去重493 / 组合ID基数内编号 / Step4回填）
- [x] 1.2 StepE 结构补全（grade+semester拆分 / ID格式 / edges定向 / is_milestone / module_name）
- [x] 1.3 StepC 有向验证真跑（is_valid剔除 / directed_order / question_hint / question_types）
- [x] 1.4 StepD 主线归纳（f定稿·族A / 12主线 / primary_line_id单归属）
- [x] 1.5 name_en 双语补全
- [x] 1.6 组装通用 JSON（五段）
- [x] 1.7 入库 core.db 结构层 + 内容层占位（content_status=pending）

> 产出：`data/core.db`（考点/主线/组合/拓扑结构层）+ `data/初中数学_基础数据_v2.json`。闸1 已 ✅。

## 步骤 3 · 母题骨架 → master.db（占位）

- [ ] 3.1 母题生成（大模型，独立于真题）
  - 考点母题 |X|（point_master 标杆题，每考点1道）+ 主线母题 |Y|（line_master 压轴题，每主线1道）= 数学 107+12=119。
  - 骨架入库：stem/options/answer 等题面先生成；四维解剖 dim1~4 **占位**（阶段二填）；`content_status=pending`。
  - 物理隔离：入 master.db，绝不混 questions；ID `ME-KP0xx`/`ME-LINE-xx`。
  - [产出] `data/master.db`（母题骨架 + 占位）
  - [依赖] 步骤1-2（用考点/主线）

## 步骤 4 · 沙盒模型表 → sandbox.db（占位）

- [ ] 4.1 实验室二手册结构化入库（数学：手册直录，非大模型生成）
  - 概念沙盒选点（约40-50考点，几何/函数/数轴优先）→ concept_sandboxes 骨架。
  - 12主线×N 跃迁模型（合计36，来自实验室二手册）→ leap_sandbox_models 骨架 + logic_lines.flagship_model_id 回填。
  - 声明式配置字段（viewbox/drag_points/param_sliders/invariants）**占位**（阶段二填或手册直录）；`content_status=pending`。
  - [产出] `data/sandbox.db`（沙盒/模型骨架 + 占位）
  - [依赖] 步骤1-2；实验室二手册

## 步骤 ③ · 107 考点双语 SVG → assets/concepts/

- [ ] ③.1 生成 214 个考点示意 SVG（107考点 × zh/en）
  - 大模型生成 SVG 源码 → 合规校验器（无 foreignObject/script、含 viewBox、矢量化）→ 通过写入 assets/concepts/，文件名匹配 core.db 的 svg_asset 路径。
  - 正确性靠人工教研抽检；不合格定点回炉。
  - [产出] `assets/concepts/KP-0xx-{zh,en}.svg`（214个）
  - [依赖] 步骤1-2（core.db 考点 + 已占位路径）
  - 注：与步骤3/4 同批交 Antigravity（EXECUTION_GUIDE_Stage34.md）。

## 步骤 5 · 真题骨架 → questions.db（占位）· tools/docimport

- [x] 5.0 建 tools/docimport + inspect_source 源体检（已建，实测 PASS月考卷/REJECT成都卷/PDF判定正确）
- [x] 5.3 首批真题入库（76题，闸2通过；含content_status列）
- [ ] 5.1 extract：Pandoc 抽取（docx→markdown+图片原位锚定）
- [ ] 5.2 segment：切题（题号/大题块/子题合并；教师版【答案】【分析】【详解】归位）
- [ ] 5.3 【输入停靠点】用户投喂 docx/文件夹 → 骨架入库
  - 题面(stem_zh/options/answer)入库；考点标注/combination_id/双语/算分/rubric **占位**；`content_status=pending`。
  - 图片存 `assets/questions/`，image_paths_json 对齐。
  - [产出] `data/questions.db`（真题骨架 + 占位）+ 导入报告
  - [依赖] 5.1, 5.2

### 〔阶段一 交付物 · 验收闸A〕
- `data/core.db`（✅）+ `data/master.db` + `data/sandbox.db` + `data/questions.db`，均骨架入库、内容层占位、content_status=pending。
- 实测：四库可建、外键不悬空、ID规范、占位合规、母题不混入questions、真题源均为体检PASS的docx。

---

# 阶段二 · 大模型回填加工（打已加工标签）

> 回填器统一：`SELECT ... WHERE content_status='pending'` → 大模型填 → 过门神 → `content_status='done'`。可断点续跑。质量遵循 §5（生成端prompt + 验证端守底线 + 不过严）。

## 步骤 6 · 回填加工

- [ ] 6.1 回填器框架（取pending→填→门神→置done，断点续跑，回炉/熔断）
  - [产出] 回填工具（tools 下）+ content_status 状态机
- [ ] 6.2 core.db 考点四段精讲（What/Why/How/Model；How恒必填，Model不强求）
- [ ] 6.3 core.db 主线四段精讲（考点四段向上归纳，f 范式族维度）
- [ ] 6.4 master.db 母题四维解剖（dim1~4；dim3恒必填；大考点≥3维）
- [ ] 6.5 sandbox.db 沙盒配置文本（inquiry_guide/model_brief 等；数学适配JSXGraph字段）
- [ ] 6.6 questions.db 真题回填（考点标注→combination匹配白名单 / 双语 / L1-L9算分 / rubric）
  - combination_id 查 core.db 白名单，越界标记；L1-L9 金标校准（±1级内≥80%）。

### 〔阶段二 交付物 · 验收闸B〕
- 四库 `content_status='done'` 无 pending 残留；无 `__PENDING__` 占位残留。
- 门神：抽查公式合规 + 构造脏公式被拒。
- 内容质量：LLM-judge 抽检无4类坏；dim3/How恒非空；基础考点层浅不误判。
- 母题物理隔离；empirical_scoring_rate 标注估算；真题 L1-L9 金标≥80%。

---

## 收尾

- [ ] 7.1 全库一致性总检 + 通用性判据（design §9）；结论写 ACCEPTANCE_LOG。
  - 完成判据：四库 content_status 全 done、无占位残留、交叉引用完整。

---

## 未来可选扩展点（本期不实现，留接口）
- WMF碎片docx / 扫描PDF 真题源 → 多模态识别管线（另议）。
- 自然地理→族A；小学科学→族B。文科→另立 skill。
