/**
 * Worker Stats Panel Component
 * Displays execution metrics and statistics
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
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
    } catch (err) {
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
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadStats();
    }, 15000);

    return () => clearInterval(interval);
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative p-1.5 border border-amber-500/30 bg-amber-500/10">
              <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-500/50" />
              <Activity className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-sm text-foreground">
                Worker Statistics
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Real-time execution metrics
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "h-7 w-7 p-0",
                autoRefresh ? "text-green-400" : "text-muted-foreground",
              )}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", autoRefresh && "animate-spin")}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStats}
              disabled={loading}
              className="h-7 px-2"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 mr-1", loading && "animate-spin")}
              />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Statistics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="relative p-3 bg-muted/30 border border-border">
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-border" />
            <div className="text-xs text-muted-foreground mb-1">RUNNING</div>
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-400" />
              <span className="text-lg font-bold text-green-400">
                {totals.running}
              </span>
              <span className="text-xs text-muted-foreground">
                / {stats.length}
              </span>
            </div>
          </div>

          <div className="relative p-3 bg-muted/30 border border-border">
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-border" />
            <div className="text-xs text-muted-foreground mb-1">
              EXECUTIONS
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-lg font-bold text-blue-400">
                {totals.executions.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="relative p-3 bg-muted/30 border border-border">
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-border" />
            <div className="text-xs text-muted-foreground mb-1">ERRORS</div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-lg font-bold text-red-400">
                {totals.errors}
              </span>
            </div>
          </div>

          <div className="relative p-3 bg-muted/30 border border-border">
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-border" />
            <div className="text-xs text-muted-foreground mb-1">
              ERROR RATE
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span
                className={cn(
                  "text-lg font-bold",
                  avgErrorRate < 5
                    ? "text-green-400"
                    : avgErrorRate < 15
                    ? "text-orange-400"
                    : "text-red-400",
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
                  <AlertCircle className="h-3 w-3 text-orange-400" />
                  <span className="text-xs text-orange-400">Network</span>
                </div>
                <span className="text-xs text-orange-300 font-mono">
                  {totals.networkErrors}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/30">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400">Critical</span>
                </div>
                <span className="text-xs text-red-300 font-mono">
                  {totals.criticalErrors}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Individual Worker Stats */}
        {stats.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">
              Individual Workers
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.map((stat) => (
                <div
                  key={stat.sid}
                  className="relative p-2 bg-muted/30 border border-border"
                >
                  <div className="absolute -top-0.5 -left-0.5 w-0.5 h-0.5 border-t border-l border-border" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          stat.isRunning
                            ? "bg-green-400 animate-pulse"
                            : "bg-muted-foreground",
                        )}
                      />
                      <span className="text-xs text-foreground font-mono">
                        {stat.sid}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        stat.isRunning
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-muted text-muted-foreground",
                      )}
                    >
                      {stat.isRunning ? "Running" : "Stopped"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exec:</span>
                      <span className="text-card-foreground font-mono">
                        {stat.executions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Err:</span>
                      <span className="text-red-400 font-mono">
                        {stat.errors}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate:</span>
                      <span
                        className={cn(
                          "font-mono",
                          stat.errorRate < 5
                            ? "text-green-400"
                            : stat.errorRate < 15
                            ? "text-orange-400"
                            : "text-red-400",
                        )}
                      >
                        {stat.errorRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Error Rate Progress */}
                  <div className="mt-2">
                    <Progress
                      value={Math.min(stat.errorRate, 100)}
                      className={cn(
                        "h-1",
                        stat.errorRate < 5
                          ? "[&>div]:bg-green-400"
                          : stat.errorRate < 15
                          ? "[&>div]:bg-orange-400"
                          : "[&>div]:bg-red-400",
                      )}
                    />
                  </div>

                  {/* Last Execution */}
                  {stat.lastExecution && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Last: {formatTimeAgo(stat.lastExecution)}
                    </div>
                  )}
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
                <p className="text-xs text-red-400 font-medium mb-1">
                  Failed to load statistics
                </p>
                <p className="text-xs text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
