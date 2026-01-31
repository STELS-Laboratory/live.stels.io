/**
 * Ticker Widget - Real-time price ticker visualization
 */
import React, { memo, useMemo } from "react";
import {
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  getPriceChangeColor,
  type TickerRaw,
} from "@/lib/airnet-types";
import { TrendingDown, TrendingUp, Activity } from "lucide-react";

interface TickerWidgetProps {
  data: {
    raw: TickerRaw;
    timestamp: number;
  };
}

const TickerWidget = memo(({ data }: TickerWidgetProps): React.ReactElement => {
  const { raw, timestamp } = data;

  const priceChangeClass = useMemo(
    () => getPriceChangeColor(raw.change),
    [raw.change]
  );

  const TrendIcon = raw.change >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="bg-card p-3 min-w-[240px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase">
            {raw.exchange}
          </span>
          <span className="text-xs text-muted-foreground/50">•</span>
          <span className="text-sm font-semibold">{raw.market}</span>
        </div>
        <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-2xl font-bold font-mono">
          {formatNumber(raw.last, raw.last < 1 ? 6 : 2)}
        </span>
        <div className={`flex items-center gap-1 ${priceChangeClass}`}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {formatPercentage(raw.percentage)}
          </span>
        </div>
      </div>

      {/* Bid/Ask */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-emerald-500/10 p-2 rounded">
          <div className="text-muted-foreground mb-1">Bid</div>
          <div className="font-mono text-emerald-500">
            {formatNumber(raw.bid, raw.bid < 1 ? 6 : 2)}
          </div>
        </div>
        <div className="bg-red-500/10 p-2 rounded">
          <div className="text-muted-foreground mb-1">Ask</div>
          <div className="font-mono text-red-500">
            {formatNumber(raw.ask, raw.ask < 1 ? 6 : 2)}
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div>
          <div className="text-muted-foreground">Base Volume</div>
          <div className="font-mono">{formatNumber(raw.baseVolume, 0)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Quote Volume</div>
          <div className="font-mono">{formatNumber(raw.quoteVolume, 0)}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50">
        <span>Latency: {raw.latency}ms</span>
        <span>{formatRelativeTime(timestamp)}</span>
      </div>
    </div>
  );
});

TickerWidget.displayName = "TickerWidget";

export default TickerWidget;
