/**
 * 受控白名单表达式解析器 (任务 7.2, 设计文档 §8.1, Property 8)
 *
 * 核心安全机制：
 * 1. 危险 token 硬拦截 FORBIDDEN：命中 Function / eval / window / globalThis / constructor /
 *    import / require / process / => / ` 立即抛出 ParseError，绝不进入任何 JS 求值路径。
 * 2. 纯手写 Tokenizer + 递归下降解析器，仅产出严格受限的白名单 AST (Expr)。
 * 3. 严禁任何 eval()、new Function()、动态代码生成。
 */

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/** 受控白名单 AST 节点定义 */
export type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/' | '^'; l: Expr; r: Expr }
  | { kind: 'call'; fn: 'sqrt' | 'sin' | 'cos' | 'tan' | 'abs'; arg: Expr }
  | { kind: 'neg'; arg: Expr };

/** 危险 token 硬拦截正则 (安全不变量，Property 8) */
export const FORBIDDEN =
  /\b(Function|eval|window|globalThis|constructor|import|require|process|prototype|__proto__|document)\b|=>|`/;

export type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'CARET'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const WHITELIST_FUNCS = new Set(['sqrt', 'sin', 'cos', 'tan', 'abs']);

/**
 * 词法分析器 (带初中数学隐式乘法自动补全)
 */
export function tokenize(input: string): Token[] {
  const rawTokens: Token[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    // 忽略空白
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // 数字 (支持整数与浮点数)
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < len && /[0-9]/.test(input[i + 1]))) {
      const start = i;
      let hasDot = ch === '.';
      i++;
      while (i < len) {
        const c = input[i];
        if (/[0-9]/.test(c)) {
          i++;
        } else if (c === '.' && !hasDot) {
          hasDot = true;
          i++;
        } else {
          break;
        }
      }
      rawTokens.push({
        type: 'NUMBER',
        value: input.slice(start, i),
        pos: start,
      });
      continue;
    }

    // 标识符 (变量名 / 函数名)
    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      while (i < len && /[a-zA-Z0-9_]/.test(input[i])) {
        i++;
      }
      const ident = input.slice(start, i);
      rawTokens.push({
        type: 'IDENT',
        value: ident,
        pos: start,
      });
      continue;
    }

    // 单字符运算符与括号
    const pos = i;
    i++;
    switch (ch) {
      case '+':
        rawTokens.push({ type: 'PLUS', value: '+', pos });
        break;
      case '-':
        rawTokens.push({ type: 'MINUS', value: '-', pos });
        break;
      case '*':
        rawTokens.push({ type: 'STAR', value: '*', pos });
        break;
      case '/':
        rawTokens.push({ type: 'SLASH', value: '/', pos });
        break;
      case '^':
        rawTokens.push({ type: 'CARET', value: '^', pos });
        break;
      case '(':
      case '[':
      case '{':
        rawTokens.push({ type: 'LPAREN', value: '(', pos });
        break;
      case ')':
      case ']':
      case '}':
        rawTokens.push({ type: 'RPAREN', value: ')', pos });
        break;
      default:
        throw new ParseError(`无法识别的数学符号: "${ch}" (位置: ${pos})`);
    }
  }

  // 补全隐式乘法 (如 2x -> 2*x, 2(x+1) -> 2*(x+1), (a)(b) -> (a)*(b))
  const tokens: Token[] = [];
  for (let j = 0; j < rawTokens.length; j++) {
    const curr = rawTokens[j];
    if (j > 0) {
      const prev = rawTokens[j - 1];
      const prevCanEnd =
        prev.type === 'NUMBER' ||
        prev.type === 'IDENT' ||
        prev.type === 'RPAREN';
      const currCanStart =
        curr.type === 'NUMBER' ||
        curr.type === 'IDENT' ||
        curr.type === 'LPAREN';

      const isPrevFunction =
        prev.type === 'IDENT' && WHITELIST_FUNCS.has(prev.value.toLowerCase());

      // 当 prev 是白名单函数且 curr 是左括号时 (如 sqrt(...) )，是参数列表而非隐式乘法
      if (
        prevCanEnd &&
        currCanStart &&
        !(isPrevFunction && curr.type === 'LPAREN')
      ) {
        // 在中间插入隐式乘号
        tokens.push({
          type: 'STAR',
          value: '*',
          pos: curr.pos,
        });
      }
    }
    tokens.push(curr);
  }

  tokens.push({ type: 'EOF', value: '', pos: len });
  return tokens;
}

/**
 * 语法分析器 (递归下降)
 */
class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Expr {
    if (this.peek().type === 'EOF') {
      throw new ParseError('表达式为空');
    }
    const expr = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new ParseError(`未预期的额外字符: "${this.peek().value}"`);
    }
    return expr;
  }

  // 加减运算 (最低优先级)
  private parseExpression(): Expr {
    let expr = this.parseTerm();

    while (this.match('PLUS', 'MINUS')) {
      const op = this.previous().type === 'PLUS' ? '+' : '-';
      const right = this.parseTerm();
      expr = { kind: 'bin', op, l: expr, r: right };
    }

    return expr;
  }

  // 乘除运算
  private parseTerm(): Expr {
    let expr = this.parsePower();

    while (this.match('STAR', 'SLASH')) {
      const op = this.previous().type === 'STAR' ? '*' : '/';
      const right = this.parsePower();
      expr = { kind: 'bin', op, l: expr, r: right };
    }

    return expr;
  }

  // 幂运算 (^ 右结合)
  private parsePower(): Expr {
    const expr = this.parseUnary();

    if (this.match('CARET')) {
      const right = this.parsePower();
      return { kind: 'bin', op: '^', l: expr, r: right };
    }

    return expr;
  }

  // 一元正负号
  private parseUnary(): Expr {
    if (this.match('MINUS')) {
      const right = this.parseUnary();
      return { kind: 'neg', arg: right };
    }
    if (this.match('PLUS')) {
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  // 基础单元 (数字、变量、函数调用、圆括号)
  private parsePrimary(): Expr {
    if (this.match('NUMBER')) {
      const numVal = parseFloat(this.previous().value);
      if (isNaN(numVal)) {
        throw new ParseError(`非法数值: ${this.previous().value}`);
      }
      return { kind: 'num', value: numVal };
    }

    if (this.match('IDENT')) {
      const name = this.previous().value;
      // pi 常量
      if (name.toLowerCase() === 'pi') {
        return { kind: 'num', value: Math.PI };
      }

      // 白名单数学函数: sqrt, sin, cos, tan, abs
      if (WHITELIST_FUNCS.has(name.toLowerCase())) {
        const fn = name.toLowerCase() as 'sqrt' | 'sin' | 'cos' | 'tan' | 'abs';
        if (!this.match('LPAREN')) {
          throw new ParseError(`函数 ${fn} 缺少参数括号`);
        }
        const arg = this.parseExpression();
        this.consume('RPAREN', `函数 ${fn} 括号未闭合`);
        return { kind: 'call', fn, arg };
      }

      // 变量标识符
      return { kind: 'var', name };
    }

    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', '括号未闭合，缺少 ")"');
      return expr;
    }

    const token = this.peek();
    throw new ParseError(`语法错误: 未预期的标记 "${token.value || token.type}" (位置: ${token.pos})`);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParseError(message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return type === 'EOF';
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}

/**
 * 递归下降解析 Token 序列为白名单 AST
 */
export function recursiveDescentParse(tokens: Token[]): Expr {
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * 受控白名单解析器对外主入口 (Property 8 守门员)
 * @throws {ParseError} 若输入包含危险 token 或语法不合法
 */
export function parseControlled(input: string): Expr {
  if (!input || !input.trim()) {
    throw new ParseError('输入为空');
  }

  // 1. 危险 token 硬拦截 (安全不变量，Property 8)
  if (FORBIDDEN.test(input)) {
    throw new ParseError('检测到非法标记，拒绝求值');
  }

  // 2. 词法分析
  const tokens = tokenize(input);

  // 3. 递归下降构建 AST
  return recursiveDescentParse(tokens);
}
