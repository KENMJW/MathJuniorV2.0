---
id: TASK-DATA-0000
line: datalayer            # datalayer | frontend
status: assigned           # assigned | done | accepted | rejected
attempt: 1                 # 退回次数（第几次尝试）
created_by: Kiro
title: 一句话任务标题
model: default              # default=Flash直跑 | gemini 3.1 pro=全量Pro(强制subagent) | per_shard=分片混合(见shard_models)
# shard_models:             # 仅 model=per_shard 时启用，逐片指定模型
#   1: flash
#   2: flash
#   3: pro
#   4: pro
#   5: pro
concurrency: 1              # 线路并发度: 默认 1 (严格串行/不并发); 经用户批准后可>1
---

> **执行方式（硬性，照 collaboration-protocol §7）**：
> - `model` 非 default（pro / per_shard）时，**必须用 `invoke_subagent` 派发，严禁主会话代跑/手算**。
> - `concurrency: N` 时，单次 `invoke_subagent` 传 N 个子 Agent 数组并发；per_shard 按 shard_models 逐片指定 Model。
> - 子 Agent 只读+推理+写各自 `tmp/.../partN.jsonl`，**严禁并发写 SQLite**；写库由主 Agent 串行单事务执行 + 守恒/SHA256/非目标行零变动断言。

# 任务：<标题>

## 1. 目标
<这个任务要达成什么，一两句说清>

## 2. 上下文
<需要的背景：涉及哪些文件/表/字段，前置状态，相关约定>

## 3. 具体步骤
1. …
2. …

## 4. 验收清单（可量化，Kiro 据此验收）
- [ ] 判据1：<可用命令/SQL 检出的量化标准，如"answer_list 残留 = 0">
- [ ] 判据2：…
- [ ] 判据3：…

## 5. 红线 / 禁止事项
- 禁止：<如 禁止修改 stem_zh 题面；禁止 DELETE/重建；只填占位字段>
- 备份：<写库前的备份要求与回滚点>

## 6. 回写要求
完成后：
1. 结果写入 `outbox/RESULT-<id去掉TASK->.md`，含：做了什么、量化自检结果、遇到的问题
2. 把本任务书文件头 `status` 改为 `done`
3. 在对话中明确播报一句 `"TASK-xxxx 完成"`，原地进入 STANDBY 待命，等待用户通知唤醒下一任务。

## 7. 协议约束（固定，勿改）
- 完成本任务 → 回写结果 + 标记 status: done + 播报完成
- 原地 STANDBY 待命，等待用户下达下一指令（不自动死循环轮询）
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入
