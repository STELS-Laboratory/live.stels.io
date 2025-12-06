import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createWallet, importWallet, createSignedTransaction, getUncompressedPublicKey } from '@/lib/gliesereum';
import { clearAllStorage, clearAppStorage } from '@/lib/storage-cleaner';
import { useWebSocketStore } from '@/hooks/use_web_socket_store';
import { NETWORK_CONFIGS, useNetworkStore } from './network.store';
import type {
	NetworkConfig,
	ConnectionSession,
	AuthState,
	AuthActions,
	AuthStore,
} from '@/types/auth/types';

export type {
	NetworkConfig,
	ConnectionSession,
	AuthState,
	AuthActions,
	AuthStore,
};

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
		availableNetworks: Object.values(NETWORK_CONFIGS),
		isConnected: false,
		isConnecting: false,
		connectionSession: null,
		connectionError: null,
		isAuthenticated: false,
		showNetworkSelector: false,
		showSecurityWarning: false,
		showSessionExpiredModal: false,
		_hasHydrated: false,
				
				// Wallet operations
				createNewWallet: () => {
					try {
						const wallet = createWallet();
						set({
							wallet,
							isWalletCreated: true,
							connectionError: null
						});

					} catch (error){

						set({
							connectionError: error instanceof Error ? error.message : 'Failed to create Wallet'
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

						return true;
					} catch(error) {

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
					
					// Clear only Wallet-related data, keep other localStorage intact
					try {
						localStorage.removeItem('auth-store');

					} catch {
			// Error handled silently
		}
				},
				
				// Network operations
				setAvailableNetworks: (networks: NetworkConfig[]) => {
					set({ availableNetworks: networks });
				},
				
				selectNetwork: (network: NetworkConfig) => {
					// Update network store
					const networkStore = useNetworkStore.getState();
					networkStore.setNetwork(network.id);
					
					set({ 
						selectedNetwork: network,
						showNetworkSelector: false,
						connectionError: null
					});

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
						
					// CRITICAL: Use UNCOMPRESSED public key (130 chars) for WebFix protocol
					// WebFix requires uncompressed format for signature verification
					const uncompressedPublicKey = getUncompressedPublicKey(wallet.privateKey);

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
									publicKey: uncompressedPublicKey
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

							return true;
						} else {
							throw new Error('Invalid session response');
						}
						
					} catch(error) {

						set({
							isConnecting: false,
							connectionError: error instanceof Error ? error.message : 'Connection failed'
						});
						return false;
					}
				},
				
				disconnectFromNode: async () => {

					// 1. Reset connection state

					set({
						isConnected: false,
						connectionSession: null,
						isAuthenticated: false,
						connectionError: null,
						isConnecting: false
					});

					// 2. Clear ALL storage
					try {

						await clearAllStorage();

					} catch {

						// Fallback to basic clearing
						try {
							clearAppStorage();

						} catch {
							// Fallback error handled
						}
					}

				},
				
				restoreConnection: async (): Promise<boolean> => {
					const { wallet, selectedNetwork } = get();
					
					// Check if we have saved session data
					const savedSession = localStorage.getItem('private-store');
					if (!savedSession || !wallet || !selectedNetwork) {

						return false;
					}
					
					try {
						const sessionData = JSON.parse(savedSession);
						if (!sessionData?.raw?.session) {

							return false;
						}

						// Extract session data from saved session
						const session: ConnectionSession = {
							session: sessionData.raw.session,
							token: sessionData.raw.token,
							network: sessionData.raw.info.network,
							title: sessionData.raw.info.title,
							nid: sessionData.raw.info.nid,
							api: sessionData.raw.info.api,
							socket: sessionData.raw.info.connector.socket,
							developer: sessionData.raw.info.developer
						};
						
						// Restore the connection state without reconnecting
						set({
							isConnected: true,
							isConnecting: false,
							connectionSession: session,
							isAuthenticated: true,
							connectionError: null
						});

						return true;
						
					} catch {

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
				
				setShowSecurityWarning: (show: boolean) => {
					set({ showSecurityWarning: show });
				},
				
				setShowSessionExpiredModal: (show: boolean) => {
					set({ showSessionExpiredModal: show });
				},
				
				clearConnectionError: () => {
					set({ connectionError: null });
				},
				
				// Utility operations
				resetAuth: async () => {

					// 1. Close WebSocket connection and clear its state
					try {

						const wsStore = useWebSocketStore.getState();
						wsStore.resetWebSocketState();

					} catch {
			// Error handled silently
		}
					
					// 2. Reset auth state FIRST (before clearing storage)

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

					// 3. Clear ALL storage (localStorage, sessionStorage, IndexedDB, Caches, Service Workers)
					try {

						await clearAllStorage();

					} catch {

						// Fallback to basic clearing
						try {
							clearAppStorage();

						} catch {
							// Fallback error handled
						}
					}

					// 4. Navigate to welcome page after logout
					try {
						const { navigateTo } = await import('@/lib/router');
						navigateTo('welcome');
					} catch {
						// Navigation error handled silently
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
					isConnected: state.isConnected,
					isAuthenticated: state.isAuthenticated
				}),
				onRehydrateStorage: () => (state) => {
					if (state) {
						state._hasHydrated = true;

					}
				},
			}
		),
		{
			name: 'auth_store_03_111',
		}
	)
);
