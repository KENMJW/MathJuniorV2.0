/**
 * 填空题数学等价判定算法 (任务 7.4, 设计文档 §8.1, Property 7, 铁律 1)
 *
 * 判分核心流程：
 * 1. 规范化清洗 (normalizeMathString)
 * 2. 分类讨论多解答案按 或 / , / ; 拆解为无序集合
 * 3. 单式字面比对 -> 受控白名单解析 (parseControlled)
 * 4. 定义域内多点代入抽样验算 (|Δ| < 1e-6)
 * 5. 解析失败或命中危险 token -> 返回 'suspect' (疑似正确，建议自核)
 * 6. 严禁任何 eval() / new Function()
 */

import { normalizeMathString } from './normalize';
import { parseControlled, Expr } from './parser';
import { evalExpr, collectVars } from './evalExpr';
import { sampleDomain } from './sampleDomain';

/**
 * 拆解分类答案为无序集合 (支持 或 / or / \lor / , / ; / 、 以及 ± 展开)
 */
export function splitAnswerSet(raw: string): string[] {
  if (!raw) return [];
  const normalized = normalizeMathString(raw);

  // 按分类连接词拆分
  const rawParts = normalized
    .split(/(?:或|\bor\b|\\lor|,|;)+/i)
    .map((p) => p.trim())
    .filter(Boolean);

  // 展开 ± (正负号) 为两组解
  const expanded: string[] = [];
  for (const part of rawParts) {
    if (part.includes('±')) {
      expanded.push(part.replace(/±/g, '+'));
      expanded.push(part.replace(/±/g, '-'));
    } else {
      expanded.push(part);
    }
  }

  return expanded.length > 0 ? expanded : [normalized];
}

/**
 * 单个数学表达式的等价判定
 */
function isSingleAnswerEquivalent(
  studentExpr: string,
  standardExpr: string,
  domainSamples?: Record<string, number>[]
): boolean | 'suspect' {
  let s = normalizeMathString(studentExpr);
  let t = normalizeMathString(standardExpr);

  // 1. 纯字面精确匹配
  if (s === t) return true;
  if (!s && !t) return true;
  if (!s || !t) return false;

  // 2. 自适应消除方程前缀 (如 "x=2" 与 "2")
  const eqRegex = /^([a-zA-Z])=(.+)$/;
  const matchS = s.match(eqRegex);
  const matchT = t.match(eqRegex);

  if (matchS && matchT) {
    // 双方均有变量名，但变量名不同 (如 x=2 与 y=2) 则判定不等价
    if (matchS[1].toLowerCase() !== matchT[1].toLowerCase()) {
      return false;
    }
    s = matchS[2];
    t = matchT[2];
  } else if (matchS && !matchT) {
    s = matchS[2];
  } else if (!matchS && matchT) {
    t = matchT[2];
  }

  // 再次字面比对
  if (s === t) return true;

  // 3. 受控白名单解析 (绝不执行 eval)
  let astS: Expr;
  let astT: Expr;
  try {
    astS = parseControlled(s);
    astT = parseControlled(t);
  } catch (err) {
    // 语法无法解析或命中危险标记 (FORBIDDEN) -> 兜底标记 suspect，避免误扣分
    return 'suspect';
  }

  // 4. 提取自由变量并在定义域内抽样代入
  const vars = collectVars(astS, astT);
  const samples =
    domainSamples && domainSamples.length > 0
      ? domainSamples
      : sampleDomain(vars, 8);

  let validSampleCount = 0;
  for (const env of samples) {
    const valS = evalExpr(astS, env);
    const valT = evalExpr(astT, env);

    // 跳过定义域外的非法采样点 (如除以零、负数开方)
    if (isNaN(valS) || isNaN(valT) || !isFinite(valS) || !isFinite(valT)) {
      continue;
    }

    validSampleCount++;
    // 各采样点数值容差 |Δ| < 1e-6
    if (Math.abs(valS - valT) >= 1e-6) {
      return false;
    }
  }

  // 若所有采样点均落入定义域外无法确证数值，安全降级为 suspect
  if (validSampleCount === 0) {
    return 'suspect';
  }

  return true;
}

/**
 * 校验填空题学生作答与标准答案的数学等价性 (Property 7)
 *
 * @param studentAnswer 学生作答字符串
 * @param standardAnswer 标准答案字符串
 * @param domainSamples 可选自定义代入环境集
 * @returns true (等价) | false (不等价) | 'suspect' (疑似正确，建议自核)
 */
export function isMathAnswerEquivalent(
  studentAnswer: string,
  standardAnswer: string,
  domainSamples?: Record<string, number>[]
): boolean | 'suspect' {
  const normS = normalizeMathString(studentAnswer);
  const normT = normalizeMathString(standardAnswer);

  // 1. 全局字面直接匹配
  if (normS === normT) return true;
  if (!normS && !normT) return true;
  if (!normS || !normT) return false;

  // 2. 拆分为无序解集合比对 (支持 或 / , / ; / ±)
  const studentParts = splitAnswerSet(studentAnswer);
  const standardParts = splitAnswerSet(standardAnswer);

  // 如果双方都是单式且没有分类拆分，直接单式比对
  if (studentParts.length === 1 && standardParts.length === 1) {
    return isSingleAnswerEquivalent(studentParts[0], standardParts[0], domainSamples);
  }

  // 集合基数不等，直接判错
  if (studentParts.length !== standardParts.length) {
    return false;
  }

  // 二分图无序匹配
  const usedStandard = new Set<number>();
  let hasSuspect = false;

  for (const sPart of studentParts) {
    let matched = false;
    let localSuspect = false;

    for (let tIdx = 0; tIdx < standardParts.length; tIdx++) {
      if (usedStandard.has(tIdx)) continue;

      const res = isSingleAnswerEquivalent(sPart, standardParts[tIdx], domainSamples);
      if (res === true) {
        usedStandard.add(tIdx);
        matched = true;
        break;
      } else if (res === 'suspect') {
        localSuspect = true;
      }
    }

    if (!matched) {
      if (localSuspect) {
        hasSuspect = true;
      } else {
        return false;
      }
    }
  }

  if (hasSuspect) {
    return 'suspect';
  }

  return usedStandard.size === standardParts.length;
}
