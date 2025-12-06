/**
 * Storage Module Exports
 * Unified storage system with multiple providers and backward compatibility
 */

// Core exports
export { StorageManager, getStorageManager } from "./storage-manager";
export type { StorageManagerConfig } from "./storage-manager";

// Provider exports
export { MemoryStorageProvider } from "./providers/memory.provider";
export { SessionStorageProvider } from "./providers/session.provider";
export { IndexedDBProvider } from "./providers/indexeddb.provider";
export { HybridStorageProvider } from "./providers/hybrid.provider";

// Type exports
export type {
	IStorageProvider,
	StorageType,
	StorageOptions,
	StoredItem,
	StorageMetadata,
} from "./providers/types";

// Compatibility exports
export {
	CompatibilityStorageAdapter,
	getCompatibilityStorageAdapter,
	getSessionStorageManager,
} from "./compatibility-adapter";

// WebSocket integration
export {
	WebSocketStorageBatcher,
	getWebSocketStorageBatcher,
} from "./web-socket-integration";

