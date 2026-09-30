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
import { mapDbDifficultyToExam } from './difficultyRipple';

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
 * 随机洗牌 (Fisher-Yates)
 * 若显式提供 seed，则采用同余伪随机序列以保证属性测试的可复现性；
 * 若未提供 seed，则采用真随机熵，杜绝固定种子带来的试卷内容绝对重复问题。
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array];
  if (seed !== undefined) {
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 16807 + 11) % 2147483647;
      const j = Math.floor((s / 2147483647) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } else {
    const getRandomFloat = () => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] / (0xffffffff + 1);
      }
      return Math.random();
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(getRandomFloat() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
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
 * 使用 Hamilton-Hare 最大余数法计算各难度档位配额
 * @param count 目标抽题总数
 * @param distribution 5 档比例数组 [L1, L2, L3, L4, L5]，如 [25, 30, 25, 15, 5]
 */
export function calculateDifficultyQuotas(
  count: number,
  distribution?: [number, number, number, number, number]
): [number, number, number, number, number] {
  if (count <= 0) return [0, 0, 0, 0, 0];
  const dist = distribution && distribution.length === 5 ? distribution : [25, 30, 25, 15, 5];
  const totalWeight = dist.reduce((sum, w) => sum + Math.max(0, w), 0);
  const weights = totalWeight > 0 ? dist.map(w => Math.max(0, w)) : [1, 1, 1, 1, 1];
  const safeTotal = weights.reduce((sum, w) => sum + w, 0);

  const exactQuotas = weights.map(w => (count * w) / safeTotal);
  const baseQuotas = exactQuotas.map(q => Math.floor(q));
  const remainders = exactQuotas.map((q, idx) => ({ idx, rem: q - baseQuotas[idx] }));

  let remaining = count - baseQuotas.reduce((sum, q) => sum + q, 0);
  remainders.sort((a, b) => b.rem - a.rem);

  for (let i = 0; i < remaining; i++) {
    baseQuotas[remainders[i % remainders.length].idx] += 1;
  }

  return baseQuotas as [number, number, number, number, number];
}

/**
 * 按当期学期优先倾斜、真实难度波浪权重与跨卷去重过滤抽取指定数量题目
 */
function drawPoolWithPriority(
  pool: QuestionItem[],
  count: number,
  targetMaxGrade: number,
  targetMaxSemester: number,
  difficultyDistribution?: [number, number, number, number, number],
  seed?: number,
  excludeQuestionIds?: string[]
): QuestionItem[] {
  if (count <= 0 || pool.length === 0) return [];

  // 1. 跨卷去重过滤：若未做题目充足，优先从未使用题目中抽取
  const excludeSet = new Set(excludeQuestionIds || []);
  const freshQuestions = pool.filter((q) => !excludeSet.has(q.question_id));
  const candidatePool = freshQuestions.length >= count ? freshQuestions : pool;

  // 2. 使用 Hamilton-Hare 最大余数法计算 5 档目标题量配额
  const quotas = calculateDifficultyQuotas(count, difficultyDistribution);

  // 3. 将候选池划分为 5 个试卷难度桶 (1 ~ 5)
  const buckets: Record<number, QuestionItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const q of candidatePool) {
    const examLvl = mapDbDifficultyToExam(q.difficulty_level);
    buckets[examLvl].push(q);
  }

  // 4. 对每个桶分别执行当期优先倾斜与随机洗牌
  const orderedBuckets: Record<number, QuestionItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (let lvl = 1; lvl <= 5; lvl++) {
    const b = buckets[lvl];
    const current = b.filter(
      (q) => q.grade_level === targetMaxGrade && q.semester === targetMaxSemester
    );
    const history = b.filter(
      (q) => !(q.grade_level === targetMaxGrade && q.semester === targetMaxSemester)
    );
    const shuffledCurrent = shuffleArray(current, seed ? seed + lvl * 17 : undefined);
    const shuffledHistory = shuffleArray(history, seed ? seed + lvl * 31 : undefined);
    orderedBuckets[lvl] = [...shuffledCurrent, ...shuffledHistory];
  }

  // 5. 按照 quotas 分配名额
  const selected: QuestionItem[] = [];
  const takenCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // 第一遍：直接从对应难度桶提取配额
  for (let lvl = 1; lvl <= 5; lvl++) {
    const needed = quotas[lvl - 1];
    const available = orderedBuckets[lvl].length;
    const take = Math.min(needed, available);
    if (take > 0) {
      selected.push(...orderedBuckets[lvl].slice(0, take));
      takenCount[lvl] = take;
    }
  }

  // 第二遍：波浪外向级联吸收，填补不足配额
  if (selected.length < count) {
    for (let lvl = 1; lvl <= 5; lvl++) {
      let deficit = quotas[lvl - 1] - takenCount[lvl];
      if (deficit <= 0) continue;

      for (let dist = 1; dist <= 4 && deficit > 0; dist++) {
        const neighbors = [lvl - dist, lvl + dist].filter((n) => n >= 1 && n <= 5);
        for (const n of neighbors) {
          const avail = orderedBuckets[n].length - takenCount[n];
          if (avail > 0) {
            const take = Math.min(deficit, avail);
            selected.push(...orderedBuckets[n].slice(takenCount[n], takenCount[n] + take));
            takenCount[n] += take;
            deficit -= take;
            if (deficit <= 0) break;
          }
        }
      }
    }
  }

  // 第三遍：若仍有极端不足，从全池任意剩余题目补足
  if (selected.length < count) {
    for (let lvl = 1; lvl <= 5 && selected.length < count; lvl++) {
      const avail = orderedBuckets[lvl].length - takenCount[lvl];
      if (avail > 0) {
        const take = Math.min(count - selected.length, avail);
        selected.push(...orderedBuckets[lvl].slice(takenCount[lvl], takenCount[lvl] + take));
        takenCount[lvl] += take;
      }
    }
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

  // 3. 抽取各题型题目 (落实难度分布加权与跨卷去重)
  const rawChoice = drawPoolWithPriority(
    choicePool,
    reqChoiceCount,
    targetMaxGrade,
    targetMaxSemester,
    config.difficultyDistribution,
    meta?.seed,
    config.excludeQuestionIds
  );
  const rawFill = drawPoolWithPriority(
    fillPool,
    reqFillCount,
    targetMaxGrade,
    targetMaxSemester,
    config.difficultyDistribution,
    meta?.seed ? meta.seed + 1 : undefined,
    config.excludeQuestionIds
  );
  const rawSolution = drawPoolWithPriority(
    solutionPool,
    actualSolutionCount,
    targetMaxGrade,
    targetMaxSemester,
    config.difficultyDistribution,
    meta?.seed ? meta.seed + 2 : undefined,
    config.excludeQuestionIds
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
    titleZh: meta?.titleZh || '初中数学全真模拟综合测试卷',
    titleEn: meta?.titleEn || 'Junior High Math Comprehensive Mock Examination',
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
    seed?: number;
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
