import {
  type UpstreamPackedQuestion,
  type FlatQuestionRow,
  type RubricStepItem,
  UpstreamPackedQuestionSchema,
} from './types';

/**
 * 契约适配核心：上游打包 JSON → 前端扁平行（无损映射关键业务字段）
 * 对应设计文档 §4.4，满足 Property 5 (ETL 映射业务字段保真)
 *
 * 入口执行 Zod Schema 校验与契约条款断言：
 * - CT-1: difficulty_level ∈ [1, 9]
 * - CT-3: question_type ∈ ['single_choice', 'fill_blank', 'solution']
 * - score_default 缺失时兜底为 2
 * - rubric 步骤无损映射为 RubricStepItem[]
 */
export function adaptQuestion(raw: unknown): FlatQuestionRow {
  // 1. Zod 模式校验与 CT 条款强制断言 (应对上游漂移 R6)
  const u: UpstreamPackedQuestion = UpstreamPackedQuestionSchema.parse(raw);

  // 2. 踩分点映射 (CT-5)
  let rubricJson: string | undefined = undefined;
  if (u.rubric && u.rubric.length > 0) {
    const steps: RubricStepItem[] = u.rubric.map((r) => ({
      stepIndex: r.step,
      descriptionZh: r.desc.zh,
      descriptionEn: r.desc.en,
      points: r.score,
    }));
    rubricJson = JSON.stringify(steps);
  }

  // 3. 扁平化映射
  return {
    question_id: u.question_id,
    source: u.meta.source,
    exam_year: u.meta.exam_year,
    region: u.meta.region,
    exam_type: u.meta.exam_type,
    grade_level: u.meta.grade_level,
    semester: u.meta.semester,
    primary_point_id: u.tagging.primary_point_id,
    combination_id: u.tagging.combination_id,
    difficulty_level: u.tagging.difficulty_level,
    question_type: u.tagging.question_type,
    score_default: u.tagging.score_default ?? 2,
    stem_zh: u.content.stem.zh,
    stem_en: u.content.stem.en,
    options_json: u.content.options ? JSON.stringify(u.content.options) : undefined,
    answer_standard: u.content.answer_standard,
    rubric_checklist_json: rubricJson,
    solutions_json: u.solutions ? JSON.stringify(u.solutions) : undefined,
    image_paths_json: u.images ? JSON.stringify(u.images) : undefined,
  };
}
