/**
 * 定义域抽样生成器 (任务 7.3, 设计文档 §8.1)
 *
 * 职责：
 * 1. 针对提取到的自由变量集合，在安全正数定义域内生成 5~10 组离散代入环境
 * 2. 避免 0、-1 等易产生奇点 (除以零、负数开方) 的特异点
 * 3. 若无自由变量，返回包含单个空环境的数组 [{}]，支持常数表达式计算
 */

/**
 * 伪随机数发生器 (线性同余 LCG，确保在需要种子时具有可重现性)
 */
function createLcg(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 为一组自由变量生成安全定义域内的代入采样集
 * @param vars 变量名列表 (如 ['x', 'y'])
 * @param sampleCount 采样组数 (规范要求 5~10 组，默认 8 组)
 * @param seed 可选随机种子
 */
export function sampleDomain(
  vars: string[],
  sampleCount = 8,
  seed?: number
): Record<string, number>[] {
  if (!vars || vars.length === 0) {
    return [{}];
  }

  const count = Math.max(5, Math.min(10, sampleCount));
  const rng = seed !== undefined ? createLcg(seed) : Math.random;

  // 基础候选安全散点 (初中代数安全正数，避免 0, 1, -1 造成平凡巧合或奇点)
  const baseSafePoints = [1.8, 2.5, 3.4, 4.6, 5.2, 6.7, 7.3, 8.5, 9.1, 10.4];

  const samples: Record<string, number>[] = [];

  for (let i = 0; i < count; i++) {
    const env: Record<string, number> = {};
    for (let vIdx = 0; vIdx < vars.length; vIdx++) {
      const v = vars[vIdx];
      // 混合确定性基底与微小随机偏移，确保采样散布均匀
      const base = baseSafePoints[(i + vIdx * 3) % baseSafePoints.length];
      const jitter = (rng() - 0.5) * 0.4;
      // 保留 3 位小数，避免极端浮点舍入
      env[v] = Math.round((base + jitter) * 1000) / 1000;
    }
    samples.push(env);
  }

  return samples;
}
