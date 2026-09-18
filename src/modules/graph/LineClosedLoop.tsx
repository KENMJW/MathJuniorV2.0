import React, { useState, useEffect } from 'react';
import { LogicLine, LineMasterExample } from './types';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { LineQuickPractice } from './LineQuickPractice';
import { mockLogicLines, mockLineMasterExamples } from './mockGraphData';
import { useSessionStore } from '../../store/sessionStore';
import { dbClient } from '../../engine/db/dbClient';

export interface LineClosedLoopProps {
  line?: LogicLine;
  masterExample?: LineMasterExample;
  onOpenFlagshipModel?: (modelId: string) => void;
  onBackToMap?: () => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 任务 10.4: 主线四位一体闭环 (LineClosedLoop)
 *
 * 核心要素：
 * ① 主线精讲：源头基石、螺旋跃迁、思想方法、中考矩阵（四段字段上屏走 MathRenderer）
 * ② 实验室二旗舰模型：flagship_model_id 直达跳转
 * ③ 主线压轴母题：ME-LINE-xx 1~4维解剖展示（dim3 严密推导必填，得分率白皮书）
 * ④ 主线快练：嵌入 LineQuickPractice（锁定 L4~L6 综合强化题）
 *
 * 铁律规范：
 * 1. [铁律 3]: 所有文本公式上屏必须经由 <MathRenderer> 出口，严禁裸 innerHTML。
 * 2. [铁律 4]: 零学情诊断，纯客观知识结构与解剖呈现。
 * 3. [铁律 10]: 采用 iOS 27 液态玻璃设计系统 Token。
 */
export const LineClosedLoop: React.FC<LineClosedLoopProps> = ({
  line = mockLogicLines.find((l) => l.line_id === 'G4') || mockLogicLines[0],
  masterExample,
  onOpenFlagshipModel,
  onBackToMap,
  locale: propLocale,
  className,
  style,
}) => {
  const sessionLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || sessionLocale;

  const [activeTab, setActiveTab] = useState<'lecture' | 'master' | 'practice'>('lecture');

  const [dbMasterExample, setDbMasterExample] = useState<LineMasterExample | null>(null);

  useEffect(() => {
    let active = true;
    async function loadLineMaster() {
      try {
        const row = await dbClient.queryOne<any>(
          'master',
          'SELECT * FROM master_examples WHERE bound_target_id = ? OR example_id = ? OR bound_line_id = ? LIMIT 1',
          [line.line_id, line.master_example_id || `ME-LINE-${line.line_id}`, line.line_id]
        );
        if (active && row) {
          setDbMasterExample({
            example_id: String(row.example_id),
            example_type: 'line_master',
            bound_target_id: String(row.bound_target_id || line.line_id),
            source: String(row.source || ''),
            stem_zh: String(row.stem_zh || ''),
            stem_en: String(row.stem_en || ''),
            options_json: row.options_json,
            correct_option: row.correct_option,
            dim1_origin: row.dim1_origin,
            dim2_essence: row.dim2_essence,
            dim3_rigor: String(row.dim3_rigor || ''),
            dim4_traps: row.dim4_traps,
            bound_line_id: String(row.bound_line_id || line.line_id),
            empirical_scoring_rate: row.empirical_scoring_rate,
          });
        }
      } catch {
        if (active) setDbMasterExample(null);
      }
    }
    loadLineMaster();
    return () => {
      active = false;
    };
  }, [line.line_id, line.master_example_id]);

  const resolvedMasterExample: LineMasterExample | undefined =
    masterExample ||
    dbMasterExample ||
    (line.master_example_id ? mockLineMasterExamples[line.master_example_id] : undefined) ||
    mockLineMasterExamples[`ME-LINE-${line.line_id}`];

  const flagshipModelId = line.flagship_model_id || 'LM-8A-01';

  return (
    <div
      className={`line-closed-loop ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '1.5rem',
        borderRadius: 'var(--radius-card, 18px)',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
        backdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow-deep, 0 20px 60px -10px rgba(0,20,60,0.12))',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* 顶栏：主线标识、领域色标与返回按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBackToMap && (
            <button
              type="button"
              onClick={onBackToMap}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                border: '1px solid rgba(0,0,0,0.12)',
                background: 'white',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              ← {locale === 'en' ? 'Back to Map' : '返回图谱'}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '8px',
                background: 'var(--ios-blue)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              {line.line_id}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {locale === 'en' ? line.name_en : line.name_zh}
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ({line.domain} · {line.semester_span})
            </span>
          </div>
        </div>

        {/* 四位一体分段控制器 (Segmented Control) */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(0,0,0,0.06)',
            padding: '0.2rem',
            borderRadius: 'var(--radius-pill, 9999px)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('lecture')}
            style={{
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: activeTab === 'lecture' ? 'var(--glass-bg-elevated)' : 'transparent',
              fontWeight: activeTab === 'lecture' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.84rem',
              boxShadow: activeTab === 'lecture' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            ① 主线精讲
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            style={{
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: activeTab === 'master' ? 'var(--glass-bg-elevated)' : 'transparent',
              fontWeight: activeTab === 'master' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.84rem',
              boxShadow: activeTab === 'master' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            ③ 主线母题
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            style={{
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: activeTab === 'practice' ? 'var(--glass-bg-elevated)' : 'transparent',
              fontWeight: activeTab === 'practice' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.84rem',
              boxShadow: activeTab === 'practice' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            ④ 主线快练 (L4~L6)
          </button>
        </div>
      </div>

      {/* ② 旗舰跃迁模型横幅跳板 (始终展示于顶部引导处) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(88,86,214,0.08) 0%, rgba(175,82,222,0.12) 100%)',
          border: '1px solid rgba(175,82,222,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Icon name="flask" size={22} style={{ color: 'var(--ios-purple)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              ② {locale === 'en' ? 'Flagship Leap Sandbox Model' : '实验室二旗舰模型'}：
              <span style={{ color: 'var(--ios-purple)', marginLeft: '0.35rem' }}>
                {flagshipModelId}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {locale === 'en'
                ? 'High-dimension 4D morphing sandbox: carrier, parameter, posture, and camouflage.'
                : '载体变异 · 参数变异 · 姿态变异 · 干扰加壳 + X-Ray 骨架透视'}
            </div>
          </div>
        </div>

        {onOpenFlagshipModel && (
          <button
            type="button"
            onClick={() => onOpenFlagshipModel(flagshipModelId)}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              border: 'none',
              background: 'var(--ios-purple)',
              color: 'var(--glass-bg-elevated)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(175,82,222,0.3)',
              transition: 'transform 0.15s ease',
            }}
          >
            {locale === 'en' ? 'Launch 4D Leap Lab →' : '进入 4D 变异探究 →'}
          </button>
        )}
      </div>

      {/* 主体切换视图 */}
      {activeTab === 'lecture' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* 1. 源头基石 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="sprout" size={18} style={{ color: 'var(--ios-blue)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-blue)' }}>
                {locale === 'en' ? 'Origin & Foundation' : '源头基石'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? line.origin_foundation_en || 'Conceptual origin of this logic line.'
                    : line.origin_foundation_zh || '本主线的认知源头与现实数学抽象基石。'
                }
              />
            </div>
          </div>

          {/* 2. 螺旋跃迁 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="spiral" size={18} style={{ color: 'var(--ios-indigo)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-indigo)' }}>
                {locale === 'en' ? 'Spiral Leaps' : '螺旋跃迁路径'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? line.spiral_leaps_en || 'Evolutionary trajectory across semesters.'
                    : line.spiral_leaps_zh || '跨学期知识演化与思维进阶轨迹。'
                }
              />
            </div>
          </div>

          {/* 3. 思想方法 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="brain" size={18} style={{ color: 'var(--ios-green)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-green)' }}>
                {locale === 'en' ? 'Mathematical Methodology' : '核心思想方法'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? line.methodology_en || 'Methodological mindset and core problem solving.'
                    : line.methodology_zh || '数形结合、转化化归等数学思维方法精炼。'
                }
              />
            </div>
          </div>

          {/* 4. 中考矩阵 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="target" size={18} style={{ color: 'var(--ios-orange)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-orange)' }}>
                {locale === 'en' ? 'Exam Matrix' : '中考压轴矩阵'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? line.exam_matrix_en || 'High-frequency exam formats and trap analysis.'
                    : line.exam_matrix_zh || '中考压轴题型、考频矩阵与生死解题红线。'
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ③ 主线母题展示 */}
      {activeTab === 'master' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {resolvedMasterExample ? (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '14px',
                background: 'var(--glass-bg-elevated)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              {/* 母题标头 & 得分率 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.6rem',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(0,113,227,0.1)',
                      color: 'var(--ios-blue)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      marginRight: '0.5rem',
                    }}
                  >
                    {resolvedMasterExample.example_id}
                  </span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {resolvedMasterExample.source}
                  </span>
                </div>

                {resolvedMasterExample.empirical_scoring_rate !== null &&
                  resolvedMasterExample.empirical_scoring_rate !== undefined && (
                    <div
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-pill, 9999px)',
                        background: 'rgba(255,59,48,0.1)',
                        color: 'var(--ios-red)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                      }}
                    >
                      官方实测得分率: {(resolvedMasterExample.empirical_scoring_rate * 100).toFixed(0)}%
                    </div>
                  )}
              </div>

              {/* 母题题干 (MathRenderer) */}
              <div style={{ fontSize: '0.96rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                <MathRenderer
                  content={locale === 'en' ? resolvedMasterExample.stem_en : resolvedMasterExample.stem_zh}
                />
              </div>

              {/* 1~4 维自适应解剖 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {resolvedMasterExample.dim1_origin && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(0,113,227,0.04)',
                      borderLeft: '3px solid var(--ios-blue)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-blue)', marginBottom: '0.25rem' }}>
                      ① 维度一：原点建模 / 题眼挖掘
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      <MathRenderer content={resolvedMasterExample.dim1_origin} />
                    </div>
                  </div>
                )}

                {resolvedMasterExample.dim2_essence && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(52,199,89,0.04)',
                      borderLeft: '3px solid var(--ios-green)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-green)', marginBottom: '0.25rem' }}>
                      ② 维度二：几何不变 / 本质直观
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      <MathRenderer content={resolvedMasterExample.dim2_essence} />
                    </div>
                  </div>
                )}

                {/* 维度三：严密推导 (CT-6 必填) */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(88,86,214,0.05)',
                    borderLeft: '3px solid var(--ios-indigo)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-indigo)', marginBottom: '0.25rem' }}>
                    ③ 维度三：严密推导与生死红线 (必填推导)
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    <MathRenderer content={resolvedMasterExample.dim3_rigor} />
                  </div>
                </div>

                {resolvedMasterExample.dim4_traps && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(255,149,0,0.04)',
                      borderLeft: '3px solid var(--ios-orange)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-orange)', marginBottom: '0.25rem' }}>
                      ④ 维度四：极端反例与致命变式
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      <MathRenderer content={resolvedMasterExample.dim4_traps} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              未找到该主线的经典压轴母题数据。
            </div>
          )}
        </div>
      )}

      {/* ④ 主线快练 (嵌入式渲染，难度锁 L4~L6) */}
      {activeTab === 'practice' && (
        <LineQuickPractice
          lineId={line.line_id}
          lineName={locale === 'en' ? line.name_en : line.name_zh}
          locale={locale}
        />
      )}
    </div>
  );
};
