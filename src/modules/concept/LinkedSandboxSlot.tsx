/**
 * 链接沙盒插槽与 CLS=0 防抖等大占位卡 (任务 9.2, 设计文档 §7.1, 铁律 3, 铁律 10)
 *
 * 核心设计：
 * 1. 考点有 sandbox_id 且有 config 时：挂载通用声明式 <SandboxRenderer>，渲染动态几何动力学探究画布；
 * 2. 考点无 sandbox_id 时：渲染物理等大的占位卡（默认 560px 高度，与沙盒严格等大），确保视口防跳动（Cumulative Layout Shift, CLS = 0）；
 * 3. 文本上屏全部经由 <MathRenderer> 渲染；
 * 4. 严格遵循 iOS 27 液态玻璃设计 Token。
 */

import React from 'react';
import { SandboxConfig, SandboxRenderer } from '../sandbox/SandboxRenderer';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';

export interface LinkedSandboxSlotProps {
  sandboxId?: string | null;
  config?: SandboxConfig | null;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  pointNameZh?: string;
}

export const LinkedSandboxSlot: React.FC<LinkedSandboxSlotProps> = ({
  sandboxId,
  config,
  height = 560,
  className = '',
  style = {},
  pointNameZh: _pointNameZh = '当前知识考点',
}) => {
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  // 分支 1：有沙盒且配置完备，直接渲染 SandboxRenderer
  if (sandboxId && config) {
    return (
      <div
        data-testid="linked-sandbox-active"
        className={className}
        style={{
          width: '100%',
          height: containerHeight,
          minHeight: containerHeight,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg, 24px)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
          boxShadow: 'var(--glass-shadow)',
          ...style,
        }}
      >
        <SandboxRenderer
          config={config}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    );
  }

  // 分支 2：无沙盒或纯代数/概念定理，渲染物理等大 CLS=0 占位卡
  return (
    <div
      data-testid="linked-sandbox-placeholder"
      className={className}
      style={{
        width: '100%',
        height: containerHeight,
        minHeight: containerHeight,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        borderRadius: 'var(--radius-lg, 24px)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow)',
        transition: 'all 0.2s var(--spring-smooth)',
        userSelect: 'none',
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* 占位徽章 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-pill, 9999px)',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-card-hover)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Icon name="ruler" size={13} />
            <span>纯数式/概念考点</span>
          </span>
          <span>基础定理直读</span>
        </div>

        {/* 核心提示蓝框 */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md, 18px)',
            background: 'rgba(0, 113, 227, 0.06)',
            border: '1px solid rgba(0, 113, 227, 0.18)',
            fontSize: '0.85rem',
            color: 'var(--ios-blue)',
            lineHeight: 1.65,
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <MathRenderer content="本考点聚焦于代数数式运算、逻辑公理与严谨公式定义，无需动力学几何拖拽模拟。" />
        </div>

        {/* 快捷指引 */}
        <p
          style={{
            margin: 0,
            fontSize: '0.72rem',
            color: 'var(--text-tertiary)',
          }}
        >
          您可直接滑动或进入下一步【③ 考点母题】与【④ 单点快练】
        </p>
      </div>
    </div>
  );
};
