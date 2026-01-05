/**
 * Storage Module Exports
 * Unified storage system with multiple providers and backward compatibility
 */

// Core exports
export { getStorageManager, StorageManager } from "./storage-manager";
export type { StorageManagerConfig } from "./storage-manager";

// Provider exports
export { MemoryStorageProvider } from "./providers/memory.provider";
export { SessionStorageProvider } from "./providers/session.provider";
export { IndexedDBProvider } from "./providers/indexeddb.provider";
export { HybridStorageProvider } from "./providers/hybrid.provider";

// Type exports
export type {
  IStorageProvider,
  StorageMetadata,
  StorageOptions,
  StorageType,
  StoredItem,
} from "./providers/types";

// Compatibility exports
export {
  CompatibilityStorageAdapter,
  getCompatibilityStorageAdapter,
  getSessionStorageManager,
} from "./compatibility-adapter";

// WebSocket integration
export {
  getWebSocketStorageBatcher,
  WebSocketStorageBatcher,
} from "./web-socket-integration";
