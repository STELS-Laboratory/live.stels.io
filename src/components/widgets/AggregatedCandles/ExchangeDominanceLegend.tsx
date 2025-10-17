/**
 * Exchange dominance legend component
 */

import React from "react";
import type { ExchangeData } from "./types";
import {
  LINE_WIDTH,
  MARKET_CONCENTRATION_THRESHOLD,
  MAX_EXCHANGES_IN_LEGEND,
  SIGNIFICANT_MARKET_SHARE,
} from "./constants";

interface ExchangeDominanceLegendProps {
  exchangeData: ExchangeData[];
}

/**
 * Legend showing exchange dominance and market concentration
 */
export const ExchangeDominanceLegend: React.FC<
  ExchangeDominanceLegendProps
> = React.memo(({ exchangeData }) => {
  const maxDominance = Math.max(
    ...exchangeData.map((e) => e.dominance || 0),
  );

  const topExchanges = exchangeData.slice(0, MAX_EXCHANGES_IN_LEGEND);
  const leaderExchange = exchangeData[0];
  const hasHighConcentration = leaderExchange &&
    (leaderExchange.marketShare || 0) > MARKET_CONCENTRATION_THRESHOLD;

  return (
    <div className="w-full mt-2 pt-2 border-t border-border">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
        Exchange Dominance Analysis (Regulatory View)
      </div>
      <div className="grid grid-cols-2 gap-2">
        {topExchanges.map(
          ({ exchange, color, dominance, marketShare }, index) => {
            const dominanceRatio = (dominance || 0) / maxDominance;
            const lineWidth = Math.max(
              LINE_WIDTH.min,
              Math.min(LINE_WIDTH.max, 1 + dominanceRatio * 4),
            );

            const isDominant = index === 0;
            const isSignificant = (marketShare || 0) > SIGNIFICANT_MARKET_SHARE;

            return (
              <div
                key={exchange}
                className={`flex items-center gap-2 p-2 rounded border ${
                  isDominant
                    ? "bg-amber-500/10 border-amber-500/30"
                    : isSignificant
                    ? "bg-muted/50 border-border"
                    : "bg-card/50 border-border"
                }`}
              >
                <div className="flex items-center gap-1">
                  <div
                    className="rounded"
                    style={{
                      backgroundColor: color,
                      width: `${lineWidth * 3}px`,
                      height: `${lineWidth}px`,
                    }}
                  />
                  {isDominant && (
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] capitalize font-medium ${
                        isDominant ? "text-amber-500" : "text-muted-foreground"
                      }`}
                    >
                      {exchange}
                    </span>
                    {isDominant && (
                      <span className="text-[7px] bg-amber-500 text-black dark:text-black px-1 rounded font-bold">
                        LEADER
                      </span>
                    )}
                  </div>
                  <div className="text-[8px] text-muted-foreground">
                    {marketShare?.toFixed(1)}% | Dom: {dominance?.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* Market Concentration Warning */}
      {hasHighConcentration && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
          <div className="text-[9px] text-red-400 font-semibold uppercase tracking-wider">
            ⚠️ High Market Concentration
          </div>
          <div className="text-[8px] text-red-300 mt-1">
            {leaderExchange.exchange} controls{" "}
            {leaderExchange.marketShare?.toFixed(1)}% of market liquidity
          </div>
        </div>
      )}
    </div>
  );
});

ExchangeDominanceLegend.displayName = "ExchangeDominanceLegend";
