import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DB_DIR = path.resolve(__dirname, '../../../data');
export const SCHEMA_FILE = path.resolve(__dirname, 'schema.sql');

export const PACKAGE_TABLES: Record<string, string[]> = {
  core: ['knowledge_points', 'logic_lines', 'knowledge_combinations', 'knowledge_graph_semesters'],
  master: ['master_examples'],
  sandbox: ['concept_sandboxes', 'leap_sandbox_models'],
  questions: ['questions'],
};

export const PACKAGE_DDL: Record<string, string> = {
  core: `
CREATE TABLE IF NOT EXISTS knowledge_points (
    point_id             VARCHAR(16) PRIMARY KEY,
    name_zh              VARCHAR(64)  NOT NULL,
    name_en              VARCHAR(128) NOT NULL,
    grade                TINYINT      NOT NULL,
    semester             TINYINT      NOT NULL,
    domain               VARCHAR(32)  NOT NULL,
    subcategory          VARCHAR(64)  NOT NULL,
    primary_line_id      VARCHAR(8)   NOT NULL,
    is_mandatory         BOOLEAN      NOT NULL DEFAULT 1,
    svg_asset_zh         VARCHAR(128) NOT NULL,
    svg_asset_en         VARCHAR(128) NOT NULL,
    origin_story_zh      TEXT NOT NULL,
    origin_story_en      TEXT NOT NULL,
    intuitive_essence_zh TEXT NOT NULL,
    intuitive_essence_en TEXT NOT NULL,
    formal_definition_zh TEXT NOT NULL,
    formal_definition_en TEXT NOT NULL,
    intrinsic_variation_zh TEXT NOT NULL,
    intrinsic_variation_en TEXT NOT NULL,
    master_example_id    VARCHAR(32),
    sandbox_id           VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS logic_lines (
    line_id           VARCHAR(8) PRIMARY KEY,
    name_zh           VARCHAR(64) NOT NULL,
    name_en           VARCHAR(128) NOT NULL,
    domain            VARCHAR(32) NOT NULL,
    semester_span     VARCHAR(32) NOT NULL,
    origin_foundation_zh TEXT NOT NULL,
    origin_foundation_en TEXT NOT NULL,
    spiral_leaps_zh      TEXT NOT NULL,
    spiral_leaps_en      TEXT NOT NULL,
    methodology_zh       TEXT NOT NULL,
    methodology_en       TEXT NOT NULL,
    exam_matrix_zh       TEXT NOT NULL,
    exam_matrix_en       TEXT NOT NULL,
    master_example_id VARCHAR(32) NOT NULL,
    flagship_model_id VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_combinations (
    combination_id  VARCHAR(32) PRIMARY KEY,
    kp_ids          TEXT    NOT NULL,
    kp_count        TINYINT NOT NULL,
    directed_order  TEXT    NOT NULL,
    question_hint_zh TEXT NOT NULL,
    question_hint_en TEXT NOT NULL,
    question_types  TEXT    NOT NULL,
    CHECK (kp_count BETWEEN 1 AND 8)
);

CREATE TABLE IF NOT EXISTS knowledge_graph_semesters (
    node_id       VARCHAR(32) PRIMARY KEY,
    point_id      VARCHAR(16) NOT NULL,
    grade_semester VARCHAR(16) NOT NULL,
    module_name   VARCHAR(64) NOT NULL,
    predecessors  TEXT NOT NULL,
    successors    TEXT NOT NULL,
    is_milestone  BOOLEAN NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_kp_grade_semester ON knowledge_points(grade, semester, primary_line_id);
`,

  master: `
CREATE TABLE IF NOT EXISTS master_examples (
    example_id     VARCHAR(32) PRIMARY KEY,
    example_type   VARCHAR(16) NOT NULL,
    bound_target_id VARCHAR(16) NOT NULL,
    source         VARCHAR(64) NOT NULL,
    stem_zh        TEXT NOT NULL,
    stem_en        TEXT NOT NULL,
    options_json   TEXT,
    correct_option VARCHAR(8),
    dim1_origin    TEXT,
    dim2_essence   TEXT,
    dim3_rigor     TEXT NOT NULL,
    dim4_traps     TEXT,
    bound_line_id  VARCHAR(8),
    empirical_scoring_rate REAL,
    image_paths_json TEXT,
    CHECK (example_type IN ('point_master','line_master'))
);

CREATE INDEX IF NOT EXISTS idx_me_target ON master_examples(example_type, bound_target_id);
`,

  sandbox: `
CREATE TABLE IF NOT EXISTS concept_sandboxes (
    sandbox_id       VARCHAR(32) PRIMARY KEY,
    point_id         VARCHAR(16) NOT NULL UNIQUE,
    category_id      VARCHAR(32) NOT NULL,
    engine_type      VARCHAR(16) NOT NULL,
    canvas_template  VARCHAR(64) NOT NULL,
    inquiry_guide_zh VARCHAR(128) NOT NULL,
    inquiry_guide_en VARCHAR(256) NOT NULL,
    viewbox_spec_json     TEXT NOT NULL,
    drag_points_json      TEXT NOT NULL,
    param_sliders_json    TEXT NOT NULL,
    invariants_display_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leap_sandbox_models (
    model_id          VARCHAR(32) PRIMARY KEY,
    model_name_zh     VARCHAR(64) NOT NULL,
    model_name_en     VARCHAR(128) NOT NULL,
    unlocked_semester VARCHAR(8) NOT NULL,
    primary_line      VARCHAR(8) NOT NULL,
    category_id       VARCHAR(32) NOT NULL,
    tier_level        TINYINT NOT NULL,
    canonical_state_count TINYINT NOT NULL,
    kp_dependencies   TEXT NOT NULL,
    clique_id         VARCHAR(32),
    model_brief_zh    VARCHAR(128) NOT NULL,
    model_brief_en    VARCHAR(256) NOT NULL,
    viewbox_spec_json TEXT NOT NULL,
    carrier_morphing_json  TEXT NOT NULL,
    parameter_morphing_json TEXT NOT NULL,
    posture_morphing_json  TEXT NOT NULL,
    camouflage_xray_json   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leap_line ON leap_sandbox_models(primary_line, unlocked_semester);
`,

  questions: `
CREATE TABLE IF NOT EXISTS questions (
    question_id       VARCHAR(32) PRIMARY KEY,
    source            VARCHAR(64) NOT NULL,
    exam_year         SMALLINT,
    region            VARCHAR(32),
    exam_type         VARCHAR(32) NOT NULL DEFAULT '中考真题',
    grade_level       TINYINT NOT NULL,
    semester          TINYINT NOT NULL,
    primary_point_id  VARCHAR(16) NOT NULL,
    combination_id    VARCHAR(32),
    difficulty_level  TINYINT NOT NULL,
    question_type     VARCHAR(16) NOT NULL,
    score_default     TINYINT NOT NULL DEFAULT 2,
    stem_zh           TEXT NOT NULL,
    stem_en           TEXT NOT NULL,
    options_json      TEXT,
    answer_standard   TEXT NOT NULL,
    rubric_checklist_json TEXT,
    solutions_json    TEXT,
    image_paths_json  TEXT,
    CHECK (difficulty_level BETWEEN 1 AND 9),
    CHECK (question_type IN ('single_choice','fill_blank','solution'))
);

CREATE INDEX IF NOT EXISTS idx_q_filter   ON questions(grade_level, semester, question_type, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_q_kp_combo ON questions(primary_point_id, combination_id);
`,
};

export function buildDatabasePackages(targetDir: string = DB_DIR): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const [pkg, ddl] of Object.entries(PACKAGE_DDL)) {
    const dbPath = path.join(targetDir, `${pkg}.db`);
    // 若已存在空占位文件，移除后重新建库
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).size === 0) {
      fs.unlinkSync(dbPath);
    }
    // 使用 sqlite3 CLI 初始化 schema
    execSync(`sqlite3 "${dbPath}"`, {
      input: ddl,
      encoding: 'utf-8',
    });
    console.log(`[BuildDB] Successfully built schema for ${pkg}.db at ${dbPath}`);
  }
}

if (process.argv[1] === __filename) {
  buildDatabasePackages();
}
