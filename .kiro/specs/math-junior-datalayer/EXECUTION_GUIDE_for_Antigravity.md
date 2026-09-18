# 执行指令书 · 通用理科基础数据层 — 段1（① skill-genbasicinfo）
# Execution Guide for Antigravity — Stage 1

> 本文件是给执行方（Antigravity / 默认 gemini-flash-3.8）的段1操作说明。请读完再动手。
> 权威依据：同目录 `requirements.md` / `design.md` / `tasks.md`。冲突时以 `design.md` 为准。
> 段1 只做 ① 基础字典（core.db 结构层）。②③④ 待段1 验收通过后另发指令。

---

## 0. 角色与节奏

- **你（执行方）**：按 `tasks.md` 段1 任务卡（1.1~1.7）实现，一次一个，做完自检再下一个。
- **第1层质检（Antigravity 内 opus）**：每任务按 rubric 快速质检，不达标当场打回，回炉上限 3 次。
- **第2层门禁验收（Kiro，独立）**：段1 全部做完，你把产物放入工作区，Kiro **独立跑 SQL/查文件实测**，记 ACCEPTANCE_LOG，通过才放行段2。
- **人类主管**：关键决策点介入。

工作节奏：挑一个依赖已满足的未完成任务 → 只做它，按 `[产出文件]` 落文件 → 自检 → 勾 `[x]` → 下一个。

---

## 1. 🚨 段1 铁律（违反即退回）

1. **107 考点内容冻结。** 哪107个、name_zh、domain、subcategory **不许改**。只可改 ID 格式与新增字段。
2. **ID 统一 `KP-0xx`**（3位补零，带连字符）。组合 `C{基数}-{基数内序号:04d}`。
3. **edges 必须去重**，`meta.total_edges` = 493（不是 498）。498 是含重复边的错误值。
4. **组合 ID 基数内从 0001 连续编号**，禁止跨基数全局递增，禁止空洞。
5. **Step4 必须真跑**：每个 size≥2 组合都要 LLM 判 `is_valid`+`directed_order`+`question_hint_zh/en`+`question_types`。禁止留 null/空。
6. **`is_valid=false` 组合剔除**，不入库；**不产 `is_question_valid` 字段**；剔除后重编号。
7. **主线归纳按 f（requirements §6）**：数学=族A，按 domain 归档→公理/结构/变换/度量/数据 维度分支→主线 + 每考点单归属 primary_line_id。全自动，不留待人工。
8. **内容层字段填合规占位**（`__PENDING_CONTENT__` / svg 约定路径 / `__PENDING__` / NULL），不许编造四段精讲内容（那是④的事）。
9. **产出必须能被 SQL 独立实测**：core.db 可建表、可查询、外键不悬空。

---

## 2. 环境

```bash
# 已有：Python3、sqlite3；skill 现有脚本在 skills/skill-genbasicinfo/scripts/enumerate.py
# 现有数据：data/初中数学_知识点组合.json（107考点/2205组合/498边，含待修bug）
# 权威建表：scripts/build/db/schema.sql（前端契约 DDL，core.db 四表以此为准）
```
- 输入根 = 现有 107 考点（从 `data/初中数学_知识点组合.json` 取，内容冻结）。
- 建 core.db 用 `scripts/build/db/schema.sql` 的四表 DDL（knowledge_points/logic_lines/knowledge_combinations/knowledge_graph_semesters）。

---

## 3. 段1 任务导航（对应 tasks.md 1.1~1.7）

| 顺序 | 任务 | 用 LLM? | 关键点 |
| :--- | :--- | :-: | :--- |
| 1.1 | 修 enumerate.py 3 bug | ❌ | 边去重/组合ID基数内编号/Step4回填链 |
| 1.2 | StepE 结构补全 | ❌ | grade拆分/ID格式/edges定向/is_milestone/module_name |
| 1.3 | StepC 有向验证 | ✅ | 全量 size≥2 组合真跑，剔除 false 重编号 |
| 1.4 | StepD 主线归纳 | ✅ | 族A路由→domain归档→维度分支→primary_line_id |
| 1.5 | name_en 补全 | ✅ | 107 术语标准英译 |
| 1.6 | 组装通用 JSON | ❌ | 五段合并 → `data/初中数学_基础数据_v2.json` |
| 1.7 | 入库 core.db | ❌ | JSON→四表，内容层占位 |

依赖：1.1→1.2；1.1→1.3；1.2→1.4；1.2→1.5；(1.2/1.3/1.4/1.5)→1.6→1.7。

---

## 4. 段1 自检清单（交付前逐条自查，对应闸1 rubric）

```bash
# 边数
sqlite3 data/core.db "SELECT COUNT(*) FROM (SELECT DISTINCT ...)"  # edges 去重=493
# 组合编号连续无空洞、无重复
sqlite3 data/core.db "SELECT combination_id FROM knowledge_combinations ORDER BY combination_id"
# 无 is_question_valid 列
sqlite3 data/core.db "PRAGMA table_info(knowledge_combinations)"
# 考点 ID 格式 / name_en 非空 / grade semester 合法
sqlite3 data/core.db "SELECT COUNT(*) FROM knowledge_points WHERE point_id NOT LIKE 'KP-%' OR name_en='' OR grade NOT IN (7,8,9) OR semester NOT IN (1,2)"  # 应=0
# primary_line_id 全非空且有对应主线
sqlite3 data/core.db "SELECT COUNT(*) FROM knowledge_points kp LEFT JOIN logic_lines ll ON kp.primary_line_id=ll.line_id WHERE ll.line_id IS NULL"  # 应=0
# 拓扑字段
sqlite3 data/core.db "SELECT COUNT(*) FROM knowledge_graph_semesters WHERE predecessors IS NULL OR successors IS NULL"  # 应=0
```
- [ ] 上述 SQL 全部符合预期
- [ ] core.db 内容层字段为占位（不是编造内容）
- [ ] JSON 五段齐全、结构符合 requirements §4

---

## 5. 交付（段1 完成后）

放入工作区，供 Kiro 独立实测：
- `data/初中数学_基础数据_v2.json`
- `data/core.db`（结构层入库 + 内容层占位）

**不要只贴文本**——Kiro 要真跑 SQL 才算验收。放好后通知：段1 就绪待闸1 验收。
