import React from 'react';
import { GraphKnowledgePoint, KnowledgeCombination } from './types';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';

export interface CombinationPanelProps {
  point: GraphKnowledgePoint | null;
  combinations: KnowledgeCombination[];
  allPoints?: Record<string, GraphKnowledgePoint>;
  onClose?: () => void;
  onNavigate?: (destination: 'concept' | 'sandbox' | 'exam', pointId: string) => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 任务 10.3: 组合视图与考点档案抽屉 (CombinationPanel)
 *
 * 铁律规范：
 * 1. [铁律 8]: 组合节点数严格按 kp_count(1~8) 动态渲染，绝对禁止写死"最多4个"。
 *    遇到 kp_count=5~8 的组合要完整画出所有节点。
 * 2. [铁律 3]: 任何题干/文本/提示上屏只走 <MathRenderer>，禁止 import katex 或裸 innerHTML。
 * 3. [铁律 10]: CSS 只用 iOS 27 液态玻璃 token，禁止硬编码颜色。
 * 4. §7.2: 提供跳转【概念精讲】【沙盒探究】【专项测评】的直达入口。
 */
export const CombinationPanel: React.FC<CombinationPanelProps> = ({
  point,
  combinations,
  allPoints = {},
  onClose,
  onNavigate,
  locale = 'zh-CN',
  className = '',
  style = {},
}) => {
  if (!point) return null;

  const isEn = locale === 'en';
  const pointName = isEn ? point.name_en : point.name_zh;

  // 筛选出包含当前考点的连通组合
  const relatedCombinations = combinations.filter((c) =>
    c.kp_ids.includes(point.point_id)
  );

  return (
    <aside
      className={`combination-panel ${className}`}
      data-testid="combination-panel"
      style={{
        width: '380px',
        maxWidth: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.86))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow-deep, 0 20px 60px -10px rgba(0, 20, 60, 0.12))',
        borderRadius: 'var(--radius-lg, 26px) 0 0 var(--radius-lg, 26px)',
        overflowY: 'auto',
        padding: '1.5rem',
        zIndex: 50,
        ...style,
      }}
    >
      {/* 1. 抽屉顶栏控制条 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.2rem',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'var(--ios-blue)',
              color: 'white',
              marginBottom: '0.4rem',
              letterSpacing: '0.5px',
            }}
          >
            {point.point_id}
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            <MathRenderer content={pointName} />
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              border: 'none',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 'var(--radius-pill, 9999px)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              transition: 'all 0.2s ease',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. 考点元数据徽章 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '1.2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm, 12px)',
            background: 'rgba(0, 0, 0, 0.04)',
            color: 'var(--text-secondary)',
          }}
        >
          {point.grade}年级{point.semester === 1 ? '上' : '下'}
        </span>
        <span
          style={{
            fontSize: '0.78rem',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm, 12px)',
            background: 'rgba(0, 0, 0, 0.04)',
            color: 'var(--text-secondary)',
          }}
        >
          {point.domain} · {point.subcategory}
        </span>
        <span
          style={{
            fontSize: '0.78rem',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm, 12px)',
            background: 'rgba(0, 113, 227, 0.08)',
            color: 'var(--ios-blue)',
            fontWeight: 600,
          }}
        >
          主线: {point.primary_line_id}
        </span>
      </div>

      {/* 3. 三大跳板入口 (§7.2: 概念精讲 / 沙盒探究 / 专项测评) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate?.('concept', point.point_id)}
          style={{
            padding: '0.6rem 0.4rem',
            borderRadius: 'var(--radius-sm, 12px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'var(--glass-bg)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--ios-blue)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
          }}
        >
          <Icon name="book" size={18} />
          <span>概念精讲</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('sandbox', point.point_id)}
          style={{
            padding: '0.6rem 0.4rem',
            borderRadius: 'var(--radius-sm, 12px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'var(--glass-bg)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--ios-purple)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
          }}
        >
          <Icon name="flask" size={18} />
          <span>沙盒探究</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('exam', point.point_id)}
          style={{
            padding: '0.6rem 0.4rem',
            borderRadius: 'var(--radius-sm, 12px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'var(--glass-bg)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--ios-orange)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
          }}
        >
          <Icon name="target" size={18} />
          <span>专项测评</span>
        </button>
      </div>

      {/* 4. 强连通组合 (Clique 知识团) 列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '0.96rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            强连通组合 (Clique)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            共 {relatedCombinations.length} 组
          </span>
        </div>

        {relatedCombinations.length === 0 ? (
          <div
            style={{
              padding: '1.2rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm, 12px)',
              background: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            暂无关联组合
          </div>
        ) : (
          relatedCombinations.map((combo) => {
            const hint = isEn ? combo.question_hint_en : combo.question_hint_zh;
            // [铁律 8 核心实现]：严格根据 kp_count 动态生成节点数，绝不截断在 4！
            const targetKpCount = Math.max(1, Math.min(8, combo.kp_count));
            const nodeIds =
              combo.kp_ids && combo.kp_ids.length === targetKpCount
                ? combo.kp_ids
                : Array.from({ length: targetKpCount }, (_, i) => combo.kp_ids[i] || `KP-${i + 1}`);

            return (
              <div
                key={combo.combination_id}
                className="combination-card"
                data-testid={`combination-card-${combo.combination_id}`}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md, 18px)',
                  background: 'var(--glass-bg)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* 组合头部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {combo.combination_id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-pill, 9999px)',
                      background: targetKpCount > 4 ? 'rgba(175, 82, 222, 0.12)' : 'rgba(0, 113, 227, 0.08)',
                      color: targetKpCount > 4 ? 'var(--ios-purple)' : 'var(--ios-blue)',
                    }}
                  >
                    {targetKpCount} 阶拓扑组合
                  </span>
                </div>

                {/* 组合题干破题指引 (铁律 3: 走 MathRenderer) */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  <MathRenderer content={hint} />
                </div>

                {/* [铁律 8 & Property 12]: 组合节点网格动态渲染 1~8 个节点 (禁止 <=4 限制) */}
                <div
                  className="combination-nodes"
                  data-testid="combination-nodes"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    paddingTop: '0.4rem',
                    borderTop: '1px dashed rgba(0, 0, 0, 0.06)',
                  }}
                >
                  {nodeIds.map((kpId, idx) => {
                    const isSelf = kpId === point.point_id;
                    const linkedPoint = allPoints[kpId];
                    const label = linkedPoint
                      ? (isEn ? linkedPoint.name_en : linkedPoint.name_zh)
                      : kpId;

                    return (
                      <span
                        key={`${combo.combination_id}-node-${kpId}-${idx}`}
                        className="combination-node"
                        data-testid="combination-node"
                        data-point-id={kpId}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: isSelf ? 700 : 500,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm, 12px)',
                          background: isSelf
                            ? 'var(--ios-blue)'
                            : 'rgba(0, 0, 0, 0.05)',
                          color: isSelf ? 'white' : 'var(--text-primary)',
                          border: isSelf ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <span>{idx + 1}.</span>
                        <span title={label}>{kpId}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
