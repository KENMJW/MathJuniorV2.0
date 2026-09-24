/**
 * 在线测评成绩与素养诊断复盘大屏 (任务 17.6, PRD §5.4, 铁律 2 零持久化, 铁律 3)
 *
 * 核心功能：
 * 1. 判分接入：
 *    - 填空题：isMathAnswerEquivalent 受控白名单等价判定
 *    - 解答题：calculateSolutionScore 中考标准分步踩分点自核打钩 (Rubric Checklist)
 * 2. 四维认知素养雷达图 (RadarChart) 纯 SVG 动态渲染
 * 3. 多解法平铺对比 (PRD §5.4)
 * 4. 考点组合题 (Clique) 穿透反哺双层胶囊
 * 5. [铁律 2 考完即焚]：全内存 Zustand 驱动，一键彻底销毁，绝不落盘持久化
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeneratedPaper, QuestionItem } from './drawQuestions';
import { MathRenderer } from '../../components/math/MathRenderer';
import { QuestionContent } from '../../components/common/QuestionContent';
import { SourceTag } from '../../components/common/SourceTag';
import { SolutionList } from './SolutionList';
import { Icon } from '../../components/common/Icon';
import { RadarChart, CognitiveRadarScores } from './RadarChart';
import { isMathAnswerEquivalent } from '../../engine/judge/isMathAnswerEquivalent';
import {
  calculateSolutionScore,
  RubricStep,
  getTotalRubricPoints,
} from '../../engine/judge/calculateSolutionScore';
import { normalizeOptionAnswer } from '../../engine/judge/normalizeOptionAnswer';
import { useSessionStore } from '../../store/sessionStore';
import { getSafeStem } from '../../engine/i18n/stemGuard';

export { normalizeOptionAnswer };

export interface ScorePanelProps {
  paper: GeneratedPaper;
  choiceAnswers: Record<string, string>;
  fillAnswers: Record<string, string>;
  solutionAnswers: Record<string, string>;
  solutionCheckedSteps: Record<string, Set<number>>;
  onStepCheckChange: (questionId: string, stepIndex: number, checked: boolean) => void;
  onResetExam: () => void;
  onBackToWorkbench: () => void;
  timeSpentSeconds?: number;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({
  paper,
  choiceAnswers,
  fillAnswers,
  solutionAnswers,
  solutionCheckedSteps,
  onStepCheckChange,
  onResetExam,
  onBackToWorkbench,
  timeSpentSeconds = 0,
}) => {
  let navigate: ((to: string) => void) | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch {
    navigate = null;
  }
  const setExamScore = useSessionStore((state) => state.setExamScore);
  const resetScores = useSessionStore((state) => state.resetScores);
  const setSelectedConceptPointId = useSessionStore((state) => state.setSelectedConceptPointId);
  const locale = useSessionStore((state) => state.locale);
  const isEn = String(locale).toLowerCase().startsWith('en');

  const handleReviewConcept = (pointId?: string) => {
    if (pointId) {
      setSelectedConceptPointId(pointId);
    }
    if (navigate) {
      navigate('/math-junior/concept');
    }
  };

  const handleReviewXRay = () => {
    if (navigate) {
      navigate('/math-junior/lab');
    }
  };

  // 1. 选择题判分结果
  const choiceResults = useMemo(() => {
    return paper.choiceQuestions.map((q) => {
      const studentAns = choiceAnswers[q.question_id] || '';
      const isCorrect = normalizeOptionAnswer(studentAns) === normalizeOptionAnswer(q.answer_standard);
      const score = isCorrect ? q.score_default : 0;
      return { question: q, studentAns, isCorrect, score };
    });
  }, [paper.choiceQuestions, choiceAnswers]);

  // 2. 填空题判分结果 (接入 isMathAnswerEquivalent)
  const fillResults = useMemo(() => {
    return paper.fillQuestions.map((q) => {
      const studentAns = fillAnswers[q.question_id] || '';
      const standardAns = q.answer_standard || '';
      const eqResult = isMathAnswerEquivalent(studentAns, standardAns, []);
      let isCorrect = false;
      let isSuspect = false;
      let score = 0;

      if (eqResult === true) {
        isCorrect = true;
        score = q.score_default;
      } else if (eqResult === 'suspect') {
        isSuspect = true;
        score = q.score_default; // 疑似正确安全兜底
      }

      return { question: q, studentAns, standardAns, isCorrect, isSuspect, score };
    });
  }, [paper.fillQuestions, fillAnswers]);

  // 3. 解答题判分结果 (接入 calculateSolutionScore rubric)
  const solutionResults = useMemo(() => {
    return paper.solutionQuestions.map((q) => {
      let steps: RubricStep[] = [];
      try {
        if (q.rubric_checklist_json) {
          steps = JSON.parse(q.rubric_checklist_json);
        }
      } catch {
        steps = [];
      }

      // 若题库未配置踩分点，默认生成 2 步阶梯
      if (!steps || steps.length === 0) {
        const half = Math.floor(q.score_default / 2);
        steps = [
          { stepIndex: 1, descriptionZh: '完成基本推理与推导步骤', points: half },
          { stepIndex: 2, descriptionZh: '得出准确计算结果并作答', points: q.score_default - half },
        ];
      }

      const checked = solutionCheckedSteps[q.question_id] || new Set<number>();
      const score = calculateSolutionScore(steps, checked);
      const maxScore = getTotalRubricPoints(steps) || q.score_default;

      return {
        question: q,
        steps,
        checked,
        score,
        maxScore,
        studentDraft: solutionAnswers[q.question_id] || '',
      };
    });
  }, [paper.solutionQuestions, solutionCheckedSteps, solutionAnswers]);

  // 全卷总分计算
  const { totalScore, maxScore, questionScoresRecord } = useMemo(() => {
    let earned = 0;
    let max = 0;
    const details: Record<string, number> = {};

    choiceResults.forEach((r) => {
      earned += r.score;
      max += r.question.score_default;
      details[r.question.question_id] = r.score;
    });
    fillResults.forEach((r) => {
      earned += r.score;
      max += r.question.score_default;
      details[r.question.question_id] = r.score;
    });
    solutionResults.forEach((r) => {
      earned += r.score;
      max += r.maxScore;
      details[r.question.question_id] = r.score;
    });

    return { totalScore: earned, maxScore: max || paper.fullScore, questionScoresRecord: details };
  }, [choiceResults, fillResults, solutionResults, paper.fullScore]);

  // 同步得分入 Zustand 会话内存 (零持久化)
  React.useEffect(() => {
    setExamScore({
      totalScore,
      maxScore,
      details: questionScoresRecord,
    });
  }, [totalScore, maxScore, questionScoresRecord, setExamScore]);

  // 4. 四维认知素养雷达图得分计算
  const radarScores: CognitiveRadarScores = useMemo(() => {
    const overallRate = maxScore > 0 ? (totalScore / maxScore) * 100 : 80;

    // ① 知识广度：考点掌握覆盖率
    const pointStats: Record<string, { earned: number; total: number }> = {};
    const recordPoint = (pid: string, earned: number, max: number) => {
      if (!pointStats[pid]) pointStats[pid] = { earned: 0, total: 0 };
      pointStats[pid].earned += earned;
      pointStats[pid].total += max;
    };
    choiceResults.forEach((r) => recordPoint(r.question.primary_point_id, r.score, r.question.score_default));
    fillResults.forEach((r) => recordPoint(r.question.primary_point_id, r.score, r.question.score_default));
    solutionResults.forEach((r) => recordPoint(r.question.primary_point_id, r.score, r.maxScore));

    const pEntries = Object.values(pointStats);
    const passedPoints = pEntries.filter((p) => p.total > 0 && p.earned / p.total >= 0.6).length;
    const breadthScore = pEntries.length > 0 ? Math.round((passedPoints / pEntries.length) * 100) : Math.round(overallRate);

    // ② 深度洞察：L4~L5 及压轴解答题突破率
    let deepEarned = 0;
    let deepTotal = 0;
    const recordDeep = (diff: number, earned: number, max: number) => {
      if (diff >= 4) {
        deepEarned += earned;
        deepTotal += max;
      }
    };
    choiceResults.forEach((r) => recordDeep(r.question.difficulty_level, r.score, r.question.score_default));
    fillResults.forEach((r) => recordDeep(r.question.difficulty_level, r.score, r.question.score_default));
    solutionResults.forEach((r) => recordDeep(r.question.difficulty_level, r.score, r.maxScore));
    const insightScore = deepTotal > 0 ? Math.round((deepEarned / deepTotal) * 100) : Math.min(100, Math.round(overallRate * 0.95));

    // ③ 隐蔽条件发掘：几何综合与连通组合题得分率
    let geomEarned = 0;
    let geomTotal = 0;
    const recordGeom = (q: QuestionItem, earned: number, max: number) => {
      if (q.primary_point_id.includes('G') || q.combination_id) {
        geomEarned += earned;
        geomTotal += max;
      }
    };
    choiceResults.forEach((r) => recordGeom(r.question, r.score, r.question.score_default));
    fillResults.forEach((r) => recordGeom(r.question, r.score, r.question.score_default));
    solutionResults.forEach((r) => recordGeom(r.question, r.score, r.maxScore));
    const hiddenConditionScore = geomTotal > 0 ? Math.round((geomEarned / geomTotal) * 100) : Math.min(100, Math.round(overallRate * 0.92));

    // ④ 计算耐受力：填空与多步代数解答题得分率
    let calcEarned = 0;
    let calcTotal = 0;
    fillResults.forEach((r) => {
      calcEarned += r.score;
      calcTotal += r.question.score_default;
    });
    solutionResults.forEach((r) => {
      if (!r.question.primary_point_id.includes('G')) {
        calcEarned += r.score;
        calcTotal += r.maxScore;
      }
    });
    const resilienceScore = calcTotal > 0 ? Math.round((calcEarned / calcTotal) * 100) : Math.round(overallRate);

    return {
      breadth: breadthScore,
      insight: insightScore,
      hiddenCondition: hiddenConditionScore,
      resilience: resilienceScore,
    };
  }, [choiceResults, fillResults, solutionResults, totalScore, maxScore]);

  // 考完即焚彻底销毁
  const handleBurnAndLeave = () => {
    resetScores();
    onResetExam();
    onBackToWorkbench();
  };

  // 格式化用时
  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeString = isEn
    ? `${minutes} min ${seconds < 10 ? '0' : ''}${seconds} sec`
    : `${minutes} 分 ${seconds < 10 ? '0' : ''}${seconds} 秒`;
  const accuracyRate = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        fontFamily: 'var(--font-family-system)',
      }}
    >
      {/* 顶部总览卡片：总分、评级与四维认知素养雷达图 */}
      <div
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'var(--glass-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1.5rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'rgba(52, 199, 89, 0.12)',
                color: 'var(--ios-green)',
                border: '1px solid rgba(52, 199, 89, 0.25)',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Icon name="target" size={13} />
                <span>{isEn ? 'Assessment Review Completed' : '测评复盘完成'}</span>
              </span>
              <span>{isEn ? 'Junior High Math Mock Exam Report' : '中考全真测评报告'}</span>
            </div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                margin: '0.25rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              {(isEn ? paper.titleEn : paper.titleZh) || paper.titleZh}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {isEn
                ? `Full Score ${maxScore} Pts · Time Spent: ${timeString} · Accuracy Rate: ${accuracyRate}%`
                : `全卷满分 ${maxScore} 分 · 考场用时：${timeString} · 答题正确率：${accuracyRate}%`}
            </p>
          </div>

          {/* 醒目得分仪表 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
              border: '1px solid rgba(0, 122, 255, 0.25)',
              color: 'var(--ios-blue)',
            }}
          >
            <span style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {totalScore}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
              / {maxScore} {isEn ? 'pts' : '分'}
            </span>
          </div>
        </div>

        {/* 四维素养雷达图与诊断专区 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <RadarChart scores={radarScores} size={300} locale={locale} />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
              }}
            >
              <Icon name="chart" size={16} />
              <span>{isEn ? 'Cognitive Dimensions Quantitative Diagnosis' : '四维素养量化诊断'}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--ios-blue)' }}>{isEn ? '【Knowledge Breadth】' : '【知识广度】'}</span>
                <span>
                  {isEn
                    ? <>Point mastery coverage <strong>{radarScores.breadth}%</strong>. Reflects familiarity across the 107 core syllabus points.</>
                    : <>考点覆盖掌握率 <strong>{radarScores.breadth}%</strong>。反映对中考大纲 107 核心考点的熟悉广度。</>}
                </span>
              </div>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--ios-purple)' }}>{isEn ? '【Deep Insight】' : '【深度洞察】'}</span>
                <span>
                  {isEn
                    ? <>High-order challenge breakthrough rate <strong>{radarScores.insight}%</strong>. Reflects analytical depth in dynamic geometry and complex functions.</>
                    : <>高阶压轴突破率 <strong>{radarScores.insight}%</strong>。反映在动态几何与复杂函数极值中的思维洞察力。</>}
                </span>
              </div>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--ios-amber)' }}>{isEn ? '【Hidden Conditions Discovery】' : '【隐蔽条件发掘】'}</span>
                <span>
                  {isEn
                    ? <>Auxiliary line & implicit condition recognition <strong>{radarScores.hiddenCondition}%</strong>. Tests geometric transformation and structure identification.</>
                    : <>辅助线与隐含条件识别 <strong>{radarScores.hiddenCondition}%</strong>。考查特殊位置构造与图形转化能力。</>}
                </span>
              </div>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--ios-green)' }}>{isEn ? '【Computational Resilience】' : '【计算耐受力】'}</span>
                <span>
                  {isEn
                    ? <>Multi-step operation & radical/fraction accuracy <strong>{radarScores.resilience}%</strong>. Measures error-free rigorous algebraic derivation.</>
                    : <>多步运算与分式根式精准度 <strong>{radarScores.resilience}%</strong>。反映中考解答题多步骤推导无错能力。</>}
                </span>
              </div>
            </div>

            {/* 考完即焚安全提示 */}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 149, 0, 0.08)',
                border: '1px solid rgba(255, 149, 0, 0.25)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <Icon name="alert" size={15} style={{ marginTop: '0.125rem', color: 'var(--ios-amber)', flexShrink: 0 }} />
              <div>
                <strong>{isEn ? '[Iron Rule 2 Zero-Persistence Protection]: ' : '[铁律 2 零持久化保护]：'}</strong>
                {isEn
                  ? 'Mock exam session data and cognitive reports are stored strictly in browser memory. Exiting or refreshing completely burns all records with 0 writes to localStorage or IndexedDB.'
                  : '本次模考过程数据与四维报告仅保留在当前浏览器会话内存中，退出或刷新即彻底焚毁，不向 localStorage / IndexedDB 写入任何痕迹。'}
              </div>
            </div>
          </div>
        </div>

        {/* 操作区 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={onResetExam}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: 'var(--glass-bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <Icon name="refresh" size={14} />
            <span>{isEn ? 'Retake Exam' : '重新作答此卷'}</span>
          </button>
          <button
            type="button"
            onClick={handleBurnAndLeave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: 'var(--ios-red)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 59, 48, 0.3)',
              transition: 'background-color 0.2s',
            }}
          >
            <Icon name="trash" size={14} />
            <span>{isEn ? 'Burn & Leave' : '考完即焚并离开'}</span>
          </button>
        </div>
      </div>

      {/* 逐题深度复盘与踩分点自核区 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
          }}
        >
          <Icon name="edit" size={20} />
          <span>{isEn ? 'Item-by-Item Review & Rubric Self-Assessment' : '逐题深度复盘与解答题踩分自核'}</span>
        </h2>

        {/* 1. 选择题复盘 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3
            style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            {isEn ? `I. Multiple Choice Review (${choiceResults.length} Questions)` : `一、单选题复盘 (${choiceResults.length} 题)`}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {choiceResults.map((r, idx) => (
              <div
                key={r.question.question_id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  backgroundColor: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                      {isEn ? `Question ${idx + 1} · ${r.question.score_default} pts` : `第 ${idx + 1} 题 · ${r.question.score_default}分`}
                    </span>
                    <SourceTag source={r.question.source} exam_year={r.question.exam_year} region={r.question.region} />
                  </div>
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      backgroundColor: r.isCorrect ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                      color: r.isCorrect ? 'var(--ios-green)' : 'var(--ios-red)',
                    }}
                  >
                    {r.isCorrect
                      ? (isEn ? `✓ Full Marks (+${r.score} pts)` : `✓ 满分 (+${r.score}分)`)
                      : (isEn ? '✗ Incorrect (0 pts)' : '✗ 错误 (0分)')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <QuestionContent
                    content={getSafeStem(r.question, isEn)}
                    images={r.question.image_paths_json}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.75rem 1.25rem',
                    backgroundColor: 'var(--glass-bg-card)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    maxWidth: '100%',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{isEn ? 'Your Answer: ' : '您的作答：'}</span>
                    <strong style={{ color: r.isCorrect ? 'var(--ios-green)' : 'var(--ios-red)' }}>
                      <MathRenderer content={r.studentAns || (isEn ? 'Unanswered' : '未作答')} />
                    </strong>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{isEn ? 'Standard Answer: ' : '标准答案：'}</span>
                    <strong style={{ color: 'var(--ios-blue)' }}>
                      <MathRenderer content={r.question.answer_standard || '—'} />
                    </strong>
                  </span>
                </div>
                {!r.isCorrect && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      data-testid={`wrong-q-review-concept-${r.question.question_id}`}
                      onClick={() => handleReviewConcept(r.question.primary_point_id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(0, 122, 255, 0.08)',
                        color: 'var(--ios-blue)',
                        border: '1px solid rgba(0, 122, 255, 0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="book" size={13} />
                      <span>{isEn ? 'Review Concept' : '回看概念精讲'}</span>
                    </button>
                    <button
                      type="button"
                      data-testid={`wrong-q-review-xray-${r.question.question_id}`}
                      onClick={handleReviewXRay}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(175, 82, 222, 0.08)',
                        color: 'var(--ios-purple)',
                        border: '1px solid rgba(175, 82, 222, 0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="search" size={13} />
                      <span>{isEn ? 'Exam Focus X-Ray' : '题眼透视'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. 填空题复盘 (显示 isMathAnswerEquivalent 结果) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3
            style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            {isEn ? `II. Fill-in-the-Blank Equivalence Review (${fillResults.length} Questions)` : `二、填空题等价判分复盘 (${fillResults.length} 题)`}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {fillResults.map((r, idx) => (
              <div
                key={r.question.question_id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  backgroundColor: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                      {isEn ? `Question ${choiceResults.length + idx + 1} · ${r.question.score_default} pts` : `第 ${choiceResults.length + idx + 1} 题 · ${r.question.score_default}分`}
                    </span>
                    <SourceTag source={r.question.source} exam_year={r.question.exam_year} region={r.question.region} />
                  </div>
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      backgroundColor: r.isCorrect
                        ? 'rgba(52, 199, 89, 0.12)'
                        : r.isSuspect
                        ? 'rgba(255, 149, 0, 0.12)'
                        : 'rgba(255, 59, 48, 0.12)',
                      color: r.isCorrect
                        ? 'var(--ios-green)'
                        : r.isSuspect
                        ? 'var(--ios-amber)'
                        : 'var(--ios-red)',
                    }}
                  >
                    {r.isCorrect
                      ? (isEn ? `✓ Equivalent (+${r.score} pts)` : `✓ 数学等价 (+${r.score}分)`)
                      : r.isSuspect
                      ? (isEn ? `? Suspect (+${r.score} pts)` : `? 疑似等价 (+${r.score}分)`)
                      : (isEn ? '✗ Incorrect (0 pts)' : '✗ 答案不符 (0分)')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <QuestionContent
                    content={getSafeStem(r.question, isEn)}
                    images={r.question.image_paths_json}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    backgroundColor: 'var(--glass-bg-card)',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    maxWidth: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>{isEn ? 'Your Fill-in: ' : '您的填空：'}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1, minWidth: 0 }}>
                      <MathRenderer content={r.studentAns || (isEn ? '(Blank)' : '（未填写）')} />
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>{isEn ? 'Standard Answer: ' : '标准答案：'}</span>
                    <span style={{ fontWeight: 600, color: 'var(--ios-blue)', wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1, minWidth: 0 }}>
                      <MathRenderer content={r.standardAns || '—'} />
                    </span>
                  </div>
                </div>
                {!r.isCorrect && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      data-testid={`wrong-q-review-concept-${r.question.question_id}`}
                      onClick={() => handleReviewConcept(r.question.primary_point_id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(0, 122, 255, 0.08)',
                        color: 'var(--ios-blue)',
                        border: '1px solid rgba(0, 122, 255, 0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="book" size={13} />
                      <span>{isEn ? 'Review Concept' : '回看概念精讲'}</span>
                    </button>
                    <button
                      type="button"
                      data-testid={`wrong-q-review-xray-${r.question.question_id}`}
                      onClick={handleReviewXRay}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(175, 82, 222, 0.08)',
                        color: 'var(--ios-purple)',
                        border: '1px solid rgba(175, 82, 222, 0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="search" size={13} />
                      <span>{isEn ? 'Exam Focus X-Ray' : '题眼透视'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. 解答题自核打钩与多解对比 (calculateSolutionScore) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
              }}
            >
              {isEn
                ? `III. Extended Solution Rubric Checklist & Multi-Solutions (${solutionResults.length} Questions)`
                : `三、解答题踩分点自核 (Rubric Checklist) 与多解法 (${solutionResults.length} 题)`}
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--ios-blue)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Icon name="bulb" size={14} />
              <span>{isEn ? 'Review official derivations and check the rubric steps you completed' : '请对照官方推导步骤，勾选您已写出的踩分项自评'}</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {solutionResults.map((r, idx) => (
              <div
                key={r.question.question_id}
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  backgroundColor: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* 题头与得分 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                      {isEn
                        ? `Question ${choiceResults.length + fillResults.length + idx + 1} (Full Score ${r.maxScore} pts)`
                        : `第 ${choiceResults.length + fillResults.length + idx + 1} 题 (满分 ${r.maxScore} 分)`}
                    </span>
                    <SourceTag source={r.question.source} exam_year={r.question.exam_year} region={r.question.region} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{isEn ? 'Self-Score:' : '自核得分:'}</span>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        backgroundColor: 'rgba(0, 122, 255, 0.1)',
                        color: 'var(--ios-blue)',
                        border: '1px solid rgba(0, 122, 255, 0.25)',
                      }}
                    >
                      {r.score} / {r.maxScore} {isEn ? 'pts' : '分'}
                    </span>
                  </div>
                </div>

                {/* 题干 (支持图锚点混合渲染) */}
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  <QuestionContent
                    content={getSafeStem(r.question, isEn)}
                    images={r.question.image_paths_json}
                  />
                </div>

                {/* 学生作答草稿回显 */}
                {r.studentDraft && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--glass-bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>
                      {isEn ? 'Your Exam Derivation Steps:' : '您的考场解答过程：'}
                    </span>
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                      }}
                    >
                      {r.studentDraft}
                    </div>
                  </div>
                )}

                {/* 踩分点自核打钩面板 (Rubric Checklist) */}
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(0, 122, 255, 0.04)',
                    border: '1px solid rgba(0, 122, 255, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--ios-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Icon name="file" size={14} />
                      <span>{isEn ? 'Official Rubric Checklist (Check to add points):' : '中考分步踩分点核对（点击打钩计入总分）：'}</span>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ios-blue)' }}>
                      {isEn ? `${r.checked.size} / ${r.steps.length} steps checked` : `已勾选 ${r.checked.size} / ${r.steps.length} 步`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {r.steps.map((step) => {
                      const isChecked = r.checked.has(step.stepIndex);
                      return (
                        <label
                          key={`step-${step.stepIndex}`}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.625rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: isChecked
                              ? '1px solid rgba(0, 122, 255, 0.35)'
                              : '1px solid var(--border-subtle)',
                            backgroundColor: isChecked
                              ? 'rgba(0, 122, 255, 0.1)'
                              : 'var(--glass-bg-card)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              onStepCheckChange(
                                r.question.question_id,
                                step.stepIndex,
                                e.target.checked
                              )
                            }
                            style={{ marginTop: '0.125rem' }}
                          />
                          <div style={{ flex: 1, fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginRight: '0.5rem' }}>
                              {isEn ? `Step ${step.stepIndex} (+${step.points} pts):` : `步骤 ${step.stepIndex} (+${step.points}分):`}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              <MathRenderer content={(isEn ? (step as any).descriptionEn : step.descriptionZh) || step.descriptionZh} />
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 官方标准答案 (完整换行展示，绝不截断) */}
                {r.question.answer_standard && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--glass-bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      maxWidth: '100%',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--ios-blue)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icon name="check" size={13} />
                      <span>{isEn ? 'Official Standard Answer:' : '官方参考答案：'}</span>
                    </span>
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        lineHeight: 'var(--content-line-height-body, 1.6)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        maxWidth: '100%',
                      }}
                    >
                      <MathRenderer content={r.question.answer_standard} />
                    </div>
                  </div>
                )}

                {/* 官方标准解答与多解法平铺 (PRD §5.4) */}
                {r.question.solutions_json && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--glass-bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Icon name="bulb" size={14} />
                      <span>{isEn ? 'Official Analysis & Derivations:' : '官方解析与标准推导：'}</span>
                    </span>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <SolutionList solutions={r.question.solutions_json} images={r.question.image_paths_json} locale={locale} />
                    </div>
                  </div>
                )}

                {/* Clique 考点组合题穿透反哺双层胶囊 (PRD §5.4) */}
                {r.question.combination_id && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{isEn ? 'Penetration Link:' : '穿透反哺:'}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(0, 122, 255, 0.08)',
                        color: 'var(--ios-blue)',
                        border: '1px solid rgba(0, 122, 255, 0.2)',
                      }}
                    >
                      <Icon name="flask" size={12} />
                      <span>{isEn ? `Foundation: ${r.question.primary_point_id}` : `基础攻坚: ${r.question.primary_point_id}`}</span>
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(175, 82, 222, 0.08)',
                        color: 'var(--ios-purple)',
                        border: '1px solid rgba(175, 82, 222, 0.2)',
                      }}
                    >
                      <Icon name="rocket" size={12} />
                      <span>{isEn ? `Capstone Model: ${r.question.combination_id}` : `压轴模型: ${r.question.combination_id}`}</span>
                    </span>
                  </div>
                )}

                {r.score < r.maxScore && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      data-testid={`wrong-q-review-concept-${r.question.question_id}`}
                      onClick={() => handleReviewConcept(r.question.primary_point_id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(0, 122, 255, 0.08)',
                        color: 'var(--ios-blue)',
                        border: '1px solid rgba(0, 122, 255, 0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="book" size={13} />
                      <span>{isEn ? 'Review Concept' : '回看概念精讲'}</span>
                    </button>
                    <button
                      type="button"
                      data-testid={`wrong-q-review-xray-${r.question.question_id}`}
                      onClick={handleReviewXRay}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(175, 82, 222, 0.08)',
                        color: 'var(--ios-purple)',
                        border: '1px solid rgba(175, 82, 222, 0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="search" size={13} />
                      <span>{isEn ? 'Exam Focus X-Ray' : '题眼透视'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 底部安全呼吸垫片 (彻底消除 TabBar 遮挡) */}
      <div className="bottom-safe-spacer" data-testid="bottom-safe-spacer" />
    </div>
  );
};
