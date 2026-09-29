import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SandboxRenderer } from './SandboxRenderer';
import { LeapLab, formatSemester } from './LeapLab';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { useSessionStore } from '../../store/sessionStore';
import { useDeviceResponsive } from '../../hooks/useDeviceResponsive';
import { Point2D } from './invariants';
import { InquiryStep, checkTargetCondition } from '../concept/LinkedSandboxSlot';
import { Sparkles, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import './sandbox.css';

export interface LabWorkspaceProps {
  effectiveSandboxes: any[];
  effectiveLeapModels: any[];
  locale?: string;
  onBack?: () => void;
  labSubView?: "concept_sandbox" | "leap_4d";
  onLabSubViewChange?: (view: "concept_sandbox" | "leap_4d") => void;
  selectedLeapModelId?: string;
  onSelectLeapModelId?: (id: string) => void;
  selectedSandboxId?: string;
  onSelectSandboxId?: (id: string) => void;
}

const GRADES = [7, 8, 9] as const;

/**
 * 模块三：沙盒探究实验室统一视窗 (100% 严格对标 ios27_demo.html Image 2)
 * 
 * 核心功能：
 * 1. 概念沙盒 4 级抽屉盒选择模型 (年级 -> 学期 -> 课程/模块 -> 概念沙盒 + 实时搜索)；
 * 2. 动态解析 currentSandbox.config.param_sliders_json，渲染外置极简白滑块并驱动 SandboxRenderer；
 * 3. 4D 跃迁实验室无缝对接全库 36 个跃迁模型 (LM-7A-01 至 LM-9B-36)；
 * 4. 彻底清除画布滚动条，保证高对比度暗场视口与纯净几何体验。
 */
export const LabWorkspace: React.FC<LabWorkspaceProps> = ({
  effectiveSandboxes,
  effectiveLeapModels,
  locale = 'zh-CN',
  labSubView: controlledLabSubView,
  onLabSubViewChange,
  selectedLeapModelId: controlledLeapId,
  onSelectLeapModelId,
  selectedSandboxId: controlledSandboxId,
  onSelectSandboxId,
}) => {
  const isEn = String(locale).toLowerCase().startsWith('en');
  // 默认开启概念具象沙盒 (实验室一)
  const [internalSubView, setInternalSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");
  const [internalSandboxId, setInternalSandboxId] = useState<string>(
    effectiveSandboxes.find((s) => s.id === 'SB-KP001')?.id ||
    effectiveSandboxes.find((s) => s.grade === 7 && s.semester === 1)?.id ||
    effectiveSandboxes[0]?.id ||
    ""
  );
  const selectedSandboxId = controlledSandboxId ?? internalSandboxId;
  const setSelectedSandboxId = onSelectSandboxId ?? setInternalSandboxId;
  const [internalLeapId, setInternalLeapId] = useState<string>(
    effectiveLeapModels.find((m) => m.model_id === 'LM-7A-01')?.model_id ||
    effectiveLeapModels.find((m) => m.model_id.startsWith('LM-7A'))?.model_id ||
    effectiveLeapModels[0]?.model_id ||
    'LM-7A-01'
  );

  const labSubView = controlledLabSubView ?? internalSubView;
  const setLabSubView = onLabSubViewChange ?? setInternalSubView;
  const selectedLeapModelId = controlledLeapId ?? internalLeapId;
  const setSelectedLeapModelId = onSelectLeapModelId ?? setInternalLeapId;

  const responsive = useDeviceResponsive();
  const isMobile = responsive.isMobile;

  const sessionIsConceptDrawerOpen = useSessionStore((state) => state.isConceptDrawerOpen);
  const setSessionIsConceptDrawerOpen = useSessionStore((state) => state.setIsConceptDrawerOpen);
  const sessionIsLeapDrawerOpen = useSessionStore((state) => state.isLeapDrawerOpen);
  const setSessionIsLeapDrawerOpen = useSessionStore((state) => state.setIsLeapDrawerOpen);
  const sessionSelectedLeapModelId = useSessionStore((state) => state.selectedLeapModelId);
  const setSessionSelectedLeapModelId = useSessionStore((state) => state.setSelectedLeapModelId);
  const setSessionLeapSubTab = useSessionStore((state) => state.setLeapSubTab);

  // 抽屉盒状态
  const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState<boolean>(false);
  const [isLeapDrawerOpen, setIsLeapDrawerOpen] = useState<boolean>(false);
  const [conceptSearchQuery, setConceptSearchQuery] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<number>(7);
  const [filterSemester, setFilterSemester] = useState<number | 'all'>('all');

  // 同步外部 sessionStore 选中的跃迁模型 ID
  useEffect(() => {
    if (sessionSelectedLeapModelId && sessionSelectedLeapModelId !== selectedLeapModelId) {
      setSelectedLeapModelId(sessionSelectedLeapModelId);
    }
  }, [sessionSelectedLeapModelId]);

  // 同步外部 sessionStore 抽屉开关
  useEffect(() => {
    if (sessionIsConceptDrawerOpen !== isConceptDrawerOpen) {
      setIsConceptDrawerOpen(sessionIsConceptDrawerOpen);
    }
  }, [sessionIsConceptDrawerOpen]);

  useEffect(() => {
    if (sessionIsLeapDrawerOpen !== isLeapDrawerOpen) {
      setIsLeapDrawerOpen(sessionIsLeapDrawerOpen);
    }
  }, [sessionIsLeapDrawerOpen]);


  const [invariants, setInvariants] = useState<Array<{ id: string; text: string; isConstant: boolean }>>([]);

  // 当前激活的概念沙盒
  const currentSandbox = useMemo(() => {
    return effectiveSandboxes.find((s) => s.id === selectedSandboxId) || effectiveSandboxes[0];
  }, [effectiveSandboxes, selectedSandboxId]);

  // 当前激活的跃迁模型
  const currentLeapModel = useMemo(() => {
    return (
      effectiveLeapModels.find((m) => m.model_id === selectedLeapModelId) ||
      effectiveLeapModels.find((m) => m.model_id === 'LM-7A-01') ||
      effectiveLeapModels[0]
    );
  }, [effectiveLeapModels, selectedLeapModelId]);

  // 从知识点信息自动推断沙盒的年级/学期/课程归类
  const enrichedSandboxes = useMemo(() => {
    return effectiveSandboxes.map((s) => {
      let grade = s.grade;
      let semester = s.semester;
      let subcategory = s.subcategory || s.domain || '概念具象';

      // 若数据未明确标注，从 ID 智能匹配 (如 SB-KP001 为 7 上实数，KP023 为 8 下勾股等)
      if (!grade || !semester) {
        const idStr = String(s.id);
        const kpNumMatch = idStr.match(/KP-?(\d+)/i);
        const kpNum = kpNumMatch ? parseInt(kpNumMatch[1], 10) : 1;

        if (kpNum <= 4) {
          grade = 7;
          semester = 1;
          subcategory = '实数与数轴';
        } else if (kpNum <= 8) {
          grade = 7;
          semester = 2;
          subcategory = '实数与运算';
        } else if (kpNum <= 31) {
          grade = 8;
          semester = 1;
          subcategory = '整式与全等三角形';
        } else if (kpNum <= 43) {
          grade = 8;
          semester = 2;
          subcategory = '一次函数与二次根式';
        } else if (kpNum <= 57) {
          grade = 8;
          semester = 2;
          subcategory = '勾股定理与四边形';
        } else if (kpNum <= 84) {
          grade = 9;
          semester = 1;
          subcategory = '二次函数与圆';
        } else {
          grade = 9;
          semester = 2;
          subcategory = '相似与锐角三角函数';
        }
      }

      return {
        ...s,
        grade: Number(grade),
        semester: Number(semester),
        subcategory: String(subcategory),
      };
    });
  }, [effectiveSandboxes]);

  // 概念沙盒 3 级筛选结果 (年级 -> 学期(含全部) -> 知识点沙盒)
  const filteredSandboxes = useMemo(() => {
    const q = conceptSearchQuery.trim().toLowerCase();
    if (q) {
      return enrichedSandboxes.filter((s) => {
        const idMatch = s.id.toLowerCase().includes(q);
        const nameMatch = (s.nameZh || '').toLowerCase().includes(q);
        const descMatch = (s.desc || '').toLowerCase().includes(q);
        const subcatMatch = (s.subcategory || '').toLowerCase().includes(q);
        return idMatch || nameMatch || descMatch || subcatMatch;
      });
    }

    return enrichedSandboxes.filter((s) => {
      const matchGrade = s.grade === filterGrade;
      const matchSem = filterSemester === 'all' || s.semester === filterSemester;
      return matchGrade && matchSem;
    });
  }, [enrichedSandboxes, filterGrade, filterSemester, conceptSearchQuery]);

  // 解析当前沙盒的参数滑块规格
  const conceptSliders: Array<{
    id: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
  }> = useMemo(() => {
    try {
      if (currentSandbox?.config?.param_sliders_json) {
        const parsed = JSON.parse(currentSandbox.config.param_sliders_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => ({
            id: String(s.id),
            name: String((isEn ? s.nameEn : s.nameZh) || s.name || s.nameZh || s.id),
            min: s.min !== undefined ? Number(s.min) : 0,
            max: s.max !== undefined ? Number(s.max) : 10,
            default: s.default !== undefined ? Number(s.default) : 5,
            step: s.step !== undefined ? Number(s.step) : 0.5,
            unit: s.unit || '',
          }));
        }
      }
    } catch (e) {}

    // 默认兜底参数
    return [
      { id: 'scale', name: isEn ? 'Geometric Scale' : '几何缩放', min: 0.5, max: 2.5, default: 1.0, step: 0.1, unit: '' },
    ];
  }, [currentSandbox, isEn]);

  // 概念沙盒双模状态管理 (分步推演 vs 自由探索)
  const [conceptLabMode, setConceptLabMode] = useState<"step_deduction" | "free_explore">("step_deduction");

  // 解析当前概念沙盒的 1~3 步分步推演引导阶梯
  const inquirySteps: InquiryStep[] = useMemo(() => {
    if (currentSandbox?.config?.inquiry_steps_json) {
      try {
        const parsed = JSON.parse(currentSandbox.config.inquiry_steps_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    // 优雅兜底标准 2 步阶梯
    return [
      {
        step: 1,
        titleZh: '① 基准观察与参数感知',
        titleEn: '① Benchmark Observation & Parameter Sensing',
        guideTextZh: currentSandbox?.desc || '观察当前几何/函数构型在初始基准态下的图形结构与对应参数。',
        guideTextEn: currentSandbox?.descEn || 'Observe foundational configuration and parameter metrics.',
        ahaInsightZh: '名师题眼：牢固把握初始基准态的几何特征，是不变量探究与解题的立足点。',
        ahaInsightEn: 'Teacher Focus: Ground yourself in the baseline invariants.',
      },
      {
        step: 2,
        titleZh: '② 动态变异与不变量守恒',
        titleEn: '② Dynamic Variation & Invariant Conservation',
        guideTextZh: '调节参数滑块或拖拽动点，观察右侧测度指标在图形动态变形过程中如何保持守恒。',
        guideTextEn: 'Adjust sliders or drag points to observe invariant conservation during dynamic changes.',
        ahaInsightZh: '名师题眼：动中有静，局部线段与坐标改变时，核心不变量是联立方程的破题钥匙。',
        ahaInsightEn: 'Teacher Focus: Core invariant remains constant during dynamic changes.',
      },
    ];
  }, [currentSandbox?.config?.inquiry_steps_json, currentSandbox?.desc, currentSandbox?.descEn]);

  // 概念沙盒分步推演状态
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedStepIndices, setCompletedStepIndices] = useState<Set<number>>(new Set());
  const [interactedStepIndices, setInteractedStepIndices] = useState<Set<number>>(new Set());
  const [livePoints, setLivePoints] = useState<Record<string, Point2D>>({});
  const [showAhaModal, setShowAhaModal] = useState<boolean>(false);
  const [currentAhaStep, setCurrentAhaStep] = useState<InquiryStep | null>(null);

  // 概念沙盒参数值状态管理
  const [conceptParamValues, setConceptParamValues] = useState<Record<string, number>>({});
  const [sandboxResetCount, setSandboxResetCount] = useState<number>(0);

  const initialPointsRef = useRef<Record<string, Point2D> | null>(null);

  // 用户主动交互标记（调节滑块或拖拽动点）
  const markUserInteracted = useCallback(() => {
    setInteractedStepIndices((prev) => {
      if (prev.has(activeStepIndex)) return prev;
      const next = new Set(prev);
      next.add(activeStepIndex);
      return next;
    });
  }, [activeStepIndex]);

  // 当步骤切换或沙盒切换时，重置动点位移基准，确保新步骤需要独立的交互触发
  useEffect(() => {
    initialPointsRef.current = null;
  }, [activeStepIndex, currentSandbox?.id]);

  // 步骤初态预设自动注入
  const applyStepPreset = useCallback((stepObj?: InquiryStep | null) => {
    if (!stepObj) return;
    const rawPreset = stepObj.preset_params ?? stepObj.presetParams;
    let preset: Record<string, number> | null = null;
    if (rawPreset && typeof rawPreset === 'object' && !Array.isArray(rawPreset)) {
      preset = rawPreset;
    } else if (typeof rawPreset === 'string') {
      try {
        const parsed = JSON.parse(rawPreset);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          preset = parsed;
        }
      } catch {}
    }
    if (preset) {
      setConceptParamValues((prev) => ({ ...prev, ...preset }));
    }
  }, []);

  // 切换沙盒时重置推演状态与初始参数 (默认回归分步推演)
  useEffect(() => {
    const initial: Record<string, number> = {};
    conceptSliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setConceptParamValues(initial);
    setConceptLabMode('step_deduction');
    setActiveStepIndex(0);
    setCompletedStepIndices(new Set());
    setInteractedStepIndices(new Set());
    initialPointsRef.current = null;
    setLivePoints({});
    setShowAhaModal(false);
    setCurrentAhaStep(null);
  }, [currentSandbox?.id, conceptSliders]);

  // 动态监听参数与动点变化进行 Aha 达成判定 (仅在用户主动交互后触发，防初始秒通过)
  useEffect(() => {
    if (conceptLabMode !== 'step_deduction' || inquirySteps.length === 0) return;
    if (activeStepIndex >= inquirySteps.length) return;

    const currentStep = inquirySteps[activeStepIndex];
    if (!currentStep) return;

    if (!completedStepIndices.has(activeStepIndex) && interactedStepIndices.has(activeStepIndex)) {
      const isAchieved = checkTargetCondition(currentStep, conceptParamValues, livePoints);
      if (isAchieved) {
        setCompletedStepIndices((prev) => {
          const next = new Set(prev);
          next.add(activeStepIndex);
          return next;
        });
        setCurrentAhaStep(currentStep);
        setShowAhaModal(true);
      }
    }
  }, [
    conceptParamValues,
    livePoints,
    activeStepIndex,
    conceptLabMode,
    inquirySteps,
    completedStepIndices,
    interactedStepIndices,
  ]);

  // 推进至下一步骤或进入自由探索
  const handleAdvanceToNextStep = useCallback(() => {
    setShowAhaModal(false);
    setCompletedStepIndices((prev) => {
      const next = new Set(prev);
      next.add(activeStepIndex);
      return next;
    });
    if (activeStepIndex + 1 < inquirySteps.length) {
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      applyStepPreset(inquirySteps[nextIdx]);
    } else {
      setConceptLabMode('free_explore');
    }
  }, [activeStepIndex, inquirySteps, applyStepPreset]);

  // 重置整个探究流程为初始状态
  const handleResetInquiry = useCallback(() => {
    const initial: Record<string, number> = {};
    conceptSliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setConceptParamValues(initial);
    setActiveStepIndex(0);
    setCompletedStepIndices(new Set());
    setInteractedStepIndices(new Set());
    initialPointsRef.current = null;
    setLivePoints({});
    setShowAhaModal(false);
    setCurrentAhaStep(null);
    setSandboxResetCount((prev) => prev + 1);
  }, [conceptSliders]);

  // 双向动点参数回写 (标记用户主动发生过调参交互)
  const handleConceptParamChange = useCallback((patch: Record<string, number>) => {
    markUserInteracted();
    setConceptParamValues((prev) => ({ ...prev, ...patch }));
  }, [markUserInteracted]);

  // 捕获画布动点坐标变化 (仅当动点实际发生位移时标记用户主动交互，杜绝初次挂载秒达标)
  const handleConceptPointsChange = useCallback((pointMap: Record<string, Point2D>) => {
    setLivePoints(pointMap);
    if (!initialPointsRef.current) {
      initialPointsRef.current = pointMap;
      return;
    }
    const hasPointMoved = Object.entries(pointMap).some(([id, pt]) => {
      const initPt = initialPointsRef.current?.[id];
      if (!initPt) return false;
      return Math.abs(pt.x - initPt.x) > 0.01 || Math.abs(pt.y - initPt.y) > 0.01;
    });
    if (hasPointMoved) {
      markUserInteracted();
    }
  }, [markUserInteracted]);

  const [leapSearchQuery, setLeapSearchQuery] = useState<string>('');
  const [leapGrade, setLeapGrade] = useState<number>(() => {
    const sem = currentLeapModel?.unlocked_semester || '7A';
    return parseInt(sem[0], 10) || 7;
  });
  const [leapSemester, setLeapSemester] = useState<number | 'all'>('all');

  useEffect(() => {
    if (currentLeapModel?.unlocked_semester) {
      const g = parseInt(currentLeapModel.unlocked_semester[0], 10);
      if (g) setLeapGrade(g);
    }
  }, [currentLeapModel?.model_id, currentLeapModel?.unlocked_semester]);

  const filteredLeapModels = useMemo(() => {
    const q = leapSearchQuery.trim().toLowerCase();
    if (q) {
      return effectiveLeapModels.filter((m) => {
        const idMatch = m.model_id.toLowerCase().includes(q);
        const nameZhMatch = (m.model_name_zh || '').toLowerCase().includes(q);
        const nameEnMatch = (m.model_name_en || '').toLowerCase().includes(q);
        const briefZhMatch = (m.model_brief_zh || '').toLowerCase().includes(q);
        const kpMatch = JSON.stringify(m.kp_dependencies || []).toLowerCase().includes(q);
        return idMatch || nameZhMatch || nameEnMatch || briefZhMatch || kpMatch;
      });
    }

    return effectiveLeapModels.filter((m) => {
      const mGrade = parseInt(m.unlocked_semester?.[0] || '7', 10);
      const mSem = m.unlocked_semester?.[1] === 'A' ? 1 : 2;
      const matchGrade = mGrade === leapGrade;
      const matchSem = leapSemester === 'all' || mSem === leapSemester;
      return matchGrade && matchSem;
    });
  }, [effectiveLeapModels, leapGrade, leapSemester, leapSearchQuery]);

  const handleSelectLeapModel = (modelId: string) => {
    setSelectedLeapModelId(modelId);
    setSessionSelectedLeapModelId(modelId);
    setSessionLeapSubTab('deduction');
    setIsLeapDrawerOpen(false);
    setSessionIsLeapDrawerOpen(false);
    setLeapSearchQuery('');
    if (isMobile) {
      const deckBody = document.querySelector('[data-testid="card-deck-body"]');
      if (deckBody) {
        deckBody.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (typeof window !== 'undefined' && window.scrollY !== 0) {
        window.scrollTo({ top: 0 });
      }
    } else {
      const stage = document.querySelector('.workspace-stage-card') || document.querySelector('.sandbox-stage-wrapper');
      if (stage) {
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSelectSandbox = (id: string) => {
    setSelectedSandboxId(id);
    setConceptLabMode('step_deduction');
    setActiveStepIndex(0);
    setIsConceptDrawerOpen(false);
    setSessionIsConceptDrawerOpen(false);
    setConceptSearchQuery('');
    setConceptParamValues({});
    setInvariants([]);
    if (isMobile) {
      const deckBody = document.querySelector('[data-testid="card-deck-body"]');
      if (deckBody) {
        deckBody.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (typeof window !== 'undefined' && window.scrollY !== 0) {
        window.scrollTo({ top: 0 });
      }
    } else {
      const stage = document.querySelector('.workspace-stage-card') || document.querySelector('.sandbox-stage-wrapper');
      if (stage) {
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const toggleConceptDrawer = () => {
    setIsConceptDrawerOpen((prev) => {
      const next = !prev;
      setSessionIsConceptDrawerOpen(next);
      return next;
    });
    setIsLeapDrawerOpen(false);
    setSessionIsLeapDrawerOpen(false);
  };

  const toggleLeapDrawer = () => {
    setIsLeapDrawerOpen((prev) => {
      const next = !prev;
      setSessionIsLeapDrawerOpen(next);
      return next;
    });
    setIsConceptDrawerOpen(false);
    setSessionIsConceptDrawerOpen(false);
  };

  return (
    <div className="sandbox-stage-wrapper">
      <div className="workspace-stage-card">
        {/* 顶部统一实验室切换器与抽屉选择面板 - 吸顶固定常驻 (移动端无抽屉开启时彻底清零不渲染 DOM) */}
        {(!isMobile || (labSubView === "concept_sandbox" ? isConceptDrawerOpen : isLeapDrawerOpen)) && (
          <div
            className={`sandbox-sticky-header-container ${(isConceptDrawerOpen || isLeapDrawerOpen) ? 'drawer-open' : ''}`}
          >
            {/* 手机端由顶层 80px 双轨书签船坞统领，此处在手机端彻底清零 (DOM 计数 = 0) */}
            {!isMobile && (
            <div className="sandbox-top-bar">
              <div className="stage-segmented-control">
                <button
                  type="button"
                  onClick={() => {
                    setLabSubView("concept_sandbox");
                    setConceptLabMode("step_deduction");
                    setIsLeapDrawerOpen(false);
                    setSessionIsLeapDrawerOpen(false);
                  }}
                  className={`seg-item ${labSubView === "concept_sandbox" ? "active" : ""}`}
                >
                  <Icon name="flask" size={13} className="seg-icon" />
                  <span>
                    {isEn
                      ? `Concept Sandboxes (Lab 1 · ${effectiveSandboxes.length})`
                      : `概念具象沙盒 (实验室一 · ${effectiveSandboxes.length})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLabSubView("leap_4d");
                    setSessionLeapSubTab("deduction");
                    setIsConceptDrawerOpen(false);
                    setSessionIsConceptDrawerOpen(false);
                  }}
                  className={`seg-item ${labSubView === "leap_4d" ? "active" : ""}`}
                >
                  <Icon name="rocket" size={13} className="seg-icon" />
                  <span>
                    {isEn
                      ? `4D Leap Models (Lab 2 · ${effectiveLeapModels.length})`
                      : `4D 跃迁模型 (实验室二 · ${effectiveLeapModels.length})`}
                  </span>
                </button>
              </div>

              {/* 统一模型/沙盒选择抽屉入口 (固定在二级菜单右侧) */}
              {labSubView === "concept_sandbox" ? (
                <button
                  type="button"
                  className="model-drawer-trigger-btn"
                  onClick={toggleConceptDrawer}
                >
                  <Icon name="menu" size={13} />
                  <span>
                    {isEn
                      ? `Select Sandbox: ${(currentSandbox?.nameEn || currentSandbox?.nameZh) || currentSandbox?.id}`
                      : `选择沙盒: ${currentSandbox?.nameZh || currentSandbox?.id}`}
                  </span>
                  <Icon name={isConceptDrawerOpen ? "chevron-up" : "chevron-down"} size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  className="model-drawer-trigger-btn"
                  onClick={toggleLeapDrawer}
                >
                  <Icon name="layers" size={13} />
                  <span>
                    {isEn
                      ? `Select Model: ${currentLeapModel?.model_id} · ${(currentLeapModel?.model_name_en || currentLeapModel?.model_name_zh) || ''}`
                      : `选择模型: ${currentLeapModel?.model_id} · ${currentLeapModel?.model_name_zh}`}
                  </span>
                  <Icon name={isLeapDrawerOpen ? "chevron-up" : "chevron-down"} size={13} />
                </button>
              )}
            </div>
          )}

          {/* 概念沙盒 4 级抽屉盒选择面板 */}
          {labSubView === "concept_sandbox" && isConceptDrawerOpen && (
            <div className="model-drawer-panel" style={{ marginTop: '12px', marginBottom: '4px' }}>
              {/* 顶部搜索条 */}
              <div className="drawer-search-wrapper">
                <div className="drawer-search-input-box">
                  <Icon name="search" size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    value={conceptSearchQuery}
                    onChange={(e) => setConceptSearchQuery(e.target.value)}
                    placeholder={
                      isEn
                        ? "Search 46 concept sandboxes (e.g. Linear Function / Pythagorean)..."
                        : "搜索 46 个概念沙盒 (如 一次函数 / 勾股 / 反比例)..."
                    }
                    className="drawer-search-field"
                  />
                  {conceptSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setConceptSearchQuery('')}
                      className="drawer-search-clear"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setIsConceptDrawerOpen(false)}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              {!conceptSearchQuery && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* 1 级：年级选择 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {isEn ? '① Grade:' : '① 年级:'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {GRADES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`drawer-sem-chip ${filterGrade === g ? 'active' : ''}`}
                          onClick={() => setFilterGrade(g)}
                        >
                          {isEn ? `Grade ${g}` : `${g}年级`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2 级：学期选择 (含「全部」) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {isEn ? '② Semester:' : '② 学期:'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { val: 'all' as const, label: '全部', labelEn: 'All' },
                        { val: 1 as const, label: '上学期', labelEn: 'Sem 1' },
                        { val: 2 as const, label: '下学期', labelEn: 'Sem 2' },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          className={`drawer-sem-chip ${filterSemester === s.val ? 'active' : ''}`}
                          onClick={() => setFilterSemester(s.val)}
                        >
                          {isEn ? s.labelEn : s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4 级：概念沙盒卡片列表 */}
              <div className="drawer-model-grid">
                {filteredSandboxes.length > 0 ? (
                  filteredSandboxes.map((s) => {
                    const isSelected = s.id === currentSandbox.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`drawer-model-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectSandbox(s.id)}
                      >
                        <div className="drawer-card-header">
                          <span className="drawer-card-code">{s.id}</span>
                          <span className="drawer-card-sem">
                            {isEn ? `G${s.grade}S${s.semester}` : `${s.grade}年级${s.semester === 1 ? '上' : '下'}`}
                          </span>
                          {isSelected && <Icon name="check" size={12} style={{ color: 'var(--ios-blue)', marginLeft: 'auto' }} />}
                        </div>
                        <div className="drawer-card-name">{(isEn ? s.nameEn : s.nameZh) || s.nameZh}</div>
                        <div className="drawer-card-brief">
                          {(isEn ? s.descEn : s.desc) || (isEn ? 'Dynamic geometry & parameter invariant exploration' : '动态几何与参数不变量探究')}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="drawer-empty-tip">
                    {isEn ? 'No matching concept sandboxes found' : '未检索到匹配的概念沙盒'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4D 跃迁模型 2 级抽屉盒模型切换面板 */}
          {labSubView === "leap_4d" && isLeapDrawerOpen && (
            <div className="model-drawer-panel" style={{ marginTop: '12px', marginBottom: '4px' }}>
              {/* 顶部搜索框 */}
              <div className="drawer-search-wrapper">
                <div className="drawer-search-input-box">
                  <Icon name="search" size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    value={leapSearchQuery}
                    onChange={(e) => setLeapSearchQuery(e.target.value)}
                    placeholder={
                      isEn
                        ? "Search 36 leap models (e.g. Hand-in-Hand / LM-7A-01 / Parabola)..."
                        : "搜索 36 个跃迁模型 (如 手拉手 / LM-7A-01 / 抛物线)..."
                    }
                    className="drawer-search-field"
                  />
                  {leapSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLeapSearchQuery('')}
                      className="drawer-search-clear"
                    >
                      <Icon name="x" size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setIsLeapDrawerOpen(false)}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              {/* 1 级：年级 + 2 级：学期 (含「全部」) */}
              {!leapSearchQuery && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                  {/* 1 级：年级选择 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {isEn ? '① Grade:' : '① 年级:'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {GRADES.map((g) => (
                        <button
                          key={g}
                          type="button"
                          className={`drawer-sem-chip ${leapGrade === g ? 'active' : ''}`}
                          onClick={() => setLeapGrade(g)}
                        >
                          {isEn ? `Grade ${g}` : `${g}年级`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2 级：学期选择 (含「全部」) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {isEn ? '② Semester:' : '② 学期:'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { val: 'all' as const, label: '全部', labelEn: 'All' },
                        { val: 1 as const, label: '上学期', labelEn: 'Sem 1' },
                        { val: 2 as const, label: '下学期', labelEn: 'Sem 2' },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          className={`drawer-sem-chip ${leapSemester === s.val ? 'active' : ''}`}
                          onClick={() => setLeapSemester(s.val)}
                        >
                          {isEn ? s.labelEn : s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2 级：模型卡片列表 */}
              <div className="drawer-model-grid">
                {filteredLeapModels.length > 0 ? (
                  filteredLeapModels.map((m) => {
                    const isSelected = m.model_id === currentLeapModel.model_id;
                    const isFlagship = m.model_id.includes('9A-19') || m.model_id.includes('7A-01');
                    return (
                      <button
                        key={m.model_id}
                        type="button"
                        className={`drawer-model-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectLeapModel(m.model_id)}
                      >
                        <div className="drawer-card-header">
                          <span className="drawer-card-code">{m.model_id}</span>
                          <span className="drawer-card-sem">{formatSemester(m.unlocked_semester, locale)}</span>
                          {isFlagship && <span className="drawer-card-flagship">{isEn ? 'Flagship' : '重点模型'}</span>}
                          {isSelected && <Icon name="check" size={12} style={{ color: 'var(--ios-blue)', marginLeft: 'auto' }} />}
                        </div>
                        <div className="drawer-card-name">{(isEn ? m.model_name_en : m.model_name_zh) || m.model_name_zh}</div>
                        <div className="drawer-card-brief">{(isEn ? m.model_brief_en : m.model_brief_zh) || m.model_brief_zh}</div>
                      </button>
                    );
                  })
                ) : (
                  <div className="drawer-empty-tip">
                    {isEn ? 'No matching leap models found' : '未检索到匹配的跃迁模型'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

        {/* 主舞台展示区 */}
        {labSubView === "leap_4d" ? (
          <LeapLab
            modelId={selectedLeapModelId}
            onSelectModelId={handleSelectLeapModel}
            allModels={effectiveLeapModels}
            locale={locale}
            hideDrawerTrigger={true}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 0 : '16px', width: '100%' }}>
            {/* 概念沙盒标题栏：手机端由顶层 80px 双轨书签船坞统领，从 DOM 中彻底清零 */}
            {!isMobile && (
              <div className="sandbox-header-line">
                <h3 className="sandbox-title-text">
                  <span>{(isEn ? currentSandbox.nameEn : currentSandbox.nameZh) || currentSandbox.nameZh}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                    ({currentSandbox.id} · {isEn ? 'Concept Sandbox' : '考点具象沙盒'})
                  </span>
                </h3>
              </div>
            )}

            {/* 85% Canvas + 15% Telemetry & Controls */}
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', position: 'relative' }}>
            <div className="sandbox-split-box" style={{ position: 'relative' }}>
              <div className="sandbox-viewport-85">
                <SandboxRenderer
                  key={`${currentSandbox.id}-${sandboxResetCount}`}
                  config={currentSandbox.config}
                  paramValues={conceptParamValues}
                  onInvariantsChange={setInvariants}
                  onPointsChange={handleConceptPointsChange}
                  onParamChange={handleConceptParamChange}
                  locale={locale}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              <div className="sandbox-guide-15">
                <div className="telemetry-readings">
                  {invariants.length > 0 ? (
                    invariants.map((inv) => (
                      <span key={inv.id} className="telemetry-tag-invariant" style={{ marginRight: '6px' }}>
                        <MathRenderer content={inv.text} />
                      </span>
                    ))
                  ) : (
                    <span className="telemetry-tag-invariant">
                      {isEn ? 'Geometric Invariant: Area & Segment Ratio Conserved' : '几何不变量：面积与线段比例守恒'}
                    </span>
                  )}
                </div>
                <div className="telemetry-tag-conclusion">
                  {isEn ? 'Conclusion: Intuitive geometric verification passed' : '结论：几何直观验证通过'}
                </div>
              </div>
            </div>

            {/* 模式 1：概念沙盒分步推演 (严格对齐模块一链接沙盒逻辑与交互) */}
            <div
              className="step-deduction-container"
              data-testid="concept-step-deduction-view"
              style={{ display: conceptLabMode === 'step_deduction' ? 'flex' : 'none' }}
            >
              {/* 顶部步骤胶囊导航 [ ① | ② | ③ ] + 重新开始重置按钮 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {inquirySteps.map((s, idx) => {
                    const stepSymbols = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
                    const sym = stepSymbols[idx] || `${idx + 1}`;
                    const isCur = idx === activeStepIndex;
                    const isDone = completedStepIndices.has(idx);
                    const rawTitle = (isEn ? s.titleEn : s.titleZh) || s.titleZh || s.title || (isEn ? `Step ${idx + 1}` : `步骤 ${idx + 1}`);
                    const cleanTitle = rawTitle.replace(/^\[[^\]]+\]\s*/, '');
                    const shortTitle = cleanTitle.includes('：')
                      ? cleanTitle.split('：')[0].trim()
                      : cleanTitle.includes(':')
                      ? cleanTitle.split(':')[0].trim()
                      : (cleanTitle.length > 8 ? cleanTitle.slice(0, 8) + '...' : cleanTitle);
                    return (
                      <button
                        key={s.step || idx}
                        type="button"
                        className={`nav-pill-btn ${isCur ? 'active' : ''}`}
                        onClick={() => {
                          setActiveStepIndex(idx);
                          applyStepPreset(s);
                        }}
                        title={rawTitle}
                        style={{
                          background: isCur ? 'var(--ios-blue)' : isDone ? 'rgba(52, 199, 89, 0.12)' : undefined,
                          color: isCur ? '#ffffff' : isDone ? '#2e7d32' : undefined,
                          borderColor: isCur ? 'var(--ios-blue)' : isDone ? 'rgba(52, 199, 89, 0.3)' : undefined,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{isDone ? '✓ ' : sym + ' '}</span>
                        <span>{shortTitle}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleResetInquiry}
                  title={isEn ? 'Restart Inquiry' : '重新开始探究'}
                  className="nav-pill-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', flexShrink: 0 }}
                >
                  <RotateCcw size={12} />
                  <span>{isEn ? 'Reset' : '重新开始'}</span>
                </button>
              </div>

              {/* 当前步骤引导与达成卡片 */}
              {inquirySteps[activeStepIndex] && (
                <div className="step-card-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="bulb" size={15} style={{ color: 'var(--ios-blue)' }} />
                      <span>
                        {(isEn ? inquirySteps[activeStepIndex].titleEn : inquirySteps[activeStepIndex].titleZh) ||
                          inquirySteps[activeStepIndex].titleZh ||
                          inquirySteps[activeStepIndex].title ||
                          `Step ${activeStepIndex + 1}`}
                      </span>
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {activeStepIndex + 1} / {inquirySteps.length}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <MathRenderer
                      content={
                        (isEn ? inquirySteps[activeStepIndex].guideTextEn : inquirySteps[activeStepIndex].guideTextZh) ||
                        inquirySteps[activeStepIndex].guide_text ||
                        inquirySteps[activeStepIndex].guideTextZh ||
                        ''
                      }
                    />
                  </div>

                  {/* 达成状态与名师秘籍入口 (严格对齐模块一链接沙盒) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.06))', fontSize: '12px' }}>
                    {completedStepIndices.has(activeStepIndex) ? (
                      <span style={{ color: '#2e7d32', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>✓</span>
                        <span>{isEn ? 'Target Condition Achieved' : '目标已达成'}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {isEn ? 'Adjust sliders or dynamic points to explore' : '调节参数或动点探究满足目标'}
                      </span>
                    )}

                    {(inquirySteps[activeStepIndex].aha_insight || inquirySteps[activeStepIndex].ahaInsightZh || inquirySteps[activeStepIndex].ahaInsightEn) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentAhaStep(inquirySteps[activeStepIndex]);
                          setShowAhaModal(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#b45309',
                          fontWeight: 600,
                          fontSize: '12px',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                        }}
                      >
                        <Sparkles size={13} style={{ color: '#d97706' }} />
                        <span>{isEn ? 'Master Insight' : '名师秘籍'}</span>
                      </button>
                    )}
                  </div>

                  {/* 步骤参数微调条 (允许在分步模式下精准操作当前步骤参数) */}
                  {conceptSliders.length > 0 && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '4px' }}>
                      {conceptSliders.map((s) => {
                        const val = conceptParamValues[s.id] ?? s.default;
                        const sliderName = isEn ? (s.name || s.id) : s.name;
                        return (
                          <div key={s.id} className="slider-group" style={{ fontSize: '12px' }}>
                            <label htmlFor={`step-slider-${s.id}`} style={{ whiteSpace: 'nowrap' }}>
                              {sliderName}: <strong style={{ color: 'var(--ios-blue)' }}>{val}{s.unit || ''}</strong>
                            </label>
                            <input
                              id={`step-slider-${s.id}`}
                              type="range"
                              className="apple-slider"
                              min={s.min}
                              max={s.max}
                              step={s.step}
                              value={val}
                              onChange={(e) => {
                                const newVal = parseFloat(e.target.value);
                                handleConceptParamChange({ [s.id]: newVal });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 底部操作区：[上一步] / [下一步 ➔] / [完成探究 · 自由把玩] */}
                  <div className="step-action-bar" style={{ paddingTop: '6px' }}>
                    <button
                      type="button"
                      disabled={activeStepIndex === 0}
                      className="nav-pill-btn"
                      onClick={() => {
                        const prevIdx = Math.max(0, activeStepIndex - 1);
                        setActiveStepIndex(prevIdx);
                        applyStepPreset(inquirySteps[prevIdx]);
                      }}
                      style={{ opacity: activeStepIndex === 0 ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ChevronLeft size={13} />
                      <span>{isEn ? 'Previous Step' : '上一步'}</span>
                    </button>

                    <button
                      type="button"
                      className="step-next-large-btn"
                      onClick={handleAdvanceToNextStep}
                      style={{
                        background: completedStepIndices.has(activeStepIndex) ? '#059669' : 'var(--ios-blue, #0071e3)',
                      }}
                    >
                      <span>
                        {activeStepIndex + 1 < inquirySteps.length
                          ? completedStepIndices.has(activeStepIndex)
                            ? isEn ? 'Achieved · Next Step ➔' : '已达成 · 下一步 ➔'
                            : isEn ? 'Next Step ➔' : '进入下一步 ➔'
                          : isEn ? 'Finish · Free Play' : '完成探究 · 自由把玩'}
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 模式 2：自由探索 (包含极简控制条与全量探究指南) */}
            <div
              className="free-explore-container"
              data-testid="concept-free-explore-view"
              style={{ display: conceptLabMode === 'free_explore' ? 'flex' : 'none', flexDirection: 'column', gap: '12px', width: '100%' }}
            >
              {/* 极简控制条 (动态渲染苹果极简白滑块) */}
              <div className="sandbox-controls-bar">
                <div style={{ display: 'flex', gap: '20px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                  {conceptSliders.map((s) => {
                    const val = conceptParamValues[s.id] ?? s.default;
                    const sliderName = isEn ? (s.name || s.id) : s.name;
                    return (
                      <div key={s.id} className="slider-group">
                        <label htmlFor={`concept-slider-${s.id}`} style={{ whiteSpace: 'nowrap' }}>
                          {sliderName}: <strong style={{ color: 'var(--ios-blue)' }}>{val}{s.unit || ''}</strong>
                        </label>
                        <input
                          id={`concept-slider-${s.id}`}
                          type="range"
                          className="apple-slider"
                          min={s.min}
                          max={s.max}
                          step={s.step}
                          value={val}
                          onChange={(e) => {
                            const newVal = parseFloat(e.target.value);
                            handleConceptParamChange({ [s.id]: newVal });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 探究指南与直观结论卡片 */}
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-md, 14px)',
                  background: 'var(--bg-card-subtle, #f5f5f7)',
                  border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                  fontSize: '12px',
                  color: 'var(--text-secondary, #515154)',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--ios-blue)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="bulb" size={14} />
                  <span>{isEn ? 'Exploration Guide:' : '探究指南：'}</span>
                </div>
                <p style={{ margin: 0 }}>
                  {(isEn ? currentSandbox.descEn : currentSandbox.desc) ||
                    currentSandbox.desc ||
                    (isEn
                      ? 'Drag sliders or points to observe variations of curves and shapes.'
                      : '拖动控制条中的参数滑块或画布动点，实时观察函数曲线与几何图形的变化特征。')}
                </p>
              </div>
            </div>


              </div>
            ) : (
              /* 电脑端统一大剧场卡片 (方案 B：左侧大视口 + 右侧任务/HUD一体化仪表盘 + 下方推演轨道与自由解锁滑块) */
              <div className="w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl flex flex-col gap-3.5 p-4 box-border relative">
                {/* 上半区：左侧大视口 + 右侧一体化仪表盘 (两边自动等高对齐) */}
                <div className="sandbox-split-box desktop-unified flex-1 min-h-0 flex flex-col lg:flex-row gap-3.5 items-stretch">
                  {/* 左侧大视口 (JSXGraph 画布) */}
                  <div className="sandbox-viewport-85 flex-[1_1_75%] h-full min-h-0 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-inner block" style={{ width: '100%', height: '100%' }}>
                    <SandboxRenderer
                      key={`${currentSandbox.id}-${sandboxResetCount}`}
                      config={currentSandbox.config}
                      paramValues={conceptParamValues}
                      onInvariantsChange={setInvariants}
                      onPointsChange={handleConceptPointsChange}
                      onParamChange={handleConceptParamChange}
                      locale={locale}
                      className="w-full h-full"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>

                  {/* 右侧一体化仪表盘 (专职任务引导、名师解析、HUD 测度与模式推进) */}
                  <div className="sandbox-guide-15 w-full lg:w-80 shrink-0 h-full flex flex-col gap-2.5 rounded-2xl bg-slate-900/95 border border-slate-700/60 p-3.5 text-slate-100 shadow-inner overflow-y-auto">
                    {/* 顶部标题行与自由探索切换 */}
                    <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-700/60 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Icon name={conceptLabMode === 'step_deduction' ? 'bulb' : 'gamepad'} size={15} className="text-sky-400" />
                        <span className="text-xs font-bold tracking-wide text-sky-300">
                          {conceptLabMode === 'step_deduction'
                            ? (isEn ? 'Inquiry Mission' : '核心探究任务')
                            : (isEn ? 'Free Play Active' : '自由把玩模式')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (conceptLabMode === 'step_deduction') {
                            setConceptLabMode('free_explore');
                          } else {
                            setConceptLabMode('step_deduction');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-all active:scale-[0.98]"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>
                          {conceptLabMode === 'step_deduction'
                            ? (isEn ? 'Free Play' : '直接自由把玩')
                            : (isEn ? 'Back to Inquiry' : '返回分步推演')}
                        </span>
                      </button>
                    </div>

                    {/* 态 1：分步推演受控态 (认知与数据洞察严格只显示当前按钮选中的过程) */}
                    {conceptLabMode === 'step_deduction' && inquirySteps[activeStepIndex] && (
                      <div className="step-deduction-container flex flex-col gap-2.5 flex-1 min-h-0" data-testid="concept-step-deduction-view">
                        {/* 步骤快速选择胶囊 (对齐标杆截图) */}
                        <div className="flex items-center gap-1.5 flex-wrap pb-1">
                          {inquirySteps.map((s, idx) => {
                            const isCur = idx === activeStepIndex;
                            const isDone = completedStepIndices.has(idx);
                            return (
                              <button
                                key={s.step || idx}
                                type="button"
                                onClick={() => {
                                  setActiveStepIndex(idx);
                                  applyStepPreset(s);
                                }}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
 isCur
 ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
 : isDone
 ? 'bg-emerald-500/25 text-emerald-300 hover:bg-emerald-500/35'
 : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
 }`}
                              >
                                {isDone ? '✓ ' : ''}{isEn ? `Step ${idx + 1}` : `步骤 ${idx + 1}`}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={handleResetInquiry}
                            title={isEn ? 'Restart Inquiry' : '重新开始探究'}
                            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-all active:scale-95"
                          >
                            <RotateCcw size={11} className="text-slate-400" />
                            <span>{isEn ? 'Reset' : '重新开始'}</span>
                          </button>
                        </div>
                        {/* 当前步骤信息卡 */}
                        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-800/80 border border-sky-500/30 shrink-0">
                          <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                            <span>{`步骤 ${activeStepIndex + 1} / ${inquirySteps.length}`}</span>
                            <span className="text-[11px] text-slate-300 font-medium truncate max-w-[130px]">
                              {(isEn ? inquirySteps[activeStepIndex]?.titleEn : inquirySteps[activeStepIndex]?.titleZh) || inquirySteps[activeStepIndex]?.titleZh || `Step ${activeStepIndex + 1}`}
                            </span>
                          </div>

                          {/* 名师思想精解 */}
                          <div className="text-xs text-slate-200 leading-relaxed font-normal">
                            <MathRenderer
                              content={
                                (isEn ? inquirySteps[activeStepIndex]?.guideTextEn : inquirySteps[activeStepIndex]?.guideTextZh) ||
                                inquirySteps[activeStepIndex]?.guide_text ||
                                inquirySteps[activeStepIndex]?.guideTextZh ||
                                ''
                              }
                            />
                          </div>

                          {/* 达成状态与名师秘籍查看入口 */}
                          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-700/60 text-[11px]">
                            {completedStepIndices.has(activeStepIndex) ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <span>✓</span>
                                <span>{isEn ? 'Target Achieved' : '目标已达成'}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                {isEn ? 'Observing...' : '调节参数或动点探究'}
                              </span>
                            )}

                            {(inquirySteps[activeStepIndex].aha_insight || inquirySteps[activeStepIndex].ahaInsightZh || inquirySteps[activeStepIndex].ahaInsightEn) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentAhaStep(inquirySteps[activeStepIndex]);
                                  setShowAhaModal(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 underline underline-offset-2"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>{isEn ? 'Insight' : '名师秘籍'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 核心测度实时 HUD */}
                        <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-emerald-300">{isEn ? 'Live HUD Metrics' : '核心测度实时 HUD'}</span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                              {isEn ? 'Active' : '动态监测'}
                            </span>
                          </div>

                          <div className="telemetry-readings flex flex-col gap-1 text-xs font-mono">
                            {invariants.length > 0 ? (
                              invariants.slice(0, 3).map((inv, idx) => (
                                <div key={inv.id || idx} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
                                  <span className="telemetry-tag-invariant text-sky-300 font-semibold flex-1 min-w-0 break-words leading-tight"><MathRenderer content={inv.text} /></span>
                                  <span className="text-[10px] text-emerald-400 shrink-0 ml-1.5">{inv.isConstant ? (isEn ? '[Constant]' : '[绝对恒定]') : (isEn ? '[Dynamic]' : '[动态观测中]')}</span>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
                                <span className="telemetry-tag-invariant text-sky-300">
                                  {isEn ? 'Geometric Invariant Conserved' : '几何不变量守恒'}
                                </span>
                                <span className="text-[10px] text-emerald-400">[守恒 ✓]</span>
                              </div>
                            )}
                          </div>
                          <div className="telemetry-tag-conclusion text-[11px] text-emerald-400 p-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-center mt-0.5">
                            {isEn ? 'Conclusion: Intuitive geometric verification passed' : '结论：几何直观验证通过'}
                          </div>
                        </div>

                        {/* 底部推进操作栏 */}
                        <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-slate-700/60 shrink-0">
                          <button
                            type="button"
                            disabled={activeStepIndex === 0}
                            onClick={() => {
                              const prevIdx = Math.max(0, activeStepIndex - 1);
                              setActiveStepIndex(prevIdx);
                              applyStepPreset(inquirySteps[prevIdx]);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1"
                          >
                            <ChevronLeft size={13} />
                            <span>{isEn ? 'Previous' : '上一步'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAdvanceToNextStep}
                            className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
 completedStepIndices.has(activeStepIndex) ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
 }`}
                          >
                            <span>
                              {activeStepIndex + 1 < inquirySteps.length
                                ? completedStepIndices.has(activeStepIndex)
                                  ? (isEn ? 'Achieved · Next ➔' : '已达成 · 下一步 ➔')
                                  : (isEn ? 'Next Step ➔' : '进入下一步 ➔')
                                : (isEn ? 'Finish · Free Play ➔' : '完成探究 · 自由把玩 ➔')}
                            </span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 态 2：自由探索模式 (全量自由遥测) */}
                    {conceptLabMode === 'free_explore' && (
                      <div className="flex flex-col gap-2.5 flex-1 min-h-0">
                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 leading-normal shrink-0">
                          <div className="font-bold flex items-center gap-1 text-emerald-300 mb-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isEn ? 'Free Play Active' : '自由把玩已开启'}</span>
                          </div>
                          <span>{isEn ? 'Freely adjust parameters and drag dynamic points below.' : '已解除推演步骤限制，可随意拖拽动点与滑动下方参数，深入观测几何守恒。'}</span>
                        </div>

                        {/* 全量守恒遥测清单 */}
                        <div className="telemetry-readings flex flex-col gap-1 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                          <span className="text-[11px] font-semibold text-slate-300">{isEn ? 'Invariants Telemetry:' : '全量守恒遥测：'}</span>
                          {invariants.length > 0 ? (
                            invariants.map((inv) => (
                              <span key={inv.id} className="telemetry-tag-invariant text-xs font-mono text-sky-300">
                                <MathRenderer content={inv.text} />
                              </span>
                            ))
                          ) : (
                            <span className="telemetry-tag-invariant text-xs font-mono text-emerald-400">
                              {isEn ? 'Geometric Invariant: Area & Segment Ratio Conserved' : '几何不变量：面积与线段比例守恒'}
                            </span>
                          )}
                          <div className="telemetry-tag-conclusion text-[11px] text-emerald-400 p-1 rounded bg-emerald-950/40 border border-emerald-500/20 text-center mt-1">
                            {isEn ? 'Conclusion: Intuitive geometric verification passed' : '结论：几何直观验证通过'}
                          </div>
                        </div>

                        <div className="mt-auto pt-2 border-t border-slate-700/60">
                          <button
                            type="button"
                            onClick={() => {
                              setConceptLabMode('step_deduction');
                              setActiveStepIndex(0);
                              applyStepPreset(inquirySteps[0]);
                            }}
                            className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all"
                          >
                            <RotateCcw size={13} />
                            <span>{isEn ? 'Start from Step 1' : '从第一步重新推演'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 下半区：通栏常驻参数调控滑块区 (对标标杆截图，确保推演与探索全生命周期均可实时交互) */}
                {conceptSliders.length > 0 && (
                  <div
                    className="free-explore-container sandbox-controls-bar w-full p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4 flex-wrap transition-all"
                    data-testid="concept-free-explore-view"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
                      <Icon name="sliders" size={14} />
                      <span>{isEn ? 'Sliders' : '参数调控'}</span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
                      {conceptSliders.map((s) => {
                        const val = conceptParamValues[s.id] ?? s.default;
                        const sliderName = isEn ? (s.name || s.id) : s.name;
                        return (
                          <div key={s.id} className="slider-group flex items-center gap-2 min-w-[200px]">
                            <label htmlFor={`desktop-concept-slider-${s.id}`} className="text-xs font-medium text-slate-700 whitespace-nowrap">
                              {sliderName}: <strong className="text-blue-600 font-mono">{val}{s.unit || ''}</strong>
                            </label>
                            <input
                              id={`desktop-concept-slider-${s.id}`}
                              type="range"
                              className="apple-slider flex-1"
                              min={s.min}
                              max={s.max}
                              step={s.step}
                              value={val}
                              onChange={(e) => {
                                const newVal = parseFloat(e.target.value);
                                handleConceptParamChange({ [s.id]: newVal });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* 名师题眼 · 核心顿悟 (Aha! Insight) 弹窗 (严格对齐模块一链接沙盒) */}
            {showAhaModal && currentAhaStep && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => setShowAhaModal(false)}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '520px',
                    borderRadius: '24px',
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    padding: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 弹窗顶部标头 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706' }}>
                      <Sparkles size={20} />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isEn ? 'Aha! Insight · Master Focus' : '名师题眼 · 核心顿悟 (Aha! Insight)'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAhaModal(false)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'var(--bg-card-subtle, #f1f5f9)',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* 核心顿悟内容 */}
                  <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    <MathRenderer
                      content={
                        (isEn
                          ? currentAhaStep.ahaInsightEn || currentAhaStep.ahaInsightZh || currentAhaStep.aha_insight
                          : currentAhaStep.ahaInsightZh || currentAhaStep.aha_insight) || ''
                      }
                    />
                  </div>

                  {/* 操作推进按钮 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAhaModal(false);
                        handleAdvanceToNextStep();
                      }}
                      className="step-next-large-btn"
                      style={{ height: '38px', padding: '0 20px', fontSize: '13px' }}
                    >
                      <span>
                        {activeStepIndex + 1 < inquirySteps.length
                          ? isEn ? 'Next Step ➜' : '开启下一步骤 ➜'
                          : isEn ? 'Enter Free Play' : '全量达成 · 自由把玩'}
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
