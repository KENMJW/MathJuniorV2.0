/**
 * 视口计算引擎 (任务 11.2, 设计文档 §7.2.2)
 *
 * 规范：
 * 1. 视口必须保证几何元素的完整显示，留有 >= 15% 的安全边距 (Property 11)。
 * 2. 纯函数计算包围盒，无状态污染。
 */

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ViewboxSpec {
  baseBox: BoundingBox;
  preserveAspectRatio?: boolean;
  marginPercent?: number; // 默认 0.15 (15%)
}

/**
 * 根据基础包围盒和要求，计算出带安全边距的 JSXGraph 视口边界 [minX, maxY, maxX, minY]
 *
 * @param spec 视口定义参数
 * @returns 兼容 JSXGraph 的 boundingbox 数组
 */
export function calculateViewport(spec: ViewboxSpec): [number, number, number, number] {
  const box = spec.baseBox;
  
  // 避免长宽为 0
  const width = Math.max(box.maxX - box.minX, 1);
  const height = Math.max(box.maxY - box.minY, 1);

  const margin = spec.marginPercent ?? 0.15; // 至少 15% 边距
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
 * 安全解析 DB 中的 viewbox_spec_json
 */
export function parseViewboxSpec(raw: string | null): ViewboxSpec {
  const defaultBox: BoundingBox = { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  if (!raw) {
    return { baseBox: defaultBox, preserveAspectRatio: true };
  }
  
  try {
    const parsed = JSON.parse(raw);
    const minX = typeof parsed.minX === 'number' ? parsed.minX : (typeof parsed.xMin === 'number' ? parsed.xMin : defaultBox.minX);
    const maxX = typeof parsed.maxX === 'number' ? parsed.maxX : (typeof parsed.xMax === 'number' ? parsed.xMax : defaultBox.maxX);
    const minY = typeof parsed.minY === 'number' ? parsed.minY : (typeof parsed.yMin === 'number' ? parsed.yMin : defaultBox.minY);
    const maxY = typeof parsed.maxY === 'number' ? parsed.maxY : (typeof parsed.yMax === 'number' ? parsed.yMax : defaultBox.maxY);

    let marginPercent = 0.15;
    if (typeof parsed.marginPercent === 'number') {
      marginPercent = parsed.marginPercent > 1 ? parsed.marginPercent / 100 : parsed.marginPercent;
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
