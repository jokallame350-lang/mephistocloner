/**
 * Automated Verification Suite for Community Showcase & Template Hub
 */

const assert = require('assert');
const http = require('http');
const {
  DEFAULT_COMMUNITY_TEMPLATES,
  getCommunityTemplates,
  getTemplateById,
  forkTemplate,
  publishTemplate,
  likeTemplate,
  getFeaturedClones,
  rateTemplate,
  getCategories,
  getPopularTags,
  getPromptRecipes,
  resetCommunityTemplates,
  getHubStats,
} = require('../lib/community-hub');

const projectsStore = require('../lib/projects-store');
const app = require('../server');

async function runTests() {
  console.log('🚀 Starting SitePrompter Community Showcase & Template Hub Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // Ensure clean starting state
  resetCommunityTemplates();

  // ───────────────────────────────────────────────────────────────────────────
  // 1. VERIFY PRE-POPULATED TEMPLATES LIBRARY INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  test('Initial Pre-Populated Master Templates Library Count', () => {
    assert.strictEqual(DEFAULT_COMMUNITY_TEMPLATES.length, 6, 'Should have exactly 6 world-class pre-populated templates');
    const templates = getCommunityTemplates();
    assert.strictEqual(templates.length, 6, 'getCommunityTemplates() should return 6 templates by default');
  });

  test('Verify Kick.com (Live Stream Platform) Template Specs', () => {
    const kick = getTemplateById('tpl_kick_livestream');
    assert(kick, 'Kick template should exist');
    assert.strictEqual(kick.slug, 'kick-live-stream-platform');
    assert.strictEqual(kick.category, 'Entertainment & Streaming');
    assert.strictEqual(kick.framework, 'react-tailwind');
    assert(kick.tags.includes('Streaming') && kick.tags.includes('Cyber Green'), 'Should include streaming & cyber green tags');
    assert.strictEqual(kick.designTokens.colors.primary, '#53FC18', 'Should have cyber green #53FC18 primary');
    assert(kick.promptRecipe.keyInstructions.length >= 4, 'Should have rich prompt recipe instructions');
    assert(kick.code.includes('DarthKubo') && kick.code.includes('KICK') && kick.code.includes('14,280 Viewers'), 'Code should include stream player & chat components');
    assert(kick.code.includes('Live Chat') || kick.code.includes('Stream Chat'), 'Code should include live chat drawer');
  });

  test('Verify Stripe.com (Payment Infrastructure) Template Specs', () => {
    const stripe = getTemplateById('tpl_stripe_payments');
    assert(stripe, 'Stripe template should exist');
    assert.strictEqual(stripe.category, 'Fintech & SaaS');
    assert(stripe.tags.includes('Fintech') && stripe.tags.includes('Mesh Gradients') && stripe.tags.includes('Pricing Cards'), 'Should include fintech & pricing tags');
    assert.strictEqual(stripe.designTokens.colors.primary, '#6366F1');
    assert(stripe.promptRecipe.suggestedComponents.includes('MeshGradientHero'), 'Should suggest mesh gradient hero component');
    assert(stripe.code.includes('Financial infrastructure') && stripe.code.includes('PaymentIntent') && stripe.code.includes('99.999%'), 'Code should have payment APIs, mesh styling & pricing');
  });

  test('Verify Linear.app (Issue Tracking SaaS) Template Specs', () => {
    const linear = getTemplateById('tpl_linear_tracker');
    assert(linear, 'Linear template should exist');
    assert.strictEqual(linear.category, 'Productivity & Developer Tools');
    assert(linear.tags.includes('Productivity') && linear.tags.includes('Glassmorphism') && linear.tags.includes('Command Palette'), 'Should include productivity & command palette tags');
    assert.strictEqual(linear.designTokens.colors.accent, '#5E6AD2');
    assert(linear.code.includes('Sprint 42') || linear.code.includes('Cycle 42') && linear.code.includes('⌘K'), 'Code should include cycle tracker & cmd+k shortcuts');
  });

  test('Verify MephistoMail (Zero-Knowledge Encrypted Webmail) Template Specs', () => {
    const mail = getTemplateById('tpl_mephisto_mail');
    assert(mail, 'MephistoMail template should exist');
    assert.strictEqual(mail.category, 'Security & Privacy');
    assert(mail.tags.includes('Security') && mail.tags.includes('Zero-Knowledge') && mail.tags.includes('PGP'), 'Should include security tags');
    assert.strictEqual(mail.designTokens.colors.accent, '#06B6D4');
    assert(mail.code.includes('ZERO-KNOWLEDGE') && mail.code.includes('Curve25519') || mail.code.includes('Encrypted Compose'), 'Code should include cryptographic status & compose client');
  });

  test('Verify TailwindUI Marketing Studio Template Specs', () => {
    const marketing = getTemplateById('tpl_tailwind_marketing');
    assert(marketing, 'Marketing template should exist');
    assert.strictEqual(marketing.category, 'Marketing & Landing Pages');
    assert(marketing.tags.includes('Marketing') && marketing.tags.includes('Bento Grid') && marketing.tags.includes('FAQ Accordion'), 'Should include Bento Grid & FAQ tags');
    assert(marketing.code.includes('Marketing') || marketing.code.includes('Bento') || marketing.code.includes('FAQ'), 'Code should include marketing bento grid');
  });

  test('Verify Netflix Streaming Portal Template Specs', () => {
    const netflix = getTemplateById('tpl_netflix_portal');
    assert(netflix, 'Netflix template should exist');
    assert.strictEqual(netflix.category, 'Entertainment & Streaming');
    assert(netflix.tags.includes('Netflix') && netflix.tags.includes('Carousel Trays') && netflix.tags.includes('Movie Modal'), 'Should include carousel trays & movie modal tags');
    assert.strictEqual(netflix.designTokens.colors.primary, '#E50914');
    assert(netflix.code.includes('NETFLIX') && netflix.code.includes('Billboard') || netflix.code.includes('Trending Now'), 'Code should include billboard stage & streaming components');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. TEMPLATE RETRIEVAL & FILTERING TESTS
  // ───────────────────────────────────────────────────────────────────────────
  test('Lookup Template by ID and Slug', () => {
    const byId = getTemplateById('tpl_kick_livestream');
    const bySlug = getTemplateById('kick-live-stream-platform');
    assert(byId && bySlug, 'Both lookups should succeed');
    assert.strictEqual(byId.id, bySlug.id);

    const nonExistent = getTemplateById('tpl_non_existent_123');
    assert.strictEqual(nonExistent, null, 'Non-existent template should return null');
  });

  test('Filter Templates by Category', () => {
    const streaming = getCommunityTemplates({ category: 'Entertainment & Streaming' });
    assert.strictEqual(streaming.length, 2, 'Should find 2 streaming templates (Kick & Netflix)');

    const security = getCommunityTemplates({ category: 'Security & Privacy' });
    assert.strictEqual(security.length, 1, 'Should find 1 security template (MephistoMail)');
    assert.strictEqual(security[0].id, 'tpl_mephisto_mail');

    const fintech = getCommunityTemplates('Fintech & SaaS');
    assert.strictEqual(fintech.length, 1, 'String category filter should match Stripe');
    assert.strictEqual(fintech[0].id, 'tpl_stripe_payments');
  });

  test('Filter Templates by Framework', () => {
    const reactTemplates = getCommunityTemplates({ framework: 'react-tailwind' });
    assert.strictEqual(reactTemplates.length, 6, 'All 6 templates use react-tailwind');

    const vueTemplates = getCommunityTemplates({ framework: 'vue3-tailwind' });
    assert.strictEqual(vueTemplates.length, 0, 'Should return empty array for unmatched framework');
  });

  test('Filter Templates by Tag', () => {
    const bentoResults = getCommunityTemplates({ tag: 'Bento Grid' });
    assert.strictEqual(bentoResults.length, 1);
    assert.strictEqual(bentoResults[0].id, 'tpl_tailwind_marketing');

    const darkResults = getCommunityTemplates({ tag: 'Dark Mode' });
    assert(darkResults.length >= 2, 'Should find multiple templates tagged with Dark Mode');
  });

  test('Search Query Matching Across Title, Description & Tags', () => {
    const searchKick = getCommunityTemplates({}, 'cyber green');
    assert.strictEqual(searchKick.length, 1);
    assert.strictEqual(searchKick[0].id, 'tpl_kick_livestream');

    const searchGlobe = getCommunityTemplates({}, 'interactive globe');
    assert.strictEqual(searchGlobe.length, 1);
    assert.strictEqual(searchGlobe[0].id, 'tpl_stripe_payments');

    const searchPGP = getCommunityTemplates({}, 'PGP');
    assert.strictEqual(searchPGP.length, 1);
    assert.strictEqual(searchPGP[0].id, 'tpl_mephisto_mail');

    const searchNone = getCommunityTemplates({}, 'xyz_random_nonexistent_term');
    assert.strictEqual(searchNone.length, 0, 'No templates should match random term');
  });

  test('Sorting Templates by Likes, Forks, Rating and Popularity', () => {
    const sortedByLikes = getCommunityTemplates({ sort: 'likes' });
    assert(sortedByLikes[0].likes >= sortedByLikes[1].likes, 'First template should have higher or equal likes than second');

    const sortedByForks = getCommunityTemplates({ sort: 'forks' });
    assert(sortedByForks[0].forks >= sortedByForks[1].forks, 'First template should have higher or equal forks than second');

    const sortedByRating = getCommunityTemplates({ sort: 'rating' });
    assert(sortedByRating[0].rating >= sortedByRating[sortedByRating.length - 1].rating, 'First template should have higher rating than last');

    const limited = getCommunityTemplates({ limit: 3, offset: 0 });
    assert.strictEqual(limited.length, 3, 'Pagination limit should be respected');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. FORKING TEMPLATES TESTS
  // ─────────────────────────────────────────────────────────────────────────
  test('Fork Template into User Workspace', () => {
    const initialKick = getTemplateById('tpl_kick_livestream');
    const initialForks = initialKick.forks;

    const forkResult = forkTemplate('tpl_kick_livestream', 'usr_dev_999', {
      workspaceId: 'ws_saas',
      title: 'Custom DarthKubo Stream Channel'
    });

    assert(forkResult.success, 'Fork should be successful');
    assert(forkResult.project, 'Fork result should return project');
    assert.strictEqual(forkResult.project.userId, 'usr_dev_999');
    assert.strictEqual(forkResult.project.workspaceId, 'ws_saas');
    assert.strictEqual(forkResult.project.title, 'Custom DarthKubo Stream Channel');
    assert.strictEqual(forkResult.project.forkedFrom, 'tpl_kick_livestream');
    assert(forkResult.project.code.includes('KickStreamApp'), 'Project should contain full component code');
    assert(forkResult.project.tags.includes('Forked'), 'Project should include Forked tag');

    // Check template fork count incremented
    const updatedKick = getTemplateById('tpl_kick_livestream');
    assert.strictEqual(updatedKick.forks, initialForks + 1, 'Template fork count should increment by 1');

    // Check projects store has the forked project
    if (projectsStore && typeof projectsStore.getProjectById === 'function') {
      const savedInStore = projectsStore.getProjectById(forkResult.project.id);
      assert(savedInStore, 'Forked project should be saved in projectsStore');
      assert.strictEqual(savedInStore.workspaceId, 'ws_saas');
    }
  });

  test('Fork Invalid Template ID Throws Error', () => {
    assert.throws(() => {
      forkTemplate('invalid_template_id_999', 'usr_dev_001');
    }, /Template not found/, 'Should throw meaningful error when forking non-existent template');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. PUBLISHING NEW TEMPLATES TESTS
  // ─────────────────────────────────────────────────────────────────────────
  test('Publish New Community Showcase Clone', () => {
    const publishPayload = {
      title: 'Raycast MacOS Web Companion',
      category: 'Productivity & Developer Tools',
      framework: 'react-tailwind',
      featured: true,
      description: 'Browser extension and web companion for Raycast launcher workflows.',
      tags: ['Raycast', 'MacOS', 'Extensions', 'React 19'],
      tokensEstimate: 4200,
      code: `export default function RaycastWeb() { return <div className="p-4">Raycast Extension</div>; }`,
      promptRecipe: {
        systemPersona: 'Principal Raycast extension architect',
        keyInstructions: ['Build floating spotlight search interface with dark blur.'],
        suggestedComponents: ['RaycastSpotlight', 'ExtensionGrid']
      }
    };

    const authorInfo = {
      id: 'usr_raycast_fan',
      name: 'Oliver Thorne',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      badge: 'Extension Master',
      verified: true
    };

    const result = publishTemplate(publishPayload, authorInfo);
    assert(result.success, 'Publish should succeed');
    assert(result.template, 'Should return created template');
    assert.strictEqual(result.template.title, 'Raycast MacOS Web Companion');
    assert.strictEqual(result.template.author.name, 'Oliver Thorne');
    assert.strictEqual(result.template.author.verified, true);
    assert.strictEqual(result.template.rating, 5.0);
    assert.strictEqual(result.template.likes, 0);
    assert.strictEqual(result.template.forks, 0);

    // Verify it is now retrievable
    const retrieved = getTemplateById(result.template.id);
    assert(retrieved, 'Newly published template should be found by ID');
    assert.strictEqual(retrieved.slug, 'raycast-macos-web-companion');

    // Total templates count should now be 7
    assert.strictEqual(getCommunityTemplates().length, 7);
  });

  test('Publish Without Title Throws Error', () => {
    assert.throws(() => {
      publishTemplate({ description: 'No title provided' });
    }, /Template title is required/, 'Publishing without title should fail');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. LIKING & RATING TESTS
  // ─────────────────────────────────────────────────────────────────────────
  test('Like Community Template', () => {
    const netflix = getTemplateById('tpl_netflix_portal');
    const initialLikes = netflix.likes;

    const likeResult = likeTemplate('tpl_netflix_portal');
    assert(likeResult.success, 'Like operation should succeed');
    assert.strictEqual(likeResult.likes, initialLikes + 1, 'Likes should increment by 1');

    const updated = getTemplateById('tpl_netflix_portal');
    assert.strictEqual(updated.likes, initialLikes + 1);
  });

  test('Rate Community Template', () => {
    const linear = getTemplateById('tpl_linear_tracker');
    const initialReviews = linear.reviewsCount;

    const rateResult = rateTemplate('tpl_linear_tracker', 5);
    assert(rateResult.success);
    assert.strictEqual(rateResult.reviewsCount, initialReviews + 1);
    assert(typeof rateResult.rating === 'number');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. FEATURED, CATEGORIES, RECIPES & STATS TESTS
  // ─────────────────────────────────────────────────────────────────────────
  test('Get Featured Clones', () => {
    const featured = getFeaturedClones();
    assert(featured.length > 0, 'Should return featured templates');
    featured.forEach(t => {
      assert.strictEqual(t.featured, true, 'Every returned clone should have featured: true');
    });
  });

  test('Get Categories and Popular Tags Aggregations', () => {
    const categories = getCategories();
    assert(categories.includes('Entertainment & Streaming'));
    assert(categories.includes('Fintech & SaaS'));
    assert(categories.includes('Security & Privacy'));
    assert(categories.includes('Productivity & Developer Tools'));
    assert(categories.includes('Marketing & Landing Pages'));

    const tags = getPopularTags();
    assert(tags.length > 0);
    assert(tags[0].tag && typeof tags[0].count === 'number');
  });

  test('Get Prompt Recipes Extraction', () => {
    const recipes = getPromptRecipes();
    assert.strictEqual(recipes.length, getCommunityTemplates().length);
    recipes.forEach(r => {
      assert(r.templateId && r.title && r.recipe, 'Each prompt recipe should have title, templateId, and recipe object');
      assert(r.recipe.systemPersona, 'Recipe must contain systemPersona');
      assert(Array.isArray(r.recipe.keyInstructions), 'Recipe must contain keyInstructions array');
    });
  });

  test('Get Hub Statistics', () => {
    const stats = getHubStats();
    assert(stats.totalTemplates >= 6, 'Should report total templates');
    assert(stats.totalLikes > 0, 'Should report total likes');
    assert(stats.totalForks > 0, 'Should report total forks');
    assert(stats.categoriesCount >= 5, 'Should report categories count');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. EXPRESS HTTP API SERVER ENDPOINTS INTEGRATION TEST
  // ───────────────────────────────────────────────────────────────────────────
  await testAsync('Express HTTP API Community Endpoints Integration', async () => {
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 7a. GET /api/community/templates
      const listRes = await fetch(`${baseUrl}/api/community/templates?category=Fintech`);
      const listJson = await listRes.json();
      assert.strictEqual(listRes.status, 200);
      assert.strictEqual(listJson.success, true);
      assert(listJson.templates.length >= 1, 'Should return at least Stripe template');
      assert.strictEqual(listJson.templates[0].id, 'tpl_stripe_payments');

      // 7b. GET /api/community/templates/featured
      const featRes = await fetch(`${baseUrl}/api/community/templates/featured`);
      const featJson = await featRes.json();
      assert.strictEqual(featRes.status, 200);
      assert.strictEqual(featJson.success, true);
      assert(featJson.templates.length > 0);

      // 7c. GET /api/community/templates/:id
      const singleRes = await fetch(`${baseUrl}/api/community/templates/tpl_stripe_payments`);
      const singleJson = await singleRes.json();
      assert.strictEqual(singleRes.status, 200);
      assert.strictEqual(singleJson.template.id, 'tpl_stripe_payments');

      // 7d. POST /api/community/templates/:id/fork
      const forkRes = await fetch(`${baseUrl}/api/community/templates/tpl_stripe_payments/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'usr_http_test', workspaceId: 'ws_saas', title: 'Stripe SaaS Fork' })
      });
      const forkJson = await forkRes.json();
      assert.strictEqual(forkRes.status, 200);
      assert.strictEqual(forkJson.success, true);
      assert.strictEqual(forkJson.project.workspaceId, 'ws_saas');

      // 7e. POST /api/community/templates/:id/like
      const likeRes = await fetch(`${baseUrl}/api/community/templates/tpl_stripe_payments/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const likeJson = await likeRes.json();
      assert.strictEqual(likeRes.status, 200);
      assert.strictEqual(likeJson.success, true);
      assert(likeJson.likes > 0);

      // 7f. GET /api/community/categories & /api/community/stats
      const catRes = await fetch(`${baseUrl}/api/community/categories`);
      const catJson = await catRes.json();
      assert.strictEqual(catRes.status, 200);
      assert(catJson.categories.length >= 5);

      const statRes = await fetch(`${baseUrl}/api/community/stats`);
      const statJson = await statRes.json();
      assert.strictEqual(statRes.status, 200);
      assert(statJson.stats.totalTemplates >= 6);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`✅ Community Hub Verification Completed: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
