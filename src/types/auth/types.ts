/**
 * Authentication-related type definitions
 */

import type { Wallet } from "@/lib/gliesereum";

/**
 * Network configuration interface
 */
export interface NetworkConfig {
	id: string;
	name: string;
	api: string;
	socket: string;
	developer: boolean;
	description?: string;
}

/**
 * Connection session data
 */
export interface ConnectionSession {
	session: string;
	token: string;
	network: string;
	title: string;
	nid: string;
	api: string;
	socket: string;
	developer: boolean;
}

/**
 * Authentication state interface
 */
export interface AuthState {
	// Wallet state
	wallet: Wallet | null;
	isWalletCreated: boolean;
	
	// Network state
	selectedNetwork: NetworkConfig | null;
	availableNetworks: NetworkConfig[];
	
	// Connection state
	isConnected: boolean;
	isConnecting: boolean;
	connectionSession: ConnectionSession | null;
	connectionError: string | null;
	
	// UI state
	isAuthenticated: boolean;
	showNetworkSelector: boolean;
	showSecurityWarning: boolean;
	showSessionExpiredModal: boolean;
	_hasHydrated: boolean;
}

/**
 * Authentication actions interface
 */
export interface AuthActions {
	// Wallet operations
	createNewWallet: () => void;
	importExistingWallet: (privateKey: string) => boolean;
	resetWallet: () => void;
	
	// Network operations
	setAvailableNetworks: (networks: NetworkConfig[]) => void;
	selectNetwork: (network: NetworkConfig) => void;
	
	// Connection operations
	connectToNode: () => Promise<boolean>;
	disconnectFromNode: () => Promise<void>;
	restoreConnection: () => Promise<boolean>;
	
	// UI operations
	setShowNetworkSelector: (show: boolean) => void;
	setShowSecurityWarning: (show: boolean) => void;
	setShowSessionExpiredModal: (show: boolean) => void;
	clearConnectionError: () => void;
	
	// Utility operations
	resetAuth: () => Promise<void>;
}

/**
 * Combined auth store type
 */
export type AuthStore = AuthState & AuthActions;

/**
 * Step type for professional connection flow
 */
export type StepType = "type" | "create" | "confirm" | "network" | "connecting" | "success";

/**
 * Professional connection flow component props
 */
export interface ProfessionalConnectionFlowProps {
	onSuccess?: () => void;
}

/**
 * Sonar data structure from sessionStorage
 */
export interface SonarNodeData {
	channel: string;
	module: string;
	widget: string;
	raw: {
		timestamp: number;
		totalNodes: number;
		nodes: Record<
			string,
			{
				channel: string;
				module: string;
				widget: string;
				raw: {
					accounts: string[];
					connectors: unknown[];
					liquidity: number;
					protection: number;
					available: number;
					margin: {
						balance: number;
						initial: number;
						maintenance: number;
					};
					rate: number;
					exchanges: string[];
					uniqueExchange: number;
					coins: Record<string, number>;
					timestamp: number;
					currentNode: {
						id: string;
						operations: {
							total: number;
							errors: number;
							networkErrors: number;
							criticalErrors: number;
							successRate: number;
						};
						workers: {
							active: number;
							stopped: number;
							total: number;
							local: number;
							network: number;
						};
					};
					workers: {
						active: number;
						stopped: number;
						total: number;
						local: number;
						network: number;
					};
				};
				timestamp: number;
			}
		>;
		network: {
			totalOperations: number;
			totalErrors: number;
			totalWorkers: number;
			activeWorkers: number;
			successRate: number;
		};
		accounts: string[];
		exchanges: string[];
		liquidity: number;
		protection: number;
		available: number;
		margin: {
			balance: number;
			initial: number;
			maintenance: number;
		};
		rate: number;
		coins: Record<string, number>;
	};
	timestamp: number;
}

