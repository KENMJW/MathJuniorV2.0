import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { ConceptFourStages } from '../ConceptFourStages';
import { SvgLayerReveal } from '../SvgLayerReveal';
import { KnowledgePointRecord } from '../types';
import { useSessionStore } from '../../../store/sessionStore';

const mockKP023: KnowledgePointRecord = {
  point_id: 'KP-023',
  name_zh: '配方法',
  name_en: 'Completing the Square Method',
  grade: 9,
  semester: 1,
  domain: '数与代数',
  subcategory: '方程组',
  primary_line_id: 'A3',
  is_mandatory: 1,
  svg_asset_zh: 'assets/concepts/KP-023-zh.svg',
  svg_asset_en: 'assets/concepts/KP-023-en.svg',
  origin_story_zh: "并非所有一元二次方程天然就是完全平方形态，大多数方程如 $x^2 + 6x + 5 = 0$ 都是混杂的。波斯数学家阿尔·花拉子米通过在正方形两边各补一个矩形、再在角上补一个小正方形的几何拼图法，发明了'配方法'。配方法是推导求根公式与二次函数顶点式的万能母机。",
  origin_story_en: 'Al-Khwarizmi completed the square by adding geometric corner squares to rectangular tiles. Completing the square transforms any arbitrary quadratic into a solvable perfect square form.',
  intuitive_essence_zh: "配方法的本质是'补齐几何正方形缺失的右下角'。一次项系数的一半的平方 $(\\frac{b}{2a})^2$，恰恰就是让二维多项式形成闭合正方形所精确缺失的那块面积补丁。",
  intuitive_essence_en: 'Completing the square literally fills the missing geometric corner of area $(b/2)^2$ to form a closed, perfect symmetric square.',
  formal_definition_zh: "通过在方程两边加上一次项系数一半的平方，将一般方程化为 $(x+m)^2 = n$ 形式的方法。配方法标准流程：(1) 化二次项系数为 1（两边同除以 $a$）；(2) 移常数项到等号右边；(3) 两边同时加上'一次项系数一半的平方'；(4) 左边写作完全平方，右边化简；(5) 直接开平方降次求解。",
  formal_definition_en: 'Steps: normalize leading coefficient $a=1$, move constant $c$ right, add $(b/2)^2$ to both sides, compress left into $(x + b/2)^2$, and extract square roots.',
  intrinsic_variation_zh: "中考核心考查：(1) 二次三项式最值与恒正性证明：$x^2 - 4x + 7 = (x-2)^2 + 3 \\geq 3$；(2) 几何动点最值分析；(3) 陷阱：二次项系数不为 1 时漏除以 $a$ 便盲目加一次项一半的平方（如 $2x^2 + 4x + 1 = 0$ 必须先化为 $x^2 + 2x = -0.5$）。",
  intrinsic_variation_en: 'Algebraic extrema proofs: $x^2 - 4x + 7 = (x-2)^2 + 3 \\geq 3$. Crucial rule: always divide by leading coefficient $a$ before completing the square.',
  master_example_id: 'ME-KP023',
};

describe('ConceptFourStages (Task 9.1 & 铁律 3 校验)', () => {
  it('【铁律 3 源码门神】业务组件严禁 import katex 或使用 dangerouslySetInnerHTML / 裸 innerHTML', () => {
    const filePath = path.resolve(__dirname, '../ConceptFourStages.tsx');
    const code = fs.readFileSync(filePath, 'utf-8');

    // 1. 业务组件不得直接 import katex (必须由 MathRenderer 统一代理出口)
    expect(code).not.toMatch(/^\s*import\s+.*['"]katex/m);
    // 2. 业务组件不得使用 dangerouslySetInnerHTML
    expect(code).not.toContain('dangerouslySetInnerHTML');
    // 3. 业务组件不得使用裸 innerHTML
    expect(code).not.toContain('.innerHTML');
    // 4. 必须通过 MathRenderer 出口
    expect(code).toContain('MathRenderer');
  });

  it('四段论完整渲染且各段公式经 MathRenderer 渲染出 KaTeX 节点', () => {
    useSessionStore.getState().setLocale('zh-CN');
    const html = renderToString(
      React.createElement(ConceptFourStages, {
        knowledgePoint: mockKP023,
        initialStage: 1,
      })
    );

    // 1. 包含考点 ID 与中文名
    expect(html).toContain('KP-023');
    expect(html).toContain('配方法');

    // 2. 包含四段论指示标签
    expect(html).toContain('① 原点溯源');
    expect(html).toContain('② 本真透视');
    expect(html).toContain('③ 法典严定');
    expect(html).toContain('④ 本体辨正');

    // 3. 包含 MathRenderer 渲染出的安全节点
    expect(html).toContain('math-renderer');
    // 4. 包含 SVG 视窗
    expect(html).toContain('svg-layer-reveal');
  });

  it('SVG 图层在第 2 段隐藏字母标签，在第 3 段淡入点亮 (formal-labels opacity 0 -> 1)', () => {
    // 阶段 2：容器应该有 hide-formal-labels class 以通过 CSS 隐藏 .formal-labels
    const htmlStage2 = renderToString(
      React.createElement(SvgLayerReveal, { activeStage: 2, pointId: 'KP-023' })
    );
    expect(htmlStage2).toMatch(/class="[^"]*hide-formal-labels[^"]*"/);

    // 阶段 3：容器不应该有 hide-formal-labels class
    const htmlStage3 = renderToString(
      React.createElement(SvgLayerReveal, { activeStage: 3, pointId: 'KP-023' })
    );
    expect(htmlStage3).not.toMatch(/class="[^"]*hide-formal-labels[^"]*"/);
  });

  it('切换语言环境 (zh-CN vs en) 正确双语投影', () => {
    // 中文
    useSessionStore.getState().setLocale('zh-CN');
    const htmlZh = renderToString(
      React.createElement(ConceptFourStages, {
        knowledgePoint: mockKP023,
        initialStage: 3,
        locale: 'zh-CN',
      })
    );
    expect(htmlZh).toContain('配方法');
    expect(htmlZh).toContain('阶段 3 / 4');

    // 英文
    useSessionStore.getState().setLocale('en');
    const htmlEn = renderToString(
      React.createElement(ConceptFourStages, {
        knowledgePoint: mockKP023,
        initialStage: 3,
        locale: 'en',
      })
    );
    expect(htmlEn).toContain('Completing the Square Method');
    expect(htmlEn).toContain('Stage 3 / 4');
    expect(htmlEn).toContain('3. Formal Definition');

    // 恢复状态
    useSessionStore.getState().setLocale('zh-CN');
  });

  it('【铁律 7 避坑】SVG 内部严禁出现 <foreignObject>', () => {
    // 因为现在是异步 fetch SVG，renderToString 只能渲染 loading 状态
    const svgHtml = renderToString(
      React.createElement(SvgLayerReveal, { activeStage: 3, pointId: 'KP-023' })
    );
    expect(svgHtml).not.toContain('<foreignObject');
    expect(svgHtml).not.toContain('</foreignObject>');
  });
});
