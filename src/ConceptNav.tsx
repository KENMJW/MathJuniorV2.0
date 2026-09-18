import React, { useState, useMemo } from "react";
import { KnowledgePointRecord } from "./modules/concept/types";
import { mockKnowledgePointRecords } from "./modules/concept/mockPoints";
import { ConceptFourStages } from "./modules/concept/ConceptFourStages";
import { LinkedSandboxSlot } from "./modules/concept/LinkedSandboxSlot";
import { PointMasterExample, MasterExampleItem } from "./modules/concept/PointMasterExample";
import { QuickPractice } from "./modules/concept/QuickPractice";
import { pythagoreanConfig, handInHandConfig, quadraticVerticalHeightConfig, apolloniusConfig } from "./modules/sandbox/configs";
import { SandboxConfig } from "./modules/sandbox/SandboxRenderer";
import { QuickPracticeQuestion } from "./modules/concept/quickPractice.machine";
import { t } from "./engine/i18n/i18n";
import { useSessionStore } from "./store/sessionStore";
import { Icon } from "./components/common/Icon";

export interface ConceptNavProps {
  knowledgePoints?: KnowledgePointRecord[];
  initialPointId?: string;
  onSelectPoint?: (point: KnowledgePointRecord) => void;
  className?: string;
}

// 辅助函数：根据知识考点获取沙盒配置
function getSandboxConfigForPoint(sandboxId?: string | null): SandboxConfig | null {
  if (!sandboxId) return null;
  if (sandboxId === "SB-KP023") return pythagoreanConfig;
  if (sandboxId === "SB-HAND-IN-HAND") return handInHandConfig;
  if (sandboxId === "SB-QUADRATIC-VERTICAL-HEIGHT") return quadraticVerticalHeightConfig;
  if (sandboxId === "SB-APOLLONIUS-CIRCLE") return apolloniusConfig;
  return null;
}

// 辅助函数：为考点生成标准母题
function getMasterExampleForPoint(point: KnowledgePointRecord): MasterExampleItem {
  if (point.point_id === "KP-023") {
    return {
      example_id: "ME-KP023",
      example_type: "point_master",
      bound_target_id: "KP-023",
      source: "中考经典真题题眼模型",
      stem_zh: "在 $\\text{Rt}\\triangle ABC$ 中，$\\angle C = 90^\\circ$，$a=3, b=4$，求斜边 $c$ 及斜边上的高 $h$。",
      stem_en: "In $\\text{Rt}\\triangle ABC$ with $\\angle C = 90^\\circ, a=3, b=4$, find hypotenuse $c$ and altitude $h$.",
      dim1_origin: "源自古代测量中直角三角形面积与斜边投影的比例需求。",
      dim2_essence: "勾股定理结合等面积法：$S = \\frac{1}{2}ab = \\frac{1}{2}ch$。",
      dim3_rigor: "由勾股定理 $c = \\sqrt{a^2 + b^2} = \\sqrt{3^2 + 4^2} = 5$；由面积恒等式 $ab = ch$ 得 $h = \\frac{3 \\times 4}{5} = 2.4$。",
      dim4_traps: "警惕未指明直角边与斜边时可能产生的双解情况。",
      available_dimensions: 4,
    };
  }

  return {
    example_id: point.master_example_id || `ME-${point.point_id}`,
    example_type: "point_master",
    bound_target_id: point.point_id,
    source: `${point.name_zh} · 中考母题精解`,
    stem_zh: `已知关于【${point.name_zh}】的典型数学应用：试运用相关公理与定理进行严格推导求解。`,
    stem_en: `Standard master example on ${point.name_en}.`,
    dim1_origin: point.origin_story_zh,
    dim2_essence: point.intuitive_essence_zh,
    dim3_rigor: point.formal_definition_zh || "由相关公理体系与定义严格可得。",
    dim4_traps: point.intrinsic_variation_zh || "注意临界边界与反例检验。",
    available_dimensions: 4,
  };
}

// 辅助函数：根据考点生成练习题
function getPracticeQuestionsForPoint(point: KnowledgePointRecord): QuickPracticeQuestion[] {
  return [
    {
      question_id: `Q-${point.point_id}-01`,
      primary_point_id: point.point_id,
      difficulty_level: 1,
      question_type: "single_choice",
      score_default: 3,
      stem_zh: `关于【${point.name_zh}】的基础性质，下列说法正确的是（ ）`,
      stem_en: `Regarding ${point.name_en}, which statement is correct? ( )`,
      options: [
        { key: "A", text_zh: point.formal_definition_zh.slice(0, 35) || "符合公理体系定义", text_en: "Consistent with formal axiom" },
        { key: "B", text_zh: "在任何非欧几何体系下均无需条件成立", text_en: "Always true without constraints" },
        { key: "C", text_zh: "其逆命题在任何实数范围内恒不成立", text_en: "Converse is always invalid" },
        { key: "D", text_zh: "以上表述均不符合大纲规范", text_en: "None of the above" },
      ],
      answer_standard: "A",
      solutions_json: `直接依据【${point.name_zh}】的法典严定即可判定 A 正确。`,
    },
    {
      question_id: `Q-${point.point_id}-02`,
      primary_point_id: point.point_id,
      difficulty_level: 2,
      question_type: "single_choice",
      score_default: 3,
      stem_zh: `已知在相关问题中满足【${point.name_zh}】的前置条件，则下列推断必然正确的是（ ）`,
      stem_en: `Given preconditions for ${point.name_en}, which deduction holds?`,
      options: [
        { key: "A", text_zh: "存在反例使得条件与结论互相矛盾", text_en: "Contradiction exists" },
        { key: "B", text_zh: "由本真透视与严谨推导可得确定结论", text_en: "Definite conclusion holds" },
        { key: "C", text_zh: "该结论仅在特殊整数点处成立", text_en: "Holds only at integer points" },
        { key: "D", text_zh: "无法确定结论正确性", text_en: "Cannot be determined" },
      ],
      answer_standard: "B",
      solutions_json: `结合本质透视与定理公理，结论必然成立，故选 B。`,
    },
    {
      question_id: `Q-${point.point_id}-03`,
      primary_point_id: point.point_id,
      difficulty_level: 3,
      question_type: "single_choice",
      score_default: 3,
      stem_zh: `在针对【${point.name_zh}】的逆向辨正分析中，临界边界判断正确的是（ ）`,
      stem_en: `In the boundary analysis of ${point.name_en}, which boundary check is correct?`,
      options: [
        { key: "A", text_zh: point.intrinsic_variation_zh.slice(0, 35) || "注意边界条件与反例", text_en: "Verify boundaries" },
        { key: "B", text_zh: "任意取值均无界", text_en: "Unbounded everywhere" },
        { key: "C", text_zh: "无需验证定义域约束", text_en: "No domain restriction" },
        { key: "D", text_zh: "直接套用公式无需分类讨论", text_en: "Apply without cases" },
      ],
      answer_standard: "A",
      solutions_json: `本体辨正指明了临界变式与约束边界，故选 A。`,
    },
  ];
}

/**
 * 模块一四级导航谱系 (任务 20.3, 设计文档 §7.1 第4点)
 * 年级 (7/8/9) -> 学期 (1/2) -> 领域 (数与代数/图形与几何/统计与概率) -> 考点
 * 数据从 mockKnowledgePointRecords (同步 core.db) 动态派生
 */
export const ConceptNav: React.FC<ConceptNavProps> = ({
  knowledgePoints = mockKnowledgePointRecords,
  initialPointId = "KP-023",
  onSelectPoint,
  className = "",
}) => {
  const locale = useSessionStore((state) => state.locale);

  // 当前选中的考点 ID
  const [selectedPointId, setSelectedPointId] = useState<string>(initialPointId);
  // 当前子视窗 Tab (四段论 / 沙盒 / 母题 / 快练)
  const [activeSubTab, setActiveSubTab] = useState<"stages" | "sandbox" | "master" | "practice">("stages");

  // 四级导航联动筛选状态
  const [selectedGrade, setSelectedGrade] = useState<number>(8);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedDomain, setSelectedDomain] = useState<string>("图形与几何");

  // 1. 提取所有可用年级 (如 [7, 8, 9])
  const availableGrades = useMemo(() => {
    const grades = Array.from(new Set(knowledgePoints.map((p) => p.grade))).sort();
    return grades.length ? grades : [7, 8, 9];
  }, [knowledgePoints]);

  // 2. 提取当前年级下的可用学期 (如 [1, 2])
  const availableSemesters = useMemo(() => {
    const semesters = Array.from(
      new Set(knowledgePoints.filter((p) => p.grade === selectedGrade).map((p) => p.semester))
    ).sort();
    return semesters.length ? semesters : [1, 2];
  }, [knowledgePoints, selectedGrade]);

  // 3. 提取当前年级+学期下的可用领域 (如 ["数与代数", "图形与几何"])
  const availableDomains = useMemo(() => {
    const domains = Array.from(
      new Set(
        knowledgePoints
          .filter((p) => p.grade === selectedGrade && p.semester === selectedSemester)
          .map((p) => p.domain)
      )
    );
    return domains.length ? domains : ["数与代数", "图形与几何"];
  }, [knowledgePoints, selectedGrade, selectedSemester]);

  // 4. 提取符合当前三级筛选的考点列表
  const filteredPoints = useMemo(() => {
    return knowledgePoints.filter(
      (p) =>
        p.grade === selectedGrade &&
        p.semester === selectedSemester &&
        p.domain === selectedDomain
    );
  }, [knowledgePoints, selectedGrade, selectedSemester, selectedDomain]);

  // 当前选中的考点记录
  const currentPoint = useMemo(() => {
    const found = knowledgePoints.find((p) => p.point_id === selectedPointId);
    if (found) return found;
    return filteredPoints[0] || knowledgePoints[0];
  }, [knowledgePoints, selectedPointId, filteredPoints]);

  const handleSelectPoint = (point: KnowledgePointRecord) => {
    setSelectedPointId(point.point_id);
    setSelectedGrade(point.grade);
    setSelectedSemester(point.semester);
    setSelectedDomain(point.domain);
    if (onSelectPoint) {
      onSelectPoint(point);
    }
  };

  const sandboxConfig = useMemo(() => {
    return getSandboxConfigForPoint(currentPoint.sandbox_id);
  }, [currentPoint.sandbox_id]);

  const masterExample = useMemo(() => {
    return getMasterExampleForPoint(currentPoint);
  }, [currentPoint]);

  const practiceQuestions = useMemo(() => {
    return getPracticeQuestionsForPoint(currentPoint);
  }, [currentPoint]);

  return (
    <div
      data-testid="concept-nav-root"
      className={`concept-nav-container ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        minHeight: "780px",
        gap: "1.25rem",
      }}
    >
      {/* 左侧四级导航下钻树 (常驻 / 抽屉兼容) */}
      <aside
        data-testid="concept-tree-sidebar"
        style={{
          width: "320px",
          minWidth: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1rem",
          background: "var(--glass-bg-elevated)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--glass-shadow)",
          height: "fit-content",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="compass" size={16} />
            <span>考点导航谱系</span>
          </h3>
          <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            {filteredPoints.length} 考点
          </span>
        </div>

        {/* 1级: 年级选择 */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            {`第一级 · ${t("nav.grade", locale, "年级")}`}
          </label>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {availableGrades.map((g) => {
              const active = selectedGrade === g;
              const label = g === 7 ? "七年级" : g === 8 ? "八年级" : "九年级";
              return (
                <button
                  key={g}
                  type="button"
                  data-testid={`grade-btn-${g}`}
                  onClick={() => {
                    setSelectedGrade(g);
                    // 自动适应该年级下首个学期和领域
                    const subPoints = knowledgePoints.filter((p) => p.grade === g);
                    if (subPoints.length > 0) {
                      setSelectedSemester(subPoints[0].semester);
                      setSelectedDomain(subPoints[0].domain);
                    }
                  }}
                  style={{
                    flex: 1,
                    minHeight: "36px",
                    border: active ? "1.5px solid var(--ios-blue)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    background: active ? "var(--ios-blue)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-primary)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2级: 学期选择 */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            {`第二级 · ${t("nav.semester", locale, "学期")}`}
          </label>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {availableSemesters.map((s) => {
              const active = selectedSemester === s;
              const label = s === 1 ? "上学期 (1)" : "下学期 (2)";
              return (
                <button
                  key={s}
                  type="button"
                  data-testid={`semester-btn-${s}`}
                  onClick={() => {
                    setSelectedSemester(s);
                    const subPoints = knowledgePoints.filter((p) => p.grade === selectedGrade && p.semester === s);
                    if (subPoints.length > 0) {
                      setSelectedDomain(subPoints[0].domain);
                    }
                  }}
                  style={{
                    flex: 1,
                    minHeight: "36px",
                    border: active ? "1.5px solid var(--ios-blue)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    background: active ? "var(--ios-blue)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-primary)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3级: 领域选择 */}
        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            {`第三级 · ${t("nav.domain", locale, "领域分类")}`}
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {availableDomains.map((dom) => {
              const active = selectedDomain === dom;
              return (
                <button
                  key={dom}
                  type="button"
                  data-testid={`domain-btn-${dom}`}
                  onClick={() => setSelectedDomain(dom)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.75rem",
                    minHeight: "38px",
                    border: active ? "1.5px solid var(--ios-indigo)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    background: active ? "var(--bg-card-hover)" : "var(--bg-card)",
                    color: active ? "var(--ios-indigo)" : "var(--text-primary)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{dom}</span>
                  <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>
                    {knowledgePoints.filter((p) => p.grade === selectedGrade && p.semester === selectedSemester && p.domain === dom).length} 考点
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4级: 考点列表 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            {`第四级 · ${t("nav.points", locale, "大纲考点")}`}
          </label>
          <div
            data-testid="concept-points-list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              maxHeight: "360px",
              overflowY: "auto",
              paddingRight: "0.25rem",
            }}
          >
            {filteredPoints.map((pt) => {
              const active = pt.point_id === currentPoint.point_id;
              return (
                <div
                  key={pt.point_id}
                  data-testid={`point-item-${pt.point_id}`}
                  onClick={() => handleSelectPoint(pt)}
                  style={{
                    padding: "0.6rem 0.8rem",
                    borderRadius: "var(--radius-md)",
                    border: active ? "1.5px solid var(--ios-blue)" : "1px solid var(--border-subtle)",
                    background: active ? "var(--ios-blue-glow)" : "var(--bg-card)",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: active ? "var(--ios-blue)" : "var(--text-secondary)" }}>
                      {pt.point_id}
                    </span>
                    {pt.is_mandatory ? (
                      <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "var(--ios-red)", color: "white", fontWeight: 600 }}>
                        必考
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: active ? 700 : 500, color: "var(--text-primary)" }}>
                    {locale === "en" ? pt.name_en : pt.name_zh}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 右侧主展台 (考点四段论 + 链接沙盒 + 母题步进 + 快练) */}
      <main
        data-testid="concept-main-stage"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          overflowY: "auto",
        }}
      >
        {/* 考点顶冠卡片 */}
        <header
          style={{
            padding: "1.25rem 1.5rem",
            background: "var(--glass-bg-elevated)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--glass-shadow)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", background: "var(--ios-blue-glow)", color: "var(--ios-blue)", fontWeight: 700 }}>
                {currentPoint.point_id}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {currentPoint.grade}年级{currentPoint.semester === 1 ? "上" : "下"} · {currentPoint.domain} · {currentPoint.subcategory}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {locale === "en" ? currentPoint.name_en : currentPoint.name_zh}
            </h2>
          </div>

          {/* 四位一体子视窗 Tab 切换 */}
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
              { key: "stages", label: "四段论精讲", icon: "book" },
              { key: "sandbox", label: "链接沙盒", icon: "flask" },
              { key: "master", label: "考点母题", icon: "trophy" },
              { key: "practice", label: "单点快练", icon: "bolt" },
            ].map((tab) => {
              const active = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  data-testid={`subtab-${tab.key}`}
                  onClick={() => setActiveSubTab(tab.key as any)}
                  style={{
                    border: "none",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "var(--radius-pill)",
                    background: active ? "var(--bg-card)" : "transparent",
                    color: active ? "var(--ios-blue)" : "var(--text-secondary)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease",
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
        </header>

        {/* 视窗分流内容展示 */}
        <section style={{ width: "100%" }}>
          {activeSubTab === "stages" && (
            <ConceptFourStages knowledgePoint={currentPoint} />
          )}

          {activeSubTab === "sandbox" && (
            <LinkedSandboxSlot
              sandboxId={currentPoint.sandbox_id}
              config={sandboxConfig}
              pointNameZh={currentPoint.name_zh}
            />
          )}

          {activeSubTab === "master" && (
            <PointMasterExample example={masterExample} />
          )}

          {activeSubTab === "practice" && (
            <QuickPractice
              pointId={currentPoint.point_id}
              initialQuestions={practiceQuestions}
              allQuestions={practiceQuestions}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default ConceptNav;
