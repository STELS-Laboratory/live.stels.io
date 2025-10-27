import { strToUint8Array } from "./encoding.ts";

export async function generateSHA256Hash(data: string): Promise<string> {
  try {
    if (typeof data !== "string") {
      throw new Error("Data must be a string");
    }

    const dataBytes = strToUint8Array(data);
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      dataBytes as BufferSource,
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    throw new Error(
      `SHA-256 hashing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
