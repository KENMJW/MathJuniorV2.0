import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { execSync } from 'child_process';
import { evaluateSafeExpression } from '../../sandbox/safeExpression';
import {
  applyGeometricKinematics,
  canInvertParam,
  handleParamInversion,
  SandboxConfig
} from '../../sandbox/SandboxRenderer';
import { formatInvariantText } from '../../sandbox/invariants';

describe('Track A & Track B: 14+ 概念沙盒数学精度与渲染全面修复测试套件', () => {
  const dbPath = path.resolve(process.cwd(), 'data/sandbox.db');

  // =========================================================================
  // 1. 数据库底层配置验证 (data/sandbox.db 与 public/data/sandbox.db)
  // =========================================================================
  describe('1. 数据库沙盒参数与不变量 Schema 严密性', () => {
    it('1.1 SB-KP033 待定系数法必须具备完整的 4 个动点坐标滑块 (含 pt_y2)', () => {
      const stdout = execSync(
        `sqlite3 -json "${dbPath}" "SELECT param_sliders_json, invariants_display_json FROM concept_sandboxes WHERE sandbox_id = 'SB-KP033';"`,
        { encoding: 'utf-8' }
      );
      const rows = JSON.parse(stdout);
      expect(rows.length).toBe(1);
      const sliders = JSON.parse(rows[0].param_sliders_json);
      const sliderKeys = sliders.map((s: any) => s.id || s.param_key);
      expect(sliderKeys).toContain('pt_x1');
      expect(sliderKeys).toContain('pt_y1');
      expect(sliderKeys).toContain('pt_x2');
      expect(sliderKeys).toContain('pt_y2');

      const invs = JSON.parse(rows[0].invariants_display_json);
      const slopeInv = invs.find((inv: any) => inv.id === 'inv_slope_k');
      expect(slopeInv).toBeDefined();
      expect(slopeInv.formula).toContain('pt_y2');
      expect(slopeInv.formula).not.toContain('5 - pt_y1');
    });

    it('1.2 SB-KP065 菱形沙盒必须彻底移除假参数 morph_rhombus', () => {
      const stdout = execSync(
        `sqlite3 -json "${dbPath}" "SELECT param_sliders_json, invariants_display_json FROM concept_sandboxes WHERE sandbox_id = 'SB-KP065';"`,
        { encoding: 'utf-8' }
      );
      const rows = JSON.parse(stdout);
      const sliders = JSON.parse(rows[0].param_sliders_json);
      const sliderKeys = sliders.map((s: any) => s.id || s.param_key);
      expect(sliderKeys).toContain('diag_h');
      expect(sliderKeys).toContain('diag_v');
      expect(sliderKeys).not.toContain('morph_rhombus');
    });

    it('1.3 SB-KP076 三角形内切圆沙盒必须移除假参数 circle_r，半径严格由 S/p 推导', () => {
      const stdout = execSync(
        `sqlite3 -json "${dbPath}" "SELECT param_sliders_json, invariants_display_json FROM concept_sandboxes WHERE sandbox_id = 'SB-KP076';"`,
        { encoding: 'utf-8' }
      );
      const rows = JSON.parse(stdout);
      const sliders = JSON.parse(rows[0].param_sliders_json);
      const sliderKeys = sliders.map((s: any) => s.id || s.param_key);
      expect(sliderKeys).toContain('vertex_A_y');
      expect(sliderKeys).toContain('vertex_C_x');
      expect(sliderKeys).not.toContain('circle_r');

      const invs = JSON.parse(rows[0].invariants_display_json);
      const rInv = invs.find((inv: any) => inv.id === 'inv_inradius_r');
      expect(rInv).toBeDefined();
      expect(rInv.formula).toContain('vertex_C_x');
      expect(rInv.formula).toContain('vertex_A_y');
    });
  });

  // =========================================================================
  // 2. Track A: 函数类数学模型与代数闭环测试
  // =========================================================================
  describe('2. Track A (函数类) 概念数学精度', () => {
    it('2.1 SB-KP033 一次函数待定系数法: 两点 A(-2, -1), B(3, 4) 斜率与截距闭环', () => {
      const scope = { pt_x1: -2, pt_y1: -1, pt_x2: 3, pt_y2: 4 };
      const slopeFormula = '(pt_y2 - pt_y1) / (pt_x2 - pt_x1 + 0.00001)';
      const interceptFormula = 'pt_y1 - ((pt_y2 - pt_y1) / (pt_x2 - pt_x1 + 0.00001)) * pt_x1';

      const k = Number(evaluateSafeExpression(slopeFormula, scope));
      const b = Number(evaluateSafeExpression(interceptFormula, scope));

      expect(k).toBeCloseTo(1.0, 4);
      expect(b).toBeCloseTo(1.0, 4);

      // 验证 y = kx + b 分别通过 A 与 B
      expect(k * scope.pt_x1 + b).toBeCloseTo(scope.pt_y1, 4);
      expect(k * scope.pt_x2 + b).toBeCloseTo(scope.pt_y2, 4);
    });

    it('2.2 SB-KP034 一次函数图象性质: 三角形面积 S_{AOB} = b² / (2|k|)', () => {
      const scope = { slope_k: -2, intercept_b: 4, x_sample: 1 };
      const areaFormula = '(intercept_b * intercept_b) / (2 * abs(slope_k) + 0.00001)';
      const xIntFormula = '-intercept_b / (slope_k + 0.00001)';

      const s = Number(evaluateSafeExpression(areaFormula, scope));
      const x0 = Number(evaluateSafeExpression(xIntFormula, scope));

      expect(s).toBeCloseTo(4.0, 4); // 4² / (2 * 2) = 4
      expect(x0).toBeCloseTo(2.0, 4); // -4 / -2 = 2
    });

    it('2.3 SB-KP035 一次函数交点与方程组: L1: y = 2x - 1, L2: y = -x + 5', () => {
      const scope = { k1: 2, b1: -1, k2: -1, intercept_b2: 5 };
      const xInterFormula = '(intercept_b2 - b1) / (k1 - k2 + 0.00001)';
      const yInterFormula = 'k1 * ((intercept_b2 - b1) / (k1 - k2 + 0.00001)) + b1';

      const x = Number(evaluateSafeExpression(xInterFormula, scope));
      const y = Number(evaluateSafeExpression(yInterFormula, scope));

      expect(x).toBeCloseTo(2.0, 4);
      expect(y).toBeCloseTo(3.0, 4);
      expect(scope.k1 * x + scope.b1).toBeCloseTo(y, 4);
      expect(scope.k2 * x + scope.intercept_b2).toBeCloseTo(y, 4);
    });

    it('2.4 SB-KP039 二次函数顶点式: y = a(x - h)² + k 顶点与对称性', () => {
      const cfg: SandboxConfig = {
        sandbox_id: 'SB-KP039',
        canvas_template: 'function_quadratic_vertex_template',
        drag_points_json: '[]',
      };
      const params = { param_a: 1.5, param_h: 3.0, param_k: -2.0 };

      // 顶点
      const ptV = applyGeometricKinematics(cfg, { id: 'p_V' }, params);
      expect(ptV.x).toBeCloseTo(3.0, 4);
      expect(ptV.y).toBeCloseTo(-2.0, 4);

      // 对称点 P1, P2
      const ptP1 = applyGeometricKinematics(cfg, { id: 'p_P1' }, params);
      const ptP2 = applyGeometricKinematics(cfg, { id: 'p_P2' }, params);
      expect(ptP1.x).toBeCloseTo(1.0, 4); // 3 - 2 = 1
      expect(ptP2.x).toBeCloseTo(5.0, 4); // 3 + 2 = 5
      expect(ptP1.y).toBeCloseTo(4 * 1.5 - 2.0, 4); // 4a + k = 6 - 2 = 4
      expect(ptP2.y).toBeCloseTo(ptP1.y, 4);
    });

    it('2.5 SB-KP040 二次函数判别式与根的距离: y = x² - 2x - 3', () => {
      const scope = { param_a: 1, param_b: -2, param_c: -3 };
      const deltaFormula = 'param_b^2 - 4 * param_a * param_c';
      const rootDistFormula = 'sqrt(max(0, param_b^2 - 4 * param_a * param_c)) / abs(param_a + 0.00001)';

      const delta = Number(evaluateSafeExpression(deltaFormula, scope));
      const dist = Number(evaluateSafeExpression(rootDistFormula, scope));

      expect(delta).toBeCloseTo(16.0, 4); // (-2)² - 4(1)(-3) = 16
      expect(dist).toBeCloseTo(4.0, 4); // √16 / 1 = 4 (roots are 3 and -1, distance 4)
    });

    it('2.6 SB-KP041 & SB-KP042: 动轴定区间最值与割线水位', () => {
      // SB-KP041
      const scope41 = { param_h: 2, param_m: 0, param_n: 4 };
      const minFormula = 'param_h >= param_m && param_h <= param_n ? -3 : min((param_m - param_h)^2 - 3, (param_n - param_h)^2 - 3)';
      const yMin = Number(evaluateSafeExpression(minFormula, scope41));
      expect(yMin).toBeCloseTo(-3.0, 4);

      // SB-KP042
      const scope42 = { param_k_level: 5, param_c: 1 };
      const chordFormula = '2 * sqrt(max(0, param_k_level - param_c))';
      const chordLen = Number(evaluateSafeExpression(chordFormula, scope42));
      expect(chordLen).toBeCloseTo(4.0, 4); // 2 * √(5 - 1) = 4
    });

    it('2.7 SB-KP043 二次函数建模: 铅垂高与三角形面积 S = 1/2 · w · h(t)', () => {
      const scope = { param_t: 1.0, param_a: -0.5 };
      const hFormula = 'abs(param_a * (param_t + 2) * (param_t - 4))';
      const areaFormula = '0.5 * 6.0 * abs(param_a * (param_t + 2) * (param_t - 4))';

      const h = Number(evaluateSafeExpression(hFormula, scope));
      const s = Number(evaluateSafeExpression(areaFormula, scope));

      // |(-0.5) * (1 + 2) * (1 - 4)| = |-0.5 * 3 * (-3)| = 4.5
      expect(h).toBeCloseTo(4.5, 4);
      expect(s).toBeCloseTo(13.5, 4); // 0.5 * 6 * 4.5 = 13.5
    });
  });

  // =========================================================================
  // 3. Track B: 几何类数学模型与几何动力学测试
  // =========================================================================
  describe('3. Track B (几何类) 概念数学精度', () => {
    it('3.1 SB-KP045 & SB-KP048: 线段中点与平行同位角', () => {
      const scope45 = { param_len_ab: 10, param_c_pos: 3 };
      expect(evaluateSafeExpression('0.5 * param_len_ab', scope45)).toBe(5);
      expect(evaluateSafeExpression('param_len_ab - param_c_pos', scope45)).toBe(7);

      const scope48 = { param_trans_angle: 65 };
      expect(evaluateSafeExpression('param_trans_angle', scope48)).toBe(65);
      expect(evaluateSafeExpression('param_trans_angle + (180 - param_trans_angle)', scope48)).toBe(180);
    });

    it('3.2 SB-KP056 直角三角形斜边中线: CM = 1/2 AB', () => {
      const scope = { leg_a: 6, leg_b: 8 };
      const hypotFormula = 'sqrt(leg_a^2 + leg_b^2)';
      const medianFormula = '0.5 * sqrt(leg_a^2 + leg_b^2)';

      const ab = Number(evaluateSafeExpression(hypotFormula, scope));
      const cm = Number(evaluateSafeExpression(medianFormula, scope));

      expect(ab).toBeCloseTo(10.0, 4);
      expect(cm).toBeCloseTo(5.0, 4);
      expect(cm / ab).toBeCloseTo(0.5, 4);
    });

    it('3.3 SB-KP057 勾股定理与赵爽弦图: a² + b² ≡ c²', () => {
      const scope = { leg_a: 5, leg_b: 12 };
      const sumSq = Number(evaluateSafeExpression('leg_a^2 + leg_b^2', scope));
      const c = Math.hypot(scope.leg_a, scope.leg_b);
      expect(sumSq).toBeCloseTo(169.0, 4);
      expect(c * c).toBeCloseTo(169.0, 4);
    });

    it('3.4 SB-KP060 位似变换: 位似比 k 与射线辅助共线', () => {
      const cfg: SandboxConfig = {
        sandbox_id: 'SB-KP060',
        canvas_template: 'geometry_homothety_template',
        drag_points_json: '[]',
      };
      const params = { homo_k: 2.5, center_x: 0, center_y: 0 };
      const ptO = applyGeometricKinematics(cfg, { id: 'p_O' }, params);
      const ptAP = applyGeometricKinematics(cfg, { id: 'p_A_prime' }, params);
      const ptBP = applyGeometricKinematics(cfg, { id: 'p_B_prime' }, params);

      // 原原点 A(1, 2), B(3, 1) 位似变换后: A'(2.5, 5), B'(7.5, 2.5)
      expect(ptO.x).toBe(0);
      expect(ptO.y).toBe(0);
      expect(ptAP.x).toBeCloseTo(2.5, 4);
      expect(ptAP.y).toBeCloseTo(5.0, 4);
      expect(ptBP.x).toBeCloseTo(7.5, 4);
      expect(ptBP.y).toBeCloseTo(2.5, 4);
    });

    it('3.5 SB-KP065 菱形面积与四边闭合: 严格对角线互相垂直平分与四边等长', () => {
      const cfg: SandboxConfig = {
        sandbox_id: 'SB-KP065',
        canvas_template: 'geometry_rhombus_template',
        drag_points_json: '[]',
      };
      const params = { diag_h: 8.0, diag_v: 6.0 };

      const ptO = applyGeometricKinematics(cfg, { id: 'p_O' }, params);
      const ptA = applyGeometricKinematics(cfg, { id: 'p_A' }, params);
      const ptB = applyGeometricKinematics(cfg, { id: 'p_B' }, params);
      const ptC = applyGeometricKinematics(cfg, { id: 'p_C' }, params);
      const ptD = applyGeometricKinematics(cfg, { id: 'p_D' }, params);

      expect(ptO.x).toBe(0);
      expect(ptO.y).toBe(0);
      expect(ptA.x).toBeCloseTo(-4.0, 4);
      expect(ptA.y).toBeCloseTo(0.0, 4);
      expect(ptB.x).toBeCloseTo(0.0, 4);
      expect(ptB.y).toBeCloseTo(-3.0, 4);
      expect(ptC.x).toBeCloseTo(4.0, 4);
      expect(ptC.y).toBeCloseTo(0.0, 4);
      expect(ptD.x).toBeCloseTo(0.0, 4);
      expect(ptD.y).toBeCloseTo(3.0, 4);

      // 验证四边恒等长
      const dAB = Math.hypot(ptB.x - ptA.x, ptB.y - ptA.y);
      const dBC = Math.hypot(ptC.x - ptB.x, ptC.y - ptB.y);
      const dCD = Math.hypot(ptD.x - ptC.x, ptD.y - ptC.y);
      const dDA = Math.hypot(ptA.x - ptD.x, ptA.y - ptD.y);

      expect(dAB).toBeCloseTo(5.0, 4);
      expect(dBC).toBeCloseTo(5.0, 4);
      expect(dCD).toBeCloseTo(5.0, 4);
      expect(dDA).toBeCloseTo(5.0, 4);

      // 面积 S = 1/2 · d1 · d2 = 0.5 * 8 * 6 = 24
      const area = Number(evaluateSafeExpression('0.5 * diag_h * diag_v', params));
      expect(area).toBeCloseTo(24.0, 4);
    });

    it('3.6 SB-KP072 圆切线长定理: PA = PB = √(OP² - r²)', () => {
      const cfg: SandboxConfig = {
        sandbox_id: 'SB-KP072',
        canvas_template: 'geometry_tangent_segment_carrier',
        drag_points_json: '[]',
      };
      const params = { circle_r: 3.0, dist_OP: 5.0, phi_P: 0.0 };

      const ptP = applyGeometricKinematics(cfg, { id: 'P' }, params);
      const ptA = applyGeometricKinematics(cfg, { id: 'A' }, params);
      const ptB = applyGeometricKinematics(cfg, { id: 'B' }, params);

      expect(ptP.x).toBeCloseTo(5.0, 4);
      expect(ptP.y).toBeCloseTo(0.0, 4);

      // 切线长公式 PA = PB = √(5² - 3²) = 4
      const dPA = Math.hypot(ptP.x - ptA.x, ptP.y - ptA.y);
      const dPB = Math.hypot(ptP.x - ptB.x, ptP.y - ptB.y);
      expect(dPA).toBeCloseTo(4.0, 4);
      expect(dPB).toBeCloseTo(4.0, 4);

      // 直角验证 OA ⊥ PA
      const dOA = Math.hypot(ptA.x, ptA.y);
      const dOB = Math.hypot(ptB.x, ptB.y);
      expect(dOA).toBeCloseTo(3.0, 4);
      expect(dOB).toBeCloseTo(3.0, 4);
      expect(dOA * dOA + dPA * dPA).toBeCloseTo(5.0 * 5.0, 4);
    });

    it('3.7 SB-KP076 三角形内切圆与内心: r = S / p', () => {
      const cfg: SandboxConfig = {
        sandbox_id: 'SB-KP076',
        canvas_template: 'geometry_incircle_carrier',
        drag_points_json: '[]',
      };
      // 构造直角三角形 A(0, 3), B(-4, 0), C(0, 0) => 直角边 4, 3, 斜边 5 => S=6, p=6, r=1
      // 这里沙盒定义为 A(0, 6), B(-4, 0), C(4, 0)
      const params = { vertex_A_y: 6.0, vertex_C_x: 4.0 };
      const ptB = applyGeometricKinematics(cfg, { id: 'B' }, params);
      const ptC = applyGeometricKinematics(cfg, { id: 'C' }, params);
      const ptA = applyGeometricKinematics(cfg, { id: 'A' }, params);
      const ptI = applyGeometricKinematics(cfg, { id: 'I' }, params);
      const ptD = applyGeometricKinematics(cfg, { id: 'D' }, params);

      expect(ptB.x).toBe(-4.0);
      expect(ptC.x).toBe(4.0);
      expect(ptA.y).toBe(6.0);

      // 边长: BC = 8, AB = √(16+36)=√52, AC = √(16+36)=√52
      const aSide = 8.0;
      const bSide = Math.hypot(4.0, 6.0);
      const cSide = Math.hypot(4.0, 6.0);
      const p = (aSide + bSide + cSide) / 2.0;
      const S = 0.5 * aSide * 6.0; // 24
      const expectedR = S / p;

      expect(ptI.y).toBeCloseTo(expectedR, 4);
      expect(ptD.y).toBeCloseTo(0.0, 4);
      expect(ptD.x).toBeCloseTo(ptI.x, 4); // 切点垂直在 BC 上
    });

    it('3.8 SB-KP077 扇形面积与弧长: l = nπr/180 与 S = 1/2 · l · r', () => {
      const scope = { radius_r: 6.0, angle_n: 60.0 };
      const arcFormula = '(angle_n * 3.14159265 * radius_r) / 180';
      const areaFormula = '(angle_n * 3.14159265 * radius_r^2) / 360';
      const bridgeFormula = '0.5 * ((angle_n * 3.14159265 * radius_r) / 180) * radius_r';

      const l = Number(evaluateSafeExpression(arcFormula, scope));
      const s = Number(evaluateSafeExpression(areaFormula, scope));
      const sBridge = Number(evaluateSafeExpression(bridgeFormula, scope));

      // l = 60 * π * 6 / 180 = 2π ≈ 6.283185
      expect(l).toBeCloseTo(2 * Math.PI, 4);
      // S = 60 * π * 36 / 360 = 6π ≈ 18.84955
      expect(s).toBeCloseTo(6 * Math.PI, 4);
      expect(sBridge).toBeCloseTo(s, 4);
    });
  });

  // =========================================================================
  // 4. 动点拖拽与参数反解守恒测试
  // =========================================================================
  describe('4. 几何动点拖拽反解 (canInvertParam & handleParamInversion)', () => {
    it('4.1 SB-KP072 切线长模型: 动点 P 反解 dist_OP 与 phi_P，绝不误篡改 circle_r', () => {
      const cfg: SandboxConfig = { sandbox_id: 'SB-KP072', canvas_template: 'geometry_tangent_segment_carrier', drag_points_json: '[]' };
      const canP = canInvertParam('geometry_tangent_segment_carrier', { id: 'P' }, false, cfg);
      const canO = canInvertParam('geometry_tangent_segment_carrier', { id: 'O' }, false, cfg);

      expect(canP).toBe(true);
      expect(canO).toBe(false);

      const onParamChange = vi.fn();
      const mockPt = { X: () => 7.0, Y: () => 0.0 };
      handleParamInversion(
        'geometry_tangent_segment_carrier',
        { id: 'P' },
        mockPt,
        false,
        { circle_r: 3.0, dist_OP: 6.0, phi_P: 0.0 },
        [],
        {},
        null,
        onParamChange,
        cfg
      );

      expect(onParamChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dist_OP: 7.0,
          phi_P: 0,
        })
      );
      expect(onParamChange).not.toHaveBeenCalledWith(
        expect.objectContaining({
          circle_r: expect.anything(),
        })
      );
    });

    it('4.2 SB-KP076 内切圆模型: 顶点 A/C 可反解，从动点 I/D 严禁反解', () => {
      const cfg: SandboxConfig = { sandbox_id: 'SB-KP076', canvas_template: 'geometry_incircle_carrier', drag_points_json: '[]' };
      expect(canInvertParam('geometry_incircle_carrier', { id: 'A' }, false, cfg)).toBe(true);
      expect(canInvertParam('geometry_incircle_carrier', { id: 'C' }, false, cfg)).toBe(true);
      expect(canInvertParam('geometry_incircle_carrier', { id: 'I' }, false, cfg)).toBe(false);
      expect(canInvertParam('geometry_incircle_carrier', { id: 'D' }, false, cfg)).toBe(false);

      const onParamChange = vi.fn();
      const mockPtA = { X: () => 0.0, Y: () => 6.5 };
      handleParamInversion(
        'geometry_incircle_carrier',
        { id: 'A' },
        mockPtA,
        false,
        { vertex_A_y: 5.0, vertex_C_x: 4.0 },
        [],
        {},
        null,
        onParamChange,
        cfg
      );

      expect(onParamChange).toHaveBeenCalledWith({ vertex_A_y: 6.5 });
    });
  });

  // =========================================================================
  // 5. 不变量展示文本格式化测试 (formatInvariantText)
  // =========================================================================
  describe('5. 不变量遥测指标与 LaTeX 包装格式化', () => {
    it('5.1 菱形边长与面积格式化', () => {
      const invSide = {
        id: 'inv_side_len',
        formula: 'sqrt((diag_h / 2)^2 + (diag_v / 2)^2)',
        labelZh: '菱形边长 a',
      };
      const text = formatInvariantText(invSide, {}, 'zh-CN', { diag_h: 6, diag_v: 8 });
      expect(text).toContain('菱形边长 a');
      expect(text).toContain('5');
    });

    it('5.2 扇形弧长与面积格式化', () => {
      const invArc = {
        id: 'inv_arc_len',
        formula: '(angle_n * 3.14159265 * radius_r) / 180',
        labelZh: '弧长 l',
      };
      const text = formatInvariantText(invArc, {}, 'zh-CN', { angle_n: 180, radius_r: 2 });
      expect(text).toContain('弧长 l');
      expect(text).toContain('6.28');
    });

    it('5.3 内切圆半径公式格式化', () => {
      const invR = {
        id: 'inv_inradius_r',
        formula: 'r',
        labelZh: '内切圆半径 r',
      };
      const text = formatInvariantText(invR, {}, 'zh-CN', { vertex_A_y: 6, vertex_C_x: 4, r: 1.5 });
      expect(text).toContain('内切圆半径 r');
      expect(text).toContain('1.5');
    });
  });
});
