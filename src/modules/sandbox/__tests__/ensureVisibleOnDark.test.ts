import { describe, it, expect } from 'vitest';
import { ensureVisibleOnDark } from '../SandboxRenderer';

describe('TASK-FE-0016 块 C: ensureVisibleOnDark 颜色安全兜底', () => {
  describe('1. 空值、未定义与空白字符测试', () => {
    it('当输入为 undefined 时，返回默认高对比度天蓝 #38bdf8', () => {
      expect(ensureVisibleOnDark(undefined)).toBe('#38bdf8');
    });

    it('当输入为 null 时，返回默认高对比度天蓝 #38bdf8', () => {
      expect(ensureVisibleOnDark(null as any)).toBe('#38bdf8');
    });

    it('当输入为空字符串或空白字符时，返回默认高对比度天蓝 #38bdf8', () => {
      expect(ensureVisibleOnDark('')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('   ')).toBe('#38bdf8');
    });

    it('支持自定义 defaultColor (如圆心指定 #34c759)', () => {
      expect(ensureVisibleOnDark(undefined, '#34c759')).toBe('#34c759');
      expect(ensureVisibleOnDark('', '#34c759')).toBe('#34c759');
    });
  });

  describe('2. 显式暗色与深色视口/变量测试', () => {
    it('将 black 防御性替换为亮天蓝 #38bdf8', () => {
      expect(ensureVisibleOnDark('black')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('BLACK')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('  black  ')).toBe('#38bdf8');
    });

    it('圆心点遇到 black 替换为翠绿色 #34c759', () => {
      expect(ensureVisibleOnDark('black', '#34c759')).toBe('#34c759');
      expect(ensureVisibleOnDark('#000000', '#34c759')).toBe('#34c759');
    });

    it('将纯黑十六进制 #000, #000000 替换为亮色', () => {
      expect(ensureVisibleOnDark('#000')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('#000000')).toBe('#38bdf8');
    });

    it('将极深灰 #111, #111111 替换为亮色', () => {
      expect(ensureVisibleOnDark('#111')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('#111111')).toBe('#38bdf8');
    });

    it('将暗色视口背景色 #0f172a 与暗底色 #1e293b 替换为亮色', () => {
      expect(ensureVisibleOnDark('#0f172a')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('#1e293b')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('#020617')).toBe('#38bdf8');
    });

    it('将纯黑 rgb(0,0,0) 与深色 rgba 替换为亮色', () => {
      expect(ensureVisibleOnDark('rgb(0,0,0)')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('rgb(0, 0, 0)')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('rgba(0, 0, 0, 0.8)')).toBe('#38bdf8');
    });

    it('将深色黑曜石文本变量 var(--text-primary) 替换为亮色', () => {
      expect(ensureVisibleOnDark('var(--text-primary)')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('var(--text-primary, #1d1d1f)')).toBe('#38bdf8');
    });
  });

  describe('3. 感知亮度阈值 (< 60) 解析测试', () => {
    it('亮度低于 60 的深色十六进制被替换', () => {
      // #222222: Y = 34 < 60
      expect(ensureVisibleOnDark('#222')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('#222222')).toBe('#38bdf8');
      // #333333: Y = 51 < 60
      expect(ensureVisibleOnDark('#333')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('#333333')).toBe('#38bdf8');
      // #2a2a2a: Y = 42 < 60
      expect(ensureVisibleOnDark('#2a2a2a')).toBe('#38bdf8');
      // #3b3b3b: Y = 59 < 60
      expect(ensureVisibleOnDark('#3b3b3b')).toBe('#38bdf8');
    });

    it('亮度高于或等于 60 的灰度保持原样', () => {
      // #3c3c3c: Y = 60 >= 60
      expect(ensureVisibleOnDark('#3c3c3c')).toBe('#3c3c3c');
      // #4a4a4a: Y = 74 >= 60
      expect(ensureVisibleOnDark('#4a4a4a')).toBe('#4a4a4a');
      // #64748b (Slate-500): Y = 111 >= 60
      expect(ensureVisibleOnDark('#64748b')).toBe('#64748b');
      // #94a3b8 (Slate-400): Y = 160 >= 60
      expect(ensureVisibleOnDark('#94a3b8')).toBe('#94a3b8');
    });
  });

  describe('4. 高对比度亮色保持原样测试', () => {
    it('纯白色 #ffffff 保持原样', () => {
      expect(ensureVisibleOnDark('#ffffff')).toBe('#ffffff');
    });

    it('琥珀色系 #fbbf24, #f59e0b 保持原样', () => {
      expect(ensureVisibleOnDark('#fbbf24')).toBe('#fbbf24');
      expect(ensureVisibleOnDark('#f59e0b')).toBe('#f59e0b');
    });

    it('翠绿色系 #34c759 保持原样', () => {
      expect(ensureVisibleOnDark('#34c759')).toBe('#34c759');
    });

    it('亮天蓝 #38bdf8 与品牌蓝 #0071e3 保持原样', () => {
      expect(ensureVisibleOnDark('#38bdf8')).toBe('#38bdf8');
      expect(ensureVisibleOnDark('#0071e3')).toBe('#0071e3');
    });

    it('常规亮色命名色彩 (red, blue) 保持原样', () => {
      expect(ensureVisibleOnDark('red')).toBe('red');
      expect(ensureVisibleOnDark('blue')).toBe('blue');
    });
  });
});
