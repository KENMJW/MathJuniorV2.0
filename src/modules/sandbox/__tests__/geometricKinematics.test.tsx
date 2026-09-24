import { describe, it, expect } from 'vitest';
import {
  applyGeometricKinematics,
  computeSandboxBoundingBox,
  SandboxConfig,
} from '../SandboxRenderer';

describe('PLAN-MODEL-REPAIR-V2 轨道 3: 46 概念沙盒 31 模型几何动力学全量映射测试', () => {
  // 1. SB-KP057: 勾股定理与赵爽弦图
  describe('SB-KP057: 勾股定理与赵爽弦图双模式图元解算', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP057',
      canvas_template: 'geometry_pythagorean_template',
      drag_points_json: '[]',
    };

    it('view_mode === 2 (赵爽弦图模式): C在原点, B在(b,0), A在(b,a)', () => {
      const paramValues = { leg_a: 3, leg_b: 4, view_mode: 2 };
      const ptC = applyGeometricKinematics(config, { id: 'C' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'B' }, paramValues);
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);

      expect(ptC).toEqual({ x: 0, y: 0, constraints: 'fixed', isFixed: true });
      expect(ptB).toEqual({ x: 4, y: 0, constraints: 'fixed', isFixed: true });
      expect(ptA).toEqual({ x: 4, y: 3, constraints: 'fixed', isFixed: true });
    });

    it('view_mode === 1 (三方外挂模式): C在原点, B在(a,0), A在(0,b)', () => {
      const paramValues = { leg_a: 3, leg_b: 4, view_mode: 1 };
      const ptC = applyGeometricKinematics(config, { id: 'C' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'B' }, paramValues);
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);

      expect(ptC.x).toBe(0);
      expect(ptC.y).toBe(0);
      expect(ptB.x).toBe(3);
      expect(ptB.y).toBe(0);
      expect(ptA.x).toBe(0);
      expect(ptA.y).toBe(4);
    });

    it('view_mode === 2 包围盒自动包含大正方形 (a+b)×(a+b)', () => {
      const cfg: SandboxConfig = {
        sandbox_id: 'SB-KP057',
        canvas_template: 'geometry_pythagorean_template',
        drag_points_json: JSON.stringify([
          { id: 'C', x: 0, y: 0 },
          { id: 'B', x: 4, y: 0 },
          { id: 'A', x: 4, y: 3 },
        ]),
      };
      const box = computeSandboxBoundingBox(cfg, { leg_a: 3, leg_b: 4, view_mode: 2 });
      expect(box).not.toBeNull();
      expect(box!.minX).toBe(0);
      expect(box!.maxX).toBe(7); // leg_b + leg_a = 4 + 3 = 7
      expect(box!.minY).toBe(0);
      expect(box!.maxY).toBe(7);
    });
  });

  // 2. SB-KP053: 等腰三角形对称折叠与顶角
  describe('SB-KP053: 等腰三角形与折叠变换', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP053',
      canvas_template: 'geometry_isosceles_template',
      drag_points_json: '[]',
    };

    it('apex_angle 与 base_w 闭环解算顶点高与底边端点', () => {
      // base_w = 6 -> halfW = 3. apex_angle = 90 -> rad = 45 deg -> h = 3 / tan(45) = 3
      const paramValues = { base_w: 6, apex_angle: 90, fold_t: 0 };
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'B' }, paramValues);
      const ptC = applyGeometricKinematics(config, { id: 'C' }, paramValues);

      expect(ptA.x).toBe(0);
      expect(ptA.y).toBeCloseTo(3, 2);
      expect(ptB.x).toBe(-3);
      expect(ptB.y).toBe(0);
      expect(ptC.x).toBe(3);
      expect(ptC.y).toBe(0);
    });

    it('折叠比例 fold_t = 1 时折叠点 C_fold 完全贴合左底角 B', () => {
      const baseW = 6;
      const foldT = 1;
      const foldX = (baseW / 2) * Math.cos(foldT * Math.PI);
      expect(foldX).toBeCloseTo(-3, 2);
    });
  });

  // 3. SB-KP055: 等边三角形旋转与四心双圆
  describe('SB-KP055: 等边三角形与四心旋转', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP055',
      canvas_template: 'geometry_equilateral_template',
      drag_points_json: '[]',
    };

    it('rot_theta 与 side_a 正确解算三顶点外接圆坐标', () => {
      // side_a = 6 -> R = 6 / sqrt(3) = 2*sqrt(3) ≈ 3.464
      // rot_theta = 0 -> A(0, R), B(R*cos(210°), R*sin(210°)) = (-3, -1.732)
      const paramValues = { side_a: 6, rot_theta: 0, show_dual_circles: 1 };
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'B' }, paramValues);
      const ptC = applyGeometricKinematics(config, { id: 'C' }, paramValues);

      const R = 6 / Math.sqrt(3);
      expect(ptA.x).toBeCloseTo(0, 2);
      expect(ptA.y).toBeCloseTo(R, 2);
      expect(ptB.x).toBeCloseTo(-3, 2);
      expect(ptB.y).toBeCloseTo(-R / 2, 2);
      expect(ptC.x).toBeCloseTo(3, 2);
      expect(ptC.y).toBeCloseTo(-R / 2, 2);
    });

    it('rot_theta = 90° 旋转时点 A 旋转到负半轴', () => {
      const paramValues = { side_a: 6, rot_theta: 90 };
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);
      const R = 6 / Math.sqrt(3);
      expect(ptA.x).toBeCloseTo(-R, 2);
      expect(ptA.y).toBeCloseTo(0, 2);
    });
  });

  // 4. SB-KP068: 中点四边形相变与对角线
  describe('SB-KP068: 中点四边形相变预设', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP068',
      canvas_template: 'geometry_midpoint_quad_template',
      drag_points_json: '[]',
    };

    it('preset 1 (一般四边形)', () => {
      const ptA = applyGeometricKinematics(config, { id: 'p_A' }, { quad_morph_preset: 1 });
      expect(ptA).toEqual({ x: -4, y: -2, constraints: 'fixed', isFixed: undefined });
    });

    it('preset 2 (对角线相等 AC=BD -> 中点菱形)', () => {
      const ptA = applyGeometricKinematics(config, { id: 'p_A' }, { quad_morph_preset: 2 });
      const ptB = applyGeometricKinematics(config, { id: 'p_B' }, { quad_morph_preset: 2 });
      const ptC = applyGeometricKinematics(config, { id: 'p_C' }, { quad_morph_preset: 2 });
      const ptD = applyGeometricKinematics(config, { id: 'p_D' }, { quad_morph_preset: 2 });

      // AC length
      const lenAC = Math.hypot(ptC.x - ptA.x, ptC.y - ptA.y);
      // BD length
      const lenBD = Math.hypot(ptD.x - ptB.x, ptD.y - ptB.y);
      expect(lenAC).toBeCloseTo(lenBD, 2);
    });

    it('preset 3 (对角线互相垂直 AC ⊥ BD -> 中点矩形)', () => {
      const ptA = applyGeometricKinematics(config, { id: 'p_A' }, { quad_morph_preset: 3 });
      const ptB = applyGeometricKinematics(config, { id: 'p_B' }, { quad_morph_preset: 3 });
      const ptC = applyGeometricKinematics(config, { id: 'p_C' }, { quad_morph_preset: 3 });
      const ptD = applyGeometricKinematics(config, { id: 'p_D' }, { quad_morph_preset: 3 });

      // AC vector: (ptC.x - ptA.x, ptC.y - ptA.y) = (8, 0)
      // BD vector: (ptD.x - ptB.x, ptD.y - ptB.y) = (0, 6)
      const dotProduct = (ptC.x - ptA.x) * (ptD.x - ptB.x) + (ptC.y - ptA.y) * (ptD.y - ptB.y);
      expect(dotProduct).toBe(0);
    });

    it('preset 4 (对角线相等且互相垂直 -> 中点正方形)', () => {
      const ptA = applyGeometricKinematics(config, { id: 'p_A' }, { quad_morph_preset: 4 });
      const ptB = applyGeometricKinematics(config, { id: 'p_B' }, { quad_morph_preset: 4 });
      const ptC = applyGeometricKinematics(config, { id: 'p_C' }, { quad_morph_preset: 4 });
      const ptD = applyGeometricKinematics(config, { id: 'p_D' }, { quad_morph_preset: 4 });

      const lenAC = Math.hypot(ptC.x - ptA.x, ptC.y - ptA.y);
      const lenBD = Math.hypot(ptD.x - ptB.x, ptD.y - ptB.y);
      const dotProduct = (ptC.x - ptA.x) * (ptD.x - ptB.x) + (ptC.y - ptA.y) * (ptD.y - ptB.y);
      expect(lenAC).toBeCloseTo(8, 2);
      expect(lenBD).toBeCloseTo(8, 2);
      expect(dotProduct).toBe(0);
    });
  });

  // 5. SB-KP056: 直角三角形斜边动点
  describe('SB-KP056: 直角三角形斜边动点', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP056',
      canvas_template: 'geometry_right_triangle_template',
      drag_points_json: '[]',
    };

    it('point_t = 0.5 动点 M 严格处于斜边中点', () => {
      const paramValues = { leg_a: 6, leg_b: 4, point_t: 0.5 };
      const ptM = applyGeometricKinematics(config, { id: 'M' }, paramValues);
      expect(ptM.x).toBe(3);
      expect(ptM.y).toBe(2);
    });

    it('point_t = 0 时位于顶点 A(0, leg_b), point_t = 1 时位于顶点 B(leg_a, 0)', () => {
      const ptM0 = applyGeometricKinematics(config, { id: 'M' }, { leg_a: 6, leg_b: 4, point_t: 0 });
      expect(ptM0.x).toBe(0);
      expect(ptM0.y).toBe(4);

      const ptM1 = applyGeometricKinematics(config, { id: 'M' }, { leg_a: 6, leg_b: 4, point_t: 1 });
      expect(ptM1.x).toBe(6);
      expect(ptM1.y).toBe(0);
    });
  });

  // 6. SB-KP079: 轴对称变换与倾斜轴
  describe('SB-KP079: 轴对称倾斜轴镜像投影', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP079',
      canvas_template: 'geometry_transform_reflection',
      drag_points_json: '[]',
    };

    it('y 轴对称 (axis_pos = 0, axis_phi = 90°)', () => {
      const paramValues = { axis_pos: 0, axis_phi: 90 };
      // A(-4, 3) 镜像到 A'(4, 3)
      const ptAP = applyGeometricKinematics(config, { id: 'A_prime' }, paramValues);
      expect(ptAP.x).toBeCloseTo(4, 2);
      expect(ptAP.y).toBeCloseTo(3, 2);
    });
  });

  // 7. SB-KP072: 切线长模型
  describe('SB-KP072: 切线长模型切点解算', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP072',
      canvas_template: 'geometry_tangent_segment_carrier',
      drag_points_json: '[]',
    };

    it('r=3, d=5 时切线长 PA = PB = 4', () => {
      const paramValues = { circle_r: 3, dist_OP: 5, phi_P: 0 };
      const ptP = applyGeometricKinematics(config, { id: 'P' }, paramValues);
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'B' }, paramValues);

      expect(ptP.x).toBe(5);
      expect(ptP.y).toBe(0);
      // 切点到原点距离为半径 3
      expect(Math.hypot(ptA.x, ptA.y)).toBeCloseTo(3, 2);
      expect(Math.hypot(ptB.x, ptB.y)).toBeCloseTo(3, 2);
      // PA 距离为 4
      expect(Math.hypot(ptA.x - ptP.x, ptA.y - ptP.y)).toBeCloseTo(4, 2);
      expect(Math.hypot(ptB.x - ptP.x, ptB.y - ptP.y)).toBeCloseTo(4, 2);
    });
  });

  // 8. SB-KP074: 垂径定理
  describe('SB-KP074: 垂径定理弦长解算', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP074',
      canvas_template: 'geometry_chord_bisector_carrier',
      drag_points_json: '[]',
    };

    it('r=5, d=3 时弦长 AB = 8, 半弦 = 4', () => {
      const paramValues = { circle_r: 5, chord_dist_d: 3 };
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'B' }, paramValues);
      const ptM = applyGeometricKinematics(config, { id: 'M' }, paramValues);

      expect(ptM).toEqual({ x: 0, y: 3, constraints: 'fixed', isFixed: undefined });
      expect(ptA).toEqual({ x: -4, y: 3, constraints: 'fixed', isFixed: undefined });
      expect(ptB).toEqual({ x: 4, y: 3, constraints: 'fixed', isFixed: undefined });
      expect(Math.hypot(ptB.x - ptA.x, ptB.y - ptA.y)).toBe(8);
    });
  });

  // 9. SB-KP065: 菱形相变
  describe('SB-KP065: 菱形相变', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP065',
      canvas_template: 'geometry_rhombus_template',
      drag_points_json: '[]',
    };

    it('morph_rhombus = 1 时对角线正交 (skew = 0)', () => {
      const paramValues = { diag_h: 6, diag_v: 4, morph_rhombus: 1 };
      const ptA = applyGeometricKinematics(config, { id: 'p_A' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'p_B' }, paramValues);
      const ptC = applyGeometricKinematics(config, { id: 'p_C' }, paramValues);
      const ptD = applyGeometricKinematics(config, { id: 'p_D' }, paramValues);

      expect(ptA.x).toBe(-3); expect(ptA.y).toBe(0);
      expect(ptC.x).toBe(3); expect(ptC.y).toBe(0);
      expect(ptB.x).toBe(0); expect(ptB.y).toBe(-2);
      expect(ptD.x).toBe(0); expect(ptD.y).toBe(2);
    });
  });

  // 10. SB-KP066: 正方形旋转
  describe('SB-KP066: 正方形边长与旋转', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP066',
      canvas_template: 'geometry_square_template',
      drag_points_json: '[]',
    };

    it('side_a = 4, rot_angle = 0', () => {
      const paramValues = { side_a: 4, rot_angle: 0 };
      const ptA = applyGeometricKinematics(config, { id: 'p_A' }, paramValues);
      const ptC = applyGeometricKinematics(config, { id: 'p_C' }, paramValues);

      expect(ptA.x).toBe(-2); expect(ptA.y).toBe(-2);
      expect(ptC.x).toBe(2); expect(ptC.y).toBe(2);
    });

    it('rot_angle = 90° 保持正方形中心对称', () => {
      const paramValues = { side_a: 4, rot_angle: 90 };
      const ptA = applyGeometricKinematics(config, { id: 'p_A' }, paramValues);
      // (-2, -2) rotated 90° -> (2, -2)
      expect(ptA.x).toBeCloseTo(2, 2);
      expect(ptA.y).toBeCloseTo(-2, 2);
    });
  });

  // 11. SB-KP081: 手拉手旋转
  describe('SB-KP081: 手拉手旋转模型', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP081',
      canvas_template: 'geometry_rotation_hand_in_hand_carrier',
      drag_points_json: '[]',
    };

    it('theta = 90° 旋转时点 A 绕原点旋转 90°', () => {
      const paramValues = { theta: 90, side_B_y: 4 };
      const ptAP = applyGeometricKinematics(config, { id: 'A_prime' }, paramValues);
      expect(ptAP.x).toBeCloseTo(0, 2);
      expect(ptAP.y).toBeCloseTo(3, 2);
    });
  });

  // 12. SB-KP082: 中心对称旋转过程
  describe('SB-KP082: 中心对称旋转过程', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP082',
      canvas_template: 'geometry_central_sym_carrier',
      drag_points_json: '[]',
    };

    it('rot_process = 180° 完成中心对称变换', () => {
      const paramValues = { rot_process: 180 };
      // A(3, 2) rotated 180° -> A'(-3, -2)
      const ptAP = applyGeometricKinematics(config, { id: 'A_prime' }, paramValues);
      expect(ptAP.x).toBeCloseTo(-3, 2);
      expect(ptAP.y).toBeCloseTo(-2, 2);
    });
  });

  // 13. SB-KP085: 解直角三角形
  describe('SB-KP085: 解直角三角形度量', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP085',
      canvas_template: 'geometry_right_triangle_measurement',
      drag_points_json: '[]',
    };

    it('angle_A = 30°, hypot_c = 6 -> 对边 3, 邻边 3*sqrt(3)', () => {
      const paramValues = { angle_A: 30, hypot_c: 6 };
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);
      const ptB = applyGeometricKinematics(config, { id: 'B' }, paramValues);

      const adj = 6 * Math.cos(Math.PI / 6);
      const opp = 6 * Math.sin(Math.PI / 6);
      expect(ptA.x).toBeCloseTo(adj, 2);
      expect(ptA.y).toBe(0);
      expect(ptB.x).toBeCloseTo(adj, 2);
      expect(ptB.y).toBeCloseTo(opp, 2);
    });
  });

  // 14. SB-KP048: 平行线与截线
  describe('SB-KP048: 平行线与截线', () => {
    const config: SandboxConfig = {
      sandbox_id: 'SB-KP048',
      canvas_template: 'geometry_parallel_template',
      drag_points_json: '[]',
    };

    it('param_line_dist = 4 产生双平行线间距 4', () => {
      const paramValues = { param_line_dist: 4, param_trans_angle: 60 };
      const ptA = applyGeometricKinematics(config, { id: 'A' }, paramValues);
      const ptC = applyGeometricKinematics(config, { id: 'C' }, paramValues);

      expect(ptA.y).toBe(2);
      expect(ptC.y).toBe(-2);
      expect(ptA.y - ptC.y).toBe(4);
    });
  });
});
