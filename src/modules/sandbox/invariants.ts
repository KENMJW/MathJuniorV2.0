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
  | 'distance_sq'
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

  const getPt = (id?: string): Point2D | null => {
    if (!id) return null;
    return (
      pointMap[id] ||
      pointMap[id.toLowerCase()] ||
      pointMap[`p_${id}`] ||
      pointMap[id.replace(/^p_/, '')] ||
      null
    );
  };

  switch (type) {
    case 'distance': {
      if (!deps || deps.length < 2) return null;
      const p1 = getPt(deps[0]);
      const p2 = getPt(deps[1]);
      if (!p1 || !p2) return null;
      return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    case 'distance_sq': {
      if (!deps || deps.length < 2) return null;
      const p1 = getPt(deps[0]);
      const p2 = getPt(deps[1]);
      if (!p1 || !p2) return null;
      return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
    }

    case 'distance_sum': {
      if (!deps || deps.length < 3) return null;
      if (deps.length >= 4) {
        const p1 = getPt(deps[0]);
        const p2 = getPt(deps[1]);
        const p3 = getPt(deps[2]);
        const p4 = getPt(deps[3]);
        if (!p1 || !p2 || !p3 || !p4) return null;
        return Math.hypot(p1.x - p2.x, p1.y - p2.y) + Math.hypot(p3.x - p4.x, p3.y - p4.y);
      }
      const pP = getPt(deps[0]);
      const pA = getPt(deps[1]);
      const pB = getPt(deps[2]);
      if (!pP || !pA || !pB) return null;
      return Math.hypot(pP.x - pA.x, pP.y - pA.y) + Math.hypot(pP.x - pB.x, pP.y - pB.y);
    }

    case 'angle': {
      if (!deps || deps.length < 3) return null;
      const pA = getPt(deps[0]);
      const pO = getPt(deps[1]);
      const pB = getPt(deps[2]);
      if (!pA || !pO || !pB) return null;
      return calculateAngle(pA, pO, pB);
    }

    case 'vertical_distance': {
      if (!deps || deps.length < 2) return null;
      const p1 = getPt(deps[0]);
      const p2 = getPt(deps[1]);
      if (!p1 || !p2) return null;
      return calculateVerticalDistance(p1, p2);
    }

    case 'area':
    case 'area_triangle': {
      if (!deps || deps.length < 3) return null;
      const pA = getPt(deps[0]);
      const pB = getPt(deps[1]);
      const pC = getPt(deps[2]);
      if (!pA || !pB || !pC) return null;
      return calculateTriangleArea(pA, pB, pC);
    }

    case 'ratio':
    case 'ratio_distance': {
      if (!deps || deps.length < 3) return null;
      // 修复 4 点比值截断：若依赖 4 个点 [A1, B1, A, B]，计算 dist(p0,p1) / dist(p2,p3)
      if (deps.length >= 4) {
        const p1 = getPt(deps[0]);
        const p2 = getPt(deps[1]);
        const p3 = getPt(deps[2]);
        const p4 = getPt(deps[3]);
        if (!p1 || !p2 || !p3 || !p4) return null;
        const d1 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const d2 = Math.hypot(p3.x - p4.x, p3.y - p4.y);
        if (d2 <= 1e-9) return 0;
        return d1 / d2;
      }
      const pP = getPt(deps[0]);
      const pA = getPt(deps[1]);
      const pB = getPt(deps[2]);
      if (!pP || !pA || !pB) return null;
      return calculateDistanceRatio(pP, pA, pB);
    }

    case 'product': {
      if (!deps || deps.length < 4) return null;
      const p1 = getPt(deps[0]);
      const p2 = getPt(deps[1]);
      const p3 = getPt(deps[2]);
      const p4 = getPt(deps[3]);
      if (!p1 || !p2 || !p3 || !p4) return null;
      return Math.hypot(p1.x - p2.x, p1.y - p2.y) * Math.hypot(p3.x - p4.x, p3.y - p4.y);
    }

    default:
      return null;
  }
}

/**
 * 展示层变量清洗字典：将代码变量名置换为标准初中数学排版符号，杜绝下划线引起的 KaTeX 下标乱码
 */
export function sanitizeFormulaForDisplay(formula: string): string {
  if (!formula) return formula;
  return formula
    // 分数形态有理数
    .replace(/\bp_num\s*\/\s*q_den\b/g, '\\frac{p}{q}')
    .replace(/\bp_num\b/g, 'p')
    .replace(/\bq_den\b/g, 'q')
    .replace(/\bunit_scale\b/g, 'u')
    // 相反数与实数
    .replace(/\bval_a\b/g, 'a')
    .replace(/\bval_base\b/g, 'a')
    .replace(/\bzoom_level\b/g, 'k')
    // 函数通用参数
    .replace(/\bparam_a\b/g, 'a')
    .replace(/\bparam_b\b/g, 'b')
    .replace(/\bparam_c\b/g, 'c')
    .replace(/\bparam_h\b/g, 'h')
    .replace(/\bparam_k\b/g, 'k')
    .replace(/\bparam_m\b/g, 'm')
    .replace(/\bparam_n\b/g, 'n')
    .replace(/\bparam_t\b/g, 't')
    .replace(/\bslope_k\b/g, 'k')
    .replace(/\bintercept_b\b/g, 'b')
    .replace(/\bk_prop\b/g, 'k')
    .replace(/\bpos_p\b/g, 'x_P')
    .replace(/\bpoint_a\b/g, 'x_A')
    .replace(/\bpoint_b\b/g, 'x_B')
    .replace(/\brect_k\b/g, 'k')
    .replace(/\binv_k\b/g, 'k')
    .replace(/\bline_dist_d\b/g, 'd')
    .replace(/\bchord_dist_d\b/g, 'd')
    .replace(/\bcircle_r\b/g, 'r')
    .replace(/\bradius_r\b/g, 'r')
    .replace(/\bangle_n\b/g, 'n^\\circ')
    .replace(/\bangle_alpha\b/g, '\\alpha')
    .replace(/\brot_deg\b/g, '\\theta');
}

/**
 * 将含有 LaTeX 命令或数学表达式的文本片段规范包裹在 $...$ 中，使 MathRenderer / KaTeX 能够正常解析
 */
export function wrapFormulaLatex(expr: string): string {
  if (!expr) return expr;
  const sanitized = sanitizeFormulaForDisplay(expr);
  if (sanitized.includes('$')) return sanitized;
  // 检测是否含有 LaTeX 特殊命令或转义符号 (\angle, \sqrt, \frac, ^\circ, ^, _, 等)
  const hasLatex = /(\\[a-zA-Z]+|\^|_|\{|\})/.test(sanitized);
  if (hasLatex) {
    return `$${sanitized.trim()}$`;
  }
  return sanitized;
}

const EMOJI_SANITIZE_REGEX = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g;

function sanitizeTelemetryText(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/\uD83D\uDEA8/g, '[警报]')
    .replace(/\uD83E\uDE7B/g, '[透视]')
    .replace(/\uD83C\uDFAF/g, '[题眼]')
    .replace(/\u27A4/g, '->')
    .replace(EMOJI_SANITIZE_REGEX, '')
    .trim();
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
  return sanitizeTelemetryText(formatInvariantTextRaw(spec, pointMap, locale, scopeVars));
}

function formatInvariantTextRaw(
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
    currentScope[`pt_${k}_x`] = pt.x;
    currentScope[`pt_${k}_y`] = pt.y;
    const cleanK = k.replace(/^p_/, '');
    currentScope[cleanK] = pt;
    currentScope[`${cleanK}_x`] = pt.x;
    currentScope[`${cleanK}_y`] = pt.y;
    currentScope[`pt_${cleanK}_x`] = pt.x;
    currentScope[`pt_${cleanK}_y`] = pt.y;
    currentScope[k.toLowerCase()] = pt;
    currentScope[`${k.toLowerCase()}_x`] = pt.x;
    currentScope[`${k.toLowerCase()}_y`] = pt.y;
  });

  // 增强公式求值作用域：若公式中出现 hypot * hypot 或 c_len * c_len 或 c * c，确保如果当前 scope 中有 hypot，计算其真实平方，杜绝任何 NaN 或错配
  const formulaAll = `${spec.formula || ''} ${spec.condition || ''} ${spec.state_label || ''}`;
  if (
    formulaAll.includes('hypot') ||
    formulaAll.includes('c_len') ||
    formulaAll.includes('c * c') ||
    formulaAll.includes('c^2')
  ) {
    if (currentScope.hypot === undefined || Number.isNaN(currentScope.hypot)) {
      const legA = currentScope.leg_a ?? currentScope.param_a ?? currentScope.a;
      const legB = currentScope.leg_b ?? currentScope.param_b ?? currentScope.b;
      if (typeof legA === 'number' && typeof legB === 'number' && Number.isFinite(legA) && Number.isFinite(legB)) {
        currentScope.hypot = Math.hypot(legA, legB);
      } else if (pointMap['A'] && pointMap['B']) {
        currentScope.hypot = Math.hypot(pointMap['A'].x - pointMap['B'].x, pointMap['A'].y - pointMap['B'].y);
      } else if (spec.deps && spec.deps.length >= 2) {
        const p1 = pointMap[spec.deps[0]] || pointMap[spec.deps[0].toLowerCase()] || pointMap[`p_${spec.deps[0]}`];
        const p2 = pointMap[spec.deps[1]] || pointMap[spec.deps[1].toLowerCase()] || pointMap[`p_${spec.deps[1]}`];
        if (p1 && p2) {
          currentScope.hypot = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        }
      }
    }

    if (currentScope.hypot !== undefined && Number.isFinite(Number(currentScope.hypot))) {
      const h = Number(currentScope.hypot);
      currentScope.hypot = h;
      if (currentScope.c_len === undefined || Number.isNaN(currentScope.c_len)) {
        currentScope.c_len = h;
      }
      if (formulaAll.includes('c * c') || formulaAll.includes('c^2')) {
        currentScope.c = h;
      }
    }
  }

  // 增强 LM-9B-34 反比例函数变量反解与遥测求值：确保 inv_k 与 k 齐备互通
  if (currentScope.inv_k !== undefined && currentScope.k === undefined) {
    currentScope.k = currentScope.inv_k;
  } else if (currentScope.k !== undefined && currentScope.inv_k === undefined) {
    currentScope.inv_k = currentScope.k;
  }
  if (currentScope.k === undefined || currentScope.inv_k === undefined) {
    const ptP = pointMap['P'] || pointMap['p'] || pointMap['p_P'];
    if (ptP && Number.isFinite(ptP.x) && Number.isFinite(ptP.y)) {
      const derivedK = Math.round(ptP.x * ptP.y * 1000) / 1000;
      if (currentScope.k === undefined) currentScope.k = derivedK;
      if (currentScope.inv_k === undefined) currentScope.inv_k = derivedK;
    }
  }

  // 增强 LM-9A-25 二次函数铅垂高水平宽求值变量同步
  const tVal = currentScope.slider_t ?? currentScope.param_t ?? currentScope.t ?? (pointMap['P']?.x ?? pointMap['p']?.x);
  if (tVal !== undefined && Number.isFinite(Number(tVal))) {
    const tNum = Number(tVal);
    if (currentScope.slider_t === undefined) currentScope.slider_t = tNum;
    if (currentScope.param_t === undefined) currentScope.param_t = tNum;
    if (currentScope.t === undefined) currentScope.t = tNum;
  }

  // 增强内切圆 (SB-KP076) 变量导出
  if (currentScope.vertex_A_y !== undefined && currentScope.vertex_C_x !== undefined) {
    const ay = Number(currentScope.vertex_A_y);
    const ax = Number(currentScope.vertex_A_x ?? 0);
    const cx = Number(currentScope.vertex_C_x);
    const aSide = cx + 4;
    const bSide = Math.hypot(cx - ax, ay);
    const cSide = Math.hypot(ax + 4, ay);
    const pPerim = (aSide + bSide + cSide) / 2;
    const sArea = 0.5 * aSide * ay;
    const inr = pPerim > 0 ? sArea / pPerim : 0;
    if (currentScope.p === undefined) currentScope.p = pPerim;
    if (currentScope.S === undefined) currentScope.S = sArea;
    if (currentScope.r === undefined) currentScope.r = inr;
    if (currentScope.inradius === undefined) currentScope.inradius = inr;
  }

  // 增强菱形 (SB-KP065) 变量导出
  if (currentScope.diag_h !== undefined && currentScope.diag_v !== undefined) {
    const dh = Number(currentScope.diag_h);
    const dv = Number(currentScope.diag_v);
    if (currentScope.rhombus_side === undefined) currentScope.rhombus_side = Math.hypot(dh / 2, dv / 2);
    if (currentScope.rhombus_area === undefined) currentScope.rhombus_area = 0.5 * dh * dv;
  }

  // 增强切线长 (SB-KP072) 变量导出
  if (currentScope.circle_r !== undefined && currentScope.dist_OP !== undefined) {
    const cr = Number(currentScope.circle_r);
    const d = Number(currentScope.dist_OP);
    if (currentScope.tangent_len === undefined) currentScope.tangent_len = Math.sqrt(Math.max(0, d * d - cr * cr));
  }

  // 增强扇形 (SB-KP077) 变量导出
  if (currentScope.radius_r !== undefined && currentScope.angle_n !== undefined) {
    const r = Number(currentScope.radius_r);
    const n = Number(currentScope.angle_n);
    if (currentScope.arc_len === undefined) currentScope.arc_len = (n * Math.PI * r) / 180;
    if (currentScope.sector_area === undefined) currentScope.sector_area = (n * Math.PI * r * r) / 360;
  }

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
        const wrappedRes = wrapFormulaLatex(res);
        return label ? `${label}: ${wrappedRes}` : wrappedRes;
      }
    }
    const wrappedFormula = wrapFormulaLatex(formula);
    return label ? `${label}: ${wrappedFormula}` : wrappedFormula;
  }

  // 处理单点坐标展示: formula = "Solution ({x}, {y})"
  if (spec.type === 'point') {
    if (spec.deps && spec.deps.length >= 1) {
      const p = pointMap[spec.deps[0]];
      if (p) {
        const px = p.x.toFixed(1);
        const py = p.y.toFixed(1);
        const res = formula.replace('{x}', px).replace('{y}', py).replace('{val}', `(${px}, ${py})`);
        const wrappedRes = wrapFormulaLatex(res);
        return label ? `${label}: ${wrappedRes}` : wrappedRes;
      }
    }
    const wrappedFormula = wrapFormulaLatex(formula);
    return label ? `${label}: ${wrappedFormula}` : wrappedFormula;
  }

  // 处理两点距离平方展示: formula = "c^2 = {val}"
  if (spec.type === 'distance_sq' && spec.deps && spec.deps.length >= 2) {
    const p1 = pointMap[spec.deps[0]] || pointMap[spec.deps[0].toLowerCase()] || pointMap[`p_${spec.deps[0]}`];
    const p2 = pointMap[spec.deps[1]] || pointMap[spec.deps[1].toLowerCase()] || pointMap[`p_${spec.deps[1]}`];
    if (p1 && p2) {
      const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
      const formatted = distSq.toFixed(2);
      const text = formula.replace('{val}', formatted);
      return label ? `${label}: ${wrapFormulaLatex(text)}` : wrapFormulaLatex(text);
    }
  }

  // 2. 纯几何不变量计算
  const isGeometricType = [
    'distance',
    'angle',
    'area',
    'area_triangle',
    'ratio',
    'ratio_distance',
    'distance_sum',
    'vertical_distance',
    'horizontal_distance',
    'distance_sq',
    'midpoint',
    'point',
  ].includes(spec.type || '');

  const val = evaluateInvariantValue(spec, pointMap);

  if (val !== null) {
    // 角度保留 1 位小数，距离/面积/比值保留 2 位小数
    const formattedVal = spec.type === 'angle' ? val.toFixed(1) : val.toFixed(2);
    const text = formula.replace('{val}', formattedVal);
    const wrappedText = wrapFormulaLatex(text);
    return label ? `${label}: ${wrappedText}` : wrappedText;
  }

  // 几何测度依赖点未就绪时平滑隐藏，绝不下落到代数方程求值
  if (isGeometricType) {
    return null;
  }

  // 2.5 关系型守恒定理（直接展示几何关系结论，避免非数值方程被代数求值为 0）
  if (spec.type === 'relation') {
    const raw = label || formula || '';
    return raw ? wrapFormulaLatex(raw) : null;
  }

  // 3. 代数/遥测公式安全求值 (如 Delta = b^2 - 4ac, sum_roots = -b/a)
  if (spec.formula) {
    let stateSuffix = '';
    if (spec.state_label) {
      const st = evaluateSafeExpression(spec.state_label, currentScope);
      if (st) stateSuffix = ` (${st})`;
    }

    // 如果包含 {val} 占位符且非纯几何类型
    if (formula.includes('{val}')) {
      const parts = formula.split('=');
      const exprToEval = parts.length > 1
        ? parts[parts.length - 1].replace(/\{val\}/g, '').trim()
        : formula.replace(/\{val\}/g, '').trim();
      const numVal = exprToEval ? evaluateSafeExpression(exprToEval, currentScope) : null;
      if (numVal === null || typeof numVal === 'undefined' || !Number.isFinite(numVal)) {
        return null;
      }
      const formatted = Number(numVal).toFixed(2);
      const text = formula.replace('{val}', formatted);
      const wrappedText = wrapFormulaLatex(text);
      return label ? `${label}: ${wrappedText}${stateSuffix}` : `${wrappedText}${stateSuffix}`;
    }

    // 否则直接对 formula 表达式求值
    const numVal = evaluateSafeExpression(spec.formula, currentScope);
    const formatted = typeof numVal === 'number'
      ? (Number.isInteger(numVal) ? numVal.toString() : numVal.toFixed(2))
      : String(numVal);

    if (label) {
      const expr = `${label} = ${formatted}`;
      return `${wrapFormulaLatex(expr)}${stateSuffix}`;
    }
    const expr = `${formula} = ${formatted}`;
    return `${wrapFormulaLatex(expr)}${stateSuffix}`;
  }

  return label || null;
}

