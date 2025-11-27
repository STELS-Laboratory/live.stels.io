import { strToUint8Array, uint8ArrayToStr } from "./encoding.ts";
import type { EncryptResult } from "./types.ts";
import { AES_GCM_IV_SIZE } from "./types.ts";

async function deriveAESKey(key: string): Promise<Uint8Array> {
  const keyBytes = strToUint8Array(key);

  if ([16, 24, 32].includes(keyBytes.length)) {
    return keyBytes;
  }

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    keyBytes as BufferSource,
  );
  return new Uint8Array(hashBuffer);
}

export async function encrypt(
  data: string,
  key: string,
): Promise<EncryptResult> {
  try {
    if (typeof data !== "string") {
      throw new Error("Data must be a string");
    }

    if (typeof key !== "string") {
      throw new Error("Key must be a string");
    }

    const keyBytes = await deriveAESKey(key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
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

    return { iv, encryptedData };
  } catch {
    throw new Error(
      `Encryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function decrypt(
  encryptedData: Uint8Array,
  iv: Uint8Array,
  key: string,
): Promise<string> {
  try {
    if (!(encryptedData instanceof Uint8Array)) {
      throw new Error("Encrypted data must be a Uint8Array");
    }

    if (!(iv instanceof Uint8Array) || iv.length !== AES_GCM_IV_SIZE) {
      throw new Error(`IV must be a Uint8Array of ${AES_GCM_IV_SIZE} bytes`);
    }

    if (typeof key !== "string") {
      throw new Error("Key must be a string");
    }

    const keyBytes = await deriveAESKey(key);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const decryptedData = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        cryptoKey,
        encryptedData as BufferSource,
      ),
    );

    return uint8ArrayToStr(decryptedData);
  } catch {
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
