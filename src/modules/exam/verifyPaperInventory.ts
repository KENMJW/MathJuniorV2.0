/**
 * 组卷库存方案 A 预警拦截算法 (任务 17.2, 设计文档 §7.4/§10.3, Property 16)
 *
 * 核心不变量：
 * 1. 考点子集闭包：题目的所有考点 (all_point_ids) 必须严格属于用户已勾选考点集合 (selectedKpIds)。
 * 2. 当且仅当任一题型 (单选 / 填空 / 解答) 的需求数超过其在勾选考点范围内的可用库存时，
 *    或者解答题总分低于出卷基本要求 (< 20 分) 时，
 *    canGenerate 严格等于 false，并在界面生成标红警示、禁用生成试卷按钮，杜绝生成残卷与非法卷。
 */

export interface PaperConfig {
  gradeLevel?: number;
  semester?: number;
  selectedKpIds: string[];
  choiceCount: number;
  fillCount: number;
  solutionCount: number;
  choiceScore?: number;
  fillScore?: number;
  fullScore?: number;
  difficultyDistribution?: [number, number, number, number, number]; // L1~L5 占比
  excludeQuestionIds?: string[]; // 排除已出试卷题目 (跨卷去重)
}

export interface InventoryCheckResult {
  canGenerate: boolean;
  availableChoice: number;
  availableFill: number;
  availableSolution: number;
  requiredChoice: number;
  requiredFill: number;
  requiredSolution: number;
  totalAvailable: number;
  totalRequired: number;
  shortageWarningZh?: string;
  shortageWarningEn?: string;
}

export interface MinimalQuestionItem {
  question_id?: string;
  primary_point_id: string;
  question_type: string;
  difficulty_level: number;
  all_point_ids?: string | null;
  grade_level?: number;
  semester?: number;
  max_grade?: number;
}

/**
 * 校验单道题目所依赖的全部考点是否为已勾选考点集合的子集 (Subset 绝对约束)
 */
export function isQuestionSubsetAllowed(
  q: MinimalQuestionItem,
  selectedKpSet: Set<string>
): boolean {
  if (selectedKpSet.size === 0) return true;

  let allPoints: string[] = [];
  try {
    if (q.all_point_ids) {
      allPoints =
        typeof q.all_point_ids === 'string'
          ? JSON.parse(q.all_point_ids)
          : q.all_point_ids;
    }
  } catch {}

  if (!Array.isArray(allPoints) || allPoints.length === 0) {
    allPoints = [q.primary_point_id];
  }

  // 每一个包含考点都必须被已选集合包含
  return allPoints.every((ptId) => selectedKpSet.has(ptId));
}

/**
 * 基于已知题型库存计数的纯同步校验 (Property 16 核心判据)
 */
export function verifyPaperInventoryFromCounts(
  counts: { choice: number; fill: number; solution: number },
  config: PaperConfig
): InventoryCheckResult {
  const reqChoice = Math.max(0, config.choiceCount || 0);
  const reqFill = Math.max(0, config.fillCount || 0);
  const reqSolution = Math.max(0, config.solutionCount || 0);
  const totalRequired = reqChoice + reqFill + reqSolution;

  const availChoice = Math.max(0, counts.choice || 0);
  const availFill = Math.max(0, counts.fill || 0);
  const availSolution = Math.max(0, counts.solution || 0);
  const totalAvailable = availChoice + availFill + availSolution;

  // 1. 若配置了 fullScore，检查解答题分值是否被挤占
  if (config.fullScore !== undefined) {
    const choiceScore = config.choiceScore || 3;
    const fillScore = config.fillScore || 3;
    const totalChoiceScore = reqChoice * choiceScore;
    const totalFillScore = reqFill * fillScore;
    const remainingSolutionScore = config.fullScore - (totalChoiceScore + totalFillScore);

    if (remainingSolutionScore < 20) {
      return {
        canGenerate: false,
        availableChoice: availChoice,
        availableFill: availFill,
        availableSolution: availSolution,
        requiredChoice: reqChoice,
        requiredFill: reqFill,
        requiredSolution: reqSolution,
        totalAvailable,
        totalRequired,
        shortageWarningZh: `解答题剩余总分仅 ${remainingSolutionScore} 分（低于中考出卷基本要求，至少需20分），请调小选择题或填空题数量/分值，为解答题预留合理空间。`,
        shortageWarningEn: `Remaining score for solution questions is only ${remainingSolutionScore} (minimum 20 required). Please reduce choice/fill count or score.`,
      };
    }
  }

  // 2. 关键判定：当且仅当任一题型需求超过库存时拦截
  const isChoiceShort = availChoice < reqChoice;
  const isFillShort = availFill < reqFill;
  const isSolutionShort = availSolution < reqSolution;
  const isShort = isChoiceShort || isFillShort || isSolutionShort;

  if (isShort) {
    const shortageParts: string[] = [];
    if (isChoiceShort) {
      shortageParts.push(`选择题需 ${reqChoice} 题 (仅余 ${availChoice} 题)`);
    }
    if (isFillShort) {
      shortageParts.push(`填空题需 ${reqFill} 题 (仅余 ${availFill} 题)`);
    }
    if (isSolutionShort) {
      shortageParts.push(`解答题需 ${reqSolution} 题 (仅余 ${availSolution} 题)`);
    }

    const warningZh = `当前勾选考点试题库存不足！${shortageParts.join('，')}。请增加考点勾选或调低所需题数。`;
    const warningEn = `Insufficient question inventory! Required: Choice(${reqChoice}/${availChoice}), Fill(${reqFill}/${availFill}), Solution(${reqSolution}/${availSolution}).`;

    return {
      canGenerate: false,
      availableChoice: availChoice,
      availableFill: availFill,
      availableSolution: availSolution,
      requiredChoice: reqChoice,
      requiredFill: reqFill,
      requiredSolution: reqSolution,
      totalAvailable,
      totalRequired,
      shortageWarningZh: warningZh,
      shortageWarningEn: warningEn,
    };
  }

  return {
    canGenerate: true,
    availableChoice: availChoice,
    availableFill: availFill,
    availableSolution: availSolution,
    requiredChoice: reqChoice,
    requiredFill: reqFill,
    requiredSolution: reqSolution,
    totalAvailable,
    totalRequired,
  };
}

/**
 * 从内存真题候选池中统计并校验库存 (执行子集闭包过滤)
 */
export function verifyPaperInventoryFromPool(
  pool: MinimalQuestionItem[],
  config: PaperConfig
): InventoryCheckResult {
  const selectedKpSet = new Set(config.selectedKpIds || []);

  let availChoice = 0;
  let availFill = 0;
  let availSolution = 0;

  for (const q of pool) {
    if (!isQuestionSubsetAllowed(q, selectedKpSet)) {
      continue;
    }

    if (q.question_type === 'single_choice') {
      availChoice++;
    } else if (q.question_type === 'fill_blank') {
      availFill++;
    } else if (q.question_type === 'solution') {
      availSolution++;
    }
  }

  return verifyPaperInventoryFromCounts(
    { choice: availChoice, fill: availFill, solution: availSolution },
    config
  );
}

/**
 * 针对 SQLite 数据库连接的参数化方案 A 校验
 */
export async function verifyPaperInventory(
  db: any,
  config: PaperConfig
): Promise<InventoryCheckResult> {
  if (!config.selectedKpIds || config.selectedKpIds.length === 0) {
    return verifyPaperInventoryFromCounts({ choice: 0, fill: 0, solution: 0 }, config);
  }

  // 优先直接通过内存候选池统计确保子集闭包完全生效
  if (db && typeof db.query === 'function') {
    try {
      const rows = await db.query(
        'questions',
        'SELECT question_id, primary_point_id, question_type, difficulty_level, all_point_ids FROM questions'
      );
      if (Array.isArray(rows)) {
        return verifyPaperInventoryFromPool(rows, config);
      }
    } catch (e) {
      console.warn('[verifyPaperInventory] Failed to query questions:', e);
    }
  }

  // 参数化占位防注入兜底
  const placeholders = config.selectedKpIds.map(() => '?').join(',');
  const query = `
    SELECT question_type, COUNT(*) as count 
    FROM questions 
    WHERE primary_point_id IN (${placeholders})
    GROUP BY question_type
  `;

  let availableChoice = 0;
  let availableFill = 0;
  let availableSolution = 0;

  try {
    const res = await db.exec(query, config.selectedKpIds);
    if (res && res.length > 0 && res[0].values) {
      for (const row of res[0].values) {
        const qType = row[0];
        const count = Number(row[1]) || 0;
        if (qType === 'single_choice') availableChoice = count;
        else if (qType === 'fill_blank') availableFill = count;
        else if (qType === 'solution') availableSolution = count;
      }
    }
  } catch (err) {
    console.warn('[verifyPaperInventory] DB query failed, fallback to 0 inventory:', err);
  }

  return verifyPaperInventoryFromCounts(
    { choice: availableChoice, fill: availableFill, solution: availableSolution },
    config
  );
}
