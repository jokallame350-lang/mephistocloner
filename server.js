const express = require('express');
const cors = require('cors');
const path = require('path');
const { scrapeUrl, analyzeRawHtml, findChromePath, findChromeExecutable } = require('./lib/scraper');
const { compilePrompt, estimateTokens } = require('./lib/prompt-compiler');
const { exportTailwindConfig, exportFigmaTokens, exportCssTheme } = require('./lib/design-tokens-exporter');
const { SECTION_DEFINITIONS, sliceComponent } = require('./lib/component-slicer');
const { createProjectZip } = require('./lib/project-packager');

// Production Store & Services
const db = require('./lib/projects-store');
const { handleStreamGenerate, streamGenerate } = require('./lib/ai-streaming-engine');
const { crawlMultiPage } = require('./lib/multi-page-crawler');
const { deployToGitHub, deployToVercel } = require('./lib/deploy-service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── API ENDPOINTS ───────────────────────────────────────────────

/**
 * Health check & engine status
 */
app.get('/api/health', (req, res) => {
  let chromePath = null;
  try {
    if (typeof findChromeExecutable === 'function') chromePath = findChromeExecutable();
    else if (typeof findChromePath === 'function') chromePath = findChromePath();
  } catch (_) {
    chromePath = null;
  }
  res.json({
    status: 'ok',
    version: '2.5.0-pro',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    chromeAvailable: !!chromePath,
    chromePath: chromePath || 'Vercel Serverless / Cloud Runtime',
    sections: Object.keys(SECTION_DEFINITIONS || {}),
  });
});

// ─── AI GENERATION ENDPOINTS ──────────────────────────────────────
app.post('/api/ai/stream-generate', handleStreamGenerate);

app.post('/api/ai/generate', async (req, res) => {
  try {
    const result = await streamGenerate(req.body);
    res.json({
      success: true,
      fullCode: result.fullCode,
      stats: result.stats || {}
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── AUTHENTICATION ENDPOINTS ──────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  const user = db.updateUser({
    name: name || email.split('@')[0],
    email,
    plan: 'Pro Developer',
    credits: 500
  });
  res.json({ success: true, user, token: 'jwt_mock_token_session' });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = db.getUser();
  if (email) {
    db.updateUser({ email, name: email.split('@')[0] });
  }
  res.json({ success: true, user: db.getUser(), token: 'jwt_mock_token_session' });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ success: true, user: db.getUser() });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── WORKSPACES MANAGEMENT ─────────────────────────────────────────
app.get('/api/workspaces', (req, res) => {
  res.json({ success: true, workspaces: db.getWorkspaces() });
});

app.post('/api/workspaces', (req, res) => {
  const { name } = req.body;
  const ws = db.createWorkspace(name);
  res.json({ success: true, workspace: ws });
});

app.post('/api/workspaces/switch', (req, res) => {
  const { workspaceId } = req.body;
  db.updateUser({ workspaceId });
  res.json({ success: true, currentWorkspaceId: workspaceId, user: db.getUser() });
});

// ─── PROJECTS MANAGEMENT ───────────────────────────────────────────
app.get('/api/projects', (req, res) => {
  const { workspaceId } = req.query;
  const projects = db.getProjects(workspaceId);
  res.json({ success: true, projects, count: projects.length });
});

app.post('/api/projects', (req, res) => {
  const project = db.saveProject(req.body);
  res.json({ success: true, project });
});

app.get('/api/projects/:id', (req, res) => {
  const project = db.getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, project });
});

app.delete('/api/projects/:id', (req, res) => {
  const deleted = db.deleteProject(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/projects/:id/favorite', (req, res) => {
  const project = db.toggleFavorite(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, project });
});

// ─── AI STREAMING GENERATION (SSE) ─────────────────────────────────
app.post('/api/ai/stream-generate', handleStreamGenerate);

// ─── MULTI-PAGE CRAWLER ───────────────────────────────────────────
app.post('/api/crawl-multi-page', async (req, res) => {
  const { url, maxPages = 4, framework = 'react-tailwind', links, autoDiscover } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }
  try {
    const result = await crawlMultiPage(url, { maxPages, framework, links, autoDiscover });
    res.json({
      ...result,
      success: result.error ? false : true,
      pages: result.siteMap || Object.keys(result.pages || {}).map(path => ({ path, title: path, status: 200 }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 1-CLICK DEPLOYMENTS ───────────────────────────────────────────
app.post('/api/deploy/github', async (req, res) => {
  try {
    const result = await deployToGitHub(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/deploy/vercel', async (req, res) => {
  try {
    const result = await deployToVercel(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── BILLING & CREDITS ────────────────────────────────────────────
app.get('/api/billing/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        id: 'free',
        name: 'Starter',
        priceMonthly: 0,
        priceYearly: 0,
        credits: 50,
        features: ['50 monthly credits', 'React & Vanilla HTML export', 'Standard speed', 'Community support']
      },
      {
        id: 'pro',
        name: 'Pro Developer',
        popular: true,
        priceMonthly: 19,
        priceYearly: 15,
        credits: 1000,
        features: ['1,000 monthly credits', 'Claude 3.7 & GPT-4o streaming', 'All 5 frameworks', '1-Click GitHub & Vercel deploy', 'Multi-page crawler', 'Priority execution']
      },
      {
        id: 'agency',
        name: 'Agency & Scale',
        priceMonthly: 79,
        priceYearly: 65,
        credits: 10000,
        features: ['10,000 monthly credits', 'Unlimited BYOK keys', 'Unlimited team workspaces', 'Dedicated webhook integration', 'Custom CSS compiler rules', '24/7 Priority SLA']
      }
    ]
  });
});

app.post('/api/billing/checkout', (req, res) => {
  const { planId = 'pro' } = req.body;
  const user = db.getUser();
  
  if (planId === 'pro') {
    db.updateUser({ plan: 'Pro Developer' });
    db.addCredits(1000);
  } else if (planId === 'agency') {
    db.updateUser({ plan: 'Agency & Scale' });
    db.addCredits(10000);
  }

  res.json({
    success: true,
    message: 'Subscription successfully updated',
    user: db.getUser(),
    checkoutUrl: 'https://checkout.lemonsqueezy.com/buy/mock-siteprompter'
  });
});

app.get('/api/billing/credits', (req, res) => {
  const user = db.getUser();
  res.json({
    success: true,
    credits: user.credits,
    creditsLimit: user.creditsLimit,
    plan: user.plan
  });
});

app.post('/api/billing/webhook', (req, res) => {
  res.json({ success: true, received: true });
});

// ─── BYOK KEY MANAGEMENT ───────────────────────────────────────────
app.get('/api/user/keys', (req, res) => {
  res.json({ success: true, ...db.getByokKeys() });
});

app.post('/api/user/keys', (req, res) => {
  const { keys } = req.body;
  if (!keys || typeof keys !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid keys object' });
  }
  db.saveByokKeys(keys);
  res.json({ success: true, message: 'Keys saved successfully', ...db.getByokKeys() });
});

app.delete('/api/user/keys/:provider', (req, res) => {
  const provider = req.params.provider;
  db.saveByokKeys({ [provider]: '' });
  res.json({ success: true, message: `Removed key for ${provider}`, ...db.getByokKeys() });
});

// ─── CORE TELEMETRY & SCRAPER ENDPOINTS ────────────────────────────

/**
 * Scrapes a live URL and generates structured telemetry + prompt
 */
app.post('/api/analyze-url', async (req, res) => {
  const { url, framework = 'vanilla-html', detailLevel = 'balanced', assetMode = 'original-urls', customInstructions = '' } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    console.log(`[ANALYZING URL] -> ${url} (Framework: ${framework}, Detail: ${detailLevel})`);
    const telemetry = await scrapeUrl(url);
    const prompt = compilePrompt(telemetry, { framework, detailLevel, assetMode, customInstructions });
    const tokenEstimate = estimateTokens(prompt);

    res.json({
      success: true,
      url,
      telemetry,
      prompt,
      tokenEstimate,
      framework,
      detailLevel,
    });
  } catch (err) {
    console.error(`[SCRAPING ERROR]`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Analyzes raw HTML & CSS input (offline mode)
 */
app.post('/api/analyze-raw', async (req, res) => {
  const { html, css = '', framework = 'vanilla-html', detailLevel = 'balanced', assetMode = 'original-urls', customInstructions = '' } = req.body;

  if (!html) {
    return res.status(400).json({ success: false, error: 'HTML is required' });
  }

  try {
    console.log(`[ANALYZING RAW HTML] -> ${html.length} bytes (CSS: ${css.length} bytes)`);
    const telemetry = await analyzeRawHtml(html, css);
    const prompt = compilePrompt(telemetry, { framework, detailLevel, assetMode, customInstructions });
    const tokenEstimate = estimateTokens(prompt);

    res.json({
      success: true,
      telemetry,
      prompt,
      tokenEstimate,
      framework,
      detailLevel,
    });
  } catch (err) {
    console.error(`[RAW ANALYZE ERROR]`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Re-compiles existing telemetry with different framework or detail level
 */
app.post('/api/compile-prompt', (req, res) => {
  const { telemetry, framework = 'vanilla-html', detailLevel = 'balanced', assetMode = 'original-urls', customInstructions = '' } = req.body;

  if (!telemetry) {
    return res.status(400).json({ success: false, error: 'Telemetry data is required' });
  }

  try {
    const prompt = compilePrompt(telemetry, { framework, detailLevel, assetMode, customInstructions });
    const tokenEstimate = estimateTokens(prompt);
    res.json({
      success: true,
      prompt,
      tokenEstimate,
      framework,
      detailLevel,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Export Design System (Tailwind Config, Figma Tokens, Theme CSS)
 */
app.post('/api/export-tokens', (req, res) => {
  const { telemetry } = req.body;
  if (!telemetry) {
    return res.status(400).json({ success: false, error: 'Telemetry data is required' });
  }

  try {
    const tailwindConfig = exportTailwindConfig(telemetry);
    const figmaTokens = exportFigmaTokens(telemetry);
    const cssTheme = exportCssTheme(telemetry);

    res.json({
      success: true,
      tailwindConfig,
      figmaTokens,
      cssTheme,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Slice specific component (Navbar, Hero, Pricing, etc.)
 */
app.post('/api/slice-component', (req, res) => {
  const { telemetry, sectionKey = 'navbar', framework = 'react-tailwind', customInstructions = '' } = req.body;
  if (!telemetry) {
    return res.status(400).json({ success: false, error: 'Telemetry data is required' });
  }

  try {
    const prompt = sliceComponent(telemetry, sectionKey, { framework, customInstructions });
    const tokenEstimate = estimateTokens(prompt);
    res.json({
      success: true,
      sectionKey,
      sectionMeta: SECTION_DEFINITIONS[sectionKey] || SECTION_DEFINITIONS.navbar,
      prompt,
      tokenEstimate,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Download complete project ZIP
 */
app.post('/api/download-zip', (req, res) => {
  const { code, telemetry, framework = 'react-tailwind' } = req.body;

  try {
    const zipBuffer = createProjectZip(code, telemetry || {}, { framework });
    const filename = `${(telemetry?.meta?.title || 'site-clone').toLowerCase().replace(/[^a-z0-9]/g, '-')}-project.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to SPA index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SitePrompter Web V2 (Pro SaaS Studio) running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
