import React, { useEffect, useRef } from 'react';
import JXGModule from 'jsxgraph';

const JXG =
  typeof window !== 'undefined' && (window as any).JXG?.JSXGraph
    ? (window as any).JXG
    : JXGModule;
import {
  parseViewboxSpec,
  calculateAdaptiveViewport,
  isValidBoundingBox,
  computeBoundingBoxFromPoints,
  BoundingBox,
} from '../../engine/sandbox/viewport';
import { formatInvariantText, Point2D } from './invariants';
import { evaluateSafeExpression } from './safeExpression';
import { DiscreteOrthographicRenderer } from './DiscreteOrthographicRenderer';

export interface SandboxConfig {
  sandbox_id: string;
  canvas_template: string; // 模板标记，比如 'euclidean' 或 'axis' 或契约 10 大类
  viewbox_spec_json?: string;
  drag_points_json: string;
  param_sliders_json?: string;
  invariants_display_json?: string;
  carrier_json?: string;
  custom_behavior_id?: string;
  inquiry_guide_zh?: string;
  inquiry_guide_en?: string;
  visual_elements_json?: string;
  inquiry_steps_json?: string;
  [key: string]: any;
}

export interface SandboxRendererProps {
  config: SandboxConfig;
  className?: string;
  style?: React.CSSProperties;
  locale?: string;
  paramValues?: Record<string, number>;
  onInvariantsChange?: (invariants: Array<{ id: string; text: string; isConstant: boolean }>) => void;
  onPointsChange?: (pointMap: Record<string, Point2D>) => void;
  onParamChange?: (patch: Record<string, number>) => void;
  xrayActive?: boolean;
}

/**
 * 概念与跃迁通用沙盒渲染引擎 (TASK-FE-0014 契约总表 10 大类全要素支持)
 *
 * 铁律规范与视觉标准：
 * 1. 纯净画布：绝不在 JSXGraph 画布内创建滑块 (board.create('slider'))，所有控制外置于底部 HTML 控制条；
 * 2. 高对比度暗色视口：背景固定为 #0f172a，轴线 #64748b，刻度文字 #cbd5e1，辅助线 #94a3b8，主图形亮天蓝 #38bdf8 / 品牌蓝 #0071e3 / 靛紫 #818cf8 / 琥珀金 #f59e0b；
 * 3. 契约驱动图元分发：支持 carrier.elements 声明式图元规格 (functiongraph, line, point, segment, circle) + condition 智能显隐；
 * 4. 10 大类数学模型特化渲染：圆图元落地、三视图正交投影、双三角形拓扑分离、特殊四边形向量闭环、连续函数实时重绘；
 * 5. 安全公式求值：零 eval / 零 Function。
 */

/**
 * 颜色安全兜底纯工具函数 (TASK-FE-0016 块 C)
 *
 * 判定规则：
 * 1. 若 color 为空/未定义，返回 defaultColor (默认为 #38bdf8 亮天蓝)；
 * 2. 若 color 为深色/暗色：包括 black, #000, #0000, #000000, #111, #111111, #222, #333, #0f172a, #1e293b, rgb(0,0,0),
 *    var(--text-primary), 以及十六进制/rgb解析亮度 (R*0.299 + G*0.587 + B*0.114) 低于 60 的深灰色；
 * 3. 遇到上述暗色时，自动防御性替换为高对比度亮色 (默认 #38bdf8，若为圆心则优先保留 #34c759)；
 * 4. 若为亮色 (如 #ffffff, #fbbf24, #f59e0b, #34c759, #38bdf8, red 等)，保持原样。
 */
export function ensureVisibleOnDark(
  color?: string | null,
  defaultColor: string = '#38bdf8'
): string {
  if (!color || typeof color !== 'string') {
    return defaultColor;
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return defaultColor;
  }

  const lower = trimmed.toLowerCase();

  // 1. 显式暗色关键字及深色视口/文本变量
  const EXPLICIT_DARK_SET = new Set([
    'black',
    '#000',
    '#0000',
    '#000000',
    '#00000000',
    '#111',
    '#111111',
    '#222',
    '#222222',
    '#333',
    '#333333',
    '#0f172a',
    '#1e293b',
    '#020617',
    'var(--text-primary)',
  ]);

  if (EXPLICIT_DARK_SET.has(lower) || lower.startsWith('var(--text-primary')) {
    return defaultColor;
  }

  // 2. rgb / rgba 格式匹配并计算加权感知亮度
  const rgbMatch = lower.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const luminance = r * 0.299 + g * 0.587 + b * 0.114;
    if (luminance < 60) {
      return defaultColor;
    }
    return trimmed;
  }

  // 3. 十六进制 (#rgb, #rgba, #rrggbb, #rrggbbaa) 感知亮度解析
  const hexMatch = lower.match(/^#([0-9a-f]{3,8})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    let r = 0;
    let g = 0;
    let b = 0;

    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    const luminance = r * 0.299 + g * 0.587 + b * 0.114;
    if (luminance < 60) {
      return defaultColor;
    }
    return trimmed;
  }

  // 4. 其他常规/亮色或预设有效色彩 (如 red, blue, #ffffff, #fbbf24 等) 保持原样
  return trimmed;
}

/**
 * 校验是否为数轴动力学与实数类模板 (支持契约 10 大类及各变体别名)
 */
export const isNumberAxisTemplate = (tpl: string = ''): boolean => {
  return (
    tpl.startsWith('number_axis') ||
    tpl.includes('number_line') ||
    tpl === 'axis' ||
    tpl === 'number_axis_dynamic'
  );
};

/**
 * 识别能够明确反解参数的模型与主控动点 (TASK-FE-0016 块 A)
 * 严格遵循保守原则：对无法明确反解参数的 (如二次函数抛物线顶点)，返回 false，保持 fixed: true
 */
export function canInvertParam(
  tpl: string,
  ptDef: any,
  isCircleTemplate: boolean,
  config?: SandboxConfig
): boolean {
  if (!ptDef || ptDef.isFixed || ptDef.isDistractor) return false;
  const id = ptDef.id;
  const name = ptDef.name || '';
  const sid = config?.sandbox_id || '';
  if (id === 'O' || id === 'Origin') return false;

  // 保守原则 1：二次函数/抛物线/韦达模型，顶点与交点由 a/b/c 共同决定，严禁随意反解造成参数矛盾
  if (tpl.includes('quadratic') || tpl.includes('parabola') || tpl.includes('vieta')) {
    return false;
  }

  // 保守原则 2：反比例函数/双曲线模型，双支及渐近线保持固定
  if (tpl.includes('inverse') || tpl.includes('hyperbola')) {
    return false;
  }

  // 保守原则 3：三视图正交投影，离散积木模型不适用连续拖拽反解
  if (tpl.includes('discrete_orthographic') || tpl.includes('three_view')) {
    return false;
  }

  // 保守原则 4：中点四边形衍生中点，由顶点衍生，不可直接反解
  if (id?.startsWith('M') && tpl.includes('midpoint')) {
    return false;
  }

  // 切线长模型 (SB-KP072 / tangent_segment): 动点 P 是圆外点，反解 dist_OP 与 phi_P
  if (tpl.includes('tangent') || sid === 'SB-KP072' || (config?.sandbox_id && config.sandbox_id.includes('KP072'))) {
    if (id === 'P' || name === 'P' || name.includes('P')) {
      return true;
    }
    return false;
  }

  // 三角形内切圆模型 (SB-KP076 / incircle): 内心 I 与切点 D 是几何从动点，不可直接反解
  if (tpl.includes('incircle') || sid === 'SB-KP076' || (config?.sandbox_id && config.sandbox_id.includes('KP076'))) {
    if (id === 'I' || id === 'D') return false;
    if (id === 'A' || id === 'C') return true;
    return false;
  }

  // 场景 1：圆模型 (isCircleTemplate 或包含 circle/inscribed/chord 等)
  // 圆周上的动点 A/B/C 可反解半径
  if (isCircleTemplate || tpl.includes('circle')) {
    return true;
  }

  // 场景 2：直角三角形 / 勾股定理模型
  // 顶点 B 反解直角边 leg_a / a，顶点 A 反解直角边 leg_b / b，动点 M 反解 point_t
  if (
    tpl.includes('right_triangle') ||
    tpl.includes('pythagorean') ||
    (config?.sandbox_id && config.sandbox_id.includes('PYTHAGOREAN'))
  ) {
    if (id === 'B' || name === 'B' || id === 'A' || name === 'A' || id === 'M' || name === 'M') {
      return true;
    }
  }

  // 场景 2b：等腰三角形模型，底边端点 C 反解 base_w
  if (tpl.includes('isosceles')) {
    if (id === 'C' || name === 'C') {
      return true;
    }
  }

  // 场景 3：数轴模型
  // 动点 P 反解 pos_p / x_p / param_t，动点 A/B 反解区间端点
  if (
    tpl.startsWith('number_axis') ||
    tpl.includes('number_line') ||
    tpl === 'axis' ||
    tpl === 'number_axis_dynamic' ||
    config?.sandbox_id?.includes('LM-7A-01')
  ) {
    if (id === 'P' || name.includes('P') || id === 'A' || id === 'B') {
      return true;
    }
  }

  // 场景 3b：LM-7A-02 线段双中点与角平分线和差模型
  if (
    tpl === 'geometry_segment_midpoint_bisector' ||
    (config?.sandbox_id && config.sandbox_id.includes('LM-7A-02'))
  ) {
    if (id === 'P' || name === 'P' || name.includes('P') || id === 'C' || name === 'C' || name.includes('C')) {
      return true;
    }
  }

  // 场景 4：动点 t 参数模型
  // 具有明确 param_t 的模型，且属于动点 (非锚点)
  if (id === 'P' || name.includes('动点') || id === 'M1' || id === 'M2') {
    return true;
  }

  // 场景 5：垂线段最短模型 (SB-KP047)
  if (tpl.includes('perpendicular')) {
    if (id === 'P' || name.includes('P') || id === 'C' || name.includes('C')) {
      return true;
    }
  }

  // 场景 6：函数模型动点 P (SB-KP032, SB-KP036, SB-KP037)
  if (tpl.includes('direct') || tpl.includes('linear') || tpl.includes('inverse')) {
    if (id === 'p1' || id === 'P' || id === 'p' || name.includes('P')) {
      return true;
    }
  }

  return false;
}

/**
 * 在拖动事件中反解对应参数并触发 onParamChange (TASK-FE-0016 块 A)
 */
export function handleParamInversion(
  tpl: string,
  ptDef: any,
  pt: any,
  isCircleTemplate: boolean,
  paramValues: Record<string, number>,
  allPoints: any[],
  elements: Record<string, any>,
  board: any,
  onParamChange: (patch: Record<string, number>) => void,
  config?: SandboxConfig
) {
  const patch: Record<string, number> = {};
  const id = ptDef.id;
  const name = ptDef.name || '';
  const sid = config?.sandbox_id || '';

  // 0a. 切线长模型 (SB-KP072 / tangent_segment): 动点 P 反解切线端点距与偏转角，绝不反解半径
  if (
    tpl.includes('tangent') ||
    sid === 'SB-KP072' ||
    (config?.sandbox_id && config.sandbox_id.includes('KP072'))
  ) {
    if (id === 'P' || name === 'P' || name.includes('P')) {
      const cr = Number(paramValues['circle_r'] ?? 3);
      const curDist = Math.hypot(pt.X(), pt.Y());
      const safeDist = Math.max(cr + 0.5, Math.round(curDist * 10) / 10);
      let deg = Math.round((Math.atan2(pt.Y(), pt.X()) * 180) / Math.PI);
      if (deg < 0) deg += 360;
      patch['dist_OP'] = safeDist;
      patch['phi_P'] = deg;
      onParamChange(patch);
      return;
    }
  }

  // 0b. 三角形内切圆模型 (SB-KP076 / incircle): 顶点 A 反解 vertex_A_y，顶点 C 反解 vertex_C_x
  if (
    tpl.includes('incircle') ||
    sid === 'SB-KP076' ||
    (config?.sandbox_id && config.sandbox_id.includes('KP076'))
  ) {
    if (id === 'A' || name === 'A') {
      patch['vertex_A_y'] = Math.max(2, Math.round(Math.abs(pt.Y()) * 10) / 10);
      onParamChange(patch);
      return;
    }
    if (id === 'C' || name === 'C') {
      patch['vertex_C_x'] = Math.max(1, Math.round(pt.X() * 10) / 10);
      onParamChange(patch);
      return;
    }
  }

  // 1. 圆模型：计算 Math.hypot(pt.X() - centerX, pt.Y() - centerY) 反解 r / radius_r / circle_r
  if (isCircleTemplate || tpl.includes('circle')) {
    const centerDef = allPoints.find((p) => p.id === 'O' || p.id === 'Origin') || { x: 0, y: 0 };
    const cx = centerDef.x ?? 0;
    const cy = centerDef.y ?? 0;
    const dist = Math.hypot(pt.X() - cx, pt.Y() - cy);
    const newR = Math.max(0.5, Math.round(dist * 10) / 10);

    const rKey =
      paramValues['radius_r'] !== undefined
        ? 'radius_r'
        : paramValues['r'] !== undefined
        ? 'r'
        : paramValues['circle_r'] !== undefined
        ? 'circle_r'
        : paramValues['circle_r1'] !== undefined
        ? 'circle_r1'
        : 'r';

    patch[rKey] = newR;

    // 实时更新已创建的圆图元半径，提供零延迟视觉反馈
    Object.keys(elements).forEach((k) => {
      const el = elements[k];
      if (el && el.elType === 'circle' && typeof el.setRadius === 'function') {
        el.setRadius(newR);
      }
    });
    if (board && typeof board.update === 'function') {
      board.update();
    }

    onParamChange(patch);
    return;
  }

  // 2. 直角三角形：根据 B 点坐标反解直角边 leg_a / a，根据 A 点反解 leg_b / b，根据 M 点反解 point_t
  if (
    tpl.includes('right_triangle') ||
    tpl.includes('pythagorean') ||
    (config?.sandbox_id && config.sandbox_id.includes('PYTHAGOREAN'))
  ) {
    if (id === 'B' || name === 'B') {
      const legA = Math.max(0.5, Math.round(Math.abs(pt.X()) * 10) / 10);
      const keyA =
        paramValues['leg_a'] !== undefined
          ? 'leg_a'
          : paramValues['a'] !== undefined
          ? 'a'
          : 'leg_a';
      patch[keyA] = legA;
      onParamChange(patch);
      return;
    }
    if (id === 'A' || name === 'A') {
      const legB = Math.max(0.5, Math.round(Math.abs(pt.Y()) * 10) / 10);
      const keyB =
        paramValues['leg_b'] !== undefined
          ? 'leg_b'
          : paramValues['b'] !== undefined
          ? 'b'
          : 'leg_b';
      patch[keyB] = legB;
      onParamChange(patch);
      return;
    }
    if (id === 'M' || name === 'M') {
      const legA = Number(paramValues['leg_a'] ?? 6);
      if (legA > 0.1) {
        const ratio = Math.max(0, Math.min(1, pt.X() / legA));
        patch['point_t'] = Math.round(ratio * 20) / 20;
        onParamChange(patch);
        return;
      }
    }
  }

  // 2b. 等腰三角形：根据 C 点坐标反解底边宽度 base_w
  if (tpl.includes('isosceles')) {
    if (id === 'C' || name === 'C') {
      const w = Math.max(2, Math.min(10, Math.round(Math.abs(pt.X()) * 2 * 10) / 10));
      patch['base_w'] = w;
      onParamChange(patch);
      return;
    }
  }

  // 3. 数轴模型：根据动点 P 的 X 坐标反解 pos_p / x_p / param_t
  if (
    tpl.startsWith('number_axis') ||
    tpl.includes('number_line') ||
    tpl === 'axis' ||
    tpl === 'number_axis_dynamic' ||
    config?.sandbox_id?.includes('LM-7A-01')
  ) {
    if (id === 'P' || name.includes('P')) {
      const curX = pt.X();
      // 保证吸附于数轴 y = 0
      if (typeof pt.setPosition === 'function' && Math.abs(pt.Y()) > 1e-4) {
        const coordsMode =
          typeof window !== 'undefined' && (window as any).JXG?.COORDS_BY_USER !== undefined
            ? (window as any).JXG.COORDS_BY_USER
            : typeof JXG?.COORDS_BY_USER !== 'undefined'
            ? JXG.COORDS_BY_USER
            : 1;
        pt.setPosition(coordsMode, [curX, 0]);
      }

      if (paramValues['p_num'] !== undefined) {
        const q = Number(paramValues['q_den'] ?? 1);
        const u = Number(paramValues['unit_scale'] ?? 1);
        const newP = Math.round((curX / u) * q);
        patch['p_num'] = Math.max(-10, Math.min(10, newP));
      } else if (paramValues['pos_p'] !== undefined) {
        patch['pos_p'] = Math.round(curX * 10) / 10;
      } else if (paramValues['x_p'] !== undefined) {
        patch['x_p'] = Math.round(curX * 10) / 10;
      } else if (paramValues['point_x'] !== undefined) {
        patch['point_x'] = Math.round(curX * 10) / 10;
      } else if (paramValues['pt_x'] !== undefined) {
        patch['pt_x'] = Math.round(curX * 10) / 10;
      } else if (paramValues['val'] !== undefined) {
        patch['val'] = Math.round(curX * 10) / 10;
      } else if (paramValues['param_t'] !== undefined) {
        const x0 = Number(paramValues['param_x0'] ?? 0);
        const v = Number(paramValues['param_v'] ?? 1);
        const tVal = v !== 0 ? (curX - x0) / v : curX;
        patch['param_t'] = Math.max(0, Math.min(10, Math.round(tVal * 10) / 10));
      } else {
        patch['pos_p'] = Math.round(curX * 10) / 10;
      }
      onParamChange(patch);
      return;
    }

    if (id === 'A') {
      const key =
        paramValues['point_a'] !== undefined
          ? 'point_a'
          : paramValues['interval_a'] !== undefined
          ? 'interval_a'
          : null;
      if (key) {
        patch[key] = Math.round(pt.X() * 10) / 10;
        onParamChange(patch);
        return;
      }
    }

    if (id === 'B') {
      const key =
        paramValues['point_b'] !== undefined
          ? 'point_b'
          : paramValues['interval_b'] !== undefined
          ? 'interval_b'
          : null;
      if (key) {
        patch[key] = Math.round(pt.X() * 10) / 10;
        onParamChange(patch);
        return;
      }
    }
  }

  // 3b. LM-7A-02 线段双中点与角平分线和差模型:
  if (
    tpl === 'geometry_segment_midpoint_bisector' ||
    (config?.sandbox_id && config.sandbox_id.includes('LM-7A-02'))
  ) {
    if (id === 'P' || name === 'P' || name.includes('P')) {
      const lenAB = Number(paramValues['len_ab'] ?? 8.0);
      const halfLen = lenAB / 2;
      const safeMin = -halfLen + 0.2;
      const safeMax = halfLen - 0.2;
      const clampedX = Math.max(safeMin, Math.min(safeMax, Math.round(pt.X() * 10) / 10));
      patch['pos_p'] = clampedX;
      onParamChange(patch);
      return;
    }
    if (id === 'C' || name === 'C' || name.includes('C')) {
      let deg = Math.round((Math.atan2(pt.Y(), pt.X()) * 180) / Math.PI);
      if (deg < 0) deg += 360;
      const safeDeg = Math.max(10, Math.min(170, deg));
      patch['angle_alpha'] = safeDeg;
      onParamChange(patch);
      return;
    }
  }

  // 4. 动点 t：根据点在固定线段上的比例反解 param_t
  if (paramValues['param_t'] !== undefined) {
    const fixedPts = allPoints.filter((p) => p.isFixed && p.id !== 'O' && p.id !== 'Origin');
    let tVal: number;
    if (fixedPts.length >= 2) {
      const p1 = fixedPts[0];
      const p2 = fixedPts[1];
      const segDx = p2.x - p1.x;
      const segDy = p2.y - p1.y;
      const lenSq = segDx * segDx + segDy * segDy;
      if (lenSq > 1e-6) {
        const proj = ((pt.X() - p1.x) * segDx + (pt.Y() - p1.y) * segDy) / lenSq;
        const ratio = Math.max(0, Math.min(1, proj));
        tVal = ratio * 10;
      } else {
        tVal = 5;
      }
    } else {
      const baseX = ptDef.x ?? 0;
      tVal = 5 + (pt.X() - baseX) * 2;
    }

    patch['param_t'] = Math.max(0, Math.min(10, Math.round(tVal * 10) / 10));
    onParamChange(patch);
    return;
  }

  // 5. 垂线段最短模型 (SB-KP047)
  if (tpl.includes('perpendicular')) {
    if (id === 'P' || name.includes('P')) {
      patch['param_y_p'] = Math.max(1, Math.min(10, Math.round(pt.Y() * 10) / 10));
      onParamChange(patch);
      return;
    }
    if (id === 'C' || name.includes('C')) {
      patch['param_x_c'] = Math.round(pt.X() * 10) / 10;
      onParamChange(patch);
      return;
    }
  }

  // 6. 函数模型动点 P 反解 (SB-KP032, SB-KP036, SB-KP037)
  if (tpl.includes('direct') || tpl.includes('linear')) {
    if (id === 'p1' || id === 'P' || name.includes('P')) {
      patch['x_pos'] = Math.round(pt.X() * 10) / 10;
      onParamChange(patch);
      return;
    }
  }
  if (tpl.includes('inverse')) {
    if (id === 'p1' || id === 'P' || id === 'p' || name.includes('P')) {
      const xVal = Math.round(pt.X() * 10) / 10;
      if (Math.abs(xVal) > 0.2) {
        if (paramValues['x_pos'] !== undefined) patch['x_pos'] = xVal;
        if (paramValues['x_pt'] !== undefined) patch['x_pt'] = xVal;
        onParamChange(patch);
        return;
      }
    }
  }
}

export interface KinematicPointResult {
  x: number;
  y: number;
  constraints?: string;
  isFixed?: boolean;
}

/**
 * 46 概念沙盒 31 个模型几何动力学映射引擎
 * 支持旋转、缩放、动点、轴对称、相变全量滑块解算
 */
export function applyGeometricKinematics(
  config: SandboxConfig,
  ptDef: any,
  paramValues: Record<string, number> = {}
): KinematicPointResult {
  const tpl = config.canvas_template || '';
  const sid = config.sandbox_id || '';
  let x = ptDef.x ?? 0;
  let y = ptDef.y ?? 0;
  let constraints = ptDef.constraints;
  let isFixed = ptDef.isFixed;

  // 1. SB-KP057: 勾股定理与赵爽弦图
  if (sid === 'SB-KP057' || tpl === 'geometry_pythagorean_template') {
    const legA = Number(paramValues['leg_a'] ?? 4);
    const legB = Number(paramValues['leg_b'] ?? 3);
    const viewMode = Number(paramValues['view_mode'] ?? 1);
    if (viewMode === 2) {
      if (ptDef.id === 'C') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
      else if (ptDef.id === 'B') { x = legB; y = 0; constraints = 'fixed'; isFixed = true; }
      else if (ptDef.id === 'A') { x = legB; y = legA; constraints = 'fixed'; isFixed = true; }
    } else {
      if (ptDef.id === 'C' || ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
      else if (ptDef.id === 'B') { x = legA; y = 0; constraints = 'fixed'; isFixed = false; }
      else if (ptDef.id === 'A') { x = 0; y = legB; constraints = 'fixed'; isFixed = false; }
    }
    return { x, y, constraints, isFixed };
  }

  // 2. SB-KP053: 等腰三角形对称折叠与顶角
  if (sid === 'SB-KP053' || tpl.includes('isosceles')) {
    const baseW = Number(paramValues['base_w'] ?? 6);
    const apexAngle = Number(paramValues['apex_angle'] ?? 60);
    const halfW = baseW / 2;
    const rad = ((apexAngle / 2) * Math.PI) / 180;
    const h = rad > 0.01 && rad < Math.PI / 2 ? halfW / Math.tan(rad) : 4;
    if (ptDef.id === 'A') { x = 0; y = h; constraints = 'fixed'; isFixed = false; }
    else if (ptDef.id === 'B') { x = -halfW; y = 0; constraints = 'fixed'; isFixed = false; }
    else if (ptDef.id === 'C') { x = halfW; y = 0; constraints = 'fixed'; isFixed = false; }
    else if (ptDef.id === 'D') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    return { x, y, constraints, isFixed };
  }

  // 3. SB-KP055: 等边三角形旋转与四心双圆
  if (sid === 'SB-KP055' || tpl.includes('equilateral')) {
    const sideA = Number(paramValues['side_a'] ?? 6);
    const rotTheta = Number(paramValues['rot_theta'] ?? 0);
    const R = sideA / Math.sqrt(3);
    const thetaRad = (rotTheta * Math.PI) / 180;
    if (ptDef.id === 'A') {
      x = R * Math.cos(Math.PI / 2 + thetaRad);
      y = R * Math.sin(Math.PI / 2 + thetaRad);
      constraints = 'fixed';
    } else if (ptDef.id === 'B') {
      x = R * Math.cos((7 * Math.PI) / 6 + thetaRad);
      y = R * Math.sin((7 * Math.PI) / 6 + thetaRad);
      constraints = 'fixed';
    } else if (ptDef.id === 'C') {
      x = R * Math.cos((11 * Math.PI) / 6 + thetaRad);
      y = R * Math.sin((11 * Math.PI) / 6 + thetaRad);
      constraints = 'fixed';
    } else if (ptDef.id === 'O') {
      x = 0; y = 0; constraints = 'fixed'; isFixed = true;
    }
    return { x, y, constraints, isFixed };
  }

  // 4. SB-KP068: 中点四边形相变与对角线
  if (sid === 'SB-KP068' || tpl.includes('midpoint_quad')) {
    const preset = Number(paramValues['quad_morph_preset'] ?? 1);
    let pA = { x: -4, y: -2 };
    let pB = { x: 3, y: -3 };
    let pC = { x: 4, y: 3 };
    let pD = { x: -2, y: 4 };

    if (preset === 2) {
      pA = { x: -4, y: -1 };
      pB = { x: -1, y: -4 };
      pC = { x: 4, y: 1 };
      pD = { x: 1, y: 4 };
    } else if (preset === 3) {
      pA = { x: -5, y: 0 };
      pB = { x: 0, y: -2.5 };
      pC = { x: 3, y: 0 };
      pD = { x: 0, y: 3.5 };
    } else if (preset === 4) {
      pA = { x: -5, y: 0 };
      pB = { x: 0, y: -3 };
      pC = { x: 3, y: 0 };
      pD = { x: 0, y: 5 };
    }

    if (ptDef.id === 'p_A' || ptDef.id === 'A') { x = pA.x; y = pA.y; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B' || ptDef.id === 'B') { x = pB.x; y = pB.y; constraints = 'fixed'; }
    else if (ptDef.id === 'p_C' || ptDef.id === 'C') { x = pC.x; y = pC.y; constraints = 'fixed'; }
    else if (ptDef.id === 'p_D' || ptDef.id === 'D') { x = pD.x; y = pD.y; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 5. SB-KP056: 直角三角形斜边动点
  if (sid === 'SB-KP056' || (tpl.includes('right_triangle') && paramValues['point_t'] !== undefined)) {
    const legA = Number(paramValues['leg_a'] ?? 6);
    const legB = Number(paramValues['leg_b'] ?? 4);
    const pointT = Number(paramValues['point_t'] ?? 0.5);
    if (ptDef.id === 'C') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'A') { x = 0; y = legB; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = legA; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'M') {
      x = pointT * legA;
      y = (1 - pointT) * legB;
      constraints = 'fixed';
    }
    return { x, y, constraints, isFixed };
  }

  // 6. SB-KP058: 相似三角形与姿态旋转
  if (sid === 'SB-KP058' || tpl.includes('similarity')) {
    const simK = Number(paramValues['sim_k'] ?? 1.5);
    const rotAlpha = Number(paramValues['rot_alpha'] ?? 0);
    const alphaRad = (rotAlpha * Math.PI) / 180;
    if (ptDef.id === 'A1') { x = 0; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'B1') {
      const vx = 3 * simK;
      x = vx * Math.cos(alphaRad);
      y = vx * Math.sin(alphaRad);
      constraints = 'fixed';
    } else if (ptDef.id === 'C1') {
      const cx0 = 1 * simK;
      const cy0 = 2.5 * simK;
      x = cx0 * Math.cos(alphaRad) - cy0 * Math.sin(alphaRad);
      y = cx0 * Math.sin(alphaRad) + cy0 * Math.cos(alphaRad);
      constraints = 'fixed';
    }
    return { x, y, constraints, isFixed };
  }

  // 7. SB-KP065: 菱形面积与四边闭合 (严格对角线互相垂直平分，四边恒等长)
  if (sid === 'SB-KP065' || tpl.includes('rhombus')) {
    const diagH = Number(paramValues['diag_h'] ?? 6);
    const diagV = Number(paramValues['diag_v'] ?? 4);
    if (ptDef.id === 'p_O' || ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'p_A' || ptDef.id === 'A') { x = -diagH / 2; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B' || ptDef.id === 'B') { x = 0; y = -diagV / 2; constraints = 'fixed'; }
    else if (ptDef.id === 'p_C' || ptDef.id === 'C') { x = diagH / 2; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_D' || ptDef.id === 'D') { x = 0; y = diagV / 2; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 8. SB-KP066: 正方形旋转与边长
  if (sid === 'SB-KP066' || tpl.includes('square')) {
    const sideA = Number(paramValues['side_a'] ?? 4);
    const rotAngle = Number(paramValues['rot_angle'] ?? 0);
    const theta = (rotAngle * Math.PI) / 180;
    const s = sideA / 2;
    const rot = (cx: number, cy: number) => ({
      x: cx * Math.cos(theta) - cy * Math.sin(theta),
      y: cx * Math.sin(theta) + cy * Math.cos(theta),
    });
    if (ptDef.id === 'p_A') { const p = rot(-s, -s); x = p.x; y = p.y; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B') { const p = rot(s, -s); x = p.x; y = p.y; constraints = 'fixed'; }
    else if (ptDef.id === 'p_C') { const p = rot(s, s); x = p.x; y = p.y; constraints = 'fixed'; }
    else if (ptDef.id === 'p_D') { const p = rot(-s, s); x = p.x; y = p.y; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 9. SB-KP069: 圆与动点
  if (sid === 'SB-KP069') {
    const r = Number(paramValues['radius_r'] ?? 4);
    const thetaP = (Number(paramValues['theta_P'] ?? 45) * Math.PI) / 180;
    if (ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'A') { x = r; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'P') { x = r * Math.cos(thetaP); y = r * Math.sin(thetaP); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 10. SB-KP071: 直线与圆
  if (sid === 'SB-KP071') {
    const d = Number(paramValues['line_dist_d'] ?? 3);
    if (ptDef.id === 'H') { x = 0; y = d; constraints = 'fixed'; }
    else if (ptDef.id === 'P1') { x = -5; y = d; constraints = 'fixed'; }
    else if (ptDef.id === 'P2') { x = 5; y = d; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 11. SB-KP072: 切线长
  if (sid === 'SB-KP072' || tpl.includes('tangent_segment')) {
    const cr = Number(paramValues['circle_r'] ?? 3);
    const d = Number(paramValues['dist_OP'] ?? 6);
    const phi = (Number(paramValues['phi_P'] ?? 0) * Math.PI) / 180;
    const safeD = Math.max(cr + 0.05, d);
    const alpha = Math.acos(Math.min(1, cr / safeD));
    if (ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'P') { x = safeD * Math.cos(phi); y = safeD * Math.sin(phi); constraints = 'fixed'; }
    else if (ptDef.id === 'A') { x = cr * Math.cos(phi + alpha); y = cr * Math.sin(phi + alpha); constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = cr * Math.cos(phi - alpha); y = cr * Math.sin(phi - alpha); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 12. SB-KP073: 圆周角
  if (sid === 'SB-KP073' || tpl.includes('inscribed')) {
    const cr = Number(paramValues['radius_r'] ?? 4);
    const thetaC = (Number(paramValues['theta_C'] ?? 90) * Math.PI) / 180;
    const arcSpan = (Number(paramValues['arc_span'] ?? 80) * Math.PI) / 180;
    const tA = (3 * Math.PI) / 2 - arcSpan / 2;
    const tB = (3 * Math.PI) / 2 + arcSpan / 2;
    if (ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'A') { x = cr * Math.cos(tA); y = cr * Math.sin(tA); constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = cr * Math.cos(tB); y = cr * Math.sin(tB); constraints = 'fixed'; }
    else if (ptDef.id === 'C') { x = cr * Math.cos(thetaC); y = cr * Math.sin(thetaC); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 13. SB-KP074: 垂径定理
  if (sid === 'SB-KP074' || tpl.includes('chord_bisector')) {
    const cr = Number(paramValues['circle_r'] ?? 5);
    const d = Number(paramValues['chord_dist_d'] ?? 1);
    const halfChord = Math.sqrt(Math.max(0, cr * cr - d * d));
    if (ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'M') { x = 0; y = d; constraints = 'fixed'; }
    else if (ptDef.id === 'A') { x = -halfChord; y = d; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = halfChord; y = d; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 14. SB-KP076: 三角形内切圆
  if (sid === 'SB-KP076' || tpl.includes('incircle')) {
    const ay = Number(paramValues['vertex_A_y'] ?? 5);
    const cx = Number(paramValues['vertex_C_x'] ?? 4);
    const aSide = cx + 4;
    const bSide = Math.hypot(cx, ay);
    const cSide = Math.hypot(4, ay);
    const pPerim = aSide + bSide + cSide;
    const ix = (aSide * 0 + bSide * (-4) + cSide * cx) / pPerim;
    const iy = (aSide * ay + bSide * 0 + cSide * 0) / pPerim;
    if (ptDef.id === 'B') { x = -4; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'C') { x = cx; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'A') { x = 0; y = ay; constraints = 'fixed'; }
    else if (ptDef.id === 'I') { x = ix; y = iy; constraints = 'fixed'; }
    else if (ptDef.id === 'D') { x = ix; y = 0; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 15. SB-KP077: 扇形度量
  if (sid === 'SB-KP077' || tpl.includes('sector_metric')) {
    const cr = Number(paramValues['radius_r'] ?? 4);
    const n = (Number(paramValues['angle_n'] ?? 60) * Math.PI) / 180;
    if (ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'A') { x = cr; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = cr * Math.cos(n); y = cr * Math.sin(n); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 16. SB-KP079: 轴对称变换与倾斜轴
  if (sid === 'SB-KP079' || tpl.includes('reflection')) {
    const x0 = Number(paramValues['axis_pos'] ?? 0);
    const phi = (Number(paramValues['axis_phi'] ?? 15) * Math.PI) / 180;
    const reflect = (px: number, py: number) => {
      const normalX = -Math.sin(phi);
      const normalY = Math.cos(phi);
      const dist = (px - x0) * normalX + py * normalY;
      return {
        x: px - 2 * dist * normalX,
        y: py - 2 * dist * normalY,
      };
    };
    if (ptDef.id === 'A') { x = -4; y = 3; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = -2; y = -1; constraints = 'fixed'; }
    else if (ptDef.id === 'A_prime') { const r = reflect(-4, 3); x = r.x; y = r.y; constraints = 'fixed'; }
    else if (ptDef.id === 'B_prime') { const r = reflect(-2, -1); x = r.x; y = r.y; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 17. SB-KP080: 平移
  if (sid === 'SB-KP080' || tpl.includes('translation_carrier')) {
    const dx = Number(paramValues['dx'] ?? 0);
    const dy = Number(paramValues['dy'] ?? 0);
    if (ptDef.id === 'A') { x = -3; y = 1; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = -1; y = -2; constraints = 'fixed'; }
    else if (ptDef.id === 'A_prime') { x = -3 + dx; y = 1 + dy; constraints = 'fixed'; }
    else if (ptDef.id === 'B_prime') { x = -1 + dx; y = -2 + dy; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 18. SB-KP081: 手拉手模型
  if (sid === 'SB-KP081' || tpl.includes('rotation_hand_in_hand')) {
    const theta = (Number(paramValues['theta'] ?? 0) * Math.PI) / 180;
    const sideBy = Number(paramValues['side_B_y'] ?? 4);
    if (ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'A') { x = 3; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = 0; y = sideBy; constraints = 'fixed'; }
    else if (ptDef.id === 'A_prime') {
      x = 3 * Math.cos(theta);
      y = 3 * Math.sin(theta);
      constraints = 'fixed';
    } else if (ptDef.id === 'B_prime') {
      x = -sideBy * Math.sin(theta);
      y = sideBy * Math.cos(theta);
      constraints = 'fixed';
    }
    return { x, y, constraints, isFixed };
  }

  // 19. SB-KP082: 中心对称旋转过程
  if (sid === 'SB-KP082' || tpl.includes('central_sym')) {
    const rotP = (Number(paramValues['rot_process'] ?? 0) * Math.PI) / 180;
    if (ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'A') { x = 3; y = 2; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = 1; y = -2; constraints = 'fixed'; }
    else if (ptDef.id === 'A_prime') {
      x = 3 * Math.cos(rotP) - 2 * Math.sin(rotP);
      y = 3 * Math.sin(rotP) + 2 * Math.cos(rotP);
      constraints = 'fixed';
    } else if (ptDef.id === 'B_prime') {
      x = 1 * Math.cos(rotP) - (-2) * Math.sin(rotP);
      y = 1 * Math.sin(rotP) + (-2) * Math.cos(rotP);
      constraints = 'fixed';
    }
    return { x, y, constraints, isFixed };
  }

  // 20. SB-KP085: 解直角三角形
  if (sid === 'SB-KP085' || tpl.includes('right_triangle_measurement')) {
    const angleA = (Number(paramValues['angle_A'] ?? 30) * Math.PI) / 180;
    const hypotC = Number(paramValues['hypot_c'] ?? 6);
    if (ptDef.id === 'C') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'A') { x = hypotC * Math.cos(angleA); y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = hypotC * Math.cos(angleA); y = hypotC * Math.sin(angleA); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 21. SB-KP043: 二次函数应用建模
  if (sid === 'SB-KP043' || tpl.includes('quadratic_modeling')) {
    const aVal = Number(paramValues['param_a'] ?? -0.5);
    const tVal = Number(paramValues['param_t'] ?? 1);
    const yP = aVal * (tVal + 2) * (tVal - 4);
    if (ptDef.id === 'p_A') { x = -2; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B') { x = 4; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_P') { x = tVal; y = yP; constraints = 'fixed'; }
    else if (ptDef.id === 'p_Q') { x = tVal; y = 0; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 22. SB-KP044: 几何点线角
  if (sid === 'SB-KP044' || tpl.includes('point_line')) {
    const angle = (Number(paramValues['param_angle_deg'] ?? 45) * Math.PI) / 180;
    const lenOA = Number(paramValues['param_len_oa'] ?? 4);
    if (ptDef.id === 'p_O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'p_A') { x = lenOA * Math.cos(angle); y = lenOA * Math.sin(angle); constraints = 'fixed'; }
    else if (ptDef.id === 'p_B') { x = 4; y = 0; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 23. SB-KP045: 线段中点
  if (sid === 'SB-KP045' || tpl.includes('segment_mid')) {
    const lenAB = Number(paramValues['param_len_ab'] ?? 8);
    const cPos = Number(paramValues['param_c_pos'] ?? 3);
    if (ptDef.id === 'p_A') { x = 0; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B') { x = lenAB; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_C') { x = cPos; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_M') { x = cPos / 2; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_N') { x = (cPos + lenAB) / 2; y = 0; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 24. SB-KP046: 角计算
  if (sid === 'SB-KP046' || tpl.includes('angle_calc')) {
    const alpha = (Number(paramValues['param_alpha'] ?? 60) * Math.PI) / 180;
    if (ptDef.id === 'p_O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'p_A') { x = 4; y = 0; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B') { x = 4 * Math.cos(alpha); y = 4 * Math.sin(alpha); constraints = 'fixed'; }
    else if (ptDef.id === 'p_C') { x = -4; y = 0; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 25. SB-KP047: 垂线段最短
  if (sid === 'SB-KP047' || tpl.includes('perpendicular')) {
    if (paramValues['param_x_c'] !== undefined && (ptDef.id === 'C' || ptDef.name?.includes('C'))) {
      x = Number(paramValues['param_x_c']);
    }
    if (paramValues['param_y_p'] !== undefined && (ptDef.id === 'P' || ptDef.name?.includes('P'))) {
      y = Number(paramValues['param_y_p']);
    }
    return { x, y, constraints, isFixed };
  }

  // 26. SB-KP048: 平行线与截线
  if (sid === 'SB-KP048' || tpl === 'geometry_parallel_template' || (tpl.includes('parallel') && !tpl.includes('parallelogram'))) {
    const transAngle = (Number(paramValues['param_trans_angle'] ?? 60) * Math.PI) / 180;
    const lineDist = Number(paramValues['param_line_dist'] ?? 4);
    const halfD = lineDist / 2;
    const xOffset = Math.abs(Math.tan(transAngle)) > 1e-4 ? halfD / Math.tan(transAngle) : 0;
    if (ptDef.id === 'A') { x = -4; y = halfD; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = 4; y = halfD; constraints = 'fixed'; }
    else if (ptDef.id === 'C') { x = -4; y = -halfD; constraints = 'fixed'; }
    else if (ptDef.id === 'D') { x = 4; y = -halfD; constraints = 'fixed'; }
    else if (ptDef.id === 'P1') { x = 0; y = halfD; constraints = 'fixed'; }
    else if (ptDef.id === 'P2') { x = -2 * xOffset; y = -halfD; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 27. SB-KP049: 三角形内角和
  if (sid === 'SB-KP049' || tpl.includes('triangle_sum')) {
    const vAx = Number(paramValues['param_vertex_ax'] ?? 0);
    const vAy = Number(paramValues['param_vertex_ay'] ?? 4);
    const baseW = Number(paramValues['param_base_w'] ?? 8);
    if (ptDef.id === 'A') { x = vAx; y = vAy; constraints = 'fixed'; }
    else if (ptDef.id === 'B') { x = -baseW / 2; y = -2; constraints = 'fixed'; }
    else if (ptDef.id === 'C') { x = baseW / 2; y = -2; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 28. SB-KP051: 全等判定与平移
  if (sid === 'SB-KP051' || tpl.includes('congruence')) {
    const transX = Number(paramValues['trans_x'] ?? 0);
    const transY = Number(paramValues['trans_y'] ?? 0);
    if (ptDef.id === 'A2') { x = 3 + transX; y = 3 + transY; constraints = 'fixed'; }
    else if (ptDef.id === 'B2') { x = 1 + transX; y = -2 + transY; constraints = 'fixed'; }
    else if (ptDef.id === 'C2') { x = 6 + transX; y = -2 + transY; constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 29. SB-KP060: 位似变换
  if (sid === 'SB-KP060' || tpl.includes('homothety')) {
    const homoK = Number(paramValues['homo_k'] ?? 2);
    const cx = Number(paramValues['center_x'] ?? 0);
    const cy = Number(paramValues['center_y'] ?? 0);
    if (ptDef.id === 'p_O') { x = cx; y = cy; constraints = 'fixed'; isFixed = true; }
    else if (ptDef.id === 'p_A_prime') { x = cx + homoK * (1 - cx); y = cy + homoK * (2 - cy); constraints = 'fixed'; }
    else if (ptDef.id === 'p_B_prime') { x = cx + homoK * (3 - cx); y = cy + homoK * (1 - cy); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 30. SB-KP062: 平行四边形剪切
  if (sid === 'SB-KP062' || tpl.includes('parallelogram')) {
    const baseA = Number(paramValues['base_len'] ?? 5);
    const sideB = Number(paramValues['side_len'] ?? 4);
    const shearAngle = (Number(paramValues['shear_angle'] ?? 60) * Math.PI) / 180;
    const ax = -baseA / 2;
    const ay = (-sideB * Math.sin(shearAngle)) / 2;
    if (ptDef.id === 'p_A') { x = ax; y = ay; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B') { x = ax + baseA; y = ay; constraints = 'fixed'; }
    else if (ptDef.id === 'p_D') { x = ax + sideB * Math.cos(shearAngle); y = ay + sideB * Math.sin(shearAngle); constraints = 'fixed'; }
    else if (ptDef.id === 'p_C') { x = ax + baseA + sideB * Math.cos(shearAngle); y = ay + sideB * Math.sin(shearAngle); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 31. SB-KP064: 矩形与剪切角
  if (sid === 'SB-KP064' || tpl.includes('rectangle')) {
    const rectW = Number(paramValues['rect_w'] ?? 6);
    const rectH = Number(paramValues['rect_h'] ?? 4);
    const shearA = (Number(paramValues['shear_alpha'] ?? 90) * Math.PI) / 180;
    const raX = -rectW / 2;
    const raY = -rectH / 2;
    if (ptDef.id === 'p_A') { x = raX; y = raY; constraints = 'fixed'; }
    else if (ptDef.id === 'p_B') { x = raX + rectW; y = raY; constraints = 'fixed'; }
    else if (ptDef.id === 'p_D') { x = raX + rectH * Math.cos(shearA); y = raY + rectH * Math.sin(shearA); constraints = 'fixed'; }
    else if (ptDef.id === 'p_C') { x = raX + rectW + rectH * Math.cos(shearA); y = raY + rectH * Math.sin(shearA); constraints = 'fixed'; }
    return { x, y, constraints, isFixed };
  }

  // 32. SB-KP032: 正比例函数动点与象限投影
  if (sid === 'SB-KP032' || tpl.includes('direct')) {
    const k = Number(paramValues['k_prop'] ?? paramValues['slope_k'] ?? 1);
    const xPos = Number(paramValues['x_pos'] ?? 2);
    if (ptDef.id === 'p1' || ptDef.name === 'P') {
      x = xPos;
      y = k * xPos;
      constraints = 'fixed';
      isFixed = false;
    } else if (ptDef.id === 'px' || ptDef.name === 'Px') {
      x = xPos;
      y = 0;
      constraints = 'fixed';
      isFixed = true;
    } else if (ptDef.id === 'o' || ptDef.id === 'O' || ptDef.name === 'O') {
      x = 0;
      y = 0;
      constraints = 'fixed';
      isFixed = true;
    }
    return { x, y, constraints, isFixed };
  }

  // 33. SB-KP036/037: 反比例函数动点与对称点
  if (tpl.includes('inverse')) {
    const k = Number(paramValues['inv_k'] ?? paramValues['rect_k'] ?? 6);
    const xPos = Number(paramValues['x_pos'] ?? paramValues['x_pt'] ?? 2);
    if (ptDef.id === 'p1' || ptDef.id === 'p' || ptDef.name?.includes('P(x')) {
      x = xPos;
      y = xPos !== 0 ? k / xPos : 0;
      constraints = 'fixed';
      isFixed = false;
    } else if (ptDef.id === 'p2' || ptDef.name?.includes("P'")) {
      x = -xPos;
      y = xPos !== 0 ? -k / xPos : 0;
      constraints = 'fixed';
      isFixed = true;
    } else if (ptDef.id === 'px') {
      x = xPos;
      y = 0;
      constraints = 'fixed';
      isFixed = true;
    } else if (ptDef.id === 'py') {
      x = 0;
      y = xPos !== 0 ? k / xPos : 0;
      constraints = 'fixed';
      isFixed = true;
    } else if (ptDef.id === 'o' || ptDef.id === 'O') {
      x = 0;
      y = 0;
      constraints = 'fixed';
      isFixed = true;
    }
    return { x, y, constraints, isFixed };
  }

  // 34. SB-KP039: 二次函数顶点式
  if (
    sid === 'SB-KP039' ||
    tpl.includes('quadratic_vertex') ||
    (tpl.includes('vertex') && paramValues['param_h'] !== undefined)
  ) {
    const a = Number(paramValues['param_a'] ?? paramValues['a'] ?? 1);
    const h = Number(paramValues['param_h'] ?? paramValues['h'] ?? 2);
    const k = Number(paramValues['param_k'] ?? paramValues['k'] ?? -3);
    if (ptDef.id === 'p_vertex' || ptDef.id === 'p_V' || ptDef.id === 'V' || ptDef.name?.includes('V')) {
      x = h;
      y = k;
      constraints = 'fixed';
    } else if (ptDef.id === 'p_sym1' || ptDef.id === 'p_P1' || ptDef.id === 'P1' || ptDef.name?.includes('P1') || ptDef.name?.includes('P₁')) {
      x = h - 2;
      y = a * 4 + k;
      constraints = 'fixed';
    } else if (ptDef.id === 'p_sym2' || ptDef.id === 'p_P2' || ptDef.id === 'P2' || ptDef.name?.includes('P2') || ptDef.name?.includes('P₂')) {
      x = h + 2;
      y = a * 4 + k;
      constraints = 'fixed';
    }
    return { x, y, constraints, isFixed };
  }

  // 35. SB-KP033 / SB-KP034: 一次函数待定系数法与图象性质
  if (
    sid === 'SB-KP033' ||
    sid === 'SB-KP034' ||
    tpl.includes('linear_solve') ||
    tpl.includes('linear_prop')
  ) {
    if (paramValues['pt_x1'] !== undefined || paramValues['pt_x2'] !== undefined) {
      const x1 = Number(paramValues['pt_x1'] ?? -2);
      const y1 = Number(paramValues['pt_y1'] ?? -1);
      const x2 = Number(paramValues['pt_x2'] ?? 4);
      const y2 = Number(paramValues['pt_y2'] ?? 5);
      if (ptDef.id === 'pA' || ptDef.id === 'A') { x = x1; y = y1; constraints = 'fixed'; }
      else if (ptDef.id === 'pB' || ptDef.id === 'B') { x = x2; y = y2; constraints = 'fixed'; }
      else if (ptDef.id === 'O' || ptDef.id === 'o') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
      return { x, y, constraints, isFixed };
    } else if (paramValues['slope_k'] !== undefined || paramValues['intercept_b'] !== undefined) {
      const k = Number(paramValues['slope_k'] ?? 1);
      const b = Number(paramValues['intercept_b'] ?? 0);
      if (ptDef.id === 'p_int_x') { x = k !== 0 ? -b / k : 0; y = 0; constraints = 'fixed'; }
      else if (ptDef.id === 'p_int_y') { x = 0; y = b; constraints = 'fixed'; }
      else if (ptDef.id === 'o' || ptDef.id === 'O') { x = 0; y = 0; constraints = 'fixed'; isFixed = true; }
      return { x, y, constraints, isFixed };
    }
  }

  return { x, y, constraints, isFixed };
}

/**
 * 提取沙盒模型所有实际图元与动点的包围盒 (TASK-FE-0015 块 A)
 * 支持声明式 carrier elements (point, circle, segment, polygon, line, etc.)
 * 以及基于模板特化计算的 drag_points (直角三角形, 等腰三角形, 圆, 抛物线, 双曲线, 四边形等)
 */
export function computeSandboxBoundingBox(
  config: SandboxConfig,
  paramValues: Record<string, number> = {}
): BoundingBox | null {
  const points: Array<{ x: number; y: number }> = [];

  const addPoint = (x: any, y: any) => {
    const nx = Number(x);
    const ny = Number(y);
    if (Number.isFinite(nx) && Number.isFinite(ny)) {
      points.push({ x: nx, y: ny });
    }
  };

  const addCircleBounds = (cx: number, cy: number, r: number) => {
    if (Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(r) && r > 0) {
      points.push({ x: cx - r, y: cy });
      points.push({ x: cx + r, y: cy });
      points.push({ x: cx, y: cy - r });
      points.push({ x: cx, y: cy + r });
    }
  };

  // 1. 构建参数求值作用域
  const scope: Record<string, any> = { ...paramValues };
  const a = paramValues['param_a'] ?? paramValues['a_coeff'] ?? paramValues['a'] ?? 1;
  const b = paramValues['param_b'] ?? paramValues['intercept_b'] ?? paramValues['b'] ?? -2;
  const c = paramValues['param_c'] ?? paramValues['c'] ?? -3;
  const k = paramValues['slope_k'] ?? paramValues['inv_k'] ?? paramValues['rect_k'] ?? paramValues['k'] ?? 1;

  scope['param_a'] = a;
  scope['a'] = a;
  scope['param_b'] = b;
  scope['b'] = b;
  scope['param_c'] = c;
  scope['c'] = c;
  scope['k'] = k;
  scope['slope_k'] = k;
  scope['Delta'] = b * b - 4 * a * c;
  scope['delta_val'] = b * b - 4 * a * c;

  // 2. 检查是否有声明式 carrier
  let declarativeCarrier: any = null;
  if (config.carrier_json) {
    try {
      declarativeCarrier = JSON.parse(config.carrier_json);
    } catch (e) {}
  } else if ((config as any).carrier) {
    declarativeCarrier = (config as any).carrier;
  }

  const pointMap: Record<string, { x: number; y: number }> = {};

  if (declarativeCarrier && Array.isArray(declarativeCarrier.elements) && declarativeCarrier.elements.length > 0) {
    const carrierElements = declarativeCarrier.elements;

    carrierElements.forEach((elemDef: any) => {
      // 条件显隐评估
      if (elemDef.condition) {
        try {
          const isSatisfied = evaluateSafeExpression(elemDef.condition, scope);
          if (!isSatisfied) return;
        } catch (e) {
          return;
        }
      }

      switch (elemDef.type) {
        case 'point': {
          if (Array.isArray(elemDef.coord) && elemDef.coord.length >= 2) {
            try {
              const ptX = Number(evaluateSafeExpression(String(elemDef.coord[0]), scope));
              const ptY = Number(evaluateSafeExpression(String(elemDef.coord[1]), scope));
              if (Number.isFinite(ptX) && Number.isFinite(ptY)) {
                addPoint(ptX, ptY);
                const key = elemDef.id || elemDef.name;
                if (key) pointMap[key] = { x: ptX, y: ptY };
              }
            } catch (e) {}
          }
          break;
        }

        case 'circle': {
          try {
            let center = { x: 0, y: 0 };
            if (elemDef.center && pointMap[elemDef.center]) {
              center = pointMap[elemDef.center];
            } else if (pointMap['O']) {
              center = pointMap['O'];
            } else if (pointMap['Origin']) {
              center = pointMap['Origin'];
            }
            const r = elemDef.radius !== undefined
              ? Number(evaluateSafeExpression(String(elemDef.radius), scope))
              : 4;
            addCircleBounds(center.x, center.y, r);
          } catch (e) {}
          break;
        }

        case 'segment': {
          if (Array.isArray(elemDef.endpoints)) {
            elemDef.endpoints.forEach((ep: any) => {
              if (Array.isArray(ep) && ep.length >= 2) {
                addPoint(ep[0], ep[1]);
              }
            });
          }
          break;
        }

        case 'polygon': {
          if (Array.isArray(elemDef.vertices)) {
            elemDef.vertices.forEach((v: any) => {
              if (Array.isArray(v) && v.length >= 2) {
                addPoint(v[0], v[1]);
              }
            });
          }
          break;
        }

        case 'line': {
          if (elemDef.fn && typeof elemDef.fn === 'string' && elemDef.fn.includes('x =')) {
            try {
              const xExpr = elemDef.fn.replace('x =', '').trim();
              const lineX = Number(evaluateSafeExpression(xExpr, scope));
              if (Number.isFinite(lineX)) {
                addPoint(lineX, 0);
              }
            } catch (e) {}
          }
          break;
        }

        default:
          break;
      }
    });
  }

  // 3. 解析标准 drag_points_json
  let dragPoints: any[] = [];
  try {
    dragPoints = JSON.parse(config.drag_points_json || '[]');
  } catch (e) {}

  const tpl = config.canvas_template || '';
  const isCircleTemplate =
    (tpl.includes('circle') && !tpl.includes('incircle')) ||
    tpl.includes('inscribed') ||
    tpl.includes('chord') ||
    tpl.includes('tangent') ||
    config.sandbox_id === 'SB-KP073';

  // 具名滑块驱动动点坐标
  dragPoints = dragPoints.map((ptDef) => {
    const kPt = applyGeometricKinematics(config, ptDef, paramValues);
    let x = kPt.x;
    let y = kPt.y;

    if (
      tpl.startsWith('number_axis') ||
      tpl.includes('number_line') ||
      tpl === 'axis' ||
      tpl === 'number_axis_dynamic'
    ) {
      const x0 = Number(paramValues['param_x0'] ?? 0);
      const v = Number(paramValues['param_v'] ?? 1);
      const t = Number(paramValues['param_t'] ?? 0);
      const pVal = paramValues['pos_p'] ?? paramValues['point_x'] ?? paramValues['pt_x'] ?? paramValues['val'];

      if (pVal !== undefined && (ptDef.id === 'P' || ptDef.name === 'P' || ptDef.name?.includes('P'))) {
        x = Number(pVal);
      } else if (
        paramValues['param_t'] !== undefined &&
        (ptDef.id === 'P' || ptDef.name === 'P' || ptDef.name?.includes('P'))
      ) {
        if (paramValues['param_x0'] !== undefined || paramValues['param_v'] !== undefined) {
          x = x0 + v * t;
        } else if (config.sandbox_id?.startsWith('LEAP-') && typeof ptDef.x === 'number') {
          x = ptDef.x;
        } else {
          x = x0 + v * t;
        }
      }

      if (ptDef.id === 'A' && (paramValues['point_a'] !== undefined || paramValues['interval_a'] !== undefined)) {
        x = Number(paramValues['point_a'] ?? paramValues['interval_a']);
      }
      if (ptDef.id === 'B' && (paramValues['point_b'] !== undefined || paramValues['interval_b'] !== undefined)) {
        x = Number(paramValues['point_b'] ?? paramValues['interval_b']);
      }
    }

    if (tpl.includes('right_triangle') || tpl.includes('pythagorean')) {
      const legA = paramValues['leg_a'];
      const legB = paramValues['leg_b'];
      if (legA !== undefined && (ptDef.id === 'B' || ptDef.name === 'B')) x = Number(legA);
      if (legB !== undefined && (ptDef.id === 'A' || ptDef.name === 'A')) y = Number(legB);
    }

    if (tpl.includes('isosceles') && paramValues['base_w'] !== undefined) {
      const half = Number(paramValues['base_w']) / 2;
      if (ptDef.id === 'B' || ptDef.name === 'B') x = -half;
      if (ptDef.id === 'C' || ptDef.name === 'C') x = half;
    }

    const isExternalOrCenter =
      ptDef.id === 'O' || ptDef.id === 'Origin' || ptDef.id === 'o' || ptDef.id === 'I' ||
      ptDef.id === 'P' || (ptDef.name && (ptDef.name.includes('P') || ptDef.name.includes('外') || ptDef.name.includes('圆外'))) ||
      tpl.includes('tangent') || tpl.includes('incircle') ||
      config.sandbox_id === 'SB-KP072' || config.sandbox_id === 'SB-KP076' || (config as any).model_id === 'LM-9A-24';

    if (isCircleTemplate && !isExternalOrCenter) {
      const cr = paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? paramValues['circle_r1'];
      if (cr !== undefined) {
        const curDist = Math.hypot(x, y);
        if (curDist > 0.1) {
          const ratio = Number(cr) / curDist;
          x = x * ratio;
          y = y * ratio;
        }
      }
    }

    return { ...ptDef, x, y };
  });

  dragPoints.forEach((ptDef) => {
    addPoint(ptDef.x, ptDef.y);
  });

  // 4. 特化数学图元极值与衍生点计算
  if (config.sandbox_id === 'SB-KP057' || tpl === 'geometry_pythagorean_template') {
    if (paramValues['view_mode'] === 2) {
      const legA = Number(paramValues['leg_a'] ?? 4);
      const legB = Number(paramValues['leg_b'] ?? 3);
      addPoint(0, 0);
      addPoint(legB + legA, legB + legA);
    }
  }

  if (config.sandbox_id === 'SB-KP055' || tpl.includes('equilateral')) {
    const sideA = Number(paramValues['side_a'] ?? 6);
    const R = sideA / Math.sqrt(3);
    addCircleBounds(0, 0, R);
  }

  if (isCircleTemplate) {
    const centerPt = dragPoints.find((p) => p.id === 'O' || p.id === 'Origin') || dragPoints[0];
    const cx = centerPt?.x ?? 0;
    const cy = centerPt?.y ?? 0;
    const radiusVal = Number(
      paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? 4
    );
    addCircleBounds(cx, cy, radiusVal);
  } else if (
    tpl.includes('parallelogram') ||
    tpl.includes('rectangle') ||
    tpl.includes('rhombus') ||
    tpl.includes('square')
  ) {
    if (dragPoints.length >= 3) {
      const ptA = dragPoints[0];
      const ptB = dragPoints[1];
      const ptC = dragPoints[2];
      const dX = ptA.x + ptC.x - ptB.x;
      const dY = ptA.y + ptC.y - ptB.y;
      addPoint(dX, dY);
    }
  } else if (tpl.includes('quadratic') || tpl.includes('parabola') || tpl.includes('vieta')) {
    const qa = scope['a'];
    const qb = scope['b'];
    const qc = scope['c'];
    const qDelta = scope['Delta'];
    if (typeof qa === 'number' && qa !== 0 && typeof qb === 'number' && typeof qc === 'number') {
      const symX = -qb / (2 * qa);
      const vertY = (4 * qa * qc - qb * qb) / (4 * qa);
      addPoint(symX, vertY);
      if (typeof qDelta === 'number' && qDelta >= 0) {
        const x1 = (-qb - Math.sqrt(qDelta)) / (2 * qa);
        const x2 = (-qb + Math.sqrt(qDelta)) / (2 * qa);
        addPoint(x1, 0);
        addPoint(x2, 0);
      }
      addPoint(0, qc);
    }
  } else if (tpl.includes('inverse') || tpl.includes('hyperbola')) {
    const invK = Number(paramValues['inv_k'] ?? paramValues['rect_k'] ?? paramValues['k'] ?? 6);
    const tVal = Number(paramValues['x_pos'] ?? paramValues['x_pt'] ?? paramValues['param_t'] ?? 3);
    const ptX = tVal !== 0 ? tVal : 1;
    const ptY = invK / ptX;
    addPoint(ptX, ptY);
    addPoint(-ptX, -ptY);
    addPoint(ptX, 0);
    addPoint(0, ptY);
    addPoint(0, 0);
  } else if (tpl.includes('linear') || tpl.includes('direct')) {
    const k1 = Number(paramValues['slope_k'] ?? paramValues['k1'] ?? paramValues['k_prop'] ?? 1);
    const b1 = Number(paramValues['intercept_b'] ?? paramValues['b1'] ?? 0);
    const xPos = Number(paramValues['x_pos'] ?? 2);
    addPoint(xPos, k1 * xPos + b1);
    addPoint(-xPos, -(k1 * xPos + b1));
    addPoint(0, 0);
    if (paramValues['slope_k2'] !== undefined || paramValues['k2'] !== undefined) {
      const k2 = Number(paramValues['slope_k2'] ?? paramValues['k2'] ?? -1);
      const b2 = Number(paramValues['intercept_b2'] ?? paramValues['b2'] ?? 3);
      if (Math.abs(k1 - k2) > 1e-6) {
        const interX = (b2 - b1) / (k1 - k2);
        const interY = k1 * interX + b1;
        addPoint(interX, interY);
      }
    }
  }

  return computeBoundingBoxFromPoints(points);
}

export interface BoardBoundingBoxResult {
  boundingbox: [number, number, number, number];
  keepaspectratio: boolean;
  isCartesianAxis: boolean;
  isNumberAxis: boolean;
}

/**
 * 精确计算画布视口与坐标系对称居中包围盒
 * - 二维直角坐标系 (isCartesianAxis)：强制原点 (0, 0) 绝对居中、四象限对称，严防原点漂移至角落或负半轴被截断
 * - 一维数轴 (isNumberAxis)：Y 轴严格以 0 对称居中，X 轴全屏展开
 * - 纯几何图形：自适应紧凑包围盒放大充满
 */
export function computeBoardBoundingBox(
  config: SandboxConfig,
  paramValues: Record<string, number> = {}
): BoardBoundingBoxResult {
  const tpl = config.canvas_template || '';

  // 1. 区分一维数轴 (number_axis) 与二维直角坐标系 (cartesian_axis)
  const isNumberAxis =
    tpl.startsWith('number_axis') ||
    tpl.includes('number_line') ||
    tpl === 'number_axis_dynamic' ||
    config?.sandbox_id?.includes('LM-7A-01') ||
    config?.sandbox_id === 'SB-KP001' ||
    config?.sandbox_id === 'SB-KP002' ||
    config?.sandbox_id === 'SB-KP003' ||
    config?.sandbox_id === 'SB-KP008';

  const isCartesianAxis =
    !isNumberAxis && (
      config.canvas_template === 'axis' ||
      tpl === 'axis' ||
      tpl.startsWith('function_') ||
      tpl.includes('vieta') ||
      tpl.includes('linear') ||
      tpl.includes('quadratic') ||
      tpl.includes('parabola') ||
      tpl.includes('inverse') ||
      tpl.includes('cartesian') ||
      tpl.includes('coordinate') ||
      config?.sandbox_id?.includes('LM-7B-05') ||
      config?.sandbox_id?.includes('LM-8A-07') ||
      config?.sandbox_id?.includes('LM-8B-15') ||
      config?.sandbox_id?.includes('LM-9A-17')
    );

  const viewboxSpec = parseViewboxSpec(config.viewbox_spec_json);
  const contentBox = computeSandboxBoundingBox(config, paramValues);

  let boundingbox: [number, number, number, number];
  let keepaspectratio = true;

  if (isCartesianAxis) {
    // 二维直角坐标系：原点 (0, 0) 必须居中，四象限对称展现，彻底解决“重要模型没有居中、漂移截断”问题
    const baseSpanX = Math.max(
      Math.abs(viewboxSpec.baseBox.minX),
      Math.abs(viewboxSpec.baseBox.maxX),
      6
    );
    const baseSpanY = Math.max(
      Math.abs(viewboxSpec.baseBox.minY),
      Math.abs(viewboxSpec.baseBox.maxY),
      6
    );
    let maxSpan = Math.max(baseSpanX, baseSpanY);

    let contentMaxY = 0;
    if (contentBox && isValidBoundingBox(contentBox)) {
      const contentMax = Math.max(
        Math.abs(contentBox.minX),
        Math.abs(contentBox.maxX),
        Math.abs(contentBox.minY),
        Math.abs(contentBox.maxY)
      );
      contentMaxY = Math.max(Math.abs(contentBox.minY), Math.abs(contentBox.maxY));
      if (contentMax > maxSpan) {
        maxSpan = Math.ceil(contentMax + 1);
      }
    }

    const margin = 0.18;
    let spanWithMargin = maxSpan * (1 + margin);
    // 保证顶部和四周有至少 2.5 单位的舒适天花板缓冲，避免渐近线顶等图元标签贴紧或截断上边界
    if (contentMaxY > 0 && spanWithMargin < contentMaxY + 2.5) {
      spanWithMargin = Math.ceil(contentMaxY + 2.5);
    }
    // JSXGraph boundingbox: [minX, maxY, maxX, minY]
    boundingbox = [-spanWithMargin, spanWithMargin, spanWithMargin, -spanWithMargin];
    keepaspectratio = true;
  } else if (isNumberAxis) {
    const baseSpanX = Math.max(
      Math.abs(viewboxSpec.baseBox.minX),
      Math.abs(viewboxSpec.baseBox.maxX),
      6
    );
    let spanX = baseSpanX;
    if (contentBox && isValidBoundingBox(contentBox)) {
      const contentMaxX = Math.max(Math.abs(contentBox.minX), Math.abs(contentBox.maxX));
      if (contentMaxX > spanX) {
        spanX = Math.ceil(contentMaxX + 1);
      }
    }
    const margin = 0.12;
    const spanXWithMargin = spanX * (1 + margin);
    if (viewboxSpec.baseBox.minX >= 0) {
      boundingbox = [
        viewboxSpec.baseBox.minX - 0.5,
        3,
        Math.max(viewboxSpec.baseBox.maxX, spanX) + 1,
        -3,
      ];
    } else {
      boundingbox = [-spanXWithMargin, 3, spanXWithMargin, -3];
    }
    keepaspectratio = false;
  } else {
    boundingbox = calculateAdaptiveViewport(viewboxSpec, contentBox, {
      minSpan: 0.5,
      marginPercent:
        typeof viewboxSpec.marginPercent === 'number' && Number.isFinite(viewboxSpec.marginPercent)
          ? Math.max(0.12, Math.min(0.15, viewboxSpec.marginPercent))
          : 0.15,
    });
    const isAdaptive = isValidBoundingBox(contentBox, 0.5);
    keepaspectratio = isAdaptive ? true : (viewboxSpec.preserveAspectRatio !== false);
  }

  return { boundingbox, keepaspectratio, isCartesianAxis, isNumberAxis };
}

function safeFreeBoardInstance(b: any) {
  if (!b) return;
  try {
    if (typeof b.stopResizeObserver === 'function') b.stopResizeObserver();
    if (typeof b.stopIntersectionObserver === 'function') b.stopIntersectionObserver();
    if (Array.isArray(b.resizeHandlers)) b.resizeHandlers = [];
    JXG.JSXGraph.freeBoard(b);
  } catch (e) {}
}

export const SandboxRenderer: React.FC<SandboxRendererProps> = ({
  config,
  className,
  style,
  paramValues = {},
  onInvariantsChange,
  onPointsChange,
  onParamChange,
  xrayActive = false,
  locale = 'zh-CN',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const isDraggingRef = useRef<boolean>(false);
  const onParamChangeRef = useRef(onParamChange);
  onParamChangeRef.current = onParamChange;
  const onInvariantsChangeRef = useRef(onInvariantsChange);
  onInvariantsChangeRef.current = onInvariantsChange;
  const onPointsChangeRef = useRef(onPointsChange);
  onPointsChangeRef.current = onPointsChange;
  const lastInvariantsKeyRef = useRef<string>('');

  const tpl = config.canvas_template || '';

  // 第十类：三视图正交投影独立渲染引擎分发
  if (tpl === 'discrete_orthographic_three_view') {
    return (
      <DiscreteOrthographicRenderer
        paramValues={paramValues}
        className={className}
        style={style}
        onInvariantsChange={onInvariantsChange}
        locale={locale}
      />
    );
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // 正在拖拽中，保持当前 board 实例与 DOM 拓扑，避免拖动手势中断
    if (isDraggingRef.current && boardRef.current) {
      return;
    }

    // 1. 视口包围盒与坐标系自适应计算
    const { boundingbox, keepaspectratio, isCartesianAxis, isNumberAxis } =
      computeBoardBoundingBox(config, paramValues);
    const isAxis = isNumberAxis || isCartesianAxis;

    // 清理旧实例
    if (boardRef.current) {
      safeFreeBoardInstance(boardRef.current);
      boardRef.current = null;
    }

    // 初始化深色 Slate 视口（axis 设为 false，由下方统一手动精细化创建，杜绝 JSXGraph 默认算法导致的 X/Y 刻度步长不一致及数轴冗余 Y 轴）
    const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
      boundingbox,
      axis: false,
      grid: {
        strokeColor: 'rgba(255, 255, 255, 0.05)',
        dash: 2,
      },
      showCopyright: false,
      showNavigation: false,
      keepaspectratio,
      pan: { enabled: false },
      zoom: { wheel: false, pinch: false },
    });

    boardRef.current = board;

    // 精细化渲染坐标轴与数轴 (统一刻度步长与单位长度，杜绝 X/Y 步长冲突)
    if (isNumberAxis) {
      // 一维数轴：严格遵循初中课标（人教版七上），仅创建水平数轴，绝不创建竖向 Y 轴
      const spanX = Math.abs(boundingbox[2] - boundingbox[0]);
      const numStep = spanX > 30 ? 5 : spanX > 16 ? 2 : 1;
      board.create('axis', [[0, 0], [1, 0]], {
        name: 'x',
        withLabel: false,
        strokeColor: '#64748b',
        strokeWidth: 2,
        highlight: false,
        ticks: {
          ticksDistance: numStep,
          strokeColor: '#64748b',
          majorHeight: 8,
          drawZero: true,
          label: { color: '#e2e8f0', fontSize: 11, strokeColor: 'none', offset: [-4, -14] },
        },
      });
    } else if (isCartesianAxis) {
      // 二维直角坐标系：强制 X 轴与 Y 轴使用严格相同的统一刻度步长 (unifiedStep)，保证单位严格一致
      const spanX = Math.abs(boundingbox[2] - boundingbox[0]);
      const spanY = Math.abs(boundingbox[1] - boundingbox[3]);
      const maxSpan = Math.max(spanX, spanY);
      const unifiedStep = maxSpan > 25 ? 5 : maxSpan > 18 ? 2 : 1;

      // X 轴
      board.create('axis', [[0, 0], [1, 0]], {
        name: 'x',
        withLabel: true,
        label: { position: 'rt', offset: [-15, 15], color: '#94a3b8', fontSize: 12 },
        strokeColor: '#64748b',
        strokeWidth: 1.5,
        highlight: false,
        ticks: {
          ticksDistance: unifiedStep,
          strokeColor: '#64748b',
          majorHeight: 6,
          drawZero: true,
          label: { color: '#e2e8f0', fontSize: 11, strokeColor: 'none', offset: [-4, -14] },
        },
      });

      // Y 轴 (刻度步长与 X 轴 100% 严格相同；drawZero 为 false 防原点 0 重叠)
      board.create('axis', [[0, 0], [0, 1]], {
        name: 'y',
        withLabel: true,
        label: { position: 'rt', offset: [15, -10], color: '#94a3b8', fontSize: 12 },
        strokeColor: '#64748b',
        strokeWidth: 1.5,
        highlight: false,
        ticks: {
          ticksDistance: unifiedStep,
          strokeColor: '#64748b',
          majorHeight: 6,
          drawZero: false,
          label: { color: '#e2e8f0', fontSize: 11, strokeColor: 'none', offset: [-16, -2] },
        },
      });
    }
    const elements: Record<string, any> = {};

    // 构建上下文计算 scope
    const buildCurrentScope = (): Record<string, any> => {
      const scope: Record<string, any> = { ...paramValues };
      // 提取常用系数及其简写别名
      const a = Number(paramValues['param_a'] ?? paramValues['a_coeff'] ?? paramValues['a'] ?? 1);
      let b = Number(paramValues['param_b'] ?? paramValues['intercept_b'] ?? paramValues['b'] ?? -2);
      let c = Number(paramValues['param_c'] ?? paramValues['c'] ?? -3);
      const k = Number(paramValues['slope_k'] ?? paramValues['inv_k'] ?? paramValues['rect_k'] ?? paramValues['k'] ?? 1);

      // 二次函数顶点式 h, k 衍生
      const hasH = paramValues['param_h'] !== undefined || paramValues['h'] !== undefined;
      const hasK = paramValues['param_k'] !== undefined || (tpl.includes('vertex') && paramValues['k'] !== undefined);
      if (hasH || hasK || tpl.includes('vertex') || config.sandbox_id === 'SB-KP039') {
        const hVal = Number(paramValues['param_h'] ?? paramValues['h'] ?? 2);
        const kVal = Number(paramValues['param_k'] ?? paramValues['k'] ?? -3);
        scope['param_h'] = hVal;
        scope['h'] = hVal;
        scope['param_k'] = kVal;
        scope['k_vert'] = kVal;
        b = -2 * a * hVal;
        c = a * hVal * hVal + kVal;
      }

      scope['param_a'] = a;
      scope['a'] = a;
      scope['param_b'] = b;
      scope['b'] = b;
      scope['param_c'] = c;
      scope['c'] = c;
      scope['k'] = k;
      scope['slope_k'] = k;
      scope['Delta'] = b * b - 4 * a * c;
      scope['delta_val'] = b * b - 4 * a * c;

      if (paramValues['leg_a'] !== undefined && paramValues['leg_b'] !== undefined) {
        const legA = Number(paramValues['leg_a']);
        const legB = Number(paramValues['leg_b']);
        if (Number.isFinite(legA) && Number.isFinite(legB)) {
          const h = Math.hypot(legA, legB);
          scope['hypot'] = h;
          scope['c_len'] = h;
          scope['AB'] = h;
          const ptT = Number(paramValues['point_t'] ?? 0.5);
          scope['CM'] = Math.hypot(ptT * legA, (1 - ptT) * legB);
        }
      }

      if (tpl.includes('incircle') || config.sandbox_id === 'SB-KP076') {
        const ay = Number(paramValues['vertex_A_y'] ?? 5);
        const ax = Number(paramValues['vertex_A_x'] ?? 0);
        const cx = Number(paramValues['vertex_C_x'] ?? 4);
        const aSide = cx + 4;
        const bSide = Math.hypot(cx - ax, ay);
        const cSide = Math.hypot(ax + 4, ay);
        const pPerim = (aSide + bSide + cSide) / 2;
        const sArea = 0.5 * aSide * ay;
        const inradius = pPerim > 0 ? sArea / pPerim : 0;
        scope['aSide'] = aSide;
        scope['bSide'] = bSide;
        scope['cSide'] = cSide;
        scope['p'] = pPerim;
        scope['S'] = sArea;
        scope['r'] = inradius;
        scope['inradius'] = inradius;
      }

      if (tpl.includes('rhombus') || config.sandbox_id === 'SB-KP065') {
        const dh = Number(paramValues['diag_h'] ?? 6);
        const dv = Number(paramValues['diag_v'] ?? 4);
        scope['diag_h'] = dh;
        scope['diag_v'] = dv;
        scope['rhombus_side'] = Math.hypot(dh / 2, dv / 2);
        scope['rhombus_area'] = 0.5 * dh * dv;
      }

      if (tpl.includes('tangent') || config.sandbox_id === 'SB-KP072') {
        const cr = Number(paramValues['circle_r'] ?? 3);
        const d = Number(paramValues['dist_OP'] ?? 6);
        scope['circle_r'] = cr;
        scope['dist_OP'] = d;
        scope['tangent_len'] = Math.sqrt(Math.max(0, d * d - cr * cr));
      }

      if (tpl.includes('sector') || config.sandbox_id === 'SB-KP077') {
        const r = Number(paramValues['radius_r'] ?? 4);
        const n = Number(paramValues['angle_n'] ?? 60);
        scope['radius_r'] = r;
        scope['angle_n'] = n;
        scope['arc_len'] = (n * Math.PI * r) / 180;
        scope['sector_area'] = (n * Math.PI * r * r) / 360;
      }

      // 注入 carrierId 与 modelId (支持跨载体不变量隔离与条件判定)
      const rawCarrierId =
        (config as any).carrier_id ||
        (config as any).carrierId ||
        (config as any).currentCarrierId ||
        '';
      scope['carrierId'] = rawCarrierId;
      scope['carrier_id'] = rawCarrierId;
      scope['modelId'] = config.sandbox_id || '';
      scope['sandboxId'] = config.sandbox_id || '';

      // LM-7A-02 线段双中点与角平分线和差模型
      if (tpl === 'geometry_segment_midpoint_bisector' || (config.sandbox_id || '').includes('LM-7A-02')) {
        const lenAB = Number(paramValues['len_ab'] ?? 8.0);
        scope['len_ab'] = lenAB;
        scope['half_len'] = lenAB / 2;
        scope['angle_alpha'] = Number(paramValues['angle_alpha'] ?? 90.0);
      }

      // SB-QUADRATIC-VERTICAL-HEIGHT 抛物线铅垂高模型
      if (config.sandbox_id === 'SB-QUADRATIC-VERTICAL-HEIGHT' || tpl.includes('vertical_height')) {
        const kScale = Number(paramValues['k_scale'] ?? paramValues['a'] ?? -1);
        const xp = Number(paramValues['x_p'] ?? 0);
        scope['k_scale'] = kScale;
        scope['a'] = kScale;
        scope['x_p'] = xp;
        const yP = Math.max(0, kScale * xp * xp + 4);
        scope['h'] = yP;
        scope['inv_h'] = yP;
        scope['inv_area'] = 2 * yP;
      }

      return scope;
    };

    const currentScope = buildCurrentScope();

    // 解析 46 概念沙盒声明式几何填充面与直角标规格 (TASK-FE-0021 步骤 2)
    let visualElements: {
      color_semantics?: Record<string, string>;
      polygons?: Array<{ pts: string[]; fillColor?: string; strokeColor?: string; fillOpacity?: number; strokeWidth?: number }>;
      rightAngles?: Array<{ vertex: string; arm1: string; arm2: string }>;
    } | null = null;
    try {
      if (config.visual_elements_json) {
        visualElements = typeof config.visual_elements_json === 'string'
          ? JSON.parse(config.visual_elements_json)
          : config.visual_elements_json;
      }
    } catch (e) {}

    const resolvePoint = (ref: any): any => {
      if (!ref) return null;
      if (typeof ref === 'object' && typeof ref.X === 'function') return ref;
      if (typeof ref === 'string') {
        if (elements[ref]) return elements[ref];
        const matchKey = Object.keys(elements).find((k) => k.toLowerCase() === ref.toLowerCase());
        if (matchKey) return elements[matchKey];
        const byName = Object.values(elements).find((el: any) => el && el.name === ref);
        if (byName) return byName;
      }
      return null;
    };

    // 不变量与遥测指标实时计算器 (提前定义供动点拖拽与画布监听实时调用)
    let invariants: any[] = [];
    try {
      const parsed = JSON.parse(config.invariants_display_json || '[]');
      invariants = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {}

    const updateInvariants = () => {
      const pointMap: Record<string, Point2D> = {};
      Object.keys(elements).forEach((id) => {
        const el = elements[id];
        if (el && typeof el.X === 'function') pointMap[id] = { x: el.X(), y: el.Y() };
      });

      const scope = buildCurrentScope();
      Object.keys(pointMap).forEach((id) => {
        const pt = pointMap[id];
        scope[id] = pt;
        scope[`${id}_x`] = pt.x;
        scope[`${id}_y`] = pt.y;
        scope[`pt_${id}_x`] = pt.x;
        scope[`pt_${id}_y`] = pt.y;
        const cleanId = id.replace(/^p_/, '');
        scope[cleanId] = pt;
        scope[`${cleanId}_x`] = pt.x;
        scope[`${cleanId}_y`] = pt.y;
        scope[`pt_${cleanId}_x`] = pt.x;
        scope[`pt_${cleanId}_y`] = pt.y;
        scope[id.toLowerCase()] = pt;
        scope[`${id.toLowerCase()}_x`] = pt.x;
        scope[`${id.toLowerCase()}_y`] = pt.y;
      });

      const results: Array<{ id: string; text: string; isConstant: boolean }> = [];
      invariants.forEach((inv, idx) => {
        const text = formatInvariantText(inv, pointMap, locale, scope);
        if (text !== null) {
          results.push({
            id: inv.id || `inv-${idx}`,
            text,
            isConstant: !!inv.isConstant,
          });
        }
      });

      const nextKey = results.map((r) => `${r.id}:${r.text}`).join('|');
      if (nextKey !== lastInvariantsKeyRef.current) {
        lastInvariantsKeyRef.current = nextKey;
        if (onInvariantsChangeRef.current) {
          onInvariantsChangeRef.current(results);
        }
      }
      if (onPointsChangeRef.current) {
        onPointsChangeRef.current(pointMap);
      }
    };

    // 3. 检查是否有声明式 carrier 规范 (如 LM-9A-18 规格的 carrier.elements)
    let declarativeCarrier: any = null;
    if (config.carrier_json) {
      try {
        declarativeCarrier = JSON.parse(config.carrier_json);
      } catch (e) {}
    } else if ((config as any).carrier) {
      declarativeCarrier = (config as any).carrier;
    }

    // 若有声明式 carrier elements
    if (declarativeCarrier && Array.isArray(declarativeCarrier.elements) && declarativeCarrier.elements.length > 0) {
      const carrierElements = declarativeCarrier.elements;

      carrierElements.forEach((elemDef: any) => {
        // 条件显隐评估 (如 condition: "Delta >= 0")
        if (elemDef.condition) {
          const isSatisfied = evaluateSafeExpression(elemDef.condition, currentScope);
          if (!isSatisfied) {
            return; // 不满足条件，平滑隐藏
          }
        }

        const color = ensureVisibleOnDark(elemDef.color, '#38bdf8');
        const strokeColor = ensureVisibleOnDark(elemDef.strokeColor || elemDef.color, '#38bdf8');
        const strokeWidth = elemDef.strokeWidth || (xrayActive ? 3.5 : 2.5);

        switch (elemDef.type) {
          case 'functiongraph': {
            if (elemDef.fn) {
              const fnStr = elemDef.fn;
              // X-Ray 发光底晕
              if (xrayActive) {
                board.create(
                  'functiongraph',
                  [
                    (x: number) => evaluateSafeExpression(fnStr, { ...currentScope, x }),
                    -20,
                    20,
                  ],
                  {
                    strokeColor: '#0071e3',
                    strokeWidth: 6,
                    strokeOpacity: 0.4,
                  }
                );
              }
              const fg = board.create(
                'functiongraph',
                [
                  (x: number) => evaluateSafeExpression(fnStr, { ...currentScope, x }),
                  -20,
                  20,
                ],
                {
                  strokeColor: strokeColor,
                  strokeWidth,
                }
              );
              elements[elemDef.id || 'fg'] = fg;
            }
            break;
          }

          case 'line': {
            // 对称轴直线 x = -b/(2a) 或其他直线
            if (elemDef.fn && elemDef.fn.includes('x =')) {
              const xExpr = elemDef.fn.replace('x =', '').trim();
              const lineX = Number(evaluateSafeExpression(xExpr, currentScope));
              const line = board.create(
                'line',
                [
                  [lineX, -20],
                  [lineX, 20],
                ],
                {
                  strokeColor: strokeColor,
                  strokeWidth: elemDef.strokeWidth || 1.8,
                  dash: elemDef.dash || 2,
                }
              );
              elements[elemDef.id || 'line'] = line;
            }
            break;
          }

          case 'point': {
            if (Array.isArray(elemDef.coord)) {
              const ptX = Number(evaluateSafeExpression(String(elemDef.coord[0]), currentScope));
              const ptY = Number(evaluateSafeExpression(String(elemDef.coord[1]), currentScope));
              const isCenter = elemDef.id === 'O' || elemDef.id === 'Origin';
              const ptColor = isCenter ? '#34c759' : color;
              const ptStroke = elemDef.strokeColor ? ensureVisibleOnDark(elemDef.strokeColor, '#ffffff') : '#ffffff';
              const isDistractor = !!elemDef.isDistractor || String(elemDef.id).startsWith('distractor_');
              const showLabel = !isDistractor && Boolean(elemDef.name);
              const isCarrierFixed = isCenter || isDistractor || elemDef.isFixed === true;

              const pt = board.create('point', [ptX, ptY], {
                name: showLabel ? (elemDef.name || elemDef.id || '') : '',
                withLabel: showLabel,
                visible: !isDistractor,
                size: elemDef.size ? Math.max(elemDef.size, 6) : 6,
                fillColor: ptColor,
                strokeColor: ptStroke,
                strokeWidth: 2,
                fixed: isCarrierFixed,
                highlightSize: 24,
                snapSizeX: 24,
                snapSizeY: 24,
                label: {
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 'bold',
                  offset: [-6, 14],
                  strokeColor: 'none',
                },
              });
              elements[elemDef.id || 'pt'] = pt;

              if (!isCarrierFixed) {
                pt.on('down', () => {
                  isDraggingRef.current = true;
                });
                pt.on('drag', () => {
                  isDraggingRef.current = true;
                  if (onParamChangeRef.current && canInvertParam(tpl, elemDef, tpl.includes('circle'), config)) {
                    handleParamInversion(
                      tpl,
                      elemDef,
                      pt,
                      tpl.includes('circle'),
                      paramValues,
                      declarativeCarrier?.elements || [],
                      elements,
                      board,
                      onParamChangeRef.current,
                      config
                    );
                  }
                });
                pt.on('up', () => {
                  isDraggingRef.current = false;
                });
              }
            }
            break;
          }

          case 'segment': {
            if (Array.isArray(elemDef.endpoints) && elemDef.endpoints.length >= 2) {
              const p1 = elements[elemDef.endpoints[0]];
              const p2 = elements[elemDef.endpoints[1]];
              if (p1 && p2) {
                const seg = board.create('segment', [p1, p2], {
                  strokeColor: strokeColor,
                  strokeWidth: elemDef.strokeWidth || (xrayActive ? 3.5 : 2.5),
                });
                elements[elemDef.id || 'seg'] = seg;
              }
            }
            break;
          }

          case 'circle': {
            // 圆图元落地
            const centerPt = elemDef.center ? elements[elemDef.center] : elements['O'];
            const r = elemDef.radius ? Number(evaluateSafeExpression(String(elemDef.radius), currentScope)) : 4;
            if (centerPt) {
              const c = board.create('circle', [centerPt, r], {
                strokeColor: strokeColor,
                strokeWidth,
                fillColor: 'rgba(56, 189, 248, 0.08)',
              });
              elements[elemDef.id || 'circle'] = c;
            }
            break;
          }

          case 'polygon': {
            let pts: any[] = [];
            if (Array.isArray(elemDef.vertices)) {
              pts = elemDef.vertices.map((v: any) => {
                if (typeof v === 'string') {
                  return elements[v];
                }
                if (Array.isArray(v) && v.length >= 2) {
                  return board.create(
                    'point',
                    [
                      Number(evaluateSafeExpression(String(v[0]), currentScope)),
                      Number(evaluateSafeExpression(String(v[1]), currentScope)),
                    ],
                    { visible: false, fixed: true }
                  );
                }
                return v;
              }).filter(Boolean);
            }
            if (pts.length >= 3) {
              const poly = board.create('polygon', pts, {
                fillColor: color,
                fillOpacity: elemDef.fillOpacity ?? 0.15,
                borders: {
                  strokeColor: strokeColor,
                  strokeWidth: elemDef.strokeWidth || 2,
                },
              });
              elements[elemDef.id || 'poly'] = poly;
            }
            break;
          }
        }
      });
    } else {
      // 4. 标准动点解析与具名参数驱动
      let dragPoints: any[] = [];
      try {
        dragPoints = JSON.parse(config.drag_points_json || '[]');
      } catch (e) {}

      const isCircleTemplate =
        (tpl.includes('circle') && !tpl.includes('incircle')) ||
        tpl.includes('inscribed') ||
        tpl.includes('chord') ||
        tpl.includes('tangent') ||
        config.sandbox_id === 'SB-KP073';

      // 具名滑块驱动动点坐标
      dragPoints = dragPoints.map((ptDef) => {
        const kPt = applyGeometricKinematics(config, ptDef, paramValues);
        let x = kPt.x;
        let y = kPt.y;
        let constraints = kPt.constraints !== undefined ? kPt.constraints : ptDef.constraints;
        let isFixed = kPt.isFixed !== undefined ? kPt.isFixed : ptDef.isFixed;

        // 数轴模板：动点 X 坐标响应 param_x0 + param_v * param_t 或 p_num / q_den
        if (
          tpl.startsWith('number_axis') ||
          tpl.includes('number_line') ||
          tpl === 'axis' ||
          tpl === 'number_axis_dynamic'
        ) {
          const x0 = Number(paramValues['param_x0'] ?? 0);
          const v = Number(paramValues['param_v'] ?? 1);
          const t = Number(paramValues['param_t'] ?? 0);
          const pVal = paramValues['pos_p'] ?? paramValues['point_x'] ?? paramValues['pt_x'] ?? paramValues['val'];

          if (paramValues['p_num'] !== undefined && (ptDef.id === 'P' || ptDef.name?.includes('P'))) {
            const p = Number(paramValues['p_num'] ?? 0);
            const q = Number(paramValues['q_den'] ?? 1) || 1;
            const u = Number(paramValues['unit_scale'] ?? 1) || 1;
            x = (p / q) * u;
          } else if (pVal !== undefined && (ptDef.id === 'P' || ptDef.name === 'P' || ptDef.name?.includes('P'))) {
            x = Number(pVal);
          } else if (
            paramValues['param_t'] !== undefined &&
            (ptDef.id === 'P' || ptDef.name === 'P' || ptDef.name?.includes('P'))
          ) {
            if (paramValues['param_x0'] !== undefined || paramValues['param_v'] !== undefined) {
              x = x0 + v * t;
            } else if (config.sandbox_id?.startsWith('LEAP-') && typeof ptDef.x === 'number') {
              x = ptDef.x;
            } else {
              x = x0 + v * t;
            }
          }

          if (paramValues['unit_scale'] !== undefined && (ptDef.id === 'U' || ptDef.name === '1')) {
            x = Number(paramValues['unit_scale'] ?? 1);
          }

          if (ptDef.id === 'A' && (paramValues['point_a'] !== undefined || paramValues['interval_a'] !== undefined)) {
            x = Number(paramValues['point_a'] ?? paramValues['interval_a']);
          }
          if (ptDef.id === 'B' && (paramValues['point_b'] !== undefined || paramValues['interval_b'] !== undefined)) {
            x = Number(paramValues['point_b'] ?? paramValues['interval_b']);
          }
        }

        // 垂线段最短模型 (SB-KP047)
        if (tpl.includes('perpendicular')) {
          if (paramValues['param_x_c'] !== undefined && (ptDef.id === 'C' || ptDef.name?.includes('C'))) {
            x = Number(paramValues['param_x_c']);
          }
          if (paramValues['param_y_p'] !== undefined && (ptDef.id === 'P' || ptDef.name?.includes('P'))) {
            y = Number(paramValues['param_y_p']);
          }
        }

        // 函数模型动点 (SB-KP032, SB-KP036, SB-KP037)
        if (tpl.includes('direct')) {
          const k = Number(paramValues['k_prop'] ?? paramValues['slope_k'] ?? 2);
          const xPos = Number(paramValues['x_pos'] ?? 2);
          if (ptDef.id === 'p1' || ptDef.name === 'P') {
            x = xPos;
            y = k * xPos;
          } else if (ptDef.id === 'px') {
            x = xPos;
            y = 0;
          }
        } else if (tpl.includes('inverse')) {
          const k = Number(paramValues['inv_k'] ?? paramValues['rect_k'] ?? 6);
          const xPos = Number(paramValues['x_pos'] ?? paramValues['x_pt'] ?? 2);
          if (ptDef.id === 'p1' || ptDef.id === 'p' || ptDef.name?.includes('P(x')) {
            x = xPos;
            y = xPos !== 0 ? k / xPos : 0;
          } else if (ptDef.id === 'p2' || ptDef.name?.includes("P'")) {
            x = -xPos;
            y = xPos !== 0 ? -k / xPos : 0;
          } else if (ptDef.id === 'px') {
            x = xPos;
            y = 0;
          } else if (ptDef.id === 'py') {
            x = 0;
            y = xPos !== 0 ? k / xPos : 0;
          }
        }

        // 直角三角形/勾股定理
        if (tpl.includes('right_triangle') || tpl.includes('pythagorean')) {
          const legA = paramValues['leg_a'];
          const legB = paramValues['leg_b'];
          if (legA !== undefined && (ptDef.id === 'B' || ptDef.name === 'B')) x = Number(legA);
          if (legB !== undefined && (ptDef.id === 'A' || ptDef.name === 'A')) y = Number(legB);
        }

        // 等腰三角形
        if (tpl.includes('isosceles') && paramValues['base_w'] !== undefined) {
          const half = Number(paramValues['base_w']) / 2;
          if (ptDef.id === 'B' || ptDef.name === 'B') x = -half;
          if (ptDef.id === 'C' || ptDef.name === 'C') x = half;
        }

        // 圆模型半径变化
        const isExternalOrCenter =
          ptDef.id === 'O' || ptDef.id === 'Origin' || ptDef.id === 'o' || ptDef.id === 'I' ||
          ptDef.id === 'P' || (ptDef.name && (ptDef.name.includes('P') || ptDef.name.includes('外') || ptDef.name.includes('圆外'))) ||
          tpl.includes('tangent') || tpl.includes('incircle') ||
          config.sandbox_id === 'SB-KP072' || config.sandbox_id === 'SB-KP076' || (config as any).model_id === 'LM-9A-24';

        if (isCircleTemplate && !isExternalOrCenter) {
          const cr = paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? paramValues['circle_r1'];
          if (cr !== undefined) {
            const curDist = Math.hypot(x, y);
            if (curDist > 0.1) {
              const ratio = Number(cr) / curDist;
              x = x * ratio;
              y = y * ratio;
            }
          }
        }

        return { ...ptDef, x, y, constraints, isFixed };
      });

      // 创建动点 (支持 46 概念沙盒 dynamic constraints 声明式约束动力学求解)
      dragPoints.forEach((ptDef) => {
        const isCenter = ptDef.id === 'O' || ptDef.id === 'Origin' || ptDef.id === 'o';
        const ptColor = isCenter ? '#34c759' : ensureVisibleOnDark(ptDef.color, '#38bdf8');
        const isDistractor = !!ptDef.isDistractor || String(ptDef.id).startsWith('distractor_');
        const showLabel = !isDistractor && Boolean(ptDef.name);

        let coords: [any, any] = [ptDef.x ?? 0, ptDef.y ?? 0];
        let hasConstraint = false;
        const cStr = typeof ptDef.constraints === 'string' ? ptDef.constraints.trim() : '';

        if (cStr && cStr !== 'free' && cStr !== 'fixed') {
          // 1. translation(parent, dx, dy)
          const transMatch = cStr.match(/^translation\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/);
          if (transMatch) {
            hasConstraint = true;
            const [, parentId, dxKey, dyKey] = transMatch;
            coords = [
              () => {
                const parent = resolvePoint(parentId.trim());
                const dx = Number(paramValues[dxKey.trim()] ?? 0);
                return (parent && typeof parent.X === 'function' ? parent.X() : (ptDef.x ?? 0)) + dx;
              },
              () => {
                const parent = resolvePoint(parentId.trim());
                const dy = Number(paramValues[dyKey.trim()] ?? 0);
                return (parent && typeof parent.Y === 'function' ? parent.Y() : (ptDef.y ?? 0)) + dy;
              },
            ];
          }

          // 2. rotation(center, parent, theta)
          const rotMatch = !hasConstraint && cStr.match(/^rotation\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/);
          if (rotMatch) {
            hasConstraint = true;
            const [, centerId, parentId, thetaKey] = rotMatch;
            coords = [
              () => {
                const center = resolvePoint(centerId.trim());
                const parent = resolvePoint(parentId.trim());
                const cx = center && typeof center.X === 'function' ? center.X() : 0;
                const cy = center && typeof center.Y === 'function' ? center.Y() : 0;
                const px = parent && typeof parent.X === 'function' ? parent.X() : (ptDef.x ?? 0);
                const py = parent && typeof parent.Y === 'function' ? parent.Y() : (ptDef.y ?? 0);
                const rad = (Number(paramValues[thetaKey.trim()] ?? 0) * Math.PI) / 180;
                return cx + (px - cx) * Math.cos(rad) - (py - cy) * Math.sin(rad);
              },
              () => {
                const center = resolvePoint(centerId.trim());
                const parent = resolvePoint(parentId.trim());
                const cx = center && typeof center.X === 'function' ? center.X() : 0;
                const cy = center && typeof center.Y === 'function' ? center.Y() : 0;
                const px = parent && typeof parent.X === 'function' ? parent.X() : (ptDef.x ?? 0);
                const py = parent && typeof parent.Y === 'function' ? parent.Y() : (ptDef.y ?? 0);
                const rad = (Number(paramValues[thetaKey.trim()] ?? 0) * Math.PI) / 180;
                return cy + (px - cx) * Math.sin(rad) + (py - cy) * Math.cos(rad);
              },
            ];
          }

          // 3. central_symmetry(center, parent)
          const symMatch = !hasConstraint && cStr.match(/^central_symmetry\(([^,]+),\s*([^)]+)\)$/);
          if (symMatch) {
            hasConstraint = true;
            const [, centerId, parentId] = symMatch;
            coords = [
              () => {
                const center = resolvePoint(centerId.trim());
                const parent = resolvePoint(parentId.trim());
                const cx = center && typeof center.X === 'function' ? center.X() : 0;
                const px = parent && typeof parent.X === 'function' ? parent.X() : (ptDef.x ?? 0);
                return 2 * cx - px;
              },
              () => {
                const center = resolvePoint(centerId.trim());
                const parent = resolvePoint(parentId.trim());
                const cy = center && typeof center.Y === 'function' ? center.Y() : 0;
                const py = parent && typeof parent.Y === 'function' ? parent.Y() : (ptDef.y ?? 0);
                return 2 * cy - py;
              },
            ];
          }

          // 4. midpoint(p1, p2)
          const midMatch = !hasConstraint && cStr.match(/^midpoint\(([^,]+),\s*([^)]+)\)$/);
          if (midMatch) {
            hasConstraint = true;
            const [, id1, id2] = midMatch;
            coords = [
              () => {
                const p1 = resolvePoint(id1.trim());
                const p2 = resolvePoint(id2.trim());
                const x1 = p1 && typeof p1.X === 'function' ? p1.X() : 0;
                const x2 = p2 && typeof p2.X === 'function' ? p2.X() : 0;
                return (x1 + x2) / 2;
              },
              () => {
                const p1 = resolvePoint(id1.trim());
                const p2 = resolvePoint(id2.trim());
                const y1 = p1 && typeof p1.Y === 'function' ? p1.Y() : 0;
                const y2 = p2 && typeof p2.Y === 'function' ? p2.Y() : 0;
                return (y1 + y2) / 2;
              },
            ];
          }

          // 5. reflection(parent, axis)
          const refMatch = !hasConstraint && cStr.match(/^reflection\(([^,]+)(?:,\s*([^)]+))?\)$/);
          if (refMatch) {
            hasConstraint = true;
            const [, parentId, axis = 'y'] = refMatch;
            coords = [
              () => {
                const p = resolvePoint(parentId.trim());
                const px = p && typeof p.X === 'function' ? p.X() : (ptDef.x ?? 0);
                return axis.includes('x') ? px : -px;
              },
              () => {
                const p = resolvePoint(parentId.trim());
                const py = p && typeof p.Y === 'function' ? p.Y() : (ptDef.y ?? 0);
                return axis.includes('x') ? -py : py;
              },
            ];
          }

          // 6. homothety(center, parent, kParam)
          const homoMatch = !hasConstraint && cStr.match(/^homothety\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/);
          if (homoMatch) {
            hasConstraint = true;
            const [, centerId, parentId, kKey] = homoMatch;
            coords = [
              () => {
                const center = resolvePoint(centerId.trim());
                const parent = resolvePoint(parentId.trim());
                const cx = center && typeof center.X === 'function' ? center.X() : 0;
                const px = parent && typeof parent.X === 'function' ? parent.X() : (ptDef.x ?? 0);
                const k = Number(paramValues[kKey.trim()] ?? 1);
                return cx + (px - cx) * k;
              },
              () => {
                const center = resolvePoint(centerId.trim());
                const parent = resolvePoint(parentId.trim());
                const cy = center && typeof center.Y === 'function' ? center.Y() : 0;
                const py = parent && typeof parent.Y === 'function' ? parent.Y() : (ptDef.y ?? 0);
                const k = Number(paramValues[kKey.trim()] ?? 1);
                return cy + (py - cy) * k;
              },
            ];
          }

          // 7. vector_closed(pA, pB, pC)
          const vecMatch = !hasConstraint && cStr.match(/^vector_closed\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/);
          if (vecMatch) {
            hasConstraint = true;
            const [, idA, idB, idC] = vecMatch;
            coords = [
              () => {
                const pA = resolvePoint(idA.trim());
                const pB = resolvePoint(idB.trim());
                const pC = resolvePoint(idC.trim());
                const xA = pA && typeof pA.X === 'function' ? pA.X() : 0;
                const xB = pB && typeof pB.X === 'function' ? pB.X() : 0;
                const xC = pC && typeof pC.X === 'function' ? pC.X() : 0;
                return xA + (xC - xB);
              },
              () => {
                const pA = resolvePoint(idA.trim());
                const pB = resolvePoint(idB.trim());
                const pC = resolvePoint(idC.trim());
                const yA = pA && typeof pA.Y === 'function' ? pA.Y() : 0;
                const yB = pB && typeof pB.Y === 'function' ? pB.Y() : 0;
                const yC = pC && typeof pC.Y === 'function' ? pC.Y() : 0;
                return yA + (yC - yB);
              },
            ];
          }

          // 8. centroid(A, B, C)
          const centMatch = !hasConstraint && cStr.match(/^centroid\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/);
          if (centMatch) {
            hasConstraint = true;
            const [, idA, idB, idC] = centMatch;
            coords = [
              () => {
                const pA = resolvePoint(idA.trim());
                const pB = resolvePoint(idB.trim());
                const pC = resolvePoint(idC.trim());
                return ((pA?.X?.() ?? 0) + (pB?.X?.() ?? 0) + (pC?.X?.() ?? 0)) / 3;
              },
              () => {
                const pA = resolvePoint(idA.trim());
                const pB = resolvePoint(idB.trim());
                const pC = resolvePoint(idC.trim());
                return ((pA?.Y?.() ?? 0) + (pB?.Y?.() ?? 0) + (pC?.Y?.() ?? 0)) / 3;
              },
            ];
          }

          // 9. Coordinate assignments like x=..., y=...
          if (!hasConstraint && cStr.includes('=')) {
            const parts = cStr.split(',').map((s: string) => s.trim());
            const evalExpr = (expr: string) => {
              if (expr === '0') return 0;
              if (paramValues[expr] !== undefined) return Number(paramValues[expr]);
              if (expr.includes('/2')) {
                const key = expr.replace('/2', '').replace('-', '').trim();
                const sign = expr.startsWith('-') ? -1 : 1;
                return (sign * Number(paramValues[key] ?? 0)) / 2;
              }
              if (expr.endsWith('.x')) {
                const p = resolvePoint(expr.split('.')[0]);
                return p && typeof p.X === 'function' ? p.X() : (ptDef.x ?? 0);
              }
              if (expr.endsWith('.y')) {
                const p = resolvePoint(expr.split('.')[0]);
                return p && typeof p.Y === 'function' ? p.Y() : (ptDef.y ?? 0);
              }
              if (expr.includes('hypot_c*cos(angle_A)')) {
                const c = Number(paramValues['hypot_c'] ?? 5);
                const a = Number(paramValues['angle_A'] ?? 30);
                return c * Math.cos((a * Math.PI) / 180);
              }
              if (expr.includes('hypot_c*sin(angle_A)')) {
                const c = Number(paramValues['hypot_c'] ?? 5);
                const a = Number(paramValues['angle_A'] ?? 30);
                return c * Math.sin((a * Math.PI) / 180);
              }
              return Number(paramValues[expr] ?? ptDef.x ?? 0);
            };

            let xValFn: (() => number) | null = null;
            let yValFn: (() => number) | null = null;
            parts.forEach((p: string) => {
              const [lhs, rhs] = p.split('=').map((s: string) => s.trim());
              if (lhs === 'x') xValFn = () => evalExpr(rhs);
              if (lhs === 'y') yValFn = () => evalExpr(rhs);
            });
            if (xValFn || yValFn) {
              hasConstraint = true;
              coords = [
                xValFn || (() => ptDef.x ?? 0),
                yValFn || (() => ptDef.y ?? 0),
              ];
            }
          }
        }

        const isPtFixed = hasConstraint || isCenter || isDistractor || ptDef.isFixed === true;

        const pt = board.create('point', coords, {
          name: showLabel ? (ptDef.name || ptDef.id) : '',
          withLabel: showLabel,
          visible: !isDistractor,
          size: isCenter ? 6 : Math.max(ptDef.size || 5, 6),
          fillColor: ptColor,
          strokeColor: '#ffffff',
          strokeWidth: 2,
          fixed: isPtFixed,
          highlightSize: 24,
          snapSizeX: 24,
          snapSizeY: 24,
          label: {
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 'bold',
            offset: [-6, 14],
            strokeColor: 'none',
          },
        });
        elements[ptDef.id] = pt;

        if (!isPtFixed) {
          pt.on('down', () => {
            isDraggingRef.current = true;
          });
          pt.on('drag', () => {
            isDraggingRef.current = true;
            if (
              (tpl.startsWith('number_axis') ||
              tpl.includes('number_line') ||
              tpl === 'axis' ||
              tpl === 'number_axis_dynamic') &&
              config.sandbox_id !== 'SB-QUADRATIC-VERTICAL-HEIGHT' &&
              !tpl.includes('quadratic') &&
              !tpl.includes('parabola')
            ) {
              const coordsMode =
                typeof window !== 'undefined' && (window as any).JXG?.COORDS_BY_USER !== undefined
                  ? (window as any).JXG.COORDS_BY_USER
                  : typeof JXG?.COORDS_BY_USER !== 'undefined'
                  ? JXG.COORDS_BY_USER
                  : 1;
              pt.setPosition(coordsMode, [pt.X(), 0]);
            }

            // 针对 SB-QUADRATIC-VERTICAL-HEIGHT 铅垂高模型动点 P 约束
            if (config.sandbox_id === 'SB-QUADRATIC-VERTICAL-HEIGHT' || tpl.includes('vertical_height')) {
              if (ptDef.id === 'P' || ptDef.name?.includes('P')) {
                const kScale = Number(paramValues['k_scale'] ?? paramValues['a'] ?? -1);
                const xP = Math.max(-2, Math.min(2, pt.X()));
                const yP = Math.max(0, kScale * xP * xP + 4);
                const coordsMode =
                  typeof window !== 'undefined' && (window as any).JXG?.COORDS_BY_USER !== undefined
                    ? (window as any).JXG.COORDS_BY_USER
                    : typeof JXG?.COORDS_BY_USER !== 'undefined'
                    ? JXG.COORDS_BY_USER
                    : 1;
                pt.setPosition(coordsMode, [xP, yP]);
                if (elements['Q']) {
                  elements['Q'].setPosition(coordsMode, [xP, 0]);
                }
              }
            }

            // 针对 LM-7A-02 线段双中点载体动点 P 约束与双中点动态联动
            if (tpl === 'geometry_segment_midpoint_bisector' || (config.sandbox_id || '').includes('LM-7A-02')) {
              if (ptDef.id === 'P' || ptDef.name?.includes('P')) {
                const lenAB = Number(paramValues['len_ab'] ?? 8.0);
                const halfLen = lenAB / 2;
                const safeMin = -halfLen + 0.2;
                const safeMax = halfLen - 0.2;
                const curX = Math.max(safeMin, Math.min(safeMax, pt.X()));
                const coordsMode =
                  typeof window !== 'undefined' && (window as any).JXG?.COORDS_BY_USER !== undefined
                    ? (window as any).JXG.COORDS_BY_USER
                    : typeof JXG?.COORDS_BY_USER !== 'undefined'
                    ? JXG.COORDS_BY_USER
                    : 1;
                pt.setPosition(coordsMode, [curX, 0]);
                if (elements['M1']) {
                  elements['M1'].setPosition(coordsMode, [(-halfLen + curX) / 2, 0]);
                }
                if (elements['M2']) {
                  elements['M2'].setPosition(coordsMode, [(curX + halfLen) / 2, 0]);
                }
              }
            }
            if (onParamChangeRef.current && canInvertParam(tpl, ptDef, isCircleTemplate, config)) {
              handleParamInversion(
                tpl,
                ptDef,
                pt,
                isCircleTemplate,
                paramValues,
                dragPoints,
                elements,
                board,
                onParamChangeRef.current,
                config
              );
            }
            updateInvariants();
          });
          pt.on('up', () => {
            isDraggingRef.current = false;
            updateInvariants();
          });
        }
      });

      const sid = config.sandbox_id || '';
      const primaryPoints = Object.keys(elements)
        .filter((k) => elements[k].elType === 'point')
        .map((k) => elements[k]);

      // 5. 10 大类专属数学图元拓扑分发
      // (一) 圆图元类 (标准圆、圆周角、垂径定理、切线长)
      if (
        isCircleTemplate &&
        !tpl.includes('incircle') &&
        !tpl.includes('sector') &&
        sid !== 'SB-KP076' &&
        sid !== 'SB-KP077'
      ) {
        const centerPt = elements['O'] || elements['Origin'] || primaryPoints[0];
        const radiusVal = Number(
          paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? 4
        );

        if (centerPt) {
          if (xrayActive) {
            board.create('circle', [centerPt, radiusVal], {
              strokeColor: '#0071e3',
              strokeWidth: 6,
              strokeOpacity: 0.4,
              fillColor: 'none',
            });
          }
          board.create('circle', [centerPt, radiusVal], {
            strokeColor: '#38bdf8',
            strokeWidth: xrayActive ? 3.5 : 2.2,
            fillColor: 'rgba(56, 189, 248, 0.08)',
          });
        }

        // 圆周角模型 (SB-KP073 / inscribed)
        if (tpl.includes('inscribed') || sid === 'SB-KP073') {
          if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#0071e3', strokeWidth: 2 });
          if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#0071e3', strokeWidth: 2 });
          if (elements['C'] && elements['A']) board.create('segment', [elements['C'], elements['A']], { strokeColor: '#818cf8', strokeWidth: 2.2 });
          if (elements['C'] && elements['B']) board.create('segment', [elements['C'], elements['B']], { strokeColor: '#818cf8', strokeWidth: 2.2 });
          if (elements['A'] && elements['B']) board.create('segment', [elements['A'], elements['B']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
        }
        // 垂径定理 (chord / SB-KP074)
        else if (tpl.includes('chord') || sid === 'SB-KP074') {
          if (elements['A'] && elements['B']) board.create('segment', [elements['A'], elements['B']], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
          const midOrD = elements['M'] || elements['D'];
          if (elements['O'] && midOrD) board.create('segment', [elements['O'], midOrD], { strokeColor: '#f59e0b', strokeWidth: 2 });
          if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
        }
        // 切线与切线长 (tangent / SB-KP072)
        else if (tpl.includes('tangent') || sid === 'SB-KP072') {
          if (elements['P'] && elements['A']) board.create('segment', [elements['P'], elements['A']], { strokeColor: '#34c759', strokeWidth: 2.5 });
          if (elements['P'] && elements['B']) board.create('segment', [elements['P'], elements['B']], { strokeColor: '#34c759', strokeWidth: 2.5 });
          if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          if (elements['O'] && elements['P']) board.create('segment', [elements['O'], elements['P']], { strokeColor: '#94a3b8', strokeWidth: 1.5, dash: 3 });
        }
        // 直线与圆位置关系 (SB-KP071)
        else if (sid === 'SB-KP071') {
          if (elements['P1'] && elements['P2']) board.create('line', [elements['P1'], elements['P2']], { strokeColor: '#818cf8', strokeWidth: 2 });
          if (elements['O'] && elements['H']) board.create('segment', [elements['O'], elements['H']], { strokeColor: '#f59e0b', strokeWidth: 2, dash: 2 });
        }
      }
      // 三角形内切圆 (SB-KP076 / incircle) - 独立专有分支
      else if (tpl.includes('incircle') || sid === 'SB-KP076') {
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptC = elements['C'];
        const ptI = elements['I'];
        const ptD = elements['D'];

        if (ptA && ptB && ptC) {
          board.create('polygon', [ptA, ptB, ptC], {
            borders: { strokeColor: '#0071e3', strokeWidth: 2.5 },
            fillColor: '#0071e3',
            fillOpacity: 0.12,
          });
        }
        if (ptI && ptD) {
          board.create('segment', [ptI, ptD], { strokeColor: '#f59e0b', strokeWidth: 1.8, dash: 2 });
          board.create('circle', [ptI, ptD], {
            strokeColor: '#f59e0b',
            strokeWidth: 2.2,
            fillColor: 'rgba(245, 158, 11, 0.15)',
          });
        }
      }
      // 扇形度量 (SB-KP077 / sector_metric) - 独立专有分支
      else if (tpl.includes('sector') || sid === 'SB-KP077') {
        if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#38bdf8', strokeWidth: 2 });
        if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#38bdf8', strokeWidth: 2 });
        if (elements['O'] && elements['A'] && elements['B']) {
          board.create('sector', [elements['O'], elements['A'], elements['B']], {
            strokeColor: '#38bdf8',
            strokeWidth: 2.2,
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
          });
        }
      }
      // (二) 数轴动力学与实数夹逼类
      else if (
        tpl.startsWith('number_axis') ||
        tpl.includes('number_line') ||
        tpl === 'axis' ||
        tpl === 'number_axis_dynamic'
      ) {
        if (!isAxis) {
          board.create('axis', [[0, 0], [1, 0]], {
            strokeColor: '#475569',
            ticks: { drawZero: true, strokeColor: '#475569', label: { color: '#cbd5e1', fontSize: 11 } },
          });
        }
        // 若存在两个点，连接两点形成区间距离线段
        if (elements['A'] && elements['B']) {
          board.create('segment', [elements['A'], elements['B']], {
            strokeColor: '#38bdf8',
            strokeWidth: 3.5,
          });
        } else if (primaryPoints.length >= 2) {
          board.create('segment', [primaryPoints[0], primaryPoints[1]], {
            strokeColor: '#38bdf8',
            strokeWidth: 3.5,
          });
        }
      }
      // (三) 二次函数与韦达模型
      else if (tpl.includes('quadratic') || tpl.includes('parabola') || tpl.includes('vieta')) {
        const isVertexForm =
          sid === 'SB-KP039' ||
          tpl.includes('vertex') ||
          paramValues['param_h'] !== undefined ||
          paramValues['h'] !== undefined;

        const isVerticalHeight =
          sid === 'SB-QUADRATIC-VERTICAL-HEIGHT' || tpl.includes('vertical_height');

        const a = Number(
          paramValues['k_scale'] ??
          paramValues['param_a'] ??
          paramValues['a'] ??
          currentScope['a'] ??
          (isVerticalHeight ? -1 : 1)
        );
        let hVal = 0;
        let kVal = 0;
        let fn: (x: number) => number;
        let symX: number;
        let vertY: number;

        if (isVertexForm) {
          hVal = Number(paramValues['param_h'] ?? paramValues['h'] ?? 2);
          kVal = Number(paramValues['param_k'] ?? paramValues['k'] ?? -3);
          fn = (x: number) => a * (x - hVal) * (x - hVal) + kVal;
          symX = hVal;
          vertY = kVal;
        } else if (isVerticalHeight) {
          fn = (x: number) => a * x * x + 4;
          symX = 0;
          vertY = 4;
        } else {
          const b = Number(currentScope['b'] ?? 0);
          const c = Number(currentScope['c'] ?? 0);
          fn = (x: number) => a * x * x + b * x + c;
          symX = a !== 0 ? -b / (2 * a) : 0;
          vertY = a !== 0 ? (4 * a * c - b * b) / (4 * a) : c;
        }

        // 1. 抛物线连续函数解析式
        board.create('functiongraph', [fn, -20, 20], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });

        // 2. 对称轴虚线 x = symX
        board.create('line', [[symX, -20], [symX, 20]], {
          strokeColor: '#94a3b8',
          strokeWidth: 1.5,
          dash: 2,
        });

        // 顶点 V(symX, vertY)
        if (!elements['p_vertex'] && !elements['V'] && !elements['pt_v'] && !isVerticalHeight) {
          board.create('point', [symX, vertY], {
            name: 'V',
            size: 5,
            fillColor: '#f59e0b',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
        }

        // 特别支持 SB-QUADRATIC-VERTICAL-HEIGHT 割线、三角形与铅垂高
        if (isVerticalHeight) {
          const ptA = elements['A'];
          const ptB = elements['B'];
          const ptP = elements['P'];
          const ptQ = elements['Q'];

          // 绘制割线 AB
          if (ptA && ptB) {
            board.create('segment', [ptA, ptB], {
              strokeColor: '#38bdf8',
              strokeWidth: 2.5,
            });
          }

          // 绘制割线三角形 △PAB
          if (ptA && ptP && ptB) {
            board.create('polygon', [ptA, ptP, ptB], {
              borders: { strokeColor: '#38bdf8', strokeWidth: 2 },
              fillColor: '#38bdf8',
              fillOpacity: 0.22,
            });
          }

          // 绘制铅垂高线段 PQ (虚线橙色)
          if (ptP && ptQ) {
            board.create('segment', [ptP, ptQ], {
              strokeColor: '#f59e0b',
              strokeWidth: 2.5,
              dash: 2,
            });
          }
        }

        // 水平对称跨度虚线
        const symPt1 = elements['p_sym1'] || elements['P1'];
        const symPt2 = elements['p_sym2'] || elements['P2'];
        if (symPt1 && symPt2) {
          board.create('segment', [symPt1, symPt2], {
            strokeColor: '#f59e0b',
            strokeWidth: 1.8,
            dash: 2,
          });
        }

        // 3. 判别式条件显隐交点与弦长线段
        const delta = currentScope['Delta'];
        if (!isVertexForm && !isVerticalHeight && delta > 0 && a !== 0) {
          const b = Number(currentScope['b'] ?? 0);
          const x1 = (-b - Math.sqrt(delta)) / (2 * a);
          const x2 = (-b + Math.sqrt(delta)) / (2 * a);
          const p1 = board.create('point', [x1, 0], {
            name: 'x1',
            size: 5,
            fillColor: '#f43f5e',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
          const p2 = board.create('point', [x2, 0], {
            name: 'x2',
            size: 5,
            fillColor: '#f43f5e',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
          board.create('segment', [p1, p2], {
            strokeColor: '#a855f7',
            strokeWidth: 3,
          });
        } else if (!isVertexForm && !isVerticalHeight && delta === 0 && a !== 0) {
          const b = Number(currentScope['b'] ?? 0);
          const x0 = -b / (2 * a);
          board.create('point', [x0, 0], {
            name: 'x',
            size: 5,
            fillColor: '#f43f5e',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
        }
      }
      // (四) 反比例函数与面积不变性
      else if (tpl.includes('inverse') || tpl.includes('hyperbola')) {
        const invK = Number(paramValues['inv_k'] ?? paramValues['rect_k'] ?? paramValues['k'] ?? 6);
        const tVal = Number(paramValues['x_pos'] ?? paramValues['x_pt'] ?? paramValues['param_t'] ?? 3);

        // 双曲线两支
        board.create('functiongraph', [(x: number) => (x < 0 ? invK / x : NaN), -20, -0.05], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });
        board.create('functiongraph', [(x: number) => (x > 0 ? invK / x : NaN), 0.05, 20], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });

        // 曲线吸附动点 P(t, k/t)
        const ptX = tVal !== 0 ? tVal : 1;
        const ptY = invK / ptX;
        const ptP = board.create('point', [ptX, ptY], {
          name: 'P',
          size: 5,
          fillColor: '#f59e0b',
          strokeColor: '#ffffff',
          strokeWidth: 2,
          fixed: true,
        });

        // 过 P 向双轴作垂线构造矩形高亮面积
        const pXProj = board.create('point', [ptX, 0], { name: '', size: 0, fixed: true, visible: false });
        const pYProj = board.create('point', [0, ptY], { name: '', size: 0, fixed: true, visible: false });
        const pOrigin = board.create('point', [0, 0], { name: '', size: 0, fixed: true, visible: false });

        board.create('polygon', [pOrigin, pXProj, ptP, pYProj], {
          fillColor: '#38bdf8',
          fillOpacity: 0.2,
          borders: { strokeColor: '#38bdf8', strokeWidth: 1.5, dash: 2 },
        });

        // 中心对称点 P'(-t, -k/t)
        const ptPPrime = board.create('point', [-ptX, -ptY], {
          name: "P'",
          size: 4,
          fillColor: '#818cf8',
          strokeColor: '#ffffff',
          strokeWidth: 1.5,
          fixed: true,
        });
        board.create('segment', [ptP, ptPPrime], {
          strokeColor: '#94a3b8',
          strokeWidth: 1.2,
          dash: 3,
        });
      }
      // (五) 一次函数与正比例函数
      else if (tpl.includes('linear') || tpl.includes('direct')) {
        const ptA = elements['pA'] || elements['A'];
        const ptB = elements['pB'] || elements['B'];

        if (ptA && ptB && (sid === 'SB-KP033' || sid === 'SB-KP034' || tpl.includes('linear_solve'))) {
          // 待定系数法：由两动点 A(x₁, y₁) 与 B(x₂, y₂) 动态确定并绘制唯一直线
          board.create('line', [ptA, ptB], {
            strokeColor: '#38bdf8',
            strokeWidth: xrayActive ? 3.5 : 2.5,
          });
          // 动点连线段与斜率直角三角形指示
          board.create('segment', [ptA, ptB], {
            strokeColor: '#f59e0b',
            strokeWidth: 2,
          });
        } else {
          const k1 = Number(paramValues['slope_k'] ?? paramValues['k1'] ?? paramValues['k_prop'] ?? 1);
          const b1 = Number(paramValues['intercept_b'] ?? paramValues['b1'] ?? 0);
          board.create('functiongraph', [(x: number) => k1 * x + b1, -20, 20], {
            strokeColor: '#38bdf8',
            strokeWidth: xrayActive ? 3.5 : 2.5,
          });

          // 截距三角形 △AOB
          const pIntX = elements['p_int_x'];
          const pIntY = elements['p_int_y'];
          const pO = elements['o'] || elements['O'];
          if (pIntX && pIntY && pO) {
            board.create('polygon', [pO, pIntX, pIntY], {
              borders: { strokeColor: '#38bdf8', strokeWidth: 1.5, dash: 2 },
              fillColor: '#38bdf8',
              fillOpacity: 0.18,
            });
          }

          if (paramValues['slope_k2'] !== undefined || paramValues['k2'] !== undefined) {
            const k2 = Number(paramValues['slope_k2'] ?? paramValues['k2'] ?? -1);
            const b2 = Number(paramValues['intercept_b2'] ?? paramValues['b2'] ?? 3);
            board.create('functiongraph', [(x: number) => k2 * x + b2, -20, 20], {
              strokeColor: '#818cf8',
              strokeWidth: 2,
            });

            // 联立求解交点
            if (Math.abs(k1 - k2) > 1e-6) {
              const interX = (b2 - b1) / (k1 - k2);
              const interY = k1 * interX + b1;
              board.create('point', [interX, interY], {
                name: 'P',
                size: 5,
                fillColor: '#f59e0b',
                strokeColor: '#ffffff',
                strokeWidth: 2,
                fixed: true,
              });
            }
          }
        }
      }
      // (六) 勾股定理与赵爽弦图 (SB-KP057 / geometry_pythagorean_template)
      else if (sid === 'SB-KP057' || tpl === 'geometry_pythagorean_template') {
        const viewMode = Number(paramValues['view_mode'] ?? 1);
        const legA = Number(paramValues['leg_a'] ?? 4);
        const legB = Number(paramValues['leg_b'] ?? 3);

        if (viewMode === 2) {
          // 赵爽弦图模式
          // 外接大正方形边框 (0,0) -> (b+a,0) -> (b+a, b+a) -> (0, b+a)
          board.create('polygon', [[0, 0], [legB + legA, 0], [legB + legA, legB + legA], [0, legB + legA]], {
            borders: { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 },
            fillColor: 'none',
          });
          // 4 个全等直角三角形
          const tTriangles = [
            [[0, 0], [legB, 0], [legB, legA]],
            [[legB + legA, 0], [legB + legA, legB], [legB, legB]],
            [[legB + legA, legB + legA], [legA, legB + legA], [legA, legB]],
            [[0, legB + legA], [0, legA], [legB, legA]],
          ];
          tTriangles.forEach((pts) => {
            board.create('polygon', pts, {
              borders: { strokeColor: '#38bdf8', strokeWidth: 2 },
              fillColor: '#38bdf8',
              fillOpacity: 0.22,
            });
          });
          // 中心小正方形：边长 |b - a|
          board.create('polygon', [[legA, legA], [legB, legA], [legB, legB], [legA, legB]], {
            borders: { strokeColor: '#f59e0b', strokeWidth: 2 },
            fillColor: '#f59e0b',
            fillOpacity: 0.35,
          });
        } else {
          // 三方外挂正方形模式 (viewMode === 1)
          const ptC = elements['C'] || elements['O'] || board.create('point', [0, 0], { visible: false, fixed: true });
          const ptB = elements['B'] || board.create('point', [legA, 0], { visible: false, fixed: true });
          const ptA = elements['A'] || board.create('point', [0, legB], { visible: false, fixed: true });

          // 核心直角三角形 ABC
          board.create('polygon', [ptC, ptB, ptA], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
          });
          // 直角边 a 外挂 a×a 正方形 (0,0) -> (a,0) -> (a,-a) -> (0,-a)
          board.create('polygon', [[0, 0], [legA, 0], [legA, -legA], [0, -legA]], {
            borders: { strokeColor: '#f43f5e', strokeWidth: 1.8, dash: 2 },
            fillColor: '#f43f5e',
            fillOpacity: 0.15,
          });
          // 直角边 b 外挂 b×b 正方形 (0,0) -> (0,b) -> (-b,b) -> (-b,0)
          board.create('polygon', [[0, 0], [0, legB], [-legB, legB], [-legB, 0]], {
            borders: { strokeColor: '#a855f7', strokeWidth: 1.8, dash: 2 },
            fillColor: '#a855f7',
            fillOpacity: 0.15,
          });
          // 斜边 c 外挂 c×c 正方形 B(a,0) -> A(0,b) -> (b, b+a) -> (a+b, a)
          board.create('polygon', [[legA, 0], [0, legB], [legB, legB + legA], [legA + legB, legA]], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2, dash: 2 },
            fillColor: '#38bdf8',
            fillOpacity: 0.15,
          });
        }
      }
      // (七) 等腰三角形与对称折叠 (SB-KP053 / geometry_isosceles_template)
      else if (sid === 'SB-KP053' || tpl.includes('isosceles')) {
        const baseW = Number(paramValues['base_w'] ?? 6);
        const foldT = Number(paramValues['fold_t'] ?? 0);
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptC = elements['C'];
        const ptD = elements['D'];

        if (ptA && ptB && ptC) {
          board.create('polygon', [ptA, ptB, ptC], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
          });
        }
        if (ptA && ptD) {
          board.create('segment', [ptA, ptD], {
            strokeColor: '#f59e0b',
            strokeWidth: 2,
            dash: 2,
          });
        }
        if (foldT > 0 && ptA && ptD) {
          const halfW = baseW / 2;
          const foldX = halfW * Math.cos(foldT * Math.PI);
          const ptCFold = board.create('point', [foldX, 0], {
            name: "C'",
            size: 4,
            fillColor: '#f59e0b',
            strokeColor: '#ffffff',
            fixed: true,
          });
          board.create('polygon', [ptA, ptD, ptCFold], {
            borders: { strokeColor: '#f59e0b', strokeWidth: 2, dash: 2 },
            fillColor: '#f59e0b',
            fillOpacity: 0.25,
          });
        }
      }
      // (八) 等边三角形与四心双圆 (SB-KP055 / geometry_equilateral_template)
      else if (sid === 'SB-KP055' || tpl.includes('equilateral')) {
        const sideA = Number(paramValues['side_a'] ?? 6);
        const showDual = Number(paramValues['show_dual_circles'] ?? 1);
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptC = elements['C'];

        if (ptA && ptB && ptC) {
          board.create('polygon', [ptA, ptB, ptC], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
          });
        }

        if (showDual > 0) {
          const centerPt = elements['O'] || board.create('point', [0, 0], { name: 'O', size: 3, fillColor: '#cbd5e1', fixed: true });
          const R = sideA / Math.sqrt(3);
          const r = sideA / (2 * Math.sqrt(3));
          board.create('circle', [centerPt, R], {
            strokeColor: '#38bdf8',
            strokeWidth: 2,
            dash: 2,
            fillColor: 'rgba(56, 189, 248, 0.08)',
          });
          board.create('circle', [centerPt, r], {
            strokeColor: '#f59e0b',
            strokeWidth: 2,
            dash: 2,
            fillColor: 'rgba(245, 158, 11, 0.08)',
          });
        }
      }
      // (九) 直角三角形斜边动点与垂线 (SB-KP056 / geometry_right_triangle_template)
      else if (sid === 'SB-KP056' || (tpl.includes('right_triangle') && paramValues['point_t'] !== undefined)) {
        const ptC = elements['C'];
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptM = elements['M'];

        if (ptC && ptA && ptB) {
          board.create('polygon', [ptC, ptB, ptA], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
          });
        }
        if (ptM && ptC) {
          const projY = board.create('point', [0, () => ptM.Y()], { visible: false, fixed: true });
          const projX = board.create('point', [() => ptM.X(), 0], { visible: false, fixed: true });
          board.create('segment', [ptM, projY], { strokeColor: '#f59e0b', strokeWidth: 1.8, dash: 2 });
          board.create('segment', [ptM, projX], { strokeColor: '#f59e0b', strokeWidth: 1.8, dash: 2 });
          board.create('segment', [ptC, ptM], { strokeColor: '#818cf8', strokeWidth: 2 });
        }
      }
      // (十) 中点四边形相变与对角线 (SB-KP068 / geometry_midpoint_quad_template)
      else if (sid === 'SB-KP068' || tpl.includes('midpoint_quad')) {
        const ptA = elements['p_A'] || elements['A'];
        const ptB = elements['p_B'] || elements['B'];
        const ptC = elements['p_C'] || elements['C'];
        const ptD = elements['p_D'] || elements['D'];

        if (ptA && ptB && ptC && ptD) {
          // 原四边形 ABCD
          board.create('polygon', [ptA, ptB, ptC, ptD], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.15,
          });

          // 四边中点 M1, M2, M3, M4
          const m1 = board.create('midpoint', [ptA, ptB], { name: 'M1', size: 3, fillColor: '#f59e0b', strokeColor: '#ffffff' });
          const m2 = board.create('midpoint', [ptB, ptC], { name: 'M2', size: 3, fillColor: '#f59e0b', strokeColor: '#ffffff' });
          const m3 = board.create('midpoint', [ptC, ptD], { name: 'M3', size: 3, fillColor: '#f59e0b', strokeColor: '#ffffff' });
          const m4 = board.create('midpoint', [ptD, ptA], { name: 'M4', size: 3, fillColor: '#f59e0b', strokeColor: '#ffffff' });

          // 中点四边形
          board.create('polygon', [m1, m2, m3, m4], {
            borders: { strokeColor: '#f59e0b', strokeWidth: 2 },
            fillColor: '#f59e0b',
            fillOpacity: 0.22,
          });

          // 对角线虚线
          const showDiags = Number(paramValues['show_diags'] ?? 1);
          if (showDiags > 0) {
            board.create('segment', [ptA, ptC], { strokeColor: '#a855f7', strokeWidth: 2, dash: 2 });
            board.create('segment', [ptB, ptD], { strokeColor: '#a855f7', strokeWidth: 2, dash: 2 });
          }
        }
      }
      // (十一) 几何变换动力学 (SB-KP079, SB-KP080, SB-KP081, SB-KP082)
      else if (sid === 'SB-KP079' || tpl.includes('reflection')) {
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptAP = elements['A_prime'] || elements["A'"];
        const ptBP = elements['B_prime'] || elements["B'"];
        const x0 = Number(paramValues['axis_pos'] ?? 0);
        const phi = (Number(paramValues['axis_phi'] ?? 15) * Math.PI) / 180;

        if (ptA && ptB) board.create('segment', [ptA, ptB], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
        if (ptAP && ptBP) board.create('segment', [ptAP, ptBP], { strokeColor: '#818cf8', strokeWidth: 2.5 });
        if (ptA && ptAP) board.create('segment', [ptA, ptAP], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
        if (ptB && ptBP) board.create('segment', [ptB, ptBP], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });

        const dirX = Math.cos(phi);
        const dirY = Math.sin(phi);
        board.create('line', [[x0, 0], [x0 + dirX, dirY]], {
          strokeColor: '#f59e0b',
          strokeWidth: 2,
          dash: 2,
        });
      }
      else if (sid === 'SB-KP080' || tpl.includes('translation_carrier')) {
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptAP = elements['A_prime'] || elements["A'"];
        const ptBP = elements['B_prime'] || elements["B'"];

        if (ptA && ptB) board.create('segment', [ptA, ptB], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
        if (ptAP && ptBP) board.create('segment', [ptAP, ptBP], { strokeColor: '#818cf8', strokeWidth: 2.5 });
        if (ptA && ptAP) board.create('arrow', [ptA, ptAP], { strokeColor: '#f59e0b', strokeWidth: 1.8, dash: 2 });
        if (ptB && ptBP) board.create('arrow', [ptB, ptBP], { strokeColor: '#f59e0b', strokeWidth: 1.8, dash: 2 });
      }
      else if (sid === 'SB-KP081' || tpl.includes('rotation_hand_in_hand')) {
        const ptO = elements['O'];
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptAP = elements['A_prime'] || elements["A'"];
        const ptBP = elements['B_prime'] || elements["B'"];

        if (ptO && ptA && ptB) {
          board.create('polygon', [ptO, ptA, ptB], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.2 },
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
          });
        }
        if (ptO && ptAP && ptBP) {
          board.create('polygon', [ptO, ptAP, ptBP], {
            borders: { strokeColor: '#818cf8', strokeWidth: 2.2 },
            fillColor: '#818cf8',
            fillOpacity: 0.18,
          });
        }
        if (ptA && ptAP) board.create('segment', [ptA, ptAP], { strokeColor: '#f59e0b', strokeWidth: 1.5, dash: 2 });
        if (ptB && ptBP) board.create('segment', [ptB, ptBP], { strokeColor: '#f59e0b', strokeWidth: 1.5, dash: 2 });
      }
      else if (sid === 'SB-KP082' || tpl.includes('central_sym')) {
        const ptO = elements['O'];
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptAP = elements['A_prime'] || elements["A'"];
        const ptBP = elements['B_prime'] || elements["B'"];

        if (ptA && ptB) board.create('segment', [ptA, ptB], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
        if (ptAP && ptBP) board.create('segment', [ptAP, ptBP], { strokeColor: '#818cf8', strokeWidth: 2.5 });
        if (ptO && ptA && ptAP) board.create('segment', [ptA, ptAP], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
        if (ptO && ptB && ptBP) board.create('segment', [ptB, ptBP], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
      }
      // (十二) 二次函数应用建模 (SB-KP043 / quadratic_modeling)
      else if (sid === 'SB-KP043' || tpl.includes('quadratic_modeling')) {
        const aVal = Number(paramValues['param_a'] ?? -0.5);
        board.create('functiongraph', [(x: number) => aVal * (x + 2) * (x - 4), -5, 7], {
          strokeColor: '#38bdf8',
          strokeWidth: 2.5,
        });
        const ptP = elements['p_P'] || elements['P'];
        if (ptP) {
          const ptQ = board.create('point', [() => ptP.X(), 0], { visible: false, fixed: true });
          board.create('segment', [ptP, ptQ], { strokeColor: '#f59e0b', strokeWidth: 2, dash: 2 });
        }
      }
      // (十三) 平行线与几何点线角 (SB-KP048, 044, 045, 046, 047, 049, 085)
      else if (sid === 'SB-KP048' || tpl === 'geometry_parallel_template' || (tpl.includes('parallel') && !tpl.includes('parallelogram'))) {
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptC = elements['C'];
        const ptD = elements['D'];
        const ptP1 = elements['P1'];
        const ptP2 = elements['P2'];

        if (ptA && ptB) board.create('line', [ptA, ptB], { strokeColor: '#38bdf8', strokeWidth: 2 });
        if (ptC && ptD) board.create('line', [ptC, ptD], { strokeColor: '#38bdf8', strokeWidth: 2 });
        if (ptP1 && ptP2) board.create('line', [ptP1, ptP2], { strokeColor: '#f59e0b', strokeWidth: 2 });
      }
      else if (sid === 'SB-KP044' || tpl.includes('point_line')) {
        const ptO = elements['p_O'] || elements['O'];
        const ptA = elements['p_A'] || elements['A'];
        const ptB = elements['p_B'] || elements['B'];

        if (ptO && ptA) board.create('segment', [ptO, ptA], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
        if (ptO && ptB) board.create('segment', [ptO, ptB], { strokeColor: '#818cf8', strokeWidth: 2.5 });
      }
      else if (sid === 'SB-KP045' || tpl.includes('segment_mid')) {
        const ptA = elements['p_A'] || elements['A'];
        const ptB = elements['p_B'] || elements['B'];
        if (ptA && ptB) board.create('segment', [ptA, ptB], { strokeColor: '#38bdf8', strokeWidth: 3 });
      }
      else if (sid === 'SB-KP046' || tpl.includes('angle_calc')) {
        const ptO = elements['p_O'] || elements['O'];
        const ptA = elements['p_A'] || elements['A'];
        const ptB = elements['p_B'] || elements['B'];
        const ptC = elements['p_C'] || elements['C'];

        if (ptO && ptA) board.create('segment', [ptO, ptA], { strokeColor: '#38bdf8', strokeWidth: 2 });
        if (ptO && ptB) board.create('segment', [ptO, ptB], { strokeColor: '#f59e0b', strokeWidth: 2 });
        if (ptO && ptC) board.create('segment', [ptO, ptC], { strokeColor: '#818cf8', strokeWidth: 2 });
      }
      else if (sid === 'SB-KP047' || tpl.includes('perpendicular')) {
        const ptP = elements['P'];
        const ptC = elements['C'];
        if (ptP && ptC) {
          board.create('segment', [ptP, ptC], { strokeColor: '#f59e0b', strokeWidth: 2.2 });
          const ptH = board.create('point', [() => ptP.X(), 0], { name: 'H', size: 3, fillColor: '#cbd5e1', fixed: true });
          board.create('segment', [ptP, ptH], { strokeColor: '#38bdf8', strokeWidth: 2, dash: 2 });
        }
      }
      else if (sid === 'SB-KP049' || tpl.includes('triangle_sum')) {
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptC = elements['C'];
        if (ptA && ptB && ptC) {
          board.create('polygon', [ptA, ptB, ptC], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
          });
        }
      }
      else if (sid === 'SB-KP085' || tpl.includes('right_triangle_measurement')) {
        const ptC = elements['C'];
        const ptA = elements['A'];
        const ptB = elements['B'];
        if (ptC && ptA && ptB) {
          board.create('polygon', [ptC, ptA, ptB], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
          });
        }
      }
      // (十四) 三角形全等/相似/位似与双三角形拓扑分离
      else if (
        tpl.includes('congruence') ||
        tpl.includes('similarity') ||
        tpl.includes('homothety') ||
        tpl.includes('projection') ||
        tpl.includes('k_shape')
      ) {
        if (tpl.includes('homothety') || sid === 'SB-KP060') {
          const ptO = elements['p_O'] || elements['O'];
          const ptA = elements['p_A'] || elements['A'];
          const ptB = elements['p_B'] || elements['B'];
          const ptAP = elements['p_A_prime'] || elements['A_prime'];
          const ptBP = elements['p_B_prime'] || elements['B_prime'];

          if (ptA && ptB) {
            board.create('segment', [ptA, ptB], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
          }
          if (ptAP && ptBP) {
            board.create('segment', [ptAP, ptBP], { strokeColor: '#818cf8', strokeWidth: 2.5 });
          }
          if (ptO && ptA && ptB) {
            board.create('polygon', [ptO, ptA, ptB], {
              borders: { strokeColor: '#38bdf8', strokeWidth: 1.5, dash: 2 },
              fillColor: '#38bdf8',
              fillOpacity: 0.15,
            });
          }
          if (ptO && ptAP && ptBP) {
            board.create('polygon', [ptO, ptAP, ptBP], {
              borders: { strokeColor: '#818cf8', strokeWidth: 1.5, dash: 2 },
              fillColor: '#818cf8',
              fillOpacity: 0.15,
            });
          }
          // 位似中心 O 到对应点的位似射线 (过位似中心 O 的共线辅助虚线)
          if (ptO && ptA && ptAP) {
            board.create('line', [ptO, ptA], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 3 });
          }
          if (ptO && ptB && ptBP) {
            board.create('line', [ptO, ptB], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 3 });
          }
        } else if ((tpl.includes('congruence_dual') || tpl.includes('dual_triangle') || tpl.includes('congruence_rotation')) && primaryPoints.length >= 6) {
          // 双三角形拓扑分离：前 3 点独立一角 (天蓝)，后 3 点独立一角 (靛紫)
          board.create('polygon', [primaryPoints[0], primaryPoints[1], primaryPoints[2]], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
          });
          board.create('polygon', [primaryPoints[3], primaryPoints[4], primaryPoints[5]], {
            borders: { strokeColor: '#818cf8', strokeWidth: 2.5 },
            fillColor: '#818cf8',
            fillOpacity: 0.2,
          });
        } else if (primaryPoints.length === 3) {
          board.create('polygon', primaryPoints, {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
          });
        }
      }
      // (十五) 特殊四边形与向量从动闭环
      else if (
        tpl.includes('parallelogram') ||
        tpl.includes('rectangle') ||
        tpl.includes('rhombus') ||
        tpl.includes('square')
      ) {
        const ptA = elements['p_A'] || elements['A'] || primaryPoints[0];
        const ptB = elements['p_B'] || elements['B'] || primaryPoints[1];
        const ptC = elements['p_C'] || elements['C'] || primaryPoints[2];
        const ptD = elements['p_D'] || elements['D'] || primaryPoints[3];

        if (ptA && ptB && ptC && ptD) {
          // 严格向量从动计算 D = A + C - B (仅对一般平行四边形闭环，且非显式参数驱动时)
          if (!sid.startsWith('SB-KP06') && elements['D'] && typeof elements['D'].setPosition === 'function' && !elements['p_D']) {
            const dX = ptA.X() + ptC.X() - ptB.X();
            const dY = ptA.Y() + ptC.Y() - ptB.Y();
            elements['D'].setPosition(JXG.COORDS_BY_USER, [dX, dY]);
          }

          // 绘制四边形
          board.create('polygon', [ptA, ptB, ptC, ptD], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
          });

          // 绘制对角线虚线
          board.create('segment', [ptA, ptC], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          board.create('segment', [ptB, ptD], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });

          // 中点衍生四边形
          if (tpl.includes('midpoint') || paramValues['show_midpoints']) {
            const m1X = (ptA.X() + ptB.X()) / 2;
            const m1Y = (ptA.Y() + ptB.Y()) / 2;
            const m2X = (ptB.X() + ptC.X()) / 2;
            const m2Y = (ptB.Y() + ptC.Y()) / 2;
            const m3X = (ptC.X() + ptD.X()) / 2;
            const m3Y = (ptC.Y() + ptD.Y()) / 2;
            const m4X = (ptD.X() + ptA.X()) / 2;
            const m4Y = (ptD.Y() + ptA.Y()) / 2;

            const mp1 = board.create('point', [m1X, m1Y], { name: 'M1', size: 3, fillColor: '#f59e0b', fixed: true });
            const mp2 = board.create('point', [m2X, m2Y], { name: 'M2', size: 3, fillColor: '#f59e0b', fixed: true });
            const mp3 = board.create('point', [m3X, m3Y], { name: 'M3', size: 3, fillColor: '#f59e0b', fixed: true });
            const mp4 = board.create('point', [m4X, m4Y], { name: 'M4', size: 3, fillColor: '#f59e0b', fixed: true });

            board.create('polygon', [mp1, mp2, mp3, mp4], {
              borders: { strokeColor: '#f59e0b', strokeWidth: 2 },
              fillColor: '#f59e0b',
              fillOpacity: 0.15,
            });
          }
        }
      }
      // (十五点五) 线段双中点与角平分线和差模型 (LM-7A-02 / geometry_segment_midpoint_bisector)
      else if (
        tpl === 'geometry_segment_midpoint_bisector' ||
        (config.sandbox_id || '').includes('LM-7A-02')
      ) {
        const ptA = elements['A'];
        const ptB = elements['B'];
        const ptP = elements['P'];
        const ptM1 = elements['M1'];
        const ptM2 = elements['M2'];
        const ptO = elements['O'];
        const ptC = elements['C'];
        const ptM = elements['M'];
        const ptN = elements['N'];

        // 载体一：线段双中点载体 (single_segment)
        if (ptA && ptB && ptP) {
          // 1. 底层基准全长线段 AB
          board.create('segment', [ptA, ptB], {
            strokeColor: '#38bdf8',
            strokeWidth: 3,
          });

          // 2. 分段线段 AP 与 PB 高亮
          board.create('segment', [ptA, ptP], {
            strokeColor: '#f59e0b',
            strokeWidth: 3.5,
          });
          board.create('segment', [ptP, ptB], {
            strokeColor: '#34c759',
            strokeWidth: 3.5,
          });

          // 3. 双中点跨度线段 M1M2 (恒等折半)
          if (ptM1 && ptM2) {
            board.create('segment', [ptM1, ptM2], {
              strokeColor: '#a855f7',
              strokeWidth: 2.5,
              dash: 2,
            });
          }
        }
        // 载体二：共顶点邻补角双平分线载体 (angle_carrier)
        else if (ptO && ptC) {
          // 1. 基准平角线段 (射线 OA 与 OB)
          if (ptA && ptB) {
            board.create('segment', [ptB, ptA], {
              strokeColor: '#64748b',
              strokeWidth: 2,
            });
          } else {
            if (ptA) board.create('segment', [ptO, ptA], { strokeColor: '#64748b', strokeWidth: 2 });
            if (ptB) board.create('segment', [ptO, ptB], { strokeColor: '#64748b', strokeWidth: 2 });
          }

          // 2. 动射线 OC
          board.create('segment', [ptO, ptC], {
            strokeColor: '#f59e0b',
            strokeWidth: 3,
          });

          // 3. 内角平分线 OM 与外角平分线 ON
          if (ptM) {
            board.create('segment', [ptO, ptM], {
              strokeColor: '#34c759',
              strokeWidth: 2.5,
              dash: 2,
            });
          }
          if (ptN) {
            board.create('segment', [ptO, ptN], {
              strokeColor: '#a855f7',
              strokeWidth: 2.5,
              dash: 2,
            });
          }

          // 4. 动态绘制 ∠MON = 90° 直角标折线
          if (ptM && ptN) {
            const radM = Math.atan2(ptM.Y(), ptM.X());
            const radN = Math.atan2(ptN.Y(), ptN.X());
            const sz = 0.8;
            const r1X = sz * Math.cos(radM);
            const r1Y = sz * Math.sin(radM);
            const r2X = sz * Math.cos(radN);
            const r2Y = sz * Math.sin(radN);
            const cornerX = r1X + r2X;
            const cornerY = r1Y + r2Y;
            board.create('line', [[r1X, r1Y], [cornerX, cornerY]], {
              straightFirst: false,
              straightLast: false,
              strokeColor: '#fbbf24',
              strokeWidth: 2,
            });
            board.create('line', [[r2X, r2Y], [cornerX, cornerY]], {
              straightFirst: false,
              straightLast: false,
              strokeColor: '#fbbf24',
              strokeWidth: 2,
            });
          }
        }
      }
      // (十六) 基础多边形降级回退
      else {
        const hasExplicitPolys = Array.isArray(visualElements?.polygons) && visualElements.polygons.length > 0;
        if (!hasExplicitPolys) {
          if (primaryPoints.length === 2) {
            board.create('segment', [primaryPoints[0], primaryPoints[1]], {
              strokeColor: '#38bdf8',
              strokeWidth: 3,
            });
          } else if (primaryPoints.length === 3) {
            board.create('polygon', primaryPoints, {
              borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
              fillColor: '#38bdf8',
              fillOpacity: 0.22,
            });
          } else if (primaryPoints.length >= 4) {
            board.create('polygon', primaryPoints, {
              borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
              fillColor: '#38bdf8',
              fillOpacity: 0.22,
            });
          }
        }
      }
    }

    // (九) 46 概念沙盒声明式几何填充面与直角标渲染引擎 (TASK-FE-0021 步骤 2)
    const skipDefaultPolygons = [
      'SB-KP057', 'SB-KP053', 'SB-KP055', 'SB-KP068', 'SB-KP056',
      'SB-KP062', 'SB-KP064', 'SB-KP065', 'SB-KP066', 'SB-KP058', 'SB-KP051',
      'SB-QUADRATIC-VERTICAL-HEIGHT'
    ].includes(config.sandbox_id || '') ||
    (config.sandbox_id || '').includes('LM-7A-02') ||
    tpl === 'geometry_segment_midpoint_bisector' ||
    tpl === 'geometry_pythagorean_template' ||
    tpl.includes('midpoint_quad') ||
    tpl.includes('equilateral') ||
    tpl.includes('isosceles');

    if (!skipDefaultPolygons && visualElements?.polygons && Array.isArray(visualElements.polygons)) {
      visualElements.polygons.forEach((poly) => {
        const rawPts = poly.pts || (poly as any).points;
        if (!Array.isArray(rawPts) || rawPts.length < 3) return;
        const pts = rawPts.map(resolvePoint).filter(Boolean);
        if (pts.length >= 3) {
          const fillColor = ensureVisibleOnDark(poly.fillColor, 'rgba(0, 113, 227, 0.18)');
          const strokeColor = ensureVisibleOnDark(poly.strokeColor, '#0071e3');
          board.create('polygon', pts, {
            fillColor,
            fillOpacity: poly.fillOpacity ?? 0.22,
            borders: {
              strokeColor,
              strokeWidth: poly.strokeWidth ?? 1.8,
            },
            hasInnerPoints: true,
          });
        }
      });
    }

    if (visualElements?.rightAngles && Array.isArray(visualElements.rightAngles)) {
      visualElements.rightAngles.forEach((ra) => {
        const vertexPt = resolvePoint(ra.vertex);
        const arm1Pt = resolvePoint(ra.arm1);
        const arm2Pt = resolvePoint(ra.arm2);
        if (vertexPt && arm1Pt && arm2Pt) {
          try {
            board.create('angle', [arm1Pt, vertexPt, arm2Pt], {
              type: 'square',
              orthoType: 'square',
              orthoSensitivity: 360,
              radius: 0.5,
              strokeColor: '#cbd5e1',
              fillColor: 'rgba(203, 213, 225, 0.12)',
              strokeWidth: 1.5,
              withLabel: false,
            });
          } catch (e) {}
        }
      });
    }

    // 6. 不变量与遥测指标实时外调与画布全事件绑定
    board.on('update', updateInvariants);
    board.on('drag', updateInvariants);
    board.on('move', updateInvariants);
    setTimeout(updateInvariants, 80);

    // 确保容器获得实际物理尺寸时自动适应（解决首帧尺寸延迟导致模型空白的问题）
    const ensureDimensions = () => {
      if (!boardRef.current || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        try {
          boardRef.current.resizeContainer(w, h, true);
        } catch (e) {}
      }
    };
    const timer1 = setTimeout(ensureDimensions, 50);
    const timer2 = setTimeout(ensureDimensions, 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (isDraggingRef.current) {
        return;
      }
      if (boardRef.current) {
        safeFreeBoardInstance(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [config, paramValues, xrayActive, locale]);

  // 全局鼠标释放兜底重置手势状态
  useEffect(() => {
    const handleGlobalUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, []);

  // 组件真正卸载时彻底释放 JSXGraph 资源
  useEffect(() => {
    return () => {
      if (boardRef.current) {
        safeFreeBoardInstance(boardRef.current);
        boardRef.current = null;
      }
    };
  }, []);

  const containerId = `jsxgraph-container-${config.sandbox_id || 'canvas'}`;

  return (
    <div
      className={`sandbox-renderer ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '340px',
        background: '#0f172a',
        borderRadius: '14px',
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'none',
        ...style,
      }}
    >
      <div
        id={containerId}
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
