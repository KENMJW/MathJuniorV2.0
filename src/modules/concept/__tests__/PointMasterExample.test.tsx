import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { PointMasterExample, MasterExampleItem } from '../PointMasterExample';

describe('PointMasterExample (Task 9.3 & dim3 必展示验收)', () => {
  const mockMasterExample: MasterExampleItem = {
    example_id: 'ME-KP023',
    example_type: 'point_master',
    bound_target_id: 'KP-023',
    source: '2023年北京中考真题精选',
    stem_zh: '在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$AC = 6$，$BC = 8$。求斜边 $AB$ 的长。',
    stem_en: 'In right triangle ABC, find hypotenuse AB.',
    options_json: '{"A":{"zh":"8"},"B":{"zh":"10"},"C":{"zh":"12"},"D":{"zh":"14"}}',
    correct_option: 'B',
    dim1_origin: '直角三角形边长关系源于赵爽弦图面积割补。',
    dim2_essence: '面积守恒为几何直观核心。',
    dim3_rigor: '在 $\\text{Rt}\\triangle ABC$ 中，由勾股定理：$AB = \\sqrt{6^2 + 8^2} = 10$。',
    dim4_traps: '若未指明直角边与斜边时，需进行分类讨论以防漏解。',
    available_dimensions: 4,
  };

  it('1. 成功挂载并渲染考点母题题干与选项', () => {
    const html = renderToString(<PointMasterExample example={mockMasterExample} />);

    expect(html).toContain('data-testid="point-master-example-card"');
    expect(html).toContain('ME-KP023');
    expect(html).toContain('2023年北京中考真题精选');
    expect(html).toContain('第 1 维 · 直观具象本源');
  });

  it('2. [铁律约束] (CT-6)：dim3_rigor (严谨证明) 恒必展示，不可被锁闭', () => {
    const html = renderToString(<PointMasterExample example={mockMasterExample} />);

    // 第 3 维必须处于渲染状态
    expect(html).toContain('data-testid="master-dim-card-3"');
    expect(html).toContain('必修论证 (dim3 必展示)');
    expect(html).toContain('由勾股定理');
  });

  it('3. 铁律 3 门禁：源码中公式与解析统一经由 MathRenderer 渲染，无裸 dangerouslySetInnerHTML', () => {
    const filePath = path.resolve(__dirname, '../PointMasterExample.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('MathRenderer');
    expect(content).not.toContain('dangerouslySetInnerHTML');
  });
});
