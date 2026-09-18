# 执行指令书 · 阶段二 内容回填（四段精讲 + 主线精讲 + 母题四维）
# Execution Guide for Antigravity — Stage 2 (Content Backfill)

> 给执行方（默认 gemini-flash-3.8）。这是**内容为王**的核心环节，量大，适合整夜批量跑。
> 权威依据：`requirements.md`(§1.4内容为王 / §5质量 / §6主线f / §8两阶段) `design.md`(§5) `tasks.md`(步骤6)。
> **前置**：阶段一骨架已全部就绪（core107考点+12主线 / master119母题 / sandbox46+36 / questions76）。本次只 UPDATE 占位内容字段，不改结构。

---

## 0. 本次目标（把占位 `__PENDING_CONTENT__` 换成名师级内容，打 content_status='done'）

| 任务 | 对象 | 字段 | 量 |
| :--- | :--- | :--- | :--- |
| 6.2 考点四段精讲 | core.db knowledge_points 107考点 | origin_story / intuitive_essence / formal_definition / intrinsic_variation（各 zh+en） | 107×4×2 |
| 6.3 主线四段精讲 | core.db logic_lines 12主线 | origin_foundation / spiral_leaps / methodology / exam_matrix（各 zh+en） | 12×4×2 |
| 6.4 母题四维 | master.db master_examples 119母题 | dim1_origin / dim2_essence / dim4_traps（dim3已填不动） | 119×3 |

- 回填后该行 `content_status='done'`。可断点续跑：只处理 `content_status='pending'` 的行。

---

## 1. 🚨 铁律（内容为王 + 守底线）

1. **What/Why/How/Model 认知阶梯**（学科通用，四段/四维都遵循）：
   | 考点四段 | 主线四段 | 母题四维 | 认知层 | 讲什么 |
   | :--- | :--- | :--- | :--- | :--- |
   | intuitive_essence | (主线本质,融入origin) | dim2_essence | **What 是什么** | 直观本质、几何不变量 |
   | origin_story | origin_foundation | dim1_origin | **Why 为何** | 原点由来、为何而生、题眼 |
   | formal_definition | methodology | dim3_rigor(已填) | **How 怎么用** | 严格定义/方法论/生死红线 |
   | intrinsic_variation | exam_matrix + spiral_leaps | dim4_traps | **Model 变式建模** | 变式/迁移/考法/致命陷阱 |
2. **教思维原理，不教套路**：Why 讲原理由来（不是背结论）、Model 讲可迁移的思想（不是刷题模板）。这是本系统的灵魂。
3. **禁止模板化/套壳**（吸取 hint 教训）：每个考点/主线/母题的内容必须**针对它自己**，不得套"融合X与Y""对于任意…"这类通用模板；同段内容跨考点重复率必须低。
4. **自适应深度（不过严）**：大考点（几何/函数/圆等）四段做满、有深度；基础/离散考点（科学记数法、同类项等）允许某些段简短，**How 恒必填**，**Model 段允许薄或点到即止**——验证不得因"内容浅"判失败，只拦真错。
5. **公式过数学门神**：所有 LaTeX 必须经 `sanitize_and_verify_math()` 清洗，脏公式绝不入库（复用已验证实现）。
6. **双语**：zh 为主用心写；en 为对应翻译（术语标准、公式不译）。
7. **只 UPDATE 内容字段**，不动结构/ID/外键/dim3。

---

## 2. 质量方案（生成端争取 + 验证端守底线）

### 2.1 生成端（Prompt 是主杠杆）
- 角色设定：资深中考数学名师/命题专家。
- 结构强制：按 What/Why/How/Model 各段的定义写，每段聚焦该认知层。
- **好坏对照**：prompt 内给"名师级 vs 平庸"样例各一，让模型对齐上限。
- 硬约束：讲原理不堆结论；针对具体考点不套模板；控制长度（每段 80~200 字，精炼不注水）。

### 2.2 验证端（守门员，不评优，自适应）
- 规则层：字段非空、无 `__PENDING__`、无偷懒词（"综上""略""同理可得"滥用）、引用考点/公式在字典内、公式过门神。
- LLM-judge（可用另一模型自评）：只拦 4 类坏——①空洞堆结论 ②幻觉/数学错 ③公式错 ④该讲原理处偷懒。低于阈值回炉。
- **自适应**：大考点查四段深度；基础考点不强求 Model 深度；**内容浅不判失败**。
- 回炉上限 3，超限跳过并记录（不阻塞整批，留人工/复跑）。

---

## 3. 分批建议（整夜跑，可断点续传）

- 批次按 content_status='pending' 取，每批 N 条（如 20），跑完置 done，中断可续。
- 建议顺序：先 6.2 考点四段（量最大、最重要）→ 6.4 母题四维 → 6.3 主线四段（依赖考点四段向上归纳，见 §6 f，放最后）。
- 主线四段（6.3）：输入 = 该主线所辖考点 + 这些考点的四段精讲，**向上归纳**为主线级（Why螺旋地基/How通用方法论/Model考法矩阵）。

---

## 4. 自检（交付前，对应验收闸B）

```bash
# 无占位残留
sqlite3 -noheader data/core.db "SELECT COUNT(*) FROM knowledge_points WHERE origin_story_zh LIKE '%PENDING%' OR intuitive_essence_zh LIKE '%PENDING%' OR formal_definition_zh LIKE '%PENDING%' OR intrinsic_variation_zh LIKE '%PENDING%';"  # =0
sqlite3 -noheader data/core.db "SELECT COUNT(*) FROM logic_lines WHERE origin_foundation_zh LIKE '%PENDING%';"  # =0
sqlite3 -noheader data/master.db "SELECT COUNT(*) FROM master_examples WHERE dim1_origin LIKE '%PENDING%' OR dim2_essence LIKE '%PENDING%' OR dim4_traps LIKE '%PENDING%';"  # =0
# content_status 全 done
sqlite3 -noheader data/core.db "SELECT content_status,COUNT(*) FROM knowledge_points GROUP BY content_status;"  # 应全 done(若考点表有此列)
sqlite3 -noheader data/master.db "SELECT content_status,COUNT(*) FROM master_examples GROUP BY content_status;"  # done
# 跨考点重复率抽查(去重唯一率应高,防模板化)
```
- [ ] 四段精讲 107 考点无 `__PENDING__`；主线 12 无；母题 dim1/2/4 无
- [ ] content_status 相关表全 done
- [ ] 公式合规（门神抽查 + 构造脏公式被拒）
- [ ] **抽样人读**：随机 15 条,Why 讲了原理不是堆结论、Model 有迁移不是套模板、无跨考点雷同
- [ ] 数学无幻觉/错误（抽样核对）

---

## 5. ⚠️ 数据安全（吸取 mockSeed 事故教训）
- **绝不跑会 seed data/ 的脚本**；mockSeed 已隔离到 tmp/test-data，但**回填期间不要跑 pnpm test**，避免任何意外覆盖。
- 回填**只 UPDATE**，不 DELETE/不重建表。
- 建议：回填前把 data/*.db 复制一份备份（如 data/backup_预回填/），出问题可回滚。

---

## 6. 交付（放入工作区供 Kiro 独立实测）
- 回填后的 `data/core.db`（考点四段 + 主线四段）
- 回填后的 `data/master.db`（母题四维 dim1/2/4）
- 回填报告（各任务完成数 / 回炉数 / 跳过数 / 自评抽样）
- 放好通知：阶段二回填就绪待验收闸B。

> 验收方（Kiro）明早独立实测：无占位残留 + content_status全done + 门神 + **抽样内容质量(重点查:是否套模板/堆结论/幻觉，参照 hint 翻车教训)**。
