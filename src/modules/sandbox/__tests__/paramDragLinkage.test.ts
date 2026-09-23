import { describe, it, expect, vi } from 'vitest';
import { canInvertParam, handleParamInversion } from '../SandboxRenderer';

describe('TASK-FE-0016 Part A: Parameter Box <-> Graph Two-way Linkage', () => {
  it('Scenario 1: Circle Model - Point A drag correctly inverts radius r', () => {
    const onParamChange = vi.fn();
    const fakeCircle = { elType: 'circle', setRadius: vi.fn() };
    const elements = { circle_1: fakeCircle };
    const board = { update: vi.fn() };

    const ptDef = { id: 'A', name: 'A', isFixed: false };
    const pt = { X: () => 3, Y: () => 4 };
    const allPoints = [{ id: 'O', x: 0, y: 0, isFixed: true }, ptDef];

    expect(canInvertParam('geometry_circle_template', ptDef, true)).toBe(true);

    handleParamInversion(
      'geometry_circle_template',
      ptDef,
      pt,
      true,
      { r: 4 },
      allPoints,
      elements,
      board,
      onParamChange
    );

    expect(onParamChange).toHaveBeenCalledWith({ r: 5 });
    expect(fakeCircle.setRadius).toHaveBeenCalledWith(5);
    expect(board.update).toHaveBeenCalled();
  });

  it('Scenario 1b: Circle Model - Point O is fixed and cannot be inverted', () => {
    const ptO = { id: 'O', name: 'O', isFixed: true };
    expect(canInvertParam('geometry_circle_template', ptO, true)).toBe(false);
  });

  it('Scenario 2: Right Triangle - Point B drag inverts leg_a', () => {
    const onParamChange = vi.fn();
    const ptDef = { id: 'B', name: 'B', isFixed: false };
    const pt = { X: () => 4.62, Y: () => 0 };

    expect(canInvertParam('right_triangle_template', ptDef, false)).toBe(true);

    handleParamInversion(
      'right_triangle_template',
      ptDef,
      pt,
      false,
      { leg_a: 3, leg_b: 4 },
      [],
      {},
      null,
      onParamChange
    );

    expect(onParamChange).toHaveBeenCalledWith({ leg_a: 4.6 });
  });

  it('Scenario 2b: Right Triangle - Point A drag inverts leg_b', () => {
    const onParamChange = vi.fn();
    const ptDef = { id: 'A', name: 'A', isFixed: false };
    const pt = { X: () => 0, Y: () => 5.78 };

    expect(canInvertParam('pythagorean_template', ptDef, false)).toBe(true);

    handleParamInversion(
      'pythagorean_template',
      ptDef,
      pt,
      false,
      { leg_a: 3, leg_b: 4 },
      [],
      {},
      null,
      onParamChange
    );

    expect(onParamChange).toHaveBeenCalledWith({ leg_b: 5.8 });
  });

  it('Scenario 3: Number Axis - Point P drag inverts pos_p and snaps y to 0', () => {
    const onParamChange = vi.fn();
    const setPosition = vi.fn();
    const ptDef = { id: 'P', name: 'P(动点)', isFixed: false };
    const pt = { X: () => 2.34, Y: () => 0.5, setPosition };

    expect(canInvertParam('number_axis_linear', ptDef, false)).toBe(true);

    handleParamInversion(
      'number_axis_linear',
      ptDef,
      pt,
      false,
      { pos_p: 1 },
      [],
      {},
      null,
      onParamChange
    );

    expect(onParamChange).toHaveBeenCalledWith({ pos_p: 2.3 });
    expect(setPosition).toHaveBeenCalledWith(expect.anything(), [2.34, 0]);
  });

  it('Scenario 3b: Number Axis - Point P driven by param_t inverts param_t', () => {
    const onParamChange = vi.fn();
    const ptDef = { id: 'P', name: 'P', isFixed: false };
    // x = x0 + v * t = 0 + 1 * t => t = x
    const pt = { X: () => 6.7, Y: () => 0 };

    handleParamInversion(
      'number_axis_linear',
      ptDef,
      pt,
      false,
      { param_t: 3, param_x0: 0, param_v: 1 },
      [],
      {},
      null,
      onParamChange
    );

    expect(onParamChange).toHaveBeenCalledWith({ param_t: 6.7 });
  });

  it('Scenario 4: Dynamic t along fixed segment A-B', () => {
    const onParamChange = vi.fn();
    const ptDef = { id: 'P', name: '动点P', isFixed: false };
    // Segment A(-5, 0) to B(5, 0), length 10. Point at (0, 0) -> midpoint ratio 0.5 -> t = 5.0
    const pt = { X: () => 0, Y: () => 0 };
    const allPoints = [
      { id: 'A', x: -5, y: 0, isFixed: true },
      { id: 'B', x: 5, y: 0, isFixed: true },
      ptDef,
    ];

    handleParamInversion(
      'geometry_custom',
      ptDef,
      pt,
      false,
      { param_t: 2 },
      allPoints,
      {},
      null,
      onParamChange
    );

    expect(onParamChange).toHaveBeenCalledWith({ param_t: 5 });
  });

  it('Scenario 6: SB-KP001 Rational Number Axis - Point P drag inverts p_num', () => {
    const onParamChange = vi.fn();
    const setPosition = vi.fn();
    const ptDef = { id: 'P', name: 'P(p/q)' };
    // p = (curX / unit_scale) * q_den = (2.5 / 1) * 2 = 5
    const pt = { X: () => 2.5, Y: () => 0, setPosition };

    expect(canInvertParam('number_axis_rational_template', ptDef, false)).toBe(true);

    handleParamInversion(
      'number_axis_rational_template',
      ptDef,
      pt,
      false,
      { p_num: 3, q_den: 2, unit_scale: 1 },
      [],
      {},
      null,
      onParamChange
    );

    expect(onParamChange).toHaveBeenCalledWith({ p_num: 5 });
  });

  it('Scenario 7: SB-KP047 Perpendicular Model - Point P inverts param_y_p, Point C inverts param_x_c', () => {
    const onParamChangeP = vi.fn();
    const ptPDef = { id: 'P', name: 'P' };
    const ptP = { X: () => 0, Y: () => 5.2 };

    expect(canInvertParam('geometry_perpendicular_template', ptPDef, false)).toBe(true);
    handleParamInversion(
      'geometry_perpendicular_template',
      ptPDef,
      ptP,
      false,
      { param_x_c: 3, param_y_p: 4 },
      [],
      {},
      null,
      onParamChangeP
    );
    expect(onParamChangeP).toHaveBeenCalledWith({ param_y_p: 5.2 });

    const onParamChangeC = vi.fn();
    const ptCDef = { id: 'C', name: 'C(斜足)' };
    const ptC = { X: () => 4.3, Y: () => 0 };

    expect(canInvertParam('geometry_perpendicular_template', ptCDef, false)).toBe(true);
    handleParamInversion(
      'geometry_perpendicular_template',
      ptCDef,
      ptC,
      false,
      { param_x_c: 3, param_y_p: 4 },
      [],
      {},
      null,
      onParamChangeC
    );
    expect(onParamChangeC).toHaveBeenCalledWith({ param_x_c: 4.3 });
  });

  it('Scenario 8: Function Models - Point P drag inverts x_pos', () => {
    const onParamChange = vi.fn();
    const ptDef = { id: 'p1', name: 'P' };
    const pt = { X: () => 3.4, Y: () => 6.8 };

    expect(canInvertParam('function_direct_template', ptDef, false)).toBe(true);
    handleParamInversion(
      'function_direct_template',
      ptDef,
      pt,
      false,
      { k_prop: 2, x_pos: 2 },
      [],
      {},
      null,
      onParamChange
    );
    expect(onParamChange).toHaveBeenCalledWith({ x_pos: 3.4 });
  });

  it('Scenario 5: Conservative Principle - Parabola vertex V cannot be inverted', () => {
    const ptV = { id: 'V', name: 'V', isFixed: false };
    expect(canInvertParam('function_quadratic_parabola', ptV, false)).toBe(false);
  });

  it('Scenario 5b: Conservative Principle - Fixed points always return false', () => {
    const ptFixed = { id: 'A', name: 'A', isFixed: true };
    expect(canInvertParam('right_triangle', ptFixed, false)).toBe(false);
  });
});
