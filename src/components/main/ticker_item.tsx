/**
 * Ticker Item Component
 * Memoized component for individual ticker items in marquee
 */

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { importCoinIcon, importExchangeIcon, getFirstLetter } from "@/lib/icon-utils";
import type { TickerData } from "@/types/components/main/types";

interface TickerItemProps {
  ticker: TickerData;
  index: number;
  isLast: boolean;
}

/**
 * Memoized Ticker Item Component
 * Prevents unnecessary re-renders when parent updates
 */
export const TickerItem = React.memo(function TickerItem({
  ticker,
  isLast,
}: TickerItemProps): React.ReactElement {
  const isPositive = ticker.change >= 0;
  const changeColor = isPositive
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  // Memoize icon paths
  const baseCurrency = ticker.market.split("/")[0] || "";
  const coinIcon = React.useMemo(() => importCoinIcon(baseCurrency), [baseCurrency]);
  const coinFirstLetter = React.useMemo(() => getFirstLetter(baseCurrency), [baseCurrency]);
  const exchangeIcon = React.useMemo(() => importExchangeIcon(ticker.exchange), [ticker.exchange]);
  const exchangeFirstLetter = React.useMemo(() => getFirstLetter(ticker.exchange), [ticker.exchange]);

  // Memoize formatted price
  const formattedPrice = React.useMemo(
    () =>
      ticker.last.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }),
    [ticker.last]
  );

  return (
    <React.Fragment>
      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
        {/* Coin Icon */}
        <div className="relative w-3.5 h-3.5 flex-shrink-0">
          {coinIcon ? (
            <img
              src={coinIcon}
              alt={baseCurrency}
              className="w-3.5 h-3.5 rounded-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Show fallback on error
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={cn(
              "w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center text-[7px] font-semibold text-muted-foreground",
              coinIcon ? "hidden" : "flex"
            )}
          >
            {coinFirstLetter}
          </div>
        </div>
        <span className="text-[10px] font-semibold text-foreground">
          {ticker.market}
        </span>
        {/* Exchange Icon */}
        <div className="relative w-3 h-3 flex-shrink-0">
          {exchangeIcon ? (
            <img
              src={exchangeIcon}
              alt={ticker.exchange}
              className="w-3 h-3 rounded object-cover"
              loading="lazy"
              onError={(e) => {
                // Show fallback on error
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={cn(
              "w-3 h-3 rounded bg-muted flex items-center justify-center text-[6px] font-semibold text-muted-foreground",
              exchangeIcon ? "hidden" : "flex"
            )}
          >
            {exchangeFirstLetter}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase">
          {ticker.exchange}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formattedPrice}
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
      {!isLast && <div className="h-3 w-px bg-border shrink-0" />}
    </React.Fragment>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.ticker.market === nextProps.ticker.market &&
    prevProps.ticker.exchange === nextProps.ticker.exchange &&
    prevProps.ticker.last === nextProps.ticker.last &&
    prevProps.ticker.change === nextProps.ticker.change &&
    prevProps.ticker.percentage === nextProps.ticker.percentage &&
    prevProps.isLast === nextProps.isLast
  );
});

