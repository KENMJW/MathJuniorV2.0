import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "../common/Icon";

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
 * 桌面端宽屏大剧场骨架 (Cockpit)
 * 对应设计文档 §10.3、任务 16.2
 *
 * 关键特征：
 * - 宽屏沉浸视窗，沉浸剧场体验
 * - 可折叠左侧树形导航（支持快捷键 Meta+B / Ctrl+B 展开折叠）
 * - 顶部指挥舱工具条 (Toolbar/Header)
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
      className={`cockpit-shell ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {/* 顶部指挥舱条 */}
      {(header || toolbar) && (
        <header
          data-testid="cockpit-header"
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
            zIndex: 120,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {sidebar && !hideSidebarToggle && (
              <button
                data-testid="cockpit-toggle-sidebar"
                type="button"
                onClick={toggleSidebar}
                title="切换导航树 (Cmd+B / Ctrl+B)"
                style={{
                  minWidth: "36px",
                  minHeight: "36px",
                  marginLeft: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--glass-bg-elevated)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                {collapsed ? (
                  <Icon name="chevron-right" size={14} />
                ) : (
                  <Icon name="chevron-left" size={14} />
                )}
              </button>
            )}
            <div style={{ flex: 1, width: "100%" }}>{header}</div>
          </div>
          {toolbar && <div data-testid="cockpit-toolbar">{toolbar}</div>}
        </header>
      )}

      {/* 主体大剧场 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {sidebar && (
          <aside
            data-testid="cockpit-sidebar"
            style={{
              width: collapsed ? "0px" : "300px",
              minWidth: collapsed ? "0px" : "300px",
              maxWidth: collapsed ? "0px" : "300px",
              height: "100%",
              overflowY: "auto",
              backgroundColor: "var(--bg-card)",
              borderRight: collapsed ? "none" : "1px solid var(--border-subtle)",
              transition: "width 0.25s var(--spring-smooth), min-width 0.25s var(--spring-smooth)",
              display: collapsed ? "none" : "flex",
              flexDirection: "column",
              zIndex: 10,
            }}
          >
            {sidebar}
          </aside>
        )}

        <main
          data-testid="cockpit-theater"
          style={{
            flex: 1,
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
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

export default Cockpit;
