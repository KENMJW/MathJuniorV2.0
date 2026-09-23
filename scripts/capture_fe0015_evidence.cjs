const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8768;
const CDP_PORT = 9608;
const DIST_DIR = path.resolve(__dirname, '../dist');
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_fe15_${Date.now()}`);
const OUT_DIR = path.resolve(__dirname, '../public/screenshots');
const DIST_OUT_DIR = path.resolve(__dirname, '../dist/screenshots');
const ARTIFACT_DIR = path.resolve(__dirname, `../tmp/fe0015_screenshots`);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(DIST_OUT_DIR)) fs.mkdirSync(DIST_OUT_DIR, { recursive: true });
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
      console.log(`[HTTP REQ] ${req.url} -> ${filePath} (exists: ${fs.existsSync(filePath)})`);

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
    this.consoleErrors = [];
    this.consoleLogs = [];
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
            const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
            this.consoleLogs.push({ type: msg.params.type, text });
            if (msg.params.type === 'error') {
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

    const distOutPath = path.join(DIST_OUT_DIR, filename);
    fs.writeFileSync(distOutPath, buf);

    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artPath, buf);

    const hash = crypto.createHash('md5').update(buf).digest('hex');
    console.log(`[Captured] ${filename} -> size: ${buf.length} bytes, MD5: ${hash}`);
    return { filename, outPath, hash, size: buf.length };
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
    '--disable-features=ServiceWorker',
    '--disable-service-worker',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1440,960',
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

    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register = () => Promise.reject(new Error('SW disabled in test'));
        }
      `,
    });

    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('DOM.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 960,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log(`[Navigate] Loading app at http://127.0.0.1:${HTTP_PORT}/#/math-junior/graph ...`);
    await page.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/graph` });

    let loaded = false;
    for (let i = 0; i < 50; i++) {
      const state = await page.eval(`
        return {
          hasBody: !!document.body,
          hasRoot: !!document.getElementById('root'),
          rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : 0,
          htmlSnippet: document.body ? document.body.innerHTML.slice(0, 200) : 'NO_BODY',
        };
      `);
      if (state && state.rootChildren > 0) {
        console.log(`[DOM Ready] after ${i * 250}ms, root children: ${state.rootChildren}`);
        loaded = true;
        break;
      }
      await sleep(250);
    }
    if (!loaded) console.warn('[DOM Ready Warning] root did not mount children within 12.5s');
    await sleep(1500);

    // 1. 确认当前处于模块二：思维图谱 (Graph)
    console.log('[Step 1] Ensuring Module 2 (graph) is active...');
    const navResult = await page.eval(`
      const htmlSnippet = document.body ? document.body.innerHTML.slice(0, 600) : 'NO_BODY';
      const graphBtn = document.querySelector('button[data-testid="module-nav-graph"]');
      if (graphBtn && !graphBtn.classList.contains('active')) {
        graphBtn.click();
      }
      return { success: true, url: window.location.href, htmlSnippet };
    `);
    console.log('[Step 1 Result]', navResult);
    console.log('[Current Logs]:', page.consoleLogs);
    await sleep(2000);

    // 2. 验证 GraphNav 容器就绪，且彻底无 SubwayMap 地铁图残留
    console.log('[Step 2] Verifying GraphNav presence & SubwayMap absence...');
    const checkComponents = await page.eval(`
      const graphNav = document.querySelector('[data-testid="graph-nav-container"]');
      const subwayMap = document.querySelector('[data-testid="subway-map"]');
      const mapToggle = document.querySelector('[data-testid="graph-view-map"]');
      const lineLoopToggle = document.querySelector('[data-testid="graph-view-line_loop"]');
      const header = document.querySelector('[data-testid="graph-nav-header"]');
      const currentLineText = document.querySelector('[data-testid="graph-line-selector-trigger"]')?.textContent || '';
      return {
        hasGraphNav: !!graphNav,
        hasSubwayMap: !!subwayMap,
        hasMapToggle: !!mapToggle,
        hasLineLoopToggle: !!lineLoopToggle,
        hasHeader: !!header,
        currentLineText,
      };
    `);
    console.log('[Step 2 Result]', checkComponents);
    if (!checkComponents.hasGraphNav) throw new Error('GraphNav container not found!');
    if (checkComponents.hasSubwayMap) throw new Error('SubwayMap still rendered in Module 2!');
    if (checkComponents.hasMapToggle) throw new Error('Map view toggle button still rendered!');

    // 截屏 1: GraphNav 初始概念精讲
    const shot1 = await page.captureScreenshot('fe0015_01_graphnav_initial.png');

    // 3. 测试 12 谱系选择器弹窗展开
    console.log('[Step 3] Opening 12-line selector drawer...');
    await page.eval(`
      const trigger = document.querySelector('[data-testid="graph-line-selector-trigger"]');
      if (trigger) trigger.click();
    `);
    await sleep(1000);

    const checkDrawer = await page.eval(`
      const drawer = document.querySelector('[data-testid="graph-line-drawer-panel"]');
      const g4Btn = document.querySelector('[data-testid="graph-line-option-G4"]');
      return { hasDrawer: !!drawer, hasG4: !!g4Btn };
    `);
    console.log('[Step 3 Result]', checkDrawer);
    if (!checkDrawer.hasDrawer) throw new Error('Line selector drawer did not open!');

    // 截屏 2: 12 谱系分类抽屉展开状态
    const shot2 = await page.captureScreenshot('fe0015_02_line_selector_drawer.png');

    // 4. 选择 G4 谱系 (圆的度量)
    console.log('[Step 4] Switching to G4 line (圆的几何度量与位置关系)...');
    await page.eval(`
      const g4Btn = document.querySelector('[data-testid="graph-line-option-G4"]');
      if (g4Btn) g4Btn.click();
    `);
    await sleep(1500);

    const checkG4 = await page.eval(`
      const trigger = document.querySelector('[data-testid="graph-line-selector-trigger"]');
      const swimlane = document.querySelector('[data-testid="line-swimlane"]');
      const swimlaneTitle = swimlane ? swimlane.querySelector('.line-swimlane-header')?.textContent || '' : '';
      const stages = Array.from(document.querySelectorAll('[data-testid^="graph-stage-"]')).map(el => el.textContent);
      return {
        triggerText: trigger ? trigger.textContent : '',
        hasSwimlane: !!swimlane,
        swimlaneTitle,
        stageCount: stages.length,
      };
    `);
    console.log('[Step 4 Result]', checkG4);

    // 截屏 3: G4 概念精讲与竖向泳道图联动
    const shot3 = await page.captureScreenshot('fe0015_03_line_g4_concept.png');

    // 5. 切换到 Tab 2: 链接沙盒
    console.log('[Step 5] Switching to Linked Sandbox Tab...');
    const clickRes = await page.eval(`
      const tabSandbox = document.querySelector('[data-testid="graph-tab-sandbox"]');
      if (tabSandbox) {
        tabSandbox.click();
        return { clicked: true, text: tabSandbox.textContent };
      }
      return { clicked: false, availableTabs: Array.from(document.querySelectorAll('[data-testid^="graph-tab-"]')).map(b => b.getAttribute('data-testid')) };
    `);
    console.log('[Step 5 Click Result]:', clickRes);
    await sleep(2500);

    const checkSandbox = await page.eval(`
      const sandboxView = document.querySelector('[data-testid="graph-sandbox-view"]');
      const drawerTrigger = document.querySelector('.model-drawer-trigger-btn');
      const staticTitle = document.querySelector('.model-drawer-static-title');
      const drawerPanel = document.querySelector('.model-drawer-panel');
      const jxgBox = document.querySelector('.jxgbox') || document.querySelector('.jsxgraph-board');
      const xRayBtn = document.querySelector('.xray-toggle-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('X-Ray'));
      return {
        hasSandboxView: !!sandboxView,
        hasDrawerTrigger: !!drawerTrigger, // 应为 false
        hasStaticTitle: !!staticTitle,     // 应为 true
        staticTitleText: staticTitle ? staticTitle.textContent : '',
        hasDrawerPanel: !!drawerPanel,     // 应为 false
        hasJxgBox: !!jxgBox,
        hasXRay: !!xRayBtn,
      };
    `);
    console.log('[Step 5 Result]', checkSandbox);
    if (!checkSandbox.hasSandboxView) throw new Error('Sandbox view not rendered after clicking tab!');
    if (checkSandbox.hasDrawerTrigger) throw new Error('hideModelDrawer failed: .model-drawer-trigger-btn rendered!');
    if (checkSandbox.hasDrawerPanel) throw new Error('hideModelDrawer failed: .model-drawer-panel rendered!');

    // 截屏 4: 链接沙盒锁定旗舰模型 LM-9A-24
    const shot4 = await page.captureScreenshot('fe0015_04_linked_sandbox_g4.png');

    // 6. 切换到 Tab 3: 谱系母题
    console.log('[Step 6] Switching to Line Master Tab...');
    await page.eval(`
      const tabMaster = document.querySelector('[data-testid="graph-tab-master"]');
      if (tabMaster) tabMaster.click();
    `);
    await sleep(1500);

    const checkMaster = await page.eval(`
      const masterView = document.querySelector('[data-testid="graph-master-view"]');
      const unlockButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('解锁') || b.textContent.includes('Unlock'));
      return {
        hasMasterView: !!masterView,
        unlockButtonCount: unlockButtons.length,
      };
    `);
    console.log('[Step 6 Result]', checkMaster);

    // 点击步进解锁第 1 维
    await page.eval(`
      const firstUnlock = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('解锁') || b.textContent.includes('Unlock'));
      if (firstUnlock) firstUnlock.click();
    `);
    await sleep(1000);

    // 截屏 5: 谱系母题步进解锁
    const shot5 = await page.captureScreenshot('fe0015_05_line_master_stepped.png');

    // 7. 切换到 Tab 4: 专项测评
    console.log('[Step 7] Switching to Practice Tab...');
    const practiceClick = await page.eval(`
      const tabPractice = document.querySelector('[data-testid="graph-tab-practice"]');
      if (tabPractice) {
        tabPractice.click();
        return { clicked: true, text: tabPractice.textContent };
      }
      return { clicked: false };
    `);
    console.log('[Step 7 Click Result]:', practiceClick);
    await sleep(2000);

    const checkPractice = await page.eval(`
      const practiceView = document.querySelector('[data-testid="graph-practice-view"]');
      const optionButtons = Array.from(document.querySelectorAll('button')).filter(b => {
        const text = b.textContent.trim();
        return text.startsWith('A') || text.startsWith('B') || text.startsWith('C') || text.startsWith('D');
      });
      return {
        hasPracticeView: !!practiceView,
        optionCount: optionButtons.length,
      };
    `);
    console.log('[Step 7 Result]', checkPractice);

    // 点击选择第 1 题的选项 A 并提交
    await page.eval(`
      const optA = document.querySelector('[data-testid="option-A"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('A'));
      if (optA) optA.click();
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('提交') || b.textContent.includes('确认'));
      if (submitBtn) submitBtn.click();
    `);
    await sleep(1000);

    // 截屏 6: 专项测评即答即判
    const shot6 = await page.captureScreenshot('fe0015_06_quick_practice_eval.png');

    // 8. 检查 Console 红线
    console.log('[Step 8] Checking console errors...');
    const errors = page.consoleErrors;
    console.log(`[Console Errors Count]: ${errors.length}`);
    if (errors.length > 0) {
      console.error('[Console Errors Detail]:', errors);
      throw new Error(`Console had ${errors.length} errors during E2E verification!`);
    }

    const summary = {
      status: 'success',
      screenshots: [shot1, shot2, shot3, shot4, shot5, shot6],
      consoleErrorsCount: errors.length,
      checkComponents,
      checkG4,
      checkSandbox,
      checkMaster,
      checkPractice,
    };

    fs.writeFileSync(
      path.resolve(__dirname, '../tmp/fe0015/e2e_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('[Success] TASK-FE-0015 E2E Real Browser Verification PASSED!');
    return summary;
  } finally {
    try {
      chrome.kill('SIGTERM');
    } catch {}
    try {
      server.close();
    } catch {}
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
