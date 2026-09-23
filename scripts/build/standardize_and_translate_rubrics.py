import sqlite3
import json
import re
import os
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

CH_RE = re.compile(r'[\u4e00-\u9fff]')

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
]

def raw_google_translate(text: str) -> str:
    url = "https://clients5.google.com/translate_a/t"
    params = {
        "client": "dict-chrome-ex",
        "sl": "zh-CN",
        "tl": "en",
        "q": text,
    }
    encoded_url = f"{url}?{urllib.parse.urlencode(params)}"
    for attempt in range(4):
        try:
            req = urllib.request.Request(
                encoded_url,
                headers={"User-Agent": USER_AGENTS[attempt % len(USER_AGENTS)]}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                result = response.read().decode('utf-8')
                data = json.loads(result)
                if isinstance(data, list) and len(data) > 0:
                    if isinstance(data[0], list):
                        return "".join([part[0] for part in data[0] if isinstance(part, list) and len(part) > 0])
                    elif isinstance(data[0], str):
                        return data[0]
                return str(data)
        except Exception:
            time.sleep(0.5 * (attempt + 1))
    return ""

def translate_rubric_desc(desc: str) -> str:
    # 占位符隔离数学公式与字母符号
    # 比如 5√3/3, Rt△ABC, SSS, x=40 等
    # 针对评分标准语句，直接翻译通常很准确
    # 先做公式保护
    tokens = []
    def repl(m):
        idx = len(tokens)
        tokens.append(m.group(0))
        return f" <m{idx}/> "

    # 保护 $...$ 或数学符号
    protected = re.sub(r"\$[^\$]+\$|√\d+|\b[A-Z]{2,4}\b", repl, desc)
    translated = raw_google_translate(protected)
    
    # 还原
    for i, tok in enumerate(tokens):
        translated = re.sub(rf"<\s*m\s*{i}\s*/?\s*>", tok, translated, flags=re.IGNORECASE)
    
    # 清理多余空格
    cleaned = re.sub(r'\s+', ' ', translated).strip()
    return cleaned

def main():
    db_paths = ["data/questions.db", "public/data/questions.db", "dist/data/questions.db"]
    conn = sqlite3.connect("data/questions.db")
    cur = conn.cursor()
    cur.execute("SELECT question_id, rubric_checklist_json FROM questions WHERE rubric_checklist_json IS NOT NULL")
    rows = cur.fetchall()
    conn.close()

    # 提取所有 unique Shape A desc
    unique_descs = set()
    for qid, rub in rows:
        data = json.loads(rub)
        if 'desc' in data[0] or 'step' in data[0]:
            for s in data:
                d = s.get('desc', '').strip()
                if d:
                    unique_descs.add(d)

    print(f"Total unique Shape A descriptions to translate: {len(unique_descs)}")
    
    # 缓存
    cache_file = "tmp/rubric_desc_translations.json"
    cache = {}
    if os.path.exists(cache_file):
        with open(cache_file, "r", encoding="utf-8") as f:
            cache = json.load(f)

    needed = [d for d in unique_descs if d not in cache]
    print(f"Needed translations: {len(needed)}")

    if needed:
        def worker(d):
            trans = translate_rubric_desc(d)
            return d, trans

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(worker, d) for d in needed]
            for i, f in enumerate(as_completed(futures), 1):
                d, trans = f.result()
                if trans:
                    cache[d] = trans
                if i % 50 == 0 or i == len(needed):
                    print(f"Progress: {i}/{len(needed)}")
                    with open(cache_file, "w", encoding="utf-8") as cf:
                        json.dump(cache, cf, ensure_ascii=False, indent=2)

        with open(cache_file, "w", encoding="utf-8") as cf:
            json.dump(cache, cf, ensure_ascii=False, indent=2)

    # 现在更新所有数据库
    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
        print(f"\nUpdating {db_path}...")
        c = sqlite3.connect(db_path)
        cursor = c.cursor()
        cursor.execute("SELECT question_id, rubric_checklist_json FROM questions WHERE rubric_checklist_json IS NOT NULL")
        all_rub_rows = cursor.fetchall()

        updated_count = 0
        for qid, rub in all_rub_rows:
            data = json.loads(rub)
            # 无论是 Shape A 还是 Shape B，均统一标准化包含所有字段
            standardized = []
            for s in data:
                step_idx = s.get("stepIndex") or s.get("step") or 1
                points = s.get("points") or s.get("score") or 1
                desc_zh = (s.get("descriptionZh") or s.get("desc") or "").strip()
                desc_en = (s.get("descriptionEn") or s.get("desc_en") or cache.get(desc_zh) or "").strip()
                
                # 如果没有 desc_en 但有缓存
                if not desc_en and desc_zh in cache:
                    desc_en = cache[desc_zh]

                standardized.append({
                    "stepIndex": int(step_idx),
                    "points": int(points),
                    "descriptionZh": desc_zh,
                    "descriptionEn": desc_en or desc_zh,
                    "step": int(step_idx),
                    "score": int(points),
                    "desc": desc_zh,
                    "desc_en": desc_en or desc_zh,
                })

            new_rub_json = json.dumps(standardized, ensure_ascii=False)
            cursor.execute("UPDATE questions SET rubric_checklist_json = ? WHERE question_id = ?", (new_rub_json, qid))
            updated_count += 1

        c.commit()

        # 验证
        cursor.execute("SELECT question_id, rubric_checklist_json FROM questions WHERE rubric_checklist_json IS NOT NULL")
        check_rows = cursor.fetchall()
        missing_en = 0
        for qid, rub in check_rows:
            d = json.loads(rub)
            if not all(s.get("descriptionEn") and not CH_RE.search(s.get("descriptionEn", "")) for s in d):
                missing_en += 1
        c.close()
        print(f"  {db_path}: Standardized {updated_count} rubrics. Missing or non-English descriptionEn: {missing_en}/532")

if __name__ == "__main__":
    main()
