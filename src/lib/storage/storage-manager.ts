/**
 * Universal Storage Manager
 * Manages multiple storage providers with automatic selection and switching
 */

import type {
	IStorageProvider,
	StorageType,
	StorageOptions,
	StoredItem,
} from "./providers/types";
import { MemoryStorageProvider } from "./providers/memory.provider";
import { SessionStorageProvider } from "./providers/session.provider";
import { IndexedDBProvider } from "./providers/indexeddb.provider";
import { HybridStorageProvider } from "./providers/hybrid.provider";

export interface StorageManagerConfig {
	defaultProvider?: StorageType;
	enableHybrid?: boolean;
	memoryLimit?: number;
}

/**
 * Universal Storage Manager
 * Provides unified API with automatic provider selection
 */
export class StorageManager {
	private static instance: StorageManager;
	private providers: Map<StorageType, IStorageProvider> = new Map();
	private currentProvider: IStorageProvider;
	private config: StorageManagerConfig;

	private constructor(config: StorageManagerConfig = {}) {
		this.config = {
			defaultProvider: config.defaultProvider || "hybrid",
			enableHybrid: config.enableHybrid ?? true,
			memoryLimit: config.memoryLimit || 100 * 1024 * 1024,
		};

		// Initialize all providers
		this.initializeProviders();

		// Set default provider
		const defaultType = this.config.defaultProvider!;
		this.currentProvider = this.providers.get(defaultType) || this.providers.get("hybrid")!;
	}

	private initializeProviders(): void {
		// Initialize memory provider
		const memoryProvider = new MemoryStorageProvider(this.config.memoryLimit);
		this.providers.set("memory", memoryProvider);

		// Initialize session provider
		const sessionProvider = new SessionStorageProvider();
		if (sessionProvider.isAvailable()) {
			this.providers.set("session", sessionProvider);
		}

		// Initialize IndexedDB provider
		const indexedDBProvider = new IndexedDBProvider();
		if (indexedDBProvider.isAvailable()) {
			this.providers.set("indexeddb", indexedDBProvider);
		}

		// Initialize hybrid provider (if enabled)
		if (this.config.enableHybrid) {
			const hybridProvider = new HybridStorageProvider();
			if (hybridProvider.isAvailable()) {
				this.providers.set("hybrid", hybridProvider);
			}
		}
	}

	/**
	 * Get singleton instance
	 */
	public static getInstance(config?: StorageManagerConfig): StorageManager {
		if (!StorageManager.instance) {
			StorageManager.instance = new StorageManager(config);
		}
		return StorageManager.instance;
	}

	/**
	 * Switch to different storage provider
	 */
	public switchProvider(type: StorageType): void {
		const provider = this.providers.get(type);
		if (!provider) {
			throw new Error(`Storage provider ${type} is not available`);
		}

		if (!provider.isAvailable()) {
			throw new Error(`Storage provider ${type} is not available`);
		}

		this.currentProvider = provider;
	}

	/**
	 * Get current provider
	 */
	public getCurrentProvider(): StorageType {
		return this.currentProvider.type;
	}

	/**
	 * Get provider instance
	 */
	public getProvider(type?: StorageType): IStorageProvider {
		if (type) {
			const provider = this.providers.get(type);
			if (!provider || !provider.isAvailable()) {
				throw new Error(`Storage provider ${type} is not available`);
			}
			return provider;
		}
		return this.currentProvider;
	}

	/**
	 * Get item from storage
	 */
	public async getItem<T = unknown>(
		channel: string,
		providerType?: StorageType,
	): Promise<StoredItem<T> | null> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.getItem<T>(channel);
	}

	/**
	 * Set item in storage
	 */
	public async setItem<T = unknown>(
		channel: string,
		data: T,
		options?: StorageOptions,
		providerType?: StorageType,
	): Promise<void> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.setItem(channel, data, options);
	}

	/**
	 * Remove item from storage
	 */
	public async removeItem(
		channel: string,
		providerType?: StorageType,
	): Promise<void> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.removeItem(channel);
	}

	/**
	 * Get multiple items in parallel
	 */
	public async getItems<T = unknown>(
		channels: string[],
		providerType?: StorageType,
	): Promise<Map<string, StoredItem<T> | null>> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.getItems<T>(channels);
	}

	/**
	 * Set multiple items in parallel
	 */
	public async setItems<T = unknown>(
		items: Map<string, T>,
		options?: StorageOptions,
		providerType?: StorageType,
	): Promise<void> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.setItems(items, options);
	}

	/**
	 * Remove multiple items in parallel
	 */
	public async removeItems(
		channels: string[],
		providerType?: StorageType,
	): Promise<void> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.removeItems(channels);
	}

	/**
	 * Get all channel keys
	 */
	public async getAllKeys(providerType?: StorageType): Promise<string[]> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.getAllKeys();
	}

	/**
	 * Clear all data
	 */
	public async clear(providerType?: StorageType): Promise<void> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.clear();
	}

	/**
	 * Get storage size
	 */
	public async getSize(providerType?: StorageType): Promise<number> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.getSize();
	}

	/**
	 * Check if channel exists
	 */
	public async has(
		channel: string,
		providerType?: StorageType,
	): Promise<boolean> {
		const provider = providerType
			? this.getProvider(providerType)
			: this.currentProvider;
		return provider.has(channel);
	}

	/**
	 * Get available providers
	 */
	public getAvailableProviders(): StorageType[] {
		const available: StorageType[] = [];
		for (const [type, provider] of this.providers.entries()) {
			if (provider.isAvailable()) {
				available.push(type);
			}
		}
		return available;
	}
}

// Export singleton getter
export const getStorageManager = (
	config?: StorageManagerConfig,
): StorageManager => {
	return StorageManager.getInstance(config);
};

