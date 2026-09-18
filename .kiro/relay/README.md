# relay — 任务信箱（Kiro ↔ Antigravity 文件通信）

本目录是 Kiro（架构/审计）与 Antigravity（执行）之间的**任务队列**。
完整协作标准见 `.kiro/steering/collaboration-protocol.md`。

## 目录

```
relay/
  _TEMPLATE_TASK.md        任务书模板
  frontend/  datalayer/    两条线，结构相同：
    inbox/                 Kiro 放任务书 + NEXT.md 信号文件
    outbox/                Antigravity 回写 RESULT-xxxx.md
    archive/               验收通过后归档
```

**Antigravity 在本项目开两个对话，各盯一条线：**
- **对话 A（前端线）** → 只处理 `frontend/` 队列
- **对话 B（数据线）** → 处理 `datalayer/` 队列 = 数据回填/清洗/导入 + **一切非前端任务**（脚本、验证、SVG、杂务）
两条线独立轮询各自的 `NEXT.md`，互不干扰。

## Antigravity 怎么干活（自我驱动）

1. 用户首次说"开始" → 读对应线的 `inbox/NEXT.md`
2. `NEXT.md` 指向哪个任务号，就执行 `inbox/TASK-xxxx.md`
3. 干完 → 结果写 `outbox/RESULT-xxxx.md`，任务书 `status` 改 `done`
4. 回读 `NEXT.md` 找下一个：
   - 任务号 → 立即开工
   - `IDLE` → 每 **3 分钟**轮询一次，最多 **20 次**（约 1 小时），期间反复读；之后待命
   - `WAIT-USER` → 停止

## Kiro 怎么管（本对话内）

- 写任务书进 inbox，更新 `NEXT.md` 指向它
- 检测 outbox 新结果 → 按任务书验收清单核验
- 通过 → 归档 + `NEXT.md` 写下一任务号
- 不通过 → 任务书 `status=rejected` + 问题清单，`NEXT.md` 指回同一任务，`attempt+1`
- 同一任务 `attempt` 到 **3**（退回 2 次）仍不达标 → `NEXT.md=WAIT-USER`，上报用户

## 关键规范补充（模型、并发与安全）

- **任务书推荐模型 (`model`)**：Kiro 可在任务书 Frontmatter 标注推荐模型。若未指定或缺省，统一默认匹配 **Gemini 3.8 Flash (High)**。
- **线路并发控制 (`concurrency`)**：**默认严格为 1（不并发/串行）**。严禁跨实例并发写 SQLite 数据库或修改冲突源码；仅内部只读批处理脚本经设计可多线程。
- **紧急刹车机制**：用户通知【协同总指挥】后，由总指挥安全切断线路并置 `NEXT.md=WAIT-USER`。

## 用户怎么参与

- 只在决策对话谈方案/计划/抉择
- 只对 Antigravity 各自执行线说一次"开始"，之后链条自跑
- 查询进度、要求紧急刹车时通知【协同总指挥】
- 介入时机：多方案抉择 / 任务退回 2 次 / 方向变更 / 紧急刹车
