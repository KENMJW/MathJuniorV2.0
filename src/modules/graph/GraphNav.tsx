import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LogicLine } from './types';
import { mockLogicLines } from './mockGraphData';
import { LINE_CATEGORY_GROUPS, FLAGSHIP_MODELS_BY_LINE } from './LineClosedLoop';
import { LineSwimlane, LineSwimlanePoint } from './LineSwimlane';
import { LeapLab } from '../sandbox/LeapLab';
import { LeapSandboxModel, mockLeapSandboxModels } from '../sandbox/morphControllers';
import { PointMasterExample, MasterExampleItem } from '../concept/PointMasterExample';
import { LineQuickPractice } from './LineQuickPractice';
import { QuickPracticeQuestion, mapRawRowsToQuestions } from '../concept/quickPractice.machine';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { useSessionStore } from '../../store/sessionStore';
import { dbClient } from '../../engine/db/dbClient';
import { ALL_107_KNOWLEDGE_POINTS } from '../concept/allPointsData';

export interface GraphNavProps {
  lines?: LogicLine[];
  initialLineId?: string;
  onSelectLine?: (lineId: string) => void;
  knowledgePoints?: any[];
  allQuestions?: QuickPracticeQuestion[];
  leapModels?: LeapSandboxModel[];
  className?: string;
  style?: React.CSSProperties;
}

export type GraphNavTab = 'concept' | 'sandbox' | 'master' | 'practice';

export const GraphNav: React.FC<GraphNavProps> = ({
  lines: propLines,
  initialLineId,
  onSelectLine,
  knowledgePoints: propPoints,
  allQuestions: propQuestions,
  leapModels: propLeapModels,
  className = '',
  style = {},
}) => {
  const locale = useSessionStore((state) => state.locale);

  // 1. 异步从 core.db 加载真实 12 谱系与考点
  const [dbLines, setDbLines] = useState<LogicLine[] | null>(null);
  const [dbPoints, setDbPoints] = useState<any[] | null>(null);
  const [dbLeapModels, setDbLeapModels] = useState<LeapSandboxModel[] | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCoreData() {
      try {
        const rows = await dbClient.query<LogicLine>(
          'core',
          'SELECT * FROM logic_lines ORDER BY line_id ASC'
        );
        if (active && rows && rows.length > 0) {
          setDbLines(rows);
        }
      } catch {
        // Fallback to mockLogicLines
      }

      try {
        const ptRows = await dbClient.query<any>(
          'core',
          'SELECT point_id, name_zh, name_en, grade, semester, primary_line_id FROM knowledge_points ORDER BY point_id ASC'
        );
        if (active && ptRows && ptRows.length > 0) {
          setDbPoints(ptRows);
        }
      } catch {
        // Fallback to ALL_107_KNOWLEDGE_POINTS
      }

      try {
        const modelRows = await dbClient.query<LeapSandboxModel>(
          'sandbox',
          'SELECT * FROM leap_sandbox_models ORDER BY model_id ASC'
        );
        if (active && modelRows && modelRows.length > 0) {
          setDbLeapModels(modelRows);
        }
      } catch {
        // Fallback to mockLeapSandboxModels
      }
    }
    loadCoreData();
    return () => {
      active = false;
    };
  }, []);

  const lines = useMemo(() => {
    if (propLines && propLines.length > 0) return propLines;
    return dbLines || mockLogicLines;
  }, [propLines, dbLines]);

  const allPoints = useMemo(() => {
    if (propPoints && propPoints.length > 0) return propPoints;
    return dbPoints || ALL_107_KNOWLEDGE_POINTS;
  }, [propPoints, dbPoints]);

  const effectiveLeapModels = useMemo(() => {
    if (propLeapModels && propLeapModels.length > 0) return propLeapModels;
    return dbLeapModels || mockLeapSandboxModels;
  }, [propLeapModels, dbLeapModels]);

  // 当前选中谱系 ID：优先外部 prop > 默认 A1 (实数与数轴)
  const [currentLineId, setCurrentLineId] = useState<string>(
    initialLineId || 'A1'
  );

  const currentLine = useMemo(() => {
    return lines.find((l) => l.line_id === currentLineId) || lines[0] || mockLogicLines[0];
  }, [lines, currentLineId]);

  // 12 谱系抽屉/浮层开关
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  // 当前子视窗 Tab (概念精讲 / 链接沙盒 / 谱系母题 / 专项测评)
  const [activeTab, setActiveTab] = useState<GraphNavTab>('concept');
  const mainStageRef = useRef<HTMLDivElement>(null);

  // 切换谱系时重置 Tab 到「概念精讲」并置顶 (对标 ConceptNav)
  const handleSelectLine = (lineId: string) => {
    setCurrentLineId(lineId);
    if (onSelectLine) onSelectLine(lineId);
    setIsDrawerOpen(false);
    setActiveTab('concept');
    if (mainStageRef.current) {
      mainStageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 筛选当前谱系覆盖的知识点 (供泳道图与题目查询)
  const currentLinePoints: LineSwimlanePoint[] = useMemo(() => {
    return allPoints
      .filter((p) => p.primary_line_id === currentLine.line_id)
      .map((p) => ({
        point_id: p.point_id,
        name_zh: p.name_zh,
        name_en: p.name_en,
        grade: Number(p.grade),
        semester: Number(p.semester),
      }));
  }, [allPoints, currentLine.line_id]);

  const linePointIds = useMemo(() => {
    return currentLinePoints.map((p) => p.point_id);
  }, [currentLinePoints]);

  // 旗舰模型解析
  const flagshipModelId = useMemo(() => {
    if (currentLine.flagship_model_id) return currentLine.flagship_model_id;
    const mapped = FLAGSHIP_MODELS_BY_LINE[currentLine.line_id];
    if (mapped) return mapped.model_id;
    return 'LM-7A-01';
  }, [currentLine]);

  // 母题数据加载 (从 master.db 或 fallback)
  const [dbMasterExample, setDbMasterExample] = useState<MasterExampleItem | null>(null);

  useEffect(() => {
    let active = true;
    async function loadLineMaster() {
      try {
        const row = await dbClient.queryOne<any>(
          'master',
          'SELECT * FROM master_examples WHERE bound_target_id = ? OR example_id = ? OR bound_line_id = ? LIMIT 1',
          [currentLine.line_id, currentLine.master_example_id || `ME-LINE-${currentLine.line_id}`, currentLine.line_id]
        );
        if (active && row) {
          setDbMasterExample({
            example_id: String(row.example_id),
            example_type: 'line_master',
            bound_target_id: String(row.bound_target_id || currentLine.line_id),
            source: String(row.source || `${currentLine.name_zh} · 中考压轴母题`),
            stem_zh: String(row.stem_zh || ''),
            stem_en: row.stem_en ? String(row.stem_en) : null,
            options_json: row.options_json,
            correct_option: row.correct_option,
            answer_standard: row.answer_standard,
            dim1_origin: row.dim1_origin || currentLine.origin_foundation_zh,
            dim2_essence: row.dim2_essence || currentLine.spiral_leaps_zh,
            dim3_rigor: String(row.dim3_rigor || currentLine.methodology_zh || '由公理体系严密推导可得。'),
            dim4_traps: row.dim4_traps || currentLine.exam_matrix_zh,
            available_dimensions: 4,
          });
          return;
        }
      } catch {
        // Fallback
      }

      if (active) {
        setDbMasterExample({
          example_id: currentLine.master_example_id || `ME-LINE-${currentLine.line_id}`,
          example_type: 'line_master',
          bound_target_id: currentLine.line_id,
          source: `${currentLine.name_zh} · 中考母题精解`,
          stem_zh: `已知关于【${currentLine.name_zh}】的典型综合应用模型：试运用本谱系核心公理与思想方法进行严格推导求解。`,
          stem_en: `Standard master example on ${currentLine.name_en || currentLine.name_zh}.`,
          dim1_origin: currentLine.origin_foundation_zh,
          dim2_essence: currentLine.spiral_leaps_zh,
          dim3_rigor: currentLine.methodology_zh || '由相关公理体系与定义严格推导可得。',
          dim4_traps: currentLine.exam_matrix_zh || '注意临界边界与反例检验。',
          available_dimensions: 4,
        });
      }
    }
    loadLineMaster();
    return () => {
      active = false;
    };
  }, [currentLine]);

  // 专项测评题目数据加载 (从 questions.db)
  const [dbPracticeQuestions, setDbPracticeQuestions] = useState<QuickPracticeQuestion[] | null>(null);

  useEffect(() => {
    let active = true;
    const fallbackQuestions: QuickPracticeQuestion[] = [
      {
        question_id: `Q-LINE-${currentLine.line_id}-01`,
        primary_point_id: linePointIds[0] || 'KP-001',
        difficulty_level: 4,
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: `关于【${currentLine.name_zh}】的核心思想方法，下列论述正确的是（ ）`,
        stem_en: `Regarding the core methodology of ${currentLine.name_en}, which is correct?`,
        options: [
          { key: 'A', text_zh: currentLine.methodology_zh ? currentLine.methodology_zh.slice(0, 32) : '符合公理体系严密推导', text_en: 'Axiom-based deduction' },
          { key: 'B', text_zh: '该谱系无需考虑中考命题矩阵约束', text_en: 'No constraints needed' },
          { key: 'C', text_zh: '本主线仅在单一特定学期生效', text_en: 'Single semester only' },
          { key: 'D', text_zh: '以上论述均不正确', text_en: 'None of the above' },
        ],
        answer_standard: 'A',
        solutions_json: `依据【${currentLine.name_zh}】的底层思想方法判定 A 正确。`,
      },
      {
        question_id: `Q-LINE-${currentLine.line_id}-02`,
        primary_point_id: linePointIds[0] || 'KP-001',
        difficulty_level: 5,
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: `在【${currentLine.name_zh}】的中考压轴矩阵综合演化中，下列判定正确的是（ ）`,
        stem_en: `In capstone matrix evolution of ${currentLine.name_en}, which is valid?`,
        options: [
          { key: 'A', text_zh: '模型变异不影响几何拓扑不变量', text_en: 'Invariants preserved' },
          { key: 'B', text_zh: currentLine.exam_matrix_zh ? currentLine.exam_matrix_zh.slice(0, 32) : '注意临界边界与极值分类', text_en: 'Boundary verification' },
          { key: 'C', text_zh: '任意代数变形均满足可逆充要性', text_en: 'Always reversible' },
          { key: 'D', text_zh: '无法根据谱系公理推导', text_en: 'Indeterminate' },
        ],
        answer_standard: 'B',
        solutions_json: `结合中考压轴矩阵分析，选 B。`,
      },
      {
        question_id: `Q-LINE-${currentLine.line_id}-03`,
        primary_point_id: linePointIds[0] || 'KP-001',
        difficulty_level: 6,
        question_type: 'single_choice',
        score_default: 3,
        stem_zh: `针对【${currentLine.name_zh}】螺旋跃迁路径的临界边界，下列推导严谨的是（ ）`,
        stem_en: `For spiral leap boundary of ${currentLine.name_en}, which is rigorous?`,
        options: [
          { key: 'A', text_zh: currentLine.spiral_leaps_zh ? currentLine.spiral_leaps_zh.slice(0, 32) : '跨学期递进演进形成闭环', text_en: 'Cross-semester evolution' },
          { key: 'B', text_zh: '跃迁前后模型参数恒为常数', text_en: 'Parameters constant' },
          { key: 'C', text_zh: '无需验证前置依赖定理', text_en: 'No prerequisites' },
          { key: 'D', text_zh: '分类讨论必然导致无解', text_en: 'Always no solution' },
        ],
        answer_standard: 'A',
        solutions_json: `由螺旋跃迁路径分析可知，选 A。`,
      },
    ];

    async function loadPracticeQuestions() {
      if (linePointIds.length === 0) return;
      try {
        const placeholders = linePointIds.map(() => '?').join(',');
        const rows = await dbClient.query<any>(
          'questions',
          `SELECT * FROM questions WHERE primary_point_id IN (${placeholders}) AND question_type = 'single_choice' AND difficulty_level BETWEEN 4 AND 6 ORDER BY RANDOM() LIMIT 20`,
          linePointIds
        );
        if (active && rows && rows.length > 0) {
          const mapped = mapRawRowsToQuestions(rows);
          if (mapped.length >= 3) {
            setDbPracticeQuestions(mapped);
            return;
          }
          setDbPracticeQuestions([...mapped, ...fallbackQuestions]);
          return;
        }
      } catch {
        // Fallback
      }
      if (active) {
        setDbPracticeQuestions(fallbackQuestions);
      }
    }
    loadPracticeQuestions();
    return () => {
      active = false;
    };
  }, [linePointIds, currentLine]);

  const practiceQuestions = useMemo(() => {
    if (propQuestions && propQuestions.length > 0) return propQuestions;
    return dbPracticeQuestions || [];
  }, [propQuestions, dbPracticeQuestions]);

  return (
    <div
      className={`graph-nav-container ${className}`}
      data-testid="graph-nav-container"
      style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        ...style,
      }}
    >
      {/* 
        顶栏 Header：吸顶常驻，iOS 27 纯白微玻璃风格
        左侧：[ 谱系选择胶囊 ▾ ]
        中间：Flex 负空间
        右侧：[概念精讲] [链接沙盒] [谱系母题] [专项测评] 4 个分段胶囊
      */}
      <header
        className="graph-nav-header"
        data-testid="graph-nav-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 28px',
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 22px)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxSizing: 'border-box',
          width: '100%',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* 左侧：[ 谱系选择胶囊 ▾ ] */}
        <button
          type="button"
          data-testid="graph-line-selector-trigger"
          className="graph-line-selector-trigger-btn"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 18px',
            background: '#ffffff',
            border: '1.5px solid var(--ios-blue, #0071e3)',
            borderRadius: 'var(--radius-pill, 9999px)',
            color: 'var(--ios-blue, #0071e3)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0, 113, 227, 0.12)',
            transition: 'all 0.18s ease',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Icon name="compass" size={14} />
          <span>
            {currentLine.line_id} · {locale === 'en' ? currentLine.name_en : currentLine.name_zh}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'rgba(0, 113, 227, 0.08)',
              fontWeight: 600,
            }}
          >
            {currentLine.domain}
          </span>
          <Icon
            name="chevron-down"
            size={12}
            style={{
              transform: isDrawerOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          />
        </button>

        {/* 12 谱系选择器抽屉面板 (按大类分组) */}
        {isDrawerOpen && (
          <div
            className="graph-line-drawer-panel"
            data-testid="graph-line-drawer-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '28px',
              zIndex: 50,
              width: 'min(560px, calc(100vw - 56px))',
              background: 'var(--glass-bg-elevated, #ffffff)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {locale === 'en' ? 'Select Knowledge Line' : '选择知识谱系'}
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: '4px',
                }}
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LINE_CATEGORY_GROUPS.map((group) => (
                <div
                  key={group.domain}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: group.themeColor,
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: group.themeColor }}>
                      {group.domain}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {group.lines.map((item) => {
                      const isSelected = item.id === currentLine.line_id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`graph-line-option-${item.id}`}
                          onClick={() => handleSelectLine(item.id)}
                          style={{
                            border: isSelected ? `1.5px solid ${group.themeColor}` : '1px solid rgba(0,0,0,0.08)',
                            background: isSelected ? group.themeColor : '#ffffff',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                          }}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 中间自适应留白 */}
        <div style={{ flex: 1 }} />

        {/* 右侧：4 个分段胶囊 Tab */}
        <div
          className="stage-segmented-control"
          data-testid="graph-stage-segmented-control"
          style={{
            position: 'relative',
            display: 'inline-flex',
            background: 'rgba(0, 0, 0, 0.04)',
            padding: '3px',
            borderRadius: 'var(--radius-pill, 9999px)',
            border: '1px solid rgba(0, 0, 0, 0.03)',
            gap: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          {[
            { key: 'concept', label: '概念精讲', icon: 'book' },
            { key: 'sandbox', label: '链接沙盒', icon: 'flask' },
            { key: 'master', label: '谱系母题', icon: 'trophy' },
            { key: 'practice', label: '专项测评', icon: 'bolt' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                data-testid={`graph-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key as GraphNavTab)}
                style={{
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  background: active ? 'var(--bg-card, #ffffff)' : 'transparent',
                  color: active ? 'var(--ios-blue)' : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                  transition: 'all 0.18s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Icon name={tab.icon} size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 
        大卡片主体：纯白主舞台，与顶部 Header 紧密相连
        minHeight 740px 防 CLS 抖动
      */}
      <div
        ref={mainStageRef}
        className="graph-main-card"
        data-testid="graph-main-card"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '740px',
          background: 'var(--bg-card, #ffffff)',
          borderRadius: 'var(--radius-lg, 22px)',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.07))',
          borderTop: 'none',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Tab 1: 概念精讲 (四段论 + 右侧单谱系竖向泳道图) */}
        {activeTab === 'concept' && (
          <div
            className="graph-concept-view"
            data-testid="graph-concept-view"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* 左侧：四段论精讲卡片 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {[
                {
                  id: 'origin',
                  num: '①',
                  title: '源头基石',
                  color: 'var(--ios-blue)',
                  content: currentLine.origin_foundation_zh,
                  icon: 'anchor',
                },
                {
                  id: 'spiral',
                  num: '②',
                  title: '螺旋跃迁路径',
                  color: 'var(--ios-purple)',
                  content: currentLine.spiral_leaps_zh,
                  icon: 'git-branch',
                },
                {
                  id: 'method',
                  num: '③',
                  title: '核心思想方法',
                  color: 'var(--ios-green)',
                  content: currentLine.methodology_zh,
                  icon: 'cpu',
                },
                {
                  id: 'exam',
                  num: '④',
                  title: '中考压轴矩阵',
                  color: 'var(--ios-orange)',
                  content: currentLine.exam_matrix_zh,
                  icon: 'target',
                },
              ].map((stage) => (
                <div
                  key={stage.id}
                  data-testid={`graph-stage-${stage.id}`}
                  style={{
                    padding: '18px 22px',
                    borderRadius: '16px',
                    background: 'var(--glass-bg-subtle, rgba(0, 0, 0, 0.015))',
                    border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.06))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        background: stage.color,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {stage.num}
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stage.title}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.75',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <MathRenderer content={stage.content || '暂无内容'} />
                  </div>
                </div>
              ))}
            </div>

            {/* 右侧：竖向单谱系泳道图 */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <LineSwimlane
                lineId={currentLine.line_id}
                lineName={currentLine.name_zh}
                points={currentLinePoints}
              />
            </div>
          </div>
        )}

        {/* Tab 2: 链接沙盒 (复用 LeapLab，锁定旗舰模型，隐藏抽屉) */}
        {activeTab === 'sandbox' && (
          <div
            className="graph-sandbox-view"
            data-testid="graph-sandbox-view"
            style={{ width: '100%' }}
          >
            <LeapLab
              modelId={flagshipModelId}
              hideModelDrawer={true}
              allModels={effectiveLeapModels}
              locale={locale}
            />
          </div>
        )}

        {/* Tab 3: 谱系母题 (步进解锁) */}
        {activeTab === 'master' && dbMasterExample && (
          <div
            className="graph-master-view"
            data-testid="graph-master-view"
            style={{ width: '100%' }}
          >
            <PointMasterExample example={dbMasterExample} />
          </div>
        )}

        {/* Tab 4: 专项测评 (即答即判 3 题) */}
        {activeTab === 'practice' && (
          <div
            className="graph-practice-view"
            data-testid="graph-practice-view"
            style={{ width: '100%' }}
          >
            <LineQuickPractice
              lineId={currentLine.line_id}
              lineName={currentLine.name_zh}
              allQuestions={practiceQuestions}
              pointIds={linePointIds}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  );
};
