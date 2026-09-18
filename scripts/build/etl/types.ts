import { z } from 'zod';

/**
 * 契约条款验证 Schema 与类型
 * 对应设计文档 §3.1, §3.2 (CT-1 ~ CT-8)
 */

export const QuestionTypeEnum = z.enum(['single_choice', 'fill_blank', 'solution']);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const UpstreamPackedQuestionSchema = z.object({
  question_id: z.string().min(1),
  meta: z.object({
    source: z.string().min(1),
    exam_year: z.number().int().optional(),
    region: z.string().optional(),
    exam_type: z.string().default('中考真题'),
    grade_level: z.number().int().min(7).max(9),
    semester: z.number().int().min(1).max(2),
  }),
  tagging: z.object({
    primary_point_id: z.string().min(1),
    combination_id: z.string().optional(),
    difficulty_level: z.number().int().min(1).max(9), // CT-1
    question_type: QuestionTypeEnum, // CT-3
    score_default: z.number().int().positive().optional(),
  }),
  content: z.object({
    stem: z.object({
      zh: z.string().min(1),
      en: z.string().min(1),
    }),
    options: z.record(
      z.enum(['A', 'B', 'C', 'D']),
      z.object({
        zh: z.string(),
        en: z.string(),
      })
    ).optional(),
    answer_standard: z.string(), // CT-4
  }),
  rubric: z.array(
    z.object({
      step: z.number().int().min(1),
      desc: z.object({
        zh: z.string(),
        en: z.string(),
      }),
      score: z.number().int().positive(), // CT-5
    })
  ).optional(),
  solutions: z.array(
    z.object({
      method_zh: z.string(),
      method_en: z.string(),
      steps: z.array(z.string()),
    })
  ).optional(),
  images: z.array(z.string()).optional(),
});

export type UpstreamPackedQuestion = z.infer<typeof UpstreamPackedQuestionSchema>;

/** 解答题踩分步骤 */
export interface RubricStepItem {
  stepIndex: number;
  descriptionZh: string;
  descriptionEn: string;
  points: number;
}

/** 前端消费用扁平记录 (设计文档 §4.4) */
export interface FlatQuestionRow {
  question_id: string;
  source: string;
  exam_year?: number;
  region?: string;
  exam_type: string;
  grade_level: number;
  semester: number;
  primary_point_id: string;
  combination_id?: string;
  difficulty_level: number; // 1~9
  question_type: QuestionType;
  score_default: number;
  stem_zh: string;
  stem_en: string;
  options_json?: string; // JSON.stringify(Record<'A'..'D', {zh,en}>)
  answer_standard: string;
  rubric_checklist_json?: string; // JSON.stringify(RubricStepItem[])
  solutions_json?: string;
  image_paths_json?: string;
}
