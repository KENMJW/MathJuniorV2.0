import React from 'react';
import { CoreSkeleton } from './morphControllers';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';

export interface XRayLayerProps {
  xrayActive: boolean;
  onToggleXRay: () => void;
  coreSkeleton?: CoreSkeleton;
  distractorCount?: number;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 任务 11.4: X-Ray 骨架透视图层 HUD (XRayLayer)
 *
 * 核心特性：
 * 1. 一键透视：开启时杂质干扰线 opacity 降低至 0.05~0.1，核心骨架高亮呈现。
 * 2. 状态透传：显示当前滤除干扰层数量与核心骨架元认知标签。
 * 3. 铁律 10: 严格遵循 iOS 27 液态玻璃设计规范。
 */
export const XRayLayer: React.FC<XRayLayerProps> = ({
  xrayActive,
  onToggleXRay,
  coreSkeleton,
  distractorCount = 1,
  locale = 'zh-CN',
  className,
  style,
}) => {
  return (
    <div
      className={`xray-layer-hud ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.65rem 1rem',
        borderRadius: 'var(--radius-card, 14px)',
        background: xrayActive
          ? 'linear-gradient(135deg, rgba(0, 113, 227, 0.12) 0%, rgba(88, 86, 214, 0.15) 100%)'
          : 'var(--glass-bg, rgba(255, 255, 255, 0.72))',
        backdropFilter: 'blur(16px)',
        border: xrayActive
          ? '1.5px solid var(--ios-blue)'
          : '1px solid var(--glass-border, rgba(0, 0, 0, 0.08))',
        boxShadow: xrayActive ? '0 4px 20px rgba(0, 113, 227, 0.2)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {/* 状态与骨架描述 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            filter: xrayActive ? 'drop-shadow(0 0 6px rgba(0,113,227,0.6))' : 'none',
            color: xrayActive ? 'var(--ios-blue)' : 'var(--text-secondary)',
          }}
        >
          <Icon name="xray" size={20} />
        </span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              {locale === 'en' ? 'X-Ray Skeleton Vision' : 'X-Ray 骨架透视'}
            </span>
            <span
              style={{
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                background: xrayActive ? 'var(--ios-blue)' : 'rgba(0,0,0,0.08)',
                color: xrayActive ? 'var(--glass-bg-elevated)' : 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {xrayActive ? (locale === 'en' ? 'ACTIVE' : '已透视') : (locale === 'en' ? 'OFF' : '加壳中')}
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            {xrayActive ? (
              <span>
                {locale === 'en'
                  ? `Distractors stripped (${distractorCount} layers dimmed to 10%). Core skeleton highlighted.`
                  : `已透视滤除 ${distractorCount} 个几何干扰图层，核心骨架高亮聚焦。`}
              </span>
            ) : (
              <span>
                {locale === 'en'
                  ? 'Real-world exam state with multiple geometric distractors and camouflages.'
                  : '实战中考常态：包含干扰辅助线与几何外壳。点击右侧一键透视。'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 核心骨架不变量指示 (透视开启时突出显示) */}
      {xrayActive && coreSkeleton?.invariants && coreSkeleton.invariants.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.85)',
            fontSize: '0.78rem',
            color: 'var(--ios-blue)',
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Icon name="target" size={13} />
            <span>{coreSkeleton.invariants[0].labelZh}:</span>
          </span>
          <MathRenderer content={`$${coreSkeleton.invariants[0].formula.replace('{val}', 'C')}$`} />
        </div>
      )}

      {/* 一键透视开关按钮 */}
      <button
        type="button"
        onClick={onToggleXRay}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.45rem 1rem',
          borderRadius: 'var(--radius-pill, 9999px)',
          border: 'none',
          background: xrayActive ? 'var(--ios-blue)' : 'var(--glass-bg-elevated)',
          color: xrayActive ? 'var(--glass-bg-elevated)' : 'var(--text-primary)',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: xrayActive
            ? '0 3px 12px rgba(0, 113, 227, 0.35)'
            : '0 2px 6px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease',
        }}
      >
        <Icon name={xrayActive ? 'shield' : 'xray'} size={15} />
        <span>
          {xrayActive
            ? locale === 'en'
              ? 'Restore Distractors'
              : '恢复几何加壳'
            : locale === 'en'
            ? 'One-Click X-Ray'
            : '一键骨架透视'}
        </span>
      </button>
    </div>
  );
};
