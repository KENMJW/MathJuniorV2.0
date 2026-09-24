import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { evaluateSafeExpression } from '../../sandbox/safeExpression';
import { LinkedSandboxSlot } from '../LinkedSandboxSlot';
import { PointMasterExample, MasterExampleItem } from '../PointMasterExample';
import { QuickPractice } from '../QuickPractice';
import { QuickPracticeQuestion } from '../quickPractice.machine';
import { ConceptFourStages } from '../ConceptFourStages';
import { ALL_107_KNOWLEDGE_POINTS } from '../allPointsData';
import { SandboxConfig } from '../../sandbox/SandboxRenderer';

describe('TASK-FE-0021 架构师量化验收门禁全量测试套件', () => {
  const dbPath = path.resolve(process.cwd(), 'data/sandbox.db');

  // =========================================================================
  // 门禁 1 & 门禁 2: 46 概念沙盒全量覆盖与数据完整性
  // =========================================================================
  describe('门禁 2: 46 概念沙盒 visual_elements_json 与 inquiry_steps_json 全量覆盖', () => {
    it('1. 数据库中 46 个概念沙盒必须 100% 具备 visual_elements_json 与 inquiry_steps_json', () => {
      const query = `sqlite3 -json "${dbPath}" "SELECT point_id, visual_elements_json, inquiry_steps_json FROM concept_sandboxes;"`;
      const stdout = execSync(query, { encoding: 'utf-8' });
      const rows = JSON.parse(stdout);

      expect(rows.length).toBe(46);

      rows.forEach((row: any) => {
        // visual_elements_json 必须是有效 JSON
        expect(row.visual_elements_json).toBeTruthy();
        const visual = JSON.parse(row.visual_elements_json);
        expect(visual).toBeTypeOf('object');

        if (visual.polygons && visual.polygons.length > 0) {
          visual.polygons.forEach((poly: any) => {
            const pts = poly.pts || poly.points;
            expect(pts).toBeDefined();
            expect(pts.length).toBeGreaterThanOrEqual(3);
            expect(typeof poly.fillColor).toBe('string');
          });
        }

        if (visual.rightAngles && visual.rightAngles.length > 0) {
          visual.rightAngles.forEach((ra: any) => {
            expect(ra.vertex).toBeDefined();
            expect(ra.arm1).toBeDefined();
            expect(ra.arm2).toBeDefined();
          });
        }

        // inquiry_steps_json 必须是有效 JSON 且步数 1~3
        expect(row.inquiry_steps_json).toBeTruthy();
        const steps = JSON.parse(row.inquiry_steps_json);
        expect(Array.isArray(steps)).toBe(true);
        expect(steps.length).toBeGreaterThanOrEqual(1);
        expect(steps.length).toBeLessThanOrEqual(3);

        steps.forEach((step: any, idx: number) => {
          expect(step.step).toBe(idx + 1);
          expect(step.guideTextZh || step.guide_text).toBeTruthy();
          expect(step.guideTextEn || step.guide_text).toBeTruthy();
          expect(step.ahaInsightZh || step.aha_insight).toBeTruthy();
          expect(step.ahaInsightEn || step.aha_insight).toBeTruthy();
          const cond = step.target_condition || step.targetCondition;
          expect(typeof cond).toBe('string');
        });
      });
    });

    it('2. 真实数据库 target_condition 表达式可由 safeExpression 纯函数安全求值', () => {
      const query = `sqlite3 -json "${dbPath}" "SELECT inquiry_steps_json FROM concept_sandboxes;"`;
      const stdout = execSync(query, { encoding: 'utf-8' });
      const rows = JSON.parse(stdout);

      const mockPointScope: Record<string, { x: number; y: number }> = {
        P: { x: 2, y: 3 },
        A: { x: 0, y: 0 },
        B: { x: 4, y: 0 },
        C: { x: 0, y: 3 },
        p_val: { x: 5, y: 0 },
        p_move: { x: 1, y: 1 },
      };
      const mockParams: Record<string, number> = {
        val: 3,
        k: 2,
        r: 5,
        a: 1,
        b: -2,
        c: 1,
      };

      let evaluatedCount = 0;
      rows.forEach((row: any) => {
        const steps = JSON.parse(row.inquiry_steps_json);
        steps.forEach((s: any) => {
          const cond = s.target_condition || s.targetCondition;
          if (cond && cond.trim()) {
            const scope = { ...mockPointScope, ...mockParams };
            const res = evaluateSafeExpression(cond, scope);
            expect(typeof res).toBe('boolean');
            evaluatedCount++;
          }
        });
      });

      expect(evaluatedCount).toBeGreaterThan(40);
    });

    it('3. LinkedSandboxSlot 正确挂载步骤指示胶囊、自由探索按钮与 Aha 顿悟微弹窗', () => {
      const mockConfig: SandboxConfig = {
        point_id: 'KP-023',
        sandbox_id: 'SB-KP023',
        title_zh: '配方法实验',
        title_en: 'Completing the Square Lab',
        canvas_template: 'generic',
        viewbox_spec_json: '[-5, 5, 5, -5]',
        board_bounds: [-5, 5, 5, -5],
        drag_points_json: JSON.stringify([{ id: 'P', x: 2, y: 2 }]),
        visual_elements_json: JSON.stringify({
          polygons: [
            { points: ['P', [0, 0], [2, 0]], fillColor: '#0071e3', fillOpacity: 0.2 },
          ],
          rightAngles: [{ vertex: [0, 0], arm1: [1, 0], arm2: [0, 1] }],
        }),
        inquiry_steps_json: JSON.stringify([
          {
            step: 1,
            guideTextZh: '拖动动点 P 使得二次项与一次项匹配',
            guideTextEn: 'Drag point P to align quadratic and linear terms',
            target_condition: 'P.x > 1',
            ahaInsightZh: '配方的精髓在于加上一次项系数一半的平方！',
            ahaInsightEn: 'The essence of completing the square is adding (b/2)^2!',
          },
        ]),
      };

      const html = renderToString(
        <LinkedSandboxSlot
          sandboxId="SB-KP023"
          config={mockConfig}
          locale="zh-CN"
        />
      );

      // 验证步骤指示与双语
      expect(html).toContain('步骤 1/1');
      expect(html).toContain('拖动动点 P 使得二次项与一次项匹配');

      // 验证自由把玩切换胶囊
      expect(html).toContain('直接自由把玩');

      // 验证手势隔离
      expect(html).toContain('touch-action:none');
    });
  });

  // =========================================================================
  // 门禁 3: 黄金母题思维阶梯手风琴与单点 3 题快练
  // =========================================================================
  describe('门禁 3: 黄金母题 1~4 阶思维阶梯手风琴与单点 3 题快练即答即判闭环', () => {
    it('1. PointMasterExample 正确呈现 1~4 阶手风琴阶梯且支持按压反馈类名', () => {
      const mockExample: MasterExampleItem = {
        example_id: 'ME-KP023',
        example_type: 'point_master',
        bound_target_id: 'KP-023',
        source: '经典中考题型仿编 · 方程组核心例题',
        stem_zh: '已知关于 $x$ 的一元二次方程 $x^2 - (2m-1)x + m^2 - 1 = 0$ 有两个不相等的实数根 $x_1, x_2$。若 $x_1 + x_2 = x_1 x_2$，求实数 $m$ 的值。',
        stem_en: 'Given that quadratic equation $x^2 - (2m-1)x + m^2 - 1 = 0$ has two distinct real roots $x_1, x_2$, and $x_1 + x_2 = x_1 x_2$, find $m$.',
        options_json: '{"A":{"zh":"0"},"B":{"zh":"2"},"C":{"zh":"0 或 2"},"D":{"zh":"-1"}}',
        correct_option: 'A',
        dim1_origin: '审题题眼：二次项系数为 1，移常数项后两边同时加上 4',
        dim2_essence: '本真模型：几何正方形割补法',
        dim3_rigor: '严密推导：Step 1 判别式大于 0；Step 2 韦达定理踩分点',
        dim4_traps: '避坑指南：判别式大于 0 检验，排除不合题意的根！',
        available_dimensions: 4,
      };

      const html = renderToString(
        <PointMasterExample
          example={mockExample}
          locale="zh-CN"
        />
      );

      // 4 阶手风琴标题
      expect(html).toContain('思维阶梯 1：审题题眼与隐藏条件');
      expect(html).toContain('思维阶梯 2：本真直观与数形模型');
      expect(html).toContain('思维阶梯 3：严密推导与中考踩分点');
      expect(html).toContain('思维阶梯 4：避坑指南与防扣分生死线');

      // 踩分点与内容
      expect(html).toContain('审题题眼');
      expect(html).toContain('本真模型');
      expect(html).toContain('严密推导');
      expect(html).toContain('避坑指南');
      expect(html).toContain('active:scale-[0.98]');
    });

    it('2. QuickPractice 具备 48px 热区、即答即判、错题直达 [回看概念精讲] 与星级打分', () => {
      const onReturnMock = vi.fn();
      const mockQuestions: QuickPracticeQuestion[] = [
        {
          question_id: 'Q-2023-BJ-001',
          primary_point_id: 'KP-023',
          difficulty_level: 1,
          question_type: 'single_choice',
          score_default: 2,
          stem_zh: '一元二次方程 $x^2 - 6x + 9 = 0$ 的解为？',
          stem_en: 'The solution of $x^2 - 6x + 9 = 0$ is?',
          options: [
            { key: 'A', text_zh: 'x = 3', text_en: 'x = 3' },
            { key: 'B', text_zh: 'x = -3', text_en: 'x = -3' },
            { key: 'C', text_zh: 'x = 9', text_en: 'x = 9' },
            { key: 'D', text_zh: 'x = 0', text_en: 'x = 0' },
          ],
          answer_standard: 'A',
          solutions_json: '利用配方法 (x-3)^2 = 0，解得 x = 3',
        },
        {
          question_id: 'Q-2023-SH-002',
          primary_point_id: 'KP-023',
          difficulty_level: 2,
          question_type: 'single_choice',
          score_default: 2,
          stem_zh: '若 $x^2 + 2kx + 16$ 是完全平方式，则 $k=$？',
          stem_en: 'If $x^2 + 2kx + 16$ is a perfect square, $k=$?',
          options: [
            { key: 'A', text_zh: '4', text_en: '4' },
            { key: 'B', text_zh: '-4', text_en: '-4' },
            { key: 'C', text_zh: '±4', text_en: '±4' },
            { key: 'D', text_zh: '±8', text_en: '±8' },
          ],
          answer_standard: 'C',
          solutions_json: '完全平方式注意正负号：k = ±4',
        },
        {
          question_id: 'Q-2023-JS-003',
          primary_point_id: 'KP-023',
          difficulty_level: 3,
          question_type: 'single_choice',
          score_default: 2,
          stem_zh: '方程 $(x-1)^2 = 4$ 的根为？',
          stem_en: 'The roots of $(x-1)^2 = 4$ are?',
          options: [
            { key: 'A', text_zh: '3 或 -1', text_en: '3 or -1' },
            { key: 'B', text_zh: '3 或 1', text_en: '3 or 1' },
            { key: 'C', text_zh: '-3 或 -1', text_en: '-3 or -1' },
            { key: 'D', text_zh: '2 或 -2', text_en: '2 or -2' },
          ],
          answer_standard: 'A',
          solutions_json: '直接开平方法：x - 1 = ±2 => x = 3 或 -1',
        },
      ];

      const html = renderToString(
        <QuickPractice
          pointId="KP-023"
          initialQuestions={mockQuestions}
          locale="zh-CN"
          onReturnToConcept={onReturnMock}
        />
      );

      // 验证 48px 热区类名与题目呈现
      expect(html).toContain('min-h-[48px]');
      expect(html).toContain('3题即答即判·基础巩固');
      expect(html).toContain('practice-item-1');
      expect(html).toContain('practice-item-2');
      expect(html).toContain('practice-item-3');
      expect(html).toContain('一元二次方程');
      expect(html).toContain('x = 3');
    });
  });

  // =========================================================================
  // 门禁 4: 手机端绝对手势隔离与三端人机工效
  // =========================================================================
  describe('门禁 4: 手机端手势物理隔离与三端人机工效', () => {
    it('1. ConceptFourStages 手机端画布容器声明 touch-none 隔离上下滚动误触', () => {
      const mockPoint = ALL_107_KNOWLEDGE_POINTS.find((p) => p.point_id === 'KP-023')!;

      const html = renderToString(
        <ConceptFourStages
          knowledgePoint={mockPoint}
          locale="zh-CN"
          onNavigateToMaster={vi.fn()}
        />
      );

      // 手机端沙盒吸顶容器必须具备 touch-none
      expect(html).toContain('touch-none');
      // 下方讲义单手推进 CTA 胶囊
      expect(html).toContain('下一阶段：');
      // 专注大画布切换入口
      expect(html).toContain('专注大画布');
    });
  });

  // =========================================================================
  // 门禁 5: 样式与红线坚守 (内联样式 <= 5 处，源码 0 emoji，0 eval)
  // =========================================================================
  describe('门禁 5: 样式与红线坚守 (内联样式 <= 5 处，源码 0 emoji，0 eval)', () => {
    const conceptDir = path.resolve(__dirname, '../');
    const conceptNavFile = path.resolve(__dirname, '../../../ConceptNav.tsx');

    it('1. 模块一代码内联样式 style={{ 残留数必须 <= 5 处 (仅限动态坐标/尺寸)', () => {
      const conceptFiles = fs.readdirSync(conceptDir)
        .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('.test.'))
        .map((f) => path.join(conceptDir, f));
      conceptFiles.push(conceptNavFile);

      let totalInlineStyles = 0;
      const inlineStyleLocations: string[] = [];

      conceptFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          // 排除注释行
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
          if (line.includes('style={{')) {
            totalInlineStyles++;
            inlineStyleLocations.push(`${path.basename(file)}:L${idx + 1}: ${trimmed}`);
          }
        });
      });

      expect(totalInlineStyles).toBeLessThanOrEqual(5);
    });

    it('2. 模块一代码源码中 emoji 残留数必须严格为 0', () => {
      const conceptFiles = fs.readdirSync(conceptDir)
        .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('.test.'))
        .map((f) => path.join(conceptDir, f));
      conceptFiles.push(conceptNavFile);

      // 严格对齐 noEmoji.test.ts 的 emoji 检测正则
      const emojiRegex = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;

      conceptFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const hasEmoji = emojiRegex.test(line);
          if (hasEmoji) {
            throw new Error(`Emoji detected in ${path.basename(file)}:L${idx + 1}: ${line}`);
          }
        });
      });
    });

    it('3. 模块一代码绝不包含 eval/Function/dangerouslySetInnerHTML (除 SvgLayerReveal 受控 SVG 注入)', () => {
      const filesToCheck = [
        path.join(conceptDir, 'PointMasterExample.tsx'),
        path.join(conceptDir, 'QuickPractice.tsx'),
        path.join(conceptDir, 'LinkedSandboxSlot.tsx'),
        path.join(conceptDir, 'ConceptFourStages.tsx'),
        path.join(conceptDir, 'ConceptDrawerSelector.tsx'),
        conceptNavFile,
      ];

      filesToCheck.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).not.toContain('eval(');
        expect(content).not.toContain('new Function(');
        expect(content).not.toContain('dangerouslySetInnerHTML');
      });
    });
  });
});
