import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  selectedGrade?: number;
  selectedSemester?: number | 'all';
  selectedDomain?: string; // 保留向后兼容
  selectedSubcategory?: string; // 保留向后兼容
  onSelectGrade?: (grade: number) => void;
  onSelectSemester?: (semester: number | 'all') => void;
  onSelectDomain?: (domain: string) => void; // 保留向后兼容
  onSelectSubcategory?: (subcategory: string) => void; // 保留向后兼容
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
  onSelectGrade,
  onSelectSemester,
  onSelectPoint,
  locale = 'zh-CN',
}) => {
  const isEn = String(locale).toLowerCase().startsWith('en');
  const effectiveLocale = (isEn ? 'en' : 'zh-CN') as Locale;
  const [searchQuery, setSearchQuery] = useState('');
  const responsive = useDeviceResponsive();
  const isMobile = responsive.isMobile;
  const isTablet = responsive.isTablet;

  // 1. 本地三级状态管理 (保持最后一次选择，默认同步当前考点所在的年级与学期/全部)
  const [grade, setGrade] = useState<number>(() => selectedGrade ?? currentPoint.grade ?? 7);
  const [semester, setSemester] = useState<number | 'all'>(() => selectedSemester ?? 'all');
  const activeItemRef = useRef<HTMLDivElement>(null);

  // 当外部传入的 selectedGrade / currentPoint 变化时同步
  useEffect(() => {
    if (selectedGrade !== undefined) {
      setGrade(selectedGrade);
    } else if (currentPoint?.grade) {
      setGrade(currentPoint.grade);
    }
  }, [selectedGrade, currentPoint?.grade]);

  useEffect(() => {
    if (selectedSemester !== undefined) {
      setSemester(selectedSemester);
    }
  }, [selectedSemester]);

  // 当抽屉打开且列表就绪时，平滑滚入当前考点
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isOpen, grade, semester]);

  // 2. 所有可用年级 (7, 8, 9)
  const availableGrades = useMemo(() => {
    const grades = Array.from(new Set(knowledgePoints.map((p) => p.grade))).sort();
    return grades.length ? grades : [7, 8, 9];
  }, [knowledgePoints]);

  // 3. 筛选第三级知识点列表 (直接支持 [全部]、[上学期]、[下学期])
  const filteredPoints = useMemo(() => {
    return knowledgePoints.filter((p) => {
      const matchGrade = p.grade === grade;
      const matchSemester = semester === 'all' || p.semester === semester;
      return matchGrade && matchSemester;
    });
  }, [knowledgePoints, grade, semester]);

  // 4. 全局搜索结果 (支持中英、编号、全拼、拼音首字母、单元名过滤)
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

  const handleGradeChange = (g: number) => {
    setGrade(g);
    onSelectGrade?.(g);
  };

  const handleSemesterChange = (s: number | 'all') => {
    setSemester(s);
    onSelectSemester?.(s);
  };

  const drawerContent = (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div
          data-testid="concept-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm animate-fadeIn"
        />
      )}

      {/* 三级抽屉选择器浮动面板 (手机端 Bottom Sheet / 平板端居中 / 桌面端 Popover) */}
      <aside
        data-testid="concept-tree-sidebar"
        className={`concept-drawer-panel ${isOpen ? 'is-open flex flex-col' : 'is-closed hidden'} ${
          isMobile
            ? 'fixed bottom-0 left-0 right-0 z-[100] w-full max-w-[100vw] h-[82vh] max-h-[82vh] rounded-t-[20px] shadow-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 border-b-0 overflow-hidden'
            : isTablet
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[680px] max-w-[92vw] h-[600px] max-h-[82vh] rounded-[20px] shadow-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 overflow-hidden'
            : 'absolute top-[calc(100%+10px)] left-0 z-[100] w-[700px] max-w-[94vw] max-h-[80vh] rounded-[20px] shadow-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 overflow-hidden'
        }`}
      >
        {/* 顶部居中药丸拖动手柄 (手机端) */}
        <div
          data-testid="drawer-drag-handle"
          className={`drawer-drag-handle w-9 h-1 rounded-full bg-black/20 mt-2 mx-auto shrink-0 ${isMobile ? 'block' : 'hidden'}`}
        />

        {/* 顶部搜索栏与关闭按钮 */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200/80 bg-slate-500/5">
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

        {/* 主体区：搜索模式 OR 标准三级联动模式 */}
        <div className="concept-drawer-body flex flex-1 min-h-0 overflow-hidden flex-col">
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
            /* 标准三级模式：年级 -> 学期(含全部) -> 知识点 */
            <div className="concept-drawer-columns flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* 顶部控制栏：第一级 · 年级 + 第二级 · 学期 */}
              <div className="concept-drawer-left-col p-4 pb-3 border-b border-slate-200/80 bg-slate-50/70 flex flex-col gap-2.5 shrink-0">
                {/* 第一级 · 年级 */}
                <div className="flex items-center gap-3">
                  <span className="text-[0.76rem] font-bold text-slate-500 shrink-0 w-24">
                    {locale === 'en' ? 'Level 1 · Grade:' : `第一级 · ${t('nav.grade', effectiveLocale, '年级')}:`}
                  </span>
                  <div className="flex gap-2 flex-1 max-w-xs">
                    {availableGrades.map((g) => {
                      const active = grade === g;
                      const label = locale === 'en' ? `Grade ${g}` : g === 7 ? '七年级' : g === 8 ? '八年级' : '九年级';
                      return (
                        <button
                          key={g}
                          type="button"
                          data-testid={`grade-btn-${g}`}
                          onClick={() => handleGradeChange(g)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-all duration-150 border ${
                            active
                              ? 'border-[#0071e3] bg-[#0071e3] text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 第二级 · 学期 (含「全部」) */}
                <div className="flex items-center gap-3">
                  <span className="text-[0.76rem] font-bold text-slate-500 shrink-0 w-24">
                    {locale === 'en' ? 'Level 2 · Semester:' : `第二级 · ${t('nav.semester', effectiveLocale, '学期')}:`}
                  </span>
                  <div className="flex gap-2 flex-1 max-w-sm">
                    {[
                      { val: 'all' as const, labelZh: '全部', labelEn: 'All' },
                      { val: 1 as const, labelZh: '上学期 (1)', labelEn: 'Sem 1 (Fall)' },
                      { val: 2 as const, labelZh: '下学期 (2)', labelEn: 'Sem 2 (Spring)' },
                    ].map((s) => {
                      const active = semester === s.val;
                      return (
                        <button
                          key={s.val}
                          type="button"
                          data-testid={`semester-btn-${s.val}`}
                          onClick={() => handleSemesterChange(s.val)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-all duration-150 border ${
                            active
                              ? 'border-[#0071e3] bg-[#0071e3] text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {locale === 'en' ? s.labelEn : s.labelZh}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 第三级 · 知识点网格列表 */}
              <div className="concept-drawer-right-col flex-1 p-4 overflow-y-auto flex flex-col min-h-0 bg-white">
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[0.78rem] font-bold text-slate-500">
                    {locale === 'en' ? 'Level 3 · Knowledge Points' : `第三级 · ${t('nav.points', effectiveLocale, '大纲考点')}`}
                  </label>
                  <span className="text-[0.72rem] text-slate-400">
                    {locale === 'en'
                      ? `${filteredPoints.length} Points · Click to switch`
                      : `共 ${filteredPoints.length} 个知识点 · 点击立即切换`}
                  </span>
                </div>

                <div
                  data-testid="concept-points-list"
                  className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5 pr-1`}
                >
                  {filteredPoints.map((pt) => {
                    const active = pt.point_id === currentPoint.point_id;
                    return (
                      <div
                        key={pt.point_id}
                        ref={active ? activeItemRef : undefined}
                        data-testid={`point-item-${pt.point_id}`}
                        onClick={() => handlePointClick(pt)}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-150 flex flex-col gap-1 border ${
                          active
                            ? 'border-[#0071e3] bg-[#0071e3]/10 shadow-sm ring-1 ring-[#0071e3]/40'
                            : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[0.75rem] font-bold ${active ? 'text-[#0071e3]' : 'text-slate-600'}`}>
                              {pt.point_id}
                            </span>
                            {active && (
                              <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-[#0071e3] text-white font-bold">
                                {locale === 'en' ? 'Current' : '当前'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {semester === 'all' && (
                              <span className="text-[0.68rem] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                {pt.grade}年级{pt.semester === 1 ? '上' : '下'}
                              </span>
                            )}
                            {pt.subcategory && (
                              <span className="text-[0.68rem] px-1.5 py-0.5 rounded bg-black/5 text-slate-500">
                                {isEn ? getSubcategoryName(pt.subcategory, true) : pt.subcategory}
                              </span>
                            )}
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
