import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "./store/sessionStore";
import { t } from "./engine/i18n/i18n";
import { Icon } from "./components/common/Icon";
import { useDeviceResponsive } from "./hooks/useDeviceResponsive";

interface SubjectCardItem {
  id: string;
  nameZh: string;
  nameEn: string;
  icon: string;
  scopeZh: string;
  scopeEn: string;
  descriptionZh: string;
  descriptionEn: string;
}

// 初中其他 7 学科 (全科母版筹备中)
const JUNIOR_OTHER_SUBJECTS: SubjectCardItem[] = [
  {
    id: "physics",
    nameZh: "初中物理",
    nameEn: "Junior Physics",
    icon: "bolt",
    scopeZh: "八年级 · 九年级 (电光力热)",
    scopeEn: "Grades 8-9 (Electricity, Optics, Mechanics, Heat)",
    descriptionZh: "力学模型 · 电路仿真 · 光学实验 · 能量守恒",
    descriptionEn: "Mechanics, Circuits, Optics, and Energy Conservation.",
  },
  {
    id: "chemistry",
    nameZh: "初中化学",
    nameEn: "Junior Chemistry",
    icon: "flask",
    scopeZh: "九年级 (分子微观反应与实验)",
    scopeEn: "Grade 9 (Microscopic Reactions & Experiments)",
    descriptionZh: "微观粒子 · 溶液酸碱 · 质量守恒 · 物质推断",
    descriptionEn: "Microscopic Particles, Acids & Bases, Conservation of Mass.",
  },
  {
    id: "biology",
    nameZh: "初中生物",
    nameEn: "Junior Biology",
    icon: "sprout",
    scopeZh: "七年级 · 八年级 (生命演变)",
    scopeEn: "Grades 7-8 (Life Evolution & Ecology)",
    descriptionZh: "细胞结构 · 遗传变异 · 生态平衡 · 实验探究",
    descriptionEn: "Cell Structure, Genetics, Ecology, and Lab Inquiry.",
  },
  {
    id: "chinese",
    nameZh: "初中语文",
    nameEn: "Junior Chinese",
    icon: "scroll",
    scopeZh: "七~九年级 (文言断句思辨)",
    scopeEn: "Grades 7-9 (Classical Texts & Critical Thinking)",
    descriptionZh: "文言文精析 · 现代文阅读 · 作文升格 · 素养积累",
    descriptionEn: "Classical Chinese, Reading Comprehension, and Writing.",
  },
  {
    id: "english",
    nameZh: "初中英语",
    nameEn: "Junior English",
    icon: "globe",
    scopeZh: "七~九年级 (语篇完形进阶)",
    scopeEn: "Grades 7-9 (Text Discourse & Cloze Mastery)",
    descriptionZh: "语法句式 · 完形填空 · 语法填空 · 考点冲刺",
    descriptionEn: "Grammar, Cloze Test, Reading & Writing Mastery.",
  },
  {
    id: "history",
    nameZh: "初中历史",
    nameEn: "Junior History",
    icon: "compass",
    scopeZh: "七~九年级 (时空演进轴线)",
    scopeEn: "Grades 7-9 (Temporal & Spatial Evolution)",
    descriptionZh: "时空观念 · 史料实证 · 唯物史观 · 历史解释",
    descriptionEn: "Time & Space, Historical Evidence, and Materialism.",
  },
  {
    id: "geography",
    nameZh: "初中地理",
    nameEn: "Junior Geography",
    icon: "compass",
    scopeZh: "七年级 · 八年级 (地形与气候)",
    scopeEn: "Grades 7-8 (Topography & Climate)",
    descriptionZh: "经纬等高 · 区域认知 · 人地协调 · 综合思维",
    descriptionEn: "Coordinates, Regional Cognition, and Human-Nature Harmony.",
  },
];

// 小学启蒙学科
const PRIMARY_SUBJECTS: SubjectCardItem[] = [
  {
    id: "primary-math",
    nameZh: "小学数学",
    nameEn: "Primary Math",
    icon: "target",
    scopeZh: "一至六年级 (数感与图形空间)",
    scopeEn: "Grades 1-6 (Number Sense & Geometry)",
    descriptionZh: "具象操作 · 计算法则 · 空间表象 · 逻辑启蒙",
    descriptionEn: "Concrete Manipulation, Operations, Spatial Reasoning.",
  },
  {
    id: "primary-chinese",
    nameZh: "小学语文",
    nameEn: "Primary Chinese",
    icon: "scroll",
    scopeZh: "一至六年级 (字词积累与表达)",
    scopeEn: "Grades 1-6 (Vocabulary & Expression)",
    descriptionZh: "汉字源流 · 朗读感悟 · 看图写话 · 经典诵读",
    descriptionEn: "Etymology, Reading Aloud, and Creative Expression.",
  },
  {
    id: "primary-english",
    nameZh: "小学英语",
    nameEn: "Primary English",
    icon: "globe",
    scopeZh: "三至六年级 (自然拼读与对话)",
    scopeEn: "Grades 3-6 (Phonics & Dialogue)",
    descriptionZh: "自然拼读 · 场景交际 · 绘本分级 · 韵律语感",
    descriptionEn: "Phonics, Dialogues, and Leveled Readers.",
  },
  {
    id: "primary-science",
    nameZh: "小学科学",
    nameEn: "Primary Science",
    icon: "flask",
    scopeZh: "一至六年级 (微观观察与实验)",
    scopeEn: "Grades 1-6 (Observation & Experiments)",
    descriptionZh: "自然观察 · 动手实验 · 科学猜想 · 探究素养",
    descriptionEn: "Natural Observation, Hands-on Lab, Inquiry Literacy.",
  },
];

// 高中决胜学科
const SENIOR_SUBJECTS: SubjectCardItem[] = [
  {
    id: "senior-math",
    nameZh: "高中数学",
    nameEn: "Senior Math",
    icon: "target",
    scopeZh: "高一至高三 (函数导数与解析几何)",
    scopeEn: "Grades 10-12 (Functions, Calculus, Conic Sections)",
    descriptionZh: "导数单调性 · 极值点偏移 · 圆锥曲线 · 向量空间",
    descriptionEn: "Derivatives, Conic Sections, and Vector Spaces.",
  },
  {
    id: "senior-physics",
    nameZh: "高中物理",
    nameEn: "Senior Physics",
    icon: "bolt",
    scopeZh: "高一至高三 (牛顿力学、电磁场与相对论)",
    scopeEn: "Grades 10-12 (Mechanics, Electromagnetism, Relativity)",
    descriptionZh: "动量动能 · 复合场轨迹 · 电磁感应 · 波动光学",
    descriptionEn: "Momentum, Energy, Electromagnetic Induction.",
  },
  {
    id: "senior-chemistry",
    nameZh: "高中化学",
    nameEn: "Senior Chemistry",
    icon: "flask",
    scopeZh: "高一至高三 (反应原理、物质结构与有机)",
    scopeEn: "Grades 10-12 (Thermodynamics, Structure, Organic)",
    descriptionZh: "化学平衡 · 电化学基础 · 晶胞结构 · 有机合成",
    descriptionEn: "Chemical Equilibrium, Electrochemistry, Synthesis.",
  },
  {
    id: "senior-biology",
    nameZh: "高中生物",
    nameEn: "Senior Biology",
    icon: "sprout",
    scopeZh: "高一至高三 (分子细胞、遗传进化与稳态)",
    scopeEn: "Grades 10-12 (Molecular Biology, Genetics, Homeostasis)",
    descriptionZh: "光合呼吸 · 减数分裂 · 基因工程 · 神经体液",
    descriptionEn: "Cellular Respiration, Meiosis, Genetic Engineering.",
  },
];

/**
 * 全科核心素养门户首页组件 (AllSubjectsPortal)
 * 具备 Phone (<768px), Pad (768px~1024px), Desktop (>1024px) 三级响应式架构
 */
export const AllSubjectsPortal: React.FC = () => {
  const navigate = useNavigate();
  const locale = useSessionStore((state) => state.locale);
  const setLocale = useSessionStore((state) => state.setLocale);

  const { isMobile, isTablet, isDesktop, orientation } = useDeviceResponsive();
  const [selectedStage, setSelectedStage] = useState<"primary" | "junior" | "senior">("junior");

  // 指标卡片数据定义
  const juniorMetrics = [
    { value: "107", label: locale === "en" ? "Four-Stage Lectures" : "考点名师四段论" },
    { value: "12", label: locale === "en" ? "Cross-Term Logic Lines" : "跨学期逻辑主线" },
    { value: "36", label: locale === "en" ? "Dynamic Sandboxes" : "4D动态不变量沙盒" },
    { value: "119", label: locale === "en" ? "Dissected Master Examples" : "全解剖黄金母题" },
  ];

  const primaryMetrics = [
    { value: "48", label: locale === "en" ? "Intuitive Points" : "直观考点精讲" },
    { value: "6", label: locale === "en" ? "Foundational Models" : "启蒙思维模型" },
    { value: "24", label: locale === "en" ? "Tactile Sandboxes" : "具象动手沙盒" },
    { value: "56", label: locale === "en" ? "Inquiry Examples" : "素养探究母题" },
  ];

  const seniorMetrics = [
    { value: "142", label: locale === "en" ? "Gaokao Points" : "高考考点精讲" },
    { value: "18", label: locale === "en" ? "Core Thought Models" : "底层思想模型" },
    { value: "45", label: locale === "en" ? "Dynamic Sandboxes" : "高维动力沙盒" },
    { value: "180", label: locale === "en" ? "Capstone Examples" : "全真压轴母题" },
  ];

  // 响应式指标组件：手机端 2x2 网格，平板与桌面端 4 列横排
  const renderMetricGrid = (metrics: Array<{ value: string; label: string }>) => {
    if (isMobile) {
      return (
        <div
          data-testid="stats-metric-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            background: "var(--bg-card-subtle)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          {metrics.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: "10px 14px",
                borderRight: idx % 2 === 0 ? "1px solid var(--border-subtle)" : "none",
                borderBottom: idx < 2 ? "1px solid var(--border-subtle)" : "none",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "-0.4px",
                  color: "var(--text-primary)",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                {item.value}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  marginTop: "2px",
                  fontWeight: 500,
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // 平板与电脑端：4 列并排
    return (
      <div
        data-testid="stats-metric-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "var(--bg-card-subtle)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          marginBottom: isTablet ? "22px" : "28px",
        }}
      >
        {metrics.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: isTablet ? "10px 12px" : "14px 18px",
              borderRight: idx < 3 ? "1px solid var(--border-subtle)" : "none",
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                fontSize: isTablet ? "19px" : "22px",
                fontWeight: 700,
                letterSpacing: "-0.4px",
                color: "var(--text-primary)",
                display: "block",
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                fontSize: isTablet ? "10px" : "11px",
                color: "var(--text-tertiary)",
                marginTop: "2px",
                fontWeight: 500,
                display: "block",
                whiteSpace: isTablet ? "nowrap" : "normal",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 响应式高斯正态分布数学函数 SVG 插画
  const renderGaussianSvg = (asWatermark: boolean) => {
    const svgInner = (
      <svg
        width={asWatermark ? "100%" : isTablet ? "260" : "360"}
        height={asWatermark ? "100%" : isTablet ? "170" : "220"}
        viewBox="0 0 360 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio={asWatermark ? "xMidYMid meet" : undefined}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="gaussAreaGrad" x1="180" y1="45" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0071e3" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#0071e3" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0071e3" stopOpacity="0.0" />
          </linearGradient>
          <filter id="glowExtremum" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0071e3" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* 坐标系与基准线 */}
        <line x1="30" y1="180" x2="330" y2="180" stroke="#0071e3" strokeOpacity="0.15" strokeWidth="1.5" />
        <line x1="30" y1="130" x2="330" y2="130" stroke="#0071e3" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="30" y1="80" x2="330" y2="80" stroke="#0071e3" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="180" y1="20" x2="180" y2="190" stroke="#0071e3" strokeOpacity="0.15" strokeWidth="1.5" />

        {/* 拐点投影虚线 */}
        <line x1="125" y1="105" x2="125" y2="180" stroke="#0071e3" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1="235" y1="105" x2="235" y2="180" stroke="#0071e3" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />

        {/* 高斯分布曲线面积填充 */}
        <path
          d="M 40 180 C 90 180, 120 110, 150 65 C 165 42, 195 42, 210 65 C 240 110, 270 180, 320 180 Z"
          fill="url(#gaussAreaGrad)"
        />

        {/* 高斯正态分布平滑曲线 */}
        <path
          d="M 40 180 C 90 180, 120 110, 150 65 C 165 42, 195 42, 210 65 C 240 110, 270 180, 320 180"
          stroke="#0071e3"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* 极值点切线 */}
        <line x1="140" y1="50" x2="220" y2="50" stroke="#0071e3" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="4 2" />

        {/* 发光极值点 (180, 50) */}
        <circle cx="180" cy="50" r="14" fill="#0071e3" fillOpacity="0.1" />
        <circle cx="180" cy="50" r="6" fill="#0071e3" fillOpacity="0.35" filter="url(#glowExtremum)" />
        <circle cx="180" cy="50" r="3" fill="#0071e3" />

        {/* 坐标轴刻度与数学标注 */}
        <text x="180" y="34" textAnchor="middle" fill="#0071e3" fontSize="11" fontWeight="600">
          {locale === "en" ? "Max (μ, σ)" : "极大值 (μ, σ)"}
        </text>
        <text x="125" y="196" textAnchor="middle" fill="#86868b" fontSize="10">μ - σ</text>
        <text x="180" y="196" textAnchor="middle" fill="#0071e3" fontSize="10" fontWeight="600">μ</text>
        <text x="235" y="196" textAnchor="middle" fill="#86868b" fontSize="10">μ + σ</text>
      </svg>
    );

    if (asWatermark) {
      return (
        <div
          data-testid="hero-svg-watermark"
          style={{
            position: "absolute",
            right: "-20px",
            bottom: "-15px",
            width: "240px",
            height: "150px",
            opacity: 0.14,
            pointerEvents: "none",
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {svgInner}
        </div>
      );
    }

    return (
      <div
        data-testid="hero-svg-container"
        style={{
          position: "relative",
          width: isTablet ? "260px" : "360px",
          height: isTablet ? "170px" : "220px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: isTablet ? "16px" : "24px",
          zIndex: 1,
        }}
      >
        {svgInner}
      </div>
    );
  };

  // 响应式学科卡片网格组件
  const renderSubjectGrid = (subjects: SubjectCardItem[]) => {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
            ? orientation === "portrait"
              ? "repeat(2, 1fr)"
              : "repeat(3, 1fr)"
            : "repeat(auto-fill, minmax(250px, 1fr))",
          gap: isMobile ? "12px" : "16px",
        }}
      >
        {subjects.map((sub) => (
          <div
            key={sub.id}
            data-testid={`subject-card-${sub.id}`}
            style={{
              background: "#ffffff",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: isMobile ? "14px 16px" : "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: isMobile ? "96px" : "120px",
              boxSizing: "border-box",
              transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = "rgba(0, 113, 227, 0.3)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <Icon name={sub.icon} size={18} />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {locale === "en" ? (sub.nameEn || sub.nameZh) : sub.nameZh}
                </h4>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  background: "var(--bg-card-subtle)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-pill)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {t("portal.comingSoon", locale, "即将推出")}
              </span>
            </div>

            <div>
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "12px",
                  color: "var(--text-tertiary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {locale === "en" ? (sub.scopeEn || sub.scopeZh) : sub.scopeZh}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: isMobile ? 1 : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {locale === "en" ? (sub.descriptionEn || sub.descriptionZh) : sub.descriptionZh}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 三学段切换选项
  const stageOptions = [
    {
      key: "primary",
      label: locale === "en" ? (isMobile ? "Primary (4)" : "Primary (4 Subjects)") : (isMobile ? "小学 (4科)" : "小学教育 (4科)"),
      icon: "book",
    },
    {
      key: "junior",
      label: locale === "en" ? (isMobile ? "Junior (8)" : "Junior (8 Subjects · Flagship)") : (isMobile ? "初中 (8科·首发)" : "初中突破 (8科·首发)"),
      icon: "target",
    },
    {
      key: "senior",
      label: locale === "en" ? (isMobile ? "Senior (8)" : "Senior (8 Subjects)") : (isMobile ? "高中 (8科)" : "高中决胜 (8科)"),
      icon: "star",
    },
  ];

  return (
    <div
      data-testid="all-subjects-portal"
      style={{
        width: "100%",
        maxWidth: "100vw",
        minHeight: "100vh",
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* 背景微光氛围 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          maxWidth: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: isMobile ? "400px" : "800px",
            height: isMobile ? "240px" : "400px",
            top: isMobile ? "-80px" : "-150px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse at center, rgba(0, 113, 227, 0.05) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* 1. 顶栏：系统导航 (System Navigation Anchor - Apple 极简停靠栏) */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          background: "rgba(251, 251, 253, 0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            maxWidth: "1140px",
            margin: "0 auto",
            height: isMobile ? "48px" : "54px",
            padding: isMobile ? "0 12px" : "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          {/* Brand Cluster */}
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "6px" : "10px",
              cursor: "pointer",
              userSelect: "none",
              minWidth: 0,
            }}
          >
            {/* 黑底 App Logo */}
            <div
              style={{
                width: isMobile ? "24px" : "28px",
                height: isMobile ? "24px" : "28px",
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
                width={isMobile ? "13" : "15"}
                height={isMobile ? "13" : "15"}
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

            {/* 大标题与副标题 */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", minWidth: 0 }}>
              <span
                style={{
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: 700,
                  letterSpacing: "-0.2px",
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {t("app.title", locale, "全科核心素养提分系统")}
              </span>
              {!isMobile && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    fontWeight: 400,
                    display: isTablet ? "none" : "inline",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {locale === "en"
                    ? "K-12 Full-Spectrum Core Competency Platform · Precision Elevation · In-depth Inquiry · Master Mindset"
                    : "覆盖小学、初中、高中全学段智能提分平台 · 精准提分 · 深度探究 · 考霸思维"}
                </span>
              )}
            </div>
          </div>

          {/* 右侧辅助操作区 */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px", flexShrink: 0 }}>
            {/* 通知铃铛按钮 */}
            <button
              type="button"
              title={locale === "en" ? "System Announcements & Notifications" : "系统公告与教研通知"}
              style={{
                width: isMobile ? "28px" : "32px",
                height: isMobile ? "28px" : "32px",
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
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <svg
                width={isMobile ? "13" : "15"}
                height={isMobile ? "13" : "15"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  top: isMobile ? "5px" : "7px",
                  right: isMobile ? "5px" : "7px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#ff3b30",
                }}
              />
            </button>

            {/* 语言切换胶囊按钮 */}
            <button
              type="button"
              data-testid="portal-lang-toggle"
              onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
              style={{
                height: isMobile ? "28px" : "32px",
                padding: isMobile ? "0 8px" : "0 12px",
                borderRadius: "var(--radius-pill)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "3px" : "6px",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                whiteSpace: "nowrap",
              }}
            >
              <Icon name="globe" size={isMobile ? 12 : 14} />
              <span>{locale === "en" ? (isMobile ? "EN" : "English") : (isMobile ? "中" : "简体中文")}</span>
              {!isMobile && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>

            {/* 学员身份胶囊 (手机视口隐藏以释放横向空间) */}
            {!isMobile && (
              <div
                style={{
                  height: "32px",
                  padding: "0 12px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--bg-card-subtle)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "default",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{locale === "en" ? "Student Mode · Core Competency Edition" : "默认学员 · 核心素养版 (学员模式)"}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. 主体画布视窗 */}
      <main
        style={{
          width: "100%",
          maxWidth: isDesktop ? "1140px" : "100%",
          margin: isMobile ? "18px auto 48px auto" : isTablet ? "24px auto 60px auto" : "36px auto 80px auto",
          padding: isMobile ? "0 12px" : isTablet ? "0 16px" : "0 20px",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        {/* 三学段分段胶囊 (Stage Segmented Control) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: isMobile ? "22px" : "36px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            data-testid="stage-segmented-control"
            style={{
              position: "relative",
              display: "inline-flex",
              background: "rgba(0, 0, 0, 0.04)",
              padding: isMobile ? "2px" : "3px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid rgba(0, 0, 0, 0.03)",
              gap: isMobile ? "2px" : "2px",
              maxWidth: "100%",
            }}
          >
            {stageOptions.map((item) => {
              const active = selectedStage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  data-testid={`stage-tab-${item.key}`}
                  onClick={() => setSelectedStage(item.key as any)}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "4px" : "7px",
                    padding: isMobile ? "6px 12px" : "7px 22px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    background: active ? "var(--ios-blue)" : "transparent",
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    fontWeight: active ? 600 : 500,
                    fontSize: isMobile ? "12px" : "13px",
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 4px 14px var(--ios-blue-glow), 0 2px 6px rgba(0, 113, 227, 0.2)"
                      : "none",
                    transition: "all 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={isMobile ? 12 : 14}
                    style={{ stroke: active ? "#ffffff" : "currentColor" }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================== STAGE 2: 初中突破专区 (默认展示) ==================== */}
        {selectedStage === "junior" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* 初中数学旗舰 Hero 大卡 */}
            <section
              data-testid="junior-math-flagship-card"
              onClick={() => navigate("/math-junior")}
              style={{
                position: "relative",
                background: "#ffffff",
                border: "1px solid var(--border-subtle)",
                borderRadius: isMobile ? "var(--radius-md, 14px)" : "var(--radius-lg, 20px)",
                padding: isMobile ? "20px 16px" : isTablet ? "28px 28px" : "36px 40px",
                marginBottom: isMobile ? "28px" : isTablet ? "36px" : "48px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "stretch" : "center",
                transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 36px rgba(0, 0, 0, 0.06)";
                  e.currentTarget.style.borderColor = "rgba(0, 113, 227, 0.25)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.03)";
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }
              }}
            >
              {/* 手机端半透明 SVG 数学水印背景 */}
              {isMobile && renderGaussianSvg(true)}

              {/* 左侧主体内容区 */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  maxWidth: isMobile ? "100%" : isTablet ? "560px" : "660px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                {/* 呼吸灯与学段元数据行 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 10px",
                      background: "rgba(52, 199, 89, 0.08)",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#248a3d",
                      letterSpacing: "-0.1px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#34c759",
                        display: "inline-block",
                      }}
                    />
                    <span>{locale === "en" ? "Ready · Click to Enter" : "已全量就绪 · 点击进入"}</span>
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--ios-blue)",
                      fontWeight: 500,
                      letterSpacing: "-0.1px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {locale === "en" ? "Grades 7-9 Full Scope" : "7~9年级全学段"}
                  </span>
                </div>

                {/* 主标题与工坊标识 */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: isMobile ? "20px" : isTablet ? "24px" : "28px",
                      fontWeight: 700,
                      letterSpacing: "-0.5px",
                      color: "var(--text-primary)",
                      lineHeight: 1.3,
                    }}
                  >
                    {locale === "en" ? "Junior Math Core Competency Elevation System" : "初中数学核心素养提分系统"}
                  </h2>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--ios-blue)",
                      background: "var(--ios-blue-tint)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-pill)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {locale === "en" ? "Junior Math Workshop" : "初中数学核心素养工坊"}
                  </span>
                </div>

                {/* 核心价值文案 */}
                <p
                  style={{
                    margin: isMobile ? "0 0 16px 0" : "0 0 24px 0",
                    fontSize: isMobile ? "13px" : "14px",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                  }}
                >
                  {locale === "en"
                    ? "Completely break rote memorization! Exclusive 107 syllabus point four-stage lectures, 12 underlying logic lines, 36 exam-winning 4D dynamic sandboxes, and dual-column real mock exam workbench."
                    : "彻底打破死记硬背！独家构建 107 大纲考点四段论、12 底层数学主线思维图谱、36 中考压轴跃迁动力学沙盒、以及双栏印刷全真模考系统。"}
                </p>

                {/* 四大核心指标网格 (手机 2x2, 平板/电脑 4 列) */}
                {renderMetricGrid(juniorMetrics)}

                {/* 蓝色主操作 CTA 按钮 */}
                <div style={{ width: isMobile ? "100%" : "auto" }}>
                  <button
                    type="button"
                    data-testid="enter-math-junior-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/math-junior");
                    }}
                    style={{
                      display: isMobile ? "flex" : "inline-flex",
                      justifyContent: isMobile ? "center" : "flex-start",
                      alignItems: "center",
                      gap: "8px",
                      width: isMobile ? "100%" : "auto",
                      height: isMobile ? "46px" : "auto",
                      padding: isMobile ? "0 20px" : "10px 24px",
                      background: "var(--ios-blue)",
                      color: "#ffffff",
                      fontSize: isMobile ? "14px" : "13px",
                      fontWeight: 600,
                      borderRadius: "var(--radius-pill)",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px var(--ios-blue-glow)",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#0077ed";
                      e.currentTarget.style.transform = isMobile ? "none" : "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 14px var(--ios-blue-glow)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--ios-blue)";
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 2px 8px var(--ios-blue-glow)";
                    }}
                  >
                    <span>{t("portal.math.enter", locale, "进入初中数学工坊")}</span>
                    <span style={{ fontSize: "14px" }}>→</span>
                  </button>
                </div>
              </div>

              {/* 平板与桌面端右侧自研纯正 SVG 高斯函数曲线插画 */}
              {!isMobile && renderGaussianSvg(false)}
            </section>

            {/* 下方 7 学科矩阵 */}
            <section style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? "4px" : "0",
                  marginBottom: "16px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                    letterSpacing: "-0.2px",
                    color: "var(--text-primary)",
                  }}
                >
                  {locale === "en" ? "Other Junior Subjects (Coming Soon)" : "初中其他学科 (全科母版筹备中)"}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  {locale === "en"
                    ? "Physics, Chemistry, Biology etc. are being integrated"
                    : "物理、化学、生物、语文、英语等学科正在按照同构标准有序接入"}
                </span>
              </div>

              {renderSubjectGrid(JUNIOR_OTHER_SUBJECTS)}
            </section>
          </div>
        )}

        {/* ==================== STAGE 1: 小学教育专区 ==================== */}
        {selectedStage === "primary" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <section
              style={{
                position: "relative",
                background: "#ffffff",
                border: "1px solid var(--border-subtle)",
                borderRadius: isMobile ? "var(--radius-md, 14px)" : "var(--radius-lg, 20px)",
                padding: isMobile ? "20px 16px" : isTablet ? "28px 28px" : "36px 40px",
                marginBottom: isMobile ? "28px" : isTablet ? "36px" : "48px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                overflow: "hidden",
                cursor: "default",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "stretch" : "center",
                boxSizing: "border-box",
              }}
            >
              <div style={{ maxWidth: isMobile ? "100%" : isTablet ? "560px" : "660px", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 10px",
                      background: "rgba(0, 0, 0, 0.04)",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>{locale === "en" ? "● In Development · Grades 1-6" : "● 筹备中 · 1~6年级全学段"}</span>
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--ios-blue)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {locale === "en" ? "Number Sense & Geometric Intuition" : "数感与几何直观系统"}
                  </span>
                </div>

                <h2
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: isMobile ? "20px" : isTablet ? "24px" : "28px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  {locale === "en" ? "Primary Core Competency: Number Sense & Geometric Intuition" : "小学核心素养数感与几何直观系统"}
                </h2>
                <p
                  style={{
                    margin: isMobile ? "0 0 16px 0" : "0 0 24px 0",
                    fontSize: isMobile ? "13px" : "14px",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                  }}
                >
                  {locale === "en"
                    ? "Inspire children to fall in love with mathematics through concrete figures and hands-on inquiry! 48 visual concept lectures, 6 foundational models, 24 tactile sandboxes, 56 master examples."
                    : "让孩子在具象图形与动手探究中真正爱上数学！独家构建 48 核心素养直观图谱、6 大启蒙思维模型、24 具象互动沙盒与 56 黄金母题。"}
                </p>

                {renderMetricGrid(primaryMetrics)}

                <button
                  type="button"
                  style={{
                    width: isMobile ? "100%" : "auto",
                    height: isMobile ? "46px" : "auto",
                    padding: isMobile ? "0 20px" : "10px 24px",
                    background: "#e5e5ea",
                    color: "var(--text-tertiary)",
                    fontSize: isMobile ? "14px" : "13px",
                    fontWeight: 600,
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "default",
                    display: isMobile ? "flex" : "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {locale === "en" ? "Under Construction · Coming Soon" : "建设中 · 敬请期待"}
                </button>
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? "4px" : "0",
                  marginBottom: "16px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {locale === "en" ? "Primary Foundation Matrix" : "小学启蒙学科矩阵"}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  {locale === "en" ? "Systematic integration under isomorphic standards" : "按照同构标准有序接入"}
                </span>
              </div>

              {renderSubjectGrid(PRIMARY_SUBJECTS)}
            </section>
          </div>
        )}

        {/* ==================== STAGE 3: 高中决胜专区 ==================== */}
        {selectedStage === "senior" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <section
              style={{
                position: "relative",
                background: "#ffffff",
                border: "1px solid var(--border-subtle)",
                borderRadius: isMobile ? "var(--radius-md, 14px)" : "var(--radius-lg, 20px)",
                padding: isMobile ? "20px 16px" : isTablet ? "28px 28px" : "36px 40px",
                marginBottom: isMobile ? "28px" : isTablet ? "36px" : "48px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                overflow: "hidden",
                cursor: "default",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "stretch" : "center",
                boxSizing: "border-box",
              }}
            >
              <div style={{ maxWidth: isMobile ? "100%" : isTablet ? "560px" : "660px", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 10px",
                      background: "rgba(0, 0, 0, 0.04)",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>{locale === "en" ? "● In Development · Grades 10-12" : "● 筹备中 · 高一至高三全学段"}</span>
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--ios-blue)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {locale === "en" ? "Advanced Modeling & Capstone Breakthrough" : "高阶建模与压轴突破"}
                  </span>
                </div>

                <h2
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: isMobile ? "20px" : isTablet ? "24px" : "28px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  {locale === "en" ? "Senior Math Advanced Modeling & Capstone Breakthrough" : "高中数学高阶建模与压轴突破系统"}
                </h2>
                <p
                  style={{
                    margin: isMobile ? "0 0 16px 0" : "0 0 24px 0",
                    fontSize: isMobile ? "13px" : "14px",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                  }}
                >
                  {locale === "en"
                    ? "Precision breakthrough in Gaokao capstone problems! 142 concept lectures, 18 core thought models, 45 high-dimensional dynamic sandboxes, 180 capstone master examples."
                    : "精准突破高考压轴难题！独家构建 142 考点四段论、18 底层数学思想模型（数形结合、分类讨论、化归转化）、45 高维动力学沙盒与 180 压轴母题。"}
                </p>

                {renderMetricGrid(seniorMetrics)}

                <button
                  type="button"
                  style={{
                    width: isMobile ? "100%" : "auto",
                    height: isMobile ? "46px" : "auto",
                    padding: isMobile ? "0 20px" : "10px 24px",
                    background: "#e5e5ea",
                    color: "var(--text-tertiary)",
                    fontSize: isMobile ? "14px" : "13px",
                    fontWeight: 600,
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "default",
                    display: isMobile ? "flex" : "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {locale === "en" ? "Under Construction · Coming Soon" : "建设中 · 敬请期待"}
                </button>
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? "4px" : "0",
                  marginBottom: "16px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {locale === "en" ? "Senior Capstone Matrix" : "高中决胜学科矩阵"}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  {locale === "en" ? "Systematic integration under isomorphic standards" : "按照同构标准有序接入"}
                </span>
              </div>

              {renderSubjectGrid(SENIOR_SUBJECTS)}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AllSubjectsPortal;
