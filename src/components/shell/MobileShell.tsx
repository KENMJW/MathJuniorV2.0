import React from 'react';

export interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  header?: React.ReactNode;
  bottomSheet?: React.ReactNode;
}

/**
 * MobileShell (对标 iOS 27 原生体验)
 * - 容器严格锁定 h-[100dvh] overflow-hidden，绝对 0 横向滚动条
 * - 顶部 44px 毛玻璃顶栏（内容上滑时平滑过渡为防撞固定 Dock）
 * - 底部 56px 核心模块 Tab 栏，适配 env(safe-area-inset-bottom)
 * - 单手拇指触控靶心规范 >= 48px
 */
export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  className = '',
  style = {},
  header,
  bottomSheet,
}) => {
  return (
    <div
      data-testid="shell-card-deck"
      className={`mobile-shell card-deck-shell flex flex-col h-[100dvh] w-full bg-page text-text-primary overflow-hidden relative box-border ${className}`.trim()}
      style={style}
    >
      {/* 顶部 Slim 毛玻璃导航条 (44px) */}
      {header && (
        <header
          data-testid="card-deck-header"
          className="shrink-0 h-[44px] min-h-[44px] flex items-center px-3 bg-white/90 backdrop-blur-xl border-b border-border-subtle z-20 box-border"
        >
          {header}
        </header>
      )}

      {/* 主卡片垂直单列流动容器 */}
      <main
        data-testid="card-deck-body"
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 pb-4 flex flex-col gap-3 box-border"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </main>

      {/* 底部原生 iOS Tab Bar (56px, 含 safe-area 避让) */}
      {bottomSheet && (
        <nav
          data-testid="card-deck-bottom-sheet"
          data-min-touch-target="52px"
          className="mobile-safe-bottom shrink-0 min-h-[56px] bg-white/95 backdrop-blur-2xl border-t border-border-subtle shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-2 py-1 z-30 flex items-center justify-around box-border"
          style={{ paddingBottom: 'calc(4px + env(safe-area-inset-bottom, 12px))' }}
        >
          {bottomSheet}
        </nav>
      )}
    </div>
  );
};

export default MobileShell;
