/**
 * Automated Headless Browser UI & Integration Verification Suite
 * Verifies all Frontend UI components, modals, and integrations in public/
 */

const puppeteer = require('puppeteer-core');
const assert = require('assert');
const http = require('http');
const app = require('../server');
const { findChromeExecutable } = require('../lib/scraper');

async function testFrontendUI() {
  console.log('\n======================================================');
  console.log('🧪 Starting SitePrompter Production Frontend Studio Test');
  console.log('======================================================\n');

  // Start local express server on dynamic port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const chromePath = findChromeExecutable();
  assert(chromePath, 'Google Chrome executable must be found');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  let passed = 0;
  let failed = 0;

  function recordTest(name, isPass, detail = '') {
    if (isPass) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}: ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Load Page
    console.log(`[UI Test] Navigating to ${baseUrl}...`);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // 2. Check Console Errors
    recordTest('Frontend Loads Cleanly (Zero Console Errors)', consoleErrors.length === 0, consoleErrors.join('; '));

    // 3. Verify Header Elements
    const headerTitle = await page.$eval('.brand-name', el => el.textContent.trim());
    recordTest('Header Brand Title', headerTitle === 'SitePrompter');

    const creditsDisplay = await page.$eval('#userCreditsDisplay', el => el.textContent.trim());
    recordTest('Header User Credits Display', parseInt(creditsDisplay) >= 0);

    const userName = await page.$eval('#userNameDisplay', el => el.textContent.trim());
    recordTest('User Profile Badge', userName.length > 0);

    // 4. Test Workspace Switcher
    await page.click('#workspaceDropdownBtn');
    await new Promise(r => setTimeout(r, 200));
    const wsDropdownVisible = await page.$eval('#workspaceDropdown', el => el.style.display !== 'none');
    recordTest('Workspace Dropdown Opens', wsDropdownVisible);
    await page.click('#workspaceDropdownBtn'); // Close

    // 5. Test BYOK Modal
    await page.click('#btnOpenByokModal');
    await new Promise(r => setTimeout(r, 200));
    const byokVisible = await page.$eval('#byokModal', el => el.style.display !== 'none');
    recordTest('BYOK Modal Opens', byokVisible);

    await page.click('#btnTestByokConnection');
    await new Promise(r => setTimeout(r, 900));
    const byokStatusText = await page.$eval('#byokTestStatus', el => el.textContent);
    recordTest('BYOK Test Connection Ping', byokStatusText.includes('verified'));
    await page.click('#closeByokModalBtn');

    // 6. Test Pricing & Upgrade Modal
    await page.click('#btnOpenPricingModal');
    await new Promise(r => setTimeout(r, 200));
    const pricingVisible = await page.$eval('#pricingModal', el => el.style.display !== 'none');
    recordTest('Pricing & Upgrade Modal Opens', pricingVisible);

    await page.click('#btnBillingYearly');
    const yearlyProPrice = await page.$eval('#proPriceDisplay', el => el.textContent);
    recordTest('Yearly Discount Switcher', yearlyProPrice.includes('$15'));

    await page.click('#btnUpgradePro');
    await new Promise(r => setTimeout(r, 400));
    const updatedPlanBadge = await page.$eval('#userPlanBadge', el => el.textContent);
    recordTest('1-Click Upgrade Execution & Modal Auto-close', updatedPlanBadge.includes('Pro'));

    // 7. Test 1-Click Deploy Modal
    await page.click('#btnHeaderDeploy');
    await new Promise(r => setTimeout(r, 200));
    const deployVisible = await page.$eval('#deployModal', el => el.style.display !== 'none');
    recordTest('1-Click Deploy Modal Opens', deployVisible);

    await page.click('#tabDeployGithub');
    const githubPanelVisible = await page.$eval('#panelDeployGithub', el => el.style.display !== 'none');
    recordTest('Deploy Modal GitHub Tab Switcher', githubPanelVisible);

    const btnInfo = await page.evaluate(() => {
      const btn = document.getElementById('btnExecuteDeploy');
      const vercelTab = document.getElementById('tabDeployVercel')?.className;
      const ghTab = document.getElementById('tabDeployGithub')?.className;
      return { hasBtn: !!btn, vercelTab, ghTab };
    });
    console.log('    [Debug Deploy Modal]', btnInfo);

    await page.evaluate(() => {
      document.getElementById('btnExecuteDeploy')?.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const ghStatus = await page.$eval('#githubDeployStatus', el => el.style.display);
    const ghUrlBox = await page.$eval('#githubUrlBox', el => el.style.display);
    recordTest('Execute Deploy Action Simulation', ghStatus !== 'none' || ghUrlBox !== 'none', `ghStatus: ${ghStatus}, ghUrlBox: ${ghUrlBox}`);
    await page.click('#closeDeployModalBtn');

    // 8. Test Project Library / History Modal
    await page.click('#historyModalBtn');
    await new Promise(r => setTimeout(r, 200));
    const historyVisible = await page.$eval('#historyModal', el => el.style.display !== 'none');
    recordTest('Project Library Modal Opens', historyVisible);
    const projectCardsCount = await page.$$eval('.project-card', cards => cards.length);
    recordTest('Project Library Cards Loaded', projectCardsCount >= 1);
    await page.click('#closeHistoryModalBtn');

    // 9. Test Split View Studio & Code Editor
    const editorValue = await page.$eval('#liveCodeEditor', el => el.value);
    recordTest('Live Code Editor Populated with Project Code', editorValue.length > 50);

    const gutterText = await page.$eval('#liveEditorGutter', el => el.textContent);
    recordTest('Live Code Editor Line Numbers Gutter Active', gutterText.includes('1'));

    // 10. Test Multi-Page Navigator
    const routeTabs = await page.$$eval('.page-route-tab', tabs => tabs.length);
    recordTest('Multi-Page Navigator Tabs Rendered', routeTabs >= 4);

    // 11. Test Quick Refinement Chip Click
    await page.click('.refine-chip');
    await new Promise(r => setTimeout(r, 500));
    const streamingBarVisible = await page.$eval('#streamingVisualizerBar', el => el.style.display !== 'none');
    recordTest('AI Streaming Visualizer Bar Active during Refinement', streamingBarVisible);

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`📊 Frontend Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);
  process.exit(failed === 0 ? 0 : 1);
}

testFrontendUI().catch(err => {
  console.error(err);
  process.exit(1);
});
