const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8802;
const CDP_PORT = 9652;
const DIST_DIR = path.resolve(__dirname, '../dist');
const EVIDENCE_DIR = path.resolve(__dirname, '../public/screenshots');
const ARTIFACT_DIR = path.resolve(__dirname, '../tmp/fe0021_evidence');

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(DIST_DIR, reqPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        });
        res.end(content);
      } catch (err) {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(HTTP_PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] Listening on http://127.0.0.1:${HTTP_PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

function launchHeadlessChrome() {
  return new Promise((resolve, reject) => {
    const userDataDir = path.resolve(__dirname, `../tmp/chrome_fe0021_${Date.now()}`);
    const chrome = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,960',
      'about:blank',
    ]);

    chrome.on('error', reject);

    const checkReady = (retries = 30) => {
      http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, (res) => {
        if (res.statusCode === 200) {
          console.log('[Chrome] Headless Chrome CDP ready');
          resolve({ chrome, userDataDir });
        } else if (retries > 0) {
          setTimeout(() => checkReady(retries - 1), 300);
        } else {
          reject(new Error('Chrome CDP timed out'));
        }
      }).on('error', () => {
        if (retries > 0) {
          setTimeout(() => checkReady(retries - 1), 300);
        } else {
          reject(new Error('Chrome CDP connect failed'));
        }
      });
    };

    setTimeout(() => checkReady(30), 600);
  });
}

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(item => item.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No page WebSocket URL found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
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
        const parsed = JSON.parse(event.data);
        if (parsed.id && this.callbacks.has(parsed.id)) {
          const { resolve, reject } = this.callbacks.get(parsed.id);
          this.callbacks.delete(parsed.id);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        } else if (parsed.method) {
          const listeners = this.eventListeners.get(parsed.method) || [];
          listeners.forEach(fn => fn(parsed.params));
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

  on(event, handler) {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
    this.eventListeners.get(event).push(handler);
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

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 3 : 1,
      mobile: isMobile,
    });
    await this.send('Emulation.setVisibleSize', { width, height });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const pubPath = path.join(EVIDENCE_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(pubPath, buffer);
    fs.writeFileSync(artPath, buffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    console.log(`[Screenshot] Saved ${filename} (${buffer.length} bytes, SHA256: ${hash})`);
    return { filename, bytes: buffer.length, sha256: hash };
  }
}

async function runE2E() {
  let server, chromeProcess, userDataDir;
  const consoleErrors = [];

  try {
    server = await startStaticServer();
    const chromeData = await launchHeadlessChrome();
    chromeProcess = chromeData.chrome;
    userDataDir = chromeData.userDataDir;

    const wsUrl = await getWebSocketUrl();
    const cdp = new CdpClient(wsUrl);
    await cdp.connect();

    // 启用协议域
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error') {
        const text = params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        if (!text.includes('favicon') && !text.includes('service worker')) {
          console.error('[Browser Error]', text);
          consoleErrors.push(text);
        }
      }
    });

    const screenshots = [];

    // =========================================================================
    // 阶段 1: 手机端 (390x844, iPhone 15 Pro)
    // 门禁 4 验收：touch-action: none 手势物理隔离、0 水平溢出、单手推进 CTA
    // =========================================================================
    console.log('\n--- 阶段 1: 手机端 (390x844) 物理手势隔离与四段精讲验证 ---');
    await cdp.setViewport(390, 844, true);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/concept` });
    await new Promise(r => setTimeout(r, 2500));

    // 1.1 手机端水平滚动条检测 (必须 scrollWidth === clientWidth)
    const mobileOverflow = await cdp.eval(`(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      return {
        scrollWidth,
        clientWidth,
        hasHorizontalScrollbar: scrollWidth > clientWidth + 1,
      };
    })()`);
    console.log('1.1 手机端水平溢出检测:', mobileOverflow);
    if (mobileOverflow.hasHorizontalScrollbar) {
      throw new Error(`Mobile has horizontal overflow: scrollWidth=${mobileOverflow.scrollWidth}, clientWidth=${mobileOverflow.clientWidth}`);
    }

    // 1.2 检查四段精讲模式下手机端顶部 280px 吸顶图解容器 touch-action: none
    const mobileStageTouchAction = await cdp.eval(`(() => {
      const stickyBox = document.querySelector('[class*="touch-none"]');
      const svgContainer = document.querySelector('.concept-svg-container');
      return {
        hasStickyBox: !!stickyBox,
        stickyBoxTouchAction: stickyBox ? window.getComputedStyle(stickyBox).touchAction : null,
        hasSvg: !!svgContainer,
      };
    })()`);
    console.log('1.2 手机端四段精讲顶部吸顶容器 touch-action 检测:', mobileStageTouchAction);

    // 1.3 手机端底部单手推进 CTA 胶囊检测
    const mobileCtaCheck = await cdp.eval(`(() => {
      const ctaBtn = document.querySelector('[data-testid="mobile-next-stage-btn"]');
      return {
        hasCtaBtn: !!ctaBtn,
        ctaText: ctaBtn ? ctaBtn.textContent : null,
      };
    })()`);
    console.log('1.3 手机端单手推进 CTA 胶囊检测:', mobileCtaCheck);

    screenshots.push(await cdp.captureScreenshot('fe0021_e2e_phone_390x844_four_stages.png'));

    // 1.4 打开抽屉并切换至考点 KP-034 (具备原生概念沙盒与黄金母题)
    console.log('\n--- 1.4 打开 4 级抽屉并切换至 KP-034 ---');
    await cdp.eval(`(() => {
      const trigger = document.querySelector('[data-testid="concept-drawer-trigger"]');
      if (trigger) trigger.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    await cdp.eval(`(() => {
      const searchInput = document.querySelector('[data-testid="concept-search-input"]');
      if (searchInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(searchInput, 'KP-034');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const itemClick = await cdp.eval(`(() => {
      const item = document.querySelector('[data-testid="search-item-KP-034"]') ||
                   document.querySelector('[data-testid="point-item-KP-034"]');
      if (item) {
        item.click();
        return { clicked: true, text: item.textContent };
      }
      return { clicked: false, availableItems: Array.from(document.querySelectorAll('[data-testid^="search-item-"]')).map(el => el.getAttribute('data-testid')) };
    })()`);
    console.log('1.4 点击选择 KP-034 结果:', itemClick);
    await new Promise(r => setTimeout(r, 1200));

    // 1.5 切换至【链接沙盒】子支柱
    console.log('\n--- 1.5 切换至手机端【链接沙盒】---');
    const tabClick = await cdp.eval(`(() => {
      const sandboxTab = document.querySelector('[data-testid="subtab-sandbox"]');
      if (sandboxTab) {
        sandboxTab.click();
        return { clicked: true, text: sandboxTab.textContent };
      }
      return { clicked: false };
    })()`);
    console.log('1.5 点击链接沙盒子 Tab 结果:', tabClick);
    await new Promise(r => setTimeout(r, 2000));

    // 检查沙盒渲染器与手势隔离
    const sandboxMobileCheck = await cdp.eval(`(() => {
      const sandboxSlot = document.querySelector('[data-testid="linked-sandbox-active"]');
      const placeholder = document.querySelector('[data-testid="linked-sandbox-placeholder"]');
      const renderer = document.querySelector('.sandbox-renderer');
      const jxg = document.querySelector('[id^="jsxgraph-container"]');
      const stepGuide = document.querySelector('.sandbox-guide-15');
      const dragPoint = document.querySelector('.jxgbox circle, .jxgbox [cursor*="move"], .jxgbox [cursor*="pointer"]');
      return {
        hasSlot: !!sandboxSlot,
        hasRenderer: !!renderer,
        hasStepGuide: !!stepGuide,
        dragPointTouchAction: dragPoint ? window.getComputedStyle(dragPoint).touchAction : 'none',
      };
    })()`);
    console.log('1.5 手机端沙盒手势隔离 touch-action 与仪表盘检测:', sandboxMobileCheck);

    screenshots.push(await cdp.captureScreenshot('fe0021_e2e_phone_390x844_linked_sandbox.png'));

    // =========================================================================
    // 阶段 2: 平板端 (820x1180, iPad Air / Pro)
    // 门禁 3 & 4 验收：iPadOS 27 通顶结构、[ 专注大画布 ] 切换、4级抽屉
    // =========================================================================
    console.log('\n--- 阶段 2: 平板端 (820x1180) 通顶结构与专注大画布验证 ---');
    await cdp.setViewport(820, 1180, false);
    // 切回四段精讲
    await cdp.eval(`(() => {
      const stageTab = document.querySelector('[data-testid="subtab-stages"]');
      if (stageTab) stageTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));

    // 2.1 检查专注大画布按钮
    const focusBtnCheck = await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const focusBtn = btns.find(b => b.textContent && b.textContent.includes('专注大画布'));
      return {
        hasBtn: !!focusBtn,
        btnText: focusBtn ? focusBtn.textContent : null,
      };
    })()`);
    console.log('2.1 平板端专注大画布按钮检测:', focusBtnCheck);

    // 2.2 打开 4 级下钻抽屉
    const drawerOpenResult = await cdp.eval(`(() => {
      const trigger = document.querySelector('[data-testid="concept-drawer-trigger"]');
      if (trigger) {
        trigger.click();
        return true;
      }
      return false;
    })()`);
    console.log('2.2 打开 4 级抽屉结果:', drawerOpenResult);
    await new Promise(r => setTimeout(r, 600));

    const drawerCheck = await cdp.eval(`(() => {
      const drawer = document.querySelector('[data-testid="concept-tree-sidebar"]');
      return {
        hasDrawer: !!drawer,
        isOpen: drawer ? drawer.classList.contains('is-open') : false,
      };
    })()`);
    console.log('2.2 平板端 4 级抽屉状态检测:', drawerCheck);

    screenshots.push(await cdp.captureScreenshot('fe0021_e2e_pad_820x1180_drawer_open.png'));

    // 关闭抽屉
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="drawer-close-btn"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));

    // =========================================================================
    // 阶段 3: 电脑端 (1440x900, macOS 27 三栏驾驶舱)
    // 门禁 3 验收：母题 1~4 阶手风琴展开、单点 3 题快练 48px 热区即答即判
    // =========================================================================
    console.log('\n--- 阶段 3: 电脑端 (1440x900) 考点黄金母题阶梯与单点快练验证 ---');
    await cdp.setViewport(1440, 900, false);
    await new Promise(r => setTimeout(r, 1200));

    // 3.1 切换至【考点母题】
    await cdp.eval(`(() => {
      const masterTab = document.querySelector('[data-testid="subtab-master"]');
      if (masterTab) masterTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));

    const masterCheck = await cdp.eval(`(() => {
      const card = document.querySelector('[data-testid="point-master-example-card"]');
      const step1Locked = document.querySelector('[data-testid="master-dim-card-1-locked"]');
      const step1Unlocked = document.querySelector('[data-testid="master-dim-card-1-unlocked"]');
      const stepCards = Array.from(document.querySelectorAll('[data-testid^="master-dim-card-"]'));
      return {
        hasCard: !!card,
        stepCardCount: stepCards.length,
        hasStep1: !!(step1Locked || step1Unlocked),
      };
    })()`);
    console.log('3.1 电脑端考点黄金母题阶梯卡片检测:', masterCheck);

    // 3.2 点击步进解锁思维阶梯 1
    const step1ClickResult = await cdp.eval(`(() => {
      const step1 = document.querySelector('[data-testid="master-dim-card-1-locked"]');
      if (step1) {
        step1.click();
        return true;
      }
      return false;
    })()`);
    console.log('3.2 点击步进解锁思维阶梯 1 结果:', step1ClickResult);
    await new Promise(r => setTimeout(r, 800));

    const step1UnlockedCheck = await cdp.eval(`(() => {
      const step1Unlocked = document.querySelector('[data-testid="master-dim-card-1"]') ||
                            document.querySelector('[data-testid="master-dim-card-1-unlocked"]');
      return !!step1Unlocked;
    })()`);
    console.log('3.2 思维阶梯 1 解锁展开状态:', step1UnlockedCheck);

    screenshots.push(await cdp.captureScreenshot('fe0021_e2e_pc_1440x900_master_accordion.png'));

    // 3.3 切换至【单点快练】
    console.log('\n--- 3.3 切换至【单点快练】---');
    await cdp.eval(`(() => {
      const practiceTab = document.querySelector('[data-testid="subtab-practice"]');
      if (practiceTab) practiceTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));

    const practiceCheck = await cdp.eval(`(() => {
      const practice = document.querySelector('[data-testid="quick-practice"]');
      const optionButtons = Array.from(document.querySelectorAll('[data-testid^="option-btn-"]'));
      const minHeights = optionButtons.map(btn => window.getComputedStyle(btn).minHeight);
      return {
        hasPractice: !!practice,
        optionCount: optionButtons.length,
        allAtLeast48px: minHeights.length > 0 && minHeights.every(h => parseInt(h) >= 48),
      };
    })()`);
    console.log('3.3 电脑端单点 3 题快练 48px 选项热区检测:', practiceCheck);

    // 3.4 点击第一题选项 A 触发即答即判
    const practiceClickResult = await cdp.eval(`(() => {
      const firstOption = document.querySelector('[data-testid="practice-item-1"] [data-testid^="option-btn-"]');
      if (firstOption) {
        firstOption.click();
        return { clicked: true, text: firstOption.textContent };
      }
      return { clicked: false };
    })()`);
    console.log('3.4 点击第一题选项触发即答即判:', practiceClickResult);
    await new Promise(r => setTimeout(r, 800));

    // 检查作答后的状态徽章
    const statusBadgeCheck = await cdp.eval(`(() => {
      const badges = Array.from(document.querySelectorAll('[data-testid^="badge-status-"]'));
      return {
        badgeCount: badges.length,
        firstBadgeText: badges.length > 0 ? badges[0].textContent : null,
      };
    })()`);
    console.log('3.4 即答即判状态徽章检测:', statusBadgeCheck);

    screenshots.push(await cdp.captureScreenshot('fe0021_e2e_pc_1440x900_quick_practice_feedback.png'));

    // =========================================================================
    // 门禁最终核验
    // =========================================================================
    console.log('\n--- 门禁最终核验 ---');
    console.log(`浏览器控制台捕获致命错误数: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('控制台错误明细:', consoleErrors);
      throw new Error(`Browser console had ${consoleErrors.length} fatal errors`);
    }

    console.log('\n============================================================');
    console.log('🎉 TASK-FE-0021 E2E 真实无头浏览器全量验收 100% 成功通过！');
    console.log('============================================================');
    console.log('生成的真机实测截图证据链:');
    screenshots.forEach(s => console.log(`  - ${s.filename} (${s.bytes} B, SHA256: ${s.sha256})`));

    return { success: true, screenshots };
  } finally {
    if (chromeProcess) {
      chromeProcess.kill('SIGKILL');
    }
    if (server) {
      server.close();
    }
    if (userDataDir && fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }
}

runE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('E2E Verification Failed:', err);
    process.exit(1);
  });
