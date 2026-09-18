---
id: TASK-FE-0002
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 前端适配多解 solutions_json 结构（[{method,text}] 数组，分解法渲染）
model: default
concurrency: 1
---

# 任务：前端解析并渲染多解 solutions_json

## 1. 目标
数据线已把真题 `solutions_json` 统一为**多解数组结构** `[{"method":"解法一","text":"..."},{"method":"解法二","text":"..."}]`（167 道有多解，其余单解一个对象）。
当前前端**未解析该 JSON**，而是把整个 JSON 字符串直接当文本喂给 `<QuestionContent>`（见 §2 缺陷）。本任务：让前端**正确解析数组、按解法分条渲染**，每条含 method 标题 + text 正文（走 MathRenderer/QuestionContent 出口，支持公式与图锚点）。

## 2. 现状缺陷（实测确认，Kiro 已查）
- `src/modules/graph/LineQuickPractice.tsx:400`：`<QuestionContent content={currentQ.solutions_json} .../>` —— 把 JSON 字符串整个当文本渲染，用户会看到 `[{"method":"解法一","text":...}]` 原始 JSON
- `src/modules/exam/PrintLayout.tsx:463 & 691`：同样直接塞 solutions_json 字符串
- **结构不一致坑**：mock 数据(`mockExamQuestions.ts`)用的是旧结构 `{"method_zh":"...","steps":[...]}`，与真实数据 `{"method":"...","text":"..."}` 不一致 —— 需统一到真实结构

## 3. 具体步骤
1. **定义解析函数**（新建 `src/modules/exam/parseSolutions.ts` 或就近工具）：
   - 输入 solutions_json 字符串 → 解析为 `{method:string, text:string}[]`
   - 容错：空/null → 返回 []；非法 JSON → 返回 []（不崩）；老结构 `{method_zh,steps}` 做兼容映射（method_zh→method，steps join→text），避免 mock 数据崩
2. **新建渲染组件** `src/modules/exam/SolutionList.tsx`（或复用现有模式）：
   - 遍历解析结果，每条渲染：method 作小标题（如"解法一"）+ text 走 `<QuestionContent role="solution">`（保证公式/图锚点正确渲染）
   - 多解（length>1）：分条显示，视觉上可区分（如各解法卡片/分隔线/序号），走 iOS27 token 样式
   - 单解（length===1）：正常显示，method 可省略或简单标注
3. **替换所有直接塞 solutions_json 字符串的地方**：
   - `LineQuickPractice.tsx`、`PrintLayout.tsx`(两处) → 改用 SolutionList
   - 检查 ScorePanel 等其他消费 solutions 的地方
4. **统一 mock 数据结构**：把 `mockExamQuestions.ts` 里 `{method_zh,steps}` 改成 `{method,text}`（与真实数据一致），避免测试与真实脱节

## 4. 红线 / 禁止事项
- 禁改判分逻辑（calculateSolutionScore / rubric）、drawQuestions 隔离逻辑、QuestionContent 内部锚点切分逻辑
- 禁 import katex / 裸 innerHTML —— 解析文本必须走 MathRenderer/QuestionContent 出口（铁律3）
- 禁引入新 CSS 框架（用 iOS27 token + inline style，铁律10）
- 禁 emoji（铁律11）
- 不碰 data/questions.db

## 5. 验收清单（Kiro 据此验收）
- [ ] parseSolutions 解析 `[{method,text}]` 正确；空/null/非法 JSON 返回 [] 不崩
- [ ] 老结构 `{method_zh,steps}` 有兼容映射（mock 不崩）
- [ ] 多解题（如 solutions 有 2 条）分条渲染，method 标题 + text 分别显示，不再整串 JSON 裸露
- [ ] 单解题正常渲染
- [ ] solution text 走 QuestionContent/MathRenderer（公式渲染正确、图锚点 [[IMG:n]] 就地）
- [ ] mockExamQuestions.ts 结构统一为 {method,text}
- [ ] 判分/隔离/QuestionContent 内部逻辑零改动（git 比对）
- [ ] 无 katex import / 无裸 innerHTML / 无 emoji / 无新 CSS 框架类
- [ ] pnpm test 全绿（用例数记录）、pnpm build 0 错
- [ ] preview 肉眼：找一道多解真题（如 Q-2025-MZ42-0028），解析区显示"解法一/解法二"分条

## 6. 回写要求
1. 结果写 `outbox/RESULT-FE-0002.md`：逐条验收自检 + 改动文件清单 + 多解渲染的 question_id 佐证
2. 任务书 status 改 done
3. 播报"TASK-FE-0002 完成"，进入就绪待命（STANDBY）

## 7. 执行方式
- `model: default` → Flash，固定执行对话直接跑（default 不强制 subagent）
- 完成后 STANDBY 待命，等用户唤醒 Kiro 验收
