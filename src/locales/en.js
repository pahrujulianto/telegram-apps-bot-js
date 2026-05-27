/**
 * @module locales/en
 * @description English locale strings for the bot.
 */

export default Object.freeze({
  // General
  welcome: '👋 Welcome, {name}!\n\nI\'m your production-ready Telegram bot template. Use /help to see available commands.',
  help: '📚 *Available Commands*\n\n' +
    '/start \\- Start the bot and see welcome message\n' +
    '/help \\- Show this help message\n' +
    '/settings \\- Configure your preferences\n\n' +
    '_Built with grammY framework_ 🤖',
  unknownCommand: '❓ Unknown command. Use /help to see available commands.',

  // Settings
  settingsTitle: '⚙️ *Settings*\n\nChoose an option below to configure:',
  settingsLanguage: '🌐 Language',
  settingsNotifications: '🔔 Notifications',
  settingsBack: '◀️ Back',
  settingsUpdated: '✅ Settings updated successfully!',
  languageChanged: '🌐 Language changed to English.',

  // Rate Limiting
  rateLimited: '⏳ Too many requests. Please wait a moment and try again.',

  // Errors
  errorGeneral: '❌ Something went wrong. Please try again later.',
  errorMaintenance: '🔧 Bot is under maintenance. Please try again later.',
});
