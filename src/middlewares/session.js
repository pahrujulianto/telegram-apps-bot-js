/**
 * @module middlewares/session
 * @description grammY session middleware configuration.
 * Sets up in-memory session storage with sensible defaults.
 * For production with multiple instances, swap to Redis or database adapter.
 */

import { session as grammySession } from 'grammy';
import { createLogger } from '../utils/logger.js';

const log = createLogger('middleware:session');

/**
 * Returns the initial session data for new users/chats.
 * This factory is called once per new session.
 * @returns {Object} Default session object
 */
function initialSessionData() {
  return {
    /** @type {string} User's preferred locale */
    locale: 'en',
    /** @type {number} Total messages processed for this user */
    messageCount: 0,
    /** @type {Object} User preferences (key-value pairs) */
    preferences: {},
    /** @type {string|null} Current conversation/wizard state */
    step: null,
    /** @type {Object} Temporary data for multi-step flows */
    tempData: {},
    /** @type {string} Session creation timestamp */
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates and exports the configured session middleware.
 * Uses per-chat session keys by default.
 *
 * Configuration:
 * - Storage: In-memory (default). For production, use:
 *   - @grammyjs/storage-free (free cloud storage)
 *   - @grammyjs/storage-redis (Redis adapter)
 *   - @grammyjs/storage-mongodb (MongoDB adapter)
 *
 * @returns {Function} Configured grammY session middleware
 */
export function createSessionMiddleware() {
  log.info('Session middleware initialized', { storage: 'memory' });

  return grammySession({
    initial: initialSessionData,

    // Session key: per-user-per-chat for granular state management
    getSessionKey: (ctx) => {
      const userId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      // Fallback gracefully if either is missing
      if (!userId || !chatId) return undefined;
      return `${userId}:${chatId}`;
    },

    // --- Production storage adapters (uncomment to use) ---
    // Redis example:
    // storage: new RedisAdapter({ instance: redisClient }),
    //
    // MongoDB example:
    // storage: new MongoDBAdapter({ collection: sessionsCollection }),
  });
}
