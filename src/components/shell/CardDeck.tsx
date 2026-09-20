import React from "react";

export interface CardDeckProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  header?: React.ReactNode;
  bottomSheet?: React.ReactNode;
}

/**
 * 手机端横向/纵向卡片穿透流骨架 (CardDeck)
 * 对应设计文档 §10.3、任务 16.2 与 TASK-FE-0010 规范
 *
 * 关键特征：
 * - 100dvh 屏幕锁定，垂直单列自适应流动
 * - 单手拇指触控靶心规范 >= 48px
 * - 支持顶部 Slim 导航条与底部原生 iOS Tab Bar (带 safe-area 避让)
 */
export const CardDeck: React.FC<CardDeckProps> = ({
  children,
  className = "",
  style = {},
  header,
  bottomSheet,
}) => {
  return (
    <div
      data-testid="shell-card-deck"
      className={`card-deck-shell ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100%",
        backgroundColor: "var(--bg-canvas, #f5f5f7)",
        color: "var(--text-primary, #1d1d1f)",
        overflow: "hidden",
        position: "relative",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* 顶部 Slim 导航条 */}
      {header && (
        <header
          data-testid="card-deck-header"
          style={{
            flexShrink: 0,
            minHeight: "52px",
            display: "flex",
            alignItems: "center",
            padding: "0 0.75rem",
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
            zIndex: 20,
            boxSizing: "border-box",
          }}
        >
          {header}
        </header>
      )}

      {/* 主卡片垂直单列流动容器 */}
      <main
        data-testid="card-deck-body"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: "0.5rem 0.5rem 1rem 0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>

      {/* 底部原生 iOS Tab Bar (含 safe-area 避让) */}
      {bottomSheet && (
        <nav
          data-testid="card-deck-bottom-sheet"
          className="mobile-safe-bottom"
          style={{
            flexShrink: 0,
            minHeight: "52px",
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            borderTop: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))",
            boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.04)",
            padding: "4px 8px calc(4px + env(safe-area-inset-bottom, 0px)) 8px",
            zIndex: 30,
            boxSizing: "border-box",
          }}
        >
          {bottomSheet}
        </nav>
      )}
    </div>
  );
};

export default CardDeck;
