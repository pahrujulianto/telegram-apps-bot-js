/**
 * @module middlewares/i18n
 * @description Internationalization middleware using the official @grammyjs/i18n plugin.
 * Uses Mozilla's Fluent localization system for translations.
 * Loads .ftl files from the locales directory and provides ctx.t() for all handlers.
 *
 * Features:
 * - Automatic locale detection from Telegram user language
 * - Session-based locale persistence (stores in ctx.session.__language_code)
 * - Fluent syntax support (pluralization, variables, terms)
 * - ctx.t(key, params) and ctx.i18n.setLocale(locale) available in all handlers
 */

import { I18n } from '@grammyjs/i18n';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/env.js';
import path from 'path';

const log = createLogger('middleware:i18n');

/**
 * Creates and configures the @grammyjs/i18n instance.
 * Must be registered AFTER session middleware (needs ctx.session).
 *
 * @returns {I18n} Configured I18n instance (use as middleware via bot.use(i18n))
 */
export function createI18n() {
  // Fix Windows path separator issues in @grammyjs/i18n by providing an absolute path
  const localesPath = path.resolve(process.cwd(), 'src', 'locales');

  const i18n = new I18n({
    // Default locale when no user preference or Telegram language is detected
    defaultLocale: config.defaultLocale || 'en',

    // Persist the user's language choice in session (ctx.session.__language_code)
    useSession: true,

    // Load all .ftl files from the locales directory
    directory: localesPath,
  });

  log.info('I18n middleware initialized', {
    defaultLocale: config.defaultLocale || 'en',
    directory: localesPath,
  });

  return i18n;
}
