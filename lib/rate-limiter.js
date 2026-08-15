/**
 * SitePrompter Production - Sliding Window Rate Limiter
 * Provides per-IP and per-User rate limiting with dynamic plan-tier thresholds.
 */

const { getUser, PLANS } = require('./billing');

// Default limits per plan tier (requests per minute)
const DEFAULT_PLAN_LIMITS = {
  free: PLANS?.free?.rateLimit || 30,
  pro: PLANS?.pro?.rateLimit || 300,
  agency: PLANS?.agency?.rateLimit || 1000
};

class SlidingWindowRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
    this.defaultLimit = options.defaultLimit !== undefined ? options.defaultLimit : DEFAULT_PLAN_LIMITS.free;
    this.hasCustomDefaultLimit = options.defaultLimit !== undefined;
    this.planLimits = options.planLimits || (this.hasCustomDefaultLimit ? null : { ...DEFAULT_PLAN_LIMITS });
    this.requests = new Map(); // key -> Array of timestamps

    // Periodic cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.cleanupIntervalMs || 2 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Remove expired timestamps across all keys
   */
  cleanup() {
    const now = Date.now();
    const expiry = now - this.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => t > expiry);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }

  /**
   * Reset all rate limit records (useful for test suites)
   */
  reset() {
    this.requests.clear();
  }

  /**
   * Stop background cleanup timer
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Check and record a request for a given key and max limit
   * @param {string} key - Identifier (e.g. IP address or User ID)
   * @param {number} [limit] - Maximum allowed requests in window
   * @param {number} [windowMs] - Window duration in ms
   * @returns {{ allowed: boolean, limit: number, remaining: number, resetTime: number, resetInSeconds: number, current: number }}
   */
  check(key, limit = this.defaultLimit, windowMs = this.windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.requests.get(key) || [];
    // Filter timestamps within the current sliding window
    timestamps = timestamps.filter(t => t > windowStart);

    const currentCount = timestamps.length;
    const allowed = currentCount < limit;

    let resetTime = now + windowMs;
    if (timestamps.length > 0) {
      // Oldest timestamp in window + windowMs is when first slot frees up
      resetTime = timestamps[0] + windowMs;
    }
    const resetInSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    if (allowed) {
      timestamps.push(now);
      this.requests.set(key, timestamps);
      const remaining = Math.max(0, limit - timestamps.length);

      return {
        allowed: true,
        limit,
        remaining,
        resetTime,
        resetInSeconds,
        current: timestamps.length
      };
    } else {
      this.requests.set(key, timestamps);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        resetInSeconds,
        current: currentCount
      };
    }
  }

  /**
   * Get stats for a specific key
   */
  getStats(key, limit = this.defaultLimit, windowMs = this.windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (this.requests.get(key) || []).filter(t => t > windowStart);
    const remaining = Math.max(0, limit - timestamps.length);
    const resetTime = timestamps.length > 0 ? (timestamps[0] + windowMs) : (now + windowMs);
    const resetInSeconds = Math.max(0, Math.ceil((resetTime - now) / 1000));

    return {
      current: timestamps.length,
      limit,
      remaining,
      resetTime,
      resetInSeconds
    };
  }

  /**
   * Express middleware factory
   */
  middleware(options = {}) {
    const keyGenerator = options.keyGenerator || ((req) => {
      // Prioritize authenticated user ID or custom header, fallback to IP address
      return req.headers['x-user-id'] ||
             req.user?.id ||
             req.ip ||
             req.connection?.remoteAddress ||
             'unknown-client';
    });

    const getLimit = options.getLimit || ((req) => {
      if (options.limit !== undefined) {
        return options.limit;
      }
      
      const limitsMap = options.planLimits || this.planLimits;
      if (limitsMap) {
        const userId = req.headers['x-user-id'] || req.user?.id;
        if (userId) {
          const user = getUser(userId);
          const plan = user?.plan || 'free';
          if (limitsMap[plan] !== undefined) {
            return limitsMap[plan];
          }
        }
      }

      return options.defaultLimit !== undefined ? options.defaultLimit : this.defaultLimit;
    });

    return (req, res, next) => {
      const key = keyGenerator(req);
      const limit = getLimit(req);
      const windowMs = options.windowMs || this.windowMs;

      const result = this.check(key, limit, windowMs);

      // Set standard RateLimit headers
      res.setHeader('X-RateLimit-Limit', String(result.limit));
      res.setHeader('X-RateLimit-Remaining', String(result.remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

      if (!result.allowed) {
        res.setHeader('Retry-After', String(result.resetInSeconds));

        if (options.onLimitReached) {
          return options.onLimitReached(req, res, result);
        }

        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit of ${result.limit} requests per minute exceeded. Please slow down or upgrade to Pro/Agency for higher limits.`,
          limit: result.limit,
          remaining: 0,
          resetInSeconds: result.resetInSeconds,
          retryAfter: result.resetInSeconds
        });
      }

      next();
    };
  }
}

// Global default instance with plan limits
const defaultLimiter = new SlidingWindowRateLimiter({
  planLimits: { ...DEFAULT_PLAN_LIMITS }
});

/**
 * Convenience helper to create a new limiter instance
 */
function createRateLimiter(options) {
  return new SlidingWindowRateLimiter(options);
}

/**
 * Default middleware export
 */
const rateLimiterMiddleware = (req, res, next) => {
  return defaultLimiter.middleware()(req, res, next);
};

module.exports = {
  SlidingWindowRateLimiter,
  createRateLimiter,
  defaultLimiter,
  rateLimiterMiddleware,
  DEFAULT_PLAN_LIMITS
};
