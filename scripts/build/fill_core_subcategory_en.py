import sqlite3
import os

SUBCATEGORY_MAP = {
    "三角形": "Triangles",
    "不等式": "Inequalities",
    "代数式": "Algebraic Expressions",
    "几何基础": "Geometric Foundations",
    "函数": "Functions",
    "分式": "Rational Expressions",
    "四边形": "Quadrilaterals",
    "图形变换": "Geometric Transformations",
    "圆": "Circles",
    "实数": "Real Numbers",
    "数据分析": "Data Analysis",
    "数据收集整理": "Data Collection & Organization",
    "方程组": "Systems of Equations",
    "概率": "Probability",
    "锐角三角函数": "Trigonometric Functions",
}

def update_core_db(db_path: str):
    if not os.path.exists(db_path):
        print(f"Skipping non-existent db: {db_path}")
        return

    print(f"\nProcessing {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("PRAGMA table_info(knowledge_points)")
    cols = [c[1] for c in cur.fetchall()]
    if "subcategory_en" not in cols:
        print("  Adding column subcategory_en to knowledge_points...")
        cur.execute("ALTER TABLE knowledge_points ADD COLUMN subcategory_en VARCHAR(64)")

    for zh, en in SUBCATEGORY_MAP.items():
        cur.execute("UPDATE knowledge_points SET subcategory_en = ? WHERE subcategory = ?", (en, zh))

    conn.commit()

    # Verification
    cur.execute("SELECT count(*) FROM knowledge_points WHERE subcategory_en IS NULL OR subcategory_en = ''")
    missing_count = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM knowledge_points")
    total_count = cur.fetchone()[0]
    conn.close()

    print(f"  {db_path}: Total points: {total_count}, Missing subcategory_en: {missing_count}")

def main():
    dbs = ["data/core.db", "public/data/core.db", "dist/data/core.db"]
    for db in dbs:
        update_core_db(db)

if __name__ == "__main__":
    main()
