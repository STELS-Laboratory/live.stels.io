/**
 * Welcome module exports
 * 
 * Hybrid approach:
 * - Original Welcome.tsx (917 lines) remains in parent directory with FULL functionality
 * - This module provides extracted types and constants for REUSE
 * - Can be used independently in other parts of the app
 * 
 * Future: Gradually update Welcome.tsx to use these imports
 */

// Main component from parent directory
export { default } from "../Welcome";

// Extracted modules for reuse
export * from "./types";
export * from "./constants";

