import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { LinkedSandboxSlot, checkTargetCondition, InquiryStep } from '../LinkedSandboxSlot';
import { SandboxConfig } from '../../sandbox/SandboxRenderer';

describe('LinkedSandboxSlot (Task 9.2 & CLS=0 验收)', () => {
  const mockConfig: SandboxConfig = {
    sandbox_id: 'SB-TEST-001',
    canvas_template: 'euclidean',
    viewbox_spec_json: '{"xMin":-5,"xMax":5,"yMin":-5,"yMax":5}',
    drag_points_json: '[]',
    param_sliders_json: '[]',
    invariants_display_json: '{"labelZh":"测试守恒","formula":"a=b"}',
  };

  it('1. 当 sandbox_id 与 config 存在时，正确渲染活动沙盒视窗', () => {
    const html = renderToString(
      <LinkedSandboxSlot
        sandboxId="SB-TEST-001"
        config={mockConfig}
        height={560}
      />
    );

    expect(html).toContain('data-testid="linked-sandbox-active"');
    expect(html).toContain('560px');
  });

  it('2. 当 sandbox_id 为空时，渲染物理等大 CLS=0 占位卡 (高度与沙盒严格一致)', () => {
    const html = renderToString(
      <LinkedSandboxSlot
        sandboxId={null}
        config={null}
        height={560}
        pointNameZh="二次根式的性质与化简"
      />
    );

    expect(html).toContain('data-testid="linked-sandbox-placeholder"');
    expect(html).toContain('560px');
    expect(html).toContain('本考点聚焦于代数数式运算、逻辑公理与严谨公式定义，无需动力学几何拖拽模拟。');
  });

  it('3. 铁律 3 门禁：源码必须通过 MathRenderer 渲染文本，严禁裸 dangerouslySetInnerHTML', () => {
    const filePath = path.resolve(__dirname, '../LinkedSandboxSlot.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('MathRenderer');
    expect(content).not.toContain('dangerouslySetInnerHTML');
  });

  it('4. 验证核心探究任务步骤选择器胶囊、重新开始按钮及进入下一步手动推进控件', () => {
    const multiStepConfig: SandboxConfig = {
      sandbox_id: 'SB-TEST-MULTI',
      canvas_template: 'euclidean',
      viewbox_spec_json: '{"xMin":-5,"xMax":5,"yMin":-5,"yMax":5}',
      drag_points_json: '[{"id":"A","name":"A","x":-3,"y":1}]',
      inquiry_steps_json: JSON.stringify([
        { step: 1, titleZh: '观察第一阶段', guideTextZh: '请移动点 A 观察', target_condition: 'A_x > 0' },
        { step: 2, titleZh: '探究第二阶段', guideTextZh: '继续调整参数', target_condition: 'A_x > 2' },
      ]),
    };

    const html = renderToString(
      <LinkedSandboxSlot
        sandboxId="SB-TEST-MULTI"
        config={multiStepConfig}
        locale="zh-CN"
      />
    );

    // 验证步骤切换胶囊与重置按钮 (解决问题 1)
    expect(html).toContain('步骤 1');
    expect(html).toContain('步骤 2');
    expect(html).toContain('重新开始');

    // 验证步骤卡片与推进操作按钮 (解决问题 2)
    expect(html).toContain('步骤 1/2');
    expect(html).toContain('观察第一阶段');
    expect(html).toContain('上一步');
    expect(html).toContain('进入下一步');

    // 验证动点实时坐标与不变量遥测区域 (解决问题 3)
    expect(html).toContain('面积与线段比例守恒');
    expect(html).toContain('结论：几何直观验证通过');
  });

  it('5. 防初始误判门禁：初始滑块默认值满足步骤1条件时，首屏严禁自动标记为完成(无✓，待探究)', () => {
    const autoSatisfyConfig: SandboxConfig = {
      sandbox_id: 'SB-TEST-AUTO',
      canvas_template: 'euclidean',
      viewbox_spec_json: '{"xMin":-5,"xMax":5,"yMin":-5,"yMax":5}',
      drag_points_json: '[]',
      param_sliders_json: JSON.stringify([
        { id: 'p_num', name: '分子 p', min: -5, max: 5, default: 3 },
        { id: 'q_den', name: '分母 q', min: 1, max: 5, default: 2 },
      ]),
      inquiry_steps_json: JSON.stringify([
        { step: 1, titleZh: '正有理数定位', guideTextZh: '调节参数', target_condition: 'p_num > 0 && q_den >= 2' },
        { step: 2, titleZh: '负有理数定位', guideTextZh: '调节为负数', target_condition: 'p_num < 0' },
      ]),
    };

    const html = renderToString(
      <LinkedSandboxSlot
        sandboxId="SB-TEST-AUTO"
        config={autoSatisfyConfig}
        locale="zh-CN"
      />
    );

    // 步骤胶囊必须是未完成态：不能包含 '✓ 步骤 1'，只包含 '步骤 1'
    expect(html).not.toContain('✓ 步骤 1');
    expect(html).toContain('步骤 1');
    expect(html).toContain('调节参数或动点探究');
    expect(html).toContain('进入下一步');
    expect(html).not.toContain('已达成 · 下一步');
  });

  it('6. checkTargetCondition 成功求值真实线段距离标量 (SB-KP056: CM 与 AB 标量注入)', () => {
    // 直角三角形 ABC, C(0,0), A(0,4), B(3,0), 斜边中点 M(1.5, 2)
    // 线段 AB 长度为 hypot(0-3, 4-0) = 5
    // 线段 CM 长度为 hypot(0-1.5, 0-2) = 2.5
    // 验证 point_t === 0.5 && Math.abs(CM - 0.5 * AB) < 0.01 满足条件
    const step: InquiryStep = {
      step: 1,
      target_condition: 'point_t === 0.5 && Math.abs(CM - 0.5 * AB) < 0.01',
    };
    const params = {
      point_t: 0.5,
      leg_a: 3,
      leg_b: 4,
    };
    const points = {
      C: { x: 0, y: 0 },
      A: { x: 0, y: 4 },
      B: { x: 3, y: 0 },
      M: { x: 1.5, y: 2 },
    };

    const isMatch = checkTargetCondition(step, params, points);
    expect(isMatch).toBe(true);

    // 当 point_t 偏离 0.5 时，应返回 false
    expect(checkTargetCondition(step, { ...params, point_t: 0.2 }, points)).toBe(false);

    // 验证带有 p_ 前缀的点名也能正确合成线段距离 (p_C 与 p_M 合成 CM, p_A 与 p_B 合成 AB)
    const pointsWithPrefix = {
      p_C: { x: 0, y: 0 },
      p_A: { x: 0, y: 4 },
      p_B: { x: 3, y: 0 },
      p_M: { x: 1.5, y: 2 },
    };
    expect(checkTargetCondition(step, params, pointsWithPrefix)).toBe(true);
  });

  it('7. checkTargetCondition 成功求值勾股斜边标量且防御动点对象污染 (SB-KP057: c 与 hypot 标量注入)', () => {
    // 直角三角形直角边 leg_a = 4, leg_b = 3
    // hypot = 5, c = 5
    // 并且 points 包含动点 C: { x: 0, y: 0 }, 防御小写 c 被 Point2D 对象覆盖导致 NaN
    const stepC: InquiryStep = {
      step: 3,
      target_condition: 'Math.abs(c * c - (leg_a * leg_a + leg_b * leg_b)) < 0.01',
    };
    const stepHypot: InquiryStep = {
      step: 3,
      target_condition: 'Math.abs(hypot * hypot - (leg_a * leg_a + leg_b * leg_b)) < 0.01',
    };
    const params = {
      leg_a: 4,
      leg_b: 3,
    };
    const points = {
      C: { x: 0, y: 0 },
      A: { x: 0, y: 3 },
      B: { x: 4, y: 0 },
    };

    // 验证 c * c 不报 NaN 且正确返回 true
    const resultC = checkTargetCondition(stepC, params, points);
    expect(resultC).toBe(true);

    // 验证 hypot * hypot 不报 NaN 且正确返回 true
    const resultHypot = checkTargetCondition(stepHypot, params, points);
    expect(resultHypot).toBe(true);
  });

  it('8. 步骤切换推荐初态联动 (Step Preset Hints 规格验证)', () => {
    const presetConfig: SandboxConfig = {
      sandbox_id: 'SB-TEST-PRESET',
      canvas_template: 'euclidean',
      viewbox_spec_json: '{"xMin":-5,"xMax":5,"yMin":-5,"yMax":5}',
      drag_points_json: '[]',
      param_sliders_json: JSON.stringify([
        { id: 'leg_a', name: '直角边 a', min: 1, max: 10, default: 3 },
        { id: 'leg_b', name: '直角边 b', min: 1, max: 10, default: 4 },
      ]),
      inquiry_steps_json: JSON.stringify([
        {
          step: 1,
          titleZh: '初始探索',
          preset_params: { leg_a: 6, leg_b: 8 },
          target_condition: 'leg_a == 6 && leg_b == 8',
        },
      ]),
    };

    const html = renderToString(
      <LinkedSandboxSlot
        sandboxId="SB-TEST-PRESET"
        config={presetConfig}
        locale="zh-CN"
      />
    );
    expect(html).toContain('步骤 1');
    expect(html).toContain('初始探索');
  });
});
