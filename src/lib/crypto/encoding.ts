export function strToUint8Array(str: string): Uint8Array {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }
  return new TextEncoder().encode(str);
}

export function uint8ArrayToStr(bytes: Uint8Array): string {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("Input must be a Uint8Array");
  }
  return new TextDecoder().decode(bytes);
}

export function isValidHex(hex: string): boolean {
  return /^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0;
}

export function hexToUint8Array(hex: string): Uint8Array {
  if (!isValidHex(hex)) {
    throw new Error("Invalid hex string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateRandomString(
  length: number,
  encoding: "hex" | "base64" | "base64url" = "hex",
): string {
  if (length < 1 || length > 1024) {
    throw new Error("Length must be between 1 and 1024 bytes");
  }

  const randomBytes = crypto.getRandomValues(new Uint8Array(length));

  switch (encoding) {
    case "hex":
      return Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    case "base64":
      return btoa(String.fromCharCode(...randomBytes));
    case "base64url":
      return btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    default:
      throw new Error(
        'Invalid encoding. Use "hex", "base64", or "base64url"',
      );
  }
}
