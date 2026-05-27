/**
 * @module middlewares/contextExtender
 * @description Context extender middleware.
 * Attaches custom shortcut properties and helper methods to the grammY context.
 *
 * Note: i18n (ctx.t) is now handled by @grammyjs/i18n plugin.
 * This middleware only provides non-i18n shortcuts.
 */

import { config } from '../config/env.js';
import { formatUserName } from '../utils/helpers.js';

/**
 * Creates a context extender middleware that adds custom properties
 * and helper methods to every context object.
 *
 * Added properties:
 * - ctx.userId {number} - Shortcut for ctx.from.id
 * - ctx.isOwner {boolean} - Whether the user is the bot owner
 * - ctx.displayName {string} - Formatted user display name
 *
 * @returns {Function} grammY middleware function
 */
export function contextExtender() {
  return async (ctx, next) => {
    // === Shortcut properties ===
    ctx.userId = ctx.from?.id;
    // Note: ctx.chatId is already a getter provided by grammY
    ctx.isOwner = config.botOwnerId ? ctx.from?.id === config.botOwnerId : false;
    ctx.displayName = formatUserName(ctx.from);

    await next();
  };
}
