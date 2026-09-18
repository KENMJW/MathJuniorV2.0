import { describe, it, expect } from 'vitest';
import { normalizeOptionAnswer } from '../normalizeOptionAnswer';

describe('normalizeOptionAnswer (TASK-FE-0004 §4.7 / §6)', () => {
  it('1. 正常单字母大写与小写', () => {
    expect(normalizeOptionAnswer('A')).toBe('A');
    expect(normalizeOptionAnswer('a')).toBe('A');
    expect(normalizeOptionAnswer('B')).toBe('B');
    expect(normalizeOptionAnswer('c')).toBe('C');
    expect(normalizeOptionAnswer('D')).toBe('D');
  });

  it('2. 星号剥离与 markdown 强调字符 (*A*, **B**, _C_)', () => {
    expect(normalizeOptionAnswer('*A*')).toBe('A');
    expect(normalizeOptionAnswer('**B**')).toBe('B');
    expect(normalizeOptionAnswer('_C_')).toBe('C');
    expect(normalizeOptionAnswer('#D#')).toBe('D');
  });

  it('3. 中英文句号与点符号 (A., A．, A。)', () => {
    expect(normalizeOptionAnswer('A.')).toBe('A');
    expect(normalizeOptionAnswer('A．')).toBe('A');
    expect(normalizeOptionAnswer('B。')).toBe('B');
    expect(normalizeOptionAnswer('C、')).toBe('C');
  });

  it('4. 空格与空白字符前后夹杂', () => {
    expect(normalizeOptionAnswer('  A  ')).toBe('A');
    expect(normalizeOptionAnswer('\tB\n')).toBe('B');
    expect(normalizeOptionAnswer(' * A * ')).toBe('A');
  });

  it('5. 答案前缀与括号包围 ((A), [B], 【C】, 答案: D)', () => {
    expect(normalizeOptionAnswer('(A)')).toBe('A');
    expect(normalizeOptionAnswer('（A）')).toBe('A');
    expect(normalizeOptionAnswer('[B]')).toBe('B');
    expect(normalizeOptionAnswer('【C】')).toBe('C');
    expect(normalizeOptionAnswer('【答案】A')).toBe('A');
    expect(normalizeOptionAnswer('答案：B')).toBe('B');
    expect(normalizeOptionAnswer('参考答案: C')).toBe('C');
  });

  it('6. 空值与异常容错', () => {
    expect(normalizeOptionAnswer('')).toBe('');
    expect(normalizeOptionAnswer(null)).toBe('');
    expect(normalizeOptionAnswer(undefined)).toBe('');
  });

  it('7. 综合容错交叉判定：不同脏数据形式相互判等', () => {
    const studentAns = 'A';
    const dirtyStandards = ['*A*', 'A.', 'A．', ' A ', '**A**', '【答案】A', '(A)', 'a'];
    dirtyStandards.forEach((dirty) => {
      expect(normalizeOptionAnswer(studentAns)).toBe(normalizeOptionAnswer(dirty));
    });
  });
});
