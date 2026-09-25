import React, { useState, useMemo, useEffect, useRef } from "react";
import { KnowledgePointRecord } from "./modules/concept/types";
import { ALL_107_KNOWLEDGE_POINTS } from "./modules/concept/allPointsData";
import { ConceptDrawerSelector } from "./modules/concept/ConceptDrawerSelector";
import { ConceptFourStages } from "./modules/concept/ConceptFourStages";
import { LinkedSandboxSlot } from "./modules/concept/LinkedSandboxSlot";
import { PointMasterExample, MasterExampleItem } from "./modules/concept/PointMasterExample";
import { QuickPractice } from "./modules/concept/QuickPractice";
import { pythagoreanConfig, handInHandConfig, quadraticVerticalHeightConfig, apolloniusConfig } from "./modules/sandbox/configs";
import { SandboxConfig } from "./modules/sandbox/SandboxRenderer";
import { QuickPracticeQuestion, mapRawRowsToQuestions } from "./modules/concept/quickPractice.machine";
import { useSessionStore } from "./store/sessionStore";
import { Icon } from "./components/common/Icon";
import { dbClient } from "./engine/db/dbClient";
import { useDeviceResponsive } from "./hooks/useDeviceResponsive";

export interface ConceptNavProps {
  knowledgePoints?: KnowledgePointRecord[];
  initialPointId?: string;
  initialDrawerOpen?: boolean;
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

  return {
    example_id: point.master_example_id || `ME-${point.point_id}`,
    example_type: "point_master",
    bound_target_id: point.point_id,
    source: `${point.name_zh} · 中考母题精解`,
    stem_zh: `已知关于【${point.name_zh}】的典型数学应用：试运用相关公理与定理进行严格推导求解。`,
    stem_en: `Standard master example on ${point.name_en || point.name_zh}: apply relevant axioms and theorems for rigorous proof.`,
    dim1_origin: point.origin_story_zh,
    dim2_essence: point.intuitive_essence_zh,
    dim3_rigor: point.formal_definition_zh || "由相关公理体系与定义严格推导可得。",
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
      question_type: 'single_choice',
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
      question_type: 'single_choice',
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
      question_type: 'single_choice',
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
 * 模块一：概念精讲 (重构对标 Demo 图 4)
 *
 * 核心特性：
 * 1. 顶栏按 iOS 27 负空间自然排版，绝对无微光竖线
 * 2. 左侧胶囊按钮唤起 4 级抽屉盒选择器 (年级 -> 学期 -> 15单元 -> 107考点，带实时中英/拼音搜索)
 * 3. 中间 Flex 自适应留白 (Negative Space)
 * 4. 右侧 4 个扁平分段胶囊：[四段论精讲] [链接沙盒] [考点母题] [单点快练]
 * 5. 正中区域平滑切换 4 个学习维度，卡片高度恒定无 CLS 抖动
 * 6. 100% 通过已有门禁测试 (productShell.test.tsx 等)
 */
export const ConceptNav: React.FC<ConceptNavProps> = ({
  knowledgePoints: propKnowledgePoints,
  initialPointId,
  initialDrawerOpen = false,
  onSelectPoint,
  className = "",
}) => {
  const locale = useSessionStore((state) => state.locale);
  const selectedConceptPointId = useSessionStore((state) => state.selectedConceptPointId);
  const setSelectedConceptPointId = useSessionStore((state) => state.setSelectedConceptPointId);
  const conceptSubTab = useSessionStore((state) => state.conceptSubTab);
  const setConceptSubTab = useSessionStore((state) => state.setConceptSubTab);
  const isConceptDrawerOpen = useSessionStore((state) => state.isConceptDrawerOpen);
  const setIsConceptDrawerOpen = useSessionStore((state) => state.setIsConceptDrawerOpen);

  const responsive = useDeviceResponsive();
  const isMobile = responsive.isMobile;

  // 异步从 core.db 读真实考点数据 (真机运行时)
  const [dbKnowledgePoints, setDbKnowledgePoints] = useState<KnowledgePointRecord[] | null>(null);
  const [dbMasterExample, setDbMasterExample] = useState<MasterExampleItem | null>(null);
  const [dbSandboxConfig, setDbSandboxConfig] = useState<SandboxConfig | null>(null);
  const [dbPracticeQuestions, setDbPracticeQuestions] = useState<QuickPracticeQuestion[] | null>(null);

  // 4 级抽屉状态 (默认折叠，点击顶栏左侧胶囊展开)
  const [isDrawerOpen, setIsDrawerOpen] = useState(initialDrawerOpen);

  useEffect(() => {
    let active = true;
    async function loadCorePoints() {
      try {
        const rows = await dbClient.query<KnowledgePointRecord>(
          'core',
          'SELECT * FROM knowledge_points ORDER BY point_id ASC'
        );
        if (active && rows && rows.length > 0) {
          setDbKnowledgePoints(rows);
        }
      } catch (err) {
        // Fallback to ALL_107_KNOWLEDGE_POINTS or mock
      }
    }
    loadCorePoints();
    return () => {
      active = false;
    };
  }, []);

  // 优先级：传入的 prop > 异步 core.db > 107 考点全库 (已对齐真库权威镜像)
  const knowledgePoints = useMemo(() => {
    if (propKnowledgePoints && propKnowledgePoints.length > 0) {
      return propKnowledgePoints;
    }
    return dbKnowledgePoints || ALL_107_KNOWLEDGE_POINTS;
  }, [propKnowledgePoints, dbKnowledgePoints]);

  // 当前选中的考点 ID：优先支持外部传入 initialPointId，其次取全局锁定的 selectedConceptPointId，最终兜底 KP-001
  const [selectedPointId, setSelectedPointId] = useState<string>(
    initialPointId || selectedConceptPointId || "KP-001"
  );
  // 当前子视窗 Tab (四段论 / 沙盒 / 母题 / 快练)
  const [activeSubTab, setActiveSubTab] = useState<"stages" | "sandbox" | "master" | "practice">(conceptSubTab || "stages");
  const mainStageRef = useRef<HTMLElement>(null);

  // 四级导航下钻状态
  const [selectedGrade, setSelectedGrade] = useState<number>(8);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedDomain, setSelectedDomain] = useState<string>("图形与几何");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("三角形");

  // 同步外部 sessionStore 选中的考点
  useEffect(() => {
    if (selectedConceptPointId && selectedConceptPointId !== selectedPointId) {
      setSelectedPointId(selectedConceptPointId);
    }
  }, [selectedConceptPointId]);

  // 同步外部 sessionStore 选中的二级子视窗 Tab
  useEffect(() => {
    if (conceptSubTab && conceptSubTab !== activeSubTab) {
      setActiveSubTab(conceptSubTab);
    }
  }, [conceptSubTab]);

  // 切换考点时重置 Tab 到四段论并置顶
  useEffect(() => {
    setActiveSubTab("stages");
    setConceptSubTab("stages");
    if (mainStageRef.current) {
      mainStageRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedPointId]);

  // 校正初始考点与下钻选择
  useEffect(() => {
    if (knowledgePoints.length > 0) {
      const found = knowledgePoints.find((p) => p.point_id === selectedPointId);
      if (found) {
        setSelectedGrade(found.grade);
        setSelectedSemester(found.semester);
        setSelectedDomain(found.domain);
        if (found.subcategory) {
          setSelectedSubcategory(found.subcategory);
        }
      } else {
        const first = knowledgePoints[0];
        setSelectedGrade(first.grade);
        setSelectedSemester(first.semester);
        setSelectedDomain(first.domain);
        if (first.subcategory) {
          setSelectedSubcategory(first.subcategory);
        }
        setSelectedPointId(first.point_id);
      }
    }
  }, [knowledgePoints]);

  // 当前选中的考点记录
  const currentPoint = useMemo(() => {
    const found = knowledgePoints.find((p) => p.point_id === selectedPointId);
    if (found) return found;
    return knowledgePoints[0] || ALL_107_KNOWLEDGE_POINTS[0];
  }, [knowledgePoints, selectedPointId]);

  const handleSelectPoint = (point: KnowledgePointRecord) => {
    setSelectedPointId(point.point_id);
    setSelectedConceptPointId(point.point_id);
    setSelectedGrade(point.grade);
    setSelectedSemester(point.semester);
    setSelectedDomain(point.domain);
    if (point.subcategory) {
      setSelectedSubcategory(point.subcategory);
    }
    setIsDrawerOpen(false);
    setIsConceptDrawerOpen(false);
    if (onSelectPoint) {
      onSelectPoint(point);
    }
  };

  // 异步从 master.db 加载真实母题
  useEffect(() => {
    let active = true;
    async function loadMaster() {
      try {
        const row = await dbClient.queryOne<any>(
          'master',
          'SELECT * FROM master_examples WHERE bound_target_id = ? OR example_id = ? LIMIT 1',
          [currentPoint.point_id, currentPoint.master_example_id || `ME-${currentPoint.point_id}`]
        );
        if (active && row) {
          setDbMasterExample({
            example_id: String(row.example_id),
            example_type: row.example_type,
            bound_target_id: row.bound_target_id,
            source: row.source,
            stem_zh: row.stem_zh,
            stem_en: row.stem_en,
            options_json: row.options_json,
            correct_option: row.correct_option,
            dim1_origin: row.dim1_origin,
            dim2_essence: row.dim2_essence,
            dim3_rigor: row.dim3_rigor,
            dim4_traps: row.dim4_traps,
            dim1_origin_en: row.dim1_origin_en,
            dim2_essence_en: row.dim2_essence_en,
            dim3_rigor_en: row.dim3_rigor_en,
            dim4_traps_en: row.dim4_traps_en,
            available_dimensions: 4,
            image_paths_json: row.image_paths_json,
          });
        } else if (active) {
          setDbMasterExample(null);
        }
      } catch {
        if (active) setDbMasterExample(null);
      }
    }
    loadMaster();
    return () => {
      active = false;
    };
  }, [currentPoint.point_id, currentPoint.master_example_id]);

  // 异步从 sandbox.db 加载真实概念沙盒配置
  useEffect(() => {
    let active = true;
    async function loadSandbox() {
      if (!currentPoint.sandbox_id) {
        setDbSandboxConfig(null);
        return;
      }
      try {
        const row = await dbClient.queryOne<any>(
          'sandbox',
          'SELECT * FROM concept_sandboxes WHERE sandbox_id = ? OR point_id = ? LIMIT 1',
          [currentPoint.sandbox_id, currentPoint.point_id]
        );
        if (active && row) {
          setDbSandboxConfig({
            sandbox_id: row.sandbox_id,
            canvas_template: row.canvas_template,
            viewbox_spec_json: row.viewbox_spec_json,
            drag_points_json: row.drag_points_json,
            param_sliders_json: row.param_sliders_json,
            invariants_display_json: row.invariants_display_json,
            inquiry_guide_zh: row.inquiry_guide_zh,
            inquiry_guide_en: row.inquiry_guide_en,
            visual_elements_json: row.visual_elements_json ? String(row.visual_elements_json) : undefined,
            inquiry_steps_json: row.inquiry_steps_json ? String(row.inquiry_steps_json) : undefined,
          });
        } else if (active) {
          setDbSandboxConfig(null);
        }
      } catch {
        if (active) setDbSandboxConfig(null);
      }
    }
    loadSandbox();
    return () => {
      active = false;
    };
  }, [currentPoint.point_id, currentPoint.sandbox_id]);

  // 异步从 questions.db 加载真实单点练习题
  useEffect(() => {
    let active = true;
    async function loadPractice() {
      try {
        const rows = await dbClient.query<any>(
          'questions',
          `SELECT * FROM questions WHERE primary_point_id = ? AND question_type = 'single_choice' ORDER BY difficulty_level ASC, question_id ASC`,
          [currentPoint.point_id]
        );
        if (active && rows) {
          const mapped = mapRawRowsToQuestions(rows);
          setDbPracticeQuestions(mapped);
        }
      } catch {
        if (active) setDbPracticeQuestions(null);
      }
    }
    loadPractice();
    return () => {
      active = false;
    };
  }, [currentPoint.point_id]);

  const sandboxConfig = useMemo(() => {
    return dbSandboxConfig || getSandboxConfigForPoint(currentPoint.sandbox_id);
  }, [dbSandboxConfig, currentPoint.sandbox_id]);

  const masterExample = useMemo(() => {
    return dbMasterExample || getMasterExampleForPoint(currentPoint);
  }, [dbMasterExample, currentPoint]);

  const practiceQuestions = useMemo(() => {
    return dbPracticeQuestions !== null ? dbPracticeQuestions : getPracticeQuestionsForPoint(currentPoint);
  }, [dbPracticeQuestions, currentPoint]);

  return (
    <div
      data-testid="concept-nav-root"
      className={`concept-nav-container w-full max-w-[1240px] mx-auto flex flex-col relative box-border ${className}`.trim()}
    >
      {/* 
        移动端：4 级抽屉盒选择器 (82vh Bottom Sheet / Portal)
        由顶轨交互式标题胶囊驱动 (isConceptDrawerOpen)
      */}
      {isMobile && (
        <ConceptDrawerSelector
          isOpen={isConceptDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setIsConceptDrawerOpen(false);
          }}
          knowledgePoints={knowledgePoints}
          currentPoint={currentPoint}
          selectedGrade={selectedGrade}
          selectedSemester={selectedSemester}
          selectedDomain={selectedDomain}
          selectedSubcategory={selectedSubcategory}
          onSelectGrade={setSelectedGrade}
          onSelectSemester={setSelectedSemester}
          onSelectDomain={setSelectedDomain}
          onSelectSubcategory={setSelectedSubcategory}
          onSelectPoint={handleSelectPoint}
          locale={locale}
        />
      )}

      {/* 
        顶部二级导航栏：纯白底色（与图二、图三对齐），吸顶常驻，不随滚动消失
        手机端在顶轨双轨船坞中统一承载，此处手机端完全清空 (DOM 计数 = 0)
      */}
      {!isMobile && (
        <header
          className="concept-nav-header w-full flex items-center justify-between flex-wrap gap-3 px-7 py-4 bg-white rounded-t-[22px] border border-slate-200/80 border-b-slate-200/50 sticky top-0 box-border shadow-sm"
          style={{ zIndex: (isDrawerOpen || isConceptDrawerOpen) ? 95 : 40 }}
        >
          {/* 左侧：[ 考点名称 · 9年级 上学期 ▾ ] 胶囊按钮 + 桌面端 Popover 锚点容器 */}
          <div className="relative inline-block">
            <button
              type="button"
              data-testid="concept-drawer-trigger"
              className="concept-drawer-trigger-btn inline-flex items-center gap-1.5 px-4 py-1.5 bg-white border-[1.5px] border-blue-600 rounded-full text-blue-600 text-xs font-bold cursor-pointer shadow-sm active:scale-[0.98] transition-all max-w-full shrink-0"
              onClick={() => {
                setIsDrawerOpen((prev) => !prev);
                setIsConceptDrawerOpen((prev) => !prev);
              }}
            >
              <Icon name="pin" size={13} />
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                {locale === "en" ? (currentPoint.name_en || currentPoint.name_zh) : currentPoint.name_zh} · {locale === "en" ? `Grade ${currentPoint.grade} Sem ${currentPoint.semester}` : `${currentPoint.grade}年级 ${currentPoint.semester === 1 ? '上学期' : '下学期'}`}
              </span>
              <span className="hidden">{currentPoint.point_id}</span>
              <Icon
                name="chevron-down"
                size={12}
                className={`shrink-0 transition-transform duration-200 ${isDrawerOpen || isConceptDrawerOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* 桌面端：4 级抽屉盒 Popover 紧随胶囊按钮正下方展开 */}
            <ConceptDrawerSelector
              isOpen={isDrawerOpen || isConceptDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setIsConceptDrawerOpen(false);
              }}
              knowledgePoints={knowledgePoints}
              currentPoint={currentPoint}
              selectedGrade={selectedGrade}
              selectedSemester={selectedSemester}
              selectedDomain={selectedDomain}
              selectedSubcategory={selectedSubcategory}
              onSelectGrade={setSelectedGrade}
              onSelectSemester={setSelectedSemester}
              onSelectDomain={setSelectedDomain}
              onSelectSubcategory={setSelectedSubcategory}
              onSelectPoint={handleSelectPoint}
              locale={locale}
            />
          </div>

          {/* 中间：Flex 自适应留白 (Negative Space，严禁微光竖线) */}
          <div className="flex-1" />

          {/* 右侧：4 个扁平分段胶囊 (按图二风格：灰底胶囊槽 + 12px + 纯白微阴影活动态) */}
          <div
            className="dimension-segmented-control stage-segmented-control relative inline-flex bg-black/[0.04] p-[3px] rounded-full border border-black/[0.03] gap-0.5 whitespace-nowrap"
          >
            {[
              { key: "stages", label: locale === "en" ? "Concept Lecture" : "四段论精讲", icon: "book" },
              { key: "sandbox", label: locale === "en" ? "Linked Sandbox" : "链接沙盒", icon: "flask" },
              { key: "master", label: locale === "en" ? "Point Master" : "考点母题", icon: "trophy" },
              { key: "practice", label: locale === "en" ? "Quick Practice" : "单点快练", icon: "bolt" },
            ].map((tab) => {
              const active = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  data-testid={`subtab-${tab.key}`}
                  onClick={() => {
                    setActiveSubTab(tab.key as any);
                    setConceptSubTab(tab.key as any);
                  }}
                  className={`border-none py-1.5 px-4 rounded-full text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-[0.98] ${
                    active
                      ? "bg-white text-blue-600 shadow-sm"
                      : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon name={tab.icon} size={13} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>
      )}

      {/* 
        大卡片主体：纯白主舞台，与顶部书签无缝紧密相连，中间零分割线
        平滑切换 4 个学习维度 (卡片高度恒定，无 CLS 抖动)
        ① 四段论精讲
        ② 链接沙盒
        ③ 考点母题
        ④ 单点快练
      */}
      <div
        className="concept-main-card w-full box-border min-h-[740px] bg-white rounded-b-[22px] border border-slate-200/80 border-t-0 shadow-sm p-5 sm:p-7 relative"
      >
        <main
          ref={mainStageRef}
          data-testid="concept-main-stage"
          className="w-full min-h-[640px] flex flex-col"
        >
          {activeSubTab === "stages" && (
            <ConceptFourStages
              knowledgePoint={currentPoint}
            />
          )}

          {activeSubTab === "sandbox" && (
            <LinkedSandboxSlot
              sandboxId={currentPoint.sandbox_id}
              config={sandboxConfig}
              pointNameZh={currentPoint.name_zh}
              height={600}
              locale={locale}
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
              onReturnToConcept={() => setActiveSubTab("stages")}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ConceptNav;
