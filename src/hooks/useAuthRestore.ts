import { useEffect } from 'react';
import { useAuthStore } from '@/stores/modules/auth.store';

/**
 * Hook for automatic authentication restoration on app load
 */
export const useAuthRestore = (): void => {
	const { 
		wallet, 
		selectedNetwork, 
		isConnected, 
		isAuthenticated,
		connectionSession,
		_hasHydrated,
		restoreConnection 
	} = useAuthStore();

	useEffect(() => {
		// Wait for store to be hydrated before attempting restoration
		if (!_hasHydrated) {
			console.log('[AuthRestore] Store not yet hydrated, waiting...');
			return;
		}

		console.log('[AuthRestore] Effect triggered:', {
			wallet: !!wallet,
			selectedNetwork: !!selectedNetwork,
			isConnected,
			isAuthenticated,
			connectionSession: !!connectionSession,
			_hasHydrated
		});
		
		// Check if we already have a valid connection
		if (wallet && selectedNetwork && isConnected && isAuthenticated && connectionSession) {
			console.log('[AuthRestore] Already fully authenticated, no need to restore');
			return;
		}
		
		// Case 1: We have Wallet and network but missing connection/authentication
		if (wallet && selectedNetwork && (!isConnected || !isAuthenticated || !connectionSession)) {
			console.log('[AuthRestore] Have Wallet/network but missing connection/auth, attempting restore...');
			
			// Small delay to ensure all state is stable
			const timer = setTimeout(() => {
				restoreConnection().then((success) => {
					if (success) {
						console.log('[AuthRestore] Authentication restored successfully');
					} else {
						console.log('[AuthRestore] Authentication restore failed');
					}
				}).catch((error) => {
					console.error('[AuthRestore] Error during restore:', error);
				});
			}, 50);

			return () => clearTimeout(timer);
		}
		
		// Case 2: No Wallet/network in store but data exists in localStorage
		if (!wallet || !selectedNetwork) {
			const authStoreData = localStorage.getItem('auth-store');
			const privateStoreData = localStorage.getItem('private-store');
			const hasValidSession = privateStoreData && JSON.parse(privateStoreData)?.raw?.session;
			
			console.log('[AuthRestore] Missing Wallet/network in store, checking localStorage:', {
				hasAuthStore: !!authStoreData,
				hasPrivateStore: !!privateStoreData,
				hasValidSession: !!hasValidSession
			});

			// If we have a valid session but incomplete store data, try to restore
			if (hasValidSession && authStoreData) {
				console.log('[AuthRestore] Found session and auth data in localStorage, attempting restore...');
				
				const timer = setTimeout(() => {
					restoreConnection().then((success) => {
						if (success) {
							console.log('[AuthRestore] Session restored successfully from localStorage');
						} else {
							console.log('[AuthRestore] Failed to restore session from localStorage');
						}
					}).catch((error) => {
						console.error('[AuthRestore] Error restoring session:', error);
					});
				}, 50);

				return () => clearTimeout(timer);
			}
		}
	}, [wallet, selectedNetwork, isConnected, isAuthenticated, connectionSession, _hasHydrated, restoreConnection]);
};
