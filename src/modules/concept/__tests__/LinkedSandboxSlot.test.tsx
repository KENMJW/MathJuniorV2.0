import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { LinkedSandboxSlot } from '../LinkedSandboxSlot';
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
});
