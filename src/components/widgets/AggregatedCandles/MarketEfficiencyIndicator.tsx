/**
 * Market efficiency indicator component
 */

import React from "react";
import { EFFICIENCY_THRESHOLDS } from "./constants";

interface MarketEfficiencyIndicatorProps {
  efficiency: number;
}

/**
 * Visual indicator for market efficiency score
 */
export const MarketEfficiencyIndicator: React.FC<
  MarketEfficiencyIndicatorProps
> = React.memo(({ efficiency }) => {
  const getEfficiencyColor = (value: number): string => {
    if (value >= EFFICIENCY_THRESHOLDS.high) return "green";
    if (value >= EFFICIENCY_THRESHOLDS.medium) return "yellow";
    return "red";
  };

  const color = getEfficiencyColor(efficiency);
  const clampedEfficiency = Math.min(100, Math.max(0, efficiency));

  return (
    <div className="mt-3 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          MARKET EFFICIENCY
        </span>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 bg-${color}-500`}
              style={{ width: `${clampedEfficiency}%` }}
            />
          </div>
          <span className={`text-[10px] font-mono text-${color}-500`}>
            {clampedEfficiency.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
});

MarketEfficiencyIndicator.displayName = "MarketEfficiencyIndicator";
