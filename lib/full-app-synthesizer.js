/**
 * Next.js 15 Full-App Synthesizer
 * Generates multi-file Next.js 15 (App Router) + React 19 + Tailwind CSS + Lucide Icons projects
 * from single or multi-page telemetry.
 *
 * Generated Architecture:
 * - app/layout.tsx (Global fonts, theme provider, meta tags, viewport)
 * - app/page.tsx (Landing page with modular component composition)
 * - app/[subpage]/page.tsx (Dedicated sub-pages: pricing, features, about, contact)
 * - components/ (Navbar, Hero, Features, Pricing, Testimonials, FAQ, Footer, ThemeToggle)
 * - lib/mock-api.ts (Auto-generated typed mock API handlers with telemetry-aligned data)
 * - lib/utils.ts (cn utility helper with clsx + tailwind-merge)
 * - tailwind.config.ts (Extracted design tokens & palette)
 * - package.json, tsconfig.json, next.config.ts, README.md
 */

const AdmZip = require('adm-zip');

/**
 * Extracts and sanitizes clean app metadata from telemetry
 */
function extractAppMeta(telemetry = {}) {
  const meta = telemetry.meta || {};
  const rawTitle = meta.title || 'SitePrompter Synthesized App';
  const slug = rawTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'site-clone-app';
  const description = meta.description || 'Next-generation web application synthesized with SitePrompter AI.';
  const canonical = meta.canonical || 'https://example.com';
  const lang = meta.lang || 'en';

  const colors = (telemetry.colors || []).map((c) => (typeof c === 'string' ? c : c.color || '#3b82f6'));
  const primaryColor = colors[0] || '#3b82f6';
  const secondaryColor = colors[1] || '#0f172a';
  const accentColor = colors[2] || '#06b6d4';

  const fonts = telemetry.fonts?.families || ['Inter', 'system-ui', 'sans-serif'];
  const primaryFont = fonts[0] ? fonts[0].split(',')[0].replace(/['"]/g, '').trim() : 'Inter';

  return {
    title: rawTitle,
    slug,
    description,
    canonical,
    lang,
    primaryColor,
    secondaryColor,
    accentColor,
    primaryFont,
    colors,
  };
}

/**
 * Synthesizes package.json for Next.js 15 + React 19
 */
function synthesizePackageJson(appMeta) {
  const pkg = {
    name: appMeta.slug,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^15.1.7',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.475.0',
      clsx: '^2.1.1',
      'tailwind-merge': '^3.0.1',
      'class-variance-authority': '^0.7.1',
    },
    devDependencies: {
      typescript: '^5.7.3',
      '@types/node': '^22.13.4',
      '@types/react': '^19.0.8',
      '@types/react-dom': '^19.0.3',
      postcss: '^8.5.2',
      tailwindcss: '^3.4.17',
      autoprefixer: '^10.4.20',
      eslint: '^9.20.1',
      'eslint-config-next': '15.1.7',
    },
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Synthesizes tsconfig.json
 */
function synthesizeTsConfig() {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  return JSON.stringify(tsConfig, null, 2);
}

/**
 * Synthesizes next.config.ts
 */
function synthesizeNextConfig() {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
`;
}

/**
 * Synthesizes tailwind.config.ts
 */
function synthesizeTailwindConfig(appMeta) {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "${appMeta.primaryColor}",
          secondary: "${appMeta.secondaryColor}",
          accent: "${appMeta.accentColor}",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ["${appMeta.primaryFont}", "var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

/**
 * Synthesizes postcss.config.mjs
 */
function synthesizePostcssConfig() {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

/**
 * Synthesizes lib/utils.ts
 */
function synthesizeLibUtils() {
  return `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}

/**
 * Synthesizes lib/mock-api.ts (Typed Mock Handlers & Telemetry Data)
 */
function synthesizeMockApi(appMeta, telemetry = {}) {
  const images = (telemetry.images || []).slice(0, 6).map((img) => img.src || img);
  const fallbackImg = 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop';

  return `/**
 * Auto-Generated Mock API & Telemetry Data Store
 * Provides strongly typed asynchronous mock handlers simulating production backend services.
 */

export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  popular?: boolean;
  ctaText: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  iconName: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  quote: string;
  rating: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// In-Memory Telemetry Mock Store
const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 19,
    priceYearly: 15,
    description: "Essential telemetry synthesis for individual builders and solo founders.",
    features: [
      "Up to 25 Page Reconstructions / mo",
      "Tailwind & React 19 Export",
      "Standard Token Extraction",
      "Community Support Access",
    ],
    popular: false,
    ctaText: "Start Starter Trial",
  },
  {
    id: "pro",
    name: "Pro SaaS",
    priceMonthly: 49,
    priceYearly: 39,
    description: "Advanced multi-page synthesis, full Next.js 15 app generation & streaming.",
    features: [
      "Unlimited Page Telemetry Slicing",
      "Full Next.js 15 App Router Synthesizer",
      "Anthropic Claude 3.7 & GPT-4o BYOK",
      "Figma Tokens & Design System Sync",
      "Priority Web Scraping Queue",
      "Dedicated Slack Support",
    ],
    popular: true,
    ctaText: "Upgrade to Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 149,
    priceYearly: 119,
    description: "Custom headless crawlers, SSO, on-premise proxy nodes, and SLA guarantees.",
    features: [
      "Custom Multi-Node Puppeteer Cluster",
      "Air-gapped Offline Code Generator",
      "Full Design System Export (Tokens Studio)",
      "Dedicated Solutions Architect",
      "99.99% Uptime SLA",
    ],
    popular: false,
    ctaText: "Contact Enterprise",
  },
];

const FEATURES_DATA: FeatureItem[] = [
  {
    id: "feat-1",
    title: "Pixel-Perfect DOM Slicing",
    description: "Deconstruct complex production web apps into modular, reusable React 19 functional components.",
    badge: "Accuracy",
    iconName: "Layers",
  },
  {
    id: "feat-2",
    title: "Sub-Second AI Streaming",
    description: "Real-time token generation supporting Claude 3.7 Sonnet, OpenAI GPT-4o, DeepSeek, and Gemini.",
    badge: "Speed",
    iconName: "Zap",
  },
  {
    id: "feat-3",
    title: "Design System Extraction",
    description: "Automatically exports color palettes, typography scales, border radii, and Figma tokens.",
    badge: "Design",
    iconName: "Palette",
  },
  {
    id: "feat-4",
    title: "Full-App Multi-Route Synthesis",
    description: "Generates turnkey Next.js 15 App Router structures with pre-configured mock APIs.",
    badge: "Full-Stack",
    iconName: "FolderTree",
  },
  {
    id: "feat-5",
    title: "Zero Visual Drift",
    description: "Preserves computed CSS properties, responsive breakpoints, and keyframe animations.",
    badge: "Fidelity",
    iconName: "ShieldCheck",
  },
  {
    id: "feat-6",
    title: "Enterprise BYOK Security",
    description: "Bring your own API keys with client-side header encryption and zero server logging.",
    badge: "Security",
    iconName: "Lock",
  },
];

const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: "test-1",
    name: "Sarah Chen",
    role: "VP of Engineering",
    company: "Nexus Labs",
    avatarUrl: "${images[0] || fallbackImg}",
    quote: "SitePrompter cut our UI migration timeline from 3 months to 4 days. The generated Next.js 15 components were virtually production-ready on day one.",
    rating: 5,
  },
  {
    id: "test-2",
    name: "Alex Rivera",
    role: "Lead Product Designer",
    company: "HyperScale",
    avatarUrl: "${images[1] || fallbackImg}",
    quote: "The fidelity of extracted design tokens and Tailwind classes is extraordinary. It captures subtle spacing and micro-interactions effortlessly.",
    rating: 5,
  },
  {
    id: "test-3",
    name: "Marcus Vance",
    role: "Founding Engineer",
    company: "FlowState AI",
    avatarUrl: "${images[2] || fallbackImg}",
    quote: "The streaming engine and BYOK support made integration into our internal toolchain completely frictionless. Highly recommended.",
    rating: 5,
  },
];

const FAQ_DATA: FaqItem[] = [
  {
    id: "faq-1",
    question: "How accurate is the synthesized Next.js 15 code?",
    answer: "Our telemetry crawler analyzes computed CSS styles, DOM bounding boxes, and media query breakpoints to guarantee visual parity and semantic structure.",
    category: "General",
  },
  {
    id: "faq-2",
    question: "Can I use my own OpenAI, Anthropic, or DeepSeek API keys?",
    answer: "Yes! SitePrompter supports Bring-Your-Own-Key (BYOK) with client-side encryption and header-based credential routing.",
    category: "Security",
  },
  {
    id: "faq-3",
    question: "What frameworks are supported for export?",
    answer: "We support Next.js 15 App Router, React 19 + Tailwind CSS, Shadcn UI, Vanilla HTML5 + CSS3, Vue 3, and Svelte.",
    category: "Integrations",
  },
  {
    id: "faq-4",
    question: "Is there offline mode available?",
    answer: "Yes, our built-in Mock Simulator generates complete synthetic applications without requiring active API keys or internet connection.",
    category: "Usage",
  },
];

// Async Mock API Handlers (Simulating Network Latency)
export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return PRICING_PLANS;
}

export async function fetchFeatures(): Promise<FeatureItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return FEATURES_DATA;
}

export async function fetchTestimonials(): Promise<TestimonialItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return TESTIMONIALS_DATA;
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return FAQ_DATA;
}

export async function submitContactForm(payload: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!payload.email || !payload.message) {
    throw new Error("Email and message are required fields.");
  }
  return {
    success: true,
    message: \`Thank you, \${payload.name || "friend"}! Your message has been received.\`,
  };
}
`;
}

/**
 * Synthesizes app/globals.css
 */
function synthesizeGlobalsCss(appMeta) {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 6.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 6.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --radius: 0.75rem;
  }
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-feature-settings: "rlig" 1, "calt" 1;
}

/* Smooth custom scrollbars */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 1);
}
`;
}

/**
 * Synthesizes app/layout.tsx
 */
function synthesizeRootLayout(appMeta) {
  return `import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "${appMeta.title}",
  description: "${appMeta.description}",
  metadataBase: new URL("${appMeta.canonical}"),
  openGraph: {
    title: "${appMeta.title}",
    description: "${appMeta.description}",
    url: "${appMeta.canonical}",
    siteName: "${appMeta.title}",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "${appMeta.title}",
    description: "${appMeta.description}",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="${appMeta.lang}" className="dark scroll-smooth">
      <body className={\`\${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white\`}>
        {children}
      </body>
    </html>
  );
}
`;
}

/**
 * Synthesizes components/Navbar.tsx
 */
function synthesizeNavbar(appMeta) {
  return `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Menu, X, Globe, ChevronDown } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={\`fixed top-0 inset-x-0 z-50 transition-all duration-300 \${
        scrolled
          ? "bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }\`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
            ${appMeta.title}
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 group hover:shadow-blue-500/50"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900/50 border border-slate-800"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white text-base font-medium py-2"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white text-base font-medium py-2"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white text-base font-medium py-2"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white text-base font-medium py-2"
            >
              Contact
            </Link>
          </nav>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
`;
}

/**
 * Synthesizes components/Hero.tsx
 */
function synthesizeHero(appMeta) {
  return `import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Shield, Star, CheckCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="text-center space-y-8 max-w-4xl mx-auto">
        {/* Release Tag Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <Zap className="w-3.5 h-3.5" /> Next.js 15 + AI Telemetry Synthesizer
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
          Build High-Converting Web Apps{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
            From Web Telemetry
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ${appMeta.description} Powered by modular component slicing, instant token extraction, and reactive Next.js architecture.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/pricing"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-xl shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
          >
            Start Free Generation
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/features"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium transition-all duration-200"
          >
            Explore Feature Suite
          </Link>
        </div>

        {/* Social Proof */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5 text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400" />
            ))}
            <span className="text-slate-300 ml-1 font-semibold">4.9/5 Rating</span>
          </div>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1 text-slate-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> 10,000+ Components Synthesized
          </div>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1 text-slate-300">
            <Shield className="w-4 h-4 text-blue-400" /> Production-Grade Next.js 15
          </div>
        </div>
      </div>
    </section>
  );
}
`;
}

/**
 * Synthesizes components/Features.tsx
 */
function synthesizeFeatures() {
  return `import React from "react";
import { fetchFeatures, FeatureItem } from "@/lib/mock-api";
import { Layers, Zap, Palette, FolderTree, ShieldCheck, Lock, Sparkles } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  Layers: <Layers className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  FolderTree: <FolderTree className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Lock: <Lock className="w-6 h-6" />,
};

export async function Features() {
  const features = await fetchFeatures();

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
          Engineered for Production
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Everything You Need to Clone & Rebuild Web Apps
        </p>
        <p className="text-slate-400 text-base">
          Deconstruct web interfaces into modular, typed, and fully interactive components with zero manual boilerplate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feat: FeatureItem) => (
          <div
            key={feat.id}
            className="group relative p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  {ICON_MAP[feat.iconName] || <Sparkles className="w-6 h-6" />}
                </div>
                {feat.badge && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {feat.badge}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;
}

/**
 * Synthesizes components/Pricing.tsx
 */
function synthesizePricing() {
  return `"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Zap, Sparkles } from "lucide-react";

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      monthly: 19,
      yearly: 15,
      description: "Essential telemetry synthesis for individual developers.",
      features: [
        "25 Page Reconstructions / mo",
        "React 19 + Tailwind Export",
        "Standard Design Tokens",
        "Community Support",
      ],
      popular: false,
    },
    {
      id: "pro",
      name: "Pro SaaS",
      monthly: 49,
      yearly: 39,
      description: "Full Next.js 15 multi-page synthesis, AI streaming & BYOK.",
      features: [
        "Unlimited Page Telemetry Slicing",
        "Next.js 15 App Router Synthesizer",
        "Anthropic Claude 3.7 & GPT-4o BYOK",
        "Figma Tokens & Design System Sync",
        "Priority Scraping Queue",
        "Dedicated Support",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthly: 149,
      yearly: 119,
      description: "Custom cluster crawlers, SSO, on-prem nodes, and SLA guarantees.",
      features: [
        "Custom Headless Crawler Cluster",
        "Air-Gapped Offline Synthesis",
        "Tokens Studio Export",
        "Dedicated Solutions Architect",
        "99.99% Uptime SLA",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
          Transparent Pricing
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Choose the Perfect Plan for Your Team
        </p>
        <p className="text-slate-400 text-base">
          All plans include full source code access and unlimited framework exports.
        </p>

        {/* Billing Interval Toggle */}
        <div className="pt-6 flex items-center justify-center gap-3">
          <span className={\`text-sm font-medium \${!annual ? "text-white" : "text-slate-400"}\`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="w-14 h-8 rounded-full bg-slate-800 border border-slate-700 p-1 relative transition-colors focus:outline-none"
            aria-label="Toggle annual billing"
          >
            <div
              className={\`w-6 h-6 rounded-full bg-blue-500 transition-transform \${
                annual ? "translate-x-6" : "translate-x-0"
              }\`}
            />
          </button>
          <span className={\`text-sm font-medium flex items-center gap-1.5 \${annual ? "text-white" : "text-slate-400"}\`}>
            Yearly <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const price = annual ? plan.yearly : plan.monthly;
          return (
            <div
              key={plan.id}
              className={\`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 \${
                plan.popular
                  ? "bg-slate-900 border-2 border-blue-500 shadow-2xl shadow-blue-500/15 lg:-translate-y-2"
                  : "bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
              }\`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">\${price}</span>
                  <span className="text-slate-400 text-sm">/ month</span>
                </div>

                <div className="space-y-3.5 mb-8">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/contact"
                className={\`w-full py-3.5 rounded-full text-center text-sm font-semibold transition-all shadow-md \${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }\`}
              >
                {plan.popular ? "Get Started Pro" : "Get Started"}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
`;
}

/**
 * Synthesizes components/Testimonials.tsx
 */
function synthesizeTestimonials() {
  return `import React from "react";
import { fetchTestimonials, TestimonialItem } from "@/lib/mock-api";
import { Star, Quote } from "lucide-react";

export async function Testimonials() {
  const testimonials = await fetchTestimonials();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
          Trusted by Pioneers
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          What Engineering Leaders Say
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((item: TestimonialItem) => (
          <div
            key={item.id}
            className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 italic">
                "{item.quote}"
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-800/60">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                {item.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{item.name}</h4>
                <p className="text-xs text-slate-400">
                  {item.role} • {item.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;
}

/**
 * Synthesizes components/FAQ.tsx
 */
function synthesizeFaq() {
  return `"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "How accurate is the synthesized Next.js 15 code?",
    a: "Our telemetry crawler analyzes computed CSS styles, DOM bounding boxes, and media query breakpoints to guarantee visual parity and semantic structure.",
  },
  {
    q: "Can I use my own OpenAI, Anthropic, or DeepSeek API keys?",
    a: "Yes! SitePrompter supports Bring-Your-Own-Key (BYOK) with client-side encryption and header-based credential routing.",
  },
  {
    q: "What frameworks are supported for export?",
    a: "We support Next.js 15 App Router, React 19 + Tailwind CSS, Shadcn UI, Vanilla HTML5 + CSS3, Vue 3, and Svelte.",
  },
  {
    q: "Is there an offline mode available?",
    a: "Yes, our built-in Mock Simulator generates complete synthetic applications without requiring active API keys or internet connection.",
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">FAQ</h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Frequently Asked Questions
        </p>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/50 border border-slate-800/80 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left text-base font-semibold text-white hover:text-blue-400 transition-colors"
                aria-expanded={isOpen}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={\`w-5 h-5 text-slate-400 transition-transform duration-200 \${
                    isOpen ? "rotate-180 text-blue-400" : ""
                  }\`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
`;
}

/**
 * Synthesizes components/Footer.tsx
 */
function synthesizeFooter(appMeta) {
  return `import React from "react";
import Link from "next/link";
import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white">${appMeta.title}</span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            ${appMeta.description}
          </p>
          <div className="flex items-center gap-4 text-slate-400 pt-2">
            <a href="https://github.com" className="hover:text-white transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" className="hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" className="hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Product Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">Case Studies</Link></li>
          </ul>
        </div>

        {/* Resources Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/features" className="hover:text-white transition-colors">Documentation</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">API Reference</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Community</Link></li>
          </ul>
        </div>

        {/* Company Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-900 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ${appMeta.title}. All rights reserved. Synthesized with SitePrompter AI.
      </div>
    </footer>
  );
}
`;
}

/**
 * Synthesizes app/page.tsx (Home Page)
 */
function synthesizeHomePage(appMeta) {
  return `import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
`;
}

/**
 * Synthesizes subpage: app/pricing/page.tsx
 */
function synthesizePricingPage(appMeta) {
  return `import React from "react";
import { Navbar } from "@/components/Navbar";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Pricing Plans - ${appMeta.title}",
  description: "Flexible and transparent pricing plans for developers, startups, and enterprises.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pt-20">
      <Navbar />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
`;
}

/**
 * Synthesizes subpage: app/features/page.tsx
 */
function synthesizeFeaturesPage(appMeta) {
  return `import React from "react";
import { Navbar } from "@/components/Navbar";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Features & Architecture - ${appMeta.title}",
  description: "Comprehensive breakdown of the AI telemetry decomposition and synthesis pipeline.",
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pt-20">
      <Navbar />
      <div className="pt-16 pb-8 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Next-Gen Telemetry Architecture
        </h1>
        <p className="text-slate-400 text-lg">
          Explore the deep technical capabilities that power zero visual drift reconstructions.
        </p>
      </div>
      <Features />
      <div className="py-16 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xl shadow-blue-600/30 transition-all"
        >
          Get Started with Pro Features <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <Footer />
    </main>
  );
}
`;
}

/**
 * Synthesizes subpage: app/about/page.tsx
 */
function synthesizeAboutPage(appMeta) {
  return `import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Sparkles, Shield, Cpu, Users } from "lucide-react";

export const metadata = {
  title: "About Us - ${appMeta.title}",
  description: "Our mission to revolutionize web engineering with AI telemetry synthesis.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pt-20">
      <Navbar />
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Our Mission
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white">
            Engineering the Future of Frontend Synthesis
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            ${appMeta.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Deep Telemetry</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Extracting sub-pixel CSS layouts, responsive DOM hierarchies, and multi-tier tokens.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Clean Code Safety</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict TypeScript typing, accessible ARIA attributes, and 100% linter compliance.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Developer First</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drop-in components compatible with Next.js 15, Vite, Tailwind CSS, and Shadcn UI.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
`;
}

/**
 * Synthesizes subpage: app/contact/page.tsx
 */
function synthesizeContactPage(appMeta) {
  return `"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { submitContactForm } from "@/lib/mock-api";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [responseMsg, setResponseMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await submitContactForm(formData);
      setStatus("success");
      setResponseMsg(res.message);
      setFormData({ name: "", email: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setResponseMsg(err.message || "Failed to send message.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pt-20">
      <Navbar />
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Get in Touch</h1>
          <p className="text-slate-400">
            Have questions about custom telemetry pipelines or enterprise deployments? Send us a message.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info Side */}
          <div className="space-y-8">
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <h3 className="text-xl font-bold text-white">Contact Information</h3>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>support@siteprompter.io</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>+1 (800) 555-0199</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>San Francisco, CA • Worldwide Remote</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800">
            {status === "success" ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Message Delivered</h3>
                <p className="text-slate-400 text-sm">{responseMsg}</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="px-6 py-2.5 rounded-full bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Morgan"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your project requirements..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>

                {status === "error" && (
                  <p className="text-red-400 text-xs font-medium">{responseMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {status === "loading" ? "Submitting..." : <>Send Message <Send className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
`;
}

/**
 * Synthesizes README.md
 */
function synthesizeReadme(appMeta) {
  return `# ${appMeta.title}

Production Next.js 15 (App Router) project synthesized with **SitePrompter AI**.

## 🚀 Quick Start

1. **Install Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Run Local Development Server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Open Application:**
   Navigate to [http://localhost:3000](http://localhost:3000).

## 🛠️ Project Structure
\`\`\`
├── app/
│   ├── layout.tsx         # Root layout with fonts & metadata
│   ├── globals.css        # Tailwind CSS & design tokens
│   ├── page.tsx           # Landing page composition
│   ├── pricing/page.tsx   # Dedicated Pricing subpage
│   ├── features/page.tsx  # Detailed Features subpage
│   ├── about/page.tsx     # About & Mission subpage
│   └── contact/page.tsx   # Interactive Contact Form subpage
├── components/
│   ├── Navbar.tsx         # Sticky backdrop header & mobile drawer
│   ├── Hero.tsx           # Above-the-fold hero section
│   ├── Features.tsx       # 3-column responsive feature grid
│   ├── Pricing.tsx        # Interactive monthly/annual pricing matrix
│   ├── Testimonials.tsx   # Social proof quote cards
│   ├── FAQ.tsx            # Expandable accordion
│   └── Footer.tsx         # Multi-column footer directory
├── lib/
│   ├── mock-api.ts        # Typed mock API handlers & in-memory store
│   └── utils.ts           # ClassName helper (clsx + tailwind-merge)
├── tailwind.config.ts     # Extracted telemetry design tokens
├── next.config.ts         # Next.js 15 configuration
├── tsconfig.json          # Strict TypeScript configuration
└── package.json           # Next.js 15 & React 19 dependencies
\`\`\`

## 💎 Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS + CSS Variables
- **Icons**: Lucide React
- **Language**: Strict TypeScript
`;
}

/**
 * Master Synthesizer: Generates the entire multi-file Next.js 15 App Router virtual file tree
 *
 * @param {object} telemetry - Extracted telemetry data
 * @param {object} options - Custom options (e.g. subpages, customAppName)
 * @returns {Record<string, string>} - Map of filepath -> code string
 */
function synthesizeNextJsApp(telemetry = {}, options = {}) {
  const appMeta = extractAppMeta(telemetry);
  if (options.appName) {
    appMeta.slug = options.appName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  }

  const files = {
    'package.json': synthesizePackageJson(appMeta),
    'tsconfig.json': synthesizeTsConfig(),
    'next.config.ts': synthesizeNextConfig(),
    'tailwind.config.ts': synthesizeTailwindConfig(appMeta),
    'postcss.config.mjs': synthesizePostcssConfig(),
    'README.md': synthesizeReadme(appMeta),

    'app/globals.css': synthesizeGlobalsCss(appMeta),
    'app/layout.tsx': synthesizeRootLayout(appMeta),
    'app/page.tsx': synthesizeHomePage(appMeta),
    'app/pricing/page.tsx': synthesizePricingPage(appMeta),
    'app/features/page.tsx': synthesizeFeaturesPage(appMeta),
    'app/about/page.tsx': synthesizeAboutPage(appMeta),
    'app/contact/page.tsx': synthesizeContactPage(appMeta),

    'components/Navbar.tsx': synthesizeNavbar(appMeta),
    'components/Hero.tsx': synthesizeHero(appMeta),
    'components/Features.tsx': synthesizeFeatures(),
    'components/Pricing.tsx': synthesizePricing(),
    'components/Testimonials.tsx': synthesizeTestimonials(),
    'components/FAQ.tsx': synthesizeFaq(),
    'components/Footer.tsx': synthesizeFooter(appMeta),

    'lib/utils.ts': synthesizeLibUtils(),
    'lib/mock-api.ts': synthesizeMockApi(appMeta, telemetry),
  };

  return files;
}

/**
 * Packages the synthesized Next.js 15 application into a downloadable ZIP Buffer
 *
 * @param {object} telemetry - Extracted telemetry data
 * @param {object} options - Custom configuration options
 * @returns {Buffer} - AdmZip Buffer
 */
function createNextJsProjectZip(telemetry = {}, options = {}) {
  const zip = new AdmZip();
  const fileTree = synthesizeNextJsApp(telemetry, options);

  for (const [filePath, content] of Object.entries(fileTree)) {
    zip.addFile(filePath, Buffer.from(content, 'utf8'));
  }

  return zip.toBuffer();
}

module.exports = {
  extractAppMeta,
  synthesizeNextJsApp,
  createNextJsProjectZip,
  synthesizePackageJson,
  synthesizeTsConfig,
  synthesizeNextConfig,
  synthesizeTailwindConfig,
  synthesizeRootLayout,
  synthesizeHomePage,
  synthesizeNavbar,
  synthesizeHero,
  synthesizeFeatures,
  synthesizePricing,
  synthesizeTestimonials,
  synthesizeFaq,
  synthesizeFooter,
  synthesizeMockApi,
  synthesizeLibUtils,
};
