/**
 * Development-only logging utility
 * Logs are only shown in development mode, not in production
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Log a message (dev-only)
 */
export function log(...args: unknown[]): void {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Log an error (dev-only)
 */
export function logError(...args: unknown[]): void {
  if (isDevelopment) {
    console.error(...args);
  }
}

/**
 * Log a warning (dev-only)
 */
export function logWarn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn(...args);
  }
}

