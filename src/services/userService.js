/**
 * @module services/userService
 * @description User business logic service.
 * Provides a clean abstraction layer for user-related operations.
 * Replace the in-memory store with your database of choice in production.
 */

import { createLogger } from '../utils/logger.js';

const log = createLogger('service:user');

/** @type {Map<number, Object>} In-memory user store (replace with DB) */
const users = new Map();

/**
 * Finds an existing user or creates a new one.
 * @param {Object} telegramUser - Telegram user object (ctx.from)
 * @returns {Promise<Object>} User record
 */
export async function findOrCreateUser(telegramUser) {
  if (!telegramUser?.id) {
    throw new Error('Invalid Telegram user object');
  }

  const existing = users.get(telegramUser.id);
  if (existing) {
    log.debug('User found', { userId: telegramUser.id });
    // Update last seen
    existing.lastSeenAt = new Date().toISOString();
    return existing;
  }

  // Create new user record
  const newUser = {
    id: telegramUser.id,
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name || null,
    username: telegramUser.username || null,
    languageCode: telegramUser.language_code || 'en',
    preferences: {},
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  users.set(telegramUser.id, newUser);
  log.info('New user created', { userId: newUser.id, username: newUser.username });
  return newUser;
}

/**
 * Updates a user's preferences.
 * @param {number} userId - Telegram user ID
 * @param {Object} prefs - Preference key-value pairs to update
 * @returns {Promise<Object|null>} Updated user or null if not found
 */
export async function updateUserPrefs(userId, prefs) {
  const user = users.get(userId);
  if (!user) {
    log.warn('User not found for preference update', { userId });
    return null;
  }

  user.preferences = { ...user.preferences, ...prefs };
  log.info('User preferences updated', { userId, prefs });
  return user;
}

/**
 * Gets the total number of registered users.
 * @returns {Promise<number>} Total user count
 */
export async function getUserCount() {
  return users.size;
}
