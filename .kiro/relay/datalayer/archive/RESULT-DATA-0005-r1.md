---
id: RESULT-DATA-0005
task_id: TASK-DATA-0005
line: datalayer
status: completed
model: default (Flash)
concurrency: 5
timestamp: 2026-09-19T20:58:00+08:00
---

# RESULT-DATA-0005: 全库 markdown 残留清洗报告

## 1. 任务概述与执行架构
针对 `data/questions.db` 中由 Pandoc 从 docx 抽取遗留的大量 markdown 标记（`*斜体*`、`^上标^`、`~下标~`、行首 `>` 引用符、卷子区块头、多重标点等），严格执行确定性脚本清洗。

### 核心安全与架构规范
1. **写库前全量冷备份**：`data/questions.db.bak_before_task0005` (6,332,416 bytes)。
2. **五片并发只读处理**：
   - 将全库 2064 道题目按 `question_id` 五等分输出为 `tmp/mdclean/part1_input.json` ~ `part5_input.json`。
   - 调用 5 个 Flash 子 Agent 独立执行 `clean_shard.py`，分别输出 `tmp/mdclean/part1.jsonl` ~ `part5.jsonl`。
3. **单进程串行写库与同步**：
   - 主进程执行 `merge_and_write_mdclean.py`，全量更新 `data/questions.db`，并同步分发至 `public/data/questions.db`、`dist/data/questions.db` 及 `tmp/test-data/questions.db`。
4. **公式零改动铁律**：
   - 提取原文中已有 `$ ... $`、`$$ ... $$`、`\[ ... \]`、`\( ... \)` 严格分段，公式段 **100% 保持原样**，仅对非公式纯文本段应用确定性转换。
   - 全库 2064 题原公式严格子序列不变性校验（Invariance Check）：**0 差异（0 mismatches）**。
5. **数学门神校验与安全回退**：
   - 转换后的每个字段经由 `sanitize_and_verify_math()` 进行 KaTeX 合法性校验。
   - 对原库中已存在偶数单 `$` 破损或非闭合的异常文本触发安全回退（Safe Fallback），保留原样，绝不硬转损坏题目。

---

## 2. 转换数据与指标统计

### 全库标记转换统计
| 标记形态 | 转换前统计 | 转换处理/清洗数 | 说明 |
|---|---|---|---|
| `*斜体*` / 数学变量 | 61,825 | 80,125 次转换 | 字母/变量转为 `$var$`，中文加粗剥离星号 |
| `^上标^` (如 `^2^`, `^n^`) | 2,442 | 3,628 次转换 | 转换为 `$var^2$` / `$(expr)^2$` 等 |
| `~下标~` (如 `~1~`, `~n~`) | 2,390 | 2,818 次转换 | 转换为 `$var_1$` / `$S_{\triangle ABC}$` 等 |
| 行首 `>` 引用符 | 42,023 | 47,978 处清除 | 剥离 Markdown 引用符，恢复规范换行 |
| 卷子区块头 / 答案尾表 | 184 | 356 处清除 | 剔除混入题干/解答末尾的“三、解答题…”等卷头及答案解析总表 |
| 多重句号 / 省略号 | 36 | 38 处规范化 | `....` → `……`，`。。。。` → `。` |
| 安全回退 (Fallback) | - | 261 题次 | 原始数据库中已存残缺 `\$` 等引发门神拦截，安全保留原样 |

---

## 3. 典型样本前后对比 (Spot-Check Samples)

### 样本 1: 几何点与变量清洗 (`Q-2026-51619-0009`)
- **BEFORE**:
  ```markdown
  如图，在$\text{Rt} \bigtriangleup ABC$中，$\angle ACB = 90{^\circ}$，$AC = BC$，点*D*为$AB$边上的中点，点*E*在线段$BD$上（点*E*不与点*B*，点*D*重合），过点*A*作$AF\bot CE$交$CE$于点*F*，过点*B*作$BG\bot CE$交$CE$的延长线于点*G*．若已知$DF$的长，则可求出（   ）
  ```
- **AFTER**:
  ```markdown
  如图，在$\text{Rt} \bigtriangleup ABC$中，$\angle ACB = 90{^\circ}$，$AC = BC$，点$D$为$AB$边上的中点，点$E$在线段$BD$上（点$E$不与点$B$，点$D$重合），过点$A$作$AF\bot CE$交$CE$于点$F$，过点$B$作$BG\bot CE$交$CE$的延长线于点$G$．若已知$DF$的长，则可求出（   ）
  ```
- **说明**: 原有公式零改动，裸露星号变量 `*D*`, `*E*`, `*F*`, `*G*` 规范转为 LaTeX 公式。

### 样本 2: 菱形几何与卷子区块头剥离 (`Q-2025-LN-0015`)
- **BEFORE**:
  ```markdown
  如图，在菱形*ABCD*中，对角线*AC*与*BD*相交于点*O*，*AC*＝8，*BD*＝12，点*E*在线段*OA*上，*AE*＝2，点*F*在线段*OC*上，*OF*＝1，连接*BE*，点*G*为*BE*的中点，连接*FG*，则*FG*的长为[　
  　]{.underline} ．

  > [[IMG:0]]

  **三、解答题（本题共8小题，共75分.解答应写出文字说明、演算步骤或推理过程）**
  ```
- **AFTER**:
  ```markdown
  如图，在菱形$ABCD$中，对角线$AC$与$BD$相交于点$O$，$AC$＝8，$BD$＝12，点$E$在线段$OA$上，$AE$＝2，点$F$在线段$OC$上，$OF$＝1，连接$BE$，点$G$为$BE$的中点，连接$FG$，则$FG$的长为[　
  　]{.underline} ．
  [[IMG:0]]
  ```
- **说明**: 几何多字母与长度等式正确转为 LaTeX；行首 `>` 清理；末尾混入的试卷分大题说明行彻底剥离。

### 样本 3: 圆与几何符号规范 (`Q-2025-MZ43-0006`)
- **BEFORE**:
  ```markdown
  如图，*BC*为☉*O*的弦，点*A*为劣弧$\overset{⏜}{BC}$的中点，*D*为*BC*上一点，连接*AD*，过点*A*作☉*O*的切线*AE*，连接*CE*，*CE*∥*AD*，点*F*为*AE*上一点，*AF*＝*BD*，连接*AB*，*AC*，*CF*.
  （1）求证：四边形*ADCE*是平行四边形；
  （2）当*BD*＝*EF*＝$\frac{1}{2}$*AB*时，求证：*AC*＝$\sqrt{2}$*AD*.
  ```
- **AFTER**:
  ```markdown
  如图，$BC$为$\odot O$的弦，点$A$为劣弧$\overset{⏜}{BC}$的中点，$D$为$BC$上一点，连接$AD$，过点$A$作$\odot O$的切线$AE$，连接$CE$，$CE$∥$AD$，点$F$为$AE$上一点，$AF$＝$BD$，连接$AB$，$AC$，$CF$.
  （1）求证：四边形$ADCE$是平行四边形；
  （2）当$BD$＝$EF$＝$\frac{1}{2}$ $AB$时，求证：$AC$＝$\sqrt{2}$ $AD$.
  ```
- **说明**: 符号 `☉*O*` 替换为标准 KaTeX `$\odot O$`，原有复杂公式 `$\overset{⏜}{BC}$` 与 `$\frac{1}{2}$` 保持原状。

---

## 4. 验收清单符合性自查

- [x] **备份存在**：`data/questions.db.bak_before_task0005` 完整保存。
- [x] **markdown 残留大幅清除**：裸露星号变量、上下标、引用符、卷头清洗干净。
- [x] **原公式零改动**：2064 道题跨 5 个字段（`stem_zh`, `solutions_json`, `answer_standard`, `options_json`, `stem_en`）公式不变性校验 100% 通过（0 错漏）。
- [x] **门神校验保障**：所有新转出公式均通过 `sanitize_and_verify_math`；不合规内容触发 safe fallback 保留原文。
- [x] **中文正文不丢字**：除明确去除的试卷头及引用标点外，中文核心题干字句 100% 完整保留。
- [x] **题目总数与结构不变**：2064 题无增删、零 DELETE。
- [x] **系统测试通过**：前端与引擎 38 个测试文件（共 199 个测试）全数 PASS。
- [x] **过程资产完整保留**：
  - `tmp/mdclean/part1.jsonl` ~ `part5.jsonl`
  - `scripts/build/md_cleaner.py`
  - `scripts/build/shard_questions.py`
  - `scripts/build/clean_shard.py`
  - `scripts/build/merge_and_write_mdclean.py`
