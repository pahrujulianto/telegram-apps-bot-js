/**
 * @module middlewares/contextExtender
 * @description Context extender middleware.
 * Attaches custom properties and helper methods to the grammY context,
 * providing convenient shortcuts and i18n support for all handlers.
 */

import { createLogger } from '../utils/logger.js';
import { config } from '../config/env.js';
import { formatUserName } from '../utils/helpers.js';
import { SUPPORTED_LOCALES } from '../config/constants.js';

// Import all locale files
import en from '../locales/en.js';
import id from '../locales/id.js';

const log = createLogger('middleware:context');

/** @type {Object<string, Object>} Map of locale code -> locale strings */
const locales = { en, id };

/**
 * Creates a context extender middleware that adds custom properties
 * and helper methods to every context object.
 *
 * Added properties:
 * - ctx.userId {number} - Shortcut for ctx.from.id
 * - ctx.chatId {number} - Shortcut for ctx.chat.id
 * - ctx.isOwner {boolean} - Whether the user is the bot owner
 * - ctx.displayName {string} - Formatted user display name
 *
 * Added methods:
 * - ctx.t(key, params) - Get a localized string by key
 * - ctx.replyLocalized(key, params, extra) - Reply with a localized string
 *
 * @returns {Function} grammY middleware function
 */
export function contextExtender() {
  return async (ctx, next) => {
    // === Shortcut properties ===
    ctx.userId = ctx.from?.id;
    // Note: ctx.chatId is already a getter provided by grammY, we don't need to overwrite it.
    ctx.isOwner = config.botOwnerId ? ctx.from?.id === config.botOwnerId : false;
    ctx.displayName = formatUserName(ctx.from);

    // === i18n helpers ===

    /**
     * Gets a localized string by key with optional parameter substitution.
     * Falls back to English if the key is not found in the user's locale.
     * @param {string} key - Locale string key
     * @param {Object} [params={}] - Parameters to substitute (e.g., {name: 'John'})
     * @returns {string} Localized string
     */
    ctx.t = (key, params = {}) => {
      // Use session locale if available, fallback to config default
      const locale = ctx.session?.locale || config.defaultLocale || 'en';
      const strings = locales[locale] || locales.en;
      let text = strings[key] || locales.en[key] || key;

      // Substitute parameters: {name} -> value
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
      }

      return text;
    };

    /**
     * Sends a localized reply to the user.
     * @param {string} key - Locale string key
     * @param {Object} [params={}] - Parameters to substitute
     * @param {Object} [extra={}] - Additional Telegram message options
     * @returns {Promise} Reply promise
     */
    ctx.replyLocalized = (key, params = {}, extra = {}) => {
      return ctx.reply(ctx.t(key, params), {
        parse_mode: 'MarkdownV2',
        ...extra,
      });
    };

    await next();
  };
}
