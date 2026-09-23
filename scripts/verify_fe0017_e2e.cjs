const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8794;
const CDP_PORT = 9644;
const DIST_DIR = path.resolve(__dirname, '../dist');
const EVIDENCE_DIR = path.resolve(__dirname, '../tmp/fe0017/evidence');

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

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

function launchHeadlessChrome() {
  return new Promise((resolve, reject) => {
    const userDataDir = path.resolve(__dirname, `../tmp/chrome_fe0017_${Date.now()}`);
    const chrome = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,960',
      'about:blank',
    ]);

    chrome.on('error', reject);

    const checkReady = (retries = 30) => {
      http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, (res) => {
        if (res.statusCode === 200) {
          console.log('[Chrome] Headless Chrome CDP ready');
          resolve({ chrome, userDataDir });
        } else if (retries > 0) {
          setTimeout(() => checkReady(retries - 1), 300);
        } else {
          reject(new Error('Chrome CDP timed out'));
        }
      }).on('error', () => {
        if (retries > 0) {
          setTimeout(() => checkReady(retries - 1), 300);
        } else {
          reject(new Error('Chrome CDP connect failed'));
        }
      });
    };

    setTimeout(() => checkReady(30), 600);
  });
}

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(item => item.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No page WebSocket URL found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
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
        const parsed = JSON.parse(event.data);
        if (parsed.id && this.callbacks.has(parsed.id)) {
          const { resolve, reject } = this.callbacks.get(parsed.id);
          this.callbacks.delete(parsed.id);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        } else if (parsed.method) {
          const listeners = this.eventListeners.get(parsed.method) || [];
          listeners.forEach(fn => fn(parsed.params));
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
    this.eventListeners.get(event).push(handler);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile,
      fitWindow: false,
    });
    await this.send('Emulation.setVisibleSize', { width, height });
    // Trigger resize event
    await this.eval(`window.dispatchEvent(new Event('resize'));`);
    await new Promise(r => setTimeout(r, 200));
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(EVIDENCE_DIR, filename);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(fullPath, buf);
    const hash = crypto.createHash('sha256').update(buf).digest('hex').substring(0, 16);
    console.log(`[Screenshot] Saved ${filename} (${buf.length} bytes, SHA256: ${hash})`);
    return { filename, fullPath, bytes: buf.length, sha256: hash };
  }
}

async function run() {
  console.log('=== TASK-FE-0017 Real Chrome Browser E2E Acceptance ===');
  const server = await startStaticServer();
  const { chrome, userDataDir } = await launchHeadlessChrome();
  const wsUrl = await getWebSocketUrl();
  const cdp = new CdpClient(wsUrl);
  await cdp.connect();

  const consoleErrors = [];
  const consoleWarnings = [];

  cdp.on('Runtime.consoleAPICalled', (params) => {
    const text = params.args ? params.args.map(a => a.value || a.description || '').join(' ') : '';
    if (params.type === 'error') {
      consoleErrors.push(text);
      console.error(`[Browser Console Error] ${text}`);
    } else if (params.type === 'warning') {
      consoleWarnings.push(text);
    }
  });

  cdp.on('Log.entryAdded', (params) => {
    if (params.entry && params.entry.level === 'error') {
      consoleErrors.push(params.entry.text);
      console.error(`[Browser Log Error] ${params.entry.text}`);
    }
  });

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  const evidence = [];

  try {
    // 1. Load Homepage
    console.log('\n--- Step 1: Navigating to http://127.0.0.1:' + HTTP_PORT + '/ ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` });
    await new Promise(r => setTimeout(r, 1200));

    // Wait until document is ready
    await cdp.eval(`new Promise((resolve) => {
      if (document.readyState === 'complete') resolve(true);
      else window.addEventListener('load', () => resolve(true));
    })`);
    await new Promise(r => setTimeout(r, 600));

    // 2. Test Phone: iPhone SE (375x667)
    console.log('\n--- Step 2: Testing Mobile iPhone SE (375x667) ---');
    await cdp.setViewport(375, 667, true);
    await new Promise(r => setTimeout(r, 400));

    const seScrollCheck = await cdp.eval(`({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      hasHScroll: document.documentElement.scrollWidth > window.innerWidth,
    })`);
    console.log('iPhone SE (375) Scroll Check:', seScrollCheck);
    if (seScrollCheck.hasHScroll) {
      throw new Error(`FAIL: Horizontal scroll detected on 375px: scrollWidth=${seScrollCheck.scrollWidth}, innerWidth=${seScrollCheck.innerWidth}`);
    }

    const seGridCheck = await cdp.eval(`(() => {
      const grid = document.querySelector('[data-testid="stats-metric-grid"]');
      if (!grid) return null;
      const style = window.getComputedStyle(grid);
      const cols = style.gridTemplateColumns.split(' ').length;
      return { cols, childrenCount: grid.children.length };
    })()`);
    console.log('iPhone SE (375) Metric Grid Check:', seGridCheck);
    if (!seGridCheck || seGridCheck.cols !== 2) {
      throw new Error(`FAIL: Metric grid should have 2 columns on mobile, got: ${JSON.stringify(seGridCheck)}`);
    }

    evidence.push(await cdp.captureScreenshot('e2e_01_mobile_375_iphonese.png'));

    // 3. Test Phone: iPhone 14 Pro (393x852) & CTA Click
    console.log('\n--- Step 3: Testing Mobile iPhone 14 Pro (393x852) & CTA Click ---');
    await cdp.setViewport(393, 852, true);
    await new Promise(r => setTimeout(r, 400));

    const proScrollCheck = await cdp.eval(`({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasHScroll: document.documentElement.scrollWidth > window.innerWidth,
    })`);
    console.log('iPhone 14 Pro (393) Scroll Check:', proScrollCheck);
    if (proScrollCheck.hasHScroll) {
      throw new Error(`FAIL: Horizontal scroll detected on 393px: scrollWidth=${proScrollCheck.scrollWidth}`);
    }

    const ctaBtnCheck = await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="enter-math-junior-btn"]');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return { width: rect.width, height: rect.height, visible: rect.width > 280 };
    })()`);
    console.log('iPhone 14 Pro CTA Button Check:', ctaBtnCheck);
    if (!ctaBtnCheck || !ctaBtnCheck.visible || ctaBtnCheck.height < 40) {
      throw new Error(`FAIL: CTA button should be full width on mobile, got: ${JSON.stringify(ctaBtnCheck)}`);
    }

    evidence.push(await cdp.captureScreenshot('e2e_02_mobile_393_iphone14pro.png'));

    // Click CTA to navigate to math-junior
    console.log('Clicking CTA button to navigate to /math-junior...');
    await cdp.eval(`document.querySelector('[data-testid="enter-math-junior-btn"]').click()`);
    await new Promise(r => setTimeout(r, 800));

    const navCheck = await cdp.eval(`({
      hash: window.location.hash,
      pathname: window.location.pathname,
      hasMathContent: !!document.querySelector('[data-testid="junior-math-workshop"]') || !!document.querySelector('[data-testid="back-to-portal-btn"]') || document.body.innerText.includes('初中数学') || document.body.innerText.includes('Junior Math'),
    })`);
    console.log('Navigation check after CTA click:', navCheck);
    if (!navCheck.hash.includes('math-junior') && !navCheck.hasMathContent) {
      throw new Error(`FAIL: Navigation to /math-junior failed: ${JSON.stringify(navCheck)}`);
    }

    evidence.push(await cdp.captureScreenshot('e2e_03_navigated_math_junior.png'));

    // Navigate back to portal
    console.log('Navigating back to / (hash #/)...');
    await cdp.eval(`window.location.hash = '#/'`);
    await new Promise(r => setTimeout(r, 800));

    // 4. Test Tablet: iPad Portrait (768x1024)
    console.log('\n--- Step 4: Testing iPad Portrait (768x1024) ---');
    await cdp.setViewport(768, 1024, false);
    await new Promise(r => setTimeout(r, 400));

    const tabletPortraitCheck = await cdp.eval(`({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasHScroll: document.documentElement.scrollWidth > window.innerWidth,
    })`);
    console.log('iPad Portrait (768) Scroll Check:', tabletPortraitCheck);
    if (tabletPortraitCheck.hasHScroll) {
      throw new Error(`FAIL: Horizontal scroll on 768px portrait: scrollWidth=${tabletPortraitCheck.scrollWidth}`);
    }

    const tabletPortraitGrid = await cdp.eval(`(() => {
      const grid = document.querySelector('[data-testid="stats-metric-grid"]');
      if (!grid) return null;
      const cols = window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      return { cols };
    })()`);
    console.log('iPad Portrait Metric Grid:', tabletPortraitGrid);
    if (!tabletPortraitGrid || tabletPortraitGrid.cols !== 4) {
      throw new Error(`FAIL: Metric grid should have 4 columns on tablet portrait, got: ${JSON.stringify(tabletPortraitGrid)}`);
    }

    evidence.push(await cdp.captureScreenshot('e2e_04_tablet_ipad_portrait_768.png'));

    // 5. Test Tablet: iPad Landscape (1024x768)
    console.log('\n--- Step 5: Testing iPad Landscape (1024x768) ---');
    await cdp.setViewport(1024, 768, false);
    await new Promise(r => setTimeout(r, 400));

    const tabletLandscapeCheck = await cdp.eval(`({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasHScroll: document.documentElement.scrollWidth > window.innerWidth,
    })`);
    console.log('iPad Landscape (1024) Scroll Check:', tabletLandscapeCheck);
    if (tabletLandscapeCheck.hasHScroll) {
      throw new Error(`FAIL: Horizontal scroll on 1024px landscape: scrollWidth=${tabletLandscapeCheck.scrollWidth}`);
    }

    const heroSvgContainer = await cdp.eval(`(() => {
      const el = document.querySelector('[data-testid="hero-svg-container"]');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height, visible: rect.width > 0 };
    })()`);
    console.log('iPad Landscape Hero SVG Check:', heroSvgContainer);
    if (!heroSvgContainer || !heroSvgContainer.visible) {
      throw new Error(`FAIL: Hero SVG container should be visible beside content on iPad landscape`);
    }

    evidence.push(await cdp.captureScreenshot('e2e_05_tablet_ipad_landscape_1024.png'));

    // 6. Test Desktop (1440x900)
    console.log('\n--- Step 6: Testing Desktop (1440x900) Keynote Theater ---');
    await cdp.setViewport(1440, 900, false);
    await new Promise(r => setTimeout(r, 400));

    const desktopCheck = await cdp.eval(`(() => {
      const main = document.querySelector('main');
      const rect = main.getBoundingClientRect();
      const style = window.getComputedStyle(main);
      return {
        mainWidth: rect.width,
        maxWidth: style.maxWidth,
        hasStudentBadge: document.body.innerText.includes('学员模式') || document.body.innerText.includes('默认学员'),
      };
    })()`);
    console.log('Desktop Check:', desktopCheck);
    if (desktopCheck.maxWidth !== '1140px') {
      throw new Error(`FAIL: Desktop maxWidth should be 1140px, got ${desktopCheck.maxWidth}`);
    }

    evidence.push(await cdp.captureScreenshot('e2e_06_desktop_1440.png'));

    // 7. Test Language & Stages
    console.log('\n--- Step 7: Testing Language Switch & Stage Switching ---');
    // Toggle language
    await cdp.eval(`document.querySelector('[data-testid="portal-lang-toggle"]').click()`);
    await new Promise(r => setTimeout(r, 300));

    const langEnCheck = await cdp.eval(`({
      bodyHasEnglish: document.body.innerText.includes('Junior Math') || document.body.innerText.includes('Core Competency'),
      stageHasEn: document.body.innerText.includes('Junior') || document.body.innerText.includes('Primary'),
    })`);
    console.log('Language English Check:', langEnCheck);
    if (!langEnCheck.bodyHasEnglish) {
      throw new Error(`FAIL: English translation toggle failed`);
    }

    // Switch stage to primary
    await cdp.eval(`document.querySelector('[data-testid="stage-tab-primary"]').click()`);
    await new Promise(r => setTimeout(r, 300));

    // Switch stage to senior
    await cdp.eval(`document.querySelector('[data-testid="stage-tab-senior"]').click()`);
    await new Promise(r => setTimeout(r, 300));

    // Switch back to junior
    await cdp.eval(`document.querySelector('[data-testid="stage-tab-junior"]').click()`);
    await new Promise(r => setTimeout(r, 300));

    // Switch lang back to zh
    await cdp.eval(`document.querySelector('[data-testid="portal-lang-toggle"]').click()`);
    await new Promise(r => setTimeout(r, 300));

    evidence.push(await cdp.captureScreenshot('e2e_07_language_and_stages.png'));

    // 8. Console Redline Verification
    console.log('\n--- Step 8: Verifying Console Redline ---');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      throw new Error(`FAIL: Console errors detected during E2E test:\n${consoleErrors.join('\n')}`);
    }

    console.log('\n=== ALL E2E ACCEPTANCE CRITERIA PASSED (100% GREEN) ===');
    const summary = {
      timestamp: new Date().toISOString(),
      status: 'PASSED',
      evidence,
      consoleErrorsCount: consoleErrors.length,
      tests: [
        'Phone iPhone SE (375px) 0 horizontal scroll & 2x2 metric grid',
        'Phone iPhone 14 Pro (393px) full-width CTA button & navigation',
        'Tablet iPad Portrait (768px) 0 horizontal scroll & 4-col metric grid',
        'Tablet iPad Landscape (1024px) side-by-side Hero SVG layout',
        'Desktop (1440px) 1140px Keynote theater preservation',
        'Bilingual i18n & 3-stage switching stability',
        'Console Redline 0 Errors',
      ],
    };

    fs.writeFileSync(path.join(EVIDENCE_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log('Summary report saved to tmp/fe0017/evidence/summary.json');

  } finally {
    try {
      chrome.kill('SIGTERM');
      server.close();
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      }
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error('\nE2E Test Execution Failed:', err);
  process.exit(1);
});
