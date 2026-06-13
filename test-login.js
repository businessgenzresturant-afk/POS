const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting browser automation test...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to http://localhost:3000/login...');
    let res = await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' }).catch(() => null);
    if (!res || !res.ok()) {
        console.log('Trying 3001...');
        res = await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' }).catch(() => null);
    }
    
    console.log('✅ Page loaded. Waiting for body...');
    await page.waitForSelector('body', { timeout: 5000 });
    
    console.log('⌨️ Typing credentials...');
    await page.type('#email', 'admin@genz.com');
    await page.type('#password', 'admin123');
    
    console.log('🖱️ Clicking submit button...');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting 3 seconds for response...');
    await new Promise(r => setTimeout(r, 3000));
    
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // Check for error text
    const errorText = await page.evaluate(() => document.body.innerText);
    if (errorText.includes('Invalid credentials')) {
        console.log('❌ Error found on page: Invalid credentials');
        await page.screenshot({ path: 'login-failed.png' });
        console.log('📸 Saved screenshot of failure to login-failed.png');
    } else if (currentUrl.includes('/dashboard') || currentUrl.endsWith('/')) {
        console.log('🎉 SUCCESS: Successfully logged into the dashboard via browser automation!');
        await page.screenshot({ path: 'login-success.png' });
        console.log('📸 Saved screenshot of success to login-success.png');
    } else {
        console.log('❌ Unknown state. Taking screenshot anyway.');
        await page.screenshot({ path: 'login-unknown.png' });
    }
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await browser.close();
  }
})();
