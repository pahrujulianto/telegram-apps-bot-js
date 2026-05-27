/**
 * @module middlewares/sessionLock
 * @description Per-user session locking middleware to prevent race conditions.
 * Ensures that concurrent updates from the same user are processed sequentially,
 * preventing issues like double-spend or duplicate state mutations.
 *
 * How it works:
 * - Each user has a Promise chain acting as a mutex
 * - New updates from the same user are queued behind the current one
 * - Lock is always released after handler completes (even on error)
 */

import { createLogger } from '../utils/logger.js';

const log = createLogger('middleware:sessionLock');

/**
 * Creates a session lock middleware that serializes updates per user.
 * Prevents race conditions when a user rapidly sends multiple updates.
 *
 * @param {Object} [options] - Configuration options
 * @param {number} [options.timeout] - Maximum lock hold time in ms (default: 10000)
 * @param {Function} [options.getKey] - Key resolver function (default: ctx.from.id)
 * @returns {Function} grammY middleware function
 */
export function sessionLock(options = {}) {
  const timeout = options.timeout || 10_000;
  const getKey = options.getKey || ((ctx) => ctx.from?.id?.toString());

  /** @type {Map<string, Promise<void>>} Map of userId -> current processing promise */
  const locks = new Map();

  log.info('Session lock middleware initialized', { timeout });

  return async (ctx, next) => {
    const key = getKey(ctx);

    // If no key (e.g., channel posts without from), skip locking
    if (!key) {
      return next();
    }

    // Get the current lock for this user (or a resolved promise if none)
    const currentLock = locks.get(key) || Promise.resolve();

    // Create a new promise that will resolve when this update is done
    let releaseLock;
    const newLock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    // Set the new lock BEFORE waiting (so subsequent updates queue behind us)
    locks.set(key, newLock);

    try {
      // Wait for the previous update from this user to complete
      await currentLock;

      // Process this update with a timeout guard
      await Promise.race([
        next(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Session lock timeout for user ${key}`)),
            timeout
          )
        ),
      ]);
    } catch (error) {
      // Log but don't crash — let bot.catch handle the error
      if (error.message?.includes('Session lock timeout')) {
        log.error('Session lock timeout', { key, timeout });
      }
      throw error;
    } finally {
      // ALWAYS release the lock
      releaseLock();

      // Clean up if this is the last pending lock
      if (locks.get(key) === newLock) {
        locks.delete(key);
      }
    }
  };
}
