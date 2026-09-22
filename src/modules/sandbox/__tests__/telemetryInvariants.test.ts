import { describe, it, expect } from 'vitest';
import { formatInvariantText, InvariantSpec } from '../invariants';

describe('Telemetry Invariants Formula Evaluation (LM-9A-18 Vieta & Safe Conditions)', () => {
  const specs: InvariantSpec[] = [
    {
      id: 'delta_val',
      labelZh: '判别式 Δ = b² - 4ac',
      formula: 'b^2 - 4*a*c',
      deps: ['param_a', 'param_b', 'param_c'],
      state_label: "Delta > 0 ? '两个不相等实根' : (Delta == 0 ? '两个相等实根' : '无实数根')",
    },
    {
      id: 'sum_roots',
      labelZh: '两根之和 x₁ + x₂ = -b/a',
      condition: 'Delta >= 0',
      formula: '-b / a',
      deps: ['param_a', 'param_b'],
    },
    {
      id: 'prod_roots',
      labelZh: '两根之积 x₁ · x₂ = c/a',
      condition: 'Delta >= 0',
      formula: 'c / a',
      deps: ['param_a', 'param_c'],
    },
    {
      id: 'chord_len',
      labelZh: '弦长 |x₁ - x₂| = √Δ / |a|',
      condition: 'Delta >= 0',
      formula: 'sqrt(Delta) / abs(a)',
      deps: ['param_a', 'delta_val'],
    },
  ];

  it('calculates Delta > 0 case with Vieta sum and product (a=1, b=-2, c=-3)', () => {
    const scope = { param_a: 1, param_b: -2, param_c: -3, a: 1, b: -2, c: -3, Delta: 16 };
    const pointMap = {};

    const textDelta = formatInvariantText(specs[0], pointMap, 'zh-CN', scope);
    expect(textDelta).toBe('判别式 Δ = b² - 4ac = 16 (两个不相等实根)');

    const textSum = formatInvariantText(specs[1], pointMap, 'zh-CN', scope);
    expect(textSum).toBe('两根之和 x₁ + x₂ = -b/a = 2');

    const textProd = formatInvariantText(specs[2], pointMap, 'zh-CN', scope);
    expect(textProd).toBe('两根之积 x₁ · x₂ = c/a = -3');

    const textChord = formatInvariantText(specs[3], pointMap, 'zh-CN', scope);
    expect(textChord).toBe('弦长 |x₁ - x₂| = √Δ / |a| = 4');
  });

  it('hides roots and chord length when Delta < 0 (condition fails) (a=1, b=-2, c=2)', () => {
    // Delta = (-2)^2 - 4*1*2 = 4 - 8 = -4 < 0
    const scope = { param_a: 1, param_b: -2, param_c: 2, a: 1, b: -2, c: 2, Delta: -4 };
    const pointMap = {};

    const textDelta = formatInvariantText(specs[0], pointMap, 'zh-CN', scope);
    expect(textDelta).toBe('判别式 Δ = b² - 4ac = -4 (无实数根)');

    // Delta < 0 时，condition: "Delta >= 0" 为假，平滑隐藏返回 null
    const textSum = formatInvariantText(specs[1], pointMap, 'zh-CN', scope);
    expect(textSum).toBeNull();

    const textProd = formatInvariantText(specs[2], pointMap, 'zh-CN', scope);
    expect(textProd).toBeNull();

    const textChord = formatInvariantText(specs[3], pointMap, 'zh-CN', scope);
    expect(textChord).toBeNull();
  });
});
