import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Globe,
  ArrowRight,
  Zap,
  FlaskConical,
  Sprout,
  Scroll,
  Compass,
  Target,
  Activity,
} from 'lucide-react';
import { useSessionStore } from './store/sessionStore';
import { t } from './engine/i18n/i18n';
import { useDeviceResponsive } from './hooks/useDeviceResponsive';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { SystemFooter } from './components/common/SystemFooter';

interface SubjectCardItem {
  id: string;
  nameZh: string;
  nameEn: string;
  iconName: string;
  scopeZh: string;
  scopeEn: string;
  descriptionZh: string;
  descriptionEn: string;
}

const JUNIOR_OTHER_SUBJECTS: SubjectCardItem[] = [
  {
    id: 'physics',
    nameZh: '初中物理',
    nameEn: 'Junior Physics',
    iconName: 'zap',
    scopeZh: '八年级 · 九年级 (电光力热)',
    scopeEn: 'Grades 8-9 (Electricity, Optics, Mechanics, Heat)',
    descriptionZh: '力学模型 · 电路仿真 · 光学实验 · 能量守恒',
    descriptionEn: 'Mechanics, Circuits, Optics, and Energy Conservation.',
  },
  {
    id: 'chemistry',
    nameZh: '初中化学',
    nameEn: 'Junior Chemistry',
    iconName: 'flask',
    scopeZh: '九年级 (分子微观反应与实验)',
    scopeEn: 'Grade 9 (Microscopic Reactions & Experiments)',
    descriptionZh: '微观粒子 · 溶液酸碱 · 质量守恒 · 物质推断',
    descriptionEn: 'Microscopic Particles, Acids & Bases, Conservation of Mass.',
  },
  {
    id: 'biology',
    nameZh: '初中生物',
    nameEn: 'Junior Biology',
    iconName: 'sprout',
    scopeZh: '七年级 · 八年级 (生命演变)',
    scopeEn: 'Grades 7-8 (Life Evolution & Ecology)',
    descriptionZh: '细胞结构 · 遗传变异 · 生态平衡 · 实验探究',
    descriptionEn: 'Cell Structure, Genetics, Ecology, and Lab Inquiry.',
  },
  {
    id: 'chinese',
    nameZh: '初中语文',
    nameEn: 'Junior Chinese',
    iconName: 'scroll',
    scopeZh: '七~九年级 (文言断句思辨)',
    scopeEn: 'Grades 7-9 (Classical Texts & Critical Thinking)',
    descriptionZh: '文言文精析 · 现代文阅读 · 作文升格 · 素养积累',
    descriptionEn: 'Classical Chinese, Reading Comprehension, and Writing.',
  },
  {
    id: 'english',
    nameZh: '初中英语',
    nameEn: 'Junior English',
    iconName: 'globe',
    scopeZh: '七~九年级 (语篇完形进阶)',
    scopeEn: 'Grades 7-9 (Text Discourse & Cloze Mastery)',
    descriptionZh: '语法句式 · 完形填空 · 语法填空 · 考点冲刺',
    descriptionEn: 'Grammar, Cloze Test, Reading & Writing Mastery.',
  },
  {
    id: 'history',
    nameZh: '初中历史',
    nameEn: 'Junior History',
    iconName: 'compass',
    scopeZh: '七~九年级 (时空演进轴线)',
    scopeEn: 'Grades 7-9 (Temporal & Spatial Evolution)',
    descriptionZh: '时空观念 · 史料实证 · 唯物史观 · 历史解释',
    descriptionEn: 'Time & Space, Historical Evidence, and Materialism.',
  },
  {
    id: 'geography',
    nameZh: '初中地理',
    nameEn: 'Junior Geography',
    iconName: 'compass',
    scopeZh: '七年级 · 八年级 (地形与气候)',
    scopeEn: 'Grades 7-8 (Topography & Climate)',
    descriptionZh: '经纬等高 · 区域认知 · 人地协调 · 综合思维',
    descriptionEn: 'Coordinates, Regional Cognition, and Human-Nature Harmony.',
  },
];

const PRIMARY_SUBJECTS: SubjectCardItem[] = [
  {
    id: 'primary-math',
    nameZh: '小学数学',
    nameEn: 'Primary Math',
    iconName: 'target',
    scopeZh: '一至六年级 (数感与图形空间)',
    scopeEn: 'Grades 1-6 (Number Sense & Geometry)',
    descriptionZh: '具象操作 · 计算法则 · 空间表象 · 逻辑启蒙',
    descriptionEn: 'Concrete Manipulation, Operations, Spatial Reasoning.',
  },
  {
    id: 'primary-chinese',
    nameZh: '小学语文',
    nameEn: 'Primary Chinese',
    iconName: 'scroll',
    scopeZh: '一至六年级 (字词积累与表达)',
    scopeEn: 'Grades 1-6 (Vocabulary & Expression)',
    descriptionZh: '汉字源流 · 朗读感悟 · 看图写话 · 经典诵读',
    descriptionEn: 'Etymology, Reading Aloud, and Creative Expression.',
  },
  {
    id: 'primary-english',
    nameZh: '小学英语',
    nameEn: 'Primary English',
    iconName: 'globe',
    scopeZh: '三至六年级 (自然拼读与对话)',
    scopeEn: 'Grades 3-6 (Phonics & Dialogue)',
    descriptionZh: '自然拼读 · 场景交际 · 绘本分级 · 韵律语感',
    descriptionEn: 'Phonics, Dialogues, and Leveled Readers.',
  },
  {
    id: 'primary-science',
    nameZh: '小学科学',
    nameEn: 'Primary Science',
    iconName: 'flask',
    scopeZh: '一至六年级 (微观观察与实验)',
    scopeEn: 'Grades 1-6 (Observation & Experiments)',
    descriptionZh: '自然观察 · 动手实验 · 科学猜想 · 探究素养',
    descriptionEn: 'Natural Observation, Hands-on Lab, Inquiry Literacy.',
  },
];

const SENIOR_SUBJECTS: SubjectCardItem[] = [
  {
    id: 'senior-math',
    nameZh: '高中数学',
    nameEn: 'Senior Math',
    iconName: 'target',
    scopeZh: '高一至高三 (函数导数与解析几何)',
    scopeEn: 'Grades 10-12 (Functions, Calculus, Conic Sections)',
    descriptionZh: '导数单调性 · 极值点偏移 · 圆锥曲线 · 向量空间',
    descriptionEn: 'Derivatives, Conic Sections, and Vector Spaces.',
  },
  {
    id: 'senior-physics',
    nameZh: '高中物理',
    nameEn: 'Senior Physics',
    iconName: 'zap',
    scopeZh: '高一至高三 (牛顿力学、电磁场与相对论)',
    scopeEn: 'Grades 10-12 (Mechanics, Electromagnetism, Relativity)',
    descriptionZh: '动量动能 · 复合场轨迹 · 电磁感应 · 波动光学',
    descriptionEn: 'Momentum, Energy, Electromagnetic Induction.',
  },
  {
    id: 'senior-chemistry',
    nameZh: '高中化学',
    nameEn: 'Senior Chemistry',
    iconName: 'flask',
    scopeZh: '高一至高三 (反应原理、物质结构与有机)',
    scopeEn: 'Grades 10-12 (Thermodynamics, Structure, Organic)',
    descriptionZh: '化学平衡 · 电化学基础 · 晶胞结构 · 有机合成',
    descriptionEn: 'Chemical Equilibrium, Electrochemistry, Synthesis.',
  },
  {
    id: 'senior-biology',
    nameZh: '高中生物',
    nameEn: 'Senior Biology',
    iconName: 'sprout',
    scopeZh: '高一至高三 (分子细胞、遗传进化与稳态)',
    scopeEn: 'Grades 10-12 (Molecular Biology, Genetics, Homeostasis)',
    descriptionZh: '光合呼吸 · 减数分裂 · 基因工程 · 神经体液',
    descriptionEn: 'Cellular Respiration, Meiosis, Genetic Engineering.',
  },
];

function renderSubjectIcon(iconName: string) {
  switch (iconName) {
    case 'zap':
      return <Zap className="w-5 h-5 text-ios-blue" strokeWidth={1.8} />;
    case 'flask':
      return <FlaskConical className="w-5 h-5 text-ios-blue" strokeWidth={1.8} />;
    case 'sprout':
      return <Sprout className="w-5 h-5 text-ios-blue" strokeWidth={1.8} />;
    case 'scroll':
      return <Scroll className="w-5 h-5 text-ios-blue" strokeWidth={1.8} />;
    case 'globe':
      return <Globe className="w-5 h-5 text-ios-blue" strokeWidth={1.8} />;
    case 'compass':
      return <Compass className="w-5 h-5 text-ios-blue" strokeWidth={1.8} />;
    case 'target':
    default:
      return <Target className="w-5 h-5 text-ios-blue" strokeWidth={1.8} />;
  }
}

export const AllSubjectsPortal: React.FC = () => {
  const navigate = useNavigate();
  const locale = useSessionStore((state) => state.locale);
  const setLocale = useSessionStore((state) => state.setLocale);
  const { isMobile } = useDeviceResponsive();
  const [selectedStage, setSelectedStage] = useState<'primary' | 'junior' | 'senior'>('junior');

  // 学科记忆直接直达 (TASK-FE-0020 步骤 3)
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const preferred = localStorage.getItem('preferred_subject');
      const search = window.location.hash || window.location.search;
      if (preferred === 'math_junior' && !search.includes('bypass_redirect=true')) {
        navigate('/math-junior/concept', { replace: true });
      }
    }
  }, [navigate]);

  const handleEnterJuniorMath = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('preferred_subject', 'math_junior');
    }
    navigate('/math-junior/concept');
  };

  const juniorMetrics = [
    { value: '107', label: locale === 'en' ? 'Four-Stage Lectures' : '考点名师四段论' },
    { value: '12', label: locale === 'en' ? 'Cross-Term Logic Lines' : '跨学期逻辑主线' },
    { value: '36', label: locale === 'en' ? 'Dynamic Sandboxes' : '4D动态不变量沙盒' },
    { value: '119', label: locale === 'en' ? 'Dissected Master Examples' : '全解剖黄金母题' },
  ];

  const primaryMetrics = [
    { value: '48', label: locale === 'en' ? 'Intuitive Points' : '直观考点精讲' },
    { value: '6', label: locale === 'en' ? 'Foundational Models' : '启蒙思维模型' },
    { value: '24', label: locale === 'en' ? 'Tactile Sandboxes' : '具象动手沙盒' },
    { value: '56', label: locale === 'en' ? 'Inquiry Examples' : '素养探究母题' },
  ];

  const seniorMetrics = [
    { value: '142', label: locale === 'en' ? 'Gaokao Points' : '高考考点精讲' },
    { value: '18', label: locale === 'en' ? 'Core Thought Models' : '底层思想模型' },
    { value: '45', label: locale === 'en' ? 'Dynamic Sandboxes' : '高维动力沙盒' },
    { value: '180', label: locale === 'en' ? 'Capstone Examples' : '全真压轴母题' },
  ];

  // 6 维核心素养雷达图数据
  const radarDimensions = [
    { labelZh: '数学抽象', labelEn: 'Abstraction', value: 92 },
    { labelZh: '逻辑推理', labelEn: 'Reasoning', value: 95 },
    { labelZh: '数学建模', labelEn: 'Modeling', value: 88 },
    { labelZh: '直观想象', labelEn: 'Intuition', value: 94 },
    { labelZh: '数学运算', labelEn: 'Operations', value: 90 },
    { labelZh: '数据分析', labelEn: 'Data Analysis', value: 86 },
  ];

  const renderMetricGrid = (metrics: Array<{ value: string; label: string }>) => (
    <div
      data-testid="stats-metric-grid"
      className="grid grid-cols-2 md:grid-cols-4 bg-card-subtle border border-border-subtle rounded-md overflow-hidden mb-6"
    >
      {metrics.map((item, idx) => (
        <div
          key={idx}
          className={`p-3 md:p-4 box-border ${
            idx % 2 === 0 ? 'border-r border-border-subtle md:border-r' : 'md:border-r'
          } ${idx < 2 ? 'border-b md:border-b-0 border-border-subtle' : ''} ${
            idx === 3 ? 'md:border-r-0' : ''
          }`}
        >
          <span className="text-xl md:text-2xl font-bold tracking-tight text-text-primary block leading-tight">
            {item.value}
          </span>
          <span className="text-[11px] text-text-tertiary mt-0.5 font-medium block truncate">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );

  const renderGaussianSvg = (asWatermark: boolean) => (
    <div
      className={
        asWatermark
          ? 'absolute -right-5 -bottom-4 w-[280px] h-[180px] pointer-events-none opacity-20 z-0'
          : 'relative hidden md:flex items-center justify-center shrink-0 w-[320px] lg:w-[360px]'
      }
    >
      <svg
        viewBox="0 0 360 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="gaussAreaGrad" x1="180" y1="45" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0071e3" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#0071e3" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0071e3" stopOpacity="0.0" />
          </linearGradient>
          <filter id="glowExtremum" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0071e3" floodOpacity="0.5" />
          </filter>
        </defs>

        <line x1="30" y1="180" x2="330" y2="180" stroke="#0071e3" strokeOpacity="0.15" strokeWidth="1.5" />
        <line x1="30" y1="130" x2="330" y2="130" stroke="#0071e3" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="30" y1="80" x2="330" y2="80" stroke="#0071e3" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="180" y1="20" x2="180" y2="190" stroke="#0071e3" strokeOpacity="0.15" strokeWidth="1.5" />

        <line x1="125" y1="105" x2="125" y2="180" stroke="#0071e3" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1="235" y1="105" x2="235" y2="180" stroke="#0071e3" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />

        <path
          d="M 40 180 C 90 180, 120 110, 150 65 C 165 42, 195 42, 210 65 C 240 110, 270 180, 320 180 Z"
          fill="url(#gaussAreaGrad)"
        />

        <path
          d="M 40 180 C 90 180, 120 110, 150 65 C 165 42, 195 42, 210 65 C 240 110, 270 180, 320 180"
          stroke="#0071e3"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        <line x1="140" y1="50" x2="220" y2="50" stroke="#0071e3" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="4 2" />

        <circle cx="180" cy="50" r="14" fill="#0071e3" fillOpacity="0.1" />
        <circle cx="180" cy="50" r="6" fill="#0071e3" fillOpacity="0.35" filter="url(#glowExtremum)" />
        <circle cx="180" cy="50" r="3" fill="#0071e3" />

        <text x="180" y="34" textAnchor="middle" fill="#0071e3" fontSize="11" fontWeight="600">
          {locale === 'en' ? 'Max (μ, σ)' : '极大值 (μ, σ)'}
        </text>
        <text x="125" y="196" textAnchor="middle" fill="#86868b" fontSize="10">μ - σ</text>
        <text x="180" y="196" textAnchor="middle" fill="#0071e3" fontSize="10" fontWeight="600">μ</text>
        <text x="235" y="196" textAnchor="middle" fill="#86868b" fontSize="10">μ + σ</text>
      </svg>
    </div>
  );

  const renderSubjectGrid = (subjects: SubjectCardItem[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 box-border">
      {subjects.map((sub) => (
        <div
          key={sub.id}
          className="group relative bg-card border border-border-subtle rounded-md p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-md hover:border-black/15 cursor-default"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-card-subtle flex items-center justify-center border border-border-subtle">
                  {renderSubjectIcon(sub.iconName)}
                </div>
                <h4 className="m-0 text-sm font-semibold text-text-primary">
                  {locale === 'en' ? sub.nameEn : sub.nameZh}
                </h4>
              </div>
              <Badge variant="pending" className="text-[10px]">
                {locale === 'en' ? 'Coming Soon' : '即将推出'}
              </Badge>
            </div>
            <p className="text-xs text-text-tertiary mb-2 font-medium">
              {locale === 'en' ? sub.scopeEn : sub.scopeZh}
            </p>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
              {locale === 'en' ? sub.descriptionEn : sub.descriptionZh}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-tertiary">
            <span>{locale === 'en' ? 'Curriculum Model Preparation' : '大纲模型筹备中'}</span>
            <span className="font-medium text-text-quaternary group-hover:text-text-secondary transition-colors">
              →
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      id="all-subjects-portal"
      data-testid="all-subjects-portal"
      className="all-subjects-portal min-h-screen bg-page text-text-primary relative selection:bg-ios-blue selection:text-white"
    >
      {/* 空间氛围高斯微光 (对标 ios27_demo.html) */}
      <div className="ambient-glow-mesh pointer-events-none" aria-hidden="true">
        <div className="ambient-glow-top" />
      </div>

      {/* 顶部固定系统栏 (54px 对标 ios27_demo.html) */}
      <header className="sticky top-0 z-50 w-full bg-page/85 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-[1140px] mx-auto h-[54px] px-4 sm:px-6 flex items-center justify-between">
          {/* 品牌 Cluster */}
          <div className="flex items-center gap-2.5 select-none cursor-pointer" onClick={() => setSelectedStage('junior')}>
            <div className="w-7 h-7 rounded-[7px] bg-text-primary text-white flex items-center justify-center shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 22 22 22 12 2" stroke="#fff" fill="none" />
                <circle cx="12" cy="14" r="2" fill="#fff" stroke="none" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold tracking-tight text-text-primary">
                全科核心素养提分系统
              </span>
              <span className="hidden sm:inline-block text-[11px] text-text-tertiary font-normal">
                精准提分 · 深度探究 · 考霸思维
              </span>
            </div>
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center gap-2">
            {/* 学员模式 Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-pill bg-white border border-border-subtle text-text-secondary text-xs font-medium shadow-sm">
              <GraduationCap className="w-3.5 h-3.5 text-text-secondary" />
              <span>学员模式</span>
            </div>

            {/* 语言切换 Pill */}
            <Button
              variant="pill"
              size="sm"
              onClick={() => setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')}
              className="h-8 gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{locale === 'zh-CN' ? 'EN' : '中'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 主体画布 */}
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-6 pb-20 relative z-10">
        {/* 三学段分段切换器 (stage-segmented-control) */}
        <div className="flex justify-center mb-7 sm:mb-9">
          <div
            data-testid="stage-segmented-control"
            className="stage-segmented-control inline-flex bg-black/[0.04] p-1 rounded-pill border border-black/[0.03] gap-1"
          >
            <button
              type="button"
              data-testid="stage-tab-primary"
              onClick={() => setSelectedStage('primary')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-pill text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedStage === 'primary'
                  ? 'bg-white text-text-primary font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>小学教育</span>
            </button>
            <button
              type="button"
              data-testid="stage-tab-junior"
              onClick={() => setSelectedStage('junior')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-pill text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedStage === 'junior'
                  ? 'bg-ios-blue text-white font-semibold shadow-[0_2px_8px_rgba(0,113,227,0.3)]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>初中突破</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-pill font-bold ${selectedStage === 'junior' ? 'bg-white/20 text-white' : 'bg-ios-blue text-white'}`}>
                首发
              </span>
            </button>
            <button
              type="button"
              data-testid="stage-tab-senior"
              onClick={() => setSelectedStage('senior')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-pill text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedStage === 'senior'
                  ? 'bg-white text-text-primary font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>高中决胜</span>
            </button>
          </div>
        </div>

        {/* STAGE 2: 初中突破专区 (默认展示) */}
        {selectedStage === 'junior' && (
          <div className="flex flex-col">
            {/* 初中数学旗舰卡 (junior-math-flagship-card) */}
            <section
              data-testid="junior-math-flagship-card"
              onClick={handleEnterJuniorMath}
              className="group relative bg-white border border-border-subtle rounded-lg p-5 sm:p-7 lg:p-9 mb-8 sm:mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:border-ios-blue/30 cursor-pointer flex flex-col md:flex-row justify-between items-stretch md:items-center overflow-hidden"
            >
              {/* 手机端半透明高斯背景水印 */}
              {isMobile && renderGaussianSvg(true)}

              <div className="relative z-10 max-w-full md:max-w-[560px] lg:max-w-[660px] flex flex-col flex-1">
                {/* 状态徽章与学段标签 */}
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-[rgba(52,199,89,0.08)] text-[#248a3d] text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] inline-block" />
                    <span>{locale === 'en' ? 'Ready · Click to Enter' : '已全量就绪 · 点击进入'}</span>
                  </span>
                  <span className="text-xs text-ios-blue font-medium">
                    {locale === 'en' ? 'Grades 7-9 Full Scope' : '7~9年级全学段'}
                  </span>
                </div>

                {/* 主标题与工坊标识 */}
                <div className="flex items-baseline gap-2.5 flex-wrap mb-2.5">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-text-primary m-0">
                    {locale === 'en'
                      ? 'Junior Math Core Competency Elevation System'
                      : '初中数学核心素养提分系统'}
                  </h2>
                  <span className="text-[11px] font-semibold text-ios-blue bg-ios-blue-tint px-2 py-0.5 rounded-pill">
                    初中数学核心素养工坊
                  </span>
                </div>

                {/* 核心文案 */}
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-5 sm:mb-6">
                  {locale === 'en'
                    ? 'Completely break rote memorization! Exclusive 107 syllabus point four-stage lectures, 12 underlying logic lines, 36 exam-winning 4D dynamic sandboxes, and dual-column real mock exam workbench.'
                    : '彻底打破死记硬背！独家构建 107 大纲考点四段论、12 底层数学主线思维图谱、36 中考压轴跃迁动力学沙盒、以及双栏印刷全真模考系统。'}
                </p>

                {/* 4 大指标网格 */}
                {renderMetricGrid(juniorMetrics)}

                {/* 主 CTA 按钮 */}
                <div className="w-full sm:w-auto">
                  <Button
                    type="button"
                    data-testid="enter-math-junior-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnterJuniorMath();
                    }}
                    className="w-full sm:w-auto h-11 px-6 text-sm font-semibold rounded-pill bg-ios-blue text-white shadow-sm hover:bg-ios-blue/90 gap-2 flex items-center justify-center cursor-pointer"
                  >
                    <span>{t('portal.math.enter', locale, '进入初中数学工坊')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 平板与桌面端高斯正态分布曲线 */}
              {!isMobile && renderGaussianSvg(false)}
            </section>

            {/* 六维核心素养雷达总盘 */}
            <section className="bg-card border border-border-subtle rounded-lg p-5 sm:p-7 mb-8 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-5 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-ios-blue" />
                  <h3 className="m-0 text-base font-semibold text-text-primary">
                    {locale === 'en' ? 'Six Core Competency Literacy Overview' : '初中数学六维核心素养大盘'}
                  </h3>
                </div>
                <span className="text-xs text-text-tertiary">
                  {locale === 'en' ? 'Comprehensive growth tracking system' : '国家新课标素养矩阵动态透视'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {radarDimensions.map((dim, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card-subtle rounded-md border border-border-subtle flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-xl font-bold text-ios-blue">{dim.value}%</span>
                    <span className="text-xs font-semibold text-text-primary mt-1">
                      {locale === 'en' ? dim.labelEn : dim.labelZh}
                    </span>
                    <span className="text-[10px] text-text-tertiary mt-0.5">
                      {locale === 'en' ? 'Mastery Level' : '掌握度评估'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 其余 7 学科矩阵 */}
            <section className="flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-4 pb-2 border-b border-border-subtle">
                <h3 className="m-0 text-base font-semibold text-text-primary">
                  {locale === 'en' ? 'Junior Subjects Matrix (7 In Development)' : '初中全科素养矩阵 (7 大学科筹备中)'}
                </h3>
                <span className="text-xs text-text-tertiary">
                  {locale === 'en' ? 'Systematic integration under isomorphic standards' : '按照同构标准有序接入'}
                </span>
              </div>

              {renderSubjectGrid(JUNIOR_OTHER_SUBJECTS)}
            </section>
          </div>
        )}

        {/* STAGE 1: 小学教育 */}
        {selectedStage === 'primary' && (
          <div className="flex flex-col">
            <section className="bg-card border border-border-subtle rounded-lg p-5 sm:p-7 mb-8 shadow-sm">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="pending" className="text-[11px]">
                    ● {locale === 'en' ? 'In Development · Grades 1-6' : '筹备中 · 一至六年级'}
                  </Badge>
                  <span className="text-xs text-ios-blue font-medium">小学直观素养模型</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
                  {locale === 'en' ? 'Primary Mathematics Intuitive Literacy System' : '小学数学直观素养启蒙系统'}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-5">
                  让孩子在具象图形与动手探究中真正爱上数学！独家构建 48 核心素养直观图谱、6 大启蒙思维模型、24 具象互动沙盒与 56 黄金母题。
                </p>
                {renderMetricGrid(primaryMetrics)}
              </div>
            </section>

            <section className="flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-subtle">
                <h3 className="m-0 text-base font-semibold text-text-primary">小学启蒙学科矩阵</h3>
                <span className="text-xs text-text-tertiary">按照同构标准有序接入</span>
              </div>
              {renderSubjectGrid(PRIMARY_SUBJECTS)}
            </section>
          </div>
        )}

        {/* STAGE 3: 高中决胜 */}
        {selectedStage === 'senior' && (
          <div className="flex flex-col">
            <section className="bg-card border border-border-subtle rounded-lg p-5 sm:p-7 mb-8 shadow-sm">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="pending" className="text-[11px]">
                    ● {locale === 'en' ? 'In Development · Grades 10-12' : '筹备中 · 高一至高三'}
                  </Badge>
                  <span className="text-xs text-ios-blue font-medium">高阶建模与压轴突破</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
                  {locale === 'en' ? 'Senior Math Advanced Modeling System' : '高中数学高阶建模与压轴突破系统'}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-5">
                  精准突破高考压轴难题！独家构建 142 考点四段论、18 底层数学思想模型、45 高维动力学沙盒与 180 压轴母题。
                </p>
                {renderMetricGrid(seniorMetrics)}
              </div>
            </section>

            <section className="flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-subtle">
                <h3 className="m-0 text-base font-semibold text-text-primary">高中决胜学科矩阵</h3>
                <span className="text-xs text-text-tertiary">按照同构标准有序接入</span>
              </div>
              {renderSubjectGrid(SENIOR_SUBJECTS)}
            </section>
          </div>
        )}
        <SystemFooter />
      </main>
    </div>
  );
};

export default AllSubjectsPortal;
