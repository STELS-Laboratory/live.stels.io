/**
 * Metrics Store
 * Manages system metrics via HTTP endpoints and aggregated data
 * 
 * WebFIX v2.12.0: All responses use `raw` field for data payload
 * See: /docs/METRICS-FRONTEND-GUIDE.md
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "./auth.store";
import { WebfixApiClient } from "@/lib/webfix-api-client";

// ============================================
// WebFIX v2.12.0 Response Wrapper
// ============================================

interface WebfixResponse<T> {
  success: boolean;
  channel?: string;
  module?: string;
  widget?: string;
  raw?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    httpStatus?: number;
  };
  timestamp?: number;
  requestId?: string;
}

// ============================================
// Types (Updated per METRICS-FRONTEND-GUIDE.md)
// ============================================

export type MetricType = "counter" | "gauge" | "histogram" | "timer";

export interface MetricItem {
  name: string;
  type: MetricType;
  value: number | Record<string, number>;
  labels?: Record<string, string>;
  help?: string;
}

// Updated SystemMetrics per new spec
export interface SystemMetrics {
  uptime: number;  // Server uptime in seconds
  memory: {
    rss: number;       // Resident Set Size (bytes)
    heapUsed: number;  // Heap memory used (bytes)
    heapTotal: number; // Total heap memory (bytes)
    external: number;  // External memory (bytes)
  };
  deno: {
    version: string;   // e.g., "1.40.0"
    buildType: string; // e.g., "x86_64-apple-darwin"
  };
}

// New: RPC Metrics
export interface RpcMetrics {
  totalMethods: number;  // Total registered RPC methods
  totalCalls: number;    // Total RPC calls since startup
  totalErrors: number;   // Total RPC errors
  avgDuration: number;   // Average duration in milliseconds
  topMethods: Array<{
    method: string;      // Method name, e.g., "listAgents"
    calls: number;       // Call count
    avgDuration: number; // Average duration in ms
  }>;
}

// New: Routing Metrics
export interface RoutingMetrics {
  totalRoutes: number;
  byAccess: {
    public: number;    // Public endpoints (no auth)
    session: number;   // Session required
    developer: number; // Developer access required
    owner: number;     // Owner access required
  };
  byRateLimit: {
    body: number;      // Per-body rate limit
    global: number;    // Global rate limit
    trading: number;   // Trading rate limit
    auth: number;      // Auth rate limit
    none: number;      // No rate limit
  };
  byTag: Record<string, number>; // e.g., { "Agents": 8, "Tasks": 10 }
}

// New: Tracing Metrics
export interface TracingMetrics {
  activeSpans: number;    // Currently active spans
  completedSpans: number; // Total completed spans
  recentTraces: Array<{
    traceId: string;
    operationName: string;
    duration: number;     // Duration in ms
    status: string;       // "ok" | "error"
  }>;
}

// New: Application Metrics (Most useful for dashboards)
export interface ApplicationMetrics {
  http: {
    requestsTotal: number;     // Total HTTP/RPC requests
    errorsTotal: number;       // Total errors (4xx + 5xx)
    avgRequestDuration: number; // Average request duration (ms)
  };
  agents: {
    activeCount: number;       // Active agents (status=active)
    messagesTotal: number;     // Total chat messages
    avgResponseTime: number;   // Average agent response time (ms)
  };
  tasks: {
    executionsTotal: number;   // Total task executions
    errorsTotal: number;       // Failed task executions
    pendingCount: number;      // Tasks waiting to execute
    avgExecutionDuration: number; // Average task duration (ms)
  };
  chains: {
    executionsTotal: number;   // Total chain executions
    avgExecutionDuration: number; // Average chain duration (ms)
  };
  domains: {
    operationsTotal: number;   // Total domain operations
    avgOperationDuration: number; // Average operation duration (ms)
  };
  connections: {
    activeCount: number;       // Active WebSocket connections
    errorsTotal: number;       // Connection errors
  };
}

// ============================================
// Worker Metrics (v2.14.0)
// ============================================

export interface WorkerCapacity {
  current: number;        // Current number of running workers
  maxRecommended: number; // Maximum recommended workers per node
  utilizationPercent: number; // Capacity utilization percentage
}

export interface WorkerThresholds {
  maxConsecutiveNetworkErrors: number; // Max consecutive network errors before pause
  maxCriticalErrors: number;           // Max critical errors before stop
  maxConsecutiveErrors: number;        // Max consecutive errors of any type
  networkErrorPauseMs: number;         // Pause duration after network errors (ms)
}

export interface WorkerCache {
  functions: number;  // Number of cached functions
  loggers: number;    // Number of cached loggers
  hitRate: number;    // Cache hit rate percentage
  totalHits: number;  // Total cache hits
}

export interface WorkerScopeStats {
  total: number;   // Total workers of this scope in KV
  active: number;  // Workers with active=true flag
  running: number; // Currently running workers on this node
}

export interface WorkerDetail {
  sid: string;         // Worker session ID
  isRunning: boolean;  // Whether worker is currently running
  scope: "local" | "network"; // Worker scope
  executions: number;  // Total executions count
  errors: number;      // Total errors count
  errorRate: number;   // Error rate percentage
  uptime: number;      // Worker uptime in milliseconds
  lastRun: number | null; // Last run timestamp (null if never ran)
}

export interface WorkerMetrics {
  // Counts
  totalWorkers: number;   // Total number of workers (running + stopped)
  runningWorkers: number; // Number of currently running workers
  stoppedWorkers: number; // Number of stopped workers
  
  // By scope (v2.14.0)
  local: WorkerScopeStats;   // Local workers (scope=local, stored in local KV)
  network: WorkerScopeStats; // Network workers (scope=network, stored in distributed KV)
  
  // Execution stats
  totalExecutions: number;  // Total worker executions across all workers
  totalErrors: number;      // Total errors across all workers
  networkErrors: number;    // Total network-related errors
  criticalErrors: number;   // Total critical errors (may stop worker)
  errorRate: number;        // Overall error rate percentage
  
  // Capacity
  capacity: WorkerCapacity;
  
  // Thresholds
  thresholds: WorkerThresholds;
  
  // Cache
  cache: WorkerCache;
  
  // Top workers
  topWorkers: WorkerDetail[];
}

// Full Metrics data structure (new unified format)
export interface FullMetrics {
  timestamp: number;
  system: SystemMetrics;
  rpc: RpcMetrics;
  routing: RoutingMetrics;
  tracing: TracingMetrics;
  application: ApplicationMetrics;
  workers?: WorkerMetrics; // Added in v2.14.0
}

// Legacy MetricsData (for backward compatibility)
export type MetricsData = FullMetrics;

export interface GetMetricsParams {
  format?: "json" | "prometheus";
  includeSystem?: boolean;
  includeRpc?: boolean;
  includeTracing?: boolean;
  includeApplication?: boolean;
  includeWorkers?: boolean; // Added in v2.14.0
}

// Logging Metrics
export type LoggingMetricsPeriod = "hour" | "day" | "week";

export interface LogLevelBreakdown {
  error: number;
  warn: number;
  info: number;
  debug: number;
}

export interface TopLogger {
  workerId: string;
  logCount: number;
}

export interface LoggingMetrics {
  totalLogs: number;
  logsPerMinute: number;
  errorRate: number;
  byLevel: LogLevelBreakdown;
  topLoggers: TopLogger[];
}

export interface GetLoggingMetricsParams {
  period?: LoggingMetricsPeriod;
  workerId?: string;
}

// Trading Metrics (from market-making.yaml)
export interface TradingMetrics {
  spreadCapture?: number;
  fillRate?: number;
  inventoryTurnover?: number;
  sharpeRatio?: number;
  pnl?: number;
  volume24h?: number;
  trades24h?: number;
}

export interface GetTradingMetricsParams {
  strategyId?: string;
  accountId?: string;
  period?: "hour" | "day" | "week" | "month";
}

// Store Types
export interface MetricsStore {
  // State
  metrics: FullMetrics | null;
  loggingMetrics: LoggingMetrics | null;
  tradingMetrics: TradingMetrics | null;
  
  // Loading states
  metricsLoading: boolean;
  loggingLoading: boolean;
  tradingLoading: boolean;
  
  // Error states
  metricsError: string | null;
  loggingError: string | null;
  tradingError: string | null;
  
  // Last update timestamps
  lastMetricsUpdate: number | null;
  lastLoggingUpdate: number | null;
  lastTradingUpdate: number | null;

  // Actions
  getMetrics: (params?: GetMetricsParams) => Promise<FullMetrics | null>;
  getLoggingMetrics: (params?: GetLoggingMetricsParams) => Promise<LoggingMetrics | null>;
  getTradingMetrics: (params?: GetTradingMetricsParams) => Promise<TradingMetrics | null>;
  
  // UI Actions
  clearMetrics: () => void;
  refreshAll: () => Promise<void>;
}

// ============================================
// Helper
// ============================================

function getApiClient(): WebfixApiClient | null {
  const connectionSession = useAuthStore.getState().connectionSession;
  if (!connectionSession) return null;

  const client = new WebfixApiClient(connectionSession.api);
  client.setSession(connectionSession.session);
  return client;
}

// ============================================
// Store
// ============================================

export const useMetricsStore = create<MetricsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      metrics: null,
      loggingMetrics: null,
      tradingMetrics: null,
      
      metricsLoading: false,
      loggingLoading: false,
      tradingLoading: false,
      
      metricsError: null,
      loggingError: null,
      tradingError: null,
      
      lastMetricsUpdate: null,
      lastLoggingUpdate: null,
      lastTradingUpdate: null,

      // Get system metrics
      getMetrics: async (params?: GetMetricsParams): Promise<FullMetrics | null> => {
        const client = getApiClient();
        if (!client) {
          set({ metricsError: "Not connected to server" });
          return null;
        }

        set({ metricsLoading: true, metricsError: null });

        try {
          const response = await client.request<WebfixResponse<FullMetrics>>(
            "getMetrics",
            params || { format: "json" }
          );

          console.log("[MetricsStore] getMetrics response:", response);

          // WebFIX v2.12.0: Parse response.raw
          const metricsData = response.raw;

          if (metricsData) {
            set({
              metrics: metricsData,
              metricsLoading: false,
              lastMetricsUpdate: Date.now(),
            });
            return metricsData;
          }

          throw new Error(response.error?.message || "Failed to get metrics");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get metrics";
          // Don't spam console for expected "method not found" errors
          if (!message.includes("not found")) {
            console.error("[MetricsStore] getMetrics error:", error);
          }
          set({ metricsError: message, metricsLoading: false });
          return null;
        }
      },

      // Get logging metrics (HTTP GET endpoint)
      getLoggingMetrics: async (params?: GetLoggingMetricsParams): Promise<LoggingMetrics | null> => {
        const connectionSession = useAuthStore.getState().connectionSession;
        if (!connectionSession) {
          set({ loggingError: "Not connected to server" });
          return null;
        }

        set({ loggingLoading: true, loggingError: null });

        try {
          // Build URL with query params
          const url = new URL(`${connectionSession.api}/api/worker/logging/metrics`);
          if (params?.period) {
            url.searchParams.set("period", params.period);
          }
          if (params?.workerId) {
            url.searchParams.set("workerId", params.workerId);
          }

          const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Session-ID": connectionSession.session,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("[MetricsStore] getLoggingMetrics response:", data);

          // WebFIX v2.12.0: Parse response.raw for HTTP endpoints too
          const loggingMetrics = data.raw || data.metrics || (data && !data.error ? data : null);

          if (loggingMetrics) {
            set({
              loggingMetrics,
              loggingLoading: false,
              lastLoggingUpdate: Date.now(),
            });
            return loggingMetrics;
          }

          throw new Error(data.error?.message || data.error || "Failed to get logging metrics");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get logging metrics";
          // Suppress logging for expected errors during backend development:
          // - CORS errors ("Failed to fetch")
          // - Method not found
          // - 405 Method Not Allowed (endpoint changed or not implemented)
          const isExpectedError = message.includes("not found") || 
                                  message.includes("Failed to fetch") ||
                                  message.includes("405");
          if (!isExpectedError) {
            console.error("[MetricsStore] getLoggingMetrics error:", error);
          }
          set({ loggingError: message, loggingLoading: false });
          return null;
        }
      },

      // Get trading metrics
      getTradingMetrics: async (params?: GetTradingMetricsParams): Promise<TradingMetrics | null> => {
        const client = getApiClient();
        if (!client) {
          set({ tradingError: "Not connected to server" });
          return null;
        }

        set({ tradingLoading: true, tradingError: null });

        try {
          const response = await client.request<WebfixResponse<TradingMetrics>>(
            "getTradingMetrics",
            params || {}
          );

          console.log("[MetricsStore] getTradingMetrics response:", response);

          // WebFIX v2.12.0: Parse response.raw
          const tradingMetrics = response.raw;

          if (tradingMetrics) {
            set({
              tradingMetrics,
              tradingLoading: false,
              lastTradingUpdate: Date.now(),
            });
            return tradingMetrics;
          }

          throw new Error(response.error?.message || "Failed to get trading metrics");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get trading metrics";
          // Suppress logging for expected errors during backend development:
          // - Method not found / Invalid request = not implemented yet
          const isExpectedError = message.includes("not found") || 
                                  message.includes("Invalid request") ||
                                  message.includes("RPC method");
          if (!isExpectedError) {
            console.error("[MetricsStore] getTradingMetrics error:", error);
          }
          set({ tradingError: message, tradingLoading: false });
          return null;
        }
      },

      // Clear all metrics
      clearMetrics: () => {
        set({
          metrics: null,
          loggingMetrics: null,
          tradingMetrics: null,
          metricsError: null,
          loggingError: null,
          tradingError: null,
        });
      },

      // Refresh all metrics
      // Note: Only getMetrics is actively used. getLoggingMetrics and getTradingMetrics
      // are deprecated/not implemented on backend. All data comes from getMetrics now.
      refreshAll: async () => {
        const { getMetrics } = get();
        // Only call getMetrics - it contains all metrics data (system, rpc, routing, tracing, application)
        // getLoggingMetrics and getTradingMetrics are no longer part of the API
        await getMetrics();
      },
    }),
    { name: "metrics-store" }
  )
);

// ============================================
// Selector Hooks
// ============================================

export const useMetrics = () => useMetricsStore((state) => state.metrics);
export const useLoggingMetrics = () => useMetricsStore((state) => state.loggingMetrics);
export const useTradingMetrics = () => useMetricsStore((state) => state.tradingMetrics);
export const useMetricsLoading = () => useMetricsStore((state) => state.metricsLoading);
export const useLastMetricsUpdate = () => useMetricsStore((state) => state.lastMetricsUpdate);
