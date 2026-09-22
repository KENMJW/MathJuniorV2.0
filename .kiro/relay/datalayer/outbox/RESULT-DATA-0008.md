---
id: RESULT-DATA-0008
task_id: TASK-DATA-0008
line: datalayer
status: done
model: default (Flash)
concurrency: 4
---

# RESULT-DATA-0008: 沙盒模型数据全量回填执行结果

## 1. 任务概述与执行机制
依据 `RESULT-DATA-0007.md`（改造规格）与 `RESULT-FE-0014.md`（契约模板清单与渲染引擎升级结果），本次任务对 `data/sandbox.db` 中全部 83 个沙盒模型（46 个概念沙盒 `concept_sandboxes` + 37 个跃迁模型 `leap_sandbox_models`）完成了全量数据回填与结构矫正。

严格遵守跨机器协作协议与红线：
- **并发规范**：启动 4 并发子 Agent，分别处理四分片并输出 `tmp/data0008/part1~4.jsonl`；
- **写库铁律**：子 Agent 仅执行只读分析与数据构造，主 Agent 在单事务下串行写库；
- **备份机制**：写库前完成备份，生成 `data/sandbox.db.bak_before_task0008`；
- **双库同步**：写库完成后原子同步至 `public/data/sandbox.db`；
- **红线遵守**：未修改任何 `src/**` 代码、未修改 `data/core.db`、未碰任何 SVG 文件、未修改 `.gitignore`。

---

## 2. 四分片回填明细统计

| 分片编号 | 负责范围 | 模型数量 | 产出分片文件 | 核心回填字段与改造内容 |
| :--- | :--- | :--- | :--- | :--- |
| **Part 1** | SB-KP001 ~ SB-KP051 | 23 个概念沙盒 | `tmp/data0008/part1.jsonl` | 替换旧通用 `geometry_*`/`euclidean`，写入 `number_axis_*`、`function_linear_*`、`function_inverse`、`function_quadratic_*` 等契约模板；回填具名滑块（`pos_p`、`slope_k`、`intercept_b`、`a_coeff` 等）与定理遥测公式。 |
| **Part 2** | SB-KP053 ~ SB-KP085 | 23 个概念沙盒 | `tmp/data0008/part2.jsonl` | 重点回填几何全等相似、圆类沙盒（`geometry_circle` 系列）及直角三角形量测（`geometry_right_triangle_measurement`）；注入 `radius_r`、`theta_P`、圆公理闭环及三角比遥测。 |
| **Part 3** | LM-7A-01 ~ LM-8B-17 | 18 个跃迁模型 | `tmp/data0008/part3.jsonl` | 消除旧伪参数 `param_t`，全面升级 `parameter_morphing_json` 为几何与代数具名参数；重写 `carrier_morphing_json` 载体点线；在 `camouflage_xray_json` 补齐核心骨架定理不变量。 |
| **Part 4** | LM-9A-18 ~ LM-9B-37 | 19 个跃迁模型 | `tmp/data0008/part4.jsonl` | 标杆模型 LM-9A-18（韦达对称模型）写入 `param_a/b/c` 与 5 大韦达遥测；二次函数系列（LM-9A-25~28）、反比例（LM-9B-34）、三视图（LM-9B-35 积木高度滑块）及新概率模型（LM-9B-37）全量就绪。 |

---

## 3. 守恒性校验与断言测试

主 Agent 在事务提交前后执行了全量守恒性与完整性断言：
1. **行数守恒断言**：
   - `concept_sandboxes` 总行数：**46 行**（恒等于 46，无漏行、无增行）；
   - `leap_sandbox_models` 总行数：**37 行**（含 DATA-0006 新建的 LM-9B-37，恒等于 37，无漏行、无增行）。
2. **非目标字段零篡改断言**：
   - 主键、关联网址、学期分级、分类关联、中英文描述等字段严格保持不变。
3. **备份完整性**：
   - 备份文件：`data/sandbox.db.bak_before_task0008`（大小 249,856 字节，可供任何时间点无损回滚）。
4. **双库一致性**：
   - `data/sandbox.db` 与 `public/data/sandbox.db` 保持完全一致（大小均为 335,872 字节）。

---

## 4. 重点样本实测查库数据

### 样本 1：LM-9A-18 一元二次方程判别式与韦达对称代数模型（标杆模型）
- **parameter_morphing_json**:
  ```json
  {
    "description": "二次函数与韦达系数",
    "sliders": [
      {
        "id": "param_a",
        "nameZh": "二次项系数 a",
        "nameEn": "Coefficient a",
        "min": -3.0,
        "max": 3.0,
        "default": 1.0,
        "step": 0.2,
        "unit": ""
      },
      {
        "id": "param_b",
        "nameZh": "一次项系数 b",
        "nameEn": "Coefficient b",
        "min": -6.0,
        "max": 6.0,
        "default": -2.0,
        "step": 0.5,
        "unit": ""
      },
      {
        "id": "param_c",
        "nameZh": "常数项 c",
        "nameEn": "Constant c",
        "min": -8.0,
        "max": 8.0,
        "default": -3.0,
        "step": 0.5,
        "unit": ""
      }
    ]
  }
  ```
- **camouflage_xray_json (coreSkeleton.invariants)**:
  - `delta_val`: 判别式 $\Delta = b^2 - 4ac$（`formula: "b^2 - 4*a*c"`）
  - `sum_roots`: 两根之和 $x_1 + x_2 = -b/a$（`condition: "Delta >= 0"`, `formula: "-b / a"`）
  - `prod_roots`: 两根之积 $x_1 \cdot x_2 = c/a$（`condition: "Delta >= 0"`, `formula: "c / a"`）
  - `sq_sum_roots`: 平方和 $x_1^2 + x_2^2 = (b^2 - 2ac)/a^2$（`condition: "Delta >= 0"`, `formula: "(b^2 - 2*a*c) / (a^2)"`）
  - `chord_len`: 弦长 $|x_1 - x_2| = \sqrt{\Delta}/|a|$（`condition: "Delta >= 0"`, `formula: "sqrt(Delta) / abs(a)"`）

### 样本 2：SB-KP038 二次函数三种表达式全息矩阵
- **canvas_template**: `function_quadratic_forms_template`
- **param_sliders_json**:
  - `a_coeff`: 开口系数 $a$ (min: -3, max: 3, default: 1, step: 0.2)
  - `param_h`: 顶点横坐标 $h$ (min: -4, max: 4, default: 1, step: 0.5)
  - `param_k`: 顶点纵坐标 $k$ (min: -6, max: 4, default: -4, step: 0.5)
- **invariants_display_json**:
  - `inv_vertex`: 几何极值与顶点 $(h, k)$
  - `inv_sym_axis`: 三种表达式全息矩阵对称轴 $x = h$
  - `inv_dist`: 两交点距离

### 样本 3：SB-KP069 圆的基本概念（定点定长轨迹）
- **canvas_template**: `geometry_circle`
- **param_sliders_json**:
  - `radius_r`: 基准半径 $r$ (min: 2.0, max: 7.0, default: 4.0, step: 0.5)
  - `theta_P`: 动点极角 $\theta_P$ (min: 0.0, max: 360.0, default: 45.0, step: 5.0)
- **invariants_display_json**:
  - `inv_base_OA`: 基准半径 $OA$
  - `inv_point_OP`: 动点到圆心距离 $OP$
  - `inv_circle_def`: 圆公理闭环 `abs(sqrt(P_x^2 + P_y^2) - radius_r) < 0.02 ? 'OP ≡ r' : '离轨'`

---

## 5. 自动化测试套件回归验证

执行全局自动化测试套件（Vitest）：
```bash
/Users/m1/.nvm/versions/node/v24.20.0/bin/npx vitest run
```
**测试结果**：
- **Test Files**: 40 passed (40)
- **Tests**: 206 passed (206)
- **Duration**: 3.83s
- **结论**：数据层的全量重构与回填与前端渲染引擎完全兼容，既有单元测试与契约属性测试 100% 通过（全绿）。
