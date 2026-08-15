/**
 * Unit Test Suite for SitePrompter Database & Auth Engine
 * Tests Database CRUD, Indexing, Persistence, Encryption, and Authentication.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Database, createDatabase, encryptSecret, decryptSecret, maskKey } = require('../lib/db');
const {
  registerUser,
  loginUser,
  verifyToken,
  signToken,
  getOrCreateGuestUser,
  hashPassword,
  verifyPassword,
  authMiddleware,
  optionalAuthMiddleware,
} = require('../lib/auth');

const TEST_DB_PATH = path.join(__dirname, '..', 'data', 'test-store.json');

// Cleanup previous test files
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error:`, err.message);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 3).join('\n'));
    }
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting SitePrompter Database & Auth Test Suite');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. DATABASE INITIALIZATION & FILE PERSISTENCE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📦 1. Database Storage & Persistence Tests:');

  const testDb = createDatabase(TEST_DB_PATH);

  test('Database auto-initializes and creates disk file', () => {
    assert.strictEqual(fs.existsSync(TEST_DB_PATH), true, 'DB file should exist on disk');
    assert.deepStrictEqual(testDb.collections.users, []);
    assert.deepStrictEqual(testDb.collections.workspaces, []);
    assert.deepStrictEqual(testDb.collections.projects, []);
    assert.deepStrictEqual(testDb.collections.designTokens, []);
    assert.deepStrictEqual(testDb.collections.apiKeys, []);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. USERS COLLECTION CRUD & INDEXING
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n👤 2. Users Collection & Indexing Tests:');

  let user1, user2;

  test('Create user with plan, credits and timestamps', () => {
    user1 = testDb.createUser({
      email: 'alex@example.com',
      name: 'Alex Rivera',
      plan: 'pro',
      credits: 500,
    });

    assert.ok(user1.id.startsWith('usr_'), 'User ID should have prefix usr_');
    assert.strictEqual(user1.email, 'alex@example.com');
    assert.strictEqual(user1.name, 'Alex Rivera');
    assert.strictEqual(user1.plan, 'pro');
    assert.strictEqual(user1.credits, 500);
    assert.strictEqual(user1.isGuest, false);
    assert.ok(user1.createdAt, 'Should have createdAt timestamp');
  });

  test('Prevents duplicate email registration', () => {
    assert.throws(
      () => {
        testDb.createUser({ email: 'alex@example.com', name: 'Alex Clone' });
      },
      /already exists/,
      'Should throw error on duplicate email'
    );
  });

  test('Retrieve user by ID and by Email (case-insensitive indexing)', () => {
    const byId = testDb.getUserById(user1.id);
    assert.strictEqual(byId.id, user1.id);
    assert.strictEqual(byId.name, 'Alex Rivera');

    const byEmail = testDb.getUserByEmail('ALEX@EXAMPLE.COM');
    assert.ok(byEmail, 'Should find user with uppercase email search');
    assert.strictEqual(byEmail.id, user1.id);
  });

  test('Update user properties & credits', () => {
    const updated = testDb.updateUser(user1.id, {
      name: 'Alex Rivera (Lead)',
      credits: 450,
      plan: 'agency',
    });

    assert.strictEqual(updated.name, 'Alex Rivera (Lead)');
    assert.strictEqual(updated.credits, 450);
    assert.strictEqual(updated.plan, 'agency');

    const fresh = testDb.getUserById(user1.id);
    assert.strictEqual(fresh.credits, 450);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. WORKSPACES COLLECTION CRUD
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🏢 3. Workspaces Collection Tests:');

  let ws1, ws2;

  test('Create default workspace for user', () => {
    ws1 = testDb.createWorkspace({
      userId: user1.id,
      name: 'Main Workspace',
      isDefault: true,
    });

    assert.ok(ws1.id.startsWith('ws_'));
    assert.strictEqual(ws1.userId, user1.id);
    assert.strictEqual(ws1.isDefault, true);

    const def = testDb.getDefaultWorkspace(user1.id);
    assert.strictEqual(def.id, ws1.id);
  });

  test('Creating new default workspace unsets previous default', () => {
    ws2 = testDb.createWorkspace({
      userId: user1.id,
      name: 'Secondary Workspace',
      isDefault: true,
    });

    const userWorkspaces = testDb.getWorkspacesByUserId(user1.id);
    assert.strictEqual(userWorkspaces.length, 2);

    const oldWs = testDb.getWorkspaceById(ws1.id);
    const newWs = testDb.getWorkspaceById(ws2.id);

    assert.strictEqual(oldWs.isDefault, false, 'Old workspace isDefault should be false');
    assert.strictEqual(newWs.isDefault, true, 'New workspace isDefault should be true');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. PROJECTS COLLECTION CRUD, SEARCH & FILTERING
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📁 4. Projects Collection Tests:');

  let proj1, proj2, proj3;

  test('Create projects with telemetry, framework and code', () => {
    proj1 = testDb.createProject({
      workspaceId: ws2.id,
      userId: user1.id,
      title: 'Stripe Landing Page Clone',
      targetUrl: 'https://stripe.com',
      framework: 'react-tailwind',
      telemetryData: {
        meta: { title: 'Stripe' },
        typography: { primaryFont: 'Inter' },
        colors: { primary: '#635BFF', background: '#0A2540' },
      },
      generatedCode: '<div className="bg-[#0A2540] text-white">Hero</div>',
      multiPageData: [{ path: '/', title: 'Home' }, { path: '/pricing', title: 'Pricing' }],
      isFavorite: true,
      tags: ['fintech', 'saas', 'dark-mode'],
    });

    assert.ok(proj1.id.startsWith('proj_'));
    assert.strictEqual(proj1.workspaceId, ws2.id);
    assert.strictEqual(proj1.framework, 'react-tailwind');
    assert.strictEqual(proj1.isFavorite, true);
    assert.strictEqual(proj1.tags.length, 3);
  });

  test('Create multiple projects and query by workspace with filters & search', () => {
    proj2 = testDb.createProject({
      workspaceId: ws2.id,
      userId: user1.id,
      title: 'Linear App Hero Clone',
      targetUrl: 'https://linear.app',
      framework: 'nextjs',
      isFavorite: false,
      tags: ['saas', 'minimal'],
    });

    proj3 = testDb.createProject({
      workspaceId: ws2.id,
      userId: user1.id,
      title: 'Vercel Dashboard Clone',
      targetUrl: 'https://vercel.com',
      framework: 'react-tailwind',
      isFavorite: true,
      tags: ['dashboard', 'devtools'],
    });

    const allInWs = testDb.getProjectsByWorkspaceId(ws2.id);
    assert.strictEqual(allInWs.length, 3);

    // Filter by isFavorite
    const favorites = testDb.getProjectsByWorkspaceId(ws2.id, { isFavorite: true });
    assert.strictEqual(favorites.length, 2);

    // Filter by framework
    const reactProjects = testDb.getProjectsByWorkspaceId(ws2.id, { framework: 'react-tailwind' });
    assert.strictEqual(reactProjects.length, 2);

    // Search by title/tag
    const searchResults = testDb.getProjectsByWorkspaceId(ws2.id, { search: 'linear' });
    assert.strictEqual(searchResults.length, 1);
    assert.strictEqual(searchResults[0].id, proj2.id);
  });

  test('Toggle project favorite status', () => {
    const toggled = testDb.toggleFavorite(proj2.id);
    assert.strictEqual(toggled.isFavorite, true);

    const fresh = testDb.getProjectById(proj2.id);
    assert.strictEqual(fresh.isFavorite, true);
  });

  test('Update project generated code and title', () => {
    const updated = testDb.updateProject(proj1.id, {
      title: 'Stripe V2 Ultra Clone',
      generatedCode: '<main className="updated-hero">Updated Content</main>',
    });

    assert.strictEqual(updated.title, 'Stripe V2 Ultra Clone');
    assert.strictEqual(updated.generatedCode, '<main className="updated-hero">Updated Content</main>');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. DESIGN TOKENS COLLECTION
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🎨 5. Design Tokens Storage Tests:');

  let tokensRecord;

  test('Upsert and retrieve design tokens for a project', () => {
    tokensRecord = testDb.createOrUpdateDesignTokens({
      projectId: proj1.id,
      tailwindConfig: {
        theme: {
          extend: {
            colors: { brand: '#635BFF' },
          },
        },
      },
      figmaTokens: {
        color: { brand: { value: '#635BFF', type: 'color' } },
      },
      cssTheme: ':root { --brand: #635BFF; }',
      colors: [{ hex: '#635BFF', count: 12, name: 'Brand Indigo' }],
      typography: { primaryFont: 'Inter', scale: ['14px', '16px', '24px', '48px'] },
    });

    assert.ok(tokensRecord.id.startsWith('tok_'));
    assert.strictEqual(tokensRecord.projectId, proj1.id);

    const fetched = testDb.getDesignTokensByProjectId(proj1.id);
    assert.ok(fetched);
    assert.strictEqual(fetched.colors[0].hex, '#635BFF');
    assert.strictEqual(fetched.cssTheme, ':root { --brand: #635BFF; }');
  });

  test('Updating design tokens preserves project link and updates timestamp', () => {
    const updated = testDb.createOrUpdateDesignTokens({
      projectId: proj1.id,
      cssTheme: ':root { --brand: #4F46E5; }',
    });

    assert.strictEqual(updated.id, tokensRecord.id);
    assert.strictEqual(updated.cssTheme, ':root { --brand: #4F46E5; }');
    assert.strictEqual(updated.colors[0].hex, '#635BFF', 'Preserves untouched fields');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. API KEYS (ENCRYPTED STORAGE)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🔐 6. API Keys Encryption & Management Tests:');

  test('Save, mask, and securely decrypt API keys for AI providers', () => {
    const rawKey = 'sk-ant-api03-verysecretanthropicapikey123456789';
    const saved = testDb.saveApiKey({
      userId: user1.id,
      provider: 'anthropic',
      apiKey: rawKey,
    });

    assert.strictEqual(saved.provider, 'anthropic');
    assert.strictEqual(saved.maskedKey, maskKey(rawKey));
    assert.strictEqual(saved.maskedKey.startsWith('sk-a'), true);
    assert.strictEqual(saved.maskedKey.endsWith('6789'), true);
    assert.strictEqual(saved.apiKey, undefined, 'Plaintext key should not leak in saved response');

    // Retrieve masked keys list
    const userKeys = testDb.getApiKeysByUserId(user1.id, false);
    assert.strictEqual(userKeys.length, 1);
    assert.strictEqual(userKeys[0].apiKey, undefined);

    // Retrieve decrypted key for internal agent execution
    const decryptedRecord = testDb.getApiKeyByProvider(user1.id, 'anthropic', true);
    assert.ok(decryptedRecord);
    assert.strictEqual(decryptedRecord.apiKey, rawKey);
  });

  test('Rejects invalid AI provider names', () => {
    assert.throws(
      () => {
        testDb.saveApiKey({
          userId: user1.id,
          provider: 'unsupported-provider',
          apiKey: 'key_123',
        });
      },
      /Provider must be one of/,
      'Should reject unsupported providers'
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. PERSISTENCE & RELOAD TEST
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n💾 7. Persistence & Cold Reload Tests:');

  test('New Database instance loads persisted data and rebuilds indexes correctly', () => {
    const reloadedDb = createDatabase(TEST_DB_PATH);
    assert.strictEqual(reloadedDb.collections.users.length, 1);
    assert.strictEqual(reloadedDb.collections.workspaces.length, 2);
    assert.strictEqual(reloadedDb.collections.projects.length, 3);
    assert.strictEqual(reloadedDb.collections.designTokens.length, 1);
    assert.strictEqual(reloadedDb.collections.apiKeys.length, 1);

    const user = reloadedDb.getUserByEmail('alex@example.com');
    assert.ok(user);
    assert.strictEqual(user.name, 'Alex Rivera (Lead)');

    const project = reloadedDb.getProjectById(proj1.id);
    assert.ok(project);
    assert.strictEqual(project.title, 'Stripe V2 Ultra Clone');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. AUTHENTICATION & JWT ENGINE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🔑 8. Authentication & JWT Engine Tests:');

  let authUser, authToken;

  test('Register new user with hashed password and auto-created workspace', () => {
    const regResult = registerUser(
      {
        email: 'developer@siteprompter.dev',
        password: 'SuperSecretPassword123!',
        name: 'Lead Developer',
        plan: 'pro',
      },
      testDb
    );

    assert.ok(regResult.user);
    assert.strictEqual(regResult.user.email, 'developer@siteprompter.dev');
    assert.strictEqual(regResult.user.plan, 'pro');
    assert.strictEqual(regResult.user.credits, 500);
    assert.strictEqual(regResult.user.passwordHash, undefined, 'passwordHash must be stripped');
    assert.strictEqual(regResult.user.salt, undefined, 'salt must be stripped');

    assert.ok(regResult.workspace);
    assert.strictEqual(regResult.workspace.userId, regResult.user.id);
    assert.strictEqual(regResult.workspace.isDefault, true);

    assert.ok(regResult.token, 'Should generate JWT token');
    authUser = regResult.user;
    authToken = regResult.token;
  });

  test('Verify valid JWT token', () => {
    const decoded = verifyToken(authToken);
    assert.strictEqual(decoded.userId, authUser.id);
    assert.strictEqual(decoded.email, 'developer@siteprompter.dev');
    assert.strictEqual(decoded.plan, 'pro');
    assert.strictEqual(decoded.isGuest, false);
    assert.ok(decoded.exp > Math.floor(Date.now() / 1000));
  });

  test('Login user with correct credentials', () => {
    const loginResult = loginUser(
      {
        email: 'developer@siteprompter.dev',
        password: 'SuperSecretPassword123!',
      },
      testDb
    );

    assert.strictEqual(loginResult.user.id, authUser.id);
    assert.ok(loginResult.token);
    assert.strictEqual(loginResult.workspace.userId, authUser.id);
  });

  test('Login fails with incorrect password', () => {
    assert.throws(
      () => {
        loginUser(
          {
            email: 'developer@siteprompter.dev',
            password: 'WrongPassword!',
          },
          testDb
        );
      },
      /Invalid email or password/
    );
  });

  test('Verify token fails on tampered token or signature mismatch', () => {
    const tampered = authToken.slice(0, -4) + 'abcd';
    assert.throws(
      () => {
        verifyToken(tampered);
      },
      /Invalid token signature/
    );
  });

  test('Verify token fails on expired token', () => {
    const expiredToken = signToken({ userId: 'temp' }, undefined, -100);
    assert.throws(
      () => {
        verifyToken(expiredToken);
      },
      /Token has expired/
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. ZERO-FRICTION GUEST USER SESSIONS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n⚡ 9. Guest User Session Tests:');

  let guest1;

  test('Create initial guest user without credentials', () => {
    guest1 = getOrCreateGuestUser(null, testDb);

    assert.strictEqual(guest1.isNew, true);
    assert.strictEqual(guest1.user.isGuest, true);
    assert.ok(guest1.user.guestId);
    assert.strictEqual(guest1.user.credits, 25);
    assert.ok(guest1.workspace);
    assert.ok(guest1.token);

    const decoded = verifyToken(guest1.token);
    assert.strictEqual(decoded.isGuest, true);
    assert.strictEqual(decoded.guestId, guest1.user.guestId);
  });

  test('Re-calling getOrCreateGuestUser with existing guestId returns same user', () => {
    const guestRevisit = getOrCreateGuestUser(guest1.user.guestId, testDb);

    assert.strictEqual(guestRevisit.isNew, false);
    assert.strictEqual(guestRevisit.user.id, guest1.user.id);
    assert.strictEqual(guestRevisit.user.guestId, guest1.user.guestId);
    assert.ok(guestRevisit.token);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. EXPRESS MIDDLEWARE INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️ 10. Express Middleware Tests:');

  test('authMiddleware succeeds with valid Bearer header', () => {
    const req = {
      headers: { authorization: `Bearer ${authToken}` },
    };
    let nextCalled = false;
    const res = {
      status: () => res,
      json: () => {},
    };

    authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.userId, authUser.id);
    assert.strictEqual(req.user.email, 'developer@siteprompter.dev');
  });

  test('authMiddleware blocks unauthorized requests', () => {
    const req = { headers: {} };
    let statusSet = 0;
    let jsonOutput = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return res;
      },
      json: (data) => {
        jsonOutput = data;
      },
    };

    authMiddleware(req, res, () => {
      assert.fail('next() should not be called');
    });

    assert.strictEqual(statusSet, 401);
    assert.strictEqual(jsonOutput.success, false);
  });

  test('optionalAuthMiddleware populates user when token is present and null when absent', () => {
    const reqWithToken = { headers: { authorization: `Bearer ${authToken}` } };
    optionalAuthMiddleware(reqWithToken, {}, () => {});
    assert.strictEqual(reqWithToken.userId, authUser.id);

    const reqWithoutToken = { headers: {} };
    optionalAuthMiddleware(reqWithoutToken, {}, () => {});
    assert.strictEqual(reqWithoutToken.user, null);
    assert.strictEqual(reqWithoutToken.userId, null);
  });

  // Cleanup test DB file
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
