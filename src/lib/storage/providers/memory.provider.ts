/**
 * Memory Storage Provider
 * Fast in-memory storage with no persistence
 * Best for temporary data and caching
 */

import type {
	IStorageProvider,
	StorageType,
	StorageOptions,
	StoredItem,
	StorageMetadata,
} from "./types";

export class MemoryStorageProvider implements IStorageProvider {
	readonly type: StorageType = "memory";
	private storage: Map<string, StoredItem> = new Map();
	private maxSize: number;

	constructor(maxSize: number = 100 * 1024 * 1024) {
		// 100MB default limit
		this.maxSize = maxSize;
	}

	isAvailable(): boolean {
		return true; // Always available
	}

	async getItem<T = unknown>(channel: string): Promise<StoredItem<T> | null> {
		const key = channel.toLowerCase();
		const item = this.storage.get(key);

		if (!item) {
			return null;
		}

		// Check TTL
		if (item.metadata.ttl) {
			const age = Date.now() - item.metadata.timestamp;
			if (age > item.metadata.ttl) {
				this.storage.delete(key);
				return null;
			}
		}

		return item as StoredItem<T>;
	}

	async setItem<T = unknown>(
		channel: string,
		data: T,
		options?: StorageOptions,
	): Promise<void> {
		const key = channel.toLowerCase();
		const dataString = JSON.stringify(data);
		const size = new Blob([dataString]).size;

		// Check size limit
		if (size > this.maxSize) {
			throw new Error(`Data size ${size} exceeds memory limit ${this.maxSize}`);
		}

		const metadata: StorageMetadata = {
			timestamp: Date.now(),
			ttl: options?.ttl,
			compressed: false,
			size,
			channel: key,
		};

		this.storage.set(key, {
			data,
			metadata,
		});
	}

	async removeItem(channel: string): Promise<void> {
		const key = channel.toLowerCase();
		this.storage.delete(key);
	}

	async getItems<T = unknown>(
		channels: string[],
	): Promise<Map<string, StoredItem<T> | null>> {
		// Parallel execution
		const results = await Promise.all(
			channels.map(async (channel) => {
				const item = await this.getItem<T>(channel);
				return [channel, item] as [string, StoredItem<T> | null];
			}),
		);

		return new Map(results);
	}

	async setItems<T = unknown>(
		items: Map<string, T>,
		options?: StorageOptions,
	): Promise<void> {
		// Parallel execution
		await Promise.all(
			Array.from(items.entries()).map(([channel, data]) =>
				this.setItem(channel, data, options),
			),
		);
	}

	async removeItems(channels: string[]): Promise<void> {
		// Parallel execution
		await Promise.all(channels.map((channel) => this.removeItem(channel)));
	}

	async getAllKeys(): Promise<string[]> {
		return Array.from(this.storage.keys());
	}

	async clear(): Promise<void> {
		this.storage.clear();
	}

	async getSize(): Promise<number> {
		let totalSize = 0;
		for (const item of this.storage.values()) {
			totalSize += item.metadata.size;
		}
		return totalSize;
	}

	async has(channel: string): Promise<boolean> {
		const key = channel.toLowerCase();
		return this.storage.has(key);
	}
}

