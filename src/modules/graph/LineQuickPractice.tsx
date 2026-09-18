import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  QuickPracticeQuestion,
  PracticeOption,
  drawFromPool,
  defaultPicker,
} from '../concept/quickPractice.machine';
import { MathRenderer } from '../../components/math/MathRenderer';
import { QuestionContent } from '../../components/common/QuestionContent';
import { QuestionImage } from '../../components/common/QuestionImage';
import { SolutionList } from '../exam/SolutionList';
import { Icon } from '../../components/common/Icon';
import { useSessionStore } from '../../store/sessionStore';
import { normalizeOptionAnswer } from '../../engine/judge/normalizeOptionAnswer';
import { mockLineQuickPracticeQuestions } from './mockGraphData';

export interface LineQuickPracticeProps {
  lineId: string;
  lineName?: string;
  initialQuestions?: QuickPracticeQuestion[];
  allQuestions?: QuickPracticeQuestion[];
  pointIds?: string[];
  cliqueIds?: string[];
  onComplete?: (score: number, total: number) => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 任务 10.4: 主线快练状态机组件 (L4~L6)
 *
 * 核心规范：
 * 1. [业务难度锁]：强制限定 difficulty_level BETWEEN 4 AND 6 且 question_type='single_choice' (与组合基数无关)。
 * 2. [铁律 3]: 所有题干、选项、解析必须经由 <MathRenderer> 渲染，严禁裸 innerHTML 或直接引入 katex。
 * 3. 抽样去重状态机：复用 drawFromPool 状态机逻辑，支持 session 去重与池耗尽重置 (保留 D2 排除刚呈现批次机制)。
 * 4. [铁律 10]: 采用 iOS 27 液态玻璃设计语言规范。
 */
export const LineQuickPractice: React.FC<LineQuickPracticeProps> = ({
  lineId,
  lineName,
  initialQuestions,
  allQuestions = mockLineQuickPracticeQuestions,
  pointIds,
  cliqueIds,
  onComplete,
  locale: propLocale,
  className,
  style,
}) => {
  const sessionLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || sessionLocale;

  const presentedIds = useSessionStore((state) => state.presentedIds);
  const addPresentedId = useSessionStore((state) => state.addPresentedId);
  const clearPresentedIds = useSessionStore((state) => state.clearPresentedIds);
  const recordPracticeScore = useSessionStore((state) => state.recordPracticeScore);

  // 1. 严格锁定 L4~L6 难度与 single_choice 题型
  const linePool = useMemo(() => {
    return allQuestions.filter((q) => {
      const isL4L6 = q.difficulty_level >= 4 && q.difficulty_level <= 6;
      const isSingleChoice = q.question_type === 'single_choice';
      if (!isL4L6 || !isSingleChoice) return false;

      if (pointIds && pointIds.length > 0) {
        return pointIds.includes(q.primary_point_id);
      }
      if (cliqueIds && cliqueIds.length > 0 && (q as any).combination_id) {
        return cliqueIds.includes((q as any).combination_id);
      }
      return true;
    });
  }, [allQuestions, pointIds, cliqueIds]);

  const [currentQuestions, setCurrentQuestions] = useState<QuickPracticeQuestion[]>(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      return initialQuestions.filter(
        (q) => q.difficulty_level >= 4 && q.difficulty_level <= 6 && q.question_type === 'single_choice'
      );
    }
    if (linePool.length < 3) {
      return linePool;
    }
    const { drawnQuestions } = drawFromPool(linePool, presentedIds, [], defaultPicker);
    return drawnQuestions;
  });

  const [currentBatchIds, setCurrentBatchIds] = useState<string[]>(() =>
    currentQuestions.map((q) => q.question_id)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<Record<string, boolean>>({});
  const [batchFinished, setBatchFinished] = useState<boolean>(false);

  // 抽取新一批 3 题
  const drawNewBatch = useCallback(
    (poolToUse: QuickPracticeQuestion[]) => {
      if (poolToUse.length < 3) {
        setCurrentQuestions(poolToUse);
        setCurrentBatchIds(poolToUse.map((q) => q.question_id));
        setCurrentIndex(0);
        setSelectedAnswers({});
        setIsSubmitted({});
        setBatchFinished(false);
        return;
      }

      const drawResult = drawFromPool(poolToUse, presentedIds, currentBatchIds, defaultPicker);

      if (drawResult.poolExhausted) {
        clearPresentedIds();
        currentBatchIds.forEach((id) => addPresentedId(id));
      }

      drawResult.drawnQuestions.forEach((q) => addPresentedId(q.question_id));

      setCurrentQuestions(drawResult.drawnQuestions);
      setCurrentBatchIds(drawResult.drawnQuestions.map((q) => q.question_id));
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted({});
      setBatchFinished(false);
    },
    [presentedIds, currentBatchIds, clearPresentedIds, addPresentedId]
  );

  // 监听 lineId 变化更新题目
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      const valid = initialQuestions.filter(
        (q) => q.difficulty_level >= 4 && q.difficulty_level <= 6 && q.question_type === 'single_choice'
      );
      setCurrentQuestions(valid);
      setCurrentBatchIds(valid.map((q) => q.question_id));
      valid.forEach((q) => addPresentedId(q.question_id));
    } else {
      drawNewBatch(linePool);
    }
  }, [lineId]);

  // 题库不足 3 题时的友好提示 (§5.1 门禁：严禁默默返回不足题量)
  if (linePool.length < 3) {
    return (
      <div
        className={`line-quick-practice-empty ${className || ''}`}
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-card, 16px)',
          background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.86))',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
          textAlign: 'center',
          color: 'var(--text-primary)',
          ...style,
        }}
      >
        <div style={{ marginBottom: '0.5rem' }}>
          <Icon name="book" size={32} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
          {locale === 'en' ? 'Line Practice Pool Updating' : '主线强化练习题库整备中'}
        </h4>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
          {locale === 'en'
            ? `Current line requires L4~L6 multi-clique questions (found ${linePool.length}/3). Please select another line.`
            : `当前主线要求 L4~L6 难度综合题（当前仅收录 ${linePool.length}/3 题），请稍后或切换其他主线练习。`}
        </p>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];

  const handleSelectOption = (optionKey: string) => {
    if (!currentQ || isSubmitted[currentQ.question_id]) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.question_id]: optionKey }));
  };

  const handleSubmitCurrent = () => {
    if (!currentQ || !selectedAnswers[currentQ.question_id]) return;
    const isCorrect = normalizeOptionAnswer(selectedAnswers[currentQ.question_id]) === normalizeOptionAnswer(currentQ.answer_standard);
    const earnedScore = isCorrect ? currentQ.score_default || 3 : 0;

    setIsSubmitted((prev) => ({ ...prev, [currentQ.question_id]: true }));
    recordPracticeScore(currentQ.question_id, earnedScore);

    // 检查本批次是否全部做完
    const submittedCount = Object.keys(isSubmitted).length + 1;
    if (submittedCount >= currentQuestions.length) {
      setBatchFinished(true);
      if (onComplete) {
        let total = 0;
        let earned = 0;
        currentQuestions.forEach((q) => {
          total += q.score_default || 3;
          if (
            normalizeOptionAnswer(selectedAnswers[q.question_id]) ===
            normalizeOptionAnswer(q.answer_standard)
          ) {
            earned += q.score_default || 3;
          }
        });
        onComplete(earned, total);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className={`line-quick-practice ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius-card, 16px)',
        background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.86))',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.1))',
        boxShadow: 'var(--glass-shadow, 0 8px 32px 0 rgba(31, 38, 135, 0.08))',
        ...style,
      }}
    >
      {/* 顶栏：主线快练标志 & 难度锁徽章 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="bolt" size={18} style={{ color: 'var(--ios-orange)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
            {locale === 'en' ? `${lineId} Line Practice` : `${lineName || lineId} 主线强化快练`}
          </span>
          <span
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'rgba(255, 149, 0, 0.12)',
              color: 'var(--ios-orange)',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            L4~L6 综合强化
          </span>
        </div>

        {/* 题目进度指示 */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {currentQuestions.map((q, idx) => {
            const answered = isSubmitted[q.question_id];
            const isCorrect = answered && normalizeOptionAnswer(selectedAnswers[q.question_id]) === normalizeOptionAnswer(q.answer_standard);
            const isCurrent = idx === currentIndex;

            let dotBg = 'rgba(0,0,0,0.12)';
            if (answered) {
              dotBg = isCorrect ? 'var(--ios-green)' : 'var(--ios-red)';
            } else if (isCurrent) {
              dotBg = 'var(--ios-blue)';
            }

            return (
              <div
                key={q.question_id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: isCurrent ? '20px' : '8px',
                  height: '8px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  background: dotBg,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 题干内容 (严格走 MathRenderer 铁律 3) */}
      {currentQ && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.96rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: '0.4rem', fontWeight: 600, color: 'var(--ios-blue)' }}>
              第 {currentIndex + 1} 题 (L{currentQ.difficulty_level} · {currentQ.score_default || 3}分)
            </div>
            <QuestionContent
              content={locale === 'en' ? currentQ.stem_en : currentQ.stem_zh}
              images={currentQ.image_paths_json}
              locale={locale.startsWith('en') ? 'en' : 'zh'}
            />
          </div>

          {/* 选项组 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentQ.options.map((opt: PracticeOption) => {
              const isSelected = selectedAnswers[currentQ.question_id] === opt.key;
              const submitted = isSubmitted[currentQ.question_id];
              const isRight = submitted && normalizeOptionAnswer(opt.key) === normalizeOptionAnswer(currentQ.answer_standard);
              const isWrong = submitted && isSelected && !isRight;

              let border = '1px solid rgba(0,0,0,0.1)';
              let bg = 'var(--glass-bg-elevated)';
              if (submitted) {
                if (isRight) {
                  border = '1.5px solid var(--ios-green)';
                  bg = 'rgba(52, 199, 89, 0.08)';
                } else if (isWrong) {
                  border = '1.5px solid var(--ios-red)';
                  bg = 'rgba(255, 59, 48, 0.08)';
                }
              } else if (isSelected) {
                border = '1.5px solid var(--ios-blue)';
                bg = 'rgba(0, 113, 227, 0.06)';
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={submitted}
                  onClick={() => handleSelectOption(opt.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '12px',
                    border,
                    background: bg,
                    cursor: submitted ? 'default' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--ios-blue)' : 'rgba(0,0,0,0.06)',
                      color: isSelected ? 'white' : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '0.75rem',
                      flexShrink: 0,
                    }}
                  >
                    {opt.key}
                  </span>
                  <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {opt.img ? (
                      <QuestionImage role="option" src={opt.img} alt={`Option ${opt.key}`} />
                    ) : (
                      <MathRenderer content={locale === 'en' ? opt.text_en : opt.text_zh} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 解析区域 (提交后展示，支持图锚点混合渲染) */}
          {isSubmitted[currentQ.question_id] && currentQ.solutions_json && (
            <div
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                background: 'rgba(0, 113, 227, 0.05)',
                borderLeft: '4px solid var(--ios-blue)',
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--ios-blue)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Icon name="book" size={15} />
                <span>{locale === 'en' ? 'Analysis & Solution:' : '主线核心思路解析：'}</span>
              </div>
              <SolutionList
                solutions={currentQ.solutions_json}
                images={currentQ.image_paths_json}
                locale={locale.startsWith('en') ? 'en' : 'zh'}
              />
            </div>
          )}

          {/* 交互操作栏 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrevQuestion}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: 'white',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === 0 ? 0.4 : 1,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                ← {locale === 'en' ? 'Previous' : '上一题'}
              </button>
              <button
                type="button"
                disabled={currentIndex >= currentQuestions.length - 1}
                onClick={handleNextQuestion}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: 'white',
                  cursor: currentIndex >= currentQuestions.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex >= currentQuestions.length - 1 ? 0.4 : 1,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {locale === 'en' ? 'Next' : '下一题'} →
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isSubmitted[currentQ.question_id] ? (
                <button
                  type="button"
                  disabled={!selectedAnswers[currentQ.question_id]}
                  onClick={handleSubmitCurrent}
                  style={{
                    padding: '0.45rem 1.2rem',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    border: 'none',
                    background: selectedAnswers[currentQ.question_id]
                      ? 'var(--ios-blue)'
                      : 'rgba(0,0,0,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: selectedAnswers[currentQ.question_id] ? 'pointer' : 'not-allowed',
                    boxShadow: selectedAnswers[currentQ.question_id]
                      ? '0 4px 12px rgba(0,113,227,0.3)'
                      : 'none',
                  }}
                >
                  {locale === 'en' ? 'Submit Answer' : '提交答案'}
                </button>
              ) : batchFinished ? (
                <button
                  type="button"
                  onClick={() => drawNewBatch(linePool)}
                  style={{
                    padding: '0.45rem 1.2rem',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    border: 'none',
                    background: 'var(--ios-green)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Icon name="refresh" size={15} />
                  <span>{locale === 'en' ? 'Practice Another Batch' : '换一批强化练习'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  style={{
                    padding: '0.45rem 1.2rem',
                    borderRadius: 'var(--radius-pill, 9999px)',
                    border: 'none',
                    background: 'var(--ios-blue)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  {locale === 'en' ? 'Next Question' : '做下一题'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
