import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CockpitProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultSidebarCollapsed?: boolean;
  hideSidebarToggle?: boolean;
}

/**
 * 桌面端宽屏大剧场骨架 (Cockpit / DesktopShell)
 * 对应设计文档 §10.3、任务 16.2 与 TASK-FE-0020
 *
 * 关键特征：
 * - 宽屏沉浸视窗，1240px Keynote 居中大剧场体验
 * - 可折叠左侧导航树（支持快捷键 Meta+B / Ctrl+B 展开折叠）
 * - 顶部 54px 统一高透毛玻璃工具条 (Toolbar/Header)
 */
export const Cockpit: React.FC<CockpitProps> = ({
  sidebar,
  children,
  header,
  toolbar,
  className = "",
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div
      data-testid="shell-cockpit"
      className={`cockpit-shell flex flex-col h-screen w-full bg-page text-text-primary overflow-hidden relative ${className}`.trim()}
      style={style}
    >
      {/* 顶部指挥舱条 */}
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
                title="切换导航树 (Cmd+B / Ctrl+B)"
                className="min-w-[36px] min-h-[36px] ml-6 flex items-center justify-center rounded-lg border border-border-subtle bg-white/80 hover:bg-white text-text-primary cursor-pointer shadow-sm"
              >
                {collapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <div className="flex-1 w-full">{header}</div>
          </div>
          {toolbar && <div data-testid="cockpit-toolbar" className="border-t border-border-subtle px-4 py-1">{toolbar}</div>}
        </header>
      )}

      {/* 主体大剧场 */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        {sidebar && (
          <aside
            data-testid="cockpit-sidebar"
            className="w-[260px] min-w-[260px] overflow-y-auto bg-card border-r border-black/[0.07] shrink-0 z-30 flex flex-col"
            style={{ display: collapsed ? "none" : "flex" }}
          >
            {sidebar}
          </aside>
        )}

        <main
          data-testid="cockpit-theater"
          className="cockpit-theater flex-1 h-full overflow-y-auto overflow-x-hidden bg-page relative flex flex-col"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Cockpit;
