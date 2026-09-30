/**
 * 单点快练抽样去重状态机 (任务 9.4, 设计文档 §7.1.1, 属性 Property 13)
 *
 * 核心规范：
 * 1. 业务锁：锁 L1~L3 难度、question_type='single_choice' (与组合基数无关)
 * 2. 状态机逻辑：
 *    - 检查池：未做题 >= 3 时，NOT IN presented_ids 抽取 3 题，展示并更新 presented_ids
 *    - 池耗尽：未做题 < 3 时，触发池耗尽，清空 presented_ids (clearPresentedIds) 并重新从全池抽 3 题
 * 3. 闭环台账 H2 验收确认点：
 *    - "换一批练习" 在池耗尽或清空题池时，严格调用 clearPresentedIds()
 *    - resetScores() 仅用于重置得分统计，保留 presentedIds；两者语义严格正交隔离！
 */

import { dbClient, type DbClient } from '../../engine/db/dbClient';

export interface PracticeOption {
  key: string;
  text_zh: string;
  text_en: string;
  img?: string;
}

export interface QuickPracticeQuestion {
  question_id: string;
  primary_point_id: string;
  difficulty_level: number;
  question_type: 'single_choice';
  score_default: number;
  stem_zh: string;
  stem_en: string;
  options: PracticeOption[];
  answer_standard: string;
  solutions_json?: string | null;
  image_paths_json?: string | null;
  _tier?: 'local' | 'advance' | 'expanded';
  _tierLabel?: string;
}

export interface DrawResult {
  drawnQuestions: QuickPracticeQuestion[];
  nextPresentedIds: Set<string>;
  poolExhausted: boolean;
}

/**
 * 安全解析 options_json（兼容 map 格式与 array 格式）
 */
export function parseOptionsJson(raw: string | null | undefined): PracticeOption[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => ({
        key: item.key || String.fromCharCode(65 + idx),
        text_zh: item.text_zh || item.zh || item.text || '',
        text_en: item.text_en || item.en || item.text || '',
        img: item.img,
      }));
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([key, val]: [string, any]) => ({
        key,
        text_zh: typeof val === 'object' ? val.zh || val.text_zh || '' : String(val),
        text_en: typeof val === 'object' ? val.en || val.text_en || '' : String(val),
        img: typeof val === 'object' ? val.img : undefined,
      }));
    }
  } catch {
    return [];
  }
  return [];
}

/**
 * 纯函数：根据考点及业务锁（L1~L3、single_choice）过滤可用题池
 */
export function filterEligibleQuestions(
  questions: QuickPracticeQuestion[],
  pointId: string
): QuickPracticeQuestion[] {
  return questions.filter(
    (q) =>
      q.primary_point_id === pointId &&
      q.difficulty_level >= 1 &&
      q.difficulty_level <= 3 &&
      q.question_type === 'single_choice'
  );
}

export function drawFromPool(
  pool: QuickPracticeQuestion[],
  presentedIds: Set<string>,
  currentBatchIds: string[] = [],
  randomPicker: (arr: QuickPracticeQuestion[], count: number) => QuickPracticeQuestion[] = defaultPicker
): DrawResult {
  // 1. 过滤当前未展示过的题目
  const unpresented = pool.filter((q) => !presentedIds.has(q.question_id));

  // 2. 检查池是否耗尽 (未做题 < 3)
  if (unpresented.length < 3) {
    // 池耗尽 -> 排除刚做的这批题 (currentBatchIds)，作为新一轮初始去重池
    const freshInPool = pool.filter((q) => !currentBatchIds.includes(q.question_id));
    let drawn: QuickPracticeQuestion[] = [];

    if (freshInPool.length >= 3) {
      drawn = randomPicker(freshInPool, 3);
    } else {
      drawn = [...freshInPool];
      const needed = Math.min(3 - drawn.length, pool.length - drawn.length);
      const fillPool = pool.filter((q) => currentBatchIds.includes(q.question_id));
      const fill = randomPicker(fillPool, needed);
      drawn = [...drawn, ...fill];
    }

    // 将刚做的 id 作为新一轮初始 presentedIds
    const nextPresentedIds = new Set<string>(currentBatchIds);
    drawn.forEach((q) => nextPresentedIds.add(q.question_id));

    return {
      drawnQuestions: drawn,
      nextPresentedIds,
      poolExhausted: true,
    };
  }

  // 3. 未做题 >= 3 -> 正常从 unpresented 中抽取 3 题
  const drawn = randomPicker(unpresented, 3);
  const nextPresentedIds = new Set<string>(presentedIds);
  drawn.forEach((q) => nextPresentedIds.add(q.question_id));

  return {
    drawnQuestions: drawn,
    nextPresentedIds,
    poolExhausted: false,
  };
}

/**
 * 默认随机选取器 (正规 Fisher-Yates 算法，杜绝 Timsort 偏倚)
 */
export function defaultPicker<T>(items: T[], count: number): T[] {
  const arr = [...items];
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
  return arr.slice(0, count);
}

/**
 * 构建符合铁律 5（严格参数化）的快练抽题 SQL 语句
 */
export function buildQuickPracticeSqlQuery(
  pointId: string,
  presentedIds: string[]
): { sql: string; params: (string | number)[] } {
  if (presentedIds.length === 0) {
    return {
      sql: `SELECT question_id, primary_point_id, difficulty_level, question_type, score_default,
                   stem_zh, stem_en, options_json, answer_standard, solutions_json, image_paths_json
            FROM questions
            WHERE primary_point_id = ?
              AND difficulty_level BETWEEN 1 AND 3
              AND question_type = 'single_choice'
            ORDER BY RANDOM() LIMIT 3;`,
      params: [pointId],
    };
  }

  const placeholders = presentedIds.map(() => '?').join(',');
  return {
    sql: `SELECT question_id, primary_point_id, difficulty_level, question_type, score_default,
                 stem_zh, stem_en, options_json, answer_standard, solutions_json, image_paths_json
          FROM questions
          WHERE primary_point_id = ?
            AND difficulty_level BETWEEN 1 AND 3
            AND question_type = 'single_choice'
            AND question_id NOT IN (${placeholders})
          ORDER BY RANDOM() LIMIT 3;`,
    params: [pointId, ...presentedIds],
  };
}

/**
 * 异步从 SQLite 数据库执行单点快练抽题
 * 自动与 sessionStore 的 presentedIds 去重机制交互
 */
export async function fetchQuickPracticeFromDb(
  pointId: string,
  client: DbClient = dbClient,
  presentedIds: Set<string>,
  clearPresentedIds: () => void,
  addPresentedIds: (ids: string[]) => void
): Promise<{ questions: QuickPracticeQuestion[]; poolExhausted: boolean }> {
  // 1. 尝试从未展示题目中抽取 3 题 (严格参数化 SQL)
  const query = buildQuickPracticeSqlQuery(pointId, Array.from(presentedIds));
  const rows = await client.query<any>('questions', query.sql, query.params);

  // 2. 若抽取不足 3 题，判定为池耗尽
  if (rows.length < 3) {
    // 触发清空去重池（台账 H2: 明确调用 clearPresentedIds）
    clearPresentedIds();

    // 重新从全量题池抽取 3 题
    const refreshQuery = buildQuickPracticeSqlQuery(pointId, []);
    const fullRows = await client.query<any>('questions', refreshQuery.sql, refreshQuery.params);

    const questions = mapRawRowsToQuestions(fullRows);
    addPresentedIds(questions.map((q) => q.question_id));
    return { questions, poolExhausted: true };
  }

  // 3. 正常抽取满 3 题
  const questions = mapRawRowsToQuestions(rows);
  addPresentedIds(questions.map((q) => q.question_id));
  return { questions, poolExhausted: false };
}

/**
 * 转换原生 SQL 行记录为强类型结构
 */
export function mapRawRowsToQuestions(rows: any[]): QuickPracticeQuestion[] {
  return rows.map((r) => ({
    question_id: String(r.question_id),
    primary_point_id: String(r.primary_point_id),
    difficulty_level: Number(r.difficulty_level),
    question_type: 'single_choice',
    score_default: Number(r.score_default ?? 2),
    stem_zh: String(r.stem_zh || ''),
    stem_en: String(r.stem_en || ''),
    options: parseOptionsJson(r.options_json),
    answer_standard: String(r.answer_standard || '').trim(),
    solutions_json: r.solutions_json,
    image_paths_json: r.image_paths_json ? String(r.image_paths_json) : null,
  }));
}
