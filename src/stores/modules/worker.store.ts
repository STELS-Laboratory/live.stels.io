import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'

/**
 * Worker interface for the distributed execution platform
 */
export interface Worker {
	key: string[];
	value: {
		raw: {
			sid: string;
			nid: string;
			active: boolean;
			note: string;
			script: string;
			dependencies: string[];
			version: string;
			timestamp: number;
		};
		channel: string;
	};
}

/**
 * Worker management state interface
 */
export interface WorkerState {
	workers: Worker[];
	workersLoading: boolean;
	workersError: string | null;
	worker: {
		isLoading: boolean;
		isEditor: boolean;
	};
}

/**
 * Worker management actions interface
 */
export interface WorkerActions {
	listWorkers: () => Promise<void>;
	setWorker: () => Promise<Worker | null>;
	updateWorker: (workerData: Worker) => Promise<Worker | null>;
}

/**
 * Worker store interface combining state and actions
 */
export interface WorkerStore extends WorkerState, WorkerActions {
}

/**
 * Zustand store for worker management
 */
export const useWorkerStore = create<WorkerStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Worker management state
				workers: [],
				workersLoading: false,
				workersError: null,
				worker: {
					isLoading: false,
					isEditor: false,
				},
				
				// Worker management actions
				setWorker: async (): Promise<Worker | null> => {
					set({worker: {isLoading: true, isEditor: get().worker.isEditor}});
					try {
						const storage = localStorage.getItem("private");
						if (!storage) throw new Error("Not authenticated");
						const storageJSON = JSON.parse(storage);
						
						const response = await fetch(storageJSON.raw.info.api, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								webfix: "1.0",
								method: "setWorker",
								params: [],
							}),
						});
						
						if (!response.ok) throw new Error("Network response was not ok");
						const result = await response.json();
						
						if (result && result.key && result.value && result.value.raw && result.value.raw.sid) {
							set((state) => ({
								workers: [...state.workers, result],
							}));
						}
						
						set({worker: {isLoading: false, isEditor: get().worker.isEditor}});
						return result;
					} catch (error) {
						console.error("Error creating worker:", error);
						set({
							worker: {isLoading: false, isEditor: get().worker.isEditor},
						});
						return null;
					}
				},
				
				updateWorker: async (workerData: Worker): Promise<Worker | null> => {
					set({worker: {isLoading: true, isEditor: get().worker.isEditor}});
					try {
						const storage = localStorage.getItem("private");
						if (!storage) throw new Error("Not authenticated");
						const storageJSON = JSON.parse(storage);
						
						const response = await fetch(storageJSON.raw.info.api, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								webfix: "1.0",
								method: "updateWorker",
								params: [],
								body: workerData,
							}),
						});
						
						if (!response.ok) throw new Error("Network response was not ok");
						const result = await response.json();
						
						// Update worker in state if server returns updated data
						if (result && result.value && result.value.raw && result.value.raw.sid) {
							const sid = result.value.raw.sid;
							set((state) => ({
								workers: state.workers.map((w) =>
									w.value.raw.sid === sid ? result : w
								),
							}));
						}
						set({worker: {isLoading: false, isEditor: get().worker.isEditor}});
						return result;
					} catch (error) {
						console.error("Error updating worker:", error);
						set({
							worker: {isLoading: false, isEditor: get().worker.isEditor},
						});
						return null;
					}
				},
				
				listWorkers: async (): Promise<void> => {
					set({workersLoading: true, workersError: null});
					try {
						const storage = localStorage.getItem("private");
						if (!storage) {
							throw new Error("Not authenticated");
						}
						const storageJSON = JSON.parse(storage);
						
						const response = await fetch(storageJSON.raw.info.api, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								webfix: "1.0",
								method: "listWorkers",
								params: []
							}),
						});
						
						if (!response.ok) {
							throw new Error('Network response was not ok');
						}
						const data = await response.json();
						
						set({
							workers: data,
							workersLoading: false,
							workersError: null
						});
					} catch (error) {
						set({
							workers: [],
							workersLoading: false,
							workersError: error instanceof Error ? error.message : 'Unknown error'
						});
					}
				},
			}),
			{
				name: 'live_worker_genesis_01'
			}
		)
	)
)
