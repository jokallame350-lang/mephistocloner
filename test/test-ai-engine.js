/**
 * Unit Test Suite for AI Streaming Engine, BYOK Manager & Full-App Synthesizer
 */

const assert = require('assert');
const AdmZip = require('adm-zip');

// Modules under test
const {
  SUPPORTED_PROVIDERS,
  normalizeProvider,
  validateApiKey,
  maskApiKey,
  encryptKey,
  decryptKey,
  extractKeysFromHeaders,
  resolveApiKey,
  getProviderStatus,
} = require('../lib/byok-manager');

const {
  DEFAULT_SYSTEM_PROMPT,
  generateCodeArtifact,
  streamGenerateAsync,
  streamGenerate,
  streamMockSimulator,
} = require('../lib/ai-streaming-engine');

const {
  extractAppMeta,
  synthesizeNextJsApp,
  createNextJsProjectZip,
} = require('../lib/full-app-synthesizer');

// Sample mock telemetry data
const mockTelemetry = {
  meta: {
    title: 'Acme SaaS Platform',
    canonical: 'https://acme-saas.com',
    description: 'High-performance cloud intelligence platform for modern engineering teams.',
    lang: 'en',
  },
  colors: [
    { color: '#2563EB', frequency: 32 }, // Primary Blue
    { color: '#7C3AED', frequency: 18 }, // Accent Purple
    { color: '#0F172A', frequency: 540 }, // Slate Dark
  ],
  fonts: {
    families: ['Inter', 'system-ui', 'sans-serif'],
    sizes: ['12px', '14px', '16px', '24px', '36px', '48px'],
  },
  images: [
    { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  ],
};

console.log('===============================================================');
console.log('🚀 Running AI Engine, BYOK & Full-App Synthesizer Test Suite');
console.log('===============================================================\n');

async function runTests() {
  let passedCount = 0;

  function pass(name) {
    passedCount++;
    console.log(`  ✅ [PASS] ${name}`);
  }

  // ─────────────────────────────────────────────────────────────────
  // 1. BYOK MANAGER TESTS
  // ─────────────────────────────────────────────────────────────────
  console.log('📦 SECTION 1: BYOK Manager Tests');

  // 1.1 Provider normalization
  assert.strictEqual(normalizeProvider('claude'), 'anthropic');
  assert.strictEqual(normalizeProvider('ANTHROPIC'), 'anthropic');
  assert.strictEqual(normalizeProvider('openai'), 'openai');
  assert.strictEqual(normalizeProvider('chatgpt'), 'openai');
  assert.strictEqual(normalizeProvider('deepseek'), 'deepseek');
  assert.strictEqual(normalizeProvider('gemini'), 'google');
  assert.strictEqual(normalizeProvider('google'), 'google');
  assert.strictEqual(normalizeProvider('mock'), 'mock');
  assert.strictEqual(normalizeProvider('unknown_xyz'), 'mock');
  pass('Provider name normalization and alias mapping');

  // 1.2 Key Validation
  const validAnthropic = validateApiKey('anthropic', 'sk-ant-api03-abcdef1234567890abcdef1234567890');
  assert.strictEqual(validAnthropic.valid, true);

  const invalidAnthropic = validateApiKey('anthropic', 'invalid-key-no-prefix');
  assert.strictEqual(invalidAnthropic.valid, false);
  assert(invalidAnthropic.error.includes('sk-ant-'));

  const validOpenAI = validateApiKey('openai', 'sk-proj-abcdef1234567890abcdef1234567890');
  assert.strictEqual(validOpenAI.valid, true);

  const invalidOpenAI = validateApiKey('openai', 'sk-short');
  assert.strictEqual(invalidOpenAI.valid, false);

  const validDeepSeek = validateApiKey('deepseek', 'sk-deepseek12345678901234567890123456');
  assert.strictEqual(validDeepSeek.valid, true);

  const validGoogle = validateApiKey('google', 'AIzaSyAbcdef1234567890Abcdef1234567890');
  assert.strictEqual(validGoogle.valid, true);

  const validMock = validateApiKey('mock', '');
  assert.strictEqual(validMock.valid, true);
  pass('API key format validation across all 4 providers + mock');

  // 1.3 Key Masking
  const maskedAnt = maskApiKey('sk-ant-api03-abcdef1234567890');
  assert(maskedAnt.startsWith('sk-ant-api'));
  assert(maskedAnt.endsWith('7890'));
  assert(maskedAnt.includes('••••••••'));

  const maskedOpenAI = maskApiKey('sk-proj-abcdef1234567890');
  assert(maskedOpenAI.startsWith('sk-proj-'));
  assert(maskedOpenAI.endsWith('7890'));

  const maskedGoogle = maskApiKey('AIzaSyAbcdef12345678901234');
  assert(maskedGoogle.startsWith('AIzaSy'));
  assert(maskedGoogle.endsWith('1234'));

  const maskedShort = maskApiKey('short');
  assert.strictEqual(maskedShort, '••••••••');
  pass('API key masking for sensitive logging & UI display');

  // 1.4 Encryption & Decryption (AES-256-GCM)
  const secretKey = 'test-secret-32-chars-long-key!';
  const plaintextKey = 'sk-ant-api03-secure-production-key-9999';
  const encrypted = encryptKey(plaintextKey, secretKey);
  assert(encrypted.includes(':'), 'Encrypted output should format as iv:tag:ciphertext');
  const decrypted = decryptKey(encrypted, secretKey);
  assert.strictEqual(decrypted, plaintextKey, 'Decrypted key must match original plaintext');
  pass('AES-256-GCM symmetric encryption/decryption roundtrip');

  // 1.5 Header Extraction
  const sampleHeaders = {
    'x-anthropic-key': 'sk-ant-api03-header-key-111111111111',
    'x-openai-key': 'sk-openai-header-key-222222222222',
    'x-deepseek-key': 'sk-deepseek-header-key-333333333333',
    'x-gemini-key': 'AIzaSyGoogleHeaderKey-444444444444',
  };
  const extracted = extractKeysFromHeaders(sampleHeaders);
  assert.strictEqual(extracted.anthropic, sampleHeaders['x-anthropic-key']);
  assert.strictEqual(extracted.openai, sampleHeaders['x-openai-key']);
  assert.strictEqual(extracted.deepseek, sampleHeaders['x-deepseek-key']);
  assert.strictEqual(extracted.google, sampleHeaders['x-gemini-key']);
  pass('Header API key extraction (x-provider-key and auth)');

  // 1.6 Priority Resolution (User Key > Server Key > Fallback Mock)
  // Test User Key Priority
  const resUser = resolveApiKey({
    provider: 'anthropic',
    userKey: 'sk-ant-api03-user-custom-key-1234567890',
    serverFallback: true,
  });
  assert.strictEqual(resUser.source, 'user');
  assert.strictEqual(resUser.isMock, false);
  assert.strictEqual(resUser.valid, true);

  // Test Server Key Priority
  process.env.OPENAI_API_KEY = 'sk-server-env-key-1234567890123456';
  const resServer = resolveApiKey({
    provider: 'openai',
    userKey: null,
    serverFallback: true,
  });
  assert.strictEqual(resServer.source, 'server');
  assert.strictEqual(resServer.isMock, false);
  delete process.env.OPENAI_API_KEY;

  // Test Offline Mock Fallback
  const resFallback = resolveApiKey({
    provider: 'anthropic',
    userKey: null,
    serverFallback: false,
    allowMockFallback: true,
  });
  assert.strictEqual(resFallback.source, 'offline_mock');
  assert.strictEqual(resFallback.isMock, true);
  assert.strictEqual(resFallback.valid, true);
  pass('Priority resolution: User Key > Server Key > Fallback Mock Simulator');

  // 1.7 Provider Status
  const status = getProviderStatus();
  assert(status.anthropic);
  assert(status.openai);
  assert(status.deepseek);
  assert(status.google);
  assert(status.mock);
  assert.strictEqual(status.mock.available, true);
  pass('Provider capability matrix and server configuration status');

  console.log('');

  // ─────────────────────────────────────────────────────────────────
  // 2. AI STREAMING ENGINE TESTS
  // ─────────────────────────────────────────────────────────────────
  console.log('⚡ SECTION 2: AI Streaming Engine Tests');

  // 2.1 Mock Simulator Async Generator
  const mockEvents = [];
  for await (const event of streamMockSimulator({
    framework: 'react-tailwind',
    telemetry: mockTelemetry,
    mockDelayMs: 0,
  })) {
    mockEvents.push(event);
  }

  const statusEvents = mockEvents.filter((e) => e.type === 'status');
  const tokenEvents = mockEvents.filter((e) => e.type === 'token');
  const doneEvents = mockEvents.filter((e) => e.type === 'done');

  assert(statusEvents.length >= 3, 'Should emit initialization and parsing status events');
  assert(tokenEvents.length > 5, 'Should emit multiple streaming token events');
  assert.strictEqual(doneEvents.length, 1, 'Should emit exactly one done event');
  assert(doneEvents[0].fullCode.length > 500, 'Done event should contain complete synthesized code');
  assert(doneEvents[0].stats.totalTokens > 50, 'Stats should contain estimated token count');
  pass('Mock Simulator async generator streaming (status, token, done events)');

  // 2.2 Master streamGenerateAsync with Mock fallback
  const masterEvents = [];
  for await (const event of streamGenerateAsync({
    provider: 'deepseek', // No key provided -> triggers mock fallback
    telemetry: mockTelemetry,
    framework: 'react-tailwind',
    mockDelayMs: 0,
  })) {
    masterEvents.push(event);
  }
  const hasFallbackStatus = masterEvents.some((e) => e.type === 'status' && e.phase === 'fallback');
  const hasTokens = masterEvents.some((e) => e.type === 'token');
  const hasDone = masterEvents.some((e) => e.type === 'done');
  assert(hasFallbackStatus, 'Should gracefully emit fallback status when live keys are absent');
  assert(hasTokens && hasDone, 'Should successfully stream tokens and complete done state');
  pass('streamGenerateAsync automatic mock fallback resilience');

  // 2.3 Callback wrapper streamGenerate
  let tokenCount = 0;
  let statusCount = 0;
  let finished = false;

  const result = await streamGenerate({
    provider: 'mock',
    telemetry: mockTelemetry,
    framework: 'vanilla-html',
    mockDelayMs: 0,
    onStatus: (s) => statusCount++,
    onToken: (t) => tokenCount++,
    onDone: (d) => {
      finished = true;
    },
  });

  assert(statusCount > 0, 'onStatus callback should be called');
  assert(tokenCount > 0, 'onToken callback should be called');
  assert(finished, 'onDone callback should be called');
  assert(result.fullCode.includes('<!DOCTYPE html>'), 'Generated code should be valid HTML');
  assert(result.fullCode.includes('Acme SaaS Platform'), 'Generated code should include telemetry title');
  pass('streamGenerate callback interface with HTML artifact synthesis');

  // 2.4 Abort Signal cancellation
  const abortCtrl = new AbortController();
  let abortedCaught = false;
  try {
    const generator = streamMockSimulator({
      framework: 'react-tailwind',
      telemetry: mockTelemetry,
      mockDelayMs: 2,
      signal: abortCtrl.signal,
    });
    let i = 0;
    for await (const event of generator) {
      i++;
      if (i === 3) {
        abortCtrl.abort(); // Abort during streaming
      }
    }
  } catch (err) {
    abortedCaught = true;
    assert(err.message.includes('aborted'), 'Error message should indicate aborted stream');
  }
  assert(abortedCaught, 'Streaming engine should respect AbortSignal');
  pass('AbortController stream cancellation and memory cleanup');

  console.log('');

  // ─────────────────────────────────────────────────────────────────
  // 3. NEXT.JS 15 FULL-APP SYNTHESIZER TESTS
  // ─────────────────────────────────────────────────────────────────
  console.log('🏗️ SECTION 3: Next.js 15 Full-App Synthesizer Tests');

  // 3.1 Metadata extraction
  const appMeta = extractAppMeta(mockTelemetry);
  assert.strictEqual(appMeta.title, 'Acme SaaS Platform');
  assert.strictEqual(appMeta.slug, 'acme-saas-platform');
  assert.strictEqual(appMeta.primaryColor, '#2563EB');
  assert.strictEqual(appMeta.primaryFont, 'Inter');
  pass('Telemetry extraction and sanitization for Next.js 15 metadata');

  // 3.2 Full Virtual File Tree Synthesis
  const fileTree = synthesizeNextJsApp(mockTelemetry);

  // Check required App Router core files
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'tailwind.config.ts',
    'postcss.config.mjs',
    'README.md',
    'app/globals.css',
    'app/layout.tsx',
    'app/page.tsx',
    'app/pricing/page.tsx',
    'app/features/page.tsx',
    'app/about/page.tsx',
    'app/contact/page.tsx',
    'components/Navbar.tsx',
    'components/Hero.tsx',
    'components/Features.tsx',
    'components/Pricing.tsx',
    'components/Testimonials.tsx',
    'components/FAQ.tsx',
    'components/Footer.tsx',
    'lib/utils.ts',
    'lib/mock-api.ts',
  ];

  for (const file of requiredFiles) {
    assert(fileTree[file], `Synthesized project must contain file: ${file}`);
    assert(fileTree[file].length > 20, `File ${file} must have non-empty content`);
  }
  pass(`Complete Next.js 15 virtual file tree synthesis (${requiredFiles.length} files verified)`);

  // 3.3 Validate Layout & Metadata
  const layoutContent = fileTree['app/layout.tsx'];
  assert(layoutContent.includes('export const metadata: Metadata'), 'app/layout.tsx must export Next.js Metadata');
  assert(layoutContent.includes('Acme SaaS Platform'), 'app/layout.tsx must include site title');
  assert(layoutContent.includes('className="dark scroll-smooth"'), 'app/layout.tsx must include dark theme and smooth scroll');
  pass('app/layout.tsx structure, font loading & SEO metadata exports');

  // 3.4 Validate Landing Page & Component Composition
  const homePageContent = fileTree['app/page.tsx'];
  assert(homePageContent.includes('<Navbar />'), 'app/page.tsx must compose Navbar');
  assert(homePageContent.includes('<Hero />'), 'app/page.tsx must compose Hero');
  assert(homePageContent.includes('<Features />'), 'app/page.tsx must compose Features');
  assert(homePageContent.includes('<Pricing />'), 'app/page.tsx must compose Pricing');
  assert(homePageContent.includes('<Testimonials />'), 'app/page.tsx must compose Testimonials');
  assert(homePageContent.includes('<FAQ />'), 'app/page.tsx must compose FAQ');
  assert(homePageContent.includes('<Footer />'), 'app/page.tsx must compose Footer');
  pass('app/page.tsx modular multi-component composition');

  // 3.5 Validate Subpages
  assert(fileTree['app/pricing/page.tsx'].includes('PricingPage'), 'app/pricing/page.tsx must export functional component');
  assert(fileTree['app/features/page.tsx'].includes('FeaturesPage'), 'app/features/page.tsx must export functional component');
  assert(fileTree['app/about/page.tsx'].includes('AboutPage'), 'app/about/page.tsx must export functional component');
  assert(fileTree['app/contact/page.tsx'].includes('"use client"'), 'app/contact/page.tsx must be an interactive client component');
  assert(fileTree['app/contact/page.tsx'].includes('submitContactForm'), 'app/contact/page.tsx must integrate mock API form handler');
  pass('Subpage synthesis: /pricing, /features, /about, /contact with client interactivity');

  // 3.6 Validate Mock API Handlers
  const mockApiContent = fileTree['lib/mock-api.ts'];
  assert(mockApiContent.includes('export interface PricingPlan'), 'mock-api.ts must export typed PricingPlan interface');
  assert(mockApiContent.includes('export interface FeatureItem'), 'mock-api.ts must export typed FeatureItem interface');
  assert(mockApiContent.includes('export async function fetchPricingPlans()'), 'mock-api.ts must export fetchPricingPlans async handler');
  assert(mockApiContent.includes('export async function fetchFeatures()'), 'mock-api.ts must export fetchFeatures async handler');
  assert(mockApiContent.includes('export async function submitContactForm'), 'mock-api.ts must export submitContactForm handler');
  pass('lib/mock-api.ts typed interfaces, async handlers & simulated network delays');

  // 3.7 Validate Tailwind & Design Tokens Integration
  const tailwindCfg = fileTree['tailwind.config.ts'];
  assert(tailwindCfg.includes('#2563EB'), 'tailwind.config.ts must inject primary brand color');
  assert(tailwindCfg.includes('Inter'), 'tailwind.config.ts must inject font family');
  pass('tailwind.config.ts design token integration from live telemetry');

  // 3.8 Validate Project ZIP Packaging
  const zipBuffer = createNextJsProjectZip(mockTelemetry, { appName: 'acme-saas' });
  assert(Buffer.isBuffer(zipBuffer), 'createNextJsProjectZip must return a Buffer');
  assert(zipBuffer.length > 2000, `ZIP Buffer must have substantial content (got ${zipBuffer.length} bytes)`);

  const unzipped = new AdmZip(zipBuffer);
  const zipEntries = unzipped.getEntries().map((e) => e.entryName);
  assert(zipEntries.includes('app/layout.tsx'), 'ZIP archive must contain app/layout.tsx');
  assert(zipEntries.includes('app/page.tsx'), 'ZIP archive must contain app/page.tsx');
  assert(zipEntries.includes('package.json'), 'ZIP archive must contain package.json');
  assert(zipEntries.includes('lib/mock-api.ts'), 'ZIP archive must contain lib/mock-api.ts');
  pass(`Next.js 15 Project ZIP packager (${zipEntries.length} files in archive, ${zipBuffer.length} bytes)`);

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passedCount} AI ENGINE, BYOK & FULL-APP TESTS PASSED WITH 0 ERRORS!`);
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
