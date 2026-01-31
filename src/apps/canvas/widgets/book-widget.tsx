/**
 * Order Book Widget - Real-time order book visualization
 */
import React, { memo, useMemo } from "react";
import {
  formatNumber,
  formatRelativeTime,
  type OrderBookRaw,
} from "@/lib/airnet-types";
import { BookOpen } from "lucide-react";

interface BookWidgetProps {
  data: {
    raw: OrderBookRaw;
    timestamp: number;
  };
}

const MAX_ROWS = 10;

const BookWidget = memo(({ data }: BookWidgetProps): React.ReactElement => {
  const { raw, timestamp } = data;

  // Calculate max volume for bar scaling
  const maxVolume = useMemo(() => {
    const bidVolumes = raw.bids.slice(0, MAX_ROWS).map(([, amt]) => amt);
    const askVolumes = raw.asks.slice(0, MAX_ROWS).map(([, amt]) => amt);
    return Math.max(...bidVolumes, ...askVolumes);
  }, [raw.bids, raw.asks]);

  // Calculate total volumes
  const totalBidVolume = useMemo(
    () => raw.bids.slice(0, MAX_ROWS).reduce((sum, [, amt]) => sum + amt, 0),
    [raw.bids]
  );
  const totalAskVolume = useMemo(
    () => raw.asks.slice(0, MAX_ROWS).reduce((sum, [, amt]) => sum + amt, 0),
    [raw.asks]
  );

  // Spread calculation
  const spread = useMemo(() => {
    if (raw.asks.length > 0 && raw.bids.length > 0) {
      const bestAsk = raw.asks[0][0];
      const bestBid = raw.bids[0][0];
      return {
        absolute: bestAsk - bestBid,
        percentage: ((bestAsk - bestBid) / bestBid) * 100,
      };
    }
    return { absolute: 0, percentage: 0 };
  }, [raw.asks, raw.bids]);

  const decimals = raw.bids[0]?.[0] < 1 ? 6 : 2;

  return (
    <div className="bg-card p-3 min-w-[280px] max-h-[400px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground uppercase">
            {raw.exchange}
          </span>
          <span className="text-sm font-semibold">{raw.market}</span>
        </div>
      </div>

      {/* Spread */}
      <div className="flex items-center justify-center gap-2 mb-3 p-2 bg-muted/30 rounded text-xs">
        <span className="text-muted-foreground">Spread:</span>
        <span className="font-mono">{formatNumber(spread.absolute, decimals)}</span>
        <span className="text-muted-foreground">
          ({spread.percentage.toFixed(3)}%)
        </span>
      </div>

      {/* Order Book */}
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {/* Headers */}
        <div className="grid grid-cols-2 gap-1 text-muted-foreground mb-1 px-1">
          <span>Size</span>
          <span className="text-right">Bid</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-muted-foreground mb-1 px-1">
          <span>Ask</span>
          <span className="text-right">Size</span>
        </div>

        {/* Bids */}
        <div className="space-y-0.5">
          {raw.bids.slice(0, MAX_ROWS).map(([price, amount], i) => (
            <div key={`bid-${i}`} className="relative">
              <div
                className="absolute inset-0 bg-emerald-500/20 rounded-sm"
                style={{ width: `${(amount / maxVolume) * 100}%` }}
              />
              <div className="relative grid grid-cols-2 gap-1 px-1 py-0.5">
                <span className="font-mono text-muted-foreground">
                  {formatNumber(amount, 2)}
                </span>
                <span className="font-mono text-emerald-500 text-right">
                  {formatNumber(price, decimals)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Asks */}
        <div className="space-y-0.5">
          {raw.asks.slice(0, MAX_ROWS).map(([price, amount], i) => (
            <div key={`ask-${i}`} className="relative">
              <div
                className="absolute inset-0 right-0 bg-red-500/20 rounded-sm"
                style={{
                  width: `${(amount / maxVolume) * 100}%`,
                  marginLeft: "auto",
                }}
              />
              <div className="relative grid grid-cols-2 gap-1 px-1 py-0.5">
                <span className="font-mono text-red-500">
                  {formatNumber(price, decimals)}
                </span>
                <span className="font-mono text-muted-foreground text-right">
                  {formatNumber(amount, 2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume Summary */}
      <div className="mt-3 pt-2 border-t border-border/50">
        <div className="flex justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-mono">
              {formatNumber(totalBidVolume, 0)}
            </span>
            <div className="w-16 h-1 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${(totalBidVolume / (totalBidVolume + totalAskVolume)) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-red-500 ml-auto"
                style={{
                  width: `${(totalAskVolume / (totalBidVolume + totalAskVolume)) * 100}%`,
                }}
              />
            </div>
            <span className="text-red-500 font-mono">
              {formatNumber(totalAskVolume, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-2 mt-2 border-t border-border/50">
        <span>Latency: {raw.latency}ms</span>
        <span>{formatRelativeTime(timestamp)}</span>
      </div>
    </div>
  );
});

BookWidget.displayName = "BookWidget";

export default BookWidget;
