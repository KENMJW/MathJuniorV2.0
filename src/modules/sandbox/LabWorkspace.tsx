import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SandboxRenderer } from './SandboxRenderer';
import { LeapLab, SEMESTER_CONFIG as LEAP_SEMESTER_CONFIG, formatSemester } from './LeapLab';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
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
}

const GRADES = [7, 8, 9] as const;
const SEMESTERS = [
  { val: 1, label: '上学期', labelEn: 'Sem 1' },
  { val: 2, label: '下学期', labelEn: 'Sem 2' },
] as const;

const CATEGORY_NAME_EN: Record<string, string> = {
  '实数与数轴': 'Real Numbers & Number Line',
  '实数与运算': 'Real Numbers & Operations',
  '整式与全等三角形': 'Polynomials & Congruence',
  '一次函数与二次根式': 'Linear Functions & Radicals',
  '勾股定理与四边形': 'Pythagorean & Quadrilaterals',
  '二次函数与圆': 'Quadratic Functions & Circles',
  '相似与锐角三角函数': 'Similarity & Trigonometry',
  '概念具象': 'Concept Models',
};

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
}) => {
  const isEn = String(locale).toLowerCase().startsWith('en');
  // 默认开启概念具象沙盒 (实验室一)
  const [internalSubView, setInternalSubView] = useState<"concept_sandbox" | "leap_4d">("concept_sandbox");
  const [selectedSandboxId, setSelectedSandboxId] = useState<string>(
    effectiveSandboxes.find((s) => s.id === 'SB-KP001')?.id ||
    effectiveSandboxes.find((s) => s.grade === 7 && s.semester === 1)?.id ||
    effectiveSandboxes[0]?.id ||
    ""
  );
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

  // 抽屉盒状态
  const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState<boolean>(false);
  const [isLeapDrawerOpen, setIsLeapDrawerOpen] = useState<boolean>(false);
  const [conceptSearchQuery, setConceptSearchQuery] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<number>(7);
  const [filterSemester, setFilterSemester] = useState<number>(1);
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  // 提取当前年级+学期下涵盖的所有课程子分类
  const availableCategories = useMemo(() => {
    const list = enrichedSandboxes.filter(
      (s) => s.grade === filterGrade && s.semester === filterSemester
    );
    const cats = Array.from(new Set(list.map((s) => s.subcategory)));
    return cats;
  }, [enrichedSandboxes, filterGrade, filterSemester]);

  // 概念沙盒 4 级筛选结果
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
      const matchSem = s.semester === filterSemester;
      const matchCat = filterCategory === 'all' || s.subcategory === filterCategory;
      return matchGrade && matchSem && matchCat;
    });
  }, [enrichedSandboxes, filterGrade, filterSemester, filterCategory, conceptSearchQuery]);

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

  // 概念沙盒参数值状态管理
  const [conceptParamValues, setConceptParamValues] = useState<Record<string, number>>({});
  const [sandboxResetCount, setSandboxResetCount] = useState<number>(0);
  const [isViewportLocked, setIsViewportLocked] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  // 概念沙盒重置为标准基准态
  const handleResetConcept = useCallback(() => {
    const initial: Record<string, number> = {};
    conceptSliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setConceptParamValues(initial);
    setSandboxResetCount((prev) => prev + 1);
    setToastMessage(isEn ? 'Restored standard benchmark state' : '已恢复考点标准具象态');
    setTimeout(() => setToastMessage(''), 2000);
  }, [conceptSliders, isEn]);

  // 视口阻尼锁定开关与复位
  const handleToggleViewportLock = useCallback(() => {
    setIsViewportLocked((prev) => !prev);
    setSandboxResetCount((prev) => prev + 1);
    setToastMessage(
      !isViewportLocked
        ? (isEn ? 'Viewport lock enabled' : '视口阻尼保护已锁定')
        : (isEn ? 'Viewport free mode enabled' : '视口已开启自由漫游模式')
    );
    setTimeout(() => setToastMessage(''), 2000);
  }, [isViewportLocked, isEn]);

  // 双向动点参数回写
  const handleConceptParamChange = useCallback((patch: Record<string, number>) => {
    setConceptParamValues((prev) => ({ ...prev, ...patch }));
  }, []);

  // 切换沙盒时重置为初始默认值
  useEffect(() => {
    const initial: Record<string, number> = {};
    conceptSliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setConceptParamValues(initial);
  }, [currentSandbox?.id, conceptSliders]);

  const [leapSearchQuery, setLeapSearchQuery] = useState<string>('');
  const [leapSelectedSem, setLeapSelectedSem] = useState<string>(
    currentLeapModel?.unlocked_semester || '8A'
  );

  useEffect(() => {
    if (currentLeapModel?.unlocked_semester) {
      setLeapSelectedSem(currentLeapModel.unlocked_semester);
    }
  }, [currentLeapModel?.model_id, currentLeapModel?.unlocked_semester]);

  const leapModelsBySemester = useMemo(() => {
    const map: Record<string, any[]> = {
      '7A': [],
      '7B': [],
      '8A': [],
      '8B': [],
      '9A': [],
      '9B': [],
    };
    effectiveLeapModels.forEach((m) => {
      const sem = m.unlocked_semester || '8A';
      if (!map[sem]) map[sem] = [];
      if (!map[sem].some((existing) => existing.model_id === m.model_id)) {
        map[sem].push(m);
      }
    });
    return map;
  }, [effectiveLeapModels]);

  const filteredLeapModels = useMemo(() => {
    const q = leapSearchQuery.trim().toLowerCase();
    if (!q) {
      return leapModelsBySemester[leapSelectedSem] || [];
    }
    return effectiveLeapModels.filter((m) => {
      const idMatch = m.model_id.toLowerCase().includes(q);
      const nameZhMatch = (m.model_name_zh || '').toLowerCase().includes(q);
      const nameEnMatch = (m.model_name_en || '').toLowerCase().includes(q);
      const briefZhMatch = (m.model_brief_zh || '').toLowerCase().includes(q);
      return idMatch || nameZhMatch || nameEnMatch || briefZhMatch;
    });
  }, [effectiveLeapModels, leapModelsBySemester, leapSelectedSem, leapSearchQuery]);

  const handleSelectLeapModel = (modelId: string) => {
    setSelectedLeapModelId(modelId);
    setIsLeapDrawerOpen(false);
    setLeapSearchQuery('');
    const stage = document.querySelector('.workspace-stage-card') || document.querySelector('.sandbox-stage-wrapper');
    if (stage) {
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectSandbox = (id: string) => {
    setSelectedSandboxId(id);
    setIsConceptDrawerOpen(false);
    setConceptSearchQuery('');
    setConceptParamValues({});
    setInvariants([]);
    const stage = document.querySelector('.workspace-stage-card') || document.querySelector('.sandbox-stage-wrapper');
    if (stage) {
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleConceptDrawer = () => {
    setIsConceptDrawerOpen((prev) => !prev);
    setIsLeapDrawerOpen(false);
  };

  const toggleLeapDrawer = () => {
    setIsLeapDrawerOpen((prev) => !prev);
    setIsConceptDrawerOpen(false);
  };

  return (
    <div className="sandbox-stage-wrapper">
      <div className="workspace-stage-card">
        {/* 顶部统一实验室切换器与抽屉选择面板 - 吸顶固定常驻 */}
        <div
          className={`sandbox-sticky-header-container ${(isConceptDrawerOpen || isLeapDrawerOpen) ? 'drawer-open' : ''}`}
        >
          <div className="sandbox-top-bar">
            <div className="stage-segmented-control">
              <button
                type="button"
                onClick={() => {
                  setLabSubView("concept_sandbox");
                  setIsLeapDrawerOpen(false);
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
                  setIsConceptDrawerOpen(false);
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
                          onClick={() => {
                            setFilterGrade(g);
                            setFilterCategory('all');
                          }}
                        >
                          {isEn ? `Grade ${g}` : `${g}年级`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2 级：学期选择 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {isEn ? '② Semester:' : '② 学期:'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {SEMESTERS.map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          className={`drawer-sem-chip ${filterSemester === s.val ? 'active' : ''}`}
                          onClick={() => {
                            setFilterSemester(s.val);
                            setFilterCategory('all');
                          }}
                        >
                          {isEn ? s.labelEn : s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3 级：课程 / 知识模块 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {isEn ? '③ Category:' : '③ 课程模块:'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`drawer-sem-chip ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                      >
                        {isEn ? 'All Categories' : '全部模块'}
                      </button>
                      {availableCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`drawer-sem-chip ${filterCategory === cat ? 'active' : ''}`}
                          onClick={() => setFilterCategory(cat)}
                        >
                          {isEn ? (CATEGORY_NAME_EN[cat] || cat) : cat}
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

              {/* 1 级：年级学期选择标签 */}
              {!leapSearchQuery && (
                <div className="drawer-sem-tabs">
                  {LEAP_SEMESTER_CONFIG.map((cfg) => {
                    const count = leapModelsBySemester[cfg.key]?.length || 0;
                    const active = leapSelectedSem === cfg.key;
                    return (
                      <button
                        key={cfg.key}
                        type="button"
                        className={`drawer-sem-chip ${active ? 'active' : ''}`}
                        onClick={() => setLeapSelectedSem(cfg.key)}
                      >
                        <span>{isEn ? cfg.labelEn : cfg.label}</span>
                        <span className="drawer-sem-count">({count})</span>
                      </button>
                    );
                  })}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {/* 概念沙盒标题栏 */}
            <div className="sandbox-header-line">
              <h3 className="sandbox-title-text">
                <span>{(isEn ? currentSandbox.nameEn : currentSandbox.nameZh) || currentSandbox.nameZh}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  ({currentSandbox.id} · {isEn ? 'Concept Sandbox' : '考点具象沙盒'})
                </span>
              </h3>

              <div className="tier-pill-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  data-testid="badge-concept-concrete"
                  onClick={handleResetConcept}
                  title={isEn ? 'Click to restore standard benchmark state' : '点击恢复当前考点的标准具象基准态'}
                  className="nav-pill-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    height: '26px',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(0, 113, 227, 0.08)',
                    color: 'var(--ios-blue, #0071e3)',
                    border: '1px solid rgba(0, 113, 227, 0.25)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Icon name="check-circle" size={11} />
                  <span>{isEn ? 'Concept Benchmark' : '概念具象化'}</span>
                </button>
                <button
                  type="button"
                  data-testid="badge-viewport-locked"
                  onClick={handleToggleViewportLock}
                  title={
                    isViewportLocked
                      ? (isEn ? 'Viewport damping locked, click to reset' : '视口物理阻尼锁定中，点击复位并居中')
                      : (isEn ? 'Viewport free, click to lock' : '视口自由缩放中，点击重新锁定阻尼')
                  }
                  className="nav-pill-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    height: '26px',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: isViewportLocked ? 'rgba(52, 199, 89, 0.08)' : 'var(--bg-card-subtle)',
                    color: isViewportLocked ? '#2e7d32' : 'var(--text-secondary)',
                    border: isViewportLocked ? '1px solid rgba(52, 199, 89, 0.25)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Icon name={isViewportLocked ? 'lock' : 'unlock'} size={11} />
                  <span>{isViewportLocked ? (isEn ? 'Viewport Locked' : '视口阻尼锁定') : (isEn ? 'Viewport Free' : '视口自由漫游')}</span>
                </button>
              </div>
            </div>

            {/* 85% Canvas + 15% Telemetry */}
            <div className="sandbox-split-box" style={{ position: 'relative' }}>
              {toastMessage && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '5px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 500,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    zIndex: 30,
                    pointerEvents: 'none',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {toastMessage}
                </div>
              )}
              <div className="sandbox-viewport-85">
                <SandboxRenderer
                  key={`${currentSandbox.id}-${sandboxResetCount}`}
                  config={currentSandbox.config}
                  paramValues={conceptParamValues}
                  onInvariantsChange={setInvariants}
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
                          setConceptParamValues((prev) => ({ ...prev, [s.id]: newVal }));
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
        )}
      </div>
    </div>
  );
};
