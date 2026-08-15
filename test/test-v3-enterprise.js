const assert = require('assert');
const express = require('express');
const app = require('../server');

async function runEnterpriseIntegrationTests() {
  console.log('\n======================================================');
  console.log('🚀 TESTING ENTERPRISE 3.0 COMPLETE API INTEGRATION');
  console.log('======================================================\n');

  const http = require('http');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(3099, resolve));

  const fetchJson = async (path, options = {}) => {
    const res = await fetch(`http://localhost:3099${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    return { status: res.status, data: await res.json() };
  };

  try {
    // 1. Health check
    console.log('🔹 1. Testing GET /api/health');
    const health = await fetchJson('/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'ok');
    console.log('   ✅ Health check operational');

    // 2. Vision AI Self-Healing
    console.log('🔹 2. Testing POST /api/ai/visual-diff-healing');
    const visualDiff = await fetchJson('/api/ai/visual-diff-healing', {
      method: 'POST',
      body: JSON.stringify({
        originalTelemetry: {
          meta: { title: 'Kick.com Clone' },
          colors: { backgroundColors: ['#0b0e14', '#53fc18'] },
          typography: { h1: { fontSize: '48px', fontWeight: '800' } }
        },
        generatedCode: 'export default function App() { return <div className="bg-slate-900"><h1 className="text-xl">Title</h1></div>; }'
      })
    });
    assert.strictEqual(visualDiff.status, 200);
    assert.strictEqual(visualDiff.data.success, true);
    assert(visualDiff.data.similarityScore > 0);
    assert(visualDiff.data.healedCode.length > 10);
    console.log(`   ✅ Visual Diff & Self-Healing: Score ${visualDiff.data.similarityScore} -> Est ${visualDiff.data.estimatedHealedScore}`);

    // 3. Cloud Scraper Connector
    console.log('🔹 3. Testing POST /api/cloud-scrape/test');
    const cloudTest = await fetchJson('/api/cloud-scrape/test', {
      method: 'POST',
      body: JSON.stringify({ cloudConfig: { provider: 'browserless', apiKey: 'test_token_123' } })
    });
    assert.strictEqual(cloudTest.status, 200);
    assert.strictEqual(cloudTest.data.success, true);
    console.log('   ✅ Cloud Scraper connection test passed');

    // 4. Full-Stack Database Generator
    console.log('🔹 4. Testing POST /api/generate-fullstack-db');
    const fullstackDb = await fetchJson('/api/generate-fullstack-db', {
      method: 'POST',
      body: JSON.stringify({
        telemetry: {
          components: { forms: [{ type: 'form', inputs: ['username', 'email', 'amount'] }] },
          meta: { title: 'Payment Portal' }
        },
        networkLogs: [
          { url: '/api/users', method: 'GET', responseBody: { id: 1, name: 'Alice', email: 'alice@example.com' } }
        ],
        dbType: 'postgresql'
      })
    });
    assert.strictEqual(fullstackDb.status, 200);
    assert.strictEqual(fullstackDb.data.success, true);
    assert(fullstackDb.data.prisma.includes('model User'));
    assert(fullstackDb.data.drizzle.includes('pgTable'));
    assert(fullstackDb.data.supabase.includes('CREATE TABLE'));
    assert(fullstackDb.data.serverActions.includes("'use server'"));
    console.log('   ✅ Prisma, Drizzle, Supabase SQL & Next.js Server Actions generated');

    // 5. Multi-Platform Exporter
    console.log('🔹 5. Testing POST /api/export-multi-platform');
    const multiPlatform = await fetchJson('/api/export-multi-platform', {
      method: 'POST',
      body: JSON.stringify({
        code: 'export default function App() { return <div className="p-4 bg-slate-900"><h1 className="text-2xl text-white">Hello</h1></div>; }',
        telemetry: { colors: ['#0f172a', '#3b82f6'] },
        target: 'all'
      })
    });
    assert.strictEqual(multiPlatform.status, 200);
    assert.strictEqual(multiPlatform.data.success, true);
    assert(multiPlatform.data.reactNativeCode.includes('<View'));
    const parsedTokens = typeof multiPlatform.data.figmaTokens === 'string' ? JSON.parse(multiPlatform.data.figmaTokens) : multiPlatform.data.figmaTokens;
    assert(parsedTokens.global.color);
    assert(multiPlatform.data.flutterCode.includes('StatelessWidget'));
    console.log('   ✅ React Native, Figma Tokens & Flutter exported successfully');

    // 6. Community Showcase & Templates
    console.log('🔹 6. Testing Community Hub APIs');
    const templates = await fetchJson('/api/community/templates');
    assert.strictEqual(templates.status, 200);
    assert.strictEqual(templates.data.success, true);
    assert(templates.data.templates.length >= 6);

    const forkRes = await fetchJson('/api/community/fork/tpl_kick_livestream', {
      method: 'POST',
      body: JSON.stringify({ userId: 'usr_pro_001' })
    });
    assert.strictEqual(forkRes.status, 200);
    assert.strictEqual(forkRes.data.success, true);
    assert(forkRes.data.project.title.includes('Kick.com'));

    const stats = await fetchJson('/api/community/stats');
    assert.strictEqual(stats.status, 200);
    assert(stats.data.stats.totalTemplates >= 6);
    console.log(`   ✅ Community Hub verified (${templates.data.templates.length} templates, Forking & Stats functional)`);

    console.log('\n======================================================');
    console.log('🎉 ALL ENTERPRISE 3.0 INTEGRATION TESTS PASSED (6/6)!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runEnterpriseIntegrationTests().catch(err => {
  console.error('❌ Enterprise integration test failed:', err);
  process.exit(1);
});
