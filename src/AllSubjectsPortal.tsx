import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "./store/sessionStore";
import { t } from "./engine/i18n/i18n";
import { Icon } from "./components/common/Icon";

interface OtherSubjectCard {
  id: string;
  nameZh: string;
  nameEn: string;
  icon: string;
  descriptionZh: string;
  descriptionEn: string;
}

const OTHER_SUBJECTS: OtherSubjectCard[] = [
  {
    id: "physics",
    nameZh: "初中物理",
    nameEn: "Junior Physics",
    icon: "bolt",
    descriptionZh: "力学模型 · 电路仿真 · 光学实验 · 能量守恒",
    descriptionEn: "Mechanics, Circuits, Optics, and Energy Conservation.",
  },
  {
    id: "chemistry",
    nameZh: "初中化学",
    nameEn: "Junior Chemistry",
    icon: "flask",
    descriptionZh: "微观粒子 · 溶液酸碱 · 质量守恒 · 物质推断",
    descriptionEn: "Microscopic Particles, Acids & Bases, Conservation of Mass.",
  },
  {
    id: "biology",
    nameZh: "初中生物",
    nameEn: "Junior Biology",
    icon: "sprout",
    descriptionZh: "细胞结构 · 遗传变异 · 生态平衡 · 实验探究",
    descriptionEn: "Cell Structure, Genetics, Ecology, and Lab Inquiry.",
  },
  {
    id: "chinese",
    nameZh: "初中语文",
    nameEn: "Junior Chinese",
    icon: "scroll",
    descriptionZh: "文言文精析 · 现代文阅读 · 作文升格 · 素养积累",
    descriptionEn: "Classical Chinese, Reading Comprehension, and Writing.",
  },
  {
    id: "english",
    nameZh: "初中英语",
    nameEn: "Junior English",
    icon: "globe",
    descriptionZh: "语法句式 · 完形填空 · 语法填空 · 考点冲刺",
    descriptionEn: "Grammar, Cloze Test, Reading & Writing Mastery.",
  },
  {
    id: "history",
    nameZh: "初中历史",
    nameEn: "Junior History",
    icon: "book",
    descriptionZh: "时空观念 · 史料实证 · 唯物史观 · 历史解释",
    descriptionEn: "Time & Space, Historical Evidence, and Materialism.",
  },
  {
    id: "geography",
    nameZh: "初中地理",
    nameEn: "Junior Geography",
    icon: "compass",
    descriptionZh: "经纬等高 · 区域认知 · 人地协调 · 综合思维",
    descriptionEn: "Coordinates, Regional Cognition, and Human-Nature Harmony.",
  },
];

/**
 * 全科门户视窗组件 (任务 20.1, 设计文档 §12.3)
 * 具备顶栏、三学段切换器、初中数学旗舰卡与其余7科即将推出卡片
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
        padding: "1.5rem 2rem 3rem 2rem",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* 1. 顶栏：品牌 Logo + 通知 + 语言切换 + 学员胶囊 */}
      <header
        style={{
          width: "100%",
          maxWidth: "1280px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          background: "var(--glass-bg-elevated)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--glass-shadow)",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--ios-blue) 0%, var(--ios-indigo) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.4rem",
              fontWeight: 800,
              boxShadow: "0 4px 14px var(--ios-blue-glow)",
            }}
          >
            Σ
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {t("app.title", locale, "全科核心素养提分系统")}
            </h1>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              {t("portal.subtitle", locale, "精准提分 · 深度探究 · 考霸思维")}
            </p>
          </div>
        </div>

        {/* 辅助操作区 */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* 通知胶囊 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.8rem",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--ios-green)" }} />
            <span>系统运转正常</span>
          </div>

          {/* 学员状态胶囊 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "var(--radius-pill)",
              background: "var(--ios-blue-glow)",
              color: "var(--ios-blue)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <Icon name="graduation-cap" size={14} />
            <span>{t("portal.learner", locale, "初三学员模式")}</span>
          </div>

          {/* 语言切换器 */}
          <button
            type="button"
            data-testid="portal-lang-toggle"
            onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
            style={{
              padding: "0.42rem 0.9rem",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "all 0.2s ease",
            }}
          >
            <Icon name="globe" size={14} />
            <span>{locale === "zh-CN" ? "English" : "中文"}</span>
          </button>
        </div>
      </header>

      {/* 2. 学段分段切换器 */}
      <div
        data-testid="stage-segmented-control"
        style={{
          display: "inline-flex",
          background: "var(--glass-bg-elevated)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "0.35rem",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--glass-shadow)",
          marginBottom: "2rem",
        }}
      >
        {[
          { key: "primary", labelZh: "小学教育", labelEn: "Primary Education", badge: null },
          { key: "junior", labelZh: "初中突破", labelEn: "Junior Breakthrough", badge: "首发" },
          { key: "senior", labelZh: "高中决胜", labelEn: "Senior Mastery", badge: null },
        ].map((item) => {
          const active = selectedStage === item.key;
          return (
            <button
              key={item.key}
              type="button"
              data-testid={`stage-tab-${item.key}`}
              onClick={() => setSelectedStage(item.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.4rem",
                borderRadius: "var(--radius-pill)",
                border: "none",
                background: active ? "var(--ios-blue)" : "transparent",
                color: active ? "white" : "var(--text-secondary)",
                fontWeight: active ? 700 : 500,
                fontSize: "0.92rem",
                cursor: "pointer",
                boxShadow: active ? "0 4px 12px var(--ios-blue-glow)" : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span>{locale === "en" ? item.labelEn : item.labelZh}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "10px",
                    background: active ? "white" : "var(--ios-blue)",
                    color: active ? "var(--ios-blue)" : "white",
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. 核心内容区 */}
      <main style={{ width: "100%", maxWidth: "1280px", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* 初中数学旗舰卡片 */}
        <section
          data-testid="junior-math-flagship-card"
          style={{
            background: "linear-gradient(135deg, var(--glass-bg-elevated) 0%, var(--bg-card) 100%)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--ios-blue)",
            padding: "2.5rem",
            boxShadow: "0 12px 36px var(--ios-blue-glow)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ maxWidth: "720px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-sm)", background: "var(--ios-blue)", color: "white", fontWeight: 700 }}>
                  旗舰首发
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  初中学段 · 数学学科 V2.0
                </span>
              </div>
              <h2 style={{ margin: "0 0 0.75rem 0", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {t("portal.math.title", locale, "初中数学核心素养工坊")}
              </h2>
              <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
                {t("portal.math.desc", locale, "覆盖6学期大纲考点与中考压轴模型，双向思维图谱穿透，声明式物理沙盒，考完即焚实战测评。")}
              </p>
            </div>

            {/* 进入工坊按钮 */}
            <button
              type="button"
              data-testid="enter-math-junior-btn"
              onClick={() => navigate("/math-junior")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.9rem 2rem",
                borderRadius: "var(--radius-pill)",
                border: "none",
                background: "var(--ios-blue)",
                color: "white",
                fontSize: "1.05rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px var(--ios-blue-glow)",
                transition: "transform 0.18s ease, box-shadow 0.18s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>{t("portal.math.enter", locale, "进入初中数学工坊")}</span>
              <span style={{ fontSize: "1.2rem" }}>→</span>
            </button>
          </div>

          {/* 4 大核心指标展台 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.25rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {[
              { num: "107", label: t("portal.stat.points", locale, "大纲考点"), desc: "覆盖中考 6 学期全知识网格", icon: "ruler" },
              { num: "12", label: t("portal.stat.lines", locale, "逻辑主线"), desc: "代数 A 系与几何 G 系螺旋演化", icon: "graph" },
              { num: "36", label: t("portal.stat.sandboxes", locale, "探究沙盒"), desc: "声明式几何动力学物理画布", icon: "flask" },
              { num: "119", label: t("portal.stat.masters", locale, "经典母题"), desc: "四维解析体系与严谨推导证明", icon: "trophy" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--ios-blue)" }}>
                    {stat.num}
                  </span>
                  <Icon name={stat.icon} size={22} style={{ color: "var(--ios-blue)" }} />
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 其余 7 学科矩阵 (即将推出) */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Icon name="book" size={20} />
              <span>全科核心素养矩阵</span>
            </h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              中高考各科核心素养工程化落地进行中
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {OTHER_SUBJECTS.map((sub) => (
              <div
                key={sub.id}
                data-testid={`subject-card-${sub.id}`}
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "150px",
                  transition: "all 0.2s ease",
                  opacity: 0.85,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Icon name={sub.icon} size={22} style={{ color: "var(--ios-blue)" }} />
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {locale === "en" ? sub.nameEn : sub.nameZh}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "var(--radius-pill)",
                        background: "var(--bg-card-hover)",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {t("portal.comingSoon", locale, "即将推出")}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.5, color: "var(--text-secondary)" }}>
                    {locale === "en" ? sub.descriptionEn : sub.descriptionZh}
                  </p>
                </div>

                <div style={{ marginTop: "1rem", fontSize: "0.76rem", color: "var(--text-tertiary)", fontWeight: 500 }}>
                  基于理科考霸思维认知模型构建
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AllSubjectsPortal;
