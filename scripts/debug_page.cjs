const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9589;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_dbg_${Date.now()}`);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA_DIR}`,
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

    const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
    let pageTarget = targets.find((t) => t.type === 'page');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[Console Log]', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[Browser Exception]', JSON.stringify(msg.params.exceptionDetails));
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('Navigating to http://127.0.0.1:4173 ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173' });
    await sleep(3000);

    const evalRes1 = await send('Runtime.evaluate', {
      expression: '({ href: location.href, title: document.title, bodyText: document.body.innerText.slice(0, 500) })',
      returnByValue: true,
    });
    console.log('Result at root:', evalRes1.result.value);

    console.log('Navigating to http://127.0.0.1:4173/#/math-junior/sandbox ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/#/math-junior/sandbox' });
    await sleep(3000);

    const evalRes2 = await send('Runtime.evaluate', {
      expression: '({ href: location.href, title: document.title, bodyText: document.body.innerText.slice(0, 500) })',
      returnByValue: true,
    });
    console.log('Result at #/math-junior/sandbox:', evalRes2.result.value);

  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
