/**
 * @module middlewares/rateLimiter
 * @description Pure JavaScript sliding window rate limiter middleware.
 * Throttles excessive requests per user without external dependencies.
 * Configurable window size, max requests, and custom response.
 */

import { createLogger } from '../utils/logger.js';
import { config } from '../config/env.js';

const log = createLogger('middleware:rateLimiter');

/**
 * Creates a rate limiting middleware using a sliding window algorithm.
 * Tracks request timestamps per user and rejects requests exceeding the limit.
 *
 * @param {Object} [options] - Configuration options
 * @param {number} [options.window] - Time window in ms (default: from config)
 * @param {number} [options.limit] - Max requests per window (default: from config)
 * @param {Function} [options.onLimitExceeded] - Custom handler for throttled requests
 * @param {Function} [options.keyGenerator] - Custom key resolver (default: ctx.from.id)
 * @returns {Function} grammY middleware function
 */
export function rateLimiter(options = {}) {
  const window = options.window || config.rateLimitWindow || 1_000;
  const limit = options.limit || config.rateLimitMax || 3;
  const keyGenerator = options.keyGenerator || ((ctx) => ctx.from?.id?.toString());
  const onLimitExceeded = options.onLimitExceeded || null;

  /** @type {Map<string, number[]>} Map of userId -> array of request timestamps */
  const requests = new Map();

  // Periodic cleanup of stale entries
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests) {
      const valid = timestamps.filter((t) => now - t < window);
      if (valid.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, valid);
      }
    }
  }, window * 5);
  cleanupTimer.unref();

  log.info('Rate limiter middleware initialized', { window, limit });

  return async (ctx, next) => {
    const key = keyGenerator(ctx);
    if (!key) return next();

    const now = Date.now();
    const userRequests = requests.get(key) || [];

    // Filter to only requests within the current window
    const validRequests = userRequests.filter((t) => now - t < window);

    if (validRequests.length >= limit) {
      log.warn('Rate limit exceeded', {
        userId: key,
        requests: validRequests.length,
        limit,
        window,
      });

      if (onLimitExceeded) {
        return onLimitExceeded(ctx);
      }

      // Default: silently drop the update (don't call next())
      // The contextExtender middleware will provide ctx.t() for localized messages
      try {
        await ctx.reply('⏳ Too many requests. Please slow down.');
      } catch {
        // Ignore reply errors (e.g., if the user blocked the bot)
      }
      return;
    }

    // Record this request
    validRequests.push(now);
    requests.set(key, validRequests);

    await next();
  };
}
