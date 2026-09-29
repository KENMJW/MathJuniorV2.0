import { describe, it, expect } from 'vitest';
import { evaluateSafeExpression } from '../safeExpression';

describe('evaluateSafeExpression (Zero eval security)', () => {
  it('evaluates basic arithmetic', () => {
    expect(evaluateSafeExpression('1 + 2 * 3')).toBe(7);
    expect(evaluateSafeExpression('(1 + 2) * 3')).toBe(9);
    expect(evaluateSafeExpression('10 / 2 - 1')).toBe(4);
    expect(evaluateSafeExpression('2 ^ 3')).toBe(8);
  });

  it('evaluates algebraic expressions with scope', () => {
    const scope = { a: 1, b: -2, c: -3 };
    // Delta = b^2 - 4*a*c = (-2)^2 - 4*1*(-3) = 4 + 12 = 16
    expect(evaluateSafeExpression('b^2 - 4*a*c', scope)).toBe(16);
    // -b / a = 2 / 1 = 2
    expect(evaluateSafeExpression('-b / a', scope)).toBe(2);
    // c / a = -3 / 1 = -3
    expect(evaluateSafeExpression('c / a', scope)).toBe(-3);
    // (b^2 - 2*a*c) / (a^2) = (4 - 2*(-3)) / 1 = 10
    expect(evaluateSafeExpression('(b^2 - 2*a*c) / (a^2)', scope)).toBe(10);
  });

  it('evaluates math functions like sqrt and abs', () => {
    const scope = { Delta: 16, a: 1 };
    expect(evaluateSafeExpression('sqrt(Delta) / abs(a)', scope)).toBe(4);
  });

  it('evaluates relational and logical expressions', () => {
    expect(evaluateSafeExpression('Delta >= 0', { Delta: 16 })).toBe(true);
    expect(evaluateSafeExpression('Delta >= 0', { Delta: -4 })).toBe(false);
    expect(evaluateSafeExpression('Delta >= 0 && c != 0', { Delta: 16, c: -3 })).toBe(true);
    expect(evaluateSafeExpression('Delta >= 0 && c != 0', { Delta: 16, c: 0 })).toBe(false);
  });

  it('evaluates ternary expressions', () => {
    const scope1 = { Delta: 16 };
    expect(
      evaluateSafeExpression("Delta > 0 ? '两个不相等实根' : (Delta == 0 ? '两个相等实根' : '无实数根')", scope1)
    ).toBe('两个不相等实根');

    const scope2 = { Delta: 0 };
    expect(
      evaluateSafeExpression("Delta > 0 ? '两个不相等实根' : (Delta == 0 ? '两个相等实根' : '无实数根')", scope2)
    ).toBe('两个相等实根');

    const scope3 = { Delta: -4 };
    expect(
      evaluateSafeExpression("Delta > 0 ? '两个不相等实根' : (Delta == 0 ? '两个相等实根' : '无实数根')", scope3)
    ).toBe('无实数根');

    // 测试带转义单引号的字符串
    const scope4 = { val: 1 };
    expect(
      evaluateSafeExpression("val == 1 ? '对应边恒平行 (AB ∥ A\\'B\\')' : '不平行'", scope4)
    ).toBe("对应边恒平行 (AB ∥ A'B')");
  });

  it('handles division by zero safely without throwing', () => {
    expect(evaluateSafeExpression('1 / 0')).toBe(0);
    expect(evaluateSafeExpression('-b / a', { a: 0, b: 5 })).toBe(0);
  });

  it('evaluates hypot and degree-based trig functions correctly', () => {
    expect(evaluateSafeExpression('hypot(3, 4)')).toBe(5);
    expect(evaluateSafeExpression('hypot(6, 8)')).toBe(10);
    expect(Math.round(evaluateSafeExpression('sind(30)') * 100) / 100).toBe(0.5);
    expect(Math.round(evaluateSafeExpression('cosd(60)') * 100) / 100).toBe(0.5);
    expect(Math.round(evaluateSafeExpression('tand(45)') * 100) / 100).toBe(1);
    expect(evaluateSafeExpression('deg2rad(180)')).toBeCloseTo(Math.PI);
  });
});

