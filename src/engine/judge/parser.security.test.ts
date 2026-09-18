import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { parseControlled, ParseError } from './parser';
import { isMathAnswerEquivalent } from './isMathAnswerEquivalent';

describe('Feature: math-junior-frontend, Property 8 (判分器对危险输入零求值安全不变量)', () => {
  beforeEach(() => {
    // 确保全局沙盒环境纯净
    delete (globalThis as any).pwned;
    delete (globalThis as any).polluted;
    delete (globalThis as any).evil;
  });

  const dangerousPayloads = [
    "Function('return process')()",
    "eval('1 + 1')",
    'window.location = "http://malicious.com"',
    'globalThis.pwned = true',
    'constructor.constructor("return 1")()',
    "import('fs')",
    "require('child_process')",
    'process.exit(1)',
    '() => 42',
    '`template string ${1+1}`',
    '__proto__.polluted = true',
    'prototype.polluted = true',
  ];

  it('8.1 [EDGE_CASE] 明确的高危注入载荷被 parseControlled 硬拦截并抛出 ParseError', () => {
    for (const payload of dangerousPayloads) {
      expect(
        () => parseControlled(payload),
        `Payload "${payload}" 应该被硬拦截`
      ).toThrowError(ParseError);

      try {
        parseControlled(payload);
      } catch (err: any) {
        expect(err.message).toBe('检测到非法标记，拒绝求值');
      }
    }
  });

  it('8.2 [EDGE_CASE] 高危载荷传入 isMathAnswerEquivalent 降级为 suspect，无任何异常崩溃，且零全局污染', () => {
    for (const payload of dangerousPayloads) {
      const result = isMathAnswerEquivalent(payload, '1');
      // 必须安全兜底为 suspect，既不报错也不误扣分，也不求值
      expect(result).toBe('suspect');

      // 副作用断言：全局对象绝无被写入
      expect((globalThis as any).pwned).toBeUndefined();
      expect((globalThis as any).polluted).toBeUndefined();
      expect((globalThis as any).evil).toBeUndefined();
    }
  });

  it('8.3 [Property-Based] fast-check 随机拼接危险 token 必被拦截 (100 次迭代)', () => {
    const forbiddenTokens = [
      'Function',
      'eval',
      'window',
      'globalThis',
      'constructor',
      'import',
      'require',
      'process',
      '=>',
      '`',
    ];

    const safeExprArb = fc.constantFrom('x + 1', '2*y - 3', 'sqrt(4)', '0.5');
    const forbiddenArb = fc.constantFrom(...forbiddenTokens);

    fc.assert(
      fc.property(safeExprArb, forbiddenArb, fc.boolean(), (expr, forbidden, prepend) => {
        const injected = prepend ? `${forbidden} + ${expr}` : `${expr} + ${forbidden}`;

        expect(() => parseControlled(injected)).toThrowError(ParseError);
        expect(isMathAnswerEquivalent(injected, expr)).toBe('suspect');

        // 零副作用断言
        expect((globalThis as any).pwned).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('8.4 源码级铁律门禁：判分引擎所有源码文件严禁调用 eval() 或 new Function()', () => {
    const judgeDir = path.resolve(__dirname, '.');
    const files = [
      'normalize.ts',
      'parser.ts',
      'evalExpr.ts',
      'sampleDomain.ts',
      'isMathAnswerEquivalent.ts',
      'calculateSolutionScore.ts',
    ];

    for (const file of files) {
      const filePath = path.join(judgeDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // 剥离注释与正则声明，严禁在执行逻辑中真实调用 eval(...) 或 new Function(...)
      const codeOnly = content
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        .replace(/\/.*?\/[gimsuy]*/g, '');

      expect(codeOnly).not.toMatch(/\beval\s*\(/);
      expect(codeOnly).not.toMatch(/\bnew\s+Function\s*\(/);
      expect(codeOnly).not.toMatch(/\bFunction\s*\(/);
    }
  });
});
