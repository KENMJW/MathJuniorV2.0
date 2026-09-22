import React, { useEffect, useRef } from 'react';
import JXGModule from 'jsxgraph';

const JXG =
  typeof window !== 'undefined' && (window as any).JXG?.JSXGraph
    ? (window as any).JXG
    : JXGModule;
import { calculateViewport, parseViewboxSpec } from '../../engine/sandbox/viewport';
import { formatInvariantText, Point2D } from './invariants';
import { evaluateSafeExpression } from './safeExpression';
import { DiscreteOrthographicRenderer } from './DiscreteOrthographicRenderer';

export interface SandboxConfig {
  sandbox_id: string;
  canvas_template: string; // 模板标记，比如 'euclidean' 或 'axis' 或契约 10 大类
  viewbox_spec_json: string;
  drag_points_json: string;
  param_sliders_json?: string;
  invariants_display_json?: string;
  carrier_json?: string;
  custom_behavior_id?: string;
  inquiry_guide_zh?: string;
  inquiry_guide_en?: string;
  [key: string]: any;
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
 * 概念与跃迁通用沙盒渲染引擎 (TASK-FE-0014 契约总表 10 大类全要素支持)
 *
 * 铁律规范与视觉标准：
 * 1. 纯净画布：绝不在 JSXGraph 画布内创建滑块 (board.create('slider'))，所有控制外置于底部 HTML 控制条；
 * 2. 高对比度暗色视口：背景固定为 #0f172a，轴线 #64748b，刻度文字 #cbd5e1，辅助线 #94a3b8，主图形亮天蓝 #38bdf8 / 品牌蓝 #0071e3 / 靛紫 #818cf8 / 琥珀金 #f59e0b；
 * 3. 契约驱动图元分发：支持 carrier.elements 声明式图元规格 (functiongraph, line, point, segment, circle) + condition 智能显隐；
 * 4. 10 大类数学模型特化渲染：圆图元落地、三视图正交投影、双三角形拓扑分离、特殊四边形向量闭环、连续函数实时重绘；
 * 5. 安全公式求值：零 eval / 零 Function。
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

  const tpl = config.canvas_template || '';

  // 第十类：三视图正交投影独立渲染引擎分发
  if (tpl === 'discrete_orthographic_three_view') {
    return (
      <DiscreteOrthographicRenderer
        paramValues={paramValues}
        className={className}
        style={style}
        onInvariantsChange={onInvariantsChange}
      />
    );
  }

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. 解析视口包围盒
    const viewboxSpec = parseViewboxSpec(config.viewbox_spec_json);
    const boundingbox = calculateViewport(viewboxSpec);

    // 2. 判断是否显示直角坐标轴 (axis)
    const isAxis =
      config.canvas_template === 'axis' ||
      tpl.startsWith('number_axis') ||
      tpl.startsWith('function_') ||
      tpl.includes('vieta') ||
      tpl.includes('linear') ||
      tpl.includes('quadratic') ||
      tpl.includes('parabola') ||
      tpl.includes('inverse');

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

    // 构建上下文计算 scope
    const buildCurrentScope = (): Record<string, any> => {
      const scope: Record<string, any> = { ...paramValues };
      // 提取常用系数及其简写别名
      const a = paramValues['param_a'] ?? paramValues['a_coeff'] ?? paramValues['a'] ?? 1;
      const b = paramValues['param_b'] ?? paramValues['intercept_b'] ?? paramValues['b'] ?? -2;
      const c = paramValues['param_c'] ?? paramValues['c'] ?? -3;
      const k = paramValues['slope_k'] ?? paramValues['inv_k'] ?? paramValues['rect_k'] ?? paramValues['k'] ?? 1;

      scope['param_a'] = a;
      scope['a'] = a;
      scope['param_b'] = b;
      scope['b'] = b;
      scope['param_c'] = c;
      scope['c'] = c;
      scope['k'] = k;
      scope['slope_k'] = k;
      scope['Delta'] = b * b - 4 * a * c;
      scope['delta_val'] = b * b - 4 * a * c;
      return scope;
    };

    const currentScope = buildCurrentScope();

    // 3. 检查是否有声明式 carrier 规范 (如 LM-9A-18 规格的 carrier.elements)
    let declarativeCarrier: any = null;
    if (config.carrier_json) {
      try {
        declarativeCarrier = JSON.parse(config.carrier_json);
      } catch (e) {}
    } else if ((config as any).carrier) {
      declarativeCarrier = (config as any).carrier;
    }

    // 若有声明式 carrier elements
    if (declarativeCarrier && Array.isArray(declarativeCarrier.elements) && declarativeCarrier.elements.length > 0) {
      const carrierElements = declarativeCarrier.elements;

      carrierElements.forEach((elemDef: any) => {
        // 条件显隐评估 (如 condition: "Delta >= 0")
        if (elemDef.condition) {
          const isSatisfied = evaluateSafeExpression(elemDef.condition, currentScope);
          if (!isSatisfied) {
            return; // 不满足条件，平滑隐藏
          }
        }

        const color = elemDef.color || '#38bdf8';
        const strokeWidth = elemDef.strokeWidth || (xrayActive ? 3.5 : 2.5);

        switch (elemDef.type) {
          case 'functiongraph': {
            if (elemDef.fn) {
              const fnStr = elemDef.fn;
              // X-Ray 发光底晕
              if (xrayActive) {
                board.create(
                  'functiongraph',
                  [
                    (x: number) => evaluateSafeExpression(fnStr, { ...currentScope, x }),
                    -20,
                    20,
                  ],
                  {
                    strokeColor: '#0071e3',
                    strokeWidth: 6,
                    strokeOpacity: 0.4,
                  }
                );
              }
              const fg = board.create(
                'functiongraph',
                [
                  (x: number) => evaluateSafeExpression(fnStr, { ...currentScope, x }),
                  -20,
                  20,
                ],
                {
                  strokeColor: color,
                  strokeWidth,
                }
              );
              elements[elemDef.id || 'fg'] = fg;
            }
            break;
          }

          case 'line': {
            // 对称轴直线 x = -b/(2a) 或其他直线
            if (elemDef.fn && elemDef.fn.includes('x =')) {
              const xExpr = elemDef.fn.replace('x =', '').trim();
              const lineX = Number(evaluateSafeExpression(xExpr, currentScope));
              const line = board.create(
                'line',
                [
                  [lineX, -20],
                  [lineX, 20],
                ],
                {
                  strokeColor: color,
                  strokeWidth: elemDef.strokeWidth || 1.8,
                  dash: elemDef.dash || 2,
                }
              );
              elements[elemDef.id || 'line'] = line;
            }
            break;
          }

          case 'point': {
            if (Array.isArray(elemDef.coord)) {
              const ptX = Number(evaluateSafeExpression(String(elemDef.coord[0]), currentScope));
              const ptY = Number(evaluateSafeExpression(String(elemDef.coord[1]), currentScope));
              const pt = board.create('point', [ptX, ptY], {
                name: elemDef.name || elemDef.id || '',
                size: elemDef.size || 5,
                fillColor: color,
                strokeColor: '#ffffff',
                strokeWidth: 2,
                fixed: true,
                label: {
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 'bold',
                  offset: [-6, 14],
                  strokeColor: 'none',
                },
              });
              elements[elemDef.id || 'pt'] = pt;
            }
            break;
          }

          case 'segment': {
            if (Array.isArray(elemDef.endpoints) && elemDef.endpoints.length >= 2) {
              const p1 = elements[elemDef.endpoints[0]];
              const p2 = elements[elemDef.endpoints[1]];
              if (p1 && p2) {
                const seg = board.create('segment', [p1, p2], {
                  strokeColor: color,
                  strokeWidth: elemDef.strokeWidth || (xrayActive ? 3.5 : 2.5),
                });
                elements[elemDef.id || 'seg'] = seg;
              }
            }
            break;
          }

          case 'circle': {
            // 圆图元落地
            const centerPt = elemDef.center ? elements[elemDef.center] : elements['O'];
            const r = elemDef.radius ? Number(evaluateSafeExpression(String(elemDef.radius), currentScope)) : 4;
            if (centerPt) {
              const c = board.create('circle', [centerPt, r], {
                strokeColor: color,
                strokeWidth,
                fillColor: 'rgba(56, 189, 248, 0.08)',
              });
              elements[elemDef.id || 'circle'] = c;
            }
            break;
          }
        }
      });
    } else {
      // 4. 标准动点解析与具名参数驱动
      let dragPoints: any[] = [];
      try {
        dragPoints = JSON.parse(config.drag_points_json || '[]');
      } catch (e) {}

      const isCircleTemplate =
        tpl.includes('circle') ||
        tpl.includes('inscribed') ||
        tpl.includes('chord') ||
        tpl.includes('tangent') ||
        tpl.includes('sector') ||
        tpl.includes('incircle') ||
        config.sandbox_id === 'SB-KP073';

      // 具名滑块驱动动点坐标
      dragPoints = dragPoints.map((ptDef) => {
        let x = ptDef.x ?? 0;
        let y = ptDef.y ?? 0;

        // 数轴模板：动点 X 坐标响应 param_x0 + param_v * param_t
        if (tpl.startsWith('number_axis')) {
          const x0 = Number(paramValues['param_x0'] ?? 0);
          const v = Number(paramValues['param_v'] ?? 1);
          const t = Number(paramValues['param_t'] ?? 0);
          const pVal = paramValues['pos_p'] ?? paramValues['point_x'] ?? paramValues['pt_x'] ?? paramValues['val'];

          if (pVal !== undefined && (ptDef.id === 'P' || ptDef.name === 'P')) {
            x = Number(pVal);
          } else if (paramValues['param_t'] !== undefined && (ptDef.id === 'P' || ptDef.name === 'P')) {
            x = x0 + v * t;
          }

          if (ptDef.id === 'A' && (paramValues['point_a'] !== undefined || paramValues['interval_a'] !== undefined)) {
            x = Number(paramValues['point_a'] ?? paramValues['interval_a']);
          }
          if (ptDef.id === 'B' && (paramValues['point_b'] !== undefined || paramValues['interval_b'] !== undefined)) {
            x = Number(paramValues['point_b'] ?? paramValues['interval_b']);
          }
        }

        // 直角三角形/勾股定理
        if (tpl.includes('right_triangle') || tpl.includes('pythagorean')) {
          const legA = paramValues['leg_a'];
          const legB = paramValues['leg_b'];
          if (legA !== undefined && (ptDef.id === 'B' || ptDef.name === 'B')) x = Number(legA);
          if (legB !== undefined && (ptDef.id === 'A' || ptDef.name === 'A')) y = Number(legB);
        }

        // 等腰三角形
        if (tpl.includes('isosceles') && paramValues['base_w'] !== undefined) {
          const half = Number(paramValues['base_w']) / 2;
          if (ptDef.id === 'B' || ptDef.name === 'B') x = -half;
          if (ptDef.id === 'C' || ptDef.name === 'C') x = half;
        }

        // 圆模型半径变化
        if (isCircleTemplate) {
          const cr = paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? paramValues['circle_r1'];
          if (cr !== undefined && ptDef.id !== 'O' && ptDef.id !== 'Origin') {
            const curDist = Math.hypot(x, y);
            if (curDist > 0.1) {
              const ratio = Number(cr) / curDist;
              x = x * ratio;
              y = y * ratio;
            }
          }
        }

        return { ...ptDef, x, y };
      });

      // 创建动点
      dragPoints.forEach((ptDef) => {
        const isCenter = ptDef.id === 'O' || ptDef.id === 'Origin';
        const ptColor = isCenter ? '#34c759' : ptDef.color || '#38bdf8';

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
          },
        });
        elements[ptDef.id] = pt;
      });

      const primaryPoints = Object.keys(elements)
        .filter((k) => elements[k].elType === 'point')
        .map((k) => elements[k]);

      // 5. 10 大类专属数学图元拓扑分发
      // (一) 圆图元类
      if (isCircleTemplate) {
        const centerPt = elements['O'] || elements['Origin'] || primaryPoints[0];
        const radiusVal = Number(
          paramValues['r'] ?? paramValues['radius_r'] ?? paramValues['circle_r'] ?? 4
        );

        if (centerPt) {
          if (xrayActive) {
            board.create('circle', [centerPt, radiusVal], {
              strokeColor: '#0071e3',
              strokeWidth: 6,
              strokeOpacity: 0.4,
              fillColor: 'none',
            });
          }
          board.create('circle', [centerPt, radiusVal], {
            strokeColor: '#38bdf8',
            strokeWidth: xrayActive ? 3.5 : 2.2,
            fillColor: 'rgba(56, 189, 248, 0.08)',
          });
        }

        // 圆周角模型 (SB-KP073 / inscribed)
        if (tpl.includes('inscribed') || config.sandbox_id === 'SB-KP073') {
          if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#0071e3', strokeWidth: 2 });
          if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#0071e3', strokeWidth: 2 });
          if (elements['C'] && elements['A']) board.create('segment', [elements['C'], elements['A']], { strokeColor: '#818cf8', strokeWidth: 2.2 });
          if (elements['C'] && elements['B']) board.create('segment', [elements['C'], elements['B']], { strokeColor: '#818cf8', strokeWidth: 2.2 });
          if (elements['A'] && elements['B']) board.create('segment', [elements['A'], elements['B']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
        }
        // 垂径定理 (chord)
        else if (tpl.includes('chord')) {
          if (elements['A'] && elements['B']) board.create('segment', [elements['A'], elements['B']], { strokeColor: '#38bdf8', strokeWidth: 2.5 });
          const midOrD = elements['M'] || elements['D'];
          if (elements['O'] && midOrD) board.create('segment', [elements['O'], midOrD], { strokeColor: '#f59e0b', strokeWidth: 2 });
        }
        // 切线与切线长 (tangent)
        else if (tpl.includes('tangent')) {
          if (elements['P'] && elements['A']) board.create('segment', [elements['P'], elements['A']], { strokeColor: '#34c759', strokeWidth: 2.2 });
          if (elements['P'] && elements['B']) board.create('segment', [elements['P'], elements['B']], { strokeColor: '#34c759', strokeWidth: 2.2 });
          if (elements['O'] && elements['A']) board.create('segment', [elements['O'], elements['A']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          if (elements['O'] && elements['B']) board.create('segment', [elements['O'], elements['B']], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          if (elements['O'] && elements['P']) board.create('segment', [elements['O'], elements['P']], { strokeColor: '#94a3b8', strokeWidth: 1.5, dash: 3 });
        }
      }
      // (二) 数轴动力学与实数夹逼类
      else if (tpl.startsWith('number_axis_')) {
        if (!isAxis) {
          board.create('axis', [[0, 0], [1, 0]], {
            strokeColor: '#475569',
            ticks: { drawZero: true, strokeColor: '#475569', label: { color: '#cbd5e1', fontSize: 11 } },
          });
        }
        // 若存在两个点，连接两点形成区间距离线段
        if (primaryPoints.length >= 2) {
          board.create('segment', [primaryPoints[0], primaryPoints[1]], {
            strokeColor: '#38bdf8',
            strokeWidth: 3.5,
          });
        }
      }
      // (三) 二次函数与韦达模型
      else if (tpl.includes('quadratic') || tpl.includes('parabola') || tpl.includes('vieta')) {
        const a = currentScope['a'];
        const b = currentScope['b'];
        const c = currentScope['c'];
        const delta = currentScope['Delta'];

        // 1. 抛物线连续函数解析式
        board.create('functiongraph', [(x: number) => a * x * x + b * x + c, -20, 20], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });

        // 2. 对称轴虚线 x = -b/(2a)
        if (a !== 0) {
          const symX = -b / (2 * a);
          board.create('line', [[symX, -20], [symX, 20]], {
            strokeColor: '#94a3b8',
            strokeWidth: 1.5,
            dash: 2,
          });
          // 顶点 V
          const vertY = (4 * a * c - b * b) / (4 * a);
          board.create('point', [symX, vertY], {
            name: 'V',
            size: 5,
            fillColor: '#f59e0b',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
        }

        // 3. 判别式条件显隐交点与弦长线段
        if (delta > 0 && a !== 0) {
          const x1 = (-b - Math.sqrt(delta)) / (2 * a);
          const x2 = (-b + Math.sqrt(delta)) / (2 * a);
          const p1 = board.create('point', [x1, 0], {
            name: 'x1',
            size: 5,
            fillColor: '#f43f5e',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
          const p2 = board.create('point', [x2, 0], {
            name: 'x2',
            size: 5,
            fillColor: '#f43f5e',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
          board.create('segment', [p1, p2], {
            strokeColor: '#a855f7',
            strokeWidth: 3,
          });
        } else if (delta === 0 && a !== 0) {
          const x0 = -b / (2 * a);
          board.create('point', [x0, 0], {
            name: 'x',
            size: 5,
            fillColor: '#f43f5e',
            strokeColor: '#ffffff',
            strokeWidth: 2,
            fixed: true,
          });
        }
      }
      // (四) 反比例函数与面积不变性
      else if (tpl.includes('inverse') || tpl.includes('hyperbola')) {
        const invK = Number(paramValues['inv_k'] ?? paramValues['rect_k'] ?? paramValues['k'] ?? 6);
        const tVal = Number(paramValues['x_pos'] ?? paramValues['x_pt'] ?? paramValues['param_t'] ?? 3);

        // 双曲线两支
        board.create('functiongraph', [(x: number) => (x < 0 ? invK / x : NaN), -20, -0.05], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });
        board.create('functiongraph', [(x: number) => (x > 0 ? invK / x : NaN), 0.05, 20], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });

        // 曲线吸附动点 P(t, k/t)
        const ptX = tVal !== 0 ? tVal : 1;
        const ptY = invK / ptX;
        const ptP = board.create('point', [ptX, ptY], {
          name: 'P',
          size: 5,
          fillColor: '#f59e0b',
          strokeColor: '#ffffff',
          strokeWidth: 2,
          fixed: true,
        });

        // 过 P 向双轴作垂线构造矩形高亮面积
        const pXProj = board.create('point', [ptX, 0], { name: '', size: 0, fixed: true, visible: false });
        const pYProj = board.create('point', [0, ptY], { name: '', size: 0, fixed: true, visible: false });
        const pOrigin = board.create('point', [0, 0], { name: '', size: 0, fixed: true, visible: false });

        board.create('polygon', [pOrigin, pXProj, ptP, pYProj], {
          fillColor: '#38bdf8',
          fillOpacity: 0.2,
          borders: { strokeColor: '#38bdf8', strokeWidth: 1.5, dash: 2 },
        });

        // 中心对称点 P'(-t, -k/t)
        const ptPPrime = board.create('point', [-ptX, -ptY], {
          name: "P'",
          size: 4,
          fillColor: '#818cf8',
          strokeColor: '#ffffff',
          strokeWidth: 1.5,
          fixed: true,
        });
        board.create('segment', [ptP, ptPPrime], {
          strokeColor: '#94a3b8',
          strokeWidth: 1.2,
          dash: 3,
        });
      }
      // (五) 一次函数与双线求交
      else if (tpl.includes('linear')) {
        const k1 = Number(paramValues['slope_k'] ?? paramValues['k1'] ?? paramValues['k_prop'] ?? 1);
        const b1 = Number(paramValues['intercept_b'] ?? paramValues['b1'] ?? 0);
        board.create('functiongraph', [(x: number) => k1 * x + b1, -20, 20], {
          strokeColor: '#38bdf8',
          strokeWidth: xrayActive ? 3.5 : 2.5,
        });

        if (paramValues['slope_k2'] !== undefined || paramValues['k2'] !== undefined) {
          const k2 = Number(paramValues['slope_k2'] ?? paramValues['k2'] ?? -1);
          const b2 = Number(paramValues['intercept_b2'] ?? paramValues['b2'] ?? 3);
          board.create('functiongraph', [(x: number) => k2 * x + b2, -20, 20], {
            strokeColor: '#818cf8',
            strokeWidth: 2,
          });

          // 联立求解交点
          if (Math.abs(k1 - k2) > 1e-6) {
            const interX = (b2 - b1) / (k1 - k2);
            const interY = k1 * interX + b1;
            board.create('point', [interX, interY], {
              name: 'P',
              size: 5,
              fillColor: '#f59e0b',
              strokeColor: '#ffffff',
              strokeWidth: 2,
              fixed: true,
            });
          }
        }
      }
      // (六) 三角形全等/相似与双三角形拓扑分离
      else if (
        tpl.includes('congruence') ||
        tpl.includes('similarity') ||
        tpl.includes('projection') ||
        tpl.includes('k_shape') ||
        primaryPoints.length === 6
      ) {
        if (primaryPoints.length >= 6) {
          // 双三角形拓扑分离：前 3 点独立一角 (天蓝)，后 3 点独立一角 (靛紫)
          board.create('polygon', [primaryPoints[0], primaryPoints[1], primaryPoints[2]], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.2,
          });
          board.create('polygon', [primaryPoints[3], primaryPoints[4], primaryPoints[5]], {
            borders: { strokeColor: '#818cf8', strokeWidth: 2.5 },
            fillColor: '#818cf8',
            fillOpacity: 0.2,
          });
        } else if (primaryPoints.length === 3) {
          board.create('polygon', primaryPoints, {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
          });
        }
      }
      // (七) 特殊四边形与向量从动闭环
      else if (
        tpl.includes('parallelogram') ||
        tpl.includes('rectangle') ||
        tpl.includes('rhombus') ||
        tpl.includes('square') ||
        tpl.includes('midpoint_quad')
      ) {
        if (primaryPoints.length >= 4) {
          const ptA = primaryPoints[0];
          const ptB = primaryPoints[1];
          const ptC = primaryPoints[2];
          // 严格向量从动计算 D = A + C - B
          const dX = ptA.X() + ptC.X() - ptB.X();
          const dY = ptA.Y() + ptC.Y() - ptB.Y();
          const ptD = elements['D'] || primaryPoints[3];
          if (ptD && typeof ptD.setPosition === 'function') {
            ptD.setPosition(JXG.COORDS_BY_USER, [dX, dY]);
          }

          // 绘制四边形
          board.create('polygon', [ptA, ptB, ptC, ptD], {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
          });

          // 绘制对角线虚线
          board.create('segment', [ptA, ptC], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });
          board.create('segment', [ptB, ptD], { strokeColor: '#64748b', strokeWidth: 1.5, dash: 2 });

          // 中点衍生四边形
          if (tpl.includes('midpoint') || paramValues['show_midpoints']) {
            const m1X = (ptA.X() + ptB.X()) / 2;
            const m1Y = (ptA.Y() + ptB.Y()) / 2;
            const m2X = (ptB.X() + ptC.X()) / 2;
            const m2Y = (ptB.Y() + ptC.Y()) / 2;
            const m3X = (ptC.X() + ptD.X()) / 2;
            const m3Y = (ptC.Y() + ptD.Y()) / 2;
            const m4X = (ptD.X() + ptA.X()) / 2;
            const m4Y = (ptD.Y() + ptA.Y()) / 2;

            const mp1 = board.create('point', [m1X, m1Y], { name: 'M1', size: 3, fillColor: '#f59e0b', fixed: true });
            const mp2 = board.create('point', [m2X, m2Y], { name: 'M2', size: 3, fillColor: '#f59e0b', fixed: true });
            const mp3 = board.create('point', [m3X, m3Y], { name: 'M3', size: 3, fillColor: '#f59e0b', fixed: true });
            const mp4 = board.create('point', [m4X, m4Y], { name: 'M4', size: 3, fillColor: '#f59e0b', fixed: true });

            board.create('polygon', [mp1, mp2, mp3, mp4], {
              borders: { strokeColor: '#f59e0b', strokeWidth: 2 },
              fillColor: '#f59e0b',
              fillOpacity: 0.15,
            });
          }
        }
      }
      // (八) 基础多边形降级回退
      else {
        if (primaryPoints.length === 2) {
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
        } else if (primaryPoints.length >= 4) {
          board.create('polygon', primaryPoints, {
            borders: { strokeColor: '#38bdf8', strokeWidth: 2.5 },
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
          });
        }
      }
    }

    // 6. 不变量与遥测指标实时外调
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

      const scope = buildCurrentScope();

      const results: Array<{ id: string; text: string; isConstant: boolean }> = [];
      invariants.forEach((inv, idx) => {
        const text = formatInvariantText(inv, pointMap, locale, scope);
        if (text !== null) {
          results.push({
            id: inv.id || `inv-${idx}`,
            text,
            isConstant: !!inv.isConstant,
          });
        }
      });
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

  const containerId = `jsxgraph-container-${config.sandbox_id || 'canvas'}`;

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
