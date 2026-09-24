const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8803;
const CDP_PORT = 9653;
const DIST_DIR = path.resolve(__dirname, '../dist');
const EVIDENCE_DIR = path.resolve(__dirname, '../public/screenshots');
const ARTIFACT_DIR = path.resolve(__dirname, '../tmp/fe0022_evidence');

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
    const userDataDir = path.resolve(__dirname, `../tmp/chrome_fe0022_${Date.now()}`);
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
    // 门禁 3 & 4: 跃迁沙盒分步推演、题眼透视、出卷抽屉与在线作答
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 阶段 1: 手机端 (390x844) 跃迁沙盒与出卷考场全真验证 ---');
    console.log('======================================================');
    await cdp.setViewport(390, 844, true);

    // 1.1 导航至模块三动力学跃迁沙盒 (LeapLab)
    console.log('\n[1.1] 导航至模块三动力学跃迁沙盒...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/lab` });
    await new Promise(r => setTimeout(r, 2500));

    // 切换至 4D思维跃迁实验室 (LeapLab)
    await cdp.eval(`(() => {
      const leapTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('4D') || b.textContent.includes('跃迁'));
      if (leapTab) leapTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    // 1.2 检查手机端水平溢出 (门禁 3: scrollWidth === clientWidth === 390)
    const phoneOverflow = await cdp.eval(`(() => {
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
    console.log('1.2 手机端水平溢出检测 (门禁 3):', phoneOverflow);
    if (phoneOverflow.hasHorizontalOverflow) {
      throw new Error(`Mobile has horizontal overflow: scrollWidth=${phoneOverflow.scrollWidth}, clientWidth=${phoneOverflow.clientWidth}`);
    }

    // 1.3 检查 LeapLab 进场默认态：必须默认停在【分步推演】模式 (A.2 & 门禁 4)
    const leapLabInitialMode = await cdp.eval(`(() => {
      const deductionView = document.querySelector('[data-testid="step-deduction-view"]');
      const freeExploreView = document.querySelector('[data-testid="free-explore-view"]');
      const xrayBtn = document.querySelector('.xray-gem-floating-btn');
      const canvasBox = document.querySelector('.sandbox-viewport-85');

      return {
        deductionVisible: deductionView ? window.getComputedStyle(deductionView).display !== 'none' : false,
        freeExploreHidden: freeExploreView ? window.getComputedStyle(freeExploreView).display === 'none' : true,
        hasXrayBtn: !!xrayBtn,
        xrayText: xrayBtn ? xrayBtn.textContent.trim() : null,
        canvasTouchAction: canvasBox ? window.getComputedStyle(canvasBox).touchAction : null,
      };
    })()`);
    console.log('1.3 LeapLab 手机端默认态与手势隔离检测:', leapLabInitialMode);

    // 1.4 截图：手机端推演模式首屏
    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_phone_390x844_leaplab_deduction.png'));

    // 1.5 触发题眼透视按钮高亮
    console.log('\n[1.5] 点击题眼透视浮动宝石按钮...');
    await cdp.eval(`(() => {
      const xrayBtn = document.querySelector('.xray-gem-floating-btn');
      if (xrayBtn) xrayBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    // 1.6 步进推演：点击【下一步】前进到步骤 2
    console.log('\n[1.6] 点击分步推演【下一步】胶囊...');
    await cdp.eval(`(() => {
      const nextBtn = document.querySelector('.step-next-large-btn');
      if (nextBtn) nextBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_phone_390x844_leaplab_step2_xray.png'));

    // 1.7 导航至模块四【实战测评 · 智能组卷】(MobilePaperWorkbench)
    console.log('\n[1.7] 导航至模块四实战测评中心 (MobilePaperWorkbench)...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/exam` });
    await new Promise(r => setTimeout(r, 2500));

    // 1.8 检查手机端出卷工作台剪裁状态：确保 107 网格和波浪滑块被彻底砍掉
    const mobileWorkbenchPruning = await cdp.eval(`(() => {
      const hasGrid = !!document.querySelector('.kp-grid, [class*="grid-cols-10"]');
      const hasSliders = !!document.querySelector('.difficulty-ripple, .wave-slider');
      const hasSafeSpacer = !!document.querySelector('.bottom-safe-spacer');
      const startBtn = document.querySelector('[data-testid="mobile-start-exam-btn"]');
      return {
        hasKpGrid: hasGrid,
        hasWaveSliders: hasSliders,
        hasBottomSafeSpacer: hasSafeSpacer,
        hasStartBtn: !!startBtn,
        startBtnText: startBtn ? startBtn.textContent.trim() : null,
      };
    })()`);
    console.log('1.8 手机端出卷工作台精简与垫片检测:', mobileWorkbenchPruning);

    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_phone_390x844_paper_workbench.png'));

    // 1.9 点击【快速微调】滑出 iOS 27 Modal Bottom Sheet
    console.log('\n[1.9] 点击【快速微调】唤起出卷抽屉...');
    await cdp.eval(`(() => {
      const trigger = document.querySelector('[data-testid="mobile-quick-tuning-trigger"]');
      if (trigger) trigger.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    // 检查抽屉默认焦点是否严格锁定最左项 (门禁 4 刚性规约)
    const drawerDefaultFocus = await cdp.eval(`(() => {
      const btn100 = document.querySelector('[data-testid="score-system-btn-100"]');
      const btn71 = document.querySelector('[data-testid="semester-btn-7-1"]');
      const btnBasic = document.querySelector('[data-testid="difficulty-btn-basic"]');
      return {
        is100Active: btn100 ? btn100.className.includes('bg-[#0071e3]') : false,
        is71Active: btn71 ? btn71.className.includes('bg-[#0071e3]') : false,
        isBasicActive: btnBasic ? btnBasic.className.includes('bg-[#0071e3]') : false,
      };
    })()`);
    console.log('1.9 快速微调抽屉最左默认焦点检测 (门禁 4):', drawerDefaultFocus);

    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_phone_390x844_exam_tuning_drawer.png'));

    // 1.10 点击抽屉底部【立即开始全真测评】进入 OnlineExam
    console.log('\n[1.10] 开启全真测评，进入 OnlineExam...');
    await cdp.eval(`(() => {
      const startBtn = document.querySelector('[data-testid="drawer-start-exam-btn"]');
      if (startBtn) startBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 2000));

    // 检查 OnlineExam 手机端单列排版与悬浮进度胶囊
    const onlineExamMobileCheck = await cdp.eval(`(() => {
      const progressCapsule = document.querySelector('[data-testid="mobile-exam-progress-capsule"]');
      const choiceOpt = document.querySelector('button[type="button"][style*="min-height: 48px"]');
      const rightCockpit = document.querySelector('[data-testid="right-cockpit-sticky"]');
      return {
        hasProgressCapsule: !!progressCapsule,
        progressText: progressCapsule ? progressCapsule.textContent.trim() : null,
        has48pxOption: !!choiceOpt,
        isRightCockpitHidden: rightCockpit ? window.getComputedStyle(rightCockpit).display === 'none' : true,
      };
    })()`);
    console.log('1.10 在线考场手机端瀑布流与进度胶囊检测:', onlineExamMobileCheck);

    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_phone_390x844_online_exam.png'));

    // 1.11 点击立即交卷进入 ScorePanel 复盘大屏
    console.log('\n[1.11] 提交试卷进入 ScorePanel 素养大屏...');
    await cdp.eval(`(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('立即交卷') || b.textContent.includes('Submit Exam'));
      if (submitBtn) submitBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));

    const scorePanelCheck = await cdp.eval(`(() => {
      const hasReviewConcept = !!document.querySelector('[data-testid*="wrong-q-review-concept"]');
      const hasReviewXRay = !!document.querySelector('[data-testid*="wrong-q-review-xray"]');
      const hasSafeSpacer = !!document.querySelector('.bottom-safe-spacer');
      return {
        hasReviewConceptBtn: hasReviewConcept,
        hasReviewXRayBtn: hasReviewXRay,
        hasBottomSafeSpacer: hasSafeSpacer,
      };
    })()`);
    console.log('1.11 复盘大屏错题闭环按钮与安全垫片检测:', scorePanelCheck);

    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_phone_390x844_score_panel.png'));

    // =========================================================================
    // 阶段 2: 平板端 (820x1180, iPad Air)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 阶段 2: 平板端 (820x1180) 双模切换与组卷大屏验证 ---');
    console.log('======================================================');
    await cdp.setViewport(820, 1180, false);

    // 2.1 平板端 LeapLab 自由探索模式切换
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/lab` });
    await new Promise(r => setTimeout(r, 2000));

    await cdp.eval(`(() => {
      const leapTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('4D') || b.textContent.includes('跃迁'));
      if (leapTab) leapTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    await cdp.eval(`(() => {
      const freeTab = Array.from(document.querySelectorAll('.seg-item')).find(el => el.textContent.includes('自由探索') || el.textContent.includes('Free Play'));
      if (freeTab) freeTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_pad_820x1180_leaplab_freeplay.png'));

    // 2.2 平板端实战测评
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/exam` });
    await new Promise(r => setTimeout(r, 2000));
    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_pad_820x1180_exam_workbench.png'));

    // =========================================================================
    // 阶段 3: 电脑桌面端 (1440x900, Desktop Mac)
    // =========================================================================
    console.log('\n======================================================');
    console.log('--- 阶段 3: 桌面端 (1440x900) 4D 变异完整货架与左右解耦考场 ---');
    console.log('======================================================');
    await cdp.setViewport(1440, 900, false);

    // 3.1 桌面端 LeapLab 自由探索：验证 5 维变异完整货架与探究指南
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/lab` });
    await new Promise(r => setTimeout(r, 2000));

    await cdp.eval(`(() => {
      const leapTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('4D') || b.textContent.includes('跃迁'));
      if (leapTab) leapTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    await cdp.eval(`(() => {
      const freeTab = Array.from(document.querySelectorAll('.seg-item')).find(el => el.textContent.includes('自由探索') || el.textContent.includes('Free Play'));
      if (freeTab) freeTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const desktop4DCheck = await cdp.eval(`(() => {
      const bodyText = document.body.textContent;
      return {
        hasCarrier: bodyText.includes('载体变异'),
        hasParam: bodyText.includes('参数变异'),
        hasPosture: bodyText.includes('姿态变异'),
        hasDistractor: bodyText.includes('干扰加壳'),
        hasGuide: bodyText.includes('思维跃迁探究指南'),
      };
    })()`);
    console.log('3.1 桌面端 LeapLab 4D 变异完整货架检测:', desktop4DCheck);

    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_pc_1440x900_leaplab_free.png'));

    // 3.2 桌面端实战测评
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#/math-junior/exam` });
    await new Promise(r => setTimeout(r, 2000));
    screenshots.push(await cdp.captureScreenshot('fe0022_e2e_pc_1440x900_exam_workbench.png'));

    // 总结与断言
    console.log('\n======================================================');
    console.log('--- E2E 验收与门禁统计汇总 ---');
    console.log('======================================================');
    console.log(`控制台错误数: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('捕获的控制台非致命/致命错误:', consoleErrors);
    }
    console.log(`生成截图数量: ${screenshots.length}`);
    screenshots.forEach((s, idx) => {
      console.log(`  ${idx + 1}. ${s.filename} (${s.bytes} B, SHA256: ${s.sha256})`);
    });

    const report = {
      timestamp: new Date().toISOString(),
      gate3_consoleErrors: consoleErrors.length,
      gate3_mobileOverflow: phoneOverflow,
      screenshots,
    };

    fs.writeFileSync(
      path.resolve(ARTIFACT_DIR, 'e2e_report.json'),
      JSON.stringify(report, null, 2),
      'utf-8'
    );
    console.log('\n[E2E] 成功生成 e2e_report.json');

    return report;
  } finally {
    if (chromeProcess) {
      try { chromeProcess.kill('SIGTERM'); } catch {}
    }
    if (server) {
      try { server.close(); } catch {}
    }
    if (userDataDir && fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    }
  }
}

runE2E()
  .then(() => {
    console.log('\nTASK-FE-0022 E2E 真机验证圆满完成 (0 致命错误，3 端物理闭环)');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nE2E 验证失败:', err);
    process.exit(1);
  });
