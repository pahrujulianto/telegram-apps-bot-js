# Telegram Apps Bot (Production-Ready Template)

A production-ready Telegram Bot template built with **Node.js (ES Modules)** and the **grammY** framework. This template is designed for high-traffic environments, providing robust security, dual deployment modes, and a clean layered architecture.

## 🌟 Core Features

- **Clean Architecture**: Separation of concerns into Config, Middlewares, Handlers, Services, and Utils.
- **Dual Deployment Modes**:
  - **Polling Mode**: Uses `@grammyjs/runner` for concurrent update processing (perfect for development).
  - **Webhook Mode**: Integrates with an Express server, validating secret paths for production security.
- **Security & Reliability**:
  - **Idempotency**: Drops duplicate updates using an in-memory cache to prevent processing the same `update_id` twice.
  - **Session Locking (Mutex)**: Prevents race conditions from rapid concurrent user inputs (e.g., rapid button clicking).
  - **Rate Limiting**: Pure JavaScript sliding window throttler per user.
  - **Global Error Boundary**: Catch-all mechanism (`bot.catch`) ensures the bot never crashes from unhandled rejections, categorizing API and Network errors.
- **State Management**:
  - Native grammY session configuration configured out-of-the-box.
- **Extensibility**:
  - Handlers are modularized using `Composer` and unified in a central registry.
  - Context Extender attaches helpful shortcuts (`ctx.userId`, `ctx.t()` for localization) directly to the grammY context.
- **Localization (i18n)**: Out-of-the-box support for English (`en`) and Indonesian (`id`).
- **Structured Logging**: Pino-style JSON logger that outputs readable text in development and structured JSON in production.

---

## 📂 Project Structure

```
telegram-apps-bot-js/
├── .env.example              # Environment configuration template
├── package.json              # Project dependencies & scripts
├── src/
│   ├── app.js                # Application entry point (Polling/Webhook switcher)
│   ├── bot.js                # Bot orchestrator (middleware & handler setup)
│   ├── config/
│   │   ├── env.js            # Environment validation (fail-fast)
│   │   └── constants.js      # Global constants & default values
│   ├── handlers/             # Modular bot features (Composers)
│   │   ├── index.js          # Central registry
│   │   ├── start.js          # /start command & initial keyboard
│   │   ├── help.js           # /help command
│   │   └── settings.js       # /settings menu
│   ├── locales/              # i18n Translation files
│   │   ├── en.js             # English
│   │   └── id.js             # Indonesian
│   ├── middlewares/          # Custom processing layers
│   │   ├── idempotency.js    # Deduplicates updates
│   │   ├── sessionLock.js    # Per-user mutex lock
│   │   ├── rateLimiter.js    # Sliding window rate limiter
│   │   ├── session.js        # Session storage configuration
│   │   ├── logger.js         # Request tracing
│   │   └── contextExtender.js# Context shortcuts & i18n helpers
│   ├── services/             # Business Logic & External APIs
│   │   ├── userService.js    # User data management
│   │   └── apiService.js     # External HTTP client with retries
│   └── utils/
│       ├── logger.js         # Structured JSON logging
│       └── helpers.js        # Shared utility functions
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher.
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather).

### 2. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 3. Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Open the `.env` file and set your variables:

```env
# Required
BOT_TOKEN=your_bot_token_from_botfather

# Polling for Development, Webhook for Production
BOT_MODE=polling

# If using Webhook, provide your domain
WEBHOOK_DOMAIN=example.com
```

### 4. Running the Bot

**Development Mode** (Auto-restarts on file changes):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

---

## 🧠 Middleware Pipeline

The bot processes every incoming update through a strict middleware chain in `src/bot.js`:

1. **Request Logger**: Assigns a `requestId` and logs the incoming update.
2. **Idempotency**: Drops updates with an already processed `update_id`.
3. **Rate Limiter**: Rejects requests if a user exceeds the allowed limit.
4. **Session**: Initializes or loads the user's session data.
5. **Context Extender**: Injects custom helpers (e.g., `ctx.t()` for translations).
6. **Session Lock**: Ensures updates from the same user are processed sequentially.
7. **Handlers**: Executes your business logic (`/start`, `/settings`, etc).

---

## 🛠️ Adding New Features

To add a new command or feature:

1. **Create a new file** in `src/handlers/` (e.g., `myCommand.js`):
   ```javascript
   import { Composer } from 'grammy';
   const myFeature = new Composer();

   myFeature.command('hello', (ctx) => {
     ctx.reply('Hello World!');
   });

   export default myFeature;
   ```

2. **Register it** in `src/handlers/index.js`:
   ```javascript
   import myFeature from './myFeature.js';
   rootComposer.use(myFeature);
   ```

---

## ⚠️ Important Production Considerations

This template uses **In-Memory** storage for simplicity. Before deploying to a production cluster (multiple instances), you must replace the following with a distributed store like **Redis**:

1. **Idempotency Cache**: `src/middlewares/idempotency.js`
2. **Rate Limiting Store**: `src/middlewares/rateLimiter.js`
3. **Session Storage**: `src/middlewares/session.js` (Use `@grammyjs/storage-redis`)
4. **User Database**: `src/services/userService.js` (Replace Map with MongoDB/PostgreSQL)




