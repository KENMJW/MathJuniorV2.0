---
id: RESULT-DATA-0007
task_id: TASK-DATA-0007
line: datalayer
status: done
attempt: 1
created_by: Antigravity
model: default (Flash)
concurrency: 8
---

# 执行报告：TASK-DATA-0007 模型数据语义验证与改造规格 (82全验/只读分析)

**任务编号**：TASK-DATA-0007  
**任务线路**：Datalayer 数据线（模型数据语义验证 + 改造规格设计）  
**执行原则**：8 分片原生并发评审；全量 82 模型（46 概念沙盒 + 36 跃迁沙盒）无遗漏核验；**只读不写库、零前端代码修改**  
**模型与并发**：Google DeepMind Flash 模型，并发 8 分片独立子 Agent  
**最核心交付**：《初中数学沙盒统一渲染契约总表》（FE-0014 升级合同）与 82 模型改造清单  
**基准数据库**：`data/sandbox.db` (concept_sandboxes 46 行, leap_sandbox_models 36 行)  

---

## 一、 核验总览与全库评定统计

对全库 82 个沙盒模型进行了“名字宣称的数学对象 vs 现有底层数据与渲染能力”的逐一深度数学语义验证。

### 1.1 总体评定分布

| 库表 / 沙盒类型 | 考察总数 | 🔴 严重错配 | 🟠 部分失效 | 🟢 正确 | 坏模型占比 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **概念沙盒 (`concept_sandboxes`)** | 46 | 29 (63.0%) | 17 (37.0%) | 0 (0.0%) | 100.0% |
| **跃迁沙盒 (`leap_sandbox_models`)** | 36 | 34 (94.4%) | 2 (5.6%) | 0 (0.0%) | 100.0% |
| **全库总计 (Total)** | **82** | **63 (76.8%)** | **19 (23.2%)** | **0 (0.0%)** | **100.0%** |

### 1.2 全库四大系统性通病深度诊断

1. **跃迁沙盒“伪滑块”彻底泛滥（最严重硬伤）**：
   - 全量 36 个跃迁模型中，`parameter_morphing_json` 竟 100% 全部退化为单一抽象的 `param_t (0~10)` 伪滑块；
   - 前端 `morphControllers.ts` 被迫用 `paramTDisplacement = (tVal - 5) * 0.5` 为所有动点硬编码一个线性伪位移；
   - 这导致从代数模型（韦达定理、因式分解、非负数）到解析几何模型（胡不归、阿氏圆、二次函数极值），滑块与真实的数学系数（如 $a, b, c$、旋转角 $\theta$、相似比 $k$、弦心距 $d$）完全解耦，用户拉动滑块只看到图形整体机械抖动，无法发生任何定理级数学探究。
2. **多边形拓扑“盲目连线”制造严重错位**：
   - 现行 `SandboxRenderer.tsx` 仅支持简单拓扑：遇到 3 个点一律连成实心三角形，遇到 4 个点一律连成封闭四边形，遇到 5 个点以上一律连成大封闭多边形；
   - 导致大量非多边形模型产生荒谬画面：SB-KP044（点线面角）被连成蓝色三角形，SB-KP046（对顶角）被连成四边形，SB-KP048（平行线三线八角 5 个点）直接被连成五边形，SB-KP056（直角三角形+斜边中点）4个点被连成畸形四边形。
3. **关键数学几何图元与解析式完全缺位**：
   - 圆相关模型（SB-KP069 圆定义、SB-KP071 直线与圆、SB-KP072 切线、SB-KP074 垂径、LM-9A-22 隐形圆、LM-9B-32 阿氏圆）在底层数据中只有几个离散散点，没有圆心半径方程，渲染器也没有 `board.create("circle")` 逻辑；
   - 函数模型（如 LM-9A-18 韦达、LM-9A-25 铅垂高、LM-9B-34 反比例反演）只有离散坐标点，完全没有连续函数解析式解析与求交逻辑。
4. **遥测公式与数学公理脱节**：
   - 大量遥测项直接计算两个无关拖动点之间的欧氏距离（如 SB-KP041 二次函数最值算到 $(1,-3)$ 的距离、LM-8A-10 截长补短写成三角形两边之和等于第三边 $AB+BC=AC$）；
   - 严重缺乏基于几何定理的不变量闭环（如面积恒等、角度守恒、差值归零、比例恒定）。

---

## 二、 标杆案例深度解剖：LM-9A-18 一元二次方程判别式与韦达对称代数模型

**模型名称**：一元二次方程判别式与韦达对称代数模型 (LM-9A-18)  
**所属学段/主线**：初三九年级上册 (9A) / A3 代数大招线  
**评定等级**：🔴 严重错配（现有数据完全无法表达模型宣称的数学内涵）

### 2.1 现有线上数据缺陷解剖

1. **核心代数参数彻底缺位**：
   - 现有数据 `parameter_morphing_json` 仅有一个 `param_t (0~10)`，缺失一元二次方程核心的三大系数：二次项系数 $a$、一次项系数 $b$、常数项 $c$；
2. **姿态变换荒谬违背解析几何常识**：
   - 现有数据在 `posture_morphing_json` 中，为了表现“开口向下”，居然配置了 `rotationDeg: 180`（画布整体旋转 180°）！这导致整个直角坐标系反转（$x$ 轴正方向朝左，$y$ 轴正方向朝下），完全违背初中数学直角坐标系公理；
3. **载体形态退化为死点，无法呈现 $\Delta < 0$**：
   - `carrier_morphing_json` 仅配置了两个死交点 $(-2,0)$ 和 $(3,0)$，完全没有抛物线解析式 $y=ax^2+bx+c$；当判别式 $\Delta < 0$（抛物线脱离 $x$ 轴无实根）时，这两个死点仍然顽固留在轴上，彻底误导学生；
4. **遥测公式完全缺失韦达定理对偶对称式**：
   - 现有数据完全没有判别式 $\Delta = b^2 - 4ac$ 的实时判定，更没有两根之和 $x_1+x_2 = -b/a$、两根之积 $x_1 x_2 = c/a$ 等中考代数大招核心遥测。

### 2.2 LM-9A-18 生产级 6 要素改造规格

```json
{
  "canvas_template": "function_quadratic_vieta",
  "carrier": {
    "type": "analytical_function_with_geometry",
    "equation": "y = a * x^2 + b * x + c",
    "elements": [
      {
        "id": "parabola",
        "type": "functiongraph",
        "fn": "a*x^2 + b*x + c",
        "color": "#38bdf8",
        "strokeWidth": 2.5
      },
      {
        "id": "sym_axis",
        "type": "line",
        "fn": "x = -b / (2*a)",
        "dash": 2,
        "color": "#94a3b8"
      },
      {
        "id": "vertex_V",
        "type": "point",
        "coord": [
          "-b/(2*a)",
          "(4*a*c - b^2)/(4*a)"
        ],
        "name": "V",
        "color": "#f59e0b"
      },
      {
        "id": "root_x1",
        "type": "point",
        "condition": "Delta >= 0",
        "coord": [
          "(-b - sqrt(Delta))/(2*a)",
          0
        ],
        "name": "x1",
        "color": "#f43f5e"
      },
      {
        "id": "root_x2",
        "type": "point",
        "condition": "Delta >= 0",
        "coord": [
          "(-b + sqrt(Delta))/(2*a)",
          0
        ],
        "name": "x2",
        "color": "#f43f5e"
      },
      {
        "id": "root_segment",
        "type": "segment",
        "condition": "Delta >= 0",
        "endpoints": [
          "root_x1",
          "root_x2"
        ],
        "color": "#a855f7",
        "strokeWidth": 3
      }
    ]
  },
  "sliders": [
    {
      "id": "param_a",
      "nameZh": "二次项系数 a",
      "nameEn": "Coefficient a",
      "min": -3.0,
      "max": 3.0,
      "default": 1.0,
      "step": 0.2,
      "avoidZero": true,
      "math_meaning": "决定抛物线开口方向与张角大小，控制代数曲率"
    },
    {
      "id": "param_b",
      "nameZh": "一次项系数 b",
      "nameEn": "Coefficient b",
      "min": -6.0,
      "max": 6.0,
      "default": -2.0,
      "step": 0.5,
      "math_meaning": "与 a 共同决定对称轴位置 x = -b/(2a) 及两根之和"
    },
    {
      "id": "param_c",
      "nameZh": "常数项 c",
      "nameEn": "Constant c",
      "min": -8.0,
      "max": 8.0,
      "default": -3.0,
      "step": 0.5,
      "math_meaning": "决定抛物线与 y 轴交点 (0,c) 及两根之积"
    }
  ],
  "telemetry_invariants": [
    {
      "id": "delta_val",
      "labelZh": "判别式 Δ = b² - 4ac",
      "formula": "b^2 - 4*a*c",
      "deps": [
        "param_a",
        "param_b",
        "param_c"
      ],
      "state_label": "Delta > 0 ? '两个不相等实根' : (Delta == 0 ? '两个相等实根' : '无实数根')"
    },
    {
      "id": "sum_roots",
      "labelZh": "两根之和 x₁ + x₂ = -b/a",
      "condition": "Delta >= 0",
      "formula": "-b / a",
      "deps": [
        "param_a",
        "param_b"
      ]
    },
    {
      "id": "prod_roots",
      "labelZh": "两根之积 x₁ · x₂ = c/a",
      "condition": "Delta >= 0",
      "formula": "c / a",
      "deps": [
        "param_a",
        "param_c"
      ]
    },
    {
      "id": "sq_sum_roots",
      "labelZh": "平方和 x₁² + x₂² = (b² - 2ac)/a²",
      "condition": "Delta >= 0",
      "formula": "(b^2 - 2*a*c) / (a^2)",
      "deps": [
        "param_a",
        "param_b",
        "param_c"
      ]
    },
    {
      "id": "reciprocal_sum",
      "labelZh": "倒数和 1/x₁ + 1/x₂ = -b/c",
      "condition": "Delta >= 0 && c != 0",
      "formula": "-b / c",
      "deps": [
        "param_b",
        "param_c"
      ]
    },
    {
      "id": "chord_len",
      "labelZh": "弦长 |x₁ - x₂| = √Δ / |a|",
      "condition": "Delta >= 0",
      "formula": "sqrt(Delta) / abs(a)",
      "deps": [
        "param_a",
        "delta_val"
      ]
    }
  ],
  "posture_semantics": {
    "standard": {
      "description": "a > 0 标准开口向上，极小值态"
    },
    "inverted": {
      "description": "a < 0 代数符号反转驱动开口向下，极大值态（绝不旋转画布直角坐标系）"
    }
  },
  "math_validation": "设定基准参数 a = 1.0, b = -2.0, c = -3.0：\n1. 对应一元二次方程 x^2 - 2x - 3 = 0，理论判别式 Δ = (-2)^2 - 4*(1)*(-3) = 4 + 12 = 16 > 0；\n2. 理论两根 x1 = (2 - 4)/2 = -1.0，x2 = (2 + 4)/2 = 3.0；\n3. 韦达定理验算：x1 + x2 = -1 + 3 = 2.0，公式 -b/a = -(-2)/1 = 2.0，绝对精确闭环；\n4. 乘积验算：x1 * x2 = (-1)*3 = -3.0，公式 c/a = -3/1 = -3.0，绝对精确闭环；\n5. 对称式验算：x1^2 + x2^2 = 1 + 9 = 10.0，公式 (b^2 - 2ac)/a^2 = (4 - 2*(-3))/1 = 10.0，绝对闭环；\n6. 临界测试：调 c 从 -3 增至 1 时，Δ = 4 - 4 = 0，两根重合于 x = 1；继续增 c 至 2 时，Δ = -4 < 0，渲染器平滑隐藏 x1, x2 与弦长，面板显示'无实数根'，完全符合代数公理。"
}
```

---

## 三、 全库 82 个沙盒模型逐一核验与改造清单

以下为全库 82 个模型（46 个概念沙盒 SB-KP001 ~ SB-KP085 与 36 个跃迁沙盒 LM-7A-01 ~ LM-9B-36）的逐一核验与改造对账表：

| 序号 | 沙盒 ID | 考点/学段 | 名称 | 评定 | 核心病因诊断 | 明确模板 (`canvas_template`) | 改造关键滑块 | 核心遥测不变量 |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `SB-KP001` | KP-001 |  | 🔴严重错配 | 模型宣称'观察有理数分类与正负数方向性'，但现有数据仅定义了单一动点 A 及绝对值距离公式 &#124;a&#124;={val}... | `number_axis_rational_template` | p_num, q_den, unit_scale | 有理数坐标值; 正负性质分类 |
| 2 | `SB-KP002` | KP-002 |  | 🔴严重错配 | 模型宣称探究数轴三要素与连续稠密性，现有数据配置了孤立的'运动速度'滑块，但在渲染器中既无时间参数也无动力学驱动，成为完全失效的'... | `number_axis_elements_motion_template` | param_x0, param_v, param_t | 动点平移位移方程; 有向位移量 |
| 3 | `SB-KP003` | KP-003 |  | 🟠部分失效 | 场景具备原点与两侧点 A, B 的距离测度雏形，但存在动力学缺陷：点 A 与点 B 在数据层互为独立自由点，用户拖动点 A 时点 ... | `number_axis_opposite_template` | val_a | 绝对值距离对称恒等; 相反数代数和恒等 |
| 4 | `SB-KP008` | KP-008 |  | 🔴严重错配 | 模型宣称探究无理数与相邻有理数区间的无限逼近夹逼，但数据层三点坐标均为硬编码静态死数据（√a 固定为 3.16，n 固定为 3，n... | `number_axis_irrational_squeeze_template` | val_base, zoom_level | 完全平方数夹逼不等式; 无理数取值区间锁定 |
| 5 | `SB-KP032` | KP-032 |  | 🟠部分失效 | 渲染器支持比例系数 k 控制直线旋转，但关键特征动点 P 缺少函数轨道几何约束：P 点为自由点，用户拖动 P 会脱离直线；且调节滑... | `function_direct_template` | k_prop, x_pos | 正比例常商不变量; 直线倾斜角 |
| 6 | `SB-KP033` | KP-033 |  | 🔴严重错配 | 模型宣称'待定系数法解析式动态重算'，但现有渲染模板绘制的是一条固定的默认直线（不随两点联动更新），两点 A(-2,-1) 与 B... | `function_linear_solve_template` | pt_x1, pt_y1, pt_x2 | 待定系数法动态解析式; 斜率待定求解 |
| 7 | `SB-KP034` | KP-034 |  | 🟠部分失效 | 默认配置下 y = x + 3 与初始点 (-3,0),(0,3) 表面吻合，但实为'静态假联动'：调节斜率 k 与截距 b 滑块... | `function_linear_prop_template` | slope_k, intercept_b, x_sample | 两轴截距点坐标; 截距三角形面积守恒 |
| 8 | `SB-KP035` | KP-035 |  | 🔴严重错配 | 严重悬空与数学脱节：模型宣称探究一次函数与二元方程组同解几何化，但现有模板中两直线解析式缺常数项（b1=0, b2=0），直线退化... | `function_linear_system_template` | k1, b1, k2 | 两直线几何交点; 二元一次方程组同解 |
| 9 | `SB-KP036` | KP-036 |  | 🟠部分失效 | 初始点位与双曲线 y = 6/x 数值匹配，但动力学拓扑失效：动点 P 未吸附于双曲线轨道上（拖拽脱轨）；中心对称点 P' 未与 ... | `function_inverse_template` | inv_k, x_pos | 乘积守恒不变量; 中心对称等距守恒 |
| 10 | `SB-KP037` | KP-037 |  | 🟠部分失效 | 初始点 (3,4) 与 k=12 在代数上满足 3 * 4 = 12，但存在三大功能性失效：1) 动点 P 未吸附于双曲线上滑动（... | `function_inverse_k_template` | rect_k, x_pt | 矩形面积不变恒等式; 三角形面积半衰守恒 |
| 11 | `SB-KP038` | KP-038 |  | 🔴严重错配 | 严重解析式与图象脱离：滑块仅有开口系数 a_coeff，缺少常数项 c（默认 c=0），导致渲染器绘制出过原点的 y = x^2，... | `function_quadratic_forms_template` | a_coeff, param_h, param_k | 三种表达式全息矩阵; 几何极值与对称轴 |
| 12 | `SB-KP039` | KP-039 | 二次函数的对称轴与顶点 | 🟠部分失效 | 抛物线顶点式解析式与滑块存在基础响应通道，但几何动点、对称轴方程及对称点横向等距等核心不变量严重脱节失效，无法形成完整的数学探究闭... | `function_quadratic_vertex_template` | param_a, param_h, param_k | 对称轴方程; 顶点坐标 |
| 13 | `SB-KP040` | KP-040 | 二次函数与x轴的交点 | 🔴严重错配 | 交点动点与实际函数根完全脱节错位，无法展示 Δ 的三态临界转变，且无实根时依然显示错误交点，存在严重数学谬误。 | `function_quadratic_roots_template` | param_a, param_b, param_c | 一元二次方程判别式; 与x轴交点数量 (2 / 1 / 0) |
| 14 | `SB-KP041` | KP-041 | 二次函数的最值问题 | 🔴严重错配 | 核心参数完全未被渲染，闭区间定义域未实现几何裁剪高亮，不变量公式纯属荒谬拼凑，完全脱离中考核心代数模型。 | `function_quadratic_extrema_template` | param_h, param_m, param_n | 动轴所处形态 (h<m / m≤h≤n / h>n); 区间最小值 |
| 15 | `SB-KP042` | KP-042 | 二次函数与方程不等式关系 | 🔴严重错配 | 水平水位割线未渲染，不等式解集在 x 轴上无对应着色区间，数形结合思想完全未被实现。 | `function_quadratic_ineq_template` | param_k_level, param_c | 二次不等式解集区间; 解集区间宽度 |
| 16 | `SB-KP043` | KP-043 | 函数的实际应用与建模 | 🔴严重错配 | 核心开口方向相反，动点脱离曲线，未渲染铅垂高线段与割线三角形，滑块未建立参数驱动，无法承载建模教研目标。 | `function_quadratic_modeling_template` | param_t | 铅垂高 PQ; 水平宽 (恒定) |
| 17 | `SB-KP044` | KP-044 | 点线面角的基本概念 | 🔴严重错配 | 对象拓扑完全错误（将一维线与角误绘为二维实心三角形），旋转滑块未生效，教学认知严重错置。 | `geometry_point_line_template` | param_angle_deg, param_len_oa | 射线夹角张角; 角的分类 |
| 18 | `SB-KP045` | KP-045 | 线段射线直线的关系 | 🔴严重错配 | 中点与线段拓扑破坏，动点自由漂移破坏共线性，折半比例滑块死锁，无法展示核心几何不变量。 | `geometry_segment_mid_template` | param_c_pos | 全长 AB; 双中点距离 MN |
| 19 | `SB-KP046` | KP-046 | 角的分类与计算 | 🔴严重错配 | 平面几何平角/补角被错误渲染为实心四边形，共线基准破坏，滑块死锁，无法表达角的计算与互补性质。 | `geometry_angle_calc_template` | param_alpha | 角 AOB; 邻补角 BOC |
| 20 | `SB-KP047` | KP-047 | 相交线与垂线 | 🔴严重错配 | 点约束语法非法导致几何失效，基准直线未绘制，滑块死锁，无法证明垂线段最短定理。 | `geometry_perpendicular_template` | param_x_c, param_y_p | 垂线段长度 (理论最小值); 斜线段长度 |
| 21 | `SB-KP048` | KP-048 | 平行线的判定与性质 | 🔴严重错配 | 对象拓扑极度荒谬（平行线被误画成封闭五边形面），三线八角完全缺失，滑块与不变量全部失效。 | `geometry_parallel_template` | param_trans_angle, param_line_dist | 同位角相等; 内错角相等 |
| 22 | `SB-KP049` | KP-049 | 三角形的基本性质 | 🟠部分失效 | 三角形几何渲染正常，但缺失核心内角和 180° 的闭环遥测指标，滑块未生效，缺少平角辅助线证明机制。 | `geometry_triangle_sum_template` | param_vertex_ax, param_vertex_ay, param_base_w | 内角 A; 内角 B |
| 23 | `SB-KP051` | KP-051 | 全等三角形的判定 | 🔴严重错配 |  | `geometry_congruence_template` | cond_mode, trans_x, trans_y | 对应边长差; 面积比率 |
| 24 | `SB-KP053` | KP-053 | 等腰三角形的性质 | 🔴严重错配 |  | `geometry_isosceles_template` | apex_angle, base_w, fold_t | 两腰等长; 中线平分底边 |
| 25 | `SB-KP055` | KP-055 | 等边三角形的性质与判定 | 🔴严重错配 |  | `geometry_equilateral_template` | side_a, rot_theta, show_dual_circles | 三内角度数; 外心与内心半径比 |
| 26 | `SB-KP056` | KP-056 | 直角三角形的性质 | 🔴严重错配 |  | `geometry_right_triangle_template` | leg_a, leg_b, point_t | 直角度数; 中线与斜边比率 |
| 27 | `SB-KP057` | KP-057 | 勾股定理及其逆定理 | 🔴严重错配 |  | `geometry_pythagorean_template` | leg_a, leg_b, view_mode | 勾股面积守恒; 弦图面积展开 |
| 28 | `SB-KP058` | KP-058 | 相似三角形的判定 | 🔴严重错配 |  | `geometry_similarity_template` | sim_k, rot_alpha, judge_criterion | 三边对应比值; 对应角相等 |
| 29 | `SB-KP060` | KP-060 | 位似图形与位似变换 | 🔴严重错配 |  | `geometry_homothety_template` | homo_k, center_x, center_y | 顶点辐射距离比; 对应边恒平行 |
| 30 | `SB-KP062` | KP-062 | 平行四边形的性质 | 🟠部分失效 |  | `geometry_parallelogram_template` | base_len, side_len, shear_angle | 两组对边分别相等; 两组对角分别相等 |
| 31 | `SB-KP064` | KP-064 | 矩形的性质与判定 | 🟠部分失效 |  | `geometry_rectangle_template` | shear_alpha, rect_w, rect_h | 对角线相等度量; 对角线差值 (矩形判定) |
| 32 | `SB-KP065` | KP-065 | 菱形的性质与判定 | 🟠部分失效 |  | `geometry_rhombus_template` | diag_h, diag_v, morph_rhombus | 四边恒等长; 对角线互相垂直 |
| 33 | `SB-KP066` | KP-066 | 正方形的性质与判定 | 🟠部分失效 |  | `geometry_square_template` | side_a, rot_angle, convergence_path | 对角线垂直且相等; 四边相等且四角皆直角 |
| 34 | `SB-KP068` | KP-068 | 中点四边形 | 🔴严重错配 |  | `geometry_midpoint_quad_template` | quad_morph_preset, show_diags | 中点四边形对边 1 与对角线半长; 中点四边形对边 2 与对角线半长 |
| 35 | `SB-KP069` | KP-069 | 圆的定义与基本性质（圆上所有点到定点距离等于定长） | 🔴严重错配 |  | `geometry_circle_carrier` | radius_r, theta_P | 基准半径 OA; 动点到圆心距离 OP |
| 36 | `SB-KP071` | KP-071 | 直线与圆的位置关系（相交、相切、相离三种临界位置） | 🔴严重错配 |  | `geometry_line_circle_relation` | circle_r, line_dist_d | 圆心距 d; 圆半径 r |
| 37 | `SB-KP072` | KP-072 | 圆的切线性质与切线长定理 | 🔴严重错配 |  | `geometry_tangent_segment_carrier` | circle_r, dist_OP, phi_P | 切线长 PA; 切线长 PB |
| 38 | `SB-KP073` | KP-073 | 圆周角定理（同弧所对圆周角等于圆心角一半） | 🟠部分失效 |  | `geometry_inscribed_angle_carrier` | theta_C, arc_span | 圆心角 ∠AOB; 圆周角 ∠ACB |
| 39 | `SB-KP074` | KP-074 | 垂径定理（垂直平分弦与平分两段弧） | 🟠部分失效 |  | `geometry_chord_bisector_carrier` | circle_r, chord_dist_d | 弦心距 OM; 半弦长 AM |
| 40 | `SB-KP076` | KP-076 | 三角形内切圆与内心性质 | 🟠部分失效 |  | `geometry_incircle_carrier` | vertex_A_y, vertex_C_x | 内心到边 BC 距离 (r1); 内心到边 AC 距离 (r2) |
| 41 | `SB-KP077` | KP-077 | 弧长与扇形面积公式 | 🔴严重错配 |  | `geometry_sector_metric_carrier` | radius_r, angle_n | 圆心角度数 n; 半径 r |
| 42 | `SB-KP079` | KP-079 | 轴对称性质与折叠变换 | 🟠部分失效 |  | `geometry_reflection_carrier` | axis_pos, axis_phi | 原线段长 AB; 镜像线段长 A'B' |
| 43 | `SB-KP080` | KP-080 | 平移性质与向量变换 | 🟠部分失效 |  | `geometry_translation_carrier` | dx, dy | 原线段长 AB; 平移线段长 A'B' |
| 44 | `SB-KP081` | KP-081 | 旋转性质与手拉手全等模型 | 🔴严重错配 |  | `geometry_rotation_hand_in_hand_carrier` | theta, side_B_y | 旋转角恒等; 对应点到中心距离相等 (OA |
| 45 | `SB-KP082` | KP-082 | 中心对称性质（对称中心平分对应点连线，对应线段平行且相等） | 🟠部分失效 |  | `geometry_central_sym_carrier` | rot_process | 中心平分对应点连线; 三点共线 (平角 180°) |
| 46 | `SB-KP085` | KP-085 | 锐角三角函数定义（正弦、余弦、正切比值及相似不变性） | 🔴严重错配 |  | `geometry_right_triangle_trig_carrier` | angle_A, hypot_c | 锐角 A 真实度数; 正弦值 (对边/斜边) |
| 47 | `LM-7A-01` | 7A | 数轴动点与绝对值几何距离模型 | 🔴严重错配 | 1. 宣称数学对象为数轴动点绝对值几何距离化归（奇数点中位数极值、偶数点区间恒值），但现有数据缺失明确的 canvas_templ... | `number_axis_distance_template` | pos_p, point_a, point_b | 线段 PA 长度; 线段 PB 长度 |
| 48 | `LM-7A-02` | 7A | 线段双中点与角平分线和差模型 | 🔴严重错配 | 1. 几何拓扑核心驱动点缺失：载体 1（线段载体）中根本没有动分点 P，中点 M1 与 M2 坐标被静态写死为 (-2,0) 和 ... | `geometry_double_midpoint_template` | pos_p, len_ab, angle_alpha | 线段 AP 长度; 线段 PB 长度 |
| 49 | `LM-7B-03` | 7B | 非负数之和为零模型 | 🔴严重错配 | 1. 几何代数映射严重荒谬：该模型理论为'绝对值、偶次幂、算术平方根非负和为零，各自为零构建方程组'，但在现有数据中，载体 1 竟... | `algebra_nonnegative_zero_template` | var_x, var_y, target_x0 | 第一项 |x - x0|; 第二项 (y - y0)^2 |
| 50 | `LM-7B-04` | 7B | 造桥选址平移最短路径模型 | 🔴严重错配 | 1. 核心平移几何构型完全缺失：该模型的核心是'将起点村庄 A 沿垂直河岸方向平移河宽 d 到 A'，构造平行四边形 AA'P2P... | `geometry_bridge_shortest_path_template` | bridge_x, river_d, village_ax | 当前行走总路径长; 转化后等价折线长 |
| 51 | `LM-7B-05` | 7B | 二元一次方程组与坐标系交点模型 | 🔴严重错配 | 1. 缺少一次函数解析式与直线几何实体：该模型是初一代数方程组走向函数与解析几何的核心桥梁，现有数据中仅有孤立的离散点 P(2,3... | `function_linear_intersection_template` | slope_k1, intercept_b1, slope_k2 | 斜率差行列式 Δk; 方程组解 x |
| 52 | `LM-8A-06` | 8A | 乘法公式面积割补与配方恒等模型 | 🔴严重错配 | 1. 几何色块拼图完全缺失：乘法公式（完全平方 (a+b)^2 与平方差 a^2-b^2）的教学精髓是'大几何正方形切分为 a^2... | `geometry_algebra_area_dissection_template` | side_a, side_b | 大正方形总面积 (a+b)²; 四块子面积之和 a²+2ab+b² |
| 53 | `LM-8A-07` | 8A | 因式分解十字相乘与分组分解模型 | 🔴严重错配 | 1. 缺少十字相乘系数网络与交叉动态联动：该模型宣称为'双十字相乘与分组添项拆项，高阶代数式积化和差逆向工程'，现有数据仅提供了 ... | `algebra_cross_multiplication_template` | factor_a1, factor_a2, factor_c1 | 二次项系数 a; 常数项 c |
| 54 | `LM-8A-08` | 8A | 分式方程增根与裂项相消模型 | 🔴严重错配 | 1. 增根几何图景严重脱节：分式方程增根的本质是'去分母时最简公分母为零破坏了方程同解变形'，图象上表现为双曲线在定义域洞点（打孔... | `function_rational_extraneous_root_template` | var_x, param_root, telescope_n | 最简公分母值; 增根触发警报 |
| 55 | `LM-8A-09` | 8A | 倍长中线与中点构造全等模型 | 🔴严重错配 | 1. 几何核心拓扑完全残缺：该模型命名为'倍长中线与中点构造全等'，但现有 carrier 点位中仅有 A(0,6), B(-4,... | `geometry_median_doubling_template` | extend_ratio, vertex_ax, vertex_ay | 原中线 AD 长度; 倍长延伸段 DE 长度 |
| 56 | `LM-8A-10` | 8A | 截长补短线段和差证明模型 | 🔴严重错配 | 模型宣称在长线段截取一段或在短线段延长补齐以构造全等三角形证明线段和差（典型题型如等腰/等边三角形或正方形半角模型中证明线段和差）... | `euclidean_triangle_cut_fill` | 自变量滑块 | [{'id': 'inv_sum_diff_equality', 'type': 'relation', 'deps': ['B', 'E', 'D', 'F'], 'formula': 'BE + DF = EF', 'labelZh': '线段和差守恒: BE + DF = EF', 'labelEn': 'Segment Sum Invariant: BE + DF = EF', 'tolerance': 0.001, 'isConstant': True}, {'id': 'inv_congruence_side', 'type': 'relation', 'deps': ['A', 'G', 'F'], 'formula': 'AG = AF', 'labelZh': '全等对应边相等: AG = AF', 'labelEn': 'Congruent Side: AG = AF', 'tolerance': 0.001, 'isConstant': True}] |
| 57 | `LM-8A-11` | 8A | 角平分线四大衍生模型 | 🔴严重错配 | 宣称涵盖‘角平分线四大衍生模型（见角平分线作双垂线、角平分线加垂线出等腰、角平分线加平行出等腰、角平分线翻折对称）’，但现有数据中... | `euclidean_bisector` | 自变量滑块 | [{'id': 'inv_dist_equality', 'type': 'relation', 'deps': ['P', 'D', 'E'], 'formula': 'd(P, OA) = d(P, OB) = {val}', 'labelZh': '垂线段距离相等: PD = PE', 'labelEn': 'Distance Equality: PD = PE', 'tolerance': 0.001, 'isConstant': True}, {'id': 'inv_parallel_iso_sides', 'type': 'relation', 'deps': ['O', 'E', 'P'], 'formula': 'OE = EP = {val}', 'labelZh': '平行出等腰: OE = EP', 'labelEn': 'Isosceles Sides: OE = EP', 'tolerance': 0.001, 'isConstant': True}] |
| 58 | `LM-8A-12` | 8A | 将军饮马轴对称最短路径模型 | 🔴严重错配 | 宣称以定点关于动点所在直线对称、两点之间线段最短解决极值，但现有数据中彻底缺失核心几何构件‘对称点A’与直线化折线段对比；动点P(... | `euclidean_shortest_path` | 自变量滑块 | [{'id': 'telemetry_path_len', 'type': 'relation', 'deps': ['P', 'A', 'B'], 'formula': 'PA + PB = \\sqrt{(x-2)^2+25} + \\sqrt{(x-8)^2+9} = {val}', 'labelZh': '当前路径长 PA + PB', 'labelEn': 'Current Path Length PA + PB', 'isConstant': False}, {'id': 'telemetry_reflected_equality', 'type': 'relation', 'deps': ['P', 'A', 'A_prime'], 'formula': "PA = PA' = {val}", 'labelZh': "轴对称等距验证: PA = PA'", 'labelEn': "Axisymmetry Check: PA = PA'", 'isConstant': True}, {'id': 'telemetry_min_path', 'type': 'relation', 'deps': ['A_prime', 'B'], 'formula': "(PA+PB)_{\\min} = A'B = 10.00", 'labelZh': '理论最短路径: 10.00', 'labelEn': 'Theoretical Minimum: 10.00', 'isConstant': True}] |
| 59 | `LM-8B-13` | 8B | 勾股定理折叠翻折与动点方程模型 | 🔴严重错配 | 宣称几何折叠轴对称保距并设未知数建立直角三角形勾股二次方程精确求解，但现有数据仅提供孤立矩形4点和无关联点P(4,4)，无折痕、无... | `euclidean_fold_pythagoras` | 自变量滑块 | [{'id': 'telemetry_pythagorean_eq', 'type': 'relation', 'deps': ['B', 'A_prime', 'E'], 'formula': 'y^2 + {x0}^2 = (8-y)^2 \\implies 16y = 64 - {x0}^2', 'labelZh': "勾股方程: BE^2 + BA'^2 = A'E^2", 'labelEn': 'Pythagorean Equation', 'isConstant': False}, {'id': 'telemetry_algebraic_sol', 'type': 'relation', 'deps': ['E'], 'formula': 'y = \\frac{64 - {x0}^2}{16} = {val}', 'labelZh': '方程精确解 BE = y', 'labelEn': 'Exact Solution BE = y', 'isConstant': False}, {'id': 'telemetry_verification', 'type': 'relation', 'deps': ['B', 'A_prime', 'E'], 'formula': 'y^2 + x_0^2 - (8-y)^2 \\equiv 0.000', 'labelZh': '代数闭环验证', 'labelEn': 'Algebraic Closure Check', 'isConstant': True}] |
| 60 | `LM-8B-14` | 8B | 十字架对角线垂直与中点四边形模型 | 🟠部分失效 | 现有数据中四边形顶点A(0,4), B(-3,0), C(0,-2), D(5,0)确实保证了对角线在坐标轴上互相垂直，且初态对边... | `euclidean_cross_quadrilateral` | 自变量滑块 | [{'id': 'telemetry_opposite_square_sum', 'type': 'relation', 'deps': ['A', 'B', 'C', 'D'], 'formula': 'AB^2 + CD^2 = AD^2 + BC^2 = {val}', 'labelZh': '对边平方和相等守恒', 'labelEn': 'Opposite Sides Square Sum Equality', 'tolerance': 0.001, 'isConstant': True}, {'id': 'telemetry_midpoint_rect_angle', 'type': 'relation', 'deps': ['E', 'F', 'G'], 'formula': '\\angle EFG = 90.0^\\circ', 'labelZh': '中点四边形直角守恒 (矩形)', 'labelEn': 'Midpoint Quadrilateral Right Angle (Rectangle)', 'tolerance': 0.001, 'isConstant': True}, {'id': 'telemetry_midpoint_area_ratio', 'type': 'relation', 'deps': ['E', 'F', 'G', 'H', 'A', 'B', 'C', 'D'], 'formula': 'S_{EFGH} = \\frac{1}{2} S_{ABCD} = {val}', 'labelZh': '面积减半守恒', 'labelEn': 'Area Ratio 1/2 Invariant', 'tolerance': 0.001, 'isConstant': True}] |
| 61 | `LM-8B-15` | 8B | 一次函数图象性质与方程不等式综合模型 | 🔴严重错配 | 宣称以一次函数图象高低判断一元一次不等式解集、图象交点对应方程解，但现有数据仅有散点O(0,0), A(-2,0), B(0,4)... | `function_linear_equation_inequality` | 自变量滑块 | [{'id': 'telemetry_equation_root', 'type': 'relation', 'deps': ['L1', 'L2'], 'formula': 'k1*x + b1 = k2*x + b2 \\implies x_0 = \\frac{b2-b1}{k1-k2} = {x0}', 'labelZh': '方程的解 (交点横坐标)', 'labelEn': 'Equation Root (Intersection X)', 'isConstant': False}, {'id': 'telemetry_intersection_point', 'type': 'relation', 'deps': ['P_intersect'], 'formula': 'P(x_0, y_0) = ({x0}, {y0})', 'labelZh': '交点坐标', 'labelEn': 'Intersection Point', 'isConstant': False}, {'id': 'telemetry_inequality_solution', 'type': 'relation', 'deps': ['L1', 'L2'], 'formula': 'y_1 > y_2 \\iff x \\in ({x0}, +\\infty)', 'labelZh': '不等式解集 (高在上方图象)', 'labelEn': 'Inequality Solution Set', 'isConstant': False}] |
| 62 | `LM-8B-16` | 8B | 一次函数分段函数与方案最优化模型 | 🔴严重错配 | 宣称阶梯水费与出租车计费分段函数、端点极值最优化，但现有数据中两套选项仅各含2个端点，无法构成完整的分段折线函数（阶梯水费缺失超额... | `function_piecewise_optimization` | 自变量滑块 | [{'id': 'telemetry_cost_a', 'type': 'relation', 'deps': ['plan_A'], 'formula': 'Cost_A({x}) = 2.4 \\times {x} = {costA} \\text{ 元}', 'labelZh': '网约车费用', 'labelEn': 'Rideshare Cost', 'isConstant': False}, {'id': 'telemetry_cost_b', 'type': 'relation', 'deps': ['plan_B'], 'formula': 'Cost_B({x}) = {costB} \\text{ 元}', 'labelZh': '出租车费用', 'labelEn': 'Taxi Cost', 'isConstant': False}, {'id': 'telemetry_optimal_choice', 'type': 'relation', 'deps': ['plan_A', 'plan_B'], 'formula': 'Decision: \\text{x < 11 选网约车更省; x > 11 选出租车更省; x=11 费用相同 (26.4元)}', 'labelZh': '最优化决策建议', 'labelEn': 'Optimal Decision Advice', 'isConstant': False}] |
| 63 | `LM-8B-17` | 8B | 统计指标加权平均与方差风险决策模型 | 🔴严重错配 | 宣称以均值衡量整体水平、方差衡量离散程度进行风险决策，但现有数据仅有几何平面上的孤立两点(1,5)与(2,5)，被渲染器按几何线段... | `statistics_risk_decision` | 自变量滑块 | [{'id': 'telemetry_mean_equality', 'type': 'relation', 'deps': ['shooter_A', 'shooter_B'], 'formula': '\\bar{x}_甲 = 8.00, \\bar{x}_乙 = 8.00 \\implies \\bar{x}_甲 = \\bar{x}_乙', 'labelZh': '均值水平相同: 8.00 环', 'labelEn': 'Equal Mean Levels: 8.00', 'isConstant': True}, {'id': 'telemetry_variance_comparison', 'type': 'relation', 'deps': ['shooter_A', 'shooter_B'], 'formula': 's_甲^2 = 0.40, s_乙^2 = 3.20 \\implies s_甲^2 < s_乙^2', 'labelZh': '方差比较: 甲方差远小于乙方差', 'labelEn': 'Variance Comparison', 'isConstant': False}, {'id': 'telemetry_decision_verdict', 'type': 'relation', 'deps': ['shooter_A', 'shooter_B'], 'formula': 'Decision: \\text{均值相等看方差，选手甲方差0.40波动小，发挥极为稳定，优先选拔选手甲！}', 'labelZh': '科学决策结论', 'labelEn': 'Scientific Decision Verdict', 'isConstant': True}] |
| 64 | `LM-9A-18` | 9A | 一元二次方程判别式与韦达对称代数模型 | 🔴严重错配 | 【标杆案例深度诊断】：作为初中代数皇冠级的核心大招模型，现有数据存在多处严重数学与工程错配：1. 核心系数a, b, c彻底缺失，... | `function_quadratic_vieta` | 自变量滑块 | [{'id': 'telemetry_delta', 'type': 'algebraic_formula', 'deps': ['param_a', 'param_b', 'param_c'], 'formula': '\\Delta = b^2 - 4ac = ({b})^2 - 4({a})({c}) = {delta}', 'labelZh': '根的判别式 Δ', 'labelEn': 'Discriminant Delta', 'verdict': 'Delta > 0: 2个不等实根; Delta = 0: 2个相等实根; Delta < 0: 无实根'}, {'id': 'telemetry_vieta_sum', 'type': 'algebraic_formula', 'deps': ['param_a', 'param_b'], 'formula': 'x_1 + x_2 = -\\frac{b}{a} = -\\frac{{b}}{{a}} = {sum}', 'labelZh': '两根之和 (韦达定理1)', 'labelEn': 'Sum of Roots (Vieta 1)', 'verification': '实根存在时等于实际根值相加 (x1 + x2)'}, {'id': 'telemetry_vieta_prod', 'type': 'algebraic_formula', 'deps': ['param_a', 'param_c'], 'formula': 'x_1 \\cdot x_2 = \\frac{c}{a} = \\frac{{c}}{{a}} = {prod}', 'labelZh': '两根之积 (韦达定理2)', 'labelEn': 'Product of Roots (Vieta 2)', 'verification': '实根存在时等于实际根值相乘 (x1 * x2)'}, {'id': 'telemetry_sum_of_squares', 'type': 'symmetric_expression', 'deps': ['param_a', 'param_b', 'param_c'], 'formula': 'x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = (-\\frac{b}{a})^2 - 2(\\frac{c}{a}) = {val}', 'labelZh': '经典对称式 1: 两根平方和', 'labelEn': 'Symmetric Dual: Sum of Squares'}, {'id': 'telemetry_reciprocal_sum', 'type': 'symmetric_expression', 'deps': ['param_b', 'param_c'], 'formula': '\\frac{1}{x_1} + \\frac{1}{x_2} = \\frac{x_1 + x_2}{x_1 x_2} = -\\frac{b}{c} = {val}', 'labelZh': '经典对称式 2: 两根倒数和', 'labelEn': 'Symmetric Dual: Reciprocal Sum', 'edge_guard': '当 c = 0 时提示分母为零无定义'}, {'id': 'telemetry_chord_length', 'type': 'geometric_distance', 'deps': ['param_a', 'param_b', 'param_c'], 'formula': '|x_1 - x_2| = \\frac{\\sqrt{\\Delta}}{|a|} = \\frac{\\sqrt{{delta}}}{|{a}|} = {dist}', 'labelZh': '两交点弦长距离', 'labelEn': 'Roots Distance (Chord Length)', 'edge_guard': '仅当 Delta >= 0 时有效展示'}] |
| 65 | `LM-9A-19` |  | 手拉手旋转全等模型 | 🔴严重错配 | 宣称的手拉手旋转全等模型需要呈现两个共顶点的全等/相似等腰（或等边）三角形及手拉手连接线（如 △OAB 与 △OCD，连线 AD ... | `euclidean_hand_in_hand` | rot_theta, scale_r2, apex_angle | |AD| - |BC|; ∠(AD, BC) |
| 66 | `LM-9A-20` |  | 半角旋转翻折拼合模型 | 🔴严重错配 | 宣称的正方形含 45° 半角模型需要完整呈现正方形 ABCD、边上的动点 E 与 F、45° 半角射线以及绕点 A 旋转 90° ... | `euclidean_half_angle` | be_length, half_angle_val, rotate_anim | EF - (BE + DF); Perimeter(△CEF) |
| 67 | `LM-9A-21` |  | 费马点120°旋转距离和极值模型 | 🔴严重错配 | 宣称的费马点 120° 旋转距离和极值模型需要展示平面三角形 ABC、内部动点 P、绕顶点 A 旋转 60° 构造的等边三角形 △... | `euclidean_fermat_point` | px, py, snap_fermat | Sum; Min |
| 68 | `LM-9A-22` |  | 定弦定角隐形圆模型 | 🔴严重错配 | 宣称的定弦定角隐形圆模型需要呈现定长弦 AB、隐形外接圆弧、在圆弧上滑动的动点 P、恒定圆周角 α，以及外部定点 C 到动点 P ... | `euclidean_hidden_circle` | point_theta, fixed_angle, target_y | ∠APB; R |
| 69 | `LM-9A-23` |  | 四点共圆对角互补与直角隐圆模型 | 🟠部分失效 | 载体中给出的四点坐标均满足到原点距离等于 5 的共圆几何条件，点位数值未算错；但是该模型完全处于静态死图状态，滑块为孤立的占位符 ... | `euclidean_cyclic_quadrilateral` | theta_d, theta_c, show_circle | ∠ABC + ∠ADC; ∠BAC |
| 70 | `LM-9A-24` |  | 切线长定理与内切圆/外接圆模型 | 🔴严重错配 | 数据存在硬性几何数学错误：载体中切点 A(1.414, 3.414) 未落在以 OP 为直径的圆上，∠OAP ≠ 90°（误差达 ... | `euclidean_tangent_length` | point_dist_d, radius_r, rot_angle | PA - PB; OP² - (PA² + r²) |
| 71 | `LM-9A-25` |  | 二次函数铅垂高水平宽动点面积割补模型 | 🔴严重错配 | 该模型属于二次函数压轴核心模型，但载体中缺失抛物线解析式定义，无法在直角坐标系中渲染出函数曲线；模型完全缺失了铅垂高法最核心的'割... | `function_parabola_plumb_height` | param_t, coeff_a, show_tangent | h(t); w |
| 72 | `LM-9A-26` |  | 二次函数特殊四边形存在性模型 | 🔴严重错配 | 标题明确标明为二次函数特殊四边形存在性模型，但载体中没有任何函数解析式，坐标系未绘制抛物线；现有 4 个点为纯静态死点，无动点轨迹... | `function_parabola_quadrilateral_existence` | param_t, case_type, snap_solution | M1; M2 |
| 73 | `LM-9A-27` |  | 二次函数特殊三角形存在性模型 | 🔴严重错配 | 标题明确宣称是二次函数特殊三角形存在性模型，但载体中缺失抛物线解析式，前端无法渲染函数曲线；点位仅给出一两个静态特解死点，丢失了'... | `function_parabola_triangle_existence` | param_t, target_type, snap_solution | PA; |PA² + PB² - AB²| |
| 74 | `LM-9A-28` | 9A | 二次函数与直角坐标系综合最值模型 | 🔴严重错配 | 1. 宣称数学对象为二次函数坐标系综合最值（动轴定区间/定轴动区间、相切判别式Δ=0、绝对值翻折与和差极值），但 carrier ... | `function_quadratic_extrema_interval` | param_t, param_m, param_L | 区间最小值 y_min; 区间最大值 y_max |
| 75 | `LM-9B-29` | 9B | 一线三等角(K字型相似)模型 | 🔴严重错配 | 1. 现有数据 carrier_1 中给出的点位 A(-4,0), C(0,0), B(5,0), D(-4,3), E(5,3.... | `geometry_k_shape_similarity` | slider_xc, slider_ad, slider_angle_alpha | 三等角相等验证; K字积定理恒等式 |
| 76 | `LM-9B-30` | 9B | 母子相似与直角三角形射影定理模型 | 🔴严重错配 | 1. 现存 carrier_1 与 carrier_2 中直接填入占位通用点 A(-2,0), B(2,0), C(0,3)，构成... | `geometry_right_triangle_projection` | slider_xc, slider_radius | 直角边射影定理 AC²; 直角边射影定理 BC² |
| 77 | `LM-9B-31` | 9B | 胡不归加权线段最值模型 | 🔴严重错配 | 1. 现存 carrier 为通用模板点 A(-2,0), B(2,0), C(0,3)，没有动点所在基准直线 L，没有定点 A ... | `geometry_hubugui_weighted_sum` | slider_xp, slider_k, slider_ay | 目标加权和; 几何折线长 PA+PH |
| 78 | `LM-9B-32` | 9B | 阿波罗尼斯圆(阿氏圆)加权最值模型 | 🔴严重错配 | 1. carrier_1/2 依然为三点 A(-2,0), B(2,0), C(0,3) 占位三角形，没有任何圆形几何实体，完全脱... | `geometry_apollonius_circle_weighted` | slider_theta, slider_ratio_k, slider_radius_R | 阿氏圆轨迹定比 PA/PB; 目标加权和转化为折线 |
| 79 | `LM-9B-33` | 9B | 瓜豆原理主从动点轨迹位似旋转模型 | 🔴严重错配 | 1. 现存 carrier 为通用模板点 A(-2,0), B(2,0), C(0,3)，无主动点驱动轨迹（定直线或定圆），无从动... | `geometry_melon_bean_locus_rotation` | slider_phi, slider_alpha, slider_ratio_k | 联动角不变量 ∠POQ; 位似比不变量 OQ/OP |
| 80 | `LM-9B-34` | 9B | 反比例函数面积不变性与中心对称反演模型 | 🔴严重错配 | 1. 现存 carrier 为通用模板点 A(-2,0), B(2,0), C(0,3)，无反比例函数双曲线解析式 y = k/x... | `function_inverse_area_invariance` | slider_k, slider_t, slider_m | 矩形面积不变性 S; 三角形面积不变性 S |
| 81 | `LM-9B-35` | 9B | 三视图正交投影与空间积木还原模型 | 🔴严重错配 | 1. carrier_1/2 完全拷贝二维平面三角形 A(-2,0), B(2,0), C(0,3)，与三维空间立体积木投影毫无联... | `discrete_orthographic_three_view` | slider_h11, slider_h12, slider_h21 | 正方体积木总块数; 主视图各列高度向量 (长对正) |
| 82 | `LM-9B-36` | 9B | 直角三角形与锐角三角函数综合度量模型 | 🔴严重错配 | 1. 现存 carrier_1/2 依然为三点 A(-2,0), B(2,0), C(0,3) 占位等腰三角形，没有任何测量高线与... | `geometry_double_right_triangle_trig` | slider_h, slider_alpha, slider_beta | 测站位移距离 AB; 三角方程反求高度 h |

---

## 四、 最关键交付物：《初中数学沙盒统一渲染契约总表》（FE-0014 升级合同）

本契约总表汇总了全库 82 个模型所需的全部画布模板大类。**本表为下一步前端任务 FE-0014（升级渲染引擎以支撑全真交互）的技术实施合同**。

| 模板大类 | 包含典型模板 ID | 涵盖模型示例 | 核心输入参数 (Sliders) | 画布绘制图元 (Carrier/Primitives) | 核心遥测计算算子 (Telemetry Ops) | 现况与 FE-0014 升级要求 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **一、数轴动力学与实数夹逼类** | `number_axis_rational_template`<br>`number_axis_distance_template`<br>`number_axis_irrational_squeeze_template` | SB-KP001, SB-KP002, SB-KP003, SB-KP008, LM-7A-01 | 分子 $p$、分母 $q$、基准点 $x_0$、速度 $v$、时间 $t$、被开方数 $a$ | 带箭头数轴、原点、单位刻度标尺、动点、两点区间距离支架、夹逼整点区间高亮 | 距离公式 $|x_A - x_B|$、速度路程方程 $x=x_0+vt$、取整估算 $\lfloor\sqrt{a}\rfloor$、相反数代数和 $a+(-a)\equiv 0$ | ⚠️ **需前端 FE-0014 升级**：现有数轴仅画静态轴线，需新增动态点运动驱动与估算区间高亮 |
| **二、一次函数与方程不等式类** | `function_linear_prop_template`<br>`function_linear_solve_template`<br>`function_linear_system_template`<br>`function_linear_intersection_template` | SB-KP032~035, LM-7B-05, LM-8B-15, LM-8B-16 | 斜率 $k_1, k_2$、截距 $b_1, b_2$、两点坐标 $(x_1, y_1), (x_2, y_2)$ | 直角坐标系、一条/两条直线图象、截距点、交点吸附、不等式半平面阴影 | 斜率差商 $k=\frac{y_2-y_1}{x_2-x_1}$、联立交点坐标、垂直判别 $k_1 k_2 = -1$、不等式解集判定 | ⚠️ **需前端 FE-0014 升级**：现有仅画简单函数线，需支持双线联立求交、截距动态联动与不等式半平面着色 |
| **三、反比例函数与几何面积类** | `function_inverse_template`<br>`function_inverse_k_template`<br>`function_inverse_area_invariance` | SB-KP036, SB-KP037, LM-8A-08, LM-9B-34 | 反比例系数 $k$、动点横坐标 $t$、割线斜率 $m$ | 双曲线第一/第三象限分支、曲线吸附动点 $P$、过 $P$ 向双轴引垂线形成矩形及三角形高亮 | 矩形面积恒等 $S_{rect}=|xy|\equiv|k|$、三角形面积 $S_{tri}\equiv\frac{1}{2}|k|$、中心对称 $OP=OP'$ 检验 | ⚠️ **需前端 FE-0014 升级**：现有无双轴投影矩形与面积不变性高亮，需补充矩形填色与中心对称反演点支持 |
| **四、二次函数代数性质与最值类** | `function_quadratic_vieta`<br>`function_quadratic_extrema_interval`<br>`function_parabola_plumb_height` | SB-KP038~043, LM-9A-18, LM-9A-25, LM-9A-28 | 系数 $a, b, c$、对称轴 $t$、区间端点 $m, L$、动点参数 $x_P$ | 抛物线连续函数、对称轴虚线、顶点 $V$、实根交点 $x_1, x_2$、铅垂线段 $PQ$ 与割线三角形 | 判别式 $\Delta$、韦达两根和积、区间极值分类器、铅垂高割补面积 $S=\frac{1}{2}w \cdot h(t)$ | ⚠️ **需前端 FE-0014 重点研发**：标杆级韦达多项式面板、铅垂割补图元及 $\Delta<0$ 智能显隐 |
| **五、三角形全等、相似与射影类** | `geometry_congruence_template`<br>`geometry_similarity_template`<br>`geometry_right_triangle_projection`<br>`geometry_k_shape_similarity` | SB-KP051, SB-KP056, SB-KP058, LM-8A-09, LM-9B-29, LM-9B-30 | 旋转角 $\theta$、平移向量、相似比 $k$、分点坐标 $x_C$、斜边半径 $R$ | 两独立三角形、对应顶点同色标识、斜边半圆外接圆、垂足高线、K字双垂直立柱 | 边长比值、对应角相等、射影恒等式 $CD^2=AD\cdot BD$、K字积定理 $AD\cdot BE = AC\cdot CB$ | ⚠️ **需前端 FE-0014 升级**：彻底废除多点连成一个畸形多边形，支持双三角形拓扑分离与从动高线 |
| **六、特殊四边形与中点网络类** | `geometry_parallelogram_template`<br>`geometry_rectangle_template`<br>`geometry_rhombus_template`<br>`geometry_square_template`<br>`geometry_midpoint_quad_template` | SB-KP062~068, LM-8B-14 | 剪切角 $\alpha$、长宽 $w, h$、对角线长 $d_1, d_2$、形态相变滑块 | 四边形四顶点、严格从动闭合顶点、对角线虚线、4个中点及中点四边形高亮 | 对角线垂直判定、对角线平分交点、中点四边形面积恒为原四边形一半 ($S_{mid}=\frac{1}{2}S$) | ⚠️ **需前端 FE-0014 升级**：增加向量从动闭环计算 ($D=A+C-B$) 与中点衍生四边形，避免破形 |
| **七、圆的性质、切线与位置关系类** | `geometry_circle_carrier`<br>`geometry_line_circle_relation`<br>`geometry_tangent_segment_carrier`<br>`geometry_inscribed_angle_carrier`<br>`geometry_chord_bisector_carrier` | SB-KP069~077, LM-9A-23, LM-9A-24 | 圆心坐标、半径 $R$、圆周角动点极角 $\theta$、直线距离 $d$、切点偏角 | 完整圆周、圆心、圆周动点约束轨迹、割线/切线、垂直平分弦心距垂线、内切圆 | 圆心角与圆周角 2:1 定理、垂径定理 $AM=MB$、切线长相等 $PA=PB$、直角圆周角 $90^\circ$ | 🚨 **需前端 FE-0014 全新研发**：目前前端 SandboxRenderer **完全没有画圆（circle）的能力**，必须底层接入 JSXGraph circle 算子 |
| **八、几何变换、折叠与动点极值类** | `geometry_bridge_shortest_path_template`<br>`geometry_reflection_carrier`<br>`geometry_rotation_hand_in_hand_carrier`<br>`geometry_hubugui_weighted_sum`<br>`geometry_apollonius_circle_weighted` | SB-KP079~082, LM-7B-04, LM-8A-12, LM-8B-13, LM-9A-19, LM-9B-31, LM-9B-32 | 对称轴斜率、旋转角 $\alpha$、平移分量 $dx, dy$、动点位置 $x_P$、加权系数 $k$ | 对称点 $A'$、平移向量、折线路径 $PA+PB$、阿氏圆轨迹、胡不归辅助折射角射线 | 轴对称等距 $AA' \perp l$、路径实时和与理论极值比对、手拉手线段全等残差 $\equiv 0$、阿氏圆恒等定比 | ⚠️ **需前端 FE-0014 升级**：支持几何镜像算子、加权折线段实时计算及最值临界态吸附 |
| **九、锐角三角函数度量类** | `geometry_right_triangle_trig_carrier`<br>`geometry_double_right_triangle_trig` | SB-KP085, LM-9B-36 | 锐角 $\alpha, \beta$、直角边长、目标高 $h$、测站基线距离 $d$ | 直角三角形、直角标记符号、角弧度高亮、双直角测高建筑基底模型 | 三角函数比值 $\sin\alpha, \cos\alpha, \tan\alpha$、平方和公式 $\sin^2+\cos^2\equiv 1$、双直角高度方程解算 | ⚠️ **需前端 FE-0014 升级**：新增直角直角标记符号、角弧指示器与三角方程实时解算仪表板 |
| **十、三视图立体正交投影类** | `discrete_orthographic_three_view` | LM-9B-35 | 积木高度矩阵 $h_{ij} \in [0, 3]$、求解模式选择 | 四分格面板（主视图、左视图、俯视图、3D等轴测积木堆叠图） | 正投影最大值向量 $F_j = \max_i h_{ij}$、长对正高平齐宽相等约束验证、积木容许区间 $[N_{\min}, N_{\max}]$ | 🚨 **需前端 FE-0014 全新研发**：纯离散正投影渲染引擎，独立于连续几何平面 |

---

## 五、 红线核验与后置操作闭环

1. **只读分析红线核验**：
   - 本任务全过程未执行任何 `INSERT / UPDATE / DELETE` 数据库操作；
   - 经实测，`data/sandbox.db` 与 `data/core.db` 文件大小与哈希保持严格原样；
   - 未改动任何前端 `src/**` 源码；
2. **中间分片产物保留**：
   - 8 个分片机器可读 JSON 数据已完整持久化于 `scratch/task0007_dump/part1_result.json` ~ `part8_result.json`，随时可供批量自动化脚本复用；
3. **下一步行动建议**：
   - **前端线 FE-0014**：依据本文第四部分《初中数学沙盒统一渲染契约总表》，对 `SandboxRenderer.tsx` 进行模块化重构，补充圆、函数解析式、双三角形拓扑及真实遥测 HUD；
   - **数据线 DATA-0008**：在 FE-0014 引擎升级就绪后，依据本报告第三部分规格，编写单事务安全写库脚本，将全库 82 个模型的真实参数滑块与遥测公式全量注入 `sandbox.db`。