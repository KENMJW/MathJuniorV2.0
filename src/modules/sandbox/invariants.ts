/**
 * 沙盒实时不变量计算核心 (任务 11.3, 设计文档 §9.2)
 *
 * 铁律规范：
 * 1. 铁律 1: 纯数学计算，零 eval/Function，零 AST 动态解析。
 * 2. 完备边界防呆: 严格处理除以零 (d2=0)、共线 (0°/180°/S=0)、退化点、跨象限计算。
 */

import { evaluateSafeExpression } from './safeExpression';

export interface Point2D {
  x: number;
  y: number;
}

export type InvariantType =
  | 'distance'
  | 'angle'
  | 'vertical_distance'
  | 'area_triangle'
  | 'area'
  | 'ratio_distance'
  | 'ratio'
  | 'distance_sum'
  | 'product'
  | 'midpoint'
  | 'point'
  | 'relation'
  | 'value'
  | 'lines'
  | 'circles';

export interface InvariantSpec {
  id?: string;
  type?: InvariantType | string;
  deps?: string[]; // 依赖的点或对象 key 或参数 key
  formula?: string; // 公式或展示模板
  label?: string;
  labelZh?: string;
  labelEn?: string;
  condition?: string; // 显隐条件，如 "Delta >= 0"
  state_label?: string; // 状态描述公式，如 "Delta > 0 ? '两个不相等实根' : ..."
  isConstant?: boolean;
  x?: number;
  y?: number;
}

/**
 * 纯函数：计算两射线 OA 与 OB 之间的无向夹角（范围 [0, 180] 度）
 * 采用 atan2(|vA × vB|, vA · vB) 向量代数算法，天生免疫跨象限、反向与共线问题
 */
export function calculateAngle(pA: Point2D, pO: Point2D, pB: Point2D): number {
  if (!Number.isFinite(pA.x) || !Number.isFinite(pA.y) ||
      !Number.isFinite(pO.x) || !Number.isFinite(pO.y) ||
      !Number.isFinite(pB.x) || !Number.isFinite(pB.y)) {
    return 0;
  }

  const vAx = pA.x - pO.x;
  const vAy = pA.y - pO.y;
  const vBx = pB.x - pO.x;
  const vBy = pB.y - pO.y;

  const lenA = Math.hypot(vAx, vAy);
  const lenB = Math.hypot(vBx, vBy);

  // 退化情况：任一动点与顶点重合，夹角定义为 0
  if (lenA <= 1e-9 || lenB <= 1e-9 || !Number.isFinite(lenA) || !Number.isFinite(lenB)) {
    return 0;
  }

  // 二维叉积的绝对值 (表示平行四边形面积，反映正弦)
  const cross = Math.abs(vAx * vBy - vAy * vBx);
  // 点积 (反映余弦)
  const dot = vAx * vBx + vAy * vBy;

  const rad = Math.atan2(cross, dot);
  const deg = rad * (180 / Math.PI);
  return Math.abs(deg);
}

/**
 * 纯函数：计算两点间的垂直距离（纵坐标绝对差）
 */
export function calculateVerticalDistance(p1: Point2D, p2: Point2D): number {
  if (!Number.isFinite(p1.y) || !Number.isFinite(p2.y)) {
    return 0;
  }
  return Math.abs(p1.y - p2.y);
}

/**
 * 纯函数：计算三点构成三角形的几何面积 (Shoelace 算法)
 * 任意排列顺序均由于绝对值而返回非负数；共线三点面积严格为 0
 */
export function calculateTriangleArea(pA: Point2D, pB: Point2D, pC: Point2D): number {
  if (!Number.isFinite(pA.x) || !Number.isFinite(pA.y) ||
      !Number.isFinite(pB.x) || !Number.isFinite(pB.y) ||
      !Number.isFinite(pC.x) || !Number.isFinite(pC.y)) {
    return 0;
  }

  const area2 = Math.abs(
    pA.x * (pB.y - pC.y) +
    pB.x * (pC.y - pA.y) +
    pC.x * (pA.y - pB.y)
  );
  return 0.5 * area2;
}

/**
 * 纯函数：计算动点 P 到两定点 A, B 的距离比值 PA / PB
 * 严格包含分母为零 (d2=0) 的除零防呆保护
 */
export function calculateDistanceRatio(pP: Point2D, pA: Point2D, pB: Point2D): number {
  if (!Number.isFinite(pP.x) || !Number.isFinite(pP.y) ||
      !Number.isFinite(pA.x) || !Number.isFinite(pA.y) ||
      !Number.isFinite(pB.x) || !Number.isFinite(pB.y)) {
    return 0;
  }

  const d1 = Math.hypot(pP.x - pA.x, pP.y - pA.y);
  const d2 = Math.hypot(pP.x - pB.x, pP.y - pB.y);

  if (d2 <= 1e-9 || !Number.isFinite(d1) || !Number.isFinite(d2)) {
    // 分母为 0 边界防呆，返回 0 避免 NaN/Infinity 污染
    return 0;
  }

  return d1 / d2;
}

/**
 * 统一调度器：根据 InvariantSpec 及其依赖点字典计算数值
 */
export function evaluateInvariantValue(
  spec: InvariantSpec,
  pointMap: Record<string, Point2D>
): number | null {
  const { type, deps } = spec;

  switch (type) {
    case 'distance': {
      if (!deps || deps.length < 2) return null;
      const p1 = pointMap[deps[0]];
      const p2 = pointMap[deps[1]];
      if (!p1 || !p2) return null;
      return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    case 'distance_sum': {
      if (!deps || deps.length < 3) return null;
      if (deps.length >= 4) {
        const p1 = pointMap[deps[0]];
        const p2 = pointMap[deps[1]];
        const p3 = pointMap[deps[2]];
        const p4 = pointMap[deps[3]];
        if (!p1 || !p2 || !p3 || !p4) return null;
        return Math.hypot(p1.x - p2.x, p1.y - p2.y) + Math.hypot(p3.x - p4.x, p3.y - p4.y);
      }
      const pP = pointMap[deps[0]];
      const pA = pointMap[deps[1]];
      const pB = pointMap[deps[2]];
      if (!pP || !pA || !pB) return null;
      return Math.hypot(pP.x - pA.x, pP.y - pA.y) + Math.hypot(pP.x - pB.x, pP.y - pB.y);
    }

    case 'angle': {
      if (!deps || deps.length < 3) return null;
      const pA = pointMap[deps[0]];
      const pO = pointMap[deps[1]];
      const pB = pointMap[deps[2]];
      if (!pA || !pO || !pB) return null;
      return calculateAngle(pA, pO, pB);
    }

    case 'vertical_distance': {
      if (!deps || deps.length < 2) return null;
      const p1 = pointMap[deps[0]];
      const p2 = pointMap[deps[1]];
      if (!p1 || !p2) return null;
      return calculateVerticalDistance(p1, p2);
    }

    case 'area':
    case 'area_triangle': {
      if (!deps || deps.length < 3) return null;
      const pA = pointMap[deps[0]];
      const pB = pointMap[deps[1]];
      const pC = pointMap[deps[2]];
      if (!pA || !pB || !pC) return null;
      return calculateTriangleArea(pA, pB, pC);
    }

    case 'ratio':
    case 'ratio_distance': {
      if (!deps || deps.length < 3) return null;
      // 修复 4 点比值截断：若依赖 4 个点 [A1, B1, A, B]，计算 dist(p0,p1) / dist(p2,p3)
      if (deps.length >= 4) {
        const p1 = pointMap[deps[0]];
        const p2 = pointMap[deps[1]];
        const p3 = pointMap[deps[2]];
        const p4 = pointMap[deps[3]];
        if (!p1 || !p2 || !p3 || !p4) return null;
        const d1 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const d2 = Math.hypot(p3.x - p4.x, p3.y - p4.y);
        if (d2 <= 1e-9) return 0;
        return d1 / d2;
      }
      const pP = pointMap[deps[0]];
      const pA = pointMap[deps[1]];
      const pB = pointMap[deps[2]];
      if (!pP || !pA || !pB) return null;
      return calculateDistanceRatio(pP, pA, pB);
    }

    case 'product': {
      if (!deps || deps.length < 4) return null;
      const p1 = pointMap[deps[0]];
      const p2 = pointMap[deps[1]];
      const p3 = pointMap[deps[2]];
      const p4 = pointMap[deps[3]];
      if (!p1 || !p2 || !p3 || !p4) return null;
      return Math.hypot(p1.x - p2.x, p1.y - p2.y) * Math.hypot(p3.x - p4.x, p3.y - p4.y);
    }

    default:
      return null;
  }
}

/**
 * 格式化不变量展示文本
 */
export function formatInvariantText(
  spec: InvariantSpec,
  pointMap: Record<string, Point2D>,
  locale: string = 'zh-CN',
  scopeVars: Record<string, any> = {}
): string | null {
  // 合并 pointMap 坐标与 scopeVars
  const currentScope: Record<string, any> = { ...scopeVars };
  Object.keys(pointMap).forEach((k) => {
    const pt = pointMap[k];
    currentScope[k] = pt;
    currentScope[`${k}_x`] = pt.x;
    currentScope[`${k}_y`] = pt.y;
  });

  // 1. condition 条件显隐
  if (spec.condition) {
    const condResult = evaluateSafeExpression(spec.condition, currentScope);
    if (!condResult) {
      return null; // 平滑隐藏
    }
  }

  const isEn = String(locale).toLowerCase().startsWith('en');
  const label = (isEn ? spec.labelEn : spec.labelZh) || spec.label || spec.labelZh || '';
  const formula = spec.formula || '{val}';

  // 处理中点坐标展示: formula = "Mid(AC) = ({x}, {y})"
  if (spec.type === 'midpoint') {
    if (spec.deps && spec.deps.length >= 2) {
      const p1 = pointMap[spec.deps[0]];
      const p2 = pointMap[spec.deps[1]];
      if (p1 && p2) {
        const mx = ((p1.x + p2.x) / 2).toFixed(1);
        const my = ((p1.y + p2.y) / 2).toFixed(1);
        const res = formula.replace('{x}', mx).replace('{y}', my).replace('{val}', `(${mx}, ${my})`);
        return label ? `${label}: ${res}` : res;
      }
    }
    return label ? `${label}: ${formula}` : formula;
  }

  // 处理单点坐标展示: formula = "Solution ({x}, {y})"
  if (spec.type === 'point') {
    if (spec.deps && spec.deps.length >= 1) {
      const p = pointMap[spec.deps[0]];
      if (p) {
        const px = p.x.toFixed(1);
        const py = p.y.toFixed(1);
        const res = formula.replace('{x}', px).replace('{y}', py).replace('{val}', `(${px}, ${py})`);
        return label ? `${label}: ${res}` : res;
      }
    }
    return label ? `${label}: ${formula}` : formula;
  }

  // 2. 纯几何不变量计算
  const val = evaluateInvariantValue(spec, pointMap);

  if (val !== null) {
    // 角度保留 1 位小数，距离/面积/比值保留 2 位小数
    const formattedVal = spec.type === 'angle' ? val.toFixed(1) : val.toFixed(2);
    const text = formula.replace('{val}', formattedVal);
    return label ? `${label}: ${text}` : text;
  }

  // 2.5 关系型守恒定理（直接展示几何关系结论，避免非数值方程被代数求值为 0）
  if (spec.type === 'relation') {
    return label || formula || null;
  }

  // 3. 代数/遥测公式安全求值 (如 Delta = b^2 - 4ac, sum_roots = -b/a)
  if (spec.formula) {
    let stateSuffix = '';
    if (spec.state_label) {
      const st = evaluateSafeExpression(spec.state_label, currentScope);
      if (st) stateSuffix = ` (${st})`;
    }

    // 如果包含 {val} 占位符
    if (formula.includes('{val}')) {
      const numVal = evaluateSafeExpression(formula.replace(/\{val\}/g, '0'), currentScope);
      const formatted = Number.isFinite(numVal) ? Number(numVal).toFixed(2) : String(numVal);
      const text = formula.replace('{val}', formatted);
      return label ? `${label}: ${text}${stateSuffix}` : `${text}${stateSuffix}`;
    }

    // 否则直接对 formula 表达式求值
    const numVal = evaluateSafeExpression(spec.formula, currentScope);
    const formatted = typeof numVal === 'number'
      ? (Number.isInteger(numVal) ? numVal.toString() : numVal.toFixed(2))
      : String(numVal);

    if (label) {
      return `${label} = ${formatted}${stateSuffix}`;
    }
    return `${formula} = ${formatted}${stateSuffix}`;
  }

  return label || null;
}

