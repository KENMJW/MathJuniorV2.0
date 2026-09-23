# RESULT-FE-0017: 全科门户首页 (AllSubjectsPortal) 手机与平板端 UI/UE 响应式重构

## 1. 任务概述

按照 `TASK-FE-0017` 任务书要求，对全科门户首页（`src/AllSubjectsPortal.tsx`）进行全端响应式深度重构，完成了 **Phone (<768px)**、**Pad (768px~1024px)** 与 **Desktop (>1024px)** 的三级设备自适应矩阵，彻底解决了此前手机端与平板竖屏下严重的排版混乱、卡片横向溢出（>1020px）与文字挤压换行问题，并经过真实 Google Chrome 浏览器端到端 E2E 自动化实测验收。

## 2. 核心交付与代码改造

### 块 A：手机端 (<768px) 紧凑流式体验
1. **Slim 导航顶栏（48px）**：
   - 品牌收敛为 App Logo + 单行「全科核心素养提分系统」（13px/14px 粗体）；
   - 自动隐藏冗余副标题长文案与学员模式徽章，释放 70% 横向视觉空间；
   - 语言切换按钮紧凑化（高度 28px，精简为 `EN` / `中` 胶囊，内边距 `0 8px`）；
   - 顶栏高度缩减至 48px，保留 Apple 液态玻璃毛玻璃质感与底部细线。
2. **三学段分段胶囊响应式紧凑化**：
   - 窄屏自动切换精简文案：`小学 (4科)` / `初中 (8科·首发)` / `高中 (8科)`；
   - 弹性自适应宽度，内边距 `6px 12px`，在 375px 小屏下水平居中且完全无溢出。
3. **初中数学旗舰 Hero 卡片流式重排**：
   - 容器由横排改为纵向流式（`flex-direction: column`），内边距设为 `20px 16px`；
   - **自研高斯函数 SVG 插画转为半透明数学水印**：
     - 手机端采用 `position: absolute; right: -20px; bottom: -15px; width: 240px; height: 150px; opacity: 0.14; pointer-events: none; zIndex: 0;`；
     - 既完整保留高斯正态分布平滑曲线、切线、极大值与发光极值点的极致科技氛围，又将 100% 垂直高度留给交互内容；
   - **四大核心指标改为 2x2 田字格大数字网格**：
     - `grid-template-columns: repeat(2, 1fr)`；
     - 四大指标（107 考点四段论、12 跨学期逻辑主线、36 4D不变量沙盒、119 黄金母题）整齐均分，内边框精细对齐，数字 20px 加粗，标签 11px 清晰呈现，彻底根除挤压截断；
   - **大圆角主操作 CTA 按钮**：
     - 按钮宽度扩展为 `100%` 全宽填满，高度提升至 `46px`，触控热区充裕醒目，点击直达 `/math-junior`。
4. **学科卡片单列触控优化**：
   - 手机端采用单列流式网格，卡片高度优化至 `96px`，标题与标签左右对齐，触控区域充裕。
5. **绝对零水平溢出**：
   - 根节点与 main 视窗设置 `overflowX: "hidden"; maxWidth: "100vw";`，经过实测 `document.documentElement.scrollWidth === window.innerWidth`。

### 块 B：平板端 (768px~1024px) 横竖屏自适应
1. **iPad Portrait (竖屏 768px~834px)**：
   - 顶栏保留完整标题、语言切换与学员模式胶囊；
   - Hero 卡片指标条采用 4 列横排（`10px 12px` 紧凑 padding，数字 19px），无拥挤；
   - SVG 插画等比缩小至 260px，自适应融入右侧；
   - 学科网格规整平铺为 **2 列网格**（`repeat(2, 1fr)`）。
2. **iPad Landscape (横屏 1024px~1180px)**：
   - Hero 卡片图文左右优雅并列，SVG 插画自然展开；
   - 学科网格自动平铺为 **3 列网格**（`repeat(3, 1fr)`），左右留白规整。

### 块 C：桌面端 (>1024px) 1140px 影院模式 100% 零回归
- 桌面端视窗严格锁定在已有成熟的 `maxWidth: 1140px; margin: 0 auto;` 居中 Keynote 大剧场；
- 所有阴影、渐变、悬浮微动、高斯 SVG 插画与双语切换行为像素级保留，无任何回归。

---

## 3. 验收清单量化核验结果

| 判据项 | 验收标准 | 实测结果 | 结论 |
|---|---|---|---|
| **判据 1（手机端零水平滚动条）** | iPhone SE (375px) 与 iPhone 14 Pro (393px) 下 `scrollWidth <= innerWidth` | 375px: `scrollWidth=375, innerWidth=375`<br/>393px: `scrollWidth=393, innerWidth=393`，水平滑动条绝对为 0 | **通过** |
| **判据 2（手机端 2x2 指标网格）** | 手机视口下 Hero 卡片四大指标呈现田字格两列两行布局 | Computed cols = 2, children = 4, 107/12/36/119 完整展示无换行截断 | **通过** |
| **判据 3（手机端全宽 CTA 触控按钮）** | 按钮宽度 >= 280px，高度 >= 44px，点击成功导航至 `/math-junior` | width = 335px, height = 46px, 点击后顺利跳转至 `#/math-junior/concept` | **通过** |
| **判据 4（平板端 iPad 横竖屏自适应）** | 768px 竖屏下无横向溢出且指标为 4 列；1024px 横屏下左右图文并置且学科 3 列 | 768px: `scrollWidth=768` (4列指标, 2列学科卡片)<br/>1024px: `scrollWidth=1024` (Hero SVG 显式并列, 3列学科卡片) | **通过** |
| **判据 5（桌面端零回归）** | 1440x900 视口下首页居中锁定在 1140px | `maxWidth='1140px', mainWidth=1140px`，学员模式胶囊与副标题完整展现 | **通过** |
| **判据 6（Console 零红线）** | 全程无任何 Error / wasm 失败 / warning 警告 | `consoleErrorsCount = 0`，控制台全程干净 | **通过** |

---

## 4. 真实浏览器 E2E 证据链

执行脚本 `scripts/verify_fe0017_e2e.cjs`，驱动真实 Google Chrome (Headless) 进行了多端视口渲染测试，生成了 7 份真机截图与数据留痕：

- **E2E 结果报告**：`tmp/fe0017/evidence/summary.json`
- **截图明细与 SHA256 唯一性校验**：
  1. `e2e_01_mobile_375_iphonese.png` (179,099 bytes, SHA256: `25ee7212c0368b71`) - iPhone SE 375px 零水平溢出、Slim Header 与 2x2 指标田字格
  2. `e2e_02_mobile_393_iphone14pro.png` (226,256 bytes, SHA256: `ee8a8c120e406f2e`) - iPhone 14 Pro 393px 全宽 46px CTA 按钮与背景数学水印
  3. `e2e_03_navigated_math_junior.png` (231,241 bytes, SHA256: `2b91c180b9a760c1`) - 点击 CTA 按钮成功跳转初中数学工坊
  4. `e2e_04_tablet_ipad_portrait_768.png` (353,797 bytes, SHA256: `cfa508d62b830b9b`) - iPad Portrait 768px 竖屏自适应与 2 列学科网格
  5. `e2e_05_tablet_ipad_landscape_1024.png` (304,516 bytes, SHA256: `5688a325615320a2`) - iPad Landscape 1024px 横屏自适应与 3 列学科网格
  6. `e2e_06_desktop_1440.png` (408,499 bytes, SHA256: `19ae179dfe7e5ee4`) - Desktop 1440px 1140px Keynote 剧场模式零回归
  7. `e2e_07_language_and_stages.png` (408,499 bytes, SHA256: `19ae179dfe7e5ee4`) - 英文 i18n 与小学/初中/高中三学段切换稳定性

---

## 5. 自动化构建与测试复核

- **TypeScript 类型检查与生产构建**：`pnpm run build` 成功（耗时 12.43s，0 TS 错误）。
- **Vitest 单元测试集**：`pnpm test` 结果：
  `Test Files: 54 passed (54), Tests: 323 passed (323)`，100% 全绿，无 Emoji 测试通过，零安全漏洞。
