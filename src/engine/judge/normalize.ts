/**
 * 数学答案规范化清洗模块 (任务 7.1, 设计文档 §8.1, Property 6)
 *
 * 职责：
 * 1. 全角字符转半角 (包括数字、字母、空格、标点)
 * 2. 彻底清除所有空白字符
 * 3. 递归清洗 \\frac{A}{B} -> (A)/(B) 与 \\sqrt{X} -> sqrt(X)
 * 4. 标准化 LaTeX 运算符 (\\times, \\cdot, \\div, \\pm, \\pi)
 * 5. 纯字符串变换，零求值，绝对不调用 eval / Function
 */

/**
 * 将全角字符转换为半角字符
 */
export function toHalfWidth(str: string): string {
  if (!str) return '';
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code === 0x3000) {
      // 全角空格 -> 半角空格
      result += ' ';
    } else if (code >= 0xff01 && code <= 0xff5e) {
      // 全角 ASCII 字符 (！~～) -> 半角 (!~~)
      result += String.fromCharCode(code - 0xfee0);
    } else if (code === 0x3010) {
      // 【 -> [
      result += '[';
    } else if (code === 0x3011) {
      // 】 -> ]
      result += ']';
    } else if (code === 0x3001) {
      // 中文顿号 、 -> ,
      result += ',';
    } else {
      result += str[i];
    }
  }
  return result;
}

/**
 * 清洗 LaTeX 与数学文本为标准代数表达形式 (Property 6)
 * @param raw 原始作答或标准答案字符串
 */
export function normalizeMathString(raw: string): string {
  if (!raw) return '';

  // 1. 全角转半角
  let s = toHalfWidth(raw);

  // 2. 去除所有空白字符
  s = s.replace(/\s+/g, '');

  // 3. 剥离外层行内/行间公式标记 $...$ 或 $$...$$
  if (s.startsWith('$$') && s.endsWith('$$') && s.length >= 4) {
    s = s.slice(2, -2);
  } else if (s.startsWith('$') && s.endsWith('$') && s.length >= 2) {
    s = s.slice(1, -1);
  }

  // 4. 符号归一化 (在清洗 frac 和 sqrt 前后均做替换)
  s = s
    .replace(/\\times/g, '*')
    .replace(/\\cdot/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pm/g, '±')
    .replace(/\\pi/g, 'pi')
    .replace(/\\degree/g, '')
    .replace(/\^\{\\circ\}/g, '')
    .replace(/\^\circ/g, '')
    .replace(/度/g, '');

  // 5. 循环递归消除嵌套 \frac{num}{den} -> ((num)/(den))
  let prev = '';
  while (s !== prev && s.includes('\\frac')) {
    prev = s;
    // 匹配带花括号的标准 \frac{a}{b}
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
    // 匹配简写单个字符 \frac12
    s = s.replace(/\\frac([0-9a-zA-Z])([0-9a-zA-Z])/g, '(($1)/($2))');
  }

  // 6. 循环递归消除嵌套 \sqrt{arg} -> sqrt(arg)
  prev = '';
  while (s !== prev && s.includes('\\sqrt')) {
    prev = s;
    // 匹配 \sqrt[n]{x} -> (x)^(1/(n))
    s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, '(($2)^(1/($1)))');
    // 匹配标准 \sqrt{x} -> sqrt(x)
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
    // 匹配简写单个字符 \sqrt2 -> sqrt(2)
    s = s.replace(/\\sqrt([0-9a-zA-Z])/g, 'sqrt($1)');
  }

  // 7. 处理残余花括号 (在非 LaTeX 指令场景如 {x} -> (x))
  // 如果还有单独的花括号，转为圆括号便于解析器识别
  s = s.replace(/\{([^{}]+)\}/g, '($1)');

  // 再次去除可能遗留的空白
  s = s.replace(/\s+/g, '');

  return s;
}
