/**
 * Gliesereum cryptographic utilities
 * Low-level cryptographic functions for hashing, signing, and verification
 * 
 * ⚠️ CRITICAL: Do not modify cryptographic functions
 * These must match server-side implementation exactly
 */

// @ts-types="npm:@types/elliptic@6.4.18"
import elliptic from "elliptic";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";

const EC = new elliptic.ec("secp256k1");

/**
 * Converts hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
	if (hex.startsWith("0x")) hex = hex.slice(2);
	if (hex.length % 2 !== 0) hex = "0" + hex;
	return new Uint8Array(
		hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
	);
}

/**
 * Converts Uint8Array to hex string
 */
export function toHex(bytes: Uint8Array): string {
	return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Concatenates multiple Uint8Arrays
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
 * Constant-time comparison for security
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
 * Ensures public key is in compressed format
 */
export function ensureCompressedKey(publicKey: Uint8Array): Uint8Array {
	if (publicKey.length === 65 && publicKey[0] === 0x04) {
		const ecKey = EC.keyFromPublic(toHex(publicKey), "hex");
		return hexToUint8Array(ecKey.getPublic(true, "hex"));
	}
	return publicKey;
}

/**
 * Hashes input using SHA256 then RIPEMD160
 */
export function createHash(bytes: Uint8Array): Uint8Array {
	return ripemd160(sha256(bytes));
}

/**
 * Creates checksum using SHA256
 */
export function createChecksum(bytes: Uint8Array): Uint8Array {
	return sha256(bytes).slice(0, 4);
}

/**
 * Deterministic JSON stringify for consistent hashing (gls-det-1)
 * ⚠️ CRITICAL: Must match server-side implementation EXACTLY
 * 
 * SPECIFICATION (gls-det-1):
 * - Missing keys are NOT serialized (absence, not null)
 * - undefined values ARE serialized as null
 * - Keys are sorted lexicographically
 * - No whitespace
 */
export function deterministicStringify(obj: unknown): string {
	if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
	if (Array.isArray(obj)) {
		return `[${obj.map(deterministicStringify).join(",")}]`;
	}
	const keys = Object.keys(obj as Record<string, unknown>).sort();
	const pairs: string[] = [];
	for (const key of keys) {
		const value = (obj as Record<string, unknown>)[key];
		// CRITICAL: Check if key exists using hasOwnProperty
		// Missing keys are NOT serialized (absence)
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			if (value === undefined) {
				// undefined -> null (per gls-det-1 spec)
				pairs.push(`"${key}":null`);
			} else {
				pairs.push(`"${key}":${deterministicStringify(value)}`);
			}
		}
	}
	return `{${pairs.join(",")}}`;
}

/**
 * Signs data with private key
 * ⚠️ CRITICAL: Returns DER format - do not change!
 */
export function sign(data: string, privateKey: string): string {
	const hash = sha256(new TextEncoder().encode(data));
	// @ts-expect-error - elliptic library types are incomplete
	const signature = EC.sign(hash, hexToUint8Array(privateKey), {
		canonical: true,
	});
	return signature.toDER("hex");
}

/**
 * Verifies signature
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
		console.error("Verification error:", error);
		return false;
	}
}

/**
 * Signs with domain separation
 */
export function signWithDomain(
	data: string,
	privateKey: string,
	domain: string[],
): string {
	const domainStr = domain.join(":");
	const message = `${domainStr}:${data}`;
	return sign(message, privateKey);
}
