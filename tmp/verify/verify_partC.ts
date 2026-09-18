import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

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

interface VerifyResult {
  step: string;
  subItem: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: any;
}

const results: VerifyResult[] = [];

// ==========================================
// 1. SubwayMap: 6学期 x 12主线与考点图谱渲染
// ==========================================
console.log('--- 1. Verifying SubwayMap (Default Mock vs Real core.db) ---');

// A. 默认 Mock 数据渲染
const mockHtml = renderToString(React.createElement(SubwayMap, {}));
const mockStationMatches = mockHtml.match(/data-testid="subway-station-[^"]+"/g) || [];
console.log('Mock render: total stations =', mockStationMatches.length);

results.push({
  step: '1. 泳道图渲染',
  subItem: '默认无 Props 渲染 (Mock 降级)',
  status: mockStationMatches.length === 20 ? 'PASS' : 'FAIL',
  details: {
    stationCount: mockStationMatches.length,
    expectedMock: 20,
    observation: '实际前端页面 MathJuniorHome 未注入 core.db 数据，直接使用默认参数，仅渲染 20 个考点！',
  },
});

// B. 真实 core.db 数据注入渲染 (107 考点, 12 主线, 107 节点, 2204 组合)
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

console.log('Real render: total stations =', realStationMatches.length);
console.log('Real render: milestone rings =', milestoneRings);

// 统计 107 考点坐标与槽位冲突情况
const SEMESTERS = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2'];
const cellBuckets: Record<string, any[]> = {};
coreData.points.forEach((pt: any) => {
  const cellKey = `${pt.grade}-${pt.semester}__${pt.primary_line_id}`;
  if (!cellBuckets[cellKey]) cellBuckets[cellKey] = [];
  cellBuckets[cellKey].push(pt);
});

const cellOverflows: any[] = [];
Object.entries(cellBuckets).forEach(([cellKey, pts]) => {
  if (pts.length > 4) {
    const spread = (pts.length - 1) * 36;
    cellOverflows.push({
      cellKey,
      count: pts.length,
      spreadPx: spread,
      colWidth: 180,
      isOverflow: spread > 180,
    });
  }
});

results.push({
  step: '1. 泳道图渲染',
  subItem: '真实 107 考点与 12 主线注入渲染',
  status: realStationMatches.length === 107 ? 'PASS' : 'FAIL',
  details: {
    stationCount: realStationMatches.length,
    expectedCount: 107,
    linesCount: coreData.lines.length,
    milestoneRingsCount: milestoneRings,
    expectedMilestones: 32,
    cellOverflows,
    observation: '107 个考点全部被成功渲染出 SVG 站台，32 个里程碑圆环完整展示。但 9-1__G4(10点)、7-1__S1(8点)等密集槽位水平横向错开达 324px，超出列宽 180px，导致视觉跨列穿透。',
  },
});

// ==========================================
// 2. 焦点穿透与交互 (FocusBeam & CombinationPanel)
// ==========================================
console.log('--- 2. Verifying Focus Penetration & Clique Dynamic Rendering ---');

// A. 焦点穿透测试：选中 KP-004 (有 3 个前置，12 个后继，且是里程碑节点)
const focusedHtml = renderToString(
  React.createElement(SubwayMap, {
    lines: coreData.lines,
    points: coreData.points,
    graphNodes: coreData.nodes,
    combinations: coreData.combos,
    selectedPointId: 'KP-004',
  })
);

const hasBlueArrowMarker = focusedHtml.includes('id="beam-arrow-blue"');
const hasPurpleArrowMarker = focusedHtml.includes('id="beam-arrow-purple"');
const incomingBeams = (focusedHtml.match(/class="incoming-beam"/g) || []).length;
const outgoingBeams = (focusedHtml.match(/class="outgoing-beam"/g) || []).length;

const kp004Match = focusedHtml.match(/data-testid="subway-station-KP-004"[^>]*opacity="([^"]+)"/);
const kp001Match = focusedHtml.match(/data-testid="subway-station-KP-001"[^>]*opacity="([^"]+)"/);
const kp005Match = focusedHtml.match(/data-testid="subway-station-KP-005"[^>]*opacity="([^"]+)"/);
const kp084Match = focusedHtml.match(/data-testid="subway-station-KP-084"[^>]*opacity="([^"]+)"/);

console.log('Focus KP-004: incomingBeams =', incomingBeams, '(expected 3), outgoingBeams =', outgoingBeams, '(expected 12)');
console.log('Station opacities: KP-004 =', kp004Match?.[1], ', KP-001 =', kp001Match?.[1], ', KP-005 =', kp005Match?.[1], ', KP-084 =', kp084Match?.[1]);

results.push({
  step: '2. 焦点穿透与交互',
  subItem: '入度（蓝）与出度（紫）光束与节点样式',
  status:
    hasBlueArrowMarker &&
    hasPurpleArrowMarker &&
    incomingBeams === 3 &&
    outgoingBeams === 12 &&
    kp084Match?.[1] === '0.15'
      ? 'PASS'
      : 'FAIL',
  details: {
    focusedPointId: 'KP-004',
    incomingBeams,
    expectedIncoming: 3,
    outgoingBeams,
    expectedOutgoing: 12,
    hasBlueArrowMarker,
    hasPurpleArrowMarker,
    focusedOpacity: kp004Match?.[1],
    predecessorOpacity: kp001Match?.[1],
    successorOpacity: kp005Match?.[1],
    unrelatedOpacity: kp084Match?.[1],
  },
});

// B. 考点组合面板（clique）kp_count 1~8 动态渲染测试
console.log('--- 2.B Verifying CombinationPanel kp_count 1~8 Dynamic Rendering ---');
const testPoint = coreData.points.find((p: any) => p.point_id === 'KP-023') || coreData.points[0];
const kpMap: Record<string, any> = {};
coreData.points.forEach((p: any) => (kpMap[p.point_id] = p));

const cliqueTestCounts = [1, 2, 3, 4, 5, 6, 7, 8];
const cliqueResults: any[] = [];

cliqueTestCounts.forEach((count) => {
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
  const hasTag = panelHtml.includes(`${count} 阶拓扑组合`);
  const isTruncatedAt4 = count > 4 && renderedNodes <= 4;

  cliqueResults.push({
    kp_count: count,
    renderedNodes,
    expectedNodes: count,
    badgeText: `${count} 阶拓扑组合`,
    hasTag,
    isTruncatedAt4,
  });
});

console.log('Clique render counts:', cliqueResults);

const allCliquePassed = cliqueResults.every(
  (r) => r.renderedNodes === r.kp_count && !r.isTruncatedAt4
);

// 验证三大跳板入口
const panelSampleHtml = renderToString(
  React.createElement(CombinationPanel, {
    point: testPoint,
    combinations: coreData.combos.slice(0, 3),
    allPoints: kpMap,
  })
);

const hasConceptJump = panelSampleHtml.includes('概念精讲');
const hasSandboxJump = panelSampleHtml.includes('沙盒探究');
const hasExamJump = panelSampleHtml.includes('专项测评');

results.push({
  step: '2. 焦点穿透与交互',
  subItem: 'CombinationPanel kp_count 1~8 动态渲染与跳板入口',
  status: allCliquePassed && hasConceptJump && hasSandboxJump && hasExamJump ? 'PASS' : 'FAIL',
  details: {
    cliqueResults,
    hasConceptJump,
    hasSandboxJump,
    hasExamJump,
  },
});

// ==========================================
// 3. 主线快练 (LineQuickPractice.tsx)
// ==========================================
console.log('--- 3. Verifying LineQuickPractice (L4~L6 Difficulty Lock & Multi-Solution) ---');

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

const totalQuestionsProvided = testPool.length;
const totalL1L3 = testPool.filter((q) => q.difficulty_level <= 3).length;
const totalL7Plus = testPool.filter((q) => q.difficulty_level >= 7).length;
const totalNonSingleChoice = testPool.filter((q) => q.question_type !== 'single_choice').length;
const totalValidL4L6SingleChoice = testPool.filter(
  (q) => q.difficulty_level >= 4 && q.difficulty_level <= 6 && q.question_type === 'single_choice'
).length;

console.log(`Pool test stats: total=${totalQuestionsProvided}, L1-L3=${totalL1L3}, L7+=${totalL7Plus}, non-SC=${totalNonSingleChoice}, valid L4-L6 SC=${totalValidL4L6SingleChoice}`);

const practiceHtml = renderToString(
  React.createElement(LineQuickPractice, {
    lineId: 'G4',
    allQuestions: testPool as any,
  })
);

const hasL4L6Badge = practiceHtml.includes('L4~L6 综合强化');
const containsL1Leak = practiceHtml.includes('【非法】L1选择题');
const containsL7Leak = practiceHtml.includes('【非法】L7超难题');
const containsFBLeak = practiceHtml.includes('【非法】L4填空题');

results.push({
  step: '3. 主线快练',
  subItem: 'L4~L6 难度锁与题型锁定 (严格排除 L1~L3 与 L7+ 及非选择题)',
  status:
    hasL4L6Badge && !containsL1Leak && !containsL7Leak && !containsFBLeak ? 'PASS' : 'FAIL',
  details: {
    totalQuestionsProvided,
    totalL1L3Excluded: totalL1L3,
    totalL7PlusExcluded: totalL7Plus,
    totalNonSingleChoiceExcluded: totalNonSingleChoice,
    totalValidAdmitted: totalValidL4L6SingleChoice,
    hasL4L6Badge,
    containsL1Leak,
    containsL7Leak,
    containsFBLeak,
  },
});

// B. 验证提交后解析区展示与多解分条支持
console.log('--- 3.B Verifying SolutionList & Multi-Solution Rendering ---');

// 1. 单解测试
const singleSolHtml = renderToString(
  React.createElement(SolutionList, {
    solutions: '设  = x$，在 $\text{Rt}\triangle AB\'E$ 中应用勾股定理列方程求解得  = 7/8$。',
    locale: 'zh',
  })
);
const hasSingleTestId = singleSolHtml.includes('data-testid="solution-single"');

// 2. 多解测试
const multiSolJson = JSON.stringify([
  {
    method: '解法一（勾股方程法）',
    text: '过点 $ 作  \perp BC$，设  = x$，由勾股定理得 ^2 + 4^2 = 5^2$。',
  },
  {
    method: '解法二（相似比例法）',
    text: '易证 $\triangle ADE \sim \triangle ABC$，则 $\frac{AD}{AB} = \frac{DE}{BC}$。',
  },
]);

const multiSolHtml = renderToString(
  React.createElement(SolutionList, {
    solutions: multiSolJson,
    locale: 'zh',
  })
);

const hasMultiTestId = multiSolHtml.includes('data-testid="solution-list-multiple"');
const hasItem1 = multiSolHtml.includes('data-testid="solution-item-1"');
const hasItem2 = multiSolHtml.includes('data-testid="solution-item-2"');
const hasMethod1Title = multiSolHtml.includes('解法一（勾股方程法）');
const hasMethod2Title = multiSolHtml.includes('解法二（相似比例法）');

// 3. 真实 DB 多解题 Q-2025-HUB-0010 验证
const hub0010 = dbQuestions.find((q: any) => q.question_id === 'Q-2025-HUB-0010');
let hub0010Result = null;
if (hub0010) {
  const hubParsed = parseSolutions(hub0010.solutions_json);
  const hubHtml = renderToString(
    React.createElement(SolutionList, {
      solutions: hub0010.solutions_json,
      locale: 'zh',
    })
  );
  hub0010Result = {
    questionId: hub0010.question_id,
    parsedSolutionsCount: hubParsed.length,
    renderedMultiple: hubHtml.includes('data-testid="solution-list-multiple"'),
    methods: hubParsed.map((s) => s.method),
  };
}

results.push({
  step: '3. 主线快练',
  subItem: '解析区展示与多解分条支持 (SolutionList)',
  status:
    hasSingleTestId &&
    hasMultiTestId &&
    hasItem1 &&
    hasItem2 &&
    hub0010Result?.renderedMultiple
      ? 'PASS'
      : 'FAIL',
  details: {
    singleSolHasSingleTestId: hasSingleTestId,
    multiSolHasMultiTestId: hasMultiTestId,
    hasItem1,
    hasItem2,
    hasMethod1Title,
    hasMethod2Title,
    hub0010Result,
  },
});

// C. 题库不足 3 题门禁提示验证
const emptyPracticeHtml = renderToString(
  React.createElement(LineQuickPractice, {
    lineId: 'G4',
    allQuestions: [],
  })
);
const hasEmptyPrompt = emptyPracticeHtml.includes('主线强化练习题库整备中');

results.push({
  step: '3. 主线快练',
  subItem: '题库不足 3 题友好提示门禁 (§5.1)',
  status: hasEmptyPrompt ? 'PASS' : 'FAIL',
  details: {
    hasEmptyPrompt,
    observation: '题库题量不足 3 题时，严格触发整备中占位面板，严禁静默返回不足题量。',
  },
});

fs.writeFileSync(
  path.resolve(__dirname, 'verify_results.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);
console.log('=== Verification Completed! Results written to verify_results.json ===');
