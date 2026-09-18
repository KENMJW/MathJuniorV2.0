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
  center?: [number, number];
  radius?: number;
  color?: string;
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
    carrierSpec = JSON.parse(model.carrier_morphing_json);
  } catch (e) {}

  try {
    parameterSpec = JSON.parse(model.parameter_morphing_json);
  } catch (e) {}

  try {
    postureSpec = JSON.parse(model.posture_morphing_json);
  } catch (e) {}

  try {
    camouflageSpec = JSON.parse(model.camouflage_xray_json);
  } catch (e) {}

  return { carrierSpec, parameterSpec, postureSpec, camouflageSpec };
}

/**
 * 初始变异状态工厂函数
 */
export function createDefaultMorphingState(model: LeapSandboxModel): MorphingState {
  const { carrierSpec, parameterSpec, postureSpec, camouflageSpec } = parseMorphingSpecs(model);

  const parameterValues: Record<string, number> = {};
  parameterSpec.sliders.forEach((s) => {
    parameterValues[s.id] = s.default;
  });

  return {
    carrierId: carrierSpec.default || (carrierSpec.options[0]?.id ?? 'default'),
    parameterValues,
    postureId: postureSpec.default || (postureSpec.modes[0]?.id ?? 'standard'),
    activeCamouflageIds: camouflageSpec.distractorLayers.map((d) => d.id),
    xrayActive: false,
  };
}

/**
 * 4D 变异综合编译调度器：
 * 将 LeapSandboxModel + MorphingState 动态编译为标准 SandboxConfig
 * 供现有的通用 SandboxRenderer 声明式驱动渲染
 */
export function compileMorphingSandboxConfig(
  model: LeapSandboxModel,
  state: MorphingState
): SandboxConfig {
  const { carrierSpec, parameterSpec, postureSpec, camouflageSpec } = parseMorphingSpecs(model);

  // 1. 查找当前载体选项
  const currentCarrier =
    carrierSpec.options.find((opt) => opt.id === state.carrierId) || carrierSpec.options[0];

  // 2. 查找当前姿态模式
  const currentPosture =
    postureSpec.modes.find((m) => m.id === state.postureId) ||
    postureSpec.modes[0] || { rotationDeg: 0, reflected: false };

  // 3. 计算参数滑块的缩放比或增量
  let scaleRatio = 1.0;
  if (state.parameterValues['param_scale']) {
    scaleRatio = clampDynamicValue(state.parameterValues['param_scale'], { min: 0.1, max: 5.0 });
  }

  // 4. 对动点执行 4D 坐标变换 (纯数学变换，无 eval)
  const rawPoints = currentCarrier?.points || [];
  const transformedPoints = rawPoints.map((pt) => {
    if (pt.isFixed) {
      return pt;
    }
    const coords = transformPointCoords(
      pt.x,
      pt.y,
      currentPosture.rotationDeg || 0,
      currentPosture.reflected || false,
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
  if (!state.xrayActive) {
    camouflageSpec.distractorLayers.forEach((layer) => {
      if (state.activeCamouflageIds.includes(layer.id)) {
        layer.items.forEach((item, idx) => {
          if (item.from && item.to) {
            dragPointsJson.push({
              id: `distractor_${layer.id}_${idx}_a`,
              name: '',
              x: item.from[0],
              y: item.from[1],
              color: item.color || 'var(--border-subtle)',
              size: 2,
              isDistractor: true,
            });
            dragPointsJson.push({
              id: `distractor_${layer.id}_${idx}_b`,
              name: '',
              x: item.to[0],
              y: item.to[1],
              color: item.color || 'var(--border-subtle)',
              size: 2,
              isDistractor: true,
            });
          }
        });
      }
    });
  }

  // 6. 构造不变量展示 (来自核心骨架)
  const invariantsDisplayJson = JSON.stringify(camouflageSpec.coreSkeleton.invariants || []);

  // 7. 构造滑块规格
  const paramSlidersJson = JSON.stringify(
    parameterSpec.sliders.map((s) => ({
      id: s.id,
      name: s.nameZh,
      min: s.min,
      max: s.max,
      default: state.parameterValues[s.id] ?? s.default,
      step: s.step,
    }))
  );

  return {
    sandbox_id: `LEAP-${model.model_id}-${state.carrierId}-${state.postureId}`,
    canvas_template: currentCarrier?.isAxis ? 'axis' : 'euclidean',
    viewbox_spec_json: model.viewbox_spec_json,
    drag_points_json: JSON.stringify(dragPointsJson),
    param_sliders_json: paramSlidersJson,
    invariants_display_json: invariantsDisplayJson,
  };
}

/**
 * 内置跃迁模型标准测试种子 (LM-8A-01 与 LM-9A-01)
 */
export const mockLeapSandboxModels: LeapSandboxModel[] = [
  {
    model_id: 'LM-8A-01',
    model_name_zh: '手拉手全等与勾股跃迁模型',
    model_name_en: 'Hand-in-Hand Congruence and Pythagorean Leap Model',
    unlocked_semester: '8A',
    primary_line: 'G4',
    category_id: 'geometry_transform',
    tier_level: 1,
    canonical_state_count: 3,
    kp_dependencies: ['KP-023', 'KP-024'],
    clique_id: 'C3-0023',
    model_brief_zh: '共顶等线成旋转，全等导引勾股现。开启 X-Ray 可一键隐去干扰线，聚焦共顶旋转骨架。',
    model_brief_en: 'Shared vertex induces rotation; congruence reveals Pythagorean relations. Enable X-Ray to strip clutter.',
    viewbox_spec_json: JSON.stringify({
      xMin: -10,
      xMax: 10,
      yMin: -8,
      yMax: 8,
      marginPercent: 15,
      preserveAspectRatio: true,
    }),
    carrier_morphing_json: JSON.stringify({
      options: [
        {
          id: 'free_triangle',
          nameZh: '自由三角形载体',
          nameEn: 'Free Triangle Carrier',
          points: [
            { id: 'O', name: 'O(旋转中心)', x: 0, y: 0, color: 'var(--text-primary)', size: 5, isFixed: true },
            { id: 'A', name: 'A', x: 0, y: 4, color: 'var(--ios-blue)', size: 4 },
            { id: 'B', name: 'B', x: 4, y: 0, color: 'var(--ios-green)', size: 5 },
            { id: 'C', name: 'C', x: 2.83, y: 2.83, color: 'var(--ios-orange)', size: 5 },
          ],
        },
        {
          id: 'quadrilateral',
          nameZh: '正方形载体',
          nameEn: 'Square Carrier',
          points: [
            { id: 'O', name: 'O', x: 0, y: 0, color: 'var(--text-primary)', size: 5, isFixed: true },
            { id: 'A', name: 'A', x: 0, y: 4, color: 'var(--ios-blue)', size: 4 },
            { id: 'B', name: 'B', x: 4, y: 0, color: 'var(--ios-green)', size: 5 },
            { id: 'C', name: 'C', x: 4, y: 4, color: 'var(--ios-orange)', size: 5 },
          ],
        },
        {
          id: 'coordinate_grid',
          nameZh: '直角坐标系载体',
          nameEn: 'Coordinate Carrier',
          isAxis: true,
          points: [
            { id: 'O', name: 'O(0,0)', x: 0, y: 0, color: 'var(--text-primary)', size: 5, isFixed: true },
            { id: 'A', name: 'A(0,4)', x: 0, y: 4, color: 'var(--ios-blue)', size: 4 },
            { id: 'B', name: 'B(4,0)', x: 4, y: 0, color: 'var(--ios-green)', size: 5 },
            { id: 'C', name: 'C(3,3)', x: 3, y: 3, color: 'var(--ios-orange)', size: 5 },
          ],
        },
      ],
      default: 'free_triangle',
    }),
    parameter_morphing_json: JSON.stringify({
      sliders: [
        {
          id: 'param_scale',
          nameZh: '线段相似比 k',
          nameEn: 'Scale Ratio k',
          min: 0.5,
          max: 2.0,
          default: 1.0,
          step: 0.1,
          unit: '',
        },
      ],
    }),
    posture_morphing_json: JSON.stringify({
      modes: [
        { id: 'standard', nameZh: '标准正向 (0°)', nameEn: 'Standard (0°)', rotationDeg: 0, reflected: false },
        { id: 'rotated_90', nameZh: '正交旋转 90°', nameEn: 'Rotated 90°', rotationDeg: 90, reflected: false },
        { id: 'reflected_x', nameZh: '轴对称翻折', nameEn: 'Reflection', rotationDeg: 0, reflected: true },
        { id: 'collinear_degraded', nameZh: '共线极端退化态', nameEn: 'Collinear Degraded', rotationDeg: 180, reflected: false },
      ],
      default: 'standard',
    }),
    camouflage_xray_json: JSON.stringify({
      distractorLayers: [
        {
          id: 'grid_mesh',
          nameZh: '背景密集干扰网格',
          nameEn: 'Background Grid Distractor',
          type: 'lines',
          items: [
            { from: [-6, -6], to: [6, 6], color: 'var(--border-subtle)' },
            { from: [-6, 6], to: [6, -6], color: 'var(--border-subtle)' },
          ],
        },
      ],
      coreSkeleton: {
        nameZh: '核心骨架：手拉手共顶全等对',
        nameEn: 'Core Skeleton: Shared Vertex Congruence',
        primaryElements: ['O', 'A', 'B', 'C'],
        highlightColor: 'var(--ios-blue)',
        invariants: [
          {
            id: 'inv_ang',
            type: 'angle',
            deps: ['A', 'O', 'B'],
            formula: '∠AOB = {val}°',
            labelZh: '顶角守恒',
          },
        ],
      },
    }),
  },
  {
    model_id: 'LM-9A-01',
    model_name_zh: '二次函数铅垂高与割线极值跃迁模型',
    model_name_en: 'Quadratic Plumb Height and Secant Extrema Leap Model',
    unlocked_semester: '9A',
    primary_line: 'A4',
    category_id: 'function_geometry',
    tier_level: 2,
    canonical_state_count: 4,
    kp_dependencies: ['KP-020', 'KP-040'],
    clique_id: 'C5-0088',
    model_brief_zh: '抛物线割线作铅垂，水平宽乘积半求积。X-Ray 透视一键滤除切线干扰，暴露铅垂高核心高线。',
    model_brief_en: 'Vertical plumb height maximizes triangle area on parabola secant. X-Ray removes distractors.',
    viewbox_spec_json: JSON.stringify({
      xMin: -8,
      xMax: 8,
      yMin: -6,
      yMax: 10,
      marginPercent: 15,
      preserveAspectRatio: true,
    }),
    carrier_morphing_json: JSON.stringify({
      options: [
        {
          id: 'standard_parabola',
          nameZh: '标准抛物线载体',
          nameEn: 'Standard Parabola Carrier',
          points: [
            { id: 'A', name: 'A(-1,0)', x: -1, y: 0, color: 'var(--text-primary)', size: 4, isFixed: true },
            { id: 'B', name: 'B(3,0)', x: 3, y: 0, color: 'var(--text-primary)', size: 4, isFixed: true },
            { id: 'P', name: 'P(动点)', x: 1, y: 4, color: 'var(--ios-blue)', size: 5 },
          ],
        },
        {
          id: 'axis_carrier',
          nameZh: '坐标网格载体',
          nameEn: 'Coordinate Carrier',
          isAxis: true,
          points: [
            { id: 'A', name: 'A', x: -1, y: 0, color: 'var(--text-primary)', size: 4 },
            { id: 'B', name: 'B', x: 3, y: 0, color: 'var(--text-primary)', size: 4 },
            { id: 'P', name: 'P', x: 1, y: 4, color: 'var(--ios-blue)', size: 5 },
          ],
        },
      ],
      default: 'standard_parabola',
    }),
    parameter_morphing_json: JSON.stringify({
      sliders: [
        {
          id: 'param_scale',
          nameZh: '铅垂高放大比',
          nameEn: 'Height Scale',
          min: 0.5,
          max: 2.0,
          default: 1.0,
          step: 0.1,
          unit: '',
        },
      ],
    }),
    posture_morphing_json: JSON.stringify({
      modes: [
        { id: 'standard', nameZh: '开口向下 (a < 0)', nameEn: 'Standard (a<0)', rotationDeg: 0, reflected: false },
        { id: 'reflected', nameZh: '开口向上翻折 (a > 0)', nameEn: 'Reflected (a>0)', rotationDeg: 0, reflected: true },
      ],
      default: 'standard',
    }),
    camouflage_xray_json: JSON.stringify({
      distractorLayers: [
        {
          id: 'tangent_lines',
          nameZh: '切线干扰图层',
          nameEn: 'Tangent Distractor Lines',
          type: 'lines',
          items: [{ from: [-3, 8], to: [5, 0], color: 'var(--border-subtle)' }],
        },
      ],
      coreSkeleton: {
        nameZh: '核心骨架：铅垂高线段与割线',
        nameEn: 'Core Skeleton: Plumb Height and Secant',
        primaryElements: ['A', 'B', 'P'],
        highlightColor: 'var(--ios-blue)',
        invariants: [
          {
            id: 'inv_area',
            type: 'area_triangle',
            deps: ['A', 'B', 'P'],
            formula: 'S_△PAB = {val}',
            labelZh: '割线三角形面积',
          },
        ],
      },
    }),
  },
];
