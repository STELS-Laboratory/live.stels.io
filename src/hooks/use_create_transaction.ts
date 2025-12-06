/**
 * Hook for creating and submitting asset transactions
 * Implements createAssetTransaction and submitAssetTransaction functionality
 */

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores";
import {
	deterministicStringify,
	sign,
	validateAddress,
} from "@/lib/gliesereum";
import { sha256 } from "@noble/hashes/sha256";
import { toHex } from "@/lib/gliesereum";
import type { Wallet } from "@/lib/gliesereum";

/**
 * Token genesis document structure
 * Compatible with genesis-smart-1.0.json schema
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
			tx: (string | number)[]; // Primary: for transactions (genesis-smart-1.0)
			cosign?: (string | number)[];
			notary?: (string | number)[];
			genesis?: (string | number)[];
			crl?: (string | number)[];
			token?: (string | number)[]; // Legacy: backward compatibility
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
 * Transaction result from API (matches getAllMyTransactions format)
 */
export interface TransactionResultItem {
	transaction: AssetTransaction;
	status: "pending" | "confirmed" | "failed";
	submitted_at: number;
	tx_hash: string;
	pool_key: string[];
	consensus_status?: "pending" | "confirmed" | "not_found";
	finalized?: boolean;
}

/**
 * Submit transaction response
 * Supports both direct response format and transactions array format
 */
export interface SubmitTransactionResponse {
	success: boolean;
	address?: string;
	network?: string;
	// Direct format (from submitAssetTransaction)
	tx_hash?: string;
	status?: string;
	pool_key?: string[];
	timestamp?: number;
	consensus_hash?: string;
	consensus_valid?: boolean;
	consensus_errors?: string[];
	// Extended fields (from transactions array format)
	consensus_status?: "pending" | "confirmed" | "not_found";
	finalized?: boolean;
	// Array format (extended response)
	transactions?: TransactionResultItem[];
	total?: number;
	limit?: number;
	offset?: number;
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
 * Check if token is native (native:network format)
 */
function isNativeToken(tokenId: string): boolean {
	return tokenId.startsWith("native:");
}

/**
 * Convert decimal amount to base units (for consensus format)
 */
function toBaseUnits(amount: string, decimals: number): string {
	const num = Number.parseFloat(amount);
	if (Number.isNaN(num) || num < 0) {
		return "0";
	}
	const raw = Math.floor(num * Math.pow(10, decimals));
	return raw.toString();
}

/**
 * Convert asset transaction to consensus format (smart transaction format for native tokens)
 * According to CLIENT_TRANSACTION_UTILS.md
 * 
 * For native tokens, asset transactions must be converted to smart transaction format:
 * - type: "smart"
 * - method: "smart.exec"
 * - args.ops: [{ op: "transfer", to: ..., amount: ... }] (amount in base units)
 * - fee: remains in decimal format (not converted to base units)
 */
function convertToConsensusFormat(
	transaction: Omit<AssetTransaction, "signatures">,
	decimals: number,
): Record<string, unknown> {
	// Convert amount from decimal to base units for the transfer operation
	const amountBase = toBaseUnits(transaction.amount, decimals);
	
	// Fee remains in decimal format (not converted to base units)
	// According to CLIENT_TRANSACTION_UTILS.md: "Fee остается в десятичном формате"

	// Convert to smart transaction format (consensus format)
	const consensusTx: Record<string, unknown> = {
		type: "smart",
		method: "smart.exec",
		args: {
			ops: [
				{
					op: "transfer",
					to: transaction.to,
					amount: amountBase, // Amount in base units
				},
			],
			// Add memo only if present
			...(transaction.memo && { memo: transaction.memo }),
		},
		from: transaction.from,
		fee: transaction.fee, // Fee in decimal format (not converted)
		currency: transaction.currency,
		timestamp: transaction.timestamp,
		prev_hash: transaction.prev_hash ?? null,
	};

	return consensusTx;
}

/**
 * Calculate transaction hash (for custom tokens)
 */
function calculateTransactionHash(
	transaction: Omit<AssetTransaction, "signatures">,
): string {
	const transactionString = deterministicStringify(transaction);
	const hash = sha256(new TextEncoder().encode(transactionString));
	return toHex(hash);
}

/**
 * Sign native token transaction (consensus format)
 * According to ASSET_TRANSACTION_EXAMPLE.md section 3
 */
function signNativeTokenTransaction(
	transaction: Omit<AssetTransaction, "signatures">,
	wallet: Wallet,
	signDomain: (string | number)[],
	decimals: number,
): string {
	// 1. Convert to consensus format
	const consensusTx = convertToConsensusFormat(transaction, decimals);

	// 2. Create signing view (exclude signature fields)
	// According to tx_rules.signing_view_exclude
	const signingView: Record<string, unknown> = { ...consensusTx };
	delete signingView.signature;
	delete signingView.signatures;
	delete signingView.cosigs;
	delete signingView.verified;
	delete signingView.status;
	delete signingView.validators;
	delete signingView.hash;

	// 3. Canonicalize signing view
	const canonicalData = deterministicStringify(signingView);

	// 4. Create domain-separated message
	const domainStr = signDomain.map(String).join(":");
	const messageToSign = `${domainStr}:${canonicalData}`;

	// 5. Sign message
	const signature = sign(messageToSign, wallet.privateKey);
	return signature;
}

/**
 * Sign custom token transaction (hash-based)
 * According to ASSET_TRANSACTION_EXAMPLE.md section 3
 */
function signCustomTokenTransaction(
	transaction: Omit<AssetTransaction, "signatures">,
	wallet: Wallet,
	signDomain: (string | number)[],
): string {
	// 1. Calculate transaction hash (without signatures)
	const txHash = calculateTransactionHash(transaction);

	// 2. Create domain-separated message
	const domainStr = signDomain.map(String).join(":");
	const messageToSign = `${domainStr}:${txHash}`;

	// 3. Sign message
	const signature = sign(messageToSign, wallet.privateKey);
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

	// Determine token type and validate sign_domains structure
	// Native tokens require sign_domains.tx
	// Custom tokens can use sign_domains.token or sign_domains.tx
	const isNative = isNativeToken(tokenGenesis.token.id);
	if (isNative) {
		if (
			!tokenGenesis.protocol.sign_domains.tx ||
			!Array.isArray(tokenGenesis.protocol.sign_domains.tx) ||
			tokenGenesis.protocol.sign_domains.tx.length === 0
		) {
			throw new Error(
				"Native tokens require sign_domains.tx in token genesis",
			);
		}
	} else {
		const hasTokenDomain = tokenGenesis.protocol.sign_domains.token &&
			Array.isArray(tokenGenesis.protocol.sign_domains.token) &&
			tokenGenesis.protocol.sign_domains.token.length > 0;
		const hasTxDomain = tokenGenesis.protocol.sign_domains.tx &&
			Array.isArray(tokenGenesis.protocol.sign_domains.tx) &&
			tokenGenesis.protocol.sign_domains.tx.length > 0;
		if (!hasTokenDomain && !hasTxDomain) {
			throw new Error(
				"Custom tokens require sign_domains.token or sign_domains.tx in token genesis",
			);
		}
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

	// Get decimals for consensus format conversion (native tokens only)
	const decimals = tokenGenesis.parameters.currency.decimals;

	// Sign transaction according to token type
	// Native tokens: consensus format signing with domain `tx`
	// Custom tokens: hash-based signing with domain `token`
	let signature: string;
	if (isNative) {
		// For native tokens: use consensus format signing with `tx` domain
		// Ensure we use `tx` domain (not `token`)
		const txDomain = tokenGenesis.protocol.sign_domains.tx;
		if (!Array.isArray(txDomain) || txDomain.length === 0) {
			throw new Error(
				"Native tokens require sign_domains.tx in token genesis",
			);
		}
		signature = signNativeTokenTransaction(
			transactionBase,
			wallet,
			txDomain,
			decimals,
		);
	} else {
		// For custom tokens: use hash-based signing with `token` domain
		// Use `token` domain if available, otherwise fallback to `tx`
		const tokenDomain = tokenGenesis.protocol.sign_domains.token ||
			tokenGenesis.protocol.sign_domains.tx;
		if (!Array.isArray(tokenDomain) || tokenDomain.length === 0) {
			throw new Error(
				"Custom tokens require sign_domains.token or sign_domains.tx in token genesis",
			);
		}
		signature = signCustomTokenTransaction(
			transactionBase,
			wallet,
			tokenDomain,
		);
	}

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

	const result = data.result;

	// Handle array format (extended response with transactions array)
	if (result.transactions && result.transactions.length > 0) {
		const txResult = result.transactions[0];
		
		// Convert to direct format for compatibility
		const response: SubmitTransactionResponse = {
			success: result.success,
			tx_hash: txResult.tx_hash,
			status: txResult.status,
			pool_key: txResult.pool_key,
			timestamp: txResult.submitted_at,
			consensus_status: txResult.consensus_status,
			finalized: txResult.finalized,
			// Include original transactions array for detailed info
			transactions: result.transactions,
			total: result.total,
			limit: result.limit,
			offset: result.offset,
		};

		// Log warning if transaction failed, but don't throw
		// Transaction was successfully submitted to server, user can see it in list
		if (txResult.status === "failed") {
			const consensusStatus = txResult.consensus_status || "unknown";
			console.warn(
				`Transaction submitted but failed. Status: ${txResult.status}, Consensus: ${consensusStatus}`,
			);
		}

		return response;
	}

	// Handle direct format (standard submitAssetTransaction response)
	// Check consensus validation if available
	if (result.consensus_valid === false) {
		const errors = result.consensus_errors || [];
		console.warn("Consensus validation failed:", errors);
		// Transaction is still submitted to pool, but not accepted by consensus
	}

	// Log warning if transaction failed, but don't throw
	// Transaction was successfully submitted to server, user can see it in list
	if (result.status === "failed") {
		const errors = result.consensus_errors || [];
		const errorMessage = errors.length > 0
			? errors.join(", ")
			: "Transaction failed";
		console.warn(`Transaction submitted but failed: ${errorMessage}`);
	}

	return result;
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
