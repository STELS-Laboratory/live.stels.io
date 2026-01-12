/**
 * Common type definitions used across the application
 */

import { ROUTES } from "@/lib/constants";

/**
 * Valid application route
 */
export type Route = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Theme mode options
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Network connection interface extending Navigator
 */
export interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
  addEventListener?: (type: string, listener: () => void) => void;
}

/**
 * Extended Navigator interface with network connection properties
 */
export interface ExtendedNavigator extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

/**
 * Type guard to check if navigator has network info
 */
export function hasNetworkInfo(nav: Navigator): nav is ExtendedNavigator {
  const extNav = nav as ExtendedNavigator;
  return !!(extNav.connection || extNav.mozConnection || extNav.webkitConnection);
}

/**
 * Get network connection from navigator
 */
export function getNetworkConnection(nav: Navigator): NetworkConnection | undefined {
  if (!hasNetworkInfo(nav)) return undefined;
  const extNav = nav as ExtendedNavigator;
  return extNav.connection || extNav.mozConnection || extNav.webkitConnection;
}

/**
 * WebSocket message types
 */
export type WebSocketMessageType = "message" | "ping" | "pong" | "error" | "close";

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

/**
 * Storage item with metadata
 */
export interface StorageItem<T> {
  data: T;
  timestamp: number;
  version?: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Type-safe event handler
 */
export type EventHandler<T = void> = (event: T) => void;

/**
 * Async operation state
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Type-safe object keys
 */
export type ObjectKeys<T> = keyof T;

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;
