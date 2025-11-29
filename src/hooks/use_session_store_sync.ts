import {create} from "zustand";

// Global polling interval reference for cleanup
let pollingIntervalId: NodeJS.Timeout | null = null;
let subscribersCount = 0;

const POLLING_INTERVAL = 3000; // Increased to 3 seconds to reduce load significantly

const useSessionStoreSync = create((set) => {
	const loadState = () => {
		try {
			const storedState = {} as Record<string, unknown>;
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key) {
					const state = sessionStorage.getItem(key);
					storedState[key] = state ? JSON.parse(state) : null;
				}
			}
			return storedState;
		} catch {
			return null;
		}
	};
	
	const saveData = (key: string, newItem: unknown): void => {
		sessionStorage.setItem(key.toLowerCase(), JSON.stringify(newItem));
		set(() => loadState());
	};
	
	const getData = (key: string) => {
		try {
			const data = sessionStorage.getItem(key);
			return data ? JSON.parse(data) : null;
		} catch {
			return null;
		}
	};
	
	const reloadState = () => {
		set(() => loadState());
	};
	
	// Start polling - only create interval if not already running
	const startPolling = () => {
		if (pollingIntervalId === null) {
			pollingIntervalId = setInterval(() => {
				reloadState();
			}, POLLING_INTERVAL);
		}
		subscribersCount++;
	};
	
	// Stop polling when no subscribers
	const stopPolling = () => {
		subscribersCount--;
		if (subscribersCount <= 0 && pollingIntervalId !== null) {
			clearInterval(pollingIntervalId);
			pollingIntervalId = null;
			subscribersCount = 0;
		}
	};
	
	// Don't start polling automatically - let components control it via useEffect
	// This prevents memory leaks when store is created but not used
	
	return {
		saveData,
		getData,
		reloadState,
		startPolling,
		stopPolling,
		...loadState(),
	};
});

export default useSessionStoreSync;