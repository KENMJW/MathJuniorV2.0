import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
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
});
