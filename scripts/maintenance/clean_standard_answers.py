"""
Clean 40 standard answers with bad LaTeX / unclosed delimiters in questions.db.
Updates both data/questions.db and public/data/questions.db with transaction protection.
"""
import sqlite3
import os

CLEANED_ANSWERS = {
    'Q-2025-HLJ-0012': '$x \\neq -3$',
    'Q-2025-HLJ-0040': '$x \\neq -3$',
    'Q-2025-XJ-0040': '（1）$\\left\\{ \\begin{matrix} x = 2 \\\\ y = 1 \\end{matrix} \\right.$；（2）证明见解析',
    'Q-2025-BJ-0050': '（1）$\\left\\{ \\begin{matrix} k = 2 \\\\ b = 1 \\end{matrix} \\right.$；（2）$2 \\leq m \\leq 3$',
    'Q-2025-HUB-0048': '(1) $c = - \\frac{3}{2}$；(2) 2；(3) ① $f = \\left\\{ \\begin{matrix} 2t + \\frac{5}{2} & (0 < t \\leq 1) \\\\ \\frac{1}{2}t^2 + 4 & (1 < t < 3) \\end{matrix} \\right.$',
    'Q-2025-514-0020': '(1) 图象见解析；$y = \\left\\{ \\begin{array}{r} -x - 1 & (x < -1) \\\\ x + 1 & (x \\geq -1) \\end{array} \\right.$；(2) $k > 2$ 或 $k < 0$',
    'Q-2025-CQ-0050': '(1) $y_{1} = \\left\\{ \\begin{matrix} 5 - 2x & (0 < x \\leq \\frac{5}{2}) \\\\ 2x - 5 & (\\frac{5}{2} < x < 5) \\end{matrix} \\right.$，$y_{2} = \\frac{5}{x}$；(2) 图象见解析；(3) $x$ 的取值范围见解析',
    'Q-2025-SH-0049': '（1）$\\left\\{ \\begin{matrix} b = -4 \\\\ c = 4 \\end{matrix} \\right.$；（2）① 3；② $\\frac{3}{5}$ 或 $\\frac{\\sqrt{17}}{17}$',
    'Q-2024-571020-0011': '$\\left\\{ \\begin{array}{r} x = 7 \\\\ y = -3 \\end{array} \\right.$',
    'Q-2024-571020-0018': '(1) ① $\\left\\{ \\begin{array}{r} x = 3 \\\\ y = -2 \\end{array} \\right.$；② $\\left\\{ \\begin{array}{r} x = 2 \\\\ y = -1 \\end{array} \\right.$；(2) $\\left\\{ \\begin{array}{r} x = -1 \\\\ y = 2 \\end{array} \\right.$',
    'Q-2025-25-0044': '(1) $\\left\\{ \\begin{array}{r} a = 4 \\\\ b = 3 \\end{array} \\right.$；(2) 1',
    'Q-2025-7AE16F-0002': '$\\pm 2$',
    'Q-2025-7AE16F-0019': '$-1 \\leq x < 3$',
    'Q-2025-7AE16F-0022': '(1) $a = 2, b = -3$；(2) $a + 2b = -\\frac{5}{3}$',
    'Q-2025-E9EC0C-0010': '$-\\sqrt{-a}$',
    'Q-2025-E9EC0C-0025': '$\\frac{5\\sqrt{3}}{3}$',
    'Q-2025-7FF358-0002': '$-\\sqrt{3}$',
    'Q-2025-7FF358-0005': '$2(x + \\sqrt{3})(x - \\sqrt{3})$',
    'Q-2025-7FF358-0006': '$\\frac{\\sqrt{2}}{2}$',
    'Q-2025-7FF358-0008': '$m \\geq 1$',
    'Q-2025-7FF358-0009': '$3\\sqrt{2}\\text{ cm}$',
    'Q-2025-7FF358-0010': '$\\sqrt{n + \\frac{1}{n + 2}} = (n + 1)\\sqrt{\\frac{1}{n + 2}}$',
    'Q-2025-7FF358-0017': '$6\\sqrt{3}$',
    'Q-2025-7FF358-0018': '$3\\sqrt{x}$',
    'Q-2025-7FF358-0019': '$2 + 4\\sqrt{5}$',
    'Q-2025-7FF358-0021': '$8 - 4\\sqrt{3}$',
    'Q-2025-7FF358-0022': '$CD = \\frac{\\sqrt{6}}{2}$',
    'Q-2025-7FF358-0023': '$AC = \\sqrt{2}, AD = 2, AE = 2\\sqrt{2}$；第 $n$ 个等腰直角三角形的斜边长为 $(\\sqrt{2})^{n}$',
    'Q-2025-7FF358-0025': '(1) $\\sqrt{5} - \\sqrt{3}$；(2) $\\sqrt{5} - \\sqrt{3}$；(3) $\\frac{\\sqrt{2n + 1} - 1}{2}$',
    'Q-2025-65F02A-0001': "$132^{\\circ}23'$",
    'Q-2025-65F02A-0001f': '$\\angle EOG = 40^{\\circ}$，$\\angle DOF = 10^{\\circ}$，$\\angle AOE = 100^{\\circ}$',
    'Q-2025-741C27-0011d': '$\\angle AOF = 120^{\\circ}$',
    'Q-2025-77C3DE-0003b': '$y = -\\frac{1}{2}(x + 1)^{2} + 1$（或 $y = -\\frac{1}{2}x^{2} - x + \\frac{1}{2}$）',
    'Q-2025-77C3DE-0008c': '$y = \\begin{cases} \\frac{1}{2}x^{2} & (0 \\leq x \\leq 2) \\\\ 2x - 2 & (2 < x \\leq 6) \\\\ -\\frac{1}{2}x^{2} + 8x - 20 & (6 < x \\leq 8) \\end{cases}$',
    'Q-2025-78134A-0010b': '$\\left\\{\\begin{matrix} x = -4 \\\\ y = -2 \\end{matrix}\\right.$',
    'Q-2025-78134A-0012b': '$S = n^{2}$',
    'Q-2025-8FEA9C-0005c': '$\\frac{84}{5}\\pi$',
    'Q-2025-8FEA9C-0005h': '$4\\sqrt{6}\\text{ cm} \\text{ 或 } 4\\sqrt{3}\\text{ cm}$',
    'Q-2025-8FEA9C-0005i': '$36\\pi\\text{ cm}^2$',
    'Q-2025-F6CEF6-0003b': '$-\\frac{9}{4}$',
}

def clean_database(db_path: str):
    print(f"\nProcessing database: {db_path}")
    if not os.path.exists(db_path):
        print(f"Warning: {db_path} does not exist!")
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    updated_count = 0
    diffs = []

    try:
        conn.execute('BEGIN TRANSACTION')
        for qid, new_ans in CLEANED_ANSWERS.items():
            c.execute('SELECT answer_standard FROM questions WHERE question_id = ?', (qid,))
            row = c.fetchone()
            if row:
                old_ans = row[0]
                if old_ans != new_ans:
                    c.execute('UPDATE questions SET answer_standard = ? WHERE question_id = ?', (new_ans, qid))
                    updated_count += 1
                    diffs.append((qid, old_ans, new_ans))
            else:
                print(f"Warning: question {qid} not found in {db_path}")

        conn.commit()
        print(f"Successfully updated {updated_count} questions in {db_path}")
    except Exception as e:
        conn.rollback()
        print(f"Error updating {db_path}, rolled back: {e}")
        raise e
    finally:
        conn.close()

    return diffs

if __name__ == '__main__':
    diffs = clean_database('data/questions.db')
    clean_database('public/data/questions.db')

    print("\n" + "=" * 80)
    print("40 CLEANED STANDARD ANSWERS DIFF SUMMARY:")
    print("=" * 80)
    for i, (qid, old_val, new_val) in enumerate(diffs, 1):
        print(f"{i:02d}. [{qid}]")
        print(f"    - OLD: {repr(old_val)}")
        print(f"    + NEW: {repr(new_val)}")
