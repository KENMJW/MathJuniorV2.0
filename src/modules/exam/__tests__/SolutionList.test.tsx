import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { parseSolutions } from '../parseSolutions';
import { SolutionList } from '../SolutionList';

describe('SolutionList & parseSolutions (TASK-FE-0002 & 铁律 3/10/11)', () => {
  describe('1. parseSolutions 基础功能与容错验证', () => {
    it('标准 [{method, text}] 数组解析正常', () => {
      const json = JSON.stringify([
        { method: '解法一 (几何法)', text: '设未知数 $x$ 建立方程。' },
        { method: '解法二 (代数法)', text: '利用因式分解求解。' },
      ]);
      const res = parseSolutions(json);
      expect(res).toHaveLength(2);
      expect(res[0]).toEqual({
        method: '解法一 (几何法)',
        text: '设未知数 $x$ 建立方程。',
      });
      expect(res[1]).toEqual({
        method: '解法二 (代数法)',
        text: '利用因式分解求解。',
      });
    });

    it('单对象 {method, text} 自动包装为单元素数组', () => {
      const json = JSON.stringify({ method: '标准推导', text: '结论显然成立。' });
      const res = parseSolutions(json);
      expect(res).toHaveLength(1);
      expect(res[0]).toEqual({ method: '标准推导', text: '结论显然成立。' });
    });

    it('兼容老结构 {method_zh, steps} 数组', () => {
      const legacyJson = JSON.stringify([
        {
          method_zh: '直接利用勾股定理计算：$c = \\sqrt{3^2 + 4^2} = 5$',
          steps: ['c = 5', '验证通过'],
        },
      ]);
      const res = parseSolutions(legacyJson);
      expect(res).toHaveLength(1);
      expect(res[0].method).toBe('直接利用勾股定理计算：$c = \\sqrt{3^2 + 4^2} = 5$');
      expect(res[0].text).toBe('c = 5\n验证通过');
    });

    it('兼容老结构单对象 {method_zh, steps}', () => {
      const legacyObj = JSON.stringify({
        method_zh: '待定系数法',
        steps: ['y = 2x'],
      });
      const res = parseSolutions(legacyObj);
      expect(res).toHaveLength(1);
      expect(res[0].method).toBe('待定系数法');
      expect(res[0].text).toBe('y = 2x');
    });

    it('容错：空/null/undefined 返回 []', () => {
      expect(parseSolutions(null)).toEqual([]);
      expect(parseSolutions(undefined)).toEqual([]);
      expect(parseSolutions('')).toEqual([]);
      expect(parseSolutions('   ')).toEqual([]);
    });

    it('容错：非法 JSON 字符串安全返回 []，绝不抛出异常', () => {
      expect(parseSolutions('{ illegal json here')).toEqual([]);
      expect(parseSolutions('[1, 2,')).toEqual([]);
      expect(parseSolutions('undefined')).toEqual([]);
    });

    it('真实中考多解题 Q-2025-MZ42-0028 数据结构解析测试', () => {
      const realMulti = JSON.stringify([
        { method: '解法一 (分割三角形求二次函数极值)', text: '由二次函数解析式求顶点与切线...' },
        { method: '解法二 (铅垂高水平宽法)', text: '利用铅垂高公式 $S = \\frac{1}{2} d \\cdot h$...' },
      ]);
      const res = parseSolutions(realMulti);
      expect(res).toHaveLength(2);
      expect(res[0].method).toContain('分割三角形');
      expect(res[1].method).toContain('铅垂高水平宽');
    });
  });

  describe('2. SolutionList 渲染行为验证', () => {
    it('多解题 (length > 1) 分条分卡片渲染，显示解法序号与标题', () => {
      const json = JSON.stringify([
        { method: '解法一 (几何法)', text: '作底边高线 $h = 12$' },
        { method: '解法二 (面积法)', text: '由海伦公式计算' },
      ]);

      const html = renderToString(<SolutionList solutions={json} />);

      // 验证多解容器与各卡片
      expect(html).toContain('data-testid="solution-list-multiple"');
      expect(html).toContain('data-testid="solution-item-1"');
      expect(html).toContain('data-testid="solution-item-2"');

      // 验证包含解法标题与正文
      expect(html).toContain('解法一 (几何法)');
      expect(html).toContain('解法二 (面积法)');
      expect(html).toContain('作底边高线');
      expect(html).toContain('海伦公式');

      // 验证公式走 MathRenderer 出口
      expect(html).toContain('math-renderer');
    });

    it('单解题 (length === 1) 正常渲染', () => {
      const json = JSON.stringify([
        { method: '直接推导', text: '两边平方得 $x = 4$' },
      ]);

      const html = renderToString(<SolutionList solutions={json} />);

      expect(html).toContain('data-testid="solution-single"');
      expect(html).toContain('直接推导');
      expect(html).toContain('两边平方得');
      expect(html).toContain('math-renderer');
    });

    it('空或非法输入安全返回空（零渲染）', () => {
      const htmlNull = renderToString(<SolutionList solutions={null} />);
      expect(htmlNull).toBe('');

      const htmlEmpty = renderToString(<SolutionList solutions="" />);
      expect(htmlEmpty).toBe('');

      const htmlBadJson = renderToString(<SolutionList solutions="{invalid" />);
      expect(htmlBadJson).toBe('');
    });

    it('纯文本非 JSON 兜底渲染不崩', () => {
      const rawText = '利用直角三角形斜边中线等于斜边一半可得结论。';
      const html = renderToString(<SolutionList solutions={rawText} />);
      expect(html).toContain('data-testid="solution-single"');
      expect(html).toContain('利用直角三角形斜边中线');
    });
  });

  describe('3. 铁律 3 / 10 / 11 门禁安全检查', () => {
    it('parseSolutions.ts 和 SolutionList.tsx 绝对零 emoji、零 katex 直接引用、零裸 innerHTML', () => {
      const parseSolutionsPath = path.resolve(__dirname, '../parseSolutions.ts');
      const solutionListPath = path.resolve(__dirname, '../SolutionList.tsx');

      const parseCode = fs.readFileSync(parseSolutionsPath, 'utf-8');
      const listCode = fs.readFileSync(solutionListPath, 'utf-8');

      // 铁律 3：禁止业务层裸 innerHTML 或直接引入 katex
      expect(parseCode).not.toContain('dangerouslySetInnerHTML');
      expect(parseCode).not.toContain('.innerHTML');
      expect(parseCode).not.toMatch(/from\s+['"]katex['"]/);

      expect(listCode).not.toContain('dangerouslySetInnerHTML');
      expect(listCode).not.toContain('.innerHTML');
      expect(listCode).not.toMatch(/from\s+['"]katex['"]/);

      // 铁律 11：零 emoji
      const emojiRegex = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
      expect(emojiRegex.test(parseCode)).toBe(false);
      expect(emojiRegex.test(listCode)).toBe(false);
    });
  });
});
