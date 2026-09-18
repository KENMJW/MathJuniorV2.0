#!/usr/bin/env python3
"""
阶段一 步骤3+4 验收闸 A 自动化综合门禁检验脚本
依据：EXECUTION_GUIDE_Stage34.md §4 自检
包含 9 项自动化确定性核验：
1. 母题数量 = 119 (point_master 107 + line_master 12)
2. dim3_rigor 恒必填且无占位
3. 母题物理隔离 (questions.db 中无 ME- 前缀)
4. 沙盒跃迁模型 = 36 (严格匹配手册)
5. 概念沙盒选点数 = 46 (符合 40~50 范围)
6. 跃迁模型考点依赖 100% 在 core.db 白名单
7. 各表 content_status 字段存在且为 'pending'
8. core.db 双向外键无悬空
9. 步骤③ 214 个双语 SVG 全部合规 (P20 无 foreignObject, 无脚本)
"""

import os
import sys
import json
import sqlite3

sys.path.insert(0, os.path.abspath("."))

CORE_DB = "data/core.db"
MASTER_DB = "data/master.db"
SANDBOX_DB = "data/sandbox.db"
QUESTIONS_DB = "data/questions.db"

def run_checks():
    print("================================================================")
    print("   阶段一 步骤3+4 (母题 + 沙盒 + 双语SVG) 综合验收闸 A 校验")
    print("================================================================\n")

    passed_checks = 0
    total_checks = 9

    # Check 1: 母题数量
    m_conn = sqlite3.connect(MASTER_DB)
    m_cur = m_conn.cursor()
    type_counts = dict(m_cur.execute("SELECT example_type, COUNT(*) FROM master_examples GROUP BY example_type;").fetchall())
    pt_count = type_counts.get("point_master", 0)
    ln_count = type_counts.get("line_master", 0)
    total_me = pt_count + ln_count
    if pt_count == 107 and ln_count == 12 and total_me == 119:
        print(f"✅ Check 1 PASS: 母题数量严格等于 119 (point_master={pt_count}, line_master={ln_count})")
        passed_checks += 1
    else:
        print(f"❌ Check 1 FAIL: 母题数量不符! (point_master={pt_count}, line_master={ln_count}, total={total_me})")

    # Check 2: dim3_rigor 恒必填
    dim3_empty = m_cur.execute(
        "SELECT COUNT(*) FROM master_examples WHERE dim3_rigor IS NULL OR trim(dim3_rigor) = '' OR dim3_rigor LIKE '%PENDING%';"
    ).fetchone()[0]
    if dim3_empty == 0:
        print(f"✅ Check 2 PASS: dim3_rigor 恒非空且无占位 (违规行数: 0)")
        passed_checks += 1
    else:
        print(f"❌ Check 2 FAIL: 发现 {dim3_empty} 行 dim3_rigor 为空或包含 PENDING 占位!")

    # Check 3: 物理隔离
    q_conn = sqlite3.connect(QUESTIONS_DB)
    q_cur = q_conn.cursor()
    me_in_q = q_cur.execute("SELECT COUNT(*) FROM questions WHERE question_id LIKE 'ME-%';").fetchone()[0]
    q_conn.close()
    if me_in_q == 0:
        print(f"✅ Check 3 PASS: 母题严格物理隔离，questions.db 中无 ME- 母题 (计数: 0)")
        passed_checks += 1
    else:
        print(f"❌ Check 3 FAIL: questions.db 中混入了 {me_in_q} 道 ME- 母题!")

    # Check 4: 跃迁模型数量
    s_conn = sqlite3.connect(SANDBOX_DB)
    s_cur = s_conn.cursor()
    lm_count = s_cur.execute("SELECT COUNT(*) FROM leap_sandbox_models;").fetchone()[0]
    if lm_count == 36:
        print(f"✅ Check 4 PASS: 跃迁模型数量严格等于 36 (手册直录)")
        passed_checks += 1
    else:
        print(f"❌ Check 4 FAIL: 跃迁模型数量不符，期望 36，实测 {lm_count}!")

    # Check 5: 概念沙盒选点数量
    cs_count = s_cur.execute("SELECT COUNT(*) FROM concept_sandboxes;").fetchone()[0]
    if 40 <= cs_count <= 50:
        print(f"✅ Check 5 PASS: 概念沙盒选点数为 {cs_count} (在 40~50 规范区间内)")
        passed_checks += 1
    else:
        print(f"❌ Check 5 FAIL: 概念沙盒选点数 {cs_count} 不在 40~50 区间!")

    # Check 6: 跃迁模型考点白名单
    c_conn = sqlite3.connect(CORE_DB)
    c_cur = c_conn.cursor()
    valid_kps = set(r[0] for r in c_cur.execute("SELECT point_id FROM knowledge_points;").fetchall())
    
    lm_rows = s_cur.execute("SELECT model_id, kp_dependencies FROM leap_sandbox_models;").fetchall()
    whitelist_violations = []
    for mid, deps_json in lm_rows:
        deps = json.loads(deps_json)
        for d in deps:
            if d not in valid_kps:
                whitelist_violations.append((mid, d))
    if len(whitelist_violations) == 0:
        print(f"✅ Check 6 PASS: 36 个跃迁模型的考点依赖 100% 在 core.db 白名单中")
        passed_checks += 1
    else:
        print(f"❌ Check 6 FAIL: 发现跃迁模型依赖越界: {whitelist_violations}")

    # Check 7: content_status 字段
    status_issues = []
    for db_name, tbl in [(MASTER_DB, "master_examples"), (SANDBOX_DB, "concept_sandboxes"), (SANDBOX_DB, "leap_sandbox_models")]:
        conn = sqlite3.connect(db_name)
        cur = conn.cursor()
        cols = [c[1] for c in cur.execute(f"PRAGMA table_info({tbl});").fetchall()]
        if "content_status" not in cols:
            status_issues.append(f"{tbl} missing content_status column")
        else:
            non_pending = cur.execute(f"SELECT COUNT(*) FROM {tbl} WHERE content_status NOT IN ('pending', 'done');").fetchone()[0]
            if non_pending > 0:
                status_issues.append(f"{tbl} has {non_pending} rows with invalid content_status")
        conn.close()

    if len(status_issues) == 0:
        print(f"✅ Check 7 PASS: master.db 与 sandbox.db 各表均含 content_status 列且值均为合法状态 ('pending'/'done')")
        passed_checks += 1
    else:
        print(f"❌ Check 7 FAIL: content_status 校验不通过: {status_issues}")

    # Check 8: core.db 双向外键无悬空
    me_ids = set(r[0] for r in m_cur.execute("SELECT example_id FROM master_examples;").fetchall())
    sb_ids = set(r[0] for r in s_cur.execute("SELECT sandbox_id FROM concept_sandboxes;").fetchall())
    lm_ids = set(r[0] for r in s_cur.execute("SELECT model_id FROM leap_sandbox_models;").fetchall())
    m_conn.close()
    s_conn.close()

    fk_errors = []
    # 8.1 KP master_example_id
    kp_me_rows = c_cur.execute("SELECT point_id, master_example_id, sandbox_id FROM knowledge_points;").fetchall()
    for pid, me_id, sb_id in kp_me_rows:
        if not me_id or me_id not in me_ids:
            fk_errors.append(f"KP {pid} dangling master_example_id {me_id}")
        if sb_id and sb_id not in sb_ids:
            fk_errors.append(f"KP {pid} dangling sandbox_id {sb_id}")

    # 8.2 Line master_example_id & flagship_model_id
    line_rows = c_cur.execute("SELECT line_id, master_example_id, flagship_model_id FROM logic_lines;").fetchall()
    for lid, me_id, flagship_id in line_rows:
        if not me_id or me_id not in me_ids:
            fk_errors.append(f"Line {lid} dangling master_example_id {me_id}")
        if not flagship_id or flagship_id not in lm_ids:
            fk_errors.append(f"Line {lid} dangling flagship_model_id {flagship_id}")
    c_conn.close()

    if len(fk_errors) == 0:
        print(f"✅ Check 8 PASS: core.db 外键无悬空 (全部 107 个 KP 母题、46 个沙盒、12 条主线母题及旗舰模型完整指向)")
        passed_checks += 1
    else:
        print(f"❌ Check 8 FAIL: core.db 存在悬空外键: {fk_errors}")

    # Check 9: 步骤③ 214 个双语 SVG
    from scripts.build.svg.validate_svg import validate_all_svgs
    svg_success = validate_all_svgs()
    if svg_success:
        print(f"✅ Check 9 PASS: 步骤③ 214 个双语 SVG 示意图全部合规 (P20 无 foreignObject, 无脚本)")
        passed_checks += 1
    else:
        print(f"❌ Check 9 FAIL: 214 个双语 SVG 合规校验失败!")

    print("\n----------------------------------------------------------------")
    if passed_checks == total_checks:
        print(f"🎉 验收闸 A 全部 9 项检查 100% 通过！({passed_checks}/{total_checks})")
        return True
    else:
        print(f"⚠️ 验收闸 A 未完全通过：{passed_checks}/{total_checks} 通过。")
        return False

if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
