#!/usr/bin/env python3
"""
TASK-DATA-0011 Database Application & Verification Script
Applies part1~10.jsonl and generated.jsonl to data/questions.db
in a single transaction with rigorous assertions and dual-db sync.
"""

import sqlite3
import json
import os
import shutil
import hashlib
import sys

def sha256_of_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def compute_stem_zh_hash(cursor):
    rows = cursor.execute('''
        SELECT question_id, stem_zh 
        FROM questions 
        WHERE content_status != 'generated' 
        ORDER BY question_id
    ''').fetchall()
    h = hashlib.sha256()
    for qid, stem in rows:
        h.update((qid + ':' + (stem or '')).encode('utf-8'))
    return h.hexdigest(), len(rows)

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(base_dir, 'data/questions.db')
    bak_path = os.path.join(base_dir, 'data/questions.db.bak_before_task0011')
    public_db_path = os.path.join(base_dir, 'public/data/questions.db')
    core_db_path = os.path.join(base_dir, 'data/core.db')

    print("==================================================================")
    print("🚀 TASK-DATA-0011 写库与严格验证流程启动")
    print("==================================================================")

    # 1. 检查与物理备份
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    initial_count = cur.execute('SELECT count(*) FROM questions').fetchone()[0]
    print(f"1. 现库题数: {initial_count} 题 (要求 2565)")
    assert initial_count == 2565, f"Expected 2565 questions, found {initial_count}"

    pre_stem_hash, pre_stem_count = compute_stem_zh_hash(cur)
    print(f"   写前 stem_zh SHA256: {pre_stem_hash} (2565 题)")

    conn.close()

    print(f"2. 执行物理备份: cp {db_path} -> {bak_path}")
    shutil.copyfile(db_path, bak_path)
    bak_size = os.path.getsize(bak_path)
    print(f"   备份文件大小: {bak_size:,} 字节 (要求 > 0)")
    assert bak_size > 0, "Backup file is empty!"

    # 校验备份库行数
    bak_conn = sqlite3.connect(bak_path)
    bak_count = bak_conn.execute('SELECT count(*) FROM questions').fetchone()[0]
    bak_conn.close()
    print(f"   备份库行数校验: {bak_count} 题 (严格等于现库 2565)")
    assert bak_count == initial_count, f"Backup count {bak_count} != initial count {initial_count}"

    # 2. ALTER TABLE 加两列
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cols = [r[1] for r in cur.execute('PRAGMA table_info(questions)').fetchall()]
    if 'all_point_ids' not in cols:
        print("3. ALTER TABLE questions ADD COLUMN all_point_ids TEXT;")
        cur.execute('ALTER TABLE questions ADD COLUMN all_point_ids TEXT;')
    if 'max_grade' not in cols:
        print("   ALTER TABLE questions ADD COLUMN max_grade TINYINT;")
        cur.execute('ALTER TABLE questions ADD COLUMN max_grade TINYINT;')
    conn.commit()

    # 3. 读取 10 个分片更新数据与生成题数据
    print("4. 读取 10 个分片数据与生成补缺题数据...")
    updates = []
    reallocated_questions = []
    for shard_idx in range(1, 11):
        shard_file = os.path.join(base_dir, f'tmp/data0011/part{shard_idx}.jsonl')
        with open(shard_file, 'r', encoding='utf-8') as f:
            for line in f:
                r = json.loads(line)
                updates.append(r)
                if r.get('reallocated'):
                    reallocated_questions.append(r)

    print(f"   分片更新总数: {len(updates)} 条 (要求 2565)")
    assert len(updates) == 2565, f"Expected 2565 updates, got {len(updates)}"
    print(f"   重分配题目数: {len(reallocated_questions)} 条")

    gen_file = os.path.join(base_dir, 'tmp/data0011/generated.jsonl')
    generated_rows = []
    with open(gen_file, 'r', encoding='utf-8') as f:
        for line in f:
            generated_rows.append(json.loads(line))
    print(f"   生成补缺题数: {len(generated_rows)} 条")
    assert len(generated_rows) == 17, f"Expected 17 generated rows, got {len(generated_rows)}"

    # 4. 单事务串行写入
    print("5. 开启单事务串行写入数据库...")
    cur.execute('BEGIN TRANSACTION;')

    # 执行 2565 条 UPDATE
    update_sql = '''
        UPDATE questions 
        SET primary_point_id = ?,
            grade_level = ?,
            semester = ?,
            all_point_ids = ?,
            max_grade = ?,
            combination_id = ?
        WHERE question_id = ?
    '''
    update_params = [
        (
            u['primary_point_id'],
            u['grade_level'],
            u['semester'],
            json.dumps(u['all_point_ids'], ensure_ascii=False),
            u['max_grade'],
            u['combination_id'],
            u['question_id']
        )
        for u in updates
    ]
    cur.executemany(update_sql, update_params)
    print(f"   已批量更新 {len(update_params)} 条原题记录")

    # 执行 17 条 INSERT
    insert_sql = '''
        INSERT INTO questions (
            question_id, source, exam_year, region, exam_type,
            grade_level, semester, primary_point_id, combination_id,
            difficulty_level, question_type, score_default, stem_zh,
            stem_en, options_json, answer_standard, rubric_checklist_json,
            solutions_json, image_paths_json, content_status,
            all_point_ids, max_grade
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?
        )
    '''
    insert_params = [
        (
            g['question_id'], g['source'], g['exam_year'], g['region'], g['exam_type'],
            g['grade_level'], g['semester'], g['primary_point_id'], g['combination_id'],
            g['difficulty_level'], g['question_type'], g['score_default'], g['stem_zh'],
            g['stem_en'], g['options_json'], g['answer_standard'], g['rubric_checklist_json'],
            g['solutions_json'], g['image_paths_json'], g['content_status'],
            json.dumps(g['all_point_ids'], ensure_ascii=False), g['max_grade']
        )
        for g in generated_rows
    ]
    cur.executemany(insert_sql, insert_params)
    print(f"   已批量插入 {len(insert_params)} 条生成题记录")

    conn.commit()
    print("   事务提交成功！")

    # 5. 严格后置断言校验
    print("6. 执行后置断言核验...")

    # (1) 行数守恒与零 DELETE
    final_count = cur.execute('SELECT count(*) FROM questions').fetchone()[0]
    expected_total = 2565 + len(generated_rows)
    print(f"   (1) 总行数校验: {final_count} (预期 2565 + {len(generated_rows)} = {expected_total})")
    assert final_count == expected_total, f"Row count {final_count} != {expected_total}"

    # (2) stem_zh 零篡改断言
    post_stem_hash, post_stem_count = compute_stem_zh_hash(cur)
    print(f"   (2) stem_zh SHA256 零篡改校验:")
    print(f"       写前: {pre_stem_hash}")
    print(f"       写后: {post_stem_hash}")
    assert pre_stem_hash == post_stem_hash, "CRITICAL: stem_zh hash changed! Tampering detected!"
    assert post_stem_count == 2565, f"Expected 2565 original questions, found {post_stem_count}"
    print("       -> 100% 逐字一致，零篡改断言通过！")

    # (3) 每考点 ≥3 题与 107 考点全覆盖
    core_conn = sqlite3.connect(core_db_path)
    all_kps = [r[0] for r in core_conn.execute('SELECT point_id FROM knowledge_points').fetchall()]
    assert len(all_kps) == 107, f"Expected 107 KPs, found {len(all_kps)}"

    under_3 = cur.execute('''
        SELECT primary_point_id, count(*) 
        FROM questions 
        GROUP BY primary_point_id 
        HAVING count(*) < 3
    ''').fetchall()
    print(f"   (3) <3 题考点统计: {len(under_3)} 个 (要求严格为 0)")
    assert len(under_3) == 0, f"Found KPs with < 3 questions: {under_3}"

    distinct_kps = set(r[0] for r in cur.execute('SELECT DISTINCT primary_point_id FROM questions').fetchall())
    missing_kps = set(all_kps) - distinct_kps
    print(f"   (4) 107 考点覆盖: 缺失 {len(missing_kps)} 个 (要求为 0)")
    assert len(missing_kps) == 0, f"Missing KPs in database: {missing_kps}"

    # (5) all_point_ids 全库覆盖
    null_all_points = cur.execute('SELECT count(*) FROM questions WHERE all_point_ids IS NULL OR all_point_ids = ""').fetchone()[0]
    print(f"   (5) all_point_ids IS NULL: {null_all_points} 条 (要求为 0)")
    assert null_all_points == 0, f"Found {null_all_points} rows with null all_point_ids"

    # 每条必含 primary_point_id
    invalid_containment = 0
    for qid, pid, apids_str in cur.execute('SELECT question_id, primary_point_id, all_point_ids FROM questions').fetchall():
        apids = json.loads(apids_str)
        if pid not in apids:
            invalid_containment += 1
    print(f"   (6) all_point_ids 不含 primary_point_id: {invalid_containment} 条 (要求为 0)")
    assert invalid_containment == 0, f"Found {invalid_containment} rows where primary not in all_point_ids"

    # (6) max_grade 全库覆盖
    null_max_grade = cur.execute('SELECT count(*) FROM questions WHERE max_grade IS NULL').fetchone()[0]
    invalid_max_grade = cur.execute('SELECT count(*) FROM questions WHERE max_grade < 7 OR max_grade > 9').fetchone()[0]
    print(f"   (7) max_grade IS NULL: {null_max_grade} 条, 非法值: {invalid_max_grade} 条 (要求均为 0)")
    assert null_max_grade == 0 and invalid_max_grade == 0, "Invalid max_grade values found"

    # (7) combination_id 2204 白名单校验
    valid_combos = set(r[0] for r in core_conn.execute('SELECT combination_id FROM knowledge_combinations').fetchall())
    non_null_combos = cur.execute('SELECT DISTINCT combination_id FROM questions WHERE combination_id IS NOT NULL AND combination_id != ""').fetchall()
    invalid_combos = [c[0] for c in non_null_combos if c[0] not in valid_combos]
    print(f"   (8) 非法 combination_id: {len(invalid_combos)} 个 (要求为 0)")
    assert len(invalid_combos) == 0, f"Found invalid combination_ids: {invalid_combos}"

    combo_count = cur.execute('SELECT count(*) FROM questions WHERE combination_id IS NOT NULL AND combination_id != ""').fetchone()[0]
    combo_ratio = combo_count / final_count * 100
    print(f"   (9) combination_id 覆盖率: {combo_count}/{final_count} ({combo_ratio:.1f}%)")

    # (8) 生成题字段合法性
    gen_check = cur.execute('''
        SELECT count(*) FROM questions 
        WHERE content_status = 'generated' 
          AND (primary_point_id = 'KP-000' OR stem_en = '__PENDING__' OR answer_standard = '__PENDING__')
    ''').fetchone()[0]
    print(f"   (10) 生成题含占位符: {gen_check} 条 (要求为 0)")
    assert gen_check == 0, "Generated questions contain placeholder values"

    conn.close()
    core_conn.close()

    # 6. 双库原子同步与 SHA256 校验
    print("7. 双库原子同步: cp data/questions.db -> public/data/questions.db")
    shutil.copyfile(db_path, public_db_path)
    data_db_hash = sha256_of_file(db_path)
    public_db_hash = sha256_of_file(public_db_path)
    print(f"   data/questions.db SHA256:        {data_db_hash}")
    print(f"   public/data/questions.db SHA256: {public_db_hash}")
    assert data_db_hash == public_db_hash, "Dual DB SHA256 mismatch!"
    print("   -> 双库 SHA256 100% 一致！")

    # 7. 保存汇总统计至 stats.json
    stats = {
        "initial_count": initial_count,
        "final_count": final_count,
        "backup_path": bak_path,
        "backup_size_bytes": bak_size,
        "backup_count": bak_count,
        "stem_zh_sha256": pre_stem_hash,
        "reallocated_count": len(reallocated_questions),
        "generated_count": len(generated_rows),
        "total_kps": len(all_kps),
        "kps_under_3_count": len(under_3),
        "all_point_ids_coverage": f"{final_count}/{final_count} (100.0%)",
        "max_grade_coverage": f"{final_count}/{final_count} (100.0%)",
        "combination_id_coverage": f"{combo_count}/{final_count} ({combo_ratio:.1f}%)",
        "db_sha256": data_db_hash
    }
    with open(os.path.join(base_dir, 'tmp/data0011/stats.json'), 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print("==================================================================")
    print("🎉 TASK-DATA-0011 写库与断言校验全部圆满完成！")
    print("==================================================================")

if __name__ == '__main__':
    main()
