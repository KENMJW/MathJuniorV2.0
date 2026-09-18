import React, { useState, useMemo } from 'react';
import {
  LeapSandboxModel,
  MorphingState,
  parseMorphingSpecs,
  createDefaultMorphingState,
  compileMorphingSandboxConfig,
  mockLeapSandboxModels,
} from './morphControllers';
import { SandboxRenderer } from './SandboxRenderer';
import { XRayLayer } from './XRayLayer';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { useSessionStore } from '../../store/sessionStore';

export interface LeapLabProps {
  model?: LeapSandboxModel;
  modelId?: string;
  allModels?: LeapSandboxModel[];
  onBack?: () => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 任务 11.4: 实验室二 4D 变异控制器与思维跃迁探究平台 (LeapLab)
 *
 * 核心规范：
 * 1. [铁律 1]: 纯数学变换，严禁任何 eval / Function。
 * 2. 声明式 4D 变异驱动：
 *    - 载体变异 (carrier)：自由态 -> 四边形 -> 坐标系 -> 抛物线
 *    - 参数变异 (parameter)：连续滑块变量 (通过 clampDynamicValue 约束)
 *    - 姿态变异 (posture)：欧氏保距旋转与轴对称翻折
 *    - 干扰加壳与 X-Ray 骨架透视 (camouflage / xray)
 * 3. 复用 11.1 SandboxRenderer 与统一标尺视口。
 * 4. 铁律 3: 所有文字说明与公式走 <MathRenderer>。
 * 5. 铁律 10: 遵循 iOS 27 液态玻璃设计规范。
 */
export const LeapLab: React.FC<LeapLabProps> = ({
  model: propModel,
  modelId,
  allModels = mockLeapSandboxModels,
  onBack,
  locale: propLocale,
  className,
  style,
}) => {
  const sessionLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || sessionLocale;

  // 1. 解析当前跃迁模型
  const currentModel = useMemo(() => {
    if (propModel) return propModel;
    if (modelId) {
      const found = allModels.find((m) => m.model_id === modelId);
      if (found) return found;
    }
    return allModels[0] || mockLeapSandboxModels[0];
  }, [propModel, modelId, allModels]);

  // 2. 解析 4D 规格
  const { carrierSpec, parameterSpec, postureSpec, camouflageSpec } = useMemo(
    () => parseMorphingSpecs(currentModel),
    [currentModel]
  );

  // 3. 维护 4D 变异状态
  const [morphState, setMorphState] = useState<MorphingState>(() =>
    createDefaultMorphingState(currentModel)
  );

  // 4. 编译动态 SandboxConfig
  const compiledSandboxConfig = useMemo(
    () => compileMorphingSandboxConfig(currentModel, morphState),
    [currentModel, morphState]
  );

  // 变异控制器事件处理
  const handleSelectCarrier = (carrierId: string) => {
    setMorphState((prev) => ({ ...prev, carrierId }));
  };

  const handleSliderChange = (sliderId: string, val: number) => {
    setMorphState((prev) => ({
      ...prev,
      parameterValues: { ...prev.parameterValues, [sliderId]: val },
    }));
  };

  const handleSelectPosture = (postureId: string) => {
    setMorphState((prev) => ({ ...prev, postureId }));
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

  return (
    <div
      className={`leap-lab-container ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '1.25rem',
        borderRadius: 'var(--radius-card, 18px)',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
        backdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow-deep, 0 20px 60px -10px rgba(0,20,60,0.12))',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* 顶栏：模型元数据与返回 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                border: '1px solid rgba(0,0,0,0.15)',
                background: 'var(--glass-bg-elevated)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              ← {locale === 'en' ? 'Back' : '返回'}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: 'var(--ios-purple)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.86rem',
              }}
            >
              {currentModel.model_id}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {locale === 'en' ? currentModel.model_name_en : currentModel.model_name_zh}
            </h2>
          </div>
        </div>

        {/* 徽章组：学期 / 主线 / Tier 级别 */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'rgba(0,113,227,0.1)',
              color: 'var(--ios-blue)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            主线 {currentModel.primary_line}
          </span>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'rgba(52,199,89,0.1)',
              color: 'var(--ios-green)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            解锁学期 {currentModel.unlocked_semester}
          </span>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'rgba(175,82,222,0.1)',
              color: 'var(--ios-purple)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Tier {currentModel.tier_level} {currentModel.tier_level === 1 ? '原型' : currentModel.tier_level === 2 ? '变式' : '综合'}
          </span>
        </div>
      </div>

      {/* X-Ray 骨架透视 HUD 图层 */}
      <XRayLayer
        xrayActive={morphState.xrayActive}
        onToggleXRay={handleToggleXRay}
        coreSkeleton={camouflageSpec.coreSkeleton}
        distractorCount={camouflageSpec.distractorLayers.length}
        locale={locale}
      />

      {/* 4D 变异控制器面板 (数据驱动控制条) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          padding: '0.9rem',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {/* 1D 载体变异控制器 */}
        {carrierSpec.options.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              ① 载体变异 (Carrier)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {carrierSpec.options.map((opt) => {
                const active = morphState.carrierId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectCarrier(opt.id)}
                    style={{
                      border: active ? '1.5px solid var(--ios-blue)' : '1px solid rgba(0,0,0,0.1)',
                      background: active ? 'var(--ios-blue)' : 'var(--glass-bg-elevated)',
                      color: active ? 'var(--glass-bg-elevated)' : 'var(--text-primary)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {locale === 'en' ? opt.nameEn : opt.nameZh}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2D 参数变异滑块 (clampDynamicValue 约束) */}
        {parameterSpec.sliders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              ② 参数变异 (Parameter)
            </span>
            {parameterSpec.sliders.map((slider) => {
              const val = morphState.parameterValues[slider.id] ?? slider.default;
              return (
                <div key={slider.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {locale === 'en' ? slider.nameEn : slider.nameZh}:
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--ios-blue)' }}>
                      {val}
                      {slider.unit || ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={val}
                    onChange={(e) => handleSliderChange(slider.id, parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--ios-blue)' }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* 3D 姿态变异控制器 */}
        {postureSpec.modes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              ③ 姿态变异 (Posture)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {postureSpec.modes.map((mode) => {
                const active = morphState.postureId === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleSelectPosture(mode.id)}
                    style={{
                      border: active ? '1.5px solid var(--ios-indigo)' : '1px solid rgba(0,0,0,0.1)',
                      background: active ? 'var(--ios-indigo)' : 'var(--glass-bg-elevated)',
                      color: active ? 'var(--glass-bg-elevated)' : 'var(--text-primary)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {locale === 'en' ? mode.nameEn : mode.nameZh}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4D 干扰加壳图层切换 */}
        {camouflageSpec.distractorLayers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              ④ 干扰加壳 (Camouflage)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {camouflageSpec.distractorLayers.map((layer) => {
                const active = morphState.activeCamouflageIds.includes(layer.id);
                return (
                  <button
                    key={layer.id}
                    type="button"
                    disabled={morphState.xrayActive}
                    onClick={() => handleToggleCamouflage(layer.id)}
                    style={{
                      border: active ? '1px solid rgba(0,0,0,0.2)' : '1px dashed rgba(0,0,0,0.15)',
                      background: active ? 'var(--bg-card-hover)' : 'var(--glass-bg-elevated)',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      cursor: morphState.xrayActive ? 'not-allowed' : 'pointer',
                      opacity: morphState.xrayActive ? 0.4 : 1,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Icon name={active ? 'eye' : 'eye-off'} size={13} />
                      <span>{locale === 'en' ? layer.nameEn : layer.nameZh}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 中部核心画布 (复用 11.1 SandboxRenderer 与 11.2 视口) */}
      <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
        <SandboxRenderer
          key={compiledSandboxConfig.sandbox_id}
          config={compiledSandboxConfig}
          style={{ height: '460px', background: 'var(--glass-bg-elevated)' }}
        />
      </div>

      {/* 底部 15% 极简模型文字指南 (随模型变化，严格走 MathRenderer) */}
      <div
        style={{
          padding: '0.75rem 1.1rem',
          borderRadius: '12px',
          background: 'rgba(0, 113, 227, 0.05)',
          borderLeft: '4px solid var(--ios-blue)',
          fontSize: '0.88rem',
          color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--ios-blue)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Icon name="bulb" size={16} />
          <span>{locale === 'en' ? 'Leap Model Exploration Guide:' : '思维跃迁探究指南：'}</span>
        </div>
        <MathRenderer
          content={locale === 'en' ? currentModel.model_brief_en : currentModel.model_brief_zh}
        />
      </div>
    </div>
  );
};
