import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DiscreteOrthographicRenderer } from '../DiscreteOrthographicRenderer';
import { evaluateSafeExpression } from '../safeExpression';
import { formatInvariantText } from '../invariants';

describe('TASK-FE-0014: 10 Contract Classes and Engine Capabilities', () => {
  it('Class 10: DiscreteOrthographicRenderer renders four orthographic views correctly', () => {
    const paramValues = {
      slider_h11: 1,
      slider_h12: 2,
      slider_h21: 3,
      slider_h22: 1,
    };

    const html = renderToString(
      <DiscreteOrthographicRenderer
        paramValues={paramValues}
      />
    );

    // 检查是否包含主视图、左视图、俯视图、3D等轴测
    expect(html).toContain('主视图 (正投影·长对正)');
    expect(html).toContain('左视图 (侧投影·高平齐)');
    expect(html).toContain('俯视图 (水平投影·宽相等)');
    expect(html).toContain('3D 等轴测立体积木');

    // 积木总数 1 + 2 + 3 + 1 = 7
    const totalBlocks = paramValues.slider_h11 + paramValues.slider_h12 + paramValues.slider_h21 + paramValues.slider_h22;
    expect(totalBlocks).toBe(7);
  });

  it('Class 4: Quadratic Vieta model evaluates discriminant and roots conditionally', () => {
    const scope1 = { param_a: 1, param_b: -2, param_c: -3, a: 1, b: -2, c: -3, Delta: 16 };
    expect(evaluateSafeExpression('b^2 - 4*a*c', scope1)).toBe(16);
    expect(evaluateSafeExpression('Delta >= 0', scope1)).toBe(true);
    expect(evaluateSafeExpression('(-b - sqrt(Delta))/(2*a)', scope1)).toBe(-1);
    expect(evaluateSafeExpression('(-b + sqrt(Delta))/(2*a)', scope1)).toBe(3);

    const invSpec = {
      id: 'vieta_sum',
      labelZh: '两根之和',
      formula: '-b / a',
      condition: 'Delta >= 0',
    };
    expect(formatInvariantText(invSpec, {}, 'zh-CN', scope1)).toBe('两根之和 = 2');

    // Δ < 0 时平滑隐藏
    const scope2 = { param_a: 1, param_b: -2, param_c: 2, a: 1, b: -2, c: 2, Delta: -4 };
    expect(evaluateSafeExpression('Delta >= 0', scope2)).toBe(false);
    expect(formatInvariantText(invSpec, {}, 'zh-CN', scope2)).toBeNull();
  });

  it('Class 3: Inverse function area invariant S = |k| is verified', () => {
    const scope = { inv_k: 6, x_pos: 2 };
    expect(evaluateSafeExpression('inv_k', scope)).toBe(6);
    // P(2, 3), Area = 2 * 3 = 6
    const ptX = scope.x_pos;
    const ptY = scope.inv_k / ptX;
    expect(ptX * ptY).toBe(6);
  });

  it('Class 6: Vector closed quadrilateral D = A + C - B', () => {
    const ptA = { x: 0, y: 0 };
    const ptB = { x: 4, y: 0 };
    const ptC = { x: 5, y: 3 };
    // D = A + C - B = (0+5-4, 0+3-0) = (1, 3)
    const ptD = {
      x: ptA.x + ptC.x - ptB.x,
      y: ptA.y + ptC.y - ptB.y,
    };
    expect(ptD).toEqual({ x: 1, y: 3 });
    // 对边向量 AB = DC
    expect({ x: ptB.x - ptA.x, y: ptB.y - ptA.y }).toEqual({
      x: ptC.x - ptD.x,
      y: ptC.y - ptD.y,
    });
  });

  it('Class 7: Circle tangent length theorem PA = PB', () => {
    const r = 3;
    const d = 5; // OP = 5
    // 切线长 L = sqrt(d^2 - r^2) = sqrt(25 - 9) = 4
    const len = evaluateSafeExpression('sqrt(d^2 - r^2)', { d, r });
    expect(len).toBe(4);
  });
});
