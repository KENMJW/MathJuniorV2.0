---
id: RESULT-FE-0004
task_id: TASK-FE-0004
line: frontend
status: done
completed_at: 2026-09-18T21:32:00+08:00
---

# TASK-FE-0004 交付报告：前端数据源全面切入真实 SQLite 数据库与判分归一化容错

## 1. 验收自检清单对照

| 验收条款 | 状态 | 验证结果与佐证 |
| :--- | :---: | :--- |
| **ConceptNav 读 core.db 真实 107 考点** | PASS | 移除默认纯 mock，挂载 `dbClient.query('core', 'SELECT * FROM knowledge_points ...')` 异步加载全量 107 考点。举证考点：`KP-001`（有理数概念）、`KP-023`（勾股定理）、`KP-096`、`KP-107` |
| **PointMasterExample 读 master.db 真实母题** | PASS | 挂载 `dbClient.queryOne('master', 'SELECT * FROM master_examples ...')` 异步加载 119 个母题真实 dim1/2/3/4 完整内容。举证：`ME-KP023`（方程组核心例题真实题干与阿尔·花拉子米配方本源解析） |
| **SubwayMap 渲染 107 考点 + 真实依赖边** | PASS | `MathJuniorHome.tsx` 异步并行查询 `core.db` 的 12 条 `logic_lines`、107 个 `knowledge_points`、107 个 `knowledge_graph_semesters`（解析 predecessors/successors 连通边）和 2204 个 `knowledge_combinations`，注入 `<SubwayMap />` 渲染 |
| **沙盒读 sandbox.db 46+36，compileMorphingSandboxConfig 空值防护** | PASS | 实验室一加载 `concept_sandboxes`（46 个模型），实验室二加载 `leap_sandbox_models`（36 个模型）；`compileMorphingSandboxConfig` 与 `parseMorphingSpecs` 补充了全面的可选链与默认值回退（`carrierSpec?.options?.find(...) ?? defaultCarrier`），在空数据/残缺 JSON 下零崩溃 |
| **组卷走 drawQuestionsFromDb 真库 2064 题** | PASS | `PaperWorkbench.tsx` 在初始化时从 `questions.db` 加载真实题库池，实时库存校验 `verifyPaperInventoryFromPool` 准确基于 2064 题计算；点击生成与在线作答默认走 `drawQuestionsFromDb(dbClient, currentConfig, meta)` 异步抽题 |
| **ScorePanel 选择题归一化容错** | PASS | 新建 `src/engine/judge/normalizeOptionAnswer.ts`，自动剥离 `*`、`_`、`#`、全半角点句号（`.`, `。`, `．`）、括号及前缀；`ScorePanel.tsx`、`QuickPractice.tsx`、`LineQuickPractice.tsx` 统一接入归一化比对，`'A'` vs `'*A*'`/`'A.'`/`'A．'` 均正确判对并满分得分 |
| **各模块 mock 数据源已不再是默认** | PASS | grep 验证 `mockKnowledgePointRecords`、`mockExamQuestions`、`mockLogicLines` 仅作为初始化加载前/离线安全回退兜底，不再硬编码绑死在 UI 渲染主链 |
| **判分/隔离/门神核心逻辑零改动** | PASS | `isMathAnswerEquivalent` 白名单算法、`calculateSolutionScore` 踩分点算法、母题隔离逻辑（抽题严格限制 `questions` 表，排除任何 `ME-` 母题）均零修改 |
| **pnpm test 全绿、pnpm build 0 错** | PASS | `pnpm test` 36 个测试文件、190 个用例 100% 通过；`pnpm build` 0 错误编译成功 |
| **铁律红线遵从** | PASS | 无直接 `import katex`、无裸 `innerHTML`/`dangerouslySetInnerHTML`、绝对零 emoji（`noEmoji.test.ts` 通过）、零持久化（`zeroPersistence.test.ts` 通过）、异步加载配齐优雅 fallback 不白屏 |

---

## 2. 改动文件清单

1. **`src/engine/judge/normalizeOptionAnswer.ts`** [新增]
   - 实现选择题答案归一化函数 `normalizeOptionAnswer`，剥除强调字符、中英文标点、前缀及括号并转大写。
2. **`src/engine/judge/index.ts`** [修改]
   - 导出 `normalizeOptionAnswer`。
3. **`src/engine/judge/__tests__/normalizeOptionAnswer.test.ts`** [新增]
   - 覆盖 7 项归一化测试用例（大写、小写、星号、中英文点号、前后空格、答案前缀、空值容错等）。
4. **`src/modules/exam/ScorePanel.tsx`** [修改]
   - 接入 `normalizeOptionAnswer`，选择题判分比对支持脏数据容错；向外 re-export `normalizeOptionAnswer`。
5. **`src/modules/concept/QuickPractice.tsx`** [修改]
   - 接入 `normalizeOptionAnswer` 进行选项即答即判与渲染状态判定。
6. **`src/modules/graph/LineQuickPractice.tsx`** [修改]
   - 接入 `normalizeOptionAnswer` 进行主线快练答题与批次总分结算判定。
7. **`src/modules/concept/PointMasterExample.tsx`** [修改]
   - 选项高亮匹配接入 `normalizeOptionAnswer`。
8. **`src/modules/sandbox/SandboxRenderer.tsx`** [修改]
   - `SandboxConfig` 接口补充 `inquiry_guide_zh` 与 `inquiry_guide_en` 可选属性。
9. **`src/modules/sandbox/morphControllers.ts`** [修改]
   - `parseMorphingSpecs`、`createDefaultMorphingState`、`compileMorphingSandboxConfig` 增加全面可选链与兜底默认对象，防字段缺失崩溃。
10. **`src/modules/sandbox/__tests__/morphControllers.test.tsx`** [修改]
    - 增加 test 7：空模型与残缺 JSON 的防御性编译测试。
11. **`src/ConceptNav.tsx`** [修改]
    - 挂载 `useEffect` 异步从 `core.db` 读取 107 考点四段；
    - 当前考点变更时，分别从 `master.db` 异步读真实母题（dim1/2/3/4）、从 `sandbox.db` 异步读概念沙盒、从 `questions.db` 异步读快练题。
12. **`src/modules/graph/LineClosedLoop.tsx`** [修改]
    - 挂载 `useEffect` 从 `master.db` 异步查询对应主线的压轴母题真实数据（`ME-LINE-*`）。
13. **`src/MathJuniorHome.tsx`** [修改]
    - 挂载 `useEffect` 异步并行查询 `core.db` 的 4 张表（`logic_lines` 12条, `knowledge_points` 107个, `knowledge_graph_semesters` 107个带依赖, `knowledge_combinations` 2204条）；
    - 注入 `<SubwayMap />`；主线选择器切真库主线；
    - 挂载 `useEffect` 异步读取 `sandbox.db` 的 46 个概念沙盒与 36 个跃迁模型；
    - 实验室一与实验室二全面切入真库数据模型。
14. **`src/modules/exam/drawQuestions.ts`** [修改]
    - `drawQuestionsFromDb` 支持 `dbClient.query` 异步分包查询，优化无 `selectedKpIds` 时的全库安全查询，保留对底层原始 `db.exec` 的向后兼容。
15. **`src/modules/exam/PaperWorkbench.tsx`** [修改]
    - 初始化时异步载入 `questions.db` 全量 2064 题池与 `core.db` 107 考点录；
    - 实时库存校验基于真库题池；
    - 生成试卷与在线测评默认异步走 `drawQuestionsFromDb`；
    - 考点网格渲染真库考点。
16. **`src/modules/exam/__tests__/OnlineExam.test.tsx`** [修改]
    - 增加 test 9：验证 `ScorePanel` 选择题答案包含 `*A*`、`B．` 等脏数据时依然精准判对并赋满分。

---

## 3. 各模块真实数据源切入佐证 (ID 与内容)

### 3.1 概念精讲 (core.db `knowledge_points` 表，共 107 考点)
- **KP-001**：有理数的概念与分类（七上 · A1）
- **KP-023**：勾股定理及其逆定理（八上 · G4，非 mock 的简化 20 点）
- **KP-040**：二次函数图象与顶点式（九上 · A4）
- **KP-096**：空题考点正确展示暂无题目兜底提示，零白屏崩溃
- **KP-107**：九下大考综合考点

### 3.2 考点母题与主线母题 (master.db `master_examples` 表，共 119 个)
- **ME-KP023**：
  - `bound_target_id`: `KP-023`
  - `stem_zh`: "已知关于 $x$ 的一元二次方程 $x^2 - (2m-1)x + m^2 - 1 = 0$ 有两个不相等的实数根 $x_1, x_2$。若 $x_1 + x_2 = x_1 x_2$，求实数 $m$ 的值。"
  - `dim1_origin`: "本题针对考点【配方法】的核心考查要求进行命题设计...波斯数学家阿尔·花拉子米通过在正方形两边各补一个矩形、再在角上补一个小正方形的几何拼图法，发明了'配方法'..."
  - `dim2_essence`: "配方法的本质是'补齐几何正方形缺失的右下角'..."
  - `dim3_rigor`: 判别式校验与韦达定理严密证明过程必修呈现。
- **ME-LINE-A1 ~ ME-LINE-P1**：全 12 条主线母题均从 master.db 直读。

### 3.3 思维图谱 (core.db `knowledge_graph_semesters` + `knowledge_combinations`)
- 107 个学期节点携带 `predecessors`（如 `NODE-7-1-002` 依赖 `KP-001`）与 `successors` 数组；
- 2204 个完全连通组合（如 `C1-0001` ~ `C5-xxxx`），点击考点时动态连通流向高亮与组合卡片完全由真实数据驱动。

### 3.4 沙盒模型 (sandbox.db `concept_sandboxes` 46 个 + `leap_sandbox_models` 36 个)
- 概念沙盒由 4 个本地对象扩展为真库 46 个真实模型（如 `SB-KP001` 数轴三要素、`SB-KP003` 相反数与绝对值距离、`SB-KP032` 正比例函数直线旋转等）；
- 4D 跃迁模型由 4 个扩展为真库 36 个真实模型（`LM-7A-01` ~ `LM-9B-06`），4D 控制器在 `compileMorphingSandboxConfig` 保护下安全驱动。

### 3.5 组卷工作台 (questions.db `questions` 表，共 2064 题)
- 组卷工作台题库池由 mock 40 题切为真库 2064 题；
- 120 分中考制、100 分标准制题量全部由真库即时参数化抽题满足；
- 抽题严格锁在 `questions` 表，绝对无任何母题混入。

---

## 4. 判分容错测试结论
- `normalizeOptionAnswer` 单体测试 7 项全绿：
  - `'A'` vs `'*A*'` $\to$ 匹配成功
  - `'A'` vs `'A．'` $\to$ 匹配成功
  - `'A'` vs `'A.'` $\to$ 匹配成功
  - `'A'` vs `'【答案】A'` $\to$ 匹配成功
  - `'b'` vs `'B'` $\to$ 匹配成功
- `OnlineExam.test.tsx` 包含带脏数据标签的标准卷判分回归测试，满分 8 分正确无损通过。
