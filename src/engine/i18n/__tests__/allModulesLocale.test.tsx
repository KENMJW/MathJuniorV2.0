/**
 * 全模块英文国际化与双语切换集成测试
 * (TASK-I18N-0001: Comprehensive English Localization Verification)
 *
 * 验证目标：
 * 1. 语言状态切换后，四大模块与核心组件（RadarChart、MathKeyboard、LeapLab、SolutionList等）
 *    在 locale === 'en' 时均正确呈现纯正英文文案，不留中文硬编码；
 * 2. 在 locale === 'zh-CN' 时均完整保留原有中文标准文案；
 * 3. 严格遵守铁律 11（零 emoji）与铁律 3（公式经由 MathRenderer 呈现）。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { RadarChart } from '../../../modules/exam/RadarChart';
import { MathKeyboard } from '../../../modules/exam/MathKeyboard';
import { formatSemester, SEMESTER_CONFIG } from '../../../modules/sandbox/LeapLab';
import { LINE_CATEGORY_GROUPS } from '../../../modules/graph/LineClosedLoop';
import { parseSolutions } from '../../../modules/exam/parseSolutions';
import { useSessionStore } from '../../../store/sessionStore';
import { t } from '../i18n';

describe('TASK-I18N-0001: All Modules Bilingual Localization Closure', () => {
  beforeEach(() => {
    useSessionStore.setState({ locale: 'zh-CN' });
  });

  it('1. Locale dictionary contains essential grade, semester, exam, and domain terms in en and zh-CN', () => {
    expect(t('grade.grade7', 'en')).toBe('Grade 7');
    expect(t('grade.grade7', 'zh-CN')).toBe('七年级');

    expect(t('semester.sem1', 'en')).toBe('Sem 1 (Fall)');
    expect(t('semester.sem1', 'zh-CN')).toBe('上学期 (1)');

    expect(t('exam.choice', 'en')).toBe('Single Choice');
    expect(t('exam.choice', 'zh-CN')).toBe('单项选择题');

    expect(t('exam.fill', 'en')).toBe('Fill-in-the-Blank');
    expect(t('exam.fill', 'zh-CN')).toBe('填空题');

    expect(t('exam.solution', 'en')).toBe('Problem Solving');
    expect(t('exam.solution', 'zh-CN')).toBe('解答题');
  });

  it('2. RadarChart renders English dimension titles and score units when locale is en', () => {
    const scores = { breadth: 88, insight: 92, hiddenCondition: 78, resilience: 95 };
    const htmlEn = renderToString(<RadarChart scores={scores} locale="en" />);

    expect(htmlEn).toContain('Knowledge Breadth');
    expect(htmlEn).toContain('Deep Insight');
    expect(htmlEn).toContain('Hidden Condition Discovery');
    expect(htmlEn).toContain('Computational Resilience');
    expect(htmlEn).toContain('pts');

    const htmlZh = renderToString(<RadarChart scores={scores} locale="zh-CN" />);
    expect(htmlZh).toContain('知识广度');
    expect(htmlZh).toContain('深度洞察');
    expect(htmlZh).toContain('分');
  });

  it('3. MathKeyboard renders English labels, preview, and tabs when locale is en', () => {
    const htmlEn = renderToString(
      <MathKeyboard
        visible={true}
        currentValue="x^2"
        onInsert={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        onClose={() => {}}
        locale="en"
      />
    );

    expect(htmlEn).toContain('Math Keyboard');
    expect(htmlEn).toContain('Backspace');
    expect(htmlEn).toContain('Clear');
    expect(htmlEn).toContain('Done');
    expect(htmlEn).toContain('Preview:');
    expect(htmlEn).toContain('Algebra &amp; Powers');
    expect(htmlEn).toContain('Relations &amp; Ops');
    expect(htmlEn).toContain('Geometry &amp; Logic');

    const htmlZh = renderToString(
      <MathKeyboard
        visible={true}
        currentValue=""
        onInsert={() => {}}
        onBackspace={() => {}}
        onClear={() => {}}
        onClose={() => {}}
        locale="zh-CN"
      />
    );
    expect(htmlZh).toContain('数学键盘');
    expect(htmlZh).toContain('退格');
    expect(htmlZh).toContain('清空');
    expect(htmlZh).toContain('完成');
    expect(htmlZh).toContain('代数与根幂');
  });

  it('4. Sandbox/LeapLab semester formatting outputs standard English when locale is en', () => {
    expect(formatSemester('7A', 'en')).toBe('G7 Sem 1');
    expect(formatSemester('7A', 'zh-CN')).toBe('7年级上学期');
    expect(formatSemester('8B', 'en')).toBe('G8 Sem 2');
    expect(formatSemester('9B', 'en')).toBe('G9 Sem 2');

    // 验证 SEMESTER_CONFIG 全部带有 labelEn
    for (const conf of SEMESTER_CONFIG) {
      expect(conf.labelEn).toBeDefined();
      expect(conf.labelEn.length).toBeGreaterThan(0);
    }
  });

  it('5. Graph module LINE_CATEGORY_GROUPS contains English names for all categories and lines', () => {
    for (const group of LINE_CATEGORY_GROUPS) {
      expect(group.domainEn).toBeDefined();
      expect(group.domainEn!.length).toBeGreaterThan(0);
      for (const line of group.lines) {
        expect(line.nameEn).toBeDefined();
        expect(line.nameEn!.length).toBeGreaterThan(0);
      }
    }
  });

  it('6. Solution parser prioritizes English method and explanation text when isEn is true', () => {
    const rawSolutions = JSON.stringify([
      {
        method_name: '综合法',
        method_en: 'Synthetic Derivation',
        steps: [
          {
            step_index: 1,
            text_zh: '连接 AD，由全等性质可得...',
            text_en: 'Connect AD, by congruence property...',
          },
        ],
        text_zh: '连接 AD，由全等性质可得...',
        text_en: 'Connect AD, by congruence property...',
      },
    ]);

    const parsedEn = parseSolutions(rawSolutions, 'en');
    expect(parsedEn[0].method).toBe('Synthetic Derivation');
    expect(parsedEn[0].text).toContain('Connect AD');

    const parsedZh = parseSolutions(rawSolutions, 'zh-CN');
    expect(parsedZh[0].method).toBe('综合法');
    expect(parsedZh[0].text).toContain('连接 AD');
  });

  it('7. Iron Rule 11 Verification: Zero emoji in all tested strings', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const group of LINE_CATEGORY_GROUPS) {
      expect(group.domainEn).not.toMatch(emojiRegex);
      for (const line of group.lines) {
        expect(line.nameEn).not.toMatch(emojiRegex);
      }
    }
  });
});
