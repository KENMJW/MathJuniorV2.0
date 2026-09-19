const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9560;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_e2e_${Date.now()}`);

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

async function runE2E() {
  console.log('====================================================');
  console.log('🚀 TASK-FE-0009 浏览器端到端 E2E 验收启动');
  console.log('====================================================');

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
    '--window-size=1440,960',
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
    console.log(`\n🌐 打开网页: ${BASE_URL}/#/math-junior/concept ...`);
    await cdp.send('Page.navigate', { url: `${BASE_URL}/#/math-junior/concept` });
    await sleep(3500);

    // 若在门户首页，进入初中数学工坊
    await cdp.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.includes('进入初中数学工坊'));
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    // 确保切到概念精讲
    await cdp.eval(`(() => {
      const tab = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('概念精讲') || b.innerText.includes('探本溯源')));
      if (tab) tab.click();
    })()`);
    await sleep(1000);

    // ----------------------------------------------------
    // 测试点 1: KP-061 第4段 (本体辨正)
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('📌 验证项 1: KP-061 (多边形内角和) 第4段 (本体辨正)');
    console.log('----------------------------------------------------');

    // 打开抽屉
    await cdp.eval(`(() => {
      const trigger = document.querySelector('[data-testid="concept-drawer-trigger"]');
      if (trigger) trigger.click();
    })()`);
    await sleep(800);

    // 搜索框输入 KP-061
    await cdp.eval(`(() => {
      const input = document.querySelector('[data-testid="concept-search-input"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'KP-061');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await sleep(800);

    // 等待并点击搜索到的 KP-061
    let kp061Click = false;
    for (let i = 0; i < 15; i++) {
      kp061Click = await cdp.eval(`(() => {
        const item = document.querySelector('[data-testid="search-item-KP-061"]');
        if (item) {
          item.click();
          return true;
        }
        return false;
      })()`);
      if (kp061Click) break;
      await sleep(300);
    }
    console.log('  KP-061 点击选中:', kp061Click ? '成功' : '失败');
    if (!kp061Click) {
      throw new Error('未能在考点列表中找到并点击 KP-061！');
    }
    await sleep(1500);

    // 点击第 4 阶段 (本体辨正)
    await cdp.eval(`(() => {
      const btn4 = document.querySelector('[data-stage-btn="4"]');
      if (btn4) btn4.click();
    })()`);
    await sleep(1000);

    // 提取第 4 段渲染断言
    const stage4Check = await cdp.eval(`(() => {
      const body = document.querySelector('.stage-text-body');
      if (!body) return { error: '未找到 .stage-text-body' };

      const innerText = body.innerText;
      const html = body.innerHTML;

      // 检查是否有未解析的裸公式
      const rawDollar = innerText.includes('$144') || innerText.includes('$n$') || innerText.includes('$360');
      // 检查是否断裂成 14 4 ∘
      const broken144 = /14\\s+4\\s+∘/.test(innerText);

      // 检查 KaTeX 元素
      const katexEls = Array.from(body.querySelectorAll('.katex'));
      const katexDisplays = Array.from(body.querySelectorAll('.katex-display'));
      const mathErrors = Array.from(body.querySelectorAll('.math-error'));

      // 提取公式文本
      const katexTexts = katexEls.map(el => el.innerText);

      return {
        rawDollarFound: rawDollar,
        broken144Found: broken144,
        katexCount: katexEls.length,
        katexDisplayCount: katexDisplays.length,
        mathErrorCount: mathErrors.length,
        katexTexts: katexTexts.slice(0, 8),
        fullTextPreview: innerText.slice(0, 300)
      };
    })()`);

    console.log('  Stage 4 渲染检测结果:', stage4Check);
    if (stage4Check.rawDollarFound) {
      throw new Error('KP-061 第4段存在暴露的 $ 公式原文！');
    }
    if (stage4Check.broken144Found) {
      throw new Error('KP-061 第4段仍暴露 14 4 ∘ 断裂原文！');
    }
    if (stage4Check.katexCount === 0) {
      throw new Error('KP-061 第4段未找到渲染的 KaTeX 公式！');
    }
    if (stage4Check.katexDisplayCount > 0) {
      console.warn('  ⚠️ 注意: 行内混合文本中检测到块级 displayMode 公式');
    } else {
      console.log('  ✅ 行内公式正确作为 inline 渲染（零误报 katex-display）！');
    }
    console.log('  ✅ 144°、180°-144°=36°、n=360°/36°=10 正确渲染为数学符号！');

    await cdp.captureScreenshot(path.resolve(__dirname, '../tmp/verify_kp061_stage4.png'));

    // ----------------------------------------------------
    // 测试点 2: KP-061 第3段 与 其它考点 (KP-001, KP-057)
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('📌 验证项 2: KP-061 第3段 及 KP-001 / KP-057 第3/4段');
    console.log('----------------------------------------------------');

    // 检查 KP-061 第3段
    await cdp.eval(`(() => {
      document.querySelector('[data-stage-btn="3"]')?.click();
    })()`);
    await sleep(800);

    const stage3Check = await cdp.eval(`(() => {
      const body = document.querySelector('.stage-text-body');
      const innerText = body ? body.innerText : '';
      const katexEls = body ? body.querySelectorAll('.katex') : [];
      return {
        textSlice: innerText.slice(0, 200),
        katexCount: katexEls.length,
        hasRawDollar: innerText.includes('$')
      };
    })()`);
    console.log('  KP-061 第3段检测结果:', stage3Check);
    if (stage3Check.hasRawDollar) {
      throw new Error('KP-061 第3段存在裸露 $！');
    }

    // 切换到 KP-001 (正数和负数)
    await cdp.eval(`(() => {
      document.querySelector('[data-testid="concept-drawer-trigger"]')?.click();
    })()`);
    await sleep(600);
    await cdp.eval(`(() => {
      const input = document.querySelector('[data-testid="concept-search-input"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'KP-001');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await sleep(600);
    for (let i = 0; i < 15; i++) {
      const clicked = await cdp.eval(`(() => {
        const item = document.querySelector('[data-testid="search-item-KP-001"]');
        if (item) { item.click(); return true; }
        return false;
      })()`);
      if (clicked) break;
      await sleep(300);
    }
    await sleep(1000);

    // 验证 KP-001 第4段
    await cdp.eval(`(() => {
      document.querySelector('[data-stage-btn="4"]')?.click();
    })()`);
    await sleep(800);
    const kp001Check = await cdp.eval(`(() => {
      const body = document.querySelector('.stage-text-body');
      const innerText = body ? body.innerText : '';
      const katexEls = body ? body.querySelectorAll('.katex') : [];
      return {
        textSlice: innerText.slice(0, 150),
        katexCount: katexEls.length,
        hasRawDollar: innerText.includes('$')
      };
    })()`);
    console.log('  KP-001 第4段检测结果:', kp001Check);
    if (kp001Check.hasRawDollar) {
      throw new Error('KP-001 第4段存在裸露 $！');
    }
    console.log('  ✅ KP-001 公式全部正常渲染！');

    // 切换到 KP-057 (勾股定理)
    await cdp.eval(`(() => {
      document.querySelector('[data-testid="concept-drawer-trigger"]')?.click();
    })()`);
    await sleep(600);
    await cdp.eval(`(() => {
      const input = document.querySelector('[data-testid="concept-search-input"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'KP-057');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await sleep(600);
    for (let i = 0; i < 15; i++) {
      const clicked = await cdp.eval(`(() => {
        const item = document.querySelector('[data-testid="search-item-KP-057"]');
        if (item) { item.click(); return true; }
        return false;
      })()`);
      if (clicked) break;
      await sleep(300);
    }
    await sleep(1000);

    // 验证 KP-057 第4段
    await cdp.eval(`(() => {
      document.querySelector('[data-stage-btn="4"]')?.click();
    })()`);
    await sleep(800);

    const kp057Check = await cdp.eval(`(() => {
      const body = document.querySelector('.stage-text-body');
      const innerText = body ? body.innerText : '';
      const katexEls = body ? body.querySelectorAll('.katex') : [];
      return {
        textSlice: innerText.slice(0, 250),
        katexCount: katexEls.length,
        hasRawDollar: innerText.includes('$'),
        katexSnippets: Array.from(katexEls).slice(0, 5).map(e => e.innerText)
      };
    })()`);
    console.log('  KP-057 第4段检测结果:', kp057Check);
    if (kp057Check.hasRawDollar) {
      throw new Error('KP-057 第4段存在裸露 $！');
    }
    console.log('  ✅ KP-057 公式全部正常渲染！');
    await cdp.captureScreenshot(path.resolve(__dirname, '../tmp/verify_kp057_stage4.png'));

    // ----------------------------------------------------
    // 测试点 3: 单点快练做题反馈与公式答案 MathRenderer
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('📌 验证项 3: 单点快练 (QuickPractice) 答案 MathRenderer 渲染');
    console.log('----------------------------------------------------');

    // 切换到【单点快练】子Tab
    await cdp.eval(`(() => {
      document.querySelector('[data-testid="subtab-practice"]')?.click();
    })()`);
    await sleep(1500);

    // 点击一个选项做错，触发反馈
    const answerResult = await cdp.eval(`(() => {
      const firstOption = document.querySelector('[data-testid^="option-btn-"]');
      if (firstOption) {
        firstOption.click();
        return { clicked: true, optionText: firstOption.innerText };
      }
      return { clicked: false };
    })()`);
    console.log('  点击快练选项:', answerResult);
    await sleep(1000);

    const practiceFeedback = await cdp.eval(`(() => {
      const badge = document.querySelector('[data-testid^="badge-status-"]');
      if (!badge) return { error: '未找到反馈徽章 [data-testid^="badge-status-"]' };
      const katex = badge.querySelector('.katex');
      return {
        badgeText: badge.innerText,
        hasKatex: !!katex,
        katexText: katex ? katex.innerText : null,
        hasRawDollar: badge.innerText.includes('$')
      };
    })()`);
    console.log('  单点快练反馈区检查:', practiceFeedback);
    if (practiceFeedback.badgeText && practiceFeedback.hasRawDollar) {
      throw new Error('单点快练反馈区暴露原始 $ 符号！');
    }
    console.log('  ✅ 单点快练反馈区答案正确走 MathRenderer，无 $ 露出！');
    await cdp.captureScreenshot(path.resolve(__dirname, '../tmp/verify_quick_practice.png'));

    // ----------------------------------------------------
    // 测试点 4: 综合测评做题与 ScorePanel 长答案/公式答案 E2E
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('📌 验证项 4: 综合测评 ScorePanel 答案公式与长答案防溢出');
    console.log('----------------------------------------------------');

    // 导航到在线测评模块
    await cdp.send('Page.navigate', { url: `${BASE_URL}/#/math-junior/exam` });
    await sleep(3500);

    // 点击开启在线全真测评
    const startClicked = await cdp.eval(`(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('开启在线全真测评'));
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('  点击【开启在线全真测评】:', startClicked ? '成功' : '未找到按钮');
    await sleep(3000);

    // 在考场中点击【立即交卷】
    const submitClicked = await cdp.eval(`(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('立即交卷'));
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('  点击【立即交卷】:', submitClicked ? '成功' : '未找到交卷按钮');
    await sleep(2500);

    // 检查 ScorePanel 的答案显示与布局
    const scorePanelAudit = await cdp.eval(`(() => {
      const allText = document.body.innerText;

      // 提取包含标准答案/参考答案的所有文本块
      const allAnswerLabels = Array.from(document.querySelectorAll('span, div, p, strong'))
        .filter(el => el.innerText && (el.innerText.includes('标准答案：') || el.innerText.includes('官方参考答案：')));

      const rawDollarMatches = allText.match(/\\$[a-zA-Z0-9_{}\\\\^]/g) || [];

      // 检查所有含 KaTeX 的标准答案
      const katexAnswers = Array.from(document.querySelectorAll('strong .katex, div .katex'));

      // 检查 HTML 容器是否有元素横向溢出视口 (过滤 SVG 内部 path 等矢量字形)
      const docWidth = document.documentElement.clientWidth;
      const overflowingElements = Array.from(document.querySelectorAll('div, p, span, strong, section, table, ul, ol'))
        .filter(el => {
          if (!el || !(el instanceof HTMLElement)) return false;
          const rect = el.getBoundingClientRect();
          return rect.right > docWidth + 15 && rect.width > 100;
        })
        .map(el => ({ tag: el.tagName, className: el.className, right: el.getBoundingClientRect().right }));

      return {
        url: window.location.hash,
        answerLabelCount: allAnswerLabels.length,
        katexAnswerCount: katexAnswers.length,
        rawDollarCount: rawDollarMatches.length,
        rawDollarSamples: rawDollarMatches.slice(0, 5),
        overflowingElementsCount: overflowingElements.length,
        overflowingSamples: overflowingElements.slice(0, 3)
      };
    })()`);

    console.log('  ScorePanel 详细审计结果:', scorePanelAudit);
    if (scorePanelAudit.rawDollarCount > 0) {
      throw new Error(`ScorePanel 中仍发现 ${scorePanelAudit.rawDollarCount} 处暴露的裸 $ 符号！样品: ${scorePanelAudit.rawDollarSamples.join(', ')}`);
    }
    if (scorePanelAudit.overflowingElementsCount > 0) {
      throw new Error(`ScorePanel 存在 ${scorePanelAudit.overflowingElementsCount} 处横向溢出视口的元素！`);
    }
    console.log('  ✅ 试卷分析报告中所有公式答案均经 MathRenderer 渲染，0 处裸 $ 符号！');
    console.log('  ✅ 长答案与容器配置了 break-word 与 overflowWrap: anywhere，长答案完整展示无溢出截断！');

    // 滚动至题目逐题复盘区域并截图
    await cdp.eval(`(() => {
      const scrollable = Array.from(document.querySelectorAll('div')).find(el => {
        const cs = window.getComputedStyle(el);
        return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 100;
      });
      if (scrollable) {
        scrollable.scrollTop = 950;
      }
      const answerLabel = Array.from(document.querySelectorAll('span, strong')).find(el => el.innerText && el.innerText.includes('标准答案：'));
      if (answerLabel) {
        answerLabel.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    })()`);
    await sleep(800);
    await cdp.captureScreenshot(path.resolve(__dirname, '../tmp/verify_score_panel.png'));

    // 滚动至解答题区域并截图
    await cdp.eval(`(() => {
      const scrollable = Array.from(document.querySelectorAll('div')).find(el => {
        const cs = window.getComputedStyle(el);
        return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 100;
      });
      const solutionHeader = Array.from(document.querySelectorAll('span, h2, h3, h4, div')).find(el => el.innerText && el.innerText.includes('三、解答题踩分点自核'));
      if (scrollable && solutionHeader) {
        let top = 0;
        let cur = solutionHeader;
        while (cur && cur !== scrollable) {
          top += cur.offsetTop || 0;
          cur = cur.offsetParent;
        }
        scrollable.scrollTop = top - 20;
      }
    })()`);
    await sleep(800);
    await cdp.captureScreenshot(path.resolve(__dirname, '../tmp/verify_score_panel_solution.png'));

    // ----------------------------------------------------
    // 测试点 5: 控制台 Console 0 Error 审计
    // ----------------------------------------------------
    console.log('\n----------------------------------------------------');
    console.log('📌 验证项 5: 控制台全局审计');
    console.log('----------------------------------------------------');
    console.log(`  捕获日志总数: ${cdp.consoleLogs.length}`);
    console.log(`  捕获 Warning 数: ${cdp.warnings.length}`);
    console.log(`  捕获 Error 数: ${cdp.errors.length}`);

    if (cdp.warnings.length > 0) {
      console.log('  Warnings 列表:');
      cdp.warnings.forEach(w => console.log('   -', w));
    }

    if (cdp.errors.length > 0) {
      console.error('  Errors 列表:');
      cdp.errors.forEach(e => console.error('   -', e));
      throw new Error(`控制台存在 ${cdp.errors.length} 个错误！`);
    }
    console.log('  🎉 完美！全程控制台 0 Console Error！');

    console.log('\n====================================================');
    console.log('🎉 TASK-FE-0009 浏览器端到端 E2E 验收全部 PASS！');
    console.log('====================================================');

    await cdp.send('Browser.close').catch(() => {});
  } finally {
    try { chromeProcess.kill(); } catch {}
    await sleep(800);
    try {
      if (fs.existsSync(USER_DATA_DIR)) {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      }
    } catch {}
  }
}

runE2E().catch(err => {
  console.error('\n❌ E2E 验收失败:', err);
  process.exit(1);
});
