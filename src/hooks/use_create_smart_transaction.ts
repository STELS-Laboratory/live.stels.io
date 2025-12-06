/**
 * Hook for creating and submitting smart transactions
 * Implements Smart Transactions API functionality
 */

import { useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores";
import { useNetworkStore } from "@/stores/modules/network.store";
import { usePublicAssetList } from "@/hooks/use_public_asset_list";
import {
	createSmartTransaction,
	calculateSmartTransactionFee,
	validateSmartTransaction,
	validateAddress,
	createCosignMethod,
	type SmartOp,
	type SmartTransaction,
	type Wallet,
} from "@/lib/gliesereum";
import type { RawAssetData } from "@/types/token";

/**
 * Submit smart transaction response
 */
export interface SubmitSmartTransactionResponse {
	success: boolean;
	tx_hash: string;
	status: string;
	validation?: {
		valid: boolean;
		errors: string[];
		warnings: string[];
	};
	pool_key?: string[];
	timestamp: number;
}

/**
 * Create smart transaction parameters
 */
export interface CreateSmartTransactionParams {
	wallet: Wallet;
	ops: SmartOp[];
	memo?: string;
	prevHash?: string | null;
	rawData?: string;
	methods?: Array<{
		id: string;
		approvers: string[];
		threshold: { k: number; n: number };
		deadlineMs?: number;
	}>;
}

/**
 * Hook return type
 */
export interface UseCreateSmartTransactionReturn {
	createTransaction: (
		params: CreateSmartTransactionParams,
	) => SmartTransaction;
	submitTransaction: (
		transaction: SmartTransaction,
	) => Promise<SubmitSmartTransactionResponse>;
	calculateFee: (ops: SmartOp[], rawBytes?: number) => string;
	submitting: boolean;
	error: string | null;
}

/**
 * Submit smart transaction to API
 */
async function submitSmartTransaction(
	transaction: SmartTransaction,
	apiUrl: string,
	session: string,
	network: string,
): Promise<SubmitSmartTransactionResponse> {
	// Validate transaction before submission
	if (!validateSmartTransaction(transaction)) {
		// Try to get more details about validation failure
		const validationErrors: string[] = [];
		
		// Check basic structure
		if (!transaction.type || transaction.type !== "smart") {
			validationErrors.push("Invalid transaction type");
		}
		if (!transaction.method || transaction.method !== "smart.exec") {
			validationErrors.push("Invalid transaction method");
		}
		if (!transaction.from || transaction.from.length !== 34) {
			validationErrors.push("Invalid sender address");
		}
		if (!transaction.fee || !/^\d+\.\d{6}$/.test(transaction.fee)) {
			validationErrors.push(`Invalid fee format: ${transaction.fee}`);
		}
		if (!transaction.currency || transaction.currency !== "SLI") {
			validationErrors.push(`Invalid currency: ${transaction.currency}`);
		}
		if (!transaction.signatures || transaction.signatures.length === 0) {
			validationErrors.push("Missing signatures");
		}
		if (!transaction.args || !transaction.args.ops || transaction.args.ops.length === 0) {
			validationErrors.push("Missing or empty operations");
		}
		
		// Validate operations
		if (transaction.args?.ops) {
			for (let i = 0; i < transaction.args.ops.length; i++) {
				const op = transaction.args.ops[i];
				if (!op.op) {
					validationErrors.push(`Operation ${i}: missing op type`);
				}
				if (op.op === "transfer") {
					if (!op.to || op.to.length !== 34) {
						validationErrors.push(`Operation ${i}: invalid recipient address`);
					}
					if (!op.amount || !/^\d+\.\d{6}$/.test(op.amount)) {
						validationErrors.push(`Operation ${i}: invalid amount format: ${op.amount}`);
					}
				}
			}
		}
		
		const errorDetails = validationErrors.length > 0
			? `: ${validationErrors.join(", ")}`
			: "";
		throw new Error(`Invalid smart transaction${errorDetails}`);
	}

	const response = await fetch(apiUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"stels-session": session,
		},
		body: JSON.stringify({
			webfix: "1.0",
			method: "submitSmartTransaction",
			params: [network],
			body: {
				transaction,
			},
		}),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(
			`Transaction submission failed: ${
				error.error?.message || response.statusText
			}`,
		);
	}

	const data: { result?: SubmitSmartTransactionResponse } =
		await response.json();
	if (!data.result) {
		throw new Error("Invalid response from server");
	}

	return data.result;
}

/**
 * Hook for creating and submitting smart transactions
 */
export function useCreateSmartTransaction(): UseCreateSmartTransactionReturn {
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const { connectionSession } = useAuthStore();
	const { currentNetworkId } = useNetworkStore();
	
	// Get network ID
	const networkId = connectionSession?.network || currentNetworkId;
	
	// Get raw assets to find genesis document for chain_id
	const { assets: rawAssets } = usePublicAssetList({
		network: networkId,
	});
	
	// Extract chain_id from genesis document
	const chainId = useMemo((): number => {
		// Find genesis document
		const genesisDoc = rawAssets?.find((asset) => {
			const isGenesisDoc = asset.channel?.includes(".genesis:") ||
				(asset.raw?.genesis && !asset.raw.genesis.token &&
					asset.raw.genesis.genesis);
			return isGenesisDoc;
		}) as RawAssetData | undefined;
		
		// Extract chain_id from genesis document
		if (genesisDoc?.raw?.genesis?.network?.chain_id !== undefined) {
			return genesisDoc.raw.genesis.network.chain_id;
		}
		
		// Default to 2 for testnet (as per protocol)
		return 2;
	}, [rawAssets]);

	const handleCreateTransaction = useCallback(
		(params: CreateSmartTransactionParams): SmartTransaction => {
			try {
				setError(null);

				// Validate operations
				if (!params.ops || params.ops.length === 0) {
					throw new Error("At least one operation is required");
				}
				if (params.ops.length > 16) {
					throw new Error("Maximum 16 operations allowed");
				}

				// Validate addresses in operations
				for (const op of params.ops) {
					if (op.op === "transfer") {
						if (!validateAddress(op.to)) {
							throw new Error(`Invalid recipient address: ${op.to}`);
						}
					}
					if (op.op === "assert.balance") {
						if (!validateAddress(op.address)) {
							throw new Error(`Invalid address: ${op.address}`);
						}
					}
				}

				// Calculate fee
				const rawBytes = params.rawData
					? new TextEncoder().encode(params.rawData).length
					: 0;
				const fee = calculateSmartTransactionFee(params.ops, rawBytes);

				// Create cosign methods if provided
				const cosignMethods = params.methods && params.methods.length > 0
					? params.methods.map((method) =>
						createCosignMethod(
							method.id,
							method.approvers,
							method.threshold,
							method.deadlineMs,
						)
					)
					: undefined;

				// Create transaction with chain_id and methods (methods must be in signing view)
				const tx = createSmartTransaction(
					params.wallet,
					params.ops,
					fee,
					params.memo,
					params.prevHash || null,
					params.rawData,
					chainId,
					cosignMethods,
				);

				return tx;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to create smart transaction";
				setError(errorMessage);
				throw err;
			}
		},
		[chainId],
	);

	const handleSubmitTransaction = useCallback(
		async (
			transaction: SmartTransaction,
		): Promise<SubmitSmartTransactionResponse> => {
			if (!connectionSession) {
				throw new Error("Not connected to network");
			}

			setSubmitting(true);
			setError(null);

			try {
				const result = await submitSmartTransaction(
					transaction,
					connectionSession.api,
					connectionSession.session,
					connectionSession.network,
				);
				return result;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to submit smart transaction";
				setError(errorMessage);
				throw err;
			} finally {
				setSubmitting(false);
			}
		},
		[connectionSession],
	);

	const handleCalculateFee = useCallback(
		(ops: SmartOp[], rawBytes?: number): string => {
			try {
				return calculateSmartTransactionFee(ops, rawBytes || 0);
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to calculate fee";
				setError(errorMessage);
				return "0.000100"; // Fallback to base fee
			}
		},
		[],
	);

	return {
		createTransaction: handleCreateTransaction,
		submitTransaction: handleSubmitTransaction,
		calculateFee: handleCalculateFee,
		submitting,
		error,
	};
}

