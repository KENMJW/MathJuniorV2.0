import React, { useMemo } from 'react';
import { Icon } from '../../components/common/Icon';
import { MathRenderer } from '../../components/math/MathRenderer';
import { useSessionStore } from '../../store/sessionStore';

export interface LineSwimlanePoint {
  point_id: string;
  name_zh: string;
  name_en?: string;
  grade: number;
  semester: number;
}

export interface LineSwimlaneProps {
  lineId: string;
  lineName?: string;
  points: LineSwimlanePoint[];
  className?: string;
  style?: React.CSSProperties;
}

interface SemesterTierConfig {
  grade: number;
  semester: number;
  key: string;
  labelZh: string;        // e.g. "7上"
  labelEn: string;        // e.g. "G7S1"
  semesterNameZh: string; // e.g. "七年级上册"
  semesterNameEn: string; // e.g. "Grade 7 Semester 1"
  badgeColor: string;
}

const SEMESTER_TIERS: SemesterTierConfig[] = [
  { grade: 7, semester: 1, key: '7-1', labelZh: '7上', labelEn: 'G7S1', semesterNameZh: '七年级上册', semesterNameEn: 'Grade 7 Semester 1', badgeColor: '#0071e3' },
  { grade: 7, semester: 2, key: '7-2', labelZh: '7下', labelEn: 'G7S2', semesterNameZh: '七年级下册', semesterNameEn: 'Grade 7 Semester 2', badgeColor: '#0071e3' },
  { grade: 8, semester: 1, key: '8-1', labelZh: '8上', labelEn: 'G8S1', semesterNameZh: '八年级上册', semesterNameEn: 'Grade 8 Semester 1', badgeColor: '#30b0c7' },
  { grade: 8, semester: 2, key: '8-2', labelZh: '8下', labelEn: 'G8S2', semesterNameZh: '八年级下册', semesterNameEn: 'Grade 8 Semester 2', badgeColor: '#30b0c7' },
  { grade: 9, semester: 1, key: '9-1', labelZh: '9上', labelEn: 'G9S1', semesterNameZh: '九年级上册', semesterNameEn: 'Grade 9 Semester 1', badgeColor: '#af52de' },
  { grade: 9, semester: 2, key: '9-2', labelZh: '9下', labelEn: 'G9S2', semesterNameZh: '九年级下册', semesterNameEn: 'Grade 9 Semester 2', badgeColor: '#ff9500' },
];

/**
 * 竖向单谱系泳道图组件 (LineSwimlane)
 *
 * 规范依据：
 * 1. 按初中 6 学期（7上、7下、8上、8下、9上、9下）竖向自顶向下分段排布。
 * 2. 每段展示该谱系在此学期的考点中文名称 (point_id + name_zh)，同学期多考点纵向排列。
 * 3. 若某学期无此谱系考点，展示优雅占位文案 "— 无本谱系考点 —"。
 * 4. 纯展示不可交互，与 ConceptFourStages 浅色文档卡风格保持一致，使用 iOS 27 液态玻璃 Token 与标准圆角/内边距。
 * 5. 严格红线：零 emoji、零 eval、零 innerHTML、零 SVG 外部对象。公式/符号经 MathRenderer 安全解析。
 */
export const LineSwimlane: React.FC<LineSwimlaneProps> = ({
  lineId,
  lineName,
  points = [],
  className = '',
  style = {},
}) => {
  const locale = useSessionStore((state) => state.locale);
  const isEn = String(locale).toLowerCase().startsWith('en');

  // 按 6 学期分桶考点并按 point_id 规范排序
  const tierList = useMemo(() => {
    return SEMESTER_TIERS.map((tier) => {
      const matched = (points || [])
        .filter(
          (p) => Number(p.grade) === tier.grade && Number(p.semester) === tier.semester
        )
        .sort((a, b) => a.point_id.localeCompare(b.point_id, undefined, { numeric: true }));

      return {
        ...tier,
        points: matched,
      };
    });
  }, [points]);

  const totalPointsCount = (points || []).length;

  return (
    <div
      className={`line-swimlane ${className}`.trim()}
      data-testid="line-swimlane"
      data-line-id={lineId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.86))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-md, 18px)',
        padding: '1.25rem',
        border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
        boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.06))',
        boxSizing: 'border-box',
        width: '100%',
        color: 'var(--text-primary)',
        ...style,
      }}
    >
      {/* 顶部标题栏：谱系标识与统计 */}
      <div
        className="line-swimlane-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm, 12px)',
              background: 'rgba(0, 113, 227, 0.08)',
              color: 'var(--ios-blue, #0071e3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="layers" size={15} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {lineName
                ? `${lineName} · ${isEn ? 'Semester Evolution Swimlane' : '学期演进泳道'}`
                : `${lineId} · ${isEn ? 'Semester Evolution Swimlane' : '学期演进泳道'}`}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {isEn
                ? `Junior Math 6 Semesters · Total ${totalPointsCount} Points`
                : `初中 6 学期纵向脉络 · 共 ${totalPointsCount} 个考点`}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-pill, 9999px)',
            background: 'rgba(0, 113, 227, 0.08)',
            color: 'var(--ios-blue, #0071e3)',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'var(--font-family-mono, monospace)',
            flexShrink: 0,
          }}
        >
          {lineId}
        </div>
      </div>

      {/* 竖向单谱系 6 学期泳道主体 */}
      <div
        className="line-swimlane-tiers"
        data-testid="line-swimlane-tiers"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          width: '100%',
        }}
      >
        {tierList.map((tier, index) => {
          const hasPoints = tier.points.length > 0;
          const isLast = index === tierList.length - 1;

          return (
            <div
              key={tier.key}
              className="line-swimlane-tier"
              data-testid={`swimlane-tier-${tier.key}`}
              data-grade={tier.grade}
              data-semester={tier.semester}
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'stretch',
                position: 'relative',
              }}
            >
              {/* 左侧垂直轨道列 */}
              <div
                className="line-swimlane-rail"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '44px',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {/* 学期阶段徽标 (7上 / 7下 / 8上 / 8下 / 9上 / 9下) */}
                <div
                  className="line-swimlane-node"
                  data-testid={`swimlane-node-${tier.key}`}
                  style={{
                    width: '38px',
                    height: '26px',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    background: hasPoints ? `${tier.badgeColor}15` : 'rgba(0, 0, 0, 0.03)',
                    border: hasPoints
                      ? `1.5px solid ${tier.badgeColor}`
                      : '1px dashed rgba(0, 0, 0, 0.15)',
                    color: hasPoints ? tier.badgeColor : 'var(--text-tertiary)',
                    fontSize: '0.75rem',
                    fontWeight: hasPoints ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    zIndex: 1,
                    userSelect: 'none',
                  }}
                >
                  {isEn ? tier.labelEn : tier.labelZh}
                </div>

                {/* 纵向连线轨道 (非末尾段向下延伸连接下一学期) */}
                {!isLast && (
                  <div
                    style={{
                      width: '2px',
                      flex: 1,
                      minHeight: '16px',
                      marginTop: '4px',
                      background: hasPoints
                        ? `linear-gradient(to bottom, ${tier.badgeColor}60, rgba(0, 0, 0, 0.08))`
                        : 'rgba(0, 0, 0, 0.08)',
                      borderLeft: hasPoints ? 'none' : '1px dashed rgba(0, 0, 0, 0.12)',
                    }}
                  />
                )}
              </div>

              {/* 右侧学期考点展示卡片区 */}
              <div
                className="line-swimlane-content"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  paddingBottom: isLast ? 0 : '0.5rem',
                }}
              >
                {/* 学期子标题与考点统计 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '2px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: hasPoints ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {isEn ? tier.semesterNameEn : tier.semesterNameZh}
                    </span>
                  </div>
                  {hasPoints && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: tier.badgeColor,
                        padding: '0.05rem 0.35rem',
                        borderRadius: '4px',
                        background: `${tier.badgeColor}10`,
                      }}
                    >
                      {`${tier.points.length} ${isEn ? 'Points' : '考点'}`}
                    </span>
                  )}
                </div>

                {/* 考点列表 或 占位 */}
                {hasPoints ? (
                  <div
                    className="line-swimlane-points-list"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    {tier.points.map((pt) => {
                      const ptName = isEn ? (pt.name_en || pt.name_zh) : pt.name_zh;
                      return (
                        <div
                          key={pt.point_id}
                          className="line-swimlane-point-item"
                          data-testid={`swimlane-point-${pt.point_id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem',
                            padding: '0.45rem 0.7rem',
                            background: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                            boxSizing: 'border-box',
                            userSelect: 'text',
                          }}
                        >
                          {/* point_id 胶囊 */}
                          <span
                            style={{
                              fontFamily: 'var(--font-family-mono, monospace)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.4rem',
                              borderRadius: '4px',
                              background: 'rgba(0, 113, 227, 0.08)',
                              color: 'var(--ios-blue, #0071e3)',
                              letterSpacing: '0.02em',
                              flexShrink: 0,
                            }}
                          >
                            {pt.point_id}
                          </span>

                          {/* name_zh / name_en 考点名称 (MathRenderer) */}
                          <div
                            style={{
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              lineHeight: 1.4,
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                              flex: 1,
                            }}
                          >
                            <MathRenderer content={ptName} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="line-swimlane-empty-placeholder"
                    data-testid={`swimlane-empty-${tier.key}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: '0.4rem 0.7rem',
                      fontSize: '0.78rem',
                      color: 'var(--text-tertiary)',
                      fontStyle: 'italic',
                      background: 'rgba(0, 0, 0, 0.015)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(0, 0, 0, 0.06)',
                      userSelect: 'none',
                    }}
                  >
                    <span>{isEn ? '— No Points in this Semester —' : '— 无本谱系考点 —'}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LineSwimlane;
