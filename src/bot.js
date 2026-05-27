/**
 * @module bot
 * @description Bot orchestrator — the heart of the application.
 * Creates the Bot instance, registers all plugins and middleware in the
 * correct order, attaches handlers, and sets up the global error boundary.
 *
 * Middleware execution order:
 * 1. Request Logger     — logs every update with timing
 * 2. Idempotency        — deduplicates by update_id
 * 3. Rate Limiter       — throttles excessive requests
 * 4. Session            — loads/saves session state
 * 5. I18n               — internationalization (ctx.t)
 * 6. Context Extender   — attaches helpers (ctx.userId, etc.)
 * 7. Session Lock       — serializes per-user processing
 * 8. Handlers           — command/callback/message handlers
 */

import { Bot, GrammyError, HttpError } from 'grammy';
import { config } from './config/env.js';
import { createLogger } from './utils/logger.js';

// Middleware imports
import { requestLogger } from './middlewares/logger.js';
import { idempotency } from './middlewares/idempotency.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { createSessionMiddleware } from './middlewares/session.js';
import { createI18n } from './middlewares/i18n.js';
import { contextExtender } from './middlewares/contextExtender.js';
import { sessionLock } from './middlewares/sessionLock.js';

// Handler imports
import handlers from './handlers/index.js';

const log = createLogger('bot');

// ── Create Bot Instance ───────────────────────────────────────
log.info('Initializing bot...');

export const bot = new Bot(config.botToken);

// ── Create I18n instance (needed by handlers for locale list) ──
export const i18n = createI18n();

// ── Register Middleware (ORDER MATTERS!) ──────────────────────

// 1. Request Logger — must be first to capture full processing time
bot.use(requestLogger());

// 2. Idempotency — drop duplicate updates early
bot.use(idempotency({
  ttl: config.idempotencyTtl,
}));

// 3. Rate Limiter — throttle abusive users
bot.use(rateLimiter({
  window: config.rateLimitWindow,
  limit: config.rateLimitMax,
}));

// 4. Session — load/save user session state
bot.use(createSessionMiddleware());

// 5. I18n — internationalization (AFTER session, needs ctx.session)
bot.use(i18n);

// 6. Context Extender — attach helpers AFTER session & i18n
bot.use(contextExtender());

// 7. Session Lock — serialize per-user AFTER context is ready
bot.use(sessionLock());

// ── Register Handlers ─────────────────────────────────────────

// 8. All command/callback/message handlers
bot.use(handlers);

// ── Global Error Boundary ─────────────────────────────────────
/**
 * Catches all unhandled errors from middleware and handlers.
 * Provides structured logging with error classification.
 * Ensures the bot NEVER crashes from unhandled rejections.
 *
 * Error types:
 * - GrammyError: Telegram Bot API returned an error
 * - HttpError:   Network error contacting Telegram servers
 * - Other:       Application-level errors
 */
bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;

  const errorContext = {
    updateId: ctx.update.update_id,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    requestId: ctx.requestId,
  };

  if (e instanceof GrammyError) {
    // Telegram API error (e.g., message too long, chat not found)
    log.error('Telegram API error', {
      ...errorContext,
      errorCode: e.error_code,
      description: e.description,
      method: e.method,
      parameters: e.parameters,
    });
  } else if (e instanceof HttpError) {
    // Network error (e.g., timeout, connection refused)
    log.error('Network error contacting Telegram', {
      ...errorContext,
      error: e.message,
    });
  } else {
    // Application error (bugs, unhandled cases)
    log.error('Unhandled application error', {
      ...errorContext,
      error: e?.message || String(e),
      stack: e?.stack,
    });
  }

  // Attempt to notify the user (best-effort, may fail)
  ctx.reply('⚠️ An unexpected error occurred. Please try again later.').catch(() => {
    // Silently ignore — can't even reply to the user
  });
});

log.info('Bot initialized successfully', {
  mode: config.botMode,
  env: config.nodeEnv,
});
