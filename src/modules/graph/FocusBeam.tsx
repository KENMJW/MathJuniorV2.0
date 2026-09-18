import React from 'react';

export interface PointCoord {
  x: number;
  y: number;
}

export interface FocusBeamProps {
  focusedPointId: string | null;
  nodeCoords: Record<string, PointCoord>;
  predecessors: string[]; // 前置考点 ID 集合 (入度)
  successors: string[]; // 后继考点 ID 集合 (出度)
}

/**
 * 任务 10.2: 焦点穿透光束 (FocusBeam)
 * 规范要求:
 * - 点击任意考点:
 *   - 读 predecessors 渲染蓝色入度光束 (var(--ios-blue)，前置地基)
 *   - 读 successors 渲染紫色出度光束 (var(--ios-purple)，后继演化)
 * - 纯 SVG 矢量渲染，严禁使用 foreignObject 标签 (铁律 7)
 * - 零学情着色、零红色脉冲、零根因诊断 (铁律 4)
 */
export const FocusBeam: React.FC<FocusBeamProps> = ({
  focusedPointId,
  nodeCoords,
  predecessors,
  successors,
}) => {
  if (!focusedPointId) return null;

  const targetCoord = nodeCoords[focusedPointId];
  if (!targetCoord) return null;

  // 生成平滑贝塞尔连接路径
  const generateSmoothPath = (from: PointCoord, to: PointCoord): string => {
    const dx = to.x - from.x;
    const cp1x = from.x + dx * 0.5;
    const cp1y = from.y;
    const cp2x = from.x + dx * 0.5;
    const cp2y = to.y;
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  };

  return (
    <g className="focus-beam-layer" pointerEvents="none">
      <defs>
        {/* 蓝色入度箭头 (前置地基) */}
        <marker
          id="beam-arrow-blue"
          viewBox="0 0 10 10"
          refX="18"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--ios-blue)" />
        </marker>

        {/* 紫色出度箭头 (后继演化) */}
        <marker
          id="beam-arrow-purple"
          viewBox="0 0 10 10"
          refX="18"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--ios-purple)" />
        </marker>

        {/* 光晕发光滤镜 */}
        <filter id="beam-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--ios-blue)" floodOpacity="0.6" />
        </filter>
        <filter id="beam-glow-purple" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--ios-purple)" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* 1. 渲染蓝色入度光束 (Predecessors -> Focused) */}
      {predecessors.map((predId) => {
        const fromCoord = nodeCoords[predId];
        if (!fromCoord) return null;
        const d = generateSmoothPath(fromCoord, targetCoord);

        return (
          <g key={`beam-in-${predId}-${focusedPointId}`} className="incoming-beam">
            {/* 底层高斯光晕线 */}
            <path
              d={d}
              fill="none"
              stroke="var(--ios-blue)"
              strokeWidth="6"
              strokeOpacity="0.25"
              strokeLinecap="round"
            />
            {/* 顶层实体光束线 */}
            <path
              d={d}
              fill="none"
              stroke="var(--ios-blue)"
              strokeWidth="2.5"
              strokeLinecap="round"
              markerEnd="url(#beam-arrow-blue)"
              style={{
                filter: 'url(#beam-glow-blue)',
                transition: 'all 0.3s ease',
              }}
            />
          </g>
        );
      })}

      {/* 2. 渲染紫色出度光束 (Focused -> Successors) */}
      {successors.map((succId) => {
        const toCoord = nodeCoords[succId];
        if (!toCoord) return null;
        const d = generateSmoothPath(targetCoord, toCoord);

        return (
          <g key={`beam-out-${focusedPointId}-${succId}`} className="outgoing-beam">
            {/* 底层高斯光晕线 */}
            <path
              d={d}
              fill="none"
              stroke="var(--ios-purple)"
              strokeWidth="6"
              strokeOpacity="0.25"
              strokeLinecap="round"
            />
            {/* 顶层实体光束线 */}
            <path
              d={d}
              fill="none"
              stroke="var(--ios-purple)"
              strokeWidth="2.5"
              strokeLinecap="round"
              markerEnd="url(#beam-arrow-purple)"
              style={{
                filter: 'url(#beam-glow-purple)',
                transition: 'all 0.3s ease',
              }}
            />
          </g>
        );
      })}

      {/* 3. 焦点中心光环 */}
      <circle
        cx={targetCoord.x}
        cy={targetCoord.y}
        r="16"
        fill="none"
        stroke="var(--ios-blue)"
        strokeWidth="2.5"
        strokeDasharray="4 2"
        opacity="0.85"
      />
    </g>
  );
};
