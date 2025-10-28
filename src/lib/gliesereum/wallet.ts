/**
 * Gliesereum Wallet management
 * Functions for creating, importing, and managing wallets
 * 
 * ⚠️ CRITICAL: Cryptographic operations must match server implementation
 */

// @ts-types="npm:@types/elliptic@6.4.18"
import elliptic from "elliptic";
import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha256";
import { hmac } from "@noble/hashes/hmac";
import {
	hexToUint8Array,
	toHex,
	concatUint8,
	ensureCompressedKey,
	createHash,
	createChecksum,
} from "./crypto";
import type { Wallet } from "./types";

const EC = new elliptic.ec("secp256k1");
const CHECKSUM_SIZE = 4;
const VERSION_BYTE = 98; // Gliesereum's version byte (character 'g')

/**
 * Validates Gliesereum address format
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

		// Constant-time comparison
		if (expectedChecksum.length !== actualChecksum.length) return false;
		let result = 0;
		for (let i = 0; i < expectedChecksum.length; i++) {
			result |= expectedChecksum[i] ^ actualChecksum[i];
		}
		return result === 0;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error
			? error.message
			: "Unknown error";
		console.error(`Address validation failed: ${errorMessage}`);
		return false;
	}
}

/**
 * Generates address from public key
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
 * Creates a new Wallet
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
 * Imports Wallet from private key
 */
export function importWallet(privateKey: string): Wallet {
	if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
		throw new Error("Invalid private key format");
	}

	const keyPair = EC.keyFromPrivate(privateKey, "hex");
	const publicKey = keyPair.getPublic(true, "hex"); // Compressed (66 chars)
	const publicKeyBytes = hexToUint8Array(publicKey);
	const address = getAddress(publicKeyBytes);

	return {
		publicKey,
		privateKey,
		address,
		biometric: null,
		number: cardNumber(address),
	};
}

/**
 * Get uncompressed public key from private key
 * Used for WebFix requests that require uncompressed format (130 chars)
 * 
 * @param privateKey - Private key hex string (64 chars)
 * @returns Uncompressed public key hex string (130 chars, starts with "04")
 */
export function getUncompressedPublicKey(privateKey: string): string {
	if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
		throw new Error("Invalid private key format");
	}

	const keyPair = EC.keyFromPrivate(privateKey, "hex");
	const uncompressed = keyPair.getPublic(false, "hex"); // Uncompressed (130 chars)
	
	console.log("[getUncompressedPublicKey] Private key (first 16):", privateKey.substring(0, 16));
	console.log("[getUncompressedPublicKey] Uncompressed public key:", uncompressed);
	console.log("[getUncompressedPublicKey] Length:", uncompressed.length);
	console.log("[getUncompressedPublicKey] Starts with:", uncompressed.substring(0, 2));
	
	return uncompressed;
}

/**
 * Generates deterministic 16-digit Luhn-valid card number
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
 * Calculates Luhn checksum
 */
export function luhnChecksum(number: string): string {
	let sum = 0;
	let alternate = false;

	for (let i = number.length - 1; i >= 0; i--) {
		let n = parseInt(number[i], 10);
		if (isNaN(n)) throw new Error("Invalid digit in card number");

		if (alternate) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		alternate = !alternate;
	}

	return ((10 - (sum % 10)) % 10).toString();
}

/**
 * Gets address from public key
 */
export function getAddressFromPublicKey(publicKey: string): string {
	const publicKeyBytes = hexToUint8Array(publicKey);
	return getAddress(publicKeyBytes);
}

/**
 * Verifies public key matches address
 */
export function verifyPublicKeyAddress(
	publicKey: string,
	address: string,
): boolean {
	try {
		const derivedAddress = getAddressFromPublicKey(publicKey);
		return derivedAddress === address;
	} catch {
		return false;
	}
}
