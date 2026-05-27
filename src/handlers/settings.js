/**
 * @module handlers/settings
 * @description Handler for the /settings command.
 * Demonstrates inline keyboard with callback queries,
 * session read/write patterns, and multi-step interaction.
 */

import { Composer, InlineKeyboard } from 'grammy';
import { createLogger } from '../utils/logger.js';
import { SUPPORTED_LOCALES } from '../config/constants.js';

const log = createLogger('handler:settings');

/** Composer instance for settings-related handlers */
const settingsComposer = new Composer();

/**
 * /settings command — displays settings menu with inline keyboard.
 */
settingsComposer.command('settings', async (ctx) => {
  log.info('Settings command invoked', { userId: ctx.userId });
  await showSettingsMenu(ctx);
});

/**
 * Callback: "Settings" button from the start message.
 */
settingsComposer.callbackQuery('action:settings', async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSettingsMenu(ctx);
});

/**
 * Callback: Language selection submenu.
 */
settingsComposer.callbackQuery('settings:language', async (ctx) => {
  await ctx.answerCallbackQuery();

  const keyboard = new InlineKeyboard();

  // Add a button for each supported locale
  for (const locale of SUPPORTED_LOCALES) {
    const label = locale === 'en' ? '🇺🇸 English' : '🇮🇩 Bahasa Indonesia';
    const currentMarker = ctx.session.locale === locale ? ' ✅' : '';
    keyboard.text(`${label}${currentMarker}`, `settings:lang:${locale}`).row();
  }

  keyboard.text(ctx.t('settingsBack'), 'settings:back');

  await ctx.editMessageText('🌐 *Select your language:*', {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
});

/**
 * Callback: Language change action.
 * Matches patterns like "settings:lang:en", "settings:lang:id".
 */
settingsComposer.callbackQuery(/^settings:lang:(.+)$/, async (ctx) => {
  const locale = ctx.match[1];

  if (!SUPPORTED_LOCALES.includes(locale)) {
    await ctx.answerCallbackQuery({ text: '❌ Invalid locale' });
    return;
  }

  // Update session locale
  ctx.session.locale = locale;

  log.info('User changed language', {
    userId: ctx.userId,
    locale,
  });

  await ctx.answerCallbackQuery({
    text: ctx.t('languageChanged'),
  });

  // Refresh the settings menu in the new locale
  await showSettingsMenu(ctx, true);
});

/**
 * Callback: Notifications toggle.
 */
settingsComposer.callbackQuery('settings:notifications', async (ctx) => {
  // Toggle notification preference
  const current = ctx.session.preferences.notifications !== false;
  ctx.session.preferences.notifications = !current;

  const status = !current ? '🔔 ON' : '🔕 OFF';

  log.info('User toggled notifications', {
    userId: ctx.userId,
    notifications: !current,
  });

  await ctx.answerCallbackQuery({
    text: `Notifications: ${status}`,
  });

  // Refresh settings menu
  await showSettingsMenu(ctx, true);
});

/**
 * Callback: Back to settings main menu.
 */
settingsComposer.callbackQuery('settings:back', async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSettingsMenu(ctx, true);
});

/**
 * Shows the settings menu with current preferences.
 * @param {Object} ctx - grammY context
 * @param {boolean} [edit=false] - Whether to edit existing message or send new
 */
async function showSettingsMenu(ctx, edit = false) {
  const notifStatus =
    ctx.session.preferences.notifications !== false ? '🔔 ON' : '🔕 OFF';
  const currentLang = ctx.session.locale === 'en' ? '🇺🇸 EN' : '🇮🇩 ID';

  const keyboard = new InlineKeyboard()
    .text(`${ctx.t('settingsLanguage')} [${currentLang}]`, 'settings:language')
    .row()
    .text(
      `${ctx.t('settingsNotifications')} [${notifStatus}]`,
      'settings:notifications'
    );

  const text = ctx.t('settingsTitle');

  try {
    if (edit) {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    // editMessageText throws if content hasn't changed — safe to ignore
    if (!error.message?.includes('message is not modified')) {
      throw error;
    }
  }
}

export default settingsComposer;
