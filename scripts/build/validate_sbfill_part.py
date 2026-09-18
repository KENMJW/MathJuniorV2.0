# -*- coding: utf-8 -*-
"""Validation script for sbfill part jsonl files."""
import json
import sys

def validate_part(file_path: str):
    print(f"Validating {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
        
    leap_count = 0
    concept_count = 0
    
    for idx, l in enumerate(lines, start=1):
        try:
            rec = json.loads(l)
        except Exception as e:
            raise ValueError(f"Line {idx}: JSON parse error: {e}")
            
        rtype = rec.get("type")
        if rtype == "leap":
            leap_count += 1
            mid = rec.get("model_id")
            assert mid, f"Line {idx}: missing model_id"
            
            # English translations
            name_en = rec.get("model_name_en")
            brief_en = rec.get("model_brief_en")
            assert name_en and "__PENDING" not in name_en, f"{mid}: invalid model_name_en: {name_en}"
            assert brief_en and "__PENDING" not in brief_en, f"{mid}: invalid model_brief_en: {brief_en}"
            
            # clique_id
            cid = rec.get("clique_id")
            assert cid and cid.startswith("C"), f"{mid}: invalid clique_id: {cid}"
            
            # carrier_morphing_json
            carrier = rec.get("carrier_morphing_json")
            if isinstance(carrier, str):
                carrier = json.loads(carrier)
            assert isinstance(carrier, dict), f"{mid}: carrier not dict"
            opts = carrier.get("options")
            assert isinstance(opts, list) and len(opts) >= 2, f"{mid}: carrier.options must have at least 2 options, got {opts}"
            for o in opts:
                assert o.get("id"), f"{mid}: carrier option missing id"
                assert o.get("nameZh"), f"{mid}: carrier option missing nameZh"
                pts = o.get("points")
                assert isinstance(pts, list) and len(pts) >= 2, f"{mid}: option {o.get('id')} points must have >= 2 points"
                for p in pts:
                    assert "x" in p and "y" in p, f"{mid}: point missing x/y: {p}"
                    assert isinstance(p["x"], (int, float)) and isinstance(p["y"], (int, float)), f"{mid}: coords not numeric: {p}"
            assert carrier.get("default"), f"{mid}: carrier missing default"
            
            # posture_morphing_json
            posture = rec.get("posture_morphing_json")
            if isinstance(posture, str):
                posture = json.loads(posture)
            assert isinstance(posture, dict), f"{mid}: posture not dict"
            modes = posture.get("modes")
            assert isinstance(modes, list) and len(modes) >= 2, f"{mid}: posture.modes must have >= 2 modes"
            for m in modes:
                assert m.get("id"), f"{mid}: posture mode missing id"
                assert "rotationDeg" in m, f"{mid}: posture mode missing rotationDeg"
                assert "reflected" in m, f"{mid}: posture mode missing reflected"
            assert posture.get("default"), f"{mid}: posture missing default"
            
            # camouflage_xray_json
            camo = rec.get("camouflage_xray_json")
            if isinstance(camo, str):
                camo = json.loads(camo)
            assert isinstance(camo, dict), f"{mid}: camo not dict"
            dlayers = camo.get("distractorLayers")
            assert isinstance(dlayers, list), f"{mid}: distractorLayers must be list"
            for dl in dlayers:
                assert dl.get("id") and dl.get("nameZh"), f"{mid}: distractorLayer invalid: {dl}"
                assert isinstance(dl.get("items"), list), f"{mid}: layer items not list"
            skeleton = camo.get("coreSkeleton")
            assert isinstance(skeleton, dict), f"{mid}: coreSkeleton must be dict"
            assert skeleton.get("nameZh"), f"{mid}: coreSkeleton missing nameZh"
            assert skeleton.get("primaryElements"), f"{mid}: coreSkeleton missing primaryElements"
            
        elif rtype == "concept":
            concept_count += 1
            sbid = rec.get("sandbox_id")
            assert sbid, f"Line {idx}: missing sandbox_id"
            guide_en = rec.get("inquiry_guide_en")
            assert guide_en and "__PENDING" not in guide_en, f"{sbid}: invalid inquiry_guide_en: {guide_en}"
        else:
            raise ValueError(f"Line {idx}: unknown record type '{rtype}'")
            
    print(f"Validation PASSED for {file_path}: {leap_count} leap models, {concept_count} concept sandboxes.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_sbfill_part.py <file_path>")
        sys.exit(1)
    validate_part(sys.argv[1])
