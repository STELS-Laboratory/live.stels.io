/**
 * Metrics panel component for OHLC and Fair Value data
 */

import React from "react";

interface MetricsPanelProps {
  lastCandle: {
    open: number;
    high: number;
    low: number;
    close: number;
  } | null;
  fairValuePrice: number | null;
  priceDeviation: number;
  volumeValue: number | null;
}

/**
 * Panel displaying OHLC data and fair value analysis
 */
export const MetricsPanel: React.FC<MetricsPanelProps> = React.memo(({
  lastCandle,
  fairValuePrice,
  priceDeviation,
  volumeValue,
}) => {
  const getDeviationColor = (deviation: number): string => {
    const abs = Math.abs(deviation);
    if (abs < 1) return "text-green-500";
    if (abs < 3) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="w-full bg-card/50 p-3 rounded border">
      <div className="grid grid-cols-2 gap-4">
        {/* OHLC Data */}
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            OHLC DATA
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">O:</span>
              <span className="font-mono text-card-foreground">
                {lastCandle?.open.toFixed(2) ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">H:</span>
              <span className="font-mono text-green-400">
                {lastCandle?.high.toFixed(2) ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">L:</span>
              <span className="font-mono text-red-400">
                {lastCandle?.low.toFixed(2) ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">C:</span>
              <span className="font-mono text-amber-500">
                {lastCandle?.close.toFixed(2) ?? "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Fair Value & Deviation */}
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            FAIR VALUE ANALYSIS
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fair Value:</span>
              <span className="font-mono text-amber-500">
                {fairValuePrice?.toFixed(2) ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deviation:</span>
              <span
                className={`font-mono ${getDeviationColor(priceDeviation)}`}
              >
                {priceDeviation >= 0 ? "+" : ""}
                {priceDeviation.toFixed(2)}%
              </span>
            </div>
            {volumeValue !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-mono text-card-foreground">
                  {volumeValue.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MetricsPanel.displayName = "MetricsPanel";
