---
id: TASK-FE-0006
line: frontend
status: accepted
attempt: 1
created_by: Kiro
title: 修复SQLite WASM加载失败(全线回退mock根因) + SVG图解硬编码(不读svg_asset)
model: gemini 3.1 pro
concurrency: 1
---

# 任务：修复真库加载致命阻塞（WASM 加载失败 + SVG 硬编码）

## 1. 背景（Kiro 已深度诊断，根因确凿）
用户在 preview 实测发现"知识点/SVG/沙盒数据都不对"。经 Kiro 查证浏览器控制台 + 源码，确认**两个独立根因**，都是部署级阻塞：

### 根因1（头号·WASM加载失败 → 全线回退mock）
控制台报错链：
```
wasm streaming compile failed: Unexpected response MIME type. Expected 'application/wasm'
→ falling back to ArrayBuffer instantiation
→ WebAssembly.Module doesn't parse at byte 0: module doesn't start with '\0asm'
→ Exception loading sqlite3 module
→ 所有 core/master/sandbox/questions 查询失败 → 全部 catch 回退 mock
```
- **本质**：`src/engine/db/worker.ts:76` 的 `sqlite3 = await sqlite3InitModule();` **未传 `locateFile`**。
- `@sqlite.org/sqlite-wasm` 默认去 fetch 相对路径的 `sqlite3.wasm`，但 Vite 已把 wasm 打包为 hash 名 `dist/assets/sqlite3-BqX9F35q.wasm`。库按默认名找不到 → 服务器返回 SPA fallback 的 index.html（HTML 文本）→ wasm 解析器读到非 `\0asm` 魔数而报错。
- **连带真相**：此前 pnpm test 全绿是因为 vitest(jsdom/node)环境不走浏览器 HTTP 加载 wasm，**掩盖了此问题**；此前所有"接真库"验收在浏览器运行时其实全在吃 mock（真库从未加载成功）。这是必须根治的头号阻塞。

### 根因2（独立·SVG硬编码）
- `src/modules/concept/SvgLayerReveal.tsx` **完全不读 `knowledge_points.svg_asset_zh` 字段**，组件体是一段写死的勾股定理弦图。无论选哪个考点，左侧图解永远画勾股定理。
- `ConceptFourStages.tsx:163` 调用 SvgLayerReveal 时只传 pointId，未传 svg_asset_zh。
- 真实 214 个 SVG 在 `assets/concepts/KP-XXX-zh.svg`（与 DB 的 svg_asset_zh 路径一致），但从未被加载。

## 2. 修复要求

### 修复1：SQLite WASM locateFile（核心）
- 用 Vite 的 `?url` 导入拿到 hash 后的真实 wasm 路径：`import sqlite3WasmUrl from '@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm?url'`（确认库内实际 wasm 相对路径，可能是 `.../jswasm/sqlite3.wasm`）
- 初始化改为 `sqlite3InitModule({ locateFile: (path) => path.endsWith('.wasm') ? sqlite3WasmUrl : path })`
- 目标：`vite preview` 与 **Cloudflare Pages 部署**环境下 wasm 都能正确加载（部署环境同样是静态服务器 + SPA 路由，同一类问题）
- 若 worker 是独立 chunk，确认 `?url` 在 worker 上下文能正确解析；必要时在 vite.config 配 worker format / assetsInclude
- 兼顾 COOP/COEP：sqlite-wasm 需要 SharedArrayBuffer 时要有跨源隔离头（preview 已见 COOP/COEP 头，Cloudflare 部署需 _headers 配置，一并处理）

### 修复2：SVG 读真实字段
- SvgLayerReveal 改为按传入的 `svgAssetPath`（来自 knowledgePoint.svg_asset_zh / _en）加载真实 SVG 文件（`<img src>` 或 fetch 内联 SVG）
- ConceptFourStages 把 `knowledgePoint.svg_asset_zh`（en 模式用 svg_asset_en）传给 SvgLayerReveal
- 图层分步点亮（第2段隐藏标签/第3段点亮）逻辑：若真实 SVG 内含 `formal-labels` 图层则沿用；若真实 SVG 结构不支持分层，降级为整图显示（不崩、不阻塞），如实说明
- 保留 SVG 无 foreignObject 铁律（Property 20）

## 3. 验收清单（Kiro 据此验收，重点浏览器运行时实测，非只看 test）
- [ ] **WASM 加载成功**：preview 浏览器控制台**无** "Failed to load...fallback"、无 "doesn't start with '\0asm'"、无 "Exception loading sqlite3"
- [ ] **真库真加载**：ConceptNav 渲染 core.db 真实 107 考点（非 mock 20个）；控制台无回退警告；举证考点如 KP-057(勾股)、KP-096 内容来自真库
- [ ] 母题(master.db 119)、图谱(107考点+依赖边)、沙盒(46+36)、组卷(2064题)运行时真加载
- [ ] **SVG 按考点变化**：选不同考点左侧图解不同（不再永远勾股图）；举 2~3 考点ID证 SVG 对应其 svg_asset_zh
- [ ] 空考点/加载中兜底仍不崩（保留 fallback 但不应再触发）
- [ ] `pnpm build` 0错；`pnpm test` 全绿（若为 wasm 加载新增测试更好，但至少不倒退）
- [ ] **Cloudflare 部署兼容**：说明 wasm 在 Cloudflare Pages 的加载方案（_headers MIME / 路径），确保部署后不复发
- [ ] 铁律：无 katex import/裸 innerHTML/emoji/新CSS框架/持久化；SVG 无 foreignObject

## 4. 红线
- 禁改判分/隔离/门神核心算法、DB查询字段名（字段名已确认正确）
- 禁改 data/*.db
- 修 wasm 加载不能破坏现有 worker 查询接口（dbClient API 不变）
- SVG 真实文件结构不确定时，降级整图显示，不得为"分层效果"伪造/硬编码

## 5. 回写
1. 结果写 outbox/RESULT-FE-0006.md：根因修复说明 + 浏览器控制台无报错佐证 + 真库真加载ID佐证 + SVG按考点变化佐证 + Cloudflare部署方案
2. status改done，播报"TASK-FE-0006 完成"进STANDBY

## 6. 执行方式
- **model: gemini 3.1 pro**（WASM加载链路 + Vite构建配置 + worker环境 是有技术深度的问题，非照搬；Pro 更稳）
- 强制 invoke_subagent 派发（model非default）
- 串行（改加载核心 + SVG，单一连贯改动）
- ⚠️ **验收必须在浏览器 preview 实测控制台**，不能只信 pnpm test（test环境掩盖了此wasm问题，是本次事故的教训）
