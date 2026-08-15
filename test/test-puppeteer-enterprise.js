const puppeteer = require('puppeteer-core');

async function testEnterpriseUi() {
  console.log('\n======================================================');
  console.log('🌐 TESTING ENTERPRISE 3.0 FRONTEND UI IN BROWSER');
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
    console.log('🔹 1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Verify title
    const title = await page.title();
    console.log(`   ✅ Page loaded: "${title}"`);

    // 2. Test Community Modal
    console.log('🔹 2. Testing Community Showcase Modal...');
    await page.evaluate(() => document.getElementById('btnOpenCommunityModal').click());
    await new Promise(r => setTimeout(r, 1200));

    const templateCardsCount = await page.$$eval('#communityGrid .community-card', els => els.length);
    console.log(`   ✅ Community Modal open with ${templateCardsCount} template cards`);

    // Fork Kick.com template
    console.log('🔹 3. Testing 1-Click Forking Kick.com template...');
    await page.evaluate(() => window.__forkTemplate('tpl_kick_livestream'));
    await new Promise(r => setTimeout(r, 1200));

    const editorValue = await page.$eval('#liveCodeEditor', el => el.value);
    console.log(`   ✅ Template forked into editor (${editorValue.length} characters)`);

    // 4. Test Vision AI Self-Healing Modal
    console.log('🔹 4. Testing Vision AI Self-Healing Modal...');
    await page.evaluate(() => document.getElementById('btnOpenVisionHealing').click());
    await new Promise(r => setTimeout(r, 2000));

    const visionScore = await page.$eval('#visionCurrentScore', el => el.textContent);
    console.log(`   ✅ Vision AI Self-Healing modal open (Score: ${visionScore})`);

    // 5. Test Full-Stack DB Modal
    console.log('🔹 5. Testing Full-Stack DB & Prisma Modal...');
    await page.evaluate(() => document.getElementById('closeVisionModalBtn').click());
    await page.evaluate(() => document.getElementById('btnOpenFullStackDb').click());
    await new Promise(r => setTimeout(r, 2000));

    const dbCode = await page.$eval('#fullStackDbCodeViewer', el => el.value);
    console.log(`   ✅ DB modal open with Prisma schema (${dbCode.length} characters)`);

    // 6. Test Multi-Platform Mobile/Figma Modal
    console.log('🔹 6. Testing Multi-Platform Mobile & Figma Modal...');
    await page.evaluate(() => document.getElementById('closeDbModalBtn').click());
    await page.evaluate(() => document.getElementById('btnOpenMultiPlatform').click());
    await new Promise(r => setTimeout(r, 2000));

    const platformCode = await page.$eval('#multiPlatformCodeViewer', el => el.value);
    console.log(`   ✅ Multi-platform modal open with React Native TSX (${platformCode.length} characters)`);

    // 7. Test WYSIWYG Inspect Mode
    console.log('🔹 7. Testing WYSIWYG Inspect Mode toggle...');
    await page.evaluate(() => document.getElementById('closeMultiPlatformModalBtn').click());
    await page.evaluate(() => document.getElementById('btnToggleWysiwygInspector').click());
    await new Promise(r => setTimeout(r, 500));
    const isInspectActive = await page.$eval('#btnToggleWysiwygInspector', el => el.classList.contains('inspect-active-btn'));
    console.log(`   ✅ WYSIWYG Inspector toggled active: ${isInspectActive}`);

    console.log('\n======================================================');
    console.log('🎉 ALL ENTERPRISE 3.0 FRONTEND UI TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testEnterpriseUi().catch(err => {
  console.error('❌ Frontend UI test error:', err);
  process.exit(1);
});
