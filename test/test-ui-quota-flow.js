const puppeteer = require('puppeteer-core');
const assert = require('assert');

async function testUiQuotaFlow() {
  console.log('\n======================================================');
  console.log('🧪 TESTING FRONTEND QUOTA & UI WORKFLOW');
  console.log('======================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    console.log('🔹 1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // 1. Verify default input is empty
    const urlVal = await page.$eval('#targetUrlInput', el => el.value);
    console.log(`   ✅ Target URL input default value: "${urlVal}" (Empty as requested)`);
    assert.strictEqual(urlVal, '', 'Target URL input must be empty by default');

    // 2. Verify Credits display shows 150 (3 Hak)
    const creditsText = await page.$eval('#userCreditsDisplay', el => el.textContent.trim());
    const promptsBadge = await page.$eval('#userPromptsRemainingBadge', el => el.textContent.trim());
    console.log(`   ✅ User Credits Display: ${creditsText} (${promptsBadge})`);
    assert.strictEqual(creditsText, '150');
    assert.strictEqual(promptsBadge, '3 Hak');

    // 3. Verify Quota Countdown Timer is active
    const timerText = await page.$eval('#quotaTimerText', el => el.textContent.trim());
    console.log(`   ✅ Live Quota Countdown Timer: "${timerText}"`);
    assert.match(timerText, /^\d{2}:\d{2}:\d{2}$/, 'Timer must match HH:MM:SS format');

    // 4. Verify clicking Upgrade button opens Pricing Modal
    await page.evaluate(() => document.getElementById('btnOpenPricingModal').click());
    const modalDisplay = await page.$eval('#pricingModal', el => el.style.display);
    console.log(`   ✅ Pricing Modal opened on click: style.display="${modalDisplay}"`);
    assert.strictEqual(modalDisplay, 'flex');

    // 5. Verify Upgrade to Pro in modal
    await page.click('#btnUpgradePro');
    await new Promise(r => setTimeout(r, 500));
    const newCredits = await page.$eval('#userCreditsDisplay', el => el.textContent.trim());
    const newBadge = await page.$eval('#userPromptsRemainingBadge', el => el.textContent.trim());
    console.log(`   ✅ After Pro Upgrade: ${newCredits} Credits (${newBadge})`);
    assert.strictEqual(newCredits, '600');
    assert.strictEqual(newBadge, '12 Hak');

    console.log('\n======================================================');
    console.log('🎉 FRONTEND QUOTA & UI WORKFLOW TEST 100% PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testUiQuotaFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
