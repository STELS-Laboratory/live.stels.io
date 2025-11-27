/**
 * Ticker Marquee Component
 * Displays a scrolling ticker tape of all market tickers from sessionStorage
 */

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface TickerData {
  market: string;
  exchange: string;
  last: number;
  change: number;
  percentage: number;
  timestamp: number;
}

interface TickerMarqueeProps {
  className?: string;
}

/**
 * Ticker Marquee Component
 */
export function TickerMarquee(
  { className }: TickerMarqueeProps,
): React.ReactElement {
  const [tickers, setTickers] = useState<TickerData[]>([]);

  // Get all tickers from sessionStorage
  const getTickers = React.useCallback((): TickerData[] => {
    const tickerList: TickerData[] = [];

    try {
      // Iterate through all sessionStorage keys
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("testnet.runtime.ticker.")) {
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
  }, []);

  // Update tickers periodically
  useEffect(() => {
    // Initial load
    setTickers(getTickers());

    // Update every second
    const interval = setInterval(() => {
      setTickers(getTickers());
    }, 1000);

    return () => clearInterval(interval);
  }, [getTickers]);

  if (tickers.length === 0) {
    return null;
  }

  // Duplicate tickers for seamless loop
  const duplicatedTickers = [...tickers, ...tickers];

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
            animation: `scroll ${
              Math.max(tickers.length * 12, 20)
            }s linear infinite`,
          }}
        >
          {duplicatedTickers.map((ticker, index) => {
            const isPositive = ticker.change >= 0;
            const changeColor = isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400";

            return (
              <React.Fragment
                key={`${ticker.market}-${ticker.exchange}-${index}`}
              >
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <span className="text-[10px] font-semibold text-foreground">
                    {ticker.market}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {ticker.exchange}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {ticker.last.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </span>
                  <div className={cn("flex items-center gap-0.5", changeColor)}>
                    {isPositive
                      ? <TrendingUp className="icon-xs" />
                      : <TrendingDown className="icon-xs" />}
                    <span className="text-[10px] font-semibold">
                      {isPositive ? "+" : ""}
                      {ticker.percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
                {index < duplicatedTickers.length - 1 && (
                  <div className="h-3 w-px bg-border shrink-0" />
                )}
              </React.Fragment>
            );
          })}
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
