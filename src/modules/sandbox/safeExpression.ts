/**
 * 安全表达式求值引擎 (TASK-FE-0014 安全红线：零 eval / 零 new Function)
 *
 * 采用递归下降解析器 (Recursive Descent Parser)，纯数学逻辑，免疫任何代码注入。
 * 支持：
 * - 数值常数、标识符变量（如 param_a, b, Delta, x1 等）
 * - 运算符：+ - * / % ^
 * - 关系运算符：> < >= <= == !=
 * - 逻辑运算符：&& || !
 * - 三元运算符：condition ? expr1 : expr2
 * - 数学内置函数：sqrt, abs, sin, cos, tan, floor, ceil, round, min, max, pow
 */

type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENT'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'QUESTION'
  | 'COLON'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  num?: number;
}

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = expr.length;

  while (i < n) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // 字符串字面量 '...' 或 "..."
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let str = '';
      i++;
      while (i < n && expr[i] !== quote) {
        str += expr[i];
        i++;
      }
      if (i < n) i++; // 跳过结束引号
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // 数字
    if (/\d/.test(ch) || (ch === '.' && i + 1 < n && /\d/.test(expr[i + 1]))) {
      let numStr = '';
      while (i < n && (/[\d.]/.test(expr[i]))) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr, num: parseFloat(numStr) });
      continue;
    }

    // 自动剥离 Math. 前缀 (如 Math.abs, Math.sqrt 等)
    if (expr.slice(i, i + 5) === 'Math.') {
      i += 5;
      continue;
    }

    // 三字符操作符
    const threeChars = expr.slice(i, i + 3);
    if (threeChars === '===' || threeChars === '!==') {
      tokens.push({ type: 'OPERATOR', value: threeChars === '===' ? '==' : '!=' });
      i += 3;
      continue;
    }

    // 两字符操作符
    const twoChars = expr.slice(i, i + 2);
    if (['>=', '<=', '==', '!=', '&&', '||'].includes(twoChars)) {
      tokens.push({ type: 'OPERATOR', value: twoChars });
      i += 2;
      continue;
    }

    // 单字符操作符与标点
    if (['+', '-', '*', '/', '%', '^', '>', '<', '!'].includes(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    if (ch === '?') {
      tokens.push({ type: 'QUESTION', value: '?' });
      i++;
      continue;
    }

    if (ch === ':') {
      tokens.push({ type: 'COLON', value: ':' });
      i++;
      continue;
    }

    // 标识符 (变量或函数名，支持含下划线、字母、数字、点号属性访问)
    if (/[a-zA-Z_\u4e00-\u9fa5]/.test(ch)) {
      let ident = '';
      while (i < n && /[a-zA-Z0-9_\u4e00-\u9fa5.]/.test(expr[i])) {
        // 如果是点号，但下一个字符不是字母/下划线，则停止（避免混淆浮点数）
        if (expr[i] === '.' && (i + 1 >= n || !/[a-zA-Z_]/.test(expr[i + 1]))) {
          break;
        }
        ident += expr[i];
        i++;
      }
      tokens.push({ type: 'IDENT', value: ident });
      continue;
    }

    // 忽略无法识别字符
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos = 0;
  private vars: Record<string, any>;

  constructor(tokens: Token[], vars: Record<string, any>) {
    this.tokens = tokens;
    this.vars = vars;
  }

  private peek(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '' };
  }

  private consume(type?: TokenType): Token {
    const tok = this.peek();
    if (type && tok.type !== type) {
      throw new Error(`Expected token type ${type}, got ${tok.type}`);
    }
    this.pos++;
    return tok;
  }

  public parse(): any {
    const res = this.parseTernary();
    return res;
  }

  // 三元运算符: cond ? expr1 : expr2
  private parseTernary(): any {
    let expr = this.parseLogicalOr();

    if (this.peek().type === 'QUESTION') {
      this.consume('QUESTION');
      const trueVal = this.parseTernary();
      this.consume('COLON');
      const falseVal = this.parseTernary();
      return expr ? trueVal : falseVal;
    }

    return expr;
  }

  // ||
  private parseLogicalOr(): any {
    let left = this.parseLogicalAnd();
    while (this.peek().type === 'OPERATOR' && this.peek().value === '||') {
      this.consume();
      const right = this.parseLogicalAnd();
      left = Boolean(left || right);
    }
    return left;
  }

  // &&
  private parseLogicalAnd(): any {
    let left = this.parseEquality();
    while (this.peek().type === 'OPERATOR' && this.peek().value === '&&') {
      this.consume();
      const right = this.parseEquality();
      left = Boolean(left && right);
    }
    return left;
  }

  // ==, !=
  private parseEquality(): any {
    let left = this.parseRelational();
    while (this.peek().type === 'OPERATOR' && (this.peek().value === '==' || this.peek().value === '!=')) {
      const op = this.consume().value;
      const right = this.parseRelational();
      if (op === '==') {
        left = left == right;
      } else {
        left = left != right;
      }
    }
    return left;
  }

  // <, <=, >, >=
  private parseRelational(): any {
    let left = this.parseAdditive();
    while (
      this.peek().type === 'OPERATOR' &&
      ['<', '<=', '>', '>='].includes(this.peek().value)
    ) {
      const op = this.consume().value;
      const right = this.parseAdditive();
      if (op === '<') left = left < right;
      else if (op === '<=') left = left <= right;
      else if (op === '>') left = left > right;
      else if (op === '>=') left = left >= right;
    }
    return left;
  }

  // +, -
  private parseAdditive(): any {
    let left = this.parseMultiplicative();
    while (this.peek().type === 'OPERATOR' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      if (op === '+') {
        left = left + right;
      } else {
        left = left - right;
      }
    }
    return left;
  }

  // *, /, %
  private parseMultiplicative(): any {
    let left = this.parsePower();
    while (
      this.peek().type === 'OPERATOR' &&
      (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')
    ) {
      const op = this.consume().value;
      const right = this.parsePower();
      if (op === '*') {
        left = left * right;
      } else if (op === '/') {
        left = right === 0 ? 0 : left / right;
      } else if (op === '%') {
        left = right === 0 ? 0 : left % right;
      }
    }
    return left;
  }

  // ^ (幂)
  private parsePower(): any {
    let left = this.parseUnary();
    if (this.peek().type === 'OPERATOR' && this.peek().value === '^') {
      this.consume();
      const right = this.parsePower(); // 右结合
      left = Math.pow(Number(left), Number(right));
    }
    return left;
  }

  // 一元运算符: +, -, !
  private parseUnary(): any {
    if (this.peek().type === 'OPERATOR' && (this.peek().value === '+' || this.peek().value === '-' || this.peek().value === '!')) {
      const op = this.consume().value;
      const operand = this.parseUnary();
      if (op === '-') return -operand;
      if (op === '+') return +operand;
      if (op === '!') return !operand;
    }
    return this.parsePrimary();
  }

  // 基本元: 数字、字符串、标识符、函数调用、括号
  private parsePrimary(): any {
    const tok = this.peek();

    if (tok.type === 'NUMBER') {
      this.consume();
      return tok.num ?? 0;
    }

    if (tok.type === 'STRING') {
      this.consume();
      return tok.value;
    }

    if (tok.type === 'LPAREN') {
      this.consume('LPAREN');
      const val = this.parseTernary();
      if (this.peek().type === 'RPAREN') {
        this.consume('RPAREN');
      }
      return val;
    }

    if (tok.type === 'IDENT') {
      const ident = this.consume('IDENT').value;

      // 判断是否是函数调用 fn(arg1, arg2, ...)
      if (this.peek().type === 'LPAREN') {
        this.consume('LPAREN');
        const args: any[] = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseTernary());
          while (this.peek().type === 'COMMA') {
            this.consume('COMMA');
            args.push(this.parseTernary());
          }
        }
        if (this.peek().type === 'RPAREN') {
          this.consume('RPAREN');
        }
        return this.callMathFunction(ident, args);
      }

      // 常量或变量求值
      if (ident === 'true') return true;
      if (ident === 'false') return false;
      if (ident === 'null') return null;
      if (ident === 'pi' || ident === 'PI') return Math.PI;
      if (ident === 'e' || ident === 'E') return Math.E;

      // 别名归一化查找变量
      const normalizedKey = ident.toLowerCase();

      // 支持对象属性访问如 p_intersect.x
      if (ident.includes('.')) {
        const parts = ident.split('.');
        let cur: any = this.vars;
        for (const p of parts) {
          if (cur && typeof cur === 'object') {
            cur = cur[p] ?? cur[p.toLowerCase()] ?? cur[`param_${p}`];
          } else {
            cur = undefined;
            break;
          }
        }
        if (cur !== undefined) return cur;
        const underKey = ident.replace(/\./g, '_').toLowerCase();
        for (const [k, v] of Object.entries(this.vars)) {
          if (k.toLowerCase() === underKey || k.replace(/^param_/, '').toLowerCase() === underKey) {
            return v;
          }
        }
      }

      for (const [k, v] of Object.entries(this.vars)) {
        if (k.toLowerCase() === normalizedKey) {
          return v;
        }
        // 支持去掉前缀如 param_a -> a
        if (k.replace(/^param_/, '').toLowerCase() === normalizedKey) {
          return v;
        }
      }

      return 0;
    }

    // 默认回退
    this.consume();
    return 0;
  }

  private callMathFunction(fn: string, args: any[]): any {
    const lower = fn.toLowerCase();
    const a0 = Number(args[0] ?? 0);
    const a1 = Number(args[1] ?? 0);

    switch (lower) {
      case 'sqrt':
        return a0 < 0 ? 0 : Math.sqrt(a0);
      case 'abs':
        return Math.abs(a0);
      case 'sin':
        return Math.sin(a0);
      case 'cos':
        return Math.cos(a0);
      case 'tan':
        return Math.tan(a0);
      case 'floor':
        return Math.floor(a0);
      case 'ceil':
        return Math.ceil(a0);
      case 'round':
        return Math.round(a0);
      case 'min':
        return Math.min(...args.map(Number));
      case 'max':
        return Math.max(...args.map(Number));
      case 'pow':
        return Math.pow(a0, a1);
      default:
        return 0;
    }
  }
}

/**
 * 纯数学安全表达式求值入口
 * @param expr 表达式字符串，如 "b^2 - 4*a*c" 或 "Delta >= 0"
 * @param scope 变量作用域字典，如 { a: 1, b: -2, c: -3, Delta: 16 }
 */
export function evaluateSafeExpression(expr: string, scope: Record<string, any> = {}): any {
  if (!expr || typeof expr !== 'string') return 0;
  const trimmed = expr.trim();
  if (!trimmed) return 0;

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens, scope);
    return parser.parse();
  } catch (err) {
    return 0;
  }
}
