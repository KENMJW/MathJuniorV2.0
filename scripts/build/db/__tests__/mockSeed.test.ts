import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { seedMockDatabase } from '../mockSeed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.resolve(__dirname, '../../../../tmp/test-data');

function queryDb<T = any>(dbName: string, sql: string): T[] {
  const dbPath = path.join(DB_DIR, dbName);
  const out = execSync(`sqlite3 -json "${dbPath}" "${sql}"`, { encoding: 'utf-8' });
  if (!out.trim()) return [];
  return JSON.parse(out);
}

function execDb(dbName: string, sql: string): void {
  const dbPath = path.join(DB_DIR, dbName);
  execSync(`sqlite3 "${dbPath}" "${sql}"`, { encoding: 'utf-8' });
}

describe('Mock DB Verification (CT-1 ~ CT-8 & 铁律 9)', () => {
  beforeAll(() => {
    seedMockDatabase(DB_DIR);
  });

  it('CT-1: questions difficulty_level must be between 1 and 9', () => {
    const rows = queryDb('questions.db', 'SELECT question_id, difficulty_level FROM questions;');
    expect(rows.length).toBeGreaterThanOrEqual(5);
    rows.forEach((r) => {
      expect(r.difficulty_level).toBeGreaterThanOrEqual(1);
      expect(r.difficulty_level).toBeLessThanOrEqual(9);
    });
  });

  it('CT-2: knowledge_combinations kp_count between 1 and 8, and contains kp_count > 4', () => {
    const rows = queryDb('core.db', 'SELECT combination_id, kp_count FROM knowledge_combinations;');
    expect(rows.length).toBeGreaterThanOrEqual(8);
    let hasGreaterThanFour = false;
    rows.forEach((r) => {
      expect(r.kp_count).toBeGreaterThanOrEqual(1);
      expect(r.kp_count).toBeLessThanOrEqual(8);
      if (r.kp_count > 4) {
        hasGreaterThanFour = true;
      }
    });
    expect(hasGreaterThanFour).toBe(true);
  });

  it('H4 隐患销项: 扩充 mock db 覆盖多学期、多主线、多考点与真实拓扑边', () => {
    // 1. 考点数 >= 15
    const kpRows = queryDb('core.db', 'SELECT point_id, grade, semester, primary_line_id FROM knowledge_points;');
    expect(kpRows.length).toBeGreaterThanOrEqual(15);

    // 2. 学期跨度 >= 4 (7-1, 7-2, 8-1, 8-2, 9-1, 9-2)
    const semesterSet = new Set(kpRows.map((r) => `${r.grade}-${r.semester}`));
    expect(semesterSet.size).toBeGreaterThanOrEqual(4);

    // 3. 主线数 >= 4 (涵盖 A 系与 G 系)
    const lineRows = queryDb('core.db', 'SELECT line_id, domain FROM logic_lines;');
    expect(lineRows.length).toBeGreaterThanOrEqual(6);
    const domains = new Set(lineRows.map((r) => r.domain));
    expect(domains.has('数与代数')).toBe(true);
    expect(domains.has('图形与几何')).toBe(true);

    // 4. 拓扑依赖边具有真实 predecessors / successors
    const graphRows = queryDb('core.db', 'SELECT point_id, predecessors, successors FROM knowledge_graph_semesters;');
    expect(graphRows.length).toBeGreaterThanOrEqual(15);
    const hasIncoming = graphRows.some((r) => JSON.parse(r.predecessors).length > 0);
    const hasOutgoing = graphRows.some((r) => JSON.parse(r.successors).length > 0);
    expect(hasIncoming).toBe(true);
    expect(hasOutgoing).toBe(true);

    // 5. 组合基数覆盖 1 到 8
    const comboRows = queryDb('core.db', 'SELECT kp_count FROM knowledge_combinations;');
    const counts = new Set(comboRows.map((r) => r.kp_count));
    for (let c = 1; c <= 8; c++) {
      expect(counts.has(c)).toBe(true);
    }
  });

  it('CT-3: questions question_type must belong to legal enum', () => {
    const rows = queryDb('questions.db', 'SELECT question_id, question_type FROM questions;');
    const legalTypes = ['single_choice', 'fill_blank', 'solution'];
    rows.forEach((r) => {
      expect(legalTypes).toContain(r.question_type);
    });
  });

  it('CT-6: master_examples dim3_rigor is mandatory non-empty', () => {
    const rows = queryDb('master.db', 'SELECT example_id, dim3_rigor FROM master_examples;');
    expect(rows.length).toBeGreaterThanOrEqual(2);
    rows.forEach((r) => {
      expect(typeof r.dim3_rigor).toBe('string');
      expect(r.dim3_rigor.trim().length).toBeGreaterThan(0);
    });
  });

  it('CT-8 & 铁律 9: 母题与真题必须物理隔离', () => {
    // 1. master.db 中不存在 questions 表
    const masterTables = queryDb(
      'master.db',
      "SELECT name FROM sqlite_master WHERE type='table' AND name='questions';"
    );
    expect(masterTables.length).toBe(0);

    // 2. questions.db 中不存在 master_examples 表
    const questionsTables = queryDb(
      'questions.db',
      "SELECT name FROM sqlite_master WHERE type='table' AND name='master_examples';"
    );
    expect(questionsTables.length).toBe(0);

    // 3. questions 题库中无任何母题 ID
    const questionsRows = queryDb('questions.db', 'SELECT question_id FROM questions;');
    questionsRows.forEach((r) => {
      expect(r.question_id.startsWith('ME-')).toBe(false);
    });
  });

  it('CHECK Constraints: Database schema must reject illegal values', () => {
    // 检验 kp_count > 8 CHECK 拦截
    expect(() => {
      execDb(
        'core.db',
        "INSERT INTO knowledge_combinations (combination_id, kp_ids, kp_count, directed_order, question_hint_zh, question_hint_en, question_types) VALUES ('C9-ERR', '[]', 9, '[]', 'hint', 'hint', '[]');"
      );
    }).toThrow();

    // 检验 questions difficulty_level > 9 CHECK 拦截
    expect(() => {
      execDb(
        'questions.db',
        "INSERT INTO questions (question_id, source, grade_level, semester, primary_point_id, difficulty_level, question_type, stem_zh, stem_en, answer_standard) VALUES ('Q-ERR-10', 'src', 8, 1, 'KP-023', 10, 'single_choice', 'zh', 'en', 'A');"
      );
    }).toThrow();

    // 检验 questions question_type 非法枚举 CHECK 拦截
    expect(() => {
      execDb(
        'questions.db',
        "INSERT INTO questions (question_id, source, grade_level, semester, primary_point_id, difficulty_level, question_type, stem_zh, stem_en, answer_standard) VALUES ('Q-ERR-TYPE', 'src', 8, 1, 'KP-023', 3, 'essay', 'zh', 'en', 'A');"
      );
    }).toThrow();
  });

  it('任务 10.4 & 11.4 种子数据完备性验证', () => {
    // 1. 主线快练需要 L4~L6 single_choice 真题 >= 3 题
    const l4l6ChoiceRows = queryDb(
      'questions.db',
      "SELECT question_id, difficulty_level, question_type FROM questions WHERE difficulty_level BETWEEN 4 AND 6 AND question_type = 'single_choice';"
    );
    expect(l4l6ChoiceRows.length).toBeGreaterThanOrEqual(3);

    // 2. 主线闭环需要 line_master 母题
    const lineMasterRows = queryDb(
      'master.db',
      "SELECT example_id, example_type, bound_target_id, dim3_rigor FROM master_examples WHERE example_type = 'line_master';"
    );
    expect(lineMasterRows.length).toBeGreaterThanOrEqual(2);
    lineMasterRows.forEach((r) => {
      expect(r.example_id.startsWith('ME-LINE-')).toBe(true);
      expect(r.dim3_rigor.length).toBeGreaterThan(0);
    });

    // 3. 实验室二跃迁模型需要 4D 变异 JSON 配置
    const leapModelRows = queryDb(
      'sandbox.db',
      'SELECT model_id, carrier_morphing_json, parameter_morphing_json, posture_morphing_json, camouflage_xray_json FROM leap_sandbox_models;'
    );
    expect(leapModelRows.length).toBeGreaterThanOrEqual(2);
    leapModelRows.forEach((r) => {
      expect(() => JSON.parse(r.carrier_morphing_json)).not.toThrow();
      expect(() => JSON.parse(r.parameter_morphing_json)).not.toThrow();
      expect(() => JSON.parse(r.posture_morphing_json)).not.toThrow();
      expect(() => JSON.parse(r.camouflage_xray_json)).not.toThrow();
    });
  });
});

