import { describe, it, expect } from 'vitest';
import {
  computeSandboxBoundingBox,
  computeBoardBoundingBox,
  SandboxConfig,
} from '../SandboxRenderer';
import {
  calculateViewport,
  calculateAdaptiveViewport,
  parseViewboxSpec,
  isValidBoundingBox,
} from '../../../engine/sandbox/viewport';

describe('沙盒视口内容自适应与模型放大填满测试 (TASK-FE-0015 块 A)', () => {
  const defaultViewboxSpec = '{"xMin":-10,"xMax":10,"yMin":-10,"yMax":10,"marginPercent":15,"preserveAspectRatio":true}';

  describe('1. 声明式 Carrier 元素包围盒提取 (LM 系列跃迁模型)', () => {
    it('LM-9A-18 抛物线与二次方程：提取顶点、判别式根与虚线轴坐标', () => {
      const config: SandboxConfig = {
        sandbox_id: 'LEAP-LM-9A-18',
        canvas_template: 'function_quadratic_vieta',
        viewbox_spec_json: defaultViewboxSpec,
        drag_points_json: '[]',
        carrier_json: JSON.stringify({
          elements: [
            { id: 'parabola', type: 'functiongraph', fn: 'a*x^2 + b*x + c' },
            { id: 'sym_axis', type: 'line', fn: 'x = -b / (2*a)' },
            { id: 'vertex_V', type: 'point', coord: ['-b/(2*a)', '(4*a*c - b^2)/(4*a)'] },
            { id: 'root_x1', type: 'point', condition: 'Delta >= 0', coord: ['(-b - sqrt(Delta))/(2*a)', 0] },
            { id: 'root_x2', type: 'point', condition: 'Delta >= 0', coord: ['(-b + sqrt(Delta))/(2*a)', 0] },
          ],
        }),
      };

      // y = x^2 - 2x - 3: a=1, b=-2, c=-3, Delta=16
      // 顶点 V(1, -4), 根 x1(-1, 0), x2(3, 0), 对称轴 x=1
      const paramValues = { a: 1, b: -2, c: -3 };
      const box = computeSandboxBoundingBox(config, paramValues);

      expect(box).not.toBeNull();
      expect(isValidBoundingBox(box)).toBe(true);

      // x 范围覆盖根与对称轴: minX = -1, maxX = 3
      expect(box!.minX).toBeCloseTo(-1, 2);
      expect(box!.maxX).toBeCloseTo(3, 2);
      // y 范围覆盖顶点与 x 轴: minY = -4, maxY = 0
      expect(box!.minY).toBeCloseTo(-4, 2);
      expect(box!.maxY).toBeCloseTo(0, 2);

      // 自适应视口计算
      const spec = parseViewboxSpec(config.viewbox_spec_json);
      const [minX, maxY, maxX, minY] = calculateAdaptiveViewport(spec, box);

      // 验证保持 1:1 纵横比：paddedWidth === paddedHeight
      expect(maxX - minX).toBeCloseTo(maxY - minY, 3);
      // 视口跨度远小于 DB 默认的 26 ([-13, 13])，模型在画布上大幅放大填满
      const span = maxX - minX;
      expect(span).toBeLessThan(8);
      expect(span).toBeGreaterThan(4);
    });

    it('LM-9A-22 定弦定角隐形圆：包含圆心与圆半径扩展包围盒', () => {
      const config: SandboxConfig = {
        sandbox_id: 'LEAP-LM-9A-22',
        canvas_template: 'geometry_circle',
        viewbox_spec_json: defaultViewboxSpec,
        drag_points_json: '[]',
        carrier_json: JSON.stringify({
          elements: [
            { id: 'pt_A', type: 'point', coord: [-3, 0] },
            { id: 'pt_B', type: 'point', coord: [3, 0] },
            { id: 'pt_O', type: 'point', coord: [0, 0] },
            { id: 'hidden_circle', type: 'circle', center: 'pt_O', radius: '4' },
          ],
        }),
      };

      const box = computeSandboxBoundingBox(config, {});
      expect(box).not.toBeNull();

      // 圆心 (0, 0) 半径 4，包围盒边界为 [-4, 4]
      expect(box!.minX).toBeCloseTo(-4, 2);
      expect(box!.maxX).toBeCloseTo(4, 2);
      expect(box!.minY).toBeCloseTo(-4, 2);
      expect(box!.maxY).toBeCloseTo(4, 2);

      const spec = parseViewboxSpec(config.viewbox_spec_json);
      const [minX, maxY, maxX, minY] = calculateAdaptiveViewport(spec, box);
      // 15% 边距后跨度应为 8 * 1.3 = 10.4
      expect(maxX - minX).toBeCloseTo(10.4, 2);
      expect(maxY - minY).toBeCloseTo(10.4, 2);
    });
  });

  describe('2. 几何图元与参数驱动动态重算', () => {
    it('直角三角形勾股定理：滑块改变 leg_a/leg_b 时视口同步动态自适应', () => {
      const config: SandboxConfig = {
        sandbox_id: 'SB-KP057',
        canvas_template: 'geometry_pythagorean_template',
        viewbox_spec_json: '{"xMin":-10,"xMax":10,"yMin":-10,"yMax":10}',
        drag_points_json: JSON.stringify([
          { id: 'O', x: 0, y: 0, isFixed: true },
          { id: 'B', x: 3, y: 0 },
          { id: 'A', x: 0, y: 4 },
        ]),
      };

      // 1. 默认参数 (3, 4)
      const box1 = computeSandboxBoundingBox(config, { leg_a: 3, leg_b: 4 });
      expect(box1).toEqual({ minX: 0, maxX: 3, minY: 0, maxY: 4 });

      // 2. 滑块调大 (6, 8)
      const box2 = computeSandboxBoundingBox(config, { leg_a: 6, leg_b: 8 });
      expect(box2).toEqual({ minX: 0, maxX: 6, minY: 0, maxY: 8 });

      const spec = parseViewboxSpec(config.viewbox_spec_json);
      const viewport2 = calculateAdaptiveViewport(spec, box2);
      // 宽度 6, 高度 8 -> 保持 1:1, 最大边为 8, 边距 15% -> 8 * 1.3 = 10.4
      expect(viewport2[2] - viewport2[0]).toBeCloseTo(10.4, 2);
    });

    it('特殊四边形：自动补全第 4 顶点 D = A + C - B 计算封闭外框', () => {
      const config: SandboxConfig = {
        sandbox_id: 'SB-KP062',
        canvas_template: 'geometry_parallelogram_template',
        viewbox_spec_json: defaultViewboxSpec,
        drag_points_json: JSON.stringify([
          { id: 'A', x: 0, y: 0 },
          { id: 'B', x: 4, y: 0 },
          { id: 'C', x: 5, y: 3 },
        ]),
      };

      // D = (0+5-4, 0+3-0) = (1, 3)
      const box = computeSandboxBoundingBox(config, {});
      expect(box).toEqual({ minX: 0, maxX: 5, minY: 0, maxY: 3 });
    });

    it('反比例函数双曲线：提取吸附动点与原点对称点外围', () => {
      const config: SandboxConfig = {
        sandbox_id: 'SB-KP036',
        canvas_template: 'function_inverse',
        viewbox_spec_json: defaultViewboxSpec,
        drag_points_json: '[]',
      };

      // k = 6, x = 2 -> P(2, 3), P'(-2, -3)
      const box = computeSandboxBoundingBox(config, { inv_k: 6, x_pos: 2 });
      expect(box).toEqual({ minX: -2, maxX: 2, minY: -3, maxY: 3 });
    });
  });

  describe('3. 视口留白对比与兜底验证', () => {
    it('对比：模型占 [-4, 4] 时，自适应视口相比固定 [-10, 10] 放大消除黑色留白', () => {
      const config: SandboxConfig = {
        sandbox_id: 'SB-COMPACT-TEST',
        canvas_template: 'euclidean',
        viewbox_spec_json: '{"xMin":-10,"xMax":10,"yMin":-10,"yMax":10,"marginPercent":15}',
        drag_points_json: JSON.stringify([
          { id: 'A', x: -4, y: -4 },
          { id: 'B', x: 4, y: 4 },
        ]),
      };

      const spec = parseViewboxSpec(config.viewbox_spec_json);
      const staticViewport = calculateViewport(spec);
      const staticSpan = staticViewport[2] - staticViewport[0]; // 26

      const box = computeSandboxBoundingBox(config, {});
      const adaptiveViewport = calculateAdaptiveViewport(spec, box);
      const adaptiveSpan = adaptiveViewport[2] - adaptiveViewport[0]; // 10.4

      expect(staticSpan).toBeCloseTo(26, 1);
      expect(adaptiveSpan).toBeCloseTo(10.4, 1);

      // 面积占比比值: (8/10.4)^2 vs (8/26)^2
      const adaptiveAreaRatio = Math.pow(8 / adaptiveSpan, 2);
      const staticAreaRatio = Math.pow(8 / staticSpan, 2);

      // 自适应后图形面积在画布中的占比提升至原来的 6 倍以上
      expect(adaptiveAreaRatio / staticAreaRatio).toBeGreaterThan(6);
    });

    it('异常或无效数据安全回退 DB 基础视口', () => {
      const configEmpty: SandboxConfig = {
        sandbox_id: 'SB-EMPTY',
        canvas_template: 'euclidean',
        viewbox_spec_json: '{"xMin":-10,"xMax":10,"yMin":-10,"yMax":10}',
        drag_points_json: '',
      };

      const box = computeSandboxBoundingBox(configEmpty, {});
      expect(box).toBeNull();

      const spec = parseViewboxSpec(configEmpty.viewbox_spec_json);
      const vp = calculateAdaptiveViewport(spec, box);
      const defaultVp = calculateViewport(spec);
      expect(vp).toEqual(defaultVp);
    });
  });

  describe('4. 坐标系视口绝对居中杜绝漂移测试 (原点居中与四象限对称)', () => {
    it('SB-KP032 正比例函数：原点 (0, 0) 绝对居中，四象限对称，严防原点被挤至边缘或负半轴被截断', () => {
      const config: SandboxConfig = {
        sandbox_id: 'SB-KP032',
        canvas_template: 'function_direct_template',
        viewbox_spec_json: '{"xMin": -8, "xMax": 8, "yMin": -8, "yMax": 8, "marginPercent": 10, "preserveAspectRatio": true}',
        drag_points_json: JSON.stringify([
          { id: 'o', name: 'O', x: 0, y: 0, isFixed: true },
          { id: 'p1', name: 'P', x: 2, y: 4 },
          { id: 'px', name: 'Px', x: 2, y: 0 },
        ]),
      };

      // 1. 用户将 k 调至 -1, x 调至 2 时 (P 处于第四象限 (2, -2))
      const res = computeBoardBoundingBox(config, { k_prop: -1, x_pos: 2 });
      expect(res.isCartesianAxis).toBe(true);
      expect(res.keepaspectratio).toBe(true);

      const [minX, maxY, maxX, minY] = res.boundingbox;
      // 验证严格以原点 (0, 0) 为中心完全对称
      expect(minX + maxX).toBeCloseTo(0, 5);
      expect(minY + maxY).toBeCloseTo(0, 5);
      expect(maxX).toBeCloseTo(maxY, 5);

      // 原点位于正中心，负半轴 Y (-8.8) 充分可见，第四象限动点 P(2, -2) 绝不截断
      expect(minY).toBeLessThan(-8);
      expect(maxY).toBeGreaterThan(8);
      expect(minX).toBeLessThan(-8);
      expect(maxX).toBeGreaterThan(8);
    });

    it('SB-KP001 一维数轴：Y 轴严格以 0 对称居中，水平充满视口', () => {
      const config: SandboxConfig = {
        sandbox_id: 'SB-KP001',
        canvas_template: 'number_axis_rational_template',
        viewbox_spec_json: '{"xMin": -8, "xMax": 8, "yMin": -3, "yMax": 3, "marginPercent": 10, "preserveAspectRatio": true}',
        drag_points_json: JSON.stringify([
          { id: 'O', x: 0, y: 0, isFixed: true },
          { id: 'A', x: -3, y: 0 },
          { id: 'B', x: 4, y: 0 },
        ]),
      };

      const res = computeBoardBoundingBox(config, {});
      expect(res.isNumberAxis).toBe(true);
      expect(res.isCartesianAxis).toBe(false);
      expect(res.keepaspectratio).toBe(false);

      const [minX, maxY, maxX, minY] = res.boundingbox;
      // Y 轴严格上下对称 [-3, 3]
      expect(minY + maxY).toBeCloseTo(0, 5);
      expect(maxY).toBe(3);
      expect(minY).toBe(-3);
      // X 轴以 0 对称且覆盖 [-8, 8]
      expect(minX).toBeLessThan(-8);
      expect(maxX).toBeGreaterThan(8);
    });
  });
});
