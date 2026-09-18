import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { QuickPractice } from '../QuickPractice';
import { QuickPracticeQuestion } from '../quickPractice.machine';
import { useSessionStore } from '../../../store/sessionStore';

const mockQuestions: QuickPracticeQuestion[] = [
  {
    question_id: 'Q-2023-BJ-001',
    primary_point_id: 'KP-023',
    difficulty_level: 1,
    question_type: 'single_choice',
    score_default: 2,
    stem_zh: '在 $\\text{Rt}\\triangle ABC$ 中，两直角边长为 3 和 4，斜边长为（ ）',
    stem_en: 'In right triangle ABC with legs 3 and 4, hypotenuse is ( )',
    options: [
      { key: 'A', text_zh: '5', text_en: '5' },
      { key: 'B', text_zh: '6', text_en: '6' },
      { key: 'C', text_zh: '7', text_en: '7' },
      { key: 'D', text_zh: '8', text_en: '8' },
    ],
    answer_standard: 'A',
    solutions_json: '利用勾股定理 $c = \\sqrt{3^2 + 4^2} = 5$',
  },
  {
    question_id: 'Q-2023-SH-002',
    primary_point_id: 'KP-023',
    difficulty_level: 2,
    question_type: 'single_choice',
    score_default: 2,
    stem_zh: '若直角三角形斜边为 13，一直角边为 5，则另一直角边长为（ ）',
    stem_en: 'In right triangle with hypotenuse 13 and leg 5, other leg is ( )',
    options: [
      { key: 'A', text_zh: '10', text_en: '10' },
      { key: 'B', text_zh: '11', text_en: '11' },
      { key: 'C', text_zh: '12', text_en: '12' },
      { key: 'D', text_zh: '13', text_en: '13' },
    ],
    answer_standard: 'C',
    solutions_json: '另一直角边为 $\\sqrt{13^2 - 5^2} = 12$',
  },
  {
    question_id: 'Q-2023-JS-003',
    primary_point_id: 'KP-023',
    difficulty_level: 3,
    question_type: 'single_choice',
    score_default: 2,
    stem_zh: '已知等腰三角形底边为 10，腰长为 13，则底边上的高为（ ）',
    stem_en: 'Isosceles triangle with base 10 and leg 13, altitude is ( )',
    options: [
      { key: 'A', text_zh: '12', text_en: '12' },
      { key: 'B', text_zh: '10', text_en: '10' },
      { key: 'C', text_zh: '8', text_en: '8' },
      { key: 'D', text_zh: '6', text_en: '6' },
    ],
    answer_standard: 'A',
    solutions_json: '作底边高线得直角三角形，由勾股定理得高为 12',
  },
];

describe('QuickPractice (Task 9.4 & 铁律 3 / 台账 H2 验证)', () => {
  it('【铁律 3 源码门神】QuickPractice 业务组件严禁 import katex 或使用 dangerouslySetInnerHTML / 裸 innerHTML', () => {
    const filePath = path.resolve(__dirname, '../QuickPractice.tsx');
    const code = fs.readFileSync(filePath, 'utf-8');

    // 1. 不得直接 import katex
    expect(code).not.toMatch(/^\s*import\s+.*['"]katex/m);
    // 2. 不得使用 dangerouslySetInnerHTML
    expect(code).not.toContain('dangerouslySetInnerHTML');
    // 3. 不得使用 .innerHTML
    expect(code).not.toContain('.innerHTML');
    // 4. 必须通过 MathRenderer 出口
    expect(code).toContain('MathRenderer');
  });

  it('单屏渲染 3 道单选题，题干与选项全部经由 MathRenderer 渲染出口', () => {
    const html = renderToString(
      React.createElement(QuickPractice, {
        pointId: 'KP-023',
        initialQuestions: mockQuestions,
        locale: 'zh-CN',
      })
    );

    // 1. 包含 3 题容器
    expect(html).toContain('data-testid="practice-item-1"');
    expect(html).toContain('data-testid="practice-item-2"');
    expect(html).toContain('data-testid="practice-item-3"');

    // 2. 包含 MathRenderer 节点
    expect(html).toContain('math-renderer');

    // 3. 包含难度标签与题号
    expect(html).toContain('难度 L1');
    expect(html).toContain('难度 L2');
    expect(html).toContain('难度 L3');

    // 4. 包含换一批按钮
    expect(html).toContain('data-testid="refresh-batch-btn"');
  });

  it('双语渲染支持 (zh-CN 与 en 自由切换)', () => {
    // 中文
    const htmlZh = renderToString(
      React.createElement(QuickPractice, {
        pointId: 'KP-023',
        initialQuestions: mockQuestions,
        locale: 'zh-CN',
      })
    );
    expect(htmlZh).toContain('单点快练');
    expect(htmlZh).toContain('换一批练习');

    // 英文
    const htmlEn = renderToString(
      React.createElement(QuickPractice, {
        pointId: 'KP-023',
        initialQuestions: mockQuestions,
        locale: 'en',
      })
    );
    expect(htmlEn).toContain('Quick Practice');
    expect(htmlEn).toContain('Refresh Batch');
  });

  it('【台账 H2 验证】重置得分 resetScores 绝不影响 presentedIds 抽题去重池', () => {
    const store = useSessionStore.getState();
    store.clearPresentedIds();
    store.resetScores();

    // 模拟完成练习得分
    store.addPresentedIds(['Q-2023-BJ-001', 'Q-2023-SH-002']);
    store.recordPracticeScore('Q-2023-BJ-001', 2);

    expect(store.hasPresentedId('Q-2023-BJ-001')).toBe(true);
    expect(store.hasPresentedId('Q-2023-SH-002')).toBe(true);

    // 重置分数
    store.resetScores();
    expect(Object.keys(store.practiceScores).length).toBe(0);

    // 核心断言：presentedIds 依然被保留（去重题池不丢）
    expect(store.hasPresentedId('Q-2023-BJ-001')).toBe(true);
    expect(store.hasPresentedId('Q-2023-SH-002')).toBe(true);

    // 仅在明确调用 clearPresentedIds 时才清空题池
    store.clearPresentedIds();
    expect(store.hasPresentedId('Q-2023-BJ-001')).toBe(false);
  });
});
