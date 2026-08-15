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

// Enterprise 3.0 Engines
const { analyzeVisualDifferences, applySelfHealingPatches, streamVisualHealingAsync } = require('./lib/vision-self-healing');
const { scrapeViaCloudBrowser, testCloudConnection, analyzeOfflineFallback } = require('./lib/cloud-scraper-connector');
const { generateFullStackDatabaseBundle, generatePrismaSchema, generateDrizzleSchema, generateSupabaseMigration, generateNextJsServerActions } = require('./lib/fullstack-db-generator');
const { exportToReactNative, exportToFigmaTokens, exportToFlutter } = require('./lib/multi-platform-exporter');
const communityHub = require('./lib/community-hub');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const { TERMS_HTML, PRIVACY_HTML, REFUND_HTML, PRICING_HTML } = require('./lib/legal-pages');

// ─── LEGAL & PRICING PAGES ───────────────────────────────────────
app.get(['/pricing', '/pricing.html'], (req, res) => res.send(PRICING_HTML));
app.get(['/terms', '/terms.html', '/terms-of-service'], (req, res) => res.send(TERMS_HTML));
app.get(['/privacy', '/privacy.html', '/privacy-policy'], (req, res) => res.send(PRIVACY_HTML));
app.get(['/refund', '/refunds', '/refund.html', '/refund-policy'], (req, res) => res.send(REFUND_HTML));

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

// ─── COMMUNITY SHOWCASE & TEMPLATE HUB ─────────────────────────────
app.get('/api/community/templates', (req, res) => {
  const { category, framework, tag, featured, search, sort, limit, offset } = req.query;
  const templates = communityHub.getCommunityTemplates(
    {
      category,
      framework,
      tag,
      featured: featured !== undefined ? featured === 'true' : undefined,
      sort,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    },
    search
  );
  res.json({ success: true, templates, count: templates.length });
});

app.get('/api/community/templates/featured', (req, res) => {
  res.json({ success: true, templates: communityHub.getFeaturedClones() });
});

app.get('/api/community/templates/:id', (req, res) => {
  const template = communityHub.getTemplateById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  res.json({ success: true, template });
});

app.post('/api/community/templates/:id/fork', (req, res) => {
  try {
    const { userId, workspaceId, title } = req.body;
    const result = communityHub.forkTemplate(req.params.id, userId, { workspaceId, title });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/community/templates/:id/like', (req, res) => {
  try {
    const result = communityHub.likeTemplate(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/community/templates', (req, res) => {
  try {
    const { projectData, authorInfo } = req.body;
    const result = communityHub.publishTemplate(projectData || req.body, authorInfo || req.body.author);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/community/categories', (req, res) => {
  res.json({
    success: true,
    categories: communityHub.getCategories(),
    tags: communityHub.getPopularTags()
  });
});

app.get('/api/community/stats', (req, res) => {
  res.json({ success: true, stats: communityHub.getHubStats() });
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

// ─── BILLING & CREDITS (DAILY QUOTA 150 / 600 / 1500) ──────────────
app.get('/api/billing/plans', (req, res) => {
  res.json({
    success: true,
    plans: Object.values(db.PLAN_CONFIGS)
  });
});

app.post('/api/billing/checkout', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId || 'usr_guest_default';
  const { planId = 'pro' } = req.body;
  const result = db.upgradePlan(userId, planId);

  res.json({
    success: true,
    message: `${result.plan.name} paketine başarıyla geçildi!`,
    user: result.user,
    plan: result.plan,
    checkoutUrl: 'https://checkout.lemonsqueezy.com/buy/siteprompter-pro'
  });
});

app.get('/api/billing/credits', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId || 'usr_guest_default';
  const user = db.getUser(userId);
  res.json({
    success: true,
    credits: user.credits,
    creditsLimit: user.creditsLimit,
    remainingPrompts: user.remainingPrompts,
    plan: user.plan,
    timeUntilResetMs: user.timeUntilResetMs,
    nextReset: user.nextReset
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

// ─── ENTERPRISE 3.0: VISION AI SELF-HEALING & VISUAL DIFF ─────────
app.post('/api/ai/visual-diff-healing', async (req, res) => {
  const { originalTelemetry, generatedCode, model = 'claude-3-7-sonnet' } = req.body;
  
  if (!originalTelemetry || !generatedCode) {
    return res.status(400).json({ success: false, error: 'originalTelemetry and generatedCode are required' });
  }

  try {
    const analysis = analyzeVisualDifferences(originalTelemetry, generatedCode, { model });
    const patchResult = applySelfHealingPatches(generatedCode, analysis.patches);

    res.json({
      success: true,
      analysis,
      healedCode: patchResult.healedCode,
      appliedCount: patchResult.appliedCount,
      similarityScore: analysis.score,
      estimatedHealedScore: analysis.summary?.healedEstimatedScore || 98
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ENTERPRISE 3.0: CLOUD SCRAPER EDGE CONNECTOR ──────────────────
app.post('/api/cloud-scrape', async (req, res) => {
  const { url, cloudConfig = {}, framework = 'react-tailwind', detailLevel = 'balanced' } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const telemetry = await scrapeViaCloudBrowser(url, cloudConfig);
    const prompt = compilePrompt(telemetry, { framework, detailLevel });
    res.json({
      success: true,
      url,
      telemetry,
      prompt,
      tokenEstimate: estimateTokens(prompt),
      framework
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/cloud-scrape/test', async (req, res) => {
  const { cloudConfig = {} } = req.body;
  const result = await testCloudConnection(cloudConfig);
  res.json(result);
});

// ─── ENTERPRISE 3.0: FULL-STACK DATABASE & PRISMA GENERATOR ────────
app.post('/api/generate-fullstack-db', (req, res) => {
  const { telemetry, networkLogs = [], dbType = 'postgresql' } = req.body;
  try {
    const bundle = generateFullStackDatabaseBundle({ telemetry, networkLogs }, { dbType });
    res.json({
      success: true,
      ...bundle
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ENTERPRISE 3.0: MULTI-PLATFORM (REACT NATIVE / FIGMA) ─────────
app.post('/api/export-multi-platform', (req, res) => {
  const { code, telemetry, target = 'react-native' } = req.body;
  try {
    let result = {};
    if (target === 'react-native') {
      result = { reactNativeCode: exportToReactNative(code || '') };
    } else if (target === 'figma') {
      result = { figmaTokens: exportToFigmaTokens(telemetry || {}) };
    } else if (target === 'flutter') {
      result = { flutterCode: exportToFlutter(code || '') };
    } else {
      result = {
        reactNativeCode: exportToReactNative(code || ''),
        figmaTokens: exportToFigmaTokens(telemetry || {}),
        flutterCode: exportToFlutter(code || '')
      };
    }
    res.json({ success: true, target, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ENTERPRISE 3.0: COMMUNITY SHOWCASE & TEMPLATE HUB ─────────────
app.get('/api/community/templates', (req, res) => {
  const { category, framework, tag, search, sort } = req.query;
  const result = communityHub.getCommunityTemplates({ category, framework, tag, search, sort });
  res.json({ success: true, ...result });
});

app.get('/api/community/templates/:id', (req, res) => {
  const template = communityHub.getTemplateById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  res.json({ success: true, template });
});

app.post('/api/community/fork/:id', (req, res) => {
  try {
    const result = communityHub.forkTemplate(req.params.id, req.body.userId || 'usr_pro_001');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

app.post('/api/community/publish', (req, res) => {
  try {
    const newTemplate = communityHub.publishTemplate(req.body.projectData, req.body.authorInfo);
    res.json({ success: true, template: newTemplate });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/community/like/:id', (req, res) => {
  const updated = communityHub.likeTemplate(req.params.id);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }
  res.json({ success: true, likes: updated.likes });
});

app.get('/api/community/stats', (req, res) => {
  res.json({ success: true, stats: communityHub.getHubStatistics() });
});

// ─── CORE TELEMETRY & SCRAPER ENDPOINTS ────────────────────────────

app.post('/api/analyze-url', async (req, res) => {
  const { url, framework = 'vanilla-html', detailLevel = 'balanced', assetMode = 'original-urls', customInstructions = '', bypassCredit = false } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  const userId = req.headers['x-user-id'] || req.body.userId || 'usr_guest_default';
  const deduction = db.deductCredits(userId, 10);

  if (!deduction.success && !bypassCredit) {
    return res.status(402).json({
      success: false,
      error: 'INSUFFICIENT_CREDITS',
      message: deduction.message,
      credits: deduction.credits,
      creditsLimit: deduction.creditsLimit,
      required: deduction.required,
      timeUntilResetMs: deduction.timeUntilResetMs,
      nextReset: deduction.nextReset
    });
  }

  try {
    console.log(`[ANALYZING URL] -> ${url} (Framework: ${framework}, Detail: ${detailLevel}) | User: ${userId} (${deduction.credits} credits left)`);
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
      credits: deduction.credits,
      creditsLimit: deduction.creditsLimit,
      remainingPrompts: deduction.remainingPrompts,
      timeUntilResetMs: deduction.timeUntilResetMs,
      nextReset: deduction.nextReset
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
  const { html, css = '', framework = 'vanilla-html', detailLevel = 'balanced', assetMode = 'original-urls', customInstructions = '', bypassCredit = false } = req.body;

  if (!html) {
    return res.status(400).json({ success: false, error: 'HTML is required' });
  }

  const userId = req.headers['x-user-id'] || req.body.userId || 'usr_guest_default';
  const deduction = db.deductCredits(userId, 10);

  if (!deduction.success && !bypassCredit) {
    return res.status(402).json({
      success: false,
      error: 'INSUFFICIENT_CREDITS',
      message: deduction.message,
      credits: deduction.credits,
      creditsLimit: deduction.creditsLimit,
      required: deduction.required,
      timeUntilResetMs: deduction.timeUntilResetMs,
      nextReset: deduction.nextReset
    });
  }

  try {
    console.log(`[ANALYZING RAW HTML] -> ${html.length} bytes | User: ${userId} (${deduction.credits} credits left)`);
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
      credits: deduction.credits,
      creditsLimit: deduction.creditsLimit,
      remainingPrompts: deduction.remainingPrompts,
      timeUntilResetMs: deduction.timeUntilResetMs,
      nextReset: deduction.nextReset
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

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[API ERROR]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
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
