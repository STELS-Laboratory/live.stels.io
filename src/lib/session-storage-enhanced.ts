/**
 * Enhanced Session Storage Manager
 * Handles large data with IndexedDB fallback, compression, and TTL
 */

import { getSessionStorageManager } from "./gui/ui";

// Constants
const SESSION_STORAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB (typical limit)
const INDEXEDDB_DB_NAME = "session-storage-large";
const INDEXEDDB_VERSION = 1;
const INDEXEDDB_STORE_NAME = "data";
const TTL_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface StoredData {
	channel: string;
	data: string;
	timestamp: number;
	ttl?: number;
	compressed?: boolean;
	size: number;
}

/**
 * Check if data size exceeds sessionStorage limit
 */
function getDataSize(data: string): number {
	return new Blob([data]).size;
}

/**
 * Compress data using TextEncoder/TextDecoder (simple implementation)
 * For better compression, consider using pako or similar library
 */
async function compressData(data: string): Promise<string> {
	try {
		// Simple compression: remove whitespace and use shorter format
		// For production, consider using a proper compression library
		const encoder = new TextEncoder();
		const encoded = encoder.encode(data);
		
		// If data is large, use compression API if available
		if (typeof CompressionStream !== "undefined" && encoded.length > 1024) {
			const stream = new CompressionStream("gzip");
			const writer = stream.writable.getWriter();
			writer.write(encoded);
			writer.close();
			
			const compressed = await new Response(stream.readable).arrayBuffer();
			return btoa(String.fromCharCode(...new Uint8Array(compressed)));
		}
		
		return data;
	} catch {
		return data;
	}
}

/**
 * Decompress data
 */
async function decompressData(data: string, compressed: boolean): Promise<string> {
	if (!compressed) return data;
	
	try {
		if (typeof DecompressionStream !== "undefined") {
			const binaryString = atob(data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			
			const stream = new DecompressionStream("gzip");
			const writer = stream.writable.getWriter();
			writer.write(bytes);
			writer.close();
			
			const decompressed = await new Response(stream.readable).arrayBuffer();
			const decoder = new TextDecoder();
			return decoder.decode(decompressed);
		}
		
		return data;
	} catch {
		return data;
	}
}

/**
 * Open IndexedDB database for large data storage
 */
function openIndexedDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (!("indexedDB" in window)) {
			reject(new Error("IndexedDB not supported"));
			return;
		}

		const request = indexedDB.open(INDEXEDDB_DB_NAME, INDEXEDDB_VERSION);

		request.onerror = () => {
			reject(new Error("Failed to open IndexedDB"));
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			
			if (!db.objectStoreNames.contains(INDEXEDDB_STORE_NAME)) {
				const store = db.createObjectStore(INDEXEDDB_STORE_NAME, { keyPath: "channel" });
				store.createIndex("timestamp", "timestamp", { unique: false });
				store.createIndex("ttl", "ttl", { unique: false });
			}
		};
	});
}

/**
 * Enhanced Session Storage Manager with IndexedDB fallback
 */
class EnhancedSessionStorageManager {
	private static instance: EnhancedSessionStorageManager;
	private indexedDBCache: Map<string, string> = new Map();
	private ttlCleanupInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.startTTLCleanup();
	}

	public static getInstance(): EnhancedSessionStorageManager {
		if (!EnhancedSessionStorageManager.instance) {
			EnhancedSessionStorageManager.instance = new EnhancedSessionStorageManager();
		}
		return EnhancedSessionStorageManager.instance;
	}

	/**
	 * Start TTL cleanup interval
	 */
	private startTTLCleanup(): void {
		if (this.ttlCleanupInterval) {
			return;
		}

		this.ttlCleanupInterval = setInterval(() => {
			this.cleanupExpiredData().catch(() => {
				// Error handled silently
			});
		}, TTL_CLEANUP_INTERVAL);
	}

	/**
	 * Stop TTL cleanup interval
	 */
	private stopTTLCleanup(): void {
		if (this.ttlCleanupInterval) {
			clearInterval(this.ttlCleanupInterval);
			this.ttlCleanupInterval = null;
		}
	}

	/**
	 * Save data to storage (sessionStorage or IndexedDB)
	 */
	public async setItem(
		channel: string,
		data: unknown,
		options?: {
			ttl?: number;
			compress?: boolean;
		},
	): Promise<void> {
		const dataString = JSON.stringify(data);
		const dataSize = getDataSize(dataString);
		const ttl = options?.ttl ?? DEFAULT_TTL;
		const shouldCompress = options?.compress ?? dataSize > 1024; // Compress if > 1KB

		let finalData = dataString;
		let compressed = false;

		// Compress if needed
		if (shouldCompress) {
			try {
				finalData = await compressData(dataString);
				compressed = true;
			} catch {
				// Fallback to uncompressed
			}
		}

		const finalSize = getDataSize(finalData);
		const timestamp = Date.now();

		// Check if data exceeds sessionStorage limit
		if (finalSize > SESSION_STORAGE_SIZE_LIMIT || this.wouldExceedLimit(finalSize)) {
			// Use IndexedDB for large data
			await this.saveToIndexedDB(channel, finalData, timestamp, ttl, compressed);
		} else {
			// Use sessionStorage for small data
			try {
				const stored: StoredData = {
					channel,
					data: finalData,
					timestamp,
					ttl,
					compressed,
					size: finalSize,
				};
				sessionStorage.setItem(channel.toLowerCase(), JSON.stringify(stored));
			} catch (error) {
				// If sessionStorage fails, try IndexedDB
				if ((error as Error).name === "QuotaExceededError") {
					await this.saveToIndexedDB(channel, finalData, timestamp, ttl, compressed);
				} else {
					throw error;
				}
			}
		}
	}

	/**
	 * Check if adding data would exceed sessionStorage limit
	 */
	private wouldExceedLimit(newSize: number): boolean {
		try {
			let totalSize = 0;
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key) {
					const value = sessionStorage.getItem(key);
					if (value) {
						totalSize += getDataSize(value);
					}
				}
			}
			return totalSize + newSize > SESSION_STORAGE_SIZE_LIMIT;
		} catch {
			return false;
		}
	}

	/**
	 * Save data to IndexedDB
	 */
	private async saveToIndexedDB(
		channel: string,
		data: string,
		timestamp: number,
		ttl: number,
		compressed: boolean,
	): Promise<void> {
		try {
			const db = await openIndexedDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], "readwrite");
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

			const stored: StoredData = {
				channel: channel.toLowerCase(),
				data,
				timestamp,
				ttl,
				compressed,
				size: getDataSize(data),
			};

			await new Promise<void>((resolve, reject) => {
				const request = store.put(stored);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error("Failed to save to IndexedDB"));
			});

			// Update cache
			this.indexedDBCache.set(channel.toLowerCase(), data);
			db.close();
		} catch (error) {
			console.error("[EnhancedSessionStorage] Failed to save to IndexedDB:", error);
			throw error;
		}
	}

	/**
	 * Get data from storage (sessionStorage or IndexedDB)
	 */
	public async getItem(channel: string): Promise<Record<string, unknown> | null> {
		const channelLower = channel.toLowerCase();

		// Try sessionStorage first
		try {
			const stored = sessionStorage.getItem(channelLower);
			if (stored) {
				const parsed = JSON.parse(stored) as StoredData;
				
				// Check TTL
				if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
					// Data expired, remove it
					sessionStorage.removeItem(channelLower);
					return null;
				}

				// Decompress if needed
				const data = await decompressData(parsed.data, parsed.compressed ?? false);
				return JSON.parse(data) as Record<string, unknown>;
			}
		} catch {
			// Fallback to IndexedDB
		}

		// Try IndexedDB
		try {
			// Check cache first
			if (this.indexedDBCache.has(channelLower)) {
				const cached = this.indexedDBCache.get(channelLower)!;
				return JSON.parse(cached) as Record<string, unknown>;
			}

			const db = await openIndexedDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], "readonly");
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			const request = store.get(channelLower);

			const stored = await new Promise<StoredData | null>((resolve, reject) => {
				request.onsuccess = () => resolve(request.result ?? null);
				request.onerror = () => reject(new Error("Failed to read from IndexedDB"));
			});

			db.close();

			if (!stored) {
				return null;
			}

			// Check TTL
			if (stored.ttl && Date.now() - stored.timestamp > stored.ttl) {
				// Data expired, remove it
				await this.removeItem(channel);
				return null;
			}

			// Decompress if needed
			const data = await decompressData(stored.data, stored.compressed ?? false);
			const parsed = JSON.parse(data) as Record<string, unknown>;
			
			// Update cache
			this.indexedDBCache.set(channelLower, data);
			
			return parsed;
		} catch {
			return null;
		}
	}

	/**
	 * Remove item from storage
	 */
	public async removeItem(channel: string): Promise<void> {
		const channelLower = channel.toLowerCase();

		// Remove from sessionStorage
		try {
			sessionStorage.removeItem(channelLower);
		} catch {
			// Error handled silently
		}

		// Remove from IndexedDB
		try {
			const db = await openIndexedDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], "readwrite");
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			await new Promise<void>((resolve, reject) => {
				const request = store.delete(channelLower);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error("Failed to delete from IndexedDB"));
			});
			db.close();
		} catch {
			// Error handled silently
		}

		// Remove from cache
		this.indexedDBCache.delete(channelLower);
	}

	/**
	 * Cleanup expired data
	 */
	public async cleanupExpiredData(): Promise<void> {
		const now = Date.now();

		// Cleanup sessionStorage
		try {
			const keysToRemove: string[] = [];
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (!key) continue;

				try {
					const stored = sessionStorage.getItem(key);
					if (stored) {
						const parsed = JSON.parse(stored) as StoredData;
						if (parsed.ttl && now - parsed.timestamp > parsed.ttl) {
							keysToRemove.push(key);
						}
					}
				} catch {
					// Skip invalid entries
				}
			}

			keysToRemove.forEach((key) => {
				sessionStorage.removeItem(key);
			});
		} catch {
			// Error handled silently
		}

		// Cleanup IndexedDB
		try {
			const db = await openIndexedDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], "readwrite");
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			const index = store.index("ttl");
			const request = index.openCursor();

			await new Promise<void>((resolve) => {
				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						const stored = cursor.value as StoredData;
						if (stored.ttl && now - stored.timestamp > stored.ttl) {
							cursor.delete();
						}
						cursor.continue();
					} else {
						resolve();
					}
				};
				request.onerror = () => resolve();
			});

			db.close();
		} catch {
			// Error handled silently
		}

		// Cleanup cache
		this.indexedDBCache.clear();
	}

	/**
	 * Get all channels from both storages
	 */
	public async getAllChannels(): Promise<string[]> {
		const channels = new Set<string>();

		// Get from sessionStorage
		try {
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key) {
					channels.add(key);
				}
			}
		} catch {
			// Error handled silently
		}

		// Get from IndexedDB
		try {
			const db = await openIndexedDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], "readonly");
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			const request = store.openCursor();

			await new Promise<void>((resolve) => {
				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						channels.add(cursor.value.channel);
						cursor.continue();
					} else {
						resolve();
					}
				};
				request.onerror = () => resolve();
			});

			db.close();
		} catch {
			// Error handled silently
		}

		return Array.from(channels);
	}

	/**
	 * Clear all data
	 */
	public async clear(): Promise<void> {
		// Clear sessionStorage
		try {
			sessionStorage.clear();
		} catch {
			// Error handled silently
		}

		// Clear IndexedDB
		try {
			const db = await openIndexedDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], "readwrite");
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			await new Promise<void>((resolve) => {
				const request = store.clear();
				request.onsuccess = () => resolve();
				request.onerror = () => resolve();
			});
			db.close();
		} catch {
			// Error handled silently
		}

		// Clear cache
		this.indexedDBCache.clear();
	}

	/**
	 * Destroy instance and cleanup
	 */
	public destroy(): void {
		this.stopTTLCleanup();
		this.indexedDBCache.clear();
	}
}

// Export singleton instance
export const getEnhancedSessionStorage = (): EnhancedSessionStorageManager => {
	return EnhancedSessionStorageManager.getInstance();
};

// Export for backward compatibility
export { EnhancedSessionStorageManager };

