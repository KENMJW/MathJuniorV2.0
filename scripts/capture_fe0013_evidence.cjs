const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9588;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_fe13_${Date.now()}`);
const OUT_DIR = path.resolve(__dirname, '../public/screenshots');
const ARTIFACT_DIR = '/Users/annette/.gemini/antigravity/brain/f6f6b4e5-3581-496f-b725-91fdaed88f14';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

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

  send(method, params = {}, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      const timer = setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`[CDP Timeout] Method ${method} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.callbacks.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(funcStr) {
    const expression = `(() => {
      try {
        ${funcStr}
      } catch (err) {
        return { __error: err.message, __stack: err.stack };
      }
    })()`;
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res && res.result && res.result.value && res.result.value.__error) {
      console.warn(`[Eval Warning]:`, res.result.value.__error);
    }
    return res.result ? res.result.value : null;
  }

  async captureScreenshot(filename) {
    console.log(`[Capture] Taking screenshot for ${filename}...`);
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, buf);

    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(artPath, buf);

    const hash = crypto.createHash('md5').update(buf).digest('hex');
    console.log(`[Captured] ${filename} -> size: ${buf.length} bytes, MD5: ${hash}`);
    return { filename, outPath, artPath, hash, size: buf.length };
  }
}

async function main() {
  console.log('[Init] Launching Chrome headless...');
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1440,900',
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

    console.log('[Navigate] Loading app directly at http://127.0.0.1:4173/#/math-junior/sandbox ...');
    await page.send('Page.navigate', { url: 'http://127.0.0.1:4173/#/math-junior/sandbox' });
    await sleep(3500);

    const evidenceList = [];

    // ==========================================
    // Evidence 1: A5 假按钮已替换为非按钮状态徽章 (带有聚焦光环)
    // ==========================================
    console.log('[Step A5] Capturing status badges in LabWorkspace on SB-KP001 with focus highlight...');
    const badgeInfo = await page.eval(`
      const b1 = document.querySelector('[data-testid="badge-concept-concrete"]');
      const b2 = document.querySelector('[data-testid="badge-viewport-locked"]');
      if (b1) {
        b1.style.outline = '2px solid #2563eb';
        b1.style.boxShadow = '0 0 12px rgba(37,99,235,0.6)';
      }
      if (b2) {
        b2.style.outline = '2px solid #10b981';
        b2.style.boxShadow = '0 0 12px rgba(16,185,129,0.6)';
      }
      return {
        b1Found: !!b1,
        b2Found: !!b2,
        b1Text: b1 ? b1.textContent.trim() : null,
        b2Text: b2 ? b2.textContent.trim() : null,
        b1Tag: b1 ? b1.tagName : null,
        b2Tag: b2 ? b2.tagName : null
      };
    `);
    console.log('[Step A5] Status Badges Verified:', badgeInfo);
    await sleep(500);
    const e1 = await page.captureScreenshot('fe0013_a5_status_badges.png');
    evidenceList.push(e1);

    // 清除聚焦光环，恢复干净画布
    await page.eval(`
      const b1 = document.querySelector('[data-testid="badge-concept-concrete"]');
      const b2 = document.querySelector('[data-testid="badge-viewport-locked"]');
      if (b1) { b1.style.outline = ''; b1.style.boxShadow = ''; }
      if (b2) { b2.style.outline = ''; b2.style.boxShadow = ''; }
    `);
    await sleep(500);

    // ==========================================
    // Evidence 2 & 3: A1 滑块接线调参前 vs 调参后 (SB-KP057 勾股定理)
    // ==========================================
    console.log('[Step A1] Opening concept drawer to pick SB-KP057 (勾股定理)...');
    await page.eval(`
      const btn = document.querySelector('.model-drawer-trigger-btn');
      if (btn) btn.click();
    `);
    await sleep(800);

    await page.eval(`
      const input = document.querySelector('.drawer-search-field');
      if (input) {
        const valSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valSetter.call(input, '勾股');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(800);

    await page.eval(`
      const card = Array.from(document.querySelectorAll('.drawer-model-card')).find(c => 
        (c.textContent && (c.textContent.includes('勾股') || c.textContent.includes('SB-KP057')))
      );
      if (card) card.click();
    `);
    await sleep(2500);

    console.log('[Step A1] Capturing slider before...');
    const e2 = await page.captureScreenshot('fe0013_a1_slider_before.png');
    evidenceList.push(e2);

    console.log('[Step A1] Adjusting slider value with native setter...');
    await page.eval(`
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const valSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valSetter.call(slider, '7');
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await sleep(2000);

    console.log('[Step A1] Capturing slider after...');
    const e3 = await page.captureScreenshot('fe0013_a1_slider_after.png');
    evidenceList.push(e3);

    // ==========================================
    // Evidence 4: A2 圆图元真圆绘制 (SB-KP073 圆周角)
    // ==========================================
    console.log('[Step A2] Opening drawer to select SB-KP073 (圆周角定理)...');
    await page.eval(`
      const btn = document.querySelector('.model-drawer-trigger-btn');
      if (btn) btn.click();
    `);
    await sleep(800);

    await page.eval(`
      const input = document.querySelector('.drawer-search-field');
      if (input) {
        const valSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valSetter.call(input, '圆周角');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(800);

    await page.eval(`
      const card = Array.from(document.querySelectorAll('.drawer-model-card')).find(c => 
        (c.textContent && (c.textContent.includes('圆周角') || c.textContent.includes('SB-KP073')))
      );
      if (card) card.click();
    `);
    await sleep(2500);

    console.log('[Step A2] Capturing SB-KP073 real circle...');
    const e4 = await page.captureScreenshot('fe0013_a2_circle_kp073.png');
    evidenceList.push(e4);

    // ==========================================
    // Switch to Lab 2: 4D 跃迁模型 (LM-8A-01)
    // ==========================================
    console.log('[Step] Switching to 4D 跃迁模型 (实验室二)...');
    await page.eval(`
      const buttons = Array.from(document.querySelectorAll('.stage-segmented-control button, .seg-item'));
      const leapBtn = buttons.find(b => b.textContent && b.textContent.includes('4D 跃迁'));
      if (leapBtn) leapBtn.click();
    `);
    await sleep(2500);

    console.log('[Step A3] Ensuring LM-8A-01 is loaded...');
    await page.eval(`
      const drawerBtn = document.querySelector('.model-drawer-trigger-btn');
      if (drawerBtn) drawerBtn.click();
    `);
    await sleep(800);

    await page.eval(`
      const input = document.querySelector('.drawer-search-field');
      if (input) {
        const valSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valSetter.call(input, 'LM-8A-01');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(800);

    await page.eval(`
      const card = Array.from(document.querySelectorAll('.drawer-model-card')).find(c => 
        c.textContent && c.textContent.includes('LM-8A-01')
      );
      if (card) card.click();
    `);
    await sleep(2500);

    // ==========================================
    // Evidence 5 & 6: A3 姿态变换不撕裂 (LM-8A-01 标准姿态 vs 旋转姿态)
    // ==========================================
    console.log('[Step A3] Capturing standard posture...');
    const e5 = await page.captureScreenshot('fe0013_a3_posture_standard.png');
    evidenceList.push(e5);

    console.log('[Step A3] Switching to rotated posture...');
    await page.eval(`
      const btns = Array.from(document.querySelectorAll('.preset-btn'));
      const rotBtn = btns.find(b => b.textContent && (b.textContent.includes('旋转') || b.textContent.includes('90°') || b.textContent.includes('折叠')));
      if (rotBtn) rotBtn.click();
      else if (btns.length >= 2) btns[1].click();
    `);
    await sleep(2000);

    console.log('[Step A3] Capturing rotated posture...');
    const e6 = await page.captureScreenshot('fe0013_a3_posture_rotated.png');
    evidenceList.push(e6);

    // ==========================================
    // Evidence 7 & 8: A7 X-Ray 开启前 vs 开启后 (在 LM-8A-01 上进行)
    // ==========================================
    console.log('[Step A7] Resetting posture to standard for X-Ray test...');
    await page.eval(`
      const btns = Array.from(document.querySelectorAll('.preset-btn'));
      const stdBtn = btns.find(b => b.textContent && b.textContent.includes('标准'));
      if (stdBtn) stdBtn.click();
      else if (btns.length >= 1) btns[0].click();
    `);
    await sleep(1500);

    console.log('[Step A7] Capturing X-Ray OFF...');
    const e7 = await page.captureScreenshot('fe0013_a7_xray_off.png');
    evidenceList.push(e7);

    console.log('[Step A7] Clicking X-Ray toggle button to turn ON...');
    await page.eval(`
      const btns = Array.from(document.querySelectorAll('.preset-btn'));
      const xrayBtn = btns.find(b => b.textContent && b.textContent.includes('X-Ray'));
      if (xrayBtn) xrayBtn.click();
    `);
    await sleep(2000);

    console.log('[Step A7] Capturing X-Ray ON...');
    const e8 = await page.captureScreenshot('fe0013_a7_xray_on.png');
    evidenceList.push(e8);

    // Turn X-Ray OFF again for subsequent tests
    await page.eval(`
      const btns = Array.from(document.querySelectorAll('.preset-btn'));
      const xrayBtn = btns.find(b => b.textContent && b.textContent.includes('X-Ray'));
      if (xrayBtn) xrayBtn.click();
    `);
    await sleep(1000);

    // ==========================================
    // Evidence 9: A4 抛物线/双曲线渲染通道 (LM-9A-25 抛物线割线)
    // ==========================================
    console.log('[Step A4] Selecting LM-9A-25 (抛物线割线)...');
    await page.eval(`
      const drawerBtn = document.querySelector('.model-drawer-trigger-btn');
      if (drawerBtn) drawerBtn.click();
    `);
    await sleep(800);

    await page.eval(`
      const input = document.querySelector('.drawer-search-field');
      if (input) {
        const valSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valSetter.call(input, 'LM-9A-25');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(800);

    await page.eval(`
      const card = Array.from(document.querySelectorAll('.drawer-model-card')).find(c => 
        c.textContent && (c.textContent.includes('LM-9A-25') || c.textContent.includes('割线') || c.textContent.includes('抛物线'))
      );
      if (card) card.click();
    `);
    await sleep(2500);

    console.log('[Step A4] Capturing parabola curve...');
    const e9 = await page.captureScreenshot('fe0013_a4_parabola_curve.png');
    evidenceList.push(e9);

    // ==========================================
    // Evidence 10: A6 遥测不变量看板 (选用 LM-9B-36 阿氏圆比值模型)
    // ==========================================
    console.log('[Step A6] Selecting LM-9B-36 (阿氏圆比值模型)...');
    await page.eval(`
      const drawerBtn = document.querySelector('.model-drawer-trigger-btn');
      if (drawerBtn) drawerBtn.click();
    `);
    await sleep(800);

    await page.eval(`
      const input = document.querySelector('.drawer-search-field');
      if (input) {
        const valSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valSetter.call(input, 'LM-9B-36');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(800);

    await page.eval(`
      const card = Array.from(document.querySelectorAll('.drawer-model-card')).find(c => 
        c.textContent && (c.textContent.includes('LM-9B-36') || c.textContent.includes('阿氏圆'))
      );
      if (card) card.click();
    `);
    await sleep(2500);

    console.log('[Step A6] Capturing telemetry invariants panel on LM-9B-36...');
    const e10 = await page.captureScreenshot('fe0013_a6_telemetry_invariants.png');
    evidenceList.push(e10);

    console.log('\n======================================================');
    console.log('             MD5 & INTEGRITY VERIFICATION            ');
    console.log('======================================================');
    const hashes = new Set();
    let collision = false;
    evidenceList.forEach((e, idx) => {
      console.log(`[#${idx + 1}] ${e.filename.padEnd(36)} | Size: ${String(e.size).padStart(7)} B | MD5: ${e.hash}`);
      if (hashes.has(e.hash)) {
        collision = true;
        console.error(`❌ COLLISION DETECTED! Duplicate MD5: ${e.hash}`);
      }
      hashes.add(e.hash);
    });

    if (collision) {
      throw new Error('Screenshot verification failed: Duplicate MD5 hashes found!');
    } else {
      console.log(`\n🎉 SUCCESS: ALL ${evidenceList.length} SCREENSHOTS HAVE 100% UNIQUE MD5 HASHES!`);
    }

  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error('[Fatal Error in capture script]:', err);
  process.exit(1);
});
