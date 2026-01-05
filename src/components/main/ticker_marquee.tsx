/**
 * Ticker Marquee Component
 * Displays a scrolling ticker tape of all market tickers from sessionStorage
 */

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useNetworkStore } from "@/stores/modules/network.store";
import type {
  TickerData,
  TickerMarqueeProps,
} from "@/types/components/main/types";
import { TickerItem } from "./ticker_item";
import { useTimerManager } from "@/lib/timer-manager";

/**
 * Ticker Marquee Component
 */
export function TickerMarquee(
  { className }: TickerMarqueeProps,
): React.ReactElement | null {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const { currentNetworkId } = useNetworkStore();
  const { setTimeout, setInterval, clear } = useTimerManager();

  // Get all tickers from sessionStorage
  const getTickers = React.useCallback((): TickerData[] => {
    const tickerList: TickerData[] = [];
    const tickerPrefix = `${currentNetworkId}.runtime.ticker.`;

    try {
      // Iterate through all sessionStorage keys
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(tickerPrefix)) {
          try {
            const data = sessionStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data) as {
                raw?: {
                  exchange?: string;
                  market?: string;
                  last?: number;
                  change?: number;
                  percentage?: number;
                  timestamp?: number;
                };
              };

              if (parsed.raw?.market && parsed.raw?.last !== undefined) {
                tickerList.push({
                  market: parsed.raw.market,
                  exchange: parsed.raw.exchange || "unknown",
                  last: parsed.raw.last,
                  change: parsed.raw.change || 0,
                  percentage: parsed.raw.percentage || 0,
                  timestamp: parsed.raw.timestamp || Date.now(),
                });
              }
            }
          } catch {
            // Error handled silently
          }
        }
      }

      // Sort by market name for consistent display
      return tickerList.sort((a, b) => a.market.localeCompare(b.market));
    } catch {
      return [];
    }
  }, [currentNetworkId]);

  // Update tickers reactively using storage events - optimized
  useEffect(() => {
    // Initial load
    setTickers(getTickers());

    // Cache last tickers to avoid unnecessary updates
    let lastTickersHash = "";
    const updateTickers = (): void => {
      const newTickers = getTickers();
      // Simple hash comparison to avoid unnecessary updates
      const newHash = JSON.stringify(
        newTickers.map((t) => `${t.market}-${t.last}`),
      );
      if (newHash !== lastTickersHash) {
        lastTickersHash = newHash;
        setTickers(newTickers);
      }
    };

    // Handle storage events (works across tabs)
    const handleStorageChange = (e: StorageEvent): void => {
      const tickerPrefix = `${currentNetworkId}.runtime.ticker.`;
      if (e.key && e.key.startsWith(tickerPrefix)) {
        // Debounce updates using TimerManager
        if (updateTimeoutId) clear(updateTimeoutId);
        updateTimeoutId = setTimeout(
          () => {
            updateTickers();
          },
          100,
          "TickerMarquee storage update",
        );
      }
    };

    // Handle custom sessionStorageChange event (for same-tab updates)
    const handleSessionStorageChange = (): void => {
      if (updateTimeoutId) clear(updateTimeoutId);
      updateTimeoutId = setTimeout(
        () => {
          updateTickers();
        },
        100,
        "TickerMarquee sessionStorage update",
      );
    };

    let updateTimeoutId: string | null = null;

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "sessionStorageChange",
      handleSessionStorageChange as EventListener,
    );

    // Fallback polling - only every 30 seconds as backup
    const intervalId = setInterval(
      () => {
        updateTickers();
      },
      30000,
      "TickerMarquee fallback polling",
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "sessionStorageChange",
        handleSessionStorageChange as EventListener,
      );
      if (updateTimeoutId) clear(updateTimeoutId);
      clear(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTickers, currentNetworkId]); // clear, setInterval, setTimeout are stable from useTimerManager

  // Memoize duplicated tickers to prevent unnecessary recalculations
  const duplicatedTickers = useMemo(() => {
    if (tickers.length === 0) return [];
    return [...tickers, ...tickers];
  }, [tickers]);

  // Memoize animation duration
  const animationDuration = useMemo(() => {
    return Math.max(tickers.length * 12, 20);
  }, [tickers.length]);

  if (tickers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex-1 overflow-hidden relative h-full",
        className,
      )}
    >
      <div className="flex items-center h-full overflow-hidden">
        <div
          className="flex items-center gap-6 shrink-0"
          style={{
            animation: `scroll ${animationDuration}s linear infinite`,
            willChange: "transform",
            transform: "translateZ(0)", // Force hardware acceleration
            backfaceVisibility: "hidden", // Optimize rendering
          }}
        >
          {duplicatedTickers.map((ticker, index) => (
            <TickerItem
              key={`${ticker.market}-${ticker.exchange}-${index}`}
              ticker={ticker}
              index={index}
              isLast={index >= duplicatedTickers.length - 1}
            />
          ))}
        </div>
      </div>

      <style>
        {`
				@keyframes scroll {
					0% {
						transform: translateX(0);
					}
					100% {
						transform: translateX(-50%);
					}
				}

				@media (prefers-reduced-motion: reduce) {
					[style*="animation"] {
						animation: none !important;
					}
				}
			`}
      </style>
    </div>
  );
}
