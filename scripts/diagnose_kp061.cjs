const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9557;
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
    console.log('Targets found:', targets.map(t => ({ type: t.type, url: t.url })));

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No valid page target with webSocketDebuggerUrl found');
    }

    console.log('Connecting to target:', pageTarget.url, 'ws:', pageTarget.webSocketDebuggerUrl);
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    console.log('Navigating to http://localhost:4173/#/math-junior/concept ...');
    await client.send('Page.navigate', { url: 'http://localhost:4173/#/math-junior/concept' });
    await sleep(3000);

    const curUrl = await client.eval('window.location.href');
    console.log('Loaded URL:', curUrl);

    // 确保抽屉打开并搜索 KP-061
    const openDrawer = await client.eval(`(() => {
      const trigger = document.querySelector('[data-testid="concept-drawer-trigger"]');
      if (trigger) {
        trigger.click();
        return 'Trigger clicked';
      }
      return 'Trigger not found';
    })()`);
    console.log('Drawer trigger:', openDrawer);
    await sleep(500);

    // 在搜索框输入 KP-061
    const searchKp = await client.eval(`(() => {
      const input = document.querySelector('[data-testid="concept-search-input"]');
      if (input) {
        // 设置 value 并派发 input 事件
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, 'KP-061');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return 'Input set to KP-061';
      }
      return 'Search input not found';
    })()`);
    console.log('Search KP-061:', searchKp);
    await sleep(800);

    // 点击搜索结果中的 KP-061
    const clickKp = await client.eval(`(() => {
      const kp = document.querySelector('[data-point-id="KP-061"]') ||
                 Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && el.textContent.includes('KP-061'));
      if (kp) {
        kp.click();
        return 'KP-061 clicked: ' + kp.textContent.slice(0, 30);
      }
      return 'KP-061 not found in search results';
    })()`);
    console.log('Click KP-061:', clickKp);
    await sleep(1000);

    // 点击第 4 段 (本体辨正)
    const clickStage4 = await client.eval(`(() => {
      const btn4 = document.querySelector('[data-stage-btn="4"]');
      if (btn4) {
        btn4.click();
        return 'Stage 4 button clicked';
      }
      return 'Stage 4 button not found';
    })()`);
    console.log('Click Stage 4:', clickStage4);
    await sleep(800);

    // 检查第 4 段 DOM 结构
    const stage4Dom = await client.eval(`(() => {
      const container = document.querySelector('[data-testid="stage-content-4"]') ||
                        document.querySelector('.stage-text-body');
      if (!container) return { error: 'Stage 4 container not found' };

      // 提取文字与 LaTeX 渲染元素
      const mathEls = Array.from(container.querySelectorAll('.katex, .math-error'));
      const text = container.innerText;
      const html = container.innerHTML;

      return {
        textSlice: text.slice(0, 500),
        mathCount: mathEls.length,
        mathSnippets: mathEls.map(m => ({
          tag: m.tagName,
          className: m.className,
          text: m.innerText,
          html: m.outerHTML.slice(0, 200)
        })),
        fullHtml: html
      };
    })()`);

    console.log('\n=== Stage 4 DOM Analysis ===');
    console.log('Text content:', stage4Dom ? stage4Dom.textSlice : 'null');
    console.log('Math count:', stage4Dom ? stage4Dom.mathCount : 'null');
    if (stage4Dom && stage4Dom.mathSnippets) {
      console.log('Math snippets:');
      stage4Dom.mathSnippets.forEach((s, idx) => console.log(`  [${idx}] text="${s.text}" class="${s.className}"`));
    }

    // 检查第 3 段 (法典严定)
    const clickStage3 = await client.eval(`(() => {
      const btn3 = document.querySelector('[data-stage-btn="3"]');
      if (btn3) {
        btn3.click();
        return 'Stage 3 button clicked';
      }
      return 'Stage 3 button not found';
    })()`);
    console.log('\nClick Stage 3:', clickStage3);
    await sleep(800);

    const stage3Dom = await client.eval(`(() => {
      const container = document.querySelector('[data-testid="stage-content-3"]') ||
                        document.querySelector('.stage-text-body');
      if (!container) return { error: 'Stage 3 container not found' };

      const mathEls = Array.from(container.querySelectorAll('.katex, .math-error'));
      return {
        textSlice: container.innerText.slice(0, 500),
        mathCount: mathEls.length,
        mathSnippets: mathEls.map(m => ({
          tag: m.tagName,
          className: m.className,
          text: m.innerText,
          html: m.outerHTML.slice(0, 200)
        }))
      };
    })()`);
    console.log('Stage 3 DOM:', JSON.stringify(stage3Dom, null, 2));

    // 检查是否有 KaTeX CSS 文件加载
    const katexCssCheck = await client.eval(`(() => {
      const styleSheets = Array.from(document.styleSheets).map(s => s.href || 'inline');
      const testEl = document.createElement('span');
      testEl.className = 'katex';
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const font = computed.fontFamily;
      document.body.removeChild(testEl);
      return {
        styleSheets: styleSheets.slice(0, 10),
        katexFont: font
      };
    })()`);
    console.log('\nKaTeX CSS / Font Check:', katexCssCheck);

    // 截图保存
    const screenshotPath = path.resolve(__dirname, '../tmp/kp061_diagnosis.png');
    await client.captureScreenshot(screenshotPath);
    console.log('\nScreenshot saved to:', screenshotPath);

    console.log('\n=== Console Logs ===');
    client.consoleLogs.forEach(l => console.log(l));
    console.log('=== Console Errors ===');
    client.errors.forEach(e => console.error(e));

  } catch (e) {
    console.error('Error during execution:', e);
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
  console.error('Diagnostic failed:', err);
  process.exit(1);
});
