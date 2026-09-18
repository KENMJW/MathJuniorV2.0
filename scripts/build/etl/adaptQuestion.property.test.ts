import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { adaptQuestion } from './adaptQuestion';
import { type UpstreamPackedQuestion, type RubricStepItem } from './types';
import { ZodError } from 'zod';

describe('ETL AdaptQuestion Property Tests (Property 5)', () => {
  // fast-check 任意合法上游数据生成器
  const arbitraryUpstreamQuestion: fc.Arbitrary<UpstreamPackedQuestion> = fc.record({
    question_id: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    meta: fc.record({
      source: fc.string({ minLength: 1, maxLength: 50 }),
      exam_year: fc.option(fc.integer({ min: 2010, max: 2026 }), { nil: undefined }),
      region: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
      exam_type: fc.constantFrom('中考真题', '中考一模', '中考二模'),
      grade_level: fc.integer({ min: 7, max: 9 }),
      semester: fc.integer({ min: 1, max: 2 }),
    }),
    tagging: fc.record({
      primary_point_id: fc.string({ minLength: 1, maxLength: 16 }),
      combination_id: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
      difficulty_level: fc.integer({ min: 1, max: 9 }), // CT-1
      question_type: fc.constantFrom<'single_choice' | 'fill_blank' | 'solution'>(
        'single_choice',
        'fill_blank',
        'solution'
      ), // CT-3
      score_default: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
    }),
    content: fc.record({
      stem: fc.record({
        zh: fc.string({ minLength: 1, maxLength: 200 }),
        en: fc.string({ minLength: 1, maxLength: 200 }),
      }),
      options: fc.option(
        fc.record({
          A: fc.record({ zh: fc.string({ minLength: 1 }), en: fc.string({ minLength: 1 }) }),
          B: fc.record({ zh: fc.string({ minLength: 1 }), en: fc.string({ minLength: 1 }) }),
          C: fc.record({ zh: fc.string({ minLength: 1 }), en: fc.string({ minLength: 1 }) }),
          D: fc.record({ zh: fc.string({ minLength: 1 }), en: fc.string({ minLength: 1 }) }),
        }),
        { nil: undefined }
      ),
      answer_standard: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    rubric: fc.option(
      fc.array(
        fc.record({
          step: fc.integer({ min: 1, max: 10 }),
          desc: fc.record({ zh: fc.string({ minLength: 1 }), en: fc.string({ minLength: 1 }) }),
          score: fc.integer({ min: 1, max: 10 }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      { nil: undefined }
    ),
    solutions: fc.option(
      fc.array(
        fc.record({
          method_zh: fc.string({ minLength: 1 }),
          method_en: fc.string({ minLength: 1 }),
          steps: fc.array(fc.string(), { maxLength: 4 }),
        }),
        { maxLength: 2 }
      ),
      { nil: undefined }
    ),
    images: fc.option(fc.array(fc.string(), { maxLength: 3 }), { nil: undefined }),
  });

  /**
   * Feature: math-junior-frontend, Property 5: ETL 映射业务字段保真
   * (>=100 次随机迭代)
   */
  it('Feature: math-junior-frontend, Property 5: ETL 映射业务字段保真', () => {
    fc.assert(
      fc.property(arbitraryUpstreamQuestion, (upstream) => {
        const flat = adaptQuestion(upstream);

        // 1. 核心业务主键与外键等价
        expect(flat.question_id).toBe(upstream.question_id);
        expect(flat.primary_point_id).toBe(upstream.tagging.primary_point_id);
        expect(flat.combination_id).toBe(upstream.tagging.combination_id);

        // 2. CT-1: difficulty_level ∈ [1, 9] 保真
        expect(flat.difficulty_level).toBe(upstream.tagging.difficulty_level);
        expect(flat.difficulty_level).toBeGreaterThanOrEqual(1);
        expect(flat.difficulty_level).toBeLessThanOrEqual(9);

        // 3. CT-3: question_type 枚举合法性保真
        expect(flat.question_type).toBe(upstream.tagging.question_type);
        expect(['single_choice', 'fill_blank', 'solution']).toContain(flat.question_type);

        // 4. score_default 缺省值兜底逻辑 (score_default ?? 2)
        if (upstream.tagging.score_default !== undefined) {
          expect(flat.score_default).toBe(upstream.tagging.score_default);
        } else {
          expect(flat.score_default).toBe(2);
        }

        // 5. 题干与标准答案双语保真
        expect(flat.stem_zh).toBe(upstream.content.stem.zh);
        expect(flat.stem_en).toBe(upstream.content.stem.en);
        expect(flat.answer_standard).toBe(upstream.content.answer_standard);

        // 6. 选项 options_json 无损序列化
        if (upstream.content.options) {
          expect(flat.options_json).toBeDefined();
          expect(JSON.parse(flat.options_json!)).toEqual(upstream.content.options);
        } else {
          expect(flat.options_json).toBeUndefined();
        }

        // 7. rubric 步骤分值无损映射 (CT-5)
        if (upstream.rubric && upstream.rubric.length > 0) {
          expect(flat.rubric_checklist_json).toBeDefined();
          const parsedSteps: RubricStepItem[] = JSON.parse(flat.rubric_checklist_json!);
          expect(parsedSteps.length).toBe(upstream.rubric.length);
          parsedSteps.forEach((step, idx) => {
            const origin = upstream.rubric![idx];
            expect(step.stepIndex).toBe(origin.step);
            expect(step.descriptionZh).toBe(origin.desc.zh);
            expect(step.descriptionEn).toBe(origin.desc.en);
            expect(step.points).toBe(origin.score);
          });
        } else {
          expect(flat.rubric_checklist_json).toBeUndefined();
        }
      }),
      { numRuns: 150 }
    );
  });

  it('Schema Gate: should reject upstream question with invalid difficulty_level or question_type', () => {
    // difficulty_level 越界 (0 或 10)
    const badDifficulty = {
      question_id: 'Q-ERR-01',
      meta: { source: 'test', exam_type: '中考', grade_level: 8, semester: 1 },
      tagging: { primary_point_id: 'KP-01', difficulty_level: 10, question_type: 'single_choice' },
      content: { stem: { zh: '题干', en: 'stem' }, answer_standard: 'A' },
    };
    expect(() => adaptQuestion(badDifficulty)).toThrowError(ZodError);

    // question_type 非法
    const badType = {
      question_id: 'Q-ERR-02',
      meta: { source: 'test', exam_type: '中考', grade_level: 8, semester: 1 },
      tagging: { primary_point_id: 'KP-01', difficulty_level: 5, question_type: 'essay' },
      content: { stem: { zh: '题干', en: 'stem' }, answer_standard: 'A' },
    };
    expect(() => adaptQuestion(badType)).toThrowError(ZodError);
  });
});
