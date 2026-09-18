import React, { useState } from 'react';
import { MathRenderer } from '../../components/math/MathRenderer';
import { SvgLayerReveal, StageNumber } from './SvgLayerReveal';
import { KnowledgePointRecord, FOUR_STAGES_CONFIG } from './types';
import { useSessionStore } from '../../store/sessionStore';
import { getLocalizedField } from '../../engine/i18n/projectLocale';

export interface ConceptFourStagesProps {
  knowledgePoint: KnowledgePointRecord;
  className?: string;
  style?: React.CSSProperties;
  initialStage?: StageNumber;
  locale?: string;
  onStageChange?: (stage: StageNumber) => void;
}

/**
 * 探本溯源·概念精讲 - 四段论单屏自闭环视窗组件 (任务 9.1, 设计文档 §7.1)
 *
 * 铁律规范：
 * 1. 铁律 3：四段文本上屏严格全部经由 MathRenderer 渲染，业务组件严禁裸注入与外部公式库
 * 2. 单屏自闭环设计（非无限下拉瀑布流）：左侧 SVG 矢量图解，右侧四段论导航与深度讲解视窗
 * 3. 联动 SvgLayerReveal：第 2 段隐藏精确字母图层，第 3 段淡入点亮 (formal-labels 图层 opacity 0 -> 1)
 * 4. UI 严格采用 iOS 27 液态玻璃设计 Token
 */
export const ConceptFourStages: React.FC<ConceptFourStagesProps> = ({
  knowledgePoint,
  className = '',
  style = {},
  initialStage = 1,
  locale: propLocale,
  onStageChange,
}) => {
  const [activeStage, setActiveStage] = useState<StageNumber>(initialStage);
  const storeLocale = useSessionStore((state) => state.locale);
  const locale = (propLocale as any) || storeLocale || 'zh-CN';

  const handleStageSelect = (stage: StageNumber) => {
    setActiveStage(stage);
    onStageChange?.(stage);
  };

  const handlePrev = () => {
    if (activeStage > 1) {
      handleStageSelect((activeStage - 1) as StageNumber);
    }
  };

  const handleNext = () => {
    if (activeStage < 4) {
      handleStageSelect((activeStage + 1) as StageNumber);
    }
  };

  // 获取当前考点名称
  const kpName = getLocalizedField(knowledgePoint, 'name', locale);
  const activeMeta = FOUR_STAGES_CONFIG[activeStage - 1];

  // 四段论各段正文内容 (支持双语投影)
  const stageContents = {
    1: getLocalizedField(knowledgePoint, 'origin_story', locale),
    2: getLocalizedField(knowledgePoint, 'intuitive_essence', locale),
    3: getLocalizedField(knowledgePoint, 'formal_definition', locale),
    4: getLocalizedField(knowledgePoint, 'intrinsic_variation', locale),
  };

  return (
    <div
      className={`concept-four-stages ${className}`.trim()}
      data-testid="concept-four-stages"
      data-point-id={knowledgePoint.point_id}
      data-active-stage={activeStage}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.5rem',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.72))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-lg, 24px)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow-deep, 0 20px 50px rgba(0, 0, 0, 0.08))',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        ...style,
      }}
    >
      {/* 顶部标题栏与考点标识 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--glass-border, rgba(0,0,0,0.06))',
          paddingBottom: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'var(--ios-blue-glow, rgba(0, 113, 227, 0.15))',
              color: 'var(--ios-blue)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {knowledgePoint.point_id}
          </span>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600 }}>{kpName}</h2>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.04)',
            }}
          >
            {`${knowledgePoint.grade}年级 ${knowledgePoint.semester === 1 ? '上' : '下'}学期`}
          </span>
        </div>

        {/* 阶段指示器 */}
        <div
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          {`${locale === 'en' ? 'Stage' : '阶段'} ${activeStage} / 4`}
        </div>
      </header>

      {/* 单屏自闭环主内容区：左侧 SVG 矢量图解，右侧四段论视窗 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 480px) 1fr',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}
      >
        {/* 左侧：SVG 图层按段点亮 (路线 B) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SvgLayerReveal
            activeStage={activeStage}
            pointId={knowledgePoint.point_id}
            style={{ width: '100%', height: 'auto', minHeight: '340px' }}
          />
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
            }}
          >
            {locale === 'en'
              ? 'Stage 2 hides label tags; Stage 3 illuminates formal definitions'
              : '第 2 段隐藏字母标签 · 第 3 段点亮精确符号'}
          </div>
        </div>

        {/* 右侧：单屏四段论视窗 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            justifyContent: 'space-between',
            background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.85))',
            borderRadius: 'var(--radius-md, 18px)',
            padding: '1.25rem',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
            boxShadow: 'var(--glass-shadow, 0 8px 24px rgba(0,0,0,0.04))',
          }}
        >
          {/* 四段选项卡 (Segmented Switcher) */}
          <nav
            aria-label="Four Stages Tabs"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.375rem',
              padding: '0.25rem',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 'var(--radius-sm, 12px)',
            }}
          >
            {FOUR_STAGES_CONFIG.map((cfg) => {
              const isSelected = cfg.stage === activeStage;
              const isPassed = cfg.stage < activeStage;
              const title = locale === 'en' ? cfg.titleEn : cfg.titleZh;

              return (
                <button
                  key={cfg.stage}
                  type="button"
                  onClick={() => handleStageSelect(cfg.stage)}
                  data-stage-btn={cfg.stage}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 0.25rem',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--glass-bg-elevated)'
                      : 'transparent',
                    color: isSelected
                      ? 'var(--ios-blue)'
                      : isPassed
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                    boxShadow: isSelected
                      ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                      : 'none',
                    transition: 'all 0.2s var(--spring-smooth, ease)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {title}
                </button>
              );
            })}
          </nav>

          {/* 当前阶段深度讲解卡片 (正文严格全部走 MathRenderer) */}
          <div
            data-testid={`stage-content-${activeStage}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: 'var(--radius-sm, 12px)',
              borderLeft: `4px solid ${activeMeta.tagColor}`,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: activeMeta.tagColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {locale === 'en' ? activeMeta.subtitleEn : activeMeta.subtitleZh}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                {locale === 'en' ? activeMeta.titleEn : activeMeta.titleZh}
              </h3>
            </div>

            {/* 铁律 3：正文内容经 MathRenderer 安全解析上屏 */}
            <div
              className="stage-text-body"
              style={{
                fontSize: '0.98rem',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
              }}
            >
              <MathRenderer
                content={stageContents[activeStage] || ''}
                block
                className="stage-math-content"
              />
            </div>
          </div>

          {/* 四段论完整备选视窗列表 (满足四段全部在视窗内随时可达与渲染校验) */}
          <div
            data-testid="all-stages-manifest"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
            }}
          >
            {FOUR_STAGES_CONFIG.map((cfg) => {
              const isCurrent = cfg.stage === activeStage;
              const snippet = stageContents[cfg.stage];
              return (
                <div
                  key={cfg.stage}
                  onClick={() => handleStageSelect(cfg.stage)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    background: isCurrent ? 'rgba(0, 113, 227, 0.08)' : 'rgba(0,0,0,0.02)',
                    border: isCurrent
                      ? '1px solid var(--ios-blue)'
                      : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: cfg.tagColor }}>
                    {locale === 'en' ? cfg.titleEn : cfg.titleZh}
                  </div>
                  <div
                    style={{
                      maxHeight: '3.6em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {/* 铁律 3：概要依然走 MathRenderer 渲染 */}
                    <MathRenderer content={snippet} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部前后步进器控制 */}
          <footer
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeStage === 1}
              data-testid="stage-prev-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.05)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                cursor: activeStage === 1 ? 'not-allowed' : 'pointer',
                opacity: activeStage === 1 ? 0.4 : 1,
                fontWeight: 500,
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
              }}
            >
              ← {locale === 'en' ? 'Previous' : '上一段'}
            </button>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[1, 2, 3, 4].map((s) => (
                <span
                  key={s}
                  style={{
                    width: s === activeStage ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background:
                      s === activeStage
                        ? 'var(--ios-blue)'
                        : 'rgba(0,0,0,0.15)',
                    transition: 'all 0.3s var(--spring-smooth, ease)',
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={activeStage === 4}
              data-testid="stage-next-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                background:
                  activeStage === 4
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'var(--ios-blue)',
                color: activeStage === 4 ? 'var(--text-secondary)' : "var(--glass-bg-elevated)",
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                cursor: activeStage === 4 ? 'not-allowed' : 'pointer',
                opacity: activeStage === 4 ? 0.4 : 1,
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow:
                  activeStage === 4 ? 'none' : '0 4px 12px var(--ios-blue-glow)',
              }}
            >
              {activeStage === 4
                ? locale === 'en'
                  ? 'Completed'
                  : '四段完成'
                : locale === 'en'
                ? 'Next →'
                : '下一段 →'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ConceptFourStages;
