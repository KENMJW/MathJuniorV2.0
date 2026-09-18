import { StageNumber } from './SvgLayerReveal';

export interface KnowledgePointRecord {
  point_id: string;
  name_zh: string;
  name_en: string;
  grade: number;
  semester: number;
  domain: string;
  subcategory: string;
  primary_line_id: string;
  is_mandatory: number | boolean;
  svg_asset_zh: string;
  svg_asset_en: string;
  origin_story_zh: string;
  origin_story_en: string;
  intuitive_essence_zh: string;
  intuitive_essence_en: string;
  formal_definition_zh: string;
  formal_definition_en: string;
  intrinsic_variation_zh: string;
  intrinsic_variation_en: string;
  master_example_id?: string | null;
  sandbox_id?: string | null;
}

export interface FourStageMeta {
  stage: StageNumber;
  key: 'origin_story' | 'intuitive_essence' | 'formal_definition' | 'intrinsic_variation';
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  tagColor: string;
}

export const FOUR_STAGES_CONFIG: FourStageMeta[] = [
  {
    stage: 1,
    key: 'origin_story',
    titleZh: '① 原点溯源',
    titleEn: '1. Origin Story',
    subtitleZh: '发现历史与直观问题',
    subtitleEn: 'Historical Roots & Intuitive Problems',
    tagColor: 'var(--ios-blue)',
  },
  {
    stage: 2,
    key: 'intuitive_essence',
    titleZh: '② 本真透视',
    titleEn: '2. Intuitive Essence',
    subtitleZh: '几何本真与图形割补',
    subtitleEn: 'Geometric Essence & Area Dissection',
    tagColor: 'var(--ios-teal)',
  },
  {
    stage: 3,
    key: 'formal_definition',
    titleZh: '③ 法典严定',
    titleEn: '3. Formal Definition',
    subtitleZh: '严谨公理与精确符号表达',
    subtitleEn: 'Axiomatic Rigor & Symbolic Precision',
    tagColor: 'var(--ios-indigo)',
  },
  {
    stage: 4,
    key: 'intrinsic_variation',
    titleZh: '④ 本体辨正',
    titleEn: '4. Intrinsic Variation',
    subtitleZh: '逆定理、反例与临界边界',
    subtitleEn: 'Converse, Counter-examples & Boundaries',
    tagColor: 'var(--ios-orange)',
  },
];
