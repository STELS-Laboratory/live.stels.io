import {create} from "zustand";
import {useAppStore} from "@/stores";
import {useAuthStore} from "@/stores/modules/auth.store";
import {generateDataHash} from "@/lib/utils";
import type { WebSocketInfo, SessionData, WebSocketConfig, WebSocketState, MessageBatch } from "@/types/hooks/types";

function createWebSocket(
	info: WebSocketInfo,
	onMessage: (event: MessageEvent) => void,
	onReconnect: () => void,
	onError: () => void,
	onSessionExpired: () => void
): WebSocket | null {
	const localStoragePrivateStore = localStorage.getItem('private-store');
	let session: string | null = null;
	
	if (localStoragePrivateStore) {
		try {
			const storageJson: SessionData = JSON.parse(localStoragePrivateStore);
			session = storageJson.raw?.session || null;
		} catch {

			return null;
		}
	}
	
	if (!session) {

		// Trigger session expired handler if no session found
		setTimeout(() => {
			onSessionExpired();
		}, 1000);
		return null;
	}
	
	const wsUrl = `${info.connector.socket}?session=${session}`;
	const protocols = info.connector.protocols || [];
	const ws = new WebSocket(wsUrl, protocols);
	
	ws.onopen = () => {

		// Clear any previous sync errors when connection is restored
		const appStore = useAppStore.getState();
		appStore.setSyncError(null);
		
		ws.send(JSON.stringify({
			webfix: "testnet",
			method: "subscribe",
			channel: "sonar"
		}));
		ws.send(JSON.stringify({
			webfix: "testnet",
			method: "subscribe",
			channel: "runtime"
		}));
	};
	
	ws.onmessage = onMessage;
	
	ws.onclose = (event) => {

		// Check if this is a user-initiated logout - do not reconnect
		if (event.code === 1000 && event.reason.includes('logged out')) {

			return;
		}
		
		// Check if session is expired (close code 1000 with specific reason or 1006 for abnormal closure)
		if ((event.code === 1000 && event.reason.includes('session')) || 
		    event.code === 1006 || 
		    event.reason.includes('expired') || 
		    event.reason.includes('invalid')) {

			onSessionExpired();
			return;
		}

		setTimeout(onReconnect, 1500);
		onError();
	};
	
	ws.onerror = () => {
		// Check for session-related errors
		if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {

			setTimeout(() => {
				onSessionExpired();
			}, 1000);
			return;
		}
		
		ws.close();
		setTimeout(onReconnect, 1500);
	};
	
	return ws;
}

let messageBatch: MessageBatch = {};
let batchScheduled = false;
let messageCount = 0;
let initialSyncComplete = false;

/**
 * Process accumulated messages in batches using requestAnimationFrame
 * This prevents blocking the event loop and allows WebSocket ping/pong to work
 * Optimized to process in smaller chunks to avoid requestAnimationFrame violations
 */
function scheduleMessageBatch(): void {
	if (batchScheduled) {
		return;
	}
	
	batchScheduled = true;
	
	// Use requestAnimationFrame for non-blocking async processing
	// Process in chunks to avoid blocking the frame
	requestAnimationFrame(() => {
		const batchToProcess = messageBatch;
		const batchSize = Object.keys(batchToProcess).length;
		
		messageBatch = {};
		batchScheduled = false;
		
		if (batchSize > 0) {
			// Process messages in smaller chunks to avoid blocking
			const entries = Object.entries(batchToProcess);
			const CHUNK_SIZE = 10; // Process 10 messages per frame
			
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
				
				// Continue processing in next frame if more messages remain
				if (index < entries.length) {
					requestAnimationFrame(processChunk);
				}
			};
			
			processChunk();
		}
	});
}

/**
 * Flush any pending messages immediately (used during cleanup)
 */
function flushMessageBatch(): void {
	if (Object.keys(messageBatch).length === 0) {
		return;
	}

	Object.entries(messageBatch).forEach(([channel, data]) => {
		try {
			sessionStorage.setItem(channel, data);
		} catch {
			// Error handled silently
		}
	});
	
	messageBatch = {};
	batchScheduled = false;
}

const useWebSocketStore = create<WebSocketState>((set, get) => ({
	ws: null,
	connection: false,
	locked: true,
	sessionExpired: false,
	reconnectAttempts: 0,
	maxReconnectAttempts: 5,
	isCleaningUp: false,
	
	connectNode: (config: WebSocketConfig) => {
		const connectWebSocket = () => {
			// Close previous connection before creating new one
			const { ws: currentWs, sessionExpired } = get();
			
			// If session already expired, don't attempt to connect
			if (sessionExpired) {

				return;
			}
			
			if (currentWs && currentWs.readyState !== WebSocket.CLOSED) {

				// Don't close connection if it's already open or connecting
				if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) {

					return;
				}
				currentWs.close(1000, 'Replacing with new connection');
			}
			
			// Reset message statistics for new connection
			messageCount = 0;
			initialSyncComplete = false;

			const ws = createWebSocket(
				config.raw.info,
				(event: MessageEvent) => {
					// Use requestAnimationFrame to batch message processing and avoid blocking
					// This prevents 'message' handler violation warnings
					requestAnimationFrame(() => {
						try {
							const json = JSON.parse(event.data);
							
							// Check for session-related errors in the message
							if (json.error || json.message) {
								const errorMsg = json.error || json.message || '';
								if (errorMsg.includes('session') || 
								    errorMsg.includes('expired') || 
								    errorMsg.includes('invalid') ||
								    errorMsg.includes('unauthorized')) {

									// Use the session expired callback from the store
									const { handleSessionExpired } = useWebSocketStore.getState();
									handleSessionExpired();
									return;
								}
							}
							
							if (json.value) {
								// Track message statistics
								messageCount++;
								
								// Log initial sync progress
								if (!initialSyncComplete && messageCount % 50 === 0) {
									// Progress logged
								}
								
								// Mark initial sync as complete after first batch
								if (!initialSyncComplete && messageCount > 100) {
									initialSyncComplete = true;

								}
								
								// Add message to batch instead of processing immediately
								// This prevents blocking the event loop with synchronous sessionStorage operations
								messageBatch[json.value.channel] = JSON.stringify(json.value);
								scheduleMessageBatch();
								
								set({connection: true, reconnectAttempts: 0}); // Reset counter on successful connection
								
								// Only notify sync system about significant data changes
								// Skip frequent sessionStorage updates, focus on important state changes
								if (json.value.type === 'sync' || json.value.important) {
									const appStore = useAppStore.getState();
									const dataVersion = generateDataHash(json.value);
									appStore.markDataAsUpdated(dataVersion);
								}
							}
						} catch {

							// Don't show sync errors for WebSocket message parsing issues
							// These are usually temporary and don't affect localStorage sync
						}
					});
				},
				() => {
					// Flush any pending messages before reconnecting
					flushMessageBatch();
					
					const { reconnectAttempts, maxReconnectAttempts } = get();

					set({connection: false});
					
					if (reconnectAttempts < maxReconnectAttempts) {
						set({reconnectAttempts: reconnectAttempts + 1});
						setTimeout(connectWebSocket, 1500);
					} else {

						set({sessionExpired: true});
					}
				},
				() => {

					set({connection: false});
					// Don't show sync errors for WebSocket connection issues
					// localStorage sync works independently of WebSocket status
				},
				() => {
					// Session expired callback
					const { handleSessionExpired } = get();
					handleSessionExpired();
				}
			);
			set({ws, connection: false});
		};
		
		connectWebSocket();
	},
	
	resetReconnectAttempts: () => {
		set({reconnectAttempts: 0});
	},
	
	resetWebSocketState: () => {

		// Flush any pending messages before cleanup
		flushMessageBatch();
		
		// Close current WebSocket connection
		const { ws } = get();
		if (ws) {

			ws.close(1000, 'User logged out');
		}
		
		// Reset to initial state
		set({
			ws: null,
			connection: false,
			locked: true,
			sessionExpired: false,
			reconnectAttempts: 0,
			isCleaningUp: false
		});

	},
	
	handleSessionExpired: () => {
		const { isCleaningUp } = get();
		
		// Prevent multiple calls
		if (isCleaningUp) {

			return;
		}

		set({ isCleaningUp: true });
		
		// Flush any pending messages before cleanup
		flushMessageBatch();
		
		// Close current WebSocket connection
		const { ws } = get();
		if (ws) {
			ws.close();
		}
		
		// Clear WebSocket state
		set({
			ws: null,
			connection: false,
			sessionExpired: true,
			reconnectAttempts: 0
		});
		
		// Clear session data from localStorage
		try {
			localStorage.removeItem('private-store');

		} catch {
			// Error handled silently
		}
		
		// Reset auth state to force re-authentication
		const authStore = useAuthStore.getState();
		authStore.resetAuth().then(() => {
			// Auth reset complete
		}).catch(() => {
			// Error resetting auth
		}).finally(() => {
			// Reset cleanup flag after completion
			setTimeout(() => {
				set({ isCleaningUp: false });
			}, 1000);
		});
	},
}));

export default useWebSocketStore;
export { useWebSocketStore };
