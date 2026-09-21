import React, { useState, useMemo } from 'react';
import { KnowledgePointRecord } from './types';
import { EnrichedKnowledgePoint } from './allPointsData';
import { Icon } from '../../components/common/Icon';
import { t, Locale } from '../../engine/i18n/i18n';

export interface ConceptDrawerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgePoints: (KnowledgePointRecord | EnrichedKnowledgePoint)[];
  currentPoint: KnowledgePointRecord;
  selectedGrade: number;
  selectedSemester: number;
  selectedDomain: string;
  selectedSubcategory?: string;
  onSelectGrade: (grade: number) => void;
  onSelectSemester: (semester: number) => void;
  onSelectDomain: (domain: string) => void;
  onSelectSubcategory?: (subcategory: string) => void;
  onSelectPoint: (point: KnowledgePointRecord) => void;
  locale?: Locale | string;
}

export const ConceptDrawerSelector: React.FC<ConceptDrawerSelectorProps> = ({
  isOpen,
  onClose,
  knowledgePoints,
  currentPoint,
  selectedGrade,
  selectedSemester,
  selectedDomain,
  selectedSubcategory,
  onSelectGrade,
  onSelectSemester,
  onSelectDomain,
  onSelectSubcategory,
  onSelectPoint,
  locale = 'zh-CN',
}) => {
  const effectiveLocale = (locale === 'en' ? 'en' : 'zh-CN') as Locale;
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 所有可用年级
  const availableGrades = useMemo(() => {
    const grades = Array.from(new Set(knowledgePoints.map((p) => p.grade))).sort();
    return grades.length ? grades : [7, 8, 9];
  }, [knowledgePoints]);

  // 2. 当前年级下的可用学期
  const availableSemesters = useMemo(() => {
    const semesters = Array.from(
      new Set(knowledgePoints.filter((p) => p.grade === selectedGrade).map((p) => p.semester))
    ).sort();
    return semesters.length ? semesters : [1, 2];
  }, [knowledgePoints, selectedGrade]);

  // 3. 当前年级+学期下的可用领域
  const availableDomains = useMemo(() => {
    const domains = Array.from(
      new Set(
        knowledgePoints
          .filter((p) => p.grade === selectedGrade && p.semester === selectedSemester)
          .map((p) => p.domain)
      )
    );
    return domains.length ? domains : ['数与代数', '图形与几何'];
  }, [knowledgePoints, selectedGrade, selectedSemester]);

  // 4. 当前年级+学期下的可用课程单元 (15 个 subcategory)
  const availableSubcategories = useMemo(() => {
    const subcats = Array.from(
      new Set(
        knowledgePoints
          .filter((p) => p.grade === selectedGrade && p.semester === selectedSemester)
          .map((p) => p.subcategory)
      )
    );
    return subcats;
  }, [knowledgePoints, selectedGrade, selectedSemester]);

  // 5. 筛选考点列表
  const filteredPoints = useMemo(() => {
    return knowledgePoints.filter((p) => {
      const matchGrade = p.grade === selectedGrade;
      const matchSemester = p.semester === selectedSemester;
      if (selectedSubcategory) {
        return matchGrade && matchSemester && p.subcategory === selectedSubcategory;
      }
      return matchGrade && matchSemester && p.domain === selectedDomain;
    });
  }, [knowledgePoints, selectedGrade, selectedSemester, selectedDomain, selectedSubcategory]);

  // 6. 全局搜索结果 (支持中英、编号、全拼、拼音首字母、单元名过滤)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return knowledgePoints.filter((p: any) => {
      const idMatch = p.point_id.toLowerCase().includes(q);
      const nameZhMatch = p.name_zh.toLowerCase().includes(q);
      const nameEnMatch = (p.name_en || '').toLowerCase().includes(q);
      const subcatMatch = (p.subcategory || '').toLowerCase().includes(q);
      const pinyinMatch = (p.pinyin || '').toLowerCase().includes(q);
      const initialsMatch = (p.initials || '').toLowerCase().includes(q);
      const subPinyinMatch = (p.sub_pinyin || '').toLowerCase().includes(q);
      const subInitialsMatch = (p.sub_initials || '').toLowerCase().includes(q);
      return (
        idMatch ||
        nameZhMatch ||
        nameEnMatch ||
        subcatMatch ||
        pinyinMatch ||
        initialsMatch ||
        subPinyinMatch ||
        subInitialsMatch
      );
    });
  }, [knowledgePoints, searchQuery]);

  const handlePointClick = (point: KnowledgePointRecord) => {
    onSelectPoint(point);
    onClose();
  };

  return (
    <>
      {/* 遮罩层 (桌面端点击外部自然关闭) */}
      {isOpen && (
        <div
          data-testid="concept-drawer-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(0, 0, 0, 0.18)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* 4级抽屉选择器浮动面板 */}
      <aside
        data-testid="concept-tree-sidebar"
        className={`concept-drawer-panel ${isOpen ? 'is-open' : 'is-closed'}`}
        style={{
          display: isOpen ? 'flex' : 'none',
          flexDirection: 'column',
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: 0,
          zIndex: 100,
          width: '680px',
          maxWidth: '92vw',
          maxHeight: '78vh',
          background: 'var(--glass-bg-elevated, #ffffff)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.12))',
          borderRadius: 'var(--radius-lg, 20px)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.16)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          animation: 'drawerSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 顶部搜索栏与抽屉标题 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.08))',
            background: 'var(--bg-canvas, rgba(0, 0, 0, 0.02))',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.85rem',
              background: 'var(--bg-card, #ffffff)',
              borderRadius: 'var(--radius-pill, 9999px)',
              border: '1px solid var(--border-subtle, rgba(0, 0, 0, 0.15))',
            }}
          >
            <Icon name="search" size={15} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              data-testid="concept-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'en' ? 'Search points by name, pinyin, or KP-ID...' : '实时搜索考点名称、拼音或编号 (如: 配方法, pff, KP-023)...'}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0,
                  display: 'inline-flex',
                }}
              >
                <Icon name="x" size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            data-testid="drawer-close-btn"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--bg-card, rgba(0, 0, 0, 0.05))',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'background 0.15s ease',
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* 主体区：搜索结果 OR 4级级联筛选 */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {searchQuery ? (
            /* 搜索模式：直接展示全局匹配考点 */
            <div
              data-testid="search-results-container"
              style={{
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                {locale === 'en' ? `Found ${searchResults.length} matching points` : `找到 ${searchResults.length} 个相关考点`}
              </div>
              {searchResults.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  {locale === 'en' ? 'No matching knowledge points found' : '未找到匹配的大纲考点'}
                </div>
              ) : (
                searchResults.map((pt) => {
                  const active = pt.point_id === currentPoint.point_id;
                  return (
                    <div
                      key={pt.point_id}
                      data-testid={`search-item-${pt.point_id}`}
                      onClick={() => handlePointClick(pt)}
                      style={{
                        padding: '0.65rem 0.9rem',
                        borderRadius: 'var(--radius-md, 12px)',
                        border: active ? '1.5px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                        background: active ? 'var(--ios-blue-glow, rgba(0, 113, 227, 0.1))' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ios-blue)' }}>
                          {pt.point_id}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: active ? 700 : 500, color: 'var(--text-primary)' }}>
                          {locale === 'en' ? pt.name_en : pt.name_zh}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(0, 0, 0, 0.05)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {`${pt.grade}年级${pt.semester === 1 ? '上' : '下'} · ${pt.subcategory}`}
                        </span>
                        {pt.is_mandatory ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              background: 'var(--ios-red, #ff3b30)',
                              color: '#ffffff',
                              fontWeight: 600,
                            }}
                          >
                            必考
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* 正常 4 级下钻盒模式 */
            <div style={{ display: 'flex', width: '100%', minHeight: '380px' }}>
              {/* 左侧控制栏：1级年级 + 2级学期 + 3级领域/单元 */}
              <div
                style={{
                  width: '280px',
                  minWidth: '280px',
                  borderRight: '1px solid var(--border-subtle, rgba(0,0,0,0.08))',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  overflowY: 'auto',
                  background: 'var(--bg-canvas, rgba(0,0,0,0.01))',
                }}
              >
                {/* 1级: 年级选择 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    {`第一级 · ${t('nav.grade', effectiveLocale, '年级')}`}
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {availableGrades.map((g) => {
                      const active = selectedGrade === g;
                      const label = g === 7 ? '七年级' : g === 8 ? '八年级' : '九年级';
                      return (
                        <button
                          key={g}
                          type="button"
                          data-testid={`grade-btn-${g}`}
                          onClick={() => {
                            onSelectGrade(g);
                            const subPoints = knowledgePoints.filter((p) => p.grade === g);
                            if (subPoints.length > 0) {
                              onSelectSemester(subPoints[0].semester);
                              onSelectDomain(subPoints[0].domain);
                              onSelectSubcategory?.(subPoints[0].subcategory);
                            }
                          }}
                          style={{
                            flex: 1,
                            minHeight: '34px',
                            border: active ? '1.5px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm, 8px)',
                            background: active ? 'var(--ios-blue)' : 'var(--bg-card)',
                            color: active ? '#ffffff' : 'var(--text-primary)',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2级: 学期选择 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    {`第二级 · ${t('nav.semester', effectiveLocale, '学期')}`}
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {availableSemesters.map((s) => {
                      const active = selectedSemester === s;
                      const label = s === 1 ? '上学期 (1)' : '下学期 (2)';
                      return (
                        <button
                          key={s}
                          type="button"
                          data-testid={`semester-btn-${s}`}
                          onClick={() => {
                            onSelectSemester(s);
                            const subPoints = knowledgePoints.filter((p) => p.grade === selectedGrade && p.semester === s);
                            if (subPoints.length > 0) {
                              onSelectDomain(subPoints[0].domain);
                              onSelectSubcategory?.(subPoints[0].subcategory);
                            }
                          }}
                          style={{
                            flex: 1,
                            minHeight: '34px',
                            border: active ? '1.5px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm, 8px)',
                            background: active ? 'var(--ios-blue)' : 'var(--bg-card)',
                            color: active ? '#ffffff' : 'var(--text-primary)',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3级: 领域与课程单元 (15 个 subcategory 核心分类) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    {`第三级 · ${t('nav.domain', effectiveLocale, '领域')} / 课程单元`}
                  </label>

                  {/* 领域快速过滤 pills (保证 productShell 测试通过) */}
                  <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                    {availableDomains.map((dom) => {
                      const active = selectedDomain === dom && !selectedSubcategory;
                      return (
                        <button
                          key={dom}
                          type="button"
                          data-testid={`domain-btn-${dom}`}
                          onClick={() => {
                            onSelectDomain(dom);
                            onSelectSubcategory?.('');
                          }}
                          style={{
                            padding: '0.25rem 0.55rem',
                            border: active ? '1.5px solid var(--ios-indigo, #5856d6)' : '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm, 6px)',
                            background: active ? 'var(--ios-indigo, #5856d6)' : 'var(--bg-card)',
                            color: active ? '#ffffff' : 'var(--text-secondary)',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          {dom}
                        </button>
                      );
                    })}
                  </div>

                  {/* 课程单元列表 (15 个 subcategory) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {availableSubcategories.map((subcat) => {
                      const active = selectedSubcategory === subcat;
                      const count = knowledgePoints.filter(
                        (p) => p.grade === selectedGrade && p.semester === selectedSemester && p.subcategory === subcat
                      ).length;
                      return (
                        <button
                          key={subcat}
                          type="button"
                          data-testid={`subcategory-btn-${subcat}`}
                          onClick={() => {
                            onSelectSubcategory?.(subcat);
                            const found = knowledgePoints.find(
                              (p) => p.grade === selectedGrade && p.semester === selectedSemester && p.subcategory === subcat
                            );
                            if (found) {
                              onSelectDomain(found.domain);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.4rem 0.65rem',
                            borderRadius: 'var(--radius-sm, 6px)',
                            border: active ? '1.5px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                            background: active ? 'var(--ios-blue-glow, rgba(0, 113, 227, 0.1))' : 'var(--bg-card)',
                            color: active ? 'var(--ios-blue)' : 'var(--text-primary)',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span>{subcat}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.65 }}>{count} 考点</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 右侧大纲考点列表 (4级大纲考点) */}
              <div
                style={{
                  flex: 1,
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {`第四级 · ${t('nav.points', effectiveLocale, '大纲考点')}`}
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {filteredPoints.length} 个考点 · 点击立即切换
                  </span>
                </div>

                <div
                  data-testid="concept-points-list"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    paddingRight: '0.25rem',
                  }}
                >
                  {filteredPoints.map((pt) => {
                    const active = pt.point_id === currentPoint.point_id;
                    return (
                      <div
                        key={pt.point_id}
                        data-testid={`point-item-${pt.point_id}`}
                        onClick={() => handlePointClick(pt)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md, 10px)',
                          border: active ? '1.5px solid var(--ios-blue)' : '1px solid var(--border-subtle)',
                          background: active ? 'var(--ios-blue-glow, rgba(0, 113, 227, 0.12))' : 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: active ? 'var(--ios-blue)' : 'var(--text-secondary)' }}>
                            {pt.point_id}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                              {pt.subcategory}
                            </span>
                            {pt.is_mandatory ? (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.08rem 0.35rem',
                                  borderRadius: '3px',
                                  background: 'var(--ios-red, #ff3b30)',
                                  color: '#ffffff',
                                  fontWeight: 600,
                                }}
                              >
                                必考
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: active ? 700 : 500, color: 'var(--text-primary)' }}>
                          {locale === 'en' ? pt.name_en : pt.name_zh}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ConceptDrawerSelector;
