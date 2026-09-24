import React, { useState, useEffect, useCallback } from 'react';

export interface DesktopShellProps {
  sidebar?: React.ReactNode;
  inspector?: React.ReactNode;
  children: React.ReactNode;
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultSidebarCollapsed?: boolean;
  hideSidebarToggle?: boolean;
}

/**
 * DesktopShell (对标 macOS 27 Golden Gate)
 * - 经典三栏黄金生产力驾驶舱（Master 260px - Canvas >= 680px - Inspector 340px）
 * - 1240px Keynote 居中大剧场视窗
 * - 全过程零居中弹窗遮挡，鼠标悬停平滑淡入 Tooltip，纯鼠标原生直觉流
 */
export const DesktopShell: React.FC<DesktopShellProps> = ({
  sidebar,
  inspector,
  children,
  header,
  toolbar,
  className = '',
  style = {},
  defaultSidebarCollapsed = false,
  hideSidebarToggle = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultSidebarCollapsed);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div
      data-testid="shell-cockpit"
      className={`desktop-shell cockpit-shell flex flex-col h-screen w-full bg-page text-text-primary overflow-hidden relative ${className}`.trim()}
      style={style}
    >
      {/* 顶部系统导航栏 */}
      {(header || toolbar) && (
        <header
          data-testid="cockpit-header"
          className="shrink-0 flex flex-col w-full bg-white/85 backdrop-blur-xl border-b border-border-subtle z-50"
        >
          <div className="flex items-center w-full">
            {sidebar && !hideSidebarToggle && (
              <button
                data-testid="cockpit-toggle-sidebar"
                type="button"
                onClick={toggleSidebar}
                title="切换侧栏 (Cmd+B / Ctrl+B)"
                className="min-w-[36px] min-h-[36px] ml-4 flex items-center justify-center rounded-lg border border-border-subtle bg-white/80 hover:bg-white text-text-primary cursor-pointer shadow-sm"
              >
                <span className="text-xs px-2">{collapsed ? "展开" : "折叠"}</span>
              </button>
            )}
            <div className="flex-1 w-full">{header}</div>
          </div>
          {toolbar && <div className="border-t border-border-subtle px-4 py-1.5">{toolbar}</div>}
        </header>
      )}

      {/* 核心三栏或剧场工作区 */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* 左栏 Master 导航树 (260px) */}
        {sidebar && !collapsed && (
          <aside
            data-testid="cockpit-sidebar"
            className="w-[260px] min-w-[260px] overflow-y-auto bg-card border-r border-black/[0.07] shrink-0 z-30"
          >
            {sidebar}
          </aside>
        )}

        {/* 中栏 Canvas / 1240px Keynote 剧场视窗 */}
        <main
          data-testid="cockpit-theater"
          className="flex-1 overflow-y-auto relative flex flex-col items-center"
        >
          <div className="w-full max-w-[1240px] px-6 py-6 box-border">
            {children}
          </div>
        </main>

        {/* 右栏 Inspector 面板 (340px) */}
        {inspector && (
          <aside
            data-testid="cockpit-inspector"
            className="w-[340px] min-w-[340px] overflow-y-auto bg-card border-l border-black/[0.07] shrink-0 z-30"
          >
            {inspector}
          </aside>
        )}
      </div>
    </div>
  );
};

export default DesktopShell;
