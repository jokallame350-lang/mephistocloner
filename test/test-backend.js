/**
 * Automated Verification Suite for SitePrompter Web Backend & Scraping Engine
 */

const assert = require('assert');
const { parseCssTokens } = require('../lib/css-resolver');
const { compilePrompt, FRAMEWORK_SPECS, estimateTokens } = require('../lib/compiler');
const { analyzeRawHtml, findChromeExecutable } = require('../lib/scraper');

async function runTests() {
  console.log('🚀 Starting SitePrompter Web Backend Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Test Chrome Executable Finder
  test('Find Chrome Executable', () => {
    const chromePath = findChromeExecutable();
    assert(chromePath, 'Chrome path should be found');
    console.log(`     Chrome binary located at: ${chromePath}`);
  });

  // 2. Test CSS Resolver Token Extraction
  test('CSS Resolver Token Parsing', () => {
    const sampleCSS = `
      :root {
        --primary: #3b82f6;
        --radius: 12px;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @media (max-width: 768px) {
        .btn { width: 100%; }
      }
      @font-face {
        font-family: 'Inter';
        src: url('inter.woff2');
      }
    `;

    const tokens = parseCssTokens(sampleCSS);
    assert.strictEqual(tokens.cssVars['--primary'], '#3b82f6');
    assert.strictEqual(tokens.cssVars['--radius'], '12px');
    assert(tokens.keyframes.length > 0, 'Should extract keyframes');
    assert(tokens.mediaQueries.length > 0, 'Should extract media queries');
    assert(tokens.fontFaces.length > 0, 'Should extract font-face');
  });

  // 3. Test Prompt Compiler Frameworks & Detail Levels
  test('Prompt Compiler Matrix', () => {
    const mockTelemetry = {
      meta: {
        title: 'Modern SaaS Platform',
        canonical: 'https://example.com',
        description: 'Next-gen analytics platform',
        lang: 'en'
      },
      framework: 'React, Tailwind CSS',
      cssVariables: { '--primary': '#4f46e5', '--background': '#0f172a' },
      colors: [
        { color: '#4F46E5', frequency: 28 },
        { color: '#0F172A', frequency: 15 }
      ],
      fonts: {
        families: ['Inter', 'system-ui'],
        sizes: ['32px', '16px'],
        weights: [400, 700],
        links: ['https://fonts.googleapis.com/css2?family=Inter']
      },
      typography: {
        h1: { fontFamily: 'Inter', fontSize: '36px', fontWeight: '700', lineHeight: '44px', color: '#FFFFFF' }
      },
      borderRadius: ['8px', '12px'],
      shadows: ['0 4px 6px -1px rgba(0, 0, 0, 0.1)'],
      images: {
        imgs: [{ src: 'https://example.com/logo.png', alt: 'Logo', width: 140, height: 40, role: 'logo' }],
        bgImages: [],
        svgCount: 4,
        svgSamples: ['<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>'],
        iconLinks: ['https://example.com/favicon.ico']
      },
      layout: {
        sections: ['header: 1', 'main: 1', 'footer: 1'],
        viewportWidth: 1440,
        viewportHeight: 900,
        totalHeight: 2400,
        grids: [{ el: '.feature-grid', cols: 'repeat(3, 1fr)', gap: '24px' }],
        flexboxes: [{ el: 'nav.navbar', direction: 'row', justify: 'space-between', align: 'center' }]
      },
      components: [
        { name: 'Navigation / Navbar', count: 1, summary: 'Navigation / Navbar: 1x' },
        { name: 'Hero / Banner Section', count: 1, summary: 'Hero / Banner Section: 1x' },
        { name: 'Card Grid / Features', count: 6, summary: 'Card Grid / Features: 6x' }
      ],
      interactions: ['Dropdown / Flyout menus', 'Modal / Lightbox dialog with backdrop'],
      responsive: ['(max-width: 768px)', '(max-width: 1024px)'],
      accessibilityHints: ['Image alt attribute coverage: 100%'],
      domStructure: '<header><nav class="navbar"></nav></header><main></main>'
    };

    const frameworks = ['html-tailwind', 'react-tailwind', 'vanilla', 'nextjs', 'vue', 'svelte'];
    const detailLevels = ['minimal', 'standard', 'comprehensive', 'ultra'];

    frameworks.forEach(fw => {
      const res = compilePrompt(mockTelemetry, fw, 'comprehensive');
      assert(res.prompt.includes('SITE CLONE TELEMETRY SPECIFICATION'), `Prompt should contain header for ${fw}`);
      assert(res.prompt.includes(FRAMEWORK_SPECS[fw].name), `Prompt should mention framework name ${fw}`);
      assert(res.tokenEstimate > 100, `Token estimate should be calculated for ${fw}`);
    });

    detailLevels.forEach(dl => {
      const res = compilePrompt(mockTelemetry, 'html-tailwind', dl);
      assert(res.prompt.length > 200, `Prompt should be generated for detail level ${dl}`);
    });
  });

  // 4. Test Headless Chrome In-Browser Raw HTML Telemetry Extraction
  await testAsync('Headless Chrome Raw HTML In-Browser Telemetry Extraction', async () => {
    const rawHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Demo SaaS Landing</title>
        <meta name="description" content="A cutting edge developer tool">
        <style>
          :root {
            --brand-color: #6366f1;
            --surface: #1e293b;
          }
          body { font-family: 'Segoe UI', sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; }
          .navbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; }
          .hero { padding: 80px 24px; text-align: center; }
          .hero h1 { font-size: 48px; color: #6366f1; }
          .btn-primary { background-color: #6366f1; color: #ffffff; border-radius: 8px; padding: 12px 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
          .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 24px; }
          .card { background: #1e293b; border-radius: 12px; padding: 20px; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
          @media (max-width: 768px) {
            .card-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <header>
          <nav class="navbar" role="navigation">
            <div class="logo">SaaSify</div>
            <button class="btn-primary" aria-label="Sign In">Sign In</button>
          </nav>
        </header>
        <main>
          <section class="hero">
            <h1>Supercharge Your Workflow</h1>
            <p>Build high-converting landing pages in minutes.</p>
            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71" alt="App Dashboard" width="600" height="350">
          </section>
          <section class="card-grid">
            <div class="card"><h3>Feature 1</h3><p>Lightning fast</p></div>
            <div class="card"><h3>Feature 2</h3><p>Enterprise secure</p></div>
            <div class="card"><h3>Feature 3</h3><p>AI Powered</p></div>
          </section>
        </main>
        <footer>
          <p>&copy; 2026 SaaSify Inc.</p>
        </footer>
      </body>
      </html>
    `;

    const telemetry = await analyzeRawHtml(rawHtml);

    assert(telemetry, 'Telemetry object should be returned');
    assert.strictEqual(telemetry.meta.title, 'Demo SaaS Landing');
    assert(telemetry.colors.length > 0, 'Should extract colors');
    assert(telemetry.layout.sections.length > 0, 'Should extract semantic sections');
    assert(telemetry.components.length > 0, 'Should detect components (navbar, hero, cards, buttons)');
    assert(telemetry.domStructure.includes('<nav'), 'DOM structure should contain nav');

    const compiled = compilePrompt(telemetry, 'react-tailwind', 'comprehensive');
    assert(compiled.prompt.includes('Demo SaaS Landing'), 'Prompt should include site title');
    assert(compiled.tokenEstimate > 300, 'Token estimate should be > 300');

    console.log(`     Extracted ${telemetry.colors.length} colors, ${telemetry.components.length} components, ${compiled.tokenEstimate} tokens estimated`);
  });

  // 5. Test Express Server HTTP API Endpoints
  await testAsync('Express Server HTTP API Endpoints', async () => {
    const app = require('../server');
    const http = require('http');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 5a. GET /api/health
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthJson = await healthRes.json();
      assert.strictEqual(healthRes.status, 200);
      assert.strictEqual(healthJson.status, 'ok');
      assert.strictEqual(healthJson.chromeAvailable, true);

      // 5b. POST /api/analyze-raw
      const rawRes = await fetch(`${baseUrl}/api/analyze-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: '<html><head><title>API Test</title></head><body><button class="btn">Click me</button></body></html>',
          framework: 'html-tailwind',
          detailLevel: 'standard'
        })
      });
      const rawJson = await rawRes.json();
      assert.strictEqual(rawRes.status, 200);
      assert.strictEqual(rawJson.success, true);
      assert.strictEqual(rawJson.telemetry.meta.title, 'API Test');
      assert(rawJson.prompt && rawJson.prompt.length > 100, 'Prompt should be generated');
      assert(rawJson.tokenEstimate > 0, 'Token estimate should be > 0');

      // 5c. POST /api/compile-prompt
      const compileRes = await fetch(`${baseUrl}/api/compile-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry: rawJson.telemetry,
          framework: 'vue',
          detailLevel: 'comprehensive'
        })
      });
      const compileJson = await compileRes.json();
      assert.strictEqual(compileRes.status, 200);
      assert.strictEqual(compileJson.success, true);
      assert(compileJson.framework.includes('vue') || compileJson.framework.includes('Vue'), 'Framework should match vue');
      assert(compileJson.prompt.length > 100, 'Compiled prompt should have content');
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  console.log(`\n🏁 Test Run Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
