const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const CHROME_PATH = '/Users/m1/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const HTTP_PORT = 8765;
const CDP_PORT = 9599;
const DIST_DIR = path.resolve(__dirname, '../dist');
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_fe14_${Date.now()}`);
const OUT_DIR = path.resolve(__dirname, '../public/screenshots');
const ARTIFACT_DIR = path.resolve(__dirname, `../tmp/fe0014_screenshots`);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(DIST_DIR, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      } catch (err) {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(HTTP_PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] Listening on http://127.0.0.1:${HTTP_PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleErrors = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => {
        console.log(`[CDP] Connected to ${this.wsUrl}`);
        resolve();
      };
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Runtime.consoleAPICalled') {
            if (msg.params.type === 'error') {
              const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
              console.error(`[Browser Console Error]:`, text);
              this.consoleErrors.push(text);
            }
          }
          if (msg.id && this.callbacks.has(msg.id)) {
            const { resolve, reject, timer } = this.callbacks.get(msg.id);
            clearTimeout(timer);
            this.callbacks.delete(msg.id);
            if (msg.error) reject(new Error(JSON.stringify(msg.error)));
            else resolve(msg.result);
          }
        } catch (e) {
          console.error('[CDP] Message parse error:', e);
        }
      };
    });
  }

  send(method, params = {}, timeoutMs = 25000) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`[CDP Timeout] Method ${method} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.callbacks.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(funcStr) {
    const expression = `(() => {
      try {
        ${funcStr}
      } catch (err) {
        return { __error: err.message, __stack: err.stack };
      }
    })()`;
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res && res.result && res.result.value && res.result.value.__error) {
      console.warn(`[Eval Warning]:`, res.result.value.__error);
    }
    return res.result ? res.result.value : null;
  }

  async captureScreenshot(filename) {
    console.log(`[Capture] Taking screenshot for ${filename}...`);
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, buf);

    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artPath, buf);

    const hash = crypto.createHash('md5').update(buf).digest('hex');
    console.log(`[Captured] ${filename} -> size: ${buf.length} bytes, MD5: ${hash}`);
    return { filename, outPath, artPath, hash, size: buf.length };
  }
}

async function main() {
  const server = await startStaticServer();
  console.log('[Init] Launching Chrome headless with CDP...');
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1440,900',
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        const data = await resp.json();
        wsUrl = data.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch (e) {
        await sleep(250);
      }
    }
    if (!wsUrl) throw new Error('Chrome remote debugging did not respond');

    const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then((r) => r.json());
    let pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) {
      pageTarget = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${HTTP_PORT}/`)).json();
    }

    const page = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await page.connect();

    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('DOM.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log(`[Navigate] Loading app at http://127.0.0.1:${HTTP_PORT}/#/math-junior/sandbox ...`);
    await page.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/sandbox` });
    await sleep(4000);

    console.log('[Step 0] Activating 4D Leap Lab view...');
    await page.eval(`
      const segButtons = Array.from(document.querySelectorAll('button.seg-item'));
      const leapBtn = segButtons.find(b => b.textContent.includes('4D 跃迁模型') || b.textContent.includes('实验室二'));
      if (leapBtn) leapBtn.click();
      if (window.__setLabSubView) window.__setLabSubView('leap_4d');
    `);
    await sleep(2000);

    // 辅助切换模型函数
    const switchModel = async (targetId) => {
      console.log(`[Switch Model] Targeting ${targetId}...`);
      await page.eval(`
        if (window.__setLabSubView) {
          window.__setLabSubView('leap_4d');
        }
        if (window.__setSelectedLeapModelId) {
          window.__setSelectedLeapModelId('${targetId}');
        }
        const segButtons = Array.from(document.querySelectorAll('button.seg-item'));
        const leapBtn = segButtons.find(b => b.textContent.includes('4D 跃迁模型') || b.textContent.includes('实验室二'));
        if (leapBtn && !leapBtn.classList.contains('active')) leapBtn.click();
        const backdrop = document.querySelector('.drawer-backdrop');
        if (backdrop) backdrop.click();
      `);

      for (let i = 0; i < 20; i++) {
        const text = await page.eval(`return document.querySelector('.model-drawer-trigger-btn')?.textContent || '';`);
        if (text && text.includes('${targetId}')) break;
        await sleep(200);
      }
      await sleep(1500);
    };

    // 辅助设置滑块值函数 (适配 React 内部受控输入)
    const setSlider = async (sliderSelector, val) => {
      console.log(`[Set Slider] Setting ${sliderSelector} to ${val}...`);
      await page.eval(`
        const slider = document.querySelector('${sliderSelector}') || document.getElementById('${sliderSelector.replace('#', '')}');
        if (slider) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(slider, '${val}');
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `);
      await sleep(1000);
    };

    const evidenceList = [];

    // ==========================================
    // 标杆 1 & 2: LM-9A-18 韦达定理 (Δ > 0 两交点 vs Δ < 0 无交点隐藏)
    // ==========================================
    console.log('\n--- 1. LM-9A-18 (Vieta Benchmark: Delta > 0) ---');
    await switchModel('LM-9A-18');
    const info1 = await page.eval(`
      return {
        telemetry: Array.from(document.querySelectorAll('.telemetry-tag-invariant')).map(t => t.textContent.trim()),
        hasParabola: !!document.querySelector('.canvas-functiongraph'),
        hasRoots: !!document.querySelector('.canvas-point-root_x1')
      };
    `);
    console.log('[Step 1] State:', info1);
    const vietaPos = await page.captureScreenshot('fe0014_vieta_delta_pos.png');
    evidenceList.push(vietaPos);

    console.log('\n--- 2. LM-9A-18 (Vieta Benchmark: Delta < 0 condition hidden) ---');
    await setSlider('#slider-param_c', '2.0');
    const info2 = await page.eval(`
      return {
        sliderCVal: document.getElementById('slider-param_c')?.value,
        telemetry: Array.from(document.querySelectorAll('.telemetry-tag-invariant')).map(t => t.textContent.trim())
      };
    `);
    console.log('[Step 2] State:', info2);
    const vietaNeg = await page.captureScreenshot('fe0014_vieta_delta_neg.png');
    evidenceList.push(vietaNeg);

    // ==========================================
    // 标杆 3 & 4: LM-9B-35 三视图正交投影与空间积木 (初始 7 块 vs 修改高度 9 块)
    // ==========================================
    console.log('\n--- 3. LM-9B-35 (Three-View Orthographic Projection Initial 7 Blocks) ---');
    await switchModel('LM-9B-35');
    const info3 = await page.eval(`
      return {
        hasOrtho: !!document.querySelector('.discrete-orthographic-renderer'),
        telemetry: Array.from(document.querySelectorAll('.telemetry-tag-invariant')).map(t => t.textContent.trim())
      };
    `);
    console.log('[Step 3] State:', info3);
    const threeViewInit = await page.captureScreenshot('fe0014_three_view_initial.png');
    evidenceList.push(threeViewInit);

    console.log('\n--- 4. LM-9B-35 (Three-View Modified Height h11=3 -> 9 Blocks) ---');
    await setSlider('#slider-slider_h11', '3');
    const info4 = await page.eval(`
      return {
        h11Val: document.getElementById('slider-slider_h11')?.value,
        telemetry: Array.from(document.querySelectorAll('.telemetry-tag-invariant')).map(t => t.textContent.trim())
      };
    `);
    console.log('[Step 4] State:', info4);
    const threeViewMod = await page.captureScreenshot('fe0014_three_view_modified.png');
    evidenceList.push(threeViewMod);

    // ==========================================
    // 标杆 5 & 6: LM-9B-34 反比例函数双曲线面积不变性
    // ==========================================
    console.log('\n--- 5. LM-9B-34 (Inverse Proportional Function Initial) ---');
    await switchModel('LM-9B-34');
    const info5 = await page.eval(`
      return {
        telemetry: Array.from(document.querySelectorAll('.telemetry-tag-invariant')).map(t => t.textContent.trim())
      };
    `);
    console.log('[Step 5] State:', info5);
    const inverseInit = await page.captureScreenshot('fe0014_inverse_k_initial.png');
    evidenceList.push(inverseInit);

    console.log('\n--- 6. LM-9B-34 (Inverse Function Adjusted Param Slider) ---');
    await setSlider('input.apple-slider', '8.0');
    const inverseMod = await page.captureScreenshot('fe0014_inverse_k_modified.png');
    evidenceList.push(inverseMod);

    // ==========================================
    // 标杆 7 & 8: LM-9A-24 切线长定理与真圆图元
    // ==========================================
    console.log('\n--- 7. LM-9A-24 (Circle Tangent Length Theorem Initial) ---');
    await switchModel('LM-9A-24');
    const info7 = await page.eval(`
      return {
        telemetry: Array.from(document.querySelectorAll('.telemetry-tag-invariant')).map(t => t.textContent.trim())
      };
    `);
    console.log('[Step 7] State:', info7);
    const circleInit = await page.captureScreenshot('fe0014_circle_tangent_initial.png');
    evidenceList.push(circleInit);

    console.log('\n--- 8. LM-9A-24 (Circle Tangent Length Theorem Adjusted) ---');
    await setSlider('input.apple-slider', '8.0');
    const circleMod = await page.captureScreenshot('fe0014_circle_tangent_modified.png');
    evidenceList.push(circleMod);

    // ==========================================
    // 标杆 9: LM-9B-29 一线三等角双三角形拓扑分离
    // ==========================================
    console.log('\n--- 9. LM-9B-29 (Dual Triangles Topology Separation) ---');
    await switchModel('LM-9B-29');
    const dualTri = await page.captureScreenshot('fe0014_dual_triangles_similarity.png');
    evidenceList.push(dualTri);

    // ==========================================
    // 标杆 10: LM-8B-14 中点四边形向量闭环
    // ==========================================
    console.log('\n--- 10. LM-8B-14 (Midpoint Quadrilateral Vector Closed Loop) ---');
    await switchModel('LM-8B-14');
    const midQuad = await page.captureScreenshot('fe0014_midpoint_quadrilateral.png');
    evidenceList.push(midQuad);

    console.log('\n==========================================');
    console.log('       FE-0014 真实截图哈希独立性核验       ');
    console.log('==========================================');
    const md5Set = new Set();
    let collisionCount = 0;

    evidenceList.forEach((item, idx) => {
      console.log(`[#${idx + 1}] ${item.filename} | Size: ${item.size} bytes | MD5: ${item.hash}`);
      if (md5Set.has(item.hash)) {
        console.error(`  [COLLISION ERROR] Duplicate MD5 detected: ${item.hash}`);
        collisionCount++;
      }
      md5Set.add(item.hash);
    });

    console.log(`\n总截图数: ${evidenceList.length}`);
    console.log(`独立哈希数: ${md5Set.size}`);
    console.log(`哈希碰撞数: ${collisionCount}`);

    if (page.consoleErrors.length > 0) {
      console.warn(`[WARNING] Browser reported ${page.consoleErrors.length} console errors during test:`);
      page.consoleErrors.forEach((e) => console.warn(`  - ${e}`));
    } else {
      console.log(`[Console Check] 0 Console Errors. 全程控制台干净！`);
    }

    if (collisionCount === 0 && evidenceList.length >= 10) {
      console.log('\n[PASS] 所有 10 张截图真实产生，MD5 互不相同，零复制充数，100% 达成验收红线！');
    } else {
      console.error('\n[FAIL] 截图数量不足或存在 MD5 碰撞！');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('[Error] Exception during execution:', err);
    process.exitCode = 1;
  } finally {
    try {
      chrome.kill('SIGKILL');
    } catch (e) {}
    try {
      server.close();
    } catch (e) {}
  }
}

main();
