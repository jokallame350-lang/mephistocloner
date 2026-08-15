const puppeteer = require('puppeteer-core');
const assert = require('assert');

async function testVercelQuotaLive() {
  console.log('\n======================================================');
  console.log('🌍 VERIFYING LIVE QUOTA & PRICING ON VERCEL');
  console.log('🔗 URL: https://mephistoclonerr.vercel.app');
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
    const res = await page.goto('https://mephistoclonerr.vercel.app', { waitUntil: 'networkidle2' });
    console.log(`   ✅ HTTP Status: ${res.status()}`);

    // 1. Verify URL input is empty (No default kick link)
    const urlVal = await page.$eval('#targetUrlInput', el => el.value);
    console.log(`   ✅ Target URL input default value: "${urlVal}" (Clean & empty)`);
    assert.strictEqual(urlVal, '', 'Target URL input must be empty');

    // 2. Verify Initial Free Credits = 150 (15 Hak)
    const credits = await page.$eval('#userCreditsDisplay', el => el.textContent.trim());
    const badge = await page.$eval('#userPromptsRemainingBadge', el => el.textContent.trim());
    console.log(`   ✅ Initial Credits: ${credits} (${badge})`);
    assert.strictEqual(credits, '150');
    assert.strictEqual(badge, '15 Hak');

    // 3. Verify Live 24-Hour Quota Countdown Timer
    const timer = await page.$eval('#quotaTimerText', el => el.textContent.trim());
    console.log(`   ✅ Live 24h Quota Countdown Timer: "${timer}"`);
    assert.match(timer, /^\d{2}:\d{2}:\d{2}$/);

    // 4. Test Persistent User on Reload
    console.log('🔹 2. Testing Page Reload (Credits persistence)...');
    await page.reload({ waitUntil: 'networkidle2' });
    const creditsAfterReload = await page.$eval('#userCreditsDisplay', el => el.textContent.trim());
    console.log(`   ✅ Credits after page reload: ${creditsAfterReload} (Persisted!)`);
    assert.strictEqual(creditsAfterReload, '150');

    // 5. Test Pricing Modal Open & Upgrade to Pro (600 credits)
    console.log('🔹 3. Testing Upgrade & Pricing Modal on Vercel...');
    await page.evaluate(() => document.getElementById('btnOpenPricingModal').click());
    const modalDisplay = await page.$eval('#pricingModal', el => el.style.display);
    console.log(`   ✅ Pricing Modal is open: display="${modalDisplay}"`);
    assert.strictEqual(modalDisplay, 'flex');

    await page.evaluate(() => document.getElementById('btnUpgradePro').click());
    await new Promise(r => setTimeout(r, 600));

    const proCredits = await page.$eval('#userCreditsDisplay', el => el.textContent.trim());
    const proBadge = await page.$eval('#userPromptsRemainingBadge', el => el.textContent.trim());
    console.log(`   ✅ Pro Upgrade result: ${proCredits} Credits (${proBadge})`);
    assert.strictEqual(proCredits, '600');
    assert.strictEqual(proBadge, '60 Hak');

    console.log('\n======================================================');
    console.log('🎉 LIVE VERCEL QUOTA & PRICING VERIFIED 100% OPERATIONAL!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testVercelQuotaLive().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
