import React, { memo, useEffect, useMemo, useState } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui.ts";
import { detectDataType, type AirnetChannelData } from "@/lib/airnet-types";
import {
  TickerWidget,
  BookWidget,
  CandlesWidget,
  PeerWidget,
  SonarWidget,
  ConnectionsWidget,
  TradesWidget,
  BalanceWidget,
} from "@/apps/canvas/widgets";

interface NodeFlowProps {
  data: {
    channel: string;
    label?: string;
  };
  /** Container width in pixels (for responsive content) */
  containerWidth?: number;
  /** Container height in pixels (for responsive content) */
  containerHeight?: number;
}

/**
 * NodeFlow component - renders specialized widgets based on data type
 * Automatically detects the data type and renders the appropriate visualization
 */
const NodeFlow = memo(({ data, containerWidth, containerHeight }: NodeFlowProps): React.ReactElement => {
  const sessionManager = useMemo(() => getSessionStorageManager(), []);
  const [sessionData, setSessionData] = useState<
    Record<string, unknown> | null
  >(null);

  // Load initial session data and subscribe to channel updates
  useEffect(() => {
    if (!data.channel) {
      setSessionData(null);
      return;
    }

    // Load initial data
    const initialData = sessionManager.getData(data.channel, true);
    setSessionData(initialData);

    // Subscribe to channel updates
    const unsubscribe = sessionManager.subscribe(
      data.channel,
      (updatedData) => {
        setSessionData(updatedData);
      },
    );

    // Also subscribe to lowercase version
    const lowerChannel = data.channel.toLowerCase();
    const unsubscribeLower = sessionManager.subscribe(
      lowerChannel,
      (updatedData) => {
        setSessionData(updatedData);
      },
    );

    // Listen to storage events (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === data.channel || e.key === lowerChannel) {
        const freshData = sessionManager.getData(data.channel, true);
        setSessionData(freshData);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Polling fallback - reduced frequency for better performance
    let lastPollTime = 0;
    const pollInterval = setInterval(() => {
      const now = Date.now();
      // Throttle polling to prevent excessive operations
      if (now - lastPollTime < 500) {
        return;
      }
      lastPollTime = now;
      requestAnimationFrame(() => {
        const freshData = sessionManager.getData(data.channel, true);
        if (freshData) {
          setSessionData(freshData);
        }
      });
    }, 500); // Poll every 500ms for real-time updates

    return () => {
      unsubscribe();
      unsubscribeLower();
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [data.channel, sessionManager]);

  // Detect data type for rendering
  const dataType = useMemo(() => {
    return detectDataType(sessionData as AirnetChannelData | null);
  }, [sessionData]);

  if (!sessionData) {
    return (
      <div className="bg-card flex items-center justify-center p-4 min-h-32">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Render specialized widget based on data type
  const typedData = sessionData as AirnetChannelData;
  
  // Common dimension props for responsive widgets
  const dimensionProps = { containerWidth, containerHeight };

  switch (dataType) {
    case "ticker":
      return <TickerWidget data={typedData as never} {...dimensionProps} />;

    case "book":
      return <BookWidget data={typedData as never} {...dimensionProps} />;

    case "candles":
      return <CandlesWidget data={typedData as never} {...dimensionProps} />;

    case "peer":
    case "registry":
      return <PeerWidget data={typedData as never} {...dimensionProps} />;

    case "sonar":
    case "sonar-node":
      return <SonarWidget data={{ ...typedData, channel: data.channel } as never} {...dimensionProps} />;

    case "connections":
      return <ConnectionsWidget data={typedData as never} {...dimensionProps} />;

    case "trades":
      return <TradesWidget data={typedData as never} {...dimensionProps} />;

    case "balance":
      return <BalanceWidget data={typedData as never} {...dimensionProps} />;

    default:
      // Fallback to JSON view for unknown types
      return (
        <div 
          className="bg-card overflow-auto"
          style={{ 
            maxHeight: containerHeight ?? 300,
            width: containerWidth ? "100%" : "auto",
          }}
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-border/50">
              <span className="text-[10px] text-muted-foreground font-mono">
                {typedData.module || "unknown"}
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                {typedData.widget || "raw"}
              </span>
            </div>
            <code className="block text-[8px] whitespace-pre-wrap text-card-foreground">
              {JSON.stringify(typedData.raw || sessionData, null, 2)}
            </code>
          </div>
        </div>
      );
  }
});

NodeFlow.displayName = "NodeFlow";

export default NodeFlow;
