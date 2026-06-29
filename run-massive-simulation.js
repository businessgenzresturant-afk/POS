const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'https://pos.gen-z.online';
const SIMULATION_TIME_MS = 60 * 60 * 1000; // 1 hour

const stats = {
  startTime: Date.now(),
  ordersCreated: 0,
  billsGenerated: 0,
  itemsAdded: 0,
  itemsCancelled: 0,
  kdsProcessed: 0,
  errors: [],
  networkErrors: [],
  raceConditionsCaught: 0,
  completed: false
};

function logEvent(worker, msg) {
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${time}] [${worker}] ${msg}`);
}

function logError(worker, msg, err) {
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  const errStr = err?.message || String(err);
  console.error(`❌ [${time}] [${worker}] ${msg} - ${errStr}`);
  if (!errStr.includes('Target page, context or browser has been closed')) {
    stats.errors.push(`[${time}] [${worker}] ${msg} - ${errStr}`);
    saveStats();
  }
}

function saveStats() {
  fs.writeFileSync('simulation_stats.json', JSON.stringify(stats, null, 2));
}

async function safeGoto(page, url) {
  for (let i=0; i<3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    } catch(err) {
      if (err.message.includes('ERR_NETWORK_IO_SUSPENDED') || err.message.includes('chrome-error')) {
        await page.waitForTimeout(5000);
        continue;
      }
      throw err;
    }
  }
}

async function login(page, email, password) {
  await safeGoto(page, `${BASE}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(()=>{});
}

// ==========================================
// CASHIER WORKER - Creates Orders & Bills
// ==========================================
async function runCashierWorker(browser, workerId) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  try {
    await login(page, 'staff@genz.com', 'staff123');
    logEvent(workerId, 'Logged in successfully');

    while (Date.now() - stats.startTime < SIMULATION_TIME_MS) {
      try {
        await safeGoto(page, `${BASE}/dashboard`);
        await page.waitForTimeout(2000);
        
        const dineInBtn = page.locator('button', { hasText: 'Dine In' }).first();
        if (await dineInBtn.isVisible()) await dineInBtn.click();
        await page.waitForTimeout(1000);

        // Find available table
        const availableTables = await page.locator('button', { hasText: 'AVAILABLE' }).all();
        if (availableTables.length > 0) {
          const tableIdx = Math.floor(Math.random() * availableTables.length);
          await availableTables[tableIdx].click();
          await page.waitForTimeout(2000);
          
          const isDrawerOpen = await page.isVisible('text=Place Order') || await page.isVisible('text=Send to Kitchen');
          if (!isDrawerOpen) {
            logEvent(workerId, '⚠️ Drawer not open (race condition?)');
            stats.raceConditionsCaught++;
            continue;
          }

          // Add random items
          const numItems = Math.floor(Math.random() * 5) + 1;
          const addBtns = await page.locator('button', { hasText: 'Add' }).all();
          if (addBtns.length > 0) {
            for (let i = 0; i < numItems; i++) {
              const btnIdx = Math.floor(Math.random() * addBtns.length);
              try { await addBtns[btnIdx].click(); stats.itemsAdded++; await page.waitForTimeout(300); } catch(e) {}
            }
            // Place Order
            const placeBtn = page.locator('button', { hasText: /Place Order|Send to Kitchen/i }).first();
            if (await placeBtn.isVisible()) {
              await placeBtn.click();
              await page.waitForTimeout(2000);
              stats.ordersCreated++;
              logEvent(workerId, `✅ Placed order with ${numItems} items`);
            }
          }
        } else {
          // No tables available, go bill a running table
          await safeGoto(page, `${BASE}/tables`);
          await page.waitForTimeout(2000);
          
          const runningTables = await page.locator('button', { hasText: 'OCCUPIED' }).all();
          if (runningTables.length > 0) {
            const tableIdx = Math.floor(Math.random() * runningTables.length);
            await runningTables[tableIdx].click();
            await page.waitForTimeout(2000);
            
            const printBillBtn = page.locator('button', { hasText: 'Print Bill' }).first();
            const generateBillBtn = page.locator('button', { hasText: 'Generate' }).first();
            
            if (await printBillBtn.isVisible()) {
              await printBillBtn.click();
              await page.waitForTimeout(2000);
              const cashBtn = page.locator('button', { hasText: 'Cash' }).first();
              if (await cashBtn.isVisible()) {
                await cashBtn.click();
                await page.waitForTimeout(2000);
                const markPaidBtn = page.locator('button', { hasText: 'Mark as Paid' }).first();
                if (await markPaidBtn.isVisible()) {
                  await markPaidBtn.click();
                  await page.waitForTimeout(2000);
                  stats.billsGenerated++;
                  logEvent(workerId, '✅ Generated and paid bill (Cash)');
                }
              }
            } else if (await generateBillBtn.isVisible()) {
               await generateBillBtn.click();
               await page.waitForTimeout(2000);
               logEvent(workerId, '✅ Initiated billing');
            }
          }
        }
      } catch (err) {
        logError(workerId, 'Workflow error', err);
      }
      saveStats();
      await page.waitForTimeout(5000 + Math.random() * 10000);
    }
  } catch (err) { logError(workerId, 'Fatal error', err); }
  finally { await context.close(); logEvent(workerId, 'Finished'); }
}

// ==========================================
// KITCHEN WORKER
// ==========================================
async function runKitchenWorker(browser, workerId) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  try {
    await login(page, 'staff@genz.com', 'staff123');
    await safeGoto(page, `${BASE}/kds`);
    await page.waitForTimeout(3000);
    await page.click('body').catch(()=>{});
    logEvent(workerId, 'KDS Active');

    let memoryLogInterval = 0;
    while (Date.now() - stats.startTime < SIMULATION_TIME_MS) {
      try {
        const acceptBtns = await page.locator('button', { hasText: 'Accept' }).all();
        if (acceptBtns.length > 0) {
          for (let i=0; i<Math.min(acceptBtns.length, 3); i++) {
            await acceptBtns[i].click().catch(()=>{}); await page.waitForTimeout(500); stats.kdsProcessed++;
          }
          logEvent(workerId, `Accepted ${acceptBtns.length} orders`);
        }
        const readyBtns = await page.locator('button', { hasText: 'Mark Ready' }).all();
        if (readyBtns.length > 0) {
          for (let i=0; i<Math.min(readyBtns.length, 3); i++) {
            await readyBtns[i].click().catch(()=>{}); await page.waitForTimeout(500); stats.kdsProcessed++;
          }
          logEvent(workerId, `Marked ${readyBtns.length} ready`);
        }
        memoryLogInterval++;
        if (memoryLogInterval % 10 === 0) {
          const perf = await page.evaluate(() => window.performance && window.performance.memory ? window.performance.memory.usedJSHeapSize : 0).catch(()=>0);
          if (perf > 0) logEvent(workerId, `Memory usage: ${(perf / 1048576).toFixed(2)} MB`);
        }
      } catch (err) { logError(workerId, 'KDS loop error', err); }
      saveStats();
      await page.waitForTimeout(5000);
    }
  } catch (err) { logError(workerId, 'Fatal error', err); }
  finally { await context.close(); logEvent(workerId, 'Finished'); }
}

// ==========================================
// MANAGER WORKER
// ==========================================
async function runManagerWorker(browser, workerId) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await login(page, 'admin@genz.com', 'admin123');
    logEvent(workerId, 'Logged in successfully');

    while (Date.now() - stats.startTime < SIMULATION_TIME_MS) {
      try {
        await safeGoto(page, `${BASE}/reports`);
        await page.waitForTimeout(3000);
        await page.click('text=Generate Report').catch(()=>{});
        await page.waitForTimeout(2000);
        logEvent(workerId, 'Checked reports');

        await safeGoto(page, `${BASE}/tables`);
        await page.waitForTimeout(2000);
        const runningTables = await page.locator('button', { hasText: 'OCCUPIED' }).all();
        if (runningTables.length > 0) {
           const tableIdx = Math.floor(Math.random() * runningTables.length);
           await runningTables[tableIdx].click();
           await page.waitForTimeout(2000);
           
           const cancelBtns = await page.locator('button[title="Cancel Item"]').all();
           if (cancelBtns.length > 0) {
             await cancelBtns[0].click().catch(()=>{});
             await page.waitForTimeout(1000);
             const confirmBtn = page.locator('button', { hasText: 'Confirm' }).first();
             if (await confirmBtn.isVisible()) {
               await confirmBtn.click().catch(()=>{});
               stats.itemsCancelled++;
               logEvent(workerId, 'Cancelled an item mid-order');
             }
           }
        }
      } catch (err) { }
      saveStats();
      await page.waitForTimeout(20000);
    }
  } catch (err) { logError(workerId, 'Fatal error', err); }
  finally { await context.close(); logEvent(workerId, 'Finished'); }
}

// ==========================================
// ORCHESTRATOR
// ==========================================
async function runMassiveSimulation() {
  logEvent('ORCHESTRATOR', `Starting ${SIMULATION_TIME_MS / 60000} minute massive simulation...`);
  const browser = await chromium.launch({ headless: true });
  
  const workers = [
    runCashierWorker(browser, 'CASHIER-1'),
    runCashierWorker(browser, 'CASHIER-2'),
    runCashierWorker(browser, 'CASHIER-3'),
    runCashierWorker(browser, 'CASHIER-4'),
    runKitchenWorker(browser, 'KITCHEN-1'),
    runKitchenWorker(browser, 'KITCHEN-2'),
    runManagerWorker(browser, 'MANAGER-1')
  ];

  await Promise.all(workers);
  
  stats.completed = true;
  saveStats();
  logEvent('ORCHESTRATOR', 'Simulation Complete. Generating final database verification...');
  
  const dbContext = await browser.newContext();
  const dbPage = await dbContext.newPage();
  await login(dbPage, 'admin@genz.com', 'admin123');
  
  const validation = await dbPage.evaluate(async () => {
    try {
      const bills = await (await fetch('/api/bills')).json();
      const orders = await (await fetch('/api/orders')).json();
      return { billsCount: Array.isArray(bills.data) ? bills.data.length : bills.length, ordersCount: orders.length };
    } catch(e) { return { error: e.message }; }
  });
  
  stats.finalValidation = validation;
  saveStats();
  await browser.close();
  logEvent('ORCHESTRATOR', 'Done.');
}

runMassiveSimulation().catch(err => {
  console.error('Fatal orchestrator error:', err);
  stats.errors.push(`Fatal orchestrator error: ${err.message}`);
  saveStats();
});
