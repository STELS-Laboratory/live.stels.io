/**
 * Storage System Usage Examples
 * Demonstrates various use cases and best practices
 */

import { getStorageManager } from "./storage-manager";
import { getWebSocketStorageBatcher } from "./web-socket-integration";

/**
 * Example 1: Basic usage with automatic provider selection
 */
export async function exampleBasicUsage(): Promise<void> {
	const storage = getStorageManager();

	// Save data - automatically selects best provider
	await storage.setItem("user.settings", {
		theme: "dark",
		language: "en",
	});

	// Retrieve data
	const item = await storage.getItem("user.settings");
	if (item) {
		console.log("Settings:", item.data);
	}
}

/**
 * Example 2: Parallel operations for multiple channels
 */
export async function exampleParallelOperations(): Promise<void> {
	const storage = getStorageManager();

	// Prepare multiple data items
	const dataMap = new Map([
		["channel1", { value: 1 }],
		["channel2", { value: 2 }],
		["channel3", { value: 3 }],
		["channel4", { value: 4 }],
		["channel5", { value: 5 }],
	]);

	// Save all in parallel
	await storage.setItems(dataMap, {
		ttl: 3600000, // 1 hour
		priority: "balance",
	});

	// Read all in parallel
	const channels = Array.from(dataMap.keys());
	const results = await storage.getItems(channels);

	results.forEach((item, channel) => {
		if (item) {
			console.log(`${channel}:`, item.data);
		}
	});
}

/**
 * Example 3: Provider switching based on data size
 */
export async function exampleProviderSwitching(): Promise<void> {
	const storage = getStorageManager();

	// Small data - will use memory or sessionStorage
	await storage.setItem("small.data", { value: "small" }, {
		priority: "performance",
	});

	// Large data - will use IndexedDB
	const largeData = new Array(10000).fill({ data: "large" });
	await storage.setItem("large.data", largeData, {
		priority: "persistence",
	});

	// Manually switch provider
	storage.switchProvider("indexeddb");
	const item = await storage.getItem("large.data");
	console.log("Large data loaded:", item?.data);
}

/**
 * Example 4: WebSocket integration with batching
 */
export async function exampleWebSocketIntegration(): Promise<void> {
	const batcher = getWebSocketStorageBatcher();

	// Simulate WebSocket messages
	for (let i = 0; i < 100; i++) {
		batcher.addMessage(`channel.${i}`, {
			data: `value-${i}`,
			timestamp: Date.now(),
		});
	}

	// Flush all pending messages
	await batcher.flush();

	console.log("All messages processed");
}

/**
 * Example 5: TTL and automatic cleanup
 */
export async function exampleTTL(): Promise<void> {
	const storage = getStorageManager();

	// Save with TTL (1 hour)
	await storage.setItem("temporary.data", { value: "temp" }, {
		ttl: 3600000, // 1 hour
	});

	// Data will be automatically removed after TTL expires
	const item = await storage.getItem("temporary.data");
	if (item) {
		console.log("Data still valid:", item.data);
	}
}

/**
 * Example 6: Batch reading with error handling
 */
export async function exampleBatchReading(): Promise<void> {
	const storage = getStorageManager();

	const channels = [
		"channel1",
		"channel2",
		"channel3",
		"nonexistent",
	];

	try {
		const results = await storage.getItems(channels);

		results.forEach((item, channel) => {
			if (item) {
				console.log(`${channel}:`, item.data);
			} else {
				console.log(`${channel}: not found`);
			}
		});
	} catch (error) {
		console.error("Error reading batch:", error);
	}
}

/**
 * Example 7: Performance comparison
 */
export async function examplePerformanceComparison(): Promise<void> {
	const storage = getStorageManager();

	const testData = new Map(
		Array.from({ length: 100 }, (_, i) => [
			`test.${i}`,
			{ value: i, timestamp: Date.now() },
		]),
	);

	// Test with different providers
	const providers: Array<"memory" | "session" | "indexeddb"> = [
		"memory",
		"session",
		"indexeddb",
	];

	for (const provider of providers) {
		storage.switchProvider(provider);

		const start = performance.now();
		await storage.setItems(testData);
		const setTime = performance.now() - start;

		const readStart = performance.now();
		await storage.getItems(Array.from(testData.keys()));
		const readTime = performance.now() - readStart;

		console.log(`${provider}:`, {
			setTime: `${setTime.toFixed(2)}ms`,
			readTime: `${readTime.toFixed(2)}ms`,
		});
	}
}

/**
 * Example 8: Hybrid provider automatic selection
 */
export async function exampleHybridProvider(): Promise<void> {
	const storage = getStorageManager();

	// Switch to hybrid for automatic optimization
	storage.switchProvider("hybrid");

	// Small data - will be cached in memory
	await storage.setItem("small", { value: "small" });

	// Medium data - will use sessionStorage
	const mediumData = new Array(100).fill({ data: "medium" });
	await storage.setItem("medium", mediumData);

	// Large data - will use IndexedDB
	const largeData = new Array(10000).fill({ data: "large" });
	await storage.setItem("large", largeData);

	// All data accessible through same API
	const [small, medium, large] = await Promise.all([
		storage.getItem("small"),
		storage.getItem("medium"),
		storage.getItem("large"),
	]);

	console.log("Small:", small?.data);
	console.log("Medium:", medium?.data);
	console.log("Large:", large?.data);
}

