/**
 * Hook-related type definitions
 */

/**
 * Public WebSocket connection configuration
 * Connects without authentication for public data access
 */
export interface PublicWebSocketConfig {
  socket: string;
  protocols?: string[];
}

/**
 * Message batching for performance optimization
 */
export interface MessageBatch {
  [channel: string]: string;
}

/**
 * WebSocket information structure
 */
export type WebSocketInfo = {
  connector: {
    socket: string;
    protocols?: string | string[];
  };
  network: string;
  title: string;
  pid: string;
};

/**
 * Session data structure
 */
export type SessionData = {
  raw: {
    session: string;
  };
};

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  raw: {
    info: WebSocketInfo;
  };
}

/**
 * WebSocket state interface
 */
export interface WebSocketState {
  ws: WebSocket | null;
  connection: boolean;
  locked: boolean;
  sessionExpired: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isCleaningUp: boolean;
  connectNode: (config: WebSocketConfig) => void;
  handleSessionExpired: () => void;
  resetReconnectAttempts: () => void;
  resetWebSocketState: () => void;
}
