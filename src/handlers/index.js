/**
 * @module handlers/index
 * @description Central handler registry.
 * Imports all handler modules (Composers) and composes them into
 * a single root Composer for registration in bot.js.
 *
 * To add a new feature:
 * 1. Create a new file in /handlers (e.g., myFeature.js)
 * 2. Export a Composer as the default export
 * 3. Import and register it below
 */

import { Composer } from 'grammy';
import { createLogger } from '../utils/logger.js';

// Import all handler modules
import startHandler from './start.js';
import helpHandler from './help.js';
import settingsHandler from './settings.js';

const log = createLogger('handlers');

/** Root composer that aggregates all handler modules */
const rootComposer = new Composer();

// ── Register all handler modules ──────────────────────────────
// Order matters: more specific handlers should be registered first

rootComposer.use(startHandler);
rootComposer.use(helpHandler);
rootComposer.use(settingsHandler);

// ── Add new handler modules above this line ───────────────────

log.info('All handlers registered', {
  modules: ['start', 'help', 'settings'],
});

export default rootComposer;
