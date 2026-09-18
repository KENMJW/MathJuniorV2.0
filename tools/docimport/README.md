# docimport · 真题文档导入工具

> 把"原生 OMML 公式的 doc/docx"真题文档，抽取 → 切题 → 对齐 questions 扁平 schema → 入库 `data/questions.db`。
> 本地运行、零识别（不依赖多模态/OCR），基于 Pandoc 无损抽取。

---

## 支持范围（当前阶段）

| 格式 | 公式形态 | 支持 |
| :--- | :--- | :--- |
| **docx / doc（原生 OMML 公式）** | Word 公式编辑器打的结构化公式 | ✅ 支持（本工具目标） |
| docx（WMF 碎片公式，如从PDF转来） | 公式被拆成矢量图碎片 | ❌ 不支持（拒收，见体检） |
| 扫描 PDF（整页图片） | 无文字层 | ❌ 不支持（拒收） |

> **判据不是后缀，是"公式是否原生 OMML"。** 入库前先跑体检（`inspect.py`）判定。

---

## 实测依据（2026-09-17，样卷验证）

样卷：`八年级（下）月考数学试卷（5月份）（拔尖卷）（教师版）.docx`
- OMML 原生公式：**1128 个** → Pandoc 完美转 LaTeX（`$3\sqrt{2}+\sqrt{8}$`、`$S_{\triangle APE}$`、`$▱ABCD$`）
- 图片：42 张 png，`--extract-media` 原位锚定，零错位
- 结构：题号 `1．（3分）` / 选项 A~D / `【答案】` / `【分析】` / `【详解】` 全部清晰
- 教师版：含答案 + 分析 + 详解 → 可填 answer_standard / rubric / solutions

对照：成都卷（584 WMF碎片，公式碎成字符级）与 实数测评（扫描PDF）均**不可用**，故本工具只收原生 OMML 源。

---

## 输入 / 输出

- **输入**：单个 doc/docx 文件，或一个文件夹（批量，递归找 doc/docx）。
- **输出**：写入 `data/questions.db`（前端扁平 schema）；图片存 `assets/questions/`；产出采集报告 + 待抽检清单。

---

## 处理流程（管线）

```
输入文件/文件夹
  → 1. inspect   体检:判定 原生OMML(放行) / WMF碎片/扫描(拒收并报告)
  → 2. extract   Pandoc 抽取: docx → markdown + 图片(原位锚定)
  → 3. segment   切题: 按 题号/题型段(选择/填空/解答) 切成独立题目;答案/分析/详解归位
  → 4. tag       考点提取(主解法用到哪些 KP) + 双语? + 认知打分
  → 5. match     查 ① 白名单(core.db) 匹配 combination_id;越界丢弃
  → 6. score     L1-L9 双引擎算分
  → 7. gate      公式过数学门神清洗;脏公式拦截
  → 8. load      对齐 questions 扁平 schema 入库
  → 9. report    采集报告 + 待人工抽检清单
```

---

## 待深入讨论的方案点（与架构师确认后再实现）

1. **切题规则**：题号识别（`1．` `2．` `（1）`）、大题块（选择/填空/解答）、子题合并策略。
2. **教师版答案对齐**：`【答案】`→answer_standard；`【详解】`分步→rubric_checklist_json；`【分析】`→solutions_json。如何稳定切分这三段。
3. **考点提取(tag)**：本工具本地做，还是仍调模型？考点 KP 从题目文字/解析里怎么可靠提取（关系到 match 白名单成败）。
4. **双语**：源多为纯中文。stem_en/answer 的英文从哪来（本工具不产？留空？后续补译？）——需定。
5. **认知打分**：insight/hidden/calc 本地难自动判，是否简化或调模型。
6. **难度**：教师版常带"（3分）"分值/难度提示，可辅助 L1-L9。
7. **图片命名/路径**：`assets/questions/{question_id}-{n}.png`？与 image_paths_json 对齐。
8. **combination_id 匹配**：主解法 KP 集合 sorted 查 core.db，查不到丢弃——考点提取准确率直接决定丢弃率。

> 上述点未定前，工具先实现 1(inspect)+2(extract)+3(segment) 三步（纯本地、可验证），tag/match/score/双语 待方案敲定。
