import { strToUint8Array, uint8ArrayToStr } from "./encoding.ts";
import type { KeyDerivationResult, PasswordEncryptionResult } from "./types.ts";
import {
  AES_GCM_IV_SIZE,
  DEFAULT_PBKDF2_ITERATIONS,
  MAX_KEY_LENGTH,
  MIN_KEY_LENGTH,
  MIN_PBKDF2_ITERATIONS,
  SALT_SIZE,
} from "./types.ts";

async function importKey(password: string): Promise<CryptoKey> {
  if (!password || password.length === 0) {
    throw new Error("Password cannot be empty");
  }

  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(password);

  return await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"],
  );
}

export async function deriveKey(
  password: string,
  salt?: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
  keyLength: number = 32,
): Promise<KeyDerivationResult> {
  try {
    if (typeof password !== "string") {
      throw new Error("Password must be a string");
    }

    if (iterations < MIN_PBKDF2_ITERATIONS) {
      throw new Error(
        `Iterations must be at least ${MIN_PBKDF2_ITERATIONS} for security`,
      );
    }

    if (keyLength < MIN_KEY_LENGTH || keyLength > MAX_KEY_LENGTH) {
      throw new Error(
        `Key length must be between ${MIN_KEY_LENGTH} and ${MAX_KEY_LENGTH} bytes`,
      );
    }

    const saltBytes = salt || crypto.getRandomValues(new Uint8Array(SALT_SIZE));

    const baseKey = await importKey(password);

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes as BufferSource,
        iterations: iterations,
        hash: "SHA-256",
      },
      baseKey,
      keyLength * 8,
    );

    return {
      key: new Uint8Array(derivedBits),
      salt: saltBytes,
    };
  } catch {
    throw new Error(
      `Key derivation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function encryptWithPassword(
  data: string,
  password: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
): Promise<PasswordEncryptionResult> {
  try {
    const { key, salt } = await deriveKey(password, undefined, iterations);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key as BufferSource,
      { name: "AES-GCM" },
      false,
      ["encrypt"],
    );

    const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_SIZE));
    const encryptedData = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        cryptoKey,
        strToUint8Array(data) as BufferSource,
      ),
    );

    return { encryptedData, iv, salt };
  } catch {
    throw new Error(
      `Password-based encryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function decryptWithPassword(
  encrypted: PasswordEncryptionResult,
  password: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS,
): Promise<string> {
  try {
    const { key } = await deriveKey(password, encrypted.salt, iterations);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key as BufferSource,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const decryptedData = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: encrypted.iv as BufferSource },
        cryptoKey,
        encrypted.encryptedData as BufferSource,
      ),
    );

    return uint8ArrayToStr(decryptedData);
  } catch {
    throw new Error(
      `Password-based decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
