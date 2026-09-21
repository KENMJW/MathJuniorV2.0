const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9568;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_diag_${Date.now()}`);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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

  async captureScreenshot(filepath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved screenshot: ${filepath}`);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }
}

async function main() {
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://127.0.0.1:4173/'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to get CDP WebSocket URL');
    chromeProcess.kill();
    process.exit(1);
  }

  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await sleep(1500);

  // Switch to Module 4: exam
  await client.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      const examBtn = btns.find(b => b.textContent.includes('实战测评') || b.textContent.includes('百炼成钢'));
      if (examBtn) examBtn.click();
    })()
  `);

  await sleep(1000);

  // 1. Screenshot Module 4 Workbench view
  await client.captureScreenshot('tmp/screenshots/verify_exam_workbench_aligned.png');

  // Click "在线全真模考" to enter online exam
  await client.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const onlineBtn = btns.find(b => b.textContent.includes('在线全真模考'));
      if (onlineBtn) onlineBtn.click();
    })()
  `);

  await sleep(1200);

  // Click "返回出题中心"
  await client.eval(`
    (() => {
      const btn = document.querySelector('[data-testid="exam-back-to-workbench-btn"]');
      if (btn) btn.click();
    })()
  `);

  await sleep(600);

  // 2. Screenshot Online Exam Exit Modal
  await client.captureScreenshot('tmp/screenshots/verify_exam_exit_modal_centered.png');

  chromeProcess.kill();
  console.log('Verification completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
