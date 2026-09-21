import React, { useState, useEffect } from 'react';
import { LogicLine, LineMasterExample } from './types';
import { MathRenderer } from '../../components/math/MathRenderer';
import { Icon } from '../../components/common/Icon';
import { LineQuickPractice } from './LineQuickPractice';
import { mockLogicLines } from './mockGraphData';
import { useSessionStore } from '../../store/sessionStore';
import { dbClient } from '../../engine/db/dbClient';

export interface LineCategoryGroup {
  domain: string;
  themeColor: string;
  lines: { id: string; name: string }[];
}

// 主线选择器中文大类抽屉分组
export const LINE_CATEGORY_GROUPS: LineCategoryGroup[] = [
  {
    domain: '数与代数',
    themeColor: 'var(--ios-blue)',
    lines: [
      { id: 'A1', name: 'A1 实数与数轴' },
      { id: 'A2', name: 'A2 代数式与运算' },
      { id: 'A3', name: 'A3 方程与不等式' },
      { id: 'A4', name: 'A4 函数与坐标系' },
    ],
  },
  {
    domain: '图形与几何',
    themeColor: 'var(--ios-green)',
    lines: [
      { id: 'G1', name: 'G1 几何原点' },
      { id: 'G2', name: 'G2 全等推演' },
      { id: 'G3', name: 'G3 四边形' },
      { id: 'G4', name: 'G4 圆的度量' },
      { id: 'G5', name: 'G5 刚体变换' },
      { id: 'G6', name: 'G6 勾股与相似' },
    ],
  },
  {
    domain: '统计与概率',
    themeColor: 'var(--ios-orange)',
    lines: [
      { id: 'P1', name: 'P1 随机概率' },
      { id: 'S1', name: 'S1 统计推断' },
    ],
  },
];

export interface FlagshipModelInfo {
  model_id: string;
  model_name_zh: string;
  unlocked_semester: string;
  model_brief_zh: string;
}

// 12 条核心主线绑定的真实 4D 旗舰模型映射表
export const FLAGSHIP_MODELS_BY_LINE: Record<string, FlagshipModelInfo> = {
  A1: {
    model_id: 'LM-7A-01',
    model_name_zh: '数轴动点与绝对值几何距离模型',
    unlocked_semester: '7A',
    model_brief_zh: '数轴动点绝对值化为几何距离，折线和差找极值。曼哈顿距离与双动点相遇追及极值。',
  },
  A2: {
    model_id: 'LM-8A-06',
    model_name_zh: '乘法公式面积割补与配方恒等模型',
    unlocked_semester: '8A',
    model_brief_zh: '几何面积拼图、倒数双对称、双主元齐次、拆项添项、裂项相消数形互证。',
  },
  A3: {
    model_id: 'LM-9A-18',
    model_name_zh: '一元二次方程判别式与韦达对称代数模型',
    unlocked_semester: '9A',
    model_brief_zh: '配方降次、判别式相切临界、韦达弦长、高次降一次、对称式全息化简。',
  },
  A4: {
    model_id: 'LM-9A-28',
    model_name_zh: '二次函数与直角坐标系综合最值模型',
    unlocked_semester: '9A',
    model_brief_zh: '抛物线与动点几何最值、铅垂高水平宽面积割补、特殊图形存在性与和差极值。',
  },
  G1: {
    model_id: 'LM-7A-02',
    model_name_zh: '线段双中点与角平分线和差模型',
    unlocked_semester: '7A',
    model_brief_zh: '双中点折半、垂线段最短、平行线拐点折角(猪蹄)、垂直平分线对称与角度度量。',
  },
  G2: {
    model_id: 'LM-8A-09',
    model_name_zh: '倍长中线与中点构造全等模型',
    unlocked_semester: '8A',
    model_brief_zh: '倍长中线、截长补短、等腰三线合一、等边60°旋转、三垂直弦图与HL公理推演。',
  },
  G3: {
    model_id: 'LM-8B-14',
    model_name_zh: '十字架对角线垂直与中点四边形模型',
    unlocked_semester: '8B',
    model_brief_zh: '四连杆升格、旋转十字架垂直、菱形轴对称、正方形半角旋转、中点四边形退化。',
  },
  G4: {
    model_id: 'LM-8A-01',
    model_name_zh: '手拉手全等与勾股跃迁模型',
    unlocked_semester: '8A',
    model_brief_zh: '共顶等线成旋转，全等导引勾股现。开启 X-Ray 可一键隐去干扰线，聚焦共顶旋转骨架。',
  },
  G5: {
    model_id: 'LM-9A-19',
    model_name_zh: '手拉手旋转全等模型',
    unlocked_semester: '9A',
    model_brief_zh: '共顶等线成旋转，两个共顶点的等腰/等边三角形诱导旋转全等全息链。载体变异与刚体保距不变量。',
  },
  G6: {
    model_id: 'LM-9B-36',
    model_name_zh: '直角三角形与锐角三角函数综合度量模型',
    unlocked_semester: '9B',
    model_brief_zh: '三角比边角互化、互余角对称代换、双直角方程、坡度方向角、化折为垂(胡不归)。',
  },
  S1: {
    model_id: 'LM-8B-17',
    model_name_zh: '统计指标加权平均与方差风险决策模型',
    unlocked_semester: '8B',
    model_brief_zh: '样本估计总体、图表多源互校、离群值抗噪、均值方差双指标风险决策全流程。',
  },
  P1: {
    model_id: 'LM-8B-17',
    model_name_zh: '概率度量与频率大数定律逼近模型',
    unlocked_semester: '8B',
    model_brief_zh: '单步古典概型、树状图乘法原理、几何面积比概型、大数定律蒙特卡洛收敛。',
  },
};

const EXTRA_FLAGSHIP_MODELS: Record<string, FlagshipModelInfo> = {
  'LM-9A-24': {
    model_id: 'LM-9A-24',
    model_name_zh: '切线长定理与内切圆/外接圆模型',
    unlocked_semester: '9A',
    model_brief_zh: '垂径定理、圆周角倍半直径对直角、双切线对称、定弦定角隐圆、四点共圆度量。',
  },
  'LM-9A-01': {
    model_id: 'LM-9A-01',
    model_name_zh: '二次函数铅垂高与割线极值跃迁模型',
    unlocked_semester: '9A',
    model_brief_zh: '抛物线割线作铅垂，水平宽乘积半求积。X-Ray 透视一键滤除切线干扰，暴露铅垂高核心高线。',
  },
};

export interface LineClosedLoopProps {
  line?: LogicLine;
  lines?: LogicLine[];
  selectedLineId?: string;
  onSelectLineId?: (lineId: string) => void;
  masterExample?: LineMasterExample;
  activeTab?: 'lecture' | 'master' | 'practice';
  onTabChange?: (tab: 'lecture' | 'master' | 'practice') => void;
  onOpenFlagshipModel?: (modelId: string) => void;
  onBackToMap?: () => void;
  locale?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 任务 10.4: 主线四位一体闭环 (LineClosedLoop)
 *
 * 核心要素：
 * ① 主线精讲：源头基石、螺旋跃迁、思想方法、中考矩阵（四段字段上屏走 MathRenderer）
 * ② 实验室二旗舰模型：跟随所选主线（A1~G6）动态读取展示真实 4D 模型与核心导引
 * ③ 主线压轴母题：ME-LINE-xx 1~4 维自适应解剖展示
 * ④ 主线快练：嵌入 LineQuickPractice（锁定 L4~L6 综合强化题）
 *
 * 铁律规范：
 * 1. [铁律 11]: 源码中绝对零 emoji，任何图标使用 <Icon name="..." />。
 * 2. [铁律 3]: 所有文本公式上屏必须经由 <MathRenderer> 出口，严禁裸 innerHTML。
 * 3. [铁律 4]: 零学情诊断，纯客观知识结构与解剖呈现。
 * 4. [铁律 10]: 采用 iOS 27 液态玻璃设计系统 Token。
 */
export const LineClosedLoop: React.FC<LineClosedLoopProps> = ({
  line,
  lines,
  selectedLineId: propSelectedLineId,
  onSelectLineId,
  masterExample,
  activeTab: propActiveTab,
  onTabChange,
  onOpenFlagshipModel,
  onBackToMap,
  locale: propLocale,
  className,
  style,
}) => {
  const sessionLocale = useSessionStore((state) => state.locale);
  const locale = propLocale || sessionLocale;

  // 主线 ID 状态：支持外部受控与内部自管
  const [internalLineId, setInternalLineId] = useState<string>(line?.line_id || 'G4');
  const currentLineId = propSelectedLineId !== undefined ? propSelectedLineId : internalLineId;

  const handleLineChange = (newLineId: string) => {
    if (onSelectLineId) {
      onSelectLineId(newLineId);
    } else {
      setInternalLineId(newLineId);
    }
  };

  // 当前主线对象解析
  const allAvailableLines = lines && lines.length > 0 ? lines : mockLogicLines;
  const currentLine: LogicLine =
    (line && line.line_id === currentLineId ? line : undefined) ||
    allAvailableLines.find((l) => l.line_id === currentLineId) ||
    mockLogicLines.find((l) => l.line_id === currentLineId) ||
    line ||
    mockLogicLines[0];

  // 选项卡状态：支持受控与内部自管
  const [internalTab, setInternalTab] = useState<'lecture' | 'master' | 'practice'>('lecture');
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalTab;

  const handleTabClick = (tab: 'lecture' | 'master' | 'practice') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // 动态读取主线绑定的真实 4D 旗舰模型信息
  const fallbackModelInfo: FlagshipModelInfo =
    (currentLine.flagship_model_id && (FLAGSHIP_MODELS_BY_LINE[currentLine.flagship_model_id] || EXTRA_FLAGSHIP_MODELS[currentLine.flagship_model_id])) ||
    FLAGSHIP_MODELS_BY_LINE[currentLine.line_id] ||
    FLAGSHIP_MODELS_BY_LINE['G4'];

  const [dbModelInfo, setDbModelInfo] = useState<FlagshipModelInfo | null>(null);

  useEffect(() => {
    let active = true;
    async function loadFlagshipModelFromDb() {
      try {
        const targetModelId = fallbackModelInfo.model_id;
        const row = await dbClient.queryOne<any>(
          'sandbox',
          'SELECT model_id, model_name_zh, unlocked_semester, model_brief_zh FROM leap_sandbox_models WHERE model_id = ? OR primary_line = ? LIMIT 1',
          [targetModelId, currentLine.line_id]
        );
        if (active && row) {
          setDbModelInfo({
            model_id: String(row.model_id),
            model_name_zh: String(row.model_name_zh),
            unlocked_semester: String(row.unlocked_semester),
            model_brief_zh: String(row.model_brief_zh || ''),
          });
        }
      } catch {
        if (active) setDbModelInfo(null);
      }
    }
    loadFlagshipModelFromDb();
    return () => {
      active = false;
    };
  }, [currentLine.line_id, fallbackModelInfo.model_id]);

  const effectiveModelInfo = dbModelInfo || fallbackModelInfo;

  // 母题数据加载
  const [dbMasterExample, setDbMasterExample] = useState<LineMasterExample | null>(null);

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
            source: String(row.source || ''),
            stem_zh: String(row.stem_zh || ''),
            stem_en: String(row.stem_en || ''),
            options_json: row.options_json,
            correct_option: row.correct_option,
            dim1_origin: row.dim1_origin,
            dim2_essence: row.dim2_essence,
            dim3_rigor: String(row.dim3_rigor || ''),
            dim4_traps: row.dim4_traps,
            bound_line_id: String(row.bound_line_id || currentLine.line_id),
            empirical_scoring_rate: row.empirical_scoring_rate,
          });
        }
      } catch {
        if (active) setDbMasterExample(null);
      }
    }
    loadLineMaster();
    return () => {
      active = false;
    };
  }, [currentLine.line_id, currentLine.master_example_id]);

  const resolvedMasterExample: LineMasterExample | undefined =
    (masterExample && (masterExample.bound_line_id === currentLine.line_id || masterExample.bound_target_id === currentLine.line_id) ? masterExample : undefined) ||
    masterExample ||
    dbMasterExample ||
    undefined;

  return (
    <div
      className={`line-closed-loop ${className || ''}`}
      data-testid="line-closed-loop"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '1.5rem',
        borderRadius: 'var(--radius-card, 18px)',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.68))',
        backdropFilter: 'blur(24px)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.8))',
        boxShadow: 'var(--glass-shadow-deep, 0 20px 60px -10px rgba(0,20,60,0.12))',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* 1. 主线选择器：中文大类抽屉分组 */}
      <div
        className="line-selector-drawer"
        data-testid="line-selector-drawer"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          padding: '0.9rem 1.1rem',
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {locale === 'en' ? 'Core Logic Line Classification' : '主线知识谱系分组'}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            12 条主线全景闭环 · 跨学期演进
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {LINE_CATEGORY_GROUPS.map((group) => (
            <div
              key={group.domain}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                padding: '0.65rem 0.8rem',
                borderRadius: '12px',
                background: 'var(--glass-bg-elevated, #ffffff)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: group.themeColor,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: group.themeColor,
                  }}
                >
                  {group.domain}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {group.lines.map((item) => {
                  const active = item.id === currentLineId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`line-selector-${item.id}`}
                      onClick={() => handleLineChange(item.id)}
                      style={{
                        border: active ? `1.5px solid ${group.themeColor}` : '1px solid rgba(0, 0, 0, 0.08)',
                        background: active ? group.themeColor : 'rgba(0, 0, 0, 0.02)',
                        color: active ? '#ffffff' : 'var(--text-primary)',
                        padding: '0.28rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
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

      {/* 2. 顶栏：主线标识、领域色标与四位一体分段控制器 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBackToMap && (
            <button
              type="button"
              onClick={onBackToMap}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-pill, 9999px)',
                border: '1px solid rgba(0,0,0,0.12)',
                background: 'white',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>←</span>
              <span>{locale === 'en' ? 'Back to Map' : '返回图谱'}</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '8px',
                background: 'var(--ios-blue)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              {currentLine.line_id}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {locale === 'en' ? currentLine.name_en : currentLine.name_zh}
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ({currentLine.domain} · {currentLine.semester_span})
            </span>
          </div>
        </div>

        {/* 四位一体分段控制器 (Segmented Control) */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(0,0,0,0.06)',
            padding: '0.2rem',
            borderRadius: 'var(--radius-pill, 9999px)',
          }}
        >
          <button
            type="button"
            data-testid="tab-btn-lecture"
            onClick={() => handleTabClick('lecture')}
            style={{
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: activeTab === 'lecture' ? 'var(--glass-bg-elevated, #ffffff)' : 'transparent',
              fontWeight: activeTab === 'lecture' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.84rem',
              boxShadow: activeTab === 'lecture' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            ① 主线精讲
          </button>
          <button
            type="button"
            data-testid="tab-btn-master"
            onClick={() => handleTabClick('master')}
            style={{
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: activeTab === 'master' ? 'var(--glass-bg-elevated, #ffffff)' : 'transparent',
              fontWeight: activeTab === 'master' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.84rem',
              boxShadow: activeTab === 'master' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            ③ 主线母题
          </button>
          <button
            type="button"
            data-testid="tab-btn-practice"
            onClick={() => handleTabClick('practice')}
            style={{
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              background: activeTab === 'practice' ? 'var(--glass-bg-elevated, #ffffff)' : 'transparent',
              fontWeight: activeTab === 'practice' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '0.84rem',
              boxShadow: activeTab === 'practice' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            ④ 主线快练 (L4~L6)
          </button>
        </div>
      </div>

      {/* 3. ② 实验室二旗舰模型区域（跟随当前所选主线动态联动刷新） */}
      <div
        className="flagship-model-banner"
        data-testid="flagship-model-banner"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(88,86,214,0.08) 0%, rgba(175,82,222,0.12) 100%)',
          border: '1px solid rgba(175,82,222,0.25)',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <Icon name="flask" size={24} style={{ color: 'var(--ios-purple)', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                ② {locale === 'en' ? 'Flagship Leap Sandbox Model' : '实验室二旗舰模型'}：
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  color: 'var(--ios-purple)',
                  letterSpacing: '0.3px',
                }}
              >
                {effectiveModelInfo.model_id} · {effectiveModelInfo.model_name_zh}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  background: 'rgba(175, 82, 222, 0.15)',
                  color: 'var(--ios-purple)',
                }}
              >
                解锁学段: {effectiveModelInfo.unlocked_semester}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              核心导引：{effectiveModelInfo.model_brief_zh}
            </div>
          </div>
        </div>

        {onOpenFlagshipModel && (
          <button
            type="button"
            onClick={() => onOpenFlagshipModel(effectiveModelInfo.model_id)}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-pill, 9999px)',
              border: 'none',
              background: 'var(--ios-purple)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(175,82,222,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexShrink: 0,
            }}
          >
            <Icon name="rocket" size={14} />
            <span>{locale === 'en' ? 'Launch 4D Leap Lab →' : '进入 4D 变异探究 →'}</span>
          </button>
        )}
      </div>

      {/* 4. 主体切换视图 */}
      {/* ① 主线精讲 */}
      {activeTab === 'lecture' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* 1. 源头基石 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated, #ffffff)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="sprout" size={18} style={{ color: 'var(--ios-blue)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-blue)' }}>
                {locale === 'en' ? 'Origin & Foundation' : '源头基石'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? currentLine.origin_foundation_en || 'Conceptual origin of this logic line.'
                    : currentLine.origin_foundation_zh || '本主线的认知源头与现实数学抽象基石。'
                }
              />
            </div>
          </div>

          {/* 2. 螺旋跃迁 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated, #ffffff)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="spiral" size={18} style={{ color: 'var(--ios-indigo)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-indigo)' }}>
                {locale === 'en' ? 'Spiral Leaps' : '螺旋跃迁路径'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? currentLine.spiral_leaps_en || 'Evolutionary trajectory across semesters.'
                    : currentLine.spiral_leaps_zh || '跨学期知识演化与思维进阶轨迹。'
                }
              />
            </div>
          </div>

          {/* 3. 思想方法 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated, #ffffff)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="brain" size={18} style={{ color: 'var(--ios-green)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-green)' }}>
                {locale === 'en' ? 'Mathematical Methodology' : '核心思想方法'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? currentLine.methodology_en || 'Methodological mindset and core problem solving.'
                    : currentLine.methodology_zh || '数形结合、转化化归等数学思维方法精炼。'
                }
              />
            </div>
          </div>

          {/* 4. 中考矩阵 */}
          <div
            style={{
              padding: '1.1rem',
              borderRadius: '14px',
              background: 'var(--glass-bg-elevated, #ffffff)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Icon name="target" size={18} style={{ color: 'var(--ios-orange)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ios-orange)' }}>
                {locale === 'en' ? 'Exam Matrix' : '中考压轴矩阵'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <MathRenderer
                content={
                  locale === 'en'
                    ? currentLine.exam_matrix_en || 'High-frequency exam formats and trap analysis.'
                    : currentLine.exam_matrix_zh || '中考压轴题型、考频矩阵与生死解题红线。'
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ③ 主线母题展示 */}
      {activeTab === 'master' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {resolvedMasterExample ? (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '14px',
                background: 'var(--glass-bg-elevated, #ffffff)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              {/* 母题标头 & 得分率 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.6rem',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(0,113,227,0.1)',
                      color: 'var(--ios-blue)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      marginRight: '0.5rem',
                    }}
                  >
                    {resolvedMasterExample.example_id}
                  </span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {resolvedMasterExample.source}
                  </span>
                </div>

                {resolvedMasterExample.empirical_scoring_rate !== null &&
                  resolvedMasterExample.empirical_scoring_rate !== undefined && (
                    <div
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-pill, 9999px)',
                        background: 'rgba(255,59,48,0.1)',
                        color: 'var(--ios-red)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                      }}
                    >
                      官方实测得分率: {(resolvedMasterExample.empirical_scoring_rate * 100).toFixed(0)}%
                    </div>
                  )}
              </div>

              {/* 母题题干 (MathRenderer) */}
              <div style={{ fontSize: '0.96rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                <MathRenderer
                  content={locale === 'en' ? resolvedMasterExample.stem_en : resolvedMasterExample.stem_zh}
                />
              </div>

              {/* 1~4 维自适应解剖 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {resolvedMasterExample.dim1_origin && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(0,113,227,0.04)',
                      borderLeft: '3px solid var(--ios-blue)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-blue)', marginBottom: '0.25rem' }}>
                      ① 维度一：原点建模 / 题眼挖掘
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      <MathRenderer content={resolvedMasterExample.dim1_origin} />
                    </div>
                  </div>
                )}

                {resolvedMasterExample.dim2_essence && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(52,199,89,0.04)',
                      borderLeft: '3px solid var(--ios-green)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-green)', marginBottom: '0.25rem' }}>
                      ② 维度二：几何不变 / 本质直观
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      <MathRenderer content={resolvedMasterExample.dim2_essence} />
                    </div>
                  </div>
                )}

                {/* 维度三：严密推导 (必填推导) */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(88,86,214,0.05)',
                    borderLeft: '3px solid var(--ios-indigo)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-indigo)', marginBottom: '0.25rem' }}>
                    ③ 维度三：严密推导与生死红线 (必填推导)
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    <MathRenderer content={resolvedMasterExample.dim3_rigor} />
                  </div>
                </div>

                {resolvedMasterExample.dim4_traps && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(255,149,0,0.04)',
                      borderLeft: '3px solid var(--ios-orange)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ios-orange)', marginBottom: '0.25rem' }}>
                      ④ 维度四：极端反例与致命变式
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      <MathRenderer content={resolvedMasterExample.dim4_traps} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              未找到该主线的经典压轴母题数据。
            </div>
          )}
        </div>
      )}

      {/* ④ 主线快练 (嵌入式渲染，难度锁 L4~L6) */}
      {activeTab === 'practice' && (
        <LineQuickPractice
          lineId={currentLine.line_id}
          lineName={locale === 'en' ? currentLine.name_en : currentLine.name_zh}
          locale={locale}
        />
      )}
    </div>
  );
};
