import React from "react";
import type { CandleData } from "../types.ts";

interface MiniCandlestickChartProps {
  candles: CandleData[];
  width?: number;
  height?: number;
}

/**
 * Mini candlestick chart component for market data visualization
 */
export function MiniCandlestickChart({
  candles,
  width = 120,
  height = 40,
}: MiniCandlestickChartProps): React.ReactElement {
  if (!candles || candles.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  const recentCandles = candles;

  // Calculate price range
  const prices = recentCandles.flatMap((c) => [c.high, c.low]);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const priceRange = maxPrice - minPrice;

  if (priceRange === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ width, height }}
      >
        No range
      </div>
    );
  }

  const candleWidth = (width - 10) / recentCandles.length;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {recentCandles.map((candle, index) => {
        const x = 5 + index * candleWidth + candleWidth / 2;
        const highY = 5 +
          ((maxPrice - candle.high) / priceRange) * (height - 10);
        const lowY = 5 + ((maxPrice - candle.low) / priceRange) * (height - 10);
        const openY = 5 +
          ((maxPrice - candle.open) / priceRange) * (height - 10);
        const closeY = 5 +
          ((maxPrice - candle.close) / priceRange) * (height - 10);

        const isGreen = candle.close >= candle.open;
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY);

        return (
          <g key={index}>
            {/* Wick */}
            <line
              x1={x}
              y1={highY}
              x2={x}
              y2={lowY}
              stroke={isGreen ? "#16a34a" : "#dc2626"}
              strokeWidth="0.5"
            />
            {/* Body */}
            <rect
              x={x - candleWidth / 4}
              y={bodyTop}
              width={candleWidth / 2}
              height={Math.max(bodyHeight, 1)}
              fill={isGreen ? "#16a34a" : "#dc2626"}
              opacity={isGreen ? 0.8 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
}
