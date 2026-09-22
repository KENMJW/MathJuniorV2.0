---
id: TASK-DATA-0008
line: datalayer
status: accepted
attempt: 1
created_by: Kiro
exec_machine: 另一台执行机（非主控机）
title: 沙盒模型数据全量回填 — 按DATA-0007规格+FE-0014契约总表为82模型写库正确canvas_template/系数滑块/遥测公式
model: default
concurrency: 4
---

# 任务：沙盒模型数据全量回填（数据线，另一台机器执行）

## 🚨 执行方式 + 跨机器 git 流程（务必遵守）
- **本任务在【另一台执行机】上执行。**
- **开工前必做**：
  1. `git checkout dev && git pull origin dev`（先拉 dev，主控机为唯一权威源）
  2. 先读 `.kiro/steering/collaboration-protocol.md`，重点看"主控机唯一权威源"跨机器铁律：❌ 不改 .gitignore/目录结构，❌ 不碰任务范围外文件，分片写 `tmp/data0008/` 而非 scratch 等被 gitignore 忽略的目录。
- **完成后必做**：`git add`（只加本任务改动文件）→ commit → `git pull --rebase origin dev` → `git push origin dev`。
- **model=default（Flash）**。**concurrency=4**：4 个子 Agent 各负责一批模型，各写独立 `tmp/data0008/partN.jsonl`；主 Agent 串行写库。

## 🎯 任务本质
FE-0014 已完成渲染引擎升级，10 大类模板全部就绪。本任务是**最后一步**：把 82 个模型（46 概念沙盒 + 36 跃迁模型）在数据库里的配置，从"孤立点+param_t"的旧套路，**按 DATA-0007 改造规格 + FE-0014 可用 canvas_template 全量写成正确数据**，使真机渲染时每个模型都能呈现其宣称的数学内容。

## 📋 依据（必须都读）
1. `.kiro/relay/datalayer/archive/RESULT-DATA-0007.md`
   - 第三节：82 模型逐个改造规格（canvas_template / 系数滑块 / 遥测公式 / 载体姿态语义 / 数学验算依据）
   - 第四节：渲染契约总表（10 大类模板的可用 canvas_template 标识）
2. `.kiro/relay/frontend/archive/RESULT-FE-0014.md`
   - 第五节：DATA-0008 可用 canvas_template 清单（引擎实际支持的模板标识）

## 🔒 写库铁律（严格遵守）
- **子 Agent 只读算 + 写 partN.jsonl**，严禁任何 DB 写操作。
- **主 Agent 汇总后单事务串行写库**：写前 `cp data/sandbox.db data/sandbox.db.bak_before_task0008`，写后校验守恒断言。
- **守恒断言**：concept_sandboxes 恒 46 行，leap_sandbox_models 恒 37 行（含 DATA-0006 新增的 LM-9B-37），非目标字段零变动。
- 写库后同步 `public/data/sandbox.db`。
- ❌ 不碰 `data/core.db`；❌ 不改任何 `src/**` 源码；❌ 不碰任何 SVG。

## 四分片划分（各写 tmp/data0008/partN.jsonl）

### 片1｜概念沙盒 SB-KP001 ~ SB-KP043（前23个）
按 DATA-0007 第三节各沙盒改造规格，回填：
- `canvas_template`：从旧的 euclidean/geometry_*/number_axis_* 改为正确的契约模板标识
- `param_sliders_json`：从通用 scale 改为正确的具名系数滑块（如 pos_p/slope_k/param_a 等）
- `invariants_display_json`：从旧的欧氏距离兜底改为对应数学定理的遥测公式（含 formula/deps/condition）
- `drag_points_json`：修正/补齐载体几何点位（如函数沙盒不再需要孤立点，几何沙盒修正从动约束）
- `viewbox_spec_json`：按数学对象调整视口范围（如函数类需 x∈[-10,10] y∈[-8,8]）

### 片2｜概念沙盒 SB-KP044 ~ SB-KP085（后23个）
同片1方法，重点：
- 圆类沙盒（SB-KP069~077）：`canvas_template` 改为 `geometry_circle` 系列，补充圆心半径等参数
- 三角函数类（SB-KP085）：改为 `geometry_right_triangle_measurement`

### 片3｜跃迁模型 LM-7A-01 ~ LM-8B-17（前18个）
按 DATA-0007 第三节各模型改造规格，回填 leap_sandbox_models：
- `carrier_morphing_json`：按规格重写 carrier options 的 points/elements，使其真正表达该数学对象
- `parameter_morphing_json`：从通用 `param_t` 改为正确的具名系数滑块（如 param_a/b/c、slope_k、inv_k、radius_r...）
- `posture_morphing_json`：语义对齐（如开口向上/下通过 a>0/a<0 驱动，而非错误的旋转180°）
- `camouflage_xray_json`：补齐 coreSkeleton.invariants 的正确遥测公式

### 片4｜跃迁模型 LM-9A-18 ~ LM-9B-37（后19个，含函数类重点模型）
同片3方法，重点：
- **LM-9A-18 韦达**：`mockLeapModels.ts` 里已有正确规格，数据库里也要同步写入（param_a/b/c + function_quadratic_vieta + 5条韦达遥测）
- LM-9A-25/26/27/28 二次函数系列：打通抛物线渲染通道
- LM-9B-34 反比例：写入 `function_inverse` + inv_k 滑块
- LM-9B-35 三视图：写入 `discrete_orthographic_three_view` + 积木高度滑块
- LM-9B-37（DATA-0006 新建概率模型）：核实数据是否已完整，如有不足补齐

## 可量化验收清单
- [ ] concept_sandboxes 46 行逐个有回填记录，`canvas_template` 全部改为契约模板标识（非旧 euclidean/通用几何模板）。
- [ ] leap_sandbox_models 37 行逐个有回填记录，`parameter_morphing_json` 全部含具名系数滑块（非通用 param_t）。
- [ ] LM-9A-18 韦达在 DB 里含 param_a/b/c + function_quadratic_vieta + 判别式遥测，独立查库核实。
- [ ] 守恒断言通过：concept=46 / leap=37 / 非目标字段零变动。
- [ ] `.bak` 备份存在，写库前已备份。
- [ ] 写库后同步 `public/data/sandbox.db`。
- [ ] `pnpm test` 全绿（不得因数据改动破坏现有测试）。
- [ ] RESULT 附：每片改动统计（改了多少行/字段）+ 守恒校验结果 + 抽查样本（至少 LM-9A-18/SB-KP038/SB-KP069 各字段实际值）。

## 🚫 红线
- ❌ 不碰任何 SVG；❌ 不改 src 源码；❌ 不改 core.db。
- ❌ 不改 .gitignore / 目录结构 / 主控机同步约定。
- ❌ 子 Agent 不写库（仅 jsonl）；写库由主 Agent 串行单事务。
- ❌ 分片写 `tmp/data0008/`，不得写 scratch/ 等被 gitignore 忽略的目录。

## 回写要求
1. 4 片各写 `tmp/data0008/part1~4.jsonl`。
2. 写 `.kiro/relay/datalayer/outbox/RESULT-DATA-0008.md`（逐片改动统计 + 守恒校验 + 抽查样本 + .bak 路径 + test 结果）。
3. `status` 改 `done`。
4. `git add`（只加本任务文件）→ commit → `git pull --rebase origin dev` → `git push origin dev`，告知用户"TASK-DATA-0008 完成"。
