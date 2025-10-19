/**
 * Auth Components Utilities
 * Helper functions for authentication components
 */

import type { NetworkConfig } from "@/stores/modules/auth.store";

/**
 * Validate private key format
 */
export function validatePrivateKey(key: string): {
  isValid: boolean;
  message: string;
  type: "success" | "error" | null;
} {
  // Remove any whitespace and 0x prefix
  const cleanKey = key.replace(/^0x/, "").replace(/\s/g, "");

  // Empty check
  if (!cleanKey) {
    return {
      isValid: false,
      message: "",
      type: null,
    };
  }

  // Check if it's a valid hex string
  if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
    return {
      isValid: false,
      message:
        "Private key must contain only hexadecimal characters (0-9, a-f)",
      type: "error",
    };
  }

  // Check length (64 characters for 256-bit key)
  if (cleanKey.length !== 64) {
    return {
      isValid: false,
      message:
        `Private key must be exactly 64 characters long (currently ${cleanKey.length})`,
      type: "error",
    };
  }

  return {
    isValid: true,
    message: "Private key format is valid",
    type: "success",
  };
}

/**
 * Format address for display (shortened)
 */
export function formatAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4,
): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Copy to clipboard with error handling
 */
export async function copyToClipboard(
  text: string,
): Promise<{ success: boolean; error?: Error }> {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get network display info
 */
export function getNetworkInfo(network: NetworkConfig): {
  name: string;
  description: string;
  category: string;
} {
  return {
    name: network.name,
    description: network.description || "",
    category: network.developer ? "Development" : "Production",
  };
}

/**
 * Validate wallet data completeness
 */
export function isWalletComplete(wallet: {
  address?: string;
  publicKey?: string;
  privateKey?: string;
  number?: string;
} | null): boolean {
  if (!wallet) return false;
  return !!(
    wallet.address &&
    wallet.publicKey &&
    wallet.privateKey &&
    wallet.number
  );
}

/**
 * Sleep utility for async delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safe parse JSON
 */
export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Generate secure random hex string
 */
export function generateSecureHex(length: number = 64): string {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Debounce function for input validation
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Check if touch device
 */
export function isTouchDevice(): boolean {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
}

/**
 * Get password strength
 */
export function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  score: number;
  feedback: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      strength: "weak",
      score,
      feedback: "Password is too weak. Use longer password with mixed characters.",
    };
  } else if (score <= 4) {
    return {
      strength: "medium",
      score,
      feedback: "Password is medium. Consider adding special characters.",
    };
  } else {
    return {
      strength: "strong",
      score,
      feedback: "Password is strong!",
    };
  }
}

