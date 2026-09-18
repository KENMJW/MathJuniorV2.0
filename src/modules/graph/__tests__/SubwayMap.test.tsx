import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { SubwayMap } from '../SubwayMap';
import { mockLogicLines, mockKnowledgePoints, mockGraphNodes } from '../mockGraphData';

describe('SubwayMap & FocusBeam (Task 10.1 & 10.2 & 铁律 4/7 校验)', () => {
  it('【铁律 4 源码门神】绝对不含作废的学情热力图、traceRootCause、脉冲红线与作废 token', () => {
    const subwayMapFile = path.resolve(__dirname, '../SubwayMap.tsx');
    const focusBeamFile = path.resolve(__dirname, '../FocusBeam.tsx');
    const codeMap = fs.readFileSync(subwayMapFile, 'utf-8');
    const codeBeam = fs.readFileSync(focusBeamFile, 'utf-8');
    const allCode = codeMap + '\n' + codeBeam;

    // 1. 严禁使用 traceRootCause
    expect(allCode).not.toContain('traceRootCause');
    // 2. 严禁使用已作废的学情/脉冲 token: --status-*, --pulse-track
    expect(allCode).not.toContain('--status-');
    expect(allCode).not.toContain('--pulse-track');
    // 3. 严禁出现红色脉冲线关键词
    expect(allCode).not.toContain('pulse-red');
  });

  it('【铁律 7 源码门神】SVG 图层严禁使用 <foreignObject>', () => {
    const subwayMapFile = path.resolve(__dirname, '../SubwayMap.tsx');
    const focusBeamFile = path.resolve(__dirname, '../FocusBeam.tsx');
    const codeMap = fs.readFileSync(subwayMapFile, 'utf-8');
    const codeBeam = fs.readFileSync(focusBeamFile, 'utf-8');

    expect(codeMap).not.toContain('<foreignObject');
    expect(codeBeam).not.toContain('<foreignObject');
  });

  it('【铁律 3 源码门神】SubwayMap 严禁直接 import katex 或裸 innerHTML', () => {
    const subwayMapFile = path.resolve(__dirname, '../SubwayMap.tsx');
    const code = fs.readFileSync(subwayMapFile, 'utf-8');

    expect(code).not.toMatch(/^\s*import\s+.*['"]katex/m);
    expect(code).not.toContain('dangerouslySetInnerHTML');
    expect(code).not.toContain('.innerHTML');
  });

  it('SubwayMap 渲染 6 学期经度 × 12 主线纬度网格与考点站台', () => {
    const html = renderToString(
      React.createElement(SubwayMap, {
        lines: mockLogicLines,
        points: mockKnowledgePoints,
        graphNodes: mockGraphNodes,
      })
    );

    // 1. 包含 6 学期表头
    expect(html).toContain('七上 7A');
    expect(html).toContain('七下 7B');
    expect(html).toContain('八上 8A');
    expect(html).toContain('八下 8B');
    expect(html).toContain('九上 9A');
    expect(html).toContain('九下 9B');

    // 2. 包含 12 条主线标识
    mockLogicLines.forEach((line) => {
      expect(html).toContain(line.line_id);
    });

    // 3. 包含考点站台 ID
    expect(html).toContain('KP-023');
    expect(html).toContain('KP-001');
    expect(html).toContain('KP-045');
  });

  it('Task 10.2 FocusBeam: 点击 KP-023 触发蓝色入度光束与紫色出度光束，无关节点 opacity 变为 0.15', () => {
    const html = renderToString(
      React.createElement(SubwayMap, {
        lines: mockLogicLines,
        points: mockKnowledgePoints,
        graphNodes: mockGraphNodes,
        selectedPointId: 'KP-023',
      })
    );

    // 1. FocusBeam 激活，包含蓝色入度光束与紫色出度光束箭头标记
    expect(html).toContain('beam-arrow-blue');
    expect(html).toContain('beam-arrow-purple');
    expect(html).toContain('incoming-beam');
    expect(html).toContain('outgoing-beam');

    // 2. 聚焦考点 KP-023 具有完整 opacity="1"
    expect(html).toMatch(/data-testid="subway-station-KP-023"[^>]*opacity="1"/);

    // 3. 非关联考点 (例如 KP-001 不在 KP-023 的直接入度/出度中) 被淡化为 opacity="0.15"
    expect(html).toMatch(/data-testid="subway-station-KP-001"[^>]*opacity="0.15"/);

    // 4. 前置考点 KP-015 (入度) 保持 opacity="1"
    expect(html).toMatch(/data-testid="subway-station-KP-015"[^>]*opacity="1"/);

    // 5. 侧滑出 CombinationPanel 抽屉
    expect(html).toContain('data-testid="combination-panel"');
  });
});
