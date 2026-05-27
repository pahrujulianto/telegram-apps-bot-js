/**
 * @module handlers/start
 * @description Handler for the /start command.
 * Demonstrates the Composer pattern, session usage, inline keyboard,
 * and context helper methods (ctx.t, ctx.displayName).
 */

import { Composer, InlineKeyboard } from 'grammy';
import { createLogger } from '../utils/logger.js';
import { findOrCreateUser } from '../services/userService.js';

const log = createLogger('handler:start');

/** Composer instance for start-related handlers */
const startComposer = new Composer();

/**
 * /start command — welcomes the user, registers them in the user service,
 * increments their session message count, and shows an inline keyboard.
 */
startComposer.command('start', async (ctx) => {
  try {
    // Register or retrieve user in the service layer
    const user = await findOrCreateUser(ctx.from);

    // Update session data
    ctx.session.messageCount++;
    if (!ctx.session.createdAt) {
      ctx.session.createdAt = new Date().toISOString();
    }

    log.info('User started bot', {
      userId: ctx.userId,
      username: ctx.from?.username,
      isNewUser: user.createdAt === user.lastSeenAt,
    });

    // Build inline keyboard with quick actions
    const keyboard = new InlineKeyboard()
      .text('📚 Help', 'action:help')
      .text('⚙️ Settings', 'action:settings')
      .row()
      .text('📊 Status', 'action:status');

    // Send localized welcome message
    const welcomeText = ctx.t('welcome', { name: ctx.displayName });

    await ctx.reply(welcomeText, {
      reply_markup: keyboard,
    });
  } catch (error) {
    log.error('Error in /start handler', {
      userId: ctx.userId,
      error: error.message,
    });
    await ctx.reply(ctx.t('errorGeneral'));
  }
});

/**
 * Callback query handler for the "Help" button on the start message.
 * Triggers the same response as /help.
 */
startComposer.callbackQuery('action:help', async (ctx) => {
  await ctx.answerCallbackQuery();

  const helpText = ctx.t('help');
  await ctx.reply(helpText, { parse_mode: 'MarkdownV2' });
});

/**
 * Callback query handler for the "Status" button.
 * Shows the user's session statistics.
 */
startComposer.callbackQuery('action:status', async (ctx) => {
  await ctx.answerCallbackQuery();

  const statusText =
    `📊 *Your Status*\n\n` +
    `👤 User ID: \`${ctx.userId}\`\n` +
    `💬 Messages: ${ctx.session.messageCount}\n` +
    `🌐 Locale: ${ctx.session.locale}\n` +
    `📅 Session since: ${ctx.session.createdAt || 'N/A'}`;

  await ctx.reply(statusText, { parse_mode: 'Markdown' });
});

export default startComposer;
