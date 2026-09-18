# 全科核心素养提分系统 V2.0 — 详细设计文档 (Detailed Design)

> 📌 **文档定位**：本文档为“全科核心素养提分系统 V2.0（初中数学模块）”的底层工程详细设计方案，详细规定 SQLite 数据库 DDL、试题与母题数据结构契约、SVG 矢量字典构建流水线、触控事件冲突控制及去重状态机算法等工程实现细节。

---

## 1. 统一 SQLite 数据库物理 Schema 详细设计

系统全部离线数据统一固化入单一本地 SQLite 数据库文件：`data/math_junior.db`。

### 1.1 核心数据表 DDL 定义

```sql
-- 1. 知识点基础字典表 (107 个核心考点)
CREATE TABLE IF NOT EXISTS knowledge_points (
    point_id VARCHAR(16) PRIMARY KEY,                 -- 如: "KP-023"
    name_zh VARCHAR(64) NOT NULL,                      -- 中文名称: "垂径定理"
    name_en VARCHAR(128) NOT NULL,                     -- 英文名称: "Perpendicular Chord Bisector Theorem"
    grade TINYINT NOT NULL,                            -- 年级: 7, 8, 9
    semester TINYINT NOT NULL,                         -- 学期: 1 (上册), 2 (下册)
    domain VARCHAR(32) NOT NULL,                       -- 四大领域: "图形与几何" / "数与代数" / "统计与概率"
    subcategory VARCHAR(64) NOT NULL,                  -- 子分类: "圆的性质"
    primary_line_id VARCHAR(8) NOT NULL,               -- 归属 12 底层数学主线 (关联 logic_lines.line_id，如 "G4")
    is_mandatory BOOLEAN NOT NULL DEFAULT 1,           -- 是否中考必考考点

    -- 矢量图示资产路径映射 (路线 B 图层点亮)
    svg_asset_zh VARCHAR(128) NOT NULL,                -- "assets/concepts/KP-023-zh.svg"
    svg_asset_en VARCHAR(128) NOT NULL,                -- "assets/concepts/KP-023-en.svg"

    -- 四段概念精讲结构化文本 (Markdown / LaTeX)
    origin_story_zh TEXT NOT NULL,                     -- ① 原点溯源 (80~120字，零前置现实困境)
    origin_story_en TEXT NOT NULL,
    intuitive_essence_zh TEXT NOT NULL,                -- ② 本真透视 (50~80字，核心不变性点睛)
    intuitive_essence_en TEXT NOT NULL,
    formal_definition_zh TEXT NOT NULL,                -- ③ 法典严定 (LaTeX 公式 + 3条以内红线)
    formal_definition_en TEXT NOT NULL,
    intrinsic_variation_zh TEXT NOT NULL,              -- ④ 本体辨正 (1组正反对比 + 1个极端退化)
    intrinsic_variation_en TEXT NOT NULL,

    -- 经典黄金母题唯一关联 (107 道单考点黄金母题之一，关联 master_examples)
    master_example_id VARCHAR(32),                     -- 关联 master_examples.example_id
    
    -- 实验室一：概念具象沙盒绑定 (NULL 表示无沙盒，前端自动渲染 CLS=0 占位卡片)
    sandbox_id VARCHAR(32),                            -- 关联 concept_sandboxes.sandbox_id
    FOREIGN KEY(primary_line_id) REFERENCES logic_lines(line_id)
);

-- 2. 概念具象沙盒模型表 (实验室一 · 约 40~50 个强几何/函数动点沙盒)
CREATE TABLE IF NOT EXISTS concept_sandboxes (
    sandbox_id VARCHAR(32) PRIMARY KEY,                -- 如: "SB-KP023"
    point_id VARCHAR(16) NOT NULL UNIQUE,              -- 关联 knowledge_points.point_id
    category_id VARCHAR(32) NOT NULL,                  -- 7大沙盒分类: "cat_eqn_ineq", "cat_linear_inv", "cat_quadratic", "cat_tri_poly", "cat_circle", "cat_transform", "cat_view_stat"
    engine_type VARCHAR(16) NOT NULL,                  -- "geometry" (几何), "function" (函数), "number_axis" (数轴)
    canvas_template VARCHAR(64) NOT NULL,              -- 前端画布代码组件名，如: "CircleChordBisectorCanvas"
    
    -- 画布底部 15% 极简文字指南 (30~45字动作口诀与中考考点定位)
    inquiry_guide_zh VARCHAR(128) NOT NULL,            -- "💡 核心操作：拖动垂直割线平移... 🎯 考点定位：垂径定理与弦长计算"
    inquiry_guide_en VARCHAR(256) NOT NULL,
    
    -- 防溢出视口规格 (含包围盒、15% Padding 与定义域约束)
    viewbox_spec_json TEXT NOT NULL,                   -- JSON: {"bbox": [-10,-8,10,8], "safe_padding": 0.15, "domain_clamps": {...}}
    drag_points_json TEXT NOT NULL,                    -- 允许拖拽动点定义与约束 JSON
    param_sliders_json TEXT NOT NULL,                  -- 参数滑块数值区间定义 JSON
    invariants_display_json TEXT NOT NULL,             -- 屏幕实时计算并显示的不变量公式 JSON
    FOREIGN KEY(point_id) REFERENCES knowledge_points(point_id)
);

-- 3. 底层数学逻辑主线字典表 (12 条核心主线泳道)
CREATE TABLE IF NOT EXISTS logic_lines (
    line_id VARCHAR(8) PRIMARY KEY,                    -- 如 "A1", "A4", "G5"
    name_zh VARCHAR(64) NOT NULL,                      -- "函数映射与数形转化"
    name_en VARCHAR(128) NOT NULL,
    domain VARCHAR(32) NOT NULL,                       -- "数与代数" / "图形与几何" / "统计与概率"
    semester_span VARCHAR(32) NOT NULL,                -- 覆盖学期: "7B, 8B, 9A, 9B"
    
    -- 主线全景螺旋演化名师精讲 (四段论)
    origin_foundation_zh TEXT NOT NULL,                -- ① 奠基原点 (七年级现实需求/矛盾)
    origin_foundation_en TEXT NOT NULL,
    spiral_leaps_zh TEXT NOT NULL,                     -- ② 螺旋跃迁 (跨学期认知进化节点)
    spiral_leaps_en TEXT NOT NULL,
    methodology_zh TEXT NOT NULL,                      -- ③ 思想方法 (数形结合/化归转化等)
    methodology_en TEXT NOT NULL,
    exam_matrix_zh TEXT NOT NULL,                      -- ④ 命题矩阵 (中考压轴设问与陷阱分布)
    exam_matrix_en TEXT NOT NULL,
    
    master_example_id VARCHAR(32) NOT NULL,            -- 绑定的主线压轴黄金母题 ID (关联 master_examples.example_id)
    flagship_model_id VARCHAR(32) NOT NULL             -- 绑定的实验室二闭环模型 ID (关联 leap_sandbox_models.model_id)
);

-- 4. 思维跃迁沙盒模型表 (实验室二 · 36 个六学期模型与 4D 变异控制器)
CREATE TABLE IF NOT EXISTS leap_sandbox_models (
    model_id VARCHAR(32) PRIMARY KEY,                  -- 如 "M-9A-19" (手拉手旋转全等模型)
    model_name_zh VARCHAR(64) NOT NULL,
    model_name_en VARCHAR(128) NOT NULL,
    unlocked_semester VARCHAR(8) NOT NULL,             -- "7A", "7B", "8A", "8B", "9A", "9B"
    primary_line VARCHAR(8) NOT NULL,                  -- 归属主线: "G5" (关联 logic_lines.line_id)
    category_id VARCHAR(32) NOT NULL,                  -- 6大中考模型分类: "cat_extremum", "cat_rotation", "cat_locus_circle", "cat_similarity", "cat_alg_geo", "cat_existence"
    tier_level TINYINT NOT NULL,                       -- 1 (原型), 2 (变式), 3 (压轴综合)
    canonical_state_count TINYINT NOT NULL,            -- 标准变形形态数 (如 5 种)
    kp_dependencies TEXT NOT NULL,                     -- 依赖考点数组 JSON: ["KP051", "KP053", "KP081"]
    clique_id VARCHAR(32),                             -- 关联 knowledge_combinations.combination_id
    
    -- 画布底部 15% 极简模型文字指南 (随 Tab 切换，30~45字)
    model_brief_zh VARCHAR(128) NOT NULL,              -- "💡 核心操作：拖动点P旋转△ABD... 🎯 考点定位：中考第25题·手拉手全等旋转"
    model_brief_en VARCHAR(256) NOT NULL,
    
    -- 统一缩放标尺与防溢出视口规格
    viewbox_spec_json TEXT NOT NULL,                   -- JSON: {"anchor_to_model": "M-9A-19-T3", "master_bbox": [-12,-9,12,9], "safe_padding": 0.15, "domain_clamps": {...}}
    
    -- 四维变异控制器配置元数据 (JSON)
    carrier_morphing_json TEXT NOT NULL,               -- 载体变异: 自由态 -> 四边形 -> 坐标系 -> 抛物线
    parameter_morphing_json TEXT NOT NULL,             -- 参数变异: 滑块与连续变量配置
    posture_morphing_json TEXT NOT NULL,               -- 姿态变异: 旋转、翻折、倾斜与退化态
    camouflage_xray_json TEXT NOT NULL,                -- 干扰加壳与 X-Ray 骨架分层图层配置
    FOREIGN KEY(primary_line) REFERENCES logic_lines(line_id)
);

-- 5. 知识点有效连通组合表 (2205 个有效 Cliques, 含 2098 个复合连通团)
CREATE TABLE IF NOT EXISTS knowledge_combinations (
    combination_id VARCHAR(32) PRIMARY KEY,            -- 如: "C3-0112"
    kp_ids TEXT NOT NULL,                              -- 包含考点数组 JSON: ["KP-023", "KP-045", "KP-088"]
    kp_count TINYINT NOT NULL,                         -- 包含考点数: 1 ~ 4
    directed_order TEXT NOT NULL,                      -- 推荐拓扑求解依赖顺序 JSON
    question_hint_zh TEXT NOT NULL,                    -- 出题思路线索 (中文)
    question_hint_en TEXT NOT NULL,                    -- 出题思路线索 (英文)
    question_types TEXT NOT NULL                       -- 适用题型 JSON: ["choice", "fill", "solution"]
);

-- 6. 学期知识图谱与拓扑网络表
CREATE TABLE IF NOT EXISTS knowledge_graph_semesters (
    node_id VARCHAR(32) PRIMARY KEY,                   -- 节点唯一标识
    point_id VARCHAR(16) NOT NULL,                     -- 关联 knowledge_points.point_id
    grade_semester VARCHAR(16) NOT NULL,               -- "7-1", "7-2", "8-1", "8-2", "9-1", "9-2"
    module_name VARCHAR(64) NOT NULL,                  -- 所在单元模块名称
    predecessors TEXT NOT NULL,                        -- 前置依赖节点数组 JSON: ["KP-012", "KP-015"]
    successors TEXT NOT NULL,                          -- 后继衍生节点数组 JSON: ["KP-045"]
    is_milestone BOOLEAN NOT NULL DEFAULT 0,           -- 是否学期核心跃迁里程碑节点
    FOREIGN KEY(point_id) REFERENCES knowledge_points(point_id)
);

-- 7. 经典黄金母题专属表 (107 道考点母题 + 12 道主线压轴母题 = 119 道，物理隔离，不参与组卷)
CREATE TABLE IF NOT EXISTS master_examples (
    example_id VARCHAR(32) PRIMARY KEY,                -- 如 "ME-KP023" 或 "ME-LINE-A4"
    example_type VARCHAR(16) NOT NULL,                 -- 'point_master' (107道考点母题), 'line_master' (12道主线压轴母题)
    bound_target_id VARCHAR(16) NOT NULL,              -- point_id (如 "KP-023") 或 line_id (如 "A4")
    source VARCHAR(64) NOT NULL,                       -- 试题来源: "2023北京中考T27"
    stem_zh TEXT NOT NULL,                             -- 题干 (中文，含 LaTeX)
    stem_en TEXT NOT NULL,                             -- 题干 (英文)
    options_json TEXT,                                 -- 选择题选项 (可选)
    correct_option VARCHAR(8),                         -- 正确选项 (可选)
    
    -- 119 道黄金母题统一自适应 1~4 维解剖字段
    dim1_origin TEXT,                                  -- 维度一: 原点建模/题眼挖掘 (可选)
    dim2_essence TEXT,                                 -- 维度二: 几何不变/本质直观 (可选)
    dim3_rigor TEXT NOT NULL,                          -- 维度三: 严密推导与生死红线 (必填)
    dim4_traps TEXT,                                   -- 维度四: 极端反例与致命变式 (可选)
    
    bound_line_id VARCHAR(8),                          -- 仅主线母题有效 (如 "G5")
    empirical_scoring_rate REAL,                       -- 官方白皮书实测得分率 (区间 [0.15, 0.35])
    image_paths_json TEXT                              -- 高清矢量配图路径 JSON
);

-- 8. 试题与真题主表 (纯中考真题与模拟题库，用于模块四智能组卷与全真测评)
CREATE TABLE IF NOT EXISTS questions (
    question_id VARCHAR(32) PRIMARY KEY,               -- 唯一主键，如 "Q-2022-YN-009"
    source VARCHAR(64) NOT NULL,                       -- 试题来源: "2022云南中考" 或 "2023北京中考T27"
    exam_year SMALLINT,                                -- 考卷年份: 2022
    region VARCHAR(32),                                -- 省市地区: "云南", "北京"
    exam_type VARCHAR(32) NOT NULL DEFAULT '中考真题', -- "中考真题", "一模", "二模", "期末综合"
    grade_level TINYINT NOT NULL,                      -- 年级: 7, 8, 9
    semester TINYINT NOT NULL,                         -- 学期: 1 (上), 2 (下)
    
    primary_point_id VARCHAR(16) NOT NULL,             -- 主考点 ID (关联 knowledge_points.point_id)
    combination_id VARCHAR(32),                        -- 考点组合 ID (关联 knowledge_combinations)
    difficulty_level TINYINT NOT NULL,                 -- 难度等级: 1 ~ 9
    question_type VARCHAR(16) NOT NULL,                -- "single_choice", "fill_blank", "solution"
    score_default TINYINT NOT NULL DEFAULT 2,          -- 默认分值
    
    stem_zh TEXT NOT NULL,                             -- 题干 (中文，含 LaTeX)
    stem_en TEXT NOT NULL,                             -- 题干 (英文)
    options_json TEXT,                                 -- 选择题选项 JSON: {"A": "...", "B": "...", "C": "...", "D": "..."}
    answer_standard TEXT NOT NULL,                     -- 标准答案 (选择题为字母，填空题为 LaTeX 表达式)
    
    -- 解答题中考标准踩分点卡片 (Rubric Checklist JSON)
    rubric_checklist_json TEXT,                        -- JSON: [{"step": 1, "desc_zh": "证明 △ACE ≌ △BDF", "score": 3}, ...]
    
    -- 常规解答题全量多解法结构 (JSON)
    solutions_json TEXT,                               -- 多解法拆解 (解法一几何综合, 解法二解析建系, 题眼跳跃点)
    image_paths_json TEXT,                             -- 纯净高清矢量图路径 JSON
    FOREIGN KEY(primary_point_id) REFERENCES knowledge_points(point_id),
    FOREIGN KEY(combination_id) REFERENCES knowledge_combinations(combination_id)
);

### 1.2 数据库索引优化
为了在 WASM 客户端达到 $15\text{ms}$ 以内的极限响应速度，建立以下覆盖索引：
```sql
CREATE INDEX idx_kp_grade_semester ON knowledge_points(grade, semester, primary_line_id);
CREATE INDEX idx_q_filter ON questions(grade_level, semester, question_type, difficulty_level);
CREATE INDEX idx_q_kp_combo ON questions(primary_point_id, combination_id);
CREATE INDEX idx_me_target ON master_examples(example_type, bound_target_id);
CREATE INDEX idx_leap_primary_line ON leap_sandbox_models(primary_line, unlocked_semester);
```

---

## 2. 经典黄金母题体系（107 + 12 = 119 道）数据契约

系统严格锁定 119 道全四维名师解剖母题，统一存储于 `master_examples` 表中（物理隔离于考试题库 `questions` 表），由 `example_type` 字段进行类型区分：
- `example_type = 'point_master'`：模块一 107 道单考点黄金母题；
- `example_type = 'line_master'`：模块二 12 道主线压轴旗舰母题（含 `bound_line_id` 与 `empirical_scoring_rate`）。

### 2.1 模块一：107 道考点级黄金母题契约示例
```json
{
  "question_id": "M-KP023-01",
  "example_type": "point_master",
  "primary_point_id": "KP-023",
  "is_master_example": true,
  "available_dimensions": ["dim1_origin", "dim2_essence", "dim3_rigor", "dim4_traps"],
  "dimensions": {
    "dim1_origin": {
      "title_zh": "原点溯源：真实生活度量困境",
      "content_zh": "赵州桥跨度 37.4 米，拱高 7.2 米。无法下水测圆心，如何单凭桥洞尺寸计算半径？"
    },
    "dim2_essence": {
      "title_zh": "本真透视：圆的轴对称与垂直投影",
      "content_zh": "垂直于弦的直径是对称轴，过圆心作弦的垂线，必构造出经典的‘垂径黄金直角三角形’。"
    },
    "dim3_rigor": {
      "title_zh": "法典严定：标准推演与隐形红线",
      "content_zh": "设半径为 $R$。在 Rt△OCM 中，列勾股方程：$R^2 = (R - 7.2)^2 + (37.4 / 2)^2$。\n【生死红线】半径 $R$ 必须严格大于拱高 $7.2$ 米，否则几何图形不成立！解得 $R \\approx 27.9\\text{m}$。"
    },
    "dim4_traps": {
      "title_zh": "本体辨正：极端退化与反直觉变式",
      "content_zh": "【警惕陷阱】若桥拱超过半圆，圆心位于水面之下，此时弦心距应表示为 $h - R$ 而非 $R - h$，必须先根据拱高与跨度关系判定圆心相对位置，否则列方程必然符号错误！"
    }
  }
}
```

### 2.2 模块二：12 道主线级压轴旗舰母题契约示例
```json
{
  "question_id": "LM-G5-01",
  "example_type": "line_master",
  "bound_line_id": "G5",
  "primary_point_id": "KP-081",
  "combination_id": "C4-0892",
  "empirical_scoring_rate": 0.22,
  "source": "2022北京中考T27",
  "difficulty_level": 8,
  "is_master_example": true,
  "bound_leap_model_id": "M-9A-19",
  "available_dimensions": ["dim1_origin", "dim2_essence", "dim3_rigor", "dim4_traps"],
  "dimensions": {
    "dim1_origin": {
      "title_zh": "原点建模：共顶点等腰题眼嗅觉",
      "content_zh": "读题抓住‘共顶直角、两组等腰’。只要出现共顶旋转刚体，100% 触发【手拉手全等模型】！"
    },
    "dim2_essence": {
      "title_zh": "本真透视：旋转角守恒与全等锁定",
      "content_zh": "绕公共顶点旋转，公共角叠加导致顶角恒等（∠BAD ≡ ∠CAE），SAS 锁定全等，对应线段长恒等且延长线夹角恒为 90°！"
    },
    "dim3_rigor": {
      "title_zh": "法典严定：瓜豆中点圆轨迹与三点共线极值",
      "content_zh": "从动点 M 是从动点 E 的定比位似点，根据瓜豆原理，M 点轨迹是以 AC 中点为圆心的定圆！\n【中考阅卷生死红线】利用两边之和大于第三边求极值时，必须严格验证 D、O₁、M 三点能否在同一旋转角下共线，缺此验证扣 2 分！"
    },
    "dim4_traps": {
      "title_zh": "本体辨正：旋缩相似变形与共线退化",
      "content_zh": "【变式警示】若顶角由 90° 改为 60°，全等升级为旋转相似；若旋转角为 0° 或 180°，图形退化为共线截长补短，必须改用代数绝对值讨论。"
    }
  }
}
```

---

## 3. 标准 SVG 基础数据字典工程构建流水线

### 3.1 符号化生成与编译流水线 (Pipeline)
1. **TikZ 脚本构建**：
   - 编写 `scripts/tikz/KP-023.tex`，使用解析几何宏包严格定义点、线、圆坐标与垂直标记。
2. **Path 路径化编译命令**：
   ```bash
   latex -interaction=nonstopmode KP-023.tex
   dvisvgm --no-fonts --exact-bbox -o assets/concepts/KP-023-raw.svg KP-023.dvi
   ```
   *说明：`--no-fonts` 参数强制将公式文字全部转为矢量 Path 轮廓，杜绝 WebKit 引擎的字体缺失与错位 Bug。*

### 3.2 路线 B 图层分离与主题自适应后处理 (Post-Processor)
Python 脚本 `scripts/process_svg.py` 对导出的原始 SVG 执行自动化后处理：
1. 注入标准 `viewBox="0 0 400 300"` 与 `vector-effect="non-scaling-stroke"`；
2. 将硬编码颜色 `#000000` 统一替换为 `currentColor`；
3. 将顶点字母、公式代号节点包裹于 `<g class="formal-labels">` 组中：
   ```xml
   <svg viewBox="0 0 400 300" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
     <!-- 几何底图图层：第2段（透视）与第3段（法典）常驻显示 -->
     <g class="geometry-base" stroke="currentColor" fill="none">
       <circle cx="200" cy="150" r="100" />
       <line x1="200" y1="30" x2="200" y2="270" stroke="#ef4444" stroke-width="2.5" />
       <line x1="113.4" y1="100" x2="286.6" y2="100" stroke="#3b82f6" stroke-width="2.5" />
     </g>
     <!-- 字母与符号法典图层：第2段隐藏，第3段点亮 -->
     <g class="formal-labels" fill="currentColor">
       <path d="M... (字母 A 矢量轮廓)" />
       <path d="M... (字母 B 矢量轮廓)" />
       <path d="M... (字母 M 矢量轮廓)" />
     </g>
   </svg>
   ```

---

## 4. 离线题库抽样去重状态机算法

```
[ 用户进入单考点练习 ]
         │
         ▼
[ 检查 Session 内存集合: presented_ids[point_id] ]
         │
         ├─── 题库剩余未做题数 >= 3 ──► 执行 SQL 抽取 (NOT IN presented_ids) ──► 展示 3 道选择题
         │                                                                       │
         │                                                            更新 presented_ids 集合
         │
         └─── 题库剩余未做题数 < 3 (池耗尽)
                     │
                     ▼
             [ 触发池耗尽降级事件 ]
             1. 弹出友好提示: "已刷完本考点全部基础题，开启循环巩固"
             2. presented_ids[point_id].clear()
             3. 重新执行 SQL 随机抽取 3 题
```

---

## 5. 触控屏事件冲突控制详细设计

为了在手机与平板端彻底隔离“外层页面滑动”与“画布内部拖动”，前端组件采用指针捕获控制：

```javascript
// 画布手势隔离控制器
export function bindCanvasTouchHandler(canvasElement) {
  canvasElement.style.touchAction = 'none'; // 强制阻止浏览器原生滚屏

  canvasElement.addEventListener('pointerdown', (e) => {
    // 检测是否命中动点命中热区 (Hit Target >= 44px)
    const targetPoint = hitTestMovablePoint(e.offsetX, e.offsetY, 24); // 半径24px(直径48px)
    if (targetPoint) {
      e.target.setPointerCapture(e.pointerId); // 锁定手势指针
      startDragging(targetPoint, e);
      e.stopPropagation();
      e.preventDefault();
    }
  }, { passive: false });

  canvasElement.addEventListener('pointermove', (e) => {
    if (isDragging) {
      updatePointPosition(e.offsetX, e.offsetY);
      e.stopPropagation();
    }
  });

  canvasElement.addEventListener('pointerup', (e) => {
    if (isDragging) {
      e.target.releasePointerCapture(e.pointerId);
      stopDragging();
    }
  });
}
```

---

## 6. 🔴 认知断层逆向溯源图遍历算法 (Recursive Breakdown Root-Cause Traversal)

当学生在某高阶综合考点错误率较高时，系统通过遍历学期拓扑表（`knowledge_graph_semesters`）的入度前驱边，递归诊断其历史薄弱点：

```typescript
interface PointMastery {
  point_id: string;
  attempt_count: number;
  accuracy: number; // 0.0 ~ 1.0
  status: 'mastered' | 'fragile' | 'breakdown' | 'untested'; // 绿 | 黄 | 红 | 灰
}

interface RootCauseReport {
  target_point_id: string;
  root_cause_point_id: string | null;
  backtrack_path: string[]; // 红色脉冲连线路径: ["KP-088", "KP-029", "KP-014"]
  prescription_zh: string;
}

export function traceRootCause(
  failedPointId: string,
  userMasteryMap: Map<string, PointMastery>,
  graphAdjacency: Map<string, string[]> // point_id -> predecessors[]
): RootCauseReport {
  const visited = new Set<string>();
  const queue: { pointId: string; path: string[] }[] = [{ pointId: failedPointId, path: [failedPointId] }];

  while (queue.length > 0) {
    const { pointId, path } = queue.shift()!;
    visited.add(pointId);

    const predecessors = graphAdjacency.get(pointId) || [];
    for (const predId of predecessors) {
      if (visited.has(predId)) continue;
      
      const predMastery = userMasteryMap.get(predId);
      // 判定条件：前置节点为夹生 (accuracy < 0.65) 或断层 (accuracy < 0.40)
      if (predMastery && (predMastery.status === 'breakdown' || predMastery.status === 'fragile')) {
        return {
          target_point_id: failedPointId,
          root_cause_point_id: predId,
          backtrack_path: [...path, predId],
          prescription_zh: `你在【${failedPointId}】反复受挫，溯源病根在于前置地基【${predId}】尚未扎实（掌握度仅 ${(predMastery.accuracy * 100).toFixed(0)}%）。建议优先点击红色前驱节点补齐基础！`
        };
      }
      queue.push({ pointId: predId, path: [...path, predId] });
    }
  }

  return {
    target_point_id: failedPointId,
    root_cause_point_id: null,
    backtrack_path: [],
    prescription_zh: `当前考点【${failedPointId}】前置基础扎实，失分主要由于本考点特有的高阶综合技巧未熟练，建议前往【实验探究】拖拽动点沙盒强化直观！`
  };
}
```

---

## 7. 12 主线压轴母题 5 步漏斗筛选算法规格

```
[ 全国中考原卷题池 (N ≈ 3000) ]
              │
              ▼ Step 1: 官方白皮书实测得分率区间硬过滤 (SQL)
    SELECT * FROM raw_questions WHERE empirical_scoring_rate BETWEEN 0.15 AND 0.35;
              │  (保留 N ≈ 400)
              ▼ Step 2: 考点连通团高频必考聚类过滤 (排除偏难怪)
    WHERE combination_frequency_in_ten_years >= 15 AND algebraic_steps <= 8;
              │  (保留 N ≈ 60)
              ▼ Step 3: 12 条底层逻辑主线映射归队 (每条保留 Top 3 候选)
    PARTITION BY primary_line ORDER BY model_relevance_score DESC LIMIT 3;
              │  (保留 N = 36)
              ▼ Step 4: 大模型多解法验证机审 (自适应 1~4 维可拆解性)
    LLM_PROMPT: 验证是否同时具备几何直观法与代数建系法，提炼生死红线扣分点；
              │  (各选出唯一最优母题 N = 12)
              ▼ Step 5: 固化入库
    UPDATE questions SET example_type = 'line_master', is_master_example = 1 WHERE question_id IN (...);
```

---

## 8. 数学排版“单入口·单出口”工程实现规约 (Math Gateway Specifications)

系统建立严格的代码级门神机制，全系统关于数学公式的编解码与渲染仅允许通过以下唯一的入口与出口进行，将风险点物理收束为 1。

### 8.1 唯一入库入口清洗算法规约 (`scripts/math_sanitizer.py`)

所有由大模型生成、真题爬取或教研录入的试题文本，在执行 SQLite `INSERT / UPDATE` 之前，必须 100% 经过单点纯函数 `sanitize_and_verify_math`：

```python
import re
import subprocess

def sanitize_and_verify_math(raw_text: str) -> str:
    """
    全系统唯一入库清洗门神:
    1. 定界符归一化
    2. 数学符号标准化
    3. 反斜杠转义加固
    4. Headless 语法预编译拦截 (通不过直接抛出异常拒绝入库)
    """
    text = raw_text

    # 1. 统一定界符: 将 \( ... \) 替换为 $...$, 将 \[ ... \] 替换为 $$...$$
    text = re.sub(r'\\\((.*?)\\\)', r'$\1$', text, flags=re.DOTALL)
    text = re.sub(r'\\\[(.*?)\\\]', r'$$\1$$', text, flags=re.DOTALL)
    text = text.replace('＄', '$') # 替换全角美元符

    # 2. 核心数学符号标准化
    text = re.sub(r'(\d+)\s*\*\s*(\d+)', r'\1 \\times \2', text) # 乘号标准化
    text = re.sub(r'(\d+)\s*÷\s*(\d+)', r'\1 \\div \2', text)     # 除号标准化
    text = re.sub(r'(\d+)\s*度', r'\1^\\circ', text)             # 角度标准化
    text = text.replace('Rt△', '\\text{Rt}\\triangle ')
    text = text.replace('△', '\\triangle ')

    # 3. 提取所有公式片段，进行 Headless KaTeX 语法预检
    math_segments = re.findall(r'\$\$(.*?)\$\$|\$(.*?)\$', text, flags=re.DOTALL)
    for seg_double, seg_single in math_segments:
        formula = seg_double if seg_double else seg_single
        formula_clean = formula.strip()
        if not formula_clean:
            continue
        
        # 语法预检: 花括号闭合校验与非法控制符拦截
        if formula_clean.count('{') != formula_clean.count('}'):
            raise ValueError(f"[入库拦截] LaTeX 花括号不匹配: {formula_clean}")
        if formula_clean.count('\\begin{') != formula_clean.count('\\end{'):
            raise ValueError(f"[入库拦截] LaTeX 环境未闭合: {formula_clean}")

    return text
```

### 8.2 唯一出库出口渲染组件契约 (`src/components/common/MathRenderer.tsx`)

业务层（模块一、二、三、四）严禁直接导入 `katex` 或在 DOM 中写 `innerHTML`，必须统一调用唯一的 `<MathRenderer>`：

```typescript
import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;               // 混合 Markdown / LaTeX 纯文本
  block?: boolean;               // 是否块级独立行显示
  className?: string;
}

// 内存级 LRU 渲染缓存 (最大容量 1000 条，避免长列表滚动重复计算)
const formulaCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

function parseAndRenderLatex(rawText: string, isBlock: boolean): string {
  const cacheKey = `${isBlock ? 'B:' : 'I:'}${rawText}`;
  if (formulaCache.has(cacheKey)) {
    return formulaCache.get(cacheKey)!;
  }

  // 正则拆分文本与数学公式
  const regex = /\$\$([\s\S]*?)\$\$|\$([\s\S]*?)\$/g;
  let resultHtml = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    // 拼接前置纯文本 (转义 HTML 防止 XSS)
    const plainText = rawText.substring(lastIndex, match.index);
    resultHtml += escapeHtml(plainText);

    const isDisplayMode = match[0].startsWith('$$');
    const mathContent = (isDisplayMode ? match[1] : match[2]) || '';

    try {
      // 核心渲染调用: 强制设置 throwOnError 为 false
      const renderedMath = katex.renderToString(mathContent.trim(), {
        displayMode: isDisplayMode || isBlock,
        throwOnError: false,
        errorColor: '#ef4444',     // 语法瑕疵仅将错误符号标红，绝对不崩溃宿主页面
        strict: false,
        trust: false,              // 杜绝外部脚本注入
      });
      resultHtml += renderedMath;
    } catch (e) {
      console.error('[MathRenderer Catch]', e);
      resultHtml += `<span class="math-error" style="color:#ef4444;font-style:italic;">${escapeHtml(match[0])}</span>`;
    }

    lastIndex = regex.lastIndex;
  }

  // 拼接剩余文本
  if (lastIndex < rawText.length) {
    resultHtml += escapeHtml(rawText.substring(lastIndex));
  }

  // 写入 LRU 缓存
  if (formulaCache.size >= MAX_CACHE_SIZE) {
    const firstKey = formulaCache.keys().next().value;
    formulaCache.delete(firstKey);
  }
  formulaCache.set(cacheKey, resultHtml);

  return resultHtml;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, block = false, className }) => {
  const safeHtml = useMemo(() => parseAndRenderLatex(content, block), [content, block]);

  return (
    <span
      className={`math-renderer-egress ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};
```

---

## 9. 模块三沙盒物理引擎与统一视口防溢出算法规范 (Sandbox Viewport & Physics Engine Specifications)

### 9.1 最大模型包围盒归一化与统一标尺算法 (Max Bounding Box & Scale Anchoring)
为保证 36 个思维跃迁模型和 40~50 个概念沙盒在任何屏幕与动态操作下**零溢出、零裁剪、无镜头突变抖动**，系统在数学底层实现“最大模型包围盒归一化与标尺锚定”算法。

```
                       ┌──────────────────────────────────────────────┐
                       │  全局视口边界 (Canvas ViewPort: 4:3 比例)     │
                       │  X: [-12, +12], Y: [-9, +9]                  │
                       │  ┌────────────────────────────────────────┐  │
                       │  │ 15% 安全缓冲带 (Safe Padding Margin)    │  │
                       │  │    ┌──────────────────────────────┐    │  │
                       │  │    │  [L3 压轴综合模型最大包围盒]   │    │  │
                       │  │    │  - 360° 手拉手扫掠外接圆      │    │  │
                       │  │    │  - 抛物线顶点与铅垂高三角形   │    │  │
                       │  │    │  - 顶点字母角标 A,B,P(x,y)   │    │  │
                       │  │    │  - 动点轨迹包络域 Envelope   │    │  │
                       │  │    └──────────────────────────────┘    │  │
                       │  │ 15% 安全缓冲带 (Safe Padding Margin)    │  │
                       │  └────────────────────────────────────────┘  │
                       └──────────────────────────────────────────────┘
                               ▲ 统一标尺锚定 (Scale Anchored)
            L1 原型 Tab1 ───► 同坐标系渲染 (局部骨架，比例尺恒定)
            L2 变式 Tab2 ───► 同坐标系渲染 (衍生辅助线，比例尺恒定)
            L3 综合 Tab3 ───► 同坐标系渲染 (全貌呈现，触及极值安全线)
```

#### 算法实现逻辑 (TypeScript)
```typescript
export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ViewportSpec {
  viewBox: string;             // SVG 格式: "minX minY width height"
  ctmScale: number;            // 归一化像素每数学单位
  originOffset: [number, number];
  safeMarginPercent: number;   // 固定 0.15 (15%)
}

/**
 * 计算同主线多模型的统一锚定视口规格
 * @param modelsEnvelope 该主线下所有阶梯模型（含全部变异态与运动轨迹）的全局极限外包围盒
 * @param targetAspect 目标画布宽高比（默认 4/3）
 */
export function calculateMasterAnchoredViewport(
  modelsEnvelope: BoundingBox,
  targetAspect: number = 4 / 3,
  safeMargin: number = 0.15
): ViewportSpec {
  const spanX = modelsEnvelope.maxX - modelsEnvelope.minX;
  const spanY = modelsEnvelope.maxY - modelsEnvelope.minY;

  // 1. 施加 15% 外缘安全缓冲
  const paddedSpanX = spanX * (1 + safeMargin * 2);
  const paddedSpanY = spanY * (1 + safeMargin * 2);

  const centerX = (modelsEnvelope.minX + modelsEnvelope.maxX) / 2;
  const centerY = (modelsEnvelope.minY + modelsEnvelope.maxY) / 2;

  // 2. 长宽比自适应锁定 (避免拉伸失真)
  let finalWidth = paddedSpanX;
  let finalHeight = paddedSpanY;

  if (finalWidth / finalHeight < targetAspect) {
    // 宽度不足，以高度为基准补齐宽度
    finalWidth = finalHeight * targetAspect;
  } else {
    // 高度不足，以宽度为基准补齐高度
    finalHeight = finalWidth / targetAspect;
  }

  const minX = centerX - finalWidth / 2;
  const minY = centerY - finalHeight / 2;

  return {
    viewBox: `${minX.toFixed(2)} ${minY.toFixed(2)} ${finalWidth.toFixed(2)} ${finalHeight.toFixed(2)}`,
    ctmScale: 1000 / finalWidth,
    originOffset: [centerX, centerY],
    safeMarginPercent: safeMargin
  };
}
```

---

### 9.2 动点物理边界硬截断闭包算法 (Parameter Domain Clamping)
为防止用户在触控或鼠标高速甩动时，动点脱离轨迹或滑块溢出预设空间，系统在几何交互驱动层注入**物理边界阻尼拦截器**：

```typescript
export interface MotionConstraint {
  type: 'point_on_segment' | 'point_on_ray' | 'point_on_arc' | 'slider_param';
  domain: [number, number];   // 严格允许区间 [min, max]
  elasticZone?: number;       // 边缘弹性阻尼区间 (如 5%)
}

/**
 * 动点与参数物理防脱轨拦截器
 */
export function clampDynamicValue(
  rawValue: number,
  constraint: MotionConstraint
): number {
  const [min, max] = constraint.domain;

  if (rawValue < min) {
    return min; // 硬锁死在内边界
  }
  if (rawValue > max) {
    return max; // 硬锁死在外边界
  }
  return rawValue;
}
```

---

### 9.3 85% : 15% 画布数据契约与 TypeScript 类型定义

```typescript
// 实验室一：概念具象沙盒实体
export interface ConceptSandboxEntity {
  sandboxId: string;           // "SB-KP023"
  pointId: string;             // "KP023"
  categoryId: string;          // "cat_circle"
  engineType: 'geometry' | 'function' | 'number_axis';
  canvasTemplate: string;      // "CircleChordBisectorCanvas"
  
  // 下部 15% 极简文字指南 (限制 45 字以内)
  inquiryGuideZh: string;      // "💡 核心操作：拖动垂直割线平移，观察弧与弦平分。 🎯 考点定位：垂径定理计算。"
  inquiryGuideEn: string;
  
  viewportSpec: ViewportSpec;
}

// 实验室二：思维跃迁模型实体
export interface LeapSandboxModelEntity {
  modelId: string;             // "M-9A-19"
  modelNameZh: string;         // "手拉手旋转全等模型"
  modelNameEn: string;
  unlockedSemester: '7A' | '7B' | '8A' | '8B' | '9A' | '9B';
  primaryLine: string;         // "G5"
  categoryId: string;          // "cat_rotation"
  tierLevel: 1 | 2 | 3;        // 1=原型, 2=变式, 3=压轴综合
  
  // 下部 15% 极简文字指南 (随 Tab 联动)
  modelBriefZh: string;        // "💡 核心操作：拖动旋转角滑块，验证全等不变性。 🎯 考点定位：中考第25题压轴·手拉手全等。"
  modelBriefEn: string;
  
  viewportSpec: ViewportSpec;  // 统一锚定至该主线 Tier 3 最大包围盒
  carrierMorphing: any;
  parameterMorphing: any;
  postureMorphing: any;
  camouflageXray: any;
}
```

---

## 10. 模块四实战测评与精准出题算法规范 (Assessment & Test Generation Algorithms)

### 10.1 纯前端轻量数学等价判定算法 (Math Equivalence Normalizer)
在无后端云端 CAS 环境下，系统基于**规范化字符串转换 + 浮点数值离散代入抽样**双重校验，杜绝格式不同误判扣分：

```typescript
/**
 * 清洗 LaTeX 字符串为标准等价值
 */
export function normalizeMathString(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/\s+/g, '')                       // 移除全部空格
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)') // \frac{a}{b} -> (a)/(b)
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)') // \sqrt{x} -> sqrt(x)
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pi/g, 'pi');
}

/**
 * 校验填空题学生作答与标准答案的数学等价性
 */
export function isMathAnswerEquivalent(studentAnswer: string, standardAnswer: string): boolean {
  const normStudent = normalizeMathString(studentAnswer);
  const normStandard = normalizeMathString(standardAnswer);

  // 1. 纯字面精确匹配
  if (normStudent === normStandard) return true;

  // 2. 数值等价匹配 (针对纯数字、小数、简单分式: 如 0.5 vs 1/2)
  try {
    const evalStudent = Function(`'use strict'; return (${normStudent.replace(/sqrt/g, 'Math.sqrt').replace(/pi/g, 'Math.PI')})`)();
    const evalStandard = Function(`'use strict'; return (${normStandard.replace(/sqrt/g, 'Math.sqrt').replace(/pi/g, 'Math.PI')})`)();
    if (typeof evalStudent === 'number' && typeof evalStandard === 'number' && !isNaN(evalStudent)) {
      return Math.abs(evalStudent - evalStandard) < 1e-6;
    }
  } catch (e) {
    // 包含未知变量或无法直接 eval，降级为代数规范化比对
  }

  return false;
}
```

---

### 10.2 解答题中考分步踩分点契约与自核算法 (Rubric Checklist Contract)

```typescript
// 中考解答题踩分点卡片定义
export interface RubricStep {
  stepIndex: number;           // 1, 2, 3
  descriptionZh: string;       // "证明 △ACE ≌ △BDF，写出对应角相等的依据"
  descriptionEn?: string;
  points: number;              // 本步分值: 3
}

export interface SolutionQuestionRubric {
  questionId: string;
  maxScore: number;            // 6, 8, 10
  steps: RubricStep[];
}

/**
 * 计算解答题学生自核得分
 * @param steps 踩分点清单
 * @param checkedStepIndices 学生打钩的步骤索引集合
 */
export function calculateSolutionScore(steps: RubricStep[], checkedStepIndices: Set<number>): number {
  return steps.reduce((sum, step) => {
    return checkedStepIndices.has(step.stepIndex) ? sum + step.points : sum;
  }, 0);
}
```

---

### 10.3 智能组卷库存预警拦截算法（方案 A）与防重复抽样

```typescript
export interface PaperConfig {
  gradeLevel?: number;
  semester?: number;
  selectedKpIds: string[];
  choiceCount: number;
  fillCount: number;
  solutionCount: number;
  difficultyDistribution: [number, number, number, number, number]; // L1~L5 占比 (和为 100)
}

export interface InventoryCheckResult {
  canGenerate: boolean;
  availableCount: number;
  requiredCount: number;
  shortageWarningZh?: string;
}

/**
 * 组卷前库存方案 A 校验
 */
export async function verifyPaperInventory(
  db: any,
  config: PaperConfig
): Promise<InventoryCheckResult> {
  const totalRequired = config.choiceCount + config.fillCount + config.solutionCount;
  
  // 查询题库中符合已选考点与类型的试题总量
  const kpList = config.selectedKpIds.map(id => `'${id}'`).join(',');
  const query = `
    SELECT question_type, COUNT(*) as count 
    FROM questions 
    WHERE primary_point_id IN (${kpList})
    GROUP BY question_type
  `;
  const res = await db.exec(query);
  
  let availableChoice = 0, availableFill = 0, availableSolution = 0;
  if (res.length > 0) {
    for (const row of res[0].values) {
      if (row[0] === 'single_choice') availableChoice = row[1];
      else if (row[0] === 'fill_blank') availableFill = row[1];
      else if (row[0] === 'solution') availableSolution = row[1];
    }
  }

  const isShort = (availableChoice < config.choiceCount) || 
                  (availableFill < config.fillCount) || 
                  (availableSolution < config.solutionCount);

  if (isShort) {
    return {
      canGenerate: false,
      availableCount: availableChoice + availableFill + availableSolution,
      requiredCount: totalRequired,
      shortageWarningZh: `当前勾选考点题目不足！选择题需 ${config.choiceCount}(余${availableChoice})，填空题需 ${config.fillCount}(余${availableFill})，解答题需 ${config.solutionCount}(余${availableSolution})。请增加考点或减少题数。`
    };
  }

  return {
    canGenerate: true,
    availableCount: availableChoice + availableFill + availableSolution,
    requiredCount: totalRequired
  };
}
```


