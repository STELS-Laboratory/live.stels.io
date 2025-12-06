/**
 * WebSocket Integration for Storage System
 * Optimized batch processing with parallel operations
 */

import { getStorageManager } from "./storage-manager";

export class WebSocketStorageBatcher {
	private storage = getStorageManager();
	private messageBatch: Map<string, unknown> = new Map();
	private batchScheduled = false;
	private readonly BATCH_SIZE = 50; // Process 50 items per batch

	/**
	 * Add message to batch
	 */
	public addMessage(channel: string, data: unknown): void {
		this.messageBatch.set(channel.toLowerCase(), data);
		this.scheduleBatch();
	}

	/**
	 * Schedule batch processing
	 */
	private scheduleBatch(): void {
		if (this.batchScheduled) {
			return;
		}

		this.batchScheduled = true;

		// Use requestAnimationFrame for non-blocking processing
		requestAnimationFrame(() => {
			this.processBatch();
		});
	}

	/**
	 * Process batch with parallel operations
	 */
	private async processBatch(): Promise<void> {
		if (this.messageBatch.size === 0) {
			this.batchScheduled = false;
			return;
		}

		// Create batch to process
		const batchToProcess = new Map(this.messageBatch);
		this.messageBatch.clear();
		this.batchScheduled = false;

		// Process in parallel batches
		const entries = Array.from(batchToProcess.entries());
		const batches: Array<Map<string, unknown>> = [];

		for (let i = 0; i < entries.length; i += this.BATCH_SIZE) {
			const batch = entries.slice(i, i + this.BATCH_SIZE);
			batches.push(new Map(batch));
		}

		// Process all batches in parallel
		await Promise.all(
			batches.map((batch) =>
				this.storage.setItems(batch, {
					priority: "balance",
					ttl: 24 * 60 * 60 * 1000, // 24 hours
				}),
			),
		);

		// If more messages accumulated, schedule next batch
		if (this.messageBatch.size > 0) {
			this.scheduleBatch();
		}
	}

	/**
	 * Flush all pending messages immediately
	 */
	public async flush(): Promise<void> {
		if (this.messageBatch.size === 0) {
			return;
		}

		const batchToProcess = new Map(this.messageBatch);
		this.messageBatch.clear();
		this.batchScheduled = false;

		await this.storage.setItems(batchToProcess, {
			priority: "balance",
			ttl: 24 * 60 * 60 * 1000,
		});
	}

	/**
	 * Get batch size
	 */
	public getBatchSize(): number {
		return this.messageBatch.size;
	}

	/**
	 * Clear batch
	 */
	public clear(): void {
		this.messageBatch.clear();
		this.batchScheduled = false;
	}
}

// Export singleton instance
let batcherInstance: WebSocketStorageBatcher | null = null;

export const getWebSocketStorageBatcher = (): WebSocketStorageBatcher => {
	if (!batcherInstance) {
		batcherInstance = new WebSocketStorageBatcher();
	}
	return batcherInstance;
};

