#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Validation script for concept sandbox configuration parts (TASK-DATA-0004).
Checks schema, point id dependencies, hex colors (no var(--...)), math gate, and non-dummy content.
"""

import sys
import os
import json
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math_gate import sanitize_and_verify_math

def validate_part(file_path: str):
    print(f"Validating concept sandbox part: {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    if not lines:
        raise ValueError(f"Empty file: {file_path}")

    seen_ids = set()

    for idx, line in enumerate(lines, start=1):
        try:
            rec = json.loads(line)
        except Exception as e:
            raise ValueError(f"Line {idx}: JSON parse error: {e}")

        sbid = rec.get("sandbox_id")
        if not sbid or not sbid.startswith("SB-KP"):
            raise ValueError(f"Line {idx}: Invalid sandbox_id: {sbid}")
        if sbid in seen_ids:
            raise ValueError(f"Line {idx}: Duplicate sandbox_id: {sbid}")
        seen_ids.add(sbid)

        # 1. viewbox_spec_json
        vb_raw = rec.get("viewbox_spec_json")
        if isinstance(vb_raw, str):
            vb = json.loads(vb_raw)
        elif isinstance(vb_raw, dict):
            vb = vb_raw
        else:
            raise ValueError(f"{sbid}: viewbox_spec_json is neither string nor dict")

        has_x = ("minX" in vb or "xMin" in vb) and ("maxX" in vb or "xMax" in vb)
        has_y = ("minY" in vb or "yMin" in vb) and ("maxY" in vb or "yMax" in vb)
        if not (has_x and has_y):
            raise ValueError(f"{sbid}: viewbox missing bounds: {vb}")

        # 2. drag_points_json
        pts_raw = rec.get("drag_points_json")
        if isinstance(pts_raw, str):
            pts = json.loads(pts_raw)
        elif isinstance(pts_raw, list):
            pts = pts_raw
        else:
            raise ValueError(f"{sbid}: drag_points_json must be list or json string")

        if not isinstance(pts, list) or len(pts) < 2:
            raise ValueError(f"{sbid}: drag_points must have at least 2 points, got {len(pts) if isinstance(pts, list) else pts}")

        pt_ids = set()
        for p in pts:
            pid = p.get("id")
            if not pid:
                raise ValueError(f"{sbid}: point missing id: {p}")
            if pid in pt_ids:
                raise ValueError(f"{sbid}: duplicate point id '{pid}'")
            pt_ids.add(pid)

            if "x" not in p or "y" not in p:
                raise ValueError(f"{sbid}: point '{pid}' missing x or y coordinate")
            if not isinstance(p["x"], (int, float)) or not isinstance(p["y"], (int, float)):
                raise ValueError(f"{sbid}: point '{pid}' coordinates not numeric: {p}")

            color = p.get("color", "")
            if "var(--" in color:
                raise ValueError(f"{sbid}: point '{pid}' color contains 'var(--...)': {color}. Hex color required!")

        # Check not dummy placeholder
        if len(pts) == 1 and pts[0].get("id") == "P" and pts[0].get("constrainTo") == "curve":
            raise ValueError(f"{sbid}: still has dummy placeholder point config!")

        # 3. param_sliders_json
        sld_raw = rec.get("param_sliders_json")
        if isinstance(sld_raw, str):
            slds = json.loads(sld_raw)
        elif isinstance(sld_raw, list):
            slds = sld_raw
        else:
            raise ValueError(f"{sbid}: param_sliders_json must be list or json string")

        if not isinstance(slds, list) or len(slds) < 1:
            raise ValueError(f"{sbid}: param_sliders must have at least 1 slider")

        for s in slds:
            if not s.get("id"):
                raise ValueError(f"{sbid}: slider missing id: {s}")
            if "min" not in s or "max" not in s or "default" not in s:
                raise ValueError(f"{sbid}: slider '{s.get('id')}' missing min/max/default: {s}")

        # 4. invariants_display_json
        inv_raw = rec.get("invariants_display_json")
        if isinstance(inv_raw, str):
            invs = json.loads(inv_raw)
        elif isinstance(inv_raw, (list, dict)):
            invs = inv_raw
        else:
            raise ValueError(f"{sbid}: invariants_display_json must be list, dict or json string")

        inv_list = invs if isinstance(invs, list) else [invs]
        if not inv_list:
            raise ValueError(f"{sbid}: invariants_display_json cannot be empty")

        for inv in inv_list:
            formula = inv.get("formula", "")
            if formula == "f(x) = const":
                raise ValueError(f"{sbid}: still has dummy placeholder invariant 'f(x) = const'!")

            # Verify deps all exist in pt_ids
            deps = inv.get("deps", [])
            for dep in deps:
                if dep not in pt_ids:
                    raise ValueError(f"{sbid}: invariant dep '{dep}' does not exist in drag_points {list(pt_ids)}")

            # Verify math gate on formula
            if formula:
                try:
                    # If formula contains KaTeX math, verify
                    sanitize_and_verify_math(formula)
                except Exception as me:
                    # If formula does not have $, wrap and test or test directly
                    try:
                        sanitize_and_verify_math(f"${formula}$")
                    except Exception as me2:
                        raise ValueError(f"{sbid}: formula '{formula}' failed math gate: {me2}")

        # 5. content_status
        status = rec.get("content_status")
        if status != "done":
            raise ValueError(f"{sbid}: content_status must be 'done', got '{status}'")

    print(f"Validation PASSED for {file_path}: {len(lines)} concept sandboxes verified.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/build/validate_concept_sbcfg.py <path_to_part.jsonl>")
        sys.exit(1)
    validate_part(sys.argv[1])
