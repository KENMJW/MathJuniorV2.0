---
id: TASK-FE-0020
line: frontend
status: assigned
attempt: 1
created_by: Kiro (架构师/PM)
title: 全系统 Tailwind + shadcn/ui 架构重构与三端极简交互闭环落地
model: default
concurrency: 1
---

> **执行方式（硬性，遵照 collaboration-protocol §7 + §8）**：
> - **本机执行**（主控机本地跑，完成后提交）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 1`：涉及全系统表现层现代化重构，串行执行并进行端到端全流程验证。
> - **前端交互/渲染任务，验收必须走真实浏览器与自动化测试（§8）**：全量 323 个测试必须持续通过，真实浏览器在 Phone (390x844)、Pad (820x1180)、PC (1440x900) 控制台 0 error。

# 任务：全系统 Tailwind + shadcn/ui 架构重构与三端极简交互闭环落地

## 1. 目标

依据系统重构战略决策，彻底清除现有代码中导致包体积膨胀（JS > 2MB）的海量内联样式（`style={{...}}`）与手写粗糙弹窗，引入现代 **Tailwind CSS + shadcn/ui（无头 Radix UI 驱动）** 工业级前端体系，贯彻 **“iOS 27 纯浅色液态玻璃设计系统”**。

同时，根据我们共同确立的业务逻辑与三端交互人机工效规范，全面落地：
1. **三端独立物理骨架**：
   - 📱 **手机端**：100dvh 视口锁定防溢出，底部 4 大 Tab（考点、谱系、沙盒、考试），单手极致体验；
   - 📟 **平板端**：主从联动双栏分屏（Master-Detail），可拖拽中缝，横竖屏自适应；
   - 💻 **电脑端**：全景专业三栏驾驶舱（Cockpit 2.0），宽屏全信息铺展，全键盘快捷键流（`1/2/3/4` 瞬切、`Space` 瞬切透视、`Cmd+K` 全局速查）。
2. **四大业务模块重构**：
   - 📗 **模块一【考点（基础）】**：三维一体（①四段精讲内嵌微观沙盒与 SVG 联动；②黄金母题 1~4 维思维渐进解锁；③单点 3 题即答即判），自由切换；
   - 🧭 **模块二【知识谱系（进阶）】**：在业务逻辑上与模块一 100% 镜像对称（①主线精讲泳道演进；②主线旗舰母题渐进解锁；③主线综合过关快练）；
   - 🔬 **模块三【沙盒（实验）】**：独立的【总模型库板块】，支持 37 个思维跃迁模型直接开门见山自由把玩，红蓝半透明高亮染色，实时等号不变量仪表盘，一键 🩻 X-Ray 照妖镜透视，按需呼出剧情破案卡片；
   - ⚔️ **模块四【考试（实测）】**：出卷（场景化一键卷/自定义卷）、全真沉浸测试（考完即焚）、自动批改与 6 大核心素养雷达图报告。
3. **全科门户（AllSubjectsPortal）**：记住上次选中学科（LocalStorage），顶栏极简切换，消除内联样式，代码量从 1380 行深度瘦身。

---

## 2. 上下文与工程规范

1. **核心设计 Token**：严格遵守 `src/styles/tokens.css` 与 `theme.ts`，强制纯浅色模式（`color-scheme: light`），禁止深色模式自动反转；
2. **保护资产**：
   - `src/modules/sandbox/invariants.ts`、`morphControllers.ts`、`safeExpression.ts` 数学与算子纯函数不得改坏；
   - `src/engine/db` 数据库客户端及真题查询逻辑不得改坏；
   - 保持现有的 323 个自动化测试（Vitest + fast-check）100% 持续通过；
3. **图标体系**：全量接入 `lucide-react`，淘汰手写 500 行的 `Icon.tsx`；
4. **Tailwind 配置**：在 `tailwind.config.ts` 中完成 `--ios-*`, `--glass-*`, `--radius-*` 的主题扩展映射。

---

## 3. 具体实施步骤

### 步骤 1：现代基建装配
1. 安装 `tailwindcss`, `postcss`, `autoprefixer`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` 以及核心 Radix 原语（`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-slider`, `@radix-ui/react-tooltip` 等）；
2. 建立 `src/lib/utils.ts` 导出标准 `cn()` 辅助函数；
3. 配置 `tailwind.config.ts` 与 `src/styles/globals.css`，配置 JSXGraph 与 KaTeX 的隔离保护规则（`.jxgbox svg { display: inline; }`）。

### 步骤 2：UI 原子件与三端 Shell 重构
1. 在 `src/components/ui/` 中构建 iOS 27 液态玻璃原子组件（`button`, `badge`, `sheet/drawer`, `tabs`, `slider`, `dialog`, `tooltip`）；
2. 重写 `src/components/shell/`：
   - 手机端 `MobileShell`（4 底栏 Tab，100dvh 单手流）；
   - 平板端 `TabletShell`（双栏分屏 Master-Detail）；
   - 电脑端 `DesktopShell`（三栏驾驶舱，集成 `Cmd+K` 与数字快捷键）。

### 步骤 3：四大业务模块与全科门户全新装配
1. **模块一**：重构 `ConceptNav`，三大支柱自由切换，第 2 段透视内嵌微观沙盒；
2. **模块二**：重构 `GraphNav`，与模块一 1:1 对齐，支持跨学期泳道演进；
3. **模块三**：重构 `LabWorkspace`，作为纯粹的总模型库独立功能板块，直接开门见山自由把玩，红蓝半透明染色，等号仪表盘，🩻 X-Ray 透视，按需呼出剧情卡；
4. **模块四**：重构 `PaperWorkbench` 与 `OnlineExam`，精简手机端出卷流程；
5. **全科门户**：重构 `AllSubjectsPortal`，持久化记住学科，顶栏无缝切换。

### 步骤 4：自动化回归与生产构建检验
1. 运行 `pnpm test` 确保 323 个测试用例全部 PASS；
2. 运行 `pnpm build` 确保生产构建成功，JS 体积较 2.08MB 显著下降；
3. 检查控制台 0 error。

---

## 4. 验收清单（可量化，Kiro 据此验收）

- [ ] **判据 1（测试绿灯）**：执行 `pnpm test`，全套 54 个测试套件、323 个测试用例全部通过（0 fail）；
- [ ] **判据 2（生产构建通过）**：执行 `pnpm build`，TypeScript 无类型报错，Vite 打包成功，产物正常生成且 PWA 缓存清单完整；
- [ ] **判据 3（三端物理骨架落地）**：
  - 手机端（<768px）：底部呈现 4 大 Tab，视口锁定 100dvh，无意外横向滚动；
  - 平板端（768px~1024px）：双栏分屏联动；
  - 电脑端（>1024px）：三栏宽屏大视野，支持 `1/2/3/4` 快捷切场与 `Cmd+K`；
- [ ] **判据 4（模块一与二对齐）**：模块一与模块二结构均为“精讲 + 母题 + 快练”三大支柱，自由切换；
- [ ] **判据 5（模块三总模型库）**：37 个模型支持直接自由拖拽、红蓝高亮色块、实时不变量等号跳动、一键 🩻 X-Ray 照妖镜透视、按需查看原理卡；
- [ ] **判据 6（全科门户记忆）**：选择初中数学后写入 LocalStorage，下次直接直达，顶栏留有切换学科入口。

---

## 5. 红线 / 禁止事项

1. **严禁破坏数学引擎**：不得修改 `src/modules/sandbox/invariants.ts` 等算法的数学逻辑；
2. **严禁引入深色模式自动反转**：全系统严格锁定纯浅色液态玻璃规范（`color-scheme: light`）；
3. **严禁产生横向溢出破框**：手机端与平板端必须保持 100% 防溢出兜底；
4. **铁律遵循**：考场考完即焚、纯内存状态、零持久化污染。

---

## 6. 回写要求

完成后：
1. 结果写入 `outbox/RESULT-FE-0020.md`，包含：做了什么、三端实测表现、量化自检结果、碰到的问题与解决方案；
2. 把本任务书文件头 `status` 改为 `done`；
3. 在对话中明确播报一句 `"TASK-FE-0020 完成"`，原地进入 STANDBY 待命。
