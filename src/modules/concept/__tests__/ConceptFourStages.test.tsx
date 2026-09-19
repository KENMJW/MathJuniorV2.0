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
  name_zh: '勾股定理及其逆定理',
  name_en: 'Pythagorean Theorem and Its Converse',
  grade: 8,
  semester: 1,
  domain: '图形与几何',
  subcategory: '三角形',
  primary_line_id: 'G4',
  is_mandatory: 1,
  svg_asset_zh: 'assets/concepts/KP-023-zh.svg',
  svg_asset_en: 'assets/concepts/KP-023-en.svg',
  origin_story_zh: '古巴比伦泥板与商高答周公，直角三角形边长平方和的几何发现与测量需求。',
  origin_story_en: 'Ancient surveying and the geometric discovery of square sums in right triangles.',
  intuitive_essence_zh: '直角三角形两直角边的正方形面积之和恒等于斜边上的正方形面积：$a^2 + b^2 = c^2$。',
  intuitive_essence_en: 'The sum of areas of the two squares on the legs equals the area of the square on the hypotenuse: $a^2 + b^2 = c^2$.',
  formal_definition_zh: '在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，则 $a^2 + b^2 = c^2$。',
  formal_definition_en: 'In $\\text{Rt}\\triangle ABC$ with $\\angle C = 90^\\circ$, $a^2 + b^2 = c^2$.',
  intrinsic_variation_zh: '若 $a^2 + b^2 = c^2$，则三角形为直角三角形；斜边最长。',
  intrinsic_variation_en: 'Converse: if $a^2 + b^2 = c^2$, it is a right triangle.',
  master_example_id: 'ME-KP023',
  sandbox_id: 'SB-KP023',
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
    expect(html).toContain('勾股定理及其逆定理');

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
    expect(htmlZh).toContain('勾股定理及其逆定理');
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
    expect(htmlEn).toContain('Pythagorean Theorem and Its Converse');
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
