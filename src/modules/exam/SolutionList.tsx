import React, { useMemo } from 'react';
import { parseSolutions, SolutionItem } from './parseSolutions';
import { QuestionContent } from '../../components/common/QuestionContent';

export interface SolutionListProps {
  solutions?: string | SolutionItem[] | null;
  images?: string[] | string | null;
  locale?: 'zh' | 'en' | 'zh-CN' | string;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
}

/**
 * SolutionList: 官方解析与多解法分条渲染组件 (TASK-FE-0002)
 * 
 * 核心设计约束：
 * 1. 严格遵守铁律 3：所有推导与图文走 QuestionContent / MathRenderer 出口，严禁 import katex 或裸 innerHTML。
 * 2. 严格遵守铁律 10/11：采用 iOS27 设计代币与内联样式，绝对零 emoji。
 * 3. 单解题（length === 1）：常规流式展示，method 标题简洁展示。
 * 4. 多解题（length > 1）：分卡片分条渲染，清晰标注解法序号与标题，视觉分明。
 */
export const SolutionList: React.FC<SolutionListProps> = ({
  solutions,
  images,
  locale = 'zh',
  className = '',
  style,
  eager = false,
}) => {
  const normalizedLocale: 'zh' | 'en' = String(locale).toLowerCase().startsWith('en') ? 'en' : 'zh';

  const items = useMemo((): SolutionItem[] => {
    const parsed = parseSolutions(solutions, locale);
    if (parsed.length > 0) {
      return parsed;
    }
    // 降级兼容：若为非空纯文本且非 JSON 格式，兜底作为单条解析呈现
    if (
      typeof solutions === 'string' &&
      solutions.trim().length > 0 &&
      !solutions.trim().startsWith('{') &&
      !solutions.trim().startsWith('[')
    ) {
      return [{ method: '', text: solutions.trim() }];
    }
    return [];
  }, [solutions, locale]);

  if (items.length === 0) {
    return null;
  }

  // 单解渲染
  if (items.length === 1) {
    const sol = items[0];
    return (
      <div className={className} style={style} data-testid="solution-single">
        {sol.method ? (
          <div
            style={{
              fontWeight: 600,
              color: 'var(--ios-blue, #0071e3)',
              marginBottom: '0.35rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>{sol.method}</span>
          </div>
        ) : null}
        <QuestionContent
          content={sol.text}
          images={images}
          role="solution"
          locale={normalizedLocale}
          eager={eager}
        />
      </div>
    );
  }

  // 多解分条渲染
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        ...style,
      }}
      data-testid="solution-list-multiple"
    >
      {items.map((sol, index) => {
        const methodLabel = sol.method || (locale === 'en' ? `Method ${index + 1}` : `解法 ${index + 1}`);
        return (
          <div
            key={index}
            data-testid={`solution-item-${index + 1}`}
            style={{
              padding: '0.75rem 0.875rem',
              borderRadius: 'var(--radius-sm, 12px)',
              backgroundColor: 'rgba(0, 113, 227, 0.04)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderLeft: '3px solid var(--ios-blue, #0071e3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--ios-blue, #0071e3)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '1.25rem',
                  height: '1.25rem',
                  padding: '0 0.35rem',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  backgroundColor: 'var(--ios-blue, #0071e3)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </span>
              <span>{methodLabel}</span>
            </div>
            <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <QuestionContent
                content={sol.text}
                images={images}
                role="solution"
                locale={normalizedLocale}
                eager={eager}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
