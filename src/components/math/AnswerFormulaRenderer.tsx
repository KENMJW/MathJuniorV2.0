/**
 * 答题卡与考场专属数学公式渲染器 (AnswerFormulaRenderer)
 *
 * 核心特性 (与题库官方 MathRenderer 彻底解耦)：
 * 1. 免 $ 语法约束：学生在输入框打字直接输入 \sqrt{2}\le5、\frac{1}{2}、x^2 即可实时渲染为 KaTeX 公式；
 * 2. 键入中途平滑容错：自动去除尾部未完成悬挂斜杠、智能补齐未闭合的花括号，打字中途绝不崩溃、不闪退；
 * 3. 多行推导排版：支持解答题草稿的多行推导 (\n)，自适应支持中文说明词与 LaTeX 混合排版；
 * 4. 专属 LRU 缓存：自带独立缓存实例，彻底隔离题库官方 MathRenderer 缓存。
 */

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { LruCache } from './katexCache';

export interface AnswerFormulaRendererProps {
  content?: string | null;
  multiline?: boolean;
  displayMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

/** 答题卡专属 LRU 缓存实例 (容量 1000) */
export const answerFormulaCache = new LruCache<string, string>(1000);

/**
 * 转义纯文本，杜绝 XSS 注入
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 智能抚平打字中途的半成品 LaTeX 语法
 */
export function healIncompleteLatex(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();

  // 1. 消除末尾孤立的单个反斜杠 (如正在敲 \ 时)
  if (s.endsWith('\\') && !s.endsWith('\\\\')) {
    s = s.slice(0, -1).trim();
  }

  // 2. 自动补齐未闭合的花括号 (如 \sqrt{2 未输入 }，或 \frac{1}{ 未闭合)
  const openCount = (s.match(/\{/g) || []).length;
  const closeCount = (s.match(/\}/g) || []).length;
  if (openCount > closeCount) {
    s += '}'.repeat(openCount - closeCount);
  }

  return s;
}

/**
 * 自动识别并包装中文文字进 \text{}，避免 KaTeX 报错
 */
function prepareLatexMath(latexStr: string): string {
  const healed = healIncompleteLatex(latexStr);
  if (!healed) return '';

  // 若已经显式包含 $...$ 或 $$...$$，剥离外层
  let formula = healed;
  if (formula.startsWith('$$') && formula.endsWith('$$') && formula.length >= 4) {
    formula = formula.slice(2, -2).trim();
  } else if (formula.startsWith('$') && formula.endsWith('$') && formula.length >= 2) {
    formula = formula.slice(1, -1).trim();
  }

  // 将未被 \text{} 保护的连续中文字符及中文标点包裹入 \text{}
  // 保持 LaTeX 控制指令不被错误替换
  return formula.replace(/([\u4e00-\u9fa5\u3000-\u303f\uff01-\uff60]+)/g, (match, _p1, offset, fullStr) => {
    // 简单检查前置是否已有 \text{
    const before = fullStr.slice(0, offset);
    if (/\\text\s*\{[^}]*$/.test(before)) {
      return match;
    }
    return `\\text{${match}}`;
  });
}

/**
 * 单行公式渲染核心函数
 */
export function renderSingleFormulaLine(lineText: string, displayMode: boolean = false): string {
  const trimmed = lineText.trim();
  if (!trimmed) return '';

  const cacheKey = `${displayMode ? 'D:' : 'I:'}${trimmed}`;
  const cached = answerFormulaCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // 若为纯文本且不含任何 LaTeX 命令、符号或公式特征，直接安全输出转义 HTML
  const hasLatexIndicator = /\\|\^|_|\{|\}|[=<>&+\-*/±≤≥≈≠π√]|[\u2200-\u22FF]/.test(trimmed);
  if (!hasLatexIndicator && !/[a-zA-Z]/.test(trimmed)) {
    const escaped = escapeHtml(trimmed);
    answerFormulaCache.set(cacheKey, escaped);
    return escaped;
  }

  const prepared = prepareLatexMath(trimmed);

  try {
    const rendered = katex.renderToString(prepared, {
      displayMode,
      output: 'html',
      throwOnError: false,
      errorColor: 'var(--ios-red, #ff3b30)',
      strict: false,
      trust: false,
    });

    // 检查是否包含严重语法错误
    if (rendered.includes('katex-error')) {
      // 容错降级：不报错崩溃，返回优雅高亮的原始安全文本
      const fallback = `<span class="answer-math-fallback" style="font-family:monospace;color:var(--text-primary);">${escapeHtml(trimmed)}</span>`;
      answerFormulaCache.set(cacheKey, fallback);
      return fallback;
    }

    answerFormulaCache.set(cacheKey, rendered);
    return rendered;
  } catch {
    const fallback = `<span class="answer-math-fallback" style="font-family:monospace;color:var(--text-primary);">${escapeHtml(trimmed)}</span>`;
    answerFormulaCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * 完整内容渲染函数 (支持单行公式与多行步骤推导)
 */
export function renderAnswerFormulaContent(content: string, multiline: boolean = false, displayMode: boolean = false): string {
  if (!content || !content.trim()) {
    return '';
  }

  const raw = content.trim();

  // 单行模式
  if (!multiline && !raw.includes('\n')) {
    return renderSingleFormulaLine(raw, displayMode);
  }

  // 多行模式 (解答题推导步骤)
  const lines = raw.split(/\r?\n/);
  const renderedLines = lines.map((line) => {
    if (!line.trim()) {
      return '<div class="formula-line-empty" style="height:0.75rem;"></div>';
    }
    const html = renderSingleFormulaLine(line, displayMode);
    return `<div class="formula-line" style="line-height:1.6;margin-bottom:0.25rem;">${html}</div>`;
  });

  return renderedLines.join('');
}

/**
 * 答题卡专用公式渲染门神组件
 */
export const AnswerFormulaRenderer: React.FC<AnswerFormulaRendererProps> = ({
  content,
  multiline = false,
  displayMode = false,
  className = '',
  style = {},
  placeholder,
}) => {
  const html = useMemo(() => {
    return renderAnswerFormulaContent(content || '', multiline, displayMode);
  }, [content, multiline, displayMode]);

  if (!html) {
    if (placeholder) {
      return (
        <span
          className={`answer-formula-placeholder ${className}`.trim()}
          style={{
            color: 'var(--text-tertiary, #8e8e93)',
            fontSize: '0.75rem',
            fontStyle: 'italic',
            ...style,
          }}
        >
          {placeholder}
        </span>
      );
    }
    return null;
  }

  const Element = multiline || displayMode ? 'div' : 'span';

  return (
    <Element
      data-testid="answer-formula-renderer"
      className={`answer-formula-renderer ${className}`.trim()}
      style={{
        color: 'currentColor',
        display: multiline || displayMode ? 'block' : 'inline-block',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default AnswerFormulaRenderer;
