/**
 * StepMetricsHUD: UI 容器自适应与通用 Live HUD 引擎 (PLAN-MODEL-REPAIR-V2 轨道 1)
 *
 * 核心特性：
 * 1. 针对重点几何考点渲染高对比度暗室风格 Live HUD (Slate 950 / Sky 400 / Emerald 400)；
 * 2. 勾股定理专属 HUD (SB-KP057 / leg_a, leg_b)：毫秒级数值对比 a²+b² ≡ c² 及恒等胶囊；
 * 3. 斜边中线专属 HUD (SB-KP056)：计算 AB, CM, 比例 CM:AB = 0.50，高亮展示 "CM = 1/2 AB ✓"；
 * 4. 菱形面积专属 HUD (SB-KP065)：计算 S = 1/2 d1 d2，显式高亮面积守恒；
 * 5. 通用兜底 HUD：提取前 1~2 项不变量置顶渲染，附带动态脉冲指示点；
 * 6. 严格红线：源码零 emoji、零 eval、零 innerHTML、零 foreign-object。
 */

import React from 'react';
import { MathRenderer } from '../../components/math/MathRenderer';

export interface StepMetricsHUDProps {
  sandboxId?: string;
  stepIndex: number;
  guideText: string;
  paramValues: Record<string, number>;
  invariants: Array<{ id?: string; text: string; isConstant?: boolean }>;
  locale?: string;
}

export const StepMetricsHUD: React.FC<StepMetricsHUDProps> = ({
  sandboxId,
  stepIndex: _stepIndex,
  guideText: _guideText,
  paramValues,
  invariants,
  locale = 'zh-CN',
}) => {
  const isEn = String(locale).toLowerCase().startsWith('en');

  // 模型考点判定分支
  const isHypotenuseMedian =
    sandboxId === 'SB-KP056' ||
    Boolean(sandboxId && sandboxId.includes('056')) ||
    ('point_t' in paramValues && ('leg_a' in paramValues || 'leg_b' in paramValues));

  const isPythagorean =
    !isHypotenuseMedian &&
    (sandboxId === 'SB-KP057' ||
      Boolean(sandboxId && sandboxId.includes('057')) ||
      ('leg_a' in paramValues && 'leg_b' in paramValues) ||
      ('a' in paramValues && 'b' in paramValues));

  const isRhombus =
    sandboxId === 'SB-KP065' ||
    Boolean(sandboxId && sandboxId.includes('065')) ||
    ('diag_h' in paramValues && 'diag_v' in paramValues) ||
    ('d1' in paramValues && 'd2' in paramValues);

  // a) 勾股定理专用 HUD
  if (isPythagorean) {
    const a = Number(paramValues['leg_a'] ?? paramValues['a'] ?? 4);
    const b = Number(paramValues['leg_b'] ?? paramValues['b'] ?? 3);
    const c = Math.hypot(a, b);
    const sumSq = Math.round((a * a + b * b) * 100) / 100;
    const cFormatted = c.toFixed(2);
    const cNum = parseFloat(cFormatted);
    const cSq = Math.round(cNum * cNum * 100) / 100;
    const isIdentityHeld = Math.abs(sumSq - cSq) < 0.05;

    return (
      <div
        data-testid="step-metrics-hud"
        data-hud-type="pythagorean"
        className="w-full rounded-xl bg-slate-950/95 border border-slate-700/70 p-2.5 shadow-md flex flex-col gap-1.5"
      >
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            <span className="text-[11px] font-bold text-sky-400 tracking-wide uppercase">
              {isEn ? 'Live HUD: Pythagorean Invariant' : '实时度量：勾股代数守恒'}
            </span>
          </div>

          {isIdentityHeld && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse">
              <span>{isEn ? 'Identity holds a²+b²≡c² ✓' : '恒等成立 a²+b²≡c² ✓'}</span>
            </span>
          )}
        </div>

        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 text-[11px] font-mono flex-wrap">
            <span className="text-sky-300 font-semibold">
              {`${isEn ? 'LHS: ' : '左边 '}a² + b² = ${a}² + ${b}² = ${sumSq}`}
            </span>
            <span className="text-amber-400 font-bold">≡</span>
            <span className="text-emerald-300 font-semibold">
              {`${isEn ? 'RHS: ' : '右边 '}c² = (${cFormatted})² = ${cSq}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 font-mono">
            <span>a = {a} (勾)</span>
            <span>b = {b} (股)</span>
            <span>c = {cFormatted} (弦)</span>
          </div>
        </div>
      </div>
    );
  }

  // b) 斜边中线专用 HUD
  if (isHypotenuseMedian) {
    const legA = Number(paramValues['leg_a'] ?? paramValues['a'] ?? 6);
    const legB = Number(paramValues['leg_b'] ?? paramValues['b'] ?? 4);
    const pointT = Number(paramValues['point_t'] ?? 0.5);

    const ab = Math.hypot(legA, legB);
    // 动点 M: (pointT * legA, (1 - pointT) * legB)
    const cm = Math.hypot(pointT * legA, (1 - pointT) * legB);
    const ratio = ab > 0 ? cm / ab : 0.5;

    const abFormatted = ab.toFixed(2);
    const cmFormatted = cm.toFixed(2);
    const ratioFormatted = ratio.toFixed(2);
    const isMidpointSatisfied = Math.abs(ratio - 0.5) < 0.02 || Math.abs(cm - 0.5 * ab) < 0.05;

    return (
      <div
        data-testid="step-metrics-hud"
        data-hud-type="hypotenuse-median"
        className="w-full rounded-xl bg-slate-950/95 border border-slate-700/70 p-2.5 shadow-md flex flex-col gap-1.5"
      >
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-sky-400 tracking-wide uppercase">
              {isEn ? 'Live HUD: Hypotenuse Median' : '实时度量：斜边中线定理'}
            </span>
          </div>

          {isMidpointSatisfied && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse">
              <span>CM = 1/2 AB ✓</span>
            </span>
          )}
        </div>

        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 text-[11px] font-mono flex-wrap">
            <span className="text-sky-300 font-semibold">{`AB = ${abFormatted}`}</span>
            <span className="text-indigo-300 font-semibold">{`CM = ${cmFormatted}`}</span>
            <span className="text-emerald-300 font-bold">
              {`${isEn ? 'Ratio CM:AB = ' : '比例 CM:AB = '}${ratioFormatted}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 font-mono">
            <span>{isEn ? `Leg a=${legA}, b=${legB}` : `直角边 a=${legA}, b=${legB}`}</span>
            <span>
              {Math.abs(pointT - 0.5) < 0.01
                ? isEn ? 'Midpoint M (t=0.50)' : '斜边中点 M (t=0.50)'
                : `t = ${pointT.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // c) 菱形面积专用 HUD (SB-KP065) 或其他面积守恒模型
  if (isRhombus) {
    const d1 = Number(paramValues['diag_h'] ?? paramValues['d1'] ?? 6);
    const d2 = Number(paramValues['diag_v'] ?? paramValues['d2'] ?? 4);
    const area = 0.5 * d1 * d2;

    return (
      <div
        data-testid="step-metrics-hud"
        data-hud-type="rhombus-area"
        className="w-full rounded-xl bg-slate-950/95 border border-slate-700/70 p-2.5 shadow-md flex flex-col gap-1.5"
      >
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-[11px] font-bold text-sky-400 tracking-wide uppercase">
              {isEn ? 'Live HUD: Rhombus Area Metric' : '实时度量：菱形面积守恒'}
            </span>
          </div>

          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <span>S = 1/2 d₁d₂ ✓</span>
          </span>
        </div>

        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 text-[11px] font-mono flex-wrap">
            <span className="text-sky-300 font-semibold">{`d₁ = ${d1}, d₂ = ${d2}`}</span>
            <span className="text-emerald-300 font-bold">
              {`S = 1/2 × ${d1} × ${d2} = ${area.toFixed(2)}`}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
            {isEn
              ? 'Perpendicular diagonals: Area equals half the product of diagonals'
              : '对角线互相垂直平分，面积恒等于对角线乘积之一半'}
          </div>
        </div>
      </div>
    );
  }

  // d) 通用兜底 HUD
  const topInvariants = invariants && invariants.length > 0 ? invariants.slice(0, 2) : [];

  return (
    <div
      data-testid="step-metrics-hud"
      data-hud-type="fallback"
      className="w-full rounded-xl bg-slate-950/95 border border-slate-700/70 p-2.5 shadow-md flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-sky-400 tracking-wide uppercase">
            {isEn ? 'Live Telemetry HUD' : '核心测度实时 HUD'}
          </span>
        </div>

        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/20 text-sky-300">
          <span>{isEn ? 'Active' : '动态监测'}</span>
        </span>
      </div>

      <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2 text-xs flex flex-col gap-1">
        {topInvariants.length > 0 ? (
          topInvariants.map((inv, idx) => (
            <div
              key={inv.id || idx}
              className="flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1 last:border-b-0 last:pb-0"
            >
              <span className="text-sky-300 font-mono text-[11px] font-semibold flex-1 min-w-0 break-words leading-tight">
                <MathRenderer content={inv.text} />
              </span>
              <span className="text-[10px] text-emerald-400 shrink-0 font-medium">
                {inv.isConstant
                  ? isEn ? '[Constant ✓]' : '[绝对恒定 ✓]'
                  : isEn ? '[Observing]' : '[动态观测中]'}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
            <span>{isEn ? 'Geometric Invariants Active' : '几何守恒关系动态观测中'}</span>
            <span className="text-[10px] text-emerald-400">[恒定 ✓]</span>
          </div>
        )}
      </div>
    </div>
  );
};
