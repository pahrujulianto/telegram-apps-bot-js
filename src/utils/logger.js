/**
 * @module utils/logger
 * @description Structured JSON logger with Pino-style output.
 * Supports log levels: debug, info, warn, error, fatal.
 * Outputs JSON in production, colorized human-readable format in development.
 */

const LOG_LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
});

const COLORS = Object.freeze({
  debug: '\x1b[36m',  // cyan
  info: '\x1b[32m',   // green
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  fatal: '\x1b[35m',  // magenta
  reset: '\x1b[0m',
});

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] || LOG_LEVELS.info;
const isDev = (process.env.NODE_ENV || 'development') === 'development';

/**
 * Creates a structured logger instance.
 * @param {string} [name='app'] - Logger name/module identifier
 * @returns {Object} Logger with debug, info, warn, error, fatal methods
 */
export function createLogger(name = 'app') {
  /**
   * Core log function
   * @param {string} level - Log level
   * @param {string} msg - Log message
   * @param {Object} [data] - Additional structured data
   */
  function log(level, msg, data = {}) {
    if (LOG_LEVELS[level] < currentLevel) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      name,
      msg,
      ...data,
    };

    if (isDev) {
      const color = COLORS[level] || COLORS.reset;
      const prefix = `${color}[${level.toUpperCase()}]${COLORS.reset}`;
      const nameTag = `\x1b[90m[${name}]${COLORS.reset}`;
      const dataStr = Object.keys(data).length
        ? ` ${JSON.stringify(data)}`
        : '';
      const output = `${entry.timestamp} ${prefix} ${nameTag} ${msg}${dataStr}`;

      if (level === 'error' || level === 'fatal') {
        console.error(output);
      } else if (level === 'warn') {
        console.warn(output);
      } else {
        console.log(output);
      }
    } else {
      // Production: structured JSON to stdout/stderr
      const output = JSON.stringify(entry);
      if (level === 'error' || level === 'fatal') {
        process.stderr.write(output + '\n');
      } else {
        process.stdout.write(output + '\n');
      }
    }
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
    fatal: (msg, data) => log('fatal', msg, data),

    /** Create a child logger with a sub-name */
    child: (childName) => createLogger(`${name}:${childName}`),
  };
}

/** Default application logger */
export const logger = createLogger('app');
