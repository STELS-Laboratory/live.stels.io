/**
 * Worker Stats Panel Component
 * Displays execution metrics and statistics
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Cpu,
  Play,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { WorkerStats } from "../store.ts";

interface WorkerStatsPanelProps {
  onRefresh: () => Promise<WorkerStats[]>;
}

/**
 * Format timestamp to time ago
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Worker Stats Panel Component
 */
export function WorkerStatsPanel({
  onRefresh,
}: WorkerStatsPanelProps): React.ReactElement {
  const [stats, setStats] = useState<WorkerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadStats = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await onRefresh();
      setStats(data);
    } catch {
      setError(
        err instanceof Error ? err.message : "Failed to load worker stats",
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadStats();
    }, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Calculate totals
  const totals = stats.reduce(
    (acc, stat) => ({
      executions: acc.executions + stat.executions,
      errors: acc.errors + stat.errors,
      networkErrors: acc.networkErrors + stat.networkErrors,
      criticalErrors: acc.criticalErrors + stat.criticalErrors,
      running: acc.running + (stat.isRunning ? 1 : 0),
    }),
    {
      executions: 0,
      errors: 0,
      networkErrors: 0,
      criticalErrors: 0,
      running: 0,
    },
  );

  const avgErrorRate = stats.length > 0
    ? stats.reduce((sum, s) => sum + s.errorRate, 0) / stats.length
    : 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-amber-500" />
            <CardTitle className="text-[11px] text-foreground font-semibold uppercase tracking-wide">
              Worker Statistics
            </CardTitle>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "h-5 w-5 p-0",
                autoRefresh
                  ? "text-green-700 dark:text-green-700 dark:text-green-600"
                  : "text-muted-foreground",
              )}
            >
              <RefreshCw
                className={cn("h-3 w-3", autoRefresh && "animate-spin")}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStats}
              disabled={loading}
              className="h-5 w-5 p-0"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-3 pb-3">
        {/* Overall Statistics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="relative p-2 bg-muted/30 border border-border rounded">
            <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">
              Running
            </div>
            <div className="flex items-center gap-1">
              <Play className="h-3 w-3 text-green-700 dark:text-green-700 dark:text-green-600" />
              <span className="text-sm font-bold text-green-700 dark:text-green-700 dark:text-green-600">
                {totals.running}
              </span>
              <span className="text-[10px] text-muted-foreground">
                /{stats.length}
              </span>
            </div>
          </div>

          <div className="relative p-2 bg-muted/30 border border-border rounded">
            <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">
              Exec
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                {totals.executions.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="relative p-2 bg-muted/30 border border-border rounded">
            <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">
              Errors
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-700 dark:text-red-700 dark:text-red-400" />
              <span className="text-sm font-bold text-red-700 dark:text-red-700 dark:text-red-400">
                {totals.errors}
              </span>
            </div>
          </div>

          <div className="relative p-2 bg-muted/30 border border-border rounded">
            <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">
              Rate
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-700 dark:text-orange-700 dark:text-orange-400" />
              <span
                className={cn(
                  "text-sm font-bold",
                  avgErrorRate < 5
                    ? "text-green-700 dark:text-green-700 dark:text-green-600"
                    : avgErrorRate < 15
                    ? "text-orange-700 dark:text-orange-700 dark:text-orange-400"
                    : "text-red-700 dark:text-red-700 dark:text-red-400",
                )}
              >
                {avgErrorRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Error Breakdown */}
        {(totals.networkErrors > 0 || totals.criticalErrors > 0) && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">
              Error Breakdown
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-orange-500/5 border border-orange-500/30">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-orange-700 dark:text-orange-700 dark:text-orange-400" />
                  <span className="text-xs text-orange-700 dark:text-orange-700 dark:text-orange-400">
                    Network
                  </span>
                </div>
                <span className="text-xs text-orange-300 font-mono">
                  {totals.networkErrors}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/30">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3 w-3 text-red-700 dark:text-red-700 dark:text-red-400" />
                  <span className="text-xs text-red-700 dark:text-red-700 dark:text-red-400">
                    Critical
                  </span>
                </div>
                <span className="text-xs text-red-800 dark:text-red-300 font-mono">
                  {totals.criticalErrors}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Individual Worker Stats */}
        {stats.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              Individual Workers
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stats.map((stat) => (
                <div
                  key={stat.sid}
                  className="relative p-1.5 bg-muted/30 border border-border rounded"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          stat.isRunning
                            ? "bg-green-400 animate-pulse"
                            : "bg-muted-foreground",
                        )}
                      />
                      <span className="text-[10px] text-foreground font-mono truncate">
                        {stat.sid}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] px-1 py-0.5 rounded",
                        stat.isRunning
                          ? "bg-green-500/10 text-green-700 dark:text-green-700 dark:text-green-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {stat.isRunning ? "ON" : "OFF"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] mt-1">
                    <span className="text-muted-foreground">
                      {stat.executions}
                    </span>
                    <span className="text-red-700 dark:text-red-700 dark:text-red-400">
                      {stat.errors}
                    </span>
                    <span
                      className={cn(
                        "font-mono",
                        stat.errorRate < 5
                          ? "text-green-700 dark:text-green-700 dark:text-green-600"
                          : stat.errorRate < 15
                          ? "text-orange-700 dark:text-orange-700 dark:text-orange-400"
                          : "text-red-700 dark:text-red-700 dark:text-red-400",
                      )}
                    >
                      {stat.errorRate.toFixed(1)}%
                    </span>
                    {stat.lastExecution && (
                      <span className="text-muted-foreground ml-auto">
                        {formatTimeAgo(stat.lastExecution)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.length === 0 && !loading && (
          <div className="text-center py-6">
            <Cpu className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">
              No worker statistics available
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
              <span className="text-xs text-muted-foreground">
                Loading statistics...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="relative p-3 bg-red-500/5 border border-red-500/30">
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-red-500/50" />
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="text-xs text-red-700 dark:text-red-700 dark:text-red-400 font-medium mb-1">
                  Failed to load statistics
                </p>
                <p className="text-xs text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
