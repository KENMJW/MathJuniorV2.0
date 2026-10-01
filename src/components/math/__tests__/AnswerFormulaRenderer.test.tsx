import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  AnswerFormulaRenderer,
  healIncompleteLatex,
  renderAnswerFormulaContent,
} from '../AnswerFormulaRenderer';

describe('AnswerFormulaRenderer (答题卡专属数学公式渲染器)', () => {
  it('1. 裸 LaTeX 输入（免 $ 符号）能够成功渲染为 KaTeX 公式', () => {
    const raw = '\\sqrt{2}\\le5';
    const html = renderAnswerFormulaContent(raw);
    expect(html).toContain('katex');
    expect(html).not.toContain('katex-error');
  });

  it('2. 分式与平方根裸输入正常渲染', () => {
    const frac = '\\frac{1}{2}';
    const html = renderAnswerFormulaContent(frac);
    expect(html).toContain('katex');
    expect(html).toContain('frac');
  });

  it('3. 打字中途未闭合语法（自动抚平）不白屏、不报错', () => {
    // 尾部未闭合花括号
    const healed1 = healIncompleteLatex('\\sqrt{2');
    expect(healed1).toBe('\\sqrt{2}');

    const healed2 = healIncompleteLatex('\\frac{1}{');
    expect(healed2).toBe('\\frac{1}{}');

    // 尾部挂单个反斜杠
    const healed3 = healIncompleteLatex('x + \\');
    expect(healed3).toBe('x +');

    // 渲染打字半成品
    const html = renderAnswerFormulaContent('\\sqrt{2');
    expect(html).toContain('katex');
  });

  it('4. 多行解答题推导步骤正常排版', () => {
    const multi = '由题意得：\nx^2 + 2x + 1 = 0\n(x + 1)^2 = 0\nx = -1';
    const html = renderAnswerFormulaContent(multi, true);
    expect(html).toContain('formula-line');
    expect(html).toContain('katex');
  });

  it('5. 空内容与占位符正确渲染', () => {
    const emptyHtml = renderToString(<AnswerFormulaRenderer content="" placeholder="点击输入" />);
    expect(emptyHtml).toContain('点击输入');
  });
});
