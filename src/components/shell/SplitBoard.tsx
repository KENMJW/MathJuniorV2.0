import React from "react";

export interface SplitBoardProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  sidebarWidth?: number | string;
  header?: React.ReactNode;
}

/**
 * 平板分栏画板骨架 (SplitBoard)
 * 对应设计文档 §10.3、任务 16.2
 *
 * 关键特征：
 * - 左侧导航固定 280px 常驻（支持参数自定义）
 * - 右侧内容区自适应伸缩画布
 * - 触控靶心规范 >= 44px
 */
export const SplitBoard: React.FC<SplitBoardProps> = ({
  sidebar,
  children,
  className = "",
  style = {},
  sidebarWidth = 280,
  header,
}) => {
  const widthVal = typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth;

  return (
    <div
      data-testid="shell-split-board"
      className={`split-board-shell ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        overflow: "hidden",
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
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border-subtle)",
            zIndex: 10,
          }}
        >
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
        {/* 左侧 280px 常驻导航 */}
        <aside
          data-testid="split-board-sidebar"
          style={{
            width: widthVal,
            minWidth: widthVal,
            maxWidth: widthVal,
            height: "100%",
            overflowY: "auto",
            backgroundColor: "var(--bg-card)",
            borderRight: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            zIndex: 5,
          }}
        >
          {sidebar}
        </aside>

        {/* 右侧自适应画板 */}
        <main
          data-testid="split-board-main"
          style={{
            flex: 1,
            height: "100%",
            overflowY: "auto",
            backgroundColor: "var(--bg-canvas)",
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
