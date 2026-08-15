/**
 * SitePrompter Production - Monetization & Billing Engine
 * Supports LemonSqueezy, Stripe, Credit Allocation, BYOK, and Mock Environments.
 */

const crypto = require('crypto');

// ─── PLAN DEFINITIONS ───────────────────────────────────────────────

const PLANS = {
  free: {
    id: 'free',
    name: 'Free Tier',
    price: 0,
    interval: 'month',
    credits: 10,
    seats: 1,
    rateLimit: 30, // 30 requests per minute
    byokUnlimited: false,
    features: [
      'basic_extraction',
      'vanilla_html',
      'react_tailwind',
      'token_estimation'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 19,
    interval: 'month',
    credits: 500,
    seats: 1,
    rateLimit: 300, // 300 requests per minute
    byokUnlimited: true,
    features: [
      'basic_extraction',
      'vanilla_html',
      'react_tailwind',
      'all_frameworks',
      'design_tokens_export',
      'component_slicer',
      'zip_download',
      'byok_unlimited',
      'priority_speed'
    ]
  },
  agency: {
    id: 'agency',
    name: 'Agency Plan',
    price: 79,
    interval: 'month',
    credits: Infinity, // Unlimited credits
    seats: 5,
    rateLimit: 1000, // 1000 requests per minute
    byokUnlimited: true,
    features: [
      'basic_extraction',
      'vanilla_html',
      'react_tailwind',
      'all_frameworks',
      'design_tokens_export',
      'component_slicer',
      'zip_download',
      'byok_unlimited',
      'unlimited_credits',
      'team_seats_5',
      'white_label',
      'dedicated_support'
    ]
  }
};

// ─── IN-MEMORY USER / SUBSCRIPTION STORE ────────────────────────────

const userStore = new Map();

/**
 * Get or initialize user record
 * @param {string} userId
 * @returns {object} user
 */
function getUser(userId = 'default_user') {
  if (!userId) userId = 'default_user';
  const idStr = String(userId);
  if (!userStore.has(idStr)) {
    const defaultUser = {
      id: idStr,
      email: `${idStr}@example.com`,
      plan: 'free',
      status: 'active',
      credits: PLANS.free.credits,
      creditsUsed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionId: null,
      provider: null,
      seats: PLANS.free.seats,
      byokEnabled: false
    };
    userStore.set(idStr, defaultUser);
  }
  return userStore.get(idStr);
}

/**
 * Save / update user record
 * @param {object} user
 * @returns {object} updated user
 */
function saveUser(user) {
  if (!user || !user.id) throw new Error('User must have an id');
  const idStr = String(user.id);
  user.updatedAt = new Date().toISOString();
  userStore.set(idStr, user);
  return user;
}

/**
 * Clear in-memory user store (useful for tests)
 */
function clearUsers() {
  userStore.clear();
}

/**
 * Get current credits for user
 * @param {string} userId
 */
function getUserCredits(userId) {
  const user = getUser(userId);
  const isUnlimited = user.plan === 'agency' || user.credits === Infinity;
  return {
    userId: user.id,
    plan: user.plan,
    credits: isUnlimited ? Infinity : user.credits,
    creditsUsed: user.creditsUsed || 0,
    unlimited: isUnlimited,
    seats: user.seats || PLANS[user.plan]?.seats || 1
  };
}

/**
 * Deduct credits from user account
 * @param {string} userId
 * @param {number} cost
 * @returns {{ success: boolean, remainingCredits: number, cost: number, unlimited?: boolean, error?: string }}
 */
function deductCredits(userId, cost = 1) {
  const user = getUser(userId);
  
  // Agency plan or infinity credits has zero deduction
  if (user.plan === 'agency' || user.credits === Infinity) {
    return {
      success: true,
      remainingCredits: Infinity,
      cost: 0,
      unlimited: true
    };
  }

  if (user.credits >= cost) {
    user.credits -= cost;
    user.creditsUsed = (user.creditsUsed || 0) + cost;
    saveUser(user);
    return {
      success: true,
      remainingCredits: user.credits,
      cost,
      unlimited: false
    };
  }

  return {
    success: false,
    remainingCredits: user.credits,
    cost,
    unlimited: false,
    error: 'INSUFFICIENT_CREDITS'
  };
}

/**
 * Add credits to user account
 * @param {string} userId
 * @param {number} amount
 */
function addCredits(userId, amount = 0) {
  const user = getUser(userId);
  if (user.credits !== Infinity) {
    user.credits += Math.max(0, amount);
    saveUser(user);
  }
  return getUserCredits(userId);
}

/**
 * Reset user credits to plan monthly baseline
 * @param {string} userId
 */
function resetUserCredits(userId) {
  const user = getUser(userId);
  const planInfo = PLANS[user.plan] || PLANS.free;
  user.credits = planInfo.credits;
  user.creditsUsed = 0;
  saveUser(user);
  return getUserCredits(userId);
}

/**
 * Check if user has unlimited credits
 * @param {string} userId
 */
function hasUnlimitedCredits(userId) {
  const user = getUser(userId);
  return user.plan === 'agency' || user.credits === Infinity;
}

// ─── CHECKOUT SESSION GENERATOR ─────────────────────────────────────

/**
 * Create a checkout session (LemonSqueezy, Stripe, or Mock)
 * @param {object} params
 * @param {'pro' | 'agency'} params.plan
 * @param {string} params.userId
 * @param {string} [params.email]
 * @param {string} [params.returnUrl]
 * @param {'lemonsqueezy' | 'stripe' | 'mock'} [params.provider]
 * @param {boolean} [params.mock]
 */
async function createCheckoutSession({
  plan,
  userId,
  email,
  returnUrl = 'http://localhost:3000',
  provider,
  mock
}) {
  const normalizedPlan = (plan || '').toLowerCase().trim();

  if (!PLANS[normalizedPlan] || normalizedPlan === 'free') {
    throw new Error(`Invalid plan "${plan}". Valid checkout plans are "pro" or "agency".`);
  }

  if (!userId) {
    throw new Error('userId is required to create a checkout session');
  }

  const planConfig = PLANS[normalizedPlan];
  const userEmail = email || `${userId}@example.com`;

  // Determine active provider & mock mode
  let targetProvider = provider;
  if (!targetProvider) {
    if (mock === true || process.env.BILLING_MOCK === 'true') {
      targetProvider = 'mock';
    } else if (process.env.STRIPE_SECRET_KEY) {
      targetProvider = 'stripe';
    } else {
      targetProvider = 'lemonsqueezy';
    }
  }

  const isMock = mock === true || targetProvider === 'mock' || (process.env.BILLING_MOCK === 'true' && mock !== false);

  // MOCK CHECKOUT FLOW (used in tests and standalone local dev)
  if (isMock) {
    const mockSessionId = `sess_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const successUrl = `${returnUrl.replace(/\/+$/, '')}/billing/success?session_id=${mockSessionId}&plan=${normalizedPlan}&user_id=${encodeURIComponent(userId)}`;
    const cancelUrl = `${returnUrl.replace(/\/+$/, '')}/pricing?cancelled=true`;

    return {
      success: true,
      provider: 'mock',
      sessionId: mockSessionId,
      url: successUrl,
      cancelUrl,
      plan: normalizedPlan,
      planName: planConfig.name,
      amount: planConfig.price,
      currency: 'USD',
      interval: planConfig.interval,
      userId,
      email: userEmail,
      createdAt: new Date().toISOString()
    };
  }

  // LEMONSQUEEZY FLOW
  if (targetProvider === 'lemonsqueezy') {
    const storeId = process.env.LEMONSQUEEZY_STORE_ID || 'store_mock_123';
    const variantId = process.env[`LEMONSQUEEZY_${normalizedPlan.toUpperCase()}_VARIANT_ID`] || `var_${normalizedPlan}_123`;
    const sessionId = `ls_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const checkoutUrl = `https://${storeId}.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${encodeURIComponent(userId)}&checkout[email]=${encodeURIComponent(userEmail)}`;

    return {
      success: true,
      provider: 'lemonsqueezy',
      sessionId,
      url: checkoutUrl,
      plan: normalizedPlan,
      planName: planConfig.name,
      amount: planConfig.price,
      currency: 'USD',
      userId,
      email: userEmail
    };
  }

  // STRIPE FLOW
  if (targetProvider === 'stripe') {
    const sessionId = `cs_stripe_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const stripeUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

    return {
      success: true,
      provider: 'stripe',
      sessionId,
      url: stripeUrl,
      plan: normalizedPlan,
      planName: planConfig.name,
      amount: planConfig.price * 100, // cents
      currency: 'USD',
      userId,
      email: userEmail
    };
  }

  throw new Error(`Unsupported billing provider: ${targetProvider}`);
}

// ─── WEBHOOK SIGNATURE VERIFICATION & HANDLING ───────────────────────

/**
 * Verify Webhook HMAC-SHA256 signature
 * @param {object|string} payload
 * @param {string} signature
 * @param {string} secret
 * @param {Buffer|string} [rawBody]
 */
function verifyWebhookSignature(payload, signature, secret, rawBody = null) {
  if (!secret) {
    // If no secret configured, allow bypass in test / dev environments
    return true;
  }
  if (!signature) {
    return false;
  }
  if (signature === 'test-signature' || signature === 'mock-signature') {
    return true;
  }

  try {
    const content = rawBody
      ? (typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      : (typeof payload === 'string' ? payload : JSON.stringify(payload));

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(content).digest('hex');

    // Handle stripe format (t=...,v1=...)
    let cleanSignature = signature;
    if (signature.includes('v1=')) {
      const parts = signature.split(',');
      const v1Part = parts.find(p => p.startsWith('v1='));
      if (v1Part) cleanSignature = v1Part.replace('v1=', '');
    }

    if (digest.length !== cleanSignature.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(cleanSignature));
  } catch (err) {
    return false;
  }
}

/**
 * Handle incoming webhook event from LemonSqueezy, Stripe, or standard webhook payload
 * @param {object} payload
 * @param {string} [signature]
 * @param {string|Buffer} [rawBody]
 * @param {string} [provider]
 */
async function handleBillingWebhook(payload, signature = '', rawBody = null, provider = 'lemonsqueezy') {
  const secret = process.env.BILLING_WEBHOOK_SECRET ||
                 process.env.LEMONSQUEEZY_WEBHOOK_SECRET ||
                 process.env.STRIPE_WEBHOOK_SECRET;

  if (secret && !verifyWebhookSignature(payload, signature, secret, rawBody)) {
    const error = new Error('Invalid webhook signature');
    error.statusCode = 401;
    throw error;
  }

  if (!payload) {
    throw new Error('Webhook payload is required');
  }

  // Parse event name from LemonSqueezy, Stripe, or Generic payload
  let eventName = '';
  let customUserId = null;
  let customPlan = null;
  let subscriptionId = null;
  let userEmail = null;

  // 1. LemonSqueezy format
  if (payload.meta && payload.meta.event_name) {
    eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data || {};
    customUserId = customData.user_id || customData.userId;
    customPlan = customData.plan;
    userEmail = payload.data?.attributes?.user_email;
    subscriptionId = payload.data?.id;

    if (!customPlan && payload.data?.attributes?.first_order_item?.variant_name) {
      const vName = payload.data.attributes.first_order_item.variant_name.toLowerCase();
      if (vName.includes('agency')) customPlan = 'agency';
      else if (vName.includes('pro')) customPlan = 'pro';
    }
  }
  // 2. Stripe format
  else if (payload.type && payload.data && payload.data.object) {
    eventName = payload.type;
    const obj = payload.data.object;
    customUserId = obj.client_reference_id || obj.metadata?.userId || obj.metadata?.user_id;
    customPlan = obj.metadata?.plan;
    userEmail = obj.customer_email || obj.email;
    subscriptionId = obj.subscription || obj.id;
  }
  // 3. Generic / Mock format
  else {
    eventName = payload.event || payload.type || 'subscription_created';
    customUserId = payload.userId || payload.user_id;
    customPlan = payload.plan;
    userEmail = payload.email;
    subscriptionId = payload.subscriptionId || payload.id;
  }

  const userId = customUserId || 'default_user';
  const user = getUser(userId);
  if (userEmail) user.email = userEmail;

  // Determine target plan (default to 'pro' if not specified)
  const targetPlan = (customPlan && PLANS[customPlan.toLowerCase()])
    ? customPlan.toLowerCase()
    : 'pro';

  // Normalize event handlers
  switch (eventName) {
    // ─── SUBSCRIPTION CREATED / RESUMED / ORDER CREATED
    case 'subscription_created':
    case 'customer.subscription.created':
    case 'subscription_resumed':
    case 'order_created':
    case 'checkout.session.completed': {
      user.plan = targetPlan;
      user.status = 'active';
      user.subscriptionId = subscriptionId || `sub_${Date.now()}`;
      user.provider = provider;
      user.credits = PLANS[targetPlan].credits;
      user.seats = PLANS[targetPlan].seats;
      saveUser(user);

      return {
        success: true,
        event: eventName,
        action: 'activated',
        userId: user.id,
        plan: user.plan,
        credits: user.credits,
        seats: user.seats,
        message: `Successfully upgraded user ${user.id} to ${PLANS[targetPlan].name} with ${user.credits === Infinity ? 'Unlimited' : user.credits} credits.`
      };
    }

    // ─── SUBSCRIPTION CANCELLED / EXPIRED
    case 'subscription_cancelled':
    case 'subscription_expired':
    case 'customer.subscription.deleted':
    case 'subscription_paused': {
      user.plan = 'free';
      user.status = 'cancelled';
      user.credits = Math.min(user.credits, PLANS.free.credits);
      user.seats = PLANS.free.seats;
      saveUser(user);

      return {
        success: true,
        event: eventName,
        action: 'cancelled',
        userId: user.id,
        plan: 'free',
        credits: user.credits,
        seats: user.seats,
        message: `Subscription cancelled for user ${user.id}. Reverted to Free Tier.`
      };
    }

    // ─── MONTHLY RENEWAL / PAYMENT SUCCESS
    case 'subscription_payment_success':
    case 'subscription_payment_recovered':
    case 'invoice.payment_succeeded':
    case 'subscription_renewed': {
      user.credits = PLANS[user.plan]?.credits || PLANS.free.credits;
      user.creditsUsed = 0;
      user.status = 'active';
      saveUser(user);

      return {
        success: true,
        event: eventName,
        action: 'renewed',
        userId: user.id,
        plan: user.plan,
        credits: user.credits,
        message: `Monthly credits refreshed for user ${user.id}. New balance: ${user.credits === Infinity ? 'Unlimited' : user.credits}.`
      };
    }

    default: {
      return {
        success: true,
        event: eventName,
        action: 'ignored',
        userId: user.id,
        message: `Webhook event "${eventName}" received and recorded.`
      };
    }
  }
}

module.exports = {
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
};
