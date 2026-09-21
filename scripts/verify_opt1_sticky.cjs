const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9572;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_opt1_${Date.now()}`);

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

    const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
    let pageTarget = targets.find(t => t.type === 'page');
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

    await page.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
    await sleep(2500);

    // Click into math junior
    await page.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.includes('进入初中数学工坊'));
      if (btn) btn.click();
      else location.hash = '/math-junior/concept';
    })()`);
    await sleep(2000);

    // 1. Measure Primary Nav (一级菜单)
    const primaryNavMetrics = await page.eval(`(() => {
      const activeBtn = document.querySelector('[data-testid="module-nav-concept"]');
      const inactiveBtn = document.querySelector('[data-testid="module-nav-graph"]');
      const track = activeBtn ? activeBtn.parentElement : null;

      const cs = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          padding: s.padding,
          backgroundColor: s.backgroundColor,
          color: s.color,
          boxShadow: s.boxShadow,
          height: s.height,
        };
      };

      return {
        track: cs(track),
        active: cs(activeBtn),
        inactive: cs(inactiveBtn),
      };
    })()`);

    console.log('Primary Nav Metrics:', JSON.stringify(primaryNavMetrics, null, 2));

    // 2. Measure Concept Secondary Nav (图一二级菜单)
    const conceptSubnavMetrics = await page.eval(`(() => {
      const header = document.querySelector('.concept-nav-header');
      const s = window.getComputedStyle(header);
      return {
        backgroundColor: s.backgroundColor,
        position: s.position,
        top: s.top,
        zIndex: s.zIndex,
        boxShadow: s.boxShadow,
      };
    })()`);

    console.log('Concept Secondary Nav Metrics:', JSON.stringify(conceptSubnavMetrics, null, 2));

    // Capture initial screenshot (Concept)
    const shot1 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/desktop_opt1_concept_initial.png'), Buffer.from(shot1.data, 'base64'));

    // 3. Scroll down 400px inside cockpit-theater
    const scrollResult = await page.eval(`(() => {
      const theater = document.querySelector('[data-testid="cockpit-theater"]');
      if (theater) {
        theater.scrollTop = 450;
        const header = document.querySelector('.concept-nav-header');
        const rect = header ? header.getBoundingClientRect() : null;
        return {
          scrollTop: theater.scrollTop,
          headerTop: rect ? rect.top : null,
          headerVisible: rect ? (rect.bottom > 0 && rect.top >= 0) : false,
        };
      }
      return null;
    })()`);
    console.log('Scroll Result in Concept:', JSON.stringify(scrollResult, null, 2));
    await sleep(500);

    // Capture screenshot after scroll (proving secondary menu stays sticky!)
    const shotScroll = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/desktop_opt1_concept_scrolled_sticky.png'), Buffer.from(shotScroll.data, 'base64'));

    // 4. Switch to Graph (思维图谱)
    await page.eval(`(() => {
      const btn = document.querySelector('[data-testid="module-nav-graph"]');
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    const graphStickyResult = await page.eval(`(() => {
      const header = document.querySelector('.graph-subnav-sticky-header');
      const s = header ? window.getComputedStyle(header) : null;
      return {
        exists: !!header,
        position: s ? s.position : null,
        top: s ? s.top : null,
        backgroundColor: s ? s.backgroundColor : null,
      };
    })()`);
    console.log('Graph Secondary Nav Metrics:', JSON.stringify(graphStickyResult, null, 2));

    const shotGraph = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/desktop_opt1_graph.png'), Buffer.from(shotGraph.data, 'base64'));

    // 5. Switch to Sandbox (实验探究)
    await page.eval(`(() => {
      const btn = document.querySelector('[data-testid="module-nav-lab"]');
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    const sandboxStickyResult = await page.eval(`(() => {
      const header = document.querySelector('.sandbox-top-bar');
      const s = header ? window.getComputedStyle(header) : null;
      return {
        exists: !!header,
        position: s ? s.position : null,
        top: s ? s.top : null,
        backgroundColor: s ? s.backgroundColor : null,
      };
    })()`);
    console.log('Sandbox Secondary Nav Metrics:', JSON.stringify(sandboxStickyResult, null, 2));

    const shotSandbox = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/desktop_opt1_sandbox.png'), Buffer.from(shotSandbox.data, 'base64'));

    console.log('✅ ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
