#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
任务 1.7: 入库 core.db 结构层 + 内容层占位
依据 schema.sql 的 DDL 建立四表：
1. knowledge_points
2. logic_lines
3. knowledge_combinations
4. knowledge_graph_semesters

内容层合规占位规范 (design §2.7)：
- 四段精讲 TEXT 字段 -> "__PENDING_CONTENT__"
- svg_asset_zh/en -> 约定路径 "assets/concepts/{point_id}-{lang}.svg"
- logic_lines.master_example_id / flagship_model_id -> "__PENDING__"
- knowledge_points.master_example_id / sandbox_id -> NULL
"""

import json
import sqlite3
import os

DB_PATH = "data/core.db"
JSON_PATH = "data/初中数学_基础数据_v2.json"

SCHEMA_CORE_SQL = """
DROP TABLE IF EXISTS knowledge_graph_semesters;
DROP TABLE IF EXISTS knowledge_combinations;
DROP TABLE IF EXISTS knowledge_points;
DROP TABLE IF EXISTS logic_lines;

CREATE TABLE logic_lines (
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

CREATE TABLE knowledge_points (
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
    sandbox_id           VARCHAR(32),
    FOREIGN KEY(primary_line_id) REFERENCES logic_lines(line_id)
);

CREATE TABLE knowledge_combinations (
    combination_id  VARCHAR(32) PRIMARY KEY,
    kp_ids          TEXT    NOT NULL,
    kp_count        TINYINT NOT NULL,
    directed_order  TEXT    NOT NULL,
    question_hint_zh TEXT NOT NULL,
    question_hint_en TEXT NOT NULL,
    question_types  TEXT    NOT NULL,
    CHECK (kp_count BETWEEN 1 AND 8)
);

CREATE TABLE knowledge_graph_semesters (
    node_id       VARCHAR(32) PRIMARY KEY,
    point_id      VARCHAR(16) NOT NULL,
    grade_semester VARCHAR(16) NOT NULL,
    module_name   VARCHAR(64) NOT NULL,
    predecessors  TEXT NOT NULL,
    successors    TEXT NOT NULL,
    is_milestone  BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY(point_id) REFERENCES knowledge_points(point_id)
);

CREATE INDEX idx_kp_grade_semester ON knowledge_points(grade, semester, primary_line_id);
"""

def load_data():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA_CORE_SQL)

    # 1. 插入 logic_lines
    for ll in data["logic_lines"]:
        cur.execute("""
            INSERT INTO logic_lines (
                line_id, name_zh, name_en, domain, semester_span,
                origin_foundation_zh, origin_foundation_en,
                spiral_leaps_zh, spiral_leaps_en,
                methodology_zh, methodology_en,
                exam_matrix_zh, exam_matrix_en,
                master_example_id, flagship_model_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ll["line_id"], ll["name_zh"], ll["name_en"], ll["domain"], ll["semester_span"],
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            "__PENDING__", "__PENDING__"
        ))

    # 2. 插入 knowledge_points
    for kp in data["knowledge_points"]:
        pid = kp["id"]
        cur.execute("""
            INSERT INTO knowledge_points (
                point_id, name_zh, name_en, grade, semester, domain, subcategory,
                primary_line_id, is_mandatory, svg_asset_zh, svg_asset_en,
                origin_story_zh, origin_story_en,
                intuitive_essence_zh, intuitive_essence_en,
                formal_definition_zh, formal_definition_en,
                intrinsic_variation_zh, intrinsic_variation_en,
                master_example_id, sandbox_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pid, kp["name_zh"], kp["name_en"], kp["grade"], kp["semester"], kp["domain"], kp["subcategory"],
            kp["primary_line_id"], 1 if kp.get("is_mandatory", True) else 0,
            f"assets/concepts/{pid}-zh.svg", f"assets/concepts/{pid}-en.svg",
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            "__PENDING_CONTENT__", "__PENDING_CONTENT__",
            None, None
        ))

    # 3. 插入 knowledge_combinations
    for cb in data["combinations"]:
        cur.execute("""
            INSERT INTO knowledge_combinations (
                combination_id, kp_ids, kp_count, directed_order,
                question_hint_zh, question_hint_en, question_types
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            cb["id"],
            json.dumps(cb["kp_ids"], ensure_ascii=False),
            cb["size"],
            json.dumps(cb["directed_order"], ensure_ascii=False),
            cb["question_hint_zh"],
            cb["question_hint_en"],
            json.dumps(cb["question_types"], ensure_ascii=False)
        ))

    # 4. 插入 knowledge_graph_semesters
    for g in data["graph_topology"]:
        cur.execute("""
            INSERT INTO knowledge_graph_semesters (
                node_id, point_id, grade_semester, module_name,
                predecessors, successors, is_milestone
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            g["node_id"], g["point_id"], g["grade_semester"], g["module_name"],
            json.dumps(g["predecessors"], ensure_ascii=False),
            json.dumps(g["successors"], ensure_ascii=False),
            1 if g.get("is_milestone") else 0
        ))

    conn.commit()
    conn.close()
    print(f"✅ core.db 写入成功: {DB_PATH}")

if __name__ == "__main__":
    load_data()
