import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { LeapLab } from '../LeapLab';
import { MobilePaperWorkbench, MOBILE_SEMESTERS } from '../../exam/MobilePaperWorkbench';
import { formatInvariantText, wrapFormulaLatex, Point2D } from '../invariants';
import { allLeapSandboxModels } from '../mockLeapModels';
import { useSessionStore } from '../../../store/sessionStore';

describe('TASK-FE-0022 架构师量化验收门禁全量测试套件 (7 Hard Acceptance Gates)', () => {
  // =========================================================================
  // 门禁 2: 组卷引擎零修改 (0 diff 刚性红线)
  // =========================================================================
  describe('门禁 2: 组卷引擎核心文件 0 修改 (Absolute 0 diff)', () => {
    it('1. drawQuestions.ts, verifyPaperInventory.ts, difficultyRipple.ts, presetPapers.ts 必须保持 0 diff', () => {
      const filesToCheck = [
        'src/modules/exam/drawQuestions.ts',
        'src/modules/exam/verifyPaperInventory.ts',
        'src/modules/exam/difficultyRipple.ts',
        'src/modules/exam/presetPapers.ts',
      ];

      for (const relPath of filesToCheck) {
        const fullPath = path.resolve(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        // 通过 git diff 检查相对于 HEAD 的改动
        const diff = execSync(`git diff HEAD -- "${fullPath}"`, { encoding: 'utf-8' }).trim();
        expect(diff).toBe('');
      }
    });
  });

  // =========================================================================
  // 门禁 4: 手机端手势隔离与默认焦点
  // =========================================================================
  describe('门禁 4: 手机端手势隔离与默认焦点锁定', () => {
    it('1. LeapLab 动力学黑板容器与 CSS 必须声明 touch-action: none 物理隔离手势', () => {
      const cssPath = path.resolve(process.cwd(), 'src/modules/sandbox/sandbox.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // CSS 中移动端 .sandbox-viewport-85 必须包含 touch-action: none
      expect(cssContent).toContain('touch-action: none');

      // LeapLab SSR 渲染中包含 touch-action: none 声明
      const testModel = allLeapSandboxModels[0];
      const html = renderToString(<LeapLab model={testModel} />);
      expect(html).toContain('touch-action:none');
    });

    it('2. MobilePaperWorkbench 默认焦点严格锁定最左项 (100分 / 7上 / 基础夯实 7:2:1)', () => {
      // 验证最左项常量契约
      expect(MOBILE_SEMESTERS[0].key).toBe('7-1');
      expect(MOBILE_SEMESTERS[0].labelZh).toBe('7上');

      const html = renderToString(<MobilePaperWorkbench onStartExam={() => {}} />);

      // 默认必须处于 100分、7上、基础夯实 7:2:1
      expect(html).toContain('100分');
      expect(html).toContain('7上');
      expect(html).toContain('基础夯实 7:2:1');

      // 验证底部安全垫片存在
      expect(html).toContain('bottom-safe-spacer');
    });
  });

  // =========================================================================
  // 门禁 5: 代码纯洁度与样式受控 (零 Emoji 违规)
  // =========================================================================
  describe('门禁 5: 源码零 Emoji 违规与样式受控', () => {
    it('1. 本次改造的核心组件源码中绝对零 unicode emoji', () => {
      const files = [
        'src/modules/sandbox/LeapLab.tsx',
        'src/modules/sandbox/invariants.ts',
        'src/modules/sandbox/morphControllers.ts',
        'src/modules/exam/MobilePaperWorkbench.tsx',
        'src/modules/exam/PaperWorkbench.tsx',
        'src/modules/exam/OnlineExam.tsx',
        'src/modules/exam/ScorePanel.tsx',
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

  // =========================================================================
  // 门禁 6: 公式渲染零泄露与文字防溢出
  // =========================================================================
  describe('门禁 6: Invariant LaTeX 公式 KaTeX 规范化与文字防溢出', () => {
    it('1. wrapFormulaLatex 正确识别并包裹含有 LaTeX 转义符的公式', () => {
      expect(wrapFormulaLatex('\\angle A = 60^\\circ')).toBe('$\\angle A = 60^\\circ$');
      expect(wrapFormulaLatex('\\sqrt{a^2 + b^2}')).toBe('$\\sqrt{a^2 + b^2}$');
      expect(wrapFormulaLatex('AC = BD')).toBe('AC = BD'); // 无转义符无需包裹
      expect(wrapFormulaLatex('$already_wrapped$')).toBe('$already_wrapped$');
    });

    it('2. formatInvariantText 遇到 LaTeX 语法时不泄露裸代码，全量输出 KaTeX 识别定界符', () => {
      const specWithFormula = {
        name: 'angle_sum',
        type: 'angle' as const,
        labelZh: '三内角度数皆 60° (∠A=∠B=∠C=60°)',
        labelEn: 'Equilateral Angles 60°',
        formula: '\\angle A = {val}^\\circ',
        deps: ['A', 'C', 'B'],
      };

      const pointMap: Record<string, Point2D> = {
        A: { x: 0, y: 0 },
        B: { x: 4, y: 0 },
        C: { x: 2, y: 3.464 },
      };

      const resZh = formatInvariantText(specWithFormula, pointMap, 'zh-CN');
      expect(resZh).toContain('$\\angle A =');
      expect(resZh).not.toMatch(/:\s*\\angle/); // 绝不能裸露冒号后接 \\angle 而无 $

      const resEn = formatInvariantText(specWithFormula, pointMap, 'en');
      expect(resEn).toContain('$\\angle A =');
    });

    it('3. sandbox.css 中注入 word-break / overflow-wrap 防溢出兜底', () => {
      const cssContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/modules/sandbox/sandbox.css'),
        'utf-8'
      );
      expect(cssContent).toContain('word-break: break-word');
      expect(cssContent).toContain('overflow-wrap: break-word');
      expect(cssContent).toContain('.xray-gem-floating-btn');
      expect(cssContent).toContain('.bottom-safe-spacer');
    });
  });

  // =========================================================================
  // 门禁 7: 沙盒多语言 (i18n) 动态响应与零中文泄露
  // =========================================================================
  describe('门禁 7: 沙盒与出卷多语言 (i18n) 动态响应', () => {
    it('1. LeapLab 在 locale="en" 时，核心控制与遥测结论栏无中文硬编码泄露', () => {
      const prevLocale = useSessionStore.getState().locale;
      useSessionStore.getState().setLocale('en');

      try {
        const testModel = allLeapSandboxModels[0];
        const enHtml = renderToString(<LeapLab model={testModel} locale="en" />);

        // 模式与透视胶囊按钮
        expect(enHtml).toContain('Exam Focus X-Ray');
        expect(enHtml).toContain('Step Deduction');
        expect(enHtml).toContain('Free Play');

        // 遥测结论 (手拉手模型与普通沙盒)
        expect(enHtml).toContain('Invariant telemetry:');
        expect(enHtml).toContain('Conclusion:');
        expect(enHtml).not.toContain('结论：');
        expect(enHtml).not.toContain('不变量实测：');

        // 非手拉手通用模型
        const genericModel = allLeapSandboxModels[1];
        if (genericModel) {
          const genericHtml = renderToString(<LeapLab model={genericModel} locale="en" />);
          expect(genericHtml).toContain('Geometric Invariant:');
          expect(genericHtml).toContain('Conclusion:');
          expect(genericHtml).not.toContain('结论：');
        }
      } finally {
        useSessionStore.getState().setLocale(prevLocale);
      }
    });

    it('2. MobilePaperWorkbench 在 locale="en" 时呈现标准英文界面', () => {
      const enHtml = renderToString(
        <MobilePaperWorkbench onStartExam={() => {}} locale="en" />
      );
      // 包含标准出卷英文
      expect(enHtml).toContain('Quick Settings');
      expect(enHtml).toContain('Start Online Exam');
    });
  });
});
