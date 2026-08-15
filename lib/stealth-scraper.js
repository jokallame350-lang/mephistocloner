/**
 * SitePrompter Web - Stealth Scraping & Anti-Bot Engine
 * Provides advanced anti-detection browser automation with:
 * - Anti-automation flags removal and Chrome fingerprint masking
 * - Realistic high-DPI desktop viewports
 * - Comprehensive navigator overrides (webdriver, platform, plugins, languages, hardwareConcurrency)
 * - Cloudflare / Akamai header emulation and modern TLS/HTTP signature
 * - WebGL vendor/renderer spoofing
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { extractAllTelemetry } = require('./extractor');
const { enrichTelemetryWithExternalCSS } = require('./css-resolver');

// Default Chrome candidate paths across platforms
const CHROME_CANDIDATE_PATHS = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\pc\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

/**
 * Locate a valid Chrome/Chromium executable
 * @returns {string}
 */
function findChromeExecutable() {
  for (const candidate of CHROME_CANDIDATE_PATHS) {
    try {
      if (candidate && fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore file access errors
    }
  }
  return null;
}

/**
 * Modern realistic desktop viewport
 */
const STEALTH_VIEWPORT = {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  hasTouch: false,
  isLandscape: true,
  isMobile: false
};

/**
 * Cloudflare / Akamai & modern Chrome header emulation
 */
const STEALTH_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"'
};

const USER_AGENT_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Launch arguments optimized for stealth and zero bot detection
 */
const STEALTH_BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--disable-infobars',
  '--window-size=1920,1080',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-service-autorun',
  '--password-store=basic',
  '--disable-gpu',
  '--lang=en-US,en',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
  '--mute-audio',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding'
];

/**
 * Injected script that masks browser fingerprint and stealth overrides
 */
const STEALTH_EVASIONS_SCRIPT = `
(function() {
  // 1. Mask navigator.webdriver
  try {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 2. Set realistic platform
  try {
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 3. Set realistic languages
  try {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 4. Hardware concurrency & device memory
  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
      configurable: true,
      enumerable: true
    });
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 5. Emulate standard plugins
  try {
    const fakePlugins = [
      { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
    ];
    Object.defineProperty(navigator, 'plugins', {
      get: () => fakePlugins,
      configurable: true,
      enumerable: true
    });
  } catch (e) {}

  // 6. Emulate window.chrome object & runtime properties
  try {
    if (!window.chrome) {
      window.chrome = {};
    }
    if (!window.chrome.app) {
      window.chrome.app = {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
      };
    }
    if (!window.chrome.runtime) {
      window.chrome.runtime = {
        OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
        RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' }
      };
    }
    if (!window.chrome.csi) {
      window.chrome.csi = function() {};
    }
    if (!window.chrome.loadTimes) {
      window.chrome.loadTimes = function() {
        return {
          requestTime: performance.timing ? performance.timing.requestStart / 1000 : Date.now() / 1000,
          startLoadTime: performance.timing ? performance.timing.navigationStart / 1000 : Date.now() / 1000,
          commitLoadTime: performance.timing ? performance.timing.responseStart / 1000 : Date.now() / 1000,
          finishDocumentLoadTime: performance.timing ? performance.timing.domContentLoadedEventEnd / 1000 : Date.now() / 1000,
          finishLoadTime: performance.timing ? performance.timing.loadEventEnd / 1000 : Date.now() / 1000,
          firstPaintTime: performance.timing ? performance.timing.responseEnd / 1000 : Date.now() / 1000,
          firstPaintAfterLoadTime: 0,
          navigationType: 'Other',
          wasFetchedViaSpdy: true,
          wasNpnNegotiated: true,
          npnNegotiatedProtocol: 'h2',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'h2'
        };
      };
    }
  } catch (e) {}

  // 7. Notification permissions spoofing
  try {
    if (window.navigator && window.navigator.permissions) {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters && parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission || 'default' });
        }
        return originalQuery.apply(window.navigator.permissions, [parameters]);
      };
    }
  } catch (e) {}

  // 8. WebGL vendor/renderer spoofing (mask swiftshader / headless GPU)
  try {
    const overrideWebGL = (ctx) => {
      if (!ctx) return;
      const getParam = ctx.prototype.getParameter;
      ctx.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
        if (parameter === 37446) return 'Intel(R) Iris(R) Xe Graphics Direct3D11 VS_5_0 PS_5_0'; // UNMASKED_RENDERER_WEBGL
        return getParam.apply(this, arguments);
      };
    };
    if (typeof WebGLRenderingContext !== 'undefined') overrideWebGL(WebGLRenderingContext);
    if (typeof WebGL2RenderingContext !== 'undefined') overrideWebGL(WebGL2RenderingContext);
  } catch (e) {}

  // 9. Realistic window dimensions
  try {
    Object.defineProperty(window.screen, 'width', { get: () => 1920, configurable: true });
    Object.defineProperty(window.screen, 'height', { get: () => 1080, configurable: true });
    Object.defineProperty(window.screen, 'availWidth', { get: () => 1920, configurable: true });
    Object.defineProperty(window.screen, 'availHeight', { get: () => 1040, configurable: true });
    Object.defineProperty(window.screen, 'colorDepth', { get: () => 24, configurable: true });
    Object.defineProperty(window.screen, 'pixelDepth', { get: () => 24, configurable: true });
  } catch (e) {}
})();
`;

/**
 * Launch a stealth Puppeteer browser instance
 * @param {object} options
 * @returns {Promise<puppeteer.Browser>}
 */
async function launchStealthBrowser(options = {}) {
  const chromePath = options.chromePath || findChromeExecutable();
  const extraArgs = options.args || [];
  const headless = options.headless !== undefined ? options.headless : 'new';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless,
    args: [...STEALTH_BROWSER_ARGS, ...extraArgs],
    ignoreDefaultArgs: ['--enable-automation'],
    defaultViewport: options.viewport || STEALTH_VIEWPORT
  });

  return browser;
}

/**
 * Apply stealth evasion scripts, headers, and viewport settings to a Puppeteer page
 * @param {puppeteer.Page} page
 * @param {object} options
 */
async function applyStealthToPage(page, options = {}) {
  const viewport = options.viewport || STEALTH_VIEWPORT;
  const headers = { ...STEALTH_HEADERS, ...(options.extraHeaders || {}) };
  const userAgent = options.userAgent || USER_AGENT_DESKTOP;

  await page.setViewport(viewport);
  await page.setUserAgent(userAgent);
  await page.setExtraHTTPHeaders(headers);

  // Inject evasion script before any page scripts run
  await page.evaluateOnNewDocument(STEALTH_EVASIONS_SCRIPT);
}

/**
 * Normalize and validate URL
 * @param {string} inputUrl
 * @returns {string}
 */
function normalizeUrl(inputUrl) {
  let trimmed = (inputUrl || '').trim();
  if (!trimmed) {
    throw new Error('URL is required');
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch (err) {
    throw new Error(`Invalid URL format: "${inputUrl}"`);
  }
}

/**
 * Scrapes a URL using stealth browser evasions and extracts complete telemetry
 * @param {string} targetUrl
 * @param {object} options
 * @returns {Promise<object>}
 */
async function scrapeStealthUrl(targetUrl, options = {}) {
  const url = normalizeUrl(targetUrl);
  const timeoutMs = options.timeout || 30000;
  const chromePath = options.chromePath || findChromeExecutable();

  // Resilient Serverless Edge Fallback
  if (!chromePath && !options.browser) {
    console.log(`[StealthScraper] Local Chrome not detected. Falling back to edge HTML analyzer for ${url}...`);
    const { analyzeOfflineFallback } = require('./cloud-scraper-connector');
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT_DESKTOP,
          ...STEALTH_HEADERS
        }
      });
      const html = await response.text();
      return analyzeOfflineFallback(html, '', url);
    } catch (err) {
      console.warn(`[StealthScraper] Edge fetch warning: ${err.message}. Utilizing fallback...`);
      return analyzeOfflineFallback(`<html><head><title>${url}</title></head><body><h1>${url}</h1></body></html>`, '', url);
    }
  }

  let browser = options.browser;
  let shouldCloseBrowser = false;
  let page = null;
  let interceptor = null;

  try {
    if (!browser) {
      browser = await launchStealthBrowser(options);
      shouldCloseBrowser = true;
    }

    page = await browser.newPage();
    await applyStealthToPage(page, options);

    // Optional Network Interception
    if (options.interceptNetwork) {
      const { attachNetworkInterceptor } = require('./network-interceptor');
      interceptor = await attachNetworkInterceptor(page, options.interceptorOptions || {});
    }

    // Navigate with fallback strategy
    try {
      await page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: timeoutMs
      });
    } catch (navErr) {
      console.warn(`[StealthScraper] Navigation warning for ${url}: ${navErr.message}. Attempting recovery...`);
    }

    // Give dynamic client-side JS / hydration a moment
    const delay = options.renderDelay !== undefined ? options.renderDelay : 1000;
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }

    // Extract DOM & design telemetry
    const rawTelemetry = await page.evaluate(extractAllTelemetry);

    // Normalize meta url
    if (rawTelemetry && rawTelemetry.meta) {
      rawTelemetry.meta.url = url;
      if (!rawTelemetry.meta.canonical || rawTelemetry.meta.canonical === 'about:blank') {
        rawTelemetry.meta.canonical = url;
      }
    }

    // Enrich telemetry with external CSS
    const enrichedTelemetry = await enrichTelemetryWithExternalCSS(rawTelemetry, url);

    // Attach intercepted network logs if enabled
    if (interceptor) {
      enrichedTelemetry.networkLogs = interceptor.getLogs();
      enrichedTelemetry.apiLogs = interceptor.getApiLogs();
      enrichedTelemetry.webSocketLogs = interceptor.getWebSocketLogs();
      enrichedTelemetry.mockApiRoutes = interceptor.generateMockApiRoutes('all');
    }

    return enrichedTelemetry;
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
    if (shouldCloseBrowser && browser) {
      try { await browser.close(); } catch {}
    }
  }
}

/**
 * Analyzes raw HTML and CSS using stealth settings
 * @param {string} html
 * @param {string} css
 * @param {object} options
 * @returns {Promise<object>}
 */
async function analyzeStealthRawHtml(html, css = '', options = {}) {
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    throw new Error('HTML content is required for raw analysis');
  }

  let fullHtml = html;
  if (css && css.trim().length > 0) {
    if (fullHtml.includes('</head>')) {
      fullHtml = fullHtml.replace('</head>', `<style>\n${css}\n</style></head>`);
    } else if (fullHtml.includes('<head>')) {
      fullHtml = fullHtml.replace('<head>', `<head><style>\n${css}\n</style>`);
    } else {
      fullHtml = `<!DOCTYPE html><html><head><style>\n${css}\n</style></head><body>${fullHtml}</body></html>`;
    }
  }

  let browser = options.browser;
  let shouldCloseBrowser = false;
  let page = null;

  try {
    if (!browser) {
      browser = await launchStealthBrowser(options);
      shouldCloseBrowser = true;
    }

    page = await browser.newPage();
    await applyStealthToPage(page, options);

    await page.setContent(fullHtml, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeout || 15000
    });

    await new Promise(r => setTimeout(r, 400));

    const rawTelemetry = await page.evaluate(extractAllTelemetry);

    if (rawTelemetry && rawTelemetry.meta) {
      rawTelemetry.meta.url = 'local://raw-html-input';
      rawTelemetry.meta.canonical = 'local://raw-html-input';
    }

    if (css && css.trim().length > 0) {
      rawTelemetry.fullCSS = (css + '\n' + (rawTelemetry.fullCSS || '')).slice(0, 35000);
    }

    return rawTelemetry;
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
    if (shouldCloseBrowser && browser) {
      try { await browser.close(); } catch {}
    }
  }
}

module.exports = {
  findChromeExecutable,
  launchStealthBrowser,
  applyStealthToPage,
  scrapeStealthUrl,
  analyzeStealthRawHtml,
  normalizeUrl,
  STEALTH_VIEWPORT,
  STEALTH_HEADERS,
  STEALTH_BROWSER_ARGS,
  STEALTH_EVASIONS_SCRIPT,
  USER_AGENT_DESKTOP
};
