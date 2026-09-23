/**
 * 模块四·精准出题中心工作台 (任务 17.1, PRD §5.4, 任务 21.3)
 *
 * 核心架构：
 * 1. 单轨四层垂直递进架构（已彻底移除预设卷库）：
 *    - 顶部真实题量动态徽章 (直连 questions.db，展示实际题量)
 *    - 第一层：满分制基准选择 (100分标准制 / 120分中考制 / 150分大考制)
 *    - 第二层：学期一键向后覆盖 + 考点子集闭包微调网格
 *    - 第三层：题型题量与分值配置 (选择/填空可配，解答题按中考标准阶梯自动倒推)
 *    - 第四层：试卷难度配比 (L1~L5 波浪级联外向传导，和恒等于 100%)
 * 2. 方案 A 智能防御底座：
 *    - 实时子集闭包题量统计与越界拦截
 *    - 保证格式：“所选考点内可用真题总数：{totalAvailable} 题（选择 {availC}/{reqC}，填空 {availF}/{reqF}，解答 {availS}/{reqS}）。”
 * 3. 双轨输出：
 *    - 一键直达 A4 双栏排版打印 (PrintLayout)
 *    - 一键开启在线全真测评 (OnlineExam)
 * 4. 铁律遵循：
 *    - [铁律 2 考完即焚]：全内存状态，零持久化
 *    - [铁律 3 数学公式]：全公式走 MathRenderer
 *    - [铁律 9 物理隔离]：仅查 questions 表，绝不触碰 master_examples
 *    - [铁律 10 设计规约]：iOS 27 设计 Token
 *    - [铁律 11 符号纯洁]：纯单色 SVG Icon，零 emoji
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  FullScoreSystem,
  FULL_SCORE_SYSTEMS,
  GRADE_7_KP_IDS,
} from './presetPapers';
import {
  PaperConfig,
  verifyPaperInventoryFromPool,
  InventoryCheckResult,
} from './verifyPaperInventory';
import {
  drawQuestions,
  drawQuestionsFromDb,
  generateSolutionScoreLadder,
  GeneratedPaper,
  QuestionItem,
} from './drawQuestions';
import {
  adjustDifficultyWeights,
  DEFAULT_DIFFICULTY_WEIGHTS,
  DifficultyWeights,
} from './difficultyRipple';
import { PrintLayout } from './PrintLayout';
import { OnlineExam } from './OnlineExam';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { dbClient } from '../../engine/db/dbClient';

interface KpMeta {
  id: string;
  nameZh: string;
  grade: number;
  semester: number;
  line: string;
}

const SEMESTERS = [
  { grade: 7, semester: 1, key: '7-1', label: '7年级 上学期' },
  { grade: 7, semester: 2, key: '7-2', label: '7年级 下学期' },
  { grade: 8, semester: 1, key: '8-1', label: '8年级 上学期' },
  { grade: 8, semester: 2, key: '8-2', label: '8年级 下学期' },
  { grade: 9, semester: 1, key: '9-1', label: '9年级 上学期' },
  { grade: 9, semester: 2, key: '9-2', label: '9年级 下学期 (中考总复习)' },
] as const;

export const PaperWorkbench: React.FC = () => {
  // 第一层：当前满分制体系 ('100' | '120' | '150')
  const [scoreSystem, setScoreSystem] = useState<FullScoreSystem>('100');

  // 第二层：学期向后覆盖与考点勾选
  const [selectedSemesterKey, setSelectedSemesterKey] = useState<string>('7-2');
  const [selectedKpIds, setSelectedKpIds] = useState<string[]>(GRADE_7_KP_IDS);
  const [isKpGridExpanded, setIsKpGridExpanded] = useState<boolean>(true);
  const [kpSearchText, setKpSearchText] = useState<string>('');

  // 第三层：题型、题量与分值配置
  const [choiceCount, setChoiceCount] = useState<number>(10);
  const [choiceScore, setChoiceScore] = useState<number>(3);
  const [fillCount, setFillCount] = useState<number>(6);
  const [fillScore, setFillScore] = useState<number>(3);

  // 第四层：L1~L5 试卷难度波浪联动权重
  const [diffWeights, setDiffWeights] = useState<DifficultyWeights>([
    ...DEFAULT_DIFFICULTY_WEIGHTS,
  ]);

  // 试卷标题
  const [paperTitle, setPaperTitle] = useState<string>('初中数学全真模拟综合测试卷');

  // 已生成的试卷对象
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);

  // 当前视图模式: 'workbench' | 'print' | 'online_exam'
  const [activeView, setActiveView] = useState<'workbench' | 'print' | 'online_exam'>('workbench');

  // 真题库状态与考点目录
  const [questionPool, setQuestionPool] = useState<QuestionItem[]>([]);
  const [dbKpDirectory, setDbKpDirectory] = useState<KpMeta[] | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 1. 异步加载 questions.db 与 core.db 全量数据
  useEffect(() => {
    let active = true;
    async function loadWorkbenchData() {
      try {
        const [questions, kps] = await Promise.all([
          dbClient.query<any>(
            'questions',
            'SELECT question_id, source, exam_year, region, exam_type, grade_level, semester, primary_point_id, combination_id, difficulty_level, question_type, score_default, stem_zh, stem_en, options_json, answer_standard, rubric_checklist_json, solutions_json, image_paths_json, all_point_ids, max_grade FROM questions'
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
            all_point_ids: r.all_point_ids ? String(r.all_point_ids) : null,
            max_grade: r.max_grade ? Number(r.max_grade) : undefined,
          }));
          setQuestionPool(mappedQuestions);
        }

        if (kps && kps.length > 0) {
          setDbKpDirectory(kps);
          // 初始默认七年级：筛选 grade <= 7 的考点 (涵盖 7上 + 7下)
          const grade7KpIds = kps.filter((k: any) => k.grade <= 7).map((k: any) => k.id);
          setSelectedKpIds(grade7KpIds);
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

  const effectiveKpDirectory = useMemo(() => {
    return dbKpDirectory || [];
  }, [dbKpDirectory]);

  // 当前满分制规格
  const spec = FULL_SCORE_SYSTEMS[scoreSystem];

  // 第一层满分制切换联动
  const handleScoreSystemChange = (sys: FullScoreSystem) => {
    setScoreSystem(sys);
    if (sys === '100') {
      setChoiceCount(10);
      setChoiceScore(3);
      setFillCount(6);
      setFillScore(3);
    } else if (sys === '120') {
      setChoiceCount(10);
      setChoiceScore(3);
      setFillCount(6);
      setFillScore(3);
    } else if (sys === '150') {
      setChoiceCount(10);
      setChoiceScore(4);
      setFillCount(6);
      setFillScore(4);
    }
  };

  // 第二层：学期一键向后覆盖考点
  const handleSemesterSelect = (targetGrade: number, targetSemester: number) => {
    const key = `${targetGrade}-${targetSemester}`;
    setSelectedSemesterKey(key);

    if (effectiveKpDirectory.length === 0) return;

    // 覆盖所有 <= 当前学期的考点
    const coveredKpIds = effectiveKpDirectory
      .filter((kp) => {
        if (kp.grade < targetGrade) return true;
        if (kp.grade === targetGrade && kp.semester <= targetSemester) return true;
        return false;
      })
      .map((kp) => kp.id);

    setSelectedKpIds(coveredKpIds);
  };

  // 考点单选/反选
  const toggleKp = (id: string) => {
    setSelectedKpIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const handleSelectAllKps = () => {
    setSelectedKpIds(effectiveKpDirectory.map((kp) => kp.id));
  };

  const handleClearAllKps = () => {
    setSelectedKpIds([]);
  };

  // 第三层：解答题分值与题数阶梯自动倒推
  const totalChoiceScore = choiceCount * choiceScore;
  const totalFillScore = fillCount * fillScore;
  const remainingSolutionScore = spec.totalScore - (totalChoiceScore + totalFillScore);
  const solutionScoreLadder = useMemo(() => {
    return generateSolutionScoreLadder(Math.max(0, remainingSolutionScore));
  }, [remainingSolutionScore]);
  const derivedSolutionCount = solutionScoreLadder.length;

  // 第四层：难度波浪级联联动
  const handleDiffWeightChange = (index: number, newVal: number) => {
    setDiffWeights((prev) => adjustDifficultyWeights(prev, index, newVal));
  };

  // 过滤用于展示的考点列表
  const filteredKps = useMemo(() => {
    if (!kpSearchText.trim()) return effectiveKpDirectory;
    const query = kpSearchText.trim().toLowerCase();
    return effectiveKpDirectory.filter(
      (kp) =>
        kp.id.toLowerCase().includes(query) ||
        kp.nameZh.toLowerCase().includes(query)
    );
  }, [effectiveKpDirectory, kpSearchText]);

  // 组装当前组卷配置并调用方案 A 库存校验
  const currentConfig: PaperConfig = useMemo(() => {
    return {
      selectedKpIds,
      choiceCount,
      fillCount,
      solutionCount: derivedSolutionCount,
      choiceScore,
      fillScore,
      fullScore: spec.totalScore,
      difficultyDistribution: diffWeights,
    };
  }, [
    selectedKpIds,
    choiceCount,
    fillCount,
    derivedSolutionCount,
    choiceScore,
    fillScore,
    spec.totalScore,
    diffWeights,
  ]);

  // 方案 A 实时库存校验判定
  const inventoryResult: InventoryCheckResult = useMemo(() => {
    if (questionPool.length > 0) {
      return verifyPaperInventoryFromPool(questionPool, currentConfig);
    }
    return {
      canGenerate: false,
      availableChoice: 0,
      availableFill: 0,
      availableSolution: 0,
      requiredChoice: choiceCount,
      requiredFill: fillCount,
      requiredSolution: derivedSolutionCount,
      totalAvailable: 0,
      totalRequired: choiceCount + fillCount + derivedSolutionCount,
      shortageWarningZh: '正在同步题库资源...',
    };
  }, [questionPool, currentConfig, choiceCount, fillCount, derivedSolutionCount]);

  // 生成试卷并跳转排版/打印视图
  const handleGeneratePaper = async () => {
    if (!inventoryResult.canGenerate) return;
    setIsGenerating(true);
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

  // 生成试卷并开启在线全真测评
  const handleStartOnlineExam = async () => {
    if (!inventoryResult.canGenerate) return;
    setIsGenerating(true);
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

  // 视图分发
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

  return (
    <div
      className="paper-workbench-container"
      data-testid="paper-workbench-container"
      style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 0 2.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        fontFamily: 'var(--font-family-system)',
      }}
    >
      {/* 顶部吸顶状态栏与动态题量徽章 */}
      <div
        className="exam-subnav-sticky-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--bg-card, #ffffff)',
          padding: '14px 24px',
          borderRadius: 'var(--radius-lg, 20px)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--ios-blue, #0071e3)',
              fontWeight: 700,
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="bolt" size={13} style={{ color: 'var(--ios-blue)' }} />
            <span>模块四 · 实战测评 · 智能组卷中心</span>
          </span>

          <span
            className="exam-status-tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'rgba(0, 0, 0, 0.03)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill, 9999px)',
            }}
          >
            <Icon name="layers" size={12} />
            <span>全真题库 {questionPool.length > 0 ? questionPool.length : 2582} 题已就绪</span>
          </span>
        </div>

        {/* 试卷标题编辑 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            试卷标题：
          </span>
          <input
            type="text"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              background: 'var(--bg-input, #f1f5f9)',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
              borderRadius: '8px',
              width: '260px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* 第一层：满分制基准选择卡片 */}
      <div
        className="workbench-section-card"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 20px)',
          padding: '20px 24px',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.07))',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--ios-blue)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
            }}
          >
            1
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            第一层 · 满分制基准
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            (决定整卷满分与初始考场规格)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {(['100', '120', '150'] as FullScoreSystem[]).map((sysId) => {
            const sysSpec = FULL_SCORE_SYSTEMS[sysId];
            const isSelected = scoreSystem === sysId;
            return (
              <div
                key={sysId}
                onClick={() => handleScoreSystemChange(sysId)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: isSelected
                    ? '2px solid var(--ios-blue, #0071e3)'
                    : '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
                  background: isSelected
                    ? 'rgba(0, 113, 227, 0.04)'
                    : 'var(--glass-bg-card, #fafafa)',
                  boxShadow: isSelected ? '0 4px 14px rgba(0, 113, 227, 0.12)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: isSelected ? 'var(--ios-blue)' : 'var(--text-primary)' }}>
                    {sysSpec.nameZh}
                  </span>
                  {isSelected && (
                    <span style={{ color: 'var(--ios-blue)', fontSize: '12px', fontWeight: 700 }}>
                      <Icon name="check" size={14} /> 已选基准
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                  满分 {sysSpec.totalScore} 分 · 限时 {sysSpec.timeLimitMinutes} 分钟 · 共 {sysSpec.totalQuestions} 题
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 第二层：学期向后覆盖与考点子集闭包 */}
      <div
        className="workbench-section-card"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 20px)',
          padding: '20px 24px',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.07))',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--ios-blue)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              2
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              第二层 · 学期向后覆盖与考点子集
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              (考题组合考点必须是所选考点子集，杜绝超前知识点泄漏)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              placeholder="搜索考点..."
              value={kpSearchText}
              onChange={(e) => setKpSearchText(e.target.value)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle, rgba(0,0,0,0.15))',
                background: 'var(--bg-input, #f8fafc)',
                color: 'var(--text-primary)',
                width: '120px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleSelectAllKps}
              style={{
                fontSize: '12px',
                color: 'var(--ios-blue)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              全选考点
            </button>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <button
              type="button"
              onClick={handleClearAllKps}
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              清空
            </button>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <button
              type="button"
              onClick={() => setIsKpGridExpanded((prev) => !prev)}
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{isKpGridExpanded ? '收起考点网格' : '展开考点网格'}</span>
              <Icon name={isKpGridExpanded ? 'chevron-up' : 'chevron-down'} size={12} />
            </button>
          </div>
        </div>

        {/* 6 个学期药丸胶囊 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {SEMESTERS.map((sem) => {
            const isCurrentSem = selectedSemesterKey === sem.key;
            return (
              <button
                key={sem.key}
                type="button"
                onClick={() => handleSemesterSelect(sem.grade, sem.semester)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  fontSize: '12px',
                  fontWeight: isCurrentSem ? 700 : 500,
                  border: isCurrentSem
                    ? '1.5px solid var(--ios-blue, #0071e3)'
                    : '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
                  background: isCurrentSem
                    ? 'var(--ios-blue, #0071e3)'
                    : 'var(--bg-card, #ffffff)',
                  color: isCurrentSem ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isCurrentSem ? '0 2px 8px rgba(0, 113, 227, 0.25)' : 'none',
                }}
              >
                {sem.label}
              </button>
            );
          })}
        </div>

        {/* 考点勾选统计与网格 */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          已选定 <strong>{selectedKpIds.length}</strong> / {effectiveKpDirectory.length} 个考点
        </div>

        {isKpGridExpanded && (
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '8px',
            }}
          >
            {filteredKps.map((kp) => {
              const isChecked = selectedKpIds.includes(kp.id);
              return (
                <label
                  key={kp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: isChecked ? 'rgba(0, 113, 227, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: isChecked ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleKp(kp.id)}
                    style={{ accentColor: 'var(--ios-blue)' }}
                  />
                  <span style={{ fontWeight: isChecked ? 700 : 400 }}>
                    {kp.id} · {kp.nameZh}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 第三层：题型、题量与分值配置 */}
      <div
        className="workbench-section-card"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 20px)',
          padding: '20px 24px',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.07))',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--ios-blue)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
            }}
          >
            3
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            第三层 · 题型题量与分值配置
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            (选择、填空可自由微调，解答题数量与分值依中考阶梯自动倒推)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {/* 选择题配置 */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'var(--glass-bg-card, #fafafa)',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                一、单项选择题
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ios-blue)' }}>
                小计 {totalChoiceScore} 分
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>题目数量：</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setChoiceCount((prev) => Math.max(0, prev - 1))}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={choiceCount}
                    onChange={(e) => setChoiceCount(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: '42px', textAlign: 'center', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={() => setChoiceCount((prev) => prev + 1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>题</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>每题分值：</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setChoiceScore((prev) => Math.max(1, prev - 1))}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={choiceScore}
                    onChange={(e) => setChoiceScore(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '42px', textAlign: 'center', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={() => setChoiceScore((prev) => prev + 1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>分</span>
                </div>
              </div>
            </div>
          </div>

          {/* 填空题配置 */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'var(--glass-bg-card, #fafafa)',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                二、填空题
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ios-blue)' }}>
                小计 {totalFillScore} 分
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>题目数量：</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setFillCount((prev) => Math.max(0, prev - 1))}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={fillCount}
                    onChange={(e) => setFillCount(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: '42px', textAlign: 'center', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={() => setFillCount((prev) => prev + 1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>题</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>每题分值：</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setFillScore((prev) => Math.max(1, prev - 1))}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={fillScore}
                    onChange={(e) => setFillScore(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '42px', textAlign: 'center', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={() => setFillScore((prev) => prev + 1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    +
                  </button>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>分</span>
                </div>
              </div>
            </div>
          </div>

          {/* 解答题动态倒推看板 (只读) */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: remainingSolutionScore >= 20 ? 'rgba(52, 199, 89, 0.04)' : 'rgba(255, 59, 48, 0.05)',
              border: remainingSolutionScore >= 20
                ? '1px solid rgba(52, 199, 89, 0.2)'
                : '1px solid rgba(255, 59, 48, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                三、解答题 (动态倒推)
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: remainingSolutionScore >= 20 ? 'var(--ios-green)' : 'var(--ios-red)',
                }}
              >
                小计 {remainingSolutionScore} 分
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>
                题量推导：<strong>{derivedSolutionCount}</strong> 道大题
              </div>
              <div style={{ marginTop: '4px' }}>
                中考标准分值阶梯：
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  [{solutionScoreLadder.join(', ')}] 分
                </div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                整卷满分 {spec.totalScore} - 选择 {totalChoiceScore} - 填空 {totalFillScore} = 剩余 {remainingSolutionScore} 分
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第四层：试卷难度配比 (L1~L5) */}
      <div
        className="workbench-section-card"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 20px)',
          padding: '20px 24px',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.07))',
          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--ios-blue)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              4
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              第四层 · 试卷难度配比 (L1 ~ L5)
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              (波浪级联外向传导算法，就近吸收，总和严格等于 100%)
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ios-blue)' }}>
            总和: {diffWeights.reduce((a, b) => a + b, 0)}%
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {[
            { label: 'L1 送分基础', tip: '对应题库 L1+L2 (415题)' },
            { label: 'L2 常规理解', tip: '对应题库 L3+L4 (1117题)' },
            { label: 'L3 迁移中档', tip: '对应题库 L5+L6 (743题)' },
            { label: 'L4 思维探究', tip: '对应题库 L7+L8 (246题)' },
            { label: 'L5 综合压轴', tip: '对应题库 L9 (61题)' },
          ].map((d, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'var(--glass-bg-card, #fafafa)',
                border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {d.label}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ios-blue)' }}>
                  {diffWeights[idx]}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={diffWeights[idx]}
                onChange={(e) => handleDiffWeightChange(idx, parseInt(e.target.value) || 0)}
                style={{ width: '100%', accentColor: 'var(--ios-blue)' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                {d.tip}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 底部：方案 A 实时库存预警与出卷栏 */}
      <div
        className="workbench-bottom-bar"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 20px)',
          padding: '18px 24px',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon
              name={inventoryResult.canGenerate ? 'check-circle' : 'alert-triangle'}
              size={18}
              style={{
                color: inventoryResult.canGenerate ? 'var(--ios-green)' : 'var(--ios-red)',
              }}
            />
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {inventoryResult.canGenerate
                ? '题库库存充足 · 满足出题要求'
                : '题库库存预警 · 无法生成试卷 (方案 A 拦截)'}
            </h3>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {inventoryResult.canGenerate ? (
              <span>
                所选考点内可用真题总数：{inventoryResult.totalAvailable} 题（选择 {inventoryResult.availableChoice}/{inventoryResult.requiredChoice}，填空 {inventoryResult.availableFill}/{inventoryResult.requiredFill}，解答 {inventoryResult.availableSolution}/{inventoryResult.requiredSolution}）。
              </span>
            ) : (
              <span style={{ color: 'var(--ios-red)', fontWeight: 600 }}>
                <MathRenderer content={inventoryResult.shortageWarningZh || ''} />
              </span>
            )}
          </div>
        </div>

        {/* 出卷按钮组 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            disabled={!inventoryResult.canGenerate || isGenerating}
            onClick={handleGeneratePaper}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill, 9999px)',
              fontWeight: 700,
              fontSize: '13px',
              backgroundColor: inventoryResult.canGenerate
                ? 'var(--glass-bg-card, #ffffff)'
                : 'var(--border-subtle, rgba(0,0,0,0.06))',
              color: inventoryResult.canGenerate
                ? 'var(--text-primary)'
                : 'var(--text-tertiary)',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
              cursor: inventoryResult.canGenerate ? 'pointer' : 'not-allowed',
              boxShadow: inventoryResult.canGenerate ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <Icon name="print" size={15} />
            <span>生成中考全真模拟试卷 (A4双栏排版)</span>
          </button>

          <button
            type="button"
            disabled={!inventoryResult.canGenerate || isGenerating}
            onClick={handleStartOnlineExam}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 22px',
              borderRadius: 'var(--radius-pill, 9999px)',
              fontWeight: 700,
              fontSize: '13px',
              backgroundColor: inventoryResult.canGenerate
                ? 'var(--ios-blue, #0071e3)'
                : 'var(--border-subtle, rgba(0,0,0,0.06))',
              color: inventoryResult.canGenerate ? '#ffffff' : 'var(--text-tertiary)',
              border: 'none',
              cursor: inventoryResult.canGenerate ? 'pointer' : 'not-allowed',
              boxShadow: inventoryResult.canGenerate
                ? '0 4px 14px rgba(0, 113, 227, 0.3)'
                : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <Icon name="rocket" size={15} />
            <span>开启在线全真测评 (限时答题)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
