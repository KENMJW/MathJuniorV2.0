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
  viewbox_spec_json: string;
  drag_points_json: string;
  param_sliders_json?: string;
  invariants_display_json?: string;
  carrier_json?: string;
  custom_behavior_id?: string;
  inquiry_guide_zh?: string;
  inquiry_guide_en?: string;
  [key: string]: any;
}

export interface SandboxRendererProps {
  config: SandboxConfig;
  className?: string;
  style?: React.CSSProperties;
  locale?: string;
  paramValues?: Record<string, number>;
  onInvariantsChange?: (invariants: Array<{ id: string; text: string; isConstant: boolean }>) => void;
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

  // 场景 1：圆模型 (isCircleTemplate 或包含 circle/inscribed/chord/tangent 等)
  // 圆周上的动点 A/B/C/P 可反解半径
  if (isCircleTemplate || tpl.includes('circle')) {
    return true;
  }

  // 场景 2：直角三角形 / 勾股定理模型
  // 顶点 B 反解直角边 leg_a / a，顶点 A 反解直角边 leg_b / b
  if (
    tpl.includes('right_triangle') ||
    tpl.includes('pythagorean') ||
    (config?.sandbox_id && config.sandbox_id.includes('PYTHAGOREAN'))
  ) {
    if (id === 'B' || name === 'B' || id === 'A' || name === 'A') {
      return true;
    }
  }

  // 场景 3：数轴模型
  // 动点 P 反解 pos_p / x_p / param_t，动点 A/B 反解区间端点
  if (
    tpl.startsWith('number_axis') ||
    tpl.includes('number_line') ||
    config?.sandbox_id === 'LM-7A-01'
  ) {
    if (id === 'P' || name.includes('P') || id === 'A' || id === 'B') {
      return true;
    }
  }

  // 场景 4：动点 t 参数模型
  // 具有明确 param_t 的模型，且属于动点 (非锚点)
  if (id === 'P' || name.includes('动点') || id === 'M1' || id === 'M2') {
    return true;
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

  // 2. 直角三角形：根据 B 点坐标反解直角边 leg_a / a，根据 A 点反解 leg_b / b
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
  }

  // 3. 数轴模型：根据动点 P 的 X 坐标反解 pos_p / x_p / param_t
  if (
    tpl.startsWith('number_axis') ||
    tpl.includes('number_line') ||
    config?.sandbox_id === 'LM-7A-01'
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

      if (paramValues['pos_p'] !== undefined) {
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
    tpl.includes('circle') ||
    tpl.includes('inscribed') ||
    tpl.includes('chord') ||
    tpl.includes('tangent') ||
    tpl.includes('sector') ||
    tpl.includes('incircle') ||
    config.sandbox_id === 'SB-KP073';

  // 具名滑块驱动动点坐标
  dragPoints = dragPoints.map((ptDef) => {
    let x = ptDef.x ?? 0;
    let y = ptDef.y ?? 0;

    if (tpl.startsWith('number_axis')) {
      const x0 = Number(paramValues['param_x0'] ?? 0);
      const v = Number(paramValues['param_v'] ?? 1);
      const t = Number(paramValues['param_t'] ?? 0);
      const pVal = paramValues['pos_p'] ?? paramValues['point_x'] ?? paramValues['pt_x'] ?? paramValues['val'];

      if (pVal !== undefined && (ptDef.id === 'P' || ptDef.name === 'P')) {
        x = Number(pVal);
      } else if (paramValues['param_t'] !== undefined && (ptDef.id === 'P' || ptDef.name === 'P')) {
        x = x0 + v * t;
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

    if (isCircleTemplate) {
      const cr = paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? paramValues['circle_r1'];
      if (cr !== undefined && ptDef.id !== 'O' && ptDef.id !== 'Origin') {
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
    tpl.includes('square') ||
    tpl.includes('midpoint_quad')
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
  } else if (tpl.includes('linear')) {
    const k1 = Number(paramValues['slope_k'] ?? paramValues['k1'] ?? paramValues['k_prop'] ?? 1);
    const b1 = Number(paramValues['intercept_b'] ?? paramValues['b1'] ?? 0);
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

export const SandboxRenderer: React.FC<SandboxRendererProps> = ({
  config,
  className,
  style,
  paramValues = {},
  onInvariantsChange,
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

    // 1. 解析视口包围盒并执行紧凑内容自适应 (TASK-FE-0015 块 A)
    const viewboxSpec = parseViewboxSpec(config.viewbox_spec_json);
    const contentBox = computeSandboxBoundingBox(config, paramValues);
    const boundingbox = calculateAdaptiveViewport(viewboxSpec, contentBox, {
      minSpan: 0.5,
      marginPercent:
        typeof viewboxSpec.marginPercent === 'number' && Number.isFinite(viewboxSpec.marginPercent)
          ? Math.max(0.12, Math.min(0.15, viewboxSpec.marginPercent))
          : 0.15,
    });
    const isAdaptive = isValidBoundingBox(contentBox, 0.5);
    const keepaspectratio = isAdaptive ? true : viewboxSpec.preserveAspectRatio;

    // 2. 判断是否显示直角坐标轴 (axis)
    const isAxis =
      config.canvas_template === 'axis' ||
      tpl.startsWith('number_axis') ||
      tpl.startsWith('function_') ||
      tpl.includes('vieta') ||
      tpl.includes('linear') ||
      tpl.includes('quadratic') ||
      tpl.includes('parabola') ||
      tpl.includes('inverse');

    // 清理旧实例
    if (boardRef.current) {
      try {
        JXG.JSXGraph.freeBoard(boardRef.current);
      } catch (e) {}
    }

    // 初始化深色 Slate 视口
    const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
      boundingbox,
      axis: isAxis
        ? {
            strokeColor: '#64748b',
            highlightStrokeColor: '#94a3b8',
            ticks: {
              strokeColor: '#64748b',
              majorHeight: 6,
              label: { color: '#e2e8f0', fontSize: 11, strokeColor: 'none' },
              drawZero: true,
            },
          }
        : false,
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
    const elements: Record<string, any> = {};

    // 构建上下文计算 scope
    const buildCurrentScope = (): Record<string, any> => {
      const scope: Record<string, any> = { ...paramValues };
      // 提取常用系数及其简写别名
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
      return scope;
    };

    const currentScope = buildCurrentScope();

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
              const isMaster =
                Boolean(onParamChangeRef.current) &&
                elemDef.isFixed === false &&
                !isCenter &&
                !isDistractor &&
                canInvertParam(tpl, elemDef, tpl.includes('circle'), config);

              const pt = board.create('point', [ptX, ptY], {
                name: showLabel ? (elemDef.name || elemDef.id || '') : '',
                withLabel: showLabel,
                visible: !isDistractor,
                size: elemDef.size || 5,
                fillColor: ptColor,
                strokeColor: ptStroke,
                strokeWidth: 2,
                fixed: isMaster ? false : true,
                label: {
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 'bold',
                  offset: [-6, 14],
                  strokeColor: 'none',
                },
              });
              elements[elemDef.id || 'pt'] = pt;

              if (isMaster) {
                pt.on('down', () => {
                  isDraggingRef.current = true;
                });
                pt.on('drag', () => {
                  isDraggingRef.current = true;
                  if (onParamChangeRef.current) {
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
        tpl.includes('circle') ||
        tpl.includes('inscribed') ||
        tpl.includes('chord') ||
        tpl.includes('tangent') ||
        tpl.includes('sector') ||
        tpl.includes('incircle') ||
        config.sandbox_id === 'SB-KP073';

      // 具名滑块驱动动点坐标
      dragPoints = dragPoints.map((ptDef) => {
        let x = ptDef.x ?? 0;
        let y = ptDef.y ?? 0;

        // 数轴模板：动点 X 坐标响应 param_x0 + param_v * param_t
        if (tpl.startsWith('number_axis')) {
          const x0 = Number(paramValues['param_x0'] ?? 0);
          const v = Number(paramValues['param_v'] ?? 1);
          const t = Number(paramValues['param_t'] ?? 0);
          const pVal = paramValues['pos_p'] ?? paramValues['point_x'] ?? paramValues['pt_x'] ?? paramValues['val'];

          if (pVal !== undefined && (ptDef.id === 'P' || ptDef.name === 'P')) {
            x = Number(pVal);
          } else if (paramValues['param_t'] !== undefined && (ptDef.id === 'P' || ptDef.name === 'P')) {
            x = x0 + v * t;
          }

          if (ptDef.id === 'A' && (paramValues['point_a'] !== undefined || paramValues['interval_a'] !== undefined)) {
            x = Number(paramValues['point_a'] ?? paramValues['interval_a']);
          }
          if (ptDef.id === 'B' && (paramValues['point_b'] !== undefined || paramValues['interval_b'] !== undefined)) {
            x = Number(paramValues['point_b'] ?? paramValues['interval_b']);
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
        if (isCircleTemplate) {
          const cr = paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? paramValues['circle_r1'];
          if (cr !== undefined && ptDef.id !== 'O' && ptDef.id !== 'Origin') {
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

      // 创建动点
      dragPoints.forEach((ptDef) => {
        const isCenter = ptDef.id === 'O' || ptDef.id === 'Origin';
        const ptColor = isCenter ? '#34c759' : ensureVisibleOnDark(ptDef.color, '#38bdf8');
        const isDistractor = !!ptDef.isDistractor || String(ptDef.id).startsWith('distractor_');
        const showLabel = !isDistractor && Boolean(ptDef.name);
        const isMaster =
          Boolean(onParamChangeRef.current) &&
          !ptDef.isFixed &&
          !isCenter &&
          !isDistractor &&
          canInvertParam(tpl, ptDef, isCircleTemplate, config);
        const isPtFixed = isMaster ? false : (ptDef.isFixed !== undefined ? !!ptDef.isFixed : true);

        const pt = board.create('point', [ptDef.x ?? 0, ptDef.y ?? 0], {
          name: showLabel ? (ptDef.name || ptDef.id) : '',
          withLabel: showLabel,
          visible: !isDistractor,
          size: isCenter ? 6 : ptDef.size || 5,
          fillColor: ptColor,
          strokeColor: '#ffffff',
          strokeWidth: 2,
          fixed: isPtFixed,
          label: {
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 'bold',
            offset: [-6, 14],
            strokeColor: 'none',
          },
        });
        elements[ptDef.id] = pt;

        if (isMaster) {
          pt.on('down', () => {
            isDraggingRef.current = true;
          });
          pt.on('drag', () => {
            isDraggingRef.current = true;
            if (onParamChangeRef.current) {
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
          });
          pt.on('up', () => {
            isDraggingRef.current = false;
          });
        }
      });

      const primaryPoints = Object.keys(elements)
        .filter((k) => elements[k].elType === 'point')
        .map((k) => elements[k]);

      // 5. 10 大类专属数学图元拓扑分发
      // (一) 圆图元类
      if (isCircleTemplate) {
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
        if (tpl.includes('inscribed') || config.sandbox_id === 'SB-KP073') {
          if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#0071e3', strokeWidth: 2 });
          if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#0071e3', strokeWidth: 2 });
          if (elements['C'] && elements['A']) board.create('segment', [elements['C'], elements['A']], { strokeColor: '#818cf8', strokeWidth: 2.2 });
          if (elements['C'] && elements['B']) board.create('segment', [elements['C'], elements['B']], { strokeColor: '#818cf8', strokeWidth: 2.2 });
          if (elements['A'] && elements['B']) board.create('segment', [elements['A'], elements['B']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
        }
        // 垂径定理 (chord)
        else if (tpl.includes('chord')) {
          if (elements['A'] && elements['B']) board.create('segment', [elements['A'], elements['B']], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
          const midOrD = elements['M'] || elements['D'];
          if (elements['O'] && midOrD) board.create('segment', [elements['O'], midOrD], { strokeColor: '#f59e0b', strokeWidth: 2 });
        }
        // 切线与切线长 (tangent)
        else if (tpl.includes('tangent')) {
          if (elements['P'] && elements['A']) board.create('segment', [elements['P'], elements['A']], { strokeColor: '#34c759', strokeWidth: 2.2 });
          if (elements['P'] && elements['B']) board.create('segment', [elements['P'], elements['B']], { strokeColor: '#34c759', strokeWidth: 2.2 });
          if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          if (elements['O'] && elements['P']) board.create('segment', [elements['O'], elements['P']], { strokeColor: '#94a3b8', strokeWidth: 1.5, dash: 3 });
        }
      }
      // (二) 数轴动力学与实数夹逼类
      else if (tpl.startsWith('number_axis_')) {
        if (!isAxis) {
          board.create('axis', [[0, 0], [1, 0]], {
            strokeColor: '#475569',
            ticks: { drawZero: true, strokeColor: '#475569', label: { color: '#cbd5e1', fontSize: 11 } },
          });
        }
        // 若存在两个点，连接两点形成区间距离线段
        if (primaryPoints.length >= 2) {
          board.create('segment', [primaryPoints[0], primaryPoints[1]], {
            strokeColor: '#38bdf8',
            strokeWidth: 3.5,
          });
        }
      }
      // (三) 二次函数与韦达模型
      else if (tpl.includes('quadratic') || tpl.includes('parabola') || tpl.includes('vieta')) {
        const a = currentScope['a'];
        const b = currentScope['b'];
        const c = currentScope['c'];
        const delta = currentScope['Delta'];

        // 1. 抛物线连续函数解析式
        board.create('functiongraph', [(x: number) => a * x * x + b * x + c, -20, 20], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });

        // 2. 对称轴虚线 x = -b/(2a)
        if (a !== 0) {
          const symX = -b / (2 * a);
          board.create('line', [[symX, -20], [symX, 20]], {
            strokeColor: '#94a3b8',
            strokeWidth: 1.5,
            dash: 2,
          });
          // 顶点 V
          const vertY = (4 * a * c - b * b) / (4 * a);
          board.create('point', [symX, vertY], {
            name: 'V',
            size: 5,
            fillColor: '#f59e0b',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
        }

        // 3. 判别式条件显隐交点与弦长线段
        if (delta > 0 && a !== 0) {
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
        } else if (delta === 0 && a !== 0) {
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
      // (五) 一次函数与双线求交
      else if (tpl.includes('linear')) {
        const k1 = Number(paramValues['slope_k'] ?? paramValues['k1'] ?? paramValues['k_prop'] ?? 1);
        const b1 = Number(paramValues['intercept_b'] ?? paramValues['b1'] ?? 0);
        board.create('functiongraph', [(x: number) => k1 * x + b1, -20, 20], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });

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
      // (六) 三角形全等/相似与双三角形拓扑分离
      else if (
        tpl.includes('congruence') ||
        tpl.includes('similarity') ||
        tpl.includes('projection') ||
        tpl.includes('k_shape') ||
        primaryPoints.length === 6
      ) {
        if (primaryPoints.length >= 6) {
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
      // (七) 特殊四边形与向量从动闭环
      else if (
        tpl.includes('parallelogram') ||
        tpl.includes('rectangle') ||
        tpl.includes('rhombus') ||
        tpl.includes('square') ||
        tpl.includes('midpoint_quad')
      ) {
        if (primaryPoints.length >= 4) {
          const ptA = primaryPoints[0];
          const ptB = primaryPoints[1];
          const ptC = primaryPoints[2];
          // 严格向量从动计算 D = A + C - B
          const dX = ptA.X() + ptC.X() - ptB.X();
          const dY = ptA.Y() + ptC.Y() - ptB.Y();
          const ptD = elements['D'] || primaryPoints[3];
          if (ptD && typeof ptD.setPosition === 'function') {
            ptD.setPosition(JXG.COORDS_BY_USER, [dX, dY]);
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
      // (八) 基础多边形降级回退
      else {
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

    // 6. 不变量与遥测指标实时外调
    let invariants: any[] = [];
    try {
      const parsed = JSON.parse(config.invariants_display_json || '[]');
      invariants = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {}

    const updateInvariants = () => {
      if (!onInvariantsChangeRef.current || invariants.length === 0) return;
      const pointMap: Record<string, Point2D> = {};
      Object.keys(elements).forEach((id) => {
        const el = elements[id];
        if (el && typeof el.X === 'function') pointMap[id] = { x: el.X(), y: el.Y() };
      });

      const scope = buildCurrentScope();

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
        onInvariantsChangeRef.current(results);
      }
    };

    board.on('update', updateInvariants);
    setTimeout(updateInvariants, 80);

    return () => {
      if (isDraggingRef.current) {
        return;
      }
      if (boardRef.current) {
        try {
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch (e) {}
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
        try {
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch (e) {}
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
        ...style,
      }}
    >
      <div id={containerId} ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
