/**
 * Leader Info Card Component
 * Shows leader election status for leader-mode workers
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { LeaderInfo } from "../store.ts";

interface LeaderInfoCardProps {
  workerId: string;
  onRefresh: (workerId: string) => Promise<LeaderInfo | null>;
}

/**
 * Format milliseconds to human-readable time
 */
function formatExpiresIn(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

/**
 * Format timestamp to time string
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Leader Info Card Component
 */
export function LeaderInfoCard({
  workerId,
  onRefresh,
}: LeaderInfoCardProps): React.ReactElement {
  const [leaderInfo, setLeaderInfo] = useState<LeaderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLeaderInfo = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const info = await onRefresh(workerId);
      setLeaderInfo(info);
    } catch {
      setError(
        err instanceof Error ? err.message : "Failed to load leader info",
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadLeaderInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLeaderInfo();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, autoRefresh]);

  if (loading && !leaderInfo) {
    return (
      <Card className="bg-card/10 border-border/50">
        <CardContent className="p-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
            <span className="text-xs">Loading leader info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-500/5 border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">
                Failed to load leader info
              </p>
              <p className="text-xs text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderInfo) {
    return (
      <Card className="bg-card/10 border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            No leader info available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-card/80 border transition-all duration-200",
        leaderInfo.hasLeader ? "border-green-500/30" : "border-orange-500/30",
      )}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-[11px]">
            <Crown
              className={cn(
                "h-3 w-3",
                leaderInfo.hasLeader ? "text-green-500" : "text-orange-500",
              )}
            />
            <span className="text-foreground font-semibold uppercase tracking-wide">
              Leader Election
            </span>
          </CardTitle>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "h-5 w-5 p-0",
              autoRefresh
                ? "text-green-700 dark:text-green-600"
                : "text-muted-foreground",
            )}
            title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          >
            <RefreshCw
              className={cn("h-3 w-3", autoRefresh && "animate-spin")}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Status
          </span>
          <div className="flex items-center gap-1">
            {leaderInfo.hasLeader
              ? (
                <CheckCircle className="h-3 w-3 text-green-700 dark:text-green-600" />
              )
              : (
                <AlertCircle className="h-3 w-3 text-orange-700 dark:text-orange-400" />
              )}
            <span
              className={`text-[10px] font-mono ${
                leaderInfo.hasLeader
                  ? "text-green-700 dark:text-green-600"
                  : "text-orange-700 dark:text-orange-400"
              }`}
            >
              {leaderInfo.hasLeader ? "Active" : "No Leader"}
            </span>
          </div>
        </div>

        {/* Leader Node */}
        {leaderInfo.hasLeader && leaderInfo.leader && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Node
            </span>
            <span className="text-[10px] text-green-700 dark:text-green-600 font-mono">
              {leaderInfo.leader}
            </span>
          </div>
        )}

        {/* Elected / Renewed */}
        {leaderInfo.hasLeader && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Elected
            </span>
            <span className="text-[10px] text-foreground font-mono">
              {formatTimestamp(leaderInfo.timestamp)}
            </span>
          </div>
        )}

        {/* Expires In */}
        {leaderInfo.hasLeader && !leaderInfo.isExpired && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Expires
            </span>
            <span
              className={cn(
                "text-[10px] font-mono",
                leaderInfo.expiresIn < 30000
                  ? "text-red-700 dark:text-red-400"
                  : leaderInfo.expiresIn < 45000
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-green-700 dark:text-green-600",
              )}
            >
              {formatExpiresIn(leaderInfo.expiresIn)}
            </span>
          </div>
        )}

        {/* Status message */}
        <div
          className={`p-1.5 rounded border ${
            leaderInfo.isExpired
              ? "bg-red-500/10 border-red-500/30"
              : "bg-blue-500/10 border-blue-500/30"
          }`}
        >
          <p
            className={`text-[10px] ${
              leaderInfo.isExpired
                ? "text-red-700 dark:text-red-400"
                : "text-blue-700 dark:text-blue-400"
            }`}
          >
            {leaderInfo.isExpired
              ? "⚠️ Lease expired - re-election in progress"
              : leaderInfo.hasLeader
              ? "✓ Single-node execution guaranteed"
              : "⏳ Waiting for election"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
