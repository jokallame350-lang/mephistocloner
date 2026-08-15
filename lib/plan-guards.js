/**
 * SitePrompter Production - Plan Guards & Middleware Enforcers
 * Enforces Pro/Agency subscriptions, credit deduction, BYOK bypass, and feature gating.
 */

const { getUser, deductCredits, getUserCredits, PLANS } = require('./billing');

/**
 * Middleware to extract and attach user context to req.user and req.credits
 */
function attachUserContext(req, res, next) {
  const userId = req.headers['x-user-id'] ||
                 req.query?.userId ||
                 req.body?.userId ||
                 'default_user';

  const user = getUser(userId);
  req.user = user;
  req.credits = getUserCredits(user.id);
  next();
}

/**
 * Middleware enforcing Pro or Agency plan requirement
 * @param {object} [options]
 */
function requireProPlan(options = {}) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.query?.userId || req.body?.userId || req.user?.id || 'default_user';
    const user = getUser(userId);
    req.user = user;

    if (user.plan === 'pro' || user.plan === 'agency') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'PRO_PLAN_REQUIRED',
      message: options.message || 'This feature requires an active Pro or Agency subscription. Upgrade at /pricing to unlock.',
      currentPlan: user.plan,
      requiredPlan: 'pro'
    });
  };
}

/**
 * Middleware enforcing Agency plan requirement
 * @param {object} [options]
 */
function requireAgencyPlan(options = {}) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.query?.userId || req.body?.userId || req.user?.id || 'default_user';
    const user = getUser(userId);
    req.user = user;

    if (user.plan === 'agency') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'AGENCY_PLAN_REQUIRED',
      message: options.message || 'This feature requires an active Agency subscription.',
      currentPlan: user.plan,
      requiredPlan: 'agency'
    });
  };
}

/**
 * Middleware checking for Bring Your Own Key (BYOK)
 * Pro and Agency users can supply their own LLM API key for unlimited zero-credit operations.
 */
function checkBYOKAccess(req, res, next) {
  const userId = req.headers['x-user-id'] || req.query?.userId || req.body?.userId || req.user?.id || 'default_user';
  const user = getUser(userId);
  req.user = user;

  const byokKey = req.headers['x-byok-key'] ||
                  req.headers['x-openai-key'] ||
                  req.headers['x-anthropic-key'] ||
                  req.body?.byokKey;

  if (byokKey && typeof byokKey === 'string' && byokKey.trim().length > 5) {
    // Check if user's plan supports BYOK Unlimited
    if (user.plan === 'pro' || user.plan === 'agency' || PLANS[user.plan]?.byokUnlimited) {
      req.isBYOK = true;
      req.byokKey = byokKey.trim();
      res.setHeader('X-BYOK-Active', 'true');
    } else {
      // Free plan user attempting BYOK without Pro
      req.isBYOK = false;
      req.byokError = 'BYOK_REQUIRES_PRO';
    }
  } else {
    req.isBYOK = false;
  }

  next();
}

/**
 * Middleware requiring and deducting user credits
 * If BYOK is active, credits are bypassed (cost = 0).
 * @param {number} cost - Number of credits to deduct (default: 1)
 */
function requireCredits(cost = 1) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.query?.userId || req.body?.userId || req.user?.id || 'default_user';
    const user = getUser(userId);
    req.user = user;

    // If BYOK is active for Pro/Agency user, bypass credit deduction
    if (req.isBYOK) {
      req.remainingCredits = user.credits;
      req.creditsDeducted = 0;
      res.setHeader('X-User-Credits', user.credits === Infinity ? 'unlimited' : String(user.credits));
      res.setHeader('X-Credits-Deducted', '0');
      return next();
    }

    // Attempt to deduct credits
    const deduction = deductCredits(user.id, cost);

    if (deduction.success) {
      req.remainingCredits = deduction.remainingCredits;
      req.creditsDeducted = deduction.cost;
      res.setHeader('X-User-Credits', deduction.remainingCredits === Infinity ? 'unlimited' : String(deduction.remainingCredits));
      res.setHeader('X-Credits-Deducted', String(deduction.cost));
      return next();
    }

    return res.status(402).json({
      success: false,
      error: 'INSUFFICIENT_CREDITS',
      message: `Insufficient credits. Required: ${cost}, Available: ${deduction.remainingCredits}. Upgrade to Pro for 500 monthly credits or Agency for unlimited.`,
      required: cost,
      available: deduction.remainingCredits,
      currentPlan: user.plan
    });
  };
}

/**
 * Middleware requiring specific feature access by plan definition
 * @param {string} featureKey
 */
function requireFeature(featureKey) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.query?.userId || req.body?.userId || req.user?.id || 'default_user';
    const user = getUser(userId);
    req.user = user;

    const planConfig = PLANS[user.plan] || PLANS.free;
    const hasFeature = planConfig.features && planConfig.features.includes(featureKey);

    if (hasFeature) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FEATURE_NOT_PERMITTED',
      message: `The feature "${featureKey}" is not included in your current (${planConfig.name}) plan.`,
      requiredFeature: featureKey,
      currentPlan: user.plan
    });
  };
}

module.exports = {
  attachUserContext,
  requireProPlan,
  requireAgencyPlan,
  checkBYOKAccess,
  requireCredits,
  requireFeature
};
