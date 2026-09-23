import sqlite3
import json
import re
import os

CH_RE = re.compile(r'[\u4e00-\u9fff]')

def main():
    print("=" * 60)
    print("FULL SYSTEM BILINGUAL COMPLETION AUDIT")
    print("=" * 60)

    # 1. Audit Sandbox DB
    print("\n--- 1. Sandbox DB (concept_sandboxes) ---")
    for db in ["data/sandbox.db", "public/data/sandbox.db", "dist/data/sandbox.db"]:
        if not os.path.exists(db):
            continue
        c = sqlite3.connect(db)
        cur = c.cursor()
        cur.execute("SELECT sandbox_id, param_sliders_json, invariants_display_json FROM concept_sandboxes")
        rows = cur.fetchall()
        c.close()

        total_sliders = 0
        missing_slider_en = 0
        total_inv = 0
        missing_inv_en = 0
        for _, s_json, inv_json in rows:
            if s_json:
                for s in json.loads(s_json):
                    total_sliders += 1
                    if not s.get("nameEn"):
                        missing_slider_en += 1
            if inv_json:
                for inv in json.loads(inv_json):
                    total_inv += 1
                    if not inv.get("labelEn"):
                        missing_inv_en += 1

        print(f"[{db}] Sliders: {total_sliders - missing_slider_en}/{total_sliders} with nameEn (Missing: {missing_slider_en})")
        print(f"[{db}] Invariants: {total_inv - missing_inv_en}/{total_inv} with labelEn (Missing: {missing_inv_en})")

    # 2. Audit Core DB (knowledge_points)
    print("\n--- 2. Core DB (knowledge_points subcategory_en) ---")
    for db in ["data/core.db", "public/data/core.db", "dist/data/core.db"]:
        if not os.path.exists(db):
            continue
        c = sqlite3.connect(db)
        cur = c.cursor()
        cur.execute("SELECT count(*), count(subcategory_en) FROM knowledge_points")
        tot, with_en = cur.fetchone()
        cur.execute("SELECT DISTINCT subcategory, subcategory_en FROM knowledge_points")
        distinct_subcats = cur.fetchall()
        c.close()
        print(f"[{db}] Knowledge points: {with_en}/{tot} have subcategory_en. Distinct subcategories: {len(distinct_subcats)}")

    # 3. Audit Questions DB (rubrics & solutions)
    print("\n--- 3. Questions DB (rubric_checklist_json & solutions_json) ---")
    for db in ["data/questions.db", "public/data/questions.db", "dist/data/questions.db"]:
        if not os.path.exists(db):
            continue
        c = sqlite3.connect(db)
        cur = c.cursor()
        
        # Stems
        cur.execute("SELECT count(*), count(stem_en) FROM questions")
        tot_q, with_stem = cur.fetchone()
        cur.execute("SELECT count(*) FROM questions WHERE stem_en GLOB '*[\u4e00-\u9fff]*'")
        chinglish_stems = cur.fetchone()[0]

        # Rubrics
        cur.execute("SELECT question_id, rubric_checklist_json FROM questions WHERE rubric_checklist_json IS NOT NULL")
        rub_rows = cur.fetchall()
        missing_rub_en = 0
        for qid, rub_str in rub_rows:
            d = json.loads(rub_str)
            for it in d:
                if not it.get("descriptionEn") or CH_RE.search(it.get("descriptionEn", "")):
                    missing_rub_en += 1

        # Solutions
        cur.execute("SELECT question_id, solutions_json FROM questions WHERE solutions_json IS NOT NULL")
        sol_rows = cur.fetchall()
        total_sol_items = 0
        missing_sol_en = 0
        for qid, s_str in sol_rows:
            d = json.loads(s_str)
            for it in d:
                total_sol_items += 1
                if not it.get("text_en") or not it.get("method_en"):
                    missing_sol_en += 1

        c.close()
        print(f"[{db}] Stems: {with_stem}/{tot_q} (Chinglish: {chinglish_stems})")
        print(f"[{db}] Rubrics: {len(rub_rows)} questions, missing/Chinglish descriptionEn: {missing_rub_en}")
        print(f"[{db}] Solutions: {len(sol_rows)} questions ({total_sol_items} items), missing text_en/method_en: {missing_sol_en}")

    print("\n" + "=" * 60)
    print("ALL AUDIT CHECKS COMPLETED!")
    print("=" * 60)

if __name__ == "__main__":
    main()
