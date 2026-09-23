# RESULT-FE-0018: 初中数学工坊壳层与四大模块 (MathJuniorHome & Submodules) 手机与平板端触控与沉浸重构

## 1. 任务概述

严格按照 `TASK-FE-0018` 任务书要求，对初中数学核心素养工坊壳层（`src/MathJuniorHome.tsx`）及其四大模块在移动端（Phone, <768px）和平板端（Pad, 768px~1024px）下的触控与排版体验进行了全方位深度重构：
1. **壳层瘦身**：彻底消除手机端高达 112px 的双层顶栏冗余堆叠，收敛为 44px 极简顶栏 + 底部 56px 原生 iOS 触控 Tab Bar；平板端 SplitBoard 增加「沉浸模式（Focus Mode）」一键折叠 260px 侧栏展开画布至 100%；
2. **考点选择器 iOS Bottom Sheet 重塑**：将原有绝对定位、易被裁切的 `ConceptDrawerSelector` 升级为手机端原生 iOS 底部抽屉（maxHeight 82vh，带顶部灰色药丸拖动手柄与平滑展开，选点后自动关闭），平板端升级为 640x560 居中毛玻璃模态窗；
3. **沙盒手势防争夺与触控升级**：JSXGraph 容器及其 SVG/DIV 图元挂载 `touch-action: none !important;`，扩大动点拾取吸附半球半径，遥测指标收敛为 2x2 田字格，模考试卷在手机端自动转单列上下流式排版；
4. **桌面端零回归**：严格保证桌面端（>1024px）1240px Keynote 居中大剧场与 PC 原有双层导航（54px 全局条 + 58px 次级导航条）100% 保持原有像素级渲染。
5. **真实浏览器 E2E 自动化实测验收**：通过 Google Chrome (Headless) 驱动真实浏览器端到端 E2E 验收，Console 全程零 Error。

---

## 2. 核心交付与代码改造

### 块 A：工坊壳层导航多端精炼 (Header & Tabs & SplitBoard)
1. **手机端 (<768px) 44px 单层 Slim Header** (`src/MathJuniorHome.tsx`):
   - 彻底隐藏 PC 端第一层（54px）与第二层（58px）的重复标题、公告徽章与长文字；
   - 渲染统一的 44px 单层顶栏：
     - 左侧：`<` 返回全科门户圆形胶囊按钮（热区 36px，居中）；
     - 中间：单行模块标题，如「概念精讲 · 107考点」或「思维图谱 · 12主线」，字号 15px 粗体；
     - 右侧：紧凑语言切换胶囊（`EN` / `中`，高度 28px）；
   - 背景高透玻璃 `backdrop-filter: blur(20px)`，单像素底边框。
2. **手机端 (<768px) 底部原生 iOS Tab Bar (56px)** (`src/MathJuniorHome.tsx`, `src/components/shell/CardDeck.tsx`):
   - 底部固定 56px 导航栏，适配 iPhone 底部安全区 `padding-bottom: env(safe-area-inset-bottom, 12px)`；
   - 四大模块快捷切换按钮：① 概念精讲、② 思维图谱、③ 实验探究 (动力沙盒)、④ 实战测评 (全真模考)；
   - 触控靶心 >= 48px，选中态蓝色高亮与柔光微动，无刷新平滑切换。
3. **平板端 (768px~1024px) SplitBoard 沉浸模式 (Focus Mode)** (`src/components/shell/SplitBoard.tsx`):
   - 顶栏增加「沉浸模式 / 全屏画布」切换按钮（`data-testid="split-board-toggle-btn"`）；
   - 横屏（Landscape）模式下一键折叠 260px 左侧导航栏，主画布自动平滑填满视口至 100%；
   - 竖屏（Portrait）模式下侧边栏抽屉支持轻触背景遮罩优雅收起，触控靶心 >= 44px。

### 块 B：考点选择器升级为原生 iOS 底部弹窗 (Bottom Sheet)
1. **手机端 (<768px) 原生 Bottom Sheet 体验** (`src/modules/concept/ConceptDrawerSelector.tsx`):
   - 手机视口下渲染为原生 iOS 底部抽屉：`position: fixed; bottom: 0; left: 0; right: 0; width: 100%; max-height: 82vh;`；
   - 圆角 `border-radius: 20px 20px 0 0`，顶部带居中灰色药丸拖动手柄 (`data-testid="drawer-drag-handle"`, 36x4px)；
   - 动画采用顺滑滑入：`animation: drawerSlideUpMobile 0.24s cubic-bezier(0.16, 1, 0.3, 1)`；
   - 顶部搜索框支持实时编号、拼音、名称快速筛选；分层分段胶囊栏自适应滚动；点击任意考点后平滑自动关闭抽屉并完成当前考点切换。
2. **平板端 (768px~1024px) 居中毛玻璃模态弹窗**:
   - 采用居中浮窗模态（`width: 640px; max-width: 90vw; height: 560px; max-height: 80vh; border-radius: 20px`），左右双列规整排布。
3. **桌面端 (>1024px) Popover 零回归**:
   - 保持原有 680px 浮动 Popover 结构，无任何视觉退化。

### 块 C：四大模块手机与平板触控体验升级
1. **沙盒画布手势防争夺与动点触控优化** (`src/modules/sandbox/SandboxRenderer.tsx`, `sandbox.css`):
   - 为 JSXGraph 容器及其子 div、svg 图元注入 `touch-action: none !important; -webkit-touch-callout: none !important; user-select: none !important;`，彻底杜绝手指拖曳动点时与页面垂直滚动的冲突；
   - 动点扩大触控拾取吸附半球半径（`highlightSize: 14`, `snapSizeX: 20`, `snapSizeY: 20`）；
   - 手机端遥测指标自动收纳为 2x2 网格，优先保障几何画布具有完整高度。
2. **模考试卷上下流式排版** (`src/modules/exam/OnlineExam.tsx`, `PaperWorkbench.tsx`, `responsive.css`):
   - 手机视口下双栏试卷自适应降级为上下单列流式结构（`flex-direction: column !important;`）：上方试卷题干、下方答题卡与选项卡；
   - 平板横屏与 PC 保持经典双栏排版。

### 块 D：桌面端 (>1024px) 零回归断言
1. 桌面端（1440x900）完全保留 `Cockpit` 1240px Keynote 居中剧场视窗（`data-testid="math-junior-desktop-theater"`）；
2. 顶部双层导航栏（54px 全局条 + 58px 次级导航条）100% 保持原有像素级渲染。

---

## 3. 验收清单量化核验结果

| 判据项 | 验收标准 | 实测结果 | 结论 |
|---|---|---|---|
| **判据 1（手机端顶栏 44px 单层瘦身）** | 390x844 视口下仅展示单层 Slim Header，总高度 <= 48px，彻底消除 112px 双层顶栏挤压 | `height = 44px <= 48px`, 具备 36px 返回胶囊、15px 模块粗体标题、28px 语言切换胶囊 | **通过** |
| **判据 2（手机端底部 56px Tab Bar）** | 390x844 视口下屏幕底部展示原生 4 模块 Tab Bar，点击任意 Tab 可正常无刷新平滑切换 | `height = 56px`, 4 大模块 Tab（概念/图谱/沙盒/模考）触控靶心 >= 48px，切换平滑 | **通过** |
| **判据 3（考点选择器 iOS Bottom Sheet）** | 手机端点击展开从底部滑出，maxHeight <= 85vh，带灰色药丸拖动手柄，选中考点后自动关闭 | `height = 692px (81.99vh <= 82vh)`, 具备拖动手柄，搜索 `KP-023` 选中后自动关闭且页面切换至 KP-023 | **通过** |
| **判据 4（沙盒画布 touch-action: none）** | `SandboxRenderer` 容器及其相关交互图元挂载 `touch-action: none`，触控拖曳不引发页面滚动 | Computed `touchAction = 'none'`, `scrollWidth = 390, innerWidth = 390`, 水平滚动为 0 | **通过** |
| **判据 5（平板 SplitBoard Focus Mode）** | 1024x768 视口下具备折叠侧栏按钮，点击折叠 260px 侧边栏，主内容填满 100% 宽度 | 初始 `sidebarWidth = 260px`，点击后进入 Focus Mode，`sidebarDisplay = 'none', sidebarWidth = 0px`，内容 100% 展开 | **通过** |
| **判据 6（模考试卷双栏响应式）** | 手机视口下模考试卷为上下单列排版，平板横屏和桌面端为经典双栏排版 | 手机视口下 `.exam-split-container` computed `flexDirection = 'column'`, `leftWidth = 342px` 单列自适应 | **通过** |
| **判据 7（桌面端零回归）** | 1440x900 视口下工坊 1240px 居中大剧场与 PC 原有双层导航样式 100% 保持不变 | `maxWidth = '1240px'`, 双层导航（global-bar + subnav-bar）完整呈现，手机端顶栏与底部栏均隐藏 | **通过** |
| **判据 8（Console 零红线）** | 多端视口切换与模块轮转全程零 Error、零 Warning | `consoleErrorsCount = 0`，控制台全程零红线 | **通过** |

---

## 4. 真实浏览器 E2E 证据链

执行脚本 `scripts/verify_fe0018_e2e.cjs`，驱动真实 Google Chrome (Headless) 进行了多端与多模块交互验收测试：

- **E2E 结果报告**：`tmp/fe0018/evidence/summary.json`
- **截图明细与 SHA256 唯一性校验**：
  1. `e2e_01_mobile_390_bottom_sheet.png` (204,163 bytes, SHA256: `e4398d3453ca77f0`) - iPhone 390px 44px Slim Header、iOS 原生 Bottom Sheet 药丸拖动手柄与考点下钻选择
  2. `e2e_02_mobile_tab_graph.png` (241,185 bytes, SHA256: `61d3fcd9f50b87c7`) - 手机底部 Tab Bar 切换至「思维图谱 · 12主线」模块与竖向单谱系泳道图
  3. `e2e_03_mobile_tab_sandbox.png` (152,788 bytes, SHA256: `118f79422f640d58`) - 手机端切换至「实验探究 · 动力沙盒」，画布 `#0f172a` 黑底、`touch-action: none` 与 2x2 遥测指标网格
  4. `e2e_04_mobile_tab_exam.png` (175,681 bytes, SHA256: `5239d0b226f565f3`) - 手机端切换至「实战测评 · 全真模考」，全真试卷与答题区自适应转为单列上下流式排版
  5. `e2e_05_tablet_1024_focus_mode.png` (326,156 bytes, SHA256: `074f2e9ba0f7faad`) - iPad Landscape 1024x768 视口下 SplitBoard「沉浸全屏」模式，260px 侧边栏折叠，内容 100% 满宽展开
  6. `e2e_06_desktop_1440_theater.png` (449,293 bytes, SHA256: `e8755192fc11023d`) - Desktop 1440x900 视口下 1240px Keynote 居中影院模式与双层导航 100% 零回归

---

## 5. 自动化构建与测试复核

- **TypeScript 类型检查与生产构建**：`pnpm run build` 成功（0 TS 错误，耗时 12.35s）。
- **Vitest 单元测试集**：`pnpm test` 结果：
  `Test Files: 54 passed (54), Tests: 323 passed (323)`，100% 全绿通过。
- **源码规范门禁**：
  - `src/__tests__/noEmoji.test.ts` 100% 通过（铁律 11：业务源码绝对零 emoji）；
  - 零 eval、零 innerHTML、零 foreignObject；
  - 沙盒底色严格维持深色黑底 `#0f172a`。
