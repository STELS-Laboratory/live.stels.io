// @ts-types="npm:@types/elliptic@6.4.18"

import elliptic from "elliptic";
import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { hmac } from "@noble/hashes/hmac";

const EC = new elliptic.ec("secp256k1");

const CHECKSUM_SIZE = 4;
const VERSION_BYTE = 98; // Gliesereum's version byte for addresses (e.g., 'g')

/**
 * Converts a hex string to Uint8Array.
 */
export function hexToUint8Array(hex: string): Uint8Array {
	if (hex.startsWith("0x")) hex = hex.slice(2);
	if (hex.length % 2 !== 0) hex = "0" + hex;
	return new Uint8Array(
		hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
	);
}

/**
 * Converts a Uint8Array to hex string.
 */
export function toHex(bytes: Uint8Array): string {
	return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Concatenates multiple Uint8Arrays.
 */
export function concatUint8(arrays: Uint8Array[]): Uint8Array {
	const total = arrays.reduce((acc, arr) => acc + arr.length, 0);
	const result = new Uint8Array(total);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

/**
 * Compares two Uint8Arrays in constant time.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a[i] ^ b[i];
	}
	return result === 0;
}

/**
 * Ensures public key is in compressed form (returns Uint8Array).
 */
export function ensureCompressedKey(publicKey: Uint8Array): Uint8Array {
	if (publicKey.length === 65 && publicKey[0] === 0x04) {
		const ecKey = EC.keyFromPublic(toHex(publicKey), "hex");
		return hexToUint8Array(ecKey.getPublic(true, "hex"));
	}
	return publicKey;
}

/**
 * Hashes input using SHA256 then RIPEMD160.
 */
export function createHash(bytes: Uint8Array): Uint8Array {
	return ripemd160(sha256(bytes));
}

/**
 * Creates checksum using SHA256.
 */
export function createChecksum(bytes: Uint8Array): Uint8Array {
	return sha256(bytes).slice(0, CHECKSUM_SIZE);
}

/**
 * Validates a base58 address using version byte and checksum.
 */
export function validateAddress(address: string): boolean {
	try {
		const decoded = bs58.decode(address);
		if (decoded.length < CHECKSUM_SIZE + 1) {
			throw new Error("Address length too short.");
		}
		const version = decoded[0];
		if (version !== VERSION_BYTE) {
			throw new Error("Invalid address version byte.");
		}
		const payload = decoded.slice(1, -CHECKSUM_SIZE);
		const actualChecksum = decoded.slice(-CHECKSUM_SIZE);
		const expectedChecksum = createChecksum(
			concatUint8([Uint8Array.of(version), payload]),
		);
		return constantTimeEqual(expectedChecksum, actualChecksum);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`Address validation failed: ${errorMessage}`);
		return false;
	}
}

/**
 * Encodes a public key to an address.
 */
export function getAddress(publicKey: Uint8Array): string {
	const compressedKey = ensureCompressedKey(publicKey);
	const pubKeyHash = createHash(compressedKey);
	const versionAndHash = concatUint8([Uint8Array.of(VERSION_BYTE), pubKeyHash]);
	const checksum = createChecksum(versionAndHash);
	const fullPayload = concatUint8([versionAndHash, checksum]);
	return bs58.encode(fullPayload);
}

/**
 * NEVER log or transmit private keys in production environments.
 * Always treat private keys as sensitive information.
 */
export interface Wallet {
	readonly publicKey: string;
	readonly privateKey: string;
	readonly address: string;
	readonly biometric?: string | null;
	readonly number: string;
}

/**
 * Smart operation types based on genesis.json specification
 */
export type SmartOp =
	| {
	op: "transfer";
	to: string;
	amount: string;
	memo?: string;
}
	| {
	op: "assert.time";
	before_ms?: number;
	after_ms?: number;
}
	| {
	op: "assert.balance";
	address: string;
	gte: string;
}
	| {
	op: "assert.compare";
	left: string;
	cmp: "<" | "<=" | "==" | ">=" | ">";
	right: string;
}
	| {
	op: "emit.event";
	kind: string;
	data?: Record<string, unknown>;
};

/**
 * Cosign method configuration
 */
export interface CosignMethod {
	id: string;
	type: "cosign";
	threshold?: {
		k: number;
		n: number;
	};
	approvers?: string[];
	deadline_ms?: number;
}

/**
 * Cosign signature
 */
export interface CosignSignature {
	method_id: string;
	kid: string;
	alg: "ecdsa-secp256k1";
	sig: string;
}

/**
 * Transaction signature
 */
export interface TransactionSignature {
	kid: string;
	alg: "ecdsa-secp256k1";
	sig: string;
}

/**
 * Basic transaction type definition (legacy)
 */
export type Transaction = {
	from: {
		address: string;
		publicKey: string;
		number: string;
	};
	to: string;
	amount: number;
	fee: number;
	timestamp: number;
	hash: string;
	status?: "pending" | "confirmed" | "failed";
	verified?: boolean;
	validators: string[];
	signature?: string;
	data?: string;
};

/**
 * Smart transaction type definition
 */
export interface SmartTransaction {
	type: "smart";
	method: "smart.exec";
	args: {
		ops: SmartOp[];
		memo?: string;
	};
	from: string;
	fee: string;
	currency: "TST";
	prev_hash: string | null;
	timestamp: number;
	signatures: TransactionSignature[];
	raw?: string;
	raw_encoding?: "utf8";
	raw_sha256?: string;
	methods?: CosignMethod[];
	cosigs?: CosignSignature[];
}

/**
 * Creates a new secp256k1 wallet.
 */
export function createWallet(): Wallet {
	const pair = EC.genKeyPair();
	const publicKey = pair.getPublic(true, "hex");
	const privateKey = pair.getPrivate("hex");
	const address = getAddress(hexToUint8Array(publicKey));
	return {
		publicKey,
		privateKey,
		address,
		biometric: null,
		number: cardNumber(address),
	};
}

/**
 * Generates a deterministic, 16-digit, Luhn-valid card number.
 * - Uses SHA-256 or HMAC-SHA-256 for security and collision resistance.
 * - Enforces prefix for product/range identification.
 * - Returns string (never number!).
 *
 * @param input - Input data (string | Uint8Array)
 * @param prefix - Card prefix, e.g. "1" (default: "0")
 * @param secretKey - Optional HMAC secret for additional security (string | Uint8Array)
 * @returns 16-digit card number (string)
 */
export function cardNumber(
	input: string | Uint8Array,
	prefix: string = "0",
	secretKey?: string | Uint8Array,
): string {
	const data = typeof input === "string"
		? new TextEncoder().encode(input)
		: input;
	const hash = secretKey
		? hmac(
			sha256,
			typeof secretKey === "string"
				? new TextEncoder().encode(secretKey)
				: secretKey,
			data,
		)
		: sha256(data);
	const digitsNeeded = 16 - prefix.length - 1;
	const hashBigInt = BigInt("0x" + toHex(hash));
	let body = hashBigInt.toString().padStart(digitsNeeded, "0").slice(
		0,
		digitsNeeded,
	);
	if (body.length < digitsNeeded) body = body.padStart(digitsNeeded, "0");
	const base = prefix + body;
	const control = luhnChecksum(base);
	return base + control;
}

/**
 * Calculates Luhn checksum digit for given base (as string).
 * Always returns a single decimal digit as string.
 */
export function luhnChecksum(number: string): string {
	let sum = 0;
	let shouldDouble = false;
	for (let i = number.length - 1; i >= 0; i--) {
		let digit = parseInt(number[i], 10);
		if (shouldDouble) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}
		sum += digit;
		shouldDouble = !shouldDouble;
	}
	return ((10 - (sum % 10)) % 10).toString();
}

/**
 * Deterministically stringifies any object, used for signature/data hashing.
 */
export function deterministicStringify(obj: unknown): string {
	if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
	if (Array.isArray(obj)) {
		return `[${obj.map(deterministicStringify).join(",")}]`;
	}
	const keys = Object.keys(obj as Record<string, unknown>).sort();
	return `{${keys.map((key) => `"${key}":${deterministicStringify((obj as Record<string, unknown>)[key] ?? null)}`)
		.join(",")
	}}`;
}

/**
 * Signs data string with private key, returns DER hex string.
 */
export function sign(data: string, privateKey: string): string {
	const hash = sha256(new TextEncoder().encode(data));
	// @ts-ignore: elliptic library types are incomplete
	const signature = EC.sign(hash, hexToUint8Array(privateKey), {
		canonical: true,
	});
	return signature.toDER("hex");
}

/**
 * Creates and signs a new transaction.
 */
export function createSignedTransaction(
	wallet: Wallet,
	to: string,
	amount: number,
	fee: number,
	data?: string,
): Transaction {
	if (!validateAddress(wallet.address) || !validateAddress(to)) {
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
 * Verifies a data signature with the given public key.
 */
export function verify(
	data: string,
	signature: string,
	publicKey: string,
): boolean {
	try {
		const key = EC.keyFromPublic(publicKey, "hex");
		const hash = sha256(new TextEncoder().encode(data));
		return key.verify(hash, signature);
	} catch (error) {
		console.error("Signature verification failed:", error);
		return false;
	}
}

/**
 * Validates transaction hash and signature.
 */
export function validateTransaction(transaction: Transaction): boolean {
	const { hash, signature, ...transactionData } = transaction;
	const transactionString = deterministicStringify(transactionData);
	const recomputedHash = toHex(
		sha256(new TextEncoder().encode(transactionString)),
	);
	if (recomputedHash !== hash) throw new Error("Transaction hash mismatch");
	if (!signature) throw new Error("Missing signature");
	return verify(
		transactionString,
		signature,
		transaction.from.publicKey,
	);
}

/**
 * Imports a wallet from a raw private key.
 */
export function importWallet(privateKey: string): Wallet {
	if (!/^[0-9a-f]{64}$/i.test(privateKey)) {
		throw new Error("Invalid private key format. Must be 64 hex characters.");
	}
	const keyPair = EC.keyFromPrivate(privateKey, "hex");
	const publicKey = keyPair.getPublic(true, "hex");
	const address = getAddress(hexToUint8Array(publicKey));
	return {
		publicKey,
		privateKey,
		address,
		biometric: null,
		number: cardNumber(address),
	};
}

/**
 * Creates a smart transaction with operations
 */
export function createSmartTransaction(
	wallet: Wallet,
	ops: SmartOp[],
	fee: string = "0.000100",
	memo?: string,
	prevHash: string | null = null,
	rawData?: string
): SmartTransaction {
	// Validate operations
	if (ops.length === 0) {
		throw new Error("At least one operation is required");
	}
	if (ops.length > 16) {
		throw new Error("Maximum 16 operations allowed");
	}
	
	// Validate fee format
	if (!/^\d+(?:\.\d{1,6})?$/.test(fee)) {
		throw new Error("Invalid fee format. Must be decimal with up to 6 decimal places");
	}
	
	const timestamp = Date.now();
	const transactionData: Partial<SmartTransaction> = {
		type: "smart" as const,
		method: "smart.exec" as const,
		args: {
			ops,
			...(memo && { memo })
		},
		from: wallet.address,
		fee,
		currency: "TST" as const,
		prev_hash: prevHash,
		timestamp
	};
	
	// Add raw data if provided
	if (rawData) {
		const rawBytes = new TextEncoder().encode(rawData);
		if (rawBytes.length > 65536) {
			throw new Error("Raw data exceeds maximum size of 65536 bytes");
		}
		transactionData.raw = rawData;
		transactionData.raw_encoding = "utf8";
		transactionData.raw_sha256 = toHex(sha256(rawBytes));
	}
	
	const transactionString = deterministicStringify(transactionData);
	const signature = sign(transactionString, wallet.privateKey);
	
	return {
		...transactionData,
		signatures: [{
			kid: wallet.publicKey,
			alg: "ecdsa-secp256k1",
			sig: signature
		}]
	} as SmartTransaction;
}

/**
 * Calculates fee for smart transaction based on genesis.json policy
 */
export function calculateSmartTransactionFee(
	ops: SmartOp[],
	rawBytes: number = 0,
	baseFee: string = "0.00005"
): string {
	const baseFeeNum = parseFloat(baseFee);
	const perByteFee = 0.0000001;
	const rawPerByteFee = 0.0000003;
	
	// Calculate operation fees
	let opsFee = 0;
	for (const op of ops) {
		switch (op.op) {
			case "assert.time":
				opsFee += 0.000002;
				break;
			case "assert.balance":
				opsFee += 0.000003;
				break;
			case "assert.compare":
				opsFee += 0.000003;
				break;
			case "transfer":
				opsFee += 0.000010;
				break;
			case "emit.event":
				opsFee += 0.000004;
				break;
		}
	}
	
	// Calculate transaction bytes (simplified)
	const txBytes = JSON.stringify(ops).length;
	const regularBytes = Math.max(0, txBytes - rawBytes);
	
	const totalFee = baseFeeNum +
		(perByteFee * regularBytes) +
		(rawPerByteFee * rawBytes) +
		opsFee;
	
	// Round to 6 decimal places
	return totalFee.toFixed(6);
}

/**
 * Validates smart transaction
 */
export function validateSmartTransaction(tx: SmartTransaction): boolean {
	try {
		// Validate required fields
		if (tx.type !== "smart" || tx.method !== "smart.exec") {
			throw new Error("Invalid transaction type or method");
		}
		
		if (!Array.isArray(tx.args.ops) || tx.args.ops.length === 0) {
			throw new Error("Invalid operations");
		}
		
		if (tx.args.ops.length > 16) {
			throw new Error("Too many operations");
		}
		
		// Validate address format
		if (!validateAddress(tx.from)) {
			throw new Error("Invalid sender address");
		}
		
		// Validate fee format
		if (!/^\d+(?:\.\d{1,6})?$/.test(tx.fee)) {
			throw new Error("Invalid fee format");
		}
		
		// Validate currency
		if (tx.currency !== "TST") {
			throw new Error("Invalid currency");
		}
		
		// Validate signatures
		if (!Array.isArray(tx.signatures) || tx.signatures.length === 0) {
			throw new Error("No signatures provided");
		}
		
		if (tx.signatures.length > 8) {
			throw new Error("Too many signatures");
		}
		
		// Validate each signature
		for (const sig of tx.signatures) {
			if (sig.alg !== "ecdsa-secp256k1") {
				throw new Error("Invalid signature algorithm");
			}
			if (!/^[0-9a-fA-F]+$/.test(sig.sig)) {
				throw new Error("Invalid signature format");
			}
		}
		
		// Validate operations
		for (const op of tx.args.ops) {
			validateSmartOperation(op);
		}
		
		return true;
	} catch (error) {
		console.error("Smart transaction validation failed:", error);
		return false;
	}
}

/**
 * Validates a single smart operation
 */
export function validateSmartOperation(op: SmartOp): boolean {
	switch (op.op) {
		case "transfer":
			if (!op.to || !op.amount) {
				throw new Error("Transfer operation missing required fields");
			}
			if (!validateAddress(op.to)) {
				throw new Error("Invalid transfer recipient address");
			}
			if (!/^\d+(?:\.\d{1,6})?$/.test(op.amount)) {
				throw new Error("Invalid transfer amount format");
			}
			if (op.memo && op.memo.length > 256) {
				throw new Error("Transfer memo too long");
			}
			break;
		
		case "assert.time":
			if (op.before_ms !== undefined && op.before_ms < 0) {
				throw new Error("Invalid before_ms value");
			}
			if (op.after_ms !== undefined && op.after_ms < 0) {
				throw new Error("Invalid after_ms value");
			}
			break;
		
		case "assert.balance":
			if (!op.address || !op.gte) {
				throw new Error("Assert balance operation missing required fields");
			}
			if (!validateAddress(op.address)) {
				throw new Error("Invalid assert balance address");
			}
			if (!/^\d+(?:\.\d{1,6})?$/.test(op.gte)) {
				throw new Error("Invalid assert balance amount format");
			}
			break;
		
		case "assert.compare":
			if (!op.left || !op.right || !op.cmp) {
				throw new Error("Assert compare operation missing required fields");
			}
			if (!/^\d+(?:\.\d{1,6})?$/.test(op.left) || !/^\d+(?:\.\d{1,6})?$/.test(op.right)) {
				throw new Error("Invalid assert compare amount format");
			}
			if (!["<", "<=", "==", ">=", ">"].includes(op.cmp)) {
				throw new Error("Invalid assert compare operator");
			}
			break;
		
		case "emit.event":
			if (!op.kind) {
				throw new Error("Emit event operation missing required fields");
			}
			if (op.kind.length > 32) {
				throw new Error("Event kind too long");
			}
			if (op.data && JSON.stringify(op.data).length > 1024) {
				throw new Error("Event data too large");
			}
			break;
		
		default:
			throw new Error(`Unknown operation type: ${(op as Record<string, unknown>).op}`);
	}
	
	return true;
}

/**
 * Signs data with a specific domain for cosign operations
 */
export function signWithDomain(
	data: string,
	privateKey: string,
	domain: string[]
): string {
	const domainString = deterministicStringify({ domain, data });
	return sign(domainString, privateKey);
}

/**
 * Creates cosign method configuration
 */
export function createCosignMethod(
	id: string,
	approvers: string[],
	threshold: { k: number; n: number },
	deadlineMs?: number
): CosignMethod {
	if (approvers.length > 16) {
		throw new Error("Maximum 16 approvers allowed");
	}
	if (threshold.k > threshold.n) {
		throw new Error("Threshold k cannot be greater than n");
	}
	if (threshold.k < 1 || threshold.n < 1) {
		throw new Error("Threshold values must be positive");
	}
	
	return {
		id,
		type: "cosign",
		threshold,
		approvers,
		deadline_ms: deadlineMs
	};
}

/**
 * Creates cosign signature
 */
export function createCosignSignature(
	methodId: string,
	publicKey: string,
	privateKey: string,
	transaction: SmartTransaction
): CosignSignature {
	const transactionString = deterministicStringify(transaction);
	const cosignDomain = ["STELS-COSIGN", "2", "chain:2"];
	const cosignData = deterministicStringify({
		domain: cosignDomain,
		transaction: transactionString
	});
	
	const signature = signWithDomain(cosignData, privateKey, cosignDomain);
	
	return {
		method_id: methodId,
		kid: publicKey,
		alg: "ecdsa-secp256k1",
		sig: signature
	};
}

/**
 * Validates cosign method configuration
 */
export function validateCosignMethod(method: CosignMethod): boolean {
	try {
		if (!method.id || typeof method.id !== "string") {
			throw new Error("Invalid method ID");
		}
		
		if (method.id.length > 64 || !/^[a-z0-9._-]{1,64}$/.test(method.id)) {
			throw new Error("Invalid method ID format");
		}
		
		if (method.type !== "cosign") {
			throw new Error("Invalid method type");
		}
		
		if (method.threshold) {
			if (method.threshold.k < 1 || method.threshold.n < 1) {
				throw new Error("Threshold values must be positive");
			}
			if (method.threshold.k > method.threshold.n) {
				throw new Error("Threshold k cannot be greater than n");
			}
		}
		
		if (method.approvers) {
			if (method.approvers.length > 16) {
				throw new Error("Maximum 16 approvers allowed");
			}
			
			for (const approver of method.approvers) {
				if (!/^(02|03)[0-9a-fA-F]{64}$/.test(approver)) {
					throw new Error("Invalid approver public key format");
				}
			}
		}
		
		if (method.deadline_ms !== undefined && method.deadline_ms < 0) {
			throw new Error("Invalid deadline");
		}
		
		return true;
	} catch (error) {
		console.error("Cosign method validation failed:", error);
		return false;
	}
}

/**
 * Validates cosign signature
 */
export function validateCosignSignature(cosig: CosignSignature): boolean {
	try {
		if (!cosig.method_id || typeof cosig.method_id !== "string") {
			throw new Error("Invalid method ID");
		}
		
		if (!cosig.kid || typeof cosig.kid !== "string") {
			throw new Error("Invalid kid");
		}
		
		if (!/^(02|03)[0-9a-fA-F]{64}$/.test(cosig.kid)) {
			throw new Error("Invalid kid format");
		}
		
		if (cosig.alg !== "ecdsa-secp256k1") {
			throw new Error("Invalid algorithm");
		}
		
		if (!cosig.sig || typeof cosig.sig !== "string") {
			throw new Error("Invalid signature");
		}
		
		if (!/^[0-9a-fA-F]+$/.test(cosig.sig)) {
			throw new Error("Invalid signature format");
		}
		
		if (cosig.sig.length > 144) {
			throw new Error("Signature too long");
		}
		
		return true;
	} catch (error) {
		console.error("Cosign signature validation failed:", error);
		return false;
	}
}

/**
 * Validates transaction signature
 */
export function validateTransactionSignature(sig: TransactionSignature): boolean {
	try {
		if (!sig.kid || typeof sig.kid !== "string") {
			throw new Error("Invalid kid");
		}
		
		if (!/^(02|03)[0-9a-fA-F]{64}$/.test(sig.kid)) {
			throw new Error("Invalid kid format");
		}
		
		if (sig.alg !== "ecdsa-secp256k1") {
			throw new Error("Invalid algorithm");
		}
		
		if (!sig.sig || typeof sig.sig !== "string") {
			throw new Error("Invalid signature");
		}
		
		if (!/^[0-9a-fA-F]+$/.test(sig.sig)) {
			throw new Error("Invalid signature format");
		}
		
		return true;
	} catch (error) {
		console.error("Transaction signature validation failed:", error);
		return false;
	}
}

/**
 * Validates fee format according to genesis.json
 */
export function validateFeeFormat(fee: string): boolean {
	return /^\d+(?:\.\d{1,6})?$/.test(fee);
}

/**
 * Validates amount format according to genesis.json
 */
export function validateAmountFormat(amount: string): boolean {
	return /^\d+(?:\.\d{1,6})?$/.test(amount);
}

/**
 * Validates raw data according to genesis.json limits
 */
export function validateRawData(rawData: string): boolean {
	const rawBytes = new TextEncoder().encode(rawData);
	return rawBytes.length <= 65536;
}

/**
 * Validates memo length according to genesis.json limits
 */
export function validateMemo(memo: string): boolean {
	return memo.length <= 256;
}

/**
 * Validates event kind according to genesis.json limits
 */
export function validateEventKind(kind: string): boolean {
	return kind.length <= 32;
}

/**
 * Validates event data according to genesis.json limits
 */
export function validateEventData(data: Record<string, unknown>): boolean {
	return JSON.stringify(data).length <= 1024;
}

/**
 * Gets address from public key (compressed format)
 */
export function getAddressFromPublicKey(publicKey: string): string {
	if (!/^(02|03)[0-9a-fA-F]{64}$/.test(publicKey)) {
		throw new Error("Invalid public key format");
	}
	return getAddress(hexToUint8Array(publicKey));
}

/**
 * Verifies that a public key corresponds to an address
 */
export function verifyPublicKeyAddress(publicKey: string, address: string): boolean {
	try {
		const computedAddress = getAddressFromPublicKey(publicKey);
		return computedAddress === address;
	} catch {
		return false;
	}
}

/**
 * Gliesereum API interface (strictly typed).
 */
export interface Gliesereum {
	// Basic wallet functions
	cardNumber(
		input: string | Uint8Array,
		prefix?: string,
		secretKey?: string | Uint8Array,
	): string;
	createWallet(): Wallet;
	importWallet(privateKey: string): Wallet;
	
	// Address functions
	validateAddress(address: string): boolean;
	getAddress(bytes: Uint8Array): string;
	
	// Basic transaction functions
	createSignedTransaction(
		wallet: Wallet,
		to: string,
		amount: number,
		fee: number,
		data?: string,
	): Transaction;
	validateTransaction(tx: Transaction): boolean;
	
	// Smart transaction functions
	createSmartTransaction(
		wallet: Wallet,
		ops: SmartOp[],
		fee?: string,
		memo?: string,
		prevHash?: string | null,
		rawData?: string
	): SmartTransaction;
	validateSmartTransaction(tx: SmartTransaction): boolean;
	validateSmartOperation(op: SmartOp): boolean;
	calculateSmartTransactionFee(
		ops: SmartOp[],
		rawBytes?: number,
		baseFee?: string
	): string;
	
	// Cosign functions
	createCosignMethod(
		id: string,
		approvers: string[],
		threshold: { k: number; n: number },
		deadlineMs?: number
	): CosignMethod;
	createCosignSignature(
		methodId: string,
		publicKey: string,
		privateKey: string,
		transaction: SmartTransaction
	): CosignSignature;
	signWithDomain(
		data: string,
		privateKey: string,
		domain: string[]
	): string;
	
	// Cryptographic functions
	sign(data: string, privateKey: string): string;
	verify(data: string, signature: string, publicKey: string): boolean;
	
	// Validation functions
	validateCosignMethod(method: CosignMethod): boolean;
	validateCosignSignature(cosig: CosignSignature): boolean;
	validateTransactionSignature(sig: TransactionSignature): boolean;
	validateFeeFormat(fee: string): boolean;
	validateAmountFormat(amount: string): boolean;
	validateRawData(rawData: string): boolean;
	validateMemo(memo: string): boolean;
	validateEventKind(kind: string): boolean;
	validateEventData(data: Record<string, unknown>): boolean;
	getAddressFromPublicKey(publicKey: string): string;
	verifyPublicKeyAddress(publicKey: string, address: string): boolean;
}

/**
 * The exported Gliesereum API implementation.
 */
export const Gliesereum: Gliesereum = {
	// Basic wallet functions
	cardNumber,
	createWallet,
	importWallet,
	
	// Address functions
	validateAddress,
	getAddress,
	
	// Basic transaction functions
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
	signWithDomain,
	
	// Cryptographic functions
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
	getAddressFromPublicKey,
	verifyPublicKeyAddress,
};

export default Gliesereum;
