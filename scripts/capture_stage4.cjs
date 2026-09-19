const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9559;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_diag_${Date.now()}`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) break;
      } catch (e) {}
    }

    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    const send = (method, params = {}) => new Promise(r => {
      const curId = id++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', handler);
          r(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: `(${expr})`, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    };

    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:4173/#/math-junior/concept' });
    await sleep(3000);

    // 打开抽屉
    await evaluate(`document.querySelector('[data-testid="concept-drawer-trigger"]')?.click()`);
    await sleep(600);

    // 搜索 KP-061
    await evaluate(`(() => {
      const input = document.querySelector('[data-testid="concept-search-input"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'KP-061');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(600);

    // 点击 KP-061
    await evaluate(`document.querySelector('[data-testid="search-item-KP-061"]')?.click()`);
    await sleep(1000);

    // 点击第 4 段
    await evaluate(`document.querySelector('[data-stage-btn="4"]')?.click()`);
    await sleep(1000);

    // 截取 Stage 4
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/kp061_stage4_screenshot.png'), Buffer.from(snap.data, 'base64'));

    // 查看 144^\circ 所在元素的 HTML 和 computedStyle
    const math0Info = await evaluate(`(() => {
      const body = document.querySelector('.stage-text-body');
      const el = body.querySelector('.katex');
      const computed = window.getComputedStyle(el);
      return {
        outerHTML: el.outerHTML,
        display: computed.display,
        margin: computed.margin,
        htmlChild: el.querySelector('.katex-html')?.innerHTML,
        mathmlChild: el.querySelector('.katex-mathml')?.innerHTML
      };
    })()`);
    console.log('Math 0 Info:', JSON.stringify(math0Info, null, 2));

  } finally {
    try { chromeProcess.kill(); } catch {}
  }
}

main().catch(console.error);
