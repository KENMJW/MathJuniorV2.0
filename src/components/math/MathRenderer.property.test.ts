import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { renderMathContent } from './MathRenderer';
import { katexRenderCache, MAX_CACHE_SIZE } from './katexCache';

describe('MathRenderer Property Tests (Property 3 & Property 4)', () => {
  beforeEach(() => {
    katexRenderCache.clear();
  });

  /**
   * Feature: math-junior-frontend, Property 3: 出库渲染永不崩溃
   * (>=100 次随机迭代，覆盖包含畸形 LaTeX 的任意字符串)
   */
  it('Feature: math-junior-frontend, Property 3: 出库渲染永不崩溃', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // 随机任意纯文本 (包含各种标点、控制字符、任意 Unicode)
          fc.string(),
          // 畸形公式片段，前缀与后缀不含 $，确保畸形公式作为独立数学块被解析检验
          fc.record({
            prefix: fc.string({ maxLength: 10 }).map((s) => s.replace(/\$/g, '')),
            badMath: fc.constantFrom(
              '$\\frac{1}{$',
              '$$\\sqrt{$$',
              '$\\nonExistentMacro{abc}$',
              '$$ \\begin{matrix} 1 & 2 $$',
              '$\\left( x \\right$',
              '$$ \\over \\frac {$$'
            ),
            suffix: fc.string({ maxLength: 10 }).map((s) => s.replace(/\$/g, '')),
          }).map(({ prefix, badMath, suffix }) => ({
            text: `${prefix} ${badMath} ${suffix}`,
            hasBadMath: true,
          })),
          // 合法与复杂公式混合
          fc.array(
            fc.constantFrom(
              '$x^2 + 1 = 0$',
              '已知直角三角形',
              '$\\frac{a}{b}$',
              '$$y = ax^2 + bx + c$$',
              '<script>alert("xss")</script>'
            ),
            { minLength: 1, maxLength: 6 }
          ).map((arr) => ({ text: arr.join(' '), hasBadMath: false }))
        ),
        (input) => {
          const content = typeof input === 'string' ? input : input.text;
          const expectError = typeof input === 'object' && input.hasBadMath;

          let output: string = '';
          expect(() => {
            output = renderMathContent(content);
          }).not.toThrow();

          expect(typeof output).toBe('string');
          if (content.length > 0) {
            expect(output.length).toBeGreaterThan(0);
          }

          // 若包含明确的畸形公式块，需安全降级且包含 math-error 标记 (Property 3)
          if (expectError) {
            expect(output).toContain('math-error');
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  /**
   * Feature: math-junior-frontend, Property 4: 出库渲染缓存幂等与容量约束
   * (>=100 次随机迭代)
   */
  it('Feature: math-junior-frontend, Property 4: 出库渲染缓存幂等', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.boolean(),
        (text, block) => {
          const firstRender = renderMathContent(text, block);
          const secondRender = renderMathContent(text, block);

          // 两次渲染输出完全等价
          expect(secondRender).toBe(firstRender);
          // 缓存中必定存在且不超过最大限制
          expect(katexRenderCache.size()).toBeLessThanOrEqual(MAX_CACHE_SIZE);
        }
      ),
      { numRuns: 150 }
    );
  });

  it('Feature: math-junior-frontend, Property 4: LRU 缓存条目数恒不超过 MAX_CACHE_SIZE', () => {
    katexRenderCache.clear();
    // 写入超过容量限制的条目数
    for (let i = 0; i < MAX_CACHE_SIZE + 200; i++) {
      renderMathContent(`$x_{${i}} = ${i}$`);
    }

    expect(katexRenderCache.size()).toBeLessThanOrEqual(MAX_CACHE_SIZE);
    expect(katexRenderCache.size()).toBe(MAX_CACHE_SIZE);
  });

  it('Edge case fallback: text with isolated unclosed dollar sign does not crash', () => {
    const isolatedCases = [
      '商品价格 $100 无闭合',
      '单个符号 $ 在正文中',
      '$ 开头没有结尾',
      '结尾有一个 $',
    ];
    for (const text of isolatedCases) {
      expect(() => {
        const out = renderMathContent(text);
        expect(typeof out).toBe('string');
        expect(out.length).toBeGreaterThan(0);
      }).not.toThrow();
    }
  });
});
