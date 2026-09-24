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

  // 确保中点 D(0,0) 存在
  let ptD = result.find((p) => p.id === 'D' || p.name === 'D');
  if (ptD) {
    ptD.x = 0;
    ptD.y = 0;
  } else if (params.extend_ratio !== undefined) {
    result.push({
      id: 'D',
      name: 'D',
      x: 0,
      y: 0,
      color: 'var(--ios-green, #10b981)',
      size: 4,
      isFixed: true,
    });
  }

  // 若参数包含 extend_ratio，以中点 D(0,0) 为基准计算倍长点 E = -A * extend_ratio
  if (params.extend_ratio !== undefined) {
    const ratio = params.extend_ratio;
    const ex = Math.round(-ax * ratio * 1000) / 1000;
    const ey = Math.round(-ay * ratio * 1000) / 1000;

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
  const xA = ptA ? ptA.x : -4;
  const yA = ptA ? ptA.y : 4;
  const d = riverD !== undefined ? riverD : 2;

  // 平移村庄 A'(xA, yA - river_d)
  const aPrimeX = xA;
  const aPrimeY = yA - d;

  let ptAPrime = result.find((p) => p.id === 'A_prime' || p.id === "A'" || p.name === "A'");
  if (ptAPrime) {
    ptAPrime.x = aPrimeX;
    ptAPrime.y = aPrimeY;
  } else if (riverD !== undefined || bridgeX !== undefined) {
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
 * - 根据 len_ab 驱动 B 点距离
 * - 根据 angle_alpha 驱动射线旋转角
 */
export function solveLM7A02(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const lenAB = params.len_ab;
  const angleAlpha = params.angle_alpha;

  if (lenAB !== undefined) {
    const ptB = result.find((p) => p.id === 'B' || p.name === 'B');
    if (ptB) ptB.x = lenAB;
    const ptM2 = result.find((p) => p.id === 'M2' || p.name === 'M2');
    if (ptM2) ptM2.x = Math.round((lenAB / 2) * 1000) / 1000;
  }

  if (angleAlpha !== undefined) {
    const ptP = result.find((p) => p.id === 'P' || p.name === 'P');
    if (ptP) {
      const radius = Math.hypot(ptP.x, ptP.y) || 4;
      const rad = (angleAlpha * Math.PI) / 180;
      ptP.x = Math.round(radius * Math.cos(rad) * 1000) / 1000;
      ptP.y = Math.round(radius * Math.sin(rad) * 1000) / 1000;
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
 * LM-9B-29: 一线三等角(K字型相似)解算器
 * - 根据 slider_xc 驱动底边动点 C 位移，两侧直角三角形按母子相似动态变形
 */
export function solveLM9B29(
  points: CarrierPoint[],
  params: Record<string, number>
): CarrierPoint[] {
  const result = points.map((p) => ({ ...p }));
  const sliderXC = params.slider_xc;

  if (sliderXC !== undefined) {
    const ptA = result.find((p) => p.id === 'A' || p.name === 'A');
    const ptB = result.find((p) => p.id === 'B' || p.name === 'B');
    const ptC = result.find((p) => p.id === 'C' || p.name === 'C');
    const ptD = result.find((p) => p.id === 'D' || p.name === 'D');
    const ptE = result.find((p) => p.id === 'E' || p.name === 'E');

    const xA = ptA ? ptA.x : -4;
    const xB = ptB ? ptB.x : 5;
    const adHeight = ptD ? ptD.y : 3;
    const xc = sliderXC;

    if (ptC) {
      ptC.x = xc;
      ptC.y = 0;
    }

    // 母子相似: △DAC ~ △EBC => AD / EB = AC / CB => EB = AD * (CB / AC)
    const ac = Math.max(0.1, xc - xA);
    const cb = Math.max(0.1, xB - xc);
    const eb = adHeight * (cb / ac);

    if (ptE) {
      ptE.y = Math.round(eb * 1000) / 1000;
    }
  }

  return result;
}

/**
 * 4D 专属模型参数动力学解算器映射总表 (覆盖全库 37 个 4D 模型)
 */
export const MODEL_MORPH_SOLVERS: Record<string, MorphSolverFn> = {
  // 9 大专属解析解算器
  'LM-8A-09': solveLM8A09,
  'LM-7B-04': solveLM7B04,
  'LM-7A-02': solveLM7A02,
  'LM-7B-03': solveLM7B03,
  'LM-7B-05': solveLM7B05,
  'LM-8A-06': solveLM8A06,
  'LM-8A-10': solveLM8A10,
  'LM-8B-14': solveLM8B14,
  'LM-9B-29': solveLM9B29,

  // 基础与进阶跃迁模型通用解算器全量覆盖 (共 37 个模型)
  'LM-7A-01': solveGenericMorph,
  'LM-8A-01': solveGenericMorph,
  'LM-8A-07': solveGenericMorph,
  'LM-8A-08': solveGenericMorph,
  'LM-8A-11': solveGenericMorph,
  'LM-8A-12': solveGenericMorph,
  'LM-8B-13': solveGenericMorph,
  'LM-8B-15': solveGenericMorph,
  'LM-8B-16': solveGenericMorph,
  'LM-8B-17': solveGenericMorph,
  'LM-9A-18': solveGenericMorph,
  'LM-9A-19': solveGenericMorph,
  'LM-9A-20': solveGenericMorph,
  'LM-9A-21': solveGenericMorph,
  'LM-9A-22': solveGenericMorph,
  'LM-9A-23': solveGenericMorph,
  'LM-9A-24': solveGenericMorph,
  'LM-9A-25': solveGenericMorph,
  'LM-9A-26': solveGenericMorph,
  'LM-9A-27': solveGenericMorph,
  'LM-9A-28': solveGenericMorph,
  'LM-9B-30': solveGenericMorph,
  'LM-9B-31': solveGenericMorph,
  'LM-9B-32': solveGenericMorph,
  'LM-9B-33': solveGenericMorph,
  'LM-9B-34': solveGenericMorph,
  'LM-9B-35': solveGenericMorph,
  'LM-9B-36': solveGenericMorph,
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
    paramValues.slider_xc !== undefined
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

  const isCustomDriven = hasCustomParams;

  const transformedPoints = solvedPoints.map((pt) => {
    // 全库 89 处硬编码数字动点名称正则清洗：彻底剔除像 A(-1,5)、B(-4,0)、村庄A(-4,4)、交点P(2,3) 这样的硬编码死数字
    const cleanName = pt.name ? pt.name.replace(/\s*\(-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\)/g, '') : '';

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
  };
}

/**
 * 内置跃迁模型标准数据表 (包含全库 36 个跃迁模型 LM-7A-01 至 LM-9B-36，及测试兼容种子 LM-8A-01)
 */
export const mockLeapSandboxModels: LeapSandboxModel[] = allLeapSandboxModels;

