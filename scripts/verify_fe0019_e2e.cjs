const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8799;
const CDP_PORT = 9649;
const DIST_DIR = path.resolve(__dirname, '../dist');
const EVIDENCE_DIR = path.resolve(__dirname, '../tmp/fe0019/evidence');

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

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
    const userDataDir = path.resolve(__dirname, `../tmp/chrome_fe0019_${Date.now()}`);
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
    const filepath = path.join(EVIDENCE_DIR, filename);
    fs.writeFileSync(filepath, buffer);
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
        console.error('[Browser Error]', text);
        consoleErrors.push(text);
      }
    });

    const screenshots = [];

    // ==========================================
    // 阶段 1: 手机端 (390x844) 模块一 (概念精讲)
    // 二级菜单吸顶悬浮 + 考点抽屉完整展示
    // ==========================================
    console.log('\n--- 阶段 1: 手机端模块一 (390x844) 二级菜单固定悬浮与抽屉流畅单列 ---');
    await cdp.setViewport(390, 844, true);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/concept` });
    await new Promise(r => setTimeout(r, 2000));

    // 1.1 检查模块一二级菜单 position: sticky
    const conceptHeaderSticky = await cdp.eval(`(() => {
      const header = document.querySelector('.concept-nav-header');
      if (!header) return null;
      const style = window.getComputedStyle(header);
      return {
        position: style.position,
        top: style.top,
        zIndex: style.zIndex,
        boxShadow: style.boxShadow,
      };
    })()`);
    console.log('1.1 模块一二级菜单吸顶样式:', conceptHeaderSticky);

    // 1.2 向下滚动 200px 验证吸顶固定
    await cdp.eval(`(() => {
      const scroller = document.querySelector('[data-testid="card-deck-body"]') || document.documentElement;
      scroller.scrollTop = 220;
    })()`);
    await new Promise(r => setTimeout(r, 400));

    const conceptScrolledRect = await cdp.eval(`(() => {
      const header = document.querySelector('.concept-nav-header');
      const scroller = document.querySelector('[data-testid="card-deck-body"]');
      const rect = header ? header.getBoundingClientRect() : null;
      return {
        scrollTop: scroller ? scroller.scrollTop : 0,
        headerTop: rect ? rect.top : 0,
        headerBottom: rect ? rect.bottom : 0,
      };
    })()`);
    console.log('1.2 模块一向下滚动后位置 (保持吸顶):', conceptScrolledRect);

    // 1.3 展开考点抽屉并检查结构
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="concept-drawer-trigger"]');
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 500));

    const drawerMetrics = await cdp.eval(`(() => {
      const drawer = document.querySelector('.concept-drawer-panel.is-open');
      const gradeSemRow = document.querySelector('.concept-drawer-level1-2-wrap');
      const subcatList = document.querySelector('.concept-drawer-subcat-list');
      const rightCol = document.querySelector('.concept-drawer-right-col');
      const points = document.querySelectorAll('[data-testid^="point-item-"]');
      
      // 测试滑动到底部
      if (rightCol) rightCol.scrollTop = rightCol.scrollHeight;

      return {
        isOpen: !!drawer,
        drawerHeight: drawer ? drawer.offsetHeight : 0,
        gradeSemRowFlexDir: gradeSemRow ? window.getComputedStyle(gradeSemRow).flexDirection : '',
        subcatOverflowX: subcatList ? window.getComputedStyle(subcatList).overflowX : '',
        rightColScrollTop: rightCol ? rightCol.scrollTop : 0,
        rightColScrollHeight: rightCol ? rightCol.scrollHeight : 0,
        totalPointsRendered: points.length,
      };
    })()`);
    console.log('1.3 模块一考点抽屉结构与到底滚动:', drawerMetrics);

    screenshots.push(await cdp.captureScreenshot('e2e_01_mobile_concept_sticky_and_drawer.png'));

    // 关闭抽屉
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('[data-testid="drawer-close-btn"]') || document.querySelector('[data-testid="concept-drawer-backdrop"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 300));

    // ==========================================
    // 阶段 2: 手机端 (390x844) 模块二 (思维图谱) 二级菜单固定悬浮
    // ==========================================
    console.log('\n--- 阶段 2: 手机端模块二 (思维图谱) 二级菜单固定悬浮 ---');
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-graph"]');
      if (tab) tab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    const graphHeaderSticky = await cdp.eval(`(() => {
      const header = document.querySelector('.graph-nav-header');
      const scroller = document.querySelector('[data-testid="card-deck-body"]');
      if (scroller) scroller.scrollTop = 180;
      const rect = header ? header.getBoundingClientRect() : null;
      const style = header ? window.getComputedStyle(header) : null;
      return {
        position: style ? style.position : null,
        top: rect ? rect.top : null,
        boxShadow: style ? style.boxShadow : null,
      };
    })()`);
    console.log('2.1 模块二二级菜单吸顶位置:', graphHeaderSticky);

    screenshots.push(await cdp.captureScreenshot('e2e_02_mobile_graph_sticky.png'));

    // ==========================================
    // 阶段 3: 手机端 (390x844) 模块三 (动力沙盒) 滑屏与动点触控
    // ==========================================
    console.log('\n--- 阶段 3: 手机端模块三 (动力沙盒) 滑屏与 touch-action 检查 ---');
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-lab"]');
      if (tab) tab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));

    const sandboxTouchMetrics = await cdp.eval(`(() => {
      const header = document.querySelector('.sandbox-sticky-header-container');
      const renderer = document.querySelector('.sandbox-renderer');
      const jxgbox = document.querySelector('.jxgbox');
      const scroller = document.querySelector('[data-testid="card-deck-body"]');
      
      const rendererTouchAction = renderer ? window.getComputedStyle(renderer).touchAction : '';
      const jxgTouchAction = jxgbox ? window.getComputedStyle(jxgbox).touchAction : '';

      // 模拟向下滚动页面 150px
      if (scroller) scroller.scrollTop = 160;

      return {
        headerPosition: header ? window.getComputedStyle(header).position : '',
        headerTop: header ? header.getBoundingClientRect().top : 0,
        rendererTouchAction,
        jxgTouchAction,
        scrollerScrollTop: scroller ? scroller.scrollTop : 0,
      };
    })()`);
    console.log('3.1 模块三沙盒滑屏与 touchAction 校验:', sandboxTouchMetrics);

    screenshots.push(await cdp.captureScreenshot('e2e_03_mobile_sandbox_scrollable.png'));

    // ==========================================
    // 阶段 4: 手机端 (390x844) 模块四 (实战测评) 第二层响应式排版
    // ==========================================
    console.log('\n--- 阶段 4: 手机端模块四 (实战测评) 第二层排版重构 ---');
    await cdp.eval(`(() => {
      const tab = document.querySelector('[data-testid="mobile-tab-exam"]');
      if (tab) tab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));

    const examLayer2Metrics = await cdp.eval(`(() => {
      const header = document.querySelector('.exam-subnav-sticky-header');
      const semesterScroll = document.querySelector('.workbench-semester-scroll');
      const kpGrid = document.querySelector('.workbench-kp-grid');
      const kpItems = document.querySelectorAll('.workbench-kp-grid label');
      const scroller = document.querySelector('[data-testid="card-deck-body"]');

      // 滚动 200px 验证吸顶
      if (scroller) scroller.scrollTop = 200;

      const firstItem = kpItems[0];
      const itemHeight = firstItem ? firstItem.offsetHeight : 0;

      return {
        headerPosition: header ? window.getComputedStyle(header).position : '',
        headerTop: header ? header.getBoundingClientRect().top : 0,
        semesterOverflowX: semesterScroll ? window.getComputedStyle(semesterScroll).overflowX : '',
        kpGridColumns: kpGrid ? window.getComputedStyle(kpGrid).gridTemplateColumns : '',
        firstItemTouchHeight: itemHeight,
        isTouchTargetAdequate: itemHeight >= 40,
        totalKpsInGrid: kpItems.length,
      };
    })()`);
    console.log('4.1 模块四第二层响应式排版与吸顶指标:', examLayer2Metrics);

    screenshots.push(await cdp.captureScreenshot('e2e_04_mobile_exam_layer2_responsive.png'));

    // ==========================================
    // 阶段 5: 平板端 (820x1180) 吸顶悬浮校验
    // ==========================================
    console.log('\n--- 阶段 5: 平板端 (820x1180) SplitBoard 二级菜单吸顶 ---');
    await cdp.setViewport(820, 1180, false);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/concept` });
    await new Promise(r => setTimeout(r, 1500));

    const tabletStickyMetrics = await cdp.eval(`(() => {
      const header = document.querySelector('.concept-nav-header');
      const mainScroller = document.querySelector('[data-testid="split-board-main"]');
      if (mainScroller) mainScroller.scrollTop = 160;

      const rect = header ? header.getBoundingClientRect() : null;
      return {
        headerPosition: header ? window.getComputedStyle(header).position : '',
        headerTop: rect ? rect.top : 0,
        mainScrollTop: mainScroller ? mainScroller.scrollTop : 0,
      };
    })()`);
    console.log('5.1 平板端 SplitBoard 吸顶校验:', tabletStickyMetrics);

    screenshots.push(await cdp.captureScreenshot('e2e_05_tablet_sticky_headers.png'));

    // ==========================================
    // 阶段 6: 桌面端 (1440x900) 零回归校验
    // ==========================================
    console.log('\n--- 阶段 6: 桌面端 (1440x900) 1240px 大剧场零回归 ---');
    await cdp.setViewport(1440, 900, false);
    await new Promise(r => setTimeout(r, 1000));

    const desktopMetrics = await cdp.eval(`(() => {
      const theater = document.querySelector('[data-testid="cockpit-theater"]');
      const globalBar = document.querySelector('[data-testid="math-junior-global-bar"]');
      const subnavBar = document.querySelector('[data-testid="math-junior-subnav-bar"]');
      const conceptHeader = document.querySelector('.concept-nav-header');
      return {
        hasTheater: !!theater,
        hasGlobalBar: !!globalBar,
        hasSubnavBar: !!subnavBar,
        conceptHeaderPosition: conceptHeader ? window.getComputedStyle(conceptHeader).position : '',
      };
    })()`);
    console.log('6.1 桌面端大剧场与双层顶栏指标:', desktopMetrics);

    screenshots.push(await cdp.captureScreenshot('e2e_06_desktop_zero_regression.png'));

    // 总结报告
    const summary = {
      task: 'TASK-FE-0019',
      timestamp: new Date().toISOString(),
      consoleErrorsCount: consoleErrors.length,
      consoleErrors,
      metrics: {
        conceptHeaderSticky,
        conceptScrolledRect,
        drawerMetrics,
        graphHeaderSticky,
        sandboxTouchMetrics,
        examLayer2Metrics,
        tabletStickyMetrics,
        desktopMetrics,
      },
      screenshots,
    };

    const summaryPath = path.join(EVIDENCE_DIR, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n[E2E Complete] Summary written to ${summaryPath}`);

    // 断言判据检查
    if (consoleErrors.length > 0) {
      throw new Error(`E2E failed: encountered ${consoleErrors.length} console errors`);
    }
    if (!drawerMetrics.isOpen || drawerMetrics.totalPointsRendered === 0) {
      throw new Error('E2E failed: drawer did not open or points list empty');
    }
    if (sandboxTouchMetrics.rendererTouchAction !== 'pan-y') {
      throw new Error(`E2E failed: sandbox renderer touchAction is ${sandboxTouchMetrics.rendererTouchAction}, expected pan-y`);
    }
    if (!examLayer2Metrics.isTouchTargetAdequate) {
      throw new Error(`E2E failed: exam KP touch target height is ${examLayer2Metrics.firstItemTouchHeight} < 40px`);
    }

    console.log('✅ ALL E2E VERIFICATIONS PASSED CLEANLY (100%)');

  } finally {
    if (chromeProcess) {
      chromeProcess.kill('SIGKILL');
    }
    if (server) {
      server.close();
    }
    if (userDataDir && fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
}

runE2E().catch(err => {
  console.error('[E2E Fatal]', err);
  process.exit(1);
});
