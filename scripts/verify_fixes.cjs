const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9555;
const USER_DATA_DIR = path.resolve(__dirname, `../tmp/chrome_verify_${Date.now()}`);

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

  async eval(expression, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await this.send('Runtime.evaluate', {
          expression: `(() => { try { return (${expression}); } catch(e) { return { __error: e.message }; } })()`,
          returnByValue: true,
          awaitPromise: true,
        });
        if (res.result && res.result.value && res.result.value.__error) {
          if (i === retries - 1) console.warn('Eval warning:', res.result.value.__error);
          await sleep(300);
          continue;
        }
        return res.result ? res.result.value : undefined;
      } catch (err) {
        if (i === retries - 1) throw err;
        await sleep(300);
      }
    }
  }

  async clickSelector(selector) {
    const box = await this.eval(`(() => {
      const el = document.querySelector('${selector}');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    if (!box) {
      return await this.eval(`(() => {
        const el = document.querySelector('${selector}');
        if (el) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          return true;
        }
        return false;
      })()`);
    }
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    return true;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    console.log(`📸 截图保存到: ${path.basename(outputPath)}`);
  }
}

async function run() {
  console.log('🚀 启动 Chrome 验证排版统一、溢出兜底、SVG切换与焦点回归...');
  if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    await sleep(250);
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

  const screenshotsDir = path.resolve(__dirname, '../tmp/screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  console.log('\n🌐 打开页面 http://localhost:5173/#/math-junior/concept ...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/#/math-junior/concept' });
  await sleep(3500);

  // 确保进入初中数学与考点导航
  await cdp.eval(`(() => {
    const mathBtn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.includes('初中数学'));
    if (mathBtn && !document.querySelector('[data-testid="concept-main-stage"]')) {
      mathBtn.click();
    }
  })()`);
  await sleep(1500);

  await cdp.eval(`(() => {
    const conceptTab = Array.from(document.querySelectorAll('button')).find(el => el.innerText && (el.innerText.includes('考点') || el.innerText.includes('探本溯源')));
    if (conceptTab) conceptTab.click();
  })()`);
  await sleep(1000);

  // 1. 验证排版规范与全局字号
  console.log('\n--- 🔍 验证 1: 字体UI渲染统一性与溢出兜底 ---');
  const typographyCheck = await cdp.eval(`(() => {
    const stageBody = document.querySelector('.stage-text-body');
    const computed = stageBody ? window.getComputedStyle(stageBody) : null;
    const mathContent = document.querySelector('.math-renderer');
    const computedMath = mathContent ? window.getComputedStyle(mathContent) : null;
    const katexEl = document.querySelector('.katex');
    const computedKatex = katexEl ? window.getComputedStyle(katexEl) : null;

    return {
      stageBodyFontSize: computed?.fontSize,
      stageBodyLineHeight: computed?.lineHeight,
      stageBodyOverflowWrap: computed?.overflowWrap,
      mathRendererOverflowWrap: computedMath?.overflowWrap,
      katexFontSize: computedKatex?.fontSize,
    };
  })()`);
  console.log('  ✔️ 字体与排版实测参数:', typographyCheck);

  // 2. 验证焦点切换：在第 1 个考点切换到第 4 阶段，同时子Tab切到【单点快练】
  console.log('\n--- 🔍 验证 2: 切换知识点，焦点还原回【四段论精讲】之【1 原点溯源】 ---');
  console.log('  👉 点击子 Tab [单点快练] 并选择四段论第 4 段...');
  await cdp.eval(`(() => {
    const practiceBtn = document.querySelector('[data-testid="subtab-practice"]');
    if (practiceBtn) practiceBtn.click();
  })()`);
  await sleep(600);

  const beforeTab = await cdp.eval(`(() => {
    const isPracticeActive = document.querySelector('[data-testid="subtab-practice"]')?.style?.background?.includes('var(--bg-card)') || false;
    const hasPractice = !!document.querySelector('.question-stem');
    return { isPracticeActive, hasPractice };
  })()`);
  console.log('  📌 切换考点前子Tab状态:', beforeTab);

  console.log('  👉 切换知识点，点击考点 [KP-051] 全等三角形的判定...');
  const clickKP051 = await cdp.eval(`(() => {
    const el = document.querySelector('[data-testid="point-item-KP-051"]');
    if (el) {
      el.click();
      return { clicked: true, testid: 'point-item-KP-051' };
    }
    return { clicked: false, available: Array.from(document.querySelectorAll('[data-testid^="point-item-"]')).map(e => e.innerText.replace(/\\n/g, ' ')) };
  })()`);
  console.log('  点击结果状态:', clickKP051);
  await sleep(1000);

  const afterPointSwitch = await cdp.eval(`(() => {
    const stageVal = document.querySelector('[data-active-stage]')?.getAttribute('data-active-stage');
    const stagesTabActive = document.querySelector('[data-testid="subtab-stages"]')?.style?.background?.includes('var(--bg-card)') || false;
    const stage1Text = document.querySelector('.stage-text-body')?.innerText || '';
    const hasOriginStory = stage1Text.includes('机械制造') || stage1Text.includes('源') || stage1Text.includes('零件');
    return {
      activeSubTabIsStages: stagesTabActive,
      activeStage: stageVal,
      hasOriginContent: hasOriginStory,
      stagePreview: stage1Text.slice(0, 80)
    };
  })()`);
  console.log('  🎉 切换知识点后焦点还原结果:');
  console.log(`    - 子视窗 Tab 是否还原到【四段论精讲】: ${afterPointSwitch.activeSubTabIsStages ? 'YES' : 'NO'}`);
  console.log(`    - 阶段是否还原到【1 原点溯源】: ${afterPointSwitch.activeStage === '1' ? 'YES' : 'NO'} (阶段: ${afterPointSwitch.activeStage})`);
  console.log(`    - 是否展示原点溯源正文: ${afterPointSwitch.hasOriginContent ? 'YES' : 'NO'}`);

  // 3. 验证 SVG 图解切换
  console.log('\n--- 🔍 验证 3: 切换考点 SVG 图解是否真实变化 ---');
  const svgKP051 = await cdp.eval(`(() => {
    const svgEl = document.querySelector('.concept-svg-container svg');
    return {
      svgFound: !!svgEl,
      headerText: svgEl ? svgEl.querySelector('text')?.textContent : null,
      innerLength: svgEl ? svgEl.innerHTML.length : 0
    };
  })()`);
  console.log('  ✔️ [KP-051] SVG 呈现内容:', svgKP051);
  await cdp.captureScreenshot(path.join(screenshotsDir, 'v1_KP051_svg.png'));

  console.log('  👉 切换考点，点击考点 [KP-053] 等腰三角形的性质...');
  const clickKP053 = await cdp.eval(`(() => {
    const el = document.querySelector('[data-testid="point-item-KP-053"]');
    if (el) {
      el.click();
      return { clicked: true, testid: 'point-item-KP-053' };
    }
    return { clicked: false, available: Array.from(document.querySelectorAll('[data-testid^="point-item-"]')).map(e => e.innerText.replace(/\\n/g, ' ')) };
  })()`);
  console.log('  点击结果状态:', clickKP053);
  await sleep(1000);

  const svgKP053 = await cdp.eval(`(() => {
    const svgEl = document.querySelector('.concept-svg-container svg');
    return {
      svgFound: !!svgEl,
      headerText: svgEl ? svgEl.querySelector('text')?.textContent : null,
      innerLength: svgEl ? svgEl.innerHTML.length : 0
    };
  })()`);
  console.log('  ✔️ [KP-053] SVG 呈现内容:', svgKP053);
  await cdp.captureScreenshot(path.join(screenshotsDir, 'v2_KP053_svg.png'));

  const svgChanged = svgKP051.headerText !== svgKP053.headerText;
  console.log(`  🎉 SVG 是否随考点发生真实切换: ${svgChanged ? 'YES (从 "' + svgKP051.headerText + '" 变为 "' + svgKP053.headerText + '")' : 'NO'}`);

  // 4. 控制台审计
  console.log('\n--- 📋 控制台 Console 审计 ---');
  console.log('捕获到的全部浏览器日志:');
  cdp.consoleLogs.forEach(l => console.log('  ', l));
  if (cdp.errors.length === 0) {
    console.log('🎉 完美！全程控制台 0 错误！');
  } else {
    cdp.errors.forEach(e => console.warn('  -', e));
  }

  await cdp.send('Browser.close').catch(() => {});
  chromeProcess.kill();
  console.log('\n🏁 验证执行完毕！');
}

run().catch(err => {
  console.error('❌ 验证异常:', err);
  process.exit(1);
});
