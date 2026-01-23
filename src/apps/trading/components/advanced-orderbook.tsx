/**
 * Advanced Order Book Component
 * Enhanced order book with virtualization, gradient depth visualization, 
 * price clustering, flash animations, heatmap mode, and click-to-set-price
 */

import { useMemo, useCallback, useState, useRef, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, ArrowUpDown, Layers, Flame, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeOrderBook, useRealtimeTicker } from "../hooks";

// ============================================
// Types
// ============================================

interface AdvancedOrderBookProps {
  symbol: string;
  exchange: string;
  market: string;
  onPriceClick?: (price: number) => void;
  maxRows?: number;
}

interface OrderBookRow {
  price: number;
  amount: number;
  total: number;
  cumulative: number;
  percentage: number;
  isNew?: boolean;
  isUpdated?: boolean;
}

type OrderBookGrouping = 0.01 | 0.1 | 1 | 10 | 100 | "auto";
type ViewMode = "both" | "bids" | "asks";

// Heatmap intensity calculation
const getHeatmapIntensity = (amount: number, maxAmount: number): number => {
  if (maxAmount === 0) return 0;
  return Math.min(amount / maxAmount, 1);
};

// ============================================
// Constants
// ============================================

const GROUPING_OPTIONS: { value: OrderBookGrouping; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: 0.01, label: "0.01" },
  { value: 0.1, label: "0.1" },
  { value: 1, label: "1" },
  { value: 10, label: "10" },
  { value: 100, label: "100" },
];


// ============================================
// Utility Functions (memoized outside component)
// ============================================

const formatPriceFn = (price: number): string => {
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
};

const formatAmountFn = (amount: number): string => {
  if (amount >= 1000) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (amount >= 1) return amount.toFixed(4);
  return amount.toFixed(6);
};

/**
 * Group order book entries by tick size
 */
const groupOrderBook = (
  entries: [number, number][],
  tickSize: number
): [number, number][] => {
  if (tickSize === 0) return entries;
  
  const grouped = new Map<number, number>();
  for (const [price, amount] of entries) {
    const groupedPrice = Math.floor(price / tickSize) * tickSize;
    grouped.set(groupedPrice, (grouped.get(groupedPrice) || 0) + amount);
  }
  return Array.from(grouped.entries());
};

/**
 * Auto-detect optimal tick size based on price
 */
const getAutoTickSize = (price: number): number => {
  if (price >= 10000) return 10;
  if (price >= 1000) return 1;
  if (price >= 100) return 0.1;
  if (price >= 10) return 0.01;
  return 0.001;
};

// ============================================
// Memoized Row Component with Gradient Depth
// ============================================

interface OrderBookRowItemProps {
  row: OrderBookRow;
  type: "bid" | "ask";
  onClick: () => void;
  style?: React.CSSProperties;
  heatmapMode?: boolean;
  heatmapIntensity?: number;
}

const OrderBookRowItem = memo(
  function OrderBookRowItem({ row, type, onClick, style, heatmapMode, heatmapIntensity = 0 }: OrderBookRowItemProps) {
    const isBid = type === "bid";
    
    // Gradient depth bar styles
    const depthGradient = isBid
      ? `linear-gradient(to right, var(--trading-buy-bg) 0%, rgba(34, 197, 94, ${0.08 + row.percentage * 0.003}) ${row.percentage}%, transparent ${row.percentage}%)`
      : `linear-gradient(to left, var(--trading-sell-bg) 0%, rgba(239, 68, 68, ${0.08 + row.percentage * 0.003}) ${row.percentage}%, transparent ${row.percentage}%)`;

    // Heatmap glow effect for large orders
    const heatmapStyle = heatmapMode && heatmapIntensity > 0.5
      ? {
          boxShadow: `inset 0 0 ${Math.floor(heatmapIntensity * 20)}px ${isBid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        }
      : {};

    return (
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1 cursor-pointer relative",
          "hover:bg-muted/50 orderbook-row group",
          row.isNew && (isBid ? "flash-bid" : "flash-ask"),
          row.isUpdated && (isBid ? "flash-bid-update" : "flash-ask-update"),
          heatmapMode && heatmapIntensity > 0.7 && "font-semibold"
        )}
        style={{
          ...style,
          background: depthGradient,
          ...heatmapStyle,
          minHeight: '24px',
          contain: 'layout style',
        }}
        onClick={onClick}
      >
        {/* Price */}
        <span className={cn(
          "w-1/3 font-mono text-[11px] tabular-nums",
          isBid ? "text-trading-buy" : "text-trading-sell"
        )}>
          {formatPriceFn(row.price)}
        </span>
        
        {/* Amount with intensity indicator */}
        <span className={cn(
          "w-1/3 text-right font-mono text-[11px] tabular-nums",
          heatmapMode && heatmapIntensity > 0.5 && (isBid ? "text-trading-buy" : "text-trading-sell")
        )}>
          {formatAmountFn(row.amount)}
          {heatmapMode && heatmapIntensity > 0.8 && (
            <Flame className="inline-block ml-0.5 h-3 w-3 text-orange-500" />
          )}
        </span>
        
        {/* Total */}
        <span className="w-1/3 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatAmountFn(row.total)}
        </span>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.row.price === nextProps.row.price &&
      prevProps.row.amount === nextProps.row.amount &&
      prevProps.row.percentage === nextProps.row.percentage &&
      prevProps.row.isNew === nextProps.row.isNew &&
      prevProps.row.isUpdated === nextProps.row.isUpdated &&
      prevProps.type === nextProps.type &&
      prevProps.heatmapMode === nextProps.heatmapMode &&
      prevProps.heatmapIntensity === nextProps.heatmapIntensity
    );
  }
);

// ============================================
// Main Component
// ============================================

export function AdvancedOrderBook({
  symbol,
  exchange,
  market,
  onPriceClick,
  maxRows = 20,
}: AdvancedOrderBookProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [grouping, setGrouping] = useState<OrderBookGrouping>("auto");
  const [heatmapMode, setHeatmapMode] = useState(false);
  
  // Track previous prices for flash animation
  const prevPricesRef = useRef<Map<number, number>>(new Map());

  // Get realtime order book data
  const { raw: orderBookData, loading, error } = useRealtimeOrderBook(
    symbol,
    exchange,
    market,
    { interval: 300 } // Faster updates for better responsiveness
  );

  // Get ticker for spread calculation
  const { raw: tickerData } = useRealtimeTicker(symbol, exchange, market, { interval: 1000 });

  // Calculate effective tick size
  const effectiveTickSize = useMemo(() => {
    if (grouping === "auto") {
      const lastPrice = tickerData?.last || orderBookData?.bids?.[0]?.[0] || 1000;
      return getAutoTickSize(lastPrice);
    }
    return grouping;
  }, [grouping, tickerData?.last, orderBookData?.bids]);

  // Process order book data with grouping and flash detection
  const { bids, asks, spread, spreadPercent } = useMemo(() => {
    if (!orderBookData) {
      return { bids: [], asks: [], spread: 0, spreadPercent: 0 };
    }

    const rawBids = orderBookData.bids || [];
    const rawAsks = orderBookData.asks || [];

    // Apply grouping
    const groupedBids = grouping !== "auto" && effectiveTickSize > 0
      ? groupOrderBook(rawBids, effectiveTickSize)
      : rawBids;
    const groupedAsks = grouping !== "auto" && effectiveTickSize > 0
      ? groupOrderBook(rawAsks, effectiveTickSize)
      : rawAsks;

    // Sort bids descending, asks ascending
    const sortedBids = [...groupedBids].sort((a, b) => b[0] - a[0]).slice(0, maxRows);
    const sortedAsks = [...groupedAsks].sort((a, b) => a[0] - b[0]).slice(0, maxRows);

    // Process bids
    let bidCumulative = 0;
    const processedBids: OrderBookRow[] = sortedBids.map(([price, amount]) => {
      const total = price * amount;
      bidCumulative += amount;
      const prevAmount = prevPricesRef.current.get(price);
      const isNew = prevAmount === undefined;
      const isUpdated = prevAmount !== undefined && prevAmount !== amount;
      return { price, amount, total, cumulative: bidCumulative, percentage: 0, isNew, isUpdated };
    });

    // Process asks
    let askCumulative = 0;
    const processedAsks: OrderBookRow[] = sortedAsks.map(([price, amount]) => {
      const total = price * amount;
      askCumulative += amount;
      const prevAmount = prevPricesRef.current.get(price);
      const isNew = prevAmount === undefined;
      const isUpdated = prevAmount !== undefined && prevAmount !== amount;
      return { price, amount, total, cumulative: askCumulative, percentage: 0, isNew, isUpdated };
    });

    // Calculate max cumulative for percentage bars
    const maxCum = Math.max(bidCumulative, askCumulative) || 1;

    // Add percentage for depth visualization
    processedBids.forEach((row) => {
      row.percentage = (row.cumulative / maxCum) * 100;
    });
    processedAsks.forEach((row) => {
      row.percentage = (row.cumulative / maxCum) * 100;
    });

    // Update previous prices ref for next render
    const newPrices = new Map<number, number>();
    [...sortedBids, ...sortedAsks].forEach(([price, amount]) => {
      newPrices.set(price, amount);
    });
    prevPricesRef.current = newPrices;

    // Calculate spread
    const bestBid = processedBids[0]?.price || 0;
    const bestAsk = processedAsks[0]?.price || 0;
    const spreadValue = bestAsk - bestBid;
    const spreadPct = bestBid > 0 ? (spreadValue / bestBid) * 100 : 0;

    // Calculate max amount for heatmap
    const allAmounts = [...processedBids, ...processedAsks].map(r => r.amount);
    const maxAmt = Math.max(...allAmounts) || 1;

    return {
      bids: processedBids,
      asks: processedAsks.reverse(), // Reverse for display (highest at bottom)
      spread: spreadValue,
      spreadPercent: spreadPct,
      maxAmount: maxAmt,
    };
  }, [orderBookData, maxRows, grouping, effectiveTickSize]);

  // Destructure maxAmount
  const { maxAmount } = useMemo(() => {
    if (!orderBookData) return { maxAmount: 0 };
    const allAmounts = [...bids, ...asks].map(r => r.amount);
    return { maxAmount: Math.max(...allAmounts) || 1 };
  }, [bids, asks, orderBookData]);

  // Handle price click
  const handlePriceClick = useCallback(
    (price: number) => {
      onPriceClick?.(price);
    },
    [onPriceClick]
  );

  // Dynamic height will be calculated based on available space
  // Using flex-1 for full height utilization

  if (loading && !orderBookData) {
    return (
      <div className="h-full flex flex-col p-2">
        <div className="flex items-center gap-2 pb-2 shrink-0">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Order Book</span>
        </div>
        <div className="flex-1 space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col p-2">
        <div className="flex items-center gap-2 pb-2 shrink-0">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Order Book</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const displayAsks = viewMode === "bids" ? [] : asks;
  const displayBids = viewMode === "asks" ? [] : bids;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0 border-b bg-muted/30">
        <span className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Order Book
        </span>
        <div className="flex items-center gap-1">
          {/* Grouping Selector */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Select
                  value={String(grouping)}
                  onValueChange={(v) => setGrouping(v === "auto" ? "auto" : parseFloat(v) as OrderBookGrouping)}
                >
                  <SelectTrigger className="h-6 w-16 text-[10px] rounded-md border-muted">
                    <Layers className="h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUPING_OPTIONS.map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>Price Grouping</TooltipContent>
          </Tooltip>

          {/* Heatmap Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={heatmapMode ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0 rounded-md",
                  heatmapMode && "text-orange-500 bg-orange-500/10"
                )}
                onClick={() => setHeatmapMode(!heatmapMode)}
              >
                <Flame className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heatmap Mode</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          {/* View Mode Buttons */}
          <div className="flex items-center rounded-md bg-muted/50 p-0.5">
            <Button
              variant={viewMode === "both" ? "secondary" : "ghost"}
              size="sm"
              className="h-5 w-5 p-0 rounded-sm"
              onClick={() => setViewMode("both")}
            >
              <ArrowUpDown className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "bids" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-5 px-1.5 text-[10px] rounded-sm font-semibold",
                viewMode === "bids" && "text-trading-buy"
              )}
              onClick={() => setViewMode("bids")}
            >
              B
            </Button>
            <Button
              variant={viewMode === "asks" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-5 px-1.5 text-[10px] rounded-sm font-semibold",
                viewMode === "asks" && "text-trading-sell"
              )}
              onClick={() => setViewMode("asks")}
            >
              A
            </Button>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[10px] text-muted-foreground border-b bg-muted/20 shrink-0">
        <span className="w-1/3 font-medium uppercase tracking-wide">Price</span>
        <span className="w-1/3 text-right font-medium uppercase tracking-wide">Amount</span>
        <span className="w-1/3 text-right font-medium uppercase tracking-wide">Total</span>
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Asks Section (sells) - red */}
        {displayAsks.length > 0 && (
          <div className={cn(
            "flex-1 min-h-0 overflow-auto scrollbar-thin",
            viewMode === "both" && "max-h-[calc(50%-28px)]"
          )}>
            <div className="flex flex-col-reverse h-full">
              {displayAsks.map((row) => {
                const intensity = heatmapMode ? getHeatmapIntensity(row.amount, maxAmount) : 0;
                return (
                  <OrderBookRowItem
                    key={`ask-${row.price}`}
                    row={row}
                    type="ask"
                    onClick={() => handlePriceClick(row.price)}
                    heatmapMode={heatmapMode}
                    heatmapIntensity={intensity}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Spread Indicator */}
        {viewMode === "both" && (
          <div className="shrink-0 flex items-center justify-between py-2.5 px-3 border-y bg-gradient-to-r from-trading-sell/5 via-muted/30 to-trading-buy/5">
            <div className="flex items-center gap-2">
              {tickerData && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "h-7 px-2.5 font-mono text-sm font-bold border-0 rounded-md shadow-sm",
                    (tickerData.percentage ?? 0) >= 0
                      ? "bg-trading-buy/20 text-trading-buy"
                      : "bg-trading-sell/20 text-trading-sell"
                  )}
                >
                  {(tickerData.percentage ?? 0) >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {tickerData.last?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground font-medium">Spread</span>
              <span className="font-mono font-bold text-sm">
                {formatPriceFn(spread)}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "h-5 px-2 text-[10px] font-mono font-semibold border-0 rounded",
                  spreadPercent > 0.1 
                    ? "bg-trading-highlight/20 text-trading-highlight" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {spreadPercent.toFixed(3)}%
              </Badge>
            </div>
          </div>
        )}

        {/* Bids Section (buys) - green */}
        {displayBids.length > 0 && (
          <div className={cn(
            "flex-1 min-h-0 overflow-auto scrollbar-thin",
            viewMode === "both" && "max-h-[calc(50%-28px)]"
          )}>
            <div className="flex flex-col">
              {displayBids.map((row) => {
                const intensity = heatmapMode ? getHeatmapIntensity(row.amount, maxAmount) : 0;
                return (
                  <OrderBookRowItem
                    key={`bid-${row.price}`}
                    row={row}
                    type="bid"
                    onClick={() => handlePriceClick(row.price)}
                    heatmapMode={heatmapMode}
                    heatmapIntensity={intensity}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Volume Summary Footer */}
      {orderBookData?.volume && (
        <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Bid Vol:</span>
            <span className="text-xs text-trading-buy font-mono font-semibold">
              {orderBookData.volume[0].toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Ask Vol:</span>
            <span className="text-xs text-trading-sell font-mono font-semibold">
              {orderBookData.volume[1].toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
