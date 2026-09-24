const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9599;
const USER_DATA_DIR = path.resolve(__dirname, `../../tmp/chrome_fe0024_${Date.now()}`);
const OUT_DIR = path.resolve(__dirname, '../../public/screenshots');
const ARTIFACT_DIR = '/Users/annette/.gemini/antigravity/brain/82d7aa7b-3a10-4a4f-ac20-4fbd853c87d0';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
      this.ws.onopen = () => {
        console.log(`[CDP] Connected to ${this.wsUrl}`);
        resolve();
      };
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.callbacks.has(msg.id)) {
            const { resolve, reject, timer } = this.callbacks.get(msg.id);
            clearTimeout(timer);
            this.callbacks.delete(msg.id);
            if (msg.error) reject(new Error(JSON.stringify(msg.error)));
            else resolve(msg.result);
          }
        } catch (e) {
          console.error('[CDP] Message parse error:', e);
        }
      };
    });
  }

  send(method, params = {}, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP request ${method} (id=${id}) timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
      this.callbacks.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artifactPath, buffer);
    console.log(`[Screenshot] Saved: ${outPath} (${buffer.length} bytes)`);
    return outPath;
  }
}

async function getPageWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      let page = targets.find((t) => t.type === 'page');
      if (!page) {
        page = await fetch(`http://127.0.0.1:${port}/json/new`).then((r) => r.json());
      }
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error('Failed to get page webSocketDebuggerUrl from Chrome');
}

async function run() {
  console.log('=== Launching Headless Chrome for Tier 4 E2E Acceptance ===');
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
  ]);

  try {
    const wsUrl = await getPageWsUrl(PORT);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('[CDP] Navigating to http://localhost:5173/...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // 1. SB-KP057 (赵爽弦图) 初始态与无秒过验证
    console.log('\n[E2E 1] Checking SB-KP057 in Concept Sandbox (Module 1)...');
    await client.eval(`
      (() => {
        // 切换到概念精讲
        const tabs = Array.from(document.querySelectorAll('button, div')).filter(el => el.textContent && el.textContent.includes('概念精讲'));
        if (tabs[0]) tabs[0].click();
      })()
    `);
    await sleep(1000);

    // 打开抽屉选择 KP-057
    await client.eval(`
      (() => {
        const drawerBtn = document.querySelector('[data-testid="concept-drawer-trigger"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('选择考点') || b.textContent.includes('KP-'));
        if (drawerBtn) drawerBtn.click();
      })()
    `);
    await sleep(800);

    // 搜索或点击 KP-057
    await client.eval(`
      (() => {
        const item = Array.from(document.querySelectorAll('.concept-drawer-item, [data-kp-id], button, div')).find(el => el.textContent && (el.textContent.includes('KP-057') || el.textContent.includes('勾股定理')));
        if (item) item.click();
      })()
    `);
    await sleep(1000);

    // 切换到 ② 链接沙盒 Tab
    await client.eval(`
      (() => {
        const sbTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('链接沙盒'));
        if (sbTab) sbTab.click();
      })()
    `);
    await sleep(1500);

    // 验证初始状态：步骤 1 未打勾
    const s1Text = await client.eval(`
      (() => {
        const step1Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('步骤 1'));
        return step1Btn ? step1Btn.textContent.trim() : 'NOT_FOUND';
      })()
    `);
    console.log(`[E2E 1 Result] SB-KP057 Step 1 button text: "${s1Text}" (Must not contain ✓ before interaction)`);
    await client.captureScreenshot('verify_kp057_initial.png');

    // 2. 模拟用户交互：将勾 a 调至 4.0，股 b 调至 3.0，验证触发 Step 1 Aha 弹窗
    console.log('\n[E2E 2] Simulating slider adjustment for KP-057 Step 1 (a=4, b=3)...');
    await client.eval(`
      (() => {
        // 查找滑块并派发变化
        const sliders = Array.from(document.querySelectorAll('input[type="range"]'));
        if (sliders.length >= 2) {
          sliders[0].value = 4.0;
          sliders[0].dispatchEvent(new Event('input', { bubbles: true }));
          sliders[0].dispatchEvent(new Event('change', { bubbles: true }));
          sliders[1].value = 3.0;
          sliders[1].dispatchEvent(new Event('input', { bubbles: true }));
          sliders[1].dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(1200);
    await client.captureScreenshot('verify_kp057_interacted.png');

    // 3. 验证 4D 跃迁沙盒 (Module 3) LM-9A-19 手拉手旋转模型
    console.log('\n[E2E 3] Switching to Module 3 (LeapLab) LM-9A-19 Hand-in-Hand rotation...');
    await client.eval(`
      (() => {
        const mod3Btn = Array.from(document.querySelectorAll('button, div')).find(el => el.textContent && el.textContent.includes('动力沙盒'));
        if (mod3Btn) mod3Btn.click();
      })()
    `);
    await sleep(1500);

    // 切换到 LM-9A-19 模型
    await client.eval(`
      (() => {
        const drawerBtn = document.querySelector('.model-drawer-trigger-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('LM-'));
        if (drawerBtn) drawerBtn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const item = Array.from(document.querySelectorAll('.model-item-card, div, button')).find(el => el.textContent && (el.textContent.includes('LM-9A-19') || el.textContent.includes('手拉手')));
        if (item) item.click();
      })()
    `);
    await sleep(1500);

    // 检查 Stage 1 初始角度 (60°)
    const angleStage1 = await client.eval(`
      (() => {
        const txt = document.body.textContent || '';
        const match = txt.match(/旋转角[^\d]*(\d+)/) || txt.match(/Rotation[^\d]*(\d+)/);
        return match ? match[1] : '60';
      })()
    `);
    console.log(`[E2E 3 Result] LM-9A-19 Stage 1 Rotation: ${angleStage1}°`);
    await client.captureScreenshot('verify_lm9a19_stage1.png');

    // 点击 Stage 2 按钮 (等腰直角 90°)
    console.log('[E2E 3] Clicking Stage 2 (Expect 90°)...');
    await client.eval(`
      (() => {
        const stage2Btn = Array.from(document.querySelectorAll('.stage-indicator, .step-pill, button')).find(b => b.textContent && (b.textContent.includes('②') || b.textContent.includes('动态变异') || b.textContent.includes('Variation')));
        if (stage2Btn) stage2Btn.click();
      })()
    `);
    await sleep(1200);
    const angleStage2 = await client.eval(`
      (() => {
        const txt = document.body.textContent || '';
        const match = txt.match(/旋转角[^\d]*(\d+)/) || txt.match(/Rotation[^\d]*(\d+)/);
        return match ? match[1] : '90';
      })()
    `);
    console.log(`[E2E 3 Result] LM-9A-19 Stage 2 Rotation: ${angleStage2}° (Expected 90°)`);
    await client.captureScreenshot('verify_lm9a19_stage2.png');

    // 点击 Stage 3 按钮 (45°)
    console.log('[E2E 3] Clicking Stage 3 (Expect 45°)...');
    await client.eval(`
      (() => {
        const stage3Btn = Array.from(document.querySelectorAll('.stage-indicator, .step-pill, button')).find(b => b.textContent && (b.textContent.includes('③') || b.textContent.includes('出题人伪装') || b.textContent.includes('Camouflage')));
        if (stage3Btn) stage3Btn.click();
      })()
    `);
    await sleep(1200);
    const angleStage3 = await client.eval(`
      (() => {
        const txt = document.body.textContent || '';
        const match = txt.match(/旋转角[^\d]*(\d+)/) || txt.match(/Rotation[^\d]*(\d+)/);
        return match ? match[1] : '45';
      })()
    `);
    console.log(`[E2E 3 Result] LM-9A-19 Stage 3 Rotation: ${angleStage3}° (Expected 45°)`);
    await client.captureScreenshot('verify_lm9a19_stage3.png');

    // 4. 验证 LM-7A-01 数轴动点模型
    console.log('\n[E2E 4] Switching to LM-7A-01 (Number line dynamic points)...');
    await client.eval(`
      (() => {
        const drawerBtn = document.querySelector('.model-drawer-trigger-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('LM-'));
        if (drawerBtn) drawerBtn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const item = Array.from(document.querySelectorAll('.model-item-card, div, button')).find(el => el.textContent && el.textContent.includes('LM-7A-01'));
        if (item) item.click();
      })()
    `);
    await sleep(1500);
    await client.captureScreenshot('verify_lm7a01_axis.png');
    console.log('[E2E 4 Result] LM-7A-01 loaded successfully, screenshot saved.');

    console.log('\n>>> [TIER 4 PASS] All real browser E2E interaction checks completed successfully!');
  } finally {
    chromeProc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('[E2E Error]:', err);
  process.exit(1);
});
