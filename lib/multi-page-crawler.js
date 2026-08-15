/**
 * SitePrompter Web - Multi-Page Crawler & Telemetry Aggregation Engine
 * Crawls web applications concurrently (up to 4 pages parallel),
 * discovers internal routes, extracts deep design & layout telemetry,
 * and synthesizes unified multi-page tokens, shared components, and site maps.
 */

const { URL } = require('url');
const { launchStealthBrowser, applyStealthToPage, normalizeUrl } = require('./stealth-scraper');
const { extractAllTelemetry } = require('./extractor');
const { enrichTelemetryWithExternalCSS } = require('./css-resolver');
const { attachNetworkInterceptor, generateMockApiRoutes } = require('./network-interceptor');

/**
 * Common default paths to crawl / analyze
 */
const DEFAULT_DISCOVERY_ROUTES = [
  { path: '/', name: 'Home / Landing', icon: 'fa-house', priority: 1 },
  { path: '/pricing', name: 'Pricing & Plans', icon: 'fa-tags', priority: 2 },
  { path: '/login', name: 'Authentication / Login', icon: 'fa-key', priority: 3 },
  { path: '/dashboard', name: 'App Dashboard', icon: 'fa-chart-line', priority: 4 },
  { path: '/features', name: 'Features & Solutions', icon: 'fa-cubes', priority: 5 }
];

/**
 * Extract internal links from a telemetry object or raw DOM HTML
 * @param {object|string} telemetryOrHtml
 * @param {string} rootUrl
 * @param {number} maxLinks
 * @returns {string[]} Array of normalized relative paths (e.g. ['/pricing', '/about'])
 */
function discoverInternalLinks(telemetryOrHtml, rootUrl, maxLinks = 8) {
  let rootOrigin = '';
  try {
    const parsedRoot = new URL(rootUrl);
    rootOrigin = parsedRoot.origin;
  } catch {
    return [];
  }

  const discoveredPaths = new Set();
  const rawHrefs = [];

  if (typeof telemetryOrHtml === 'object' && telemetryOrHtml !== null) {
    if (Array.isArray(telemetryOrHtml.links)) {
      rawHrefs.push(...telemetryOrHtml.links);
    }
    if (typeof telemetryOrHtml.domStructure === 'string') {
      const matchRegex = /href=["']([^"']+)["']/gi;
      let m;
      while ((m = matchRegex.exec(telemetryOrHtml.domStructure)) !== null) {
        rawHrefs.push(m[1]);
      }
    }
  } else if (typeof telemetryOrHtml === 'string') {
    const matchRegex = /href=["']([^"']+)["']/gi;
    let m;
    while ((m = matchRegex.exec(telemetryOrHtml)) !== null) {
      rawHrefs.push(m[1]);
    }
  }

  for (const rawHref of rawHrefs) {
    if (!rawHref || typeof rawHref !== 'string') continue;
    const trimmed = rawHref.trim();

    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('data:')
    ) {
      continue;
    }

    if (/\.(png|jpe?g|gif|webp|svg|ico|css|js|woff2?|ttf|pdf|zip|mp4|webm)(\?.*)?$/i.test(trimmed)) {
      continue;
    }

    try {
      const resolved = new URL(trimmed, rootUrl);
      if (resolved.origin.toLowerCase() === rootOrigin.toLowerCase()) {
        const cleanPath = resolved.pathname.replace(/\/+$/, '') || '/';
        if (cleanPath !== '/' && cleanPath !== '') {
          discoveredPaths.add(cleanPath);
        }
      }
    } catch {}

    if (discoveredPaths.size >= maxLinks) break;
  }

  return Array.from(discoveredPaths);
}

/**
 * Merge and aggregate color palettes across multiple pages
 * @param {Array<{colors: Array<{color: string, frequency: number}>}>} pageTelemetries
 * @returns {Array<{color: string, frequency: number, pagesCount: number}>}
 */
function aggregateColors(pageTelemetries = []) {
  const colorMap = new Map();

  for (const t of pageTelemetries) {
    if (!t || !Array.isArray(t.colors)) continue;
    const seenOnThisPage = new Set();

    for (const c of t.colors) {
      const hex = (c.color || '').toUpperCase().trim();
      if (!hex || hex === 'TRANSPARENT' || hex === 'INHERIT' || hex === 'CURRENTCOLOR') continue;

      if (!colorMap.has(hex)) {
        colorMap.set(hex, {
          color: hex,
          frequency: c.frequency || 1,
          pagesCount: 1
        });
        seenOnThisPage.add(hex);
      } else {
        const existing = colorMap.get(hex);
        existing.frequency += (c.frequency || 1);
        if (!seenOnThisPage.has(hex)) {
          existing.pagesCount += 1;
          seenOnThisPage.add(hex);
        }
      }
    }
  }

  return Array.from(colorMap.values()).sort((a, b) => b.frequency - a.frequency);
}

/**
 * Merge font typography, CSS variables, and shared components across multiple pages
 * @param {object} rootTelemetry
 * @param {Record<string, object>} pagesMap
 * @returns {object}
 */
function aggregateMultiPageTelemetry(rootTelemetry, pagesMap = {}) {
  const allPages = [
    { path: '/', telemetry: rootTelemetry },
    ...Object.entries(pagesMap).map(([p, t]) => ({ path: p, telemetry: t }))
  ].filter(item => item.telemetry && !item.telemetry.error);

  const telemetries = allPages.map(p => p.telemetry);

  // 1. Aggregated Colors
  const globalColors = aggregateColors(telemetries);

  // 2. Aggregated Fonts
  const fontFamilies = new Set();
  const fontSizes = new Set();
  const fontWeights = new Set();
  const fontLinks = new Set();

  telemetries.forEach(t => {
    if (t.fonts) {
      (t.fonts.families || []).forEach(f => fontFamilies.add(f));
      (t.fonts.sizes || []).forEach(s => fontSizes.add(s));
      (t.fonts.weights || []).forEach(w => fontWeights.add(w));
      (t.fonts.links || []).forEach(l => fontLinks.add(l));
    }
  });

  // 3. Aggregated CSS Variables
  const globalCssVars = {};
  telemetries.forEach(t => {
    if (t.cssVariables) {
      Object.assign(globalCssVars, t.cssVariables);
    }
  });

  // 4. Shared vs Page-Specific Components
  const componentOccurrences = new Map();
  const pageSpecificComponents = {};

  allPages.forEach(({ path, telemetry }) => {
    pageSpecificComponents[path] = [];
    const comps = Array.isArray(telemetry.components) ? telemetry.components : [];

    comps.forEach(c => {
      const name = c.name || c.type || 'Component';
      pageSpecificComponents[path].push(c);

      if (!componentOccurrences.has(name)) {
        componentOccurrences.set(name, {
          name,
          pages: [path],
          totalCount: c.count || 1,
          sampleSummary: c.summary || name
        });
      } else {
        const item = componentOccurrences.get(name);
        if (!item.pages.includes(path)) item.pages.push(path);
        item.totalCount += (c.count || 1);
      }
    });
  });

  const sharedComponents = Array.from(componentOccurrences.values())
    .filter(c => c.pages.length >= 2 || /navbar|navigation|header|footer|sidebar/i.test(c.name));

  // 5. Aggregated Mock APIs if network logs were captured
  const allNetworkLogs = [];
  telemetries.forEach(t => {
    if (Array.isArray(t.networkLogs)) {
      allNetworkLogs.push(...t.networkLogs);
    }
  });
  const mockApiRoutes = allNetworkLogs.length > 0
    ? generateMockApiRoutes(allNetworkLogs, { framework: 'all' })
    : null;

  // 6. Build Site Map summary
  const siteMap = allPages.map(({ path, telemetry }) => ({
    path,
    url: telemetry.meta?.url || path,
    title: telemetry.meta?.title || path,
    status: telemetry.error ? 500 : 200,
    sectionsCount: telemetry.layout?.sections?.length || 0,
    componentsCount: Array.isArray(telemetry.components) ? telemetry.components.length : 0
  }));

  return {
    root: rootTelemetry,
    pages: pagesMap,
    siteMap,
    globalTokens: {
      colors: globalColors,
      fonts: {
        families: Array.from(fontFamilies),
        sizes: Array.from(fontSizes),
        weights: Array.from(fontWeights),
        links: Array.from(fontLinks)
      },
      cssVariables: globalCssVars,
      sharedComponents,
      pageSpecificComponents
    },
    networkApiEndpoints: mockApiRoutes ? mockApiRoutes.endpoints : [],
    mockApiRoutes
  };
}

/**
 * Execute promises with bounded concurrency (default 4)
 * @param {Array<() => Promise<any>>} tasks
 * @param {number} concurrency
 * @returns {Promise<any[]>}
 */
async function runWithConcurrency(tasks = [], concurrency = 4) {
  const results = new Array(tasks.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      try {
        results[index] = await tasks[index]();
      } catch (err) {
        results[index] = { error: err.message };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Scrapes a single page within an existing browser instance
 * @param {puppeteer.Browser} browser
 * @param {string} pageUrl
 * @param {object} options
 * @returns {Promise<object>}
 */
async function scrapePageInBrowser(browser, pageUrl, options = {}) {
  let page = null;
  let interceptor = null;
  const timeoutMs = options.timeout || 25000;

  try {
    page = await browser.newPage();
    await applyStealthToPage(page, options);

    if (options.interceptNetwork) {
      interceptor = await attachNetworkInterceptor(page, options.interceptorOptions || {});
    }

    try {
      await page.goto(pageUrl, {
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: timeoutMs
      });
    } catch (navErr) {
      console.warn(`[Crawler] Navigation warning for ${pageUrl}: ${navErr.message}`);
    }

    const delay = options.renderDelay !== undefined ? options.renderDelay : 600;
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }

    const rawTelemetry = await page.evaluate(extractAllTelemetry);

    if (rawTelemetry && rawTelemetry.meta) {
      rawTelemetry.meta.url = pageUrl;
      if (!rawTelemetry.meta.canonical || rawTelemetry.meta.canonical === 'about:blank') {
        rawTelemetry.meta.canonical = pageUrl;
      }
    }

    const enriched = await enrichTelemetryWithExternalCSS(rawTelemetry, pageUrl);

    if (interceptor) {
      enriched.networkLogs = interceptor.getLogs();
      enriched.apiLogs = interceptor.getApiLogs();
      enriched.webSocketLogs = interceptor.getWebSocketLogs();
      enriched.mockApiRoutes = interceptor.generateMockApiRoutes('all');
    }

    return enriched;
  } catch (err) {
    return {
      error: err.message,
      url: pageUrl,
      meta: { title: 'Failed to crawl page', url: pageUrl },
      colors: [],
      components: [],
      layout: { sections: [] }
    };
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
  }
}

/**
 * Crawls a root URL and multiple subpages concurrently
 * @param {string} targetRootUrl - Root URL to crawl
 * @param {object} options - Options { links, maxConcurrency, maxPages, autoDiscover, ... }
 * @returns {Promise<object>} Aggregated multi-page telemetry
 */
async function crawlMultiPage(targetRootUrl, options = {}) {
  const startTime = Date.now();
  const rootUrl = normalizeUrl(targetRootUrl);
  const maxConcurrency = Math.min(options.maxConcurrency || 4, 4); // Max 4 parallel
  const maxPages = options.maxPages || 6;
  const interceptNetwork = options.interceptNetwork !== undefined ? options.interceptNetwork : true;

  let browser = options.browser;
  let shouldCloseBrowser = false;

  try {
    if (!browser) {
      browser = await launchStealthBrowser(options);
      shouldCloseBrowser = true;
    }

    // 1. Scrape Root Page first
    console.log(`[Crawler] Scraping Root URL: ${rootUrl}`);
    const rootTelemetry = await scrapePageInBrowser(browser, rootUrl, {
      ...options,
      interceptNetwork
    });

    // 2. Determine Subpages to crawl
    let subpagePaths = [];
    if (Array.isArray(options.links) && options.links.length > 0) {
      subpagePaths = options.links;
    } else if (options.autoDiscover !== false) {
      console.log(`[Crawler] Auto-discovering internal links from root page...`);
      subpagePaths = discoverInternalLinks(rootTelemetry, rootUrl, maxPages - 1);
    }

    // Deduplicate and filter root path
    const uniquePaths = Array.from(
      new Set(
        subpagePaths.map(p => {
          if (!p) return '';
          if (p.startsWith('http')) {
            try { return new URL(p).pathname; } catch { return p; }
          }
          return p.startsWith('/') ? p : '/' + p;
        }).filter(p => p && p !== '/' && p !== '')
      )
    ).slice(0, maxPages - 1);

    console.log(`[Crawler] Found ${uniquePaths.length} subpages to crawl concurrently (Max concurrency: ${maxConcurrency}) ->`, uniquePaths);

    // 3. Concurrently crawl subpages
    const pagesMap = {};
    if (uniquePaths.length > 0) {
      const crawlTasks = uniquePaths.map(subPath => {
        const fullSubUrl = new URL(subPath, rootUrl).href;
        return async () => {
          console.log(`[Crawler] Scraping subpage (${subPath}): ${fullSubUrl}`);
          const telemetry = await scrapePageInBrowser(browser, fullSubUrl, {
            ...options,
            interceptNetwork
          });
          return { subPath, fullSubUrl, telemetry };
        };
      });

      const results = await runWithConcurrency(crawlTasks, maxConcurrency);

      results.forEach(res => {
        if (res && res.subPath) {
          pagesMap[res.subPath] = res.telemetry;
        }
      });
    }

    // 4. Synthesize unified multi-page structure
    const aggregated = aggregateMultiPageTelemetry(rootTelemetry, pagesMap);

    // Add crawl statistics
    const totalCrawled = 1 + Object.keys(pagesMap).length;
    const successful = 1 + Object.values(pagesMap).filter(t => !t.error).length;

    aggregated.crawlStats = {
      rootUrl,
      totalPages: totalCrawled,
      successful,
      failed: totalCrawled - successful,
      concurrency: maxConcurrency,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    return aggregated;
  } finally {
    if (shouldCloseBrowser && browser) {
      try { await browser.close(); } catch {}
    }
  }
}

module.exports = {
  crawlMultiPage,
  discoverInternalLinks,
  aggregateColors,
  aggregateMultiPageTelemetry,
  scrapePageInBrowser,
  runWithConcurrency,
  DEFAULT_DISCOVERY_ROUTES
};
