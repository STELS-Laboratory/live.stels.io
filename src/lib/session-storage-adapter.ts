/**
 * Session Storage Adapter
 * Provides unified interface for both standard and enhanced session storage
 * Automatically uses enhanced storage for large data
 */

import { getEnhancedSessionStorage } from "./session-storage-enhanced";
import { getSessionStorageManager } from "./gui/ui";

const LARGE_DATA_THRESHOLD = 100 * 1024; // 100KB

/**
 * Unified session storage interface
 * Automatically chooses between standard and enhanced storage
 */
export class SessionStorageAdapter {
	private enhancedStorage = getEnhancedSessionStorage();
	private standardStorage = getSessionStorageManager();

	/**
	 * Set item in storage
	 */
	public async setItem(
		channel: string,
		data: unknown,
		options?: {
			ttl?: number;
			compress?: boolean;
			forceEnhanced?: boolean;
		},
	): Promise<void> {
		const dataString = JSON.stringify(data);
		const dataSize = new Blob([dataString]).size;

		// Use enhanced storage for large data or if forced
		if (options?.forceEnhanced || dataSize > LARGE_DATA_THRESHOLD) {
			await this.enhancedStorage.setItem(channel, data, {
				ttl: options?.ttl,
				compress: options?.compress,
			});
		} else {
			// Use standard storage for small data
			try {
				const stored = JSON.stringify(data);
				sessionStorage.setItem(channel.toLowerCase(), stored);
			} catch (error) {
				// If standard storage fails, fallback to enhanced
				if ((error as Error).name === "QuotaExceededError") {
					await this.enhancedStorage.setItem(channel, data, {
						ttl: options?.ttl,
						compress: options?.compress,
					});
				} else {
					throw error;
				}
			}
		}
	}

	/**
	 * Get item from storage
	 */
	public async getItem(channel: string): Promise<Record<string, unknown> | null> {
		// Try standard storage first
		const standardData = this.standardStorage.getData(channel, true);
		if (standardData) {
			return standardData;
		}

		// Fallback to enhanced storage
		return await this.enhancedStorage.getItem(channel);
	}

	/**
	 * Remove item from storage
	 */
	public async removeItem(channel: string): Promise<void> {
		// Remove from both storages
		try {
			sessionStorage.removeItem(channel.toLowerCase());
		} catch {
			// Error handled silently
		}

		await this.enhancedStorage.removeItem(channel);
	}

	/**
	 * Get all channels
	 */
	public async getAllChannels(): Promise<string[]> {
		const standardChannels: string[] = [];
		try {
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key) {
					standardChannels.push(key);
				}
			}
		} catch {
			// Error handled silently
		}

		const enhancedChannels = await this.enhancedStorage.getAllChannels();

		// Combine and deduplicate
		const allChannels = new Set([...standardChannels, ...enhancedChannels]);
		return Array.from(allChannels);
	}

	/**
	 * Clear all data
	 */
	public async clear(): Promise<void> {
		try {
			sessionStorage.clear();
		} catch {
			// Error handled silently
		}

		await this.enhancedStorage.clear();
	}
}

// Export singleton instance
let adapterInstance: SessionStorageAdapter | null = null;

export const getSessionStorageAdapter = (): SessionStorageAdapter => {
	if (!adapterInstance) {
		adapterInstance = new SessionStorageAdapter();
	}
	return adapterInstance;
};

