---
id: TASK-DATA-0014
line: datalayer
status: done
attempt: 1
created_by: Kiro (架构师/PM)
title: 概念与跃迁沙盒教研步骤与剧情推演全量补齐双语英文
model: default
concurrency: 8
---

> **执行方式（硬性，照 collaboration-protocol §7）**：
> - **本机执行**（数据线会话本地执行）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 8`：**利用 `invoke_subagent` 单次并发派发 8 个子 Agent**，分片翻译与回填 46 个概念沙盒与 37 个跃迁沙盒的英文双语字段，各写独立 `tmp/data0014/part_{1..8}.jsonl`。
> - **写库铁律**：子 Agent 只读 + 翻译 + 写各自分片文件，**严禁并发写 SQLite 数据库**。写库由**主 Agent 汇总后执行校验并在单事务内串行写入**。

# 任务：概念与跃迁沙盒教研步骤与剧情推演全量补齐双语英文

## 1. 目标

在 `TASK-DATA-0013` 成功注入教学探究步骤与剧情推演的基础上，全面对齐系统多语言（Bilingual）规范，为 `data/sandbox.db` 中两大核心表的所有新增教研内容**全量补齐高质量专业英文翻译**：

1. **`concept_sandboxes` 表（共 46 行）**：
   - 为 `inquiry_steps_json` 中的每一步补充 `titleEn`、`guideTextEn`、`ahaInsightEn`；
   - 保持既有中文字段 `title`/`titleZh`、`guide_text`/`guideTextZh`、`aha_insight`/`ahaInsightZh` 与 `target_condition` 100% 完好不变。
2. **`leap_sandbox_models` 表（共 37 行）**：
   - 为 `story_stages_json` 中的每一幕补充 `titleEn`、`guideTextEn`、`teacherSecretEn`；
   - 保持既有中文字段与 `state_config` 参数配置 100% 完好不变。

---

## 2. 数据结构规范与双语契约

### 规范 1：`concept_sandboxes.inquiry_steps_json`（补齐英文后）
```json
[
  {
    "step": 1,
    "title": "探究正有理数与分数定位",
    "titleZh": "探究正有理数与分数定位",
    "titleEn": "Explore Positive Rational Numbers & Fraction Positioning",
    "guide_text": "拖动分子滑块，观察正分数在数轴上的位置分布。",
    "guideTextZh": "拖动分子滑块，观察正分数在数轴上的位置分布。",
    "guideTextEn": "Drag the numerator slider to observe position distribution of positive fractions on the number line.",
    "target_condition": "p_num > 0 && q_den >= 2",
    "aha_insight": "分数 p/q 的几何本质是将单位长度 q 等分后取 p 份！",
    "ahaInsightZh": "分数 p/q 的几何本质是将单位长度 q 等分后取 p 份！",
    "ahaInsightEn": "Geometric essence of fraction p/q: divide unit length into q equal parts and take p parts!"
  }
]
```

### 规范 2：`leap_sandbox_models.story_stages_json`（补齐英文后）
```json
[
  {
    "stage": 1,
    "title": "原初骨架",
    "titleZh": "原初骨架",
    "titleEn": "Primordial Skeleton",
    "guide_text": "剥离中考所有复杂干扰，只看最纯粹的几何骨架。",
    "guideTextZh": "剥离中考所有复杂干扰，只看最纯粹的几何骨架。",
    "guideTextEn": "Strip away all complex exam distractors to reveal the purest geometric skeleton.",
    "teacher_secret": "出题人所有压轴变式，起点都是这个基础全等模型。",
    "teacherSecretZh": "出题人所有压轴变式，起点都是这个基础全等模型。",
    "teacherSecretEn": "All exam climax variants originate from this foundational congruence model.",
    "state_config": {
      "carrierId": "opt1",
      "sliders": {"param_t": 0},
      "xrayActive": false,
      "activeDistractors": []
    }
  }
]
```

---

## 3. 并发分片与实施流水线（Concurrency = 8）

处理 46 个概念沙盒 + 37 个跃迁沙盒 = 83 个沙盒，划分为 8 个物理分片：

| 分片文件 | 负责模型范围 | 模型门类 / 数量 |
| :--- | :--- | :--- |
| `tmp/data0014/part1.jsonl` | `SB-KP001` ~ `SB-KP039` | 数轴与代数方程类（12 个） |
| `tmp/data0014/part2.jsonl` | `SB-KP040` ~ `SB-KP053` | 二次函数与几何基础（12 个） |
| `tmp/data0014/part3.jsonl` | `SB-KP055` ~ `SB-KP069` | 三角形与四边形（11 个） |
| `tmp/data0014/part4.jsonl` | `SB-KP071` ~ `SB-KP085` | 圆与几何变换（11 个） |
| `tmp/data0014/part5.jsonl` | `LM-7A-01` ~ `LM-7B-05` | 7 年级跃迁沙盒（5 个） |
| `tmp/data0014/part6.jsonl` | `LM-8A-06` ~ `LM-8B-17` | 8 年级跃迁沙盒（12 个） |
| `tmp/data0014/part7.jsonl` | `LM-9A-18` ~ `LM-9A-28` | 9 上二次函数与圆跃迁沙盒（11 个） |
| `tmp/data0014/part8.jsonl` | `LM-9B-29` ~ `LM-9B-37` | 9 下相似、最值与反演概率（9 个） |

### 实施流水线：
1. **阶段 1（强制物理备份）**：
   - 执行 `cp data/sandbox.db data/sandbox.db.bak_before_task0014`，核验非空且与原库大小一致；
   - 创建 `tmp/data0014/` 目录。
2. **阶段 2（8 路子 Agent 并发，并发度 = 8）**：
   - 调用 `invoke_subagent` 并发派发 8 个子 Agent；
   - 提取各自分片中沙盒当前的 `inquiry_steps_json` 或 `story_stages_json`；
   - 使用标准数学专业英文词汇精准翻译，保持原有中文与逻辑参数不变，追加双语键名；
   - 输出至 `tmp/data0014/part_{1..8}.jsonl`。
3. **阶段 3（汇总校验与单事务写入）**：
   - 编写脚本 `scripts/build/db/bilingual_patch_sandboxes.py`；
   - 串行读取 8 个 jsonl，跑 `json.loads` 确保无非法字符与转义错误；
   - 在单一数据库事务中执行 `UPDATE` 更新回填；
   - 同步复制至 `public/data/sandbox.db`。
4. **阶段 4（系统回归）**：
   - 运行 `pnpm test` 保证全套 323 个测试继续全绿。

---

## 4. 验收清单（可量化，Kiro 据此验收）

- [ ] **判据 1（物理备份完备性）**：`data/sandbox.db.bak_before_task0014` 真实存在、非空，大小与写前一致；
- [ ] **判据 2（行数绝对守恒）**：`concept_sandboxes` 严格等于 46，`leap_sandbox_models` 严格等于 37，零 DELETE；
- [ ] **判据 3（概念沙盒英文覆盖率）**：46 个概念沙盒中，所有步骤的 `titleEn`、`guideTextEn`、`ahaInsightEn` 覆盖率 100%，无空字符串、无 `__PENDING__` 占位符；
- [ ] **判据 4（跃迁沙盒英文覆盖率）**：37 个跃迁模型中，所有幕次的 `titleEn`、`guideTextEn`、`teacherSecretEn` 覆盖率 100%，无空字符串、无占位符；
- [ ] **判据 5（原有中文零损坏）**：所有原有中文标题、引导语、解析与 `state_config` 参数原样保留；
- [ ] **判据 6（JSON 语法合法性）**：83 行更新后的 JSON 字段 100% 通过 `json.loads` 解析；
- [ ] **判据 7（双库文件一致性）**：`data/sandbox.db` 与 `public/data/sandbox.db` SHA256 逐字节一致；
- [ ] **判据 8（测试零回归）**：执行 `pnpm test`，全套 54 个测试套件、323 个测试用例全部通过（0 fail）。

---

## 5. 红线 / 禁止事项

1. **严禁并发写库**：子 Agent 严禁直接写 SQLite，只能写 `tmp/data0014/` 下的分片文件；
2. **严禁修改主外键**：不得触动 `sandbox_id`, `point_id`, `model_id`；
3. **严禁覆盖破坏中文**：中文内容必须完整保留；
4. **必须单事务写入**：落库必须由主 Agent 统一包裹在单个事务内执行。

---

## 6. 回写要求

完成后：
1. 结果写入 `outbox/RESULT-DATA-0014.md`，包含：
   - 备份文件大小与 SHA256；
   - 8 路分片执行统计表；
   - 概念沙盒与跃迁沙盒双语字段抽样检查展示；
   - 双库同步证明与 `pnpm test` 323 测试全绿日志；
2. 把本任务书文件头 `status` 改为 `done`；
3. 在对话中明确播报一句 `"TASK-DATA-0014 完成"`，原地进入 STANDBY 待命。
