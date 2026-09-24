---
id: TASK-FE-0018
line: frontend
status: done
attempt: 1
created_by: Kiro
exec_machine: 本机（主控机）
title: 初中数学工坊壳层与四大模块 (MathJuniorHome & Submodules) 手机与平板端触控与沉浸重构
model: default
concurrency: 1
---

> **执行方式（硬性，照 collaboration-protocol §7 + §8）**：
> - **本机执行**（主控机本地跑，完成后正常提交）。
> - `model: default` = **Gemini 3.8 Flash (High)**。
> - `concurrency: 1`：初中数学工坊核心容器与子模块跨度大，建议严格串行执行并进行整体端到端联调。
> - **前端交互/渲染任务，验收必须走真实浏览器 E2E（§8）**：执行方在对话中输入 `/browser 查收 NEXT.md 并执行验收` 启动真实浏览器验收，Console 全程零 Error / 零 wasm 失败 / 零 fallback。

# 任务：初中数学工坊壳层与四大模块 手机与平板端触控与沉浸重构

## 1. 目标

重构初中数学核心素养工坊壳层（`MathJuniorHome.tsx`）及其四大模块在移动端（Phone, <768px）和平板端（Pad, 768px~1024px）下的触控与排版体验：
1. **壳层瘦身**：彻底消除手机端高达 112px 的双层顶栏冗余堆叠，收敛为 44px 极简顶栏 + 底部 56px 原生 iOS 触控 Tab Bar；平板端 SplitBoard 增加「沉浸模式（Focus Mode）」一键收起侧栏展开画布；
2. **抽屉多端重塑**：将目前绝对定位、容易被遮挡或裁切的 `ConceptDrawerSelector` 升级为：手机端原生 iOS 底部弹窗（Bottom Sheet，带拖动手柄与平滑展开），平板端 640x580 居中毛玻璃模态窗；
3. **触控与流式沉浸**：解决沙盒 JSXGraph 画布在移动端与页面滚动手势冲突（挂载 `touch-action: none`、扩大动点触控吸附半球半径 slop >= 24px）、遥测指标 2x2 手机网格收敛、以及双栏试卷在手机端自动转单列上下流式排版；
4. **桌面端零回归**：严格保证桌面端（>1024px）1240px Keynote 大剧场排版与双层导航 100% 完好无损。

## 2. 上下文与现状分析

- **涉及核心文件**：
  - `src/MathJuniorHome.tsx`（主壳层、顶栏、设备路由）
  - `src/components/shell/SplitBoard.tsx`（平板分栏骨架）
  - `src/components/shell/CardDeck.tsx`（移动端单列流骨架）
  - `src/modules/concept/ConceptDrawerSelector.tsx`（107 考点 4 级下钻选择抽屉）
  - `src/modules/concept/ConceptFourStages.tsx`（考点四段论精讲卡片）
  - `src/modules/sandbox/LeapLab.tsx`（36 跃迁模型与 4D 动力控制台）
  - `src/modules/sandbox/SandboxRenderer.tsx`（JSXGraph 画布手势与触控配置）
  - `src/modules/exam/PaperWorkbench.tsx` / `ExamArena.tsx`（双栏全真模考试卷）
- **现状缺陷定位**：
  1. **顶栏层级拥挤占用屏幕**：`MathJuniorHome` 包含第一层 54px 顶栏 + 第二层 58px 次级导航条，累计占用 112px 垂直空间，在 iPhone 视口中占据近 1/6 高度；
  2. **考点选择抽屉在窄屏下错位**：`ConceptDrawerSelector` 使用 `position: absolute; top: calc(100% + 10px); width: 680px;` 浮动盒。在手机屏幕上，不仅 680px 宽度被裁切，左侧 280px 栏目与右侧内容挤压在同一横排中，根本无法正常使用；
  3. **沙盒手势冲突**：学生在触控屏上滑动探索动点时，页面会触发整体上下滚动，无法精准操控几何动点；
  4. **模考双栏在手机端失衡**：全真模考页面左右两栏并排在移动端下每栏仅有约 170px，题干公式被截断，答题区无法正常打字或选填。

## 3. 具体步骤与交付块

### 块 A：工坊壳层导航多端精炼 (Header & Tabs & SplitBoard)

1. **手机端 (<768px) 44px 单层 Slim Header**：
   - 彻底隐藏 PC 端第一层（54px）与第二层（58px）的重复标题、冗余公告徽章与长文字；
   - 渲染统一的 44px 单层顶栏：
     - 左侧：`<` 返回全科门户圆形胶囊按钮（热区 36px，居中）；
     - 中间：单行模块标题，如「概念精讲 · 107考点」或「初中数学工坊」，字号 15px 粗体；
     - 右侧：紧凑语言切换胶囊（`EN` / `中`，高度 28px）；
   - 背景高透玻璃 `backdrop-filter: blur(20px)`，单像素底边框。
2. **手机端 (<768px) 底部原生 iOS Tab Bar (56px)**：
   - 底部固定 56px 导航栏（适配 iPhone 底部安全区 `padding-bottom: env(safe-area-inset-bottom, 12px)`）；
   - 四大模块快捷切换按钮：① 概念精讲、② 思维图谱、③ 压轴沙盒、④ 全真模考；
   - 触控靶心 >= 48px，选中态蓝色高亮与柔光微动。
3. **平板端 (768px~1024px) SplitBoard 沉浸模式 (Focus Mode)**：
   - 在 `SplitBoard.tsx` 顶栏增加「沉浸模式 / 全屏画布」切换按钮（Icon: `maximize` / `sidebar`）；
   - 横屏（Landscape）模式下允许学生点击折叠 260px 左侧导航栏，将右侧沙盒画布与模考试卷展开至 100% 宽度；
   - 竖屏（Portrait）模式下侧边栏抽屉支持轻触背景遮罩优雅收起，触控靶心 >= 44px。

### 块 B：考点选择器升级为原生 iOS 底部弹窗 (Bottom Sheet)

1. **手机端 (<768px) Bottom Sheet 体验**：
   - 当检测为手机视口时，`ConceptDrawerSelector` 渲染为原生 iOS 底部抽屉：
     - `position: fixed; bottom: 0; left: 0; right: 0; width: 100%; max-height: 82vh;`；
     - 圆角 `border-radius: 20px 20px 0 0`，顶部带居中灰色药丸拖动手柄 (`width: 36px; height: 4px; border-radius: 2px; background: rgba(0,0,0,0.2);`)；
     - 动画采用顺滑滑入：`animation: slideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1)`；
   - **分层选择逻辑重塑**：
     - 顶部：搜索框（支持实时拼音/名称搜索，一键清空）；
     - 第一层/第二层：年级（7/8/9年级）与学期（上/下）改为横向分段胶囊滑动栏（Segmented Scroll Bar）；
     - 核心内容区：按领域与单元分类展开的考点列表，单列卡片纵向滚动，考点名称、必考徽章清晰展示；
     - 点击考点后，自动平滑关闭抽屉并完成当前考点切换。
2. **平板端 (768px~1024px) 居中毛玻璃模态弹窗**：
   - 平板端采用居中浮窗模态（`width: 640px; max-width: 90vw; height: 560px; max-height: 80vh;`）；
   - 左右双列规整排布：左侧年级/学期/单元导航，右侧考点列表，消除原先超长漂浮问题。

### 块 C：四大模块手机与平板触控体验升级

1. **模块一 (ConceptNav & FourStages)**：
   - 手机端四段论（本真引入、几何直观、变式跃迁、压轴母题）Tab 胶囊支持横向滑动，触控热区 >= 44px；
   - 精讲正文卡片在 375px~430px 下自适应边距（14px），LaTeX 公式自动支持水平轻量滚动，杜绝撑坏页面。
2. **模块二 (GraphNav & LineSwimlane)**：
   - 12 谱系选择器在手机端自适应折叠为轻量下拉胶囊或水平轮播；
   - 竖向泳道图（LineSwimlane）在手机端与平板竖屏下采用流式单列排列，学期节点清晰有序。
3. **模块三 (LeapLab & 动态动力学沙盒)**：
   - **画布触控手势防争夺**：
     - 在 `SandboxRenderer.tsx` 中为 JSXGraph 容器注入 `touch-action: none;`；
     - 对动点、滑块控制柄的触控判定半径进行优化（`snapSizeX/Y` 与点拾取半径扩大，slop >= 24px），支持手指与 Apple Pencil 高精度拖曳；
   - **4D 面板手机端收缩**：
     - 手机端将 4D 控制台（载体/参数/姿态/X-Ray）与遥测指标卡收纳至画布下方的折叠面板或 2x2 网格，优先保障几何画布具有至少 260px~320px 的完整高度。
4. **模块四 (PaperWorkbench & ExamArena)**：
   - 手机端将双栏印刷试卷自适应降级为上下单列流式结构：
     - 上方：题干信息、已知条件与动态配图；
     - 下方：答题输入区、选项选择卡与评分细则；
   - 平板端横屏保留双栏高仿试卷，竖屏平滑转为紧凑流式。

### 块 D：桌面端 (>1024px) 零回归断言

1. 桌面端（Desktop）完全保留现有 `Cockpit` 1240px Keynote 居中剧场视窗；
2. 顶部双层导航栏、三级下钻卡片与已有交互行为 100% 保持原有像素级渲染。

## 4. 验收清单（可量化，Kiro 据此验收）

- [ ] **判据 1（手机端顶栏 44px 单层瘦身）**：在 390x844 视口下，`MathJuniorHome` 仅展示单层 Slim Header，总高度 <= 48px，彻底消除 112px 双层顶栏挤压。
- [ ] **判据 2（手机端底部 56px Tab Bar）**：在 390x844 视口下，屏幕底部展示原生 4 模块 Tab Bar，点击任意 Tab（如概念/图谱/沙盒/模考）可正常无刷新平滑切换模块。
- [ ] **判据 3（考点选择器 iOS Bottom Sheet）**：在手机视口下点击展开考点选择器，抽屉从屏幕底部滑出，最大高度 <= 85vh，带顶部灰色药丸拖动手柄，左右无裁切无横向溢出，点击考点后自动选中并关闭抽屉。
- [ ] **判据 4（沙盒画布 touch-action: none）**：`SandboxRenderer` 容器及其相关交互图元挂载 `touch-action: none`，手机/平板触控拖曳动点时不引发页面上下滚动。
- [ ] **判据 5（平板 SplitBoard Focus Mode）**：在 1024x768 平板视口下，SplitBoard 顶部具备折叠侧边栏按钮，点击可平滑隐藏 260px 侧边栏，主画布自动填满 100% 宽度。
- [ ] **判据 6（模考试卷双栏响应式）**：在手机视口下模考试卷为上下单列排版，在平板横屏和桌面端为经典双栏排版。
- [ ] **判据 7（桌面端零回归）**：在 1440x900 视口下，工坊 1240px 居中大剧场与 PC 原有导航样式 100% 保持不变。
- [ ] **判据 8（Console 零红线）**：页面在手机、平板、桌面三种模式切换以及四个模块点击轮转时，控制台保持 **零 Error、零 Warning 报警**。

## 5. 红线 / 禁止事项

1. **源码零 emoji**：遵循铁律 11，严禁引入 emoji，一律使用 `<Icon name="..." />` 或 SVG。
2. **安全防线**：严禁引入 `eval`、`innerHTML` 或 `foreignObject`。
3. **沙盒底色铁律**：几何沙盒背景**必须严格保持黑底 `#0f172a`**，严禁改动任何已有物理模型图元配色。
4. **向后兼容性**：不得破坏已有 246+ 自动化单元测试与核心数据库查询逻辑。

## 6. 浏览器端到端 (E2E) 验收规范（按 protocol §8 执行）

- **启动方式**：执行者在对话框输入 `/browser 查收 NEXT.md 并执行验收`。
- **前置准备 (Setup)**：
  - 访问 `http://127.0.0.1:4173/math-junior`；
- **动作链 (Action Chain)**：
  1. **Step 1 (Mobile 390x844 壳层与 Bottom Sheet)**：
     - 设置视口为 390x844，进入 `/math-junior`；
     - 检查顶栏高度 <= 48px，底部展示 Tab Bar；
     - 点击考点选择按钮，验证 Bottom Sheet 从底部滑出；在搜索框输入 `KP-023` 或 `配方法`，选中该点，验证抽屉自动关闭且正文切换为 KP-023；
  2. **Step 2 (Mobile 390x844 模块轮转与沙盒触控)**：
     - 依次点击底部 Tab Bar 切换至「思维图谱」、「压轴沙盒」、「全真模考」；
     - 在沙盒页面拖动滑块与动点，断言页面无异常抖动与横向滚动；
     - 在模考页面断言试卷为上下流式排版；
  3. **Step 3 (Tablet 1024x768 Focus Mode)**：
     - 设置视口为 1024x768，点击 SplitBoard 顶部全屏沉浸按钮，断言侧栏收起，主内容平滑填满视口；
  4. **Step 4 (Desktop 1440x900 零回归)**：
     - 设置视口为 1440x900，验证 1240px 居中影院正常，双层导航功能完备；
  5. **Step 5 (Console 检查)**：全程检查控制台，断言零 Error。
- **结果留痕**：在 `outbox/RESULT-FE-0018.md` 中记录各步骤测试结果与截图/日志。

## 7. 回写要求

完成后：
1. 结果写入 `outbox/RESULT-FE-0018.md`；
2. 将本任务书文件头 `status` 改为 `done`；
3. 在对话中明确播报一句 `"TASK-FE-0018 完成"`，原地进入 STANDBY 待命。

## 8. 协议约束（固定，勿改）

- 完成本任务 → 回写结果 + 标记 status: done + 播报完成；
- 原地 STANDBY 待命，等待用户下达下一指令（不自动死循环轮询）；
- 若遇到 `WAIT-USER` → 立即停止，等待用户介入。
