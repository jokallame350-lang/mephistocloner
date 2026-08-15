/**
 * SitePrompter Web - CSS Resolver Module
 * Fetches cross-origin stylesheets that cannot be read via cssRules in browser context,
 * resolves remote CSS rules, extracts design tokens, keyframes, and media queries,
 * and merges them cleanly into telemetry.
 */

const https = require('https');
const http = require('http');

/**
 * Fetch external CSS text safely with timeout and size limits
 * @param {string} url - Stylesheet URL
 * @param {number} timeoutMs - Timeout in ms
 * @param {number} maxBytes - Max byte size allowed
 * @returns {Promise<string>}
 */
async function fetchStylesheet(url, timeoutMs = 5000, maxBytes = 150000) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return '';
  }

  // Skip certain tracker / analytics / ad stylesheets
  if (/googletagmanager|google-analytics|doubleclick|facebook|clarity|hotjar/i.test(url)) {
    return '';
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/css,*/*;q=0.1'
      }
    });

    clearTimeout(timer);

    if (!response.ok) {
      return '';
    }

    const text = await response.text();
    return text.slice(0, maxBytes);
  } catch (err) {
    // Network / CORS / timeout error handled gracefully
    return '';
  }
}

/**
 * Batch fetch multiple external stylesheets
 * @param {string[]} urls - Array of stylesheet URLs
 * @param {number} maxConcurrent - Max concurrent requests
 * @returns {Promise<{url: string, content: string}[]>}
 */
async function fetchAllStylesheets(urls = [], maxConcurrent = 6) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))].slice(0, 15);
  const results = [];

  for (let i = 0; i < uniqueUrls.length; i += maxConcurrent) {
    const batch = uniqueUrls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const content = await fetchStylesheet(url);
        return { url, content };
      })
    );
    results.push(...batchResults.filter(r => r.content.length > 0));
  }

  return results;
}

/**
 * Parse CSS string to extract CSS variables, font faces, keyframes, media queries
 * @param {string} cssText 
 */
function parseCssTokens(cssText) {
  const cssVars = {};
  const fontFaces = [];
  const keyframes = [];
  const mediaQueries = new Set();

  if (!cssText || typeof cssText !== 'string') {
    return { cssVars, fontFaces, keyframes, mediaQueries: [] };
  }

  // 1. Extract CSS variables (:root or html)
  const rootMatches = cssText.matchAll(/:root\s*\{([^}]+)\}/gi);
  for (const rm of rootMatches) {
    const inner = rm[1];
    const varMatches = inner.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g);
    for (const vm of varMatches) {
      cssVars['--' + vm[1].trim()] = vm[2].trim();
    }
  }

  // 2. Extract @font-face
  const fontFaceMatches = cssText.match(/@font-face\s*\{[\s\S]*?\}/gi);
  if (fontFaceMatches) {
    fontFaces.push(...fontFaceMatches.slice(0, 10));
  }

  // 3. Extract @keyframes accurately using brace counting
  let idx = 0;
  while ((idx = cssText.indexOf('@keyframes', idx)) !== -1) {
    const startIdx = idx;
    const firstBrace = cssText.indexOf('{', startIdx);
    if (firstBrace === -1) break;

    let depth = 0;
    let endIdx = -1;
    for (let i = firstBrace; i < cssText.length; i++) {
      if (cssText[i] === '{') depth++;
      else if (cssText[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      const kfBlock = cssText.slice(startIdx, endIdx).trim();
      if (kfBlock) keyframes.push(kfBlock);
      idx = endIdx;
    } else {
      idx += 10;
    }
  }

  // 4. Extract @media
  const mediaMatches = cssText.matchAll(/@media\s*([^{]+)\{/gi);
  for (const mm of mediaMatches) {
    mediaQueries.add(mm[1].trim());
  }

  return {
    cssVars,
    fontFaces,
    keyframes,
    mediaQueries: Array.from(mediaQueries)
  };
}

/**
 * Enriches telemetry with external CSS tokens if browser context missed them due to CORS
 * @param {object} telemetry - Raw telemetry from extractor
 * @param {string} baseUrl - Base page URL
 * @returns {Promise<object>} - Enriched telemetry
 */
async function enrichTelemetryWithExternalCSS(telemetry, baseUrl) {
  if (!telemetry || !telemetry.external || !Array.isArray(telemetry.external.styles)) {
    return telemetry;
  }

  const externalStyles = telemetry.external.styles;
  if (externalStyles.length === 0) {
    return telemetry;
  }

  // Resolve relative URLs if needed
  const resolvedUrls = externalStyles.map(u => {
    try {
      return new URL(u, baseUrl).href;
    } catch {
      return u;
    }
  });

  const fetchedStyles = await fetchAllStylesheets(resolvedUrls);
  const combinedExternalCSS = fetchedStyles.map(s => `/* Source: ${s.url} */\n` + s.content).join('\n\n');

  if (!combinedExternalCSS) {
    return telemetry;
  }

  const tokens = parseCssTokens(combinedExternalCSS);

  // Merge CSS variables
  telemetry.cssVariables = {
    ...tokens.cssVars,
    ...telemetry.cssVariables
  };

  // Merge media queries
  if (tokens.mediaQueries.length > 0) {
    telemetry.responsive = [
      ...new Set([...(telemetry.responsive || []), ...tokens.mediaQueries])
    ].slice(0, 20);
  }

  // Merge keyframes if existing are sparse
  if (tokens.keyframes.length > 0 && (!telemetry.animations?.keyframes || telemetry.animations.keyframes.length < 50)) {
    telemetry.animations = telemetry.animations || {};
    telemetry.animations.keyframes = [
      telemetry.animations.keyframes || '',
      ...tokens.keyframes
    ].filter(Boolean).join('\n\n').slice(0, 6000);
  }

  // Append external CSS to fullCSS up to reasonable limit
  if (telemetry.fullCSS) {
    telemetry.fullCSS = (telemetry.fullCSS + '\n\n/* ── External Stylesheets ── */\n' + combinedExternalCSS).slice(0, 35000);
  } else {
    telemetry.fullCSS = combinedExternalCSS.slice(0, 35000);
  }

  return telemetry;
}

module.exports = {
  fetchStylesheet,
  fetchAllStylesheets,
  parseCssTokens,
  enrichTelemetryWithExternalCSS
};
