const { spawn } = require('child_process');
const fs = require('fs');

async function check() {
  const PORT = 9563;
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=/tmp/test_chrome_' + Date.now(),
    '--headless=new',
    'about:blank'
  ]);
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/json/version');
      if (res.ok) break;
    } catch (e) {}
  }
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

  // Follow the EXACT flow of e2e_task0009_acceptance:
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/#/math-junior/concept' });
  await new Promise(r => setTimeout(r, 3000));
  await send('Runtime.evaluate', { expression: '(() => { const b = Array.from(document.querySelectorAll("button, a, div")).find(el => el.innerText && el.innerText.includes("进入初中数学工坊")); if (b) b.click(); })()' });
  await new Promise(r => setTimeout(r, 1500));

  await send('Page.navigate', { url: 'http://127.0.0.1:4173/#/math-junior/exam' });
  await new Promise(r => setTimeout(r, 3500));
  await send('Runtime.evaluate', { expression: '(() => { const b = Array.from(document.querySelectorAll("button")).find(el => el.innerText.includes("开启在线全真测评")); if (b) b.click(); })()' });
  await new Promise(r => setTimeout(r, 3000));
  await send('Runtime.evaluate', { expression: '(() => { const b = Array.from(document.querySelectorAll("button")).find(el => el.innerText.includes("立即交卷")); if (b) b.click(); })()' });
  await new Promise(r => setTimeout(r, 2500));

  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      const allText = document.body.innerText;
      const re = /\\$[a-zA-Z0-9_{}\\\\^]/g;
      let m;
      const matches = [];
      while ((m = re.exec(allText)) !== null) {
        const start = Math.max(0, m.index - 60);
        const end = Math.min(allText.length, m.index + 60);
        matches.push({
          index: m.index,
          match: m[0],
          context: allText.slice(start, end)
        });
      }

      // Also let's find the exact DOM elements containing '$'
      const domMatches = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue && node.nodeValue.includes('$')) {
          domMatches.push({
            value: node.nodeValue,
            parentTag: node.parentElement ? node.parentElement.tagName : null,
            parentClass: node.parentElement ? node.parentElement.className : null,
            parentOuter: node.parentElement ? node.parentElement.outerHTML.slice(0, 200) : null
          });
        }
      }

      return {
        textMatchCount: matches.length,
        matches,
        domMatchCount: domMatches.length,
        domMatches
      };
    })()`,
    returnByValue: true
  });

  console.log('Diagnosis Result:', JSON.stringify(diag.result.value, null, 2));
  chromeProcess.kill();
}
check().catch(console.error);
