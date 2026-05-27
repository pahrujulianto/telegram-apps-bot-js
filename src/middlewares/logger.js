/**
 * @module middlewares/logger
 * @description Request logging middleware for the bot.
 * Logs every incoming update with user ID, update type,
 * processing duration, and other useful metadata.
 */

import { createLogger } from '../utils/logger.js';
import { generateRequestId } from '../utils/helpers.js';

const log = createLogger('middleware:request');

/**
 * Creates a request logging middleware.
 * Attaches a request ID to each context and logs processing time.
 *
 * @returns {Function} grammY middleware function
 */
export function requestLogger() {
  return async (ctx, next) => {
    const startTime = performance.now();
    const requestId = generateRequestId();

    // Attach request ID to context for tracing
    ctx.requestId = requestId;

    // Determine update type for logging
    const updateType = getUpdateType(ctx.update);

    log.info('Incoming update', {
      requestId,
      updateId: ctx.update.update_id,
      updateType,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      text: ctx.message?.text
        ? ctx.message.text.slice(0, 50)
        : undefined,
    });

    try {
      await next();

      const duration = (performance.now() - startTime).toFixed(2);
      log.info('Update processed', {
        requestId,
        updateId: ctx.update.update_id,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2);
      log.error('Update processing failed', {
        requestId,
        updateId: ctx.update.update_id,
        duration: `${duration}ms`,
        error: error.message,
      });
      throw error; // Re-throw for bot.catch to handle
    }
  };
}

/**
 * Extracts the update type from a Telegram update object.
 * @param {Object} update - Telegram update object
 * @returns {string} Update type description
 */
function getUpdateType(update) {
  if (update.message) return 'message';
  if (update.edited_message) return 'edited_message';
  if (update.callback_query) return 'callback_query';
  if (update.inline_query) return 'inline_query';
  if (update.chosen_inline_result) return 'chosen_inline_result';
  if (update.channel_post) return 'channel_post';
  if (update.edited_channel_post) return 'edited_channel_post';
  if (update.shipping_query) return 'shipping_query';
  if (update.pre_checkout_query) return 'pre_checkout_query';
  if (update.poll) return 'poll';
  if (update.poll_answer) return 'poll_answer';
  if (update.my_chat_member) return 'my_chat_member';
  if (update.chat_member) return 'chat_member';
  if (update.chat_join_request) return 'chat_join_request';
  return 'unknown';
}
