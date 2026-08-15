/**
 * SitePrompter Production - AI Streaming Engine & Multi-Model Code Generator
 *
 * Implements streaming LLM generators supporting:
 * - Anthropic Claude 3.7 Sonnet / Claude 3.5 Sonnet / Haiku
 * - OpenAI GPT-4o / GPT-4o-mini / o1 / o3-mini
 * - DeepSeek V3 (deepseek-chat) / DeepSeek R1 (deepseek-reasoner)
 * - Google Gemini 2.5 Pro / Flash / 2.0 Flash / 1.5 Pro
 * - Built-in High-Fidelity Mock Simulator (instant offline testing without live API keys)
 *
 * Server-Sent Events (SSE) Protocol:
 * - { type: 'status', message: '...', phase: '...' }
 * - { type: 'token', content: '...', chunk: '...' }
 * - { type: 'done', fullCode: '...', stats: { totalTokens, elapsedMs, provider, model } }
 * - { type: 'error', error: '...' }
 */

const { resolveApiKey, normalizeProvider, SUPPORTED_PROVIDERS, validateApiKey, maskApiKey } = require('./byok-manager');

/**
 * Default System Prompt for UI Code Synthesis
 */
const DEFAULT_SYSTEM_PROMPT = `You are an elite principal frontend engineer and UI design systems specialist.
Your task is to recreate or synthesize production-grade, pixel-perfect, accessible, and responsive user interfaces based on telemetry design tokens and specifications.
Adhere strictly to modern standards: clean functional component hierarchy, full TypeScript typing, accessible ARIA attributes, semantic HTML, and fluid animations.
Return ONLY valid, ready-to-run code without extraneous markdown conversation outside code blocks.`;

/**
 * Generates rich, realistic code templates based on telemetry, framework, and model
 */
function generateCodeArtifact(telemetry = {}, framework = 'react-tailwind', customInstructions = '', model = 'claude-3-7-sonnet') {
  const meta = telemetry.meta || {};
  const title = meta.title || 'SiteClone';
  const colors = telemetry.colors || [];
  const primaryColor = (typeof colors[0] === 'string' ? colors[0] : colors[0]?.color) || '#3b82f6';
  const secondaryColor = (typeof colors[1] === 'string' ? colors[1] : colors[1]?.color) || '#8b5cf6';
  const bgDark = (typeof colors[2] === 'string' ? colors[2] : colors[2]?.color) || '#0b0f19';
  const hasDarkMode = customInstructions.toLowerCase().includes('dark') || true;

  if (framework === 'vanilla-html' || framework === 'html') {
    return `<!DOCTYPE html>
<html lang="en" class="${hasDarkMode ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Synthesized by SitePrompter AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '${primaryColor}',
            brandSec: '${secondaryColor}',
          }
        }
      }
    }
  </script>
  <style>
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .animate-float { animation: float 4s ease-in-out infinite; }
  </style>
</head>
<body class="bg-[#0b0f19] text-[#f8fafc] font-sans antialiased min-h-screen flex flex-col selection:bg-brand selection:text-white">

  <!-- Header / Navigation -->
  <header class="sticky top-0 z-50 backdrop-blur-md bg-[#0b0f19]/80 border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand to-brandSec flex items-center justify-center font-black text-white shadow-lg shadow-brand/20">
          <i class="fa-solid fa-bolt"></i>
        </div>
        <span class="font-extrabold text-lg text-white tracking-tight">${title}</span>
      </div>

      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#features" class="hover:text-white transition-colors">Features</a>
        <a href="#solutions" class="hover:text-white transition-colors">Solutions</a>
        <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
        <a href="#testimonials" class="hover:text-white transition-colors">Testimonials</a>
      </nav>

      <div class="flex items-center gap-3">
        <button id="themeToggleBtn" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
          <i class="fa-solid fa-moon"></i>
        </button>
        <button class="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2">Sign In</button>
        <button class="px-4 py-2 text-sm font-bold text-black bg-brand hover:brightness-110 rounded-xl shadow-lg shadow-brand/25 transition-all">
          Get Started
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1">
    <section class="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-8 backdrop-blur-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Reconstructed via ${String(model).toUpperCase()} Engine</span>
      </div>

      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
        Next-Generation <span class="bg-gradient-to-r from-brand via-brandSec to-purple-400 bg-clip-text text-transparent">Digital Experience</span>
      </h1>

      <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-normal">
        Synthesized with pixel precision. All layout components, design tokens, and interactions reconstructed seamlessly.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button class="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold bg-brand text-black hover:scale-105 transition-all shadow-xl shadow-brand/20">
          Start Interactive Demo <i class="fa-solid fa-arrow-right ml-2"></i>
        </button>
        <button class="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold bg-slate-800/80 border border-slate-700 text-white hover:bg-slate-700 transition-all">
          <i class="fa-solid fa-play mr-2 text-xs"></i> Watch Overview
        </button>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/60">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl mb-6">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">DOM Hierarchy Slicing</h3>
          <p class="text-sm text-slate-400 leading-relaxed">Deconstructs complex page layouts into isolated, modular, and reusable sub-components.</p>
        </div>
        <div class="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl mb-6">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Sub-Second AI Streaming</h3>
          <p class="text-sm text-slate-400 leading-relaxed">Multi-provider real-time token streaming with Anthropic, OpenAI, DeepSeek & Gemini.</p>
        </div>
        <div class="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-6">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Strict TypeScript Typing</h3>
          <p class="text-sm text-slate-400 leading-relaxed">Zero any-types, strict props interfaces, and native Lucide React icon integration.</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
    <p>© ${new Date().getFullYear()} ${title}. Synthesized with SitePrompter AI.</p>
  </footer>
</body>
</html>`;
  }

  // React 19 + Tailwind CSS TSX Component
  return `import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap, Layers, Menu, X, Play, Globe } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function SynthesizedApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePricingTab, setActivePricingTab] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white font-sans antialiased flex flex-col">
      {/* ─── HEADER / NAVIGATION ─── */}
      <header className={\`fixed top-0 inset-x-0 z-50 transition-all duration-300 \${scrolled ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20' : 'bg-transparent'}\`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">${title}</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors">Sign In</button>
            <button className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 group">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-400 hover:text-white p-2" aria-label="Toggle Navigation">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex-1">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Zap className="w-3.5 h-3.5" /> Next-Gen AI Telemetry Synthesizer (${String(model).toUpperCase()})
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Pixel-Perfect UI Clones <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Synthesized in Seconds</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Reverse-engineer any web interface into clean, production-ready React 19, Next.js 15, and Tailwind CSS code with zero visual drift.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group">
            Synthesize New Project <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium transition-all">
            View Live Showcase
          </button>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Engineered for Production Precision</h2>
          <p className="text-3xl font-extrabold text-white">Every token maps directly to native framework primitives</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon={<Layers className="w-6 h-6" />} title="DOM Hierarchy Slicing" description="Deconstructs complex web layouts into clean, decoupled, and reusable sub-components." />
          <FeatureCard icon={<Zap className="w-6 h-6" />} title="Sub-second Streaming" description="Multi-provider real-time token streaming with Anthropic, OpenAI, DeepSeek & Gemini." />
          <FeatureCard icon={<ShieldCheck className="w-6 h-6" />} title="Strict TypeScript Typing" description="Zero any-types, strict props interfaces, and native Lucide React icon integration." />
        </div>
      </section>

      {/* ─── PRICING MATRIX ─── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Transparent Pricing</h2>
          <p className="text-3xl font-extrabold text-white">Choose the plan that fits your engineering workflow</p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={\`text-sm font-medium \${activePricingTab === 'monthly' ? 'text-white' : 'text-slate-400'}\`}>Monthly</span>
            <button onClick={() => setActivePricingTab(activePricingTab === 'monthly' ? 'yearly' : 'monthly')} className="w-14 h-8 rounded-full bg-slate-800 border border-slate-700 p-1 relative transition-colors">
              <div className={\`w-6 h-6 rounded-full bg-blue-500 transition-transform \${activePricingTab === 'yearly' ? 'translate-x-6' : 'translate-x-0'}\`} />
            </button>
            <span className={\`text-sm font-medium flex items-center gap-1.5 \${activePricingTab === 'yearly' ? 'text-white' : 'text-slate-400'}\`}>
              Yearly <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <p className="text-slate-400 text-sm mb-6">Essential telemetry synthesis for individual builders.</p>
              <div className="text-4xl font-extrabold text-white mb-6">{activePricingTab === 'monthly' ? '$19' : '$15'} <span className="text-sm font-normal text-slate-400">/ mo</span></div>
              <div className="space-y-3 text-sm text-slate-300 mb-8">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> 25 Page Reconstructions / mo</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> React 19 + Tailwind Export</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Standard Token Extraction</div>
              </div>
            </div>
            <button className="w-full py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all">Get Started</button>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border-2 border-blue-500 shadow-2xl shadow-blue-500/15 flex flex-col justify-between relative -translate-y-2">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">Most Popular</span>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Pro SaaS</h3>
              <p className="text-slate-400 text-sm mb-6">Full Next.js 15 multi-page synthesis, AI streaming & BYOK.</p>
              <div className="text-4xl font-extrabold text-white mb-6">{activePricingTab === 'monthly' ? '$49' : '$39'} <span className="text-sm font-normal text-slate-400">/ mo</span></div>
              <div className="space-y-3 text-sm text-slate-300 mb-8">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Unlimited Page Slicing</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Next.js 15 App Router Synthesizer</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Claude 3.7 & GPT-4o BYOK</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> 1-Click GitHub & Vercel Deploy</div>
              </div>
            </div>
            <button className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all">Start Pro Trial</button>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-slate-400 text-sm mb-6">Custom cluster crawlers, SSO, on-prem nodes, and SLA.</p>
              <div className="text-4xl font-extrabold text-white mb-6">{activePricingTab === 'monthly' ? '$149' : '$119'} <span className="text-sm font-normal text-slate-400">/ mo</span></div>
              <div className="space-y-3 text-sm text-slate-300 mb-8">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Custom Crawler Cluster</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Air-gapped Offline Synthesis</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Dedicated Solutions Architect</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> 99.99% Uptime SLA</div>
              </div>
            </div>
            <button className="w-full py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all">Contact Enterprise</button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} ${title}. Synthesized with SitePrompter AI.</p>
      </footer>
    </div>
  );
}`;
}

/**
 * Built-in Mock Simulator Stream Generator (Yields realistic token chunks)
 */
async function* streamMockSimulator(options = {}) {
  const {
    prompt = '',
    framework = 'react-tailwind',
    telemetry = {},
    customInstructions = '',
    model = 'mock-synth-engine',
    mockDelayMs = 0,
    signal,
  } = options;

  yield { type: 'status', message: 'Resolving AI model and validating credentials...', phase: 'init' };
  if (mockDelayMs > 0) await new Promise((r) => setTimeout(r, mockDelayMs));

  yield { type: 'status', message: 'Parsing telemetry tokens & component hierarchy...', phase: 'telemetry' };
  if (mockDelayMs > 0) await new Promise((r) => setTimeout(r, mockDelayMs));

  yield { type: 'status', message: 'Synthesizing UI components & responsive layouts...', phase: 'synthesis' };
  if (mockDelayMs > 0) await new Promise((r) => setTimeout(r, mockDelayMs));

  yield { type: 'status', message: 'Generating streaming code tokens...', phase: 'streaming' };

  const fullCode = generateCodeArtifact(telemetry, framework, customInstructions, model);

  // Split code into chunks of realistic token size (approx 20 chars per chunk)
  const chunkSize = 22;
  let sentTokens = 0;
  const startTime = Date.now();

  for (let i = 0; i < fullCode.length; i += chunkSize) {
    if (signal && signal.aborted) {
      throw new Error('Stream generation aborted by client.');
    }
    const chunk = fullCode.slice(i, i + chunkSize);
    sentTokens += Math.ceil(chunk.length / 4);

    yield {
      type: 'token',
      content: chunk,
      chunk,
      tokens: sentTokens,
    };

    if (mockDelayMs > 0) {
      await new Promise((r) => setTimeout(r, mockDelayMs));
    }
  }

  const elapsedMs = Math.max(1, Date.now() - startTime);

  yield {
    type: 'done',
    fullCode,
    stats: {
      totalTokens: sentTokens,
      elapsedMs,
      provider: 'mock',
      model: 'mock-synth-engine',
      speed: Math.round(sentTokens / (elapsedMs / 1000)) || 50,
    },
  };
}

/**
 * Anthropic Claude Streaming Generator
 */
async function* streamAnthropic(apiKey, model, prompt, systemPrompt, options = {}) {
  const { maxTokens = 8192, signal } = options;
  const effectiveModel = model || 'claude-3-7-sonnet-20250219';

  yield { type: 'status', message: `Connecting to Anthropic Claude (${effectiveModel})...`, phase: 'connect' };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: effectiveModel,
      max_tokens: maxTokens,
      system: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  yield { type: 'status', message: 'Streaming response from Claude...', phase: 'streaming' };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullCode = '';
  let tokenCount = 0;
  const startTime = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          const chunk = parsed.delta.text;
          fullCode += chunk;
          tokenCount += Math.ceil(chunk.length / 4);
          yield { type: 'token', content: chunk, chunk, tokens: tokenCount };
        }
      } catch (_) {}
    }
  }

  const elapsedMs = Math.max(1, Date.now() - startTime);

  yield {
    type: 'done',
    fullCode,
    stats: {
      totalTokens: tokenCount,
      elapsedMs,
      provider: 'anthropic',
      model: effectiveModel,
    },
  };
}

/**
 * OpenAI / DeepSeek Compatible Streaming Generator
 */
async function* streamOpenAICompatible(baseUrl, apiKey, model, prompt, systemPrompt, providerName, options = {}) {
  const { temperature = 0.2, maxTokens = 8192, signal } = options;
  const effectiveModel = model || (providerName === 'DeepSeek' ? 'deepseek-chat' : 'gpt-4o');

  yield { type: 'status', message: `Connecting to ${providerName} (${effectiveModel})...`, phase: 'connect' };

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: effectiveModel,
      messages: [
        { role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${providerName} API error (${response.status}): ${errText}`);
  }

  yield { type: 'status', message: `Streaming response from ${providerName}...`, phase: 'streaming' };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullCode = '';
  let tokenCount = 0;
  const startTime = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) {
          fullCode += delta.content;
          tokenCount += Math.ceil(delta.content.length / 4);
          yield { type: 'token', content: delta.content, chunk: delta.content, tokens: tokenCount };
        }
        if (delta?.reasoning_content) {
          yield { type: 'reasoning', content: delta.reasoning_content };
        }
      } catch (_) {}
    }
  }

  const elapsedMs = Math.max(1, Date.now() - startTime);

  yield {
    type: 'done',
    fullCode,
    stats: {
      totalTokens: tokenCount,
      elapsedMs,
      provider: providerName.toLowerCase(),
      model: effectiveModel,
    },
  };
}

/**
 * Google Gemini Streaming Generator
 */
async function* streamGoogleGemini(apiKey, model, prompt, systemPrompt, options = {}) {
  const { temperature = 0.2, maxTokens = 8192, signal } = options;
  const geminiModel = model || 'gemini-2.5-pro';
  yield { type: 'status', message: `Connecting to Google Gemini (${geminiModel})...`, phase: 'connect' };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}&alt=sse`;
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser Request:\n${prompt}` : prompt;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Gemini API error (${response.status}): ${errText}`);
  }

  yield { type: 'status', message: 'Streaming response from Gemini...', phase: 'streaming' };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullCode = '';
  let tokenCount = 0;
  const startTime = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);

      try {
        const parsed = JSON.parse(dataStr);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          fullCode += text;
          tokenCount += Math.ceil(text.length / 4);
          yield { type: 'token', content: text, chunk: text, tokens: tokenCount };
        }
      } catch (_) {}
    }
  }

  const elapsedMs = Math.max(1, Date.now() - startTime);

  yield {
    type: 'done',
    fullCode,
    stats: {
      totalTokens: tokenCount,
      elapsedMs,
      provider: 'google',
      model: geminiModel,
    },
  };
}

/**
 * Master Async Generator for Streaming Code Generation
 * Resolves credentials via BYOK Manager and dispatches to the corresponding LLM provider.
 *
 * @param {object} options
 * @returns {AsyncGenerator<{type: string, [key: string]: any}>}
 */
async function* streamGenerateAsync(options = {}) {
  const {
    prompt = '',
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    provider: rawProvider = 'mock',
    model: customModel,
    userKey,
    apiKey,
    headers,
    serverFallback = true,
    allowMockFallback = true,
    telemetry = {},
    framework = 'react-tailwind',
    customInstructions = '',
    mockDelayMs = 0,
    temperature = 0.2,
    maxTokens = 8192,
    signal,
  } = options;

  const keyToResolve = userKey || apiKey;

  // Resolve API Key and Provider Priority
  const resolution = resolveApiKey({
    provider: rawProvider,
    userKey: keyToResolve,
    headers,
    serverFallback,
    allowMockFallback,
    model: customModel,
  });

  const activeProvider = resolution.provider;
  const effectiveModel = resolution.model || customModel;

  if (resolution.fallbackReason) {
    yield { type: 'status', message: resolution.fallbackReason, phase: 'fallback' };
  }

  try {
    if (activeProvider === 'mock' || resolution.isMock) {
      yield* streamMockSimulator({
        prompt,
        framework,
        telemetry,
        customInstructions,
        model: effectiveModel,
        mockDelayMs,
        signal,
      });
      return;
    }

    if (activeProvider === 'anthropic') {
      yield* streamAnthropic(resolution.key, effectiveModel, prompt, systemPrompt, { maxTokens, signal });
    } else if (activeProvider === 'openai') {
      yield* streamOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        resolution.key,
        effectiveModel,
        prompt,
        systemPrompt,
        'OpenAI',
        { temperature, maxTokens, signal }
      );
    } else if (activeProvider === 'deepseek') {
      yield* streamOpenAICompatible(
        'https://api.deepseek.com/chat/completions',
        resolution.key,
        effectiveModel,
        prompt,
        systemPrompt,
        'DeepSeek',
        { temperature, maxTokens, signal }
      );
    } else if (activeProvider === 'google') {
      yield* streamGoogleGemini(resolution.key, effectiveModel, prompt, systemPrompt, { temperature, maxTokens, signal });
    } else {
      yield* streamMockSimulator({ prompt, framework, telemetry, customInstructions, model: effectiveModel, mockDelayMs, signal });
    }
  } catch (err) {
    if (allowMockFallback && activeProvider !== 'mock') {
      yield {
        type: 'status',
        message: `Provider ${activeProvider} returned error: ${err.message}. Switching to Offline Mock Simulator...`,
        phase: 'error_fallback',
      };
      yield* streamMockSimulator({ prompt, framework, telemetry, customInstructions, model: effectiveModel, mockDelayMs, signal });
    } else {
      yield { type: 'error', error: err.message };
      throw err;
    }
  }
}

/**
 * Callback-based streaming generator wrapper
 */
async function streamGenerate(options = {}) {
  const { onStatus, onToken, onDone, onError } = options;
  let fullCode = '';
  let lastStats = null;

  try {
    for await (const event of streamGenerateAsync(options)) {
      if (event.type === 'status' && typeof onStatus === 'function') {
        onStatus(event);
      } else if (event.type === 'token' && typeof onToken === 'function') {
        fullCode += (event.content || event.chunk || '');
        onToken(event);
      } else if (event.type === 'done') {
        lastStats = event.stats;
        fullCode = event.fullCode || fullCode;
        if (typeof onDone === 'function') onDone(event);
      } else if (event.type === 'error') {
        if (typeof onError === 'function') onError(event);
      }
    }
    return { fullCode, stats: lastStats };
  } catch (err) {
    if (typeof onError === 'function') onError({ type: 'error', error: err.message });
    throw err;
  }
}

/**
 * Express SSE Stream Request Handler (Used by server.js /api/ai/stream-generate)
 */
async function handleStreamGenerate(req, res, customOptions = {}) {
  // Deduct credits if projects-store is available
  try {
    const { deductCredits } = require('./projects-store');
    if (typeof deductCredits === 'function') {
      deductCredits(10);
    }
  } catch (_) {}

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  const abortController = new AbortController();
  req.on('close', () => {
    abortController.abort();
  });

  const sendSSE = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  const body = req.body || {};
  const options = {
    prompt: body.prompt || '',
    systemPrompt: body.systemPrompt,
    provider: body.provider || 'mock',
    model: body.model || 'claude-3-7-sonnet',
    userKey: body.apiKey || body.userKey,
    headers: req.headers,
    telemetry: body.telemetry,
    framework: body.framework || 'react-tailwind',
    customInstructions: body.customInstructions || '',
    temperature: body.temperature,
    maxTokens: body.maxTokens,
    mockDelayMs: body.mockDelayMs !== undefined ? body.mockDelayMs : 10,
    signal: abortController.signal,
    ...customOptions,
  };

  try {
    for await (const event of streamGenerateAsync(options)) {
      sendSSE(event);
    }
    res.end();
  } catch (err) {
    sendSSE({ type: 'error', error: err.message });
    res.end();
  }
}

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  generateCodeArtifact,
  getMockGeneratedCode: generateCodeArtifact,
  streamGenerateAsync,
  streamGenerate,
  handleStreamGenerate,
  handleSSEStreamingRequest: handleStreamGenerate,
  streamMockSimulator,
  streamAnthropic,
  streamOpenAICompatible,
  streamGoogleGemini,
};
