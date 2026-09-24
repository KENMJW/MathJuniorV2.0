---
id: TASK-DATA-0013
line: datalayer
status: done
attempt: 1
created_by: Kiro (架构师/PM)
title: 概念与跃迁沙盒底层教研数据全量增强（剧情推演、语义着色、显式填充面与自适应探究步骤）
model: default
concurrency: 8
---

> **执行方式（硬性，遵照 collaboration-protocol §7）**：
> - **本机执行**（主控机本地数据线会话执行）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 8`（已获用户批准）：**利用 `invoke_subagent` 单次并发派发 8 个子 Agent**，分片处理 46 个概念沙盒与 37 个跃迁沙盒，各写独立的 `tmp/data0013/part_{1..8}.jsonl`。
> - **写库铁律**：子 Agent 只读 + 推理 + 写各自 jsonl，**严禁并发写 SQLite 数据库**。写库由**主 Agent 汇总后执行校验并在单事务内串行写入**。

# 任务：概念与跃迁沙盒底层教研数据全量增强

## 1. 目标

依据教学体验升级与重构决策，彻底解决目前“模块一（46 个概念沙盒）缺乏物理直觉与步骤化探究、模块三（37 个跃迁沙盒）缺乏出题人伪装拆解与剧情推演”的底层数据根源。

在**不改变现有主外键映射（零破坏）**的前提下，对 `data/sandbox.db` 的两个核心表完成教研数据全量增强：
1. **`concept_sandboxes` 表（共 46 行）**：
   - 注入数形语义着色（`color_semantics`：主变量蓝、次变量绿、目标变量橙、反例红）；
   - 注入声明式显式填充面与几何图元标记（`visual_elements_json`）；
   - 注入自适应 1~3 步结构化探究步骤（`inquiry_steps_json`，含目标达成条件与顿悟小结）。
2. **`leap_sandbox_models` 表（共 37 行）**：
   - 注入自适应 2~4 幕沉浸式剧情推演脚本（`story_stages_json`：原初骨架 ➜ 变式拉伸 ➜ 出题人伪装揭秘 ➜ 🩻 破案透视秒杀秘籍，并与 4D 状态机参数严格绑定）。

---

## 2. 数据库变更与 Schema 契约（主 Agent 前置执行）

主 Agent 写库前执行轻量加列（零破坏）：
```sql
-- 概念沙盒增加两列
ALTER TABLE concept_sandboxes ADD COLUMN inquiry_steps_json TEXT;
ALTER TABLE concept_sandboxes ADD COLUMN visual_elements_json TEXT;

-- 跃迁沙盒增加一列
ALTER TABLE leap_sandbox_models ADD COLUMN story_stages_json TEXT;
```

### 字段数据结构规范：

#### 规范 1：`concept_sandboxes.inquiry_steps_json`（数组）
```json
[
  {
    "step": 1,
    "title": "观察基准",
    "guide_text": "拖动动点 P 穿过原点，观察相反数到原点的距离变化。",
    "target_condition": "Math.abs(P.x) > 3",
    "aha_insight": "相反数的几何本质：符号相反，但到原点的绝对值距离恒等！"
  }
]
```

#### 规范 2：`concept_sandboxes.visual_elements_json`（对象）
```json
{
  "polygons": [
    {
      "pts": ["A", "B", "C"],
      "fillColor": "rgba(0, 113, 227, 0.12)",
      "strokeColor": "#0071e3"
    }
  ],
  "rightAngles": [
    {
      "vertex": "A",
      "arm1": "B",
      "arm2": "C"
    }
  ]
}
```

#### 规范 3：`leap_sandbox_models.story_stages_json`（自适应 2~4 幕数组）
```json
[
  {
    "stage": 1,
    "title": "原初骨架",
    "guide_text": "剥离中考所有复杂干扰，只看最纯粹的几何骨架与基础不变量。",
    "teacher_secret": "出题人所有压轴变式，起点都是这个基础全等模型。",
    "state_config": {
      "carrierId": "opt1",
      "sliders": {"param_t": 0},
      "xrayActive": false,
      "activeDistractors": []
    }
  },
  {
    "stage": 2,
    "title": "动态变异",
    "guide_text": "旋转动点，观察图形虽然变形，但对应角与线段等量关系永远守恒！",
    "teacher_secret": "抓住旋转角 α，对应线段 AD 与 BC 永远相等且夹角恒为 α。",
    "state_config": {
      "carrierId": "opt1",
      "sliders": {"param_t": 5},
      "xrayActive": false,
      "activeDistractors": []
    }
  },
  {
    "stage": 3,
    "title": "出题人伪装（中考穿迷彩）",
    "guide_text": "出题人加上了背景辅助线与干扰圆，试着在杂乱图形中识别刚才的骨架！",
    "teacher_secret": "中考压轴题往往通过连接对角线、作外接圆来掩盖手拉手模型。",
    "state_config": {
      "carrierId": "opt1",
      "sliders": {"param_t": 5},
      "xrayActive": false,
      "activeDistractors": ["grid_mesh", "distractor_circle"]
    }
  },
  {
    "stage": 4,
    "title": "🩻 破案透视（照妖镜开启）",
    "guide_text": "开启透视照妖镜！干扰线瞬间压暗，核心骨架一目了然！",
    "teacher_secret": "秒杀口诀：共顶等线段，手拉手必现！",
    "state_config": {
      "carrierId": "opt1",
      "sliders": {"param_t": 5},
      "xrayActive": true,
      "activeDistractors": ["grid_mesh", "distractor_circle"]
    }
  }
]
```

---

## 3. 并发分片与流水线编排（Concurrency = 8）

共处理 46 个概念沙盒 + 37 个跃迁沙盒 = 83 个沙盒，划分为 8 个物理分片：

| 分片文件 | 负责模型范围 | 模型门类 / 数量 |
| :--- | :--- | :--- |
| `tmp/data0013/part1.jsonl` | `SB-KP001` ~ `SB-KP012` | 数轴与代数方程类（12 个） |
| `tmp/data0013/part2.jsonl` | `SB-KP013` ~ `SB-KP024` | 一次函数与反比例类（12 个） |
| `tmp/data0013/part3.jsonl` | `SB-KP025` ~ `SB-KP035` | 二次函数与全等三角形（11 个） |
| `tmp/data0013/part4.jsonl` | `SB-KP036` ~ `SB-KP046` | 四边形、圆与相似（11 个） |
| `tmp/data0013/part5.jsonl` | `LM-7A-01` ~ `LM-7B-05` | 7 年级跃迁沙盒（5 个） |
| `tmp/data0013/part6.jsonl` | `LM-8A-06` ~ `LM-8B-17` | 8 年级跃迁沙盒（12 个） |
| `tmp/data0013/part7.jsonl` | `LM-9A-18` ~ `LM-9A-28` | 9 上二次函数与圆跃迁沙盒（11 个） |
| `tmp/data0013/part8.jsonl` | `LM-9B-29` ~ `LM-9B-37` | 9 下相似、最值、反演与概率（9 个） |

### 执行流水线：
1. **阶段 1（前置备份与加列，主 Agent）**：
   - 执行 `cp data/sandbox.db data/sandbox.db.bak_before_task0013`，并核验大小与原库一致；
   - 执行 `ALTER TABLE` 加列；
   - 创建 `tmp/data0013/` 目录。
2. **阶段 2（8 路子 Agent 并发，并发度 = 8）**：
   - 一次性调用 `invoke_subagent` 派发 8 个子 Agent；
   - 每个子 Agent 独立读取分配的模型当前数据（动点、滑块、干扰层、简介）；
   - 输出对应门类的高水准教研 JSON，写入各自 `partN.jsonl`；
   - 每行格式为 JSON：`{"table": "...", "id_col": "...", "id_val": "...", "fields": {...}}`。
3. **阶段 3（汇总校验与单事务写入，主 Agent）**：
   - 编写脚本 `scripts/build/db/enhance_concept_sandboxes.py`；
   - 严格串行单事务读取 8 个 jsonl，跑 `json.loads` 全量语法验证；
   - 执行 `UPDATE` 回填数据；
   - 同步复制至 `public/data/sandbox.db`。
4. **阶段 4（系统回归）**：
   - 执行 `pnpm test` 保证 323 个测试 100% PASS。

---

## 4. 验收清单（可量化，Kiro 据此验收）

- [ ] **判据 1（物理备份完备性）**：`data/sandbox.db.bak_before_task0013` 真实存在、非空，字节大小与原库一致；
- [ ] **判据 2（行数绝对守恒）**：`concept_sandboxes` 总行数恒等于 46，`leap_sandbox_models` 总行数恒等于 37，零 DELETE；
- [ ] **判据 3（跃迁剧情推演覆盖率）**：37 个模型 `story_stages_json` 覆盖率 100%，每条记录具备 2~4 幕结构（标题、引导语、出题人套路、破案秘籍与参数配置）；
- [ ] **判据 4（概念探究步骤覆盖率）**：46 个沙盒 `inquiry_steps_json` 覆盖率 100%，具备 1~3 步自适应探究与 Aha 顿悟；
- [ ] **判据 5（显式填充图元覆盖率）**：46 个沙盒 `visual_elements_json` 覆盖率 100%；
- [ ] **判据 6（JSON 语法合法性）**：83 行所有新增 JSON 字段 100% 通过 `json.loads` 解析，语法解析失败数 = 0；
- [ ] **判据 7（双库一致性）**：`data/sandbox.db` 与 `public/data/sandbox.db` 文件 SHA256 逐字节一致；
- [ ] **判据 8（测试零回归）**：执行 `pnpm test`，全套 54 个测试套件、323 个测试用例全部通过（0 fail）。

---

## 5. 红线 / 禁止事项

1. **严禁并发写库**：子 Agent 只能输出 `.jsonl` 文件，严禁直接连接并修改 SQLite；
2. **严禁破坏既有数据**：不得 DROP TABLE，不得清空既有数据；
3. **严禁修改主外键**：不得修改 `sandbox_id`, `point_id`, `model_id`；
4. **必须单事务写入**：落库操作必须由主 Agent 在单一 Python 脚本中包裹事务（`BEGIN TRANSACTION` ... `COMMIT`），遇到任何异常立即 `ROLLBACK`。

---

## 6. 回写要求

完成后：
1. 结果写入 `outbox/RESULT-DATA-0013.md`，包含：
   - 备份文件大小与 SHA256；
   - 8 路分片执行统计表（每个分片处理模型数、生成 JSON 字节数）；
   - 46 个概念沙盒与 37 个跃迁沙盒数据字段抽样检查结果；
   - 双库同步证明与 `pnpm test` 323 测试全绿输出日志；
2. 把本任务书文件头 `status` 改为 `done`；
3. 在对话中明确播报一句 `"TASK-DATA-0013 完成"`，原地进入 STANDBY 待命。
