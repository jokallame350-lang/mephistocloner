/**
 * SitePrompter Prompt Compiler Test Suite
 * Validates prompt generation across 5 frameworks, 3 detail levels, 3 asset modes, and token estimation.
 */

const assert = require('assert');
const {
  compilePrompt,
  estimateTokens,
  getTokenMetrics,
  formatMarkdown,
  getAvailableFrameworks,
  getFrameworkMetadata,
  FRAMEWORKS,
  DETAIL_LEVELS,
  ASSET_MODES,
} = require('../lib/prompt-compiler');

// Sample telemetry fixture representing a modern SaaS landing page
const sampleTelemetry = {
  meta: {
    title: 'Acme AI - Cloud Intelligence Platform',
    description: 'Autonomous AI agents for enterprise workflow optimization.',
    keywords: 'ai, agents, workflows, automation, enterprise, cloud',
    ogTitle: 'Acme AI | Autonomous Cloud Workflows',
    ogDescription: 'Deploy autonomous agents in minutes.',
    ogImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
    twitterCard: 'summary_large_image',
    canonical: 'https://acme-ai.example.com',
    lang: 'en',
    themeColor: '#0f172a',
    viewport: 'width=device-width, initial-scale=1.0',
  },
  framework: 'React, Next.js, Tailwind CSS, Radix UI',
  cssVariables: {
    '--primary': '#3b82f6',
    '--primary-hover': '#2563eb',
    '--background': '#0f172a',
    '--card-bg': '#1e293b',
    '--text-main': '#f8fafc',
    '--text-muted': '#94a3b8',
    '--border-color': '#334155',
    '--radius-sm': '4px',
    '--radius-md': '8px',
    '--radius-lg': '16px',
    '--shadow-card': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    '--font-sans': 'Inter, system-ui, sans-serif',
    '--font-mono': 'JetBrains Mono, monospace',
    '--accent-cyan': '#06b6d4',
    '--accent-purple': '#8b5cf6',
    '--accent-emerald': '#10b981',
  },
  colors: [
    { color: '#0f172a', frequency: 120, role: 'background' },
    { color: '#1e293b', frequency: 95, role: 'surface' },
    { color: '#3b82f6', frequency: 80, role: 'primary' },
    { color: '#f8fafc', frequency: 75, role: 'text' },
    { color: '#94a3b8', frequency: 65, role: 'text-muted' },
    { color: '#334155', frequency: 50, role: 'border' },
    { color: '#06b6d4', frequency: 35, role: 'accent' },
    { color: '#8b5cf6', frequency: 30, role: 'accent' },
    { color: '#10b981', frequency: 25, role: 'success' },
    { color: '#ef4444', frequency: 18, role: 'error' },
    { color: '#f59e0b', frequency: 15, role: 'warning' },
    { color: '#6366f1', frequency: 12, role: 'indigo' },
    { color: '#ec4899', frequency: 10, role: 'pink' },
    { color: '#14b8a6', frequency: 9, role: 'teal' },
    { color: '#64748b', frequency: 8, role: 'slate-500' },
    { color: '#475569', frequency: 7, role: 'slate-600' },
    { color: '#1e1b4b', frequency: 6, role: 'dark-purple' },
    { color: '#0284c7', frequency: 5, role: 'sky-600' },
    { color: '#e0e7ff', frequency: 4, role: 'indigo-100' },
    { color: '#ede9fe', frequency: 3, role: 'purple-100' },
    { color: '#f1f5f9', frequency: 2, role: 'slate-100' },
    { color: '#ffffff', frequency: 2, role: 'white' },
  ],
  fonts: {
    families: ['Inter', 'JetBrains Mono', 'Plus Jakarta Sans', 'system-ui'],
    sizes: ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '64px', '72px'],
    weights: ['400', '500', '600', '700', '800'],
    links: [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap',
    ],
    fontFaces: `@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
}`,
  },
  shadows: [
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
    '0 0 50px -12px rgba(59, 130, 246, 0.35)',
  ],
  borderRadius: ['4px', '8px', '12px', '16px', '24px', '9999px'],
  images: {
    imgs: [
      { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', alt: 'Analytics Dashboard', width: 1200, height: 750, role: 'hero-screenshot' },
      { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', alt: 'Sarah Chen - VP of AI', width: 200, height: 200, role: 'avatar' },
      { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', alt: 'Alex Rivera - CTO', width: 200, height: 200, role: 'avatar' },
      { src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', alt: 'Elena Rostova - Lead Architect', width: 200, height: 200, role: 'avatar' },
      { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600', alt: 'Workflow Builder', width: 600, height: 400, role: 'feature-preview' },
      { src: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600', alt: 'Real-time Telemetry', width: 600, height: 400, role: 'feature-preview' },
    ],
    bgImages: [
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920',
      'radial-gradient(ellipse at top, rgba(59,130,246,0.15), transparent 70%)',
    ],
    svgSamples: [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    ],
    svgCount: 28,
    iconLinks: ['https://acme-ai.example.com/favicon.ico', 'https://acme-ai.example.com/icon.svg'],
  },
  layout: {
    viewportWidth: 1440,
    viewportHeight: 900,
    totalHeight: 4800,
    sections: ['header', 'section#hero', 'section#logos', 'section#features', 'section#metrics', 'section#pricing', 'section#testimonials', 'section#faq', 'section#cta', 'footer'],
    grids: [
      { el: '.features-grid', cols: 'repeat(3, minmax(0, 1fr))', rows: 'auto', gap: '24px' },
      { el: '.pricing-grid', cols: 'repeat(3, minmax(0, 1fr))', rows: 'auto', gap: '32px' },
      { el: '.stats-grid', cols: 'repeat(4, minmax(0, 1fr))', rows: 'auto', gap: '24px' },
      { el: '.footer-links-grid', cols: 'repeat(5, minmax(0, 1fr))', rows: 'auto', gap: '32px' },
    ],
    flexboxes: [
      { el: '.nav-container', direction: 'row', wrap: 'nowrap', justify: 'space-between', align: 'center' },
      { el: '.hero-content', direction: 'column', wrap: 'nowrap', justify: 'center', align: 'center' },
      { el: '.button-group', direction: 'row', wrap: 'wrap', justify: 'center', align: 'center' },
      { el: '.testimonial-card', direction: 'column', wrap: 'nowrap', justify: 'space-between', align: 'flex-start' },
    ],
  },
  animations: {
    animations: ['pulse-glow 3s infinite ease-in-out', 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', 'marquee 25s linear infinite'],
    transitions: ['all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 'transform 0.3s ease', 'opacity 0.25s ease-in-out'],
    keyframes: `@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}`,
  },
  domStructure: `<header class="sticky top-0 z-50 backdrop-blur border-b border-slate-800">
  <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
    <div class="logo font-bold text-xl text-white">Acme AI</div>
    <nav class="hidden md:flex gap-8 text-slate-300">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#testimonials">Testimonials</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="flex items-center gap-4">
      <button class="px-4 py-2 text-sm text-slate-300">Log In</button>
      <button class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Get Started</button>
      <button class="md:hidden mobile-menu-btn">Menu</button>
    </div>
  </div>
</header>
<main>
  <section class="hero py-24 text-center">
    <h1 class="text-6xl font-extrabold text-white tracking-tight">Autonomous AI for the Cloud</h1>
    <p class="text-xl text-slate-400 mt-6 max-w-2xl mx-auto">Build, deploy, and monitor self-healing agent pipelines.</p>
  </section>
</main>`,
  fullCSS: `:root {
  --primary: #3b82f6;
  --bg: #0f172a;
}
body {
  margin: 0;
  background-color: var(--bg);
  color: #f8fafc;
  font-family: Inter, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
}`,
  components: [
    'Header / Navigation Bar (Sticky with blur, logo, nav links, CTA button, mobile drawer toggle)',
    'Hero Section (gradient glow, bold headline, subheadline, dual CTA buttons, live preview container)',
    'Social Proof / Logo Cloud (infinite marquee of enterprise client logos)',
    'Feature Grid (3-column layout with icon badges, headings, descriptive copy, and subtle borders)',
    'Interactive Workflow Visualizer (step-by-step pipeline node builder)',
    'Stats & Metrics Section (4-column animated counter layout with labels)',
    'Pricing Matrix (Monthly/Annual billing toggle switch, 3 tier cards, feature checklists, highlighted popular tier)',
    'Testimonials Carousel (Customer quotes, star ratings, author avatars, previous/next controls, dot pagination)',
    'FAQ Accordion (Expandable question panels with smooth height transitions and rotating chevrons)',
    'Call to Action (CTA) Banner (High-contrast card with gradient background and newsletter email form)',
    'Footer (5-column site links, newsletter input, social icons, copyright, status indicator)',
    'Modal Dialog (Lead capture / demo request modal with backdrop and Escape listener)',
    'Mobile Navigation Drawer (Slide-out menu with backdrop overlay and animated links)',
    'Notification Toast Banner',
    'Dropdown Menu (Resources sub-menu with animated popover)',
    'Search Bar with Auto-suggest modal',
    'Theme Switcher Toggle',
    'Breadcrumbs Bar',
    'Video Player Modal',
    'Cookie Consent Banner',
    'Badge Pills & Status Chips',
    'Back-to-top Floating Action Button',
  ],
  typography: {
    h1: { fontFamily: 'Inter', fontSize: '60px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.03em', color: '#ffffff' },
    h2: { fontFamily: 'Inter', fontSize: '36px', fontWeight: '700', lineHeight: '1.2', letterSpacing: '-0.02em', color: '#ffffff' },
    h3: { fontFamily: 'Inter', fontSize: '24px', fontWeight: '600', lineHeight: '1.3', letterSpacing: '-0.01em', color: '#ffffff' },
    p: { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.6', letterSpacing: 'normal', color: '#94a3b8' },
    button: { fontFamily: 'Inter', fontSize: '14px', fontWeight: '600', lineHeight: '1', letterSpacing: 'normal', color: '#ffffff' },
  },
  spacing: [
    { el: 'header', padding: '16px 24px', margin: '0', gap: '0', maxWidth: '1280px' },
    { el: 'section.hero', padding: '96px 24px', margin: '0 auto', gap: '24px', maxWidth: '1280px' },
    { el: '.features-grid', padding: '64px 24px', margin: '0 auto', gap: '32px', maxWidth: '1280px' },
    { el: 'footer', padding: '64px 24px 32px', margin: '0 auto', gap: '48px', maxWidth: '1280px' },
  ],
  external: {
    scripts: ['https://cdn.example.com/lucide.min.js'],
    styles: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'],
  },
  interactions: [
    'Mobile Navigation Drawer (toggle on hamburger click, close on overlay or link click)',
    'FAQ Accordion (expand/collapse individual question items with animated height)',
    'Pricing Billing Switcher (toggle between Monthly and Annual pricing with 20% discount badge)',
    'Testimonials Slider (previous/next slide navigation with autoplay and pause on hover)',
    'Demo Request Modal (open on CTA button click, close on backdrop click or ESC key)',
    'Sticky Navbar Blur (transition background opacity and shadow upon scrolling down 20px)',
  ],
  responsive: [
    '(max-width: 1280px)',
    '(max-width: 1024px)',
    '(max-width: 768px)',
    '(max-width: 640px)',
    '(max-width: 375px)',
  ],
  accessibilityHints: [
    'ARIA expanded attributes on mobile menu and FAQ accordion items',
    'Semantic landmark tags (<header>, <main>, <nav>, <section>, <footer>)',
    'Keyboard navigable interactive elements with visible focus rings',
    'Descriptive alt text for all image assets',
  ],
};

// Test Execution
let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    console.error(err.stack);
  }
}

console.log('\n========================================');
console.log('  SitePrompter Compiler Test Suite');
console.log('========================================\n');

// 1. Helper exports
runTest('Token Estimator correctly calculates tokens (~4 chars per token)', () => {
  assert.strictEqual(estimateTokens(''), 0);
  assert.strictEqual(estimateTokens(null), 0);
  assert.strictEqual(estimateTokens('1234'), 1);
  assert.strictEqual(estimateTokens('12345678'), 2);
  assert.strictEqual(estimateTokens('a'.repeat(400)), 100);

  const metrics = getTokenMetrics('Hello world this is a test with 8 words');
  assert.strictEqual(metrics.wordCount, 9);
  assert.strictEqual(metrics.tokenEstimate, Math.ceil(metrics.charCount / 4));
});

runTest('formatMarkdown cleans whitespace, linebreaks, and code fences', () => {
  const dirty = 'Line 1  \r\n\r\n\r\n\r\nLine 2   \r\nLine 3';
  const clean = formatMarkdown(dirty);
  assert.ok(!clean.includes('\r'));
  assert.ok(!clean.includes('\n\n\n'));
  assert.ok(clean.endsWith('\n'));
});

runTest('getAvailableFrameworks returns 5 supported frameworks', () => {
  const frameworks = getAvailableFrameworks();
  assert.strictEqual(frameworks.length, 5);
  const ids = frameworks.map(f => f.id);
  assert.ok(ids.includes('vanilla-html'));
  assert.ok(ids.includes('react-tailwind'));
  assert.ok(ids.includes('nextjs-shadcn'));
  assert.ok(ids.includes('vue3-tailwind'));
  assert.ok(ids.includes('svelte'));
});

// 2. Framework Specific Directives
runTest('Framework vanilla-html generates single-file HTML directives and <!DOCTYPE html>', () => {
  const prompt = compilePrompt(sampleTelemetry, { framework: 'vanilla-html' });
  assert.ok(typeof prompt === 'string');
  assert.ok(prompt.includes('Vanilla HTML5 + CSS3 + JS'));
  assert.ok(prompt.includes('<!DOCTYPE html>'));
  assert.ok(prompt.includes('All CSS goes in <style>') || prompt.includes('<style>'));
  assert.ok(prompt.includes('all JavaScript goes in <script>') || prompt.includes('<script>'));
  assert.ok(prompt.includes('Zero external files'));
});

runTest('Framework react-tailwind generates React 19, TypeScript, Lucide, and Tailwind directives', () => {
  const prompt = compilePrompt(sampleTelemetry, { framework: 'react-tailwind' });
  assert.ok(prompt.includes('React 19 + Tailwind CSS + Lucide Icons'));
  assert.ok(prompt.includes('lucide-react'));
  assert.ok(prompt.includes('useState, useEffect'));
  assert.ok(prompt.includes('Tailwind CSS utility classes'));
  assert.ok(prompt.includes('```tsx'));
});

runTest('Framework nextjs-shadcn generates Next.js 15 App Router and Shadcn UI directives', () => {
  const prompt = compilePrompt(sampleTelemetry, { framework: 'nextjs-shadcn' });
  assert.ok(prompt.includes('Next.js 15 (App Router) + Shadcn UI + Tailwind CSS'));
  assert.ok(prompt.includes('use client'));
  assert.ok(prompt.includes('Shadcn UI & Radix UI Patterns'));
  assert.ok(prompt.includes('next/image'));
  assert.ok(prompt.includes('metadata: Metadata'));
});

runTest('Framework vue3-tailwind generates Vue 3 Single File Component and Composition API directives', () => {
  const prompt = compilePrompt(sampleTelemetry, { framework: 'vue3-tailwind' });
  assert.ok(prompt.includes('Vue 3 (Composition API) + Tailwind CSS'));
  assert.ok(prompt.includes('<script setup lang="ts">'));
  assert.ok(prompt.includes('Composition API'));
  assert.ok(prompt.includes('<Transition'));
  assert.ok(prompt.includes('```vue'));
});

runTest('Framework svelte generates Svelte 5 with modern Runes directives', () => {
  const prompt = compilePrompt(sampleTelemetry, { framework: 'svelte' });
  assert.ok(prompt.includes('Svelte 5 (Runes) + Tailwind CSS'));
  assert.ok(prompt.includes('$state'));
  assert.ok(prompt.includes('$derived'));
  assert.ok(prompt.includes('$effect'));
  assert.ok(prompt.includes('```svelte'));
});

// 3. Detail Levels Validation
runTest('Detail Level "compact" produces focused summary with top 10 colors and pruned tree', () => {
  const prompt = compilePrompt(sampleTelemetry, { detailLevel: 'compact' });
  const tokens = estimateTokens(prompt);
  assert.ok(prompt.includes('DETAIL LEVEL: COMPACT'));
  assert.ok(tokens > 800, `Token count ${tokens} should be > 800`);
  // Check that full CSS is omitted/compacted
  assert.ok(prompt.includes('Extracted CSS omitted in compact mode') || !prompt.includes('.btn-primary:hover'));
});

runTest('Detail Level "balanced" includes comprehensive tokens, 20+ components, and interaction list', () => {
  const prompt = compilePrompt(sampleTelemetry, { detailLevel: 'balanced' });
  const tokens = estimateTokens(prompt);
  assert.ok(prompt.includes('DETAIL LEVEL: BALANCED'));
  assert.ok(tokens > 1200, `Token count ${tokens} should be > 1200`);
  assert.ok(prompt.includes('Pricing Matrix'));
  assert.ok(prompt.includes('Mobile Navigation Drawer'));
});

runTest('Detail Level "exhaustive" produces full pixel-perfect brief with full CSS and details', () => {
  // Add rich raw CSS to test full expansion
  const richTelemetry = {
    ...sampleTelemetry,
    fullCSS: sampleTelemetry.fullCSS + '\n' + '.card { background: var(--card-bg); border-radius: 12px; }'.repeat(50),
  };
  const prompt = compilePrompt(richTelemetry, { detailLevel: 'exhaustive' });
  const tokens = estimateTokens(prompt);
  assert.ok(prompt.includes('DETAIL LEVEL: EXHAUSTIVE'));
  assert.ok(prompt.includes('card { background: var(--card-bg)'));
  assert.ok(tokens > 1500, `Token count ${tokens} should be extensive`);
});

// 4. Asset Modes Validation
runTest('Asset Mode "original-urls" retains original image URLs', () => {
  const prompt = compilePrompt(sampleTelemetry, { assetMode: 'original-urls' });
  assert.ok(prompt.includes('https://images.unsplash.com/photo-1551288049-bebda4e38f71'));
  assert.ok(prompt.includes('Use the EXACT original asset URLs'));
});

runTest('Asset Mode "placeholders" converts images to placehold.co format', () => {
  const prompt = compilePrompt(sampleTelemetry, { assetMode: 'placeholders' });
  assert.ok(prompt.includes('https://placehold.co/'));
  assert.ok(prompt.includes('Use clean, responsive placeholder image URLs'));
});

runTest('Asset Mode "svg-inline" instructs inline SVG icon replacement', () => {
  const prompt = compilePrompt(sampleTelemetry, { assetMode: 'svg-inline' });
  assert.ok(prompt.includes('[INLINE_SVG_OR_ICON:'));
  assert.ok(prompt.includes('Replace all icons, badges, and graphical visual assets with clean inline SVG markup'));
});

// 5. Robustness & Fallback Handling
runTest('Handles empty or undefined telemetry gracefully without crashing', () => {
  const emptyPrompt = compilePrompt({});
  assert.ok(typeof emptyPrompt === 'string');
  assert.ok(emptyPrompt.length > 500);
  assert.ok(emptyPrompt.includes('Vanilla HTML5 + CSS3 + JS'));

  const nullPrompt = compilePrompt(null, { framework: 'react-tailwind', detailLevel: 'compact' });
  assert.ok(typeof nullPrompt === 'string');
  assert.ok(nullPrompt.includes('React 19 + Tailwind CSS'));
});

runTest('Handles object DOM trees correctly via formatDomTree', () => {
  const treeTelemetry = {
    domStructure: {
      tag: 'div',
      className: 'container',
      children: [
        {
          tag: 'header',
          id: 'top-nav',
          children: [
            { tag: 'h1', text: 'Welcome to Acme' },
            { tag: 'button', text: 'Sign In' },
          ],
        },
      ],
    },
  };
  const prompt = compilePrompt(treeTelemetry, { framework: 'svelte' });
  assert.ok(prompt.includes('<div.container>'));
  assert.ok(prompt.includes('<header#top-nav>'));
  assert.ok(prompt.includes('<h1'));
});

// 6. Matrix Test: All 5 Frameworks x 3 Detail Levels x 3 Asset Modes (45 combinations)
runTest('All 45 Framework x DetailLevel x AssetMode combinations compile valid prompts with token metrics', () => {
  const frameworks = ['vanilla-html', 'react-tailwind', 'nextjs-shadcn', 'vue3-tailwind', 'svelte'];
  const detailLevels = ['compact', 'balanced', 'exhaustive'];
  const assetModes = ['original-urls', 'placeholders', 'svg-inline'];

  let count = 0;
  for (const fw of frameworks) {
    for (const dl of detailLevels) {
      for (const am of assetModes) {
        const prompt = compilePrompt(sampleTelemetry, {
          framework: fw,
          detailLevel: dl,
          assetMode: am,
        });

        assert.ok(typeof prompt === 'string', `Failed string check for ${fw}/${dl}/${am}`);
        assert.ok(prompt.length > 500, `Length too short for ${fw}/${dl}/${am}`);
        
        const tokens = estimateTokens(prompt);
        assert.ok(tokens > 100, `Token estimation too low for ${fw}/${dl}/${am}`);

        const metrics = getTokenMetrics(prompt);
        assert.strictEqual(metrics.tokenEstimate, tokens);
        assert.ok(metrics.wordCount > 50);
        assert.ok(metrics.lineCount > 20);

        count++;
      }
    }
  }
  assert.strictEqual(count, 45);
});

console.log('\n----------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
console.log('----------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! ✨\n');
}

