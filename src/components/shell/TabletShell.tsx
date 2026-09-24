import React, { useState, useEffect } from 'react';

export interface TabletShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  sidebarWidth?: number | string;
  header?: React.ReactNode;
  isPortrait?: boolean;
}

/**
 * TabletShell (对标 iPadOS 27)
 * - 通顶边到边结构化侧边栏（左栏 300px~320px），配以 7% 极细发丝分割线 (border-r border-black/[0.07])
 * - 横屏 Master-Detail 双栏常驻，竖屏自适应折叠为侧滑抽屉
 * - 顶栏保留 [ 专注大画布 ] 切换键，一键折叠侧栏铺满大画布
 */
export const TabletShell: React.FC<TabletShellProps> = ({
  sidebar,
  children,
  className = '',
  style = {},
  sidebarWidth = 300,
  header,
  isPortrait = false,
}) => {
  const widthVal = typeof sidebarWidth === 'number' ? `${sidebarWidth}px` : sidebarWidth;
  const [sidebarOpen, setSidebarOpen] = useState(!isPortrait);

  useEffect(() => {
    setSidebarOpen(!isPortrait);
  }, [isPortrait]);

  return (
    <div
      data-testid="shell-split-board"
      className={`tablet-shell split-board-shell flex flex-col h-screen w-full bg-page text-text-primary overflow-hidden relative box-border ${className}`.trim()}
      style={style}
    >
      {header && (
        <header
          data-testid="split-board-header"
          className="shrink-0 min-h-[50px] flex items-center px-4 bg-white/90 backdrop-blur-xl border-b border-border-subtle z-20 box-border"
        >
          <button
            type="button"
            data-testid="split-board-toggle-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="mr-3 px-3 py-1.5 rounded-lg border border-border-subtle bg-white text-text-primary text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:bg-card-subtle transition-all cursor-pointer min-h-[36px]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            <span>{sidebarOpen ? '专注大画布' : '展开侧边栏'}</span>
          </button>
          <div className="flex-1 min-w-0">{header}</div>
        </header>
      )}

      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* 侧边栏 */}
        <aside
          data-testid="split-board-sidebar"
          className={`split-board-sidebar overflow-y-auto bg-card border-r border-black/[0.07] shrink-0 z-30 transition-all duration-300 ${
            isPortrait
              ? 'absolute top-0 bottom-0 left-0 shadow-2xl'
              : 'relative'
          }`}
          style={{
            width: widthVal,
            display: sidebarOpen ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          {sidebar}
        </aside>

        {/* 竖屏遮罩 */}
        {isPortrait && sidebarOpen && (
          <div
            data-testid="split-board-backdrop"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-20"
          />
        )}

        {/* 主内容区 */}
        <main
          data-testid="split-board-main"
          className="split-board-main flex-1 overflow-y-auto min-w-0 relative flex flex-col"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default TabletShell;
