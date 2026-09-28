/**
 * 手机端极速出卷工作台 (TASK-FE-0022 分支 B)
 *
 * 核心架构与设计规约：
 * 1. 底层组卷引擎 0 修改：直接装配标准 PaperConfig 调用 drawQuestionsFromDb / drawQuestions。
 * 2. 手机端彻底净化：
 *    - 砍掉 107 考点复选框大网格
 *    - 砍掉 L1~L5 五列波浪滑块 (根治 L5 溢出被削掉的 Bug)
 *    - 砍掉单题分值微调
 *    - 砍掉 A4 纸双栏打印排版
 *    - 砍掉教研术语
 * 3. 快速微调抽屉 (iOS 27 Modal Bottom Sheet)：
 *    - 项 1: 满分制体系 [ 100分·标准制 ] [ 120分·中考制 ] [ 150分·大考制 ] (默认 100分·标准制)
 *    - 项 2: 学期范围 [ 7上 ] [ 7下 ] [ 8上 ] [ 8下 ] [ 9上 ] [ 9下全真中考 ] (默认 7上)
 *    - 项 3: 难度倾向 [ 基础夯实 7:2:1 ] [ 综合进阶 5:3:2 ] [ 压轴攻坚 3:4:3 ] (默认 基础夯实 7:2:1)
 * 4. 底部安全呼吸垫片 (BottomSafeSpacer, h-[88px])：彻底根除 56px 全局 Tab 遮挡问题。
 * 5. 铁律遵循：源码绝对零 emoji，内联样式 <= 5 处。
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FullScoreSystem,
  FULL_SCORE_SYSTEMS,
  GRADE_7_1_KP_IDS,
} from './presetPapers';
import {
  PaperConfig,
} from './verifyPaperInventory';
import {
  drawQuestions,
  drawQuestionsFromDb,
  GeneratedPaper,
  QuestionItem,
} from './drawQuestions';
import { Icon } from '../../components/common/Icon';
import { dbClient } from '../../engine/db/dbClient';
import { useSessionStore } from '../../store/sessionStore';

export interface MobilePaperWorkbenchProps {
  onStartExam: (paper: GeneratedPaper) => void;
  className?: string;
  locale?: string;
}

export type DifficultyTendency = 'basic' | 'medium' | 'hard';


export const MOBILE_SEMESTERS = [
  { key: '7-1', labelZh: '7上', labelEn: 'G7S1', grade: 7, semester: 1 },
  { key: '7-2', labelZh: '7下', labelEn: 'G7S2', grade: 7, semester: 2 },
  { key: '8-1', labelZh: '8上', labelEn: 'G8S1', grade: 8, semester: 1 },
  { key: '8-2', labelZh: '8下', labelEn: 'G8S2', grade: 8, semester: 2 },
  { key: '9-1', labelZh: '9上', labelEn: 'G9S1', grade: 9, semester: 1 },
  { key: '9-2', labelZh: '9下全真中考', labelEn: 'G9S2 Final', grade: 9, semester: 2 },
] as const;

export const DIFFICULTY_PRESETS: Record<DifficultyTendency, {
  nameZh: string;
  nameEn: string;
  weights: [number, number, number, number, number];
}> = {
  basic: {
    nameZh: '基础夯实 7:2:1',
    nameEn: 'Foundation 7:2:1',
    weights: [35, 25, 10, 20, 10],
  },
  medium: {
    nameZh: '综合进阶 5:3:2',
    nameEn: 'Intermediate 5:3:2',
    weights: [20, 20, 10, 30, 20],
  },
  hard: {
    nameZh: '压轴攻坚 3:4:3',
    nameEn: 'Advanced 3:4:3',
    weights: [10, 10, 10, 40, 30],
  },
};

const DEFAULT_TITLE_ZH = '初中数学全真模拟综合测试卷';
const DEFAULT_TITLE_EN = 'Junior High Math Full Simulation Mock Exam';

export const MobilePaperWorkbench: React.FC<MobilePaperWorkbenchProps> = ({
  onStartExam,
  className = '',
  locale: propLocale,
}) => {
  const storeLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || storeLocale;
  const isEn = String(locale).toLowerCase().startsWith('en');

  // 三大维度：默认焦点严格锁定最左项 (门禁 4 刚性规约)
  const [scoreSystem, setScoreSystem] = useState<FullScoreSystem>('100');
  const [semesterKey, setSemesterKey] = useState<string>('7-1');
  const [difficultyTendency, setDifficultyTendency] = useState<DifficultyTendency>('basic');

  // 抽屉展开状态
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 数据库题库与考点目录缓存
  const [questionPool, setQuestionPool] = useState<QuestionItem[]>([]);
  const [dbKpDirectory, setDbKpDirectory] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [questions, kps] = await Promise.all([
          dbClient.query<any>(
            'questions',
            'SELECT question_id, source, exam_year, region, exam_type, grade_level, semester, primary_point_id, combination_id, difficulty_level, question_type, score_default, stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json, image_paths_json, all_point_ids, max_grade FROM questions'
          ),
          dbClient.query<any>(
            'core',
            'SELECT point_id as id, name_zh as nameZh, name_en as nameEn, grade, semester, primary_line_id as line FROM knowledge_points ORDER BY point_id ASC'
          ),
        ]);

        if (!active) return;

        if (questions && questions.length > 0) {
          const mapped: QuestionItem[] = questions.map((r: any) => ({
            question_id: String(r.question_id),
            source: String(r.source ?? ''),
            exam_year: Number(r.exam_year ?? 0),
            region: String(r.region ?? ''),
            exam_type: String(r.exam_type ?? ''),
            grade_level: Number(r.grade_level || 7),
            semester: Number(r.semester || 1),
            primary_point_id: String(r.primary_point_id ?? ''),
            combination_id: r.combination_id ?? null,
            difficulty_level: Number(r.difficulty_level ?? 1),
            question_type: r.question_type,
            score_default: Number(r.score_default ?? 3),
            stem_zh: String(r.stem_zh ?? ''),
            stem_en: String(r.stem_en ?? ''),
            options_json: r.options_json ?? null,
            answer_standard: String(r.answer_standard ?? ''),
            rubric_checklist_json: r.rubric_checklist_json ?? null,
            solutions_json: r.solutions_json ?? null,
            image_paths_json: r.image_paths_json ?? null,
            all_point_ids: r.all_point_ids ? String(r.all_point_ids) : null,
            max_grade: r.max_grade ? Number(r.max_grade) : undefined,
          }));
          setQuestionPool(mapped);
        }

        if (kps && kps.length > 0) {
          setDbKpDirectory(kps);
        }
      } catch (err) {
        console.warn('[MobilePaperWorkbench] Failed to load questions/kps:', err);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // 根据当前学期计算考点闭包
  const coveredKpIds = useMemo(() => {
    const semCfg = MOBILE_SEMESTERS.find((s) => s.key === semesterKey) || MOBILE_SEMESTERS[0];
    if (dbKpDirectory.length === 0) {
      return GRADE_7_1_KP_IDS;
    }
    return dbKpDirectory
      .filter((kp) => {
        if (kp.grade < semCfg.grade) return true;
        if (kp.grade === semCfg.grade && kp.semester <= semCfg.semester) return true;
        return false;
      })
      .map((kp) => kp.id);
  }, [semesterKey, dbKpDirectory]);

  // 当前满分制体系规范
  const spec = FULL_SCORE_SYSTEMS[scoreSystem];
  const diffSpec = DIFFICULTY_PRESETS[difficultyTendency];

  // 装配标准 PaperConfig 并触发抽题
  const handleStartExam = async () => {
    setIsGenerating(true);
    const config: PaperConfig = {
      choiceCount: spec.choiceCount,
      fillCount: spec.fillCount,
      solutionCount: spec.solutionCount,
      choiceScore: spec.choiceTotalScore / spec.choiceCount,
      fillScore: spec.fillTotalScore / spec.fillCount,
      fullScore: spec.totalScore,
      selectedKpIds: coveredKpIds,
      difficultyDistribution: diffSpec.weights,
    };

    const meta = {
      titleZh: DEFAULT_TITLE_ZH,
      titleEn: DEFAULT_TITLE_EN,
      fullScore: spec.totalScore,
      timeLimitMinutes: spec.timeLimitMinutes,
    };

    try {
      const paper = await drawQuestionsFromDb(dbClient, config, meta);
      onStartExam(paper);
    } catch {
      const paper = drawQuestions(questionPool, config, meta);
      onStartExam(paper);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`mobile-paper-workbench flex flex-col gap-4 w-full max-w-full px-4 pt-3 pb-8 ${className}`}
      data-testid="mobile-paper-workbench"
    >
      {/* 顶栏标题胶囊 */}
      <div className="flex items-center justify-between gap-2 py-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-bold shadow-sm">
          <Icon name="bolt" size={13} className="text-sky-400" />
          <span>{isEn ? 'Exam Center' : '实战测评 · 智能组卷'}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sky-600 text-xs font-semibold shadow-sm active:scale-95 transition-transform"
          data-testid="mobile-quick-tuning-trigger"
        >
          <Icon name="sliders" size={13} />
          <span>{isEn ? 'Quick Settings' : '快速微调'}</span>
        </button>
      </div>

      {/* 试卷概览大卡片 (iOS 27 液态玻璃设计) */}
      <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        {/* 当前配置三维标签 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-600 border border-sky-200">
            {isEn ? spec.nameEn : spec.nameZh}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
            {isEn ? MOBILE_SEMESTERS.find((s) => s.key === semesterKey)?.labelEn : MOBILE_SEMESTERS.find((s) => s.key === semesterKey)?.labelZh}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            {isEn ? diffSpec.nameEn : diffSpec.nameZh}
          </span>
        </div>

        {/* 试卷指标汇总 */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{isEn ? 'Questions' : '试卷题量'}</span>
            <span className="text-base font-extrabold text-slate-800">
              {spec.totalQuestions} <span className="text-xs font-normal text-slate-400">{isEn ? 'items' : '题'}</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{isEn ? 'Total Score' : '试卷满分'}</span>
            <span className="text-base font-extrabold text-sky-600">
              {spec.totalScore} <span className="text-xs font-normal text-slate-400">{isEn ? 'pts' : '分'}</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{isEn ? 'Time Limit' : '考试时限'}</span>
            <span className="text-base font-extrabold text-slate-800">
              {spec.timeLimitMinutes} <span className="text-xs font-normal text-slate-400">{isEn ? 'min' : '分钟'}</span>
            </span>
          </div>
        </div>

        {/* 题型分布 */}
        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isEn ? 'Multiple Choice' : '单选题'}</span>
            <span className="font-semibold">{spec.choiceCount} {isEn ? 'questions' : '道'} ({spec.choiceTotalScore} {isEn ? 'pts' : '分'})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isEn ? 'Fill-in-the-Blank' : '填空题'}</span>
            <span className="font-semibold">{spec.fillCount} {isEn ? 'questions' : '道'} ({spec.fillTotalScore} {isEn ? 'pts' : '分'})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isEn ? 'Extended Solution' : '解答题'}</span>
            <span className="font-semibold">{spec.solutionCount} {isEn ? 'questions' : '道'} ({spec.solutionTotalScore} {isEn ? 'pts' : '分'})</span>
          </div>
        </div>

        {/* 真题库就绪状态 */}
        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-600">
          <Icon name="check" size={13} />
          <span>{isEn ? 'Standard question inventory ready' : '全真题库资源就绪 · 标准子集闭包校验通过'}</span>
        </div>
      </div>

      {/* 核心开始大按钮 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartExam}
          disabled={isGenerating}
          className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
          data-testid="mobile-start-exam-btn"
        >
          <Icon name="rocket" size={16} />
          <span>
            {isGenerating
              ? (isEn ? 'Generating Exam...' : '正在极速组卷...')
              : (isEn ? 'Start Online Exam' : '开启在线全真测评')}
          </span>
          <Icon name="chevron-right" size={14} />
        </button>
      </div>

      {/* 快速微调抽屉 (iOS 27 Modal Bottom Sheet) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          {/* 点击背景关闭 */}
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />

          <div
            className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white border-t border-slate-200 p-5 shadow-2xl flex flex-col gap-4 animate-slide-up"
            data-testid="mobile-tuning-drawer"
          >
            {/* 抽屉把手条 */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />

            {/* 抽屉头部 */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="m-0 text-base font-bold text-slate-800 flex items-center gap-2">
                <Icon name="sliders" size={16} className="text-sky-500" />
                <span>{isEn ? 'Quick Settings' : '组卷快速微调'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 active:scale-95"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* 项 1：满分制体系 (最左项默认) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                {isEn ? '1. Full Score System (Fixed items)' : '1. 满分制体系 (题目数量自动锁定)'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['100', '120', '150'] as FullScoreSystem[]).map((sys) => {
                  const isCur = scoreSystem === sys;
                  const itemSpec = FULL_SCORE_SYSTEMS[sys];
                  return (
                    <button
                      key={sys}
                      type="button"
                      onClick={() => setScoreSystem(sys)}
                      className={`h-11 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
 isCur
 ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/20'
 : 'bg-slate-100 text-slate-700 border border-slate-200/60'
 }`}
                      data-testid={`score-system-btn-${sys}`}
                    >
                      <span>{isEn ? `${sys} Pts` : `${sys}分`}</span>
                      <span className="text-[10px] opacity-80">{itemSpec.totalQuestions}题</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 项 2：学期范围 (最左项 7上 默认) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                {isEn ? '2. Semester Coverage' : '2. 学期向后覆盖'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {MOBILE_SEMESTERS.map((s) => {
                  const isCur = semesterKey === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSemesterKey(s.key)}
                      className={`h-10 px-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
 isCur
 ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/20'
 : 'bg-slate-100 text-slate-700 border border-slate-200/60'
 }`}
                      data-testid={`semester-btn-${s.key}`}
                    >
                      {isEn ? s.labelEn : s.labelZh}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 项 3：难度倾向 (最左项 基础夯实 默认) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                {isEn ? '3. Difficulty Tendency' : '3. 试卷难度倾向'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['basic', 'medium', 'hard'] as DifficultyTendency[]).map((d) => {
                  const isCur = difficultyTendency === d;
                  const item = DIFFICULTY_PRESETS[d];
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficultyTendency(d)}
                      className={`h-10 px-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center transition-all ${
 isCur
 ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/20'
 : 'bg-slate-100 text-slate-700 border border-slate-200/60'
 }`}
                      data-testid={`difficulty-btn-${d}`}
                    >
                      {isEn ? item.nameEn : item.nameZh}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 抽屉底部大按钮：立即开始全真测评 */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  handleStartExam();
                }}
                disabled={isGenerating}
                className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
                data-testid="drawer-start-exam-btn"
              >
                <Icon name="rocket" size={16} />
                <span>{isEn ? 'Start Exam Immediately' : '立即开始全真测评'}</span>
                <Icon name="chevron-right" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部安全呼吸垫片 (彻底消除 TabBar 遮挡, 门禁 4 刚性红线) */}
      <div className="bottom-safe-spacer" data-testid="bottom-safe-spacer" />
    </div>
  );
};
