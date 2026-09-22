#!/usr/bin/env python3
"""
将 src/modules/concept/allPointsData.ts 中的考点四段论精讲内容同步到 data/core.db 和 public/data/core.db
"""
import re
import json
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS_PATH = os.path.join(BASE_DIR, 'src/modules/concept/allPointsData.ts')
DB_PATHS = [
    os.path.join(BASE_DIR, 'data/core.db'),
    os.path.join(BASE_DIR, 'public/data/core.db')
]

def extract_kp_list(ts_content):
    # 匹配 ALL_107_KNOWLEDGE_POINTS = [ ... ];
    match = re.search(r'export\s+const\s+ALL_107_KNOWLEDGE_POINTS\s*:\s*EnrichedKnowledgePoint\[\]\s*=\s*(\[[\s\S]*?\]);\s*$', ts_content)
    if not match:
        raise ValueError("Could not find ALL_107_KNOWLEDGE_POINTS array in TS file")
    
    json_str = match.group(1)
    # 消除末尾逗号以符合标准 JSON
    json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
    return json.loads(json_str)

def sync_to_db(kp_list):
    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            print(f"Warning: {db_path} does not exist, skipping.")
            continue
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        updated_count = 0
        
        for kp in kp_list:
            point_id = kp.get('point_id')
            if not point_id:
                continue
            
            cursor.execute("""
                UPDATE knowledge_points
                SET origin_story_zh = ?,
                    origin_story_en = ?,
                    intuitive_essence_zh = ?,
                    intuitive_essence_en = ?,
                    formal_definition_zh = ?,
                    formal_definition_en = ?,
                    intrinsic_variation_zh = ?,
                    intrinsic_variation_en = ?
                WHERE point_id = ?
            """, (
                kp.get('origin_story_zh', ''),
                kp.get('origin_story_en', ''),
                kp.get('intuitive_essence_zh', ''),
                kp.get('intuitive_essence_en', ''),
                kp.get('formal_definition_zh', ''),
                kp.get('formal_definition_en', ''),
                kp.get('intrinsic_variation_zh', ''),
                kp.get('intrinsic_variation_en', ''),
                point_id
            ))
            if cursor.rowcount > 0:
                updated_count += 1
        
        conn.commit()
        conn.close()
        print(f"Successfully synced {updated_count} points to {db_path}")

if __name__ == '__main__':
    with open(TS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    kp_list = extract_kp_list(content)
    sync_to_db(kp_list)
