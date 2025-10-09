/**
 * Gliesereum blockchain library
 * Modular implementation with clean architecture
 * 
 * This library provides:
 * - Wallet management (create, import, validate)
 * - Transaction signing and verification
 * - Smart contract operations
 * - Cosign support
 * - Address validation
 */

// Import necessary dependencies first
import { sha256 } from "@noble/hashes/sha256";
import type {
	Wallet,
	Transaction,
	SmartTransaction,
	SmartOp,
	CosignMethod,
	CosignSignature,
} from "./types";
import {
	sign,
	verify,
	toHex,
	deterministicStringify,
	signWithDomain as cryptoSignWithDomain,
} from "./crypto";
import {
	validateAddress as walletValidateAddress,
	getAddress as walletGetAddress,
	createWallet as walletCreateWallet,
	importWallet as walletImportWallet,
	cardNumber as walletCardNumber,
	getAddressFromPublicKey,
	verifyPublicKeyAddress as walletVerifyPublicKeyAddress,
} from "./wallet";
import {
	validateFeeFormat,
	validateAmountFormat,
	validateSmartOperation,
	validateCosignMethod,
	validateCosignSignature,
	validateTransactionSignature,
	validateRawData,
	validateMemo,
	validateEventKind,
	validateEventData,
} from "./validation";

// Re-export types
export type {
	Wallet,
	Transaction,
	SmartTransaction,
	SmartOp,
	CosignMethod,
	CosignSignature,
	TransactionSignature,
	Gliesereum,
} from "./types";

// Re-export crypto functions
export {
	hexToUint8Array,
	toHex,
	concatUint8,
	constantTimeEqual,
	ensureCompressedKey,
	createHash,
	createChecksum,
	sign,
	verify,
	deterministicStringify,
} from "./crypto";
export { signWithDomain as cryptoSignWithDomain } from "./crypto";

// Re-export Wallet functions
export {
	validateAddress,
	getAddress,
	createWallet,
	importWallet,
	cardNumber,
	luhnChecksum,
	getAddressFromPublicKey,
	verifyPublicKeyAddress,
} from "./wallet";

// Re-export validation functions
export {
	validateFeeFormat,
	validateAmountFormat,
	validateRawData,
	validateMemo,
	validateEventKind,
	validateEventData,
	validateCosignMethod,
	validateCosignSignature,
	validateTransactionSignature,
	validateSmartOperation,
} from "./validation";

/**
 * Creates a signed transaction
 * ⚠️ CRITICAL: Must match server-side validation exactly
 */
export function createSignedTransaction(
	wallet: Wallet,
	to: string,
	amount: number,
	fee: number,
	data?: string,
): Transaction {
	if (!walletValidateAddress(wallet.address) || !walletValidateAddress(to)) {
		throw new Error("Invalid address");
	}
	if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
		throw new Error("Invalid amount");
	}
	if (!Number.isFinite(fee) || fee <= 0 || !Number.isInteger(fee)) {
		throw new Error("Invalid fee");
	}
	if (data && new TextEncoder().encode(data).length > 2048 * 1024) {
		throw new Error("Data size exceeds limit");
	}

	const transaction: Omit<Transaction, "signature" | "hash"> = {
		from: {
			publicKey: wallet.publicKey,
			address: wallet.address,
			number: wallet.number,
		},
		to,
		amount,
		fee,
		verified: false,
		validators: [],
		timestamp: Date.now(),
		data,
	};

	const transactionString = deterministicStringify(transaction);
	const transactionHash = toHex(
		sha256(new TextEncoder().encode(transactionString)),
	);
	const signatureValue = sign(transactionString, wallet.privateKey);

	return {
		...transaction,
		hash: transactionHash,
		signature: signatureValue,
	};
}

/**
 * Validates a transaction
 * ⚠️ CRITICAL: Throws on hash mismatch - matches server behavior
 */
export function validateTransaction(transaction: Transaction): boolean {
	const { hash, signature, ...transactionData } = transaction;
	const transactionString = deterministicStringify(transactionData);
	const recomputedHash = toHex(
		sha256(new TextEncoder().encode(transactionString)),
	);

	if (recomputedHash !== hash) {
		throw new Error("Transaction hash mismatch");
	}

	if (!signature) {
		throw new Error("Missing signature");
	}

	return verify(
		transactionString,
		signature,
		transaction.from.publicKey,
	);
}

/**
 * Creates a smart transaction
 */
export function createSmartTransaction(
	wallet: Wallet,
	ops: SmartOp[],
	fee: string = "0.000100",
	memo?: string,
	prevHash: string | null = null,
	rawData?: string,
): SmartTransaction {
	if (!validateFeeFormat(fee)) {
		throw new Error("Invalid fee format");
	}

	for (const op of ops) {
		if (!validateSmartOperation(op)) {
			throw new Error(`Invalid operation: ${op.op}`);
		}
	}

	const timestamp = Date.now();
	const tx: SmartTransaction = {
		type: "smart",
		method: "smart.exec",
		args: { ops, memo },
		from: wallet.address,
		fee,
		currency: "TST",
		prev_hash: prevHash,
		timestamp,
		signatures: [],
	};

	if (rawData) {
		tx.raw = rawData;
		tx.raw_encoding = "utf8";
		const rawBytes = new TextEncoder().encode(rawData);
		const rawHash = sha256(rawBytes);
		tx.raw_sha256 = Array.from(rawHash)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	const dataToSign = deterministicStringify({
		type: tx.type,
		method: tx.method,
		args: tx.args,
		from: tx.from,
		fee: tx.fee,
		currency: tx.currency,
		prev_hash: tx.prev_hash,
		timestamp: tx.timestamp,
	});

	const signature = sign(dataToSign, wallet.privateKey);

	tx.signatures = [
		{
			kid: wallet.publicKey,
			alg: "ecdsa-secp256k1",
			sig: signature,
		},
	];

	return tx;
}

/**
 * Calculates smart transaction fee
 */
export function calculateSmartTransactionFee(
	ops: SmartOp[],
	rawBytes: number = 0,
	baseFee: string = "0.00005",
): string {
	if (!validateFeeFormat(baseFee)) {
		throw new Error("Invalid base fee format");
	}

	let fee = parseFloat(baseFee);

	for (const op of ops) {
		switch (op.op) {
			case "transfer":
				fee += 0.00001;
				break;
			case "assert.time":
			case "assert.balance":
			case "assert.compare":
				fee += 0.000005;
				break;
			case "emit.event":
				fee += 0.000015;
				break;
		}
	}

	if (rawBytes > 0) {
		fee += Math.ceil(rawBytes / 256) * 0.000001;
	}

	return fee.toFixed(6);
}

/**
 * Validates a smart transaction
 */
export function validateSmartTransaction(tx: SmartTransaction): boolean {
	if (!tx || typeof tx !== "object") return false;
	if (tx.type !== "smart" || tx.method !== "smart.exec") return false;
	if (!tx.from || tx.from.length !== 34) return false;
	if (!validateFeeFormat(tx.fee)) return false;
	if (tx.currency !== "TST") return false;
	if (!Array.isArray(tx.args.ops) || tx.args.ops.length === 0) return false;

	for (const op of tx.args.ops) {
		if (!validateSmartOperation(op)) return false;
	}

	if (!Array.isArray(tx.signatures) || tx.signatures.length === 0) {
		return false;
	}

	for (const sig of tx.signatures) {
		if (!validateTransactionSignature(sig)) return false;
	}

	if (tx.methods) {
		if (!Array.isArray(tx.methods)) return false;
		for (const method of tx.methods) {
			if (!validateCosignMethod(method)) return false;
		}
	}

	if (tx.cosigs) {
		if (!Array.isArray(tx.cosigs)) return false;
		for (const cosig of tx.cosigs) {
			if (!validateCosignSignature(cosig)) return false;
		}
	}

	return true;
}

/**
 * Creates cosign method
 */
export function createCosignMethod(
	id: string,
	approvers: string[],
	threshold: { k: number; n: number },
	deadlineMs?: number,
): CosignMethod {
	const method: CosignMethod = {
		id,
		type: "cosign",
		threshold,
		approvers,
		deadline_ms: deadlineMs,
	};

	if (!validateCosignMethod(method)) {
		throw new Error("Invalid cosign method");
	}

	return method;
}

/**
 * Creates cosign signature
 */
export function createCosignSignature(
	methodId: string,
	publicKey: string,
	privateKey: string,
	transaction: SmartTransaction,
): CosignSignature {
	const dataToSign = deterministicStringify({
		method_id: methodId,
		transaction: {
			type: transaction.type,
			method: transaction.method,
			args: transaction.args,
			from: transaction.from,
			fee: transaction.fee,
			currency: transaction.currency,
			timestamp: transaction.timestamp,
		},
	});

	const signature = sign(dataToSign, privateKey);

	return {
		method_id: methodId,
		kid: publicKey,
		alg: "ecdsa-secp256k1",
		sig: signature,
	};
}

/**
 * Re-export signWithDomain for compatibility
 */
export const signWithDomain = cryptoSignWithDomain;

/**
 * Gliesereum library object for convenience
 */
export const gliesereum: import("./types").Gliesereum = {
	// Wallet functions
	cardNumber: walletCardNumber,
	createWallet: walletCreateWallet,
	importWallet: walletImportWallet,
	validateAddress: walletValidateAddress,
	getAddress: walletGetAddress,
	getAddressFromPublicKey,
	verifyPublicKeyAddress: walletVerifyPublicKeyAddress,

	// Transaction functions
	createSignedTransaction,
	validateTransaction,

	// Smart transaction functions
	createSmartTransaction,
	validateSmartTransaction,
	validateSmartOperation,
	calculateSmartTransactionFee,

	// Cosign functions
	createCosignMethod,
	createCosignSignature,
	signWithDomain: cryptoSignWithDomain,

	// Crypto functions
	sign,
	verify,

	// Validation functions
	validateCosignMethod,
	validateCosignSignature,
	validateTransactionSignature,
	validateFeeFormat,
	validateAmountFormat,
	validateRawData,
	validateMemo,
	validateEventKind,
	validateEventData,
};

export default gliesereum;

