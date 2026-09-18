import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

import { SubwayMap } from '../../src/modules/graph/SubwayMap';
import { FocusBeam } from '../../src/modules/graph/FocusBeam';
import { CombinationPanel } from '../../src/modules/graph/CombinationPanel';
import { LineQuickPractice } from '../../src/modules/graph/LineQuickPractice';
import { SolutionList } from '../../src/modules/exam/SolutionList';
import { parseSolutions } from '../../src/modules/exam/parseSolutions';

import {
  mockLogicLines,
  mockKnowledgePoints,
  mockGraphNodes,
  mockCombinations,
  mockLineQuickPracticeQuestions,
} from '../../src/modules/graph/mockGraphData';

const coreData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'core_data.json'), 'utf-8')
);
const dbQuestions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'db_questions_subset.json'), 'utf-8')
);

describe('Part C: Module 2 Thinking Graph End-to-End Verification', () => {
  it('1.1 SubwayMap 默认无 Props 渲染为 20 考点降级状态', () => {
    const mockHtml = renderToString(React.createElement(SubwayMap, {}));
    const mockStationMatches = mockHtml.match(/data-testid="subway-station-[^"]+"/g) || [];
    console.log('[E2E-C] Mock render stations count:', mockStationMatches.length);
    expect(mockStationMatches.length).toBe(20);
  });

  it('1.2 SubwayMap 注入 core.db 全量数据（107 考点、12 主线、107 节点、2204 组合）渲染', () => {
    const realHtml = renderToString(
      React.createElement(SubwayMap, {
        lines: coreData.lines,
        points: coreData.points,
        graphNodes: coreData.nodes,
        combinations: coreData.combos,
      })
    );

    const realStationMatches = realHtml.match(/data-testid="subway-station-[^"]+"/g) || [];
    const milestoneRings = (realHtml.match(/stroke-dasharray="2 2"/g) || []).length;
    console.log('[E2E-C] Real core.db stations rendered:', realStationMatches.length);
    console.log('[E2E-C] Milestone rings count:', milestoneRings);

    expect(realStationMatches.length).toBe(107);
    expect(milestoneRings).toBe(32);

    // 统计槽位冲突
    const cellBuckets: Record<string, any[]> = {};
    coreData.points.forEach((pt: any) => {
      const cellKey = `${pt.grade}-${pt.semester}__${pt.primary_line_id}`;
      if (!cellBuckets[cellKey]) cellBuckets[cellKey] = [];
      cellBuckets[cellKey].push(pt);
    });

    const overflows: any[] = [];
    Object.entries(cellBuckets).forEach(([cellKey, pts]) => {
      const spread = (pts.length - 1) * 36;
      if (spread > 180) {
        overflows.push({ cellKey, count: pts.length, spreadPx: spread });
      }
    });
    console.log('[E2E-C] Cell spread overflows (>180px column width):', overflows);
    expect(overflows.length).toBeGreaterThan(0);
  });

  it('2.1 焦点穿透：点击 KP-004 激活入度（蓝）与出度（紫）光束与节点样式', () => {
    const focusedHtml = renderToString(
      React.createElement(SubwayMap, {
        lines: coreData.lines,
        points: coreData.points,
        graphNodes: coreData.nodes,
        combinations: coreData.combos,
        selectedPointId: 'KP-004',
      })
    );

    expect(focusedHtml).toContain('id="beam-arrow-blue"');
    expect(focusedHtml).toContain('id="beam-arrow-purple"');

    const incomingBeams = (focusedHtml.match(/class="incoming-beam"/g) || []).length;
    const outgoingBeams = (focusedHtml.match(/class="outgoing-beam"/g) || []).length;

    console.log('[E2E-C] KP-004 incoming beams:', incomingBeams, 'outgoing beams:', outgoingBeams);
    expect(incomingBeams).toBe(3);
    expect(outgoingBeams).toBe(12);

    // 节点透明度与样式
    const kp004Match = focusedHtml.match(/data-testid="subway-station-KP-004"[^>]*opacity="([^"]+)"/);
    const kp001Match = focusedHtml.match(/data-testid="subway-station-KP-001"[^>]*opacity="([^"]+)"/);
    const kp005Match = focusedHtml.match(/data-testid="subway-station-KP-005"[^>]*opacity="([^"]+)"/);
    const kp084Match = focusedHtml.match(/data-testid="subway-station-KP-084"[^>]*opacity="([^"]+)"/);

    expect(kp004Match?.[1]).toBe('1');
    expect(kp001Match?.[1]).toBe('1');
    expect(kp005Match?.[1]).toBe('1');
    expect(kp084Match?.[1]).toBe('0.15');
  });

  it('2.2 考点组合面板（CombinationPanel）：kp_count 1~8 动态渲染与三大跳板入口', () => {
    const testPoint = coreData.points.find((p: any) => p.point_id === 'KP-023') || coreData.points[0];
    const kpMap: Record<string, any> = {};
    coreData.points.forEach((p: any) => (kpMap[p.point_id] = p));

    [1, 2, 3, 4, 5, 6, 7, 8].forEach((count) => {
      const realCombo = coreData.combos.find((c: any) => c.kp_count === count);
      const testCombo = {
        ...realCombo,
        kp_ids: [testPoint.point_id, ...realCombo.kp_ids.slice(1)].slice(0, count),
      };
      while (testCombo.kp_ids.length < count) {
        testCombo.kp_ids.push(`KP-MOCK-${testCombo.kp_ids.length + 1}`);
      }

      const panelHtml = renderToString(
        React.createElement(CombinationPanel, {
          point: testPoint,
          combinations: [testCombo],
          allPoints: kpMap,
        })
      );

      const renderedNodes = (panelHtml.match(/data-testid="combination-node"/g) || []).length;
      expect(renderedNodes).toBe(count);
      expect(panelHtml).toContain('阶拓扑组合');
      if (count > 4) {
        expect(renderedNodes).toBeGreaterThan(4);
      }
    });

    const panelSampleHtml = renderToString(
      React.createElement(CombinationPanel, {
        point: testPoint,
        combinations: coreData.combos.slice(0, 3),
        allPoints: kpMap,
      })
    );
    expect(panelSampleHtml).toContain('概念精讲');
    expect(panelSampleHtml).toContain('沙盒探究');
    expect(panelSampleHtml).toContain('专项测评');
  });

  it('3.1 主线快练：难度锁定 L4~L6，严格排除 L1~L3 与 L7+ 题目及非选择题', () => {
    const testPool = [
      ...dbQuestions,
      {
        question_id: 'Q-TEST-L1-SC',
        primary_point_id: 'KP-023',
        difficulty_level: 1,
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: '【非法】L1选择题',
        stem_en: 'Illegal L1',
        options: [{ key: 'A', text_zh: 'A', text_en: 'A' }],
        answer_standard: 'A',
      },
      {
        question_id: 'Q-TEST-L7-SC',
        primary_point_id: 'KP-023',
        difficulty_level: 7,
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: '【非法】L7超难题',
        stem_en: 'Illegal L7',
        options: [{ key: 'A', text_zh: 'A', text_en: 'A' }],
        answer_standard: 'A',
      },
      {
        question_id: 'Q-TEST-L4-FB',
        primary_point_id: 'KP-023',
        difficulty_level: 4,
        question_type: 'fill_blank',
        score_default: 3,
        stem_zh: '【非法】L4填空题',
        stem_en: 'Illegal L4 FB',
        options: [],
        answer_standard: '1',
      },
    ];

    const practiceHtml = renderToString(
      React.createElement(LineQuickPractice, {
        lineId: 'G4',
        allQuestions: testPool as any,
      })
    );

    expect(practiceHtml).toContain('L4~L6 综合强化');
    expect(practiceHtml).not.toContain('【非法】L1选择题');
    expect(practiceHtml).not.toContain('【非法】L7超难题');
    expect(practiceHtml).not.toContain('【非法】L4填空题');
  });

  it('3.2 主线快练：单解与多解分条支持及题库不足友好提示', () => {
    // 单解
    const singleSolHtml = renderToString(
      React.createElement(SolutionList, {
        solutions: '设  = x$，在勾股方程中求解得  = 7/8$。',
        locale: 'zh',
      })
    );
    expect(singleSolHtml).toContain('data-testid="solution-single"');

    // 多解
    const multiSolJson = JSON.stringify([
      { method: '解法一（勾股方程法）', text: '推导步骤 1' },
      { method: '解法二（相似比例法）', text: '推导步骤 2' },
    ]);
    const multiSolHtml = renderToString(
      React.createElement(SolutionList, {
        solutions: multiSolJson,
        locale: 'zh',
      })
    );
    expect(multiSolHtml).toContain('data-testid="solution-list-multiple"');
    expect(multiSolHtml).toContain('data-testid="solution-item-1"');
    expect(multiSolHtml).toContain('data-testid="solution-item-2"');
    expect(multiSolHtml).toContain('解法一（勾股方程法）');
    expect(multiSolHtml).toContain('解法二（相似比例法）');

    // 真实 DB 多解题 Q-2025-HUB-0010
    const hub0010 = dbQuestions.find((q: any) => q.question_id === 'Q-2025-HUB-0010');
    expect(hub0010).toBeDefined();
    const hubHtml = renderToString(
      React.createElement(SolutionList, {
        solutions: hub0010.solutions_json,
        locale: 'zh',
      })
    );
    expect(hubHtml).toContain('data-testid="solution-list-multiple"');
    expect(hubHtml).toContain('data-testid="solution-item-1"');
    expect(hubHtml).toContain('data-testid="solution-item-2"');

    // 题库不足 3 题友好提示
    const emptyPracticeHtml = renderToString(
      React.createElement(LineQuickPractice, {
        lineId: 'G4',
        allQuestions: [],
      })
    );
    expect(emptyPracticeHtml).toContain('主线强化练习题库整备中');
    expect(emptyPracticeHtml).toContain('当前主线要求 L4~L6 难度综合题');
  });
});
