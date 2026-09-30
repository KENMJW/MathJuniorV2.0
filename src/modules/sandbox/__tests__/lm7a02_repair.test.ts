import { describe, it, expect } from 'vitest';
import {
  solveLM7A02,
  compileMorphingSandboxConfig,
  mockLeapSandboxModels,
  CarrierPoint,
} from '../morphControllers';
import { formatInvariantText, InvariantSpec } from '../invariants';

describe('LM-7A-02 Repair Verification', () => {
  const model7a02 = mockLeapSandboxModels.find((m) => m.model_id === 'LM-7A-02')!;

  describe('Carrier 1: single_segment (线段双中点和差)', () => {
    const carrier1Points: CarrierPoint[] = [
      { id: 'A', name: 'A', x: -4, y: 0, color: '#38bdf8', size: 5, isFixed: true },
      { id: 'B', name: 'B', x: 4, y: 0, color: '#38bdf8', size: 5, isFixed: true },
      { id: 'P', name: 'P(动分点)', x: 0, y: 0, color: '#f59e0b', size: 6, isFixed: false },
      { id: 'M1', name: 'M1(AP中点)', x: -2, y: 0, color: '#34c759', size: 5, isFixed: false },
      { id: 'M2', name: 'M2(PB中点)', x: 2, y: 0, color: '#34c759', size: 5, isFixed: false },
    ];

    it('should dynamically update Point P, M1, M2 with pos_p slider', () => {
      const solved = solveLM7A02(carrier1Points, { pos_p: 1.5, len_ab: 8.0 });
      const ptA = solved.find((p) => p.id === 'A')!;
      const ptB = solved.find((p) => p.id === 'B')!;
      const ptP = solved.find((p) => p.id === 'P')!;
      const ptM1 = solved.find((p) => p.id === 'M1')!;
      const ptM2 = solved.find((p) => p.id === 'M2')!;

      expect(ptA.x).toBe(-4);
      expect(ptB.x).toBe(4);
      expect(ptP.x).toBe(1.5);
      // M1 = (-4 + 1.5) / 2 = -1.25
      expect(ptM1.x).toBe(-1.25);
      // M2 = (1.5 + 4) / 2 = 2.75
      expect(ptM2.x).toBe(2.75);

      // M1M2 恒等折半公理验证: M1M2 = 2.75 - (-1.25) = 4.0 = 1/2 * 8.0
      const distM1M2 = ptM2.x - ptM1.x;
      expect(distM1M2).toBeCloseTo(4.0, 5);
    });

    it('should satisfy double-midpoint halving theorem M1M2 = 1/2 AB for various positions', () => {
      const testCases = [
        { pos_p: -2.0, len_ab: 8.0 },
        { pos_p: 0.0, len_ab: 8.0 },
        { pos_p: 2.5, len_ab: 10.0 },
        { pos_p: -3.0, len_ab: 12.0 },
      ];

      for (const tc of testCases) {
        const solved = solveLM7A02(carrier1Points, tc);
        const ptA = solved.find((p) => p.id === 'A')!;
        const ptB = solved.find((p) => p.id === 'B')!;
        const ptM1 = solved.find((p) => p.id === 'M1')!;
        const ptM2 = solved.find((p) => p.id === 'M2')!;

        const totalLen = ptB.x - ptA.x;
        expect(totalLen).toBeCloseTo(tc.len_ab, 5);

        const midpointDist = ptM2.x - ptM1.x;
        expect(midpointDist).toBeCloseTo(tc.len_ab / 2, 5);
      }
    });

    it('should clamp pos_p within safe bounds inside AB segment', () => {
      const solved = solveLM7A02(carrier1Points, { pos_p: 100.0, len_ab: 8.0 });
      const ptP = solved.find((p) => p.id === 'P')!;
      // halfLen = 4, safeMax = 3.8
      expect(ptP.x).toBeLessThanOrEqual(3.8);
    });
  });

  describe('Carrier 2: angle_carrier (共顶点邻补角双平分线)', () => {
    const carrier2Points: CarrierPoint[] = [
      { id: 'O', name: 'O', x: 0, y: 0, color: '#64748b', size: 5, isFixed: true },
      { id: 'A', name: 'A', x: 5, y: 0, color: '#38bdf8', size: 4, isFixed: true },
      { id: 'B', name: 'B', x: -5, y: 0, color: '#38bdf8', size: 4, isFixed: true },
      { id: 'C', name: 'C(动射线端点)', x: 0, y: 4, color: '#f59e0b', size: 5, isFixed: false },
      { id: 'M', name: 'M(内平分线点)', x: 3.53, y: 1.46, color: '#34c759', size: 4, isFixed: false },
      { id: 'N', name: 'N(外平分线点)', x: -1.46, y: 3.53, color: '#a855f7', size: 4, isFixed: false },
    ];

    it('should rotate C, M, N with angle_alpha and guarantee perpendicular bisectors ∠MON = 90°', () => {
      const testAngles = [45, 60, 90, 120, 135];

      for (const alpha of testAngles) {
        const solved = solveLM7A02(carrier2Points, { angle_alpha: alpha });
        const ptC = solved.find((p) => p.id === 'C')!;
        const ptM = solved.find((p) => p.id === 'M')!;
        const ptN = solved.find((p) => p.id === 'N')!;

        // 验证射线 C 极角为 alpha
        let degC = (Math.atan2(ptC.y, ptC.x) * 180) / Math.PI;
        if (degC < 0) degC += 360;
        expect(degC).toBeCloseTo(alpha, 1);

        // 验证平分线 M 极角为 alpha / 2
        let degM = (Math.atan2(ptM.y, ptM.x) * 180) / Math.PI;
        if (degM < 0) degM += 360;
        expect(degM).toBeCloseTo(alpha / 2, 1);

        // 验证平分线 N 极角为 90 + alpha / 2
        let degN = (Math.atan2(ptN.y, ptN.x) * 180) / Math.PI;
        if (degN < 0) degN += 360;
        expect(degN).toBeCloseTo(90 + alpha / 2, 1);

        // 垂直正交公理检验：向量点积 OM · ON = xM * xN + yM * yN ≡ 0
        const dotProduct = ptM.x * ptN.x + ptM.y * ptN.y;
        expect(dotProduct).toBeCloseTo(0, 1);
      }
    });
  });

  describe('Template and Configuration Routing', () => {
    it('should compile LM-7A-02 with geometry_segment_midpoint_bisector template and carrierId injection', () => {
      const config = compileMorphingSandboxConfig(model7a02, {
        carrierId: 'single_segment',
        parameterValues: { pos_p: 1.0, len_ab: 8.0 },
        postureId: 'standard',
        activeCamouflageIds: [],
        xrayActive: false,
      });

      expect(config.canvas_template).toBe('geometry_segment_midpoint_bisector');
      expect((config as any).carrier_id).toBe('single_segment');
      expect((config as any).carrierId).toBe('single_segment');
    });
  });

  describe('Invariants Isolation and NaN Prevention', () => {
    it('should smoothly hide invariants when dependency points are missing instead of showing NaN', () => {
      // 载体一中点 Map (没有 M, O, N)
      const carrier1PointMap = {
        A: { x: -4, y: 0 },
        B: { x: 4, y: 0 },
        P: { x: 0, y: 0 },
        M1: { x: -2, y: 0 },
        M2: { x: 2, y: 0 },
      };

      const invAngleSpec: InvariantSpec = {
        id: 'inv_angle',
        type: 'angle',
        deps: ['M', 'O', 'N'],
        formula: '∠MON = {val}°',
        labelZh: '内外角平分线夹角',
      };

      // 缺少 M, O, N 动点时，必须返回 null (平滑隐藏)，绝不能返回包含 NaN 的字符串
      const result = formatInvariantText(invAngleSpec, carrier1PointMap, 'zh-CN', {});
      expect(result).toBeNull();
    });

    it('should evaluate Carrier 1 invariants cleanly without NaN', () => {
      const carrier1PointMap = {
        A: { x: -4, y: 0 },
        B: { x: 4, y: 0 },
        P: { x: 1, y: 0 },
        M1: { x: -1.5, y: 0 },
        M2: { x: 2.5, y: 0 },
      };

      const lenM1M2Spec: InvariantSpec = {
        id: 'len_m1m2',
        type: 'distance',
        deps: ['M1', 'M2'],
        formula: 'M1M2 = 1/2 AB = {val}',
        labelZh: '双中点距离 M1M2 (恒等折半)',
      };

      const result = formatInvariantText(lenM1M2Spec, carrier1PointMap, 'zh-CN', {});
      expect(result).not.toBeNull();
      expect(result).toContain('4.00');
      expect(result).not.toContain('NaN');
    });
  });
});
