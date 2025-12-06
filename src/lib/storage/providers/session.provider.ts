/**
 * Session Storage Provider
 * Async wrapper for sessionStorage with parallel operations
 */

import type {
	IStorageProvider,
	StorageType,
	StorageOptions,
	StoredItem,
	StorageMetadata,
} from "./types";

export class SessionStorageProvider implements IStorageProvider {
	readonly type: StorageType = "session";
	private cache: Map<string, StoredItem> = new Map();
	private readonly CACHE_TTL = 1000; // 1 second cache

	isAvailable(): boolean {
		try {
			const test = "__storage_test__";
			sessionStorage.setItem(test, test);
			sessionStorage.removeItem(test);
			return true;
		} catch {
			return false;
		}
	}

	async getItem<T = unknown>(channel: string): Promise<StoredItem<T> | null> {
		const key = channel.toLowerCase();

		// Check cache first
		const cached = this.cache.get(key);
		if (cached) {
			return cached as StoredItem<T>;
		}

		try {
			// Try original key first, then lowercase
			let stored = sessionStorage.getItem(channel);
			if (!stored) {
				stored = sessionStorage.getItem(key);
			}

			if (!stored) {
				return null;
			}

			const parsed = JSON.parse(stored) as StoredItem<T>;

			// Check TTL
			if (parsed.metadata?.ttl) {
				const age = Date.now() - parsed.metadata.timestamp;
				if (age > parsed.metadata.ttl) {
					await this.removeItem(channel);
					return null;
				}
			}

			// Cache for fast access
			this.cache.set(key, parsed);
			setTimeout(() => this.cache.delete(key), this.CACHE_TTL);

			return parsed;
		} catch {
			return null;
		}
	}

	async setItem<T = unknown>(
		channel: string,
		data: T,
		options?: StorageOptions,
	): Promise<void> {
		const key = channel.toLowerCase();
		const dataString = JSON.stringify(data);
		const size = new Blob([dataString]).size;

		const metadata: StorageMetadata = {
			timestamp: Date.now(),
			ttl: options?.ttl,
			compressed: false,
			size,
			channel: key,
		};

		const item: StoredItem<T> = {
			data,
			metadata,
		};

		try {
			// Use requestIdleCallback for non-blocking writes
			if (typeof requestIdleCallback !== "undefined") {
				await new Promise<void>((resolve) => {
					requestIdleCallback(
						() => {
							sessionStorage.setItem(key, JSON.stringify(item));
							this.cache.set(key, item as StoredItem);
							resolve();
						},
						{ timeout: 100 },
					);
				});
			} else {
				// Fallback to immediate write
				sessionStorage.setItem(key, JSON.stringify(item));
				this.cache.set(key, item as StoredItem);
			}
		} catch (error) {
			if ((error as Error).name === "QuotaExceededError") {
				throw new Error("SessionStorage quota exceeded");
			}
			throw error;
		}
	}

	async removeItem(channel: string): Promise<void> {
		const key = channel.toLowerCase();
		try {
			sessionStorage.removeItem(key);
			sessionStorage.removeItem(channel); // Also try original
			this.cache.delete(key);
		} catch {
			// Error handled silently
		}
	}

	async getItems<T = unknown>(
		channels: string[],
	): Promise<Map<string, StoredItem<T> | null>> {
		// Parallel execution with batching
		const BATCH_SIZE = 10;
		const results = new Map<string, StoredItem<T> | null>();

		for (let i = 0; i < channels.length; i += BATCH_SIZE) {
			const batch = channels.slice(i, i + BATCH_SIZE);
			const batchResults = await Promise.all(
				batch.map(async (channel) => {
					const item = await this.getItem<T>(channel);
					return [channel, item] as [string, StoredItem<T> | null];
				}),
			);

			batchResults.forEach(([channel, item]) => {
				results.set(channel, item);
			});
		}

		return results;
	}

	async setItems<T = unknown>(
		items: Map<string, T>,
		options?: StorageOptions,
	): Promise<void> {
		// Batch writes to avoid blocking
		const entries = Array.from(items.entries());
		const BATCH_SIZE = 10;

		for (let i = 0; i < entries.length; i += BATCH_SIZE) {
			const batch = entries.slice(i, i + BATCH_SIZE);
			await Promise.all(
				batch.map(([channel, data]) => this.setItem(channel, data, options)),
			);

			// Yield to event loop between batches
			if (i + BATCH_SIZE < entries.length) {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}
	}

	async removeItems(channels: string[]): Promise<void> {
		// Parallel execution
		await Promise.all(channels.map((channel) => this.removeItem(channel)));
	}

	async getAllKeys(): Promise<string[]> {
		const keys: string[] = [];
		try {
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key) {
					keys.push(key);
				}
			}
		} catch {
			// Error handled silently
		}
		return keys;
	}

	async clear(): Promise<void> {
		try {
			sessionStorage.clear();
			this.cache.clear();
		} catch {
			// Error handled silently
		}
	}

	async getSize(): Promise<number> {
		let totalSize = 0;
		try {
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key) {
					const value = sessionStorage.getItem(key);
					if (value) {
						totalSize += new Blob([value]).size;
					}
				}
			}
		} catch {
			// Error handled silently
		}
		return totalSize;
	}

	async has(channel: string): Promise<boolean> {
		const key = channel.toLowerCase();
		try {
			return (
				sessionStorage.getItem(key) !== null ||
				sessionStorage.getItem(channel) !== null
			);
		} catch {
			return false;
		}
	}
}

