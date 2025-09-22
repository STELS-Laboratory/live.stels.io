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
		connectionSession,
		restoreConnection 
	} = useAuthStore();

	useEffect(() => {
		console.log('[AuthRestore] Effect triggered:', {
			wallet: !!wallet,
			selectedNetwork: !!selectedNetwork,
			isConnected,
			connectionSession: !!connectionSession
		});
		
		// Check if we already have a valid connection
		if (wallet && selectedNetwork && isConnected && connectionSession) {
			console.log('[AuthRestore] Already connected, no need to restore');
			return;
		}
		
		// Only attempt to restore if we have wallet and network but no active connection
		if (wallet && selectedNetwork && !isConnected && !connectionSession) {
			console.log('[AuthRestore] Attempting to restore authentication...');
			
			// Small delay to ensure store is fully hydrated
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
			}, 100);

			return () => clearTimeout(timer);
		}
		
		// If we have no wallet/network, check if there's data in localStorage
		if (!wallet && !selectedNetwork) {
			const authStoreData = localStorage.getItem('auth-store');
			const privateStoreData = localStorage.getItem('private-store');
			const hasValidSession = privateStoreData && JSON.parse(privateStoreData)?.raw?.session;
			
			console.log('[AuthRestore] No wallet/network in store, checking localStorage:', {
				hasAuthStore: !!authStoreData,
				hasPrivateStore: !!privateStoreData,
				hasValidSession: !!hasValidSession
			});

			// If we have a valid session but no wallet/network in store, try to restore
			if (hasValidSession) {
				console.log('[AuthRestore] Found valid session in localStorage, attempting restore...');
				console.log('[AuthRestore] Session data:', JSON.parse(privateStoreData));
				
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
				}, 100);

				return () => clearTimeout(timer);
			}
		}
	}, [wallet, selectedNetwork, isConnected, connectionSession, restoreConnection]);
};
