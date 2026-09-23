import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { PaperWorkbench } from '../PaperWorkbench';
import { PrintLayout } from '../PrintLayout';
import { drawQuestions } from '../drawQuestions';
import { testExamQuestions } from './testExamQuestions';
import { FULL_SCORE_SYSTEMS, PRESET_PAPERS, GRADE_7_KP_IDS } from '../presetPapers';

describe('PaperWorkbench & PrintLayout (Tasks 17.1 ~ 17.4 & 铁律 3/9/10 门禁校验)', () => {
  it('1. 满分制体系规范契约严格遵照 PRD 5.4 设定', () => {
    // 100 分标准制: 27 题 (15 选 + 5 空 + 7 答)
    expect(FULL_SCORE_SYSTEMS['100'].totalScore).toBe(100);
    expect(FULL_SCORE_SYSTEMS['100'].totalQuestions).toBe(27);
    expect(FULL_SCORE_SYSTEMS['100'].choiceCount).toBe(15);
    expect(FULL_SCORE_SYSTEMS['100'].fillCount).toBe(5);
    expect(FULL_SCORE_SYSTEMS['100'].solutionCount).toBe(7);

    // 120 分中考制: 24 题 (10 选 + 6 空 + 8 答)
    expect(FULL_SCORE_SYSTEMS['120'].totalScore).toBe(120);
    expect(FULL_SCORE_SYSTEMS['120'].totalQuestions).toBe(24);
    expect(FULL_SCORE_SYSTEMS['120'].choiceCount).toBe(10);
    expect(FULL_SCORE_SYSTEMS['120'].fillCount).toBe(6);
    expect(FULL_SCORE_SYSTEMS['120'].solutionCount).toBe(8);

    // 150 分大考制: 25 题 (10 选 + 6 空 + 9 答)
    expect(FULL_SCORE_SYSTEMS['150'].totalScore).toBe(150);
    expect(FULL_SCORE_SYSTEMS['150'].totalQuestions).toBe(25);
    expect(FULL_SCORE_SYSTEMS['150'].choiceCount).toBe(10);
    expect(FULL_SCORE_SYSTEMS['150'].fillCount).toBe(6);
    expect(FULL_SCORE_SYSTEMS['150'].solutionCount).toBe(9);
  });

  it('2. 预设卷库包含难度梯度卷、全真考卷与 6 学期期末综合卷', () => {
    expect(PRESET_PAPERS.length).toBeGreaterThanOrEqual(10);
    const gradPapers = PRESET_PAPERS.filter((p) => p.category === 'gradient');
    expect(gradPapers.length).toBe(3); // 地狱15%、噩梦35%、普通50%

    const semesterPapers = PRESET_PAPERS.filter((p) => p.category === 'semester');
    expect(semesterPapers.length).toBe(6); // 七上到九下 6 学期
  });

  it('3. PaperWorkbench 能够成功挂载并渲染单轨四层工作台界面', () => {
    const html = renderToString(<PaperWorkbench />);
    expect(html).toContain('模块四 · 实战测评 · 智能组卷中心');
    expect(html).toContain('第一层 · 满分制基准');
    expect(html).toContain('100分标准制');
    expect(html).toContain('120分中考制');
    expect(html).toContain('150分大考制');
    expect(html).toContain('第二层 · 学期向后覆盖与考点子集');
    expect(html).toContain('第三层 · 题型题量与分值配置');
    expect(html).toContain('第四层 · 试卷难度配比');
    expect(html).toContain('生成中考全真模拟试卷');
    expect(html).toContain('全真题库');

    // 默认值检验：试卷标题、第一层 100分、第二层 七年级
    expect(html).toContain('value="初中数学全真模拟综合测试卷"');
    expect(html).toContain('100分标准制');
    expect(html).toContain('7年级 下学期');
    expect(GRADE_7_KP_IDS.length).toBe(32);
  });

  it('4. PrintLayout 完整渲染试卷头部、三大题型与左侧密封线', () => {
    const paper = drawQuestions(
      testExamQuestions,
      {
        selectedKpIds: [],
        choiceCount: 10,
        fillCount: 6,
        solutionCount: 8,
      },
      {
        titleZh: '2024年中考数学仿真测试卷',
        fullScore: 120,
        timeLimitMinutes: 120,
      }
    );

    const html = renderToString(<PrintLayout paper={paper} />);

    // 卷头与密封线
    expect(html).toContain('2024年中考数学仿真测试卷');
    expect(html).toContain('绝密★启用前');
    expect(html).toContain('密 封 线 内 严 禁 答 题');
    expect(html).toContain('准考证号');

    // 三大题型段落
    expect(html).toContain('一、选择题');
    expect(html).toContain('二、填空题');
    expect(html).toContain('三、解答题');

    // 题目数量对应
    expect(paper.choiceQuestions.length).toBe(10);
    expect(paper.fillQuestions.length).toBe(6);
    expect(paper.solutionQuestions.length).toBe(8);
  });

  it('5. 铁律 3 与 铁律 9 源码级防线检测', () => {
    const workbenchPath = path.resolve(__dirname, '../PaperWorkbench.tsx');
    const printLayoutPath = path.resolve(__dirname, '../PrintLayout.tsx');
    const drawQuestionsPath = path.resolve(__dirname, '../drawQuestions.ts');

    const wbContent = fs.readFileSync(workbenchPath, 'utf-8');
    const plContent = fs.readFileSync(printLayoutPath, 'utf-8');
    const dqContent = fs.readFileSync(drawQuestionsPath, 'utf-8');

    // 铁律 3: 必须引入并使用 MathRenderer，严禁使用裸 dangerouslySetInnerHTML
    expect(wbContent).toContain('MathRenderer');
    expect(plContent).toContain('MathRenderer');
    expect(wbContent).not.toContain('dangerouslySetInnerHTML');
    expect(plContent).not.toContain('dangerouslySetInnerHTML');

    // 铁律 9: 抽题与出题中心绝对禁止引用或查询 master_examples 表 (剥离注释后校验代码段)
    const stripComments = (str: string) => str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const dqCode = stripComments(dqContent);
    const wbCode = stripComments(wbContent);
    expect(dqCode).not.toMatch(/master_examples/i);
    expect(wbCode).not.toMatch(/master_examples/i);
  });
});
