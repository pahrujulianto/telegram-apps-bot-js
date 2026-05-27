/**
 * @module config/env
 * @description Environment variable loader and validator.
 * Loads variables from .env file and validates required configuration.
 * Exports a frozen config object for immutable access throughout the app.
 */

import 'dotenv/config';

/**
 * Validates that all required environment variables are present.
 * Fails fast at startup if any required variable is missing.
 * @param {string[]} required - Array of required env var names
 * @throws {Error} If any required variable is missing
 */
function validateRequired(required) {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n` +
      missing.map((key) => `   - ${key}`).join('\n') +
      `\n\nPlease check your .env file. See .env.example for reference.`
    );
  }
}

// Validate required variables at startup
validateRequired(['BOT_TOKEN']);

/**
 * Application configuration object.
 * All values are read from environment variables with sensible defaults.
 * This object is frozen to prevent accidental mutation.
 * @type {Readonly<Object>}
 */
export const config = Object.freeze({
  // Bot
  botToken: process.env.BOT_TOKEN,
  botMode: process.env.BOT_MODE || 'polling',

  // Webhook
  webhookDomain: process.env.WEBHOOK_DOMAIN || '',
  webhookPort: parseInt(process.env.WEBHOOK_PORT || '3000', 10),
  webhookSecretPath: process.env.WEBHOOK_SECRET_PATH || process.env.BOT_TOKEN,

  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '1000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '3', 10),

  // Idempotency
  idempotencyTtl: parseInt(process.env.IDEMPOTENCY_TTL || '60000', 10),

  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  defaultLocale: process.env.DEFAULT_LOCALE || 'en',
  botOwnerId: process.env.BOT_OWNER_ID
    ? parseInt(process.env.BOT_OWNER_ID, 10)
    : null,

  // Computed
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
});
