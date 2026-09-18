/**
 * 选择题答案归一化容错工具 (TASK-FE-0004 §4.7 / §6)
 *
 * 容错规则：
 * 1. 剔除 markdown 强调符 (*, _, #)
 * 2. 剔除中英文标点 (., 。, ．, 、, :, ：)
 * 3. 剔除括号与答案前缀 (如 (A), [A], 【A】, 答案: A, 【答案】A)
 * 4. 剔除空白字符并转为大写
 *
 * 举例：
 * - 'A' vs '*A*' -> 'A' vs 'A' (判对)
 * - 'A.' vs 'A．' -> 'A' vs 'A' (判对)
 * - '  b  ' vs 'B' -> 'B' vs 'B' (判对)
 * - '【答案】C' vs 'C' -> 'C' vs 'C' (判对)
 */
export function normalizeOptionAnswer(answer: string | undefined | null): string {
  if (!answer) return '';
  let cleaned = String(answer).trim();
  // 移除常见前缀如 "【答案】", "答案：", "答案:" 等
  cleaned = cleaned.replace(/^(?:【?答案】?|参考答案)[\s:：]*/i, '');
  // 移除常见符号: *, _, #, 英文/中文句号与点, 顿号, 冒号, 括号
  cleaned = cleaned.replace(/[*_#\s\.\u3002\uFF0E\u3001:：\(\)\[\]【】（）]/g, '');
  return cleaned.toUpperCase();
}
