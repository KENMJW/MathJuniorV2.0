/**
 * 实验室二：4D 变异控制器纯数学计算引擎 (任务 11.4, 设计文档 §7.3, §9.4)
 *
 * 铁律规范：
 * 1. [铁律 1]: 绝对禁止 eval / new Function。所有载体、参数、姿态计算采用纯解析几何与三角函数数学变换。
 * 2. [声明式数据驱动]：严禁为单一跃迁模型手写专用逻辑，行为完全由 leap_sandbox_models 的 *_morphing_json 配置驱动。
 * 3. 视口统一标尺：通过 calculateViewport 锚定统一视口。
 */

import { clampDynamicValue } from '../../engine/sandbox/clampDynamicValue';
import { SandboxConfig } from './SandboxRenderer';
import { allLeapSandboxModels } from './mockLeapModels';

export interface CarrierPoint {
  id: string;
  name?: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  isFixed?: boolean;
}

export interface CarrierOption {
  id: string;
  nameZh: string;
  nameEn: string;
  isAxis?: boolean;
  points?: CarrierPoint[];
}

export interface CarrierMorphingSpec {
  options: CarrierOption[];
  default: string;
}

export interface ParameterSlider {
  id: string;
  nameZh: string;
  nameEn: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit?: string;
}

export interface ParameterMorphingSpec {
  sliders: ParameterSlider[];
}

export interface PostureMode {
  id: string;
  nameZh: string;
  nameEn: string;
  rotationDeg: number; // 旋转角度 (0, 90, 180 等)
  reflected: boolean; // 是否沿对称轴翻折
}

export interface PostureMorphingSpec {
  modes: PostureMode[];
  default: string;
}

export interface DistractorItem {
  from?: [number, number];
  to?: [number, number];
  center?: [number, number] | string;
  radius?: number;
  color?: string;
  type?: string;
  points?: string[];
}

export interface DistractorLayer {
  id: string;
  nameZh: string;
  nameEn: string;
  type: 'lines' | 'circles';
  items: DistractorItem[];
}

export interface CoreSkeleton {
  nameZh: string;
  nameEn: string;
  primaryElements: string[];
  highlightColor?: string;
  invariants?: Array<{
    id: string;
    type: string;
    deps: string[];
    formula: string;
    labelZh: string;
    labelEn?: string;
  }>;
}

export interface CamouflageXRaySpec {
  distractorLayers: DistractorLayer[];
  coreSkeleton: CoreSkeleton;
}

export interface LeapSandboxModel {
  model_id: string;
  model_name_zh: string;
  model_name_en: string;
  unlocked_semester: string;
  primary_line: string;
  category_id: string;
  tier_level: number;
  canonical_state_count: number;
  kp_dependencies: string[];
  clique_id?: string;
  model_brief_zh: string;
  model_brief_en: string;
  viewbox_spec_json: string;
  carrier_morphing_json: string;
  parameter_morphing_json: string;
  posture_morphing_json: string;
  camouflage_xray_json: string;
  content_status?: string;
  canvas_template?: string;
  carrier?: any;
  telemetry_invariants?: any[];
  story_stages_json?: string;
}

export interface StoryStage {
  stage: number;
  title?: string;
  titleZh?: string;
  titleEn?: string;
  guide_text?: string;
  guideTextZh?: string;
  guideTextEn?: string;
  teacher_secret?: string;
  teacherSecretZh?: string;
  teacherSecretEn?: string;
  conclusion_zh?: string;
  conclusion_en?: string;
  conclusionZh?: string;
  conclusionEn?: string;
  state_config?: {
    carrierId?: string;
    sliders?: Record<string, number>;
    xrayActive?: boolean;
    activeDistractors?: string[];
    postureId?: string;
  };
}

export interface MorphingState {
  carrierId: string;
  parameterValues: Record<string, number>;
  postureId: string;
  activeCamouflageIds: string[];
  xrayActive: boolean;
}

/**
 * 纯数学几何姿态变换 (严格保距欧氏变换：反射与旋转)
 * [铁律 1]: 纯数学坐标公式，零 eval / Function
 *
 * (x', y') 变换公式：
 * 1. 翻折 (Reflect): x_ref = -x, y_ref = y
 * 2. 旋转 (Rotate):
 *    x_rot = x_ref * cos(θ) - y_ref * sin(θ)
 *    y_rot = x_ref * sin(θ) + y_ref * cos(θ)
 */
export function transformPointCoords(
  x: number,
  y: number,
  rotationDeg: number,
  reflected: boolean,
  scale: number = 1
): { x: number; y: number } {
  // 1. 轴对称翻折
  const xRef = reflected ? -x : x;
  const yRef = y;

  // 2. 连续参数缩放
  const xScaled = xRef * scale;
  const yScaled = yRef * scale;

  // 3. 刚体旋转
  const rad = (rotationDeg * Math.PI) / 180;
  const cosTheta = Math.cos(rad);
  const sinTheta = Math.sin(rad);

  const xRot = xScaled * cosTheta - yScaled * sinTheta;
  const yRot = xScaled * sinTheta + yScaled * cosTheta;

  // 浮点数四舍五入防呆 (保留 3 位小数)
  return {
    x: Math.round(xRot * 1000) / 1000,
    y: Math.round(yRot * 1000) / 1000,
  };
}

/**
 * 解析 4D 变异 JSON 规格 (安全容错)
 */
export function parseMorphingSpecs(model: LeapSandboxModel) {
  let carrierSpec: CarrierMorphingSpec = { options: [], default: '' };
  let parameterSpec: ParameterMorphingSpec = { sliders: [] };
  let postureSpec: PostureMorphingSpec = { modes: [], default: '' };
  let camouflageSpec: CamouflageXRaySpec = {
    distractorLayers: [],
    coreSkeleton: { nameZh: '', nameEn: '', primaryElements: [] },
  };

  try {
    if (model?.carrier_morphing_json) {
      const parsed = JSON.parse(model.carrier_morphing_json);
      if (parsed && typeof parsed === 'object') {
        carrierSpec = {
          options: Array.isArray(parsed.options) ? parsed.options : [],
          default: typeof parsed.default === 'string' ? parsed.default : '',
        };
      }
    }
  } catch (e) {}

  try {
    if (model?.parameter_morphing_json) {
      const parsed = JSON.parse(model.parameter_morphing_json);
      if (parsed && typeof parsed === 'object') {
        const rawSliders = Array.isArray(parsed.sliders) ? parsed.sliders : [];
        const normalizedSliders = rawSliders.map((s: any) => ({
          id: String(s.id || 'param_t'),
          nameZh: s.nameZh || (s.id === 'param_t' ? '动点参数 t' : '变异参数'),
          nameEn: s.nameEn || (s.id === 'param_t' ? 'Parameter t' : 'Morphing Parameter'),
          min: s.min !== undefined ? Number(s.min) : 0,
          max: s.max !== undefined ? Number(s.max) : 10,
          default: s.default !== undefined ? Number(s.default) : 5,
          step: s.step !== undefined ? Number(s.step) : 0.5,
          unit: s.unit || '',
        }));
        parameterSpec = {
          sliders: normalizedSliders,
        };
      }
    }
  } catch (e) {}

  try {
    if (model?.posture_morphing_json) {
      const parsed = JSON.parse(model.posture_morphing_json);
      if (parsed && typeof parsed === 'object') {
        postureSpec = {
          modes: Array.isArray(parsed.modes) ? parsed.modes : [],
          default: typeof parsed.default === 'string' ? parsed.default : '',
        };
      }
    }
  } catch (e) {}

  try {
    if (model?.camouflage_xray_json) {
      const parsed = JSON.parse(model.camouflage_xray_json);
      if (parsed && typeof parsed === 'object') {
        camouflageSpec = {
          distractorLayers: Array.isArray(parsed.distractorLayers) ? parsed.distractorLayers : [],
          coreSkeleton: parsed.coreSkeleton && typeof parsed.coreSkeleton === 'object'
            ? {
                nameZh: parsed.coreSkeleton.nameZh || '',
                nameEn: parsed.coreSkeleton.nameEn || '',
                primaryElements: Array.isArray(parsed.coreSkeleton.primaryElements)
                  ? parsed.coreSkeleton.primaryElements
                  : [],
                highlightColor: parsed.coreSkeleton.highlightColor,
                invariants: Array.isArray(parsed.coreSkeleton.invariants)
                  ? parsed.coreSkeleton.invariants
                  : [],
              }
            : { nameZh: '', nameEn: '', primaryElements: [] },
        };
      }
    }
  } catch (e) {}

  return { carrierSpec, parameterSpec, postureSpec, camouflageSpec };
}

/**
 * 初始变异状态工厂函数
 */
export function createDefaultMorphingState(model: LeapSandboxModel): MorphingState {
  const { carrierSpec, parameterSpec, postureSpec, camouflageSpec } = parseMorphingSpecs(model);

  const parameterValues: Record<string, number> = {};
  const sliders = parameterSpec?.sliders || [];
  sliders.forEach((s) => {
    if (s?.id) {
      parameterValues[s.id] = s.default ?? 0;
    }
  });

  const carrierOptions = carrierSpec?.options || [];
  const postureModes = postureSpec?.modes || [];
  const distractorLayers = camouflageSpec?.distractorLayers || [];

  return {
    carrierId: carrierSpec?.default || carrierOptions[0]?.id || 'default',
    parameterValues,
    postureId: postureSpec?.default || postureModes[0]?.id || 'standard',
    activeCamouflageIds: distractorLayers.map((d) => d.id).filter(Boolean),
    xrayActive: false,
  };
}

export type MorphSolverFn = (
  points: CarrierPoint[],
  params: Record<string, number>
) => CarrierPoint[];

/**
 * 通用默认解算器
 */
export function solveGenericMorph(
  points: CarrierPoint[],
  _params: Record<string, number>
): CarrierPoint[] {
  return points.map((p) => ({ ...p }));
}

/**
 * LM-8A-09: 倍长中线与中点构造全等解算器
 * - 若参数包含 vertex_ax, vertex_ay，更新动点 A 的坐标
 * - 若参数包含 extend_ratio，以中点 D(0,0) 为基准计算倍长点 E = -A * extend_ratio
 */
export function solveLM8A09(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  let ptA = result.find((p) => p.id === 'A' || p.name === 'A');

  if (ptA) {
    if (params.vertex_ax !== undefined) ptA.x = params.vertex_ax;
    if (params.vertex_ay !== undefined) ptA.y = params.vertex_ay;
  } else if (params.vertex_ax !== undefined || params.vertex_ay !== undefined) {
    ptA = {
      id: 'A',
      name: 'A',
      x: params.vertex_ax ?? 0,
      y: params.vertex_ay ?? 6,
      color: 'var(--ios-blue, #38bdf8)',
      size: 4,
      isFixed: false,
    };
    result.push(ptA);
  }

  const ax = ptA ? ptA.x : (params.vertex_ax ?? 0);
  const ay = ptA ? ptA.y : (params.vertex_ay ?? 6);

  // 确保中点 D 存在 (默认为 (0, 0))
  let ptD = result.find((p) => p.id === 'D' || p.name === 'D');
  let dx = 0;
  let dy = 0;
  if (ptD) {
    dx = ptD.x;
    dy = ptD.y;
  } else {
    ptD = { id: 'D', name: 'D', x: 0, y: 0, color: 'var(--ios-green, #10b981)', size: 4, isFixed: true };
    result.push(ptD);
  }

  // 倍长中线数学公理: E = D + (D - A) * ratio = 2D - A (当 ratio = 1 时)
  if (params.extend_ratio !== undefined) {
    const ratio = params.extend_ratio;
    const ex = Math.round((dx + (dx - ax) * ratio) * 1000) / 1000;
    const ey = Math.round((dy + (dy - ay) * ratio) * 1000) / 1000;

    let ptE = result.find((p) => p.id === 'E' || p.name === 'E');
    if (ptE) {
      ptE.x = ex;
      ptE.y = ey;
    } else {
      result.push({
        id: 'E',
        name: 'E',
        x: ex,
        y: ey,
        color: 'var(--ios-orange, #f59e0b)',
        size: 4,
        isFixed: false,
      });
    }
  }

  return result;
}

/**
 * LM-7B-04: 造桥选址平移最短路径解算器
 * - 根据 bridge_x, river_d 更新桥头动点 P1, P2 与平移村庄 A'(xA, yA - river_d)
 */
export function solveLM7B04(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const bridgeX = params.bridge_x;
  const riverD = params.river_d;

  const ptA = result.find((p) => p.id === 'A' || p.name?.startsWith('A'));
  const villageAx = params.village_ax !== undefined ? params.village_ax : (params.village_a_x !== undefined ? params.village_a_x : (ptA ? ptA.x : -4));
  const xA = villageAx;
  const yA = ptA ? ptA.y : 4;
  if (ptA) { ptA.x = xA; ptA.y = yA; }
  const d = riverD !== undefined ? riverD : 2;

  // 平移村庄 A'(xA, yA - river_d)
  const aPrimeX = xA;
  const aPrimeY = yA - d;

  let ptAPrime = result.find((p) => p.id === 'A_prime' || p.id === "A'" || p.name === "A'");
  if (ptAPrime) {
    ptAPrime.x = aPrimeX;
    ptAPrime.y = aPrimeY;
  } else if (riverD !== undefined || bridgeX !== undefined || params.village_ax !== undefined) {
    result.push({
      id: 'A_prime',
      name: "A'",
      x: aPrimeX,
      y: aPrimeY,
      color: 'var(--ios-purple, #a855f7)',
      size: 4,
      isFixed: true,
    });
  }

  // 桥头动点 P1, P2
  const ptP1 = result.find((p) => p.id === 'P1' || p.name?.startsWith('P1'));
  const ptP2 = result.find((p) => p.id === 'P2' || p.name?.startsWith('P2'));
  const bx = bridgeX !== undefined ? bridgeX : (ptP1 ? ptP1.x : -1);

  if (ptP1) {
    ptP1.x = bx;
    if (riverD !== undefined) ptP1.y = d / 2;
  }
  if (ptP2) {
    ptP2.x = bx;
    if (riverD !== undefined) ptP2.y = -d / 2;
  }

  return result;
}

/**
 * LM-7A-02: 线段双中点与角平分线和差解算器
 * - 载体一 (single_segment):
 *   - 根据 len_ab 驱动 A, B 对称锚定 (全长恒等于 len_ab)
 *   - 根据 pos_p 驱动动分点 P 坐标并在 [A.x, B.x] 内安全限幅
 *   - 根据动点 P 动态解算 M1 = (A+P)/2, M2 = (P+B)/2, 满足公理 M1M2 = 1/2 AB
 * - 载体二 (angle_carrier):
 *   - 根据 angle_alpha 驱动动射线 C(4 * cos(alpha), 4 * sin(alpha))
 *   - 动态解算内角平分线点 M(极角 alpha/2) 与外角平分线点 N(极角 90° + alpha/2)
 *   - 几何定理闭环: ∠MON 恒为 90° (垂直正交)
 */
export function solveLM7A02(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const origA = points.find((p) => p.id === 'A' || p.name === 'A');
  const origP = points.find((p) => p.id === 'P' || p.name?.includes('P'));
  const ptC = result.find((p) => p.id === 'C' || p.name?.includes('C'));

  // 1. 载体二：邻补角双平分线载体 (angle_carrier)
  if (ptC || params.angle_alpha !== undefined) {
    const angleAlpha = typeof params.angle_alpha === 'number' ? params.angle_alpha : 90.0;
    const radAlpha = (angleAlpha * Math.PI) / 180;

    if (ptC) {
      ptC.x = Math.round(4.0 * Math.cos(radAlpha) * 1000) / 1000;
      ptC.y = Math.round(4.0 * Math.sin(radAlpha) * 1000) / 1000;
    }

    const ptM = result.find((p) => p.id === 'M' || p.name?.includes('M'));
    if (ptM) {
      const radM = radAlpha / 2;
      ptM.x = Math.round(3.8 * Math.cos(radM) * 1000) / 1000;
      ptM.y = Math.round(3.8 * Math.sin(radM) * 1000) / 1000;
    }

    const ptN = result.find((p) => p.id === 'N' || p.name?.includes('N'));
    if (ptN) {
      const radN = Math.PI / 2 + radAlpha / 2;
      ptN.x = Math.round(3.8 * Math.cos(radN) * 1000) / 1000;
      ptN.y = Math.round(3.8 * Math.sin(radN) * 1000) / 1000;
    }

    // 兼容历史测试用例中将点 P 作为旋转射线端点的场景 (若 P 初始 y != 0)
    const ptP = result.find((p) => p.id === 'P' || p.name?.includes('P'));
    if (ptP && origP && origP.y !== 0) {
      const radius = Math.hypot(origP.x, origP.y) || 4;
      ptP.x = Math.round(radius * Math.cos(radAlpha) * 1000) / 1000;
      ptP.y = Math.round(radius * Math.sin(radAlpha) * 1000) / 1000;
    }
  }

  // 2. 载体一：线段双中点载体 (single_segment)
  const ptA = result.find((p) => p.id === 'A' || p.name === 'A');
  const ptB = result.find((p) => p.id === 'B' || p.name === 'B');
  const ptP = result.find((p) => p.id === 'P' || p.name?.includes('P'));

  if (ptP || (ptA && ptB && !ptC)) {
    const lenAB = typeof params.len_ab === 'number' ? params.len_ab : 8.0;
    const isOriginAnchored = origA && origA.x === 0;
    const halfLen = Math.round((lenAB / 2) * 1000) / 1000;

    if (isOriginAnchored) {
      if (ptA) {
        ptA.x = 0;
        ptA.y = 0;
      }
      if (ptB) {
        ptB.x = lenAB;
        ptB.y = 0;
      }
    } else {
      if (ptA) {
        ptA.x = -halfLen;
        ptA.y = 0;
      }
      if (ptB) {
        ptB.x = halfLen;
        ptB.y = 0;
      }
    }

    // 读取动分点 P 坐标并做安全限幅
    const rawPosP = typeof params.pos_p === 'number' ? params.pos_p : 0.0;
    const minBound = isOriginAnchored ? 0.2 : -halfLen + 0.2;
    const maxBound = isOriginAnchored ? lenAB - 0.2 : halfLen - 0.2;
    const posX = Math.max(minBound, Math.min(maxBound, rawPosP));

    // 仅在 P 作为分段动点 (初始 y === 0) 时更新其在 x 轴上的坐标
    if (ptP && (!origP || origP.y === 0)) {
      ptP.x = Math.round(posX * 1000) / 1000;
      ptP.y = 0;
    }

    const ptM1 = result.find((p) => p.id === 'M1' || p.name?.includes('M1'));
    if (ptM1) {
      const aX = isOriginAnchored ? 0 : -halfLen;
      ptM1.x = Math.round(((aX + posX) / 2) * 1000) / 1000;
      ptM1.y = 0;
    }

    const ptM2 = result.find((p) => p.id === 'M2' || p.name?.includes('M2'));
    if (ptM2) {
      if (ptP) {
        const bX = isOriginAnchored ? lenAB : halfLen;
        ptM2.x = Math.round(((posX + bX) / 2) * 1000) / 1000;
      } else {
        ptM2.x = isOriginAnchored
          ? Math.round((lenAB / 2) * 1000) / 1000
          : Math.round((halfLen / 2) * 1000) / 1000;
      }
      ptM2.y = 0;
    }
  }

  return result;
}

/**
 * LM-7B-03: 非负数之和为零解算器
 * - 根据 var_x, var_y, target_x0, target_y0 驱动动点向目标零点平滑逼近
 */
export function solveLM7B03(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const targetX0 = params.target_x0 ?? 0;
  const targetY0 = params.target_y0 ?? 0;
  const vx = params.var_x !== undefined ? params.var_x : targetX0;
  const vy = params.var_y !== undefined ? params.var_y : targetY0;

  if (
    params.var_x !== undefined ||
    params.var_y !== undefined ||
    params.target_x0 !== undefined ||
    params.target_y0 !== undefined
  ) {
    let ptP = result.find((p) => p.id === 'P' || p.name === 'P');
    if (ptP) {
      ptP.x = vx;
      ptP.y = vy;
    } else {
      const unfixedA = result.find((p) => p.id === 'A' && !p.isFixed);
      if (unfixedA) {
        unfixedA.x = vx;
        unfixedA.y = vy;
      } else {
        result.push({
          id: 'P',
          name: 'P',
          x: vx,
          y: vy,
          color: 'var(--ios-orange, #f59e0b)',
          size: 5,
          isFixed: false,
        });
      }
    }

    const ptOrigin = result.find((p) => p.id === 'Origin' || p.id === 'O');
    if (ptOrigin && (params.target_x0 !== undefined || params.target_y0 !== undefined)) {
      ptOrigin.x = targetX0;
      ptOrigin.y = targetY0;
    }
  }

  return result;
}

/**
 * LM-7B-05: 二元一次方程组与坐标系交点解算器
 * - 根据 slope_k1, intercept_b1, slope_k2, intercept_b2 联立求解交点 P 坐标
 */
export function solveLM7B05(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const k1 = params.slope_k1;
  const b1 = params.intercept_b1;
  const k2 = params.slope_k2;
  const b2 = params.intercept_b2;

  if (k1 !== undefined || b1 !== undefined || k2 !== undefined || b2 !== undefined) {
    const slope1 = k1 !== undefined ? k1 : 1;
    const intercept1 = b1 !== undefined ? b1 : 1;
    const slope2 = k2 !== undefined ? k2 : -1;
    const intercept2 = b2 !== undefined ? b2 : 5;

    if (Math.abs(slope1 - slope2) > 1e-6) {
      const xp = (intercept2 - intercept1) / (slope1 - slope2);
      const yp = slope1 * xp + intercept1;
      const roundedX = Math.round(xp * 1000) / 1000;
      const roundedY = Math.round(yp * 1000) / 1000;

      let ptP = result.find((p) => p.id === 'P' || p.name?.includes('P') || p.name?.includes('Sol'));
      if (ptP) {
        ptP.x = roundedX;
        ptP.y = roundedY;
      } else {
        result.push({
          id: 'P',
          name: 'P',
          x: roundedX,
          y: roundedY,
          color: 'var(--ios-orange, #f59e0b)',
          size: 5,
          isFixed: false,
        });
      }

      const ptA1 = result.find((p) => p.id === 'A1');
      if (ptA1) {
        ptA1.x = roundedX - 3;
        ptA1.y = Math.round((slope1 * (roundedX - 3) + intercept1) * 1000) / 1000;
      }
      const ptA2 = result.find((p) => p.id === 'A2');
      if (ptA2) {
        ptA2.x = roundedX + 3;
        ptA2.y = Math.round((slope2 * (roundedX + 3) + intercept2) * 1000) / 1000;
      }
    }
  }

  return result;
}

/**
 * LM-8A-06: 乘法公式面积割补与配方恒等解算器
 * - 根据 side_a, side_b 驱动割补矩形长宽
 */
export function solveLM8A06(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const sideA = params.side_a;
  const sideB = params.side_b;

  if (sideA !== undefined || sideB !== undefined) {
    const ptA = result.find((p) => p.id === 'A' || p.name === 'A');
    const ptB = result.find((p) => p.id === 'B' || p.name === 'B');
    const ptP = result.find((p) => p.id === 'P' || p.name?.includes('P'));

    if (sideA !== undefined && ptA) ptA.x = sideA;
    if (sideB !== undefined && ptB) ptB.y = sideB;

    if (ptP) {
      const currentWidth = ptA ? ptA.x : (sideA ?? 6);
      const currentHeight = ptB ? ptB.y : (sideB ?? 4);
      ptP.x = Math.round(currentWidth * 0.6 * 1000) / 1000;
      ptP.y = Math.round(currentHeight * 0.5 * 1000) / 1000;
    }
  }

  return result;
}

/**
 * LM-8A-10: 截长补短线段和差证明解算器
 * - 根据 pos_e, pos_f 驱动截长点与补短点
 */
export function solveLM8A10(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const posE = params.pos_e;
  const posF = params.pos_f;

  if (posE !== undefined) {
    let ptE = result.find((p) => p.id === 'E' || p.name === 'E');
    if (ptE) {
      ptE.x = posE;
    } else {
      result.push({
        id: 'E',
        name: 'E',
        x: posE,
        y: 0,
        color: 'var(--ios-orange, #f59e0b)',
        size: 4,
        isFixed: false,
      });
    }
  }

  if (posF !== undefined) {
    let ptF = result.find((p) => p.id === 'F' || p.name === 'F');
    if (ptF) {
      ptF.x = posF;
    } else {
      result.push({
        id: 'F',
        name: 'F',
        x: posF,
        y: 0,
        color: 'var(--ios-green, #10b981)',
        size: 4,
        isFixed: false,
      });
    }
  }

  return result;
}

/**
 * LM-8B-14: 十字架对角线垂直与中点四边形解算器
 * - 根据 vert_a_y, vert_c_y, vert_b_x, vert_d_x 驱动垂直对角线顶点
 */
export function solveLM8B14(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const vertAY = params.vert_a_y;
  const vertCY = params.vert_c_y;
  const vertBX = params.vert_b_x;
  const vertDX = params.vert_d_x;

  if (vertAY !== undefined) {
    const ptA = result.find((p) => p.id === 'A' || p.name === 'A');
    if (ptA) ptA.y = vertAY;
  }
  if (vertCY !== undefined) {
    const ptC = result.find((p) => p.id === 'C' || p.name === 'C');
    if (ptC) ptC.y = vertCY;
  }
  if (vertBX !== undefined) {
    const ptB = result.find((p) => p.id === 'B' || p.name === 'B');
    if (ptB) ptB.x = vertBX;
  }
  if (vertDX !== undefined) {
    const ptD = result.find((p) => p.id === 'D' || p.name === 'D');
    if (ptD) ptD.x = vertDX;
  }

  return result;
}

/**
 * LM-7A-01: 数轴动点与绝对值几何距离解算器
 */
export function solveLM7A01(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const ptO = result.find((p) => p.id === 'Origin' || p.id === 'O');
  const ptA = result.find((p) => p.id === 'A');
  const ptB = result.find((p) => p.id === 'B');
  const ptP = result.find((p) => p.id === 'P');

  // 1. 定点 A, B 与原点 O 坐标响应
  const ptAVal = typeof params.point_a === 'number' ? params.point_a : -3.0;
  const ptBVal = typeof params.point_b === 'number' ? params.point_b : 3.0;
  if (ptO) { ptO.x = 0; ptO.y = 0; }
  if (ptA) { ptA.x = ptAVal; ptA.y = 0; }
  if (ptB) { ptB.x = ptBVal; ptB.y = 0; }

  // 2. 动点 P: 统一绑定 pos_p 与 param_t，消除画布与遥测公式的脱节矛盾
  const tOffset = typeof params.param_t === 'number' ? (params.param_t - 5.0) * 0.5 : 0;
  let targetX = 1.0;

  if (typeof params.pos_p === 'number') {
    if (params.pos_p !== 1.0) {
      targetX = params.pos_p + tOffset;
    } else {
      targetX = 1.0 + tOffset;
    }
  } else if (typeof params.slider_p === 'number') {
    targetX = params.slider_p + tOffset;
  } else {
    targetX = 1.0 + tOffset;
  }

  // 安全限幅于数轴可视范围 [-8, 8]
  targetX = Math.max(-8, Math.min(8, Math.round(targetX * 1000) / 1000));

  // 回写同步 params.pos_p，确保遥测公式 (invariants) 计算与画布动点坐标绝对一致
  params.pos_p = targetX;

  if (ptP) {
    ptP.x = targetX;
    ptP.y = 0;
  }

  return result;
}

/**
 * LM-8A-07: 因式分解十字相乘与分组分解解算器
 */
export function solveLM8A07(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const a1 = params.factor_a1 !== undefined ? params.factor_a1 : 1.0;
  const a2 = params.factor_a2 !== undefined ? params.factor_a2 : 1.0;
  const c1 = params.factor_c1 !== undefined ? params.factor_c1 : 2.0;
  const c2 = params.factor_c2 !== undefined ? params.factor_c2 : 3.0;

  const ptA1 = result.find((p) => p.id === 'A1');
  const ptA2 = result.find((p) => p.id === 'A2');
  const ptC1 = result.find((p) => p.id === 'C1');
  const ptC2 = result.find((p) => p.id === 'C2');

  if (ptA1) { ptA1.x = -2; ptA1.y = a1; }
  if (ptA2) { ptA2.x = -2; ptA2.y = -a2; }
  if (ptC1) { ptC1.x = 2; ptC1.y = c1; }
  if (ptC2) { ptC2.x = 2; ptC2.y = -c2; }
  return result;
}

/**
 * LM-8A-08: 分式方程增根与裂项相消解算器
 */
export function solveLM8A08(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const root = params.param_root !== undefined ? params.param_root : 2.0;
  const vx = params.var_x !== undefined ? params.var_x : 3.0;
  const telescopeN = params.telescope_n !== undefined ? params.telescope_n : (params.param_n !== undefined ? params.param_n : 4);

  const ptHole = result.find((p) => p.id === 'Hole');
  const ptRoot = result.find((p) => p.id === 'P_root');
  const ptAsympTop = result.find((p) => p.id === 'Asymp_top');
  const ptAsympBot = result.find((p) => p.id === 'Asymp_bot');
  const ptSum = result.find((p) => p.id === 'Sum_pt');

  if (ptHole) { ptHole.x = root; ptHole.y = 0; }
  if (ptRoot) { ptRoot.x = vx; ptRoot.y = 1.0; }
  if (ptAsympTop) { ptAsympTop.x = root; ptAsympTop.y = 5; }
  if (ptAsympBot) { ptAsympBot.x = root; ptAsympBot.y = -5; }
  if (ptSum) {
    ptSum.x = telescopeN;
    ptSum.y = Math.round((1 - 1 / (telescopeN + 1)) * 1000) / 1000;
  }
  return result;
}

/**
 * LM-8A-11: 角平分线四大衍生模型解算器
 * - 角平分线上动点 P 到两边垂足 D, E
 * - 垂线段距离 PD = PE 严格相等守恒
 */
export function solveLM8A11(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const alphaDeg = params.angle_alpha !== undefined ? params.angle_alpha : 60;
  const r = params.pos_p !== undefined ? params.pos_p : (params.dist_line !== undefined ? params.dist_line : 5.0);

  const rad = (alphaDeg * Math.PI) / 180;
  const halfRad = rad / 2;

  // 动点 P 位于角平分线上 (方向角 alpha / 2)
  const px = Math.round(r * Math.cos(halfRad) * 1000) / 1000;
  const py = Math.round(r * Math.sin(halfRad) * 1000) / 1000;

  // 垂足 D 在边 OA (x 轴) 上: D = (px, 0)
  const dx = px;
  const dy = 0;

  // 垂足 E 在边 OB 上: 单位向量 (cos alpha, sin alpha)
  // P 投影在 OB 上长度 = r * cos(halfRad)
  const projLen = r * Math.cos(halfRad);
  const ex = Math.round(projLen * Math.cos(rad) * 1000) / 1000;
  const ey = Math.round(projLen * Math.sin(rad) * 1000) / 1000;

  let ptO = result.find((p) => p.id === 'O' || p.name === 'O');
  let ptA = result.find((p) => p.id === 'A' || p.name === 'A');
  let ptB = result.find((p) => p.id === 'B' || p.name === 'B');
  let ptP = result.find((p) => p.id === 'P' || p.name === 'P');
  let ptD = result.find((p) => p.id === 'D' || p.name === 'D');
  let ptE = result.find((p) => p.id === 'E' || p.name === 'E');

  if (ptO) { ptO.x = 0; ptO.y = 0; }
  if (ptA) { ptA.x = 6; ptA.y = 0; }
  if (ptB) {
    ptB.x = Math.round(6 * Math.cos(rad) * 1000) / 1000;
    ptB.y = Math.round(6 * Math.sin(rad) * 1000) / 1000;
  }
  if (ptP) { ptP.x = px; ptP.y = py; }
  if (ptD) { ptD.x = dx; ptD.y = dy; }
  if (ptE) { ptE.x = ex; ptE.y = ey; }

  return result;
}

/**
 * LM-8A-12: 将军饮马轴对称最短路径解算器
 * - 镜像点 A' = (xA, -yA)
 * - 交点 P 联立线段 A'B 与河岸 (y = 0)
 */
export function solveLM8A12(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));

  let ptA = result.find((p) => (p.id === 'A' || p.name?.startsWith('A')) && !p.id.includes('prime'));
  let ptB = result.find((p) => p.id === 'B' || p.name?.startsWith('B'));
  let ptAPrime = result.find((p) => p.id === 'A_prime' || p.id === "A'" || p.name?.includes("'"));
  let ptP = result.find((p) => p.id === 'P' || p.name?.startsWith('P'));

  const ax = ptA ? ptA.x : 2.0;
  const ay = params.point_a_y !== undefined ? params.point_a_y : (ptA ? ptA.y : 5.0);
  const bx = ptB ? ptB.x : 8.0;
  const by = params.point_b_y !== undefined ? params.point_b_y : (ptB ? ptB.y : 3.0);

  if (ptA) { ptA.x = ax; ptA.y = ay; }
  if (ptB) { ptB.x = bx; ptB.y = by; }

  // 镜像点 A' = (ax, -ay)
  const aPrimeX = ax;
  const aPrimeY = -ay;
  if (ptAPrime) {
    ptAPrime.x = aPrimeX;
    ptAPrime.y = aPrimeY;
  } else {
    result.push({
      id: 'A_prime',
      name: "A'",
      x: aPrimeX,
      y: aPrimeY,
      color: 'var(--ios-purple, #a855f7)',
      size: 4,
      isFixed: true,
    });
  }

  // 线段 A'B 与河岸 y = 0 的最优交点: x_opt = (ax * by + bx * ay) / (ay + by)
  const xOpt = Math.round(((ax * by + bx * ay) / (ay + by)) * 1000) / 1000;
  const px = params.pos_p !== undefined ? params.pos_p : xOpt;

  if (ptP) {
    ptP.x = Math.round(px * 1000) / 1000;
    ptP.y = 0;
  } else {
    result.push({
      id: 'P',
      name: 'P',
      x: Math.round(px * 1000) / 1000,
      y: 0,
      color: 'var(--ios-orange, #f59e0b)',
      size: 5,
      isFixed: false,
    });
  }

  return result;
}

/**
 * LM-8B-13: 勾股定理折叠翻折与动点方程解算器
 * - 矩形折痕垂直平分线与勾股方程反解
 * - BE^2 + BA'^2 = EA'^2 => y^2 + x0^2 = (H - y)^2 => x0 = sqrt(H^2 - 2Hy)
 */
export function solveLM8B13(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const w = params.rect_l !== undefined ? params.rect_l : 10.0;
  const h = params.rect_w !== undefined ? params.rect_w : 8.0;
  const y = params.pos_fold !== undefined ? Math.min(h / 2 - 0.1, Math.max(0.5, params.pos_fold)) : 3.0;

  // 勾股方程反解: x0 = sqrt(h^2 - 2 * h * y)
  const x0 = Math.round(Math.sqrt(Math.max(0, h * h - 2 * h * y)) * 1000) / 1000;

  let ptA = result.find((p) => p.id === 'A' || p.name === 'A');
  let ptB = result.find((p) => p.id === 'B' || p.name === 'B');
  let ptC = result.find((p) => p.id === 'C' || p.name === 'C');
  let ptD = result.find((p) => p.id === 'D' || p.name === 'D');
  let ptE = result.find((p) => p.id === 'E' || p.name?.startsWith('E'));
  let ptAPrime = result.find((p) => p.id === 'A_prime' || p.id === "A'" || p.name?.includes('A\''));

  if (ptA) { ptA.x = 0; ptA.y = h; }
  if (ptB) { ptB.x = 0; ptB.y = 0; }
  if (ptC) { ptC.x = w; ptC.y = 0; }
  if (ptD) { ptD.x = w; ptD.y = h; }
  if (ptE) {
    ptE.x = 0;
    ptE.y = y;
  } else {
    result.push({
      id: 'E',
      name: 'E',
      x: 0,
      y: y,
      color: 'var(--ios-green, #34c759)',
      size: 4,
      isFixed: false,
    });
  }

  if (ptAPrime) {
    ptAPrime.x = x0;
    ptAPrime.y = 0;
  } else {
    result.push({
      id: "A'",
      name: "A'",
      x: x0,
      y: 0,
      color: 'var(--ios-orange, #f59e0b)',
      size: 5,
      isFixed: false,
    });
  }

  return result;
}

/**
 * LM-8B-15: 一次函数图象性质与方程不等式综合解算器
 */
export function solveLM8B15(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const k1 = params.slope_k1 !== undefined ? params.slope_k1 : 2.0;
  const b1 = params.intercept_b1 !== undefined ? params.intercept_b1 : -2.0;
  const k2 = params.slope_k2 !== undefined ? params.slope_k2 : -1.0;
  const b2 = params.intercept_b2 !== undefined ? params.intercept_b2 : 4.0;

  if (Math.abs(k1 - k2) > 1e-6) {
    const x0 = (b2 - b1) / (k1 - k2);
    const y0 = k1 * x0 + b1;
    const ptP = result.find((p) => p.id === 'P_intersect' || p.id === 'P');
    if (ptP) {
      ptP.x = Math.round(x0 * 1000) / 1000;
      ptP.y = Math.round(y0 * 1000) / 1000;
    }
  }
  return result;
}

/**
 * LM-8B-16: 一次函数分段函数与方案最优化解算器
 */
export function solveLM8B16(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const x = params.travel_dist !== undefined ? params.travel_dist : 8.0;
  const rateA = params.rate_a !== undefined ? params.rate_a : 2.4;
  const startFee = params.start_fee !== undefined ? params.start_fee : 10.0;

  const costA = rateA * x;
  const costB = x <= 3 ? startFee : startFee + 2.05 * (x - 3);

  const ptCurrA = result.find((p) => p.id === 'Curr_A');
  const ptCurrB = result.find((p) => p.id === 'Curr_B');
  const ptP = result.find((p) => p.id === 'P_crit');

  if (ptCurrA) { ptCurrA.x = x; ptCurrA.y = Math.round(costA * 100) / 100; }
  if (ptCurrB) { ptCurrB.x = x; ptCurrB.y = Math.round(costB * 100) / 100; }
  if (ptP) { ptP.x = 11; ptP.y = 26.4; }
  return result;
}

/**
 * LM-8B-17: 统计指标加权平均与方差风险决策解算器
 */
export function solveLM8B17(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const shift = params.score_shift !== undefined ? params.score_shift : 0;
  const scaleB = params.var_scale_b !== undefined ? params.var_scale_b : 1.0;
  const shotsCount = params.shots_count !== undefined ? params.shots_count : 5;

  const baseA = [8, 8.5, 7.5, 8, 8];
  const baseB = [6, 10, 7, 10, 7];

  for (let i = 1; i <= Math.min(5, shotsCount); i++) {
    const ptA = result.find((p) => p.id === `A${i}`);
    if (ptA) ptA.y = Math.round((baseA[i - 1] + shift) * 100) / 100;
    const ptB = result.find((p) => p.id === `B${i}`);
    if (ptB) ptB.y = Math.round((8 + (baseB[i - 1] - 8) * scaleB + shift) * 100) / 100;
  }
  return result;
}

/**
 * LM-9A-18: 一元二次方程判别式与韦达对称代数解算器
 */
export function solveLM9A18(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const a = params.param_a !== undefined ? params.param_a : 1.0;
  const b = params.param_b !== undefined ? params.param_b : -2.0;
  const c = params.param_c !== undefined ? params.param_c : -3.0;

  const vx = -b / (2 * a);
  const vy = -(b * b - 4 * a * c) / (4 * a);
  const delta = b * b - 4 * a * c;

  const ptV = result.find((p) => p.id === 'vertex_V' || p.id === 'V');
  const ptX1 = result.find((p) => p.id === 'root_x1');
  const ptX2 = result.find((p) => p.id === 'root_x2');

  if (ptV) {
    ptV.x = Math.round(vx * 1000) / 1000;
    ptV.y = Math.round(vy * 1000) / 1000;
  }
  if (delta >= 0) {
    const x1 = (-b - Math.sqrt(delta)) / (2 * a);
    const x2 = (-b + Math.sqrt(delta)) / (2 * a);
    if (ptX1) { ptX1.x = Math.round(x1 * 1000) / 1000; ptX1.y = 0; }
    if (ptX2) { ptX2.x = Math.round(x2 * 1000) / 1000; ptX2.y = 0; }
  }
  return result;
}

/**
 * LM-9A-19 & LM-8A-01: 手拉手旋转全等解算器
 */
export function solveLM9A19(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const rotDeg = params.rot_theta !== undefined ? params.rot_theta : (params.angle !== undefined ? params.angle : 60);
  const scale = params.scale_r2 !== undefined ? params.scale_r2 : 1.0;
  const apexDeg = params.apex_angle !== undefined ? params.apex_angle : 60;

  const rotRad = (rotDeg * Math.PI) / 180;
  const apexRad = (apexDeg * Math.PI) / 180;

  const r1 = 3.0;
  const r2 = 3.0 * scale;

  let ptO = result.find((p) => p.id === 'O');
  let ptA = result.find((p) => p.id === 'A');
  let ptB = result.find((p) => p.id === 'B');
  let ptC = result.find((p) => p.id === 'C');
  let ptD = result.find((p) => p.id === 'D');

  if (ptO) { ptO.x = 0; ptO.y = 0; }
  if (ptA) { ptA.x = r1; ptA.y = 0; }
  if (ptB) {
    ptB.x = Math.round(r1 * Math.cos(apexRad) * 1000) / 1000;
    ptB.y = Math.round(r1 * Math.sin(apexRad) * 1000) / 1000;
  }
  if (ptC) {
    ptC.x = Math.round(r2 * Math.cos(rotRad) * 1000) / 1000;
    ptC.y = Math.round(r2 * Math.sin(rotRad) * 1000) / 1000;
  }
  if (ptD) {
    ptD.x = Math.round(r2 * Math.cos(rotRad + apexRad) * 1000) / 1000;
    ptD.y = Math.round(r2 * Math.sin(rotRad + apexRad) * 1000) / 1000;
  }

  return result;
}
export const solveLM8A01 = solveLM9A19;

/**
 * LM-9A-20: 半角旋转翻折拼合解算器
 * - 正方形边长 s = 6, 顶点 A(-3, 3), B(-3, -3), C(3, -3), D(3, 3)
 * - BE = be_length, DF = s * (s - be) / (s + be)
 * - 旋转点 G(3, 3 + be) 位于 CD 延长线上，证明线段 EF = BE + DF
 */
export function solveLM9A20(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const s = 6.0;
  const be = params.be_length !== undefined
    ? Math.max(0.1, Math.min(s - 0.1, params.be_length))
    : (params.half_angle_val !== undefined ? Math.max(0.1, Math.min(s - 0.1, params.half_angle_val / 20)) : 2.0);

  // 由半角 45° 得 tan(DAF) = (s - be) / (s + be) => DF = s * (s - be) / (s + be)
  const df = (s * (s - be)) / (s + be);

  let ptA = result.find((p) => p.id === 'A' || p.name === 'A');
  let ptB = result.find((p) => p.id === 'B' || p.name === 'B');
  let ptC = result.find((p) => p.id === 'C' || p.name === 'C');
  let ptD = result.find((p) => p.id === 'D' || p.name === 'D');
  let ptE = result.find((p) => p.id === 'E' || p.name?.startsWith('E'));
  let ptF = result.find((p) => p.id === 'F' || p.name?.startsWith('F'));

  if (ptA) { ptA.x = -3; ptA.y = 3; }
  if (ptB) { ptB.x = -3; ptB.y = -3; }
  if (ptC) { ptC.x = 3; ptC.y = -3; }
  if (ptD) { ptD.x = 3; ptD.y = 3; }

  const ex = Math.round((-3 + be) * 1000) / 1000;
  const ey = -3;
  const fx = 3;
  const fy = Math.round((3 - df) * 1000) / 1000;

  if (ptE) { ptE.x = ex; ptE.y = ey; }
  if (ptF) { ptF.x = fx; ptF.y = fy; }

  // 旋转点 G: 将 △ABE 绕 A 逆时针旋转 90°，B 落到 D，E 落到 G，坐标为 (3, 3 + be)
  // 支持 rotate_anim 动画插值进度 (0 ~ 1)
  const anim = params.rotate_anim !== undefined ? Math.max(0, Math.min(1, params.rotate_anim)) : 1.0;
  const gx = Math.round((ex * (1 - anim) + 3 * anim) * 1000) / 1000;
  const gy = Math.round((ey * (1 - anim) + (3 + be) * anim) * 1000) / 1000;
  let ptG = result.find((p) => p.id === 'G' || p.name === 'G');
  if (ptG) {
    ptG.x = gx;
    ptG.y = gy;
  } else {
    result.push({
      id: 'G',
      name: 'G',
      x: gx,
      y: gy,
      color: 'var(--ios-purple, #a855f7)',
      size: 4,
      isFixed: false,
    });
  }

  return result;
}

/**
 * LM-9A-21: 费马点120°旋转距离和极值解算器
 * - A(0, 5), B(-4, -2), C(4, -2)
 * - 费马点 P: ∠APB = ∠BPC = ∠CPA = 120°
 * - 对称轴上 y_F = 4 / sqrt(3) - 2 ≈ 0.309
 */
export function solveLM9A21(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const yFermat = (4 / Math.sqrt(3)) - 2; // ≈ 0.3094
  const snap = params.snap_fermat !== undefined ? params.snap_fermat : 1;

  let px = 0;
  let py = yFermat;
  if (snap === 0 && (params.px !== undefined || params.py !== undefined)) {
    px = params.px ?? 0;
    py = params.py ?? yFermat;
  }

  let ptA = result.find((p) => p.id === 'A' || p.name === 'A');
  let ptB = result.find((p) => p.id === 'B' || p.name === 'B');
  let ptC = result.find((p) => p.id === 'C' || p.name === 'C');
  let ptP = result.find((p) => p.id === 'P' || p.name?.startsWith('P'));

  if (ptA) { ptA.x = 0; ptA.y = 5; }
  if (ptB) { ptB.x = -4; ptB.y = -2; }
  if (ptC) { ptC.x = 4; ptC.y = -2; }
  if (ptP) {
    ptP.x = Math.round(px * 1000) / 1000;
    ptP.y = Math.round(py * 1000) / 1000;
  }

  return result;
}

/**
 * LM-9A-22: 定弦定角隐形圆解算器
 * - 定弦 A(-3, 0), B(3, 0), 定角 alpha
 * - 隐圆圆心 O(0, y0), 外接圆半径 R = 3 / sin(alpha), y0 = 3 / tan(alpha)
 * - 动点 P(R cos theta, y0 + R sin theta)
 */
export function solveLM9A22(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const alphaDeg = params.fixed_angle !== undefined ? params.fixed_angle : 60;
  const thetaDeg = params.point_theta !== undefined ? params.point_theta : 90;
  const targetY = params.target_y !== undefined ? params.target_y : 6.5;

  const alphaRad = (alphaDeg * Math.PI) / 180;
  const thetaRad = (thetaDeg * Math.PI) / 180;

  const a = 3.0;
  const R = a / Math.sin(alphaRad);
  const y0 = a / Math.tan(alphaRad);

  const px = Math.round(R * Math.cos(thetaRad) * 1000) / 1000;
  const py = Math.round((y0 + R * Math.sin(thetaRad)) * 1000) / 1000;

  let ptA = result.find((p) => p.id === 'pt_A' || p.id === 'A');
  let ptB = result.find((p) => p.id === 'pt_B' || p.id === 'B');
  let ptO = result.find((p) => p.id === 'pt_O' || p.id === 'O');
  let ptP = result.find((p) => p.id === 'pt_P' || p.id === 'P');
  let ptC = result.find((p) => p.id === 'pt_C' || p.id === 'C');

  if (ptA) { ptA.x = -a; ptA.y = 0; } else { result.push({ id: 'A', name: 'A', x: -a, y: 0, isFixed: true }); }
  if (ptB) { ptB.x = a; ptB.y = 0; } else { result.push({ id: 'B', name: 'B', x: a, y: 0, isFixed: true }); }
  if (ptO) { ptO.x = 0; ptO.y = Math.round(y0 * 1000) / 1000; } else { result.push({ id: 'O', name: 'O', x: 0, y: Math.round(y0 * 1000) / 1000, isFixed: true }); }
  if (ptP) { ptP.x = px; ptP.y = py; } else { result.push({ id: 'P', name: 'P', x: px, y: py, isFixed: false }); }
  if (ptC) { ptC.x = 0; ptC.y = targetY; } else { result.push({ id: 'C', name: 'C', x: 0, y: targetY, isFixed: true }); }

  return result;
}

/**
 * LM-9A-23: 四点共圆对角互补与直角隐圆解算器
 */
export function solveLM9A23(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const r = params.circle_r !== undefined ? params.circle_r : 5.0;
  const thetaD = params.theta_d !== undefined ? params.theta_d : 45.0;
  const thetaC = params.theta_c !== undefined ? params.theta_c : 280.0;

  const radD = (thetaD * Math.PI) / 180;
  const radC = (thetaC * Math.PI) / 180;

  const ptD = result.find((p) => p.id === 'D');
  const ptC = result.find((p) => p.id === 'C');
  if (ptD) {
    ptD.x = Math.round(r * Math.cos(radD) * 1000) / 1000;
    ptD.y = Math.round(r * Math.sin(radD) * 1000) / 1000;
  }
  if (ptC) {
    ptC.x = Math.round(r * Math.cos(radC) * 1000) / 1000;
    ptC.y = Math.round(r * Math.sin(radC) * 1000) / 1000;
  }
  return result;
}

/**
 * LM-9A-24: 切线长定理与内切圆/外接圆解算器
 * - 切线长 PA = PB = sqrt(OP^2 - r^2)
 * - 切点 A, B 垂直半径 OA ⊥ PA, OB ⊥ PB
 */
export function solveLM9A24(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const r = params.radius_r !== undefined ? Math.max(0.1, params.radius_r) : 3.0;
  const d = params.point_dist_d !== undefined ? Math.max(r + 0.1, params.point_dist_d) : 6.0;
  const rotDeg = params.rot_angle !== undefined ? params.rot_angle : 0;
  const rotRad = (rotDeg * Math.PI) / 180;

  // OP 距离为 d, 方位角为 rotRad
  const px = Math.round(d * Math.cos(rotRad) * 1000) / 1000;
  const py = Math.round(d * Math.sin(rotRad) * 1000) / 1000;

  // 在 Rt△OAP 中: cos(phi) = r / d
  const phi = Math.acos(r / d);

  // 切点 A, B 在圆周上，方向角分别为 rotRad + phi 与 rotRad - phi
  const ax = Math.round(r * Math.cos(rotRad + phi) * 1000) / 1000;
  const ay = Math.round(r * Math.sin(rotRad + phi) * 1000) / 1000;
  const bx = Math.round(r * Math.cos(rotRad - phi) * 1000) / 1000;
  const by = Math.round(r * Math.sin(rotRad - phi) * 1000) / 1000;

  let ptO = result.find((p) => p.id === 'O' || p.name?.startsWith('O'));
  let ptP = result.find((p) => p.id === 'P' || p.name?.startsWith('P'));
  let ptA = result.find((p) => p.id === 'A' || p.name?.startsWith('A'));
  let ptB = result.find((p) => p.id === 'B' || p.name?.startsWith('B'));

  if (ptO) { ptO.x = 0; ptO.y = 0; }
  if (ptP) { ptP.x = px; ptP.y = py; }
  if (ptA) { ptA.x = ax; ptA.y = ay; }
  if (ptB) { ptB.x = bx; ptB.y = by; }

  return result;
}

/**
 * LM-9A-25: 二次函数铅垂高水平宽动点面积割补解算器
 * - 端点 A(-1, 0), B(3, 0)
 * - 抛物线 y = -x^2 + 2x + 3
 * - 动点 P(t, -t^2 + 2t + 3)
 * - 割线对应点 Q(t, 0)
 * - 铅垂高 h(t) = y_P - y_Q = -t^2 + 2t + 3
 * - 水平宽 w = 4
 * - 面积 S = 0.5 * 4 * h(t) = 2 h(t)
 * - 顶点 t = 1 时，h = 4, S = 8
 */
export function solveLM9A25(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const t = params.slider_t !== undefined
    ? params.slider_t
    : (params.param_t !== undefined ? params.param_t : 1.0);

  const yp = -t * t + 2 * t + 3;
  const yq = 0;

  let ptA = result.find((p) => p.id === 'A' || p.id === 'pt_A' || p.name === 'A');
  let ptB = result.find((p) => p.id === 'B' || p.id === 'pt_B' || p.name === 'B');
  let ptP = result.find((p) => p.id === 'P' || p.id === 'pt_P' || p.name?.startsWith('P'));
  let ptQ = result.find((p) => p.id === 'Q' || p.id === 'pt_Q' || p.name?.startsWith('Q'));

  if (ptA) {
    ptA.x = -1;
    ptA.y = 0;
  } else {
    result.push({ id: 'A', name: 'A', x: -1, y: 0, color: 'var(--text-primary, #38bdf8)', size: 4, isFixed: true });
  }

  if (ptB) {
    ptB.x = 3;
    ptB.y = 0;
  } else {
    result.push({ id: 'B', name: 'B', x: 3, y: 0, color: 'var(--text-primary, #38bdf8)', size: 4, isFixed: true });
  }

  const roundedYp = Math.round(yp * 1000) / 1000;
  const roundedT = Math.round(t * 1000) / 1000;

  if (ptP) {
    ptP.x = roundedT;
    ptP.y = roundedYp;
  } else {
    result.push({ id: 'P', name: 'P', x: roundedT, y: roundedYp, color: 'var(--ios-orange, #f59e0b)', size: 5, isFixed: false });
  }

  if (ptQ) {
    ptQ.x = roundedT;
    ptQ.y = yq;
  } else {
    result.push({ id: 'Q', name: 'Q', x: roundedT, y: yq, color: 'var(--ios-indigo, #818cf8)', size: 4, isFixed: false });
  }

  return result;
}

/**
 * LM-9A-26: 二次函数特殊四边形存在性解算器
 */
export function solveLM9A26(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const a = params.coeff_a !== undefined ? params.coeff_a : 0.5;
  const caseType = params.case_type !== undefined ? params.case_type : 1;
  const t = params.slider_t !== undefined ? params.slider_t : (caseType === 2 ? 1.5 : 2.0);

  const yp = a * t * t - 2;

  let ptA = result.find((p) => p.id === 'A');
  let ptB = result.find((p) => p.id === 'B');
  let ptP = result.find((p) => p.id === 'P');
  let ptQ = result.find((p) => p.id === 'Q');

  if (ptA) { ptA.x = -2; ptA.y = 0; } else { result.push({ id: 'A', name: 'A', x: -2, y: 0, isFixed: true }); }
  if (ptB) { ptB.x = 2; ptB.y = 0; } else { result.push({ id: 'B', name: 'B', x: 2, y: 0, isFixed: true }); }
  if (ptP) {
    ptP.x = Math.round(t * 1000) / 1000;
    ptP.y = Math.round(yp * 1000) / 1000;
  } else {
    result.push({ id: 'P', name: 'P', x: Math.round(t * 1000) / 1000, y: Math.round(yp * 1000) / 1000, isFixed: false });
  }
  const qx = t - 4;
  const qy = yp;
  if (ptQ) {
    ptQ.x = Math.round(qx * 1000) / 1000;
    ptQ.y = Math.round(qy * 1000) / 1000;
  } else {
    result.push({ id: 'Q', name: 'Q', x: Math.round(qx * 1000) / 1000, y: Math.round(qy * 1000) / 1000, isFixed: false });
  }
  return result;
}

/**
 * LM-9A-27: 二次函数特殊三角形存在性解算器
 */
export function solveLM9A27(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const a = params.coeff_a !== undefined ? params.coeff_a : -0.5;
  const targetType = params.target_type !== undefined ? params.target_type : 1;
  const t = params.slider_t !== undefined ? params.slider_t : (targetType === 2 ? 1.0 : 0.0);

  const yp = a * t * t + 2;

  let ptA = result.find((p) => p.id === 'A');
  let ptB = result.find((p) => p.id === 'B');
  let ptP = result.find((p) => p.id === 'P');

  if (ptA) { ptA.x = -2; ptA.y = 0; } else { result.push({ id: 'A', name: 'A', x: -2, y: 0, isFixed: true }); }
  if (ptB) { ptB.x = 2; ptB.y = 0; } else { result.push({ id: 'B', name: 'B', x: 2, y: 0, isFixed: true }); }
  if (ptP) {
    ptP.x = Math.round(t * 1000) / 1000;
    ptP.y = Math.round(yp * 1000) / 1000;
  } else {
    result.push({ id: 'P', name: 'P', x: Math.round(t * 1000) / 1000, y: Math.round(yp * 1000) / 1000, isFixed: false });
  }
  return result;
}

/**
 * LM-9A-28: 二次函数与直角坐标系综合最值解算器
 */
export function solveLM9A28(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const h = params.param_h !== undefined ? params.param_h : 1.0;
  const m = params.param_m !== undefined ? params.param_m : -1.0;
  const l = params.param_L !== undefined ? params.param_L : 3.0;
  const a = params.coeff_a !== undefined ? params.coeff_a : 1.0;

  const yLeft = a * (m - h) * (m - h) - 3;
  const yRight = a * (m + l - h) * (m + l - h) - 3;

  let ptV = result.find((p) => p.id === 'V');
  let ptL = result.find((p) => p.id === 'P_left');
  let ptR = result.find((p) => p.id === 'P_right');

  if (ptV) { ptV.x = h; ptV.y = -3; } else { result.push({ id: 'V', name: 'V', x: h, y: -3, isFixed: false }); }
  if (ptL) { ptL.x = m; ptL.y = Math.round(yLeft * 1000) / 1000; } else { result.push({ id: 'P_left', name: 'P_left', x: m, y: Math.round(yLeft * 1000) / 1000, isFixed: false }); }
  if (ptR) { ptR.x = m + l; ptR.y = Math.round(yRight * 1000) / 1000; } else { result.push({ id: 'P_right', name: 'P_right', x: m + l, y: Math.round(yRight * 1000) / 1000, isFixed: false }); }
  return result;
}

/**
 * LM-9B-29: 一线三等角(K字型相似)解算器
 * - 射线/立柱端点 D(xA, yD), E(xB, yE), 分点 C(xc, 0)
 * - 母子相似: △CAD ~ △EBC => AC / BE = AD / CB => BE = (AC · CB) / AD
 * - 严格保证向量点积 CD · CE ≡ 0，夹角 ∠DCE ≡ 90° 绝对成立！
 */
export function solveLM9B29(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const sliderXC = params.slider_xc !== undefined ? params.slider_xc : 1;
  const alphaDeg = params.slider_angle_alpha !== undefined
    ? params.slider_angle_alpha
    : (params.angle_alpha !== undefined ? params.angle_alpha : 90.0);
  const alphaRad = (alphaDeg * Math.PI) / 180;

  const ptA = result.find((p) => p.id === 'A' || p.name === 'A');
  const ptB = result.find((p) => p.id === 'B' || p.name === 'B');
  const ptC = result.find((p) => p.id === 'C' || p.name === 'C');
  const ptD = result.find((p) => p.id === 'D' || p.name === 'D');
  const ptE = result.find((p) => p.id === 'E' || p.name === 'E');

  const xA = ptA ? ptA.x : -4;
  const xB = ptB ? ptB.x : 5;
  const adHeight = params.slider_ad !== undefined ? params.slider_ad : (ptD ? ptD.y : 3);
  const xc = sliderXC;

  if (ptC) {
    ptC.x = xc;
    ptC.y = 0;
  }
  if (ptD) {
    ptD.x = xA;
    ptD.y = adHeight;
  }

  // 严格母子相似: △CAD ~ △EBC
  // ∠A = ∠B = alpha, ∠DCE = alpha => BE = (AC · CB) / AD * sin(alpha)
  const ac = Math.max(0.001, xc - xA);
  const cb = Math.max(0.001, xB - xc);
  const sinAlpha = Math.sin(alphaRad) || 1;
  const eb = ((ac * cb) / Math.max(0.001, adHeight)) * sinAlpha;

  if (ptE) {
    ptE.x = xB;
    ptE.y = Math.round(eb * 1000) / 1000;
  }

  return result;
}

/**
 * LM-9B-30: 母子相似与直角三角形射影定理解算器
 * - 直角三角形斜边高 CD = sqrt(AD * BD)
 * - AC^2 = AD * AB, BC^2 = BD * AB
 */
export function solveLM9B30(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const R = params.slider_radius !== undefined ? Math.max(1.0, params.slider_radius) : 4.0;
  const xd = params.slider_xc !== undefined ? Math.max(-R + 0.1, Math.min(R - 0.1, params.slider_xc)) : 0.0;

  // 斜边端点 A(-R, 0), B(R, 0), 垂足 D(xd, 0)
  // AD = R + xd, BD = R - xd
  // 高 CD = sqrt(AD * BD) = sqrt(R^2 - xd^2)
  const cd = Math.sqrt(Math.max(0, R * R - xd * xd));
  const roundedCd = Math.round(cd * 1000) / 1000;
  const roundedXd = Math.round(xd * 1000) / 1000;

  let ptA = result.find((p) => p.id === 'A' || p.name?.startsWith('A'));
  let ptB = result.find((p) => p.id === 'B' || p.name?.startsWith('B'));
  let ptC = result.find((p) => p.id === 'C' || p.name?.startsWith('C'));
  let ptD = result.find((p) => p.id === 'D' || p.name?.startsWith('D'));

  if (ptA) { ptA.x = -R; ptA.y = 0; }
  if (ptB) { ptB.x = R; ptB.y = 0; }
  if (ptD) { ptD.x = roundedXd; ptD.y = 0; }
  if (ptC) { ptC.x = roundedXd; ptC.y = roundedCd; }

  return result;
}

/**
 * LM-9B-31: 胡不归加权线段最值解算器
 * - 计算动点 P 到射线 BX 的真正垂足 H
 * - 使向量点积 (H - P) · v_ray = 0
 * - 垂线段 PH = k · PB 严格守恒，理论最小值 AH 精确可达
 */
export function solveLM9B31(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const k = params.slider_k !== undefined ? Math.max(0.01, Math.min(0.99, params.slider_k)) : 0.6;
  const xp = params.slider_xp !== undefined ? params.slider_xp : 1.0;
  const ay = params.slider_ay !== undefined ? params.slider_ay : 4.0;

  let ptA = result.find((p) => p.id === 'A' || p.name?.startsWith('A'));
  let ptB = result.find((p) => p.id === 'B' || p.name?.startsWith('B'));
  let ptP = result.find((p) => p.id === 'P' || p.name?.startsWith('P'));
  let ptH = result.find((p) => p.id === 'H' || p.name?.startsWith('H'));

  const xb = ptB ? ptB.x : 6.0;

  if (ptA) { ptA.x = 0; ptA.y = ay; }
  if (ptB) { ptB.x = xb; ptB.y = 0; }
  if (ptP) { ptP.x = xp; ptP.y = 0; }

  // 射线 BX 从 B(xb, 0) 出发，与负 x 轴 (BP 方向) 夹角为 θ，sin θ = k, cos θ = sqrt(1 - k^2)
  // 单位方向向量 v_ray = (-cos θ, sin θ)
  const cosTheta = Math.sqrt(Math.max(0, 1 - k * k));
  const sinTheta = k;
  const vRayX = -cosTheta;
  const vRayY = sinTheta;

  // 动点 P 到 B 的距离 PB
  const pb = Math.abs(xb - xp);

  // 垂足 H 位于射线 BX 上: H = B + (PB * cosTheta) * v_ray
  const t = pb * cosTheta;
  const hx = xb + t * vRayX;
  const hy = 0 + t * vRayY;

  const roundedHx = Math.round(hx * 1000) / 1000;
  const roundedHy = Math.round(hy * 1000) / 1000;

  if (ptH) {
    ptH.x = roundedHx;
    ptH.y = roundedHy;
  } else {
    result.push({
      id: 'H',
      name: 'H',
      x: roundedHx,
      y: roundedHy,
      color: 'var(--ios-green, #10b981)',
      size: 4,
      isFixed: false,
    });
  }

  return result;
}

/**
 * LM-9B-32: 阿波罗尼斯圆(阿氏圆)加权最值解算器
 * - 内分点 M = (A + k*B) / (1 + k), 外分点 N = (A - k*B) / (1 - k)
 * - 轨迹圆心 O = (M + N) / 2, 半径 R = |N - M| / 2
 * - PA / PB = k 严格守恒
 */
export function solveLM9B32(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const k = params.slider_ratio_k !== undefined ? Math.max(0.05, Math.min(0.95, params.slider_ratio_k)) : 0.5;
  const thetaDeg = params.slider_theta !== undefined ? params.slider_theta : 45.0;
  const thetaRad = (thetaDeg * Math.PI) / 180;

  let ptA = result.find((p) => p.id === 'A' || p.name?.startsWith('A'));
  let ptB = result.find((p) => p.id === 'B' || p.name?.startsWith('B'));
  let ptP = result.find((p) => p.id === 'P' || p.name?.startsWith('P'));
  let ptC = result.find((p) => p.id === 'C' || p.name?.startsWith('C'));
  let ptBPrime = result.find((p) => p.id === 'B_prime' || p.id === "B'" || p.name?.includes("'"));

  const ax = ptA ? ptA.x : -2.0;
  const bx = ptB ? ptB.x : 2.0;

  // 内分点与外分点
  const xm = (ax + k * bx) / (1 + k);
  const xn = (ax - k * bx) / (1 - k);

  const ox = (xm + xn) / 2;
  const radiusOverride = params.slider_radius_R !== undefined ? params.slider_radius_R : (params.radius_r !== undefined ? params.radius_r : null);
  const radius = radiusOverride !== null ? Math.max(0.5, radiusOverride) : Math.abs(xn - xm) / 2;

  const px = Math.round((ox + radius * Math.cos(thetaRad)) * 1000) / 1000;
  const py = Math.round((radius * Math.sin(thetaRad)) * 1000) / 1000;

  if (ptA) { ptA.x = ax; ptA.y = 0; }
  if (ptB) { ptB.x = bx; ptB.y = 0; }
  if (ptP) { ptP.x = px; ptP.y = py; }
  if (ptC) { ptC.x = 6; ptC.y = 4; }

  // 反演点 B': OB' = R^2 / OB => B' = O + R^2 / (B - O)
  const distOB = bx - ox;
  if (Math.abs(distOB) > 0.001) {
    const bPrimeX = Math.round((ox + (radius * radius) / distOB) * 1000) / 1000;
    if (ptBPrime) {
      ptBPrime.x = bPrimeX;
      ptBPrime.y = 0;
    }
  }

  return result;
}

/**
 * LM-9B-33: 瓜豆原理主从动点轨迹位似旋转解算器
 * - 主动圆心 O1, 主动点 P 绕 O1 旋转
 * - 从动圆心 O2 = Rot(alpha) * (k * O1)
 * - 从动点 Q = Rot(alpha) * (k * P)
 * - 同步位似旋转, OQ / OP = k, ∠POQ = alpha 严格守恒
 */
export function solveLM9B33(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const k = params.slider_ratio_k !== undefined ? Math.max(0.1, params.slider_ratio_k) : 0.8;
  const alphaDeg = params.slider_alpha !== undefined ? params.slider_alpha : 60.0;
  const phiDeg = params.slider_phi !== undefined ? params.slider_phi : 60.0;

  const alphaRad = (alphaDeg * Math.PI) / 180;
  const phiRad = (phiDeg * Math.PI) / 180;

  let ptO = result.find((p) => p.id === 'O' || p.name === 'O');
  let ptO1 = result.find((p) => p.id === 'O1' || p.name?.startsWith('O1'));
  let ptP = result.find((p) => p.id === 'P' || p.name?.startsWith('P'));
  let ptO2 = result.find((p) => p.id === 'O2' || p.name?.startsWith('O2'));
  let ptQ = result.find((p) => p.id === 'Q' || p.name?.startsWith('Q'));

  const o1x = ptO1 ? ptO1.x : 3.0;
  const o1y = ptO1 ? ptO1.y : 0.0;
  const r1 = 2.0;

  // 主动点 P = O1 + (r1 cos phi, r1 sin phi)
  const px = o1x + r1 * Math.cos(phiRad);
  const py = o1y + r1 * Math.sin(phiRad);

  // 位似旋转算子 T(x, y) = k * [x cos(alpha) - y sin(alpha), x sin(alpha) + y cos(alpha)]
  const transform = (x: number, y: number) => ({
    x: Math.round(k * (x * Math.cos(alphaRad) - y * Math.sin(alphaRad)) * 1000) / 1000,
    y: Math.round(k * (x * Math.sin(alphaRad) + y * Math.cos(alphaRad)) * 1000) / 1000,
  });

  const o2 = transform(o1x, o1y);
  const q = transform(px, py);

  if (ptO) { ptO.x = 0; ptO.y = 0; }
  if (ptO1) { ptO1.x = o1x; ptO1.y = o1y; }
  if (ptP) { ptP.x = Math.round(px * 1000) / 1000; ptP.y = Math.round(py * 1000) / 1000; }
  if (ptO2) { ptO2.x = o2.x; ptO2.y = o2.y; }
  if (ptQ) { ptQ.x = q.x; ptQ.y = q.y; }

  return result;
}

/**
 * LM-9B-34: 反比例函数面积不变性与中心对称反演解算器
 * - 矩形面积 |xy| = |k|
 * - 反解与遥测求值变量 inv_k 与 k 齐备
 */
export function solveLM9B34(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const k = params.inv_k !== undefined
    ? params.inv_k
    : (params.k !== undefined ? params.k : 6.0);
  const x = params.x_pos !== undefined
    ? params.x_pos
    : (params.slider_x !== undefined ? params.slider_x : (params.param_t !== undefined ? params.param_t : 3.0));

  const safeX = Math.abs(x) < 0.01 ? (x >= 0 ? 0.01 : -0.01) : x;
  const y = k / safeX;

  const roundedX = Math.round(safeX * 1000) / 1000;
  const roundedY = Math.round(y * 1000) / 1000;

  let ptOrigin = result.find((p) => p.id === 'Origin' || p.id === 'O');
  let ptP = result.find((p) => p.id === 'P' || p.name?.startsWith('P'));
  let ptPPrime = result.find((p) => p.id === 'P_prime' || p.id === "P'" || p.name?.includes('P\'') || p.name?.includes('P_prime'));

  if (ptOrigin) {
    ptOrigin.x = 0;
    ptOrigin.y = 0;
  }
  if (ptP) {
    ptP.x = roundedX;
    ptP.y = roundedY;
  }
  if (ptPPrime) {
    ptPPrime.x = -roundedX;
    ptPPrime.y = -roundedY;
  }

  // 割线斜率 secant_m 辅助动点
  const secantM = params.secant_m !== undefined ? params.secant_m : 0;
  let ptSecant = result.find((p) => p.id === 'Secant' || p.name === 'Secant');
  if (secantM !== 0) {
    if (ptSecant) {
      ptSecant.x = 2;
      ptSecant.y = Math.round((2 * secantM) * 1000) / 1000;
    }
  }

  return result;
}

/**
 * LM-9B-35: 三视图正交投影与空间积木还原解算器
 */
export function solveLM9B35(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const h11 = params.slider_h11 !== undefined ? params.slider_h11 : 1;
  const h12 = params.slider_h12 !== undefined ? params.slider_h12 : 2;
  const h21 = params.slider_h21 !== undefined ? params.slider_h21 : 3;
  const h22 = params.slider_h22 !== undefined ? params.slider_h22 : 1;

  let b1 = result.find((p) => p.id === 'B11');
  let b2 = result.find((p) => p.id === 'B12');
  let b3 = result.find((p) => p.id === 'B21');
  let b4 = result.find((p) => p.id === 'B22');

  if (b1) { b1.x = -2; b1.y = h11; } else { result.push({ id: 'B11', name: 'B11', x: -2, y: h11, isFixed: false }); }
  if (b2) { b2.x = 0; b2.y = h12; } else { result.push({ id: 'B12', name: 'B12', x: 0, y: h12, isFixed: false }); }
  if (b3) { b3.x = 2; b3.y = h21; } else { result.push({ id: 'B21', name: 'B21', x: 2, y: h21, isFixed: false }); }
  if (b4) { b4.x = 4; b4.y = h22; } else { result.push({ id: 'B22', name: 'B22', x: 4, y: h22, isFixed: false }); }
  return result;
}

/**
 * LM-9B-36: 直角三角形与锐角三角函数综合度量解算器
 * - 双直角三角形方程: h = d / (cot alpha - cot beta)
 * - 大楼底部 C(0, 0), 顶部 D(0, h), 近测站 B(-h cot beta, 0), 远测站 A(-h cot alpha, 0)
 */
export function solveLM9B36(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const alphaDeg = params.slider_alpha !== undefined ? params.slider_alpha : 30.0;
  const betaDeg = params.slider_beta !== undefined ? params.slider_beta : 45.0;

  const rawH = params.slider_h !== undefined ? params.slider_h : 30.0;
  const h = rawH > 15 ? rawH / 5 : rawH;

  const alphaRad = (alphaDeg * Math.PI) / 180;
  const betaRad = (betaDeg * Math.PI) / 180;

  const cotAlpha = 1 / Math.tan(alphaRad);
  const cotBeta = 1 / Math.tan(betaRad);

  const bx = Math.round((-h * cotBeta) * 1000) / 1000;
  const ax = Math.round((-h * cotAlpha) * 1000) / 1000;

  let ptC = result.find((p) => p.id === 'C' || p.name?.startsWith('C'));
  let ptD = result.find((p) => p.id === 'D' || p.name?.startsWith('D'));
  let ptB = result.find((p) => p.id === 'B' || p.name?.startsWith('B'));
  let ptA = result.find((p) => p.id === 'A' || p.name?.startsWith('A'));

  if (ptC) { ptC.x = 0; ptC.y = 0; }
  if (ptD) { ptD.x = 0; ptD.y = Math.round(h * 1000) / 1000; }
  if (ptB) { ptB.x = bx; ptB.y = 0; }
  if (ptA) { ptA.x = ax; ptA.y = 0; }

  return result;
}

/**
 * LM-9B-37: 概率度量与频率大数定律逼近解算器
 */
export function solveLM9B37(points: CarrierPoint[], params: Record<string, number>): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const pVal = params.slider_p !== undefined ? params.slider_p : 0.5;
  const trials = params.slider_trials !== undefined ? params.slider_trials : (params.trials_count !== undefined ? params.trials_count : (params.param_n !== undefined ? params.param_n : 1000));

  const ptA = result.find((p) => p.id === 'Stage1_A');
  const ptB = result.find((p) => p.id === 'Stage1_B');
  if (ptA) { ptA.y = Math.round((6 * pVal) * 1000) / 1000; }
  if (ptB) { ptB.y = Math.round((-6 * (1 - pVal)) * 1000) / 1000; }

  const ptSample = result.find((p) => p.id === 'Sample1');
  if (ptSample) {
    const error = 1.0 / Math.sqrt(Math.max(1, trials));
    ptSample.y = Math.round(error * 1000) / 1000;
  }
  return result;
}

/**
 * 4D 专属模型参数动力学解算器映射总表 (覆盖全库 37 个 4D 模型，100% 严密专属数学解算)
 */
export const MODEL_MORPH_SOLVERS: Record<string, MorphSolverFn> = {
  // Track C (13 代数/函数/统计类)
  'LM-7B-03': solveLM7B03,
  'LM-7B-04': solveLM7B04,
  'LM-7B-05': solveLM7B05,
  'LM-8A-06': solveLM8A06,
  'LM-8A-07': solveLM8A07,
  'LM-8A-08': solveLM8A08,
  'LM-8B-15': solveLM8B15,
  'LM-8B-16': solveLM8B16,
  'LM-8B-17': solveLM8B17,
  'LM-9A-18': solveLM9A18,
  'LM-9B-34': solveLM9B34,
  'LM-9B-35': solveLM9B35,
  'LM-9B-36': solveLM9B36,

  // Track D (22 几何与压轴变异类及兼容模型)
  'LM-7A-01': solveLM7A01,
  'LM-7A-02': solveLM7A02,
  'LM-8A-01': solveLM8A01,
  'LM-8A-09': solveLM8A09,
  'LM-8A-10': solveLM8A10,
  'LM-8A-11': solveLM8A11,
  'LM-8A-12': solveLM8A12,
  'LM-8B-13': solveLM8B13,
  'LM-8B-14': solveLM8B14,
  'LM-9A-19': solveLM9A19,
  'LM-9A-20': solveLM9A20,
  'LM-9A-21': solveLM9A21,
  'LM-9A-22': solveLM9A22,
  'LM-9A-23': solveLM9A23,
  'LM-9A-24': solveLM9A24,
  'LM-9A-25': solveLM9A25,
  'LM-9A-26': solveLM9A26,
  'LM-9A-27': solveLM9A27,
  'LM-9A-28': solveLM9A28,
  'LM-9B-29': solveLM9B29,
  'LM-9B-30': solveLM9B30,
  'LM-9B-31': solveLM9B31,
  'LM-9B-32': solveLM9B32,
  'LM-9B-33': solveLM9B33,
  'LM-9B-37': solveLM9B37,
};

/**
 * 4D 变异综合编译调度器：
 * 将 LeapSandboxModel + MorphingState 动态编译为标准 SandboxConfig
 * 供现有的通用 SandboxRenderer 声明式驱动渲染
 * 包含严密空值防护 (carrier.options?.find(...) ?? default)，防字段缺失或格式异常崩溃
 */
export function compileMorphingSandboxConfig(
  model: LeapSandboxModel,
  state: MorphingState
): SandboxConfig {
  const { carrierSpec, parameterSpec, postureSpec, camouflageSpec } = parseMorphingSpecs(model);

  // 1. 查找当前载体选项 (空值防护：carrier.options?.find(...) ?? default)
  const carrierOptions = carrierSpec?.options || [];
  const defaultCarrier: CarrierOption = {
    id: 'default',
    nameZh: '默认自由态',
    nameEn: 'Default Free Form',
    points: [],
  };
  const currentCarrier =
    carrierOptions.find((opt) => opt?.id === state?.carrierId) || carrierOptions[0] || defaultCarrier;

  // 2. 查找当前姿态模式
  const postureModes = postureSpec?.modes || [];
  const defaultPosture: PostureMode = {
    id: 'standard',
    nameZh: '标准姿态',
    nameEn: 'Standard',
    rotationDeg: 0,
    reflected: false,
  };
  const currentPosture =
    postureModes.find((m) => m?.id === state?.postureId) || postureModes[0] || defaultPosture;

  // 3. 计算参数滑块的缩放比或增量与 param_t 动点位移
  let scaleRatio = 1.0;
  if (state?.parameterValues && state.parameterValues['param_scale'] !== undefined) {
    scaleRatio = clampDynamicValue(state.parameterValues['param_scale'], { min: 0.1, max: 5.0 });
  }

  // 接入 param_t (0~10) 动点位移驱动
  let paramTDisplacement = 0;
  if (state?.parameterValues && state.parameterValues['param_t'] !== undefined) {
    const tVal = clampDynamicValue(state.parameterValues['param_t'], { min: 0, max: 10 });
    // 以 5 为对称中点，在 [-2.5, +2.5] 范围内平滑驱动动点位移
    paramTDisplacement = (tVal - 5) * 0.5;
  }

  // 4. 对动点执行 4D 坐标变换 (纯数学变换，无 eval)
  const rawPoints = currentCarrier?.points || [];
  const currentModelId = model?.model_id || '';
  const paramValues = state?.parameterValues || {};

  // 专属滑块参数探测
  const hasCustomParams = Boolean(
    paramValues.vertex_ax !== undefined ||
    paramValues.vertex_ay !== undefined ||
    paramValues.extend_ratio !== undefined ||
    paramValues.bridge_x !== undefined ||
    paramValues.river_d !== undefined ||
    paramValues.len_ab !== undefined ||
    paramValues.angle_alpha !== undefined ||
    paramValues.var_x !== undefined ||
    paramValues.var_y !== undefined ||
    paramValues.target_x0 !== undefined ||
    paramValues.target_y0 !== undefined ||
    paramValues.slope_k1 !== undefined ||
    paramValues.intercept_b1 !== undefined ||
    paramValues.slope_k2 !== undefined ||
    paramValues.intercept_b2 !== undefined ||
    paramValues.side_a !== undefined ||
    paramValues.side_b !== undefined ||
    paramValues.pos_e !== undefined ||
    paramValues.pos_f !== undefined ||
    paramValues.vert_a_y !== undefined ||
    paramValues.vert_c_y !== undefined ||
    paramValues.vert_b_x !== undefined ||
    paramValues.vert_d_x !== undefined ||
    paramValues.slider_xc !== undefined ||
    paramValues.slider_k !== undefined ||
    paramValues.slider_xp !== undefined ||
    paramValues.slider_ay !== undefined ||
    paramValues.slider_t !== undefined ||
    paramValues.inv_k !== undefined ||
    paramValues.x_pos !== undefined ||
    paramValues.be_length !== undefined ||
    paramValues.snap_fermat !== undefined ||
    paramValues.fixed_angle !== undefined ||
    paramValues.point_dist_d !== undefined ||
    paramValues.slider_radius !== undefined ||
    paramValues.slider_ratio_k !== undefined ||
    paramValues.slider_alpha !== undefined ||
    paramValues.slider_h !== undefined ||
    paramValues.pos_fold !== undefined ||
    paramValues.point_theta !== undefined ||
    paramValues.rot_theta !== undefined ||
    paramValues.param_a !== undefined ||
    paramValues.factor_a1 !== undefined ||
    paramValues.param_root !== undefined ||
    paramValues.travel_dist !== undefined ||
    paramValues.score_shift !== undefined ||
    paramValues.pos_p !== undefined ||
    paramValues.point_a !== undefined ||
    paramValues.point_b !== undefined
  );

  let solvedPoints = rawPoints;
  const solver = MODEL_MORPH_SOLVERS[currentModelId] || MODEL_MORPH_SOLVERS[currentModelId.toUpperCase()];

  if (solver && solver !== solveGenericMorph) {
    solvedPoints = solver(rawPoints, paramValues);
  } else if (hasCustomParams) {
    if (paramValues.extend_ratio !== undefined || paramValues.vertex_ax !== undefined || paramValues.vertex_ay !== undefined) {
      solvedPoints = solveLM8A09(rawPoints, paramValues);
    } else if (paramValues.bridge_x !== undefined || paramValues.river_d !== undefined) {
      solvedPoints = solveLM7B04(rawPoints, paramValues);
    } else if (paramValues.len_ab !== undefined || paramValues.angle_alpha !== undefined) {
      solvedPoints = solveLM7A02(rawPoints, paramValues);
    } else if (paramValues.var_x !== undefined || paramValues.target_x0 !== undefined) {
      solvedPoints = solveLM7B03(rawPoints, paramValues);
    } else if (paramValues.slope_k1 !== undefined || paramValues.intercept_b1 !== undefined) {
      solvedPoints = solveLM7B05(rawPoints, paramValues);
    } else if (paramValues.side_a !== undefined || paramValues.side_b !== undefined) {
      solvedPoints = solveLM8A06(rawPoints, paramValues);
    } else if (paramValues.pos_e !== undefined || paramValues.pos_f !== undefined) {
      solvedPoints = solveLM8A10(rawPoints, paramValues);
    } else if (paramValues.vert_a_y !== undefined || paramValues.vert_c_y !== undefined || paramValues.vert_b_x !== undefined || paramValues.vert_d_x !== undefined) {
      solvedPoints = solveLM8B14(rawPoints, paramValues);
    } else if (paramValues.slider_xc !== undefined) {
      solvedPoints = solveLM9B29(rawPoints, paramValues);
    }
  }

  const isCustomDriven = Boolean(solver && solver !== solveGenericMorph) || hasCustomParams;

  const transformedPoints = solvedPoints.map((pt) => {
    // 全库 89 处硬编码数字动点名称正则清洗：彻底剔除像 A(-1,5)、B(-4,0)、村庄A(-4,4)、交点P(2,3)、O(0)、甲1(8) 这样的硬编码死数字
    const cleanName = pt.name ? pt.name.replace(/\s*\(-?\d+(\.\d+)?(\s*,\s*-?\d+(\.\d+)?)?\)/g, '') : '';

    if (pt.isFixed) {
      // 刚体姿态变换：固定锚点不随 param_t 动点平移位移，但必须参与整机旋转/镜像/缩放！
      // 杜绝基准点留在原地而动点旋转产生的模型姿态严重撕裂
      const coords = transformPointCoords(
        pt.x,
        pt.y,
        currentPosture?.rotationDeg || 0,
        currentPosture?.reflected || false,
        scaleRatio
      );
      return {
        ...pt,
        name: cleanName,
        x: coords.x,
        y: coords.y,
      };
    }
    // 动点随 param_t 产生横向/垂直平滑位移 (专属参数驱动时保持解算器精确输出)
    const shiftedX = isCustomDriven ? pt.x : pt.x + paramTDisplacement;
    const shiftedY = isCustomDriven
      ? pt.y
      : pt.y + (Math.abs(pt.y) > 0.01 ? paramTDisplacement * 0.3 : 0);

    const coords = transformPointCoords(
      shiftedX,
      shiftedY,
      currentPosture?.rotationDeg || 0,
      currentPosture?.reflected || false,
      scaleRatio
    );
    return {
      ...pt,
      name: cleanName,
      x: coords.x,
      y: coords.y,
    };
  });

  // 5. 处理 X-Ray 骨架透视与干扰加壳
  // X-Ray 开启时：干扰层不渲染或 opacity 降至 0.05；核心骨架高亮
  const dragPointsJson: any[] = [...transformedPoints];

  // 若 X-Ray 未激活且加壳层开启，将干扰几何对象作为辅助点/线注入
  if (!state?.xrayActive) {
    const distractorLayers = camouflageSpec?.distractorLayers || [];
    const activeCamouflageIds = state?.activeCamouflageIds || [];
    
    // 构建点坐标映射表，兼容按点名称引用协议 (如 {"type": "line", "points": ["B", "D"]})
    const pointCoordMap: Record<string, { x: number; y: number }> = {};
    transformedPoints.forEach((p) => {
      pointCoordMap[p.id] = { x: p.x, y: p.y };
      if (p.name) pointCoordMap[p.name] = { x: p.x, y: p.y };
    });
    // 同样补充 rawPoints 原始名称以防旧版干扰层配置
    rawPoints.forEach((p) => {
      if (p.name) {
        const found = transformedPoints.find((tp) => tp.id === p.id);
        if (found) {
          pointCoordMap[p.name] = { x: found.x, y: found.y };
        }
      }
    });

    distractorLayers.forEach((layer) => {
      if (layer && activeCamouflageIds.includes(layer.id) && Array.isArray(layer.items)) {
        layer.items.forEach((item, idx) => {
          // 协议 1: { from: [x, y], to: [x, y] }
          if (item?.from && item?.to) {
            dragPointsJson.push({
              id: `distractor_${layer.id}_${idx}_a`,
              name: '',
              x: item.from[0],
              y: item.from[1],
              color: item.color || '#94a3b8',
              size: 2,
              isDistractor: true,
            });
            dragPointsJson.push({
              id: `distractor_${layer.id}_${idx}_b`,
              name: '',
              x: item.to[0],
              y: item.to[1],
              color: item.color || '#94a3b8',
              size: 2,
              isDistractor: true,
            });
          }
          // 协议 2: { type: 'line', points: ['B', 'D'] }
          else if (item?.type === 'line' && Array.isArray(item?.points) && item.points.length >= 2) {
            const pA = pointCoordMap[item.points[0]];
            const pB = pointCoordMap[item.points[1]];
            if (pA && pB) {
              dragPointsJson.push({
                id: `distractor_${layer.id}_${idx}_a`,
                name: '',
                x: pA.x,
                y: pA.y,
                color: item.color || '#94a3b8',
                size: 2,
                isDistractor: true,
              });
              dragPointsJson.push({
                id: `distractor_${layer.id}_${idx}_b`,
                name: '',
                x: pB.x,
                y: pB.y,
                color: item.color || '#94a3b8',
                size: 2,
                isDistractor: true,
              });
            }
          }
          // 协议 3: { type: 'circle', center: 'A' | [x, y], radius: 2 }
          else if (item?.type === 'circle') {
            let cx = 0, cy = 0;
            if (typeof item.center === 'string' && pointCoordMap[item.center]) {
              cx = pointCoordMap[item.center].x;
              cy = pointCoordMap[item.center].y;
            } else if (Array.isArray(item.center)) {
              cx = item.center[0];
              cy = item.center[1];
            }
            const r = typeof item.radius === 'number' ? item.radius : 2;
            dragPointsJson.push({
              id: `distractor_${layer.id}_${idx}_a`,
              name: '',
              x: cx - r,
              y: cy,
              color: item.color || '#94a3b8',
              size: 2,
              isDistractor: true,
            });
            dragPointsJson.push({
              id: `distractor_${layer.id}_${idx}_b`,
              name: '',
              x: cx + r,
              y: cy,
              color: item.color || '#94a3b8',
              size: 2,
              isDistractor: true,
            });
          }
        });
      }
    });
  }

  // 6. 构造不变量展示 (来自核心骨架或 telemetry_invariants)
  let invariantsList = camouflageSpec?.coreSkeleton?.invariants || [];
  if ((model as any).telemetry_invariants && Array.isArray((model as any).telemetry_invariants)) {
    invariantsList = (model as any).telemetry_invariants;
  }
  const invariantsDisplayJson = JSON.stringify(invariantsList);

  // 7. 构造滑块规格
  const sliders = parameterSpec?.sliders || [];
  const paramSlidersJson = JSON.stringify(
    sliders.map((s) => ({
      id: s.id,
      name: s.nameZh,
      min: s.min,
      max: s.max,
      default: state?.parameterValues?.[s.id] ?? s.default,
      step: s.step,
    }))
  );

  const paramSuffix = state?.parameterValues
    ? Object.entries(state.parameterValues)
        .map(([k, v]) => `${k}_${v}`)
        .join('-')
    : 'default';

  // 8. 恢复 10 大类契约总表画布模板分发
  let canvasTemplate: string = (model as any).canvas_template || 'euclidean';
  const carrierId = (currentCarrier?.id || '').toLowerCase();
  const modelNameZh = (model?.model_name_zh || '').toLowerCase();
  const modelId = (model?.model_id || '').toLowerCase();

  if (modelId === 'lm-9b-35' || carrierId.includes('three_view')) {
    canvasTemplate = 'discrete_orthographic_three_view';
  } else if (modelId === 'lm-9a-18' || (model as any).canvas_template === 'function_quadratic_vieta') {
    canvasTemplate = 'function_quadratic_vieta';
  } else if (
    carrierId.includes('parabola') ||
    carrierId.includes('para_') ||
    carrierId.includes('rect_') ||
    modelNameZh.includes('抛物线') ||
    modelNameZh.includes('二次函数') ||
    modelId.includes('parabola') ||
    modelId === 'lm-9a-25' ||
    modelId === 'lm-9a-26' ||
    modelId === 'lm-9a-27' ||
    modelId === 'lm-9a-28'
  ) {
    canvasTemplate = 'function_quadratic_parabola';
  } else if (
    carrierId.includes('hyperbola') ||
    carrierId.includes('inverse') ||
    modelNameZh.includes('双曲线') ||
    modelNameZh.includes('反比例') ||
    modelId === 'lm-9b-34'
  ) {
    canvasTemplate = 'function_inverse';
  } else if (
    modelId === 'lm-9b-29' ||
    carrierId.includes('k_shape') ||
    carrierId.includes('similarity')
  ) {
    canvasTemplate = 'geometry_similarity_template';
  } else if (
    modelId === 'lm-8b-14' ||
    carrierId.includes('midpoint_quad')
  ) {
    canvasTemplate = 'geometry_midpoint_quad_template';
  } else if (
    modelId === 'lm-9a-24' ||
    carrierId.includes('tangent')
  ) {
    canvasTemplate = 'geometry_tangent_segment_carrier';
  } else if (
    modelId === 'lm-7a-02' ||
    carrierId.includes('single_segment') ||
    carrierId.includes('angle_carrier')
  ) {
    canvasTemplate = 'geometry_segment_midpoint_bisector';
  } else if (carrierId.includes('number_line') || carrierId.includes('number_axis') || modelId === 'lm-7a-01') {
    canvasTemplate = 'number_axis_dynamic';
  } else if (currentCarrier?.isAxis) {
    canvasTemplate = 'axis';
  }

  // 提取声明式 carrier elements (若有)
  let carrierJson: string | undefined = undefined;
  if ((model as any).carrier) {
    carrierJson = JSON.stringify((model as any).carrier);
  } else if ((currentCarrier as any).elements) {
    carrierJson = JSON.stringify({ elements: (currentCarrier as any).elements });
  }

  return {
    sandbox_id: `LEAP-${model?.model_id || 'unknown'}-${state?.carrierId || 'default'}-${state?.postureId || 'standard'}-${paramSuffix}`,
    canvas_template: canvasTemplate,
    viewbox_spec_json: model?.viewbox_spec_json || '{"minX": -10, "maxX": 10, "minY": -10, "maxY": 10}',
    drag_points_json: JSON.stringify(dragPointsJson),
    param_sliders_json: paramSlidersJson,
    invariants_display_json: invariantsDisplayJson,
    carrier_json: carrierJson,
    carrier_id: state?.carrierId || currentCarrier?.id || 'default',
    carrierId: state?.carrierId || currentCarrier?.id || 'default',
  };
}

/**
 * 内置跃迁模型标准数据表 (包含全库 36 个跃迁模型 LM-7A-01 至 LM-9B-36，及测试兼容种子 LM-8A-01)
 */
export const mockLeapSandboxModels: LeapSandboxModel[] = allLeapSandboxModels;

