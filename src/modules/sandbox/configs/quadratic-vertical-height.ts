import { SandboxConfig } from '../SandboxRenderer';

/**
 * 二次铅垂高沙盒配置 (任务 11.3)
 * 特征：展示抛物线割线与动点铅垂高不变量及三角形面积动态变化
 */
export const quadraticVerticalHeightConfig: SandboxConfig = {
  sandbox_id: 'SB-QUADRATIC-VERTICAL-HEIGHT',
  canvas_template: 'function_quadratic_parabola',
  viewbox_spec_json: JSON.stringify({
    xMin: -5,
    xMax: 5,
    yMin: -3,
    yMax: 7,
    marginPercent: 15,
  }),
  drag_points_json: JSON.stringify([
    { id: 'A', name: 'A(-2,0)', x: -2, y: 0, color: 'var(--text-secondary)', size: 4, isFixed: true },
    { id: 'B', name: 'B(2,0)', x: 2, y: 0, color: 'var(--text-secondary)', size: 4, isFixed: true },
    {
      id: 'P',
      name: 'P(抛物线动点)',
      x: 0,
      y: 4,
      color: 'var(--ios-blue)',
      size: 6,
      isFixed: false,
      constraints: { minX: -2.0, maxX: 2.0, minY: 0, maxY: 5 },
    },
    {
      id: 'Q',
      name: 'Q(垂足对齐点)',
      x: 0,
      y: 0,
      color: 'var(--ios-red)',
      size: 4,
      isFixed: true,
      constraints: { minX: -2.0, maxX: 2.0, minY: -1, maxY: 1 },
    },
  ]),
  param_sliders_json: JSON.stringify([
    {
      id: 'k_scale',
      name: '开口系数 a',
      min: -2,
      max: -0.5,
      default: -1,
      step: 0.1,
    },
    {
      id: 'x_p',
      name: '动点 P 横坐标 x',
      min: -2,
      max: 2,
      default: 0,
      step: 0.1,
    },
  ]),
  invariants_display_json: JSON.stringify([
    {
      id: 'inv_h',
      type: 'vertical_distance',
      deps: ['P', 'Q'],
      formula: 'h = {val}',
      labelZh: '动态铅垂高',
      labelEn: 'Plumb Height h',
    },
    {
      id: 'inv_area',
      type: 'area_triangle',
      deps: ['A', 'P', 'B'],
      formula: 'S_{△PAB} = {val}',
      labelZh: '割线面积 (1/2·底·高)',
      labelEn: 'Triangle Area S',
    },
  ]),
};
