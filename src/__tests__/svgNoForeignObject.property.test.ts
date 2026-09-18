import { describe, it, expect } from "vitest";
import fc from "fast-check";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { RadarChart, CognitiveRadarScores } from "../modules/exam/RadarChart";
import { SvgLayerReveal, StageNumber } from "../modules/concept/SvgLayerReveal";
import { FocusBeam } from "../modules/graph/FocusBeam";

/**
 * SVG 资产净化与防御性后处理函数 (Property 20)
 * 严格剔除或拦截任何 <foreignObject> 标签及其包裹内容，保证 WebKit / Safari 与打印引擎安全
 */
export function sanitizeSvg(svg: string): string {
  if (!svg) return "";
  return svg
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<foreignObject[\s\S]*?\/>/gi, "");
}

/**
 * Feature: math-junior-frontend, Property 20: SVG 资产无 foreignObject
 *
 * 验收要求：
 * 1. 任意组件生成的 SVG 输出绝对不包含 <foreignObject>；
 * 2. 任意经过后处理/净化的 SVG 资产严格免疫 foreignObject 注入；
 * 3. fast-check 属性测试迭代次数 >= 100 次。
 */
describe("Feature: math-junior-frontend, Property 20: SVG 资产无 foreignObject", () => {
  it("Property 20.1: RadarChart 在任意四维素养分值分布下（>=100 次）绝不包含 foreignObject", () => {
    fc.assert(
      fc.property(
        fc.record<CognitiveRadarScores>({
          breadth: fc.integer({ min: 0, max: 100 }),
          insight: fc.integer({ min: 0, max: 100 }),
          hiddenCondition: fc.integer({ min: 0, max: 100 }),
          resilience: fc.integer({ min: 0, max: 100 }),
        }),
        (scores) => {
          const element = React.createElement(RadarChart, { scores, size: 360 });
          const svgHtml = ReactDOMServer.renderToString(element);

          expect(svgHtml).not.toContain("<foreignObject");
          expect(svgHtml.toLowerCase()).not.toContain("foreignobject");
        }
      ),
      { numRuns: 120 }
    );
  });

  it("Property 20.2: SvgLayerReveal 在全部阶段 (1..4) 及自定义尺寸下绝不包含 foreignObject", () => {
    const stages: StageNumber[] = [1, 2, 3, 4];
    fc.assert(
      fc.property(
        fc.constantFrom(...stages),
        fc.integer({ min: 200, max: 1000 }),
        (stage, size) => {
          const element = React.createElement(SvgLayerReveal, {
            activeStage: stage,
            style: { width: `${size}px` },
          });
          const svgHtml = ReactDOMServer.renderToString(element);

          expect(svgHtml).not.toContain("<foreignObject");
          expect(svgHtml.toLowerCase()).not.toContain("foreignobject");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 20.3: FocusBeam 任意依赖考点光束下（>=100 次）绝不包含 foreignObject", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("KP-002", "KP-003", "KP-004"), { minLength: 0, maxLength: 3 }),
        fc.array(fc.constantFrom("KP-005", "KP-006", "KP-007"), { minLength: 0, maxLength: 3 }),
        (preds, succs) => {
          const nodeCoords = {
            "KP-001": { x: 300, y: 300 },
            "KP-002": { x: 100, y: 150 },
            "KP-003": { x: 100, y: 450 },
            "KP-004": { x: 100, y: 300 },
            "KP-005": { x: 500, y: 150 },
            "KP-006": { x: 500, y: 450 },
            "KP-007": { x: 500, y: 300 },
          };

          const element = React.createElement(FocusBeam, {
            focusedPointId: "KP-001",
            nodeCoords,
            predecessors: preds,
            successors: succs,
          });
          const svgHtml = ReactDOMServer.renderToString(element);

          expect(svgHtml).not.toContain("<foreignObject");
          expect(svgHtml.toLowerCase()).not.toContain("foreignobject");
        }
      ),
      { numRuns: 120 }
    );
  });

  it("Property 20.4: SVG 资产净化器后处理性质：任意输入经 sanitizeSvg 后恒无 foreignObject (>=100 次)", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.boolean(),
        (rawText, injectForeign) => {
          const input = injectForeign
            ? `<svg><g>${rawText}</g><foreignObject width="100" height="50"><div>test</div></foreignObject></svg>`
            : `<svg><g>${rawText}</g></svg>`;

          const sanitized = sanitizeSvg(input);
          expect(sanitized).not.toContain("<foreignObject");
          expect(sanitized.toLowerCase()).not.toContain("</foreignobject>");
        }
      ),
      { numRuns: 120 }
    );
  });
});
