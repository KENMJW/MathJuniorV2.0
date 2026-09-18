#!/usr/bin/env python3
"""
数学门神入库测试 (属性测试 + 边缘用例)
验证: Property 1 (归一化闭包与幂等性), Property 2 (语法异常拦截: T3, T4, KaTeX headless)
标签: Feature: math-junior-frontend, Property 1/2
"""

import sys
import os
import random
import unittest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from math_gate import sanitize_and_verify_math

try:
    from hypothesis import given, settings, strategies as st
    HAS_HYPOTHESIS = True
except ImportError:
    HAS_HYPOTHESIS = False


class TestMathGateProperties(unittest.TestCase):
    """
    Feature: math-junior-frontend, Property 1: 数学公式归一化闭包
    Feature: math-junior-frontend, Property 2: 非法 LaTeX 结构严格拒绝
    """

    # 1. 属性测试: Property 1 归一化闭包与幂等性 (>=100 次迭代)
    if HAS_HYPOTHESIS:
        @settings(max_examples=150)
        @given(
            st.lists(
                st.sampled_from([
                    r"\(x + 1\)",
                    r"\[y = 2x\]",
                    "＄30度＄",
                    "$Rt△ABC$",
                    "$△DEF$",
                    "$a * b$",
                    "$c ÷ d$",
                    r"$$\begin{matrix} 1 & 2 \\ 3 & 4 \end{matrix}$$",
                    "普通中文字符串与公式混排",
                    "180度",
                    "${x + y}$",
                ]),
                min_size=1,
                max_size=8,
            )
        )
        def test_property_1_hypothesis(self, tokens):
            raw_text = " ".join(tokens)
            self._assert_property_1(raw_text)

    def test_property_1_random_iterations(self):
        """
        Property 1 随机化属性测试 (确保无 hypothesis 环境亦保证 >= 100 次迭代)
        """
        token_pool = [
            r"\(x + 1\)",
            r"\[y = 2x\]",
            "＄30度＄",
            "$Rt△ABC$",
            "$△DEF$",
            "$a * b$",
            "$c ÷ d$",
            r"$$\begin{matrix} 1 & 2 \\ 3 & 4 \end{matrix}$$",
            "普通中文字符串与公式混排",
            "180度",
            "${x + y}$",
        ]
        rng = random.Random(42)
        for _ in range(150):
            k = rng.randint(1, 8)
            tokens = [rng.choice(token_pool) for _ in range(k)]
            raw_text = " ".join(tokens)
            self._assert_property_1(raw_text)

    def _assert_property_1(self, raw_text: str):
        cleaned = sanitize_and_verify_math(raw_text)

        # 检验不再含旧定界符与旧符号
        self.assertNotIn(r"\(", cleaned, "Result should not contain '\\('")
        self.assertNotIn(r"\[", cleaned, "Result should not contain '\\['")
        self.assertNotIn("＄", cleaned, "Result should not contain full-width '＄'")
        self.assertNotIn("÷", cleaned, "Result should not contain '÷'")
        self.assertNotIn("度", cleaned, "Result should not contain '度'")
        self.assertNotIn("Rt△", cleaned, "Result should not contain 'Rt△'")
        self.assertNotIn("△", cleaned, "Result should not contain '△'")
        self.assertNotIn("*", cleaned, "Result should not contain raw '*'")

        # 检验幂等性: 清洗后再清洗恒等
        cleaned_again = sanitize_and_verify_math(cleaned)
        self.assertEqual(cleaned, cleaned_again, "Sanitization must be strictly idempotent")

    # 2. 缺陷回炉专项测试: T3 奇数个 $ / 未闭合公式定界符必须拒绝
    def test_property_2_t3_unpaired_dollar_delimiters_rejected(self):
        cases = [
            "这是 $x+1 未闭合公式",
            r"已知 \(x + 1 未闭合括号定界符",
            r"方程 \[y = 2x 未闭合块级定界符",
            "$$x + 1$",
            "＄单侧全角美元符号",
            "$a + b$ + $c 未闭合",
        ]
        mock_db_writer = MagicMock()
        for bad_text in cases:
            with self.subTest(bad_text=bad_text):
                with self.assertRaises(ValueError):
                    cleaned = sanitize_and_verify_math(bad_text)
                    mock_db_writer(cleaned)
        mock_db_writer.assert_not_called()

    # 3. 缺陷回炉专项测试: T4 花括号错序 / 栈式嵌套非法必须拒绝
    def test_property_2_t4_disordered_braces_stack_rejected(self):
        cases = [
            r"$\frac}{a}{b$",  # 实测经典 T4：计数相等但 } 在 { 前
            "$}{$",
            "$a + {b}} + {{c$",
            "$\frac{1}{2}}$",
            "${{x+y}$",
        ]
        mock_db_writer = MagicMock()
        for bad_text in cases:
            with self.subTest(bad_text=bad_text):
                with self.assertRaises(ValueError):
                    cleaned = sanitize_and_verify_math(bad_text)
                    mock_db_writer(cleaned)
        mock_db_writer.assert_not_called()

    # 4. 属性测试: Property 2 随机奇数个 $ 定界符严格拒绝 (>=100 次迭代)
    def test_property_2_random_odd_dollars_rejected(self):
        rng = random.Random(789)
        mock_db_writer = MagicMock()
        for _ in range(100):
            # 构造奇数个未转义 $
            odd_count = rng.choice([1, 3, 5, 7])
            parts = [f"part_{i}" for i in range(odd_count + 1)]
            bad_text = "$".join(parts)
            with self.assertRaises(ValueError):
                cleaned = sanitize_and_verify_math(bad_text)
                mock_db_writer(cleaned)
        mock_db_writer.assert_not_called()

    # 5. 属性测试: Property 2 随机花括号错序与未闭合严格拒绝 (>=100 次迭代)
    def test_property_2_random_unbalanced_and_inverted_braces(self):
        rng = random.Random(123)
        mock_db_writer = MagicMock()
        for _ in range(100):
            chars = "abcdef123+-*/"
            text_len = rng.randint(0, 15)
            inner = "".join(rng.choice(chars) for _ in range(text_len))
            # 随机生成反序花括号: } 在前, { 在后
            p1 = rng.choice(['', 'a'])
            p2 = rng.choice(['', 'b'])
            malformed = "$" + p1 + "}" + inner + "{" + p2 + "$"
            with self.assertRaises(ValueError):
                cleaned = sanitize_and_verify_math(malformed)
                mock_db_writer(cleaned)
        mock_db_writer.assert_not_called()

    # 6. Property 2 专项: Headless KaTeX 编译预检拦截语法错误
    def test_property_2_katex_headless_syntax_rejection(self):
        cases = [
            r"$\frac{1}$",  # 参数缺失
            r"$\undefinedMacro{xyz}$",  # 未知宏
            r"$\sqrt[3{x}$",  # 未闭合的可选参数括号
            r"$$\begin{matrix} 1 & 2 $$",  # 环境未闭合
        ]
        mock_db_writer = MagicMock()
        for bad_tex in cases:
            with self.subTest(bad_tex=bad_tex):
                with self.assertRaises(ValueError):
                    cleaned = sanitize_and_verify_math(bad_tex)
                    mock_db_writer(cleaned)
        mock_db_writer.assert_not_called()

    # 7. 真实中考题目模式单元校验
    def test_typical_exam_stems(self):
        stem = r"在\(Rt△ABC\)中，\(\angle C = 90度\)，\(AB * BC ÷ 2 = 12\)，求\(\sin A\)。"
        result = sanitize_and_verify_math(stem)
        expected = r"在$\text{Rt}\triangle ABC$中，$\angle C = 90^\circ$，$AB \times BC \div 2 = 12$，求$\sin A$。"
        self.assertEqual(result, expected)


if __name__ == "__main__":
    unittest.main()
