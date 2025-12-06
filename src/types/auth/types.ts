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
 * Sonar node location data
 */
export interface SonarNodeLocation {
	ip: string;
	country: string;
	timezone: string;
	latitude?: number | null;
	longitude?: number | null;
}

/**
 * Sonar node mining data
 */
export interface SonarNodeMining {
	totalMined: string;
	totalMinedSLI: number;
	lastRewardEpoch: number;
}

/**
 * Sonar node operations data
 */
export interface SonarNodeOperations {
	total: number;
	errors: number;
	networkErrors: number;
	criticalErrors: number;
	successRate: number;
}

/**
 * Sonar node workers data
 */
export interface SonarNodeWorkers {
	active: number;
	stopped: number;
	total: number;
	local: number;
	network: number;
}

/**
 * Sonar node CPU metrics
 */
export interface SonarNodeCpu {
	load1min: number;
	load5min: number;
	load15min: number;
}

/**
 * Sonar node memory metrics
 */
export interface SonarNodeMemory {
	heapUsed: number;
	heapTotal: number;
	external: number;
	rss: number;
}

/**
 * Sonar node version information
 */
export interface SonarNodeVersion {
	deno: string;
	v8: string;
	typescript: string;
}

/**
 * Sonar node system metrics
 */
export interface SonarNodeSystem {
	cpu: SonarNodeCpu;
	memory: SonarNodeMemory;
	uptime: number;
	version: SonarNodeVersion;
	pid: number;
	ppid: number;
}

/**
 * Sonar node P2P metrics
 */
export interface SonarNodeP2P {
	peerConnections: number;
	onlinePeers: number;
	offlinePeers: number;
	p2pErrors: number;
}

/**
 * Sonar node worker performance metrics
 */
export interface SonarNodeWorkerPerformance {
	averageExecutionTime: number;
	totalExecutionTime: number;
	fastestExecution: number;
	slowestExecution: number;
	executionCount: number;
}

/**
 * Sonar node consensus metrics
 */
export interface SonarNodeConsensus {
	currentEpoch: number;
	epochParticipation: number;
	leaderElections: number;
	consensusErrors: number;
	workerOperationsTracked: number;
}

/**
 * Sonar normalized node data
 */
export interface SonarNormalizedNode {
	id: string;
	operations: SonarNodeOperations;
	workers: SonarNodeWorkers;
	mining?: SonarNodeMining;
	location?: SonarNodeLocation;
	system?: SonarNodeSystem;
	p2p?: SonarNodeP2P;
	workerPerformance?: SonarNodeWorkerPerformance;
	consensus?: SonarNodeConsensus;
}

/**
 * Sonar network statistics
 */
export interface SonarNetworkStats {
	totalOperations: number;
	totalErrors: number;
	totalWorkers: number;
	activeWorkers: number;
	successRate: number;
	totalMined?: string;
	totalMinedSLI?: number;
	averageCpuLoad?: number;
	totalMemoryUsed?: number;
	totalPeerConnections?: number;
	averageExecutionTime?: number;
	totalEpochParticipation?: number;
	lastEpoch?: number;
	totalNetworkErrors?: number;
	totalCriticalErrors?: number;
	averageSuccessRate?: number;
	nodesWithActiveWorkers?: number;
	averageWorkersPerNode?: number;
	averageMemoryUsage?: number;
	networkUptime?: number;
	networkHealth?: number;
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
					lastUpdate?: number;
					nodeId: string;
					currentNode: {
						id: string;
						operations: SonarNodeOperations;
						workers: SonarNodeWorkers;
						mining?: SonarNodeMining;
						location?: SonarNodeLocation;
						system?: SonarNodeSystem;
						p2p?: SonarNodeP2P;
						workerPerformance?: SonarNodeWorkerPerformance;
						consensus?: SonarNodeConsensus;
					};
					workers: SonarNodeWorkers;
				};
				timestamp: number;
			}
		>;
		nodesNormalized?: Record<string, SonarNormalizedNode>;
		network: SonarNetworkStats;
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
		lastAggregation?: number;
		aggregatedAt?: number;
		recentTransactions?: SonarTransaction[];
	};
	timestamp: number;
}

/**
 * Sonar transaction data
 */
export interface SonarTransaction {
	tx_hash: string;
	network: string;
	token_id: string;
	status: "confirmed" | "failed" | "pending";
	submitted_at: number;
	submitted_by: string;
	from: string;
	to: string;
	amount: string;
	currency: string;
	received_at: number;
}

