# TASK-FE-0003 【A. 构建与启动】章节端到端验证报告

> **核查日期**：2026-09-18  
> **执行角色**：端到端只读验证子智能体 (Subagent)  
> **工作目录**：`/Users/annette/aidev/全科核心素养提分系统V2.0`  
> **输出文件**：`tmp/verify/partA.md`  
> **执行原则**：严格遵循红线要求——只读验证、不修复 Bug、不修改任何业务/配置代码、不修改任何 `data/*.db` 数据库文件；客观记录全部量化数据，实施【阻塞】/【一般】/【观察】三级缺陷分类。

---

## 目录
1. [执行概要与核心结论](#1-执行概要与核心结论)
2. [构建与测试全绿核验 (pnpm build & pnpm test)](#2-构建与测试全绿核验-pnpm-build--pnpm-test)
3. [静态资源分发与产物完整性核对 (dist/)](#3-静态资源分发与产物完整性核对-dist)
4. [四包 DB 加载架构与按需机制核验 (packages.ts / dbClient.ts)](#4-四包-db-加载架构与按需机制核验-packagests--dbclientts)
5. [Preview 预览服务器可用性与安全头核验](#5-preview-预览服务器可用性与安全头核验)
6. [缺陷与风险分级清单](#6-缺陷与风险分级清单)

---

## 1. 执行概要与核心结论

本次端到端验证覆盖工程构建完整性、自动化测试全量通过性、`dist` 构建输出分发完整性、四包 SQLite WASM 惰性加载设计符合性、以及本地 Preview 预览服务可用性（含 SharedArrayBuffer 必需的 COOP/COEP 安全响应头）。

### 核心核验指标总结

| 核验模块 | 校验项目 | 预期标准 / 契约指标 | 实际核查结果 | 达成状态 | 风险分级 |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **构建流程** | `pnpm build` | 0 TypeScript 错误，0 Vite 致命错误 | `tsc --noEmit && vite build` 0 错误通过，耗时 7.93s | 100% | 通过 |
| **自动化测试** | `pnpm test` | 全绿通过，无失败用例 | **34 个测试套件，175 个测试用例**全部通过 (100%) | 100% | 通过 |
| **入口资源** | `dist/index.html` | 存在且合法 | 存在，大小 2,419 字节 (2.36 kB)，包含完整 SPA 与 Polyfill 结构 | 100% | 通过 |
| **数据库分发** | `dist/data/*.db` | 4 个分包完整性与大小 | `core.db`, `master.db`, `sandbox.db`, `questions.db` PRAGMA integrity 均为 ok | 100% | 通过 |
| **数据库一致性**| `data/` vs `public/` | 根数据包与 public 静态资源一致 | `core`, `master`, `sandbox` MD5 100% 一致；`questions.db` 存在不同步 (2064 题 vs 2161 题) | 异常 | **【一般】** |
| **题目配图资源** | `dist/assets/questions/*.webp` | 数量达标（是否达 2126 张），无空文件 | 实际 **2,214 张** WebP（达标并超出），0 字节文件数 0，题库引用 2,021 张 100% 存在 | 100% | 【观察】 |
| **四包加载架构** | Design §2.3 规范符合性 | 启动仅载 core，其余惰性加载；路由准确 | `packages.ts` 映射 8 张核心表；`worker.ts` 启动仅预载 core；查询触发按需加载 | 100% | 通过 |
| **服务可用性** | Preview HTTP 200 | `http://127.0.0.1:4173/` 正常响应 | 根路径 HTTP 200 OK，静态资源 HTTP 200 OK | 100% | 通过 |
| **跨域安全隔离** | COOP / COEP 响应头 | 必需头，支撑 SQLite WASM 多线程/内存 | `Cross-Origin-Opener-Policy: same-origin`<br>`Cross-Origin-Embedder-Policy: require-corp` 严格输出 | 100% | 通过 |

---

## 2. 构建与测试全绿核验 (pnpm build & pnpm test)

### 2.1 `pnpm build` 详细输出与分析
- **执行命令**：`pnpm build`（对应脚本：`tsc --noEmit && vite build`）
- **退出码**：`0`
- **构建耗时**：`7.93s`
- **模块转换数量**：`127 modules transformed`
- **PWA ServiceWorker 预缓存**：`98 entries (13204.51 KiB)`
- **主要产物清单**：
  ```
  dist/registerSW.js                          0.13 kB
  dist/manifest.webmanifest                   0.34 kB
  dist/index.html                             2.36 kB │ gzip:   1.13 kB
  dist/assets/sqlite3-opfs-async-proxy-*.js    9.52 kB
  dist/assets/sqlite3-worker1-bundler-*.js   207.69 kB
  dist/assets/worker-DuWlXlue.js             212.65 kB
  dist/assets/sqlite3-BqX9F35q.wasm          939.20 kB
  dist/assets/index-2Sbz8PgK.css              31.29 kB │ gzip:   9.00 kB
  dist/assets/vendor-BwuCwbwC.js             144.50 kB │ gzip:  46.70 kB
  dist/assets/index-DCtXRAaO.js              617.42 kB │ gzip: 177.15 kB
  dist/assets/polyfills-legacy-eKYjd6cO.js    58.05 kB │ gzip:  22.29 kB
  dist/assets/vendor-legacy-DeJgPuIw.js      143.21 kB │ gzip:  46.28 kB
  dist/assets/index-legacy-D6cLXRxl.js       649.17 kB │ gzip: 184.03 kB
  ```
- **构建告警说明**：
  - Vite 输出关于 chunk 体积超过 500 kB 的非阻塞警告（`index-DCtXRAaO.js` 617 kB，`index-legacy-D6cLXRxl.js` 649 kB），属于单页 SPA 包含 KaTeX/JSXGraph 等重型数学公式渲染与沙盒逻辑的正常特征，后续可通过动态路由拆分优化。

### 2.2 `pnpm test` 全量通过核验
- **执行命令**：`pnpm test`（对应脚本：`vitest run`）
- **退出码**：`0`
- **耗时**：`4.37s`
- **测试套件总数**：**34 passed (34 total)**
- **测试用例总数**：**175 passed (175 total)**
- **测试用例分类分布**：
  1. **属性基测试 (Property-based tests, fast-check)**:
     - `src/engine/judge/judge.property.test.ts` (7 用例)
     - `src/modules/concept/quickPractice.property.test.ts` (6 用例)
     - `src/modules/graph/combination.property.test.ts` (4 用例)
     - `src/components/math/MathRenderer.property.test.ts` (4 用例)
     - `src/__tests__/svgNoForeignObject.property.test.ts` (4 用例)
     - `src/modules/exam/drawQuestions.property.test.ts` (3 用例)
     - `src/engine/device/detectDeviceProfile.property.test.ts` (3 用例)
     - `src/engine/judge/calculateSolutionScore.property.test.ts` (2 用例)
     - `src/engine/i18n/projectLocale.property.test.ts` (2 用例)
     - `src/modules/exam/verifyPaperInventory.property.test.ts` (2 用例)
     - `scripts/build/etl/adaptQuestion.property.test.ts` (2 用例)
  2. **安全与隔离测试 (Security & Zero Persistence)**:
     - `src/engine/judge/parser.security.test.ts` (4 用例)
     - `src/__tests__/zeroPersistence.test.ts` (3 用例)
     - `src/__tests__/noEmoji.test.ts` (1 用例)
  3. **架构与分包契约测试 (DB Packages & Smoke)**:
     - `src/engine/db/__tests__/packages.test.ts` (4 用例)
     - `src/__tests__/smoke.integration.test.ts` (3 用例)
     - `scripts/build/db/__tests__/mockSeed.test.ts` (8 用例)
  4. **组件与交互测试 (React Components & Modules)**:
     - `src/modules/sandbox/__tests__/invariants.test.ts` (19 用例)
     - `src/modules/exam/__tests__/SolutionList.test.tsx` (12 用例)
     - `src/components/common/__tests__/QuestionContent.test.tsx` (10 用例)
     - `src/components/common/__tests__/SourceTag.test.tsx` (8 用例)
     - `src/modules/exam/__tests__/OnlineExam.test.tsx` (8 用例)
     - `src/store/__tests__/sessionStore.test.ts` (7 用例)
     - `src/modules/sandbox/__tests__/morphControllers.test.tsx` (6 用例)
     - `src/modules/concept/__tests__/ConceptFourStages.test.tsx` (5 用例)
     - `src/modules/exam/__tests__/PaperWorkbench.test.tsx` (5 用例)
     - `src/modules/graph/__tests__/SubwayMap.test.tsx` (5 用例)
     - `src/modules/graph/__tests__/LineClosedLoop.test.tsx` (5 用例)
     - `src/engine/i18n/__tests__/i18n.test.ts` (4 用例)
     - `src/modules/concept/__tests__/QuickPractice.test.tsx` (4 用例)
     - `src/components/shell/__tests__/shell.test.tsx` (3 用例)
     - `src/modules/concept/__tests__/PointMasterExample.test.tsx` (3 用例)
     - `src/modules/concept/__tests__/LinkedSandboxSlot.test.tsx` (3 用例)
     - `src/__tests__/productShell.test.tsx` (6 用例)

---

## 3. 静态资源分发与产物完整性核对 (dist/)

### 3.1 `dist/index.html`
- **文件存在性**：存在
- **物理大小**：2,419 字节
- **关键结构校验**：
  - 字符集与视口：`<meta charset="UTF-8" />`、`<meta name="viewport" ... user-scalable=no, viewport-fit=cover" />`
  - 主题与描述：`<meta name="theme-color" content="#0f172a" />`、`<title>全科核心素养提分系统 V2.0 - 初中数学</title>`
  - 依赖库加载：包含 CDN 引入之 `jsxgraphcore.js` 与 `jsxgraph.css`
  - 现代与降级双构架：模块化 `<script type="module" src="/assets/index-DCtXRAaO.js">` 与 `<script nomodule ... index-legacy-D6cLXRxl.js>`
  - PWA 支持：`<link rel="manifest" href="/manifest.webmanifest">`、`<script id="vite-plugin-pwa:register-sw" src="/registerSW.js"></script>`

### 3.2 `dist/data/` 数据库四包完整性与数据规格

对 `dist/data/*.db` 全部文件执行 `PRAGMA integrity_check;` 及表结构行数扫描：

| 数据库文件名 | 物理大小 (Bytes) | 物理大小 (格式化) | PRAGMA integrity_check | 包含数据表清单 | 表内实际行数 | 契约对齐状态 |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: |
| **`core.db`** | 1,003,520 | 980 KiB | **ok** | `knowledge_points`<br>`logic_lines`<br>`knowledge_combinations`<br>`knowledge_graph_semesters` | 107 行<br>12 行<br>2,204 行<br>107 行 | 完全对齐 |
| **`master.db`** | 311,296 | 304 KiB | **ok** | `master_examples` | 119 行 (107考点+12主线) | 完全对齐 |
| **`sandbox.db`** | 98,304 | 96 KiB | **ok** | `concept_sandboxes`<br>`leap_sandbox_models` | 46 行<br>36 行 | 完全对齐 |
| **`questions.db`** | 3,723,264 | 3.55 MiB | **ok** | `questions` | 2,161 行 | 见下文同步差异分析 |

#### ⚠️ 关键核查发现：`data/` 与 `public/` 同步状态差异
对项目各层目录的 4 个 SQLite 数据库进行 MD5 哈希横向比对：
```
MD5 (data/core.db)            = 52ff1bda9d58fd0f3476d8c3caec5544
MD5 (public/data/core.db)     = 52ff1bda9d58fd0f3476d8c3caec5544
MD5 (dist/data/core.db)       = 52ff1bda9d58fd0f3476d8c3caec5544 [一致]

MD5 (data/master.db)          = 82e10c1aee009cdbdcd7bf64d9c9a6d6
MD5 (public/data/master.db)   = 82e10c1aee009cdbdcd7bf64d9c9a6d6
MD5 (dist/data/master.db)     = 82e10c1aee009cdbdcd7bf64d9c9a6d6 [一致]

MD5 (data/sandbox.db)         = b3dcdc7f0b9ddaf0c95a6e33ff61fa14
MD5 (public/data/sandbox.db)  = b3dcdc7f0b9ddaf0c95a6e33ff61fa14
MD5 (dist/data/sandbox.db)    = b3dcdc7f0b9ddaf0c95a6e33ff61fa14 [一致]

MD5 (data/questions.db)       = 08efb89269a3fe5294767ed5b016bbdd (2,064 题，6.04 MiB)
MD5 (public/data/questions.db)= 6ef88fde2269163146cf57f3c4156a0a (2,161 题，3.55 MiB)
MD5 (dist/data/questions.db)  = 6ef88fde2269163146cf57f3c4156a0a (2,161 题，3.55 MiB) [不一致!]
```
- **分析**：
  `data/questions.db` 经过 TASK-FE-0003 数据清洗与 backfill（已剔除 97 道奥数题与非标题，题目数为 2,064 题，正如 `tmp/verify/partG.md` 所核验）。
  然而，`public/data/questions.db` 保留的是清洗前的历史快照（2,161 题）。
  由于 Vite 的打包机制是将 `public/` 静态目录内容直接拷贝到 `dist/`，且 `vite.config.ts` 中仅配置了 `syncQuestionAssetsPlugin`（同步图片），未配置数据库同步逻辑，导致 `dist/data/questions.db` 包含的是旧版 2,161 题，未包含最新的清洗与回填结果。
- **评级**：**【一般】**（构建与启动本身不崩，但线上/dist运行态使用的是旧数据包，建议后续加入 `syncDatabasePlugin` 或构建前拷贝脚本）。

### 3.3 `dist/assets/questions/` WebP 题图完整性核查
- **题目达标数量要求**：是否达 2,126 张
- **核查统计**：
  - `dist/assets/questions/*.webp` 文件总数：**2,214 张**（**达到并超出** 2,126 张指标，超额 88 张）
  - 空文件（0 字节）检测：**0 个**
  - 非 WebP 文件检测：**0 个**
  - `public/assets/questions/` 与 `dist/assets/questions/` 差异数：**0 个**（100% 对齐）
- **题库真实图片引用交叉比对**：
  - 引用图片的试题数：1,224 题
  - 试题引用的图片总数：2,021 张
  - 试题引用的唯一图片数：2,021 张
  - `dist/assets/questions/` 中丢失文件数：**0 张**（缺失率 0.00%，全部命中）

---

## 4. 四包 DB 加载架构与按需机制核验 (packages.ts / dbClient.ts)

对应设计文档 **§2.3 数据库分包按需加载** 与 **§4.2 扁平表结构 DDL**。

### 4.1 代码实现审计
查看 [`src/engine/db/packages.ts`](file:///Users/annette/aidev/全科核心素养提分系统V2.0/src/engine/db/packages.ts)、[`src/engine/db/dbClient.ts`](file:///Users/annette/aidev/全科核心素养提分系统V2.0/src/engine/db/dbClient.ts) 与 [`src/engine/db/worker.ts`](file:///Users/annette/aidev/全科核心素养提分系统V2.0/src/engine/db/worker.ts)：

1. **分包枚举与路径契约 (`packages.ts:L6-15`)**：
   - 明确定义 `DbPackage = 'core' | 'master' | 'sandbox' | 'questions'`。
   - `DB_PACKAGE_PATHS` 严格映射到 `/data/core.db`、`/data/master.db`、`/data/sandbox.db`、`/data/questions.db`。
2. **8 张核心表与分包严格路由 (`packages.ts:L20-37`)**：
   - `knowledge_points` $\to$ `'core'`
   - `logic_lines` $\to$ `'core'`
   - `knowledge_combinations` $\to$ `'core'`
   - `knowledge_graph_semesters` $\to$ `'core'`
   - `master_examples` $\to$ `'master'`
   - `concept_sandboxes` $\to$ `'sandbox'`
   - `leap_sandbox_models` $\to$ `'sandbox'`
   - `questions` $\to$ `'questions'`
   - `getPackageForTable` 对未知表名直接抛出异常，防止非法访问。
3. **启动期仅预载 core.db (`worker.ts:L74-80`, `dbClient.ts:L59-73`)**：
   - `worker.ts` 的 `init()` 方法中明确仅调用 `await loadDbPackage('core')`。
   - `master`、`sandbox`、`questions` 在系统初次启动加载时不产生网络 Fetch 与 WASM 内存分配。
4. **透明惰性加载机制 (`worker.ts:L85-93`, `dbClient.ts:L105-118`)**：
   - 客户端调用 `query(pkg, sql, params)` 或 `queryTable(tableName, sql, params)` 时，Worker 的 `executeQuery` 拦截判断：
     ```ts
     if (!loadedPackages.has(pkg)) {
       await loadDbPackage(pkg);
     }
     ```
   - 首次访问母题、沙盒或真题库时，才会自动触发对应 `.db` 的网络拉取与 `sqlite3_deserialize`，完全符合 §2.3 的惰性按需设计。
5. **只读防注入机制 (`worker.ts:L59`, `dbClient.ts:L105-115`)**：
   - 采用 `SQLITE_DESERIALIZE_READONLY` 标旗挂载只读内存库，杜绝客户端修改风险。
   - 查询全量强制使用 `params: SqlParam[]` 严格占位符参数化绑定，杜绝 SQL 拼接。

### 4.2 架构核查结论
**完全符合设计规范**。代码结构清晰，Worker 线程通信与内存隔离完善，单元测试 `packages.test.ts` 4 个用例全部通过验证。

---

## 5. Preview 预览服务器可用性与安全头核验

### 5.1 服务响应状态与 HTTP 标头
在本地启动 `pnpm preview --port 4173 --host 127.0.0.1`，使用 `curl -i` 对首页及关键静态资源进行连通性与响应头核验：

#### 1) 首页根路径 `http://127.0.0.1:4173/`
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: text/html
Cache-Control: no-cache
Etag: W/"973-LXwr9x7Z87s36dHPx2qFFNHJ4/E"
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Date: Fri, 18 Sep 2026 12:32:40 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 2419
```
- **状态码**：`HTTP 200 OK`
- **关键安全头**：
  - `Cross-Origin-Opener-Policy: same-origin`（**存在且正确**）
  - `Cross-Origin-Embedder-Policy: require-corp`（**存在且正确**）

#### 2) 核心数据库资源 `http://127.0.0.1:4173/data/core.db`
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Content-Length: 1003520
Content-Type: 
Last-Modified: Fri, 18 Sep 2026 12:29:03 GMT
Cache-Control: no-cache
```
- **状态码**：`HTTP 200 OK`
- **安全头**：COOP 与 COEP 继承有效，可供 Web Worker 通过 `fetch('/data/core.db')` 正常加载。

#### 3) 题目 WebP 图片资源 `http://127.0.0.1:4173/assets/questions/Q-2024-514202-0002_stem0.webp`
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Content-Length: 4286
Content-Type: image/webp
Last-Modified: Fri, 18 Sep 2026 12:29:02 GMT
Cache-Control: no-cache
```
- **状态码**：`HTTP 200 OK`
- **MIME 类型**：`image/webp` 正常识别。

---

## 6. 缺陷与风险分级清单

依据红线规定，将验证发现的问题如实记录，并按照【阻塞】/【一般】/【观察】进行分级：

### 【阻塞】（0 项）
- **无**。工程可成功编译，测试全绿，静态产物完整，预览服务响应正常且包含 COOP/COEP 头。

---

### 【一般】（1 项）

#### DEF-A-01: `public/data/questions.db` 与 `data/questions.db` 数据版本不同步
- **现象描述**：
  根目录 `data/questions.db` 在 TASK-FE-0003 经过清洗与回填后，有效题目为 2,064 题（文件大小 6.04 MiB，MD5: `08efb89269a3fe5294767ed5b016bbdd`）；
  但 `public/data/questions.db` 未被更新，仍停留在历史版本（2,161 题，文件大小 3.55 MiB，MD5: `6ef88fde2269163146cf57f3c4156a0a`）。
  `pnpm build` 执行时 Vite 仅把 `public/` 拷贝至 `dist/`，导致构建输出产物 `dist/data/questions.db` 包含的是未剔除奥数等非标题的旧版题库。
- **根因分析**：
  构建工程配置中，`vite.config.ts` 仅编写了针对 `assets/questions` 的拷贝插件 `syncQuestionAssetsPlugin`，没有针对 `data/*.db` 到 `public/data/*.db` 的自动同步插件；且 `package.json` 的 `build` 脚本未包含 `cp data/*.db public/data/` 步骤。
- **影响范围**：
  生产环境或 Preview 环境运行题库与组卷时，前端请求 `/data/questions.db` 载入的不是经过最新清洗和对齐的 2,064 题，而是旧版 2,161 题。
- **修复建议**（本任务遵照红线要求不修改代码）：
  在 `vite.config.ts` 的 `buildStart` 钩子中增加 `syncDatabasesPlugin`，或在 `package.json` 的 `build` 脚本前置 `pnpm prebuild:sync-db`，确保打包前执行 `cp data/*.db public/data/`。

---

### 【观察】（2 项）

#### OBS-A-01: WebP 题图总数 (2,214 张) 超出基准指标 (2,126 张)
- **现象描述**：
  验证指令要求检查 WebP 图片数量“是否达 2126 张”。实际清点 `dist/assets/questions/` 包含 2,214 张 WebP 图片（超出 88 张）。
- **核查结论**：
  超出的 88 张图片为历史题包解压留存图片或多解法示意图。题库中实际引用的 2,021 张图片在 `dist` 与 `public` 中 100% 存在，丢失率为 0；所有 2,214 张图片均非空（0 字节文件数为 0），不影响系统正常使用。

#### OBS-A-02: Vite 生产构建输出 Chunk 体积超过 500 kB 提示
- **现象描述**：
  `pnpm build` 结束时出现 `(!) Some chunks are larger than 500 kB after minification` 提示：
  `dist/assets/index-DCtXRAaO.js` (617.42 kB) 与 `dist/assets/index-legacy-D6cLXRxl.js` (649.17 kB)。
- **核查结论**：
  属于前端富交互教育系统整合 JSXGraph、KaTeX 与状态机之后的常规打包体积，Gzip 后体积约为 177 kB，网络加载压力可控。后续可通过路由懒加载（dynamic `import()`) 进一步切分。

---

## 7. 签字结论

- **章节核验结论**：**通过 (PASS)**
- **系统就绪度**：具备本地与预览运行能力，构建无阻断缺陷，测试 175 项全通。建议在后续阶段部署前，完成 `data/questions.db` 到 `public/data/` 的同步。
