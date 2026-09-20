---
id: TASK-FE-0010
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 多端响应式适配 — 手机/平板端(基于电脑版UI)四阶段一次性实施，电脑端零回归
model: default
concurrency: 1
---

# 任务：多端(Mobile/Tablet)响应式架构实施

## 🚨 执行方式
- **执行口令**：人类输入 `/browser 查收 NEXT.md 并执行验收`（多端验收必须真机设备模拟）
- **model=default(Flash)**，固定对话直接跑。响应式布局非高推理,Flash 够。串行。
- 依据:用户提供的《多端架构规划方案》(手机竖屏流 + 平板分栏/画板,电脑版为基准)。四阶段一次性实施。

## 1. 🔴 最高硬约束:电脑端零回归(违反=整个任务作废)
- 你刚做好并验收的**电脑版(Desktop >1024px)UI/交互绝对不能被破坏**:沙盒三栏、概念精讲四段、组卷、思维图谱、测评 在 1440×900 下必须与现状**像素级一致、0破版、0功能回归**。
- **实现方式:设备分支隔离**。Mobile/Tablet 走**新增的响应式分支**,Desktop **走原有代码路径**。改公共组件时用 `if(isDesktop) 原逻辑 else 新布局`,而非直接改动电脑端已验收的渲染。
- 验收第一关就是**电脑端防回归**:Desktop 分辨率下截图对比,任何破版直接退回。

## 2. 分流基座(第2点已确认可行,复用现有 detectDeviceProfile)
- **复用 `src/engine/device/detectDeviceProfile.ts`**,不另造断点标准。
- **⚠️ 必须调整断点对齐方案**:现有 `evaluateDeviceFeatures` 手机/平板分界是 600px,**改为方案的 768px**:
  - MOBILE: width < 768
  - TABLET: 768 ≤ width ≤ 1024(带触控)
  - DESKTOP: width > 1024
  - 改宽度阈值即可,保持 property test 通过(detectDeviceProfile.property.test.ts 断言仍成立,必要时同步更新阈值断言)
- 新建 `src/hooks/useDeviceResponsive.ts`:内部**调用 detectDeviceProfile**(不重造判定),监听 resize + matchMedia,暴露 `{device, isMobile, isTablet, isDesktop, orientation}`;整合 sessionStore.deviceOverride(调试可强制模拟三端)。
- 新建 `src/styles/responsive.css`:iOS安全区 `env(safe-area-inset-bottom)`、触控高亮、禁长按选中破版、`-webkit-overflow-scrolling:touch`。

## 3. 四阶段实施(一次做全)
### 阶段一 基座
- useDeviceResponsive Hook + responsive.css(见§2)

### 阶段二 三端外壳(Shell)
- **CardDeck.tsx(Mobile)**:顶部Slim导航条(返回门户+考点标题+功能区)+ 底部固定 iOS Tab Bar(4模块图标,触控靶心≥48px)+ 通用 `BottomSheet.tsx` 抽屉组件
- **SplitBoard.tsx(Pad)**:横屏展开侧栏260px、竖屏折叠(汉堡/左滑手势展开)
- **MathJuniorHome.tsx**:按 useDeviceResponsive 动态挂载三种外壳,理顺插槽传参,消除多余padding/滚动条冲突

### 阶段三 四大模块响应式(Mobile/Tablet分支,Desktop不动)
- **模块一 概念精讲**:考点树选择器 Mobile→BottomSheet;ConceptFourStages Mobile→上下排版(SVG全宽16:9等比);QuickPractice Mobile→单题闪卡全宽48px选项
- **模块二 思维图谱**:SubwayMap Pad→捏合缩放/平移;Mobile→**降级"学期横滑胶囊+纵向考点线流+3节点微拓扑依赖卡"**(不是缩小大图,是新的轻量呈现);CombinationPanel Mobile→底部半高抽屉
- **模块三 沙盒**:LabWorkspace Pad→横屏双栏(左65%画布+引导/右35%控制台);Mobile→**上画布(320px锁定)+下分段控制台**(胶囊切换 变异调控/步骤引导/实时不变量);X-Ray Mobile→画布右上角药丸按钮;动点触控 Hit Radius Pad 24px
- **模块四 测评**:PaperWorkbench Mobile→纵向卡片+筛选进抽屉+底部长条按钮;OnlineExam Mobile→全屏做题+顶部倒计时进度+右上答题卡浮钮滑出题号网格+移动端数学键盘条避让软键盘;ScorePanel Mobile→单列(雷达图220px居中+四维垂直+复盘单列);A4打印 Mobile→隐藏双栏,提供导出PDF/分享

### 阶段四 验证(E2E见§5)

## 4. 红线
- **电脑端零回归**(§1,最高)
- 核心逻辑100%复用:SQLite/Zustand/MathRenderer/判分/沙盒引擎 跨端统一,严禁为端复制业务逻辑(只改布局/交互层)
- 禁改data、判分/隔离/门神核心算法、DB字段
- 无katex裸import/innerHTML注入/emoji/新CSS框架/持久化;沙盒无foreignObject
- 触控靶心:Mobile主按钮≥48px、Pad≥44px

## 5. 🌐 浏览器E2E验收(设备模拟,硬要求)
**口令**:`/browser 查收 NEXT.md 并执行验收`;`pnpm preview` http://127.0.0.1:4173
**⚠️先确认 /browser 支持 Device Emulation(设置viewport+touch+DPR),若不支持则用窗口resize到对应宽度模拟并说明**
1. **电脑端防回归(第一关)**:1440×900 → 四大模块+沙盒三栏 与现状一致、0破版。这关不过直接停。
2. **手机端**(模拟 iPhone15Pro 393×852 touch):底部TabBar切4模块无缝;考点BottomSheet自底滑出;四段论上下排版+SVG不破版;沙盒上画布下分段控制台;考场答题卡滑出+复盘单列;Console零Error
3. **平板端**(模拟 iPad 820×1180竖 / 1180×820横):横竖翻转时概念精讲在左右并排↔上下堆叠平滑切换;测评试卷/答题卡自适应分栏
4. `pnpm test` 全绿(199用例,断点阈值调整后 detectDeviceProfile.property.test 仍通过)、`pnpm build` 0错

## 6. 回写
1. 结果写 outbox/RESULT-FE-0010.md:各阶段完成情况 + **电脑端防回归对比截图** + 三端E2E实测(截图) + 改动文件 + 断点调整说明
2. status改done,播报"TASK-FE-0010 完成"进STANDBY
