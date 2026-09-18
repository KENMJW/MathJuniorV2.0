# 契约变更请求 · 题目图片渲染（数据层 → 前端）

> **发起方**：数据层项目（math-junior-datalayer）
> **执行方**：前端项目（math-junior-frontend）对话
> **背景**：真题含题干图、选项图，是精品题库的必要组成。经实测，前端当前 `OnlineExam` / 题目渲染**只走 `MathRenderer`（纯文本+LaTeX），完全不渲染图片**（`image_paths_json` 未被消费）。故带图的题现在显示不出图。本请求定义数据格式与前端渲染要求，两边据此对齐。
> **原则**：精品呈现——图不仅要显示，还要 **UI 好看**（居中、留白、圆角、暗色模式适配）；同时控制**加载速度**。

---

## 1. 图的三种角色与数据格式（数据层保证产出此格式）

数学题的图分三类，数据层入库时严格按此格式：

### 1.1 题干图（精确位置锚点）
- `stem_zh` / `stem_en` 文本中，图出现的位置插入锚点标记 **`[[IMG:n]]`**（n 从 0 起，对应 image_paths_json 下标）。
- 示例：
  ```
  stem_zh: "如图，在四边形 $ABCD$ 中 [[IMG:0]]，已知 $\\angle B=90°$，求面积。"
  image_paths_json: ["assets/questions/Q-2026-XX-0001_stem0.webp"]
  ```
- **前端要求**：渲染题干时，按顺序处理文本与 `[[IMG:n]]`——文本段走 `MathRenderer`，遇到 `[[IMG:n]]` 在**原位**插入 `image_paths_json[n]` 的图。**图必须出现在题干的精确位置**（不是统一堆末尾）。

### 1.2 选项图（选项级绑定）
- `options_json` 中，图选项用 `img` 字段：
  ```json
  {
    "A": {"zh": "", "en": "", "img": "assets/questions/Q-xxx_optA.webp"},
    "B": {"zh": "$x>0$", "en": "$x>0$"},
    "C": {"zh": "", "img": "assets/questions/Q-xxx_optC.webp"},
    "D": {...}
  }
  ```
- **前端要求**：渲染每个选项时，若该选项有 `img` 则渲染图片，否则走 `MathRenderer(zh/en)`。图文选项可混存（有的选项是图、有的是文本）。

### 1.3 解析图（低频）
- `solutions_json` 内同理可含 `[[IMG:n]]` 锚点，n 继续指向 image_paths_json。前端展开解析时同题干规则渲染。

### 1.4 image_paths_json = 全图总索引
- 一道题所有图（题干/选项/解析）都在 `image_paths_json` 数组里，锚点/字段按**下标**引用。
- 命名规范：`assets/questions/{question_id}_{角色}{序号}.webp`（stem0 / optA / sol0）。

---

## 2. 前端要改的渲染点（请前端对话实现）

| 组件 | 现状 | 要改成 |
| :--- | :--- | :--- |
| `OnlineExam.tsx` 题干渲染 | `<MathRenderer content={q.stem_zh} />` | 改为「文本+`[[IMG:n]]`混合渲染器」：拆分文本与图锚点，文本走 MathRenderer，锚点原位插图 |
| `OnlineExam.tsx` 选项渲染 | `<MathRenderer content={optText} />` | 选项有 `img` 渲图，否则走 MathRenderer |
| `PointMasterExample.tsx` 母题渲染 | 同题干 | 同上（母题 stem 也可能含图） |
| 概念精讲/母题/快练 所有显示题干处 | 只 MathRenderer | 统一用「混合渲染器」 |

**建议抽一个通用组件** `<QuestionContent content={stem} images={imagePaths} />` 封装"文本+LaTeX+图锚点"混合渲染，各处复用。

---

## 3. UI 要求（精品呈现 · 全局统一图片渲染方案）

> **硬要求**：前端必须建立一套**全局统一的题目图片渲染 UI 规范**（建议做成统一组件 `<QuestionImage role="stem|option|solution" .../>` + 一套 CSS token），三种图角色（题干图/选项图/解析图）**视觉风格统一、且各自有明确视觉标准**。不允许各页面各写各的、风格不一。图是精品题库的门面，显示必须好看。

### 3.1 三种图角色的统一视觉标准

| 角色 | 视觉标准 |
| :--- | :--- |
| **题干图 `[[IMG:n]]`** | 在题干精确锚点位置原位插入；居中、最大宽度自适应容器（≤题宽）、Squircle 圆角、细玻璃边框、上下留白；暗色模式背景/边框自适配。多图按锚点顺序各自成块。 |
| **选项图 `options.img`** | 与选项字母 A/B/C/D 严格对齐；四个选项图**尺寸归一**（等高或等宽栅格对齐，不大小不一）；选项点选态高亮范围**包含整个图区域**（不是只高亮字母）；图文选项混排时对齐基线一致。 |
| **解析图 `[[IMG:n]]`（solutions）** | 展开解析时原位插入；与题干图同一套视觉规范；可略小；同样圆角/边框/留白/暗色适配。 |

### 3.2 全局统一规范（三角色共用）
- **设计语言**：统一走 §10.2 iOS 27 液态玻璃 token（圆角 `--radius-md`、玻璃边框、`--glass-shadow`），**禁止硬编码颜色/圆角**，暗色模式零延迟适配。
- **交互**：三种图统一支持点击放大（Lightbox 查看大图，精品必备，尤其几何图看细节）。
- **占位/容错**：图未加载显示等大骨架屏（防 CLS 跳动）；加载失败显示统一占位框 + `onError` 兜底，不破版。
- **响应式**：手机/平板/电脑三端图尺寸与排布自适应（复用 §10.3 三端范式）。
- **一致性**：题干图、选项图、解析图、以及考点示意 SVG（assets/concepts）在同一屏出现时，边框/圆角/留白视觉语言一致，不割裂。

> 建议前端封装通用组件承载上述规范：`<QuestionContent stem images />`（文本+LaTeX+题干图锚点混合）内部调用 `<QuestionImage>`；选项渲染与解析渲染复用同一 `<QuestionImage>`，保证三角色全局统一。

---

## 4. 加载速度优化（两边协作）

**数据层侧（导入工具做）**：
- 图统一转 **WebP**、压缩、限制最大宽度（约 800px），单图控制在 ~30-80KB。中考几何图清晰可辨即可，不追求高清。

**前端侧（请前端做）**：
- `<img loading="lazy" decoding="async">` 懒加载，图进视口才加载。
- 图随 `questions.db` 分包**按需 fetch**，不随 app 启动全量加载。
- 可选：图 CDN 缓存 / Service Worker 缓存（PWA 已有）。

---

## 5. 题目来源标签显示（新增要求）

- **数据层保证**：题目来源信息**不留在 stem_zh 题干里**（保持题面干净），而是提取到结构化字段：
  - `source`：完整来源（如 "2025年四川省成都市中考数学试卷"）
  - `exam_year`：年份（如 2025）
  - `region`：地区/出处（如 "成都" / "2024东莞三模"）
- **前端要求**：题目 UI 上**优雅显示来源标签**（如题目卡片角落一个小标签 "2025·成都中考" 或 "2024·东莞三模"），走 iOS27 液态玻璃 token（小号、次要色、圆角 pill）。
  - 数据源：优先用 `region`+`exam_year` 组合成短标签；`source` 作为完整信息（可 hover/点击展开）。
  - **不要把来源渲染进题干正文**——题干只渲染 stem_zh（纯题面 + `[[IMG:n]]`）。
  - 来源字段可能为占位（`region` 空 / `exam_year` 空）时，标签优雅隐藏，不显示空标签。

## 6. 契约字段小结（前端消费方按此解析）

| 字段 | 类型 | 约定 |
| :--- | :--- | :--- |
| stem_zh / stem_en | TEXT | 纯题面 + `[[IMG:n]]` 锚点（n 指 image_paths_json 下标）；**不含来源前缀** |
| options_json | TEXT(JSON) | `{"A":{"zh","en","img"?}}`；选项对象可含 `img` 字段（图选项） |
| solutions_json | TEXT(JSON) | 可含 `[[IMG:n]]` 锚点 |
| image_paths_json | TEXT(JSON数组) | 全图总索引，路径 `assets/questions/{qid}_{角色}{序号}.webp` |
| source / exam_year / region | TEXT/INT | 题目来源，前端做来源标签（§5） |
| content_status | TEXT | pending=待回填(考点/难度/翻译/答案占位)；done=已完整。前端渲染不依赖此列 |

---

## 6. 数据层承诺
- 导入工具严格产出上述格式（题干图插锚点、选项图标 img、图转 WebP 压缩）。
- 已入库的 14 道有图题将补齐 `[[IMG:n]]` 锚点，与新导入题格式一致。
- 图统一存 `assets/questions/`（与考点示意图 `assets/concepts/` 分离，互不干扰）。

> **请前端对话**：按 §2 改渲染、§3 做 UI、§4 做懒加载。有格式疑问回本请求核对。
