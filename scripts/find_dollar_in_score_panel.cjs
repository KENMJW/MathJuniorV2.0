const { spawn } = require('child_process');
const fs = require('fs');

async function check() {
  const PORT = 9562;
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=/tmp/test_chrome_' + Date.now(),
    '--headless=new',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const res = await fetch('http://127.0.0.1:' + PORT + '/json/list');
  const targets = await res.json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      const handler = (event) => {
        const d = JSON.parse(event.data);
        if (d.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.navigate', { url: 'http://127.0.0.1:4173/#/math-junior/exam' });
  await new Promise(r => setTimeout(r, 2500));
  await send('Runtime.evaluate', { expression: '(() => { const b = Array.from(document.querySelectorAll("button")).find(el => el.innerText.includes("开启在线全真测评")); if (b) b.click(); })()' });
  await new Promise(r => setTimeout(r, 2000));
  await send('Runtime.evaluate', { expression: '(() => { const b = Array.from(document.querySelectorAll("button")).find(el => el.innerText.includes("立即交卷")); if (b) b.click(); })()' });
  await new Promise(r => setTimeout(r, 2000));

  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      const allText = document.body.innerText;
      const matches = [];
      const re = /\\$[a-zA-Z0-9_{}\\\\^]/g;
      let m;
      while ((m = re.exec(allText)) !== null) {
        const start = Math.max(0, m.index - 50);
        const end = Math.min(allText.length, m.index + 50);
        matches.push({
          match: m[0],
          snippet: allText.slice(start, end)
        });
      }
      return { count: matches.length, matches };
    })()`,
    returnByValue: true
  });
  console.log('Dollar matches in allText:', JSON.stringify(diag.result.value, null, 2));
  chromeProcess.kill();
}
check().catch(console.error);
