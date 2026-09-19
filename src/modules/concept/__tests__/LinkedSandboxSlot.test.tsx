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
});
