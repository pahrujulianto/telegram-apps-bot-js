/**
 * @module config/constants
 * @description Application-wide constants and metadata.
 * Centralizes magic numbers, bot metadata, and default values
 * to avoid scattering them across the codebase.
 */

/** Bot metadata */
export const BOT_META = Object.freeze({
  NAME: 'TelegramAppsBot',
  VERSION: '1.0.0',
  DESCRIPTION: 'Production-ready Telegram bot base template',
});

/** Supported locales */
export const SUPPORTED_LOCALES = Object.freeze(['en', 'id']);

/** Default session data factory */
export const DEFAULT_SESSION = Object.freeze({
  locale: 'en',
  messageCount: 0,
  preferences: {},
  createdAt: null,
});

/** Cache / TTL defaults (in milliseconds) */
export const CACHE = Object.freeze({
  IDEMPOTENCY_TTL: 60_000,        // 60 seconds
  SESSION_LOCK_TIMEOUT: 10_000,   // 10 seconds max lock hold
  CLEANUP_INTERVAL: 30_000,       // 30 seconds between cache cleanups
});

/** Rate limiting defaults */
export const RATE_LIMITS = Object.freeze({
  WINDOW_MS: 1_000,
  MAX_REQUESTS: 3,
});

/** HTTP status codes */
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
});
