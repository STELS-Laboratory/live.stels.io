import { useEffect, useState } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import { filterSession } from "@/lib";
import { UIEngineProvider, UIRenderer } from "@/lib/gui/ui.ts";

import type { UINode } from "@/lib/gui/ui.ts";

interface TickerData {
  key: string;
  value: {
    channel: string;
    module: string;
    widget: string;
    ui: UINode;
    raw: {
      exchange: string;
      market: string;
      data: {
        last: number;
        bid: number;
        ask: number;
        change: number;
        percentage: number;
        baseVolume: number;
        quoteVolume: number;
      };
      timestamp: number;
      latency: number;
    };
    active: boolean;
    timestamp: number;
  };
}

/**
 * Ticker component that renders real-time cryptocurrency ticker data
 * using UIRenderer with data from WebSocket session.
 *
 * Features:
 * - Automatic refresh based on schema refresh intervals
 * - Modal integration for detailed views
 * - Session storage integration
 * - Performance optimized with memoization
 */
function Welcome(): React.ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const [, setRefreshTick] = useState(0);

  const spotTickers = filterSession(
    session || {},
    /\.ticker\..*\.spot$/,
  ) as TickerData[];

  useEffect(() => {
    if (spotTickers.length === 0) return;

    const minRefreshInterval = Math.min(
      ...spotTickers.map((ticker) => ticker.value.ui.refreshInterval || 1000),
    );

    const intervalId = setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, minRefreshInterval);

    return (): void => {
      clearInterval(intervalId);
    };
  }, [spotTickers]);

  if (!session || spotTickers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-zinc-500 text-lg">No ticker data available</div>
          <div className="text-zinc-600 text-sm mt-2">
            Waiting for WebSocket connection...
          </div>
        </div>
      </div>
    );
  }

  const spotBooks = filterSession(
    session || {},
    /\.book\..*\.spot$/,
  ) as TickerData[];

  return (
    <UIEngineProvider>
      <div className="flex flex-wrap gap-4 container mx-auto p-4">
        {spotTickers.map((ticker) => {
          const { ui, raw, active, timestamp } = ticker.value;

          const renderData = {
            ...raw,
            active,
            timestamp,
          };

          return (
            <div key={ticker.key}>
              <UIRenderer schema={ui} data={renderData} />
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 container mx-auto p-4">
        {spotBooks.map((ticker) => {
          const { ui, raw, active, timestamp } = ticker.value;

          const renderData = {
            ...raw,
            active,
            timestamp,
          };

          return (
            <div key={ticker.key}>
              <UIRenderer schema={ui} data={renderData} />
            </div>
          );
        })}
      </div>
    </UIEngineProvider>
  );
}

export default Welcome;
