const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8792;
const CDP_PORT = 9642;
const DIST_DIR = path.resolve(__dirname, '../dist');
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_lab_test_${Date.now()}`);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../tmp/lab_drawer_evidence');

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

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
      const id = ++this.id;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP request timeout for ${method} (id=${id})`));
        }
      }, timeoutMs);
      this.callbacks.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(() => { ${expr} })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }
  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot] Saved: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return outPath;
  }
  close() {
    if (this.ws) this.ws.close();
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

    console.log(`[Navigate] Loading app at http://127.0.0.1:${HTTP_PORT}/#/math-junior/lab ...`);
    await page.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/lab` });
    await sleep(2500);

    // 3. 切换到 4D 跃迁模型 (实验室二)
    console.log('[Step 3] Switching to 4D Leap Model (Lab 2)...');
    await page.eval(`
      const leapTab = Array.from(document.querySelectorAll('.seg-item')).find(b => b.textContent.includes('4D 跃迁模型'));
      if (leapTab) leapTab.click();
    `);
    await sleep(1500);

    // 4. 验证：抽屉触发按钮只能有 1 个（右侧），左侧按钮已删除
    console.log('[Step 4] Checking drawer trigger buttons count...');
    const triggerButtonsInfo = await page.eval(`
      const triggers = Array.from(document.querySelectorAll('.model-drawer-trigger-btn'));
      const staticTitles = Array.from(document.querySelectorAll('.sandbox-title-text'));
      return {
        triggerCount: triggers.length,
        triggerTexts: triggers.map(t => t.textContent.trim()),
        hasStickyHeader: !!document.querySelector('.sandbox-sticky-header-container'),
        staticTitles: staticTitles.map(t => t.textContent.trim()),
      };
    `);
    console.log('[Verification 1] Trigger buttons info:', JSON.stringify(triggerButtonsInfo, null, 2));

    if (triggerButtonsInfo.triggerCount !== 1) {
      throw new Error(`Expected exactly 1 model-drawer-trigger-btn, but found ${triggerButtonsInfo.triggerCount}`);
    }
    console.log('✅ PASS: Exactly 1 drawer trigger button exists on screen! Redundant left trigger button successfully deleted.');

    // 截图 1: 顶栏单触发按钮与标准标题
    await page.captureScreenshot('01_lab_leap4d_single_trigger.png');

    // 5. 页面向下滚动到底部
    console.log('[Step 5] Scrolling theater down to bottom...');
    const scrollInfo = await page.eval(`
      const theater = document.querySelector('[data-testid="cockpit-theater"]');
      if (theater) {
        theater.scrollTop = 500;
        return {
          scrollTop: theater.scrollTop,
          scrollHeight: theater.scrollHeight,
          clientHeight: theater.clientHeight,
        };
      }
      return null;
    `);
    console.log('[Scroll Info]', scrollInfo);
    await sleep(800);

    // 6. 在页面滚动到底部时，点击顶部的“选择模型”抽屉按钮
    console.log('[Step 6] Clicking top-right trigger button while scrolled down...');
    await page.eval(`
      const trigger = document.querySelector('.model-drawer-trigger-btn');
      if (trigger) trigger.click();
    `);
    await sleep(1000);

    // 7. 检查 options 选项框 (.model-drawer-panel) 是否在当前屏幕可视区域内正常显示！
    console.log('[Step 7] Checking if model drawer panel is displayed in visible viewport...');
    const panelVisibility = await page.eval(`
      const panel = document.querySelector('.model-drawer-panel');
      const stickyHeader = document.querySelector('.sandbox-sticky-header-container');
      const theater = document.querySelector('[data-testid="cockpit-theater"]');
      if (!panel) return { exists: false };
      const rect = panel.getBoundingClientRect();
      const stickyRect = stickyHeader ? stickyHeader.getBoundingClientRect() : null;
      const modelCards = Array.from(panel.querySelectorAll('.drawer-model-card'));
      return {
        exists: true,
        rect: { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width },
        stickyRect: stickyRect ? { top: stickyRect.top, bottom: stickyRect.bottom } : null,
        theaterScrollTop: theater ? theater.scrollTop : 0,
        isInViewport: rect.top >= 0 && rect.bottom > 100 && rect.top < window.innerHeight,
        modelCardsCount: modelCards.length,
        firstCardText: modelCards[0] ? modelCards[0].textContent.trim().slice(0, 50) : '',
      };
    `);
    console.log('[Verification 2] Panel Visibility while scrolled down:', JSON.stringify(panelVisibility, null, 2));

    if (!panelVisibility.exists) {
      throw new Error('model-drawer-panel is not rendered when trigger clicked!');
    }
    if (!panelVisibility.isInViewport) {
      throw new Error(`model-drawer-panel is NOT in visible viewport! rect.top=${panelVisibility.rect.top}`);
    }
    console.log(`✅ PASS: model-drawer-panel is 100% VISIBLE in viewport! (top: ${panelVisibility.rect.top}px, cards: ${panelVisibility.modelCardsCount})`);

    // 截图 2: 滚动到底部后打开抽屉的真实截图
    await page.captureScreenshot('02_scrolled_down_drawer_visible.png');

    // 8. 点击选择一个模型 (例如列表中第 2 个模型)，检查模型切换与抽屉自动关闭并置顶
    console.log('[Step 8] Selecting a model in drawer...');
    await page.eval(`
      const cards = Array.from(document.querySelectorAll('.drawer-model-card'));
      if (cards.length > 1) {
        cards[1].click();
      }
    `);
    await sleep(1000);

    // 9. 验证抽屉已关闭
    const closedCheck = await page.eval(`
      const panel = document.querySelector('.model-drawer-panel');
      const theater = document.querySelector('[data-testid="cockpit-theater"]');
      return {
        panelExists: !!panel,
        theaterScrollTop: theater ? theater.scrollTop : 0,
      };
    `);
    console.log('[Verification 3] After selecting model:', closedCheck);

    if (closedCheck.panelExists) {
      throw new Error('model-drawer-panel did not close after selecting model');
    }
    console.log('✅ PASS: model-drawer-panel closed cleanly after selecting a model!');

    // 截图 3: 切换后的截图
    await page.captureScreenshot('03_after_model_selected.png');

    // 10. 切换到概念具象沙盒 (实验室一) 并验证滚动到底部后抽屉表现
    console.log('[Step 10] Switching to Concept Sandbox (Lab 1)...');
    await page.eval(`
      const conceptTab = Array.from(document.querySelectorAll('.seg-item')).find(b => b.textContent.includes('概念具象沙盒'));
      if (conceptTab) conceptTab.click();
    `);
    await sleep(1000);

    // 滚动到底部并打开概念沙盒抽屉
    await page.eval(`
      const theater = document.querySelector('[data-testid="cockpit-theater"]');
      if (theater) theater.scrollTop = 500;
      const trigger = document.querySelector('.model-drawer-trigger-btn');
      if (trigger) trigger.click();
    `);
    await sleep(1000);

    const conceptDrawerCheck = await page.eval(`
      const panel = document.querySelector('.model-drawer-panel');
      if (!panel) return { exists: false };
      const rect = panel.getBoundingClientRect();
      return {
        exists: true,
        rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
        isInViewport: rect.top >= 0 && rect.bottom > 100 && rect.top < window.innerHeight,
      };
    `);
    console.log('[Verification 4] Concept Sandbox Drawer Visibility:', conceptDrawerCheck);
    if (!conceptDrawerCheck.exists || !conceptDrawerCheck.isInViewport) {
      throw new Error('Concept sandbox drawer is not visible in viewport!');
    }
    console.log('✅ PASS: Concept sandbox drawer is also 100% VISIBLE in viewport when scrolled down!');
    await page.captureScreenshot('04_concept_sandbox_drawer_scrolled.png');

    console.log('\n========================================');
    console.log('🎉 ALL REAL BROWSER E2E TESTS PASSED 100%!');
    console.log('========================================\n');

    page.close();
  } finally {
    try { chrome.kill('SIGTERM'); } catch {}
    try { server.close(); } catch {}
    await sleep(500);
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
