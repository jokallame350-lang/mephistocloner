/**
 * SitePrompter Web - Advanced AI Prompt Compiler Engine
 * Compiles website telemetry into high-precision, battle-tested LLM prompts
 * for ChatGPT (GPT-4o/o1), Claude 3.5 Sonnet, Gemini 1.5 Pro, and DeepSeek-V3/R1.
 */

/**
 * Framework-specific generation instructions and templates
 */
const FRAMEWORK_SPECS = {
  'vanilla': {
    name: 'Vanilla HTML5 + CSS3 + Modern JS',
    target: 'Single, self-contained HTML file. All CSS in <style>, all JS in <script>. Zero build steps.',
    outputRules: [
      'Output ONLY a single complete index.html file without markdown wrapper or explanations.',
      'Start with <!DOCTYPE html> and end with </html>.',
      'Embed all CSS inside <style> in <head>. Embed all JavaScript in <script> before </body>.',
      'No CDN libraries unless explicitly requested. Reimplement interactive logic in modern vanilla JS (ES6+).'
    ]
  },
  'html-tailwind': {
    name: 'HTML5 + Tailwind CSS (Play CDN)',
    target: 'Single self-contained HTML file utilizing Tailwind CSS utility classes and Lucide icons.',
    outputRules: [
      'Include <script src="https://cdn.tailwindcss.com"></script> in <head>.',
      'Configure tailwind.config inside <script> with custom colors, fonts, shadows, and keyframes extracted from the telemetry.',
      'Use semantic HTML elements styled with modern Tailwind CSS utility classes (e.g. flex, grid, rounded-xl, backdrop-blur, transition-all).',
      'Include inline Lucide icons or SVG vectors where appropriate.',
      'Include interactive JavaScript logic inside <script> tags before </body>.'
    ]
  },
  'react-tailwind': {
    name: 'React (Next.js / Vite) + Tailwind CSS + Lucide Icons',
    target: 'Modern modular React component with TypeScript/JSX, Tailwind CSS, Lucide icons, and state management.',
    outputRules: [
      'Output a clean, production-ready React component (App.jsx or Page.tsx) using functional components and React hooks (useState, useEffect, useRef).',
      'Use Tailwind CSS for styling with extracted theme tokens.',
      'Use Lucide React icon names (e.g. <Menu />, <ChevronDown />, <ArrowRight />) for icons.',
      'Include interactive states: dropdown toggles, modal open/close, tabs switching, accordion expand/collapse, mobile menu drawer.',
      'Export the default component cleanly.'
    ]
  },
  'nextjs': {
    name: 'Next.js 14/15 App Router + Tailwind CSS + TypeScript',
    target: 'Next.js 14+ App Router page (page.tsx) with TypeScript, Tailwind CSS, Lucide icons, and server/client component separation.',
    outputRules: [
      'Use "use client" directive where interactive state (useState, useEffect) is needed.',
      'Structured with modern TypeScript interfaces and types for props/data.',
      'Use next/image conventions or standard <img> with original asset URLs.',
      'Fully responsive with Tailwind breakpoints (sm:, md:, lg:, xl:, 2xl:).'
    ]
  },
  'vue': {
    name: 'Vue 3 Single File Component (SFC) + Tailwind / Scoped CSS',
    target: 'Vue 3 Single File Component (<template>, <script setup>, <style scoped>).',
    outputRules: [
      'Use Vue 3 Composition API with <script setup lang="ts"> (ref, computed, onMounted).',
      'Implement all reactive state for modals, navigation drawers, carousels, and accordions.',
      'Style with Tailwind CSS classes or scoped CSS using extracted design tokens.'
    ]
  },
  'svelte': {
    name: 'Svelte 5 / SvelteKit Component',
    target: 'Svelte component with reactive runes ($state, $derived) and scoped styling.',
    outputRules: [
      'Use modern Svelte syntax with runes for state management.',
      'Implement all animations, transitions, and component interactions.',
      'Use clean semantic markup and responsive CSS/Tailwind.'
    ]
  }
};

/**
 * Estimate token count from text
 * @param {string} text 
 * @returns {number}
 */
function estimateTokens(text) {
  if (!text) return 0;
  // Approximate standard BPE tokenizer ratio (~4 chars per token for English/Code)
  return Math.ceil(text.length / 3.8);
}

/**
 * Compile prompt from telemetry data
 * @param {object} telemetry - Raw or enriched telemetry data
 * @param {string} framework - Target framework key ('html-tailwind', 'react-tailwind', 'vanilla', 'nextjs', 'vue', 'svelte')
 * @param {string} detailLevel - Detail level ('minimal', 'standard', 'comprehensive', 'ultra')
 * @returns {{ prompt: string, tokenEstimate: number, summary: object }}
 */
function compilePrompt(telemetry = {}, framework = 'html-tailwind', detailLevel = 'comprehensive') {
  const fwKey = FRAMEWORK_SPECS[framework] ? framework : 'html-tailwind';
  const fwConfig = FRAMEWORK_SPECS[fwKey];

  const meta = telemetry.meta || {};
  const colors = telemetry.colors || [];
  const fonts = telemetry.fonts || { families: [], sizes: [], links: [], fontFaces: '' };
  const typography = telemetry.typography || {};
  const cssVars = telemetry.cssVariables || {};
  const shadows = telemetry.shadows || [];
  const borderRadius = telemetry.borderRadius || [];
  const images = telemetry.images || { imgs: [], bgImages: [], svgCount: 0, svgSamples: [], iconLinks: [] };
  const layout = telemetry.layout || { sections: [], grids: [], flexboxes: [], viewportWidth: 1440, viewportHeight: 900, totalHeight: 0 };
  const spacing = telemetry.spacing || [];
  const animations = telemetry.animations || { animations: [], transitions: [], keyframes: '' };
  const domStructure = telemetry.domStructure || '';
  const components = telemetry.components || [];
  const interactions = telemetry.interactions || [];
  const responsive = telemetry.responsive || [];
  const accessibility = telemetry.accessibilityHints || [];
  const fullCSS = telemetry.fullCSS || '';

  // Limit formatting based on detailLevel
  let maxColors = 20;
  let maxImages = 40;
  let maxCSSLength = 12000;
  let maxDomLength = 10000;
  let includeFullCSS = true;
  let includeDomTree = true;

  if (detailLevel === 'minimal') {
    maxColors = 8;
    maxImages = 15;
    includeFullCSS = false;
    includeDomTree = false;
  } else if (detailLevel === 'standard') {
    maxColors = 15;
    maxImages = 25;
    maxCSSLength = 6000;
    maxDomLength = 6000;
    includeFullCSS = true;
    includeDomTree = true;
  } else if (detailLevel === 'ultra') {
    maxColors = 30;
    maxImages = 60;
    maxCSSLength = 25000;
    maxDomLength = 15000;
    includeFullCSS = true;
    includeDomTree = true;
  }

  // 1. Color Palette formatting
  const colorList = colors.slice(0, maxColors).map(c => `  - ${c.color} (frequency: ${c.frequency}x)`).join('\n') || '  (none detected)';

  // 2. CSS Variables formatting
  const cssVarEntries = Object.entries(cssVars);
  const cssVarsBlock = cssVarEntries.length > 0
    ? cssVarEntries.slice(0, 40).map(([k, v]) => `  ${k}: ${v};`).join('\n')
    : '  /* None detected */';

  // 3. Image & Media assets
  const imgList = (images.imgs || []).slice(0, maxImages).map(img =>
    `  - [${(img.role || 'CONTENT').toUpperCase()}] ${img.src}${img.alt ? ` | alt="${img.alt}"` : ''} | ${img.width}x${img.height}`
  ).join('\n') || '  (no images detected)';

  const bgList = (images.bgImages || []).slice(0, 15).map(u => `  - ${u}`).join('\n') || '  (none)';
  const svgSamples = (images.svgSamples || []).slice(0, 5).map((s, i) => `  SVG Sample #${i + 1}:\n    ${s}`).join('\n\n') || '  (none)';

  // 4. Typography scale
  const typoEntries = Object.entries(typography);
  const typoBlock = typoEntries.length > 0
    ? typoEntries.map(([tag, p]) =>
      `  <${tag}>: font-family: ${p.fontFamily} | size: ${p.fontSize} | weight: ${p.fontWeight} | line-height: ${p.lineHeight} | color: ${p.color}`
    ).join('\n')
    : '  (standard browser defaults)';

  // 5. Layout & Grids
  const gridBlock = (layout.grids || []).slice(0, 10).map(g =>
    `  ${g.el} — cols: ${g.cols || 'auto'} | rows: ${g.rows || 'auto'} | gap: ${g.gap || 'none'}`
  ).join('\n') || '  (none)';

  const flexBlock = (layout.flexboxes || []).slice(0, 10).map(f =>
    `  ${f.el} — direction: ${f.direction} | wrap: ${f.wrap} | justify: ${f.justify} | align: ${f.align}`
  ).join('\n') || '  (none)';

  const spacingBlock = spacing.slice(0, 12).map(s =>
    `  ${s.el} — padding: ${s.padding} | margin: ${s.margin} | gap: ${s.gap || '0px'} | max-width: ${s.maxWidth || 'none'}`
  ).join('\n') || '  (none)';

  // 6. Animations
  const animList = (animations.animations || []).slice(0, 15).map(a => `    • ${a}`).join('\n');
  const transList = (animations.transitions || []).slice(0, 10).map(t => `    • ${t}`).join('\n');

  // 7. Component detection list
  const compList = components.map(c => typeof c === 'string' ? `  • ${c}` : `  • ${c.summary || c.name}`).join('\n') || '  • Standard Page Sections';

  // 8. Output rules formatting
  const rulesBlock = fwConfig.outputRules.map((r, i) => `${i + 1}. ${r}`).join('\n');

  // BUILD THE MASTER PROMPT
  const prompt = `\
You are a Principal Frontend Architect and Master UI/UX Engineer. Your task is to accurately reconstruct the website detailed in the comprehensive telemetry brief below into clean, modern, pixel-perfect, production-grade code.

Target Framework: ${fwConfig.name}
Output Architecture: ${fwConfig.target}

═══════════════════════════════════════════════════════════════
  SITE CLONE TELEMETRY SPECIFICATION
  Generated by SitePrompter Web
═══════════════════════════════════════════════════════════════

━━━ 1. SITE OVERVIEW & METADATA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Title        : ${meta.title || '(untitled)'}
  • URL / Origin : ${meta.canonical || '(local)'}
  • Language     : ${meta.lang || 'en'} (Direction: ${meta.dir || 'ltr'})
  • Description  : ${meta.description || '(none)'}
  • Keywords     : ${meta.keywords || '(none)'}
  • Theme Color  : ${meta.themeColor || '(none)'}
  • OG Image     : ${meta.ogImage || '(none)'}
  • Detected Tech: ${telemetry.framework || 'HTML5 / CSS3'}
  • Viewport     : ${layout.viewportWidth}px × ${layout.viewportHeight}px (Document Height: ${layout.totalHeight}px)

━━━ 2. DESIGN TOKENS & CSS CUSTOM PROPERTIES ━━━━━━━━━━━━━━━━
CSS Variables (:root):
${cssVarsBlock}

Border Radius Values in Use:
  ${borderRadius.length > 0 ? borderRadius.join(' | ') : '4px, 8px, 12px, 9999px'}

Box Shadows & Elevation:
${shadows.length > 0 ? shadows.map(s => '  - ' + s).join('\n') : '  - 0 1px 3px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)'}

━━━ 3. COLOR PALETTE (Ranked by Visual Frequency) ━━━━━━━━━━━
${colorList}

━━━ 4. TYPOGRAPHY SYSTEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Computed Element Type Scale:
${typoBlock}

Font Families Detected:
  ${(fonts.families || []).slice(0, 8).join('\n  ') || 'system-ui, -apple-system, sans-serif'}

Font Sizes Scale:
  ${(fonts.sizes || []).join(' | ') || '12px, 14px, 16px, 18px, 24px, 32px, 48px'}

Font Weights Detected:
  ${(fonts.weights || []).join(' | ') || '400, 500, 600, 700'}

External Font Links:
${(fonts.links || []).map(l => '  - ' + l).join('\n') || '  (none)'}

━━━ 5. LAYOUT & SPACING MATRIX ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Semantic Landmarks Detected:
  ${(layout.sections || []).join(' | ') || 'header, nav, main, section, footer'}

CSS Grid Containers:
${gridBlock}

Flexbox Containers:
${flexBlock}

Container Spacing & Padding Profiles:
${spacingBlock}

━━━ 6. DETECTED UI COMPONENTS (22+ Taxonomy) ━━━━━━━━━━━━━━━━
${compList}

━━━ 7. INTERACTIONS & BEHAVIORAL SPECIFICATIONS ━━━━━━━━━━━━━
Interactions Detected on Original Site:
${interactions.length > 0 ? interactions.map(i => '  • ' + i).join('\n') : '  • Standard responsive navigation & button states'}

Mandatory Interactive Behaviors to Implement:
  1. Responsive Navigation Bar: Smooth hamburger drawer toggle on mobile screens (< 768px).
  2. Dropdown & Context Menus: Accessible hover/click opening with smooth opacity & translate transitions.
  3. Interactive Buttons & Links: Refined hover states, active press scaling, and keyboard focus-visible rings.
  4. Modals & Dialogs: Backdrop overlay with blur/dim, ESC key closure, and animated entrance.
  5. Carousels & Sliders (if present): Functional next/prev pagination and swipe gesture support.
  6. Accordions & Collapsibles (if present): Smooth max-height / grid-rows expansion and chevron rotation.
  7. Form Validation: Live focus rings, error badges, placeholder styling, and submit feedback.
  8. Tabs & Segmented Controls (if present): Instant or animated active tab indicator switching.

━━━ 8. ANIMATIONS, TRANSITIONS & MOTION ━━━━━━━━━━━━━━━━━━━━━
Active CSS Animations:
${animList || '    (no custom @keyframes active)'}

CSS Transitions in Use:
${transList || '    • all 0.2s ease-in-out, transform 0.15s ease'}

Keyframes Definitions:
\`\`\`css
${(animations.keyframes || '').slice(0, 2000) || '/* Recreate standard subtle entrance animations (fade-in, slide-up) */'}
\`\`\`

━━━ 9. RESPONSIVE MEDIA QUERIES & BREAKPOINTS ━━━━━━━━━━━━━━━
${responsive.length > 0 ? responsive.map(r => `  @media ${r}`).join('\n') : '  @media (max-width: 640px) [sm]\n  @media (max-width: 768px) [md]\n  @media (max-width: 1024px) [lg]\n  @media (max-width: 1280px) [xl]'}

Responsive Behavior Rules:
  • Desktop (≥ 1024px): Full multi-column grid, expanded horizontal navigation, sticky header.
  • Tablet (768px – 1023px): 2-column grid adaptation, collapsible sidebar if applicable.
  • Mobile (< 768px): Single-column stacked layout, full-width buttons, slide-in navigation drawer.

━━━ 10. MEDIA ASSETS & IMAGERY (Use Exact URLs) ━━━━━━━━━━━━━
Images:
${imgList}

Background Images:
${bgList}

Inline SVG Samples (${images.svgCount || 0} icons total):
${svgSamples}

Favicons:
${(images.iconLinks || []).map(i => '  - ' + i).join('\n') || '  (none)'}

━━━ 11. ACCESSIBILITY & A11Y STANDARDS ━━━━━━━━━━━━━━━━━━━━━━
${accessibility.length > 0 ? accessibility.map(a => '  • ' + a).join('\n') : '  • Include proper aria-labels, alt text, and semantic HTML5 landmarks'}

${includeDomTree && domStructure ? `
━━━ 12. DOM STRUCTURE BLUEPRINT (Clean Semantic Hierarchy) ━━
\`\`\`html
${domStructure.slice(0, maxDomLength)}
\`\`\`
` : ''}

${includeFullCSS && fullCSS ? `
━━━ 13. CSS SOURCE TRUTH (Extracted Ground Truth) ━━━━━━━━━━━
\`\`\`css
${fullCSS.slice(0, maxCSSLength)}
\`\`\`
` : ''}

═══════════════════════════════════════════════════════════════
  STRICT GENERATION INSTRUCTIONS
═══════════════════════════════════════════════════════════════
${rulesBlock}
• Visual Fidelity: Match fonts, exact color hex codes, border-radii, spacing, and shadows precisely.
• Media Assets: Use the EXACT image URLs provided above without replacing them with generic placeholders.
• Interactivity: All buttons, navigation menus, tabs, and toggles must be fully clickable and functional.
• Cleanliness: Code must be modern, well-formatted, completely bug-free, and ready to deploy instantly.
`;

  return {
    prompt: prompt.trim(),
    tokenEstimate: estimateTokens(prompt),
    framework: fwConfig.name,
    detailLevel,
    metrics: {
      colorsCount: colors.length,
      imagesCount: (images.imgs || []).length,
      componentsCount: components.length,
      charLength: prompt.length
    }
  };
}

module.exports = {
  FRAMEWORK_SPECS,
  estimateTokens,
  compilePrompt
};
