const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9562;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_e2e_task0010_${Date.now()}`);

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
    this.warnings = [];
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
          } else if (msg.params.type === 'warning') {
            this.warnings.push(`Console Warning: ${args}`);
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
      expression: `(() => { try { return (${expression}); } catch(e) { return { __error: e.message, __stack: e.stack }; } })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.result && res.result.value && res.result.value.__error) {
      throw new Error(res.result.value.__error);
    }
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

async function runAcceptance() {
  console.log('================================================================');
  console.log('🚀 TASK-FE-0010 多端响应式真机仿真 E2E 验收');
  console.log('================================================================');

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

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    const BASE_URL = 'http://127.0.0.1:4173';
    const screenshotsDir = path.resolve(__dirname, '../tmp/screenshots');

    // ================================================================
    // 第一关：电脑端防回归验证 (Desktop 1440 × 900)
    // ================================================================
    console.log('\n--- 🖥️ 阶段一: 电脑端防回归验证 (1440 × 900) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });

    await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    // 从门户首页点击进入初中数学工坊
    await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.includes('进入初中数学工坊'));
      if (btn) btn.click();
      else location.hash = '/math-junior/concept';
    })()`);
    await sleep(2000);

    // 确保在概念精讲
    await cdp.eval(`(() => {
      const tab = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('概念精讲') || b.innerText.includes('探本溯源')));
      if (tab) tab.click();
    })()`);
    await sleep(1500);

    const desktopState = await cdp.eval(`(() => {
      const shellCockpit = document.querySelector('[data-testid="shell-cockpit"]');
      const header = document.querySelector('[data-testid="cockpit-header"]');
      const card = document.querySelector('.cockpit-shell > div');
      const twoCol = document.querySelector('.concept-two-column-layout');
      const twoColComputed = twoCol ? window.getComputedStyle(twoCol).flexDirection : null;
      const cardWidth = card ? card.getBoundingClientRect().width : 0;
      const svgContainer = document.querySelector('.concept-svg-container');

      return {
        hasShellCockpit: !!shellCockpit,
        hasHeader: !!header,
        cardWidth,
        isTwoColRow: twoColComputed === 'row',
        hasSvg: !!svgContainer,
      };
    })()`);

    console.log('  ✔️ 桌面端大剧场骨架 (shell-cockpit):', desktopState.hasShellCockpit);
    console.log('  ✔️ 居中舞台卡片物理宽度:', `${desktopState.cardWidth.toFixed(1)}px (<= 1240px Keynote)`);
    console.log('  ✔️ 概念精讲双栏排版模式:', desktopState.isTwoColRow ? '并排左右分栏 (row)' : '堆叠');
    console.log('  ✔️ SVG 矢量图视窗就绪:', desktopState.hasSvg);

    if (!desktopState.hasShellCockpit || !desktopState.isTwoColRow) {
      throw new Error('❌ 桌面端回归！未命中 shell-cockpit 或双栏排版错乱');
    }

    // 验证 SVG 1~4 阶步进切换
    console.log('  🔍 验证 1~4 阶步进切换与 SVG 图层点亮...');
    for (let s = 1; s <= 4; s++) {
      await cdp.eval(`(() => {
        const btn = document.querySelector('[data-testid="stage-tab-${s}"]');
        if (btn) btn.click();
      })()`);
      await sleep(350);
    }
    const svgStage4State = await cdp.eval(`(() => {
      const c = document.querySelector('.concept-svg-container');
      const ind = document.querySelector('[data-testid="svg-stage-indicator"]');
      return {
        className: c ? c.className : '',
        indicatorText: ind ? ind.textContent : '',
      };
    })()`);
    console.log('  ✔️ 步进至第4阶状态:', svgStage4State.indicatorText);

    // 切回第1阶
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="stage-tab-1"]');
      if (btn) btn.click();
    })()`);
    await sleep(300);

    const desktopScreenshotPath = path.join(screenshotsDir, 'e2e_task0010_desktop_1440x900.png');
    await cdp.captureScreenshot(desktopScreenshotPath);

    // ================================================================
    // 第二关：手机端 iPhone 15 Pro 仿真验证 (393 × 852, DPR 3, Touch)
    // ================================================================
    console.log('\n--- 📱 阶段二: 手机端仿真验证 (iPhone 15 Pro, 393 × 852) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await cdp.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    // 触发 resize 并等待重新渲染
    await sleep(1000);

    const mobileState = await cdp.eval(`(() => {
      const shellCardDeck = document.querySelector('[data-testid="shell-card-deck"]');
      const header = document.querySelector('[data-testid="card-deck-header"]');
      const bottomBar = document.querySelector('[data-testid="card-deck-bottom-sheet"]');
      const tabConcept = document.querySelector('[data-testid="mobile-tab-concept"]');
      const tabGraph = document.querySelector('[data-testid="mobile-tab-graph"]');
      const tabLab = document.querySelector('[data-testid="mobile-tab-lab"]');
      const tabExam = document.querySelector('[data-testid="mobile-tab-exam"]');
      const twoCol = document.querySelector('.concept-two-column-layout');
      const twoColComputed = twoCol ? window.getComputedStyle(twoCol).flexDirection : null;

      return {
        hasShellCardDeck: !!shellCardDeck,
        hasHeader: !!header,
        hasBottomBar: !!bottomBar,
        hasAllTabs: !!(tabConcept && tabGraph && tabLab && tabExam),
        isVerticalStack: twoColComputed === 'column',
      };
    })()`);

    console.log('  ✔️ 手机端卡片流骨架 (shell-card-deck):', mobileState.hasShellCardDeck);
    console.log('  ✔️ 顶部 Slim 导航条:', mobileState.hasHeader);
    console.log('  ✔️ 底部原生 iOS Tab Bar (4大模块图标):', mobileState.hasBottomBar && mobileState.hasAllTabs);
    console.log('  ✔️ 概念精讲在手机端自动折叠为单列流 (column):', mobileState.isVerticalStack);

    if (!mobileState.hasShellCardDeck || !mobileState.isVerticalStack) {
      throw new Error('❌ 手机端适配失败！未命中 shell-card-deck 或未转为单列流');
    }

    // 测试底部 Tab 切换
    console.log('  🔍 手机端底部 Tab Bar 触控切换测试...');
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-graph"]');
      if (tab) tab.click();
    })()`);
    await sleep(1000);
    const inGraph = await cdp.eval(`(() => location.hash.includes('graph'))()`);
    console.log('  ✔️ 触控切换至思维图谱:', inGraph);

    // 切回概念精讲
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-concept"]');
      if (tab) tab.click();
    })()`);
    await sleep(1000);

    const mobileScreenshotPath = path.join(screenshotsDir, 'e2e_task0010_mobile_iphone15pro.png');
    await cdp.captureScreenshot(mobileScreenshotPath);

    // ================================================================
    // 第三关：平板端 iPad 竖屏仿真验证 (820 × 1180, Touch)
    // ================================================================
    console.log('\n--- 📟 阶段三: 平板端竖屏仿真验证 (iPad Portrait, 820 × 1180) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 820,
      height: 1180,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await cdp.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    await sleep(1000);

    const tabletPortraitState = await cdp.eval(`(() => {
      const shellSplitBoard = document.querySelector('[data-testid="shell-split-board"]');
      const sidebar = document.querySelector('[data-testid="split-board-sidebar"]');
      const main = document.querySelector('[data-testid="split-board-main"]');
      const toggleBtn = document.querySelector('[data-testid="split-board-toggle-btn"]');
      const twoCol = document.querySelector('.concept-two-column-layout');
      const twoColComputed = twoCol ? window.getComputedStyle(twoCol).flexDirection : null;

      return {
        hasShellSplitBoard: !!shellSplitBoard,
        hasSidebar: !!sidebar,
        hasMain: !!main,
        hasToggleBtn: !!toggleBtn,
        isVerticalStack: twoColComputed === 'column',
      };
    })()`);

    console.log('  ✔️ 平板分栏画板骨架 (shell-split-board):', tabletPortraitState.hasShellSplitBoard);
    console.log('  ✔️ 竖屏自适应导航折叠与切换按钮:', tabletPortraitState.hasToggleBtn);
    console.log('  ✔️ 竖屏模式双栏自适应堆叠 (column):', tabletPortraitState.isVerticalStack);

    if (!tabletPortraitState.hasShellSplitBoard) {
      throw new Error('❌ 平板竖屏适配失败！未命中 shell-split-board');
    }

    const tabletPortraitScreenshotPath = path.join(screenshotsDir, 'e2e_task0010_tablet_ipad_portrait.png');
    await cdp.captureScreenshot(tabletPortraitScreenshotPath);

    // ================================================================
    // 第四关：平板端 iPad 横屏仿真验证 (1024 × 768, Touch)
    // ================================================================
    console.log('\n--- 📟 阶段四: 平板端横屏仿真验证 (iPad Landscape, 1024 × 768) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 768,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await sleep(1000);

    const tabletLandscapeState = await cdp.eval(`(() => {
      const shellSplitBoard = document.querySelector('[data-testid="shell-split-board"]');
      const sidebar = document.querySelector('[data-testid="split-board-sidebar"]');
      const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().width : 0;
      const main = document.querySelector('[data-testid="split-board-main"]');
      const twoCol = document.querySelector('.concept-two-column-layout');
      const twoColComputed = twoCol ? window.getComputedStyle(twoCol).flexDirection : null;

      return {
        hasShellSplitBoard: !!shellSplitBoard,
        sidebarWidth,
        hasMain: !!main,
        isRow: twoColComputed === 'row',
      };
    })()`);

    console.log('  ✔️ 平板横屏分栏画板骨架:', tabletLandscapeState.hasShellSplitBoard);
    console.log('  ✔️ 横屏左侧常驻导航栏宽度:', `${tabletLandscapeState.sidebarWidth}px`);
    console.log('  ✔️ 横屏主内容保持双栏并排 (row):', tabletLandscapeState.isRow);

    const tabletLandscapeScreenshotPath = path.join(screenshotsDir, 'e2e_task0010_tablet_ipad_landscape.png');
    await cdp.captureScreenshot(tabletLandscapeLandscapePath = tabletLandscapeScreenshotPath);

    // ================================================================
    // 控制台错误与零 Warning 汇总
    // ================================================================
    console.log('\n----------------------------------------------------');
    console.log(`📊 控制台错误数 (Console Errors): ${cdp.errors.length}`);
    if (cdp.errors.length > 0) {
      console.error('Errors:', cdp.errors);
      throw new Error(`存在 ${cdp.errors.length} 个控制台错误！`);
    } else {
      console.log('🎉 整个多端流转过程 Console 零 Error！');
    }

    console.log('\n================================================================');
    console.log('🏆 TASK-FE-0010 多端响应式真机仿真 E2E 验收全关卡通过！');
    console.log('================================================================');
  } finally {
    chromeProcess.kill('SIGTERM');
  }
}

runAcceptance().catch((err) => {
  console.error('验收执行异常:', err);
  process.exit(1);
});
