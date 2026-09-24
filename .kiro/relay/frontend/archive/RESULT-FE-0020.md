# RESULT-FE-0020: 全局基建与三端外壳重构（对标 iOS 27 / iPadOS 27 / macOS 27）

## 1. 任务概述

依据 `TASK-FE-0020` 任务书要求，圆满完成了全科门户与初中数学工坊的全局现代基建与三端外壳物理层重构：
1. **现代前端基建装配与 Rollup 分包瘦身**：成功接入 Tailwind CSS 3.4、PostCSS、Autoprefixer、clsx、tailwind-merge、class-variance-authority、lucide-react 及 Radix UI 原语。通过 Rollup 精准分包策略，生产构建的 `index.js` 主包体积从原先超标的 **2,079 kB** 暴降至 **230.11 kB**（下降 88.9%，远优于 < 350 kB 验收门槛及 280 kB 挑战目标）；
2. **Apple HIG 视觉标尺与 shadcn/ui 原子标准件落地**：根据 `ios27_demo.html`（2009 行工程原型），建立 1:1 映射的 Design Tokens 与 Squircle 连续曲率圆角系统。在 `src/components/ui/` 中构建了 `Button`、`Badge`、`Tabs`、`Slider`、`Dialog`、`Sheet`、`Tooltip` 等高透浅色液态玻璃标准件；
3. **全科门户（AllSubjectsPortal）彻底重写**：彻底废除 1,380 行内联样式，全面替换为 Tailwind 语义类名。落地初中数学旗舰卡、全科科目大盘、六维核心素养雷达图与学科记忆直达逻辑；
4. **初中数学工坊 54px 统一顶栏与三端物理外壳重构**：
   - 彻底将旧版 112px 冗余双顶栏合二为一，升级为统一 54px 高透毛玻璃工具栏（含 `[ ← 返回全科门户 ]` 药丸胶囊、四大模块 iOS Segmented Control 分段控制器、中英语言切换及学员模式徽章），为主画布释放 58px 黄金纵向视野；
   - 落地 `MobileShell.tsx`（iOS 27 原生体验，100dvh 屏幕锁定，绝对 0 水平滚动条，顶部 44px 吸顶 Dock，底部 56px 原生 Tab 栏）；
   - 落地 `TabletShell.tsx`（iPadOS 27 边到边结构化侧边栏，横屏常驻/竖屏抽屉，触控靶心 >= 44px，专注大画布切换）；
   - 落地 `DesktopShell.tsx`（macOS 27 Golden Gate 经典三栏驾驶舱与 1240px Keynote 居中大剧场，无遮挡悬浮提示）；
5. **铁律红线严格恪守**：
   - `SandboxRenderer.tsx` 与 `LeapLab.tsx` 物理绘图与算法核心代码保持绝对零修改；
   - 源码中 Emoji 残留数清零（`noEmoji.test.ts` 绿灯通过）；
   - 零 eval、零 innerHTML、零 foreignObject；
   - 全量 54 个测试套件、323 个测试用例 100% PASS。

---

## 2. 架构师量化验收门禁（5 大门禁核验结果）

| 验收门禁 | 架构师实测手段 | 合格标准（量化指标） | 实际测试数据与表现 | 结论 |
| :--- | :--- | :--- | :--- | :---: |
| **门禁 1：自动化回归** | 终端实跑 `pnpm test` | 54 个测试套件、323 个用例 100% PASS（0 fail） | **54 passed (54), 323 passed (323)**，耗时 6.61s | **100% 通过** |
| **门禁 2：打包体积暴降** | 终端实跑 `pnpm build` | 主业务 JS Bundle 从 2,079 kB 暴降至 < 350 kB | **230.11 kB** (`dist/assets/index-BCMmkl1s.js`)，减少 88.9% | **100% 通过** |
| **门禁 3：样式纯洁度审计** | 正则与语义静态扫描 | 1. 门户与主壳层内联 `style={{` 减少 95% 以上<br>2. 源码中 emoji 残留数 = 0 | 1. `AllSubjectsPortal.tsx` 内联样式数：**0**<br>2. `MathJuniorHome.tsx` 内联样式数：**0**<br>3. 源码 Emoji 违规数：**0** | **100% 通过** |
| **门禁 4：真机三端控制台与视口** | 真实无头 Chrome E2E (Phone 390x844, Pad 820x1180, PC 1440x900) | 1. 控制台 0 Error、0 Warning<br>2. 手机端 `scrollWidth === clientWidth`（绝对 0 水平滚动条） | 1. 控制台错误数：**0**<br>2. 手机端 `scrollWidth` = 390, `clientWidth` = 390 (无横向滚动条) | **100% 通过** |
| **门禁 5：学习大厅记忆直达** | 模拟浏览器重开与记忆读写 | 存有记忆直接直达工坊；顶栏具备 `[ ← 返回全科门户 ]` 干净返回，绝不死循环跳回 | 1. 门户点击写入 `preferred_subject = 'math_junior'` 直达 `/math-junior/concept`<br>2. 点击返回清除记忆并携带 `?bypass_redirect=true` 干净回到门户 | **100% 通过** |

---

## 3. 详细交付清单与代码重构明细

### (1) 现代前端基建与原子组件
- **`postcss.config.js`**：配置 TailwindCSS 与 Autoprefixer；
- **`tailwind.config.ts`**：
  - Apple HIG 10 级字号标尺（`text-ios-title-lg` 34px 到 `text-ios-caption` 11px）；
  - 核心颜色 Token（`--bg-page: #fbfbfd`、`--ios-blue: #0071e3`、曜石深黑 `--text-primary: #1d1d1f` 等）；
  - Squircle 连续曲率圆角（8px / 14px / 22px / 9999px）；
  - 沙盒暗室 Tokens（`--sandbox-canvas: #0f172a`、`--sandbox-telemetry: #1e293b`）；
- **`src/styles/globals.css`**：
  - Tailwind 基础指令；
  - 顶部微光空间网格背景（Radial Gradient + 90px 柔光高斯模糊）；
  - JSXGraph SVG 渲染隔离规则（`.jxgbox svg { display: inline; }`）；
- **`src/lib/utils.ts`**：标准 `cn()` 类名合并工具（`clsx` + `tailwind-merge`）；
- **`src/components/ui/` 原子标准件**：
  - `button.tsx`：提供 `pill`、`primary`、`secondary`、`outline`、`ghost` 等 Apple HIG 变体；
  - `badge.tsx`：提供 `core`、`ready`、`pending` 等状态徽章；
  - `tabs.tsx`：Radix Tabs 驱动的 iOS Segmented Control 毛玻璃滑动分段胶囊；
  - `slider.tsx`：Radix Slider 驱动的 4px 轨道与 18px 纯白实心圆 Thumb 滑块（hover 1.15x 放大）；
  - `dialog.tsx`：Radix Dialog 驱动的浅色液态玻璃模态框；
  - `sheet.tsx`：移动端原生 Bottom Sheet 与 Side Drawer（带顶部拖动手柄 `w-9 h-1.5 bg-black/20 rounded-full`）；
  - `tooltip.tsx`：Radix Tooltip 驱动的轻量悬浮提示胶囊。

### (2) 全科门户首页全面重构 (`src/AllSubjectsPortal.tsx`)
- 彻底替换旧版 1,380 行内联样式为 Tailwind 响应式原子类；
- 接入 Lucide 单线图标（`GraduationCap`、`Globe`、`Zap`、`FlaskConical`、`Sprout`、`Scroll`、`Compass`、`Target`、`Activity` 等）；
- 新增“六维核心素养雷达总览图”卡片（抽象素养、逻辑推理、数学建模、直观想象、数学运算、数据分析）；
- 落地“初中数学核心素养工坊”旗舰卡片与 4 大指标徽章（107 考点、12 主线、36 模型、119 经典真题）；
- 学科记忆写入：点击“进入初中数学工坊”自动记录 `localStorage.setItem('preferred_subject', 'math_junior')`。

### (3) 初中数学工坊顶栏与三端物理壳层重构
- **`src/MathJuniorHome.tsx`**：
  - 废除旧版 112px 冗余双顶栏，合二为一为 54px 统一高透毛玻璃工具栏；
  - 左侧 `[ ← 返回全科门户 ]` 胶囊按钮（带有返回清除记忆与 `bypass_redirect=true` 机制）；
  - 居中 4 核心模块分段控制器（`探本溯源 · 概念精讲`、`经纬纵横 · 思维图谱`、`见微知著 · 实验探究`、`百炼成钢 · 实战测评`）；
  - 右侧通知铃铛、语言切换器（`data-testid="math-lang-toggle"`）及学员模式徽章；
  - 清理内联 `style={{` 为 0。
- **`src/components/shell/` 三端外壳**：
  - `MobileShell.tsx`：`h-[100dvh]` 容器防溢出，44px 紧凑毛玻璃 Header，56px 底部 Tab 栏（带 `env(safe-area-inset-bottom)` 避让）；
  - `TabletShell.tsx`：iPadOS 27 通顶边到边 260px~300px 侧边栏，7% 极细发丝分割线，触控靶心 >= 44px，提供“专注大画布”切换；
  - `DesktopShell.tsx`：macOS 27 宽屏大剧场驾驶舱，1240px Keynote 居中主视窗；
  - `CardDeck.tsx`、`SplitBoard.tsx`、`Cockpit.tsx`：全面完成 Tailwind 现代化改造。

---

## 4. 真实浏览器 E2E 验证截图凭证

验证脚本 `scripts/verify_fe0020_e2e.cjs` 通过 Chrome DevTools Protocol 采集的 8 张现场截图保存在 `tmp/fe0020/evidence/`：

| 截图编号 | 文件名 | 视口规格与测试场景 | 文件大小 | SHA256 哈希前缀 |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `fe0020_01_portal_desktop.png` | Desktop (1440x900) 全科门户首页渲染与 6 维雷达图 | 144.7 kB | `676871c8e2e8046d` |
| 2 | `fe0020_02_math_junior_desktop_54px.png` | Desktop (1440x900) 初中数学工坊 54px 统一高透顶栏 | 155.0 kB | `5a67bb40355c7b74` |
| 3 | `fe0020_03_portal_after_back.png` | Desktop (1440x900) 点击返回全科门户，Bypass 机制生效 | 144.7 kB | `676871c8e2e8046d` |
| 4 | `fe0020_04_tablet_splitboard.png` | Pad (820x1180) 平板端 SplitBoard 骨架与 >=44px 触控靶心 | 135.3 kB | `39f8dec314ac0df0` |
| 5 | `fe0020_05_mobile_carddeck_concept.png` | Phone (390x844) 手机端模块一，零水平溢出 (390===390) | 360.1 kB | `1df04c71b4490ac1` |
| 6 | `fe0020_06_mobile_graph.png` | Phone (390x844) 手机端模块二思维图谱切换 | 378.8 kB | `e1e06794fc3ec2c9` |
| 7 | `fe0020_06_mobile_lab.png` | Phone (390x844) 手机端模块三动力沙盒切换 | 244.0 kB | `2430ced61b0dcc40` |
| 8 | `fe0020_06_mobile_exam.png` | Phone (390x844) 手机端模块四实战测评切换 | 306.4 kB | `ac40d243f2dbdd94` |

---

## 5. 后续演进建议（面向阶段二 TASK-FE-0021）

1. **阶段一（本任务）已为重绘铺平道路**：全工程样式与原子标准件已齐备，分包主体积降至 230 kB，路由和外壳已就绪；
2. **阶段二无缝衔接**：在紧接着的 `TASK-FE-0021` 中，基于本任务搭建的 `src/components/ui/` 标准件，全面重绘模块一【46 概念沙盒】（声明式填充面、1~3 步探究任务、母题思维阶梯、3 题快练），彻底完成第一阶段向第二阶段的跃迁！
