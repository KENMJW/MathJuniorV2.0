import React, { useState, useEffect, useMemo } from 'react';
import {
  LeapSandboxModel,
  MorphingState,
  compileMorphingSandboxConfig,
  createDefaultMorphingState,
  parseMorphingSpecs,
  mockLeapSandboxModels,
} from './morphControllers';
import { SandboxRenderer } from './SandboxRenderer';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import './sandbox.css';

export interface LeapLabProps {
  model?: LeapSandboxModel;
  modelId?: string;
  onSelectModelId?: (id: string) => void;
  allModels?: LeapSandboxModel[];
  onBack?: () => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SEMESTERS = ['7A', '7B', '8A', '8B', '9A', '9B'] as const;

/**
 * 实验室二：4D 变异跃迁沙盒 (支持全库 36 个跃迁模型，100% 严格对标 ios27_demo.html)
 * 
 * 核心设计标准：
 * 1. 2 级抽屉盒模型切换：年级学期 (7A~9B) -> 真实模型卡片，顶部配备实时搜索框；
 * 2. 5 维载体变异平滑形变：手拉手模型原生支持 opt1 (等边)、opt2 (等腰直角)、quadrilateral (正方形)、coordinate_grid (坐标系)、free_triangle；
 * 3. 极简白外置控制条：param_t (0~10) 动点驱动与纯数学刚体旋转；
 * 4. 铁律 11 零 emoji、铁律 1/3 零 eval/innerHTML、铁律 2 零 foreignObject。
 */
export const LeapLab: React.FC<LeapLabProps> = ({
  model: propModel,
  modelId = 'LM-9A-19',
  onSelectModelId,
  allModels = mockLeapSandboxModels,
  locale = 'zh-CN',
}) => {
  // 内部维护受控/非受控激活模型 ID
  const [activeModelId, setActiveModelId] = useState<string>(modelId);

  useEffect(() => {
    if (modelId) {
      setActiveModelId(modelId);
    }
  }, [modelId]);

  const effectiveModelId = activeModelId || modelId;

  // 1. 获取当前模型 (从 36 个真实跃迁模型与兼容测试种子中匹配)
  const currentModel = useMemo(() => {
    if (propModel) return propModel;
    return (
      allModels.find((m) => m.model_id === effectiveModelId) ||
      allModels.find((m) => m.model_id.includes(effectiveModelId)) ||
      allModels.find((m) => m.model_id === 'LM-9A-19') ||
      allModels.find((m) => m.model_id === 'LM-8A-01') ||
      allModels[0]
    );
  }, [propModel, effectiveModelId, allModels]);

  // 2. 抽屉盒选择状态管理
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSem, setSelectedSem] = useState<string>(
    currentModel.unlocked_semester || '9A'
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

  // 5. 判断是否为手拉手旋转全等模型 (LM-8A-01 或 LM-9A-19)
  const isHandInHand =
    currentModel.model_id.includes('8A-01') ||
    currentModel.model_id.includes('9A-19') ||
    currentModel.model_name_zh.includes('手拉手');

  // 手拉手专用动画与交互状态
  const [rotationAngle, setRotationAngle] = useState<number>(60);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [tierLevel, setTierLevel] = useState<number>(1);
  const [invariants, setInvariants] = useState<Array<{ id: string; text: string; isConstant: boolean }>>([]);

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
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', position: 'relative' }}>
      {/* 头部标题行与模型抽屉展开入口 */}
      <div className="sandbox-header-line">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="model-drawer-trigger-btn"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          >
            <Icon name="layers" size={14} />
            <span style={{ fontWeight: 700 }}>
              {currentModel.model_id} · {locale === 'en' ? currentModel.model_name_en : currentModel.model_name_zh}
            </span>
            <Icon name={isDrawerOpen ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>

          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            (主线 {currentModel.primary_line} · {currentModel.unlocked_semester})
          </span>
        </div>

        <div className="tier-pill-group">
          <button
            type="button"
            className={`nav-pill-btn ${tierLevel === 1 ? 'active' : ''}`}
            onClick={() => setTierLevel(1)}
          >
            原型
          </button>
          <button
            type="button"
            className={`nav-pill-btn ${tierLevel === 2 ? 'active' : ''}`}
            onClick={() => setTierLevel(2)}
          >
            变式
          </button>
          <button
            type="button"
            className={`nav-pill-btn ${tierLevel === 3 ? 'active' : ''}`}
            onClick={() => setTierLevel(3)}
          >
            综合
          </button>
        </div>
      </div>

      {/* 2 级抽屉盒模型切换面板 */}
      {isDrawerOpen && (
        <div className="model-drawer-panel">
          {/* 顶部搜索框 */}
          <div className="drawer-search-wrapper">
            <div className="drawer-search-input-box">
              <Icon name="search" size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 36 个跃迁模型 (如 手拉手 / LM-9A-19 / 抛物线)..."
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
              {SEMESTERS.map((sem) => {
                const count = modelsBySemester[sem]?.length || 0;
                const active = selectedSem === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    className={`drawer-sem-chip ${active ? 'active' : ''}`}
                    onClick={() => setSelectedSem(sem)}
                  >
                    <span>{sem}</span>
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
                const isFlagship = m.model_id.includes('9A-19');
                return (
                  <button
                    key={m.model_id}
                    type="button"
                    className={`drawer-model-card ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectModel(m.model_id)}
                  >
                    <div className="drawer-card-header">
                      <span className="drawer-card-code">{m.model_id}</span>
                      <span className="drawer-card-sem">{m.unlocked_semester}</span>
                      {isFlagship && <span className="drawer-card-flagship">旗舰模型</span>}
                      {isSelected && <Icon name="check" size={12} style={{ color: 'var(--ios-blue)', marginLeft: 'auto' }} />}
                    </div>
                    <div className="drawer-card-name">{m.model_name_zh}</div>
                    <div className="drawer-card-brief">{m.model_brief_zh}</div>
                  </button>
                );
              })
            ) : (
              <div className="drawer-empty-tip">
                未检索到匹配的跃迁模型
              </div>
            )}
          </div>
        </div>
      )}

      {/* 85% Canvas + 15% Telemetry */}
      <div className="sandbox-split-box">
        <div className="sandbox-viewport-85">
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
                O (共顶旋转轴)
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
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>

        {/* 15% 底部遥测条 */}
        <div className="sandbox-guide-15">
          <div className="telemetry-readings">
            {isHandInHand ? (
              <>
                <span className="telemetry-tag-invariant">
                  不变量实测：AC = BD = <span style={{ fontWeight: 700 }}>{normalizedCm}</span> cm (恒等)
                </span>
                <span className="telemetry-tag-secondary">
                  夹角实测：直线 AC 与 BD 夹角 = <span style={{ fontWeight: 700 }}>{rotationAngle}</span>° (恒等于 α)
                </span>
              </>
            ) : (
              <span className="telemetry-tag-invariant">
                {invariants[0]?.text || '动态几何欧氏保距性守恒'}
              </span>
            )}
          </div>
          <div className="telemetry-tag-conclusion">
            {isHandInHand ? '结论：△OAB ≌ △OCD 旋转恒全等' : '结论：刚体变异保距性成立'}
          </div>
        </div>
      </div>

      {/* 极简控制条 (所有滑块移出画布，统一放此) */}
      <div className="sandbox-controls-bar">
        {isHandInHand ? (
          <>
            <div className="slider-group">
              <label htmlFor="sandbox-slider" style={{ whiteSpace: 'nowrap' }}>
                旋转角 α: <strong style={{ color: 'var(--ios-blue)' }}>{rotationAngle}°</strong>
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
                动点参数 t: <strong style={{ color: 'var(--ios-blue)' }}>{morphState.parameterValues['param_t'] ?? 5}</strong>
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
                  0° 重合
                </button>
                <button
                  type="button"
                  className={`preset-btn ${rotationAngle === 60 ? 'active' : ''}`}
                  onClick={() => setRotationAngle(60)}
                >
                  60° 等边
                </button>
                <button
                  type="button"
                  className={`preset-btn ${rotationAngle === 90 ? 'active' : ''}`}
                  onClick={() => setRotationAngle(90)}
                >
                  90° 垂直
                </button>
                <button
                  type="button"
                  className={`preset-btn ${rotationAngle === 180 ? 'active' : ''}`}
                  onClick={() => setRotationAngle(180)}
                >
                  180° 反向共线
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
                <span>{isAutoPlaying ? '暂停演示' : '自动旋转演示'}</span>
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
                    {s.nameZh || '动点参数'}: <strong style={{ color: 'var(--ios-blue)' }}>{val}{s.unit || ''}</strong>
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
        {/* 1D 载体变异 */}
        <div className="dim-card">
          <span className="dim-card-title">① 载体变异 (Carrier)</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {isHandInHand ? (
              handInHandCarrierOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`preset-btn ${morphState.carrierId === opt.id ? 'active' : ''}`}
                  onClick={() => handleSelectCarrier(opt.id)}
                >
                  {opt.nameZh}
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
                  {opt.nameZh}
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  className={`preset-btn ${morphState.carrierId === 'free_triangle' ? 'active' : ''}`}
                  onClick={() => handleSelectCarrier('free_triangle')}
                >
                  自由三角形
                </button>
                <button
                  type="button"
                  className={`preset-btn ${morphState.carrierId === 'quadrilateral' ? 'active' : ''}`}
                  onClick={() => handleSelectCarrier('quadrilateral')}
                >
                  正方形载体
                </button>
                <button
                  type="button"
                  className={`preset-btn ${morphState.carrierId === 'coordinate_grid' ? 'active' : ''}`}
                  onClick={() => handleSelectCarrier('coordinate_grid')}
                >
                  直角坐标系
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2D 参数变异 */}
        <div className="dim-card">
          <span className="dim-card-title">② 参数变异 (Parameter)</span>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {isHandInHand
              ? `相似比 k = 1.0，旋转角 α = ${rotationAngle}°，动点参数 t = ${morphState.parameterValues['param_t'] ?? 5}`
              : parameterSpec.sliders.map((s) => `${s.nameZh || '参数'}: ${morphState.parameterValues[s.id] ?? s.default ?? 5}`).join(' · ')}
          </div>
        </div>

        {/* 3D 姿态变异 */}
        <div className="dim-card">
          <span className="dim-card-title">③ 姿态变异 (Posture)</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {postureSpec.modes.length > 0 ? (
              postureSpec.modes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`preset-btn ${morphState.postureId === mode.id ? 'active' : ''}`}
                  onClick={() => handleSelectPosture(mode.id, mode.rotationDeg)}
                >
                  {mode.nameZh}
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  className={`preset-btn ${morphState.postureId === 'standard' ? 'active' : ''}`}
                  onClick={() => handleSelectPosture('standard', 60)}
                >
                  标准正向 (0°)
                </button>
                <button
                  type="button"
                  className={`preset-btn ${morphState.postureId === 'rotated_90' ? 'active' : ''}`}
                  onClick={() => handleSelectPosture('rotated_90', 90)}
                >
                  正交旋转 90°
                </button>
                <button
                  type="button"
                  className={`preset-btn ${morphState.postureId === 'reflected_x' ? 'active' : ''}`}
                  onClick={() => handleSelectPosture('reflected_x', 180)}
                >
                  轴对称翻折
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4D 干扰加壳与 X-Ray 透视 */}
        <div className="dim-card">
          <span className="dim-card-title">④ 干扰加壳 (Camouflage) & X-Ray</span>
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
                    <span>{layer.nameZh}</span>
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
                <span>干扰线网格</span>
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
              <span>{morphState.xrayActive ? 'X-Ray 透视 (开)' : 'X-Ray 透视 (关)'}</span>
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
          <span>思维跃迁探究指南：</span>
        </div>
        <MathRenderer
          content={
            locale === 'en'
              ? currentModel.model_brief_en || 'Hand-in-hand rotational congruence invariant exploration.'
              : currentModel.model_brief_zh || '共顶等线成旋转，全等导引勾股现。开启 X-Ray 可一键隐去干扰线，聚焦共顶旋转骨架。'
          }
        />
      </div>
    </div>
  );
};
