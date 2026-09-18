/**
 * 考点母题步进解锁组件 (任务 9.3, 设计文档 §7.1, 铁律 3, 铁律 10)
 *
 * 核心特性：
 * 1. 读 master_examples 表中 example_type='point_master' 的记录；
 * 2. 四维解析体系：dim1_origin(直观源头)、dim2_essence(数学本质)、dim3_rigor(严谨推导)、dim4_traps(变式陷阱)；
 * 3. [铁律约束] (CT-6)：dim3_rigor (严谨证明) 必展示，不可被隐藏；
 * 4. 铁律 3：全部公式与文本均走 <MathRenderer>。
 */

import React, { useState } from 'react';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';

export interface MasterExampleItem {
  example_id: string;
  example_type?: 'point_master' | 'line_master' | string;
  bound_target_id?: string;
  primary_point_id?: string;
  source?: string | null;
  stem_zh: string;
  stem_en?: string | null;
  options_json?: string | null;
  correct_option?: string | null;
  answer_standard?: string;
  dim1_origin?: string | null;
  dim2_essence?: string | null;
  dim3_rigor: string; // 严谨证明：非空，必展示
  dim4_traps?: string | null;
  available_dimensions?: number; // 默认 4
}

export interface PointMasterExampleProps {
  example: MasterExampleItem;
  className?: string;
  style?: React.CSSProperties;
}

interface DimensionMeta {
  index: number;
  key: string;
  titleZh: string;
  titleEn: string;
  icon: string;
  isMandatory?: boolean;
}

const DIMENSIONS_META: DimensionMeta[] = [
  { index: 1, key: 'dim1', titleZh: '直观具象本源', titleEn: 'Intuitive Origin', icon: 'sprout' },
  { index: 2, key: 'dim2', titleZh: '核心数学本质', titleEn: 'Core Essence', icon: 'gem' },
  { index: 3, key: 'dim3', titleZh: '严谨推导证明', titleEn: 'Rigor & Proof', icon: 'bolt', isMandatory: true },
  { index: 4, key: 'dim4', titleZh: '高阶易错变式', titleEn: 'Traps & Variations', icon: 'target' },
];

export const PointMasterExample: React.FC<PointMasterExampleProps> = ({
  example,
  className = '',
  style = {},
}) => {
  // 可用维度上限 (默认 4)
  const maxAvailable = Math.max(3, Math.min(4, example.available_dimensions ?? 4));

  // 当前已解锁的最高层级 (默认解锁至第 1 维，dim3 额外恒必展示)
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  // 步进解锁下一维
  const handleUnlockNext = () => {
    setUnlockedLevel((prev) => Math.min(maxAvailable, prev + 1));
  };

  // 获取对应维度的内容
  const getDimensionContent = (index: number): string => {
    switch (index) {
      case 1:
        return example.dim1_origin || '（待补充直观源头）';
      case 2:
        return example.dim2_essence || '（待补充数学本质）';
      case 3:
        return example.dim3_rigor; // 严谨证明 (必填必展示)
      case 4:
        return example.dim4_traps || '（待补充易错变式）';
      default:
        return '';
    }
  };

  // 解析选择题选项 (如有)
  let optionsMap: Record<string, { zh: string; en?: string }> = {};
  try {
    if (example.options_json) {
      optionsMap = JSON.parse(example.options_json);
    }
  } catch {
    optionsMap = {};
  }

  return (
    <div
      data-testid="point-master-example-card"
      className={className}
      style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg, 24px)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* 头部元信息 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: 'rgba(0, 113, 227, 0.1)',
                color: 'var(--ios-blue)',
                border: '1px solid rgba(0, 113, 227, 0.2)',
              }}
            >
              ME 考点母题 · {example.example_id}
            </span>
            {example.source && (
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                {example.source}
              </span>
            )}
          </div>
          <h2
            style={{
              margin: '0.25rem 0 0 0',
              fontSize: '1.15rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
            }}
          >
            压轴母题深度拆解 (四维步进透视)
          </h2>
        </div>

        {/* 步进进度指示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            解锁进度：<strong style={{ color: 'var(--ios-blue)' }}>{unlockedLevel}</strong> / {maxAvailable} 维
          </span>
          {unlockedLevel < maxAvailable && (
            <button
              type="button"
              onClick={handleUnlockNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm, 12px)',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'var(--ios-blue)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--ios-blue-glow)',
                transition: 'all 0.15s var(--spring-smooth)',
              }}
            >
              <Icon name="unlock" size={13} />
              <span>{`步进解锁第 ${unlockedLevel + 1} 维`}</span>
            </button>
          )}
        </div>
      </div>

      {/* 母题题干 (严格走 MathRenderer) */}
      <div
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md, 18px)',
          background: 'var(--bg-card-hover)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          母题题干
        </span>
        <div
          style={{
            fontSize: '0.92rem',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
          }}
        >
          <MathRenderer content={example.stem_zh} />
        </div>

        {/* 若有备选选项 */}
        {Object.keys(optionsMap).length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.5rem',
              paddingTop: '0.5rem',
            }}
          >
            {['A', 'B', 'C', 'D'].map((k) => {
              const opt = optionsMap[k];
              if (!opt) return null;
              const isCorrect = (example.correct_option || example.answer_standard) === k;
              return (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm, 12px)',
                    border: isCorrect
                      ? '1px solid var(--ios-blue)'
                      : '1px solid var(--border-subtle)',
                    background: isCorrect
                      ? 'rgba(0, 113, 227, 0.08)'
                      : 'var(--bg-card)',
                    fontSize: '0.84rem',
                    fontWeight: isCorrect ? 600 : 400,
                  }}
                >
                  <span style={{ fontWeight: 800, color: 'var(--ios-blue)' }}>{k}.</span>
                  <div style={{ flex: 1, overflowX: 'auto' }}>
                    <MathRenderer content={opt.zh} />
                  </div>
                  {isCorrect && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: 'var(--ios-blue)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="check" size={12} />
                      <span>正解</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 四维步进卡片序列 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          四维认知透视演进
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {DIMENSIONS_META.map((dim) => {
            const isUnlocked = dim.index <= unlockedLevel;
            const isMandatoryDim3 = dim.isMandatory === true; // dim3_rigor 恒必展示 (CT-6)
            const shouldRender = isUnlocked || isMandatoryDim3;
            const content = getDimensionContent(dim.index);

            if (!shouldRender) {
              return (
                <div
                  key={dim.key}
                  data-testid={`master-dim-card-${dim.index}-locked`}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md, 18px)',
                    border: '1px dashed var(--border-subtle)',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '0.5rem',
                    userSelect: 'none',
                  }}
                >
                  <Icon name="lock" size={24} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {`第 ${dim.index} 维 · ${dim.titleZh}`}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    点击上方按钮完成当前步骤后自动步进解锁
                  </p>
                </div>
              );
            }

            return (
              <div
                key={dim.key}
                data-testid={`master-dim-card-${dim.index}`}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md, 18px)',
                  border: isMandatoryDim3
                    ? '1px solid rgba(0, 113, 227, 0.35)'
                    : '1px solid var(--border-subtle)',
                  background: isMandatoryDim3
                    ? 'rgba(0, 113, 227, 0.04)'
                    : 'var(--glass-bg-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: 'var(--glass-shadow)',
                  transition: 'all 0.2s var(--spring-smooth)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon name={dim.icon} size={16} />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {`第 ${dim.index} 维 · ${dim.titleZh}`}
                    </h4>
                  </div>

                  {isMandatoryDim3 ? (
                    <span
                      style={{
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-pill, 9999px)',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        background: 'var(--ios-blue)',
                        color: '#ffffff',
                      }}
                    >
                      必修论证 (dim3 必展示)
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-pill, 9999px)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'rgba(52, 199, 89, 0.12)',
                        color: 'var(--ios-green)',
                        border: '1px solid rgba(52, 199, 89, 0.25)',
                      }}
                    >
                      已解锁
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  <MathRenderer content={content} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
