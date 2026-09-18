/**
 * 纯数值求值器 (任务 7.3, 设计文档 §8.1)
 *
 * 核心设计原则：
 * 1. 仅遍历白名单 AST 进行递归数值计算
 * 2. 绝对不引入 eval()、Function() 或动态代码生成
 * 3. 包含分母为零保护与负数开方保护 (返回 NaN)
 */

import { Expr } from './parser';

/**
 * 递归纯数值计算 AST 表达式在给定代入环境 env 下的值
 * @param ast 经过受控白名单解析器产出的 AST
 * @param env 自由变量赋值环境 (如 { x: 3, y: 4 })
 * @returns 计算结果数值，若发生除以零、负数开方或未定义变量则返回 NaN
 */
export function evalExpr(ast: Expr, env: Record<string, number> = {}): number {
  switch (ast.kind) {
    case 'num':
      return ast.value;

    case 'var': {
      if (ast.name in env && typeof env[ast.name] === 'number') {
        return env[ast.name];
      }
      return NaN;
    }

    case 'neg':
      return -evalExpr(ast.arg, env);

    case 'call': {
      const argVal = evalExpr(ast.arg, env);
      if (isNaN(argVal) || !isFinite(argVal)) return NaN;

      switch (ast.fn) {
        case 'sqrt':
          if (argVal < 0) return NaN;
          return Math.sqrt(argVal);
        case 'sin':
          return Math.sin(argVal);
        case 'cos':
          return Math.cos(argVal);
        case 'tan': {
          // tan(π/2 + kπ) 奇点保护
          const cosVal = Math.cos(argVal);
          if (Math.abs(cosVal) < 1e-12) return NaN;
          return Math.tan(argVal);
        }
        case 'abs':
          return Math.abs(argVal);
        default:
          return NaN;
      }
    }

    case 'bin': {
      const left = evalExpr(ast.l, env);
      const right = evalExpr(ast.r, env);
      if (isNaN(left) || isNaN(right)) return NaN;

      switch (ast.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          // 除以零奇点保护
          if (Math.abs(right) < 1e-12) return NaN;
          return left / right;
        case '^': {
          // 幂运算
          if (left === 0 && right < 0) return NaN;
          const res = Math.pow(left, right);
          return isFinite(res) ? res : NaN;
        }
        default:
          return NaN;
      }
    }
  }
}

/**
 * 遍历 AST 收集所有出现的自由变量名
 */
export function collectVars(...roots: Expr[]): string[] {
  const vars = new Set<string>();

  function traverse(node: Expr) {
    if (node.kind === 'var') {
      vars.add(node.name);
    } else if (node.kind === 'neg' || node.kind === 'call') {
      traverse(node.arg);
    } else if (node.kind === 'bin') {
      traverse(node.l);
      traverse(node.r);
    }
  }

  for (const root of roots) {
    if (root) traverse(root);
  }

  return Array.from(vars).sort();
}
