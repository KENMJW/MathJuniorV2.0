#!/usr/bin/env python3
"""
scripts/build/db/enhance_concept_sandboxes.py
TASK-DATA-0013: 概念与跃迁沙盒底层教研数据全量增强落库脚本
- 串行单事务更新 data/sandbox.db
- 严格校验 8 个分片 JSONL 文件
- 双库同步到 public/data/sandbox.db 并校验 SHA256
"""

import os
import sys
import json
import sqlite3
import hashlib
import shutil

DB_PATH = "data/sandbox.db"
PUB_DB_PATH = "public/data/sandbox.db"
BAK_PATH = "data/sandbox.db.bak_before_task0013"
TMP_DIR = "tmp/data0013"

def get_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    print("=== TASK-DATA-0013: 概念与跃迁沙盒教研数据单事务增强落库 ===")
    
    # 1. 验证备份
    if not os.path.exists(BAK_PATH) or os.path.getsize(BAK_PATH) == 0:
        raise RuntimeError(f"备份文件不存在或为空: {BAK_PATH}")
    print(f"[OK] 备份文件验证通过: {BAK_PATH} ({os.path.getsize(BAK_PATH)} bytes)")
    
    # 2. 读取并严格校验 8 个分片
    all_concept_updates = {}
    all_leap_updates = {}
    
    for part in range(1, 9):
        part_file = os.path.join(TMP_DIR, f"part{part}.jsonl")
        if not os.path.exists(part_file):
            raise FileNotFoundError(f"分片文件缺失: {part_file}")
            
        with open(part_file, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]
            
        print(f"[*] 读取分片 {part_file}: 共 {len(lines)} 行")
        for idx, line in enumerate(lines):
            try:
                rec = json.loads(line)
            except Exception as e:
                raise ValueError(f"分片 {part} 第 {idx+1} 行 JSON 解析失败: {e}")
                
            table = rec["table"]
            id_val = rec["id_val"]
            fields = rec["fields"]
            
            if table == "concept_sandboxes":
                inquiry = fields["inquiry_steps_json"]
                visual = fields["visual_elements_json"]
                
                # 统一为序列化字符串
                inquiry_str = json.dumps(inquiry, ensure_ascii=False) if not isinstance(inquiry, str) else inquiry
                visual_str = json.dumps(visual, ensure_ascii=False) if not isinstance(visual, str) else visual
                
                # 校验解析
                inquiry_obj = json.loads(inquiry_str)
                visual_obj = json.loads(visual_str)
                assert isinstance(inquiry_obj, list) and 1 <= len(inquiry_obj) <= 3, f"{id_val} inquiry_steps 长度不合法"
                assert isinstance(visual_obj, dict) and "polygons" in visual_obj and "rightAngles" in visual_obj, f"{id_val} visual_elements 结构不合法"
                
                all_concept_updates[id_val] = (inquiry_str, visual_str)
                
            elif table == "leap_sandbox_models":
                story = fields["story_stages_json"]
                story_str = json.dumps(story, ensure_ascii=False) if not isinstance(story, str) else story
                
                story_obj = json.loads(story_str)
                assert isinstance(story_obj, list) and 2 <= len(story_obj) <= 4, f"{id_val} story_stages 长度不合法"
                for st in story_obj:
                    assert all(k in st for k in ["stage", "title", "guide_text", "teacher_secret", "state_config"]), f"{id_val} 缺少幕字段"
                    
                all_leap_updates[id_val] = story_str
            else:
                raise ValueError(f"未知表: {table}")

    print(f"[OK] 分片解析通过: 概念沙盒待更新={len(all_concept_updates)}, 跃迁沙盒待更新={len(all_leap_updates)}")
    assert len(all_concept_updates) == 46, f"概念沙盒数量不为 46, 实际为 {len(all_concept_updates)}"
    assert len(all_leap_updates) == 37, f"跃迁沙盒数量不为 37, 实际为 {len(all_leap_updates)}"
    
    # 3. 单事务串行写库
    conn = sqlite3.connect(DB_PATH)
    conn.isolation_level = None  # 手动控制事务
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN TRANSACTION;")
        
        # 更新 concept_sandboxes
        for sb_id, (inquiry_json, visual_json) in all_concept_updates.items():
            cursor.execute("""
                UPDATE concept_sandboxes
                SET inquiry_steps_json = ?, visual_elements_json = ?
                WHERE sandbox_id = ?
            """, (inquiry_json, visual_json, sb_id))
            if cursor.rowcount != 1:
                raise RuntimeError(f"更新 concept_sandboxes 失败: {sb_id}, rowcount={cursor.rowcount}")
                
        # 更新 leap_sandbox_models
        for model_id, story_json in all_leap_updates.items():
            cursor.execute("""
                UPDATE leap_sandbox_models
                SET story_stages_json = ?
                WHERE model_id = ?
            """, (story_json, model_id))
            if cursor.rowcount != 1:
                raise RuntimeError(f"更新 leap_sandbox_models 失败: {model_id}, rowcount={cursor.rowcount}")
                
        # 断言核验
        cursor.execute("SELECT count(*) FROM concept_sandboxes")
        total_cs = cursor.fetchone()[0]
        assert total_cs == 46, f"概念沙盒行数异常: {total_cs}"
        
        cursor.execute("SELECT count(*) FROM concept_sandboxes WHERE inquiry_steps_json IS NOT NULL AND visual_elements_json IS NOT NULL")
        valid_cs = cursor.fetchone()[0]
        assert valid_cs == 46, f"概念沙盒增强覆盖率未达 100%: {valid_cs}/46"
        
        cursor.execute("SELECT count(*) FROM leap_sandbox_models")
        total_lm = cursor.fetchone()[0]
        assert total_lm == 37, f"跃迁沙盒行数异常: {total_lm}"
        
        cursor.execute("SELECT count(*) FROM leap_sandbox_models WHERE story_stages_json IS NOT NULL")
        valid_lm = cursor.fetchone()[0]
        assert valid_lm == 37, f"跃迁沙盒增强覆盖率未达 100%: {valid_lm}/37"
        
        cursor.execute("COMMIT;")
        print("[OK] 单事务写库成功并已提交！")
    except Exception as e:
        cursor.execute("ROLLBACK;")
        conn.close()
        print(f"[FAIL] 发生异常已执行 ROLLBACK: {e}")
        raise e
    finally:
        conn.close()
        
    # 4. 双库同步
    shutil.copy2(DB_PATH, PUB_DB_PATH)
    sha_src = get_sha256(DB_PATH)
    sha_pub = get_sha256(PUB_DB_PATH)
    print(f"[OK] 双库同步完成:")
    print(f"     data/sandbox.db:        {sha_src}")
    print(f"     public/data/sandbox.db: {sha_pub}")
    assert sha_src == sha_pub, "双库 SHA256 不一致！"
    
    print("=== 全流程执行成功！ ===")

if __name__ == "__main__":
    main()
