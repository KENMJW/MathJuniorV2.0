import sqlite3
import json
import re
import html
import urllib.request
import urllib.parse
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

CACHE_FILE = "tmp/solutions_translations_cache.json"
METHOD_CACHE_FILE = "tmp/methods_translations_cache.json"

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
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
            with urllib.request.urlopen(req, timeout=12) as response:
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

def translate_solution_text(text: str):
    if not text or not text.strip():
        return "", "empty"

    try:
        # 1. 占位符隔离数学公式
        math_tokens = []
        def repl_math(m):
            idx = len(math_tokens)
            math_tokens.append(m.group(0))
            return f" <m{idx}/> "

        protected = re.sub(r"\$\$[^\$]+\$\$|\$[^\$]+\$", repl_math, text)

        # 2. 占位符隔离图片
        img_tokens = []
        def repl_img(m):
            idx = len(img_tokens)
            img_tokens.append(m.group(0))
            return f" <img{idx}/> "

        protected = re.sub(r"\[\[IMG:\d+\]\]", repl_img, protected)

        # 3. 常见标记前置替换，提高翻译学术规范度
        pre_map = {
            "【解答】解：": "\n[Solution] ",
            "【详解】解：": "\n[Detailed Solution] ",
            "【解答】": "\n[Solution] ",
            "【详解】": "\n[Detailed Solution] ",
            "【分析】": "\n[Analysis] ",
            "【点评】": "\n[Key Takeaway] ",
            "故选：": "Therefore, the correct choice is: ",
        }
        for k, v in pre_map.items():
            protected = protected.replace(k, v)

        # 4. 翻译
        translated = raw_google_translate(protected)
        if not translated:
            return None, "Translation API failed"

        translated = html.unescape(translated)

        # 5. 还原图片 (使用 lambda 避免反斜杠被识别为转义)
        for i, tok in enumerate(img_tokens):
            translated = re.sub(rf"<\s*img\s*{i}\s*/?\s*>", lambda m, t=tok: t, translated, flags=re.IGNORECASE)

        # 6. 还原数学公式 (使用 lambda 避免反斜杠被识别为转义)
        for i, tok in enumerate(math_tokens):
            translated = re.sub(rf"<\s*m\s*{i}\s*/?\s*>", lambda m, t=tok: t, translated, flags=re.IGNORECASE)

        return translated.strip(), "ok"
    except Exception as e:
        return None, str(e)

METHOD_MAP_BASE = {
    "解法一": "Method 1",
    "解法二": "Method 2",
    "解法三": "Method 3",
    "解法四": "Method 4",
    "解法五": "Method 5",
}

def translate_single_method(method: str) -> str:
    if not method:
        return ""
    if method in METHOD_MAP_BASE:
        return METHOD_MAP_BASE[method]

    m = re.match(r"(解法[一二三四五12345])\s*\((.*?)\)", method)
    if m:
        base = METHOD_MAP_BASE.get(m.group(1), "Method 1")
        sub_zh = m.group(2)
        sub_en = raw_google_translate(sub_zh)
        return f"{base} ({sub_en})"

    return raw_google_translate(method)

def load_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_json(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    text_cache = load_json(CACHE_FILE)
    method_cache = load_json(METHOD_CACHE_FILE)
    print(f"Loaded {len(text_cache)} cached solution texts, {len(method_cache)} methods.", flush=True)

    conn = sqlite3.connect("data/questions.db")
    cur = conn.cursor()
    cur.execute("SELECT question_id, solutions_json FROM questions WHERE solutions_json IS NOT NULL")
    all_rows = cur.fetchall()
    conn.close()

    unique_texts = set()
    unique_methods = set()
    for qid, sol_str in all_rows:
        try:
            items = json.loads(sol_str)
            if isinstance(items, list):
                for it in items:
                    t = it.get("text", "").strip()
                    m = it.get("method", "").strip()
                    if t and t not in text_cache:
                        unique_texts.add(t)
                    if m and m not in method_cache:
                        unique_methods.add(m)
        except:
            pass

    print(f"Unique methods needing translation: {len(unique_methods)}", flush=True)
    print(f"Unique solution texts needing translation: {len(unique_texts)}", flush=True)

    # 1. 并发翻译方法名称
    if unique_methods:
        needed_m = list(unique_methods)
        print("Translating methods concurrently...", flush=True)
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(lambda m: (m, translate_single_method(m)), m) for m in needed_m]
            for idx, fut in enumerate(as_completed(futures), 1):
                m, m_en = fut.result()
                if m_en:
                    method_cache[m] = m_en
                if idx % 50 == 0 or idx == len(needed_m):
                    print(f"  Methods progress: {idx}/{len(needed_m)}", flush=True)
                    save_json(METHOD_CACHE_FILE, method_cache)
        save_json(METHOD_CACHE_FILE, method_cache)
        print(f"Completed methods translation. Total cached: {len(method_cache)}", flush=True)

    # 2. 并发翻译解析正文
    if unique_texts:
        needed_texts = list(unique_texts)
        start_time = time.time()
        success_count = 0
        fail_count = 0

        def text_worker(t):
            try:
                en, status = translate_solution_text(t)
                return t, en, status
            except Exception as e:
                return t, None, str(e)

        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(text_worker, t) for t in needed_texts]
            for idx, fut in enumerate(as_completed(futures), 1):
                t, en, status = fut.result()
                if en and status == "ok":
                    text_cache[t] = en
                    success_count += 1
                else:
                    fail_count += 1

                if idx % 25 == 0 or idx == len(needed_texts):
                    elapsed = time.time() - start_time
                    rate = idx / max(1, elapsed)
                    print(f"Texts Progress: {idx}/{len(needed_texts)} (Success: {success_count}, Failed: {fail_count}) | {rate:.1f} texts/s", flush=True)
                    save_json(CACHE_FILE, text_cache)

        save_json(CACHE_FILE, text_cache)
        print("Completed all text translations.", flush=True)

    # 3. 刷入所有数据库
    db_paths = ["data/questions.db", "public/data/questions.db", "dist/data/questions.db"]
    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
        print(f"\nUpdating {db_path}...", flush=True)
        c = sqlite3.connect(db_path)
        cursor = c.cursor()
        cursor.execute("SELECT question_id, solutions_json FROM questions WHERE solutions_json IS NOT NULL")
        rows = cursor.fetchall()

        updated_count = 0
        for qid, sol_str in rows:
            try:
                items = json.loads(sol_str)
                if isinstance(items, list):
                    for it in items:
                        m_zh = it.get("method", "").strip()
                        t_zh = it.get("text", "").strip()
                        it["method_en"] = method_cache.get(m_zh, translate_single_method(m_zh))
                        it["text_en"] = text_cache.get(t_zh, t_zh)
                    new_sol_str = json.dumps(items, ensure_ascii=False)
                    cursor.execute("UPDATE questions SET solutions_json = ? WHERE question_id = ?", (new_sol_str, qid))
                    updated_count += 1
            except Exception as e:
                print(f"Error updating {qid}: {e}", flush=True)

        c.commit()

        # 审计
        cursor.execute("SELECT question_id, solutions_json FROM questions WHERE solutions_json IS NOT NULL")
        check_rows = cursor.fetchall()
        total_items_checked = 0
        missing_text_en = 0
        for qid, s_str in check_rows:
            d = json.loads(s_str)
            for it in d:
                total_items_checked += 1
                if not it.get("text_en"):
                    missing_text_en += 1
        c.close()
        print(f"  {db_path}: Updated {updated_count} questions. Total solution items: {total_items_checked}, Missing text_en: {missing_text_en}", flush=True)

if __name__ == "__main__":
    main()
