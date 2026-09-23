import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { LineSwimlane, LineSwimlanePoint, LineSwimlaneProps } from '../LineSwimlane';

describe('LineSwimlane (TASK-FE-0015 块 C 竖向泳道图组件规范校验)', () => {
  const sampleProps: LineSwimlaneProps = {
    lineId: 'A1',
    lineName: '实数与数轴模型',
    points: [],
  };
  const samplePoints: LineSwimlanePoint[] = [
    {
      point_id: 'KP-001',
      name_zh: '有理数与数轴',
      name_en: 'Rational Numbers & Number Line',
      grade: 7,
      semester: 1,
    },
    {
      point_id: 'KP-002',
      name_zh: '相反数与绝对值',
      name_en: 'Opposites & Absolute Value',
      grade: 7,
      semester: 1,
    },
    {
      point_id: 'KP-015',
      name_zh: '整式加减与数轴动点',
      name_en: 'Algebraic Terms & Moving Points',
      grade: 7,
      semester: 2,
    },
    {
      point_id: 'KP-042',
      name_zh: '平方根与实数完备性',
      name_en: 'Square Roots & Real Numbers',
      grade: 8,
      semester: 1,
    },
    {
      point_id: 'KP-099',
      name_zh: '二次函数数轴压轴极值',
      name_en: 'Quadratic Extrema on Number Axis',
      grade: 9,
      semester: 2,
    },
  ];

  it('【严格红线 1 & 3】源码零 emoji、零 eval、零 innerHTML、零 foreignObject、公式经 MathRenderer', () => {
    const filePath = path.resolve(__dirname, '../LineSwimlane.tsx');
    const code = fs.readFileSync(filePath, 'utf-8');

    // 1. 业务组件严禁直接 import katex (由 MathRenderer 代理)
    expect(code).not.toMatch(/^\s*import\s+.*['"]katex/m);
    // 2. 严禁 dangerouslySetInnerHTML 与 innerHTML
    expect(code).not.toContain('dangerouslySetInnerHTML');
    expect(code).not.toContain('.innerHTML');
    // 3. 严禁 eval
    expect(code).not.toContain('eval(');
    // 4. 严禁 foreignObject
    expect(code).not.toContain('foreignObject');
    // 5. 源码绝对零 emoji (排除中文标点及普通汉字)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(code)).toBe(false);
    // 6. 必须使用 MathRenderer
    expect(code).toContain('MathRenderer');
  });

  it('按学期自顶向下划分 6 个学期段（7上、7下、8上、8下、9上、9下）', () => {
    const html = renderToString(
      React.createElement(LineSwimlane, {
        lineId: 'A1',
        lineName: '实数与数轴模型',
        points: samplePoints,
      })
    );

    // 必须出现 6 个学期段徽标
    expect(html).toContain('7上');
    expect(html).toContain('7下');
    expect(html).toContain('8上');
    expect(html).toContain('8下');
    expect(html).toContain('9上');
    expect(html).toContain('9下');

    // 必须包含对应的学期全称
    expect(html).toContain('七年级上册');
    expect(html).toContain('七年级下册');
    expect(html).toContain('八年级上册');
    expect(html).toContain('八年级下册');
    expect(html).toContain('九年级上册');
    expect(html).toContain('九年级下册');

    // 检查 6 个学期按先后顺序排列
    const pos7_1 = html.indexOf('swimlane-tier-7-1');
    const pos7_2 = html.indexOf('swimlane-tier-7-2');
    const pos8_1 = html.indexOf('swimlane-tier-8-1');
    const pos8_2 = html.indexOf('swimlane-tier-8-2');
    const pos9_1 = html.indexOf('swimlane-tier-9-1');
    const pos9_2 = html.indexOf('swimlane-tier-9-2');

    expect(pos7_1).toBeGreaterThan(-1);
    expect(pos7_2).toBeGreaterThan(pos7_1);
    expect(pos8_1).toBeGreaterThan(pos7_2);
    expect(pos8_2).toBeGreaterThan(pos8_1);
    expect(pos9_1).toBeGreaterThan(pos8_2);
    expect(pos9_2).toBeGreaterThan(pos9_1);
  });

  it('每个学期段内列出该谱系的考点 point_id 与 name_zh，同学期多个考点纵向排列', () => {
    const html = renderToString(
      React.createElement(LineSwimlane, {
        lineId: 'A1',
        lineName: '实数与数轴模型',
        points: samplePoints,
      })
    );

    // 7上包含 2 个考点
    expect(html).toContain('KP-001');
    expect(html).toContain('有理数与数轴');
    expect(html).toContain('KP-002');
    expect(html).toContain('相反数与绝对值');

    // 7下包含 1 个考点
    expect(html).toContain('KP-015');
    expect(html).toContain('整式加减与数轴动点');

    // 8上包含 1 个考点
    expect(html).toContain('KP-042');
    expect(html).toContain('平方根与实数完备性');

    // 9下包含 1 个考点
    expect(html).toContain('KP-099');
    expect(html).toContain('二次函数数轴压轴极值');
  });

  it('若某学期无此谱系考点，展示优雅占位文案 "— 无本谱系考点 —"', () => {
    const html = renderToString(
      React.createElement(LineSwimlane, {
        lineId: 'A1',
        lineName: '实数与数轴模型',
        points: samplePoints, // 8下 (8-2) 与 9上 (9-1) 均为空
      })
    );

    // 8下与 9上应当展示占位文案
    expect(html).toContain('swimlane-empty-8-2');
    expect(html).toContain('swimlane-empty-9-1');
    expect(html).toContain('— 无本谱系考点 —');
  });

  it('全空考点时 6 个学期全部优雅显示占位文案且不崩溃', () => {
    const html = renderToString(
      React.createElement(LineSwimlane, sampleProps)
    );

    expect(html).toContain('A1');
    expect(html).toContain('实数与数轴模型');
    expect(html).toContain('共 0 个考点');
    expect(html).toContain('swimlane-empty-7-1');
    expect(html).toContain('swimlane-empty-7-2');
    expect(html).toContain('swimlane-empty-8-1');
    expect(html).toContain('swimlane-empty-8-2');
    expect(html).toContain('swimlane-empty-9-1');
    expect(html).toContain('swimlane-empty-9-2');

    // 匹配 6 次 "— 无本谱系考点 —"
    const matches = html.match(/— 无本谱系考点 —/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBe(6);
  });

  it('纯展示不可交互，不设 button/input/a 标签等可交互操作元素', () => {
    const html = renderToString(
      React.createElement(LineSwimlane, {
        lineId: 'G4',
        lineName: '圆的几何度量与位置关系',
        points: [
          { point_id: 'KP-074', name_zh: '垂径定理', grade: 9, semester: 1 },
        ],
      })
    );

    // 纯文档卡片展示，不包含交互表单/按钮/超链接
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<select');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('<a ');
  });

  it('支持传入自定义 className 和 style 扩展样式', () => {
    const html = renderToString(
      React.createElement(LineSwimlane, {
        lineId: 'A2',
        points: [],
        className: 'custom-swimlane-class',
        style: { marginTop: '24px' },
      })
    );

    expect(html).toContain('custom-swimlane-class');
    expect(html).toContain('margin-top:24px');
  });
});
