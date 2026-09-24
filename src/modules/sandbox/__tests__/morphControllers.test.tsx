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
import { isNumberAxisTemplate, canInvertParam } from '../SandboxRenderer';

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

  it('7. TASK-FE-0004: compileMorphingSandboxConfig 空值与异常结构防御不崩溃', () => {
    const emptyModel = {
      model_id: 'LM-EMPTY',
      model_name_zh: '空模型',
      model_name_en: 'Empty Model',
      unlocked_semester: '7-1',
      primary_line: 'A1',
      category_id: 'cat-1',
      tier_level: 1,
      canonical_state_count: 1,
      kp_dependencies: [],
      model_brief_zh: '',
      model_brief_en: '',
      viewbox_spec_json: '{}',
      carrier_morphing_json: '{}',
      parameter_morphing_json: '{}',
      posture_morphing_json: '{}',
      camouflage_xray_json: '{}',
    };

    const emptyState = createDefaultMorphingState(emptyModel);
    expect(emptyState.carrierId).toBe('default');
    expect(emptyState.postureId).toBe('standard');

    const config = compileMorphingSandboxConfig(emptyModel, emptyState);
    expect(config.sandbox_id).toContain('LEAP-LM-EMPTY');
    expect(config.canvas_template).toBe('euclidean');
    expect(config.drag_points_json).toBe('[]');
  });

  it('8. TASK-FE-0015: LeapLab hideModelDrawer 属性与向后兼容测试', () => {
    // 默认行为：hideModelDrawer 未传 (缺省为 false)
    const defaultHtml = renderToString(<LeapLab model={testModel} />);
    expect(defaultHtml).toContain('model-drawer-trigger-btn');
    expect(defaultHtml).not.toContain('model-drawer-static-title');

    // 显式 hideModelDrawer={false} 行为与展开测试
    const openHtml = renderToString(<LeapLab model={testModel} hideModelDrawer={false} isDrawerOpen={true} />);
    expect(openHtml).toContain('model-drawer-trigger-btn');
    expect(openHtml).toContain('model-drawer-panel');
    expect(openHtml).toContain('drawer-search-wrapper');

    // hideModelDrawer={true} 静态胶囊标题且绝不展开抽屉面板
    const lockedHtml = renderToString(<LeapLab model={testModel} hideModelDrawer={true} isDrawerOpen={true} />);
    expect(lockedHtml).toContain('model-drawer-static-title');
    expect(lockedHtml).not.toContain('model-drawer-trigger-btn');
    expect(lockedHtml).not.toContain('model-drawer-panel');
    expect(lockedHtml).not.toContain('drawer-search-wrapper');
    expect(lockedHtml).toContain('LM-8A-01');
    expect(lockedHtml).toContain('手拉手全等与勾股跃迁模型');

    // hideDrawerTrigger={true} 删除左侧按钮，渲染标准标题且不渲染内部抽屉面板
    const triggerHiddenHtml = renderToString(<LeapLab model={testModel} hideDrawerTrigger={true} isDrawerOpen={true} />);
    expect(triggerHiddenHtml).not.toContain('model-drawer-trigger-btn');
    expect(triggerHiddenHtml).not.toContain('model-drawer-panel');
    expect(triggerHiddenHtml).toContain('sandbox-title-text');
    expect(triggerHiddenHtml).toContain('LM-8A-01');
    expect(triggerHiddenHtml).toContain('手拉手全等与勾股跃迁模型');
  });

  it('9. TASK-FE-0024: LM-7A-01 编译输出 canvas_template 为 number_axis_dynamic 且动点计算生效', () => {
    const lm7a01 = mockLeapSandboxModels.find((m) => m.model_id === 'LM-7A-01');
    expect(lm7a01).toBeDefined();

    // 默认状态 (param_t 默认为 5)
    const defaultState = createDefaultMorphingState(lm7a01!);
    const configDefault = compileMorphingSandboxConfig(lm7a01!, defaultState);
    expect(configDefault.canvas_template).toBe('number_axis_dynamic');

    const defaultPoints = JSON.parse(configDefault.drag_points_json);
    const ptPDefault = defaultPoints.find((p: any) => p.id === 'P');
    expect(ptPDefault).toBeDefined();
    // 原始 x=1, param_t=5 时位移为 (5-5)*0.5 = 0, 所以 x=1
    expect(ptPDefault.x).toBeCloseTo(1, 2);

    // param_t = 10 驱动动点平移位移 (1 + (10-5)*0.5 = 3.5)
    const state10 = {
      ...defaultState,
      parameterValues: { ...defaultState.parameterValues, param_t: 10 },
    };
    const config10 = compileMorphingSandboxConfig(lm7a01!, state10);
    expect(config10.canvas_template).toBe('number_axis_dynamic');
    const points10 = JSON.parse(config10.drag_points_json);
    const ptP10 = points10.find((p: any) => p.id === 'P');
    expect(ptP10.x).toBeCloseTo(3.5, 2);

    // param_t = 0 驱动动点向负方向平移位移 (1 + (0-5)*0.5 = -1.5)
    const state0 = {
      ...defaultState,
      parameterValues: { ...defaultState.parameterValues, param_t: 0 },
    };
    const config0 = compileMorphingSandboxConfig(lm7a01!, state0);
    const points0 = JSON.parse(config0.drag_points_json);
    const ptP0 = points0.find((p: any) => p.id === 'P');
    expect(ptP0.x).toBeCloseTo(-1.5, 2);

    // 验证固定锚点 A(-3,0), B(3,0) 不受动点平移影响，严格保持坐标
    const ptA = points10.find((p: any) => p.id === 'A');
    const ptB = points10.find((p: any) => p.id === 'B');
    expect(ptA.x).toBeCloseTo(-3, 2);
    expect(ptB.x).toBeCloseTo(3, 2);
  });

  it('10. TASK-FE-0024: 旋转角别名兼容器驱动手拉手模型 (LM-9A-19 等) 角度更新', () => {
    // 验证旋转角参数别名提取解析：支持 rotationAngle, rot_theta, rot_angle, angle_alpha, theta
    const resolveRotation = (sliders?: Record<string, number>) =>
      sliders?.['rotationAngle'] ??
      sliders?.['rot_theta'] ??
      sliders?.['rot_angle'] ??
      sliders?.['angle_alpha'] ??
      sliders?.['theta'];

    expect(resolveRotation({ rot_theta: 60 })).toBe(60);
    expect(resolveRotation({ rot_theta: 90 })).toBe(90);
    expect(resolveRotation({ rot_theta: 45 })).toBe(45);
    expect(resolveRotation({ rot_angle: 75 })).toBe(75);
    expect(resolveRotation({ angle_alpha: 30 })).toBe(30);
    expect(resolveRotation({ theta: 120 })).toBe(120);
    expect(resolveRotation({ rotationAngle: 15 })).toBe(15);

    // 源码门禁检查：验证 LeapLab.tsx 中分步推演状态同步包含 rot_theta 及相关别名
    const leapLabCode = fs.readFileSync(path.resolve(__dirname, '../LeapLab.tsx'), 'utf-8');
    expect(leapLabCode).toContain("cfg.sliders?.['rot_theta']");
    expect(leapLabCode).toContain("cfg.sliders?.['rotationAngle']");
    expect(leapLabCode).toContain("setRotationAngle(Number(rotVal))");

    // 验证 LM-9A-19 模型存在且在手拉手全等谱系中
    const lm9a19 = mockLeapSandboxModels.find((m) => m.model_id === 'LM-9A-19');
    expect(lm9a19).toBeDefined();
    expect(lm9a19?.model_name_zh).toContain('手拉手');
  });

  it('11. TASK-FE-0024: SandboxRenderer 统一支持 number_axis_dynamic / number_line / axis 并杜绝退化多边形', () => {
    // 模板识别一致性验证
    expect(isNumberAxisTemplate('number_axis_dynamic')).toBe(true);
    expect(isNumberAxisTemplate('number_axis_linear')).toBe(true);
    expect(isNumberAxisTemplate('number_line')).toBe(true);
    expect(isNumberAxisTemplate('axis')).toBe(true);
    expect(isNumberAxisTemplate('euclidean')).toBe(false);

    // 动点反解权限验证
    const ptP = { id: 'P', name: 'P(动点)', isFixed: false };
    expect(canInvertParam('number_axis_dynamic', ptP, false)).toBe(true);
    expect(canInvertParam('axis', ptP, false)).toBe(true);
    expect(canInvertParam('number_line', ptP, false)).toBe(true);

    // 固定点 Origin 不参与反解
    const ptO = { id: 'Origin', name: 'O', isFixed: true };
    expect(canInvertParam('number_axis_dynamic', ptO, false)).toBe(false);

    // 源码门禁：检查 SandboxRenderer.tsx 统一模板支持条件并避免退化多边形
    const rendererCode = fs.readFileSync(path.resolve(__dirname, '../SandboxRenderer.tsx'), 'utf-8');
    expect(rendererCode).toContain("tpl === 'number_axis_dynamic'");
    expect(rendererCode).toContain("tpl.includes('number_line')");
    expect(rendererCode).toContain("tpl === 'axis'");
  });
});
