/**
 * @module app
 * @description Application entry point — deployment mode switcher.
 * Reads BOT_MODE from environment config and starts the bot in either:
 *
 *   - POLLING mode: Uses @grammyjs/runner for concurrent update processing.
 *     Best for development and single-instance deployments.
 *
 *   - WEBHOOK mode: Spins up an Express server with webhookCallback.
 *     Best for production with load balancers and HTTPS termination.
 *
 * Features:
 *   - Graceful shutdown on SIGINT/SIGTERM
 *   - Health check endpoint (webhook mode)
 *   - Secret token validation for webhook security
 *   - Structured startup/shutdown logging
 */

import { config } from './config/env.js';
import { bot } from './bot.js';
import { createLogger } from './utils/logger.js';
import { BOT_META } from './config/constants.js';

const log = createLogger('app');

/**
 * Starts the bot in Long Polling mode using @grammyjs/runner.
 * The runner processes updates concurrently (unlike bot.start()),
 * which is critical for handling high traffic without blocking.
 */
async function startPolling() {
  // Dynamic import to avoid loading runner in webhook mode
  const { run } = await import('@grammyjs/runner');

  log.info('Starting bot in POLLING mode...');

  // Delete any existing webhook to prevent conflicts
  await bot.api.deleteWebhook();

  // Start the concurrent runner
  const runner = run(bot);

  log.info(`✅ ${BOT_META.NAME} v${BOT_META.VERSION} is running in POLLING mode`, {
    env: config.nodeEnv,
  });

  // ── Graceful Shutdown ────────────────────────────────────────
  const shutdown = async (signal) => {
    log.info(`${signal} received. Shutting down gracefully...`);

    if (runner.isRunning()) {
      await runner.stop();
      log.info('Bot runner stopped.');
    }

    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Starts the bot in Webhook mode with an Express HTTP server.
 * Telegram sends updates directly to our endpoint, which is more
 * efficient for production deployments behind load balancers.
 */
async function startWebhook() {
  // Dynamic imports to avoid loading Express in polling mode
  const { default: express } = await import('express');
  const { webhookCallback } = await import('grammy');

  const { webhookDomain, webhookPort, webhookSecretPath } = config;

  if (!webhookDomain) {
    throw new Error(
      '❌ WEBHOOK_DOMAIN is required for webhook mode. ' +
      'Set it in your .env file (e.g., WEBHOOK_DOMAIN=example.com)'
    );
  }

  log.info('Starting bot in WEBHOOK mode...');

  // ── Express Server Setup ────────────────────────────────────
  const app = express();

  // Parse JSON bodies (required for Telegram webhook payloads)
  app.use(express.json());

  // Health check endpoint for load balancers and monitoring
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      bot: BOT_META.NAME,
      version: BOT_META.VERSION,
      mode: 'webhook',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── Webhook Route ───────────────────────────────────────────
  // Uses the bot token (or custom secret) as the path to prevent
  // unauthorized fake updates from third parties.
  const secretPath = webhookSecretPath || bot.token;
  app.use(`/webhook/${secretPath}`, webhookCallback(bot, 'express'));

  // ── 404 Handler ─────────────────────────────────────────────
  // Catch-all for unknown routes (security: don't reveal internals)
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ── Start Server ────────────────────────────────────────────
  const server = app.listen(webhookPort, async () => {
    // Set the webhook URL with Telegram
    const webhookUrl = `https://${webhookDomain}/webhook/${secretPath}`;
    await bot.api.setWebhook(webhookUrl);

    log.info(`✅ ${BOT_META.NAME} v${BOT_META.VERSION} is running in WEBHOOK mode`, {
      url: `https://${webhookDomain}/webhook/***`,
      port: webhookPort,
      env: config.nodeEnv,
    });
  });

  // Set server timeouts for production reliability
  server.setTimeout(30_000);       // 30s request timeout
  server.keepAliveTimeout = 65_000; // > typical LB idle timeout (60s)

  // ── Graceful Shutdown ────────────────────────────────────────
  const shutdown = async (signal) => {
    log.info(`${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async () => {
      log.info('HTTP server closed.');

      // Remove webhook from Telegram
      try {
        await bot.api.deleteWebhook();
        log.info('Webhook removed from Telegram.');
      } catch (error) {
        log.warn('Failed to remove webhook', { error: error.message });
      }

      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful fails
    setTimeout(() => {
      log.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

// ── Main Entry Point ────────────────────────────────────────────
async function main() {
  log.info(`Starting ${BOT_META.NAME} v${BOT_META.VERSION}`, {
    mode: config.botMode,
    env: config.nodeEnv,
    nodeVersion: process.version,
  });

  try {
    switch (config.botMode) {
      case 'webhook':
        await startWebhook();
        break;

      case 'polling':
        await startPolling();
        break;

      default:
        throw new Error(
          `❌ Invalid BOT_MODE: "${config.botMode}". ` +
          `Must be "polling" or "webhook".`
        );
    }
  } catch (error) {
    log.fatal('Failed to start bot', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// ── Unhandled Rejection Safety Net ───────────────────────────────
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled promise rejection', {
    error: reason?.message || String(reason),
    stack: reason?.stack,
  });
});

process.on('uncaughtException', (error) => {
  log.fatal('Uncaught exception — shutting down', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the application
main();
