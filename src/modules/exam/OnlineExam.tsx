/**
 * 模块四·在线实战测评中心 (任务 17.5 + 17.6, PRD §5.4, 铁律 2 零持久化, 铁律 3)
 *
 * 核心特性：
 * 1. 左右视窗解耦交互范式 (Fixed Split-View)：
 *    - 左侧：试卷作答主舞台 (独立垂直滚动)
 *    - 右侧：控制指挥舱 (绝对固定常驻，绝不随试卷滚动)
 * 2. 右侧动态答题卡：实时显示已答/未答/待复查计数，题号网格点击平滑跳转锚点
 * 3. 全局唯一智能伴随数学符号键盘 (MathKeyboard)：focus 自动呼出，支持常用初中符号与实时 KaTeX 预览
 * 4. 判分引擎接入 (填空 isMathAnswerEquivalent + 解答 calculateSolutionScore 自核)
 * 5. 四维认知素养雷达图与考完即焚 (ScorePanel)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GeneratedPaper, QuestionItem } from './drawQuestions';
import { MathRenderer } from '../../components/math/MathRenderer';
import { AnswerFormulaRenderer } from '../../components/math/AnswerFormulaRenderer';
import { QuestionContent } from '../../components/common/QuestionContent';
import { QuestionImage } from '../../components/common/QuestionImage';
import { SourceTag } from '../../components/common/SourceTag';
import { MathKeyboard } from './MathKeyboard';
import { ScorePanel } from './ScorePanel';
import { ScorePanelErrorBoundary } from './ScorePanelErrorBoundary';
import { Icon } from '../../components/common/Icon';
import {
  detectBlankCount,
  getBlankSlotsMeta,
  serializeStudentSlots,
  deserializeStudentSlots,
} from './blankParser';
import { useSessionStore } from '../../store/sessionStore';
import { getSafeStem } from '../../engine/i18n/stemGuard';
import { useDeviceResponsive } from '../../hooks/useDeviceResponsive';

export interface OnlineExamProps {
  paper: GeneratedPaper;
  onBackToWorkbench: () => void;
}

export const OnlineExam: React.FC<OnlineExamProps> = ({
  paper,
  onBackToWorkbench,
}) => {
  const { isMobile } = useDeviceResponsive();
  const [mobileSheetOpen, setMobileSheetOpen] = useState<boolean>(false);
  const locale = useSessionStore((state) => state.locale);
  const isEn = String(locale).toLowerCase().startsWith('en');

  // 考试状态机：作答中 ('answering') | 已交卷复盘中 ('submitted')
  const [examState, setExamState] = useState<'answering' | 'submitted'>('answering');

  // 作答数据 (纯内存状态，零持久化)
  const [choiceAnswers, setChoiceAnswers] = useState<Record<string, string>>({});
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>({});
  const [solutionAnswers, setSolutionAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // 解答题踩分点打钩状态 (questionId -> Set<stepIndex>)
  const [solutionCheckedSteps, setSolutionCheckedSteps] = useState<Record<string, Set<number>>>({});

  // 考试倒计时与用时统计 (秒)
  const [timeRemaining, setTimeRemaining] = useState<number>(paper.timeLimitMinutes * 60);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // 全局唯一数学键盘控制状态
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [focusedQuestionId, setFocusedQuestionId] = useState<string | null>(null);
  const [focusedSlotIndex, setFocusedSlotIndex] = useState<number>(0);
  const [focusedQuestionType, setFocusedQuestionType] = useState<'fill' | 'solution' | null>(null);
  const [focusedTitle, setFocusedTitle] = useState<string>('');

  // 右侧辅助说明卡折叠状态
  const [isTipsExpanded, setIsTipsExpanded] = useState<boolean>(true);

  // 退出考试二次确认提示框状态
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // 扁平化全部题目列表 (用于题号索引与定位)
  const allQuestions = useMemo(() => {
    return [
      ...paper.choiceQuestions,
      ...paper.fillQuestions,
      ...paper.solutionQuestions,
    ];
  }, [paper]);

  // 计时器
  useEffect(() => {
    if (examState !== 'answering') return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [examState]);

  // 标记/取消标记复查
  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // 选择题作答
  const handleSelectChoice = (qId: string, optKey: string) => {
    setChoiceAnswers((prev) => ({ ...prev, [qId]: optKey }));
  };

  // 填空题输入聚焦，唤起全局伴随键盘
  const handleFocusFill = (q: QuestionItem, idx: number, slotIdx: number = 0, blankCount: number = 1) => {
    setFocusedQuestionId(q.question_id);
    setFocusedQuestionType('fill');
    setFocusedSlotIndex(slotIdx);
    const qNum = paper.choiceQuestions.length + idx + 1;
    const slotSuffix = blankCount > 1 ? (isEn ? ` Slot (${slotIdx + 1})` : ` 第 (${slotIdx + 1}) 空`) : '';
    setFocusedTitle(
      isEn
        ? `Q${qNum} Fill-in${slotSuffix}`
        : `第 ${qNum} 题 填空${slotSuffix}`
    );
    setKeyboardVisible(true);
  };

  // 解答题输入聚焦，唤起全局伴随键盘
  const handleFocusSolution = (q: QuestionItem, idx: number) => {
    setFocusedQuestionId(q.question_id);
    setFocusedQuestionType('solution');
    setFocusedSlotIndex(0);
    setFocusedTitle(
      isEn
        ? `Q${paper.choiceQuestions.length + paper.fillQuestions.length + idx + 1} Derivation Scratchpad`
        : `第 ${paper.choiceQuestions.length + paper.fillQuestions.length + idx + 1} 题 解答推导草稿`
    );
    setKeyboardVisible(true);
  };

  // 当前激活输入框的内容
  const currentInputValue = useMemo(() => {
    if (!focusedQuestionId || !focusedQuestionType) return '';
    if (focusedQuestionType === 'fill') {
      const q = paper.fillQuestions.find((item) => item.question_id === focusedQuestionId);
      const bCount = q ? detectBlankCount({ ...q, locale }) : 1;
      const raw = fillAnswers[focusedQuestionId] || '';
      if (bCount > 1) {
        const slots = deserializeStudentSlots(raw, bCount);
        return slots[focusedSlotIndex] || '';
      }
      return raw;
    }
    return solutionAnswers[focusedQuestionId] || '';
  }, [focusedQuestionId, focusedQuestionType, focusedSlotIndex, fillAnswers, solutionAnswers, paper.fillQuestions, locale]);

  // 键盘字符插入
  const handleKeyboardInsert = (token: string) => {
    if (!focusedQuestionId || !focusedQuestionType) return;
    if (focusedQuestionType === 'fill') {
      const q = paper.fillQuestions.find((item) => item.question_id === focusedQuestionId);
      const bCount = q ? detectBlankCount({ ...q, locale }) : 1;
      if (bCount > 1) {
        setFillAnswers((prev) => {
          const raw = prev[focusedQuestionId] || '';
          const slots = deserializeStudentSlots(raw, bCount);
          slots[focusedSlotIndex] = (slots[focusedSlotIndex] || '') + token;
          return {
            ...prev,
            [focusedQuestionId]: serializeStudentSlots(slots),
          };
        });
      } else {
        setFillAnswers((prev) => ({
          ...prev,
          [focusedQuestionId]: (prev[focusedQuestionId] || '') + token,
        }));
      }
    } else {
      setSolutionAnswers((prev) => ({
        ...prev,
        [focusedQuestionId]: (prev[focusedQuestionId] || '') + token,
      }));
    }
  };

  // 键盘退格
  const handleKeyboardBackspace = () => {
    if (!focusedQuestionId || !focusedQuestionType) return;
    if (focusedQuestionType === 'fill') {
      const q = paper.fillQuestions.find((item) => item.question_id === focusedQuestionId);
      const bCount = q ? detectBlankCount({ ...q, locale }) : 1;
      if (bCount > 1) {
        setFillAnswers((prev) => {
          const raw = prev[focusedQuestionId] || '';
          const slots = deserializeStudentSlots(raw, bCount);
          slots[focusedSlotIndex] = (slots[focusedSlotIndex] || '').slice(0, -1);
          return {
            ...prev,
            [focusedQuestionId]: serializeStudentSlots(slots),
          };
        });
      } else {
        setFillAnswers((prev) => ({
          ...prev,
          [focusedQuestionId]: (prev[focusedQuestionId] || '').slice(0, -1),
        }));
      }
    } else {
      setSolutionAnswers((prev) => ({
        ...prev,
        [focusedQuestionId]: (prev[focusedQuestionId] || '').slice(0, -1),
      }));
    }
  };

  // 键盘清空
  const handleKeyboardClear = () => {
    if (!focusedQuestionId || !focusedQuestionType) return;
    if (focusedQuestionType === 'fill') {
      const q = paper.fillQuestions.find((item) => item.question_id === focusedQuestionId);
      const bCount = q ? detectBlankCount({ ...q, locale }) : 1;
      if (bCount > 1) {
        setFillAnswers((prev) => {
          const raw = prev[focusedQuestionId] || '';
          const slots = deserializeStudentSlots(raw, bCount);
          slots[focusedSlotIndex] = '';
          return {
            ...prev,
            [focusedQuestionId]: serializeStudentSlots(slots),
          };
        });
      } else {
        setFillAnswers((prev) => ({ ...prev, [focusedQuestionId]: '' }));
      }
    } else {
      setSolutionAnswers((prev) => ({ ...prev, [focusedQuestionId]: '' }));
    }
  };

  // 点击答题卡题号平滑滚动至左侧试卷对应锚点
  const scrollToQuestion = (qId: string) => {
    const el = document.getElementById(`question-anchor-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 解答题踩分点打钩联动
  const handleStepCheckChange = (questionId: string, stepIndex: number, checked: boolean) => {
    setSolutionCheckedSteps((prev) => {
      const curSet = new Set(prev[questionId] || []);
      if (checked) {
        curSet.add(stepIndex);
      } else {
        curSet.delete(stepIndex);
      }
      return { ...prev, [questionId]: curSet };
    });
  };

  // 提交试卷
  const handleSubmitExam = () => {
    setKeyboardVisible(false);
    setExamState('submitted');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollParent = document.querySelector('main.overflow-y-auto') || document.querySelector('main');
    if (scrollParent) {
      scrollParent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 重新作答此卷 (重置作答状态)
  const handleResetExam = () => {
    setChoiceAnswers({});
    setFillAnswers({});
    setSolutionAnswers({});
    setFlaggedIds(new Set());
    setSolutionCheckedSteps({});
    setTimeRemaining(paper.timeLimitMinutes * 60);
    setTimeSpent(0);
    setExamState('answering');
  };

  // 答题统计计算
  const { answeredCount, unansweredCount, flaggedCount } = useMemo(() => {
    let answered = 0;
    allQuestions.forEach((q) => {
      if (q.question_type === 'single_choice' && choiceAnswers[q.question_id]) {
        answered++;
      } else if (q.question_type === 'fill_blank') {
        const raw = fillAnswers[q.question_id] || '';
        const bCount = detectBlankCount({ ...q, locale });
        if (bCount > 1) {
          const slots = deserializeStudentSlots(raw, bCount);
          if (slots.some((s) => s.trim().length > 0)) answered++;
        } else if (raw.trim()) {
          answered++;
        }
      } else if (q.question_type === 'solution' && (solutionAnswers[q.question_id] || '').trim()) {
        answered++;
      }
    });
    return {
      answeredCount: answered,
      unansweredCount: allQuestions.length - answered,
      flaggedCount: flaggedIds.size,
    };
  }, [allQuestions, choiceAnswers, fillAnswers, solutionAnswers, flaggedIds]);

  // 时间格式化
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 若已提交，渲染复盘与踩分大屏
  if (examState === 'submitted') {
    return (
      <ScorePanelErrorBoundary onBackToWorkbench={onBackToWorkbench} locale={locale}>
        <ScorePanel
          paper={paper}
          choiceAnswers={choiceAnswers}
          fillAnswers={fillAnswers}
          solutionAnswers={solutionAnswers}
          solutionCheckedSteps={solutionCheckedSteps}
          onStepCheckChange={handleStepCheckChange}
          onResetExam={handleResetExam}
          onBackToWorkbench={onBackToWorkbench}
          timeSpentSeconds={timeSpent}
        />
      </ScorePanelErrorBoundary>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1.5rem 1rem',
        fontFamily: 'var(--font-family-system)',
      }}
    >
      {/* 模块四在线考试吸顶常驻二级菜单 (Apple HIG standard) */}
      <div
        className="exam-subnav-sticky-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '12px 24px',
          borderRadius: 'var(--radius-lg, 22px)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            data-testid="exam-back-to-workbench-btn"
            onClick={() => setShowExitConfirm(true)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Icon name="chevron-left" size={13} />
            <span>{isEn ? 'Back to Workbench' : '返回出题中心'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--ios-blue)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(0, 113, 227, 0.08)',
                border: '1px solid rgba(0, 113, 227, 0.15)',
              }}
            >
              {isEn ? 'Precision Exam Center' : '精准出题中心'}
            </span>
            <h1
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '360px',
              }}
              title={(isEn ? paper.titleEn : paper.titleZh) || paper.titleZh}
            >
              {(isEn ? paper.titleEn : paper.titleZh) || paper.titleZh}
            </h1>
          </div>
        </div>

        {/* 倒计时与交卷操作 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
              border: '1px solid rgba(0, 122, 255, 0.25)',
              color: 'var(--ios-blue)',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            <Icon name="timer" size={14} />
            <span>{isEn ? 'Time Remaining' : '剩余时间'}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 900 }}>{formatTime(timeRemaining)}</span>
          </div>
          <button
            type="button"
            onClick={handleSubmitExam}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: 'var(--ios-blue)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
              transition: 'background-color 0.2s',
            }}
          >
            <Icon name="download" size={14} />
            <span>{isEn ? 'Submit Exam' : '立即交卷'}</span>
          </button>
        </div>
      </div>

      {/* 左右解耦视窗主结构 (Fixed Split-View) */}
      <div
        className="exam-split-container"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          alignItems: 'flex-start',
        }}
      >
        {/* ===================== 左侧：试卷作答主舞台 (独立垂直滚动) ===================== */}
        <div
          data-testid="left-paper-scroll"
          style={{
            flex: isMobile ? '1 1 100%' : '1 1 68%',
            width: isMobile ? '100%' : undefined,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          {/* 一、选择题区 */}
          {paper.choiceQuestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  {isEn
                    ? `I. Multiple Choice (${paper.choiceQuestions.length} Questions)`
                    : `一、选择题 (共 ${paper.choiceQuestions.length} 小题)`}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {isEn
                    ? 'Single choice, select the only correct answer among four options'
                    : '每题单选，在四个备选项中选出唯一正确答案'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {paper.choiceQuestions.map((q, idx) => {
                  const qNum = idx + 1;
                  const isFlagged = flaggedIds.has(q.question_id);
                  const selectedOpt = choiceAnswers[q.question_id];

                  let optionsMap: Record<string, { zh: string; en?: string; img?: string }> = {};
                  try {
                    if (q.options_json) {
                      optionsMap = JSON.parse(q.options_json);
                    }
                  } catch {
                    optionsMap = {};
                  }

                  return (
                    <div
                      key={q.question_id}
                      id={`question-anchor-${q.question_id}`}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-xl)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        backgroundColor: 'var(--glass-bg)',
                        border: isFlagged
                          ? '1px solid rgba(255, 59, 48, 0.35)'
                          : selectedOpt
                          ? '1px solid rgba(0, 122, 255, 0.35)'
                          : '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)',
                        scrollMarginTop: '6rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.875rem',
                      }}
                    >
                      {/* 题目题头 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '0.125rem 0.625rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              backgroundColor: 'var(--ios-blue)',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}
                          >
                            {isEn ? `Question ${qNum}` : `第 ${qNum} 题`}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                            {isEn
                              ? `(${q.score_default} pts) · Level L${q.difficulty_level}`
                              : `(${q.score_default}分) · 难度 L${q.difficulty_level}`}
                          </span>
                          <SourceTag source={q.source} exam_year={q.exam_year} region={q.region} />
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFlag(q.question_id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: isFlagged ? 'rgba(255, 59, 48, 0.1)' : 'transparent',
                            color: isFlagged ? 'var(--ios-red)' : 'var(--text-tertiary)',
                            border: isFlagged ? '1px solid rgba(255, 59, 48, 0.25)' : 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="flag" size={12} style={{ color: isFlagged ? 'var(--ios-red)' : 'currentColor' }} />
                          <span>{isEn ? (isFlagged ? 'Flagged' : 'Flag for Review') : (isFlagged ? '已标记复查' : '标记复查')}</span>
                        </button>
                      </div>

                      {/* 题干 (支持图锚点混合渲染) */}
                      <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <QuestionContent content={getSafeStem(q, isEn)} images={q.image_paths_json} />
                      </div>

                      {/* 选项网格 */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: '0.625rem',
                        }}
                      >
                        {['A', 'B', 'C', 'D'].map((optKey) => {
                          const optObj = optionsMap[optKey];
                          const optText = optObj ? ((isEn ? optObj.en : optObj.zh) || optObj.zh) : '';
                          const isCur = selectedOpt === optKey;

                          return (
                            <button
                              key={optKey}
                              type="button"
                              onClick={() => handleSelectChoice(q.question_id, optKey)}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                minHeight: '48px',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'left',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: isCur ? '1px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                                backgroundColor: isCur ? 'rgba(0, 122, 255, 0.1)' : 'var(--glass-bg-card)',
                                color: isCur ? 'var(--ios-blue)' : 'var(--text-primary)',
                              }}
                            >
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '1.25rem',
                                  height: '1.25rem',
                                  borderRadius: '50%',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  backgroundColor: isCur ? 'var(--ios-blue)' : 'var(--border-subtle)',
                                  color: isCur ? '#ffffff' : 'var(--text-secondary)',
                                }}
                              >
                                {optKey}
                              </span>
                              <div style={{ flex: 1, overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {optObj?.img ? (
                                  <QuestionImage role="option" src={optObj.img} alt={isEn ? `Option ${optKey}` : `选项 ${optKey}`} />
                                ) : (
                                  <MathRenderer content={optText || '—'} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 二、填空题区 */}
          {paper.fillQuestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  {isEn
                    ? `II. Fill-in-the-Blank (${paper.fillQuestions.length} Questions)`
                    : `二、填空题 (共 ${paper.fillQuestions.length} 小题)`}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {isEn
                    ? 'Type answers directly into input box or click to invoke smart math keyboard'
                    : '请直接在输入框作答，点击输入框呼出智能数学键盘'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {paper.fillQuestions.map((q, idx) => {
                  const qNum = paper.choiceQuestions.length + idx + 1;
                  const isFlagged = flaggedIds.has(q.question_id);
                  const rawAns = fillAnswers[q.question_id] || '';
                  const blankCount = detectBlankCount({ ...q, locale });
                  const slotsMeta = getBlankSlotsMeta(blankCount, isEn);
                  const currentSlots = deserializeStudentSlots(rawAns, blankCount);
                  const hasAnyAns = currentSlots.some((s) => s.trim().length > 0);

                  return (
                    <div
                      key={q.question_id}
                      id={`question-anchor-${q.question_id}`}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-xl)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        backgroundColor: 'var(--glass-bg)',
                        border: isFlagged
                          ? '1px solid rgba(255, 59, 48, 0.35)'
                          : hasAnyAns
                          ? '1px solid rgba(0, 122, 255, 0.35)'
                          : '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)',
                        scrollMarginTop: '6rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.875rem',
                      }}
                    >
                      {/* 题目题头 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '0.125rem 0.625rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              backgroundColor: 'var(--ios-blue)',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}
                          >
                            {isEn ? `Question ${qNum}` : `第 ${qNum} 题`}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                            {isEn
                              ? `(${q.score_default} pts) · Level L${q.difficulty_level}`
                              : `(${q.score_default}分) · 难度 L${q.difficulty_level}`}
                          </span>
                          <SourceTag source={q.source} exam_year={q.exam_year} region={q.region} />
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFlag(q.question_id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: isFlagged ? 'rgba(255, 59, 48, 0.1)' : 'transparent',
                            color: isFlagged ? 'var(--ios-red)' : 'var(--text-tertiary)',
                            border: isFlagged ? '1px solid rgba(255, 59, 48, 0.25)' : 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="flag" size={12} style={{ color: isFlagged ? 'var(--ios-red)' : 'currentColor' }} />
                          <span>{isEn ? (isFlagged ? 'Flagged' : 'Flag for Review') : (isFlagged ? '已标记复查' : '标记复查')}</span>
                        </button>
                      </div>

                      {/* 题干 (支持图锚点混合渲染) */}
                      <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <QuestionContent content={getSafeStem(q, isEn)} images={q.image_paths_json} />
                      </div>

                      {/* 填空作答槽位组 (单空/多空自适应，且实时渲染预览卡片严格置于输入框上方) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {slotsMeta.map((slot) => {
                          const currentSlotVal = currentSlots[slot.index] || '';

                          return (
                            <div key={`slot-${slot.index}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {/* 实时公式预览卡片 (严格位于输入框上方) */}
                              {currentSlotVal.trim() && (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--glass-bg-card)',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                  }}
                                >
                                  <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, fontWeight: 600 }}>
                                    {blankCount > 1
                                      ? `${isEn ? slot.labelEn : slot.labelZh} ${isEn ? 'Preview:' : '实时渲染:'}`
                                      : (isEn ? 'Real-time Preview:' : '实时渲染:')}
                                  </span>
                                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <AnswerFormulaRenderer content={currentSlotVal} />
                                  </div>
                                </div>
                              )}

                              {/* 填空输入框与键盘快捷唤起 */}
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  placeholder={isEn ? slot.placeholderEn : slot.placeholderZh}
                                  value={currentSlotVal}
                                  onChange={(e) => {
                                    const nextVal = e.target.value;
                                    if (blankCount > 1) {
                                      const nextSlots = [...currentSlots];
                                      nextSlots[slot.index] = nextVal;
                                      setFillAnswers((prev) => ({
                                        ...prev,
                                        [q.question_id]: serializeStudentSlots(nextSlots),
                                      }));
                                    } else {
                                      setFillAnswers((prev) => ({
                                        ...prev,
                                        [q.question_id]: nextVal,
                                      }));
                                    }
                                  }}
                                  onFocus={() => handleFocusFill(q, idx, slot.index, blankCount)}
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '0.75rem 6.5rem 0.75rem 1rem',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--glass-bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleFocusFill(q, idx, slot.index, blankCount)}
                                  style={{
                                    position: 'absolute',
                                    right: '0.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    padding: '0.25rem 0.625rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                                    border: '1px solid rgba(0, 122, 255, 0.2)',
                                    color: 'var(--ios-blue)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <Icon name="keyboard" size={12} />
                                  <span>{isEn ? 'Math Keyboard' : '符号键盘'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 三、解答题区 */}
          {paper.solutionQuestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  {isEn
                    ? `III. Extended Solution (${paper.solutionQuestions.length} Questions)`
                    : `三、解答题 (共 ${paper.solutionQuestions.length} 小题)`}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {isEn
                    ? 'Write down derivation steps in the exam; rubric self-assessment available after submission'
                    : '在中考考场中写清推理演算步骤，交卷后支持踩分点自核打钩'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {paper.solutionQuestions.map((q, idx) => {
                  const qNum =
                    paper.choiceQuestions.length + paper.fillQuestions.length + idx + 1;
                  const isFlagged = flaggedIds.has(q.question_id);
                  const currentDraft = solutionAnswers[q.question_id] || '';

                  return (
                    <div
                      key={q.question_id}
                      id={`question-anchor-${q.question_id}`}
                      style={{
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-xl)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        backgroundColor: 'var(--glass-bg)',
                        border: isFlagged
                          ? '1px solid rgba(255, 59, 48, 0.35)'
                          : currentDraft.trim()
                          ? '1px solid rgba(0, 122, 255, 0.35)'
                          : '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)',
                        scrollMarginTop: '6rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}
                    >
                      {/* 题目题头 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '0.125rem 0.625rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              backgroundColor: 'var(--ios-blue)',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}
                          >
                            {isEn ? `Question ${qNum}` : `第 ${qNum} 题`}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                            {isEn
                              ? `(Full ${q.score_default} pts) · Level L${q.difficulty_level}`
                              : `(满分 ${q.score_default}分) · 难度 L${q.difficulty_level}`}
                          </span>
                          <SourceTag source={q.source} exam_year={q.exam_year} region={q.region} />
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFlag(q.question_id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: isFlagged ? 'rgba(255, 59, 48, 0.1)' : 'transparent',
                            color: isFlagged ? 'var(--ios-red)' : 'var(--text-tertiary)',
                            border: isFlagged ? '1px solid rgba(255, 59, 48, 0.25)' : 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="flag" size={12} style={{ color: isFlagged ? 'var(--ios-red)' : 'currentColor' }} />
                          <span>{isEn ? (isFlagged ? 'Flagged' : 'Flag for Review') : (isFlagged ? '已标记复查' : '标记复查')}</span>
                        </button>
                      </div>

                      {/* 题干 (支持图锚点混合渲染) */}
                      <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <QuestionContent content={getSafeStem(q, isEn)} images={q.image_paths_json} />
                      </div>

                      {/* 解答草稿输入框 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span>{isEn ? 'Exam steps & scratchpad (self-assess against official rubrics upon submission):' : '考场作答与推导记录（交卷后将根据官方踩分点自核打钩）：'}</span>
                          <button
                            type="button"
                            onClick={() => handleFocusSolution(q, idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ios-blue)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: 0,
                            }}
                          >
                            <Icon name="keyboard" size={13} />
                            <span>{isEn ? 'Open Math Keyboard' : '打开数学符号键盘'}</span>
                          </button>
                        </div>

                        {/* 实时推导排版预览卡片 (严格位于输入框上方) */}
                        {currentDraft.trim() && (
                          <div
                            style={{
                              padding: '0.625rem 0.875rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--glass-bg-card)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.8rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ios-blue)', fontWeight: 700, fontSize: '0.72rem' }}>
                              <Icon name="eye" size={12} />
                              <span>{isEn ? 'Real-time Derivation Preview:' : '实时推导排版预览:'}</span>
                            </div>
                            <div style={{ color: 'var(--text-primary)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', minHeight: '24px' }}>
                              <AnswerFormulaRenderer content={currentDraft} multiline={true} />
                            </div>
                          </div>
                        )}

                        <textarea
                          rows={4}
                          placeholder={isEn ? 'Type key steps, auxiliary line constructions, or calculations...' : '可键入主要步骤、辅助线设法或计算过程...'}
                          value={currentDraft}
                          onChange={(e) =>
                            setSolutionAnswers((prev) => ({
                              ...prev,
                              [q.question_id]: e.target.value,
                            }))
                          }
                          onFocus={() => handleFocusSolution(q, idx)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.875rem',
                            borderRadius: 'var(--radius-lg)',
                            backgroundColor: 'var(--glass-bg-card)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            outline: 'none',
                            resize: 'vertical',
                            transition: 'border-color 0.2s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* 底部安全呼吸垫片 (彻底消除 TabBar 与弹出键盘遮挡) */}
          <div
            className="bottom-safe-spacer"
            data-testid="bottom-safe-spacer"
            style={{ height: keyboardVisible ? (isMobile ? '300px' : '260px') : undefined }}
          />
        </div>

        {/* ===================== 右侧：控制指挥舱 (绝对固定常驻) ===================== */}
        <div
          data-testid="right-cockpit-sticky"
          style={{
            flex: '0 0 320px',
            width: '320px',
            position: 'sticky',
            top: '1rem',
            alignSelf: 'flex-start',
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* 上卡片：答题辅助与使用说明 (可折叠手风琴) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-xl)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={() => setIsTipsExpanded(!isTipsExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Icon name="book" size={14} />
                <span>{isEn ? 'Exam Help & Syntax Guide' : '答题辅助与语法说明'}</span>
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}>
                {isTipsExpanded ? (isEn ? '▲ Collapse' : '▲ 收起') : (isEn ? '▼ Expand' : '▼ 展开')}
              </span>
            </button>

            {isTipsExpanded && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.625rem',
                  lineHeight: 1.5,
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{isEn ? 'Fraction:' : '分式表达：'}</strong>
                  <code style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--glass-bg-card)', color: 'var(--ios-blue)', fontFamily: 'monospace' }}>
                    (x+1)/(x-2)
                  </code>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{isEn ? 'Square Root:' : '根号表达：'}</strong>
                  <code style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--glass-bg-card)', color: 'var(--ios-blue)', fontFamily: 'monospace' }}>
                    sqrt(2x+3)
                  </code>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{isEn ? 'Composite Exponent:' : '复合指数：'}</strong>
                  <code style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--glass-bg-card)', color: 'var(--ios-blue)', fontFamily: 'monospace' }}>
                    -2x^(m+1)
                  </code>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{isEn ? 'Multiple Solutions:' : '分类讨论：'}</strong>
                  <span>{isEn ? 'Separate multiple solutions with "or" or comma, e.g. ' : '多个解用“或”或逗号隔开，如 '}</span>
                  <code style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--glass-bg-card)', color: 'var(--ios-blue)', fontFamily: 'monospace' }}>
                    {isEn ? 'x=1 or x=2' : 'x=1 或 x=2'}
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* 下卡片：动态答题卡 */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-xl)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <Icon name="target" size={14} />
                <span>{isEn ? 'Dynamic Answer Sheet' : '动态答题卡'}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--ios-blue)', fontWeight: 700 }}>{isEn ? `Answered ${answeredCount}` : `已答 ${answeredCount}`}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>{isEn ? `Unanswered ${unansweredCount}` : `未答 ${unansweredCount}`}</span>
                {flaggedCount > 0 && (
                  <>
                    <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                    <span style={{ color: 'var(--ios-red)', fontWeight: 700 }}>{isEn ? `Review ${flaggedCount}` : `复查 ${flaggedCount}`}</span>
                  </>
                )}
              </div>
            </div>

            {/* 题号状态网格 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem',
                maxHeight: '280px',
                overflowY: 'auto',
                padding: '0.25rem',
              }}
            >
              {allQuestions.map((q, idx) => {
                const qNum = idx + 1;
                const isFlagged = flaggedIds.has(q.question_id);

                let isAnswered = false;
                if (q.question_type === 'single_choice' && choiceAnswers[q.question_id]) {
                  isAnswered = true;
                } else if (q.question_type === 'fill_blank') {
                  const raw = fillAnswers[q.question_id] || '';
                  const bCount = detectBlankCount({ ...q, locale });
                  if (bCount > 1) {
                    const slots = deserializeStudentSlots(raw, bCount);
                    isAnswered = slots.some((s) => s.trim().length > 0);
                  } else {
                    isAnswered = Boolean(raw.trim());
                  }
                } else if (
                  q.question_type === 'solution' &&
                  (solutionAnswers[q.question_id] || '').trim()
                ) {
                  isAnswered = true;
                }

                return (
                  <button
                    key={q.question_id}
                    type="button"
                    onClick={() => scrollToQuestion(q.question_id)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '2.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      border: 'none',
                      backgroundColor: isAnswered ? 'var(--ios-blue)' : 'var(--glass-bg-card)',
                      color: isAnswered ? '#ffffff' : 'var(--text-primary)',
                      boxShadow: isAnswered ? '0 2px 6px rgba(0, 122, 255, 0.25)' : 'none',
                    }}
                  >
                    <span>{qNum}</span>
                    {/* 小红旗待复查角标 */}
                    {isFlagged && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          display: 'flex',
                          width: '0.875rem',
                          height: '0.875rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ios-red)',
                          color: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      >
                        <Icon name="flag" size={8} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 底部高对比度大号提交按钮 */}
            <button
              type="button"
              onClick={handleSubmitExam}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.8125rem',
                fontWeight: 900,
                backgroundColor: 'var(--ios-blue)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'transform 0.15s',
              }}
            >
              <Icon name="download" size={16} />
              <span>{isEn ? `Submit & Grade (${answeredCount}/${allQuestions.length})` : `提交试卷并判分 (${answeredCount}/${allQuestions.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 手机端悬浮胶囊：[ 进度 (已答/总数) ] 滑出答题卡 */}
      {isMobile && (
        <button
          type="button"
          data-testid="mobile-exam-progress-capsule"
          onClick={() => setMobileSheetOpen(true)}
          style={{
            position: 'fixed',
            right: '1rem',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--ios-blue)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.8125rem',
            boxShadow: '0 8px 24px rgba(0, 122, 255, 0.35)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Icon name="target" size={16} />
          <span>
            {isEn
              ? `Progress (${answeredCount}/${allQuestions.length})`
              : `进度 (${answeredCount}/${allQuestions.length})`}
          </span>
        </button>
      )}

      {/* 手机端答题卡浮层 (iOS 27 Modal Bottom Sheet) */}
      {isMobile && mobileSheetOpen && (
        <div
          data-testid="mobile-answer-sheet-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setMobileSheetOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary, #ffffff)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '1.25rem',
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 抽屉头部 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <Icon name="target" size={16} />
                <span>{isEn ? 'Dynamic Answer Sheet' : '动态答题卡'}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ios-blue)', fontWeight: 700 }}>
                  {isEn ? `Answered ${answeredCount}/${allQuestions.length}` : `已答 ${answeredCount}/${allQuestions.length}`}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            </div>

            {/* 题号网格 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '0.25rem',
              }}
            >
              {allQuestions.map((q, idx) => {
                const qNum = idx + 1;
                const isFlagged = flaggedIds.has(q.question_id);
                let isAnswered = false;
                if (idx < paper.choiceQuestions.length) {
                  isAnswered = !!choiceAnswers[q.question_id];
                } else if (idx < paper.choiceQuestions.length + paper.fillQuestions.length) {
                  isAnswered = !!(fillAnswers[q.question_id] && fillAnswers[q.question_id].trim());
                } else {
                  isAnswered = !!(solutionAnswers[q.question_id] && solutionAnswers[q.question_id].trim());
                }

                return (
                  <button
                    key={q.question_id}
                    type="button"
                    onClick={() => {
                      setMobileSheetOpen(false);
                      scrollToQuestion(q.question_id);
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '2.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: isAnswered ? 'var(--ios-blue)' : 'var(--glass-bg-card)',
                      color: isAnswered ? '#ffffff' : 'var(--text-primary)',
                      boxShadow: isAnswered ? '0 2px 6px rgba(0, 122, 255, 0.25)' : 'none',
                    }}
                  >
                    <span>{qNum}</span>
                    {isFlagged && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          display: 'flex',
                          width: '0.875rem',
                          height: '0.875rem',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ios-red)',
                          color: '#ffffff',
                        }}
                      >
                        <Icon name="flag" size={8} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 提交大按钮 */}
            <button
              type="button"
              data-testid="mobile-submit-exam-btn"
              onClick={() => {
                setMobileSheetOpen(false);
                handleSubmitExam();
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.875rem',
                fontWeight: 900,
                backgroundColor: 'var(--ios-blue)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="download" size={16} />
              <span>{isEn ? `Submit & Grade (${answeredCount}/${allQuestions.length})` : `提交试卷并判分 (${answeredCount}/${allQuestions.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* 全局唯一智能伴随数学键盘 (MathKeyboard) */}
      <MathKeyboard
        visible={keyboardVisible}
        currentValue={currentInputValue}
        onInsert={handleKeyboardInsert}
        onBackspace={handleKeyboardBackspace}
        onClear={handleKeyboardClear}
        onClose={() => setKeyboardVisible(false)}
        targetTitle={focusedTitle}
      />

      {/* 退出考试二次确认提示弹窗 (Portal 挂载至 document.body 确保真全屏视口水平垂直严格绝对居中) */}
      {showExitConfirm &&
        (typeof document !== 'undefined'
          ? createPortal(
              <div
                data-testid="exam-exit-confirm-modal"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: 99999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <div
                  style={{
                    width: '90%',
                    maxWidth: '380px',
                    padding: '24px',
                    borderRadius: '20px',
                    background: 'var(--bg-card, #ffffff)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.22)',
                    border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255, 149, 0, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ios-amber, #ff9500)',
                    }}
                  >
                    <Icon name="alert" size={24} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isEn ? 'Confirm Exit Exam' : '确认退出考试'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {isEn ? 'Exam is currently in progress. Are you sure you want to exit?' : '正在进行考试，你是否确认退出？'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowExitConfirm(false)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))',
                        background: 'var(--glass-bg, rgba(0, 0, 0, 0.04))',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {isEn ? 'Continue Exam' : '继续考试'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExitConfirm(false);
                        onBackToWorkbench();
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'var(--ios-red, #ff3b30)',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255, 59, 48, 0.25)',
                      }}
                    >
                      {isEn ? 'Confirm Exit' : '确认退出'}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null)}
    </div>
  );
};
