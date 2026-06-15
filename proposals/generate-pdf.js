const puppeteer = require('puppeteer');
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');

(async () => {
  console.log('📄 Generating PDF proposal...');

  const htmlPath = path.join(__dirname, 'GenZ_Restaurant_Proposal.html');
  const pdfPath = path.join(__dirname, 'GenZ_Restaurant_Proposal_RAGSPRO.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('❌ HTML file not found:', htmlPath);
    process.exit(1);
  }

  console.log('   Source:', htmlPath);
  console.log('   Output:', pdfPath);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    }
  });

  await browser.close();

  console.log('✅ PDF generated successfully!');
  console.log('📁', pdfPath);

  try {
    execFileSync('open', [pdfPath], { stdio: 'ignore' });
    console.log('🔓 PDF opened in default viewer');
  } catch (e) {
    console.log('💡 Open manually from proposals/ folder');
  }
})();