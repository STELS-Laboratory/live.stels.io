/**
 * Ticker Marquee Component
 * Displays a scrolling ticker tape of all market tickers from sessionStorage
 */

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useNetworkStore } from "@/stores/modules/network.store";
import type { TickerData, TickerMarqueeProps } from "@/types/components/main/types";
import { TickerItem } from "./ticker_item";

/**
 * Ticker Marquee Component
 */
export function TickerMarquee(
  { className }: TickerMarqueeProps,
): React.ReactElement | null {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const { currentNetworkId } = useNetworkStore();

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

  // Update tickers periodically - optimized with debounce
  useEffect(() => {
    // Initial load
    setTickers(getTickers());

    // Update every 3 seconds (reduced frequency for better performance)
    const interval = setInterval(() => {
      setTickers(getTickers());
    }, 3000);

    return () => clearInterval(interval);
  }, [getTickers]);

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
