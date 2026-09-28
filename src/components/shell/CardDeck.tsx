import React from "react";

export interface CardDeckProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  header?: React.ReactNode;
  subnav?: React.ReactNode;
  bottomSheet?: React.ReactNode;
}

/**
 * 手机端横向/纵向卡片穿透流骨架 (CardDeck / MobileShell)
 * 对应设计文档 §10.3、任务 16.2 与 TASK-FE-0020
 *
 * 关键特征：
 * - 100dvh 屏幕锁定，垂直单列自适应流动，绝对 0 水平滚动条
 * - 单手拇指触控靶心规范 >= 48px
 * - 顶部 Slim 导航条与底部原生 iOS Tab Bar (带 safe-area 避让)
 */
export const CardDeck: React.FC<CardDeckProps> = ({
  children,
  className = "",
  style = {},
  header,
  subnav,
  bottomSheet,
}) => {
  return (
    <div
      data-testid="shell-card-deck"
      className={`card-deck-shell flex flex-col h-[100dvh] w-full bg-page text-text-primary overflow-hidden relative box-border ${className}`.trim()}
      style={style}
    >
      {/* 顶部 Slim 导航条 (44px) */}
      {header && (
        <header
          data-testid="card-deck-header"
          className="card-deck-header shrink-0 h-[44px] min-h-[44px] flex items-center px-3 bg-white/90 backdrop-blur-xl border-b border-border-subtle z-20 box-border"
        >
          {header}
        </header>
      )}

      {/* 36px 固化吸顶二级书签轨 (y = 44px ~ 80px) */}
      {subnav && (
        <div
          data-testid="card-deck-subnav"
          className="card-deck-subnav shrink-0 h-[36px] min-h-[36px] flex items-center justify-center px-2 bg-white/95 backdrop-blur-md border-b border-border-subtle z-10 box-border"
        >
          {subnav}
        </div>
      )}

      {/* 主卡片垂直单列流动容器 */}
      <main
        data-testid="card-deck-body"
        className="flex-1 overflow-y-auto overflow-x-hidden p-0 flex flex-col box-border"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </main>

      {/* 底部原生 iOS Tab Bar (56px, 含 safe-area 避让) */}
      {bottomSheet && (
        <nav
          data-testid="card-deck-bottom-sheet"
          data-min-touch-target="52px"
          className="mobile-safe-bottom shrink-0 min-h-[56px] bg-white/95 backdrop-blur-2xl border-t border-border-subtle shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-2 py-1 z-30 flex items-center justify-around box-border"
          style={{ paddingBottom: "calc(4px + env(safe-area-inset-bottom, 12px))" }}
        >
          {bottomSheet}
        </nav>
      )}
    </div>
  );
};

export default CardDeck;
