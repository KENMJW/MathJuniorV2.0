import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { KnowledgePointRecord } from './types';
import { EnrichedKnowledgePoint } from './allPointsData';
import { Icon } from '../../components/common/Icon';
import { t, Locale } from '../../engine/i18n/i18n';
import { useDeviceResponsive } from '../../hooks/useDeviceResponsive';

export const SUBCATEGORY_NAMES_EN: Record<string, string> = {
  '三角形': 'Triangles',
  '不等式': 'Inequalities',
  '代数式': 'Algebraic Expressions',
  '几何基础': 'Geometric Foundations',
  '函数': 'Functions',
  '分式': 'Rational Expressions',
  '四边形': 'Quadrilaterals',
  '图形变换': 'Geometric Transformations',
  '圆': 'Circles',
  '实数': 'Real Numbers',
  '数据分析': 'Data Analysis',
  '数据收集整理': 'Data Collection & Organization',
  '方程组': 'Systems of Equations',
  '概率': 'Probability',
  '锐角三角函数': 'Trigonometric Functions',
};

export function getSubcategoryName(subcat?: string, isEn: boolean = false): string {
  if (!subcat) return '';
  if (!isEn) return subcat;
  return SUBCATEGORY_NAMES_EN[subcat] || subcat;
}

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
  const isEn = String(locale).toLowerCase().startsWith('en');
  const effectiveLocale = (isEn ? 'en' : 'zh-CN') as Locale;
  const [searchQuery, setSearchQuery] = useState('');
  const responsive = useDeviceResponsive();
  const isMobile = responsive.isMobile;
  const isTablet = responsive.isTablet;

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

  const drawerContent = (
    <>
      {/* 遮罩层 (桌面端点击外部自然关闭) */}
      {isOpen && (
        <div
          data-testid="concept-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm animate-fadeIn"
        />
      )}

      {/* 4级抽屉选择器浮动面板 (手机端原生 iOS Bottom Sheet / 平板端居中模态 / 桌面端 Popover) */}
      <aside
        data-testid="concept-tree-sidebar"
        className={`concept-drawer-panel ${isOpen ? 'is-open flex flex-col' : 'is-closed hidden'} ${
          isMobile
            ? 'fixed bottom-0 left-0 right-0 z-[100] w-full max-w-[100vw] h-[82vh] max-h-[82vh] rounded-t-[20px] shadow-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 border-b-0 overflow-hidden'
            : isTablet
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[640px] max-w-[90vw] h-[560px] max-h-[80vh] rounded-[20px] shadow-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 overflow-hidden'
            : 'absolute top-[calc(100%+10px)] left-0 z-[100] w-[680px] max-w-[92vw] max-h-[78vh] rounded-[20px] shadow-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 overflow-hidden'
        }`}
      >
        {/* 顶部居中药丸拖动手柄 (手机端原生 iOS 视觉规范) */}
        <div
          data-testid="drawer-drag-handle"
          className={`drawer-drag-handle w-9 h-1 rounded-full bg-black/20 mt-2 mx-auto shrink-0 ${isMobile ? 'block' : 'hidden'}`}
        />
        {/* 顶部搜索栏与抽屉标题 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 bg-slate-500/5">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
            <Icon name="search" size={15} className="text-slate-400" />
            <input
              type="text"
              data-testid="concept-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'en' ? 'Search points by name, pinyin, or KP-ID...' : '实时搜索考点名称、拼音或编号 (如: 配方法, pff, KP-023)...'}
              className="flex-1 border-none outline-none bg-transparent text-[0.85rem] text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="border-none bg-transparent cursor-pointer text-slate-400 hover:text-slate-600 p-0 inline-flex"
              >
                <Icon name="x" size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            data-testid="drawer-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800 bg-black/5 hover:bg-black/10 transition-colors border-none"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* 主体区：搜索结果 OR 4级级联筛选 */}
        <div className="concept-drawer-body flex flex-1 min-h-0 overflow-hidden">
          {searchQuery ? (
            /* 搜索模式：直接展示全局匹配考点 */
            <div
              data-testid="search-results-container"
              className="flex-1 p-4 overflow-y-auto flex flex-col gap-2"
            >
              <div className="text-[0.78rem] text-slate-500 mb-1">
                {locale === 'en' ? `Found ${searchResults.length} matching points` : `找到 ${searchResults.length} 个相关考点`}
              </div>
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
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
                      className={`p-2.5 px-3.5 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-150 ${
                        active
                          ? 'border-[1.5px] border-[#0071e3] bg-[#0071e3]/10 shadow-sm'
                          : 'border border-slate-200/80 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[0.75rem] font-bold text-[#0071e3]">
                          {pt.point_id}
                        </span>
                        <span className={`text-[0.88rem] ${active ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {locale === 'en' ? pt.name_en : pt.name_zh}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.72rem] px-2 py-0.5 rounded bg-black/5 text-slate-500">
                          {isEn
                            ? `Grade ${pt.grade} Sem ${pt.semester} · ${(pt as any).subcategory_en || getSubcategoryName(pt.subcategory, true)}`
                            : `${pt.grade}年级${pt.semester === 1 ? '上' : '下'} · ${pt.subcategory}`}
                        </span>
                        {pt.is_mandatory ? (
                          <span className="text-[0.68rem] px-1.5 py-0.5 rounded bg-[#ff3b30] text-white font-semibold">
                            {locale === 'en' ? 'Core' : '必考'}
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
            <div className="concept-drawer-columns flex w-full min-h-[380px]">
              {/* 左侧控制栏：1级年级 + 2级学期 + 3级领域/单元 */}
              <div className="concept-drawer-left-col w-[280px] min-w-[280px] border-r border-slate-200/80 p-4 flex flex-col gap-3.5 overflow-y-auto bg-slate-500/5">
                {/* 1级与2级: 年级与学期选择 (移动端单行并排紧凑, 桌面端分块) */}
                <div className={`concept-drawer-level1-2-wrap flex ${isMobile ? 'flex-row gap-2' : 'flex-col gap-3.5'} w-full`}>
                  {/* 1级: 年级选择 */}
                  <div className={isMobile ? 'flex-[3]' : undefined}>
                    <label className={`concept-drawer-level-label ${isMobile ? 'hidden' : 'block'} text-[0.76rem] font-bold text-slate-500 mb-1.5`}>
                      {locale === 'en' ? 'Level 1 · Grade' : `第一级 · ${t('nav.grade', effectiveLocale, '年级')}`}
                    </label>
                    <div className="flex gap-1.5">
                      {availableGrades.map((g) => {
                        const active = selectedGrade === g;
                        const label = locale === 'en' ? `Grade ${g}` : g === 7 ? '七年级' : g === 8 ? '八年级' : '九年级';
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
                            className={`flex-1 ${isMobile ? 'min-h-[30px] text-[0.75rem] px-1' : 'min-h-[34px] text-[0.8rem]'} rounded-lg font-medium cursor-pointer transition-all duration-150 border ${
                              active
                                ? 'border-[#0071e3] bg-[#0071e3] text-white font-bold shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2级: 学期选择 */}
                  <div className={isMobile ? 'flex-[2]' : undefined}>
                    <label className={`concept-drawer-level-label ${isMobile ? 'hidden' : 'block'} text-[0.76rem] font-bold text-slate-500 mb-1.5`}>
                      {locale === 'en' ? 'Level 2 · Semester' : `第二级 · ${t('nav.semester', effectiveLocale, '学期')}`}
                    </label>
                    <div className="flex gap-1.5">
                      {availableSemesters.map((s) => {
                        const active = selectedSemester === s;
                        const label = locale === 'en' ? (s === 1 ? 'Sem 1 (Fall)' : 'Sem 2 (Spring)') : s === 1 ? '上学期 (1)' : '下学期 (2)';
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
                            className={`flex-1 ${isMobile ? 'min-h-[30px] text-[0.75rem] px-1' : 'min-h-[34px] text-[0.8rem]'} rounded-lg font-medium cursor-pointer transition-all duration-150 border ${
                              active
                                ? 'border-[#0071e3] bg-[#0071e3] text-white font-bold shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3级: 领域与课程单元 (15 个 subcategory 核心分类) */}
                <div>
                  <label className="block text-[0.76rem] font-bold text-slate-500 mb-1.5">
                    {locale === 'en' ? 'Level 3 · Domain / Unit' : `第三级 · ${t('nav.domain', effectiveLocale, '领域')} / 课程单元`}
                  </label>

                  {/* 领域快速过滤 pills (保证 productShell 测试通过) */}
                  <div className={`flex gap-1.5 mb-1.5 ${isMobile ? 'flex-nowrap overflow-x-auto no-scrollbar' : 'flex-wrap'}`}>
                    {availableDomains.map((dom) => {
                      const active = selectedDomain === dom && !selectedSubcategory;
                      const domLabel =
                        locale === 'en'
                          ? dom.includes('代数') || dom.includes('数与代数')
                            ? 'Number & Algebra'
                            : dom.includes('几何') || dom.includes('图形与几何')
                            ? 'Geometry'
                            : dom.includes('统计') || dom.includes('统计与概率')
                            ? 'Statistics & Probability'
                            : dom.includes('综合') || dom.includes('综合与实践')
                            ? 'Synthesis & Practice'
                            : dom
                          : dom;
                      return (
                        <button
                          key={dom}
                          type="button"
                          data-testid={`domain-btn-${dom}`}
                          onClick={() => {
                            onSelectDomain(dom);
                            onSelectSubcategory?.('');
                          }}
                          className={`px-2.5 py-1 rounded-md text-[0.74rem] font-medium cursor-pointer transition-all border ${
                            active
                              ? 'border-[#5856d6] bg-[#5856d6] text-white font-bold shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {domLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* 课程单元列表 (15 个 subcategory) */}
                  <div className="concept-drawer-subcat-list flex flex-col gap-1.5">
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
                          className={`flex items-center justify-between px-3 py-1.5 rounded-md text-[0.8rem] text-left cursor-pointer transition-all border ${
                            active
                              ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] font-bold'
                              : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{isEn ? getSubcategoryName(subcat, true) : subcat}</span>
                          <span className="text-[0.7rem] opacity-65">
                            {count} {isEn ? 'Points' : '考点'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 右侧大纲考点列表 (4级大纲考点) */}
              <div className="concept-drawer-right-col flex-1 p-4 flex flex-col min-h-0 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[0.78rem] font-bold text-slate-500">
                    {locale === 'en' ? 'Level 4 · Curriculum Points' : `第四级 · ${t('nav.points', effectiveLocale, '大纲考点')}`}
                  </label>
                  <span className="text-[0.72rem] text-slate-400">
                    {locale === 'en'
                      ? `${filteredPoints.length} Points · Click to switch`
                      : `${filteredPoints.length} 个考点 · 点击立即切换`}
                  </span>
                </div>

                <div
                  data-testid="concept-points-list"
                  className="flex flex-col gap-2 pr-1"
                >
                  {filteredPoints.map((pt) => {
                    const active = pt.point_id === currentPoint.point_id;
                    return (
                      <div
                        key={pt.point_id}
                        data-testid={`point-item-${pt.point_id}`}
                        onClick={() => handlePointClick(pt)}
                        className={`p-2.5 px-3.5 rounded-xl cursor-pointer transition-all duration-150 flex flex-col gap-1 border ${
                          active
                            ? 'border-[#0071e3] bg-[#0071e3]/12 shadow-sm'
                            : 'border-slate-200/80 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[0.72rem] font-bold ${active ? 'text-[#0071e3]' : 'text-slate-500'}`}>
                            {pt.point_id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[0.68rem] text-slate-400">
                              {pt.subcategory}
                            </span>
                            {pt.is_mandatory ? (
                              <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-[#ff3b30] text-white font-semibold">
                                {locale === 'en' ? 'Core' : '必考'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className={`text-[0.88rem] ${active ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                          {locale === 'en' ? (pt.name_en || pt.name_zh) : pt.name_zh}
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

  if (typeof document !== 'undefined' && (isMobile || isTablet) && document.body) {
    return createPortal(drawerContent, document.body);
  }

  return drawerContent;
};

export default ConceptDrawerSelector;
