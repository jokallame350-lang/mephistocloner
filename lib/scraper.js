/**
 * SitePrompter Web - Puppeteer Chrome Scraping & Telemetry Engine
 * Launches headless Chrome, renders web pages with full JavaScript execution,
 * and extracts comprehensive design tokens, DOM hierarchy, and UX telemetry.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { extractAllTelemetry } = require('./extractor');
const { enrichTelemetryWithExternalCSS } = require('./css-resolver');

// Default Chrome / Edge candidate paths across platforms
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
 * Standard browser launch arguments
 */
const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
  '--window-size=1440,900',
  '--mute-audio',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding'
];

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
 * Scrapes a live URL and extracts complete telemetry
 * @param {string} targetUrl 
 * @param {object} options 
 * @returns {Promise<object>}
 */
async function scrapeUrl(targetUrl, options = {}) {
  const url = normalizeUrl(targetUrl);
  const chromePath = options.chromePath || findChromeExecutable();
  const timeoutMs = options.timeout || 30000;
  const viewport = options.viewport || { width: 1440, height: 900 };

  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: BROWSER_ARGS,
      defaultViewport: viewport
    });

    page = await browser.newPage();

    // Realistic desktop User-Agent & headers
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    });

    // Navigate with fallback strategy
    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: timeoutMs
      });
    } catch (navErr) {
      // Fallback: If networkidle2 times out, try domcontentloaded or proceed
      console.warn(`Navigation to ${url} warning: ${navErr.message}. Attempting recovery...`);
    }

    // Give dynamic client-side JS / hydration / fonts a brief moment to render
    await new Promise(r => setTimeout(r, 1000));

    // Execute in-browser telemetry extractor
    const rawTelemetry = await page.evaluate(extractAllTelemetry);

    // Ensure canonical URL reflects actual target
    if (rawTelemetry && rawTelemetry.meta) {
      rawTelemetry.meta.url = url;
      if (!rawTelemetry.meta.canonical || rawTelemetry.meta.canonical === 'about:blank') {
        rawTelemetry.meta.canonical = url;
      }
    }

    // Enrich telemetry with external stylesheets that were blocked by CORS
    const enrichedTelemetry = await enrichTelemetryWithExternalCSS(rawTelemetry, url);

    return enrichedTelemetry;
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

/**
 * Analyzes raw HTML and optional CSS directly without scraping a remote URL
 * Uses local Puppeteer instance with page.setContent for 100% computed style accuracy
 * @param {string} html - Raw HTML string
 * @param {string} css - Optional raw CSS string
 * @param {object} options 
 * @returns {Promise<object>}
 */
async function analyzeRawHtml(html, css = '', options = {}) {
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    throw new Error('HTML content is required for raw analysis');
  }

  const chromePath = options.chromePath || findChromeExecutable();
  const viewport = options.viewport || { width: 1440, height: 900 };

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

  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: BROWSER_ARGS,
      defaultViewport: viewport
    });

    page = await browser.newPage();
    await page.setContent(fullHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
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
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

module.exports = {
  findChromeExecutable,
  scrapeUrl,
  analyzeRawHtml
};
