import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import {
  transformPointCoords,
  createDefaultMorphingState,
  compileMorphingSandboxConfig,
  mockLeapSandboxModels,
} from '../morphControllers';
import { XRayLayer } from '../XRayLayer';
import { LeapLab } from '../LeapLab';

describe('4D Morphing Controllers & X-Ray (Task 11.4 & 铁律 1/3 校验)', () => {
  const testModel = mockLeapSandboxModels[0]; // LM-8A-01

  it('1. 纯数学几何变换：90°旋转、轴对称翻折与 180°退化', () => {
    // 点 (4, 0) 逆时针旋转 90° 应得到 (0, 4)
    const rot90 = transformPointCoords(4, 0, 90, false);
    expect(rot90.x).toBeCloseTo(0, 2);
    expect(rot90.y).toBeCloseTo(4, 2);

    // 点 (3, 4) 轴对称翻折应得到 (-3, 4)
    const reflected = transformPointCoords(3, 4, 0, true);
    expect(reflected.x).toBeCloseTo(-3, 2);
    expect(reflected.y).toBeCloseTo(4, 2);

    // 点 (0, 4) 旋转 180° 应得到 (0, -4)
    const rot180 = transformPointCoords(0, 4, 180, false);
    expect(rot180.x).toBeCloseTo(0, 2);
    expect(rot180.y).toBeCloseTo(-4, 2);
  });

  it('2. [Property-Based] 姿态变换欧氏保距性：刚体旋转与翻折严格保持两点间距离 (fast-check 120次)', () => {
    // 任意两点 A(x1, y1), B(x2, y2)，在任意角度旋转与翻折后，欧氏距离恒等于原距离
    fc.assert(
      fc.property(
        fc.float({ min: -50, max: 50, noNaN: true }),
        fc.float({ min: -50, max: 50, noNaN: true }),
        fc.float({ min: -50, max: 50, noNaN: true }),
        fc.float({ min: -50, max: 50, noNaN: true }),
        fc.integer({ min: -360, max: 360 }),
        fc.boolean(),
        (x1, y1, x2, y2, angle, reflected) => {
          const originalDist = Math.hypot(x1 - x2, y1 - y2);

          const pt1 = transformPointCoords(x1, y1, angle, reflected, 1);
          const pt2 = transformPointCoords(x2, y2, angle, reflected, 1);
          const transformedDist = Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y);

          // 允许浮点保留3位小数的精度微差
          expect(transformedDist).toBeCloseTo(originalDist, 1);
        }
      ),
      { numRuns: 120 }
    );
  });

  it('3. compileMorphingSandboxConfig 纯数据驱动生成合法 SandboxConfig', () => {
    const defaultState = createDefaultMorphingState(testModel);
    const config1 = compileMorphingSandboxConfig(testModel, defaultState);

    expect(config1.sandbox_id).toContain('LEAP-LM-8A-01');
    expect(config1.canvas_template).toBe('euclidean');
    expect(JSON.parse(config1.viewbox_spec_json)).toHaveProperty('marginPercent');

    // 切换到直角坐标系载体
    const axisState = { ...defaultState, carrierId: 'coordinate_grid' };
    const config2 = compileMorphingSandboxConfig(testModel, axisState);
    expect(config2.canvas_template).toBe('axis');
  });

  it('4. X-Ray 骨架透视机制：一键滤除干扰加壳图层', () => {
    const defaultState = createDefaultMorphingState(testModel);

    // 加壳开启时，包含 distractor 点
    const normalConfig = compileMorphingSandboxConfig(testModel, { ...defaultState, xrayActive: false });
    const normalPoints = JSON.parse(normalConfig.drag_points_json);
    const hasDistractor = normalPoints.some((p: any) => p.isDistractor);
    expect(hasDistractor).toBe(true);

    // X-Ray 开启后，所有 distractor 点被滤除
    const xrayConfig = compileMorphingSandboxConfig(testModel, { ...defaultState, xrayActive: true });
    const xrayPoints = JSON.parse(xrayConfig.drag_points_json);
    const hasDistractorInXray = xrayPoints.some((p: any) => p.isDistractor);
    expect(hasDistractorInXray).toBe(false);
  });

  it('5. XRayLayer 与 LeapLab SSR 渲染验证', () => {
    const xrayHtml = renderToString(
      <XRayLayer
        xrayActive={true}
        onToggleXRay={() => {}}
        coreSkeleton={{
          nameZh: '手拉手共顶全等',
          nameEn: 'Hand-in-Hand',
          primaryElements: ['O', 'A', 'B'],
        }}
        distractorCount={2}
      />
    );
    expect(xrayHtml).toContain('X-Ray 骨架透视');
    expect(xrayHtml).toContain('已透视');
    expect(xrayHtml).toContain('已透视滤除 2 个几何干扰图层');

    const labHtml = renderToString(
      <LeapLab model={testModel} />
    );
    expect(labHtml).toContain('LM-8A-01');
    expect(labHtml).toContain('手拉手全等与勾股跃迁模型');
    expect(labHtml).toContain('载体变异');
    expect(labHtml).toContain('参数变异');
    expect(labHtml).toContain('姿态变异');
    expect(labHtml).toContain('干扰加壳');
    expect(labHtml).toContain('思维跃迁探究指南');
  });

  it('6. 铁律 1 & 铁律 3 源码门禁检查：零 eval/Function、零 innerHTML、零直接 katex 引用', () => {
    const morphCode = fs.readFileSync(path.resolve(__dirname, '../morphControllers.ts'), 'utf-8');
    const xrayCode = fs.readFileSync(path.resolve(__dirname, '../XRayLayer.tsx'), 'utf-8');
    const leapLabCode = fs.readFileSync(path.resolve(__dirname, '../LeapLab.tsx'), 'utf-8');

    // 铁律 1：绝对禁止 eval / Function
    expect(morphCode).not.toContain('eval(');
    expect(morphCode).not.toContain('new Function(');
    expect(leapLabCode).not.toContain('eval(');
    expect(leapLabCode).not.toContain('new Function(');

    // 铁律 3：禁止业务层裸 innerHTML 或直接引入 katex
    expect(xrayCode).not.toContain('dangerouslySetInnerHTML');
    expect(xrayCode).not.toContain('.innerHTML');
    expect(xrayCode).not.toMatch(/from\s+['"]katex['"]/);

    expect(leapLabCode).not.toContain('dangerouslySetInnerHTML');
    expect(leapLabCode).not.toContain('.innerHTML');
    expect(leapLabCode).not.toMatch(/from\s+['"]katex['"]/);
  });
});
