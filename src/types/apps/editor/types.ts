/**
 * Editor application type definitions
 */

/**
 * Worker/Protocol definition
 */
export interface Worker {
	key: string[];
	value: {
		raw: {
			sid: string;
			nid: string;
			active: boolean;
			note: string;
			script: string;
			dependencies: string[];
			version: string;
			timestamp: number;
			scope?: "local" | "network";
			executionMode?: "parallel" | "leader" | "exclusive";
			priority?: "critical" | "high" | "normal" | "low";
			mode?: "loop" | "single";
			accountId?: string;
			assignedNode?: string;
		};
		channel: string;
	};
}

/**
 * Editor Store State
 */
export interface EditorStoreState {
	/** List of workers */
	workers: Worker[];
	/** Workers loading state */
	workersLoading: boolean;
	/** Workers error message */
	workersError: string | null;
	/** Worker editor state */
	worker: {
		isLoading: boolean;
		isEditor: boolean;
	};
}

/**
 * Leader info data
 */
export interface LeaderInfo {
	workerId: string;
	hasLeader: boolean;
	leader: string | null;
	timestamp: number;
	expiresAt: number;
	renewedAt: number;
	expiresIn: number;
	isExpired: boolean;
}

/**
 * Worker statistics
 */
export interface WorkerStats {
	sid: string;
	executions: number;
	errors: number;
	errorRate: number;
	networkErrors: number;
	criticalErrors: number;
	isRunning: boolean;
	lastExecution?: number;
}

/**
 * Worker creation request
 */
export interface WorkerCreateRequest {
	scriptContent: string;
	dependencies: string[];
	version: string;
	scope: "local" | "network";
	executionMode: "parallel" | "leader" | "exclusive";
	priority: "critical" | "high" | "normal" | "low";
	mode?: "loop" | "single";
	accountId?: string;
	assignedNode?: string;
	note?: string;
}

/**
 * Editor Store Actions
 */
export interface EditorStoreActions {
	/** Fetch all workers from API */
	listWorkers: () => Promise<void>;
	/** Create new worker with full configuration */
	createWorker: (request: WorkerCreateRequest) => Promise<Worker | null>;
	/** Legacy create method (deprecated) */
	setWorker: () => Promise<Worker | null>;
	/** Update existing worker */
	updateWorker: (workerData: Worker) => Promise<Worker | null>;
	/** Migrate worker to network with new SID */
	migrateWorkerWithNewSid: (worker: Worker) => Promise<Worker | null>;
	/** Get leader info for a worker */
	getLeaderInfo: (workerId: string) => Promise<LeaderInfo | null>;
	/** Get stats for all workers */
	getWorkerStats: () => Promise<WorkerStats[]>;
	/** Stop all active workers */
	stopAllWorkers: () => Promise<{ stopped: number; failed: number; total: number }>;
	/** Clear workers error */
	clearError: () => void;
}

/**
 * Editor Store Type
 */
export type EditorStore = EditorStoreState & EditorStoreActions;

