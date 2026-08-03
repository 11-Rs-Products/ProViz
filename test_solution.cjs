const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    await page.goto('http://localhost:5174');
    
    console.log("Waiting for Pyodide...");
    await new Promise(r => setTimeout(r, 4000));
    
    console.log("Clicking Show Solution...");
    await page.evaluate(() => {
        document.getElementById('btn-solution').click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    console.log("Clicking Run Code...");
    await page.evaluate(() => {
        document.getElementById('btn-run').click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Checking btn-next...");
    const nextBtnVisible = await page.evaluate(() => {
        const btn = document.getElementById('btn-next');
        return btn && btn.style.display !== 'none';
    });
    console.log("btn-next is visible:", nextBtnVisible);
    
    await browser.close();
})();
