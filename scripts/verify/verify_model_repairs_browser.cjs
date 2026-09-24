const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9598;
const USER_DATA_DIR = path.resolve(__dirname, `../../tmp/chrome_model_repair_${Date.now()}`);
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

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      fromSurface: true,
    });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(OUT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    fs.writeFileSync(artifactPath, buf);
    console.log(`[CDP] Saved screenshot: ${filename} (${buf.length} bytes)`);
    return outPath;
  }
}

async function getPageWsUrl(port, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      let page = targets.find((t) => t.type === 'page');
      if (!page) {
        page = await fetch(`http://127.0.0.1:${port}/json/new`).then((r) => r.json());
      }
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      await sleep(300);
    }
  }
  throw new Error('Failed to obtain page WebSocket debugger URL from Chrome');
}

async function run() {
  console.log('>>> [START E2E VERIFICATION] Launching Headless Chrome...');
  const chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const wsUrl = await getPageWsUrl(PORT);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('[E2E] Navigating to http://localhost:5173/#/math-junior/concept ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#/math-junior/concept' });
    await sleep(3500);

    // =========================================================================
    // 1. KP-057 (勾股定理): 验证 Step 3 Live HUD 恒等对比 (a²+b² ≡ c²)
    // =========================================================================
    console.log('\n[E2E 1] Selecting KP-057 (Pythagorean Theorem)...');
    await client.eval(`
      (() => {
        const drawerBtn = document.querySelector('[data-testid="concept-drawer-trigger"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('选择考点') || b.textContent.includes('KP-')));
        if (drawerBtn) drawerBtn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const input = document.querySelector('input[placeholder*="搜索"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(input, 'KP-057');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const item = document.querySelector('[data-testid="search-item-KP-057"]') || Array.from(document.querySelectorAll('div, button')).find(el => el.textContent && el.textContent.includes('KP-057') && el.textContent.includes('勾股定理'));
        if (item) item.click();
      })()
    `);
    await sleep(1000);

    await client.eval(`
      (() => {
        const closeBtn = document.querySelector('[data-testid="drawer-close-btn"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(800);

    console.log('[E2E 1] Switching to Linked Sandbox Tab...');
    await client.eval(`
      (() => {
        const sandboxTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('链接沙盒') || b.textContent.includes('动力沙盒')));
        if (sandboxTab) sandboxTab.click();
      })()
    `);
    await sleep(2000);

    console.log('[E2E 1] Clicking Step 3 button (KP-057 Step 3)...');
    await client.eval(`
      (() => {
        const step3Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('步骤 3') || b.textContent.includes('Step 3')));
        if (step3Btn) step3Btn.click();
      })()
    `);
    await sleep(1500);

    console.log('[E2E 1] Capturing verify_kp057_hud_step3.png ...');
    await client.captureScreenshot('verify_kp057_hud_step3.png');

    // =========================================================================
    // 2. KP-057 (勾股定理): 验证 Step 2 赵爽弦图模式 (view_mode = 2)
    // =========================================================================
    console.log('\n[E2E 2] Clicking Step 2 button (KP-057 Step 2 Zhao Shuang)...');
    await client.eval(`
      (() => {
        const step2Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('步骤 2') || b.textContent.includes('Step 2')));
        if (step2Btn) step2Btn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const slider = document.querySelector('#linked-slider-view_mode') || document.querySelector('input[id*="view_mode"]');
        if (slider) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(slider, '2');
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(1500);

    console.log('[E2E 2] Capturing verify_kp057_zhaoshuang_step2.png ...');
    await client.captureScreenshot('verify_kp057_zhaoshuang_step2.png');

    // =========================================================================
    // 3. KP-053 (等腰三角形): 验证 Step 2 轴对称对折动画 (fold_t = 0.8)
    // =========================================================================
    console.log('\n[E2E 3] Selecting KP-053 (Isosceles Triangle)...');
    await client.eval(`
      (() => {
        const drawerBtn = document.querySelector('[data-testid="concept-drawer-trigger"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('选择考点') || b.textContent.includes('KP-')));
        if (drawerBtn) drawerBtn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const input = document.querySelector('input[placeholder*="搜索"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(input, 'KP-053');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const item = document.querySelector('[data-testid="search-item-KP-053"]') || Array.from(document.querySelectorAll('div, button')).find(el => el.textContent && el.textContent.includes('KP-053') && el.textContent.includes('等腰三角形'));
        if (item) item.click();
      })()
    `);
    await sleep(1000);

    await client.eval(`
      (() => {
        const closeBtn = document.querySelector('[data-testid="drawer-close-btn"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(800);

    // 切换到「链接沙盒」Tab
    console.log('[E2E 3] Switching to Linked Sandbox Tab for KP-053...');
    await client.eval(`
      (() => {
        const sandboxTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('链接沙盒') || b.textContent.includes('动力沙盒')));
        if (sandboxTab) sandboxTab.click();
      })()
    `);
    await sleep(2000);

    console.log('[E2E 3] Clicking Step 2 button (KP-053 Step 2 Fold)...');
    await client.eval(`
      (() => {
        const step2Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('步骤 2') || b.textContent.includes('Step 2')));
        if (step2Btn) step2Btn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const slider = document.querySelector('#linked-slider-fold_t') || document.querySelector('input[id*="fold_t"]');
        if (slider) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(slider, '0.8');
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(1500);

    console.log('[E2E 3] Capturing verify_kp053_fold_step2.png ...');
    await client.captureScreenshot('verify_kp053_fold_step2.png');

    // =========================================================================
    // 4. KP-055 (等边三角形): 验证 Step 3 四心双圆 (show_dual_circles = 1)
    // =========================================================================
    console.log('\n[E2E 4] Selecting KP-055 (Equilateral Triangle)...');
    await client.eval(`
      (() => {
        const drawerBtn = document.querySelector('[data-testid="concept-drawer-trigger"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('选择考点') || b.textContent.includes('KP-')));
        if (drawerBtn) drawerBtn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const input = document.querySelector('input[placeholder*="搜索"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(input, 'KP-055');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const item = document.querySelector('[data-testid="search-item-KP-055"]') || Array.from(document.querySelectorAll('div, button')).find(el => el.textContent && el.textContent.includes('KP-055') && el.textContent.includes('等边三角形'));
        if (item) item.click();
      })()
    `);
    await sleep(1000);

    await client.eval(`
      (() => {
        const closeBtn = document.querySelector('[data-testid="drawer-close-btn"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(800);

    // 切换到「链接沙盒」Tab
    console.log('[E2E 4] Switching to Linked Sandbox Tab for KP-055...');
    await client.eval(`
      (() => {
        const sandboxTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('链接沙盒') || b.textContent.includes('动力沙盒')));
        if (sandboxTab) sandboxTab.click();
      })()
    `);
    await sleep(2000);

    console.log('[E2E 4] Clicking Step 3 button (KP-055 Step 3 Dual Circles)...');
    await client.eval(`
      (() => {
        const step3Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('步骤 3') || b.textContent.includes('Step 3')));
        if (step3Btn) step3Btn.click();
      })()
    `);
    await sleep(800);

    await client.eval(`
      (() => {
        const slider = document.querySelector('#linked-slider-show_dual_circles') || document.querySelector('input[id*="show_dual_circles"]');
        if (slider) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(slider, '1');
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(1500);

    console.log('[E2E 4] Capturing verify_kp055_dual_circles_step3.png ...');
    await client.captureScreenshot('verify_kp055_dual_circles_step3.png');

    // =========================================================================
    // 5. 导航到 4D 跃迁沙盒 (Module 3 / lab): 验证 LM-8A-09 (倍长中线)
    // =========================================================================
    console.log('\n[E2E 5] Navigating to http://localhost:5173/#/math-junior/lab ...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/#/math-junior/lab' });
    await sleep(3500);

    // 切换到「4D 跃迁模型 (实验室二)」Tab
    console.log('[E2E 5] Switching to 4D Leap Models tab...');
    await client.eval(`
      (() => {
        const leapTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('4D 跃迁模型') || b.textContent.includes('4D Leap Models')));
        if (leapTab) leapTab.click();
      })()
    `);
    await sleep(1500);

    // 先为 LM-7A-01 点击 Stage 2 并截屏
    console.log('[E2E 5] Capturing verify_lm7a01_axis_step2.png for LM-7A-01...');
    await client.eval(`
      (() => {
        const stage2Btn = Array.from(document.querySelectorAll('.nav-pill-btn')).find(b => b.textContent && (b.textContent.includes('②') || b.textContent.includes('动态变异') || b.textContent.includes('Variation')));
        if (stage2Btn) stage2Btn.click();
      })()
    `);
    await sleep(1500);
    await client.captureScreenshot('verify_lm7a01_axis_step2.png');

    // 展开模型抽屉选择 LM-8A-09
    console.log('[E2E 5] Opening Model Drawer in LabWorkspace...');
    await client.eval(`
      (() => {
        const trigger = document.querySelector('.model-drawer-trigger-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('选择模型'));
        if (trigger) trigger.click();
      })()
    `);
    await sleep(1000);

    // 点击 8上 学期标签 (筛选出 LM-8A 模型列表)
    console.log('[E2E 5] Selecting 8上 semester in drawer...');
    await client.eval(`
      (() => {
        const chip8A = Array.from(document.querySelectorAll('.drawer-sem-chip')).find(b => b.textContent && (b.textContent.includes('8年级上') || b.textContent.includes('8A') || b.textContent.includes('8上')));
        if (chip8A) chip8A.click();
      })()
    `);
    await sleep(1000);

    // 点击 LM-8A-09 模型卡片
    console.log('[E2E 5] Selecting LM-8A-09 model card...');
    const cardSelected = await client.eval(`
      (() => {
        if (window.__sessionStore) {
          window.__sessionStore.getState().setSelectedLeapModelId('LM-8A-09');
        }
        const item = Array.from(document.querySelectorAll('button.drawer-model-card, button')).find(el => el.textContent && (el.textContent.includes('LM-8A-09') || el.textContent.includes('倍长中线')));
        if (item) {
          item.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('[E2E 5] Card clicked status:', cardSelected);
    await sleep(1500);

    // 关闭抽屉 (如果仍然打开)
    await client.eval(`
      (() => {
        const closeBtn = document.querySelector('.drawer-close-btn');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(1000);

    // 点击 Stage 2 按钮
    console.log('[E2E 5] Clicking Stage 2 (倍长中线 SAS 构造全等)...');
    await client.eval(`
      (() => {
        const stage2Btn = Array.from(document.querySelectorAll('.nav-pill-btn')).find(b => b.textContent && (b.textContent.includes('②') || b.textContent.includes('动态变异') || b.textContent.includes('Variation')));
        if (stage2Btn) stage2Btn.click();
      })()
    `);
    await sleep(1500);

    // 截屏 5: LM-8A-09 步骤 2 现场
    console.log('[E2E 5] Capturing verify_lm8a09_median_step2.png ...');
    await client.captureScreenshot('verify_lm8a09_median_step2.png');

    console.log('\n>>> [E2E SUCCESS] All 6 visual screenshots captured successfully!');
  } finally {
    chromeProc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('[E2E Error]:', err);
  process.exit(1);
});
