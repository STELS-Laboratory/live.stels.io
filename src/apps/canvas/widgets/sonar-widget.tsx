/**
 * Sonar Widget - Runtime statistics and network health visualization
 */
import React, { memo, useMemo } from "react";
import {
  formatRelativeTime,
  type SonarRaw,
  type SonarNodeRaw,
} from "@/lib/airnet-types";
import {
  Radar,
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  Zap,
} from "lucide-react";

interface SonarWidgetProps {
  data: {
    raw: SonarRaw | SonarNodeRaw;
    timestamp: number;
    channel?: string;
  };
}

// Type guard for network sonar
function isNetworkSonar(raw: SonarRaw | SonarNodeRaw): raw is SonarRaw {
  return "totalNodes" in raw && "network" in raw;
}

// Type guard for node sonar
function isNodeSonar(raw: SonarRaw | SonarNodeRaw): raw is SonarNodeRaw {
  return "currentNode" in raw;
}

const SonarWidget = memo(({ data }: SonarWidgetProps): React.ReactElement => {
  const { raw, timestamp, channel } = data;

  // Network-wide sonar
  if (isNetworkSonar(raw)) {
    const { totalNodes, network, nodes } = raw;

    const healthColor = useMemo(() => {
      if (network.successRate >= 99) return "text-emerald-500";
      if (network.successRate >= 95) return "text-amber-500";
      return "text-red-500";
    }, [network.successRate]);

    const HealthIcon = useMemo(() => {
      if (network.successRate >= 99) return CheckCircle;
      if (network.successRate >= 95) return AlertTriangle;
      return XCircle;
    }, [network.successRate]);

    return (
      <div className="bg-card p-3 min-w-[300px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Network Sonar</span>
          </div>
          <div className="flex items-center gap-1">
            <HealthIcon className={`h-4 w-4 ${healthColor}`} />
            <span className={`text-sm font-mono ${healthColor}`}>
              {network.successRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 bg-muted/20 rounded text-xs">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Server className="h-3 w-3" />
              <span>Nodes</span>
            </div>
            <div className="text-lg font-bold">{totalNodes}</div>
          </div>
          <div className="p-2 bg-muted/20 rounded text-xs">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span>Workers</span>
            </div>
            <div className="text-lg font-bold">
              {network.activeWorkers}
              <span className="text-muted-foreground text-sm">
                /{network.totalWorkers}
              </span>
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="mb-3 p-2 bg-muted/10 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Operations</span>
            <span className="text-xs font-mono">
              {network.totalOperations.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2 text-[10px]">
            {network.totalErrors > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded">
                {network.totalErrors} errors
              </span>
            )}
            {network.totalErrors === 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded">
                No errors
              </span>
            )}
          </div>
        </div>

        {/* Nodes List */}
        <div className="space-y-1 mb-2">
          {Object.entries(nodes).map(([nodeId, nodeData]) => {
            const nodeOps = nodeData.raw.currentNode?.operations;
            const nodeWorkers = nodeData.raw.workers;

            return (
              <div
                key={nodeId}
                className="flex items-center justify-between p-2 bg-muted/10 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-emerald-500" />
                  <span className="font-mono">{nodeId}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    {nodeOps?.total || 0} ops
                  </span>
                  <span>
                    {nodeWorkers?.active || 0} workers
                  </span>
                  <span
                    className={
                      (nodeOps?.successRate || 0) >= 99
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }
                  >
                    {nodeOps?.successRate || 0}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50">
          Updated: {formatRelativeTime(timestamp)}
        </div>
      </div>
    );
  }

  // Single node sonar
  if (isNodeSonar(raw)) {
    const { currentNode, workers, liquidity, protection, available } = raw;
    const nodeId = channel?.split(".").pop() || currentNode.id;

    return (
      <div className="bg-card p-3 min-w-[250px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{nodeId}</span>
          </div>
          <span
            className={`text-sm font-mono ${
              currentNode.operations.successRate >= 99
                ? "text-emerald-500"
                : "text-amber-500"
            }`}
          >
            {currentNode.operations.successRate}%
          </span>
        </div>

        {/* Operations */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 bg-muted/20 rounded text-xs">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Zap className="h-3 w-3" />
              <span>Operations</span>
            </div>
            <div className="text-lg font-bold">
              {currentNode.operations.total.toLocaleString()}
            </div>
          </div>
          <div className="p-2 bg-muted/20 rounded text-xs">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span>Workers</span>
            </div>
            <div className="text-lg font-bold">
              {workers.active}
              <span className="text-muted-foreground text-sm">
                /{workers.total}
              </span>
            </div>
          </div>
        </div>

        {/* Error Stats */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mb-3">
          <div className="p-1.5 bg-muted/10 rounded text-center">
            <div className="text-muted-foreground">Errors</div>
            <div
              className={
                currentNode.operations.errors > 0 ? "text-red-500" : "text-emerald-500"
              }
            >
              {currentNode.operations.errors}
            </div>
          </div>
          <div className="p-1.5 bg-muted/10 rounded text-center">
            <div className="text-muted-foreground">Network</div>
            <div
              className={
                currentNode.operations.networkErrors > 0
                  ? "text-amber-500"
                  : "text-emerald-500"
              }
            >
              {currentNode.operations.networkErrors}
            </div>
          </div>
          <div className="p-1.5 bg-muted/10 rounded text-center">
            <div className="text-muted-foreground">Critical</div>
            <div
              className={
                currentNode.operations.criticalErrors > 0
                  ? "text-red-500"
                  : "text-emerald-500"
              }
            >
              {currentNode.operations.criticalErrors}
            </div>
          </div>
        </div>

        {/* Financial Stats (if applicable) */}
        {(liquidity > 0 || protection > 0 || available > 0) && (
          <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
            <div>
              <div className="text-muted-foreground">Liquidity</div>
              <div className="font-mono">${liquidity.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Protection</div>
              <div className="font-mono">${protection.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Available</div>
              <div className="font-mono">${available.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50">
          Updated: {formatRelativeTime(timestamp)}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="bg-card p-3 min-w-[200px]">
      <div className="text-muted-foreground text-sm">Unknown sonar data format</div>
    </div>
  );
});

SonarWidget.displayName = "SonarWidget";

export default SonarWidget;
