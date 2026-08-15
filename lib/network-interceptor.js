/**
 * SitePrompter Web - Network Interception & Mock API Generator Engine
 * Intercepts XHR, fetch, and WebSocket traffic during page loads,
 * parses headers and JSON payloads, and automatically synthesizes
 * production-ready Express.js & Next.js mock API routes.
 */

const { URL } = require('url');

/**
 * Safely parse JSON strings into objects or fallback to raw string/null
 * @param {string|any} input
 * @returns {any}
 */
function parseJsonSafely(input) {
  if (!input) return null;
  if (typeof input === 'object') return input;
  if (typeof input !== 'string') return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

/**
 * Determine if a request is likely an API / data call
 * @param {string} url
 * @param {string} resourceType
 * @param {string} contentType
 * @returns {boolean}
 */
function isApiRequest(url = '', resourceType = '', contentType = '') {
  const type = (resourceType || '').toLowerCase();
  const cType = (contentType || '').toLowerCase();
  const urlLower = (url || '').toLowerCase();

  if (type === 'xhr' || type === 'fetch') return true;
  if (cType.includes('application/json') || cType.includes('application/ld+json') || cType.includes('application/graphql')) return true;
  if (urlLower.includes('/api/') || urlLower.includes('/v1/') || urlLower.includes('/v2/') || urlLower.includes('/graphql') || urlLower.endsWith('.json')) {
    // Ignore static asset extensions
    if (!/\.(png|jpe?g|gif|webp|svg|ico|css|js|woff2?|ttf|eot|mp4|webm)(\?.*)?$/i.test(urlLower)) {
      return true;
    }
  }
  return false;
}

/**
 * Normalize an API URL into a clean relative pathname suitable for mock endpoints
 * @param {string} rawUrl
 * @returns {{ pathname: string, queryParams: Record<string, string>, origin: string }}
 */
function normalizeApiPath(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return {
      pathname: parsed.pathname,
      queryParams: Object.fromEntries(parsed.searchParams.entries()),
      origin: parsed.origin
    };
  } catch {
    return {
      pathname: rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl,
      queryParams: {},
      origin: ''
    };
  }
}

/**
 * NetworkInterceptor Class
 */
class NetworkInterceptor {
  constructor(page, options = {}) {
    this.page = page;
    this.options = {
      maxBodySizeBytes: options.maxBodySizeBytes || 250000,
      filterStaticAssets: options.filterStaticAssets !== undefined ? options.filterStaticAssets : true,
      captureWebSockets: options.captureWebSockets !== undefined ? options.captureWebSockets : true,
      ...options
    };

    this.logs = [];
    this.requestStartTimes = new Map();
    this.reqCounter = 0;
    this.webSockets = new Map();
    this.cdpSession = null;
    this.isAttached = false;
  }

  /**
   * Attach network request and response listeners
   */
  async attach() {
    if (this.isAttached || !this.page) return this;

    // 1. Listen for Puppeteer page requests
    this._onRequest = (req) => {
      try {
        this.requestStartTimes.set(req, Date.now());
      } catch (err) {}
    };

    // 2. Listen for Puppeteer page responses
    this._onResponse = async (res) => {
      try {
        const req = res.request();
        const url = res.url();
        const method = req.method();
        const resourceType = req.resourceType();
        const status = res.status();
        const statusText = res.statusText();
        const requestHeaders = req.headers() || {};
        const responseHeaders = res.headers() || {};
        const contentType = responseHeaders['content-type'] || '';
        const isJson = contentType.includes('application/json') || contentType.includes('+json');

        let requestBody = null;
        try {
          const postData = req.postData();
          if (postData) {
            requestBody = parseJsonSafely(postData);
          }
        } catch {}

        let responseBody = null;
        if (isApiRequest(url, resourceType, contentType)) {
          try {
            const buffer = await res.buffer();
            if (buffer && buffer.length <= this.options.maxBodySizeBytes) {
              const text = buffer.toString('utf8');
              responseBody = isJson ? parseJsonSafely(text) : (text.length > 5000 ? text.slice(0, 5000) : parseJsonSafely(text));
            }
          } catch (e) {}
        }

        const startTime = this.requestStartTimes.get(req) || Date.now();
        const durationMs = Date.now() - startTime;
        const pathInfo = normalizeApiPath(url);

        const record = {
          id: `req_${++this.reqCounter}_${Date.now()}`,
          timestamp: new Date().toISOString(),
          startTime,
          url,
          pathname: pathInfo.pathname,
          origin: pathInfo.origin,
          queryParams: pathInfo.queryParams,
          method,
          resourceType,
          requestHeaders,
          requestBody,
          status,
          statusText,
          responseHeaders,
          responseBody,
          isJson: isJson || (responseBody && typeof responseBody === 'object'),
          durationMs,
          isApi: isApiRequest(url, resourceType, contentType)
        };

        this.logs.push(record);
        this.requestStartTimes.delete(req);
      } catch (err) {}
    };

    // 3. Listen for failed requests
    this._onRequestFailed = (req) => {
      try {
        const url = req.url();
        const method = req.method();
        const resourceType = req.resourceType();
        const startTime = this.requestStartTimes.get(req) || Date.now();
        const durationMs = Date.now() - startTime;
        const pathInfo = normalizeApiPath(url);

        let requestBody = null;
        try {
          const postData = req.postData();
          if (postData) requestBody = parseJsonSafely(postData);
        } catch {}

        this.logs.push({
          id: `fail_${++this.reqCounter}_${Date.now()}`,
          timestamp: new Date().toISOString(),
          startTime,
          url,
          pathname: pathInfo.pathname,
          origin: pathInfo.origin,
          queryParams: pathInfo.queryParams,
          method,
          resourceType,
          requestHeaders: req.headers() || {},
          requestBody,
          status: 0,
          statusText: req.failure() ? req.failure().errorText : 'FAILED',
          responseHeaders: {},
          responseBody: null,
          isJson: false,
          durationMs,
          isApi: isApiRequest(url, resourceType, '')
        });

        this.requestStartTimes.delete(req);
      } catch {}
    };

    this.page.on('request', this._onRequest);
    this.page.on('response', this._onResponse);
    this.page.on('requestfailed', this._onRequestFailed);

    // 4. CDP WebSockets capture if supported
    if (this.options.captureWebSockets && typeof this.page.target === 'function') {
      try {
        this.cdpSession = await this.page.target().createCDPSession();
        await this.cdpSession.send('Network.enable');

        this.cdpSession.on('Network.webSocketCreated', (params) => {
          const wsInfo = {
            requestId: params.requestId,
            url: params.url,
            pathname: normalizeApiPath(params.url).pathname,
            timestamp: new Date().toISOString(),
            initiator: params.initiator,
            frames: [],
            status: 'connected'
          };
          this.webSockets.set(params.requestId, wsInfo);
        });

        this.cdpSession.on('Network.webSocketFrameSent', (params) => {
          const ws = this.webSockets.get(params.requestId);
          if (ws) {
            ws.frames.push({
              direction: 'sent',
              opcode: params.response?.opcode,
              data: parseJsonSafely(params.response?.payloadData),
              timestamp: new Date().toISOString()
            });
          }
        });

        this.cdpSession.on('Network.webSocketFrameReceived', (params) => {
          const ws = this.webSockets.get(params.requestId);
          if (ws) {
            ws.frames.push({
              direction: 'received',
              opcode: params.response?.opcode,
              data: parseJsonSafely(params.response?.payloadData),
              timestamp: new Date().toISOString()
            });
          }
        });

        this.cdpSession.on('Network.webSocketClosed', (params) => {
          const ws = this.webSockets.get(params.requestId);
          if (ws) {
            ws.status = 'closed';
            ws.closedAt = new Date().toISOString();
          }
        });
      } catch (cdpErr) {}
    }

    this.isAttached = true;
    return this;
  }

  /**
   * Detach all listeners and clean up
   */
  async detach() {
    if (!this.isAttached) return;

    if (this.page) {
      if (this._onRequest) this.page.off('request', this._onRequest);
      if (this._onResponse) this.page.off('response', this._onResponse);
      if (this._onRequestFailed) this.page.off('requestfailed', this._onRequestFailed);
    }

    if (this.cdpSession) {
      try {
        await this.cdpSession.detach();
      } catch {}
      this.cdpSession = null;
    }

    this.isAttached = false;
  }

  /**
   * Get all captured network logs
   * @returns {Array<object>}
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Get only API / XHR / Fetch network logs
   * @returns {Array<object>}
   */
  getApiLogs() {
    return this.logs.filter(log => log.isApi || isApiRequest(log.url, log.resourceType, log.responseHeaders?.['content-type']));
  }

  /**
   * Get all captured WebSocket connections and messages
   * @returns {Array<object>}
   */
  getWebSocketLogs() {
    return Array.from(this.webSockets.values());
  }

  /**
   * Generate mock API routes for captured traffic
   * @param {string} framework - 'express' | 'nextjs' | 'all'
   * @returns {object}
   */
  generateMockApiRoutes(framework = 'express') {
    return generateMockApiRoutes(this.getApiLogs(), { framework });
  }
}

/**
 * Generate production-ready Express.js & Next.js Mock API Routes from captured network logs
 * @param {Array<object>} networkLogs
 * @param {object} options
 * @returns {object}
 */
function generateMockApiRoutes(networkLogs = [], options = {}) {
  const framework = options.framework || 'express';
  const includeComments = options.includeComments !== undefined ? options.includeComments : true;

  if (!Array.isArray(networkLogs)) {
    networkLogs = [];
  }

  // Filter logs to successful or informative API calls
  const apiCalls = networkLogs.filter(log => {
    if (!log) return false;
    return log.isApi || isApiRequest(log.url, log.resourceType, log.responseHeaders?.['content-type']);
  });

  // Group by (method + pathname) to create unified endpoints
  const endpointMap = new Map();

  for (const call of apiCalls) {
    const method = (call.method || 'GET').toUpperCase();
    const pathname = call.pathname || '/';
    const key = `${method} ${pathname}`;

    if (!endpointMap.has(key)) {
      endpointMap.set(key, {
        method,
        pathname,
        sampleStatus: call.status || 200,
        queryParams: Object.keys(call.queryParams || {}),
        requestPayload: call.requestBody || null,
        sampleResponse: call.responseBody !== undefined && call.responseBody !== null
          ? call.responseBody
          : { status: 'success', message: `Mocked response for ${method} ${pathname}` },
        isJson: call.isJson || typeof call.responseBody === 'object',
        callCount: 1,
        origins: call.origin ? [call.origin] : []
      });
    } else {
      const existing = endpointMap.get(key);
      existing.callCount++;
      if (call.origin && !existing.origins.includes(call.origin)) {
        existing.origins.push(call.origin);
      }
      // Prefer JSON object response if available
      if (call.responseBody && typeof call.responseBody === 'object' && typeof existing.sampleResponse !== 'object') {
        existing.sampleResponse = call.responseBody;
        existing.isJson = true;
      }
      // Merge query params
      if (call.queryParams) {
        Object.keys(call.queryParams).forEach(k => {
          if (!existing.queryParams.includes(k)) existing.queryParams.push(k);
        });
      }
    }
  }

  const endpoints = Array.from(endpointMap.values());

  // ─── 1. Generate Express Router Code ───────────────────────────
  let expressCode = `/**\n * Mock API Router for Express.js\n * Generated automatically by SitePrompter Web Network Interceptor\n * Endpoints: ${endpoints.length}\n */\n\nconst express = require('express');\nconst router = express.Router();\n\nrouter.use(express.json());\n\n`;

  if (endpoints.length === 0) {
    expressCode += `// No XHR/Fetch API calls were captured during page telemetry recording.\nrouter.get('/api/status', (req, res) => {\n  res.json({ status: 'ok', mocked: true, timestamp: new Date().toISOString() });\n});\n\nmodule.exports = router;\n`;
  } else {
    endpoints.forEach(ep => {
      const method = ep.method.toLowerCase();
      const handlerMethod = ['get', 'post', 'put', 'delete', 'patch', 'options'].includes(method) ? method : 'all';
      const formattedResponse = JSON.stringify(ep.sampleResponse, null, 2).replace(/\n/g, '\n    ');

      if (includeComments) {
        expressCode += `/**\n * ${ep.method} ${ep.pathname}\n * Status: ${ep.sampleStatus}\n`;
        if (ep.queryParams.length > 0) {
          expressCode += ` * Query params: ${ep.queryParams.join(', ')}\n`;
        }
        if (ep.requestPayload) {
          expressCode += ` * Request payload sample: ${JSON.stringify(ep.requestPayload)}\n`;
        }
        expressCode += ` */\n`;
      }

      expressCode += `router.${handlerMethod}('${ep.pathname}', (req, res) => {\n`;
      if (ep.queryParams.length > 0) {
        expressCode += `  const { ${ep.queryParams.join(', ')} } = req.query;\n`;
      }
      expressCode += `  return res.status(${ep.sampleStatus || 200}).json(${formattedResponse});\n});\n\n`;
    });

    expressCode += `module.exports = router;\n`;
  }

  // ─── 2. Generate Next.js 14+ App Router Code ───────────────────
  let nextjsAppRouterCode = `/**\n * Next.js 14+ App Router Mock API Endpoints\n * Place these in app/api/.../route.ts or route.js\n */\n\n`;

  if (endpoints.length === 0) {
    nextjsAppRouterCode += `// app/api/status/route.js\nexport async function GET() {\n  return Response.json({ status: 'ok', mocked: true });\n}\n`;
  } else {
    endpoints.forEach(ep => {
      const cleanRoutePath = ep.pathname.replace(/^\/api\//, '').replace(/^\//, '');
      const formattedResponse = JSON.stringify(ep.sampleResponse, null, 2).replace(/\n/g, '\n    ');

      nextjsAppRouterCode += `// ========================================================\n// Route: app/api/${cleanRoutePath || 'index'}/route.js\n// ========================================================\n`;
      nextjsAppRouterCode += `export async function ${ep.method}(request) {\n`;
      if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
        nextjsAppRouterCode += `  const body = await request.json().catch(() => ({}));\n`;
      } else if (ep.queryParams.length > 0) {
        nextjsAppRouterCode += `  const { searchParams } = new URL(request.url);\n`;
      }
      nextjsAppRouterCode += `  return Response.json(\n    ${formattedResponse},\n    { status: ${ep.sampleStatus || 200} }\n  );\n}\n\n`;
    });
  }

  // ─── 3. Generate Next.js Pages Router Code ─────────────────────
  let nextjsPagesRouterCode = `/**\n * Next.js Pages Router Mock API Endpoints (pages/api/...js)\n */\n\n`;
  if (endpoints.length === 0) {
    nextjsPagesRouterCode += `// pages/api/status.js\nexport default function handler(req, res) {\n  res.status(200).json({ status: 'ok', mocked: true });\n}\n`;
  } else {
    endpoints.forEach(ep => {
      const cleanRoutePath = ep.pathname.replace(/^\/api\//, '').replace(/^\//, '');
      const formattedResponse = JSON.stringify(ep.sampleResponse, null, 2).replace(/\n/g, '\n    ');

      nextjsPagesRouterCode += `// pages/api/${cleanRoutePath || 'index'}.js\n`;
      nextjsPagesRouterCode += `export default function handler(req, res) {\n`;
      nextjsPagesRouterCode += `  if (req.method !== '${ep.method}') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n`;
      nextjsPagesRouterCode += `  return res.status(${ep.sampleStatus || 200}).json(${formattedResponse});\n}\n\n`;
    });
  }

  let code = expressCode;
  if (framework === 'nextjs' || framework === 'nextjs-app') {
    code = nextjsAppRouterCode;
  } else if (framework === 'nextjs-pages') {
    code = nextjsPagesRouterCode;
  }

  return {
    framework,
    endpoints,
    totalEndpoints: endpoints.length,
    code,
    expressCode,
    nextjsAppRouterCode,
    nextjsPagesRouterCode
  };
}

/**
 * Attach network interceptor to a Puppeteer page instance
 * @param {puppeteer.Page} page
 * @param {object} options
 * @returns {Promise<NetworkInterceptor>}
 */
async function attachNetworkInterceptor(page, options = {}) {
  const interceptor = new NetworkInterceptor(page, options);
  await interceptor.attach();
  return interceptor;
}

module.exports = {
  NetworkInterceptor,
  attachNetworkInterceptor,
  generateMockApiRoutes,
  isApiRequest,
  normalizeApiPath,
  parseJsonSafely
};
