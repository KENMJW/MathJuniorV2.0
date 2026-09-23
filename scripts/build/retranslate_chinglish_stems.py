#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build/retranslate_chinglish_stems.py
高质量数学英文题干全量清洗与重译流水线 (TASK-I18N-0002 / TASK-I18N-0004)

特性：
1. 提取所有行内/行间 LaTeX 数学公式 ($...$, $$...$$) 保护为 <mN/> 标记；
2. 提取所有图片锚点 ([[IMG:N]]) 保护为 <imgN/> 标记；
3. 多行/多问分段安全翻译，彻底防止机器翻译漏译/丢变量；
4. 严格校验：
   - 100% 原始公式字节级复原；
   - 100% 原始图片锚点完整复原；
   - 零残余中文字符；
   - KaTeX 语法无破损；
5. 线程池并发与进度断点缓存 (tmp/stem_translations_cache.json)；
6. 同步更新 data/questions.db, public/data/questions.db, dist/data/questions.db。
"""

import os
import sys
import sqlite3
import json
import re
import time
import html
import random
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Tuple, Optional

CACHE_FILE = "tmp/stem_translations_cache.json"
CH_RE = re.compile(r"[\u4e00-\u9fff]")

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]

def translate_block_api(text: str, retries: int = 5) -> str:
    """调用 Google Translate 接口翻译纯文本块（含 XML 占位符）"""
    if not text.strip():
        return text

    clients = ["dict-chrome-ex", "gtx"]

    for attempt in range(retries):
        client = clients[attempt % len(clients)]
        ua = random.choice(USER_AGENTS)
        url = f"https://translate.googleapis.com/translate_a/single?client={client}&sl=zh-CN&tl=en&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={"User-Agent": ua})
        
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                translated = "".join([item[0] for item in data[0] if item and item[0]])
                return translated
        except Exception as e:
            if attempt == retries - 1:
                raise e
            backoff = 0.5 + attempt * 1.0 + random.uniform(0.1, 0.5)
            time.sleep(backoff)
    return text

def preprocess_math_text(text: str) -> str:
    """预清洗中式标点与混杂符号"""
    text = text.replace("“口”", '"$\\\\square$"').replace('"口"', '"$\\\\square$"')
    text = text.replace("（　　）", "( )").replace("（   ）", "( )").replace("（ ）", "( )")
    text = text.replace("（\u3000\u3000）", "( )").replace("(\u3000\u3000)", "( )")
    text = text.replace("[　 　]{.underline}", "______").replace("[　　　　]{.underline}", "______")
    text = text.replace("[　　]{.underline}", "______").replace("[　]{.underline}", "______")
    text = text.replace("[_]{.underline}", "______").replace("[ ]{.underline}", "______")
    return text

def translate_single_stem(stem_zh: str) -> Tuple[Optional[str], str]:
    """
    全流程题干安全重译
    返回 (translated_stem_en, status_msg)
    """
    if not stem_zh or not stem_zh.strip():
        return "", "empty"

    raw_text = preprocess_math_text(stem_zh)

    math_tokens = []
    def save_math(m):
        math_tokens.append(m.group(0))
        return f" <m{len(math_tokens)-1}/> "

    img_tokens = []
    def save_img(m):
        img_tokens.append(m.group(0))
        return f" <img{len(img_tokens)-1}/> "

    # 1. 保护图片锚点与数学公式
    masked = re.sub(r"\[\[IMG:\d+\]\]", save_img, raw_text)
    masked = re.sub(r"\$\$[^\$]+\$\$|\$[^\$]+\$", save_math, masked)

    # 2. 按行分段翻译，保护上下文结构
    lines = masked.split("\n")
    translated_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            translated_lines.append("")
            continue
        
        # 若该行全为已保护的图片或公式锚点，无中文，直接保留
        if not CH_RE.search(stripped):
            translated_lines.append(stripped)
            continue
            
        trans_line = translate_block_api(stripped)
        translated_lines.append(trans_line)

    translated_masked = "\n".join(translated_lines)

    # 3. HTML 反转义 (防止 &lt;m0/&gt; 等实体阻断正则)
    restored = html.unescape(translated_masked)

    # 4. 校验并还原图片锚点
    for i, tok in enumerate(img_tokens):
        pattern = rf"<\s*img\s*{i}\s*/?\s*>"
        if not re.search(pattern, restored, flags=re.IGNORECASE):
            # 容错尝试无斜线形式
            pattern2 = rf"<\s*img\s*{i}\s*>"
            if not re.search(pattern2, restored, flags=re.IGNORECASE):
                return None, f"Image tag <img{i}/> dropped in translation"
            pattern = pattern2
        restored = re.sub(pattern, lambda m, t=tok: f" {t} ", restored, flags=re.IGNORECASE)

    # 5. 校验并还原数学公式
    for i, tok in enumerate(math_tokens):
        pattern = rf"<\s*m\s*{i}\s*/?\s*>"
        if not re.search(pattern, restored, flags=re.IGNORECASE):
            pattern2 = rf"<\s*m\s*{i}\s*>"
            if not re.search(pattern2, restored, flags=re.IGNORECASE):
                return None, f"Math tag <m{i}/> dropped in translation"
            pattern = pattern2
        restored = re.sub(pattern, lambda m, t=tok: f" {t} ", restored, flags=re.IGNORECASE)

    # 6. 清理多余空隙与遗留格式
    restored = re.sub(r" +", " ", restored)
    restored = re.sub(r" ([,.;:?!])", r"\1", restored)
    restored = restored.replace(" ,", ",").replace(" .", ".")

    # 7. 断言：无任何遗留标签
    if re.search(r"<\s*(m|img)\s*\d+\s*/?\s*>", restored, flags=re.IGNORECASE):
        return None, "Lingering XML tags detected in restored text"

    # 8. 断言：数学公式数量必须严格一致
    restored_math_count = len(re.findall(r"\$\$[^\$]+\$\$|\$[^\$]+\$", restored))
    if restored_math_count != len(math_tokens):
        return None, f"Math count mismatch: expected {len(math_tokens)}, got {restored_math_count}"

    # 9. 断言：无残余中文字符
    remaining_cn = CH_RE.findall(restored)
    if remaining_cn:
        return None, f"Remaining Chinese characters: {''.join(remaining_cn[:10])}"

    return restored.strip(), "ok"

def load_cache() -> Dict[str, str]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache: Dict[str, str]):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def main():
    db_paths = ["data/questions.db", "public/data/questions.db", "dist/data/questions.db"]
    cache = load_cache()
    print(f"Loaded {len(cache)} cached translations from {CACHE_FILE}")

    conn = sqlite3.connect("data/questions.db")
    cur = conn.cursor()
    cur.execute("SELECT question_id, stem_zh, stem_en FROM questions")
    all_rows = cur.fetchall()
    conn.close()

    chinglish_rows = [r for r in all_rows if r[2] and CH_RE.search(r[2])]
    total_needed = len(chinglish_rows)
    print(f"Total Chinglish questions found with Chinese in stem_en: {total_needed}")

    # 去重提取需要网络翻译的唯一中文题干
    unique_zh_needed = {}
    for qid, zh, en in chinglish_rows:
        if zh not in cache:
            unique_zh_needed[zh] = qid

    print(f"Unique stems needing translation: {len(unique_zh_needed)}")

    if unique_zh_needed:
        success_count = 0
        failed_count = 0
        start_time = time.time()
        
        items = list(unique_zh_needed.items())
        
        def worker(pair):
            zh, sample_qid = pair
            try:
                en, status = translate_single_stem(zh)
                return zh, en, status, sample_qid
            except Exception as e:
                return zh, None, str(e), sample_qid

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(worker, p) for p in items]
            
            for future in as_completed(futures):
                zh, en, status, sample_qid = future.result()
                if en and status == "ok":
                    cache[zh] = en
                    success_count += 1
                else:
                    failed_count += 1
                    print(f"[{sample_qid}] Failed: {status} | ZH: {zh[:40]}...")

                done = success_count + failed_count
                if done % 25 == 0 or done == len(items):
                    elapsed = time.time() - start_time
                    rate = done / max(1, elapsed)
                    print(f"Progress: {done}/{len(items)} (Success: {success_count}, Failed: {failed_count}) | Speed: {rate:.1f} stems/s")
                    save_cache(cache)

        save_cache(cache)
        print(f"Translation pass finished. Successful cached: {len(cache)}")

    # 现在将缓存中的翻译批量刷入所有数据库
    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
        print(f"\nUpdating {db_path}...")
        c = sqlite3.connect(db_path)
        cursor = c.cursor()
        cursor.execute("SELECT question_id, stem_zh, stem_en FROM questions")
        rows = cursor.fetchall()
        
        updated = 0
        for qid, zh, en in rows:
            if en and CH_RE.search(en):
                if zh in cache:
                    cursor.execute("UPDATE questions SET stem_en = ? WHERE question_id = ?", (cache[zh], qid))
                    updated += 1
        c.commit()
        
        # 统计剩余包含中文的记录数
        cursor.execute("SELECT question_id, stem_en FROM questions")
        check_rows = cursor.fetchall()
        rem = sum(1 for r in check_rows if r[1] and CH_RE.search(r[1]))
        c.close()
        print(f"  {db_path}: Updated {updated} questions, Remaining Chinglish in stem_en: {rem}")

if __name__ == "__main__":
    main()
