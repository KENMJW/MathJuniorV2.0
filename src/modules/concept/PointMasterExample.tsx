/**
 * 考点黄金母题 1~4 阶思维阶梯手风琴组件 (TASK-FE-0021 步骤 4)
 *
 * 核心特性：
 * 1. 彻底淘汰生硬长篇答案直接平铺，重构为 1~4 阶思维脚手架手风琴（Accordion）：
 *    - 思维阶梯 1：审题题眼与隐藏条件 ➜ 点按展开题眼剖析 (dim1_origin)
 *    - 思维阶梯 2：本真直观与数形模型 ➜ 点按展开图形几何与代数对应 (dim2_essence)
 *    - 思维阶梯 3：严密推导与中考踩分点 ➜ 点按展开 LaTeX 严密踩分步骤 (dim3_rigor)
 *    - 思维阶梯 4：避坑指南与防扣分生死线 ➜ 点按展开警示红框 (dim4_traps)
 * 2. 全量采用 Tailwind 原子类与 iOS 27 液态玻璃设计，内联样式 style={{ 归零；
 * 3. 按钮挂载 active:scale-[0.98] 物理按压反馈；
 * 4. 铁律 3：所有文本与公式均走 <MathRenderer> 出口；
 * 5. 铁律 11：源码绝对零 emoji。
 */

import React, { useState } from 'react';
import { MathRenderer } from '../../components/math/MathRenderer';
import { QuestionContent } from '../../components/common/QuestionContent';
import { QuestionImage } from '../../components/common/QuestionImage';
import { SourceTag } from '../../components/common/SourceTag';
import { normalizeOptionAnswer } from '../../engine/judge/normalizeOptionAnswer';
import { useSessionStore } from '../../store/sessionStore';
import { getSafeStem } from '../../engine/i18n/stemGuard';
import {
  Lightbulb,
  Compass,
  FileCheck2,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface MasterExampleItem {
  example_id: string;
  example_type?: 'point_master' | 'line_master' | string;
  bound_target_id?: string;
  primary_point_id?: string;
  source?: string | null;
  stem_zh: string;
  stem_en?: string | null;
  options_json?: string | null;
  correct_option?: string | null;
  answer_standard?: string;
  dim1_origin?: string | null;
  dim1_origin_en?: string | null;
  dim2_essence?: string | null;
  dim2_essence_en?: string | null;
  dim3_rigor: string; // 严谨证明：非空，必展示
  dim3_rigor_en?: string | null;
  dim4_traps?: string | null;
  dim4_traps_en?: string | null;
  available_dimensions?: number; // 默认 4
  image_paths_json?: string | null;
}

export interface PointMasterExampleProps {
  example: MasterExampleItem;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface DimensionMeta {
  index: number;
  key: string;
  stepTitleZh: string;
  stepTitleEn: string;
  legacyTitleZh: string;
  legacyTitleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  iconType: 'lightbulb' | 'compass' | 'file' | 'alert';
}

const DIMENSIONS_META: DimensionMeta[] = [
  {
    index: 1,
    key: 'dim1',
    stepTitleZh: '思维阶梯 1：审题题眼与隐藏条件',
    stepTitleEn: 'Thinking Step 1: Problem Eyes & Hidden Conditions',
    legacyTitleZh: '第 1 维 · 直观具象本源',
    legacyTitleEn: 'Dimension 1 · Intuitive Origin',
    subtitleZh: '审题破局 · 题眼剖析',
    subtitleEn: 'Dissection of Problem Eyes',
    iconType: 'lightbulb',
  },
  {
    index: 2,
    key: 'dim2',
    stepTitleZh: '思维阶梯 2：本真直观与数形模型',
    stepTitleEn: 'Thinking Step 2: Intuitive Geometry & Algebra Model',
    legacyTitleZh: '第 2 维 · 核心数学本质',
    legacyTitleEn: 'Dimension 2 · Core Essence',
    subtitleZh: '数形结合 · 本真模型',
    subtitleEn: 'Number & Shape Model',
    iconType: 'compass',
  },
  {
    index: 3,
    key: 'dim3',
    stepTitleZh: '思维阶梯 3：严密推导与中考踩分点',
    stepTitleEn: 'Thinking Step 3: Rigorous Derivation & Exam Scoring Points',
    legacyTitleZh: '第 3 维 · 严谨推导证明',
    legacyTitleEn: 'Dimension 3 · Rigor & Proof',
    subtitleZh: '规范表达 · 踩分要点',
    subtitleEn: 'Step-by-step Scoring Points',
    iconType: 'file',
  },
  {
    index: 4,
    key: 'dim4',
    stepTitleZh: '思维阶梯 4：避坑指南与防扣分生死线',
    stepTitleEn: 'Thinking Step 4: Pitfall Guide & Deduction Defense',
    legacyTitleZh: '第 4 维 · 高阶易错变式',
    legacyTitleEn: 'Dimension 4 · Traps & Variations',
    subtitleZh: '避坑指南 · 生死红线',
    subtitleEn: 'Trap Defense & Variations',
    iconType: 'alert',
  },
];

export const PointMasterExample: React.FC<PointMasterExampleProps> = ({
  example,
  locale: propLocale,
  className = '',
  style: _style = {},
}) => {
  const sessionLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || sessionLocale;
  const isEn = String(locale).toLowerCase().startsWith('en');

  // 可用维度上限 (默认 4)
  const maxAvailable = Math.max(3, Math.min(4, example.available_dimensions ?? 4));

  // 默认进入 4 个阶段全部上锁，通过集合管理已解锁的维度 (1~4)
  const [unlockedDimensions, setUnlockedDimensions] = useState<Set<number>>(() => new Set<number>());

  // 手风琴折叠状态管理 (默认解锁后自动展开)
  const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(() => new Set<number>());

  // 计算下一个可步进解锁的维度序号
  const nextToUnlock = [1, 2, 3, 4].find(
    (idx) => idx <= maxAvailable && !unlockedDimensions.has(idx)
  );

  // 解锁指定维度 (支持点击卡片直接解锁并展开手风琴)
  const handleUnlockDimension = (index: number) => {
    setUnlockedDimensions((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setExpandedDimensions((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  // 切换手风琴展开/折叠
  const handleToggleAccordion = (index: number) => {
    if (!unlockedDimensions.has(index)) {
      handleUnlockDimension(index);
      return;
    }
    setExpandedDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 步进解锁下一维
  const handleUnlockNext = () => {
    if (nextToUnlock !== undefined) {
      handleUnlockDimension(nextToUnlock);
    }
  };

  // 获取对应维度的内容
  const getDimensionContent = (index: number): string => {
    switch (index) {
      case 1:
        return (isEn && example.dim1_origin_en)
          ? example.dim1_origin_en
          : example.dim1_origin || (isEn ? '(Intuitive origin pending)' : '（待补充直观源头）');
      case 2:
        return (isEn && example.dim2_essence_en)
          ? example.dim2_essence_en
          : example.dim2_essence || (isEn ? '(Core essence pending)' : '（待补充数学本质）');
      case 3:
        return (isEn && example.dim3_rigor_en)
          ? example.dim3_rigor_en
          : example.dim3_rigor; // 严谨证明 (必填必展示)
      case 4:
        return (isEn && example.dim4_traps_en)
          ? example.dim4_traps_en
          : example.dim4_traps || (isEn ? '(Variations pending)' : '（待补充易错变式）');
      default:
        return '';
    }
  };

  // 解析选择题选项 (如有)
  let optionsMap: Record<string, { zh: string; en?: string; img?: string }> = {};
  try {
    if (example.options_json) {
      optionsMap = JSON.parse(example.options_json);
    }
  } catch {
    optionsMap = {};
  }

  const renderIcon = (type: DimensionMeta['iconType']) => {
    switch (type) {
      case 'lightbulb':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'compass':
        return <Compass className="w-4 h-4 text-blue-500" />;
      case 'file':
        return <FileCheck2 className="w-4 h-4 text-emerald-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div
      data-testid="point-master-example-card"
      className={`w-full p-6 rounded-3xl backdrop-blur-xl bg-white/70 border border-slate-200/80 shadow-xl flex flex-col gap-6 box-border ${className}`}
    >
      {/* 头部元信息 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
              {isEn ? `ME Master Example · ${example.example_id}` : `ME 考点母题 · ${example.example_id}`}
            </span>
            {example.source && (
              <SourceTag source={example.source} maxWidth="220px" />
            )}
          </div>
          <h2 className="m-0 text-lg font-black text-slate-900">
            {isEn ? 'Master Example Deep Dive (4D Progressive Perspective)' : '压轴母题深度拆解 (四维步进透视)'}
          </h2>
        </div>

        {/* 步进进度指示 */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {isEn ? 'Progress: ' : '解锁进度：'}
            <strong className="text-blue-600 font-bold">{unlockedDimensions.size}</strong>
            {isEn ? ` / ${maxAvailable} Dimensions` : ` / ${maxAvailable} 维`}
          </span>
          {nextToUnlock !== undefined && (
            <button
              type="button"
              onClick={handleUnlockNext}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isEn ? `Unlock Dimension ${nextToUnlock}` : `步进解锁第 ${nextToUnlock} 维`}</span>
            </button>
          )}
        </div>
      </div>

      {/* 母题题干 (严格走 MathRenderer) */}
      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-3">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
          {isEn ? 'Master Example Stem' : '母题题干'}
        </span>
        <div className="db-content-body text-slate-900 text-sm leading-relaxed overflow-hidden break-words max-w-full">
          <QuestionContent content={getSafeStem(example, isEn)} images={example.image_paths_json} />
        </div>

        {/* 若有备选选项 */}
        {Object.keys(optionsMap).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {['A', 'B', 'C', 'D'].map((k) => {
              const opt = optionsMap[k];
              if (!opt) return null;
              const isCorrect =
                normalizeOptionAnswer(example.correct_option || example.answer_standard) ===
                normalizeOptionAnswer(k);
              return (
                <div
                  key={k}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
 isCorrect
 ? 'border-blue-500 bg-blue-500/10 text-blue-700 font-semibold'
 : 'border-slate-200/80 bg-white/60 text-slate-700'
 }`}
                >
                  <span className="font-extrabold text-blue-600">{k}.</span>
                  <div className="flex-1 overflow-x-auto flex flex-col gap-1">
                    {opt.img ? (
                      <QuestionImage role="option" src={opt.img} alt={`选项 ${k}`} />
                    ) : (
                      <MathRenderer content={isEn && opt.en ? opt.en : opt.zh} />
                    )}
                  </div>
                  {isCorrect && (
                    <span className="text-[11px] font-bold text-blue-600 inline-flex items-center gap-1 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Correct' : '正解'}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1~4 阶思维阶梯手风琴序列 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            {isEn ? '4D Cognitive Evolution' : '四维认知透视演进'}
          </h3>
          <span className="text-xs text-slate-400">
            {isEn ? '1~4 Step Thought Scaffold' : '1~4 阶思维脚手架手风琴'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {DIMENSIONS_META.map((dim) => {
            const isUnlocked = unlockedDimensions.has(dim.index);
            const isExpanded = expandedDimensions.has(dim.index);
            const content = getDimensionContent(dim.index);
            const legacyTitle = isEn ? dim.legacyTitleEn : dim.legacyTitleZh;
            const stepTitle = isEn ? dim.stepTitleEn : dim.stepTitleZh;
            const isTrapStep = dim.index === 4;
            const isRigorStep = dim.index === 3;

            // 未解锁状态：渲染可点击卡片
            if (!isUnlocked) {
              return (
                <div
                  key={dim.key}
                  data-testid={`master-dim-card-${dim.index}-locked`}
                  onClick={() => handleUnlockDimension(dim.index)}
                  role="button"
                  tabIndex={0}
                  title={
                    isEn
                      ? `Click to unlock ${dim.stepTitleEn} (${legacyTitle})`
                      : `点击解锁${stepTitle}（${legacyTitle}）`
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleUnlockDimension(dim.index);
                    }
                  }}
                  className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/60 active:scale-[0.98] transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-left">
                      <div className="text-xs sm:text-sm font-bold text-slate-700">
                        {stepTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {legacyTitle} · {isEn ? dim.subtitleEn : dim.subtitleZh}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 whitespace-nowrap hidden sm:inline">
                    {isEn ? 'Click card or button above to unlock' : '点击卡片或上方按钮解锁'}
                  </span>
                </div>
              );
            }

            // 已解锁状态：渲染 1~4 阶手风琴卡片
            return (
              <div
                key={dim.key}
                data-testid={`master-dim-card-${dim.index}`}
                className={`rounded-2xl border transition-all overflow-hidden ${
 isTrapStep
 ? 'border-red-500/30 bg-red-500/5'
 : isRigorStep
 ? 'border-emerald-500/30 bg-emerald-500/5'
 : 'border-slate-200/80 bg-white/80 shadow-md'
 }`}
              >
                {/* 手风琴头部触控条 */}
                <button
                  type="button"
                  onClick={() => handleToggleAccordion(dim.index)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left bg-transparent border-none cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {renderIcon(dim.iconType)}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {stepTitle}
                        </span>
                        <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold shrink-0">
                          {legacyTitle}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isEn ? dim.subtitleEn : dim.subtitleZh}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                      {isEn ? 'Unlocked' : '已解锁'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
 isExpanded ? 'rotate-180' : ''
 }`}
                    />
                  </div>
                </button>

                {/* 手风琴展开内容区 */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200/50 animate-in fade-in duration-150">
                    {/* 阶梯 4 避坑指南专属警告浮层 */}
                    {isTrapStep && (
                      <div className="mb-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs font-bold text-red-600">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          {isEn
                            ? 'Warning: Critical boundary trap & common deduction pitfall!'
                            : '避坑生死线：中考高频扣分点与临界极值陷阱警告！'}
                        </span>
                      </div>
                    )}

                    {/* 阶梯 3 严密推导中考踩分点专属提示 */}
                    {isRigorStep && (
                      <div className="mb-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-700">
                        <FileCheck2 className="w-4 h-4 shrink-0" />
                        <span>
                          {isEn
                            ? 'Official Standard: Step-by-step rigorous proof & scoring rubric.'
                            : '官方判分标准：严密公式推导与中考分步踩分点。'}
                        </span>
                      </div>
                    )}

                    <div className="db-content-sub text-slate-800 text-xs sm:text-sm leading-relaxed overflow-hidden break-words max-w-full">
                      <QuestionContent
                        content={content}
                        images={example.image_paths_json}
                        role="solution"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
