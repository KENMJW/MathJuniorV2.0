import { describe, it, expect } from 'vitest';
import { quadraticVerticalHeightConfig } from '../configs/quadratic-vertical-height';
import { formatInvariantText, InvariantSpec } from '../invariants';

describe('SB-QUADRATIC-VERTICAL-HEIGHT Repair Verification', () => {
  it('should use function_quadratic_parabola canvas template instead of axis', () => {
    expect(quadraticVerticalHeightConfig.canvas_template).toBe('function_quadratic_parabola');
  });

  it('should provide dynamic drag point P with proper constraints', () => {
    const points = JSON.parse(quadraticVerticalHeightConfig.drag_points_json as string);
    const ptP = points.find((p: any) => p.id === 'P');
    expect(ptP).toBeDefined();
    expect(ptP.isFixed).toBe(false);
    expect(ptP.x).toBe(0);
    expect(ptP.y).toBe(4);
    expect(ptP.constraints).toBeDefined();
    expect(ptP.constraints.minX).toBe(-2.0);
    expect(ptP.constraints.maxX).toBe(2.0);
  });

  it('should provide k_scale and x_p sliders in param_sliders_json', () => {
    const sliders = JSON.parse(quadraticVerticalHeightConfig.param_sliders_json as string);
    const kSlider = sliders.find((s: any) => s.id === 'k_scale');
    const xSlider = sliders.find((s: any) => s.id === 'x_p');
    expect(kSlider).toBeDefined();
    expect(kSlider.default).toBe(-1);
    expect(xSlider).toBeDefined();
    expect(xSlider.default).toBe(0);
  });

  it('should calculate positive plumb height and triangle area invariants', () => {
    const pointMap = {
      A: { x: -2, y: 0 },
      B: { x: 2, y: 0 },
      P: { x: 0, y: 4 },
      Q: { x: 0, y: 0 },
    };

    const invSpecs: InvariantSpec[] = JSON.parse(
      quadraticVerticalHeightConfig.invariants_display_json as string
    );

    const invH = invSpecs.find((inv) => inv.id === 'inv_h')!;
    const resH = formatInvariantText(invH, pointMap, 'zh-CN', {});
    expect(resH).not.toBeNull();
    expect(resH).toContain('4.00');
    expect(resH).not.toContain('NaN');

    const invArea = invSpecs.find((inv) => inv.id === 'inv_area')!;
    const resArea = formatInvariantText(invArea, pointMap, 'zh-CN', {});
    expect(resArea).not.toBeNull();
    // Area of triangle with base AB=4, height=4: 0.5 * 4 * 4 = 8.00
    expect(resArea).toContain('8.00');
    expect(resArea).not.toContain('NaN');
  });

  it('should update vertical height dynamically when point P moves', () => {
    // P moved to x = 1, y = -1(1)^2 + 4 = 3
    const pointMap = {
      A: { x: -2, y: 0 },
      B: { x: 2, y: 0 },
      P: { x: 1, y: 3 },
      Q: { x: 1, y: 0 },
    };

    const invSpecs: InvariantSpec[] = JSON.parse(
      quadraticVerticalHeightConfig.invariants_display_json as string
    );

    const invH = invSpecs.find((inv) => inv.id === 'inv_h')!;
    const resH = formatInvariantText(invH, pointMap, 'zh-CN', {});
    expect(resH).toContain('3.00');

    const invArea = invSpecs.find((inv) => inv.id === 'inv_area')!;
    const resArea = formatInvariantText(invArea, pointMap, 'zh-CN', {});
    // Area = 0.5 * 4 * 3 = 6.00
    expect(resArea).toContain('6.00');
  });
});
