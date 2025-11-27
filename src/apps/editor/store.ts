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
			scope?: "local" | "network";
			executionMode?: "parallel" | "leader" | "exclusive";
			priority?: "critical" | "high" | "normal" | "low";
			mode?: "loop" | "single";
			accountId?: string;
			assignedNode?: string;
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
	scope: "local" | "network";
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
	/** Migrate worker to network with new SID */
	migrateWorkerWithNewSid: (worker: Worker) => Promise<Worker | null>;
	/** Get leader info for a worker */
	getLeaderInfo: (workerId: string) => Promise<LeaderInfo | null>;
	/** Get stats for all workers */
	getWorkerStats: () => Promise<WorkerStats[]>;
	/** Stop all active workers */
	stopAllWorkers: () => Promise<{ stopped: number; failed: number; total: number }>;
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
		} catch {

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
			} catch {

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
			return await get().createWorker({
				scriptContent:
					"// Worker script\n// Available context: { Stels, logger }\n\nlogger.info('Worker started on node:', Stels.config.nid);\n\n// Your logic here\n",
				dependencies: ["gliesereum"],
				version: "1.19.2",
				scope: "local",
				executionMode: "leader",
				priority: "normal",
				note: "New worker",
			});
		},

		updateWorker: async (workerData: Worker): Promise<Worker | null> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {

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
			} catch {

				set({
					worker: {
						isLoading: false,
						isEditor: true,
					},
				});
				return null;
			}
		},

		migrateWorkerWithNewSid: async (worker: Worker): Promise<Worker | null> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {

				return null;
			}

			set({
				worker: {
					isLoading: true,
					isEditor: false,
				},
			});

			try {
				// Create new worker with network scope and all the same settings
				const createRequest: WorkerCreateRequest = {
					scriptContent: worker.value.raw.script,
					dependencies: worker.value.raw.dependencies,
					version: worker.value.raw.version,
					scope: "network", // Always migrate to network
					executionMode: worker.value.raw.executionMode || "parallel",
					priority: worker.value.raw.priority || "normal",
					mode: worker.value.raw.mode || "loop",
					accountId: worker.value.raw.accountId,
					assignedNode: worker.value.raw.assignedNode,
					note: `[Migrated] ${worker.value.raw.note}`,
				};

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
						body: createRequest,
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const newWorker = await response.json();

				// Add to workers list
				set((state) => ({
					workers: [newWorker, ...state.workers],
					worker: {
						isLoading: false,
						isEditor: true,
					},
				}));

				return newWorker;
			} catch {

				set({
					worker: {
						isLoading: false,
						isEditor: false,
					},
				});
				return null;
			}
		},

	getLeaderInfo: async (workerId: string): Promise<LeaderInfo | null> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {

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
			} catch {

				return null;
			}
		},

	getWorkerStats: async (): Promise<WorkerStats[]> => {
		const connectionSession = useAuthStore.getState().connectionSession;

		if (!connectionSession) {

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

			// API returns object with workers array
			if (data && data.workers && Array.isArray(data.workers)) {
				return data.workers.map((worker: {
					sid: string;
					executions?: number;
					errors?: number;
					errorRate?: string | number;
					networkErrors?: number;
					criticalErrors?: number;
					isRunning?: boolean;
					lastRun?: number;
				}) => {
					// Parse errorRate from "0.00%" format to number
					let errorRate = 0;
					if (typeof worker.errorRate === 'string') {
						errorRate = parseFloat(worker.errorRate.replace('%', '')) || 0;
					} else if (typeof worker.errorRate === 'number') {
						errorRate = worker.errorRate;
					}

					return {
						sid: worker.sid,
						executions: worker.executions || 0,
						errors: worker.errors || 0,
						errorRate: errorRate,
						networkErrors: worker.networkErrors || 0,
						criticalErrors: worker.criticalErrors || 0,
						isRunning: worker.isRunning || false,
						lastExecution: worker.lastRun || null,
					};
				});
			}

			return [];
		} catch {

			return [];
		}
	},

		stopAllWorkers: async (): Promise<{ stopped: number; failed: number; total: number }> => {
			const connectionSession = useAuthStore.getState().connectionSession;

			if (!connectionSession) {

				return { stopped: 0, failed: 0, total: 0 };
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
						method: "stopAllWorkers",
						params: [],
						body: {},
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const result = await response.json();

				// Refresh workers list
				await get().listWorkers();

				return {
					stopped: result.stopped || 0,
					failed: result.failed || 0,
					total: result.total || 0,
				};
			} catch {

				return { stopped: 0, failed: 0, total: 0 };
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
