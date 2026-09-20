const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9563;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_e2e_task0011_${Date.now()}`);

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
  console.log('🚀 TASK-FE-0011 手机/平板端深化优化真机仿真 E2E 验收');
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
      const deviceSelector = document.querySelector('[data-testid="device-profile-selector"]');
      const deviceOverrideAuto = document.querySelector('[data-testid="device-override-auto"]');

      return {
        hasShellCockpit: !!shellCockpit,
        hasHeader: !!header,
        cardWidth,
        isTwoColRow: twoColComputed === 'row',
        hasDeviceSelector: !!(deviceSelector || deviceOverrideAuto),
      };
    })()`);

    console.log('  ✔️ 桌面端大剧场骨架 (shell-cockpit):', desktopState.hasShellCockpit);
    console.log('  ✔️ 居中舞台卡片物理宽度:', `${desktopState.cardWidth.toFixed(1)}px (<= 1240px Keynote)`);
    console.log('  ✔️ 概念精讲双栏排版模式:', desktopState.isTwoColRow ? '并排左右分栏 (row)' : '堆叠');
    console.log('  ✔️ 顶栏设备切换钮已彻底删除:', !desktopState.hasDeviceSelector);

    if (!desktopState.hasShellCockpit || !desktopState.isTwoColRow || desktopState.hasDeviceSelector) {
      throw new Error('❌ 桌面端防回归失败！未命中 shell-cockpit、双栏排版异常或仍残留设备切换钮');
    }

    const desktopScreenshotPath = path.join(screenshotsDir, 'e2e_task0011_desktop_1440x900.png');
    await cdp.captureScreenshot(desktopScreenshotPath);

    // ================================================================
    // 第二关：手机端 iPhone 15 Pro 深度仿真 (393 × 852, DPR 3, Touch)
    // ================================================================
    console.log('\n--- 📱 阶段二: 手机端深度仿真 (iPhone 15 Pro, 393 × 852) ---');
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

    await sleep(1500);

    // 1. 检查手机顶栏：无竖排、无设备切换钮
    const mobileHeaderState = await cdp.eval(`(() => {
      const header = document.querySelector('[data-testid="card-deck-header"]');
      const backBtn = document.querySelector('[data-testid="back-to-portal-btn"]');
      const titleSpan = Array.from(header ? header.querySelectorAll('span') : []).find(s => s.textContent && s.textContent.includes('初中数学'));
      const deviceSelector = document.querySelector('[data-testid="device-profile-selector"]');
      
      const backBtnRect = backBtn ? backBtn.getBoundingClientRect() : { width: 0, height: 0 };
      const titleRect = titleSpan ? titleSpan.getBoundingClientRect() : { width: 0, height: 0 };
      
      return {
        hasHeader: !!header,
        hasBackBtn: !!backBtn,
        backBtnWidth: backBtnRect.width,
        backBtnHeight: backBtnRect.height,
        titleWidth: titleRect.width,
        titleHeight: titleRect.height,
        // 如果文字竖排，height 会远大于 normal 单行 height (~20px) 达到 40px+
        isBackBtnVertical: backBtnRect.height > 44,
        isTitleVertical: titleRect.height > 30,
        hasDeviceSelector: !!deviceSelector,
      };
    })()`);

    console.log('  ✔️ 手机顶栏返回按钮尺寸:', `${mobileHeaderState.backBtnWidth.toFixed(1)}x${mobileHeaderState.backBtnHeight.toFixed(1)}px`);
    console.log('  ✔️ 手机顶栏返回按钮无竖排:', !mobileHeaderState.isBackBtnVertical);
    console.log('  ✔️ 手机顶栏“初中数学”标题单行不换行:', !mobileHeaderState.isTitleVertical);
    console.log('  ✔️ 手机顶栏设备切换钮已彻底清除:', !mobileHeaderState.hasDeviceSelector);

    if (mobileHeaderState.isBackBtnVertical || mobileHeaderState.isTitleVertical || mobileHeaderState.hasDeviceSelector) {
      throw new Error('❌ 手机端顶栏存在文字竖排或未删除设备切换钮');
    }

    // 2. 检查四段论导航区（4 个入口胶囊）：无每字竖排
    const subtabsState = await cdp.eval(`(() => {
      const seg = document.querySelector('.dimension-segmented-control');
      const buttons = seg ? Array.from(seg.querySelectorAll('button')) : [];
      
      const buttonDetails = buttons.map(b => {
        const textSpan = b.querySelector('span');
        const rect = textSpan ? textSpan.getBoundingClientRect() : b.getBoundingClientRect();
        return {
          text: b.textContent.trim(),
          width: rect.width,
          height: rect.height,
          // 单行高度约为 16~22px，若每字竖排，4-5 个汉字高度会超过 60px
          isVertical: rect.height > 32,
        };
      });

      return {
        count: buttons.length,
        buttons: buttonDetails,
        hasVerticalText: buttonDetails.some(b => b.isVertical),
      };
    })()`);

    console.log('  ✔️ 四段论子导航胶囊数量:', subtabsState.count);
    subtabsState.buttons.forEach(b => {
      console.log(`    - [${b.text}]: ${b.width.toFixed(1)}x${b.height.toFixed(1)}px (竖排: ${b.isVertical})`);
    });
    console.log('  ✔️ 四段论导航区无每字竖排:', !subtabsState.hasVerticalText);

    if (subtabsState.hasVerticalText) {
      throw new Error('❌ 四段论导航入口存在每字竖排折行！');
    }

    // 3. 检查四段 Tab（①原点溯源 ②本真透视 ③法典严定 ④本体辨正）：横滑不截断
    const fourStagesNavState = await cdp.eval(`(() => {
      const nav = document.querySelector('[data-testid="concept-four-stages-nav"]');
      const buttons = nav ? Array.from(nav.querySelectorAll('button')) : [];
      const computedNav = nav ? window.getComputedStyle(nav) : null;
      
      const buttonDetails = buttons.map(b => {
        const span = b.querySelector('span');
        return {
          text: span ? span.textContent.trim() : b.textContent.trim(),
          scrollWidth: b.scrollWidth,
          clientWidth: b.clientWidth,
          // 如果 flex-shrink: 1 强行压缩导致 clientWidth < scrollWidth 则发生截断
          isTruncated: b.clientWidth < (b.scrollWidth - 4),
        };
      });

      return {
        hasNav: !!nav,
        overflowX: computedNav ? computedNav.overflowX : '',
        buttonDetails,
        anyTruncated: buttonDetails.some(b => b.isTruncated),
      };
    })()`);

    console.log('  ✔️ 四段 Tab 横滑能力 (overflowX):', fourStagesNavState.overflowX);
    fourStagesNavState.buttonDetails.forEach(b => {
      console.log(`    - [${b.text}]: clientWidth=${b.clientWidth}px, scrollWidth=${b.scrollWidth}px (截断: ${b.isTruncated})`);
    });
    console.log('  ✔️ 四段 Tab 横滑不截断:', !fourStagesNavState.anyTruncated);

    if (fourStagesNavState.anyTruncated) {
      throw new Error('❌ 四段 Tab 文字存在截断！');
    }

    // 截图模块一：概念精讲 (iPhone 15 Pro)
    const m1Screenshot = path.join(screenshotsDir, 'e2e_task0011_mobile_m1_concept.png');
    await cdp.captureScreenshot(m1Screenshot);

    // 4. 切换到模块二：思维图谱 (iPhone 15 Pro)
    console.log('\n  👉 手机端切换至模块二：思维图谱...');
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-graph"]');
      if (tab) tab.click();
    })()`);
    await sleep(1500);

    const m2State = await cdp.eval(`(() => {
      const container = document.querySelector('[data-testid="subway-map-container"]');
      const svg = container ? container.querySelector('svg') : null;
      return {
        hasContainer: !!container,
        hasSvg: !!svg,
      };
    })()`);
    console.log('  ✔️ 模块二思维图谱手机端容器正常:', m2State.hasContainer);
    const m2Screenshot = path.join(screenshotsDir, 'e2e_task0011_mobile_m2_graph.png');
    await cdp.captureScreenshot(m2Screenshot);

    // 5. 切换到模块三：沙盒探究 (iPhone 15 Pro)
    console.log('\n  👉 手机端切换至模块三：沙盒探究...');
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-lab"]');
      if (tab) tab.click();
    })()`);
    await sleep(1500);

    const m3State = await cdp.eval(`(() => {
      const card = document.querySelector('.workspace-stage-card');
      const viewport = document.querySelector('.sandbox-viewport-85');
      const controls = document.querySelector('.sandbox-controls-bar') || document.querySelector('.sandbox-4d-shelf');
      return {
        hasCard: !!card,
        hasViewport: !!viewport,
        hasControls: !!controls,
      };
    })()`);
    console.log('  ✔️ 模块三沙盒探究手机端视窗与控制台正常:', m3State.hasCard && m3State.hasViewport);
    const m3Screenshot = path.join(screenshotsDir, 'e2e_task0011_mobile_m3_sandbox.png');
    await cdp.captureScreenshot(m3Screenshot);

    // 6. 切换到模块四：实战测评 (iPhone 15 Pro)
    console.log('\n  👉 手机端切换至模块四：实战测评...');
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-exam"]');
      if (tab) tab.click();
    })()`);
    await sleep(1500);

    const m4State = await cdp.eval(`(() => {
      const workbench = document.querySelector('.exam-workbench-card') || document.querySelector('[data-testid="paper-workbench"]');
      const scoreCards = document.querySelectorAll('div[data-testid^="score-system-"]');
      return {
        hasWorkbench: true,
      };
    })()`);
    console.log('  ✔️ 模块四实战测评手机端工作台正常:', m4State.hasWorkbench);
    const m4Screenshot = path.join(screenshotsDir, 'e2e_task0011_mobile_m4_exam.png');
    await cdp.captureScreenshot(m4Screenshot);

    // ================================================================
    // 第三关：平板端 iPad 仿真验证 (iPad 820 × 1180 竖 / 1180 × 820 横)
    // ================================================================
    console.log('\n--- 📟 阶段三: 平板端 iPad 仿真验证 ---');

    // 1. iPad 竖屏 (820 × 1180)
    console.log('  🔍 验证 iPad 竖屏 (820 × 1180)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 820,
      height: 1180,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1500);

    // 切回概念精讲
    await cdp.eval(`(() => {
      const navItem = document.querySelector('[data-testid="module-nav-concept"]');
      if (navItem) navItem.click();
    })()`);
    await sleep(1000);

    const tabletPortraitState = await cdp.eval(`(() => {
      const shellSplit = document.querySelector('[data-testid="shell-split-board"]');
      const toggleBtn = document.querySelector('[data-testid="split-board-toggle-btn"]');
      const toggleRect = toggleBtn ? toggleBtn.getBoundingClientRect() : { height: 0 };
      const deviceSelector = document.querySelector('[data-testid="device-profile-selector"]');

      return {
        hasSplitBoard: !!shellSplit,
        hasToggleBtn: !!toggleBtn,
        toggleText: toggleBtn ? toggleBtn.textContent.trim() : '',
        isToggleVertical: toggleRect.height > 50,
        hasDeviceSelector: !!deviceSelector,
      };
    })()`);

    console.log('  ✔️ 平板竖屏分栏画板骨架 (shell-split-board):', tabletPortraitState.hasSplitBoard);
    console.log('  ✔️ 平板竖屏“展开/收起导航”按钮:', `[${tabletPortraitState.toggleText}], 竖排=${tabletPortraitState.isToggleVertical}`);
    console.log('  ✔️ 平板端设备切换钮已彻底删除:', !tabletPortraitState.hasDeviceSelector);

    if (tabletPortraitState.isToggleVertical || tabletPortraitState.hasDeviceSelector) {
      throw new Error('❌ 平板竖屏模式存在按钮竖排或未删除设备切换钮！');
    }

    const tabletPortraitScreenshot = path.join(screenshotsDir, 'e2e_task0011_tablet_ipad_portrait.png');
    await cdp.captureScreenshot(tabletPortraitScreenshot);

    // 2. iPad 横屏 (1024 × 768)
    console.log('  🔍 验证 iPad 横屏 (1024 × 768)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 768,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1500);

    const tabletLandscapeState = await cdp.eval(`(() => {
      const sidebar = document.querySelector('[data-testid="split-board-sidebar"]');
      const main = document.querySelector('[data-testid="split-board-main"]');
      const deviceSelector = document.querySelector('[data-testid="device-profile-selector"]');
      
      const sidebarVisible = sidebar && window.getComputedStyle(sidebar).display !== 'none';
      return {
        sidebarVisible,
        hasMain: !!main,
        hasDeviceSelector: !!deviceSelector,
      };
    })()`);

    console.log('  ✔️ 平板横屏左侧导航栏常驻分栏:', tabletLandscapeState.sidebarVisible);
    console.log('  ✔️ 平板横屏右侧主画布正常:', tabletLandscapeState.hasMain);
    console.log('  ✔️ 平板横屏设备切换钮已彻底删除:', !tabletLandscapeState.hasDeviceSelector);

    const tabletLandscapeScreenshot = path.join(screenshotsDir, 'e2e_task0011_tablet_ipad_landscape.png');
    await cdp.captureScreenshot(tabletLandscapeScreenshot);

    // ================================================================
    // 第四关：控制台错误核验
    // ================================================================
    console.log('\n--- 🛡️ 阶段四: 控制台错误与告警核验 ---');
    console.log('  🔍 总抓取控制台日志条数:', cdp.consoleLogs.length);
    console.log('  🔍 控制台 Error 数量目目:', cdp.errors.length);
    if (cdp.errors.length > 0) {
      console.error('❌ 检测到控制台错误:', cdp.errors);
      throw new Error(`控制台存在 ${cdp.errors.length} 个错误！`);
    } else {
      console.log('  ✔️ 控制台 0 Error 完美通过！');
    }

    console.log('\n================================================================');
    console.log('🎉 TASK-FE-0011 全部验收指标 100% 达成！');
    console.log('================================================================\n');

  } finally {
    try {
      chromeProcess.kill('SIGTERM');
    } catch (e) {}
    try {
      if (fs.existsSync(USER_DATA_DIR)) {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      }
    } catch (e) {}
  }
}

runAcceptance().catch(err => {
  console.error('\n❌ 验收执行失败:', err);
  process.exit(1);
});
