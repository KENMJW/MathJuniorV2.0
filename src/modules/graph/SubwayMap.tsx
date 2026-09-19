import React, { useState, useMemo } from 'react';
import {
  LogicLine,
  GraphKnowledgePoint,
  GraphNode,
  KnowledgeCombination,
} from './types';
import {
  mockLogicLines,
  mockKnowledgePoints,
  mockGraphNodes,
  mockCombinations,
} from './mockGraphData';
import { FocusBeam, PointCoord } from './FocusBeam';
import { CombinationPanel } from './CombinationPanel';

export interface SubwayMapProps {
  lines?: LogicLine[];
  points?: GraphKnowledgePoint[];
  graphNodes?: GraphNode[];
  combinations?: KnowledgeCombination[];
  selectedPointId?: string | null;
  onSelectPoint?: (pointId: string | null) => void;
  onNavigate?: (destination: 'concept' | 'sandbox' | 'exam', pointId: string) => void;
  onSelectLineClosedLoop?: (lineId: string, targetTab?: 'lecture' | 'master' | 'practice') => void;
  onOpenFlagshipModel?: (lineId: string, modelId?: string) => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SEMESTERS = [
  { key: '7-1', nameZh: '七上 7A', nameEn: 'Grade 7-1' },
  { key: '7-2', nameZh: '七下 7B', nameEn: 'Grade 7-2' },
  { key: '8-1', nameZh: '八上 8A', nameEn: 'Grade 8-1' },
  { key: '8-2', nameZh: '八下 8B', nameEn: 'Grade 8-2' },
  { key: '9-1', nameZh: '九上 9A', nameEn: 'Grade 9-1' },
  { key: '9-2', nameZh: '九下 9B', nameEn: 'Grade 9-2' },
];

// 12 条主线主题色彩映射 (iOS 27 System Colors, 纯静态规范)
const DOMAIN_COLOR_MAP: Record<string, string> = {
  '数与代数': 'var(--ios-blue)',
  '图形与几何': 'var(--ios-green)',
  '统计与概率': 'var(--ios-orange)',
};

/**
 * 任务 10.1: 6学期 × 12主线泳道地铁图 (SubwayMap)
 *
 * 铁律规范：
 * 1. [铁律 4]: 绝对不做任何学情热力图、节点掌握度着色、根因诊断溯源、红色脉冲线、靶向就医卡片。
 *    严禁引入状态着色与脉冲轨道等已作废设计 token。图谱是纯静态知识结构！
 * 2. [铁律 7]: 纯 SVG 矢量渲染，严禁使用 foreignObject 标签。
 * 3. 铁律 10: 样式严格基于 iOS 27 液态玻璃设计系统 Token。
 */
export const SubwayMap: React.FC<SubwayMapProps> = ({
  lines = mockLogicLines,
  points = mockKnowledgePoints,
  graphNodes = mockGraphNodes,
  combinations = mockCombinations,
  selectedPointId: controlledSelectedPointId,
  onSelectPoint,
  onNavigate,
  onSelectLineClosedLoop,
  onOpenFlagshipModel,
  locale = 'zh-CN',
  className = '',
  style = {},
}) => {
  const [internalFocusedId, setInternalFocusedId] = useState<string | null>(null);

  const focusedPointId = controlledSelectedPointId !== undefined
    ? controlledSelectedPointId
    : internalFocusedId;

  const handleSelectPoint = (pointId: string | null) => {
    if (onSelectPoint) {
      onSelectPoint(pointId);
    } else {
      setInternalFocusedId(pointId);
    }
  };

  const isEn = locale === 'en';

  // 1. 快速查找字典
  const pointsMap = useMemo(() => {
    const map: Record<string, GraphKnowledgePoint> = {};
    points.forEach((p) => {
      map[p.point_id] = p;
    });
    return map;
  }, [points]);

  const graphNodeMap = useMemo(() => {
    const map: Record<string, GraphNode> = {};
    graphNodes.forEach((n) => {
      map[n.point_id] = n;
    });
    return map;
  }, [graphNodes]);

  // 2. 网格几何常数
  const LEFT_LABEL_WIDTH = 190;
  const HEADER_HEIGHT = 60;
  const COL_WIDTH = 180;
  const ROW_HEIGHT = 68;

  const SVG_WIDTH = LEFT_LABEL_WIDTH + SEMESTERS.length * COL_WIDTH + 60;
  const SVG_HEIGHT = HEADER_HEIGHT + lines.length * ROW_HEIGHT + 40;

  // 3. 计算每个考点在 SVG 中的绝对 (x, y) 锚定槽位
  const nodeCoords = useMemo(() => {
    const coords: Record<string, PointCoord> = {};

    // 统计同一槽位内的考点数，便于多考点在同格内微调分布
    const cellBuckets: Record<string, GraphKnowledgePoint[]> = {};
    points.forEach((pt) => {
      const semKey = `${pt.grade}-${pt.semester}`;
      const cellKey = `${semKey}__${pt.primary_line_id}`;
      if (!cellBuckets[cellKey]) cellBuckets[cellKey] = [];
      cellBuckets[cellKey].push(pt);
    });

    Object.entries(cellBuckets).forEach(([cellKey, cellPoints]) => {
      const [semKey, lineId] = cellKey.split('__');
      const colIndex = SEMESTERS.findIndex((s) => s.key === semKey);
      const rowIndex = lines.findIndex((l) => l.line_id === lineId);

      if (colIndex === -1 || rowIndex === -1) return;

      const baseX = LEFT_LABEL_WIDTH + colIndex * COL_WIDTH + COL_WIDTH / 2;
      const baseY = HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

      cellPoints.forEach((pt, index) => {
        // 多考点水平错开分布
        const offset = (index - (cellPoints.length - 1) / 2) * 36;
        coords[pt.point_id] = {
          x: baseX + offset,
          y: baseY,
        };
      });
    });

    return coords;
  }, [points, lines]);

  // 4. 当前聚焦节点的前置 (predecessors) 与后继 (successors)
  const activeGraphNode = focusedPointId ? graphNodeMap[focusedPointId] : null;
  const predecessors = activeGraphNode ? activeGraphNode.predecessors : [];
  const successors = activeGraphNode ? activeGraphNode.successors : [];

  // 当前选中考点详情
  const selectedPoint = focusedPointId ? pointsMap[focusedPointId] || null : null;

  return (
    <div
      className={`subway-map-container ${className}`}
      data-testid="subway-map-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '750px',
        display: 'flex',
        borderRadius: 'var(--radius-lg, 26px)',
        overflow: 'hidden',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* 滚动画布区域 */}
      <div
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '1rem',
        }}
      >
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          style={{ display: 'block' }}
        >
          {/* A. 背景网格与主线泳道 */}
          <g className="grid-lanes">
            {/* 6 学期经度列底色 */}
            {SEMESTERS.map((sem, colIdx) => {
              const x = LEFT_LABEL_WIDTH + colIdx * COL_WIDTH;
              const isEven = colIdx % 2 === 0;
              return (
                <rect
                  key={`col-bg-${sem.key}`}
                  x={x}
                  y={HEADER_HEIGHT}
                  width={COL_WIDTH}
                  height={SVG_HEIGHT - HEADER_HEIGHT}
                  fill={isEven ? 'rgba(0, 0, 0, 0.015)' : 'transparent'}
                />
              );
            })}

            {/* 12 主线纬度横向轨道线 */}
            {lines.map((line, rowIdx) => {
              const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
              const domainColor = DOMAIN_COLOR_MAP[line.domain] || 'var(--ios-blue)';
              return (
                <g key={`row-lane-${line.line_id}`}>
                  <line
                    x1={LEFT_LABEL_WIDTH}
                    y1={y}
                    x2={SVG_WIDTH - 20}
                    y2={y}
                    stroke={domainColor}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeOpacity="0.22"
                  />
                  {/* 左侧主线标尺徽章 */}
                  <rect
                    x={12}
                    y={y - 18}
                    width={LEFT_LABEL_WIDTH - 24}
                    height={36}
                    rx="10"
                    fill="var(--glass-bg-elevated)"
                    stroke="rgba(0, 0, 0, 0.06)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={28}
                    cy={y}
                    r="4"
                    fill={domainColor}
                  />
                  <text
                    x={40}
                    y={y - 3}
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--text-primary)"
                    dominantBaseline="middle"
                  >
                    {line.line_id}
                  </text>
                  <text
                    x={65}
                    y={y - 3}
                    fontSize="11"
                    fontWeight="500"
                    fill="var(--text-primary)"
                    dominantBaseline="middle"
                  >
                    {isEn ? line.name_en : line.name_zh}
                  </text>
                  <text
                    x={40}
                    y={y + 11}
                    fontSize="9"
                    fill="var(--text-secondary)"
                  >
                    {line.domain} · {line.semester_span}
                  </text>
                </g>
              );
            })}

            {/* 6 学期顶部表头 */}
            {SEMESTERS.map((sem, colIdx) => {
              const x = LEFT_LABEL_WIDTH + colIdx * COL_WIDTH + COL_WIDTH / 2;
              return (
                <g key={`header-sem-${sem.key}`}>
                  <rect
                    x={LEFT_LABEL_WIDTH + colIdx * COL_WIDTH + 8}
                    y={12}
                    width={COL_WIDTH - 16}
                    height={36}
                    rx="10"
                    fill="rgba(0, 0, 0, 0.03)"
                  />
                  <text
                    x={x}
                    y={34}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="var(--text-primary)"
                  >
                    {isEn ? sem.nameEn : sem.nameZh}
                  </text>
                </g>
              );
            })}
          </g>

          {/* B. 基础轨道连线 (常态浅灰色背景拓扑，无学情热力) */}
          <g className="base-tracks" opacity={focusedPointId ? 0.2 : 0.6}>
            {graphNodes.map((node) => {
              const fromCoord = nodeCoords[node.point_id];
              if (!fromCoord) return null;

              return node.successors.map((succId) => {
                const toCoord = nodeCoords[succId];
                if (!toCoord) return null;

                const dx = toCoord.x - fromCoord.x;
                const d = `M ${fromCoord.x} ${fromCoord.y} C ${fromCoord.x + dx * 0.5} ${fromCoord.y}, ${fromCoord.x + dx * 0.5} ${toCoord.y}, ${toCoord.x} ${toCoord.y}`;

                return (
                  <path
                    key={`track-${node.point_id}-${succId}`}
                    d={d}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.12)"
                    strokeWidth="1.5"
                  />
                );
              });
            })}
          </g>

          {/* C. 焦点穿透光束图层 (Task 10.2: FocusBeam) */}
          <FocusBeam
            focusedPointId={focusedPointId}
            nodeCoords={nodeCoords}
            predecessors={predecessors}
            successors={successors}
          />

          {/* D. 地铁站台节点图层 (107 考点) */}
          <g className="subway-stations">
            {points.map((pt) => {
              const coord = nodeCoords[pt.point_id];
              if (!coord) return null;

              const isFocused = pt.point_id === focusedPointId;
              const isPredecessor = predecessors.includes(pt.point_id);
              const isSuccessor = successors.includes(pt.point_id);

              // 焦点穿透逻辑：有聚焦节点时，非关联节点 opacity→0.15 (§7.2)
              const isRelated = isFocused || isPredecessor || isSuccessor;
              const nodeOpacity = focusedPointId ? (isRelated ? 1 : 0.15) : 1;

              const gNode = graphNodeMap[pt.point_id];
              const isMilestone = gNode ? gNode.is_milestone === 1 : false;

              // 边框色判定 (前置地基=蓝, 后继演化=紫, 聚焦=强调蓝, 常规=灰色/领域色)
              let strokeColor = 'rgba(0, 0, 0, 0.25)';
              let strokeWidth = 2;
              let fillColor = 'var(--glass-bg-elevated)';

              if (isFocused) {
                strokeColor = 'var(--ios-blue)';
                strokeWidth = 3.5;
                fillColor = 'var(--glass-bg-elevated)';
              } else if (isPredecessor) {
                strokeColor = 'var(--ios-blue)';
                strokeWidth = 2.5;
                fillColor = 'rgba(0, 113, 227, 0.08)';
              } else if (isSuccessor) {
                strokeColor = 'var(--ios-purple)';
                strokeWidth = 2.5;
                fillColor = 'rgba(175, 82, 222, 0.08)';
              }

              return (
                <g
                  key={`station-${pt.point_id}`}
                  className="subway-station"
                  data-testid={`subway-station-${pt.point_id}`}
                  opacity={nodeOpacity}
                  cursor="pointer"
                  onClick={() => handleSelectPoint(isFocused ? null : pt.point_id)}
                  style={{ transition: 'opacity 0.3s ease, transform 0.2s ease' }}
                >
                  {/* 外层响应点击热区 */}
                  <circle cx={coord.x} cy={coord.y} r="20" fill="transparent" />

                  {/* 里程碑外圈 (双重圆环) */}
                  {isMilestone && (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r="14"
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.75"
                    />
                  )}

                  {/* 站点核心圆形 */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="10"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />

                  {/* 站点中心实心小圆点 */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isFocused ? 4.5 : 3}
                    fill={isFocused ? 'var(--ios-blue)' : strokeColor}
                  />

                  {/* 考点编号文本标签 */}
                  <text
                    x={coord.x}
                    y={coord.y + 22}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight={isFocused ? '700' : '600'}
                    fill="var(--text-primary)"
                  >
                    {pt.point_id}
                  </text>
                  <text
                    x={coord.x}
                    y={coord.y + 33}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="var(--text-secondary)"
                  >
                    {isEn
                      ? pt.name_en.slice(0, 14)
                      : pt.name_zh.length > 7
                      ? `${pt.name_zh.slice(0, 6)}…`
                      : pt.name_zh}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* E. 组合档案侧滑面板 (Task 10.3: CombinationPanel) */}
      {selectedPoint && (
        <CombinationPanel
          point={selectedPoint}
          combinations={combinations}
          allPoints={pointsMap}
          onClose={() => handleSelectPoint(null)}
          onNavigate={onNavigate}
          onSelectLineClosedLoop={onSelectLineClosedLoop}
          onOpenSandboxLeap={onOpenFlagshipModel}
          locale={locale}
        />
      )}
    </div>
  );
};
