/**
 * 链接沙盒插槽与 CLS=0 防抖等大占位卡 (任务 9.2, 设计文档 §7.1, 铁律 3, 铁律 10)
 *
 * 核心设计：
 * 1. 考点有 sandbox_id 且有 config 时：挂载通用声明式 <SandboxRenderer>，渲染动态几何动力学探究画布；
 * 2. 考点无 sandbox_id 时：渲染物理等大的占位卡（默认 560px 高度，与沙盒严格等大），确保视口防跳动（Cumulative Layout Shift, CLS = 0）；
 * 3. 文本上屏全部经由 <MathRenderer> 渲染；
 * 4. 严格遵循 iOS 27 液态玻璃设计 Token。
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SandboxConfig, SandboxRenderer } from '../sandbox/SandboxRenderer';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import '../sandbox/sandbox.css';

export interface LinkedSandboxSlotProps {
  sandboxId?: string | null;
  config?: SandboxConfig | null;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  pointNameZh?: string;
  locale?: string;
}

export const LinkedSandboxSlot: React.FC<LinkedSandboxSlotProps> = ({
  sandboxId,
  config,
  height = 560,
  className = '',
  style = {},
  pointNameZh: _pointNameZh = '当前知识考点',
  locale = 'zh-CN',
}) => {
  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  const isEn = String(locale).toLowerCase().startsWith('en');

  // 解析当前沙盒的参数滑块规格
  const sliders: Array<{
    id: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
  }> = useMemo(() => {
    try {
      if (config?.param_sliders_json) {
        const parsed = JSON.parse(config.param_sliders_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => ({
            id: String(s.id),
            name: String((isEn ? s.nameEn : s.nameZh) || s.name || s.nameZh || s.id),
            min: s.min !== undefined ? Number(s.min) : 0,
            max: s.max !== undefined ? Number(s.max) : 10,
            default: s.default !== undefined ? Number(s.default) : 5,
            step: s.step !== undefined ? Number(s.step) : 0.5,
            unit: s.unit || '',
          }));
        }
      }
    } catch (e) {}

    return [
      { id: 'scale', name: isEn ? 'Geometric Scale' : '几何缩放', min: 0.5, max: 2.5, default: 1.0, step: 0.1, unit: '' },
    ];
  }, [config, isEn]);

  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [invariants, setInvariants] = useState<Array<{ id: string; text: string; isConstant: boolean }>>([]);

  useEffect(() => {
    const initial: Record<string, number> = {};
    sliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setParamValues(initial);
  }, [sandboxId, sliders]);

  // 分支 1：有沙盒且配置完备，渲染 SandboxRenderer + 参数控制条 + 遥测栏
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
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          boxSizing: 'border-box',
          backgroundColor: 'var(--bg-card, #ffffff)',
          ...style,
        }}
      >
        {/* 画布主视口 + 侧边不变量遥测栏 */}
        <div className="sandbox-split-box" style={{ flex: 1, minHeight: 0, display: 'flex', gap: '14px' }}>
          <div className="sandbox-viewport-85" style={{ flex: '1 1 78%', height: '100%', minHeight: 0 }}>
            <SandboxRenderer
              key={sandboxId}
              config={config}
              paramValues={paramValues}
              onInvariantsChange={setInvariants}
              locale={locale}
              style={{ height: '100%', width: '100%' }}
            />
          </div>

          <div className="sandbox-guide-15" style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="telemetry-readings">
              <span className="telemetry-tag-invariant">
                {isEn ? 'Invariant: ' : '几何不变量：'}{invariants[0]?.text || (isEn ? 'Area and segment ratio conserved' : '面积与线段比例守恒')}
              </span>
              <span className="telemetry-tag-secondary">
                {isEn ? 'Status: ' : '状态：'}{invariants[0]?.isConstant ? (isEn ? '[Absolute Invariant]' : '[绝对恒定]') : (isEn ? '[Dynamic Observation]' : '[动态观测中]')}
              </span>
            </div>
            <div className="telemetry-tag-conclusion">
              {isEn ? 'Conclusion: Geometric intuitive verification passed' : '结论：几何直观验证通过'}
            </div>
          </div>
        </div>

        {/* 底部参数滑块控制条 */}
        <div className="sandbox-controls-bar">
          <div style={{ display: 'flex', gap: '20px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
            {sliders.map((s) => {
              const val = paramValues[s.id] ?? s.default;
              return (
                <div key={s.id} className="slider-group">
                  <label htmlFor={`linked-slider-${s.id}`} style={{ whiteSpace: 'nowrap' }}>
                    {s.name}: <strong style={{ color: 'var(--ios-blue)' }}>{val}{s.unit || ''}</strong>
                  </label>
                  <input
                    id={`linked-slider-${s.id}`}
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step || 0.1}
                    value={val}
                    onChange={(e) => {
                      const next = parseFloat(e.target.value);
                      setParamValues((prev) => ({ ...prev, [s.id]: next }));
                    }}
                    style={{ cursor: 'pointer', accentColor: 'var(--ios-blue)' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
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
