/**
 * IndexedDB Storage Provider
 * High-performance storage with parallel transactions
 */

import type {
	IStorageProvider,
	StorageType,
	StorageOptions,
	StoredItem,
	StorageMetadata,
} from "./types";

const DB_NAME = "web3-storage";
const DB_VERSION = 1;
const STORE_NAME = "data";

interface IndexedDBStoredItem {
	channel: string;
	data: string;
	metadata: StorageMetadata;
}

export class IndexedDBProvider implements IStorageProvider {
	readonly type: StorageType = "indexeddb";
	private db: IDBDatabase | null = null;
	private initPromise: Promise<IDBDatabase> | null = null;
	private cache: Map<string, StoredItem> = new Map();

	isAvailable(): boolean {
		return "indexedDB" in window;
	}

	private async getDB(): Promise<IDBDatabase> {
		if (this.db) {
			return this.db;
		}

		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
			if (!this.isAvailable()) {
				reject(new Error("IndexedDB not available"));
				return;
			}

			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				this.initPromise = null;
				reject(new Error("Failed to open IndexedDB"));
			};

			request.onsuccess = () => {
				this.db = request.result;
				this.initPromise = null;
				resolve(this.db);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, { keyPath: "channel" });
					store.createIndex("timestamp", "metadata.timestamp", { unique: false });
					store.createIndex("ttl", "metadata.ttl", { unique: false });
				}
			};
		});

		return this.initPromise;
	}

	async getItem<T = unknown>(channel: string): Promise<StoredItem<T> | null> {
		const key = channel.toLowerCase();

		// Check cache first
		const cached = this.cache.get(key);
		if (cached) {
			return cached as StoredItem<T>;
		}

		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);

			const stored = await new Promise<IndexedDBStoredItem | null>(
				(resolve, reject) => {
					const request = store.get(key);
					request.onsuccess = () => resolve(request.result ?? null);
					request.onerror = () => reject(new Error("Failed to read from IndexedDB"));
				},
			);

			if (!stored) {
				return null;
			}

			// Check TTL
			if (stored.metadata.ttl) {
				const age = Date.now() - stored.metadata.timestamp;
				if (age > stored.metadata.ttl) {
					await this.removeItem(channel);
					return null;
				}
			}

			const item: StoredItem<T> = {
				data: JSON.parse(stored.data) as T,
				metadata: stored.metadata,
			};

			// Cache for fast access
			this.cache.set(key, item);

			return item;
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

		const stored: IndexedDBStoredItem = {
			channel: key,
			data: dataString,
			metadata,
		};

		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.put(stored);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error("Failed to write to IndexedDB"));
			});

			// Update cache
			const item: StoredItem<T> = { data, metadata };
			this.cache.set(key, item);
		} catch (error) {
			throw new Error(`Failed to set item in IndexedDB: ${error}`);
		}
	}

	async removeItem(channel: string): Promise<void> {
		const key = channel.toLowerCase();
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.delete(key);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error("Failed to delete from IndexedDB"));
			});

			this.cache.delete(key);
		} catch {
			// Error handled silently
		}
	}

	async getItems<T = unknown>(
		channels: string[],
	): Promise<Map<string, StoredItem<T> | null>> {
		// Use parallel transactions for better performance
		const BATCH_SIZE = 20; // IndexedDB can handle more parallel operations
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
		// Use single transaction for batch writes (more efficient)
		const entries = Array.from(items.entries());
		const BATCH_SIZE = 50; // Larger batches for IndexedDB

		for (let i = 0; i < entries.length; i += BATCH_SIZE) {
			const batch = entries.slice(i, i + BATCH_SIZE);

			try {
				const db = await this.getDB();
				const transaction = db.transaction([STORE_NAME], "readwrite");
				const store = transaction.objectStore(STORE_NAME);

				await Promise.all(
					batch.map(
						([channel, data]) =>
							new Promise<void>((resolve, reject) => {
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

								const stored: IndexedDBStoredItem = {
									channel: key,
									data: dataString,
									metadata,
								};

								const request = store.put(stored);
								request.onsuccess = () => {
									const item: StoredItem<T> = { data, metadata };
									this.cache.set(key, item);
									resolve();
								};
								request.onerror = () => reject(new Error("Failed to write batch"));
							}),
					),
				);
			} catch (error) {
				throw new Error(`Failed to set batch in IndexedDB: ${error}`);
			}
		}
	}

	async removeItems(channels: string[]): Promise<void> {
		// Parallel execution with batching
		const BATCH_SIZE = 50;
		for (let i = 0; i < channels.length; i += BATCH_SIZE) {
			const batch = channels.slice(i, i + BATCH_SIZE);
			await Promise.all(batch.map((channel) => this.removeItem(channel)));
		}
	}

	async getAllKeys(): Promise<string[]> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);

			const keys = await new Promise<string[]>((resolve, reject) => {
				const request = store.getAllKeys();
				request.onsuccess = () => resolve(request.result as string[]);
				request.onerror = () => reject(new Error("Failed to get keys"));
			});

			return keys;
		} catch {
			return [];
		}
	}

	async clear(): Promise<void> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error("Failed to clear IndexedDB"));
			});

			this.cache.clear();
		} catch {
			// Error handled silently
		}
	}

	async getSize(): Promise<number> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);

			const size = await new Promise<number>((resolve, reject) => {
				let totalSize = 0;
				const request = store.openCursor();

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						totalSize += cursor.value.metadata.size;
						cursor.continue();
					} else {
						resolve(totalSize);
					}
				};

				request.onerror = () => reject(new Error("Failed to calculate size"));
			});

			return size;
		} catch {
			return 0;
		}
	}

	async has(channel: string): Promise<boolean> {
		const item = await this.getItem(channel);
		return item !== null;
	}
}

