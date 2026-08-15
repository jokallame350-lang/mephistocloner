/**
 * SitePrompter Web - In-Browser Telemetry Extractor Engine
 * This module runs in the browser page context (Puppeteer page.evaluate) or can be injected into any DOM.
 */

function extractAllTelemetry() {
  /* ─── 1. META & SEO ─────────────────────────────────────────── */
  function extractMeta() {
    const getMeta = (attr, val) => {
      const el = document.querySelector(`meta[${attr}="${val}" i]`);
      return el ? (el.getAttribute('content') || '').trim() : '';
    };

    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(el => {
      const prop = el.getAttribute('property');
      if (prop) og[prop] = el.getAttribute('content') || '';
    });

    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:"], meta[property^="twitter:"]').forEach(el => {
      const name = el.getAttribute('name') || el.getAttribute('property');
      if (name) twitter[name] = el.getAttribute('content') || '';
    });

    const favicon = document.querySelector('link[rel*="icon"]')?.href || '';

    return {
      title: document.title || '',
      description: getMeta('name', 'description') || getMeta('property', 'og:description'),
      keywords: getMeta('name', 'keywords'),
      ogTitle: getMeta('property', 'og:title') || document.title,
      ogDescription: getMeta('property', 'og:description'),
      ogImage: getMeta('property', 'og:image'),
      twitterCard: getMeta('name', 'twitter:card') || getMeta('property', 'twitter:card'),
      canonical: document.querySelector('link[rel="canonical"]')?.href || window.location.href,
      lang: document.documentElement.lang || 'en',
      dir: document.documentElement.dir || 'ltr',
      themeColor: getMeta('name', 'theme-color'),
      viewport: getMeta('name', 'viewport') || 'width=device-width, initial-scale=1.0',
      charset: document.characterSet || 'UTF-8',
      author: getMeta('name', 'author'),
      generator: getMeta('name', 'generator'),
      favicon,
      og,
      twitter
    };
  }

  /* ─── 2. FRAMEWORK & LIBRARY DETECTION ──────────────────────── */
  function detectFramework() {
    const detected = new Set();

    // JavaScript runtime / Globals / DOM Markers
    if (window.React || document.querySelector('[data-reactroot], [data-reactid], #root')) detected.add('React');
    if (window.__vue__ || window.Vue || document.querySelector('[data-v-app], [data-v-]')) detected.add('Vue');
    if (window.angular || window.ng || document.querySelector('[ng-version], [ng-app], [ng-controller]')) detected.add('Angular');
    if (window.__svelte || document.querySelector('[class*="svelte-"]')) detected.add('Svelte');
    if (window.next || document.querySelector('#__next') || document.querySelector('script[src*="/_next/"]')) detected.add('Next.js');
    if (window.nuxt || document.querySelector('#__nuxt') || document.querySelector('script[src*="/_nuxt/"]')) detected.add('Nuxt.js');
    if (window.___gatsby || document.querySelector('#___gatsby')) detected.add('Gatsby');
    if (window.Alpine || document.querySelector('[x-data], [x-init]')) detected.add('Alpine.js');
    if (window.Astro || document.querySelector('astro-island, [data-astro-cid-]')) detected.add('Astro');
    if (window.__remixContext) detected.add('Remix');
    if (document.querySelector('script[type="module"][src*="@vite"]')) detected.add('Vite');
    if (window.Solid || document.querySelector('[data-solid]')) detected.add('Solid.js');

    // CMS & Site Builders
    if (window.Webflow || document.querySelector('html[data-wf-page], html[data-wf-site]')) detected.add('Webflow');
    if (window.wp || document.querySelector('link[href*="wp-content"], script[src*="wp-includes"]')) detected.add('WordPress');
    if (window.Shopify || document.querySelector('script[src*="cdn.shopify.com"]')) detected.add('Shopify');
    if (window.wixEmbedsAPI || document.querySelector('meta[name="generator"][content*="Wix"]')) detected.add('Wix');
    if (window.Squarespace || document.querySelector('script[src*="squarespace.com"]')) detected.add('Squarespace');
    if (document.querySelector('meta[name="generator"][content*="Ghost"]')) detected.add('Ghost CMS');

    // UI Frameworks & CSS Libraries
    const allClasses = Array.from(document.querySelectorAll('[class]')).slice(0, 300).map(el => el.className).join(' ');
    const hasTailwind = /\b(flex|grid|inline-flex|text-(?:sm|base|lg|xl|2xl|[a-z]+-\d+)|bg-(?:[a-z]+-\d+|transparent|white|black)|p-[0-9.]+|px-[0-9.]+|py-[0-9.]+|m-[0-9.]+|rounded-(?:sm|md|lg|xl|2xl|full)|shadow-(?:sm|md|lg|xl)|space-[xy]-\d+|gap-\d+)\b/.test(allClasses);
    if (hasTailwind) detected.add('Tailwind CSS');

    const hasBootstrap = document.querySelector('[class*="col-"], [class*="container-fluid"], [class*="navbar-expand"], .btn-primary, .modal-dialog');
    if (hasBootstrap) detected.add('Bootstrap');

    const hasBulma = document.querySelector('.columns, .column, .is-primary, .hero-body');
    if (hasBulma && !hasTailwind) detected.add('Bulma');

    const hasChakra = document.querySelector('[class*="chakra-"], [data-chakra-component]');
    if (hasChakra) detected.add('Chakra UI');

    const hasMUI = document.querySelector('[class*="MuiButton-"], [class*="MuiGrid-"], [class*="MuiTypography-"]');
    if (hasMUI) detected.add('Material UI (MUI)');

    const hasRadix = document.querySelector('[data-radix-collection-item], [data-radix-popper-content-wrapper]');
    if (hasRadix) detected.add('Radix UI / Shadcn UI');

    // JS Animation / Utility Libraries
    if (window.jQuery || window.$?.fn?.jquery) {
      const ver = window.jQuery?.fn?.jquery || window.$?.fn?.jquery || '';
      detected.add('jQuery' + (ver ? ` v${ver}` : ''));
    }
    if (window.gsap || window.TweenMax) detected.add('GSAP (GreenSock)');
    if (window.Swiper || document.querySelector('.swiper, .swiper-container, .swiper-wrapper')) detected.add('Swiper.js');
    if (window.Splide || document.querySelector('.splide')) detected.add('Splide.js');
    if (window.Flickity || document.querySelector('.flickity-enabled')) detected.add('Flickity');
    if (window.AOS || document.querySelector('[data-aos]')) detected.add('AOS (Animate on Scroll)');
    if (window.anime) detected.add('Anime.js');
    if (window.THREE) detected.add('Three.js');
    if (window.lucide || document.querySelector('[data-lucide]')) detected.add('Lucide Icons');
    if (document.querySelector('.fa, .fas, .far, .fab, [class*="fa-"]')) detected.add('FontAwesome');

    return Array.from(detected).length > 0 ? Array.from(detected).join(', ') : 'Vanilla HTML / CSS / JS';
  }

  /* ─── 3. CSS VARIABLES (:ROOT & THEMES) ─────────────────────── */
  function extractCSSVariables() {
    const vars = {};
    try {
      // 1. From document stylesheets
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach(rule => {
              if (rule.selectorText === ':root' || rule.selectorText === 'html' || rule.selectorText === ':root, [data-theme]') {
                const text = rule.cssText;
                const matches = text.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g);
                for (const m of matches) {
                  vars['--' + m[1].trim()] = m[2].trim();
                }
              }
            });
          }
        } catch (e) {
          // Cross-origin stylesheet security check ignored
        }
      });

      // 2. From inline style tags
      document.querySelectorAll('style').forEach(style => {
        const text = style.textContent || '';
        const rootMatches = text.matchAll(/:root\s*\{([^}]+)\}/g);
        for (const rm of rootMatches) {
          const inner = rm[1];
          const varMatches = inner.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g);
          for (const vm of varMatches) {
            vars['--' + vm[1].trim()] = vm[2].trim();
          }
        }
      });

      // 3. Fallback: inspect computed styles of root for known design tokens if few found
      if (Object.keys(vars).length < 5) {
        const rootStyle = getComputedStyle(document.documentElement);
        // Common token names
        const commonTokens = [
          '--primary', '--secondary', '--accent', '--background', '--foreground',
          '--muted', '--muted-foreground', '--border', '--input', '--ring',
          '--radius', '--font-sans', '--font-mono', '--color-primary', '--color-bg'
        ];
        commonTokens.forEach(t => {
          const val = rootStyle.getPropertyValue(t).trim();
          if (val) vars[t] = val;
        });
      }
    } catch (err) {
      console.warn('extractCSSVariables error:', err);
    }
    return vars;
  }

  /* ─── 4. COLOR PALETTE ──────────────────────────────────────── */
  function extractColors() {
    const colorMap = {};
    const elements = Array.from(document.querySelectorAll('*')).slice(0, 500);

    const isTransparent = (c) => {
      if (!c) return true;
      const lower = c.toLowerCase().replace(/\s+/g, '');
      return lower === 'transparent' ||
             lower === 'rgba(0,0,0,0)' ||
             lower === 'rgba(255,255,255,0)' ||
             lower === 'inherit' ||
             lower === 'initial' ||
             lower === 'none';
    };

    // Color conversion helper for grouping
    const rgbToHex = (col) => {
      if (!col) return col;
      if (col.startsWith('#')) return col.toUpperCase();
      const rgb = col.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!rgb) return col;
      return '#' + [rgb[1], rgb[2], rgb[3]].map(x => {
        const hex = parseInt(x, 10).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    };

    elements.forEach(el => {
      try {
        const cs = getComputedStyle(el);
        ['color', 'backgroundColor', 'borderColor', 'outlineColor'].forEach(prop => {
          const val = cs[prop];
          if (!isTransparent(val)) {
            const hex = rgbToHex(val);
            colorMap[hex] = (colorMap[hex] || 0) + 1;
          }
        });

        // SVG elements fill & stroke
        if (el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'path') {
          const fill = cs.fill;
          const stroke = cs.stroke;
          if (!isTransparent(fill)) {
            const hex = rgbToHex(fill);
            colorMap[hex] = (colorMap[hex] || 0) + 1;
          }
          if (!isTransparent(stroke)) {
            const hex = rgbToHex(stroke);
            colorMap[hex] = (colorMap[hex] || 0) + 1;
          }
        }
      } catch {}
    });

    return Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([color, freq]) => ({ color, frequency: freq }));
  }

  /* ─── 5. FONTS & TYPOGRAPHY ─────────────────────────────────── */
  function extractFonts() {
    const fontFamilies = new Set();
    const fontSizes = new Set();
    const fontWeights = new Set();

    Array.from(document.querySelectorAll('*')).slice(0, 350).forEach(el => {
      try {
        const cs = getComputedStyle(el);
        if (cs.fontFamily) {
          // Clean quotes
          const cleanFamily = cs.fontFamily.replace(/['"]/g, '').trim();
          if (cleanFamily) fontFamilies.add(cleanFamily);
        }
        if (cs.fontSize && cs.fontSize !== '0px') fontSizes.add(cs.fontSize);
        if (cs.fontWeight) fontWeights.add(cs.fontWeight);
      } catch {}
    });

    // Font link tags (Google Fonts, Adobe Fonts, Typekit, etc.)
    const fontLinks = Array.from(document.querySelectorAll('link[href*="font"], link[href*="fonts.googleapis.com"], link[href*="use.typekit.net"]'))
      .map(l => l.href);

    // Collect @font-face rules
    let fontFaces = [];
    document.querySelectorAll('style').forEach(s => {
      const text = s.textContent || '';
      const matches = text.match(/@font-face\s*\{[^}]+\}/g);
      if (matches) fontFaces.push(...matches);
    });

    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach(rule => {
              if (rule.type === CSSRule.FONT_FACE_RULE) {
                fontFaces.push(rule.cssText);
              }
            });
          }
        } catch {}
      });
    } catch {}

    const sortedSizes = Array.from(fontSizes).sort((a, b) => parseFloat(b) - parseFloat(a));

    return {
      families: Array.from(fontFamilies).slice(0, 15),
      sizes: sortedSizes.slice(0, 15),
      weights: Array.from(fontWeights).sort((a, b) => parseInt(a) - parseInt(b)),
      links: fontLinks,
      fontFaces: fontFaces.slice(0, 10).join('\n')
    };
  }

  function extractTypography() {
    const typo = {};
    const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'input', 'label', 'li', 'span', 'small', 'blockquote', 'code'];

    tags.forEach(tag => {
      const el = document.querySelector(tag);
      if (el) {
        try {
          const cs = getComputedStyle(el);
          typo[tag] = {
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
            letterSpacing: cs.letterSpacing,
            textTransform: cs.textTransform,
            color: cs.color,
            textDecoration: cs.textDecorationLine || cs.textDecoration
          };
        } catch {}
      }
    });

    return typo;
  }

  /* ─── 6. SHADOWS & BORDER RADIUS ────────────────────────────── */
  function extractShadows() {
    const shadows = new Set();
    Array.from(document.querySelectorAll('*')).slice(0, 400).forEach(el => {
      try {
        const cs = getComputedStyle(el);
        if (cs.boxShadow && cs.boxShadow !== 'none') shadows.add(cs.boxShadow);
        if (cs.textShadow && cs.textShadow !== 'none') shadows.add('text-shadow: ' + cs.textShadow);
        if (cs.filter && cs.filter !== 'none' && cs.filter.includes('drop-shadow')) shadows.add('filter: ' + cs.filter);
      } catch {}
    });
    return Array.from(shadows).slice(0, 15);
  }

  function extractBorderRadius() {
    const radii = new Set();
    const selectors = 'button, [class*="btn"], [class*="card"], [class*="tag"], [class*="badge"], [class*="pill"], img, input, select, textarea, [class*="box"], [class*="modal"], [class*="dialog"]';
    Array.from(document.querySelectorAll(selectors)).slice(0, 100).forEach(el => {
      try {
        const cs = getComputedStyle(el);
        const r = cs.borderRadius;
        if (r && r !== '0px' && r !== '0') radii.add(r);
      } catch {}
    });
    return Array.from(radii).slice(0, 12);
  }

  /* ─── 7. IMAGES & MEDIA ─────────────────────────────────────── */
  function extractImages() {
    const imgs = Array.from(document.querySelectorAll('img')).map(img => {
      let role = 'content';
      const parentClasses = (img.parentElement?.className || '') + ' ' + (img.className || '');
      const src = img.currentSrc || img.src || '';

      if (/logo|brand|site-icon/i.test(parentClasses) || /logo/i.test(src) || /logo/i.test(img.alt)) {
        role = 'logo';
      } else if (/avatar|user|profile|author|thumb/i.test(parentClasses)) {
        role = 'avatar';
      } else if (/hero|banner|cover|feature|splash/i.test(parentClasses)) {
        role = 'hero';
      } else if (/icon|badge/i.test(parentClasses) || (img.naturalWidth < 48 && img.naturalHeight < 48 && img.naturalWidth > 0)) {
        role = 'icon';
      } else if (/product|item|gallery/i.test(parentClasses)) {
        role = 'product';
      }

      return {
        src,
        alt: img.alt || '',
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
        loading: img.loading || 'eager',
        role
      };
    }).filter(i => i.src && !i.src.startsWith('data:image/svg+xml;base64,PHN2Zw'));

    // Background images
    const bgImages = new Set();
    Array.from(document.querySelectorAll('*')).slice(0, 400).forEach(el => {
      try {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none' && bg.includes('url(')) {
          const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
          if (match && !match[1].startsWith('data:')) {
            bgImages.add(match[1]);
          }
        }
      } catch {}
    });

    const svgs = Array.from(document.querySelectorAll('svg'));
    const svgCount = svgs.length;
    const svgSamples = svgs.slice(0, 8).map(s => {
      const clone = s.cloneNode(true);
      // Clean unnecessary attributes
      clone.removeAttribute('style');
      return clone.outerHTML.slice(0, 350);
    });

    const iconLinks = Array.from(document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]')).map(l => l.href);

    // Videos and iframes
    const videoCount = document.querySelectorAll('video, audio, iframe[src*="youtube"], iframe[src*="vimeo"]').length;

    return {
      imgs: imgs.slice(0, 60),
      bgImages: Array.from(bgImages).slice(0, 30),
      svgCount,
      svgSamples,
      iconLinks,
      videoCount
    };
  }

  /* ─── 8. LAYOUT & GRID/FLEX STRUCTURE ───────────────────────── */
  function extractLayoutInfo() {
    const body = document.body || document.documentElement;
    const html = document.documentElement;
    const semanticTags = ['header', 'nav', 'main', 'footer', 'aside', 'section', 'article', 'dialog', 'figure', 'form'];
    const sections = semanticTags.map(tag => {
      const count = document.querySelectorAll(tag).length;
      return count > 0 ? `${tag}: ${count}` : null;
    }).filter(Boolean);

    const gridEls = [];
    const flexEls = [];

    Array.from(document.querySelectorAll('*')).slice(0, 450).forEach(el => {
      try {
        const cs = getComputedStyle(el);
        const identifier = el.tagName.toLowerCase() +
          (el.id ? '#' + el.id : '') +
          (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '');

        if (cs.display === 'grid' || cs.display === 'inline-grid') {
          gridEls.push({
            el: identifier,
            cols: cs.gridTemplateColumns,
            rows: cs.gridTemplateRows,
            gap: cs.gap,
            alignItems: cs.alignItems,
            justifyContent: cs.justifyContent
          });
        }
        if (cs.display === 'flex' || cs.display === 'inline-flex') {
          flexEls.push({
            el: identifier,
            direction: cs.flexDirection,
            wrap: cs.flexWrap,
            justify: cs.justifyContent,
            align: cs.alignItems,
            gap: cs.gap
          });
        }
      } catch {}
    });

    return {
      sections,
      viewportWidth: window.innerWidth || 1440,
      viewportHeight: window.innerHeight || 900,
      totalHeight: Math.max(body?.scrollHeight || 0, html?.scrollHeight || 0),
      scrollWidth: Math.max(body?.scrollWidth || 0, html?.scrollWidth || 0),
      grids: [...new Map(gridEls.map(g => [g.el, g])).values()].slice(0, 15),
      flexboxes: [...new Map(flexEls.map(f => [f.el, f])).values()].slice(0, 15)
    };
  }

  /* ─── 9. SPACING TOKENS ─────────────────────────────────────── */
  function extractSpacing() {
    const unique = new Map();
    const importantEls = document.querySelectorAll('section, article, header, footer, main, aside, .container, .wrapper, .content, .hero, .card, main > div');

    Array.from(importantEls).slice(0, 50).forEach(el => {
      try {
        const cs = getComputedStyle(el);
        const key = el.tagName.toLowerCase() +
          (el.id ? '#' + el.id : '') +
          (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '');

        if (!unique.has(key)) {
          unique.set(key, {
            el: key,
            padding: cs.padding,
            margin: cs.margin,
            gap: cs.gap,
            maxWidth: cs.maxWidth
          });
        }
      } catch {}
    });

    return Array.from(unique.values()).slice(0, 18);
  }

  /* ─── 10. ANIMATIONS & TRANSITIONS ──────────────────────────── */
  function extractAnimations() {
    const animations = new Set();
    const transitions = new Set();

    Array.from(document.querySelectorAll('*')).slice(0, 450).forEach(el => {
      try {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== 'none') {
          animations.add(`${cs.animationName} (duration: ${cs.animationDuration}, timing: ${cs.animationTimingFunction}, delay: ${cs.animationDelay}, iteration: ${cs.animationIterationCount})`);
        }
        if (cs.transition && cs.transition !== 'all 0s ease 0s' && cs.transition !== 'none') {
          transitions.add(cs.transition);
        }
      } catch {}
    });

    const allKeyframes = [];
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach(rule => {
              if (rule.type === CSSRule.KEYFRAMES_RULE) {
                allKeyframes.push(rule.cssText);
              }
            });
          }
        } catch {}
      });
    } catch {}

    // Also inspect style tags
    document.querySelectorAll('style').forEach(s => {
      const text = s.textContent || '';
      const matches = text.match(/@keyframes\s+[\w-]+\s*\{[\s\S]*?\}\s*\}/g);
      if (matches) allKeyframes.push(...matches);
    });

    return {
      animations: Array.from(animations).slice(0, 25),
      transitions: Array.from(transitions).slice(0, 25),
      keyframes: allKeyframes.slice(0, 12).join('\n\n').slice(0, 6000)
    };
  }

  /* ─── 11. CLEAN SEMANTIC DOM SERIALIZATION ──────────────────── */
  function extractDOMStructure() {
    const IGNORE_TAGS = new Set(['script', 'style', 'noscript', 'meta', 'link', 'title', 'head', 'template', 'iframe']);

    function serialize(node, depth) {
      if (depth > 6 || node.nodeType !== 1) return '';
      const tag = node.tagName.toLowerCase();
      if (IGNORE_TAGS.has(tag)) return '';

      // Special handling for SVG
      if (tag === 'svg') {
        const cls = node.className && typeof node.className === 'string' ? '.' + node.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        return '  '.repeat(depth) + `<svg${cls} [inline SVG icon] />`;
      }

      const id = node.id ? `#${node.id}` : '';
      const cls = node.className && typeof node.className === 'string'
        ? '.' + node.className.trim().split(/\s+/).slice(0, 4).join('.')
        : '';

      const attrs = [];
      ['href', 'src', 'alt', 'type', 'role', 'aria-label', 'placeholder', 'data-component', 'data-section', 'data-tab', 'data-accordion', 'target'].forEach(a => {
        const val = node.getAttribute(a);
        if (val) attrs.push(`${a}="${val.slice(0, 50)}"`);
      });
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

      // Direct text content (first level)
      let text = '';
      for (const child of node.childNodes) {
        if (child.nodeType === 3 && child.textContent.trim().length > 0) {
          text += child.textContent.trim() + ' ';
        }
      }
      text = text.trim().slice(0, 80);
      const textStr = text ? ` "${text}"` : '';

      const indent = '  '.repeat(depth);
      const line = `${indent}<${tag}${id}${cls}${attrStr}>${textStr}`;

      const children = Array.from(node.children)
        .slice(0, 12)
        .map(c => serialize(c, depth + 1))
        .filter(Boolean)
        .join('\n');

      return children ? line + '\n' + children : line;
    }

    const root = document.body || document.documentElement;
    return serialize(root, 0).slice(0, 14000);
  }

  /* ─── 12. 22+ UI COMPONENT DETECTION ────────────────────────── */
  function extractComponents() {
    const found = [];
    const checks = [
      { name: 'Navigation / Navbar', sel: 'nav, [role="navigation"], header nav, [class*="navbar"], [class*="nav-bar"], [class*="topbar"], [class*="header-nav"]' },
      { name: 'Hero / Banner Section', sel: '[class*="hero"], [class*="banner"], [class*="jumbotron"], [class*="intro-section"], [class*="headline-section"], header + section' },
      { name: 'Card Grid / Features', sel: '[class*="card"], [class*="grid-card"], [class*="tile"], [class*="product-item"], [class*="post-card"], [class*="feature-card"], [class*="service-item"]' },
      { name: 'Button / Call-to-Action (CTA)', sel: 'button, [class*="btn"], [role="button"], [class*="cta"], a[class*="button"], a[class*="btn"]' },
      { name: 'Form / Input Controls', sel: 'form, input:not([type="hidden"]), textarea, select, [class*="form-group"]' },
      { name: 'Modal / Dialog / Drawer', sel: '[class*="modal"], [class*="dialog"], [role="dialog"], [class*="overlay"], [class*="drawer"], [class*="sheet"]' },
      { name: 'Carousel / Slider', sel: '[class*="slider"], [class*="carousel"], [class*="swiper"], [class*="splide"], [class*="slick"], [class*="glide"]' },
      { name: 'Tabs / Segmented Control', sel: '[role="tablist"], [class*="tabs"], [class*="tab-nav"], [class*="tab-container"]' },
      { name: 'Accordion / Collapse / FAQ', sel: 'details, summary, [class*="accordion"], [class*="collapse"], [class*="faq-item"]' },
      { name: 'Dropdown / Popover / Menu', sel: '[class*="dropdown"], [class*="popover"], [class*="context-menu"], [aria-haspopup="true"]' },
      { name: 'Table / Data Grid', sel: 'table, thead, tbody, [role="table"], [class*="datatable"]' },
      { name: 'Sidebar / Offcanvas Nav', sel: 'aside, [class*="sidebar"], [class*="side-nav"], [class*="left-nav"], [role="complementary"]' },
      { name: 'Footer', sel: 'footer, [class*="footer"], [role="contentinfo"]' },
      { name: 'Breadcrumbs', sel: '[class*="breadcrumb"], [aria-label*="breadcrumb"], nav ol' },
      { name: 'Notification / Toast / Alert', sel: '[class*="toast"], [class*="alert"], [class*="snackbar"], [role="alert"], [class*="banner-alert"], [class*="notice"]' },
      { name: 'Search Bar / Search Box', sel: '[class*="search"], [role="search"], input[type="search"], form[action*="search"]' },
      { name: 'Pagination / Page Switcher', sel: '[class*="pagination"], [class*="pager"], [aria-label*="pagination"]' },
      { name: 'Progress Bar / Spinner / Loader', sel: '[class*="progress"], [class*="spinner"], [class*="skeleton"], [role="progressbar"], [class*="loading-bar"]' },
      { name: 'Badge / Tag / Chip / Pill', sel: '[class*="badge"], [class*="tag"], [class*="chip"], [class*="pill"], [class*="label-status"]' },
      { name: 'Avatar / Profile Image', sel: '[class*="avatar"], [class*="profile-pic"], [class*="user-img"], [class*="author-img"]' },
      { name: 'Video / Audio Player', sel: 'video, audio, [class*="player"], [class*="video-wrap"], iframe[src*="youtube"], iframe[src*="vimeo"]' },
      { name: 'Map / Geolocation Embed', sel: '[class*="map"], [id*="map"], iframe[src*="maps.google"], iframe[src*="mapbox"]' },
      { name: 'Pricing Table / Plan Cards', sel: '[class*="pricing"], [class*="plan-card"], [class*="price-table"], [class*="tier-card"]' },
      { name: 'Testimonial / Review Cards', sel: '[class*="testimonial"], [class*="review-card"], [class*="feedback-card"], [class*="client-quote"]' },
      { name: 'Stats / Counter Badges', sel: '[class*="stats"], [class*="counter"], [class*="metric"], [class*="kpi"]' }
    ];

    checks.forEach(({ name, sel }) => {
      try {
        const matches = document.querySelectorAll(sel);
        const count = matches.length;
        if (count > 0) {
          const sample = matches[0];
          const sampleClasses = sample?.className && typeof sample.className === 'string'
            ? sample.className.trim().split(/\s+/).slice(0, 4).join(' ')
            : '';
          found.push({
            name,
            count,
            classes: sampleClasses,
            summary: `${name}: ${count}x (sample classes: "${sampleClasses}")`
          });
        }
      } catch {}
    });

    return found;
  }

  /* ─── 13. INTERACTION & BEHAVIOR HEURISTICS ─────────────────── */
  function detectInteractions() {
    const hints = [];
    if (document.querySelector('[class*="dropdown"], [class*="toggle"], [aria-haspopup="true"]')) {
      hints.push('Dropdown / Flyout menus (hover / click to toggle)');
    }
    if (document.querySelector('[class*="modal"], [class*="lightbox"], [data-bs-toggle="modal"], [data-toggle="modal"]')) {
      hints.push('Modal / Lightbox dialog with backdrop');
    }
    if (document.querySelector('[class*="carousel"], [class*="slider"], [class*="swiper"], [class*="splide"]')) {
      hints.push('Carousel / Slider with navigation arrows & pagination bullets');
    }
    if (document.querySelector('[class*="accordion"], [class*="collapse"], details, summary')) {
      hints.push('Accordion / Collapsible sections (single / multi-expand)');
    }
    if (document.querySelector('[class*="tooltip"], [data-tooltip], [data-bs-toggle="tooltip"], [title]')) {
      hints.push('Tooltips & Hover info popups');
    }
    if (document.querySelector('[data-aos], [class*="aos"], [class*="animate-on-scroll"], [data-scroll]')) {
      hints.push('Scroll-triggered animations (AOS / ScrollMagic / Reveal)');
    }
    if (document.querySelector('[class*="sticky"], [class*="fixed-top"], [class*="affix"]') ||
        Array.from(document.querySelectorAll('header, nav, aside')).some(el => {
          const pos = getComputedStyle(el).position;
          return pos === 'sticky' || pos === 'fixed';
        })) {
      hints.push('Sticky / Fixed Header with scroll background elevation');
    }
    if (document.querySelector('[class*="parallax"], [data-parallax]')) {
      hints.push('Parallax scrolling background / floating layers');
    }
    if (document.querySelector('[class*="lazy"], [loading="lazy"], [data-src]')) {
      hints.push('Lazy loading images & blur-up placeholder');
    }
    if (document.querySelector('form[class*="search"], input[type="search"]')) {
      hints.push('Search bar with interactive auto-suggestions / filters');
    }
    if (document.querySelector('[class*="infinite"], [class*="load-more"], [data-loadmore]')) {
      hints.push('Infinite scroll / Load More dynamic pagination');
    }
    if (window.IntersectionObserver && document.querySelector('[class*="reveal"], [class*="fade-in"], [class*="slide-up"]')) {
      hints.push('Intersection Observer fade-in & slide-up entry animations');
    }
    if (document.querySelector('[class*="theme-toggle"], [class*="dark-mode"], button[aria-label*="theme"], button[aria-label*="dark"]')) {
      hints.push('Dark / Light theme toggle switch');
    }
    if (document.querySelector('[class*="back-to-top"], [class*="scroll-top"], #scrollUp')) {
      hints.push('Back to top floating button on scroll');
    }
    if (document.querySelector('button[class*="hamburger"], button[class*="navbar-toggler"], [aria-label*="menu"]')) {
      hints.push('Mobile responsive hamburger menu drawer');
    }

    return hints;
  }

  /* ─── 14. RESPONSIVE BREAKPOINTS ────────────────────────────── */
  function detectResponsive() {
    const breakpoints = new Set();
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach(rule => {
              if (rule.type === CSSRule.MEDIA_RULE) {
                const q = rule.conditionText || rule.media?.mediaText || '';
                if (q) breakpoints.add(q);
              }
            });
          }
        } catch {}
      });
    } catch {}

    // Also inspect style tags
    document.querySelectorAll('style').forEach(s => {
      const text = s.textContent || '';
      const matches = text.matchAll(/@media\s*([^{]+)\{/g);
      for (const m of matches) {
        breakpoints.add(m[1].trim());
      }
    });

    const list = Array.from(breakpoints);
    return list.length > 0 ? list.slice(0, 20) : [
      '(max-width: 640px)',
      '(max-width: 768px)',
      '(max-width: 1024px)',
      '(max-width: 1280px)',
      '(min-width: 1024px)'
    ];
  }

  /* ─── 15. ACCESSIBILITY & A11Y ───────────────────────────────── */
  function extractAccessibility() {
    const hints = [];
    const ariaCount = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-hidden]').length;
    if (ariaCount > 0) hints.push(`Extensive ARIA attributes used (${ariaCount} elements)`);

    const roles = new Set();
    document.querySelectorAll('[role]').forEach(el => {
      const r = el.getAttribute('role');
      if (r) roles.add(r);
    });
    if (roles.size > 0) hints.push(`Semantic ARIA roles: ${Array.from(roles).slice(0, 10).join(', ')}`);

    const imgs = document.querySelectorAll('img');
    if (imgs.length > 0) {
      const withAlt = Array.from(imgs).filter(i => i.hasAttribute('alt')).length;
      const pct = Math.round((withAlt / imgs.length) * 100);
      hints.push(`Image alt attribute coverage: ${pct}% (${withAlt}/${imgs.length})`);
    }

    if (document.querySelector(':focus-visible, [class*="focus-visible"], :focus')) {
      hints.push('Dedicated focus-visible ring styles implemented for keyboard navigation');
    }

    if (document.querySelector('a[href^="#main"], [class*="skip-to-content"], [class*="skip-link"]')) {
      hints.push('Skip-to-content accessible navigation link found');
    }

    return hints;
  }

  /* ─── 16. EXTERNAL SCRIPTS & STYLES ─────────────────────────── */
  function extractExternal() {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
      .map(s => s.src)
      .filter(s => !s.includes('chrome-extension://') && !s.includes('moz-extension://') && !s.includes('google-analytics') && !s.includes('googletagmanager'));

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);

    return {
      scripts: scripts.slice(0, 25),
      styles: styles.slice(0, 25)
    };
  }

  /* ─── 17. FULL CSS SOURCE CAPTURE ───────────────────────────── */
  function extractFullCSS() {
    const blocks = [];
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            Array.from(rules).forEach(rule => {
              blocks.push(rule.cssText);
            });
          }
        } catch {}
      });
    } catch {}

    const inlineStyles = Array.from(document.querySelectorAll('style')).map(s => s.textContent || '').join('\n');
    const combined = (blocks.join('\n') + '\n' + inlineStyles).trim();
    return combined.slice(0, 25000);
  }

  /* ─── RETURN FULL TELEMETRY OBJECT ──────────────────────────── */
  return {
    meta: extractMeta(),
    framework: detectFramework(),
    cssVariables: extractCSSVariables(),
    colors: extractColors(),
    fonts: extractFonts(),
    typography: extractTypography(),
    shadows: extractShadows(),
    borderRadius: extractBorderRadius(),
    images: extractImages(),
    layout: extractLayoutInfo(),
    spacing: extractSpacing(),
    animations: extractAnimations(),
    domStructure: extractDOMStructure(),
    components: extractComponents(),
    interactions: detectInteractions(),
    responsive: detectResponsive(),
    accessibilityHints: extractAccessibility(),
    external: extractExternal(),
    fullCSS: extractFullCSS(),
    timestamp: new Date().toISOString()
  };
}

// Support CommonJS export if required in Node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractAllTelemetry
  };
}
