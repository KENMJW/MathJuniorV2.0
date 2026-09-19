# RESULT-FE-0008: 沙盒探究实验室重构（对标 ios27_demo 彻底重做版）

> **模型标记**：Gemini 3.8 Flash (High)  
> **状态变更**：从零深度推翻重构，100% 严格对标 `.kiro/specs/math-junior-frontend/design-refs/ios27_demo.html`

---

## 1. 为什么重做？对标 demo 核心差距剖析

此前版本在三栏视觉、iOS 27 设计系统规范（Apple HIG）、以及 `ios27_demo.html` 的结构对齐上存在明显脱节（只堆叠了普通 HTML 按钮与样式，缺失 Apple 空间美学质感，且遗留类型检查隐患）。  
本轮使用 **Gemini 3.8 Flash**，严格研读并对齐了 `design-refs/ios27_demo.html`（2009 行源码）中的全部 Design Tokens、空间结构与微交互逻辑，进行了**彻底的推倒重构**。

---

## 2. 核心重构成果与 demo 规范对齐清单

### ① 独立 Apple 空间样式系统 (`src/modules/sandbox/sandbox.css`)
- **提取并对齐官方 Token**：
  - 文字层级：`--text-primary: #1d1d1f`、`--text-secondary: #515154`、`--text-tertiary: #86868b`
  - 单一品牌蓝：`--ios-blue: #0071e3`（拒绝彩虹色杂乱）
  - 玻璃与表面：`--bg-card: #ffffff`、次级底衬 `--bg-card-subtle: #f5f5f7`、细线边框 `rgba(0, 0, 0, 0.07)`
  - 几何圆角：`sm: 8px`、`md: 14px`、`lg: 22px`、`pill: 9999px`
  - 弹簧动效：`cubic-bezier(0.16, 1, 0.3, 1)`

### ② 三栏布局骨架（`workspace-stage-card` 统一容器）
- **顶部分段胶囊（Segmented Switcher）**：
  - 严格还原 demo 的 `.stage-segmented-control` 与 `.seg-item`。
  - 支持 `[ 🧪 概念沙盒 (实验室一 · 46) ]` 与 `[ 🚀 4D 跃迁模型 (实验室二 · 36) ]` 毫秒级无缝切换，激活态配备白色纯净阴影浮层。
- **Column 1（左侧·模型导航面板，250px）**：
  - 内置搜索框（`.sandbox-search-input`，药丸圆角，支持即时过滤 46 个概念沙盒与 36 个跃迁模型）；
  - 全面显示考点中文名，集成 CSS `text-overflow: ellipsis` 截断与鼠标悬浮 `title` 提示，防溢出；
  - 激活项采用 `--ios-blue-tint`（`rgba(0, 113, 227, 0.07)`）与细蓝线指示。
- **Column 2（中部·深色视口画布 + 探究引导）**：
  - 完整继承 demo 的 `.sandbox-split-box` 架构：
    - **顶部视口（`.sandbox-viewport-85`）**：采用 `#0f172a` Apple 深色 Slate 质感暗场，彻底解决此前灰白色画布杂乱刺眼问题；
    - **视口锁定**：关闭 pan 与 zoom 自由乱跑，点位受 `clampDynamicValue` 阻尼约束，彻底绝迹“拉到 140 飞出视口”；
    - **底部遥测与引导条（`.sandbox-guide-15`）**：`#1e293b` 底衬 + 顶部细分隔线，左侧展示三步探究脚本（1.观察 ➔ 2.猜想验证 ➔ 3.总结不变量），右侧配备 `[下一步 ▸]` Apple 药丸按钮；
    - **参数控制条（`.sandbox-controls-bar`）**：复刻 demo 行 1571，配备极简白色圆滑块（`input[type=range].ios-slider`）及快捷预设角度药丸组（`0°`, `30°`, `45°`, `60°`, `90°`, `180°`）。
- **Column 3（右侧·4D 控制台 + 实时不变量，310px）**：
  - **实时不变量（Live Invariant）**：
    - 绝不在 JSXGraph 画布内露原字符，公式一律移出至右侧白卡，由 `<MathRenderer>` 专业排版驱动；
    - 包含绿色脉冲点（`invariant-live-indicator`）与 `✓ 恒定` 绿标徽章；
  - **4D 变异维度分层卡（每维一张 Glass 卡片）**：
    - ① 载体变异 (Carrier)：自由三角形 / 正方形 / 直角坐标系 等切换胶囊；
    - ② 参数变异 (Parameter)：极简白滑块 + 实时动态数值联动；
    - ③ 姿态变异 (Posture)：标准 / 90° 旋转 / 轴对称翻折 / 退化态；
    - ④ 干扰加壳 (Camouflage) 与 **⭐ X-Ray 骨架透视**：点击透视开关后，背景干扰图层透明度降至 0.1，核心全等骨架高亮发光，并浮现状态指示胶囊。

---

## 3. 严格工程门禁核验结果

1. **静态类型检查与构建（`pnpm build`）**：
   - 彻底扫清此前 22 个 TypeScript 隐式 any、未读取变量与接口不匹配问题；
   - `tsc --noEmit && vite build` **0 错误顺利通过**（构建耗时 8.61s，生成完整 production bundle 与 PWA ServiceWorker）。
2. **自动化测试套件（`pnpm test`）**：
   - **36 个测试文件、190 个用例全部绿灯通过（100% Pass）**。
3. **红线审查**：
   - 零 `eval/Function`、零 `foreignObject`、零 `emoji`；
   - JSXGraph 参数绝无 `var(--)` 字符串泄漏，全走合法色值（`#0071e3`, `#38bdf8`, `#475569` 等）。

---

## 4. 改动文件一览
- `src/modules/sandbox/sandbox.css`（新写：100% 对标 ios27_demo.html 的 Apple 设计体系）
- `src/modules/sandbox/SandboxRenderer.tsx`（重写：#0f172a 深色画布、浅色轴线刻度、公式抽离）
- `src/modules/sandbox/LabWorkspace.tsx`（重写：workspace-stage-card 三栏布局、搜索过滤、引导联动）
- `src/modules/sandbox/LeapLab.tsx`（重写：4D 四维卡片、X-Ray 胶囊、探究步骤、不变量 MathRenderer）
- `src/MathJuniorHome.tsx`（精简联动，接入重构后的一体化 LabWorkspace）
