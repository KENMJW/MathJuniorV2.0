#!/usr/bin/env python3
"""
回填 data/core.db 双向外键 (阶段一 步骤 3+4 外键回填)
严格遵照 EXECUTION_GUIDE_Stage34.md:
1. knowledge_points.master_example_id 回填指向 master.db 中的 ME-KP0xx
2. knowledge_points.sandbox_id 回填指向 sandbox.db 中的 SB-KP0xx (未选点留 NULL)
3. logic_lines.master_example_id 回填指向 master.db 中的 ME-LINE-xx
4. logic_lines.flagship_model_id 回填指向 sandbox.db 中的对应旗舰模型 LM-*
"""

import sqlite3

CORE_DB_PATH = "data/core.db"
MASTER_DB_PATH = "data/master.db"
SANDBOX_DB_PATH = "data/sandbox.db"

# 12 条逻辑主线旗舰模型映射表
LINE_FLAGSHIP_MAP = {
    "A1": "LM-7A-01",  # 数轴动点与绝对值几何距离模型
    "A2": "LM-8A-06",  # 乘法公式面积割补与配方恒等模型
    "A3": "LM-9A-18",  # 一元二次方程判别式与韦达对称代数模型
    "A4": "LM-9A-28",  # 二次函数与直角坐标系综合最值模型
    "G1": "LM-7A-02",  # 线段双中点与角平分线和差模型
    "G2": "LM-8A-09",  # 倍长中线与中点构造全等模型
    "G3": "LM-8B-14",  # 十字架对角线垂直与中点四边形模型
    "G4": "LM-9A-24",  # 切线长定理与内切圆/外接圆模型
    "G5": "LM-9A-19",  # 手拉手旋转全等模型
    "G6": "LM-9B-36",  # 直角三角形与锐角三角函数综合度量模型
    "S1": "LM-8B-17",  # 统计指标加权平均与方差风险决策模型
    "P1": "LM-8B-17",  # 概率度量与频率大数定律逼近模型 (统计概率旗舰)
}

def backfill_core():
    # 校验 master.db 与 sandbox.db 中的 ID
    master_conn = sqlite3.connect(MASTER_DB_PATH)
    master_c = master_conn.cursor()
    me_ids = set(r[0] for r in master_c.execute("SELECT example_id FROM master_examples;").fetchall())
    master_conn.close()

    sandbox_conn = sqlite3.connect(SANDBOX_DB_PATH)
    sandbox_c = sandbox_conn.cursor()
    sb_ids = set(r[0] for r in sandbox_c.execute("SELECT sandbox_id FROM concept_sandboxes;").fetchall())
    lm_ids = set(r[0] for r in sandbox_c.execute("SELECT model_id FROM leap_sandbox_models;").fetchall())
    sandbox_conn.close()

    core_conn = sqlite3.connect(CORE_DB_PATH)
    core_c = core_conn.cursor()

    # 1. 回填 knowledge_points
    kp_rows = core_c.execute("SELECT point_id FROM knowledge_points;").fetchall()
    kp_count = 0
    sb_linked_count = 0
    for (pid,) in kp_rows:
        num = int(pid.split('-')[1])
        me_id = f"ME-KP{num:03d}"
        sb_id = f"SB-KP{num:03d}"

        if me_id not in me_ids:
            raise ValueError(f"Target master example {me_id} not found in master.db!")

        # 检查是否选入了沙盒
        final_sb_id = sb_id if sb_id in sb_ids else None
        if final_sb_id:
            sb_linked_count += 1

        core_c.execute("""
            UPDATE knowledge_points
            SET master_example_id = ?,
                sandbox_id = ?
            WHERE point_id = ?;
        """, (me_id, final_sb_id, pid))
        kp_count += 1

    # 2. 回填 logic_lines
    lines = core_c.execute("SELECT line_id FROM logic_lines;").fetchall()
    line_count = 0
    for (lid,) in lines:
        me_line_id = f"ME-LINE-{lid}"
        flagship_id = LINE_FLAGSHIP_MAP.get(lid)

        if me_line_id not in me_ids:
            raise ValueError(f"Line master example {me_line_id} not found in master.db!")
        if flagship_id not in lm_ids:
            raise ValueError(f"Flagship model {flagship_id} not found in sandbox.db!")

        core_c.execute("""
            UPDATE logic_lines
            SET master_example_id = ?,
                flagship_model_id = ?
            WHERE line_id = ?;
        """, (me_line_id, flagship_id, lid))
        line_count += 1

    core_conn.commit()
    core_conn.close()

    print(f"Core DB backfill complete:")
    print(f"  - {kp_count} knowledge_points updated (with {sb_linked_count} concept sandboxes linked).")
    print(f"  - {line_count} logic_lines updated with ME-LINE and flagship model IDs.")

if __name__ == "__main__":
    backfill_core()
