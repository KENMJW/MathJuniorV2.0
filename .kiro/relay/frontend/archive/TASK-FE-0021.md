---
id: TASK-FE-0021
line: frontend
status: assigned
attempt: 1
created_by: Kiro (架构师 / PM / 验收负责人)
title: 【任务二：模型一重绘】46 概念沙盒与模块一三大支柱全量交互闭环
model: default
concurrency: 1
---

> **执行方式（硬性，遵照 collaboration-protocol §7 + §8）**：
> - **本机执行**（前端会话 Dialogue A 本地跑，完成后提交）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 1`：串行执行，完成后进行架构师量化验收。
> - **前端交互/渲染任务，验收必须走真实浏览器与自动化测试（§8）**：全量既有 323 个测试必须持续通过（新写测试用例必须全绿），真机控制台在 Phone (390x844)、Pad (820x1180)、PC (1440x900) 0 error / 0 警告，手机端 0 水平滚动条。

# 【任务二：模型一重绘】46 概念沙盒与模块一三大支柱全量交互闭环

## 1. 任务背景与核心使命

在第一阶段（TASK-FE-0020）中，我们已落地了轻至 230kB 的全局基建与三端物理外壳。

本任务（TASK-FE-0021）将全面攻坚 **模块一【探本溯源 · 概念精讲】（107 个微观考点）**：
彻底解决旧版“图形干瘪只有几根裸线、没有面积感、看不出守恒直观、母题答案直接全屏甩出”的核心教学痛点，全面消费数据层在 `TASK-DATA-0013` 与 `TASK-DATA-0014` 中增强的高价值教研资产：
1. **46 个概念沙盒 `visual_elements_json`**（红蓝半透明声明式多边形填充面、颜色语义、直角标）；
2. **138 步双语 `inquiry_steps_json`**（1~3 步自适应引导任务清单与 Aha 顿悟微弹窗）；
3. **黄金母题 1~4 阶思维阶梯手风琴**（审题题眼 ➜ 本真模型 ➜ 严密推导踩分点 ➜ 避坑指南）；
4. **单点 3 题快练闭环**（48px 选项热区、即答即判、错题点拨与 `[ 📖 回看概念精讲 ]` 直达入口、1~3 星评定结算）。

> ⚠️ **【本任务禁止项（红线）】**：
> 1. 🔴 **绝对严禁修改** `LeapLab.tsx`、模块二【知识谱系】泳道算法及模块三【沙盒大厅】（留待任务三执行）；
> 2. 🔴 **绝对严禁破坏** 既有 54 个测试套件、323 个测试用例，所有测试必须持续 100% 绿灯；
> 3. 🔴 **绝对严禁引入** 源码 Emoji 与未经批准的全键盘快捷键；
> 4. 🔴 **严格遵循** `ios27_demo.html` 的 Apple HIG 视觉标尺，维持 Slate 900（`#0f172a`）深色专业光学暗室高对比度呈现。

---

## 2. 详细实施步骤

### 步骤 1：数据源映射打通 (`src/MathJuniorHome.tsx` & `src/modules/sandbox/SandboxRenderer.tsx`)
1. 在 `src/MathJuniorHome.tsx` 的 `loadSandboxData` 查询中，将数据库 `concept_sandboxes` 表中的 `visual_elements_json` 与 `inquiry_steps_json` 字段正确映射到 `SandboxConfig` 中，不得遗漏；
2. 在 `src/modules/sandbox/SandboxRenderer.tsx` 中扩展 `SandboxConfig` 接口定义，声明 `visual_elements_json?: string;` 与 `inquiry_steps_json?: string;`。

### 步骤 2：46 概念沙盒声明式几何填充面与直角标渲染 (`src/modules/sandbox/SandboxRenderer.tsx`)
1. **多边形填充面引擎**：
   - 解析 `config.visual_elements_json`；
   - 提取 `polygons` 数组：
     * 读取顶点序列坐标与样式参数（`fillColor`, `fillOpacity: 0.18~0.25`, `strokeColor`, `strokeWidth: 1.8`）；
     * 使用 JSXGraph 原生 `board.create('polygon', points, { fillColor: ..., fillOpacity: ..., borders: { strokeColor: ..., strokeWidth: 1.8 }, hasInnerPoints: true })` 绘制物理感高透半透明染色面；
     * 对齐颜色语义：主图形系统蓝 `#0071e3`、辅助图形翡翠绿 `#34c759`、目标状态琥珀橙 `#ff9500`、极端反例危险红 `#ff3b30`；
   - 解析 `rightAngles` 数组：
     * 自动绘制高对比度直角标志（尺规作图角标），用于垂径定理、切线、勾股定理等几何考点；
2. **Slate 900 光学暗室对比度防御**：
   - 维持画布底色 `#0f172a`；所有动点、填充面、标注文字通过 `ensureVisibleOnDark` 防御函数，确保暗室中清晰醒目。

### 步骤 3：1~3 步自适应探究引导与 Aha 顿悟微弹窗 (`src/modules/concept/LinkedSandboxSlot.tsx`)
1. **步骤状态机与任务清单**：
   - 解析 `config.inquiry_steps_json`（数组长度 1~3）；
   - 在沙盒视窗下方仪表盘（`.sandbox-guide-15`，`#1e293b`）上方渲染**步骤指示胶囊**：
     * 呈现当前步骤（如 `步骤 1/3: 探究正有理数与分数定位`）；
     * 呈现引导说明（支持双语 `guideTextZh` / `guideTextEn`）；
2. **目标条件达成即时判定与 Aha 弹窗**：
   - 基于 `evaluateSafeExpression` 纯函数，根据动点当前坐标或滑块 `paramValues` 动态求值判定 `targetCondition`；
   - 达成条件瞬间：弹出 **Aha! 顿悟微弹窗**（轻量级 iOS 27 浅色毛玻璃浮层，显示名师核心顿悟秘籍 `ahaInsight`），播放微弹簧动画，自动解锁下一步骤；
   - 常驻提供 `[ 🌟 直接开启自由把玩 ]` 胶囊按钮，学生随时可跳过引导直接操作。

### 步骤 4：支柱 ②【考点黄金母题】1~4 阶思维阶梯手风琴 (`src/modules/concept/PointMasterExample.tsx`)
1. 彻底淘汰生硬长篇答案直接平铺，重构为 **1~4 阶思维脚手架手风琴（Accordion）**：
   - `[ 💡 思维阶梯 1：审题题眼与隐藏条件 ➜ ]`（点按平滑展开题眼剖析）
   - `[ 💡 思维阶梯 2：本真直观与数形模型 ➜ ]`（展开图形几何与代数对应）
   - `[ 💡 思维阶梯 3：严密推导与中考踩分点 ➜ ]`（展开 LaTeX 严密踩分步骤）
   - `[ 💡 思维阶梯 4：避坑指南与防扣分生死线 ➜ ]`（展开警示红框）
2. 全量采用 Tailwind 原子类与 iOS 27 液态玻璃卡片，清理残留内联样式，按钮挂载 `active:scale-[0.98]` 物理按压反馈。

### 步骤 5：支柱 ③【单点 3 题快练】即答即判与闭环打星 (`src/modules/concept/QuickPractice.tsx`)
1. 单考点抽取 3 道经典真题，单题全宽卡片呈现；
2. 选项热区高度 48px，点击即判正误；
3. 答错时即时滑出名师错因辨析，并常驻直达按钮：**`[ 📖 回看概念精讲 ]`**，一键切回四段精讲；
4. 3 题作答完毕后，输出本考点核心素养掌握度星级评定（1~3 星）。

### 步骤 6：三端物理人机工效与四段精讲贯通 (`src/modules/concept/ConceptFourStages.tsx`)
1. 📱 **手机端**：
   - 上方 280px 沙盒/图解吸顶锁定，容器严格声明 **`touch-action: none`**，动点触控响应半径扩大至 `>= 24px`，单指拖拽**绝对不引发整个网页上下乱滚**；
   - 下方讲义正文滚动区，正文底部常驻全宽胶囊 CTA（`[ 下一阶段：② 本真透视 ➜ ]`），大拇指在屏幕下方轻点即可单手推进下一幕；
2. 📟 **平板端**：iPadOS 27 通顶结构化左栏（300px 考点树），右栏主舞台大画布，顶栏常驻 `[ ⛶ 专注大画布 ]` 切换；
3. 💻 **电脑端**：macOS 27 经典三栏驾驶舱（左栏 260px 考点树 + 中栏 >=680px 画布精讲 + 右栏 340px 常驻母题阶梯与快练卡），**零居中弹窗遮挡**！

---

## 3. 架构师量化验收门禁（5 大硬性否决门禁）

| 门禁项 | 架构师实测手段 | 合格标准（量化指标） |
| :--- | :--- | :--- |
| **门禁 1：自动化回归** | 终端独立实跑 `pnpm test` | **既有 54 个测试套件、323 个用例 + 新增测试 100% PASS**（0 fail） |
| **门禁 2：46 概念沙盒全量覆盖** | 自动化测试脚本抽验 | 1. 46 个概念沙盒 `visual_elements_json`（填充面与直角标）正常解析与渲染<br>2. 1~3 步自适应探究与 Aha 顿悟状态机流转正常 |
| **门禁 3：母题与快练三端交互** | Chrome E2E 真实浏览器实测 | 1. 母题 1~4 阶手风琴点击逐级平滑展开，无闪烁<br>2. 快练 3 题即答即判，打星结算，错题具备 `[ 📖 回看概念精讲 ]` 直达入口 |
| **门禁 4：手机端绝对手势隔离** | 真实无头 Chrome 390x844 触控拖拽 | 1. 沙盒内拖动动点时 `touch-action: none` 生效，**页面绝对零上下滚动误触**<br>2. 手机端 `scrollWidth === clientWidth`（绝对 0 水平溢出） |
| **门禁 5：样式与红线坚守** | 正则与源码扫描 | 1. 模块一代码内联样式 `style={{` 残留数 <= 5 处（仅限动态坐标）<br>2. 源码中 emoji 残留数 = 0 |
