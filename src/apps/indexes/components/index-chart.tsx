/**
 * Index Chart Component
 * Displays candle/line chart for index data
 */

import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { IndexCandleData, Timeframe } from "../types";

interface IndexChartProps {
  candleData: IndexCandleData | null;
  timeframe: Timeframe;
  className?: string;
}

/**
 * Index Chart Component
 * Professional Bloomberg/Palantir style chart
 */
export function IndexChart({
  candleData,
  timeframe,
  className,
}: IndexChartProps): React.ReactElement {
  const chartData = useMemo(() => {
    if (!candleData || candleData.candles.length === 0) {
      return null;
    }

    const candles = candleData.candles;
    const values = candles.map((c) => c.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return {
      candles,
      min,
      max,
      range,
    };
  }, [candleData]);

  if (!chartData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-64 bg-muted/20 rounded border border-border",
          className,
        )}
      >
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            No chart data available
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">
            {timeframe} timeframe
          </div>
        </div>
      </div>
    );
  }

  const { candles, min, max, range } = chartData;
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate x scale
  const xScale = (index: number): number => {
    return (index / (candles.length - 1 || 1)) * chartWidth;
  };

  // Calculate y scale
  const yScale = (value: number): number => {
    return chartHeight - ((value - min) / range) * chartHeight;
  };

  // Generate path for line
  const linePath = candles
    .map((candle, i) => {
      const x = xScale(i);
      const y = yScale(candle.close);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Generate area path
  const areaPath = `${linePath} L ${xScale(candles.length - 1)} ${chartHeight} L ${xScale(0)} ${chartHeight} Z`;

  // Get color based on trend
  const isUp = candles[candles.length - 1]?.close >= candles[0]?.close;
  const lineColor = isUp ? "#10b981" : "#ef4444";

  return (
    <div className={cn("relative", className)}>
      <svg
        width={width}
        height={height}
        className="w-full h-auto"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient
            id={`gradient-${timeframe}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={isUp ? "#10b981" : "#ef4444"}
              stopOpacity={0.3}
            />
            <stop
              offset="100%"
              stopColor={isUp ? "#10b981" : "#ef4444"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = ratio * chartHeight;
            const value = max - ratio * range;
            return (
              <g key={`grid-h-${ratio}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  strokeOpacity={0.1}
                  className="text-border"
                />
                <text
                  x={-10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {value.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Vertical grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = ratio * chartWidth;
            return (
              <line
                key={`grid-v-${ratio}`}
                x1={x}
                y1={0}
                x2={x}
                y2={chartHeight}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeOpacity={0.1}
                className="text-border"
              />
            );
          })}

          {/* Area */}
          <path
            d={areaPath}
            fill={`url(#gradient-${timeframe})`}
            opacity={0.3}
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {candles.map((candle, i) => {
            const x = xScale(i);
            const y = yScale(candle.close);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={2}
                fill={lineColor}
                className="opacity-0 hover:opacity-100 transition-opacity"
              />
            );
          })}
        </g>

        {/* Y-axis label */}
        <text
          x={padding.left / 2}
          y={height / 2}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          className="text-muted-foreground"
          transform={`rotate(-90 ${padding.left / 2} ${height / 2})`}
        >
          Value
        </text>
      </svg>

      {/* Chart info */}
      <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{timeframe}</span>
        <span>•</span>
        <span>{candles.length} candles</span>
      </div>
    </div>
  );
}

