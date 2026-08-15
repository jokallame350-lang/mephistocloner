/**
 * SitePrompter Framework Templates & Directives
 * Supports: vanilla-html, react-tailwind, nextjs-shadcn, vue3-tailwind, svelte
 */

const FRAMEWORKS = {
  'vanilla-html': {
    id: 'vanilla-html',
    name: 'Vanilla HTML5 + CSS3 + JS',
    stack: 'HTML5, Pure CSS (:root variables, Grid, Flexbox), Vanilla JavaScript (ES6+)',
    fileExtension: 'html',
    persona:
      'You are an elite frontend engineer and UI pixel-perfectionist. Recreate the website described below as a single, self-contained HTML file. All CSS goes in <style>, all JavaScript goes in <script>. Zero external files. Zero build steps. The output must be indistinguishable from the original when rendered in modern browsers.',
    frameworkDirectives: [
      'Single self-contained HTML file (all-in-one). Zero external asset dependencies except specified Google Fonts if needed.',
      'All CSS must be embedded inside a `<style>` block within `<head>`. Organize CSS logically with CSS variables (:root), resets, typography, layout, components, responsive media queries, and keyframe animations.',
      'All JavaScript must be embedded inside a `<script>` block placed immediately before the closing `</body>` tag.',
      'Do NOT use CDN links for Tailwind, Bootstrap, or jQuery. Re-implement styling and behaviors natively.',
      'Implement all interactive features using modern native DOM APIs (document.querySelectorAll, classList.toggle, addEventListener, IntersectionObserver for scroll reveals, requestAnimationFrame).',
      'Ensure full responsiveness across desktop (1440px), laptop (1024px), tablet (768px), and mobile (375px) viewports with clean CSS media queries.',
      'Replicate exact pixel-level measurements: colors, border-radii, box-shadows, font weights, line heights, letter spacings, margins, paddings, and flex/grid gaps.',
      'Include accessible HTML semantics: <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>, proper aria-expanded, aria-label, and role attributes.',
    ],
    outputRequirements: [
      'Output ONLY a single complete, valid HTML file starting with `<!DOCTYPE html>` and ending with `</html>`.',
      'No preliminary explanation, no post-script summary, and no markdown wrapper outside the code block.',
      'Ensure all CSS variables defined in :root are used consistently across components.',
      'Ensure all interactive components (mobile menu drawer, modals, dropdowns, tabs, accordions, carousels, sticky nav) are fully functional with vanilla JS event listeners.',
      'Preserve the original language attribute (lang="...") and meta tags (charset, viewport, title, description).',
      'Pixel-perfect fidelity: reproduce every layout section, typography hierarchy, button hover state, and transition.',
    ],
    codeSampleHint: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Clone</title>
  <style>
    :root { /* extracted tokens */ }
    /* layout & components */
    @media (max-width: 768px) { /* responsive */ }
  </style>
</head>
<body>
  <!-- Semantic DOM Hierarchy -->
  <script>
    // Native interactivity (drawer, modal, dropdowns, accordions)
  </script>
</body>
</html>`,
  },

  'react-tailwind': {
    id: 'react-tailwind',
    name: 'React 19 + Tailwind CSS + Lucide Icons',
    stack: 'React 19 / Vite, TypeScript / JSX, Tailwind CSS (v3/v4), Lucide React',
    fileExtension: 'tsx',
    persona:
      'You are a senior React & Tailwind CSS engineer and UI perfectionist. Recreate the website described below as a production-grade React 19 / Vite functional component with TypeScript and Tailwind CSS classes.',
    frameworkDirectives: [
      'Modern React 19 functional component architecture with TypeScript interfaces for all props and state items.',
      'Styling strictly via Tailwind CSS utility classes (layout, flexbox, grid, typography, colors, shadows, rounded corners, transitions, hover/focus/active states).',
      'Icons: Use `lucide-react` icons (e.g. Menu, X, ChevronDown, ChevronRight, ArrowRight, Search, Star, Check, Shield, Globe, ExternalLink, etc.) to replace all vector icons.',
      'Interactive State Management: Use React hooks (useState, useEffect, useRef, useCallback) for all dynamic behaviors:',
      '  • Mobile navigation menu drawer with backdrop overlay & toggle state',
      '  • Dropdowns and popovers with click-outside detection',
      '  • Modal dialogs / lightboxes with Escape key handler and body scroll lock',
      '  • Accordions / collapsibles with smooth animated height expansion',
      '  • Carousels / sliders with active slide state, next/prev navigation, and auto-play interval with pause on hover',
      '  • Tab switchers and search/filter inputs with instantaneous reactive state',
      '  • Sticky header on scroll with subtle shadow transition',
      'Break large pages down into clean, modular sub-components within the file (e.g., Navbar, HeroSection, FeaturesGrid, TestimonialsSlider, PricingCards, FAQAccordion, Footer) or export a unified App component.',
      'Ensure full responsive design using Tailwind responsive modifiers (sm:, md:, lg:, xl:, 2xl:).',
    ],
    outputRequirements: [
      'Output a complete, self-contained React TypeScript file (e.g., `App.tsx` or `SitePage.tsx`).',
      'Include all required imports at the top: `import React, { useState, useEffect, useRef } from "react";` and `import { ... } from "lucide-react";`.',
      'Do NOT leave placeholder comments like "// TODO: Add rest of items". Implement all sections, cards, navigation links, and footer links completely.',
      'Ensure zero TypeScript or linting errors. All state variables and event handlers must be strictly typed.',
      'Export the main component as default: `export default function App() { ... }`.',
    ],
    codeSampleHint: `import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ArrowRight, Star, Check } from 'lucide-react';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  // Replicate all telemetry-informed components with Tailwind CSS
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Header, Hero, Features, Pricing, Accordion, Footer */}
    </div>
  );
}`,
  },

  'nextjs-shadcn': {
    id: 'nextjs-shadcn',
    name: 'Next.js 15 (App Router) + Shadcn UI + Tailwind CSS',
    stack: 'Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI / Radix UI patterns, Lucide React',
    fileExtension: 'tsx',
    persona:
      'You are a principal Next.js & Shadcn UI architect. Recreate the website described below using the Next.js 15 App Router architecture, TypeScript, Tailwind CSS, and Shadcn UI / Radix UI component patterns.',
    frameworkDirectives: [
      'Next.js 15 App Router structure: provide clean, production-ready code with explicit file headers (e.g. `// app/page.tsx`, `// components/navbar.tsx`, etc.).',
      'Server vs Client Components: Explicitly declare `"use client";` at the top of all interactive components (Navbar with drawer, FAQ Accordion, Testimonials Carousel, Modals, Tab Filters). Keep static layout and hero sections as Server Components where appropriate.',
      'Shadcn UI & Radix UI Patterns: Structure UI elements following Shadcn primitives:',
      '  • Button (variants: default, secondary, outline, ghost, destructive, size: sm, default, lg)',
      '  • Dialog / Sheet for modal dialogs and slide-out mobile navigation',
      '  • DropdownMenu for nested navigation items',
      '  • Accordion (type="single" collapsible) for FAQ sections',
      '  • Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter for feature and pricing grids',
      '  • Badge, Avatar, Tabs, Tooltip primitives',
      'Utility helper: Include the standard `cn(...inputs: ClassValue[])` helper using `clsx` and `tailwind-merge`.',
      'Image Optimization: Use `next/image` with proper width, height, and alt attributes.',
      'SEO & Metadata: Provide the `export const metadata: Metadata = { ... }` configuration with title, description, and OpenGraph tags.',
      'Icons: Use `lucide-react` for all UI icons.',
    ],
    outputRequirements: [
      'Output complete, production-ready Next.js 15 App Router code with full TypeScript types.',
      'Clearly demarcate multi-file components with comment headers or provide an all-in-one `app/page.tsx` file ready to run.',
      'Include proper `"use client";` directives where state/hooks are used.',
      'Do NOT use pseudo-code or omit sections. Generate all components, data arrays, and interactions in full.',
      'Ensure complete responsive support using Tailwind breakpoints.',
    ],
    codeSampleHint: `"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Menu, X, ArrowRight, CheckCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Page() {
  // Production Next.js 15 App Router page
}`,
  },

  'vue3-tailwind': {
    id: 'vue3-tailwind',
    name: 'Vue 3 (Composition API) + Tailwind CSS',
    stack: 'Vue 3, <script setup lang="ts">, Composition API, Tailwind CSS, Lucide Vue Next',
    fileExtension: 'vue',
    persona:
      'You are an expert Vue 3 frontend architect. Recreate the website described below as a production-grade Vue 3 Single File Component (.vue) using `<script setup lang="ts">`, the Composition API, and Tailwind CSS.',
    frameworkDirectives: [
      'Vue 3 Single File Component (.vue) using `<script setup lang="ts">`, `<template>`, and optional `<style scoped>`.',
      'Reactivity & Lifecycle: Use Vue 3 Composition API primitives (`ref`, `reactive`, `computed`, `onMounted`, `onUnmounted`, `watch`).',
      'Styling: Full Tailwind CSS utility classes on template elements for styling, flexbox/grid layout, typography, and responsive design.',
      'Icons: Use Lucide Vue Next (`lucide-vue-next`) or clean inline SVG icons.',
      'Vue Built-in Transitions: Use `<Transition enter-active-class="..." leave-active-class="...">` and `<TransitionGroup>` for animated mobile drawers, modals, dropdown popovers, and accordion expansions.',
      'Template Directives: Use standard Vue syntax (`v-if`, `v-show`, `v-for="(item, i) in items" :key="item.id"`, `@click="toggleMenu"`, `@keydown.esc="closeModal"`).',
      'Interactions: Fully implement mobile nav drawer, modal dialog with backdrop, accordion FAQ toggle, testimonials carousel with auto-advance, and tabs.',
    ],
    outputRequirements: [
      'Output a complete, valid Vue 3 Single File Component (`.vue`).',
      'Structure strictly in three blocks: `<script setup lang="ts">`, `<template>`, and `<style scoped>` (if needed).',
      'Ensure all reactive variables, methods, and props are properly typed with TypeScript.',
      'No missing sections or truncated template blocks. Include the full page structure.',
      'Provide smooth Vue transition classes for all animated components.',
    ],
    codeSampleHint: `<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
// import { Menu, X, ArrowRight } from 'lucide-vue-next';

const isMobileMenuOpen = ref(false);
const activeAccordionIndex = ref<number | null>(null);
const currentSlide = ref(0);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 font-sans">
    <!-- Header, Hero, Sections, Footer -->
  </div>
</template>

<style scoped>
/* Custom keyframes or transitions if needed */
</style>`,
  },

  'svelte': {
    id: 'svelte',
    name: 'Svelte 5 (Runes) + Tailwind CSS',
    stack: 'Svelte 5, Runes ($state, $derived, $props, $effect), Tailwind CSS, Svelte Transitions',
    fileExtension: 'svelte',
    persona:
      'You are a master Svelte 5 engineer and UI craftsperson. Recreate the website described below as a modern Svelte 5 component using Svelte Runes ($state, $derived, $props, $effect), Tailwind CSS, and Svelte built-in transitions.',
    frameworkDirectives: [
      'Svelte 5 Component using modern Runes for all reactive state: `$state()`, `$derived()`, `$props()`, and `$effect()`.',
      'Event Handlers: Use modern Svelte 5 event syntax (`onclick={() => ...}`, `onkeydown={handleKey}`, `onsubmit={handleSubmit}`).',
      'Transitions & Motion: Utilize Svelte built-in transitions (`import { fade, slide, fly } from "svelte/transition";`) for smooth mobile drawer slides, modal fade-ins, and accordion expansions.',
      'Styling: Tailwind CSS utility classes paired with scoped `<style>` for custom animations or theme tokens.',
      'Interactivity: Fully implement reactive mobile nav drawer, modal dialogs with backdrop dismissal and focus management, accordion FAQ with slide transition, and carousel slider with auto-tick interval in `$effect()`.',
      'Component Architecture: Build clean modular markup with semantic HTML sections and complete accessibility attributes.',
    ],
    outputRequirements: [
      'Output a complete Svelte 5 `.svelte` component file.',
      'Include the `<script lang="ts">` block, template markup, and optional `<style>` block.',
      'Use modern Svelte 5 Runes exclusively (do NOT use legacy `let count = 0; $: doubled = count * 2;` syntax).',
      'Ensure zero placeholders or missing sections. Implement full DOM hierarchy, content, and interactive features.',
    ],
    codeSampleHint: `<script lang="ts">
  import { fade, slide } from 'svelte/transition';

  let isMobileMenuOpen = $state(false);
  let activeAccordion = $state<number | null>(null);
  let activeSlide = $state(0);

  function toggleMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }
</script>

<div class="min-h-screen bg-slate-900 text-slate-100 font-sans">
  <!-- Semantic Sections with Svelte 5 Runes & Transitions -->
</div>

<style>
  /* Scoped styles */
</style>`,
  },
};

if (typeof window !== 'undefined') {
  window.SitePrompterFrameworks = { FRAMEWORKS };
}

module.exports = {
  FRAMEWORKS,
};
