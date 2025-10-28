/**
 * Production Logger Utility
 * Conditionally logs based on environment
 * 
 * In development: All logs enabled
 * In production: Only errors and warnings
 */

/**
 * Environment-aware logger
 * Replaces direct console.log usage for production readiness
 */
export const logger = {
  /**
   * Debug logging - only in development
   * Use for detailed debugging information
   */
  log(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },

  /**
   * Debug logging - only in development
   * Alias for log()
   */
  debug(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Info logging - only in development
   * Use for informational messages
   */
  info(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log("[INFO]", ...args);
    }
  },

  /**
   * Warning logging - always enabled
   * Use for non-critical issues
   */
  warn(...args: unknown[]): void {
    console.warn(...args);
  },

  /**
   * Error logging - always enabled
   * Use for errors that need attention
   */
  error(...args: unknown[]): void {
    console.error(...args);
  },

  /**
   * Group logging - only in development
   * Use for grouped debug information
   */
  group(label: string, callback: () => void): void {
    if (import.meta.env.DEV) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Table logging - only in development
   * Use for structured data display
   */
  table(data: unknown): void {
    if (import.meta.env.DEV) {
      console.table(data);
    }
  },

  /**
   * Time measurement - only in development
   * Use for performance profiling
   */
  time(label: string): void {
    if (import.meta.env.DEV) {
      console.time(label);
    }
  },

  /**
   * End time measurement - only in development
   */
  timeEnd(label: string): void {
    if (import.meta.env.DEV) {
      console.timeEnd(label);
    }
  },
};

/**
 * Production-safe console replacement
 * Can be used as drop-in replacement for console
 */
export default logger;

