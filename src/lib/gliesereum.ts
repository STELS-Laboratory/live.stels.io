import elliptic from "elliptic";
import bs58 from "bs58";
import {sha256} from "@noble/hashes/sha256";
import {ripemd160} from "@noble/hashes/ripemd160";
import {hmac} from "@noble/hashes/hmac";

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
	} catch (error: any) {
		console.error(`Address validation failed: ${error.message}`);
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
 * Transaction type definition.
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
export function deterministicStringify(obj: any): string {
	if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
	if (Array.isArray(obj)) {
		return `[${obj.map(deterministicStringify).join(",")}]`;
	}
	const keys = Object.keys(obj).sort();
	return `{${
		keys.map((key) => `"${key}":${deterministicStringify(obj[key] ?? null)}`)
			.join(",")
	}}`;
}

/**
 * Signs data string with private key, returns DER hex string.
 */
export function sign(data: string, privateKey: string): string {
	const hash = sha256(new TextEncoder().encode(data));
	// @ts-ignore
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
 * Gliesereum API interface (strictly typed).
 */
export interface Gliesereum {
	cardNumber(
		input: string | Uint8Array,
		prefix?: string,
		secretKey?: string | Uint8Array,
	): string;
	createWallet(): Wallet;
	validateAddress(address: string): boolean;
	getAddress(bytes: Uint8Array): string;
	createSignedTransaction(
		wallet: Wallet,
		to: string,
		amount: number,
		fee: number,
		data?: string,
	): Transaction;
	validateTransaction(tx: Transaction): boolean;
	importWallet(privateKey: string): Wallet;
	sign(data: string, privateKey: string): string;
	verify(data: string, signature: string, publicKey: string): boolean;
}

/**
 * The exported Gliesereum API implementation.
 */
export const Gliesereum: Gliesereum = {
	cardNumber,
	createWallet,
	validateAddress,
	getAddress,
	createSignedTransaction,
	validateTransaction,
	importWallet,
	sign,
	verify,
};

export default Gliesereum;
