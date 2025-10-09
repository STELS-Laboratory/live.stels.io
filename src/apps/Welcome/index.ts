/**
 * Welcome module exports
 */

// Main component - Premium version
export { default } from "./Welcome.tsx";

// Legacy components (for backwards compatibility)
export { AppCard } from "./AppCard.tsx";
export { LoadingOverlay } from "./LoadingOverlay.tsx";
export { FeatureHighlight } from "./FeatureHighlight.tsx";
export { SectionHeader } from "./SectionHeader.tsx";

// New premium components
export * from "./components";

// Store
export * from "./store.ts";

// Types and data
export type { AppMetadata } from "./types.ts";
export * from "./constants.tsx";
export { applications } from "./applications.tsx";
