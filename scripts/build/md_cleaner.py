#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deterministic Markdown Cleaner for questions.db (TASK-DATA-0005 Attempt 2).
Transforms Pandoc markdown residue (*italic*, ^sup^, ~sub~, blockquote >, exam headers, repeated dots)
into standard LaTeX without touching any existing $...$ formulas.
"""

import os
import sys
import re
import json
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math_gate import sanitize_and_verify_math

class MarkdownCleaner:
    def __init__(self):
        self.stats = {
            "star_converted": 0,
            "star_stripped": 0,
            "caret_converted": 0,
            "tilde_converted": 0,
            "gt_stripped": 0,
            "headers_stripped": 0,
            "dots_normalized": 0,
            "html_noise_stripped": 0,
        }

        # Trailing answer key table / exam header
        self.re_trailing_ans_table = re.compile(
            r"\n\n\*{0,2}\d{4}年.+?中考数学试卷\*{0,2}\n\n\*{0,2}参考答案与试题解析\*{0,2}[\s\S]*$",
            re.MULTILINE
        )
        self.re_trailing_ans = re.compile(
            r"\n\n\*{0,2}参考答案与试题解析\*{0,2}[\s\S]*$",
            re.MULTILINE
        )
        self.re_trailing_exam = re.compile(
            r"\n\n\*{0,2}\d{4}年.+?中考数学试卷\*{0,2}[\s\S]*$",
            re.MULTILINE
        )

        # Section headers (greedy match to line end or trailing bold)
        self.re_section_headers = [
            re.compile(r"(\*{0,2}[一二三四五六七八九十]+、\s*(?:单项)?(?:选择题|填空题|解答题|综合题|计算题|实验题|证明题)[^\n]*)"),
            re.compile(r"(\*{0,2}[一二三四五六七八九十]+、[^\n]*?(?:（共\d+小题|（本题共|（本大题|（满分|\d+分）)[^\n]*)"),
            re.compile(r"(\*{0,2}本大题[^\n]*)"),
            re.compile(r"(\*{0,2}[一二三四五六七八九十]+、（本大题[^\n]*)"),
            re.compile(r"(\*{0,2}[一二三四五六七八九十]+、（本题[^\n]*)"),
        ]

    def clean_non_formula_segment(self, text: str) -> str:
        """
        Cleans a text segment that is strictly OUTSIDE of any formula.
        """
        if not text:
            return text

        # 1. Strip HTML noise <!-- -->{=html}
        if "<!-- -->{=html}" in text:
            text = text.replace("<!-- -->{=html}", "")
            self.stats["html_noise_stripped"] += 1

        # 2. Truncate trailing answer key / exam table
        m = self.re_trailing_ans_table.search(text)
        if m:
            text = text[:m.start()]
            self.stats["headers_stripped"] += 1
        else:
            m2 = self.re_trailing_ans.search(text)
            if m2:
                text = text[:m2.start()]
                self.stats["headers_stripped"] += 1
            else:
                m3 = self.re_trailing_exam.search(text)
                if m3:
                    text = text[:m3.start()]
                    self.stats["headers_stripped"] += 1

        # 3. Strip exam section headers
        for hp in self.re_section_headers:
            count = len(hp.findall(text))
            if count > 0:
                text = hp.sub("", text)
                self.stats["headers_stripped"] += count

        # 4. Strip line-start blockquote '>'
        gt_matches = re.findall(r"(?m)^\s*>\s?", text)
        if gt_matches:
            text = re.sub(r"(?m)^\s*>\s?", "", text)
            self.stats["gt_stripped"] += len(gt_matches)

        # 5. Normalize repeated dots / ellipsis
        dot_matches = re.findall(r"\.{4,}", text)
        if dot_matches:
            text = re.sub(r"\.{4,}", "……", text)
            self.stats["dots_normalized"] += len(dot_matches)

        dot_cn_matches = re.findall(r"。{2,}", text)
        if dot_cn_matches:
            text = re.sub(r"。{2,}", "。", text)
            self.stats["dots_normalized"] += len(dot_cn_matches)

        # 6. Asterisk around superscript: 2*^m^* -> 2^m^
        def repl_star_sup(m):
            self.stats["star_converted"] += 1
            self.stats["caret_converted"] += 1
            return f"$^{{{m.group(1)}}}$"
        text = re.sub(r"\*\^([a-zA-Z0-9]+)\^\*", repl_star_sup, text)

        # 7. Prime marks on variables: △*A*′*BE* -> $\triangle A'BE$, *A*′*D* -> $A'D$, *AA*′ -> $AA'$
        def repl_prime_tri(m):
            self.stats["star_converted"] += 1
            return f"$\\triangle {m.group(1)}'{m.group(3)}$"
        text = re.sub(r"△\*([A-Za-z0-9]+)\*([′\']+)\*([A-Za-z0-9]+)\*", repl_prime_tri, text)

        def repl_prime_var(m):
            self.stats["star_converted"] += 1
            return f"${m.group(1)}'{m.group(3)}$"
        text = re.sub(r"\*([A-Za-z0-9]+)\*([′\']+)\*([A-Za-z0-9]+)\*", repl_prime_var, text)

        def repl_single_prime(m):
            self.stats["star_converted"] += 1
            return f"${m.group(1)}'$"
        text = re.sub(r"\*([A-Za-z0-9]+)\*([′\']+)", repl_single_prime, text)

        # 8. Multi-subscript triangles: △*A*~1~*B*~1~*C*~1~ -> $\triangle A_1 B_1 C_1$
        def repl_tri_3sub(m):
            self.stats["star_converted"] += 3
            self.stats["tilde_converted"] += 3
            return f"$\\triangle {m.group(1)}_{{{m.group(2)}}} {m.group(3)}_{{{m.group(4)}}} {m.group(5)}_{{{m.group(6)}}}$"
        text = re.sub(r"△\*([A-Za-z])\*~([0-9a-zA-Z]+)~\*([A-Za-z])\*~([0-9a-zA-Z]+)~\*([A-Za-z])\*~([0-9a-zA-Z]+)~",
                      repl_tri_3sub, text)

        def repl_var_3sub(m):
            self.stats["star_converted"] += 3
            self.stats["tilde_converted"] += 3
            return f"${m.group(1)}_{{{m.group(2)}}} {m.group(3)}_{{{m.group(4)}}} {m.group(5)}_{{{m.group(6)}}}$"
        text = re.sub(r"\*([A-Za-z])\*~([0-9a-zA-Z]+)~\*([A-Za-z])\*~([0-9a-zA-Z]+)~\*([A-Za-z])\*~([0-9a-zA-Z]+)~",
                      repl_var_3sub, text)

        def repl_var_2sub(m):
            self.stats["star_converted"] += 2
            self.stats["tilde_converted"] += 2
            return f"${m.group(1)}_{{{m.group(2)}}} {m.group(3)}_{{{m.group(4)}}}$"
        text = re.sub(r"\*([A-Za-z])\*~([0-9a-zA-Z]+)~\*([A-Za-z])\*~([0-9a-zA-Z]+)~",
                      repl_var_2sub, text)

        # 9. Area S or shape subscript (MUST RUN BEFORE standalone triangle/star):
        def repl_shape_sub(m):
            prefix = m.group(1) or ""
            shape = m.group(2)
            label = m.group(3).replace("*", "").replace("′", "'").replace(" ", "")
            self.stats["tilde_converted"] += 1
            s_part = "S" if "S" in prefix else ""
            if shape == "△":
                return f"${s_part}_{{\\triangle {label}}}$" if s_part else f"$\\triangle {label}$"
            else:
                return f"${s_part}_{{\\text{{{shape}}} {label}}}$" if s_part else f"$\\text{{{shape}}} {label}$"
        text = re.sub(r"(\*?S\*?)~([△四边形平行矩扇圆正]+)\*?([^\$\n~]+)\*?~", repl_shape_sub, text)

        def repl_s_tri(m):
            self.stats["star_converted"] += 1
            self.stats["tilde_converted"] += 1
            return f"$S_{{\\triangle {m.group(1)}}}$"
        text = re.sub(r"\*?S\*?~△\*?([A-Za-z0-9′\']+)\*?~", repl_s_tri, text)

        def repl_rt_tri(m):
            self.stats["star_converted"] += 1
            self.stats["tilde_converted"] += 1
            return f"$\\text{{Rt}}\\triangle {m.group(1)}$"
        text = re.sub(r"\*?Rt\*?~△\*?([A-Za-z0-9′\']+)\*?~", repl_rt_tri, text)

        def repl_s_named(m):
            shape_name = m.group(1)
            target = m.group(2)
            self.stats["tilde_converted"] += 1
            return f"$S_{{\\text{{{shape_name}}}{target}}}$"
        text = re.sub(r"\*?S\*?~(四边形|平行四边形|矩形|扇形|圆|阴影)\*?([A-Za-z0-9′\']*)\*?~", repl_s_named, text)

        def repl_s_extrema(m):
            self.stats["tilde_converted"] += 1
            ext = m.group(1)
            if ext in ["最小", "min"]:
                return r"$S_{\min}$"
            return r"$S_{\max}$"
        text = re.sub(r"\*?S\*?~(最小|最大|max|min)\*?~", repl_s_extrema, text)

        def repl_s_general(m):
            self.stats["star_converted"] += 1
            self.stats["tilde_converted"] += 1
            return f"$S_{{{m.group(1)}}}$"
        text = re.sub(r"\*?S\*?~([A-Za-z0-9]+)~", repl_s_general, text)

        def repl_force_speed(m):
            self.stats["tilde_converted"] += 1
            return f"${m.group(1)}_{{\\text{{{m.group(2)}}}}}$"
        text = re.sub(r"\*?([FPvW])\*?~([^\$\n~]+)~", repl_force_speed, text)

        # 10. Geometric shapes with italic variables:
        def repl_geom_rt(m):
            self.stats["star_converted"] += 1
            return f"$\\text{{Rt}}\\triangle {m.group(1)}$"
        text = re.sub(r"Rt△\*([A-Za-z0-9]+)\*", repl_geom_rt, text)

        def repl_geom_tri(m):
            self.stats["star_converted"] += 1
            return f"$\\triangle {m.group(1)}$"
        text = re.sub(r"△\*([A-Za-z0-9]+)\*", repl_geom_tri, text)

        def repl_geom_ang(m):
            self.stats["star_converted"] += 1
            return f"$\\angle {m.group(1)}$"
        text = re.sub(r"∠\*([A-Za-z0-9]+)\*", repl_geom_ang, text)

        def repl_geom_cir(m):
            self.stats["star_converted"] += 1
            return f"$\\odot {m.group(1)}$"
        text = re.sub(r"☉\*([A-Za-z0-9]+)\*", repl_geom_cir, text)

        # 11. Clean non-math asterisks containing Chinese / brackets / section headers
        def strip_non_math_star(m):
            inner = m.group(1)
            if re.search(r"[\u4e00-\u9fa5\n\{]", inner):
                # If it's a section header, remove it completely
                if re.search(r"^[一二三四五六七八九十]+[、\.．]", inner.strip()):
                    self.stats["headers_stripped"] += 1
                    return ""
                self.stats["star_stripped"] += 1
                return inner
            return m.group(0)
        text = re.sub(r"\*([^*\$\n]+)\*", strip_non_math_star, text)

        # 12. Multi-variable list inside single star: *x、y、z* -> $x$、$y$、$z$
        def repl_multivar_star(m):
            content = m.group(1)
            vars_list = re.split(r"([、，,])", content)
            out = []
            for item in vars_list:
                if re.match(r"^[a-zA-Zα-ωΑ-Ω0-9]+$", item):
                    self.stats["star_converted"] += 1
                    out.append(f"${item}$")
                else:
                    out.append(item)
            return "".join(out)
        text = re.sub(r"\*([a-zA-Zα-ωΑ-Ω0-9]+(?:[、，,][a-zA-Zα-ωΑ-Ω0-9]+)+)\*", repl_multivar_star, text)

        # Helper formatting for sub/sup
        def clean_exp(s):
            s = s.replace("*", "").replace("﹣", "-").replace("－", "-").replace("＋", "+").replace("×", r"\times ").strip()
            return f"{{{s}}}" if len(s) > 1 else s

        def clean_sub(s):
            s = s.replace("*", "").strip()
            return f"{{{s}}}" if len(s) > 1 else s

        # 13. Variable with subscript and superscript: *a*~n~^2^
        def repl_sub_sup(m):
            self.stats["star_converted"] += 1
            self.stats["tilde_converted"] += 1
            self.stats["caret_converted"] += 1
            var, sub, exp = m.group(1), m.group(2), m.group(3)
            return f"${var}_{clean_sub(sub)}^{clean_exp(exp)}$"
        text = re.sub(r"\*([a-zA-Zα-ωΑ-Ω0-9]+)\*~([^\$\n~]+)~\^([^\$\n\^]+)\^", repl_sub_sup, text)

        # 14. Variable with subscript: *x*~1~, *a*~0~, *x~E~*
        def repl_sub(m):
            self.stats["star_converted"] += 1
            self.stats["tilde_converted"] += 1
            var, sub = m.group(1), m.group(2)
            return f"${var}_{clean_sub(sub)}$"
        text = re.sub(r"\*([a-zA-Zα-ωΑ-Ω0-9]+)\*~([^\$\n~]+)~", repl_sub, text)
        text = re.sub(r"\*([a-zA-Zα-ωΑ-Ω0-9]+)~([^\$\n~]+)~\*", repl_sub, text)

        # 15. Variable with superscript: *x*^2^, *ax*^2^
        def repl_sup(m):
            self.stats["star_converted"] += 1
            self.stats["caret_converted"] += 1
            var, exp = m.group(1), m.group(2)
            return f"${var}^{clean_exp(exp)}$"
        text = re.sub(r"\*([a-zA-Zα-ωΑ-Ω0-9]+)\*\^([^\$\n\^]+)\^", repl_sup, text)
        text = re.sub(r"\*([a-zA-Zα-ωΑ-Ω0-9]+)\^([^\$\n\^]+)\^\*", repl_sup, text)

        # 16. Parenthesized expression with power: （*x*﹣1）^2^, （﹣1）^2^
        def convert_paren_pow(m):
            self.stats["caret_converted"] += 1
            base = m.group(1).replace("*", "").replace("﹣", "-").replace("＋", "+").replace("＝", "=").strip()
            exp = m.group(2)
            return f"$({base})^{clean_exp(exp)}$"
        text = re.sub(r"[（\(]([^\n\(\)（）\$\^]+)[）\)]\^([^\$\n\^]+)\^", convert_paren_pow, text)

        # 17. Standalone power after alphanumeric or paren: 10^n^, 2^3^
        def repl_standalone_pow(m):
            self.stats["caret_converted"] += 1
            base, exp = m.group(1), m.group(2)
            return f"${base}^{clean_exp(exp)}$"
        text = re.sub(r"\b([a-zA-Z0-9]+)\^([^\$\n\^]+)\^", repl_standalone_pow, text)

        def repl_paren_close_pow(m):
            self.stats["caret_converted"] += 1
            return f"）$^{clean_exp(m.group(1))}$"
        text = re.sub(r"[）\)]\^([^\$\n\^]+)\^", repl_paren_close_pow, text)

        # 18. Standalone subscript after alphanumeric: k~1~, x~1~
        def repl_standalone_sub(m):
            self.stats["tilde_converted"] += 1
            base, sub = m.group(1), m.group(2)
            return f"${base}_{clean_sub(sub)}$"
        text = re.sub(r"\b([a-zA-Z]+)~([^\$\n~]+)~", repl_standalone_sub, text)

        # 19. Inequality / equation with star variable: 2*x*≤6, *x*≥1, *x*＝3, 3﹣*x*＜5
        def repl_ineq(m):
            self.stats["star_converted"] += 1
            coeff = m.group(1) or ""
            var = m.group(2)
            op = m.group(3)
            val = m.group(4)
            op_map = {"≥": r"\geq", "≤": r"\leq", "＞": ">", "＜": "<", "＝": "=", "=": "=", "≠": r"\neq"}
            op_tex = op_map.get(op, op)
            val_tex = val.replace("﹣", "-")
            return f"${coeff}{var} {op_tex} {val_tex}$"
        text = re.sub(r"([0-9]*)\*([a-zA-Zα-ωΑ-Ω])\*\s*([≥≤＞＜＝=≠])\s*([﹣\-]?[0-9]+)", repl_ineq, text)

        # 20. Coefficient attached to star variable: 2*x* -> $2x$, 3*m* -> $3m$, ﹣*x* -> $-x$
        def repl_coeff(m):
            self.stats["star_converted"] += 1
            return f"${m.group(1)}{m.group(2)}$"
        text = re.sub(r"([0-9]+)\*([a-zA-Zα-ωΑ-Ω]+)\*", repl_coeff, text)

        def repl_minus_var(m):
            self.stats["star_converted"] += 1
            return f"$-{m.group(1)}$"
        text = re.sub(r"﹣\*([a-zA-Zα-ωΑ-Ω]+)\*", repl_minus_var, text)

        # 21. Remaining standalone *VAR*: *x*, *AB*, *sin*, *α*
        def convert_var(m):
            var = m.group(1)
            if re.match(r"^[a-zA-Zα-ωΑ-Ω0-9]+$", var):
                self.stats["star_converted"] += 1
                if var == "cm":
                    return "$\\text{cm}$"
                elif var in ["sin", "cos", "tan"]:
                    return f"$\\{var}$"
                return f"${var}$"
            self.stats["star_stripped"] += 1
            return var
        text = re.sub(r"\*([^*\$\n]+)\*", convert_var, text)

        # 22. Isolated ^exp^ or ~sub~
        def repl_iso_sup(m):
            self.stats["caret_converted"] += 1
            return f"$^{clean_exp(m.group(1))}$"
        text = re.sub(r"\^([^\$\n\^]+)\^", repl_iso_sup, text)

        def repl_iso_sub(m):
            self.stats["tilde_converted"] += 1
            return f"$_{clean_sub(m.group(1))}$"
        text = re.sub(r"~([^\$\n~]+)~", repl_iso_sub, text)

        # 23. Clean any garbage like *\*
        text = text.replace(r"*\* ", " ").replace(r"*\*;", ";").replace(r"*\*", "")

        # 24. Merge adjacent dollars within this segment: $a$$b$ -> $a b$
        def merge_dollars(m):
            f1, f2 = m.group(1).strip(), m.group(2).strip()
            if re.match(r"^[a-zA-Z0-9\^_\{\}\\]+$", f1) and re.match(r"^[a-zA-Z0-9\^_\{\}\\]+$", f2):
                return f"${f1} {f2}$"
            return f"${f1}$ ${f2}$"
        text = re.sub(r"\$([^\$\n]+)\$\s*\$([^\$\n]+)\$", merge_dollars, text)

        # 25. Separate any remaining touching dollars in non-formula segment
        text = re.sub(r"(?<=\$)(?=\$)", " ", text)

        return text

    def clean_text(self, text: str) -> str:
        """
        Cleans a complete field (stem_zh, text in solutions_json, answer_standard, etc.)
        Preserves all existing formulas ($...$, $$...$$, \\[...\\], \\(...\\)) 100% untouched.
        """
        if not text or not isinstance(text, str):
            return text

        # Split into alternating [non-formula, formula, non-formula, formula, ...]
        parts = re.split(r"(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))", text)

        new_parts = []
        for i, p in enumerate(parts):
            if i % 2 == 1:
                # Formula segment: KEEP 100% UNTOUCHED
                new_parts.append(p)
            else:
                # Non-formula segment: clean
                cleaned_seg = self.clean_non_formula_segment(p)
                cleaned_seg = re.sub(r"(?<=\$)(?=\$)", " ", cleaned_seg)
                new_parts.append(cleaned_seg)

        # Assemble and ensure touching inline $ across segments have a space
        assembled = []
        for p in new_parts:
            if not p:
                continue
            if assembled:
                prev = assembled[-1]
                if prev.endswith("$") and not prev.endswith("$$") and p.startswith("$") and not p.startswith("$$"):
                    assembled.append(" ")
            assembled.append(p)

        result = "".join(assembled)
        result = re.sub(r"\n{3,}", "\n\n", result).strip()
        return result

    def clean_question_record(self, record: dict) -> dict:
        """
        Cleans all relevant fields of a question record:
        stem_zh, stem_en, options_json, answer_standard, solutions_json.
        """
        out = dict(record)

        # 1. stem_zh
        if record.get("stem_zh"):
            out["stem_zh"] = self.clean_text(record["stem_zh"])

        # 2. stem_en
        if record.get("stem_en"):
            out["stem_en"] = self.clean_text(record["stem_en"])

        # 3. answer_standard
        if record.get("answer_standard"):
            out["answer_standard"] = self.clean_text(record["answer_standard"])

        # 4. solutions_json
        sol_raw = record.get("solutions_json")
        if sol_raw:
            try:
                sols = json.loads(sol_raw)
                sol_changed = False
                if isinstance(sols, list):
                    for s in sols:
                        if isinstance(s, dict) and "text" in s:
                            old_t = s["text"]
                            new_t = self.clean_text(old_t)
                            if new_t != old_t:
                                s["text"] = new_t
                                sol_changed = True
                if sol_changed:
                    out["solutions_json"] = json.dumps(sols, ensure_ascii=False)
            except:
                pass

        # 5. options_json
        opt_raw = record.get("options_json")
        if opt_raw:
            try:
                opts = json.loads(opt_raw)
                opt_changed = False
                if isinstance(opts, dict):
                    for k, v in opts.items():
                        if isinstance(v, dict):
                            if "zh" in v:
                                old_z = v["zh"]
                                new_z = self.clean_text(old_z)
                                if new_z != old_z:
                                    v["zh"] = new_z
                                    opt_changed = True
                            if "en" in v:
                                old_e = v["en"]
                                new_e = self.clean_text(old_e)
                                if new_e != old_e:
                                    v["en"] = new_e
                                    opt_changed = True
                        elif isinstance(v, str):
                            new_v = self.clean_text(v)
                            if new_v != v:
                                opts[k] = new_v
                                opt_changed = True
                if opt_changed:
                    out["options_json"] = json.dumps(opts, ensure_ascii=False)
            except:
                pass

        return out
