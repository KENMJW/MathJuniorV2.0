const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9597;
const USER_DATA_DIR = path.resolve(__dirname, `../../tmp/chrome_inspect_mobile_${Date.now()}`);
const OUT_DIR = path.resolve(__dirname, '../../public/screenshots');
const ARTIFACT_DIR = '/Users/annette/.gemini/antigravity/brain/82d7aa7b-3a10-4a4f-ac20-4fbd853c87d0';

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
      this.ws.onopen = () => resolve();
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
        } catch (e) {}
      };
    });
  }

  send(method, params = {}, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP request ${method} timed out`));
        }
      }, timeoutMs);
      this.callbacks.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      fromSurface: true,
    });
    const buf = Buffer.from(res.data, 'base64');
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artifactPath, buf);
    console.log(`Saved screenshot: ${filename}`);
  }
}

async function getWs(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      let page = targets.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      await sleep(300);
    }
  }
  throw new Error('Failed to get ws');
}

async function run() {
  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=390,844',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const ws = await getWs(PORT);
    const client = new CDPClient(ws);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // Emulate iPhone mobile device
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    console.log('Navigating to http://localhost:5173/#/math-junior/lab ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#/math-junior/lab' });
    await sleep(3500);

    // Switch to Leap 4D tab (tab 2)
    console.log('Switching to Leap 4D tab...');
    await client.eval(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('button'));
        const leapTab = tabs.find(t => t.textContent && (t.textContent.includes('跃迁模型') || t.textContent.includes('Leap 4D')));
        if (leapTab) leapTab.click();
      })()
    `);
    await sleep(1500);

    // Switch to LM-8A-08
    console.log('Switching to LM-8A-08...');
    await client.eval(`
      (() => {
        // Try trigger capsule
        const capsule = document.querySelector('[data-testid="interactive-title-capsule"]');
        if (capsule) capsule.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const input = document.querySelector('input[placeholder*="搜索"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'LM-8A-08');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.drawer-model-card, .model-item, div, button'));
        const target = cards.find(c => c.textContent && c.textContent.includes('LM-8A-08'));
        if (target) target.click();
      })()
    `);
    await sleep(2000);

    // Capture mobile top screenshot
    await client.captureScreenshot('mobile_view_current.png');

    // Log DOM information
    const domInfo = await client.eval(`
      (() => {
        const header = document.querySelector('[data-testid="card-deck-header"]');
        const subnav = document.querySelector('[data-testid="card-deck-subnav"]');
        const capsule = document.querySelector('[data-testid="interactive-title-capsule"]');
        const viewport = document.querySelector('.sandbox-viewport-85');
        const guide = document.querySelector('.sandbox-guide-15');
        const body = document.querySelector('[data-testid="card-deck-body"]');

        return {
          windowInnerHeight: window.innerHeight,
          windowScrollY: window.scrollY,
          bodyScrollTop: body ? body.scrollTop : null,
          headerRect: header ? header.getBoundingClientRect() : null,
          subnavRect: subnav ? subnav.getBoundingClientRect() : null,
          capsuleRect: capsule ? capsule.getBoundingClientRect() : null,
          viewportRect: viewport ? viewport.getBoundingClientRect() : null,
          guideRect: guide ? guide.getBoundingClientRect() : null,
        };
      })()
    `);
    console.log('DOM Info:', JSON.stringify(domInfo, null, 2));

  } finally {
    try {
      chromeProc.kill('SIGKILL');
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch(console.error);
