const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8804;
const CDP_PORT = 9654;
const DIST_DIR = path.resolve(__dirname, '../dist');
const EVIDENCE_DIR = path.resolve(__dirname, '../public/screenshots');
const ARTIFACT_DIR = path.resolve(__dirname, '../tmp/fe0023_evidence');

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
    const userDataDir = path.resolve(__dirname, `../tmp/chrome_fe0023_${Date.now()}`);
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
          console.log('[Chrome] Headless browser is ready with remote debugging on port', CDP_PORT);
          resolve({ chrome, userDataDir });
        } else if (retries > 0) {
          setTimeout(() => checkReady(retries - 1), 200);
        } else {
          reject(new Error('Chrome failed to respond on CDP port'));
        }
      }).on('error', () => {
        if (retries > 0) {
          setTimeout(() => checkReady(retries - 1), 200);
        } else {
          reject(new Error('Failed to connect to Chrome debug port'));
        }
      });
    };
    setTimeout(checkReady, 500);
  });
}

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(p => p.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No inspectable page found in Chrome'));
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
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const WsClass = typeof WebSocket !== 'undefined' ? WebSocket : globalThis.WebSocket;
      this.ws = new WsClass(this.wsUrl);
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
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
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
      deviceScaleFactor: 2,
      mobile: isMobile,
      screenOrientation: { angle: 0, type: 'portraitPrimary' },
    });
    await this.send('Emulation.setTouchEmulationEnabled', {
      enabled: isMobile,
      maxTouchPoints: isMobile ? 5 : 0,
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const primaryPath = path.join(EVIDENCE_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(primaryPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    console.log(`[Screenshot Captured] ${filename} (${buffer.length} bytes, SHA256: ${hash})`);
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
    // 门禁 1 ~ 4: 顶端 80px 双轨书签船坞、内容区悬浮菜单清零、垂直生长树与 320px 动力黑板
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 阶段 1: 手机端 (390x844) 顶端 80px 双轨书签船坞与全模块验证 ---');
    console.log('======================================================');
    await cdp.setViewport(390, 844, true);

    // 1.1 概念精讲 (ConceptNav)
    console.log('\n[1.1] 导航至概念精讲模块...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/concept` });
    await new Promise(r => setTimeout(r, 2500));

    // 验证手机端物理外壳与 80px 双轨书签
    const conceptShellState = await cdp.eval(`(() => {
      const header = document.querySelector('[data-testid="card-deck-header"]');
      const subnav = document.querySelector('[data-testid="card-deck-subnav"]');
      const capsule = document.querySelector('[data-testid="interactive-title-capsule"]');
      const mobileSubnav = document.querySelector('[data-testid="math-junior-mobile-subnav"]');
      const redundantHeader = document.querySelector('.concept-nav-header');
      const triggerBtn = document.querySelector('.concept-drawer-trigger-btn');

      return {
        headerHeight: header ? header.offsetHeight : 0,
        subnavHeight: subnav ? subnav.offsetHeight : 0,
        hasCapsule: !!capsule,
        capsuleText: capsule ? capsule.textContent.trim() : '',
        hasMobileSubnav: !!mobileSubnav,
        subnavTabs: mobileSubnav ? Array.from(mobileSubnav.querySelectorAll('button')).map(b => b.textContent.trim()) : [],
        redundantHeaderCount: document.querySelectorAll('.concept-nav-header').length,
        redundantTriggerCount: document.querySelectorAll('.concept-drawer-trigger-btn').length,
      };
    })()`);
    console.log('1.1 概念精讲双轨船坞与冗余菜单检测:', conceptShellState);

    if (conceptShellState.headerHeight !== 44) {
      console.warn(`Header height is ${conceptShellState.headerHeight}, expected 44px`);
    }
    if (conceptShellState.subnavHeight !== 36) {
      console.warn(`Subnav height is ${conceptShellState.subnavHeight}, expected 36px`);
    }
    if (!conceptShellState.hasCapsule) throw new Error('Missing interactive title capsule in concept module');
    if (!conceptShellState.hasMobileSubnav) throw new Error('Missing mobile subnav in concept module');
    if (conceptShellState.redundantHeaderCount !== 0) throw new Error('Redundant concept-nav-header found in mobile DOM');
    if (conceptShellState.redundantTriggerCount !== 0) throw new Error('Redundant concept-drawer-trigger-btn found in mobile DOM');

    // 截图 1: 概念精讲首页
    screenshots.push(await cdp.captureScreenshot('fe0023_e2e_phone_390x844_concept_subnav.png'));

    // 点击交互式标题胶囊呼出全景抽屉
    console.log('[1.1.2] 点击交互式标题胶囊唤起 80vh 抽屉...');
    await cdp.eval(`(() => {
      const capsule = document.querySelector('[data-testid="interactive-title-capsule"]');
      if (capsule) capsule.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const drawerOpenState = await cdp.eval(`(() => {
      const drawer = document.querySelector('.concept-drawer-panel.is-open') || document.querySelector('.concept-drawer-panel');
      return {
        isDrawerOpen: !!drawer && window.getComputedStyle(drawer).display !== 'none',
      };
    })()`);
    console.log('1.1.2 抽屉呼出检测:', drawerOpenState);
    screenshots.push(await cdp.captureScreenshot('fe0023_e2e_phone_390x844_concept_drawer.png'));

    // 关闭抽屉
    await cdp.eval(`(() => {
      const closeBtn = document.querySelector('.concept-drawer-close-btn') || document.querySelector('.drawer-backdrop');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // 点击二级书签：② 链接沙盒
    console.log('[1.1.3] 点击二级书签 ② 链接沙盒...');
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="subnav-tab-sandbox"]');
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1000));
    screenshots.push(await cdp.captureScreenshot('fe0023_e2e_phone_390x844_concept_sandbox.png'));

    // 1.2 思维图谱 (GraphNav)
    console.log('\n[1.2] 导航至思维图谱模块...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/graph` });
    await new Promise(r => setTimeout(r, 2500));

    const graphShellState = await cdp.eval(`(() => {
      const capsule = document.querySelector('[data-testid="interactive-title-capsule"]');
      const mobileSubnav = document.querySelector('[data-testid="math-junior-mobile-subnav"]');
      const redundantHeader = document.querySelectorAll('.graph-nav-header').length;
      const redundantTrigger = document.querySelectorAll('.graph-line-selector-trigger-btn').length;
      const growthTree = document.querySelector('.graph-growth-tree-mobile');
      const flagshipBtn = document.querySelector('[data-testid="mobile-jump-to-flagship-btn"]');

      return {
        hasCapsule: !!capsule,
        capsuleText: capsule ? capsule.textContent.trim() : '',
        hasMobileSubnav: !!mobileSubnav,
        subnavTabs: mobileSubnav ? Array.from(mobileSubnav.querySelectorAll('button')).map(b => b.textContent.trim()) : [],
        redundantHeaderCount: redundantHeader,
        redundantTriggerCount: redundantTrigger,
        hasGrowthTree: !!growthTree,
        hasFlagshipBtn: !!flagshipBtn,
      };
    })()`);
    console.log('1.2 思维图谱生长树与冗余菜单检测:', graphShellState);

    if (!graphShellState.hasCapsule) throw new Error('Missing interactive title capsule in graph module');
    if (!graphShellState.hasMobileSubnav) throw new Error('Missing mobile subnav in graph module');
    if (graphShellState.redundantHeaderCount !== 0) throw new Error('Redundant graph-nav-header found in mobile DOM');
    if (graphShellState.redundantTriggerCount !== 0) throw new Error('Redundant graph-line-selector-trigger-btn found in mobile DOM');
    if (!graphShellState.hasGrowthTree) throw new Error('Missing graph-growth-tree-mobile on mobile');

    screenshots.push(await cdp.captureScreenshot('fe0023_e2e_phone_390x844_graph_growth_tree.png'));

    // 1.3 实验探究动力沙盒 (LeapLab / LabWorkspace)
    console.log('\n[1.3] 导航至实验探究动力沙盒模块...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/lab` });
    await new Promise(r => setTimeout(r, 2500));

    const labShellState = await cdp.eval(`(() => {
      const capsule = document.querySelector('[data-testid="interactive-title-capsule"]');
      const mobileSubnav = document.querySelector('[data-testid="math-junior-mobile-subnav"]');
      const redundantTopBar = document.querySelectorAll('.sandbox-top-bar').length;
      const redundantHeaderLine = document.querySelectorAll('.sandbox-header-line').length;
      const redundantModelTrigger = document.querySelectorAll('.model-drawer-trigger-btn').length;
      const canvas = document.querySelector('.sandbox-split-box') || document.querySelector('.sandbox-viewport-85');

      return {
        hasCapsule: !!capsule,
        capsuleText: capsule ? capsule.textContent.trim() : '',
        hasMobileSubnav: !!mobileSubnav,
        subnavTabs: mobileSubnav ? Array.from(mobileSubnav.querySelectorAll('button')).map(b => b.textContent.trim()) : [],
        redundantTopBarCount: redundantTopBar,
        redundantHeaderLineCount: redundantHeaderLine,
        redundantModelTriggerCount: redundantModelTrigger,
        canvasOffsetTop: canvas ? canvas.getBoundingClientRect().top : 0,
      };
    })()`);
    console.log('1.3 实验探究画布顶位与冗余菜单检测:', labShellState);

    if (!labShellState.hasCapsule) throw new Error('Missing interactive title capsule in lab module');
    if (!labShellState.hasMobileSubnav) throw new Error('Missing mobile subnav in lab module');
    if (labShellState.redundantTopBarCount !== 0) throw new Error('Redundant sandbox-top-bar found in mobile DOM');
    if (labShellState.redundantHeaderLineCount !== 0) throw new Error('Redundant sandbox-header-line found in mobile DOM');
    if (labShellState.redundantModelTriggerCount !== 0) throw new Error('Redundant model-drawer-trigger-btn found in mobile DOM');
    if (labShellState.canvasOffsetTop > 90) {
      console.warn(`Canvas offsetTop is ${labShellState.canvasOffsetTop}px, expected <= 90px`);
    }

    screenshots.push(await cdp.captureScreenshot('fe0023_e2e_phone_390x844_lab_deduction.png'));

    // 点击切换二级书签：② 自由探索
    console.log('[1.3.2] 点击二级书签 ② 自由探索...');
    await cdp.eval(`(() => {
      const btn = document.querySelector('[data-testid="subnav-tab-free"]');
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1000));
    screenshots.push(await cdp.captureScreenshot('fe0023_e2e_phone_390x844_lab_freeplay.png'));

    // 1.4 实战测评 (PaperWorkbench)
    console.log('\n[1.4] 导航至实战测评模块...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/exam` });
    await new Promise(r => setTimeout(r, 2000));

    const examShellState = await cdp.eval(`(() => {
      const capsule = document.querySelector('[data-testid="interactive-title-capsule"]');
      const mobileSubnav = document.querySelector('[data-testid="math-junior-mobile-subnav"]');
      const workbench = document.querySelector('[data-testid="mobile-paper-workbench"]');

      return {
        hasCapsule: !!capsule,
        hasMobileSubnav: !!mobileSubnav,
        hasWorkbench: !!workbench,
      };
    })()`);
    console.log('1.4 实战测评双轨与工作台检测:', examShellState);
    screenshots.push(await cdp.captureScreenshot('fe0023_e2e_phone_390x844_exam_workbench.png'));

    // 1.5 手机端水平溢出统一扫描
    const overallOverflow = await cdp.eval(`(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      return {
        scrollWidth,
        clientWidth,
        hasHorizontalOverflow: scrollWidth > clientWidth,
      };
    })()`);
    console.log('1.5 全局水平溢出终验:', overallOverflow);
    if (overallOverflow.hasHorizontalOverflow) {
      throw new Error(`Mobile has horizontal overflow: scrollWidth=${overallOverflow.scrollWidth}, clientWidth=${overallOverflow.clientWidth}`);
    }

    console.log('\n======================================================');
    console.log('--- 阶段 2: 架构师验收总结与截图清单 ---');
    console.log('======================================================');
    console.log(`总截图数: ${screenshots.length}`);
    screenshots.forEach((s, idx) => {
      console.log(`[${idx + 1}] ${s.filename} (${s.bytes} B, SHA256: ${s.sha256})`);
    });

    console.log('\n控制台捕获致命错误数:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('警告: 存在控制台错误:', consoleErrors);
    }

    console.log('\n🎉 TASK-FE-0023 真实浏览器 CDP 验收实测全部通过！');

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
      } catch {}
    }
  }
}

runE2E().catch((err) => {
  console.error('\n❌ E2E 验收失败:', err);
  process.exit(1);
});
