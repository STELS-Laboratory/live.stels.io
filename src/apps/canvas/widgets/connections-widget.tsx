/**
 * Connections Widget - Network connections monitoring visualization
 */
import React, { memo } from "react";
import {
  formatRelativeTime,
  type NetworkConnectionsRaw,
} from "@/lib/airnet-types";
import {
  Network,
  Users,
  Shield,
  Radio,
  Timer,
  Trash2,
} from "lucide-react";

interface ConnectionsWidgetProps {
  data: {
    raw: NetworkConnectionsRaw;
    timestamp: number;
  };
}

const ConnectionsWidget = memo(({ data }: ConnectionsWidgetProps): React.ReactElement => {
  const { raw, timestamp } = data;

  return (
    <div className="bg-card p-3 min-w-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Network Connections</span>
        </div>
        <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded">
          {raw.network}
        </span>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 bg-muted/20 rounded text-xs text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <div className="text-lg font-bold">{raw.totalClients}</div>
          <div className="text-muted-foreground">Total</div>
        </div>
        <div className="p-2 bg-muted/20 rounded text-xs text-center">
          <Shield className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
          <div className="text-lg font-bold text-emerald-500">
            {raw.authenticatedClients}
          </div>
          <div className="text-muted-foreground">Auth</div>
        </div>
        <div className="p-2 bg-muted/20 rounded text-xs text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-amber-500" />
          <div className="text-lg font-bold text-amber-500">
            {raw.anonymousClients}
          </div>
          <div className="text-muted-foreground">Anon</div>
        </div>
      </div>

      {/* Session Info */}
      <div className="p-2 bg-muted/10 rounded mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Sessions</span>
          <span className="font-mono">{raw.sessionCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Max per session</span>
          <span className="font-mono">{raw.maxConnectionsPerSession}</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 p-2 bg-muted/10 rounded text-xs">
          <Radio
            className={`h-3 w-3 ${
              raw.streamingActive ? "text-emerald-500 animate-pulse" : "text-red-500"
            }`}
          />
          <span className="text-muted-foreground">Streaming</span>
          <span className={raw.streamingActive ? "text-emerald-500" : "text-red-500"}>
            {raw.streamingActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/10 rounded text-xs">
          <Trash2
            className={`h-3 w-3 ${
              raw.cleanupRunning ? "text-amber-500" : "text-muted-foreground"
            }`}
          />
          <span className="text-muted-foreground">Cleanup</span>
          <span className={raw.cleanupRunning ? "text-amber-500" : "text-muted-foreground"}>
            {raw.cleanupRunning ? "Running" : "Idle"}
          </span>
        </div>
      </div>

      {/* Intervals */}
      <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
        <div className="flex items-center gap-1">
          <Timer className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Data TX:</span>
          <span className="font-mono">{raw.dataTransmissionInterval}ms</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Heartbeat:</span>
          <span className="font-mono">{raw.heartbeatInterval}ms</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50">
        Updated: {formatRelativeTime(timestamp)}
      </div>
    </div>
  );
});

ConnectionsWidget.displayName = "ConnectionsWidget";

export default ConnectionsWidget;
