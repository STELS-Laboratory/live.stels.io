/**
 * Multi-Symbol Watchlist Component
 * Displays realtime tickers for multiple trading pairs
 */

import { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Eye,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMultipleTickers } from "../hooks";
import { useWatchlistStore } from "../stores/watchlist.store";
import type { WatchlistItem } from "../types";

interface WatchlistProps {
  onSymbolSelect?: (symbol: string, exchange: string, market: string) => void;
  currentSymbol?: string;
}

export function Watchlist({ onSymbolSelect, currentSymbol }: WatchlistProps) {
  const {
    items,
    toggleFavorite,
    removeItem,
    reorderItems,
  } = useWatchlistStore();

  // Get realtime tickers for all watchlist items
  const tickers = useMultipleTickers(
    items.map((item) => ({
      symbol: item.symbol,
      exchange: item.exchange,
      market: item.market,
    })),
    { interval: 1000 }
  );

  // Sort items: favorites first, then by symbol
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return a.symbol.localeCompare(b.symbol);
    });
  }, [items]);

  // Handle symbol click
  const handleSymbolClick = useCallback(
    (item: WatchlistItem) => {
      if (onSymbolSelect) {
        onSymbolSelect(item.symbol, item.exchange, item.market);
      }
    },
    [onSymbolSelect]
  );

  // Format price
  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "—";
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(8);
  };

  // Format volume
  const formatVolume = (volume: number | undefined) => {
    if (volume === undefined) return "—";
    if (volume >= 1000000000) return (volume / 1000000000).toFixed(2) + "B";
    if (volume >= 1000000) return (volume / 1000000).toFixed(2) + "M";
    if (volume >= 1000) return (volume / 1000).toFixed(2) + "K";
    return volume.toFixed(2);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Watchlist
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {items.length} pairs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-4">
            <Eye className="h-8 w-8 mb-2 opacity-50" />
            <p>No items in watchlist</p>
            <p className="text-xs mt-1">Add symbols to track their prices</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y">
              {/* Header */}
              <div className="flex items-center px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                <div className="w-6" />
                <div className="flex-1 min-w-0">Symbol</div>
                <div className="w-24 text-right">Price</div>
                <div className="w-20 text-right">Change</div>
                <div className="w-20 text-right hidden sm:block">Volume</div>
                <div className="w-6" />
              </div>

              {/* Items */}
              {sortedItems.map((item) => {
                const ticker = tickers.get(item.symbol);
                const isSelected = currentSymbol === item.symbol;
                const isPositive = (ticker?.percentage ?? 0) >= 0;

                return (
                  <div
                    key={`${item.symbol}-${item.exchange}`}
                    className={cn(
                      "flex items-center px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer group",
                      isSelected && "bg-muted/70"
                    )}
                    onClick={() => handleSymbolClick(item)}
                  >
                    {/* Favorite Star */}
                    <button
                      className="w-6 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.symbol);
                      }}
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          item.isFavorite
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground/50 hover:text-yellow-500"
                        )}
                      />
                    </button>

                    {/* Symbol */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">
                          {item.symbol}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4 opacity-70"
                        >
                          {item.exchange}
                        </Badge>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="w-24 text-right">
                      <span className="font-mono text-sm">
                        ${formatPrice(ticker?.last)}
                      </span>
                    </div>

                    {/* Change */}
                    <div className="w-20 text-right">
                      <span
                        className={cn(
                          "flex items-center justify-end gap-0.5 text-xs font-medium",
                          isPositive ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {ticker ? (
                          <>
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {isPositive ? "+" : ""}
                            {ticker.percentage?.toFixed(2)}%
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>

                    {/* Volume */}
                    <div className="w-20 text-right hidden sm:block">
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatVolume(ticker?.quoteVolume)}
                      </span>
                    </div>

                    {/* Remove Button */}
                    <button
                      className="w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.symbol);
                      }}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Add Watchlist Item Component
interface AddWatchlistItemProps {
  onAdd: (item: Omit<WatchlistItem, "isFavorite">) => void;
}

export function AddWatchlistItem({ onAdd }: AddWatchlistItemProps) {
  // Predefined popular pairs
  const popularPairs = [
    { symbol: "BTC/USDT", exchange: "bybit", market: "spot" },
    { symbol: "ETH/USDT", exchange: "bybit", market: "spot" },
    { symbol: "SOL/USDT", exchange: "bybit", market: "spot" },
    { symbol: "BNB/USDT", exchange: "bybit", market: "spot" },
    { symbol: "XRP/USDT", exchange: "bybit", market: "spot" },
    { symbol: "DOGE/USDT", exchange: "bybit", market: "spot" },
    { symbol: "ADA/USDT", exchange: "bybit", market: "spot" },
    { symbol: "AVAX/USDT", exchange: "bybit", market: "spot" },
  ];

  return (
    <div className="p-2 space-y-2">
      <p className="text-xs text-muted-foreground px-1">Popular pairs</p>
      <div className="flex flex-wrap gap-1">
        {popularPairs.map((pair) => (
          <Button
            key={pair.symbol}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onAdd(pair)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {pair.symbol}
          </Button>
        ))}
      </div>
    </div>
  );
}
