/**
 * @module services/apiService
 * @description External API integration service.
 * Provides a reusable HTTP client with retry logic and error handling.
 * Uses native fetch (available in Node.js 18+).
 */

import { createLogger } from '../utils/logger.js';
import { retry } from '../utils/helpers.js';

const log = createLogger('service:api');

/**
 * Makes an HTTP request with automatic retry and structured error handling.
 * @param {string} url - The URL to fetch
 * @param {Object} [options={}] - Fetch options (method, headers, body, etc.)
 * @param {number} [retries=3] - Number of retry attempts
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If all retries fail
 */
export async function fetchWithRetry(url, options = {}, retries = 3) {
  return retry(
    async () => {
      const startTime = Date.now();
      log.debug('API request', { url, method: options.method || 'GET' });

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No body');
        log.error('API request failed', {
          url,
          status: response.status,
          duration,
          body: errorBody,
        });
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      log.debug('API request succeeded', { url, duration });
      return data;
    },
    retries,
    1000
  );
}

/**
 * Example: GET request to an external API.
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<Object>} API response data
 */
export async function get(endpoint) {
  return fetchWithRetry(endpoint, { method: 'GET' });
}

/**
 * Example: POST request to an external API.
 * @param {string} endpoint - API endpoint path
 * @param {Object} body - Request body
 * @returns {Promise<Object>} API response data
 */
export async function post(endpoint, body) {
  return fetchWithRetry(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
