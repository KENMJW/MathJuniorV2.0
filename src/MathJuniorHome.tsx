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
import { dbClient } from "./engine/db/dbClient";
import {
  GraphKnowledgePoint,
  LogicLine,
} from "./modules/graph/types";
import { LeapSandboxModel } from "./modules/sandbox/morphControllers";
import { ALL_107_KNOWLEDGE_POINTS } from "./modules/concept/allPointsData";
import {
  ChevronLeft,
  ChevronDown,
  Globe,
  Bell,
  User,
  Compass,
  GitBranch,
  FlaskConical,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "./lib/utils";

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

  // 状态感知与全局同步 (Session Store)
  const selectedConceptPointId = useSessionStore((state) => state.selectedConceptPointId);
  const selectedGraphLineId = useSessionStore((state) => state.selectedGraphLineId);
  const storeLeapModelId = useSessionStore((state) => state.selectedLeapModelId);
  const setStoreLeapModelId = useSessionStore((state) => state.setSelectedLeapModelId);
  const conceptSubTab = useSessionStore((state) => state.conceptSubTab);
  const setConceptSubTab = useSessionStore((state) => state.setConceptSubTab);
  const graphSubTab = useSessionStore((state) => state.graphSubTab);
  const setGraphSubTab = useSessionStore((state) => state.setGraphSubTab);
  const leapSubTab = useSessionStore((state) => state.leapSubTab);
  const setLeapSubTab = useSessionStore((state) => state.setLeapSubTab);
  const setIsConceptDrawerOpen = useSessionStore((state) => state.setIsConceptDrawerOpen);
  const setIsGraphDrawerOpen = useSessionStore((state) => state.setIsGraphDrawerOpen);
  const setIsLeapDrawerOpen = useSessionStore((state) => state.setIsLeapDrawerOpen);

  // 模块内部状态
  const [labSubView, setLabSubView] = useState<"concept_sandbox" | "leap_4d">(
    deviceProfile === "MOBILE" ? "leap_4d" : "concept_sandbox"
  );
  const [selectedLeapModelId, setSelectedLeapModelId] = useState<string>(storeLeapModelId || "LM-7A-01");

  // 移动端默认进场聚焦 4D 跃迁沙盒
  useEffect(() => {
    if (deviceProfile === "MOBILE" && labSubView !== "leap_4d") {
      setLabSubView("leap_4d");
    }
  }, [deviceProfile]);

  useEffect(() => {
    if (storeLeapModelId && storeLeapModelId !== selectedLeapModelId) {
      setSelectedLeapModelId(storeLeapModelId);
    }
  }, [storeLeapModelId]);
      
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
              visual_elements_json: r.visual_elements_json ? String(r.visual_elements_json) : undefined,
              inquiry_steps_json: r.inquiry_steps_json ? String(r.inquiry_steps_json) : undefined,
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
            story_stages_json: r.story_stages_json ? String(r.story_stages_json) : undefined,
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

  const handleBackToPortal = () => {
    try {
      localStorage.removeItem("preferred_subject");
    } catch {
      // ignore
    }
    navigate("/?bypass_redirect=true");
  };

  const handleSelectSubModule = (moduleKey: string) => {
    navigate(`/math-junior/${moduleKey}`);
  };

  // 四大模块正式入口导航项 (严格对标 ios27_demo 与产品规范)
  const MODULE_NAV_ITEMS = [
    { key: "concept", labelZh: "探本溯源 · 概念精讲", labelEn: "Concept Lecture", icon: Compass },
    { key: "graph", labelZh: "经纬纵横 · 思维图谱", labelEn: "Knowledge Graph", icon: GitBranch },
    { key: "lab", labelZh: "见微知著 · 实验探究", labelEn: "Lab Exploration", icon: FlaskConical },
    { key: "exam", labelZh: "百炼成钢 · 实战测评", labelEn: "Assessment Center", icon: ClipboardCheck },
  ];

  // 电脑端统一 54px 高透毛玻璃工具条 (对标 macOS 27 Golden Gate)
  const renderDesktopHeader = () => (
    <header
      data-testid="math-junior-global-bar"
      className="w-full h-[54px] bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-0 z-50 select-none box-border"
    >
      <div className="max-w-[1240px] mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* 左侧：[ ← 返回全科门户 ] + 品牌徽章 */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-testid="back-to-portal-btn"
            onClick={handleBackToPortal}
            className="back-btn h-8 px-3 rounded-full border border-black/[0.08] bg-white text-text-primary text-xs font-semibold hover:bg-card-subtle shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-text-secondary" />
            <span>{t("nav.backToPortal", locale, "返回全科门户")}</span>
          </button>

          <div className="h-4 w-px bg-black/[0.08]" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-primary tracking-tight">
              {t("app.title", locale, "全科核心素养提分系统")}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ios-blue/[0.08] text-ios-blue border border-ios-blue/20">
              {locale === "en" ? "Junior Math V2.0" : "初中数学 V2.0"}
            </span>
          </div>
        </div>

        {/* 居中：4 核心模块分段控制器 (Segmented Control) */}
        <div
          data-testid="math-junior-subnav-bar"
          className="inline-flex items-center p-1 rounded-full bg-black/[0.04] border border-black/[0.04] shadow-inner shrink-0"
        >
          {MODULE_NAV_ITEMS.map((item) => {
            const active = currentSubModule === item.key;
            const IconComp = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                data-testid={`module-nav-${item.key}`}
                onClick={() => handleSelectSubModule(item.key)}
                className={cn(
                  "px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-200 inline-flex items-center gap-1.5 cursor-pointer",
                  active
                    ? "bg-ios-blue text-white shadow-sm font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/40"
                )}
              >
                <IconComp className={cn("w-3.5 h-3.5", active ? "text-white" : "text-text-secondary")} />
                <span>{locale === "en" ? item.labelEn : item.labelZh}</span>
                <span className="hidden">{item.labelZh.replace(/\s+/g, "")}</span>
              </button>
            );
          })}
        </div>

        {/* 右侧：通知小铃铛 + 语言切换 + 学员状态 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            title={t("common.announcements", locale, "系统公告")}
            className="w-8 h-8 rounded-full border border-black/[0.08] bg-white text-text-secondary flex items-center justify-center relative hover:bg-card-subtle transition-all cursor-pointer shadow-sm"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            data-testid="math-lang-toggle"
            onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
            className="h-8 px-2.5 rounded-full border border-black/[0.08] bg-white text-text-secondary text-xs font-medium flex items-center gap-1.5 hover:bg-card-subtle transition-all cursor-pointer shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-text-secondary" />
            <span>{locale === "zh-CN" ? "简体中文" : "English"}</span>
          </button>

          <div className="h-8 px-2.5 rounded-full border border-black/[0.08] bg-white text-text-secondary text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <User className="w-3.5 h-3.5 text-text-secondary" />
            <span>{locale === "en" ? "Student Mode" : "学员模式"}</span>
          </div>
        </div>
      </div>
    </header>
  );

  // 平板端顶部栏组件
  const renderTabletHeader = () => (
    <div className="flex items-center justify-between w-full gap-3 px-1 py-1">
      <button
        type="button"
        data-testid="back-to-portal-btn"
        onClick={handleBackToPortal}
        className="back-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-subtle bg-white text-text-primary text-xs font-semibold cursor-pointer shadow-sm hover:bg-card-subtle transition-all shrink-0 min-h-[36px]"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>{t("nav.backToPortal", locale, "返回全科门户")}</span>
      </button>

      <div>
        <h1 className="m-0 text-base font-bold text-text-primary whitespace-nowrap">
          {locale === "en" ? "Junior Math Workshop" : "初中数学核心素养工坊"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="math-lang-toggle"
          onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
          className="h-8 px-2.5 rounded-full border border-border-subtle bg-white text-text-secondary text-xs font-medium flex items-center gap-1.5 hover:bg-card-subtle transition-all cursor-pointer min-h-[36px]"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{locale === "zh-CN" ? "English" : "中文"}</span>
        </button>
      </div>
    </div>
  );

  // 移动端 44px 紧凑顶轨 + 居中交互式标题胶囊 (>= 160x44px 触控区，点击弹出对应模块选择抽屉)
  const renderMobileHeader = () => {
    let moduleIcon = Compass;
    let entityTitle = "";
    let onCapsuleClick = () => {};

    if (currentSubModule === "concept") {
      moduleIcon = Compass;
      const pt = (dbPoints || ALL_107_KNOWLEDGE_POINTS).find((p: any) => p.point_id === selectedConceptPointId);
      const name = pt ? (locale === "en" ? (pt.name_en || pt.name_zh) : pt.name_zh) : "考点精讲";
      entityTitle = `${selectedConceptPointId} · ${name}`;
      onCapsuleClick = () => setIsConceptDrawerOpen((prev) => !prev);
    } else if (currentSubModule === "graph") {
      moduleIcon = GitBranch;
      const line = effectiveLines.find((l) => l.line_id === selectedGraphLineId);
      const name = line ? (locale === "en" ? (line.name_en || line.name_zh) : line.name_zh) : "主线图谱";
      entityTitle = `${selectedGraphLineId} · ${name}`;
      onCapsuleClick = () => setIsGraphDrawerOpen((prev) => !prev);
    } else if (currentSubModule === "lab" || currentSubModule === "sandbox") {
      moduleIcon = FlaskConical;
      const model = effectiveLeapModels.find((m) => m.model_id === selectedLeapModelId);
      const name = model ? (locale === "en" ? (model.model_name_en || model.model_name_zh) : model.model_name_zh) : "4D跃迁沙盒";
      entityTitle = `${selectedLeapModelId} · ${name}`;
      onCapsuleClick = () => setIsLeapDrawerOpen((prev) => !prev);
    } else {
      moduleIcon = ClipboardCheck;
      entityTitle = locale === "en" ? "Assessment Arena" : "实战测评 · 极速组卷";
    }

    const ModuleIconComp = moduleIcon;

    return (
      <div
        data-testid="math-junior-mobile-header"
        className="flex items-center justify-between w-full h-[44px] min-h-[44px] px-2.5 gap-2 box-border bg-white/90 backdrop-blur-xl"
      >
        {/* 手机端精简返回按钮：极简图标 (<) 紧凑胶囊，热区 >= 36px */}
        <button
          type="button"
          data-testid="back-to-portal-btn"
          onClick={handleBackToPortal}
          aria-label={t("nav.backToPortal", locale, "返回全科门户")}
          title={t("nav.backToPortal", locale, "返回全科门户")}
          className="back-btn inline-flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] p-0 rounded-full border border-black/[0.08] bg-white text-text-primary cursor-pointer shrink-0 shadow-sm active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 居中：交互式标题胶囊 (>= 160x44px 触控区，点击弹出对应模块选择抽屉) */}
        <button
          type="button"
          data-testid="interactive-title-capsule"
          onClick={onCapsuleClick}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-w-[160px] h-[34px] rounded-full bg-black/[0.04] active:bg-black/[0.08] border border-black/[0.06] text-text-primary text-xs font-bold cursor-pointer transition-all shrink-0 max-w-[calc(100vw-130px)] shadow-xs"
        >
          <ModuleIconComp className="w-3.5 h-3.5 text-ios-blue shrink-0" />
          <span
            data-testid="mobile-header-title"
            className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
          >
            {entityTitle}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-text-secondary shrink-0 opacity-70" />
        </button>

        {/* 手机端右侧语言切换：高度 28px 紧凑胶囊 */}
        <button
          type="button"
          data-testid="math-lang-toggle"
          onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
          className="h-7 px-2 rounded-full border border-black/[0.08] bg-white text-text-primary font-semibold text-xs inline-flex items-center gap-1 shrink-0 whitespace-nowrap shadow-sm active:scale-95"
        >
          <Globe className="w-3 h-3 text-text-secondary" />
          <span>{locale === "zh-CN" ? "EN" : "中"}</span>
        </button>
      </div>
    );
  };

  // 移动端 36px 固化吸顶二级书签轨 (y = 44px ~ 80px)
  const renderMobileSubnav = () => {
    let tabs: Array<{ key: string; label: string; active: boolean; onClick: () => void }> = [];

    if (currentSubModule === "concept") {
      tabs = [
        {
          key: "stages",
          label: locale === "en" ? "① Lecture" : "① 概念精讲",
          active: conceptSubTab === "stages",
          onClick: () => setConceptSubTab("stages"),
        },
        {
          key: "sandbox",
          label: locale === "en" ? "② Sandbox" : "② 链接沙盒",
          active: conceptSubTab === "sandbox",
          onClick: () => setConceptSubTab("sandbox"),
        },
        {
          key: "master",
          label: locale === "en" ? "③ Master" : "③ 黄金母题",
          active: conceptSubTab === "master",
          onClick: () => setConceptSubTab("master"),
        },
        {
          key: "practice",
          label: locale === "en" ? "④ Practice" : "④ 单点快练",
          active: conceptSubTab === "practice",
          onClick: () => setConceptSubTab("practice"),
        },
      ];
    } else if (currentSubModule === "graph") {
      tabs = [
        {
          key: "concept",
          label: locale === "en" ? "① Lecture" : "① 谱系精讲",
          active: graphSubTab === "concept",
          onClick: () => setGraphSubTab("concept"),
        },
        {
          key: "sandbox",
          label: locale === "en" ? "② Sandbox" : "② 闭环沙盒",
          active: graphSubTab === "sandbox",
          onClick: () => setGraphSubTab("sandbox"),
        },
        {
          key: "master",
          label: locale === "en" ? "③ Master" : "③ 压轴母题",
          active: graphSubTab === "master",
          onClick: () => setGraphSubTab("master"),
        },
        {
          key: "practice",
          label: locale === "en" ? "④ Practice" : "④ 综合快练",
          active: graphSubTab === "practice",
          onClick: () => setGraphSubTab("practice"),
        },
      ];
    } else if (currentSubModule === "lab" || currentSubModule === "sandbox") {
      tabs = [
        {
          key: "deduction",
          label: locale === "en" ? "① Deduction" : "① 分步推演",
          active: leapSubTab === "deduction",
          onClick: () => setLeapSubTab("deduction"),
        },
        {
          key: "free",
          label: locale === "en" ? "② Free Exploration" : "② 自由探索",
          active: leapSubTab === "free",
          onClick: () => setLeapSubTab("free"),
        },
      ];
    } else if (currentSubModule === "exam") {
      tabs = [
        {
          key: "generate",
          label: locale === "en" ? "① Fast Paper · Burn After Exam" : "① 极速组卷 · 考完即焚",
          active: true,
          onClick: () => {},
        },
      ];
    }

    return (
      <div
        data-testid="math-junior-mobile-subnav"
        className="flex items-center justify-between w-full h-[36px] min-h-[36px] px-1 gap-1 box-border"
      >
        <div className="flex items-center justify-around w-full gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-testid={`mobile-subnav-${tab.key}`}
              onClick={tab.onClick}
              className={cn(
                "flex-1 h-[28px] px-2 rounded-full text-[11px] font-bold transition-all inline-flex items-center justify-center whitespace-nowrap cursor-pointer",
                tab.active
                  ? "bg-ios-blue text-white shadow-xs"
                  : "bg-black/[0.03] text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 导航栏 (供 Tablet 侧边栏展示)
  const renderNavList = () => (
    <nav
      data-testid="math-junior-nav-list"
      className="flex flex-col gap-2 p-4"
    >
      <div className="text-xs font-bold text-text-secondary px-2 pb-1">
        {locale === "en" ? "Core Competency Modules" : "四大核心能力模块"}
      </div>
      {MODULE_NAV_ITEMS.map((item) => {
        const active = currentSubModule === item.key;
        const IconComp = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            data-testid={`module-nav-${item.key}`}
            onClick={() => handleSelectSubModule(item.key)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left cursor-pointer transition-all duration-200",
              active
                ? "border-ios-blue bg-ios-blue/[0.08] text-ios-blue font-bold shadow-sm"
                : "border-border-subtle bg-card text-text-primary font-medium hover:bg-card-subtle"
            )}
          >
            <IconComp className="w-4 h-4 shrink-0" />
            <span>{locale === "en" ? item.labelEn : item.labelZh}</span>
            <span className="hidden">{item.labelZh.replace(/\s+/g, "")}</span>
          </button>
        );
      })}
    </nav>
  );

  // 移动端底部原生 iOS Tab Bar (56px)
  const renderMobileBottomBar = () => (
    <div
      data-testid="math-junior-mobile-tabbar"
      className="flex justify-around items-center w-full h-14 min-h-[56px] box-border bg-white/85 backdrop-blur-xl border-t border-black/[0.06] pb-[env(safe-area-inset-bottom)]"
    >
      {MODULE_NAV_ITEMS.map((item) => {
        const active = currentSubModule === item.key || (item.key === "lab" && currentSubModule === "sandbox");
        const IconComp = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            data-testid={`mobile-tab-${item.key}`}
            onClick={() => handleSelectSubModule(item.key)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 border-none rounded-xl px-2.5 py-1 min-w-[52px] min-h-[48px] cursor-pointer transition-all duration-200",
              active
                ? "bg-ios-blue/[0.08] text-ios-blue font-bold"
                : "bg-transparent text-text-secondary font-medium hover:text-text-primary"
            )}
          >
            <IconComp className="w-5 h-5" />
            <span className="text-[11px] whitespace-nowrap leading-tight">
              {locale === "en" ? item.labelEn : (item.labelZh.split("·")[1] || item.labelZh).trim()}
            </span>
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
            onSelectLeapModelId={(id: string) => {
              setSelectedLeapModelId(id);
              setStoreLeapModelId(id);
            }}
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
        subnav={renderMobileSubnav()}
        bottomSheet={renderMobileBottomBar()}
      >
        <div className="w-full box-border">{renderModuleContent()}</div>
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
        <div className="p-5 w-full min-h-full box-border">
          {renderModuleContent()}
        </div>
      </SplitBoard>
    );
  }

  // 默认 DESKTOP: Cockpit 宽屏大剧场 (居中 Keynote 大卡片布局，彻底取消侧边栏抽屉挤压)
  return (
    <Cockpit
      header={renderDesktopHeader()}
      sidebar={<div className="hidden">{renderNavList()}</div>}
      toolbar={null}
      defaultSidebarCollapsed={true}
      hideSidebarToggle={true}
    >
      <div
        data-testid="math-junior-desktop-theater"
        className="w-full max-w-[1240px] mx-auto px-4 pt-6 pb-12 box-border"
      >
        {renderModuleContent()}
      </div>
    </Cockpit>
  );
};

export default MathJuniorHome;
