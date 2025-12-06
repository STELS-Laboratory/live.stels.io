/**
 * Storage Provider Types
 * Unified interface for all storage providers
 */

export type StorageType = "memory" | "session" | "indexeddb" | "hybrid";

export interface StorageOptions {
	ttl?: number;
	compress?: boolean;
	priority?: "performance" | "persistence" | "balance";
}

export interface StorageMetadata {
	timestamp: number;
	ttl?: number;
	compressed?: boolean;
	size: number;
	channel: string;
}

export interface StoredItem<T = unknown> {
	data: T;
	metadata: StorageMetadata;
}

/**
 * Base interface for all storage providers
 */
export interface IStorageProvider {
	/**
	 * Provider type identifier
	 */
	readonly type: StorageType;

	/**
	 * Check if provider is available
	 */
	isAvailable(): boolean;

	/**
	 * Get item from storage
	 */
	getItem<T = unknown>(channel: string): Promise<StoredItem<T> | null>;

	/**
	 * Set item in storage
	 */
	setItem<T = unknown>(
		channel: string,
		data: T,
		options?: StorageOptions,
	): Promise<void>;

	/**
	 * Remove item from storage
	 */
	removeItem(channel: string): Promise<void>;

	/**
	 * Get multiple items in parallel
	 */
	getItems<T = unknown>(
		channels: string[],
	): Promise<Map<string, StoredItem<T> | null>>;

	/**
	 * Set multiple items in parallel
	 */
	setItems<T = unknown>(
		items: Map<string, T>,
		options?: StorageOptions,
	): Promise<void>;

	/**
	 * Remove multiple items in parallel
	 */
	removeItems(channels: string[]): Promise<void>;

	/**
	 * Get all channel keys
	 */
	getAllKeys(): Promise<string[]>;

	/**
	 * Clear all data
	 */
	clear(): Promise<void>;

	/**
	 * Get storage size estimate
	 */
	getSize(): Promise<number>;

	/**
	 * Check if channel exists
	 */
	has(channel: string): Promise<boolean>;
}

