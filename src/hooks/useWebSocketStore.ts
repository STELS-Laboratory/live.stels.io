import {create} from "zustand";
import {useAppStore} from "@/stores";
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
	onError: () => void
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
		session = info.pid;
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
	
	ws.onclose = () => {
		console.log('WebSocket connection closed. Attempting to reconnect...');
		setTimeout(onReconnect, 3000);
		onError();
	};
	
	ws.onerror = (error) => {
		console.error('WebSocket encountered an error:', error);
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
	connectNode: (config: WebSocketConfig) => void;
}

const useWebSocketStore = create<WebSocketState>((set,) => ({
	ws: null,
	connection: false,
	locked: true,
	
	connectNode: (config: WebSocketConfig) => {
		const connectWebSocket = () => {
			const ws = createWebSocket(
				config.raw.info,
				(event: MessageEvent) => {
					try {
						const json = JSON.parse(event.data);
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
				}
			);
			set({ws, connection: false});
		};
		
		connectWebSocket();
	},
}));

export default useWebSocketStore;
