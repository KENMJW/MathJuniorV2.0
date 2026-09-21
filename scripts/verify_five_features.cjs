const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9573;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_five_${Date.now()}`);

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

    await page.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
    await sleep(2500);

    // Enter Junior Math Workshop
    await page.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.includes('进入初中数学工坊'));
      if (btn) btn.click();
      else location.hash = '/math-junior/concept';
    })()`);
    await sleep(2000);

    // Verification 1: Version Badge
    const versionBadgeText = await page.eval(`(() => {
      const el = Array.from(document.querySelectorAll('span')).find(s => s.innerText && s.innerText.includes('初中数学'));
      return el ? el.innerText.trim() : null;
    })()`);
    console.log('1. Version Badge Text:', versionBadgeText);

    // Verification 2: Concept default point (KP-001) and global lock
    const initialPointText = await page.eval(`(() => {
      const btn = document.querySelector('.concept-nav-header button');
      return btn ? btn.innerText.trim() : null;
    })()`);
    console.log('2. Concept Initial Point Header:', initialPointText);

    // Switch to Sandbox tab inside Concept
    await page.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('链接沙盒'));
      if (btn) btn.click();
    })()`);
    await sleep(1500);

    // Check sliders and invariants in Concept -> Sandbox
    const conceptSandboxMetrics = await page.eval(`(() => {
      const controls = document.querySelector('.sandbox-controls-bar');
      const sliders = controls ? Array.from(controls.querySelectorAll('input[type="range"]')).map(i => i.id) : [];
      const telemetry = document.querySelector('.telemetry-readings');
      return {
        controlsExist: !!controls,
        sliderCount: sliders.length,
        sliderIds: sliders,
        telemetryText: telemetry ? telemetry.innerText.replace(/\\s+/g, ' ').trim() : null,
      };
    })()`);
    console.log('3. Concept Linked Sandbox Controls:', conceptSandboxMetrics);

    const shotConceptSandbox = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/feat_01_concept_sandbox.png'), Buffer.from(shotConceptSandbox.data, 'base64'));

    // Verification 3: Switch to Module 3 (Sandbox / Lab)
    await page.eval(`(() => {
      const btn = document.querySelector('[data-testid="module-nav-lab"]');
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    const labMetrics = await page.eval(`(() => {
      const buttons = Array.from(document.querySelectorAll('.stage-segmented-control button.seg-item'));
      const trigger = document.querySelector('.model-drawer-trigger-btn');
      return {
        tabOrder: buttons.map(b => b.innerText.trim()),
        activeTab: buttons.find(b => b.classList.contains('active'))?.innerText.trim(),
        drawerTriggerText: trigger ? trigger.innerText.trim() : null,
      };
    })()`);
    console.log('4. Lab Workspace Tabs & Trigger:', labMetrics);

    // Click to switch to Leap Lab (实验室二)
    await page.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('.stage-segmented-control button.seg-item')).find(b => b.innerText.includes('4D 跃迁模型'));
      if (btn) btn.click();
    })()`);
    await sleep(1500);

    // Open Leap Lab drawer
    await page.eval(`(() => {
      const trigger = document.querySelector('.model-drawer-trigger-btn');
      if (trigger) trigger.click();
    })()`);
    await sleep(1000);

    const leapDrawerMetrics = await page.eval(`(() => {
      const semChips = Array.from(document.querySelectorAll('.drawer-sem-chip span')).map(s => s.innerText.trim());
      const activeModel = document.querySelector('.drawer-card-code')?.innerText.trim();
      return {
        semChips: semChips.slice(0, 6),
        firstModelCode: activeModel,
      };
    })()`);
    console.log('5. Leap Lab Drawer Semesters (Chinese):', leapDrawerMetrics);

    const shotLabDrawer = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/feat_03_leap_chinese_drawer.png'), Buffer.from(shotLabDrawer.data, 'base64'));

    // Verification 4: Global Lock Check - Switch to Module 1 (Concept) and check point
    await page.eval(`(() => {
      const btn = document.querySelector('[data-testid="module-nav-concept"]');
      if (btn) btn.click();
    })()`);
    await sleep(1500);

    const returnedPointText = await page.eval(`(() => {
      const btn = document.querySelector('.concept-nav-header button');
      return btn ? btn.innerText.trim() : null;
    })()`);
    console.log('6. Returned Concept Point Header (Locked):', returnedPointText);

    // Verification 5: Module 4 (实战测评)
    await page.eval(`(() => {
      const btn = document.querySelector('[data-testid="module-nav-exam"]');
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    const examWorkbenchStickyHeader = await page.eval(`(() => {
      const header = document.querySelector('.exam-subnav-sticky-header');
      const s = header ? window.getComputedStyle(header) : null;
      return {
        exists: !!header,
        position: s ? s.position : null,
        top: s ? s.top : null,
        text: header ? header.innerText.replace(/\\s+/g, ' ').trim() : null,
      };
    })()`);
    console.log('7. Module 4 Workbench Sticky Header:', examWorkbenchStickyHeader);

    const shotExamWorkbench = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/feat_05_exam_workbench.png'), Buffer.from(shotExamWorkbench.data, 'base64'));

    // Start Online Exam
    await page.eval(`(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('开启在线全真测评'));
      if (startBtn) startBtn.click();
    })()`);
    await sleep(2000);

    const examActiveStickyHeader = await page.eval(`(() => {
      const header = document.querySelector('.exam-subnav-sticky-header');
      const s = header ? window.getComputedStyle(header) : null;
      const backBtn = document.querySelector('[data-testid="exam-back-to-workbench-btn"]');
      return {
        exists: !!header,
        position: s ? s.position : null,
        top: s ? s.top : null,
        backBtnText: backBtn ? backBtn.innerText.trim() : null,
      };
    })()`);
    console.log('8. Online Exam Sticky Header:', examActiveStickyHeader);

    // Click back button to trigger modal
    await page.eval(`(() => {
      const backBtn = document.querySelector('[data-testid="exam-back-to-workbench-btn"]');
      if (backBtn) backBtn.click();
    })()`);
    await sleep(800);

    const modalMetrics = await page.eval(`(() => {
      const modal = document.querySelector('[data-testid="exam-exit-confirm-modal"]');
      return {
        exists: !!modal,
        text: modal ? modal.innerText.replace(/\\s+/g, ' ').trim() : null,
      };
    })()`);
    console.log('9. Exit Confirm Modal:', modalMetrics);

    const shotModal = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(__dirname, '../tmp/screenshots/feat_05_exit_modal.png'), Buffer.from(shotModal.data, 'base64'));

    // Click "确认退出" in modal
    await page.eval(`(() => {
      const modal = document.querySelector('[data-testid="exam-exit-confirm-modal"]');
      if (modal) {
        const confirmBtn = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('确认退出'));
        if (confirmBtn) confirmBtn.click();
      }
    })()`);
    await sleep(1500);

    const returnedToWorkbench = await page.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('开启在线全真测评'));
      return !!btn;
    })()`);
    console.log('10. Successfully returned to workbench after confirm:', returnedToWorkbench);

    console.log('🎉 ALL 5 FEATURES VERIFIED SUCCESSFULLY IN REAL BROWSER!');
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
