import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateAngle,
  calculateVerticalDistance,
  calculateTriangleArea,
  calculateDistanceRatio,
  evaluateInvariantValue,
  formatInvariantText,
  Point2D,
} from '../invariants';

describe('沙盒不变量计算引擎边界测试 (Task 11.3 & 模块三收口验收)', () => {
  describe('1. 角度不变量 calculateAngle (无向夹角 [0, 180])', () => {
    const origin: Point2D = { x: 0, y: 0 };

    it('直角边界测试 (90°)', () => {
      // 位于第一象限轴上
      const pA: Point2D = { x: 5, y: 0 };
      const pB: Point2D = { x: 0, y: 4 };
      expect(calculateAngle(pA, origin, pB)).toBeCloseTo(90, 4);

      // 任意平移后的直角
      const o2: Point2D = { x: 3, y: 3 };
      const a2: Point2D = { x: 6, y: 3 };
      const b2: Point2D = { x: 3, y: -1 };
      expect(calculateAngle(a2, o2, b2)).toBeCloseTo(90, 4);
    });

    it('钝角边界测试 (>90°)', () => {
      // 135° 夹角
      const pA: Point2D = { x: 1, y: 0 };
      const pB: Point2D = { x: -1, y: 1 };
      expect(calculateAngle(pA, origin, pB)).toBeCloseTo(135, 4);

      // 150° 夹角
      const pC: Point2D = { x: -Math.sqrt(3), y: 1 };
      expect(calculateAngle(pA, origin, pC)).toBeCloseTo(150, 4);
    });

    it('跨象限测试 (从第二象限到第四象限)', () => {
      const pQ2: Point2D = { x: -3, y: 4 }; // 第二象限
      const pQ4: Point2D = { x: 4, y: -3 }; // 第四象限
      // 向量(-3,4)与(4,-3)的夹角约为 163.74°
      const angle = calculateAngle(pQ2, origin, pQ4);
      expect(angle).toBeGreaterThan(90);
      expect(angle).toBeLessThan(180);
      expect(Number.isFinite(angle)).toBe(true);
    });

    it('共线与反向边界测试 (0° 与 180°)', () => {
      // 同向共线 (0°)
      const p1: Point2D = { x: 2, y: 0 };
      const p2: Point2D = { x: 7, y: 0 };
      expect(calculateAngle(p1, origin, p2)).toBeCloseTo(0, 4);

      // 反向共线 (180°)
      const pOpposite: Point2D = { x: -5, y: 0 };
      expect(calculateAngle(p1, origin, pOpposite)).toBeCloseTo(180, 4);
    });

    it('退化点边界测试 (点与顶点重合)', () => {
      const pA: Point2D = { x: 0, y: 0 }; // 与 origin 重合
      const pB: Point2D = { x: 3, y: 4 };
      expect(calculateAngle(pA, origin, pB)).toBe(0);
      expect(calculateAngle(pB, origin, pA)).toBe(0);
    });

    it('属性测试：任意浮点坐标输入下，夹角恒 ∈ [0, 180] 且不崩溃 (≥150 次迭代)', () => {
      fc.assert(
        fc.property(
          fc.record({
            ax: fc.double({ min: -100, max: 100, noNaN: true }),
            ay: fc.double({ min: -100, max: 100, noNaN: true }),
            ox: fc.double({ min: -100, max: 100, noNaN: true }),
            oy: fc.double({ min: -100, max: 100, noNaN: true }),
            bx: fc.double({ min: -100, max: 100, noNaN: true }),
            by: fc.double({ min: -100, max: 100, noNaN: true }),
          }),
          ({ ax, ay, ox, oy, bx, by }) => {
            const angle = calculateAngle({ x: ax, y: ay }, { x: ox, y: oy }, { x: bx, y: by });
            expect(Number.isFinite(angle)).toBe(true);
            expect(angle).toBeGreaterThanOrEqual(-1e-6);
            expect(angle).toBeLessThanOrEqual(180 + 1e-6);
          }
        ),
        { numRuns: 150 }
      );
    });
  });

  describe('2. 垂直距离 calculateVerticalDistance (|y1 - y2|)', () => {
    it('跨 x 轴距离计算', () => {
      const p1: Point2D = { x: 2, y: 5 };
      const p2: Point2D = { x: 2, y: -3 };
      expect(calculateVerticalDistance(p1, p2)).toBe(8);
      expect(calculateVerticalDistance(p2, p1)).toBe(8);
    });

    it('全负坐标与重合坐标', () => {
      const p1: Point2D = { x: -4, y: -2 };
      const p2: Point2D = { x: 10, y: -9 };
      expect(calculateVerticalDistance(p1, p2)).toBe(7);

      const pSame: Point2D = { x: 0, y: -2 };
      expect(calculateVerticalDistance(p1, pSame)).toBe(0);
    });

    it('属性测试：垂直距离恒 ≥ 0 且对称 (≥150 次迭代)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -500, max: 500, noNaN: true }),
          fc.double({ min: -500, max: 500, noNaN: true }),
          (y1, y2) => {
            const d12 = calculateVerticalDistance({ x: 0, y: y1 }, { x: 0, y: y2 });
            const d21 = calculateVerticalDistance({ x: 0, y: y2 }, { x: 0, y: y1 });
            expect(d12).toBeGreaterThanOrEqual(0);
            expect(d12).toBeCloseTo(d21, 5);
          }
        ),
        { numRuns: 150 }
      );
    });
  });

  describe('3. 三角形面积 calculateTriangleArea (Shoelace 算法)', () => {
    it('标准直角三角形面积', () => {
      // 底 3 高 4
      const pA: Point2D = { x: 0, y: 0 };
      const pB: Point2D = { x: 3, y: 0 };
      const pC: Point2D = { x: 0, y: 4 };
      expect(calculateTriangleArea(pA, pB, pC)).toBeCloseTo(6, 4);
    });

    it('顺时针与逆时针三点保正性', () => {
      const pA: Point2D = { x: 1, y: 1 };
      const pB: Point2D = { x: 4, y: 2 };
      const pC: Point2D = { x: 2, y: 5 };
      const s1 = calculateTriangleArea(pA, pB, pC);
      const s2 = calculateTriangleArea(pA, pC, pB);
      expect(s1).toBeGreaterThan(0);
      expect(s1).toBeCloseTo(s2, 5);
    });

    it('共线三点面积严格为 0', () => {
      const pA: Point2D = { x: 1, y: 1 };
      const pB: Point2D = { x: 2, y: 2 };
      const pC: Point2D = { x: 5, y: 5 };
      expect(calculateTriangleArea(pA, pB, pC)).toBe(0);
    });

    it('属性测试：三角形面积恒 ≥ 0 且不因顶点顺序变负 (≥150 次迭代)', () => {
      fc.assert(
        fc.property(
          fc.record({
            ax: fc.double({ min: -50, max: 50, noNaN: true }),
            ay: fc.double({ min: -50, max: 50, noNaN: true }),
            bx: fc.double({ min: -50, max: 50, noNaN: true }),
            by: fc.double({ min: -50, max: 50, noNaN: true }),
            cx: fc.double({ min: -50, max: 50, noNaN: true }),
            cy: fc.double({ min: -50, max: 50, noNaN: true }),
          }),
          ({ ax, ay, bx, by, cx, cy }) => {
            const area = calculateTriangleArea({ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy });
            expect(area).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(area)).toBe(true);
          }
        ),
        { numRuns: 150 }
      );
    });
  });

  describe('4. 距离比值 calculateDistanceRatio (PA / PB 与 d2=0 防呆)', () => {
    const pA: Point2D = { x: -2, y: 0 };
    const pB: Point2D = { x: 2, y: 0 };

    it('标准距离比值计算', () => {
      // P 位于中垂线上 (0, 0)
      const pMid: Point2D = { x: 0, y: 0 };
      expect(calculateDistanceRatio(pMid, pA, pB)).toBeCloseTo(1.0, 4);

      // P 与 A 重合 -> PA = 0, 比值为 0
      expect(calculateDistanceRatio(pA, pA, pB)).toBeCloseTo(0, 4);
    });

    it('核心边界：d2 = 0 时分母除零防呆 (安全返回 0，严禁抛出或返回 NaN/Infinity)', () => {
      // P 与 B 重合 -> PB = 0
      const ratio = calculateDistanceRatio(pB, pA, pB);
      expect(ratio).toBe(0);
      expect(Number.isFinite(ratio)).toBe(true);
      expect(Number.isNaN(ratio)).toBe(false);
    });

    it('属性测试：比值恒 ≥ 0 且永不返回 NaN 或 Infinity (≥150 次迭代)', () => {
      fc.assert(
        fc.property(
          fc.record({
            px: fc.double({ min: -100, max: 100, noNaN: true }),
            py: fc.double({ min: -100, max: 100, noNaN: true }),
            ax: fc.double({ min: -100, max: 100, noNaN: true }),
            ay: fc.double({ min: -100, max: 100, noNaN: true }),
            bx: fc.double({ min: -100, max: 100, noNaN: true }),
            by: fc.double({ min: -100, max: 100, noNaN: true }),
          }),
          ({ px, py, ax, ay, bx, by }) => {
            const ratio = calculateDistanceRatio({ x: px, y: py }, { x: ax, y: ay }, { x: bx, y: by });
            expect(ratio).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(ratio)).toBe(true);
            expect(Number.isNaN(ratio)).toBe(false);
          }
        ),
        { numRuns: 150 }
      );
    });
  });

  describe('5. 调度与格式化测试 formatInvariantText', () => {
    const pointMap: Record<string, Point2D> = {
      A: { x: 0, y: 4 },
      O: { x: 0, y: 0 },
      B: { x: 3, y: 0 },
      P: { x: 2, y: 6 },
      Q: { x: 2, y: 1 },
    };

    it('格式化角度文本', () => {
      const text = formatInvariantText(
        {
          type: 'angle',
          deps: ['A', 'O', 'B'],
          formula: '∠AOB = {val}°',
          labelZh: '旋转角',
        },
        pointMap
      );
      expect(text).toBe('旋转角: ∠AOB = 90.0°');
    });

    it('格式化铅垂高文本', () => {
      const text = formatInvariantText(
        {
          type: 'vertical_distance',
          deps: ['P', 'Q'],
          formula: 'h = {val}',
          labelZh: '铅垂高',
        },
        pointMap
      );
      expect(text).toBe('铅垂高: h = 5.00');
    });

    it('格式化阿氏圆比值文本', () => {
      const spec = {
        type: 'ratio_distance' as const,
        deps: ['P', 'A', 'B'],
        formula: 'PA / PB = {val}',
        labelZh: '定比',
      };
      const rawVal = evaluateInvariantValue(spec, pointMap);
      expect(rawVal).toBeGreaterThan(0);

      const text = formatInvariantText(spec, pointMap);
      expect(text).toContain('定比: PA / PB =');
    });
  });
});
