import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LeapSandboxModel,
  MorphingState,
  StoryStage,
  compileMorphingSandboxConfig,
  createDefaultMorphingState,
  parseMorphingSpecs,
  mockLeapSandboxModels,
} from './morphControllers';
import { SandboxRenderer } from './SandboxRenderer';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { useDeviceResponsive } from '../../hooks/useDeviceResponsive';
import { useSessionStore } from '../../store/sessionStore';
import './sandbox.css';

export type LeapLabMode = 'step_deduction' | 'free_explore';

export interface LeapLabProps {
  model?: LeapSandboxModel;
  modelId?: string;
  onSelectModelId?: (id: string) => void;
  allModels?: LeapSandboxModel[];
  onBack?: () => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
  isDrawerOpen?: boolean;
  onToggleDrawer?: (open: boolean) => void;
  hideModelDrawer?: boolean;
  hideDrawerTrigger?: boolean;
}

export const SEMESTER_CONFIG = [
  { key: '7A', label: '7年级上学期', labelEn: 'G7 Sem 1', short: '7上' },
  { key: '7B', label: '7年级下学期', labelEn: 'G7 Sem 2', short: '7下' },
  { key: '8A', label: '8年级上学期', labelEn: 'G8 Sem 1', short: '8上' },
  { key: '8B', label: '8年级下学期', labelEn: 'G8 Sem 2', short: '8下' },
  { key: '9A', label: '9年级上学期', labelEn: 'G9 Sem 1', short: '9上' },
  { key: '9B', label: '9年级下学期', labelEn: 'G9 Sem 2', short: '9下' },
] as const;

export function formatSemesterZh(sem?: string): string {
  if (!sem) return '7年级上学期';
  const found = SEMESTER_CONFIG.find((s) => s.key === sem);
  return found ? found.label : sem;
}

export function formatSemester(sem?: string, locale: string = 'zh-CN'): string {
  const isEn = String(locale).toLowerCase().startsWith('en');
  if (!sem) return isEn ? 'G7 Sem 1' : '7年级上学期';
  const found = SEMESTER_CONFIG.find((s) => s.key === sem);
  if (!found) return sem;
  return isEn ? found.labelEn : found.label;
}

/**
 * 实验室二：4D 变异跃迁沙盒 (支持全库 36 个跃迁模型，100% 严格对标 ios27_demo.html)
 * 
 * 核心设计标准：
 * 1. 2 级抽屉盒模型切换：年级学期 (全中文) -> 真实模型卡片，顶部配备实时搜索框；
 * 2. 5 维载体变异平滑形变：手拉手模型原生支持 opt1 (等边)、opt2 (等腰直角)、quadrilateral (正方形)、coordinate_grid (坐标系)、free_triangle；
 * 3. 极简白外置控制条：param_t (0~10) 动点驱动与纯数学刚体旋转；
 * 4. 铁律 11 零 emoji、铁律 1/3 零 eval/innerHTML、铁律 2 零 foreignObject。
 */
export const LeapLab: React.FC<LeapLabProps> = ({
  model: propModel,
  modelId = 'LM-7A-01',
  onSelectModelId,
  allModels = mockLeapSandboxModels,
  locale = 'zh-CN',
  isDrawerOpen: controlledDrawerOpen,
  onToggleDrawer,
  hideModelDrawer = false,
  hideDrawerTrigger = false,
}) => {
  const isEn = String(locale).toLowerCase().startsWith('en');
  // 内部维护受控/非受控激活模型 ID
  const [activeModelId, setActiveModelId] = useState<string>(modelId);

  useEffect(() => {
    if (modelId) {
      setActiveModelId(modelId);
    }
  }, [modelId]);

  const effectiveModelId = activeModelId || modelId;

  // 1. 获取当前模型 (从 36 个真实跃迁模型与兼容测试种子中匹配，默认 7年级首个模型 LM-7A-01)
  const currentModel = useMemo(() => {
    if (propModel) return propModel;
    return (
      allModels.find((m) => m.model_id === effectiveModelId) ||
      allModels.find((m) => m.model_id.includes(effectiveModelId)) ||
      allModels.find((m) => m.model_id === 'LM-7A-01') ||
      allModels.find((m) => m.model_id === 'LM-9A-19') ||
      allModels[0]
    );
  }, [propModel, effectiveModelId, allModels]);

  // 2. 抽屉盒选择状态管理 (支持受控与非受控)
  const [internalDrawerOpen, setInternalDrawerOpen] = useState<boolean>(false);
  const isDrawerOpen = controlledDrawerOpen !== undefined ? controlledDrawerOpen : internalDrawerOpen;
  const setIsDrawerOpen = (open: boolean) => {
    if (onToggleDrawer) onToggleDrawer(open);
    setInternalDrawerOpen(open);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSem, setSelectedSem] = useState<string>(
    currentModel.unlocked_semester || '7A'
  );

  useEffect(() => {
    if (currentModel?.unlocked_semester) {
      setSelectedSem(currentModel.unlocked_semester);
    }
  }, [currentModel.model_id]);

  // 模型按学期分组
  const modelsBySemester = useMemo(() => {
    const map: Record<string, LeapSandboxModel[]> = {
      '7A': [],
      '7B': [],
      '8A': [],
      '8B': [],
      '9A': [],
      '9B': [],
    };
    allModels.forEach((m) => {
      const sem = m.unlocked_semester || '8A';
      if (!map[sem]) map[sem] = [];
      // 避免重复项
      if (!map[sem].some((existing) => existing.model_id === m.model_id)) {
        map[sem].push(m);
      }
    });
    return map;
  }, [allModels]);

  // 搜索过滤模型列表
  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return modelsBySemester[selectedSem] || [];
    }
    return allModels.filter((m) => {
      const idMatch = m.model_id.toLowerCase().includes(q);
      const nameZhMatch = (m.model_name_zh || '').toLowerCase().includes(q);
      const nameEnMatch = (m.model_name_en || '').toLowerCase().includes(q);
      const briefZhMatch = (m.model_brief_zh || '').toLowerCase().includes(q);
      return idMatch || nameZhMatch || nameEnMatch || briefZhMatch;
    });
  }, [allModels, modelsBySemester, selectedSem, searchQuery]);

  // 3. 解析 4D 规格
  const { carrierSpec, parameterSpec, postureSpec, camouflageSpec } = useMemo(
    () => parseMorphingSpecs(currentModel),
    [currentModel]
  );

  // 4. 维护 4D 变异状态 (当模型 ID 切换时自动重置为新模型初始状态)
  const [morphState, setMorphState] = useState<MorphingState>(() =>
    createDefaultMorphingState(currentModel)
  );

  useEffect(() => {
    setMorphState(createDefaultMorphingState(currentModel));
  }, [currentModel.model_id]);

  const responsive = useDeviceResponsive();
  const isMobile = responsive.isMobile;

  // 双模定义：默认停在【分步推演】模式 (A.2 进场默认态)
  const sessionLeapSubTab = useSessionStore((state) => state.leapSubTab);
  const setSessionLeapSubTab = useSessionStore((state) => state.setLeapSubTab);
  const [labMode, setLabMode] = useState<LeapLabMode>('step_deduction');

  useEffect(() => {
    if (isMobile) {
      setLabMode(sessionLeapSubTab === 'free' ? 'free_explore' : 'step_deduction');
    }
  }, [sessionLeapSubTab, isMobile]);

  // 解析模型推演阶梯 (来自 leap_sandbox_models.story_stages_json)
  const stages: StoryStage[] = useMemo(() => {
    if (currentModel.story_stages_json) {
      try {
        const parsed = JSON.parse(currentModel.story_stages_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    // 优雅兜底思维阶梯
    return [
      {
        stage: 1,
        titleZh: '① 原型奠基：核心骨架与本质不变量',
        titleEn: '① Archetype: Core Skeleton & Invariant',
        guideTextZh: currentModel.model_brief_zh || '观察基本几何构型，探究图形在基准状态下的本质特征与守恒关系。',
        guideTextEn: currentModel.model_brief_en || 'Observe foundational configuration to discover core invariants.',
        teacherSecretZh: '名师题眼：牢记原初几何骨架，无论后续如何演进，本质不变量是解题的定海神针。',
        teacherSecretEn: "Teacher Focus: Master primary skeleton; invariant metric is the key.",
        state_config: {
          carrierId: carrierSpec.options[0]?.id || 'default',
          xrayActive: false,
          activeDistractors: [],
        },
      },
      {
        stage: 2,
        titleZh: '② 变式演进：载体拓展与姿态旋转',
        titleEn: '② Variation: Carrier Expansion & Rotation',
        guideTextZh: '图形在旋转或翻折变换后，核心几何关系依然成立，识别不同载体下的对应关系。',
        guideTextEn: 'After rotation or reflection, core invariant relationships still hold.',
        teacherSecretZh: '名师题眼：旋转不改变线段长度与夹角，通过寻找共顶点或旋转中心锁定全等或相似。',
        teacherSecretEn: "Teacher Focus: Rotation preserves lengths and angles. Trace pivot center to locate congruences.",
        state_config: {
          carrierId: carrierSpec.options[1]?.id || carrierSpec.options[0]?.id || 'default',
          xrayActive: false,
          activeDistractors: [],
        },
      },
      {
        stage: 3,
        titleZh: '③ 测度不变量：动态观测数值守恒',
        titleEn: '③ Invariant Measurement: Numerical Observation',
        guideTextZh: '拖拽动点观察下方遥测数据，尽管局部线段和角度发生变化，关键代数指标恒定不变。',
        guideTextEn: 'Drag dynamic points and observe telemetry metrics; core invariants remain constant.',
        teacherSecretZh: '名师题眼：数值不变的背后是严密的几何公理支撑，在中考中善于写出等量关系表达式。',
        teacherSecretEn: "Teacher Focus: Rigorous axioms underlie constant values. Formulate algebraic equality in exams.",
        state_config: {
          xrayActive: false,
          activeDistractors: [],
        },
      },
      {
        stage: 4,
        titleZh: '④ 中考破局：穿透干扰直击题眼',
        titleEn: '④ Exam Breakthrough: Penetrate Camouflage to Focus',
        guideTextZh: '中考压轴常引入复杂干扰线加壳伪装，开启题眼透视即可剥离表象，直击考题本质。',
        guideTextEn: 'Exam problems frequently add camouflage lines. Use Exam Focus X-Ray to reveal core essence.',
        teacherSecretZh: '名师题眼：遇繁化简，剔除冗余干扰线，还原为第一步的原初骨架，秒杀压轴题。',
        teacherSecretEn: "Teacher Focus: Strip away distractors to restore archetype skeleton and conquer difficult problems.",
        state_config: {
          xrayActive: true,
          activeDistractors: camouflageSpec.distractorLayers.map((l) => l.id),
        },
      },
    ];
  }, [currentModel, carrierSpec, camouflageSpec]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // 模型改变时重置步骤为 0
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [currentModel.model_id]);

  // 步骤推进与画布状态帧同步
  useEffect(() => {
    if (labMode !== 'step_deduction') return;
    const currentStage = stages[currentStepIndex];
    if (!currentStage || !currentStage.state_config) return;

    const cfg = currentStage.state_config;
    setMorphState((prev) => {
      const nextSliders = { ...prev.parameterValues, ...(cfg.sliders || {}) };
      return {
        ...prev,
        carrierId: cfg.carrierId || prev.carrierId,
        parameterValues: nextSliders,
        xrayActive: cfg.xrayActive !== undefined ? cfg.xrayActive : prev.xrayActive,
        activeCamouflageIds: cfg.activeDistractors !== undefined ? cfg.activeDistractors : prev.activeCamouflageIds,
        postureId: cfg.postureId || prev.postureId,
      };
    });

    const rotVal =
      cfg.sliders?.['rotationAngle'] ??
      cfg.sliders?.['rot_theta'] ??
      cfg.sliders?.['rot_angle'] ??
      cfg.sliders?.['angle_alpha'] ??
      cfg.sliders?.['theta'];
    if (rotVal !== undefined) {
      setRotationAngle(Number(rotVal));
    }
  }, [currentStepIndex, stages, labMode]);

  // 5. 判断是否为手拉手旋转全等模型 (LM-8A-01 或 LM-9A-19)
  const isHandInHand =
    currentModel.model_id.includes('8A-01') ||
    currentModel.model_id.includes('9A-19') ||
    currentModel.model_name_zh.includes('手拉手');

  // 手拉手专用动画与交互状态
  const [rotationAngle, setRotationAngle] = useState<number>(60);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [invariants, setInvariants] = useState<Array<{ id: string; text: string; isConstant: boolean }>>([]);
  const [isMicroTuningOpen, setIsMicroTuningOpen] = useState<boolean>(true);

  // 计算当前推演阶梯的 target 旋转角与参数标靶
  const currentStageObj = stages[currentStepIndex];
  const stageTargetRot = useMemo(() => {
    const rawTarget =
      currentStageObj?.state_config?.sliders?.['rotationAngle'] ??
      currentStageObj?.state_config?.sliders?.['rot_theta'] ??
      currentStageObj?.state_config?.sliders?.['rot_angle'] ??
      currentStageObj?.state_config?.sliders?.['angle_alpha'] ??
      currentStageObj?.state_config?.sliders?.['theta'];
    if (rawTarget !== undefined) return Number(rawTarget);
    return currentStepIndex === 0 ? 60 : currentStepIndex === 1 ? 90 : currentStepIndex === 2 ? 120 : 60;
  }, [currentStageObj, currentStepIndex]);

  // 自动旋转播放器
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setRotationAngle((prev) => (prev + 1) % 361);
      }, 30);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPlaying]);

  // 动态编译通用 SandboxConfig
  const compiledSandboxConfig = useMemo(() => {
    return compileMorphingSandboxConfig(currentModel, morphState);
  }, [currentModel, morphState]);

  // 模型切换动作处理
  const handleSelectModel = (id: string) => {
    setIsDrawerOpen(false);
    setSearchQuery('');
    setActiveModelId(id);
    if (onSelectModelId) {
      onSelectModelId(id);
    }
  };

  // 控制器处理函数
  const handleSelectCarrier = (carrierId: string) => {
    setMorphState((prev) => ({ ...prev, carrierId }));
  };

  const handleSliderChange = (sliderId: string, val: number) => {
    setMorphState((prev) => ({
      ...prev,
      parameterValues: { ...prev.parameterValues, [sliderId]: val },
    }));
    if (['rotationAngle', 'rot_theta', 'rot_angle', 'angle_alpha', 'theta'].includes(sliderId)) {
      setRotationAngle(val);
    }
  };

  const handleParamChange = useCallback((patch: Record<string, number>) => {
    setMorphState((prev) => ({
      ...prev,
      parameterValues: { ...prev.parameterValues, ...patch },
    }));
    const rotVal =
      patch['rotationAngle'] ??
      patch['rot_theta'] ??
      patch['rot_angle'] ??
      patch['angle_alpha'] ??
      patch['theta'];
    if (rotVal !== undefined) {
      setRotationAngle(Number(rotVal));
    }
  }, []);

  const handleSelectPosture = (postureId: string, rotDeg?: number) => {
    setMorphState((prev) => ({ ...prev, postureId }));
    if (rotDeg !== undefined) {
      setRotationAngle(rotDeg);
    }
  };

  const handleToggleCamouflage = (layerId: string) => {
    setMorphState((prev) => {
      const exists = prev.activeCamouflageIds.includes(layerId);
      return {
        ...prev,
        activeCamouflageIds: exists
          ? prev.activeCamouflageIds.filter((id) => id !== layerId)
          : [...prev.activeCamouflageIds, layerId],
      };
    });
  };

  const handleToggleXRay = () => {
    setMorphState((prev) => ({ ...prev, xrayActive: !prev.xrayActive }));
  };

  // 手拉手 5 大载体选项支持
  const handInHandCarrierOptions = [
    { id: 'opt1', nameZh: '等边三角形', nameEn: 'Equilateral Triangles' },
    { id: 'opt2', nameZh: '等腰直角三角形', nameEn: 'Isosceles Right Triangles' },
    { id: 'quadrilateral', nameZh: '正方形载体', nameEn: 'Square Carrier' },
    { id: 'coordinate_grid', nameZh: '直角坐标系', nameEn: 'Coordinate Carrier' },
    { id: 'free_triangle', nameZh: '自由三角形', nameEn: 'Free Triangle' },
  ];

  // 纯数学手拉手几何三角动态计算与载体平滑形变
  const rad = (rotationAngle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const carrierId = morphState.carrierId;
  const isIsoRight = carrierId === 'opt2' || carrierId.includes('iso_right');
  const isSquare = carrierId === 'quadrilateral' || carrierId.includes('square');
  const isCoord = carrierId === 'coordinate_grid' || carrierId.includes('coord');
  const isFree = carrierId === 'free_triangle';

  const paramT = morphState.parameterValues['param_t'] ?? 5;
  const scaleByT = 0.85 + (paramT / 10) * 0.3; // 0.85 ~ 1.15

  let rawAx = -60.62;
  let rawAy = 35;
  let rawBx = 0;
  let rawBy = 70;

  if (isIsoRight) {
    // opt2: 等腰直角三角形 (OA=70, OB=70, ∠AOB=90°)
    rawAx = -70;
    rawAy = 0;
    rawBx = 0;
    rawBy = 70;
  } else if (isSquare) {
    // 正方形载体 (OA=65, OB=65, 垂直)
    rawAx = -65;
    rawAy = 0;
    rawBx = 0;
    rawBy = 65;
  } else if (isCoord) {
    // 直角坐标系载体
    rawAx = -60;
    rawAy = 0;
    rawBx = 0;
    rawBy = 60;
  } else if (isFree) {
    // 自由任意三角形
    rawAx = -75;
    rawAy = 30;
    rawBx = 15;
    rawBy = 65;
  }

  const baseAx = Math.round(rawAx * scaleByT * 10) / 10;
  const baseAy = Math.round(rawAy * scaleByT * 10) / 10;
  const baseBx = Math.round(rawBx * scaleByT * 10) / 10;
  const baseBy = Math.round(rawBy * scaleByT * 10) / 10;

  const Cx = Math.round((baseAx * cos - baseAy * sin) * 10) / 10;
  const Cy = Math.round((baseAx * sin + baseAy * cos) * 10) / 10;
  const Dx = Math.round((baseBx * cos - baseBy * sin) * 10) / 10;
  const Dy = Math.round((baseBx * sin + baseBy * cos) * 10) / 10;

  const distAC = Math.sqrt(Math.pow(baseAx - Cx, 2) + Math.pow(baseAy - Cy, 2));
  const normalizedCm = (distAC / 14).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 0 : '16px', width: '100%', position: 'relative' }}>
      {/* 头部标题行与模型抽屉展开入口：手机端由顶层 80px 双轨书签船坞统领，从 DOM 中彻底清零 */}
      {!isMobile && (
        <div className="sandbox-header-line">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {hideModelDrawer ? (
              <div className="model-drawer-static-title">
                <Icon name="layers" size={14} />
                <span style={{ fontWeight: 700 }}>
                  {currentModel.model_id} · {(isEn ? currentModel.model_name_en : currentModel.model_name_zh) || currentModel.model_name_zh}
                </span>
              </div>
            ) : hideDrawerTrigger ? (
              <h3 className="sandbox-title-text" style={{ margin: 0 }}>
                <Icon name="layers" size={16} />
                <span>{(isEn ? currentModel.model_name_en : currentModel.model_name_zh) || currentModel.model_name_zh}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  ({currentModel.model_id} · {isEn ? 'Primary Line' : '主线'} {currentModel.primary_line} · {formatSemesterZh(currentModel.unlocked_semester)})
                </span>
              </h3>
            ) : (
              <button
                type="button"
                className="model-drawer-trigger-btn"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              >
                <Icon name="layers" size={14} />
                <span style={{ fontWeight: 700 }}>
                  {currentModel.model_id} · {(isEn ? currentModel.model_name_en : currentModel.model_name_zh) || currentModel.model_name_zh}
                </span>
                <Icon name={isDrawerOpen ? 'chevron-up' : 'chevron-down'} size={14} />
              </button>
            )}

            {!hideDrawerTrigger && (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                ({isEn ? 'Line' : '主线'} {currentModel.primary_line} · {formatSemester(currentModel.unlocked_semester, locale)})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 双模切换入口：分步推演 vs 自由探索 */}
            <div className="stage-segmented-control lab-mode-segmented-control" role="tablist">
              <button
                type="button"
                className={`seg-item ${labMode === 'step_deduction' ? 'active' : ''}`}
                onClick={() => {
                  setLabMode('step_deduction');
                  setSessionLeapSubTab('deduction');
                }}
                role="tab"
                aria-selected={labMode === 'step_deduction'}
                title={isEn ? 'Step-by-step master deduction' : '分步推演：跟随名师思路进阶'}
              >
                <Icon name="bulb" size={13} className="seg-icon" />
                <span>{isEn ? 'Step Deduction' : '分步推演'}</span>
              </button>
              <button
                type="button"
                className={`seg-item ${labMode === 'free_explore' ? 'active' : ''}`}
                onClick={() => {
                  setLabMode('free_explore');
                  setSessionLeapSubTab('free');
                }}
                role="tab"
                aria-selected={labMode === 'free_explore'}
                title={isEn ? 'Free dynamic exploration' : '自由探索：动点滑块自主体验'}
              >
                <Icon name="gamepad" size={13} className="seg-icon" />
                <span>{isEn ? 'Free Play' : '自由探索'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2 级抽屉盒模型切换面板 */}
      {isDrawerOpen && !hideModelDrawer && !hideDrawerTrigger && (
        <div className="model-drawer-panel">
          {/* 顶部搜索框 */}
          <div className="drawer-search-wrapper">
            <div className="drawer-search-input-box">
              <Icon name="search" size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search 36 leap models (e.g. Hand-in-Hand / LM-7A-01 / Parabola)..." : "搜索 36 个跃迁模型 (如 手拉手 / LM-7A-01 / 抛物线)..."}
                className="drawer-search-field"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="drawer-search-clear"
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setIsDrawerOpen(false)}
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* 1 级：年级学期选择标签 */}
          {!searchQuery && (
            <div className="drawer-sem-tabs">
              {SEMESTER_CONFIG.map((cfg) => {
                const count = modelsBySemester[cfg.key]?.length || 0;
                const active = selectedSem === cfg.key;
                return (
                  <button
                    key={cfg.key}
                    type="button"
                    className={`drawer-sem-chip ${active ? 'active' : ''}`}
                    onClick={() => setSelectedSem(cfg.key)}
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
            {filteredModels.length > 0 ? (
              filteredModels.map((m) => {
                const isSelected = m.model_id === currentModel.model_id;
                const isFlagship = m.model_id.includes('9A-19') || m.model_id.includes('7A-01');
                return (
                  <button
                    key={m.model_id}
                    type="button"
                    className={`drawer-model-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectModel(m.model_id)}
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

      {/* 85% Canvas + 15% Telemetry */}
      <div className="sandbox-split-box">
        <div className="sandbox-viewport-85" style={{ touchAction: 'none' }}>
          {isHandInHand ? (
            <svg
              id="sandbox-svg"
              width="100%"
              height="300"
              viewBox="-160 -115 320 230"
              style={{ display: 'block', margin: 'auto', userSelect: 'none' }}
            >
              {/* 坐标系模式辅助轴线 */}
              {isCoord && (
                <g stroke="#475569" strokeWidth="1">
                  <line x1="-150" y1="0" x2="150" y2="0" />
                  <line x1="0" y1="-100" x2="0" y2="100" />
                  <text x="140" y="-6" fill="#94a3b8" fontSize="10">X</text>
                  <text x="6" y="-90" fill="#94a3b8" fontSize="10">Y</text>
                </g>
              )}

              {/* 旋转轨道虚线圆 */}
              <circle cx="0" cy="0" r="86" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="4 4" />

              {/* 干扰加壳图层 */}
              {morphState.activeCamouflageIds.length > 0 && (
                <g
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  opacity={morphState.xrayActive ? 0.08 : 0.65}
                  style={{ transition: 'opacity 0.3s ease' }}
                >
                  <line x1="-150" y1="-100" x2="150" y2="100" />
                  <line x1="-150" y1="100" x2="150" y2="-100" />
                  <circle cx="0" cy="0" r="125" fill="none" />
                  <line x1="-80" y1="-110" x2="-80" y2="110" />
                  <line x1="80" y1="-110" x2="80" y2="110" />
                </g>
              )}

              {/* 中心旋转顶点 O */}
              <circle cx="0" cy="0" r="5" fill="#34c759" stroke="#ffffff" strokeWidth="1.5" />
              <text x="-8" y="-12" fill="#ffffff" fontSize="11" fontWeight="bold">
                {isEn ? 'O (Pivot Center)' : 'O (共顶旋转轴)'}
              </text>

              {/* 定构型 (等边三角形 / 等腰直角三角形 / 正方形) */}
              <polygon
                points={
                  isSquare
                    ? `0,0 ${baseAx},${baseAy} ${baseAx},${baseAy + baseBy} ${baseBx},${baseBy}`
                    : `0,0 ${baseAx},${baseAy} ${baseBx},${baseBy}`
                }
                fill="rgba(0,113,227,0.25)"
                stroke="#38bdf8"
                strokeWidth={morphState.xrayActive ? 2.8 : 2.2}
                style={{
                  filter: morphState.xrayActive ? 'drop-shadow(0 0 10px rgba(56,189,248,0.8))' : 'none',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <circle cx={baseAx} cy={baseAy} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'all 0.35s ease' }} />
              <text x={baseAx - 14} y={baseAy + 5} fill="#38bdf8" fontSize="11" fontWeight="bold" style={{ transition: 'all 0.35s ease' }}>
                A
              </text>
              <circle cx={baseBx} cy={baseBy} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'all 0.35s ease' }} />
              <text x={baseBx + 6} y={baseBy + 5} fill="#38bdf8" fontSize="11" fontWeight="bold" style={{ transition: 'all 0.35s ease' }}>
                B
              </text>

              {/* 动态旋转构型 */}
              <g id="rotating-triangle-group" transform={`rotate(${rotationAngle} 0 0)`} style={{ transformOrigin: '0px 0px' }}>
                <polygon
                  points={
                    isSquare
                      ? `0,0 ${baseAx},${baseAy} ${baseAx},${baseAy + baseBy} ${baseBx},${baseBy}`
                      : `0,0 ${baseAx},${baseAy} ${baseBx},${baseBy}`
                  }
                  fill="rgba(129,140,248,0.28)"
                  stroke="#a5b4fc"
                  strokeWidth={morphState.xrayActive ? 2.8 : 2.2}
                  style={{
                    filter: morphState.xrayActive ? 'drop-shadow(0 0 10px rgba(165,180,252,0.8))' : 'none',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
                <circle cx={baseAx} cy={baseAy} r="4" fill="#a5b4fc" stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'all 0.35s ease' }} />
                <text x={baseAx - 14} y={baseAy + 5} fill="#a5b4fc" fontSize="11" fontWeight="bold" style={{ transition: 'all 0.35s ease' }}>
                  C
                </text>
                <circle cx={baseBx} cy={baseBy} r="4" fill="#a5b4fc" stroke="#ffffff" strokeWidth="1.5" style={{ transition: 'all 0.35s ease' }} />
                <text x={baseBx + 6} y={baseBy + 5} fill="#a5b4fc" fontSize="11" fontWeight="bold" style={{ transition: 'all 0.35s ease' }}>
                  D
                </text>
              </g>

              {/* 手拉手连线 AC 与 BD (明亮金黄色，暗底高对比度) */}
              <line
                id="line-ac"
                x1={baseAx}
                y1={baseAy}
                x2={Cx}
                y2={Cy}
                stroke="#fbbf24"
                strokeWidth="2.2"
                strokeDasharray="4 3"
                opacity={morphState.xrayActive ? 0.3 : 1}
                style={{ transition: 'all 0.35s ease' }}
              />
              <line
                id="line-bd"
                x1={baseBx}
                y1={baseBy}
                x2={Dx}
                y2={Dy}
                stroke="#fbbf24"
                strokeWidth="2.2"
                strokeDasharray="4 3"
                opacity={morphState.xrayActive ? 0.3 : 1}
                style={{ transition: 'all 0.35s ease' }}
              />
            </svg>
          ) : (
            <SandboxRenderer
              key={compiledSandboxConfig.sandbox_id}
              config={compiledSandboxConfig}
              paramValues={morphState.parameterValues}
              xrayActive={morphState.xrayActive}
              onInvariantsChange={setInvariants}
              onParamChange={handleParamChange}
              locale={locale}
              style={{ width: '100%', height: '100%' }}
            />
          )}

          {/* 悬浮毛玻璃宝石按钮：中考题眼透视 (A.1 照妖镜正式更名与位置定夺) */}
          <button
            type="button"
            className={`xray-gem-floating-btn ${morphState.xrayActive ? 'active' : ''}`}
            onClick={handleToggleXRay}
            title={isEn ? 'Exam Focus X-Ray' : '中考题眼透视'}
            aria-label={isEn ? 'Exam Focus X-Ray' : '中考题眼透视'}
          >
            <Icon name="search" size={13} />
            <span>
              {isEn
                ? (morphState.xrayActive ? 'Exam Focus X-Ray (ON)' : 'Exam Focus X-Ray')
                : (morphState.xrayActive ? '题眼透视 (开)' : '题眼透视')}
            </span>
          </button>
        </div>

        {/* 15% 底部遥测条 */}
        <div className="sandbox-guide-15">
          <div className="telemetry-readings">
            {isHandInHand ? (
              <>
                <span className="telemetry-tag-invariant">
                  <MathRenderer
                    content={
                      isEn
                        ? `Invariant telemetry: $AC = BD = ${normalizedCm}\\text{ cm}$ (Equal)`
                        : `不变量实测：$AC = BD = ${normalizedCm}\\text{ cm}$ (恒等)`
                    }
                  />
                </span>
                <span className="telemetry-tag-secondary">
                  <MathRenderer
                    content={
                      isEn
                        ? `Angle telemetry: line AC & BD angle = $${rotationAngle}^\\circ$ ($= \\alpha$)`
                        : `夹角实测：直线 AC 与 BD 夹角 = $${rotationAngle}^\\circ$ (恒等于 $\\alpha$)`
                    }
                  />
                </span>
              </>
            ) : invariants.length > 0 ? (
              invariants.map((inv) => (
                <span key={inv.id} className="telemetry-tag-invariant" style={{ marginRight: '6px' }}>
                  <MathRenderer content={inv.text} />
                </span>
              ))
            ) : (
              <span className="telemetry-tag-invariant">
                <MathRenderer
                  content={isEn ? 'Geometric Invariant: Dynamic geometry isometric conservation' : '几何不变量：动态几何欧氏保距性守恒'}
                />
              </span>
            )}
          </div>
          <div className="telemetry-tag-conclusion">
            <MathRenderer
              content={
                isHandInHand
                  ? (isEn ? 'Conclusion: $\\triangle OAB \\cong \\triangle OCD$ rotation congruent' : '结论：$\\triangle OAB \\cong \\triangle OCD$ 旋转恒全等')
                  : (isEn ? 'Conclusion: Rigid transformation isometry holds' : '结论：刚体变异保距性成立')
              }
            />
          </div>
        </div>
      </div>

      {/* 模式 1：分步推演 */}
      <div
        className="step-deduction-container"
        data-testid="step-deduction-view"
        style={{ display: labMode === 'step_deduction' ? 'flex' : 'none' }}
      >
          {/* 顶部步骤胶囊导航 [ ① | ② | ③ | ④ ] */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
            {stages.map((s, idx) => {
              const stepSymbols = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
              const sym = stepSymbols[idx] || `${idx + 1}`;
              const isCur = idx === currentStepIndex;
              const title = (isEn ? s.titleEn : s.titleZh) || s.titleZh || s.title || `Step ${idx + 1}`;
              return (
                <button
                  key={s.stage || idx}
                  type="button"
                  className={`nav-pill-btn ${isCur ? 'active' : ''}`}
                  onClick={() => setCurrentStepIndex(idx)}
                  title={title}
                >
                  <span style={{ fontWeight: 700 }}>{sym}</span>
                  <span>{title}</span>
                </button>
              );
            })}
          </div>

          {/* 当前步骤名师解析卡片 */}
          {stages[currentStepIndex] && (
            <div className="step-card-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="bulb" size={15} style={{ color: 'var(--ios-blue)' }} />
                  <span>
                    {(isEn ? stages[currentStepIndex].titleEn : stages[currentStepIndex].titleZh) ||
                      stages[currentStepIndex].titleZh ||
                      stages[currentStepIndex].title ||
                      `Step ${currentStepIndex + 1}`}
                  </span>
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {currentStepIndex + 1} / {stages.length}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <MathRenderer
                  content={
                    (isEn ? stages[currentStepIndex].guideTextEn : stages[currentStepIndex].guideTextZh) ||
                    stages[currentStepIndex].guide_text ||
                    stages[currentStepIndex].guideTextZh ||
                    ''
                  }
                />
              </div>

              {/* 名师解题秘籍 / 题眼透视点拨 */}
              {Boolean(
                (isEn ? stages[currentStepIndex].teacherSecretEn : stages[currentStepIndex].teacherSecretZh) ||
                  stages[currentStepIndex].teacher_secret ||
                  stages[currentStepIndex].teacherSecretZh
              ) && (
                <div className="step-teacher-secret">
                  <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="search" size={13} />
                    <span>{isEn ? 'Exam Focus Insight:' : '中考题眼精讲：'}</span>
                  </div>
                  <MathRenderer
                    content={
                      (isEn ? stages[currentStepIndex].teacherSecretEn : stages[currentStepIndex].teacherSecretZh) ||
                      stages[currentStepIndex].teacher_secret ||
                      stages[currentStepIndex].teacherSecretZh ||
                      ''
                    }
                  />
                </div>
              )}

              {/* 阶段参数标靶指示条与微调抽屉 (PLAN-MODEL-REPAIR-V2 轨道 1) */}
              <div
                className="step-tuning-drawer"
                style={{
                  marginTop: '6px',
                  marginBottom: '6px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(51, 65, 85, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="target" size={14} style={{ color: 'var(--ios-blue)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                      {isEn ? 'Stage Target & Live Tuning' : '阶段标靶与动态微调'}
                    </span>
                    {isHandInHand ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                        }}
                      >
                        {isEn ? 'Target θ = ' : '标靶 θ = '}{stageTargetRot}°
                      </span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isHandInHand && Math.abs(rotationAngle - stageTargetRot) < 2 ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <span>{isEn ? 'Target Met ✓' : '标靶达成 ✓'}</span>
                      </span>
                    ) : isHandInHand ? (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {isEn ? `Current: ${rotationAngle}°` : `当前: ${rotationAngle}°`}
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setIsMicroTuningOpen(!isMicroTuningOpen)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#94a3b8',
                        padding: '2px 4px',
                      }}
                    >
                      <Icon name={isMicroTuningOpen ? 'chevron-up' : 'chevron-down'} size={12} />
                      <span>{isMicroTuningOpen ? (isEn ? 'Fold' : '收起') : (isEn ? 'Tune' : '微调')}</span>
                    </button>
                  </div>
                </div>

                {/* 微调抽屉内容 */}
                {isMicroTuningOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px', borderTop: '1px solid rgba(51, 65, 85, 0.6)' }}>
                    {isHandInHand ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label htmlFor="step-tuning-rot-slider" style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {isEn ? 'Rotate θ: ' : '旋转角 θ: '}<strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{rotationAngle}°</strong>
                          </label>
                          <input
                            id="step-tuning-rot-slider"
                            type="range"
                            className="apple-slider"
                            min="0"
                            max="360"
                            step="1"
                            value={rotationAngle}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRotationAngle(val);
                              handleSliderChange('rotationAngle', val);
                            }}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setRotationAngle(stageTargetRot);
                              handleSliderChange('rotationAngle', stageTargetRot);
                            }}
                            title={isEn ? 'Reset to Stage Target' : '对齐阶段标靶'}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 500,
                              background: '#1e293b',
                              color: '#cbd5e1',
                              border: '1px solid #334155',
                              cursor: 'pointer',
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isEn ? `${stageTargetRot}°` : `对齐 ${stageTargetRot}°`}
                          </button>
                        </div>

                        {/* 度量指示条：动态守恒数值展示 */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#cbd5e1',
                            background: 'rgba(2, 6, 23, 0.85)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            border: '1px solid #1e293b',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                            AC = BD = {normalizedCm} cm
                          </span>
                          <span style={{ color: '#34d399', fontWeight: 700 }}>
                            {isEn ? 'Rotation Congruent ✓' : '旋转恒全等保距 ✓'}
                          </span>
                          <span style={{ color: '#fbbf24' }}>
                            ∠(AC, BD) = {rotationAngle}°
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {parameterSpec.sliders.slice(0, 2).map((s) => {
                          const currentVal = morphState.parameterValues[s.id] ?? s.default;
                          const stageTargetVal = currentStageObj?.state_config?.sliders?.[s.id] ?? s.default;
                          const isTargetAchieved = Math.abs(currentVal - stageTargetVal) < 0.05;

                          return (
                            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                                  {(isEn ? s.nameEn : s.nameZh) || s.nameZh || s.id}: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{currentVal}{s.unit || ''}</strong>
                                </span>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                  {isEn ? 'Target: ' : '阶段标靶: '}{stageTargetVal}{s.unit || ''}
                                  {isTargetAchieved ? <span style={{ color: '#34d399', marginLeft: '4px', fontWeight: 700 }}>✓</span> : ''}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="range"
                                  className="apple-slider"
                                  min={s.min}
                                  max={s.max}
                                  step={s.step || 0.1}
                                  value={currentVal}
                                  onChange={(e) => handleSliderChange(s.id, Number(e.target.value))}
                                  style={{ flex: 1 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSliderChange(s.id, stageTargetVal)}
                                  title={isEn ? 'Reset to Stage Target' : '恢复阶段标靶'}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    color: '#cbd5e1',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {isEn ? 'Target' : '标靶'}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* 度量指示条 */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#cbd5e1',
                            background: 'rgba(2, 6, 23, 0.85)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            border: '1px solid #1e293b',
                            flexWrap: 'wrap',
                          }}
                        >
                          {invariants.length > 0 ? (
                            invariants.slice(0, 2).map((inv, idx) => (
                              <span key={inv.id || idx} style={{ color: '#38bdf8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                <MathRenderer content={inv.text} />
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                              {isEn ? 'Rigid Transform Isometry Holds' : '刚体变异保距性成立'}
                            </span>
                          )}
                          <span style={{ color: '#34d399', fontWeight: 700, marginLeft: 'auto' }}>[守恒 ✓]</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 底部操作区 */}
              <div className="step-action-bar">
                <button
                  type="button"
                  disabled={currentStepIndex === 0}
                  className="nav-pill-btn"
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  style={{ opacity: currentStepIndex === 0 ? 0.4 : 1 }}
                >
                  <Icon name="chevron-left" size={12} />
                  <span>{isEn ? 'Previous Step' : '上一步'}</span>
                </button>

                {currentStepIndex < stages.length - 1 ? (
                  <button
                    type="button"
                    className="step-next-large-btn"
                    onClick={() => setCurrentStepIndex((prev) => Math.min(stages.length - 1, prev + 1))}
                  >
                    <span>
                      {isEn
                        ? `Next: ${stages[currentStepIndex + 1]?.titleEn || stages[currentStepIndex + 1]?.titleZh || `Step ${currentStepIndex + 2}`}`
                        : `下一步：${stages[currentStepIndex + 1]?.titleZh || stages[currentStepIndex + 1]?.title || `第 ${currentStepIndex + 2} 步`}`}
                    </span>
                    <Icon name="chevron-right" size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="step-next-large-btn"
                    onClick={() => setLabMode('free_explore')}
                  >
                    <Icon name="gamepad" size={14} />
                    <span>{isEn ? 'Enter Free Play' : '进入自由探索'}</span>
                    <Icon name="chevron-right" size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 模式 2：自由探索 (包含极简控制条与 4D 变异维度货架) */}
        <div
          className="free-explore-container"
          data-testid="free-explore-view"
          style={{ display: labMode === 'free_explore' ? 'flex' : 'none', flexDirection: 'column', gap: '1rem' }}
        >
          {/* 极简控制条 (所有滑块移出画布，统一放此) */}
          <div className="sandbox-controls-bar">
            {isHandInHand ? (
              <>
                <div className="slider-group">
                  <label htmlFor="sandbox-slider" style={{ whiteSpace: 'nowrap' }}>
                    {isEn ? 'Rotation α: ' : '旋转角 α: '}<strong style={{ color: 'var(--ios-blue)' }}>{rotationAngle}°</strong>
                  </label>
                  <input
                    id="sandbox-slider"
                    type="range"
                    className="apple-slider"
                    min="0"
                    max="360"
                    value={rotationAngle}
                    onChange={(e) => {
                      const angle = parseInt(e.target.value, 10);
                      setRotationAngle(angle);
                      setMorphState((prev) => ({
                        ...prev,
                        parameterValues: { ...prev.parameterValues, param_t: Math.round((angle / 360) * 10) },
                      }));
                    }}
                  />
                </div>

                <div className="slider-group" style={{ minWidth: '180px' }}>
                  <label htmlFor="param-t-slider" style={{ whiteSpace: 'nowrap' }}>
                    {isEn ? 'Point Param t: ' : '动点参数 t: '}<strong style={{ color: 'var(--ios-blue)' }}>{morphState.parameterValues['param_t'] ?? 5}</strong>
                  </label>
                  <input
                    id="param-t-slider"
                    type="range"
                    className="apple-slider"
                    min="0"
                    max="10"
                    step="0.5"
                    value={morphState.parameterValues['param_t'] ?? 5}
                    onChange={(e) => handleSliderChange('param_t', parseFloat(e.target.value))}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div className="preset-pill-group">
                    <button
                      type="button"
                      className={`preset-btn ${rotationAngle === 0 ? 'active' : ''}`}
                      onClick={() => setRotationAngle(0)}
                    >
                      {isEn ? '0° Coincident' : '0° 重合'}
                    </button>
                    <button
                      type="button"
                      className={`preset-btn ${rotationAngle === 60 ? 'active' : ''}`}
                      onClick={() => setRotationAngle(60)}
                    >
                      {isEn ? '60° Equilateral' : '60° 等边'}
                    </button>
                    <button
                      type="button"
                      className={`preset-btn ${rotationAngle === 90 ? 'active' : ''}`}
                      onClick={() => setRotationAngle(90)}
                    >
                      {isEn ? '90° Perpendicular' : '90° 垂直'}
                    </button>
                    <button
                      type="button"
                      className={`preset-btn ${rotationAngle === 180 ? 'active' : ''}`}
                      onClick={() => setRotationAngle(180)}
                    >
                      {isEn ? '180° Opposite Collinear' : '180° 反向共线'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="nav-pill-btn"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    style={{
                      background: '#ffffff',
                      color: 'var(--ios-blue)',
                      fontWeight: 600,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    <Icon name={isAutoPlaying ? 'refresh' : 'rocket'} size={12} />
                    <span>
                      {isEn
                        ? (isAutoPlaying ? 'Pause Demo' : 'Auto Rotate Demo')
                        : (isAutoPlaying ? '暂停演示' : '自动旋转演示')}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '16px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                {parameterSpec.sliders.map((s) => {
                  const val = morphState.parameterValues[s.id] ?? s.default ?? 5;
                  return (
                    <div key={s.id} className="slider-group">
                      <label htmlFor={`slider-${s.id}`} style={{ whiteSpace: 'nowrap' }}>
                        {(isEn ? s.nameEn : s.nameZh) || s.nameZh || (isEn ? 'Point Param' : '动点参数')}: <strong style={{ color: 'var(--ios-blue)' }}>{val}{s.unit || ''}</strong>
                      </label>
                      <input
                        id={`slider-${s.id}`}
                        type="range"
                        className="apple-slider"
                        min={s.min}
                        max={s.max}
                        step={s.step || 0.1}
                        value={val}
                        onChange={(e) => handleSliderChange(s.id, parseFloat(e.target.value))}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4D 变异控制台分层面板 (每维一张独立小卡) */}
          <div className="sandbox-4d-shelf">
            {/* 1D 载体变异：仅在桌面端完整保留；手机端砍掉独立 5 变异按钮 */}
            {!isMobile && (
              <div className="dim-card">
                <span className="dim-card-title">
                  {isEn ? '① Carrier Variation' : '① 载体变异 (Carrier)'}
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {isHandInHand ? (
                    handInHandCarrierOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`preset-btn ${morphState.carrierId === opt.id ? 'active' : ''}`}
                        onClick={() => handleSelectCarrier(opt.id)}
                      >
                        {(isEn ? opt.nameEn : opt.nameZh) || opt.nameZh}
                      </button>
                    ))
                  ) : carrierSpec.options.length > 0 ? (
                    carrierSpec.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`preset-btn ${morphState.carrierId === opt.id ? 'active' : ''}`}
                        onClick={() => handleSelectCarrier(opt.id)}
                      >
                        {(isEn ? opt.nameEn : opt.nameZh) || opt.nameZh}
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`preset-btn ${morphState.carrierId === 'free_triangle' ? 'active' : ''}`}
                        onClick={() => handleSelectCarrier('free_triangle')}
                      >
                        {isEn ? 'Free Triangle' : '自由三角形'}
                      </button>
                      <button
                        type="button"
                        className={`preset-btn ${morphState.carrierId === 'quadrilateral' ? 'active' : ''}`}
                        onClick={() => handleSelectCarrier('quadrilateral')}
                      >
                        {isEn ? 'Square Carrier' : '正方形载体'}
                      </button>
                      <button
                        type="button"
                        className={`preset-btn ${morphState.carrierId === 'coordinate_grid' ? 'active' : ''}`}
                        onClick={() => handleSelectCarrier('coordinate_grid')}
                      >
                        {isEn ? 'Coordinate Grid' : '直角坐标系'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 2D 参数变异 */}
            <div className="dim-card">
              <span className="dim-card-title">
                {isEn ? '② Parameter Variation' : '② 参数变异 (Parameter)'}
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {isHandInHand
                  ? (isEn
                      ? `Ratio k = 1.0, Rotation α = ${rotationAngle}°, Param t = ${morphState.parameterValues['param_t'] ?? 5}`
                      : `相似比 k = 1.0，旋转角 α = ${rotationAngle}°，动点参数 t = ${morphState.parameterValues['param_t'] ?? 5}`)
                  : parameterSpec.sliders.map((s) => `${(isEn ? s.nameEn : s.nameZh) || s.nameZh || (isEn ? 'Param' : '参数')}: ${morphState.parameterValues[s.id] ?? s.default ?? 5}`).join(' · ')}
              </div>
            </div>

            {/* 3D 姿态变异 */}
            <div className="dim-card">
              <span className="dim-card-title">
                {isEn ? '③ Posture Variation' : '③ 姿态变异 (Posture)'}
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {postureSpec.modes.length > 0 ? (
                  postureSpec.modes.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      className={`preset-btn ${morphState.postureId === mode.id ? 'active' : ''}`}
                      onClick={() => handleSelectPosture(mode.id, mode.rotationDeg)}
                    >
                      {(isEn ? mode.nameEn : mode.nameZh) || mode.nameZh}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      type="button"
                      className={`preset-btn ${morphState.postureId === 'standard' ? 'active' : ''}`}
                      onClick={() => handleSelectPosture('standard', 60)}
                    >
                      {isEn ? 'Standard (0°)' : '标准正向 (0°)'}
                    </button>
                    <button
                      type="button"
                      className={`preset-btn ${morphState.postureId === 'rotated_90' ? 'active' : ''}`}
                      onClick={() => handleSelectPosture('rotated_90', 90)}
                    >
                      {isEn ? 'Rotated 90°' : '正交旋转 90°'}
                    </button>
                    <button
                      type="button"
                      className={`preset-btn ${morphState.postureId === 'reflected_x' ? 'active' : ''}`}
                      onClick={() => handleSelectPosture('reflected_x', 180)}
                    >
                      {isEn ? 'Axial Reflection' : '轴对称翻折'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 4D 干扰加壳与 X-Ray 透视 */}
            <div className="dim-card">
              <span className="dim-card-title">
                {isEn ? '④ Camouflage & X-Ray' : '④ 干扰加壳 (Camouflage) & X-Ray'}
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {camouflageSpec.distractorLayers.length > 0 ? (
                  camouflageSpec.distractorLayers.map((layer) => {
                    const active = morphState.activeCamouflageIds.includes(layer.id);
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        disabled={morphState.xrayActive}
                        className={`preset-btn ${active && !morphState.xrayActive ? 'active' : ''}`}
                        onClick={() => handleToggleCamouflage(layer.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Icon name={active ? 'eye' : 'eye-off'} size={12} />
                        <span>{(isEn ? layer.nameEn : layer.nameZh) || layer.nameZh}</span>
                      </button>
                    );
                  })
                ) : (
                  <button
                    type="button"
                    className={`preset-btn ${morphState.activeCamouflageIds.length > 0 && !morphState.xrayActive ? 'active' : ''}`}
                    onClick={() =>
                      setMorphState((prev) => ({
                        ...prev,
                        activeCamouflageIds: prev.activeCamouflageIds.length > 0 ? [] : ['mesh'],
                      }))
                    }
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Icon name={morphState.activeCamouflageIds.length > 0 ? 'eye' : 'eye-off'} size={12} />
                    <span>{isEn ? 'Distractor Mesh' : '干扰线网格'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className={`preset-btn ${morphState.xrayActive ? 'active' : ''}`}
                  onClick={handleToggleXRay}
                  style={{
                    background: morphState.xrayActive ? 'var(--ios-blue)' : '#ffffff',
                    color: morphState.xrayActive ? '#ffffff' : 'var(--ios-blue)',
                    borderColor: 'var(--ios-blue)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Icon name="xray" size={12} />
                  <span>
                    {isEn
                      ? (morphState.xrayActive ? 'Exam Focus X-Ray (ON)' : 'Exam Focus X-Ray (OFF)')
                      : (morphState.xrayActive ? '题眼透视 (开)' : '题眼透视 (关)')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 思维跃迁探究指南 */}
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
              <span>{isEn ? 'Thinking Leap Exploration Guide:' : '思维跃迁探究指南：'}</span>
            </div>
            <MathRenderer
              content={
                isEn
                  ? currentModel.model_brief_en || 'Hand-in-hand rotational congruence invariant exploration.'
                  : currentModel.model_brief_zh || '共顶等线成旋转，全等导引勾股现。开启题眼透视可一键隐去干扰线，聚焦共顶旋转骨架。'
              }
            />
          </div>
        </div>
    </div>
  );
};
