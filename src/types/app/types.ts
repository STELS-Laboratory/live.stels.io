/**
 * Application-level type definitions
 */

/**
 * App states for managing transitions
 */
export type AppState =
	| "initializing"
	| "scanning_storage"
	| "hydrating"
	| "checking_session"
	| "authenticating"
	| "connecting"
	| "loading_app"
	| "ready"
	| "upgrading";

/**
 * Combined UI state interface
 */
export interface UIState {
	showSplash: boolean;
	forceRender: boolean;
	transitionProgress: number;
	storageScanComplete: boolean;
}

