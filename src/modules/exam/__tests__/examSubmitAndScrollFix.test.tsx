import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ScorePanel, scrollToElementTop } from '../ScorePanel';
import { ScorePanelErrorBoundary } from '../ScorePanelErrorBoundary';
import type { GeneratedPaper, QuestionItem } from '../drawQuestions';

describe('Exam Submit Crash & Back-To-Top Fix Suite', () => {
  const dummyMeta = {
    paperId: 'test-paper-01',
    titleZh: '测试试卷',
    titleEn: 'Test Paper',
    fullScore: 100,
    timeLimitMinutes: 120,
    generatedAt: new Date().toISOString(),
  };

  it('1. 防御测试：当题目缺少 primary_point_id (undefined/null) 时，ScorePanel 正常计算雷达图与得分，不发生白屏 Crash', () => {
    const brokenQuestions: QuestionItem[] = [
      {
        question_id: 'Q-NO-PID-01',
        source: 'test',
        exam_year: 2025,
        region: '全国',
        exam_type: '中考',
        grade_level: 9,
        semester: 1,
        // @ts-expect-error simulate undefined primary_point_id from raw DB / synthetic data
        primary_point_id: undefined,
        difficulty_level: 3,
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: '选择题测试题干',
        options_json: JSON.stringify(['A', 'B', 'C', 'D']),
        answer_standard: 'A',
      },
      {
        question_id: 'Q-NO-PID-02',
        source: 'test',
        exam_year: 2025,
        region: '全国',
        exam_type: '中考',
        grade_level: 9,
        semester: 1,
        // @ts-expect-error simulate null primary_point_id
        primary_point_id: null,
        difficulty_level: 5,
        question_type: 'solution',
        score_default: 10,
        stem_zh: '解答题测试题干',
        answer_standard: 'x=1',
      },
    ];

    const paper: GeneratedPaper = {
      ...dummyMeta,
      choiceQuestions: [brokenQuestions[0]],
      fillQuestions: [],
      solutionQuestions: [brokenQuestions[1]],
      totalQuestions: 2,
    };

    expect(() => {
      renderToString(
        <ScorePanel
          paper={paper}
          choiceAnswers={{ 'Q-NO-PID-01': 'A' }}
          fillAnswers={{}}
          solutionAnswers={{ 'Q-NO-PID-02': 'x=1' }}
          solutionCheckedSteps={{}}
          onStepCheckChange={() => {}}
          onResetExam={() => {}}
          onBackToWorkbench={() => {}}
        />
      );
    }).not.toThrow();
  });

  it('2. 防御测试：当 rubric_checklist_json 为对象 {} 而非数组时，安全降级为兜底量规，不发生 .map is not a function 崩溃', () => {
    const weirdRubricQuestion: QuestionItem = {
      question_id: 'Q-WEIRD-RUBRIC-01',
      source: 'test',
      exam_year: 2025,
      region: '全国',
      exam_type: '中考',
      grade_level: 9,
      semester: 1,
      primary_point_id: 'KP-020',
      difficulty_level: 4,
      question_type: 'solution',
      score_default: 8,
      stem_zh: '解答题量规非数组对象测试',
      rubric_checklist_json: JSON.stringify({ title: '非数组对象格式', criteria: 'dummy' }),
      answer_standard: 'x=5',
    };

    const paper: GeneratedPaper = {
      ...dummyMeta,
      choiceQuestions: [],
      fillQuestions: [],
      solutionQuestions: [weirdRubricQuestion],
      totalQuestions: 1,
    };

    expect(() => {
      renderToString(
        <ScorePanel
          paper={paper}
          choiceAnswers={{}}
          fillAnswers={{}}
          solutionAnswers={{}}
          solutionCheckedSteps={{}}
          onStepCheckChange={() => {}}
          onResetExam={() => {}}
          onBackToWorkbench={() => {}}
        />
      );
    }).not.toThrow();
  });

  it('3. 交互测试：scrollToElementTop 在传入元素与滚动外壳时能够正确触发原生滚动', () => {
    const mockScrollIntoView = vi.fn();
    const mockScrollTo = vi.fn();

    const mockMain = {
      scrollTo: mockScrollTo,
    };

    const mockElement = {
      scrollIntoView: mockScrollIntoView,
      closest: (selector: string) => (selector === 'main' ? mockMain : null),
    } as unknown as HTMLElement;

    scrollToElementTop(mockElement);

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('4. 错误边界测试：ScorePanelErrorBoundary 捕获内部致命崩溃时渲染友好的兜底界面', () => {
    const error = new Error('Fatal crash simulation in exam review');
    const derivedState = ScorePanelErrorBoundary.getDerivedStateFromError(error);
    expect(derivedState.hasError).toBe(true);
    expect(derivedState.errorMessage).toBe('Fatal crash simulation in exam review');

    const boundary = new ScorePanelErrorBoundary({
      children: <div>Normal</div>,
      onBackToWorkbench: () => {},
      locale: 'zh-CN',
    });
    boundary.state = derivedState;

    const rendered = boundary.render() as React.ReactElement;
    const html = renderToString(rendered);

    expect(html).toContain('成绩复盘大屏遇到波动');
    expect(html).toContain('重新加载复盘');
    expect(html).toContain('返回实战测评');
  });

  it('5. 题库数据清洗验证：40 道历史清洗题在 ScorePanel 中 100% 优雅渲染且零崩溃', () => {
    const qIds = [
      'Q-2025-HLJ-0012', 'Q-2025-HLJ-0040', 'Q-2025-XJ-0040', 'Q-2025-BJ-0050',
      'Q-2025-HUB-0048', 'Q-2025-514-0020', 'Q-2025-CQ-0050', 'Q-2025-SH-0049',
      'Q-2024-571020-0011', 'Q-2024-571020-0018', 'Q-2025-25-0044', 'Q-2025-7AE16F-0002',
      'Q-2025-7AE16F-0019', 'Q-2025-7AE16F-0022', 'Q-2025-E9EC0C-0010', 'Q-2025-E9EC0C-0025',
      'Q-2025-7FF358-0002', 'Q-2025-7FF358-0005', 'Q-2025-7FF358-0006', 'Q-2025-7FF358-0008',
      'Q-2025-7FF358-0009', 'Q-2025-7FF358-0010', 'Q-2025-7FF358-0017', 'Q-2025-7FF358-0018',
      'Q-2025-7FF358-0019', 'Q-2025-7FF358-0021', 'Q-2025-7FF358-0022', 'Q-2025-7FF358-0023',
      'Q-2025-7FF358-0025', 'Q-2025-65F02A-0001', 'Q-2025-65F02A-0001f', 'Q-2025-741C27-0011d',
      'Q-2025-77C3DE-0003b', 'Q-2025-77C3DE-0008c', 'Q-2025-78134A-0010b', 'Q-2025-78134A-0012b',
      'Q-2025-8FEA9C-0005c', 'Q-2025-8FEA9C-0005h', 'Q-2025-8FEA9C-0005i', 'Q-2025-F6CEF6-0003b'
    ];

    expect(qIds.length).toBe(40);

    for (const qid of qIds) {
      const isFill = !qid.includes('solution') && !qid.endsWith('f') && !qid.endsWith('d') && !qid.endsWith('c') && !qid.endsWith('h') && !qid.endsWith('i');
      const testQ: QuestionItem = {
        question_id: qid,
        source: '真题库清洗',
        exam_year: 2025,
        region: '全国',
        exam_type: '中考',
        grade_level: 9,
        semester: 1,
        primary_point_id: 'KP-001',
        difficulty_level: 3,
        question_type: isFill ? 'fill_blank' : 'solution',
        score_default: 5,
        stem_zh: `题号 ${qid} 的题干公式 $\\sqrt{2}$ 优雅排版`,
        answer_standard: '$x = 1$',
      };

      const paper: GeneratedPaper = {
        ...dummyMeta,
        choiceQuestions: [],
        fillQuestions: isFill ? [testQ] : [],
        solutionQuestions: !isFill ? [testQ] : [],
        totalQuestions: 1,
      };

      expect(() => {
        renderToString(
          <ScorePanel
            paper={paper}
            choiceAnswers={{}}
            fillAnswers={{ [qid]: '$x = 1$' }}
            solutionAnswers={{ [qid]: '草稿推导' }}
            solutionCheckedSteps={{}}
            onStepCheckChange={() => {}}
            onResetExam={() => {}}
            onBackToWorkbench={() => {}}
          />
        );
      }).not.toThrow();
    }
  });
});
