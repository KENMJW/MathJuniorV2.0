import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        card: {
          DEFAULT: 'var(--bg-card)',
          subtle: 'var(--bg-card-subtle)',
        },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-quaternary': 'var(--text-quaternary)',
        'border-subtle': 'var(--border-subtle)',
        'border-focus': 'var(--border-focus)',
        'ios-blue': {
          DEFAULT: 'var(--ios-blue)',
          tint: 'var(--ios-blue-tint)',
          glow: 'var(--ios-blue-glow)',
        },
        sandbox: {
          canvas: 'var(--sandbox-canvas)',
          telemetry: 'var(--sandbox-telemetry)',
        },
      },
      fontSize: {
        'ios-title-lg': ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'ios-title-1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'ios-title-2': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'ios-headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'ios-body': ['15px', { lineHeight: '1.47', fontWeight: '400' }],
        'ios-callout': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'ios-caption': ['11px', { lineHeight: '14px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      transitionTimingFunction: {
        'spring-smooth': 'var(--spring-smooth)',
      },
    },
  },
  plugins: [],
} satisfies Config;
