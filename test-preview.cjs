const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
    console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[Browser PageError]: ${error.message}`);
  });

  console.log('Navigating to http://127.0.0.1:4173...');
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for 3 seconds to ensure DB initializes...');
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
  
  if (errors.length > 0) {
    console.log('Found errors in browser console:');
    errors.forEach(e => console.log(e));
    process.exit(1);
  } else {
    console.log('No errors in browser console! WASM loaded successfully.');
    process.exit(0);
  }
})();
