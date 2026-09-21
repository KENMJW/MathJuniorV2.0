const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9588;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_diag_${Date.now()}`);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
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

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(() => { try { return (${expression}); } catch(e) { return { __error: e.message, __stack: e.stack }; } })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }
}

async function main() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1440,900',
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        const data = await resp.json();
        wsUrl = data.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch (e) {
        await sleep(200);
      }
    }
    if (!wsUrl) throw new Error('Chrome remote debugging did not respond');

    const browser = new CDPClient(wsUrl);
    await browser.connect();

    const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
    let pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) {
      pageTarget = await (await fetch(`http://127.0.0.1:${PORT}/json/new?http://127.0.0.1:4173/`)).json();
    }

    const page = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await page.connect();

    await page.send('Page.enable');
    await page.send('DOM.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    const outDir = path.resolve('/Users/annette/.gemini/antigravity/brain/f6f6b4e5-3581-496f-b725-91fdaed88f14');

    console.log('Navigating to http://127.0.0.1:4173...');
    await page.send('Page.navigate', { url: 'http://127.0.0.1:4173' });
    await sleep(2500);

    // Evidence 1: KP-023 in Concept Module (SVG mismatch)
    console.log('Capturing Evidence 1: KP-023 SVG mismatch...');
    await page.eval(`
      const drawerBtn = document.querySelector(".concept-drawer-trigger-btn");
      if (drawerBtn) drawerBtn.click();
    `);
    await sleep(500);

    await page.eval(`
      const search = document.querySelector(".concept-drawer-search-input");
      if (search) {
        search.value = "配方法";
        search.dispatchEvent(new Event("input", { bubbles: true }));
      }
    `);
    await sleep(500);

    await page.eval(`
      const kpItem = Array.from(document.querySelectorAll(".drawer-kp-card, .drawer-kp-item, button")).find(el => el.textContent && el.textContent.includes("配方法"));
      if (kpItem) kpItem.click();
    `);
    await sleep(1000);

    const shot1 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'diag_kp023_svg_mismatch.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved diag_kp023_svg_mismatch.png');

    // Evidence 2: Sandbox Module (Fake buttons: 概念具象化 / 视口阻尼锁定)
    console.log('Capturing Evidence 2: Fake buttons...');
    await page.eval(`
      const labNavBtn = Array.from(document.querySelectorAll(".nav-module-pill, button")).find(el => el.textContent && el.textContent.includes("实验探究"));
      if (labNavBtn) labNavBtn.click();
    `);
    await sleep(1500);

    const shot2 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'diag_fake_buttons.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved diag_fake_buttons.png');

    // Evidence 3: Leap Model (LM-7A-01) with X-Ray OFF
    console.log('Capturing Evidence 3: Leap Model initial...');
    await page.eval(`
      const leapTab = Array.from(document.querySelectorAll(".lab-mode-chip, button")).find(el => el.textContent && el.textContent.includes("4D 跃迁模型"));
      if (leapTab) leapTab.click();
    `);
    await sleep(1500);

    const shot3 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'diag_leap_model_initial.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved diag_leap_model_initial.png');

    // Evidence 4: Leap Model with X-Ray ON
    console.log('Capturing Evidence 4: Leap Model X-Ray ON...');
    await page.eval(`
      const xrayBtn = Array.from(document.querySelectorAll("button, .preset-btn")).find(el => el.textContent && el.textContent.includes("X-Ray"));
      if (xrayBtn) xrayBtn.click();
    `);
    await sleep(800);

    const shot4 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'diag_leap_xray_active.png'), Buffer.from(shot4.data, 'base64'));
    console.log('Saved diag_leap_xray_active.png');

    // Evidence 5: Leap Drawer with 36 models & all-Chinese semester chips
    console.log('Capturing Evidence 5: Leap Drawer...');
    await page.eval(`
      const drawerBtn = Array.from(document.querySelectorAll("button")).find(el => el.textContent && el.textContent.includes("选择模型"));
      if (drawerBtn) drawerBtn.click();
    `);
    await sleep(800);

    const shot5 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'diag_leap_drawer_list.png'), Buffer.from(shot5.data, 'base64'));
    console.log('Saved diag_leap_drawer_list.png');

    console.log('Done capturing all screenshots.');
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
