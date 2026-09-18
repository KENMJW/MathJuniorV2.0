import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import * as fc from 'fast-check';
import { CombinationPanel } from './CombinationPanel';
import { GraphKnowledgePoint, KnowledgeCombination } from './types';

const mockPoint: GraphKnowledgePoint = {
  point_id: 'KP-023',
  name_zh: '勾股定理及其逆定理',
  name_en: 'Pythagorean Theorem',
  grade: 8,
  semester: 1,
  domain: '图形与几何',
  subcategory: '三角形',
  primary_line_id: 'G4',
  is_mandatory: 1,
};

describe('Feature: math-junior-frontend, Property 12', () => {
  it('【铁律 3 源码门神】CombinationPanel 严禁 import katex 或使用 dangerouslySetInnerHTML / 裸 innerHTML', () => {
    const filePath = path.resolve(__dirname, './CombinationPanel.tsx');
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

  it('Property 12: 组合基数 1~8 动态渲染 —— 任意 kp_count∈[1,8]，渲染节点数严格等于 kp_count，绝对不因 >4 截断 (≥100 次迭代)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (kpCount, randomHint) => {
          // 构造包含 mockPoint.point_id 的 kp_ids 列表，长度为 kpCount
          const kpIds = [mockPoint.point_id];
          for (let i = 1; i < kpCount; i++) {
            kpIds.push(`KP-MOCK-${i}`);
          }

          const combo: KnowledgeCombination = {
            combination_id: `C${kpCount}-TEST`,
            kp_ids: kpIds,
            kp_count: kpCount,
            directed_order: kpIds,
            question_hint_zh: `提示内容: $x^2 + y^2$ ${randomHint}`,
            question_hint_en: `Hint: $x^2 + y^2$ ${randomHint}`,
            question_types: ['solution'],
          };

          const html = renderToString(
            React.createElement(CombinationPanel, {
              point: mockPoint,
              combinations: [combo],
            })
          );

          // 统计渲染出的节点徽章数量
          const nodeMatches = html.match(/data-testid="combination-node"/g);
          const renderedNodeCount = nodeMatches ? nodeMatches.length : 0;

          // 断言：渲染节点数严格等于 kp_count (铁律 8)
          expect(renderedNodeCount).toBe(kpCount);

          // 特别针对 kp_count > 4 的情况，明确断言未被截断在 4
          if (kpCount > 4) {
            expect(renderedNodeCount).toBeGreaterThan(4);
          }
        }
      ),
      { numRuns: 120 }
    );
  });

  it('显式校验 kp_count = 5, 6, 7, 8 边界用例', () => {
    [5, 6, 7, 8].forEach((count) => {
      const kpIds = Array.from({ length: count }, (_, i) => (i === 0 ? 'KP-023' : `KP-EXT-${i}`));
      const combo: KnowledgeCombination = {
        combination_id: `C${count}-EDGE`,
        kp_ids: kpIds,
        kp_count: count,
        question_hint_zh: `高阶组合 ${count}`,
        question_hint_en: `High tier combination ${count}`,
        question_types: ['solution'],
      };

      const html = renderToString(
        React.createElement(CombinationPanel, {
          point: mockPoint,
          combinations: [combo],
        })
      );

      const nodeMatches = html.match(/data-testid="combination-node"/g);
      expect(nodeMatches).not.toBeNull();
      expect(nodeMatches?.length).toBe(count);
      // 验证包含所有节点 ID
      kpIds.forEach((id) => {
        expect(html).toContain(id);
      });
    });
  });

  it('三大跳板入口按钮均正常渲染且文本经 MathRenderer 渲染', () => {
    const html = renderToString(
      React.createElement(CombinationPanel, {
        point: mockPoint,
        combinations: [],
      })
    );

    expect(html).toContain('概念精讲');
    expect(html).toContain('沙盒探究');
    expect(html).toContain('专项测评');
    expect(html).toContain('KP-023');
  });
});
