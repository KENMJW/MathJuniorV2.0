# TASK-DATA-0004 执行结果报告（概念沙盒真实几何交互配置重做）

## 1. 任务概述与执行指标

- **任务编号**：TASK-DATA-0004
- **执行架构**：严格遵守协作规范（§7 铁律），通过 `invoke_subagent` 显式声明 `Model: "pro"`、`TypeName: "self"`，单次调用一次性并发派发 **5 个 Gemini 3.1 Pro 子 Agent** 独立执行 5 个分片的几何与代数真实交互场景设计，终端子 Agent 零写库仅产出 `partN.jsonl`，主 Agent 负责全局门神校验与单进程原子事务写入 SQLite。
- **模型分配**：**Gemini 3.1 Pro**（全量 5 个并发分片 100% Pro 模型原生调度，主 Agent Flash 绝不自跑内容生成）
- **成果总览**：
  - **概念具象沙盒 (concept_sandboxes)**：全量 **46 个** 概念沙盒彻底摒弃原有的单一空壳占位模板（即原 `[{"id":"P","x":2,"y":3,"constrainTo":"curve"}]` + `param_k` + `f(x)=const`），依据 `core.db` 各自考点的四段精讲与 `canvas_template` 数学本质完成重构。
  - **动态要素完备性**：
    - `viewbox_spec_json`：精准适配各自几何坐标系、数轴及函数视口。
    - `drag_points_json`：配置真实有几何意义的动点/定点（2~5个点），严禁 CSS 变量，100% 采用真实 Hex 色值（如 `#0071e3`, `#34c759`, `#ff3b30`, `#1d1d1f` 等），赋予轴线约束与滑动范围。
    - `param_sliders_json`：定制具有学科意义的物理/几何/代数参数滑块（如二次项系数 $a$、对称轴 $h$、斜率 $k$、旋转角 $\alpha$、半径 $r$、垂距 $d$ 等），淘汰通用 `param_k`。
    - `invariants_display_json`：深度绑定前端 `invariants.ts` 纯数学计算引擎（`distance`, `angle`, `vertical_distance`, `area_triangle`, `ratio_distance`），`deps` 依赖点 100% 存在于动点集合中，公式 100% 通过 KaTeX 门神。
    - `content_status`：46 行全量置为 `done`。
  - **底层模型保护**：`leap_sandbox_models` 36 个跃迁模型配置 100% 逐 bit 零修改保护，库表结构与外键 100% 保持原样，零 `DELETE`。
  - **全量同步**：更新后的 `sandbox.db` 已全量同步至 `public/data/sandbox.db`、`dist/data/sandbox.db` 与 `tmp/test-data/sandbox.db`。

---

## 2. 红线与验收清单逐项核验

| 验收项 | 规范要求 | 实测结果 | 结论 |
| :--- | :--- | :--- | :---: |
| **事前全库备份** | 写库前备份 `data/sandbox.db.bak_before_task0004` | 备份已创建，文件大小 `196,608` 字节 | **PASS** |
| **Pro 模型原生并发** | 指定 Gemini 3.1 Pro，单次 tool_call 派发 5 个子 Agent | 5 个 `self` 子 Agent 原生并发运行，各写独立 jsonl | **PASS** |
| **单进程串行写库** | 严禁子 Agent 直接写 SQLite，主进程单事务串行写入 | 5 子 Agent 退出后，主进程单事务原子更新并提交 | **PASS** |
| **彻底告别占位套壳** | 46 个沙盒不再是统一占位，各具数学场景灵魂 | 46 个沙盒配置完全独立定制，孤立点与通用 param_k 清零 | **PASS** |
| **依赖点完备性** | 每个 invariants 的 `deps` 指向该沙盒真实存在的点 id | 全量 46 个沙盒所有不变量依赖点 100% 存在，未命中数 = 0 | **PASS** |
| **真实色值约束** | 颜色禁用 CSS 变量 `var(--...)`，须用真实 Hex 色值 | 库内全量点颜色扫描，`var(--` 出现次数严格为 0 | **PASS** |
| **公式数学门神** | 所有 invariants 的 formula 通过 Headless KaTeX 编译预检 | 46 个沙盒所有公式 100% 通过 `sanitize_and_verify_math` | **PASS** |
| **跃迁模型零触碰** | 不动 `leap_sandbox_models`，结构与数据完整保护 | 与备份库比对，跃迁模型 36 行数据 100% bit-for-bit 一致 | **PASS** |
| **元数据完备性** | `content_status` 全部为 `done`，零 DELETE | 46 行 concept 数据 status 均为 `done`，总行数恒为 46 | **PASS** |
| **前端单元测试** | `invariants.test.ts` / `LinkedSandboxSlot.test.tsx` 通过 | 3 个测试文件共 29 个测试用例全部 PASS (100%) | **PASS** |
| **中间分片保留** | 保留 `tmp/sbcfg/part1.jsonl` ~ `part5.jsonl` | 5 个分片文件完整留存，独立校验全部 PASS | **PASS** |

---

## 3. 并发分片执行统计

| 分片编号 | 子 Agent ID | 分配考点范围 | 考点分类 | 处理行数 | 校验状态 |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **Part 1** | `326b8acd` | SB-KP001 ~ SB-KP037 | 数轴有理数 (4) + 一次/正反比例函数 (6) | 10 行 | 100% PASS |
| **Part 2** | `10d1505a` | SB-KP038 ~ SB-KP046 | 二次函数形态最值建模 (6) + 欧氏点线角基础 (3) | 9 行 | 100% PASS |
| **Part 3** | `9d2df33c` | SB-KP047 ~ SB-KP058 | 相交平行 (2) + 三角形/全等/等腰等边直角勾股相似 (7) | 9 行 | 100% PASS |
| **Part 4** | `4023e993` | SB-KP060 ~ SB-KP072 | 位似 (1) + 特殊平行四边形 (4) + 中点四边形 (1) + 圆与切线 (3) | 9 行 | 100% PASS |
| **Part 5** | `30127326` | SB-KP073 ~ SB-KP085 | 圆周角垂径 (2) + 内切圆扇形 (2) + 轴对称平移旋转中心对称 (4) + 锐角三角函数 (1) | 9 行 | 100% PASS |
| **合计** | 5 实例并行 | 全量 46 个概念沙盒 | 涵盖初中数学全领域几何与函数模型 | **46 行** | **100% PASS** |

---

## 4. 代表性沙盒真实几何/代数配置抽样深度解析（5 个代表场景）

### 4.1 数轴与绝对值场景：`SB-KP001` (KP-001 有理数的概念与分类)
- **模板类型**：`number_axis_template`
- **数学本质**：数轴一维刚性标尺与方向性，动点坐标与原点欧氏距离即为绝对值。
- **配置设计**：
  - **视口 (Viewbox)**：`{"xMin": -10, "xMax": 10, "yMin": -3, "yMax": 3, "marginPercent": 15}`，扁平化横向视口。
  - **动点 (Points)**：
    - `p0` (原点 $O$): $(0, 0)$，尺寸 6，黑色 `#1d1d1f`，约束锁定原点。
    - `p1` (动点 $A$): $(3, 0)$，尺寸 8，蓝色 `#0071e3`，约束 `minY: 0, maxY: 0` 保证严格在数轴上滑动。
  - **参数滑块 (Sliders)**：`step_size`（单位刻度），范围 $0.5 \sim 2$，步长 $0.5$。
  - **实时不变量 (Invariants)**：
    - 类型：`distance`，依赖 `['p0', 'p1']`
    - 公式：`|a| = {val}`，标签：“绝对值”
    - 效果：动点 $A$ 在数轴正负区间拖动时，实时显示与原点的非负欧氏距离，直观展示绝对值的几何距离本质。

### 4.2 反比例函数常数意义场景：`SB-KP037` (KP-037 反比例函数 k 的几何意义)
- **模板类型**：`function_inverse_k_template`
- **数学本质**：反比例曲线动点向两坐标轴作垂线，所围成的直角三角形面积恒等于 $\frac{1}{2}|k|$，“点动面积不动”。
- **配置设计**：
  - **视口 (Viewbox)**：`{"xMin": -2, "xMax": 10, "yMin": -2, "yMax": 10, "marginPercent": 15}`
  - **动点 (Points)**：
    - `o` (坐标原点 $O$): $(0, 0)$，尺寸 6，黑色 `#1d1d1f`
    - `px` (横轴垂足 $A$): $(3, 0)$，尺寸 6，蓝色 `#0071e3`，约束 `minY: 0, maxY: 0`
    - `p` (双曲线上动点 $P$): $(3, 4)$，尺寸 8，红色 `#ff3b30`
  - **参数滑块 (Sliders)**：`rect_k`（反比例系数 $k$），范围 $2 \sim 20$，默认值 $12$。
  - **实时不变量 (Invariants)**：
    - 类型：`area_triangle`，依赖 `['o', 'px', 'p']`
    - 公式：`S_{\triangle} = \frac{1}{2}|k| = {val}`，标签：“三角形面积”
    - 效果：拖拽点 $P$ 在曲线上游走，底和高反向补偿，直角三角形面积始终保持守恒。

### 4.3 二次函数建模场景：`SB-KP043` (KP-043 函数的实际应用与建模)
- **模板类型**：`function_quadratic_modeling_template`
- **数学本质**：抛物线抛体/拱桥结构中的割线三角形动点面积极值问题（铅垂高与水平宽模型）。
- **配置设计**：
  - **视口 (Viewbox)**：`{"xMin": -6, "xMax": 8, "yMin": -2, "yMax": 10, "marginPercent": 15}`
  - **动点 (Points)**：
    - `p_A` (地面入土点 $A$): $(-2, 0)$，红色 `#ff3b30`
    - `p_B` (地面出土点 $B$): $(4, 0)$，蓝色 `#0071e3`
    - `p_P` (抛物线抛体动点 $P$): $(1, 4)$，绿色 `#34c759`
  - **参数滑块 (Sliders)**：`param_time`（运动时间 $t$），范围 $0 \sim 10$。
  - **实时不变量 (Invariants)**：
    - 类型：`area_triangle`，依赖 `['p_A', 'p_B', 'p_P']`
    - 公式：`S_{ABP} = {val}`，标签：“割线三角形面积”
    - 效果：拖动 $P$ 沿抛物线轨迹运动，动态呈现以 $AB$ 为底的三角形面积变化曲线与最高极值点。

### 4.4 勾股定理正交场景：`SB-KP057` (KP-057 勾股定理及其逆定理)
- **模板类型**：`geometry_pythagorean_template`
- **数学本质**：直角三角形两直角边平方和恒等于斜边平方，正交分解的几何量化。
- **配置设计**：
  - **视口 (Viewbox)**：`{"xMin": -2, "xMax": 10, "yMin": -2, "yMax": 10, "marginPercent": 15, "preserveAspectRatio": true}`
  - **动点 (Points)**：
    - `C` (直角顶点 $C$): $(0, 0)$，红色 `#ff3b30`
    - `A` (纵轴直角顶点 $A$): $(0, 4)$，蓝色 `#0071e3`，约束锁定在 $Y$ 轴
    - `B` (横轴直角顶点 $B$): $(3, 0)$，绿色 `#34c759`，约束锁定在 $X$ 轴
  - **参数滑块 (Sliders)**：
    - `leg_a` (直角边 $a$): 范围 $2 \sim 8$，默认 $3$
    - `leg_b` (直角边 $b$): 范围 $2 \sim 8$，默认 $4$
  - **实时不变量 (Invariants)**：
    - 类型：`distance`，依赖 `['A', 'B']`
    - 公式：`c = {val}`，标签：“斜边长 c”
    - 效果：调节两边长滑块（如 3 与 4），斜边不变量精确呈现 5.00，完美印证 $3^2+4^2=5^2$。

### 4.5 圆周角与圆心角定理场景：`SB-KP073` (KP-073 圆周角定理与圆心角)
- **模板类型**：`geometry_inscribed_angle_template`
- **数学本质**：同弧所对的圆周角恒为圆心角的一半，圆周上任意滑动顶点角度守恒。
- **配置设计**：
  - **视口 (Viewbox)**：`{"xMin": -8, "xMax": 8, "yMin": -8, "yMax": 8, "marginPercent": 15, "preserveAspectRatio": true}`
  - **动点 (Points)**：
    - `O` (圆心 $O$): $(0, 0)$，深灰色 `#1d1d1f`，固定点
    - `A` (弦端点 $A$): $(-4, 0)$，蓝色 `#0071e3`，圆周约束
    - `B` (弦端点 $B$): $(0, -4)$，蓝色 `#0071e3`，圆周约束
    - `C` (圆周动点 $C$): $(2.828, 2.828)$，红色 `#ff3b30`，圆周约束
  - **参数滑块 (Sliders)**：`r`（圆半径），范围 $2 \sim 6$，默认 $4$。
  - **实时不变量 (Invariants)**：
    - 不变量 1：类型 `angle`，依赖 `['A', 'C', 'B']`，公式 `\angle ACB = {val}^\circ`，标签：“圆周角”
    - 不变量 2：类型 `angle`，依赖 `['A', 'O', 'B']`，公式 `\angle AOB = {val}^\circ`，标签：“圆心角”
    - 效果：在圆周优弧上任意拖拽 $C$ 点，$\angle ACB$ 恒等于 $\angle AOB$ 的一半，展示经典的同弧圆周角守恒。

---

## 5. 全量 46 个概念沙盒重做配置总表

| 序号 | 沙盒ID | 考点ID | 模板标识 | 动点配置概况 | 参数滑块 | 实时不变量与公式 | 状态 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | `SB-KP001` | `KP-001` | number_axis_template | O(0,0), A(3,0) | 单位刻度 | \|a\| = {val} | done |
| 2 | `SB-KP002` | `KP-002` | number_axis_template | O(0,0), P(4,0) | 运动速度 | d = {val} | done |
| 3 | `SB-KP003` | `KP-003` | number_axis_distance_template | O(0,0), A(-3,0), B(3,0) | 基准值 a | \|a\| = {val}, \|-a\| = {val} | done |
| 4 | `SB-KP008` | `KP-008` | number_axis_interval_template | L(1,0), P(1.414,0), R(2,0) | 被开方数 a | \Delta = {val} | done |
| 5 | `SB-KP032` | `KP-032` | function_direct_template | O(0,0), P(2,4), Ref(4,0) | 比例系数 k | \theta = {val}^\circ | done |
| 6 | `SB-KP033` | `KP-033` | function_linear_solve_template | A(-2,1), B(3,4) | x_1, x_2 | \|AB\| = {val} | done |
| 7 | `SB-KP034` | `KP-034` | function_linear_prop_template | O(0,0), X(4,0), Y(0,3) | 截距 b, 斜率 k | S = {val} | done |
| 8 | `SB-KP035` | `KP-035` | function_linear_equation_template | P(2,3), Ref(2,0) | 斜率 k_1, k_2 | y = {val} | done |
| 9 | `SB-KP036` | `KP-036` | function_inverse_template | O(0,0), P(2,3), P'(-2,-3) | 反比例系数 k | \|OP\| = {val} | done |
| 10 | `SB-KP037` | `KP-037` | function_inverse_k_template | O(0,0), A(3,0), P(3,4) | 系数 k | S_{\triangle} = {val} | done |
| 11 | `SB-KP038` | `KP-038` | function_quadratic_forms_template | V(0,4), X1(-2,0), X2(2,0) | 开口系数 a | d(X_1, X_2) = {val} | done |
| 12 | `SB-KP039` | `KP-039` | function_quadratic_vertex_template | V(1,3), P1(-1,0), P2(3,0) | 平移 h, 平移 k | d(P_1, V) = {val}, d(P_2, V) = {val} | done |
| 13 | `SB-KP040` | `KP-040` | function_quadratic_roots_template | V(0,-4), X1(-2,0), X2(2,0) | 截距 c | 弦长 = {val} | done |
| 14 | `SB-KP041` | `KP-041` | function_quadratic_extrema_template | V(0,3), M(-2,0), N(3,0) | 区间左端点 m | d(M, V) = {val}, d(N, V) = {val} | done |
| 15 | `SB-KP042` | `KP-042` | function_quadratic_ineq_template | V(0,4), P(1,3), X1(-2,0), X2(2,0) | 水位线 k | d(X_1, X_2) = {val} | done |
| 16 | `SB-KP043` | `KP-043` | function_quadratic_modeling_template | A(-2,0), B(4,0), P(1,4) | 时间 t | S_{ABP} = {val} | done |
| 17 | `SB-KP044` | `KP-044` | geometry_point_line_template | O(0,0), A(4,0), B(3,3) | 旋转角 \theta | \angle AOB = {val}^\circ | done |
| 18 | `SB-KP045` | `KP-045` | geometry_segment_mid_template | A(-4,0), B(4,0), M(0,0) | 端点平移 | \|AM\| = {val}, \|MB\| = {val} | done |
| 19 | `SB-KP046` | `KP-046` | geometry_angle_calc_template | O(0,0), A(4,0), B(2,3), C(-4,0) | 射线旋转角 | \angle AOB = {val}^\circ, \angle BOC = {val}^\circ | done |
| 20 | `SB-KP047` | `KP-047` | geometry_perpendicular_template | P(0,4), H(0,0), C(3,0) | 直线平移 | \|PH\| = {val}, \|PC\| = {val} | done |
| 21 | `SB-KP048` | `KP-048` | geometry_parallel_template | A(-3,2), B(3,2), C(-3,-2) | 截线倾角 | d = {val} | done |
| 22 | `SB-KP049` | `KP-049` | geometry_triangle_sum_template | A(0,3), B(-3,-2), C(3,-2) | 平移 t | \angle A = {val}^\circ, \angle B = {val}^\circ | done |
| 23 | `SB-KP051` | `KP-051` | geometry_congruence_template | A(-4,2), B(-5,-1), A'(2,2), B'(1,-1) | 变换角 \theta | \|AB\| = {val}, \|A'B'\| = {val} | done |
| 24 | `SB-KP053` | `KP-053` | geometry_isosceles_template | A(0,4), B(-3,-1), C(3,-1) | 底边宽 w | \|AB\| = {val}, \|AC\| = {val} | done |
| 25 | `SB-KP055` | `KP-055` | geometry_equilateral_template | A(0,3.46), B(-2,0), C(2,0) | 边长 a | \angle B = {val}^\circ, \|BC\| = {val} | done |
| 26 | `SB-KP056` | `KP-056` | geometry_right_triangle_template | C(0,0), A(0,4), B(3,0), M(1.5,2) | 直角边 a, b | \|CM\| = {val}, \|AB\| = {val} | done |
| 27 | `SB-KP057` | `KP-057` | geometry_pythagorean_template | C(0,0), A(0,4), B(3,0) | 直角边 a, b | c = {val} | done |
| 28 | `SB-KP058` | `KP-058` | geometry_similarity_template | A(0,2), B(-2,-1), A'(0,4), B'(-4,-2) | 相似比 k | \|A'B'\| / \|AB\| = {val}, \angle A = {val}^\circ | done |
| 29 | `SB-KP060` | `KP-060` | geometry_homothety_template | O(0,0), A(2,2), B(4,1) | 位似比 k | \|OA\| = {val}, \|OB\| = {val} | done |
| 30 | `SB-KP062` | `KP-062` | geometry_parallelogram_template | A(-3,-1), B(2,-1), C(4,2), D(-1,2) | 倾斜角 | \|AB\| = {val}, \|CD\| = {val} | done |
| 31 | `SB-KP064` | `KP-064` | geometry_rectangle_template | A(-3,-2), B(3,-2), C(3,2), D(-3,2) | 矩形宽 w, 高 h | \|AC\| = {val}, \|BD\| = {val} | done |
| 32 | `SB-KP065` | `KP-065` | geometry_rhombus_template | A(0,3), B(-4,0), C(0,-3), D(4,0) | 对角线 d_1, d_2 | \|AB\| = {val}, \|BC\| = {val} | done |
| 33 | `SB-KP066` | `KP-066` | geometry_square_template | A(-2,-2), B(2,-2), C(2,2), D(-2,2) | 边长 a | \|AC\| = {val}, \|BD\| = {val} | done |
| 34 | `SB-KP068` | `KP-068` | geometry_midpoint_quad_template | A(-3,3), B(3,2), C(4,-2), D(-2,-3) | 形变因子 | \|AC\| = {val}, \|BD\| = {val} | done |
| 35 | `SB-KP069` | `KP-069` | geometry_circle_def_template | O(0,0), A(3,0), B(0,3) | 半径 r | \|OA\| = {val}, \|OB\| = {val} | done |
| 36 | `SB-KP071` | `KP-071` | geometry_line_circle_template | O(0,0), P(0,3), H(0,3) | 圆心距 d, 半径 r | d = {val} | done |
| 37 | `SB-KP072` | `KP-072` | geometry_tangent_template | O(0,0), A(0,3), P(4,3) | 切线旋转角 | \angle OAP = {val}^\circ | done |
| 38 | `SB-KP073` | `KP-073` | geometry_inscribed_angle_template | O(0,0), A(-4,0), B(0,-4), C(2.8,2.8) | 半径 r | \angle ACB = {val}^\circ, \angle AOB = {val}^\circ | done |
| 39 | `SB-KP074` | `KP-074` | geometry_chord_bisector_template | O(0,0), A(-3,2), B(3,2), M(0,2) | 半径 r | \|AB\| = {val}, d = {val} | done |
| 40 | `SB-KP076` | `KP-076` | geometry_incircle_template | A(0,4), B(-3,-1), C(3,-1), I(0,0.8) | 内切圆半径 r | S = {val}, r = {val} | done |
| 41 | `SB-KP077` | `KP-077` | geometry_sector_template | O(0,0), A(3,0), B(1.5,2.6) | 半径 r, 圆心角 \alpha | R = {val}, n^\circ = {val} | done |
| 42 | `SB-KP079` | `KP-079` | geometry_reflection_template | A(1,2), B(3,4), A'(-1,2), B'(-3,4) | 轴旋转角 | \|AB\| = {val}, \|A'B'\| = {val} | done |
| 43 | `SB-KP080` | `KP-080` | geometry_translation_template | A(0,0), B(2,3), A'(3,1), B'(5,4) | 位移 dx, dy | \|AB\| = {val}, \|A'B'\| = {val} | done |
| 44 | `SB-KP081` | `KP-081` | geometry_rotation_template | O(0,0), A(3,0), A'(0,3) | 旋转角 \theta | \|OA\| = {val}, \|OA'\| = {val} | done |
| 45 | `SB-KP082` | `KP-082` | geometry_central_sym_template | O(0,0), A(2,3), A'(-2,-3) | 中心位置 | \|OA\| = {val}, \|OA'\| = {val} | done |
| 46 | `SB-KP085` | `KP-085` | geometry_trig_def_template | C(0,0), A(0,4), B(3,0) | 锐角 \alpha | \sin A = {val}, \angle A = {val}^\circ | done |

---

## 6. 测试与门禁验证报告

1. **KaTeX 数学门神预检**：
   - 运行 `math_gate.sanitize_and_verify_math()` 对全量 46 个沙盒的不变量公式进行严格语法检查，0 错误拦截，100% 具备数学合法性。
2. **前端单元测试全绿**：
   - 运行 `npm test -- src/modules/concept/__tests__/LinkedSandboxSlot.test.tsx src/modules/sandbox/__tests__/morphControllers.test.tsx src/modules/sandbox/__tests__/invariants.test.ts`
   - 测试结果：**3 passed / 3 files, 29 passed / 29 tests, 0 failed**。
3. **分片文件存档**：
   - `tmp/sbcfg/part1.jsonl` ~ `tmp/sbcfg/part5.jsonl` 已全量归档保留，供溯源审计。
