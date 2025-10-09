/**
 * Gliesereum blockchain library - Re-export
 * This file maintains backward compatibility by re-exporting the refactored Gliesereum module
 * 
 * The original 1093 line file has been refactored into a modular structure:
 * - gliesereum/types.ts - Type definitions
 * - gliesereum/crypto.ts - Cryptographic utilities
 * - gliesereum/Wallet.ts - Wallet management
 * - gliesereum/validation.ts - Validation functions
 * - gliesereum/index.ts - Main exports and transactions
 */

export * from "./gliesereum/index";
export { default } from "./gliesereum/index";
