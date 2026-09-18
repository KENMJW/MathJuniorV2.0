---
inclusion: manual
name: collaboration-protocol
description: 本项目(全科核心素养提分系统V2.0)三方协作标准 — 用户/Kiro/Antigravity 的角色、任务队列、轮询机制与验收闭环。仅本项目生效。
---

# 三方协作标准（本项目专用）

> 适用范围：仅 `全科核心素养提分系统V2.0` 项目。定义用户、Kiro、Antigravity 三方如何通过文件驱动的任务队列协作。

## 1. 角色定义

| 角色 | 身份 | 职责 | 介入时机 |
|---|---|---|---|
| **决策者** | 用户 | 定方案、定计划、多方案抉择、下达紧急刹车 | ① 多方案需抉择 ② 同一任务被退回 2 次仍不达标 ③ 项目方向变更 ④ 紧急刹车 |
| **架构/分析/审计** | Kiro | 系统架构师 + 数据分析师 + 代码审计师。统管全局：出方案、拆任务、选定模型、指定并发、跨线联动、验收成果 | 全程管理，统管前端 + 数据两条线 |
| **协同总指挥** | Antigravity(指挥) | 进度中枢与安全刹车调度官。向用户汇报执行状态，接收用户指令安全切断/暂停线路 | 随时响应用户查询与刹车指令 |
| **执行者** | Antigravity(执行A/B) | 领任务、严格按任务书要求执行、回写结果、轮询下一任务 | 收到"开始"信号后自我驱动 |

**与用户的对话只谈**：方案、计划、抉择。具体任务一律交 Antigravity 执行。

## 2. 对话拓扑

```
用户（1 个决策对话，只谈方案/计划/抉择）
   │
   ▼
Kiro（1 个管理对话，统管两条线）
 ╱               ╲
前端线            数据线（= 数据 + 其他所有非前端任务）
   │                  │
   ▼                  ▼
Antigravity 对话A   Antigravity 对话B
（只盯 frontend/）  （只盯 datalayer/）
```

- Kiro 用**一个**对话统管全局，保证一致性。
- Antigravity 在本项目下开**两个**对话，各盯一条线：
  - **对话 A（前端线）** → 只处理 `.kiro/relay/frontend/` 队列
  - **对话 B（数据线）** → 处理 `.kiro/relay/datalayer/` 队列，涵盖**数据回填、清洗、导入，以及一切非前端任务**（脚本、验证、SVG、杂务等都走这条）
- 两条线互不干扰，各自独立轮询自己的 `NEXT.md`。

## 3. 文件通信机制（任务信箱）

目录：`.kiro/relay/{frontend,datalayer}/`

```
.kiro/relay/
  frontend/            # 前端线
    inbox/             # Kiro 放任务书，含 NEXT.md 信号文件
    outbox/            # Antigravity 回写结果
    archive/           # 验收通过后归档的任务
  datalayer/           # 数据线（结构同上）
    inbox/  outbox/  archive/
```

- **任务书**：`inbox/TASK-{DATA|FE}-NNNN.md`（编号递增，四位）
- **结果**：`outbox/RESULT-{DATA|FE}-NNNN.md`
- **信号文件**：`inbox/NEXT.md` — 永远指向"当前该做的任务"，三种取值：
  - `TASK-DATA-0007`（具体任务号）→ 立即开工
  - `IDLE` → 暂无任务，进入轮询
  - `WAIT-USER` → 需用户介入，停止轮询

## 4. 任务执行与待命协议（用户通知驱动）

Antigravity 完成一个任务后：

1. 把结果写入 `outbox/RESULT-xxxx.md`，并把对应任务书文件头 `status` 改为 `done`；
2. 在对话框中明确播报一句：`"TASK-xxxx 完成"`；
3. **原地进入就绪待命（STANDBY）**，不再进行无意义的自动死循环轮询；
4. 等待用户下达下一条任务指令（由用户唤醒 Kiro 验收并发题后，用户直接在对应对话中粘贴下一启动指令）。

## 5. 闭环流程

```
Kiro 写任务书(inbox) + 更新 NEXT.md + 给出启动命令词
   → 用户向对应执行线对话发送启动指令
   → Antigravity 执行 → 回写 outbox + status=done + 播报"TASK-xxxx 完成"
   → 用户转达一句"TASK-xxxx 完成了"唤醒 Kiro
   → Kiro 验收(按任务书验收清单)
        ├─ 通过 → 归档任务到 archive/ → 写下一任务号进 NEXT.md + 给出下一任务命令词
        └─ 不通过 → 退回：任务书 status=rejected，附问题清单，NEXT.md 指回同一任务 + 给出重试命令词
   → 同一任务被退回累计 2 次仍不达标 → NEXT.md=WAIT-USER，上报用户介入
```

## 6. 任务书格式（Kiro 撰写）

文件头 YAML + 正文。见 `_TEMPLATE_TASK.md`。核心字段：
- `id` / `line`(frontend|datalayer) / `status`(assigned|done|accepted|rejected) / `attempt`(退回次数)
- `model`: (可选) 推荐执行模型。三种写法：
  - **缺省 / `default`** → 全量 `Gemini 3.8 Flash (High)`，固定执行对话直接跑。
  - **单一高阶模型**（如 `gemini 3.1 pro`）→ 全量该模型，强制 `invoke_subagent(Model="pro")` 派发。
  - **分片混合模型**（`per_shard`）→ 不同分片用不同模型。用 `model: per_shard` + 另加 `shard_models` 字段声明每片模型，例如：
    ```yaml
    model: per_shard
    shard_models:            # 分片号: 模型
      1: flash
      2: flash
      3: pro
      4: pro
      5: pro
    ```
    执行者据此在单次 `invoke_subagent` 中为每个子 Agent 分别指定 `Model`（片1-2 flash、片3-5 pro）。用于"简单分片省钱用 Flash、难分片保质用 Pro"。
- `concurrency`: (可选) 并发度。**默认严格为 1（不并发/串行）**；经用户批准后可声明 >1。声明 >1 且需指定模型时，执行者必须在单次 `invoke_subagent` 中一次性并发派发 N 个子 Agent（混合模型时按 `shard_models` 逐片指定 Model）。
- 正文含：目标、上下文、**可量化验收清单**、禁止事项、回写要求
- **验收清单由 Kiro 自拟并写进任务书，结果全程留痕**，用户在决策对话可随时查阅，无需逐个预批。

### 6.1 每次派任务，Kiro 必须附【给总指挥的启动命令词】（硬规矩）
Kiro 每写完一份任务书并更新 `NEXT.md` 后，**必须在对话中给用户一段可直接复制的启动命令词**，供用户首次转达给 Antigravity 总指挥/执行者对话。命令词包含：读哪条线的 `NEXT.md`、遵守轮询协议、完成后回写 outbox 并**播报完成**。用户只需复制粘贴，无需自己拼措辞。

## 6.2 完成通知闭环（关键：Kiro 无法后台自动轮询）
- **技术事实**：Kiro 只在被用户消息激活时运行，**没有后台定时器自动醒来查 outbox**。执行者(Antigravity)是持续监听的，Kiro 不是。
- **因此完成回路这样闭环**：执行者写完 `RESULT-xxxx.md` → 总指挥播报"某任务完成" → **用户转达一句"X 完成了"给 Kiro** → Kiro 被唤醒，立即读 RESULT + 验收 + 判过/退回 + 派下一个。
- **用户只需做那一下"完成"触发**；读结果、验收、写下一任务/退回，**全是 Kiro 的活，用户不碰**。
- 可选自动化：用 Stop hook 在执行者任务结束时自动把 RESULT 摘要注入 Kiro 上下文，省去用户手动转达（后续按需接）。

## 7. 关键约束与安全机制

- **模型指定与执行架构（Subagent 强制执行铁律）**：
  - **默认常规任务 (`model: default` 或缺省)**：统一匹配 `Gemini 3.8 Flash (High)`，直接在固定执行对话（`Frontend Executor Standby` / `Data Layer Standby`）中跑，用户可见、实时交互。
  - **指定高推理模型任务 (`model: gemini 3.1 pro` / `model: pro` 等)**：
    1. **强制 Subagent 执行**：主 Agent **严禁在主会话中自行代跑、手算或本地绕过**。必须通过 `invoke_subagent` 工具派发，显式声明 `TypeName: "self"`、`Model: "pro"`（或对应指定模型）。
    2. **原生真并发调度规范**：若任务书要求并发度为 $N$（如 `concurrency: 5`），主 Agent 必须在**单次 `invoke_subagent` 工具调用中**传入包含 $N$ 个子 Agent 的数组，由系统原生并行拉起 $N$ 个独立的子 Agent 并发处理各自的分片。
    3. **分片混合模型调度（`model: per_shard`）**：当任务书用 `shard_models` 为各分片指定不同模型时，主 Agent 在同一次 `invoke_subagent` 数组里为每个子 Agent 按 `shard_models` 逐个设置对应 `Model`（如子Agent-1/2 用 `Model="flash"`、子Agent-3/4/5 用 `Model="pro"`）。**分片编号与模型的对应关系严格照任务书，不得错配**（错配会导致该给 Pro 的难分片被 Flash 跑，质量塌陷）。各分片仍各写独立 `partN.jsonl`，写库仍由主 Agent 串行统一执行。
    4. **职责隔离与写入红线**：
       - **子 Agent 权限范围**：严格限定为【只读获取输入】→【调用推理模型深度逻辑推理/多法求解】→【输出至独立的临时文件（如 `tmp/.../partN.jsonl`）】。
       - **严禁并发写库**：子 Agent **绝对禁止直接连接或写入 SQLite**（避免触发 `database is locked` 死锁）。
       - **主 Agent 串行写库与验证**：所有数据库更新必须在所有子 Agent 正常退出且输出文件完整性（行数/格式）校验通过后，由主 Agent 单进程、单事务串行写入，并严格执行题库总数守恒、`stem_zh` SHA256 零篡改及非目标行零变动断言。
- **并发必先请示用户（硬规矩）**：任何任务只要存在并发提速可能，Kiro **不得自行开并发**，必须先向用户报告【该任务可并发 / 建议并发数 N / 理由与安全边界】，由**用户确认并发数量**后才可在任务书写 `concurrency: N`。缺省一律 `1`。
- **模型能力担忧主动提示（硬规矩）**：当 Kiro 评估某任务超出默认模型（Gemini 3.8 Flash High）可靠区间——如开放式架构决策、高推理判断、易错的复杂逻辑、安全敏感（禁 eval 等）——**必须主动提示用户**【担忧点 + 建议升级模型（如 Pro）】，由用户定夺是否换模型。不得默默用默认模型硬扛高风险任务。
- **紧急刹车机制**：若用户发出紧急暂停或刹车指令，由【协同总指挥】统一调度，将对应线路 `NEXT.md` 写入 `WAIT-USER`，并在当前文件/事务安全边界处终止，确保无脏数据或半改动状态。
- **重试上限**：同一任务退回上限 **2 次**（第 3 次不自动重试），自动转 `WAIT-USER` 上报用户。
- **免除死循环轮询**：任务完成后就地待命，等待用户通知唤醒，禁止使用 shell sleep 循环轮询。
- **数据与源码安全红线**：
  - 数据回填类任务：必须声明"只填占位字段，禁止修改 stem_zh 题面"等红线。
  - 数据库写操作前必须先执行备份并注明回滚点。
- 本标准仅本项目生效，不影响其他工作区。
