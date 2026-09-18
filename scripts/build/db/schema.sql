-- 全科核心素养提分系统 V2.0 初中数学扁平表结构 DDL
-- 权威依据：design.md §4.2

-- 1. 知识点基础字典（107 考点）— core.db
CREATE TABLE IF NOT EXISTS knowledge_points (
    point_id             VARCHAR(16) PRIMARY KEY,   -- "KP-023"
    name_zh              VARCHAR(64)  NOT NULL,
    name_en              VARCHAR(128) NOT NULL,
    grade                TINYINT      NOT NULL,     -- 7/8/9
    semester             TINYINT      NOT NULL,     -- 1(上)/2(下)
    domain               VARCHAR(32)  NOT NULL,
    subcategory          VARCHAR(64)  NOT NULL,
    primary_line_id      VARCHAR(8)   NOT NULL,     -- → logic_lines.line_id
    is_mandatory         BOOLEAN      NOT NULL DEFAULT 1,
    svg_asset_zh         VARCHAR(128) NOT NULL,     -- "assets/concepts/KP-023-zh.svg"
    svg_asset_en         VARCHAR(128) NOT NULL,
    origin_story_zh      TEXT NOT NULL,
    origin_story_en      TEXT NOT NULL,             -- ① 原点溯源
    intuitive_essence_zh TEXT NOT NULL,
    intuitive_essence_en TEXT NOT NULL,             -- ② 本真透视
    formal_definition_zh TEXT NOT NULL,
    formal_definition_en TEXT NOT NULL,             -- ③ 法典严定
    intrinsic_variation_zh TEXT NOT NULL,
    intrinsic_variation_en TEXT NOT NULL,           -- ④ 本体辨正
    master_example_id    VARCHAR(32),               -- → master_examples.example_id
    sandbox_id           VARCHAR(32)                -- → concept_sandboxes (NULL => 占位卡)
);

-- 2. 底层逻辑主线（12 条）— core.db
CREATE TABLE IF NOT EXISTS logic_lines (
    line_id           VARCHAR(8) PRIMARY KEY,       -- "A4" / "G5"
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
    master_example_id VARCHAR(32) NOT NULL,         -- ME-LINE-A4
    flagship_model_id VARCHAR(32) NOT NULL          -- → leap_sandbox_models.model_id
);

-- 3. 知识点有效连通组合（2205 个，基数 1~8）— core.db
CREATE TABLE IF NOT EXISTS knowledge_combinations (
    combination_id  VARCHAR(32) PRIMARY KEY,        -- "C3-0112"
    kp_ids          TEXT    NOT NULL,               -- JSON: ["KP-023","KP-045",...]
    kp_count        TINYINT NOT NULL,               -- 1 ~ 8 (CT-2: 严禁硬编码上限 4)
    directed_order  TEXT    NOT NULL,               -- 推荐拓扑求解顺序 JSON
    question_hint_zh TEXT NOT NULL,
    question_hint_en TEXT NOT NULL,
    question_types  TEXT    NOT NULL,               -- JSON: ["single_choice","fill_blank","solution"]
    CHECK (kp_count BETWEEN 1 AND 8)
);

-- 4. 学期知识图谱与拓扑（纯静态结构）— core.db
CREATE TABLE IF NOT EXISTS knowledge_graph_semesters (
    node_id       VARCHAR(32) PRIMARY KEY,
    point_id      VARCHAR(16) NOT NULL,             -- → knowledge_points.point_id
    grade_semester VARCHAR(16) NOT NULL,            -- "7-1".."9-2"
    module_name   VARCHAR(64) NOT NULL,
    predecessors  TEXT NOT NULL,                    -- 入度 JSON（前置光束）
    successors    TEXT NOT NULL,                    -- 出度 JSON（后继光束）
    is_milestone  BOOLEAN NOT NULL DEFAULT 0
);

-- 5. 概念具象沙盒（约 40~50 个）— sandbox.db
CREATE TABLE IF NOT EXISTS concept_sandboxes (
    sandbox_id       VARCHAR(32) PRIMARY KEY,       -- "SB-KP023"
    point_id         VARCHAR(16) NOT NULL UNIQUE,   -- → knowledge_points.point_id
    category_id      VARCHAR(32) NOT NULL,
    engine_type      VARCHAR(16) NOT NULL,          -- geometry/function/number_axis
    canvas_template  VARCHAR(64) NOT NULL,          -- 配置模板 ID
    inquiry_guide_zh VARCHAR(128) NOT NULL,
    inquiry_guide_en VARCHAR(256) NOT NULL,
    viewbox_spec_json     TEXT NOT NULL,            -- 视口/包围盒/15%安全边距
    drag_points_json      TEXT NOT NULL,            -- 声明式动点定义与约束
    param_sliders_json    TEXT NOT NULL,            -- 声明式滑块定义域
    invariants_display_json TEXT NOT NULL           -- 实时不变量展示公式
);

-- 6. 思维跃迁模型（36 个）— sandbox.db
CREATE TABLE IF NOT EXISTS leap_sandbox_models (
    model_id          VARCHAR(32) PRIMARY KEY,      -- "LM-9A-19"
    model_name_zh     VARCHAR(64) NOT NULL,
    model_name_en     VARCHAR(128) NOT NULL,
    unlocked_semester VARCHAR(8) NOT NULL,          -- 7A/7B/8A/8B/9A/9B
    primary_line      VARCHAR(8) NOT NULL,          -- → logic_lines.line_id
    category_id       VARCHAR(32) NOT NULL,
    tier_level        TINYINT NOT NULL,             -- 1 原型/2 变式/3 综合
    canonical_state_count TINYINT NOT NULL,
    kp_dependencies   TEXT NOT NULL,                -- JSON 依赖考点
    clique_id         VARCHAR(32),                  -- → knowledge_combinations
    model_brief_zh    VARCHAR(128) NOT NULL,
    model_brief_en    VARCHAR(256) NOT NULL,
    viewbox_spec_json TEXT NOT NULL,
    carrier_morphing_json  TEXT NOT NULL,
    parameter_morphing_json TEXT NOT NULL,
    posture_morphing_json  TEXT NOT NULL,
    camouflage_xray_json   TEXT NOT NULL
);

-- 7. 母题库（119 母题）— master.db (与 questions 物理隔离，铁律 9)
CREATE TABLE IF NOT EXISTS master_examples (
    example_id     VARCHAR(32) PRIMARY KEY,         -- "ME-KP023" / "ME-LINE-A4"
    example_type   VARCHAR(16) NOT NULL,            -- 'point_master' / 'line_master'
    bound_target_id VARCHAR(16) NOT NULL,           -- point_id 或 line_id
    source         VARCHAR(64) NOT NULL,
    stem_zh        TEXT NOT NULL,
    stem_en        TEXT NOT NULL,
    options_json   TEXT,
    correct_option VARCHAR(8),
    dim1_origin    TEXT,
    dim2_essence   TEXT,
    dim3_rigor     TEXT NOT NULL,                   -- CT-6 恒必填
    dim4_traps     TEXT,
    bound_line_id  VARCHAR(8),                      -- 仅主线母题
    empirical_scoring_rate REAL,                    -- 主线母题 ∈ [0.15, 0.35]
    image_paths_json TEXT,
    CHECK (example_type IN ('point_master','line_master'))
);

-- 8. 真题库（考试与快练题库）— questions.db (绝不含母题，铁律 9)
CREATE TABLE IF NOT EXISTS questions (
    question_id       VARCHAR(32) PRIMARY KEY,      -- "Q-2022-YN-009"
    source            VARCHAR(64) NOT NULL,
    exam_year         SMALLINT,
    region            VARCHAR(32),
    exam_type         VARCHAR(32) NOT NULL DEFAULT '中考真题',
    grade_level       TINYINT NOT NULL,
    semester          TINYINT NOT NULL,
    primary_point_id  VARCHAR(16) NOT NULL,         -- → knowledge_points.point_id
    combination_id    VARCHAR(32),                  -- → knowledge_combinations
    difficulty_level  TINYINT NOT NULL,             -- 1~9 (CT-1)
    question_type     VARCHAR(16) NOT NULL,         -- single_choice/fill_blank/solution (CT-3)
    score_default     TINYINT NOT NULL DEFAULT 2,
    stem_zh           TEXT NOT NULL,
    stem_en           TEXT NOT NULL,
    options_json      TEXT,
    answer_standard   TEXT NOT NULL,
    rubric_checklist_json TEXT,                     -- 解答题踩分点 JSON
    solutions_json    TEXT,
    image_paths_json  TEXT,
    CHECK (difficulty_level BETWEEN 1 AND 9),
    CHECK (question_type IN ('single_choice','fill_blank','solution'))
);

-- 覆盖索引
CREATE INDEX IF NOT EXISTS idx_kp_grade_semester ON knowledge_points(grade, semester, primary_line_id);
CREATE INDEX IF NOT EXISTS idx_q_filter          ON questions(grade_level, semester, question_type, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_q_kp_combo        ON questions(primary_point_id, combination_id);
CREATE INDEX IF NOT EXISTS idx_me_target         ON master_examples(example_type, bound_target_id);
CREATE INDEX IF NOT EXISTS idx_leap_line         ON leap_sandbox_models(primary_line, unlocked_semester);
