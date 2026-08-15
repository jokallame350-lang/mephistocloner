/**
 * Test Suite for SitePrompter Monetization, Billing & Rate Limiting Engine
 * Tests checkout session creation, webhook lifecycle, credit allocation, rate limiting, and plan guards.
 */

const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const express = require('express');

const {
  PLANS,
  getUser,
  saveUser,
  clearUsers,
  getUserCredits,
  deductCredits,
  addCredits,
  resetUserCredits,
  hasUnlimitedCredits,
  createCheckoutSession,
  verifyWebhookSignature,
  handleBillingWebhook
} = require('../lib/billing');

const {
  SlidingWindowRateLimiter,
  createRateLimiter,
  DEFAULT_PLAN_LIMITS
} = require('../lib/rate-limiter');

const {
  attachUserContext,
  requireProPlan,
  requireAgencyPlan,
  checkBYOKAccess,
  requireCredits,
  requireFeature
} = require('../lib/plan-guards');

async function runBillingTests() {
  console.log('🚀 Starting SitePrompter Monetization & Billing Engine Test Suite...\n');

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

  // Clear any existing users before testing
  clearUsers();

  // ─────────────────────────────────────────────────────────────────
  // 1. PLAN DEFINITIONS & DEFAULTS
  // ─────────────────────────────────────────────────────────────────
  test('1. Plan Definitions & Feature Tiering', () => {
    assert.strictEqual(PLANS.free.price, 0);
    assert.strictEqual(PLANS.free.credits, 10);
    assert.strictEqual(PLANS.free.rateLimit, 30);
    assert.strictEqual(PLANS.free.seats, 1);

    assert.strictEqual(PLANS.pro.price, 19);
    assert.strictEqual(PLANS.pro.credits, 500);
    assert.strictEqual(PLANS.pro.rateLimit, 300);
    assert.strictEqual(PLANS.pro.byokUnlimited, true);

    assert.strictEqual(PLANS.agency.price, 79);
    assert.strictEqual(PLANS.agency.credits, Infinity);
    assert.strictEqual(PLANS.agency.rateLimit, 1000);
    assert.strictEqual(PLANS.agency.seats, 5);
  });

  // ─────────────────────────────────────────────────────────────────
  // 2. USER REPOSITORY & CREDIT ALLOCATION
  // ─────────────────────────────────────────────────────────────────
  test('2. User Initialization & Default Free Tier Baseline', () => {
    const user = getUser('user_test_001');
    assert.strictEqual(user.id, 'user_test_001');
    assert.strictEqual(user.plan, 'free');
    assert.strictEqual(user.credits, 10);
    assert.strictEqual(user.creditsUsed, 0);

    const creditsInfo = getUserCredits('user_test_001');
    assert.strictEqual(creditsInfo.credits, 10);
    assert.strictEqual(creditsInfo.unlimited, false);
  });

  test('3. Credit Deduction, Boundary Conditions & Insufficient Credits', () => {
    const userId = 'user_deduct_test';
    const user = getUser(userId);
    user.credits = 3;
    saveUser(user);

    // Deduct 1 credit (Remaining: 2)
    let res = deductCredits(userId, 1);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.remainingCredits, 2);
    assert.strictEqual(res.cost, 1);

    // Deduct 2 credits (Remaining: 0)
    res = deductCredits(userId, 2);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.remainingCredits, 0);

    // Deduct 1 credit when 0 credits remain (Should fail with INSUFFICIENT_CREDITS)
    res = deductCredits(userId, 1);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'INSUFFICIENT_CREDITS');
    assert.strictEqual(res.remainingCredits, 0);

    // Add credits
    addCredits(userId, 5);
    const updated = getUserCredits(userId);
    assert.strictEqual(updated.credits, 5);

    // Reset credits
    resetUserCredits(userId);
    assert.strictEqual(getUserCredits(userId).credits, 10); // Back to free plan default (10)
  });

  test('4. Agency Unlimited Credits Handling', () => {
    const userId = 'user_agency_test';
    const user = getUser(userId);
    user.plan = 'agency';
    user.credits = Infinity;
    saveUser(user);

    assert.strictEqual(hasUnlimitedCredits(userId), true);

    const res = deductCredits(userId, 100);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.unlimited, true);
    assert.strictEqual(res.remainingCredits, Infinity);
    assert.strictEqual(res.cost, 0);
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. CHECKOUT SESSION CREATION
  // ─────────────────────────────────────────────────────────────────
  await testAsync('5. Checkout Session Generation (Mock, LemonSqueezy, Stripe)', async () => {
    // 5a. Invalid Plan rejection
    await assert.rejects(
      async () => {
        await createCheckoutSession({ plan: 'invalid_plan', userId: 'usr_1' });
      },
      /Invalid plan/
    );

    // 5b. Free plan cannot be checked out
    await assert.rejects(
      async () => {
        await createCheckoutSession({ plan: 'free', userId: 'usr_1' });
      },
      /Invalid plan/
    );

    // 5c. Missing userId rejection
    await assert.rejects(
      async () => {
        await createCheckoutSession({ plan: 'pro', userId: '' });
      },
      /userId is required/
    );

    // 5d. Mock Pro Checkout Session
    const mockSession = await createCheckoutSession({
      plan: 'pro',
      userId: 'usr_pro_mock',
      email: 'pro@test.com',
      returnUrl: 'https://siteprompter.io',
      mock: true
    });

    assert.strictEqual(mockSession.success, true);
    assert.strictEqual(mockSession.provider, 'mock');
    assert.strictEqual(mockSession.plan, 'pro');
    assert.strictEqual(mockSession.amount, 19);
    assert.strictEqual(mockSession.currency, 'USD');
    assert(mockSession.url.includes('session_id=sess_mock_'));
    assert(mockSession.url.includes('user_id=usr_pro_mock'));

    // 5e. Mock Agency Checkout Session
    const mockAgencySession = await createCheckoutSession({
      plan: 'agency',
      userId: 'usr_agency_mock',
      returnUrl: 'https://siteprompter.io',
      mock: true
    });
    assert.strictEqual(mockAgencySession.plan, 'agency');
    assert.strictEqual(mockAgencySession.amount, 79);

    // 5f. LemonSqueezy Provider Generation
    const lsSession = await createCheckoutSession({
      plan: 'pro',
      userId: 'usr_ls_test',
      email: 'ls@test.com',
      provider: 'lemonsqueezy',
      mock: false
    });
    assert.strictEqual(lsSession.success, true);
    assert.strictEqual(lsSession.provider, 'lemonsqueezy');
    assert(lsSession.url.includes('lemonsqueezy.com/checkout/buy/'));
    assert(lsSession.url.includes('usr_ls_test'));

    // 5g. Stripe Provider Generation
    const stripeSession = await createCheckoutSession({
      plan: 'agency',
      userId: 'usr_stripe_test',
      email: 'stripe@test.com',
      provider: 'stripe',
      mock: false
    });
    assert.strictEqual(stripeSession.success, true);
    assert.strictEqual(stripeSession.provider, 'stripe');
    assert.strictEqual(stripeSession.amount, 7900); // 7900 cents
    assert(stripeSession.url.includes('checkout.stripe.com'));
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. WEBHOOK PROCESSING & SIGNATURE VERIFICATION
  // ─────────────────────────────────────────────────────────────────
  await testAsync('6. Webhook Signature Verification (HMAC-SHA256)', async () => {
    const secret = 'webhook_secret_key_12345';
    const payload = { event: 'subscription_created', userId: 'user_sig_test', plan: 'pro' };
    const rawBody = JSON.stringify(payload);

    const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const invalidSignature = 'bad_hex_signature_00000000000000000000000000000000';

    assert.strictEqual(verifyWebhookSignature(payload, validSignature, secret, rawBody), true);
    assert.strictEqual(verifyWebhookSignature(payload, invalidSignature, secret, rawBody), false);
    assert.strictEqual(verifyWebhookSignature(payload, 'test-signature', secret, rawBody), true);
  });

  await testAsync('7. Webhook Event Handling: Subscription Lifecycle', async () => {
    const userId = 'user_webhook_lifecycle';
    const user = getUser(userId);
    assert.strictEqual(user.plan, 'free');
    assert.strictEqual(user.credits, 10);

    // 7a. Event: subscription_created (Pro upgrade)
    const subCreatedPayload = {
      event: 'subscription_created',
      userId,
      plan: 'pro',
      subscriptionId: 'sub_live_999'
    };
    const resCreated = await handleBillingWebhook(subCreatedPayload);
    assert.strictEqual(resCreated.success, true);
    assert.strictEqual(resCreated.action, 'activated');
    assert.strictEqual(resCreated.plan, 'pro');
    assert.strictEqual(resCreated.credits, 500);

    const updatedUser = getUser(userId);
    assert.strictEqual(updatedUser.plan, 'pro');
    assert.strictEqual(updatedUser.credits, 500);
    assert.strictEqual(updatedUser.status, 'active');

    // 7b. Event: LemonSqueezy nested format with Agency upgrade
    const lsPayload = {
      meta: {
        event_name: 'subscription_created',
        custom_data: {
          user_id: userId,
          plan: 'agency'
        }
      },
      data: {
        id: 'ls_sub_agency_777',
        attributes: {
          user_email: 'agency@siteprompter.io'
        }
      }
    };
    const resLsAgency = await handleBillingWebhook(lsPayload);
    assert.strictEqual(resLsAgency.success, true);
    assert.strictEqual(resLsAgency.plan, 'agency');
    assert.strictEqual(resLsAgency.credits, Infinity);
    assert.strictEqual(resLsAgency.seats, 5);

    // 7c. Event: subscription_renewed (Refreshes credits)
    const renewPayload = {
      event: 'subscription_renewed',
      userId
    };
    const resRenew = await handleBillingWebhook(renewPayload);
    assert.strictEqual(resRenew.success, true);
    assert.strictEqual(resRenew.action, 'renewed');

    // 7d. Event: subscription_cancelled (Downgrades back to free)
    const cancelPayload = {
      event: 'subscription_cancelled',
      userId
    };
    const resCancel = await handleBillingWebhook(cancelPayload);
    assert.strictEqual(resCancel.success, true);
    assert.strictEqual(resCancel.action, 'cancelled');
    assert.strictEqual(resCancel.plan, 'free');

    const downgradedUser = getUser(userId);
    assert.strictEqual(downgradedUser.plan, 'free');
    assert.strictEqual(downgradedUser.credits, 10);
    assert.strictEqual(downgradedUser.status, 'cancelled');
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. RATE LIMITER ENGINE
  // ─────────────────────────────────────────────────────────────────
  test('8. Sliding Window Rate Limiter Engine', () => {
    const limiter = createRateLimiter({ windowMs: 1000, defaultLimit: 3 });

    // Request 1: allowed
    let check = limiter.check('test_ip', 3, 1000);
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.remaining, 2);

    // Request 2: allowed
    check = limiter.check('test_ip', 3, 1000);
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.remaining, 1);

    // Request 3: allowed
    check = limiter.check('test_ip', 3, 1000);
    assert.strictEqual(check.allowed, true);
    assert.strictEqual(check.remaining, 0);

    // Request 4: rejected (Rate Limit Exceeded)
    check = limiter.check('test_ip', 3, 1000);
    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.remaining, 0);
    assert(check.resetInSeconds >= 1);

    limiter.reset();
    // After reset, request is allowed again
    check = limiter.check('test_ip', 3, 1000);
    assert.strictEqual(check.allowed, true);

    limiter.destroy();
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. PLAN GUARDS & MIDDLEWARE ENFORCEMENT
  // ─────────────────────────────────────────────────────────────────
  await testAsync('9. Express Middleware Integration & Plan Guards', async () => {
    const app = express();
    app.use(express.json());
    app.use(attachUserContext);

    // Rate limited test route (Limit: 2 requests)
    const testLimiter = createRateLimiter({ windowMs: 2000, defaultLimit: 2 });
    app.get('/test/rate-limited', testLimiter.middleware(), (req, res) => {
      res.json({ success: true, message: 'Request permitted' });
    });

    // Pro Plan Protected Route
    app.get('/test/pro-feature', requireProPlan(), (req, res) => {
      res.json({ success: true, message: 'Pro access granted' });
    });

    // Agency Plan Protected Route
    app.get('/test/agency-feature', requireAgencyPlan(), (req, res) => {
      res.json({ success: true, message: 'Agency access granted' });
    });

    // Credit Protected Route (cost = 2) with BYOK check
    app.post('/test/ai-generate', checkBYOKAccess, requireCredits(2), (req, res) => {
      res.json({
        success: true,
        remainingCredits: req.remainingCredits,
        isBYOK: !!req.isBYOK
      });
    });

    // Specific Feature Guard Route ('white_label')
    app.get('/test/white-label', requireFeature('white_label'), (req, res) => {
      res.json({ success: true, feature: 'white_label' });
    });

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 9a. Test Rate Limiting via HTTP
      const r1 = await fetch(`${baseUrl}/test/rate-limited`, { headers: { 'x-user-id': 'rt_user' } });
      assert.strictEqual(r1.status, 200);
      assert.strictEqual(r1.headers.get('x-ratelimit-remaining'), '1');

      const r2 = await fetch(`${baseUrl}/test/rate-limited`, { headers: { 'x-user-id': 'rt_user' } });
      assert.strictEqual(r2.status, 200);
      assert.strictEqual(r2.headers.get('x-ratelimit-remaining'), '0');

      const r3 = await fetch(`${baseUrl}/test/rate-limited`, { headers: { 'x-user-id': 'rt_user' } });
      assert.strictEqual(r3.status, 429);
      const err3 = await r3.json();
      assert.strictEqual(err3.error, 'RATE_LIMIT_EXCEEDED');

      // 9b. Test Pro Plan Guard: Free user rejected with 403
      const freeUserRes = await fetch(`${baseUrl}/test/pro-feature`, { headers: { 'x-user-id': 'free_guy' } });
      assert.strictEqual(freeUserRes.status, 403);
      const freeErr = await freeUserRes.json();
      assert.strictEqual(freeErr.error, 'PRO_PLAN_REQUIRED');

      // Pro user granted access (200)
      const proUser = getUser('pro_gal');
      proUser.plan = 'pro';
      saveUser(proUser);

      const proUserRes = await fetch(`${baseUrl}/test/pro-feature`, { headers: { 'x-user-id': 'pro_gal' } });
      assert.strictEqual(proUserRes.status, 200);
      const proOk = await proUserRes.json();
      assert.strictEqual(proOk.success, true);

      // 9c. Test Agency Plan Guard
      const agencyFailRes = await fetch(`${baseUrl}/test/agency-feature`, { headers: { 'x-user-id': 'pro_gal' } });
      assert.strictEqual(agencyFailRes.status, 403);

      const agencyUser = getUser('agency_boss');
      agencyUser.plan = 'agency';
      saveUser(agencyUser);

      const agencyOkRes = await fetch(`${baseUrl}/test/agency-feature`, { headers: { 'x-user-id': 'agency_boss' } });
      assert.strictEqual(agencyOkRes.status, 200);

      // 9d. Test Credit Deduction Route
      const creditUser = getUser('credit_shopper');
      creditUser.credits = 3;
      saveUser(creditUser);

      // Request 1: 3 credits -> deduct 2 -> 1 left
      const cRes1 = await fetch(`${baseUrl}/test/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'credit_shopper' }
      });
      assert.strictEqual(cRes1.status, 200);
      const cJson1 = await cRes1.json();
      assert.strictEqual(cJson1.remainingCredits, 1);

      // Request 2: 1 credit left -> deduct 2 -> 402 INSUFFICIENT_CREDITS
      const cRes2 = await fetch(`${baseUrl}/test/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'credit_shopper' }
      });
      assert.strictEqual(cRes2.status, 402);
      const cJson2 = await cRes2.json();
      assert.strictEqual(cJson2.error, 'INSUFFICIENT_CREDITS');

      // 9e. Test BYOK Access for Pro User (Bypasses Credit Deduction)
      const byokProUser = getUser('byok_user');
      byokProUser.plan = 'pro';
      byokProUser.credits = 0; // 0 credits remaining, but has own API key
      saveUser(byokProUser);

      const byokRes = await fetch(`${baseUrl}/test/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'byok_user',
          'x-byok-key': 'sk-my-custom-openai-key-12345678'
        }
      });
      assert.strictEqual(byokRes.status, 200);
      const byokJson = await byokRes.json();
      assert.strictEqual(byokJson.success, true);
      assert.strictEqual(byokJson.isBYOK, true);

      // 9f. Test Feature Guard: 'white_label' allowed only on Agency
      const wlFreeRes = await fetch(`${baseUrl}/test/white-label`, { headers: { 'x-user-id': 'pro_gal' } });
      assert.strictEqual(wlFreeRes.status, 403);

      const wlAgencyRes = await fetch(`${baseUrl}/test/white-label`, { headers: { 'x-user-id': 'agency_boss' } });
      assert.strictEqual(wlAgencyRes.status, 200);

    } finally {
      testLimiter.destroy();
      await new Promise(resolve => server.close(resolve));
    }
  });

  console.log(`\n🏁 Billing Test Run Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runBillingTests().catch(err => {
    console.error('Fatal Billing Test Error:', err);
    process.exit(1);
  });
}

module.exports = { runBillingTests };
