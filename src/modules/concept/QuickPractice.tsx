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

export interface QuickPracticeProps {
  pointId: string;
  allQuestions?: QuickPracticeQuestion[];
  initialQuestions?: QuickPracticeQuestion[];
  className?: string;
  style?: React.CSSProperties;
  locale?: string;
  onAnswer?: (questionId: string, isCorrect: boolean, score: number) => void;
  onRefreshBatch?: () => void;
}

/**
 * 探本溯源·概念精讲 - 单点快练组件 (任务 9.4, 设计文档 §7.1.1)
 *
 * 铁律规范：
 * 1. 铁律 3：题干、选项文本、解析全部经由 <MathRenderer> 出口渲染，严禁 import katex 或裸 innerHTML
 * 2. 业务锁：严格锁 L1~L3 难度、question_type='single_choice'
 * 3. 即答即判：点击选项立即计算正误并录入 sessionStore.practiceScores
 * 4. 闭环台账 H2：换一批练习在未做题 < 3 时调用 clearPresentedIds() 重置去重池，严禁错调 resetScores()！
 * 5. UI 严格采用 iOS 27 液态玻璃设计 Token
 */
export const QuickPractice: React.FC<QuickPracticeProps> = ({
  pointId,
  allQuestions = [],
  initialQuestions,
  className = '',
  style = {},
  locale: propLocale,
  onAnswer,
  onRefreshBatch,
}) => {
  const storeLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || storeLocale || 'zh-CN';
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
      return []; // 不足 3 题直接返回空，由 UI 渲染缺省提示 (D2 缺陷)
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
      setToastMessage(locale === 'en' ? 'Not enough practice questions (min 3)' : '该考点题库不足3题，无法组卷');
      return;
    }

    // 抽样去重逻辑 (Property 13), 传入当前批次 ID 以排除紧邻重复 (D2 缺陷)
    const currentBatchIds = currentQuestions.map(q => q.question_id);
    const result = drawFromPool(eligible, presentedIds, currentBatchIds);

    if (result.poolExhausted) {
      // 台账 H2：池耗尽时明确调用 clearPresentedIds()，严禁调用 resetScores()！
      // 这里的清空是为了清空 sessionStore 的旧状态，随后用新的 nextPresentedIds 重新填充
      clearPresentedIds();
      addPresentedIds(Array.from(result.nextPresentedIds));
      setToastMessage(
        locale === 'en'
          ? 'Question pool exhausted. Reset and loaded new batch!'
          : '考点题池已轮空，已重置去重池并换入新一组题目！'
      );
    } else {
      addPresentedIds(result.drawnQuestions.map((q) => q.question_id));
      setToastMessage(locale === 'en' ? 'New batch loaded' : '已换一批练习');
    }

    setCurrentQuestions(result.drawnQuestions);
    setSelectedAnswers({}); // 清空本轮作答选择
    onRefreshBatch?.();

    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div
      className={`quick-practice ${className}`.trim()}
      data-testid="quick-practice"
      data-point-id={pointId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.5rem',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.72))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-lg, 24px)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow-deep, 0 20px 50px rgba(0, 0, 0, 0.08))',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        ...style,
      }}
    >
      {/* 头部标题与操作 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--glass-border, rgba(0,0,0,0.06))',
          paddingBottom: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'var(--ios-blue-glow, rgba(0, 113, 227, 0.15))',
              color: 'var(--ios-blue)',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {locale === 'en' ? 'Quick Practice' : '单点快练'}
          </span>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
            {locale === 'en' ? 'Targeted Practice (L1~L3)' : '3题即答即判·基础巩固'}
          </h3>
          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.04)',
            }}
          >
            {locale === 'en' ? 'L1~L3 Single Choice' : 'L1~L3 单选锁定'}
          </span>
        </div>

        {/* 换一批练习按钮 (台账 H2 验证触发点) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {toastMessage && (
            <span
              data-testid="quick-practice-toast"
              style={{
                fontSize: '0.82rem',
                color: 'var(--ios-blue)',
                background: 'rgba(0, 113, 227, 0.1)',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {toastMessage}
            </span>
          )}
          <button
            type="button"
            data-testid="refresh-batch-btn"
            onClick={handleNextBatch}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: '1px solid var(--ios-blue)',
              background: 'var(--glass-bg-elevated)',
              color: 'var(--ios-blue)',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: 'var(--glass-shadow, 0 4px 12px rgba(0,0,0,0.05))',
              transition: 'all 0.2s var(--spring-smooth, ease)',
            }}
          >
            <Icon name="refresh" size={14} />
            <span>{locale === 'en' ? 'Refresh Batch' : '换一批练习'}</span>
          </button>
        </div>
      </header>

      {/* 题目列表 (单屏 3 题自闭环) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {currentQuestions.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: 'var(--radius-md, 18px)',
            }}
          >
            {locale === 'en' ? 'No practice questions found.' : '暂无符合条件的快练题目'}
          </div>
        ) : (
          currentQuestions.map((q, idx) => {
            const userChoice = selectedAnswers[q.question_id];
            const isAnswered = !!userChoice;
            const isCorrect = normalizeOptionAnswer(userChoice) === normalizeOptionAnswer(q.answer_standard);
            const stem = locale === 'en' ? q.stem_en || q.stem_zh : q.stem_zh;

            return (
              <div
                key={q.question_id}
                data-testid={`practice-item-${idx + 1}`}
                data-question-id={q.question_id}
                style={{
                  padding: '1.2rem',
                  borderRadius: 'var(--radius-md, 18px)',
                  background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.85))',
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.9))',
                  boxShadow: 'var(--glass-shadow, 0 6px 20px rgba(0,0,0,0.03))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {/* 题号与难度标签 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--ios-blue)',
                        color: "var(--glass-bg-elevated)",
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 113, 227, 0.1)',
                        color: 'var(--ios-blue)',
                        fontWeight: 600,
                      }}
                    >
                      {locale === 'en' ? `Level L${q.difficulty_level}` : `难度 L${q.difficulty_level}`}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                      {q.question_id}
                    </span>
                  </div>

                  {/* 答题状态徽章 */}
                  {isAnswered && (
                    <span
                      data-testid={`badge-status-${q.question_id}`}
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: isCorrect ? 'var(--ios-green)' : 'var(--ios-red)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.25rem',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        maxWidth: '100%',
                      }}
                    >
                      {isCorrect ? (
                        locale === 'en' ? '✓ Correct (+2)' : '✓ 回答正确 (+2分)'
                      ) : (
                        <>
                          <span>{locale === 'en' ? '✗ Incorrect (Ans: ' : '✗ 回答错误 (正确答案: '}</span>
                          <MathRenderer content={q.answer_standard || ''} />
                          <span>)</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* 铁律 3：题干通过 MathRenderer 渲染，统一内容字号与行高 */}
                <div
                  className="question-stem db-content-body"
                  style={{
                    fontSize: 'var(--content-font-size-body)',
                    lineHeight: 'var(--content-line-height-body)',
                    color: 'var(--text-primary)',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  <QuestionContent content={stem} images={q.image_paths_json} locale={locale.startsWith('en') ? 'en' : 'zh'} />
                </div>

                {/* 选项按钮列表 (A, B, C, D) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.65rem',
                  }}
                >
                  {q.options.map((opt) => {
                    const isSelected = userChoice === opt.key;
                    const isStandard = normalizeOptionAnswer(q.answer_standard) === normalizeOptionAnswer(opt.key);
                    const optText = locale === 'en' ? opt.text_en || opt.text_zh : opt.text_zh;

                    // 颜色状态判定
                    let bg = 'rgba(0,0,0,0.03)';
                    let border = '1px solid rgba(0,0,0,0.08)';
                    let textColor = 'var(--text-primary)';

                    if (isAnswered) {
                      if (isSelected) {
                        if (isCorrect) {
                          bg = 'rgba(52, 199, 89, 0.15)';
                          border = '1.5px solid var(--ios-green)';
                          textColor = 'var(--ios-green)';
                        } else {
                          bg = 'rgba(255, 59, 48, 0.15)';
                          border = '1.5px solid var(--ios-red)';
                          textColor = 'var(--ios-red)';
                        }
                      } else if (isStandard) {
                        // 标出正确答案
                        border = '1.5px dashed var(--ios-green)';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        data-testid={`option-btn-${q.question_id}-${opt.key}`}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(q, opt.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 0.85rem',
                          borderRadius: 'var(--radius-sm, 12px)',
                          background: bg,
                          border,
                          color: textColor,
                          cursor: isAnswered ? 'default' : 'pointer',
                          textAlign: 'left',
                          fontSize: 'var(--content-font-size-sub)',
                          lineHeight: 'var(--content-line-height-body)',
                          transition: 'all 0.2s ease',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            minWidth: '1.2rem',
                          }}
                        >
                          {opt.key}.
                        </span>
                        {/* 选项内容 (有图走 QuestionImage，无图走 MathRenderer) */}
                        <div className="db-content-sub" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
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

                {/* 错误时展开解答思路 (支持图锚点混合渲染) */}
                {isAnswered && !isCorrect && q.solutions_json && (
                  <div
                    data-testid={`solution-${q.question_id}`}
                    className="db-content-sub"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm, 12px)',
                      background: 'rgba(255, 149, 0, 0.08)',
                      borderLeft: '3px solid var(--ios-orange)',
                      fontSize: 'var(--content-font-size-sub)',
                      lineHeight: 'var(--content-line-height-body)',
                      color: 'var(--text-primary)',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--ios-orange)',
                        marginBottom: '0.25rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Icon name="bulb" size={14} />
                      <span>{locale === 'en' ? 'Solution Explanation' : '解析指引'}</span>
                    </div>
                    <SolutionList
                      solutions={q.solutions_json}
                      images={q.image_paths_json}
                      locale={locale.startsWith('en') ? 'en' : 'zh'}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuickPractice;
