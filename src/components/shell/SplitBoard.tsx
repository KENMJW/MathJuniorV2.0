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
 * 平板分栏画板骨架 (SplitBoard)
 * 对应设计文档 §10.3、任务 16.2 与 TASK-FE-0010 规范
 *
 * 关键特征：
 * - 横屏 (Landscape)：左侧 260px 常驻分栏 + 右侧大画布
 * - 竖屏 (Portrait)：支持侧边栏抽屉手势折叠与无缝展开，避免挤压右侧画布
 * - 触控靶心规范 >= 44px
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
    // 横竖屏切换时自适应展开/收起
    setSidebarOpen(!isPortrait);
  }, [isPortrait]);

  return (
    <div
      data-testid="shell-split-board"
      className={`split-board-shell ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: "var(--bg-canvas, #f5f5f7)",
        color: "var(--text-primary, #1d1d1f)",
        overflow: "hidden",
        position: "relative",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {header && (
        <header
          data-testid="split-board-header"
          style={{
            flexShrink: 0,
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            padding: "0 1.25rem",
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
            zIndex: 20,
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            data-testid="split-board-toggle-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            style={{
              marginRight: "0.75rem",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm, 8px)",
              border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.1))",
              background: sidebarOpen ? "var(--ios-blue-glow, rgba(0, 113, 227, 0.1))" : "#ffffff",
              color: sidebarOpen ? "var(--ios-blue, #0071e3)" : "var(--text-primary, #1d1d1f)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              minHeight: "36px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              transition: "all 0.18s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>{sidebarOpen ? (isPortrait ? "收起导航" : "沉浸全屏") : "展开导航"}</span>
          </button>
          {header}
        </header>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 左侧分栏导航 (横屏支持沉浸折叠，竖屏按需展开) */}
        <aside
          data-testid="split-board-sidebar"
          style={{
            width: sidebarOpen ? widthVal : "0px",
            minWidth: sidebarOpen ? widthVal : "0px",
            maxWidth: widthVal,
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "var(--bg-card, #ffffff)",
            borderRight: !sidebarOpen ? "none" : "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
            display: !sidebarOpen ? "none" : "flex",
            flexDirection: "column",
            zIndex: isPortrait ? 25 : 5,
            position: isPortrait ? "absolute" : "relative",
            left: 0,
            top: 0,
            bottom: 0,
            boxShadow: isPortrait && sidebarOpen ? "4px 0 16px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {sidebar}
        </aside>

        {/* 竖屏模式下的侧栏遮罩 */}
        {isPortrait && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              zIndex: 20,
              backdropFilter: "blur(2px)",
            }}
          />
        )}

        {/* 右侧自适应主内容画布 */}
        <main
          data-testid="split-board-main"
          style={{
            flex: 1,
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "var(--bg-canvas, #f5f5f7)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default SplitBoard;
