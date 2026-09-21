import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { drawQuestions, QuestionItem } from './drawQuestions';
import { testExamQuestions } from './__tests__/testExamQuestions';
import { PaperConfig } from './verifyPaperInventory';

describe('Feature: math-junior-frontend, Property 17 (母题与真题物理隔离抽题属性测试)', () => {
  // 模拟母题库的 119 个母题 ID 集合 (以 ME- 开头)
  const mockMasterExampleIds = new Set<string>([
    'ME-KP001', 'ME-KP005', 'ME-KP008', 'ME-KP009', 'ME-KP010', 'ME-KP012',
    'ME-KP015', 'ME-KP018', 'ME-KP020', 'ME-KP023', 'ME-KP024', 'ME-KP028',
    'ME-KP030', 'ME-KP032', 'ME-KP035', 'ME-KP040', 'ME-KP042', 'ME-KP045', 'ME-KP050',
    'ME-LINE-G4', 'ME-LINE-A4', 'ME-LINE-G1', 'ME-LINE-G2', 'ME-LINE-A1',
  ]);

  /**
   * Property 17: 母题与真题物理隔离 (≥100 次迭代)
   * 任意组卷抽出的 question_id 集合与 master_examples 的 example_id 集合交集恒为空。
   */
  it('Property 17: 抽出的 question_id 集合与 master_examples 的 example_id 集合交集恒为空 (fast-check 120 次迭代)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 6 }),
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 999999 }),
        (reqChoice, reqFill, reqSolution, seed) => {
          const config: PaperConfig = {
            selectedKpIds: [], // 全题库池
            choiceCount: reqChoice,
            fillCount: reqFill,
            solutionCount: reqSolution,
          };

          const paper = drawQuestions(testExamQuestions, config, { seed });

          const drawnIds = new Set<string>([
            ...paper.choiceQuestions.map((q) => q.question_id),
            ...paper.fillQuestions.map((q) => q.question_id),
            ...paper.solutionQuestions.map((q) => q.question_id),
          ]);

          // 核心不变量：交集恒为空！
          for (const drawnId of drawnIds) {
            expect(mockMasterExampleIds.has(drawnId)).toBe(false);
            // 题号格式规范断言：真题为 Q- 开头，母题为 ME- 开头
            expect(drawnId.startsWith('ME-')).toBe(false);
            expect(drawnId.startsWith('Q-')).toBe(true);
          }
        }
      ),
      { numRuns: 120 }
    );
  });

  it('17.2 抽题无重复不变量：抽出的试题 ID 严格唯一', () => {
    const config: PaperConfig = {
      selectedKpIds: [],
      choiceCount: 10,
      fillCount: 6,
      solutionCount: 8,
    };

    const paper = drawQuestions(testExamQuestions, config);
    const allQuestions: QuestionItem[] = [
      ...paper.choiceQuestions,
      ...paper.fillQuestions,
      ...paper.solutionQuestions,
    ];

    const uniqueIds = new Set(allQuestions.map((q) => q.question_id));
    expect(uniqueIds.size).toBe(allQuestions.length);
  });

  it('17.3 源码级铁律门禁：drawQuestions 引擎源码严禁触碰 master_examples 表', () => {
    const drawQuestionsFilePath = path.resolve(__dirname, 'drawQuestions.ts');
    const content = fs.readFileSync(drawQuestionsFilePath, 'utf-8');

    // 严禁 SQL 查询 master_examples
    expect(content).not.toMatch(/FROM\s+master_examples/i);
    expect(content).not.toMatch(/JOIN\s+master_examples/i);
    expect(content).not.toMatch(/INTO\s+master_examples/i);
  });
});
