/**
 * 动态值约束核心 (任务 11.2, 设计文档 §7.2.1)
 *
 * 铁律规范：
 * 1. 铁律 1 (P10)：绝对禁止使用 eval 或 new Function，所有约束计算纯数学实现
 * 2. 行为规范：仅处理静态数值界限的 Clamp，保障沙盒内部安全防呆。
 */

export interface ClampConstraints {
  min?: number;
  max?: number;
  step?: number;
}

/**
 * 将任意数值约束在给定的静态范围内（并对齐到 step）
 * 纯数学实现，0 隐式执行。
 */
export function clampDynamicValue(value: number, constraints: ClampConstraints): number {
  if (isNaN(value) || !isFinite(value)) {
    // 降级为 min 或 0
    return constraints.min ?? 0;
  }

  let result = value;

  // 1. 步长对齐 (向最近的 step 倍数靠拢，如果有 min 则以 min 为基准)
  if (constraints.step && constraints.step > 0) {
    const base = constraints.min ?? 0;
    const offset = result - base;
    const steps = Math.round(offset / constraints.step);
    result = base + steps * constraints.step;
  }

  // 2. 约束最小值
  if (typeof constraints.min === 'number') {
    result = Math.max(constraints.min, result);
  }

  // 3. 约束最大值
  if (typeof constraints.max === 'number') {
    result = Math.min(constraints.max, result);
  }

  // 浮点数精度修正
  return parseFloat(result.toFixed(6));
}
