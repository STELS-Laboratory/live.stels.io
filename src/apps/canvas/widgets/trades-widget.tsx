/**
 * Trades Widget - Real-time trades stream visualization
 */
import React, { memo, useMemo } from "react";
import {
  formatNumber,
  formatRelativeTime,
  type TradesRaw,
  type Trade,
} from "@/lib/airnet-types";
import { Activity, ArrowDown, ArrowUp } from "lucide-react";

interface TradesWidgetProps {
  data: {
    raw: TradesRaw;
    timestamp: number;
  };
  /** Container width for responsive layout */
  containerWidth?: number;
  /** Container height for responsive layout */
  containerHeight?: number;
}

/**
 * Format trade amount based on size
 */
function formatTradeAmount(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  if (amount >= 1) {
    return amount.toFixed(4);
  }
  return amount.toFixed(6);
}

/**
 * Format trade time to HH:MM:SS.ms
 */
function formatTradeTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Single trade row component
 */
const TradeRow = memo(({ trade }: { trade: Trade }): React.ReactElement => {
  const isBuy = trade.side === "buy";
  const sideClass = isBuy ? "text-emerald-500" : "text-red-500";
  const bgClass = isBuy ? "bg-emerald-500/5" : "bg-red-500/5";
  const Icon = isBuy ? ArrowUp : ArrowDown;

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 text-[10px] font-mono ${bgClass} border-b border-border/30 last:border-0`}
    >
      <Icon className={`h-3 w-3 ${sideClass} flex-shrink-0`} />
      <span className={`w-20 text-right ${sideClass} font-medium`}>
        {formatNumber(trade.price, trade.price < 1 ? 6 : 2)}
      </span>
      <span className="w-16 text-right text-foreground/80">
        {formatTradeAmount(trade.amount)}
      </span>
      <span className="w-20 text-right text-muted-foreground">
        ${formatNumber(trade.cost, 2)}
      </span>
      <span className="flex-1 text-right text-muted-foreground/60 text-[9px]">
        {formatTradeTime(trade.timestamp)}
      </span>
    </div>
  );
});

TradeRow.displayName = "TradeRow";

const TradesWidget = memo(
  ({ data, containerWidth, containerHeight }: TradesWidgetProps): React.ReactElement => {
    const { raw, timestamp } = data;

    // Calculate how many trades to show based on container height
    const maxTrades = useMemo(() => {
      if (!containerHeight) return 20;
      // Header(40) + Stats(44) + ColumnHeaders(24) + Footer(32) = ~140px
      const availableHeight = containerHeight - 140;
      const rowHeight = 24;
      const calculated = Math.floor(availableHeight / rowHeight);
      return Math.max(5, Math.min(calculated, 50));
    }, [containerHeight]);

    // Calculate stats
    const stats = useMemo(() => {
      const trades = raw.trades || [];
      const buys = trades.filter((t) => t.side === "buy");
      const sells = trades.filter((t) => t.side === "sell");

      const buyVolume = buys.reduce((sum, t) => sum + t.cost, 0);
      const sellVolume = sells.reduce((sum, t) => sum + t.cost, 0);
      const totalVolume = buyVolume + sellVolume;
      const buyRatio = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;

      const latestPrice = trades.length > 0 ? trades[0].price : 0;
      const oldestPrice =
        trades.length > 0 ? trades[trades.length - 1].price : 0;
      const priceChange =
        oldestPrice > 0
          ? ((latestPrice - oldestPrice) / oldestPrice) * 100
          : 0;

      return {
        count: trades.length,
        buyCount: buys.length,
        sellCount: sells.length,
        buyVolume,
        sellVolume,
        totalVolume,
        buyRatio,
        latestPrice,
        priceChange,
      };
    }, [raw.trades]);

    // Get last N trades for display
    const displayTrades = useMemo(() => {
      return (raw.trades || []).slice(0, maxTrades);
    }, [raw.trades, maxTrades]);

    // Calculate list height
    const listHeight = containerHeight 
      ? containerHeight - 140 
      : 240;

    return (
      <div 
        className="bg-card flex flex-col h-full"
        style={{
          width: containerWidth ?? "auto",
          minWidth: 320,
          maxWidth: containerWidth ?? 500,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-muted-foreground uppercase truncate">
              {raw.exchange}
            </span>
            <span className="text-xs text-muted-foreground/50">•</span>
            <span className="text-sm font-semibold truncate">{raw.market}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {stats.count} trades
            </span>
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-2 py-1.5 border-b border-border/50 bg-muted/30 shrink-0">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-emerald-500">
              Buy: {stats.buyCount} (${formatNumber(stats.buyVolume, 0)})
            </span>
            <span className="text-red-500">
              Sell: {stats.sellCount} (${formatNumber(stats.sellVolume, 0)})
            </span>
          </div>
          {/* Volume ratio bar */}
          <div className="h-1.5 bg-red-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${stats.buyRatio}%` }}
            />
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex items-center gap-2 px-2 py-1 text-[9px] text-muted-foreground border-b border-border/50 bg-muted/20 shrink-0">
          <span className="w-3" />
          <span className="w-20 text-right">Price</span>
          <span className="w-16 text-right">Amount</span>
          <span className="w-20 text-right">Total</span>
          <span className="flex-1 text-right">Time</span>
        </div>

        {/* Trades List - flexible height */}
        <div 
          className="overflow-y-auto flex-1"
          style={{ maxHeight: listHeight > 0 ? listHeight : 240 }}
        >
          {displayTrades.length > 0 ? (
            displayTrades.map((trade, index) => (
              <TradeRow key={`${trade.id}-${index}`} trade={trade} />
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground text-xs">
              No trades yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 p-2 border-t border-border/50 shrink-0">
          <span>
            Total: ${formatNumber(stats.totalVolume, 0)}
          </span>
          <span>Latency: {raw.latency}ms</span>
          <span>{formatRelativeTime(timestamp)}</span>
        </div>
      </div>
    );
  }
);

TradesWidget.displayName = "TradesWidget";

export default TradesWidget;
