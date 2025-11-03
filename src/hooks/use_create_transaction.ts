/**
 * Hook for creating and submitting asset transactions
 * Implements createAssetTransaction and submitAssetTransaction functionality
 */

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores";
import {
	deterministicStringify,
	signWithDomain,
	validateAddress,
} from "@/lib/gliesereum";
import { sha256 } from "@noble/hashes/sha256";
import { toHex } from "@/lib/gliesereum";
import type { Wallet } from "@/lib/gliesereum";

/**
 * Token genesis document structure
 */
export interface TokenGenesisDocument {
	$schema: string;
	version: string;
	network: {
		id: string;
		name: string;
		environment: string;
		chain_id: number;
	};
	protocol: {
		tx_version: string;
		vm_version: string;
		canonicalization: string;
		encoding: string;
		sign_domains: {
			token: (string | number)[];
		};
	};
	token: {
		id: string;
		metadata: {
			name: string;
			symbol: string;
			decimals: number;
		};
	};
	parameters: {
		currency: {
			symbol: string;
			decimals: number;
		};
		fees: {
			base: string;
			per_byte: string;
			currency: string;
		};
	};
}

/**
 * Asset transaction structure
 */
export interface AssetTransaction {
	type: "asset.transfer";
	version: string;
	network: {
		id: string;
		chain_id: number;
	};
	token_id: string;
	from: string;
	to: string;
	amount: string;
	fee: string;
	currency: string;
	timestamp: number;
	prev_hash: string | null;
	memo?: string;
	signatures: Array<{
		kid: string;
		alg: "ecdsa-secp256k1";
		sig: string;
	}>;
}

/**
 * Create transaction parameters
 */
export interface CreateTransactionParams {
	wallet: Wallet;
	tokenGenesis: TokenGenesisDocument;
	to: string;
	amount: string;
	fee: string;
	prevHash?: string | null;
	memo?: string;
}

/**
 * Submit transaction response
 */
export interface SubmitTransactionResponse {
	success: boolean;
	tx_hash: string;
	status: string;
	pool_key: string[];
	timestamp: number;
}

/**
 * Hook return type
 */
export interface UseCreateTransactionReturn {
	createTransaction: (
		params: CreateTransactionParams,
	) => AssetTransaction;
	submitTransaction: (
		transaction: AssetTransaction,
	) => Promise<SubmitTransactionResponse>;
	submitting: boolean;
	error: string | null;
}

/**
 * Calculate transaction hash
 */
function calculateTransactionHash(
	transaction: Omit<AssetTransaction, "signatures">,
): string {
	const transactionString = deterministicStringify(transaction);
	const hash = sha256(new TextEncoder().encode(transactionString));
	return toHex(hash);
}

/**
 * Sign asset transaction
 */
function signAssetTransaction(
	txHash: string,
	wallet: Wallet,
	signDomain: (string | number)[],
): string {
	const signature = signWithDomain(
		txHash,
		wallet.privateKey,
		signDomain.map(String),
	);
	return signature;
}

/**
 * Create asset transaction
 */
export function createAssetTransaction(
	params: CreateTransactionParams,
): AssetTransaction {
	const { wallet, tokenGenesis, to, amount, fee, prevHash = null, memo } =
		params;

	// Validate inputs
	if (!validateAddress(to)) {
		throw new Error("Invalid recipient address");
	}

	if (!/^\d+\.\d+$/.test(amount)) {
		throw new Error("Invalid amount format (must be decimal string)");
	}

	if (!/^\d+\.\d+$/.test(fee)) {
		throw new Error("Invalid fee format (must be decimal string)");
	}

	// Get signing domain
	const signDomain = tokenGenesis.protocol.sign_domains.token;
	if (!Array.isArray(signDomain) || signDomain.length === 0) {
		throw new Error("Invalid sign_domains in token genesis");
	}

	// Build transaction without signatures
	const transactionBase: Omit<AssetTransaction, "signatures"> = {
		type: "asset.transfer",
		version: tokenGenesis.protocol.tx_version,
		network: {
			id: tokenGenesis.network.id,
			chain_id: tokenGenesis.network.chain_id,
		},
		token_id: tokenGenesis.token.id,
		from: wallet.address,
		to,
		amount,
		fee,
		currency: tokenGenesis.parameters.currency.symbol,
		timestamp: Date.now(),
		prev_hash: prevHash,
		...(memo && { memo }),
	};

	// Calculate transaction hash
	const txHash = calculateTransactionHash(transactionBase);

	// Sign transaction
	const signature = signAssetTransaction(txHash, wallet, signDomain);

	// Build final transaction
	return {
		...transactionBase,
		signatures: [
			{
				kid: wallet.publicKey,
				alg: "ecdsa-secp256k1",
				sig: signature,
			},
		],
	};
}

/**
 * Submit asset transaction to API
 */
async function submitAssetTransaction(
	transaction: AssetTransaction,
	apiUrl: string,
	session: string,
): Promise<SubmitTransactionResponse> {
	const response = await fetch(apiUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"stels-session": session,
		},
		body: JSON.stringify({
			webfix: "1.0",
			method: "submitAssetTransaction",
			params: [transaction.network.id],
			body: {
				transaction,
			},
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(
			`Transaction submission failed: ${
				error.error?.message || response.statusText
			}`,
		);
	}

	const data: { result?: SubmitTransactionResponse } = await response.json();
	if (!data.result) {
		throw new Error("Invalid response from server");
	}

	return data.result;
}

/**
 * Hook for creating and submitting transactions
 */
export function useCreateTransaction(): UseCreateTransactionReturn {
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const { connectionSession } = useAuthStore();

	const handleCreateTransaction = useCallback(
		(params: CreateTransactionParams): AssetTransaction => {
			try {
				setError(null);
				return createAssetTransaction(params);
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to create transaction";
				setError(errorMessage);
				throw err;
			}
		},
		[],
	);

	const handleSubmitTransaction = useCallback(
		async (
			transaction: AssetTransaction,
		): Promise<SubmitTransactionResponse> => {
			if (!connectionSession) {
				throw new Error("Not connected to network");
			}

			setSubmitting(true);
			setError(null);

			try {
				const result = await submitAssetTransaction(
					transaction,
					connectionSession.api,
					connectionSession.session,
				);
				return result;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to submit transaction";
				setError(errorMessage);
				throw err;
			} finally {
				setSubmitting(false);
			}
		},
		[connectionSession],
	);

	return {
		createTransaction: handleCreateTransaction,
		submitTransaction: handleSubmitTransaction,
		submitting,
		error,
	};
}

