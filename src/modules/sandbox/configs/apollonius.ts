import { SandboxConfig } from '../SandboxRenderer';

/**
 * 阿氏圆沙盒配置 (任务 11.3)
 * 特征：展示动点 P 到两定点 A, B 的距离比值恒定 (PA / PB = k)
 */
export const apolloniusConfig: SandboxConfig = {
  sandbox_id: 'SB-APOLLONIUS-CIRCLE',
  canvas_template: 'axis',
  viewbox_spec_json: JSON.stringify({
    xMin: -6,
    xMax: 8,
    yMin: -6,
    yMax: 6,
    marginPercent: 15,
  }),
  drag_points_json: JSON.stringify([
    { id: 'A', name: 'A(定点)', x: -3, y: 0, color: 'var(--text-secondary)', size: 5 },
    { id: 'B', name: 'B(定点)', x: 1, y: 0, color: 'var(--text-secondary)', size: 5 },
    {
      id: 'P',
      name: 'P(阿氏圆动点)',
      x: 2.33,
      y: 2.67,
      color: 'var(--ios-purple)',
      size: 6,
      constraints: { minX: -5, maxX: 7, minY: -5, maxY: 5 },
    },
  ]),
  param_sliders_json: JSON.stringify([
    {
      id: 'ratio_k',
      name: '目标定比 k',
      min: 1,
      max: 4,
      default: 2,
      step: 0.1,
    },
  ]),
  invariants_display_json: JSON.stringify([
    {
      id: 'inv_ratio',
      type: 'ratio_distance',
      deps: ['P', 'A', 'B'],
      formula: 'PA / PB = {val}',
      labelZh: '定比不变量',
    },
    {
      id: 'inv_pa',
      type: 'distance',
      deps: ['P', 'A'],
      formula: 'PA = {val}',
      labelZh: '到 A 距离',
    },
    {
      id: 'inv_pb',
      type: 'distance',
      deps: ['P', 'B'],
      formula: 'PB = {val}',
      labelZh: '到 B 距离',
    },
  ]),
};
