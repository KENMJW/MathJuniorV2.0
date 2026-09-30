import sqlite3
import json
import os

db_paths = [
    os.path.abspath('data/sandbox.db'),
    os.path.abspath('public/data/sandbox.db')
]

new_camouflage = {
    "distractorLayers": [
        {
            "id": "clock_distractor",
            "nameZh": "钟表时针分针夹角干扰",
            "nameEn": "Clock Hands Angle Distractor",
            "type": "circles",
            "items": [{"center": [0, 0], "radius": 4, "color": "var(--border-subtle)"}]
        }
    ],
    "coreSkeleton": {
        "nameZh": "双中点与角平分线垂直骨架",
        "nameEn": "Double Midpoint and Bisector Skeleton",
        "primaryElements": ["A", "B", "P", "M1", "M2"],
        "invariants": [
            {
                "id": "len_ap",
                "type": "distance",
                "deps": ["A", "P"],
                "condition": "carrierId === 'single_segment'",
                "formula": "AP = {val}",
                "labelZh": "线段 AP 长度",
                "labelEn": "Segment AP Length"
            },
            {
                "id": "len_pb",
                "type": "distance",
                "deps": ["P", "B"],
                "condition": "carrierId === 'single_segment'",
                "formula": "PB = {val}",
                "labelZh": "线段 PB 长度",
                "labelEn": "Segment PB Length"
            },
            {
                "id": "len_m1m2",
                "type": "distance",
                "deps": ["M1", "M2"],
                "condition": "carrierId === 'single_segment'",
                "formula": "M1M2 = 1/2 AB = {val}",
                "labelZh": "双中点距离 M1M2 (恒等折半)",
                "labelEn": "Midpoint Distance M1M2 (Constant 1/2 AB)"
            },
            {
                "id": "inv_angle",
                "type": "angle",
                "deps": ["M", "O", "N"],
                "condition": "carrierId === 'angle_carrier'",
                "formula": "∠MON = {val}°",
                "labelZh": "内外角平分线夹角 (恒为90°)",
                "labelEn": "Bisectors Angle (Constant 90°)"
            }
        ]
    }
}

new_camouflage_str = json.dumps(new_camouflage, ensure_ascii=False)

for db_path in db_paths:
    if not os.path.exists(db_path):
        print(f"Skipping non-existent DB: {db_path}")
        continue
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "UPDATE leap_sandbox_models SET camouflage_xray_json = ? WHERE model_id = 'LM-7A-02'",
        (new_camouflage_str,)
    )
    print(f"Updated {cur.rowcount} row(s) in {db_path}")
    conn.commit()
    conn.close()

print("Migration patch_lm7a02_invariants completed successfully.")
