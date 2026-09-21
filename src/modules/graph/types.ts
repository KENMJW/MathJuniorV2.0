/**
 * 模块二 思维图谱类型定义 (权威依据: design.md §4.2, §7.2)
 */

export interface LogicLine {
  line_id: string; // e.g. 'A1' ~ 'A4', 'G1' ~ 'G6', 'S1', 'P1'
  name_zh: string;
  name_en: string;
  domain: string; // '数与代数' | '图形与几何' | '统计与概率'
  semester_span: string; // e.g. '7-1 ~ 8-1'
  origin_foundation_zh?: string;
  origin_foundation_en?: string;
  spiral_leaps_zh?: string;
  spiral_leaps_en?: string;
  methodology_zh?: string;
  methodology_en?: string;
  exam_matrix_zh?: string;
  exam_matrix_en?: string;
  master_example_id?: string;
  flagship_model_id?: string;
}

export interface LineMasterExample {
  example_id: string; // e.g. 'ME-LINE-G4'
  example_type: 'line_master';
  bound_target_id: string; // line_id
  source: string;
  stem_zh: string;
  stem_en: string;
  options_json?: string | null;
  correct_option?: string | null;
  dim1_origin?: string | null;
  dim2_essence?: string | null;
  dim3_rigor: string; // 维度三：严密推导（必填）
  dim4_traps?: string | null;
  bound_line_id: string;
  empirical_scoring_rate?: number | null; // e.g. 0.26
}

export interface GraphNode {
  node_id: string; // e.g. 'NODE-8-1-KP023'
  point_id: string; // 'KP-023'
  grade_semester: string; // '7-1' ~ '9-2'
  module_name: string;
  predecessors: string[]; // 前置依赖 point_id[]
  successors: string[]; // 后继演化 point_id[]
  is_milestone: number; // 0 | 1
}

export interface GraphKnowledgePoint {
  point_id: string;
  name_zh: string;
  name_en: string;
  grade: number; // 7, 8, 9
  semester: number; // 1, 2
  domain: string;
  subcategory: string;
  primary_line_id: string;
  is_mandatory: number | boolean;
}

export interface KnowledgeCombination {
  combination_id: string; // e.g. 'C5-0088'
  kp_ids: string[]; // 关联的考点 ID 数组
  kp_count: number; // 1 ~ 8 (CT-2: 严禁硬编码上限 4)
  directed_order?: string[];
  question_hint_zh: string;
  question_hint_en: string;
  question_types: string[]; // ['single_choice', 'fill_blank', 'solution']
}
