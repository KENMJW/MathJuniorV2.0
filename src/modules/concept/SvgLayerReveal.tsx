import React from 'react';

export type StageNumber = 1 | 2 | 3 | 4;

export interface SvgLayerRevealProps {
  activeStage: StageNumber;
  pointId?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 概念精讲 SVG 图层分步点亮组件 (路线 B)
 * 对应设计文档 §7.1 与 WebKit 避坑规范 (铁律 7 / Property 20)
 *
 * 规范红线：
 * 1. 严格禁止使用 <foreignObject>，文字符号一律矢量 <text> 或矢量路径
 * 2. 动效通过 CSS opacity / transition 呈现
 * 3. 第 2 段隐藏字母标签、第 3 段点亮 formal-labels (opacity 0 -> 1)
 */
export const SvgLayerReveal: React.FC<SvgLayerRevealProps> = ({
  activeStage,
  pointId = 'KP-023',
  className = '',
  style = {},
}) => {
  // 阶段透明度与高亮计算
  const stage1Opacity = 1;
  const stage2Opacity = activeStage >= 2 ? 1 : 0.2;
  const stage3Opacity = activeStage >= 3 ? 1 : 0; // 第 2 段隐藏标签，第 3 段点亮
  const stage4Opacity = activeStage >= 4 ? 1 : 0.15;

  return (
    <div
      className={`svg-layer-reveal ${className}`.trim()}
      data-point-id={pointId}
      data-active-stage={activeStage}
      style={{
        width: '100%',
        maxWidth: '520px',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--glass-bg, rgba(255,255,255,0.7))',
        borderRadius: 'var(--radius-lg, 24px)',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.8))',
        boxShadow: 'var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.06))',
        padding: '1.5rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="100%"
        style={{ overflow: 'visible', userSelect: 'none' }}
      >
        <defs>
          {/* 直角标记与网格滤镜 */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ios-blue)" />
          </marker>
        </defs>

        {/* 图层 1: 原点溯源 (历史原点与背景底图) */}
        <g
          id="layer-stage-1"
          style={{
            opacity: stage1Opacity,
            transition: 'opacity 0.4s var(--spring-smooth, ease)',
          }}
        >
          {/* 背景坐标网格暗线 */}
          <line x1="50" y1="250" x2="450" y2="250" stroke="var(--border-subtle)" strokeDasharray="4 4" />
          <line x1="250" y1="50" x2="250" y2="450" stroke="var(--border-subtle)" strokeDasharray="4 4" />
          {/* 弦图外围辅助大框 */}
          <rect
            x="70"
            y="70"
            width="360"
            height="360"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
            rx="8"
            strokeDasharray="6 6"
          />
          <text x="80" y="95" fill="var(--text-tertiary)" fontSize="13" fontFamily="sans-serif">
            原点溯源：赵爽弦图与面积割补
          </text>
        </g>

        {/* 图层 2: 本真透视 (几何本质：直角三角形与三边正方形面积) */}
        <g
          id="layer-stage-2"
          style={{
            opacity: stage2Opacity,
            transition: 'opacity 0.4s var(--spring-smooth, ease)',
          }}
        >
          {/* 直角三角形本体: C(180, 320), A(180, 200), B(340, 320) */}
          {/* 直角边 a (BC=160), 直角边 b (AC=120), 斜边 c (AB=200) */}
          <polygon
            points="180,320 180,200 340,320"
            fill="rgba(0, 113, 227, 0.12)"
            stroke="var(--ios-blue)"
            strokeWidth="3"
          />

          {/* 直角标记 (Corner at C) */}
          <path
            d="M 180 300 L 200 300 L 200 320"
            fill="none"
            stroke="var(--ios-blue)"
            strokeWidth="2"
          />

          {/* 直角边 b 上的正方形 (面积 b^2) */}
          <rect
            x="60"
            y="200"
            width="120"
            height="120"
            fill="rgba(88, 86, 214, 0.16)"
            stroke="var(--ios-indigo)"
            strokeWidth="2"
          />
          <text
            x="120"
            y="265"
            textAnchor="middle"
            fill="var(--ios-indigo)"
            fontSize="14"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            S_b = b²
          </text>

          {/* 直角边 a 上的正方形 (面积 a^2) */}
          <rect
            x="180"
            y="320"
            width="160"
            height="160"
            fill="rgba(48, 176, 199, 0.16)"
            stroke="var(--ios-teal)"
            strokeWidth="2"
          />
          <text
            x="260"
            y="405"
            textAnchor="middle"
            fill="var(--ios-teal)"
            fontSize="14"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            S_a = a²
          </text>

          {/* 斜边 c 上的正方形 (旋转角度 ~ -36.87°) */}
          <polygon
            points="180,200 340,320 460,160 300,40"
            fill="rgba(52, 199, 89, 0.18)"
            stroke="var(--ios-green)"
            strokeWidth="2"
          />
          <text
            x="320"
            y="185"
            textAnchor="middle"
            fill="var(--ios-green)"
            fontSize="15"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            S_c = c²
          </text>
        </g>

        {/* 图层 3: 法典严定 (符号定义与精确字母标注: A, B, C, a, b, c) */}
        {/* 第 2 段隐藏，第 3 段淡入点亮 opacity 0 -> 1 */}
        <g
          id="layer-stage-3"
          className="formal-labels"
          style={{
            opacity: stage3Opacity,
            transition: 'opacity 0.4s var(--spring-smooth, ease)',
          }}
        >
          {/* 顶点标签 */}
          <circle cx="180" cy="200" r="4" fill="var(--ios-blue)" />
          <text x="170" y="190" fill="var(--text-primary)" fontSize="16" fontWeight="bold" fontFamily="serif">
            A
          </text>

          <circle cx="340" cy="320" r="4" fill="var(--ios-blue)" />
          <text x="355" y="325" fill="var(--text-primary)" fontSize="16" fontWeight="bold" fontFamily="serif">
            B
          </text>

          <circle cx="180" cy="320" r="4" fill="var(--ios-blue)" />
          <text x="165" y="340" fill="var(--text-primary)" fontSize="16" fontWeight="bold" fontFamily="serif">
            C (90°)
          </text>

          {/* 边长标签 */}
          <text x="165" y="260" textAnchor="end" fill="var(--ios-indigo)" fontSize="15" fontFamily="serif">
            b
          </text>
          <text x="260" y="315" textAnchor="middle" fill="var(--ios-teal)" fontSize="15" fontFamily="serif">
            a
          </text>
          <text x="270" y="250" textAnchor="start" fill="var(--ios-green)" fontSize="16" fontFamily="serif">
            c
          </text>

          {/* 定理公式横幅 */}
          <rect
            x="130"
            y="15"
            width="240"
            height="36"
            rx="18"
            fill="var(--glass-bg-elevated)"
            stroke="var(--ios-blue)"
            strokeWidth="1.5"
          />
          <text
            x="250"
            y="39"
            textAnchor="middle"
            fill="var(--ios-blue)"
            fontSize="16"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            a² + b² = c² (∠C = 90°)
          </text>
        </g>

        {/* 图层 4: 本体辨正 (反例与边界条件：钝角 a^2+b^2 < c^2 与 锐角 a^2+b^2 > c^2) */}
        <g
          id="layer-stage-4"
          style={{
            opacity: stage4Opacity,
            transition: 'opacity 0.4s var(--spring-smooth, ease)',
          }}
        >
          {/* 边界虚线圆弧 (直径 AB 的半圆，判定直角/锐角/钝角边界) */}
          <path
            d="M 180 200 A 100 100 0 0 1 340 320"
            fill="none"
            stroke="var(--ios-orange)"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
          <text x="320" y="280" fill="var(--ios-orange)" fontSize="13" fontFamily="sans-serif">
            圆周直角边界
          </text>
          {/* 辨正标签 */}
          <rect
            x="130"
            y="455"
            width="240"
            height="32"
            rx="16"
            fill="rgba(255, 149, 0, 0.12)"
            stroke="var(--ios-orange)"
            strokeWidth="1"
          />
          <text
            x="250"
            y="476"
            textAnchor="middle"
            fill="var(--ios-orange)"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            逆定理: a² + b² = c² ⇔ ∠C = 90°
          </text>
        </g>
      </svg>
    </div>
  );
};

export default SvgLayerReveal;
