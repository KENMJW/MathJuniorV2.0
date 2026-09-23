/**
 * 试卷难度 L1~L5 波浪级联外向传导算法与题库难度映射 (任务 17.1, PRD §5.4)
 *
 * 核心不变量：
 * 1. 试卷难度数组长度恒为 5，元素分别对应 L1 ~ L5 的占比 (百分比)
 * 2. 各元素均为非负整数：0 <= W_i <= 100
 * 3. 数组所有元素之和严格等于 100：sum(W) === 100
 * 4. 题库难度 L1~L9 通过 2-2-2-2-1 折叠映射至试卷 L1~L5
 */

export type DifficultyWeights = [number, number, number, number, number];

/**
 * 默认中考全真模拟梯度配比 (L1 基础送分 25%, L2 常规应用 30%, L3 综合中档 25%, L4 思维探究 15%, L5 压轴冲刺 5%)
 */
export const DEFAULT_DIFFICULTY_WEIGHTS: DifficultyWeights = [25, 30, 25, 15, 5];

/**
 * 题库难度 (L1~L9) 与试卷难度 (L1~L5) 的 2-2-2-2-1 映射表
 */
export const EXAM_TO_DB_DIFFICULTY_MAP: Record<number, number[]> = {
  1: [1, 2], // 试卷 L1 -> 题库 L1, L2
  2: [3, 4], // 试卷 L2 -> 题库 L3, L4
  3: [5, 6], // 试卷 L3 -> 题库 L5, L6
  4: [7, 8], // 试卷 L4 -> 题库 L7, L8
  5: [9],    // 试卷 L5 -> 题库 L9
};

export const DB_TO_EXAM_DIFFICULTY_MAP: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
  9: 5,
};

/**
 * 将题库题目难度 level (1~9) 归一化为试卷难度 (1~5)
 */
export function mapDbDifficultyToExam(dbLevel: number): number {
  return DB_TO_EXAM_DIFFICULTY_MAP[dbLevel] || (dbLevel <= 2 ? 1 : dbLevel <= 4 ? 2 : dbLevel <= 6 ? 3 : dbLevel <= 8 ? 4 : 5);
}

/**
 * 波浪式外向级联传导算法 (Ripple Cascade Algorithm)
 *
 * @param current 当前 5 档比例数组 [L1, L2, L3, L4, L5]
 * @param targetIdx 用户主动拖动的档位索引 (0 ~ 4)
 * @param newVal 用户设定的目标百分比值
 * @returns 调整后的全新 5 档比例数组 (和严格等于 100)
 */
export function adjustDifficultyWeights(
  current: DifficultyWeights,
  targetIdx: number,
  newVal: number
): DifficultyWeights {
  const result: DifficultyWeights = [...current];
  const clampedTarget = Math.max(0, Math.min(100, Math.round(newVal)));
  const oldVal = result[targetIdx];
  const delta = clampedTarget - oldVal;

  if (delta === 0) {
    return result;
  }

  // 1. 设置目标档位新值
  result[targetIdx] = clampedTarget;

  // 2. 待吸收的负差额 (若 delta > 0 则 needed < 0 即需要扣减他人；若 delta < 0 则 needed > 0 需要补充他人)
  let needed = -delta;

  // 3. 按照与 targetIdx 的距离 d = 1, 2, 3, 4 逐层向外寻找可用槽位
  for (let d = 1; d <= 4 && needed !== 0; d++) {
    const leftIdx = targetIdx - d;
    const rightIdx = targetIdx + d;
    const hasLeft = leftIdx >= 0;
    const hasRight = rightIdx < 5;

    if (!hasLeft && !hasRight) continue;

    if (hasLeft && hasRight) {
      // 双侧均可吸收：优先均分
      const half1 = needed > 0 ? Math.ceil(needed / 2) : Math.floor(needed / 2);
      const half2 = needed - half1;

      // 尝试左侧吸收
      const lOld = result[leftIdx];
      const lNew = Math.max(0, Math.min(100, lOld + half1));
      const lAbsorbed = lNew - lOld;
      result[leftIdx] = lNew;
      needed -= lAbsorbed;

      // 尝试右侧吸收
      const rOld = result[rightIdx];
      const rNew = Math.max(0, Math.min(100, rOld + (half2 + (half1 - lAbsorbed))));
      const rAbsorbed = rNew - rOld;
      result[rightIdx] = rNew;
      needed -= rAbsorbed;
    } else if (hasLeft) {
      // 仅左侧
      const lOld = result[leftIdx];
      const lNew = Math.max(0, Math.min(100, lOld + needed));
      const lAbsorbed = lNew - lOld;
      result[leftIdx] = lNew;
      needed -= lAbsorbed;
    } else if (hasRight) {
      // 仅右侧
      const rOld = result[rightIdx];
      const rNew = Math.max(0, Math.min(100, rOld + needed));
      const rAbsorbed = rNew - rOld;
      result[rightIdx] = rNew;
      needed -= rAbsorbed;
    }
  }

  // 4. 若经过 4 层扩散仍有极微小残差 (例如极端压至 100% 或全为 0%)，遍历任意非 targetIdx 槽位强制补足
  if (needed !== 0) {
    for (let i = 0; i < 5 && needed !== 0; i++) {
      if (i === targetIdx) continue;
      const old = result[i];
      const next = Math.max(0, Math.min(100, old + needed));
      const absorbed = next - old;
      result[i] = next;
      needed -= absorbed;
    }
  }

  // 5. 终态严格尾数对齐校验：确保 sum === 100
  const currentSum = result[0] + result[1] + result[2] + result[3] + result[4];
  const finalDiff = 100 - currentSum;
  if (finalDiff !== 0) {
    // 找一个非 targetIdx 且加上 finalDiff 后仍在 [0, 100] 的槽位
    for (let i = 0; i < 5; i++) {
      if (i === targetIdx) continue;
      if (result[i] + finalDiff >= 0 && result[i] + finalDiff <= 100) {
        result[i] += finalDiff;
        break;
      }
    }
  }

  return result;
}
