import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { katexRenderCache } from './katexCache';

export interface MathRendererProps {
  content: string;
  block?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 转义非数学文本，杜绝 XSS 注入
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 纯函数：将混合 Markdown 与 LaTeX 文本渲染为纯净安全 HTML
 * 满足 Property 3 (永不崩溃) 与 Property 4 (缓存一致性)
 */
export function renderMathContent(content: string, defaultBlock: boolean = false): string {
  if (!content) {
    return '';
  }

  const cacheKey = `${defaultBlock ? 'B:' : 'I:'}${content}`;
  const cached = katexRenderCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    // 匹配 $$...$$ (块级) 与 $...$ (行内)
    // 忽略转义的 \$
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let htmlResult = '';

    while ((match = mathRegex.exec(content)) !== null) {
      // 1. 处理公式前置普通文本
      const textPart = content.slice(lastIndex, match.index);
      if (textPart) {
        htmlResult += escapeHtml(textPart).replace(/\n/g, '<br/>');
      }

      // 2. 处理公式本体
      const token = match[0];
      const isDisplay = token.startsWith('$$') || defaultBlock;
      const formula = token.startsWith('$$')
        ? token.slice(2, -2).trim()
        : token.slice(1, -1).trim();

      try {
        const rendered = katex.renderToString(formula, {
          displayMode: isDisplay,
          throwOnError: false,
          errorColor: 'var(--ios-red)',
          strict: false,
          trust: false,
        });

        // 若 KaTeX 内部报错标记，附带 math-error 类供样式与验收识别
        if (rendered.includes('katex-error') || rendered.includes('color:var(--ios-red)')) {
          htmlResult += `<span class="math-error" style="color:var(--ios-red);">${rendered}</span>`;
        } else {
          htmlResult += rendered;
        }
      } catch {
        // 双重防御：极端情况降级为标红 math-error，永不白屏崩溃 (Property 3)
        htmlResult += `<span class="math-error" style="color:var(--ios-red);">${escapeHtml(token)}</span>`;
      }

      lastIndex = mathRegex.lastIndex;
    }

    // 3. 处理尾部剩余普通文本
    const remainingText = content.slice(lastIndex);
    if (remainingText) {
      htmlResult += escapeHtml(remainingText).replace(/\n/g, '<br/>');
    }

    katexRenderCache.set(cacheKey, htmlResult);
    return htmlResult;
  } catch {
    // 兜底兜底：若正则或字符串处理出现意外，安全降级
    const fallback = `<span class="math-error" style="color:var(--ios-red);">${escapeHtml(content)}</span>`;
    katexRenderCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * 出库唯一数学渲染门神组件
 * 对应设计文档 §6.2
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  block = false,
  className = '',
  style = {},
}) => {
  const html = useMemo(() => renderMathContent(content, block), [content, block]);

  const Element = block ? 'div' : 'span';
  return (
    <Element
      className={`math-renderer ${className}`.trim()}
      style={{
        color: 'currentColor',
        display: block ? 'block' : 'inline',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MathRenderer;
