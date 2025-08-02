import {create} from "zustand";

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
		} catch (error) {
			console.error("Error loading state from sessionStorage", error);
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
		} catch (error) {
			console.error(`Error getting data for key ${key}`, error);
			return null;
		}
	};
	
	const reloadState = () => {
		set(() => loadState());
	};
	
	const POLLING_INTERVAL = 100;
	setInterval(() => {
		reloadState();
	}, POLLING_INTERVAL);
	
	return {
		saveData,
		getData,
		reloadState,
		...loadState(),
	};
});

export default useSessionStoreSync;