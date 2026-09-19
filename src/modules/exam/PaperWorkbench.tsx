/**
 * 模块四·精准出题中心工作台 (任务 17.1, PRD §5.4, 设计文档 §7.4 子系统 A, 任务 21.3 UI 重做)
 *
 * 核心功能：
 * 1. 满分制一键套用 (100 分标准制 / 120 分中考制 / 150 分大考制) - 3 张可视化卡片
 * 2. 预设卷库选择入口 (难度梯度卷、全真考卷库、6 学期期末标准卷) - 卡片网格布局
 * 3. 自定义组卷工作台 (考点网格复选、学期批处理勾选、L1~L5 难度滑块)
 * 4. 方案 A 库存预警拦截 (实时调用 verifyPaperInventory，库存不足标红并禁用生成按钮)
 * 5. 生成试卷一键直达双栏 A4 打印预览
 * 6. [铁律 3] (全文本走 MathRenderer) + [铁律 10] (iOS 27 设计 tokens) + [铁律 11] (全单色 SVG Icon，零 emoji)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  FullScoreSystem,
  FULL_SCORE_SYSTEMS,
  PRESET_PAPERS,
  PresetPaper,
  ALL_CORE_KP_IDS,
} from './presetPapers';
import {
  PaperConfig,
  verifyPaperInventoryFromPool,
  InventoryCheckResult,
} from './verifyPaperInventory';
import { drawQuestions, drawQuestionsFromDb, GeneratedPaper, QuestionItem } from './drawQuestions';
import { mockExamQuestions } from './mockExamQuestions';
import { PrintLayout } from './PrintLayout';
import { OnlineExam } from './OnlineExam';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { dbClient } from '../../engine/db/dbClient';

// 考点元数据清单 (按学期组织)
interface KpMeta {
  id: string;
  nameZh: string;
  grade: number;
  semester: number;
  line: string;
}

const KP_DIRECTORY: KpMeta[] = [
  { id: 'KP-001', nameZh: '有理数的概念与数轴绝对值', grade: 7, semester: 1, line: 'A1' },
  { id: 'KP-005', nameZh: '有理数加减乘除乘方混合运算', grade: 7, semester: 1, line: 'A1' },
  { id: 'KP-008', nameZh: '整式的加减与同类项合并', grade: 7, semester: 1, line: 'A2' },
  { id: 'KP-009', nameZh: '一元一次方程的解法与应用', grade: 7, semester: 1, line: 'A3' },
  { id: 'KP-010', nameZh: '平行线的判定与性质', grade: 7, semester: 2, line: 'G1' },
  { id: 'KP-012', nameZh: '整式乘法与因式分解', grade: 7, semester: 2, line: 'A2' },
  { id: 'KP-015', nameZh: '全等三角形判定(SAS/ASA/AAS/SSS)', grade: 7, semester: 2, line: 'G2' },
  { id: 'KP-018', nameZh: '轴对称与等腰三角形', grade: 8, semester: 1, line: 'G2' },
  { id: 'KP-020', nameZh: '一次函数的图象与性质', grade: 8, semester: 1, line: 'A4' },
  { id: 'KP-023', nameZh: '勾股定理及其逆定理', grade: 8, semester: 1, line: 'G4' },
  { id: 'KP-024', nameZh: '勾股数与距离公式', grade: 8, semester: 1, line: 'G4' },
  { id: 'KP-028', nameZh: '一元二次方程根与系数关系', grade: 8, semester: 2, line: 'A3' },
  { id: 'KP-030', nameZh: '平行四边形与矩形菱形性质', grade: 8, semester: 2, line: 'G3' },
  { id: 'KP-032', nameZh: '相似三角形判定与性质', grade: 8, semester: 2, line: 'G2' },
  { id: 'KP-035', nameZh: '反比例函数的图象与性质', grade: 8, semester: 2, line: 'A4' },
  { id: 'KP-040', nameZh: '二次函数图象与顶点式', grade: 9, semester: 1, line: 'A4' },
  { id: 'KP-042', nameZh: '解直角三角形与锐角三角函数', grade: 9, semester: 1, line: 'G6' },
  { id: 'KP-045', nameZh: '旋转变换与手拉手模型', grade: 9, semester: 1, line: 'G5' },
  { id: 'KP-050', nameZh: '圆的切线判定与性质', grade: 9, semester: 2, line: 'G4' },
];

export const PaperWorkbench: React.FC = () => {
  // 当前满分制体系 ('100' | '120' | '150')
  const [scoreSystem, setScoreSystem] = useState<FullScoreSystem>('120');

  // 当前勾选的考点集合 (默认全选)
  const [selectedKpIds, setSelectedKpIds] = useState<string[]>(ALL_CORE_KP_IDS);

  // 题目配比 (依据满分制预设初始化，可微调)
  const [customChoiceCount, setCustomChoiceCount] = useState<number>(10);
  const [customFillCount, setCustomFillCount] = useState<number>(6);
  const [customSolutionCount, setCustomSolutionCount] = useState<number>(8);

  // L1~L5 难度滑块权重
  const [diffWeights, setDiffWeights] = useState<[number, number, number, number, number]>([
    25, 30, 25, 15, 5,
  ]);

  // 试卷标题
  const [paperTitle, setPaperTitle] = useState<string>('2024年中考数学全真模拟综合测试卷');

  // 当前选中的预设卷 ID (可选)
  const [activePresetId, setActivePresetId] = useState<string>('PAPER-GRAD-STANDARD');

  // 预设卷分类筛选
  const [presetTab, setPresetTab] = useState<'all' | 'gradient' | 'standard' | 'semester'>('all');

  // 已生成的试卷对象
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);

  // 当前视图模式: 'workbench' | 'print' | 'online_exam'
  const [activeView, setActiveView] = useState<'workbench' | 'print' | 'online_exam'>('workbench');

  // 真库 2064 题目池状态与 107 考点录 (默认 mock 兜底保证首屏即刻可用)
  const [questionPool, setQuestionPool] = useState<QuestionItem[]>(mockExamQuestions);
  const [dbKpDirectory, setDbKpDirectory] = useState<KpMeta[] | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function loadWorkbenchData() {
      try {
        const [questions, kps] = await Promise.all([
          dbClient.query<any>(
            'questions',
            'SELECT question_id, source, exam_year, region, exam_type, grade_level, semester, primary_point_id, combination_id, difficulty_level, question_type, score_default, stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json, image_paths_json FROM questions'
          ),
          dbClient.query<any>(
            'core',
            'SELECT point_id as id, name_zh as nameZh, grade, semester, primary_line_id as line FROM knowledge_points ORDER BY point_id ASC'
          ),
        ]);

        if (!active) return;

        if (questions && questions.length > 0) {
          const mappedQuestions: QuestionItem[] = questions.map((r: any) => ({
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
          }));
          setQuestionPool(mappedQuestions);
        }

        if (kps && kps.length > 0) {
          setDbKpDirectory(kps);
        }
      } catch (err) {
        console.warn('[PaperWorkbench] Failed to load questions/kps from DB, using fallback:', err);
      }
    }
    loadWorkbenchData();
    return () => {
      active = false;
    };
  }, []);

  const effectiveKpDirectory = dbKpDirectory || KP_DIRECTORY;

  // 切换满分制时联动更新题量与分值
  const handleScoreSystemChange = (sys: FullScoreSystem) => {
    setScoreSystem(sys);
    const spec = FULL_SCORE_SYSTEMS[sys];
    setCustomChoiceCount(spec.choiceCount);
    setCustomFillCount(spec.fillCount);
    setCustomSolutionCount(spec.solutionCount);
  };

  // 一键加载预设卷
  const handleSelectPreset = (preset: PresetPaper) => {
    setActivePresetId(preset.id);
    handleScoreSystemChange(preset.scoreSystem);
    setDiffWeights(preset.difficultyDistribution);
    setSelectedKpIds(preset.selectedKpIds);
    setPaperTitle(preset.titleZh);
  };

  // 考点勾选批量辅助
  const toggleKp = (id: string) => {
    setSelectedKpIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const selectAllKps = () => setSelectedKpIds(ALL_CORE_KP_IDS);
  const clearAllKps = () => setSelectedKpIds([]);

  const selectSemesterKps = (grade: number, sem: number) => {
    const semKps = effectiveKpDirectory.filter((k) => k.grade === grade && k.semester === sem).map(
      (k) => k.id
    );
    setSelectedKpIds((prev) => Array.from(new Set([...prev, ...semKps])));
  };

  // 组装当前 PaperConfig
  const currentConfig: PaperConfig = useMemo(() => {
    return {
      selectedKpIds,
      choiceCount: customChoiceCount,
      fillCount: customFillCount,
      solutionCount: customSolutionCount,
      difficultyDistribution: diffWeights,
    };
  }, [selectedKpIds, customChoiceCount, customFillCount, customSolutionCount, diffWeights]);

  // 方案 A 实时库存校验 (基于题库真实数据池)
  const inventoryResult: InventoryCheckResult = useMemo(() => {
    return verifyPaperInventoryFromPool(questionPool, currentConfig);
  }, [questionPool, currentConfig]);

  // 筛选预设卷
  const filteredPresets = useMemo(() => {
    if (presetTab === 'all') return PRESET_PAPERS;
    return PRESET_PAPERS.filter((p) => p.category === presetTab);
  }, [presetTab]);

  // 点击生成试卷 (A4 打印预览，优先异步走 questions.db 真库)
  const handleGeneratePaper = async () => {
    if (!inventoryResult.canGenerate || isGenerating) return;
    setIsGenerating(true);

    const spec = FULL_SCORE_SYSTEMS[scoreSystem];
    try {
      const paper = await drawQuestionsFromDb(dbClient, currentConfig, {
        titleZh: paperTitle,
        fullScore: spec.totalScore,
        timeLimitMinutes: spec.timeLimitMinutes,
      });
      setGeneratedPaper(paper);
      setActiveView('print');
    } catch {
      const paper = drawQuestions(questionPool, currentConfig, {
        titleZh: paperTitle,
        fullScore: spec.totalScore,
        timeLimitMinutes: spec.timeLimitMinutes,
      });
      setGeneratedPaper(paper);
      setActiveView('print');
    } finally {
      setIsGenerating(false);
    }
  };

  // 点击开启在线全真测评 (优先异步走 questions.db 真库)
  const handleStartOnlineExam = async () => {
    if (!inventoryResult.canGenerate || isGenerating) return;
    setIsGenerating(true);

    const spec = FULL_SCORE_SYSTEMS[scoreSystem];
    try {
      const paper = await drawQuestionsFromDb(dbClient, currentConfig, {
        titleZh: paperTitle,
        fullScore: spec.totalScore,
        timeLimitMinutes: spec.timeLimitMinutes,
      });
      setGeneratedPaper(paper);
      setActiveView('online_exam');
    } catch {
      const paper = drawQuestions(questionPool, currentConfig, {
        titleZh: paperTitle,
        fullScore: spec.totalScore,
        timeLimitMinutes: spec.timeLimitMinutes,
      });
      setGeneratedPaper(paper);
      setActiveView('online_exam');
    } finally {
      setIsGenerating(false);
    }
  };

  // 若已生成试卷，按视图模式渲染对应界面
  if (generatedPaper && activeView === 'online_exam') {
    return (
      <OnlineExam
        paper={generatedPaper}
        onBackToWorkbench={() => {
          setGeneratedPaper(null);
          setActiveView('workbench');
        }}
      />
    );
  }

  if (generatedPaper && activeView === 'print') {
    return (
      <PrintLayout
        paper={generatedPaper}
        onBackToWorkbench={() => {
          setGeneratedPaper(null);
          setActiveView('workbench');
        }}
      />
    );
  }

  const spec = FULL_SCORE_SYSTEMS[scoreSystem];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        fontFamily: 'var(--font-family-system)',
      }}
    >
      {/* 头部导航与满分制 3 卡片体系选择器 */}
      <div
        style={{
          padding: '24px 28px',
          borderRadius: 'var(--radius-lg, 22px)',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--ios-blue)',
                border: '1px solid rgba(0, 122, 255, 0.2)',
                marginBottom: '0.5rem',
              }}
            >
              <Icon name="target" size={14} />
              <span>百炼成钢 · 实战测评</span>
              <span style={{ opacity: 0.6 }}>|</span>
              <span>精准出题中心</span>
            </div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: '0.25rem 0',
              }}
            >
              中考实战与全真组卷工作台
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              一键套用满分制与预设卷库 · 方案 A 实时题库库存校验 · 环保双栏 A4 印刷排版
            </p>
          </div>
        </div>

        {/* 满分制体系选择：3 张高品质产品卡片 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Icon name="settings" size={14} />
              满分制标准套用（严格遵照 PRD §5.4 题量与分值模型）
            </span>
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>点击切换满分制及题型标准预设</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {(['100', '120', '150'] as FullScoreSystem[]).map((sys) => {
              const isCur = scoreSystem === sys;
              const s = FULL_SCORE_SYSTEMS[sys];
              const badgeText =
                sys === '120' ? '省市中考主流' : sys === '100' ? '学期期末标准' : '自招与拔高大考';

              return (
                <div
                  key={sys}
                  onClick={() => handleScoreSystemChange(sys)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: isCur ? '2px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                    backgroundColor: isCur ? 'rgba(0, 122, 255, 0.08)' : 'var(--glass-bg-card)',
                    boxShadow: isCur ? '0 4px 14px rgba(0, 122, 255, 0.15)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '1rem',
                          height: '1rem',
                          borderRadius: '50%',
                          border: isCur ? '2px solid var(--ios-blue)' : '2px solid var(--border-subtle)',
                          backgroundColor: isCur ? 'var(--ios-blue)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isCur && (
                          <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {`${sys}分制`}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: isCur ? 'var(--ios-blue)' : 'var(--border-subtle)',
                        color: isCur ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0.75rem 0', fontWeight: 500 }}>
                    {s.nameZh} · 限时 {s.timeLimitMinutes} 分钟
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.375rem',
                      textAlign: 'center',
                      fontSize: '0.6875rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ padding: '0.375rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>选择题</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.choiceCount} 题 ({s.choiceTotalScore}分)
                      </span>
                    </div>
                    <div style={{ padding: '0.375rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>填空题</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.fillCount} 题 ({s.fillTotalScore}分)
                      </span>
                    </div>
                    <div style={{ padding: '0.375rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ display: 'block', fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>解答题</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.solutionCount} 题 ({s.solutionTotalScore}分)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 快捷选卷预设卷库 */}
      <div
        style={{
          padding: '24px 28px',
          borderRadius: 'var(--radius-lg, 22px)',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Icon name="bolt" size={18} style={{ color: 'var(--ios-amber)' }} />
            快速选卷 · 预设卷库 (包含梯度卷、全真卷与 6 学期期末卷)
          </h2>

          {/* 分类切换药丸按钮 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--glass-bg-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {[
              { key: 'all', label: '全部预设' },
              { key: 'gradient', label: '难度梯度卷' },
              { key: 'standard', label: '全真中考卷' },
              { key: 'semester', label: '期末综合卷' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPresetTab(tab.key as any)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: 'none',
                  backgroundColor: presetTab === tab.key ? 'var(--ios-blue)' : 'transparent',
                  color: presetTab === tab.key ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 预设试卷卡片网格 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredPresets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '2px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.08)' : 'var(--glass-bg-card)',
                  boxShadow: isSelected ? '0 4px 12px rgba(0, 122, 255, 0.12)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div
                        style={{
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isSelected ? 'var(--ios-blue)' : 'var(--glass-bg)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name={preset.icon} size={16} />
                      </div>
                      <h3
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {preset.titleZh}
                      </h3>
                    </div>
                    <span
                      style={{
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        backgroundColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preset.scoreSystem}分制
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      margin: '0.5rem 0 0.75rem 0',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {preset.descriptionZh}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.6875rem',
                  }}
                >
                  <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Icon name="book" size={12} />
                    考点数: {preset.selectedKpIds.length} 个
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 122, 255, 0.1)',
                      color: 'var(--ios-blue)',
                    }}
                  >
                    {preset.difficultyTagZh}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 自定义工作台配置区 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* 左侧：考点细粒度复选 */}
        <div
          style={{
            flex: '1 1 580px',
            minWidth: '320px',
            padding: '24px 28px',
            borderRadius: 'var(--radius-lg, 22px)',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Icon name="book" size={18} style={{ color: 'var(--ios-blue)' }} />
              考点细粒度复选 (已选 {selectedKpIds.length} / {ALL_CORE_KP_IDS.length})
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
              <button
                onClick={selectAllKps}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  color: 'var(--ios-blue)',
                  border: '1px solid rgba(0, 122, 255, 0.25)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                全选
              </button>
              <button
                onClick={clearAllKps}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--glass-bg-card)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                清空
              </button>
              <span style={{ color: 'var(--border-subtle)', margin: '0 0.125rem' }}>|</span>
              {[
                { g: 7, s: 1, name: '七上' },
                { g: 7, s: 2, name: '七下' },
                { g: 8, s: 1, name: '八上' },
                { g: 8, s: 2, name: '八下' },
                { g: 9, s: 1, name: '九上' },
                { g: 9, s: 2, name: '九下' },
              ].map((term) => (
                <button
                  key={term.name}
                  onClick={() => selectSemesterKps(term.g, term.s)}
                  style={{
                    padding: '0.375rem 0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--glass-bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  +{term.name}
                </button>
              ))}
            </div>
          </div>

          {/* 考点复选卡片网格 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.75rem',
              maxHeight: '420px',
              overflowY: 'auto',
              paddingRight: '0.25rem',
            }}
          >
            {effectiveKpDirectory.map((kp) => {
              const checked = selectedKpIds.includes(kp.id);
              return (
                <div
                  key={kp.id}
                  onClick={() => toggleKp(kp.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: checked ? '1px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                    backgroundColor: checked ? 'rgba(0, 122, 255, 0.08)' : 'var(--glass-bg-card)',
                    color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    userSelect: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    style={{ marginTop: '0.125rem', cursor: 'pointer' }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {kp.grade}{kp.semester === 1 ? 'A' : 'B'}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: 'var(--ios-blue)', fontFamily: 'monospace', fontWeight: 600 }}>
                        {kp.line}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: '0.25rem 0 0 0',
                        color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {kp.nameZh}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：题型配置与难度滑块 */}
        <div style={{ flex: '1 1 340px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 题型与分值参数 */}
          <div
            style={{
              padding: '24px 28px',
              borderRadius: 'var(--radius-lg, 22px)',
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Icon name="settings" size={18} />
              题型题量与分值配置
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>选择题</span>
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', margin: '0.125rem 0 0 0' }}>
                    单选 · 每题 {spec.choiceTotalScore / spec.choiceCount} 分
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={customChoiceCount}
                    onChange={(e) => setCustomChoiceCount(parseInt(e.target.value) || 0)}
                    style={{
                      width: '4rem',
                      padding: '0.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>题</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>填空题</span>
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', margin: '0.125rem 0 0 0' }}>
                    填空 · 每题 {spec.fillTotalScore / spec.fillCount} 分
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={customFillCount}
                    onChange={(e) => setCustomFillCount(parseInt(e.target.value) || 0)}
                    style={{
                      width: '4rem',
                      padding: '0.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>题</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--glass-bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>解答题</span>
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', margin: '0.125rem 0 0 0' }}>
                    综合证明与大题 · 共 {spec.solutionTotalScore} 分
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={customSolutionCount}
                    onChange={(e) => setCustomSolutionCount(parseInt(e.target.value) || 0)}
                    style={{
                      width: '4rem',
                      padding: '0.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>题</span>
                </div>
              </div>
            </div>
          </div>

          {/* L1~L5 难度滑块 */}
          <div
            style={{
              padding: '24px 28px',
              borderRadius: 'var(--radius-lg, 22px)',
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontSize: '0.75rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="chart" size={18} style={{ color: 'var(--ios-purple)' }} />
                L1~L5 难度梯度占比
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ios-blue)', fontFamily: 'monospace', fontWeight: 700 }}>
                Σ={diffWeights.reduce((a, b) => a + b, 0)}%
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { label: 'L1 基础概念', idx: 0 },
                { label: 'L2 核心巩固', idx: 1 },
                { label: 'L3 综合拔高', idx: 2 },
                { label: 'L4 分类培优', idx: 3 },
                { label: 'L5 中考压轴', idx: 4 },
              ].map(({ label, idx }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    <span>{label}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {diffWeights[idx]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={diffWeights[idx]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const next = [...diffWeights] as [number, number, number, number, number];
                      next[idx] = val;
                      setDiffWeights(next);
                    }}
                    style={{
                      width: '100%',
                      accentColor: 'var(--ios-blue)',
                      cursor: 'pointer',
                      height: '0.375rem',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 方案 A 库存校验与生成行动栏 */}
      <div
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          border: inventoryResult.canGenerate ? '1px solid rgba(52, 199, 89, 0.4)' : '1px solid rgba(255, 59, 48, 0.4)',
          backgroundColor: inventoryResult.canGenerate ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 59, 48, 0.08)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon
              name={inventoryResult.canGenerate ? 'check' : 'alert'}
              size={22}
              style={{ color: inventoryResult.canGenerate ? 'var(--ios-green)' : 'var(--ios-red)' }}
            />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {inventoryResult.canGenerate
                ? '题库库存充足 · 满足出题要求'
                : '题库库存预警 · 无法生成试卷 (方案 A 拦截)'}
            </h3>
          </div>

          {/* 提示文案通过 MathRenderer 渲染 (铁律 3) */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {inventoryResult.canGenerate ? (
              <p style={{ margin: 0 }}>
                所选考点内可用真题总数：{inventoryResult.totalAvailable} 题（选择 {inventoryResult.availableChoice}/{inventoryResult.requiredChoice}，填空 {inventoryResult.availableFill}/{inventoryResult.requiredFill}，解答 {inventoryResult.availableSolution}/{inventoryResult.requiredSolution}）。
              </p>
            ) : (
              <div style={{ color: 'var(--ios-red)', fontWeight: 500 }}>
                <MathRenderer content={inventoryResult.shortageWarningZh || ''} />
              </div>
            )}
          </div>
        </div>

        {/* 按钮组 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* 生成试卷按钮 (库存不足时禁用，满足 Property 16) */}
          <button
            disabled={!inventoryResult.canGenerate}
            onClick={handleGeneratePaper}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 800,
              fontSize: '0.8125rem',
              backgroundColor: inventoryResult.canGenerate ? 'var(--glass-bg-card)' : 'var(--border-subtle)',
              color: inventoryResult.canGenerate ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: '1px solid var(--border-subtle)',
              cursor: inventoryResult.canGenerate ? 'pointer' : 'not-allowed',
              boxShadow: inventoryResult.canGenerate ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Icon name="print" size={16} />
            <span>生成中考全真模拟试卷 (A4双栏排版)</span>
          </button>

          {/* 开启全真在线测评按钮 */}
          <button
            disabled={!inventoryResult.canGenerate}
            onClick={handleStartOnlineExam}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 800,
              fontSize: '0.8125rem',
              backgroundColor: inventoryResult.canGenerate ? 'var(--ios-blue)' : 'var(--border-subtle)',
              color: inventoryResult.canGenerate ? '#ffffff' : 'var(--text-tertiary)',
              border: 'none',
              cursor: inventoryResult.canGenerate ? 'pointer' : 'not-allowed',
              boxShadow: inventoryResult.canGenerate ? '0 4px 12px rgba(0, 122, 255, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Icon name="rocket" size={16} />
            <span>开启在线全真测评 (限时答题)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
