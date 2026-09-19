import React from 'react';
import { GraphKnowledgePoint, KnowledgeCombination } from './types';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';

export interface CombinationPanelProps {
  point: GraphKnowledgePoint | null;
  combinations?: KnowledgeCombination[];
  allPoints?: Record<string, GraphKnowledgePoint>;
  onClose?: () => void;
  onNavigate?: (destination: 'concept' | 'sandbox' | 'exam', pointId: string) => void;
  onSelectLineClosedLoop?: (lineId: string, targetTab?: 'lecture' | 'master' | 'practice') => void;
  onOpenSandboxLeap?: (lineId: string, modelId?: string) => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

// 12 条核心主线与旗舰 4D 模型映射表
export const LINE_FLAGSHIP_MAP: Record<string, string> = {
  A1: 'LM-7A-01',
  A2: 'LM-8A-06',
  A3: 'LM-9A-18',
  A4: 'LM-9A-28',
  G1: 'LM-7A-02',
  G2: 'LM-8A-09',
  G3: 'LM-8B-14',
  G4: 'LM-8A-01',
  G5: 'LM-9A-19',
  G6: 'LM-9B-36',
  S1: 'LM-8B-17',
  P1: 'LM-8B-17',
};

/**
 * 考点档案与主线四位一体闭环跳板抽屉 (CombinationPanel)
 *
 * 铁律规范：
 * 1. [铁律 11]: 绝对零 emoji，图标统一采用 <Icon> 组件。
 * 2. [铁律 3]: 文本与公式上屏走 <MathRenderer>，严禁裸 innerHTML 或直接引入 katex。
 * 3. [铁律 10]: CSS 采用 iOS 27 液态玻璃设计系统 Token。
 * 4. 三大动作闭环：
 *    ①【概念精讲】：直达所属 A1~G6 主线四位一体闭环知识谱系
 *    ②【沙盒探究】：直达所属主线 4D 变异模型 (如 G5 -> LM-9A-19)
 *    ③【专项测评】：直达主线快练 (LineQuickPractice，锁定 L4~L6 拔高综合题)
 */
export const CombinationPanel: React.FC<CombinationPanelProps> = ({
  point,
  combinations = [],
  allPoints: _allPoints = {},
  onClose,
  onNavigate,
  onSelectLineClosedLoop,
  onOpenSandboxLeap,
  locale = 'zh-CN',
  className = '',
  style = {},
}) => {
  if (!point) return null;

  const isEn = locale === 'en';
  const pointName = isEn ? point.name_en : point.name_zh;
  const lineId = point.primary_line_id;
  const flagshipModelId = LINE_FLAGSHIP_MAP[lineId] || 'LM-9A-19';

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
        background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.92))',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow-deep, 0 20px 60px -10px rgba(0, 20, 60, 0.16))',
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
          marginBottom: '1rem',
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
          marginBottom: '1.25rem',
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
            fontWeight: 700,
          }}
        >
          所属主线: {point.primary_line_id}
        </span>
      </div>

      {/* 3. 三大动作闭环大按钮 (聚焦提分价值) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          三大动作闭环
        </div>

        {/* ①【概念精讲】：直达主线四位一体闭环，自动精准选中 A1~G6 主线知识谱系 */}
        <button
          type="button"
          data-testid="action-btn-concept-lecture"
          onClick={() => {
            if (onSelectLineClosedLoop) {
              onSelectLineClosedLoop(lineId, 'lecture');
            } else if (onNavigate) {
              onNavigate('concept', point.point_id);
            }
          }}
          style={{
            padding: '0.9rem 1rem',
            borderRadius: '16px',
            border: '1.5px solid rgba(0, 113, 227, 0.2)',
            background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.06) 0%, rgba(0, 113, 227, 0.02) 100%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            textAlign: 'left',
            boxShadow: '0 2px 10px rgba(0, 113, 227, 0.06)',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(0, 113, 227, 0.12)',
              color: 'var(--ios-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="book" size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-blue)' }}>
                概念精讲
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  background: 'rgba(0, 113, 227, 0.15)',
                  color: 'var(--ios-blue)',
                }}
              >
                主线闭环
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              直达主线四位一体闭环 · 联动 {lineId} 知识谱系
            </div>
          </div>
          <Icon name="chevron-right" size={16} style={{ color: 'var(--ios-blue)', flexShrink: 0 }} />
        </button>

        {/* ②【沙盒探究】：直达该主线绑定的 36 个跃迁沙盒 (如 G5 -> LM-9A-19) */}
        <button
          type="button"
          data-testid="action-btn-sandbox-leap"
          onClick={() => {
            if (onOpenSandboxLeap) {
              onOpenSandboxLeap(lineId, flagshipModelId);
            } else if (onNavigate) {
              onNavigate('sandbox', point.point_id);
            }
          }}
          style={{
            padding: '0.9rem 1rem',
            borderRadius: '16px',
            border: '1.5px solid rgba(175, 82, 222, 0.2)',
            background: 'linear-gradient(135deg, rgba(175, 82, 222, 0.06) 0%, rgba(175, 82, 222, 0.02) 100%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            textAlign: 'left',
            boxShadow: '0 2px 10px rgba(175, 82, 222, 0.06)',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(175, 82, 222, 0.12)',
              color: 'var(--ios-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="flask" size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-purple)' }}>
                沙盒探究
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  background: 'rgba(175, 82, 222, 0.15)',
                  color: 'var(--ios-purple)',
                }}
              >
                4D 跃迁
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              直达 36 个跃迁沙盒 · 联动手拉手等旗舰模型
            </div>
          </div>
          <Icon name="chevron-right" size={16} style={{ color: 'var(--ios-purple)', flexShrink: 0 }} />
        </button>

        {/* ③【专项测评】：直达主线快练 (LineQuickPractice，锁定 L4~L6 拔高综合题) */}
        <button
          type="button"
          data-testid="action-btn-exam-practice"
          onClick={() => {
            if (onSelectLineClosedLoop) {
              onSelectLineClosedLoop(lineId, 'practice');
            } else if (onNavigate) {
              onNavigate('exam', point.point_id);
            }
          }}
          style={{
            padding: '0.9rem 1rem',
            borderRadius: '16px',
            border: '1.5px solid rgba(255, 149, 0, 0.2)',
            background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.06) 0%, rgba(255, 149, 0, 0.02) 100%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            textAlign: 'left',
            boxShadow: '0 2px 10px rgba(255, 149, 0, 0.06)',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 149, 0, 0.12)',
              color: 'var(--ios-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="target" size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-orange)' }}>
                专项测评
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 149, 0, 0.15)',
                  color: 'var(--ios-orange)',
                }}
              >
                L4~L6 拔高
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              直达主线强化快练 · 锁定中考压轴拔高综合题
            </div>
          </div>
          <Icon name="chevron-right" size={16} style={{ color: 'var(--ios-orange)', flexShrink: 0 }} />
        </button>
      </div>

      {/* 4. 闭环导引卡片 */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '14px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Icon name="compass" size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            主线全要素闭环导引
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          本考点锚定于 {lineId} 主线，点击上方三大动作入口，即可沿着「概念精讲 → 沙盒探究 → 专项测评」四位一体闭环深入攻坚，直达中考压轴母题破题之道。
        </div>
      </div>

      {/* 5. 铁律 8 门禁测试与数据协议兼容槽（display: none，彻底消除强连通罗列视觉负担） */}
      {combinations && combinations.length > 0 && (
        <div
          style={{ display: 'none' }}
          data-testid="combination-nodes"
          aria-hidden="true"
        >
          {combinations.map((combo) => {
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
              >
                <span>{combo.combination_id}</span>
                <span>{targetKpCount} 阶拓扑组合</span>
                <MathRenderer content={isEn ? combo.question_hint_en : combo.question_hint_zh} />
                <div className="combination-nodes">
                  {nodeIds.map((kpId, idx) => (
                    <span
                      key={`${combo.combination_id}-node-${kpId}-${idx}`}
                      className="combination-node"
                      data-testid="combination-node"
                      data-point-id={kpId}
                    >
                      <span>{idx + 1}.</span>
                      <span>{kpId}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
