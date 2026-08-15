const assert = require('assert');
const app = require('../server');
const http = require('http');

async function testProductionEndpoints() {
  console.log('\n🚀 Starting Production API Endpoint Tests...\n');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health Endpoint
  await test('GET /api/health', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert(data.version.includes('2.0.0'));
  });

  // 2. Auth Endpoints
  await test('POST /api/auth/login & GET /api/auth/me', async () => {
    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'developer@example.com' })
    });
    const dataLogin = await resLogin.json();
    assert.strictEqual(dataLogin.success, true);
    assert(dataLogin.user);

    const resMe = await fetch(`${baseUrl}/api/auth/me`);
    const dataMe = await resMe.json();
    assert.strictEqual(dataMe.success, true);
    assert.strictEqual(dataMe.user.email, 'developer@example.com');
  });

  // 3. Workspaces Endpoints
  await test('GET & POST /api/workspaces', async () => {
    const resList = await fetch(`${baseUrl}/api/workspaces`);
    const dataList = await resList.json();
    assert.strictEqual(dataList.success, true);
    assert(Array.isArray(dataList.workspaces));

    const resCreate = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Studio Workspace' })
    });
    const dataCreate = await resCreate.json();
    assert.strictEqual(dataCreate.success, true);
    assert.strictEqual(dataCreate.workspace.name, 'Test Studio Workspace');
  });

  // 4. Projects Endpoints
  await test('GET, POST & FAVORITE /api/projects', async () => {
    const resSave = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Vite React Dashboard',
        url: 'https://vitejs.dev',
        framework: 'react-tailwind'
      })
    });
    const dataSave = await resSave.json();
    assert.strictEqual(dataSave.success, true);
    const projId = dataSave.project.id;

    const resFav = await fetch(`${baseUrl}/api/projects/${projId}/favorite`, {
      method: 'POST'
    });
    const dataFav = await resFav.json();
    assert.strictEqual(dataFav.success, true);
    assert.strictEqual(dataFav.project.favorite, true);
  });

  // 5. Multi-Page Crawler
  await test('POST /api/crawl-multi-page', async () => {
    const res = await fetch(`${baseUrl}/api/crawl-multi-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://linear.app', maxPages: 2 })
    });
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(data.pages && (Array.isArray(data.pages) || typeof data.pages === 'object'));
  });

  // 6. 1-Click Deployments (GitHub & Vercel)
  await test('POST /api/deploy/github & /api/deploy/vercel', async () => {
    const resGh = await fetch(`${baseUrl}/api/deploy/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName: 'my-clone-test' })
    });
    const dataGh = await resGh.json();
    assert.strictEqual(dataGh.success, true);
    assert(dataGh.repoUrl.includes('github.com'));

    const resVercel = await fetch(`${baseUrl}/api/deploy/vercel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: 'my-clone-test' })
    });
    const dataVercel = await resVercel.json();
    assert.strictEqual(dataVercel.success, true);
    assert(dataVercel.deploymentUrl.includes('vercel.app'));
  });

  // 7. Billing & Credits
  await test('GET & POST /api/billing/*', async () => {
    const resPlans = await fetch(`${baseUrl}/api/billing/plans`);
    const dataPlans = await resPlans.json();
    assert.strictEqual(dataPlans.success, true);
    assert(dataPlans.plans.length >= 3);

    const resCredits = await fetch(`${baseUrl}/api/billing/credits`);
    const dataCredits = await resCredits.json();
    assert.strictEqual(dataCredits.success, true);
    assert(typeof dataCredits.credits === 'number');

    const resCheckout = await fetch(`${baseUrl}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'pro' })
    });
    const dataCheckout = await resCheckout.json();
    assert.strictEqual(dataCheckout.success, true);
  });

  // 8. BYOK Key Management
  await test('GET & POST /api/user/keys', async () => {
    const resSave = await fetch(`${baseUrl}/api/user/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: { anthropic: 'sk-ant-api03-1234567890abcdef' } })
    });
    const dataSave = await resSave.json();
    assert.strictEqual(dataSave.success, true);

    const resGet = await fetch(`${baseUrl}/api/user/keys`);
    const dataGet = await resGet.json();
    assert.strictEqual(dataGet.success, true);
    assert(dataGet.keys.anthropic.includes('sk-a...cdef'));
  });

  // 9. AI Stream Generate (SSE)
  await test('POST /api/ai/stream-generate (SSE)', async () => {
    const res = await fetch(`${baseUrl}/api/ai/stream-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet',
        framework: 'react-tailwind',
        mockDelayMs: 2,
        telemetry: { meta: { title: 'Test App' } }
      })
    });
    assert.strictEqual(res.status, 200);
    assert(res.headers.get('content-type').includes('text/event-stream'));
    
    // Read the stream
    const text = await res.text();
    assert(text.includes('data:'));
    assert(text.includes('"type":"token"') || text.includes('"type":"status"') || text.includes('"type":"done"'));
  });

  server.close();
  console.log(`\n🏁 Production API Test Summary: ${passed} passed, ${failed} failed.\n`);
}

testProductionEndpoints().catch(console.error);
