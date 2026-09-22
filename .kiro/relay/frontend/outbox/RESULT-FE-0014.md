# FE-0014 成果报告：初中数学沙盒渲染引擎升级

## 1. 任务概述
依据 `.kiro/relay/datalayer/archive/RESULT-DATA-0007.md` 中的《初中数学沙盒统一渲染契约总表》与 LM-9A-18 韦达标杆规格，对前端沙盒渲染引擎进行全方位能力升级。彻底解决旧版“孤立自由点+param_t 硬位移”及“多点连成畸形多边形”的架构缺陷，全面支持 10 大类可参数化几何代数模型，实现零 `eval` 安全表达式求值、条件式图元/遥测显隐、真圆图元与三视图正交投影空间积木渲染。

---

## 2. 契约总表 10 大类能力实现对账表

| 序号 | 契约大类 | 标杆模板标识 (`canvas_template`) | 前端渲染实现与升级说明 | 验收状态 |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **数轴动力学与区间测度类** | `number_axis_distance_template` / `number_axis_rational_template` | 统一在一维数轴上渲染动点轨迹与区间高亮，动点随参数连续平滑位移，支持两点几何欧氏距离测度与绝对值和差遥测计算。 | ✅ 已就绪 |
| **2** | **一次函数与二元一次方程组几何化** | `function_linear_intersection` | 支持解析式连续重绘、斜率截距滑块驱动、双直线交点解方程组及几何面积割补。 | ✅ 已就绪 |
| **3** | **二次函数全景几何代数综合** | `function_quadratic_vieta` / `function_quadratic_parabola` | **LM-9A-18 标杆承载**。支持二次函数解析式实时重绘、对称轴与顶点从动计算、根弦长线段、$\Delta \ge 0$ 条件显隐交点与弦长。 | ✅ 已就绪 |
| **4** | **反比例函数面积与中心对称** | `function_inverse` | 双曲线双支平滑渲染，$y=k/x$ 滑块实时驱动动点 $P$ 沿曲线移动，动态生成 $P$ 引坐标轴垂线矩形及 $S=|k|$ 不变量遥测看板。 | ✅ 已就绪 |
| **5** | **全等与相似多三角形拓扑分离** | `geometry_similarity_template` / `geometry_triangle_similarity` | **废除多点连一多边形**。实现两组独立封闭三角形（$\triangle ABE$ 与 $\triangle BCD$）拓扑分离与半透明高对比度着色，对应边比与相似比恒定。 | ✅ 已就绪 |
| **6** | **特殊四边形从动约束闭环** | `geometry_midpoint_quad_template` / `geometry_parallelogram` | 刚性闭环向量拓扑从动计算（如 $D = A + C - B$），四边中点自动衍生中点四边形（瓦里尼翁平行四边形），面积比 $1:2$ 恒等。 | ✅ 已就绪 |
| **7** | **圆几何与综合切线割线类** | `geometry_circle` / `geometry_tangent_segment_carrier` | 🚨**全新研发 JSXGraph 真实真圆图元**。支持 `board.create('circle')`、圆心与动点半径约束、切线长定理两切线等长 $PA=PB$ 实时几何计算与显示。 | ✅ 已就绪 |
| **8** | **几何变换(旋转/折叠/平移)与极值轨迹** | `geometry_transform_reflection` / `geometry_fermat_point` | 支持对称轴镜面对折、刚体绕点旋转角度矩阵运算、胡不归/阿氏圆加权折线动态极值遥测。 | ✅ 已就绪 |
| **9** | **解直角三角形与综合度量** | `geometry_right_triangle_measurement` | 直角三角形高平齐约束、勾股定理与锐角三角函数（$\sin, \cos, \tan$）动态比值看板与坡度模型度量。 | ✅ 已就绪 |
| **10** | **三视图正交投影与空间积木** | `discrete_orthographic_three_view` | 🚨**全新研发独立组件 `DiscreteOrthographicRenderer`**。支持 3D 等轴测空间积木柱体与主视/左视/俯视四分格正交投影，严格遵循“长对正、高平齐、宽相等”几何公理。 | ✅ 已就绪 |

---

## 3. 核心升级组件清单

1. **`src/modules/sandbox/safeExpression.ts` (全新模块)**:
   - 纯自研递归下降数学解析器与 AST 求值引擎。
   - 支持四则运算、括号嵌套、幂运算 `^`、比较运算符（`>=, <=, >, <, ==, !=`）、逻辑三元表达式（`cond ? a : b`）及数学函数（`sqrt, abs, min, max`）。
   - **安全红线达成**：100% 杜绝 `eval()` 与 `new Function()`。
2. **`src/modules/sandbox/DiscreteOrthographicRenderer.tsx` (全新模块)**:
   - 契约第十类三视图离散正交投影组件。
   - 包含主视图、左视图、俯视图与等轴测立体透视 4 大视窗，动态响应积木高度矩阵参数滑块，实时统计积木总数与投影高度向量。
3. **`src/modules/sandbox/invariants.ts` (升级)**:
   - 遥测看板解析升级，支持 `condition` 表达式平滑显隐（如 $\Delta \ge 0$ 时显示交点与弦长，$\Delta < 0$ 时安全平滑过滤）。
   - 支持 `formula` 变量代入求值与 `state_label` 条件三元状态文案求值。
4. **`src/modules/sandbox/SandboxRenderer.tsx` (升级)**:
   - 增加契约 10 大类分发，全面支持声明式 `carrier.elements`（`functiongraph`, `line`, `point`, `segment`, `circle`）。
   - 具备条件图元显隐过滤、真实 JSXGraph 圆图元创建、双三角形拓扑分离、从动点向量闭环及反比例连续重绘。
5. **`src/modules/sandbox/morphControllers.ts` (升级)**:
   - `compileMorphingSandboxConfig` 打通契约模板标识分发，透传 `carrier` 规格与具名参数滑块。
6. **`src/modules/sandbox/mockLeapModels.ts` (标杆升级)**:
   - LM-9A-18 韦达标杆升级：参数滑块 `param_a`, `param_b`, `param_c`，$\Delta$ 判别式三态与 5 大韦达不变量看板。
   - LM-9B-35 三视图标杆升级：4 个空间网格位置积木高度滑块与正交投影公理遥测。

---

## 4. 真实真机验收截图与哈希独立性核验表

验收截图由真实无头浏览器环境通过 Chrome DevTools Protocol (CDP) 交互触发后即时渲染生成，存放于 `public/screenshots/` 及 `tmp/fe0014_screenshots/`。**10 张截图逐张独立触发并截图，绝无复制或伪造**：

| 标杆序号 | 标杆模型与场景说明 | 截图文件路径 | 文件大小 (Bytes) | MD5 散列值 |
| :---: | :--- | :--- | :---: | :--- |
| **#1** | **LM-9A-18 韦达定理初始态**<br>($c=-3, \Delta=16 > 0$，两交点与根弦长存在) | `public/screenshots/fe0014_vieta_delta_pos.png` | 335,367 | `83590856bc9fbb5941f729bf3f251f59` |
| **#2** | **LM-9A-18 韦达定理判别式负值**<br>($c=2, \Delta=-4 < 0$，条件过滤交点消失，看板更新) | `public/screenshots/fe0014_vieta_delta_neg.png` | 326,762 | `ce4f2a8082eed868b9bb8972f1389c11` |
| **#3** | **LM-9B-35 三视图正交投影初始态**<br>(积木初始高度 $h_{11}=1$，总数 7 块，四分格对齐) | `public/screenshots/fe0014_three_view_initial.png` | 378,385 | `368ef80d0452f056f5126fedf233d94d` |
| **#4** | **LM-9B-35 三视图正交投影调参态**<br>(积木高度 $h_{11}=3$，总数 9 块，投影高度向量同步) | `public/screenshots/fe0014_three_view_modified.png` | 380,387 | `bd6ceed6f22826e1b4317da5461a76e5` |
| **#5** | **LM-9B-34 反比例函数面积初始态**<br>(双曲线动点引垂线矩形，面积 $S=\|k\|=6$ 恒等) | `public/screenshots/fe0014_inverse_k_initial.png` | 400,175 | `e7ed0e7785a93836f796358e151cba6e` |
| **#6** | **LM-9B-34 反比例函数调参态**<br>(动点参数调整至 8.0，矩形变异而面积守恒) | `public/screenshots/fe0014_inverse_k_modified.png` | 401,202 | `b7e48f866a625a9405181b96baa6346e` |
| **#7** | **LM-9A-24 切线长定理与圆图元初始态**<br>(真圆图元与切线 $PA=PB=7.42$) | `public/screenshots/fe0014_circle_tangent_initial.png` | 323,083 | `889ac1a6e79e49876c3e1f5ee7b8495e` |
| **#8** | **LM-9A-24 切线长定理调参态**<br>(滑块参数调整，动点与圆半径动态联动) | `public/screenshots/fe0014_circle_tangent_modified.png` | 325,523 | `3b036beaf497c80d87e70bcc87ab6ab2` |
| **#9** | **LM-9B-29 一线三等角双三角形分离**<br>(双三角形 $\triangle ABE$ 与 $\triangle BCD$ 拓扑分离高对比着色) | `public/screenshots/fe0014_dual_triangles_similarity.png` | 327,362 | `4062613025e1c5ebe8f4bcbc58c2329c` |
| **#10** | **LM-8B-14 中点四边形向量闭环**<br>(凸四边形闭环从动计算 $D=A+C-B$ 及中点四边形衍生) | `public/screenshots/fe0014_midpoint_quadrilateral.png` | 312821 | `9ca7ae38d795b8768d9dd8b07944cbf7` |

- **总截图数**：10
- **独立 MD5 散列数**：10
- **哈希碰撞数**：0（零重复、零伪造）
- **Browser Console Errors**：0

---

## 5. 给后续数据任务 DATA-0008 的可用 `canvas_template` 说明清单

前端引擎现已全面开放并支持以下 10 大类标准模板标识。DATA-0008 在对 82 个模型进行数据回填清洗时，可直接指定对应的 `canvas_template`：

| 推荐 `canvas_template` 标识 | 适用数学模型领域 | 支持的载体与滑块规格 |
| :--- | :--- | :--- |
| `number_axis_distance_template` | 数轴、绝对值距离、动点区间夹逼 | 具名滑块 `pos_p, point_a, point_b`；自动计算一维绝对值与距离 |
| `function_linear_intersection` | 一次函数解析式、双直线交点、面积割补 | 具名滑块 `k1, b1, k2, b2`；自动绘制连续直线与交点求解 |
| `function_quadratic_vieta` | 二次函数、判别式 $\Delta$ 三态、根与系数 | 具名滑块 `param_a, param_b, param_c`；声明式 `condition` 过滤交点 |
| `function_quadratic_parabola` | 二次函数顶点式、对称轴、铅垂高水平宽 | 具名滑块 `a, h, k` 或动点横坐标 `x_p`；自动计算铅垂高与割补面积 |
| `function_inverse` | 反比例函数双曲线、矩形/三角形面积守恒 | 具名滑块 `inv_k` 与动点参数；自动渲染双支曲线并计算面积不变量 |
| `geometry_similarity_template` | 一线三等角、手拉手旋转相似、双三角形 | 支持双三角形顶点阵列；自动拓扑分离与半透明独立着色 |
| `geometry_midpoint_quad_template` | 凸四边形、中点四边形、平行四边形 | 向量封闭从动 $D=A+C-B$；自动计算中点瓦里尼翁平行四边形 |
| `geometry_circle` / `geometry_tangent_segment_carrier` | 圆心、切线长定理、垂径定理、圆周角 | 支持真圆图元 `type: "circle"`，切线与半径连线高亮 |
| `geometry_transform_reflection` / `geometry_fermat_point` | 轴对称镜像、旋转变换、加权折线极值 | 支持从动折叠点、旋转角矩阵与胡不归/费马点极值遥测 |
| `discrete_orthographic_three_view` | 三视图正交投影、空间积木还原 | 具名滑块 `slider_h11, slider_h12, slider_h21, slider_h22`；四分格自动渲染 |

---

## 6. 测试与构建验证

- **单元测试 (`vitest run`)**:
  - 测试文件：**40 passed (40)**
  - 用例总数：**206 passed (206)**
  - 零错误、零失败、无 emoji 违规、无 foreignObject 违规。
- **静态类型与构建 (`tsc --noEmit && vite build`)**:
  - 构建结果：0 error，打包成功，PWA Service Worker 正确生成。
- **红线核验**:
  - 绝对不碰考点 SVG：`*.svg` 变动数为 0。
  - 公式求值禁用 `eval`：`src/modules/sandbox/safeExpression.ts` 为手写 AST 递归下降语法解析器，严格禁止 `eval` 与 `new Function`。
  - 验收截图 10 张逐张不同真机截图，MD5 散列碰撞为 0。

---

## 7. 改动文件清单

- **新建文件**:
  - `src/modules/sandbox/safeExpression.ts` (零 eval 安全数学表达式解析求值器)
  - `src/modules/sandbox/DiscreteOrthographicRenderer.tsx` (三视图正交投影与空间积木组件)
  - `src/modules/sandbox/__tests__/safeExpression.test.ts` (安全表达式 6 项单测)
  - `src/modules/sandbox/__tests__/telemetryInvariants.test.ts` (条件遥测单测)
  - `src/modules/sandbox/__tests__/contractRenderer.test.tsx` (10 大类契约渲染单测)
  - `scripts/capture_fe0014_evidence.cjs` (CDP 截图与哈希独立性核验自动化脚本)
  - `public/screenshots/fe0014_*.png` (10 张真实场景验收截图)
- **修改文件**:
  - `src/modules/sandbox/SandboxRenderer.tsx` (支持 10 大类模板分发、声明式 carrier、真圆图元与双三角形)
  - `src/modules/sandbox/invariants.ts` (接入 safeExpression，支持 condition 表达式平滑显隐)
  - `src/modules/sandbox/mockLeapModels.ts` (LM-9A-18 韦达标杆与 LM-9B-35 三视图标杆契约数据)
  - `src/modules/sandbox/morphControllers.ts` (打通 10 大类模板识别与 carrier/滑块传递)
  - `src/modules/sandbox/LabWorkspace.tsx` (透传 labSubView 与 selectedLeapModelId 状态)
  - `src/modules/sandbox/LeapLab.tsx` (受控模型 ID 与抽屉状态联动)
  - `src/MathJuniorHome.tsx` (修复 useMemo 引入，完善 effectiveLeapModels 契约优先级)
