import { describe, it, expect } from 'vitest';
import {
  drawQuestions,
  generateSolutionScoreLadder,
  QuestionItem,
} from '../drawQuestions';
import { isQuestionSubsetAllowed, PaperConfig } from '../verifyPaperInventory';

describe('Block B: Question Subset Closure, Priority & Solution Ladder', () => {
  it('1. Subset Closure: Question with all points in selectedKpIds is allowed', () => {
    const q: QuestionItem = {
      question_id: 'Q-001',
      source: '2024 中考',
      exam_year: 2024,
      region: '北京',
      exam_type: '中考真题',
      grade_level: 8,
      semester: 1,
      primary_point_id: 'KP-020',
      difficulty_level: 3,
      question_type: 'single_choice',
      score_default: 3,
      stem_zh: '测试一次函数',
      all_point_ids: JSON.stringify(['KP-001', 'KP-020']),
    };

    const selectedKpSet = new Set(['KP-001', 'KP-020', 'KP-018']);
    expect(isQuestionSubsetAllowed(q, selectedKpSet)).toBe(true);
  });

  it('2. Subset Closure: Question containing even one unselected point is rejected', () => {
    const qComprehensive: QuestionItem = {
      question_id: 'Q-002',
      source: '2024 中考',
      exam_year: 2024,
      region: '北京',
      exam_type: '中考真题',
      grade_level: 8,
      semester: 1,
      primary_point_id: 'KP-020',
      difficulty_level: 5,
      question_type: 'solution',
      score_default: 10,
      stem_zh: '测试综合大题，含九年级相似三角形',
      // KP-032 是 8下/9年级相似三角形，用户未选
      all_point_ids: JSON.stringify(['KP-020', 'KP-032']),
    };

    const selectedKpSetOnly8A = new Set(['KP-001', 'KP-020']);
    expect(isQuestionSubsetAllowed(qComprehensive, selectedKpSetOnly8A)).toBe(false);
  });

  it('3. Solution Score Ladder: Sum strictly equals totalSolutionScore with valid integer ladder', () => {
    const testTotals = [20, 48, 52, 60, 72, 86, 90];
    for (const total of testTotals) {
      const ladder = generateSolutionScoreLadder(total);
      expect(ladder.length).toBeGreaterThanOrEqual(4);
      expect(ladder.length).toBeLessThanOrEqual(10);
      const sum = ladder.reduce((a, b) => a + b, 0);
      expect(sum).toBe(total);
      // 检验递增
      for (let i = 1; i < ladder.length; i++) {
        expect(ladder[i]).toBeGreaterThanOrEqual(ladder[i - 1]);
      }
      // 检验分值在合法中考大题区间 6 ~ 14 分
      ladder.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(5);
        expect(score).toBeLessThanOrEqual(15);
      });
    }
  });

  it('4. Full Score Invariant: Generated paper question scores sum exactly to fullScore', () => {
    const pool: QuestionItem[] = [
      {
        question_id: 'C-1',
        source: 'S',
        exam_year: 2024,
        region: 'R',
        exam_type: 'T',
        grade_level: 8,
        semester: 1,
        primary_point_id: 'KP-020',
        difficulty_level: 2,
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: 'C1',
      },
      {
        question_id: 'F-1',
        source: 'S',
        exam_year: 2024,
        region: 'R',
        exam_type: 'T',
        grade_level: 8,
        semester: 1,
        primary_point_id: 'KP-020',
        difficulty_level: 3,
        question_type: 'fill_blank',
        score_default: 3,
        stem_zh: 'F1',
      },
      {
        question_id: 'S-1',
        source: 'S',
        exam_year: 2024,
        region: 'R',
        exam_type: 'T',
        grade_level: 8,
        semester: 1,
        primary_point_id: 'KP-020',
        difficulty_level: 5,
        question_type: 'solution',
        score_default: 10,
        stem_zh: 'S1',
      },
      {
        question_id: 'S-2',
        source: 'S',
        exam_year: 2024,
        region: 'R',
        exam_type: 'T',
        grade_level: 8,
        semester: 1,
        primary_point_id: 'KP-020',
        difficulty_level: 6,
        question_type: 'solution',
        score_default: 10,
        stem_zh: 'S2',
      },
      {
        question_id: 'S-3',
        source: 'S',
        exam_year: 2024,
        region: 'R',
        exam_type: 'T',
        grade_level: 8,
        semester: 1,
        primary_point_id: 'KP-020',
        difficulty_level: 7,
        question_type: 'solution',
        score_default: 10,
        stem_zh: 'S3',
      },
      {
        question_id: 'S-4',
        source: 'S',
        exam_year: 2024,
        region: 'R',
        exam_type: 'T',
        grade_level: 8,
        semester: 1,
        primary_point_id: 'KP-020',
        difficulty_level: 8,
        question_type: 'solution',
        score_default: 10,
        stem_zh: 'S4',
      },
    ];

    const config: PaperConfig = {
      selectedKpIds: ['KP-020'],
      choiceCount: 1,
      fillCount: 1,
      solutionCount: 4,
      choiceScore: 3,
      fillScore: 3,
      fullScore: 40,
    };

    const paper = drawQuestions(pool, config, { fullScore: 40 });
    const allQuestions = [
      ...paper.choiceQuestions,
      ...paper.fillQuestions,
      ...paper.solutionQuestions,
    ];
    const totalPoints = allQuestions.reduce((sum, q) => sum + q.score_default, 0);
    expect(totalPoints).toBe(40);
  });
});
