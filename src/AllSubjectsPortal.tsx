import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "./store/sessionStore";
import { t } from "./engine/i18n/i18n";
import { Icon } from "./components/common/Icon";

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
 * 100% 对标 Demo 图 3 (ios27_demo.html 原型视觉)
 */
export const AllSubjectsPortal: React.FC = () => {
  const navigate = useNavigate();
  const locale = useSessionStore((state) => state.locale);
  const setLocale = useSessionStore((state) => state.setLocale);

  const [selectedStage, setSelectedStage] = useState<"primary" | "junior" | "senior">("junior");

  return (
    <div
      data-testid="all-subjects-portal"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* 背景微光氛围 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "800px",
            height: "400px",
            top: "-150px",
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
            height: "54px",
            padding: "0 20px",
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
              gap: "10px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {/* 黑底 App Logo */}
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

            {/* 大标题与副标题 */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "-0.2px",
                  color: "var(--text-primary)",
                }}
              >
                {t("app.title", locale, "全科核心素养提分系统")}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  fontWeight: 400,
                }}
              >
                覆盖小学、初中、高中全学段智能提分平台 · 精准提分 · 深度探究 · 考霸思维
              </span>
            </div>
          </div>

          {/* 右侧辅助操作区 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* 通知铃铛按钮 */}
            <button
              type="button"
              title="系统公告与教研通知"
              style={{
                width: "32px",
                height: "32px",
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
                width="15"
                height="15"
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
                  top: "7px",
                  right: "7px",
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
                height: "32px",
                padding: "0 12px",
                borderRadius: "var(--radius-pill)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <Icon name="globe" size={14} />
              <span>{locale === "en" ? "English" : "简体中文"}</span>
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
            </button>

            {/* 学员身份胶囊 (包含学员模式) */}
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
              <span>默认学员 · 核心素养版 (学员模式)</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. 主体画布视窗 */}
      <main
        style={{
          width: "100%",
          maxWidth: "1140px",
          margin: "36px auto 80px auto",
          padding: "0 20px",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        {/* 三学段分段胶囊 (Stage Segmented Control - 选中态加蓝/发光高亮) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "36px",
          }}
        >
          <div
            data-testid="stage-segmented-control"
            style={{
              position: "relative",
              display: "inline-flex",
              background: "rgba(0, 0, 0, 0.04)",
              padding: "3px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid rgba(0, 0, 0, 0.03)",
              gap: "2px",
            }}
          >
            {[
              { key: "primary", label: "小学教育 (4科)", icon: "book" },
              { key: "junior", label: "初中突破 (8科·首发)", icon: "target" },
              { key: "senior", label: "高中决胜 (8科)", icon: "star" },
            ].map((item) => {
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
                    gap: "7px",
                    padding: "7px 22px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    background: active ? "var(--ios-blue)" : "transparent",
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    fontWeight: active ? 600 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 4px 14px var(--ios-blue-glow), 0 2px 6px rgba(0, 113, 227, 0.2)"
                      : "none",
                    transition: "all 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={14}
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
            {/* 初中数学旗舰 Hero 大卡 (Apple Keynote 展示卡) */}
            <section
              data-testid="junior-math-flagship-card"
              onClick={() => navigate("/math-junior")}
              style={{
                position: "relative",
                background: "#ffffff",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "36px 40px",
                marginBottom: "48px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 36px rgba(0, 0, 0, 0.06)";
                e.currentTarget.style.borderColor = "rgba(0, 113, 227, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.03)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              {/* 左侧主体内容区 */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  maxWidth: "660px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* 呼吸灯与学段元数据行 */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
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
                    <span>已全量就绪 · 点击进入</span>
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--ios-blue)",
                      fontWeight: 500,
                      letterSpacing: "-0.1px",
                    }}
                  >
                    7~9年级全学段
                  </span>
                </div>

                {/* 主标题与工坊标识 */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "28px",
                      fontWeight: 700,
                      letterSpacing: "-0.6px",
                      color: "var(--text-primary)",
                      lineHeight: 1.25,
                    }}
                  >
                    初中数学核心素养提分系统
                  </h2>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--ios-blue)",
                      background: "var(--ios-blue-tint)",
                      padding: "3px 10px",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    初中数学核心素养工坊
                  </span>
                </div>

                {/* 核心价值文案 */}
                <p
                  style={{
                    margin: "0 0 28px 0",
                    fontSize: "14px",
                    lineHeight: 1.65,
                    color: "var(--text-secondary)",
                  }}
                >
                  彻底打破死记硬背！独家构建 107 大纲考点四段论、12 底层数学主线思维图谱、36 中考压轴跃迁动力学沙盒、以及双栏印刷全真模考系统。
                </p>

                {/* 四大核心指标横排统计条 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    background: "var(--bg-card-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    marginBottom: "28px",
                  }}
                >
                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        letterSpacing: "-0.4px",
                        color: "var(--text-primary)",
                        display: "block",
                      }}
                    >
                      107
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px", fontWeight: 500, display: "block" }}>
                      考点名师四段论
                    </span>
                  </div>

                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        letterSpacing: "-0.4px",
                        color: "var(--text-primary)",
                        display: "block",
                      }}
                    >
                      12
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px", fontWeight: 500, display: "block" }}>
                      跨学期逻辑主线
                    </span>
                  </div>

                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        letterSpacing: "-0.4px",
                        color: "var(--text-primary)",
                        display: "block",
                      }}
                    >
                      36
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px", fontWeight: 500, display: "block" }}>
                      思维跃迁 4D 沙盒
                    </span>
                  </div>

                  <div style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        letterSpacing: "-0.4px",
                        color: "var(--text-primary)",
                        display: "block",
                      }}
                    >
                      119
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px", fontWeight: 500, display: "block" }}>
                      全解剖黄金母题
                    </span>
                  </div>
                </div>

                {/* 蓝色主按钮 */}
                <div>
                  <button
                    type="button"
                    data-testid="enter-math-junior-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/math-junior");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 24px",
                      background: "var(--ios-blue)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 600,
                      borderRadius: "var(--radius-pill)",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px var(--ios-blue-glow)",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#0077ed";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 14px var(--ios-blue-glow)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--ios-blue)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px var(--ios-blue-glow)";
                    }}
                  >
                    <span>进入初中数学工坊</span>
                    <span style={{ fontSize: "13px" }}>→</span>
                  </button>
                </div>
              </div>

              {/* 右侧自研纯正 SVG 数学函数曲线插画（高斯正态分布曲线与发光极值点） */}
              <div
                style={{
                  position: "relative",
                  width: "360px",
                  height: "220px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="360"
                  height="220"
                  viewBox="0 0 360 220"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
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
                  <text x="180" y="34" textAnchor="middle" fill="#0071e3" fontSize="11" fontWeight="600">极大值 (μ, σ)</text>
                  <text x="125" y="196" textAnchor="middle" fill="#86868b" fontSize="10">μ - σ</text>
                  <text x="180" y="196" textAnchor="middle" fill="#0071e3" fontSize="10" fontWeight="600">μ</text>
                  <text x="235" y="196" textAnchor="middle" fill="#86868b" fontSize="10">μ + σ</text>
                </svg>
              </div>
            </section>

            {/* 下方 7 学科矩阵 (带“即将推出”标签) */}
            <section style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "18px",
                  paddingBottom: "10px",
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
                  初中其他学科 (全科母版筹备中)
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  物理、化学、生物、语文、英语等学科正在按照同构标准有序接入
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "16px",
                }}
              >
                {JUNIOR_OTHER_SUBJECTS.map((sub) => (
                  <div
                    key={sub.id}
                    data-testid={`subject-card-${sub.id}`}
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "120px",
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                          <Icon name={sub.icon} size={18} />
                        </span>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {locale === "en" ? sub.nameEn : sub.nameZh}
                        </h4>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-tertiary)",
                          fontWeight: 400,
                          background: "var(--bg-card-subtle)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-pill)",
                        }}
                      >
                        {t("portal.comingSoon", locale, "即将推出")}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                      {locale === "en" ? sub.scopeEn : sub.scopeZh}
                    </p>
                  </div>
                ))}
              </div>
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
                borderRadius: "var(--radius-lg)",
                padding: "36px 40px",
                marginBottom: "48px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                overflow: "hidden",
                cursor: "default",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ maxWidth: "660px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
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
                    }}
                  >
                    <span>● 筹备中 · 1~6年级全学段</span>
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--ios-blue)", fontWeight: 500 }}>
                    数感与几何直观系统
                  </span>
                </div>

                <h2 style={{ margin: "0 0 10px 0", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                  小学核心素养数感与几何直观系统
                </h2>
                <p style={{ margin: "0 0 28px 0", fontSize: "14px", lineHeight: 1.65, color: "var(--text-secondary)" }}>
                  让孩子在具象图形与动手探究中真正爱上数学！独家构建 48 核心素养直观图谱、6 大启蒙思维模型、24 具象互动沙盒与 56 黄金母题。
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    background: "var(--bg-card-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    marginBottom: "28px",
                  }}
                >
                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>48</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>直观考点精讲</span>
                  </div>
                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>6</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>启蒙思维模型</span>
                  </div>
                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>24</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>具象动手沙盒</span>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>56</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>素养探究母题</span>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    padding: "10px 24px",
                    background: "#e5e5ea",
                    color: "var(--text-tertiary)",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "default",
                  }}
                >
                  建设中 · 敬请期待
                </button>
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>小学启蒙学科矩阵</h3>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>按照同构标准有序接入</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {PRIMARY_SUBJECTS.map((sub) => (
                  <div key={sub.id} style={{ background: "#ffffff", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "18px 20px", height: "120px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name={sub.icon} size={18} />
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{sub.nameZh}</h4>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)", background: "var(--bg-card-subtle)", padding: "2px 8px", borderRadius: "var(--radius-pill)" }}>即将推出</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>{sub.scopeZh}</p>
                  </div>
                ))}
              </div>
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
                borderRadius: "var(--radius-lg)",
                padding: "36px 40px",
                marginBottom: "48px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                overflow: "hidden",
                cursor: "default",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ maxWidth: "660px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
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
                    }}
                  >
                    <span>● 筹备中 · 高一至高三全学段</span>
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--ios-blue)", fontWeight: 500 }}>
                    高阶建模与压轴突破
                  </span>
                </div>

                <h2 style={{ margin: "0 0 10px 0", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                  高中数学高阶建模与压轴突破系统
                </h2>
                <p style={{ margin: "0 0 28px 0", fontSize: "14px", lineHeight: 1.65, color: "var(--text-secondary)" }}>
                  精准突破高考压轴难题！独家构建 142 考点四段论、18 底层数学思想模型（数形结合、分类讨论、化归转化）、45 高维动力学沙盒与 180 压轴母题。
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    background: "var(--bg-card-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    marginBottom: "28px",
                  }}
                >
                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>142</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>高考考点精讲</span>
                  </div>
                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>18</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>底层思想模型</span>
                  </div>
                  <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>45</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>高维动力沙盒</span>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>180</span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>全真压轴母题</span>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    padding: "10px 24px",
                    background: "#e5e5ea",
                    color: "var(--text-tertiary)",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "default",
                  }}
                >
                  建设中 · 敬请期待
                </button>
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>高中决胜学科矩阵</h3>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>按照同构标准有序接入</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {SENIOR_SUBJECTS.map((sub) => (
                  <div key={sub.id} style={{ background: "#ffffff", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "18px 20px", height: "120px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon name={sub.icon} size={18} />
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{sub.nameZh}</h4>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)", background: "var(--bg-card-subtle)", padding: "2px 8px", borderRadius: "var(--radius-pill)" }}>即将推出</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-tertiary)" }}>{sub.scopeZh}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AllSubjectsPortal;
