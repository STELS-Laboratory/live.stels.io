/**
 * Compatibility Adapter
 * Provides backward compatibility with existing SessionStorageManager API
 */

import { getStorageManager } from "./storage-manager";
import type { StorageType } from "./providers/types";

/**
 * Compatibility adapter for existing code
 * Wraps StorageManager to match SessionStorageManager API
 */
export class CompatibilityStorageAdapter {
	private storageManager = getStorageManager();
	private providerType?: StorageType;

	constructor(providerType?: StorageType) {
		this.providerType = providerType;
	}

	/**
	 * Get data (compatible with SessionStorageManager.getData)
	 */
	public getData(
		channel: string,
		skipCache = false,
	): Record<string, unknown> | null {
		// Synchronous version for compatibility
		// Note: This is less efficient, but maintains compatibility
		try {
			const stored = sessionStorage.getItem(channel) ||
				sessionStorage.getItem(channel.toLowerCase());

			if (!stored) {
				return null;
			}

			const parsed = JSON.parse(stored) as {
				data?: unknown;
				raw?: unknown;
			};

			// Support both new format (data) and old format (raw)
			return (parsed.data || parsed.raw || parsed) as Record<string, unknown>;
		} catch {
			return null;
		}
	}

	/**
	 * Get data async (recommended)
	 */
	public async getDataAsync(
		channel: string,
	): Promise<Record<string, unknown> | null> {
		const item = await this.storageManager.getItem(channel, this.providerType);
		if (!item) {
			return null;
		}

		// Support both new format and old format
		const data = item.data as Record<string, unknown>;
		return data;
	}

	/**
	 * Subscribe to channel updates (compatible with SessionStorageManager.subscribe)
	 */
	public subscribe(
		channel: string,
		callback: (data: Record<string, unknown>) => void,
	): () => void {
		let isSubscribed = true;
		let lastData: Record<string, unknown> | null = null;

		// Polling-based subscription for compatibility
		const pollInterval = setInterval(async () => {
			if (!isSubscribed) {
				clearInterval(pollInterval);
				return;
			}

			const data = await this.getDataAsync(channel);
			if (data && JSON.stringify(data) !== JSON.stringify(lastData)) {
				lastData = data;
				callback(data);
			}
		}, 1000); // Poll every second

		// Initial load
		this.getDataAsync(channel).then((data) => {
			if (data && isSubscribed) {
				lastData = data;
				callback(data);
			}
		});

		// Return unsubscribe function
		return () => {
			isSubscribed = false;
			clearInterval(pollInterval);
		};
	}

	/**
	 * Invalidate cache (compatible with SessionStorageManager.invalidateCache)
	 */
	public invalidateCache(channel: string): void {
		// For compatibility, we'll trigger a re-read
		// In the new system, cache is managed automatically
	}

	/**
	 * Clear cache (compatible with SessionStorageManager.clearCache)
	 */
	public clearCache(): void {
		// Cache is managed automatically in the new system
	}

	/**
	 * Set item (new async API)
	 */
	public async setItem(
		channel: string,
		data: unknown,
		options?: {
			ttl?: number;
			compress?: boolean;
			priority?: "performance" | "persistence" | "balance";
		},
	): Promise<void> {
		await this.storageManager.setItem(channel, data, options, this.providerType);
	}

	/**
	 * Get item (new async API)
	 */
	public async getItem(
		channel: string,
	): Promise<Record<string, unknown> | null> {
		return this.getDataAsync(channel);
	}

	/**
	 * Remove item (new async API)
	 */
	public async removeItem(channel: string): Promise<void> {
		await this.storageManager.removeItem(channel, this.providerType);
	}

	/**
	 * Get multiple items in parallel
	 */
	public async getItems(
		channels: string[],
	): Promise<Map<string, Record<string, unknown> | null>> {
		const items = await this.storageManager.getItems(channels, this.providerType);
		const results = new Map<string, Record<string, unknown> | null>();

		for (const [channel, item] of items.entries()) {
			results.set(
				channel,
				item ? (item.data as Record<string, unknown>) : null,
			);
		}

		return results;
	}

	/**
	 * Set multiple items in parallel
	 */
	public async setItems(
		items: Map<string, unknown>,
		options?: {
			ttl?: number;
			compress?: boolean;
			priority?: "performance" | "persistence" | "balance";
		},
	): Promise<void> {
		await this.storageManager.setItems(items, options, this.providerType);
	}
}

// Export singleton instance
let adapterInstance: CompatibilityStorageAdapter | null = null;

export const getCompatibilityStorageAdapter = (
	providerType?: StorageType,
): CompatibilityStorageAdapter => {
	if (!adapterInstance) {
		adapterInstance = new CompatibilityStorageAdapter(providerType);
	}
	return adapterInstance;
};

// Export for backward compatibility with existing code
export const getSessionStorageManager = (): CompatibilityStorageAdapter => {
	return getCompatibilityStorageAdapter();
};

