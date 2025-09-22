import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createWallet, importWallet, createSignedTransaction, type Wallet } from '@/lib/gliesereum';

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
	
	// Network operations
	setAvailableNetworks: (networks: NetworkConfig[]) => void;
	selectNetwork: (network: NetworkConfig) => void;
	
	// Connection operations
	connectToNode: () => Promise<boolean>;
	disconnectFromNode: () => void;
	
	// UI operations
	setShowNetworkSelector: (show: boolean) => void;
	clearConnectionError: () => void;
	
	// Utility operations
	resetAuth: () => void;
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
					const { wallet, selectedNetwork } = get();
					
					if (!wallet) {
						set({ connectionError: 'Wallet not created' });
						return false;
					}
					
					if (!selectedNetwork) {
						set({ connectionError: 'Network not selected' });
						return false;
					}
					
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
						const response = await fetch(selectedNetwork.api, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify(connectionPayload)
						});
						
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
				
				disconnectFromNode: () => {
					set({
						isConnected: false,
						connectionSession: null,
						isAuthenticated: false,
						connectionError: null
					});
					
					// Clear session from localStorage
					localStorage.removeItem('private-store');
					
					console.log('[Auth] Disconnected from node');
				},
				
				// UI operations
				setShowNetworkSelector: (show: boolean) => {
					set({ showNetworkSelector: show });
				},
				
				clearConnectionError: () => {
					set({ connectionError: null });
				},
				
				// Utility operations
				resetAuth: () => {
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
					
					// Clear all auth data
					localStorage.removeItem('private-store');
					
					console.log('[Auth] Auth state reset');
				}
			}),
			{
				name: 'auth-store',
				partialize: (state) => ({
					wallet: state.wallet,
					isWalletCreated: state.isWalletCreated,
					selectedNetwork: state.selectedNetwork,
					availableNetworks: state.availableNetworks
				}),
			}
		),
		{
			name: 'auth-store',
		}
	)
);
