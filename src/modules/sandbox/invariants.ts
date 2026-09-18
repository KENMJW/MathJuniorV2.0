/**
 * 沙盒实时不变量计算核心 (任务 11.3, 设计文档 §9.2)
 *
 * 铁律规范：
 * 1. 铁律 1: 纯数学计算，零 eval/Function，零 AST 动态解析。
 * 2. 完备边界防呆: 严格处理除以零 (d2=0)、共线 (0°/180°/S=0)、退化点、跨象限计算。
 */

export interface Point2D {
  x: number;
  y: number;
}

export type InvariantType =
  | 'distance'
  | 'angle'
  | 'vertical_distance'
  | 'area_triangle'
  | 'ratio_distance';

export interface InvariantSpec {
  id?: string;
  type: InvariantType;
  deps: string[]; // 依赖的点或对象 key
  formula?: string; // 展示模板，如 "∠AOB = {val}°" 或 "PA / PB = {val}"
  label?: string;
  labelZh?: string;
  labelEn?: string;
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

    case 'area_triangle': {
      if (!deps || deps.length < 3) return null;
      const pA = pointMap[deps[0]];
      const pB = pointMap[deps[1]];
      const pC = pointMap[deps[2]];
      if (!pA || !pB || !pC) return null;
      return calculateTriangleArea(pA, pB, pC);
    }

    case 'ratio_distance': {
      if (!deps || deps.length < 3) return null;
      const pP = pointMap[deps[0]];
      const pA = pointMap[deps[1]];
      const pB = pointMap[deps[2]];
      if (!pP || !pA || !pB) return null;
      return calculateDistanceRatio(pP, pA, pB);
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
  locale: string = 'zh-CN'
): string {
  const val = evaluateInvariantValue(spec, pointMap);
  const label = (locale === 'en' ? spec.labelEn : spec.labelZh) || spec.label || spec.labelZh || '';
  const formula = spec.formula || '{val}';

  if (val === null) {
    return label ? `${label}: ${formula}` : formula;
  }

  // 角度保留 1 位小数，距离/面积/比值保留 2 位小数
  const formattedVal = spec.type === 'angle' ? val.toFixed(1) : val.toFixed(2);
  const text = formula.replace('{val}', formattedVal);
  return label ? `${label}: ${text}` : text;
}
