import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  drawFromPool,
  filterEligibleQuestions,
  buildQuickPracticeSqlQuery,
  parseOptionsJson,
  QuickPracticeQuestion,
} from './quickPractice.machine';
import { useSessionStore } from '../../store/sessionStore';

/**
 * Feature: math-junior-frontend, Property 13: 单点快练去重与池耗尽重置
 * 对应设计文档 §7.1.1 与 tasks.md 任务 9.5*
 */
describe('Feature: math-junior-frontend, Property 13 (单点快练去重与池耗尽重置)', () => {
  // 生成单个符合规范的模拟题目
  const questionArbitrary = (id: string, diff: number = 2): QuickPracticeQuestion => ({
    question_id: id,
    primary_point_id: 'KP-023',
    difficulty_level: diff,
    question_type: 'single_choice',
    score_default: 2,
    stem_zh: `题目 ${id}`,
    stem_en: `Question ${id}`,
    options: [
      { key: 'A', text_zh: '1', text_en: '1' },
      { key: 'B', text_zh: '2', text_en: '2' },
      { key: 'C', text_zh: '3', text_en: '3' },
      { key: 'D', text_zh: '4', text_en: '4' },
    ],
    answer_standard: 'A',
  });

  it('未做题池 >= 3 时，抽出的 3 道题目严禁包含于原 presented_ids (>=100 次迭代)', () => {
    fc.assert(
      fc.property(
        // 总题池大小 5 ~ 20 道题目
        fc.integer({ min: 5, max: 20 }),
        // 已经做过的题目比例 (确保未做题 >= 3)
        fc.integer({ min: 0, max: 2 }),
        (poolSize, alreadyPresentedCount) => {
          const pool = Array.from({ length: poolSize }, (_, i) =>
            questionArbitrary(`Q-${i + 1}`)
          );

          // 挑选前 alreadyPresentedCount 道题目作为已展示集合
          const presentedIds = new Set<string>(
            pool.slice(0, alreadyPresentedCount).map((q) => q.question_id)
          );

          // 执行抽题
          const result = drawFromPool(pool, presentedIds);

          // 断言：池未耗尽
          expect(result.poolExhausted).toBe(false);
          // 断言：抽出 3 道题目
          expect(result.drawnQuestions.length).toBe(3);

          // 核心断言：抽出的题全都不在原本的 presentedIds 中
          for (const q of result.drawnQuestions) {
            expect(presentedIds.has(q.question_id)).toBe(false);
          }

          // 断言：抽出的 3 道题互不相同
          const drawnIds = new Set(result.drawnQuestions.map((q) => q.question_id));
          expect(drawnIds.size).toBe(3);

          // 断言：新集合正确包含原有 + 新增的 3 题
          expect(result.nextPresentedIds.size).toBe(presentedIds.size + 3);
        }
      ),
      { numRuns: 150 }
    );
  });

  it('未做题池 < 3 时，触发池耗尽并重置题池，重新抽满 3 道题 (>=100 次迭代)', () => {
    fc.assert(
      fc.property(
        // 总题池大小 4 ~ 15
        fc.integer({ min: 4, max: 15 }),
        (poolSize) => {
          const pool = Array.from({ length: poolSize }, (_, i) =>
            questionArbitrary(`Q-${i + 1}`)
          );

          // 构造池耗尽场景：让未做题仅剩 0, 1 或 2 道
          const remainingCount = Math.floor(Math.random() * 3); // 0, 1, 2
          const presentedCount = poolSize - remainingCount;
          const presentedIds = new Set<string>(
            pool.slice(0, presentedCount).map((q) => q.question_id)
          );

          // 执行抽题
          const result = drawFromPool(pool, presentedIds);

          // 核心断言：正确识别为池耗尽
          expect(result.poolExhausted).toBe(true);
          // 核心断言：重抽满 3 道题（因总池 >= 4）
          expect(result.drawnQuestions.length).toBe(3);

          // 核心断言：新集合被重置为恰好这 3 题（清空历史去重池效果）
          expect(result.nextPresentedIds.size).toBe(3);
          for (const q of result.drawnQuestions) {
            expect(result.nextPresentedIds.has(q.question_id)).toBe(true);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it('业务锁必须严格锁 L1~L3 难度与 single_choice 题型', () => {
    const rawQuestions: QuickPracticeQuestion[] = [
      { ...questionArbitrary('Q-L1', 1) },
      { ...questionArbitrary('Q-L2', 2) },
      { ...questionArbitrary('Q-L3', 3) },
      { ...questionArbitrary('Q-L4', 4) }, // 超出 L3
      { ...questionArbitrary('Q-L0', 0) }, // 低于 L1
      { ...questionArbitrary('Q-FB', 2), question_type: 'fill_blank' as any }, // 非单选
      { ...questionArbitrary('Q-DIFF-KP', 2), primary_point_id: 'KP-099' }, // 异考点
    ];

    const eligible = filterEligibleQuestions(rawQuestions, 'KP-023');
    expect(eligible.map((q) => q.question_id)).toEqual(['Q-L1', 'Q-L2', 'Q-L3']);
  });

  it('【台账 H2 验证】确认"换一批练习"在池耗尽时清空 presentedIds，且 resetScores 保持 presentedIds 不变', () => {
    useSessionStore.getState().clearPresentedIds();
    useSessionStore.getState().resetScores();

    // 1. 模拟做题记录
    useSessionStore.getState().addPresentedIds(['Q-1', 'Q-2', 'Q-3']);
    useSessionStore.getState().recordPracticeScore('Q-1', 2);
    useSessionStore.getState().recordPracticeScore('Q-2', 0);

    expect(useSessionStore.getState().presentedIds.size).toBe(3);
    expect(useSessionStore.getState().practiceScores['Q-1']).toBe(2);

    // 2. 调用 resetScores：得分被清空，但 presentedIds 依然保留（防同会话重复）
    useSessionStore.getState().resetScores();
    expect(Object.keys(useSessionStore.getState().practiceScores).length).toBe(0);
    expect(useSessionStore.getState().presentedIds.size).toBe(3); // 依旧保留！
    expect(useSessionStore.getState().hasPresentedId('Q-1')).toBe(true);

    // 3. "换一批练习" 在池耗尽或清空时，调用 clearPresentedIds
    useSessionStore.getState().clearPresentedIds();
    expect(useSessionStore.getState().presentedIds.size).toBe(0); // 题池被清空，允许重新随机轮转
  });

  it('SQL 查询构建器严格采用参数化占位符（杜绝 SQL 注入）', () => {
    // 首次无 presentedIds
    const q1 = buildQuickPracticeSqlQuery('KP-023', []);
    expect(q1.sql).toContain('WHERE primary_point_id = ?');
    expect(q1.sql).toContain('difficulty_level BETWEEN 1 AND 3');
    expect(q1.sql).toContain("question_type = 'single_choice'");
    expect(q1.sql).not.toContain('NOT IN');
    expect(q1.params).toEqual(['KP-023']);

    // 带 presentedIds
    const q2 = buildQuickPracticeSqlQuery('KP-023', ['Q-1', 'Q-2']);
    expect(q2.sql).toContain('question_id NOT IN (?,?)');
    expect(q2.params).toEqual(['KP-023', 'Q-1', 'Q-2']);
  });

  it('options_json 解析器支持 Map 格式与 Array 格式', () => {
    const mapJson = '{"A":{"zh":"5","en":"5"},"B":{"zh":"6","en":"6"}}';
    const optsFromMap = parseOptionsJson(mapJson);
    expect(optsFromMap.length).toBe(2);
    expect(optsFromMap[0].key).toBe('A');
    expect(optsFromMap[0].text_zh).toBe('5');

    const arrJson = '[{"key":"A","text_zh":"5","text_en":"5"}]';
    const optsFromArr = parseOptionsJson(arrJson);
    expect(optsFromArr.length).toBe(1);
    expect(optsFromArr[0].key).toBe('A');
  });
});
