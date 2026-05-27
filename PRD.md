Act as a Senior Backend Engineer and Telegram Bot Expert. I want to build a "Production-Ready Base Template" for a high-traffic Telegram Bot using Pure JavaScript (Node.js with Modern ES Modules / ESM) and the grammY framework. 

This bot will handle thousands of active users daily, so the architecture must be highly scalable, modular, maintainable, and strictly secure against common production issues like race conditions and duplicate updates (idempotency).

Please generate a complete architectural guide and the actual code files for this base template based on the following specifications:

1. CORE ARCHITECTURE & FILE STRUCTURE
- Implement a Layered/Clean Architecture using pure JavaScript.
- Provide a clean ASCII directory tree showing the project structure.
- Separate concerns into distinct folders:
  /src
    /config (environment variables, constants)
    /locales (i18n/localization support)
    /middlewares (rate limiting, error handling, session, security locks)
    /handlers (commands, callbacks, hears, wizards/conversations)
    /services (business logic, DB integration, external APIs)
    /utils (helpers, loggers)
    bot.js (bot initialization and plugin/middleware registration)
    app.js (entry point that handles the deployment mode)

2. DUAL DEPLOYMENT MODE (Long Polling & Webhook)
- The code must support an easy toggle via environment variables (e.g., process.env.BOT_MODE = 'polling' or 'webhook').
- For Long Polling: Use grammY's native runner (@grammyjs/runner) for concurrent update processing.
- For Webhook: Integrate with an Express or Fastify server setup tailored for production (handling server timeouts, and implementing secret token validation from Telegram to prevent spoofing).

3. SECURITY & RELIABILITY (Crucial for high-traffic)
- Idempotency Middleware: Check and deduplicate incoming updates based on `update_id` using an in-memory cache (like Map) for dev, or a Redis pointer approach for production.
- Race Condition Prevention (Session Locking): Implement a middleware mechanism to lock user states so concurrent rapid clicks (e.g., clicking a button 5 times in 1 second) don't trigger the same handler overlappingly.
- Rate Limiting: Set up throttling using @grammyjs/ratelimiter or a custom pure JS approach.
- Global Error Boundary: Implement `bot.catch` properly with structured logging (concept of Winston/Pino) so the bot never crashes on unhandled rejections.

4. STATE MANAGEMENT & EXTENSIBILITY
- Set up grammY's native session middleware in JavaScript.
- Show how to attach custom properties or helper methods to the bot's `ctx` (context) safely.
- Show how to modularize handlers using grammY's Composer so adding new features is as simple as creating a new .js file and registering it in bot.js.

Please write clean, well-commented, and production-grade JavaScript code for the most critical files using async/await and modern JS features:
1. `src/bot.js` (The orchestrator)
2. `src/app.js` (The switcher between Webhook/Polling)
3. `src/middlewares/idempotency.js` & `src/middlewares/sessionLock.js` (The safety layers)
4. An example handler (`src/handlers/start.js`) using the Composer.

Explain the rationale behind your implementation choices for handling high-concurrency Telegram traffic using pure JavaScript.