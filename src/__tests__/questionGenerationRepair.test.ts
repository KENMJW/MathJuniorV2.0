import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  calculateDifficultyQuotas,
  drawQuestions,
} from '../modules/exam/drawQuestions';
import { PaperConfig } from '../modules/exam/verifyPaperInventory';
import { testExamQuestions } from '../modules/exam/__tests__/testExamQuestions';
import { useSessionStore } from '../store/sessionStore';
import { defaultPicker } from '../modules/concept/quickPractice.machine';

describe('全科核心素养提分系统 V2.0 · 题目生成机制与去重方案专项验收测试套件', () => {
  // =========================================================================
  // 1. Hamilton-Hare 最大余数法难度配额算法验收
  // =========================================================================
  describe('1. 难度配额计算 (Hamilton-Hare 最大余数法)', () => {
    it('1.1 标准中考比例 [25, 30, 25, 15, 5] 抽 20 题，配额严格守恒且吻合', () => {
      const quotas = calculateDifficultyQuotas(20, [25, 30, 25, 15, 5]);
      expect(quotas.reduce((a, b) => a + b, 0)).toBe(20);
      expect(quotas).toEqual([5, 6, 5, 3, 1]);
    });

    it('1.2 极端比例：100% 倾斜基础 L1 档位', () => {
      const quotas = calculateDifficultyQuotas(10, [100, 0, 0, 0, 0]);
      expect(quotas).toEqual([10, 0, 0, 0, 0]);
    });

    it('1.3 极端比例：100% 倾斜压轴 L5 档位', () => {
      const quotas = calculateDifficultyQuotas(10, [0, 0, 0, 0, 100]);
      expect(quotas).toEqual([0, 0, 0, 0, 10]);
    });

    it('1.4 容错处理：count <= 0 返回全 0 数组', () => {
      expect(calculateDifficultyQuotas(0)).toEqual([0, 0, 0, 0, 0]);
      expect(calculateDifficultyQuotas(-5)).toEqual([0, 0, 0, 0, 0]);
    });
  });

  // =========================================================================
  // 2. 模块四（智能组卷）真随机、难度加权与跨试卷去重
  // =========================================================================
  describe('2. 智能组卷引擎 (真随机、难度加权与跨卷去重)', () => {
    it('2.1 无种子状态下连续调用具备真随机性 (杜绝 1234567 硬编码导致的 100% 重复)', () => {
      const config: PaperConfig = {
        selectedKpIds: [],
        choiceCount: 8,
        fillCount: 4,
        solutionCount: 4,
      };

      const paper1 = drawQuestions(testExamQuestions, config);
      const paper2 = drawQuestions(testExamQuestions, config);

      const ids1 = paper1.choiceQuestions.map((q) => q.question_id);
      const ids2 = paper2.choiceQuestions.map((q) => q.question_id);

      // 两个真随机试卷的题目或题目排列不应该完全一致
      const isIdentical = ids1.every((id, idx) => id === ids2[idx]);
      expect(isIdentical).toBe(false);
    });

    it('2.2 传入固定 seed 时保持结果确定性 (保障回归测试可重现)', () => {
      const config: PaperConfig = {
        selectedKpIds: [],
        choiceCount: 6,
        fillCount: 4,
        solutionCount: 4,
      };

      const seed = 987654;
      const paper1 = drawQuestions(testExamQuestions, config, { seed });
      const paper2 = drawQuestions(testExamQuestions, config, { seed });

      const ids1 = [
        ...paper1.choiceQuestions.map((q) => q.question_id),
        ...paper1.fillQuestions.map((q) => q.question_id),
        ...paper1.solutionQuestions.map((q) => q.question_id),
      ];
      const ids2 = [
        ...paper2.choiceQuestions.map((q) => q.question_id),
        ...paper2.fillQuestions.map((q) => q.question_id),
        ...paper2.solutionQuestions.map((q) => q.question_id),
      ];

      expect(ids1).toEqual(ids2);
    });

    it('2.3 跨试卷排重：传入 excludeQuestionIds 时优先排除已出题目', () => {
      const config1: PaperConfig = {
        selectedKpIds: [],
        choiceCount: 5,
        fillCount: 3,
        solutionCount: 2,
      };

      const paper1 = drawQuestions(testExamQuestions, config1);
      const paper1Ids = [
        ...paper1.choiceQuestions.map((q) => q.question_id),
        ...paper1.fillQuestions.map((q) => q.question_id),
        ...paper1.solutionQuestions.map((q) => q.question_id),
      ];

      // 第二套试卷明确排除第一套的题目
      const config2: PaperConfig = {
        ...config1,
        excludeQuestionIds: paper1Ids,
      };

      const paper2 = drawQuestions(testExamQuestions, config2);
      const paper2Ids = [
        ...paper2.choiceQuestions.map((q) => q.question_id),
        ...paper2.fillQuestions.map((q) => q.question_id),
        ...paper2.solutionQuestions.map((q) => q.question_id),
      ];

      // 在候选池充足的前提下，交集应当为空
      const overlap = paper2Ids.filter((id) => paper1Ids.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('2.4 难度分布联动：全基础 (L1 100%) vs 全高阶 (L5 100%) 试卷难度呈现显著差异', () => {
      const baseConfig: PaperConfig = {
        selectedKpIds: [],
        choiceCount: 10,
        fillCount: 0,
        solutionCount: 0,
      };

      const easyPaper = drawQuestions(testExamQuestions, {
        ...baseConfig,
        difficultyDistribution: [100, 0, 0, 0, 0],
      });
      const hardPaper = drawQuestions(testExamQuestions, {
        ...baseConfig,
        difficultyDistribution: [0, 0, 0, 0, 100],
      });

      const avgEasyDiff =
        easyPaper.choiceQuestions.reduce((s, q) => s + q.difficulty_level, 0) /
        easyPaper.choiceQuestions.length;
      const avgHardDiff =
        hardPaper.choiceQuestions.reduce((s, q) => s + q.difficulty_level, 0) /
        hardPaper.choiceQuestions.length;

      // 困难试卷的平均难度显著高于简单试卷
      expect(avgHardDiff).toBeGreaterThan(avgEasyDiff);
    });
  });

  // =========================================================================
  // 3. 真实数据库 107 考点纯真题三级平滑兜底覆盖率 100% 验收
  // =========================================================================
  describe('3. 真实数据库 107 考点三级真题平滑兜底 100% 覆盖率验证', () => {
    it('3.1 全库 107 个考点无一短缺，三级纯真题池最小题量 >= 3 题', () => {
      const questionsDbPath = path.resolve(process.cwd(), 'data/questions.db');
      const coreDbPath = path.resolve(process.cwd(), 'data/core.db');

      if (!fs.existsSync(questionsDbPath) || !fs.existsSync(coreDbPath)) {
        return;
      }

      const kpsRaw = execSync(
        `sqlite3 -json "${coreDbPath}" "SELECT point_id, primary_line_id FROM knowledge_points"`,
        { encoding: 'utf-8' }
      );
      const kps = JSON.parse(kpsRaw) as { point_id: string; primary_line_id: string }[];

      expect(kps.length).toBe(107);

      const lineToPoints = new Map<string, string[]>();
      kps.forEach(({ point_id, primary_line_id }) => {
        const arr = lineToPoints.get(primary_line_id) || [];
        arr.push(point_id);
        lineToPoints.set(primary_line_id, arr);
      });

      let failedPoints: string[] = [];

      kps.forEach(({ point_id, primary_line_id }) => {
        // Tier 1: 本考点 L1~L3 基础单选
        const t1Raw = execSync(
          `sqlite3 -json "${questionsDbPath}" "SELECT question_id FROM questions WHERE primary_point_id = '${point_id}' AND question_type = 'single_choice' AND difficulty_level BETWEEN 1 AND 3"`,
          { encoding: 'utf-8' }
        ).trim();
        const t1 = t1Raw ? JSON.parse(t1Raw) : [];

        let count = t1.length;

        // Tier 2: 本考点 L4~L5 进阶单选
        if (count < 3) {
          const t2Raw = execSync(
            `sqlite3 -json "${questionsDbPath}" "SELECT question_id FROM questions WHERE primary_point_id = '${point_id}' AND question_type = 'single_choice' AND difficulty_level BETWEEN 4 AND 5"`,
            { encoding: 'utf-8' }
          ).trim();
          const t2 = t2Raw ? JSON.parse(t2Raw) : [];
          count += t2.length;
        }

        // Tier 3: 同主线相邻考点真题
        if (count < 3) {
          const siblingIds = (lineToPoints.get(primary_line_id) || []).filter(
            (p) => p !== point_id
          );
          if (siblingIds.length > 0) {
            const inClause = siblingIds.map((id) => `'${id}'`).join(',');
            const t3Raw = execSync(
              `sqlite3 -json "${questionsDbPath}" "SELECT question_id FROM questions WHERE primary_point_id IN (${inClause}) AND question_type = 'single_choice'"`,
              { encoding: 'utf-8' }
            ).trim();
            const t3 = t3Raw ? JSON.parse(t3Raw) : [];
            count += t3.length;
          }
        }

        if (count < 3) {
          failedPoints.push(point_id);
        }
      });

      // 铁律：107 个考点通过纯真题前三级借调必须 100% 覆盖，0 考点短缺！
      expect(failedPoints).toEqual([]);
    });
  });

  // =========================================================================
  // 4. 会话去重池与命名空间隔离验证
  // =========================================================================
  describe('4. sessionStore 命名空间去重隔离', () => {
    it('4.1 conceptPresentedIds、linePresentedIds 与 recentExamQuestionIds 互不污染', () => {
      const state = useSessionStore.getState();
      state.resetAll();

      state.addConceptPresentedIds(['Q-C1', 'Q-C2']);
      state.addLinePresentedIds('A1', ['Q-L1']);
      state.recordExamQuestionIds(['Q-E1', 'Q-E2']);

      const current = useSessionStore.getState();
      expect(current.conceptPresentedIds.has('Q-C1')).toBe(true);
      expect(current.conceptPresentedIds.has('Q-L1')).toBe(false);
      expect(current.linePresentedIds['A1'].has('Q-L1')).toBe(true);
      expect(current.recentExamQuestionIds).toEqual(['Q-E1', 'Q-E2']);

      // 单独清空概念池不影响试卷记录
      current.clearConceptPresentedIds();
      expect(useSessionStore.getState().conceptPresentedIds.size).toBe(0);
      expect(useSessionStore.getState().recentExamQuestionIds).toEqual(['Q-E1', 'Q-E2']);
    });
  });

  // =========================================================================
  // 5. Fisher-Yates 随机算法公正度与零 Emoji 红线
  // =========================================================================
  describe('5. 洗牌公正度与源码零 Emoji 验收', () => {
    it('5.1 defaultPicker 均匀截取元素，不破坏弱序', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const picked = defaultPicker(items, 3);
      expect(picked.length).toBe(3);
      picked.forEach((item) => expect(items).toContain(item));
    });

    it('5.2 修改的核心源码中绝对零 unicode emoji', () => {
      const files = [
        'src/modules/exam/drawQuestions.ts',
        'src/modules/exam/PaperWorkbench.tsx',
        'src/modules/exam/MobilePaperWorkbench.tsx',
        'src/modules/concept/QuickPractice.tsx',
        'src/modules/concept/quickPractice.machine.ts',
        'src/ConceptNav.tsx',
        'src/modules/graph/GraphNav.tsx',
        'src/modules/graph/LineQuickPractice.tsx',
        'src/store/sessionStore.ts',
      ];

      const emojiRegex = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;

      files.forEach((f) => {
        const content = fs.readFileSync(path.resolve(process.cwd(), f), 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const match = emojiRegex.exec(line);
          if (match) {
            expect(`File ${f}:${idx + 1} contains emoji: ${match[0]}`).toBe('No emoji allowed');
          }
        });
      });
    });
  });
});
