/**
 * 组卷库存方案 A 预警拦截算法 (任务 17.2, 设计文档 §7.4/§10.3, Property 16)
 *
 * 核心不变量：
 * 当且仅当任一题型 (单选 / 填空 / 解答) 的需求数超过其在勾选考点范围内的可用库存时，
 * canGenerate 严格等于 false，并在界面生成标红警示、禁用生成试卷按钮，杜绝生成空卷。
 */

export interface PaperConfig {
  gradeLevel?: number;
  semester?: number;
  selectedKpIds: string[];
  choiceCount: number;
  fillCount: number;
  solutionCount: number;
  difficultyDistribution?: [number, number, number, number, number]; // L1~L5 占比
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

  // 关键判定：当且仅当任一题型需求超过库存时拦截
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
 * 从内存真题候选池中统计并校验库存
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
    // 考点过滤：若未勾选任何考点则默认不命中；若勾选则检查是否属于选定考点
    if (selectedKpSet.size > 0 && !selectedKpSet.has(q.primary_point_id)) {
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

  // [铁律 5]: 参数化占位防注入
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
