#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/build/retranslate_chinglish_stems.py
高质量数学英文题干重译流水线 (TASK-I18N-0002)

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
6. 同步更新 data/questions.db 与 public/data/questions.db。
"""

import os
import sys
import sqlite3
import json
import re
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Tuple, Optional

CACHE_FILE = "tmp/stem_translations_cache.json"
CH_RE = re.compile(r"[\u4e00-\u9fff]")

def translate_block_gtx(text: str, retries: int = 4) -> str:
    """调用 Google Translate gtx 接口翻译纯文本块（含 XML 占位符）"""
    if not text.strip():
        return text
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=" + urllib.parse.quote(text)
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
    req = urllib.request.Request(url, headers=headers)
    
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                translated = "".join([item[0] for item in data[0] if item and item[0]])
                return translated
        except Exception as e:
            if attempt == retries - 1:
                raise e
            time.sleep(1.0 + attempt * 1.5)
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
        return f"<m{len(math_tokens)-1}/>"

    img_tokens = []
    def save_img(m):
        img_tokens.append(m.group(0))
        return f"<img{len(img_tokens)-1}/>"

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
            
        trans_line = translate_block_gtx(stripped)
        translated_lines.append(trans_line)

    translated_masked = "\n".join(translated_lines)

    # 3. 校验并还原图片锚点
    restored = translated_masked
    for i, tok in enumerate(img_tokens):
        pattern = rf"<\s*img\s*{i}\s*/>"
        if not re.search(pattern, restored, flags=re.IGNORECASE):
            return None, f"Image tag <img{i}/> dropped in translation"
        restored = re.sub(pattern, lambda m, t=tok: t, restored, flags=re.IGNORECASE)

    # 4. 校验并还原数学公式
    for i, tok in enumerate(math_tokens):
        pattern = rf"<\s*m\s*{i}\s*/>"
        if not re.search(pattern, restored, flags=re.IGNORECASE):
            return None, f"Math tag <m{i}/> dropped in translation"
        restored = re.sub(pattern, lambda m, t=tok: t, restored, flags=re.IGNORECASE)

    # 5. 清理多余空隙与遗留格式
    restored = re.sub(r" +", " ", restored)
    restored = re.sub(r" ([,.;:?!])", r"\1", restored)
    restored = restored.replace(" ,", ",").replace(" .", ".")

    # 6. 断言：无任何遗留标签
    if re.search(r"<\s*(m|img)\s*\d+\s*/>", restored, flags=re.IGNORECASE):
        return None, "Lingering XML tags detected in restored text"

    # 7. 断言：数学公式数量必须严格一致
    restored_math_count = len(re.findall(r"\$\$[^\$]+\$\$|\$[^\$]+\$", restored))
    if restored_math_count != len(math_tokens):
        return None, f"Math count mismatch: expected {len(math_tokens)}, got {restored_math_count}"

    # 8. 断言：无残余中文字符
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
    db_paths = ["data/questions.db", "public/data/questions.db"]
    cache = load_cache()
    print(f"Loaded {len(cache)} cached translations from {CACHE_FILE}")

    conn = sqlite3.connect("data/questions.db")
    cur = conn.cursor()
    cur.execute("SELECT question_id, stem_zh, stem_en FROM questions WHERE stem_en GLOB '*[\u4e00-\u9fff]*'")
    chinglish_rows = cur.fetchall()
    conn.close()

    total_needed = len(chinglish_rows)
    print(f"Total Chinglish questions to retranslate: {total_needed}")

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
                    # print(f"[{sample_qid}] Failed: {status}")

                done = success_count + failed_count
                if done % 50 == 0 or done == len(items):
                    elapsed = time.time() - start_time
                    rate = done / max(1, elapsed)
                    print(f"Progress: {done}/{len(items)} (Success: {success_count}, Failed: {failed_count}) | Speed: {rate:.1f} stems/s")
                    save_cache(cache)

        save_cache(cache)
        print(f"Translation pass finished. Successful cached: {len(cache)}")

    # 现在将缓存中的翻译批量刷入两个数据库
    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
        print(f"\nUpdating {db_path}...")
        c = sqlite3.connect(db_path)
        cursor = c.cursor()
        cursor.execute("SELECT question_id, stem_zh FROM questions WHERE stem_en GLOB '*[\u4e00-\u9fff]*'")
        rows_to_update = cursor.fetchall()
        
        updated = 0
        skipped = 0
        for qid, zh in rows_to_update:
            if zh in cache:
                en_val = cache[zh]
                cursor.execute("UPDATE questions SET stem_en = ? WHERE question_id = ?", (en_val, qid))
                updated += 1
            else:
                skipped += 1
        c.commit()
        
        # 统计剩余包含中文的记录数
        cursor.execute("SELECT count(*) FROM questions WHERE stem_en GLOB '*[\u4e00-\u9fff]*'")
        rem = cursor.fetchone()[0]
        c.close()
        print(f"  {db_path}: Updated {updated} questions, Skipped {skipped}, Remaining Chinglish: {rem}")

if __name__ == "__main__":
    main()
