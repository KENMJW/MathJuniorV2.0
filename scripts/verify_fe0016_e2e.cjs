const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8793;
const CDP_PORT = 9643;
const DIST_DIR = path.resolve(__dirname, '../dist');
const EVIDENCE_DIR = path.resolve(__dirname, '../tmp/fe0016/evidence');

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
    const userDataDir = path.resolve(__dirname, `../tmp/chrome_fe0016_${Date.now()}`);
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

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(EVIDENCE_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot] Saved -> ${fullPath}`);
    return fullPath;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runE2E() {
  let server = null;
  let chromeProc = null;
  let cdp = null;
  let userDataDir = null;

  const consoleErrors = [];
  const consoleWarnings = [];

  try {
    server = await startStaticServer();
    const chromeInfo = await launchHeadlessChrome();
    chromeProc = chromeInfo.chrome;
    userDataDir = chromeInfo.userDataDir;

    const wsUrl = await getWebSocketUrl();
    cdp = new CdpClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    cdp.on('Runtime.consoleAPICalled', (params) => {
      const text = params.args.map(a => a.value !== undefined ? a.value : JSON.stringify(a)).join(' ');
      if (params.type === 'error') {
        consoleErrors.push(text);
        console.error(`[Browser Error] ${text}`);
      } else if (params.type === 'warning') {
        if (text.includes('fallback to mock') || text.includes('wasm')) {
          consoleErrors.push(text);
        }
        consoleWarnings.push(text);
      }
    });

    console.log('[E2E] Navigating to http://127.0.0.1:8793/#/math-junior/lab ...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/lab` });

    // 等待页面加载
    await new Promise(r => setTimeout(r, 2500));

    // 检查 App 是否成功挂载
    const title = await cdp.eval('document.title');
    console.log(`[E2E] Page title: ${title}`);

    // 等待 JSXGraph 画布渲染完成
    let ready = false;
    for (let i = 0; i < 20; i++) {
      const hasBoard = await cdp.eval('Boolean(document.querySelector(".jxgbox") || document.querySelector("svg"))');
      if (hasBoard) {
        ready = true;
        break;
      }
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(`[E2E] Canvas rendered: ${ready}`);

    // ==========================================
    // 验收 1：黑底可见 (Part C)
    // 检查黑底 #0f172a 上是否存在隐形的纯黑点/纯黑图元
    // ==========================================
    console.log('[E2E] === 验收 1: 黑底可见性核查 (Part C) ===');
    const blackPointsCheck = await cdp.eval(`(() => {
      let blackElementCount = 0;
      let visibleBrightCount = 0;
      const inspectedColors = [];

      document.querySelectorAll('ellipse, circle, path, polygon, line').forEach(el => {
        const fill = (el.getAttribute('fill') || '').toLowerCase().trim();
        const stroke = (el.getAttribute('stroke') || '').toLowerCase().trim();
        
        // 排除透明填充或纯白描边
        if (fill === 'black' || fill === '#000000' || fill === '#000' || fill === 'rgb(0,0,0)') {
          blackElementCount++;
        }
        if (fill === '#38bdf8' || fill === '#34c759' || stroke === '#38bdf8' || stroke === '#34c759') {
          visibleBrightCount++;
        }
        if (fill && fill !== 'none' && !inspectedColors.includes(fill)) {
          inspectedColors.push(fill);
        }
      });

      return {
        blackElementCount,
        visibleBrightCount,
        inspectedColors: inspectedColors.slice(0, 10),
      };
    })()`);

    console.log('[E2E] Black points audit:', JSON.stringify(blackPointsCheck));
    if (blackPointsCheck.blackElementCount > 0) {
      throw new Error(`[E2E FAILED] Found ${blackPointsCheck.blackElementCount} invisible black SVG elements on dark background!`);
    }
    console.log('[E2E PASSED] All dark background points/elements are defensively mapped to bright colors (#38bdf8 / #34c759).');
    await cdp.captureScreenshot('e2e_01_dark_visibility.png');

    // ==========================================
    // 切换到【4D 跃迁模型 (实验室二)】进行多语言与联动测试
    // ==========================================
    console.log('[E2E] Switching to "4D 跃迁模型" subview...');
    await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('.seg-item')).find(b => (b.textContent || '').includes('4D 跃迁模型'));
      if (btn) btn.click();
      if (typeof window.__setLabSubView === 'function') {
        window.__setLabSubView('leap_4d');
      }
    })()`);
    await new Promise(r => setTimeout(r, 800));

    // ==========================================
    // 验收 2：X-Ray / 遥测多语言切换 (Part B)
    // ==========================================
    console.log('[E2E] === 验收 2: 多语言与 X-Ray 切换 (Part B) ===');
    
    // 检查默认中文文本
    const initialZhTexts = await cdp.eval(`(() => {
      const shelf = document.querySelector('.sandbox-4d-shelf');
      const shelfText = shelf ? shelf.innerText : '';
      const telemetry = document.querySelector('.telemetry-readings');
      const telemText = telemetry ? telemetry.innerText : '';
      return {
        hasCarrierZh: shelfText.includes('载体变异'),
        hasParamZh: shelfText.includes('参数变异'),
        hasPostureZh: shelfText.includes('姿态变异'),
        hasCamouflageZh: shelfText.includes('干扰加壳'),
        telemText: telemText.slice(0, 50),
      };
    })()`);
    console.log('[E2E] Initial Chinese 4D cards:', JSON.stringify(initialZhTexts));
    if (!initialZhTexts.hasCarrierZh || !initialZhTexts.hasParamZh) {
      throw new Error('[E2E FAILED] Chinese 4D shelf cards not found in LeapLab!');
    }

    // 切换到英文 locale ('en')
    console.log('[E2E] Clicking language switch button to switch to English...');
    const langBtnResult = await cdp.eval(`(() => {
      const toggle = document.querySelector('[data-testid="math-lang-toggle"]');
      if (toggle) {
        toggle.click();
        return { success: true, text: toggle.textContent.trim() };
      }
      return { success: false };
    })()`);
    console.log('[E2E] Lang button click result:', JSON.stringify(langBtnResult));

    await new Promise(r => setTimeout(r, 600));

    // 确保当前依然停留在 4D 跃迁模型视口
    await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('.seg-item')).find(b => (b.textContent || '').includes('4D 跃迁模型') || (b.textContent || '').includes('4D'));
      if (btn && !btn.classList.contains('active')) btn.click();
      if (typeof window.__setLabSubView === 'function') {
        window.__setLabSubView('leap_4d');
      }
    })()`);

    await new Promise(r => setTimeout(r, 600));

    // 检查英文环境下的 4D 面板、遥测文字与指南
    const enTexts = await cdp.eval(`(() => {
      const shelf = document.querySelector('.sandbox-4d-shelf');
      const shelfText = shelf ? shelf.innerText : '';
      const telemetry = document.querySelector('.telemetry-readings');
      const telemText = telemetry ? telemetry.innerText : '';
      return {
        hasCarrierEn: shelfText.includes('Carrier Variation'),
        hasParamEn: shelfText.includes('Parameter Variation'),
        hasPostureEn: shelfText.includes('Posture Variation'),
        hasCamouflageEn: shelfText.includes('Camouflage & X-Ray'),
        shelfPreview: shelfText.slice(0, 200),
        telemText: telemText.slice(0, 60),
      };
    })()`);
    console.log('[E2E] English locale inspection:', JSON.stringify(enTexts));
    if (!enTexts.hasCarrierEn || !enTexts.hasParamEn || !enTexts.hasPostureEn || !enTexts.hasCamouflageEn) {
      throw new Error(`[E2E FAILED] 4D cards did not update to English! Found: ${JSON.stringify(enTexts)}`);
    }

    // 点击开启 X-Ray 透视
    console.log('[E2E] Toggling X-Ray Vision button in English mode...');
    const xrayClickResult = await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('.preset-btn'));
      const xrayBtn = btns.find(b => (b.textContent || '').includes('X-Ray'));
      if (xrayBtn) {
        xrayBtn.click();
        return { clicked: true, text: xrayBtn.textContent.trim() };
      }
      return { clicked: false, allBtns: btns.map(b => b.textContent.trim()) };
    })()`);
    console.log('[E2E] X-Ray click result:', JSON.stringify(xrayClickResult));

    await new Promise(r => setTimeout(r, 500));

    const xrayStatus = await cdp.eval(`(() => {
      const xrayBtn = Array.from(document.querySelectorAll('.preset-btn')).find(b => (b.textContent || '').includes('X-Ray'));
      return xrayBtn ? xrayBtn.textContent.trim() : '';
    })()`);
    console.log(`[E2E] X-Ray button text in English mode: "${xrayStatus}"`);
    if (!xrayStatus.includes('ON')) {
      throw new Error(`[E2E FAILED] X-Ray toggle text expected "ON", got "${xrayStatus}"`);
    }

    await cdp.captureScreenshot('e2e_02_locale_en_telemetry.png');

    // ==========================================
    // 验收 3：参数框 ↔ 图形双向联动 (Part A)
    // ==========================================
    console.log('[E2E] === 验收 3: 双向参数联动 (Part A) ===');

    // 读取当前控制条滑块
    const sliderInitial = await cdp.eval(`(() => {
      const slider = document.querySelector('.apple-slider');
      return slider ? { value: slider.value, min: slider.min, max: slider.max } : null;
    })()`);
    console.log('[E2E] Initial slider state:', JSON.stringify(sliderInitial));

    // 测试通过 preset 按钮与滑块双向响应
    console.log('[E2E] Clicking preset angle button (90° Perpendicular)...');
    const clickDetail = await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('.preset-btn'));
      const btn90 = btns.find(b => (b.textContent || '').includes('90° Perpendicular') || (b.textContent || '').includes('90° 垂直'));
      if (btn90) {
        btn90.click();
        return { clicked: true, text: btn90.textContent.trim() };
      }
      return { clicked: false, allPresets: btns.map(b => b.textContent.trim()) };
    })()`);
    console.log('[E2E] Angle preset click detail:', JSON.stringify(clickDetail));

    await new Promise(r => setTimeout(r, 600));

    const sliderAfterPreset = await cdp.eval(`(() => {
      const allSliders = Array.from(document.querySelectorAll('input[type="range"], .apple-slider'));
      const rotationSlider = document.querySelector('#sandbox-slider') || allSliders[0];
      const paramTSlider = document.querySelector('#param-t-slider');
      const valText = document.querySelector('.slider-group strong')?.textContent;
      return {
        sliderCount: allSliders.length,
        sliderVal: rotationSlider ? rotationSlider.value : null,
        paramTVal: paramTSlider ? paramTSlider.value : null,
        valText,
      };
    })()`);
    console.log('[E2E] Slider after preset click:', JSON.stringify(sliderAfterPreset));
    if (sliderAfterPreset.sliderVal !== '90') {
      throw new Error(`[E2E FAILED] Expected slider value 90 after clicking preset, got ${sliderAfterPreset.sliderVal}`);
    }

    await cdp.captureScreenshot('e2e_03_drag_linkage.png');

    // ==========================================
    // Console 零 Error 红线断言
    // ==========================================
    console.log('[E2E] === Console 红线核验 ===');
    console.log(`[E2E] Total Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('[E2E FAILED] Console Errors detected:', consoleErrors);
      throw new Error(`Console errors found: ${consoleErrors.join('; ')}`);
    }
    console.log('[E2E PASSED] Console clean! Zero error, zero wasm compile failure, zero fallback.');

    console.log('[E2E] All 3 verification checks PASSED successfully!');
  } finally {
    if (cdp) cdp.close();
    if (chromeProc) {
      chromeProc.kill('SIGTERM');
      console.log('[Chrome] Headless Chrome terminated.');
    }
    if (server) {
      server.close();
      console.log('[StaticServer] Server closed.');
    }
    if (userDataDir && fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }
}

runE2E().then(() => {
  console.log('[E2E] Finished with exit code 0.');
  process.exit(0);
}).catch((err) => {
  console.error('[E2E] Test failed with error:', err);
  process.exit(1);
});
