import React, { useState } from 'react';
import { MathRenderer } from '../../components/math/MathRenderer';
import { QuestionContent } from '../../components/common/QuestionContent';
import { QuestionImage } from '../../components/common/QuestionImage';
import { SolutionList } from '../exam/SolutionList';
import { Icon } from '../../components/common/Icon';
import {
  QuickPracticeQuestion,
  drawFromPool,
  filterEligibleQuestions,
} from './quickPractice.machine';
import { normalizeOptionAnswer } from '../../engine/judge/normalizeOptionAnswer';
import { useSessionStore } from '../../store/sessionStore';
import { getSafeStem } from '../../engine/i18n/stemGuard';
import { BookOpen, Star, RefreshCw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export interface QuickPracticeProps {
  pointId: string;
  allQuestions?: QuickPracticeQuestion[];
  initialQuestions?: QuickPracticeQuestion[];
  className?: string;
  style?: React.CSSProperties;
  locale?: string;
  onAnswer?: (questionId: string, isCorrect: boolean, score: number) => void;
  onRefreshBatch?: () => void;
  onReturnToConcept?: () => void;
}

/**
 * 探本溯源·概念精讲 - 单点快练组件 (TASK-FE-0021 步骤 5)
 *
 * 铁律规范：
 * 1. 铁律 3：题干、选项文本、解析全部经由 <MathRenderer> 出口渲染，严禁 import katex 或裸 innerHTML；
 * 2. 业务锁：严格锁 L1~L3 难度、question_type='single_choice'；
 * 3. 48px 热区即答即判：点击选项立即计算正误并录入 sessionStore.practiceScores；
 * 4. 错题点拨与 [ 回看概念精讲 ] 直达入口；
 * 5. 3 题作答完毕后 1~3 星素养掌握度结算卡片；
 * 6. 纯 Tailwind CSS 原子类与 iOS 27 液态玻璃设计，内联样式归零；
 * 7. 源码绝对零 emoji。
 */
export const QuickPractice: React.FC<QuickPracticeProps> = ({
  pointId,
  allQuestions = [],
  initialQuestions,
  className = '',
  style: _style = {},
  locale: propLocale,
  onAnswer,
  onRefreshBatch,
  onReturnToConcept,
}) => {
  const storeLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || storeLocale || 'zh-CN';
  const isEn = String(locale).toLowerCase().startsWith('en');
  const presentedIds = useSessionStore((state) => state.presentedIds);
  const addPresentedIds = useSessionStore((state) => state.addPresentedIds);
  const clearPresentedIds = useSessionStore((state) => state.clearPresentedIds);
  const recordPracticeScore = useSessionStore((state) => state.recordPracticeScore);

  // 初始化当前 3 道快练题
  const [currentQuestions, setCurrentQuestions] = useState<QuickPracticeQuestion[]>(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return initialQuestions.slice(0, 3);
    }
    const eligible = filterEligibleQuestions(allQuestions, pointId);
    if (eligible.length < 3) {
      return [];
    }
    const { drawnQuestions } = drawFromPool(eligible, presentedIds, []);
    return drawnQuestions;
  });

  // 用户作答状态记录 (questionId -> selectedOptionKey)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 选项点击：即答即判
  const handleSelectOption = (q: QuickPracticeQuestion, optionKey: string) => {
    if (selectedAnswers[q.question_id]) {
      return; // 已作答题锁定，不可重复点击
    }

    const isCorrect = normalizeOptionAnswer(optionKey) === normalizeOptionAnswer(q.answer_standard);
    const earnedScore = isCorrect ? q.score_default : 0;

    setSelectedAnswers((prev) => ({ ...prev, [q.question_id]: optionKey }));
    recordPracticeScore(q.question_id, earnedScore);
    onAnswer?.(q.question_id, isCorrect, earnedScore);
  };

  // 换一批练习（核心闭环：台账 H2 验证点）
  const handleNextBatch = () => {
    const eligible = filterEligibleQuestions(allQuestions, pointId);
    if (eligible.length < 3) {
      setToastMessage(isEn ? 'Not enough practice questions (min 3)' : '该考点题库不足3题，无法组卷');
      return;
    }

    const currentBatchIds = currentQuestions.map((q) => q.question_id);
    const result = drawFromPool(eligible, presentedIds, currentBatchIds);

    if (result.poolExhausted) {
      clearPresentedIds();
      addPresentedIds(Array.from(result.nextPresentedIds));
      setToastMessage(
        isEn
          ? 'Question pool exhausted. Reset and loaded new batch!'
          : '考点题池已轮空，已重置去重池并换入新一组题目！'
      );
    } else {
      addPresentedIds(result.drawnQuestions.map((q) => q.question_id));
      setToastMessage(isEn ? 'New batch loaded' : '已换一批练习');
    }

    setCurrentQuestions(result.drawnQuestions);
    setSelectedAnswers({});
    onRefreshBatch?.();

    setTimeout(() => setToastMessage(null), 3000);
  };

  // 计算结算星级 (1~3 星)
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = currentQuestions.length > 0 && answeredCount === currentQuestions.length;

  const correctCount = currentQuestions.filter((q) => {
    const userChoice = selectedAnswers[q.question_id];
    return userChoice && normalizeOptionAnswer(userChoice) === normalizeOptionAnswer(q.answer_standard);
  }).length;

  const starRating = correctCount === 3 ? 3 : correctCount === 2 ? 2 : 1;

  const handleGoToConcept = () => {
    if (onReturnToConcept) {
      onReturnToConcept();
    } else {
      window.dispatchEvent(new CustomEvent('concept-navigate-tab', { detail: 'stages' }));
    }
  };

  return (
    <div
      className={`quick-practice w-full max-w-6xl mx-auto flex flex-col gap-5 p-6 rounded-3xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-xl text-slate-900 dark:text-slate-100 box-border ${className}`}
      data-testid="quick-practice"
      data-point-id={pointId}
    >
      {/* 头部标题与操作 */}
      <header className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3.5 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-sky-400 text-xs sm:text-sm font-bold border border-blue-500/20">
            {isEn ? 'Quick Practice' : '单点快练'}
          </span>
          <h3 className="m-0 text-base sm:text-lg font-bold">
            {isEn ? 'Targeted Practice (L1~L3)' : '3题即答即判·基础巩固'}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            {isEn ? 'L1~L3 Single Choice' : 'L1~L3 单选锁定'}
          </span>
        </div>

        {/* 换一批练习按钮 (台账 H2 验证触发点) */}
        <div className="flex items-center gap-3">
          {toastMessage && (
            <span
              data-testid="quick-practice-toast"
              className="text-xs text-blue-600 dark:text-sky-400 bg-blue-500/10 px-3 py-1 rounded-full animate-in fade-in"
            >
              {toastMessage}
            </span>
          )}
          <button
            type="button"
            data-testid="refresh-batch-btn"
            onClick={handleNextBatch}
            className="inline-flex items-center gap-1.5 border border-blue-500/40 bg-white/80 dark:bg-slate-800/80 text-blue-600 dark:text-sky-400 px-4 py-1.5 rounded-full cursor-pointer font-bold text-xs sm:text-sm shadow-sm hover:bg-blue-500/10 active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isEn ? 'Refresh Batch' : '换一批练习'}</span>
          </button>
        </div>
      </header>

      {/* 题目列表 (单屏 3 题自闭环) */}
      <div className="flex flex-col gap-5">
        {currentQuestions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {isEn ? 'No practice questions found.' : '暂无符合条件的快练题目'}
          </div>
        ) : (
          currentQuestions.map((q, idx) => {
            const userChoice = selectedAnswers[q.question_id];
            const isAnswered = !!userChoice;
            const isCorrect = normalizeOptionAnswer(userChoice) === normalizeOptionAnswer(q.answer_standard);
            const stem = getSafeStem(q, isEn);

            return (
              <div
                key={q.question_id}
                data-testid={`practice-item-${idx + 1}`}
                data-question-id={q.question_id}
                className="p-5 rounded-2xl bg-white/80 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col gap-3.5"
              >
                {/* 题号与难度标签 */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-sky-400 font-bold border border-blue-500/20">
                      {isEn ? `Level L${q.difficulty_level}` : `难度 L${q.difficulty_level}`}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {q.question_id}
                    </span>
                  </div>

                  {/* 答题状态徽章 */}
                  {isAnswered && (
                    <span
                      data-testid={`badge-status-${q.question_id}`}
                      className={`text-xs font-bold inline-flex items-center gap-1.5 flex-wrap ${
                        isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>{isEn ? '✓ Correct (+2)' : '✓ 回答正确 (+2分)'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>{isEn ? '✗ Incorrect (Ans: ' : '✗ 回答错误 (正确答案: '}</span>
                          <MathRenderer content={q.answer_standard || ''} />
                          <span>)</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* 铁律 3：题干通过 MathRenderer 渲染 */}
                <div className="question-stem db-content-body text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed overflow-hidden break-words max-w-full">
                  <QuestionContent
                    content={stem}
                    images={q.image_paths_json}
                    locale={isEn ? 'en' : 'zh'}
                  />
                </div>

                {/* 选项按钮列表 (A, B, C, D) - 严格 48px 热区与物理按压反馈 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt) => {
                    const isSelected = userChoice === opt.key;
                    const isStandard = normalizeOptionAnswer(q.answer_standard) === normalizeOptionAnswer(opt.key);
                    const optText = isEn ? opt.text_en || opt.text_zh : opt.text_zh;

                    let btnStyle = 'border-slate-200 dark:border-slate-750 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70';

                    if (isAnswered) {
                      if (isSelected) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500';
                        } else {
                          btnStyle = 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300 font-semibold ring-1 ring-red-500';
                        }
                      } else if (isStandard) {
                        btnStyle = 'border-dashed border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-medium';
                      } else {
                        btnStyle = 'border-slate-200/50 dark:border-slate-800/50 opacity-40 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        data-testid={`option-btn-${q.question_id}-${opt.key}`}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(q, opt.key)}
                        className={`min-h-[48px] px-4 py-3 rounded-xl border flex items-center gap-3 text-left transition-all active:scale-[0.98] ${btnStyle}`}
                      >
                        <span className="font-extrabold text-sm min-w-[1.2rem] text-blue-600 dark:text-sky-400">
                          {opt.key}.
                        </span>
                        <div className="db-content-sub flex-1 flex flex-col gap-1 overflow-hidden break-words text-xs sm:text-sm">
                          {opt.img ? (
                            <QuestionImage role="option" src={opt.img} alt={`选项 ${opt.key}`} />
                          ) : (
                            <MathRenderer content={optText} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 错误时展开名师错因辨析与常驻直达回看精讲按钮 */}
                {isAnswered && !isCorrect && (
                  <div
                    data-testid={`solution-${q.question_id}`}
                    className="p-4 rounded-xl bg-amber-500/10 border-l-4 border-l-amber-500 border border-amber-500/20 flex flex-col gap-2.5 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Icon name="bulb" size={14} />
                        <span>{isEn ? 'Teacher Pitfall Diagnosis' : '名师错因辨析与关键题眼'}</span>
                      </div>

                      {/* 常驻直达按钮：[ 回看概念精讲 ] */}
                      <button
                        type="button"
                        onClick={handleGoToConcept}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Review Concept Guide' : '回看概念精讲'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {q.solutions_json && (
                      <div className="db-content-sub text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed overflow-hidden break-words">
                        <SolutionList
                          solutions={q.solutions_json}
                          images={q.image_paths_json}
                          locale={isEn ? 'en' : 'zh'}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3 题作答完毕后：输出核心素养掌握度星级评定 (1~3 星结算) */}
      {isAllAnswered && (
        <div
          data-testid="quick-practice-settlement"
          className="p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-amber-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-7 h-7 ${
                    starIdx <= starRating
                      ? 'fill-amber-400 text-amber-400 drop-shadow'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {isEn ? 'Competency Mastery Assessment' : '考点核心素养掌握度评定'}
              </span>
              <h4 className="m-0 text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {starRating === 3
                  ? isEn
                    ? '3-Star Full Mastery (100% Score)'
                    : '★★★ 核心素养卓越！100% 满分达成'
                  : starRating === 2
                  ? isEn
                    ? '2-Star Solid Competency (Good Job)'
                    : '★★☆ 掌握良好！建议复习错题题眼'
                  : isEn
                  ? '1-Star Needs Reinforcement'
                  : '★☆☆ 基础待巩固，建议回看概念精讲'}
              </h4>
              <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
                {isEn
                  ? `Correct: ${correctCount} / 3 questions completed`
                  : `本次作答正答 ${correctCount} / 3 题`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleGoToConcept}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-blue-500/40 bg-white/80 dark:bg-slate-800 text-blue-600 dark:text-sky-400 font-bold text-xs shadow-sm hover:bg-blue-500/10 active:scale-[0.98] transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isEn ? 'Review Concept Guide' : '回看概念精讲'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextBatch}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Next Batch ➜' : '换一批练习 ➜'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickPractice;
