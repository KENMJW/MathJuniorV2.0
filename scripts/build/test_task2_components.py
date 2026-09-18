import sqlite3
import json
import re

conn = sqlite3.connect('data/questions.db')
cur = conn.cursor()
rows = cur.execute('''
    SELECT question_id, source, question_type, grade_level, semester, 
           primary_point_id, difficulty_level, score_default, stem_zh, 
           stem_en, options_json, answer_standard, solutions_json, rubric_checklist_json
    FROM questions
    WHERE content_status = 'done'
    ORDER BY question_id ASC;
''').fetchall()

print(f"Total rows: {len(rows)}")
