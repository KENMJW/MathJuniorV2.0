import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GraphNav } from '../GraphNav';
import { mockLogicLines } from '../mockGraphData';
import { useSessionStore } from '../../../store/sessionStore';

describe('GraphNav (TASK-FE-0015 模块二知识谱系重构核心验证)', () => {
  beforeEach(() => {
    useSessionStore.getState().resetAll();
  });

  it('1. 源码红线校验：零 emoji、零 eval、零 innerHTML、零 foreignObject', () => {
    const graphNavPath = path.resolve(__dirname, '../GraphNav.tsx');
    const content = fs.readFileSync(graphNavPath, 'utf-8');

    // 铁律 1/3: 零 eval, 零 innerHTML
    expect(content).not.toMatch(/\beval\s*\(/);
    expect(content).not.toMatch(/dangerouslySetInnerHTML/);
    expect(content).not.toMatch(/\.innerHTML\s*=/);

    // 铁律 2: 零 foreignObject
    expect(content).not.toMatch(/<foreignObject/i);

    // 铁律 11: 零 emoji
    const emojiRegex = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
    expect(emojiRegex.test(content)).toBe(false);
  });

  it('2. GraphNav 完整渲染顶栏 12 谱系选择胶囊与 4 个分段 Tab', () => {
    const html = renderToString(
      <GraphNav
        lines={mockLogicLines}
        initialLineId="G4"
      />
    );

    // 顶栏容器
    expect(html).toContain('graph-nav-header');
    expect(html).toContain('graph-line-selector-trigger');

    // 谱系标识与领域
    expect(html).toContain('G4');
    expect(html).toContain('图形与几何');

    // 4 分段胶囊 Tab 存在
    expect(html).toContain('graph-tab-concept');
    expect(html).toContain('graph-tab-sandbox');
    expect(html).toContain('graph-tab-master');
    expect(html).toContain('graph-tab-practice');

    expect(html).toContain('概念精讲');
    expect(html).toContain('链接沙盒');
    expect(html).toContain('谱系母题');
    expect(html).toContain('专项测评');
  });

  it('3. 概念精讲 Tab：左侧渲染四段论卡片，右侧渲染 LineSwimlane 竖向泳道图', () => {
    const html = renderToString(
      <GraphNav
        lines={mockLogicLines}
        initialLineId="G4"
      />
    );

    // 概念精讲容器
    expect(html).toContain('graph-concept-view');

    // 四段论各段
    expect(html).toContain('源头基石');
    expect(html).toContain('螺旋跃迁路径');
    expect(html).toContain('核心思想方法');
    expect(html).toContain('中考压轴矩阵');

    // 右侧 LineSwimlane 泳道图已嵌入
    expect(html).toContain('line-swimlane');
    expect(html).toContain('data-testid="line-swimlane"');
    expect(html).toContain('演进泳道');
  });

  it('4. 验证真库中 12 条知识主线每条均具备至少 3 道 L4~L6 单选真题', () => {
    const coreDbPath = path.resolve(__dirname, '../../../../public/data/core.db');
    const questionsDbPath = path.resolve(__dirname, '../../../../public/data/questions.db');

    if (!fs.existsSync(coreDbPath) || !fs.existsSync(questionsDbPath)) {
      return;
    }

    const linesRaw = execSync(
      `sqlite3 -json "${coreDbPath}" "SELECT line_id, name_zh FROM logic_lines ORDER BY line_id"`,
      { encoding: 'utf-8' }
    );
    const lines = JSON.parse(linesRaw);
    expect(lines.length).toBe(12);

    const ptsRaw = execSync(
      `sqlite3 -json "${coreDbPath}" "SELECT point_id, primary_line_id FROM knowledge_points"`,
      { encoding: 'utf-8' }
    );
    const pts = JSON.parse(ptsRaw);

    const ptsByLine: Record<string, string[]> = {};
    for (const p of pts) {
      if (!ptsByLine[p.primary_line_id]) ptsByLine[p.primary_line_id] = [];
      ptsByLine[p.primary_line_id].push(p.point_id);
    }

    for (const line of lines) {
      const linePts = ptsByLine[line.line_id] || [];
      expect(linePts.length).toBeGreaterThan(0);
      const inClause = linePts.map((id: string) => `'${id}'`).join(',');
      const countRaw = execSync(
        `sqlite3 -json "${questionsDbPath}" "SELECT count(*) as count FROM questions WHERE primary_point_id IN (${inClause}) AND question_type = 'single_choice' AND difficulty_level BETWEEN 4 AND 6"`,
        { encoding: 'utf-8' }
      );
      const [{ count }] = JSON.parse(countRaw);
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  it('5. GraphNav 缺省 initialLineId 时默认选中 A1 (实数与数轴模型)', () => {
    const html = renderToString(
      <GraphNav
        lines={mockLogicLines}
      />
    );

    // 默认展示 A1 知识主线
    expect(html).toContain('A1');
    expect(html).toContain('数与代数');
    expect(html).toContain('实数与数轴模型');
  });
});

