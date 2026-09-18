import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { OnlineExam } from '../OnlineExam';
import { MathKeyboard } from '../MathKeyboard';
import { RadarChart } from '../RadarChart';
import { ScorePanel } from '../ScorePanel';
import { drawQuestions } from '../drawQuestions';
import { mockExamQuestions } from '../mockExamQuestions';
import { isMathAnswerEquivalent } from '../../../engine/judge/isMathAnswerEquivalent';
import { calculateSolutionScore } from '../../../engine/judge/calculateSolutionScore';
import { useSessionStore } from '../../../store/sessionStore';

describe('OnlineExam & Assessment Center (Tasks 17.5 + 17.6 & 铁律 2/3/9/10 门禁校验)', () => {
  const testPaper = drawQuestions(
    mockExamQuestions,
    {
      selectedKpIds: [],
      choiceCount: 3,
      fillCount: 2,
      solutionCount: 2,
      difficultyDistribution: [20, 20, 20, 20, 20],
    },
    {
      titleZh: '2024年中考数学全真模拟综合测试卷',
      fullScore: 30,
      timeLimitMinutes: 120,
    }
  );

  it('1. 任务 17.5: 左右视窗解耦 Fixed Split-View 结构与锚点跳转', () => {
    const html = renderToString(
      <OnlineExam paper={testPaper} onBackToWorkbench={() => {}} />
    );

    // 左卷作答舞台独立滚动容器
    expect(html).toContain('data-testid="left-paper-scroll"');
    // 右指挥舱固定常驻容器
    expect(html).toContain('data-testid="right-cockpit-sticky"');

    // 动态答题卡元素与说明卡
    expect(html).toContain('动态答题卡');
    expect(html).toContain('答题辅助与语法说明');
    expect(html).toContain('立即交卷');

    // 每一题必须有唯一的 question-anchor-ID 供平滑滚动定位
    testPaper.choiceQuestions.forEach((q) => {
      expect(html).toContain(`question-anchor-${q.question_id}`);
    });
    testPaper.fillQuestions.forEach((q) => {
      expect(html).toContain(`question-anchor-${q.question_id}`);
    });
    testPaper.solutionQuestions.forEach((q) => {
      expect(html).toContain(`question-anchor-${q.question_id}`);
    });
  });

  it('2. 任务 17.5: 全局唯一伴随数学键盘 MathKeyboard 渲染与常用符号覆盖', () => {
    const html = renderToString(
      <MathKeyboard
        visible={true}
        currentValue="x^2 + \sqrt{2x}"
        onInsert={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        onClose={() => {}}
        targetTitle="第 4 题 填空输入"
      />
    );

    expect(html).toContain('data-testid="math-keyboard-panel"');
    expect(html).toContain('第 4 题 填空输入');
    expect(html).toContain('退格');
    expect(html).toContain('清空');
    expect(html).toContain('完成');

    // 验证不可见时返回 null
    const hiddenHtml = renderToString(
      <MathKeyboard
        visible={false}
        currentValue=""
        onInsert={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        onClose={() => {}}
      />
    );
    expect(hiddenHtml).toBe('');
  });

  it('3. 任务 17.6: 纯 SVG 四维认知素养雷达图渲染且严格无 foreignObject (Property 20)', () => {
    const mockScores = {
      breadth: 85,
      insight: 90,
      hiddenCondition: 78,
      resilience: 92,
    };

    const html = renderToString(<RadarChart scores={mockScores} size={320} />);

    // 必须包含 4 个维度的文本标签
    expect(html).toContain('知识广度');
    expect(html).toContain('深度洞察');
    expect(html).toContain('隐蔽条件发掘');
    expect(html).toContain('计算耐受力');

    // 必须渲染 SVG 元素
    expect(html).toContain('data-testid="cognitive-radar-svg"');
    expect(html).toContain('<polygon');

    // Property 20 跨引擎安全不变量：绝对禁止出现 <foreignObject>
    expect(html).not.toContain('<foreignObject');
    expect(html).not.toContain('foreignObject');
  });

  it('4. 任务 17.6: 判分引擎接入验证 (填空 isMathAnswerEquivalent + 解答 calculateSolutionScore)', () => {
    // 验证填空题判分引擎直接接入
    expect(isMathAnswerEquivalent('x=2', '2', [])).toBe(true);
    expect(isMathAnswerEquivalent('(x+1)/(x-2)', '\\frac{x+1}{x-2}', [])).toBe(true);
    expect(isMathAnswerEquivalent('1/2', '0.5', [])).toBe(true);
    expect(isMathAnswerEquivalent('3', '5', [])).toBe(false);

    // 验证解答题踩分点自核打钩接入
    const rubricSteps = [
      { stepIndex: 1, descriptionZh: '连接辅助线 AC 并求长度', points: 3 },
      { stepIndex: 2, descriptionZh: '证明直角三角形 ∠ACD = 90°', points: 3 },
      { stepIndex: 3, descriptionZh: '计算四边形总面积为 36', points: 4 },
    ];
    // 未勾选 -> 0 分
    expect(calculateSolutionScore(rubricSteps, new Set())).toBe(0);
    // 勾选步 1 -> 3 分
    expect(calculateSolutionScore(rubricSteps, new Set([1]))).toBe(3);
    // 勾选全部 1, 2, 3 -> 10 分满分
    expect(calculateSolutionScore(rubricSteps, new Set([1, 2, 3]))).toBe(10);
  });

  it('5. 任务 17.6: ScorePanel 完整呈现四维诊断大屏与解答题分步自核打钩', () => {
    const qChoice = testPaper.choiceQuestions[0];
    const qFill = testPaper.fillQuestions[0];
    const qSolution = testPaper.solutionQuestions[0];

    const html = renderToString(
      <ScorePanel
        paper={testPaper}
        choiceAnswers={{ [qChoice.question_id]: qChoice.answer_standard || 'A' }}
        fillAnswers={{ [qFill.question_id]: qFill.answer_standard || '5' }}
        solutionAnswers={{ [qSolution.question_id]: '推导过程草稿' }}
        solutionCheckedSteps={{ [qSolution.question_id]: new Set([1]) }}
        onStepCheckChange={() => {}}
        onResetExam={() => {}}
        onBackToWorkbench={() => {}}
        timeSpentSeconds={360}
      />
    );

    expect(html).toContain('测评复盘完成');
    expect(html).toContain('四维素养量化诊断');
    expect(html).toContain('逐题深度复盘与解答题踩分自核');
    expect(html).toContain('单选题复盘');
    expect(html).toContain('填空题等价判分复盘');
    expect(html).toContain('解答题踩分点自核 (Rubric Checklist)');
    expect(html).toContain('考完即焚并离开');
  });

  it('6. [铁律 2] 考完即焚 (零持久化)：作答、判分与重置过程绝不写 localStorage / IndexedDB', () => {
    const mockStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    const mockIndexedDB = {
      open: vi.fn(),
    };
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).indexedDB = mockIndexedDB;

    const store = useSessionStore.getState();

    // 记录模考得分入 Zustand 会话内存
    store.setExamScore({
      totalScore: 28,
      maxScore: 30,
      details: { 'Q-001': 3, 'Q-002': 5 },
    });
    expect(useSessionStore.getState().examScore?.totalScore).toBe(28);

    // 重置并考完即焚
    store.resetScores();
    expect(useSessionStore.getState().examScore).toBeNull();

    store.resetAll();
    expect(useSessionStore.getState().examScore).toBeNull();
    expect(useSessionStore.getState().presentedIds.size).toBe(0);

    // 断言整个过程 localStorage 与 IndexedDB 零调用
    expect(mockStorage.setItem).toHaveBeenCalledTimes(0);
    expect(mockStorage.getItem).toHaveBeenCalledTimes(0);
    expect(mockIndexedDB.open).toHaveBeenCalledTimes(0);
  });

  it('7. [铁律 3 & 铁律 9] 门禁：文本上屏统一走 MathRenderer，无裸 innerHTML，绝不查询 master_examples', () => {
    const examFilePath = path.resolve(__dirname, '../OnlineExam.tsx');
    const keyboardFilePath = path.resolve(__dirname, '../MathKeyboard.tsx');
    const scorePanelFilePath = path.resolve(__dirname, '../ScorePanel.tsx');

    const examContent = fs.readFileSync(examFilePath, 'utf-8');
    const keyboardContent = fs.readFileSync(keyboardFilePath, 'utf-8');
    const scorePanelContent = fs.readFileSync(scorePanelFilePath, 'utf-8');

    // 铁律 3: 必须引入并使用 MathRenderer
    expect(examContent).toContain('MathRenderer');
    expect(keyboardContent).toContain('MathRenderer');
    expect(scorePanelContent).toContain('MathRenderer');

    // 严禁裸 dangerouslySetInnerHTML
    expect(examContent).not.toContain('dangerouslySetInnerHTML');
    expect(keyboardContent).not.toContain('dangerouslySetInnerHTML');
    expect(scorePanelContent).not.toContain('dangerouslySetInnerHTML');

    // 剥离注释后校验代码段
    const stripComments = (str: string) => str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const examCode = stripComments(examContent);
    const scorePanelCode = stripComments(scorePanelContent);

    // 铁律 9: 严禁触碰 master_examples
    expect(examCode).not.toMatch(/master_examples/i);
    expect(scorePanelCode).not.toMatch(/master_examples/i);
  });
});
