/**
 * SitePrompter Web - Comprehensive Verification Suite for V3 Engines
 * Tests:
 * 1. Stealth Scraper & Anti-Bot Evasions (Chrome binary, navigator overrides, headers, viewport)
 * 2. Network Interceptor (XHR, Fetch, JSON parsing, WebSocket structures)
 * 3. Mock API Generator (Express Router, Next.js App Router, Query params, Payload mocking)
 * 4. Multi-Page Crawler Engine (Concurrent crawling, Link discovery, Palette merging, Shared components aggregation)
 */

const assert = require('assert');
const http = require('http');
const {
  findChromeExecutable,
  launchStealthBrowser,
  applyStealthToPage,
  scrapeStealthUrl,
  analyzeStealthRawHtml,
  STEALTH_HEADERS,
  STEALTH_VIEWPORT,
  STEALTH_BROWSER_ARGS
} = require('../lib/stealth-scraper');
const {
  NetworkInterceptor,
  attachNetworkInterceptor,
  generateMockApiRoutes,
  isApiRequest,
  normalizeApiPath
} = require('../lib/network-interceptor');
const {
  crawlMultiPage,
  discoverInternalLinks,
  aggregateColors,
  aggregateMultiPageTelemetry,
  runWithConcurrency
} = require('../lib/multi-page-crawler');

// Helper to create a test HTTP server
function createTestServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS & JSON Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // ─── API ROUTES ───────────────────────────────────────────────
    if (pathname === '/api/v1/user') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 101, username: 'stealth_tester', role: 'admin', active: true }));
      return;
    }

    if (pathname === '/api/v1/projects' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const parsed = JSON.parse(body || '{}');
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: 501, title: parsed.title || 'Untitled Project', status: 'created' }));
      });
      return;
    }

    if (pathname === '/api/v1/pricing') {
      const tier = url.searchParams.get('tier') || 'starter';
      const currency = url.searchParams.get('currency') || 'usd';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tier,
        currency,
        monthlyPrice: tier === 'enterprise' ? 199 : 29,
        features: ['Unlimited Telemetry', 'AI Prompt Generation', 'Stealth Mode']
      }));
      return;
    }

    // ─── HTML WEBPAGES ────────────────────────────────────────────
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Nexus SaaS Platform</title>
          <meta name="description" content="Next generation AI agent builder">
          <style>
            :root { --brand: #4f46e5; --bg: #0f172a; --text: #f8fafc; }
            body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; margin: 0; }
            header { background: #1e293b; padding: 16px 24px; display: flex; justify-content: space-between; }
            nav a { color: #f8fafc; margin: 0 12px; text-decoration: none; }
            .hero { padding: 80px 24px; text-align: center; background: #0f172a; }
            .hero h1 { color: #4f46e5; font-size: 48px; }
            .btn { background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; border: none; }
            footer { background: #1e293b; padding: 24px; text-align: center; }
          </style>
        </head>
        <body>
          <header>
            <div class="logo">NexusAI</div>
            <nav role="navigation">
              <a href="/pricing">Pricing</a>
              <a href="/about">About</a>
              <a href="/features">Features</a>
              <a href="/login">Sign In</a>
            </nav>
          </header>
          <main>
            <section class="hero">
              <h1>Autonomous Agent Workspace</h1>
              <p>Build, test, and ship high-converting web experiences with AI.</p>
              <button class="btn" id="trigger-api">Load User Data</button>
            </section>
          </main>
          <footer>
            <p>&copy; 2026 Nexus AI Technologies Inc.</p>
          </footer>

          <script>
            // Automatically trigger XHR and Fetch API calls for interception testing
            fetch('/api/v1/user');
            fetch('/api/v1/pricing?tier=pro&currency=usd');
            fetch('/api/v1/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: 'Autonomous Workspace Project' })
            });
          </script>
        </body>
        </html>
      `);
      return;
    }

    if (pathname === '/pricing') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Pricing Plans - Nexus SaaS</title>
          <style>
            :root { --brand: #4f46e5; --accent: #10b981; }
            body { font-family: 'Inter', sans-serif; background: #0f172a; color: #fff; margin: 0; }
            header, footer { background: #1e293b; padding: 16px 24px; }
            .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 48px 24px; }
            .card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
            .highlight { border-color: #10b981; }
          </style>
        </head>
        <body>
          <header><div class="logo">NexusAI</div><nav><a href="/">Home</a><a href="/login">Login</a></nav></header>
          <main>
            <h1>Simple, Transparent Pricing</h1>
            <div class="pricing-grid">
              <div class="card"><h3>Starter</h3><p>$0/mo</p></div>
              <div class="card highlight"><h3>Pro</h3><p>$29/mo</p></div>
              <div class="card"><h3>Enterprise</h3><p>$199/mo</p></div>
            </div>
          </main>
          <footer><p>&copy; 2026 Nexus AI Technologies Inc.</p></footer>
        </body>
        </html>
      `);
      return;
    }

    if (pathname === '/about') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>About Us - Nexus</title><style>body { background: #0f172a; color: #fff; font-family: 'Inter'; }</style></head>
        <body>
          <header><nav><a href="/">Home</a></nav></header>
          <main><h1>About Nexus AI</h1><p>Empowering millions of builders.</p></main>
          <footer><p>&copy; 2026 Nexus AI</p></footer>
        </body>
        </html>
      `);
      return;
    }

    if (pathname === '/login') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Sign In - Nexus</title><style>body { background: #0f172a; color: #fff; font-family: 'Inter'; } .card { background: #1e293b; padding: 32px; border-radius: 8px; max-width: 400px; margin: 40px auto; }</style></head>
        <body>
          <header><nav><a href="/">Home</a></nav></header>
          <main>
            <div class="card">
              <h2>Welcome Back</h2>
              <form><input type="email" placeholder="Email" /><button type="submit">Sign In</button></form>
            </div>
          </main>
          <footer><p>&copy; 2026 Nexus AI</p></footer>
        </body>
        </html>
      `);
      return;
    }

    if (pathname === '/features') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Features - Nexus</title><style>body { background: #0f172a; color: #fff; font-family: 'Inter'; } .badge { color: #6366f1; }</style></head>
        <body>
          <header><nav><a href="/">Home</a></nav></header>
          <main><h1>Key Features</h1><div class="badge">AI Prompt Synthesis</div></main>
          <footer><p>&copy; 2026 Nexus AI</p></footer>
        </body>
        </html>
      `);
      return;
    }

    // 404 fallback
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return server;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 Starting SitePrompter V3 Production Scraping & Crawler Tests');
  console.log('================================================================\n');

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

  // Start local server for tests
  const server = createTestServer();
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Local Test Web Server running at: ${baseUrl}\n`);

  let sharedBrowser = null;

  try {
    // ─── 1. STEALTH SCRAPER TESTS ──────────────────────────────────
    console.log('--- Suite 1: Stealth Scraper & Evasions ---');

    test('Locate Local Chrome Executable', () => {
      const chromePath = findChromeExecutable();
      assert(chromePath, 'Chrome executable must be found');
      assert(typeof chromePath === 'string', 'Chrome path should be string');
      console.log(`     Using Chrome Binary: ${chromePath}`);
    });

    test('Validate Stealth Viewport & Cloudflare Headers Configuration', () => {
      assert.strictEqual(STEALTH_VIEWPORT.width, 1920);
      assert.strictEqual(STEALTH_VIEWPORT.height, 1080);
      assert.strictEqual(STEALTH_VIEWPORT.isMobile, false);
      assert.strictEqual(STEALTH_HEADERS['Sec-Ch-Ua-Platform'], '"Windows"');
      assert(STEALTH_HEADERS['Sec-Ch-Ua'].includes('Google Chrome'));
      assert(STEALTH_HEADERS['Accept-Language'].includes('en-US'));
      assert(STEALTH_BROWSER_ARGS.includes('--disable-blink-features=AutomationControlled'));
    });

    await testAsync('Launch Stealth Browser & Verify Anti-Detection Injections', async () => {
      sharedBrowser = await launchStealthBrowser();
      assert(sharedBrowser, 'Stealth browser should launch cleanly');

      const page = await sharedBrowser.newPage();
      await applyStealthToPage(page);

      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });

      const stealthChecks = await page.evaluate(() => {
        return {
          webdriver: navigator.webdriver,
          platform: navigator.platform,
          languages: navigator.languages,
          pluginsCount: navigator.plugins.length,
          hasChrome: !!window.chrome,
          hasChromeRuntime: !!(window.chrome && window.chrome.runtime),
          screenWidth: window.screen.width,
          screenHeight: window.screen.height
        };
      });

      await page.close();

      assert.strictEqual(stealthChecks.webdriver, undefined, 'navigator.webdriver must be undefined');
      assert.strictEqual(stealthChecks.platform, 'Win32', 'navigator.platform must be Win32');
      assert(stealthChecks.languages.includes('en-US'), 'navigator.languages must include en-US');
      assert(stealthChecks.pluginsCount > 0, 'navigator.plugins must emulate PDF and native plugins');
      assert.strictEqual(stealthChecks.hasChrome, true, 'window.chrome must exist');
      assert.strictEqual(stealthChecks.hasChromeRuntime, true, 'window.chrome.runtime must exist');
      assert.strictEqual(stealthChecks.screenWidth, 1920, 'window.screen.width must be 1920');
      assert.strictEqual(stealthChecks.screenHeight, 1080, 'window.screen.height must be 1080');
    });

    await testAsync('Stealth Raw HTML Analysis', async () => {
      const sampleHtml = `
        <html>
        <head><title>Stealth Telemetry Test</title></head>
        <body style="background: #111827; color: #38bdf8;">
          <h1>Stealth Engine</h1>
          <button class="btn" style="background: #38bdf8; color: #000; border-radius: 6px;">Deploy</button>
        </body>
        </html>
      `;
      const telemetry = await analyzeStealthRawHtml(sampleHtml, '', { browser: sharedBrowser });
      assert.strictEqual(telemetry.meta.title, 'Stealth Telemetry Test');
      assert(telemetry.colors.length > 0, 'Should extract colors');
      assert(telemetry.components.length > 0, 'Should extract button component');
    });

    // ─── 2. NETWORK INTERCEPTOR TESTS ─────────────────────────────
    console.log('\n--- Suite 2: Network Interceptor & Traffic Recording ---');

    test('Helper functions: isApiRequest & normalizeApiPath', () => {
      assert.strictEqual(isApiRequest('https://api.example.com/v1/users', 'fetch', 'application/json'), true);
      assert.strictEqual(isApiRequest('/api/auth/session', 'xhr', 'text/plain'), true);
      assert.strictEqual(isApiRequest('https://example.com/logo.png', 'image', 'image/png'), false);

      const normalized = normalizeApiPath('https://example.com/api/v1/items?limit=25&category=saas');
      assert.strictEqual(normalized.pathname, '/api/v1/items');
      assert.strictEqual(normalized.queryParams.limit, '25');
      assert.strictEqual(normalized.queryParams.category, 'saas');
    });

    await testAsync('Intercept Live XHR & Fetch Calls During Page Load', async () => {
      const page = await sharedBrowser.newPage();
      await applyStealthToPage(page);

      const interceptor = await attachNetworkInterceptor(page);
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });

      // Allow brief moment for JS async fetches
      await new Promise(r => setTimeout(r, 600));

      const logs = interceptor.getLogs();
      const apiLogs = interceptor.getApiLogs();

      await interceptor.detach();
      await page.close();

      assert(logs.length > 0, 'Network interceptor must record network requests');
      assert(apiLogs.length >= 3, `Expected at least 3 API logs, captured ${apiLogs.length}`);

      // Check GET /api/v1/user
      const userLog = apiLogs.find(l => l.pathname === '/api/v1/user');
      assert(userLog, 'Should intercept /api/v1/user');
      assert.strictEqual(userLog.method, 'GET');
      assert.strictEqual(userLog.status, 200);
      assert.strictEqual(userLog.isJson, true);
      assert.strictEqual(userLog.responseBody.username, 'stealth_tester');
      assert.strictEqual(userLog.responseBody.role, 'admin');

      // Check POST /api/v1/projects
      const projectLog = apiLogs.find(l => l.pathname === '/api/v1/projects');
      assert(projectLog, 'Should intercept /api/v1/projects');
      assert.strictEqual(projectLog.method, 'POST');
      assert.strictEqual(projectLog.status, 201);
      assert.strictEqual(projectLog.requestBody.title, 'Autonomous Workspace Project');
      assert.strictEqual(projectLog.responseBody.id, 501);

      // Check GET /api/v1/pricing with query params
      const pricingLog = apiLogs.find(l => l.pathname === '/api/v1/pricing');
      assert(pricingLog, 'Should intercept /api/v1/pricing');
      assert.strictEqual(pricingLog.queryParams.tier, 'pro');
      assert.strictEqual(pricingLog.queryParams.currency, 'usd');
      assert.strictEqual(pricingLog.responseBody.tier, 'pro');
      assert.strictEqual(pricingLog.responseBody.monthlyPrice, 29);
    });

    // ─── 3. MOCK API GENERATOR TESTS ──────────────────────────────
    console.log('\n--- Suite 3: Mock API Generator ---');

    test('Generate Express.js Mock API Router', () => {
      const mockLogs = [
        {
          url: 'https://api.mybrand.com/api/v1/auth/session',
          pathname: '/api/v1/auth/session',
          method: 'GET',
          status: 200,
          isApi: true,
          isJson: true,
          queryParams: {},
          responseBody: { user: { id: 'usr_1', email: 'alex@company.com' }, authenticated: true }
        },
        {
          url: 'https://api.mybrand.com/api/v1/analytics/events',
          pathname: '/api/v1/analytics/events',
          method: 'POST',
          status: 200,
          isApi: true,
          isJson: true,
          queryParams: {},
          requestBody: { event: 'page_view', page: '/pricing' },
          responseBody: { success: true, recorded: 1 }
        },
        {
          url: 'https://api.mybrand.com/api/v1/products',
          pathname: '/api/v1/products',
          method: 'GET',
          status: 200,
          isApi: true,
          isJson: true,
          queryParams: { category: 'software', limit: '10' },
          responseBody: [{ id: 1, title: 'AI Assistant', price: 49 }]
        }
      ];

      const expressResult = generateMockApiRoutes(mockLogs, { framework: 'express' });
      assert.strictEqual(expressResult.totalEndpoints, 3);
      assert(expressResult.expressCode.includes("router.get('/api/v1/auth/session'"), 'Should include auth session route');
      assert(expressResult.expressCode.includes("router.post('/api/v1/analytics/events'"), 'Should include analytics POST route');
      assert(expressResult.expressCode.includes("router.get('/api/v1/products'"), 'Should include products GET route');
      assert(expressResult.expressCode.includes('category, limit'), 'Should extract query parameters');
      assert(expressResult.expressCode.includes('alex@company.com'), 'Should include mock response body');
    });

    test('Generate Next.js 14+ App Router & Pages Router Mock Endpoints', () => {
      const mockLogs = [
        {
          url: 'http://localhost:3000/api/dashboard/stats',
          pathname: '/api/dashboard/stats',
          method: 'GET',
          status: 200,
          isApi: true,
          isJson: true,
          queryParams: {},
          responseBody: { activeUsers: 1420, revenue: '$48,200' }
        }
      ];

      const nextResult = generateMockApiRoutes(mockLogs, { framework: 'nextjs' });
      assert(nextResult.nextjsAppRouterCode.includes('export async function GET(request)'), 'Should have App Router GET function');
      assert(nextResult.nextjsAppRouterCode.includes('Response.json('), 'Should return Response.json()');
      assert(nextResult.nextjsAppRouterCode.includes('activeUsers'), 'Should include activeUsers in mock data');

      assert(nextResult.nextjsPagesRouterCode.includes('export default function handler(req, res)'), 'Should have Pages router handler');
      assert(nextResult.nextjsPagesRouterCode.includes('res.status(200).json('), 'Should call res.status(200).json');
    });

    test('Handle Empty or Malformed Network Logs Gracefully', () => {
      const emptyResult = generateMockApiRoutes([], { framework: 'express' });
      assert.strictEqual(emptyResult.totalEndpoints, 0);
      assert(emptyResult.expressCode.includes('/api/status'), 'Should provide fallback status route');

      const nullResult = generateMockApiRoutes(null, { framework: 'nextjs' });
      assert.strictEqual(nullResult.totalEndpoints, 0);
    });

    // ─── 4. MULTI-PAGE CRAWLER TESTS ──────────────────────────────
    console.log('\n--- Suite 4: Multi-Page Crawler Engine ---');

    test('Internal Link Discovery from DOM / Telemetry', () => {
      const mockTelemetry = {
        domStructure: `
          <nav>
            <a href="/pricing">Pricing</a>
            <a href="/about">About Us</a>
            <a href="/features">Features</a>
            <a href="https://twitter.com/myaccount">Twitter (External)</a>
            <a href="#section-faq">FAQ Anchor</a>
            <a href="/assets/doc.pdf">PDF Asset</a>
            <a href="/login">Sign In</a>
          </nav>
        `
      };

      const links = discoverInternalLinks(mockTelemetry, baseUrl, 8);
      assert(links.includes('/pricing'), 'Should discover /pricing');
      assert(links.includes('/about'), 'Should discover /about');
      assert(links.includes('/features'), 'Should discover /features');
      assert(links.includes('/login'), 'Should discover /login');
      assert(!links.includes('#section-faq'), 'Should filter out hash anchors');
      assert(!links.some(l => l.includes('twitter.com')), 'Should filter out external domains');
      assert(!links.some(l => l.includes('.pdf')), 'Should filter out static PDF files');
    });

    test('Color Palette Merging and Frequency Aggregation', () => {
      const pages = [
        { colors: [{ color: '#4F46E5', frequency: 10 }, { color: '#0F172A', frequency: 5 }] },
        { colors: [{ color: '#4F46E5', frequency: 15 }, { color: '#10B981', frequency: 8 }] },
        { colors: [{ color: '#4F46E5', frequency: 5 }, { color: '#6366F1', frequency: 3 }] }
      ];

      const merged = aggregateColors(pages);
      assert.strictEqual(merged[0].color, '#4F46E5');
      assert.strictEqual(merged[0].frequency, 30);
      assert.strictEqual(merged[0].pagesCount, 3);
      assert(merged.some(c => c.color === '#10B981'));
      assert(merged.some(c => c.color === '#6366F1'));
    });

    test('Concurrency Runner respects concurrency bounds', async () => {
      let maxActive = 0;
      let currentActive = 0;

      const tasks = Array.from({ length: 8 }, (_, i) => async () => {
        currentActive++;
        maxActive = Math.max(maxActive, currentActive);
        await new Promise(r => setTimeout(r, 40));
        currentActive--;
        return `result_${i}`;
      });

      const results = await runWithConcurrency(tasks, 4);
      assert.strictEqual(results.length, 8);
      assert(maxActive <= 4, `Max active concurrency was ${maxActive}, expected <= 4`);
    });

    await testAsync('Crawl Multi-Page Site Concurrently with Full Aggregation', async () => {
      const result = await crawlMultiPage(baseUrl, {
        browser: sharedBrowser,
        links: ['/pricing', '/about', '/login', '/features'],
        maxConcurrency: 4,
        interceptNetwork: true
      });

      // 1. Verify structure
      assert(result.root, 'Result must contain root page telemetry');
      assert.strictEqual(result.root.meta.title, 'Nexus SaaS Platform');
      assert(result.pages, 'Result must contain pages map');
      assert(result.pages['/pricing'], 'Must contain /pricing telemetry');
      assert(result.pages['/about'], 'Must contain /about telemetry');
      assert(result.pages['/login'], 'Must contain /login telemetry');
      assert(result.pages['/features'], 'Must contain /features telemetry');

      // 2. Verify Site Map
      assert.strictEqual(result.siteMap.length, 5, 'Site map must have 5 entries (root + 4 subpages)');
      assert(result.siteMap.some(s => s.path === '/pricing'));

      // 3. Verify Global Tokens
      assert(result.globalTokens.colors.length > 0, 'Global colors should be aggregated');
      assert(result.globalTokens.fonts.families.includes('Inter'), 'Global fonts should include Inter');

      // 4. Verify Shared Components
      assert(result.globalTokens.sharedComponents.length > 0, 'Should detect shared components (Navbar/Footer)');
      const hasNavOrFooter = result.globalTokens.sharedComponents.some(c =>
        /navbar|navigation|header|footer/i.test(c.name)
      );
      assert(hasNavOrFooter, 'Shared components should include Navigation / Header / Footer');

      // 5. Verify Intercepted APIs & Mock Routes
      assert(result.networkApiEndpoints.length >= 3, 'Must capture intercepted API endpoints across crawl');

      // 6. Verify Crawl Stats
      assert.strictEqual(result.crawlStats.totalPages, 5);
      assert.strictEqual(result.crawlStats.successful, 5);
      assert.strictEqual(result.crawlStats.failed, 0);
      assert(result.crawlStats.durationMs > 0);

      console.log(`     Crawl completed successfully in ${result.crawlStats.durationMs}ms`);
      console.log(`     Aggregated ${result.siteMap.length} pages, ${result.globalTokens.colors.length} colors, ${result.networkApiEndpoints.length} API endpoints`);
    });

  } finally {
    if (sharedBrowser) {
      await sharedBrowser.close();
    }
    await new Promise(resolve => server.close(resolve));
  }

  console.log(`\n================================================================`);
  console.log(`🏁 V3 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
