import React from 'react';
import { useSessionStore, Locale } from '../../store/sessionStore';

export const APP_VERSION = 'v2.0.3-beta';

interface SystemFooterProps {
  className?: string;
  locale?: Locale;
}

export const SystemFooter: React.FC<SystemFooterProps> = ({ className = '', locale: propLocale }) => {
  const storeLocale = useSessionStore((s) => s.locale);
  const locale = propLocale ?? storeLocale;
  const isEn = locale === 'en';

  return (
    <footer
      data-testid="system-footer"
      className={`w-full mt-10 pt-5 pb-6 border-t border-black/[0.06] dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary select-none ${className}`}
    >
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <span className="font-semibold text-text-secondary">
          {isEn ? 'Core Competency Literacy System' : '全科核心素养提分系统'}
        </span>
        <span className="hidden sm:inline text-text-tertiary">·</span>
        <span>{isEn ? 'Junior Math Workshop' : '初中数学工坊'}</span>
        <span className="hidden sm:inline text-text-tertiary">·</span>
        <span className="text-[11px] text-text-tertiary">
          {isEn ? 'Precision Scoring · Deep Inquiry · Master Thinking' : '精准提分 · 深度探究 · 考霸思维'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-text-tertiary">
          {isEn ? 'Release' : '发布版本'}
        </span>
        <span
          data-testid="app-release-version"
          className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-slate-800 text-text-secondary dark:text-slate-300 border border-black/[0.06] dark:border-slate-700"
        >
          {APP_VERSION}
        </span>
      </div>
    </footer>
  );
};

export default SystemFooter;
