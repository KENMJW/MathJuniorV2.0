import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ConceptNav } from "./ConceptNav";
import { GraphNav, mockLogicLines } from "./modules/graph";
import { mockLeapSandboxModels } from "./modules/sandbox";
import { LabWorkspace } from "./modules/sandbox/LabWorkspace";
import {
  handInHandConfig,
  quadraticVerticalHeightConfig,
  apolloniusConfig,
  pythagoreanConfig,
} from "./modules/sandbox/configs";
import { PaperWorkbench } from "./modules/exam";
import { CardDeck, SplitBoard, Cockpit } from "./components/shell";
import { DeviceProfile } from "./engine/device/detectDeviceProfile";
import { setDeviceOverride, getDeviceOverride } from "./engine/device/deviceOverride";
import { useDeviceResponsive } from "./hooks/useDeviceResponsive";
import { t } from "./engine/i18n/i18n";
import { useSessionStore } from "./store/sessionStore";
import { Icon } from "./components/common/Icon";
import { dbClient } from "./engine/db/dbClient";
import {
  GraphKnowledgePoint,
  LogicLine,
} from "./modules/graph/types";
import { LeapSandboxModel } from "./modules/sandbox/morphControllers";

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

  // 设备检测与手动 override 状态管理 (任务 20.4 & TASK-FE-0010)
  const responsive = useDeviceResponsive();
  const [currentOverride, setCurrentOverride] = useState<DeviceProfile | null>(getDeviceOverride());
  const deviceProfile = currentOverride || responsive.device;

  // 模块内部状态
  const [labSubView, setLabSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");
  const [selectedLeapModelId, setSelectedLeapModelId] = useState<string>("LM-9A-19");
      
  // 异步真库数据状态 (core.db 107 考点 + 12 主线)
  const [dbLines, setDbLines] = useState<LogicLine[] | null>(null);
  const [dbPoints, setDbPoints] = useState<GraphKnowledgePoint[] | null>(null);

  // 异步真库沙盒数据状态 (sandbox.db 46 概念沙盒 + 36 跃迁模型)
  const [dbConceptSandboxes, setDbConceptSandboxes] = useState<Array<{
    id: string;
    nameZh: string;
    nameEn: string;
    config: any;
    desc: string;
  }> | null>(null);
  const [dbLeapModels, setDbLeapModels] = useState<LeapSandboxModel[] | null>(null);

  // 1. 异步载入 core.db 全量图谱数据
  useEffect(() => {
    let active = true;
    async function loadCoreData() {
      try {
        const [lineRows, kpRows] = await Promise.all([
          dbClient.query<any>('core', 'SELECT * FROM logic_lines ORDER BY line_id ASC'),
          dbClient.query<any>(
            'core',
            'SELECT point_id, name_zh, name_en, grade, semester, domain, subcategory, primary_line_id, is_mandatory FROM knowledge_points ORDER BY point_id ASC'
          ),
        ]);

        if (!active) return;

        if (lineRows && lineRows.length > 0) setDbLines(lineRows);
        if (kpRows && kpRows.length > 0) setDbPoints(kpRows);
      } catch (err) {
        console.warn('[MathJuniorHome] Failed to load core DB data, using fallback:', err);
      }
    }
    loadCoreData();
    return () => {
      active = false;
    };
  }, []);

  // 2. 异步载入 sandbox.db 全量沙盒数据
  useEffect(() => {
    let active = true;
    async function loadSandboxData() {
      try {
        const [sbRows, leapRows, kpRows] = await Promise.all([
          dbClient.query<any>('sandbox', 'SELECT * FROM concept_sandboxes ORDER BY sandbox_id ASC'),
          dbClient.query<any>('sandbox', 'SELECT * FROM leap_sandbox_models ORDER BY model_id ASC'),
          dbClient.query<any>('core', 'SELECT point_id, name_zh FROM knowledge_points'),
        ]);

        if (!active) return;

        if (sbRows && sbRows.length > 0) {
          
          const kpMap = new Map();
          if (kpRows) {
            kpRows.forEach(r => kpMap.set(r.point_id, r.name_zh));
          }
          const mappedSandboxes = sbRows.map((r: any) => ({
            id: String(r.sandbox_id),
            nameZh: kpMap.get(r.point_id) || r.sandbox_id,
            
            nameEn: String(r.sandbox_id),
            config: {
              sandbox_id: String(r.sandbox_id),
              canvas_template: String(r.canvas_template || 'euclidean'),
              viewbox_spec_json: String(r.viewbox_spec_json || ''),
              drag_points_json: String(r.drag_points_json || '[]'),
              param_sliders_json: r.param_sliders_json ? String(r.param_sliders_json) : undefined,
              invariants_display_json: r.invariants_display_json
                ? String(r.invariants_display_json)
                : undefined,
              inquiry_guide_zh: r.inquiry_guide_zh ? String(r.inquiry_guide_zh) : undefined,
              inquiry_guide_en: r.inquiry_guide_en ? String(r.inquiry_guide_en) : undefined,
            },
            desc: String(r.inquiry_guide_zh || '动态几何与参数不变量探究'),
          }));
          setDbConceptSandboxes(mappedSandboxes);
        }

        if (leapRows && leapRows.length > 0) {
          const parsedLeap: LeapSandboxModel[] = leapRows.map((r: any) => ({
            model_id: String(r.model_id),
            model_name_zh: String(r.model_name_zh || ''),
            model_name_en: String(r.model_name_en || ''),
            unlocked_semester: String(r.unlocked_semester || '7-1'),
            primary_line: String(r.primary_line || 'A1'),
            category_id: String(r.category_id || ''),
            tier_level: Number(r.tier_level || 1),
            canonical_state_count: Number(r.canonical_state_count || 1),
            kp_dependencies:
              typeof r.kp_dependencies === 'string'
                ? JSON.parse(r.kp_dependencies || '[]')
                : r.kp_dependencies || [],
            clique_id: r.clique_id ? String(r.clique_id) : undefined,
            model_brief_zh: String(r.model_brief_zh || ''),
            model_brief_en: String(r.model_brief_en || ''),
            viewbox_spec_json: String(r.viewbox_spec_json || '{}'),
            carrier_morphing_json: String(r.carrier_morphing_json || '{}'),
            parameter_morphing_json: String(r.parameter_morphing_json || '{}'),
            posture_morphing_json: String(r.posture_morphing_json || '{}'),
            camouflage_xray_json: String(r.camouflage_xray_json || '{}'),
          }));
          setDbLeapModels(parsedLeap);
        }
      } catch (err) {
        console.warn('[MathJuniorHome] Failed to load sandbox DB data, using fallback:', err);
      }
    }
    loadSandboxData();
    return () => {
      active = false;
    };
  }, []);

  const effectiveLines = dbLines || mockLogicLines;
  const effectiveSandboxes = dbConceptSandboxes || ALL_SANDBOXES;
  const effectiveLeapModels = useMemo(() => {
    const dbList = dbLeapModels || [];
    return mockLeapSandboxModels.map((mockM) => {
      // 契约升级模型优先使用前端契约配置
      if ((mockM as any).canvas_template) return mockM;
      const foundInDb = dbList.find((d) => d.model_id === mockM.model_id);
      return foundInDb || mockM;
    });
  }, [dbLeapModels]);

  // 自动化测试机制支持 (允许通过 window.__setDeviceOverride / __setLabState 供 E2E 调试使用)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__setDeviceOverride = (override: DeviceProfile | null) => {
        setDeviceOverride(override);
        setCurrentOverride(override);
      };
      (window as any).__setLabSubView = (subView: "concept_sandbox" | "leap_4d") => {
        setLabSubView(subView);
      };
      (window as any).__setSelectedLeapModelId = (id: string) => {
        setSelectedLeapModelId(id);
      };
    }
  }, []);

  const handleSelectSubModule = (moduleKey: string) => {
    navigate(`/math-junior/${moduleKey}`);
  };

  // 四大模块正式入口导航项 (严格对标 ios27_demo 与产品规范)
  const MODULE_NAV_ITEMS = [
    { key: "concept", labelZh: "探本溯源 · 概念精讲", labelEn: "Concept Lecture", icon: "nav-concept" },
    { key: "graph", labelZh: "经纬纵横 · 思维图谱", labelEn: "Knowledge Graph", icon: "nav-graph" },
    { key: "lab", labelZh: "见微知著 · 实验探究", labelEn: "Lab Exploration", icon: "nav-lab" },
    { key: "exam", labelZh: "百炼成钢 · 实战测评", labelEn: "Assessment Center", icon: "nav-exam" },
  ];

  // 顶栏右侧工具操作区 (彻底删除设备切换钮 UI，保留语言切换与自动适配)
  const renderHeaderRight = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <Icon name="globe" size={14} />
        <span>{locale === "zh-CN" ? "English" : "中文"}</span>
      </button>
    </div>
  );

  // 电脑端双层顶栏 (Layer 1 全局系统栏 + Layer 2 次级导航条，100% 对标 Demo 截图 2)
  const renderDesktopHeader = () => (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* 第 1 层：全局系统顶栏 */}
      <div
        data-testid="math-junior-global-bar"
        style={{
          width: "100%",
          borderBottom: "none",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            height: "50px",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          {/* 左侧：黑标 App Logo + 全科核心素养提分系统 + 初中数学 */}
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "var(--text-primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                flexShrink: 0,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 22 22 22 12 2" stroke="#fff" fill="none" />
                <circle cx="12" cy="14" r="2" fill="#fff" stroke="none" />
              </svg>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "-0.2px",
                  color: "var(--text-primary)",
                }}
              >
                全科核心素养提分系统
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "var(--radius-pill)",
                  background: "rgba(0, 113, 227, 0.08)",
                  color: "var(--ios-blue)",
                  border: "1px solid rgba(0, 113, 227, 0.2)",
                }}
              >
                初中数学 V2.0.0beta
              </span>
            </div>
          </div>

          {/* 右侧：通知小铃铛 + 语言切换 + 学员状态 */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* 通知铃铛 */}
            <button
              type="button"
              title="系统公告"
              style={{
                width: "30px",
                height: "30px",
                padding: 0,
                borderRadius: "var(--radius-pill)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#ff3b30",
                }}
              />
            </button>

            {/* 语言切换 */}
            <button
              type="button"
              data-testid="math-lang-toggle"
              onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
              style={{
                height: "30px",
                padding: "0 10px",
                borderRadius: "var(--radius-pill)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <Icon name="globe" size={13} />
              <span>{locale === "zh-CN" ? "简体中文" : "English"}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* 学员状态 */}
            <div
              style={{
                height: "30px",
                padding: "0 10px",
                borderRadius: "var(--radius-pill)",
                background: "#ffffff",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{locale === "en" ? "Student Mode" : "默认学员 · 核心素养版"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 第 2 层：次级导航条 (返回全科门户 + 4 主模块胶囊分段器) */}
      <div
        data-testid="math-junior-subnav-bar"
        style={{
          width: "100%",
          background: "transparent",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            height: "58px",
            padding: "0 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          {/* 左侧：< 返回全科门户 */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              type="button"
              data-testid="back-to-portal-btn"
              onClick={() => navigate("/")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-subtle)",
                background: "#ffffff",
                color: "var(--text-primary)",
                fontFamily: "var(--font-family-sans, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif)",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "-0.2px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-card-subtle)";
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>{t("nav.backToPortal", locale, "返回全科门户")}</span>
            </button>
          </div>

          {/* 右侧：4 模块横向胶囊 (方案 1：整体放大至 14px + 经典蓝底高光，建立清晰一级父级统治层级) */}
          <div
            style={{
              display: "inline-flex",
              background: "rgba(0, 0, 0, 0.05)",
              padding: "4px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid rgba(0, 0, 0, 0.04)",
              gap: "3px",
            }}
          >
            {MODULE_NAV_ITEMS.map((item) => {
              const active = currentSubModule === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  data-testid={`module-nav-${item.key}`}
                  onClick={() => handleSelectSubModule(item.key)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    background: active ? "var(--ios-blue, #0071e3)" : "transparent",
                    fontFamily: "var(--font-family-sans, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif)",
                    fontSize: "14px",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    letterSpacing: "-0.2px",
                    boxShadow: active
                      ? "0 4px 14px rgba(0, 113, 227, 0.28)"
                      : "none",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--text-primary, #1d1d1f)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    style={{ stroke: active ? "#ffffff" : "currentColor" }}
                  />
                  <span>{locale === "en" ? item.labelEn : item.labelZh}</span>
                  <span style={{ display: "none" }}>{item.labelZh.replace(/\s+/g, "")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // 平板端与移动端顶部栏组件
  const renderTabletHeader = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "12px" }}>
      <button
        type="button"
        data-testid="back-to-portal-btn"
        onClick={() => navigate("/")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border-subtle)",
          background: "#ffffff",
          color: "var(--text-primary)",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>{t("nav.backToPortal", locale, "返回全科门户")}</span>
      </button>

      <div>
        <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
          初中数学核心素养工坊
        </h1>
      </div>

      {renderHeaderRight()}
    </div>
  );

  const renderMobileHeader = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: "8px",
      }}
    >
      {/* 手机端精简返回按钮：极简图标 (<) 紧凑胶囊，热区 >= 44px，彻底根除“全科门/户”竖排 */}
      <button
        type="button"
        data-testid="back-to-portal-btn"
        onClick={() => navigate("/")}
        aria-label="返回全科门户"
        title="返回全科门户"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          minWidth: "36px",
          minHeight: "36px",
          padding: 0,
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border-subtle)",
          background: "#ffffff",
          color: "var(--text-primary)",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* 手机端标题：单行不换行，绝不出现“初中数/学”竖排 */}
      <span
        style={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center",
          flex: 1,
        }}
      >
        初中数学
      </span>

      {/* 手机端右侧语言切换：紧凑胶囊，绝无挤压 */}
      <button
        type="button"
        data-testid="math-lang-toggle"
        onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
        style={{
          height: "32px",
          padding: "0 10px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border-subtle)",
          background: "#ffffff",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.78rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          flexShrink: 0,
          whiteSpace: "nowrap",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Icon name="globe" size={13} />
        <span>{locale === "zh-CN" ? "EN" : "中"}</span>
      </button>
    </div>
  );

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

  // 移动端底部原生 iOS Tab Bar
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
            data-testid={`mobile-tab-${item.key}`}
            onClick={() => handleSelectSubModule(item.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              border: "none",
              background: active ? "rgba(0, 113, 227, 0.08)" : "transparent",
              borderRadius: "10px",
              padding: "4px 10px",
              color: active ? "var(--ios-blue)" : "var(--text-secondary)",
              fontWeight: active ? 700 : 500,
              fontSize: "0.72rem",
              cursor: "pointer",
              minWidth: "52px",
              minHeight: "48px",
              justifyContent: "center",
              transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <Icon name={item.icon} size={20} />
            <span style={{ whiteSpace: "nowrap" }}>{(item.labelZh.split("·")[1] || item.labelZh).trim()}</span>
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
          <GraphNav
            lines={effectiveLines}
            initialLineId="A1"
            knowledgePoints={dbPoints || undefined}
            leapModels={effectiveLeapModels}
          />
        );

      case "lab":
      case "sandbox":
        return (
          <LabWorkspace
            effectiveSandboxes={effectiveSandboxes}
            effectiveLeapModels={effectiveLeapModels}
            locale={locale}
            labSubView={labSubView}
            onLabSubViewChange={setLabSubView}
            selectedLeapModelId={selectedLeapModelId}
            onSelectLeapModelId={setSelectedLeapModelId}
          />
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
        header={renderMobileHeader()}
        bottomSheet={renderMobileBottomBar()}
      >
        <div style={{ width: "100%", boxSizing: "border-box" }}>{renderModuleContent()}</div>
      </CardDeck>
    );
  }

  if (deviceProfile === "TABLET") {
    return (
      <SplitBoard
        header={renderTabletHeader()}
        sidebar={renderNavList()}
        sidebarWidth={260}
        isPortrait={responsive.orientation === "portrait"}
      >
        <div style={{ padding: "1.25rem", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
          {renderModuleContent()}
        </div>
      </SplitBoard>
    );
  }

  // 默认 DESKTOP: Cockpit 宽屏大剧场 (居中 Keynote 大卡片布局，彻底取消侧边栏抽屉挤压)
  return (
    <Cockpit
      header={renderDesktopHeader()}
      sidebar={<div style={{ display: "none" }}>{renderNavList()}</div>}
      toolbar={null}
      defaultSidebarCollapsed={true}
      hideSidebarToggle={true}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "1.5rem 1rem 3rem 1rem",
          boxSizing: "border-box",
        }}
      >
        {renderModuleContent()}
      </div>
    </Cockpit>
  );
};

export default MathJuniorHome;
