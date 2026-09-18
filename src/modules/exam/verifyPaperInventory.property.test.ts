import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  verifyPaperInventoryFromCounts,
  verifyPaperInventoryFromPool,
  PaperConfig,
  MinimalQuestionItem,
} from './verifyPaperInventory';

describe('Feature: math-junior-frontend, Property 16 (组卷库存方案 A 预警拦截属性测试)', () => {
  /**
   * Property 16: 组卷库存预警拦截正确性 (≥100 次迭代)
   * 当且仅当任一题型的需求数超过其可用库存时，verifyPaperInventory() 返回 canGenerate === false。
   */
  it('Property 16: 当且仅当任一题型需求数 > 可用库存时，canGenerate 严格为 false (fast-check 120 次迭代)', () => {
    fc.assert(
      fc.property(
        // 可用库存量
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        // 组卷需求量
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (availChoice, availFill, availSolution, reqChoice, reqFill, reqSolution) => {
          const config: PaperConfig = {
            selectedKpIds: ['KP-001'],
            choiceCount: reqChoice,
            fillCount: reqFill,
            solutionCount: reqSolution,
          };

          const counts = {
            choice: availChoice,
            fill: availFill,
            solution: availSolution,
          };

          const result = verifyPaperInventoryFromCounts(counts, config);

          // 核心真值表判定：当且仅当所有题型库存充足时 canGenerate 为 true
          const expectedCanGenerate =
            availChoice >= reqChoice &&
            availFill >= reqFill &&
            availSolution >= reqSolution;

          expect(result.canGenerate).toBe(expectedCanGenerate);

          // 若不足，必须提供详细标红告警文案
          if (!expectedCanGenerate) {
            expect(result.shortageWarningZh).toBeDefined();
            expect(result.shortageWarningZh?.length).toBeGreaterThan(0);
            expect(result.shortageWarningZh).toContain('库存不足');
          } else {
            expect(result.shortageWarningZh).toBeUndefined();
          }

          // 总数一致性断言
          expect(result.totalAvailable).toBe(availChoice + availFill + availSolution);
          expect(result.totalRequired).toBe(reqChoice + reqFill + reqSolution);
        }
      ),
      { numRuns: 120 }
    );
  });

  it('16.2 基于随机题目池的考点过滤与库存拦截判定 (100 次迭代)', () => {
    const kps = ['KP-010', 'KP-020', 'KP-030', 'KP-040'];
    const types = ['single_choice', 'fill_blank', 'solution'];

    const questionArb: fc.Arbitrary<MinimalQuestionItem> = fc.record({
      primary_point_id: fc.constantFrom(...kps),
      question_type: fc.constantFrom(...types),
      difficulty_level: fc.integer({ min: 1, max: 5 }),
    });

    fc.assert(
      fc.property(
        fc.array(questionArb, { minLength: 0, maxLength: 80 }),
        fc.subarray(kps),
        fc.integer({ min: 1, max: 15 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 8 }),
        (pool, selectedKps, reqC, reqF, reqS) => {
          const config: PaperConfig = {
            selectedKpIds: selectedKps,
            choiceCount: reqC,
            fillCount: reqF,
            solutionCount: reqS,
          };

          const result = verifyPaperInventoryFromPool(pool, config);

          // 手动统计所选考点下的真实题量
          const selectedSet = new Set(selectedKps);
          let realC = 0;
          let realF = 0;
          let realS = 0;
          for (const q of pool) {
            if (selectedSet.size > 0 && !selectedSet.has(q.primary_point_id)) {
              continue;
            }
            if (q.question_type === 'single_choice') realC++;
            else if (q.question_type === 'fill_blank') realF++;
            else if (q.question_type === 'solution') realS++;
          }

          const expectedCanGenerate = realC >= reqC && realF >= reqF && realS >= reqS;
          expect(result.canGenerate).toBe(expectedCanGenerate);
          expect(result.availableChoice).toBe(realC);
          expect(result.availableFill).toBe(realF);
          expect(result.availableSolution).toBe(realS);
        }
      ),
      { numRuns: 100 }
    );
  });
});
