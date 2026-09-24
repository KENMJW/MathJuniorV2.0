import React, { useState, useEffect } from "react";

export interface SplitBoardProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  sidebarWidth?: number | string;
  header?: React.ReactNode;
  isPortrait?: boolean;
}

/**
 * 平板分栏画板骨架 (SplitBoard / TabletShell)
 * 对应设计文档 §10.3、任务 16.2 与 TASK-FE-0020 规范
 *
 * 关键特征：
 * - 横屏 (Landscape)：左侧 280px~320px 结构化侧边栏 (border-r border-black/[0.07])
 * - 竖屏 (Portrait)：支持侧边栏抽屉折叠与一键展开
 * - 触控靶心规范 >= 44px
 * - 顶栏保留 [ 专注大画布 / 沉浸全屏 ] 切换键
 */
export const SplitBoard: React.FC<SplitBoardProps> = ({
  sidebar,
  children,
  className = "",
  style = {},
  sidebarWidth = 280,
  header,
  isPortrait = false,
}) => {
  const widthVal = typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth;
  const [sidebarOpen, setSidebarOpen] = useState(!isPortrait);

  useEffect(() => {
    setSidebarOpen(!isPortrait);
  }, [isPortrait]);

  return (
    <div
      data-testid="shell-split-board"
      className={`split-board-shell flex flex-col h-screen w-full bg-page text-text-primary overflow-hidden relative box-border ${className}`.trim()}
      style={style}
    >
      {header && (
        <header
          data-testid="split-board-header"
          className="shrink-0 min-h-[48px] flex items-center px-4 bg-white/90 backdrop-blur-xl border-b border-border-subtle z-20 box-border"
        >
          <button
            type="button"
            data-testid="split-board-toggle-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="mr-3 px-3 py-1.5 rounded-lg border border-border-subtle bg-white text-text-primary text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:bg-card-subtle transition-all cursor-pointer min-h-[44px]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            <span>{sidebarOpen ? (isPortrait ? "收起导航" : "专注大画布") : "展开导航"}</span>
          </button>
          <div className="flex-1 min-w-0">{header}</div>
        </header>
      )}

      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        {/* 左侧分栏导航 */}
        <aside
          data-testid="split-board-sidebar"
          className={`split-board-sidebar overflow-y-auto bg-card border-r border-black/[0.07] shrink-0 z-30 transition-all duration-300 ${
            isPortrait
              ? "absolute top-0 bottom-0 left-0 shadow-2xl"
              : "relative"
          }`}
          style={{
            width: widthVal,
            display: sidebarOpen ? "flex" : "none",
            flexDirection: "column",
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

        {/* 主内容画板 */}
        <main
          data-testid="split-board-main"
          className="split-board-main flex-1 overflow-y-auto min-w-0 relative flex flex-col"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default SplitBoard;
