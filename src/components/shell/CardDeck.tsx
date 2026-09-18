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
 * 对应设计文档 §10.3、任务 16.2
 *
 * 关键特征：
 * - 100dvh 屏幕锁定，垂直自适应流动
 * - 拇指热区/触控靶心规范 >= 52px
 * - 支持顶部导航条与底部抽屉 (Bottom Sheet)
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
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {header && (
        <header
          data-testid="card-deck-header"
          style={{
            flexShrink: 0,
            minHeight: "52px",
            display: "flex",
            alignItems: "center",
            padding: "0 1rem",
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

      <main
        data-testid="card-deck-body"
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {children}
      </main>

      {bottomSheet && (
        <aside
          data-testid="card-deck-bottom-sheet"
          style={{
            flexShrink: 0,
            minHeight: "52px",
            background: "var(--glass-bg-elevated)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            borderTop: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            boxShadow: "var(--glass-shadow-deep)",
            padding: "1rem",
            zIndex: 20,
          }}
        >
          {bottomSheet}
        </aside>
      )}
    </div>
  );
};

export default CardDeck;
