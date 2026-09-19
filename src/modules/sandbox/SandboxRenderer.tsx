import React, { useEffect, useRef } from 'react';
import JXGModule from 'jsxgraph';

const JXG =
  typeof window !== 'undefined' && (window as any).JXG?.JSXGraph
    ? (window as any).JXG
    : JXGModule;
import { calculateViewport, parseViewboxSpec } from '../../engine/sandbox/viewport';
import { clampDynamicValue } from '../../engine/sandbox/clampDynamicValue';
import { formatInvariantText, Point2D } from './invariants';

export interface SandboxConfig {
  sandbox_id: string;
  canvas_template: string; // 模板标记，比如 'euclidean' 或 'axis'
  viewbox_spec_json: string;
  drag_points_json: string;
  param_sliders_json?: string;
  invariants_display_json?: string;
  custom_behavior_id?: string;
  inquiry_guide_zh?: string;
  inquiry_guide_en?: string;
}

export interface SandboxRendererProps {
  config: SandboxConfig;
  className?: string;
  style?: React.CSSProperties;
  locale?: string;
  paramValues?: Record<string, number>;
  onInvariantsChange?: (invariants: Array<{ id: string; text: string; isConstant: boolean }>) => void;
  xrayActive?: boolean;
}

/**
 * 概念与跃迁通用沙盒渲染器 (对标 ios27_demo.html)
 * 
 * 铁律规范与视觉标准：
 * 1. 纯净画布：绝不在 JSXGraph 画布内创建滑块 (board.create('slider'))，所有控制外置于底部 HTML 控制条；
 * 2. 高对比度暗色视口：背景固定为 #0f172a，轴线 #475569，刻度文字 #cbd5e1，辅助线 #94a3b8，主图形亮青蓝 #38bdf8 / 品牌蓝 #0071e3；
 * 3. 几何拓扑智能连线：根据 drag_points 自动构造多边形与手拉手几何连线，杜绝只有孤立点的黑屏；
 * 4. 视口绝对锁定：pan: false, zoom: false，防失控拖出视窗。
 */
export const SandboxRenderer: React.FC<SandboxRendererProps> = ({
  config,
  className,
  style,
  paramValues = {},
  onInvariantsChange,
  xrayActive = false,
  locale = 'zh-CN',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. 解析视口包围盒
    const viewboxSpec = parseViewboxSpec(config.viewbox_spec_json);
    const boundingbox = calculateViewport(viewboxSpec);

    // 2. 判断是否显示直角坐标轴 (axis)
    const isAxis =
      config.canvas_template === 'axis' ||
      config.canvas_template.startsWith('number_axis') ||
      config.canvas_template.startsWith('function_');

    // 清理旧实例
    if (boardRef.current) {
      try {
        JXG.JSXGraph.freeBoard(boardRef.current);
      } catch (e) {}
    }

    // 初始化深色 Slate 视口
    const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
      boundingbox,
      axis: isAxis
        ? {
            strokeColor: '#64748b',
            highlightStrokeColor: '#94a3b8',
            ticks: {
              strokeColor: '#64748b',
              majorHeight: 6,
              label: { color: '#e2e8f0', fontSize: 11, strokeColor: 'none' },
              drawZero: true,
            },
          }
        : false,
      grid: {
        strokeColor: 'rgba(255, 255, 255, 0.05)',
        dash: 2,
      },
      showCopyright: false,
      showNavigation: false,
      keepaspectratio: viewboxSpec.preserveAspectRatio,
      pan: { enabled: false },
      zoom: { wheel: false, pinch: false },
    });

    boardRef.current = board;
    const elements: Record<string, any> = {};

    // 3. 渲染动点 (drag_points_json)
    let dragPoints: any[] = [];
    try {
      dragPoints = JSON.parse(config.drag_points_json || '[]');
    } catch (e) {}

    const distractorPairs: Record<string, any[]> = {};

    dragPoints.forEach((ptDef) => {
      const isDistractor = !!ptDef.isDistractor || ptDef.id.startsWith('distractor_');
      
      // 如果是加壳干扰点
      if (isDistractor) {
        const pt = board.create('point', [ptDef.x ?? 0, ptDef.y ?? 0], {
          name: '',
          size: 2,
          visible: !xrayActive,
          fillColor: '#94a3b8',
          strokeColor: '#94a3b8',
          fixed: true,
        });
        elements[ptDef.id] = pt;

        // 收集成对的干扰线
        const prefix = ptDef.id.replace(/_[ab]$/, '');
        if (!distractorPairs[prefix]) distractorPairs[prefix] = [];
        distractorPairs[prefix].push(pt);
        return;
      }

      const isCenter = ptDef.id === 'O' || ptDef.id === 'Origin';
      const sanitizePaletteColor = (rawColor?: string, fallback: string = '#38bdf8'): string => {
        if (!rawColor) return fallback;
        const str = String(rawColor).trim().toLowerCase();
        if (
          str === 'black' ||
          str === '#000' ||
          str === '#000000' ||
          str === '#1d1d1f' ||
          str === '#111' ||
          str === '#111827' ||
          str.includes('text-primary') ||
          str.includes('border-subtle') ||
          str === '#475569' ||
          str === '#334155' ||
          str === '#1e293b' ||
          str === '#0f172a'
        ) {
          return fallback;
        }
        if (str.includes('blue') || str === '#0071e3' || str === '#38bdf8') return '#38bdf8';
        if (str.includes('green') || str === '#34c759') return '#34c759';
        if (str.includes('orange') || str.includes('gold') || str.includes('amber') || str === '#f59e0b' || str === '#ff9500') return '#f59e0b';
        if (str.includes('red') || str === '#ff3b30' || str === '#ef4444') return '#f43f5e';
        if (str.includes('purple') || str.includes('indigo') || str === '#818cf8' || str === '#5856d6') return '#818cf8';
        if (str === '#fff' || str === '#ffffff' || str === 'white') return '#ffffff';
        return rawColor;
      };

      const ptColor = isCenter ? '#34c759' : sanitizePaletteColor(ptDef.color, '#38bdf8');

      const pt = board.create('point', [ptDef.x ?? 0, ptDef.y ?? 0], {
        name: ptDef.name || ptDef.id,
        size: isCenter ? 6 : ptDef.size || 5,
        fillColor: ptColor,
        strokeColor: '#ffffff',
        strokeWidth: 2,
        fixed: !!ptDef.isFixed,
        label: {
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 'bold',
          offset: [-6, 14],
          strokeColor: 'none',
          highlightColor: '#38bdf8',
        },
      });

      // 纯数学约束
      if (ptDef.constraints) {
        pt.on('drag', () => {
          const clampedX = clampDynamicValue(pt.X(), {
            min: ptDef.constraints.minX,
            max: ptDef.constraints.maxX,
            step: ptDef.constraints.stepX,
          });
          const clampedY = clampDynamicValue(pt.Y(), {
            min: ptDef.constraints.minY,
            max: ptDef.constraints.maxY,
            step: ptDef.constraints.stepY,
          });
          pt.setPosition(JXG.COORDS_BY_USER, [clampedX, clampedY]);
        });
      }
      elements[ptDef.id] = pt;
    });

    // 4. 绘制干扰加壳连线 (Camouflage Distractor Lines)
    Object.values(distractorPairs).forEach((pair) => {
      if (pair.length >= 2 && !xrayActive) {
        board.create('segment', [pair[0], pair[1]], {
          strokeColor: '#94a3b8',
          strokeWidth: 1.2,
          dash: 3,
          strokeOpacity: 0.65,
        });
      }
    });

    // 5. 核心几何拓扑绘制 (支持自动多边形与旋转全等手拉手)
    const primaryPoints = Object.keys(elements)
      .filter((k) => !k.startsWith('distractor_') && elements[k].elType === 'point')
      .map((k) => elements[k]);

    const tpl = config.canvas_template || '';

    if (tpl.startsWith('number_axis_')) {
      if (!isAxis) {
        board.create('axis', [[0, 0], [1, 0]], {
          strokeColor: '#475569',
          ticks: { drawZero: true, strokeColor: '#475569', label: { color: '#cbd5e1', fontSize: 11 } },
        });
      }
      if (primaryPoints.length >= 2) {
        board.create('segment', [primaryPoints[0], primaryPoints[1]], {
          strokeColor: '#38bdf8',
          strokeWidth: 3.5,
        });
      }
    } else if (tpl.startsWith('function_')) {
      const getK = () =>
        paramValues['slope_k'] ??
        paramValues['k_prop'] ??
        paramValues['slope_k1'] ??
        paramValues['param_k'] ??
        1;
      const getB = () => paramValues['intercept_b'] ?? paramValues['param_b'] ?? 0;
      const getA = () => paramValues['a_coeff'] ?? paramValues['param_a'] ?? 1;
      const getH = () => paramValues['param_h'] ?? paramValues['param_sym'] ?? 0;
      const getC = () => paramValues['param_c'] ?? 0;
      const getInvK = () => paramValues['inv_k'] ?? paramValues['rect_k'] ?? 6;

      if (tpl.includes('quadratic') || tpl.includes('parabola')) {
        if (tpl.includes('vertex')) {
          const k_vert = paramValues['param_k'] ?? 0;
          board.create('functiongraph', [(x: number) => getA() * Math.pow(x - getH(), 2) + k_vert, -15, 15], {
            strokeColor: '#38bdf8',
            strokeWidth: 2.5,
          });
        } else {
          board.create('functiongraph', [(x: number) => getA() * x * x + getB() * x + getC(), -15, 15], {
            strokeColor: '#38bdf8',
            strokeWidth: 2.5,
          });
        }
      } else if (tpl.includes('inverse')) {
        board.create('functiongraph', [(x: number) => getInvK() / (x || 0.001), -15, 15], {
          strokeColor: '#38bdf8',
          strokeWidth: 2.5,
        });
      } else {
        board.create('functiongraph', [(x: number) => getK() * x + getB(), -15, 15], {
          strokeColor: '#38bdf8',
          strokeWidth: 2.5,
        });
        if (paramValues['slope_k2'] !== undefined) {
          const k2 = paramValues['slope_k2'];
          board.create('functiongraph', [(x: number) => k2 * x, -15, 15], {
            strokeColor: '#818cf8',
            strokeWidth: 2,
          });
        }
      }
    } else {
      // 通用欧氏几何或 4D 变异几何拓扑
      if (elements['O'] && elements['A'] && elements['B'] && elements['C']) {
        // 4D 手拉手 / 旋转全等四点模型
        // 1. 定三角形 OAB
        board.create('polygon', [elements['O'], elements['A'], elements['B']], {
          borders: {
            strokeColor: '#0071e3',
            strokeWidth: xrayActive ? 3 : 2.2,
          },
          fillColor: '#0071e3',
          fillOpacity: 0.22,
        });

        // 2. 动多边形或三角形
        board.create('polygon', [elements['O'], elements['B'], elements['C']], {
          borders: {
            strokeColor: '#818cf8',
            strokeWidth: xrayActive ? 3 : 2.2,
          },
          fillColor: '#818cf8',
          fillOpacity: 0.22,
        });

        // 3. 辅助手拉手虚线
        board.create('segment', [elements['A'], elements['C']], {
          strokeColor: '#fbbf24',
          strokeWidth: 2,
          dash: 3,
          strokeOpacity: xrayActive ? 0.3 : 0.9,
        });
      } else if (primaryPoints.length === 2) {
        board.create('segment', [primaryPoints[0], primaryPoints[1]], {
          strokeColor: '#38bdf8',
          strokeWidth: 3,
        });
      } else if (primaryPoints.length === 3) {
        board.create('polygon', primaryPoints, {
          borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
          fillColor: '#38bdf8',
          fillOpacity: 0.22,
        });
      } else if (primaryPoints.length === 4) {
        board.create('polygon', primaryPoints, {
          borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
          fillColor: '#38bdf8',
          fillOpacity: 0.22,
        });
      } else if (primaryPoints.length >= 5) {
        // 5 点及以上：自动生成封闭多边形发光填充与连线，绝不出现黑屏
        board.create('polygon', primaryPoints, {
          borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
          fillColor: '#38bdf8',
          fillOpacity: 0.22,
        });
        for (let i = 0; i < primaryPoints.length; i++) {
          const nextIdx = (i + 1) % primaryPoints.length;
          board.create('segment', [primaryPoints[i], primaryPoints[nextIdx]], {
            strokeColor: '#38bdf8',
            strokeWidth: 2,
          });
        }
      }
    }

    // 6. 不变量实时外调驱动
    let invariants: any[] = [];
    try {
      const parsed = JSON.parse(config.invariants_display_json || '[]');
      invariants = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {}

    const updateInvariants = () => {
      if (!onInvariantsChange || invariants.length === 0) return;
      const pointMap: Record<string, Point2D> = {};
      Object.keys(elements).forEach((id) => {
        const el = elements[id];
        if (el && typeof el.X === 'function') pointMap[id] = { x: el.X(), y: el.Y() };
      });
      const results = invariants.map((inv, idx) => ({
        id: inv.id || `inv-${idx}`,
        text: formatInvariantText(inv, pointMap, locale),
        isConstant: !!inv.isConstant,
      }));
      onInvariantsChange(results);
    };

    board.on('update', updateInvariants);
    setTimeout(updateInvariants, 80);

    return () => {
      if (boardRef.current) {
        try {
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch (e) {}
        boardRef.current = null;
      }
    };
  }, [config, paramValues, xrayActive, locale, onInvariantsChange]);

  const containerId = `jsxgraph-container-${config.sandbox_id}`;

  return (
    <div
      className={`sandbox-renderer ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '340px',
        background: '#0f172a',
        borderRadius: '14px',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <div id={containerId} ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
