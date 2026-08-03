const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    await page.goto('http://localhost:5174');
    
    console.log("Waiting for Pyodide...");
    await new Promise(r => setTimeout(r, 4000));
    
    console.log("Clicking run...");
    await page.evaluate(() => {
        const btn = document.getElementById('btn-run');
        if(btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
})();
