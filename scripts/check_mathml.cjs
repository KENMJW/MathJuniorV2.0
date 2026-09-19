const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9560;
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

    await evaluate("document.querySelector('[data-stage-btn=\"4\"]')?.click()");
    await sleep(1000);

    const mathmlStyles = await evaluate(`(() => {
      const mathml = document.querySelector('.katex-mathml');
      if (!mathml) return { error: 'no katex-mathml found' };
      const comp = window.getComputedStyle(mathml);
      return {
        display: comp.display,
        clip: comp.clip,
        position: comp.position,
        width: comp.width,
        height: comp.height,
        overflow: comp.overflow,
        visibility: comp.visibility,
        opacity: comp.opacity
      };
    })()`);
    console.log('katex-mathml computed styles:', JSON.stringify(mathmlStyles, null, 2));

    const htmlStyles = await evaluate(`(() => {
      const kHtml = document.querySelector('.katex-html');
      if (!kHtml) return { error: 'no katex-html found' };
      const comp = window.getComputedStyle(kHtml);
      return {
        display: comp.display,
        visibility: comp.visibility,
        opacity: comp.opacity
      };
    })()`);
    console.log('katex-html computed styles:', JSON.stringify(htmlStyles, null, 2));

  } finally {
    try { chromeProcess.kill(); } catch {}
  }
}

main().catch(console.error);
