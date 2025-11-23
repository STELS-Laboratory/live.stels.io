/**
 * Index Card Component
 * Displays a single index in grid/list view
 */

import * as React from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IndexMetadata, IndexData, IndexCode, IndexCandleData } from "../types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react";
import { useIndexStore } from "../store";

interface IndexCardProps {
  metadata: IndexMetadata;
  data: IndexData | null;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Get value from index data
 */
function getIndexValue(data: IndexData | null): number | null {
  if (!data) return null;

  if ("value" in data) {
    return data.value as number;
  }

  if ("compositeIndex" in data) {
    return (data as { compositeIndex: number }).compositeIndex;
  }

  if ("overallCorrelation" in data) {
    return (data as { overallCorrelation: number }).overallCorrelation;
  }

  if ("overallSpread" in data) {
    return (data as { overallSpread: number }).overallSpread;
  }

  // AOI: Use avgProfitPercent or totalOpportunities
  if ("avgProfitPercent" in data) {
    const aoiData = data as { avgProfitPercent: number; totalOpportunities: number };
    // Prefer avgProfitPercent if available, otherwise use totalOpportunities
    return aoiData.avgProfitPercent > 0 ? aoiData.avgProfitPercent : aoiData.totalOpportunities;
  }

  // ELI: Use totalMarketVolume
  if ("totalMarketVolume" in data) {
    return (data as { totalMarketVolume: number }).totalMarketVolume;
  }

  return null;
}

/**
 * Get trend indicator
 */
function getTrendIndicator(data: IndexData | null): {
  icon: React.ReactElement;
  color: string;
} {
  if (!data) {
    return {
      icon: <Minus className="icon-sm" />,
      color: "text-muted-foreground",
    };
  }

  // Check for sentiment/direction
  if ("sentiment" in data) {
    const sentiment = (data as { sentiment: string }).sentiment;
    if (sentiment.includes("greed") || sentiment === "bullish") {
      return {
        icon: <TrendingUp className="icon-sm" />,
        color: "text-green-500",
      };
    }
    if (sentiment.includes("fear") || sentiment === "bearish") {
      return {
        icon: <TrendingDown className="icon-sm" />,
        color: "text-red-500",
      };
    }
  }

  if ("direction" in data) {
    const direction = (data as { direction: string }).direction;
    if (direction === "uptrend") {
      return {
        icon: <TrendingUp className="icon-sm" />,
        color: "text-green-500",
      };
    }
    if (direction === "downtrend") {
      return {
        icon: <TrendingDown className="icon-sm" />,
        color: "text-red-500",
      };
    }
  }

  return {
    icon: <Activity className="icon-sm" />,
    color: "text-amber-500",
  };
}

/**
 * Format value based on index type
 */
function formatValue(value: number | null, code: string, data: IndexData | null): string {
  if (value === null) return "N/A";

  // AOI: Show avgProfitPercent as percentage or totalOpportunities as count
  if (code === "AOI" && data && "avgProfitPercent" in data) {
    const aoiData = data as { avgProfitPercent: number; totalOpportunities: number };
    if (aoiData.avgProfitPercent > 0) {
      return `${aoiData.avgProfitPercent.toFixed(2)}%`;
    }
    return `${aoiData.totalOpportunities} opps`;
  }

  // ELI: Format as large number with B/M/K suffix
  if (code === "ELI" && value !== null) {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  }

  // Percentage-based indexes
  if (["BDI", "MBI", "FGI"].includes(code)) {
    return `${value.toFixed(2)}%`;
  }

  // Correlation (0-1 range)
  if (code === "CI") {
    return value.toFixed(3);
  }

  // Spread (small decimals)
  if (code === "PSI") {
    return value.toFixed(6);
  }

  // Large numbers
  if (value > 1000) {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  return value.toFixed(2);
}

/**
 * Mini Chart Component for Index Card
 */
function MiniChart({
  candleData,
}: {
  candleData: IndexCandleData | null;
}): React.ReactElement {
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
      <div className="h-16 flex items-center justify-center bg-muted/10 rounded border border-border">
        <div className="text-[10px] text-muted-foreground">No data</div>
      </div>
    );
  }

  const { candles, min, range } = chartData;
  const width = 200;
  const height = 64;
  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
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

  // Get color based on trend
  const isUp = candles[candles.length - 1]?.close >= candles[0]?.close;
  const lineColor = isUp ? "#10b981" : "#ef4444";

  // Generate area path
  const areaPath = `${linePath} L ${xScale(candles.length - 1)} ${chartHeight} L ${xScale(0)} ${chartHeight} Z`;

  return (
    <div className="relative h-16 w-full">
      <svg
        width={width}
        height={height}
        className="w-full h-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={`mini-gradient-${candles[0]?.timestamp || 0}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={isUp ? "#10b981" : "#ef4444"}
              stopOpacity={0.2}
            />
            <stop
              offset="100%"
              stopColor={isUp ? "#10b981" : "#ef4444"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Area */}
          <path
            d={areaPath}
            fill={`url(#mini-gradient-${candles[0]?.timestamp || 0})`}
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

/**
 * Index Card Component
 */
export function IndexCard({
  metadata,
  data,
  isSelected,
  onClick,
}: IndexCardProps): React.ReactElement {
  const value = getIndexValue(data);
  const trend = getTrendIndicator(data);
  const formattedValue = formatValue(value, metadata.code, data);
  
  // Get 5-minute candle data for preview
  const getCandleData = useIndexStore((state) => state.getCandleData);
  const candleData = useMemo(() => {
    return getCandleData(metadata.code as IndexCode, "5m");
  }, [metadata.code, getCandleData]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 border",
          isSelected
            ? "border-amber-500 bg-amber-500/5 shadow-lg"
            : "border-border hover:border-amber-500/50 hover:bg-card/50",
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-foreground truncate">
                {metadata.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {metadata.description}
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-2 shrink-0 text-[10px] font-mono border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
            >
              {metadata.code}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center", trend.color)}>
                {trend.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {formattedValue}
                </div>
                {data && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="text-[10px] capitalize"
              >
                {metadata.category}
              </Badge>
            </div>
          </div>
          
          {/* 5-minute chart preview */}
          <div className="mt-2">
            <MiniChart candleData={candleData} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

