import React, { useEffect, useRef } from 'react';
// import JXG from 'jsxgraph';
const JXG = typeof window !== 'undefined' ? (window as any).JXG || {} : {};
import { calculateViewport, parseViewboxSpec } from '../../engine/sandbox/viewport';
import { clampDynamicValue } from '../../engine/sandbox/clampDynamicValue';
import { formatInvariantText, Point2D, InvariantSpec } from './invariants';

export interface SandboxConfig {
  sandbox_id: string;
  canvas_template: string; // 模板标记，比如 'euclidean' 或 'axis'
  viewbox_spec_json: string;
  drag_points_json: string;
  param_sliders_json: string;
  invariants_display_json: string;
  custom_behavior_id?: string;
}

export interface SandboxRendererProps {
  config: SandboxConfig;
  className?: string;
  style?: React.CSSProperties;
  locale?: string;
}

/**
 * 概念具象沙盒通用渲染引擎 (任务 11.1, 设计文档 §7.3)
 * 
 * 铁律规范：
 * 1. 声明式配置驱动：严禁为单一沙盒手写专用 .tsx 组件。
 * 2. 绝对安全：无 eval/Function，利用 clampDynamicValue 约束动态数据。
 * 3. 响应式视口：基于 viewbox_spec_json 自动计算带 15% 边距的包围盒。
 */
export const SandboxRenderer: React.FC<SandboxRendererProps> = ({ config, className, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. 解析视口配置 (Property 11: >= 15% safety margin)
    const viewboxSpec = parseViewboxSpec(config.viewbox_spec_json);
    const boundingbox = calculateViewport(viewboxSpec);

    // 2. 初始化 JSXGraph Board
    const isAxis = config.canvas_template === 'axis' || config.canvas_template === 'number_axis';
    
    // 清理旧实例
    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
    }

    const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
      boundingbox,
      axis: isAxis,
      grid: true,
      showCopyright: false,
      showNavigation: false,
      keepaspectratio: viewboxSpec.preserveAspectRatio,
      pan: { enabled: true, needShift: false, needTwoFingers: true },
      zoom: { wheel: true, needShift: false },
    });
    
    boardRef.current = board;

    // 解析配置字典
    const elements: Record<string, any> = {};

    // 3. 渲染滑块 (param_sliders_json)
    // 格式示例: [{"id":"angle","min":10,"max":80,"default":36.87,"step":0.1}]
    let sliders: any[] = [];
    try {
      sliders = JSON.parse(config.param_sliders_json || '[]');
    } catch (e) {}

    sliders.forEach((sliderDef, index) => {
      // 动态分配一下垂直位置，避免重叠
      const yPos = boundingbox[1] - 1 - (index * 1.5);
      const slider = board.create('slider', [
        [sliderDef.x ?? boundingbox[0] + 1, yPos],
        [(sliderDef.x ?? boundingbox[0] + 1) + (sliderDef.length || 5), yPos],
        [sliderDef.min ?? -10, sliderDef.default ?? sliderDef.value ?? 1, sliderDef.max ?? 10]
      ], {
        name: sliderDef.name || sliderDef.id,
        snapWidth: sliderDef.step || 0.1,
      });
      elements[sliderDef.id] = slider;
    });

    // 4. 渲染动点 (drag_points_json)
    // 格式示例: [{"id":"C","x":0,"y":3,"constrainTo":"circle_diameter"}]
    let dragPoints: any[] = [];
    try {
      dragPoints = JSON.parse(config.drag_points_json || '[]');
    } catch (e) {}

    dragPoints.forEach((ptDef) => {
      const pt = board.create('point', [ptDef.x ?? 0, ptDef.y ?? 0], {
        name: ptDef.name || ptDef.id,
        size: ptDef.size || 4,
        fillColor: ptDef.color || 'var(--ios-blue)',
        strokeColor: ptDef.strokeColor || 'white',
      });
      
      // 铁律 1/P10：不使用 eval，使用纯数学 clamp 约束点
      if (ptDef.constraints) {
        pt.on('drag', () => {
          const clampedX = clampDynamicValue(pt.X(), { 
            min: ptDef.constraints.minX, 
            max: ptDef.constraints.maxX,
            step: ptDef.constraints.stepX
          });
          const clampedY = clampDynamicValue(pt.Y(), { 
            min: ptDef.constraints.minY, 
            max: ptDef.constraints.maxY,
            step: ptDef.constraints.stepY
          });
          pt.setPosition(JXG.COORDS_BY_USER, [clampedX, clampedY]);
        });
      }
      elements[ptDef.id] = pt;
    });

    // 5. 渲染展示标签/不变量 (invariants_display_json)
    // 格式示例: {"labelZh":"面积守恒","formula":"a^2 + b^2 = c^2"} 或者是数组
    let invariants: InvariantSpec[] = [];
    try {
      const parsed = JSON.parse(config.invariants_display_json || '[]');
      invariants = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {}

    invariants.forEach((inv, idx) => {
      if (!inv || (!inv.formula && !inv.labelZh && !inv.label)) return;
      board.create('text', [
        inv.x ?? boundingbox[0] + 0.5, 
        inv.y ?? boundingbox[3] + 1 + (idx * 1.5), 
        () => {
          // 提取当前所有动点的瞬时坐标
          const pointMap: Record<string, Point2D> = {};
          if (inv.deps) {
            for (const depId of inv.deps) {
              const el = elements[depId];
              if (el && typeof el.X === 'function' && typeof el.Y === 'function') {
                pointMap[depId] = { x: el.X(), y: el.Y() };
              }
            }
          }
          return formatInvariantText(inv, pointMap, 'zh-CN');
        }
      ], {
        fontSize: 16,
        color: 'var(--text-primary)'
      });
    });

    // 6. 逃生舱机制 (customBehaviorId)
    // 在极其特殊的沙盒中，纯配置无法满足，允许代码硬编码处理（仍禁 eval）
    if (config.custom_behavior_id) {
      applyCustomBehavior(board, elements, config.custom_behavior_id);
    }

    return () => {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [config]);

  // 给 container 设置一个唯一的 ID，供 JSXGraph 使用
  const containerId = `jsxgraph-container-${config.sandbox_id}`;

  return (
    <div 
      className={`sandbox-renderer ${className || ''}`}
      style={{
        width: '100%',
        height: '400px', // 默认高度，可被外层覆盖
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.06)',
        ...style
      }}
    >
      <div 
        id={containerId}
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

/**
 * 逃生舱处理器
 * 匹配特定 custom_behavior_id 进行硬编码挂载
 */
function applyCustomBehavior(board: any, elements: Record<string, any>, behaviorId: string) {
  if (!board || !elements) return; // Prevent unused parameter warning

  switch (behaviorId) {
    case 'triangle-incenter':
      // 手工创建三角形内心逻辑等
      break;
    default:
      console.warn(`[SandboxRenderer] 未知逃生舱行为 ID: ${behaviorId}`);
  }
}
