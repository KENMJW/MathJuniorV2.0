import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeMathString } from './normalize';
import { isMathAnswerEquivalent } from './isMathAnswerEquivalent';

describe('Feature: math-junior-frontend, Property 6/7 (填空规范化与等价判定属性测试)', () => {
  /**
   * Property 6: 填空规范化清洗彻底性 (≥100 次迭代)
   * 对于任意含 \frac{}{}/ \sqrt{}/ 空格/ 全角字符的答案字符串，
   * normalizeMathString() 输出中不残留 \frac / \sqrt、不含空白字符、无全角字符。
   */
  it('Property 6: 填空规范化清洗彻底性 (fast-check ≥100 次迭代)', () => {
    // 生成包含全角、空白、嵌套分式、开方的随机数学字符串生成器
    const fullWidthChars = ['０', '１', '２', '３', 'ａ', 'ｂ', 'ｘ', 'ｙ', '＋', '－', '＝', '（', '）', '　'];
    const whitespaceChars = [' ', '\t', '\n', '   '];
    const innerExprArb = fc.oneof(
      fc.constantFrom('1', '2', '3', 'x', 'y', 'a+b', '2x'),
      fc.integer({ min: -100, max: 100 }).map((n) => n.toString())
    );

    const rawMathArb = fc
      .tuple(
        fc.array(fc.constantFrom(...fullWidthChars), { minLength: 0, maxLength: 5 }),
        fc.array(fc.constantFrom(...whitespaceChars), { minLength: 0, maxLength: 5 }),
        innerExprArb,
        innerExprArb,
        innerExprArb
      )
      .map(([fw, ws, e1, e2, e3]) => {
        return `${fw.join('')} \\frac{${e1}}{${e2}} ${ws.join('')} + \\sqrt{${e3}} + \\frac{1}{\\frac{2}{3}} + \\pm 5 \\times \\pi`;
      });

    fc.assert(
      fc.property(rawMathArb, (raw) => {
        const out = normalizeMathString(raw);

        // 1. 不残留 \frac 指令
        expect(out).not.toContain('\\frac');

        // 2. 不残留 \sqrt 指令
        expect(out).not.toContain('\\sqrt');

        // 3. 不含任何空白字符
        expect(/\s/.test(out)).toBe(false);

        // 4. 无全角字符 (ASCII 全角 0xFF01~0xFF5E 与全角空格 0x3000)
        for (let i = 0; i < out.length; i++) {
          const code = out.charCodeAt(i);
          expect(code).not.toBe(0x3000);
          const isFullWidthAscii = code >= 0xff01 && code <= 0xff5e;
          expect(isFullWidthAscii).toBe(false);
        }
      }),
      { numRuns: 120 }
    );
  });

  /**
   * Property 7: 填空数值代入等价判定正确性 (≥100 次迭代)
   * 任意在共同定义域内数学等价的表达式判定为 true，确实不等价的判定为 false；
   * 分类答案按 或 / , / ; 拆分后按无序集合比对。
   */
  describe('Property 7: 填空数值代入等价判定正确性', () => {
    it('7.1 浮点数、小数与 LaTeX 分式等价性', () => {
      expect(isMathAnswerEquivalent('0.5', '1/2')).toBe(true);
      expect(isMathAnswerEquivalent('0.5', '\\frac{1}{2}')).toBe(true);
      expect(isMathAnswerEquivalent('\\frac{2}{4}', '0.5')).toBe(true);
      expect(isMathAnswerEquivalent('0.25', '\\frac{1}{4}')).toBe(true);
      expect(isMathAnswerEquivalent('1.5', '\\frac{3}{2}')).toBe(true);
      expect(isMathAnswerEquivalent('0.333', '1/3')).toBe(false); // 精度差异判定不等
    });

    it('7.2 根号与常数运算等价性', () => {
      expect(isMathAnswerEquivalent('\\sqrt{4}', '2')).toBe(true);
      expect(isMathAnswerEquivalent('\\sqrt{9}', '3')).toBe(true);
      expect(isMathAnswerEquivalent('2 * \\sqrt{2}', '\\sqrt{8}')).toBe(true);
      expect(isMathAnswerEquivalent('\\sqrt{16}', '5')).toBe(false);
    });

    it('7.3 经典代数多项式恒等式等价判定', () => {
      // 加法交换律
      expect(isMathAnswerEquivalent('x + y', 'y + x')).toBe(true);
      // 同类项合并
      expect(isMathAnswerEquivalent('2*x', 'x + x')).toBe(true);
      expect(isMathAnswerEquivalent('2x', 'x + x')).toBe(true);
      // 完全平方公式展开
      expect(isMathAnswerEquivalent('(x + 1)^2', 'x^2 + 2*x + 1')).toBe(true);
      // 平方差公式
      expect(isMathAnswerEquivalent('(x - y)*(x + y)', 'x^2 - y^2')).toBe(true);
      // 分式化简
      expect(isMathAnswerEquivalent('(x^2 - 1) / (x - 1)', 'x + 1')).toBe(true);
      // 乘法分配律
      expect(isMathAnswerEquivalent('3*(x + 2)', '3*x + 6')).toBe(true);
      // 明显示差
      expect(isMathAnswerEquivalent('x + 1', 'x + 2')).toBe(false);
      expect(isMathAnswerEquivalent('2*x', '3*x')).toBe(false);
    });

    it('7.4 自适应方程前缀处理 (x=2 与 2)', () => {
      expect(isMathAnswerEquivalent('x = 2', '2')).toBe(true);
      expect(isMathAnswerEquivalent('2', 'x = 2')).toBe(true);
      expect(isMathAnswerEquivalent('x = 2', 'x = 2')).toBe(true);
      expect(isMathAnswerEquivalent('x = 2', 'y = 2')).toBe(false);
    });

    it('7.5 分类讨论多解答案无序集合比对', () => {
      // 或 连接
      expect(isMathAnswerEquivalent('1 或 2', '2 或 1')).toBe(true);
      expect(isMathAnswerEquivalent('x=1 或 x=2', 'x=2 或 x=1')).toBe(true);
      expect(isMathAnswerEquivalent('x=1 或 x=2', '1 或 2')).toBe(true);
      // 逗号与分号连接
      expect(isMathAnswerEquivalent('1, 2', '2, 1')).toBe(true);
      expect(isMathAnswerEquivalent('1; 2; 3', '3; 1; 2')).toBe(true);
      // 中文全角标点
      expect(isMathAnswerEquivalent('１，２', '2, 1')).toBe(true);
      // 正负号 ± 展开
      expect(isMathAnswerEquivalent('±2', '2 或 -2')).toBe(true);
      expect(isMathAnswerEquivalent('-2 或 2', '±2')).toBe(true);
      // 集合元素缺失或不等
      expect(isMathAnswerEquivalent('1 或 2', '1 或 3')).toBe(false);
      expect(isMathAnswerEquivalent('1 或 2', '1')).toBe(false);
      expect(isMathAnswerEquivalent('1', '1 或 2')).toBe(false);
    });

    it('7.6 基于 fast-check 的代数恒等变式属性测试 (120 次迭代)', () => {
      // 生成形式如 a*x + b 的代数式，并用交换律与括号构造等价表达式
      fc.assert(
        fc.property(
          fc.integer({ min: -50, max: 50 }).filter((n) => n !== 0),
          fc.integer({ min: -50, max: 50 }).filter((n) => n !== 0),
          fc.integer({ min: -50, max: 50 }).filter((n) => n !== 0),
          (a, b, c) => {
            // 恒等式 1: a*x + b === b + a*x
            const expr1 = `${a}*x + ${b}`;
            const expr2 = `${b} + ${a}*x`;
            expect(isMathAnswerEquivalent(expr1, expr2)).toBe(true);

            // 恒等式 2: c * (x + 1) === c*x + c
            const factored = `${c} * (x + 1)`;
            const expanded = `${c}*x + ${c}`;
            expect(isMathAnswerEquivalent(factored, expanded)).toBe(true);

            // 不等式: a*x + b !== a*x + b + 1
            const inequal = `${a}*x + ${b + 1}`;
            expect(isMathAnswerEquivalent(expr1, inequal)).toBe(false);
          }
        ),
        { numRuns: 120 }
      );
    });
  });
});
