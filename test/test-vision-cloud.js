/**
 * Unit Test Suite for Vision AI Self-Healing Engine & Cloud Scraper Connector
 */

const assert = require('assert');

// 1. Vision Self-Healing Engine Modules
const {
  SUPPORTED_VISION_MODELS,
  VISION_HEALING_SYSTEM_PROMPT,
  normalizeVisionProvider,
  compileVisionPrompt,
  analyzeVisualDifferences,
  calculateVisualSimilarityScore,
  applySelfHealingPatches,
  streamVisualHealingAsync,
  streamVisualHealing,
} = require('../lib/vision-self-healing');

// 2. Cloud Scraper Connector Modules
const {
  CLOUD_PROVIDERS,
  normalizeCloudProvider,
  buildCloudBrowserUrl,
  maskCloudCredentials,
  analyzeOfflineFallback,
  testCloudConnection,
  getCloudScraperInfo,
} = require('../lib/cloud-scraper-connector');

// Sample Test Telemetry
const sampleTelemetry = {
  meta: {
    title: 'Acme Cloud SaaS Platform',
    canonical: 'https://acme-cloud.io',
    description: 'Autonomous cloud infrastructure for high-scale microservices.',
  },
  colors: [
    { color: '#3b82f6', frequency: 45, role: 'Primary Brand Blue' },
    { color: '#8b5cf6', frequency: 22, role: 'Secondary Accent Purple' },
    { color: '#0b0f19', frequency: 120, role: 'Dark Canvas Background' },
    { color: '#f8fafc', frequency: 80, role: 'Light Text' },
  ],
  fonts: {
    families: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
    sizes: ['14px', '16px', '24px', '48px', '64px'],
  },
  layout: {
    sections: ['Header', 'Hero', 'Features Grid', 'Pricing Table', 'Footer'],
  },
};

// Sample Flawed Initial JSX (Contains layout, spacing, typography, contrast, radius flaws)
const sampleFlawedJSX = `
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SaaSPage() {
  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 font-sans">
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="font-bold text-white text-lg">Acme Cloud</div>
        <button className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg">Get Started</button>
      </header>

      <main className="w-full">
        <section className="py-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-sm bg-slate-800 text-xs font-medium text-slate-300">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Next-Gen Cloud</span>
          </div>

          <h1 className="text-2xl font-bold text-white my-4">
            Autonomous Cloud Infrastructure
          </h1>

          <p className="text-sm text-slate-800 max-w-xl mx-auto mb-6">
            Scale and deploy microservices with zero configuration.
          </p>

          <button className="px-6 py-3 font-bold bg-blue-600 text-white rounded-xl">
            Get Started <ArrowRight className="inline ml-2" />
          </button>
        </section>

        <section className="py-4">
          <h2 className="text-base font-normal text-white mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="border border-slate-800 bg-slate-900 p-6 rounded-none">
              <h3 className="text-lg font-bold text-white mb-2">Zero Latency</h3>
              <p className="text-sm text-slate-400">Ultra-fast edge routing across 300+ regions.</p>
            </div>
            <div className="border border-slate-800 bg-slate-900 p-6 rounded-none">
              <h3 className="text-lg font-bold text-white mb-2">Auto Healing</h3>
              <p className="text-sm text-slate-400">Intelligent node failover in under 200ms.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © 2026 Acme Cloud SaaS.
      </footer>
    </div>
  );
}
`;

console.log('================================================================');
console.log('🚀 Running Vision AI Self-Healing & Cloud Scraper Test Suite');
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

async function runAllTests() {
  /* ──────────────────────────────────────────────────────────────────
   * SECTION 1: VISION MODELS & MULTIMODAL PROMPT COMPILERS
   * ────────────────────────────────────────────────────────────────── */
  console.log('--- 1. Vision Models & Prompt Compilation ---');

  test('Normalize Vision Providers correctly', () => {
    assert.strictEqual(normalizeVisionProvider('claude'), 'anthropic');
    assert.strictEqual(normalizeVisionProvider('anthropic-vision'), 'anthropic');
    assert.strictEqual(normalizeVisionProvider('gpt-4o'), 'openai');
    assert.strictEqual(normalizeVisionProvider('chatgpt'), 'openai');
    assert.strictEqual(normalizeVisionProvider('gemini'), 'google');
    assert.strictEqual(normalizeVisionProvider('google-vision'), 'google');
    assert.strictEqual(normalizeVisionProvider('unknown-healer'), 'mock');
  });

  test('Compile Claude 3.7 Multimodal Vision Prompt', () => {
    const promptPayload = compileVisionPrompt('anthropic', {
      originalTelemetry: sampleTelemetry,
      generatedCode: sampleFlawedJSX,
      screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      referenceScreenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      model: 'claude-3-7-sonnet-20250219',
    });

    assert.strictEqual(promptPayload.provider, 'anthropic');
    assert.strictEqual(promptPayload.model, 'claude-3-7-sonnet-20250219');
    assert.ok(promptPayload.system.includes('Vision AI'));
    assert.ok(Array.isArray(promptPayload.messages));
    assert.strictEqual(promptPayload.messages[0].role, 'user');
    
    // Check multimodal content structure
    const content = promptPayload.messages[0].content;
    assert.ok(Array.isArray(content));
    assert.strictEqual(content[0].type, 'image');
    assert.strictEqual(content[0].source.type, 'base64');
    assert.strictEqual(content[0].source.media_type, 'image/png');
    assert.ok(content[content.length - 1].text.includes('Acme Cloud SaaS Platform'));
  });

  test('Compile OpenAI GPT-4o Vision Prompt', () => {
    const promptPayload = compileVisionPrompt('openai', {
      originalTelemetry: sampleTelemetry,
      generatedCode: sampleFlawedJSX,
      screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      model: 'gpt-4o',
    });

    assert.strictEqual(promptPayload.provider, 'openai');
    assert.strictEqual(promptPayload.model, 'gpt-4o');
    assert.ok(Array.isArray(promptPayload.messages));
    assert.strictEqual(promptPayload.messages[0].role, 'system');
    assert.strictEqual(promptPayload.messages[1].role, 'user');

    const userContent = promptPayload.messages[1].content;
    assert.strictEqual(userContent[0].type, 'image_url');
    assert.ok(userContent[0].image_url.url.startsWith('data:image/png;base64,'));
    assert.strictEqual(userContent[0].image_url.detail, 'high');
  });

  test('Compile Google Gemini 2.5 Pro Vision Prompt', () => {
    const promptPayload = compileVisionPrompt('google', {
      originalTelemetry: sampleTelemetry,
      generatedCode: sampleFlawedJSX,
      screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      model: 'gemini-2.5-pro',
    });

    assert.strictEqual(promptPayload.provider, 'google');
    assert.strictEqual(promptPayload.model, 'gemini-2.5-pro');
    assert.ok(promptPayload.systemInstruction.parts[0].text.includes('Vision AI'));
    assert.ok(Array.isArray(promptPayload.contents));
    assert.strictEqual(promptPayload.contents[0].role, 'user');

    const parts = promptPayload.contents[0].parts;
    assert.ok(parts[0].inline_data);
    assert.strictEqual(parts[0].inline_data.mime_type, 'image/png');
    assert.ok(parts[1].text.includes('DESIGN TELEMETRY SPECIFICATIONS'));
  });

  /* ──────────────────────────────────────────────────────────────────
   * SECTION 2: VISUAL DIFFERENCE ANALYSIS & PATCH GENERATION
   * ────────────────────────────────────────────────────────────────── */
  console.log('\n--- 2. Visual Difference Analysis & Surgical Patch Generation ---');

  let analysisResult = null;

  test('Detect layout, spacing, typography, color, and radius discrepancies', () => {
    analysisResult = analyzeVisualDifferences(sampleTelemetry, sampleFlawedJSX);

    assert.ok(analysisResult);
    assert.ok(typeof analysisResult.score === 'number');
    assert.ok(analysisResult.score < 85, `Initial score should reflect flaws: ${analysisResult.score}`);
    assert.ok(Array.isArray(analysisResult.differences));
    assert.ok(analysisResult.differences.length >= 4, `Expected at least 4 differences, got ${analysisResult.differences.length}`);
    assert.ok(Array.isArray(analysisResult.patches));
    assert.ok(analysisResult.patches.length >= 4, `Expected at least 4 patches, got ${analysisResult.patches.length}`);

    // Verify presence of all discrepancy types
    const types = analysisResult.differences.map(d => d.type);
    assert.ok(types.includes('typography'), 'Must detect typography discrepancies');
    assert.ok(types.includes('spacing'), 'Must detect spacing discrepancies');
    assert.ok(types.includes('color'), 'Must detect color/contrast discrepancies');
    assert.ok(types.includes('radius'), 'Must detect border-radius discrepancies');
    assert.ok(types.includes('layout'), 'Must detect layout containment discrepancies');
  });

  test('Generate surgical Tailwind CSS patch specifications', () => {
    const typoPatch = analysisResult.patches.find(p => p.type === 'typography' && p.target === 'h1');
    assert.ok(typoPatch, 'Must generate H1 typography patch');
    assert.ok(typoPatch.originalClass.includes('text-2xl'));
    assert.ok(typoPatch.replacementClass.includes('text-5xl md:text-7xl font-extrabold tracking-tight'));
    assert.ok(typoPatch.diff.before);
    assert.ok(typoPatch.diff.after);

    const radiusPatch = analysisResult.patches.find(p => p.type === 'radius' && p.target === 'badge');
    assert.ok(radiusPatch, 'Must generate badge radius patch');
    assert.ok(radiusPatch.replacementClass.includes('rounded-full'));

    const colorPatch = analysisResult.patches.find(p => p.type === 'color' && p.target === 'text-contrast');
    assert.ok(colorPatch, 'Must generate low-contrast text patch');
    assert.ok(colorPatch.replacementClass.includes('text-slate-300'));
  });

  /* ──────────────────────────────────────────────────────────────────
   * SECTION 3: SAFE JSX SELF-HEALING PATCH APPLICATION
   * ────────────────────────────────────────────────────────────────── */
  console.log('\n--- 3. Safe JSX Self-Healing Patch Application ---');

  let healedCode = '';

  test('Apply surgical patches safely to JSX code', () => {
    const patchResult = applySelfHealingPatches(sampleFlawedJSX, analysisResult.patches);

    assert.strictEqual(patchResult.success, true);
    assert.ok(patchResult.appliedCount >= 4, `Expected at least 4 applied patches, got ${patchResult.appliedCount}`);
    assert.strictEqual(patchResult.failedCount, 0, `Expected 0 failed patches, got ${patchResult.failedCount}`);
    assert.ok(patchResult.healedCode);

    healedCode = patchResult.healedCode;

    // Verify replacements took effect
    assert.ok(healedCode.includes('text-5xl md:text-7xl font-extrabold tracking-tight'), 'H1 heading was healed');
    assert.ok(healedCode.includes('rounded-full px-3.5 py-1.5'), 'Badge was healed to rounded-full');
    assert.ok(healedCode.includes('text-slate-300'), 'Contrast text was healed');
    assert.ok(healedCode.includes('max-w-7xl mx-auto'), 'Main layout containment was healed');
    assert.ok(healedCode.includes('rounded-2xl'), 'Card border-radius was healed');
  });

  test('Re-analyze healed code demonstrates high visual similarity score', () => {
    const reAnalysis = analyzeVisualDifferences(sampleTelemetry, healedCode);
    assert.ok(reAnalysis.score >= 90, `Healed score should be high (>=90), got ${reAnalysis.score}`);
    assert.ok(reAnalysis.differences.length <= 1, 'Almost all discrepancies resolved');
  });

  test('Edge Case: Handle empty patches and nonexistent targets without throwing', () => {
    const emptyResult = applySelfHealingPatches(sampleFlawedJSX, []);
    assert.strictEqual(emptyResult.appliedCount, 0);
    assert.strictEqual(emptyResult.success, true);

    const nonExistentResult = applySelfHealingPatches(sampleFlawedJSX, [
      {
        id: 'patch-invalid',
        type: 'typography',
        targetSnippet: 'NON_EXISTENT_COMPONENT_SNIPPET_XYZ',
        replacementSnippet: 'NEW_SNIPPET',
      },
    ]);
    assert.strictEqual(nonExistentResult.appliedCount, 0);
    assert.strictEqual(nonExistentResult.failedCount, 1);
    assert.strictEqual(nonExistentResult.failedPatches[0].id, 'patch-invalid');
  });

  /* ──────────────────────────────────────────────────────────────────
   * SECTION 4: STREAMING VISUAL HEALING GENERATOR
   * ────────────────────────────────────────────────────────────────── */
  console.log('\n--- 4. Real-time Streaming Visual Self-Healing ---');

  await testAsync('Stream iterative self-healing events via SSE async generator', async () => {
    const events = [];
    for await (const event of streamVisualHealingAsync({
      originalTelemetry: sampleTelemetry,
      generatedCode: sampleFlawedJSX,
      provider: 'mock',
      maxIterations: 2,
    })) {
      events.push(event);
    }

    const eventTypes = events.map(e => e.type);
    assert.ok(eventTypes.includes('status'), 'Must emit status events');
    assert.ok(eventTypes.includes('analysis'), 'Must emit analysis events');
    assert.ok(eventTypes.includes('patch'), 'Must emit patch events');
    assert.ok(eventTypes.includes('healed_code'), 'Must emit healed_code events');
    assert.ok(eventTypes.includes('done'), 'Must emit done event');

    const doneEvent = events.find(e => e.type === 'done');
    assert.ok(doneEvent);
    assert.ok(doneEvent.finalScore >= 90, `Final score should be >=90, got ${doneEvent.finalScore}`);
    assert.ok(doneEvent.totalPatchesApplied >= 4);
    assert.ok(doneEvent.healedCode.includes('text-5xl md:text-7xl'));
  });

  await testAsync('Execute callback-based streamVisualHealing runner', async () => {
    const recordedPatches = [];
    let recordedAnalysis = null;
    let completedResult = null;

    const result = await streamVisualHealing(
      {
        originalTelemetry: sampleTelemetry,
        generatedCode: sampleFlawedJSX,
        provider: 'mock',
      },
      {
        onAnalysis: (analysis) => { recordedAnalysis = analysis; },
        onPatch: (patch) => { recordedPatches.push(patch); },
        onDone: (res) => { completedResult = res; },
      }
    );

    assert.ok(recordedAnalysis);
    assert.ok(recordedPatches.length >= 4);
    assert.ok(completedResult);
    assert.strictEqual(completedResult.provider, 'mock');
    assert.ok(result.finalScore >= 90);
  });

  /* ──────────────────────────────────────────────────────────────────
   * SECTION 5: CLOUD SCRAPER CONNECTOR & REMOTE BROWSER CONFIGS
   * ────────────────────────────────────────────────────────────────── */
  console.log('\n--- 5. Cloud Scraper Connector & Connection Builders ---');

  test('Normalize Cloud Providers correctly', () => {
    assert.strictEqual(normalizeCloudProvider('browserless'), 'browserless');
    assert.strictEqual(normalizeCloudProvider('browserless.io'), 'browserless');
    assert.strictEqual(normalizeCloudProvider('scrapingbee'), 'scrapingbee');
    assert.strictEqual(normalizeCloudProvider('brightdata'), 'brightdata');
    assert.strictEqual(normalizeCloudProvider('custom'), 'custom');
    assert.strictEqual(normalizeCloudProvider('offline'), 'offline');
    assert.strictEqual(normalizeCloudProvider('unknown-service'), 'offline');
  });

  test('Build Browserless.io WebSocket URL with stealth and window parameters', () => {
    const wsUrl = buildCloudBrowserUrl('browserless', {
      token: 'test_token_abc_123',
      stealth: true,
      blockAds: true,
      timeout: 30000,
    });

    assert.ok(wsUrl.startsWith('wss://chrome.browserless.io?token=test_token_abc_123'));
    assert.ok(wsUrl.includes('stealth=true'));
    assert.ok(wsUrl.includes('--window-size=1920,1080'));
    assert.ok(wsUrl.includes('blockAds=true'));
    assert.ok(wsUrl.includes('timeout=30000'));
  });

  test('Build ScrapingBee REST API URL with parameters', () => {
    const apiUrl = buildCloudBrowserUrl('scrapingbee', {
      apiKey: 'TEST_BEE_KEY_456',
      url: 'https://example.com/pricing',
      renderJs: true,
      blockAds: true,
      countryCode: 'us',
    });

    assert.ok(apiUrl.startsWith('https://app.scrapingbee.com/api/v1/'));
    assert.ok(apiUrl.includes('api_key=TEST_BEE_KEY_456'));
    assert.ok(apiUrl.includes('url=https%3A%2F%2Fexample.com%2Fpricing'));
    assert.ok(apiUrl.includes('render_js=true'));
    assert.ok(apiUrl.includes('country_code=us'));
  });

  test('Build BrightData Scraping Browser CDP WebSocket URL', () => {
    const brdUrl = buildCloudBrowserUrl('brightdata', {
      customer: 'hl_testcustomer',
      password: 'testpassword123',
      zone: 'scraping_browser',
    });

    assert.strictEqual(
      brdUrl,
      'wss://brd-customer-hl_testcustomer-zone-scraping_browser:testpassword123@brd.superproxy.io:9222'
    );
  });

  test('Build Custom WebSocket CDP Endpoint', () => {
    const customUrl = buildCloudBrowserUrl('custom', {
      browserWSEndpoint: 'wss://k8s-cluster.internal.net:3000/browser',
    });
    assert.strictEqual(customUrl, 'wss://k8s-cluster.internal.net:3000/browser');
  });

  test('Mask sensitive credentials for telemetry logs', () => {
    const masked = maskCloudCredentials({
      token: 'sk-browserless-secret-token-999',
      apiKey: 'bee_api_key_secure_value_123',
      password: 'super_secret_brightdata_password',
      provider: 'browserless',
    });

    assert.strictEqual(masked.token, 'sk-b...-999');
    assert.strictEqual(masked.apiKey, 'bee_..._123');
    assert.strictEqual(masked.password, '********');
    assert.strictEqual(masked.provider, 'browserless');
  });

  /* ──────────────────────────────────────────────────────────────────
   * SECTION 6: PURE NODE.JS OFFLINE EDGE FALLBACK ANALYZER
   * ────────────────────────────────────────────────────────────────── */
  console.log('\n--- 6. Pure Node.js Offline Edge Fallback Analyzer ---');

  test('Extract complete telemetry from raw HTML/CSS without Chrome binaries', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>SaaS Dashboard Pro</title>
        <meta name="description" content="Next-generation cloud analytics and monitoring.">
        <meta property="og:title" content="SaaS Dashboard Pro Cloud">
        <meta property="og:image" content="https://example.com/og.png">
        <meta name="theme-color" content="#0b0f19">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary: #3b82f6;
            --accent: #8b5cf6;
            --bg-dark: #0b0f19;
          }
          body {
            background-color: #0b0f19;
            color: #f8fafc;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .hero-title {
            color: #3b82f6;
            font-size: 48px;
          }
        </style>
      </head>
      <body class="bg-[#0b0f19] text-white">
        <div id="__next">
          <header class="header">
            <nav>
              <a href="/">Home</a>
              <a href="/features">Features</a>
              <button class="btn btn-primary">Sign In</button>
            </nav>
          </header>
          <main>
            <h1 class="hero-title">Cloud Intelligence Simplified</h1>
            <p>Deploy scalable clusters with single-click automation.</p>
            <button class="btn btn-brand">Start Free Trial</button>
          </main>
          <section id="features" class="grid">
            <h2>Core Capabilities</h2>
            <div>Feature 1</div>
            <div>Feature 2</div>
          </section>
          <footer>
            <p>© 2026 SaaS Dashboard Inc.</p>
          </footer>
        </div>
      </body>
      </html>
    `;

    const sampleCss = `
      .card { border-radius: 16px; background: rgba(15, 23, 42, 0.8); }
      .badge { color: #10b981; }
    `;

    const offlineTelemetry = analyzeOfflineFallback(sampleHtml, sampleCss, {
      targetUrl: 'https://dashboard-pro.io',
    });

    assert.ok(offlineTelemetry);
    assert.strictEqual(offlineTelemetry.meta.title, 'SaaS Dashboard Pro');
    assert.strictEqual(offlineTelemetry.meta.description, 'Next-generation cloud analytics and monitoring.');
    assert.strictEqual(offlineTelemetry.meta.canonical, 'https://dashboard-pro.io');
    assert.strictEqual(offlineTelemetry.meta.themeColor, '#0b0f19');

    // Framework detection
    assert.ok(offlineTelemetry.frameworkList.includes('Next.js'), 'Must detect Next.js');
    assert.ok(offlineTelemetry.frameworkList.includes('Tailwind CSS'), 'Must detect Tailwind CSS');

    // Color extraction
    const extractedColors = offlineTelemetry.colors.map(c => c.color.toLowerCase());
    assert.ok(extractedColors.includes('#3b82f6'), 'Must extract primary blue #3b82f6');
    assert.ok(extractedColors.includes('#0b0f19'), 'Must extract dark background #0b0f19');

    // Font & Typography extraction
    assert.ok(offlineTelemetry.fonts.families.some(f => f.includes('Plus Jakarta Sans')), 'Must extract font family');
    assert.ok(offlineTelemetry.fonts.headings.h1.includes('Cloud Intelligence Simplified'), 'Must extract H1 heading');
    assert.ok(offlineTelemetry.fonts.headings.h2.includes('Core Capabilities'), 'Must extract H2 heading');

    // Layout sections detection
    assert.ok(offlineTelemetry.layout.sections.includes('Header / Navigation'));
    assert.ok(offlineTelemetry.layout.sections.includes('Hero Section'));
    assert.ok(offlineTelemetry.layout.sections.includes('Footer'));

    // CSS Custom Variables
    assert.strictEqual(offlineTelemetry.cssVariables['--primary'], '#3b82f6');
    assert.strictEqual(offlineTelemetry.cssVariables['--accent'], '#8b5cf6');

    // Stats & Offline flags
    assert.strictEqual(offlineTelemetry.stats.isOfflineEngine, true);
    assert.ok(offlineTelemetry.stats.totalElements > 10);
  });

  /* ──────────────────────────────────────────────────────────────────
   * SECTION 7: RESILIENCE & CATALOG METADATA
   * ────────────────────────────────────────────────────────────────── */
  console.log('\n--- 7. Resilience, Health Checks & Capabilities ---');

  await testAsync('Verify testCloudConnection for offline edge engine', async () => {
    const check = await testCloudConnection({ provider: 'offline' });
    assert.strictEqual(check.success, true);
    assert.strictEqual(check.provider, 'offline');
    assert.strictEqual(check.status, 'ready');
  });

  test('Verify getCloudScraperInfo metadata catalog', () => {
    const info = getCloudScraperInfo();
    assert.ok(Array.isArray(info.providers));
    assert.ok(info.providers.length >= 4);
    assert.strictEqual(info.defaultProvider, 'browserless');
    assert.ok(Array.isArray(info.features));
    assert.ok(info.features.length >= 3);
  });
}

// Execute test suite
runAllTests().then(() => {
  console.log('\n================================================================');
  console.log(`🎉 Test Suite Complete: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');
  if (failed > 0) {
    process.exit(1);
  }
}).catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
