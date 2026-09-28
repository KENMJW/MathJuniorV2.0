const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9599;
const USER_DATA_DIR = path.resolve(__dirname, `../../tmp/chrome_verify_centered_${Date.now()}`);
const OUT_DIR = path.resolve(__dirname, '../../public/screenshots');
const ARTIFACT_DIR = '/Users/annette/.gemini/antigravity/brain/82d7aa7b-3a10-4a4f-ac20-4fbd853c87d0';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

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
        } catch (e) {
          console.error('[CDP] Message parse error:', e);
        }
      };
    });
  }

  send(method, params = {}, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP request ${method} (id=${id}) timed out after ${timeoutMs}ms`));
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
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      fromSurface: true,
    });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(OUT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    fs.writeFileSync(artifactPath, buf);
    console.log(`[CDP] Saved screenshot: ${filename} (${buf.length} bytes)`);
    return outPath;
  }
}

async function getPageWsUrl(port, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      let page = targets.find((t) => t.type === 'page');
      if (!page) {
        page = await fetch(`http://127.0.0.1:${port}/json/new`).then((r) => r.json());
      }
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      await sleep(300);
    }
  }
  throw new Error('Failed to obtain page WebSocket debugger URL from Chrome');
}

async function run() {
  console.log('>>> [START E2E VERIFICATION] Launching Chrome...');
  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const wsUrl = await getPageWsUrl(PORT);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('[E2E] Navigating to http://localhost:5173/#/math-junior/lab ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#/math-junior/lab' });
    await sleep(3000);

    // 1. Open concept drawer
    console.log('[E2E] Opening Concept Sandbox drawer...');
    await client.eval(`
      (() => {
        const trigger = document.querySelector('.model-drawer-trigger-btn');
        if (trigger) trigger.click();
      })()
    `);
    await sleep(800);

    // 2. Search for SB-KP032
    console.log('[E2E] Searching for SB-KP032...');
    await client.eval(`
      (() => {
        const input = document.querySelector('.drawer-search-field');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'SB-KP032');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(800);

    // 3. Click the SB-KP032 card
    console.log('[E2E] Clicking SB-KP032 card...');
    await client.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.drawer-model-card'));
        const target = cards.find(c => c.textContent && c.textContent.includes('SB-KP032'));
        if (target) target.click();
      })()
    `);
    await sleep(2000);

    // 4. Set sliders: k = -1, x = 2
    console.log('[E2E] Setting sliders k = -1, x = 2 ...');
    await client.eval(`
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type=\"range\"]'));
        if (inputs.length >= 2) {
          const kInput = inputs[0];
          const xInput = inputs[1];
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(kInput, '-1');
          kInput.dispatchEvent(new Event('input', { bubbles: true }));
          kInput.dispatchEvent(new Event('change', { bubbles: true }));

          setter.call(xInput, '2');
          xInput.dispatchEvent(new Event('input', { bubbles: true }));
          xInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(1500);

    console.log('[E2E] Capturing verify_sb_kp032_centered.png ...');
    await client.captureScreenshot('verify_sb_kp032_centered.png');

    // 5. Switch to 4D LeapLab
    console.log('\n[E2E] Switching to 4D LeapLab...');
    await client.eval(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('button'));
        const leapTab = tabs.find(t => t.textContent && t.textContent.includes('4D 跃迁模型'));
        if (leapTab) leapTab.click();
      })()
    `);
    await sleep(1500);

    // 6. Open leap drawer
    console.log('[E2E] Opening Leap Model drawer...');
    await client.eval(`
      (() => {
        const trigger = document.querySelector('.model-drawer-trigger-btn');
        if (trigger) trigger.click();
      })()
    `);
    await sleep(800);

    // 7. Search LM-7B-05
    console.log('[E2E] Searching for LM-7B-05...');
    await client.eval(`
      (() => {
        const input = document.querySelector('.drawer-search-field');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'LM-7B-05');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(800);

    // 8. Click LM-7B-05 card
    console.log('[E2E] Clicking LM-7B-05 card...');
    await client.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.drawer-model-card'));
        const target = cards.find(c => c.textContent && c.textContent.includes('LM-7B-05'));
        if (target) target.click();
      })()
    `);
    await sleep(2000);

    console.log('[E2E] Capturing verify_lm7b05_centered.png ...');
    await client.captureScreenshot('verify_lm7b05_centered.png');

    console.log('\n>>> [E2E SUCCESS] All screenshots captured!');
  } finally {
    try {
      chromeProc.kill('SIGKILL');
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error('[E2E FAILED]:', err);
  process.exit(1);
});
