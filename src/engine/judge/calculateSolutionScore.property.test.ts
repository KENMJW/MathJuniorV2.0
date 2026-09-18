import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateSolutionScore,
  getTotalRubricPoints,
  RubricStep,
} from './calculateSolutionScore';

describe('Feature: math-junior-frontend, Property 9 (解答题自核得分守恒属性测试)', () => {
  const stepArb: fc.Arbitrary<RubricStep> = fc.record({
    stepIndex: fc.integer({ min: 1, max: 20 }),
    descriptionZh: fc.string({ minLength: 2, maxLength: 30 }),
    points: fc.integer({ min: 1, max: 10 }),
  });

  const rubricStepsArb = fc
    .array(stepArb, { minLength: 1, maxLength: 8 })
    .map((steps) => {
      // 保证 stepIndex 唯一递增
      return steps.map((s, idx) => ({
        ...s,
        stepIndex: idx + 1,
      }));
    });

  it('Property 9: 解答题自核得分守恒 (fast-check ≥100 次迭代)', () => {
    fc.assert(
      fc.property(
        rubricStepsArb,
        fc.array(fc.integer({ min: 1, max: 8 })),
        (steps, checkedArray) => {
          const checkedSet = new Set(checkedArray);
          const score = calculateSolutionScore(steps, checkedSet);
          const totalPoints = getTotalRubricPoints(steps);

          // 1. 得分必须严格等于被打钩步骤分值之和
          let expectedScore = 0;
          for (const step of steps) {
            if (checkedSet.has(step.stepIndex)) {
              expectedScore += step.points;
            }
          }
          expect(score).toBe(expectedScore);

          // 2. 核心有界性守恒：0 <= score <= totalPoints
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(totalPoints);
        }
      ),
      { numRuns: 120 }
    );
  });

  it('9.2 边界与极端场景验证', () => {
    const steps: RubricStep[] = [
      { stepIndex: 1, descriptionZh: '求出二次函数解析式', points: 3 },
      { stepIndex: 2, descriptionZh: '证明相似三角形对应边成比例', points: 4 },
      { stepIndex: 3, descriptionZh: '分类讨论求出动点坐标', points: 5 },
    ];
    const total = 12;

    // 空勾选 -> 0 分
    expect(calculateSolutionScore(steps, new Set())).toBe(0);

    // 全选 -> 满分
    expect(calculateSolutionScore(steps, new Set([1, 2, 3]))).toBe(total);

    // 勾选不存在的步骤序号 -> 忽略，不影响有效步骤
    expect(calculateSolutionScore(steps, new Set([1, 999]))).toBe(3);

    // 异常与空输入兜底保护
    expect(calculateSolutionScore([], new Set([1]))).toBe(0);
    expect(calculateSolutionScore(null as any, new Set([1]))).toBe(0);
    expect(calculateSolutionScore(steps, null as any)).toBe(0);
  });
});
