/**
 * SitePrompter Telemetry Formatter
 * Formats raw website telemetry data into structured markdown sections based on:
 * - detailLevel: 'compact' | 'balanced' | 'exhaustive'
 * - assetMode: 'original-urls' | 'placeholders' | 'svg-inline'
 */

/**
 * Normalize and sanitize telemetry data with safe defaults
 */
function normalizeTelemetry(raw) {
  const d = raw || {};

  const meta = {
    title: d.meta?.title || 'Untitled Page',
    description: d.meta?.description || '',
    keywords: d.meta?.keywords || '',
    ogTitle: d.meta?.ogTitle || '',
    ogDescription: d.meta?.ogDescription || '',
    ogImage: d.meta?.ogImage || '',
    twitterCard: d.meta?.twitterCard || '',
    canonical: d.meta?.canonical || 'https://example.com',
    lang: d.meta?.lang || 'en',
    themeColor: d.meta?.themeColor || '',
    viewport: d.meta?.viewport || 'width=device-width, initial-scale=1.0',
  };

  let framework = 'Vanilla JS';
  if (typeof d.framework === 'string' && d.framework.trim()) {
    framework = d.framework;
  } else if (Array.isArray(d.framework) && d.framework.length) {
    framework = d.framework.join(', ');
  }

  const cssVariables = typeof d.cssVariables === 'object' && d.cssVariables !== null
    ? d.cssVariables
    : {};

  let colors = [];
  if (Array.isArray(d.colors)) {
    colors = d.colors.map(c => {
      if (typeof c === 'string') return { color: c, frequency: 1 };
      if (c && typeof c === 'object') {
        return {
          color: c.color || c.hex || c.rgb || '#000000',
          frequency: typeof c.frequency === 'number' ? c.frequency : 1,
          role: c.role || '',
        };
      }
      return { color: String(c), frequency: 1 };
    });
  }

  const fonts = {
    families: Array.isArray(d.fonts?.families) ? d.fonts.families : [],
    sizes: Array.isArray(d.fonts?.sizes) ? d.fonts.sizes : [],
    weights: Array.isArray(d.fonts?.weights) ? d.fonts.weights : [],
    links: Array.isArray(d.fonts?.links) ? d.fonts.links : [],
    fontFaces: typeof d.fonts?.fontFaces === 'string' ? d.fonts.fontFaces : '',
  };

  const shadows = Array.isArray(d.shadows) ? d.shadows : [];
  const borderRadius = Array.isArray(d.borderRadius) ? d.borderRadius : [];

  const rawImgs = Array.isArray(d.images?.imgs) ? d.images.imgs : [];
  const images = {
    imgs: rawImgs.map((img, idx) => {
      if (typeof img === 'string') {
        return { src: img, alt: `Image ${idx + 1}`, width: 600, height: 400, role: 'content' };
      }
      return {
        src: img.src || '',
        alt: img.alt || '',
        width: img.width || 600,
        height: img.height || 400,
        role: img.role || 'content',
      };
    }),
    bgImages: Array.isArray(d.images?.bgImages) ? d.images.bgImages : [],
    svgSamples: Array.isArray(d.images?.svgSamples) ? d.images.svgSamples : [],
    svgCount: typeof d.images?.svgCount === 'number' ? d.images.svgCount : (d.images?.svgSamples?.length || 0),
    iconLinks: Array.isArray(d.images?.iconLinks) ? d.images.iconLinks : [],
  };

  const layout = {
    viewportWidth: d.layout?.viewportWidth || 1440,
    viewportHeight: d.layout?.viewportHeight || 900,
    totalHeight: d.layout?.totalHeight || 3200,
    sections: Array.isArray(d.layout?.sections) ? d.layout.sections : ['header', 'main', 'footer'],
    grids: Array.isArray(d.layout?.grids) ? d.layout.grids : [],
    flexboxes: Array.isArray(d.layout?.flexboxes) ? d.layout.flexboxes : [],
  };

  const animations = {
    animations: Array.isArray(d.animations?.animations) ? d.animations.animations : [],
    transitions: Array.isArray(d.animations?.transitions) ? d.animations.transitions : [],
    keyframes: typeof d.animations?.keyframes === 'string' ? d.animations.keyframes : '',
  };

  let domStructure = '';
  if (typeof d.domStructure === 'string') {
    domStructure = d.domStructure;
  } else if (d.domStructure && typeof d.domStructure === 'object') {
    domStructure = formatDomTree(d.domStructure);
  }

  const fullCSS = typeof d.fullCSS === 'string' ? d.fullCSS : '';

  const components = Array.isArray(d.components) ? d.components : [];
  const typography = typeof d.typography === 'object' && d.typography !== null ? d.typography : {};
  const spacing = Array.isArray(d.spacing) ? d.spacing : [];
  const external = {
    scripts: Array.isArray(d.external?.scripts) ? d.external.scripts : [],
    styles: Array.isArray(d.external?.styles) ? d.external.styles : [],
  };
  const interactions = Array.isArray(d.interactions) ? d.interactions : [];
  const responsive = Array.isArray(d.responsive) ? d.responsive : [];
  const accessibilityHints = Array.isArray(d.accessibilityHints) ? d.accessibilityHints : [];

  return {
    meta,
    framework,
    cssVariables,
    colors,
    fonts,
    shadows,
    borderRadius,
    images,
    layout,
    animations,
    domStructure,
    fullCSS,
    components,
    typography,
    spacing,
    external,
    interactions,
    responsive,
    accessibilityHints,
  };
}

/**
 * Format tree object to text indentation if provided as an object
 */
function formatDomTree(node, depth = 0, maxDepth = 6) {
  if (!node || depth > maxDepth) return '';
  const indent = '  '.repeat(depth);
  const tag = node.tag || node.tagName || 'div';
  const idStr = node.id ? `#${node.id}` : '';
  const classStr = node.class || node.className ? `.${String(node.class || node.className).trim().split(/\s+/).join('.')}` : '';
  const textPreview = node.text ? ` "${node.text.slice(0, 30)}${node.text.length > 30 ? '...' : ''}"` : '';

  let res = `${indent}<${tag}${idStr}${classStr}>${textPreview}\n`;
  if (Array.isArray(node.children)) {
    for (const child of node.children.slice(0, 15)) {
      res += formatDomTree(child, depth + 1, maxDepth);
    }
  }
  return res;
}

/**
 * Prune DOM structure string based on detail level
 */
function filterDomStructure(domStr, detailLevel) {
  if (!domStr) return '(Semantic DOM outline inferred from layout sections)';
  const lines = domStr.split('\n');

  if (detailLevel === 'compact') {
    // Ultra-compact token budget (15 lines max)
    const compactLines = lines.filter(line => {
      const leadingSpaces = (line.match(/^(\s*)/) || [''])[1].length;
      return leadingSpaces <= 4;
    }).slice(0, 18);
    return compactLines.join('\n');
  }

  if (detailLevel === 'balanced') {
    // High density token budget (35 lines max)
    const balancedLines = lines.filter(line => {
      const leadingSpaces = (line.match(/^(\s*)/) || [''])[1].length;
      return leadingSpaces <= 6;
    }).slice(0, 35);
    return balancedLines.join('\n');
  }

  // Exhaustive: up to 90 lines
  return lines.slice(0, 90).join('\n');
}

/**
 * Transform image assets based on assetMode
 */
function formatAssets(images, assetMode, detailLevel) {
  const isCompact = detailLevel === 'compact';
  const imgLimit = isCompact ? 6 : (detailLevel === 'balanced' ? 16 : 50);

  let formattedImgs = images.imgs.slice(0, imgLimit).map((img, i) => {
    let src = img.src;
    if (assetMode === 'placeholders') {
      const w = img.width || 800;
      const h = img.height || 600;
      const label = encodeURIComponent(img.alt || img.role || `Image ${i + 1}`);
      src = `https://placehold.co/${w}x${h}/2563eb/ffffff?text=${label}`;
    } else if (assetMode === 'svg-inline') {
      src = `[INLINE_SVG_OR_ICON: ${img.alt || img.role || 'vector-graphic'}]`;
    }

    const roleTag = img.role ? `[${img.role.toUpperCase()}] ` : '';
    const dims = img.width && img.height ? ` | ${img.width}x${img.height}px` : '';
    const altTag = img.alt ? ` | alt="${img.alt}"` : '';
    return `  - ${roleTag}${src}${dims}${altTag}`;
  });

  let formattedBgs = images.bgImages.slice(0, isCompact ? 3 : 15).map(bg => {
    if (assetMode === 'placeholders') {
      return `  - https://placehold.co/1920x1080/1e293b/64748b?text=Background+Cover`;
    }
    if (assetMode === 'svg-inline') {
      return `  - linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))`;
    }
    return `  - ${bg}`;
  });

  return {
    imgs: formattedImgs.length ? formattedImgs.join('\n') : '  (none)',
    bgImages: formattedBgs.length ? formattedBgs.join('\n') : '  (none)',
    svgCount: images.svgCount,
    svgSamples: images.svgSamples.slice(0, isCompact ? 2 : 10),
    iconLinks: images.iconLinks.slice(0, 6),
  };
}

/**
 * Format CSS variables based on detail level
 */
function formatCssVariables(cssVars, detailLevel) {
  const entries = Object.entries(cssVars);
  if (!entries.length) return '  (none detected)';

  if (detailLevel === 'compact') {
    // Filter to top 10 most relevant variables (colors, fonts, radii)
    const priorityVars = entries
      .filter(([k]) => /color|primary|bg|background|font|radius|shadow/i.test(k))
      .slice(0, 10);
    const selected = priorityVars.length ? priorityVars : entries.slice(0, 10);
    return selected.map(([k, v]) => `  ${k}: ${v};`).join('\n');
  }

  if (detailLevel === 'balanced') {
    return entries.slice(0, 30).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  }

  // Exhaustive
  return entries.map(([k, v]) => `  ${k}: ${v};`).join('\n');
}

/**
 * Format Color Palette based on detail level
 */
function formatColors(colors, detailLevel) {
  if (!colors.length) return '  (none detected)';
  const limit = detailLevel === 'compact' ? 10 : (detailLevel === 'balanced' ? 20 : 40);
  const sliced = colors.slice(0, limit);

  return sliced
    .map(c => `  - ${c.color} ${c.role ? `[${c.role}] ` : ''}(used ${c.frequency}x)`)
    .join('\n');
}

/**
 * Format Typography
 */
function formatTypography(typography, fonts, detailLevel) {
  const typoEntries = Object.entries(typography);
  let typoScale = '';

  if (typoEntries.length) {
    const limit = detailLevel === 'compact' ? 6 : (detailLevel === 'balanced' ? 15 : 30);
    typoScale = typoEntries.slice(0, limit).map(([tag, p]) => {
      const parts = [
        p.fontFamily ? `font-family: ${p.fontFamily}` : '',
        p.fontSize ? `size: ${p.fontSize}` : '',
        p.fontWeight ? `weight: ${p.fontWeight}` : '',
        p.lineHeight ? `line-height: ${p.lineHeight}` : '',
        p.letterSpacing && p.letterSpacing !== 'normal' ? `letter-spacing: ${p.letterSpacing}` : '',
        p.textTransform && p.textTransform !== 'none' ? `text-transform: ${p.textTransform}` : '',
        p.color ? `color: ${p.color}` : '',
      ].filter(Boolean);
      return `  <${tag}>: ${parts.join(' | ')}`;
    }).join('\n');
  } else {
    typoScale = '  (standard responsive type scale: h1: 2.5rem/700, h2: 2rem/700, h3: 1.5rem/600, p: 1rem/400)';
  }

  const families = fonts.families.length
    ? fonts.families.slice(0, detailLevel === 'compact' ? 4 : 10).join('\n  • ')
    : 'System sans-serif stack (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)';

  const sizes = fonts.sizes.length
    ? fonts.sizes.slice(0, detailLevel === 'compact' ? 8 : 20).join(' | ')
    : '12px | 14px | 16px | 18px | 20px | 24px | 32px | 48px';

  return {
    typoScale,
    families: `  • ${families}`,
    sizes: `  ${sizes}`,
    links: fonts.links.length ? fonts.links.map(l => `  - ${l}`).join('\n') : '  (none)',
    fontFaces: fonts.fontFaces || '/* none declared */',
  };
}

/**
 * Format Layout and Spacing
 */
function formatLayout(layout, spacing, detailLevel) {
  const isCompact = detailLevel === 'compact';
  const gridLimit = isCompact ? 3 : (detailLevel === 'balanced' ? 10 : 25);
  const flexLimit = isCompact ? 4 : (detailLevel === 'balanced' ? 12 : 30);
  const spacingLimit = isCompact ? 4 : (detailLevel === 'balanced' ? 15 : 40);

  const grids = layout.grids.slice(0, gridLimit).map(g =>
    `  ${g.el || 'container'} — columns: ${g.cols || 'auto'} | rows: ${g.rows || 'auto'} | gap: ${g.gap || 'none'}`
  ).join('\n');

  const flexboxes = layout.flexboxes.slice(0, flexLimit).map(f =>
    `  ${f.el || 'container'} — direction: ${f.direction || 'row'} | wrap: ${f.wrap || 'nowrap'} | justify: ${f.justify || 'flex-start'} | align: ${f.align || 'stretch'}`
  ).join('\n');

  const spacingBlock = spacing.slice(0, spacingLimit).map(s =>
    `  ${s.el || 'section'} — padding: ${s.padding || '0'} | margin: ${s.margin || '0'} | gap: ${s.gap || 'none'} | max-width: ${s.maxWidth || 'none'}`
  ).join('\n');

  return {
    sections: layout.sections.join(' | ') || 'header | main | footer',
    grids: grids || '  (none detected)',
    flexboxes: flexboxes || '  (none detected)',
    spacing: spacingBlock || '  (none detected)',
  };
}

/**
 * Format Components detected
 */
function formatComponents(components, detailLevel) {
  // Ensure we have a rich list of detected components
  const defaultComponents = [
    'Header / Navigation Bar (with responsive hamburger toggle & logo)',
    'Hero Section (headline, subhead, primary & secondary CTA buttons, hero visual)',
    'Feature Cards Grid (icon, title, description, hover elevation)',
    'Interactive Tabs / Filter Bar',
    'Testimonials Carousel / Social Proof Cards (quotes, avatars, ratings)',
    'Pricing Matrix / Plan Cards (toggle monthly/annual, feature checkmarks, badges)',
    'FAQ Accordion (expand/collapse with smooth transitions)',
    'Call to Action (CTA) Banner',
    'Newsletter Subscription Form (email input, submit button, validation feedback)',
    'Modal Dialog / Lightbox (backdrop, focus trap, escape key dismissal)',
    'Dropdown Menus / Popovers',
    'Stats / Metric Counters',
    'Breadcrumbs & Pagination controls',
    'Footer (multi-column link groups, social links, copyright, theme switcher)',
  ];

  let list = components.length ? components : defaultComponents;
  if (detailLevel === 'compact') {
    list = list.slice(0, 10);
  } else if (detailLevel === 'balanced') {
    // If fewer than 22 components, enrich with standard complementary UI components
    if (list.length < 22) {
      const combined = [...new Set([...list, ...defaultComponents])];
      list = combined;
    }
  }

  return list.map(c => `  • ${c}`).join('\n');
}

/**
 * Format Interactions & Behaviors
 */
function formatInteractions(interactions, detailLevel) {
  const standardInteractions = [
    'Mobile Navigation Drawer: Smooth slide/fade on hamburger toggle with overlay backdrop dismissal',
    'Dropdown Menus: Open/close on click/hover with click-outside detection and transition',
    'Modal / Dialog: Open on trigger button, close on backdrop click, close on Escape key, body scroll lock',
    'Accordion Panels: Expand/collapse FAQ items with animated height and chevron rotation',
    'Carousel / Slider: Active slide indicators, previous/next controls, drag/swipe, auto-play with pause on hover',
    'Tab Switcher: Switch active tab panel with animated underline or highlight pill',
    'Sticky Header: Fixes to top on scroll with subtle background blur and shadow',
    'Interactive Buttons: Hover elevation, click ripple/press state, disabled state',
    'Form Inputs: Focus glow ring, floating label / placeholder transition, inline error validation',
    'Tooltips & Popovers: Show on hover/focus with arrow indicator',
    'Dark / Light Mode Toggle: Theme variable switching (if present)',
    'Scroll Reveal Animations: Fade in and slide up elements as they enter viewport',
  ];

  let list = interactions.length ? interactions : standardInteractions;
  if (detailLevel === 'compact') {
    list = list.slice(0, 8);
  } else if (detailLevel === 'balanced') {
    list = [...new Set([...list, ...standardInteractions])].slice(0, 15);
  } else {
    list = [...new Set([...list, ...standardInteractions])];
  }

  return list.map(i => `  • ${i}`).join('\n');
}

/**
 * Format Animations & Keyframes
 */
function formatAnimations(animations, detailLevel) {
  const isCompact = detailLevel === 'compact';
  const anims = animations.animations.slice(0, isCompact ? 3 : 15);
  const trans = animations.transitions.slice(0, isCompact ? 5 : 20);

  const parts = [];
  if (anims.length) {
    parts.push(`  Active CSS Animations:\n${anims.map(a => '    - ' + a).join('\n')}`);
  }
  if (trans.length) {
    parts.push(`  Transitions in use:\n${trans.map(t => '    - ' + t).join('\n')}`);
  }
  if (animations.keyframes && detailLevel !== 'compact') {
    const keyframesSnippet = detailLevel === 'balanced'
      ? animations.keyframes.slice(0, 1200)
      : animations.keyframes.slice(0, 6000);
    parts.push(`\n  Keyframe Definitions:\n\`\`\`css\n${keyframesSnippet}\n\`\`\``);
  }

  return parts.length ? parts.join('\n') : '  (standard smooth transitions: 200ms-300ms ease-in-out)';
}

/**
 * Format Extracted CSS based on detail level
 */
function formatExtractedCss(fullCSS, detailLevel) {
  if (!fullCSS || !fullCSS.trim()) {
    return '/* Synthesize styling based on Design Tokens and Tailwind utility classes above */';
  }

  if (detailLevel === 'compact') {
    return '/* Extracted CSS omitted for ultra-compact token budget — follow design tokens and layout rules */';
  }

  if (detailLevel === 'balanced') {
    // Ultra-efficient token budget (max 300 chars)
    if (fullCSS.length > 300) {
      return fullCSS.slice(0, 300).trim() + '\n/* ... [truncated for optimal token efficiency] ... */';
    }
    return fullCSS;
  }

  // Exhaustive: up to 1,500 characters
  if (fullCSS.length > 1500) {
    return fullCSS.slice(0, 1500).trim() + '\n/* ... [truncated for optimal token efficiency] ... */';
  }
  return fullCSS;
}

/**
 * Build the Telemetry Markdown Document
 */
function buildTelemetrySections(rawTelemetry, options = {}) {
  const detailLevel = options.detailLevel || 'balanced';
  const assetMode = options.assetMode || 'original-urls';

  const data = normalizeTelemetry(rawTelemetry);

  const cssVarsFormatted = formatCssVariables(data.cssVariables, detailLevel);
  const colorsFormatted = formatColors(data.colors, detailLevel);
  const typoFormatted = formatTypography(data.typography, data.fonts, detailLevel);
  const layoutFormatted = formatLayout(data.layout, data.spacing, detailLevel);
  const domFormatted = filterDomStructure(data.domStructure, detailLevel);
  const componentsFormatted = formatComponents(data.components, detailLevel);
  const interactionsFormatted = formatInteractions(data.interactions, detailLevel);
  const animsFormatted = formatAnimations(data.animations, detailLevel);
  const assetsFormatted = formatAssets(data.images, assetMode, detailLevel);
  const cssFormatted = formatExtractedCss(data.fullCSS, detailLevel);

  const responsiveQueries = data.responsive.length
    ? data.responsive.slice(0, detailLevel === 'compact' ? 4 : 12).map(r => `  @media ${r}`).join('\n')
    : '  @media (max-width: 1024px) { /* tablet */ }\n  @media (max-width: 768px) { /* mobile */ }\n  @media (max-width: 480px) { /* small mobile */ }';

  const a11yList = data.accessibilityHints.length
    ? data.accessibilityHints.map(h => `  • ${h}`).join('\n')
    : '  • Semantic HTML5 landmarks (<header>, <nav>, <main>, <section>, <footer>)\n  • ARIA roles & labels for all dynamic buttons and modal dialogs\n  • Accessible focus-visible indicators (2px solid outline/ring)\n  • Descriptive alt attributes on all image elements';

  const externalScripts = data.external.scripts.length
    ? data.external.scripts.slice(0, 10).map(s => `  - ${s}`).join('\n')
    : '  (none)';
  const externalStyles = data.external.styles.length
    ? data.external.styles.slice(0, 10).map(s => `  - ${s}`).join('\n')
    : '  (none)';

  return {
    overview: `━━━ 1. SITE OVERVIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Title        : ${data.meta.title}
  URL          : ${data.meta.canonical}
  Language     : ${data.meta.lang}
  Description  : ${data.meta.description || '(none)'}
  Keywords     : ${data.meta.keywords || '(none)'}
  Theme Color  : ${data.meta.themeColor || '(none)'}
  OG Image     : ${data.meta.ogImage || '(none)'}
  Frameworks   : ${data.framework}
  Viewport     : ${data.layout.viewportWidth}px × ${data.layout.viewportHeight}px
  Page Height  : ${data.layout.totalHeight}px`,

    designTokens: `━━━ 2. DESIGN TOKENS & CSS VARIABLES ━━━━━━━━━━━━━━━━━━━━━━━

CSS Custom Properties (:root):
${cssVarsFormatted}

  Border Radius values:
  ${data.borderRadius.length ? data.borderRadius.join(' | ') : '4px | 8px | 12px | 16px | 9999px (full)'}

  Box Shadows:
${data.shadows.length ? data.shadows.slice(0, 10).map(s => '  - ' + s).join('\n') : '  - 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)\n  - 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'}`,

    colors: `━━━ 3. COLOR PALETTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  (sorted by frequency — most used first)
${colorsFormatted}`,

    typography: `━━━ 4. TYPOGRAPHY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Type Scale (computed from elements):
${typoFormatted.typoScale}

  Font Families detected:
${typoFormatted.families}

  Font Sizes scale:
${typoFormatted.sizes}

  External Font Sources:
${typoFormatted.links}

  @font-face declarations:
\`\`\`css
${typoFormatted.fontFaces}
\`\`\``,

    layout: `━━━ 5. LAYOUT SYSTEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Semantic HTML sections:
  ${layoutFormatted.sections}

  CSS Grid containers:
${layoutFormatted.grids}

  Flexbox containers:
${layoutFormatted.flexboxes}

  Element spacing (padding / margin / gap / max-width):
${layoutFormatted.spacing}`,

    domStructure: `━━━ 6. DOM STRUCTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Hierarchy outline:
\`\`\`
${domFormatted}
\`\`\``,

    components: `━━━ 7. COMPONENTS DETECTED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${componentsFormatted}`,

    interactions: `━━━ 8. INTERACTIONS & BEHAVIORS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Behavior patterns detected:
${interactionsFormatted}`,

    animations: `━━━ 9. ANIMATIONS & TRANSITIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${animsFormatted}`,

    responsive: `━━━ 10. RESPONSIVE BREAKPOINTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${responsiveQueries}`,

    assets: `━━━ 11. ASSETS & MEDIA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Asset Mode: ${assetMode}

  ── Images ──
${assetsFormatted.imgs}

  ── CSS Background Images ──
${assetsFormatted.bgImages}

  ── Inline SVG icons (${assetsFormatted.svgCount} total) ──
${assetsFormatted.svgSamples.length ? assetsFormatted.svgSamples.map((s, i) => `  SVG #${i + 1}: ${s}...`).join('\n') : '  (none)'}

  ── Favicon / Icon links ──
${assetsFormatted.iconLinks.length ? assetsFormatted.iconLinks.map(i => '  - ' + i).join('\n') : '  (none)'}`,

    extractedCss: `━━━ 12. EXTRACTED CSS (source truth) ━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`css
${cssFormatted}
\`\`\``,

    external: `━━━ 13. EXTERNAL DEPENDENCIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Scripts detected:
${externalScripts}

  Stylesheets detected:
${externalStyles}`,

    accessibility: `━━━ 14. ACCESSIBILITY & SEO GUIDELINES ━━━━━━━━━━━━━━━━━━━━━

${a11yList}`,
  };
}

const TelemetryFormatter = {
  normalizeTelemetry,
  buildTelemetrySections,
  formatDomTree,
  filterDomStructure,
  formatAssets,
  formatCssVariables,
  formatColors,
  formatTypography,
  formatLayout,
  formatComponents,
  formatInteractions,
  formatAnimations,
  formatExtractedCss,
};

if (typeof window !== 'undefined') {
  window.SitePrompterTelemetryFormatter = TelemetryFormatter;
}

module.exports = TelemetryFormatter;
