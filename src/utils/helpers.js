/**
 * @module utils/helpers
 * @description Generic utility functions for the bot.
 * Provides commonly needed helpers for string manipulation,
 * async control flow, and user formatting.
 */

/**
 * Delays execution for the specified duration.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Escapes HTML special characters to prevent injection.
 * Useful when sending HTML-formatted messages via Telegram.
 * @param {string} text - Raw text to escape
 * @returns {string} HTML-safe text
 */
export function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Truncates a string to the specified max length,
 * appending an ellipsis if truncated.
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=100] - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Formats a Telegram user's display name.
 * Prefers first_name + last_name, falls back to username.
 * @param {Object} user - Telegram user object (from ctx.from)
 * @returns {string} Formatted user name
 */
export function formatUserName(user) {
  if (!user) return 'Unknown';
  const parts = [user.first_name];
  if (user.last_name) parts.push(user.last_name);
  return parts.join(' ') || user.username || `User#${user.id}`;
}

/**
 * Creates a simple retry wrapper for async functions.
 * @param {Function} fn - Async function to retry
 * @param {number} [retries=3] - Number of retry attempts
 * @param {number} [delay=1000] - Delay between retries in ms
 * @returns {Promise<*>} Result of the function
 */
export async function retry(fn, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      await sleep(delay * attempt); // Exponential-ish backoff
    }
  }
}

/**
 * Generates a unique request ID for tracing.
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
