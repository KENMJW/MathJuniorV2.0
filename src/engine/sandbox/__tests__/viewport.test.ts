import { describe, it, expect } from 'vitest';
import {
  calculateViewport,
  parseViewboxSpec,
  computeBoundingBoxFromPoints,
  isValidBoundingBox,
  mergeBoundingBoxes,
  calculateAdaptiveViewport,
  BoundingBox,
  ViewboxSpec,
} from '../viewport';

describe('视口计算引擎增强单元测试 (TASK-FE-0015 块 A)', () => {
  describe('1. computeBoundingBoxFromPoints 点集包围盒计算', () => {
    it('正常多点集合提取紧凑包围盒', () => {
      const points = [
        { x: -3, y: 1 },
        { x: 4, y: -2 },
        { x: 0, y: 5 },
      ];
      const box = computeBoundingBoxFromPoints(points);
      expect(box).toEqual({
        minX: -3,
        maxX: 4,
        minY: -2,
        maxY: 5,
      });
    });

    it('支持坐标元组形式 [x, y]', () => {
      const points: [number, number][] = [
        [-2, 3],
        [5, -1],
      ];
      const box = computeBoundingBoxFromPoints(points);
      expect(box).toEqual({
        minX: -2,
        maxX: 5,
        minY: -1,
        maxY: 3,
      });
    });

    it('忽略 null/undefined/NaN/Infinity 等异常值', () => {
      const points = [
        { x: 1, y: 2 },
        null as any,
        { x: NaN, y: 3 },
        { x: 4, y: Infinity },
        { x: -2, y: -1 },
      ];
      const box = computeBoundingBoxFromPoints(points);
      expect(box).toEqual({
        minX: -2,
        maxX: 1,
        minY: -1,
        maxY: 2,
      });
    });

    it('空数组或无有效坐标时返回 null', () => {
      expect(computeBoundingBoxFromPoints([])).toBeNull();
      expect(computeBoundingBoxFromPoints([null as any, { x: NaN, y: NaN }])).toBeNull();
    });
  });

  describe('2. isValidBoundingBox 包围盒有效性判定', () => {
    it('跨度均 >= 0.5 时判定为有效', () => {
      const validBox: BoundingBox = { minX: -2, maxX: 2, minY: -1, maxY: 1 };
      expect(isValidBoundingBox(validBox, 0.5)).toBe(true);
    });

    it('宽度或高度小于 0.5 时判定为无效', () => {
      // 单点/极小宽度
      const thinBox: BoundingBox = { minX: 1, maxX: 1.2, minY: 0, maxY: 3 };
      expect(isValidBoundingBox(thinBox, 0.5)).toBe(false);

      // 单线段/极小高度
      const flatBox: BoundingBox = { minX: -3, maxX: 3, minY: 0, maxY: 0.1 };
      expect(isValidBoundingBox(flatBox, 0.5)).toBe(false);
    });

    it('异常值判定为无效', () => {
      expect(isValidBoundingBox(null)).toBe(false);
      expect(isValidBoundingBox(undefined)).toBe(false);
      expect(isValidBoundingBox({ minX: NaN, maxX: 5, minY: 0, maxY: 2 })).toBe(false);
    });
  });

  describe('3. mergeBoundingBoxes 多包围盒合并', () => {
    it('正确合并多个子包围盒', () => {
      const b1: BoundingBox = { minX: -4, maxX: 1, minY: -2, maxY: 3 };
      const b2: BoundingBox = { minX: 0, maxX: 5, minY: 1, maxY: 6 };
      const merged = mergeBoundingBoxes([b1, null, b2]);
      expect(merged).toEqual({
        minX: -4,
        maxX: 5,
        minY: -2,
        maxY: 6,
      });
    });

    it('全为空时返回 null', () => {
      expect(mergeBoundingBoxes([])).toBeNull();
      expect(mergeBoundingBoxes([null, undefined])).toBeNull();
    });
  });

  describe('4. calculateViewport 核心算法与比例保护', () => {
    it('保持 1:1 正方形等比视口 (width > height)', () => {
      const spec: ViewboxSpec = {
        baseBox: { minX: -5, maxX: 5, minY: -2, maxY: 2 },
        preserveAspectRatio: true,
        marginPercent: 0.15,
      };
      const [minX, maxY, maxX, minY] = calculateViewport(spec);
      // width = 10, marginX = 1.5 -> [-6.5, 6.5], paddedWidth = 13
      // height = 4, marginY = 0.6 -> [-2.6, 2.6], paddedHeight = 5.2
      // diff = (13 - 5.2) / 2 = 3.9 -> minY = -6.5, maxY = 6.5
      expect(maxX - minX).toBeCloseTo(13, 3);
      expect(maxY - minY).toBeCloseTo(13, 3);
      expect(minX).toBeCloseTo(-6.5, 3);
      expect(maxX).toBeCloseTo(6.5, 3);
    });

    it('支持 spec 中直接传入 contentBox / contentPoints 驱动自适应', () => {
      const specWithBox: ViewboxSpec = {
        baseBox: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
        contentBox: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
        preserveAspectRatio: true,
        marginPercent: 0.15,
      };
      const [minX, maxY, maxX, minY] = calculateViewport(specWithBox);
      // 动态 box 宽度 4，带 15% 边距后跨度应为 4 * 1.3 = 5.2，远小于默认的 26
      expect(maxX - minX).toBeCloseTo(5.2, 3);
      expect(maxY - minY).toBeCloseTo(5.2, 3);
    });
  });

  describe('5. calculateAdaptiveViewport 内容自适应放大与留白消除', () => {
    const defaultDbSpec: ViewboxSpec = {
      baseBox: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
      preserveAspectRatio: true,
      marginPercent: 0.15,
    };

    it('当内容图元占 [-3, 3] 时，自动紧凑放大，大幅减小黑色留白', () => {
      const contentPoints = [
        { x: -3, y: -2 },
        { x: 3, y: 3 },
      ];
      const staticViewport = calculateViewport(defaultDbSpec);
      const adaptiveViewport = calculateAdaptiveViewport(defaultDbSpec, contentPoints);

      const staticSpan = staticViewport[2] - staticViewport[0];
      const adaptiveSpan = adaptiveViewport[2] - adaptiveViewport[0];

      // 默认视口跨度约为 26 ([-13, 13])
      expect(staticSpan).toBeCloseTo(26, 1);
      // 自适应视口跨度显著小于 26，模型在画布中占比从 23% 提升至 70% 以上
      expect(adaptiveSpan).toBeLessThan(10);
      expect(adaptiveSpan).toBeGreaterThan(6);
    });

    it('当动态内容为空、点数不足或无效时，安全兜底回退 DB baseBox', () => {
      const emptyResult = calculateAdaptiveViewport(defaultDbSpec, []);
      const defaultResult = calculateViewport(defaultDbSpec);
      expect(emptyResult).toEqual(defaultResult);

      const invalidResult = calculateAdaptiveViewport(defaultDbSpec, [{ x: 1, y: 1 }]); // 宽高为 0
      expect(invalidResult).toEqual(defaultResult);
    });

    it('确保安全边距在 12%~15% 建议区间', () => {
      const contentBox: BoundingBox = { minX: -4, maxX: 4, minY: -4, maxY: 4 };
      // 显式指定 10% 会被收口到 >= 12%
      const resLow = calculateAdaptiveViewport(
        { ...defaultDbSpec, marginPercent: 0.1 },
        contentBox
      );
      const spanLow = resLow[2] - resLow[0];
      // 8 * (1 + 2 * 0.12) = 9.92
      expect(spanLow).toBeCloseTo(8 * (1 + 2 * 0.12), 2);

      // 默认 15%
      const resDefault = calculateAdaptiveViewport(defaultDbSpec, contentBox);
      const spanDefault = resDefault[2] - resDefault[0];
      // 8 * (1 + 2 * 0.15) = 10.4
      expect(spanDefault).toBeCloseTo(10.4, 2);
    });
  });

  describe('6. parseViewboxSpec 安全解析', () => {
    it('正常解析 JSON 配置并处理 marginPercent 格式', () => {
      const spec = parseViewboxSpec('{"xMin":-8,"xMax":8,"yMin":-5,"yMax":5,"marginPercent":15}');
      expect(spec.baseBox).toEqual({ minX: -8, maxX: 8, minY: -5, maxY: 5 });
      expect(spec.marginPercent).toBe(0.15);
      expect(spec.preserveAspectRatio).toBe(true);
    });

    it('非法或空配置安全回退默认 [-10, 10]', () => {
      const specNull = parseViewboxSpec(null);
      expect(specNull.baseBox).toEqual({ minX: -10, maxX: 10, minY: -10, maxY: 10 });
      expect(specNull.preserveAspectRatio).toBe(true);

      const specInvalid = parseViewboxSpec('{invalid_json');
      expect(specInvalid.baseBox).toEqual({ minX: -10, maxX: 10, minY: -10, maxY: 10 });
    });
  });
});
