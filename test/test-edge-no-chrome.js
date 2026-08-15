const assert = require('assert');
const { scrapeUrl, analyzeRawHtml } = require('../lib/scraper');
const { scrapeStealthUrl } = require('../lib/stealth-scraper');

async function testEdgeNoChrome() {
  console.log('\n======================================================');
  console.log('🧪 TESTING SERVERLESS / EDGE NO-CHROME FALLBACK');
  console.log('======================================================\n');

  // 1. Test scrapeUrl with non-existent chrome path (simulated serverless edge)
  console.log('🔹 1. Testing scrapeUrl fallback without Chrome binary...');
  const res1 = await scrapeUrl('https://example.com', { chromePath: null });
  assert(res1, 'Should return valid telemetry');
  assert(res1.meta, 'Should have meta object');
  assert(res1.meta.title.includes('Example'), 'Should extract title');
  assert(Array.isArray(res1.colors) || (res1.colors && res1.colors.topColors), 'Should extract colors');
  console.log(`   ✅ scrapeUrl fallback succeeded: Title="${res1.meta.title}"`);

  // 2. Test analyzeRawHtml without Chrome binary
  console.log('🔹 2. Testing analyzeRawHtml fallback without Chrome binary...');
  const rawHtml = '<!DOCTYPE html><html><head><title>Test App</title><style>.btn{color:#3b82f6;background:#0f172a;}</style></head><body><div class="card"><h1 class="text-4xl font-bold">Hello World</h1><button class="btn">Click me</button></div></body></html>';
  const res2 = await analyzeRawHtml(rawHtml, '', { chromePath: null });
  assert(res2, 'Should return valid telemetry');
  assert.strictEqual(res2.meta.title, 'Test App');
  assert(res2.components, 'Should detect components');
  console.log(`   ✅ analyzeRawHtml fallback succeeded: Title="${res2.meta.title}"`);

  // 3. Test scrapeStealthUrl without Chrome binary
  console.log('🔹 3. Testing scrapeStealthUrl fallback without Chrome binary...');
  const res3 = await scrapeStealthUrl('https://example.com', { chromePath: null });
  assert(res3, 'Should return valid telemetry');
  assert(res3.meta.title.includes('Example'));
  console.log(`   ✅ scrapeStealthUrl fallback succeeded: Title="${res3.meta.title}"`);

  console.log('\n======================================================');
  console.log('🎉 ALL SERVERLESS NO-CHROME FALLBACK TESTS PASSED!');
  console.log('======================================================\n');
}

testEdgeNoChrome().catch(err => {
  console.error('❌ Edge fallback test failed:', err);
  process.exit(1);
});
