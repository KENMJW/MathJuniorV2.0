/**
 * 四维认知素养雷达图 (任务 17.6, PRD §5.4, Property 20)
 *
 * 核心指标：
 * 1. 知识广度 (Knowledge Breadth)：全卷知识考点覆盖与掌握率
 * 2. 深度洞察 (Deep Insight)：中高难度题 (L4~L5 及压轴大题) 突破率
 * 3. 隐蔽条件发掘 (Hidden Condition Discovery)：几何综合与题眼条件洞察力
 * 4. 计算耐受力 (Computational Resilience)：多步代数运算、分式根式与填空精准度
 *
 * [铁律] 安全与跨引擎不变量 (Property 20)：
 * 纯静态 SVG 渲染，绝对不使用 <foreignObject>，兼容 Blink/WebKit/Gecko 三大排版引擎。
 */

import React from 'react';

export interface CognitiveRadarScores {
  breadth: number; // 知识广度 (0~100)
  insight: number; // 深度洞察 (0~100)
  hiddenCondition: number; // 隐蔽条件发掘 (0~100)
  resilience: number; // 计算耐受力 (0~100)
}

export interface RadarChartProps {
  scores: CognitiveRadarScores;
  size?: number;
  className?: string;
  locale?: string;
}

interface DimensionConfig {
  key: keyof CognitiveRadarScores;
  titleZh: string;
  titleEn: string;
  color: string;
  desc: string;
  descEn: string;
}

const DIMENSIONS: DimensionConfig[] = [
  {
    key: 'breadth',
    titleZh: '知识广度',
    titleEn: 'Knowledge Breadth',
    color: "var(--ios-blue)", // iOS Blue
    desc: '覆盖 107 个中考核心知识考点的宽度与基础熟练度',
    descEn: 'Coverage breadth and mastery across core knowledge points',
  },
  {
    key: 'insight',
    titleZh: '深度洞察',
    titleEn: 'Deep Insight',
    color: "var(--ios-purple)", // iOS Purple
    desc: 'L4~L5 压轴题、思维拐点与旗舰动力学模型的洞察能力',
    descEn: 'Insight into L4~L5 challenge problems and flagship models',
  },
  {
    key: 'hiddenCondition',
    titleZh: '隐蔽条件发掘',
    titleEn: 'Hidden Condition Discovery',
    color: "var(--ios-orange)", // iOS Orange
    desc: '几何辅助线添加、特殊位置构造与隐含等量关系识别',
    descEn: 'Identifying auxiliary lines, special configurations & invariants',
  },
  {
    key: 'resilience',
    titleZh: '计算耐受力',
    titleEn: 'Computational Resilience',
    color: "var(--ios-green)", // iOS Green
    desc: '复杂代数运算、多步推导踩分点及无差错变形耐力',
    descEn: 'Multi-step algebraic operations and accurate problem solving',
  },
];

export const RadarChart: React.FC<RadarChartProps> = ({
  scores,
  size = 320,
  className = '',
  locale = 'zh-CN',
}) => {
  const isEn = String(locale).toLowerCase().startsWith('en');
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.68; // 预留四周文本空间

  // 4 个维度的角度分布 (上、右、下、左)
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  // 辅助函数：根据角度与半径计算 (x, y)
  const getPoint = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  // 4 级同心多边形网格 (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons = gridLevels.map((lvl) => {
    return angles
      .map((angle) => {
        const pt = getPoint(angle, radius * lvl);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
  });

  // 学生得分多边形顶点计算
  const scoreValues = [
    Math.max(0, Math.min(100, scores.breadth || 0)),
    Math.max(0, Math.min(100, scores.insight || 0)),
    Math.max(0, Math.min(100, scores.hiddenCondition || 0)),
    Math.max(0, Math.min(100, scores.resilience || 0)),
  ];

  const dataPoints = scoreValues.map((val, idx) => {
    const r = radius * (val / 100);
    return getPoint(angles[idx], r);
  });

  const dataPolygonString = dataPoints
    .map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');

  // 计算综合素养均分
  const avgScore = Math.round(
    scoreValues.reduce((sum, v) => sum + v, 0) / scoreValues.length
  );

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      {/* 纯 SVG 雷达图 (严格无 foreignObject) */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          data-testid="cognitive-radar-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: 'visible' }}
        >
          {/* 背景同心网格与轴线 */}
          <g className="radar-grid" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1">
            {gridPolygons.map((poly, idx) => (
              <polygon
                key={`grid-${idx}`}
                points={poly}
                fill={idx === 3 ? 'rgba(248, 250, 252, 0.4)' : 'none'}
                strokeDasharray={idx < 3 ? '3,3' : 'none'}
              />
            ))}
            {/* 4 条主轴线 */}
            {angles.map((angle, idx) => {
              const edge = getPoint(angle, radius);
              return (
                <line
                  key={`axis-${idx}`}
                  x1={cx}
                  y1={cy}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth="1.2"
                />
              );
            })}
          </g>

          {/* 数据多边形区域 (iOS 27 液态渐变与阴影) */}
          <polygon
            points={dataPolygonString}
            fill="rgba(0, 113, 227, 0.22)"
            stroke="var(--ios-blue)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* 顶点指示圆圈与分值 */}
          {dataPoints.map((pt, idx) => (
            <g key={`point-${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="var(--glass-bg-elevated)"
                stroke="var(--ios-blue)"
                strokeWidth="2.5"
              />
            </g>
          ))}

          {/* 轴端文本标注 (严格使用 SVG <text>，绝不使用 foreignObject) */}
          {DIMENSIONS.map((dim, idx) => {
            const angle = angles[idx];
            const textPt = getPoint(angle, radius + 22);
            const scoreVal = scoreValues[idx];

            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            let dy = '0.35em';

            if (idx === 0) {
              textAnchor = 'middle';
              dy = '-0.6em';
            } else if (idx === 1) {
              textAnchor = 'start';
              dy = '0.35em';
            } else if (idx === 2) {
              textAnchor = 'middle';
              dy = '1.3em';
            } else if (idx === 3) {
              textAnchor = 'end';
              dy = '0.35em';
            }

            return (
              <g key={`label-${dim.key}`}>
                <text
                  x={textPt.x}
                  y={textPt.y}
                  textAnchor={textAnchor}
                  dy={dy}
                  fontSize="12"
                  fontWeight="600"
                  fill="var(--text-primary)"
                >
                  {isEn ? dim.titleEn : dim.titleZh}
                  <tspan
                    dx="4"
                    fontSize="11"
                    fontWeight="700"
                    fill={dim.color}
                  >
                    {scoreVal}{isEn ? ' pts' : '分'}
                  </tspan>
                </text>
              </g>
            );
          })}

          {/* 中心综合指标徽章 */}
          <circle cx={cx} cy={cy} r="18" fill="rgba(255, 255, 255, 0.9)" stroke="rgba(0, 113, 227, 0.2)" strokeWidth="1" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="bold"
            fill="var(--ios-blue)"
          >
            {avgScore}
          </text>
        </svg>
      </div>

      {/* 四维维度量化微说明清单 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          marginTop: '1rem',
          width: '100%',
          maxWidth: '380px',
        }}
      >
        {DIMENSIONS.map((dim, idx) => (
          <div
            key={dim.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0.5rem 0.65rem',
              borderRadius: 'var(--radius-sm, 12px)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isEn ? dim.titleEn : dim.titleZh}
              </span>
              <span
                style={{ fontSize: '0.75rem', fontWeight: 900, color: dim.color }}
              >
                {scoreValues[idx]}{isEn ? ' pts' : '分'}
              </span>
            </div>
            <p
              style={{
                margin: '0.2rem 0 0 0',
                fontSize: '0.65rem',
                color: 'var(--text-tertiary)',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isEn ? dim.descEn : dim.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
