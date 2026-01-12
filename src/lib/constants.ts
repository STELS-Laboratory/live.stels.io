/**
 * Centralized constants for the application
 * All magic numbers and configuration values should be defined here
 */

/**
 * Timing constants in milliseconds
 */
export const TIMING = {
  /** Delay before attempting to restore connection */
  RESTORE_DELAY_MS: 50,
  /** Timeout for force render if hydration takes too long */
  FORCE_RENDER_TIMEOUT_MS: 800,
  /** Duration of splash screen animation */
  SPLASH_DURATION_MS: 1200,
  /** Interval for checking session validity */
  SESSION_CHECK_INTERVAL_MS: 5 * 60 * 1000,
  /** Delay before attempting WebSocket reconnection */
  RECONNECT_DELAY_MS: 1500,
  /** Number of messages to process per animation frame */
  MESSAGE_BATCH_CHUNK_SIZE: 10,
  /** Throttle interval for activity updates */
  ACTIVITY_THROTTLE_MS: 1000,
  /** Delay after successful auth before closing dialog */
  AUTH_SUCCESS_DELAY_MS: 1500,
  /** Route transition duration */
  ROUTE_TRANSITION_MS: 200,
} as const;

/**
 * Application routes
 */
export const ROUTES = {
  WELCOME: 'welcome',
  CANVAS: 'canvas',
  EDITOR: 'editor',
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];

/**
 * Allowed routes array for validation
 */
export const ALLOWED_ROUTES: Route[] = [
  ROUTES.WELCOME,
  ROUTES.CANVAS,
  ROUTES.EDITOR,
];

/**
 * Default route based on authentication state
 */
export const getDefaultRoute = (isAuthenticated: boolean): Route => {
  return isAuthenticated ? ROUTES.CANVAS : ROUTES.WELCOME;
};

/**
 * WebSocket configuration
 */
export const WEBSOCKET = {
  /** Maximum reconnection attempts before giving up */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** Protocol for WebSocket connection */
  PROTOCOLS: ['webfix'],
} as const;

/**
 * Storage keys used across the application
 */
export const STORAGE_KEYS = {
  AUTH_STORE: 'auth-store',
  PRIVATE_STORE: 'private-store',
  THEME_STORE: 'theme-store',
  NETWORK_STORE: 'network-store',
  APP_LAST_VERSION: 'app-last-version',
  SELECTED_NETWORK: 'selected-network',
  GITHUB_OAUTH_STATE: 'github_oauth_state',
  GITHUB_OAUTH_PENDING_CODE: 'github_oauth_pending_code',
  GITHUB_OAUTH_PENDING_STATE: 'github_oauth_pending_state',
} as const;

/**
 * Animation durations for consistent motion design
 */
export const ANIMATION = {
  /** Instant feedback */
  INSTANT: 0.08,
  /** Quick interactions */
  FAST: 0.15,
  /** Standard transitions */
  NORMAL: 0.25,
  /** Slower, more deliberate animations */
  SLOW: 0.35,
  /** Easing function for most animations */
  EASE: [0.16, 1, 0.3, 1],
  /** Easing for enter animations */
  EASE_OUT: [0.0, 0.0, 0.2, 1],
} as const;

/**
 * Application state machine states
 */
export const APP_STATES = {
  INITIALIZING: 'initializing',
  SCANNING_STORAGE: 'scanning_storage',
  HYDRATING: 'hydrating',
  CHECKING_SESSION: 'checking_session',
  AUTHENTICATING: 'authenticating',
  CONNECTING: 'connecting',
  LOADING_APP: 'loading_app',
  READY: 'ready',
  UPGRADING: 'upgrading',
} as const;

export type AppState = typeof APP_STATES[keyof typeof APP_STATES];

/**
 * State transition delays in milliseconds
 */
export const STATE_TRANSITION_DELAYS: Record<string, number> = {
  'initializing->scanning_storage': 200,
  'scanning_storage->hydrating': 200,
  'initializing->hydrating': 200,
  'hydrating->checking_session': 300,
  'checking_session->authenticating': 150,
  'checking_session->loading_app': 250,
  'authenticating->connecting': 200,
  'connecting->loading_app': 400,
  'loading_app->ready': 300,
  'ready->upgrading': 150,
  'upgrading->ready': 200,
};

/**
 * State messages for loading screens
 */
export const STATE_MESSAGES: Record<AppState, string> = {
  initializing: 'Starting up...',
  scanning_storage: 'Checking storage...',
  hydrating: 'Loading your data...',
  checking_session: 'Checking authentication...',
  authenticating: 'Authenticating...',
  connecting: 'Establishing connection...',
  loading_app: 'Preparing interface...',
  ready: 'Ready!',
  upgrading: 'System upgrade in progress...',
};
