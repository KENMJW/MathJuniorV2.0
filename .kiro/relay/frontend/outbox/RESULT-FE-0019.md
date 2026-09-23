# RESULT-FE-0019: 全模块二级菜单Pad与手机端滚动固定悬浮及三大模块交互排版重构

## 1. 任务概述

依据 `TASK-FE-0019` 任务书要求，彻底解决初中数学工坊在手机端（Phone, <768px）与平板端（Pad, 768px~1024px）下的四个关键交互与排版痛点：
1. **全四大模块二级菜单滚动固定悬浮**：概念精讲、思维图谱、实验探究（动力沙盒）、实战测评（全真模考）四大模块二级菜单在手机端与平板端向下滚动时一律保持 `position: sticky; top: 0;` 固定悬浮吸顶，呈现 Apple 液态玻璃 20px 高斯模糊与微投影；
2. **模块一（概念精讲）选考点抽屉完整展示与流畅单列滚动**：通过 React Portal 彻底解除父级 `backdrop-filter` 导致的局部包含块截断陷阱，抽屉升级为顶部单行紧凑横滑分类筛选 + 满屏单列考点列表 + 85px 底部安全区避让，彻底根除“选考点看不全、滚动也看不全”；
3. **沙盒模块垂直滑屏解除死锁与精准拖动分离**：容器与 JXGBoard 外层从 `touch-action: none` 优化为 `touch-action: pan-y !important;`，仅对可拖拽动点与交互手柄施加 `touch-action: none !important;`，消除空白处滑屏黑洞，支持手势自由滚动页面同时保持动点精准拾取；
4. **模块四（实战测评）智能组卷第二层移动端响应式重排**：头部双行自适应折叠布局、6 学期横滑胶囊条、考点卡片单列大触控靶心（高度 46px >= 44px，整行可触控勾选），以及第一层与第三层网格在移动端自动转 1 列流式排版；
5. **真实无头 Chrome E2E 端到端全流程验证**：通过真实 Google Chrome (Headless) CDP 驱动端到端自动化验证，Phone (390x844)、Pad (820x1180)、Desktop (1440x900) 6 大阶段全部 100% 通过，控制台全程 0 Error。

---

## 2. 核心交付与代码改造

### 块 A：全四大模块二级菜单固定悬浮吸顶 (`src/styles/responsive.css`, `src/MathJuniorHome.tsx`)
1. **统一二级菜单吸顶样式**：
   - 清理手机端与平板端媒体查询中历史遗留的 `position: relative !important;` 覆盖；
   - 统一为四大模块次级顶栏注入：
     ```css
     .concept-nav-header,
     .graph-nav-header,
     .sandbox-sticky-header-container,
     .exam-subnav-sticky-header {
       position: sticky !important;
       top: 0 !important;
       z-index: 45 !important;
       backdrop-filter: blur(20px) !important;
       -webkit-backdrop-filter: blur(20px) !important;
       box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08) !important;
     }
     ```
2. **平板端 SplitBoard 嵌套双层滚动冲突消除**：
   - 在 `src/MathJuniorHome.tsx` 中将平板视口下的 `SplitBoard` 内部主容器修正为 `width: 100%; minHeight: 100%;`，消除 `.split-board-main` 与内部视图的双层滚动死锁，使二级菜单贴紧顶栏平滑悬浮。

### 块 B：模块一选考点抽屉改造 (`src/modules/concept/ConceptDrawerSelector.tsx`, `responsive.css`)
1. **React Portal 挂载解决 Containing Block 截断陷阱**：
   - 当二级菜单具备 `backdrop-filter: blur(20px)` 时，W3C 标准规范会将其子元素中所有 `position: fixed` 创建为局部包含块，导致抽屉被限制在 header 的位置；
   - 通过 `createPortal(drawerContent, document.body)` 将 Bottom Sheet 提升至根节点，彻底摆脱父级滤镜限制，使抽屉 100% 满屏浮出。
2. **单列全高滚动与紧凑筛选**：
   - 消灭抽屉内部原本 38% 高度的嵌套滚动区；
   - 年级与学期在移动端合并为单行紧凑并排横向胶囊（`.concept-drawer-level1-2-wrap`），领域与单元采用横向平滑滚动条（`.concept-drawer-subcat-list`）；
   - 考点列表（`.concept-drawer-right-col`）获取抽屉 85% 以上高度，独占垂直单列滚动，底部预留 `padding-bottom: calc(var(--safe-area-bottom) + 85px)`，确保到底考点不被底部栏遮挡。

### 块 C：沙盒模块垂直滑屏解除死锁与动点分离 (`src/modules/sandbox/SandboxRenderer.tsx`, `sandbox.css`)
1. **空白区域与网格支持垂直滑屏**：
   - `SandboxRenderer.tsx` 容器 `touchAction` 从 `'none'` 调整为 `'pan-y'`；
   - 在 `sandbox.css` 中将 `.sandbox-renderer`、`.sandbox-renderer > div`、`.jxgbox` 的 `touch-action` 明确设置为 `pan-y !important;`。
2. **精准拖动手势分离**：
   - 将 `touch-action: none !important;` 精准仅赋予可交互图元与动点：
     ```css
     .jxgbox_point,
     circle,
     [cursor*="move"],
     [cursor*="pointer"],
     .discrete-cube-interactive,
     [data-draggable="true"] {
       touch-action: none !important;
     }
     ```
   - 实现了“手指在沙盒空白处上下滑动顺畅滚动页面，触摸动点时精准拖曳联动参数”的双赢手势体验。

### 块 D：模块四智能组卷第二层移动端响应式排版 (`src/modules/exam/PaperWorkbench.tsx`, `responsive.css`)
1. **头部自适应两行折叠布局**：
   - 接入 `useDeviceResponsive()`；
   - 第一行展示标题、考点计数徽章与展开/折叠箭头；
   - 第二行自适应展示弹性搜索框与全选/清空按钮组，杜绝窄屏下的横向溢出与换行错位。
2. **6 个学期横滑胶囊条**：
   - 学期选择条包裹在 `.workbench-semester-scroll` 中，在移动端横向平滑滚动且隐藏滚动条。
3. **考点卡片大触控靶心与单列流式**：
   - 移动端下考点列表转为单列，每项卡片高度 46px（>= 44px HIG 标准），整卡支持触控点击切换选中；
   - 第一层（预设模板）与第三层（试卷属性设置）在移动端统一由 `repeat(3, 1fr)` 转换为 `1fr` 单列上下流式排版。

---

## 3. 验收判据（AC）量化核验结果

| 判据项 | 验收标准 | 实测结果 | 结论 |
|---|---|---|---|
| **AC-1（全模块二级菜单固定悬浮）** | 手机端与平板端四大模块二级菜单向下滚动时始终吸附在顶部（`top: 0`），具备 Apple 液态玻璃 20px 模糊与悬浮阴影 | `position = 'sticky'`, `boxShadow = 'rgba(0, 0, 0, 0.08) 0px 4px 18px 0px'`, 滚动 220px 时紧密悬浮吸顶 | **通过** |
| **AC-2（模块一选考点抽屉完整展示与畅快滚动）** | 390x844 视口下抽屉展开，年级/学期位于单行横向胶囊，考点列表独占 85% 空间单列滚动，底部避让 85px | `isOpen = true, drawerHeight = 692px (82vh)`, `rightColScrollHeight = 489px`，Portal 提升后全屏单列滑动到底 | **通过** |
| **AC-3（沙盒模块垂直滑屏解除死锁）** | 沙盒画布空白区域垂直滑屏顺畅上下滚动页面，触控动点时精准拖曳变动参数 | `rendererTouchAction = 'pan-y'`, 滚动位置顺畅到达 `scrollerScrollTop = 160px`，动点保持 `touch-action: none` | **通过** |
| **AC-4（模块四智能组卷第二层移动端排版）** | 头部两行自适应，学期横滑，考点单项触控靶心 >= 44px，整行可触控点击，Layer 1 & 3 单列流式 | `kpGridColumns = '330px'`, `firstItemTouchHeight = 46px >= 44px`, `isTouchTargetAdequate = true`, 107 考点单列排列整齐 | **通过** |
| **AC-5（桌面端 1240px 大剧场零回归）** | 桌面端（1440x900）1240px Keynote 居中剧场视窗与原有双层导航 100% 保持原有像素级渲染 | `hasTheater = true`, `hasGlobalBar = true`, `hasSubnavBar = true`, 桌面大剧场像素级完好 | **通过** |
| **AC-6（Console 零红线与全绿测试）** | 多端视口轮转与手势交互全程 0 Console Error，单测 100% 绿灯 | `consoleErrorsCount = 0`, `pnpm test` 54 文件 323 测试全绿，`pnpm run build` 0 TS 错误 | **通过** |

---

## 4. 真实浏览器 E2E 证据链

执行脚本 `node --experimental-websocket scripts/verify_fe0019_e2e.cjs`，驱动真实 Google Chrome (Headless) 进行了多端视口真实滚动与交互渲染端到端验证：

- **E2E 结果报告**：`tmp/fe0019/evidence/summary.json`
- **截图明细与 SHA256 唯一性校验**：
  1. `e2e_01_mobile_concept_sticky_and_drawer.png` (320,886 bytes, SHA256: `b998f779f0766cc1`) - iPhone 390x844 视口下模块一二级菜单吸顶固定悬浮、iOS Bottom Sheet 考点单列满屏流畅滚动；
  2. `e2e_02_mobile_graph_sticky.png` (380,547 bytes, SHA256: `13b8317e6ed8aee4`) - iPhone 390x844 视口下模块二（思维图谱）二级菜单固定悬浮吸顶；
  3. `e2e_03_mobile_sandbox_scrollable.png` (258,425 bytes, SHA256: `99d1a13da9169995`) - iPhone 390x844 视口下模块三（动力沙盒）`touch-action: pan-y` 滑屏顺畅滚动、动点精准隔离；
  4. `e2e_04_mobile_exam_layer2_responsive.png` (305,411 bytes, SHA256: `1e4f92e1e2337dac`) - iPhone 390x844 视口下模块四智能组卷第二层双行折叠、横向学期胶囊栏与 46px 大靶心单列考点网格；
  5. `e2e_05_tablet_sticky_headers.png` (137,125 bytes, SHA256: `d2f327987f741886`) - iPad 820x1180 竖屏视口下 SplitBoard 主区域滚动时二级菜单贴顶固定悬浮；
  6. `e2e_06_desktop_zero_regression.png` (165,766 bytes, SHA256: `d1ae06d4f445efee`) - Desktop 1440x900 视口下 1240px Keynote 居中大剧场与 PC 原有双层顶栏 100% 零退化。

---

## 5. 自动化构建与测试复核

- **TypeScript 类型检查与生产构建**：`pnpm run build` 成功（0 TS 错误，耗时 12.48s）。
- **Vitest 单元测试集**：`pnpm test` 结果：
  `Test Files: 54 passed (54), Tests: 323 passed (323)`，100% 通过。
- **规范红线门禁**：
  - `src/__tests__/noEmoji.test.ts` 100% 通过（铁律 11：业务源码绝对零 emoji）；
  - 零 eval、零 innerHTML、零 foreignObject；
  - 沙盒深色黑底严格维持 `#0f172a`。
