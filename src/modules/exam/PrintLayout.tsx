/**
 * 双栏 A4 打印与排版导出视窗 (任务 17.4, PRD §5.4 子系统 A)
 *
 * 核心特性：
 * 1. 严格还原中考 A4 双栏试卷版心排版 (打印时 column-count: 2)
 * 2. 具备左侧标准密封线与考生信息登记区 (姓名/准考证号/考场号/座位号)
 * 3. 强制定界防截断 (page-break-inside: avoid)，保证题干/选项/解答不被 A4 分页截断
 * 4. 全文本与公式通过 <MathRenderer> 安全上屏 (铁律 3)
 * 5. 支持三种视图切换：试卷版、答题卡、教师解析卷
 */

import React, { useState } from 'react';
import { GeneratedPaper } from './drawQuestions';
import { MathRenderer } from '../../components/math/MathRenderer';
import { QuestionContent } from '../../components/common/QuestionContent';
import { QuestionImage } from '../../components/common/QuestionImage';
import { SolutionList } from './SolutionList';
import { Icon } from '../../components/common/Icon';
import { useSessionStore } from '../../store/sessionStore';
import './print.css';

export interface PrintLayoutProps {
  paper: GeneratedPaper;
  onBackToWorkbench?: () => void;
}

export type PaperViewMode = 'paper' | 'answer_sheet' | 'teacher_key';

export const PrintLayout: React.FC<PrintLayoutProps> = ({ paper, onBackToWorkbench }) => {
  const locale = useSessionStore((state) => state.locale);
  const isEn = String(locale).toLowerCase().startsWith('en');

  const [viewMode, setViewMode] = useState<PaperViewMode>('paper');
  const [isTwoColumnPreview, setIsTwoColumnPreview] = useState(true);

  // 安全解析 options_json 备用渲染
  const parseOptions = (optionsJson?: string | null): Record<string, { zh: string; en: string; img?: string }> | null => {
    if (!optionsJson) return null;
    try {
      return JSON.parse(optionsJson);
    } catch {
      return null;
    }
  };

  // 解析解答题分步踩分点
  const parseRubricSteps = (rubricJson?: string | null): Array<{ stepIndex: number; descriptionZh: string; descriptionEn?: string; points: number }> => {
    if (!rubricJson) return [];
    try {
      return JSON.parse(rubricJson);
    } catch {
      return [];
    }
  };

  // 选择题分数计算
  const choiceScorePerQuestion =
    paper.choiceQuestions.length > 0 ? paper.choiceQuestions[0].score_default || 3 : 3;
  const choiceTotalScore = paper.choiceQuestions.length * choiceScorePerQuestion;

  // 填空题分数计算
  const fillScorePerQuestion =
    paper.fillQuestions.length > 0 ? paper.fillQuestions[0].score_default || 3 : 3;
  const fillTotalScore = paper.fillQuestions.length * fillScorePerQuestion;

  // 解答题总分
  const solutionTotalScore = paper.solutionQuestions.reduce(
    (sum, q) => sum + (q.score_default || 8),
    0
  );

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        padding: '1.5rem 1rem',
        background: 'var(--bg-canvas, #f8fafc)',
        color: 'var(--text-primary, #1d1d1f)',
        boxSizing: 'border-box',
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* 顶部操作工具栏 (打印时自动隐藏) */}
      <div
        className="no-print"
        style={{
          maxWidth: '1024px',
          margin: '0 auto 1.5rem auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md, 18px)',
          background: 'var(--glass-bg-elevated, rgba(255, 255, 255, 0.86))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
          boxShadow: 'var(--glass-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBackToWorkbench && (
            <button
              type="button"
              onClick={onBackToWorkbench}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              {isEn ? '← Back to Workbench' : '← 返回出题工作台'}
            </button>
          )}
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {isEn
              ? `Total ${paper.totalQuestions} Questions · Full Score ${paper.fullScore} Pts · Limit ${paper.timeLimitMinutes} Mins`
              : `共 ${paper.totalQuestions} 题 · 满分 ${paper.fullScore} 分 · 限时 ${paper.timeLimitMinutes} 分钟`}
          </span>
        </div>

        {/* 视图切换 (试卷版 / 答题卡 / 教师解析卷) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: '8px',
              background: 'var(--bg-input)',
              padding: '0.2rem',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {[
              { mode: 'paper', label: isEn ? 'Exam Paper' : '试卷排版', icon: 'file' },
              { mode: 'answer_sheet', label: isEn ? 'Answer Sheet' : '答题纸', icon: 'edit' },
              { mode: 'teacher_key', label: isEn ? 'Teacher Key & Solutions' : '教师解析卷', icon: 'key' },
            ].map((tab) => {
              const isCur = viewMode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  type="button"
                  onClick={() => setViewMode(tab.mode as any)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: isCur ? 700 : 500,
                    background: isCur ? 'var(--bg-card)' : 'transparent',
                    color: isCur ? 'var(--ios-blue)' : 'var(--text-secondary)',
                    boxShadow: isCur ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon name={tab.icon} size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 栏位切换 */}
          <button
            type="button"
            onClick={() => setIsTwoColumnPreview(!isTwoColumnPreview)}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
            }}
            title={isEn ? 'Toggle single/two column preview' : '切换屏幕双栏或单栏仿真'}
          >
            {isTwoColumnPreview ? (isEn ? 'Single Column' : '切换单栏') : (isEn ? 'Two Columns' : '切换双栏')}
          </button>

          {/* 打印按钮 */}
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '8px',
              background: 'var(--ios-blue)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px var(--ios-blue-glow)',
            }}
          >
            <Icon name="print" size={14} />
            <span>{isEn ? 'Print / Export PDF' : '打印 / 导出 PDF'}</span>
          </button>
        </div>
      </div>

      {/* A4 试卷仿真容器 */}
      <div
        className="print-paper-container screen-paper-preview"
        style={{
          maxWidth: '1024px',
          margin: '0 auto',
          padding: '2.5rem',
          borderRadius: '12px',
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* 左侧密封线与装订线 (试卷版与答题纸展示) */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div
            className="print-sealing-line"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRight: '2px dashed #94a3b8',
              paddingRight: '0.75rem',
              paddingTop: '1rem',
              paddingBottom: '1rem',
              userSelect: 'none',
              fontSize: '11px',
              color: '#64748b',
              width: '40px',
              flexShrink: 0,
            }}
          >
            <span
              className="writing-vertical-lr"
              style={{
                fontWeight: 700,
                letterSpacing: '0.3em',
                writingMode: 'vertical-rl',
                marginBottom: '1rem',
              }}
            >
              {isEn ? 'DO NOT WRITE IN SEALED MARGIN' : '密 封 线 内 严 禁 答 题'}
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                margin: 'auto 0',
                writingMode: 'vertical-rl',
              }}
            >
              <span>{isEn ? 'Name: __________' : '姓名：__________'}</span>
              <span>{isEn ? 'ID / Admission: __________' : '准考证号：__________'}</span>
              <span>{isEn ? 'Room: _____' : '考场号：_____'}</span>
              <span>{isEn ? 'Seat: _____' : '座位号：_____'}</span>
            </div>
            <span
              className="writing-vertical-lr"
              style={{
                fontWeight: 700,
                letterSpacing: '0.3em',
                writingMode: 'vertical-rl',
                marginTop: '1rem',
              }}
            >
              {isEn ? 'BINDING MARGIN' : '装 订 线'}
            </span>
          </div>

          {/* 主试卷内容区 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 试卷卷头信息 */}
            <div
              className="print-section-header"
              style={{
                textAlign: 'center',
                paddingBottom: '1rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #cbd5e1',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.35rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    border: '1px solid #94a3b8',
                    padding: '0.1rem 0.35rem',
                  }}
                >
                  {isEn ? 'TOP SECRET ★ PRE-EXAM' : '绝密★启用前'}
                </span>
                <span>{isEn ? 'Paper Type: A' : '试卷类型：A'}</span>
              </div>
              <h1
                style={{
                  margin: '0.5rem 0',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: '#0f172a',
                }}
              >
                {(isEn ? paper.titleEn : paper.titleZh) || paper.titleZh}
                {viewMode === 'answer_sheet' && (isEn ? ' · Answer Sheet' : ' · 答题纸')}
                {viewMode === 'teacher_key' && (isEn ? ' · Reference Answers & Rubrics' : ' · 教师参考答案及评分细则')}
              </h1>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#475569',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  fontWeight: 500,
                }}
              >
                <span>{isEn ? 'Subject: Junior High Math' : '考试科目：初中数学'}</span>
                <span>{isEn ? `Full Score: ${paper.fullScore} Pts` : `满分：${paper.fullScore} 分`}</span>
                <span>{isEn ? `Time Limit: ${paper.timeLimitMinutes} Mins` : `考试时限：${paper.timeLimitMinutes} 分钟`}</span>
              </div>
              {viewMode === 'paper' && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '11px',
                    color: '#64748b',
                    background: '#f8fafc',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left',
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700 }}>
                    {isEn ? 'Instructions to Candidates:' : '考生须知：'}
                  </p>
                  <p style={{ margin: '0 0 0.15rem 0' }}>
                    {isEn
                      ? `1. This paper consists of three sections, ${paper.totalQuestions} questions. Candidates must write their name and exam ID in the designated areas inside the sealing margin before answering.`
                      : `1. 本试卷共三大题，${paper.totalQuestions} 小题。答题前，考生务必将姓名、准考证号填写在密封线内相应位置。`}
                  </p>
                  <p style={{ margin: '0 0 0.15rem 0' }}>
                    {isEn
                      ? '2. For multiple-choice questions, select the best answer for each question and write it clearly in the corresponding brackets or bubble it on the answer sheet.'
                      : '2. 回答选择题时，选出每小题答案后，请务必工整书写在题后对应括号内或涂在答题纸上。'}
                  </p>
                  <p style={{ margin: 0 }}>
                    {isEn
                      ? '3. For non-choice questions, use a 0.5mm black ink pen. Diagrams must be drawn clearly with a 2B pencil.'
                      : '3. 回答非选择题时，必须使用 0.5 毫米黑色签字笔规范书写，作图必须用 2B 铅笔画出清晰线段。'}
                  </p>
                </div>
              )}
            </div>

            {/* 试卷正文排版 */}
            <div
              className={isTwoColumnPreview ? 'print-columns-flow' : ''}
              style={{
                columnCount: isTwoColumnPreview ? 2 : 1,
                columnGap: '2rem',
              }}
            >
              {/* ========================================================================= */}
              {/* 第一大题：选择题 */}
              {/* ========================================================================= */}
              {paper.choiceQuestions.length > 0 && (
                <div style={{ marginBottom: '1.5rem', breakInside: 'avoid' }}>
                  <div
                    className="print-section-header"
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: '#f1f5f9',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      marginBottom: '0.75rem',
                      borderLeft: '4px solid var(--ios-blue)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      {isEn
                        ? `I. Multiple Choice (Total ${paper.choiceQuestions.length} Questions, ${choiceScorePerQuestion} pts each, total ${choiceTotalScore} pts)`
                        : `一、选择题（本大题共 ${paper.choiceQuestions.length} 小题，每小题 ${choiceScorePerQuestion} 分，共 ${choiceTotalScore} 分）`}
                    </span>
                  </div>

                  {paper.choiceQuestions.map((q, idx) => {
                    const questionIndex = idx + 1;
                    const options = parseOptions(q.options_json);

                    return (
                      <div
                        key={q.question_id}
                        className="print-question-card"
                        style={{ marginBottom: '1rem', fontSize: '0.78rem', lineHeight: 1.6 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700 }}>{questionIndex}.</span>
                          <div style={{ flex: 1 }}>
                            <QuestionContent content={(isEn ? q.stem_en : q.stem_zh) || q.stem_zh} images={q.image_paths_json} eager={true} />
                          </div>
                        </div>

                        {/* 选项网格 */}
                        {options && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                              gap: '0.5rem',
                              marginTop: '0.5rem',
                              marginLeft: '1rem',
                            }}
                          >
                            {Object.entries(options).map(([optKey, optVal]) => (
                              <div key={optKey} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                                <span style={{ fontWeight: 700 }}>{optKey}.</span>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {optVal.img ? (
                                    <QuestionImage role="option" src={optVal.img} alt={isEn ? `Option ${optKey}` : `选项 ${optKey}`} eager={true} />
                                  ) : (
                                    <MathRenderer content={(isEn ? optVal.en : optVal.zh) || optVal.zh} />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 教师解析卷独有展示 */}
                        {viewMode === 'teacher_key' && (
                          <div
                            style={{
                              marginTop: '0.65rem',
                              padding: '0.5rem 0.75rem',
                              background: '#ecfdf5',
                              color: '#065f46',
                              borderRadius: '4px',
                              border: '1px solid #a7f3d0',
                              fontSize: '11px',
                            }}
                          >
                            <p style={{ margin: 0, fontWeight: 700, color: '#047857', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {isEn ? '【Standard Answer】 ' : '【标准答案】 '}<MathRenderer content={q.answer_standard || ''} />
                            </p>
                            {q.solutions_json && (
                              <div style={{ marginTop: '0.35rem' }}>
                                <span style={{ fontWeight: 600 }}>{isEn ? '【Detailed Analysis】' : '【解析点睛】'}</span>
                                <SolutionList solutions={q.solutions_json} images={q.image_paths_json} eager={true} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 答题纸占位涂卡框 */}
                        {viewMode === 'answer_sheet' && (
                          <div
                            style={{
                              marginTop: '0.4rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginLeft: '1rem',
                              fontSize: '11px',
                              color: '#64748b',
                            }}
                          >
                            <span>{isEn ? 'Mark Answer:' : '填涂答案：'}</span>
                            {['A', 'B', 'C', 'D'].map((letter) => (
                              <span
                                key={letter}
                                style={{
                                  width: '20px',
                                  height: '16px',
                                  border: '1px solid #94a3b8',
                                  borderRadius: '3px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                }}
                              >
                                [{letter}]
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ========================================================================= */}
              {/* 第二大题：填空题 */}
              {/* ========================================================================= */}
              {paper.fillQuestions.length > 0 && (
                <div style={{ marginBottom: '1.5rem', breakInside: 'avoid' }}>
                  <div
                    className="print-section-header"
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: '#f1f5f9',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      marginBottom: '0.75rem',
                      borderLeft: '4px solid var(--ios-indigo)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      {isEn
                        ? `II. Fill-in-the-Blank (Total ${paper.fillQuestions.length} Questions, ${fillScorePerQuestion} pts each, total ${fillTotalScore} pts)`
                        : `二、填空题（本大题共 ${paper.fillQuestions.length} 小题，每小题 ${fillScorePerQuestion} 分，共 ${fillTotalScore} 分）`}
                    </span>
                  </div>

                  {paper.fillQuestions.map((q, idx) => {
                    const questionIndex = paper.choiceQuestions.length + idx + 1;

                    return (
                      <div
                        key={q.question_id}
                        className="print-question-card"
                        style={{ marginBottom: '1rem', fontSize: '0.78rem', lineHeight: 1.6 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700 }}>{questionIndex}.</span>
                          <div style={{ flex: 1 }}>
                            <QuestionContent content={(isEn ? q.stem_en : q.stem_zh) || q.stem_zh} images={q.image_paths_json} eager={true} />
                          </div>
                        </div>

                        {/* 教师解析卷独有展示 */}
                        {viewMode === 'teacher_key' && (
                          <div
                            style={{
                              marginTop: '0.65rem',
                              padding: '0.5rem 0.75rem',
                              background: '#ecfdf5',
                              color: '#065f46',
                              borderRadius: '4px',
                              border: '1px solid #a7f3d0',
                              fontSize: '11px',
                            }}
                          >
                            <p style={{ margin: 0, fontWeight: 700, color: '#047857' }}>
                              {isEn ? '【Reference Answer】 ' : '【参考答案】 '}<MathRenderer content={q.answer_standard || ''} />
                            </p>
                          </div>
                        )}

                        {/* 答题纸专用填空线 */}
                        {viewMode === 'answer_sheet' && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              marginLeft: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '11px',
                            }}
                          >
                            <span>{isEn ? 'Answer:' : '作答：'}</span>
                            <span style={{ flex: 1, borderBottom: '1px solid #64748b', height: '20px' }}></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ========================================================================= */}
              {/* 第三大题：解答题 */}
              {/* ========================================================================= */}
              {paper.solutionQuestions.length > 0 && (
                <div style={{ marginBottom: '1.5rem', breakInside: 'avoid' }}>
                  <div
                    className="print-section-header"
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: '#f1f5f9',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      marginBottom: '0.75rem',
                      borderLeft: '4px solid var(--ios-orange)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      {isEn
                        ? `III. Extended Solution (Total ${paper.solutionQuestions.length} Questions, total ${solutionTotalScore} pts. Detailed derivation, proof, or calculation steps required)`
                        : `三、解答题（本大题共 ${paper.solutionQuestions.length} 小题，共 ${solutionTotalScore} 分。要求写出文字说明、证明过程或演算步骤）`}
                    </span>
                  </div>

                  {paper.solutionQuestions.map((q, idx) => {
                    const questionIndex =
                      paper.choiceQuestions.length + paper.fillQuestions.length + idx + 1;
                    const rubricSteps = parseRubricSteps(q.rubric_checklist_json);

                    return (
                      <div
                        key={q.question_id}
                        className="print-question-card"
                        style={{ marginBottom: '1.5rem', fontSize: '0.78rem', lineHeight: 1.6 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700 }}>{questionIndex}.</span>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>
                            {isEn ? `(${q.score_default || 8} Pts)` : `(${q.score_default || 8} 分)`}
                          </span>
                          <div style={{ flex: 1 }}>
                            <QuestionContent content={(isEn ? q.stem_en : q.stem_zh) || q.stem_zh} images={q.image_paths_json} eager={true} />
                          </div>
                        </div>

                        {/* 试卷版与答题纸：预留作答网格/空白框 */}
                        {viewMode !== 'teacher_key' && (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              marginLeft: '1rem',
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '0.5rem',
                              height: viewMode === 'answer_sheet' ? '160px' : '120px',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'flex-end',
                              color: '#94a3b8',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          >
                            <span>
                              {isEn
                                ? 'Please answer strictly within the designated area for each question. Answers beyond the border are invalid.'
                                : '请在各题目的答题区域内作答，超出黑色边框区域的答案无效'}
                            </span>
                          </div>
                        )}

                        {/* 教师解析卷：显示分步踩分点与规范推导 */}
                        {viewMode === 'teacher_key' && (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              background: '#fffbeb',
                              color: '#78350f',
                              borderRadius: '8px',
                              border: '1px solid #fde68a',
                              fontSize: '11px',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.4rem' }}>
                              {isEn
                                ? `【Official Rubric Checklist】(Full Score ${q.score_default || 8} Pts)`
                                : `【中考官方踩分点 Checklist】(满分 ${q.score_default || 8} 分)`}
                            </div>
                            {rubricSteps.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                {rubricSteps.map((step) => (
                                   <div key={step.stepIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                     <span>
                                       {isEn ? `Step ${step.stepIndex}: ` : `第 ${step.stepIndex} 步：`}
                                       <MathRenderer content={(isEn ? step.descriptionEn : step.descriptionZh) || step.descriptionZh} />
                                     </span>
                                     <span style={{ fontWeight: 700, color: '#b45309', whiteSpace: 'nowrap' }}>
                                       {isEn ? `+${step.points} Pts` : `+${step.points} 分`}
                                     </span>
                                   </div>
                                 ))}
                              </div>
                            ) : (
                              <p style={{ margin: 0, color: '#64748b' }}>
                                {isEn ? 'No detailed step rubrics available for this question' : '本题暂无细分步骤点'}
                              </p>
                            )}

                            {q.answer_standard && (
                              <div style={{ marginTop: '0.4rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                <span style={{ fontWeight: 700, color: '#92400e' }}>
                                  {isEn ? '【Reference Answer】 ' : '【参考答案】 '}
                                </span>
                                <MathRenderer content={q.answer_standard} />
                              </div>
                            )}

                            {q.solutions_json && (
                              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #fde68a' }}>
                                <span style={{ fontWeight: 700, color: '#78350f' }}>
                                  {isEn ? '【Full Derivation】' : '【推导精解】'}
                                </span>
                                <SolutionList solutions={q.solutions_json} images={q.image_paths_json} eager={true} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 试卷底部 */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#94a3b8',
              }}
            >
              <span>
                {isEn
                  ? `— Core Competency Assessment System · Paper Serial: ${paper.paperId} —`
                  : `— 初中数学核心素养测评系统 · 试卷印刷流水号: ${paper.paperId} —`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
