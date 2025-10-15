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
 * Leader info data
 */
export interface LeaderInfo {
	workerId: string;
	hasLeader: boolean;
	leader: string | null;
	timestamp: number;
	expiresAt: number;
	renewedAt: number;
	expiresIn: number;
	isExpired: boolean;
}

/**
 * Worker statistics
 */
export interface WorkerStats {
	sid: string;
	executions: number;
	errors: number;
	errorRate: number;
	networkErrors: number;
	criticalErrors: number;
	isRunning: boolean;
	lastExecution?: number;
}

/**
 * Worker creation request
 */
export interface WorkerCreateRequest {
	scriptContent: string;
	dependencies: string[];
	version: string;
	executionMode: "parallel" | "leader" | "exclusive";
	priority: "critical" | "high" | "normal" | "low";
	mode?: "loop" | "single";
	accountId?: string;
	assignedNode?: string;
	note?: string;
}

/**
 * Editor Store Actions
 */
interface EditorStoreActions {
	/** Fetch all workers from API */
	listWorkers: () => Promise<void>;
	/** Create new worker with full configuration */
	createWorker: (request: WorkerCreateRequest) => Promise<Worker | null>;
	/** Legacy create method (deprecated) */
	setWorker: () => Promise<Worker | null>;
	/** Update existing worker */
	updateWorker: (workerData: Worker) => Promise<Worker | null>;
	/** Delete worker */
	deleteWorker: (sid: string) => Promise<boolean>;
	/** Get leader info for a worker */
	getLeaderInfo: (workerId: string) => Promise<LeaderInfo | null>;
	/** Get stats for all workers */
	getWorkerStats: () => Promise<WorkerStats[]>;
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
		(set) => ({
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
				const response = await fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "listWorkers",
						params: [],
						body: {},
					}),
				});

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

		createWorker: async (
			request: WorkerCreateRequest,
		): Promise<Worker | null> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {
				console.error("No active connection");
				return null;
			}

			set({
				worker: {
					isLoading: true,
					isEditor: false,
				},
			});

			try {
				const response = await fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "setWorker",
						params: [],
						body: request,
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				// Add to workers list
				set((state) => ({
					workers: [data, ...state.workers],
					worker: {
						isLoading: false,
						isEditor: true,
					},
				}));

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

		setWorker: async (): Promise<Worker | null> => {
			// Legacy method - use createWorker instead
			return await (get() as any).createWorker({
				scriptContent:
					"// Worker script\n// Available context: { Stels, logger }\n\nlogger.info('Worker started on node:', Stels.config.nid);\n\n// Your logic here\n",
				dependencies: ["gliesereum"],
				version: "1.19.2",
				executionMode: "parallel",
				priority: "normal",
				note: "New worker",
			});
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
				const response = await fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "updateWorker",
						params: [],
						body: {
							channel: workerData.value.channel,
							raw: workerData.value.raw,
						},
					}),
				});

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

		deleteWorker: async (sid: string): Promise<boolean> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {
				console.error("No active connection");
				return false;
			}

			try {
				const response = await fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "deleteWorker",
						params: [],
						body: { sid },
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				// Remove from local state
				set((state) => ({
					workers: state.workers.filter((w) => w.value.raw.sid !== sid),
				}));

				return true;
			} catch (error) {
				console.error("Failed to delete worker:", error);
				return false;
			}
		},

		getLeaderInfo: async (workerId: string): Promise<LeaderInfo | null> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {
				console.error("No active connection");
				return null;
			}

			try {
				const response = await fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "getLeaderInfo",
						params: [],
						body: { workerId },
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				return await response.json();
			} catch (error) {
				console.error("Failed to get leader info:", error);
				return null;
			}
		},

		getWorkerStats: async (): Promise<WorkerStats[]> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {
				console.error("No active connection");
				return [];
			}

			try {
				const response = await fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "getWorkerStats",
						params: [],
						body: {},
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				// Transform Map entries to array
				if (Array.isArray(data)) {
					return data.map(([sid, stats]: [string, any]) => ({
						sid,
						...stats,
					}));
				}

				return [];
			} catch (error) {
				console.error("Failed to get worker stats:", error);
				return [];
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

