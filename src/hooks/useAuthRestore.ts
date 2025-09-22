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
	}, [wallet, selectedNetwork, isConnected, connectionSession, restoreConnection]);
};
