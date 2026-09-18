#!/usr/bin/env python3
"""
合规校验器 (design.md §4.2 机器可判确定性规则 + Property 20)
检验 assets/concepts/ 下 214 个双语 SVG 示意图：
1. 文件完整性：107 考点 × 2 (zh, en) = 214 个文件全覆盖
2. XML 语法合法：能够成功解析为 DOM 树
3. 根节点必须为 <svg>，必须具备合法 viewBox 与 preserveAspectRatio
4. 绝对禁止 <foreignObject> (Property 20 跨引擎安全不变量)
5. 绝对禁止 <script> 标签、javascript: 链接与内联事件属性 (on*)
"""

import os
import sys
import sqlite3
import xml.etree.ElementTree as ET

CONCEPTS_DIR = "assets/concepts"

def validate_all_svgs():
    conn = sqlite3.connect("data/core.db")
    c = conn.cursor()
    kp_ids = [r[0] for r in c.execute("SELECT point_id FROM knowledge_points ORDER BY point_id;").fetchall()]
    conn.close()

    print(f"Loaded {len(kp_ids)} knowledge points from core.db.")
    errors = []
    total_files = 0

    for kp_id in kp_ids:
        for lang in ['zh', 'en']:
            total_files += 1
            filename = f"{kp_id}-{lang}.svg"
            filepath = os.path.join(CONCEPTS_DIR, filename)

            # 1. 存在性检查
            if not os.path.isfile(filepath):
                errors.append(f"Missing file: {filepath}")
                continue

            # 2. 纯文本违规模式检查 (foreignObject, script, event handlers)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            if "foreignObject" in content or "<foreignObject" in content:
                errors.append(f"VIOLATION (Property 20 foreignObject forbidden): {filename}")

            if "<script" in content.lower():
                errors.append(f"VIOLATION (<script> forbidden): {filename}")

            if "javascript:" in content.lower():
                errors.append(f"VIOLATION (javascript: forbidden): {filename}")

            import re
            if re.search(r'\son\w+\s*=', content):
                errors.append(f"VIOLATION (inline event handler forbidden): {filename}")

            # 3. XML 语法解析
            try:
                tree = ET.fromstring(content)
            except Exception as e:
                errors.append(f"XML parse error in {filename}: {e}")
                continue

            # 4. 根标签与属性检查
            tag_name = tree.tag.split('}')[-1] if '}' in tree.tag else tree.tag
            if tag_name != 'svg':
                errors.append(f"Root tag is not <svg> in {filename}, got <{tag_name}>")

            if 'viewBox' not in tree.attrib:
                errors.append(f"Missing viewBox attribute in {filename}")

            if 'preserveAspectRatio' not in tree.attrib:
                errors.append(f"Missing preserveAspectRatio attribute in {filename}")

    if errors:
        print(f"\n❌ Validation FAILED with {len(errors)} errors:")
        for err in errors[:20]:
            print(f"  - {err}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more errors.")
        return False

    print(f"\n✅ All {total_files} SVG files successfully validated! 100% compliant with P20 and design.md §4.2.")
    return True

if __name__ == "__main__":
    success = validate_all_svgs()
    sys.exit(0 if success else 1)
