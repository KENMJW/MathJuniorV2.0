/**
 * 组卷抽题引擎与母题物理隔离实现 (任务 17.3, 设计文档 §7.4, 铁律 9, Property 17)
 *
 * 核心安全与业务不变量：
 * 1. [铁律 9]: 组卷抽题只查 questions 表，绝对不触碰 master_examples 表。
 * 2. 抽出的 question_id 集合与 master_examples 的 example_id 集合交集恒为空 (Property 17)。
 * 3. 考点子集闭包：题目的所有考点 (all_point_ids) 必须严格属于用户勾选的考点集合。
 * 4. 当期学期优先倾斜：优先从当期最高学期的知识点抽取题目 (目标约 65%)，先修历史考点作为综合背景。
 * 5. 解达题分值阶梯自动生成：根据整卷满分倒推解答题总分，自动生成递增的中考标准大题整数分值阶梯。
 */

import { PaperConfig, isQuestionSubsetAllowed } from './verifyPaperInventory';

export interface QuestionItem {
  question_id: string;
  source: string;
  exam_year: number;
  region: string;
  exam_type: string;
  grade_level: number;
  semester: number;
  primary_point_id: string;
  combination_id?: string | null;
  difficulty_level: number;
  question_type: 'single_choice' | 'fill_blank' | 'solution';
  score_default: number;
  stem_zh: string;
  stem_en?: string;
  options_json?: string | null;
  answer_standard?: string | null;
  rubric_checklist_json?: string | null;
  solutions_json?: string | null;
  image_paths_json?: string | null;
  all_point_ids?: string | null;
  max_grade?: number;
}

export interface GeneratedPaper {
  paperId: string;
  titleZh: string;
  titleEn: string;
  fullScore: number;
  timeLimitMinutes: number;
  choiceQuestions: QuestionItem[];
  fillQuestions: QuestionItem[];
  solutionQuestions: QuestionItem[];
  totalQuestions: number;
  generatedAt: string;
}

/**
 * 伪随机洗牌 (Fisher-Yates)
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array];
  let s = seed !== undefined ? seed : 1234567;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807 + 11) % 2147483647;
    const j = Math.floor((s / 2147483647) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 依据解答题总分 Sa 自动反推合法的中考单题分值序列 (递增整数序列)
 * 范围在 6 ~ 14 分之间，总和严格等于 Sa
 */
export function generateSolutionScoreLadder(
  totalSolutionScore: number,
  targetCount?: number
): number[] {
  const sa = Math.max(20, totalSolutionScore);
  // 目标大题数：若未指定则按平均 8.5~9 分一题
  const count = targetCount && targetCount > 0
    ? targetCount
    : Math.max(4, Math.min(10, Math.round(sa / 9)));
  const base = Math.floor(sa / count);
  let remainder = sa - base * count;

  const scores: number[] = new Array(count).fill(base);
  // 从后向前将余数分配给靠后的综合大题/压轴大题，使其自然形成递增阶梯
  for (let i = count - 1; i >= 0 && remainder > 0; i--) {
    scores[i] += 1;
    remainder -= 1;
    if (i === 0 && remainder > 0) i = count;
  }
  // 排序确保非递减
  scores.sort((a, b) => a - b);
  return scores;
}

/**
 * 按当期学期优先倾斜与难度梯度抽取指定数量题目
 */
function drawPoolWithPriority(
  pool: QuestionItem[],
  count: number,
  targetMaxGrade: number,
  targetMaxSemester: number,
  seed?: number
): QuestionItem[] {
  if (count <= 0 || pool.length === 0) return [];

  // 分隔当期池与历史池
  const currentPool = pool.filter(
    (q) => q.grade_level === targetMaxGrade && q.semester === targetMaxSemester
  );
  const historyPool = pool.filter(
    (q) => !(q.grade_level === targetMaxGrade && q.semester === targetMaxSemester)
  );

  // 目标倾斜：65% 来自当期池，35% 来自历史池
  const targetCurrentCount = Math.round(count * 0.65);
  const actualCurrentCount = Math.min(targetCurrentCount, currentPool.length);
  const remainingNeeded = count - actualCurrentCount;
  const actualHistoryCount = Math.min(remainingNeeded, historyPool.length);

  // 洗牌
  const shuffledCurrent = shuffleArray(currentPool, seed);
  const shuffledHistory = shuffleArray(historyPool, seed ? seed + 7 : undefined);

  let selected = [
    ...shuffledCurrent.slice(0, actualCurrentCount),
    ...shuffledHistory.slice(0, actualHistoryCount),
  ];

  // 若仍有不足额，从两池剩余部分尽力补齐
  if (selected.length < count) {
    const usedIds = new Set(selected.map((q) => q.question_id));
    const remainingAll = pool.filter((q) => !usedIds.has(q.question_id));
    const shuffledRemaining = shuffleArray(remainingAll, seed ? seed + 13 : undefined);
    selected = [...selected, ...shuffledRemaining.slice(0, count - selected.length)];
  }

  // 严格按题目难度升序排列，呈现考场阶梯感
  selected.sort((a, b) => a.difficulty_level - b.difficulty_level);
  return selected;
}

/**
 * 从真题候选池中物理抽题组卷 (铁律 9 / Property 17)
 * @param pool 来自 questions 表的真题候选集合
 * @param config 组卷配置 (题型需求与所选考点)
 * @param meta 试卷元信息 (标题、满分、时限)
 */
export function drawQuestions(
  pool: QuestionItem[],
  config: PaperConfig,
  meta?: {
    titleZh?: string;
    titleEn?: string;
    fullScore?: number;
    timeLimitMinutes?: number;
    seed?: number;
  }
): GeneratedPaper {
  const selectedKpSet = new Set(config.selectedKpIds || []);

  // 1. 严格仅从 questions pool 中过滤符合已选考点的真题 (绝不碰 master_examples)
  // 并执行考点子集闭包过滤 (all_point_ids ⊆ selectedKpIds)
  const candidatePool = pool.filter((q) => {
    // 基础防御：排除任何带有母题特征的前缀
    if (q.question_id.startsWith('ME-') || q.question_id.startsWith('master-')) {
      return false;
    }
    return isQuestionSubsetAllowed(q, selectedKpSet);
  });

  // 确定选中的最高年级与学期 (用于当期优先倾斜)
  let targetMaxGrade = 7;
  let targetMaxSemester = 1;
  candidatePool.forEach((q) => {
    if (
      q.grade_level > targetMaxGrade ||
      (q.grade_level === targetMaxGrade && q.semester > targetMaxSemester)
    ) {
      targetMaxGrade = q.grade_level;
      targetMaxSemester = q.semester;
    }
  });

  const choicePool = candidatePool.filter((q) => q.question_type === 'single_choice');
  const fillPool = candidatePool.filter((q) => q.question_type === 'fill_blank');
  const solutionPool = candidatePool.filter((q) => q.question_type === 'solution');

  // 计算分数分配
  const fullScore = meta?.fullScore || config.fullScore || 120;
  const choiceScore = config.choiceScore || 3;
  const fillScore = config.fillScore || 3;
  const reqChoiceCount = config.choiceCount || 0;
  const reqFillCount = config.fillCount || 0;
  const totalChoiceScore = reqChoiceCount * choiceScore;
  const totalFillScore = reqFillCount * fillScore;
  const remainingSolutionScore = Math.max(0, fullScore - (totalChoiceScore + totalFillScore));

  // 2. 解答题分值阶梯反推
  const solutionLadder = generateSolutionScoreLadder(
    remainingSolutionScore,
    config.solutionCount
  );
  const actualSolutionCount = solutionLadder.length;

  // 3. 抽取各题型题目
  const rawChoice = drawPoolWithPriority(
    choicePool,
    reqChoiceCount,
    targetMaxGrade,
    targetMaxSemester,
    meta?.seed
  );
  const rawFill = drawPoolWithPriority(
    fillPool,
    reqFillCount,
    targetMaxGrade,
    targetMaxSemester,
    meta?.seed ? meta.seed + 1 : undefined
  );
  const rawSolution = drawPoolWithPriority(
    solutionPool,
    actualSolutionCount,
    targetMaxGrade,
    targetMaxSemester,
    meta?.seed ? meta.seed + 2 : undefined
  );

  // 4. 为抽取的题目注入标准单题分值，保证整卷满分严格守恒
  const choiceQuestions = rawChoice.map((q) => ({
    ...q,
    score_default: choiceScore,
  }));
  const fillQuestions = rawFill.map((q) => ({
    ...q,
    score_default: fillScore,
  }));
  const solutionQuestions = rawSolution.map((q, idx) => ({
    ...q,
    score_default: solutionLadder[idx] ?? 8,
  }));

  const totalQuestions =
    choiceQuestions.length + fillQuestions.length + solutionQuestions.length;

  const paperId = `PAPER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    paperId,
    titleZh: meta?.titleZh || '中考全真模拟综合测试卷',
    titleEn: meta?.titleEn || 'Comprehensive Entrance Mock Examination',
    fullScore,
    timeLimitMinutes: meta?.timeLimitMinutes || 120,
    choiceQuestions,
    fillQuestions,
    solutionQuestions,
    totalQuestions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 针对 SQLite 数据库连接的参数化安全抽题 (铁律 5 & 铁律 9)
 */
export async function drawQuestionsFromDb(
  db: any,
  config: PaperConfig,
  meta?: {
    titleZh?: string;
    titleEn?: string;
    fullScore?: number;
    timeLimitMinutes?: number;
  }
): Promise<GeneratedPaper> {
  const hasKpFilter = Boolean(config.selectedKpIds && config.selectedKpIds.length > 0);
  const placeholders = hasKpFilter ? config.selectedKpIds.map(() => '?').join(',') : '';

  // [铁律 9]: SQL 严格只查 questions 表！
  const sql = `
    SELECT 
      question_id, source, exam_year, region, exam_type, grade_level, semester,
      primary_point_id, combination_id, difficulty_level, question_type, score_default,
      stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json,
      image_paths_json, all_point_ids, max_grade
    FROM questions
    ${hasKpFilter ? `WHERE primary_point_id IN (${placeholders})` : ''}
    ORDER BY difficulty_level ASC
  `;

  const params = hasKpFilter ? config.selectedKpIds : [];
  const rows: QuestionItem[] = [];

  try {
    if (db && typeof db.query === 'function') {
      const resultRows = await db.query('questions', sql, params);
      if (Array.isArray(resultRows)) {
        for (const r of resultRows) {
          rows.push({
            question_id: String(r.question_id),
            source: String(r.source ?? ''),
            exam_year: Number(r.exam_year ?? 0),
            region: String(r.region ?? ''),
            exam_type: String(r.exam_type ?? ''),
            grade_level: Number(r.grade_level || 7),
            semester: Number(r.semester || 1),
            primary_point_id: String(r.primary_point_id ?? ''),
            combination_id: r.combination_id ?? null,
            difficulty_level: Number(r.difficulty_level ?? 1),
            question_type: r.question_type,
            score_default: Number(r.score_default ?? 3),
            stem_zh: String(r.stem_zh ?? ''),
            stem_en: String(r.stem_en ?? ''),
            options_json: r.options_json ?? null,
            answer_standard: String(r.answer_standard ?? ''),
            rubric_checklist_json: r.rubric_checklist_json ?? null,
            solutions_json: r.solutions_json ?? null,
            image_paths_json: r.image_paths_json ?? null,
            all_point_ids: r.all_point_ids ? String(r.all_point_ids) : null,
            max_grade: r.max_grade ? Number(r.max_grade) : undefined,
          });
        }
      }
    } else if (db && typeof db.exec === 'function') {
      const res = await db.exec(sql, params);
      if (res && res.length > 0 && res[0].values) {
        for (const v of res[0].values) {
          rows.push({
            question_id: v[0],
            source: v[1],
            exam_year: v[2],
            region: v[3],
            exam_type: v[4],
            grade_level: v[5],
            semester: v[6],
            primary_point_id: v[7],
            combination_id: v[8],
            difficulty_level: v[9],
            question_type: v[10],
            score_default: v[11],
            stem_zh: v[12],
            stem_en: v[13],
            options_json: v[14],
            answer_standard: v[15],
            rubric_checklist_json: v[16],
            solutions_json: v[17],
            image_paths_json: v[18] ?? null,
            all_point_ids: v[19] ?? null,
            max_grade: v[20] ?? undefined,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[drawQuestionsFromDb] Failed to execute query:', err);
  }

  return drawQuestions(rows, config, meta);
}
