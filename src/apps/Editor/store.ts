/**
 * Editor application store
 * Manages AMI Workers/Protocols state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store.ts";

/**
 * Worker/Protocol definition
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
 * Editor Store State
 */
interface EditorStoreState {
	/** List of workers */
	workers: Worker[];
	/** Workers loading state */
	workersLoading: boolean;
	/** Workers error message */
	workersError: string | null;
	/** Worker editor state */
	worker: {
		isLoading: boolean;
		isEditor: boolean;
	};
}

/**
 * Editor Store Actions
 */
interface EditorStoreActions {
	/** Fetch all workers from API */
	listWorkers: () => Promise<void>;
	/** Create new worker */
	setWorker: () => Promise<Worker | null>;
	/** Update existing worker */
	updateWorker: (workerData: Worker) => Promise<Worker | null>;
	/** Clear workers error */
	clearError: () => void;
}

/**
 * Editor Store Type
 */
export type EditorStore = EditorStoreState & EditorStoreActions;

/**
 * Editor Store
 */
export const useEditorStore = create<EditorStore>()(
	devtools(
		(set, get) => ({
			// Initial State
			workers: [],
			workersLoading: false,
			workersError: null,
			worker: {
				isLoading: false,
				isEditor: false,
			},

			// Actions
			listWorkers: async (): Promise<void> => {
				const connectionSession = useAuthStore.getState().connectionSession;

				if (!connectionSession) {
					set({
						workersError: "No active connection",
						workersLoading: false,
					});
					return;
				}

				set({ workersLoading: true, workersError: null });

				try {
					const response = await fetch(
						`${connectionSession.api}/ai-worker/list`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${connectionSession.token}`,
							},
							body: JSON.stringify({}),
						},
					);

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const data = await response.json();

					if (data && Array.isArray(data)) {
						set({
							workers: data,
							workersLoading: false,
							workersError: null,
						});
					} else {
						throw new Error("Invalid response format");
					}
				} catch (error) {
					console.error("Failed to fetch workers:", error);
					set({
						workersError:
							error instanceof Error ? error.message : "Failed to fetch workers",
						workersLoading: false,
					});
				}
			},

			setWorker: async (): Promise<Worker | null> => {
				const connectionSession = useAuthStore.getState().connectionSession;
				const wallet = useAuthStore.getState().wallet;

				if (!connectionSession || !wallet) {
					console.error("No active connection or wallet");
					return null;
				}

				set({
					worker: {
						isLoading: true,
						isEditor: false,
					},
				});

				try {
					const response = await fetch(
						`${connectionSession.api}/ai-worker/set`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${connectionSession.token}`,
							},
							body: JSON.stringify({
								sid: `worker-${Date.now()}`,
								nid: connectionSession.nid,
								active: false,
								note: "New worker",
								script:
									"// Worker script\n// Available context: { session, wallet, config }\n\nasync function execute(ctx) {\n  // Your logic here\n  return {\n    status: 'success',\n    data: {}\n  };\n}\n\nreturn execute;",
								dependencies: [],
								version: "1.0.0",
							}),
						},
					);

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const data = await response.json();

					set({
						worker: {
							isLoading: false,
							isEditor: true,
						},
					});

					return data;
				} catch (error) {
					console.error("Failed to create worker:", error);
					set({
						worker: {
							isLoading: false,
							isEditor: false,
						},
					});
					return null;
				}
			},

			updateWorker: async (workerData: Worker): Promise<Worker | null> => {
				const connectionSession = useAuthStore.getState().connectionSession;

				if (!connectionSession) {
					console.error("No active connection");
					return null;
				}

				set({
					worker: {
						isLoading: true,
						isEditor: true,
					},
				});

				try {
					const response = await fetch(
						`${connectionSession.api}/ai-worker/set`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${connectionSession.token}`,
							},
							body: JSON.stringify(workerData.value.raw),
						},
					);

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const data = await response.json();

					// Update workers list
					set((state) => ({
						workers: state.workers.map((w) =>
							w.value.raw.sid === workerData.value.raw.sid ? data : w
						),
						worker: {
							isLoading: false,
							isEditor: true,
						},
					}));

					return data;
				} catch (error) {
					console.error("Failed to update worker:", error);
					set({
						worker: {
							isLoading: false,
							isEditor: true,
						},
					});
					return null;
				}
			},

			clearError: () => {
				set({ workersError: null });
			},
		}),
		{
			name: "Editor Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */
export const useWorkers = () => useEditorStore((state) => state.workers);
export const useWorkersLoading = () =>
	useEditorStore((state) => state.workersLoading);
export const useWorkersError = () =>
	useEditorStore((state) => state.workersError);
export const useWorkerActions = () =>
	useEditorStore((state) => ({
		listWorkers: state.listWorkers,
		setWorker: state.setWorker,
		updateWorker: state.updateWorker,
		clearError: state.clearError,
	}));

