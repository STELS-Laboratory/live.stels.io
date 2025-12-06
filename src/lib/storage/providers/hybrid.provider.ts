/**
 * Hybrid Storage Provider
 * Automatically selects best storage based on data size and options
 * Uses memory for hot data, sessionStorage for medium, IndexedDB for large
 */

import type {
	IStorageProvider,
	StorageType,
	StorageOptions,
	StoredItem,
} from "./types";
import { MemoryStorageProvider } from "./memory.provider";
import { SessionStorageProvider } from "./session.provider";
import { IndexedDBProvider } from "./indexeddb.provider";

const MEMORY_THRESHOLD = 10 * 1024; // 10KB - use memory
const SESSION_THRESHOLD = 100 * 1024; // 100KB - use sessionStorage
// Above 100KB - use IndexedDB

export class HybridStorageProvider implements IStorageProvider {
	readonly type: StorageType = "hybrid";
	private memoryProvider: MemoryStorageProvider;
	private sessionProvider: SessionStorageProvider;
	private indexedDBProvider: IndexedDBProvider;

	constructor() {
		this.memoryProvider = new MemoryStorageProvider();
		this.sessionProvider = new SessionStorageProvider();
		this.indexedDBProvider = new IndexedDBProvider();
	}

	isAvailable(): boolean {
		return (
			this.memoryProvider.isAvailable() ||
			this.sessionProvider.isAvailable() ||
			this.indexedDBProvider.isAvailable()
		);
	}

	private selectProvider(
		dataSize: number,
		options?: StorageOptions,
	): IStorageProvider {
		// Priority-based selection
		if (options?.priority === "performance") {
			return this.memoryProvider;
		}

		if (options?.priority === "persistence") {
			if (this.indexedDBProvider.isAvailable()) {
				return this.indexedDBProvider;
			}
			return this.sessionProvider;
		}

		// Size-based selection
		if (dataSize <= MEMORY_THRESHOLD) {
			return this.memoryProvider;
		}

		if (dataSize <= SESSION_THRESHOLD && this.sessionProvider.isAvailable()) {
			return this.sessionProvider;
		}

		if (this.indexedDBProvider.isAvailable()) {
			return this.indexedDBProvider;
		}

		// Fallback chain
		if (this.sessionProvider.isAvailable()) {
			return this.sessionProvider;
		}

		return this.memoryProvider;
	}

	async getItem<T = unknown>(channel: string): Promise<StoredItem<T> | null> {
		// Try all providers in order of speed
		const providers = [
			this.memoryProvider,
			this.sessionProvider,
			this.indexedDBProvider,
		];

		for (const provider of providers) {
			if (!provider.isAvailable()) continue;

			const item = await provider.getItem<T>(channel);
			if (item) {
				// Cache in memory for faster access
				if (provider !== this.memoryProvider) {
					await this.memoryProvider.setItem(channel, item.data, {
						ttl: item.metadata.ttl,
					});
				}
				return item;
			}
		}

		return null;
	}

	async setItem<T = unknown>(
		channel: string,
		data: T,
		options?: StorageOptions,
	): Promise<void> {
		const dataString = JSON.stringify(data);
		const dataSize = new Blob([dataString]).size;

		const provider = this.selectProvider(dataSize, options);

		// Write to selected provider
		await provider.setItem(channel, data, options);

		// Also cache in memory for fast reads
		if (provider !== this.memoryProvider && dataSize <= MEMORY_THRESHOLD) {
			try {
				await this.memoryProvider.setItem(channel, data, {
					ttl: options?.ttl,
				});
			} catch {
				// Ignore memory cache errors
			}
		}
	}

	async removeItem(channel: string): Promise<void> {
		// Remove from all providers
		await Promise.all([
			this.memoryProvider.removeItem(channel),
			this.sessionProvider.removeItem(channel),
			this.indexedDBProvider.removeItem(channel),
		]);
	}

	async getItems<T = unknown>(
		channels: string[],
	): Promise<Map<string, StoredItem<T> | null>> {
		// Parallel reads from all providers, merge results
		const [memoryResults, sessionResults, indexedResults] = await Promise.all([
			this.memoryProvider.getItems<T>(channels),
			this.sessionProvider.getItems<T>(channels),
			this.indexedDBProvider.getItems<T>(channels),
		]);

		// Merge with priority: memory > session > indexeddb
		const results = new Map<string, StoredItem<T> | null>();

		for (const channel of channels) {
			const memoryItem = memoryResults.get(channel);
			const sessionItem = sessionResults.get(channel);
			const indexedItem = indexedResults.get(channel);

			const item = memoryItem || sessionItem || indexedItem;
			results.set(channel, item || null);
		}

		return results;
	}

	async setItems<T = unknown>(
		items: Map<string, T>,
		options?: StorageOptions,
	): Promise<void> {
		// Group items by size and write to appropriate providers
		const memoryItems = new Map<string, T>();
		const sessionItems = new Map<string, T>();
		const indexedItems = new Map<string, T>();

		for (const [channel, data] of items.entries()) {
			const dataString = JSON.stringify(data);
			const dataSize = new Blob([dataString]).size;

			if (dataSize <= MEMORY_THRESHOLD) {
				memoryItems.set(channel, data);
			} else if (dataSize <= SESSION_THRESHOLD) {
				sessionItems.set(channel, data);
			} else {
				indexedItems.set(channel, data);
			}
		}

		// Parallel writes to all providers
		await Promise.all([
			memoryItems.size > 0
				? this.memoryProvider.setItems(memoryItems, options)
				: Promise.resolve(),
			sessionItems.size > 0
				? this.sessionProvider.setItems(sessionItems, options)
				: Promise.resolve(),
			indexedItems.size > 0
				? this.indexedDBProvider.setItems(indexedItems, options)
				: Promise.resolve(),
		]);
	}

	async removeItems(channels: string[]): Promise<void> {
		// Parallel removal from all providers
		await Promise.all([
			this.memoryProvider.removeItems(channels),
			this.sessionProvider.removeItems(channels),
			this.indexedDBProvider.removeItems(channels),
		]);
	}

	async getAllKeys(): Promise<string[]> {
		// Get keys from all providers and merge
		const [memoryKeys, sessionKeys, indexedKeys] = await Promise.all([
			this.memoryProvider.getAllKeys(),
			this.sessionProvider.getAllKeys(),
			this.indexedDBProvider.getAllKeys(),
		]);

		const allKeys = new Set([...memoryKeys, ...sessionKeys, ...indexedKeys]);
		return Array.from(allKeys);
	}

	async clear(): Promise<void> {
		// Clear all providers
		await Promise.all([
			this.memoryProvider.clear(),
			this.sessionProvider.clear(),
			this.indexedDBProvider.clear(),
		]);
	}

	async getSize(): Promise<number> {
		// Sum sizes from all providers
		const [memorySize, sessionSize, indexedSize] = await Promise.all([
			this.memoryProvider.getSize(),
			this.sessionProvider.getSize(),
			this.indexedDBProvider.getSize(),
		]);

		return memorySize + sessionSize + indexedSize;
	}

	async has(channel: string): Promise<boolean> {
		// Check all providers in parallel
		const [memoryHas, sessionHas, indexedHas] = await Promise.all([
			this.memoryProvider.has(channel),
			this.sessionProvider.has(channel),
			this.indexedDBProvider.has(channel),
		]);

		return memoryHas || sessionHas || indexedHas;
	}
}

