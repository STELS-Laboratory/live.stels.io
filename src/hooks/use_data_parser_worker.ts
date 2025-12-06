/**
 * Hook for using Web Worker data parser
 * Offloads heavy parsing operations from main thread
 */

import { useRef, useCallback, useEffect } from "react";

interface ParseOptions {
	type?: "orderBook" | "ticker" | "accountBalance" | "candles" | "index" | "auto";
	symbol?: string;
}

interface ParseResult<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
}

/**
 * Hook for parsing data using Web Worker
 */
export function useDataParserWorker<T = unknown>(): {
	parse: (data: unknown, options?: ParseOptions) => Promise<T | null>;
	parseBatch: (dataArray: Array<{ channel: string; data: unknown }>) => Promise<Record<string, T>>;
} {
	const workerRef = useRef<Worker | null>(null);
	const pendingRequestsRef = useRef<Map<string, { resolve: (value: T | null) => void; reject: (error: Error) => void }>>(new Map());

	// Initialize worker
	useEffect(() => {
		try {
			// For Vite, use the worker file directly with ?worker suffix
			// This requires proper Vite configuration
			workerRef.current = new Worker(
				new URL("../workers/data-parser.worker.ts", import.meta.url),
				{ type: "module" },
			);

			workerRef.current.onmessage = (event: MessageEvent) => {
				const response = event.data as {
					id: string;
					type: "success" | "error";
					result?: unknown;
					error?: string;
				};

				const pending = pendingRequestsRef.current.get(response.id);
				if (pending) {
					pendingRequestsRef.current.delete(response.id);

					if (response.type === "success") {
						pending.resolve(response.result as T);
					} else {
						pending.reject(new Error(response.error || "Unknown error"));
					}
				}
			};

			workerRef.current.onerror = (error) => {
				console.error("[DataParserWorker] Worker error:", error);
			};
		} catch (error) {
			console.error("[DataParserWorker] Failed to create worker:", error);
		}

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
			pendingRequestsRef.current.clear();
		};
	}, []);

	/**
	 * Parse single data item
	 */
	const parse = useCallback(
		async (data: unknown, options?: ParseOptions): Promise<T | null> => {
			if (!workerRef.current) {
				// Fallback to synchronous parsing if worker not available
				return data as T;
			}

			const id = `${Date.now()}-${Math.random()}`;

			return new Promise<T | null>((resolve, reject) => {
				pendingRequestsRef.current.set(id, { resolve, reject });

				const message = {
					id,
					type: "parse" as const,
					data,
					options,
				};

				try {
					workerRef.current!.postMessage(message);
				} catch (error) {
					pendingRequestsRef.current.delete(id);
					reject(error instanceof Error ? error : new Error("Failed to send message to worker"));
				}
			});
		},
		[],
	);

	/**
	 * Parse batch of data items
	 */
	const parseBatch = useCallback(
		async (dataArray: Array<{ channel: string; data: unknown }>): Promise<Record<string, T>> => {
			if (!workerRef.current) {
				// Fallback to synchronous parsing
				const results: Record<string, T> = {};
				for (const item of dataArray) {
					results[item.channel] = item.data as T;
				}
				return results;
			}

			const id = `${Date.now()}-${Math.random()}`;

			return new Promise<Record<string, T>>((resolve, reject) => {
				pendingRequestsRef.current.set(id, {
					resolve: (value) => resolve((value as Record<string, T>) ?? {}),
					reject,
				});

				const message = {
					id,
					type: "parseBatch" as const,
					channels: dataArray.map((item) => item.channel),
					dataArray: dataArray.map((item) => item.data),
					options: undefined,
				};

				try {
					workerRef.current!.postMessage(message);
				} catch (error) {
					pendingRequestsRef.current.delete(id);
					reject(error instanceof Error ? error : new Error("Failed to send message to worker"));
				}
			});
		},
		[],
	);

	return { parse, parseBatch };
}

