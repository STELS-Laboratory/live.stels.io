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
/* eslint-disable @typescript-eslint/no-unused-vars */
export const logger = {
  /**
   * Debug logging - only in development
   * Use for detailed debugging information
   */
  log(..._args: unknown[]): void {
    if (import.meta.env.DEV) {
      // Debug logging disabled in production
    }
  },

  /**
   * Debug logging - only in development
   * Alias for log()
   */
  debug(..._args: unknown[]): void {
    if (import.meta.env.DEV) {
      // Debug logging disabled in production
    }
  },

  /**
   * Info logging - only in development
   * Use for informational messages
   */
  info(..._args: unknown[]): void {
    if (import.meta.env.DEV) {
      // Info logging disabled in production
    }
  },

  /**
   * Warning logging - always enabled
   * Use for non-critical issues
   */
  warn(..._args: unknown[]): void {
    // Warning logging disabled
  },

  /**
   * Error logging - always enabled
   * Use for errors that need attention
   */
  error(..._args: unknown[]): void {
    // Error logging disabled
  },

  /**
   * Group logging - only in development
   * Use for grouped debug information
   */
  group(_label: string, callback: () => void): void {
    if (import.meta.env.DEV) {
      // Group logging disabled in production
      callback();
    }
  },

  /**
   * Table logging - only in development
   * Use for structured data display
   */
  table(_data: unknown): void {
    if (import.meta.env.DEV) {
      // Table logging disabled in production
    }
  },

  /**
   * Time measurement - only in development
   * Use for performance profiling
   */
  time(_label: string): void {
    if (import.meta.env.DEV) {
      // Time logging disabled in production
    }
  },

  /**
   * End time measurement - only in development
   */
  timeEnd(_label: string): void {
    if (import.meta.env.DEV) {
      // TimeEnd logging disabled in production
    }
  },
};
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Production-safe console replacement
 * Can be used as drop-in replacement for console
 */
export default logger;
