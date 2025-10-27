/**
 * Token Builder Utilities
 * Helper functions and constants
 */

/**
 * Icon upload constraints
 */
export const ICON_CONSTRAINTS = {
  MAX_SIZE_BYTES: 128 * 1024,
  MAX_SIZE_KB: 128,
  ALLOWED_TYPES: ["image/png", "image/jpeg", "image/gif", "image/svg+xml"],
  ALLOWED_EXTENSIONS: [".png", ".jpg", ".jpeg", ".gif", ".svg"],
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
  SIGNING_COOLDOWN_MS: 2000,
  VALIDATION_DEBOUNCE_MS: 300,
  INPUT_DEBOUNCE_MS: 300,
} as const;

/**
 * Validation messages
 */
export const VALIDATION_MESSAGES = {
  ICON_TOO_LARGE: (sizeKB: number): string =>
    `Icon size (${sizeKB}KB) exceeds maximum allowed size (${ICON_CONSTRAINTS.MAX_SIZE_KB}KB)`,
  ICON_INVALID_TYPE: "Please upload an image file (PNG, JPG, GIF, SVG)",
  NO_WALLET: "No wallet connected. Please connect wallet or use manual key.",
  SIGNING_COOLDOWN: (seconds: number): string =>
    `Please wait ${seconds} seconds before signing again`,
  CERTIFICATE_CREATED: "Token certificate created successfully!",
  CERTIFICATE_EXPORTED: "Certificate exported successfully",
  EXPORT_FAILED: "Failed to export certificate",
  SIGNING_FAILED: "Failed to sign schema",
  ICON_UPLOADED: "Token icon uploaded successfully",
  UPLOAD_FAILED: "Failed to upload icon",
} as const;

/**
 * Certificate history display limits
 */
export const HISTORY_DISPLAY = {
  DEFAULT_LIMIT: 3,
  MAX_HISTORY: 10,
} as const;

/**
 * Read file as Data URL
 * @param file - File to read
 * @returns Promise with Data URL string
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event): void => {
      const dataUrl = event.target?.result as string;
      resolve(dataUrl);
    };
    reader.onerror = (): void => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Type guard for allowed image types
 * @param type - MIME type string to check
 * @returns True if type is allowed
 */
function isAllowedImageType(type: string): type is typeof ICON_CONSTRAINTS.ALLOWED_TYPES[number] {
  return (ICON_CONSTRAINTS.ALLOWED_TYPES as readonly string[]).includes(type);
}

/**
 * Validate file for icon upload
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateIconFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Validate file type
  if (!isAllowedImageType(file.type)) {
    return {
      valid: false,
      error: VALIDATION_MESSAGES.ICON_INVALID_TYPE,
    };
  }

  // Validate file size
  if (file.size > ICON_CONSTRAINTS.MAX_SIZE_BYTES) {
    const sizeKB = Math.round(file.size / 1024);
    return {
      valid: false,
      error: VALIDATION_MESSAGES.ICON_TOO_LARGE(sizeKB),
    };
  }

  return { valid: true };
}

/**
 * Format time remaining in seconds
 * @param ms - Milliseconds remaining
 * @returns Seconds (rounded up)
 */
export function formatTimeRemaining(ms: number): number {
  return Math.ceil(ms / 1000);
}

/**
 * Get decimals based on token standard
 * NFT tokens use 0 decimals, fungible tokens use 6
 * @param standard - Token standard
 * @returns Decimals (0 or 6)
 */
export function getDecimalsByStandard(
  standard: string | undefined,
): number {
  const nftStandards = ["non-fungible", "semi-fungible", "soulbound"];
  return standard && nftStandards.includes(standard) ? 0 : 6;
}

/**
 * Generate certificate filename
 * @param symbol - Token symbol
 * @param type - File type suffix
 * @returns Filename string
 */
export function generateCertificateFilename(
  symbol: string,
  type: "certificate" | "export" = "certificate",
): string {
  const timestamp = Date.now();
  return `token-${symbol}-${type}-${timestamp}.json`;
}

