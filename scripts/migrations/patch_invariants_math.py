#!/usr/bin/env python3
"""
PLAN-MODEL-REPAIR-V2 【轨道 2】：遥测数学计算引擎与底库迁移
脚本: scripts/migrations/patch_invariants_math.py

功能:
1. 连接 data/sandbox.db (并同步更新 public/data/sandbox.db)。
2. 修复 SB-KP057 (勾股定理): 彻底根除 25 vs 5 矛盾，重构为平方和与斜边平方遥测项。
3. 修复 SB-KP008 (平方根夹逼): 补全下界整数 n、上界整数 n+1、夹逼不等式及无理数小数部分遥测项。
4. 修复 SB-KP085 (同角三角函数): 补全真实的同角三角函数平方和公式 sin²A + cos²A ≡ 1 及对应几何三角比。
5. 打印受影响行数与更新结果。
"""

import sqlite3
import json
import os
import shutil
import time

DB_PATHS = ['data/sandbox.db', 'public/data/sandbox.db']
BACKUP_DIR = 'data/db_backups'

def backup_databases():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = int(time.time())
    for db_path in DB_PATHS:
        if os.path.exists(db_path):
            base_name = os.path.basename(db_path)
            bak_path = os.path.join(BACKUP_DIR, f"{base_name}.patch_invariants_math_{ts}.bak")
            shutil.copy2(db_path, bak_path)
            print(f"[Backup] {db_path} -> {bak_path}")

def get_patches():
    # 1. SB-KP057: 勾股定理
    new_kp057_invs = [
        {
            "id": "inv_pythagorean_sum",
            "formula": "leg_a^2 + leg_b^2",
            "deps": ["leg_a", "leg_b"],
            "labelZh": "两直角边平方和 a² + b²",
            "isConstant": False,
            "labelEn": "Sum of Legs Squared a² + b²"
        },
        {
            "id": "inv_hypot_c_sq",
            "formula": "hypot * hypot",
            "deps": ["leg_a", "leg_b"],
            "labelZh": "斜边平方 c²",
            "isConstant": False,
            "labelEn": "Hypotenuse Squared c²"
        },
        {
            "id": "inv_pythagoras_closure",
            "formula": "abs((leg_a^2 + leg_b^2) - (hypot * hypot)) < 0.01 ? '勾股恒等守恒成立 (a²+b²≡c²)' : '计算中'",
            "deps": ["leg_a", "leg_b"],
            "labelZh": "勾股恒等关系",
            "isConstant": True,
            "labelEn": "Pythagorean Identity a² + b² ≡ c²"
        }
    ]

    # 2. SB-KP008: 平方根夹逼
    new_kp008_invs = [
        {
            "id": "inv_sqrt",
            "formula": "sqrt(val_base)",
            "deps": ["val_base"],
            "labelZh": "无理数取值 √a 锁定",
            "isConstant": False,
            "labelEn": "Irrational Value √a Locked"
        },
        {
            "id": "inv_lower_bound",
            "formula": "floor(sqrt(val_base))",
            "deps": ["val_base"],
            "labelZh": "区间下界整数 n",
            "isConstant": False,
            "labelEn": "Lower Bound Integer n"
        },
        {
            "id": "inv_upper_bound",
            "formula": "floor(sqrt(val_base)) + 1",
            "deps": ["val_base"],
            "labelZh": "区间上界整数 n+1",
            "isConstant": False,
            "labelEn": "Upper Bound Integer n+1"
        },
        {
            "id": "inv_sq_ineq",
            "formula": "val_base",
            "deps": ["val_base"],
            "labelZh": "完全平方数夹逼不等式",
            "state_label": "val_base < 4 ? '1 < a < 4 => 1 < √a < 2' : (val_base < 9 ? '4 <= a < 9 => 2 <= √a < 3' : (val_base < 16 ? '9 <= a < 16 => 3 <= √a < 4' : '16 <= a < 25 => 4 <= √a < 5'))",
            "isConstant": False,
            "labelEn": "Perfect Square Squeeze Inequality"
        },
        {
            "id": "inv_diff",
            "formula": "sqrt(val_base) - floor(sqrt(val_base))",
            "deps": ["val_base"],
            "labelZh": "无理数小数部分 (√a - n)",
            "isConstant": False,
            "labelEn": "Irrational Fractional Part (√a - n)"
        }
    ]

    # 3. SB-KP085: 同角三角函数
    new_kp085_invs = [
        {
            "id": "inv_angle_A",
            "type": "angle",
            "deps": ["B", "C", "A"],
            "formula": "\\angle A = {val}^\\circ",
            "labelZh": "锐角 A 真实度数",
            "isConstant": False,
            "labelEn": "Acute Angle A Exact Measure"
        },
        {
            "id": "inv_sin_A",
            "type": "ratio_distance",
            "deps": ["A", "B", "B", "C"],
            "formula": "\\sin A = AB/BC = {val}",
            "labelZh": "正弦值 (对边/斜边)",
            "isConstant": False,
            "labelEn": "Sine (Opposite / Hypotenuse)"
        },
        {
            "id": "inv_cos_A",
            "type": "ratio_distance",
            "deps": ["A", "C", "B", "C"],
            "formula": "\\cos A = AC/BC = {val}",
            "labelZh": "余弦值 (邻边/斜边)",
            "isConstant": False,
            "labelEn": "Cosine (Adjacent / Hypotenuse)"
        },
        {
            "id": "inv_tan_A",
            "type": "ratio_distance",
            "deps": ["A", "B", "A", "C"],
            "formula": "\\tan A = AB/AC = {val}",
            "labelZh": "正切值 (对边/邻边)",
            "isConstant": False,
            "labelEn": "Tangent (Opposite / Adjacent)"
        },
        {
            "id": "inv_pythagorean_identity",
            "formula": "sin(angle_A * pi / 180)^2 + cos(angle_A * pi / 180)^2",
            "deps": ["angle_A"],
            "labelZh": "同角三角函数平方和公式 sin²A + cos²A",
            "isConstant": True,
            "labelEn": "Pythagorean Trigonometric Identity sin²A + cos²A"
        }
    ]

    return {
        'SB-KP057': new_kp057_invs,
        'SB-KP008': new_kp008_invs,
        'SB-KP085': new_kp085_invs,
    }

def apply_migrations():
    backup_databases()
    patches = get_patches()

    total_updated = 0

    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            print(f"[Warning] Database file not found: {db_path}, skipping.")
            continue

        print(f"\n[Migrating] Connecting to {db_path} ...")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        db_updated = 0

        try:
            with conn:
                for sandbox_id, invs in patches.items():
                    inv_json = json.dumps(invs, ensure_ascii=False)
                    c.execute(
                        "UPDATE concept_sandboxes SET invariants_display_json = ? WHERE sandbox_id = ?",
                        (inv_json, sandbox_id)
                    )
                    affected = c.rowcount
                    db_updated += affected
                    print(f"  -> {sandbox_id}: {affected} row(s) updated.")

            print(f"[Success] {db_path} migration completed. Total affected rows: {db_updated}")
            total_updated += db_updated
        finally:
            conn.close()

    print(f"\n==========================================")
    print(f"All database migrations finished! Total rows modified: {total_updated}")
    print(f"==========================================")

if __name__ == '__main__':
    apply_migrations()
