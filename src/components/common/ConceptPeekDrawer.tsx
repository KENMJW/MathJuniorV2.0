import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ALL_107_KNOWLEDGE_POINTS } from '../../modules/concept/allPointsData';
import { mockLogicLines } from '../../modules/graph/mockGraphData';
import { MathRenderer } from '../math/MathRenderer';
import { Icon } from './Icon';
import { useDeviceResponsive } from '../../hooks/useDeviceResponsive';

export interface ConceptPeekDrawerProps {
  /** 抽屉是否开启 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 考点 ID (KP-001 ~ KP-107) */
  pointId?: string | null;
  /** 主线谱系 ID (A1~A6, G1~G6)，若提供且 mode='line' 则展示谱系题眼 */
  lineId?: string | null;
  /** 模式：'concept' 考点四段论，'line' 12大谱系题眼 */
  mode?: 'concept' | 'line';
  /** 当前界面语言 */
  locale?: string;
  /** 自定义返回按钮文案 */
  backButtonLabel?: string;
}

/**
 * 通用概念与谱系题眼快速查阅抽屉 (三端原生响应式)
 * 遵循原则：
 * 1. 绝对零页面跳转，原地覆盖查看，关掉即完美保持底层练习与试卷现场；
 * 2. 手机端 (Mobile): 底部 82vh 贴底滑动弹板 (Bottom Sheet)；
 * 3. 桌面/平板 (Desktop/Tablet): 右侧 540px 滑出抽屉 (Side Drawer)；
 * 4. 铁律 3 / 10 / 11：MathRenderer 渲染公式、iOS 27 设计 Token、纯 SVG 图标零 emoji。
 */
export const ConceptPeekDrawer: React.FC<ConceptPeekDrawerProps> = ({
  isOpen,
  onClose,
  pointId,
  lineId,
  mode = 'concept',
  locale = 'zh-CN',
  backButtonLabel,
}) => {
  const { isMobile } = useDeviceResponsive();
  const isEn = String(locale).toLowerCase().startsWith('en');

  // ESC 键快速关闭支持
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1. 匹配考点数据
  const matchedPoint = pointId
    ? ALL_107_KNOWLEDGE_POINTS.find((p) => p.point_id === pointId) || null
    : null;

  // 2. 匹配 12 大谱系主线数据 (优先按 lineId，其次按考点的 primary_line_id)
  const targetLineId = lineId || matchedPoint?.primary_line_id || 'A1';
  const matchedLine =
    mockLogicLines.find((l) => l.line_id === targetLineId) || mockLogicLines[0];

  const defaultCloseLabel = backButtonLabel || (isEn ? 'Return ✕' : '返回练习 ✕');

  const content = (
    <div
      data-testid="concept-peek-drawer-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: isMobile ? 'center' : 'flex-end',
        alignItems: isMobile ? 'flex-end' : 'stretch',
      }}
      onClick={onClose}
    >
      <div
        data-testid="concept-peek-drawer"
        style={{
          width: isMobile ? '100%' : '540px',
          maxWidth: '100%',
          height: isMobile ? '82vh' : '100%',
          maxHeight: isMobile ? '88vh' : '100%',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderTopLeftRadius: isMobile ? '24px' : '0px',
          borderTopRightRadius: isMobile ? '24px' : '0px',
          boxShadow: isMobile
            ? '0 -8px 30px rgba(0, 0, 0, 0.25)'
            : '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fade-in 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 手机端顶部下拽指示条 (Apple HIG Handle) */}
        {isMobile && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '8px',
              paddingBottom: '2px',
              backgroundColor:
                mode === 'line' ? 'rgba(175, 82, 222, 0.04)' : 'rgba(0, 122, 255, 0.04)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'rgba(0, 0, 0, 0.18)',
              }}
            />
          </div>
        )}

        {/* 抽屉头部 */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor:
              mode === 'line' ? 'rgba(175, 82, 222, 0.04)' : 'rgba(0, 122, 255, 0.04)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor:
                  mode === 'line' ? 'rgba(175, 82, 222, 0.12)' : 'rgba(0, 122, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mode === 'line' ? 'var(--ios-purple)' : 'var(--ios-blue)',
                flexShrink: 0,
              }}
            >
              <Icon name={mode === 'line' ? 'search' : 'book'} size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: mode === 'line' ? 'var(--ios-purple)' : 'var(--ios-blue)',
                  fontWeight: 700,
                }}
              >
                {mode === 'line'
                  ? `${matchedLine.line_id} · ${isEn ? 'Logic Line X-Ray' : '12大知识谱系题眼透视'}`
                  : `${matchedPoint?.point_id || 'KP'} · ${matchedPoint?.domain || (isEn ? 'Core Syllabus' : '中考核心考点')}`}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {mode === 'line'
                  ? isEn
                    ? matchedLine.name_en
                    : matchedLine.name_zh
                  : matchedPoint
                  ? isEn
                    ? matchedPoint.name_en
                    : matchedPoint.name_zh
                  : isEn
                  ? 'Concept Guide'
                  : '概念精讲'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            data-testid="concept-peek-drawer-close"
            onClick={onClose}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-input, #f1f5f9)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0,
            }}
          >
            <span>{defaultCloseLabel}</span>
          </button>
        </div>

        {/* 抽屉正文 (滚动区域) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '1.25rem 1.4rem',
            paddingBottom: isMobile ? 'max(2rem, env(safe-area-inset-bottom, 24px))' : '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            fontSize: '0.875rem',
            lineHeight: 1.6,
          }}
        >
          {/* 模式 A：12 大知识谱系题眼透视 */}
          {mode === 'line' ? (
            <>
              {/* 1. 核心破局思想方法 */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: 'var(--ios-purple)',
                    marginBottom: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Icon name="zap" size={15} />
                  <span>{isEn ? 'Key Breakthrough Methodology' : '核心破局思想方法'}</span>
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  <MathRenderer
                    content={
                      (isEn ? matchedLine.methodology_en : matchedLine.methodology_zh) ||
                      matchedLine.methodology_zh ||
                      ''
                    }
                  />
                </div>
              </div>

              {/* 2. 中考命题矩阵与能力阶梯 */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: 'var(--ios-blue)',
                    marginBottom: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Icon name="chart" size={15} />
                  <span>{isEn ? 'Examination Matrix & Topology' : '中考命题矩阵与能力阶梯'}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <MathRenderer
                    content={
                      (isEn ? matchedLine.exam_matrix_en : matchedLine.exam_matrix_zh) ||
                      matchedLine.exam_matrix_zh ||
                      ''
                    }
                  />
                </div>
              </div>

              {/* 3. 思想起源与初中三年螺旋进阶 */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: 'var(--ios-teal)',
                    marginBottom: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Icon name="compass" size={15} />
                  <span>{isEn ? 'Three-Year Spiral Progression' : '三年认知发展与螺旋演进'}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <MathRenderer
                    content={
                      (isEn ? matchedLine.spiral_leaps_en : matchedLine.spiral_leaps_zh) ||
                      matchedLine.spiral_leaps_zh ||
                      ''
                    }
                  />
                </div>
              </div>
            </>
          ) : matchedPoint ? (
            /* 模式 B：微观考点四段论概念精讲 */
            <>
              {/* ① 原点溯源 */}
              {matchedPoint.origin_story_zh && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--glass-bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: 'var(--ios-blue)',
                      marginBottom: '0.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Icon name="compass" size={15} />
                    <span>{isEn ? '1. Origin & Intuition' : '① 原点溯源与生活直观'}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <MathRenderer
                      content={
                        isEn
                          ? matchedPoint.origin_story_en || matchedPoint.origin_story_zh
                          : matchedPoint.origin_story_zh
                      }
                    />
                  </div>
                </div>
              )}

              {/* ② 本真透视 */}
              {matchedPoint.intuitive_essence_zh && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--glass-bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: 'var(--ios-teal)',
                      marginBottom: '0.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Icon name="eye" size={15} />
                    <span>{isEn ? '2. Geometric & Intuitive Essence' : '② 几何本真与图形本质'}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    <MathRenderer
                      content={
                        isEn
                          ? matchedPoint.intuitive_essence_en || matchedPoint.intuitive_essence_zh
                          : matchedPoint.intuitive_essence_zh
                      }
                    />
                  </div>
                </div>
              )}

              {/* ③ 法典严定 (核心定义与公式) */}
              {matchedPoint.formal_definition_zh && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 122, 255, 0.05)',
                    border: '1px solid rgba(0, 122, 255, 0.2)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: 'var(--ios-blue)',
                      marginBottom: '0.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Icon name="book" size={15} />
                    <span>{isEn ? '3. Formal Definition & Formulas' : '③ 法典严定与核心公式'}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    <MathRenderer
                      content={
                        isEn
                          ? matchedPoint.formal_definition_en || matchedPoint.formal_definition_zh
                          : matchedPoint.formal_definition_zh
                      }
                    />
                  </div>
                </div>
              )}

              {/* ④ 变式避坑 */}
              {matchedPoint.intrinsic_variation_zh && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 149, 0, 0.06)',
                    border: '1px solid rgba(255, 149, 0, 0.25)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: 'var(--ios-orange, #f59e0b)',
                      marginBottom: '0.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Icon name="alert-triangle" size={15} />
                    <span>{isEn ? '4. Exam Pitfalls & Variations' : '④ 避坑指南与典型变式'}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    <MathRenderer
                      content={
                        isEn
                          ? matchedPoint.intrinsic_variation_en || matchedPoint.intrinsic_variation_zh
                          : matchedPoint.intrinsic_variation_zh
                      }
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              {isEn ? 'No concept details available.' : '暂无对应考点精讲数据。'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }

  return content;
};

export default ConceptPeekDrawer;
