import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { PointMasterExample, MasterExampleItem } from '../PointMasterExample';
import { useSessionStore } from '../../../store/sessionStore';

describe('PointMasterExample (Task 9.3 & dim3 必展示验收)', () => {
  beforeEach(() => {
    useSessionStore.getState().resetAll();
  });
  const mockMasterExample: MasterExampleItem = {
    example_id: 'ME-KP023',
    example_type: 'point_master',
    bound_target_id: 'KP-023',
    source: '经典中考题型仿编 · 方程组核心例题',
    stem_zh: '已知关于 $x$ 的一元二次方程 $x^2 - (2m-1)x + m^2 - 1 = 0$ 有两个不相等的实数根 $x_1, x_2$。若 $x_1 + x_2 = x_1 x_2$，求实数 $m$ 的值。',
    stem_en: 'Given that quadratic equation $x^2 - (2m-1)x + m^2 - 1 = 0$ has two distinct real roots $x_1, x_2$, and $x_1 + x_2 = x_1 x_2$, find $m$.',
    options_json: '{"A":{"zh":"0"},"B":{"zh":"2"},"C":{"zh":"0 或 2"},"D":{"zh":"-1"}}',
    correct_option: 'A',
    dim1_origin: '本题针对考点【配方法】的核心考查要求进行命题设计。',
    dim2_essence: '配方法的本质是补齐几何正方形缺失的右下角。',
    dim3_rigor: '判别式校验与韦达定理综合求解。',
    dim4_traps: '二次项系数不为 1 时漏除以 a。',
    available_dimensions: 4,
  };

  it('1. 成功挂载并渲染考点母题题干与选项', () => {
    const html = renderToString(<PointMasterExample example={mockMasterExample} />);

    expect(html).toContain('data-testid="point-master-example-card"');
    expect(html).toContain('ME-KP023');
    expect(html).toContain('经典中考题型仿编 · 方程组核心例题');
    expect(html).toContain('第 1 维 · 直观具象本源');
  });

  it('2. [母题解锁]：初始状态 4 维默认全上锁，第 3 维无特殊标签且与其它维度一致', () => {
    const html = renderToString(<PointMasterExample example={mockMasterExample} />);

    // 默认进入 4 维全部上锁
    expect(html).toContain('data-testid="master-dim-card-1-locked"');
    expect(html).toContain('data-testid="master-dim-card-2-locked"');
    expect(html).toContain('data-testid="master-dim-card-3-locked"');
    expect(html).toContain('data-testid="master-dim-card-4-locked"');
    expect(html).toContain('解锁进度：');
    expect(html).toContain('>0</strong>');
    expect(html).toContain('4 维');

    // 移除特殊"必修论证 (dim3 必展示)"标签，与其它维度表现完全一致
    expect(html).not.toContain('必修论证 (dim3 必展示)');
    expect(html).toContain('点击卡片或上方按钮解锁');
  });

  it('3. 铁律 3 门禁：源码中公式与解析统一经由 MathRenderer 渲染，无裸 dangerouslySetInnerHTML', () => {
    const filePath = path.resolve(__dirname, '../PointMasterExample.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('MathRenderer');
    expect(content).not.toContain('dangerouslySetInnerHTML');
  });

  it('4. 英文环境下正确展示四维英文标签与解析', () => {
    const enMasterExample: MasterExampleItem = {
      ...mockMasterExample,
      dim1_origin_en: 'Origins in completing the square.',
      dim2_essence_en: 'Essence of completing the square is geometric square completion.',
      dim3_rigor_en: 'Rigorous derivation via discriminant and Vieta formulas.',
      dim4_traps_en: 'Forgetting to divide by a when leading coefficient is not 1.',
    };

    const html = renderToString(<PointMasterExample example={enMasterExample} locale="en" />);

    // 英文标题与状态
    expect(html).toContain('Dimension 1 · Intuitive Origin');
    expect(html).toContain('Dimension 2 · Core Essence');
    expect(html).toContain('Dimension 3 · Rigor &amp; Proof');
    expect(html).toContain('Dimension 4 · Traps &amp; Variations');
    expect(html).toContain('Progress:');
    expect(html).toContain('Click card or button above to unlock');
    expect(html).toContain('4D Cognitive Evolution');
  });
});
