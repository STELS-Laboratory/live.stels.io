/**
 * Leader Info Card Component
 * Shows leader election status for leader-mode workers
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  RefreshCw,
  Server,
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
    } catch (err) {
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
      <Card className="bg-card/50 border-border/50">
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
              <p className="text-xs text-red-400 font-medium mb-1">
                Failed to load leader info
              </p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderInfo) {
    return (
      <Card className="bg-card/50 border-border/50">
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "relative p-1.5 border",
                leaderInfo.hasLeader
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-orange-500/30 bg-orange-500/10",
              )}
            >
              {leaderInfo.hasLeader && (
                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-green-500/50" />
              )}
              <Crown
                className={cn(
                  "h-3.5 w-3.5",
                  leaderInfo.hasLeader ? "text-green-500" : "text-orange-500",
                )}
              />
            </div>
            <span className="text-foreground">Leader Election</span>
          </CardTitle>

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
                className={cn(
                  "h-3.5 w-3.5",
                  autoRefresh && "animate-spin",
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              leaderInfo.hasLeader
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-orange-500/30 bg-orange-500/10 text-orange-400",
            )}
          >
            {leaderInfo.hasLeader
              ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Leader Active
                </>
              )
              : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No Leader
                </>
              )}
          </Badge>
        </div>

        {/* Leader Node */}
        {leaderInfo.hasLeader && leaderInfo.leader && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Leader Node
            </span>
            <div className="flex items-center gap-1.5">
              <Server className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400 font-mono">
                {leaderInfo.leader}
              </span>
            </div>
          </div>
        )}

        {/* Elected At */}
        {leaderInfo.hasLeader && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Elected At</span>
            <span className="text-xs text-card-foreground font-mono">
              {formatTimestamp(leaderInfo.timestamp)}
            </span>
          </div>
        )}

        {/* Last Renewed */}
        {leaderInfo.hasLeader && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Last Renewed
            </span>
            <span className="text-xs text-card-foreground font-mono">
              {formatTimestamp(leaderInfo.renewedAt)}
            </span>
          </div>
        )}

        {/* Expires In */}
        {leaderInfo.hasLeader && !leaderInfo.isExpired && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires In
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono",
                leaderInfo.expiresIn < 30000
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : leaderInfo.expiresIn < 45000
                  ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                  : "border-green-500/30 bg-green-500/10 text-green-400",
              )}
            >
              {formatExpiresIn(leaderInfo.expiresIn)}
            </Badge>
          </div>
        )}

        {/* Expired Status */}
        {leaderInfo.isExpired && (
          <div className="relative p-2 bg-red-500/5 border border-red-500/30">
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-red-500/50" />
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div className="text-xs">
                <p className="text-red-400 font-bold mb-0.5">Lease Expired</p>
                <p className="text-red-300">
                  Re-election in progress...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="relative p-2 bg-blue-500/5 border border-blue-500/30">
          <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-blue-500/50" />
          <p className="text-xs text-muted-foreground">
            {leaderInfo.hasLeader
              ? "Leader election ensures only one node executes this worker"
              : "Waiting for leader election to complete"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
