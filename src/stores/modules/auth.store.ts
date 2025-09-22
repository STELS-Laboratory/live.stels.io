import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createWallet, importWallet, createSignedTransaction, type Wallet } from '@/lib/gliesereum';
import { clearAllStorage, clearAppStorage } from '@/lib/storage-cleaner';

/**
 * Network configuration interface
 */
export interface NetworkConfig {
	id: string;
	name: string;
	api: string;
	socket: string;
	developer: boolean;
	description?: string;
}

/**
 * Connection session data
 */
export interface ConnectionSession {
	session: string;
	token: string;
	network: string;
	title: string;
	nid: string;
	api: string;
	socket: string;
	developer: boolean;
}

/**
 * Authentication state interface
 */
export interface AuthState {
	// Wallet state
	wallet: Wallet | null;
	isWalletCreated: boolean;
	
	// Network state
	selectedNetwork: NetworkConfig | null;
	availableNetworks: NetworkConfig[];
	
	// Connection state
	isConnected: boolean;
	isConnecting: boolean;
	connectionSession: ConnectionSession | null;
	connectionError: string | null;
	
	// UI state
	isAuthenticated: boolean;
	showNetworkSelector: boolean;
}

/**
 * Authentication actions interface
 */
export interface AuthActions {
	// Wallet operations
	createNewWallet: () => void;
	importExistingWallet: (privateKey: string) => boolean;
	resetWallet: () => void;
	
	// Network operations
	setAvailableNetworks: (networks: NetworkConfig[]) => void;
	selectNetwork: (network: NetworkConfig) => void;
	
	// Connection operations
	connectToNode: () => Promise<boolean>;
	disconnectFromNode: () => Promise<void>;
	restoreConnection: () => Promise<boolean>;
	
	// UI operations
	setShowNetworkSelector: (show: boolean) => void;
	clearConnectionError: () => void;
	
	// Utility operations
	resetAuth: () => Promise<void>;
}

/**
 * Combined auth store type
 */
export type AuthStore = AuthState & AuthActions;

/**
 * Default network configurations
 */
const DEFAULT_NETWORKS: NetworkConfig[] = [
	{
		id: 'testnet',
		name: 'Testnet',
		api: 'http://10.0.0.238:8088',
		socket: 'ws://10.0.0.238:8088',
		developer: true,
		description: 'Development and testing network'
	},
	{
		id: 'mainnet',
		name: 'Mainnet',
		api: 'https://live.stels.dev',
		socket: 'wss://live.stels.dev',
		developer: false,
		description: 'Production network'
	},
	{
		id: 'localnet',
		name: 'Local Network',
		api: 'http://localhost:8088',
		socket: 'ws://localhost:8088',
		developer: true,
		description: 'Local development network'
	}
];

/**
 * Generate unique node ID
 */
function generateNodeId(): string {
	return `gliese_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Authentication store
 */
export const useAuthStore = create<AuthStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial state
				wallet: null,
				isWalletCreated: false,
				selectedNetwork: null,
				availableNetworks: DEFAULT_NETWORKS,
				isConnected: false,
				isConnecting: false,
				connectionSession: null,
				connectionError: null,
				isAuthenticated: false,
				showNetworkSelector: false,
				
				// Wallet operations
				createNewWallet: () => {
					try {
						const wallet = createWallet();
						set({
							wallet,
							isWalletCreated: true,
							connectionError: null
						});
						console.log('[Auth] Wallet created:', wallet.address);
					} catch (error) {
						console.error('[Auth] Failed to create wallet:', error);
						set({
							connectionError: error instanceof Error ? error.message : 'Failed to create wallet'
						});
					}
				},
				
				importExistingWallet: (privateKey: string): boolean => {
					try {
						const wallet = importWallet(privateKey);
						set({
							wallet,
							isWalletCreated: true,
							connectionError: null
						});
						console.log('[Auth] Wallet imported:', wallet.address);
						return true;
					} catch (error) {
						console.error('[Auth] Failed to import wallet:', error);
						set({
							connectionError: error instanceof Error ? error.message : 'Invalid private key'
						});
						return false;
					}
				},
				
				resetWallet: () => {
					set({
						wallet: null,
						isWalletCreated: false,
						selectedNetwork: null,
						isConnected: false,
						isConnecting: false,
						connectionSession: null,
						connectionError: null,
						isAuthenticated: false,
						showNetworkSelector: false
					});
					
					// Clear only wallet-related data, keep other localStorage intact
					try {
						localStorage.removeItem('auth-store');
						console.log('[Auth] Wallet reset successfully');
					} catch (error) {
						console.error('[Auth] Error resetting wallet:', error);
					}
				},
				
				// Network operations
				setAvailableNetworks: (networks: NetworkConfig[]) => {
					set({ availableNetworks: networks });
				},
				
				selectNetwork: (network: NetworkConfig) => {
					set({ 
						selectedNetwork: network,
						showNetworkSelector: false,
						connectionError: null
					});
					console.log('[Auth] Network selected:', network.name);
				},
				
				// Connection operations
				connectToNode: async (): Promise<boolean> => {
					console.log('[Auth] connectToNode called');
					const { wallet, selectedNetwork } = get();
					
					if (!wallet) {
						console.log('[Auth] No wallet found');
						set({ connectionError: 'Wallet not created' });
						return false;
					}
					
					if (!selectedNetwork) {
						console.log('[Auth] No network selected');
						set({ connectionError: 'Network not selected' });
						return false;
					}
					
					console.log('[Auth] Starting connection to:', selectedNetwork.name);
					set({ isConnecting: true, connectionError: null });
					
					try {
						// Create login transaction data
						const loginData = {
							action: 'LOGIN_REQUEST',
							timestamp: Date.now(),
							network: selectedNetwork.id,
							walletAddress: wallet.address
						};
						
						// Use createSignedTransaction to properly create and sign the transaction
						const signedTransaction = createSignedTransaction(
							wallet,
							wallet.address, // to self
							0, // amount
							1, // fee
							JSON.stringify(loginData) // data
						);
						
						// Prepare connection payload
						const connectionPayload = {
							webfix: "1.0",
							method: "connectionNode",
							params: ["gliesereum"],
							body: {
								network: selectedNetwork.id,
								title: "heterogen",
								nid: generateNodeId(),
								payload: {
									webfix: "1.0",
									method: "connectionNode",
									params: ["gliesereum"],
									body: {
										transaction: signedTransaction,
										walletAddress: wallet.address,
										publicKey: wallet.publicKey
									}
								},
								transport: "websocket",
								connector: {
									protocols: ["webfix"],
									socket: selectedNetwork.socket
								},
								api: selectedNetwork.api,
								developer: selectedNetwork.developer
							}
						};
						
						// Send connection request
						console.log('[Auth] Sending connection request to:', selectedNetwork.api);
						console.log('[Auth] Connection payload:', JSON.stringify(connectionPayload, null, 2));
						
						const response = await fetch(selectedNetwork.api, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify(connectionPayload)
						});
						
						console.log('[Auth] Response status:', response.status);
						
						if (!response.ok) {
							throw new Error(`Connection failed: ${response.status}`);
						}
						
						const result = await response.json();
						
						// Extract session data
						if (result.raw && result.raw.session && result.raw.token) {
							const session: ConnectionSession = {
								session: result.raw.session,
								token: result.raw.token,
								network: result.raw.info.network,
								title: result.raw.info.title,
								nid: result.raw.info.nid,
								api: result.raw.info.api,
								socket: result.raw.info.connector.socket,
								developer: result.raw.info.developer
							};
							
							set({
								isConnected: true,
								isConnecting: false,
								connectionSession: session,
								isAuthenticated: true,
								connectionError: null
							});
							
							// Store session in localStorage for WebSocket
							localStorage.setItem('private-store', JSON.stringify({
								raw: {
									session: session.session
								}
							}));
							
							console.log('[Auth] Connected to node:', session.network);
							return true;
						} else {
							throw new Error('Invalid session response');
						}
						
					} catch (error) {
						console.error('[Auth] Connection failed:', error);
						set({
							isConnecting: false,
							connectionError: error instanceof Error ? error.message : 'Connection failed'
						});
						return false;
					}
				},
				
				disconnectFromNode: async () => {
					set({
						isConnected: false,
						connectionSession: null,
						isAuthenticated: false,
						connectionError: null,
						isConnecting: false
					});
					
					try {
						// Use comprehensive storage cleaner
						await clearAllStorage();
						console.log('[Auth] ✅ Disconnected from node and cleared ALL storage data');
					} catch (error) {
						console.error('[Auth] ❌ Error clearing storage during disconnect:', error);
						// Fallback to basic clearing
						clearAppStorage();
					}
				},
				
				restoreConnection: async (): Promise<boolean> => {
					const { wallet, selectedNetwork } = get();
					
					// Check if we have saved session data
					const savedSession = localStorage.getItem('private-store');
					if (!savedSession || !wallet || !selectedNetwork) {
						console.log('[Auth] No saved session or missing wallet/network');
						return false;
					}
					
					try {
						const sessionData = JSON.parse(savedSession);
						if (!sessionData?.raw?.session) {
							console.log('[Auth] Invalid session data');
							return false;
						}
						
						console.log('[Auth] Attempting to restore connection...');
						set({ isConnecting: true, connectionError: null });
						
						// Try to restore the connection
						const success = await get().connectToNode();
						
						if (success) {
							console.log('[Auth] Connection restored successfully');
							return true;
						} else {
							console.log('[Auth] Failed to restore connection');
							// Clear invalid session data
							localStorage.removeItem('private-store');
							return false;
						}
					} catch (error) {
						console.error('[Auth] Error restoring connection:', error);
						set({ 
							connectionError: 'Failed to restore connection',
							isConnecting: false 
						});
						// Clear invalid session data
						localStorage.removeItem('private-store');
						return false;
					}
				},
				
				// UI operations
				setShowNetworkSelector: (show: boolean) => {
					set({ showNetworkSelector: show });
				},
				
				clearConnectionError: () => {
					set({ connectionError: null });
				},
				
				// Utility operations
				resetAuth: async () => {
					set({
						wallet: null,
						isWalletCreated: false,
						selectedNetwork: null,
						isConnected: false,
						isConnecting: false,
						connectionSession: null,
						connectionError: null,
						isAuthenticated: false,
						showNetworkSelector: false
					});
					
					try {
						// Use comprehensive storage cleaner for complete reset
						await clearAllStorage();
						console.log('[Auth] ✅ Auth state completely reset and ALL storage data cleared');
					} catch (error) {
						console.error('[Auth] ❌ Error clearing storage during reset:', error);
						// Fallback to basic clearing
						clearAppStorage();
					}
				}
			}),
			{
				name: 'auth-store',
				partialize: (state) => ({
					wallet: state.wallet,
					isWalletCreated: state.isWalletCreated,
					selectedNetwork: state.selectedNetwork,
					availableNetworks: state.availableNetworks,
					connectionSession: state.connectionSession,
					isConnected: state.isConnected
				}),
			}
		),
		{
			name: 'auth-store',
		}
	)
);
