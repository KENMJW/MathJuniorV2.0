#!/usr/bin/env python3
"""
入库数学门神: sanitize_and_verify_math()
设计文档: §6.1, §12 (Property 1, Property 2), CT-4
职责:
1. 定界符归一: \\( \\) -> $...$, \\[ \\] -> $$...$$, 全角 ＄ -> $
2. 定界符配对校验: $ / $$ 严格成对闭合，奇数个未转义 $ 或未闭合 $$ 强制拦截 (T3)
3. 符号标准化: * -> \\times, ÷ -> \\div, 度 -> ^\\circ, Rt△ -> \\text{Rt}\\triangle, △ -> \\triangle
4. 花括号栈式嵌套校验: 遇 { 入栈，遇 } 出栈，栈空遇 } 或结束栈非空强制拦截 (T4)
5. \\begin{env} / \\end{env} 环境匹配校验
6. Headless KaTeX 编译预检: 调用 KaTeX throwOnError: true 对每个公式片段试编译
"""

import atexit
import json
import os
import re
import subprocess
from typing import List, Tuple, Optional


class KaTeXValidatorClient:
    """
    Node.js KaTeX Headless 验证进程客户端 (长驻进程，亚毫秒级校验)
    """
    _instance: Optional['KaTeXValidatorClient'] = None

    def __init__(self):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        validator_script = os.path.join(script_dir, 'katex_validator.mjs')

        if not os.path.exists(validator_script):
            raise RuntimeError(f"KaTeX validator script not found: {validator_script}")

        try:
            self.proc = subprocess.Popen(
                ['node', validator_script],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.req_id = 0
            atexit.register(self.terminate)
        except Exception as e:
            raise RuntimeError(f"Failed to spawn KaTeX validator Node daemon: {e}")

    @classmethod
    def get_instance(cls) -> 'KaTeXValidatorClient':
        if cls._instance is None or cls._instance.proc is None or cls._instance.proc.poll() is not None:
            cls._instance = cls()
        return cls._instance

    def validate_formula(self, formula: str, is_display: bool = False) -> Tuple[bool, Optional[str]]:
        if not self.proc or self.proc.poll() is not None:
            raise RuntimeError(
                "KaTeX validator Node daemon is not alive! Silent degradation is prohibited in build pipeline."
            )

        self.req_id += 1
        payload = json.dumps({
            'id': self.req_id,
            'formula': formula,
            'displayMode': is_display
        }) + '\n'

        try:
            self.proc.stdin.write(payload)
            self.proc.stdin.flush()
            line = self.proc.stdout.readline()
            if not line:
                return True, None
            resp = json.loads(line)
            if resp.get('ok'):
                return True, None
            return False, resp.get('error', 'KaTeX parse error')
        except Exception as e:
            return False, str(e)

    def terminate(self):
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=1)
            except Exception:
                pass


def _verify_delimiters_and_extract(text: str) -> List[Tuple[str, bool]]:
    """
    1. 定界符配对校验 (修复 T3: 奇数个 $ 或未闭合定界符)
    2. 提取出所有公式片段 (formula_content, is_display_block)
    """
    formulas: List[Tuple[str, bool]] = []
    n = len(text)
    i = 0

    # 首先统计未转义的单个 $ 总数 (含 $$ 中的两个 $)
    total_unescaped_dollars = 0
    idx = 0
    while idx < n:
        if text[idx] == '\\':
            idx += 2
            continue
        if text[idx] == '$':
            total_unescaped_dollars += 1
        idx += 1

    if total_unescaped_dollars % 2 != 0:
        raise ValueError(
            f"Unpaired '$' delimiter: found {total_unescaped_dollars} unescaped '$' (odd count). "
            f"Formula delimiters must be closed."
        )

    # 状态机解析与配对提取
    while i < n:
        if text[i] == '\\':
            i += 2
            continue

        if text[i:i+2] == '$$':
            # 遇到块级定界符 $$
            start_pos = i + 2
            end_pos = -1
            j = start_pos
            while j < n:
                if text[j] == '\\':
                    j += 2
                    continue
                if text[j:j+2] == '$$':
                    end_pos = j
                    break
                j += 1

            if end_pos == -1:
                raise ValueError("Unclosed block math delimiter '$$'")

            formulas.append((text[start_pos:end_pos].strip(), True))
            i = end_pos + 2
            continue

        if text[i] == '$':
            # 遇到行内定界符 $
            start_pos = i + 1
            end_pos = -1
            j = start_pos
            while j < n:
                if text[j] == '\\':
                    j += 2
                    continue
                if text[j:j+2] == '$$':
                    # 在行内 $ 内部遇到 $$ 为非法嵌套
                    raise ValueError("Illegal '$$' inside unclosed inline math delimiter '$'")
                if text[j] == '$':
                    end_pos = j
                    break
                j += 1

            if end_pos == -1:
                raise ValueError("Unclosed inline math delimiter '$'")

            formulas.append((text[start_pos:end_pos].strip(), False))
            i = end_pos + 1
            continue

        i += 1

    return formulas


def _verify_braces_stack(text: str) -> None:
    """
    花括号栈式嵌套校验 (修复 T4: 遇到 } 时栈空即非法)
    """
    brace_stack = []
    i = 0
    n = len(text)

    while i < n:
        if text[i] == '\\':
            # 跳过转义字符，如 \{ 与 \}
            i += 2
            continue

        if text[i] == '{':
            brace_stack.append(i)
        elif text[i] == '}':
            if not brace_stack:
                raise ValueError(
                    f"Unexpected closing brace '}}' at position {i} without preceding opening brace '{{'"
                )
            brace_stack.pop()

        i += 1

    if brace_stack:
        raise ValueError(
            f"Unclosed opening brace(s) '{{': {len(brace_stack)} brace(s) remained unclosed"
        )


def _verify_environments_stack(text: str) -> None:
    """
    \\begin{env} / \\end{env} 环境闭合栈校验
    """
    env_pattern = re.compile(r'\\(begin|end)\{([a-zA-Z*]+)\}')
    env_stack: List[str] = []

    for match in env_pattern.finditer(text):
        tag_type, env_name = match.groups()
        if tag_type == 'begin':
            env_stack.append(env_name)
        elif tag_type == 'end':
            if not env_stack:
                raise ValueError(f"Unmatched \\end{{{env_name}}} with empty environment stack")
            last_env = env_stack.pop()
            if last_env != env_name:
                raise ValueError(
                    f"Mismatched LaTeX environment: expected \\end{{{last_env}}}, found \\end{{{env_name}}}"
                )

    if env_stack:
        raise ValueError(f"Unclosed LaTeX environment(s): {', '.join(env_stack)}")


def sanitize_and_verify_math(text: str) -> str:
    """
    入库数学门神总入口
    1. 定界符归一与定界符成对校验 (T3)
    2. 符号标准化 (Rt△, △, ÷, 度, *)
    3. 花括号栈式嵌套校验 (T4)
    4. 环境闭合校验
    5. Headless KaTeX 试编译预检
    """
    if not isinstance(text, str):
        raise ValueError(f"Expected string input, got {type(text).__name__}")

    # 1. 定界符归一
    res = text.replace('＄', '$')
    res = res.replace('\\[', '$$').replace('\\]', '$$')
    res = res.replace('\\(', '$').replace('\\)', '$')

    # 2. 定界符成对闭合校验与公式提取 (拦截 T3)
    formulas = _verify_delimiters_and_extract(res)

    # 3. 符号标准化
    res = re.sub(r'Rt△(?=[a-zA-Z])', r'\\text{Rt}\\triangle ', res)
    res = res.replace('Rt△', r'\text{Rt}\triangle')

    res = re.sub(r'△(?=[a-zA-Z])', r'\\triangle ', res)
    res = res.replace('△', r'\triangle')

    res = re.sub(r'\s*÷\s*', r' \\div ', res)
    res = re.sub(r'(?<=[\d\)])\s*度', lambda m: r'^\circ', res)
    res = re.sub(r'(?<!\\)\*', r' \\times ', res)

    # 反斜杠加固与冗余空白压缩
    res = re.sub(r'\\{3,}times', r'\\times', res)
    res = re.sub(r'\\{3,}div', r'\\div', res)
    res = re.sub(r'\\{3,}triangle', r'\\triangle', res)
    res = re.sub(r' +', ' ', res)

    # 4. 栈式嵌套校验 (拦截 T4)
    _verify_braces_stack(res)
    _verify_environments_stack(res)

    # 5. 符号标准化后重新提取公式进行 Headless KaTeX 编译预检
    normalized_formulas = _verify_delimiters_and_extract(res)
    validator = KaTeXValidatorClient.get_instance()

    for formula, is_display in normalized_formulas:
        ok, err = validator.validate_formula(formula, is_display)
        if not ok:
            raise ValueError(f"KaTeX headless verification failed for formula '${formula}$': {err}")

    return res


if __name__ == '__main__':
    sample = r"已知\(Rt△ABC\)中，\(\angle C = 90度\)，且 \(a * b ÷ 2 = 6\)。"
    cleaned = sanitize_and_verify_math(sample)
    print("Original:", sample)
    print("Cleaned: ", cleaned)
