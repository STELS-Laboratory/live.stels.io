/**
 * Quick Order Buttons Component
 * One-click buy/sell with preset amounts
 */

import { useState, useCallback } from "react";
import { useTradingStore } from "../store";
import { useRealtimeTicker } from "../hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderSide } from "../types";

interface QuickOrderButtonsProps {
  nid: string;
  symbol: string;
  exchange?: string;
  market?: string;
  className?: string;
}

interface QuickPreset {
  amount: number;
  label: string;
}

// Default presets - can be customized per symbol
const DEFAULT_PRESETS: QuickPreset[] = [
  { amount: 0.001, label: "0.001" },
  { amount: 0.01, label: "0.01" },
  { amount: 0.1, label: "0.1" },
];

export function QuickOrderButtons({
  nid,
  symbol,
  exchange = "bybit",
  market = "spot",
  className,
}: QuickOrderButtonsProps) {
  const { createOrder, orderCreating } = useTradingStore();
  const { raw: tickerData } = useRealtimeTicker(symbol, exchange, market, { interval: 1000 });

  const [lastOrderSide, setLastOrderSide] = useState<OrderSide | null>(null);
  const [lastOrderAmount, setLastOrderAmount] = useState<number | null>(null);

  // Execute quick market order
  const handleQuickOrder = useCallback(
    async (side: OrderSide, amount: number) => {
      if (!nid || !tickerData?.last) return;

      setLastOrderSide(side);
      setLastOrderAmount(amount);

      await createOrder({
        nid,
        symbol,
        side,
        type: "market",
        amount,
      });

      // Reset after brief delay
      setTimeout(() => {
        setLastOrderSide(null);
        setLastOrderAmount(null);
      }, 1500);
    },
    [nid, symbol, createOrder, tickerData?.last]
  );

  // Dynamic presets based on symbol price
  const presets = DEFAULT_PRESETS;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          Quick Orders
        </div>
        {tickerData && (
          <Badge variant="outline" className="text-[10px] font-mono">
            ${tickerData.last?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Badge>
        )}
      </div>

      {/* Buy Row */}
      <div className="flex gap-1">
        {presets.map((preset) => {
          const isLoading = orderCreating && lastOrderSide === "buy" && lastOrderAmount === preset.amount;
          return (
            <Button
              key={`buy-${preset.amount}`}
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 h-7 text-xs font-medium",
                "bg-green-500/5 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/40",
                "text-green-600 dark:text-green-400"
              )}
              disabled={orderCreating || !tickerData}
              onClick={() => handleQuickOrder("buy", preset.amount)}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>Buy {preset.label}</>
              )}
            </Button>
          );
        })}
      </div>

      {/* Sell Row */}
      <div className="flex gap-1">
        {presets.map((preset) => {
          const isLoading = orderCreating && lastOrderSide === "sell" && lastOrderAmount === preset.amount;
          return (
            <Button
              key={`sell-${preset.amount}`}
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 h-7 text-xs font-medium",
                "bg-red-500/5 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40",
                "text-red-600 dark:text-red-400"
              )}
              disabled={orderCreating || !tickerData}
              onClick={() => handleQuickOrder("sell", preset.amount)}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>Sell {preset.label}</>
              )}
            </Button>
          );
        })}
      </div>

      {/* Estimated Values */}
      {tickerData && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span>Est. values:</span>
          <div className="flex gap-2 font-mono">
            {presets.map((preset) => (
              <span key={preset.amount}>
                {preset.label}: ${(preset.amount * tickerData.last).toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
