/**
 * @module middlewares/idempotency
 * @description Idempotency middleware to prevent duplicate update processing.
 * Uses an in-memory Map with TTL-based auto-cleanup to track processed update IDs.
 * For production with multiple instances, swap to Redis-based implementation.
 */

import { createLogger } from '../utils/logger.js';
import { config } from '../config/env.js';

const log = createLogger('middleware:idempotency');

/**
 * Creates an idempotency middleware that deduplicates updates.
 * Each update_id is cached for the configured TTL duration.
 * Duplicate updates are silently dropped.
 *
 * @param {Object} [options] - Configuration options
 * @param {number} [options.ttl] - Cache TTL in ms (default: from config)
 * @param {number} [options.cleanupInterval] - Cleanup interval in ms (default: 30000)
 * @returns {Function} grammY middleware function
 */
export function idempotency(options = {}) {
  const ttl = options.ttl || config.idempotencyTtl || 60_000;
  const cleanupInterval = options.cleanupInterval || 30_000;

  /** @type {Map<number, number>} Map of update_id -> timestamp */
  const processedUpdates = new Map();

  // Periodic cleanup of expired entries
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [updateId, timestamp] of processedUpdates) {
      if (now - timestamp > ttl) {
        processedUpdates.delete(updateId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      log.debug('Idempotency cache cleanup', { cleaned, remaining: processedUpdates.size });
    }
  }, cleanupInterval);

  // Don't keep the process alive just for cleanup
  cleanupTimer.unref();

  log.info('Idempotency middleware initialized', { ttl, cleanupInterval });

  return async (ctx, next) => {
    const updateId = ctx.update.update_id;

    // Check if this update was already processed
    if (processedUpdates.has(updateId)) {
      log.warn('Duplicate update detected, skipping', {
        updateId,
        userId: ctx.from?.id,
      });
      return; // Drop the duplicate — do NOT call next()
    }

    // Mark as processed
    processedUpdates.set(updateId, Date.now());

    // Continue to next middleware
    await next();
  };
}
