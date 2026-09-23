/**
 * 满分制体系规范与预设卷库定义 (任务 17.1, PRD §5.4, 设计文档 §7.4 子系统 A)
 *
 * 严格遵照 PRD 5.4 满分制数字规范：
 * - 100分标准制 (27题): 15选择 (30分) + 5填空 (10分) + 7解答 (60分), 限时 120 分钟
 * - 120分中考制 (24题): 10选择 (30分) + 6填空 (18分) + 8解答 (72分), 限时 120 分钟
 * - 150分大考制 (25题): 10选择 (40分) + 6填空 (24分) + 9解答 (86分), 限时 120 分钟
 */

export type FullScoreSystem = '100' | '120' | '150';

export interface ScoreSystemSpec {
  id: FullScoreSystem;
  nameZh: string;
  nameEn: string;
  totalScore: number;
  totalQuestions: number;
  timeLimitMinutes: number;
  choiceCount: number;
  choiceTotalScore: number;
  fillCount: number;
  fillTotalScore: number;
  solutionCount: number;
  solutionTotalScore: number;
}

/**
 * 满分制三大体系标准定义 (SSOT)
 */
export const FULL_SCORE_SYSTEMS: Record<FullScoreSystem, ScoreSystemSpec> = {
  '100': {
    id: '100',
    nameZh: '100分标准制 (27题)',
    nameEn: '100-Point Standard (27 Questions)',
    totalScore: 100,
    totalQuestions: 27,
    timeLimitMinutes: 120,
    choiceCount: 15,
    choiceTotalScore: 30, // 每题 2 分
    fillCount: 5,
    fillTotalScore: 10,   // 每题 2 分
    solutionCount: 7,
    solutionTotalScore: 60,
  },
  '120': {
    id: '120',
    nameZh: '120分中考制 (24题)',
    nameEn: '120-Point High School Entrance (24 Questions)',
    totalScore: 120,
    totalQuestions: 24,
    timeLimitMinutes: 120,
    choiceCount: 10,
    choiceTotalScore: 30, // 每题 3 分
    fillCount: 6,
    fillTotalScore: 18,   // 每题 3 分
    solutionCount: 8,
    solutionTotalScore: 72,
  },
  '150': {
    id: '150',
    nameZh: '150分大考制 (25题)',
    nameEn: '150-Point Comprehensive (25 Questions)',
    totalScore: 150,
    totalQuestions: 25,
    timeLimitMinutes: 120,
    choiceCount: 10,
    choiceTotalScore: 40, // 每题 4 分
    fillCount: 6,
    fillTotalScore: 24,   // 每题 4 分
    solutionCount: 9,
    solutionTotalScore: 86,
  },
};

export interface PresetPaper {
  id: string;
  titleZh: string;
  titleEn: string;
  category: 'gradient' | 'standard' | 'semester';
  icon: string;
  scoreSystem: FullScoreSystem;
  difficultyTagZh: string;
  difficultyTagEn: string;
  difficultyDistribution: [number, number, number, number, number]; // L1~L5 占比 (和为 100)
  targetGrade?: number;
  targetSemester?: number;
  descriptionZh: string;
  descriptionEn: string;
  selectedKpIds: string[];
}

// 基础课标核心考点 ID 清单
export const ALL_CORE_KP_IDS = [
  'KP-001', 'KP-005', 'KP-008', 'KP-009', 'KP-010', 'KP-012',
  'KP-015', 'KP-018', 'KP-020', 'KP-023', 'KP-024', 'KP-028',
  'KP-030', 'KP-032', 'KP-035', 'KP-040', 'KP-042', 'KP-045', 'KP-050'
];

// 七年级核心考点 ID 清单 (7上 + 7下 全量考点)
export const GRADE_7_KP_IDS = [
  'KP-001', 'KP-002', 'KP-003', 'KP-004', 'KP-005', 'KP-006', 'KP-007',
  'KP-008', 'KP-009', 'KP-010', 'KP-019', 'KP-020', 'KP-027', 'KP-028',
  'KP-029', 'KP-031', 'KP-044', 'KP-045', 'KP-046', 'KP-047', 'KP-048',
  'KP-049', 'KP-050', 'KP-080', 'KP-092', 'KP-093', 'KP-094', 'KP-095',
  'KP-097', 'KP-098', 'KP-099', 'KP-100',
];

// 七年级上学期核心考点 ID 清单 (7上 全量考点，共 19 个)
export const GRADE_7_1_KP_IDS = [
  'KP-001', 'KP-002', 'KP-003', 'KP-004', 'KP-009', 'KP-010', 'KP-019',
  'KP-044', 'KP-045', 'KP-046', 'KP-080', 'KP-092', 'KP-093', 'KP-094',
  'KP-095', 'KP-097', 'KP-098', 'KP-099', 'KP-100',
];



/**
 * 预设卷库 (涵盖难度梯度卷、全真考卷库、6 学期期末综合卷)
 */
export const PRESET_PAPERS: PresetPaper[] = [
  // 1. 难度梯度卷
  {
    id: 'PAPER-GRAD-HELL',
    titleZh: '地狱模式巅峰卷 (15%得分率)',
    titleEn: 'Hell Peak Paper (15% Score Rate)',
    category: 'gradient',
    icon: 'bolt',
    scoreSystem: '120',
    difficultyTagZh: '极高难度 (15%得分率)',
    difficultyTagEn: 'Extreme (15% Score Rate)',
    difficultyDistribution: [5, 10, 20, 35, 30], // 强倾斜 L4, L5
    descriptionZh: '聚焦压轴手拉手模型、二次函数铅垂高、几何存在性等满分阻断题。',
    descriptionEn: 'Focus on high-order rotation, quadratic height, and geometry existence.',
    selectedKpIds: ALL_CORE_KP_IDS,
  },
  {
    id: 'PAPER-GRAD-NIGHTMARE',
    titleZh: '噩梦模式攻坚卷 (35%得分率)',
    titleEn: 'Nightmare Assault Paper (35% Score Rate)',
    category: 'gradient',
    icon: 'flame',
    scoreSystem: '120',
    difficultyTagZh: '高难度 (35%得分率)',
    difficultyTagEn: 'High (35% Score Rate)',
    difficultyDistribution: [15, 20, 30, 25, 10], // 主攻 L3, L4
    descriptionZh: '专攻中考第 16 题填空压轴与第 23~24 题综合拔高题。',
    descriptionEn: 'Targeting mid-high level entrance exam questions.',
    selectedKpIds: ALL_CORE_KP_IDS,
  },
  {
    id: 'PAPER-GRAD-STANDARD',
    titleZh: '普通模式精练卷 (50%得分率)',
    titleEn: 'Standard Refined Paper (50% Score Rate)',
    category: 'gradient',
    icon: 'star',
    scoreSystem: '120',
    difficultyTagZh: '基石巩固 (50%得分率)',
    difficultyTagEn: 'Standard (50% Score Rate)',
    difficultyDistribution: [30, 35, 25, 10, 0], // 主攻 L1, L2, L3
    descriptionZh: '强化课标骨架考点，打牢代数运算与基础全等判定地基。',
    descriptionEn: 'Solidify fundamental algebraic operations and congruence properties.',
    selectedKpIds: ALL_CORE_KP_IDS,
  },

  // 2. 全真考卷库
  {
    id: 'PAPER-REAL-EXAM-STD',
    titleZh: '中考全真标准卷',
    titleEn: 'Senior Entrance Real Exam Standard',
    category: 'standard',
    icon: 'target',
    scoreSystem: '120',
    difficultyTagZh: '全真中考 (7:2:1 梯度)',
    difficultyTagEn: 'Real Exam (7:2:1 Ratio)',
    difficultyDistribution: [35, 35, 20, 8, 2], // 70% 基础, 20% 中档, 10% 拔高
    descriptionZh: '严格还原各省市中考试卷结构与易中难 7:2:1 经典梯度。',
    descriptionEn: 'Strict restoration of typical provincial exam difficulty ratios.',
    selectedKpIds: ALL_CORE_KP_IDS,
  },
  {
    id: 'PAPER-REAL-EXAM-RUSH',
    titleZh: '中考择优冲刺卷',
    titleEn: 'Selective Entrance Sprint Exam',
    category: 'standard',
    icon: 'trophy',
    scoreSystem: '150',
    difficultyTagZh: '重点高中自主招生',
    difficultyTagEn: 'Elite High School Selection',
    difficultyDistribution: [10, 20, 30, 25, 15],
    descriptionZh: '面向省市重点高中自招培优，考察高阶思维联通与一题多解。',
    descriptionEn: 'For elite school admission sprints and multi-method inquiries.',
    selectedKpIds: ALL_CORE_KP_IDS,
  },

  // 3. 6 学期期末综合卷
  {
    id: 'PAPER-TERM-7A',
    titleZh: '七年级上学期期末标准卷',
    titleEn: 'Grade 7 Semester 1 Final Exam',
    category: 'semester',
    icon: 'book',
    scoreSystem: '100',
    difficultyTagZh: '7A 学期期末',
    difficultyTagEn: 'Grade 7 Semester 1',
    difficultyDistribution: [35, 40, 20, 5, 0],
    targetGrade: 7,
    targetSemester: 1,
    descriptionZh: '涵盖有理数运算、整式加减、一元一次方程及几何图形初步。',
    descriptionEn: 'Rational numbers, linear equations, and basic geometry.',
    selectedKpIds: ['KP-001', 'KP-005', 'KP-008', 'KP-009'],
  },
  {
    id: 'PAPER-TERM-7B',
    titleZh: '七年级下学期期末标准卷',
    titleEn: 'Grade 7 Semester 2 Final Exam',
    category: 'semester',
    icon: 'book',
    scoreSystem: '100',
    difficultyTagZh: '7B 学期期末',
    difficultyTagEn: 'Grade 7 Semester 2',
    difficultyDistribution: [30, 35, 25, 10, 0],
    targetGrade: 7,
    targetSemester: 2,
    descriptionZh: '涵盖相交线与平行线、实数、二元一次方程组、全等三角形。',
    descriptionEn: 'Parallel lines, systems of linear equations, triangle congruence.',
    selectedKpIds: ['KP-010', 'KP-012', 'KP-015'],
  },
  {
    id: 'PAPER-TERM-8A',
    titleZh: '八年级上学期期末标准卷',
    titleEn: 'Grade 8 Semester 1 Final Exam',
    category: 'semester',
    icon: 'book',
    scoreSystem: '120',
    difficultyTagZh: '8A 学期期末',
    difficultyTagEn: 'Grade 8 Semester 1',
    difficultyDistribution: [25, 35, 25, 15, 0],
    targetGrade: 8,
    targetSemester: 1,
    descriptionZh: '涵盖三角形轴对称、分式方程、等腰三角形性质。',
    descriptionEn: 'Axial symmetry, fractional equations, and isosceles triangles.',
    selectedKpIds: ['KP-018', 'KP-053', 'KP-079', 'KP-033'],
  },
  {
    id: 'PAPER-TERM-8B',
    titleZh: '八年级下学期期末标准卷',
    titleEn: 'Grade 8 Semester 2 Final Exam',
    category: 'semester',
    icon: 'book',
    scoreSystem: '120',
    difficultyTagZh: '8B 学期期末',
    difficultyTagEn: 'Grade 8 Semester 2',
    difficultyDistribution: [20, 30, 30, 15, 5],
    targetGrade: 8,
    targetSemester: 2,
    descriptionZh: '涵盖一元二次方程、平行四边形矩形菱形、反比例函数。',
    descriptionEn: 'Quadratic equations, parallelograms, inverse functions.',
    selectedKpIds: ['KP-028', 'KP-030', 'KP-032', 'KP-035'],
  },
  {
    id: 'PAPER-TERM-9A',
    titleZh: '九年级上学期期末标准卷',
    titleEn: 'Grade 9 Semester 1 Final Exam',
    category: 'semester',
    icon: 'book',
    scoreSystem: '120',
    difficultyTagZh: '9A 学期期末',
    difficultyTagEn: 'Grade 9 Semester 1',
    difficultyDistribution: [15, 25, 30, 20, 10],
    targetGrade: 9,
    targetSemester: 1,
    descriptionZh: '涵盖二次函数顶点式最值、锐角三角函数、旋转手拉手模型。',
    descriptionEn: 'Quadratic functions, trigonometry, hand-in-hand rotations.',
    selectedKpIds: ['KP-040', 'KP-042', 'KP-045'],
  },
  {
    id: 'PAPER-TERM-9B',
    titleZh: '九年级下学期中考模拟卷',
    titleEn: 'Grade 9 Semester 2 Entrance Mock Exam',
    category: 'semester',
    icon: 'book',
    scoreSystem: '120',
    difficultyTagZh: '9B 中考全真模考',
    difficultyTagEn: 'Grade 9 Semester 2 Mock',
    difficultyDistribution: [20, 30, 25, 15, 10],
    targetGrade: 9,
    targetSemester: 2,
    descriptionZh: '九下全科中考实战总复习模考，包含圆的切线与全初中几何代数大综合。',
    descriptionEn: 'Full junior high school curriculum comprehensive entrance mock exam.',
    selectedKpIds: ALL_CORE_KP_IDS,
  },
];
