import React, { memo, useEffect, useMemo, useState } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui.ts";

interface NodeFlowProps {
  data: {
    channel: string;
    label?: string;
  };
}

/**
 * NodeFlow component - renders JSON data from sessionStorage
 */
const NodeFlow = memo(({ data }: NodeFlowProps): React.ReactElement => {
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
      if (now - lastPollTime < 2000) {
        return;
      }
      lastPollTime = now;
      requestAnimationFrame(() => {
        const freshData = sessionManager.getData(data.channel, true);
        if (freshData) {
          setSessionData(freshData);
        }
      });
    }, 2000); // Poll every 2 seconds

    return () => {
      unsubscribe();
      unsubscribeLower();
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [data.channel, sessionManager]);

  if (!sessionData) {
    return (
      <div className="bg-card flex items-center justify-center p-4 min-h-32">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Render JSON format
  return (
    <div className="bg-card overflow-auto">
      <div className="p-2">
        <code className="block text-[8px] whitespace-pre-wrap text-card-foreground">
          {JSON.stringify(sessionData, null, 2)}
        </code>
      </div>
    </div>
  );
});

NodeFlow.displayName = "NodeFlow";

export default NodeFlow;
