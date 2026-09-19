const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9561;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_diag_${Date.now()}`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
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
    await sleep(800);

    // 搜索 KP-061
    await evaluate(`(() => {
      const input = document.querySelector('[data-testid="concept-search-input"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'KP-061');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(800);

    // 点击 KP-061
    await evaluate(`document.querySelector('[data-testid="search-item-KP-061"]')?.click()`);
    await sleep(1500);

    // 点击第 4 段
    await evaluate(`document.querySelector('[data-stage-btn="4"]')?.click()`);
    await sleep(1000);

    // 截取 Stage 4
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/kp061_stage4_only.png'), Buffer.from(snap.data, 'base64'));
    console.log('Saved tmp/kp061_stage4_only.png');

    // 检查第 4 段中 144^\circ 所在区域的视觉信息与元素层级
    const vis = await evaluate(`(() => {
      const stage = document.querySelector('[data-testid="stage-content-4"]') || document.querySelector('.stage-text-body');
      const katexEls = Array.from(stage.querySelectorAll('.katex'));
      return katexEls.map(k => {
        const rect = k.getBoundingClientRect();
        const mathml = k.querySelector('.katex-mathml');
        const khtml = k.querySelector('.katex-html');
        const mRect = mathml ? mathml.getBoundingClientRect() : null;
        const hRect = khtml ? khtml.getBoundingClientRect() : null;
        const mComp = mathml ? window.getComputedStyle(mathml) : null;
        return {
          katexRect: { w: rect.width, h: rect.height, top: rect.top, left: rect.left },
          mathmlRect: mRect ? { w: mRect.width, h: mRect.height } : null,
          mathmlDisplay: mComp ? mComp.display : null,
          mathmlClip: mComp ? mComp.clip : null,
          mathmlPosition: mComp ? mComp.position : null,
          htmlRect: hRect ? { w: hRect.width, h: hRect.height } : null,
          htmlText: khtml ? khtml.innerText : null,
          htmlChildren: khtml ? Array.from(khtml.children).map(c => ({ className: c.className, text: c.innerText })) : []
        };
      });
    })()`);
    console.log('Visual elements breakdown:', JSON.stringify(vis, null, 2));

  } finally {
    try { chromeProcess.kill(); } catch {}
  }
}

main().catch(console.error);
