import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { LineClosedLoop } from '../LineClosedLoop';
import { LineQuickPractice } from '../LineQuickPractice';
import { mockLogicLines, mockLineMasterExamples, mockLineQuickPracticeQuestions } from '../mockGraphData';
import { useSessionStore } from '../../../store/sessionStore';

describe('LineClosedLoop & LineQuickPractice (Task 10.4 & 铁律 3/4 门禁校验)', () => {
  beforeEach(() => {
    useSessionStore.getState().resetAll();
  });

  const testLine = mockLogicLines.find((l) => l.line_id === 'G4') || mockLogicLines[0];
  const testMaster = mockLineMasterExamples['ME-LINE-G4'];

  it('1. LineClosedLoop 完整渲染主线闭环四要素', () => {
    const html = renderToString(
      <LineClosedLoop
        line={testLine}
        masterExample={testMaster}
      />
    );

    // ① 主线标识与名称
    expect(html).toContain('G4');
    expect(html).toContain('几何度量与勾股演进');

    // ② 实验室二旗舰模型
    expect(html).toContain('LM-8A-01');
    expect(html).toContain('实验室二旗舰模型');

    // ① 主线精讲四段内容
    expect(html).toContain('源头基石');
    expect(html).toContain('螺旋跃迁路径');
    expect(html).toContain('核心思想方法');
    expect(html).toContain('中考压轴矩阵');

    // 包含四段论内容
    expect(html).toContain('从直观线段度量到面积割补证明');
  });

  it('2. LineQuickPractice 严格锁定 L4~L6 难度，排除 L1~L3 题', () => {
    const mixedQuestions: any[] = [
      {
        question_id: 'Q-L1',
        primary_point_id: 'KP-023',
        difficulty_level: 1, // 非法，应被排除
        question_type: 'single_choice',
        score_default: 2,
        stem_zh: 'L1 简单题不可出现',
        stem_en: 'L1 Simple Forbidden',
        options: [{ key: 'A', text_zh: '1', text_en: '1' }],
        answer_standard: 'A',
      },
      {
        question_id: 'Q-L4',
        primary_point_id: 'KP-023',
        difficulty_level: 4, // 合法
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: 'L4 中难综合题必须出现',
        stem_en: 'L4 Medium Hard Allowed',
        options: [{ key: 'A', text_zh: '4', text_en: '4' }],
        answer_standard: 'A',
      },
      {
        question_id: 'Q-L5',
        primary_point_id: 'KP-023',
        difficulty_level: 5, // 合法
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: 'L5 高难跃迁题必须出现',
        stem_en: 'L5 Hard Leap Allowed',
        options: [{ key: 'A', text_zh: '5', text_en: '5' }],
        answer_standard: 'A',
      },
      {
        question_id: 'Q-L6',
        primary_point_id: 'KP-023',
        difficulty_level: 6, // 合法
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: 'L6 压轴探究题必须出现',
        stem_en: 'L6 Hard Synthesis Allowed',
        options: [{ key: 'A', text_zh: '6', text_en: '6' }],
        answer_standard: 'A',
      },
      {
        question_id: 'Q-L7',
        primary_point_id: 'KP-023',
        difficulty_level: 7, // 非法，应被排除
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: 'L7 超标奥赛题不可出现',
        stem_en: 'L7 Out of scope Forbidden',
        options: [{ key: 'A', text_zh: '7', text_en: '7' }],
        answer_standard: 'A',
      },
    ];

    const html = renderToString(
      <LineQuickPractice
        lineId="G4"
        allQuestions={mixedQuestions}
      />
    );

    // 抽取的题目中绝不包含 L1 或 L7
    expect(html).not.toContain('L1 简单题不可出现');
    expect(html).not.toContain('L7 超标奥赛题不可出现');

    // 必须包含 L4~L6 标志
    expect(html).toContain('L4~L6 综合强化');
  });

  it('3. LineQuickPractice 渲染主线题目内容并走 MathRenderer', () => {
    const html = renderToString(
      <LineQuickPractice
        lineId="G4"
        initialQuestions={[mockLineQuickPracticeQuestions[0]]}
        allQuestions={mockLineQuickPracticeQuestions}
      />
    );

    expect(html).toContain('主线强化快练');
    expect(html).toContain('math-renderer');
    // 检查是否有题目选项 A B C D
    expect(html).toContain('7/8');
  });

  it('4. 题库不足 3 题时触发友好提示，严禁静默返回不足题量 (§5.1)', () => {
    const html = renderToString(
      <LineQuickPractice
        lineId="G4"
        allQuestions={[]} // 空题库
      />
    );

    expect(html).toContain('主线强化练习题库整备中');
    expect(html).toContain('当前主线要求 L4~L6 难度综合题');
  });

  it('5. 铁律 3/4 源码安全检查：0 裸 innerHTML、0 直接 katex 引用、0 学情诊断 token', () => {
    const lineClosedLoopPath = path.resolve(__dirname, '../LineClosedLoop.tsx');
    const linePracticePath = path.resolve(__dirname, '../LineQuickPractice.tsx');

    const closedLoopCode = fs.readFileSync(lineClosedLoopPath, 'utf-8');
    const practiceCode = fs.readFileSync(linePracticePath, 'utf-8');

    // 铁律 3：禁止业务层裸 innerHTML 或直接引入 katex
    expect(closedLoopCode).not.toContain('dangerouslySetInnerHTML');
    expect(closedLoopCode).not.toContain('.innerHTML');
    expect(closedLoopCode).not.toMatch(/from\s+['"]katex['"]/);

    expect(practiceCode).not.toContain('dangerouslySetInnerHTML');
    expect(practiceCode).not.toContain('.innerHTML');
    expect(practiceCode).not.toMatch(/from\s+['"]katex['"]/);

    // 铁律 4：严禁引入作废的状态诊断 token
    expect(closedLoopCode).not.toContain('--status-mastered');
    expect(closedLoopCode).not.toContain('--status-fragile');
    expect(closedLoopCode).not.toContain('--pulse-track');
    expect(closedLoopCode).not.toContain('traceRootCause');

    expect(practiceCode).not.toContain('--status-mastered');
    expect(practiceCode).not.toContain('--status-fragile');
    expect(practiceCode).not.toContain('--pulse-track');
    expect(practiceCode).not.toContain('traceRootCause');
  });
});
