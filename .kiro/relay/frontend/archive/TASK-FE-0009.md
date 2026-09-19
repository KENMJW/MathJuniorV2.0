---
id: TASK-FE-0009
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 前端渲染修复 — 四段3/4段公式露原文 + 答案含$走MathRenderer + 答案/文本溢出防御
model: default
concurrency: 1
---

# 任务：前端数学渲染与文本显示统一修复

## 🚨 执行方式
- **执行口令**：人类输入 `/browser 查收 NEXT.md 并执行验收`（含浏览器诊断,必须真机）
- **model=default（Gemini 3.8 Flash）**：固定执行对话直接跑,无需 subagent。问题定位靠浏览器实测DOM,修复是常规前端活(答案接MathRenderer/溢出CSS)。串行。
- ⚠️ 关键仍是**用 /browser 真机诊断第3/4段露原文的实际DOM**,不要靠推断。

## 1. 背景（Kiro 已诊断,数据确认干净）
用户 preview 发现三个前端显示问题。**Kiro 已实测确认:数据库数据全部干净正确**（LaTeX结构0问题、答案无脏来源词、"中考"关键字0条），**三个都是前端渲染/UI问题,禁止改数据**。

### 问题1【四段精讲第3/4段公式露原文】—— 最诡异,需浏览器诊断
- 现象:概念精讲**第4段(本体辨正 intrinsic_variation)、第3段(法典严定 formal_definition)** 里,`$144^\circ$` 这类公式露成 `14 4 ∘` 断裂原文。第1/2段正常,母题/判分等其他地方公式也正常(KaTeX未全局挂)。
- **Kiro已排除**:数据脏(第3/4段LaTeX结构全库0问题、$配对、无跨行)、MathRenderer代码错(混排正则正确)、ConceptFourStages代码错(第3/4段与第1/2段走**完全相同**的 `<MathRenderer content={stageContents[activeStage]} block>` 路径,无区别对待)。
- **矛盾点**:同样代码、同样渲染器,为何只坏第3/4段?**只能在浏览器运行时看实际DOM才能确诊**。可能方向:①第3/4段某条公式含KaTeX不支持/拼错的命令(如疑似 `\impli` 截断)导致该段渲染异常;②内容过长触发某种截断;③CSS(katex.min.css/字体)在该段容器下样式失效。**用/browser打开第3/4段,看实际渲染的DOM结构和console有无KaTeX warning,定位真因再修。**

### 问题2【答案含 $ 露出】
- 448道答案 answer_standard 含正确LaTeX(如 `$11ab$`、`$DE=\frac{1}{2}AC$`),但前端显示答案的地方**没走MathRenderer**,`$`符号和LaTeX源码露出。
- 修:所有显示 answer_standard 的位置(ScorePanel解析、快练答案、母题答案、题目详情等)统一走 `<MathRenderer>`。

### 问题3【答案/长文本溢出显示不全】
- 146道答案超40字(解答题多步答案,如317字),前端显示区未做溢出处理,显示不全/破版。
- 修:答案及长文本显示区做合理换行/展开(答案是要看全的,优先**换行完整显示**而非截断;若空间受限用可展开/滚动,不要一截了之看不到答案)。

## 2. 修复要求
1. **诊断+修第3/4段露原文**:用/browser实测第3/4段DOM,定位KaTeX为何该段失效。若是某条公式含非法命令→MathRenderer已有throwOnError:false该标红而非露原文,检查为何没标红反而露原文;若是CSS/容器问题→修容器。确保第3/4段公式和第1/2段一样正确渲染。
2. **答案走MathRenderer**:grep所有渲染 answer_standard 的地方,统一经MathRenderer出口(铁律3)。
3. **文本溢出防御**:答案优先换行完整显示;其他受限空间的长文本(标签等)截断+title(铁律12)。答案不能因溢出看不全。
4. 顺带:若发现其他 dim/四段/母题正文露原文的同类问题一并修。

## 3. 红线
- **禁改data/*.db**(数据已确认干净,不是数据问题)
- 禁改判分/隔离核心算法、DB字段名
- 公式走MathRenderer(禁裸import katex/innerHTML注入)/无eval/无emoji/无新CSS框架/零持久化
- 不破坏沙盒(FE-0008在改)及其他模块——若与FE-0008有文件重叠需协调,以不冲突为先

## 4. 常规验收(Kiro静态)
- [ ] grep确认 answer_standard 显示处走MathRenderer
- [ ] 答案溢出处理(换行/展开,能看全)
- [ ] 第3/4段修复的代码改动说明(根因+修法)
- [ ] pnpm build 0错 + test全绿
- [ ] 无katex裸import/innerHTML/emoji/新CSS框架

## 5. 🌐 浏览器E2E验收(硬要求)
**口令**:`/browser 查收 NEXT.md 并执行验收`;环境:pnpm preview,http://127.0.0.1:4173
**动作链**:
1. 概念精讲→选考点 KP-061(多边形内角和)→点第4段(本体辨正)
   - [ ] 断言:`144°`、`180°−144°=36°`、`n=360°/36°=10` **正确渲染为数学符号**,不再露 `14 4 ∘` 原文
2. 点第3段(法典严定),换几个考点(KP-001/KP-057)第3/4段
   - [ ] 断言:公式全部正确渲染,无露原文
3. 做一道题交卷→看答案/解析区
   - [ ] 断言:含公式的答案(如 `$11ab$`)渲染为 `11ab`,无 `$` 露出
   - [ ] 断言:长答案(如解答题多步)能完整看到(换行/展开),不溢出截断看不全
4. [ ] 全程console零Error、零KaTeX warning(若有warning记录下来)

## 6. 回写
1. 结果写 outbox/RESULT-FE-0009.md:第3/4段露原文的**真实根因**(浏览器诊断结论)+ 修法 + 三问题E2E实测(附截图/DOM) + 改动文件
2. status改done,播报"TASK-FE-0009 完成"进STANDBY
