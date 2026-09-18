/**
 * 中考解答题分步踩分点契约与自核评分算法 (任务 7.5, 设计文档 §8.2, Property 9)
 *
 * 核心不变量：
 * 1. 得分严格等于被勾选步骤的 points 之和
 * 2. 恒满足 0 <= score <= maxScore (或 sum(points))
 */

export interface RubricStep {
  stepIndex: number; // 步骤序号: 1, 2, 3 ...
  descriptionZh: string; // 步骤中文踩分要求: "证明 △ACE ≌ △BDF，写出对应角相等的依据"
  descriptionEn?: string;
  points: number; // 本步骤分值 (正整数)
}

export interface SolutionQuestionRubric {
  questionId: string;
  maxScore: number; // 本题满分 (如 8, 10, 12)
  steps: RubricStep[];
}

/**
 * 计算步骤总分
 */
export function getTotalRubricPoints(steps: RubricStep[]): number {
  if (!steps || !Array.isArray(steps)) return 0;
  return steps.reduce((sum, s) => sum + (s.points > 0 ? s.points : 0), 0);
}

/**
 * 根据学生打钩的步骤集合计算最终得分 (Property 9)
 * @param steps 题目定义的踩分点列表
 * @param checkedStepIndices 学生打钩认领的步骤序号集合 (Set<number>)
 * @returns 累加得分，恒处于 [0, 步骤总分]
 */
export function calculateSolutionScore(
  steps: RubricStep[],
  checkedStepIndices: Set<number>
): number {
  if (!steps || !Array.isArray(steps) || !checkedStepIndices) {
    return 0;
  }

  return steps.reduce((sum, step) => {
    if (checkedStepIndices.has(step.stepIndex)) {
      return sum + (step.points > 0 ? step.points : 0);
    }
    return sum;
  }, 0);
}
