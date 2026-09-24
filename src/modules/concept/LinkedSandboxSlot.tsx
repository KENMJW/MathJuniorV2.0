/**
 * 链接沙盒插槽与 CLS=0 防抖等大占位卡 (TASK-FE-0021 步骤 3)
 *
 * 核心特性：
 * 1. 考点有 sandbox_id 且有 config 时：挂载通用声明式 <SandboxRenderer>，渲染动态几何动力学探究画布；
 * 2. 1~3 步自适应引导状态机与 Aha! 顿悟微弹窗（名师核心顿悟秘籍，自动判定 targetCondition）；
 * 3. 常驻提供 [ 直接开启自由把玩 ] 胶囊按钮，学生随时跳过引导直接操作；
 * 4. 考点无 sandbox_id 时：渲染物理等大的占位卡（与沙盒严格等大），确保视口防跳动（CLS = 0）；
 * 5. 纯 Tailwind CSS 原子类与 iOS 27 液态玻璃 Token，模块一内联样式严格归零；
 * 6. 铁律 3：文本与公式全部经由 <MathRenderer> 渲染。
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SandboxConfig, SandboxRenderer } from '../sandbox/SandboxRenderer';
import { Point2D } from '../sandbox/invariants';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { evaluateSafeExpression } from '../sandbox/safeExpression';
import { Sparkles, ChevronRight, ChevronLeft, X, Compass, Sliders, RotateCcw } from 'lucide-react';
import '../sandbox/sandbox.css';

export interface InquiryStep {
  step: number;
  title?: string;
  titleZh?: string;
  titleEn?: string;
  guide_text?: string;
  guideTextZh?: string;
  guideTextEn?: string;
  target_condition?: string;
  targetCondition?: string;
  aha_insight?: string;
  ahaInsightZh?: string;
  ahaInsightEn?: string;
}

export interface LinkedSandboxSlotProps {
  sandboxId?: string | null;
  config?: SandboxConfig | null;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  pointNameZh?: string;
  locale?: string;
}

export const LinkedSandboxSlot: React.FC<LinkedSandboxSlotProps> = ({
  sandboxId: propSandboxId,
  config,
  height = 560,
  className = '',
  style = {},
  pointNameZh: _pointNameZh = '当前知识考点',
  locale = 'zh-CN',
}) => {
  const sandboxId = propSandboxId || config?.point_id;
  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  const isEn = String(locale).toLowerCase().startsWith('en');

  // 解析当前沙盒的参数滑块规格
  const sliders: Array<{
    id: string;
    name: string;
    min: number;
    max: number;
    default: number;
    step?: number;
    unit?: string;
  }> = useMemo(() => {
    try {
      if (config?.param_sliders_json) {
        const parsed = JSON.parse(config.param_sliders_json);
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

    return [
      { id: 'scale', name: isEn ? 'Geometric Scale' : '几何缩放', min: 0.5, max: 2.5, default: 1.0, step: 0.1, unit: '' },
    ];
  }, [config, isEn]);

  // 解析 1~3 步自适应引导数据 (TASK-FE-0021 步骤 3)
  const inquirySteps: InquiryStep[] = useMemo(() => {
    try {
      if (config?.inquiry_steps_json) {
        const parsed = JSON.parse(config.inquiry_steps_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  }, [config?.inquiry_steps_json]);

  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [invariants, setInvariants] = useState<Array<{ id: string; text: string; isConstant: boolean }>>([]);
  const [livePoints, setLivePoints] = useState<Record<string, Point2D>>({});

  // 引导步骤状态机
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isFreePlayMode, setIsFreePlayMode] = useState<boolean>(false);
  const [completedStepIndices, setCompletedStepIndices] = useState<Set<number>>(new Set());
  const [showAhaModal, setShowAhaModal] = useState<boolean>(false);
  const [currentAhaStep, setCurrentAhaStep] = useState<InquiryStep | null>(null);

  // 初始化参数与步骤
  useEffect(() => {
    const initial: Record<string, number> = {};
    sliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setParamValues(initial);
    setActiveStepIndex(0);
    setIsFreePlayMode(false);
    setCompletedStepIndices(new Set());
    setShowAhaModal(false);
    setCurrentAhaStep(null);
    setLivePoints({});
  }, [sandboxId, sliders, inquirySteps.length]);

  // 重置整个探究流程为初始状态 (解决问题 1: 自由把玩后随时重新开始)
  const handleResetInquiry = useCallback(() => {
    const initial: Record<string, number> = {};
    sliders.forEach((s) => {
      initial[s.id] = s.default;
    });
    setParamValues(initial);
    setActiveStepIndex(0);
    setIsFreePlayMode(false);
    setCompletedStepIndices(new Set());
    setShowAhaModal(false);
    setCurrentAhaStep(null);
  }, [sliders]);

  // 目标条件即时判定纯函数 (融入滑块参数与几何动点坐标)
  const checkTargetCondition = useCallback(
    (
      step: InquiryStep,
      currentParams: Record<string, number>,
      currentPoints: Record<string, Point2D>
    ) => {
      const cond = step.target_condition || step.targetCondition;
      if (!cond) return false;

      // 组装求值上下文 scope
      const scope: Record<string, any> = { ...currentParams };
      Object.entries(currentParams).forEach(([k, v]) => {
        scope[k.toLowerCase()] = v;
        if (k.startsWith('param_')) {
          scope[k.replace(/^param_/, '')] = v;
        }
      });

      // 注入动点坐标 (支持 A_x, A_y, pt_A_x, pt_A_y, A.x, A.y 等多种写法)
      Object.entries(currentPoints).forEach(([k, pt]) => {
        if (!pt) return;
        scope[k] = pt;
        scope[`${k}_x`] = pt.x;
        scope[`${k}_y`] = pt.y;
        scope[`pt_${k}_x`] = pt.x;
        scope[`pt_${k}_y`] = pt.y;
        const cleanId = k.replace(/^p_/, '');
        scope[cleanId] = pt;
        scope[`${cleanId}_x`] = pt.x;
        scope[`${cleanId}_y`] = pt.y;
        scope[`pt_${cleanId}_x`] = pt.x;
        scope[`pt_${cleanId}_y`] = pt.y;
        scope[k.toLowerCase()] = pt;
        scope[`${k.toLowerCase()}_x`] = pt.x;
        scope[`${k.toLowerCase()}_y`] = pt.y;
      });

      try {
        const result = evaluateSafeExpression(cond, scope);
        return Boolean(result);
      } catch (err) {
        return false;
      }
    },
    []
  );

  // 动态监听参数与动点变化进行 Aha 达成判定
  useEffect(() => {
    if (isFreePlayMode || inquirySteps.length === 0) return;
    if (activeStepIndex >= inquirySteps.length) return;

    const currentStep = inquirySteps[activeStepIndex];
    if (!currentStep) return;

    if (!completedStepIndices.has(activeStepIndex)) {
      const isAchieved = checkTargetCondition(currentStep, paramValues, livePoints);
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
    paramValues,
    livePoints,
    activeStepIndex,
    isFreePlayMode,
    inquirySteps,
    completedStepIndices,
    checkTargetCondition,
  ]);

  // 前进至下一步或自由把玩 (解决问题 2: 步骤卡片与弹窗共用推进函数)
  const handleAdvanceToNextStep = () => {
    setShowAhaModal(false);
    setCompletedStepIndices((prev) => {
      const next = new Set(prev);
      next.add(activeStepIndex);
      return next;
    });
    if (activeStepIndex + 1 < inquirySteps.length) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      setIsFreePlayMode(true);
    }
  };

  const handleNextStepOrFreePlay = () => {
    handleAdvanceToNextStep();
  };

  // 分支 1：有沙盒且配置完备，渲染 SandboxRenderer + 1~3 步自适应引导 + 参数控制条 + 遥测栏
  if (sandboxId && config) {
    const hasSteps = inquirySteps.length > 0;
    const currentStep = hasSteps && activeStepIndex < inquirySteps.length ? inquirySteps[activeStepIndex] : null;
    const currentStepTitle = currentStep
      ? isEn
        ? currentStep.titleEn || currentStep.titleZh || currentStep.title
        : currentStep.titleZh || currentStep.title
      : '';
    const currentStepGuide = currentStep
      ? isEn
        ? currentStep.guideTextEn || currentStep.guideTextZh || currentStep.guide_text
      : currentStep.guideTextZh || currentStep.guide_text
      : '';

    return (
      <div
        data-testid="linked-sandbox-active"
        className={`w-full overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col gap-3 p-4 box-border relative ${className}`}
        style={{ minHeight: containerHeight, height: containerHeight, ...style }}
      >
        {/* 画布主视口 + 侧边不变量遥测栏与步骤指示 */}
        <div className="sandbox-split-box flex-1 min-h-0 flex flex-col lg:flex-row gap-3.5">
          {/* 主视口 (JSXGraph 画布) */}
          <div className="sandbox-viewport-85 flex-[1_1_78%] h-full min-h-0 relative">
            <SandboxRenderer
              key={sandboxId}
              config={config}
              paramValues={paramValues}
              onInvariantsChange={setInvariants}
              onPointsChange={setLivePoints}
              locale={locale}
              className="h-full w-full"
            />
          </div>

          {/* 右侧仪表盘 (.sandbox-guide-15, Slate 900 暗室配色) */}
          <div className="sandbox-guide-15 w-full lg:w-64 shrink-0 flex flex-col gap-2.5 rounded-2xl bg-slate-800/90 dark:bg-slate-950/95 border border-slate-700/60 p-3.5 text-slate-100 shadow-inner justify-between overflow-y-auto">
            {/* 1~3 步自适应探究引导胶囊 */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 pb-2 border-b border-slate-700/60">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold tracking-wide text-sky-300">
                      {isEn ? 'Inquiry Mission' : '核心探究任务'}
                    </span>
                  </div>

                  {hasSteps && (
                    <button
                      type="button"
                      onClick={() => setIsFreePlayMode(!isFreePlayMode)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-all active:scale-[0.98]"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>
                        {isFreePlayMode
                          ? isEn
                            ? 'Guided Mode'
                            : '返回引导探究'
                          : isEn
                          ? 'Free Play'
                          : '直接自由把玩'}
                      </span>
                    </button>
                  )}
                </div>

                {/* 步骤快速选择胶囊与重新开始按钮 (解决问题 1) */}
                {hasSteps && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {inquirySteps.map((s, idx) => {
                      const isCurrent = !isFreePlayMode && activeStepIndex === idx;
                      const isDone = completedStepIndices.has(idx);
                      return (
                        <button
                          key={s.step || idx}
                          type="button"
                          onClick={() => {
                            setIsFreePlayMode(false);
                            setActiveStepIndex(idx);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                            isCurrent
                              ? 'bg-sky-500 text-white shadow-sm ring-1 ring-sky-300'
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
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>{isEn ? 'Reset' : '重新开始'}</span>
                    </button>
                  </div>
                )}
              </div>

              {hasSteps && !isFreePlayMode && currentStep ? (
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-sky-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">
                      {isEn
                        ? `Step ${activeStepIndex + 1}/${inquirySteps.length}`
                        : `步骤 ${activeStepIndex + 1}/${inquirySteps.length}`}
                    </span>
                    <span className="text-[11px] text-slate-300 truncate max-w-[120px] font-medium">
                      {currentStepTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed m-0 font-normal">
                    {currentStepGuide}
                  </p>

                  {/* 达成状态与名师秘籍查看入口 (解决问题 2) */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800 text-[11px]">
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

                    {(currentStep.aha_insight || currentStep.ahaInsightZh || currentStep.ahaInsightEn) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentAhaStep(currentStep);
                          setShowAhaModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 underline underline-offset-2"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{isEn ? 'Insight' : '名师秘籍'}</span>
                      </button>
                    )}
                  </div>

                  {/* 上一步 / 下一步 导航推进按钮组 (解决问题 2: 渐进过程可继续) */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={activeStepIndex === 0}
                      onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Prev' : '上一步'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAdvanceToNextStep}
                      className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow ${
                        completedStepIndices.has(activeStepIndex)
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <span>
                        {activeStepIndex + 1 < inquirySteps.length
                          ? completedStepIndices.has(activeStepIndex)
                            ? isEn ? 'Achieved · Next ➔' : '已达成 · 下一步 ➔'
                            : isEn ? 'Next Step ➔' : '进入下一步 ➔'
                          : isEn ? 'Finish · Free Play' : '完成探究 · 自由把玩'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : hasSteps && isFreePlayMode ? (
                <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isEn ? 'Free Play Active' : '自由把玩已开启'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFreePlayMode(false);
                        setActiveStepIndex(0);
                      }}
                      className="text-[11px] text-sky-400 hover:text-sky-300 underline underline-offset-2"
                    >
                      {isEn ? 'Start from Step 1' : '从步骤 1 重新开始'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal m-0">
                    {isEn
                      ? 'Freely drag dynamic points and adjust sliders to discover mathematical invariants.'
                      : '已解除步骤限制，可随意拖拽动点与滑动参数，深入观测几何守恒。点击上方步骤标签可随时切回引导。'}
                  </p>
                </div>
              ) : null}
            </div>

            {/* 不变量遥测与动点坐标实时监控 (解决问题 3: 拖拽实时更新) */}
            <div className="flex flex-col gap-2">
              {/* 动点实时坐标指示 (动态响应拖拽) */}
              {Object.keys(livePoints).length > 0 && (
                <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-900/80 border border-slate-700/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isEn ? 'Live Coordinates:' : '动点实时坐标：'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(livePoints)
                      .filter(([id]) => !id.startsWith('distractor_') && !id.startsWith('grid_'))
                      .slice(0, 4)
                      .map(([id, pt]) => (
                        <span
                          key={id}
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300"
                        >
                          {id.replace(/^p_/, '')}({pt.x.toFixed(1)}, {pt.y.toFixed(1)})
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* 几何不变量与代数守恒清单 (全量多项实时更新) */}
              <div className="telemetry-readings flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                {invariants.length > 0 ? (
                  invariants.slice(0, 4).map((inv, i) => (
                    <div
                      key={inv.id || i}
                      className="flex flex-col gap-0.5 border-b border-slate-800/80 pb-1.5 last:border-b-0 last:pb-0"
                    >
                      <span className="telemetry-tag-invariant text-xs font-mono text-sky-300 font-semibold break-words">
                        {inv.text}
                      </span>
                      <span className="telemetry-tag-secondary text-[10px] text-slate-400">
                        {inv.isConstant
                          ? isEn
                            ? '[Absolute Invariant]'
                            : '[绝对恒定]'
                          : isEn
                          ? '[Dynamic Observation]'
                          : '[动态观测中]'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="telemetry-tag-invariant text-xs font-mono text-sky-300 font-semibold break-words">
                      {isEn ? 'Area and segment ratio conserved' : '面积与线段比例守恒'}
                    </span>
                    <span className="telemetry-tag-secondary text-[11px] text-slate-400">
                      {isEn ? 'Status: [Absolute Invariant]' : '状态：[绝对恒定]'}
                    </span>
                  </div>
                )}
              </div>

              <div className="telemetry-tag-conclusion text-[11px] text-emerald-400 font-medium p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-center">
                {isEn
                  ? 'Conclusion: Geometric intuitive verification passed'
                  : '结论：几何直观验证通过'}
              </div>
            </div>
          </div>
        </div>

        {/* 底部参数滑块控制条 */}
        <div className="sandbox-controls-bar w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50">
          <div className="flex gap-4 w-full flex-wrap items-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>{isEn ? 'Sliders' : '参数调控'}</span>
            </div>
            {sliders.map((s) => {
              const val = paramValues[s.id] ?? s.default;
              return (
                <div key={s.id} className="slider-group flex items-center gap-2">
                  <label htmlFor={`linked-slider-${s.id}`} className="text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {s.name}:{' '}
                    <strong className="text-blue-600 dark:text-sky-400 font-semibold">
                      {val}
                      {s.unit || ''}
                    </strong>
                  </label>
                  <input
                    id={`linked-slider-${s.id}`}
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step || 0.1}
                    value={val}
                    onChange={(e) => {
                      const next = parseFloat(e.target.value);
                      setParamValues((prev) => ({ ...prev, [s.id]: next }));
                    }}
                    className="w-24 sm:w-32 cursor-pointer accent-blue-600"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Aha! 顿悟微弹窗 (iOS 27 浅色毛玻璃浮层) */}
        {showAhaModal && currentAhaStep && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-amber-500/40 shadow-2xl p-6 flex flex-col gap-4 transform transition-all scale-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {isEn ? 'Aha! Breakthrough' : 'Aha! 名师顿悟秘籍'}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white m-0">
                      {isEn
                        ? currentAhaStep.titleEn || currentAhaStep.titleZh || currentAhaStep.title
                        : currentAhaStep.titleZh || currentAhaStep.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAhaModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 核心顿悟内容 */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                <MathRenderer
                  content={
                    (isEn
                      ? currentAhaStep.ahaInsightEn || currentAhaStep.ahaInsightZh || currentAhaStep.aha_insight
                      : currentAhaStep.ahaInsightZh || currentAhaStep.aha_insight) || ''
                  }
                />
              </div>

              {/* 操作推进按钮 */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNextStepOrFreePlay}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
                >
                  <span>
                    {activeStepIndex + 1 < inquirySteps.length
                      ? isEn
                        ? 'Next Step ➜'
                        : '开启下一步骤 ➜'
                      : isEn
                      ? 'Enter Free Play'
                      : '全量达成 · 自由把玩'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 分支 2：无沙盒或纯代数/概念定理，渲染物理等大 CLS=0 占位卡
  return (
    <div
      data-testid="linked-sandbox-placeholder"
      className={`w-full flex flex-col items-center justify-center p-8 rounded-3xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-xl select-none transition-all box-border ${className}`}
      style={{ minHeight: containerHeight, height: containerHeight, ...style }}
    >
      <div className="max-w-md text-center flex flex-col items-center gap-4">
        {/* 占位徽章 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="ruler" size={13} />
            <span>{isEn ? 'Pure Algebraic Concept' : '纯数式/概念考点'}</span>
          </span>
          <span>·</span>
          <span>{isEn ? 'Direct Theorem Reading' : '基础定理直读'}</span>
        </div>

        {/* 核心提示蓝框 */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs sm:text-sm text-blue-600 dark:text-sky-400 leading-relaxed text-center w-full box-border">
          <MathRenderer content="本考点聚焦于代数数式运算、逻辑公理与严谨公式定义，无需动力学几何拖拽模拟。" />
        </div>

        {/* 快捷指引 */}
        <p className="m-0 text-xs text-slate-400 dark:text-slate-500">
          {isEn
            ? 'You can switch directly to Master Example and Quick Practice.'
            : '您可直接滑动或进入下一步【③ 考点母题】与【④ 单点快练】'}
        </p>
      </div>
    </div>
  );
};
