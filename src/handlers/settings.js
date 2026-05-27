/**
 * @module handlers/settings
 * @description Handler for the /settings command.
 * Demonstrates inline keyboard with callback queries,
 * session read/write patterns, and multi-step interaction.
 * Uses @grammyjs/i18n for locale switching via ctx.i18n.setLocale().
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

  const currentLocale = await ctx.i18n.getLocale();
  const keyboard = new InlineKeyboard();

  // Add a button for each supported locale
  for (const locale of SUPPORTED_LOCALES) {
    const label = locale === 'en' ? '🇺🇸 English' : '🇮🇩 Bahasa Indonesia';
    const currentMarker = currentLocale === locale ? ' ✅' : '';
    keyboard.text(`${label}${currentMarker}`, `settings:lang:${locale}`).row();
  }

  keyboard.text(ctx.t('settings-back'), 'settings:back');

  await ctx.editMessageText('🌐 *Select your language:*', {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
});

/**
 * Callback: Language change action.
 * Matches patterns like "settings:lang:en", "settings:lang:id".
 * Uses ctx.i18n.setLocale() from @grammyjs/i18n to persist the choice.
 */
settingsComposer.callbackQuery(/^settings:lang:(.+)$/, async (ctx) => {
  const locale = ctx.match[1];

  if (!SUPPORTED_LOCALES.includes(locale)) {
    await ctx.answerCallbackQuery({ text: '❌ Invalid locale' });
    return;
  }

  // Use official i18n plugin to set and persist locale in session
  await ctx.i18n.setLocale(locale);

  log.info('User changed language', {
    userId: ctx.userId,
    locale,
  });

  await ctx.answerCallbackQuery({
    text: ctx.t('language-changed'),
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

  const currentLocale = await ctx.i18n.getLocale();
  const currentLang = currentLocale === 'en' ? '🇺🇸 EN' : '🇮🇩 ID';

  const keyboard = new InlineKeyboard()
    .text(`${ctx.t('settings-language')} [${currentLang}]`, 'settings:language')
    .row()
    .text(
      `${ctx.t('settings-notifications')} [${notifStatus}]`,
      'settings:notifications'
    );

  const text = ctx.t('settings-title');

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
