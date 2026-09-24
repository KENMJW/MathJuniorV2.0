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
  InvariantSpec,
} from '../invariants';
import { evaluateSafeExpression } from '../safeExpression';

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

  describe('6. SB-KP057 勾股定理与遥测数学计算 (彻底根除 25 vs 5 矛盾)', () => {
    const kp057Specs: InvariantSpec[] = [
      {
        id: 'inv_pythagorean_sum',
        formula: 'leg_a^2 + leg_b^2',
        deps: ['leg_a', 'leg_b'],
        labelZh: '两直角边平方和 a² + b²',
        isConstant: false,
        labelEn: 'Sum of Legs Squared a² + b²',
      },
      {
        id: 'inv_hypot_c_sq',
        formula: 'hypot * hypot',
        deps: ['leg_a', 'leg_b'],
        labelZh: '斜边平方 c²',
        isConstant: false,
        labelEn: 'Hypotenuse Squared c²',
      },
      {
        id: 'inv_pythagoras_closure',
        formula:
          "abs((leg_a^2 + leg_b^2) - (hypot * hypot)) < 0.01 ? '勾股恒等守恒成立 (a²+b²≡c²)' : '计算中'",
        deps: ['leg_a', 'leg_b'],
        labelZh: '勾股恒等关系',
        isConstant: true,
        labelEn: 'Pythagorean Identity a² + b² ≡ c²',
      },
    ];

    it('在 leg_a=3, leg_b=4 时，平方和严格等于 25.00，斜边平方严格等于 25.00，恒等式成立，绝不输出 5.00', () => {
      const scopeWithoutHypot = { leg_a: 3, leg_b: 4 };
      const pointMap: Record<string, Point2D> = {
        C: { x: 0, y: 0 },
        A: { x: 0, y: 4 },
        B: { x: 3, y: 0 },
      };

      // 1. 底层表达式数值求值断言
      const sumVal = evaluateSafeExpression(kp057Specs[0].formula!, { ...scopeWithoutHypot, hypot: 5 });
      const hypotSqVal = evaluateSafeExpression(kp057Specs[1].formula!, { ...scopeWithoutHypot, hypot: 5 });
      const closureVal = evaluateSafeExpression(kp057Specs[2].formula!, { ...scopeWithoutHypot, hypot: 5 });

      expect(sumVal).toBe(25);
      expect(Number(sumVal).toFixed(2)).toBe('25.00');

      expect(hypotSqVal).toBe(25);
      expect(Number(hypotSqVal).toFixed(2)).toBe('25.00');
      // 核心断言：绝对杜绝输出 5 或 5.00
      expect(hypotSqVal).not.toBe(5);
      expect(Number(hypotSqVal).toFixed(2)).not.toBe('5.00');

      expect(closureVal).toBe('勾股恒等守恒成立 (a²+b²≡c²)');

      // 2. formatInvariantText 格式化断言（自适应推导 hypot=5）
      const textSum = formatInvariantText(kp057Specs[0], pointMap, 'zh-CN', scopeWithoutHypot);
      const textHypotSq = formatInvariantText(kp057Specs[1], pointMap, 'zh-CN', scopeWithoutHypot);
      const textClosure = formatInvariantText(kp057Specs[2], pointMap, 'zh-CN', scopeWithoutHypot);

      expect(textSum).toContain('25');
      expect(textHypotSq).toContain('25');
      expect(textHypotSq).not.toContain('5.00');
      expect(textHypotSq).not.toContain('= 5');
      expect(textClosure).toContain('勾股恒等守恒成立');

      // 3. 显式带有 hypot 的作用域计算断言
      const scopeWithHypot = { leg_a: 3, leg_b: 4, hypot: 5 };
      const textHypotSqWithH = formatInvariantText(kp057Specs[1], pointMap, 'zh-CN', scopeWithHypot);
      expect(textHypotSqWithH).toBe('两直角边平方和 a² + b² = 25' ? '斜边平方 c² = 25' : '');
      expect(textHypotSqWithH).not.toContain('5.00');

      // 4. spec.type === 'distance_sq' 几何不变量断言
      const distSqSpec: InvariantSpec = {
        id: 'inv_c_sq_geom',
        type: 'distance_sq',
        deps: ['A', 'B'],
        formula: 'c^2 = {val}',
        labelZh: '斜边平方 c²',
      };
      const textDistSq = formatInvariantText(distSqSpec, pointMap, 'zh-CN');
      expect(textDistSq).toBe('斜边平方 c²: $c^2 = 25.00$');
      expect(textDistSq).not.toContain('c^2 = 5.00');
      expect(textDistSq).not.toContain(': 5.00');
      const valDistSq = evaluateInvariantValue(distSqSpec, pointMap);
      expect(valDistSq).toBe(25);
      expect(valDistSq?.toFixed(2)).toBe('25.00');
    });
  });

  describe('7. SB-KP008 平方根夹逼与 SB-KP085 同角三角函数计算验证', () => {
    it('SB-KP008 补全区间夹逼遥测项 (val_base=5)', () => {
      const scope = { val_base: 5 };
      const kp008Specs: InvariantSpec[] = [
        {
          id: 'inv_sqrt',
          formula: 'sqrt(val_base)',
          deps: ['val_base'],
          labelZh: '无理数取值 √a 锁定',
        },
        {
          id: 'inv_lower_bound',
          formula: 'floor(sqrt(val_base))',
          deps: ['val_base'],
          labelZh: '区间下界整数 n',
        },
        {
          id: 'inv_upper_bound',
          formula: 'floor(sqrt(val_base)) + 1',
          deps: ['val_base'],
          labelZh: '区间上界整数 n+1',
        },
        {
          id: 'inv_sq_ineq',
          formula: 'val_base',
          deps: ['val_base'],
          labelZh: '完全平方数夹逼不等式',
          state_label:
            "val_base < 4 ? '1 < a < 4 => 1 < √a < 2' : (val_base < 9 ? '4 <= a < 9 => 2 <= √a < 3' : (val_base < 16 ? '9 <= a < 16 => 3 <= √a < 4' : '16 <= a < 25 => 4 <= √a < 5'))",
        },
        {
          id: 'inv_diff',
          formula: 'sqrt(val_base) - floor(sqrt(val_base))',
          deps: ['val_base'],
          labelZh: '无理数小数部分 (√a - n)',
        },
      ];

      expect(evaluateSafeExpression(kp008Specs[0].formula!, scope)).toBeCloseTo(2.236, 3);
      expect(evaluateSafeExpression(kp008Specs[1].formula!, scope)).toBe(2);
      expect(evaluateSafeExpression(kp008Specs[2].formula!, scope)).toBe(3);
      expect(evaluateSafeExpression(kp008Specs[4].formula!, scope)).toBeCloseTo(0.236, 3);

      const textLower = formatInvariantText(kp008Specs[1], {}, 'zh-CN', scope);
      const textUpper = formatInvariantText(kp008Specs[2], {}, 'zh-CN', scope);
      const textIneq = formatInvariantText(kp008Specs[3], {}, 'zh-CN', scope);
      const textDiff = formatInvariantText(kp008Specs[4], {}, 'zh-CN', scope);

      expect(textLower).toBe('区间下界整数 n = 2');
      expect(textUpper).toBe('区间上界整数 n+1 = 3');
      expect(textIneq).toContain('4 <= a < 9 => 2 <= √a < 3');
      expect(textDiff).toBe('无理数小数部分 (√a - n) = 0.24');
    });

    it('SB-KP085 同角三角函数平方和公式 (angle_A=30, hypot_c=6)', () => {
      const scope = { angle_A: 30, hypot_c: 6 };
      const pointMap: Record<string, Point2D> = {
        C: { x: 0, y: 0 },
        A: { x: 5.19615, y: 0 },
        B: { x: 5.19615, y: 3 },
      };

      const kp085Specs: InvariantSpec[] = [
        {
          id: 'inv_angle_A',
          type: 'angle',
          deps: ['B', 'C', 'A'],
          formula: '\\angle A = {val}^\\circ',
          labelZh: '锐角 A 真实度数',
        },
        {
          id: 'inv_sin_A',
          type: 'ratio_distance',
          deps: ['A', 'B', 'B', 'C'],
          formula: '\\sin A = AB/BC = {val}',
          labelZh: '正弦值 (对边/斜边)',
        },
        {
          id: 'inv_cos_A',
          type: 'ratio_distance',
          deps: ['A', 'C', 'B', 'C'],
          formula: '\\cos A = AC/BC = {val}',
          labelZh: '余弦值 (邻边/斜边)',
        },
        {
          id: 'inv_tan_A',
          type: 'ratio_distance',
          deps: ['A', 'B', 'A', 'C'],
          formula: '\\tan A = AB/AC = {val}',
          labelZh: '正切值 (对边/邻边)',
        },
        {
          id: 'inv_pythagorean_identity',
          formula: 'sin(angle_A * pi / 180)^2 + cos(angle_A * pi / 180)^2',
          deps: ['angle_A'],
          labelZh: '同角三角函数平方和公式 sin²A + cos²A',
          isConstant: true,
        },
      ];

      // 验证角度为 30°
      const angleVal = evaluateInvariantValue(kp085Specs[0], pointMap);
      expect(angleVal).toBeCloseTo(30, 1);

      // 验证 sin(30°) = 0.50
      const sinVal = evaluateInvariantValue(kp085Specs[1], pointMap);
      expect(sinVal).toBeCloseTo(0.5, 2);

      // 验证 cos(30°) = √3/2 ≈ 0.866
      const cosVal = evaluateInvariantValue(kp085Specs[2], pointMap);
      expect(cosVal).toBeCloseTo(0.866, 2);

      // 验证 tan(30°) = 1/√3 ≈ 0.577
      const tanVal = evaluateInvariantValue(kp085Specs[3], pointMap);
      expect(tanVal).toBeCloseTo(0.577, 2);

      // 验证同角三角函数平方和恒等式
      const trigSum = evaluateSafeExpression(kp085Specs[4].formula!, scope);
      expect(trigSum).toBe(1);

      const textTrigSum = formatInvariantText(kp085Specs[4], pointMap, 'zh-CN', scope);
      expect(textTrigSum).toBe('同角三角函数平方和公式 sin²A + cos²A = 1');
    });
  });
});

