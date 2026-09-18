# 执行指令书 · 段2（② skill-gendb · 真题库）
# Execution Guide for Antigravity — Stage 2

> 给执行方（默认 gemini-flash-3.8）的段2 操作说明。读完再动手。
> 权威依据：`requirements.md`（需求2/7）、`design.md`（§3）、`tasks.md`（段2）、`skills/skill-gendb/SKILL.md`。冲突以 `design.md` 为准。
> **前置**：段1 闸1 已通过，`data/core.db` 结构层（含 2204 组合白名单）已就绪，段2 依赖它查表。

---

## 0. 段2 目标

采集中考真题 → 图文分离 → 多模态打标 → 查表匹配 combination_id → L1-L9 算分 → **直出前端扁平 schema** 入库 `data/questions.db`。

---

## 1. 🚨 段2 铁律（违反即退回）

1. **真题来源必须由用户投喂，禁止自行搜索/臆测。** 每批采集前进入【输入停靠点】，等用户给网址/文件（可多个），收到才采。
2. **直出前端扁平 schema，禁止打包 JSON 大字段。** 入库 `questions` 表为扁平列（见 §3），不得沿用旧 SKILL 的 content/options/answer 打包结构。
3. **枚举/格式对齐前端契约**：
   - `question_type` ∈ `{single_choice, fill_blank, solution}`（**禁用**中文"选择题/填空题/解答题"）
   - `difficulty_level` = 整数 **1~9**（**禁用** "L1" 字符串）
   - 考点 ID 用 `KP-0xx`；`combination_id` 用 `C{基数}-{序号}` 连字符格式
4. **combination_id 必须查段1 白名单。** 取主解法考点 `sorted(kp_ids)` → 在 `data/core.db` 的 `knowledge_combinations` 查表；**查不到 = 知识点越界 = 丢弃**（不硬塞、不新造组合）。
5. **母题物理隔离**：questions 表**绝不含母题**（母题在段4 的 master.db）。question_id 用 `Q-` 前缀，绝不出现 `ME-`。
6. **公式过门神**：题干/答案/解析的 LaTeX 必须经数学门神清洗（复用前端 `sanitize_and_verify_math()`），脏公式不入库。
7. **图文对齐**：Pandoc `--extract-media` 原位锚定；"如图"关键词数 vs 图片数差值 > 2 的题**直接丢弃**（不降级）。
8. **无效题丢弃**：LLM 判 `is_valid=false`（条件缺失/矛盾/无解）直接丢弃计数。

---

## 2. 环境 / 前置依赖

```bash
brew install pandoc                      # Word→Markdown 图文分离
pip3 install requests mammoth sqlite-utils
```
- 输入：用户投喂的真题来源（.docx 下载链接 / 本地 Word·PDF 路径）。
- 白名单：`data/core.db` 的 `knowledge_combinations`（段1 产，2204 组合）+ `knowledge_points`（107 考点，供 KP 匹配）。
- 建表：`questions.db` 用 `scripts/build/db/schema.sql` 的 `questions` DDL（前端契约）。

---

## 3. questions 扁平 schema（直出目标，对齐 schema.sql）

```
question_id(Q-年份-地区-序号) / source / exam_year / region / exam_type /
grade_level / semester /
primary_point_id(KP-) / combination_id(C, 可空) /
difficulty_level(1~9整数) / question_type(single_choice|fill_blank|solution) / score_default /
stem_zh / stem_en /
options_json(选择题 A~D 双语,其余空) / answer_standard /
rubric_checklist_json(解答题踩分点:stepIndex/descriptionZh/En/points) /
solutions_json / image_paths_json
```

---

## 4. 执行流程（对应 tasks 2.1~2.5）

- **2.1** 改造 skill-gendb 入库节点：产扁平列 + 字段/枚举对齐（§3、铁律2/3）。
- **2.2** combination_id 查表匹配段1 白名单（铁律4）。
- **2.3** Pandoc 图文分离 + 图片资产（铁律7）。
- **2.4【输入停靠点】** 停下等用户投喂真题来源 → 采集 → 多模态打标 → 算分 → 入库。
- **2.5** L1-L9 金标校准（见 §5）。

多模态打标（节点2）：有效性验证 / 题型识别 / 三段拆分（content/options/answer，选择题选项从题干剥离）/ 多解法 / 认知打分（insight/hidden/calc 各1~5）/ 双语输出（公式不译）。

L1-L9 算分（节点3）：结构广度分（知识点数量档 + scope 跨度）+ 认知深度分（insight×1.5+hidden×1.0+calc×0.5）→ 映射 1~9，整题取子题 MAX。

---

## 5. L1-L9 金标校准（需求7 · 闸2 硬项）

- 抽 30~50 道真题，人工标定"金标难度"（1~9）。
- 与双引擎算分对比：落在金标 **±1 级内的比例 ≥ 80%**（阈值可与验收方商定）。
- 不达标 → 调权重（广度分档 / 认知系数）后复校，附校准报告。

---

## 6. 自检清单（交付前，对应闸2 rubric）

```bash
DB=data/questions.db
sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM questions WHERE question_type NOT IN ('single_choice','fill_blank','solution');"  # =0
sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM questions WHERE difficulty_level NOT BETWEEN 1 AND 9;"  # =0
sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM questions WHERE primary_point_id NOT LIKE 'KP-%';"  # =0
sqlite3 -noheader "$DB" "SELECT COUNT(*) FROM questions WHERE question_id LIKE 'ME-%';"  # =0 (无母题混入)
# combination_id 均在白名单(需跨库比对 core.db)
```
- [ ] question_type / difficulty_level / ID 格式全对齐
- [ ] combination_id 全部在 core.db 白名单内；越界题已丢弃计数
- [ ] 无 ME- 母题混入
- [ ] 图文对齐抽检通过；image_paths_json 正确
- [ ] L1-L9 金标校准 ±1级内 ≥80%（附报告）
- [ ] 运行报告：处理总数/入库/无效丢弃/越界丢弃/成功率

---

## 7. 交付（段2 完成后）

放入工作区供 Kiro 独立实测：
- `data/questions.db`（扁平 schema，真题已入库）
- 采集运行报告 + L1-L9 金标校准报告

**不要只贴文本**——Kiro 要真跑 SQL + 跨库比对白名单 + 抽查图文对齐。放好后通知：段2 就绪待闸2 验收。
