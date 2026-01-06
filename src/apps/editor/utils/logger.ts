/**
 * Development-only logging utility
 * Logs are only shown in development mode, not in production
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Safe function to get keys from an object without circular references
 * Avoids DOM elements and React components that may have circular refs
 */
export function getSafeKeys(obj: unknown): string[] {
  if (!obj || typeof obj !== "object") return [];
  try {
    // Only get keys from plain objects, avoid DOM elements and React components
    if (obj instanceof HTMLElement || obj instanceof Element) return [];
    // Check if it's a plain object (not a class instance with circular refs)
    const proto = Object.getPrototypeOf(obj);
    if (proto !== null && proto !== Object.prototype) {
      // Might be a class instance, be cautious
      return [];
    }
    return Object.keys(obj);
  } catch {
    return [];
  }
}

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

