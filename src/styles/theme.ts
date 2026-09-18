/**
 * iOS 27 液态玻璃设计系统主题契约与常量导出 (任务 16.1, 设计文档 §10.2)
 *
 * 核心规范：
 * 1. 一套且仅一套 iOS 27 token，全系统统一引用 CSS 变量；
 * 2. 明暗模式走同一套语义变量，禁止硬编码黑白色值；
 * 3. 彻底清除历史废弃的学情状态 token (--status-* / --pulse-track)。
 */

export const themeTokens = {
  colors: {
    iosBlue: 'var(--ios-blue)',
    iosBlueGlow: 'var(--ios-blue-glow)',
    iosIndigo: 'var(--ios-indigo)',
    iosPurple: 'var(--ios-purple)',
    iosTeal: 'var(--ios-teal)',
    iosGreen: 'var(--ios-green)',
    iosOrange: 'var(--ios-orange)',
    iosRed: 'var(--ios-red)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-tertiary)',
  },
  surfaces: {
    glassBg: 'var(--glass-bg)',
    glassBgElevated: 'var(--glass-bg-elevated)',
    glassBorder: 'var(--glass-border)',
    glassShadow: 'var(--glass-shadow)',
    glassShadowDeep: 'var(--glass-shadow-deep)',
    bgCanvas: 'var(--bg-canvas)',
    bgCard: 'var(--bg-card)',
    bgCardHover: 'var(--bg-card-hover)',
    bgInput: 'var(--bg-input)',
    borderSubtle: 'var(--border-subtle)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    pill: 'var(--radius-pill)',
  },
  spring: {
    smooth: 'var(--spring-smooth)',
    bouncy: 'var(--spring-bouncy)',
  },
} as const;

export type ThemeTokens = typeof themeTokens;
