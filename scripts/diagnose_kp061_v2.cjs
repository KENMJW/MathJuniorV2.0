const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9558;
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
    this.errors = [];
    this.consoleLogs = [];
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
        if (msg.method === 'Runtime.consoleAPICalled') {
          const args = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
          this.consoleLogs.push(`[${msg.params.type}] ${args}`);
          if (msg.params.type === 'error') {
            this.errors.push(`Console Error: ${args}`);
          }
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
      expression: `(() => { try { return (${expression}); } catch(e) { return { __error: e.message }; } })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
  }
}

async function main() {
  console.log('Spawning Chrome on port', PORT);
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

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    console.log('Navigating to http://localhost:4173/#/math-junior/concept ...');
    await client.send('Page.navigate', { url: 'http://localhost:4173/#/math-junior/concept' });
    await sleep(3500);

    // 如果仍在门户，点击“进入初中数学工坊”
    const enterMath = await client.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.includes('进入初中数学工坊'));
      if (btn) {
        btn.click();
        return 'Clicked 进入初中数学工坊';
      }
      return 'Already inside or button not needed, hash=' + window.location.hash;
    })()`);
    console.log('Enter Math:', enterMath);
    await sleep(2500);

    // 等待并检查当前页面上的按钮和 testid
    const state = await client.eval(`(() => {
      return {
        hash: window.location.hash,
        hasDrawerTrigger: !!document.querySelector('[data-testid="concept-drawer-trigger"]'),
        triggerText: document.querySelector('[data-testid="concept-drawer-trigger"]')?.innerText,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.slice(0, 20)).slice(0, 15)
      };
    })()`);
    console.log('Page state:', state);

    // 如果未处于 concept，切换到 concept
    await client.eval(`(() => {
      const tab = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('概念精讲') || b.innerText.includes('探本溯源')));
      if (tab) tab.click();
    })()`);
    await sleep(1000);

    // 打开抽屉
    const openDrawer = await client.eval(`(() => {
      const trigger = document.querySelector('[data-testid="concept-drawer-trigger"]');
      if (trigger) {
        trigger.click();
        return 'Trigger clicked';
      }
      return 'Trigger not found';
    })()`);
    console.log('Open drawer:', openDrawer);
    await sleep(800);

    // 在搜索框输入 KP-061
    const searchKp = await client.eval(`(() => {
      const input = document.querySelector('[data-testid="concept-search-input"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'KP-061');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return 'Search input set to KP-061';
      }
      return 'Search input not found';
    })()`);
    console.log('Search KP-061:', searchKp);
    await sleep(800);

    // 点击搜索到的 KP-061 考点
    const clickResult = await client.eval(`(() => {
      const item = document.querySelector('[data-testid="search-item-KP-061"]');
      if (item) {
        item.click();
        return 'KP-061 clicked via testid: ' + item.textContent.slice(0, 40);
      }
      const allSearchItems = Array.from(document.querySelectorAll('[data-testid^="search-item-"]')).map(el => el.getAttribute('data-testid'));
      return 'KP-061 testid not found. Available search-items: ' + allSearchItems.slice(0, 10).join(', ');
    })()`);
    console.log('Click KP-061 result:', clickResult);
    await sleep(1500);

    // 此时当前考点应为 KP-061，检查触发按钮文本
    const currentPointText = await client.eval(`(() => {
      return document.querySelector('[data-testid="concept-drawer-trigger"]')?.innerText;
    })()`);
    console.log('Current point trigger text:', currentPointText);

    // 点击第 4 段 (本体辨正)
    const clickStage4 = await client.eval(`(() => {
      const btn4 = document.querySelector('[data-stage-btn="4"]');
      if (btn4) {
        btn4.click();
        return 'Stage 4 clicked';
      }
      return 'Stage 4 button not found';
    })()`);
    console.log('Click Stage 4:', clickStage4);
    await sleep(1000);

    // 检查第 4 段的详细 DOM 和渲染情况
    const stage4Detail = await client.eval(`(() => {
      const body = document.querySelector('.stage-text-body') || document.querySelector('[data-testid="stage-content-4"]');
      if (!body) return { error: 'Stage 4 body not found' };

      const allMath = Array.from(body.querySelectorAll('.katex, .math-error'));
      const text = body.innerText;
      const html = body.innerHTML;

      return {
        text: text,
        mathCount: allMath.length,
        maths: allMath.map(m => ({
          tag: m.tagName,
          className: m.className,
          innerText: m.innerText,
          outerHTML: m.outerHTML.slice(0, 300)
        })),
        htmlSlice: html.slice(0, 800)
      };
    })()`);

    console.log('\n================== KP-061 STAGE 4 DETAILED DOM ==================');
    console.log('Text:\n', stage4Detail.text);
    console.log('\nMath Elements Count:', stage4Detail.mathCount);
    if (stage4Detail.maths) {
      stage4Detail.maths.forEach((m, idx) => {
        console.log(`\n--- Math [${idx}] ---`);
        console.log('Class:', m.className);
        console.log('InnerText:', JSON.stringify(m.innerText));
        console.log('OuterHTML:', m.outerHTML);
      });
    }

    // 检查第 3 段 (法典严定)
    await client.eval(`(() => {
      document.querySelector('[data-stage-btn="3"]')?.click();
    })()`);
    await sleep(1000);

    const stage3Detail = await client.eval(`(() => {
      const body = document.querySelector('.stage-text-body') || document.querySelector('[data-testid="stage-content-3"]');
      if (!body) return { error: 'Stage 3 body not found' };
      return {
        text: body.innerText,
        mathCount: body.querySelectorAll('.katex, .math-error').length,
        mathSnippets: Array.from(body.querySelectorAll('.katex, .math-error')).map(m => ({
          innerText: m.innerText,
          className: m.className
        }))
      };
    })()`);

    console.log('\n================== KP-061 STAGE 3 DETAILED DOM ==================');
    console.log('Text:\n', stage3Detail.text);
    console.log('Math snippets:', stage3Detail.mathSnippets);

    // 截图
    const screenshotFile = path.resolve(__dirname, '../tmp/kp061_stage4_real.png');
    await client.captureScreenshot(screenshotFile);
    console.log('\nScreenshot saved to:', screenshotFile);

    console.log('\n=== Console Logs ===');
    client.consoleLogs.forEach(l => console.log(l));
    console.log('=== Console Errors ===');
    client.errors.forEach(e => console.error(e));

  } catch (e) {
    console.error('Execution error:', e);
  } finally {
    try { chromeProcess.kill(); } catch {}
    await sleep(800);
    try {
      if (fs.existsSync(USER_DATA_DIR)) {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      }
    } catch {}
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
