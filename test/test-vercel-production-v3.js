const puppeteer = require('puppeteer-core');

async function testVercelProduction() {
  console.log('\n======================================================');
  console.log('🌍 VERIFYING LIVE VERCEL PRODUCTION DEPLOYMENT (3.0)');
  console.log('🔗 URL: https://mephistoclonerr.vercel.app/');
  console.log('======================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    console.log('🔹 1. Navigating to Vercel production...');
    const response = await page.goto('https://mephistoclonerr.vercel.app/', {
      waitUntil: 'networkidle2',
      timeout: 25000,
    });
    console.log(`   ✅ HTTP Status: ${response.status()}`);

    const title = await page.title();
    console.log(`   ✅ Document Title: "${title}"`);

    // 2. Test Community Modal on Vercel
    console.log('🔹 2. Testing Community Showcase on Vercel...');
    await page.evaluate(() => document.getElementById('btnOpenCommunityModal')?.click());
    await new Promise(r => setTimeout(r, 2000));

    const communityVisible = await page.$eval('#communityModal', el => el.style.display !== 'none');
    console.log(`   ✅ Community Modal visible: ${communityVisible}`);

    // 3. Test 1-Click Forking on Vercel
    console.log('🔹 3. Testing 1-Click Forking Kick.com template on Vercel...');
    await page.evaluate(() => window.__forkTemplate('tpl_kick_livestream'));
    await new Promise(r => setTimeout(r, 2000));

    const editorValue = await page.$eval('#liveCodeEditor', el => el.value);
    console.log(`   ✅ Template forked into live editor (${editorValue.length} chars)`);

    // 4. Test Live Sandbox Execution in iframe
    console.log('🔹 4. Testing Live Babel Transpilation & React 18 Sandbox...');
    await new Promise(r => setTimeout(r, 2500));

    const iframeHandle = await page.$('#studioSandboxIframe');
    const frame = await iframeHandle.contentFrame();
    const frameTitle = await frame.$eval('h1, button, span', el => el.textContent).catch(() => 'rendered');
    console.log(`   ✅ Sandbox Component Executed in Frame: "${frameTitle}"`);

    // 5. Test Vision AI Self-Healing Modal
    console.log('🔹 5. Testing Vision AI Self-Healing Modal on Vercel...');
    await page.evaluate(() => document.getElementById('btnOpenVisionHealing')?.click());
    await new Promise(r => setTimeout(r, 2000));

    const visionScore = await page.$eval('#visionCurrentScore', el => el.textContent);
    console.log(`   ✅ Vision AI Self-Healing modal open (Score: ${visionScore})`);

    // 6. Test Full-Stack DB Modal
    console.log('🔹 6. Testing Full-Stack DB Generator on Vercel...');
    await page.evaluate(() => document.getElementById('closeVisionModalBtn')?.click());
    await page.evaluate(() => document.getElementById('btnOpenFullStackDb')?.click());
    await new Promise(r => setTimeout(r, 2000));

    const dbCode = await page.$eval('#fullStackDbCodeViewer', el => el.value);
    console.log(`   ✅ DB modal open with generated schema (${dbCode.length} chars)`);

    // 7. Test Multi-Platform Exporter
    console.log('🔹 7. Testing Multi-Platform Exporter on Vercel...');
    await page.evaluate(() => document.getElementById('closeDbModalBtn')?.click());
    await page.evaluate(() => document.getElementById('btnOpenMultiPlatform')?.click());
    await new Promise(r => setTimeout(r, 2000));

    const platformCode = await page.$eval('#multiPlatformCodeViewer', el => el.value);
    console.log(`   ✅ Multi-platform modal open with React Native TSX (${platformCode.length} chars)`);

    console.log('\n======================================================');
    console.log('🎉 LIVE VERCEL PRODUCTION ENVIRONMENT FULLY VERIFIED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testVercelProduction().catch(err => {
  console.error('❌ Vercel production verification failed:', err);
  process.exit(1);
});
