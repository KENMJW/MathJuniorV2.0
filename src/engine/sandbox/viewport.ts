/**
 * 视口计算引擎 (任务 11.2, TASK-FE-0015 块 A)
 *
 * 规范：
 * 1. 视口必须保证几何元素的完整显示，留有 >= 15% 的安全边距 (Property 11)。
 * 2. 纯函数计算包围盒，无状态污染。
 * 3. 支持紧凑内容自适应 (Adaptive Viewport)，使模型放大填满画布，同时保持 1:1 纵横比不变形。
 */

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export type PointLike =
  | { x: number; y: number }
  | { x?: number; y?: number }
  | [number, number];

export interface ViewboxSpec {
  baseBox: BoundingBox;
  preserveAspectRatio?: boolean;
  marginPercent?: number; // 默认 0.15 (15%)
  contentBox?: BoundingBox | null;
  contentPoints?: PointLike[];
}

/**
 * 校验 BoundingBox 是否有效（非空、有限数、长宽跨度均 >= minSpan，默认 0.5）
 */
export function isValidBoundingBox(
  box: BoundingBox | null | undefined,
  minSpan: number = 0.5
): box is BoundingBox {
  if (!box) return false;
  const { minX, maxX, minY, maxY } = box;
  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY)
  ) {
    return false;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  return width >= minSpan && height >= minSpan;
}

/**
 * 根据一组点坐标计算出紧凑的 BoundingBox [minX, maxX, minY, maxY]。
 * 自动忽略无效或非有限数坐标。若无有效点则返回 null。
 */
export function computeBoundingBoxFromPoints(points: PointLike[]): BoundingBox | null {
  if (!points || !Array.isArray(points) || points.length === 0) {
    return null;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let validCount = 0;

  for (const pt of points) {
    if (!pt) continue;
    let x: number | undefined;
    let y: number | undefined;

    if (Array.isArray(pt)) {
      x = pt[0];
      y = pt[1];
    } else {
      x = pt.x;
      y = pt.y;
    }

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      Number.isFinite(x) &&
      Number.isFinite(y)
    ) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      validCount++;
    }
  }

  if (validCount === 0) {
    return null;
  }

  return { minX, maxX, minY, maxY };
}

/**
 * 合并多个 BoundingBox
 */
export function mergeBoundingBoxes(
  boxes: Array<BoundingBox | null | undefined>
): BoundingBox | null {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let count = 0;

  for (const b of boxes) {
    if (!b) continue;
    if (
      Number.isFinite(b.minX) &&
      Number.isFinite(b.maxX) &&
      Number.isFinite(b.minY) &&
      Number.isFinite(b.maxY) &&
      b.maxX >= b.minX &&
      b.maxY >= b.minY
    ) {
      if (b.minX < minX) minX = b.minX;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxY > maxY) maxY = b.maxY;
      count++;
    }
  }

  if (count === 0) return null;
  return { minX, maxX, minY, maxY };
}

/**
 * 根据基础包围盒和要求，计算出带安全边距的 JSXGraph 视口边界 [minX, maxY, maxX, minY]
 *
 * @param spec 视口定义参数
 * @returns 兼容 JSXGraph 的 boundingbox 数组
 */
export function calculateViewport(spec: ViewboxSpec): [number, number, number, number] {
  let box = spec.baseBox;

  // 如果指定了有效的内容包围盒，自适应使用内容包围盒
  if (spec.contentBox && isValidBoundingBox(spec.contentBox)) {
    box = spec.contentBox;
  } else if (spec.contentPoints && spec.contentPoints.length > 0) {
    const computed = computeBoundingBoxFromPoints(spec.contentPoints);
    if (isValidBoundingBox(computed)) {
      box = computed;
    }
  }

  // 避免长宽为 0
  const width = Math.max(box.maxX - box.minX, 0.0001);
  const height = Math.max(box.maxY - box.minY, 0.0001);

  const margin = spec.marginPercent ?? 0.15; // 默认 15% 边距
  const marginX = width * margin;
  const marginY = height * margin;

  let minX = box.minX - marginX;
  let maxX = box.maxX + marginX;
  let minY = box.minY - marginY;
  let maxY = box.maxY + marginY;

  // 如果需要保持横纵比例 (1:1，如圆、正方形的沙盒不变形)
  if (spec.preserveAspectRatio) {
    const paddedWidth = maxX - minX;
    const paddedHeight = maxY - minY;

    if (paddedWidth > paddedHeight) {
      // 宽度较大，补齐高度
      const diff = (paddedWidth - paddedHeight) / 2;
      minY -= diff;
      maxY += diff;
    } else if (paddedHeight > paddedWidth) {
      // 高度较大，补齐宽度
      const diff = (paddedHeight - paddedWidth) / 2;
      minX -= diff;
      maxX += diff;
    }
  }

  // 返回 JSXGraph 需要的顺序：[minX, maxY, maxX, minY]
  return [minX, maxY, maxX, minY];
}

/**
 * 内容自适应视口计算：
 * 若 dynamicContent（坐标点集或包围盒）有效（width >= 0.5 且 height >= 0.5），
 * 则作为动态 baseBox 计算视口，边距建议 12%~15% (默认 0.15)，保持 preserveAspectRatio: true。
 * 兜底：若内容为空、异常或无效极值，回退使用 DB viewboxSpec.baseBox。
 */
export function calculateAdaptiveViewport(
  spec: ViewboxSpec,
  dynamicContent?: PointLike[] | BoundingBox | null,
  options?: { minSpan?: number; marginPercent?: number }
): [number, number, number, number] {
  const minSpan = options?.minSpan ?? 0.5;
  let dynamicBox: BoundingBox | null = null;

  if (dynamicContent) {
    if (Array.isArray(dynamicContent)) {
      dynamicBox = computeBoundingBoxFromPoints(dynamicContent);
    } else {
      dynamicBox = dynamicContent;
    }
  }

  if (isValidBoundingBox(dynamicBox, minSpan)) {
    const marginPercent =
      options?.marginPercent ??
      (typeof spec.marginPercent === 'number' && Number.isFinite(spec.marginPercent)
        ? Math.max(0.12, Math.min(0.15, spec.marginPercent))
        : 0.15);

    return calculateViewport({
      baseBox: dynamicBox,
      preserveAspectRatio: spec.preserveAspectRatio !== false,
      marginPercent,
    });
  }

  // 兜底回退 DB spec
  return calculateViewport(spec);
}

/**
 * 安全解析 DB 中的 viewbox_spec_json
 */
export function parseViewboxSpec(raw: string | null | undefined): ViewboxSpec {
  const defaultBox: BoundingBox = { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  if (!raw) {
    return { baseBox: defaultBox, preserveAspectRatio: true };
  }

  try {
    const parsed = JSON.parse(raw);
    const minX =
      typeof parsed.minX === 'number'
        ? parsed.minX
        : typeof parsed.xMin === 'number'
        ? parsed.xMin
        : defaultBox.minX;
    const maxX =
      typeof parsed.maxX === 'number'
        ? parsed.maxX
        : typeof parsed.xMax === 'number'
        ? parsed.xMax
        : defaultBox.maxX;
    const minY =
      typeof parsed.minY === 'number'
        ? parsed.minY
        : typeof parsed.yMin === 'number'
        ? parsed.yMin
        : defaultBox.minY;
    const maxY =
      typeof parsed.maxY === 'number'
        ? parsed.maxY
        : typeof parsed.yMax === 'number'
        ? parsed.yMax
        : defaultBox.maxY;

    let marginPercent = 0.15;
    if (typeof parsed.marginPercent === 'number') {
      marginPercent =
        parsed.marginPercent > 1 ? parsed.marginPercent / 100 : parsed.marginPercent;
    }

    return {
      baseBox: { minX, maxX, minY, maxY },
      preserveAspectRatio: parsed.preserveAspectRatio !== false,
      marginPercent,
    };
  } catch (e) {
    return { baseBox: defaultBox, preserveAspectRatio: true };
  }
}
