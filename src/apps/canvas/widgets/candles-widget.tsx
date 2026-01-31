/**
 * Candles Widget - OHLCV candlestick chart visualization (mini)
 */
import React, { memo, useMemo } from "react";
import {
  formatNumber,
  formatPercentage,
  formatTime,
  type CandlesRaw,
  type OHLCVCandle,
} from "@/lib/airnet-types";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";

interface CandlesWidgetProps {
  data: {
    raw: CandlesRaw;
    timestamp: number;
  };
}

const VISIBLE_CANDLES = 30;

const CandlesWidget = memo(({ data }: CandlesWidgetProps): React.ReactElement => {
  const { raw } = data;

  // Get latest candles
  const candles = useMemo(() => {
    return raw.candles.slice(-VISIBLE_CANDLES);
  }, [raw.candles]);

  // Calculate price range for scaling
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    candles.forEach(([, , high, low]) => {
      if (high > max) max = high;
      if (low < min) min = low;
    });
    const padding = (max - min) * 0.1;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: max - min + padding * 2,
    };
  }, [candles]);

  // Latest candle stats
  const latestCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  const priceChange = useMemo(() => {
    if (!latestCandle || !prevCandle) return 0;
    return ((latestCandle[4] - prevCandle[4]) / prevCandle[4]) * 100;
  }, [latestCandle, prevCandle]);

  // Calculate 24h stats
  const stats = useMemo(() => {
    if (candles.length === 0) return null;

    const [, open] = candles[0];
    const [, , , , close] = candles[candles.length - 1];
    const totalVolume = candles.reduce((sum, [, , , , , vol]) => sum + vol, 0);
    const high = Math.max(...candles.map(([, , h]) => h));
    const low = Math.min(...candles.map(([, , , l]) => l));
    const change = ((close - open) / open) * 100;

    return { open, close, high, low, volume: totalVolume, change };
  }, [candles]);

  const decimals = latestCandle && latestCandle[4] < 1 ? 6 : 2;
  const TrendIcon = priceChange >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="bg-card p-3 min-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground uppercase">
            {raw.exchange}
          </span>
          <span className="text-sm font-semibold">{raw.market}</span>
          <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
            {raw.timeframe}
          </span>
        </div>
      </div>

      {/* Price & Change */}
      {latestCandle && (
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-xl font-bold font-mono">
            {formatNumber(latestCandle[4], decimals)}
          </span>
          <div
            className={`flex items-center gap-1 ${
              priceChange >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            <TrendIcon className="h-3 w-3" />
            <span className="text-xs font-medium">
              {formatPercentage(priceChange)}
            </span>
          </div>
        </div>
      )}

      {/* Mini Chart */}
      <div className="relative h-24 mb-3 bg-muted/20 rounded overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${VISIBLE_CANDLES * 10} 100`}
          preserveAspectRatio="none"
        >
          {candles.map((candle: OHLCVCandle, i: number) => {
            const [, open, high, low, close] = candle;
            const isGreen = close >= open;

            const x = i * 10 + 2;
            const width = 6;

            // Wick
            const wickX = x + width / 2;
            const wickTop = 100 - ((high - minPrice) / priceRange) * 100;
            const wickBottom = 100 - ((low - minPrice) / priceRange) * 100;

            // Body
            const bodyTop =
              100 - ((Math.max(open, close) - minPrice) / priceRange) * 100;
            const bodyBottom =
              100 - ((Math.min(open, close) - minPrice) / priceRange) * 100;
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

            return (
              <g key={i}>
                {/* Wick */}
                <line
                  x1={wickX}
                  y1={wickTop}
                  x2={wickX}
                  y2={wickBottom}
                  stroke={isGreen ? "#10b981" : "#ef4444"}
                  strokeWidth="1"
                />
                {/* Body */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={width}
                  height={bodyHeight}
                  fill={isGreen ? "#10b981" : "#ef4444"}
                  opacity={isGreen ? 0.8 : 0.8}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* OHLCV Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-muted-foreground">Open</div>
            <div className="font-mono">{formatNumber(stats.open, decimals)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">High</div>
            <div className="font-mono text-emerald-500">
              {formatNumber(stats.high, decimals)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Low</div>
            <div className="font-mono text-red-500">
              {formatNumber(stats.low, decimals)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Close</div>
            <div className="font-mono">{formatNumber(stats.close, decimals)}</div>
          </div>
        </div>
      )}

      {/* Volume & Time */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-2 border-t border-border/50">
        <span>Vol: {stats && formatNumber(stats.volume, 0)}</span>
        <span>
          {latestCandle && formatTime(latestCandle[0])}
        </span>
      </div>
    </div>
  );
});

CandlesWidget.displayName = "CandlesWidget";

export default CandlesWidget;
