/**
 * Editor application store
 * Manages AMI Workers/Protocols state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useNetworkStore } from "@/stores/modules/network.store";
import {
	importWallet,
	deterministicStringify,
	signWithDomain,
	getAddressFromPublicKey,
} from "@/lib/gliesereum";
import { toast } from "@/stores";
import { retryOnNetworkError } from "./utils/retry.ts";
import type {
	Worker,
	LeaderInfo,
	WorkerStats,
	WorkerCreateRequest,
	EditorStore,
} from "@/types/apps/editor/types";
import type { SmartTransaction, SmartOp } from "@/lib/gliesereum/types";

export type {
	Worker,
	LeaderInfo,
	WorkerStats,
	WorkerCreateRequest,
	EditorStore,
};

/**
 * Helper function to sign payment transaction with domain separation
 * This matches the API documentation requirements for signing transactions
 */
function signPaymentTransaction(
	paymentTx: SmartTransaction,
	networkId: string,
): SmartTransaction {
	const wallet = useAuthStore.getState().wallet;
	if (!wallet) {
		throw new Error("Wallet not available. Please connect your wallet.");
	}

	if (!paymentTx || !paymentTx.args?.ops) {
		throw new Error("Invalid payment transaction structure");
	}

	// Normalize operations - ensure amount format is correct (X.XXXXXX)
	const normalizedOps: SmartOp[] = paymentTx.args.ops.map((op: unknown) => {
		const operation = op as Record<string, unknown>;
		if (operation.op === "transfer") {
			// Normalize amount to format X.XXXXXX (required by validation)
			// Handle both string and number formats
			let amount: string;
			if (typeof operation.amount === "number") {
				amount = operation.amount.toString();
			} else {
				amount = String(operation.amount || "0");
			}
			
			// If amount doesn't have decimal part, add .000000
			if (!amount.includes(".")) {
				amount = `${amount}.000000`;
			} else {
				// Ensure exactly 6 decimal places
				const [intPart, decPart = ""] = amount.split(".");
				amount = `${intPart}.${decPart.padEnd(6, "0").slice(0, 6)}`;
			}
			
			const normalizedOp: SmartOp = {
				op: "transfer",
				to: String(operation.to || ""),
				amount,
				...(operation.memo && { memo: String(operation.memo) }),
			};
			
			return normalizedOp;
		}
		// For other operation types, return as-is
		return operation as SmartOp;
	});

	// Validate normalized operations before signing
	for (const op of normalizedOps) {
		if (op.op === "transfer") {
			if (!op.to || op.to.length !== 34) {
				throw new Error(`Invalid 'to' address in transfer operation: ${op.to}`);
			}
			if (!op.amount || !/^\d+\.\d{6}$/.test(op.amount)) {
				throw new Error(`Invalid amount format in transfer operation: ${op.amount}`);
			}
		}
	}

	// Import wallet from private key
	const walletInstance = importWallet(wallet.privateKey);

	// Determine chain ID based on network
	// mainnet = 1, testnet = 2, localnet = 2 (uses testnet chain)
	const chainId = networkId === "mainnet" ? 1 : 2;

	// Create signing view (EXCLUDE: hash, signatures, cosigs, verified, status, validators)
	const signingView: Omit<SmartTransaction, "signatures" | "cosigs" | "hash"> = {
		type: paymentTx.type,
		method: paymentTx.method,
		args: {
			ops: normalizedOps,
			memo: paymentTx.args.memo,
		},
		from: walletInstance.address, // Use wallet address
		fee: paymentTx.fee,
		currency: paymentTx.currency,
		prev_hash: paymentTx.prev_hash, // Keep null, system will fill automatically
		timestamp: paymentTx.timestamp,
	};

	// Canonicalize signing view
	const canonicalData = deterministicStringify(signingView);

	// Define domain for signing: ["STELS-TX", chainId, "smart-1.0", "chain:{chainId}"]
	const domain: (string | number)[] = [
		"STELS-TX",
		chainId,
		"smart-1.0",
		`chain:${chainId}`,
	];

	// Sign with domain separation
	const signature = signWithDomain(canonicalData, walletInstance.privateKey, domain);

	// Verify address matches public key
	const addressFromKey = getAddressFromPublicKey(walletInstance.publicKey);
	if (addressFromKey !== walletInstance.address) {
		throw new Error(
			`Address mismatch: ${addressFromKey} !== ${walletInstance.address}`,
		);
	}

	// Create signed transaction
	const signedTx: SmartTransaction = {
		...signingView,
		signatures: [
			{
				kid: walletInstance.publicKey,
				alg: "ecdsa-secp256k1",
				sig: signature,
			},
		],
	};

	// DO NOT add hash - system will compute it automatically during validation
	return signedTx;
}

/**
 * Helper function to handle payment for worker operations
 */
async function handleWorkerPayment(
	apiUrl: string,
	session: string,
	method: "setWorker" | "updateWorker",
	body: Record<string, unknown>,
	networkId: string,
): Promise<Worker> {
	// First request - get payment transaction structure
	const feeResponse = await retryOnNetworkError(() =>
		fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"stels-session": session,
			},
			body: JSON.stringify({
				webfix: "1.0",
				method,
				params: [networkId],
				body,
			}),
		}),
	);

	const feeData = await feeResponse.json();

	if (feeResponse.status === 402) {
		// Payment required - sign and submit transaction
		const paymentTx = feeData.paymentTransaction as SmartTransaction;
		const signedTx = signPaymentTransaction(paymentTx, networkId);

		// Submit with signed transaction
		const createResponse = await retryOnNetworkError(() =>
			fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"stels-session": session,
				},
				body: JSON.stringify({
					webfix: "1.0",
					method,
					params: [networkId],
					body: {
						...body,
						paymentTransaction: signedTx,
					},
				}),
			}),
		);

		if (!createResponse.ok) {
			const errorData = await createResponse.json();
			if (errorData.error === "Payment transaction validation failed") {
				const errors = errorData.errors || [];
				if (errors.some((e: string) => e.includes("Insufficient balance"))) {
					throw new Error("Insufficient balance. Please add funds to your wallet.");
				}
				if (errors.some((e: string) => e.includes("Invalid signature"))) {
					throw new Error("Transaction signature validation failed.");
				}
				throw new Error(`Payment failed: ${errors.join(", ")}`);
			}
			throw new Error(`HTTP error! status: ${createResponse.status}`);
		}

		const result = await createResponse.json();
		// Server returns: { value: { channel, raw, ... }, fee: {...} }
		// Need to convert to Worker format: { key: [...], value: { channel, raw, ... } }
		if (result.value) {
			const workerValue = result.value;
			// Construct Worker format
			const worker: Worker = {
				key: ["ami", "worker", workerValue.raw?.sid || ""],
				value: workerValue,
			};
			return worker;
		}
		// If no 'value', check if result itself is a worker
		if (result.raw || result.sid) {
			// Already in Worker format or needs conversion
			if (result.key && result.value) {
				return result as Worker;
			}
			// Convert to Worker format
			return {
				key: ["ami", "worker", result.sid || result.raw?.sid || ""],
				value: {
					channel: result.channel || `ami.worker.${result.sid || result.raw?.sid || ""}`,
					raw: result.raw || result,
				},
			} as Worker;
		}
		throw new Error("Invalid response format from server");
	} else if (feeResponse.ok) {
		// Payment not required or already provided
		// Server returns: { value: { channel, raw, ... }, fee: {...} }
		// Need to convert to Worker format: { key: [...], value: { channel, raw, ... } }
		if (feeData.value) {
			const workerValue = feeData.value;
			// Construct Worker format
			const worker: Worker = {
				key: ["ami", "worker", workerValue.raw?.sid || ""],
				value: workerValue,
			};
			return worker;
		}
		// If no 'value', check if feeData itself is a worker
		if (feeData.raw || feeData.sid) {
			// Already in Worker format or needs conversion
			if (feeData.key && feeData.value) {
				return feeData as Worker;
			}
			// Convert to Worker format
			return {
				key: ["ami", "worker", feeData.sid || feeData.raw?.sid || ""],
				value: {
					channel: feeData.channel || `ami.worker.${feeData.sid || feeData.raw?.sid || ""}`,
					raw: feeData.raw || feeData,
				},
			} as Worker;
		}
		throw new Error("Invalid response format from server");
	} else {
		throw new Error(`Failed to process worker: ${feeData.error || "Unknown error"}`);
	}
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
				const response = await retryOnNetworkError(() =>
					fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "listWorkers",
						params: [networkId],
						body: {},
					}),
					}),
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
				// If paymentTransaction is already provided, use direct API call
				// Otherwise, use payment handler to get and sign transaction
				if (request.paymentTransaction) {
					const response = await retryOnNetworkError(() =>
						fetch(connectionSession.api, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"stels-session": connectionSession.session,
							},
							body: JSON.stringify({
								webfix: "1.0",
								method: "setWorker",
								params: [networkId],
								body: request,
							}),
						}),
					);

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const data = await response.json();
				// Server returns: { value: { channel, raw, ... }, fee: {...} }
				// Convert to Worker format
				let workerData: Worker;
				if (data.value) {
					workerData = {
						key: ["ami", "worker", data.value.raw?.sid || ""],
						value: data.value,
					};
				} else if (data.key) {
					workerData = data as Worker;
				} else {
						// Fallback: try to construct from data
						workerData = {
							key: ["ami", "worker", data.sid || data.raw?.sid || ""],
							value: {
								channel: data.channel || `ami.worker.${data.sid || data.raw?.sid || ""}`,
								raw: data.raw || data,
							},
						};
					}

					// Add to workers list
					set((state) => ({
						workers: [workerData, ...state.workers],
						worker: {
							isLoading: false,
							isEditor: true,
						},
					}));

					return workerData;
				}

				// Use payment handler to get and sign transaction
				const body = { ...request };
				delete (body as { paymentTransaction?: SmartTransaction }).paymentTransaction;

				const data = await handleWorkerPayment(
					connectionSession.api,
					connectionSession.session,
					"setWorker",
					body,
					networkId,
				);

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
				const body = {
					channel: workerData.value.channel,
					raw: workerData.value.raw,
				};

				const result = await handleWorkerPayment(
					connectionSession.api,
					connectionSession.session,
					"updateWorker",
					body,
					networkId,
				);

				// result is already in Worker format from handleWorkerPayment
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

				const networkId = useNetworkStore.getState().currentNetworkId;
				const body = { ...createRequest };
				delete (body as { paymentTransaction?: SmartTransaction }).paymentTransaction;

				const result = await handleWorkerPayment(
					connectionSession.api,
					connectionSession.session,
					"setWorker",
					body,
					networkId,
				);

				// result is already in Worker format from handleWorkerPayment
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
				const response = await retryOnNetworkError(() =>
					fetch(connectionSession.api, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"stels-session": connectionSession.session,
						},
						body: JSON.stringify({
							webfix: "1.0",
							method: "getLeaderInfo",
							params: [networkId],
							body: { workerId },
						}),
					}),
				);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				return await response.json();
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
			const response = await retryOnNetworkError(() =>
				fetch(connectionSession.api, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"stels-session": connectionSession.session,
					},
					body: JSON.stringify({
						webfix: "1.0",
						method: "getWorkerStats",
						params: [networkId],
						body: {},
					}),
				}),
			);

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
				// First request - get payment transaction structure
				const feeResponse = await retryOnNetworkError(() =>
					fetch(connectionSession.api, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"stels-session": connectionSession.session,
						},
						body: JSON.stringify({
							webfix: "1.0",
							method: "stopAllWorkers",
							params: [networkId],
							body: {},
						}),
					}),
				);

				const feeData = await feeResponse.json();

				if (feeResponse.status === 402) {
					// Payment required - sign and submit transaction
					const paymentTx = feeData.paymentTransaction as SmartTransaction;
					const signedTx = signPaymentTransaction(paymentTx, networkId);

					// Submit with signed transaction
					const response = await retryOnNetworkError(() =>
						fetch(connectionSession.api, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"stels-session": connectionSession.session,
							},
							body: JSON.stringify({
								webfix: "1.0",
								method: "stopAllWorkers",
								params: [networkId],
								body: {
									paymentTransaction: signedTx,
								},
							}),
						}),
					);

					if (!response.ok) {
						const errorData = await response.json();
						if (errorData.error === "Payment transaction validation failed") {
							const errors = errorData.errors || [];
							if (errors.some((e: string) => e.includes("Insufficient balance"))) {
								throw new Error("Insufficient balance. Please add funds to your wallet.");
							}
							if (errors.some((e: string) => e.includes("Invalid signature"))) {
								throw new Error("Transaction signature validation failed.");
							}
							throw new Error(`Payment failed: ${errors.join(", ")}`);
						}
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
				} else if (feeResponse.ok) {
					// Payment not required (e.g., treasury address)
					const result = feeData;

					// Refresh workers list
					await get().listWorkers();

					return {
						stopped: result.stopped || 0,
						failed: result.failed || 0,
						total: result.total || 0,
					};
				} else {
					throw new Error(`Failed to stop workers: ${feeData.error || "Unknown error"}`);
				}
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
