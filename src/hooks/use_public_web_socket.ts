import { useEffect, useRef, useCallback, useState } from "react";
import { useAppStore } from "@/stores";
import { generateDataHash } from "@/lib/utils";
import type { PublicWebSocketConfig, MessageBatch } from "@/types/hooks/types";

let publicMessageBatch: MessageBatch = {};
let publicBatchScheduled = false;

/**
 * Schedule message batch processing
 */
function schedulePublicMessageBatch(): void {
	if (publicBatchScheduled) {
		return;
	}
	
	publicBatchScheduled = true;
	
	requestAnimationFrame(() => {
		const batchToProcess = publicMessageBatch;
		const batchSize = Object.keys(batchToProcess).length;
		
		publicMessageBatch = {};
		publicBatchScheduled = false;
		
		if (batchSize > 0) {
			const entries = Object.entries(batchToProcess);
			const CHUNK_SIZE = 10;
			
			let index = 0;
			const processChunk = (): void => {
				const end = Math.min(index + CHUNK_SIZE, entries.length);
				for (let i = index; i < end; i++) {
					const [channel, data] = entries[i];
					try {
						sessionStorage.setItem(channel, data);
					} catch {
						// Error handled silently
					}
				}
				index = end;
				
				if (index < entries.length) {
					requestAnimationFrame(processChunk);
				}
			};
			
			processChunk();
		}
	});
}

/**
 * Flush pending messages immediately
 */
function flushPublicMessageBatch(): void {
	if (Object.keys(publicMessageBatch).length === 0) {
		return;
	}

	Object.entries(publicMessageBatch).forEach(([channel, data]) => {
		try {
			sessionStorage.setItem(channel, data);
		} catch {
			// Error handled silently
		}
	});
	
	publicMessageBatch = {};
	publicBatchScheduled = false;
}

/**
 * Hook for managing public WebSocket connection
 * Connects to public server without authentication
 * Saves all data to sessionStorage like authenticated connection
 */
export function usePublicWebSocket(
	config: PublicWebSocketConfig | null,
	enabled: boolean = true,
): {
	isConnected: boolean;
	error: string | null;
	close: () => void;
} {
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef<number>(0);
	const maxReconnectAttempts = 5;
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isEnabledRef = useRef(enabled);

	// Update enabled ref
	useEffect(() => {
		isEnabledRef.current = enabled;
	}, [enabled]);

	const closeConnection = useCallback((): void => {
		// Flush any pending messages
		flushPublicMessageBatch();

		// Clear reconnect timeout
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		// Close WebSocket
		if (wsRef.current) {
			wsRef.current.close(1000, "Public connection closed");
			wsRef.current = null;
		}

		setIsConnected(false);
		setError(null);
		reconnectAttemptsRef.current = 0;
	}, []);

	// Store config in ref to avoid recreating connection on config changes
	const configRef = useRef(config);
	useEffect(() => {
		configRef.current = config;
	}, [config]);

	const connect = useCallback((): void => {
		const currentConfig = configRef.current;
		if (!currentConfig || !isEnabledRef.current) {
			return;
		}

		// Don't connect if already connected or connecting
		if (wsRef.current) {
			const state = wsRef.current.readyState;
			if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
				return;
			}
			// Close existing connection if it exists but is not open
			if (state !== WebSocket.CLOSED) {
				wsRef.current.close(1000, "Reconnecting");
			}
		}

		try {
			// Connect to public WebSocket without session parameter
			const wsUrl = currentConfig.socket;
			const protocols = currentConfig.protocols || ["webfix"];
			const ws = new WebSocket(wsUrl, protocols);

			ws.onopen = (): void => {
				// Clear any previous errors
				const appStore = useAppStore.getState();
				appStore.setSyncError(null);
				setError(null);
				setIsConnected(true);
				reconnectAttemptsRef.current = 0;

				// Subscribe to public channels
				ws.send(JSON.stringify({
					webfix: "testnet",
					method: "subscribe",
					channel: "sonar",
				}));
				ws.send(JSON.stringify({
					webfix: "testnet",
					method: "subscribe",
					channel: "runtime",
				}));
			};

			ws.onmessage = (event: MessageEvent): void => {
				// Use requestAnimationFrame to batch message processing
				requestAnimationFrame(() => {
					try {
						const json = JSON.parse(event.data);

						if (json.value) {
							// Add message to batch for sessionStorage
							publicMessageBatch[json.value.channel] = JSON.stringify(json.value);
							schedulePublicMessageBatch();

							// Notify sync system about significant data changes
							if (json.value.type === "sync" || json.value.important) {
								const appStore = useAppStore.getState();
								const dataVersion = generateDataHash(json.value);
								appStore.markDataAsUpdated(dataVersion);
							}
						}
					} catch {
						// Error handled silently
					}
				});
			};

			ws.onclose = (event: CloseEvent): void => {
				setIsConnected(false);

				// Don't reconnect if disabled or manually closed
				if (!isEnabledRef.current || event.code === 1000) {
					return;
				}

				// Attempt reconnection with exponential backoff
				if (reconnectAttemptsRef.current < maxReconnectAttempts) {
					reconnectAttemptsRef.current += 1;
					const delay = Math.min(1500 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
					
					reconnectTimeoutRef.current = setTimeout(() => {
						if (isEnabledRef.current) {
							connect();
						}
					}, delay);
				} else {
					setError("Failed to connect to public server");
				}
			};

			ws.onerror = (): void => {
				setError("WebSocket connection error");
				setIsConnected(false);
			};

			wsRef.current = ws;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create WebSocket connection");
			setIsConnected(false);
		}
	}, []); // No dependencies - uses ref for config

	// Connect on mount or when enabled changes
	// Use ref for config to avoid recreating connection
	useEffect(() => {
		// Only proceed if config is available
		if (!configRef.current) {
			return;
		}

		if (enabled) {
			// Only connect if not already connected
			if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
				connect();
			}
		} else {
			// Close connection when disabled
			if (wsRef.current) {
				flushPublicMessageBatch();
				if (reconnectTimeoutRef.current) {
					clearTimeout(reconnectTimeoutRef.current);
					reconnectTimeoutRef.current = null;
				}
				wsRef.current.close(1000, "Public connection disabled");
				wsRef.current = null;
				setIsConnected(false);
			}
		}

		return () => {
			// Cleanup on unmount
			flushPublicMessageBatch();
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
			if (wsRef.current) {
				wsRef.current.close(1000, "Component unmounted");
				wsRef.current = null;
			}
		};
	}, [enabled, connect]); // Only depend on enabled and connect (which is stable)

	return {
		isConnected,
		error,
		close: closeConnection,
	};
}

