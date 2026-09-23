import sqlite3
import json
import os

CACHE_FILE = "tmp/solutions_translations_cache.json"
METHOD_CACHE_FILE = "tmp/methods_translations_cache.json"

def main():
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        text_cache = json.load(f)
    with open(METHOD_CACHE_FILE, "r", encoding="utf-8") as f:
        method_cache = json.load(f)

    print(f"Loaded {len(text_cache)} solution texts and {len(method_cache)} methods from cache.")

    db_paths = ["data/questions.db", "public/data/questions.db", "dist/data/questions.db"]
    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
        print(f"\nUpdating {db_path}...")
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT question_id, solutions_json FROM questions WHERE solutions_json IS NOT NULL")
        rows = cur.fetchall()

        update_batch = []
        for qid, sol_str in rows:
            try:
                items = json.loads(sol_str)
                if isinstance(items, list):
                    for it in items:
                        m_zh = it.get("method", "").strip()
                        t_zh = it.get("text", "").strip()
                        it["method_en"] = method_cache.get(m_zh, m_zh)
                        it["text_en"] = text_cache.get(t_zh, t_zh)
                    new_sol_str = json.dumps(items, ensure_ascii=False)
                    update_batch.append((new_sol_str, qid))
            except Exception as e:
                print(f"Error parsing {qid}: {e}")

        cur.executemany("UPDATE questions SET solutions_json = ? WHERE question_id = ?", update_batch)
        conn.commit()

        # Audit
        cur.execute("SELECT question_id, solutions_json FROM questions WHERE solutions_json IS NOT NULL")
        check_rows = cur.fetchall()
        total_items = 0
        missing_text_en = 0
        for qid, s_str in check_rows:
            d = json.loads(s_str)
            for it in d:
                total_items += 1
                if not it.get("text_en"):
                    missing_text_en += 1
        conn.close()
        print(f"  {db_path}: Updated {len(update_batch)} questions. Total solution items: {total_items}, Missing text_en: {missing_text_en}")

if __name__ == "__main__":
    main()
