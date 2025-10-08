/**
 * Scanner module
 * 
 * Hybrid approach:
 * - Original Scanner.tsx (3534 lines) remains in parent directory with FULL functionality
 * - This module provides extracted types, utils, and components for REUSE
 * - Components can be used independently in other parts of the app
 * 
 * Future: Gradually replace inline definitions with imports from these modules
 */

// Main component from parent directory
export { default } from "../Scanner";

// Extracted modules for reuse
export * from "./types";
export * from "./utils";
export * from "./components";
