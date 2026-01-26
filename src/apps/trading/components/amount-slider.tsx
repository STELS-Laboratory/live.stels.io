/**
 * Enhanced Amount Slider Component
 * Interactive gradient slider with pill buttons for quick amount selection
 */

import { useCallback, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface AmountSliderProps {
  /** Current amount value */
  value: number;
  /** Maximum amount available */
  max: number;
  /** Callback when amount changes */
  onChange: (value: number) => void;
  /** Precision for amount formatting (default: 6) */
  precision?: number;
  /** Currency label */
  currency?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Show percentage labels */
  showLabels?: boolean;
  /** Custom percentage presets */
  presets?: number[];
  /** Side for coloring (buy/sell) */
  side?: "buy" | "sell";
}

// ============================================
// Constants
// ============================================

const DEFAULT_PRESETS = [0, 25, 50, 75, 100];

// ============================================
// Component
// ============================================

export function AmountSlider({
  value,
  max,
  onChange,
  precision = 6,
  currency,
  disabled = false,
  className,
  showLabels = true,
  presets = DEFAULT_PRESETS,
  side = "buy",
}: AmountSliderProps) {
  // Calculate percentage from value
  const percentage = useMemo(() => {
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (value / max) * 100));
  }, [value, max]);

  // Handle slider change
  const handleSliderChange = useCallback(
    (values: number[]) => {
      const pct = values[0] ?? 0;
      const newValue = (pct / 100) * max;
      onChange(Number(newValue.toFixed(precision)));
    },
    [max, onChange, precision]
  );

  // Handle preset button click
  const handlePresetClick = useCallback(
    (pct: number) => {
      const newValue = (pct / 100) * max;
      onChange(Number(newValue.toFixed(precision)));
    },
    [max, onChange, precision]
  );

  // Format amount for display
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(2) + "M";
    if (amount >= 1000) return (amount / 1000).toFixed(2) + "K";
    if (amount >= 1) return amount.toFixed(4);
    return amount.toFixed(precision);
  };

  const isBuy = side === "buy";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Enhanced Gradient Slider */}
      <div className="relative px-1">
        {/* Gradient Track Background */}
        <div 
          className={cn(
            "absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full overflow-hidden",
            "bg-muted"
          )}
        >
          <div 
            className={cn(
              "h-full rounded-full",
              isBuy 
                ? "bg-gradient-to-r from-trading-buy/30 via-trading-buy/60 to-trading-buy" 
                : "bg-gradient-to-r from-trading-sell/30 via-trading-sell/60 to-trading-sell"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <Slider
          value={[percentage]}
          onValueChange={handleSliderChange}
          max={100}
          step={1}
          disabled={disabled || max <= 0}
          className={cn(
            "relative z-10",
            isBuy ? "slider-buy" : "slider-sell"
          )}
        />
      </div>

      {/* Percentage Pill Buttons */}
      <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
        {presets.filter(p => p > 0).map((pct) => {
          const isActive = Math.abs(percentage - pct) < 1;
          return (
            <button
              key={pct}
              type="button"
              className={cn(
                "flex-1 h-6 text-[10px] px-1.5 font-medium rounded-md",
                "hover:bg-muted",
                isActive 
                  ? cn(
                      "shadow-sm",
                      isBuy 
                        ? "bg-trading-buy/20 text-trading-buy shadow-trading-buy/20" 
                        : "bg-trading-sell/20 text-trading-sell shadow-trading-sell/20"
                    )
                  : "text-muted-foreground hover:text-foreground"
              )}
              disabled={disabled || max <= 0}
              onClick={() => handlePresetClick(pct)}
            >
              {pct}%
            </button>
          );
        })}
      </div>

      {/* Enhanced Labels */}
      {showLabels && max > 0 && (
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-muted-foreground">
            <span className="font-mono font-medium text-foreground">{formatAmount(value)}</span>
            {currency && <span className="ml-1">{currency}</span>}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "h-5 px-1.5 text-[10px] font-mono border-0 rounded",
              percentage > 90 
                ? (isBuy ? "bg-trading-buy/20 text-trading-buy" : "bg-trading-sell/20 text-trading-sell")
                : "bg-muted text-muted-foreground"
            )}
          >
            {percentage.toFixed(0)}%
          </Badge>
          <span className="text-muted-foreground">
            Max: <span className="font-mono">{formatAmount(max)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact Percentage Buttons (Alternative)
// ============================================

interface PercentageButtonsProps {
  /** Callback when percentage is selected */
  onSelect: (percentage: number) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Custom presets */
  presets?: number[];
  /** Current active percentage */
  activePercentage?: number;
}

export function PercentageButtons({
  onSelect,
  disabled = false,
  className,
  presets = [25, 50, 75, 100],
  activePercentage,
}: PercentageButtonsProps) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {presets.map((pct) => {
        const isActive = activePercentage !== undefined && Math.abs(activePercentage - pct) < 1;
        return (
          <Button
            key={pct}
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 h-6 text-[10px] px-1",
              isActive && "bg-primary/10 border-primary"
            )}
            disabled={disabled}
            onClick={() => onSelect(pct)}
          >
            {pct}%
          </Button>
        );
      })}
    </div>
  );
}
