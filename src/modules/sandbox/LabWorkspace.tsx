import React, { useState, useMemo, useEffect } from 'react';
import { SandboxRenderer } from './SandboxRenderer';
import { LeapLab } from './LeapLab';
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
  { val: 1, label: '上学期' },
  { val: 2, label: '下学期' },
] as const;

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
  // 默认开启 4D 跃迁实验室 (旗舰手拉手模型)
  const [internalSubView, setInternalSubView] = useState<"concept_sandbox" | "leap_4d">("leap_4d");
  const [selectedSandboxId, setSelectedSandboxId] = useState<string>(effectiveSandboxes[0]?.id || "");
  const [internalLeapId, setInternalLeapId] = useState<string>(
    effectiveLeapModels.find((m) => m.model_id.includes('9A-19') || m.model_name_zh.includes('手拉手'))?.model_id ||
    'LM-9A-19'
  );

  const labSubView = controlledLabSubView ?? internalSubView;
  const setLabSubView = onLabSubViewChange ?? setInternalSubView;
  const selectedLeapModelId = controlledLeapId ?? internalLeapId;
  const setSelectedLeapModelId = onSelectLeapModelId ?? setInternalLeapId;

  // 概念沙盒 4 级抽屉盒状态
  const [isConceptDrawerOpen, setIsConceptDrawerOpen] = useState<boolean>(false);
  const [conceptSearchQuery, setConceptSearchQuery] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<number>(8);
  const [filterSemester, setFilterSemester] = useState<number>(1);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [invariants, setInvariants] = useState<Array<{ id: string; text: string; isConstant: boolean }>>([]);

  // 当前激活的概念沙盒
  const currentSandbox = useMemo(() => {
    return effectiveSandboxes.find((s) => s.id === selectedSandboxId) || effectiveSandboxes[0];
  }, [effectiveSandboxes, selectedSandboxId]);

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
            name: String(s.name || s.nameZh || s.id),
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
      { id: 'scale', name: '几何缩放', min: 0.5, max: 2.5, default: 1.0, step: 0.1, unit: '' },
    ];
  }, [currentSandbox]);

  // 概念沙盒参数值状态管理
  const [conceptParamValues, setConceptParamValues] = useState<Record<string, number>>({});

  // 切换沙盒时重置为初始默认值
  useEffect(() => {
    const initial: Record<string, number> = {};
    conceptSliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setConceptParamValues(initial);
  }, [currentSandbox?.id, conceptSliders]);

  const handleSelectSandbox = (id: string) => {
    setSelectedSandboxId(id);
    setIsConceptDrawerOpen(false);
    setConceptSearchQuery('');
  };

  return (
    <div className="sandbox-stage-wrapper">
      <div className="workspace-stage-card">
        {/* 顶部统一实验室切换器 */}
        <div className="sandbox-top-bar">
          <div className="stage-segmented-control">
            <button
              type="button"
              onClick={() => setLabSubView("leap_4d")}
              className={`seg-item ${labSubView === "leap_4d" ? "active" : ""}`}
            >
              <Icon name="rocket" size={13} className="seg-icon" />
              <span>4D 跃迁模型 (实验室二 · {effectiveLeapModels.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLabSubView("concept_sandbox")}
              className={`seg-item ${labSubView === "concept_sandbox" ? "active" : ""}`}
            >
              <Icon name="flask" size={13} className="seg-icon" />
              <span>概念具象沙盒 (实验室一 · {effectiveSandboxes.length})</span>
            </button>
          </div>

          {/* 概念沙盒模式下的顶部模型抽屉入口 */}
          {labSubView === "concept_sandbox" && (
            <button
              type="button"
              className="model-drawer-trigger-btn"
              onClick={() => setIsConceptDrawerOpen(!isConceptDrawerOpen)}
            >
              <Icon name="menu" size={13} />
              <span>选择沙盒: {currentSandbox?.nameZh || currentSandbox?.id}</span>
              <Icon name={isConceptDrawerOpen ? "chevron-up" : "chevron-down"} size={13} />
            </button>
          )}
        </div>

        {/* 概念沙盒 4 级抽屉盒选择面板 */}
        {labSubView === "concept_sandbox" && isConceptDrawerOpen && (
          <div className="model-drawer-panel" style={{ marginBottom: '10px' }}>
            {/* 顶部搜索条 */}
            <div className="drawer-search-wrapper">
              <div className="drawer-search-input-box">
                <Icon name="search" size={14} style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={conceptSearchQuery}
                  onChange={(e) => setConceptSearchQuery(e.target.value)}
                  placeholder="搜索 46 个概念沙盒 (如 一次函数 / 勾股 / 反比例)..."
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
                    ① 年级:
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
                        {g}年级
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2 级：学期选择 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    ② 学期:
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
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3 级：课程 / 知识模块 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    ③ 课程模块:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`drawer-sem-chip ${filterCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterCategory('all')}
                    >
                      全部模块
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`drawer-sem-chip ${filterCategory === cat ? 'active' : ''}`}
                        onClick={() => setFilterCategory(cat)}
                      >
                        {cat}
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
                        <span className="drawer-card-sem">{s.grade}年级{s.semester === 1 ? '上' : '下'}</span>
                        {isSelected && <Icon name="check" size={12} style={{ color: 'var(--ios-blue)', marginLeft: 'auto' }} />}
                      </div>
                      <div className="drawer-card-name">{s.nameZh}</div>
                      <div className="drawer-card-brief">{s.desc || '动态几何与参数不变量探究'}</div>
                    </button>
                  );
                })
              ) : (
                <div className="drawer-empty-tip">未检索到匹配的概念沙盒</div>
              )}
            </div>
          </div>
        )}

        {/* 主舞台展示区 */}
        {labSubView === "leap_4d" ? (
          <LeapLab
            modelId={selectedLeapModelId}
            onSelectModelId={setSelectedLeapModelId}
            allModels={effectiveLeapModels}
            locale={locale}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {/* 概念沙盒标题栏 */}
            <div className="sandbox-header-line">
              <h3 className="sandbox-title-text">
                <span>{currentSandbox.nameZh}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  ({currentSandbox.id} · 考点具象沙盒)
                </span>
              </h3>

              <div className="tier-pill-group">
                <span className="nav-pill-btn active">概念具象化</span>
                <span className="nav-pill-btn">视口阻尼锁定</span>
              </div>
            </div>

            {/* 85% Canvas + 15% Telemetry */}
            <div className="sandbox-split-box">
              <div className="sandbox-viewport-85">
                <SandboxRenderer
                  key={currentSandbox.id}
                  config={currentSandbox.config}
                  paramValues={conceptParamValues}
                  onInvariantsChange={setInvariants}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              <div className="sandbox-guide-15">
                <div className="telemetry-readings">
                  <span className="telemetry-tag-invariant">
                    几何不变量：{invariants[0]?.text || '面积与线段比例守恒'}
                  </span>
                  <span className="telemetry-tag-secondary">
                    状态：{invariants[0]?.isConstant ? '[绝对恒定]' : '[动态观测中]'}
                  </span>
                </div>
                <div className="telemetry-tag-conclusion">
                  结论：几何直观验证通过
                </div>
              </div>
            </div>

            {/* 极简控制条 (动态渲染苹果极简白滑块) */}
            <div className="sandbox-controls-bar">
              <div style={{ display: 'flex', gap: '20px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                {conceptSliders.map((s) => {
                  const val = conceptParamValues[s.id] ?? s.default;
                  return (
                    <div key={s.id} className="slider-group">
                      <label htmlFor={`concept-slider-${s.id}`} style={{ whiteSpace: 'nowrap' }}>
                        {s.name}: <strong style={{ color: 'var(--ios-blue)' }}>{val}{s.unit || ''}</strong>
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
                <span>探究指南：</span>
              </div>
              <p style={{ margin: 0 }}>
                {currentSandbox.desc || '拖动控制条中的参数滑块或画布动点，实时观察函数曲线与几何图形的变化特征。'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
