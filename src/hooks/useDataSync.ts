import {useCallback, useEffect, useRef} from "react";
import {useAppStore} from "@/stores";
import {generateDataHash} from "@/lib/utils";

/**
 * Custom hook for managing data synchronization with WebSocket updates
 * Automatically detects data changes and triggers sync notifications
 */
export const useDataSync = (): {
	checkForUpdates: () => Promise<boolean>;
	syncData: () => Promise<void>;
	isOnline: boolean;
} => {
	const {
		online,
		checkForUpdates,
		syncData,
		markDataAsUpdated,
	} = useAppStore();
	
	const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastLocalStorageStateRef = useRef<string>("");
	
	/**
	 * Generate hash from current localStorage state
	 */
	const generateLocalStorageHash = useCallback((): string => {
		try {
			const localData: Record<string, unknown> = {};
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key) {
					const value = localStorage.getItem(key);
					if (value) {
						try {
							localData[key] = JSON.parse(value);
						} catch {
							// Store raw string if not JSON
							localData[key] = value;
						}
					}
				}
			}
			
			return generateDataHash(localData);
		} catch (error) {
			console.error("Failed to generate localStorage hash:", error);
			return Date.now().toString(16);
		}
	}, []);
	
	/**
	 * Monitor localStorage changes for data updates
	 */
	const monitorLocalStorageChanges = useCallback((): void => {
		const currentHash = generateLocalStorageHash();
		
		if (lastLocalStorageStateRef.current && lastLocalStorageStateRef.current !== currentHash) {
			// localStorage data has changed, mark as updated with new version
			markDataAsUpdated(currentHash);
			console.log("localStorage data changed, marking for sync");
		}
		
		lastLocalStorageStateRef.current = currentHash;
	}, [generateLocalStorageHash, markDataAsUpdated]);
	
	/**
	 * Start periodic monitoring of localStorage
	 */
	const startSyncMonitoring = useCallback((): void => {
		if (syncIntervalRef.current) {
			clearInterval(syncIntervalRef.current);
		}
		
		// Initialize with current state
		lastLocalStorageStateRef.current = generateLocalStorageHash();
		
		// Monitor every 10 seconds for localStorage changes (less frequent than sessionStorage)
	}, []);
	
	/**
	 * Stop sync monitoring
	 */
	const stopSyncMonitoring = useCallback((): void => {
		if (syncIntervalRef.current) {
			clearInterval(syncIntervalRef.current);
			syncIntervalRef.current = null;
		}
	}, []);
	
	useEffect(() => {
		const handleStorageChange = (event: StorageEvent): void => {
			if (event.storageArea === localStorage) {
				monitorLocalStorageChanges();
			}
		};
		
		// Listen for localStorage changes from other tabs/windows
		window.addEventListener("storage", handleStorageChange);
		
		return (): void => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [monitorLocalStorageChanges]);
	
	/**
	 * Start/stop monitoring based on online status
	 */
	useEffect(() => {
		if (online) {
			startSyncMonitoring();
		} else {
			stopSyncMonitoring();
		}
		
		return (): void => {
			stopSyncMonitoring();
		};
	}, [online, startSyncMonitoring, stopSyncMonitoring]);
	
	/**
	 * Cleanup on unmount
	 */
	useEffect(() => {
		return (): void => {
			stopSyncMonitoring();
		};
	}, [stopSyncMonitoring]);
	
	return {
		checkForUpdates,
		syncData,
		isOnline: online,
	};
};

/**
 * Hook for components that need to trigger data sync manually
 */
export const useSyncActions = (): {
	syncData: () => Promise<void>;
	checkForUpdates: () => Promise<boolean>;
	hasUpdates: boolean;
	isSyncing: boolean;
	syncError: string | null;
} => {
	const {
		hasUpdates,
		isSyncing,
		syncError,
		syncData,
		checkForUpdates,
	} = useAppStore();
	
	return {
		syncData,
		checkForUpdates,
		hasUpdates,
		isSyncing,
		syncError,
	};
};