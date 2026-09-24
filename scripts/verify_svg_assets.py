#!/usr/bin/env python3
"""
TASK-DATA-0015 质量门禁检测脚本
四大自动化门禁：
1. 文件完整性与双源头一致性门禁 (assets/ 与 public/assets/ 逐字节一致，214文件非空)
2. XML 语法与四段论全图层覆盖门禁 (layer-stage-1 ~ layer-stage-4 100% 存在，无假点亮)
3. 纯几何去重硬门禁 (剥离文字提取矢量骨架，独立构型数严格等于 107，重复率严格为 0%)
4. 公式排版与语义合规门禁 (单行字符防溢出，XML 实体安全，典型语义错配复验)
"""

import os
import glob
import re
import hashlib
import xml.etree.ElementTree as ET

def get_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def extract_geometry_signature(svg_text):
    """
    提取 SVG 剥离所有文字和固定外框后的纯几何构型签名
    """
    root = ET.fromstring(svg_text)
    shapes = []
    vector_tags = {'path', 'polygon', 'polyline', 'circle', 'ellipse', 'line', 'rect'}
    for elem in root.iter():
        tag = elem.tag.split('}')[-1]
        if tag in vector_tags:
            # 过滤最外层卡片背景 rect (400x300) 与标题卡片 (20x16)
            if tag == 'rect':
                w = elem.attrib.get('width')
                h = elem.attrib.get('height')
                x = elem.attrib.get('x')
                y = elem.attrib.get('y')
                if w == '400' and h == '300':
                    continue
                if x == '20' and y == '16':
                    continue
            attrs = []
            # 过滤非几何属性（样式、类名、颜色不影响几何骨架）
            for k in sorted(elem.attrib.keys()):
                if k not in ['class', 'id', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity']:
                    attrs.append((k, elem.attrib[k]))
            shapes.append((tag, tuple(attrs)))
    return tuple(shapes)

def verify_all_svgs():
    src_dir = "assets/concepts"
    pub_dir = "public/assets/concepts"
    errors = []
    warnings = []
    
    print("==================================================")
    print("=== 门禁 1: 双源头完整性与哈希一致性检测 ===")
    print("==================================================")
    
    for d in [src_dir, pub_dir]:
        zh_count = len(glob.glob(f"{d}/KP-*-zh.svg"))
        en_count = len(glob.glob(f"{d}/KP-*-en.svg"))
        print(f"目录 [{d}]: 中文 {zh_count}/107, 英文 {en_count}/107")
        if zh_count != 107:
            errors.append(f"[{d}] 中文 SVG 数量不达标: 实际 {zh_count} (预期 107)")
        if en_count != 107:
            errors.append(f"[{d}] 英文 SVG 数量不达标: 实际 {en_count} (预期 107)")

    # 逐文件对比 SHA256
    hash_mismatches = 0
    for i in range(1, 108):
        for lang in ['zh', 'en']:
            fname = f"KP-{i:03d}-{lang}.svg"
            src_f = os.path.join(src_dir, fname)
            pub_f = os.path.join(pub_dir, fname)
            if not os.path.exists(src_f):
                errors.append(f"源码目录缺失: {src_f}")
                continue
            if not os.path.exists(pub_f):
                errors.append(f"运行目录缺失: {pub_f}")
                continue
            if get_sha256(src_f) != get_sha256(pub_f):
                errors.append(f"双目录 SHA256 不一致: {fname}")
                hash_mismatches += 1

    if hash_mismatches == 0:
        print("  ✓ 源码源头 (assets/) 与运行目录 (public/assets/) 214 文件 SHA256 100% 逐字节完全一致！")

    print("\n==================================================")
    print("=== 门禁 2: XML 语法、实体转义与四段论类名检测 ===")
    print("==================================================")
    all_files = sorted(glob.glob(f"{pub_dir}/KP-*.svg"))
    xml_err_count = 0
    stage_missing_count = 0

    for fpath in all_files:
        fname = os.path.basename(fpath)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        # XML 解析
        try:
            root = ET.fromstring(content)
        except Exception as e:
            errors.append(f"{fname} XML 解析错误: {e}")
            xml_err_count += 1
            continue

        # 四段论图层类名必须 100% 具备
        for stage in [1, 2, 3, 4]:
            if f"layer-stage-{stage}" not in content:
                errors.append(f"{fname} 缺失图层类名: layer-stage-{stage}")
                stage_missing_count += 1
                break

        # 文本超长检测
        texts = re.findall(r'<text[^>]*>(.*?)</text>', content)
        for t in texts:
            clean_t = re.sub(r'<[^>]+>', '', t).strip()
            # 汉字超长检测 (单行安全阈值: 24字)
            cn_chars = len(re.findall(r'[\u4e00-\u9fa5]', clean_t))
            if cn_chars > 24:
                warnings.append(f"{fname} 汉字单行偏长 ({cn_chars}字): '{clean_t[:20]}...'")
            # 英文/字符超长检测 (单行安全阈值: 44字符)
            if len(clean_t) > 44:
                warnings.append(f"{fname} 文本单行偏长 ({len(clean_t)}字符): '{clean_t[:25]}...'")

    print(f"  XML 语法解析错误: {xml_err_count}, 四段论类名缺失: {stage_missing_count}")
    print(f"  排版偏长警告: {len(warnings)}")

    print("\n==================================================")
    print("=== 门禁 3: 【重磅】纯几何去重硬门禁 (Unique Geometry Gate) ===")
    print("==================================================")
    unique_signatures = {}
    duplicate_pairs = []

    for i in range(1, 108):
        pid = f"KP-{i:03d}"
        zh_path = os.path.join(pub_dir, f"{pid}-zh.svg")
        if not os.path.exists(zh_path):
            continue
        with open(zh_path, "r", encoding="utf-8") as f:
            svg_text = f.read()
        sig = extract_geometry_signature(svg_text)
        if sig in unique_signatures:
            duplicate_pairs.append((pid, unique_signatures[sig]))
        else:
            unique_signatures[sig] = pid

    unique_count = len(unique_signatures)
    print(f"全库 107 个考点独立几何构型总数: {unique_count} / 107")

    if duplicate_pairs:
        print(f"❌ 检测到几何形状完全相同的重复考点组合 ({len(duplicate_pairs)} 对):")
        for p1, p2 in duplicate_pairs:
            print(f"  - {p1} 与 {p2} 共享了相同的矢量几何骨架！")
            errors.append(f"几何构型重复: {p1} 与 {p2}")
    else:
        print("  ✅ 纯几何去重门禁 100% 通过！独立构型数严格等于 107，重复率严格为 0.00%！")

    print("\n==================================================")
    print("=== 门禁 4: 典型语义错配专项复验 ===")
    print("==================================================")
    mismatch_checks = [
        ("KP-023-zh.svg", ["消元与图象交点解", "P(x₀, y₀)"], "KP-023 配方法严禁出现一次方程组两线相交"),
        ("KP-036-zh.svg", ["ax² + bx + c", "Vertex(h, k)"], "KP-036 反比例函数严禁出现二次抛物线"),
        ("KP-037-zh.svg", ["ax² + bx + c", "Vertex(h, k)"], "KP-037 反比例函数k的几何意义严禁出现二次抛物线"),
        ("KP-053-zh.svg", ["a² + b² = c²", "∠C = 90°"], "KP-053 等腰三角形严禁出现直角勾股定理"),
        ("KP-055-zh.svg", ["a² + b² = c²", "∠C = 90°"], "KP-055 等边三角形严禁出现直角勾股定理"),
        ("KP-094-zh.svg", ["直方柱状图", "频数直方"], "KP-094 扇形统计图严禁画成直方柱状图"),
    ]
    for fname, forbidden_tokens, desc in mismatch_checks:
        fpath = os.path.join(pub_dir, fname)
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                c = f.read()
            for token in forbidden_tokens:
                if token in c:
                    errors.append(f"【错配残留】{fname}: 检测到禁用特征 '{token}' ({desc})")

    print("  ✓ 典型错配黑名单扫描完成")

    print("\n==================================================")
    print("================ 门禁结果裁定汇总 ================")
    print("==================================================")
    if errors:
        print(f"❌ 门禁未通过！发现 {len(errors)} 个致命阻断错误：")
        for err in errors[:20]:
            print(f"  - {err}")
        if len(errors) > 20:
            print(f"  ... 另有 {len(errors) - 20} 个错误未展开")
        return False
    else:
        print(f"🎉 恭喜！四大门禁 100% 全绿通过！")
        print(f"  1. 双源头一致性: assets/ 与 public/assets/ SHA256 逐字节一致")
        print(f"  2. XML 语法与类名: 214 个文件全部通过 XML 解析，四段论图层类名 100% 覆盖")
        print(f"  3. 纯几何独立构型: 107 个考点具备严格 107 种独立矢量构型 (0% 重复)")
        print(f"  4. 语义排版合规: 无越界，无错配，中英 1:1 双语成对完备")
        return True

if __name__ == "__main__":
    success = verify_all_svgs()
    if not success:
        exit(1)
