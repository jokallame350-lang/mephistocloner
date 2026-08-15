/**
 * Automated Verification Suite for GitHub & Vercel 1-Click Deployment Engine & Next.js 15 Packager
 */

const assert = require('assert');
const AdmZip = require('adm-zip');
const {
  sanitizeRepoName,
  normalizeFileMap,
  createRepository,
  createBlob,
  pushProjectFiles,
  deployToGitHub,
  mockDeployGitHub,
  isMockMode: isGitHubMockMode,
} = require('../lib/github-deployer');

const {
  sanitizeProjectName,
  formatVercelFiles,
  FRAMEWORK_PRESETS,
  createVercelDeployment,
  pollDeploymentStatus,
  deployToVercel,
  mockDeployVercel,
  isMockMode: isVercelMockMode,
} = require('../lib/vercel-deployer');

const {
  generateNextjsProjectFileMap,
  createNextjsProjectZip,
} = require('../lib/nextjs-project-packager');

async function runDeployerTestSuite() {
  console.log('================================================================');
  console.log('🚀 Starting GitHub & Vercel Deployer + Next.js 15 Test Suite');
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

  // -------------------------------------------------------------
  // SECTION 1: GitHub Deployer Unit & Integration Tests
  // -------------------------------------------------------------
  console.log('📦 Testing GitHub Deployer Module...');

  test('GitHub: Sanitize repository names', () => {
    assert.strictEqual(sanitizeRepoName('My Cool SaaS Project!'), 'my-cool-saas-project');
    assert.strictEqual(sanitizeRepoName('___Special--Chars@#$---'), 'special-chars');
    assert.strictEqual(sanitizeRepoName(''), 'siteprompter-project');
  });

  test('GitHub: Normalize file map formats (Object & Array)', () => {
    const objectMap = {
      './app/page.tsx': 'export default function Page() {}',
      'public/robots.txt': 'User-agent: *',
    };
    const normalizedObj = normalizeFileMap(objectMap);
    assert.strictEqual(normalizedObj['app/page.tsx'], 'export default function Page() {}');
    assert.strictEqual(normalizedObj['public/robots.txt'], 'User-agent: *');

    const arrayMap = [
      { path: './components/navbar.tsx', content: 'export const Navbar = () => {}' },
      { file: 'README.md', data: '# Hello' },
    ];
    const normalizedArr = normalizeFileMap(arrayMap);
    assert.strictEqual(normalizedArr['components/navbar.tsx'], 'export const Navbar = () => {}');
    assert.strictEqual(normalizedArr['README.md'], '# Hello');
  });

  await testAsync('GitHub: Create repository (Mock Mode)', async () => {
    const res = await createRepository('mock_token_123', 'NextGen-Portfolio', {
      isPrivate: true,
      description: 'Test Next.js Portfolio',
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.name, 'nextgen-portfolio');
    assert.strictEqual(res.isPrivate, true);
    assert(res.repoUrl.includes('nextgen-portfolio'), 'repoUrl should contain repo name');
    assert(res.cloneUrl.endsWith('.git'), 'cloneUrl should end with .git');
    assert.strictEqual(res.mock, true);
  });

  await testAsync('GitHub: Create Git Blob (Mock Mode)', async () => {
    const blob = await createBlob('mock_token_123', 'owner', 'repo', 'const x = 1;');
    assert(blob.sha.startsWith('mock_blob_sha_'), 'blob sha should match mock prefix');
    assert.strictEqual(blob.mock, true);
  });

  await testAsync('GitHub: Push project files (Mock Mode)', async () => {
    const fileMap = {
      'package.json': '{"name": "test"}',
      'app/page.tsx': 'export default function Page() {}',
      'app/layout.tsx': 'export default function Root() {}',
    };
    const res = await pushProjectFiles('mock_token_123', 'mock-owner', 'test-repo', fileMap, 'feat: initial commit');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.filesPushed, 3);
    assert.strictEqual(res.branch, 'main');
    assert(res.commitSha.startsWith('mock_sha_'), 'commit sha should match mock prefix');
  });

  await testAsync('GitHub: Push empty fileMap throws validation error', async () => {
    let threw = false;
    try {
      await pushProjectFiles('mock_token_123', 'mock-owner', 'test-repo', {});
    } catch (e) {
      threw = true;
      assert(e.message.includes('Cannot push empty project'));
    }
    assert(threw, 'Should throw on empty files');
  });

  await testAsync('GitHub: Full deployToGitHub workflow', async () => {
    const fileMap = {
      'package.json': '{"name": "app"}',
      'app/page.tsx': 'export default function Page() {}',
    };
    const deploy = await deployToGitHub({
      githubToken: 'mock_token',
      repoName: 'My Awesome AI Clone',
      fileMap,
      isPrivate: false,
    });
    assert.strictEqual(deploy.success, true);
    assert.strictEqual(deploy.name, 'my-awesome-ai-clone');
    assert.strictEqual(deploy.filesPushed, 2);
    assert.strictEqual(deploy.mock, true);
    assert(deploy.repoUrl.includes('github.com'));
  });

  test('GitHub: Standalone mockDeployGitHub simulator', () => {
    const sim = mockDeployGitHub('offline-repo', { 'README.md': '# Offline' });
    assert.strictEqual(sim.success, true);
    assert.strictEqual(sim.name, 'offline-repo');
    assert.strictEqual(sim.filesPushed, 1);
    assert.strictEqual(sim.mock, true);
  });

  // -------------------------------------------------------------
  // SECTION 2: Vercel Deployer Unit & Integration Tests
  // -------------------------------------------------------------
  console.log('\n▲ Testing Vercel Deployer Module...');

  test('Vercel: Sanitize project names', () => {
    assert.strictEqual(sanitizeProjectName('My Vercel App 2026!'), 'my-vercel-app-2026');
    assert.strictEqual(sanitizeProjectName('__--Test--__'), 'test');
    assert.strictEqual(sanitizeProjectName(''), 'siteprompter-clone');
  });

  test('Vercel: Format files map for Vercel REST API', () => {
    const inputFiles = {
      'package.json': JSON.stringify({ name: 'test' }, null, 2),
      'public/icon.png': Buffer.from('fake-png-binary'),
      'app/page.tsx': 'export default function Page() {}',
    };
    const formatted = formatVercelFiles(inputFiles);
    assert.strictEqual(formatted.length, 3);

    const pkg = formatted.find((f) => f.file === 'package.json');
    assert.strictEqual(pkg.encoding, 'utf-8');
    assert(pkg.data.includes('"name": "test"'));

    const icon = formatted.find((f) => f.file === 'public/icon.png');
    assert.strictEqual(icon.encoding, 'base64');
    assert.strictEqual(icon.data, Buffer.from('fake-png-binary').toString('base64'));
  });

  await testAsync('Vercel: Create Vercel Deployment (Mock Mode)', async () => {
    const filesMap = {
      'package.json': '{"name": "demo"}',
      'app/page.tsx': 'export default function Page() {}',
    };
    const res = await createVercelDeployment('mock_vercel_token', 'Stripe-Checkout-Clone', filesMap, 'nextjs-shadcn');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.framework, 'nextjs');
    assert.strictEqual(res.readyState, 'READY');
    assert.strictEqual(res.filesCount, 2);
    assert(res.url.endsWith('.vercel.app'), 'url must end with .vercel.app');
    assert(res.deploymentUrl.startsWith('https://'), 'deploymentUrl must have https scheme');
  });

  await testAsync('Vercel: Poll deployment status (Mock Mode)', async () => {
    const poll = await pollDeploymentStatus('mock_vercel_token', 'dpl_123456', {
      url: 'my-app.vercel.app',
      deploymentUrl: 'https://my-app.vercel.app',
    });
    assert.strictEqual(poll.readyState, 'READY');
    assert.strictEqual(poll.url, 'my-app.vercel.app');
    assert.strictEqual(poll.mock, true);
  });

  await testAsync('Vercel: Full deployToVercel workflow', async () => {
    const filesMap = {
      'package.json': '{"name": "e2e-app"}',
      'app/page.tsx': 'export default function Page() {}',
    };
    const deploy = await deployToVercel({
      vercelToken: 'mock_token',
      projectName: 'Full-Stack-Clone',
      filesMap,
      framework: 'nextjs-shadcn',
      poll: true,
    });
    assert.strictEqual(deploy.success, true);
    assert.strictEqual(deploy.framework, 'nextjs');
    assert.strictEqual(deploy.readyState, 'READY');
    assert(deploy.deploymentUrl.includes('vercel.app'));
  });

  test('Vercel: Standalone mockDeployVercel simulator', () => {
    const sim = mockDeployVercel('linear-clone', { 'app/page.tsx': 'code' }, 'react-tailwind');
    assert.strictEqual(sim.success, true);
    assert.strictEqual(sim.name, 'linear-clone');
    assert.strictEqual(sim.framework, 'vite');
    assert.strictEqual(sim.mock, true);
    assert(sim.deploymentUrl.startsWith('https://linear-clone.vercel.app'));
  });

  // -------------------------------------------------------------
  // SECTION 3: Next.js 15 App Router Project Packager Tests
  // -------------------------------------------------------------
  console.log('\n⚛️  Testing Next.js 15 Project Packager...');

  test('Next.js: Generate Complete Next.js 15 File Map', () => {
    const mockTelemetry = {
      meta: {
        title: 'SaaSify Landing Page',
        description: 'High-converting SaaS landing page',
      },
      colors: [
        { color: '#3b82f6', frequency: 10 },
        { color: '#10b981', frequency: 8 },
        { color: '#8b5cf6', frequency: 5 },
      ],
      fonts: {
        families: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    };

    const fileMap = generateNextjsProjectFileMap('', mockTelemetry);

    // 1. Verify required root files
    assert(fileMap['package.json'], 'package.json must exist');
    assert(fileMap['tsconfig.json'], 'tsconfig.json must exist');
    assert(fileMap['next.config.mjs'], 'next.config.mjs must exist');
    assert(fileMap['tailwind.config.js'], 'tailwind.config.js must exist');
    assert(fileMap['postcss.config.js'], 'postcss.config.js must exist');
    assert(fileMap['lib/utils.ts'], 'lib/utils.ts (cn helper) must exist');
    assert(fileMap['README.md'], 'README.md must exist');
    assert(fileMap['.gitignore'], '.gitignore must exist');
    assert(fileMap['public/robots.txt'], 'public/robots.txt must exist');
    assert(fileMap['public/placeholder.svg'], 'public/placeholder.svg must exist');

    // 2. Verify App Router structure
    assert(fileMap['app/layout.tsx'], 'app/layout.tsx must exist');
    assert(fileMap['app/page.tsx'], 'app/page.tsx must exist');
    assert(fileMap['app/globals.css'], 'app/globals.css must exist');

    // 3. Verify Shadcn UI Components
    assert(fileMap['components/ui/button.tsx'], 'components/ui/button.tsx must exist');
    assert(fileMap['components/ui/card.tsx'], 'components/ui/card.tsx must exist');
    assert(fileMap['components/ui/badge.tsx'], 'components/ui/badge.tsx must exist');

    // 4. Verify package.json dependencies
    const pkg = JSON.parse(fileMap['package.json']);
    assert(pkg.dependencies.next, 'Must contain next dependency');
    assert(pkg.dependencies.react, 'Must contain react dependency');
    assert(pkg.dependencies['react-dom'], 'Must contain react-dom dependency');
    assert(pkg.dependencies['lucide-react'], 'Must contain lucide-react');
    assert(pkg.dependencies['clsx'], 'Must contain clsx');
    assert(pkg.dependencies['tailwind-merge'], 'Must contain tailwind-merge');
    assert(pkg.devDependencies.tailwindcss, 'Must contain tailwindcss dev dependency');

    // 5. Verify App Router Layout & Title
    assert(fileMap['app/layout.tsx'].includes('SaaSify Landing Page'), 'Layout metadata should contain title');
    assert(fileMap['tailwind.config.js'].includes('brand-primary'), 'Tailwind config should contain design tokens');
  });

  test('Next.js: Custom code injection with automatic client directive', () => {
    const customCode = `import React, { useState } from 'react';
export default function CustomPage() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`;
    const fileMap = generateNextjsProjectFileMap(customCode, { meta: { title: 'Counter' } });
    assert(fileMap['app/page.tsx'].startsWith('"use client";'), 'Should prepend "use client"; directive');
    assert(fileMap['app/page.tsx'].includes('CustomPage'), 'Should include custom page code');
  });

  test('Next.js: Create and unpack valid ZIP Archive Buffer', () => {
    const zipBuffer = createNextjsProjectZip('', {
      meta: { title: 'Zip-Test-App' },
    });

    assert(Buffer.isBuffer(zipBuffer), 'Output must be a Buffer');
    assert(zipBuffer.length > 1000, `ZIP buffer size should be substantial (${zipBuffer.length} bytes)`);

    // Verify ZIP archive integrity using AdmZip
    const unzipped = new AdmZip(zipBuffer);
    const entries = unzipped.getEntries().map((e) => e.entryName);

    const requiredEntries = [
      'package.json',
      'tsconfig.json',
      'next.config.mjs',
      'tailwind.config.js',
      'postcss.config.js',
      'app/layout.tsx',
      'app/page.tsx',
      'app/globals.css',
      'components/ui/button.tsx',
      'components/ui/card.tsx',
      'components/ui/badge.tsx',
      'lib/utils.ts',
      'README.md',
    ];

    for (const req of requiredEntries) {
      assert(entries.includes(req), `ZIP archive missing required entry: ${req}`);
    }

    const readmeContent = unzipped.readAsText('README.md');
    assert(readmeContent.includes('Zip-Test-App'), 'README should contain app title');
  });

  // -------------------------------------------------------------
  // SECTION 4: End-to-End Multi-Framework & Pipeline Verification
  // -------------------------------------------------------------
  console.log('\n🔄 Testing End-to-End 1-Click Deployment Pipeline...');

  await testAsync('E2E: Next.js 15 Generation -> GitHub Push -> Vercel Deployment', async () => {
    const telemetry = {
      meta: {
        title: 'Fintech Dashboard',
        description: 'Modern real-time banking analytics interface',
      },
      colors: [
        { color: '#0ea5e9', frequency: 15 },
        { color: '#6366f1', frequency: 10 },
      ],
    };

    // Step 1: Package project files
    const fileMap = generateNextjsProjectFileMap('', telemetry);
    assert(Object.keys(fileMap).length >= 14, 'Should generate at least 14 project files');

    // Step 2: Push to GitHub (Mock)
    const ghResult = await deployToGitHub({
      githubToken: 'mock_token',
      repoName: 'fintech-dashboard',
      fileMap,
      isPrivate: false,
      commitMessage: 'feat: Initial Next.js 15 App Router scaffold',
    });

    assert.strictEqual(ghResult.success, true);
    assert.strictEqual(ghResult.filesPushed, Object.keys(fileMap).length);
    assert(ghResult.repoUrl.includes('fintech-dashboard'));

    // Step 3: Deploy to Vercel (Mock)
    const vercelResult = await deployToVercel({
      vercelToken: 'mock_token',
      projectName: 'fintech-dashboard',
      filesMap: fileMap,
      framework: 'nextjs-shadcn',
      poll: true,
    });

    assert.strictEqual(vercelResult.success, true);
    assert.strictEqual(vercelResult.readyState, 'READY');
    assert(vercelResult.deploymentUrl.includes('vercel.app'));

    console.log(`     Mock GitHub: ${ghResult.repoUrl}`);
    console.log(`     Mock Vercel: ${vercelResult.deploymentUrl}`);
  });

  // -------------------------------------------------------------
  // SECTION 5: Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🎉 Test Run Complete: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}

if (require.main === module) {
  runDeployerTestSuite().catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
}

module.exports = {
  runDeployerTestSuite,
};
