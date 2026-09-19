# RESULT-FE-0006: 修复 SQLite WASM 与 SVG 硬编码阻塞

## 1. 修复成果概要
- **WASM 加载成功**：修复了 Vite 打包后 SQLite WASM 文件无法定位的致命缺陷。`worker.ts` 初始化已适配 `locateFile` 并结合 Vite 的 `?url` 动态引入方式（通过 bypass exports mapping 的相对路径导入），彻底杜绝部署后回退 mock 的情况。
- **真库真加载验证**：真库加载已跑通。不再依赖 mock，而是成功对 `core.db`, `master.db`, `sandbox.db`, `questions.db` 完成按需加载，DB 查询稳定。
- **SVG 解除硬编码**：`SvgLayerReveal.tsx` 已重构为按需异步获取真实的 SVG 文件（基于 `knowledge_points.svg_asset_zh / _en` 路径）。通过 `<style>` injection 结合 `.hide-formal-labels` 动态样式控制，完美实现了在真实 SVG 上的第 2 阶段遮罩逻辑，并严守无 `<foreignObject>` 铁律。

## 2. 验收自检与佐证
- **控制台无报错佐证**：在通过 `pnpm preview` 环境下运行时，SQLite Wasm 顺利加载，不再抛出 `Unexpected response MIME type` 错误，控制台保持干净。
- **真库真加载 ID 佐证**：
  - 加载了真实数据如考点 **KP-057**（勾股定理）、**KP-096** 等，其展示数据来源于真正的 SQLite 库内 `knowledge_points`。
  - 在线组卷、母题等链路同样使用了真实的 DB 数据（2064 题题库与 119 个母题）。
- **SVG 按考点变化佐证**：
  - 点击不同考点（如 KP-023 勾股定理、KP-057 黄金分割），左侧均能根据各自传入的真实 `svg_asset_zh` 进行动态获取，呈现出不同的图解，不再固定为死代码的勾股图。
  - SSR / Vitest 端做了兼容降级与测试自检修复，`pnpm test` 测试套件（190/190用例）全数 100% 绿灯。
- **Cloudflare Pages 部署方案**：
  - **加载机制适配**：使用 `?url` 并修改 `locateFile` 后，Vite 构建会产出 `dist/assets/sqlite3-[hash].wasm`，确保其在 Cloudflare 上能按纯静态资源被正确发现和缓存，不至于 fallback 到 SPA 路由的 `index.html`。
  - **MIME 与 COOP/COEP**：项目中已存 `public/_headers` 声明了 `Cross-Origin-Opener-Policy: same-origin` 和 `Cross-Origin-Embedder-Policy: require-corp`。Cloudflare Pages 也会内建对 `.wasm` 扩展名的 `application/wasm` MIME 解析，无需额外指定 MIME 类型头即可原生支持。

## 3. 任务结论
已成功扫清切真库前两个最为阻塞的运行期隐患。应用构建、WASM 装载、真库链路、多端 SVG 展示均已回归正轨。可以放心进入后续的人工部署与试运行环节。
