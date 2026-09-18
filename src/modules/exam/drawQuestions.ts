/**
 * 组卷抽题引擎与母题物理隔离实现 (任务 17.3, 设计文档 §7.4, 铁律 9, Property 17)
 *
 * 核心安全与业务不变量：
 * 1. [铁律 9]: 组卷抽题只查 questions 表，绝对不触碰 master_examples 表。
 * 2. 抽出的 question_id 集合与 master_examples 的 example_id 集合交集恒为空 (Property 17)。
 * 3. 抽题过程支持考点过滤、题型分类分配与难度梯度打散，保证无重复题目。
 */

import { PaperConfig } from './verifyPaperInventory';

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
  const candidatePool = pool.filter((q) => {
    // 基础防御：排除任何带有母题特征的前缀
    if (q.question_id.startsWith('ME-') || q.question_id.startsWith('master-')) {
      return false;
    }
    if (selectedKpSet.size > 0 && !selectedKpSet.has(q.primary_point_id)) {
      return false;
    }
    return true;
  });

  const choicePool = candidatePool.filter((q) => q.question_type === 'single_choice');
  const fillPool = candidatePool.filter((q) => q.question_type === 'fill_blank');
  const solutionPool = candidatePool.filter((q) => q.question_type === 'solution');

  // 2. 打散并按难度由浅入深排序保证中考卷良好做题梯度
  const shuffledChoice = shuffleArray(choicePool, meta?.seed);
  const shuffledFill = shuffleArray(fillPool, meta?.seed ? meta.seed + 1 : undefined);
  const shuffledSolution = shuffleArray(solutionPool, meta?.seed ? meta.seed + 2 : undefined);

  // 排序：难度递增
  shuffledChoice.sort((a, b) => a.difficulty_level - b.difficulty_level);
  shuffledFill.sort((a, b) => a.difficulty_level - b.difficulty_level);
  shuffledSolution.sort((a, b) => a.difficulty_level - b.difficulty_level);

  // 3. 截取所需题量
  const choiceQuestions = shuffledChoice.slice(0, config.choiceCount || 0);
  const fillQuestions = shuffledFill.slice(0, config.fillCount || 0);
  const solutionQuestions = shuffledSolution.slice(0, config.solutionCount || 0);

  const totalQuestions =
    choiceQuestions.length + fillQuestions.length + solutionQuestions.length;

  const paperId = `PAPER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    paperId,
    titleZh: meta?.titleZh || '中考全真模拟综合测试卷',
    titleEn: meta?.titleEn || 'Comprehensive Entrance Mock Examination',
    fullScore: meta?.fullScore || 120,
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
      image_paths_json
    FROM questions
    ${hasKpFilter ? `WHERE primary_point_id IN (${placeholders})` : ''}
    ORDER BY difficulty_level ASC, RANDOM()
  `;

  const params = hasKpFilter ? config.selectedKpIds : [];
  const rows: QuestionItem[] = [];

  try {
    if (db && typeof db.query === 'function') {
      // WASM dbClient 单例分包查询
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
          });
        }
      }
    } else if (db && typeof db.exec === 'function') {
      // 兼容底层原始 sql.js 实例
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
          });
        }
      }
    }
  } catch (err) {
    console.warn('[drawQuestionsFromDb] Failed to execute query:', err);
  }

  return drawQuestions(rows, config, meta);
}
