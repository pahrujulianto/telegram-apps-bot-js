/**
 * @module handlers/help
 * @description Handler for the /help command.
 * Lists all available bot commands with descriptions.
 * Uses the Composer pattern for modularity.
 */

import { Composer } from 'grammy';
import { createLogger } from '../utils/logger.js';

const log = createLogger('handler:help');

/** Composer instance for help-related handlers */
const helpComposer = new Composer();

/**
 * /help command — displays a formatted list of all available commands.
 * Uses localized strings via ctx.t() provided by @grammyjs/i18n.
 */
helpComposer.command('help', async (ctx) => {
  log.info('Help command invoked', { userId: ctx.userId });

  try {
    const helpText = ctx.t('help');
    await ctx.reply(helpText, { parse_mode: 'MarkdownV2' });
  } catch (error) {
    log.error('Error in /help handler', {
      userId: ctx.userId,
      error: error.message,
    });
    await ctx.reply(ctx.t('error-general'));
  }
});

export default helpComposer;
