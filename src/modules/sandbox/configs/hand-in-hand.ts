import { SandboxConfig } from '../SandboxRenderer';

/**
 * 手拉手模型沙盒配置 (任务 11.3)
 * 特征：展示等腰直角三角形旋转过程中的角度守恒与全等线段夹角不变量
 */
export const handInHandConfig: SandboxConfig = {
  sandbox_id: 'SB-HAND-IN-HAND',
  canvas_template: 'euclidean',
  viewbox_spec_json: JSON.stringify({
    xMin: -8,
    xMax: 8,
    yMin: -7,
    yMax: 7,
    marginPercent: 15,
  }),
  drag_points_json: JSON.stringify([
    { id: 'O', name: 'O(旋转中心)', x: 0, y: 0, color: 'var(--text-primary)', size: 5 },
    { id: 'A', name: 'A', x: 0, y: 4, color: 'var(--ios-blue)', size: 4 },
    {
      id: 'B',
      name: 'B(可拖动)',
      x: 4,
      y: 0,
      color: 'var(--ios-green)',
      size: 5,
      constraints: { minX: -6, maxX: 6, minY: -6, maxY: 6 },
    },
    {
      id: 'C',
      name: 'C(旋动点)',
      x: 2.83,
      y: 2.83,
      color: 'var(--ios-orange)',
      size: 5,
      constraints: { minX: -6, maxX: 6, minY: -6, maxY: 6 },
    },
  ]),
  param_sliders_json: JSON.stringify([
    {
      id: 'rot_angle',
      name: '旋转步进角',
      min: 0,
      max: 180,
      default: 45,
      step: 1,
    },
  ]),
  invariants_display_json: JSON.stringify([
    {
      id: 'inv_aob',
      type: 'angle',
      deps: ['A', 'O', 'B'],
      formula: '∠AOB = {val}°',
      labelZh: '顶角守恒',
    },
    {
      id: 'inv_aoc',
      type: 'angle',
      deps: ['A', 'O', 'C'],
      formula: '∠AOC = {val}°',
      labelZh: '旋转角',
    },
  ]),
};
