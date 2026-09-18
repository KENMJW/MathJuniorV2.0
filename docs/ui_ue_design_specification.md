# 全科核心素养提分系统 V2.0 — UI/UE 交互与视觉设计规范 (UI/UE Design Specification)

> 📌 **文档定位**：本文档为“全科核心素养提分系统 V2.0（初中数学模块）”的用户体验（UE）与视觉界面（UI）设计标准。系统明确拒绝单一的响应式断点缩放，全面确立针对手机、平板、电脑三类终端设备的独立交互范式、动效机制及视觉设计规范。

---

## 1. 三套终端独立 UE/UI 设计系统与交互范式

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📱 手机端 (Phone)      │  📟 平板端 (Pad)         │  💻 电脑端 (PC)           │
├─────────────────────────┼──────────────────────────┼──────────────────────────┤
│ • 竖屏单手拇指交互       │ • 横屏双手/支架/手写笔   │ • 宽屏鼠标精细悬停+键盘   │
│ • 横向卡片穿透流 (Deck) │ • 分栏双视窗画板 (Split) │ • 宽屏多栏工作台 (Cockpit)│
│ • 视窗高度 100% 锁定    │ • 左阶段导航，右交互画布 │ • 滚轮定格翻屏 (Snap)     │
│ • 全屏模态抽屉          │ • 画中画悬浮沙盒         │ • 键盘快捷键秒级切换      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 📱 手机端设计规范 (Mobile Ergonomics)
- **视口高度锁定**：所有精讲视窗锁定在屏幕安全可视高度内（`100dvh`），杜绝全页面无节制垂直长文滚动。
- **手势操作体系**：
  - 支持横向滑动手势切换认知阶段（带弹性阻尼与段落吸附）；
  - 底部常驻高度 $\ge 52\text{px}$ 的拇指热区主操作引导按钮（如“看透本质 ➔”、“立下法典 ➔”）。
- **空间利用**：导航栏、考点选择采用自底向上滑出的全屏模态抽屉（Bottom Sheet）。

### 1.2 📟 平板端设计规范 (Tablet Split-View)
- **黄金横屏双栏结构**：
  - **左栏 (280px)**：垂直认知阶段时间轴（Stepped Timeline），支持触控笔与手指点选；
  - **右主画布 (弹性宽度)**：左文右图同屏对照，所有内容在画板内部平滑淡入淡出（Cross-fade），无视窗外滚动。
- **触控防误触与热区**：
  - 按钮与交互点点击热区尺寸必须满足 $\ge 44\text{px} \times 44\text{px}$；
  - 动点拖动时具备高亮放大反馈（Hover/Active Scale 1.2x）。

### 1.3 💻 电脑端设计规范 (Desktop Cockpit)
- **宽屏剧场三段式布局**：
  - **左侧**：可收折 107 考点导航树（260px，支持 `Ctrl/Cmd + B` 折叠为极窄 Rail）；
  - **中央**：主认知舞台（大字号 LaTeX 公式呈现、大幅标准矢量图居中渲染）；
  - **右侧/底部**：深度解析与红线警示扩展面板。
- **高效键盘与滚轮映射**：
  - **滚轮定格翻屏 (Scroll-Snap)**：滚轮单次步进整体切换 Stage，杜绝流式模糊滑动；
  - **快捷键**：支持方向键 `← / →` 或数字键 `1 / 2 / 3 / 4` 瞬间直达阶段。

---

## 2. 模块一概念精讲非瀑布流视窗与转场动效

### 2.1 单屏自闭环视窗规范 (One-Stage, One-Viewport)
- 每一段内容独立占据视窗正中，不允许让上一段和下一段内容同时堆叠在一个长页面上；
- 顶部常驻极简认知步进指示器：`[①溯源 · ②透视 · ③法典 · ④辨正]`，支持点击直达；
- **全景速查对照模式 (Dashboard Mode)**：
  - 界面右上角提供 `[ ⊞ 全景对照 ]` 切换按钮；
  - 点击后以 2×2 矩阵看板平铺呈现四段内容，供考前复习一眼对照。

### 2.2 矢量 SVG 字典图示图层动效 (路线 B 规范)
- **第 2 段（本真透视）**：
  - SVG 图中隐藏顶点字母与抽象代号，仅展示几何动势线条与核心不变性（对折、旋转）；
- **第 3 段（法典严定）**：
  - 图形原地不动，`<g class="formal-labels">` 图层通过 CSS `opacity: 0 ➔ 1`（耗时 250ms）平滑淡入点亮；
  - 顶点字母代号（$A, B, C, D, M, O$）与下方 LaTeX 公式形成像素级咬合。

---

## 3. 经典黄金母题“步进点击解锁”交互规范

```
┌─────────────────────────────────────────────────────────────┐
│ 题干区 (Stem Box)                                           │
│ 在圆 O 中，弦 AB = 8，圆心 O 到弦 AB 的距离为 3，求半径 R。  │
├─────────────────────────────────────────────────────────────┤
│ 🔓 维度一：【原点溯源 · 题眼挖掘】(默认展开)                 │
│ 题眼是“圆心到弦的距离”，意味着垂直平分弦。                   │
├─────────────────────────────────────────────────────────────┤
│ [ 🔘 点击解锁维度二：看透本质与几何不变性 ➔ ]               │
└─────────────────────────────────────────────────────────────┘
```

- **展开转场**：点击解锁按钮后，下一个维度卡片以 `height: 0 ➔ auto` 配合弹性阻尼滑动展开，并自动轻微滚动聚焦到新展开的维度；
- **终态反馈**：最后一个维度解锁完成后，按钮变为亮色渐变徽章：`[ 🎯 已通透母题 · 前往 3 题靶向快练 ➔ ]`。

---

## 4. 沙盒视窗与等大占位卡片视觉规范 (CLS = 0)

- **等大物理尺寸**：
  - 沙盒与占位卡片在 Pad/PC 端采用标准宽高比 $4:3$（最小高度 $320\text{px}$）；
  - 手机端采用沉浸式全屏抽屉。
- **无沙盒考点占位视觉**：
  - 采用与沙盒完全等大的毛玻璃浅灰卡片（Neutral Card）；
  - 中央渲染矢量规尺线稿图标，标明清晰说明文本：
    > 📐 **该知识点没有数学沙盒**  
    > *（本考点为基础数系/法则定义，已通过第 2 段矢量数形图示完整闭环，无需动力学形变实验）*
  - 确保 107 个考点切换时视窗**累积布局偏移（Cumulative Layout Shift, CLS）恒等于 0**。

---

## 5. 单点 3 题即答即判单题流转视觉规范

- **卡片流转**：一次只呈现 1 道选择题，选项区域高度 $\ge 48\text{px}$，单指易触；
- **即时对错动效**：
  - **选中正确项**：选项背景瞬变浅绿（`emerald-500/10`），边框变为亮绿并伴随清脆正向动效；上方淡入 1 句名师点睛肯定文案；延迟 1.2 秒自动平滑划入下一题；
  - **选中错误项**：选项背景变浅红（`rose-500/10`），错误项抖动（Shake Animation）；下方瞬间原地展开【名师速查解析】面板，高亮标出易错陷阱；
- **通关结算卡**：完成 3 题后，弹出精致的磨砂质感结算卡片，展示掌握星级与前往下一考点的快捷动作。

---

## 6. 色彩系统与明暗主题规范 (Theme Tokens)

系统全面采用语义化 CSS 变量设计，严禁在组件内部硬编码 `#000000` 或 `#ffffff`：

| 语义变量 (Token) | 亮色模式 (Light Mode) | 暗色模式 (Dark Mode) | 业务语义与用途 |
| :--- | :--- | :--- | :--- |
| `--background` | `#f8fafc` (Slate 50) | `#090d16` (Deep Slate) | 全局底层背景色 |
| `--card` | `#ffffff` (Pure White) | `#131b2e` (Surface Dark) | 考点卡片与视窗背景 |
| `--border` | `#e2e8f0` (Slate 200) | `#1e293b` (Slate 800) | 容器与卡片边框 |
| `--foreground` | `#0f172a` (Slate 900) | `#f1f5f9` (Slate 100) | 主标题与主公式文字 |
| `--muted-foreground` | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) | 辅助解析与二级提示 |
| `--primary` | `#2563eb` (Blue 600) | `#3b82f6` (Blue 500) | 几何弦、核心操作高亮 |
| `--accent-red` | `#dc2626` (Red 600) | `#ef4444` (Red 500) | 生死红线、对称直径 |
| `--accent-emerald` | `#059669` (Emerald 600)| `#10b981` (Emerald 500)| 正确提示、等弧相等 |
| `--status-mastered` | `#16a34a` (Green 600) | `#22c55e` (Green 500) | 学情图谱：熟练掌握节点 (≥85%) |
| `--status-fragile` | `#d97706` (Amber 600) | `#f59e0b` (Amber 500) | 学情图谱：存在夹生节点 (60%~85%) |
| `--status-breakdown` | `#dc2626` (Red 600) | `#ef4444` (Red 500) | 学情图谱：认知断层节点 (<60%) |
| `--pulse-track` | `rgba(220,38,38,0.2)` | `rgba(239,68,68,0.25)` | 🔴 溯源脉冲红线背景光晕 |

---

## 7. 模块二思维图谱交互与多轨地铁泳道图规范

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📱 手机端 (Phone)      │  📟 平板端 (Pad)         │  💻 电脑端 (PC)           │
├─────────────────────────┼──────────────────────────┼──────────────────────────┤
│ • 6学期垂直折叠卡片流   │ • 左右 6:4 双视窗分屏    │ • 100% 宽幅全景指挥舱     │
│ • 杜绝 100 节点密集大网 │ • 左侧局部可缩放泳道图   │ • 鼠标滚轮缩放+小地图     │
│ • 底部滑出 3 层血统抽屉 │ • 右侧固定研学/母题卡片  │ • Ctrl+F 秒级查找考点     │
│ • 单手大拇指 100% 可达  │ • 触控笔划线推演与标注   │ • 悬停即时光束聚焦 (Hover)│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 拓扑聚焦光束动效 (Focus Beam Animation)
- **非聚焦节点弱化**：点击任意节点，全图其余无关节点在 200ms 内执行 `opacity: 1 ➔ 0.15`，高亮当前考点；
- **入度光束（前置地基）**：以蓝色高亮线（`--primary`）沿有向箭头反向流动发光，标注“地基依赖”；
- **出度光束（后续推演）**：以紫色高亮线（`#a855f7`）沿箭头正向流动发光，标注“推导致用”；
- **连通闭环（Clique）高亮**：选中压轴组合时，相关 3~4 个节点以呼吸光环（Pulse Ring）同步跳动，闭合回路高亮加粗。

### 7.2 🔴 认知断层脉冲红线动效 (Root-Cause Pulse Trace)
- **视觉触发**：当检测到当前错误考点的前驱节点亦存在掌握度缺陷时触发；
- **连线动效**：
  ```css
  @keyframes rootCausePulse {
    0% { stroke-dashoffset: 100; stroke: var(--status-breakdown); }
    50% { stroke-width: 4px; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.8)); }
    100% { stroke-dashoffset: 0; stroke: var(--status-breakdown); }
  }
  .root-cause-line {
    stroke-dasharray: 8 4;
    animation: rootCausePulse 1.5s infinite linear;
  }
  ```
- **靶向就医卡片**：从底部/侧边平滑浮现，红框毛玻璃质感，醒目标注病根知识点与“一键前往补齐”直达按钮。

---

## 8. 实验室二 4D 变异控制器与 X-Ray 透视交互规范

### 8.1 📱 手机端真实操作指南（白话版 3 步走设计）
针对手机小屏幕，系统彻底抛弃复杂的悬浮面板，采用直观的**“上图下控”布局**：

```text
┌────────────────────────────────────────┐
│  九上 · 模型 19：手拉手旋转全等模型    │ ◄── 顶部导航栏
├────────────────────────────────────────┤
│                                        │
│               [ 动态几何图形 ]         │ ◄── 上半屏 (40% 高度)：
│                                        │     实时动力学图形画布
│           △ABD ≌ △ACE (红蓝发光)       │
│                                        │
├────────────────────────────────────────┤
│ [ ①标准态 ] [ ②旋转态 ] [ ③旋缩 ] [ ④压轴 ]│ ◄── 中间：【4 颗变身按钮】一键切换形态
├────────────────────────────────────────┤
│ 🎮 动动手调一调：                       │ ◄── 下半屏 (50% 高度)：
│ 旋转角度 α： ────●───────── [ 45° ]     │     单手大拇指左右滑动条
│ 边长比例 k： ────────●───── [ 1.5 ]     │
├────────────────────────────────────────┤
│ 💡 题眼点睛：无论图形怎么旋转，对应边始终相等！│ ◄── 底部题眼解读
└────────────────────────────────────────┘
                    [ 🩻 透视骨架 ]        ◄── 右下角常驻悬浮小圆钮 (FAB)
```

- **第一步：戳中间 4 颗【变身按钮】**：
  - 点 `[ ①标准态 ]`：看课本基础图形；
  - 点 `[ ②旋转态 ]`：看图形绕点转动；
  - 点 `[ ③旋缩态 ]`：全等升级为旋转相似；
  - 点 `[ ④压轴态 ]`：看被画满正方形外壳的中考原题原貌。
- **第二步：拇指划动【滑动条】**：
  - 左右搓动旋转角滑块，上屏图形 $360^\circ$ 跟手旋转，亲眼见证对应线段长永远相等的不变量。
- **第三步：戳右下角【🩻 透视骨架】小圆钮**：
  - 点击后，题目多余的干扰线条瞬间淡化隐去（`opacity: 0.1`），**核心全等/相似母题骨架以高亮粗线发光显示**，直接看透出题人伪装。

### 8.2 💻 电脑端与 📟 平板端宽屏工作台规范
- **左侧 30% 调控舱**：
  - **载体变异选择器**：自由态 $\to$ 四边形 $\to$ 坐标系 $\to$ 抛物线（下拉或分段 Tab）；
  - **参数连续滑块**：高精度滑条 + 数值微调微步进；
  - **姿态轮盘**：支持拖动角度环直接旋转图形；
- **右侧 70% 动力学画布**：
  - 右下角常驻大号高对比度 `[ 🩻 X-Ray 骨架透视 ]` 切换开关；
  - 支持键盘快捷键 `Space`（空格键）瞬间切换透视/原貌。

---

## 9. 模块三顶层双实体大卡片与手风琴折叠大抽屉 UI/UE 规范

### 9.1 双实体大卡片切换器 (Lab Card Switcher)
模块三顶部拒绝深层菜单，采用**实体卡片切换器**：
```text
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ 🔬 实验室一：概念具象沙盒            │  │ 🚀 实验室二：思维跃迁模型实验室      │
│ [ 40~50 个课标单考点具象化感知实验 ] │  │ [ 36 个六学期中考压轴母题模型实验室 ]│
│ 🎯 状态：已聚焦 (微发光边框 + 浅阴影) │  │ ⚪ 状态：未聚焦 (半透明背景 + 细边框)│
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```
- **视觉反馈**：
  - 选中卡片：具备品牌主色微妙光晕（`box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15)`），字体轻微加粗；
  - 未选中卡片：静止弱化态（`opacity: 0.7`），悬停微升（`transform: translateY(-2px)`）；
  - 切换动效：主画布通过 `opacity: 0 ➔ 1` 与微位移（10px）在 200ms 内平滑切场。

### 9.2 手风琴式折叠大抽屉柜 (Accordion Drawer Cabinet)
- **多级筛选层级伸缩交互**：
  - 实验室一抽屉：`[ 学科 ]` ➔ `[ 年级 ]` ➔ `[ 学期 ]` ➔ `[ 7大沙盒分类 ]`；
  - 实验室二抽屉：`[ 年级 ]` ➔ `[ 6个学期 7A~9B ]` ➔ `[ 6大中考模型域 ]`；
- **三端差异化展开形态**：
  - **📱 手机端**：点击筛选图标从底部滑出全屏手风琴抽屉（Bottom Sheet Drawer），触控大胶囊按钮（高度 $\ge 40\text{px}$），单手点选即时收起并聚焦；
  - **📟 平板端 & 💻 电脑端**：横向手风琴伸缩条（Accordion Rail），常驻于画布左上角，展开时平滑推挤或悬浮，鼠标移开或点选分类后自动折叠收拢，将最大视野还给画板。

---

## 10. 模块三画布防溢出与 85% : 15% 纵向分割视觉工程规范

### 10.1 85% : 15% 纵向视窗 CSS 架构与隔离边界
为杜绝文字遮挡图形与意外页面滚动，实验视窗采用严格的纵向 Flex 隔离布局：

```css
/* 沙盒主视窗容器 */
.sandbox-viewport-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  background: var(--bg-canvas-neutral, #0f172a);
  border-radius: 12px;
}

/* 上部 85% 核心实验画布 */
.sandbox-canvas-viewport {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  position: relative;
  touch-action: none; /* 关键：禁用浏览器默认滚动手势，交由动态几何引擎捕获 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 下部 15% 极简模型文字指南栏 */
.sandbox-brief-bar {
  flex: 0 0 52px;
  max-height: 56px;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 16px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.sandbox-brief-bar .brief-action {
  font-size: 13px;
  font-weight: 500;
  color: #f8fafc;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.sandbox-brief-bar .brief-target {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
```

### 10.2 最大模型 15% 安全缓冲带与 SVG 居中保形渲染
- **SVG 视口保形规则**：
  ```xml
  <svg viewBox="-14.4 -10.8 28.8 21.6" 
       preserveAspectRatio="xMidYMid meet" 
       class="sandbox-svg-engine">
    <!-- 图形元素始终处于中心安全区内，绝无边缘裁剪 -->
  </svg>
  ```
- **标尺静止（Scale Anchored）切换动效**：
  - 同一主线在 L1/L2/L3 模型 Tab 切换时，`<svg>` 的 `viewBox` 参数严格锁定保持不变；
  - 仅子图元 `<g class="model-layer">` 执行 `opacity: 0 ➔ 1`（150ms），确保图形在原有空间生长，画面比例尺与网格坐标线纹丝不动。

### 10.3 30~45 字极简动作口诀跟随 Tab 联动动效
- **联动切换**：
  - 当学生点击上方 `[ 模型一: 原型 ]`、`[ 模型二: 变式 ]`、`[ 模型三: 综合 ]` 时，下方文字栏执行 120ms 快速淡入淡出（Cross-Fade）；
  - 字数严格受控于 30~45 字以内，单屏两行显示完备，杜绝任何纵向滚动条或布局撑破。

---

## 11. 模块四全真考场与智能组卷 UI/UE 交互规范 (Exam & Test Generation Specifications)

### 11.1 左右视窗彻底解耦架构 (Fixed Split-View Layout)
在电脑端 (PC) 与平板横屏下，考场主界面严格执行**“左侧独立长卷滚动、右侧绝对静止锁定”**的双容器分离范式：

```css
/* 考场双视窗主网格 */
.exam-viewport-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-exam-neutral, #f8fafc);
}

/* 左侧：试卷作答主舞台 (独立垂直长卷滚动) */
.exam-paper-stage {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  padding: 32px 48px;
  box-sizing: border-box;
  scroll-behavior: smooth; /* 支持题号锚点平滑微动跳转 */
}

/* 右侧：控制指挥舱 (绝对固定常驻，绝不随左侧滚动) */
.exam-command-sidebar {
  flex: 0 0 340px;
  width: 340px;
  height: 100%;
  overflow-y: auto;
  padding: 20px 16px;
  box-sizing: border-box;
  background: #ffffff;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

---

### 11.2 右侧两大核心卡片交互规范

#### 1. 上卡片：`📖 答题辅助与使用说明` (可收起)
- **伸缩动效**：右上角常驻 `[ 收起 ▲ ]` / `[ 展开 ▼ ]` 按钮。折叠时高度平滑压缩至 `40px` 仅留标题栏，展开时平滑滑出；
- **内容规范**：
  - **公式输入速查**：明确高亮标注 `(x+1)/(x-2)`、`sqrt(2x+3)`、`-2x^(m+1)`、`x_1 + x_2` 的标准简写映射；
  - **中考规范答题技巧**：“作了辅助线请在解答第一行使用快捷话术（如：‘过点 P 作 EF // AB’、‘作 CD ⊥ AB 于点 D’）”。

#### 2. 下卡片：`🎯 动态答题卡` (核心主控)
- **头部进度条**：实时代数展示（如 `1 / 27`），带平滑动画色彩填充条；
- **三态计数胶囊**：🟢 已答、⚪ 未答、🟠 待复查；
- **题号网格与小红旗**：
  - 题号按钮尺寸 $\ge 38\text{px} \times 38\text{px}$，单点左侧试卷平滑滚动居中聚焦；
  - 题号右上角常驻微型小红旗图标，点击切换“待复查”高亮（橙色边框 + 橙色小旗）；
- **交卷按钮**：底部常驻大号高对比度 `[ 📥 提交试卷并判分 ]`（高度 $\ge 48\text{px}$，主色渐变高亮）。

---

### 11.3 全局智能伴随数学符号键盘交互
- **聚焦呼出机制**：
  - 默认常态下，试卷卷面 100% 保持标准中考试卷纯净排版，无任何多余符号条；
  - 当学生点击填空题或解答题文本框（`onFocus`）时，符号键盘在当前输入框底部或下方以轻量 Popover 平滑浮现（耗时 120ms）；
  - 学生点击 $x^n$、$\sqrt{x}$、$\frac{a}{b}$、$\perp$ 等符号，秒级一键插入至光标所在位置；
  - 失去焦点（`onBlur`）后自动隐去，页面恢复清爽。

---

### 11.4 📱 手机端 (Phone) 响应式自动收拢
在手机端竖屏环境下，右侧 340px 固定栏自动隐藏并转化为两颗常驻屏幕底部的悬浮胶囊按钮：
- `[ 📖 答题说明 ]`：点击从底部滑出半屏速查抽屉；
- `[ 🎯 答题卡 1/27 ]`：点击滑出全屏网格答题卡，支持单手拇指秒级切题。

---

### 11.5 试卷打印与排版导出 CSS 规范 (`@media print`)
系统支持 A4 环保紧凑双栏试卷、答题纸与教师解析卷的纯前端印刷级排版导出：

```css
@media print {
  /* 隐藏考场辅助、答题卡与计时器 */
  .exam-command-sidebar,
  .exam-timer-bar,
  .no-print {
    display: none !important;
  }

  /* 试卷版心强制设为 A4 双栏 */
  .exam-paper-stage {
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    padding: 0 !important;
    column-count: 2;
    column-gap: 24mm;
    column-rule: 1px dashed #cbd5e1;
  }

  /* 核心：题目卡片绝对禁止跨页切断 */
  .exam-question-card {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    margin-bottom: 16px;
  }

  /* 矢量图保持高清纯黑印刷质感 */
  svg, img {
    max-width: 100% !important;
    filter: grayscale(100%) contrast(120%);
  }
}
```

---

## 12. 全平台 iOS 27 设计系统与视觉工程规范 (iOS 27 Design System & Standards)

### 12.1 核心设计哲学 (Design Philosophy)
全平台视觉彻底摒弃生硬边框与低劣塑料质感，全面确立基于苹果前沿人机交互指南演进的 **“iOS 27”液态超视网膜设计哲学**：
1. **液态多层玻璃拟态 (Liquid Glass Translucency)**：高透纳米级亚克力玻璃，结合环境空间微光流动；
2. **超椭圆连续曲率 (Squircle Continuous Curvature)**：苹果标准 Squircle 几何曲率半径，杜绝粗暴直角；
3. **多维空间景深 (Spatial Depth & Ambient Glow)**：Z 轴层深错落，灵动顶栏悬浮于内容之上；
4. **物理弹簧微交互 (Spring Physics)**：带有真实物理阻尼的滑块与按压回弹（`scale(0.97)`）；
5. **内容至上与极致呼吸感 (Content-First & Breathing Room)**：界面退至幕后，数学几何动势与高清公式居于舞台中央。

---

### 12.2 液态玻璃与核心 Token 规范 (CSS Custom Properties)

```css
:root {
  /* iOS 27 Dynamic System Colors */
  --ios-blue: #0071e3;
  --ios-blue-glow: rgba(0, 113, 227, 0.28);
  --ios-indigo: #5856d6;
  --ios-purple: #af52de;
  --ios-teal: #30b0c7;
  --ios-green: #34c759;
  --ios-orange: #ff9500;
  --ios-red: #ff3b30;

  /* Liquid Glass Surfaces */
  --glass-bg: rgba(255, 255, 255, 0.68);
  --glass-bg-elevated: rgba(255, 255, 255, 0.86);
  --glass-border: rgba(255, 255, 255, 0.8);
  --glass-border-subtle: rgba(255, 255, 255, 0.4);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
  --glass-shadow-deep: 0 20px 60px -10px rgba(0, 20, 60, 0.12);

  /* Squircle Radius */
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 26px;
  --radius-pill: 9999px;

  /* Spring Physics Timings */
  --spring-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --spring-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 核心液态玻璃混合面 */
.ios-glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-lg);
}

/* 按钮物理按压微缩放 */
.ios-spring-btn {
  transition: transform 0.16s var(--spring-bouncy), box-shadow 0.2s;
}
.ios-spring-btn:active {
  transform: scale(0.97);
}
```

---

### 12.1 苹果系统级设计哲学与核心原则 (Apple Design Philosophy)

经过高保真交互原型的严谨迭代与实机验证，系统坚决破除「拟物 App 启动图标机械堆叠」与「高饱和彩虹大杂烩色块」，全面确立 **Apple 极简主义与空间系统美学（Content-First, Deference, Spatial Order）**：

1. **遵从（Deference）—— 内容绝对优先，界面退居幕后**：
   * 严禁在卡片内粗暴放置手机桌面式 Squircle 独立拟物启动色块；
   * 界面应如美术馆的白墙，以极简的留白与空间层次衬托考点知识点、思维图谱与动态沙盒等教学核心内容；
2. **清晰（Clarity）—— 严谨克制的色彩与排版层级**：
   * **单一品牌主调**：全站仅以 Apple Keynote 标志性理性科技蓝（`#0071e3`）作为核心交互与聚焦主色；
   * **黑曜石中性灰阶**：严格遵循 Apple 官方连续文字层级（`#1d1d1f` 主标、`#515154` 正文、`#86868b` 辅助说明）；
   * **彻底消灭 Emoji**：全站 100% 禁用所有杂色 Emoji（如沙漏 ⏳、火箭 🚀 等），统一采用 18px 极简单色 SF Symbols 矢量线稿；
3. **景深与秩序（Depth & Order）—— 建筑学空间排版**：
   * 模块采用大圆角（`border-radius: 22px`）与 Apple Studio 冷白微光画布（`#fbfbfd`），呈现沉浸、尊崇的殿堂级学习空间。

---

### 12.2 官方设计系统 Tokens (Apple System Tokens)

```css
:root {
  /* Typography & Grayscale Hierarchy (Apple Official HIG) */
  --text-primary: #1d1d1f;       /* Primary Obsidian Label */
  --text-secondary: #515154;     /* Secondary Reading Body */
  --text-tertiary: #86868b;      /* Tertiary Caption & Meta */
  --text-quaternary: #d2d2d7;    /* Subtle Hairline Dividers */

  /* Surface Architecture */
  --bg-page: #fbfbfd;            /* Apple Signature Light Studio Canvas */
  --bg-card: #ffffff;            /* Elevated Crisp Card */
  --bg-card-subtle: #f5f5f7;     /* Secondary Substrate */
  --border-subtle: rgba(0, 0, 0, 0.07);
  --border-focus: rgba(0, 113, 227, 0.35);

  /* Single Brand Accent (Apple Keynote Blue) */
  --ios-blue: #0071e3;
  --ios-blue-tint: rgba(0, 113, 227, 0.06);
  --ios-blue-glow: rgba(0, 113, 227, 0.18);
  
  /* Subtle Functional States */
  --status-ready-bg: rgba(52, 199, 89, 0.08);
  --status-ready-text: #248a3d;
  --status-pending-bg: rgba(0, 0, 0, 0.035);
  --status-pending-text: #86868b;

  /* Spatial Geometry & Springs */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-pill: 9999px;
  --spring-smooth: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

### 12.3 全科门户主页 (`index.html`) 空间建筑规范

#### 1. 顶部系统导航坞 (System Navigation Dock)
* 高度固定为 `54px`，吸附于视口顶部，背景采用 `rgba(251, 251, 253, 0.85)` 与 `backdrop-filter: blur(20px)`；
* 底部配 `1px solid rgba(0, 0, 0, 0.07)` 精密细分界线，**严禁使用过大悬浮边距遮挡下方内容**；
* 包含左侧极简品牌徽标、右侧通知铃铛、多语言选择器与学员身份状态胶囊。

#### 2. 三大学段联动分段控制器 (Segmented Stage Switcher)
* 胶囊式滑动轨道，三大学段：`[ 小学教育 (4科) ]`、`[ 初中突破 (8科·首发) ]`、`[ 高中决胜 (8科) ]`；
* 伴随底层 **白色纯净浮动弹簧吸附胶囊（Spring Thumb Pill）**；
* **三大学段全量联动交互**：点击时以 Apple 原生淡入淡出（Cross-fade）切换下方面板，各学段均继承同构极简设计与色彩规范。

#### 3. 旗舰初中数学空间能量卡 (Flagship Architectural Showcase Card)
* 尺寸宽幅展现（`border-radius: 22px`，纯白高亮卡片），杜绝突兀独立 App 图标块；
* **背景几何参数微雕**：右侧隐匿嵌入精密参数坐标网格与 $f(x)$ 三次函数曲线矢量底纹（`opacity: 0.45`）；
* 顶部常驻呼吸微标 `● 已全量就绪 · 7~9年级全学段`；
* **底部一体化四项指标条**：等宽集成「107 考点四段论」「12 跨学期主线」「36 跃迁沙盒」「119 黄金母题」；
* 配备极简科技蓝流动光晕胶囊按钮 `[ 进入初中数学工坊 ➔ ]`。

#### 4. 次级学科极简矩阵 (Content-First Discipline Grid)
* 其余 7 科（物理、化学、生物、语文、英语、历史、地理）采用统一极简建筑卡片（固定高度 `120px`）；
* **标题前内嵌 18px SF Symbols 单色矢量线稿**，悬停时触发 `#0071e3` 科技蓝高亮；
* 右上角仅配备最纯粹的极简静音灰文字标签 `即将推出`（`#86868b`），杜绝任何抢戏的小时钟或彩块。

---

### 12.4 初中数学旗舰工坊四大核心模块交互规范

#### Module 1: 探本溯源 · 四段论全量实时切片
* 顶部配备 `[ ① 原点溯源 ]` `[ ② 本真透视 ]` `[ ③ 法典严定 ]` `[ ④ 本体辨正 ]` 药丸状联动按钮；
* 点击即时平滑切换左侧名师精解与右侧矢量几何解析图：
  * **① 原点溯源**：《九章算术》折竹测弦古法与弧矢模型；
  * **② 本真透视**：轴对称一维反射变换 $\mathcal{R}_L$ 镜像翻折重合透视；
  * **③ 法典严定**：黄金直角三角形 $R^2 = d^2 + (L/2)^2$ 与 $d=0$ 退化生死红线；
  * **④ 本体辨正**：两非垂直直径互相平分的反例图解与伪命题陷阱反驳。

#### Module 2: 经纬纵横 · 12 逻辑主线全景拓扑图
* 全景有向无环图 (DAG) 呈现数与式、方程不等式、函数建模、几何变换 12 条跨学期底层主线。

#### Module 3: 见微知著 · 4D 动态物理沙盒 (手拉手旋转全等模型)
* **85% 视口 : 15% 遥测** 黄金分割布局；
* **连续物理滑动条**：支持 `0° ~ 360°` 连续旋转角 $\alpha$ 拖拽，内置 `[ 60° 等边 ]` `[ 90° 垂直 ]` `[ 180° 反向 ]` 快捷角度芯片及 `[ ▶ 自动旋转演示 ]` 播放器；
* **物理几何实时联动**：拖动时 SVG 动三角形 $\triangle OCD$ 跟随旋转，对应点拉手连线 $AC$ 与 $BD$ 动态重算；
* **实测遥测数据**：底部实时计算输出 $AC = BD$ 恒等距离数值与夹角等于 $\alpha$ 的不变量检验。

#### Module 4: 百炼成钢 · 实战测评与真题模考中心
* 左右彻底解耦布局（左卷独立丝滑滚动，右侧答题卡与辅助卡 `position: sticky` 绝对静止锁定）；
* 伴随式智能数学键盘与踩分点自核机制。

---

### 12.5 跨端自适应与多语言防爆框标准

1. **响应式断点控制**：
   * 桌面宽屏（$\ge 1024\text{px}$）：主内容锁定 `1140px`，四列网格排布；
   * 平板中屏（$768\text{px} \sim 1023\text{px}$）：双列排布，沙盒控制条自适应换行；
   * 移动窄屏（$\le 767\text{px}$）：单列排布，指标栏转化为 $2 \times 2$ 微网格，顶栏自动隐藏冗余副标题，防止任何横向滚动与文字截断。
2. **全站多语言热替换**：
   * 所有文本容器宽度一律使用弹性流式（`width: auto; min-width: ...`），容纳英文比中文长 30%~50% 的文字延展；
   * 全站 DOM 元素通过 `[data-i18n]` 键值绑定，广播事件全局秒级热替换。



