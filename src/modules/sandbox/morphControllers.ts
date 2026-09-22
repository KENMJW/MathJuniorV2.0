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
  const transformedPoints = rawPoints.map((pt) => {
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
        x: coords.x,
        y: coords.y,
      };
    }
    // 动点随 param_t 产生横向/垂直平滑位移
    const shiftedX = pt.x + paramTDisplacement;
    const shiftedY = pt.y + (Math.abs(pt.y) > 0.01 ? paramTDisplacement * 0.3 : 0);

    const coords = transformPointCoords(
      shiftedX,
      shiftedY,
      currentPosture?.rotationDeg || 0,
      currentPosture?.reflected || false,
      scaleRatio
    );
    return {
      ...pt,
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

