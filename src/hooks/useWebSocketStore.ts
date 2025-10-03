import {create} from "zustand";
import {useAppStore} from "@/stores";
import {useAuthStore} from "@/stores/modules/auth.store";
import {generateDataHash} from "@/lib/utils";


type WebSocketInfo = {
	connector: {
		socket: string;
		protocols?: string | string[];
	};
	network: string;
	title: string;
	pid: string;
};

type SessionData = {
	raw: {
		session: string;
	};
};

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
		} catch (error) {
			console.error('Failed to parse localStorage data:', error);
			return null;
		}
	}
	
	if (!session) {
		console.warn('No session found in localStorage, WebSocket connection may fail');
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
		console.log('WebSocket connection opened');
		
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
		console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
		
		// Check if session is expired (close code 1000 with specific reason or 1006 for abnormal closure)
		if (event.code === 1000 && event.reason.includes('session') || 
		    event.code === 1006 || 
		    event.reason.includes('expired') || 
		    event.reason.includes('invalid')) {
			console.log('Session appears to be expired, triggering cleanup');
			onSessionExpired();
			return;
		}
		
		console.log('WebSocket connection closed. Attempting to reconnect...');
		setTimeout(onReconnect, 3000);
		onError();
	};
	
	ws.onerror = (error) => {
		console.error('WebSocket encountered an error:', error);
		
		// Check for session-related errors
		if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
			console.log('WebSocket closed due to error, checking if session expired');
			setTimeout(() => {
				onSessionExpired();
			}, 1000);
			return;
		}
		
		ws.close();
		setTimeout(onReconnect, 3000);
	};
	
	return ws;
}

interface WebSocketConfig {
	raw: {
		info: WebSocketInfo;
	};
}

interface WebSocketState {
	ws: WebSocket | null;
	connection: boolean;
	locked: boolean;
	sessionExpired: boolean;
	connectNode: (config: WebSocketConfig) => void;
	handleSessionExpired: () => void;
}

const useWebSocketStore = create<WebSocketState>((set, get) => ({
	ws: null,
	connection: false,
	locked: true,
	sessionExpired: false,
	
	connectNode: (config: WebSocketConfig) => {
		const connectWebSocket = () => {
			const ws = createWebSocket(
				config.raw.info,
				(event: MessageEvent) => {
					try {
						const json = JSON.parse(event.data);
						
						// Check for session-related errors in the message
						if (json.error || json.message) {
							const errorMsg = json.error || json.message || '';
							if (errorMsg.includes('session') || 
							    errorMsg.includes('expired') || 
							    errorMsg.includes('invalid') ||
							    errorMsg.includes('unauthorized')) {
								console.log('Session error detected in WebSocket message:', errorMsg);
								// Use the session expired callback from the store
								const { handleSessionExpired } = useWebSocketStore.getState();
								handleSessionExpired();
								return;
							}
						}
						
						if (json.value) {
							sessionStorage.setItem(json.value.channel, JSON.stringify(json.value));
							set({connection: true});
							
							// Only notify sync system about significant data changes
							// Skip frequent sessionStorage updates, focus on important state changes
							if (json.value.type === 'sync' || json.value.important) {
								const appStore = useAppStore.getState();
								const dataVersion = generateDataHash(json.value);
								appStore.markDataAsUpdated(dataVersion);
							}
						}
					} catch (error) {
						console.error("Error parsing WebSocket message:", error);
						// Don't show sync errors for WebSocket message parsing issues
						// These are usually temporary and don't affect localStorage sync
					}
				},
				() => {
					console.log("WebSocket connection closed. Reconnecting...");
					set({connection: false});
					setTimeout(connectWebSocket, 3000);
				},
				() => {
					console.error("WebSocket encountered an error. Connection lost.");
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
	
	handleSessionExpired: () => {
		console.log('[WebSocket] Session expired, showing blocking modal');
		
		// Close current WebSocket connection
		const { ws } = get();
		if (ws) {
			ws.close();
		}
		
		// Clear WebSocket state
		set({
			ws: null,
			connection: false,
			sessionExpired: true
		});
		
		// Clear session data from localStorage
		try {
			localStorage.removeItem('private-store');
			console.log('[WebSocket] Cleared private-store from localStorage');
		} catch (error) {
			console.error('[WebSocket] Error clearing private-store:', error);
		}
		
		// Show blocking modal instead of automatically resetting auth
		const authStore = useAuthStore.getState();
		authStore.setShowSessionExpiredModal(true);
		console.log('[WebSocket] Session expired modal shown, application blocked until user acknowledgment');
	},
}));

export default useWebSocketStore;
export { useWebSocketStore };
