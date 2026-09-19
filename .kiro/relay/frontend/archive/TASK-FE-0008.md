---
id: TASK-FE-0008
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 沙盒探究实验室重构 — 三栏布局+深色画布+公式移出+4D控制台+X-Ray+探究引导，对标ios27_demo
model: gemini 3.1 pro
concurrency: 1
---

# 任务：沙盒探究实验室重构（模块三）

## 🚨 执行方式（先读）
- **执行口令**：人类输入 `/browser 查收 NEXT.md 并执行验收`（验收走真实浏览器 E2E + 对标 demo 截图）
- **model=gemini 3.1 pro**：沙盒重构 + JSXGraph 4D + 视觉还原是高难任务。执行者主对话 Flash 换不了 Pro，**必须 invoke_subagent(Model="pro", TypeName="self") 派发编码**（协作标准 §7）。串行。

## 1. 背景
用户 preview 实测沙盒"非常难用"(截图证据):公式露 `\circ` 原文、文字重叠糊团、视口失控(x轴拉到140)、孤立点无几何意义。经与用户敲定**沙盒探究实验室重设计方案 v2**(已审定通过),本任务按方案重构模块三。
- **完整设计方案**：见 Kiro 产出的重设计方案(核心要点已抄录于 §3~§6)
- **视觉/布局对标基准**：`.kiro/specs/math-junior-frontend/design-refs/ios27_demo.html`(用户认可的 iOS27 设计原型,**必须严格对齐其 token/布局/沙盒骨架**)
- **数据已就绪**：concept_sandboxes 46 真实配置(TASK-DATA-0004)、leap_sandbox_models 36 的4D配置(TASK-DATA-0003)

## 2. 对标基准(强制)
打开 `design-refs/ios27_demo.html` 提取并对齐：
- **Design token**：`--text-primary:#1d1d1f`、单一品牌蓝 `--ios-blue:#0071e3`(禁彩虹)、`--bg-page:#fbfbfd`、圆角 sm8/md14/lg22/pill、弹簧 `cubic-bezier(0.16,1,0.3,1)`、玻璃 `blur(20px) saturate(180%)`
- **沙盒画布**：深色底 `#0f172a`(demo 的 sandbox-viewport 质感)
- **滑块**：demo 的 `input[type=range]` 极简样式(白thumb + 阴影)
- **整体布局**：顶部sticky玻璃导航 + 工作台四模块 segmented + workspace-stage-card

## 3. 沙盒布局重构(电脑版三栏,照方案+demo)
```
workspace-stage-card 内:
[实验室一 概念沙盒 / 实验室二 4D跃迁] segmented 切换
┌ 左:模型导航(中文名) ┬ 中:深色画布(纯几何,视口锁定) ┬ 右:4D控制台 ┐
│                                                    ▸实时不变量(MathRenderer) │
├──────────────────┴────────────────────────┴─────────────────┤
│ 底部探究引导条: 步骤N「拖动A观察∠ACB」 [下一步▸]                   │
└──────────────────────────────────────────────────────────┘
```
铁律:
- **画布只画几何,公式一律走 `<MathRenderer>` 在右侧面板/不变量区渲染**(根治露 `\circ` 原文——这是最重要的修复)
- **视口锁定**:initBoard 关 pan/zoom(或严格限制),用 calculateMasterAnchoredViewport 保形+15%边距,动点 clampDynamicValue 弹性阻尼(修 x轴拉到140)
- **全局中文名**:沙盒/考点/模型显示中文名(concept JOIN core.knowledge_points.name_zh;leap 用 model_name_zh),不露 SB-KP001/LM-xx;长名截断+title(防溢出)

## 4. 4D 变换控制台(实验室二 36 跃迁模型核心)
右侧控制台四维度分层卡(每维一张玻璃小卡):
- **载体(Carrier)**:载体切换卡片,切换时图形 morph 过渡
- **参数(Parameter)**:极简白滑块(对齐demo)+当前值,滑动时不变量实时高亮
- **姿态(Posture)**:[标准/旋转/翻折/倒挂] 按钮组,点击整图刚体变换(过渡动画)
- **干扰+X-Ray(Camouflage)**⭐:开关1「加壳」套压轴干扰;开关2「X-Ray透视」→ 干扰opacity→0.1、核心骨架加粗发光(JSXGraph 分层切opacity)
- **实时不变量面板**:公式走 MathRenderer,恒定量打「✓恒定」高亮徽章
- 真消费 leap_sandbox_models 的 carrier/parameter/posture/camouflage_json(复用/增强 compileMorphingSandboxConfig)

## 5. 探究引导(让它像实验)
- 底部引导条按探究脚本分步:观察→猜想→验证(拖/调)→发现(不变量高亮闪光)→变式,每步「下一步」+发现微动效
- 引导文案:可从沙盒 inquiry_guide_zh 派生,或前端按模板生成(不强求数据侧新供)
- **实验室一(46概念沙盒)**:轻量,主用 载体+参数+引导,不强求4D全
- **实验室二(36跃迁模型)**:完整 4D + X-Ray

## 6. 三端(用户明确要求)
- **电脑版**:严格照 demo 布局(三栏)+ demo 视觉
- **平板/手机**:**UI 对齐 demo 视觉(同色/同圆角/同玻璃/同深色画布)**,但**交互按端融合**——不强求完全一致:平板画布+控制台上下分布/导航抽屉;手机画布全宽在上、控制台与引导下拉抽屉、滑块拇指热区≥44px。合理适配,不照搬三栏。

## 7. 红线
- 禁改判分/隔离/门神核心算法、DB字段名、data/*.db
- 无 katex import(公式走MathRenderer出口)/无 eval/Function(沙盒clamp纯数学)/无 foreignObject/无 emoji/无新CSS框架/零持久化
- 沙盒渲染无 var(--) 传 JSXGraph(用真实色值)
- 不破坏其他模块(概念精讲/图谱/测评)现有功能

## 8. 常规验收(Kiro 静态核实)
- [ ] 沙盒三栏布局 + 深色画布 + 右侧4D控制台;公式全走MathRenderer(画布内无LaTeX文本)
- [ ] 视口锁定(无自由缩放乱象);中文名+防溢出
- [ ] 4D四维度(载体/参数/姿态/干扰)+ X-Ray 开关都在,真消费leap配置
- [ ] 探究引导条分步
- [ ] token/画布深色/滑块样式对齐 ios27_demo
- [ ] pnpm build 0错 + pnpm test 全绿
- [ ] 无katex/eval/foreignObject/emoji/新CSS框架

## 9. 🌐 浏览器 E2E 验收(硬要求,对标 demo 截图)
**执行口令**:`/browser 查收 NEXT.md 并执行验收`
**环境**:后台 pnpm preview,入口 http://127.0.0.1:4173
**动作链**:
1. 进【见微知著·实验探究】→ 断言:三栏布局、画布深色、模型显中文名
2. 实验室一:点一个概念沙盒 → 断言:画布出现**有几何意义的图形**(数轴沙盒有数轴刻度+点,非孤立点);拖动点,右侧不变量(MathRenderer渲染的**真公式非露原文**)实时更新
3. 实验室二:切到4D跃迁模型 → 断言:载体切换/参数滑块/姿态按钮生效;**点X-Ray开关,干扰淡化、核心骨架高亮**
4. 断言(全程):**Console 零 Error、零 wasm失败、零 fallback警告**;公式无 `\circ`/`\frac` 露原文;视口不失控
5. 视觉对标:与 design-refs/ios27_demo.html 比对,色/圆角/玻璃/深色画布/滑块样式一致

## 10. 回写
1. 结果写 outbox/RESULT-FE-0008.md:常规自检 + **浏览器E2E实测(务必附截图或详细DOM/视觉描述)** + 与demo视觉对标结论 + 改动文件
2. status改done,播报"TASK-FE-0008 完成"进STANDBY
