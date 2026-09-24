---
id: TASK-FE-0020
line: frontend
status: assigned
attempt: 1
created_by: Kiro (架构师 / PM / 验收负责人)
title: 【任务一：整体修改】全局基建与三端外壳重构（对标 iOS 27 / iPadOS 27 / macOS 27）
model: default
concurrency: 1
---

> **执行方式（硬性，遵照 collaboration-protocol §7 + §8）**：
> - **本机执行**（前端会话 Dialogue A 本地跑，完成后提交）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 1`：串行执行，完成后进行架构师量化验收。
> - **前端交互/渲染任务，验收必须走真实浏览器与自动化测试（§8）**：全量 323 个测试必须持续 100% 通过，真机控制台在 Phone (390x844)、Pad (820x1180)、PC (1440x900) 0 error / 0 警告，手机端 0 水平滚动条。

# 【任务一：整体修改】全局基建与三端外壳重构

## 1. 任务定位与范围边界（铁律）

依据与用户共同审阅通过的 **[前端重构总纲（Master Plan）](file:///Users/annette/.gemini/antigravity/brain/8d38aef8-97e1-4fab-be91-2ebab107416a/frontend_refactor_master_plan.md)**，前端重构严格划分为三个阶段：
- **【阶段一：本任务 TASK-FE-0020】整体修改**：全局基建、Apple HIG 标尺、Rollup 分包、学习大厅重写、三端物理外壳与既有模块安全挂载；
- **【阶段二：TASK-FE-0021】模型一重绘**：模块一【46 概念沙盒】重绘、声明式填充面、1~3 步探究任务、母题思维阶梯、3 题快练；
- **【阶段三：TASK-FE-0022】模型二重绘**：模块三【37 跃迁沙盒】重绘、双模自由玩、4 幕剧情推演、模块二跨学期泳道。

> ⚠️ **【本任务禁止项（红线）】**：
> 1. 🔴 **绝对严禁修改** `SandboxRenderer.tsx` 与 `LeapLab.tsx` 内部的绘图和物理算法（留待任务二与任务三执行）；
> 2. 🔴 **绝对严禁擅自引入** 未经讨论批准的全键盘盲操快捷键方案；
> 3. 🔴 **现有的 4 大模块仅作为黑盒安全挂载进新壳层中**，核心目标是保障路由顺畅、包体积暴降、测试 100% 绿灯。

---

## 2. 视觉基准与设计规范（100% 对齐）

严格以工程原型标准件 `[.kiro/specs/math-junior-frontend/design-refs/ios27_demo.html](file:///Users/annette/aidev/全科核心素养提分系统V2.0/.kiro/specs/math-junior-frontend/design-refs/ios27_demo.html)`（2009 行工程基准）为唯一真理源，建立 1:1 映射至 `tailwind.config.ts`：

### (1) Design Tokens 映射
* **表面架构**：
  - 页面底色：`--bg-page: #fbfbfd;`（Apple Signature Light Studio 背景）
  - 顶部微光网格：`radial-gradient(ellipse at center, rgba(0, 113, 227, 0.04) 0%, transparent 70%); filter: blur(90px);`
  - 主卡片：`--bg-card: #ffffff;`；二级衬底：`--bg-card-subtle: #f5f5f7;`
  - 极细边框：`--border-subtle: rgba(0, 0, 0, 0.07);`（7% 超细透边，严禁纯黑粗边）
* **文字阶梯 (Apple HIG 10 级标尺)**：
  - `text-ios-title-lg` (34px/700)、`text-ios-title-1` (28px/700)、`text-ios-title-2` (22px/600)、`text-ios-headline` (17px/600)、`text-ios-body` (15px/400 行高 1.47 正文基准)、`text-ios-callout` (14px/400)、`text-ios-caption` (11px/400)
  - 颜色层级：曜石深黑 `--text-primary: #1d1d1f;`、正文 `--text-secondary: #515154;`、角标 `--text-tertiary: #86868b;`、发丝线 `--text-quaternary: #d2d2d7;`
* **品牌系统蓝**：`--ios-blue: #0071e3;`，微光 `--ios-blue-glow: rgba(0, 113, 227, 0.18);`，底衬 `--ios-blue-tint: rgba(0, 113, 227, 0.06);`
* **沙盒光学暗室 Tokens**：视窗画布区 `--sandbox-canvas: #0f172a;`（Slate 900），底部遥测仪 `--sandbox-telemetry: #1e293b;`（Slate 800）
* **圆角与缓动**：Squircle 8px / 14px / 22px / 9999px（Pill）；缓动 `--spring-smooth: cubic-bezier(0.16, 1, 0.3, 1);`

### (2) 图标标准
* 彻底废除 500 行手写 `Icon.tsx`，100% 接入 `lucide-react`；
* 统一锁定为单线 SF Symbols 规范：`strokeWidth={1.8}`，`strokeLinecap="round"`，`strokeLinejoin="round"`，**源码中绝对零 Emoji**。

---

## 3. 具体实施步骤

### 步骤 1：现代前端基建装配与 Rollup 分包
1. 安装并配置 `tailwindcss`, `postcss`, `autoprefixer`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` 以及核心 Radix 原语（`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-slider`, `@radix-ui/react-tooltip` 等）；
2. 建立 `src/lib/utils.ts` 导出标准 `cn()` 辅助函数；
3. 在 `vite.config.ts` 中配置 Rollup 分包（`jsxgraph`, `katex`, `vendor`），执行 `pnpm build` 确保**主业务 JS Bundle 从 2,079 kB 暴降至 350 kB 以内**；
4. 配置 `tailwind.config.ts` 与 `src/styles/globals.css`，配置 JSXGraph 与 KaTeX 的隔离保护规则（`.jxgbox svg { display: inline; }`）。

### 步骤 2：shadcn/ui 原子标准件落地
在 `src/components/ui/` 中构建纯浅色液态玻璃标准件：
1. `Button`（含 `pill` 胶囊变体、`nav-icon-btn` 32px 方圆变体、`preset-btn` 预设胶囊）；
2. `Sheet / Drawer`（手机端原生底部抽屉与平板侧抽，带顶部拖动手柄 `w-9 h-1.5 bg-black/20 rounded-full`）；
3. `Tabs`（对标 `stage-segmented-control` 的无痕毛玻璃滑动高亮分段胶囊）；
4. `Slider`（对标 `ios27_demo.html` 的极简外置滑块：4px 轨，18px 纯白实心圆 Thumb，hover 放大 1.15x）；
5. `Dialog`、`Tooltip`、`Badge`（考点 Tag 胶囊）。

### 步骤 3：全科门户（AllSubjectsPortal）重构
1. 重写 `src/AllSubjectsPortal.tsx`，彻底清除 1380 行内联样式，全面替换为 Tailwind 语义类名；
2. 落地学科记忆：用户在学习大厅点击“初中数学”后，自动写入 `localStorage.setItem('preferred_subject', 'math_junior')`；下次访问直接秒级直达初中数学工坊；
3. 保持全科学科大盘与六维核心素养雷达图。

### 步骤 4：初中数学工坊顶栏与三端物理壳层重构
1. 重构 `MathJuniorHome.tsx`，废除旧版 112px 双顶栏，落地 54px 统一高透毛玻璃工具栏：
   - 左侧常驻统一胶囊导航：**`[ ← 返回全科门户 ]`**（严格对标 `ios27_demo.html` 的 `.back-btn`），点击随时平滑切回全科门户大厅；
   - 中间为 4 大核心模块顶级分段控制器：`[ 探本溯源 · 概念精讲 | 经纬纵横 · 思维图谱 | 见微知著 · 实验探究 | 百炼成钢 · 实战测评 ]`，带有滑动高亮白色胶囊药丸；
   - 右侧保留中英双语切换与通知铃铛；
2. 落地 `src/components/shell/` 三端物理壳层：
   - 📱 **`MobileShell.tsx`（对标 iOS 27）**：
     * 容器严格锁定 `h-[100dvh] overflow-hidden`，绝对 0 横向滚动条；
     * 顶部 44px 毛玻璃顶栏（内容上滑时平滑过渡为防撞固定 Dock）；
     * 底部 56px 核心模块 Tab 栏，适配 `env(safe-area-inset-bottom)`；
     * 挂载既有模块时，确保所有画布区域挂载 `touch-action: none` 手势隔离；
   - 📟 **`TabletShell.tsx`（对标 iPadOS 27）**：
     * 落地 iPadOS 27 官方确立的**通顶边到边结构化侧边栏（左栏 300px~320px）**，配以 7% 极细发丝分割线（`border-r border-black/[0.07]`）；
     * 横屏 Master-Detail 双栏常驻，竖屏自适应折叠为侧滑抽屉；
     * 顶栏保留 `[ ⛶ 专注大画布 ]` 切换键，一键折叠侧栏铺满大画布；
   - 💻 **`DesktopShell.tsx`（对标 macOS 27 Golden Gate）**：
     * 落实**经典三栏黄金生产力驾驶舱（Master - Canvas - Inspector）**：
       - 左栏（260px 边到边导航树，系统原生鼠标平滑滚动）；
       - 中栏（弹性大画布，宽度自适应 >= 680px，核心交互区）；
       - 右栏（340px~380px 常驻检视器 Inspector 面板）；
     * **全过程零居中弹窗遮挡**，鼠标悬停平滑淡入 Tooltip，纯鼠标原生直觉流。

### 步骤 5：既有模块安全挂载与全量回归
1. 将既有的 4 大子模块（考点精讲、知识谱系、沙盒实验、全真模考）安全挂载进新的三端壳层中；
2. 严禁改坏 `src/modules/sandbox/invariants.ts`、`morphControllers.ts`、`safeExpression.ts` 及 `src/engine/db`；
3. 执行 `pnpm test`，确保全量 **54 个测试套件、323 个测试用例持续 100% PASS**。

---

## 4. 架构师量化验收门禁（硬性否决）

| 验收门禁 | 架构师实测手段 | 合格标准（量化指标） |
| :--- | :--- | :--- |
| **门禁 1：自动化回归** | 终端实跑 `pnpm test` | **54 个测试套件、323 个用例 100% PASS**（0 fail） |
| **门禁 2：打包体积暴降** | 终端实跑 `pnpm build` | 主业务 JS Bundle 从 **2,079 kB 暴降至 350 kB 以内** |
| **门禁 3：样式纯洁度审计** | 正则静态扫描全工程 | 1. 门户与主壳层内联 `style={{` **减少 95% 以上**<br>2. 源码中 `emoji` 残留数 = **0** |
| **门禁 4：真浏览器三端控制台** | 真实浏览器以 390x844、820x1180、1440x900 访问 | 1. 控制台 **0 Error、0 Warning**<br>2. 手机端 `scrollWidth === clientWidth`（**绝对零横向滚动条**） |
| **门禁 5：学习大厅记忆直达** | 模拟浏览器重开与刷新 | 存有记忆时直接进入数学工坊；工坊顶栏具备 `[ ← 返回全科门户 ]` 返回入口 |
