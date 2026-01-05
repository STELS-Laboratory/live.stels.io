/**
 * Editor application store
 * Manages AMI Workers/Protocols state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useNetworkStore } from "@/stores/modules/network.store";
import { toast } from "@/stores";
import { retryOnNetworkError } from "./utils/retry.ts";
import { WebfixApiClient } from "@/lib/webfix-api-client";
import type {
	Worker,
	LeaderInfo,
	WorkerStats,
	WorkerCreateRequest,
	EditorStore,
} from "@/types/apps/editor/types";

export type {
	Worker,
	LeaderInfo,
	WorkerStats,
	WorkerCreateRequest,
	EditorStore,
};

/**
 * Helper function to convert API response to Worker format
 */
function convertToWorker(data: {
	value?: {
		channel: string;
		raw: { sid?: string; [key: string]: unknown };
		[key: string]: unknown;
	};
	key?: string[];
	channel?: string;
	sid?: string;
	raw?: { sid?: string; [key: string]: unknown };
}): Worker {
	if (data.value) {
		return {
			key: ["ami", "worker", data.value.raw?.sid || ""],
			value: data.value as Worker["value"],
		};
	}
	if (data.key && "value" in data && data.value) {
		return data as Worker;
	}
	return {
		key: ["ami", "worker", data.sid || data.raw?.sid || ""],
		value: {
			channel: data.channel || `ami.worker.${data.sid || data.raw?.sid || ""}`,
			raw: (data.raw || data) as Worker["value"]["raw"],
		},
	};
}

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
			const networkId = useNetworkStore.getState().currentNetworkId;

			if (!connectionSession) {
				set({
					workersError: "No active connection",
					workersLoading: false,
				});
				return;
			}

			set({ workersLoading: true, workersError: null });

			try {
				const client = new WebfixApiClient(connectionSession.api);
				client.setSession(connectionSession.session);

				const data = await retryOnNetworkError(() =>
					client.request<Worker[]>("listWorkers", {}, [networkId])
				);

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
				console.error("Failed to list workers:", error);
				const errorMessage = error instanceof Error ? error.message : "Failed to fetch workers";
				set({
					workersError: errorMessage,
					workersLoading: false,
				});
				toast.error("Failed to load workers", errorMessage);
			}
		},

		createWorker: async (
			request: WorkerCreateRequest,
		): Promise<Worker | null> => {
			const connectionSession = useAuthStore.getState().connectionSession;
			const networkId = useNetworkStore.getState().currentNetworkId;

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
				const client = new WebfixApiClient(connectionSession.api);
				client.setSession(connectionSession.session);

				const data = await retryOnNetworkError(() =>
					client.request<{
						value?: {
							channel: string;
							raw: { sid?: string; [key: string]: unknown };
							[key: string]: unknown;
						};
						key?: string[];
						channel?: string;
						sid?: string;
						raw?: { sid?: string; [key: string]: unknown };
					}>("setWorker", request, [networkId])
				);

				const workerData = convertToWorker(data);

				// Add to workers list
				set((state) => ({
					workers: [workerData, ...state.workers],
					worker: {
						isLoading: false,
						isEditor: true,
					},
				}));

				return workerData;
			} catch (error) {
				console.error("Failed to create worker:", error);
				const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
				toast.error("Failed to create worker", errorMessage);
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
			const networkId = useNetworkStore.getState().currentNetworkId;

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
				const client = new WebfixApiClient(connectionSession.api);
				client.setSession(connectionSession.session);

				// API expects FULL raw object with ALL fields (not partial update)
				// Format: { channel, raw } where raw contains all worker fields including sid
				const body = {
					channel: workerData.value.channel,
					raw: workerData.value.raw,
				};

				console.log("updateWorker request body:", JSON.stringify(body, null, 2));

				const data = await retryOnNetworkError(() =>
					client.request<{
						value?: {
							channel: string;
							raw: { sid?: string; [key: string]: unknown };
							[key: string]: unknown;
						};
						key?: string[];
						channel?: string;
						sid?: string;
						raw?: { sid?: string; [key: string]: unknown };
					}>("updateWorker", body, [networkId])
				);

				console.log("updateWorker response data:", JSON.stringify(data, null, 2));

				const result = convertToWorker(data);

				// Update workers list
				set((state) => ({
					workers: state.workers.map((w) =>
						w.value.raw.sid === workerData.value.raw.sid ? result : w
					),
					worker: {
						isLoading: false,
						isEditor: true,
					},
				}));

				return result;
			} catch (error) {
				console.error("Failed to update worker:", error);
				const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
				toast.error("Failed to update worker", errorMessage);
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
			const networkId = useNetworkStore.getState().currentNetworkId;

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

				const client = new WebfixApiClient(connectionSession.api);
				client.setSession(connectionSession.session);

				const data = await retryOnNetworkError(() =>
					client.request<{
						value?: {
							channel: string;
							raw: { sid?: string; [key: string]: unknown };
							[key: string]: unknown;
						};
						key?: string[];
						channel?: string;
						sid?: string;
						raw?: { sid?: string; [key: string]: unknown };
					}>("setWorker", createRequest, [networkId])
				);

				const result = convertToWorker(data);

				// Add to workers list
				set((state) => ({
					workers: [result, ...state.workers],
					worker: {
						isLoading: false,
						isEditor: true,
					},
				}));

				return result;
			} catch (error) {
				console.error("Failed to migrate worker:", error);
				toast.error(
					"Failed to migrate worker",
					error instanceof Error ? error.message : "Unknown error occurred",
				);
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
			const networkId = useNetworkStore.getState().currentNetworkId;

			if (!connectionSession) {
				return null;
			}

			try {
				const client = new WebfixApiClient(connectionSession.api);
				client.setSession(connectionSession.session);

				const result = await retryOnNetworkError(() =>
					client.request<LeaderInfo>("getLeaderInfo", { workerId }, [networkId])
				);

				return result;
			} catch (error) {
				console.error("Failed to get leader info:", error);
				toast.error(
					"Failed to load leader info",
					error instanceof Error ? error.message : "Unknown error occurred",
				);
				return null;
			}
		},

	getWorkerStats: async (): Promise<WorkerStats[]> => {
		const connectionSession = useAuthStore.getState().connectionSession;
		const networkId = useNetworkStore.getState().currentNetworkId;

		if (!connectionSession) {
			return [];
		}

		try {
			const client = new WebfixApiClient(connectionSession.api);
			client.setSession(connectionSession.session);

			const data = await retryOnNetworkError(() =>
				client.request<{ workers?: WorkerStats[] }>("getWorkerStats", {}, [networkId])
			);

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
						lastExecution: worker.lastRun || undefined,
					};
				});
			}

			return [];
		} catch (error) {
			console.error("Failed to get worker stats:", error);
			toast.error(
				"Failed to load worker statistics",
				error instanceof Error ? error.message : "Unknown error occurred",
			);
			return [];
		}
	},

		stopAllWorkers: async (): Promise<{ stopped: number; failed: number; total: number }> => {
			const connectionSession = useAuthStore.getState().connectionSession;
			const networkId = useNetworkStore.getState().currentNetworkId;

			if (!connectionSession) {
				return { stopped: 0, failed: 0, total: 0 };
			}

			try {
				const client = new WebfixApiClient(connectionSession.api);
				client.setSession(connectionSession.session);

				const result = await retryOnNetworkError(() =>
					client.request<{ stopped?: number; failed?: number; total?: number }>(
						"stopAllWorkers",
						{},
						[networkId]
					)
				);

				// Refresh workers list
				await get().listWorkers();

				return {
					stopped: result.stopped || 0,
					failed: result.failed || 0,
					total: result.total || 0,
				};
			} catch (error) {
				console.error("Failed to stop all workers:", error);
				toast.error(
					"Failed to stop all workers",
					error instanceof Error ? error.message : "Unknown error occurred",
				);
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
