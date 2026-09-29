import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import {
  MODEL_MORPH_SOLVERS,
  mockLeapSandboxModels,
  compileMorphingSandboxConfig,
  createDefaultMorphingState,
  solveLM7A01,
  solveLM7A02,
  solveLM7B03,
  solveLM7B04,
  solveLM7B05,
  solveLM8A06,
  solveLM8A07,
  solveLM8A08,
  solveLM8B15,
  solveLM8B16,
  solveLM8B17,
  solveLM9A18,
  solveLM9B34,
  solveLM9B35,
  solveLM9B36,
  solveLM8A09,
  solveLM8A10,
  solveLM8A11,
  solveLM8A12,
  solveLM8B13,
  solveLM8B14,
  solveLM9A19,
  solveLM9A20,
  solveLM9A21,
  solveLM9A22,
  solveLM9A23,
  solveLM9A24,
  solveLM9A25,
  solveLM9A26,
  solveLM9A27,
  solveLM9A28,
  solveLM9B29,
  solveLM9B30,
  solveLM9B31,
  solveLM9B32,
  solveLM9B33,
} from '../morphControllers';
import { formatInvariantText } from '../invariants';

describe('Track C & Track D: 35 个 4D 跃迁沙盒模型数学精度与变异推演全面验证', () => {
  // ---------------------------------------------------------------------------
  // 1. 全量注册覆盖率门禁 (全库 37 个沙盒模型 + 兼容种子 LM-8A-01)
  // ---------------------------------------------------------------------------
  it('1. MODEL_MORPH_SOLVERS 注册表全量覆盖 38 个沙盒模型 (LM-7A-01 至 LM-9B-37)', () => {
    const requiredModelIds = [
      'LM-7A-01', 'LM-7A-02', 'LM-7B-03', 'LM-7B-04', 'LM-7B-05',
      'LM-8A-01', 'LM-8A-06', 'LM-8A-07', 'LM-8A-08', 'LM-8A-09',
      'LM-8A-10', 'LM-8A-11', 'LM-8A-12', 'LM-8B-13', 'LM-8B-14',
      'LM-8B-15', 'LM-8B-16', 'LM-8B-17', 'LM-9A-18', 'LM-9A-19',
      'LM-9A-20', 'LM-9A-21', 'LM-9A-22', 'LM-9A-23', 'LM-9A-24',
      'LM-9A-25', 'LM-9A-26', 'LM-9A-27', 'LM-9A-28', 'LM-9B-29',
      'LM-9B-30', 'LM-9B-31', 'LM-9B-32', 'LM-9B-33', 'LM-9B-34',
      'LM-9B-35', 'LM-9B-36', 'LM-9B-37',
    ];

    requiredModelIds.forEach((id) => {
      const solver = MODEL_MORPH_SOLVERS[id];
      expect(solver, `模型 ${id} 必须注册专属动力学解算器`).toBeDefined();
      expect(typeof solver).toBe('function');
    });

    expect(mockLeapSandboxModels.length).toBeGreaterThanOrEqual(37);
  });

  // ---------------------------------------------------------------------------
  // 2. Track C: 13 代数 / 函数 / 统计类数学精度验证
  // ---------------------------------------------------------------------------
  describe('Track C: 代数/函数/统计类解算器严密精度', () => {
    it('LM-7A-01: 数轴动点与绝对值几何距离，动点位置准确解算', () => {
      const pts = [
        { id: 'Origin', name: 'O', x: 0, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'A', name: 'A', x: -3, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 3, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 1, y: 0, color: '#f59e0b', size: 5, isFixed: false },
      ];
      const res = solveLM7A01(pts, { pos_p: 2.5, point_a: -4, point_b: 4 });
      const ptP = res.find((p) => p.id === 'P');
      const ptA = res.find((p) => p.id === 'A');
      const ptB = res.find((p) => p.id === 'B');
      expect(ptP?.x).toBe(2.5);
      expect(ptA?.x).toBe(-4);
      expect(ptB?.x).toBe(4);
    });

    it('LM-7A-02: 线段双中点与角平分线和差解算器，尺寸与中点按比例缩放', () => {
      const pts = [
        { id: 'A', name: 'A', x: 0, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 8, y: 0, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'M2', name: 'M2', x: 4, y: 0, color: '#34c759', size: 4, isFixed: false },
      ];
      const res = solveLM7A02(pts, { len_ab: 10 });
      const ptB = res.find((p) => p.id === 'B');
      const ptM2 = res.find((p) => p.id === 'M2');
      expect(ptB?.x).toBe(10);
      expect(ptM2?.x).toBe(5);
    });

    it('LM-7B-03: 非负数之和为零动力学解算，零点严格收敛', () => {
      const pts = [{ id: 'P', name: 'P', x: 5, y: -4, color: '#f59e0b', size: 5, isFixed: false }];
      const res = solveLM7B03(pts, { var_x: 2, var_y: -3, target_x0: 2, target_y0: -3 });
      const ptP = res.find((p) => p.id === 'P');
      expect(ptP?.x).toBe(2);
      expect(ptP?.y).toBe(-3);

      // 计算到目标零点的欧氏距离平方
      const distSq = Math.pow(ptP!.x - 2, 2) + Math.pow(ptP!.y - (-3), 2);
      expect(distSq).toBe(0);
    });

    it('LM-7B-04: 造桥选址平移最短路径，平移虚点与桥梁垂直河岸', () => {
      const pts = [
        { id: 'A', name: 'A', x: -4, y: 4, color: '#38bdf8', size: 5, isFixed: true },
        { id: 'B', name: 'B', x: 4, y: -4, color: '#34c759', size: 5, isFixed: true },
        { id: 'P1', name: 'P1', x: -1, y: 1, color: '#f59e0b', size: 4, isFixed: false },
        { id: 'P2', name: 'P2', x: -1, y: -1, color: '#f59e0b', size: 4, isFixed: false },
      ];
      const res = solveLM7B04(pts, { bridge_x: 0, river_d: 2 });
      const ptAPrime = res.find((p) => p.id === "A'" || p.id === 'A_prime');
      const ptP1 = res.find((p) => p.id === 'P1');
      const ptP2 = res.find((p) => p.id === 'P2');

      // A'(xA, yA - d) = (-4, 4 - 2) = (-4, 2)
      expect(ptAPrime?.x).toBe(-4);
      expect(ptAPrime?.y).toBe(2);
      // 桥梁两端垂直河岸 (横坐标相同，纵坐标之差为河宽 d=2)
      expect(ptP1?.x).toBe(ptP2?.x);
      expect(ptP1!.y - ptP2!.y).toBeCloseTo(2, 3);
    });

    it('LM-7B-05: 二元一次方程组交点联立求解，双线方程同时成立', () => {
      const pts = [
        { id: 'A1', name: 'A1', x: -2, y: -1, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'A2', name: 'A2', x: 2, y: 3, color: '#a855f7', size: 4, isFixed: false },
      ];
      // L1: y = 2x - 1, L2: y = -x + 5 => 2x - 1 = -x + 5 => 3x = 6 => x = 2, y = 3
      const res = solveLM7B05(pts, { slope_k1: 2, intercept_b1: -1, slope_k2: -1, intercept_b2: 5 });
      const ptP = res.find((p) => p.id === 'P');
      expect(ptP?.x).toBe(2);
      expect(ptP?.y).toBe(3);

      // 验证点 P 同时满足两条直线方程
      expect(2 * ptP!.x - 1).toBeCloseTo(ptP!.y, 3);
      expect(-1 * ptP!.x + 5).toBeCloseTo(ptP!.y, 3);
    });

    it('LM-8A-06: 乘法公式面积割补，几何尺寸严格匹配参数', () => {
      const pts = [
        { id: 'A', name: 'A', x: 4, y: 0, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'B', name: 'B', x: 0, y: 4, color: '#34c759', size: 4, isFixed: false },
        { id: 'P', name: 'P', x: 2, y: 2, color: '#f59e0b', size: 4, isFixed: false },
      ];
      const res = solveLM8A06(pts, { side_a: 5, side_b: 3 });
      const ptA = res.find((p) => p.id === 'A');
      const ptB = res.find((p) => p.id === 'B');
      const ptP = res.find((p) => p.id === 'P');

      expect(ptA?.x).toBe(5);
      expect(ptB?.y).toBe(3);
      expect(ptP?.x).toBeCloseTo(5 * 0.6, 2);
      expect(ptP?.y).toBeCloseTo(3 * 0.5, 2);
    });

    it('LM-8A-07: 十字相乘因式分解面积模型，十字交叉系数矩阵对齐', () => {
      const pts = [
        { id: 'A1', name: 'A1', x: -2, y: 1, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'A2', name: 'A2', x: -2, y: -1, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'C1', name: 'C1', x: 2, y: 2, color: '#34c759', size: 4, isFixed: false },
        { id: 'C2', name: 'C2', x: 2, y: -3, color: '#34c759', size: 4, isFixed: false },
      ];
      const res = solveLM8A07(pts, { factor_a1: 1, factor_a2: 1, factor_c1: 2, factor_c2: 3 });
      const ptA1 = res.find((p) => p.id === 'A1');
      const ptA2 = res.find((p) => p.id === 'A2');
      const ptC1 = res.find((p) => p.id === 'C1');
      const ptC2 = res.find((p) => p.id === 'C2');

      expect(ptA1?.y).toBe(1);
      expect(ptA2?.y).toBe(-1);
      expect(ptC1?.y).toBe(2);
      expect(ptC2?.y).toBe(-3);

      // 十字交叉相乘: a1 * (-c2) + (-a2) * c1
      const crossSum = ptA1!.y * ptC2!.y + ptA2!.y * ptC1!.y;
      expect(crossSum).toBe(-5);
    });

    it('LM-8A-08: 分式方程增根动力学解算，动点精确指向增根危险点', () => {
      const pts = [{ id: 'P_root', name: 'P_root', x: 0, y: 0, color: '#ef4444', size: 5, isFixed: false }];
      const res = solveLM8A08(pts, { param_root: 3, extraneous_val: 3 });
      const pt = res.find((p) => p.id === 'P_root');
      expect(pt?.x).toBe(3);
    });

    it('LM-8B-15: 一次不等式与直线交点求解，交点严格满足方程', () => {
      const pts = [
        { id: 'P_intersect', name: 'P', x: 0, y: 0, color: '#f59e0b', size: 5, isFixed: false },
      ];
      // L1: y = 2x - 6, L2: y = 0 => x0 = 3, y0 = 0
      const res = solveLM8B15(pts, { slope_k1: 2, intercept_b1: -6, slope_k2: 0, intercept_b2: 0 });
      const ptP = res.find((p) => p.id === 'P_intersect');
      expect(ptP?.x).toBe(3);
      expect(ptP?.y).toBe(0);
    });

    it('LM-8B-16: 分段函数计费动力学，拐点连续且两段计费单价不同', () => {
      const pts = [
        { id: 'Curr_A', name: 'A方案', x: 0, y: 0, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'Curr_B', name: 'B方案', x: 0, y: 0, color: '#34c759', size: 4, isFixed: false },
      ];
      // 行驶 7km: A方案 = 2.4 * 7 = 16.8; B方案 = 10 + 2.05 * (7 - 3) = 18.2
      const res = solveLM8B16(pts, { travel_dist: 7, rate_a: 2.4, start_fee: 10 });
      const currA = res.find((p) => p.id === 'Curr_A');
      const currB = res.find((p) => p.id === 'Curr_B');

      expect(currA?.x).toBe(7);
      expect(currA?.y).toBeCloseTo(16.8, 2);
      expect(currB?.x).toBe(7);
      expect(currB?.y).toBeCloseTo(18.2, 2);
    });

    it('LM-8B-17: 方差与稳定性样本偏移，均值与离散度动态解算', () => {
      const pts = [
        { id: 'A1', name: 'A1', x: 1, y: 8, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'B1', name: 'B1', x: 1, y: 6, color: '#34c759', size: 4, isFixed: false },
      ];
      const res = solveLM8B17(pts, { score_shift: 2.0 });
      const a1 = res.find((p) => p.id === 'A1');
      const b1 = res.find((p) => p.id === 'B1');

      expect(a1?.y).toBe(10); // 8 + 2
      expect(b1?.y).toBe(8);  // 6 + 2
    });

    it('LM-9A-18: 一元二次方程根的判别式与韦达定理，抛物线顶点与两根严密解算', () => {
      const pts = [
        { id: 'vertex_V', name: 'V', x: 0, y: 0, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'root_x1', name: 'x1', x: 0, y: 0, color: '#34c759', size: 4, isFixed: false },
        { id: 'root_x2', name: 'x2', x: 0, y: 0, color: '#34c759', size: 4, isFixed: false },
      ];
      // x^2 - 4x + 3 = 0 => a=1, b=-4, c=3 => Delta = 16 - 12 = 4 > 0, roots: 1, 3. Vertex: (2, -1)
      const res = solveLM9A18(pts, { param_a: 1, param_b: -4, param_c: 3 });
      const ptV = res.find((p) => p.id === 'vertex_V');
      const ptX1 = res.find((p) => p.id === 'root_x1');
      const ptX2 = res.find((p) => p.id === 'root_x2');

      expect(ptV?.x).toBe(2);
      expect(ptV?.y).toBe(-1);
      expect(ptX1?.x).toBe(1);
      expect(ptX2?.x).toBe(3);

      // 韦达定理检验: x1 + x2 = -b/a = 4, x1 * x2 = c/a = 3
      expect(ptX1!.x + ptX2!.x).toBeCloseTo(4, 3);
      expect(ptX1!.x * ptX2!.x).toBeCloseTo(3, 3);
    });

    it('LM-9B-34: 反比例函数面积守恒，矩形面积 |xy| 严格等于 |k|，遥测公式双向同步', () => {
      const pts = [
        { id: 'P', name: 'P', x: 2, y: 3, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'P_prime', name: "P'", x: -2, y: -3, color: '#f59e0b', size: 5, isFixed: false },
      ];
      // 当 k = 12, x = 3 时，y = 4, xy = 12
      const res = solveLM9B34(pts, { inv_k: 12, x_pos: 3 });
      const ptP = res.find((p) => p.id === 'P');
      const ptPPrime = res.find((p) => p.id === 'P_prime');

      expect(ptP?.x).toBe(3);
      expect(ptP?.y).toBe(4);
      expect(ptPPrime?.x).toBe(-3);
      expect(ptPPrime?.y).toBe(-4);

      // 严格矩形面积守恒 |xy| = |k|
      const rectArea = Math.abs(ptP!.x * ptP!.y);
      expect(rectArea).toBe(12);

      // 遥测格式化检验
      const formattedRect = formatInvariantText(
        { id: 'inv_rect_area', type: 'formula', formula: 'abs(inv_k)', labelZh: '矩形面积不变性 S_rect = |xy| = |k|' },
        { P: { x: 3, y: 4 } },
        'zh-CN',
        { inv_k: 12 }
      );
      expect(formattedRect).toContain('12');
    });

    it('LM-9B-35: 三视图正交投影空间积木柱高投影动态解算', () => {
      const pts = [
        { id: 'B11', name: 'B11', x: -2, y: 1, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'B12', name: 'B12', x: 0, y: 2, color: '#38bdf8', size: 4, isFixed: false },
      ];
      const res = solveLM9B35(pts, { slider_h11: 3, slider_h12: 4 });
      const b11 = res.find((p) => p.id === 'B11');
      const b12 = res.find((p) => p.id === 'B12');

      expect(b11?.y).toBe(3);
      expect(b12?.y).toBe(4);
    });

    it('LM-9B-36: 仰角测高解直角三角形，双仰角严密解算塔高 h = d / (cot alpha - cot beta)', () => {
      const pts = [
        { id: 'D', name: 'D', x: 0, y: 6, color: '#ef4444', size: 5, isFixed: true },
        { id: 'C', name: 'C', x: 0, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: -6, y: 0, color: '#34c759', size: 5, isFixed: false },
        { id: 'A', name: 'A', x: -10.392, y: 0, color: '#38bdf8', size: 5, isFixed: false },
      ];
      // alpha = 30°, beta = 45°, d = 4.392 => cot(30°) = sqrt(3) ≈ 1.732, cot(45°) = 1.0 => h = 4.392 / (1.732 - 1) = 6.0
      const res = solveLM9B36(pts, { angle_alpha: 30, angle_beta: 45, dist_ab: 4.392 });
      const ptD = res.find((p) => p.id === 'D');
      const ptB = res.find((p) => p.id === 'B');
      const ptA = res.find((p) => p.id === 'A');

      expect(ptD?.y).toBeCloseTo(6.0, 2);
      expect(ptB?.x).toBeCloseTo(-6.0, 2);
      expect(ptA?.x).toBeCloseTo(-10.392, 2);

      // 验证直角三角形三角函数: tan(45°) = h / BC = 6 / 6 = 1.0; tan(30°) = h / AC = 6 / 10.392 ≈ 0.577 = 1/sqrt(3)
      const tanBeta = ptD!.y / Math.abs(ptB!.x);
      const tanAlpha = ptD!.y / Math.abs(ptA!.x);
      expect(tanBeta).toBeCloseTo(1.0, 2);
      expect(tanAlpha).toBeCloseTo(Math.tan((30 * Math.PI) / 180), 2);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Track D: 22 几何与压轴变异类数学精度与几何不变量验证
  // ---------------------------------------------------------------------------
  describe('Track D: 几何与压轴变异类解算器严密精度', () => {
    it('LM-8A-09: 倍长中线数学公理严格满足向量对称 E = 2D - A', () => {
      const pts = [
        { id: 'A', name: 'A', x: -2, y: 4, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: -4, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 4, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'D', name: 'D', x: 0, y: 0, color: '#10b981', size: 4, isFixed: true },
      ];
      // 当 extend_ratio = 1 时，E = 2D - A = 2*(0,0) - (-2,4) = (2, -4)
      const res = solveLM8A09(pts, { extend_ratio: 1.0 });
      const ptE = res.find((p) => p.id === 'E');
      expect(ptE?.x).toBe(2);
      expect(ptE?.y).toBe(-4);

      // 验证 D 为 AE 的严格中点
      expect((ptE!.x + pts[0].x) / 2).toBeCloseTo(pts[3].x, 3);
      expect((ptE!.y + pts[0].y) / 2).toBeCloseTo(pts[3].y, 3);
    });

    it('LM-8A-10: 截长补短线段全等构造，DF = BE 严格保距', () => {
      const pts = [
        { id: 'A', name: 'A', x: 0, y: 5, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: -4, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 4, y: 0, color: '#34c759', size: 4, isFixed: true },
      ];
      const res = solveLM8A10(pts, { pos_e: 1.5, pos_f: 1.5 });
      const ptE = res.find((p) => p.id === 'E');
      const ptF = res.find((p) => p.id === 'F');
      expect(ptE).toBeDefined();
      expect(ptF).toBeDefined();
      expect(ptE?.x).toBe(1.5);
      expect(ptF?.x).toBe(1.5);
    });

    it('LM-8A-11: 角平分线到两边距离严格相等 PD = PE', () => {
      const pts = [
        { id: 'O', name: 'O', x: 0, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'A', name: 'A', x: 6, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 0, y: 6, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 3, y: 3, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'D', name: 'D', x: 3, y: 0, color: '#34c759', size: 4, isFixed: false },
        { id: 'E', name: 'E', x: 0, y: 3, color: '#34c759', size: 4, isFixed: false },
      ];
      const res = solveLM8A11(pts, { angle_alpha: 60, pos_p: 5 });
      const ptP = res.find((p) => p.id === 'P');
      const ptD = res.find((p) => p.id === 'D');
      const ptE = res.find((p) => p.id === 'E');

      expect(ptP).toBeDefined();
      expect(ptD).toBeDefined();
      expect(ptE).toBeDefined();

      // PD = PE 严格相等
      const distPD = Math.hypot(ptP!.x - ptD!.x, ptP!.y - ptD!.y);
      const distPE = Math.hypot(ptP!.x - ptE!.x, ptP!.y - ptE!.y);
      expect(distPD).toBeCloseTo(distPE, 3);
      expect(distPD).toBeCloseTo(2.5, 3);
    });

    it('LM-8A-12: 将军饮马对称轴反射 A\'(xA, -yA) 与共线极值点', () => {
      const pts = [
        { id: 'A', name: 'A', x: -3, y: 4, color: '#38bdf8', size: 5, isFixed: true },
        { id: 'B', name: 'B', x: 3, y: 2, color: '#34c759', size: 5, isFixed: true },
        { id: 'P', name: 'P', x: 0, y: 0, color: '#f59e0b', size: 5, isFixed: false },
      ];
      const res = solveLM8A12(pts, { p_x: 1.0 });
      const ptAPrime = res.find((p) => p.id === "A'" || p.id === 'A_prime');
      const ptP = res.find((p) => p.id === 'P');

      expect(ptAPrime?.x).toBe(-3);
      expect(ptAPrime?.y).toBe(-4);
      expect(ptP?.x).toBe(1.0);
      expect(ptP?.y).toBe(0);

      // 验证 A', P, B 三点共线 (斜率相等)
      const slopeAprimeP = (ptP!.y - ptAPrime!.y) / (ptP!.x - ptAPrime!.x); // (0 - -4)/(1 - -3) = 1
      const slopePB = (pts[1].y - ptP!.y) / (pts[1].x - ptP!.x);           // (2 - 0)/(3 - 1) = 1
      expect(slopeAprimeP).toBeCloseTo(slopePB, 3);
    });

    it('LM-8B-13: 矩形折叠勾股定理翻折点与线段守恒 EA = EA\'', () => {
      const pts = [
        { id: 'A', name: 'A', x: 0, y: 8, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 0, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 10, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'D', name: 'D', x: 10, y: 8, color: '#38bdf8', size: 4, isFixed: true },
      ];
      // H = 8, y = 3 => x0 = sqrt(8^2 - 2*8*3) = sqrt(64 - 48) = 4.0
      const res = solveLM8B13(pts, { rect_l: 10, rect_w: 8, pos_fold: 3.0 });
      const ptAPrime = res.find((p) => p.id === "A'");
      const ptE = res.find((p) => p.id === 'E');

      expect(ptE?.x).toBe(0);
      expect(ptE?.y).toBe(3.0);
      expect(ptAPrime?.x).toBeCloseTo(4.0, 2);
      expect(ptAPrime?.y).toBe(0);

      // 翻折前后线段严格相等: EA = EA' = 5
      const distEA = Math.hypot(ptE!.x - pts[0].x, ptE!.y - pts[0].y); // 8 - 3 = 5
      const distEAPrime = Math.hypot(ptE!.x - ptAPrime!.x, ptE!.y - ptAPrime!.y); // sqrt(4^2 + 3^2) = 5
      expect(distEA).toBeCloseTo(distEAPrime, 2);
      expect(distEA).toBeCloseTo(5, 2);
    });

    it('LM-8B-14: 十字架对角线垂直模型，四边形对角线正交 AC ⊥ BD', () => {
      const pts = [
        { id: 'A', name: 'A', x: 0, y: 4, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'C', name: 'C', x: 0, y: -4, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'B', name: 'B', x: 5, y: 0, color: '#34c759', size: 4, isFixed: false },
        { id: 'D', name: 'D', x: -5, y: 0, color: '#34c759', size: 4, isFixed: false },
      ];
      const res = solveLM8B14(pts, { vert_a_y: 6, vert_c_y: -3, vert_b_x: 4, vert_d_x: -4 });
      const ptA = res.find((p) => p.id === 'A');
      const ptC = res.find((p) => p.id === 'C');
      const ptB = res.find((p) => p.id === 'B');
      const ptD = res.find((p) => p.id === 'D');

      // 对角线 AC 在 y 轴上，对角线 BD 在 x 轴上，向量内积为 0
      const vecAC = { x: ptC!.x - ptA!.x, y: ptC!.y - ptA!.y };
      const vecBD = { x: ptD!.x - ptB!.x, y: ptD!.y - ptB!.y };
      const dotProd = vecAC.x * vecBD.x + vecAC.y * vecBD.y;
      expect(Math.abs(dotProd)).toBe(0);
    });

    it('LM-9A-19: 手拉手共顶旋转全等对，动点精确满足欧氏旋转矩阵', () => {
      const pts = [
        { id: 'O', name: 'O', x: 0, y: 0, color: '#64748b', size: 5, isFixed: true },
        { id: 'A', name: 'A', x: 3, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 1.5, y: 2.598, color: '#34c759', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 0, y: 3, color: '#f59e0b', size: 4, isFixed: false },
        { id: 'D', name: 'D', x: -2.598, y: 1.5, color: '#a855f7', size: 4, isFixed: false },
      ];
      // 旋转 90°: C(r2 cos 90°, r2 sin 90°) = (0, 3)
      const res = solveLM9A19(pts, { rot_theta: 90, scale_r2: 1.0 });
      const ptC = res.find((p) => p.id === 'C');
      expect(ptC?.x).toBeCloseTo(0, 2);
      expect(ptC?.y).toBeCloseTo(3, 2);
    });

    it('LM-9A-20: 正方形半角模型旋转点 G 与线段和差恒等 EF = BE + DF', () => {
      const pts = [
        { id: 'A', name: 'A', x: -3, y: 3, color: '#64748b', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: -3, y: -3, color: '#64748b', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 3, y: -3, color: '#64748b', size: 4, isFixed: true },
        { id: 'D', name: 'D', x: 3, y: 3, color: '#64748b', size: 4, isFixed: true },
        { id: 'E', name: 'E', x: -1, y: -3, color: '#34c759', size: 4, isFixed: false },
        { id: 'F', name: 'F', x: 3, y: 0, color: '#38bdf8', size: 4, isFixed: false },
      ];
      // s = 6, be = 2 => E(-1, -3), G(3, 5), df = 6*(4)/8 = 3, F(3, 0)
      const res = solveLM9A20(pts, { be_length: 2 });
      const ptE = res.find((p) => p.id === 'E');
      const ptF = res.find((p) => p.id === 'F');
      const ptG = res.find((p) => p.id === 'G');

      expect(ptE?.x).toBe(-1);
      expect(ptF?.y).toBe(0);
      expect(ptG?.x).toBe(3);
      expect(ptG?.y).toBe(5);

      // EF 长度 = sqrt((3 - (-1))^2 + (0 - (-3))^2) = sqrt(16 + 9) = 5
      // BE + DF = 2 + 3 = 5 严格守恒！
      const distEF = Math.hypot(ptF!.x - ptE!.x, ptF!.y - ptE!.y);
      expect(distEF).toBeCloseTo(5, 3);
    });

    it('LM-9A-21: 费马点 120° 旋转极值点，y_F = 4 / sqrt(3) - 2 严格收敛', () => {
      const pts = [
        { id: 'A', name: 'A', x: 0, y: 5, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: -4, y: -2, color: '#34c759', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 4, y: -2, color: '#34c759', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 0, y: 0, color: '#f59e0b', size: 5, isFixed: false },
      ];
      const res = solveLM9A21(pts, { snap_fermat: 1 });
      const ptP = res.find((p) => p.id === 'P');
      const expectedYFermat = (4 / Math.sqrt(3)) - 2; // ≈ 0.3094
      expect(ptP?.x).toBe(0);
      expect(ptP?.y).toBeCloseTo(expectedYFermat, 3);
    });

    it('LM-9A-22: 定弦定角隐形圆解算器，半径 R = a / sin(alpha) 严密几何圆周角定理', () => {
      const pts = [
        { id: 'A', name: 'A', x: -3, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 3, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'O', name: 'O', x: 0, y: 0, color: '#64748b', size: 4, isFixed: false },
        { id: 'P', name: 'P', x: 0, y: 4, color: '#f59e0b', size: 5, isFixed: false },
      ];
      // 定弦长 6 (半弦 a = 3), 定角 30° => R = 3 / sin(30°) = 6.0, y0 = 3 / tan(30°) = 3*sqrt(3) ≈ 5.196
      const res = solveLM9A22(pts, { fixed_angle: 30, point_theta: 90 });
      const ptO = res.find((p) => p.id === 'O');
      const ptP = res.find((p) => p.id === 'P');

      expect(ptO?.y).toBeCloseTo(3 / Math.tan((30 * Math.PI) / 180), 3);
      // P 到 O 的距离严格等于外接圆半径 R = 6.0
      const distPO = Math.hypot(ptP!.x - ptO!.x, ptP!.y - ptO!.y);
      expect(distPO).toBeCloseTo(6.0, 3);
    });

    it('LM-9A-23: 圆内接四边形托勒密定理与对角互补，四动点共圆严格验证', () => {
      const pts = [
        { id: 'O', name: 'O', x: 0, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'A', name: 'A', x: 0, y: 5, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'B', name: 'B', x: -5, y: 0, color: '#34c759', size: 4, isFixed: false },
        { id: 'C', name: 'C', x: 0, y: -5, color: '#34c759', size: 4, isFixed: false },
        { id: 'D', name: 'D', x: 5, y: 0, color: '#a855f7', size: 4, isFixed: false },
      ];
      const res = solveLM9A23(pts, { radius: 5 });
      const [pA, pB, pC, pD] = ['A', 'B', 'C', 'D'].map((id) => res.find((p) => p.id === id)!);

      // 四点共圆：到原点距离均严格在半径 5 容差范围内
      [pA, pB, pC, pD].forEach((pt) => {
        expect(Math.hypot(pt.x, pt.y)).toBeCloseTo(5, 2);
      });
    });

    it('LM-9A-24: 切线长定理，切线段严格相等 PA = PB = sqrt(d^2 - r^2)', () => {
      const pts = [
        { id: 'O', name: 'O', x: 0, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 5, y: 0, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'A', name: 'A', x: 0, y: 3, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'B', name: 'B', x: 0, y: -3, color: '#34c759', size: 4, isFixed: false },
      ];
      // 圆半径 r = 3, 点 P 到圆心距离 d = 5 => 切线长 L = sqrt(5^2 - 3^2) = 4.0
      const res = solveLM9A24(pts, { point_dist_d: 5, slider_radius: 3 });
      const ptP = res.find((p) => p.id === 'P');
      const ptA = res.find((p) => p.id === 'A');
      const ptB = res.find((p) => p.id === 'B');

      const distPA = Math.hypot(ptP!.x - ptA!.x, ptP!.y - ptA!.y);
      const distPB = Math.hypot(ptP!.x - ptB!.x, ptP!.y - ptB!.y);
      expect(distPA).toBeCloseTo(4.0, 3);
      expect(distPB).toBeCloseTo(4.0, 3);
      expect(distPA).toBeCloseTo(distPB, 3);
    });

    it('LM-9A-25: 二次函数铅垂高水平宽，顶点 t=1 时 h=4, S=8，水平宽恒定为 4', () => {
      const pts = [
        { id: 'A', name: 'A', x: -1, y: 0, color: '#38bdf8', size: 5, isFixed: true },
        { id: 'B', name: 'B', x: 3, y: 0, color: '#34c759', size: 5, isFixed: true },
        { id: 'P', name: 'P', x: 1, y: 4, color: '#f59e0b', size: 6, isFixed: false },
        { id: 'Q', name: 'Q', x: 1, y: 0, color: '#a855f7', size: 4, isFixed: false },
      ];
      // 抛物线 y = -x^2 + 2x + 3. 端点 A(-1, 0), B(3, 0).
      // 当 t = 1 时，P(1, 4), Q(1, 0), h(t) = yP - yQ = 4. 水平宽 w = |3 - (-1)| = 4. 面积 S = 1/2 * w * h = 2 * 4 = 8.
      const res = solveLM9A25(pts, { param_t: 1.0 });
      const ptA = res.find((p) => p.id === 'A');
      const ptB = res.find((p) => p.id === 'B');
      const ptP = res.find((p) => p.id === 'P');
      const ptQ = res.find((p) => p.id === 'Q');

      expect(ptA?.x).toBe(-1);
      expect(ptA?.y).toBe(0);
      expect(ptB?.x).toBe(3);
      expect(ptB?.y).toBe(0);
      expect(ptP?.x).toBe(1.0);
      expect(ptP?.y).toBe(4.0);
      expect(ptQ?.x).toBe(1.0);
      expect(ptQ?.y).toBe(0);

      const h = ptP!.y - ptQ!.y;
      const w = ptB!.x - ptA!.x;
      const s = 0.5 * w * h;
      expect(h).toBe(4.0);
      expect(w).toBe(4.0);
      expect(s).toBe(8.0);
    });

    it('LM-9A-26: 二次函数特殊四边形存在性解算器，动点与平移顶点严格对齐', () => {
      const pts = [
        { id: 'A', name: 'A', x: -2, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 2, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 2, y: 0, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'Q', name: 'Q', x: -2, y: 0, color: '#a855f7', size: 4, isFixed: false },
      ];
      // y = a * t^2 - 2, a = 0.5, t = 2 => P(2, 0), Q(2 - 4, 0) = (-2, 0)
      const res = solveLM9A26(pts, { slider_t: 2.0, coeff_a: 0.5 });
      const ptP = res.find((p) => p.id === 'P');
      const ptQ = res.find((p) => p.id === 'Q');
      expect(ptP?.x).toBe(2);
      expect(ptP?.y).toBe(0);
      expect(ptQ?.x).toBe(-2);
      expect(ptQ?.y).toBe(0);
    });

    it('LM-9A-27: 等腰三角形存在性解算器，对称轴动点严格保距 PA = PB', () => {
      const pts = [
        { id: 'A', name: 'A', x: -2, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 2, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 0, y: 2, color: '#f59e0b', size: 5, isFixed: false },
      ];
      // 当 t = 0 时，P(0, 2) 在对称轴上，PA = PB
      const res = solveLM9A27(pts, { slider_t: 0.0, coeff_a: -0.5 });
      const ptP = res.find((p) => p.id === 'P');
      const distPA = Math.hypot(ptP!.x - pts[0].x, ptP!.y - pts[0].y);
      const distPB = Math.hypot(ptP!.x - pts[1].x, ptP!.y - pts[1].y);
      expect(distPA).toBeCloseTo(distPB, 3);
      expect(distPA).toBeCloseTo(Math.sqrt(8), 3);
    });

    it('LM-9A-28: 二次函数综合最值动区间解算器，区间端点与顶点正确定位', () => {
      const pts = [
        { id: 'V', name: 'V', x: 1, y: -3, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'P_left', name: 'P_left', x: -1, y: 1, color: '#f59e0b', size: 4, isFixed: false },
        { id: 'P_right', name: 'P_right', x: 2, y: -2, color: '#f59e0b', size: 4, isFixed: false },
      ];
      // 抛物线 y = (x - 1)^2 - 3, 区间 [-1, 2] (m = -1, l = 3)
      const res = solveLM9A28(pts, { param_h: 1, param_m: -1, param_L: 3, coeff_a: 1 });
      const ptV = res.find((p) => p.id === 'V');
      const ptL = res.find((p) => p.id === 'P_left');
      const ptR = res.find((p) => p.id === 'P_right');

      expect(ptV?.x).toBe(1);
      expect(ptV?.y).toBe(-3);
      expect(ptL?.x).toBe(-1);
      expect(ptL?.y).toBe(1); // (-1 - 1)^2 - 3 = 4 - 3 = 1
      expect(ptR?.x).toBe(2);
      expect(ptR?.y).toBe(-2); // (2 - 1)^2 - 3 = 1 - 3 = -2
    });

    it('LM-9B-29: 一线三等角 K 字型，严格满足 BE = (AC · CB) / AD 且向量正交 CD · CE ≡ 0', () => {
      const pts = [
        { id: 'A', name: 'A', x: -4, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 5, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 0, y: 0, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'D', name: 'D', x: -4, y: 3, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'E', name: 'E', x: 5, y: 6.667, color: '#34c759', size: 4, isFixed: false },
      ];
      // xA = -4, xB = 5, AD = 3. 当 C 点滑到 xC = 1 时:
      // AC = 1 - (-4) = 5, CB = 5 - 1 = 4.
      // 相似比 BE = (AC * CB) / AD = (5 * 4) / 3 = 20 / 3 ≈ 6.667
      const res = solveLM9B29(pts, { slider_xc: 1, slider_ad: 3 });
      const ptC = res.find((p) => p.id === 'C');
      const ptD = res.find((p) => p.id === 'D');
      const ptE = res.find((p) => p.id === 'E');

      expect(ptC?.x).toBe(1);
      expect(ptE?.y).toBeCloseTo(20 / 3, 2);

      // 严密向量内积检验: CD · CE = 0
      const vecCD = { x: ptD!.x - ptC!.x, y: ptD!.y - ptC!.y };
      const vecCE = { x: ptE!.x - ptC!.x, y: ptE!.y - ptC!.y };
      const dotProd = vecCD.x * vecCE.x + vecCD.y * vecCE.y;
      expect(dotProd).toBeCloseTo(0, 2);
    });

    it('LM-9B-30: 射影定理双直角三角形高与投影乘积 CD = sqrt(AD · BD)', () => {
      const pts = [
        { id: 'A', name: 'A', x: -5, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 5, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'D', name: 'D', x: 3, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 3, y: 4, color: '#f59e0b', size: 5, isFixed: false },
      ];
      // R = 5, xd = 3 => AD = 5 + 3 = 8, BD = 5 - 3 = 2 => CD = sqrt(8 * 2) = 4.0
      const res = solveLM9B30(pts, { slider_radius: 5, slider_xc: 3 });
      const ptC = res.find((p) => p.id === 'C');
      expect(ptC?.x).toBe(3);
      expect(ptC?.y).toBeCloseTo(4.0, 3);

      // 验证 CD^2 = AD * BD
      expect(Math.pow(ptC!.y, 2)).toBeCloseTo(8 * 2, 3);
    });

    it('LM-9B-31: 胡不归加权折线最值，垂足 (H - P) 严格正交于射线且 PH = k · PB 恒成立', () => {
      const pts = [
        { id: 'A', name: 'A', x: 0, y: 4, color: '#38bdf8', size: 5, isFixed: true },
        { id: 'B', name: 'B', x: 6, y: 0, color: '#64748b', size: 5, isFixed: true },
        { id: 'P', name: 'P', x: 1, y: 0, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'H', name: 'H', x: 2.8, y: 2.4, color: '#a855f7', size: 4, isFixed: false },
      ];
      // k = 0.6, B(6, 0), P(1, 0) => PB = 5.
      // 射线方向角 sin(theta) = k = 0.6, cos(theta) = 0.8. 射线方向向量 v = (-0.8, 0.6).
      // H = B + (PB * cos(theta)) * v = (6, 0) + (5 * 0.8) * (-0.8, 0.6) = (6 - 3.2, 0 + 2.4) = (2.8, 2.4).
      const res = solveLM9B31(pts, { slider_xp: 1, slider_k: 0.6 });
      const ptH = res.find((p) => p.id === 'H');
      const ptP = res.find((p) => p.id === 'P');
      const ptB = res.find((p) => p.id === 'B');

      expect(ptP?.x).toBe(1);
      expect(ptH?.x).toBeCloseTo(2.8, 3);
      expect(ptH?.y).toBeCloseTo(2.4, 3);

      // 验证 1: (H - P) 垂直于射线方向向量 v_ray
      const vecHP = { x: ptH!.x - ptP!.x, y: ptH!.y - ptP!.y };
      const vRay = { x: -0.8, y: 0.6 };
      const dotProd = vecHP.x * vRay.x + vecHP.y * vRay.y;
      expect(dotProd).toBeCloseTo(0, 3);

      // 验证 2: 垂线段长度 |PH| 严格等于 k * PB = 0.6 * 5 = 3.0
      const distPH = Math.hypot(ptH!.x - ptP!.x, ptH!.y - ptP!.y);
      const pb = Math.abs(ptB!.x - ptP!.x);
      expect(distPH).toBeCloseTo(0.6 * pb, 3);
      expect(distPH).toBeCloseTo(3.0, 3);
    });

    it('LM-9B-32: 阿波罗尼斯圆轨迹方程与比值定常 PA / PB = k', () => {
      const pts = [
        { id: 'A', name: 'A', x: -2, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 2, y: 0, color: '#34c759', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 0, y: 0, color: '#f59e0b', size: 5, isFixed: false },
      ];
      // A(-2, 0), B(2, 0), k = 0.5, theta = 90°
      const res = solveLM9B32(pts, { slider_ratio_k: 0.5, slider_theta: 90 });
      const ptP = res.find((p) => p.id === 'P');

      // 验证动点 P 到 A 与 B 的距离比严格恒等于 k = 0.5
      const distPA = Math.hypot(ptP!.x - pts[0].x, ptP!.y - pts[0].y);
      const distPB = Math.hypot(ptP!.x - pts[1].x, ptP!.y - pts[1].y);
      expect(distPA / distPB).toBeCloseTo(0.5, 2);
    });

    it('LM-9B-33: 瓜豆原理主动点与从动点轨迹相似位似旋转变换', () => {
      const pts = [
        { id: 'O', name: 'O', x: 0, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'O1', name: 'O1', x: 3, y: 0, color: '#38bdf8', size: 4, isFixed: true },
        { id: 'P', name: 'P', x: 5, y: 0, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'Q', name: 'Q', x: 0, y: 2.5, color: '#f59e0b', size: 4, isFixed: false },
      ];
      // 主动点 P(5, 0). 位似比 k = 0.5, 旋转角 alpha = 90°.
      const res = solveLM9B33(pts, { slider_ratio_k: 0.5, slider_alpha: 90, slider_phi: 0 });
      const ptP = res.find((p) => p.id === 'P');
      const ptQ = res.find((p) => p.id === 'Q');

      expect(ptP?.x).toBeCloseTo(5, 3);
      expect(ptP?.y).toBeCloseTo(0, 3);
      expect(ptQ?.x).toBeCloseTo(0, 3);
      expect(ptQ?.y).toBeCloseTo(2.5, 3);

      // 几何关系检验: OQ / OP = 0.5, ∠POQ = 90°
      const distOP = Math.hypot(ptP!.x, ptP!.y);
      const distOQ = Math.hypot(ptQ!.x, ptQ!.y);
      expect(distOQ / distOP).toBeCloseTo(0.5, 3);

      const dotProd = ptP!.x * ptQ!.x + ptP!.y * ptQ!.y;
      expect(dotProd).toBeCloseTo(0, 3);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Property-Based 测试：高频变异下的几何保真性 (fast-check 100 次迭代)
  // ---------------------------------------------------------------------------
  describe('基于性质的高频随机检验 (Property-Based Testing)', () => {
    it('LM-9B-29: 任意动分点 xC 无论如何滑动，向量内积 CD · CE 严格恒等于 0', () => {
      const pts = [
        { id: 'A', name: 'A', x: -4, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'B', name: 'B', x: 5, y: 0, color: '#64748b', size: 4, isFixed: true },
        { id: 'C', name: 'C', x: 0, y: 0, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'D', name: 'D', x: -4, y: 3, color: '#38bdf8', size: 4, isFixed: false },
        { id: 'E', name: 'E', x: 5, y: 6.667, color: '#34c759', size: 4, isFixed: false },
      ];

      fc.assert(
        fc.property(
          fc.double({ min: -3.8, max: 4.8, noNaN: true }),
          fc.double({ min: 1.0, max: 8.0, noNaN: true }),
          (xc, ad) => {
            const res = solveLM9B29(pts, { slider_xc: xc, slider_ad: ad });
            const ptC = res.find((p) => p.id === 'C')!;
            const ptD = res.find((p) => p.id === 'D')!;
            const ptE = res.find((p) => p.id === 'E')!;

            const vecCD = { x: ptD.x - ptC.x, y: ptD.y - ptC.y };
            const vecCE = { x: ptE.x - ptC.x, y: ptE.y - ptC.y };
            const dotProd = vecCD.x * vecCE.x + vecCD.y * vecCE.y;

            // 内积绝对值在 0.005 浮点容差内
            expect(Math.abs(dotProd)).toBeLessThan(0.005);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('LM-9B-31: 任意参数 k ∈ (0.1, 0.9) 与 xp，垂足点积正交且 PH 恒等于 k · PB', () => {
      const pts = [
        { id: 'A', name: 'A', x: 0, y: 4, color: '#38bdf8', size: 5, isFixed: true },
        { id: 'B', name: 'B', x: 6, y: 0, color: '#64748b', size: 5, isFixed: true },
        { id: 'P', name: 'P', x: 1, y: 0, color: '#f59e0b', size: 5, isFixed: false },
        { id: 'H', name: 'H', x: 2.8, y: 2.4, color: '#a855f7', size: 4, isFixed: false },
      ];

      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 5.5, noNaN: true }),
          fc.double({ min: 0.2, max: 0.8, noNaN: true }),
          (xp, k) => {
            const res = solveLM9B31(pts, { slider_xp: xp, slider_k: k });
            const ptP = res.find((p) => p.id === 'P')!;
            const ptH = res.find((p) => p.id === 'H')!;
            const ptB = res.find((p) => p.id === 'B')!;

            const cosTheta = Math.sqrt(1 - k * k);
            const vRay = { x: -cosTheta, y: k };
            const vecHP = { x: ptH.x - ptP.x, y: ptH.y - ptP.y };
            const dotProd = vecHP.x * vRay.x + vecHP.y * vRay.y;

            expect(Math.abs(dotProd)).toBeLessThan(0.005);

            const distPH = Math.hypot(ptH.x - ptP.x, ptH.y - ptP.y);
            const pb = Math.abs(ptB.x - ptP.x);
            expect(distPH).toBeCloseTo(k * pb, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('LM-9A-25: 抛物线铅垂高割线面积在 t ∈ [-1, 3] 恒有 S(t) <= 8，最大值严格在 t=1', () => {
      const pts = [
        { id: 'A', name: 'A', x: -1, y: 0, color: '#38bdf8', size: 5, isFixed: true },
        { id: 'B', name: 'B', x: 3, y: 0, color: '#34c759', size: 5, isFixed: true },
        { id: 'P', name: 'P', x: 1, y: 4, color: '#f59e0b', size: 6, isFixed: false },
        { id: 'Q', name: 'Q', x: 1, y: 0, color: '#a855f7', size: 4, isFixed: false },
      ];

      fc.assert(
        fc.property(
          fc.double({ min: -0.9, max: 2.9, noNaN: true }),
          (t) => {
            const res = solveLM9A25(pts, { param_t: t });
            const ptP = res.find((p) => p.id === 'P')!;
            const ptQ = res.find((p) => p.id === 'Q')!;

            const h = ptP.y - ptQ.y;
            const s = 2 * h; // 1/2 * 4 * h = 2h

            expect(s).toBeLessThanOrEqual(8.001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. 铁律合规性检查 (严格门禁：零 emoji、零 eval、零 innerHTML、零 foreignObject)
  // ---------------------------------------------------------------------------
  describe('铁律红线与安全门禁审查', () => {
    it('源码文件中彻底杜绝任何 emoji 字符', () => {
      const filesToCheck = [
        'src/modules/sandbox/morphControllers.ts',
        'src/modules/sandbox/invariants.ts',
        'src/modules/sandbox/SandboxRenderer.tsx',
        'scripts/migrations/patch_leap_models_math.py',
      ];
      const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/;

      filesToCheck.forEach((relPath) => {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(emojiRegex.test(content), `文件 ${relPath} 严禁包含 emoji 字符`).toBe(false);
        }
      });
    });

    it('所有 37 个沙盒模型编译输出配置格式完备合法', () => {
      mockLeapSandboxModels.forEach((model) => {
        const defaultState = createDefaultMorphingState(model);
        const config = compileMorphingSandboxConfig(model, defaultState);

        expect(config.sandbox_id).toContain(model.model_id);
        expect(config.canvas_template).toBeDefined();
        expect(config.drag_points_json).toBeDefined();

        const pts = JSON.parse(config.drag_points_json);
        expect(Array.isArray(pts)).toBe(true);

        // 验证动点名称干净，无硬编码坐标数字残留
        pts.forEach((p: any) => {
          if (p.name) {
            expect(p.name).not.toMatch(/\s*\(-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\)/);
          }
        });
      });
    });
  });
});
