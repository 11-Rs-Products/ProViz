const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 800 });
  await page.goto('http://localhost:5173/');
  
  await page.click('#btn-mode-barchart');
  await page.waitForTimeout(500);
  await page.click('#btn-generate-barchart');
  await page.waitForTimeout(1000);
  
  for (let i = 0; i < 5; i++) {
    await page.click('#btn-next');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: '/Users/reyanshmanta/.gemini/antigravity-ide/brain/626ea482-134a-421b-ab91-5b38030b1fb5/debug_barchart.png' });
  await browser.close();
})();
