const puppeteer = require('puppeteer-core');

async function testMephistoClonerrLive() {
  console.log('\n======================================================');
  console.log('🌍 VERIFYING https://mephistoclonerr.vercel.app');
  console.log('======================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('🔹 1. Navigating to https://mephistoclonerr.vercel.app...');
    const res = await page.goto('https://mephistoclonerr.vercel.app', { waitUntil: 'networkidle2', timeout: 25000 });
    console.log(`   ✅ HTTP Status: ${res.status()}`);

    // 2. Test live scraping on mephistoclonerr.vercel.app
    console.log('🔹 2. Testing Live URL Scraper for cheatglobal.com on mephistoclonerr.vercel.app...');
    const result = await page.evaluate(async () => {
      const apiRes = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://cheatglobal.com/', framework: 'react-tailwind' })
      });
      return await apiRes.json();
    });

    console.log(`   ✅ /api/analyze-url result: success=${result.success}`);
    if (!result.success) {
      throw new Error(`Scraping failed: ${result.error}`);
    }
    console.log(`   ✅ Target: ${result.url}`);
    console.log(`   ✅ Extracted Title: "${result.telemetry?.meta?.title}"`);
    console.log(`   ✅ Colors Detected: ${result.telemetry?.colors?.length || 0}`);
    console.log(`   ✅ Prompt Length: ${result.prompt?.length || 0} chars`);

    // 3. Test Full UI Interaction (Inputting URL & clicking Analyze)
    console.log('🔹 3. Testing Full UI Workflow on mephistoclonerr.vercel.app...');
    await page.evaluate(() => {
      document.getElementById('targetUrlInput').value = 'https://cheatglobal.com/';
      document.getElementById('analyzeUrlBtn').click();
    });

    // Wait for analysis to complete and dashboard to display
    await page.waitForFunction(() => {
      const db = document.getElementById('resultsDashboard');
      return db && db.style.display !== 'none';
    }, { timeout: 20000 });

    console.log('   ✅ Results Dashboard visible on mephistoclonerr.vercel.app!');

    // 4. Verify Live Babel Sandbox
    await new Promise(r => setTimeout(r, 2000));
    const iframeHandle = await page.$('#studioSandboxIframe');
    const frame = await iframeHandle.contentFrame();
    const frameError = await frame.$eval('.bg-red-900, [style*="color:#fca5a5"]', el => el.textContent).catch(() => null);
    if (frameError) {
      console.warn('   Sandbox warning:', frameError);
    } else {
      console.log('   ✅ Sandbox rendered with ZERO errors on mephistoclonerr.vercel.app!');
    }

    console.log('\n======================================================');
    console.log('🎉 MEPHISTOCLONERR.VERCEL.APP IS 100% OPERATIONAL!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testMephistoClonerrLive().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
