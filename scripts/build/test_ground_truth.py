import sqlite3
import re
import json

conn = sqlite3.connect('data/questions.db')
cur = conn.cursor()
rows = cur.execute('''
    SELECT question_id, source, question_type, stem_zh, options_json, answer_standard, solutions_json 
    FROM questions WHERE content_status = 'done' ORDER BY question_id ASC;
''').fetchall()

# 1. Same source half-offset twin index
by_source = {}
for r in rows:
    by_source.setdefault(r[1], []).append(r)

twin_map = {} # qid -> (ans, sol)
for src, s_rows in by_source.items():
    n = len(s_rows)
    if n >= 20 and n % 2 == 0:
        half = n // 2
        for i in range(half):
            q_first = s_rows[i]
            q_second = s_rows[i + half]
            # Check if second has ans
            ans_2 = q_second[5]
            sol_2 = q_second[6]
            if ans_2 and ans_2 != '__PENDING__' and ans_2.strip() and sol_2 and sol_2 != '[]' and sol_2.strip():
                twin_map[q_first[0]] = (ans_2, sol_2)

print(f"Twin map matches: {len(twin_map)}")

# 2. Normalized stem index from questions.db
def norm_s(s):
    if not s: return ""
    t = re.sub(r'\[\[IMG:\d+\]\]|\!\[[^\]]*\]\([^\)]*\)', '', s)
    t = re.sub(r'[\s\u3000\n>_\*]+', '', t)
    return t

stem_index = {} # norm -> (ans, sol)
for r in rows:
    ans = r[5]
    sol = r[6]
    if ans and ans != '__PENDING__' and ans.strip() and sol and sol != '[]' and sol.strip():
        ns = norm_s(r[3])
        if len(ns) >= 8:
            stem_index[ns] = (ans, sol)
            stem_index[ns[:35]] = (ans, sol)

# 3. Add bak1 MZ solutions
conn_bak = sqlite3.connect('data/questions.db.bak_before_task0001')
cur_b = conn_bak.cursor()
bak_rows = cur_b.execute('SELECT question_id, source, stem_zh, solutions_json FROM questions WHERE solutions_json IS NOT NULL AND solutions_json != \"\" AND solutions_json != \"[]\";').fetchall()

# Map MZ answer keys from bak1
# In MZ handouts, questions 1..N have solutions in items N+1..2N
for src in set(r[1] for r in bak_rows if "微专题" in r[1]):
    mz_items = cur_b.execute('SELECT question_id, stem_zh, solutions_json FROM questions WHERE source = ? ORDER BY question_id;', (src,)).fetchall()
    # Find items with solutions
    sol_items = [item for item in mz_items if item[2] and item[2] != '[]' and item[2].strip()]
    no_sol_items = [item for item in mz_items if not item[2] or item[2] == '[]' or not item[2].strip()]
    for s_item in sol_items:
        sol_text = s_item[2]
        # Check if sol_text mentions problem entities
        for ns_item in no_sol_items:
            ns_stem = norm_s(ns_item[1])
            if len(ns_stem) >= 12 and ns_stem[:20] in norm_s(sol_text):
                # Found solution for ns_item!
                m_ans = re.search(r'故答案为[：:]\s*([^\n\r]+)', sol_text)
                ans_str = m_ans.group(1).strip().rstrip('．。') if m_ans else None
                if not ans_str and s_item[1] and len(s_item[1]) < 30:
                    ans_str = s_item[1].strip()
                if ans_str:
                    stem_index[ns_stem] = (ans_str, sol_text)

# Check total resolved
missing = [r for r in rows if not r[5] or r[5] == '__PENDING__' or not r[5].strip()]
resolved = 0
for r in missing:
    qid = r[0]
    ns = norm_s(r[3])
    if qid in twin_map or ns in stem_index or ns[:35] in stem_index:
        resolved += 1

print(f"Total missing: {len(missing)}, Total resolved by ground truth: {resolved}")
print(f"Remaining to solve mathematically: {len(missing) - resolved}")
