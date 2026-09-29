const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8799;
const CDP_PORT = 9699;
const DIST_DIR = path.resolve(__dirname, '../dist');
const OUT_DIR = path.resolve(__dirname, '../public/docs_assets');
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_manual_${Date.now()}`);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

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
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
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
    return res.result?.value;
  }

  async setViewport(width, height, isMobile = false, deviceScaleFactor = 2) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile,
    });
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`[Screenshot Saved] -> ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }
}

async function getWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const json = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json`, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (json && json.length > 0 && json[0].webSocketDebuggerUrl) {
        return json[0].webSocketDebuggerUrl;
      }
    } catch (e) {
      await sleep(250);
    }
  }
  throw new Error('Failed to obtain Chrome webSocketDebuggerUrl');
}

async function main() {
  const server = await startStaticServer();

  console.log('[Chrome] Launching headless browser...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-default-browser-check',
    '--no-first-run',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,900',
    `http://127.0.0.1:${HTTP_PORT}`,
  ]);

  try {
    const wsUrl = await getWsUrl(CDP_PORT);
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[Page] Waiting for page initialization & SQLite WASM load...');
    await sleep(3500);

    // 1. Desktop - 首页与全局概览
    console.log('[Capture 1] Desktop Home View (1440x900)...');
    await cdp.setViewport(1440, 900, false, 2);
    await sleep(1500);
    await cdp.screenshot(path.join(OUT_DIR, '01_desktop_home.png'));

    // 2. Desktop - 模块一：知识谱系导航 (GraphNav)
    console.log('[Capture 2] Desktop Knowledge Graph & Subway...');
    await cdp.eval(`
      const navBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('知识图谱') || b.textContent.includes('谱系脉络')));
      if (navBtn) navBtn.click();
    `);
    await sleep(2000);
    await cdp.screenshot(path.join(OUT_DIR, '02_desktop_graph.png'));

    // 3. Desktop - 模块二：考点具象与概念动力沙盒 (ConceptNav)
    console.log('[Capture 3] Desktop Concept Sandbox (Four Stages & Live HUD)...');
    await cdp.eval(`
      const conceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('考点精讲') || b.textContent.includes('具象沙盒')));
      if (conceptBtn) conceptBtn.click();
    `);
    await sleep(2500);
    await cdp.screenshot(path.join(OUT_DIR, '03_desktop_concept_sandbox.png'));

    // 4. Desktop - 模块三：4D 跃迁变异实验室 (LeapLab) - 分步推演
    console.log('[Capture 4] Desktop 4D Leap Lab (Step Deduction)...');
    await cdp.eval(`
      const leapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('思维跃迁') || b.textContent.includes('4D变异') || b.textContent.includes('变异实验室')));
      if (leapBtn) leapBtn.click();
    `);
    await sleep(2500);
    await cdp.screenshot(path.join(OUT_DIR, '04_desktop_leap_deduction.png'));

    // 5. Desktop - 模块三：4D 变异自由探索 (Free Explore & X-Ray)
    console.log('[Capture 5] Desktop 4D Leap Lab (Free Explore & X-Ray)...');
    await cdp.eval(`
      const freeTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('自由探索') || b.textContent.includes('Free Play')));
      if (freeTab) freeTab.click();
    `);
    await sleep(2000);
    await cdp.screenshot(path.join(OUT_DIR, '05_desktop_leap_free.png'));

    // 6. Desktop - 模块四：试题演练与智能测评 (OnlineExam)
    console.log('[Capture 6] Desktop Exam & Solution Workbench...');
    await cdp.eval(`
      const examBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('试题演练') || b.textContent.includes('题库') || b.textContent.includes('智能自测')));
      if (examBtn) examBtn.click();
    `);
    await sleep(2500);
    await cdp.screenshot(path.join(OUT_DIR, '06_desktop_exam.png'));

    // 7. Tablet / iPad 横屏视图 (1080x810, iPad 10.2")
    console.log('[Capture 7] Tablet / iPad Landscape View (1080x810)...');
    await cdp.setViewport(1080, 810, true, 2);
    // 切换到 4D 实验室
    await cdp.eval(`
      const leapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('思维跃迁') || b.textContent.includes('4D变异')));
      if (leapBtn) leapBtn.click();
    `);
    await sleep(2000);
    await cdp.screenshot(path.join(OUT_DIR, '07_tablet_landscape.png'));

    // 8. Mobile 手机竖屏视图 (390x844, iPhone 14/15)
    console.log('[Capture 8] Mobile Portrait View (390x844)...');
    await cdp.setViewport(390, 844, true, 3);
    // 切换回首页
    await cdp.eval(`
      const homeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('知识图谱') || b.textContent.includes('首页')));
      if (homeBtn) homeBtn.click();
    `);
    await sleep(1500);
    await cdp.screenshot(path.join(OUT_DIR, '08_mobile_home.png'));

    // 9. Mobile 概念沙盒与滑动抽屉
    console.log('[Capture 9] Mobile Concept Sandbox View (390x844)...');
    await cdp.eval(`
      const conceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('考点精讲') || b.textContent.includes('具象沙盒')));
      if (conceptBtn) conceptBtn.click();
    `);
    await sleep(2000);
    await cdp.screenshot(path.join(OUT_DIR, '09_mobile_concept.png'));

    // 10. Mobile 4D 跃迁变异触控卡片
    console.log('[Capture 10] Mobile 4D Leap Lab View (390x844)...');
    await cdp.eval(`
      const leapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('思维跃迁') || b.textContent.includes('4D变异')));
      if (leapBtn) leapBtn.click();
    `);
    await sleep(2000);
    await cdp.screenshot(path.join(OUT_DIR, '10_mobile_leap.png'));

    console.log('[Success] All 10 screenshots captured successfully!');
  } finally {
    try {
      chromeProc.kill('SIGKILL');
      server.close();
      if (fs.existsSync(USER_DATA_DIR)) {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      }
    } catch (e) {}
  }
}

main().catch((err) => {
  console.error('[Error in capture script]:', err);
  process.exit(1);
});
