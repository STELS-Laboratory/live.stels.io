/**
 * Peer Widget - Network peer information visualization
 */
import React, { memo, useMemo } from "react";
import {
  formatBytes,
  formatRelativeTime,
  getStatusColor,
  type NetworkPeerRaw,
  type PeerRegistryRaw,
} from "@/lib/airnet-types";
import {
  Globe,
  Server,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
  CircleDot,
} from "lucide-react";

interface PeerWidgetProps {
  data: {
    raw: NetworkPeerRaw | PeerRegistryRaw;
    timestamp: number;
    module?: string;
  };
}

// Type guard for NetworkPeerRaw
function isNetworkPeer(raw: NetworkPeerRaw | PeerRegistryRaw): raw is NetworkPeerRaw {
  return "location" in raw && "memory" in raw;
}

const PeerWidget = memo(({ data }: PeerWidgetProps): React.ReactElement => {
  const { raw, timestamp } = data;

  // Check if it's detailed peer data or registry data
  const isDetailed = isNetworkPeer(raw);

  if (!isDetailed) {
    // Render simple registry view
    const registryData = raw as PeerRegistryRaw;
    const StatusIcon =
      registryData.status === "online"
        ? CheckCircle
        : registryData.status === "offline"
        ? XCircle
        : CircleDot;

    return (
      <div className="bg-card p-3 min-w-[200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{registryData.nodeId}</span>
          </div>
          <StatusIcon
            className={`h-4 w-4 ${getStatusColor(registryData.status)}`}
          />
        </div>

        {/* Info */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Host</span>
            <span className="font-mono">{registryData.host}:{registryData.port}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Protocol</span>
            <span className="font-mono uppercase">{registryData.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OpenAPI</span>
            <span>{registryData.openApi ? "Yes" : "No"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-muted-foreground/70 pt-2 mt-2 border-t border-border/50">
          Last seen: {formatRelativeTime(registryData.lastSeen)}
        </div>
      </div>
    );
  }

  // Render detailed peer view
  const peerData = raw as NetworkPeerRaw;
  const memoryPercent = useMemo(
    () => ((peerData.memory.heapUsed / peerData.memory.heapTotal) * 100).toFixed(1),
    [peerData.memory]
  );

  return (
    <div className="bg-card p-3 min-w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{peerData.peer}</span>
          <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded">
            online
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{peerData.network}</span>
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 mb-3 p-2 bg-muted/30 rounded">
        <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-xs">
          <div className="font-medium">
            {peerData.location.city}, {peerData.location.country_name}
          </div>
          <div className="text-muted-foreground">
            {peerData.location.ip} • {peerData.location.org}
          </div>
          <div className="text-muted-foreground/70">
            {peerData.location.latitude.toFixed(4)}, {peerData.location.longitude.toFixed(4)}
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* CPU */}
        <div className="p-2 bg-muted/20 rounded text-xs">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <Cpu className="h-3 w-3" />
            <span>CPU</span>
          </div>
          <div className="flex gap-1 font-mono">
            {peerData.cpu.map((load, i) => (
              <span
                key={i}
                className={`px-1 rounded ${
                  load > 50
                    ? "bg-red-500/20 text-red-500"
                    : load > 20
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-emerald-500/20 text-emerald-500"
                }`}
              >
                {load}%
              </span>
            ))}
          </div>
        </div>

        {/* Memory */}
        <div className="p-2 bg-muted/20 rounded text-xs">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <HardDrive className="h-3 w-3" />
            <span>Memory</span>
          </div>
          <div className="font-mono">{memoryPercent}%</div>
          <div className="w-full h-1 bg-muted rounded mt-1">
            <div
              className={`h-full rounded ${
                parseFloat(memoryPercent) > 80
                  ? "bg-red-500"
                  : parseFloat(memoryPercent) > 50
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${memoryPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Memory Details */}
      <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">RSS</span>
          <span className="font-mono">{formatBytes(peerData.memory.rss)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Heap Total</span>
          <span className="font-mono">{formatBytes(peerData.memory.heapTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Heap Used</span>
          <span className="font-mono">{formatBytes(peerData.memory.heapUsed)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">External</span>
          <span className="font-mono">{formatBytes(peerData.memory.external)}</span>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-[10px] p-2 bg-muted/10 rounded mb-2">
        <div className="flex gap-3 font-mono text-muted-foreground">
          <span>Deno {peerData.version.deno}</span>
          <span>TS {peerData.version.typescript}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{peerData.time.utc}</span>
        </div>
        <span>{formatRelativeTime(timestamp)}</span>
      </div>
    </div>
  );
});

PeerWidget.displayName = "PeerWidget";

export default PeerWidget;
