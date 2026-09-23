/**
 * 全局唯一伴随数学符号键盘 (任务 17.5, PRD §5.4, 铁律 3)
 *
 * 核心特性：
 * 1. 全局单例呼出，杜绝每道题重复堆砌符号面板；
 * 2. 仅在光标聚焦于填空/解答输入框时轻量弹出；
 * 3. 涵盖初中中考高频符号（指数、根号、分式、几何、逻辑推理）；
 * 4. 实时公式预览条，严格通过 <MathRenderer> 渲染。
 */

import React, { useState } from 'react';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { useSessionStore } from '../../store/sessionStore';

export interface MathKeyboardProps {
  visible: boolean;
  currentValue: string;
  onInsert: (token: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onClose: () => void;
  targetTitle?: string;
  locale?: string;
}

interface SymbolKey {
  label: string;
  display?: string;
  insert: string;
  category: 'algebra' | 'relation' | 'geometry' | 'quick';
}

const getSymbolKeys = (isEn: boolean): SymbolKey[] => [
  // 常用代数与分式根幂
  { label: 'x²', display: 'x^2', insert: '^2', category: 'algebra' },
  { label: 'xⁿ', display: 'x^n', insert: '^{}', category: 'algebra' },
  { label: '√x', display: '\\sqrt{x}', insert: '\\sqrt{}', category: 'algebra' },
  { label: 'a/b', display: '\\frac{a}{b}', insert: '\\frac{}{}', category: 'algebra' },
  { label: 'π', display: '\\pi', insert: '\\pi', category: 'algebra' },
  { label: '±', display: '\\pm', insert: '\\pm', category: 'algebra' },
  { label: 'x', display: 'x', insert: 'x', category: 'algebra' },
  { label: 'y', display: 'y', insert: 'y', category: 'algebra' },
  { label: '(', display: '(', insert: '(', category: 'algebra' },
  { label: ')', display: ')', insert: ')', category: 'algebra' },

  // 关系与比较
  { label: '=', display: '=', insert: '=', category: 'relation' },
  { label: '≠', display: '\\neq', insert: '\\neq', category: 'relation' },
  { label: '≤', display: '\\le', insert: '\\le', category: 'relation' },
  { label: '≥', display: '\\ge', insert: '\\ge', category: 'relation' },
  { label: '≈', display: '\\approx', insert: '\\approx', category: 'relation' },
  { label: '∽', display: '\\sim', insert: '\\sim', category: 'relation' },
  { label: '≌', display: '\\cong', insert: '\\cong', category: 'relation' },
  { label: '+', display: '+', insert: '+', category: 'relation' },
  { label: '-', display: '-', insert: '-', category: 'relation' },
  { label: '×', display: '\\times', insert: '\\times', category: 'relation' },
  { label: '÷', display: '\\div', insert: '\\div', category: 'relation' },

  // 几何与推理逻辑
  { label: '∠', display: '\\angle', insert: '\\angle ', category: 'geometry' },
  { label: 'Rt△', display: '\\text{Rt}\\triangle', insert: '\\text{Rt}\\triangle ', category: 'geometry' },
  { label: '△', display: '\\triangle', insert: '\\triangle ', category: 'geometry' },
  { label: '⊥', display: '\\perp', insert: '\\perp', category: 'geometry' },
  { label: '∥', display: '\\parallel', insert: '\\parallel', category: 'geometry' },
  { label: '∵', display: '\\because', insert: '\\because ', category: 'geometry' },
  { label: '∴', display: '\\therefore', insert: '\\therefore ', category: 'geometry' },
  { label: '⊙', display: '\\odot', insert: '\\odot ', category: 'geometry' },
  { label: '°', display: '^{\\circ}', insert: '^{\\circ}', category: 'geometry' },

  // 快捷规范话术
  { label: 'x = ', display: 'x=', insert: 'x = ', category: 'quick' },
  { label: 'y = ', display: 'y=', insert: 'y = ', category: 'quick' },
  { label: isEn ? ' or ' : ' 或 ', display: isEn ? '\\text{or}' : '\\text{或}', insert: isEn ? ' or ' : ' 或 ', category: 'quick' },
  { label: isEn ? 'Let' : '设未知数', display: isEn ? '\\text{Let }' : '\\text{解：设}', insert: isEn ? 'Let ' : '解：设 ', category: 'quick' },
];

export const MathKeyboard: React.FC<MathKeyboardProps> = ({
  visible,
  currentValue,
  onInsert,
  onBackspace,
  onClear,
  onClose,
  targetTitle,
  locale: propLocale,
}) => {
  const storeLocale = useSessionStore((s) => s.locale);
  const activeLocale = propLocale || storeLocale;
  const isEn = String(activeLocale).toLowerCase().startsWith('en');
  const displayTargetTitle = targetTitle ?? (isEn ? 'Current Input' : '当前作答输入框');
  const symbolKeys = getSymbolKeys(isEn);

  const [activeCategory, setActiveCategory] = useState<'all' | 'algebra' | 'relation' | 'geometry'>(
    'all'
  );

  if (!visible) return null;

  const filteredKeys =
    activeCategory === 'all'
      ? symbolKeys
      : symbolKeys.filter((k) => k.category === activeCategory);

  return (
    <div
      data-testid="math-keyboard-panel"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        padding: '0.75rem 1rem',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.95))',
        borderTop: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.12)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '880px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}
      >
        {/* 顶部栏：标题、即时 KaTeX 预览与操作按钮 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-sm, 12px)',
                background: 'rgba(0, 113, 227, 0.1)',
                color: 'var(--ios-blue)',
                flexShrink: 0,
              }}
            >
              <Icon name="keyboard" size={13} />
              <span>{isEn ? 'Math Keyboard' : '数学键盘'}</span>
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayTargetTitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onBackspace}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              title={isEn ? 'Backspace' : '退格删除'}
            >
              <Icon name="backspace" size={12} />
              <span>{isEn ? 'Backspace' : '退格'}</span>
            </button>
            <button
              type="button"
              onClick={onClear}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              title={isEn ? 'Clear' : '清空当前内容'}
            >
              {isEn ? 'Clear' : '清空'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '8px',
                background: 'var(--ios-blue)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px var(--ios-blue-glow)',
              }}
              title={isEn ? 'Done' : '收起键盘'}
            >
              <span>{isEn ? 'Done' : '完成'}</span>
              <Icon name="check" size={12} />
            </button>
          </div>
        </div>

        {/* 实时 KaTeX 公式预览视窗 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm, 12px)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            minHeight: '36px',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-tertiary)',
              fontFamily: 'monospace',
              flexShrink: 0,
            }}
          >
            {isEn ? 'Preview:' : '渲染预览:'}
          </span>
          <div
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {currentValue ? (
              <MathRenderer content={currentValue} />
            ) : (
              <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                {isEn ? 'Cursor ready. Click symbols below to insert.' : '光标聚焦已就绪，点击下方符号快捷插入'}
              </span>
            )}
          </div>
        </div>

        {/* 快捷分类选项卡 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            overflowX: 'auto',
            fontSize: '0.72rem',
            paddingBottom: '0.2rem',
          }}
        >
          {[
            { key: 'all', label: isEn ? `All (${symbolKeys.length})` : `全部 (${symbolKeys.length})` },
            { key: 'algebra', label: isEn ? 'Algebra & Powers' : '代数与根幂' },
            { key: 'relation', label: isEn ? 'Relations & Ops' : '关系与运算' },
            { key: 'geometry', label: isEn ? 'Geometry & Logic' : '几何与逻辑' },
          ].map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key as any)}
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--text-primary)' : 'transparent',
                  color: isActive ? 'var(--bg-card)' : 'var(--text-secondary)',
                  transition: 'all 0.15s var(--spring-smooth)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 符号按键网格 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
            gap: '0.4rem',
            maxHeight: '140px',
            overflowY: 'auto',
            padding: '0.2rem',
          }}
        >
          {filteredKeys.map((k, idx) => (
            <button
              key={`${k.label}-${idx}`}
              type="button"
              onClick={() => onInsert(k.insert)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '36px',
                padding: '0 0.25rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s var(--spring-smooth)',
              }}
            >
              {k.display ? <MathRenderer content={`$${k.display}$`} /> : k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
