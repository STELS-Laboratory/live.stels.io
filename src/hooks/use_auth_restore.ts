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

			return;
		}

		// Check if we already have a valid connection
		if (wallet && selectedNetwork && isConnected && isAuthenticated && connectionSession) {

			return;
		}
		
		// Case 1: We have Wallet and network but missing connection/authentication
		if (wallet && selectedNetwork && (!isConnected || !isAuthenticated || !connectionSession)) {

			// Small delay to ensure all state is stable
			const timer = setTimeout(() => {
				restoreConnection().then((success) => {
					if (success) {
						// Connection restored
					} else {
						// Connection restore failed
					}
				}).catch(() => {
					// Error during restore
				});
			}, 50);

			return () => clearTimeout(timer);
		}
		
		// Case 2: No Wallet/network in store but data exists in localStorage
		if (!wallet || !selectedNetwork) {
			const authStoreData = localStorage.getItem('auth-store');
			const privateStoreData = localStorage.getItem('private-store');
			const hasValidSession = privateStoreData && JSON.parse(privateStoreData)?.raw?.session;

			// If we have a valid session but incomplete store data, try to restore
			if (hasValidSession && authStoreData) {

				const timer = setTimeout(() => {
					restoreConnection().then((success) => {
						if (success) {
							// Connection restored
						} else {
							// Connection restore failed
						}
					}).catch(() => {
						// Error during restore
					});
				}, 50);

				return () => clearTimeout(timer);
			}
		}
	}, [wallet, selectedNetwork, isConnected, isAuthenticated, connectionSession, _hasHydrated, restoreConnection]);
};
