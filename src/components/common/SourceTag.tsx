/**
 * 题目来源标签组件 (任务 23, 契约 §5, 铁律 10, 铁律 11, 铁律 12)
 *
 * 核心设计与硬约束：
 * 1. [契约 §5]: 短标签格式：exam_year + '·' + region (如 2026·山东)。
 * 2. [微专题隐藏规则]: region 为空时（如 510 道微专题题目，即使有 exam_year 或 source）优雅隐藏（返回 null）。
 *    若无 region 且无 exam_year，但传入了独立 source（如 PointMasterExample 考点母题），则回退显示 source。
 * 3. [铁律 12 溢出防御]:
 *    - 默认 maxWidth: 160px + overflow: hidden + textOverflow: ellipsis + whiteSpace: nowrap；
 *    - title 属性保留完整出处文本 (hover 查看全文)；
 *    - 支持点击展开/折叠长标签；
 *    - 保证不撑破题目卡片，不挤出题号及其他操作按钮。
 * 4. [铁律 10 & 11]: 纯 iOS 27 液态玻璃 token，零 emoji，离线无外部依赖。
 */

import React, { useState } from 'react';

export interface SourceTagProps {
  /** 完整出处，如 "2026年山东省中考数学真题" 或微专题学案标题 */
  source?: string | null;
  /** 年份，如 2026 */
  exam_year?: number | string | null;
  /** 地区/出处简写，如 "山东" / "浙江省J12共同体联盟学校..." */
  region?: string | null;
  /** 自定义最长宽度，默认 '160px' */
  maxWidth?: number | string;
  /** 外部样式传递 */
  style?: React.CSSProperties;
  /** 自定义 className */
  className?: string;
}

export const SourceTag: React.FC<SourceTagProps> = ({
  source,
  exam_year,
  region,
  maxWidth = '160px',
  style = {},
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanRegion = region ? String(region).trim() : '';
  const cleanYear = exam_year !== undefined && exam_year !== null ? String(exam_year).trim() : '';
  const cleanSource = source ? String(source).trim() : '';

  // 计算显示文本与隐藏逻辑
  let label = '';
  if (cleanRegion) {
    // 标准题库模式：年份·地区
    label = cleanYear ? `${cleanYear}·${cleanRegion}` : cleanRegion;
  } else if (!cleanRegion && !cleanYear && cleanSource) {
    // 纯 source 兜底模式（用于 PointMasterExample 母题精讲等未拆解年份地区的单体来源）
    label = cleanSource;
  } else {
    // 隐藏规则：region 为空且有年份（510 道微专题等无明确地区的题目）或全空，优雅隐藏
    return null;
  }

  // 完整文本（用于 hover title 与展开展示）
  const fullText = cleanSource || label;

  const resolvedMaxWidth =
    typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

  return (
    <span
      data-testid="source-tag"
      title={fullText}
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded((prev) => !prev);
      }}
      className={className}
      style={{
        display: 'inline-block',
        maxWidth: isExpanded ? 'none' : resolvedMaxWidth,
        overflow: isExpanded ? 'visible' : 'hidden',
        textOverflow: isExpanded ? 'clip' : 'ellipsis',
        whiteSpace: isExpanded ? 'normal' : 'nowrap',
        wordBreak: isExpanded ? 'break-word' : 'normal',
        padding: '0.15rem 0.55rem',
        borderRadius: 'var(--radius-pill, 9999px)',
        fontSize: '0.75rem',
        lineHeight: '1.2',
        fontWeight: 500,
        color: 'var(--text-secondary, #64748b)',
        backgroundColor: 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
        border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
        cursor: 'pointer',
        userSelect: 'none',
        boxSizing: 'border-box',
        verticalAlign: 'middle',
        minWidth: 0,
        transition: 'max-width 0.2s ease, background-color 0.2s ease',
        ...style,
      }}
    >
      {label}
    </span>
  );
};
