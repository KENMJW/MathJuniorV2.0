import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ConceptNav } from "./ConceptNav";
import { SubwayMap, LineClosedLoop, mockLogicLines } from "./modules/graph";
import { LeapLab, mockLeapSandboxModels } from "./modules/sandbox";
import { SandboxRenderer } from "./modules/sandbox/SandboxRenderer";
import {
  handInHandConfig,
  quadraticVerticalHeightConfig,
  apolloniusConfig,
  pythagoreanConfig,
} from "./modules/sandbox/configs";
import { PaperWorkbench } from "./modules/exam";
import { CardDeck, SplitBoard, Cockpit } from "./components/shell";
import { detectDeviceProfile, DeviceProfile } from "./engine/device/detectDeviceProfile";
import { setDeviceOverride, getDeviceOverride } from "./engine/device/deviceOverride";
import { t } from "./engine/i18n/i18n";
import { useSessionStore } from "./store/sessionStore";
import { Icon } from "./components/common/Icon";

const ALL_SANDBOXES = [
  {
    id: "SB-HAND-IN-HAND",
    nameZh: "手拉手模型 (旋转全等与角度不变量)",
    nameEn: "Hand-in-Hand (Angle)",
    config: handInHandConfig,
    desc: "拖动动点 B 或 C，观察旋转中心角 ∠AOB 与 ∠AOC 的角度不变量计算。",
  },
  {
    id: "SB-QUADRATIC-VERTICAL-HEIGHT",
    nameZh: "二次函数铅垂高 (割线三角形与面积守恒)",
    nameEn: "Quadratic Plumb Height",
    config: quadraticVerticalHeightConfig,
    desc: "拖动抛物线上的动点 P，实时查看铅垂高 h 与割线三角形面积的动态守恒。",
  },
  {
    id: "SB-APOLLONIUS-CIRCLE",
    nameZh: "阿氏圆模型 (动点轨迹与距离比值不变量)",
    nameEn: "Apollonius Circle (Ratio)",
    config: apolloniusConfig,
    desc: "拖动动点 P，观察 PA/PB 距离比值不变量，包含 d2=0 零除防呆保护。",
  },
  {
    id: "SB-KP023",
    nameZh: "勾股面积守恒 (正方形割补与本真证明)",
    nameEn: "Pythagorean Theorem",
    config: pythagoreanConfig,
    desc: "拖动顶点 C 观察直角三角形边长平方与面积守恒。",
  },
];

export const MathJuniorHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locale = useSessionStore((state) => state.locale);
  const setLocale = useSessionStore((state) => state.setLocale);

  // 解析当前子模块 (concept / graph / lab / exam)
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentSubModule = pathParts[1] || "concept";

  // 设备检测与手动 override 状态管理 (任务 20.4)
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>(detectDeviceProfile());
  const [currentOverride, setCurrentOverride] = useState<DeviceProfile | null>(getDeviceOverride());

  // 模块内部状态
  const [graphSubView, setGraphSubView] = useState<"map" | "line_loop">("map");
  const [selectedLineId, setSelectedLineId] = useState<string>("G4");
  const [labSubView, setLabSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");
  const [selectedSandboxId, setSelectedSandboxId] = useState<string>("SB-HAND-IN-HAND");
  const [selectedLeapModelId, setSelectedLeapModelId] = useState<string>("LM-8A-01");

  // 监听窗口尺寸变化自动更新设备 profile
  useEffect(() => {
    const handleResize = () => {
      setDeviceProfile(detectDeviceProfile());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSetOverride = (override: DeviceProfile | null) => {
    setDeviceOverride(override);
    setCurrentOverride(override);
    setDeviceProfile(detectDeviceProfile());
  };

  const handleSelectSubModule = (moduleKey: string) => {
    navigate(`/math-junior/${moduleKey}`);
  };

  // 顶栏品牌与返回按钮
  const renderHeaderLeft = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <button
        type="button"
        data-testid="back-to-portal-btn"
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.4rem 0.8rem",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <span>←</span>
        <span>{t("nav.backToPortal", locale, "全科门户")}</span>
      </button>

      <div>
        <h1 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
          初中数学核心素养工坊
        </h1>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          初中学段 · 数学学科 V2.0
        </span>
      </div>
    </div>
  );

  // 顶栏右侧工具操作区
  const renderHeaderRight = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      {/* 设备 Profile 切换选择器 (任务 20.4) */}
      <div
        data-testid="device-profile-selector"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.2rem",
          padding: "0.2rem",
          borderRadius: "var(--radius-pill)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {[
          { key: null, label: "自动" },
          { key: "MOBILE", label: "手机" },
          { key: "TABLET", label: "平板" },
          { key: "DESKTOP", label: "电脑" },
        ].map((item) => {
          const active = currentOverride === item.key;
          return (
            <button
              key={item.label}
              type="button"
              data-testid={`device-override-${item.key || "auto"}`}
              onClick={() => handleSetOverride(item.key as any)}
              style={{
                border: "none",
                padding: "0.3rem 0.6rem",
                borderRadius: "var(--radius-pill)",
                background: active ? "var(--ios-blue)" : "transparent",
                color: active ? "white" : "var(--text-secondary)",
                fontWeight: active ? 700 : 500,
                fontSize: "0.76rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 语言切换器 */}
      <button
        type="button"
        data-testid="math-lang-toggle"
        onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
        style={{
          padding: "0.35rem 0.75rem",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.8rem",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        <Icon name="globe" size={14} />
        <span>{locale === "zh-CN" ? "English" : "中文"}</span>
      </button>
    </div>
  );

  // 四大模块正式入口导航项
  const MODULE_NAV_ITEMS = [
    { key: "concept", labelZh: "探本溯源·概念精讲", labelEn: "Concept Lecture", icon: "book" },
    { key: "graph", labelZh: "经纬纵横·思维图谱", labelEn: "Knowledge Graph", icon: "graph" },
    { key: "lab", labelZh: "见微知著·实验探究", labelEn: "Lab Exploration", icon: "flask" },
    { key: "exam", labelZh: "百炼成钢·实战测评", labelEn: "Assessment Center", icon: "sword" },
  ];

  // 导航栏 (供 Desktop / Tablet 侧边或顶部展示)
  const renderNavList = () => (
    <nav
      data-testid="math-junior-nav-list"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "1rem",
      }}
    >
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", padding: "0 0.5rem 0.25rem 0.5rem" }}>
        四大核心能力模块
      </div>
      {MODULE_NAV_ITEMS.map((item) => {
        const active = currentSubModule === item.key;
        return (
          <button
            key={item.key}
            type="button"
            data-testid={`module-nav-${item.key}`}
            onClick={() => handleSelectSubModule(item.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              border: active ? "1.5px solid var(--ios-blue)" : "1px solid var(--border-subtle)",
              background: active ? "var(--ios-blue-glow)" : "var(--bg-card)",
              color: active ? "var(--ios-blue)" : "var(--text-primary)",
              fontWeight: active ? 700 : 500,
              fontSize: "0.92rem",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              textAlign: "left",
            }}
          >
            <Icon name={item.icon} size={18} />
            <span>{locale === "en" ? item.labelEn : item.labelZh}</span>
          </button>
        );
      })}
    </nav>
  );

  // 移动端底部卡片导航抽屉
  const renderMobileBottomBar = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        width: "100%",
      }}
    >
      {MODULE_NAV_ITEMS.map((item) => {
        const active = currentSubModule === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleSelectSubModule(item.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.2rem",
              border: "none",
              background: "transparent",
              color: active ? "var(--ios-blue)" : "var(--text-secondary)",
              fontWeight: active ? 700 : 500,
              fontSize: "0.72rem",
              cursor: "pointer",
              minWidth: "52px",
              minHeight: "52px",
              justifyContent: "center",
            }}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.labelZh.split("·")[1] || item.labelZh}</span>
          </button>
        );
      })}
    </div>
  );

  // 各模块主体渲染 (保证各模块组件内部逻辑与 props 零改动)
  const renderModuleContent = () => {
    switch (currentSubModule) {
      case "concept":
        return <ConceptNav />;

      case "graph":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
            {/* 思维图谱子视图切换器 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  background: "var(--bg-canvas)",
                  padding: "0.25rem",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {[
                  { key: "map", label: "6x12 泳道地铁图", icon: "graph" },
                  { key: "line_loop", label: "主线四位一体闭环", icon: "link" },
                ].map((tab) => {
                  const active = graphSubView === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      data-testid={`graph-view-${tab.key}`}
                      onClick={() => setGraphSubView(tab.key as any)}
                      style={{
                        border: "none",
                        padding: "0.45rem 1rem",
                        borderRadius: "var(--radius-pill)",
                        background: active ? "var(--bg-card)" : "transparent",
                        color: active ? "var(--ios-blue)" : "var(--text-secondary)",
                        fontWeight: active ? 700 : 500,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        boxShadow: active ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <Icon name={tab.icon} size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {graphSubView === "line_loop" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {mockLogicLines.map((l) => {
                    const active = l.line_id === selectedLineId;
                    return (
                      <button
                        key={l.line_id}
                        type="button"
                        onClick={() => setSelectedLineId(l.line_id)}
                        style={{
                          border: active ? "1.5px solid var(--ios-blue)" : "1px solid var(--border-subtle)",
                          background: active ? "var(--ios-blue)" : "var(--bg-card)",
                          color: active ? "white" : "var(--text-primary)",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {l.line_id}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {graphSubView === "map" ? (
              <SubwayMap
                onNavigate={(dest) => {
                  if (dest === "concept") handleSelectSubModule("concept");
                  else if (dest === "sandbox") handleSelectSubModule("lab");
                  else if (dest === "exam") handleSelectSubModule("exam");
                }}
              />
            ) : (
              <LineClosedLoop
                line={mockLogicLines.find((l) => l.line_id === selectedLineId) || mockLogicLines[0]}
                onOpenFlagshipModel={(modelId) => {
                  setSelectedLeapModelId(modelId);
                  handleSelectSubModule("lab");
                  setLabSubView("leap_4d");
                }}
                onBackToMap={() => setGraphSubView("map")}
              />
            )}
          </div>
        );

      case "lab":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
            {/* 实验室子视图切换器 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  background: "var(--bg-canvas)",
                  padding: "0.25rem",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {[
                  { key: "concept_sandbox", label: "概念沙盒 (实验室一)", icon: "flask" },
                  { key: "leap_4d", label: "4D 跃迁模型 (实验室二)", icon: "rocket" },
                ].map((tab) => {
                  const active = labSubView === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      data-testid={`lab-view-${tab.key}`}
                      onClick={() => setLabSubView(tab.key as any)}
                      style={{
                        border: "none",
                        padding: "0.45rem 1rem",
                        borderRadius: "var(--radius-pill)",
                        background: active ? "var(--bg-card)" : "transparent",
                        color: active ? "var(--ios-blue)" : "var(--text-secondary)",
                        fontWeight: active ? 700 : 500,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        boxShadow: active ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <Icon name={tab.icon} size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {labSubView === "concept_sandbox" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {ALL_SANDBOXES.map((item) => {
                    const active = item.id === selectedSandboxId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedSandboxId(item.id)}
                        style={{
                          border: active ? "1.5px solid var(--ios-blue)" : "1px solid var(--border-subtle)",
                          background: active ? "var(--ios-blue)" : "var(--bg-card)",
                          color: active ? "white" : "var(--text-primary)",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {item.nameZh.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {labSubView === "concept_sandbox" ? (
              (() => {
                const current = ALL_SANDBOXES.find((s) => s.id === selectedSandboxId) || ALL_SANDBOXES[0];
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div
                      style={{
                        padding: "0.75rem 1.2rem",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--ios-blue-glow)",
                        borderLeft: "4px solid var(--ios-blue)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <Icon name="bulb" size={16} />
                      <strong>探究指南：</strong> {current.desc}
                    </div>
                    <SandboxRenderer
                      key={current.id}
                      config={current.config}
                      style={{ height: "580px", background: "var(--bg-card)" }}
                    />
                  </div>
                );
              })()
            ) : (
              <LeapLab
                modelId={selectedLeapModelId}
                allModels={mockLeapSandboxModels}
                onBack={() => setLabSubView("concept_sandbox")}
              />
            )}
          </div>
        );

      case "exam":
        return <PaperWorkbench />;

      default:
        return <ConceptNav />;
    }
  };

  // 任务 20.4：由 detectDeviceProfile() 动态驱动选择包裹骨架
  if (deviceProfile === "MOBILE") {
    return (
      <CardDeck
        header={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            {renderHeaderLeft()}
            {renderHeaderRight()}
          </div>
        }
        bottomSheet={renderMobileBottomBar()}
      >
        <div style={{ padding: "0.5rem" }}>{renderModuleContent()}</div>
      </CardDeck>
    );
  }

  if (deviceProfile === "TABLET") {
    return (
      <SplitBoard
        header={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            {renderHeaderLeft()}
            {renderHeaderRight()}
          </div>
        }
        sidebar={renderNavList()}
        sidebarWidth={280}
      >
        <div style={{ padding: "1.25rem", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
          {renderModuleContent()}
        </div>
      </SplitBoard>
    );
  }

  // 默认 DESKTOP: Cockpit 宽屏大剧场
  return (
    <Cockpit
      header={renderHeaderLeft()}
      sidebar={renderNavList()}
      toolbar={renderHeaderRight()}
    >
      <div style={{ padding: "1.5rem", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
        {renderModuleContent()}
      </div>
    </Cockpit>
  );
};

export default MathJuniorHome;
