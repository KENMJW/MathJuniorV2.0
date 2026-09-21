const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9615;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_test_${Date.now()}`);

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
    console.log('📸 截图已保存:', outputPath);
  }
}

async function run() {
  if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });

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
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
    await sleep(2000);

    // 从门户进入初中数学
    await client.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.includes('进入初中数学工坊'));
      if (btn) btn.click();
      else location.hash = '/math-junior/concept';
    })()`);
    await sleep(1500);

    // 切换到模块四: 实战测评
    await client.eval(`(() => {
      const tab = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('实战测评') || b.innerText.includes('百炼成钢')));
      if (tab) tab.click();
    })()`);
    await sleep(1500);

    // 截图 1：图二二级菜单对齐与冗余删除后
    await client.captureScreenshot('tmp/screenshots/verify_exam_subnav_aligned.png');

    // 滚动到最底部并点击“开启在线全真测评 (限时答题)”
    const examStartInfo = await client.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const onlineBtn = btns.find(b => b.textContent && b.textContent.includes('开启在线全真测评'));
      if (!onlineBtn) return { status: 'not_found', allButtons: btns.map(b => b.textContent.trim().slice(0, 25)) };
      const disabled = onlineBtn.disabled;
      onlineBtn.click();
      return { status: 'clicked', disabled };
    })()`);
    console.log('Exam start info:', examStartInfo);
    await sleep(2500);

    // 点击返回出题中心触发二次确认弹窗
    const backInfo = await client.eval(`(() => {
      const btn = document.querySelector('[data-testid="exam-back-to-workbench-btn"]');
      if (!btn) return { status: 'back_not_found', htmlSnippet: document.body.innerHTML.slice(0, 200) };
      btn.click();
      return { status: 'back_clicked' };
    })()`);
    console.log('Back button info:', backInfo);
    await sleep(800);

    // 截图 2：退出确认弹窗视口居中
    await client.captureScreenshot('tmp/screenshots/verify_exam_exit_modal_centered.png');

    client.ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
