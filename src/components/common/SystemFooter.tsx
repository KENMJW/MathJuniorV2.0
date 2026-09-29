import React, { useState } from 'react';
import { RotateCcw, BookOpen, ExternalLink, Download } from 'lucide-react';
import { useSessionStore, Locale } from '../../store/sessionStore';
import { APP_VERSION } from '../../config/version';

export { APP_VERSION };

interface SystemFooterProps {
  className?: string;
  locale?: Locale;
}

export const SystemFooter: React.FC<SystemFooterProps> = ({ className = '', locale: propLocale }) => {
  const storeLocale = useSessionStore((s) => s.locale);
  const locale = propLocale ?? storeLocale;
  const isEn = locale === 'en';
  const [isPurging, setIsPurging] = useState(false);

  const handleForcePurgeCache = async () => {
    try {
      setIsPurging(true);
      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
        }
        localStorage.setItem('app_version', APP_VERSION);
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <footer
      data-testid="system-footer"
      className={`w-full mt-10 pt-5 pb-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary select-none ${className}`}
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

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center">
        <span className="text-[11px] text-text-tertiary">
          {isEn ? 'Release' : '发布版本'}
        </span>
        <span
          data-testid="app-release-version"
          className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.04] text-text-secondary border border-black/[0.06]"
        >
          {APP_VERSION}
        </span>
        <a
          href="/manual.html"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="footer-manual-link"
          title={isEn ? 'Open user operation manual in new tab' : '在新标签页打开操作使用说明书'}
          className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-ios-blue px-2.5 py-0.5 rounded-full bg-black/[0.04] hover:bg-blue-50 transition-colors cursor-pointer border border-black/[0.06] hover:border-blue-200 active:scale-95 font-medium"
        >
          <BookOpen className="w-3 h-3 text-ios-blue" />
          <span>{isEn ? 'User Manual' : '使用说明书'}</span>
          <ExternalLink className="w-2.5 h-2.5 text-text-tertiary" />
        </a>
        <a
          href="/manual.pdf"
          download="全科核心素养提分系统V2.0_操作使用说明书.pdf"
          data-testid="footer-pdf-link"
          title={isEn ? 'Download 16-page printable PDF manual' : '下载 16 页高清双面排版说明书 PDF'}
          className="inline-flex items-center gap-1 text-[11px] text-text-tertiary hover:text-ios-blue px-2 py-0.5 rounded-full hover:bg-black/[0.04] transition-colors cursor-pointer border border-transparent hover:border-black/[0.06] active:scale-95"
        >
          <Download className="w-3 h-3" />
          <span>{isEn ? 'PDF' : '下载 PDF'}</span>
        </a>
        <button
          type="button"
          data-testid="force-purge-cache-btn"
          onClick={handleForcePurgeCache}
          title={isEn ? 'Purge local cache and reload latest assets' : '强制清除本地缓存并重载最新资产'}
          className="inline-flex items-center gap-1 text-[11px] text-text-tertiary hover:text-ios-blue px-2 py-0.5 rounded-full hover:bg-black/[0.04] transition-colors cursor-pointer border border-transparent hover:border-black/[0.06] active:scale-95"
        >
          <RotateCcw className={`w-3 h-3 ${isPurging ? 'animate-spin text-ios-blue' : ''}`} />
          <span>{isEn ? 'Clear Cache' : '刷新缓存'}</span>
        </button>
      </div>
    </footer>
  );
};

export default SystemFooter;
